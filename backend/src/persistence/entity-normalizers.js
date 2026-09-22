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

const survivalBodySaveKeys = [
  "ownerPlayerId", "survivalCampId", "survivalCampX", "survivalCampY",
  "survivalCampHomeX", "survivalCampHomeY", "survivalCampMovedByPlayer",
  "survivalCampBodyMovedWakeSent", "survivalCampLastMoverPlayerId",
  "lastControllingPlayerId", "lastPlayerControlAt", "lastPlayerControlBelowSpeedAt",
  "playerImpactDebrisCooldown", "survivalCampBody", "ambientSpawnRock",
  "orbitHostId", "orbitRingIndex", "orbitDirection", "orbitStrength", "orbitGrace",
  "stellarOutcome", "stellarGrowthStarted", "stellarGrowthRate", "stellarGrowthLastSampleAt",
  "randomEventId", "randomEventRegionX", "randomEventRegionY", "ufoSapTimer",
  "ufoSapSourceGraceTimer", "ufoExtractedById", "ufoExtractedFromId", "ufoSapParticleBuffer"
];
const survivalMobSaveKeys = [
  "survivalCampId", "survivalCampX", "survivalCampY", "survivalCampBand",
  "survivalCampBudget", "survivalCampSlotAngle", "survivalCampSlotRadius",
  "survivalCampReturning", "survivalCampAggroTimer", "survivalAiState",
  "survivalEncounterType", "survivalEncounterId", "survivalMigrationCampId",
  "survivalMigrationCampX", "survivalMigrationCampY", "survivalMigrationStraightTime",
  "survivalMigrationDirX", "survivalMigrationDirY", "survivalSalvageBodyId",
  "survivalSalvageSourceCampId", "survivalSalvageTargetCampId", "survivalSalvageAge",
  "survivalCargoMass", "survivalCargoSourceCount", "survivalTargetPlayerId"
];

function normalizeSurvivalSaveFields(source, keys) {
  const result = {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") result[key] = value.slice(0, 128);
    else if (typeof value === "boolean") result[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) result[key] = clampNumber(value, -1000000, 1000000);
  }
  return result;
}

function normalizeParticle(source) {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    ...normalizeSurvivalSaveFields(source, survivalBodySaveKeys),
    id: Math.max(1, Math.floor(Number(source.id) || 1)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -1200, 1200),
    vy: clampNumber(source.vy, -1200, 1200),
    mass: clampNumber(source.mass, 1, 100000000),
    radius: clampNumber(source.radius, 1, 5000),
    energy: clampNumber(source.energy, 0, 1000000),
    maxEnergy: clampNumber(source.maxEnergy, 0, 1000000),
    rotation: clampNumber(source.rotation, -Math.PI * 16, Math.PI * 16),
    angularVelocity: clampNumber(source.angularVelocity, -16, 16),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
    ...normalizeSurvivalSaveFields(source, survivalMobSaveKeys),
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
