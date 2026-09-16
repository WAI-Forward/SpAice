async function loadPersistentState(playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  const worldId = soloWorldId(cleanPlayerId);
  const pool = await getDbPool();

  if (!pool) {
    const storedWorld = memoryPersistence.worlds.get(worldId);
    const world = evolveWorldState(storedWorld);
    memoryPersistence.worlds.set(worldId, world);
    return {
      ok: true,
      storage: "memory",
      serverTime: Date.now(),
      universeId: worldId,
      world,
      player: cleanPlayerId ? memoryPersistence.players.get(cleanPlayerId) || null : null,
      profile: cleanPlayerId ? await ensurePlayerProfile(cleanPlayerId) : null,
      players: Array.from(memoryPersistence.players.values())
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("SELECT state FROM clusternauts_world_state WHERE id = $1", [worldId]);
  const world = evolveWorldState(normalizeWorldState(worldResult.rows[0] && worldResult.rows[0].state));

  await pool.query(
    `INSERT INTO clusternauts_world_state (id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [worldId, JSON.stringify(world)]
  );

  const player = cleanPlayerId
    ? (await pool.query("SELECT state FROM clusternauts_player_state WHERE player_id = $1", [cleanPlayerId])).rows[0]?.state || null
    : null;
  const players = (await pool.query("SELECT state FROM clusternauts_player_state ORDER BY updated_at DESC LIMIT 80")).rows.map(
    (row) => row.state
  );

  return {
    ok: true,
    storage: "database",
    serverTime: Date.now(),
    universeId: worldId,
    world,
    player,
    profile: cleanPlayerId ? await ensurePlayerProfile(cleanPlayerId) : null,
    players
  };
}

async function savePersistentState(playerId, body) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  const worldId = soloWorldId(cleanPlayerId);
  const player = normalizePlayerSnapshot(cleanPlayerId, body && body.player);
  const pool = await getDbPool();
  let world = null;

  if (!pool) {
    const storedWorld = memoryPersistence.worlds.get(worldId);
    world = body && body.world ? normalizeWorldState(body.world) : evolveWorldState(storedWorld);
    world.lastEvolvedAt = Date.now();
    memoryPersistence.worlds.set(worldId, world);
    memoryPersistence.players.set(cleanPlayerId, player);
    return {
      ok: true,
      storage: "memory",
      serverTime: Date.now(),
      universeId: worldId,
      world,
      player,
      profile: await ensurePlayerProfile(cleanPlayerId),
      players: Array.from(memoryPersistence.players.values())
    };
  }

  await ensureDatabaseSchema(pool);

  if (body && body.world) {
    world = normalizeWorldState(body.world);
    world.lastEvolvedAt = Date.now();
  } else {
    const worldResult = await pool.query("SELECT state FROM clusternauts_world_state WHERE id = $1", [worldId]);
    world = evolveWorldState(worldResult.rows[0] && worldResult.rows[0].state);
  }

  await pool.query(
    `INSERT INTO clusternauts_world_state (id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [worldId, JSON.stringify(world)]
  );
  await pool.query(
    `INSERT INTO clusternauts_player_state (player_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [cleanPlayerId, JSON.stringify(player)]
  );

  return {
    ok: true,
    storage: "database",
    serverTime: Date.now(),
    universeId: worldId,
    world,
    player,
    profile: await ensurePlayerProfile(cleanPlayerId)
  };
}

async function listLeaderboardEntries(limit, filters) {
  const maxEntries = Math.floor(clampNumber(limit, 1, 100) || 40);
  const cleanFilters = normalizeLeaderboardFilters(filters);
  const pool = await getDbPool();

  if (!pool) {
    return memoryPersistence.leaderboard
      .map((entry) => normalizeLeaderboardEntry(entry))
      .filter((entry) => leaderboardEntryMatchesFilters(entry, cleanFilters))
      .sort(compareLeaderboardEntries)
      .slice(0, maxEntries);
  }

  await ensureDatabaseSchema(pool);
  const clauses = [];
  const params = [];
  if (cleanFilters.mode !== "all") {
    params.push(cleanFilters.mode);
    clauses.push(`COALESCE(state->>'mode', 'singleplayer') = $${params.length}`);
  }
  if (cleanFilters.difficulty !== "all") {
    params.push(cleanFilters.difficulty);
    clauses.push(`COALESCE(state->>'difficulty', 'medium') = $${params.length}`);
  }
  params.push(maxEntries);
  const result = await pool.query(
    `SELECT state
     FROM clusternauts_leaderboard_entry
     ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""}
     ORDER BY score DESC, created_at ASC
     LIMIT $${params.length}`,
    params
  );
  return result.rows.map((row) => normalizeLeaderboardEntry(row.state)).filter(Boolean);
}

async function saveLeaderboardEntry(source) {
  const entry = normalizeLeaderboardEntry(source);
  if (!entry.playerId) {
    throw new Error("Missing player id.");
  }

  const pool = await getDbPool();
  if (!pool) {
    memoryPersistence.leaderboard.push(entry);
    memoryPersistence.leaderboard.sort(compareLeaderboardEntries);
    while (memoryPersistence.leaderboard.length > 500) {
      memoryPersistence.leaderboard.pop();
    }

    return entry;
  }

  await ensureDatabaseSchema(pool);
  await pool.query(
    `INSERT INTO clusternauts_leaderboard_entry (id, player_id, score, state, created_at)
     VALUES ($1, $2, $3, $4::jsonb, to_timestamp($5 / 1000.0))`,
    [entry.id, entry.playerId, entry.score, JSON.stringify(entry), entry.createdAt]
  );

  return entry;
}

