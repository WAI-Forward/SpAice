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
const maxHttpJsonBodyBytes = Math.min(
  16 * 1024 * 1024,
  Math.max(500000, Math.floor(Number(process.env.CLUSTERNAUTS_MAX_HTTP_JSON_BODY_BYTES) || 8 * 1024 * 1024))
);
const wsLargeOutboundWarnBytes = Math.floor(maxJsonBodyBytes * 0.9);
const wsBackpressureWarnBytes = maxJsonBodyBytes * 3;
const wsOutboundPressureWarnIntervalMs = 5000;
const worldTickMs = 5000;
const bubbleRadius = 5000;
const signalTimeoutMs = 15000;
const randomSignalCooldownMs = 45000;
const randomSignalIntervalMs = 10 * 60 * 1000;
const randomOverlapLifetimeMs = 120000;
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 14;
const websiteUrl = stripTrailingSlash(process.env.WAI_FORWARD_WEBSITE_URL || process.env.WEBSITE_URL || defaultWebsiteUrl());
const configuredPublicUrl = stripTrailingSlash(process.env.CLUSTERNAUTS_PUBLIC_URL || process.env.PUBLIC_URL || "");
const stripeLocalConfig = loadStripeLocalConfig();
const defaultStripeTestSkinPriceId = "price_1TprObHmsD7gK0nLjrfRpxjr";
const defaultStripeTestSkinProductId = "prod_UpWRoBeiJjWeJQ";
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
const defaultSkinId = "classic-suit";
const defaultTrailId = "trail-classic-flame";
const skinCatalog = Object.freeze([
  { id: defaultSkinId, name: "Classic Suit", plainColor: "White", priceId: "", productId: "" },
  { id: defaultTrailId, name: "Classic Flame", kind: "trail", plainColor: "Flame", priceId: "", productId: "" },
  { id: "suit-mars-red", name: "Mars Red", plainColor: "Red", priceId: "price_1TpqIDHmsD7gK0nLGi5G02yw", productId: "prod_UpVIhwLtcrbcLX" },
  { id: "suit-nebula-blue", name: "Nebula Blue", plainColor: "Blue", priceId: "price_1TpqIvHmsD7gK0nLHwkuHLye", productId: "prod_UpVJImzN2j9OCW" },
  { id: "suit-solar-yellow", name: "Solar Yellow", plainColor: "Yellow", priceId: "price_1TpqJXHmsD7gK0nLmmluSuPx", productId: "prod_UpVK0wvBk7hNwi" },
  { id: "suit-toxic-green", name: "Toxic Green", plainColor: "Green", priceId: "price_1TpqK4HmsD7gK0nLlzk0qOD0", productId: "prod_UpVKSFCiD7glhv" },
  { id: "suit-void-purple", name: "Void Purple", plainColor: "Purple", priceId: "price_1TpqKcHmsD7gK0nLzoihm1RW", productId: "prod_UpVLEO9dUJB4g5" },
  { id: "suit-hazard-orange", name: "Hazard Orange", plainColor: "Orange", priceId: "price_1TpqKxHmsD7gK0nLcWWIWE2C", productId: "prod_UpVLumOKnxlkQK" },
  { id: "suit-cosmic-pink", name: "Cosmic Pink", plainColor: "Pink", priceId: "price_1TpqMUHmsD7gK0nLGLEuNwVH", productId: "prod_UpVNQXqJJxgw40" },
  { id: "suit-deep-space-black", name: "Deep Space Black", plainColor: "Black", priceId: "price_1TpqN2HmsD7gK0nL57YnS6g5", productId: "prod_UpVNBsf8zX01pX" },
  { id: "costume-medieval-knight", name: "Medieval Knight", kind: "costume", plainColor: "Steel", priceLabel: "GBP 5.00", priceId: "price_1TpwkmHmsD7gK0nLwrApMz0J", productId: "prod_UpbykcgnkcJwSM" },
  { id: "costume-pirate", name: "Pirate", kind: "costume", plainColor: "Black", priceLabel: "GBP 5.00", priceId: "price_1TpvXUHmsD7gK0nLCx9yxOSX", productId: "prod_UpaivbIkPP1Coh" },
  { id: "costume-wizard", name: "Wizard", kind: "costume", plainColor: "Indigo", priceLabel: "GBP 5.00", priceId: "price_1TpvbWHmsD7gK0nLCRORBFNW", productId: "prod_Upanwyix8W2oUV" },
  { id: "costume-cowboy", name: "Cowboy", kind: "costume", plainColor: "Brown", priceLabel: "GBP 5.00", priceId: "price_1TpvdQHmsD7gK0nLARH5jiK6", productId: "prod_Upaps0nejQRQas" },
  { id: "costume-ninja", name: "Ninja", kind: "costume", plainColor: "Black", priceLabel: "GBP 5.00", priceId: "price_1Tpvf3HmsD7gK0nLRIQah37C", productId: "prod_UpaqYppQTFsNos" },
  { id: "costume-viking", name: "Viking", kind: "costume", plainColor: "Fur", priceLabel: "GBP 5.00", priceId: "price_1TpvgIHmsD7gK0nLKKPGvBuz", productId: "prod_UpascR0hqgOq2d" },
  { id: "costume-samurai", name: "Samurai", kind: "costume", plainColor: "Crimson", priceLabel: "GBP 5.00", priceId: "price_1TpviGHmsD7gK0nLD7WXSVoy", productId: "prod_UpaufRtxQHUhbF" },
  { id: "costume-diver", name: "Diver", kind: "costume", plainColor: "Brass", priceLabel: "GBP 5.00", priceId: "price_1TpvjzHmsD7gK0nLzdBIdZa0", productId: "prod_UpavxAM0KGm8C6" },
  { id: "costume-firefighter", name: "Firefighter", kind: "costume", plainColor: "Red", priceLabel: "GBP 5.00", priceId: "price_1Tpvl9HmsD7gK0nLzfe6Jk7R", productId: "prod_UpaxCnSYRhVofB" },
  { id: "costume-doctor", name: "Doctor", kind: "costume", plainColor: "White", priceLabel: "GBP 5.00", priceId: "price_1TpvmnHmsD7gK0nLwOaEMmif", productId: "prod_UpaytIlrxZMx5B" },
  { id: "costume-clown", name: "Clown", kind: "costume", plainColor: "Rainbow", priceLabel: "GBP 5.00", priceId: "price_1TpvnOHmsD7gK0nLxWFcHxrG", productId: "prod_Upaz3a0k9cMuZP" },
  { id: "costume-santa", name: "Santa", kind: "costume", plainColor: "Red", priceLabel: "GBP 5.00", priceId: "price_1TpvzJHmsD7gK0nLv9RyyLZp", productId: "prod_UpbBcT4VxpYQk0", availability: { type: "month", month: 12 } },
  { id: "costume-skeleton", name: "Skeleton", kind: "costume", plainColor: "Bone", priceLabel: "GBP 5.00", priceId: "price_1Tpvq0HmsD7gK0nLynQlHhT8", productId: "prod_Upb2FLniFOUZlU", availability: { type: "dates", dates: ["10-31", "11-01"] } },
  { id: "costume-teddy", name: "Teddy", kind: "costume", plainColor: "Honey", priceLabel: "Free", priceId: "price_1Tpw0RHmsD7gK0nLmwLsy9E7", productId: "prod_UpbCRtUOQpec0E", freeClaim: true, availability: { type: "birthday" } },
  { id: "trail-smoke", name: "Smoke Trail", kind: "trail", plainColor: "Smoke", priceLabel: "GBP 7.00", priceId: "price_1TqHb2HmsD7gK0nLOjctcv4d", productId: "prod_UpxWZVT2Mzv5th" },
  { id: "trail-water", name: "Water Trail", kind: "trail", plainColor: "Water", priceLabel: "GBP 7.00", priceId: "price_1TqHelHmsD7gK0nLiGu02lbg", productId: "prod_UpxZyhCmnYPbNd" },
  { id: "trail-magic", name: "Magic Trail", kind: "trail", plainColor: "Magic", priceLabel: "GBP 7.00", priceId: "price_1TqHfLHmsD7gK0nLyXkhzOhy", productId: "prod_UpxaqKDUsfPG8D" },
  { id: "trail-rainbow", name: "Rainbow Trail", kind: "trail", plainColor: "Rainbow", priceLabel: "GBP 7.00", priceId: "price_1TqHgJHmsD7gK0nLI5a6yWzE", productId: "prod_UpxbnIZ5SKOnC3" },
  { id: "trail-plasma", name: "Plasma Trail", kind: "trail", plainColor: "Plasma", priceLabel: "GBP 7.00", priceId: "price_1TqHgnHmsD7gK0nLm6H6j7al", productId: "prod_UpxczYYA1xPzXU" },
  { id: "trail-snow", name: "Snow Trail", kind: "trail", plainColor: "Snow", priceLabel: "GBP 7.00", priceId: "price_1TqHhJHmsD7gK0nLyi2lR5Sd", productId: "prod_UpxcTAhPG1gePO" },
  { id: "trail-bats", name: "Bat Trail", kind: "trail", plainColor: "Bats", priceLabel: "GBP 7.00", priceId: "price_1TqHiCHmsD7gK0nLBIjzEEOB", productId: "prod_UpxdJmfhSpp3sU" },
  { id: "trail-hearts", name: "Heart Trail", kind: "trail", plainColor: "Hearts", priceLabel: "GBP 7.00", priceId: "price_1TqHjDHmsD7gK0nLM4NNrgk6", productId: "prod_UpxejWrfVwaVr0" },
  { id: "trail-flowers", name: "Flower Trail", kind: "trail", plainColor: "Flowers", priceLabel: "GBP 7.00", priceId: "price_1TqHjVHmsD7gK0nLrURknwLD", productId: "prod_Upxee4KIo3Sksn" }
]);
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
  accountSaves: new Map(),
  sharedWorlds: new Map(),
  sharedPlayers: new Map()
};
let dbPoolPromise = null;
let dbPoolRetryAfter = 0;
const databaseReconnectDelayMs = 30000;
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
const playerInteractionChoices = new Set(["trade", "duel", "truce", "team"]);
const difficultyChoices = new Set(["easy", "medium", "hard"]);
const gameModeChoices = new Set(["horde", "survival"]);
const partyLobbyMaxPlayers = 4;
const partyNetcodeVersion = 2;
const sharedWorldSessionId = "shared-public";
const sharedWorldStorageId = "shared-public-v1";
const sharedWorldMode = "shared-public";
const sharedWorldMaxPlayers = Math.max(1, Math.floor(Number(process.env.CLUSTERNAUTS_SHARED_WORLD_MAX_PLAYERS) || 40));
const sharedWorldTeamMaxPlayers = 4;
const sharedWorldSaveIntervalMs = 5000;
const sharedWorldIdleResetMs = Math.max(0, Math.floor(Number(process.env.CLUSTERNAUTS_SHARED_WORLD_IDLE_RESET_MS) || 24 * 60 * 60 * 1000));
const sharedWorldOfflineTeamRetentionMs = 7 * 24 * 60 * 60 * 1000;
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

