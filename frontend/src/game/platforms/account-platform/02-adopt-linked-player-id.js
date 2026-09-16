  function adoptLinkedPlayerId(linkedPlayerId) {
    const cleanPlayerId = sanitizeNetworkIdentity(linkedPlayerId);
    if (!cleanPlayerId || cleanPlayerId === player.id || runState.active) {
      return;
    }

    if (multiplayer.socket) {
      try {
        multiplayer.socket.close();
      } catch {
        // Reconnecting under the account-linked id is best-effort before a run starts.
      }
    }
    multiplayer.socket = null;
    multiplayer.connected = false;
    multiplayer.reconnectTimer = 0;
    multiplayer.remoteUniverses.clear();
    clearCrazyGamesRoomState("identity-changed");

    player.id = cleanPlayerId;
    player.name = "Player " + cleanPlayerId.slice(-4).toUpperCase();
    document.body.dataset.playerId = cleanPlayerId;
    try {
      window.localStorage.setItem(playerIdStorageKey, cleanPlayerId);
    } catch {
      // Local storage can be unavailable in private or locked-down browser contexts.
    }

    if (runState.active && multiplayer.friendJoinsEnabled) {
      requestCrazyGamesRoomCreate("identity-changed");
    }
  }

  function applyCrazyGamesSettings(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    setCrazyGamesAudioMuted(source.muteAudio === true);
  }

  function applyLocalMuteAudioOverride() {
    const muted = readLocalMuteAudioOverride();
    if (muted === null) {
      return false;
    }
    setPlatformAudioMuted(muted);
    return true;
  }

  function crazyGamesGameModule() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    return sdk && sdk.game ? sdk.game : null;
  }

  function crazyGamesUserModule() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    return sdk && sdk.user ? sdk.user : null;
  }

  function multiplayerStatusText() {
    if (!multiplayer.friendJoinsEnabled) {
      return "Multiplayer Off";
    }
    if (multiplayer.pendingJoinRoomId) {
      return "Joining friend room";
    }
    if (multiplayer.serverUnavailable && !multiplayer.connected) {
      return serverMaintenanceMessage;
    }
    if (multiplayer.roomCreatePending) {
      return "Multiplayer On";
    }
    if (multiplayer.roomId && multiplayer.roomPlayerCount >= multiplayer.roomMaxPlayers) {
      return "Room full";
    }
    if (multiplayer.roomId && multiplayer.roomJoinable) {
      return "Multiplayer On: Friends can join";
    }
    return "Multiplayer On";
  }

  function updateMultiplayerModeUi() {
    const enabled = Boolean(multiplayer.friendJoinsEnabled);
    const text = multiplayerStatusText();
    if (multiplayerStatus) {
      multiplayerStatus.textContent = text;
      multiplayerStatus.classList.toggle("is-success", enabled && text !== "Room full" && !multiplayer.serverUnavailable);
      multiplayerStatus.classList.toggle("is-error", text === "Room full" || multiplayer.serverUnavailable);
    }
  }

  function sendMultiplayerOptIn() {
    sendMultiplayer({
      type: "multiplayer.optIn",
      enabled: Boolean(multiplayer.friendJoinsEnabled)
    });
  }

  function setFriendJoinsEnabled(enabled, reason, options) {
    const nextEnabled = Boolean(enabled);
    const changed = multiplayer.friendJoinsEnabled !== nextEnabled;
    multiplayer.friendJoinsEnabled = nextEnabled;
    if (!nextEnabled) {
      multiplayer.roomCreatePending = false;
      multiplayer.pendingJoinRoomId = "";
      if (multiplayer.connected) {
        sendMultiplayerOptIn();
        sendMultiplayer({ type: "overlap.leave" });
      }
      multiplayer.remoteUniverses.clear();
      clearCrazyGamesRoomState(reason || "multiplayer-off");
      if (!options || options.notify !== false) {
        maybeNotifyText("Multiplayer Off");
      }
      updateMultiplayerModeUi();
      if (multiplayer.panelOpen) {
        renderPlayerSearch();
      }
      return;
    }

    connectMultiplayer();
    if (multiplayer.connected) {
      sendMultiplayerOptIn();
    }
    if (changed && (!options || options.notify !== false)) {
      maybeNotifyText("Multiplayer On");
    }
    if (!runState.active && (!options || options.startRun !== false)) {
      void beginRunWithDifficulty(defaultDifficultyId);
    } else if (runState.active && !multiplayer.roomId && !multiplayer.pendingJoinRoomId) {
      requestCrazyGamesRoomCreate(reason || "multiplayer-on");
    }
    updateMultiplayerModeUi();
    if (multiplayer.panelOpen) {
      renderPlayerSearch();
    }
  }

  function sanitizeCrazyGamesRoomId(roomId) {
    return String(roomId || "").trim().slice(0, 96);
  }

  function normalizeCrazyGamesRoomMode(mode) {
    return String(mode || "world-overlap").trim().slice(0, 32) || "world-overlap";
  }

  function crazyGamesRoomInviteParams(roomId, mode) {
    return {
      roomId,
      mode: normalizeCrazyGamesRoomMode(mode),
      maxPlayers: String(crazyGamesRoomMaxPlayers)
    };
  }

  function logCrazyGamesQa(event, details) {
    if (!window.console || typeof console.info !== "function") {
      return;
    }

    console.info("[CrazyGames QA] " + event, details || {});
  }

  function isCrazyGamesRoomApiAvailable() {
    const game = crazyGamesGameModule();
    return Boolean(game && typeof game.updateRoom === "function");
  }

  function callCrazyGamesRoomMethod(methodName, payload, reason) {
    const game = crazyGamesGameModule();
    if (!game || typeof game[methodName] !== "function") {
      return false;
    }

    try {
      const result = payload === undefined ? game[methodName]() : game[methodName](payload);
      if (result && typeof result.catch === "function") {
        result.catch(function (error) {
          console.warn("CrazyGames room method failed.", { methodName, reason, error });
        });
      }
      return true;
    } catch (error) {
      console.warn("CrazyGames room method unavailable.", { methodName, reason, error });
      return false;
    }
  }

  function storeCrazyGamesInviteLink(inviteKey, link, inviteParams, reason) {
    if (crazyGamesState.lastInviteLinkKey !== inviteKey) {
      return;
    }

    crazyGamesState.inviteLinkPending = false;
    crazyGamesState.inviteLink = typeof link === "string" ? link : String(link || "");
    if (normalizeCrazyGamesRoomMode(inviteParams.mode) === "party-lobby") {
      multiplayer.lobbyInviteLink = crazyGamesState.inviteLink;
      renderLobby();
    }
    logCrazyGamesQa("invite link received", {
      reason,
      roomId: inviteParams.roomId,
      inviteParams,
      hasInviteLink: Boolean(crazyGamesState.inviteLink)
    });
  }

  function clearCrazyGamesInviteLinkState() {
    crazyGamesState.lastInviteLinkKey = "";
    crazyGamesState.inviteLinkPending = false;
    crazyGamesState.inviteLink = "";
    multiplayer.lobbyInviteLink = "";
  }

  function requestCrazyGamesInviteLink(inviteParams, reason) {
    const game = crazyGamesGameModule();
    if (!game || typeof game.inviteLink !== "function") {
      return false;
    }

    const cleanInviteParams = crazyGamesRoomInviteParams(inviteParams.roomId, inviteParams.mode);
    const inviteKey = JSON.stringify(cleanInviteParams);
    if (crazyGamesState.lastInviteLinkKey === inviteKey && (crazyGamesState.inviteLinkPending || crazyGamesState.inviteLink)) {
      return true;
    }

    crazyGamesState.lastInviteLinkKey = inviteKey;
    crazyGamesState.inviteLinkPending = true;
    crazyGamesState.inviteLink = "";
    logCrazyGamesQa("invite link requested", {
      reason,
      roomId: cleanInviteParams.roomId,
      inviteParams: cleanInviteParams
    });

    try {
      const result = game.inviteLink(cleanInviteParams);
      if (result && typeof result.then === "function") {
        result.then(function (link) {
          storeCrazyGamesInviteLink(inviteKey, link, cleanInviteParams, reason);
        }).catch(function (error) {
          if (crazyGamesState.lastInviteLinkKey === inviteKey) {
            crazyGamesState.inviteLinkPending = false;
          }
          console.warn("CrazyGames invite link failed.", { reason, inviteParams: cleanInviteParams, error });
        });
      } else {
        storeCrazyGamesInviteLink(inviteKey, result, cleanInviteParams, reason);
      }
      return true;
    } catch (error) {
      if (crazyGamesState.lastInviteLinkKey === inviteKey) {
        crazyGamesState.inviteLinkPending = false;
      }
      console.warn("CrazyGames invite link unavailable.", { reason, inviteParams: cleanInviteParams, error });
      return false;
    }
  }

  function reportCrazyGamesRoom(reason) {
    if (!isCrazyGamesRuntime()) {
      return;
    }
    if (!multiplayer.friendJoinsEnabled) {
      leaveCrazyGamesRoom(reason || "multiplayer-off");
      return;
    }

    const roomId = sanitizeCrazyGamesRoomId(multiplayer.roomId);
    if (!roomId) {
      leaveCrazyGamesRoom(reason);
      return;
    }

    const mode = normalizeCrazyGamesRoomMode(multiplayer.roomMode);
    const isJoinable = Boolean(multiplayer.roomJoinable && multiplayer.roomPlayerCount < multiplayer.roomMaxPlayers);
    const payload = {
      roomId,
      isJoinable,
      maxPlayers: multiplayer.roomMaxPlayers,
      currentPlayers: multiplayer.roomPlayerCount,
      mode,
      inviteParams: crazyGamesRoomInviteParams(roomId, mode)
    };
    const reportKey = JSON.stringify(payload);
    if (crazyGamesState.lastRoomReport === reportKey) {
      if (isJoinable) {
        requestCrazyGamesInviteLink(payload.inviteParams, reason);
      } else {
        clearCrazyGamesInviteLinkState();
      }
      return;
    }

    crazyGamesState.lastRoomReport = reportKey;
    const inviteLinkRequested = isJoinable ? requestCrazyGamesInviteLink(payload.inviteParams, reason) : false;
    if (!isJoinable) {
      clearCrazyGamesInviteLinkState();
    }

    if (!callCrazyGamesRoomMethod("updateRoom", payload, reason)) {
      console.warn("CrazyGames updateRoom unavailable.", { reason, roomId, isJoinable, inviteLinkRequested });
    }
  }

  function leaveCrazyGamesRoom(reason) {
    if (!crazyGamesState.lastRoomReport) {
      return;
    }

    crazyGamesState.lastRoomReport = "";
    clearCrazyGamesInviteLinkState();
    callCrazyGamesRoomMethod("leftRoom", undefined, reason);
  }

  function applyCrazyGamesRoomState(message) {
    const roomId = sanitizeCrazyGamesRoomId(message && message.roomId);
    if (!roomId) {
      clearCrazyGamesRoomState("missing-room-id");
      return;
    }

    multiplayer.roomId = roomId;
    multiplayer.roomMode = normalizeCrazyGamesRoomMode(message.mode);
    multiplayer.roomMaxPlayers = Math.max(1, Math.floor(finiteOr(message.maxPlayers, crazyGamesRoomMaxPlayers)));
    multiplayer.roomPlayerCount = Math.max(0, Math.floor(finiteOr(message.playerCount, 1)));
    multiplayer.roomJoinable = message.isJoinable !== false && multiplayer.roomPlayerCount < multiplayer.roomMaxPlayers;
    if (multiplayer.joinRequestedRoomId === roomId) {
      multiplayer.joinRequestedRoomId = "";
      logCrazyGamesQa("roomId joined", {
        roomId,
        mode: multiplayer.roomMode,
        playerCount: multiplayer.roomPlayerCount,
        maxPlayers: multiplayer.roomMaxPlayers
      });
      logCrazyGamesQa("room joined from invite params", {
        roomId,
        mode: multiplayer.roomMode,
        playerCount: multiplayer.roomPlayerCount,
        maxPlayers: multiplayer.roomMaxPlayers
      });
    }
    reportCrazyGamesRoom("room-state");
    updateMultiplayerModeUi();
  }

  function clearCrazyGamesRoomState(reason) {
    multiplayer.roomId = "";
    multiplayer.roomMode = "world-overlap";
    multiplayer.roomPlayerCount = 0;
    multiplayer.roomMaxPlayers = crazyGamesRoomMaxPlayers;
    multiplayer.roomJoinable = false;
    multiplayer.joinRequestedRoomId = "";
    leaveCrazyGamesRoom(reason);
    updateMultiplayerModeUi();
  }

  function requestCrazyGamesRoomCreate(reason) {
    if (!multiplayer.friendJoinsEnabled || !multiplayer.enabled || !player.id) {
      return;
    }

    multiplayer.roomCreatePending = true;
    multiplayer.pendingJoinRoomId = "";
    connectMultiplayer();
    flushMultiplayerRoomRequests(reason || "create-room");
    updateMultiplayerModeUi();
  }

  function requestCrazyGamesRoomJoin(roomId, mode, reason) {
    const cleanRoomId = sanitizeCrazyGamesRoomId(roomId);
    if (!cleanRoomId || !multiplayer.enabled || !player.id) {
      return;
    }

    multiplayer.pendingJoinRoomId = cleanRoomId;
    multiplayer.pendingJoinMode = normalizeCrazyGamesRoomMode(mode);
    multiplayer.joinRequestedRoomId = cleanRoomId;
    multiplayer.roomCreatePending = false;
    connectMultiplayer();
    flushMultiplayerRoomRequests(reason || "join-room");
    updateMultiplayerModeUi();
  }

  function flushMultiplayerRoomRequests(reason) {
    if (!multiplayer.connected) {
      return;
    }

    if (multiplayer.pendingJoinRoomId) {
      const roomId = multiplayer.pendingJoinRoomId;
      const mode = multiplayer.pendingJoinMode;
      if (sendMultiplayer({ type: "room.join", roomId, mode })) {
        multiplayer.pendingJoinRoomId = "";
      }
      return;
    }

    if (multiplayer.friendJoinsEnabled && multiplayer.roomCreatePending) {
      if (sendMultiplayer({ type: "room.create", mode: "world-overlap", reason: reason || "room-create" })) {
        multiplayer.roomCreatePending = false;
        updateMultiplayerModeUi();
      }
    }
  }

  function flushLobbyRequests(reason) {
    if (!multiplayer.connected) {
      return;
    }

    if (multiplayer.lobbyJoinPending) {
      const code = multiplayer.lobbyJoinPending;
      if (sendMultiplayer({ type: "lobby.join", code, reason: reason || "lobby-join" })) {
        multiplayer.lobbyJoinPending = "";
      }
      return;
    }

    if (multiplayer.lobbyCreatePending) {
      if (sendMultiplayer({
        type: "lobby.create",
        difficulty: selectedLobbyDifficulty(),
        gameMode: normalizeGameMode(multiplayer.lobbyGameMode || startMenu.selectedGameMode || "horde"),
        reason: reason || "lobby-create"
      })) {
        multiplayer.lobbyCreatePending = false;
      }
    }
  }

  function flushSharedWorldRequests(reason) {
    if (!multiplayer.connected || !multiplayer.sharedWorldJoinPending) {
      return;
    }

    if (sendMultiplayer({ type: "shared.world.join", reason: reason || "shared-world-join" })) {
      multiplayer.sharedWorldJoinPending = false;
    }
  }

  function handleCrazyGamesJoinParams(inviteParams, reason) {
    const params = inviteParams && typeof inviteParams === "object" ? inviteParams : {};
    const roomId = sanitizeCrazyGamesRoomId(params.roomId || params.roomName);
    if (!roomId) {
      return false;
    }

    logCrazyGamesQa("invite params consumed", {
      reason,
      roomId,
      inviteParams: params
    });
    if (normalizeCrazyGamesRoomMode(params.mode) === "party-lobby") {
      joinLobby(roomId);
      maybeNotifyText("Joined lobby");
      return true;
    }
    setFriendJoinsEnabled(true, reason || "invite-join", { persist: true, notify: false, startRun: false });
    if (!runState.active) {
      void beginRunWithDifficulty(defaultDifficultyId);
    }
    requestCrazyGamesRoomJoin(roomId, params.mode || "world-overlap", reason);
    maybeNotifyText("Joined friend room");
    return true;
  }

