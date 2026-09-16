async function createAccountSession(body, createNew) {
  const username = sanitizeAccountUsername(body && body.username);
  const password = typeof (body && body.password) === "string" ? body.password : "";
  const playerId = sanitizeText(body && body.playerId, 80);

  if (!username || username.length < 3) {
    throwHttpError(400, "Username must be at least 3 characters.");
  }
  if (password.length < 6) {
    throwHttpError(400, "Password must be at least 6 characters.");
  }

  let account = await getAccount(username);
  if (createNew) {
    if (account) {
      throwHttpError(409, "That username is already taken.");
    }
    account = await createAccount(username, password, playerId);
  } else if (!account || !(await verifyPassword(password, account.password))) {
    throwHttpError(401, "Username or password is incorrect.");
  }

  if (!account.linkedPlayerId && playerId) {
    account.linkedPlayerId = playerId;
  }
  account.lastLoginAt = Date.now();
  await saveAccount(account);

  const token = randomToken(32);
  await saveAccountSession({
    tokenHash: hashToken(token),
    username: account.username,
    createdAt: Date.now(),
    expiresAt: Date.now() + sessionLifetimeMs
  });

  return {
    ok: true,
    serverTime: Date.now(),
    sessionToken: token,
    account: publicAccount(account)
  };
}

async function createCrazyGamesAccountSession(request, body) {
  const crazyGamesToken = sanitizeDebugText(body && body.token, 5000);
  const playerId = sanitizeText(body && body.playerId, 80);

  if (!crazyGamesToken) {
    throwHttpError(400, "Missing CrazyGames user token.");
  }

  const crazyGamesUser = await verifyCrazyGamesUserToken(crazyGamesToken);
  let account = null;
  const linkedAccount = await getAccountByCrazyGamesId(crazyGamesUser.userId);
  const existingSessionToken = extractSessionToken(request) || sanitizeDebugText(body && body.sessionToken, 200);

  if (existingSessionToken) {
    try {
      account = (await requireAccountSession({ headers: { authorization: `Bearer ${existingSessionToken}` } })).account;
    } catch {
      account = null;
    }
  }

  if (account && linkedAccount && account.username !== linkedAccount.username) {
    throwHttpError(409, "This CrazyGames account is already linked to another game account.");
  }

  account = account || linkedAccount || (await createCrazyGamesAccount(crazyGamesUser, playerId));
  account.crazyGamesId = crazyGamesUser.userId;
  account.crazyGamesUsername = crazyGamesUser.username;
  account.crazyGamesProfilePictureUrl = crazyGamesUser.profilePictureUrl;
  if (!account.linkedPlayerId && playerId) {
    account.linkedPlayerId = playerId;
  }
  account.lastLoginAt = Date.now();
  await saveAccount(account);
  await linkCrazyGamesPlayerProfile(account.linkedPlayerId, crazyGamesUser);

  const token = randomToken(32);
  await saveAccountSession({
    tokenHash: hashToken(token),
    username: account.username,
    createdAt: Date.now(),
    expiresAt: Date.now() + sessionLifetimeMs
  });

  return {
    ok: true,
    serverTime: Date.now(),
    sessionToken: token,
    account: publicAccount(account)
  };
}

async function createAccount(username, password, playerId) {
  return {
    username,
    password: await hashPassword(password),
    linkedPlayerId: playerId || "",
    createdAt: Date.now(),
    lastLoginAt: Date.now()
  };
}

async function createCrazyGamesAccount(crazyGamesUser, playerId) {
  let username = crazyGamesAccountUsername(crazyGamesUser.userId);
  const existing = await getAccount(username);
  if (existing && existing.crazyGamesId !== crazyGamesUser.userId) {
    username = "cg-" + hashToken(crazyGamesUser.userId + ":" + Date.now()).slice(0, 20);
  }

  return {
    username,
    password: await hashPassword(randomToken(32)),
    linkedPlayerId: playerId || "",
    crazyGamesId: crazyGamesUser.userId,
    crazyGamesUsername: crazyGamesUser.username,
    crazyGamesProfilePictureUrl: crazyGamesUser.profilePictureUrl,
    createdAt: Date.now(),
    lastLoginAt: Date.now()
  };
}

function crazyGamesAccountUsername(crazyGamesId) {
  return "cg-" + hashToken(crazyGamesId).slice(0, 20);
}

async function linkCrazyGamesPlayerProfile(playerId, crazyGamesUser) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!cleanPlayerId) {
    return;
  }

  const profile = await ensurePlayerProfile(cleanPlayerId);
  if (!profile) {
    return;
  }

  profile.crazyGamesId = crazyGamesUser.userId;
  profile.crazyGamesUsername = crazyGamesUser.username;
  if (crazyGamesUser.username) {
    profile.publicName = crazyGamesUser.username;
  }
  await saveProfile(profile);
}

