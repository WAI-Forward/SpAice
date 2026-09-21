  function normalizeWorld(source, seedHolder) {
    const world = source && typeof source === "object" ? source : {};
    const gameMode = normalizeGameMode(world.gameMode);
    const sourceTimers = world.mobSpawnTimers && typeof world.mobSpawnTimers === "object" ? world.mobSpawnTimers : {};
    const sourceDefeats = world.mobDefeatsByKind && typeof world.mobDefeatsByKind === "object" ? world.mobDefeatsByKind : {};
    const sourceBossDefeats = world.mobBossDefeatsByKind && typeof world.mobBossDefeatsByKind === "object" ? world.mobBossDefeatsByKind : {};
    const sourceBossProgress = world.mobBossProgressByKind && typeof world.mobBossProgressByKind === "object" ? world.mobBossProgressByKind : {};
    const sourceBossWarnings = world.mobBossWarnings && typeof world.mobBossWarnings === "object" ? world.mobBossWarnings : {};
    const sourceMobIds = world.nextMobIds && typeof world.nextMobIds === "object" ? world.nextMobIds : {};
    const mobSpawnTimers = {};
    const mobDefeatsByKind = {};
    const mobBossDefeatsByKind = {};
    const mobBossProgressByKind = {};
    const mobBossWarnings = {};
    const nextMobIds = {};
    for (const kind of MOB_TIER_ORDER) {
      const warning = sourceBossWarnings[kind] && typeof sourceBossWarnings[kind] === "object" ? sourceBossWarnings[kind] : {};
      mobSpawnTimers[kind] = Math.max(0, finiteOr(sourceTimers[kind], MOB_SPAWN_INTERVALS[kind]));
      mobDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(sourceDefeats[kind], 0)));
      mobBossDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(sourceBossDefeats[kind], 0)));
      if (Object.prototype.hasOwnProperty.call(sourceBossProgress, kind)) {
        mobBossProgressByKind[kind] = clamp(Math.floor(finiteOr(sourceBossProgress[kind], 0)), 0, MOB_BOSS_DEFEATS_TO_UNLOCK);
      } else {
        const regularDefeats = Math.max(0, mobDefeatsByKind[kind] - mobBossDefeatsByKind[kind]);
        mobBossProgressByKind[kind] = clamp(
          regularDefeats - mobBossDefeatsByKind[kind] * MOB_BOSS_DEFEATS_TO_UNLOCK,
          0,
          MOB_BOSS_DEFEATS_TO_UNLOCK
        );
      }
      mobBossWarnings[kind] = {
        active: Boolean(warning.active),
        timer: clamp(finiteOr(warning.timer, 0), 0, MOB_BOSS_WARNING_DURATION),
        lastNoticeSecond: Math.floor(finiteOr(warning.lastNoticeSecond, -1))
      };
      nextMobIds[kind] = Math.max(1, Math.floor(finiteOr(sourceMobIds[kind], 1)));
    }

    const normalized = {
      particles: [],
      techPickups: [],
      healthPickups: [],
      alienoids: [],
      ufos: [],
      rambots: [],
      engineers: [],
      teslas: [],
      rockets: [],
      fighters: [],
      mobBeacons: [],
      rivalProjectiles: Array.isArray(world.rivalProjectiles) ? world.rivalProjectiles.map((entry, index) => normalizeEntity(entry, index + 1, "projectile")) : [],
      structures: Array.isArray(world.structures) ? clone(world.structures) : [],
      spacecrafts: Array.isArray(world.spacecrafts) ? world.spacecrafts.map((entry, index) => normalizeSpacecraftState(entry, index + 1)).filter(Boolean) : [],
      starDust: Array.isArray(world.starDust) ? clone(world.starDust) : [],
      claimedTechPickupIds: [],
      claimedHealthPickupIds: [],
      nextParticleId: Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1))),
      nextTechPickupId: Math.max(1, Math.floor(finiteOr(world.nextTechPickupId, 1))),
      nextHealthPickupId: Math.max(1, Math.floor(finiteOr(world.nextHealthPickupId, 1))),
      nextMobBeaconId: Math.max(1, Math.floor(finiteOr(world.nextMobBeaconId, 1))),
      nextSurvivalCampId: Math.max(1, Math.floor(finiteOr(world.nextSurvivalCampId, 1))),
      nextRivalProjectileId: Math.max(1, Math.floor(finiteOr(world.nextRivalProjectileId, 1))),
      nextStructureId: Math.max(
        1,
        Math.floor(finiteOr(world.nextStructureId, 1)),
        Array.isArray(world.structures)
          ? world.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
          : 1
      ),
      nextSpacecraftId: Math.max(
        1,
        Math.floor(finiteOr(world.nextSpacecraftId, 1)),
        Array.isArray(world.spacecrafts)
          ? world.spacecrafts.reduce((largest, craft) => Math.max(largest, Math.floor(finiteOr(craft && craft.id, 0)) + 1), 1)
          : 1
      ),
      nextMobIds,
      mobSpawnTimers,
      mobWaveTimer: clamp(finiteOr(world.mobWaveTimer, difficultyMobFirstWaveDelay(world)), 0, difficultyMobWaveInterval(world)),
      mobWaveCount: Math.max(0, Math.floor(finiteOr(world.mobWaveCount, 0))),
      mobDefeatsByKind,
      mobBossDefeatsByKind,
      mobBossProgressByKind,
      mobBossWarnings,
      mobSpawnRestTimer: clamp(finiteOr(world.mobSpawnRestTimer, 0), 0, MOB_SPAWN_REST_DURATION),
      mobSpawnRestDrainTimer: clamp(finiteOr(world.mobSpawnRestDrainTimer, 0), 0, MOB_SPAWN_REST_DRAIN_MAX_DURATION),
      mobSpawnRestCooldownTimer: clamp(finiteOr(world.mobSpawnRestCooldownTimer, MOB_SPAWN_REST_COOLDOWN), 0, MOB_SPAWN_REST_COOLDOWN),
      survivalSpawnState: normalizeSurvivalSpawnState(world.survivalSpawnState),
      difficulty: String(world.difficulty || "medium"),
      gameMode,
      randomEvents: normalizeRandomEventState(world.randomEvents)
    };

    normalized.particles = Array.isArray(world.particles)
      ? world.particles.map((entry, index) => normalizeParticle(entry, index + 1, seedHolder))
      : [];
    normalized.ambientParticleSpawning = world.ambientParticleSpawning === true || normalized.particles.length >= 24;
    normalized.techPickups = Array.isArray(world.techPickups)
      ? world.techPickups.map((entry, index) => normalizePickup(entry, index + 1, "tech"))
      : [];
    normalized.healthPickups = Array.isArray(world.healthPickups)
      ? world.healthPickups.map((entry, index) => normalizePickup(entry, index + 1, "health"))
      : [];

    const rivals = Array.isArray(world.alienoids) ? world.alienoids : Array.isArray(world.rivals) ? world.rivals : [];
    normalized.alienoids = rivals.map((entry, index) => normalizeEntity(entry, index + 1, "alienoid"));
    normalized.ufos = Array.isArray(world.ufos) ? world.ufos.map((entry, index) => normalizeEntity(entry, index + 1, "ufo")) : [];
    normalized.rambots = Array.isArray(world.rambots) ? world.rambots.map((entry, index) => normalizeEntity(entry, index + 1, "rambot")) : [];
    normalized.engineers = Array.isArray(world.engineers) ? world.engineers.map((entry, index) => normalizeEntity(entry, index + 1, "engineer")) : [];
    normalized.teslas = Array.isArray(world.teslas) ? world.teslas.map((entry, index) => normalizeEntity(entry, index + 1, "tesla")) : [];
    normalized.rockets = Array.isArray(world.rockets) ? world.rockets.map((entry, index) => normalizeEntity(entry, index + 1, "rocket")) : [];
    normalized.fighters = Array.isArray(world.fighters) ? world.fighters.map((entry, index) => normalizeEntity(entry, index + 1, "fighter")) : [];
    normalized.mobBeacons = Array.isArray(world.mobBeacons)
      ? world.mobBeacons.map((entry, index) => normalizeMobBeacon(entry, index + 1))
      : [];
    if (gameMode === "survival") {
      normalized.mobBeacons = [];
    }

    for (const kind of MOB_TIER_ORDER) {
      const collection = mobCollectionByKind(normalized, kind);
      nextMobIds[kind] = Math.max(
        nextMobIds[kind],
        collection.reduce((largest, mob) => Math.max(largest, mob && mob.kind === kind ? mob.id + 1 : largest), 1)
      );
    }

    normalized.nextParticleId = Math.max(
      normalized.nextParticleId,
      normalized.particles.reduce((largest, body) => Math.max(largest, body.id + 1), 1)
    );
    normalized.nextTechPickupId = Math.max(
      normalized.nextTechPickupId,
      normalized.techPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1)
    );
    normalized.nextHealthPickupId = Math.max(
      normalized.nextHealthPickupId,
      normalized.healthPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1)
    );
    normalized.nextMobBeaconId = Math.max(
      normalized.nextMobBeaconId,
      normalized.mobBeacons.reduce((largest, beacon) => Math.max(largest, finiteOr(beacon && beacon.id, 0) + 1), 1)
    );
    normalized.nextRivalProjectileId = Math.max(
      normalized.nextRivalProjectileId,
      normalized.rivalProjectiles.reduce((largest, projectile) => Math.max(largest, finiteOr(projectile.id, 0) + 1), 1)
    );
    return normalized;
  }

  function createInitialState(snapshot, partyPlayers, options) {
    const payload = snapshot && typeof snapshot === "object" ? snapshot : {};
    const seedText = options && options.seed ? options.seed : payload.playerId || payload.run && payload.run.id || "clusternauts-v2-room";
    const seedHolder = { seed: hashSeed(seedText) };
    const maxPlayers = Math.max(1, Math.floor(finiteOr(options && options.maxPlayers, MAX_PLAYERS)));
    const sourcePlayers = Array.isArray(partyPlayers) ? partyPlayers.slice(0, maxPlayers) : [];
    const players = {};
    const basePlayer = payload.player && typeof payload.player === "object" ? payload.player : null;

    if (!sourcePlayers.length && basePlayer) {
      sourcePlayers.push({ playerId: basePlayer.id || payload.playerId || "host", publicName: basePlayer.name || "Host" });
    }

    sourcePlayers.forEach((entry, index) => {
      const playerId = String(entry && (entry.playerId || entry.id || entry) || "");
      const playerSnapshot = index === 0 && basePlayer
        ? { ...basePlayer, teamId: entry && entry.teamId || basePlayer.teamId || "" }
        : { id: playerId, name: entry && entry.publicName, teamId: entry && entry.teamId || "" };
      if (playerId) {
        players[playerId] = normalizePlayer({ ...playerSnapshot, id: playerId }, playerId, index);
      }
    });

    const gameMode = normalizeGameMode(payload.run && payload.run.gameMode || payload.world && payload.world.gameMode || options && options.gameMode);
    const difficulty = payload.run && payload.run.difficulty || payload.world && payload.world.difficulty || "medium";
    const world = normalizeWorld(payload.world, seedHolder);
    world.difficulty = difficulty;
    world.gameMode = gameMode;
    if (gameMode === "survival") {
      world.mobBeacons = [];
      world.survivalSpawnState = normalizeSurvivalSpawnState(world.survivalSpawnState);
    }
    if (!payload.world || !Number.isFinite(Number(payload.world.mobWaveTimer))) {
      world.mobWaveTimer = difficultyMobFirstWaveDelay({ difficulty });
    }

    return {
      version: VERSION,
      tick: 0,
      seed: seedHolder.seed >>> 0,
      difficulty,
      gameMode,
      worldMode: String(options && options.worldMode || payload.worldMode || "party"),
      players,
      world,
      events: []
    };
  }

  function addPlayer(state, playerInfo, snapshot) {
    if (!state || !playerInfo) {
      return null;
    }
    const playerId = String(playerInfo.playerId || playerInfo.id || "");
    if (!playerId) {
      return null;
    }
    if (!state.players) {
      state.players = {};
    }
    if (!state.players[playerId]) {
      state.players[playerId] = normalizePlayer({ ...(snapshot || {}), id: playerId, name: playerInfo.publicName || playerInfo.name }, playerId, Object.keys(state.players).length);
    }
    if (Object.prototype.hasOwnProperty.call(playerInfo, "teamId")) {
      state.players[playerId].teamId = String(playerInfo.teamId || "").replace(/[^\w.-]/g, "").slice(0, 80);
    }
    return state.players[playerId];
  }

  function setPlayerTeam(state, playerId, teamId) {
    const player = state && state.players && state.players[String(playerId || "")];
    if (!player) {
      return false;
    }
    player.teamId = String(teamId || "").replace(/[^\w.-]/g, "").slice(0, 80);
    return true;
  }

  function bodyTierForName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    return BODY_TIERS.find((tier) => tier.name === normalized) ||
      STELLAR_BRANCH_TIERS.find((tier) => tier.name === normalized) ||
      null;
  }

  function mobKindForName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_\s]+/g, "");
    if (normalized === "alien" || normalized === "alienoid") return "alienoid";
    if (normalized === "ufo") return "ufo";
    if (normalized === "rambot") return "rambot";
    if (normalized === "tesla") return "tesla";
    if (normalized === "engineer") return "engineer";
    if (normalized === "satellite") return "satellite";
    if (normalized === "rocket" || normalized === "rocketship") return "rocket";
    if (normalized === "fighter" || normalized === "fightership") return "fighter";
    return "";
  }

  function addTechToPlayer(state, playerId, techKey, amount) {
    const player = state && state.players ? state.players[String(playerId || "")] : null;
    const cleanAmount = Math.max(1, Math.floor(finiteOr(amount, 0)));
    const key = String(techKey || "").trim().toLowerCase();
    if (!player || !cleanAmount || (key !== "all" && !TECH_KEYS.includes(key))) {
      return false;
    }
    if (!player.tech) {
      player.tech = defaultTechInventory();
    }
    if (key === "all") {
      for (const candidate of TECH_KEYS) {
        player.tech[candidate] = Math.max(0, Math.floor(finiteOr(player.tech[candidate], 0))) + cleanAmount;
      }
    } else {
      player.tech[key] = Math.max(0, Math.floor(finiteOr(player.tech[key], 0))) + cleanAmount;
    }
    return true;
  }

  function techKeyForMob(kind) {
    if (kind === "ufo") return "suction";
    if (kind === "rambot") return "plating";
    if (kind === "engineer") return "repair";
    if (kind === "tesla") return "energy";
    if (kind === "satellite") return "target";
    if (kind === "rocket") return "propulsion";
    if (kind === "fighter") return "shield";
    return "weapon";
  }

  function createTechPickup(state, techKey, x, y, vx, vy) {
    const world = state && state.world;
    if (!world) {
      return null;
    }
    const id = Math.max(1, Math.floor(finiteOr(world.nextTechPickupId, 1)));
    const seedBase = (
      finiteOr(state.seed, 1) ^
      Math.imul(id, 2654435761) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(state.tick, 0)) + 1), 2246822519)
    ) >>> 0;
    const angleRoll = seededRange(seedBase, 0, Math.PI * 2);
    const burstRoll = seededRange(angleRoll.seed, 60, 132);
    const angle = angleRoll.value;
    const burst = burstRoll.value;
    const pickup = normalizePickup({
      id,
      key: TECH_KEYS.includes(techKey) ? techKey : "weapon",
      x,
      y,
      vx: finiteOr(vx, 0) * 0.14 + Math.cos(angle) * burst,
      vy: finiteOr(vy, 0) * 0.14 + Math.sin(angle) * burst,
      radius: 15,
      life: TECH_PICKUP_LIFETIME,
      maxLife: TECH_PICKUP_LIFETIME,
      rotation: seededRange(burstRoll.seed, 0, Math.PI * 2).value,
      wobble: seededRange(burstRoll.seed ^ 0x9e3779b9, 0, Math.PI * 2).value
    }, id, "tech");
    world.techPickups.push(pickup);
    world.nextTechPickupId = id + 1;
    return pickup;
  }

  function createHealthPickup(state, x, y, vx, vy) {
    const world = state && state.world;
    if (!world) {
      return null;
    }
    const id = Math.max(1, Math.floor(finiteOr(world.nextHealthPickupId, 1)));
    const seedBase = (
      finiteOr(state.seed, 1) ^
      Math.imul(id, 1597334677) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(state.tick, 0)) + 1), 3812015801)
    ) >>> 0;
    const angleRoll = seededRange(seedBase, 0, Math.PI * 2);
    const burstRoll = seededRange(angleRoll.seed, 70, 145);
    const pickup = normalizePickup({
      id,
      x,
      y,
      vx: finiteOr(vx, 0) * 0.18 + Math.cos(angleRoll.value) * burstRoll.value,
      vy: finiteOr(vy, 0) * 0.18 + Math.sin(angleRoll.value) * burstRoll.value,
      radius: 14,
      heal: HEALTH_PICKUP_HEAL,
      life: HEALTH_PICKUP_LIFETIME,
      maxLife: HEALTH_PICKUP_LIFETIME,
      wobble: seededRange(burstRoll.seed, 0, Math.PI * 2).value
    }, id, "health");
    world.healthPickups.push(pickup);
    world.nextHealthPickupId = id + 1;
    return pickup;
  }

  function spawnBody(state, bodyName, source) {
    const world = state && state.world;
    const tier = bodyTierForName(bodyName);
    if (!world || !tier) {
      return null;
    }
    const sourceState = source && typeof source === "object" ? source : {};
    const mass = Math.max(1, finiteOr(tier.threshold, 1));
    const radius = radiusFromMassForTier(mass, tier);
    const direction = normalize(finiteOr(sourceState.directionX, 1), finiteOr(sourceState.directionY, 0));
    const originRadius = Math.max(1, finiteOr(sourceState.radius, PLAYER_RADIUS));
    const distance = Math.max(180, originRadius + radius + 120);
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const sideOffset = (((id - 1) % 7) - 3) * Math.min(radius * 0.9 + 18, 160);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1) + finiteOr(world.nextParticleId, 1) * 2654435761)) >>> 0 };
    const particle = normalizeParticle({
      id,
      x: finiteOr(sourceState.x, 0) + direction.x * distance - direction.y * sideOffset,
      y: finiteOr(sourceState.y, 0) + direction.y * distance + direction.x * sideOffset,
      vx: 0,
      vy: 0,
      mass,
      radius,
      stellarOutcome: STELLAR_OUTCOME_TIER_NAMES.includes(tier.name) ? tier.name : "",
      stellarGrowthStarted: STELLAR_OUTCOME_TIER_NAMES.includes(tier.name),
      stellarGrowthRate: tier.name === "black hole"
        ? STELLAR_GROWTH_RATE_BLACK_HOLE_THRESHOLD
        : tier.name === "neutron star"
          ? STELLAR_GROWTH_RATE_NEUTRON_THRESHOLD
          : 0,
      color: randomParticleColor(seedHolder),
      spawnAge: 0
    }, world.nextParticleId || 1, seedHolder);
    particle.vx = 0;
    particle.vy = 0;
    world.particles.push(particle);
    world.nextParticleId = Math.max(finiteOr(world.nextParticleId, 1), particle.id + 1);
    return particle;
  }

  function spawnMob(state, mobName, amount, source) {
    const world = state && state.world;
    const kind = mobKindForName(mobName);
    const count = Math.max(1, Math.floor(finiteOr(amount, 1)));
    if (!world || !kind || !world.nextMobIds || !Array.isArray(mobCollectionByKind(world, kind))) {
      return 0;
    }
    const sourceState = source && typeof source === "object" ? source : {};
    const sourceAnchor = {
      x: finiteOr(sourceState.x, 0),
      y: finiteOr(sourceState.y, 0),
      vx: 0,
      vy: 0,
      radius: Math.max(1, finiteOr(sourceState.radius, PLAYER_RADIUS)),
      health: 1
    };
    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    const anchors = players.length ? players : [sourceAnchor];
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1) + finiteOr(state.tick, 0) * 1103515245)) >>> 0 };
    for (let i = 0; i < count; i += 1) {
      spawnMobByKind(world, kind, sourceAnchor, anchors, seedHolder);
    }
    state.seed = seedHolder.seed >>> 0;
    return count;
  }

  function spawnBoss(state, mobName, amount, source) {
    const world = state && state.world;
    const kind = mobKindForName(mobName);
    const count = Math.max(1, Math.floor(finiteOr(amount, 1)));
    if (!world || !kind || !world.nextMobIds || !Array.isArray(mobCollectionByKind(world, kind))) {
      return 0;
    }
    const sourceState = source && typeof source === "object" ? source : {};
    const sourceAnchor = {
      x: finiteOr(sourceState.x, 0),
      y: finiteOr(sourceState.y, 0),
      vx: 0,
      vy: 0,
      radius: Math.max(1, finiteOr(sourceState.radius, PLAYER_RADIUS)),
      health: 1
    };
    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0);
    const anchors = players.length ? players : [sourceAnchor];
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1) + finiteOr(state.tick, 0) * 1103515245)) >>> 0 };
    for (let i = 0; i < count; i += 1) {
      spawnBossByKind(state, kind, sourceAnchor, anchors, seedHolder);
    }
    state.seed = seedHolder.seed >>> 0;
    return count;
  }

  function removePlayer(state, playerId) {
    if (state && state.players) {
      delete state.players[String(playerId || "")];
    }
  }

  function respawnPlayer(state, playerId, snapshot) {
    if (!state || !state.players) {
      return null;
    }
    const id = String(playerId || snapshot && (snapshot.id || snapshot.playerId) || "");
    if (!id) {
      return null;
    }
    const existing = state.players[id] || normalizePlayer(null, id, Object.keys(state.players).length);
    const source = Object.assign({}, existing, snapshot || {}, {
      id,
      playerId: id,
      health: finiteOr(snapshot && snapshot.health, finiteOr(snapshot && snapshot.maxHealth, existing.maxHealth || PLAYER_MAX_HEALTH)),
      energy: finiteOr(snapshot && snapshot.energy, finiteOr(snapshot && snapshot.maxEnergy, existing.maxEnergy || PLAYER_MAX_ENERGY)),
      respawnTimer: 0,
      invulnerableTimer: Math.max(2.2, finiteOr(snapshot && snapshot.invulnerableTimer, 0)),
      hitCooldown: 0,
      toolFireCooldown: 0,
      landed: null,
      toolMode: "idle",
      familiarNetFireHeld: false,
      familiarNetReleaseHeld: false,
      moving: false,
      crouching: false,
      rocketSuitCharge: 0,
      rocketSuitActive: false
    });
    const next = normalizePlayer(source, id, Object.keys(state.players).length);
    next.lastInputSeq = Math.max(existing.lastInputSeq || 0, next.lastInputSeq || 0);
    state.players[id] = next;
    return next;
  }

  function canSpendPlayerEnergy(player, amount) {
    if (hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    return finiteOr(player && player.energy, 0) >= Math.max(0, finiteOr(amount, 0));
  }
