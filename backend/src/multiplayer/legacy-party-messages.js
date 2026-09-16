function handleLobbyStart(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  if (!lobby || lobby.hostPlayerId !== client.playerId) {
    sendWsJson(client, { type: "error", message: "Only the host can start." });
    return;
  }

  const session = {
    id: createPartySessionId(),
    lobbyId: lobby.id,
    hostPlayerId: client.playerId,
    players: lobby.players.slice(),
    maxPlayers: lobby.maxPlayers,
    joinCode: lobby.code,
    difficulty: sanitizeDifficultyId(message.difficulty || lobby.difficulty),
    gameMode: sanitizeGameMode(message.gameMode || lobby.gameMode),
    pvpMode: "party-off",
    netcodeVersion: partyNetcodeVersion,
    worldSnapshot: message.snapshot && typeof message.snapshot === "object" ? message.snapshot : client.lastSnapshot,
    playerSnapshots: new Map(),
    claimedTechPickupIds: new Set(),
    createdAt: Date.now(),
    anomalyId: ""
  };
  partySessions.set(session.id, session);
  partyCodes.set(lobby.code, session.id);
  lobbies.delete(lobby.id);
  lobbyCodes.delete(lobby.code);
  const room = createPartyV2Room(session);
  if (room && room.state) {
    room.state.gameMode = sanitizeGameMode(session.gameMode);
    if (room.state.world) {
      room.state.world.gameMode = room.state.gameMode;
    }
  }
  const startSnapshot = room ? buildPartyV2StartSnapshot(room) : session.worldSnapshot;

  for (const playerId of session.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }
    for (const partyClient of clients) {
      partyClient.lobbyId = "";
      partyClient.partySessionId = session.id;
      sendWsJson(partyClient, {
        type: "party.start",
        session: publicPartySession(session),
        snapshot: startSnapshot
      });
    }
  }
}

function publicPartySession(session) {
  return {
    id: session.id,
    sessionId: session.id,
    lobbyId: session.lobbyId,
    code: session.joinCode || "",
    joinCode: session.joinCode || "",
    hostPlayerId: session.hostPlayerId,
    maxPlayers: Math.max(1, Math.floor(session.maxPlayers || partyLobbyMaxPlayers)),
    difficulty: session.difficulty,
    gameMode: sanitizeGameMode(session.gameMode || (isSharedWorldSession(session) ? "survival" : "horde")),
    netcodeVersion: session.netcodeVersion || 1,
    authoritativeServer: (session.netcodeVersion || 1) >= partyNetcodeVersion,
    pvpMode: session.pvpMode,
    worldMode: session.worldMode || "party",
    sharedWorld: isSharedWorldSession(session),
    sharedWorldStats: isSharedWorldSession(session) ? buildSharedWorldStats(session, partyV2Rooms.get(session.id)) : null,
    teams: isSharedWorldSession(session) ? sharedWorldTeamsArray(session) : [],
    players: session.players.map((playerId) => {
      const entry = publicLobbyPlayer(playerId);
      if (isSharedWorldSession(session)) {
        entry.teamId = sharedWorldTeamIdForPlayer(session, playerId);
      }
      return entry;
    })
  };
}

function relayToParty(session, payload, exceptPlayerId) {
  if (!session) {
    return;
  }
  for (const playerId of session.players) {
    if (playerId === exceptPlayerId) {
      continue;
    }
    relayToPlayer(playerId, payload);
  }
}

function handlePartyInput(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }
  if (isPartyV2Session(session)) {
    return;
  }
  const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
  if (snapshot) {
    session.playerSnapshots.set(client.playerId, snapshot);
  }
  relayToParty(session, {
    type: "party.player.snapshot",
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    teamId: session.anomalyTeamId || "",
    snapshot
  }, client.playerId);
}

function handlePartyWorldSnapshot(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || session.hostPlayerId !== client.playerId) {
    return;
  }
  if (isPartyV2Session(session)) {
    return;
  }
  const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
  if (!snapshot) {
    return;
  }
  session.worldSnapshot = snapshot;
  relayToParty(session, {
    type: "party.world.snapshot",
    sessionId: session.id,
    hostPlayerId: session.hostPlayerId,
    hostName: client.profile ? client.profile.publicName : client.playerId,
    snapshot
  }, client.playerId);
}

function handlePartyRespawn(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }
  const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
  if (snapshot) {
    session.playerSnapshots.set(client.playerId, snapshot);
  }
  const room = isPartyV2Session(session) ? partyV2Rooms.get(session.id) : null;
  if (room && snapshot && snapshot.player && typeof mpV2Sim.respawnPlayer === "function") {
    mpV2Sim.respawnPlayer(room.state, client.playerId, snapshot.player);
    room.inputQueues.delete(client.playerId);
    room.lastInputs.delete(client.playerId);
    if (Array.isArray(room.pendingEvents)) {
      room.pendingEvents = room.pendingEvents.filter((event) => {
        return !(event && event.type === "player.died" && String(event.playerId || "") === client.playerId);
      });
    }
    if (room.state && Array.isArray(room.state.events)) {
      room.state.events = room.state.events.filter((event) => {
        return !(event && event.type === "player.died" && String(event.playerId || "") === client.playerId);
      });
    }
    session.worldSnapshot = buildPartyV2StartSnapshot(room);
    if (isSharedWorldSession(session)) {
      saveSharedWorldPlayerSnapshot(session, room, client.playerId);
      markSharedWorldDirty();
    }
    sendPartyV2Snapshot(session, room);
  }
  relayToParty(session, {
    type: "player.respawn",
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    snapshot
  }, client.playerId);
}

function handlePartyTechPickup(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }

  if (!session.claimedTechPickupIds) {
    session.claimedTechPickupIds = new Set();
  }

  const pickupId = sanitizeText(String(message.pickupId || ""), 80);
  const key = techKeys.includes(message.key) ? message.key : "";
  if (!pickupId || !key || session.claimedTechPickupIds.has(pickupId)) {
    return;
  }

  session.claimedTechPickupIds.add(pickupId);
  relayToParty(session, {
    type: "party.tech.claimed",
    pickupId,
    key,
    claimedByPlayerId: client.playerId,
    claimedByName: client.profile ? client.profile.publicName : client.playerId,
    x: clampNumber(message.x, -1000000, 1000000),
    y: clampNumber(message.y, -1000000, 1000000)
  });
}

function handlePartyHealthPickup(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }

  if (!session.claimedHealthPickupIds) {
    session.claimedHealthPickupIds = new Set();
  }

  const pickupId = sanitizeText(String(message.pickupId || ""), 80);
  if (!pickupId || session.claimedHealthPickupIds.has(pickupId)) {
    return;
  }

  session.claimedHealthPickupIds.add(pickupId);
  relayToParty(session, {
    type: "party.health.claimed",
    pickupId,
    heal: clampNumber(message.heal, 1, 100),
    claimedByPlayerId: client.playerId,
    claimedByName: client.profile ? client.profile.publicName : client.playerId,
    x: clampNumber(message.x, -1000000, 1000000),
    y: clampNumber(message.y, -1000000, 1000000)
  });
}

