function isPartyV2Session(session) {
  return Boolean(session && Number(session.netcodeVersion || 1) >= partyNetcodeVersion);
}

function createPartyV2Room(session) {
  if (!session || !isPartyV2Session(session)) {
    return null;
  }

  const players = session.players.map(publicLobbyPlayer);
  const state = mpV2Sim.createInitialState(session.worldSnapshot, players, {
    seed: session.id,
    maxPlayers: session.maxPlayers || partyLobbyMaxPlayers,
    gameMode: sanitizeGameMode(session.gameMode || (isSharedWorldSession(session) ? "survival" : "horde"))
  });
  state.gameMode = sanitizeGameMode(state.gameMode || session.gameMode || (isSharedWorldSession(session) ? "survival" : "horde"));
  if (state.world) {
    state.world.gameMode = state.gameMode;
  }
  for (const playerId of session.players) {
    mpV2Sim.addPlayer(state, publicLobbyPlayer(playerId));
  }

  const room = {
    sessionId: session.id,
    state,
    inputQueues: new Map(),
    lastInputs: new Map(),
    lastAckByPlayerId: new Map(),
    lastSnapshotTick: 0,
    pendingEvents: [],
    lastTouchedAt: Date.now(),
    perf: {
      stepMsEma: 0,
      snapshotBytesEma: 0,
      entityCount: partyV2EntityCount(state.world),
      maxInputQueue: 0
    }
  };
  partyV2Rooms.set(session.id, room);
  session.worldSnapshot = buildPartyV2StartSnapshot(room);
  return room;
}

function addPartyV2Player(room, session, playerId) {
  if (!room || !session || !playerId) {
    return null;
  }
  const client = firstOnlineClient(playerId);
  const snapshot = session.playerSnapshots && session.playerSnapshots.get(playerId);
  return mpV2Sim.addPlayer(room.state, {
    playerId,
    publicName: client && client.profile ? client.profile.publicName : playerId,
    teamId: sharedWorldTeamIdForPlayer(session, playerId)
  }, snapshot);
}

function syncSharedWorldPresenceSnapshot(client) {
  if (!client || !client.partySessionId || !client.lastSnapshot || !client.lastSnapshot.player) {
    return false;
  }
  const session = partySessions.get(client.partySessionId);
  if (!isSharedWorldSession(session)) {
    return false;
  }
  const room = partyV2Rooms.get(session.id);
  const statePlayer = room && room.state && room.state.players && room.state.players[client.playerId];
  if (!statePlayer) {
    return false;
  }
  const snapshot = client.lastSnapshot.player;
  statePlayer.score = Math.max(1, Math.round(clampNumber(snapshot.score, 1, 1000000000)));
  if (snapshot.name) {
    statePlayer.name = sanitizeText(snapshot.name, 40);
  }
  markSharedWorldDirty();
  return true;
}

function buildPartyV2StartSnapshot(room) {
  return {
    v2: true,
    state: mpV2Sim.serializeState(room.state)
  };
}

function monotonicMs() {
  return Number(process.hrtime.bigint()) / 1000000;
}

function smoothMetric(previous, next, weight) {
  const value = Number(next);
  if (!Number.isFinite(value)) {
    return Number(previous) || 0;
  }
  const current = Number(previous);
  if (!Number.isFinite(current) || current <= 0) {
    return value;
  }
  const blend = Number.isFinite(Number(weight)) ? Math.max(0, Math.min(1, Number(weight))) : 0.18;
  return current + (value - current) * blend;
}

function partyV2EntityCount(world) {
  const source = world && typeof world === "object" ? world : {};
  return [
    "particles",
    "techPickups",
    "healthPickups",
    "alienoids",
    "ufos",
    "rambots",
    "engineers",
    "teslas",
    "rockets",
    "fighters",
    "rivalProjectiles",
    "structures"
  ].reduce((total, key) => total + (Array.isArray(source[key]) ? source[key].length : 0), 0);
}

function partyV2PerfPayload(room) {
  const perf = room && room.perf ? room.perf : {};
  return {
    stepMs: Math.round((Number(perf.stepMsEma) || 0) * 100) / 100,
    snapshotBytes: Math.max(0, Math.round(Number(perf.snapshotBytesEma) || 0)),
    entityCount: Math.max(0, Math.round(Number(perf.entityCount) || 0)),
    maxInputQueue: Math.max(0, Math.round(Number(perf.maxInputQueue) || 0))
  };
}

