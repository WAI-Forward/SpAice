"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..");
const mpV2Sim = require(path.join(root, "frontend", "src", "mp-v2-sim.js"));
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const advertisedHosts = [
  "localhost",
  process.env.INTERNAL_IP || "192.168.4.26",
  process.env.EXTERNAL_IP || "92.29.230.204"
].filter(uniqueOnly);
const maxJsonBodyBytes = 500000;
const worldTickMs = 5000;
const bubbleRadius = 5000;
const signalTimeoutMs = 15000;
const randomSignalCooldownMs = 45000;
const randomSignalIntervalMs = 10 * 60 * 1000;
const randomOverlapLifetimeMs = 120000;
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 14;
const websiteUrl = stripTrailingSlash(process.env.WAI_FORWARD_WEBSITE_URL || process.env.WEBSITE_URL || defaultWebsiteUrl());
const configuredPublicUrl = stripTrailingSlash(process.env.CLUSTERNAUTS_PUBLIC_URL || process.env.PUBLIC_URL || "");
const coreTokenExchangeSecret = loadCoreTokenExchangeSecret();
const portalAuthTransferSecret = coreTokenExchangeSecret || crypto.randomBytes(32).toString("base64url");
const portalAuthTransferLifetimeMs = 2 * 60 * 1000;
const accountSessionCookie = "clusternauts_session";
const crazyGamesPublicKeyUrl = "https://sdk.crazygames.com/publicKey.json";
const overlapRoomMaxPlayers = 4;
const techKeys = ["suction", "weapon", "plating", "energy", "repair", "target", "propulsion", "shield", "communication"];
const toolKeys = ["suction-gadget", "viscious-vacuum", "laser-pistol", "laser-rifle", "shotgun", "machine-gun", "spanner", "emp-tool", "familiar-net", "piston-punch", "guided-launcher"];
const toolUpgradeKeys = {
  "suction-gadget": ["suck", "blow"],
  "viscious-vacuum": ["suck", "blow"],
  "laser-pistol": ["damage", "range"],
  "laser-rifle": ["damage", "range"],
  shotgun: ["damage", "range"],
  "machine-gun": ["damage", "range"],
  spanner: ["repair-speed", "dismantle-speed"],
  "emp-tool": ["range", "duration"]
};
const mobTierOrder = ["alienoid", "ufo", "rambot", "tesla", "engineer", "satellite", "rocket", "fighter"];
const mobBossHealthMultiplier = 6;
const mobBossWarningDuration = 60;
const mobBossMinionCooldownMax = 14;
const mobBossAltAttackCooldownMax = 10;
const memoryPersistence = {
  worlds: new Map(),
  players: new Map(),
  profiles: new Map(),
  leaderboard: [],
  accounts: new Map(),
  sessions: new Map(),
  accountSaves: new Map()
};
let dbPoolPromise = null;
const sockets = new Set();
const clientsByPlayerId = new Map();
const pendingSignals = new Map();
const pendingPlayerInteractions = new Map();
const activePlayerDuels = new Set();
const overlaps = new Map();
const lobbies = new Map();
const lobbyCodes = new Map();
const partySessions = new Map();
const partyV2Rooms = new Map();
const partyCodes = new Map();
const anomalyMatches = new Map();
const playerCooldowns = new Map();
let nextOverlapNumber = 1;
let nextLobbyNumber = 1;
let nextPartySessionNumber = 1;
let nextAnomalyNumber = 1;
const playerInteractionChoices = new Set(["trade", "duel", "truce"]);
const difficultyChoices = new Set(["easy", "medium", "hard"]);
const partyLobbyMaxPlayers = 4;
const partyNetcodeVersion = 2;
const anomalyPromptTimeoutMs = 15000;
const anomalyEncounterLifetimeMs = 90000;
const multiplayerDebugEnabled = process.env.CLUSTERNAUTS_MULTIPLAYER_DEBUG === "1";
const authDebugEventsByAttempt = new Map();
const maxAuthDebugEventsPerAttempt = 120;
const authDebugEventLifetimeMs = 20 * 60 * 1000;
const crazyGamesPublicKeyCache = {
  publicKey: "",
  expiresAt: 0
};

function defaultWebsiteUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://waiforward.co.uk";
  }
  const websiteHost = process.env.WAI_FORWARD_WEBSITE_HOST || process.env.INTERNAL_IP || "192.168.4.26";
  const websitePort = process.env.WAI_FORWARD_WEBSITE_PORT || process.env.WEBSITE_PORT || "8082";
  return `http://${websiteHost}:${websitePort}`;
}

function loadCoreTokenExchangeSecret() {
  const envSecret =
    process.env.CORE_TOKEN_EXCHANGE_SECRET ||
    process.env.CORE_SECRET ||
    process.env.WAI_CORE_SECRET;
  const normalizedEnvSecret = normalizeCoreTokenExchangeSecret(envSecret);
  if (normalizedEnvSecret) return normalizedEnvSecret;

  const candidates = [
    path.join(root, "data", "core.json"),
    path.join(root, "..", "Website", "data", "core.json"),
    path.join(root, "..", "RunWAI", "data", "core.json")
  ];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) {
        continue;
      }
      const raw = fs.readFileSync(candidate, "utf8").trim();
      if (!raw) {
        continue;
      }
      const normalizedSecret = normalizeCoreTokenExchangeSecret(raw);
      if (normalizedSecret) return normalizedSecret;
    } catch (error) {
      console.warn(`Could not load core token exchange secret from ${candidate}: ${error.message}`);
    }
  }

  return "";
}

function normalizeCoreTokenExchangeSecret(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed.trim();
    if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "secret")) {
      return String(parsed.secret || "").trim();
    }
    return "";
  } catch {
    return raw;
  }
}

function logMultiplayer(event, details) {
  if (!multiplayerDebugEnabled) {
    return;
  }

  const stamp = new Date().toISOString();
  const payload = details && typeof details === "object" ? ` ${JSON.stringify(details)}` : "";
  console.log(`[Clusternauts multiplayer ${stamp}] ${event}${payload}`);
}

function logClusternautsError(event, details) {
  const stamp = new Date().toISOString();
  const payload = details && typeof details === "object" ? ` ${JSON.stringify(details)}` : "";
  console.error(`[Clusternauts error ${stamp}] ${event}${payload}`);
}

function logClusternautsAuth(event, details) {
  const stamp = new Date().toISOString();
  const safeDetails = sanitizeAuthLogDetails(details);
  const payload = safeDetails && typeof safeDetails === "object" ? ` ${JSON.stringify(safeDetails)}` : "";
  console.info(`[Clusternauts auth ${stamp}] ${event}${payload}`);
  recordAuthDebugEvent(safeDetails && safeDetails.attemptId, event, safeDetails, stamp);
}

function sanitizeAuthLogDetails(details) {
  if (!details || typeof details !== "object") {
    return details;
  }

  const copy = Object.assign({}, details);
  delete copy.transfer;
  delete copy.sessionToken;
  delete copy.cookie;
  if (copy.redirectLocation && String(copy.redirectLocation).includes("transfer=")) {
    copy.redirectLocation = String(copy.redirectLocation).replace(/transfer=[^&]+/g, "transfer=redacted");
  }
  return copy;
}

function recordAuthDebugEvent(attemptId, event, details, stamp) {
  const cleanAttemptId = sanitizeAuthAttemptId(attemptId);
  if (!cleanAttemptId) {
    return;
  }

  pruneAuthDebugEvents();
  const existing = authDebugEventsByAttempt.get(cleanAttemptId) || [];
  existing.push({
    at: stamp || new Date().toISOString(),
    event: sanitizeDebugText(event, 80),
    details: sanitizeAuthLogDetails(details) || {}
  });
  while (existing.length > maxAuthDebugEventsPerAttempt) {
    existing.shift();
  }
  authDebugEventsByAttempt.set(cleanAttemptId, existing);
}

function pruneAuthDebugEvents() {
  const cutoff = Date.now() - authDebugEventLifetimeMs;
  for (const [attemptId, events] of authDebugEventsByAttempt) {
    const latest = events.length ? Date.parse(events[events.length - 1].at) : 0;
    if (!Number.isFinite(latest) || latest < cutoff) {
      authDebugEventsByAttempt.delete(attemptId);
    }
  }
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};
const gzipStaticExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt"]);
const staticCompressionMinBytes = 1024;

function createDefaultWorldState() {
  return {
    version: 1,
    elapsed: 0,
    particles: [],
    alienoids: [],
    ufos: [],
    rambots: [],
    engineers: [],
    teslas: [],
    rockets: [],
    fighters: [],
    structures: [],
    rivalProjectiles: [],
    techPickups: [],
    healthPickups: [],
    starDust: [],
    nextParticleId: 1,
    nextAlienoidId: 1,
    nextUfoId: 1,
    nextRambotId: 1,
    nextEngineerId: 1,
    nextTeslaId: 1,
    nextRocketId: 1,
    nextFighterId: 1,
    nextStructureId: 1,
    nextRivalProjectileId: 1,
    nextTechPickupId: 1,
    nextHealthPickupId: 1,
    mobSpawnTimers: {
      alienoid: 120,
      ufo: 180,
      rambot: 300,
      tesla: 420,
      engineer: 660,
      satellite: 780,
      rocket: 840,
      fighter: 960
    },
    mobSpawnRestTimer: 0,
    mobSpawnRestDrainTimer: 0,
    mobSpawnRestCooldownTimer: 150,
    mobDefeatsByKind: {
      alienoid: 0,
      ufo: 0,
      rambot: 0,
      tesla: 0,
      engineer: 0,
      satellite: 0,
      rocket: 0,
      fighter: 0
    },
    mobBossWarnings: Object.fromEntries(mobTierOrder.map((kind) => [kind, {
      active: false,
      timer: 0,
      lastNoticeSecond: -1
    }])),
    lastEvolvedAt: Date.now()
  };
}

function sendFile(request, response, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const headers = staticFileHeaders(filePath, stats, extension);

    if (request.headers["if-none-match"] === headers.ETag) {
      response.writeHead(304, headers);
      response.end();
      return;
    }

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const shouldGzip = shouldGzipStaticFile(request, extension, data.length);
      if (!shouldGzip) {
        headers["Content-Length"] = data.length;
        response.writeHead(200, headers);
        response.end(request.method === "HEAD" ? undefined : data);
        return;
      }

      zlib.gzip(data, { level: 6 }, (gzipError, compressed) => {
        if (gzipError) {
          headers["Content-Length"] = data.length;
          response.writeHead(200, headers);
          response.end(request.method === "HEAD" ? undefined : data);
          return;
        }

        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = compressed.length;
        response.writeHead(200, headers);
        response.end(request.method === "HEAD" ? undefined : compressed);
      });
    });
  });
}

function staticFileHeaders(filePath, stats, extension) {
  return {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": staticCacheControl(filePath, extension),
    ETag: staticFileEtag(stats),
    "Last-Modified": stats.mtime.toUTCString(),
    Vary: "Accept-Encoding",
    "X-Content-Type-Options": "nosniff"
  };
}

function staticFileEtag(stats) {
  return `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
}

function staticCacheControl(filePath, extension) {
  if (path.basename(filePath).toLowerCase() === "index.html" || extension === ".html") {
    return "no-cache";
  }
  if (extension === ".js" || extension === ".css") {
    return "public, max-age=3600, must-revalidate";
  }
  return "public, max-age=86400";
}

function shouldGzipStaticFile(request, extension, byteLength) {
  if (!gzipStaticExtensions.has(extension) || byteLength < staticCompressionMinBytes) {
    return false;
  }
  return /\bgzip\b/i.test(String(request.headers["accept-encoding"] || ""));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/healthz") {
    writeJson(response, 200, { ok: true, service: "clusternauts" });
    return;
  }

  if (url.pathname === "/auth/login" || url.pathname === "/auth/launch/callback" || url.pathname === "/auth/portal-login-complete") {
    void handleWaiAuthRoute(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    applyCorsHeaders(request, response);

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Cache-Control": "no-store"
      });
      response.end();
      return;
    }
  }

  if (url.pathname.startsWith("/api/auth/")) {
    void handleAuthRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/account") {
    void handleAccountRequest(request, response);
    return;
  }

  if (url.pathname === "/api/saves" || url.pathname.startsWith("/api/saves/")) {
    void handleAccountSaveRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/bootstrap" || url.pathname.startsWith("/api/players/") || url.pathname.startsWith("/api/friends/")) {
    void handleSocialRequest(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/reset/")) {
    void handleResetRequest(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/world/")) {
    void handleWorldRequest(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/leaderboard")) {
    void handleLeaderboardRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/client-error") {
    void handleClientErrorRequest(request, response);
    return;
  }

  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(root, "." + requestedPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(request, response, filePath);
});

async function handleWaiAuthRoute(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/auth/login") {
      redirectToWaiLogin(request, response, url.searchParams.get("return_to"), url);
      return;
    }

    if (request.method === "GET" && url.pathname === "/auth/launch/callback") {
      await handleWaiLaunchCallback(request, response, url);
      return;
    }

    if (request.method === "GET" && url.pathname === "/auth/portal-login-complete") {
      writePortalLoginCompletePage(response, url);
      return;
    }

    writeJson(response, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    logClusternautsError("wai auth route error", {
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error"
    });
    writeJson(response, error && Number.isFinite(error.status) ? error.status : 500, {
      ok: false,
      message: error instanceof Error ? error.message : "WAi login failed."
    });
  }
}

function redirectToWaiLogin(request, response, returnTo, url) {
  const safeReturn = safeReturnPath(returnTo);
  const attemptId = authAttemptIdFromPath(safeReturn) || authAttemptIdFromUrl(url);
  logClusternautsAuth("wai login redirect", {
    attemptId,
    returnTo: safeReturn,
    portal: isPortalLoginCompletePath(safeReturn),
    websiteUrl,
    appLaunchUrl: `${websiteUrl}/auth/app-launch`,
    callbackParam: safeReturn,
    request: authRequestDetails(request)
  });
  const params = new URLSearchParams({
    app: "clusternauts",
    callback: safeReturn
  });
  response.writeHead(302, { Location: `${websiteUrl}/auth/app-launch?${params.toString()}` });
  response.end();
}

function writePortalLoginCompletePage(response, url) {
  const attemptId = authAttemptIdFromUrl(url);
  logClusternautsAuth("portal completion page served", {
    attemptId,
    hasTransfer: Boolean(url.searchParams.get("transfer")),
    queryKeys: Array.from(url.searchParams.keys()).sort()
  });
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Clusternauts Login Complete</title>
  </head>
  <body>
    <p>Login complete. You can close this window.</p>
    <script>
      (function () {
        var params = new URLSearchParams(window.location.search || "");
        var authDebugId = params.get("auth_debug_id") || "";
        var message = {
          type: "clusternauts:wai-login-complete",
          authDebugId: authDebugId,
          transfer: params.get("transfer") || ""
        };
        try {
          console.info("[Clusternauts auth] portal completion page loaded", {
            authDebugId: authDebugId,
            hasTransfer: Boolean(message.transfer),
            queryKeys: Array.from(params.keys()).sort()
          });
        } catch (error) {}
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, "*");
          }
        } catch (error) {}
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, "*");
          }
        } catch (error) {}
        window.setTimeout(function () {
          try {
            window.close();
          } catch (error) {}
        }, 250);
      }());
    </script>
  </body>
</html>`);
}

async function handleWaiLaunchCallback(request, response, url) {
  const attemptId = authAttemptIdFromUrl(url);
  const code = sanitizeDebugText(url.searchParams.get("code"), 2048);
  if (!code) {
    logClusternautsAuth("wai callback missing code", {
      attemptId,
      queryKeys: Array.from(url.searchParams.keys()).sort(),
      request: authRequestDetails(request)
    });
    redirectToWaiLogin(request, response, "/");
    return;
  }

  const callback = `${serviceBaseUrl(request)}/auth/launch/callback`;
  logClusternautsAuth("wai callback exchanging code", {
    attemptId,
    callback,
    returnTo: safeReturnPath(url.searchParams.get("return_to")),
    queryKeys: Array.from(url.searchParams.keys()).sort(),
    request: authRequestDetails(request)
  });
  const tokens = await exchangeWaiAuthorizationCode(code, callback);
  const payload = decodeWaiAccessTokenPayload(tokens && tokens.wf_access_token);
  if (!payload || !payload.user_id) {
    throwHttpError(401, "WAi account could not be verified.");
  }

  const result = await createWaiAccountSession(payload);
  const returnTo = safeReturnPath(url.searchParams.get("return_to"));
  const returnAttemptId = authAttemptIdFromPath(returnTo);
  const effectiveAttemptId = returnAttemptId || attemptId;
  const portalReturn = isPortalLoginCompletePath(returnTo);
  const redirectLocation = isPortalLoginCompletePath(returnTo)
    ? `${returnTo}?transfer=${encodeURIComponent(createPortalAuthTransfer(result.sessionToken))}`
    : returnTo;
  logClusternautsAuth("wai callback created session", {
    attemptId: effectiveAttemptId,
    username: result.account && result.account.username,
    waiLinked: Boolean(result.account && result.account.waiLinked),
    portal: portalReturn,
    redirectTo: portalReturn ? "/auth/portal-login-complete?transfer=redacted" : redirectLocation,
    returnTo,
    returnToHadAttemptId: Boolean(returnAttemptId),
    cookieSettings: cookieDebugDetails(request)
  });
  response.writeHead(302, {
    Location: redirectLocation,
    "Set-Cookie": buildAccountSessionCookie(request, result.sessionToken)
  });
  response.end();
}

