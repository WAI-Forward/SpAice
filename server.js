"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const maxJsonBodyBytes = 500000;
const worldTickMs = 5000;
const techKeys = ["suction", "weapon", "plating", "energy", "propulsion", "shield"];
const toolKeys = ["suction-gadget", "laser-pistol"];
const memoryPersistence = {
  world: createDefaultWorldState(),
  players: new Map()
};
let dbPoolPromise = null;

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

function createDefaultWorldState() {
  return {
    version: 1,
    elapsed: 0,
    particles: [],
    alienoids: [],
    ufos: [],
    rambots: [],
    structures: [],
    rivalProjectiles: [],
    starDust: [],
    nextParticleId: 1,
    nextAlienoidId: 1,
    nextUfoId: 1,
    nextRambotId: 1,
    nextStructureId: 1,
    mobSpawnTimers: {
      alienoid: 120,
      ufo: 180,
      rambot: 300
    },
    lastEvolvedAt: Date.now()
  };
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname.startsWith("/api/world/")) {
    void handleWorldRequest(request, response, url);
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

  sendFile(response, filePath);
});

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
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "World persistence request failed."
    });
  }
}

async function loadPersistentState(playerId) {
  const pool = await getDbPool();

  if (!pool) {
    const world = evolveWorldState(memoryPersistence.world);
    memoryPersistence.world = world;
    return {
      ok: true,
      storage: "memory",
      serverTime: Date.now(),
      world,
      player: playerId ? memoryPersistence.players.get(playerId) || null : null,
      players: Array.from(memoryPersistence.players.values())
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("SELECT state FROM spaice_world_state WHERE id = $1", ["primary"]);
  const world = evolveWorldState(normalizeWorldState(worldResult.rows[0] && worldResult.rows[0].state));

  await pool.query(
    `INSERT INTO spaice_world_state (id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    ["primary", JSON.stringify(world)]
  );

  const player = playerId
    ? (await pool.query("SELECT state FROM spaice_player_state WHERE player_id = $1", [playerId])).rows[0]?.state || null
    : null;
  const players = (await pool.query("SELECT state FROM spaice_player_state ORDER BY updated_at DESC LIMIT 80")).rows.map(
    (row) => row.state
  );

  return {
    ok: true,
    storage: "database",
    serverTime: Date.now(),
    world,
    player,
    players
  };
}

async function savePersistentState(playerId, body) {
  const player = normalizePlayerSnapshot(playerId, body && body.player);
  const pool = await getDbPool();
  let world = null;

  if (!pool) {
    world = body && body.world ? normalizeWorldState(body.world) : evolveWorldState(memoryPersistence.world);
    world.lastEvolvedAt = Date.now();
    memoryPersistence.world = world;
    memoryPersistence.players.set(playerId, player);
    return {
      ok: true,
      storage: "memory",
      serverTime: Date.now(),
      world,
      player,
      players: Array.from(memoryPersistence.players.values())
    };
  }

  await ensureDatabaseSchema(pool);

  if (body && body.world) {
    world = normalizeWorldState(body.world);
    world.lastEvolvedAt = Date.now();
  } else {
    const worldResult = await pool.query("SELECT state FROM spaice_world_state WHERE id = $1", ["primary"]);
    world = evolveWorldState(worldResult.rows[0] && worldResult.rows[0].state);
  }

  await pool.query(
    `INSERT INTO spaice_world_state (id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    ["primary", JSON.stringify(world)]
  );
  await pool.query(
    `INSERT INTO spaice_player_state (player_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [playerId, JSON.stringify(player)]
  );

  return {
    ok: true,
    storage: "database",
    serverTime: Date.now(),
    world,
    player
  };
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
    console.warn("SpAice persistence is using memory: no database address found.");
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
    console.log("SpAice persistence connected to PostgreSQL.");
    return pool;
  } catch (error) {
    console.warn(
      `SpAice persistence is using memory: ${error instanceof Error ? error.message : "PostgreSQL unavailable."}`
    );
    return null;
  }
}

function readDatabaseAddress() {
  if (process.env.SPAICE_DATABASE_URL || process.env.DATABASE_URL) {
    return normalizeDatabaseAddress(process.env.SPAICE_DATABASE_URL || process.env.DATABASE_URL);
  }

  const configPath = path.join(root, "data", "db-uri.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const key =
      process.env.SPAICE_DB_TARGET === "prod" || process.env.NODE_ENV === "production"
        ? "prod_address"
        : "dev_address";
    return normalizeDatabaseAddress(config[key]);
  } catch (error) {
    console.warn(`Could not read database config: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return null;
  }
}

function normalizeDatabaseAddress(address) {
  if (typeof address !== "string" || !address.trim()) {
    return null;
  }

  return address.trim().replace(/^postgresql\+psycopg2:\/\//, "postgresql://").replace(/ /g, "%20");
}

async function ensureDatabaseSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS spaice_world_state (
      id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS spaice_player_state (
      player_id text PRIMARY KEY,
      state jsonb NOT NULL,
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
    structures: Array.isArray(source.structures) ? source.structures.map(normalizeStructure).filter(Boolean).slice(0, 120) : [],
    rivalProjectiles: Array.isArray(source.rivalProjectiles)
      ? source.rivalProjectiles.map(normalizeProjectile).filter(Boolean).slice(0, 160)
      : [],
    starDust: Array.isArray(source.starDust) ? source.starDust.map(normalizeStar).filter(Boolean).slice(0, 360) : [],
    nextParticleId: Math.max(1, Math.floor(Number(source.nextParticleId) || 1)),
    nextAlienoidId: Math.max(1, Math.floor(Number(source.nextAlienoidId) || Number(source.nextRivalId) || 1)),
    nextUfoId: Math.max(1, Math.floor(Number(source.nextUfoId) || 1)),
    nextRambotId: Math.max(1, Math.floor(Number(source.nextRambotId) || 1)),
    nextStructureId: Math.max(1, Math.floor(Number(source.nextStructureId) || 1)),
    mobSpawnTimers: normalizeMobSpawnTimers(source.mobSpawnTimers),
    lastEvolvedAt: clampNumber(source.lastEvolvedAt, 0, Date.now()) || Date.now()
  };
}

function normalizePlayerSnapshot(playerId, snapshot) {
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const tools = normalizeToolInventory(source.tools);
  const equippedTool = tools.includes(source.equippedTool) ? source.equippedTool : tools[0];

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
    tech: normalizeTechInventory(source.tech),
    tools,
    equippedTool,
    landed: normalizeLanding(source.landed),
    cameraRoll: clampNumber(source.cameraRoll, -Math.PI * 16, Math.PI * 16),
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

function normalizeToolInventory(source) {
  const tools = Array.isArray(source) ? source : [];
  const validTools = tools.filter((tool, index) => toolKeys.includes(tool) && tools.indexOf(tool) === index);
  return validTools.includes("suction-gadget") ? validTools : ["suction-gadget"].concat(validTools);
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
    rambot: timer("rambot", 300)
  };
}

function normalizeAlienoid(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    kind: "alienoid",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 120),
    health: clampNumber(source.health, 0, 100),
    maxHealth: clampNumber(source.maxHealth, 1, 100),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    respawnTimer: clampNumber(source.respawnTimer, 0, 3600),
    landed: normalizeLanding(source.landed),
    residentTier: sanitizeText(source.residentTier, 32) || null,
    shootCooldown: clampNumber(source.shootCooldown, 0, 60),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeUfo(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 140),
    health: clampNumber(source.health, 0, 130),
    maxHealth: clampNumber(source.maxHealth, 1, 130),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    respawnTimer: clampNumber(source.respawnTimer, 0, 3600),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    beamAngle: clampNumber(source.beamAngle, -Math.PI * 16, Math.PI * 16),
    beamPulse: clampNumber(source.beamPulse, -Math.PI * 16, Math.PI * 16),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeRambot(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    kind: "rambot",
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    radius: clampNumber(source.radius, 8, 160),
    health: clampNumber(source.health, 0, 210),
    maxHealth: clampNumber(source.maxHealth, 1, 210),
    color: normalizeColor(source.color),
    flash: clampNumber(source.flash, 0, 5),
    hitCooldown: clampNumber(source.hitCooldown, 0, 10),
    strafeSign: Number(source.strafeSign) < 0 ? -1 : 1,
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    chargeCooldown: clampNumber(source.chargeCooldown, 0, 60),
    chargeTimer: clampNumber(source.chargeTimer, 0, 10),
    recoverTimer: clampNumber(source.recoverTimer, 0, 10),
    chargeDirX: clampNumber(source.chargeDirX, -1, 1),
    chargeDirY: clampNumber(source.chargeDirY, -1, 1),
    impactCooldown: clampNumber(source.impactCooldown, 0, 10),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeStructure(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const type = source.type === "turret" ? "turret" : null;
  if (!type) {
    return null;
  }

  return {
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    type,
    bodyId: Math.max(1, Math.floor(Number(source.bodyId) || 1)),
    angle: clampNumber(source.angle, -Math.PI * 16, Math.PI * 16),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    aimAngle: clampNumber(source.aimAngle, -Math.PI * 16, Math.PI * 16),
    deploy: clampNumber(source.deploy, 0, 1),
    shootCooldown: clampNumber(source.shootCooldown, 0, 60),
    wobble: clampNumber(source.wobble, -Math.PI * 16, Math.PI * 16)
  };
}

function normalizeProjectile(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2000, 2000),
    vy: clampNumber(source.vy, -2000, 2000),
    radius: clampNumber(source.radius, 1, 40),
    length: clampNumber(source.length, 1, 200),
    color: normalizeColor(source.color),
    life: clampNumber(source.life, 0, 20),
    maxLife: clampNumber(source.maxLife, 0, 20)
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
    angle: clampNumber(source.angle, -Math.PI * 16, Math.PI * 16),
    walkSpeed: clampNumber(source.walkSpeed, -500, 500)
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

server.listen(port, () => {
  console.log(`SpAice is running at http://localhost:${port}`);
});
