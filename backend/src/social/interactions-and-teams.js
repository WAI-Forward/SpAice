function normalizeRoomMode(mode) {
  const cleanMode = sanitizeText(mode, 32);
  return cleanMode || "world-overlap";
}

function isJoinableOverlapRoom(overlap) {
  return Boolean(overlap && isJoinableRoomMode(overlap.type));
}

function isJoinableRoomMode(mode) {
  return mode === "world-overlap" || mode === "friend";
}

function findJoinableOverlapForPlayer(playerId) {
  for (const overlap of overlaps.values()) {
    if (!isJoinableOverlapRoom(overlap) || !overlap.players.includes(playerId)) {
      continue;
    }
    return overlap;
  }
  return null;
}

function roomStateForOverlap(overlap) {
  const playerCount = overlap && Array.isArray(overlap.players) ? overlap.players.length : 0;
  return {
    type: "room.state",
    roomId: overlap ? overlap.id : "",
    mode: "world-overlap",
    maxPlayers: overlapRoomMaxPlayers,
    playerCount,
    isJoinable: Boolean(overlap && isJoinableOverlapRoom(overlap) && playerCount < overlapRoomMaxPlayers)
  };
}

function sendRoomState(overlap) {
  if (!overlap || !isJoinableOverlapRoom(overlap)) {
    return;
  }

  const payload = roomStateForOverlap(overlap);
  for (const playerId of overlap.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      sendWsJson(client, payload);
    }
  }
}

async function handlePlayerInteractionChoice(client, message) {
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  const choice = sanitizeText(message.choice, 16);
  if (!targetPlayerId || targetPlayerId === client.playerId || !playerInteractionChoices.has(choice)) {
    logMultiplayer("interaction choice rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      choice,
      reason: "invalid"
    });
    sendWsJson(client, { type: "error", message: "Invalid player interaction." });
    return;
  }

  const targetClient = firstOnlineClient(targetPlayerId);
  if (!targetClient) {
    logMultiplayer("interaction choice rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      choice,
      reason: "target offline"
    });
    sendWsJson(client, { type: "error", message: "That player is offline." });
    return;
  }

  const clientSession = partySessions.get(client.partySessionId);
  const targetSession = partySessions.get(targetClient.partySessionId);
  const bothInSameSharedWorld = isSharedWorldSession(clientSession) && targetSession && targetSession.id === clientSession.id;
  if (choice === "team" && !bothInSameSharedWorld) {
    sendWsJson(client, { type: "error", message: "Team invites are only available in the public shared world." });
    return;
  }
  if ((choice === "duel" || choice === "truce") && bothInSameSharedWorld) {
    sendWsJson(client, { type: "error", message: "Public world PvP is already on outside your team." });
    return;
  }

  const key = interactionPairKey(client.playerId, targetPlayerId);
  if (choice === "truce" && !activePlayerDuels.has(key)) {
    logMultiplayer("interaction choice rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      choice,
      reason: "truce without active duel"
    });
    sendWsJson(client, { type: "error", message: "Truce is only available during an active duel." });
    return;
  }

  const existing = pendingPlayerInteractions.get(key);
  const pending =
    existing && Date.now() - existing.updatedAt < 30000
      ? existing
      : {
          players: [client.playerId, targetPlayerId].sort(),
          choices: new Map(),
          updatedAt: Date.now()
        };

  pending.choices.set(client.playerId, choice);
  pending.updatedAt = Date.now();
  pendingPlayerInteractions.set(key, pending);
  relayInteractionRequest(client, targetClient, choice);

  const otherChoice = pending.choices.get(targetPlayerId);
  if (otherChoice !== choice) {
    return;
  }

  pendingPlayerInteractions.delete(key);
  await acceptPlayerInteraction(client.playerId, targetPlayerId, choice);
}

function interactionPairKey(a, b) {
  return [a, b].sort().join("|");
}

function partyV2DuelPairsForSession(session) {
  if (!session || !Array.isArray(session.players) || !session.players.length) {
    return [];
  }
  const partyPlayers = new Set(session.players);
  const pairs = [];
  for (const key of activePlayerDuels) {
    const [a, b] = String(key || "").split("|");
    if (a && b && partyPlayers.has(a) && partyPlayers.has(b)) {
      pairs.push(key);
    }
  }
  return pairs;
}

function relayInteractionRequest(fromClient, targetClient, choice) {
  relayToPlayer(targetClient.playerId, {
    type: "interaction.request",
    fromPlayerId: fromClient.playerId,
    fromName: fromClient.profile ? fromClient.profile.publicName : fromClient.playerId,
    choice
  });
}

