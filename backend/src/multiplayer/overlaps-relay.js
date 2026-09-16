function addToFriendOverlap(inviterId, targetId) {
  for (const overlap of overlaps.values()) {
    if (overlap.type !== "friend" || !overlap.players.includes(inviterId) || overlap.players.includes(targetId)) {
      continue;
    }

    if (overlap.players.length < overlapRoomMaxPlayers) {
      overlap.players.push(targetId);
      return overlap.players.slice();
    }
  }

  return [inviterId, targetId];
}

function startRandomSignal(a, b) {
  const key = [a.playerId, b.playerId].sort().join("|");
  if (pendingSignals.has(key)) {
    logMultiplayer("signal skipped", {
      signalId: key,
      reason: "already pending"
    });
    return;
  }

  const signal = {
    id: key,
    players: [a.playerId, b.playerId],
    choices: new Map(),
    createdAt: Date.now(),
    timeout: null
  };
  signal.timeout = setTimeout(() => cancelSignal(key, "timeout"), signalTimeoutMs);
  pendingSignals.set(key, signal);

  logMultiplayer("signal created", {
    signalId: key,
    players: signal.players,
    names: [a.profile && a.profile.publicName, b.profile && b.profile.publicName]
  });
  sendSignalDetected(a, signal, b);
  sendSignalDetected(b, signal, a);
}

function sendSignalDetected(client, signal, otherClient) {
  sendWsJson(client, {
    type: "signal.detected",
    signalId: signal.id,
    expiresAt: signal.createdAt + signalTimeoutMs,
    other: publicPresence(otherClient)
  });
}

function publicPresence(client) {
  return {
    playerId: client.playerId,
    universeId: client.universeId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    online: true
  };
}

function startOverlap(playerIds, type) {
  const overlapType = normalizeRoomMode(type);
  const uniquePlayers = playerIds
    .filter(uniqueOnly)
    .filter((playerId) => {
      const client = firstOnlineClient(playerId);
      return Boolean(client && (!isJoinableRoomMode(overlapType) || client.multiplayerOptIn));
    });
  if (uniquePlayers.length < 2 && overlapType !== "world-overlap") {
    logMultiplayer("overlap skipped", {
      type,
      requestedPlayers: playerIds,
      onlinePlayers: uniquePlayers,
      reason: "not enough online players"
    });
    return null;
  }

  const existingFriend = overlapType === "friend" ? findFriendOverlap(uniquePlayers) : null;
  const overlap =
    existingFriend ||
    {
      id: `overlap-${Date.now().toString(36)}-${nextOverlapNumber++}`,
      type: overlapType,
      players: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      baseAngle: Math.random() * Math.PI * 2
    };

  for (const playerId of uniquePlayers) {
    if (!overlap.players.includes(playerId) && overlap.players.length < overlapRoomMaxPlayers) {
      overlap.players.push(playerId);
    }
  }

  overlaps.set(overlap.id, overlap);
  logMultiplayer("overlap started", {
    overlapId: overlap.id,
    type: overlap.type,
    players: overlap.players
  });
  sendOverlapStart(overlap);

  broadcastOverlapTransform(overlap);
  sendRoomState(overlap);
  return overlap;
}

function sendOverlapStart(overlap) {
  for (const playerId of overlap.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      client.overlaps.add(overlap.id);
      sendWsJson(client, {
        type: "overlap.start",
        overlapId: overlap.id,
        mode: overlap.type,
        phase: overlapPhase(overlap).phase,
        bubbleRadius,
        participants: overlap.players.map((participantId) => {
          const participant = firstOnlineClient(participantId);
          const presence = participant ? publicPresence(participant) : { playerId: participantId, universeId: soloWorldId(participantId) };
          presence.teamId = overlap.partyTeams ? overlap.partyTeams.get(participantId) || "" : "";
          presence.partySessionId = participant ? participant.partySessionId || "" : "";
          return presence;
        })
      });
    }
  }
}

function findFriendOverlap(playerIds) {
  for (const overlap of overlaps.values()) {
    if (overlap.type === "friend" && playerIds.some((playerId) => overlap.players.includes(playerId))) {
      return overlap;
    }
  }
  return null;
}

function overlapPhase(overlap) {
  if (overlap.type === "friend" || overlap.type === "world-overlap") {
    return { phase: "overlap", progress: 1, alpha: 1, distance: 2300 };
  }

  const age = Date.now() - overlap.createdAt;
  if (age < 18000) {
    const progress = clampNumber(age / 18000, 0, 1);
    return { phase: "approach", progress, alpha: progress, distance: 8200 - progress * 5900 };
  }
  if (age < 90000) {
    return { phase: "overlap", progress: 1, alpha: 1, distance: 2300 };
  }
  if (age < randomOverlapLifetimeMs) {
    const progress = clampNumber((age - 90000) / (randomOverlapLifetimeMs - 90000), 0, 1);
    return { phase: "separation", progress: 1 - progress, alpha: 1 - progress, distance: 2300 + progress * 6500 };
  }
  return { phase: "ended", progress: 0, alpha: 0, distance: 9000 };
}

