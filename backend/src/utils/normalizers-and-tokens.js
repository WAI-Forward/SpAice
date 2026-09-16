function extractSessionToken(request) {
  const authorization = String(request.headers.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (match) {
    return sanitizeDebugText(match[1], 200);
  }
  return parseCookies(request.headers.cookie || "")[accountSessionCookie] || "";
}

function sessionTokenSource(request) {
  const authorization = String(request.headers.authorization || "");
  if (/^Bearer\s+.+/i.test(authorization)) {
    return "authorization";
  }
  return parseCookies(request.headers.cookie || "")[accountSessionCookie] ? "cookie" : "missing";
}

function sanitizeAuthAttemptId(value) {
  return String(value || "").replace(/[^\w.-]/g, "").slice(0, 80);
}

function authAttemptIdFromUrl(url) {
  if (!url || !url.searchParams) {
    return "";
  }
  return sanitizeAuthAttemptId(url.searchParams.get("auth_debug_id") || url.searchParams.get("attempt") || "");
}

function authAttemptIdFromPath(pathValue) {
  try {
    const parsed = new URL(String(pathValue || "/"), "https://clusternauts.local");
    return authAttemptIdFromUrl(parsed);
  } catch {
    return "";
  }
}

function authRequestDetails(request) {
  const headers = request && request.headers ? request.headers : {};
  return {
    method: request && request.method || "",
    origin: sanitizeDebugText(headers.origin, 160),
    referer: sanitizeDebugText(headers.referer, 240),
    host: sanitizeDebugText(headers.host || headers["x-forwarded-host"], 160),
    forwardedProto: sanitizeDebugText(headers["x-forwarded-proto"], 32),
    hasAuthorization: /^Bearer\s+.+/i.test(String(headers.authorization || "")),
    hasSessionCookie: Boolean(parseCookies(headers.cookie || "")[accountSessionCookie]),
    userAgent: sanitizeDebugText(headers["user-agent"], 180)
  };
}

function cookieDebugDetails(request) {
  const secureRequest = requestOrigin(request).startsWith("https://");
  return {
    sameSite: secureRequest ? "None" : "Lax",
    secure: secureRequest,
    requestOrigin: sanitizeDebugText(requestOrigin(request), 160)
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function randomToken(byteCount) {
  return crypto.randomBytes(byteCount).toString("base64url");
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scryptHex(password, salt);
  return { salt, hash };
}

async function verifyPassword(password, record) {
  if (!record || !record.salt || !record.hash) {
    return false;
  }

  const hash = await scryptHex(password, record.salt);
  const expected = Buffer.from(record.hash, "hex");
  const actual = Buffer.from(hash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function scryptHex(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password || ""), String(salt || ""), 32, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key.toString("hex"));
    });
  });
}

function normalizeLeaderboardEntry(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const stats = snapshot.stats && typeof snapshot.stats === "object" ? snapshot.stats : {};
  const playerId = sanitizeText(snapshot.playerId, 80);
  const score = Math.max(1, Math.round(clampNumber(snapshot.score ?? stats.score ?? snapshot.maxMass ?? stats.maxMass, 1, 1000000000)));
  const createdAt = clampNumber(snapshot.createdAt, 0, Date.now()) || Date.now();

  return {
    id: sanitizeText(snapshot.id, 80) || createLeaderboardEntryId(),
    playerId,
    name: sanitizeText(snapshot.name ?? stats.name, 32) || (playerId ? `Player ${playerId.slice(-4).toUpperCase()}` : "Player"),
    mode: normalizeLeaderboardMode(snapshot.mode ?? stats.mode),
    score,
    difficulty: normalizeLeaderboardDifficulty(snapshot.difficulty ?? stats.difficulty),
    bodyScore: Math.max(0, Math.round(clampNumber(snapshot.bodyScore ?? stats.bodyScore, 0, 1000000000))),
    mobScore: Math.max(0, Math.round(clampNumber(snapshot.mobScore ?? stats.mobScore, 0, 1000000000))),
    ownedMass: Math.max(0, Math.round(clampNumber(snapshot.ownedMass ?? stats.ownedMass, 0, 1000000000))),
    ownedBodies: Math.max(0, Math.round(clampNumber(snapshot.ownedBodies ?? stats.ownedBodies, 0, 1000000))),
    maxMass: Math.max(1, Math.round(clampNumber(snapshot.maxMass ?? stats.maxMass ?? score, 1, 1000000000))),
    maxTier: sanitizeText(snapshot.maxTier ?? stats.maxTier, 32) || "particle",
    survived: sanitizeText(snapshot.survived ?? stats.survived, 16) || "0:00",
    cause: sanitizeText(snapshot.cause ?? stats.cause, 80) || "Unknown impact",
    createdAt
  };
}

function normalizeLeaderboardMode(mode) {
  const value = sanitizeText(mode, 32).toLowerCase();
  return value === "multiplayer" ? "multiplayer" : "singleplayer";
}

function normalizeLeaderboardModeFilter(mode) {
  const value = sanitizeText(mode, 32).toLowerCase();
  return value === "singleplayer" || value === "multiplayer" ? value : "all";
}

function normalizeLeaderboardDifficulty(difficulty) {
  const value = sanitizeText(difficulty, 32).toLowerCase();
  return difficultyChoices.has(value) ? value : "medium";
}

function normalizeLeaderboardDifficultyFilter(difficulty) {
  const value = sanitizeText(difficulty, 32).toLowerCase();
  return difficultyChoices.has(value) ? value : "all";
}

function normalizeLeaderboardFilters(filters) {
  const source = filters && typeof filters === "object" ? filters : {};
  return {
    mode: normalizeLeaderboardModeFilter(source.mode),
    difficulty: normalizeLeaderboardDifficultyFilter(source.difficulty)
  };
}

function leaderboardEntryMatchesFilters(entry, filters) {
  const cleanFilters = normalizeLeaderboardFilters(filters);
  if (cleanFilters.mode !== "all" && normalizeLeaderboardMode(entry && entry.mode) !== cleanFilters.mode) {
    return false;
  }
  if (cleanFilters.difficulty !== "all" && sanitizeText(entry && entry.difficulty, 16).toLowerCase() !== cleanFilters.difficulty) {
    return false;
  }
  return true;
}

function compareLeaderboardEntries(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (a.createdAt !== b.createdAt) {
    return a.createdAt - b.createdAt;
  }
  return String(a.name).localeCompare(String(b.name));
}

function createLeaderboardEntryId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `score-${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
}

