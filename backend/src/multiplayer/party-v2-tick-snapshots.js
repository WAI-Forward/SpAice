const partyV2MaxElapsedSeconds = 0.25;
const partyV2MaxCatchUpSteps = 5;
const partyV2SharedSnapshotRate = 10;
const partyV2InterestRadius = 7000;
const partyV2InterestMargin = 2500;
const partyV2SurvivalEncounterInterestRadius = 24000;
let partyV2LastTickMs = monotonicMs();
let partyV2TickAccumulator = 0;

function partyV2SnapshotIntervalTicks(session) {
  if (isSharedWorldSession(session)) {
    return Math.max(
      mpV2Sim.SNAPSHOT_INTERVAL_TICKS || 1,
      Math.round((mpV2Sim.TICK_RATE || 60) / partyV2SharedSnapshotRate)
    );
  }
  return mpV2Sim.SNAPSHOT_INTERVAL_TICKS;
}

function stepPartyV2RoomsOnce() {
  for (const [sessionId, room] of Array.from(partyV2Rooms.entries())) {
    const session = partySessions.get(sessionId);
    if (!session || !isPartyV2Session(session)) {
      partyV2Rooms.delete(sessionId);
      continue;
    }
    if (isSharedWorldSession(session) && !session.players.length) {
      continue;
    }

    const inputs = {};
    const teamsByPlayerId = {};
    for (const playerId of session.players) {
      addPartyV2Player(room, session, playerId);
      if (isSharedWorldSession(session)) {
        teamsByPlayerId[playerId] = sharedWorldTeamIdForPlayer(session, playerId);
      }
      inputs[playerId] = popPartyV2Input(room, playerId);
    }

    const stepStart = monotonicMs();
    mpV2Sim.step(room.state, inputs, {
      dt: mpV2Sim.TICK_DT,
      enableMobs: true,
      duels: partyV2DuelPairsForSession(session),
      pvpMode: isSharedWorldSession(session) ? sharedWorldMode : session.pvpMode,
      worldMode: session.worldMode || "",
      gameMode: sanitizeGameMode(session.gameMode || room.state.gameMode || (isSharedWorldSession(session) ? "survival" : "horde")),
      teamsByPlayerId
    });
    if (isSharedWorldSession(session)) {
      markSharedWorldDirty();
      const now = Date.now();
      if (sharedWorldDirty && now - sharedWorldLastSaveAt >= sharedWorldSaveIntervalMs) {
        void saveSharedWorldRuntime("interval");
      }
    }
    if (room.perf) {
      room.perf.stepMsEma = smoothMetric(room.perf.stepMsEma, monotonicMs() - stepStart, 0.18);
      room.perf.entityCount = partyV2EntityCount(room.state.world);
    }
    if (Array.isArray(room.state.events) && room.state.events.length) {
      room.pendingEvents.push(...room.state.events);
      if (room.pendingEvents.length > 120) {
        room.pendingEvents.splice(0, room.pendingEvents.length - 120);
      }
    }

    if (room.state.tick - room.lastSnapshotTick >= partyV2SnapshotIntervalTicks(session)) {
      room.lastSnapshotTick = room.state.tick;
      session.worldSnapshot = buildPartyV2StartSnapshot(room);
      sendPartyV2Snapshot(session, room);
    }
  }
}

function tickPartyV2Rooms() {
  const now = monotonicMs();
  const rawElapsedSeconds = (now - partyV2LastTickMs) / 1000;
  const elapsedSeconds = Math.min(
    partyV2MaxElapsedSeconds,
    Math.max(0, Number.isFinite(rawElapsedSeconds) ? rawElapsedSeconds : mpV2Sim.TICK_DT)
  );
  partyV2LastTickMs = now;
  partyV2TickAccumulator = Math.min(
    partyV2MaxElapsedSeconds,
    partyV2TickAccumulator + elapsedSeconds
  );

  let steps = 0;
  while (partyV2TickAccumulator + 0.000001 >= mpV2Sim.TICK_DT && steps < partyV2MaxCatchUpSteps) {
    partyV2TickAccumulator -= mpV2Sim.TICK_DT;
    stepPartyV2RoomsOnce();
    steps += 1;
  }

  if (steps >= partyV2MaxCatchUpSteps) {
    partyV2TickAccumulator = Math.min(partyV2TickAccumulator, mpV2Sim.TICK_DT * partyV2MaxCatchUpSteps);
  }
}