function isPortalLoginCompletePath(pathValue) {
  return String(pathValue || "").split("?")[0] === "/auth/portal-login-complete";
}

function createPortalAuthTransfer(sessionToken) {
  const payload = Buffer.from(JSON.stringify({
    sessionToken,
    expiresAt: Date.now() + portalAuthTransferLifetimeMs,
    nonce: randomToken(12)
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", portalAuthTransferSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyPortalAuthTransfer(transferToken, attemptId) {
  const parts = String(transferToken || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    logClusternautsAuth("portal transfer rejected: malformed", {
      attemptId,
      hasTransfer: Boolean(transferToken),
      partCount: parts.length
    });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  const expected = crypto.createHmac("sha256", portalAuthTransferSecret).update(parts[0]).digest("base64url");
  const actual = parts[1];
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    logClusternautsAuth("portal transfer rejected: bad signature", {
      attemptId,
      payloadLength: parts[0].length,
      signatureLength: actual.length
    });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    logClusternautsAuth("portal transfer rejected: invalid payload json", { attemptId });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  if (!payload || payload.expiresAt <= Date.now()) {
    logClusternautsAuth("portal transfer rejected: expired", {
      attemptId,
      expiresAt: payload && payload.expiresAt,
      now: Date.now()
    });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  const sessionToken = sanitizeDebugText(payload.sessionToken, 200);
  if (!sessionToken) {
    logClusternautsAuth("portal transfer rejected: missing session token", { attemptId });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }
  logClusternautsAuth("portal transfer accepted", {
    attemptId,
    expiresInMs: payload.expiresAt - Date.now()
  });
  return sessionToken;
}

async function exchangeWaiAuthorizationCode(code, callback) {
  const headers = { "content-type": "application/json" };
  if (coreTokenExchangeSecret) {
    headers.authorization = `Bearer ${coreTokenExchangeSecret}`;
  }

  let result;
  try {
    result = await fetch(`${websiteUrl}/auth/token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ code, callback })
    });
  } catch (error) {
    throwHttpError(503, "Could not reach WAi Forward login.");
  }

  if (!result.ok) {
    throwHttpError(401, `WAi login exchange failed with status ${result.status}.`);
  }
  return result.json();
}

async function createWaiAccountSession(payload) {
  const userId = sanitizeDebugText(String(payload.user_id || ""), 128);
  const username = sanitizeAccountUsername("wai-" + hashToken(userId).slice(0, 20));
  const displayName = sanitizeDebugText(payload.display_name || payload.user_name || payload.email || "WAi Forward member", 80);
  const playerId = sanitizeText("wai-" + hashToken("player:" + userId).slice(0, 20), 80);
  let account = await getAccount(username);

  if (!account) {
    account = await createAccount(username, randomToken(32), playerId);
    account.waiUserId = userId;
    account.waiEmail = sanitizeDebugText(payload.email, 200);
    account.waiDisplayName = displayName;
  }

  account.linkedPlayerId = account.linkedPlayerId || playerId;
  account.waiUserId = userId;
  account.waiEmail = sanitizeDebugText(payload.email, 200);
  account.waiDisplayName = displayName;
  account.lastLoginAt = Date.now();
  await saveAccount(account);
  await linkWaiPlayerProfile(account.linkedPlayerId, payload);

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

async function linkWaiPlayerProfile(playerId, payload) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!cleanPlayerId) {
    return;
  }
  const profile = await ensurePlayerProfile(cleanPlayerId);
  if (!profile) {
    return;
  }
  const displayName = sanitizeDebugText(payload.display_name || payload.user_name || payload.email, 80);
  profile.waiUserId = sanitizeDebugText(String(payload.user_id || ""), 128);
  profile.waiEmail = sanitizeDebugText(payload.email, 200);
  if (displayName) {
    profile.publicName = displayName;
  }
  await saveProfile(profile);
}

function decodeWaiAccessTokenPayload(token) {
  const parts = String(token || "").split(".");
  const compressed = parts[0] === "";
  const payloadPart = compressed ? parts[1] : parts[0];
  if (!payloadPart) {
    return null;
  }

  try {
    const payloadBytes = base64UrlToBuffer(payloadPart);
    const jsonBytes = compressed ? zlib.inflateSync(payloadBytes) : payloadBytes;
    return JSON.parse(jsonBytes.toString("utf8"));
  } catch (error) {
    logClusternautsError("wai token decode failed", { message: error instanceof Error ? error.message : "unknown error" });
    return null;
  }
}

async function handleAccountRequest(request, response) {
  try {
    if (request.method !== "GET") {
      writeJson(response, 405, { ok: false, message: "Account endpoint requires GET." });
      return;
    }
    const session = await requireAccountSession(request);
    writeJson(response, 200, {
      ok: true,
      serverTime: Date.now(),
      sessionToken: extractSessionToken(request),
      account: publicAccount(session.account)
    });
  } catch (error) {
    writeJson(response, error && Number.isFinite(error.status) ? error.status : 401, {
      ok: false,
      message: error instanceof Error ? error.message : "Log in to use saved games."
    });
  }
}

async function handleAuthRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/auth/debug") {
      const attemptId = authAttemptIdFromUrl(url);
      logClusternautsAuth("auth debug requested", {
        attemptId,
        request: authRequestDetails(request)
      });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        attemptId,
        events: attemptId ? authDebugEventsByAttempt.get(attemptId) || [] : []
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      logClusternautsAuth("session bootstrap requested", { request: authRequestDetails(request) });
      const session = await requireAccountSession(request);
      logClusternautsAuth("session bootstrap accepted", { username: session.account.username, request: authRequestDetails(request) });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        sessionToken: extractSessionToken(request),
        account: publicAccount(session.account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/portal-session") {
      const body = await readJsonBody(request);
      const attemptId = sanitizeAuthAttemptId(body && body.authDebugId) || authAttemptIdFromUrl(url);
      logClusternautsAuth("portal session redeem requested", {
        attemptId,
        hasTransfer: Boolean(body && body.transfer),
        transferLength: body && body.transfer ? String(body.transfer).length : 0,
        request: authRequestDetails(request)
      });
      const sessionToken = verifyPortalAuthTransfer(body && body.transfer, attemptId);
      const session = await requireAccountSession({ method: "POST", headers: { authorization: `Bearer ${sessionToken}` } });
      logClusternautsAuth("portal session redeem accepted", {
        attemptId,
        username: session.account.username,
        waiLinked: Boolean(session.account.waiUserId),
        request: authRequestDetails(request)
      });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        sessionToken,
        account: publicAccount(session.account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readJsonBody(request);
      const result = await createAccountSession(body, true);
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJsonBody(request);
      const result = await createAccountSession(body, false);
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/crazygames") {
      const body = await readJsonBody(request);
      const result = await createCrazyGamesAccountSession(request, body);
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const token = extractSessionToken(request) || sanitizeDebugText((await readJsonBody(request))?.sessionToken, 200);
      if (token) {
        await deleteAccountSession(token);
      }
      response.setHeader("Set-Cookie", clearAccountSessionCookie(request));
      writeJson(response, 200, { ok: true, serverTime: Date.now() });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Auth endpoint not found." });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const attemptId = authAttemptIdFromUrl(url);
    logClusternautsAuth("auth request failed", {
      attemptId,
      method: request.method,
      path: url.pathname,
      status,
      message: error instanceof Error ? error.message : "unknown error",
      request: authRequestDetails(request)
    });
    logClusternautsError("auth request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error"
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "Account request failed."
    });
  }
}

async function handleAccountSaveRequest(request, response, url) {
  try {
    const session = await requireAccountSession(request);

    if (request.method === "GET" && url.pathname === "/api/saves") {
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        saves: await listAccountSaves(session.account.username)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/saves") {
      const body = await readJsonBody(request);
      const saved = await saveAccountGame(session.account.username, body);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        save: saved.metadata,
        saves: await listAccountSaves(session.account.username)
      });
      return;
    }

    const saveId = sanitizeText(url.pathname.slice("/api/saves/".length), 80);
    if (request.method === "GET" && saveId) {
      const save = await getAccountSave(session.account.username, saveId);
      if (!save) {
        writeJson(response, 404, { ok: false, message: "Save not found." });
        return;
      }

      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        save: save.metadata,
        payload: save.payload
      });
      return;
    }

    if (request.method === "DELETE" && saveId) {
      const deleted = await deleteAccountSave(session.account.username, saveId);
      if (!deleted) {
        writeJson(response, 404, { ok: false, message: "Save not found." });
        return;
      }

      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        saves: await listAccountSaves(session.account.username)
      });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Save endpoint not found." });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    logClusternautsError("save request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "Save request failed."
    });
  }
}

async function handleWorldRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/world/state") {
      const playerId = sanitizeText(url.searchParams.get("playerId"), 80);
      writeJson(response, 200, await loadPersistentState(playerId));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/world/snapshot") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body && body.playerId, 80);

      if (!playerId) {
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      writeJson(response, 200, await savePersistentState(playerId, body));
      return;
    }

    writeJson(response, 404, { ok: false, message: "World endpoint not found." });
  } catch (error) {
    logClusternautsError("world request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "World persistence request failed."
    });
  }
}

async function handleClientErrorRequest(request, response) {
  try {
    if (request.method !== "POST") {
      writeJson(response, 405, { ok: false, message: "Client error endpoint requires POST." });
      return;
    }

    const body = await readJsonBody(request);
    const report = sanitizeClientErrorReport(body);
    logClusternautsError("client error", report);
    writeJson(response, 200, { ok: true });
  } catch (error) {
    logClusternautsError("client error report failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });
    writeJson(response, 500, { ok: false, message: "Client error report failed." });
  }
}

async function handleLeaderboardRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/leaderboard") {
      const limit = Math.floor(clampNumber(url.searchParams.get("limit"), 1, 100) || 40);
      const filters = {
        mode: normalizeLeaderboardModeFilter(url.searchParams.get("mode")),
        difficulty: normalizeLeaderboardDifficultyFilter(url.searchParams.get("difficulty"))
      };
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        entries: await listLeaderboardEntries(limit, filters)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/leaderboard") {
      const body = await readJsonBody(request);
      const entry = await saveLeaderboardEntry(body);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        entry,
        entries: await listLeaderboardEntries(40, {
          mode: "all",
          difficulty: "all"
        })
      });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Leaderboard endpoint not found." });
  } catch (error) {
    logClusternautsError("leaderboard request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Leaderboard request failed."
    });
  }
}

async function handleResetRequest(request, response, url) {
  try {
    if (request.method !== "POST") {
      writeJson(response, 405, { ok: false, message: "Reset endpoint requires POST." });
      return;
    }

    const body = await readJsonBody(request);
    const playerId = sanitizeText(body && body.playerId, 80);

    if (!playerId) {
      writeJson(response, 400, { ok: false, message: "Missing player id." });
      return;
    }

    if (url.pathname === "/api/reset/world") {
      const result = await resetPersistentWorldData();
      logMultiplayer("world reset", { playerId, storage: result.storage, deleted: result.deleted });
      broadcastReset("world", playerId);
      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/reset/players") {
      const result = await resetPersistentPlayerData();
      logMultiplayer("players reset", { playerId, storage: result.storage, deleted: result.deleted });
      broadcastReset("players", playerId);
      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/reset/all") {
      const result = await resetPersistentAllData();
      logMultiplayer("all reset", { playerId, storage: result.storage, deleted: result.deleted });
      broadcastReset("all", playerId);
      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/reset/life") {
      const result = await resetPersistentLifeData(playerId);
      logMultiplayer("life reset", { playerId, storage: result.storage, deleted: result.deleted });
      relayToPlayer(playerId, { type: "reset.life", actorPlayerId: playerId });
      writeJson(response, 200, result);
      return;
    }

    writeJson(response, 404, { ok: false, message: "Reset endpoint not found." });
  } catch (error) {
    logClusternautsError("reset request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Reset request failed."
    });
  }
}

async function handleSocialRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      const playerId = sanitizeText(url.searchParams.get("playerId"), 80);

      if (!playerId) {
        logMultiplayer("bootstrap rejected", { reason: "missing player id" });
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      const profile = await ensurePlayerProfile(playerId);
      logMultiplayer("bootstrap", {
        playerId,
        publicName: profile && profile.publicName,
        onlineCount: countOnlinePlayers()
      });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        profile,
        onlineCount: countOnlinePlayers(),
        players: await listVisiblePlayers(playerId, "", false, false)
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/players/search") {
      const playerId = sanitizeText(url.searchParams.get("playerId"), 80);
      const query = sanitizeText(url.searchParams.get("q"), 40);
      const friendsOnly = url.searchParams.get("friendsOnly") === "true";
      const relayOnly = url.searchParams.get("relayOnly") === "true";

      if (!playerId) {
        logMultiplayer("player search rejected", { query, friendsOnly, relayOnly, reason: "missing player id" });
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      await ensurePlayerProfile(playerId);
      logMultiplayer("player search", { playerId, query, friendsOnly, relayOnly });
      writeJson(response, 200, {
        ok: true,
        players: await listVisiblePlayers(playerId, query, friendsOnly, relayOnly)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/friends/request") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body && body.playerId, 80);
      const targetPlayerId = sanitizeText(body && body.targetPlayerId, 80);

      if (!playerId || !targetPlayerId || playerId === targetPlayerId) {
        logMultiplayer("friend request rejected", {
          playerId,
          targetPlayerId,
          reason: "invalid friend request"
        });
        writeJson(response, 400, { ok: false, message: "Invalid friend request." });
        return;
      }

      if (!canRelayLinkPlayers(playerId, targetPlayerId)) {
        logMultiplayer("friend request rejected", {
          playerId,
          targetPlayerId,
          reason: "missing communication relay"
        });
        writeJson(response, 403, { ok: false, message: "Both players need online communication relays." });
        return;
      }

      const profiles = await addFriendship(playerId, targetPlayerId);
      logMultiplayer("friend request accepted", { playerId, targetPlayerId });
      notifyProfileChanged(playerId);
      notifyProfileChanged(targetPlayerId);
      writeJson(response, 200, { ok: true, profiles });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/friends/accept") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body && body.playerId, 80);
      const targetPlayerId = sanitizeText(body && body.targetPlayerId, 80);

      if (!playerId || !targetPlayerId || playerId === targetPlayerId) {
        logMultiplayer("friend accept rejected", {
          playerId,
          targetPlayerId,
          reason: "invalid friend accept"
        });
        writeJson(response, 400, { ok: false, message: "Invalid friend accept." });
        return;
      }

      if (!canRelayLinkPlayers(playerId, targetPlayerId)) {
        logMultiplayer("friend accept rejected", {
          playerId,
          targetPlayerId,
          reason: "missing communication relay"
        });
        writeJson(response, 403, { ok: false, message: "Both players need online communication relays." });
        return;
      }

      const profiles = await addFriendship(playerId, targetPlayerId);
      logMultiplayer("friend accept accepted", { playerId, targetPlayerId });
      notifyProfileChanged(playerId);
      notifyProfileChanged(targetPlayerId);
      writeJson(response, 200, { ok: true, profiles });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Social endpoint not found." });
  } catch (error) {
    logClusternautsError("social request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Social request failed."
    });
  }
}

async function resetPersistentWorldData() {
  const pool = await getDbPool();

  if (!pool) {
    const deleted = memoryPersistence.worlds.size;
    memoryPersistence.worlds.clear();
    overlaps.clear();
    return {
      ok: true,
      storage: "memory",
      reset: "world",
      deleted
    };
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("DELETE FROM clusternauts_world_state");
  overlaps.clear();
  return {
    ok: true,
    storage: "database",
    reset: "world",
    deleted: result.rowCount
  };
}

async function resetPersistentPlayerData() {
  const pool = await getDbPool();

  if (!pool) {
    const deleted = memoryPersistence.players.size;
    memoryPersistence.players.clear();
    playerCooldowns.clear();
    return {
      ok: true,
      storage: "memory",
      reset: "players",
      deleted
    };
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("DELETE FROM clusternauts_player_state");
  playerCooldowns.clear();
  return {
    ok: true,
    storage: "database",
    reset: "players",
    deleted: result.rowCount
  };
}

async function resetPersistentAllData() {
  const pool = await getDbPool();

  if (!pool) {
    const deleted = {
      worlds: memoryPersistence.worlds.size,
      players: memoryPersistence.players.size
    };
    memoryPersistence.worlds.clear();
    memoryPersistence.players.clear();
    overlaps.clear();
    playerCooldowns.clear();
    return {
      ok: true,
      storage: "memory",
      reset: "all",
      deleted
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("DELETE FROM clusternauts_world_state");
  const playerResult = await pool.query("DELETE FROM clusternauts_player_state");
  overlaps.clear();
  playerCooldowns.clear();
  return {
    ok: true,
    storage: "database",
    reset: "all",
    deleted: {
      worlds: worldResult.rowCount,
      players: playerResult.rowCount
    }
  };
}

async function resetPersistentLifeData(playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  const worldId = soloWorldId(cleanPlayerId);
  const pool = await getDbPool();

  if (!pool) {
    const deletedWorld = memoryPersistence.worlds.delete(worldId) ? 1 : 0;
    const deletedPlayer = memoryPersistence.players.delete(cleanPlayerId) ? 1 : 0;
    const deletedProfile = memoryPersistence.profiles.delete(cleanPlayerId) ? 1 : 0;
    playerCooldowns.delete(cleanPlayerId);
    removePlayerFromMemoryFriendLists(cleanPlayerId);
    return {
      ok: true,
      storage: "memory",
      reset: "life",
      deleted: {
        worlds: deletedWorld,
        players: deletedPlayer,
        profiles: deletedProfile
      }
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("DELETE FROM clusternauts_world_state WHERE id = $1", [worldId]);
  const playerResult = await pool.query("DELETE FROM clusternauts_player_state WHERE player_id = $1", [cleanPlayerId]);
  const profileResult = await pool.query("DELETE FROM clusternauts_player_profile WHERE player_id = $1", [cleanPlayerId]);
  await pool.query(
    `UPDATE clusternauts_player_profile
     SET state = jsonb_set(state, '{friends}', COALESCE(state->'friends', '[]'::jsonb) - $1::text),
         updated_at = now()
     WHERE COALESCE(state->'friends', '[]'::jsonb) ? $1::text`,
    [cleanPlayerId]
  );
  playerCooldowns.delete(cleanPlayerId);
  return {
    ok: true,
    storage: "database",
    reset: "life",
    deleted: {
      worlds: worldResult.rowCount,
      players: playerResult.rowCount,
      profiles: profileResult.rowCount
    }
  };
}

function removePlayerFromMemoryFriendLists(playerId) {
  for (const [profileId, profile] of memoryPersistence.profiles) {
    const normalized = normalizeProfile(profile, profileId);
    if (!normalized.friends.includes(playerId)) {
      continue;
    }

    normalized.friends = normalized.friends.filter((friendId) => friendId !== playerId);
    memoryPersistence.profiles.set(profileId, normalized);
  }
}

function broadcastReset(kind, actorPlayerId) {
  for (const client of sockets) {
    sendWsJson(client, {
      type: "reset." + kind,
      actorPlayerId
    });
  }
}

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
    crazyGamesId: sanitizeDebugText(source.crazyGamesId, 128),
    crazyGamesUsername: sanitizeDebugText(source.crazyGamesUsername, 80),
    crazyGamesProfilePictureUrl: sanitizeDebugText(source.crazyGamesProfilePictureUrl, 300),
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

function publicAccount(account) {
  const normalized = normalizeAccount(account);
  return normalized
    ? {
        username: normalized.username,
        linkedPlayerId: normalized.linkedPlayerId,
        waiDisplayName: normalized.waiDisplayName,
        waiEmail: normalized.waiEmail,
        waiLinked: Boolean(normalized.waiUserId),
        crazyGamesUsername: normalized.crazyGamesUsername,
        crazyGamesProfilePictureUrl: normalized.crazyGamesProfilePictureUrl,
        crazyGamesLinked: Boolean(normalized.crazyGamesId),
        createdAt: normalized.createdAt
      }
    : null;
}

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

function soloWorldId(playerId) {
  return `solo:${playerId || "anonymous"}`;
}

async function ensurePlayerProfile(playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!cleanPlayerId) {
    return null;
  }

  const pool = await getDbPool();
  if (!pool) {
    const existing = memoryPersistence.profiles.get(cleanPlayerId);
    if (existing) {
      return normalizeProfile(existing, cleanPlayerId);
    }

    const profile = createPlayerProfile(cleanPlayerId);
    memoryPersistence.profiles.set(cleanPlayerId, profile);
    return profile;
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT state FROM clusternauts_player_profile WHERE player_id = $1", [cleanPlayerId]);
  if (result.rows[0] && result.rows[0].state) {
    return normalizeProfile(result.rows[0].state, cleanPlayerId);
  }

  const profile = createPlayerProfile(cleanPlayerId);
  await saveProfile(profile);
  return profile;
}

function createPlayerProfile(playerId) {
  return {
    playerId,
    universeId: soloWorldId(playerId),
    publicName: createRandomPublicName(),
    friends: [],
    createdAt: Date.now(),
    lastSeenAt: Date.now()
  };
}

function normalizeProfile(source, fallbackPlayerId) {
  const snapshot = source && typeof source === "object" ? source : {};
  const playerId = sanitizeText(snapshot.playerId, 80) || fallbackPlayerId;
  const friends = Array.isArray(snapshot.friends)
    ? snapshot.friends.map((friendId) => sanitizeText(friendId, 80)).filter(Boolean).filter(uniqueOnly)
    : [];

  return {
    playerId,
    universeId: soloWorldId(playerId),
    publicName: sanitizeText(snapshot.publicName, 32) || createRandomPublicName(),
    crazyGamesId: sanitizeDebugText(snapshot.crazyGamesId, 128),
    crazyGamesUsername: sanitizeDebugText(snapshot.crazyGamesUsername, 80),
    friends,
    createdAt: clampNumber(snapshot.createdAt, 0, Date.now()) || Date.now(),
    lastSeenAt: clampNumber(snapshot.lastSeenAt, 0, Date.now()) || Date.now()
  };
}

async function saveProfile(profile) {
  const normalized = normalizeProfile(profile, profile && profile.playerId);
  if (!normalized.playerId) {
    return normalized;
  }

  const pool = await getDbPool();
  if (!pool) {
    memoryPersistence.profiles.set(normalized.playerId, normalized);
    return normalized;
  }

  await ensureDatabaseSchema(pool);
  await pool.query(
    `INSERT INTO clusternauts_player_profile (player_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [normalized.playerId, JSON.stringify(normalized)]
  );
  return normalized;
}

async function listProfiles() {
  const pool = await getDbPool();
  if (!pool) {
    return Array.from(memoryPersistence.profiles.entries()).map(([playerId, profile]) => normalizeProfile(profile, playerId));
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT player_id, state FROM clusternauts_player_profile ORDER BY updated_at DESC LIMIT 200");
  return result.rows.map((row) => normalizeProfile(row.state, row.player_id));
}

async function listVisiblePlayers(playerId, query, friendsOnly, relayOnly) {
  const ownProfile = await ensurePlayerProfile(playerId);
  const cleanQuery = String(query || "").trim().toLowerCase();
  const friendSet = new Set(ownProfile ? ownProfile.friends : []);
  const profiles = await listProfiles();
  const onlineIds = new Set(Array.from(clientsByPlayerId.keys()));
  const ownHasRelay = playerHasCommunicationRelay(playerId);

  if (relayOnly && !ownHasRelay) {
    return [];
  }

  return profiles
    .filter((profile) => profile.playerId !== playerId)
    .filter((profile) => !friendsOnly || friendSet.has(profile.playerId))
    .filter((profile) => !cleanQuery || profile.publicName.toLowerCase().includes(cleanQuery))
    .filter((profile) => !relayOnly || (onlineIds.has(profile.playerId) && playerHasCommunicationRelay(profile.playerId)))
    .slice(0, 80)
    .map((profile) => ({
      playerId: profile.playerId,
      universeId: profile.universeId,
      publicName: profile.publicName,
      friend: friendSet.has(profile.playerId),
      online: onlineIds.has(profile.playerId),
      hasCommunicationRelay: playerHasCommunicationRelay(profile.playerId),
      lastSeenAt: profile.lastSeenAt
    }));
}

function playerHasCommunicationRelay(playerId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return false;
  }

  for (const client of clients) {
    if (snapshotHasCommunicationRelay(client.lastSnapshot)) {
      return true;
    }
  }

  return false;
}

function snapshotHasCommunicationRelay(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return false;
  }

  if (snapshot.player && snapshot.player.hasCommunicationRelay) {
    return true;
  }

  const structures = snapshot.world && Array.isArray(snapshot.world.structures) ? snapshot.world.structures : [];
  return structures.some((structure) => (
    structure &&
    structure.type === "communication-relay" &&
    Number(structure.health) > 0
  ));
}

function canRelayLinkPlayers(playerId, targetPlayerId) {
  const playerClient = firstOnlineClient(playerId);
  const targetClient = firstOnlineClient(targetPlayerId);
  if (playerClient && targetClient && playerClient.relayBypass && targetClient.relayBypass) {
    return true;
  }

  return playerHasCommunicationRelay(playerId) && playerHasCommunicationRelay(targetPlayerId);
}

async function addFriendship(playerId, targetPlayerId) {
  const profile = await ensurePlayerProfile(playerId);
  const targetProfile = await ensurePlayerProfile(targetPlayerId);

  if (!profile || !targetProfile) {
    return null;
  }

  if (!profile.friends.includes(targetProfile.playerId)) {
    profile.friends.push(targetProfile.playerId);
  }
  if (!targetProfile.friends.includes(profile.playerId)) {
    targetProfile.friends.push(profile.playerId);
  }

  await saveProfile(profile);
  await saveProfile(targetProfile);
  return {
    player: profile,
    target: targetProfile
  };
}

function createRandomPublicName() {
  const adjectives = ["Nova", "Ion", "Solar", "Comet", "Pulse", "Orbit", "Vega", "Quasar", "Lunar", "Echo"];
  const nouns = ["Drifter", "Miner", "Pilot", "Signal", "Voyager", "Builder", "Ranger", "Spark", "Anchor", "Runner"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${noun} ${number}`;
}

function uniqueOnly(value, index, array) {
  return array.indexOf(value) === index;
}

function countOnlinePlayers() {
  return clientsByPlayerId.size;
}

function notifyProfileChanged(playerId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return;
  }

  for (const client of clients) {
    void sendClientBootstrap(client);
  }
}

async function getDbPool() {
  if (!dbPoolPromise) {
    dbPoolPromise = createDbPool();
  }

  return dbPoolPromise;
}

async function createDbPool() {
  const connectionString = readDatabaseAddress();

  if (!connectionString) {
    console.warn("Clusternauts persistence is using memory: no database address found.");
    return null;
  }

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    });
    await pool.query("SELECT 1");
    console.log("Clusternauts persistence connected to PostgreSQL.");
    return pool;
  } catch (error) {
    console.warn(
      `Clusternauts persistence is using memory: ${error instanceof Error ? error.message : "PostgreSQL unavailable."}`
    );
    return null;
  }
}

function readDatabaseAddress() {
  if (process.env.CLUSTERNAUTS_DATABASE_URL || process.env.DATABASE_URL) {
    return normalizeDatabaseAddress(
      databaseAddressFromConfigValue(
        process.env.CLUSTERNAUTS_DATABASE_URL || process.env.DATABASE_URL,
        "Clusternauts database environment variable"
      )
    );
  }

  const configPath = path.join(root, "data", "db-uri.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return normalizeDatabaseAddress(selectDatabaseAddress(config));
  } catch (error) {
    console.warn(`Could not read database config: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return null;
  }
}

function databaseAddressFromConfigValue(value, source) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  if (!raw.startsWith("{")) {
    return raw;
  }

  try {
    return selectDatabaseAddress(JSON.parse(raw));
  } catch (error) {
    console.warn(`Could not read ${source}: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return null;
  }
}

function selectDatabaseAddress(config) {
  if (!config || typeof config !== "object") {
    return null;
  }

  const devAddress = typeof config.dev_address === "string" ? config.dev_address.trim() : "";
  const prodAddress = typeof config.prod_address === "string" ? config.prod_address.trim() : "";
  const useProd = process.env.CLUSTERNAUTS_DB_TARGET === "prod" || process.env.NODE_ENV === "production";
  return useProd ? prodAddress || devAddress : devAddress || prodAddress;
}

function normalizeDatabaseAddress(address) {
  if (typeof address !== "string" || !address.trim()) {
    return null;
  }

  return address.trim().replace(/^postgresql\+psycopg2:\/\//, "postgresql://").replace(/ /g, "%20");
}

async function ensureDatabaseSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_world_state (
      id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_player_state (
      player_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_player_profile (
      player_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_leaderboard_entry (
      id text PRIMARY KEY,
      player_id text NOT NULL,
      score double precision NOT NULL,
      state jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_account (
      username text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_account_session (
      token_hash text PRIMARY KEY,
      username text NOT NULL,
      state jsonb NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_account_save (
      id text PRIMARY KEY,
      username text NOT NULL,
      name text NOT NULL,
      state jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

function evolveWorldState(snapshot) {
  const world = normalizeWorldState(snapshot);
  const now = Date.now();
  const elapsedTicks = Math.min(720, Math.floor((now - world.lastEvolvedAt) / worldTickMs));

  if (elapsedTicks <= 0) {
    return world;
  }

  const elapsedSeconds = (elapsedTicks * worldTickMs) / 1000;
  const move = (entity) => {
    entity.x += entity.vx * elapsedSeconds;
    entity.y += entity.vy * elapsedSeconds;
  };

  for (const particle of world.particles) {
    move(particle);
  }

  for (const alienoid of world.alienoids) {
    if (!alienoid.landed && alienoid.health > 0) {
      move(alienoid);
    }
  }

  for (const ufo of world.ufos) {
    if (ufo.health > 0) {
      move(ufo);
    }
  }

  for (const rambot of world.rambots) {
    if (rambot.health > 0) {
      move(rambot);
    }
  }

  for (const engineer of world.engineers) {
    if (engineer.health > 0) {
      move(engineer);
    }
  }

  for (const tesla of world.teslas) {
    if (tesla.health > 0) {
      move(tesla);
    }
  }

  for (const rocket of world.rockets) {
    if (rocket.health > 0) {
      move(rocket);
    }
  }

  for (const fighter of world.fighters) {
    if (fighter.health > 0) {
      move(fighter);
    }
  }

  for (const projectile of world.rivalProjectiles) {
    move(projectile);
    projectile.life = Math.max(0, projectile.life - elapsedSeconds);
  }

  world.rivalProjectiles = world.rivalProjectiles.filter((projectile) => projectile.life > 0);
  world.elapsed += elapsedSeconds;
  world.lastEvolvedAt += elapsedTicks * worldTickMs;
  return world;
}

function normalizeWorldState(snapshot) {
  const defaults = createDefaultWorldState();
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const alienoidSource = Array.isArray(source.alienoids) ? source.alienoids : source.rivals;

  return {
    ...defaults,
    version: 1,
    elapsed: clampNumber(source.elapsed, 0, Number.MAX_SAFE_INTEGER),
    particles: Array.isArray(source.particles) ? source.particles.map(normalizeParticle).filter(Boolean).slice(0, 240) : [],
    alienoids: Array.isArray(alienoidSource) ? alienoidSource.map(normalizeAlienoid).filter(Boolean).slice(0, 80) : [],
    ufos: Array.isArray(source.ufos) ? source.ufos.map(normalizeUfo).filter(Boolean).slice(0, 40) : [],
    rambots: Array.isArray(source.rambots) ? source.rambots.map(normalizeRambot).filter(Boolean).slice(0, 40) : [],
    engineers: Array.isArray(source.engineers) ? source.engineers.map(normalizeEngineer).filter(Boolean).slice(0, 40) : [],
    teslas: Array.isArray(source.teslas) ? source.teslas.map(normalizeTesla).filter(Boolean).slice(0, 40) : [],
    rockets: Array.isArray(source.rockets) ? source.rockets.map(normalizeRocket).filter(Boolean).slice(0, 40) : [],
    fighters: Array.isArray(source.fighters) ? source.fighters.map(normalizeFighter).filter(Boolean).slice(0, 40) : [],
    structures: Array.isArray(source.structures) ? source.structures.map(normalizeStructure).filter(Boolean).slice(0, 120) : [],
    rivalProjectiles: Array.isArray(source.rivalProjectiles)
      ? source.rivalProjectiles.map(normalizeProjectile).filter(Boolean).slice(0, 160)
      : [],
    techPickups: Array.isArray(source.techPickups) ? source.techPickups.map(normalizeTechPickup).filter(Boolean).slice(0, 80) : [],
    healthPickups: Array.isArray(source.healthPickups) ? source.healthPickups.map(normalizeHealthPickup).filter(Boolean).slice(0, 80) : [],
    starDust: Array.isArray(source.starDust) ? source.starDust.map(normalizeStar).filter(Boolean).slice(0, 360) : [],
    difficulty: sanitizeText(source.difficulty, 16) || "medium",
    nextParticleId: Math.max(1, Math.floor(Number(source.nextParticleId) || 1)),
    nextAlienoidId: Math.max(1, Math.floor(Number(source.nextAlienoidId) || Number(source.nextRivalId) || 1)),
    nextUfoId: Math.max(1, Math.floor(Number(source.nextUfoId) || 1)),
    nextRambotId: Math.max(1, Math.floor(Number(source.nextRambotId) || 1)),
    nextEngineerId: Math.max(1, Math.floor(Number(source.nextEngineerId) || 1)),
    nextTeslaId: Math.max(1, Math.floor(Number(source.nextTeslaId) || 1)),
    nextRocketId: Math.max(1, Math.floor(Number(source.nextRocketId) || 1)),
    nextFighterId: Math.max(1, Math.floor(Number(source.nextFighterId) || 1)),
    nextStructureId: Math.max(1, Math.floor(Number(source.nextStructureId) || 1)),
    nextRivalProjectileId: Math.max(1, Math.floor(Number(source.nextRivalProjectileId) || 1)),
    nextTechPickupId: Math.max(1, Math.floor(Number(source.nextTechPickupId) || 1)),
    nextHealthPickupId: Math.max(1, Math.floor(Number(source.nextHealthPickupId) || 1)),
    mobSpawnTimers: normalizeMobSpawnTimers(source.mobSpawnTimers),
    mobSpawnRestTimer: clampNumber(source.mobSpawnRestTimer, 0, 45),
    mobSpawnRestDrainTimer: clampNumber(source.mobSpawnRestDrainTimer, 0, 90),
    mobSpawnRestCooldownTimer: Number.isFinite(Number(source.mobSpawnRestCooldownTimer))
      ? clampNumber(source.mobSpawnRestCooldownTimer, 0, 150)
      : 150,
    mobDefeatsByKind: normalizeMobDefeatsByKind(source.mobDefeatsByKind),
    mobBossWarnings: normalizeMobBossWarnings(source.mobBossWarnings),
    lastEvolvedAt: clampNumber(source.lastEvolvedAt, 0, Date.now()) || Date.now()
  };
}

function normalizePlayerSnapshot(playerId, snapshot) {
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const tools = normalizeToolInventory(source.tools);
  const equippedTools = normalizeEquippedToolInventory(source.equippedTools, tools);
  const equippedTool = equippedTools.includes(source.equippedTool) ? source.equippedTool : equippedTools[0] || null;
  const toolMode = ["pull", "push", "hold", "fire", "idle"].includes(source.toolMode) ? source.toolMode : "idle";
  const activeToolMode = equippedTool ? toolMode : "idle";
  const maxEnergy = Number.isFinite(Number(source.maxEnergy)) ? clampNumber(source.maxEnergy, 1, 260) : 100;

  return {
    id: playerId,
    name: sanitizeText(source.name, 32) || `Player ${playerId.slice(-4).toUpperCase()}`,
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 120),
    health: clampNumber(source.health, 0, 100),
    maxHealth: clampNumber(source.maxHealth, 1, 100),
    energy: Number.isFinite(Number(source.energy)) ? clampNumber(source.energy, 0, maxEnergy) : maxEnergy,
    maxEnergy,
    score: Math.max(1, Math.round(clampNumber(source.score, 1, 1000000000))),
    difficulty: sanitizeText(source.difficulty, 16) || "medium",
    tech: normalizeTechInventory(source.tech),
    tools,
    equippedTools,
    toolUpgrades: normalizeToolUpgrades(source.toolUpgrades),
    equippedTool,
    landed: normalizeLanding(source.landed),
    walkCycle: clampNumber(source.walkCycle, 0, Number.MAX_SAFE_INTEGER),
    cameraRoll: clampNumber(source.cameraRoll, -Math.PI * 16, Math.PI * 16),
    hasCommunicationRelay: Boolean(source.hasCommunicationRelay),
    aimAngle: Number.isFinite(Number(source.aimAngle)) ? clampNumber(source.aimAngle, -Math.PI * 16, Math.PI * 16) : 0,
    aimLocalAngle: Number.isFinite(Number(source.aimLocalAngle)) ? clampNumber(source.aimLocalAngle, -Math.PI * 16, Math.PI * 16) : 0,
    toolMode: activeToolMode,
    toolActive: Boolean(equippedTool && (source.toolActive || activeToolMode !== "idle")),
    moving: Boolean(source.moving),
    crouching: Boolean(source.crouching),
    savedAt: Date.now()
  };
}

function normalizeTechInventory(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const tech = {};

  for (const key of techKeys) {
    tech[key] = Math.floor(clampNumber(snapshot[key], 0, 1000000000));
  }

  return tech;
}

function normalizeToolUpgrades(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const upgrades = {};

  for (const [toolId, upgradeIds] of Object.entries(toolUpgradeKeys)) {
    const toolLevels = snapshot[toolId] && typeof snapshot[toolId] === "object" ? snapshot[toolId] : {};
    upgrades[toolId] = {};
    for (const upgradeId of upgradeIds) {
      upgrades[toolId][upgradeId] = clampNumber(toolLevels[upgradeId], 0, 1000000);
    }
  }

  return upgrades;
}

function normalizeToolInventory(source) {
  const tools = Array.isArray(source) ? source : [];
  const validTools = tools.filter((tool, index) => toolKeys.includes(tool) && tools.indexOf(tool) === index);
  return validTools.includes("suction-gadget") ? validTools : ["suction-gadget"].concat(validTools);
}

function normalizeEquippedToolInventory(source, ownedTools) {
  const owned = Array.isArray(ownedTools) ? ownedTools : normalizeToolInventory(null);
  const tools = Array.isArray(source) ? source : owned;
  return tools.filter((tool, index) => toolKeys.includes(tool) && owned.includes(tool) && tools.indexOf(tool) === index);
}

function normalizeParticle(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    mass: clampNumber(source.mass, 1, 100000000),
    radius: clampNumber(source.radius, 1, 5000),
    energy: clampNumber(source.energy, 0, 1000000),
    maxEnergy: clampNumber(source.maxEnergy, 0, 1000000),
    color: normalizeColor(source.color),
    textureSeed: clampNumber(source.textureSeed, -1000000, 1000000),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    pulse: clampNumber(source.pulse, 0.1, 4)
  };
}

function normalizeMobSpawnTimers(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const timer = (key, interval) => {
    const number = Number(snapshot[key]);
    return Number.isFinite(number) ? Math.max(0, Math.min(interval, number)) : interval;
  };

  return {
    alienoid: timer("alienoid", 120),
    ufo: timer("ufo", 180),
    rambot: timer("rambot", 300),
    tesla: timer("tesla", 420),
    engineer: timer("engineer", 660),
    satellite: timer("satellite", 780),
    rocket: timer("rocket", 840),
    fighter: timer("fighter", 960)
  };
}

function normalizeMobDefeatsByKind(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const defeats = {};

  for (const kind of mobTierOrder) {
    const number = Number(snapshot[kind]);
    defeats[kind] = Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }

  return defeats;
}

function normalizeMobBossWarnings(source) {
  const snapshot = source && typeof source === "object" ? source : {};
  const warnings = {};
  for (const kind of mobTierOrder) {
    const warning = snapshot[kind] && typeof snapshot[kind] === "object" ? snapshot[kind] : {};
    warnings[kind] = {
      active: Boolean(warning.active),
      timer: clampNumber(warning.timer, 0, mobBossWarningDuration),
      lastNoticeSecond: Math.floor(clampNumber(warning.lastNoticeSecond, -1, mobBossWarningDuration))
    };
  }
  return warnings;
}

function normalizeMobBossFields(source, kind, baseHealth) {
  const isBoss = Boolean(source && source.isBoss);
  const maxHealth = isBoss ? baseHealth * mobBossHealthMultiplier : baseHealth;
  return {
    isBoss,
    bossBaseKind: isBoss && mobTierOrder.includes(source.bossBaseKind) ? source.bossBaseKind : (isBoss ? kind : ""),
    minionCooldown: isBoss ? clampNumber(source.minionCooldown, 0, mobBossMinionCooldownMax) : 0,
    maxHealth
  };
}

function normalizeAlienoid(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const boss = normalizeMobBossFields(source, "alienoid", 100);
  return {
    kind: "alienoid",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 120),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    respawnTimer: clampNumber(source.respawnTimer, 0, 3600),
    landed: normalizeLanding(source.landed),
    residentTier: sanitizeText(source.residentTier, 32) || null,
    shootCooldown: clampNumber(source.shootCooldown, 0, 60),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown
  };
}

function normalizeUfo(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const boss = normalizeMobBossFields(source, "ufo", 130);
  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 140),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    respawnTimer: clampNumber(source.respawnTimer, 0, 3600),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    beamAngle: clampNumber(source.beamAngle, -Math.PI * 16, Math.PI * 16),
    beamPulse: clampNumber(source.beamPulse, -Math.PI * 16, Math.PI * 16),
    tractorDisabledTimer: clampNumber(source.tractorDisabledTimer, 0, 20),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown
  };
}

function normalizeRambot(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const boss = normalizeMobBossFields(source, "rambot", 210);
  return {
    kind: "rambot",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 160),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    chargeCooldown: clampNumber(source.chargeCooldown, 0, 60),
    chargeTimer: clampNumber(source.chargeTimer, 0, 10),
    recoverTimer: clampNumber(source.recoverTimer, 0, 10),
    chargeDirX: clampNumber(source.chargeDirX, -1, 1),
    chargeDirY: clampNumber(source.chargeDirY, -1, 1),
    impactCooldown: clampNumber(source.impactCooldown, 0, 10),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown
  };
}

function normalizeEngineer(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const boss = normalizeMobBossFields(source, "engineer", 140);
  return {
    kind: "engineer",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 140),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    healCooldown: clampNumber(source.healCooldown, 0, 10),
    healPulse: clampNumber(source.healPulse, 0, 5),
    repairBeamAngle: clampNumber(source.repairBeamAngle, -Math.PI * 16, Math.PI * 16),
    targetKind: sanitizeText(source.targetKind, 32) || "",
    targetId: Math.max(0, Math.floor(Number(source.targetId) || 0)),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown
  };
}

function normalizeTesla(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const boss = normalizeMobBossFields(source, "tesla", 150);
  return {
    kind: "tesla",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 140),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    shootCooldown: clampNumber(source.shootCooldown, 0, 60),
    lightningWarmup: clampNumber(source.lightningWarmup, 0, 1),
    lightningFlash: clampNumber(source.lightningFlash, 0, 5),
    lightningAngle: clampNumber(source.lightningAngle, -Math.PI * 16, Math.PI * 16),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown
  };
}

function normalizeRocket(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const legacyShooter = !Number.isFinite(Number(source.chargeCooldown)) && Number.isFinite(Number(source.scanProgress));
  const kind = source.kind === "satellite" || legacyShooter ? "satellite" : "rocket";
  const maxHealth = kind === "satellite" ? 180 : 170;
  const boss = normalizeMobBossFields(source, kind, maxHealth);

  return {
    kind,
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1600, 1600),
    vy: clampNumber(source.vy, -1600, 1600),
    radius: clampNumber(source.radius, 8, 150),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    scannerAngle: clampNumber(source.scannerAngle, -Math.PI * 16, Math.PI * 16),
    scanProgress: clampNumber(source.scanProgress, 0, 1),
    lockTimer: clampNumber(source.lockTimer, 0, 10),
    blastTimer: clampNumber(source.blastTimer, 0, 10),
    recoverTimer: clampNumber(source.recoverTimer, 0, 10),
    lockX: clampNumber(source.lockX, -1000000, 1000000),
    lockY: clampNumber(source.lockY, -1000000, 1000000),
    blastDirX: clampNumber(source.blastDirX, -1, 1),
    blastDirY: clampNumber(source.blastDirY, -1, 1),
    volleyTimer: clampNumber(source.volleyTimer, 0, 10),
    volleyShots: Math.max(0, Math.floor(clampNumber(source.volleyShots, 0, 12))),
    chargeCooldown: clampNumber(source.chargeCooldown, 0, 10),
    chargeTimer: clampNumber(source.chargeTimer, 0, 10),
    chargeDirX: clampNumber(source.chargeDirX, -1, 1),
    chargeDirY: clampNumber(source.chargeDirY, -1, 1),
    chargePower: clampNumber(source.chargePower, 0, 1),
    impactCooldown: clampNumber(source.impactCooldown, 0, 10),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown
  };
}

function normalizeFighter(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const boss = normalizeMobBossFields(source, "fighter", 230);
  return {
    kind: "fighter",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 160),
    health: clampNumber(source.health, 0, boss.maxHealth),
    maxHealth: clampNumber(source.maxHealth, 1, boss.maxHealth),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    shootCooldown: clampNumber(source.shootCooldown, 0, 60),
    machineGunShots: Math.max(0, Math.floor(clampNumber(source.machineGunShots, 0, 24))),
    machineGunTimer: clampNumber(source.machineGunTimer, 0, 2),
    shieldCharge: clampNumber(source.shieldCharge, 0, 3),
    shieldRecharge: clampNumber(source.shieldRecharge, 0, 10),
    shieldActive: clampNumber(source.shieldActive, 0, 5),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16),
    isBoss: boss.isBoss,
    bossBaseKind: boss.bossBaseKind,
    minionCooldown: boss.minionCooldown,
    altAttackCooldown: boss.isBoss ? clampNumber(source.altAttackCooldown, 0, mobBossAltAttackCooldownMax) : 0
  };
}

function normalizeStructure(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const type = source.type === "turret" || source.type === "missile-launcher" || source.type === "accumulator" || source.type === "shield-generator" || source.type === "plating-block" || source.type === "battery" || source.type === "communication-relay" || source.type === "jet" || source.type === "tether" || source.type === "bridge" ? source.type : null;
  if (!type) {
    return null;
  }

  const structureMaxHealth = type === "plating-block" ? 150 : type === "bridge" ? 170 : type === "tether" || type === "shield-generator" ? 130 : type === "missile-launcher" ? 125 : type === "accumulator" || type === "battery" || type === "communication-relay" || type === "jet" ? 120 : 110;
  const maxHealth = Number.isFinite(Number(source.maxHealth))
    ? clampNumber(source.maxHealth, 1, 200)
    : structureMaxHealth;
  const health = Number.isFinite(Number(source.health))
    ? clampNumber(source.health, 0, maxHealth)
    : maxHealth;

  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    type,
    bodyId: Math.max(1, Math.floor(Number(source.bodyId) || 1)),
    linkedBodyId: Math.max(0, Math.floor(Number(source.linkedBodyId) || 0)),
    angle: clampNumber(source.angle, -Math.PI * 16, Math.PI * 16),
    linkedAngle: Number.isFinite(Number(source.linkedAngle)) ? clampNumber(source.linkedAngle, -Math.PI * 16, Math.PI * 16) : clampNumber(source.angle, -Math.PI * 16, Math.PI * 16),
    surfaceOffset: clampNumber(source.surfaceOffset, 0, 10000),
    linkedSurfaceOffset: Number.isFinite(Number(source.linkedSurfaceOffset)) ? clampNumber(source.linkedSurfaceOffset, 0, 10000) : 0,
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    x2: Number.isFinite(Number(source.x2)) ? clampNumber(source.x2, -1000000, 1000000) : clampNumber(source.x, -1000000, 1000000),
    y2: Number.isFinite(Number(source.y2)) ? clampNumber(source.y2, -1000000, 1000000) : clampNumber(source.y, -1000000, 1000000),
    restLength: Number.isFinite(Number(source.restLength)) ? clampNumber(source.restLength, 0, 1000000) : 0,
    restCenterDx: Number.isFinite(Number(source.restCenterDx)) ? clampNumber(source.restCenterDx, -1000000, 1000000) : 0,
    restCenterDy: Number.isFinite(Number(source.restCenterDy)) ? clampNumber(source.restCenterDy, -1000000, 1000000) : 0,
    aimAngle: clampNumber(source.aimAngle, -Math.PI * 16, Math.PI * 16),
    deploy: clampNumber(source.deploy, 0, 1),
    thrustAmount: clampNumber(source.thrustAmount, 0, 1),
    thrustDirection: Number(source.thrustDirection) < 0 ? -1 : 1,
    shootCooldown: clampNumber(source.shootCooldown, 0, 60),
    burstTimer: clampNumber(source.burstTimer, 0, 60),
    burstCooldown: clampNumber(source.burstCooldown, 0, 60),
    missileCharge: clampNumber(source.missileCharge, 0, 1),
    lockTimer: clampNumber(source.lockTimer, 0, 10),
    beepTimer: clampNumber(source.beepTimer, 0, 10),
    targetX: Number.isFinite(Number(source.targetX)) ? clampNumber(source.targetX, -1000000, 1000000) : 0,
    targetY: Number.isFinite(Number(source.targetY)) ? clampNumber(source.targetY, -1000000, 1000000) : 0,
    targetCount: Math.max(0, Math.floor(Number(source.targetCount) || 0)),
    health,
    maxHealth,
    disabledTimer: clampNumber(source.disabledTimer, 0, 20),
    flash: clampNumber(source.flash, 0, 5),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeProjectile(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2000, 2000),
    vy: clampNumber(source.vy, -2000, 2000),
    radius: clampNumber(source.radius, 1, 40),
    length: clampNumber(source.length, 1, 200),
    color: normalizeColor(source.color),
    life: clampNumber(source.life, 0, 20),
    maxLife: clampNumber(source.maxLife, 0, 20),
    damage: Number.isFinite(Number(source.damage)) ? clampNumber(source.damage, 0, 200) : 10,
    knockback: clampNumber(source.knockback, 0, 1000),
    toolDisable: clampNumber(source.toolDisable, 0, 20),
    cause: sanitizeText(source.cause, 64) || "",
    sourcePlayerId: sanitizeText(source.sourcePlayerId, 80) || "",
    sourceStructureId: sanitizeText(source.sourceStructureId, 80) || "",
    weaponLabel: sanitizeText(source.weaponLabel, 64) || "",
    piercesMobs: Boolean(source.piercesMobs),
    lightning: Boolean(source.lightning),
    rocket: Boolean(source.rocket),
    targetPlayerId: sanitizeText(source.targetPlayerId, 80) || "",
    targetStructureId: Math.max(0, Math.floor(Number(source.targetStructureId) || 0)),
    heatSeeking: Boolean(source.heatSeeking),
    targetSpeed: clampNumber(source.targetSpeed, 0, 2000),
    turnRate: clampNumber(source.turnRate, 0, 20)
  };
}

function normalizeTechPickup(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  const key = techKeys.includes(source.key) ? source.key : techKeys[0];
  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    key,
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2000, 2000),
    vy: clampNumber(source.vy, -2000, 2000),
    radius: clampNumber(source.radius, 1, 80),
    life: clampNumber(source.life, 0, 60),
    maxLife: clampNumber(source.maxLife, 0, 60),
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeHealthPickup(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2000, 2000),
    vy: clampNumber(source.vy, -2000, 2000),
    radius: clampNumber(source.radius, 1, 80),
    heal: clampNumber(source.heal, 1, 100),
    life: clampNumber(source.life, 0, 60),
    maxLife: clampNumber(source.maxLife, 0, 60),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeStar(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    r: clampNumber(source.r, 0.1, 8),
    a: clampNumber(source.a, 0, 1)
  };
}

function normalizeColor(source) {
  return {
    r: Math.round(clampNumber(source && source.r, 0, 255)),
    g: Math.round(clampNumber(source && source.g, 0, 255)),
    b: Math.round(clampNumber(source && source.b, 0, 255))
  };
}

function normalizeLanding(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    bodyId: Math.max(1, Math.floor(Number(source.bodyId) || 1)),
    bridgeId: Math.max(0, Math.floor(Number(source.bridgeId) || 0)),
    bridgeT: clampNumber(source.bridgeT, 0, 1000000),
    bridgeSide: Number(source.bridgeSide) < 0 ? -1 : 1,
    bridgeInputSign: Number(source.bridgeInputSign) < 0 ? -1 : 1,
    angle: clampNumber(source.angle, -Math.PI * 16, Math.PI * 16),
    walkSpeed: clampNumber(source.walkSpeed, -500, 500),
    walkCycle: clampNumber(source.walkCycle, 0, Number.MAX_SAFE_INTEGER)
  };
}

function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > maxJsonBodyBytes) {
        request.destroy();
        rejectBody(new Error("Request body too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolveBody(null);
        return;
      }

      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error("Invalid JSON."));
      }
    });

    request.on("error", rejectBody);
  });
}

function writeJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, number));
}

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^\w .:'-]/g, "").trim().slice(0, maxLength);
}

function sanitizeAccountUsername(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.toLowerCase().replace(/[^\w.-]/g, "").slice(0, 24);
}

function sanitizeManualSaveName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^\w .:'-]/g, "").trim().replace(/\s+/g, " ").slice(0, 32);
}

function sanitizeDebugText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function sanitizeClientErrorReport(body) {
  const report = body && typeof body === "object" ? body : {};
  return {
    kind: sanitizeDebugText(report.kind, 40) || "error",
    message: sanitizeDebugText(report.message, 500) || "Unknown client error",
    source: sanitizeDebugText(report.source, 500),
    line: Math.max(0, Math.floor(clampNumber(report.line, 0, 1000000))),
    column: Math.max(0, Math.floor(clampNumber(report.column, 0, 1000000))),
    stack: sanitizeDebugText(report.stack, 4000),
    userAgent: sanitizeDebugText(report.userAgent, 500),
    href: sanitizeDebugText(report.href, 500),
    timestamp: sanitizeDebugText(report.timestamp, 40)
  };
}

async function verifyCrazyGamesUserToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throwHttpError(401, "Invalid CrazyGames user token.");
  }

  let header = null;
  let payload = null;
  try {
    header = decodeJwtJson(parts[0]);
    payload = decodeJwtJson(parts[1]);
  } catch {
    throwHttpError(401, "Invalid CrazyGames user token.");
  }

  if (!header || header.alg !== "RS256") {
    throwHttpError(401, "Unsupported CrazyGames token signature.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Number.isFinite(Number(payload.exp)) && Number(payload.exp) <= nowSeconds) {
    throwHttpError(401, "CrazyGames user token expired.");
  }

  const signingInput = Buffer.from(parts[0] + "." + parts[1]);
  const signature = base64UrlToBuffer(parts[2]);
  let publicKey = await getCrazyGamesPublicKey(false);
  let verified = verifyRs256Signature(signingInput, signature, publicKey);

  if (!verified) {
    publicKey = await getCrazyGamesPublicKey(true);
    verified = verifyRs256Signature(signingInput, signature, publicKey);
  }

  if (!verified) {
    throwHttpError(401, "CrazyGames user token signature is invalid.");
  }

  const userId = sanitizeDebugText(payload.userId, 128);
  if (!userId) {
    throwHttpError(401, "CrazyGames user token is missing a user id.");
  }

  return {
    userId,
    gameId: sanitizeDebugText(payload.gameId, 80),
    username: sanitizeDebugText(payload.username, 80),
    profilePictureUrl: sanitizeDebugText(payload.profilePictureUrl, 300)
  };
}

function verifyRs256Signature(signingInput, signature, publicKey) {
  try {
    return crypto.verify("RSA-SHA256", signingInput, publicKey, signature);
  } catch {
    return false;
  }
}

function decodeJwtJson(segment) {
  return JSON.parse(base64UrlToBuffer(segment).toString("utf8"));
}

function base64UrlToBuffer(segment) {
  const value = String(segment || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

async function getCrazyGamesPublicKey(forceRefresh) {
  if (!forceRefresh && crazyGamesPublicKeyCache.publicKey && crazyGamesPublicKeyCache.expiresAt > Date.now()) {
    return crazyGamesPublicKeyCache.publicKey;
  }

  const data = await fetchJsonOverHttps(crazyGamesPublicKeyUrl, 3500);
  const publicKey = data && typeof data.publicKey === "string" ? data.publicKey : "";
  if (!publicKey) {
    throwHttpError(503, "Could not load CrazyGames public key.");
  }

  crazyGamesPublicKeyCache.publicKey = publicKey;
  crazyGamesPublicKeyCache.expiresAt = Date.now() + 5 * 60 * 1000;
  return publicKey;
}

function fetchJsonOverHttps(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: timeoutMs }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
        if (body.length > 100000) {
          request.destroy(new Error("CrazyGames public key response too large."));
        }
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error("CrazyGames public key request failed with status " + response.statusCode + "."));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("timeout", () => request.destroy(new Error("CrazyGames public key request timed out.")));
    request.on("error", reject);
  });
}

function applyCorsHeaders(request, response) {
  const allowedOrigin = allowedCorsOrigin(request.headers.origin);
  if (!allowedOrigin) {
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Ngrok-Skip-Browser-Warning");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Max-Age", "600");
  response.setHeader("Vary", "Origin");
}

function allowedCorsOrigin(origin) {
  if (!origin) {
    return "";
  }

  try {
    const parsedOrigin = new URL(origin);
    const hostName = parsedOrigin.hostname.toLowerCase();
    if (parsedOrigin.protocol !== "https:") {
      return "";
    }
    return isCrazyGamesHostName(hostName) || isItchHostName(hostName) || isGamePixHostName(hostName) ? origin : "";
  } catch {
    return "";
  }
}

function isCrazyGamesHostName(hostName) {
  const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
  const parts = host.split(".").filter(Boolean);
  const crazyGamesIndex = parts.indexOf("crazygames");
  if (crazyGamesIndex !== -1 && crazyGamesIndex >= parts.length - 3) {
    return true;
  }

  return (
    host === "crazygamesgame.com" ||
    host.endsWith(".crazygamesgame.com")
  );
}

function isItchHostName(hostName) {
  const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
  return (
    host === "itch.io" ||
    host.endsWith(".itch.io") ||
    host === "itch.zone" ||
    host.endsWith(".itch.zone")
  );
}

function isGamePixHostName(hostName) {
  const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
  return host === "gamepix.com" || host.endsWith(".gamepix.com");
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function requestOrigin(request) {
  const proto = request.headers["x-forwarded-proto"] || "http";
  const hostName = request.headers["x-forwarded-host"] || request.headers.host || `127.0.0.1:${port}`;
  return `${proto}://${hostName}`;
}

function serviceBaseUrl(request) {
  return configuredPublicUrl || requestOrigin(request);
}

function safeReturnPath(value) {
  const pathValue = String(value || "").trim();
  if (!pathValue || !pathValue.startsWith("/") || pathValue.startsWith("//")) {
    return "/";
  }
  if (pathValue.startsWith("/auth/launch/callback")) {
    return "/";
  }
  return pathValue;
}

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  }
  return cookies;
}

function buildAccountSessionCookie(request, token) {
  const secureRequest = requestOrigin(request).startsWith("https://");
  const secure = secureRequest ? "; Secure" : "";
  const sameSite = secureRequest ? "None" : "Lax";
  return `${accountSessionCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${Math.floor(sessionLifetimeMs / 1000)}${secure}`;
}

function clearAccountSessionCookie(request) {
  const secureRequest = requestOrigin(request).startsWith("https://");
  const secure = secureRequest ? "; Secure" : "";
  const sameSite = secureRequest ? "None" : "Lax";
  return `${accountSessionCookie}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`;
}

function throwHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

server.on("upgrade", (request, socket) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname !== "/ws") {
    logMultiplayer("ws upgrade rejected", { path: url.pathname });
    socket.destroy();
    return;
  }

  const key = request.headers["sec-websocket-key"];
  if (!key) {
    logMultiplayer("ws upgrade rejected", { reason: "missing sec-websocket-key" });
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      ""
    ].join("\r\n") + "\r\n"
  );

  const client = {
    socket,
    buffer: Buffer.alloc(0),
    playerId: "",
    universeId: "",
    profile: null,
    lastSnapshot: null,
    multiplayerOptIn: true,
    relayBypass: false,
    lobbyId: "",
    partySessionId: "",
    overlaps: new Set(),
    closed: false,
    fragmentedMessageParts: [],
    fragmentedMessageBytes: 0
  };

  sockets.add(client);
  logMultiplayer("ws connected", {
    remoteAddress: socket.remoteAddress,
    sockets: sockets.size
  });
  socket.on("data", (chunk) => handleSocketData(client, chunk));
  socket.on("close", () => handleSocketClose(client, "close"));
  socket.on("error", (error) => {
    const details = {
      playerId: client.playerId || null,
      code: error && error.code ? String(error.code) : "",
      message: error instanceof Error ? error.message : "unknown error"
    };
    if (isExpectedWsDisconnectError(error)) {
      logMultiplayer("ws socket disconnected", details);
    } else {
      logClusternautsError("ws socket error", details);
    }
    handleSocketClose(client, "error");
  });
});

function handleSocketData(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);
  const decoded = decodeWsFrames(client.buffer);
  client.buffer = decoded.remaining;

  for (const frame of decoded.frames) {
    if (frame.opcode === 8) {
      client.socket.end();
      return;
    }

    if (frame.opcode === 9) {
      client.socket.write(encodeWsFrame(frame.payload, 10));
      continue;
    }

    if (frame.opcode === 1) {
      client.fragmentedMessageParts = [frame.payload];
      client.fragmentedMessageBytes = frame.payload.length;
      if (client.fragmentedMessageBytes > maxJsonBodyBytes) {
        logClusternautsError("ws message too large", {
          playerId: client.playerId || null,
          bytes: client.fragmentedMessageBytes
        });
        sendWsJson(client, { type: "error", message: "WebSocket message too large." });
        client.socket.end();
        return;
      }

      if (frame.fin) {
        processWsTextMessage(client, frame.payload);
        client.fragmentedMessageParts = [];
        client.fragmentedMessageBytes = 0;
      }
      continue;
    }

    if (frame.opcode === 0) {
      if (!client.fragmentedMessageParts.length) {
        logMultiplayer("ws continuation ignored", {
          playerId: client.playerId || null,
          reason: "missing text frame"
        });
        continue;
      }

      client.fragmentedMessageParts.push(frame.payload);
      client.fragmentedMessageBytes += frame.payload.length;
      if (client.fragmentedMessageBytes > maxJsonBodyBytes) {
        logClusternautsError("ws message too large", {
          playerId: client.playerId || null,
          bytes: client.fragmentedMessageBytes
        });
        sendWsJson(client, { type: "error", message: "WebSocket message too large." });
        client.socket.end();
        return;
      }

      if (frame.fin) {
        processWsTextMessage(client, Buffer.concat(client.fragmentedMessageParts, client.fragmentedMessageBytes));
        client.fragmentedMessageParts = [];
        client.fragmentedMessageBytes = 0;
      }
      continue;
    }

    client.fragmentedMessageParts = [];
    client.fragmentedMessageBytes = 0;
  }
}

function processWsTextMessage(client, payload) {
  try {
    const message = JSON.parse(payload.toString("utf8"));
    void handleSocketMessage(client, message).catch((error) => {
      logClusternautsError("ws message handler failed", {
        playerId: client.playerId || null,
        messageType: message && typeof message === "object" ? message.type || null : null,
        message: error instanceof Error ? error.message : "handler failed",
        stack: error instanceof Error ? error.stack : ""
      });
      sendWsJson(client, { type: "error", message: "Server failed to process multiplayer message." });
    });
  } catch (error) {
    logClusternautsError("ws invalid json", {
      playerId: client.playerId || null,
      message: error instanceof Error ? error.message : "parse failed"
    });
    sendWsJson(client, { type: "error", message: "Invalid WebSocket JSON." });
  }
}

function decodeWsFrames(buffer) {
  const frames = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const start = offset;
    const first = buffer[offset++];
    const second = buffer[offset++];
    const fin = Boolean(first & 0x80);
    const opcode = first & 0x0f;
    const masked = Boolean(second & 0x80);
    let length = second & 0x7f;

    if (length === 126) {
      if (offset + 2 > buffer.length) {
        offset = start;
        break;
      }
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (offset + 8 > buffer.length) {
        offset = start;
        break;
      }
      const bigLength = buffer.readBigUInt64BE(offset);
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) {
        offset = start;
        break;
      }
      length = Number(bigLength);
      offset += 8;
    }

    const maskLength = masked ? 4 : 0;
    if (offset + maskLength + length > buffer.length) {
      offset = start;
      break;
    }

    let mask = null;
    if (masked) {
      mask = buffer.subarray(offset, offset + 4);
      offset += 4;
    }

    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    offset += length;

    if (mask) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= mask[i % 4];
      }
    }

    frames.push({ fin, opcode, payload });
  }

  return {
    frames,
    remaining: buffer.subarray(offset)
  };
}

