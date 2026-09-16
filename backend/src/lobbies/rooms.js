function handleRoomCreate(client, message) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "room.join.failed", roomId: "", reason: "disabled", message: "Multiplayer is off." });
    return;
  }

  const mode = normalizeRoomMode(message.mode);
  const existingOverlap = findJoinableOverlapForPlayer(client.playerId);
  const overlap = existingOverlap || startOverlap([client.playerId], mode);

  if (!overlap) {
    sendWsJson(client, { type: "error", message: "Could not create multiplayer room." });
    return;
  }

  sendRoomState(overlap);
}

function handleRoomJoin(client, message) {
  const roomId = sanitizeText(message.roomId, 96);
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "room.join.failed", roomId, reason: "disabled", message: "Multiplayer is off." });
    return;
  }

  if (!roomId) {
    sendWsJson(client, { type: "room.join.failed", roomId, reason: "missing-room", message: "Missing room id." });
    return;
  }

  const overlap = overlaps.get(roomId);
  if (!overlap || !isJoinableOverlapRoom(overlap)) {
    sendWsJson(client, {
      type: "room.join.failed",
      roomId,
      reason: "not-found",
      message: "That multiplayer room is no longer available."
    });
    return;
  }

  if (!overlap.players.includes(client.playerId) && overlap.players.length >= overlapRoomMaxPlayers) {
    sendWsJson(client, {
      type: "room.join.failed",
      roomId,
      reason: "full",
      message: "That multiplayer room is full."
    });
    sendRoomState(overlap);
    return;
  }

  const alreadyInRoom = overlap.players.includes(client.playerId);
  if (!overlap.players.includes(client.playerId)) {
    overlap.players.push(client.playerId);
  }
  client.overlaps.add(overlap.id);
  overlap.updatedAt = Date.now();

  logMultiplayer("room join accepted", {
    playerId: client.playerId,
    roomId: overlap.id,
    players: overlap.players
  });

  sendOverlapStart(overlap);
  if (!alreadyInRoom) {
    notifyRoomPlayerJoined(overlap, client);
  }
  broadcastOverlapTransform(overlap);
  sendRoomState(overlap);
}

function notifyRoomPlayerJoined(overlap, joinedClient) {
  const payload = {
    type: "room.player.joined",
    roomId: overlap.id,
    playerId: joinedClient.playerId,
    publicName: joinedClient.profile ? joinedClient.profile.publicName : joinedClient.playerId
  };

  for (const playerId of overlap.players) {
    if (playerId === joinedClient.playerId) {
      continue;
    }

    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      sendWsJson(client, payload);
    }
  }
}

function sanitizeDifficultyId(value) {
  const clean = sanitizeText(value, 16).toLowerCase();
  return difficultyChoices.has(clean) ? clean : "medium";
}

function sanitizeGameMode(value) {
  const clean = sanitizeText(value, 16).toLowerCase();
  return gameModeChoices.has(clean) ? clean : "horde";
}

function createLobbyId() {
  return `lobby-${Date.now().toString(36)}-${nextLobbyNumber++}`;
}

function createPartySessionId() {
  return `party-${Date.now().toString(36)}-${nextPartySessionNumber++}`;
}

function createAnomalyId() {
  return `anomaly-${Date.now().toString(36)}-${nextAnomalyNumber++}`;
}

function createLobbyCode() {
  let code = "";
  do {
    code = crypto.randomBytes(4).toString("base64url").replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  } while (!code || lobbyCodes.has(code) || partyCodes.has(code));
  return code;
}

function findLobbyByCodeOrId(value) {
  const raw = sanitizeText(value, 96);
  const clean = raw.toUpperCase();
  return lobbies.get(raw) || lobbies.get(clean) || lobbies.get(lobbyCodes.get(clean)) || null;
}

function findPartyByCodeOrId(value) {
  const raw = sanitizeText(value, 96);
  const clean = raw.toUpperCase();
  return partySessions.get(raw) || partySessions.get(clean) || partySessions.get(partyCodes.get(clean)) || null;
}

function publicLobbyPlayer(playerId) {
  const client = firstOnlineClient(playerId);
  return {
    playerId,
    publicName: client && client.profile ? client.profile.publicName : playerId,
    online: Boolean(client)
  };
}

function publicLobby(lobby) {
  return {
    id: lobby.id,
    code: lobby.code,
    hostPlayerId: lobby.hostPlayerId,
    maxPlayers: lobby.maxPlayers,
    difficulty: lobby.difficulty,
    gameMode: sanitizeGameMode(lobby.gameMode),
    status: lobby.status,
    players: lobby.players.map(publicLobbyPlayer)
  };
}

function sendLobbyState(lobby) {
  if (!lobby) {
    return;
  }
  const payload = {
    type: "lobby.state",
    lobby: publicLobby(lobby)
  };
  for (const playerId of lobby.players) {
    relayToPlayer(playerId, payload);
  }
}

function sendLobbyStateToClient(client, lobby) {
  if (!client || !lobby) {
    return;
  }
  sendWsJson(client, {
    type: "lobby.state",
    lobby: publicLobby(lobby)
  });
}

function assignClientLobby(playerId, lobbyId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return;
  }
  for (const client of clients) {
    client.lobbyId = lobbyId;
  }
}

function assignClientParty(playerId, partySessionId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return;
  }
  for (const client of clients) {
    client.partySessionId = partySessionId;
  }
}