function partyV2Finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function partyV2DistanceWithin(entity, centerX, centerY, radius) {
  if (!entity || !Number.isFinite(Number(entity.x)) || !Number.isFinite(Number(entity.y))) {
    return false;
  }
  const dx = Number(entity.x) - centerX;
  const dy = Number(entity.y) - centerY;
  const reach = radius + Math.max(0, Number(entity.radius) || 0);
  return dx * dx + dy * dy <= reach * reach;
}

function partyV2EntityId(entity) {
  if (!entity || entity.id === undefined || entity.id === null) {
    return "";
  }
  return String(Math.floor(Number(entity.id)));
}

function partyV2AddBodyId(target, value) {
  const id = Math.floor(Number(value));
  if (Number.isFinite(id) && id > 0) {
    target.add(String(id));
  }
}

function partyV2StructureTouchesBody(structure, bodyIds) {
  if (!structure || !bodyIds || !bodyIds.size) {
    return false;
  }
  return bodyIds.has(String(Math.floor(Number(structure.bodyId)))) ||
    bodyIds.has(String(Math.floor(Number(structure.linkedBodyId))));
}

function partyV2CollectForcedBodyIds(world, localPlayer, playerId) {
  const bodyIds = new Set();
  if (localPlayer && localPlayer.landed) {
    partyV2AddBodyId(bodyIds, localPlayer.landed.bodyId);
  }
  const structures = Array.isArray(world && world.structures) ? world.structures : [];
  for (let pass = 0; pass < 6; pass += 1) {
    let changed = false;
    for (const structure of structures) {
      if (!structure) {
        continue;
      }
      const owned = String(structure.ownerPlayerId || "") === String(playerId || "");
      if (!owned && !partyV2StructureTouchesBody(structure, bodyIds)) {
        continue;
      }
      const before = bodyIds.size;
      partyV2AddBodyId(bodyIds, structure.bodyId);
      partyV2AddBodyId(bodyIds, structure.linkedBodyId);
      changed = changed || bodyIds.size !== before;
    }
    if (!changed) {
      break;
    }
  }
  return bodyIds;
}

function buildPartyV2InterestState(serializedState, playerId) {
  const state = serializedState && typeof serializedState === "object" ? serializedState : {};
  const players = state.players && typeof state.players === "object" ? state.players : {};
  const world = state.world && typeof state.world === "object" ? state.world : {};
  const localPlayer = players[String(playerId || "")] || null;
  const centerX = partyV2Finite(localPlayer && localPlayer.x, 0);
  const centerY = partyV2Finite(localPlayer && localPlayer.y, 0);
  const radius = partyV2InterestRadius;
  const margin = partyV2InterestMargin;
  const includeRadius = radius + margin;
  const survivalEncounterIncludeRadius = sanitizeGameMode(state.gameMode || world.gameMode) === "survival"
    ? Math.max(includeRadius, partyV2SurvivalEncounterInterestRadius)
    : includeRadius;
  const forcedBodyIds = partyV2CollectForcedBodyIds(world, localPlayer, playerId);
  const includedBodyIds = new Set(forcedBodyIds);

  const particles = Array.isArray(world.particles)
    ? world.particles.filter((body) => {
      const id = partyV2EntityId(body);
      const campMarker = body && body.survivalCampBody
        ? { x: partyV2Finite(body.survivalCampX, body.x), y: partyV2Finite(body.survivalCampY, body.y) }
        : null;
      const included = forcedBodyIds.has(id) ||
        partyV2DistanceWithin(body, centerX, centerY, includeRadius) ||
        (campMarker && partyV2DistanceWithin(campMarker, centerX, centerY, survivalEncounterIncludeRadius));
      if (included && id) {
        includedBodyIds.add(id);
      }
      return included;
    })
    : [];

  const filterNear = (list) => Array.isArray(list)
    ? list.filter((entry) => partyV2DistanceWithin(entry, centerX, centerY, includeRadius))
    : [];
  const filterSurvivalEncounterOrNear = (list) => Array.isArray(list)
    ? list.filter((entry) => {
      if (partyV2DistanceWithin(entry, centerX, centerY, includeRadius)) {
        return true;
      }
      if (sanitizeGameMode(state.gameMode || world.gameMode) !== "survival") {
        return false;
      }
      if (entry && (entry.survivalEncounterType === "camp" || entry.survivalEncounterType === "hit-squad" || entry.survivalCampId)) {
        const marker = entry.survivalEncounterType === "camp" || entry.survivalCampId
          ? { x: partyV2Finite(entry.survivalCampX, entry.x), y: partyV2Finite(entry.survivalCampY, entry.y) }
          : entry;
        return partyV2DistanceWithin(marker, centerX, centerY, survivalEncounterIncludeRadius);
      }
      return false;
    })
    : [];
  const filterOwnedOrNear = (list) => Array.isArray(list)
    ? list.filter((entry) => String(entry && entry.ownerPlayerId || "") === String(playerId || "") || partyV2DistanceWithin(entry, centerX, centerY, includeRadius))
    : [];

  const structures = Array.isArray(world.structures)
    ? world.structures.filter((structure) => {
      return String(structure && structure.ownerPlayerId || "") === String(playerId || "") ||
        partyV2StructureTouchesBody(structure, includedBodyIds) ||
        partyV2DistanceWithin(structure, centerX, centerY, includeRadius);
    })
    : [];

  return {
    ...state,
    players,
    world: {
      ...world,
      partial: true,
      particles,
      techPickups: filterNear(world.techPickups),
      healthPickups: filterNear(world.healthPickups),
      alienoids: filterSurvivalEncounterOrNear(world.alienoids),
      ufos: filterSurvivalEncounterOrNear(world.ufos),
      rambots: filterSurvivalEncounterOrNear(world.rambots),
      engineers: filterSurvivalEncounterOrNear(world.engineers),
      teslas: filterSurvivalEncounterOrNear(world.teslas),
      rockets: filterSurvivalEncounterOrNear(world.rockets),
      fighters: filterSurvivalEncounterOrNear(world.fighters),
      mobBeacons: filterNear(world.mobBeacons),
      rivalProjectiles: filterOwnedOrNear(world.rivalProjectiles),
      structures,
      spacecrafts: filterOwnedOrNear(world.spacecrafts)
    }
  };
}

