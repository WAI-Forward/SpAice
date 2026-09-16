function saveSharedWorldPlayerSnapshot(session, room, playerId) {
  if (!isSharedWorldSession(session) || !room || !room.state || !room.state.players) {
    return false;
  }
  const cleanPlayerId = sanitizeText(playerId, 80);
  const snapshot = mpV2Sim.serializeState(room.state).players[cleanPlayerId];
  if (!snapshot) {
    return false;
  }
  snapshot.teamId = sharedWorldTeamIdForPlayer(session, cleanPlayerId);
  session.playerSnapshots.set(cleanPlayerId, snapshot);
  return true;
}

function leaveSharedWorld(client, explicitLeave) {
  if (!client || !client.partySessionId) {
    return;
  }
  const session = partySessions.get(client.partySessionId);
  if (!isSharedWorldSession(session)) {
    return;
  }
  const room = partyV2Rooms.get(session.id);
  const playerId = client.playerId;
  client.partySessionId = "";
  if (!playerId || (!explicitLeave && firstOnlineClient(playerId))) {
    return;
  }

  if (room) {
    saveSharedWorldPlayerSnapshot(session, room, playerId);
    mpV2Sim.removePlayer(room.state, playerId);
    room.inputQueues.delete(playerId);
    room.lastInputs.delete(playerId);
    room.lastAckByPlayerId.delete(playerId);
  }
  session.players = session.players.filter((candidate) => candidate !== playerId);
  markSharedWorldDirty();

  relayToParty(session, {
    type: "party.state",
    session: publicPartySession(session)
  });
  if (!session.players.length || explicitLeave) {
    void saveSharedWorldRuntime(explicitLeave ? "leave" : "disconnect");
  }
}

function sharedWorldTeamIdForPlayer(session, playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!isSharedWorldSession(session) || !cleanPlayerId) {
    return "";
  }
  if (!(session.playerTeams instanceof Map)) {
    rebuildSharedWorldTeamIndex(session);
  }
  return sanitizeTeamId(session.playerTeams && session.playerTeams.get(cleanPlayerId));
}

function setSharedWorldPlayerTeam(session, room, playerId, teamId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  const cleanTeamId = sanitizeTeamId(teamId);
  if (!isSharedWorldSession(session) || !cleanPlayerId) {
    return false;
  }
  if (!(session.playerTeams instanceof Map)) {
    rebuildSharedWorldTeamIndex(session);
  }
  if (cleanTeamId) {
    session.playerTeams.set(cleanPlayerId, cleanTeamId);
  } else {
    session.playerTeams.delete(cleanPlayerId);
  }
  if (room && room.state && room.state.players && room.state.players[cleanPlayerId]) {
    mpV2Sim.setPlayerTeam(room.state, cleanPlayerId, cleanTeamId);
  }
  const snapshot = session.playerSnapshots && session.playerSnapshots.get(cleanPlayerId);
  if (snapshot && typeof snapshot === "object") {
    snapshot.teamId = cleanTeamId;
  }
  return true;
}

function removeSharedWorldPlayerFromTeam(session, room, playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!isSharedWorldSession(session) || !cleanPlayerId || !(session.teams instanceof Map)) {
    return "";
  }
  let removedTeamId = "";
  for (const [teamId, team] of Array.from(session.teams.entries())) {
    if (!team.members.includes(cleanPlayerId)) {
      continue;
    }
    team.members = team.members.filter((memberId) => memberId !== cleanPlayerId);
    team.updatedAt = Date.now();
    removedTeamId = teamId;
    if (!team.members.length) {
      session.teams.delete(teamId);
    } else {
      session.teams.set(teamId, team);
    }
  }
  rebuildSharedWorldTeamIndex(session);
  setSharedWorldPlayerTeam(session, room, cleanPlayerId, "");
  return removedTeamId;
}