function sharedWorldMobBreakdown(world) {
  const source = world && typeof world === "object" ? world : {};
  return {
    alienoids: Array.isArray(source.alienoids) ? source.alienoids.length : 0,
    ufos: Array.isArray(source.ufos) ? source.ufos.length : 0,
    rambots: Array.isArray(source.rambots) ? source.rambots.length : 0,
    engineers: Array.isArray(source.engineers) ? source.engineers.length : 0,
    teslas: Array.isArray(source.teslas) ? source.teslas.length : 0,
    rockets: Array.isArray(source.rockets) ? source.rockets.length : 0,
    fighters: Array.isArray(source.fighters) ? source.fighters.length : 0,
    beacons: Array.isArray(source.mobBeacons) ? source.mobBeacons.length : 0
  };
}

function sharedWorldBounds(world, players) {
  const points = [];
  const source = world && typeof world === "object" ? world : {};
  for (const key of [
    "particles",
    "structures",
    "spacecrafts",
    "techPickups",
    "healthPickups",
    "alienoids",
    "ufos",
    "rambots",
    "engineers",
    "teslas",
    "rockets",
    "fighters",
    "mobBeacons",
    "rivalProjectiles"
  ]) {
    if (Array.isArray(source[key])) {
      for (const entry of source[key]) {
        if (entry && Number.isFinite(Number(entry.x)) && Number.isFinite(Number(entry.y))) {
          points.push({ x: Number(entry.x), y: Number(entry.y) });
        }
      }
    }
  }
  for (const entry of Object.values(players || {})) {
    if (entry && Number.isFinite(Number(entry.x)) && Number.isFinite(Number(entry.y))) {
      points.push({ x: Number(entry.x), y: Number(entry.y) });
    }
  }
  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, area: 0, radiusFromOrigin: 0 };
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  let radiusFromOrigin = 0;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
    radiusFromOrigin = Math.max(radiusFromOrigin, Math.hypot(point.x, point.y));
  }
  const width = maxX - minX;
  const height = maxY - minY;
  return { minX, minY, maxX, maxY, width, height, area: width * height, radiusFromOrigin };
}

function sharedWorldBodyScoreForPlayer(world, playerState) {
  const source = world && typeof world === "object" ? world : {};
  const particles = Array.isArray(source.particles) ? source.particles : [];
  const structures = Array.isArray(source.structures) ? source.structures : [];
  const bodyById = new Map();
  for (const body of particles) {
    if (body && Number.isFinite(Number(body.id))) {
      bodyById.set(Math.floor(Number(body.id)), body);
    }
  }
  const playerId = String(playerState && playerState.id || "");
  const bodyIds = new Set();
  for (const structure of structures) {
    if (!structure || String(structure.ownerPlayerId || "") !== playerId) {
      continue;
    }
    if (bodyById.has(Math.floor(Number(structure.bodyId)))) {
      bodyIds.add(Math.floor(Number(structure.bodyId)));
    }
    if (bodyById.has(Math.floor(Number(structure.linkedBodyId)))) {
      bodyIds.add(Math.floor(Number(structure.linkedBodyId)));
    }
  }
  if (!bodyIds.size && playerState && playerState.landed && bodyById.has(Math.floor(Number(playerState.landed.bodyId)))) {
    bodyIds.add(Math.floor(Number(playerState.landed.bodyId)));
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const structure of structures) {
      if (!structure || !structure.linkedBodyId) {
        continue;
      }
      const firstId = Math.floor(Number(structure.bodyId));
      const secondId = Math.floor(Number(structure.linkedBodyId));
      const firstKnown = bodyIds.has(firstId);
      const secondKnown = bodyIds.has(secondId);
      if (firstKnown && !secondKnown && bodyById.has(secondId)) {
        bodyIds.add(secondId);
        changed = true;
      } else if (secondKnown && !firstKnown && bodyById.has(firstId)) {
        bodyIds.add(firstId);
        changed = true;
      }
    }
  }
  let mass = 0;
  for (const bodyId of bodyIds) {
    const body = bodyById.get(bodyId);
    mass += Math.max(0, Number(body && body.mass) || 0);
  }
  return Math.max(1, Math.round(Math.max(Number(playerState && playerState.score) || 0, mass)));
}

