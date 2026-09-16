function leaveClientParty(client) {
  if (!client || !client.partySessionId) {
    return;
  }
  const session = partySessions.get(client.partySessionId);
  if (isSharedWorldSession(session)) {
    leaveSharedWorld(client, false);
    return;
  }
  const playerId = client.playerId;
  client.partySessionId = "";
  if (!session || firstOnlineClient(playerId)) {
    return;
  }

  session.players = session.players.filter((candidate) => candidate !== playerId);
  session.playerSnapshots.delete(playerId);
  const room = partyV2Rooms.get(session.id);
  if (room) {
    mpV2Sim.removePlayer(room.state, playerId);
    room.inputQueues.delete(playerId);
    room.lastInputs.delete(playerId);
    room.lastAckByPlayerId.delete(playerId);
  }
  if (!session.players.length) {
    endPartySession(session.id, "empty");
    return;
  }
  if (session.hostPlayerId === playerId) {
    migratePartyHost(session, "host-left");
  } else {
    relayToParty(session, {
      type: "party.state",
      session: publicPartySession(session)
    });
  }
}

function migratePartyHost(session, reason) {
  const nextHostId = session.players.find((candidate) => firstOnlineClient(candidate));
  if (!nextHostId) {
    endPartySession(session.id, "no-host");
    return;
  }
  session.hostPlayerId = nextHostId;
  relayToParty(session, {
    type: "party.host.changed",
    hostPlayerId: nextHostId,
    reason,
    session: publicPartySession(session),
    snapshot: session.worldSnapshot
  });
}

function endPartySession(sessionId, reason) {
  const session = partySessions.get(sessionId);
  if (!session) {
    return;
  }
  if (session.anomalyId) {
    const match = anomalyMatches.get(session.anomalyId);
    if (match && match.status === "active") {
      endAnomalyMatch(session.anomalyId, reason || "party-ended");
    } else {
      cancelAnomalyMatch(session.anomalyId, reason || "party-ended");
    }
  }
  partySessions.delete(sessionId);
  partyV2Rooms.delete(sessionId);
  if (session.joinCode) {
    partyCodes.delete(session.joinCode);
  }
  for (const playerId of session.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (clients) {
      for (const client of clients) {
        client.partySessionId = "";
      }
    }
    relayToPlayer(playerId, {
      type: "anomaly.end",
      reason: reason || "session-ended"
    });
  }
}

function eligibleAnomalySessions() {
  return Array.from(partySessions.values()).filter((session) => {
    if (!session || session.anomalyId || !session.players.length || !firstOnlineClient(session.hostPlayerId)) {
      return false;
    }
    return session.players.every((playerId) => firstOnlineClient(playerId));
  });
}

function scanForAnomalyMatches() {
  const sessions = eligibleAnomalySessions();
  for (let i = 0; i < sessions.length; i += 1) {
    for (let j = i + 1; j < sessions.length; j += 1) {
      const a = sessions[i];
      const b = sessions[j];
      if (a.players.length !== b.players.length) {
        continue;
      }
      createAnomalyMatch(a, b);
      return;
    }
  }
}

function createAnomalyMatch(a, b) {
  const id = createAnomalyId();
  const match = {
    id,
    partyAId: a.id,
    partyBId: b.id,
    choices: new Map(),
    status: "prompt",
    overlapId: "",
    createdAt: Date.now(),
    timeout: null
  };
  match.timeout = setTimeout(() => cancelAnomalyMatch(id, "timeout"), anomalyPromptTimeoutMs);
  anomalyMatches.set(id, match);
  a.anomalyId = id;
  b.anomalyId = id;
  relayToPlayer(a.hostPlayerId, {
    type: "anomaly.ready",
    encounterId: id,
    otherPartySize: b.players.length
  });
  relayToPlayer(b.hostPlayerId, {
    type: "anomaly.ready",
    encounterId: id,
    otherPartySize: a.players.length
  });
}

function handleAnomalyChoice(client, message) {
  const encounterId = sanitizeText(message.encounterId, 96);
  const match = anomalyMatches.get(encounterId);
  if (!match || match.status !== "prompt") {
    return;
  }
  const session = partySessions.get(client.partySessionId);
  if (!session || session.hostPlayerId !== client.playerId || (session.id !== match.partyAId && session.id !== match.partyBId)) {
    return;
  }

  const choice = message.choice === "investigate" ? "investigate" : "avoid";
  match.choices.set(session.id, choice);
  if (choice === "avoid") {
    cancelAnomalyMatch(match.id, "avoided");
    return;
  }
  if (match.choices.get(match.partyAId) === "investigate" && match.choices.get(match.partyBId) === "investigate") {
    startAnomalyMatch(match);
  }
}

function cancelAnomalyMatch(encounterId, reason) {
  const match = anomalyMatches.get(encounterId);
  if (!match) {
    return;
  }
  clearTimeout(match.timeout);
  anomalyMatches.delete(encounterId);
  for (const sessionId of [match.partyAId, match.partyBId]) {
    const session = partySessions.get(sessionId);
    if (!session) {
      continue;
    }
    session.anomalyId = "";
    relayToParty(session, {
      type: "anomaly.end",
      encounterId,
      reason
    });
  }
}

function startAnomalyMatch(match) {
  const partyA = partySessions.get(match.partyAId);
  const partyB = partySessions.get(match.partyBId);
  if (!partyA || !partyB || partyA.players.length !== partyB.players.length) {
    cancelAnomalyMatch(match.id, "unavailable");
    return;
  }

  clearTimeout(match.timeout);
  match.status = "active";
  match.endsAt = Date.now() + anomalyEncounterLifetimeMs;
  partyA.anomalyId = match.id;
  partyB.anomalyId = match.id;
  partyA.anomalyTeamId = partyA.id;
  partyB.anomalyTeamId = partyB.id;

  const overlap = startOverlap(partyA.players.concat(partyB.players), "anomaly");
  if (overlap) {
    overlap.anomalyEncounterId = match.id;
    overlap.partyTeams = new Map();
    for (const playerId of partyA.players) {
      overlap.partyTeams.set(playerId, partyA.id);
    }
    for (const playerId of partyB.players) {
      overlap.partyTeams.set(playerId, partyB.id);
    }
    match.overlapId = overlap.id;
    sendOverlapStart(overlap);
    broadcastOverlapTransform(overlap);
  }

  relayToParty(partyA, {
    type: "anomaly.start",
    encounterId: match.id,
    teamId: partyA.id,
    opposingTeamSize: partyB.players.length,
    endsAt: match.endsAt
  });
  relayToParty(partyB, {
    type: "anomaly.start",
    encounterId: match.id,
    teamId: partyB.id,
    opposingTeamSize: partyA.players.length,
    endsAt: match.endsAt
  });

  match.timeout = setTimeout(() => endAnomalyMatch(match.id, "separated"), anomalyEncounterLifetimeMs);
}

function endAnomalyMatch(encounterId, reason) {
  const match = anomalyMatches.get(encounterId);
  if (!match) {
    return;
  }
  clearTimeout(match.timeout);
  anomalyMatches.delete(encounterId);
  if (match.overlapId) {
    endOverlap(match.overlapId, reason || "anomaly-ended");
  }
  for (const sessionId of [match.partyAId, match.partyBId]) {
    const session = partySessions.get(sessionId);
    if (!session) {
      continue;
    }
    session.anomalyId = "";
    session.anomalyTeamId = "";
    relayToParty(session, {
      type: "anomaly.end",
      encounterId,
      reason: reason || "separated"
    });
  }
}

