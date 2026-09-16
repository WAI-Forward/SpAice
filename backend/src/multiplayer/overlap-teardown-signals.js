function leaveClientOverlaps(client, explicitLeave = false) {
  for (const overlapId of Array.from(client.overlaps)) {
    const overlap = overlaps.get(overlapId);
    if (!overlap) {
      client.overlaps.delete(overlapId);
      continue;
    }

    if (isJoinableOverlapRoom(overlap)) {
      client.overlaps.delete(overlapId);
      if (!explicitLeave && firstOnlineClient(client.playerId)) {
        sendRoomState(overlap);
        continue;
      }

      overlap.players = overlap.players.filter((playerId) => playerId !== client.playerId);
      if (!overlap.players.length) {
        endOverlap(overlapId, "empty");
      } else {
        sendOverlapStart(overlap);
        broadcastOverlapTransform(overlap);
        sendRoomState(overlap);
      }
      continue;
    }

    endOverlap(overlapId, "left");
  }
}

function endOverlap(overlapId, reason) {
  const overlap = overlaps.get(overlapId);
  if (!overlap) {
    logMultiplayer("overlap end skipped", {
      overlapId,
      reason,
      detail: "not found"
    });
    return;
  }

  overlaps.delete(overlapId);
  logMultiplayer("overlap ended", {
    overlapId,
    reason,
    players: overlap.players
  });
  for (const playerId of overlap.players) {
    playerCooldowns.set(playerId, Date.now() + randomSignalCooldownMs);
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      client.overlaps.delete(overlapId);
      sendWsJson(client, {
        type: "overlap.end",
        overlapId,
        reason
      });
    }
  }
}

function scanForRandomSignals() {
  scanForAnomalyMatches();
  return;

  const candidates = Array.from(sockets).filter((client) => {
    if (!client.playerId || !client.profile || !client.multiplayerOptIn || client.overlaps.size) {
      return false;
    }
    return (playerCooldowns.get(client.playerId) || 0) <= Date.now();
  });

  if (candidates.length >= 2) {
    logMultiplayer("signal scan", {
      candidates: candidates.map((client) => client.playerId)
    });
  }

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.playerId === b.playerId || havePendingSignal(a.playerId) || havePendingSignal(b.playerId)) {
        continue;
      }

      startRandomSignal(a, b);
      return;
    }
  }
}

function havePendingSignal(playerId) {
  for (const signal of pendingSignals.values()) {
    if (signal.players.includes(playerId)) {
      return true;
    }
  }
  return false;
}

setInterval(scanForRandomSignals, randomSignalIntervalMs);
setInterval(tickPartyV2Rooms, 1000 / mpV2Sim.TICK_RATE);
setInterval(() => {
  for (const overlap of Array.from(overlaps.values())) {
    broadcastOverlapTransform(overlap);
  }
}, 1000);