function sharedWorldTopPlayer(session, state) {
  const players = state && state.players && typeof state.players === "object" ? state.players : {};
  let top = null;
  for (const [playerId, playerState] of Object.entries(players)) {
    if (!playerState) {
      continue;
    }
    const entry = publicLobbyPlayer(playerId);
    const score = sharedWorldBodyScoreForPlayer(state.world, { ...playerState, id: playerId });
    const candidate = {
      playerId,
      publicName: entry.publicName || playerState.name || playerId,
      online: Boolean(entry.online),
      score
    };
    if (!top || candidate.score > top.score || (candidate.score === top.score && candidate.publicName.localeCompare(top.publicName) < 0)) {
      top = candidate;
    }
  }
  if (!top && session && session.playerSnapshots instanceof Map) {
    for (const [playerId, snapshot] of session.playerSnapshots.entries()) {
      const entry = publicLobbyPlayer(playerId);
      const score = Math.max(1, Math.round(Number(snapshot && snapshot.score) || 1));
      const candidate = {
        playerId,
        publicName: entry.publicName || snapshot && snapshot.name || playerId,
        online: Boolean(entry.online),
        score
      };
      if (!top || candidate.score > top.score || (candidate.score === top.score && candidate.publicName.localeCompare(top.publicName) < 0)) {
        top = candidate;
      }
    }
  }
  return top || { playerId: "", publicName: "No players yet", online: false, score: 0 };
}

function buildSharedWorldStats(session, room) {
  const state = room && room.state ? mpV2Sim.serializeState(room.state) : session && session.worldSnapshot && session.worldSnapshot.state ? session.worldSnapshot.state : null;
  const world = state && state.world && typeof state.world === "object" ? state.world : {};
  const players = state && state.players && typeof state.players === "object" ? state.players : {};
  const mobBreakdown = sharedWorldMobBreakdown(world);
  const mobCount = Object.values(mobBreakdown).reduce((total, value) => total + value, 0);
  const particles = Array.isArray(world.particles) ? world.particles : [];
  const largestBody = particles.reduce((best, body) => {
    const mass = Math.max(0, Number(body && body.mass) || 0);
    return !best || mass > best.mass ? {
      id: body.id,
      mass,
      tier: body.tier && body.tier.name || "",
      x: Number(body.x) || 0,
      y: Number(body.y) || 0
    } : best;
  }, null);
  const blackHoles = particles.filter((body) => body && body.tier && body.tier.name === "black hole").length;
  const bosses = ["alienoids", "ufos", "rambots", "engineers", "teslas", "rockets", "fighters"].reduce((total, key) => {
    return total + (Array.isArray(world[key]) ? world[key].filter((mob) => mob && mob.isBoss).length : 0);
  }, 0);
  const activeEventSource = world.randomEvents && world.randomEvents.active && world.randomEvents.active.id
    ? world.randomEvents.active
    : null;
  const activeEventTimer = activeEventSource
    ? Math.max(0, clampNumber(activeEventSource.timer, 0, 100000) || clampNumber(activeEventSource.duration, 0, 100000) - clampNumber(activeEventSource.elapsed, 0, 100000))
    : 0;
  const activeEvent = activeEventSource && activeEventTimer > 0
    ? {
      id: String(activeEventSource.id),
      timer: activeEventTimer
    }
    : null;

  return {
    id: sharedWorldStorageId,
    worldMode: sharedWorldMode,
    gameMode: "survival",
    status: session && session.players && session.players.length ? "active" : "idle",
    runningSeconds: Math.max(0, Math.round((Number(state && state.tick) || 0) / (mpV2Sim.TICK_RATE || 60))),
    tick: Math.max(0, Math.floor(Number(state && state.tick) || 0)),
    observedAt: Date.now(),
    savedAt: Math.max(0, Number(sharedWorldLastSaveAt) || 0),
    onlinePlayers: session && Array.isArray(session.players) ? session.players.length : 0,
    knownPlayers: Object.keys(players).length,
    maxPlayers: sharedWorldMaxPlayers,
    teamCount: session && session.teams instanceof Map ? session.teams.size : 0,
    topPlayer: sharedWorldTopPlayer(session, state),
    world: {
      bounds: sharedWorldBounds(world, players),
      particles: particles.length,
      totalMass: particles.reduce((total, body) => total + Math.max(0, Number(body && body.mass) || 0), 0),
      largestBody,
      blackHoles,
      mobCount,
      mobBreakdown,
      bosses,
      structures: Array.isArray(world.structures) ? world.structures.length : 0,
      spacecrafts: Array.isArray(world.spacecrafts) ? world.spacecrafts.length : 0,
      techPickups: Array.isArray(world.techPickups) ? world.techPickups.length : 0,
      healthPickups: Array.isArray(world.healthPickups) ? world.healthPickups.length : 0,
      projectiles: Array.isArray(world.rivalProjectiles) ? world.rivalProjectiles.length : 0,
      activeEvent,
      entityCount: partyV2EntityCount(world) + (Array.isArray(world.mobBeacons) ? world.mobBeacons.length : 0)
    },
    server: {
      dirty: Boolean(sharedWorldDirty),
      saveIntervalMs: sharedWorldSaveIntervalMs
    }
  };
}