function loadStripeLocalConfig() {
  const envConfig = loadStripeConfigJsonFromEnv();
  if (envConfig) {
    return envConfig;
  }

  const configPath = path.join(root, "data", "stripe.json");
  if (!fs.existsSync(configPath)) {
    return { loaded: false, source: "", values: {} };
  }

  try {
    const values = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return { loaded: false, source: "", values: {} };
    }
    return { loaded: true, source: "file", values };
  } catch (error) {
    console.warn(`Could not read Stripe config: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return { loaded: false, source: "", values: {} };
  }
}

function loadStripeConfigJsonFromEnv() {
  const raw = process.env.STRIPE_CONFIG_JSON || process.env.STRIPE_JSON || "";
  if (!raw) {
    return null;
  }

  try {
    const values = JSON.parse(raw);
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      console.warn("Could not read Stripe config from env: JSON must be an object.");
      return { loaded: false, source: "env", values: {} };
    }
    return { loaded: true, source: "env", values };
  } catch (error) {
    console.warn(`Could not read Stripe config from env: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return { loaded: false, source: "env", values: {} };
  }
}

function stripeLocalConfigValue(...keys) {
  const values = stripeLocalConfig && stripeLocalConfig.values && typeof stripeLocalConfig.values === "object"
    ? stripeLocalConfig.values
    : {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      const value = sanitizeDebugText(values[key], 500);
      if (value) {
        return value;
      }
    }
  }
  return "";
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
