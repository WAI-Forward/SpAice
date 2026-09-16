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
    skinId: sanitizeText(source.skinId, 64),
    trailId: sanitizeText(source.trailId, 64),
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