function encodeWsFrame(payload, opcode) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
  const headerLength = data.length < 126 ? 2 : data.length <= 65535 ? 4 : 10;
  const header = Buffer.alloc(headerLength);
  header[0] = 0x80 | (opcode || 1);

  if (data.length < 126) {
    header[1] = data.length;
  } else if (data.length <= 65535) {
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
  } else {
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }

  return Buffer.concat([header, data]);
}

function isExpectedWsDisconnectError(error) {
  const code = error && error.code ? String(error.code) : "";
  return ["ECONNABORTED", "ECONNRESET", "EPIPE", "ETIMEDOUT", "ERR_STREAM_DESTROYED"].includes(code);
}

function isWsClientWritable(client) {
  return (
    client &&
    client.socket &&
    !client.closed &&
    !client.socket.destroyed &&
    !client.socket.writableEnded &&
    !client.socket.writableDestroyed
  );
}

function sendWsJson(client, payload) {
  if (!isWsClientWritable(client)) {
    logMultiplayer("ws send skipped", {
      playerId: client && client.playerId ? client.playerId : null,
      type: payload && payload.type,
      reason: "socket unavailable"
    });
    if (client && !client.closed) {
      handleSocketClose(client, "socket unavailable");
    }
    return;
  }

  try {
    client.socket.write(encodeWsFrame(JSON.stringify(payload), 1), (error) => {
      if (!error) {
        return;
      }

      const details = {
        playerId: client.playerId || null,
        type: payload && payload.type,
        code: error && error.code ? String(error.code) : "",
        message: error instanceof Error ? error.message : "send failed"
      };
      if (isExpectedWsDisconnectError(error)) {
        logMultiplayer("ws send disconnected", details);
      } else {
        logClusternautsError("ws send failed", details);
      }
      handleSocketClose(client, "send failed");
    });
  } catch (error) {
    const details = {
      playerId: client.playerId || null,
      type: payload && payload.type,
      code: error && error.code ? String(error.code) : "",
      message: error instanceof Error ? error.message : "send failed"
    };
    if (isExpectedWsDisconnectError(error)) {
      logMultiplayer("ws send disconnected", details);
    } else {
      logClusternautsError("ws send failed", details);
    }
    handleSocketClose(client, "send failed");
  }
}