function pruneSharedWorldTeams(session) {
  if (!isSharedWorldSession(session) || !(session.teams instanceof Map)) {
    return;
  }
  const now = Date.now();
  const knownPlayers = new Set([
    ...(session.players || []),
    ...(session.playerSnapshots instanceof Map ? Array.from(session.playerSnapshots.keys()) : [])
  ]);
  const activePlayers = new Set(session.players || []);
  for (const [teamId, team] of Array.from(session.teams.entries())) {
    team.members = team.members.filter((memberId) => knownPlayers.has(memberId));
    const hasActiveMember = team.members.some((memberId) => activePlayers.has(memberId));
    if (!team.members.length || (!hasActiveMember && now - Math.max(0, Number(team.updatedAt) || 0) > sharedWorldOfflineTeamRetentionMs)) {
      session.teams.delete(teamId);
    }
  }
  rebuildSharedWorldTeamIndex(session);
}

function sharedWorldPlayerRows(session, room) {
  const rows = new Map();
  if (session && session.playerSnapshots instanceof Map) {
    for (const [playerId, snapshot] of session.playerSnapshots.entries()) {
      rows.set(playerId, {
        playerId,
        state: snapshot && typeof snapshot === "object" ? snapshot : null,
        teamId: sharedWorldTeamIdForPlayer(session, playerId)
      });
    }
  }
  if (room && room.state && room.state.players) {
    const activePlayers = mpV2Sim.serializeState(room.state).players || {};
    for (const [playerId, snapshot] of Object.entries(activePlayers)) {
      rows.set(playerId, {
        playerId,
        state: snapshot,
        teamId: sharedWorldTeamIdForPlayer(session, playerId)
      });
    }
  }
  return Array.from(rows.values()).filter((row) => row.playerId && row.state);
}

