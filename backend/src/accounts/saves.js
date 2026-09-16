async function listAccountSaves(username) {
  const cleanUsername = sanitizeAccountUsername(username);
  const pool = await getDbPool();

  if (!pool) {
    const saves = memoryPersistence.accountSaves.get(cleanUsername) || new Map();
    return Array.from(saves.values())
      .map((save) => normalizeAccountSave(save))
      .filter(Boolean)
      .map((save) => save.metadata)
      .sort(compareAccountSaveMetadata);
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query(
    `SELECT state
     FROM clusternauts_account_save
     WHERE username = $1
     ORDER BY updated_at DESC
     LIMIT 80`,
    [cleanUsername]
  );
  return result.rows
    .map((row) => normalizeAccountSave(row.state))
    .filter(Boolean)
    .map((save) => save.metadata)
    .sort(compareAccountSaveMetadata);
}

async function saveAccountGame(username, body) {
  const cleanUsername = sanitizeAccountUsername(username);
  const name = sanitizeManualSaveName(body && body.name) || "Saved world";
  const requestedSaveId = sanitizeText(body && body.saveId, 80);
  const sourcePayload = body && body.payload && typeof body.payload === "object" ? body.payload : {};
  const sourcePlayerId = sanitizeText(sourcePayload.playerId, 80);

  if (!sourcePayload.player || !sourcePayload.world) {
    throwHttpError(400, "Save data is missing world state.");
  }

  const savedAt = Date.now();
  const existingSave = requestedSaveId ? await getAccountSave(cleanUsername, requestedSaveId) : null;
  const id = existingSave ? existingSave.metadata.id : "save-" + randomToken(10);
  const createdAt = existingSave ? existingSave.metadata.createdAt : savedAt;
  const payload = {
    playerId: sourcePlayerId,
    player: normalizePlayerSnapshot(sourcePlayerId, sourcePayload.player),
    world: normalizeWorldState(sourcePayload.world),
    run: normalizeRunSnapshot(sourcePayload.run),
    manualSave: {
      version: 1,
      name,
      savedAt
    }
  };
  const save = normalizeAccountSave({
    metadata: {
      id,
      username: cleanUsername,
      name,
      difficulty: payload.run.difficulty || payload.world.difficulty || payload.player.difficulty || "medium",
      score: payload.player.score || 1,
      savedAt,
      createdAt
    },
    payload
  });

  const pool = await getDbPool();
  if (!pool) {
    if (!memoryPersistence.accountSaves.has(cleanUsername)) {
      memoryPersistence.accountSaves.set(cleanUsername, new Map());
    }
    memoryPersistence.accountSaves.get(cleanUsername).set(save.metadata.id, save);
    return save;
  }

  await ensureDatabaseSchema(pool);
  await pool.query(
    `INSERT INTO clusternauts_account_save (id, username, name, state, created_at, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, now(), now())
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, updated_at = now()`,
    [save.metadata.id, cleanUsername, save.metadata.name, JSON.stringify(save)]
  );
  return save;
}

async function getAccountSave(username, saveId) {
  const cleanUsername = sanitizeAccountUsername(username);
  const cleanSaveId = sanitizeText(saveId, 80);
  const pool = await getDbPool();

  if (!pool) {
    const saves = memoryPersistence.accountSaves.get(cleanUsername);
    return normalizeAccountSave(saves && saves.get(cleanSaveId));
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT state FROM clusternauts_account_save WHERE id = $1 AND username = $2", [
    cleanSaveId,
    cleanUsername
  ]);
  return normalizeAccountSave(result.rows[0] && result.rows[0].state);
}

