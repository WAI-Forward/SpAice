  async function fetchPersistentJson(url, options) {
    const controller = new AbortController();
    const requestOptions = Object.assign({}, options || {});
    const timeoutMs = Math.max(500, finiteOr(requestOptions.timeoutMs, 2500));
    delete requestOptions.timeoutMs;
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs);
    const requestUrl = apiUrl(url);

    try {
      let response;
      try {
        response = await fetch(requestUrl, Object.assign(withBackendRequestOptions(requestOptions), { signal: controller.signal }));
      } catch (error) {
        throw createServerMaintenanceError(error);
      }

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw createServerMaintenanceError(response.status);
        }
        let detail = "";
        try {
          const errorBody = await response.json();
          detail = errorBody && errorBody.message ? ": " + errorBody.message : "";
        } catch {
          detail = "";
        }
        const requestError = new Error("Request failed " + response.status + detail);
        requestError.status = response.status;
        requestError.requestPath = String(url || "");
        requestError.requestUrl = requestUrl;
        throw requestError;
      }

      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function refreshLeaderboard(force) {
    if (!window.fetch || leaderboard.refreshInFlight) {
      return;
    }

    const now = performance.now();
    if (!force && now - leaderboard.lastRefreshAt < 5000) {
      return;
    }

    leaderboard.refreshInFlight = true;
    try {
      const params = new URLSearchParams({ limit: "40" });
      const filters = leaderboard.filters || {};
      if (filters.gameMode && filters.gameMode !== "all") {
        params.set("gameMode", filters.gameMode);
      }
      if (filters.mode && filters.mode !== "all") {
        params.set("mode", filters.mode);
      }
      if (filters.difficulty && filters.difficulty !== "all") {
        params.set("difficulty", filters.difficulty);
      }
      const data = await fetchPersistentJson("/api/leaderboard?" + params.toString());
      leaderboard.entries = Array.isArray(data.entries) ? data.entries.map(normalizeLeaderboardEntry).filter(Boolean) : [];
      leaderboard.lastRefreshAt = now;
      leaderboard.statusMessage = "";
      if (leaderboard.open) {
        renderLeaderboard();
      }
    } catch (error) {
      leaderboard.statusMessage = backendErrorMessage(error, "Leaderboard unavailable.");
      if (leaderboard.open) {
        renderLeaderboard();
      }
      console.warn("Clusternauts leaderboard unavailable.", error);
    } finally {
      leaderboard.refreshInFlight = false;
    }
  }

  async function submitDeathLeaderboardScore(stats, runName) {
    if (!window.fetch || !stats || leaderboard.submitInFlight) {
      return null;
    }

    const score = Math.max(1, Math.round(finiteOr(stats.score, stats.maxMass || 1)));
    const mode = isPartySessionActive() ? "multiplayer" : "singleplayer";
    const gameMode = normalizeGameMode(stats.gameMode || runState.gameMode);
    const deathKey = [player.id, gameMode, mode, score, stats.survived, stats.cause, Math.floor(lifeStats.startedAt)].join("|");
    if (leaderboard.submittedDeathKey === deathKey) {
      return leaderboard.entries.find((entry) => entry.id === deathState.leaderboardEntryId) || null;
    }

    const cleanName = sanitizePlayerName(runName) || sanitizePlayerName(player.name) || "Player";
    leaderboard.submitInFlight = true;
    leaderboard.submittedDeathKey = deathKey;
    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deathState.leaderboardEntryId,
          createdAt: deathState.leaderboardCreatedAt,
          playerId: player.id,
          name: cleanName,
          mode,
          gameMode,
          score,
          difficulty: stats.difficulty,
          bodyScore: stats.bodyScore,
          mobScore: stats.mobScore,
          ownedMass: stats.ownedMass,
          ownedBodies: stats.ownedBodies,
          maxMass: stats.maxMass,
          maxTier: stats.maxTier,
          survived: stats.survived,
          cause: stats.cause
        }),
        timeoutMs: 8000
      };
      const data = await submitDeathLeaderboardRequest(requestOptions);
      const savedEntry = normalizeLeaderboardEntry(data.entry);
      leaderboard.entries = Array.isArray(data.entries) ? data.entries.map(normalizeLeaderboardEntry).filter(Boolean) : leaderboard.entries;
      leaderboard.lastRefreshAt = performance.now();
      leaderboard.statusMessage = "";
      if (leaderboard.filters && (leaderboard.filters.gameMode !== "all" || leaderboard.filters.mode !== "all" || leaderboard.filters.difficulty !== "all")) {
        void refreshLeaderboard(true);
      }
      if (leaderboard.open) {
        renderLeaderboard();
      }
      deathState.leaderboardSubmitted = true;
      await submitCrazyGamesLeaderboardScore(score, deathKey, "death-run-save");
      submitGamePixLeaderboardScore(score, deathKey, "death-run-save");
      return savedEntry;
    } catch (error) {
      leaderboard.statusMessage = backendErrorMessage(error, "Could not save this run.");
      console.warn("Clusternauts leaderboard submit failed.", error);
      leaderboard.submittedDeathKey = "";
      return null;
    } finally {
      leaderboard.submitInFlight = false;
    }
  }

  function connectedScoredBodyIds() {
    const ids = new Set();

    if (player.landed && bodyById(player.landed.bodyId)) {
      ids.add(player.landed.bodyId);
    }

    for (const structure of structures) {
      const ownerPlayerId = String(structure && structure.ownerPlayerId || "");
      if (!structure || structure.health <= 0 || (ownerPlayerId && ownerPlayerId !== String(player.id || ""))) {
        continue;
      }
      if (structure.bodyId && bodyById(structure.bodyId)) {
        ids.add(structure.bodyId);
      }
      if (structure.linkedBodyId && bodyById(structure.linkedBodyId)) {
        ids.add(structure.linkedBodyId);
      }
    }

    if (!ids.size) {
      const progressBody = findNearestProgressBody();
      if (progressBody) {
        ids.add(progressBody.id);
      }
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const structure of structures) {
        const ownerPlayerId = String(structure && structure.ownerPlayerId || "");
        if (!structure || (ownerPlayerId && ownerPlayerId !== String(player.id || "")) || !isLinkedStructureType(structure.type) || structure.health <= 0 || !structure.bodyId || !structure.linkedBodyId) {
          continue;
        }
        const firstKnown = ids.has(structure.bodyId);
        const secondKnown = ids.has(structure.linkedBodyId);
        if (firstKnown && !secondKnown && bodyById(structure.linkedBodyId)) {
          ids.add(structure.linkedBodyId);
          changed = true;
        } else if (secondKnown && !firstKnown && bodyById(structure.bodyId)) {
          ids.add(structure.bodyId);
          changed = true;
        }
      }
    }

    return ids;
  }

  function collectBodyScoreSnapshot() {
    const ids = connectedScoredBodyIds();
    let mass = 0;

    for (const id of ids) {
      const body = bodyById(id);
      if (body) {
        mass += Math.max(0, finiteOr(body.mass, 0));
      }
    }

    return {
      bodyCount: ids.size,
      mass,
      bodyScore: Math.round(mass * activeDifficulty().bodyScoreMultiplier)
    };
  }

  function scoreMobKill(kind) {
    const base = mobScoreValues[kind] || mobScoreValues.alienoid;
    return Math.max(1, Math.round(base * activeDifficulty().mobScoreMultiplier));
  }

  function updateLifeStats() {
    for (const particle of particles) {
      if (particle.mass > lifeStats.maxMass) {
        lifeStats.maxMass = particle.mass;
        lifeStats.maxTierName = particle.tier ? particle.tier.name : tierForMass(particle.mass).name;
      }
    }

    const bodyScore = collectBodyScoreSnapshot();
    lifeStats.scoredBodyMass = bodyScore.mass;
    lifeStats.scoredBodies = bodyScore.bodyCount;
    lifeStats.bodyScore = bodyScore.bodyScore;
    lifeStats.currentScore = Math.max(1, Math.round(bodyScore.bodyScore + lifeStats.mobScore));
    updateGamePixScore(lifeStats.currentScore, "life-stats");

    if (lifeStats.currentScore > lifeStats.bestScore) {
      lifeStats.bestScore = lifeStats.currentScore;
      lifeStats.bestBodyScore = lifeStats.bodyScore;
      lifeStats.bestScoredBodyMass = lifeStats.scoredBodyMass;
      lifeStats.bestScoredBodies = lifeStats.scoredBodies;
    }

    updateGamePixLevel(lifeStats.maxTierName || (bodyTiers[0] && bodyTiers[0].name), "life-stats");
  }

  function formatLifeDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return minutes + ":" + String(remainingSeconds).padStart(2, "0");
  }

  function collectDeathStats() {
    updateLifeStats();
    const structuresBuilt = Object.values(objectiveState.builtStructures || {}).reduce(function (total, count) {
      return total + Math.max(0, Math.floor(finiteOr(count, 0)));
    }, 0);
    return {
      score: Math.round(lifeStats.bestScore),
      difficulty: runState.difficultyId,
      gameMode: normalizeGameMode(runState.gameMode),
      survived: formatLifeDuration((performance.now() - lifeStats.startedAt) / 1000),
      maxMass: Math.round(lifeStats.maxMass),
      maxTier: lifeStats.maxTierName,
      ownedMass: Math.round(lifeStats.bestScoredBodyMass),
      ownedBodies: lifeStats.bestScoredBodies,
      bodyScore: Math.round(lifeStats.bestBodyScore),
      mobScore: Math.round(lifeStats.mobScore),
      mobsDefeated: lifeStats.mobsDefeated,
      techCollected: lifeStats.techCollected,
      structures: structuresBuilt,
      tools: unlockedToolIds.length,
      cause: deathState.cause
    };
  }

  function setDeathScreenOpen(open) {
    if (!deathScreen) {
      return;
    }

    deathScreen.classList.toggle("is-open", Boolean(open));
    deathScreen.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      resetMouseButtons();
    }
    updateTouchScreenUi();
  }

  function renderDeathStats() {
    if (!deathStatsList || !deathState.stats) {
      return;
    }

    const stats = deathState.stats;
    const items = [
      ["Total score", stats.score + " pts"],
      ["Difficulty", difficultyLabel(stats.difficulty)],
      ["Owned bodies", stats.ownedBodies + " / " + stats.ownedMass + "g"],
      ["Body points", stats.bodyScore],
      ["Mob points", stats.mobScore],
      ["Survived", stats.survived],
      ["Best body", formatTierName(stats.maxTier) + " / " + stats.maxMass + "g"],
      ["Mobs defeated", stats.mobsDefeated],
      ["Tech collected", stats.techCollected],
      ["Structures built", stats.structures],
      ["Tools", stats.tools],
      ["Final blow", stats.cause]
    ];

    deathStatsList.textContent = "";
    for (const item of items) {
      const wrapper = document.createElement("div");
      const label = document.createElement("dt");
      const value = document.createElement("dd");
      wrapper.className = "death-screen__stat";
      label.textContent = item[0];
      value.textContent = String(item[1]);
      wrapper.append(label, value);
      deathStatsList.append(wrapper);
    }
  }

  function resetDeathLeaderboardForm() {
    const multiplayerDeath = isPartySessionActive();
    if (deathState.stats && !deathState.leaderboardEntryId) {
      deathState.leaderboardEntryId = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "run-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
      deathState.leaderboardCreatedAt = Date.now();
    }
    if (deathLeaderboardForm) {
      deathLeaderboardForm.hidden = false;
    }
    if (deathRunNameInput) {
      deathRunNameInput.value = sanitizePlayerName(player.name) || "Player";
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = deathState.stats ? "Saving to leaderboard..." : "";
    }
    if (playAgainButton) {
      playAgainButton.disabled = false;
      playAgainButton.textContent = multiplayerDeath ? "Respawn" : "Restart run";
      playAgainButton.classList.remove("is-loading");
    }
    if (deathMainMenuButton) {
      deathMainMenuButton.disabled = false;
      deathMainMenuButton.textContent = "Exit to main menu";
      deathMainMenuButton.classList.remove("is-loading");
    }
  }

  async function saveDeathLeaderboardRun() {
    if (!deathState.stats) {
      return false;
    }
    if (deathState.leaderboardSubmitted) {
      return true;
    }
    if (deathState.leaderboardSavePromise) {
      return deathState.leaderboardSavePromise;
    }

    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = "Saving to leaderboard...";
    }

    const runName = sanitizePlayerName(deathRunNameInput && deathRunNameInput.value) || sanitizePlayerName(player.name) || "Player";
    deathState.leaderboardSavePromise = (async function () {
      const savedEntry = await submitDeathLeaderboardScore(deathState.stats, runName);
      if (savedEntry) {
        deathState.leaderboardEntryId = savedEntry.id;
        deathState.leaderboardName = savedEntry.name;
        if (deathLeaderboardStatus) {
          deathLeaderboardStatus.textContent = "Saved automatically. Edit the name to rename this run.";
        }
        return true;
      }

      if (deathLeaderboardStatus) {
        deathLeaderboardStatus.textContent = leaderboard.statusMessage || "Could not save this run.";
      }
      return false;
    })();

    try {
      return await deathState.leaderboardSavePromise;
    } finally {
      deathState.leaderboardSavePromise = null;
    }
  }

  async function renameDeathLeaderboardRun() {
    if (!deathState.stats || !deathRunNameInput) {
      return false;
    }
    while (deathState.leaderboardRenamePromise) {
      await deathState.leaderboardRenamePromise;
      if (!deathState.stats) {
        return false;
      }
    }

    const cleanName = sanitizePlayerName(deathRunNameInput.value) || sanitizePlayerName(player.name) || "Player";
    deathRunNameInput.value = cleanName;
    const renamePromise = (async function () {
      const saved = await saveDeathLeaderboardRun();
      if (!saved || !deathState.leaderboardEntryId) {
        return false;
      }
      if (cleanName === deathState.leaderboardName) {
        return true;
      }

      if (deathLeaderboardStatus) {
        deathLeaderboardStatus.textContent = "Updating run name...";
      }

      try {
        const data = await fetchPersistentJson("/api/leaderboard/" + encodeURIComponent(deathState.leaderboardEntryId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player.id,
            name: cleanName
          })
        });
        const renamedEntry = normalizeLeaderboardEntry(data.entry);
        leaderboard.entries = Array.isArray(data.entries)
          ? data.entries.map(normalizeLeaderboardEntry).filter(Boolean)
          : leaderboard.entries.map((entry) => entry.id === renamedEntry.id ? renamedEntry : entry);
        deathState.leaderboardName = renamedEntry.name;
        leaderboard.lastRefreshAt = performance.now();
        if (leaderboard.open) {
          renderLeaderboard();
        }
        if (deathLeaderboardStatus) {
          deathLeaderboardStatus.textContent = "Run name updated.";
        }
        return true;
      } catch (error) {
        leaderboard.statusMessage = backendErrorMessage(error, "Could not update the run name.");
        if (deathLeaderboardStatus) {
          deathLeaderboardStatus.textContent = leaderboard.statusMessage;
        }
        console.warn("Clusternauts leaderboard rename failed.", error);
        return false;
      }
    })();
    deathState.leaderboardRenamePromise = renamePromise;

    try {
      return await renamePromise;
    } finally {
      if (deathState.leaderboardRenamePromise === renamePromise) {
        deathState.leaderboardRenamePromise = null;
      }
    }
  }