async function handleSocketMessage(client, message) {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "hello") {
    logMultiplayer("ws hello received", {
      playerId: sanitizeText(message.playerId, 80) || null
    });
    await handleSocketHello(client, message);
    return;
  }

  if (!client.playerId) {
    logMultiplayer("ws message rejected", {
      type: message.type,
      reason: "missing hello"
    });
    sendWsJson(client, { type: "error", message: "Send hello before multiplayer messages." });
    return;
  }

  if (message.type === "input") {
    client.lastSnapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : client.lastSnapshot;
    if (Object.prototype.hasOwnProperty.call(message, "multiplayerOptIn")) {
      client.multiplayerOptIn = message.multiplayerOptIn !== false;
    }
    relayOverlapSnapshot(client);
    return;
  }

  if (message.type === "multiplayer.optIn") {
    client.multiplayerOptIn = message.enabled !== false;
    if (!client.multiplayerOptIn) {
      leaveClientOverlaps(client, true);
    }
    await sendClientBootstrap(client);
    return;
  }

  if (message.type === "signal.choice") {
    logMultiplayer("signal choice received", {
      playerId: client.playerId,
      signalId: sanitizeText(message.signalId, 80),
      choice: message.choice
    });
    handleSignalChoice(client, message);
    return;
  }

  if (message.type === "friend.invite") {
    logMultiplayer("friend invite received", {
      fromPlayerId: client.playerId,
      targetPlayerId: sanitizeText(message.targetPlayerId, 80)
    });
    await handleFriendInvite(client, message);
    return;
  }

  if (message.type === "friend.accept") {
    logMultiplayer("friend accept received", {
      fromPlayerId: client.playerId,
      targetPlayerId: sanitizeText(message.fromPlayerId || message.targetPlayerId, 80)
    });
    await handleFriendAccept(client, message);
    return;
  }

  if (message.type === "room.create") {
    logMultiplayer("room create received", {
      playerId: client.playerId,
      mode: sanitizeText(message.mode, 32)
    });
    handleRoomCreate(client, message);
    return;
  }

  if (message.type === "room.join") {
    logMultiplayer("room join received", {
      playerId: client.playerId,
      roomId: sanitizeText(message.roomId, 96),
      mode: sanitizeText(message.mode, 32)
    });
    handleRoomJoin(client, message);
    return;
  }

  if (message.type === "lobby.create") {
    handleLobbyCreate(client, message);
    return;
  }

  if (message.type === "lobby.join") {
    handleLobbyJoin(client, message);
    return;
  }

  if (message.type === "lobby.leave") {
    leaveClientLobby(client, true);
    return;
  }

  if (message.type === "lobby.kick") {
    handleLobbyKick(client, message);
    return;
  }

  if (message.type === "lobby.invite") {
    handleLobbyInvite(client, message);
    return;
  }

  if (message.type === "lobby.setDifficulty") {
    handleLobbyDifficulty(client, message);
    return;
  }

  if (message.type === "lobby.start") {
    handleLobbyStart(client, message);
    return;
  }

  if (message.type === "mp.v2.input") {
    handlePartyV2Input(client, message);
    return;
  }

  if (message.type === "mp.v2.action") {
    handlePartyV2Action(client, message);
    return;
  }

  if (message.type === "party.input") {
    handlePartyInput(client, message);
    return;
  }

  if (message.type === "party.world.snapshot") {
    handlePartyWorldSnapshot(client, message);
    return;
  }

  if (message.type === "party.respawn") {
    handlePartyRespawn(client, message);
    return;
  }

  if (message.type === "party.tech.pickup") {
    handlePartyTechPickup(client, message);
    return;
  }

  if (message.type === "party.health.pickup") {
    handlePartyHealthPickup(client, message);
    return;
  }

  if (message.type === "party.command") {
    handlePartyCommand(client, message);
    return;
  }

  if (
    message.type === "party.physics.start" ||
    message.type === "party.physics.state" ||
    message.type === "party.physics.end" ||
    message.type === "party.physics.authority" ||
    message.type === "party.physics.reject"
  ) {
    handlePartyPhysicsSession(client, message);
    return;
  }

  if (message.type === "anomaly.choice") {
    handleAnomalyChoice(client, message);
    return;
  }

  if (message.type === "interaction.choice") {
    logMultiplayer("interaction choice received", {
      fromPlayerId: client.playerId,
      targetPlayerId: sanitizeText(message.targetPlayerId, 80),
      choice: message.choice
    });
    await handlePlayerInteractionChoice(client, message);
    return;
  }

  if (message.type === "player.death") {
    logMultiplayer("player death received", {
      playerId: client.playerId
    });
    relayPlayerDeath(client, message);
    return;
  }

  if (message.type === "trade.offer" || message.type === "trade.accept") {
    relayToPlayer(sanitizeText(message.targetPlayerId, 80), {
      type: message.type,
      fromPlayerId: client.playerId,
      fromName: client.profile ? client.profile.publicName : client.playerId,
      offer: message.offer || null
    });
    return;
  }

  if (message.type === "entity.effect") {
    logMultiplayer("entity effect received", {
      fromPlayerId: client.playerId,
      targetUniverseId: sanitizeText(message.targetUniverseId, 96),
      entityType: message.effect && message.effect.entityType
    });
    relayEntityEffect(client, message);
    return;
  }

  if (message.type === "overlap.leave") {
    logMultiplayer("overlap leave received", { playerId: client.playerId });
    leaveClientOverlaps(client, true);
    return;
  }

  logMultiplayer("ws message ignored", {
    playerId: client.playerId,
    type: message.type || null
  });
}