async function loadSharedWorldStorage() {
  const pool = await getDbPool();
  if (!pool) {
    const stored = memoryPersistence.sharedWorlds.get(sharedWorldStorageId) || null;
    const players = new Map();
    for (const [playerId, entry] of memoryPersistence.sharedPlayers.entries()) {
      if (!entry || entry.worldId !== sharedWorldStorageId) {
        continue;
      }
      players.set(playerId, {
        state: entry.state || null,
        teamId: sanitizeTeamId(entry.teamId)
      });
    }
    return {
      state: stored && stored.state ? stored.state : null,
      teams: Array.isArray(stored && stored.teams) ? stored.teams.map(normalizeSharedWorldTeam).filter(Boolean) : [],
      players
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("SELECT state FROM clusternauts_shared_world_state WHERE id = $1", [sharedWorldStorageId]);
  const stored = worldResult.rows[0] && worldResult.rows[0].state || null;
  const playerResult = await pool.query(
    "SELECT player_id, state, team_id FROM clusternauts_shared_player_state WHERE world_id = $1",
    [sharedWorldStorageId]
  );
  const players = new Map();
  for (const row of playerResult.rows) {
    const playerId = sanitizeText(row.player_id, 80);
    if (playerId) {
      players.set(playerId, {
        state: row.state || null,
        teamId: sanitizeTeamId(row.team_id)
      });
    }
  }
  return {
    state: stored && stored.state ? stored.state : null,
    teams: Array.isArray(stored && stored.teams) ? stored.teams.map(normalizeSharedWorldTeam).filter(Boolean) : [],
    players
  };
}

let sharedWorldLoadPromise = null;
let sharedWorldSavePromise = null;
let sharedWorldDirty = false;
let sharedWorldLastSaveAt = 0;

async function waitForSharedWorldSaveIdle() {
  if (!sharedWorldSavePromise) {
    return;
  }
  try {
    await sharedWorldSavePromise;
  } catch {
    // A reset should still proceed if an older autosave failed.
  }
}

function createFreshSharedWorldState(partyPlayers) {
  const state = mpV2Sim.createInitialState(
    { run: { difficulty: "medium", gameMode: "survival" }, world: { difficulty: "medium", gameMode: "survival", ambientParticleSpawning: true } },
    Array.isArray(partyPlayers) ? partyPlayers : [],
    { seed: sharedWorldStorageId, maxPlayers: sharedWorldMaxPlayers, gameMode: "survival" }
  );
  state.gameMode = "survival";
  if (state.world) {
    state.world.gameMode = "survival";
  }
  state.events = [];
  return state;
}

function resetSharedWorldRuntime(kind) {
  const session = partySessions.get(sharedWorldSessionId);
  const room = partyV2Rooms.get(sharedWorldSessionId);
  if (!session || !room) {
    sharedWorldDirty = false;
    sharedWorldLastSaveAt = 0;
    return null;
  }

  const resetKind = kind === "world" || kind === "players" ? kind : "all";
  const playerIds = Array.isArray(session.players) ? session.players.slice() : [];
  const partyPlayers = playerIds.map(publicLobbyPlayer);
  const previousState = room.state ? mpV2Sim.serializeState(room.state) : null;
  let nextState;

  if (resetKind === "players") {
    nextState = previousState || createFreshSharedWorldState([]);
    nextState.players = {};
    nextState.events = [];
    for (const entry of partyPlayers) {
      mpV2Sim.addPlayer(nextState, entry);
    }
  } else {
    nextState = createFreshSharedWorldState(resetKind === "world" ? [] : partyPlayers);
    if (resetKind === "world" && previousState && previousState.players) {
      nextState.players = previousState.players;
      for (const entry of partyPlayers) {
        mpV2Sim.addPlayer(nextState, entry);
      }
    }
  }

  if (resetKind === "players" || resetKind === "all") {
    session.playerSnapshots.clear();
  }
  if (resetKind === "all") {
    session.teams.clear();
    session.playerTeams.clear();
  } else {
    rebuildSharedWorldTeamIndex(session);
  }

  for (const playerId of playerIds) {
    setSharedWorldPlayerTeam(session, { state: nextState }, playerId, sharedWorldTeamIdForPlayer(session, playerId));
  }

  room.state = nextState;
  room.inputQueues.clear();
  room.lastInputs.clear();
  room.lastAckByPlayerId.clear();
  room.lastSnapshotTick = Math.max(0, Math.floor(Number(nextState.tick) || 0));
  room.pendingEvents = [];
  room.lastTouchedAt = Date.now();
  if (room.perf) {
    room.perf.stepMsEma = 0;
    room.perf.snapshotBytesEma = 0;
    room.perf.entityCount = partyV2EntityCount(nextState.world);
    room.perf.maxInputQueue = 0;
  }

  session.worldSnapshot = buildPartyV2StartSnapshot(room);
  markSharedWorldDirty();
  return { session, room };
}

function finishSharedWorldRuntimeReset(reset, kind) {
  if (!reset || !reset.session || !reset.room) {
    return;
  }
  relayToParty(reset.session, {
    type: "party.state",
    session: publicPartySession(reset.session)
  });
  sendPartyV2Snapshot(reset.session, reset.room);
  void saveSharedWorldRuntime("reset-" + sanitizeText(kind, 32));
}

async function ensureSharedWorldSession() {
  const existingSession = partySessions.get(sharedWorldSessionId);
  const existingRoom = partyV2Rooms.get(sharedWorldSessionId);
  if (existingSession && existingRoom) {
    return { session: existingSession, room: existingRoom };
  }
  if (sharedWorldLoadPromise) {
    return sharedWorldLoadPromise;
  }

  sharedWorldLoadPromise = (async () => {
    const stored = await loadSharedWorldStorage();
    const storedState = stored.state && stored.state.world ? mpV2Sim.serializeState(stored.state) : null;
    const state = storedState || createFreshSharedWorldState([]);
    state.gameMode = "survival";
    if (state.world) {
      state.world.gameMode = "survival";
    }
    state.players = {};
    state.events = [];

    const teams = new Map();
    for (const team of stored.teams || []) {
      const normalized = normalizeSharedWorldTeam(team);
      if (normalized) {
        teams.set(normalized.teamId, normalized);
      }
    }

    const playerSnapshots = new Map();
    for (const [playerId, entry] of stored.players.entries()) {
      if (entry && entry.state) {
        const snapshot = { ...entry.state, teamId: sanitizeTeamId(entry.teamId || entry.state.teamId) };
        playerSnapshots.set(playerId, snapshot);
      }
    }

    const session = {
      id: sharedWorldSessionId,
      lobbyId: "",
      hostPlayerId: "",
      players: [],
      maxPlayers: sharedWorldMaxPlayers,
      joinCode: "",
      difficulty: sanitizeDifficultyId(state.difficulty || "medium"),
      gameMode: "survival",
      pvpMode: sharedWorldMode,
      worldMode: sharedWorldMode,
      netcodeVersion: partyNetcodeVersion,
      worldSnapshot: { v2: true, state: mpV2Sim.serializeState(state) },
      playerSnapshots,
      claimedTechPickupIds: new Set(),
      createdAt: Date.now(),
      anomalyId: "",
      teams,
      playerTeams: new Map()
    };
    rebuildSharedWorldTeamIndex(session);

    const room = {
      sessionId: session.id,
      state,
      inputQueues: new Map(),
      lastInputs: new Map(),
      lastAckByPlayerId: new Map(),
      lastSnapshotTick: Math.max(0, Math.floor(Number(state.tick) || 0)),
      pendingEvents: [],
      lastTouchedAt: Date.now(),
      perf: {
        stepMsEma: 0,
        snapshotBytesEma: 0,
        entityCount: partyV2EntityCount(state.world),
        maxInputQueue: 0
      }
    };

    partySessions.set(session.id, session);
    partyV2Rooms.set(session.id, room);
    session.worldSnapshot = buildPartyV2StartSnapshot(room);
    return { session, room };
  })();

  try {
    return await sharedWorldLoadPromise;
  } finally {
    sharedWorldLoadPromise = null;
  }
}

function markSharedWorldDirty() {
  sharedWorldDirty = true;
}

async function saveSharedWorldRuntime(reason) {
  if (sharedWorldSavePromise) {
    return sharedWorldSavePromise;
  }
  const session = partySessions.get(sharedWorldSessionId);
  const room = partyV2Rooms.get(sharedWorldSessionId);
  if (!session || !room) {
    return false;
  }

  sharedWorldSavePromise = (async () => {
    pruneSharedWorldTeams(session);
    const serialized = mpV2Sim.serializeState(room.state);
    serialized.players = {};
    const payload = {
      id: sharedWorldStorageId,
      worldMode: sharedWorldMode,
      gameMode: "survival",
      state: serialized,
      teams: sharedWorldTeamsArray(session),
      savedAt: Date.now(),
      reason: sanitizeText(reason, 64)
    };
    const playerRows = sharedWorldPlayerRows(session, room);
    const pool = await getDbPool();
    if (!pool) {
      memoryPersistence.sharedWorlds.set(sharedWorldStorageId, payload);
      for (const row of playerRows) {
        memoryPersistence.sharedPlayers.set(row.playerId, {
          worldId: sharedWorldStorageId,
          state: row.state,
          teamId: row.teamId,
          updatedAt: Date.now()
        });
      }
      sharedWorldDirty = false;
      sharedWorldLastSaveAt = Date.now();
      return true;
    }

    await ensureDatabaseSchema(pool);
    await pool.query(
      `INSERT INTO clusternauts_shared_world_state (id, state, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      [sharedWorldStorageId, JSON.stringify(payload)]
    );
    for (const row of playerRows) {
      await pool.query(
        `INSERT INTO clusternauts_shared_player_state (world_id, player_id, state, team_id, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, now())
         ON CONFLICT (world_id, player_id)
         DO UPDATE SET state = EXCLUDED.state, team_id = EXCLUDED.team_id, updated_at = now()`,
        [sharedWorldStorageId, row.playerId, JSON.stringify(row.state), row.teamId]
      );
    }
    sharedWorldDirty = false;
    sharedWorldLastSaveAt = Date.now();
    return true;
  })();

  try {
    return await sharedWorldSavePromise;
  } finally {
    sharedWorldSavePromise = null;
  }
}

