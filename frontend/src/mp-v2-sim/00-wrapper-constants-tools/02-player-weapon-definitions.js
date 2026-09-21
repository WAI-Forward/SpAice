  const PLAYER_WEAPON_DEFINITIONS = {
    "laser-pistol": PLAYER_WEAPON_DEFAULTS,
    "laser-rifle": {
      speed: 860,
      damage: 30,
      cooldown: 1.25,
      knockback: 260,
      movementSlow: 0.22,
      life: 0.78,
      length: 76,
      radius: 5,
      energyCost: 12,
      color: { r: 255, g: 115, b: 173 },
      piercesMobs: true,
      label: "laser rifle"
    },
    shotgun: {
      speed: 820,
      damage: 12,
      cooldown: 1.35,
      knockback: 180,
      movementSlow: 0.28,
      life: 0.62,
      length: 38,
      radius: 5.4,
      energyCost: 16,
      pelletCount: 9,
      spread: 0.28,
      color: { r: 255, g: 220, b: 122 },
      label: "shotgun"
    },
    [MACHINE_GUN_TOOL_ID]: {
      speed: 960,
      damage: 10,
      cooldown: 0.14,
      knockback: 95,
      movementSlow: 0.06,
      life: 0.72,
      length: 36,
      radius: 4.2,
      energyCost: 3,
      spread: 0.055,
      color: { r: 119, g: 167, b: 255 },
      label: "machine gun"
    }
  };
  const TOOL_UPGRADE_BONUS_SCALES = {
    "laser-pistol": { damage: 0.9, range: 0.9 },
    "laser-rifle": { damage: 0.9, range: 0.9 },
    shotgun: { damage: 0.9, range: 0.9 },
    [MACHINE_GUN_TOOL_ID]: { damage: 0.9, range: 0.9 },
    spanner: { "repair-speed": 1.15, "dismantle-speed": 1.15 },
    [DEFAULT_TOOL_ID]: { suck: 1.2, blow: 1.2 },
    [VICIOUS_VACUUM_TOOL_ID]: { suck: 1.2, blow: 1.2 },
    [EMP_TOOL_ID]: { range: 0.8, duration: 0.65 }
  };
  const TOOL_UPGRADES = {
    "laser-pistol": [
      { id: "damage", techKey: "weapon", cost: 3 },
      { id: "range", techKey: "target", cost: 3 }
    ],
    "laser-rifle": [
      { id: "damage", techKey: "weapon", cost: 5 },
      { id: "range", techKey: "target", cost: 5 }
    ],
    shotgun: [
      { id: "damage", techKey: "weapon", cost: 5 },
      { id: "range", techKey: "propulsion", cost: 4 }
    ],
    [MACHINE_GUN_TOOL_ID]: [
      { id: "damage", techKey: "weapon", cost: 6 },
      { id: "range", techKey: "target", cost: 5 }
    ],
    spanner: [
      { id: "repair-speed", techKey: "repair", cost: 3 },
      { id: "dismantle-speed", techKey: "weapon", cost: 3 }
    ],
    [DEFAULT_TOOL_ID]: [
      { id: "suck", techKey: "suction", cost: 3 },
      { id: "blow", techKey: "propulsion", cost: 3 }
    ],
    [VICIOUS_VACUUM_TOOL_ID]: [
      { id: "suck", techKey: "suction", cost: 4 },
      { id: "blow", techKey: "propulsion", cost: 4 }
    ],
    [EMP_TOOL_ID]: [
      { id: "range", techKey: "target", cost: 5 },
      { id: "duration", techKey: "energy", cost: 5 }
    ]
  };
  const BUILD_RECIPES = [
    { id: DEFAULT_TOOL_ID, category: "tools", cost: {}, unlockToolId: DEFAULT_TOOL_ID },
    { id: "laser-pistol", category: "tools", cost: { weapon: 10, plating: 1 }, unlockToolId: "laser-pistol" },
    { id: "laser-rifle", category: "tools", cost: { weapon: 13, plating: 2, target: 3 }, unlockToolId: "laser-rifle" },
    { id: "shotgun", category: "tools", cost: { weapon: 16, propulsion: 6, plating: 3 }, unlockToolId: "shotgun", blueprintObjectiveId: "kill_alienoid_boss" },
    { id: MACHINE_GUN_TOOL_ID, category: "tools", cost: { weapon: 22, target: 8, shield: 6 }, unlockToolId: MACHINE_GUN_TOOL_ID, blueprintObjectiveId: "kill_fighter_boss" },
    { id: VICIOUS_VACUUM_TOOL_ID, category: "tools", cost: { suction: 16, weapon: 6, energy: 3 }, unlockToolId: VICIOUS_VACUUM_TOOL_ID, blueprintObjectiveId: "kill_ufo_boss" },
    { id: EMP_TOOL_ID, category: "tools", cost: { energy: 16, target: 5, weapon: 6 }, unlockToolId: EMP_TOOL_ID, blueprintObjectiveId: "kill_tesla_boss" },
    { id: FAMILIAR_NET_TOOL_ID, category: "tools", cost: { repair: 16, target: 5, weapon: 6 }, unlockToolId: FAMILIAR_NET_TOOL_ID, blueprintObjectiveId: "kill_engineer_boss" },
    { id: PISTON_PUNCH_TOOL_ID, category: "tools", cost: { plating: 16, weapon: 8, propulsion: 4 }, unlockToolId: PISTON_PUNCH_TOOL_ID, blueprintObjectiveId: "kill_rambot_boss" },
    { id: GUIDED_LAUNCHER_TOOL_ID, category: "tools", cost: { target: 16, propulsion: 8, weapon: 6 }, unlockToolId: GUIDED_LAUNCHER_TOOL_ID, blueprintObjectiveId: "kill_satellite_boss" },
    { id: ROCKET_SUIT_TOOL_ID, category: "tools", cost: { propulsion: 18, plating: 7, energy: 5 }, unlockToolId: ROCKET_SUIT_TOOL_ID, blueprintObjectiveId: "kill_rocket_boss" },
    { id: PERSONAL_TETHER_TOOL_ID, category: "tools", cost: { suction: 6, plating: 3, propulsion: 2 }, unlockToolId: PERSONAL_TETHER_TOOL_ID },
    { id: "spanner", category: "tools", cost: { repair: 3, weapon: 10 }, unlockToolId: "spanner" },
    { id: "plating-block", category: "structures", cost: { plating: 4 }, structureType: "plating-block" },
    { id: "battery", category: "structures", cost: { energy: 5, plating: 3 }, structureType: "battery" },
    { id: "container", category: "structures", cost: { plating: 6, repair: 2 }, structureType: "container" },
    { id: "trading-port", category: "structures", cost: { plating: 8, propulsion: 5, communication: 3, repair: 2 }, structureType: "trading-port" },
    { id: "medbay", category: "structures", cost: { repair: 5, energy: 4, plating: 3 }, structureType: "medbay" },
    { id: "accumulator", category: "structures", cost: { plating: 3, suction: 5, energy: 1 }, structureType: "accumulator" },
    { id: "turret", category: "structures", cost: { plating: 3, weapon: 5, energy: 1 }, structureType: "turret" },
    { id: "missile-launcher", category: "structures", cost: { plating: 5, weapon: 7, propulsion: 5, target: 4 }, structureType: "missile-launcher" },
    { id: "shield-generator", category: "structures", cost: { plating: 4, shield: 5, energy: 3 }, structureType: "shield-generator" },
    { id: "jet", category: "structures", cost: { plating: 4, propulsion: 5, energy: 2 }, structureType: "jet" },
    { id: "tether", category: "structures", cost: { suction: 2, plating: 1 }, structureType: "tether" },
    { id: "bridge", category: "structures", cost: { plating: 12, propulsion: 2 }, structureType: "bridge" }
  ];
  const STRUCTURE_MAX_HEALTH = {
    "plating-block": 150,
    container: 140,
    "trading-port": 160,
    bridge: 170,
    tether: 130,
    "shield-generator": 130,
    "missile-launcher": 125,
    accumulator: 120,
    battery: 120,
    medbay: 135,
    "communication-relay": 120,
    jet: 120
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, finiteOr(value, min)));
  }

  function finiteOr(value, fallback) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function cloneColor(color) {
    return color && typeof color === "object" ? { r: color.r, g: color.g, b: color.b } : color;
  }

  function cloneTechInventory(tech) {
    const result = {};
    const source = tech && typeof tech === "object" ? tech : {};
    for (const key of TECH_KEYS) {
      result[key] = Math.max(0, Math.floor(finiteOr(source[key], 0)));
    }
    return result;
  }

  function spacecraftHashUnit(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function spacecraftStringSeed(value) {
    const text = String(value || "");
    let seed = 0;
    for (let i = 0; i < text.length; i += 1) {
      seed += text.charCodeAt(i) * (i + 1);
    }
    return seed || 1;
  }

  function recipeById(id) {
    return BUILD_RECIPES.find((recipe) => recipe.id === id) || null;
  }

  function isSuctionToolId(toolId) {
    return toolId === DEFAULT_TOOL_ID || toolId === VICIOUS_VACUUM_TOOL_ID;
  }

  function isViciousVacuumToolId(toolId) {
    return toolId === VICIOUS_VACUUM_TOOL_ID;
  }

  function isEmpToolId(toolId) {
    return toolId === EMP_TOOL_ID;
  }

  function isFamiliarNetToolId(toolId) {
    return toolId === FAMILIAR_NET_TOOL_ID;
  }

  function isPersonalTetherToolId(toolId) {
    return toolId === PERSONAL_TETHER_TOOL_ID;
  }

  function isPistonPunchToolId(toolId) {
    return toolId === PISTON_PUNCH_TOOL_ID;
  }

  function isRocketSuitToolId(toolId) {
    return toolId === ROCKET_SUIT_TOOL_ID;
  }

  function isSpannerToolId(toolId) {
    return toolId === "spanner";
  }

  function upgradeById(toolId, upgradeId) {
    const upgrades = TOOL_UPGRADES[toolId] || [];
    return upgrades.find((upgrade) => upgrade.id === upgradeId) || null;
  }

  function normalizeToolList(source, fallback) {
    const items = Array.isArray(source) ? source.map(String) : [];
    const valid = items.filter((toolId, index) => TOOL_IDS.includes(toolId) && items.indexOf(toolId) === index);
    if (!valid.includes(DEFAULT_TOOL_ID)) {
      valid.unshift(DEFAULT_TOOL_ID);
    }
    return valid.length ? valid.slice(0, 8) : (fallback || [DEFAULT_TOOL_ID]).slice(0, 8);
  }

  function canAffordCost(player, cost) {
    const tech = player && player.tech ? player.tech : {};
    return Object.entries(cost || {}).every(([key, amount]) => {
      return Math.floor(finiteOr(tech[key], 0)) >= Math.max(0, Math.floor(finiteOr(amount, 0)));
    });
  }

  function spendCost(player, cost) {
    if (!player.tech) {
      player.tech = defaultTechInventory();
    }
    for (const [key, amount] of Object.entries(cost || {})) {
      if (!TECH_KEYS.includes(key)) {
        continue;
      }
      player.tech[key] = Math.max(0, Math.floor(finiteOr(player.tech[key], 0)) - Math.max(0, Math.floor(finiteOr(amount, 0))));
    }
  }

  function recipeByStructureType(type) {
    return BUILD_RECIPES.find((recipe) => recipe.category === "structures" && recipe.structureType === type) || null;
  }

  function refundRecipeCost(player, recipe, factor) {
    if (!player || !recipe || !recipe.cost) {
      return 0;
    }
    if (!player.tech) {
      player.tech = defaultTechInventory();
    }
    let refunded = 0;
    for (const [techKey, amount] of Object.entries(recipe.cost)) {
      if (!TECH_KEYS.includes(techKey)) {
        continue;
      }
      const refundAmount = Math.max(1, Math.floor(Math.max(0, finiteOr(amount, 0)) * Math.max(0, finiteOr(factor, 0))));
      player.tech[techKey] = Math.max(0, Math.floor(finiteOr(player.tech[techKey], 0))) + refundAmount;
      refunded += refundAmount;
    }
    return refunded;
  }

  function playerHasTool(player, toolId) {
    return Boolean(player && Array.isArray(player.tools) && player.tools.includes(toolId));
  }

  function setEquippedTools(state, playerId, equippedTool, equippedTools) {
    const player = state && state.players && state.players[playerId];
    if (!player) {
      return false;
    }

    player.tools = normalizeToolList(player.tools);
    const requested = normalizeToolList(equippedTools, player.equippedTools).filter((toolId) => player.tools.includes(toolId));
    player.equippedTools = requested.length ? requested : [DEFAULT_TOOL_ID];
    player.equippedTool = player.equippedTools.includes(equippedTool) ? equippedTool : player.equippedTools[0];
    if (!player.equippedTool) {
      player.equippedTool = DEFAULT_TOOL_ID;
      player.equippedTools = [DEFAULT_TOOL_ID];
    }
    return true;
  }

  function craftTool(state, playerId, recipeId) {
    const player = state && state.players && state.players[playerId];
    const recipe = recipeById(recipeId);
    if (!player || !recipe || recipe.category !== "tools" || !recipe.unlockToolId) {
      return false;
    }

    player.tools = normalizeToolList(player.tools);
    if (!playerHasTool(player, recipe.unlockToolId)) {
      if (!canAffordCost(player, recipe.cost)) {
        return false;
      }
      spendCost(player, recipe.cost);
      player.tools.push(recipe.unlockToolId);
    }

    const equipped = normalizeToolList(player.equippedTools, player.tools).filter((toolId) => player.tools.includes(toolId));
    if (!equipped.includes(recipe.unlockToolId)) {
      equipped.push(recipe.unlockToolId);
    }
    player.equippedTools = equipped.slice(0, 8);
    player.equippedTool = recipe.unlockToolId;
    return true;
  }

  function upgradeTool(state, playerId, toolId, upgradeId) {
    const player = state && state.players && state.players[playerId];
    const upgrade = upgradeById(String(toolId || ""), String(upgradeId || ""));
    if (!player || !upgrade || !playerHasTool(player, toolId) || !canAffordCost(player, { [upgrade.techKey]: upgrade.cost })) {
      return false;
    }

    spendCost(player, { [upgrade.techKey]: upgrade.cost });
    if (!player.toolUpgrades || typeof player.toolUpgrades !== "object") {
      player.toolUpgrades = {};
    }
    if (!player.toolUpgrades[toolId] || typeof player.toolUpgrades[toolId] !== "object") {
      player.toolUpgrades[toolId] = {};
    }
    player.toolUpgrades[toolId][upgrade.id] = Math.max(0, finiteOr(player.toolUpgrades[toolId][upgrade.id], 0)) + 1;
    return true;
  }

  function thresholdForTierName(name) {
    const normalized = String(name || "").trim().toLowerCase();
    const tier = BODY_TIERS.find((candidate) => candidate.name === normalized) ||
      STELLAR_BRANCH_TIERS.find((candidate) => candidate.name === normalized);
    return tier ? tier.threshold : 0;
  }

  function isStarBody(body) {
    return Boolean(body && body.tier && (body.tier.name === "star" || STELLAR_OUTCOME_TIER_NAMES.includes(body.tier.name)));
  }

  function orbitRingCountForBody(body) {
    if (!body || !body.tier) {
      return 0;
    }
    if (body.tier.name === "white dwarf") {
      return 5;
    }
    if (body.tier.name === "star") {
      return 3;
    }
    if (body.tier.name === ORBIT_CAPTURE_MIN_TIER_NAME) {
      return 1;
    }
    return 0;
  }

  function orbitRingRadius(body, ringIndex) {
    const radius = Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
    const contactRadius = solidContactRadius(body);
    const baseGap = Math.max(ORBIT_RING_MIN_GAP, radius * ORBIT_RING_BASE_GAP_SCALE);
    return contactRadius + baseGap * (1 + Math.max(0, finiteOr(ringIndex, 0)) * ORBIT_RING_SPACING_SCALE);
  }

  function orbitCaptureBandForRing(body, orbiter, ringRadius) {
    return Math.max(
      ORBIT_CAPTURE_MIN_BAND,
      finiteOr(ringRadius, orbitRingRadius(body, 0)) * ORBIT_CAPTURE_BAND_SCALE +
        Math.max(0, finiteOr(orbiter && orbiter.radius, 0)) * 0.72
    );
  }

  function canBodyOrbitHost(orbiter, host) {
    if (!orbiter || !host || orbiter === host || !orbiter.tier || !host.tier) {
      return false;
    }
    if (orbiter.survivalCampBody || host.survivalCampBody) {
      return false;
    }
    if (orbitRingCountForBody(host) <= 0) {
      return false;
    }
    if (finiteOr(orbiter.mass, 0) >= finiteOr(host.mass, 0)) {
      return false;
    }
    return orbiter.tier.threshold < host.tier.threshold || finiteOr(orbiter.mass, 0) < finiteOr(host.mass, 0) * 0.72;
  }

  function bestOrbitRingForBody(orbiter, host) {
    if (!canBodyOrbitHost(orbiter, host)) {
      return null;
    }
    const dx = finiteOr(orbiter.x, 0) - finiteOr(host.x, 0);
    const dy = finiteOr(orbiter.y, 0) - finiteOr(host.y, 0);
    const distance = Math.hypot(dx, dy) || 1;
    let best = null;
    for (let i = 0; i < orbitRingCountForBody(host); i += 1) {
      const radius = orbitRingRadius(host, i);
      const band = orbitCaptureBandForRing(host, orbiter, radius);
      const delta = distance - radius;
      const score = Math.abs(delta) / band + i * 0.035;
      if (Math.abs(delta) <= band * 2.35 && (!best || score < best.score)) {
        best = { host, ringIndex: i, radius, band, distance, dx, dy, delta, score };
      }
    }
    return best;
  }

  function orbitDirectionForBody(orbiter, host, nx, ny, relVx, relVy) {
    const tangentVelocity = relVx * -ny + relVy * nx;
    if (Math.abs(tangentVelocity) > 8) {
      return tangentVelocity >= 0 ? 1 : -1;
    }
    const stored = finiteOr(orbiter && orbiter.orbitDirection, 0);
    if (stored < 0 || stored > 0) {
      return stored < 0 ? -1 : 1;
    }
    return ((Math.floor(finiteOr(orbiter && orbiter.id, 0)) + Math.floor(finiteOr(host && host.id, 0))) % 2) ? -1 : 1;
  }

  function orbitalSpeedForRing(host, ringIndex, radius) {
    const hostRadius = Math.max(1, finiteOr(host && host.radius, host ? radiusFromMass(host.mass) : 1));
    const tierBoost = isStarBody(host) ? 78 : 34;
    return clamp(122 + Math.sqrt(hostRadius) * 7.5 + tierBoost + Math.max(0, finiteOr(ringIndex, 0)) * 18 - Math.max(0, finiteOr(radius, 1) - hostRadius) * 0.055, 128, 345);
  }

  function findOrbitCapture(body, bodies) {
    if (!body || !Array.isArray(bodies)) {
      return null;
    }
    let best = null;
    const preferredHostId = Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0)));
    for (const host of bodies) {
      const candidate = bestOrbitRingForBody(body, host);
      if (!candidate) {
        continue;
      }
      const hostBias = preferredHostId && host.id === preferredHostId ? -0.24 : 0;
      const score = candidate.score + hostBias;
      if (!best || score < best.score) {
        best = Object.assign(candidate, { score });
      }
    }
    return best;
  }

  function clearOrbitState(body) {
    if (!body) {
      return;
    }
    body.orbitHostId = 0;
    body.orbitRingIndex = 0;
    body.orbitStrength = 0;
    body.orbitGrace = 0;
  }
