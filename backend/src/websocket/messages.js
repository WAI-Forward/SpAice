async function handleSocketMessage(client, message) {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "hello") {
    logMultiplayer("ws hello received", {
      playerId: sanitizeText(message.playerId, 80) || null
    });
    await handleSocketHello(client, message);
    return;
  }

  if (!client.playerId) {
    logMultiplayer("ws message rejected", {
      type: message.type,
      reason: "missing hello"
    });
    sendWsJson(client, { type: "error", message: "Send hello before multiplayer messages." });
    return;
  }

  if (message.type === "input") {
    client.lastSnapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : client.lastSnapshot;
    syncSharedWorldPresenceSnapshot(client);
    if (Object.prototype.hasOwnProperty.call(message, "multiplayerOptIn")) {
      client.multiplayerOptIn = message.multiplayerOptIn !== false;
    }
    relayOverlapSnapshot(client);
    return;
  }

  if (message.type === "multiplayer.optIn") {
    client.multiplayerOptIn = message.enabled !== false;
    if (!client.multiplayerOptIn) {
      leaveClientOverlaps(client, true);
    }
    await sendClientBootstrap(client);
    return;
  }

  if (message.type === "signal.choice") {
    logMultiplayer("signal choice received", {
      playerId: client.playerId,
      signalId: sanitizeText(message.signalId, 80),
      choice: message.choice
    });
    handleSignalChoice(client, message);
    return;
  }

  if (message.type === "friend.invite") {
    logMultiplayer("friend invite received", {
      fromPlayerId: client.playerId,
      targetPlayerId: sanitizeText(message.targetPlayerId, 80)
    });
    await handleFriendInvite(client, message);
    return;
  }

  if (message.type === "friend.accept") {
    logMultiplayer("friend accept received", {
      fromPlayerId: client.playerId,
      targetPlayerId: sanitizeText(message.fromPlayerId || message.targetPlayerId, 80)
    });
    await handleFriendAccept(client, message);
    return;
  }

  if (message.type === "room.create") {
    logMultiplayer("room create received", {
      playerId: client.playerId,
      mode: sanitizeText(message.mode, 32)
    });
    handleRoomCreate(client, message);
    return;
  }

  if (message.type === "room.join") {
    logMultiplayer("room join received", {
      playerId: client.playerId,
      roomId: sanitizeText(message.roomId, 96),
      mode: sanitizeText(message.mode, 32)
    });
    handleRoomJoin(client, message);
    return;
  }

  if (message.type === "lobby.create") {
    handleLobbyCreate(client, message);
    return;
  }

  if (message.type === "lobby.join") {
    handleLobbyJoin(client, message);
    return;
  }

  if (message.type === "lobby.leave") {
    leaveClientLobby(client, true);
    return;
  }

  if (message.type === "lobby.kick") {
    handleLobbyKick(client, message);
    return;
  }

  if (message.type === "lobby.invite") {
    handleLobbyInvite(client, message);
    return;
  }

  if (message.type === "lobby.setDifficulty") {
    handleLobbyDifficulty(client, message);
    return;
  }

  if (message.type === "lobby.start") {
    handleLobbyStart(client, message);
    return;
  }

  if (message.type === "shared.world.join") {
    await handleSharedWorldJoin(client, message);
    return;
  }

  if (message.type === "shared.world.leave") {
    leaveSharedWorld(client, true);
    return;
  }

  if (message.type === "shared.team.leave") {
    handleSharedTeamLeave(client);
    return;
  }

  if (message.type === "mp.v2.input") {
    handlePartyV2Input(client, message);
    return;
  }

  if (message.type === "mp.v2.action") {
    handlePartyV2Action(client, message);
    return;
  }

  if (message.type === "party.input") {
    handlePartyInput(client, message);
    return;
  }

  if (message.type === "party.world.snapshot") {
    handlePartyWorldSnapshot(client, message);
    return;
  }

  if (message.type === "party.respawn") {
    handlePartyRespawn(client, message);
    return;
  }

  if (message.type === "party.tech.pickup") {
    handlePartyTechPickup(client, message);
    return;
  }

  if (message.type === "party.health.pickup") {
    handlePartyHealthPickup(client, message);
    return;
  }

  if (message.type === "party.command") {
    handlePartyCommand(client, message);
    return;
  }

  if (
    message.type === "party.physics.start" ||
    message.type === "party.physics.state" ||
    message.type === "party.physics.end" ||
    message.type === "party.physics.authority" ||
    message.type === "party.physics.reject"
  ) {
    handlePartyPhysicsSession(client, message);
    return;
  }

  if (message.type === "anomaly.choice") {
    handleAnomalyChoice(client, message);
    return;
  }

  if (message.type === "interaction.choice") {
    logMultiplayer("interaction choice received", {
      fromPlayerId: client.playerId,
      targetPlayerId: sanitizeText(message.targetPlayerId, 80),
      choice: message.choice
    });
    await handlePlayerInteractionChoice(client, message);
    return;
  }

  if (message.type === "player.death") {
    logMultiplayer("player death received", {
      playerId: client.playerId
    });
    relayPlayerDeath(client, message);
    return;
  }

  if (message.type === "trade.offer" || message.type === "trade.accept") {
    relayToPlayer(sanitizeText(message.targetPlayerId, 80), {
      type: message.type,
      fromPlayerId: client.playerId,
      fromName: client.profile ? client.profile.publicName : client.playerId,
      offer: message.offer || null
    });
    return;
  }

  if (message.type === "entity.effect") {
    logMultiplayer("entity effect received", {
      fromPlayerId: client.playerId,
      targetUniverseId: sanitizeText(message.targetUniverseId, 96),
      entityType: message.effect && message.effect.entityType
    });
    relayEntityEffect(client, message);
    return;
  }

  if (message.type === "overlap.leave") {
    logMultiplayer("overlap leave received", { playerId: client.playerId });
    leaveClientOverlaps(client, true);
    return;
  }

  logMultiplayer("ws message ignored", {
    playerId: client.playerId,
    type: message.type || null
  });
}

async function handleSocketHello(client, message) {
  const playerId = sanitizeText(message.playerId, 80);
  if (!playerId) {
    logMultiplayer("ws hello rejected", { reason: "missing player id" });
    sendWsJson(client, { type: "error", message: "Missing player id." });
    return;
  }

  client.playerId = playerId;
  client.universeId = soloWorldId(playerId);
  client.multiplayerOptIn = message.multiplayerOptIn !== false;
  client.relayBypass = message.relayBypass === true;
  client.profile = await ensurePlayerProfile(playerId);
  const helloName = sanitizeText(message.snapshot && message.snapshot.player && message.snapshot.player.name, 32);
  if (client.profile.crazyGamesUsername) {
    client.profile.publicName = client.profile.crazyGamesUsername;
  } else if (helloName) {
    client.profile.publicName = helloName;
  }
  client.profile.lastSeenAt = Date.now();
  await saveProfile(client.profile);

  if (message.snapshot && typeof message.snapshot === "object") {
    client.lastSnapshot = message.snapshot;
  }

  if (!clientsByPlayerId.has(playerId)) {
    clientsByPlayerId.set(playerId, new Set());
  }
  clientsByPlayerId.get(playerId).add(client);

  logMultiplayer("ws hello accepted", {
    playerId,
    publicName: client.profile && client.profile.publicName,
    universeId: client.universeId,
    connectionsForPlayer: clientsByPlayerId.get(playerId).size,
    onlineCount: countOnlinePlayers()
  });
  await sendClientBootstrap(client);
  reattachClientToLobbyOrParty(client);
  broadcastPresence();
}