function sendPartyV2Snapshot(session, room) {
  const ackInputSeq = {};
  for (const playerId of session.players) {
    ackInputSeq[playerId] = room.lastAckByPlayerId.get(playerId) || 0;
  }
  const stateSnapshot = session.worldSnapshot && session.worldSnapshot.v2 && session.worldSnapshot.state
    ? session.worldSnapshot.state
    : mpV2Sim.serializeState(room.state);
  const events = Array.isArray(room.pendingEvents) ? room.pendingEvents.slice() : [];
  const sharedWorld = isSharedWorldSession(session);
  const includeSharedStats = sharedWorld && (
    !Number.isFinite(Number(room.lastSharedWorldStatsTick)) ||
    room.state.tick - Number(room.lastSharedWorldStatsTick) >= (mpV2Sim.TICK_RATE || 60)
  );
  const sharedWorldStats = includeSharedStats ? buildSharedWorldStats(session, room) : null;
  let totalSnapshotBytes = 0;
  let snapshotCount = 0;
  if (sharedWorld) {
    for (const playerId of session.players) {
      const interestState = buildPartyV2InterestState(stateSnapshot, playerId);
      const payload = {
        type: "mp.v2.snapshot",
        roomId: session.id,
        serverTick: room.state.tick,
        snapshotKind: "interest",
        interest: {
          centerX: partyV2Finite(interestState.players && interestState.players[playerId] && interestState.players[playerId].x, 0),
          centerY: partyV2Finite(interestState.players && interestState.players[playerId] && interestState.players[playerId].y, 0),
          radius: partyV2InterestRadius,
          margin: partyV2InterestMargin
        },
        ackInputSeq,
        state: interestState,
        events,
        perf: partyV2PerfPayload(room)
      };
      if (sharedWorldStats) {
        payload.sharedWorldStats = sharedWorldStats;
      }
      totalSnapshotBytes += Buffer.byteLength(JSON.stringify(payload.state));
      snapshotCount += 1;
      relayToPlayer(playerId, payload);
    }
    if (includeSharedStats) {
      room.lastSharedWorldStatsTick = room.state.tick;
    }
  } else {
    const payload = {
      type: "mp.v2.snapshot",
      roomId: session.id,
      serverTick: room.state.tick,
      snapshotKind: "bootstrap",
      ackInputSeq,
      state: stateSnapshot,
      events,
      perf: partyV2PerfPayload(room)
    };
    totalSnapshotBytes = Buffer.byteLength(JSON.stringify(payload.state));
    snapshotCount = 1;
    relayToParty(session, payload);
  }
  if (Array.isArray(room.pendingEvents)) {
    room.pendingEvents.length = 0;
  }
  if (room.perf) {
    room.perf.snapshotBytesEma = smoothMetric(room.perf.snapshotBytesEma, snapshotCount ? totalSnapshotBytes / snapshotCount : 0, 0.18);
    room.perf.maxInputQueue = 0;
  }
}

