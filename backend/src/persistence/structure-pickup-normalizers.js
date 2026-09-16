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