async function handleSocketHello(client, message) {
  const playerId = sanitizeText(message.playerId, 80);
  if (!playerId) {
    logMultiplayer("ws hello rejected", { reason: "missing player id" });
    sendWsJson(client, { type: "error", message: "Missing player id." });
    return;
  }

  client.playerId = playerId;
  client.universeId = soloWorldId(playerId);
  client.multiplayerOptIn = message.multiplayerOptIn !== false;
  client.relayBypass = message.relayBypass === true;
  client.profile = await ensurePlayerProfile(playerId);
  const helloName = sanitizeText(message.snapshot && message.snapshot.player && message.snapshot.player.name, 32);
  if (client.profile.crazyGamesUsername) {
    client.profile.publicName = client.profile.crazyGamesUsername;
  } else if (helloName) {
    client.profile.publicName = helloName;
  }
  client.profile.lastSeenAt = Date.now();
  await saveProfile(client.profile);

  if (message.snapshot && typeof message.snapshot === "object") {
    client.lastSnapshot = message.snapshot;
  }

  if (!clientsByPlayerId.has(playerId)) {
    clientsByPlayerId.set(playerId, new Set());
  }
  clientsByPlayerId.get(playerId).add(client);

  logMultiplayer("ws hello accepted", {
    playerId,
    publicName: client.profile && client.profile.publicName,
    universeId: client.universeId,
    connectionsForPlayer: clientsByPlayerId.get(playerId).size,
    onlineCount: countOnlinePlayers()
  });
  await sendClientBootstrap(client);
  reattachClientToLobbyOrParty(client);
  broadcastPresence();
}