async function getAccount(username) {
  const cleanUsername = sanitizeAccountUsername(username);
  if (!cleanUsername) {
    return null;
  }

  const pool = await getDbPool();
  if (!pool) {
    return normalizeAccount(memoryPersistence.accounts.get(cleanUsername));
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT state FROM clusternauts_account WHERE username = $1", [cleanUsername]);
  return normalizeAccount(result.rows[0] && result.rows[0].state);
}

async function getAccountByCrazyGamesId(crazyGamesId) {
  const cleanCrazyGamesId = sanitizeDebugText(crazyGamesId, 128);
  if (!cleanCrazyGamesId) {
    return null;
  }

  const pool = await getDbPool();
  if (!pool) {
    for (const account of memoryPersistence.accounts.values()) {
      const normalized = normalizeAccount(account);
      if (normalized && normalized.crazyGamesId === cleanCrazyGamesId) {
        return normalized;
      }
    }
    return null;
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT state FROM clusternauts_account WHERE state->>'crazyGamesId' = $1 LIMIT 1", [
    cleanCrazyGamesId
  ]);
  return normalizeAccount(result.rows[0] && result.rows[0].state);
}

async function saveAccount(account) {
  const normalized = normalizeAccount(account);
  if (!normalized) {
    return null;
  }

  const pool = await getDbPool();
  if (!pool) {
    memoryPersistence.accounts.set(normalized.username, normalized);
    return normalized;
  }

  await ensureDatabaseSchema(pool);
  await pool.query(
    `INSERT INTO clusternauts_account (username, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (username) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [normalized.username, JSON.stringify(normalized)]
  );
  return normalized;
}

async function saveAccountSession(session) {
  const normalized = normalizeAccountSession(session);
  if (!normalized) {
    return null;
  }

  const pool = await getDbPool();
  if (!pool) {
    memoryPersistence.sessions.set(normalized.tokenHash, normalized);
    return normalized;
  }

  await ensureDatabaseSchema(pool);
  await pool.query(
    `INSERT INTO clusternauts_account_session (token_hash, username, state, expires_at, created_at)
     VALUES ($1, $2, $3::jsonb, to_timestamp($4 / 1000.0), now())
     ON CONFLICT (token_hash) DO UPDATE SET state = EXCLUDED.state, expires_at = EXCLUDED.expires_at`,
    [normalized.tokenHash, normalized.username, JSON.stringify(normalized), normalized.expiresAt]
  );
  return normalized;
}

async function requireAccountSession(request) {
  const token = extractSessionToken(request);
  if (!token) {
    logClusternautsAuth("session rejected: missing token", { request: authRequestDetails(request) });
    throwHttpError(401, "Log in to use saved games.");
  }

  const tokenHash = hashToken(token);
  const pool = await getDbPool();
  let session = null;

  if (!pool) {
    session = normalizeAccountSession(memoryPersistence.sessions.get(tokenHash));
    if (session && session.expiresAt <= Date.now()) {
      memoryPersistence.sessions.delete(tokenHash);
      session = null;
    }
  } else {
    await ensureDatabaseSchema(pool);
    await pool.query("DELETE FROM clusternauts_account_session WHERE expires_at <= now()");
    const result = await pool.query("SELECT state FROM clusternauts_account_session WHERE token_hash = $1", [tokenHash]);
    session = normalizeAccountSession(result.rows[0] && result.rows[0].state);
  }

  if (!session || session.expiresAt <= Date.now()) {
    logClusternautsAuth("session rejected: expired or unknown token", { request: authRequestDetails(request) });
    throwHttpError(401, "Session expired. Log in again.");
  }

  const account = await getAccount(session.username);
  if (!account) {
    logClusternautsAuth("session rejected: account missing", { username: session.username, request: authRequestDetails(request) });
    throwHttpError(401, "Account no longer exists.");
  }

  logClusternautsAuth("session accepted", {
    username: account.username,
    source: sessionTokenSource(request),
    request: authRequestDetails(request)
  });
  return { session, account };
}

async function deleteAccountSession(token) {
  const tokenHash = hashToken(token);
  const pool = await getDbPool();
  if (!pool) {
    memoryPersistence.sessions.delete(tokenHash);
    return;
  }

  await ensureDatabaseSchema(pool);
  await pool.query("DELETE FROM clusternauts_account_session WHERE token_hash = $1", [tokenHash]);
}

