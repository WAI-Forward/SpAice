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
      return false;
    }

    const score = Math.max(1, Math.round(finiteOr(stats.score, stats.maxMass || 1)));
    const mode = isPartySessionActive() ? "multiplayer" : "singleplayer";
    const deathKey = [player.id, mode, score, stats.survived, stats.cause, Math.floor(lifeStats.startedAt)].join("|");
    if (leaderboard.submittedDeathKey === deathKey) {
      return true;
    }

    const cleanName = sanitizePlayerName(runName) || sanitizePlayerName(player.name) || "Player";
    leaderboard.submitInFlight = true;
    leaderboard.submittedDeathKey = deathKey;
    try {
      const data = await fetchPersistentJson("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          name: cleanName,
          mode,
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
        })
      });
      leaderboard.entries = Array.isArray(data.entries) ? data.entries.map(normalizeLeaderboardEntry).filter(Boolean) : leaderboard.entries;
      leaderboard.lastRefreshAt = performance.now();
      leaderboard.statusMessage = "";
      if (leaderboard.filters && (leaderboard.filters.mode !== "all" || leaderboard.filters.difficulty !== "all")) {
        void refreshLeaderboard(true);
      }
      if (leaderboard.open) {
        renderLeaderboard();
      }
      deathState.leaderboardSubmitted = true;
      await submitCrazyGamesLeaderboardScore(score, deathKey, "death-run-save");
      submitGamePixLeaderboardScore(score, deathKey, "death-run-save");
      return true;
    } catch (error) {
      leaderboard.statusMessage = backendErrorMessage(error, "Could not save this run.");
      console.warn("Clusternauts leaderboard submit failed.", error);
      leaderboard.submittedDeathKey = "";
      return false;
    } finally {
      leaderboard.submitInFlight = false;
    }
  }

  async function submitCrazyGamesLeaderboardScore(score, submissionKey, reason) {
    if (!isCrazyGamesRuntime()) {
      return false;
    }

    const cleanScore = Math.max(1, Math.round(finiteOr(score, 1)));
    const cleanSubmissionKey = String(submissionKey || cleanScore || "").trim();
    if (cleanSubmissionKey && leaderboard.submittedCrazyGamesKey === cleanSubmissionKey) {
      return true;
    }

    try {
      await initializeCrazyGamesIntegration();
      await handleCrazyGamesAuthChange("leaderboard-" + (reason || "submit"));
    } catch (error) {
      console.warn("CrazyGames leaderboard auth refresh failed.", { reason, error });
    }

    if (!isCrazyGamesUserSignedIn()) {
      return false;
    }

    const userModule = crazyGamesUserModule();
    if (!userModule || typeof userModule.submitScore !== "function") {
      console.warn("CrazyGames leaderboard score submit unavailable.", { reason });
      return false;
    }

    try {
      await Promise.resolve(userModule.submitScore({ score: cleanScore }));
      if (cleanSubmissionKey) {
        leaderboard.submittedCrazyGamesKey = cleanSubmissionKey;
      }
      return true;
    } catch (error) {
      console.warn("CrazyGames leaderboard score submit failed.", { reason, score: cleanScore, error });
      return false;
    }
  }

  function submitGamePixLeaderboardScore(score, submissionKey, reason) {
    if (!isGamePixRuntime()) {
      return false;
    }

    const cleanScore = Math.max(1, Math.round(finiteOr(score, 1)));
    const cleanSubmissionKey = String(submissionKey || cleanScore || "").trim();
    if (cleanSubmissionKey && gamePixState.submittedScoreKey === cleanSubmissionKey) {
      return true;
    }

    updateGamePixScore(cleanScore, reason || "leaderboard-submit");
    if (cleanSubmissionKey) {
      gamePixState.submittedScoreKey = cleanSubmissionKey;
    }
    return true;
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
      structures: structures.length,
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
      ["Structures", stats.structures],
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
    if (deathLeaderboardForm) {
      deathLeaderboardForm.hidden = false;
    }
    if (deathRunNameInput) {
      deathRunNameInput.disabled = false;
      deathRunNameInput.value = sanitizePlayerName(player.name) || "Player";
    }
    if (deathLeaderboardButton) {
      deathLeaderboardButton.disabled = false;
      deathLeaderboardButton.textContent = "Save run";
      deathLeaderboardButton.classList.remove("is-loading", "is-saved");
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = "";
    }
    if (playAgainButton) {
      playAgainButton.disabled = false;
      playAgainButton.textContent = multiplayerDeath ? "Respawn" : "Play again";
      playAgainButton.classList.remove("is-loading");
    }
    if (deathMainMenuButton) {
      deathMainMenuButton.disabled = false;
      deathMainMenuButton.textContent = "Exit to main menu";
      deathMainMenuButton.classList.remove("is-loading");
    }
  }

  async function saveDeathLeaderboardRun() {
    if (!deathState.stats || deathState.resetInFlight) {
      return;
    }
    if (deathState.leaderboardSubmitted) {
      if (deathLeaderboardStatus) {
        deathLeaderboardStatus.textContent = "Saved to leaderboard.";
      }
      return;
    }

    if (deathLeaderboardButton) {
      deathLeaderboardButton.disabled = true;
      deathLeaderboardButton.textContent = "Saving...";
      deathLeaderboardButton.classList.add("is-loading");
      deathLeaderboardButton.classList.remove("is-saved");
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = "";
    }

    const ok = await submitDeathLeaderboardScore(deathState.stats, deathRunNameInput && deathRunNameInput.value);
    if (ok) {
      if (deathRunNameInput) {
        deathRunNameInput.disabled = true;
      }
      if (deathLeaderboardButton) {
        deathLeaderboardButton.textContent = "Saved";
        deathLeaderboardButton.classList.remove("is-loading");
        deathLeaderboardButton.classList.add("is-saved");
      }
      if (deathLeaderboardStatus) {
        deathLeaderboardStatus.textContent = "Saved to leaderboard.";
      }
      return;
    }

    if (deathLeaderboardButton) {
      deathLeaderboardButton.disabled = false;
      deathLeaderboardButton.textContent = "Save run";
      deathLeaderboardButton.classList.remove("is-loading", "is-saved");
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = leaderboard.statusMessage || "Could not save this run.";
    }
  }