function reattachClientToLobbyOrParty(client) {
  if (!client || !client.playerId) {
    return;
  }
  for (const lobby of lobbies.values()) {
    if (lobby.players.includes(client.playerId)) {
      client.lobbyId = lobby.id;
      sendLobbyState(lobby);
      return;
    }
  }
  for (const session of partySessions.values()) {
    if (session.players.includes(client.playerId)) {
      client.partySessionId = session.id;
      const room = partyV2Rooms.get(session.id);
      sendWsJson(client, {
        type: "party.start",
        session: publicPartySession(session),
        snapshot: room ? buildPartyV2StartSnapshot(room) : session.worldSnapshot
      });
      return;
    }
  }
}

async function sendClientBootstrap(client) {
  if (!client.playerId) {
    return;
  }

  const profile = await ensurePlayerProfile(client.playerId);
  client.profile = profile;
  sendWsJson(client, {
    type: "bootstrap",
    profile,
    universeId: client.universeId,
    bubbleRadius,
    onlineCount: countOnlinePlayers(),
    players: await listVisiblePlayers(client.playerId, "", false, false)
  });
}

function handleSocketClose(client, reason) {
  if (client.closed || !sockets.has(client)) {
    return;
  }

  client.closed = true;
  logMultiplayer("ws disconnected", {
    playerId: client.playerId || null,
    reason: reason || "unknown",
    socketsBeforeClose: sockets.size
  });
  sockets.delete(client);
  if (client.playerId && clientsByPlayerId.has(client.playerId)) {
    const clients = clientsByPlayerId.get(client.playerId);
    clients.delete(client);
    if (!clients.size) {
      clientsByPlayerId.delete(client.playerId);
    }
  }

  leaveClientLobby(client, false);
  leaveClientParty(client);
  leaveClientOverlaps(client);
  if (client.profile) {
    client.profile.lastSeenAt = Date.now();
    void saveProfile(client.profile);
  }
  broadcastPresence();
}

function broadcastPresence() {
  const payload = {
    type: "presence.update",
    onlineCount: countOnlinePlayers(),
    players: Array.from(clientsByPlayerId.keys())
  };

  for (const client of sockets) {
    if (client.playerId) {
      sendWsJson(client, payload);
    }
  }

  logMultiplayer("presence broadcast", {
    onlineCount: payload.onlineCount,
    sockets: sockets.size
  });
}

function relayToPlayer(playerId, payload) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    logMultiplayer("relay skipped", {
      targetPlayerId: playerId || null,
      type: payload && payload.type,
      reason: "target offline"
    });
    return false;
  }

  for (const client of clients) {
    sendWsJson(client, payload);
  }
  logMultiplayer("relay sent", {
    targetPlayerId: playerId,
    type: payload && payload.type,
    clientCount: clients.size
  });
  return true;
}

function firstOnlineClient(playerId) {
  const clients = clientsByPlayerId.get(playerId);
  return clients ? clients.values().next().value || null : null;
}

function findSignalIdForClient(client, requestedId) {
  const cleanId = sanitizeText(requestedId, 80);
  if (cleanId && pendingSignals.has(cleanId)) {
    return cleanId;
  }

  for (const [signalId, signal] of pendingSignals) {
    if (signal.players.includes(client.playerId)) {
      return signalId;
    }
  }
  return "";
}

function handleSignalChoice(client, message) {
  const signalId = findSignalIdForClient(client, message.signalId);
  const signal = pendingSignals.get(signalId);
  if (!signal) {
    logMultiplayer("signal choice ignored", {
      playerId: client.playerId,
      requestedSignalId: sanitizeText(message.signalId, 80),
      reason: "signal not found"
    });
    return;
  }

  const choice = message.choice === "investigate" ? "investigate" : "avoid";
  signal.choices.set(client.playerId, choice);
  logMultiplayer("signal choice saved", {
    signalId,
    playerId: client.playerId,
    choice,
    choices: Array.from(signal.choices.entries())
  });

  if (choice === "avoid") {
    cancelSignal(signalId, "avoided");
    return;
  }

  if (signal.players.every((playerId) => signal.choices.get(playerId) === "investigate")) {
    pendingSignals.delete(signalId);
    clearTimeout(signal.timeout);
    logMultiplayer("signal resolved", {
      signalId,
      result: "overlap",
      players: signal.players
    });
    startOverlap(signal.players, "random");
  }
}

function cancelSignal(signalId, reason) {
  const signal = pendingSignals.get(signalId);
  if (!signal) {
    return;
  }

  pendingSignals.delete(signalId);
  clearTimeout(signal.timeout);
  logMultiplayer("signal cancelled", {
    signalId,
    reason,
    players: signal.players
  });

  const now = Date.now();
  for (const playerId of signal.players) {
    playerCooldowns.set(playerId, now + randomSignalCooldownMs);
    relayToPlayer(playerId, {
      type: "signal.ended",
      signalId,
      reason
    });
  }
}

async function handleFriendInvite(client, message) {
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  if (!targetPlayerId || targetPlayerId === client.playerId) {
    logMultiplayer("friend invite rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      reason: "invalid target"
    });
    return;
  }

  const targetClient = firstOnlineClient(targetPlayerId);
  if (!client.multiplayerOptIn || !targetClient || !targetClient.multiplayerOptIn) {
    sendWsJson(client, {
      type: "friend.invite.sent",
      targetPlayerId,
      online: false,
      message: "Multiplayer is off."
    });
    return;
  }

  if (!canRelayLinkPlayers(client.playerId, targetPlayerId)) {
    logMultiplayer("friend invite rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      reason: "missing communication relay"
    });
    sendWsJson(client, {
      type: "friend.invite.sent",
      targetPlayerId,
      online: false,
      message: "Both players need online communication relays."
    });
    return;
  }

  const delivered = relayToPlayer(targetPlayerId, {
    type: "friend.invite",
    fromPlayerId: client.playerId,
    fromName: client.profile ? client.profile.publicName : client.playerId
  });

  logMultiplayer("friend invite processed", {
    fromPlayerId: client.playerId,
    targetPlayerId,
    delivered
  });
  sendWsJson(client, {
    type: "friend.invite.sent",
    targetPlayerId,
    online: delivered,
    message: delivered ? "Relay signal sent." : "Relay contact is offline."
  });
}

async function handleFriendAccept(client, message) {
  const fromPlayerId = sanitizeText(message.fromPlayerId || message.targetPlayerId, 80);
  if (!fromPlayerId || fromPlayerId === client.playerId) {
    logMultiplayer("friend accept rejected", {
      playerId: client.playerId,
      fromPlayerId,
      reason: "invalid target"
    });
    return;
  }

  const fromClient = firstOnlineClient(fromPlayerId);
  if (!client.multiplayerOptIn || !fromClient || !fromClient.multiplayerOptIn) {
    sendWsJson(client, { type: "error", message: "Multiplayer is off." });
    return;
  }

  if (!canRelayLinkPlayers(client.playerId, fromPlayerId)) {
    logMultiplayer("friend accept rejected", {
      playerId: client.playerId,
      fromPlayerId,
      reason: "missing communication relay"
    });
    sendWsJson(client, { type: "error", message: "Both players need online communication relays." });
    return;
  }

  await addFriendship(client.playerId, fromPlayerId);
  notifyProfileChanged(client.playerId);
  notifyProfileChanged(fromPlayerId);
  const participants = addToFriendOverlap(fromPlayerId, client.playerId);
  logMultiplayer("friend accept processed", {
    playerId: client.playerId,
    fromPlayerId,
    participants
  });
  startOverlap(participants, "friend");
}

function handleRoomCreate(client, message) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "room.join.failed", roomId: "", reason: "disabled", message: "Multiplayer is off." });
    return;
  }

  const mode = normalizeRoomMode(message.mode);
  const existingOverlap = findJoinableOverlapForPlayer(client.playerId);
  const overlap = existingOverlap || startOverlap([client.playerId], mode);

  if (!overlap) {
    sendWsJson(client, { type: "error", message: "Could not create multiplayer room." });
    return;
  }

  sendRoomState(overlap);
}

function handleRoomJoin(client, message) {
  const roomId = sanitizeText(message.roomId, 96);
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "room.join.failed", roomId, reason: "disabled", message: "Multiplayer is off." });
    return;
  }

  if (!roomId) {
    sendWsJson(client, { type: "room.join.failed", roomId, reason: "missing-room", message: "Missing room id." });
    return;
  }

  const overlap = overlaps.get(roomId);
  if (!overlap || !isJoinableOverlapRoom(overlap)) {
    sendWsJson(client, {
      type: "room.join.failed",
      roomId,
      reason: "not-found",
      message: "That multiplayer room is no longer available."
    });
    return;
  }

  if (!overlap.players.includes(client.playerId) && overlap.players.length >= overlapRoomMaxPlayers) {
    sendWsJson(client, {
      type: "room.join.failed",
      roomId,
      reason: "full",
      message: "That multiplayer room is full."
    });
    sendRoomState(overlap);
    return;
  }

  const alreadyInRoom = overlap.players.includes(client.playerId);
  if (!overlap.players.includes(client.playerId)) {
    overlap.players.push(client.playerId);
  }
  client.overlaps.add(overlap.id);
  overlap.updatedAt = Date.now();

  logMultiplayer("room join accepted", {
    playerId: client.playerId,
    roomId: overlap.id,
    players: overlap.players
  });

  sendOverlapStart(overlap);
  if (!alreadyInRoom) {
    notifyRoomPlayerJoined(overlap, client);
  }
  broadcastOverlapTransform(overlap);
  sendRoomState(overlap);
}

function notifyRoomPlayerJoined(overlap, joinedClient) {
  const payload = {
    type: "room.player.joined",
    roomId: overlap.id,
    playerId: joinedClient.playerId,
    publicName: joinedClient.profile ? joinedClient.profile.publicName : joinedClient.playerId
  };

  for (const playerId of overlap.players) {
    if (playerId === joinedClient.playerId) {
      continue;
    }

    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      sendWsJson(client, payload);
    }
  }
}

function sanitizeDifficultyId(value) {
  const clean = sanitizeText(value, 16).toLowerCase();
  return difficultyChoices.has(clean) ? clean : "medium";
}

function createLobbyId() {
  return `lobby-${Date.now().toString(36)}-${nextLobbyNumber++}`;
}

function createPartySessionId() {
  return `party-${Date.now().toString(36)}-${nextPartySessionNumber++}`;
}

function createAnomalyId() {
  return `anomaly-${Date.now().toString(36)}-${nextAnomalyNumber++}`;
}

function createLobbyCode() {
  let code = "";
  do {
    code = crypto.randomBytes(4).toString("base64url").replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  } while (!code || lobbyCodes.has(code) || partyCodes.has(code));
  return code;
}

function findLobbyByCodeOrId(value) {
  const raw = sanitizeText(value, 96);
  const clean = raw.toUpperCase();
  return lobbies.get(raw) || lobbies.get(clean) || lobbies.get(lobbyCodes.get(clean)) || null;
}