function handleLobbyCreate(client, message) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Multiplayer is off." });
    return;
  }

  leaveClientLobby(client, true);
  const id = createLobbyId();
  const code = createLobbyCode();
  const lobby = {
    id,
    code,
    hostPlayerId: client.playerId,
    players: [client.playerId],
    maxPlayers: partyLobbyMaxPlayers,
    difficulty: sanitizeDifficultyId(message.difficulty),
    gameMode: sanitizeGameMode(message.gameMode),
    status: "open",
    createdAt: Date.now()
  };
  lobbies.set(id, lobby);
  lobbyCodes.set(code, id);
  client.lobbyId = id;
  assignClientLobby(client.playerId, id);
  sendLobbyStateToClient(client, lobby);
  sendLobbyState(lobby);
}

function handleLobbyJoin(client, message) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Multiplayer is off." });
    return;
  }
  const requestedCode = message.code || message.lobbyId || message.roomId;
  const lobby = findLobbyByCodeOrId(requestedCode);
  if (!lobby) {
    const session = findPartyByCodeOrId(requestedCode);
    if (session) {
      handlePartyJoin(client, session);
      return;
    }
  }
  if (!lobby || lobby.status !== "open") {
    sendWsJson(client, { type: "lobby.join.failed", message: "World unavailable." });
    return;
  }
  if (!lobby.players.includes(client.playerId) && lobby.players.length >= lobby.maxPlayers) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Lobby full." });
    return;
  }

  if (client.lobbyId === lobby.id && lobby.players.includes(client.playerId)) {
    sendLobbyState(lobby);
    return;
  }
  if (client.lobbyId && client.lobbyId !== lobby.id) {
    leaveClientLobby(client, true);
  }
  if (!lobby.players.includes(client.playerId)) {
    lobby.players.push(client.playerId);
  }
  client.lobbyId = lobby.id;
  assignClientLobby(client.playerId, lobby.id);
  sendLobbyState(lobby);
}

function handlePartyJoin(client, session) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Multiplayer is off." });
    return;
  }
  if (!session) {
    sendWsJson(client, { type: "lobby.join.failed", message: "World unavailable." });
    return;
  }

  const maxPlayers = Math.max(1, Math.floor(session.maxPlayers || partyLobbyMaxPlayers));
  if (!session.players.includes(client.playerId) && session.players.length >= maxPlayers) {
    sendWsJson(client, { type: "lobby.join.failed", message: "World full." });
    return;
  }

  if (client.lobbyId) {
    leaveClientLobby(client, true);
  }
  if (client.partySessionId && client.partySessionId !== session.id) {
    leaveClientParty(client);
  }
  if (!session.players.includes(client.playerId)) {
    session.players.push(client.playerId);
  }
  const room = partyV2Rooms.get(session.id);
  if (room) {
    addPartyV2Player(room, session, client.playerId);
  }

  client.lobbyId = "";
  client.partySessionId = session.id;
  assignClientParty(client.playerId, session.id);

  const payload = {
    type: "party.state",
    session: publicPartySession(session)
  };
  relayToParty(session, payload, client.playerId);

  const clients = clientsByPlayerId.get(client.playerId);
  if (clients) {
    for (const partyClient of clients) {
      sendWsJson(partyClient, {
        type: "party.start",
        session: publicPartySession(session),
        snapshot: room ? buildPartyV2StartSnapshot(room) : session.worldSnapshot
      });
    }
  }
}

function leaveClientLobby(client, explicitLeave) {
  if (!client || !client.lobbyId) {
    return;
  }
  const lobby = lobbies.get(client.lobbyId);
  const playerId = client.playerId;
  client.lobbyId = "";
  if (!lobby) {
    return;
  }

  if (!explicitLeave && firstOnlineClient(playerId)) {
    sendLobbyState(lobby);
    return;
  }

  lobby.players = lobby.players.filter((candidate) => candidate !== playerId);
  if (!lobby.players.length) {
    lobbies.delete(lobby.id);
    lobbyCodes.delete(lobby.code);
    return;
  }
  if (lobby.hostPlayerId === playerId) {
    lobby.hostPlayerId = lobby.players[0];
  }
  sendLobbyState(lobby);
}

function handleLobbyKick(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  if (!lobby || lobby.hostPlayerId !== client.playerId || !targetPlayerId || targetPlayerId === client.playerId) {
    return;
  }

  lobby.players = lobby.players.filter((playerId) => playerId !== targetPlayerId);
  assignClientLobby(targetPlayerId, "");
  relayToPlayer(targetPlayerId, {
    type: "lobby.kicked",
    lobbyId: lobby.id,
    message: "Removed from lobby."
  });
  sendLobbyState(lobby);
}

function handleLobbyInvite(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  if (!lobby || !lobby.players.includes(client.playerId) || !targetPlayerId || targetPlayerId === client.playerId) {
    return;
  }

  const delivered = relayToPlayer(targetPlayerId, {
    type: "lobby.invite",
    lobbyId: lobby.id,
    code: lobby.code,
    fromPlayerId: client.playerId,
    fromName: client.profile ? client.profile.publicName : client.playerId
  });
  sendWsJson(client, {
    type: "friend.invite.sent",
    targetPlayerId,
    online: delivered,
    message: delivered ? "Lobby invite sent." : "Player is offline."
  });
}

function handleLobbyDifficulty(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  if (!lobby || lobby.hostPlayerId !== client.playerId) {
    return;
  }
  lobby.difficulty = sanitizeDifficultyId(message.difficulty);
  sendLobbyState(lobby);
}