async function deleteAccountSave(username, saveId) {
  const cleanUsername = sanitizeAccountUsername(username);
  const cleanSaveId = sanitizeText(saveId, 80);
  if (!cleanUsername || !cleanSaveId) {
    return false;
  }

  const pool = await getDbPool();
  if (!pool) {
    const saves = memoryPersistence.accountSaves.get(cleanUsername);
    return Boolean(saves && saves.delete(cleanSaveId));
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("DELETE FROM clusternauts_account_save WHERE id = $1 AND username = $2", [
    cleanSaveId,
    cleanUsername
  ]);
  return result.rowCount > 0;
}

function normalizeAccount(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const username = sanitizeAccountUsername(source.username);
  const password = source.password && typeof source.password === "object" ? source.password : null;
  if (!username || !password || !password.hash || !password.salt) {
    return null;
  }

  return {
    username,
    password: {
      hash: sanitizeDebugText(password.hash, 256),
      salt: sanitizeDebugText(password.salt, 128)
    },
    linkedPlayerId: sanitizeText(source.linkedPlayerId, 80),
    waiUserId: sanitizeDebugText(source.waiUserId, 128),
    waiEmail: sanitizeDebugText(source.waiEmail, 200),
    waiDisplayName: sanitizeDebugText(source.waiDisplayName, 80),
    waiBirthdayMonthDay: sanitizeMonthDay(source.waiBirthdayMonthDay),
    crazyGamesId: sanitizeDebugText(source.crazyGamesId, 128),
    crazyGamesUsername: sanitizeDebugText(source.crazyGamesUsername, 80),
    crazyGamesProfilePictureUrl: sanitizeDebugText(source.crazyGamesProfilePictureUrl, 300),
    ownedSkinIds: normalizeOwnedSkinIds(source.ownedSkinIds),
    equippedSkinId: normalizeEquippedSkinId(source.equippedSkinId, source.ownedSkinIds),
    ownedTrailIds: normalizeOwnedTrailIds(source.ownedTrailIds),
    equippedTrailId: normalizeEquippedTrailId(source.equippedTrailId, source.ownedTrailIds),
    createdAt: clampNumber(source.createdAt, 0, Date.now()) || Date.now(),
    lastLoginAt: clampNumber(source.lastLoginAt, 0, Date.now()) || Date.now()
  };
}

function normalizeAccountSession(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const tokenHash = sanitizeDebugText(source.tokenHash, 128);
  const username = sanitizeAccountUsername(source.username);
  if (!tokenHash || !username) {
    return null;
  }

  return {
    tokenHash,
    username,
    createdAt: clampNumber(source.createdAt, 0, Date.now()) || Date.now(),
    expiresAt: clampNumber(source.expiresAt, 0, Date.now() + sessionLifetimeMs) || 0
  };
}

function normalizeAccountSave(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const metadata = source.metadata && typeof source.metadata === "object" ? source.metadata : {};
  const payload = source.payload && typeof source.payload === "object" ? source.payload : {};
  const id = sanitizeText(metadata.id, 80);
  const username = sanitizeAccountUsername(metadata.username);
  const name = sanitizeManualSaveName(metadata.name) || "Saved world";
  if (!id || !username || !payload.player || !payload.world) {
    return null;
  }

  return {
    metadata: {
      id,
      username,
      name,
      difficulty: sanitizeText(metadata.difficulty, 16) || "medium",
      score: Math.max(1, Math.round(clampNumber(metadata.score, 1, 1000000000))),
      savedAt: clampNumber(metadata.savedAt, 0, Date.now()) || Date.now(),
      createdAt: clampNumber(metadata.createdAt, 0, Date.now()) || Date.now()
    },
    payload
  };
}

function normalizeRunSnapshot(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const stats = snapshot.lifeStats && typeof snapshot.lifeStats === "object" ? snapshot.lifeStats : {};

  return {
    active: snapshot.active !== false,
    difficulty: sanitizeText(snapshot.difficulty, 16) || "medium",
    lifeStats: {
      elapsed: clampNumber(stats.elapsed, 0, Number.MAX_SAFE_INTEGER),
      maxMass: clampNumber(stats.maxMass, 1, 1000000000),
      maxTierName: sanitizeText(stats.maxTierName, 32) || "particle",
      mobsDefeated: Math.max(0, Math.floor(clampNumber(stats.mobsDefeated, 0, 1000000))),
      techCollected: Math.max(0, Math.floor(clampNumber(stats.techCollected, 0, 1000000))),
      mobScore: clampNumber(stats.mobScore, 0, 1000000000),
      currentScore: clampNumber(stats.currentScore, 0, 1000000000),
      bestScore: clampNumber(stats.bestScore, 0, 1000000000),
      bodyScore: clampNumber(stats.bodyScore, 0, 1000000000),
      bestBodyScore: clampNumber(stats.bestBodyScore, 0, 1000000000),
      scoredBodyMass: clampNumber(stats.scoredBodyMass, 0, 1000000000),
      bestScoredBodyMass: clampNumber(stats.bestScoredBodyMass, 0, 1000000000),
      scoredBodies: Math.max(0, Math.floor(clampNumber(stats.scoredBodies, 0, 1000000))),
      bestScoredBodies: Math.max(0, Math.floor(clampNumber(stats.bestScoredBodies, 0, 1000000))),
      absorbedParticleMass: clampNumber(stats.absorbedParticleMass, 0, 1000000000),
      absorbedParticleCount: Math.max(0, Math.floor(clampNumber(stats.absorbedParticleCount, 0, 1000000)))
    }
  };
}

function compareAccountSaveMetadata(a, b) {
  return b.savedAt - a.savedAt || String(a.name).localeCompare(String(b.name));
}