function findPartyByCodeOrId(value) {
  const raw = sanitizeText(value, 96);
  const clean = raw.toUpperCase();
  return partySessions.get(raw) || partySessions.get(clean) || partySessions.get(partyCodes.get(clean)) || null;
}

function publicLobbyPlayer(playerId) {
  const client = firstOnlineClient(playerId);
  return {
    playerId,
    publicName: client && client.profile ? client.profile.publicName : playerId,
    online: Boolean(client)
  };
}

function publicLobby(lobby) {
  return {
    id: lobby.id,
    code: lobby.code,
    hostPlayerId: lobby.hostPlayerId,
    maxPlayers: lobby.maxPlayers,
    difficulty: lobby.difficulty,
    status: lobby.status,
    players: lobby.players.map(publicLobbyPlayer)
  };
}

function sendLobbyState(lobby) {
  if (!lobby) {
    return;
  }
  const payload = {
    type: "lobby.state",
    lobby: publicLobby(lobby)
  };
  for (const playerId of lobby.players) {
    relayToPlayer(playerId, payload);
  }
}

function sendLobbyStateToClient(client, lobby) {
  if (!client || !lobby) {
    return;
  }
  sendWsJson(client, {
    type: "lobby.state",
    lobby: publicLobby(lobby)
  });
}

function assignClientLobby(playerId, lobbyId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return;
  }
  for (const client of clients) {
    client.lobbyId = lobbyId;
  }
}

function assignClientParty(playerId, partySessionId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return;
  }
  for (const client of clients) {
    client.partySessionId = partySessionId;
  }
}

function handleLobbyCreate(client, message) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Multiplayer is off." });
    return;
  }

  leaveClientLobby(client, true);
  const id = createLobbyId();
  const code = createLobbyCode();
  const lobby = {
    id,
    code,
    hostPlayerId: client.playerId,
    players: [client.playerId],
    maxPlayers: partyLobbyMaxPlayers,
    difficulty: sanitizeDifficultyId(message.difficulty),
    status: "open",
    createdAt: Date.now()
  };
  lobbies.set(id, lobby);
  lobbyCodes.set(code, id);
  client.lobbyId = id;
  assignClientLobby(client.playerId, id);
  sendLobbyStateToClient(client, lobby);
  sendLobbyState(lobby);
}

function handleLobbyJoin(client, message) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Multiplayer is off." });
    return;
  }
  const requestedCode = message.code || message.lobbyId || message.roomId;
  const lobby = findLobbyByCodeOrId(requestedCode);
  if (!lobby) {
    const session = findPartyByCodeOrId(requestedCode);
    if (session) {
      handlePartyJoin(client, session);
      return;
    }
  }
  if (!lobby || lobby.status !== "open") {
    sendWsJson(client, { type: "lobby.join.failed", message: "World unavailable." });
    return;
  }
  if (!lobby.players.includes(client.playerId) && lobby.players.length >= lobby.maxPlayers) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Lobby full." });
    return;
  }

  if (client.lobbyId === lobby.id && lobby.players.includes(client.playerId)) {
    sendLobbyState(lobby);
    return;
  }
  if (client.lobbyId && client.lobbyId !== lobby.id) {
    leaveClientLobby(client, true);
  }
  if (!lobby.players.includes(client.playerId)) {
    lobby.players.push(client.playerId);
  }
  client.lobbyId = lobby.id;
  assignClientLobby(client.playerId, lobby.id);
  sendLobbyState(lobby);
}

function handlePartyJoin(client, session) {
  if (!client.multiplayerOptIn) {
    sendWsJson(client, { type: "lobby.join.failed", message: "Multiplayer is off." });
    return;
  }
  if (!session) {
    sendWsJson(client, { type: "lobby.join.failed", message: "World unavailable." });
    return;
  }

  const maxPlayers = Math.max(1, Math.floor(session.maxPlayers || partyLobbyMaxPlayers));
  if (!session.players.includes(client.playerId) && session.players.length >= maxPlayers) {
    sendWsJson(client, { type: "lobby.join.failed", message: "World full." });
    return;
  }

  if (client.lobbyId) {
    leaveClientLobby(client, true);
  }
  if (client.partySessionId && client.partySessionId !== session.id) {
    leaveClientParty(client);
  }
  if (!session.players.includes(client.playerId)) {
    session.players.push(client.playerId);
  }
  const room = partyV2Rooms.get(session.id);
  if (room) {
    addPartyV2Player(room, session, client.playerId);
  }

  client.lobbyId = "";
  client.partySessionId = session.id;
  assignClientParty(client.playerId, session.id);

  const payload = {
    type: "party.state",
    session: publicPartySession(session)
  };
  relayToParty(session, payload, client.playerId);

  const clients = clientsByPlayerId.get(client.playerId);
  if (clients) {
    for (const partyClient of clients) {
      sendWsJson(partyClient, {
        type: "party.start",
        session: publicPartySession(session),
        snapshot: room ? buildPartyV2StartSnapshot(room) : session.worldSnapshot
      });
    }
  }
}

function leaveClientLobby(client, explicitLeave) {
  if (!client || !client.lobbyId) {
    return;
  }
  const lobby = lobbies.get(client.lobbyId);
  const playerId = client.playerId;
  client.lobbyId = "";
  if (!lobby) {
    return;
  }

  if (!explicitLeave && firstOnlineClient(playerId)) {
    sendLobbyState(lobby);
    return;
  }

  lobby.players = lobby.players.filter((candidate) => candidate !== playerId);
  if (!lobby.players.length) {
    lobbies.delete(lobby.id);
    lobbyCodes.delete(lobby.code);
    return;
  }
  if (lobby.hostPlayerId === playerId) {
    lobby.hostPlayerId = lobby.players[0];
  }
  sendLobbyState(lobby);
}

function handleLobbyKick(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  if (!lobby || lobby.hostPlayerId !== client.playerId || !targetPlayerId || targetPlayerId === client.playerId) {
    return;
  }

  lobby.players = lobby.players.filter((playerId) => playerId !== targetPlayerId);
  assignClientLobby(targetPlayerId, "");
  relayToPlayer(targetPlayerId, {
    type: "lobby.kicked",
    lobbyId: lobby.id,
    message: "Removed from lobby."
  });
  sendLobbyState(lobby);
}

function handleLobbyInvite(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  if (!lobby || !lobby.players.includes(client.playerId) || !targetPlayerId || targetPlayerId === client.playerId) {
    return;
  }

  const delivered = relayToPlayer(targetPlayerId, {
    type: "lobby.invite",
    lobbyId: lobby.id,
    code: lobby.code,
    fromPlayerId: client.playerId,
    fromName: client.profile ? client.profile.publicName : client.playerId
  });
  sendWsJson(client, {
    type: "friend.invite.sent",
    targetPlayerId,
    online: delivered,
    message: delivered ? "Lobby invite sent." : "Player is offline."
  });
}

function handleLobbyDifficulty(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  if (!lobby || lobby.hostPlayerId !== client.playerId) {
    return;
  }
  lobby.difficulty = sanitizeDifficultyId(message.difficulty);
  sendLobbyState(lobby);
}

function isPartyV2Session(session) {
  return Boolean(session && Number(session.netcodeVersion || 1) >= partyNetcodeVersion);
}

function createPartyV2Room(session) {
  if (!session || !isPartyV2Session(session)) {
    return null;
  }

  const players = session.players.map(publicLobbyPlayer);
  const state = mpV2Sim.createInitialState(session.worldSnapshot, players, {
    seed: session.id
  });
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
  return mpV2Sim.addPlayer(room.state, {
    playerId,
    publicName: client && client.profile ? client.profile.publicName : playerId
  });
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

function handlePartyV2Input(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !isPartyV2Session(session) || !session.players.includes(client.playerId)) {
    return;
  }
  const room = partyV2Rooms.get(session.id);
  if (!room) {
    return;
  }

  if (message.roomId && message.roomId !== session.id && message.roomId !== session.lobbyId) {
    return;
  }

  addPartyV2Player(room, session, client.playerId);
  const input = mpV2Sim.sanitizeInput({
    seq: message.seq,
    clientTick: message.clientTick,
    aimAngle: message.aimAngle,
    aimLocalAngle: message.aimLocalAngle,
    equippedTool: message.equippedTool,
    toolMode: message.toolMode,
    familiarCommand: message.familiarCommand,
    buttons: message.buttons
  });
  input.playerId = client.playerId;

  const lastAck = room.lastAckByPlayerId.get(client.playerId) || 0;
  if (input.seq <= lastAck) {
    return;
  }

  const queue = room.inputQueues.get(client.playerId) || [];
  queue.push(input);
  queue.sort((a, b) => a.seq - b.seq);
  while (queue.length > 120) {
    queue.shift();
  }
  room.inputQueues.set(client.playerId, queue);
  if (room.perf) {
    room.perf.maxInputQueue = Math.max(Number(room.perf.maxInputQueue) || 0, queue.length);
  }
  room.lastTouchedAt = Date.now();
}

function sanitizePartyV2Placement(source) {
  const placement = source && typeof source === "object" ? source : {};
  return {
    bodyId: Math.max(0, Math.floor(clampNumber(placement.bodyId, 0, 1000000000))),
    angle: clampNumber(placement.angle, -Math.PI * 64, Math.PI * 64)
  };
}

function handlePartyV2Action(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !isPartyV2Session(session) || !session.players.includes(client.playerId)) {
    return;
  }

  const room = partyV2Rooms.get(session.id);
  if (!room) {
    return;
  }

  if (message.roomId && message.roomId !== session.id && message.roomId !== session.lobbyId) {
    return;
  }

  addPartyV2Player(room, session, client.playerId);

  const action = sanitizeText(message.action, 32);
  let changed = false;
  if (action === "craftTool") {
    changed = mpV2Sim.craftTool(room.state, client.playerId, sanitizeText(message.recipeId, 64));
  } else if (action === "upgradeTool") {
    changed = mpV2Sim.upgradeTool(
      room.state,
      client.playerId,
      sanitizeText(message.toolId, 64),
      sanitizeText(message.upgradeId, 64)
    );
  } else if (action === "setEquippedTools") {
    const equippedTools = Array.isArray(message.equippedTools)
      ? message.equippedTools.map((toolId) => sanitizeText(toolId, 64)).slice(0, 8)
      : [];
    changed = mpV2Sim.setEquippedTools(
      room.state,
      client.playerId,
      sanitizeText(message.equippedTool, 64),
      equippedTools
    );
  } else if (action === "placeStructure") {
    changed = mpV2Sim.placeStructure(
      room.state,
      client.playerId,
      sanitizeText(message.recipeId, 64),
      sanitizePartyV2Placement(message.placement),
      sanitizePartyV2Placement(message.linkedPlacement)
    );
  }

  if (!changed) {
    return;
  }

  room.lastTouchedAt = Date.now();
  session.worldSnapshot = buildPartyV2StartSnapshot(room);
  sendPartyV2Snapshot(session, room);
}

function popPartyV2Input(room, playerId) {
  const queue = room.inputQueues.get(playerId) || [];
  let next = null;
  while (queue.length) {
    const candidate = queue.shift();
    const lastAck = room.lastAckByPlayerId.get(playerId) || 0;
    if (candidate.seq > lastAck) {
      next = candidate;
      break;
    }
  }
  if (queue.length) {
    room.inputQueues.set(playerId, queue);
  } else {
    room.inputQueues.delete(playerId);
  }
  if (next) {
    room.lastInputs.set(playerId, next);
    room.lastAckByPlayerId.set(playerId, next.seq);
    return next;
  }
  return room.lastInputs.get(playerId) || { playerId, seq: room.lastAckByPlayerId.get(playerId) || 0 };
}

const partyV2MaxElapsedSeconds = 0.25;
const partyV2MaxCatchUpSteps = 5;
let partyV2LastTickMs = monotonicMs();
let partyV2TickAccumulator = 0;

function stepPartyV2RoomsOnce() {
  for (const [sessionId, room] of Array.from(partyV2Rooms.entries())) {
    const session = partySessions.get(sessionId);
    if (!session || !isPartyV2Session(session)) {
      partyV2Rooms.delete(sessionId);
      continue;
    }

    const inputs = {};
    for (const playerId of session.players) {
      addPartyV2Player(room, session, playerId);
      inputs[playerId] = popPartyV2Input(room, playerId);
    }

    const stepStart = monotonicMs();
    mpV2Sim.step(room.state, inputs, {
      dt: mpV2Sim.TICK_DT,
      enableMobs: true,
      duels: partyV2DuelPairsForSession(session)
    });
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

    if (room.state.tick - room.lastSnapshotTick >= mpV2Sim.SNAPSHOT_INTERVAL_TICKS) {
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

function sendPartyV2Snapshot(session, room) {
  const ackInputSeq = {};
  for (const playerId of session.players) {
    ackInputSeq[playerId] = room.lastAckByPlayerId.get(playerId) || 0;
  }
  const stateSnapshot = session.worldSnapshot && session.worldSnapshot.v2 && session.worldSnapshot.state
    ? session.worldSnapshot.state
    : mpV2Sim.serializeState(room.state);
  const payload = {
    type: "mp.v2.snapshot",
    roomId: session.id,
    serverTick: room.state.tick,
    ackInputSeq,
    state: stateSnapshot,
    events: Array.isArray(room.pendingEvents) ? room.pendingEvents.slice() : [],
    perf: partyV2PerfPayload(room)
  };
  if (Array.isArray(room.pendingEvents)) {
    room.pendingEvents.length = 0;
  }
  if (room.perf) {
    room.perf.snapshotBytesEma = smoothMetric(room.perf.snapshotBytesEma, Buffer.byteLength(JSON.stringify(payload.state)), 0.18);
    payload.perf = partyV2PerfPayload(room);
    room.perf.maxInputQueue = 0;
  }
  relayToParty(session, payload);
}

function handleLobbyStart(client, message) {
  const lobby = lobbies.get(client.lobbyId);
  if (!lobby || lobby.hostPlayerId !== client.playerId) {
    sendWsJson(client, { type: "error", message: "Only the host can start." });
    return;
  }

  const session = {
    id: createPartySessionId(),
    lobbyId: lobby.id,
    hostPlayerId: client.playerId,
    players: lobby.players.slice(),
    maxPlayers: lobby.maxPlayers,
    joinCode: lobby.code,
    difficulty: sanitizeDifficultyId(message.difficulty || lobby.difficulty),
    pvpMode: "party-off",
    netcodeVersion: partyNetcodeVersion,
    worldSnapshot: message.snapshot && typeof message.snapshot === "object" ? message.snapshot : client.lastSnapshot,
    playerSnapshots: new Map(),
    claimedTechPickupIds: new Set(),
    createdAt: Date.now(),
    anomalyId: ""
  };
  partySessions.set(session.id, session);
  partyCodes.set(lobby.code, session.id);
  lobbies.delete(lobby.id);
  lobbyCodes.delete(lobby.code);
  const room = createPartyV2Room(session);
  const startSnapshot = room ? buildPartyV2StartSnapshot(room) : session.worldSnapshot;

  for (const playerId of session.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }
    for (const partyClient of clients) {
      partyClient.lobbyId = "";
      partyClient.partySessionId = session.id;
      sendWsJson(partyClient, {
        type: "party.start",
        session: publicPartySession(session),
        snapshot: startSnapshot
      });
    }
  }
}

function publicPartySession(session) {
  return {
    id: session.id,
    sessionId: session.id,
    lobbyId: session.lobbyId,
    code: session.joinCode || "",
    joinCode: session.joinCode || "",
    hostPlayerId: session.hostPlayerId,
    maxPlayers: Math.max(1, Math.floor(session.maxPlayers || partyLobbyMaxPlayers)),
    difficulty: session.difficulty,
    netcodeVersion: session.netcodeVersion || 1,
    authoritativeServer: (session.netcodeVersion || 1) >= partyNetcodeVersion,
    pvpMode: session.pvpMode,
    players: session.players.map(publicLobbyPlayer)
  };
}

function relayToParty(session, payload, exceptPlayerId) {
  if (!session) {
    return;
  }
  for (const playerId of session.players) {
    if (playerId === exceptPlayerId) {
      continue;
    }
    relayToPlayer(playerId, payload);
  }
}

function handlePartyInput(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }
  if (isPartyV2Session(session)) {
    return;
  }
  const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
  if (snapshot) {
    session.playerSnapshots.set(client.playerId, snapshot);
  }
  relayToParty(session, {
    type: "party.player.snapshot",
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    teamId: session.anomalyTeamId || "",
    snapshot
  }, client.playerId);
}

function handlePartyWorldSnapshot(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || session.hostPlayerId !== client.playerId) {
    return;
  }
  if (isPartyV2Session(session)) {
    return;
  }
  const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
  if (!snapshot) {
    return;
  }
  session.worldSnapshot = snapshot;
  relayToParty(session, {
    type: "party.world.snapshot",
    sessionId: session.id,
    hostPlayerId: session.hostPlayerId,
    hostName: client.profile ? client.profile.publicName : client.playerId,
    snapshot
  }, client.playerId);
}

