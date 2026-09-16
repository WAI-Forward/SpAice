  function connectMultiplayer() {
    if (!multiplayer.enabled || multiplayer.socket || !player.id) {
      return;
    }

    const socket = new WebSocket(websocketUrl());
    multiplayer.socket = socket;

    socket.addEventListener("open", function () {
      multiplayer.connected = true;
      multiplayer.serverUnavailable = false;
      multiplayer.reconnectDelay = 1.5;
      updateMultiplayerModeUi();
      sendMultiplayer({
        type: "hello",
        playerId: player.id,
        multiplayerOptIn: Boolean(multiplayer.friendJoinsEnabled),
        relayBypass: isCrazyGamesRuntime(),
        snapshot: buildMultiplayerPresenceSnapshot()
      });
      flushMultiplayerRoomRequests("socket-open");
      flushLobbyRequests("socket-open");
      flushSharedWorldRequests("socket-open");
    });

    socket.addEventListener("message", function (event) {
      try {
        handleMultiplayerMessage(JSON.parse(event.data));
      } catch (error) {
        reportClientError({
          kind: "multiplayer-message",
          message: error && error.message ? error.message : "Malformed multiplayer message",
          source: "/ws",
          line: 0,
          column: 0,
          stack: error && error.stack ? error.stack : ""
        });
      }
    });

    socket.addEventListener("close", scheduleMultiplayerReconnect);
    socket.addEventListener("error", scheduleMultiplayerReconnect);
  }

  function ensureOnlinePresence() {
    if (!player.id || multiplayer.socket || multiplayer.connected) {
      return;
    }
    connectMultiplayer();
  }

  function scheduleMultiplayerReconnect(event) {
    if (deathState.resetInFlight) {
      return;
    }

    if (event && event.currentTarget && multiplayer.socket !== event.currentTarget) {
      return;
    }

    multiplayer.connected = false;
    multiplayer.serverUnavailable = true;
    multiplayer.socket = null;
    multiplayer.reconnectTimer = multiplayer.reconnectDelay;
    multiplayer.reconnectDelay = Math.min(12, multiplayer.reconnectDelay * 1.5);
    notifyServerMaintenance();
    updateMultiplayerModeUi();
    if (multiplayer.lobby || multiplayer.lobbyCreatePending || multiplayer.lobbyJoinPending) {
      setLobbyStatus(serverMaintenanceMessage, "error");
      renderLobby();
    }
    if (isSharedPublicWorldActive() || multiplayer.sharedWorldJoinPending) {
      multiplayer.sharedWorldJoinPending = true;
      setSharedWorldStatus(serverMaintenanceMessage, "error");
    }
    if (multiplayer.lobby && multiplayer.lobby.code) {
      multiplayer.lobbyJoinPending = multiplayer.lobby.code;
    }
    if (multiplayer.roomId) {
      multiplayer.roomJoinable = false;
      reportCrazyGamesRoom("socket-closed");
    }
  }

  function sendMultiplayer(message) {
    const socket = multiplayer.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      let encoded = JSON.stringify(message);
      let compactedMessage = message;
      if (encoded.length > multiplayerMaxClientMessageBytes) {
        const compacted = compactOversizedMultiplayerMessage(message);
        if (compacted !== message) {
          compactedMessage = compacted;
          recordMultiplayerNetworkStat("compacted", message, encoded.length, socket);
          encoded = JSON.stringify(compacted);
        }
      }
      if (encoded.length > multiplayerMaxClientMessageBytes) {
        recordMultiplayerNetworkStat("dropped", compactedMessage, encoded.length, socket);
        warnLargeMultiplayerMessage(message, encoded.length, "dropped");
        return false;
      }
      if (socket.bufferedAmount > multiplayerBackpressureWarnBytes) {
        recordMultiplayerNetworkStat("backpressure", compactedMessage, socket.bufferedAmount, socket);
        warnLargeMultiplayerMessage(message, socket.bufferedAmount, "backpressure");
      }
      socket.send(encoded);
      recordMultiplayerNetworkStat("sent", compactedMessage, encoded.length, socket);
      return true;
    } catch {
      scheduleMultiplayerReconnect({ currentTarget: socket });
      try {
        socket.close();
      } catch {
        // The socket is already unusable; reconnect scheduling above is the important part.
      }
      return false;
    }
  }

  function recordMultiplayerNetworkStat(kind, message, bytes, socket) {
    if (!multiplayer.networkStats) {
      multiplayer.networkStats = {};
    }
    const stats = multiplayer.networkStats;
    const size = Math.max(0, Math.round(finiteOr(bytes, 0)));
    const type = String(message && message.type || "");
    stats.bufferedAmount = Math.max(0, Math.round(finiteOr(socket && socket.bufferedAmount, 0)));
    if (kind === "sent") {
      stats.sentMessages = Math.max(0, finiteOr(stats.sentMessages, 0)) + 1;
      stats.sentBytes = Math.max(0, finiteOr(stats.sentBytes, 0)) + size;
      stats.lastMessageType = type;
      stats.lastMessageBytes = size;
      if (size > finiteOr(stats.largestMessageBytes, 0)) {
        stats.largestMessageBytes = size;
        stats.largestMessageType = type;
      }
    } else if (kind === "dropped") {
      stats.droppedMessages = Math.max(0, finiteOr(stats.droppedMessages, 0)) + 1;
      stats.lastMessageType = type;
      stats.lastMessageBytes = size;
    } else if (kind === "compacted") {
      stats.compactedMessages = Math.max(0, finiteOr(stats.compactedMessages, 0)) + 1;
    } else if (kind === "backpressure") {
      stats.backpressureWarnings = Math.max(0, finiteOr(stats.backpressureWarnings, 0)) + 1;
    }
  }

  function compactOversizedMultiplayerMessage(message) {
    if (!message || typeof message !== "object") {
      return message;
    }
    if ((message.type === "hello" || message.type === "input") && message.snapshot && message.snapshot.world) {
      return {
        ...message,
        snapshot: buildMultiplayerPresenceSnapshot()
      };
    }
    return message;
  }

  function warnLargeMultiplayerMessage(message, size, reason) {
    const now = performance.now();
    if (now - multiplayerLastLargeMessageWarnAt < multiplayerLargeMessageWarnIntervalMs) {
      return;
    }
    multiplayerLastLargeMessageWarnAt = now;
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[Clusternauts multiplayer] " + reason + " websocket message", {
        type: message && message.type || "",
        bytes: Math.round(finiteOr(size, 0))
      });
    }
  }

  function resetSharedWorldV2Boundary() {
    if (isSharedPublicWorldActive() && isMultiplayerV2Active()) {
      resetMultiplayerV2State();
    }
  }

