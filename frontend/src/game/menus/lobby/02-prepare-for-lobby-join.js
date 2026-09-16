  function prepareForLobbyJoin() {
    if (!runState.active && isDifficultyScreenOpen()) {
      return;
    }

    resetSoloMultiplayerSession();
    runState.active = false;
    gamePaused = false;
    resetDeathState();
    setSettingsOpen(false);
    setDifficultyScreenOpen(true);
    resetMouseButtons();
    resetFrameClock();
    updateHud();
  }

  function joinLobby(code) {
    const cleanCode = sanitizeLobbyCode(code);
    if (!cleanCode) {
      setLobbyStatus("Enter a lobby code.", "error");
      setStartMenuView("multiplayer-horde", { push: false });
      return;
    }
    prepareForLobbyJoin();
    setFriendJoinsEnabled(true, "lobby-join", { persist: true, notify: false, startRun: false });
    clearCurrentAccountSave();
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = cleanCode;
    multiplayer.sharedWorldJoinPending = false;
    multiplayer.lobbyGameMode = "horde";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    multiplayer.lobbyRequestStartedAt = performance.now();
    setLobbyStatus("Joining lobby...", "");
    setStartMenuView("lobby");
    setCrazyGamesLoadingActive(true, "lobby-join");
    connectMultiplayer();
    flushLobbyRequests("join-lobby");
  }

  async function confirmLeaveCurrentRunForLobbyInvite(pending) {
    if (!runState.active || deathState.active) {
      return true;
    }

    const inviterName = pending && pending.fromName ? pending.fromName : "A player";
    const shouldSave = window.confirm(inviterName + " invited you to a multiplayer lobby.\n\nSave your current game before leaving?");
    if (shouldSave) {
      maybeNotifyText("Saving current game...");
      const saved = await saveManualGame();
      if (saved) {
        return true;
      }
      return window.confirm("Could not save your current game. Join the lobby without saving?");
    }

    return window.confirm("Leave your current game without saving and join the lobby?");
  }

  async function acceptLobbyInvite(pending) {
    const code = pending && (pending.code || pending.lobbyId);
    if (!code) {
      setLobbyStatus("Lobby invite is missing a code.", "error");
      maybeNotifyText("Lobby invite is unavailable.");
      return;
    }

    if (!(await confirmLeaveCurrentRunForLobbyInvite(pending))) {
      return;
    }

    hideSignalPrompt();
    joinLobby(code);
  }

  function sanitizeLobbyCode(code) {
    return String(code || "").replace(/[^\w-]/g, "").trim().slice(0, 12).toUpperCase();
  }

  function selectedLobbyDifficulty() {
    return multiplayer.lobby && difficultyDefinitions[multiplayer.lobby.difficulty]
      ? multiplayer.lobby.difficulty
      : runState.difficultyId || defaultDifficultyId;
  }

  function lobbyDifficultySummary(difficulty) {
    return difficultyDefinition(difficulty).summary || difficultyDefinition(difficulty).description || difficultyLabel(difficulty);
  }

  function lobbyDifficultyDisplayText(difficulty) {
    const definition = difficultyDefinition(difficulty);
    return definition.label + " - " + lobbyDifficultySummary(definition.id);
  }

  function setLobbyDifficultyMenuOpen(open) {
    const isOpen = Boolean(open && lobbyDifficultyToggle && !lobbyDifficultyToggle.disabled);
    if (lobbyDifficultySelect) {
      lobbyDifficultySelect.classList.toggle("is-open", isOpen);
    }
    if (lobbyDifficultyToggle) {
      lobbyDifficultyToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    if (lobbyDifficultyMenu) {
      lobbyDifficultyMenu.hidden = !isOpen;
    }
  }

  function setLobbyDifficulty(difficulty) {
    if (!difficultyDefinitions[difficulty]) {
      return;
    }
    if (multiplayer.lobby) {
      multiplayer.lobby.difficulty = difficulty;
    }
    renderLobby();
    sendMultiplayer({
      type: "lobby.setDifficulty",
      difficulty
    });
  }

  function setLoadedLobbyDifficulty(difficulty) {
    if (!difficultyDefinitions[difficulty]) {
      return;
    }
    if (multiplayer.lobby) {
      setLobbyDifficulty(difficulty);
      return;
    }
    applyDifficulty(difficulty);
    renderLobby();
  }

  function startLobby() {
    if (!multiplayer.lobby || !isLobbyHost()) {
      setLobbyStatus("Only the host can start.", "error");
      return;
    }
    const gameMode = normalizeGameMode(multiplayer.lobby.gameMode || multiplayer.lobbyGameMode || "horde");
    if (multiplayer.lobbyLoadedSnapshot) {
      applyPersistentPayload(Object.assign({ ok: true }, multiplayer.lobbyLoadedSnapshot), { includePlayer: true });
      applyRunSnapshot(multiplayer.lobbyLoadedSnapshot.run);
      applyGameMode(gameMode);
    } else {
      applyDifficulty(selectedLobbyDifficulty());
      applyGameMode(gameMode);
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
    }
    sendMultiplayer({
      type: "lobby.start",
      netcodeVersion: 2,
      difficulty: selectedLobbyDifficulty(),
      gameMode,
      snapshot: multiplayer.lobbyLoadedSnapshot || buildPersistentPayload(true)
    });
    setLobbyStatus("Starting " + gameModeLabel(gameMode) + " lobby...", "");
  }

  function leaveLobby() {
    sendMultiplayer({ type: "lobby.leave" });
    multiplayer.lobby = null;
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = "";
    multiplayer.lobbyRequestStartedAt = 0;
    multiplayer.lobbyInviteLink = "";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    multiplayer.lobbyGameMode = "horde";
    setCrazyGamesLoadingActive(false, "lobby-leave");
    clearCrazyGamesRoomState("lobby-leave");
    setLobbyStatus("", "");
    setStartMenuView("multiplayer-horde", { push: false });
  }

  function applyLobbyState(message) {
    multiplayer.lobby = normalizeLobbyState(message && message.lobby ? message.lobby : message);
    multiplayer.lobbyGameMode = multiplayer.lobby.gameMode;
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = "";
    multiplayer.lobbyRequestStartedAt = 0;
    setLobbyStatus(
      multiplayer.lobby.status === "started"
        ? gameModeLabel(multiplayer.lobby.gameMode) + " lobby starting."
        : multiplayer.lobbyLoadedSnapshot
        ? 'Using "' + (multiplayer.lobbyLoadedSaveName || "saved world") + '".'
        : "",
      multiplayer.lobby.status === "started" || multiplayer.lobbyLoadedSnapshot ? "success" : ""
    );
    setStartMenuView("lobby", { push: false });
    setCrazyGamesLoadingActive(false, "lobby-state");
    updateLobbyCrazyGamesRoom("lobby-state");
    renderLobby();
  }

  function normalizeLobbyState(source) {
    const lobby = source && typeof source === "object" ? source : {};
    return {
      id: String(lobby.id || ""),
      code: sanitizeLobbyCode(lobby.code || lobby.id),
      hostPlayerId: String(lobby.hostPlayerId || ""),
      maxPlayers: Math.max(1, Math.floor(finiteOr(lobby.maxPlayers, crazyGamesRoomMaxPlayers))),
      difficulty: difficultyDefinitions[lobby.difficulty] ? lobby.difficulty : defaultDifficultyId,
      gameMode: normalizeGameMode(lobby.gameMode),
      status: String(lobby.status || "open"),
      players: Array.isArray(lobby.players)
        ? lobby.players.map(normalizeLobbyPlayer).filter(Boolean)
        : []
    };
  }

  function normalizeLobbyPlayer(source) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const playerId = String(source.playerId || "");
    if (!playerId) {
      return null;
    }
    return {
      playerId,
      publicName: String(source.publicName || source.name || playerId),
      online: source.online !== false,
      teamId: String(source.teamId || "")
    };
  }

  function renderLobby() {
    if (!lobbyPlayerSlots) {
      return;
    }

    const lobby = multiplayer.lobby;
    const requestPending = Boolean(!lobby && (multiplayer.lobbyCreatePending || multiplayer.lobbyJoinPending));
    const requestAge = requestPending ? performance.now() - multiplayer.lobbyRequestStartedAt : 0;
    const host = isLobbyHost();
    const maxPlayers = lobby ? lobby.maxPlayers || crazyGamesRoomMaxPlayers : crazyGamesRoomMaxPlayers;
    const players = lobbyPlayers();
    if (lobbyCodeValue) {
      lobbyCodeValue.textContent = lobby ? lobby.code || lobby.id || "----" : requestPending ? "..." : "----";
    }
    if (copyLobbyCodeButton) {
      copyLobbyCodeButton.disabled = !lobby || !(lobby.code || lobby.id);
    }
    if (startLobbyButton) {
      startLobbyButton.disabled = !lobby || !host || !players.length;
    }
    if (leaveLobbyButton) {
      leaveLobbyButton.textContent = lobby ? "Leave" : "Back";
    }
    const selectedDifficulty = selectedLobbyDifficulty();
    const difficultyLocked = Boolean(lobby && !host);
    if (lobbyDifficultySelect) {
      lobbyDifficultySelect.classList.toggle("is-disabled", difficultyLocked);
    }
    if (lobbyDifficultyToggle) {
      lobbyDifficultyToggle.textContent = lobbyDifficultyDisplayText(selectedDifficulty);
      lobbyDifficultyToggle.disabled = difficultyLocked;
      if (difficultyLocked) {
        setLobbyDifficultyMenuOpen(false);
      }
    }
    if (lobbyDifficultyMenu) {
      lobbyDifficultyMenu.querySelectorAll("[data-lobby-difficulty]").forEach((button) => {
        const difficulty = button.dataset.lobbyDifficulty || defaultDifficultyId;
        const selected = difficulty === selectedDifficulty;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
      });
    }

    lobbyPlayerSlots.textContent = "";
    for (let index = 0; index < maxPlayers; index += 1) {
      const slot = document.createElement("div");
      const occupant = players[index];
      slot.className = "lobby-slot";
      slot.classList.toggle("is-filled", Boolean(occupant));

      const name = document.createElement("strong");
      const status = document.createElement("span");
      name.textContent = occupant ? occupant.publicName || occupant.playerId : "Open slot";
      status.textContent = occupant
        ? occupant.playerId === (lobby && lobby.hostPlayerId)
          ? "Host"
          : occupant.playerId === player.id
          ? "You"
          : "Player"
        : "Invite";
      slot.append(name, status);

      if (host && occupant && occupant.playerId !== player.id) {
        const kick = document.createElement("button");
        kick.className = "settings-panel__save-action settings-panel__save-action--danger";
        kick.type = "button";
        kick.dataset.lobbyKick = occupant.playerId;
        kick.textContent = "Kick";
        slot.append(kick);
      }

      lobbyPlayerSlots.append(slot);
    }

    renderLobbyPlayerSearch();
    if (requestPending && requestAge > 4500) {
      setLobbyStatus(
        multiplayer.connected
          ? "Lobby create request was sent, but the server did not answer. Restart the local server so the new backend code is running."
          : multiplayer.serverUnavailable
          ? serverMaintenanceMessage
          : "Connecting to multiplayer server...",
        multiplayer.connected || multiplayer.serverUnavailable ? "error" : ""
      );
    }
  }

  async function refreshLobbyPlayerSearch() {
    if (!window.fetch || !lobbyPlayerSearchList || !multiplayer.lobby) {
      renderLobbyPlayerSearch();
      return;
    }

    ensureOnlinePresence();
    try {
      const url =
        "/api/players/search?playerId=" +
        encodeURIComponent(player.id) +
        "&q=" +
        encodeURIComponent(lobbyPlayerSearch ? lobbyPlayerSearch.value || "" : "") +
        "&friendsOnly=false&relayOnly=false";
      const data = await fetchPersistentJson(url);
      if (data && data.ok) {
        multiplayer.players = Array.isArray(data.players) ? data.players : [];
      }
      renderLobbyPlayerSearch();
    } catch (error) {
      renderLobbyPlayerSearch(backendErrorMessage(error, "Search unavailable."));
    }
  }

  function renderLobbyPlayerSearch(message) {
    if (!lobbyPlayerSearchList) {
      return;
    }
    lobbyPlayerSearchList.textContent = "";

    if (!multiplayer.lobby) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "Create or join a lobby first.";
      lobbyPlayerSearchList.append(empty);
      return;
    }

    const existing = new Set(lobbyPlayers().map((entry) => entry.playerId));
    const players = (multiplayer.players || []).filter(
      (candidate) => candidate.playerId && candidate.online && !existing.has(candidate.playerId)
    );
    if (message || !players.length) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = message || "No online players found.";
      lobbyPlayerSearchList.append(empty);
      return;
    }

    for (const candidate of players.slice(0, 8)) {
      const row = document.createElement("div");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const status = document.createElement("span");
      const invite = document.createElement("button");
      row.className = "start-menu__row";
      name.textContent = candidate.publicName || candidate.playerId;
      status.textContent = "Online";
      invite.className = "settings-panel__save-action";
      invite.type = "button";
      invite.dataset.lobbyInvite = candidate.playerId;
      invite.textContent = "Invite";
      invite.disabled = !candidate.online || !isLobbyHost();
      details.append(name, status);
      row.append(details, invite);
      lobbyPlayerSearchList.append(row);
    }
  }