function isSharedWorldSession(session) {
  return Boolean(session && (session.id === sharedWorldSessionId || session.worldMode === sharedWorldMode));
}

function sanitizeTeamId(value) {
  return sanitizeText(value, 96).replace(/[^\w.-]/g, "").slice(0, 80);
}

function createSharedWorldTeamId() {
  return `team-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

function normalizeSharedWorldTeam(source) {
  const team = source && typeof source === "object" ? source : {};
  const teamId = sanitizeTeamId(team.teamId || team.id);
  const members = Array.isArray(team.members)
    ? Array.from(new Set(team.members.map((member) => sanitizeText(member, 80)).filter(Boolean))).slice(0, sharedWorldTeamMaxPlayers)
    : [];
  if (!teamId || !members.length) {
    return null;
  }
  return {
    teamId,
    members,
    createdAt: Math.max(0, Number(team.createdAt) || Date.now()),
    updatedAt: Math.max(0, Number(team.updatedAt) || Date.now())
  };
}

function publicSharedWorldTeam(team) {
  const normalized = normalizeSharedWorldTeam(team);
  return normalized ? { ...normalized, members: normalized.members.slice() } : null;
}

function sharedWorldTeamsArray(session) {
  if (!session || !(session.teams instanceof Map)) {
    return [];
  }
  return Array.from(session.teams.values()).map(publicSharedWorldTeam).filter(Boolean);
}

function rebuildSharedWorldTeamIndex(session) {
  if (!session || !(session.teams instanceof Map)) {
    return;
  }
  session.playerTeams = new Map();
  for (const [teamId, team] of Array.from(session.teams.entries())) {
    const normalized = normalizeSharedWorldTeam(team);
    if (!normalized) {
      session.teams.delete(teamId);
      continue;
    }
    session.teams.set(normalized.teamId, normalized);
    for (const memberId of normalized.members) {
      session.playerTeams.set(memberId, normalized.teamId);
    }
  }
}

async function handleSharedWorldJoin(client) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "shared.world.join.failed", message: "Multiplayer is off." });
    return;
  }

  const { session, room } = await ensureSharedWorldSession();
  if (!session || !room) {
    sendWsJson(client, { type: "shared.world.join.failed", message: "Shared world unavailable." });
    return;
  }
  if (!session.players.includes(client.playerId) && session.players.length >= sharedWorldMaxPlayers) {
    sendWsJson(client, { type: "shared.world.join.failed", message: "Shared world is full." });
    return;
  }

  if (client.lobbyId) {
    leaveClientLobby(client, true);
  }
  if (client.partySessionId && client.partySessionId !== session.id) {
    leaveClientParty(client);
  }

  if (!session.playerSnapshots.has(client.playerId) && client.lastSnapshot && client.lastSnapshot.player) {
    session.playerSnapshots.set(client.playerId, {
      ...client.lastSnapshot.player,
      teamId: sharedWorldTeamIdForPlayer(session, client.playerId)
    });
  }
  if (!session.players.includes(client.playerId)) {
    session.players.push(client.playerId);
  }
  addPartyV2Player(room, session, client.playerId);
  setSharedWorldPlayerTeam(session, room, client.playerId, sharedWorldTeamIdForPlayer(session, client.playerId));

  client.lobbyId = "";
  client.partySessionId = session.id;
  assignClientParty(client.playerId, session.id);
  session.worldSnapshot = buildPartyV2StartSnapshot(room);
  markSharedWorldDirty();

  sendWsJson(client, {
    type: "party.start",
    session: publicPartySession(session),
    snapshot: session.worldSnapshot
  });
  relayToParty(session, {
    type: "party.state",
    session: publicPartySession(session)
  }, client.playerId);
}