function handlePartyRespawn(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }
  const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
  if (snapshot) {
    session.playerSnapshots.set(client.playerId, snapshot);
  }
  const room = isPartyV2Session(session) ? partyV2Rooms.get(session.id) : null;
  if (room && snapshot && snapshot.player && typeof mpV2Sim.respawnPlayer === "function") {
    mpV2Sim.respawnPlayer(room.state, client.playerId, snapshot.player);
    room.inputQueues.delete(client.playerId);
    room.lastInputs.delete(client.playerId);
    if (Array.isArray(room.pendingEvents)) {
      room.pendingEvents = room.pendingEvents.filter((event) => {
        return !(event && event.type === "player.died" && String(event.playerId || "") === client.playerId);
      });
    }
    if (room.state && Array.isArray(room.state.events)) {
      room.state.events = room.state.events.filter((event) => {
        return !(event && event.type === "player.died" && String(event.playerId || "") === client.playerId);
      });
    }
    session.worldSnapshot = buildPartyV2StartSnapshot(room);
    sendPartyV2Snapshot(session, room);
  }
  relayToParty(session, {
    type: "player.respawn",
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    snapshot
  }, client.playerId);
}

function handlePartyTechPickup(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }

  if (!session.claimedTechPickupIds) {
    session.claimedTechPickupIds = new Set();
  }

  const pickupId = sanitizeText(String(message.pickupId || ""), 80);
  const key = techKeys.includes(message.key) ? message.key : "";
  if (!pickupId || !key || session.claimedTechPickupIds.has(pickupId)) {
    return;
  }

  session.claimedTechPickupIds.add(pickupId);
  relayToParty(session, {
    type: "party.tech.claimed",
    pickupId,
    key,
    claimedByPlayerId: client.playerId,
    claimedByName: client.profile ? client.profile.publicName : client.playerId,
    x: clampNumber(message.x, -1000000, 1000000),
    y: clampNumber(message.y, -1000000, 1000000)
  });
}

function handlePartyHealthPickup(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }

  if (!session.claimedHealthPickupIds) {
    session.claimedHealthPickupIds = new Set();
  }

  const pickupId = sanitizeText(String(message.pickupId || ""), 80);
  if (!pickupId || session.claimedHealthPickupIds.has(pickupId)) {
    return;
  }

  session.claimedHealthPickupIds.add(pickupId);
  relayToParty(session, {
    type: "party.health.claimed",
    pickupId,
    heal: clampNumber(message.heal, 1, 100),
    claimedByPlayerId: client.playerId,
    claimedByName: client.profile ? client.profile.publicName : client.playerId,
    x: clampNumber(message.x, -1000000, 1000000),
    y: clampNumber(message.y, -1000000, 1000000)
  });
}

function sanitizePartyCommandSource(source) {
  const data = source && typeof source === "object" ? source : {};
  const sourceNumber = (value, fallback, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  };
  return {
    x: sourceNumber(data.x, 0, -1000000, 1000000),
    y: sourceNumber(data.y, 0, -1000000, 1000000),
    radius: sourceNumber(data.radius, 34, 1, 120),
    directionX: sourceNumber(data.directionX, 1, -1, 1),
    directionY: sourceNumber(data.directionY, 0, -1, 1)
  };
}

function sanitizePartyCommand(message) {
  const command = sanitizeText(message.command, 32);
  if (command === "tech") {
    const tech = sanitizeText(message.tech, 32).toLowerCase();
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 1000000)));
    return {
      command,
      tech: tech === "all" || techKeys.includes(tech) ? tech : "",
      amount
    };
  }
  if (command === "spawnBody") {
    const body = sanitizeText(message.body, 32).toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    const allowed = mpV2Sim.constants.BODY_TIERS.some((tier) => tier.name === body);
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 100)));
    return {
      command,
      body: allowed ? body : "",
      amount,
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnMob") {
    const mob = sanitizeText(message.mob, 32).toLowerCase().replace(/[-_\s]+/g, "");
    const allowed = mpV2Sim.constants.MOB_TIER_ORDER.includes(mob);
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 100)));
    return {
      command,
      mob: allowed ? mob : "",
      amount,
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnBoss") {
    const mob = sanitizeText(message.mob, 32).toLowerCase().replace(/[-_\s]+/g, "");
    const allowed = mpV2Sim.constants.MOB_TIER_ORDER.includes(mob);
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 20)));
    return {
      command,
      mob: allowed ? mob : "",
      amount,
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnEvent") {
    const event = sanitizeText(message.event, 48).toLowerCase().replace(/[_\s]+/g, "-");
    return {
      command,
      event: event === "particle-storm" || event === "meteor-shower" || event === "rogue-trader" ? event : "",
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnNpc") {
    const npc = sanitizeText(message.npc, 32).toLowerCase().replace(/[-_\s]+/g, "");
    return {
      command,
      npc: npc === "trader" || npc === "roguetrader" ? "trader" : "",
      event: npc === "trader" || npc === "roguetrader" ? "rogue-trader" : "",
      source: sanitizePartyCommandSource(message.source)
    };
  }
  return { command: "" };
}

function handlePartyCommand(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }

  const payload = sanitizePartyCommand(message);
  if (!payload.command) {
    return;
  }

  if (isPartyV2Session(session)) {
    const room = partyV2Rooms.get(session.id);
    if (!room || !room.state) {
      return;
    }
    let changed = false;
    if (payload.command === "tech" && payload.tech) {
      changed = mpV2Sim.addTechToPlayer(room.state, client.playerId, payload.tech, payload.amount);
    } else if (payload.command === "spawnBody" && payload.body) {
      for (let i = 0; i < payload.amount; i += 1) {
        changed = Boolean(mpV2Sim.spawnBody(room.state, payload.body, payload.source)) || changed;
      }
    } else if (payload.command === "spawnMob" && payload.mob) {
      changed = mpV2Sim.spawnMob(room.state, payload.mob, payload.amount, payload.source) > 0;
    } else if (payload.command === "spawnBoss" && payload.mob) {
      changed = mpV2Sim.spawnBoss(room.state, payload.mob, payload.amount, payload.source) > 0;
    } else if (payload.command === "spawnEvent" && payload.event) {
      changed = mpV2Sim.forceRandomEvent(room.state, payload.event);
    } else if (payload.command === "spawnNpc" && payload.event) {
      changed = mpV2Sim.forceRandomEvent(room.state, payload.event);
    }
    if (changed) {
      room.lastTouchedAt = Date.now();
      session.worldSnapshot = buildPartyV2StartSnapshot(room);
      sendPartyV2Snapshot(session, room);
    }
    return;
  }

  const canRelayHostCommand =
    (payload.command === "spawnBody" && payload.body) ||
    (payload.command === "spawnMob" && payload.mob) ||
    (payload.command === "spawnBoss" && payload.mob) ||
    (payload.command === "spawnEvent" && payload.event) ||
    (payload.command === "spawnNpc" && payload.npc);

  if (!canRelayHostCommand || session.hostPlayerId === client.playerId) {
    return;
  }

  relayToPlayer(session.hostPlayerId, {
    type: "party.command",
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    command: payload.command,
    body: payload.body,
    mob: payload.mob,
    event: payload.event,
    npc: payload.npc,
    amount: payload.amount,
    source: payload.source
  });
}

function sanitizePartyEntityType(value) {
  const clean = sanitizeText(value, 32);
  return [
    "particle",
    "techPickup",
    "healthPickup",
    "rivalProjectile",
    "alienoid",
    "ufo",
    "rambot",
    "engineer",
    "tesla",
    "rocket",
    "fighter"
  ].includes(clean) ? clean : "";
}

function sanitizePartyEntityState(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  const state = {
    id: Math.max(1, Math.floor(Number(source.id) || 0)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2200, 2200),
    vy: clampNumber(source.vy, -2200, 2200),
    radius: clampNumber(source.radius, 1, 10000)
  };
  const optionalNumberKeys = [
    "mass",
    "energy",
    "maxEnergy",
    "textureSeed",
    "wobble",
    "pulse",
    "heal",
    "life",
    "maxLife",
    "rotation",
    "health",
    "maxHealth",
    "flash",
    "hitCooldown",
    "length",
    "damage",
    "toolDisable"
  ];
  for (const key of optionalNumberKeys) {
    if (Number.isFinite(Number(source[key]))) {
      state[key] = clampNumber(source[key], -1000000, 1000000);
    }
  }
  if (source.color && typeof source.color === "object") {
    state.color = normalizeColor(source.color);
  }
  for (const key of ["key", "kind", "cause"]) {
    if (typeof source[key] === "string") {
      state[key] = sanitizeText(source[key], 80);
    }
  }
  if (Object.prototype.hasOwnProperty.call(source, "lightning")) {
    state.lightning = Boolean(source.lightning);
  }
  if (Object.prototype.hasOwnProperty.call(source, "rocket")) {
    state.rocket = Boolean(source.rocket);
  }
  return state.id ? state : null;
}

function sanitizePartyEntityActor(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  return {
    id: sanitizeText(source.id, 80),
    name: sanitizeText(source.name, 32),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2200, 2200),
    vy: clampNumber(source.vy, -2200, 2200),
    radius: clampNumber(source.radius, 1, 120),
    health: clampNumber(source.health, 0, 100),
    maxHealth: clampNumber(source.maxHealth, 1, 100),
    energy: clampNumber(source.energy, 0, 260),
    maxEnergy: clampNumber(source.maxEnergy, 1, 260),
    equippedTool: sanitizeText(source.equippedTool, 40),
    toolMode: sanitizeText(source.toolMode, 16),
    aimAngle: clampNumber(source.aimAngle, -Math.PI * 16, Math.PI * 16),
    landed: source.landed && typeof source.landed === "object" ? normalizeLanding(source.landed) : null
  };
}

function sanitizePartyPhysicsPayload(message) {
  const type = sanitizePartyEntityType(message.entityType);
  const entityId = Math.max(1, Math.floor(Number(message.entityId) || 0));
  return {
    entityType: type,
    entityId,
    ownerPlayerId: sanitizeText(message.ownerPlayerId, 80),
    targetPlayerId: sanitizeText(message.targetPlayerId, 80),
    seq: Math.max(0, Math.floor(Number(message.seq) || 0)),
    action: sanitizeText(message.action, 24),
    reason: sanitizeText(message.reason, 80),
    mode: sanitizeText(message.mode, 16),
    active: message.active !== false,
    state: sanitizePartyEntityState(message.state),
    actor: sanitizePartyEntityActor(message.actor)
  };
}

function handlePartyPhysicsSession(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }
  if (isPartyV2Session(session)) {
    return;
  }

  const payload = sanitizePartyPhysicsPayload(message);
  if (!payload.entityType || !payload.entityId) {
    return;
  }

  if (message.type === "party.physics.authority" || message.type === "party.physics.reject") {
    if (session.hostPlayerId !== client.playerId) {
      return;
    }
    relayToParty(session, {
      type: message.type,
      fromPlayerId: client.playerId,
      publicName: client.profile ? client.profile.publicName : client.playerId,
      ...payload
    }, client.playerId);
    return;
  }

  const hostId = session.hostPlayerId;
  if (!hostId || hostId === client.playerId) {
    return;
  }
  relayToPlayer(hostId, {
    type: message.type,
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    ...payload
  });
}

function leaveClientParty(client) {
  if (!client || !client.partySessionId) {
    return;
  }
  const session = partySessions.get(client.partySessionId);
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

function normalizeRoomMode(mode) {
  const cleanMode = sanitizeText(mode, 32);
  return cleanMode || "world-overlap";
}

function isJoinableOverlapRoom(overlap) {
  return Boolean(overlap && isJoinableRoomMode(overlap.type));
}

function isJoinableRoomMode(mode) {
  return mode === "world-overlap" || mode === "friend";
}

function findJoinableOverlapForPlayer(playerId) {
  for (const overlap of overlaps.values()) {
    if (!isJoinableOverlapRoom(overlap) || !overlap.players.includes(playerId)) {
      continue;
    }
    return overlap;
  }
  return null;
}

function roomStateForOverlap(overlap) {
  const playerCount = overlap && Array.isArray(overlap.players) ? overlap.players.length : 0;
  return {
    type: "room.state",
    roomId: overlap ? overlap.id : "",
    mode: "world-overlap",
    maxPlayers: overlapRoomMaxPlayers,
    playerCount,
    isJoinable: Boolean(overlap && isJoinableOverlapRoom(overlap) && playerCount < overlapRoomMaxPlayers)
  };
}

function sendRoomState(overlap) {
  if (!overlap || !isJoinableOverlapRoom(overlap)) {
    return;
  }

  const payload = roomStateForOverlap(overlap);
  for (const playerId of overlap.players) {
    const clients = clientsByPlayerId.get(playerId);
    if (!clients) {
      continue;
    }

    for (const client of clients) {
      sendWsJson(client, payload);
    }
  }
}

async function handlePlayerInteractionChoice(client, message) {
  const targetPlayerId = sanitizeText(message.targetPlayerId, 80);
  const choice = sanitizeText(message.choice, 16);
  if (!targetPlayerId || targetPlayerId === client.playerId || !playerInteractionChoices.has(choice)) {
    logMultiplayer("interaction choice rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      choice,
      reason: "invalid"
    });
    sendWsJson(client, { type: "error", message: "Invalid player interaction." });
    return;
  }

  const targetClient = firstOnlineClient(targetPlayerId);
  if (!targetClient) {
    logMultiplayer("interaction choice rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      choice,
      reason: "target offline"
    });
    sendWsJson(client, { type: "error", message: "That player is offline." });
    return;
  }

  const key = interactionPairKey(client.playerId, targetPlayerId);
  if (choice === "truce" && !activePlayerDuels.has(key)) {
    logMultiplayer("interaction choice rejected", {
      fromPlayerId: client.playerId,
      targetPlayerId,
      choice,
      reason: "truce without active duel"
    });
    sendWsJson(client, { type: "error", message: "Truce is only available during an active duel." });
    return;
  }

  const existing = pendingPlayerInteractions.get(key);
  const pending =
    existing && Date.now() - existing.updatedAt < 30000
      ? existing
      : {
          players: [client.playerId, targetPlayerId].sort(),
          choices: new Map(),
          updatedAt: Date.now()
        };

  pending.choices.set(client.playerId, choice);
  pending.updatedAt = Date.now();
  pendingPlayerInteractions.set(key, pending);
  relayInteractionRequest(client, targetClient, choice);

  const otherChoice = pending.choices.get(targetPlayerId);
  if (otherChoice !== choice) {
    return;
  }

  pendingPlayerInteractions.delete(key);
  await acceptPlayerInteraction(client.playerId, targetPlayerId, choice);
}

function interactionPairKey(a, b) {
  return [a, b].sort().join("|");
}

function partyV2DuelPairsForSession(session) {
  if (!session || !Array.isArray(session.players) || !session.players.length) {
    return [];
  }
  const partyPlayers = new Set(session.players);
  const pairs = [];
  for (const key of activePlayerDuels) {
    const [a, b] = String(key || "").split("|");
    if (a && b && partyPlayers.has(a) && partyPlayers.has(b)) {
      pairs.push(key);
    }
  }
  return pairs;
}

function relayInteractionRequest(fromClient, targetClient, choice) {
  relayToPlayer(targetClient.playerId, {
    type: "interaction.request",
    fromPlayerId: fromClient.playerId,
    fromName: fromClient.profile ? fromClient.profile.publicName : fromClient.playerId,
    choice
  });
}

async function acceptPlayerInteraction(aPlayerId, bPlayerId, choice) {
  const aClient = firstOnlineClient(aPlayerId);
  const bClient = firstOnlineClient(bPlayerId);
  if (!aClient || !bClient) {
    return;
  }

  const key = interactionPairKey(aPlayerId, bPlayerId);
  if (choice === "duel") {
    activePlayerDuels.add(key);
  } else if (choice === "truce") {
    activePlayerDuels.delete(key);
  }

  sendInteractionResult(aClient, bClient, choice, true);
  sendInteractionResult(bClient, aClient, choice, true);
  logMultiplayer("interaction accepted", {
    players: [aPlayerId, bPlayerId],
    choice
  });
}

function sendInteractionResult(receiverClient, peerClient, choice, accepted) {
  sendWsJson(receiverClient, {
    type: "interaction.result",
    fromPlayerId: peerClient.playerId,
    fromName: peerClient.profile ? peerClient.profile.publicName : peerClient.playerId,
    targetPlayerId: receiverClient.playerId,
    peerName: peerClient.profile ? peerClient.profile.publicName : peerClient.playerId,
    choice,
    accepted: Boolean(accepted)
  });
}

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

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`[Clusternauts server] Port ${port} is already in use. Stop the other npm start window, or run with a different PORT.`);
    return;
  }

  if (error && error.code === "EACCES") {
    console.error(`[Clusternauts server] Permission denied while binding ${host}:${port}. Check Windows Firewall or run from a terminal with permission to accept network connections.`);
    return;
  }

  console.error("[Clusternauts server] Server error:", error);
});

process.on("uncaughtExceptionMonitor", (error) => {
  logClusternautsError("uncaught exception", {
    message: error instanceof Error ? error.message : "unknown error",
    stack: error instanceof Error ? error.stack : ""
  });
});

process.on("unhandledRejection", (reason) => {
  logClusternautsError("unhandled rejection", {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : ""
  });
});

server.listen(port, host, () => {
  console.log("Clusternauts is running at:");
  for (const advertisedHost of advertisedHosts) {
    console.log(`  http://${advertisedHost}:${port}`);
  }
});