async function acceptPlayerInteraction(aPlayerId, bPlayerId, choice) {
  const aClient = firstOnlineClient(aPlayerId);
  const bClient = firstOnlineClient(bPlayerId);
  if (!aClient || !bClient) {
    return;
  }

  const key = interactionPairKey(aPlayerId, bPlayerId);
  if (choice === "team") {
    const result = await acceptSharedWorldTeam(aPlayerId, bPlayerId);
    sendInteractionResult(aClient, bClient, choice, result.ok, result);
    sendInteractionResult(bClient, aClient, choice, result.ok, result);
    return;
  } else if (choice === "duel") {
    activePlayerDuels.add(key);
  } else if (choice === "truce") {
    activePlayerDuels.delete(key);
  }

  sendInteractionResult(aClient, bClient, choice, true);
  sendInteractionResult(bClient, aClient, choice, true);
  logMultiplayer("interaction accepted", {
    players: [aPlayerId, bPlayerId],
    choice
  });
}

async function acceptSharedWorldTeam(aPlayerId, bPlayerId) {
  const session = partySessions.get(sharedWorldSessionId);
  const room = partyV2Rooms.get(sharedWorldSessionId);
  if (!isSharedWorldSession(session) || !room || !session.players.includes(aPlayerId) || !session.players.includes(bPlayerId)) {
    return { ok: false, reason: "unavailable", message: "Shared world team unavailable." };
  }

  const aTeamId = sharedWorldTeamIdForPlayer(session, aPlayerId);
  const bTeamId = sharedWorldTeamIdForPlayer(session, bPlayerId);
  if (aTeamId && bTeamId && aTeamId !== bTeamId) {
    return { ok: false, reason: "different-teams", message: "Team merging is not available yet." };
  }

  let team = null;
  let teamId = aTeamId || bTeamId;
  if (teamId) {
    team = session.teams.get(teamId);
    if (!team) {
      teamId = "";
    }
  }
  if (!teamId) {
    teamId = createSharedWorldTeamId();
    team = {
      teamId,
      members: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  const members = new Set(team.members || []);
  members.add(aPlayerId);
  members.add(bPlayerId);
  if (members.size > sharedWorldTeamMaxPlayers) {
    return { ok: false, reason: "team-full", message: "Team is full." };
  }

  team.members = Array.from(members).slice(0, sharedWorldTeamMaxPlayers);
  team.updatedAt = Date.now();
  session.teams.set(teamId, team);
  rebuildSharedWorldTeamIndex(session);
  for (const memberId of team.members) {
    setSharedWorldPlayerTeam(session, room, memberId, teamId);
  }
  markSharedWorldDirty();
  await saveSharedWorldRuntime("team");
  relayToParty(session, {
    type: "party.state",
    session: publicPartySession(session)
  });
  return { ok: true, teamId, members: team.members.slice(), message: "Joined team." };
}

function handleSharedTeamLeave(client) {
  const session = partySessions.get(client && client.partySessionId);
  if (!isSharedWorldSession(session)) {
    return;
  }
  const room = partyV2Rooms.get(session.id);
  const removedTeamId = removeSharedWorldPlayerFromTeam(session, room, client.playerId);
  if (!removedTeamId) {
    sendWsJson(client, {
      type: "shared.team.left",
      teamId: "",
      message: "You are not in a team."
    });
    return;
  }
  markSharedWorldDirty();
  void saveSharedWorldRuntime("team-leave");
  sendWsJson(client, {
    type: "shared.team.left",
    teamId: removedTeamId,
    message: "Left team."
  });
  relayToParty(session, {
    type: "party.state",
    session: publicPartySession(session)
  });
}

function sendInteractionResult(receiverClient, peerClient, choice, accepted, details) {
  const extra = details && typeof details === "object" ? details : {};
  sendWsJson(receiverClient, {
    type: "interaction.result",
    fromPlayerId: peerClient.playerId,
    fromName: peerClient.profile ? peerClient.profile.publicName : peerClient.playerId,
    targetPlayerId: receiverClient.playerId,
    peerName: peerClient.profile ? peerClient.profile.publicName : peerClient.playerId,
    choice,
    accepted: Boolean(accepted),
    reason: sanitizeText(extra.reason, 64),
    message: sanitizeText(extra.message, 180),
    teamId: sanitizeTeamId(extra.teamId),
    members: Array.isArray(extra.members) ? extra.members.map((memberId) => sanitizeText(memberId, 80)).filter(Boolean) : undefined
  });
}