function universePositionFor(overlap, playerId, phase) {
  const index = overlap.players.indexOf(playerId);
  const count = Math.max(1, overlap.players.length);
  const angle = overlap.baseAngle + (Math.PI * 2 * index) / count;
  const radius = phase.distance / Math.max(1, count === 2 ? 2 : 1.45);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

function transformsForClient(overlap, client) {
  const phase = overlapPhase(overlap);
  const ownPosition = universePositionFor(overlap, client.playerId, phase);

  return overlap.players
    .filter((playerId) => playerId !== client.playerId)
    .map((playerId) => {
      const remotePosition = universePositionFor(overlap, playerId, phase);
      const remoteClient = firstOnlineClient(playerId);
      return {
        playerId,
        universeId: soloWorldId(playerId),
        publicName: remoteClient && remoteClient.profile ? remoteClient.profile.publicName : playerId,
        partySessionId: remoteClient ? remoteClient.partySessionId || "" : "",
        teamId: overlap.partyTeams ? overlap.partyTeams.get(playerId) || "" : "",
        offsetX: remotePosition.x - ownPosition.x,
        offsetY: remotePosition.y - ownPosition.y,
        alpha: phase.alpha,
        phase: phase.phase,
        bubbleRadius
      };
    });
}

function broadcastOverlapTransform(overlap) {
  const phase = overlapPhase(overlap);
  if (phase.phase === "ended") {
    endOverlap(overlap.id, "separated");
    return;
  }

  for (const playerId of overlap.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      sendWsJson(client, {
        type: "overlap.transform",
        overlapId: overlap.id,
        mode: overlap.type,
        phase: phase.phase,
        transforms: transformsForClient(overlap, client)
      });
    }
  }

  if (overlap.lastLoggedPhase !== phase.phase) {
    overlap.lastLoggedPhase = phase.phase;
    logMultiplayer("overlap phase", {
      overlapId: overlap.id,
      type: overlap.type,
      phase: phase.phase,
      players: overlap.players
    });
  }
}

function relayOverlapSnapshot(sender) {
  if (!sender.lastSnapshot) {
    return;
  }

  for (const overlapId of sender.overlaps) {
    const overlap = overlaps.get(overlapId);
    if (!overlap) {
      continue;
    }

    for (const playerId of overlap.players) {
      if (playerId === sender.playerId) {
        continue;
      }

      const clients = clientsByPlayerId.get(playerId);
      if (!clients) {
        continue;
      }

      for (const receiver of clients) {
        const transform = transformsForClient(overlap, receiver).find((candidate) => candidate.playerId === sender.playerId);
        sendWsJson(receiver, {
          type: "overlap.snapshot",
          overlapId,
          fromPlayerId: sender.playerId,
          universeId: sender.universeId,
          publicName: sender.profile ? sender.profile.publicName : sender.playerId,
          transform,
          snapshot: sender.lastSnapshot
        });
      }
    }
  }
}

function relayEntityEffect(sender, message) {
  const targetUniverseId = sanitizeText(message.targetUniverseId, 96);
  const targetPlayerId = targetUniverseId.startsWith("solo:") ? targetUniverseId.slice(5) : sanitizeText(message.targetPlayerId, 80);
  if (!targetPlayerId || targetPlayerId === sender.playerId) {
    logMultiplayer("entity effect rejected", {
      fromPlayerId: sender.playerId,
      targetUniverseId,
      targetPlayerId,
      reason: "invalid target"
    });
    return;
  }

  const delivered = relayToPlayer(targetPlayerId, {
    type: "entity.effect",
    fromPlayerId: sender.playerId,
    fromTeamId: partySessions.get(sender.partySessionId)?.anomalyTeamId || "",
    fromUniverseId: sender.universeId,
    targetUniverseId,
    effect: message.effect || null
  });
  logMultiplayer("entity effect relayed", {
    fromPlayerId: sender.playerId,
    targetPlayerId,
    targetUniverseId,
    delivered
  });
}

function relayPlayerDeath(sender, message) {
  const x = clampNumber(message.x, -1000000, 1000000);
  const y = clampNumber(message.y, -1000000, 1000000);
  const vx = clampNumber(message.vx, -1200, 1200);
  const vy = clampNumber(message.vy, -1200, 1200);

  for (const overlapId of sender.overlaps) {
    const overlap = overlaps.get(overlapId);
    if (!overlap) {
      continue;
    }

    const phase = overlapPhase(overlap);
    if (phase.phase !== "overlap") {
      continue;
    }

    for (const playerId of overlap.players) {
      if (playerId === sender.playerId) {
        continue;
      }

      const clients = clientsByPlayerId.get(playerId);
      if (!clients) {
        continue;
      }

      for (const receiver of clients) {
        const transform = transformsForClient(overlap, receiver).find((candidate) => candidate.playerId === sender.playerId);
        sendWsJson(receiver, {
          type: "player.death",
          fromPlayerId: sender.playerId,
          fromName: sender.profile ? sender.profile.publicName : sender.playerId,
          x,
          y,
          vx,
          vy,
          transform
        });
      }
    }
  }
}

