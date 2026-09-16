function reattachClientToLobbyOrParty(client) {
  if (!client || !client.playerId) {
    return;
  }
  for (const lobby of lobbies.values()) {
    if (lobby.players.includes(client.playerId)) {
      client.lobbyId = lobby.id;
      sendLobbyState(lobby);
      return;
    }
  }
  for (const session of partySessions.values()) {
    if (session.players.includes(client.playerId)) {
      client.partySessionId = session.id;
      const room = partyV2Rooms.get(session.id);
      sendWsJson(client, {
        type: "party.start",
        session: publicPartySession(session),
        snapshot: room ? buildPartyV2StartSnapshot(room) : session.worldSnapshot
      });
      return;
    }
  }
}

async function sendClientBootstrap(client) {
  if (!client.playerId) {
    return;
  }

  const profile = await ensurePlayerProfile(client.playerId);
  client.profile = profile;
  sendWsJson(client, {
    type: "bootstrap",
    profile,
    universeId: client.universeId,
    bubbleRadius,
    onlineCount: countOnlinePlayers(),
    players: await listVisiblePlayers(client.playerId, "", false, false)
  });
}

function handleSocketClose(client, reason) {
  if (client.closed || !sockets.has(client)) {
    return;
  }

  client.closed = true;
  logMultiplayer("ws disconnected", {
    playerId: client.playerId || null,
    reason: reason || "unknown",
    socketsBeforeClose: sockets.size
  });
  sockets.delete(client);
  if (client.playerId && clientsByPlayerId.has(client.playerId)) {
    const clients = clientsByPlayerId.get(client.playerId);
    clients.delete(client);
    if (!clients.size) {
      clientsByPlayerId.delete(client.playerId);
    }
  }

  leaveClientLobby(client, false);
  leaveClientParty(client);
  leaveClientOverlaps(client);
  if (client.profile) {
    client.profile.lastSeenAt = Date.now();
    void saveProfile(client.profile);
  }
  broadcastPresence();
}

function broadcastPresence() {
  const payload = {
    type: "presence.update",
    onlineCount: countOnlinePlayers(),
    players: Array.from(clientsByPlayerId.keys())
  };

  for (const client of sockets) {
    if (client.playerId) {
      sendWsJson(client, payload);
    }
  }

  logMultiplayer("presence broadcast", {
    onlineCount: payload.onlineCount,
    sockets: sockets.size
  });
}

function relayToPlayer(playerId, payload) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    logMultiplayer("relay skipped", {
      targetPlayerId: playerId || null,
      type: payload && payload.type,
      reason: "target offline"
    });
    return false;
  }

  for (const client of clients) {
    sendWsJson(client, payload);
  }
  logMultiplayer("relay sent", {
    targetPlayerId: playerId,
    type: payload && payload.type,
    clientCount: clients.size
  });
  return true;
}

function firstOnlineClient(playerId) {
  const clients = clientsByPlayerId.get(playerId);
  return clients ? clients.values().next().value || null : null;
}

function findSignalIdForClient(client, requestedId) {
  const cleanId = sanitizeText(requestedId, 80);
  if (cleanId && pendingSignals.has(cleanId)) {
    return cleanId;
  }

  for (const [signalId, signal] of pendingSignals) {
    if (signal.players.includes(client.playerId)) {
      return signalId;
    }
  }
  return "";
}

function handleSignalChoice(client, message) {
  const signalId = findSignalIdForClient(client, message.signalId);
  const signal = pendingSignals.get(signalId);
  if (!signal) {
    logMultiplayer("signal choice ignored", {
      playerId: client.playerId,
      requestedSignalId: sanitizeText(message.signalId, 80),
      reason: "signal not found"
    });
    return;
  }

  const choice = message.choice === "investigate" ? "investigate" : "avoid";
  signal.choices.set(client.playerId, choice);
  logMultiplayer("signal choice saved", {
    signalId,
    playerId: client.playerId,
    choice,
    choices: Array.from(signal.choices.entries())
  });

  if (choice === "avoid") {
    cancelSignal(signalId, "avoided");
    return;
  }

  if (signal.players.every((playerId) => signal.choices.get(playerId) === "investigate")) {
    pendingSignals.delete(signalId);
    clearTimeout(signal.timeout);
    logMultiplayer("signal resolved", {
      signalId,
      result: "overlap",
      players: signal.players
    });
    startOverlap(signal.players, "random");
  }
}

function cancelSignal(signalId, reason) {
  const signal = pendingSignals.get(signalId);
  if (!signal) {
    return;
  }

  pendingSignals.delete(signalId);
  clearTimeout(signal.timeout);
  logMultiplayer("signal cancelled", {
    signalId,
    reason,
    players: signal.players
  });

  const now = Date.now();
  for (const playerId of signal.players) {
    playerCooldowns.set(playerId, now + randomSignalCooldownMs);
    relayToPlayer(playerId, {
      type: "signal.ended",
      signalId,
      reason
    });
  }
}

async function handleFriendInvite(client, message) {
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  if (!targetPlayerId || targetPlayerId === client.playerId) {
    logMultiplayer("friend invite rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      reason: "invalid target"
    });
    return;
  }

  const targetClient = firstOnlineClient(targetPlayerId);
  if (!client.multiplayerOptIn || !targetClient || !targetClient.multiplayerOptIn) {
    sendWsJson(client, {
      type: "friend.invite.sent",
      targetPlayerId,
      online: false,
      message: "Multiplayer is off."
    });
    return;
  }

  if (!canRelayLinkPlayers(client.playerId, targetPlayerId)) {
    logMultiplayer("friend invite rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      reason: "missing communication relay"
    });
    sendWsJson(client, {
      type: "friend.invite.sent",
      targetPlayerId,
      online: false,
      message: "Both players need online communication relays."
    });
    return;
  }

  const delivered = relayToPlayer(targetPlayerId, {
    type: "friend.invite",
    fromPlayerId: client.playerId,
    fromName: client.profile ? client.profile.publicName : client.playerId
  });

  logMultiplayer("friend invite processed", {
    fromPlayerId: client.playerId,
    targetPlayerId,
    delivered
  });
  sendWsJson(client, {
    type: "friend.invite.sent",
    targetPlayerId,
    online: delivered,
    message: delivered ? "Relay signal sent." : "Relay contact is offline."
  });
}

async function handleFriendAccept(client, message) {
  const fromPlayerId = sanitizeText(message.fromPlayerId || message.targetPlayerId, 80);
  if (!fromPlayerId || fromPlayerId === client.playerId) {
    logMultiplayer("friend accept rejected", {
      playerId: client.playerId,
      fromPlayerId,
      reason: "invalid target"
    });
    return;
  }

  const fromClient = firstOnlineClient(fromPlayerId);
  if (!client.multiplayerOptIn || !fromClient || !fromClient.multiplayerOptIn) {
    sendWsJson(client, { type: "error", message: "Multiplayer is off." });
    return;
  }

  if (!canRelayLinkPlayers(client.playerId, fromPlayerId)) {
    logMultiplayer("friend accept rejected", {
      playerId: client.playerId,
      fromPlayerId,
      reason: "missing communication relay"
    });
    sendWsJson(client, { type: "error", message: "Both players need online communication relays." });
    return;
  }

  await addFriendship(client.playerId, fromPlayerId);
  notifyProfileChanged(client.playerId);
  notifyProfileChanged(fromPlayerId);
  const participants = addToFriendOverlap(fromPlayerId, client.playerId);
  logMultiplayer("friend accept processed", {
    playerId: client.playerId,
    fromPlayerId,
    participants
  });
  startOverlap(participants, "friend");
}

