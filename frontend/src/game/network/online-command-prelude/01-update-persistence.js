  function updatePersistence(dt) {
    if (!persistence.enabled || persistence.resetInFlight || deathState.active || !runState.active) {
      return;
    }
    if (isPartySessionActive() && !isPartyHost()) {
      return;
    }

    persistence.saveTimer -= dt;
    persistence.pollTimer -= dt;

    if (persistence.saveTimer <= 0 && !persistence.saveInFlight) {
      persistence.saveTimer = persistenceSaveInterval;
      void savePersistentState({ includeWorld: true });
    }

    if (document.visibilityState === "hidden" && persistence.pollTimer <= 0 && !persistence.loadInFlight && !persistence.saveInFlight) {
      persistence.pollTimer = persistencePollInterval;
      void pollPersistentState();
    }
  }

  function applyMultiplayerProfile(profile) {
    if (!profile || typeof profile !== "object") {
      return;
    }

    multiplayer.profile = profile;
    multiplayer.universeId = profile.universeId || multiplayer.universeId || ("solo:" + player.id);
    player.name = profile.publicName || player.name;
    updatePublicNameValue();
  }

  function updateOnlineUi() {
    if (onlineCount) {
      onlineCount.textContent = String(multiplayer.onlineCount || 0);
    }
    if (onlineToggle) {
      onlineToggle.classList.toggle("is-active", multiplayer.panelOpen && multiplayer.socialMode === "online");
    }
  }

  function setSocialPanelOpen(open, mode) {
    multiplayer.panelOpen = Boolean(open);
    if (mode) {
      multiplayer.socialMode = mode;
    }
    if (socialPanel) {
      socialPanel.classList.toggle("is-open", multiplayer.panelOpen);
      socialPanel.setAttribute("aria-hidden", multiplayer.panelOpen ? "false" : "true");
    }
    updatePublicNameValue();
    updateOnlineUi();

    if (multiplayer.panelOpen) {
      void refreshPlayerSearch();
    }
    updateTouchScreenUi();
  }

  function openRelayContacts() {
    setSocialPanelOpen(true, "relay");
  }

  async function refreshPlayerSearch() {
    if (!window.fetch || !playerSearchList) {
      return;
    }

    ensureOnlinePresence();
    const query = playerSearch ? playerSearch.value : "";
    const friendsOnly = friendsOnlyFilter && friendsOnlyFilter.checked;
    const relayOnly = false;

    try {
      const url =
        "/api/players/search?playerId=" +
        encodeURIComponent(player.id) +
        "&q=" +
        encodeURIComponent(query || "") +
        "&friendsOnly=" +
        (friendsOnly ? "true" : "false") +
        "&relayOnly=" +
        (relayOnly ? "true" : "false");
      const data = await fetchPersistentJson(url);
      if (data && data.ok) {
        multiplayer.players = Array.isArray(data.players) ? data.players : [];
        renderPlayerSearch();
      }
    } catch (error) {
      renderPlayerSearch(backendErrorMessage(error, "Search unavailable."));
    }
  }

  function renderPlayerSearch(message) {
    if (!playerSearchList) {
      return;
    }

    playerSearchList.textContent = "";
    const players = multiplayer.players || [];

    if (message || !players.length) {
      const empty = document.createElement("div");
      empty.className = "social-row__empty";
      empty.textContent = message || "No signals found.";
      playerSearchList.append(empty);
      return;
    }

    for (const candidate of players) {
      const row = document.createElement("div");
      const main = document.createElement("div");
      const name = document.createElement("strong");
      const status = document.createElement("span");
      const actions = [];
      const hasRelay = true;

      row.className = "social-row";
      main.className = "social-row__main";
      name.className = "social-row__name";
      status.className = "social-row__status";
      name.textContent = candidate.publicName || candidate.playerId;
      if (multiplayer.socialMode === "relay") {
        status.textContent = !multiplayer.friendJoinsEnabled
          ? "Multiplayer Off"
          : candidate.friend
          ? "Friend online"
          : "Online";
      } else {
        status.textContent = candidate.online
          ? candidate.friend
            ? "Friend online"
            : "Online"
          : candidate.friend
          ? "Friend offline"
          : "Offline";
      }

      if (multiplayer.socialMode === "relay") {
        const action = document.createElement("button");
        action.type = "button";
        action.dataset.playerId = candidate.playerId;
        action.dataset.action = "invite";
        action.textContent = candidate.friend ? "Invite" : "Link";
        action.title = candidate.friend ? "Invite friend" : "Link as friends";
        action.disabled = !multiplayer.friendJoinsEnabled || !candidate.online || !hasRelay;
        actions.push(action);
      }

      if (isSharedPublicWorldActive() && (candidate.sharedWorld || candidate.worldMode === "shared-public") && candidate.online && candidate.playerId !== player.id) {
        const teamAction = document.createElement("button");
        teamAction.type = "button";
        teamAction.dataset.playerId = candidate.playerId;
        teamAction.dataset.action = "team";
        teamAction.textContent = "Team Up";
        teamAction.title = "Offer to team up";
        teamAction.disabled = !multiplayer.connected;
        actions.push(teamAction);
      }

      main.append(name, status);
      row.append(main);
      for (const action of actions) {
        row.append(action);
      }
      playerSearchList.append(row);
    }
  }

  function largestMassInWorld(world) {
    const particlesSource = world && Array.isArray(world.particles) ? world.particles : [];
    return particlesSource.reduce((best, particle) => Math.max(best, finiteOr(particle && particle.mass, 0)), 0);
  }

  function normalizeLeaderboardEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const score = Math.max(1, Math.round(finiteOr(entry.score || entry.maxMass, 1)));
    const mode = normalizeLeaderboardMode(entry.mode, "singleplayer");
    return {
      id: String(entry.id || entry.playerId || "score"),
      playerId: String(entry.playerId || ""),
      name: sanitizePlayerName(entry.name) || "Player",
      mode,
      score,
      difficulty: difficultyDefinitions[entry.difficulty] ? entry.difficulty : defaultDifficultyId,
      bodyScore: Math.max(0, Math.round(finiteOr(entry.bodyScore, 0))),
      mobScore: Math.max(0, Math.round(finiteOr(entry.mobScore, 0))),
      maxTier: String(entry.maxTier || "particle"),
      survived: String(entry.survived || ""),
      cause: String(entry.cause || ""),
      createdAt: finiteOr(entry.createdAt, 0),
      local: entry.playerId === player.id
    };
  }

  function localLeaderboardScore() {
    updateLifeStats();
    return Math.max(1, Math.round(lifeStats.bestScore || lifeStats.currentScore));
  }

  function normalizeLeaderboardMode(mode, fallback) {
    const value = String(mode || fallback || "singleplayer").toLowerCase();
    return value === "multiplayer" ? "multiplayer" : "singleplayer";
  }

  function normalizeLeaderboardModeFilter(mode) {
    const value = String(mode || "all").toLowerCase();
    return value === "singleplayer" || value === "multiplayer" ? value : "all";
  }

  function normalizeLeaderboardDifficultyFilter(difficulty) {
    const value = String(difficulty || "all").toLowerCase();
    return difficultyDefinitions[value] ? value : "all";
  }

  function leaderboardEntryMatchesFilters(entry) {
    const filters = leaderboard.filters || {};
    const modeFilter = normalizeLeaderboardModeFilter(filters.mode);
    const difficultyFilter = normalizeLeaderboardDifficultyFilter(filters.difficulty);

    if (modeFilter !== "all" && normalizeLeaderboardMode(entry.mode, "singleplayer") !== modeFilter) {
      return false;
    }
    if (difficultyFilter !== "all" && entry.difficulty !== difficultyFilter) {
      return false;
    }
    return true;
  }

  function collectLeaderboardEntries() {
    const entries = leaderboard.entries.map((entry) => ({
      ...entry,
      local: entry.playerId === player.id
    })).filter(leaderboardEntryMatchesFilters);
    const liveEntries = [];
    const liveMode = isPartySessionActive() ? "multiplayer" : "singleplayer";

    if (!deathState.active) {
      liveEntries.push({
        id: (player.id || "local-player") + ":live",
        playerId: player.id || "local-player",
        name: player.name || "Player",
        mode: liveMode,
        score: localLeaderboardScore(),
        difficulty: runState.difficultyId,
        local: true,
        live: true
      });
    }
    const seenLivePlayers = new Set([player.id]);

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!remote || !remote.playerId || seenLivePlayers.has(remote.playerId)) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const remotePlayer = snapshot && snapshot.player ? snapshot.player : null;
      const remoteDifficulty = remotePlayer && difficultyDefinitions[remotePlayer.difficulty] ? remotePlayer.difficulty : defaultDifficultyId;
      const fallbackScore = largestMassInWorld(snapshot && snapshot.world) * difficultyDefinition(remoteDifficulty).bodyScoreMultiplier;
      const score = Math.max(1, Math.round(finiteOr(remotePlayer && remotePlayer.score, fallbackScore)));
      seenLivePlayers.add(remote.playerId);
      liveEntries.push({
        id: remote.playerId + ":live",
        playerId: remote.playerId,
        name: remote.publicName || (remotePlayer && remotePlayer.name) || "Contact",
        mode: "multiplayer",
        score,
        difficulty: remoteDifficulty,
        local: false,
        live: true
      });
    }

    entries.push(...liveEntries.filter(leaderboardEntryMatchesFilters));
    return entries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.live !== b.live) {
        return a.live ? 1 : -1;
      }
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function appendLeaderboardStatus(target, message) {
    const status = document.createElement("div");
    status.className = "leaderboard-row";
    status.textContent = message;
    target.append(status);
  }

  function renderLeaderboardList(target, entries) {
    if (!target) {
      return;
    }

    target.textContent = "";
    if (leaderboard.statusMessage) {
      appendLeaderboardStatus(target, leaderboard.statusMessage);
    }
    if (!entries.length && !leaderboard.statusMessage) {
      appendLeaderboardStatus(target, leaderboard.refreshInFlight ? "Loading leaderboard..." : "No scores yet.");
    }
    entries.forEach((entry, index) => {
      const row = document.createElement("div");
      const rank = document.createElement("span");
      const name = document.createElement("strong");
      const score = document.createElement("span");

      row.className = "leaderboard-row";
      row.classList.toggle("is-local", entry.local);
      rank.className = "leaderboard-row__rank";
      name.className = "leaderboard-row__name";
      score.className = "leaderboard-row__score";

      rank.textContent = "#" + (index + 1);
      name.textContent = entry.name + " [" + (entry.mode === "multiplayer" ? "MP" : "SP") + " " + difficultyLabel(entry.difficulty) + "]" + (entry.local ? " (you)" : "") + (entry.live ? " current" : "");
      score.textContent = entry.score + " pts";

      row.append(rank, name, score);
      target.append(row);
    });
  }

  function renderLeaderboard() {
    syncLeaderboardFilters();
    const entries = collectLeaderboardEntries();
    renderLeaderboardList(leaderboardList, entries);
    renderLeaderboardList(menuLeaderboardList, entries);
  }

  function syncLeaderboardFilters() {
    const filters = leaderboard.filters || { mode: "all", difficulty: "all" };
    const controls = [
      [leaderboardModeFilter, filters.mode],
      [menuLeaderboardModeFilter, filters.mode],
      [leaderboardDifficultyFilter, filters.difficulty],
      [menuLeaderboardDifficultyFilter, filters.difficulty]
    ];

    for (const control of controls) {
      if (control[0] && control[0].value !== control[1]) {
        control[0].value = control[1];
      }
    }
  }

  function setLeaderboardFilters(mode, difficulty) {
    const nextMode = normalizeLeaderboardModeFilter(mode);
    const nextDifficulty = normalizeLeaderboardDifficultyFilter(difficulty);
    const current = leaderboard.filters || { mode: "all", difficulty: "all" };
    if (current.mode === nextMode && current.difficulty === nextDifficulty) {
      return;
    }

    leaderboard.filters = {
      mode: nextMode,
      difficulty: nextDifficulty
    };
    leaderboard.lastRefreshAt = 0;
    renderLeaderboard();
    void refreshLeaderboard(true);
  }

  function setLeaderboardOpen(open) {
    leaderboard.open = Boolean(open);
    if (leaderboardPanel) {
      leaderboardPanel.classList.toggle("is-open", leaderboard.open);
      leaderboardPanel.setAttribute("aria-hidden", leaderboard.open ? "false" : "true");
    }
    if (leaderboardToggle) {
      leaderboardToggle.classList.toggle("is-active", leaderboard.open);
      leaderboardToggle.setAttribute("aria-expanded", leaderboard.open ? "true" : "false");
    }
    if (leaderboard.open) {
      renderLeaderboard();
      void refreshLeaderboard(false);
    }
    updateTouchScreenUi();
  }

  function inviteFriend(targetPlayerId) {
    if (!targetPlayerId) {
      return;
    }
    if (!multiplayer.friendJoinsEnabled) {
      maybeNotifyText("Multiplayer Off");
      return;
    }

    sendMultiplayer({
      type: "friend.invite",
      targetPlayerId
    });
  }

  function focusCommandInput() {
    if (!commandInput) {
      return;
    }

    commandInput.focus({ preventScroll: true });
    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
  }

  function setCommandLockedState(locked) {
    multiplayer.commandUnlocked = !locked;
    if (!commandInput) {
      return;
    }

    commandInput.type = locked ? "password" : "text";
    commandInput.placeholder = locked ? "Password" : "/tp player";
    commandInput.value = locked ? "" : "/";
    multiplayer.commandCompletions = [];
    multiplayer.commandCompletionIndex = 0;
    updateCommandHint();
    focusCommandInput();
  }

  function setCommandOpen(open) {
    multiplayer.commandOpen = Boolean(open);
    if (commandPanel) {
      commandPanel.classList.toggle("is-open", multiplayer.commandOpen);
      commandPanel.setAttribute("aria-hidden", multiplayer.commandOpen ? "false" : "true");
    }
    updateTouchScreenUi();

    if (!commandInput) {
      return;
    }

    if (multiplayer.commandOpen) {
      setCommandLockedState(!multiplayer.commandUnlocked);
      void refreshPlayerSearch();
      focusCommandInput();
      window.requestAnimationFrame(focusCommandInput);
      window.setTimeout(function () {
        focusCommandInput();
      }, 0);
    } else {
      commandInput.blur();
      commandInput.type = multiplayer.commandUnlocked ? "text" : "password";
      commandInput.value = "";
      multiplayer.commandCompletions = [];
      multiplayer.commandCompletionIndex = 0;
    }
  }

