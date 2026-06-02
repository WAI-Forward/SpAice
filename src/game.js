(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const massValue = document.getElementById("massValue");
  const particleValue = document.getElementById("particleValue");
  const healthValue = document.getElementById("healthValue");
  const healthFill = document.getElementById("healthFill");
  const modeValue = document.getElementById("modeValue");
  const nextMilestoneLabel = document.getElementById("nextMilestoneLabel");
  const nextMilestoneValue = document.getElementById("nextMilestoneValue");
  const milestoneFill = document.getElementById("milestoneFill");
  const notifications = document.getElementById("notifications");
  const techLedgerList = document.getElementById("techLedgerList");
  const buildMenu = document.getElementById("buildMenu");
  const buildMenuTabs = document.getElementById("buildMenuTabs");
  const buildMenuTech = document.getElementById("buildMenuTech");
  const buildMenuList = document.getElementById("buildMenuList");
  const buildMenuStatus = document.getElementById("buildMenuStatus");
  const toolHotbar = document.getElementById("toolHotbar");
  const mapToggle = document.getElementById("mapToggle");

  const keys = new Set();
  const mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false,
    seen: false
  };

  const player = {
    id: "local-player",
    name: "Player",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 34,
    health: 100,
    maxHealth: 100,
    hitCooldown: 0,
    hitFlash: 0,
    landed: null
  };

  const particles = [];
  const sparks = [];
  const starDust = [];
  const rivals = [];
  const ufos = [];
  const rambots = [];
  const rivalProjectiles = [];
  const playerLasers = [];
  const structures = [];
  const healthPickups = [];
  const techPickups = [];
  const targetParticles = 78;
  const playerFootOffset = 101;
  const rivalFootOffset = 32;
  const projectileDamageSpeed = 155;
  const rivalBodyImpactSpeed = 110;
  const rivalProjectileSpeed = 360;
  const rivalShootRange = 980;
  const rivalProjectileDamage = 10;
  const rambotImpactDamage = 18;
  const rambotImpactSpeed = 260;
  const healthPickupHeal = 14;
  const healthPickupLifetime = 18;
  const techPickupLifetime = 28;
  const mappedBodyThreshold = 100;
  const mobSpawnIntervals = {
    alienoid: 2 * 60,
    ufo: 3 * 60,
    rambot: 5 * 60
  };
  const ufoTractorRange = 520;
  const ufoTractorWidth = 118;
  const ufoTractorForce = 2350;
  const ufoBeamMaxTurn = 1.15;
  const ufoBodyDrainRate = 2.4;
  const playerLaserSpeed = 820;
  const playerLaserDamage = 34;
  const playerLaserCooldown = 0.42;
  const playerLaserKnockback = 310;
  const turretLaserSpeed = 760;
  const turretLaserDamage = 24;
  const turretLaserKnockback = 210;
  const turretShootCooldown = 1.35;
  const turretRange = 820;
  const structurePlacementTierThreshold = 500;
  const structureSurfaceOffset = 18;
  const structurePlacementLeeway = 72;
  const defaultToolId = "suction-gadget";
  const techTypes = [
    { key: "suction", label: "Suction Tech", color: "#58e2ff" },
    { key: "weapon", label: "Weapon Tech", color: "#ff73ad" },
    { key: "plating", label: "Plating Tech", color: "#ffd166" },
    { key: "energy", label: "Energy Tech", color: "#9dff7a" },
    { key: "propulsion", label: "Propulsion Tech", color: "#a985ff" },
    { key: "shield", label: "Shield Tech", color: "#77a7ff" }
  ];
  const buildFilters = [
    { key: "all", label: "All" },
    { key: "tools", label: "Tools" },
    { key: "structures", label: "Structures" }
  ];
  const toolCatalog = [
    { id: defaultToolId, name: "Suction gadget", shortName: "Suction", color: "#58e2ff" },
    { id: "laser-pistol", name: "Laser pistol", shortName: "Laser", color: "#ff73ad" }
  ];
  const buildRecipes = [
    {
      id: "laser-pistol",
      name: "Laser pistol",
      category: "tools",
      description: "A compact sidearm that fires focused weapon-tech bolts.",
      cost: { weapon: 10 },
      unlockToolId: "laser-pistol",
      icon: "assets/laser-pistol.svg"
    },
    {
      id: "turret",
      name: "Turret",
      category: "structures",
      description: "A folding surface turret that guards its host body from nearby mobs.",
      cost: { plating: 3, weapon: 5 },
      structureType: "turret",
      icon: "assets/turret.svg"
    }
  ];
  const techInventory = {};
  const persistenceSaveInterval = 5;
  const persistencePollInterval = 15;
  const persistence = {
    enabled: Boolean(window.fetch),
    loadInFlight: false,
    saveInFlight: false,
    online: false,
    storage: "none",
    saveTimer: persistenceSaveInterval,
    pollTimer: persistencePollInterval
  };
  const bodyTiers = [
    { name: "particle", threshold: 0, article: "a", solid: false },
    { name: "rock", threshold: 10, article: "a", solid: false },
    { name: "boulder", threshold: 50, article: "a", solid: true },
    { name: "asteroid", threshold: 100, article: "an", solid: true },
    { name: "dwarf moon", threshold: 500, article: "a", solid: true },
    { name: "moon", threshold: 1000, article: "a", solid: true },
    { name: "planet", threshold: 5000, article: "a", solid: true }
  ];
  const funnelShape = {
    backX: 88,
    backHalf: 22,
    rimX: 134,
    rimHalf: 40,
    captureX: 111,
    wallThickness: 5
  };

  let width = 1;
  let height = 1;
  let dpr = 1;
  let cameraRoll = 0;
  let gadgetAngle = -0.32;
  let lastTime = performance.now();
  let spawnTimer = 0;
  let nextParticleId = 1;
  let nextRivalId = 1;
  let nextUfoId = 1;
  let nextRambotId = 1;
  let nextStructureId = 1;
  let jumpQueued = false;
  let buildMenuOpen = false;
  let mapVisible = false;
  let activePlacementRecipeId = null;
  let activeBuildFilter = "all";
  let unlockedToolIds = [defaultToolId];
  let equippedToolId = defaultToolId;
  let toolFireCooldown = 0;
  const mobSpawnTimers = {
    alienoid: mobSpawnIntervals.alienoid,
    ufo: mobSpawnIntervals.ufo,
    rambot: mobSpawnIntervals.rambot
  };

  for (const tech of techTypes) {
    techInventory[tech.key] = 0;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!mouse.seen) {
      mouse.x = width * 0.68;
      mouse.y = height * 0.43;
    }
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function length(x, y) {
    return Math.hypot(x, y);
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function rotatePoint(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      x: x * c - y * s,
      y: x * s + y * c
    };
  }

  function shortestAngleDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function mixColor(a, b, aw, bw) {
    const total = aw + bw;
    return {
      r: Math.round((a.r * aw + b.r * bw) / total),
      g: Math.round((a.g * aw + b.g * bw) / total),
      b: Math.round((a.b * aw + b.b * bw) / total)
    };
  }

  function colorString(color, alpha) {
    return "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + alpha + ")";
  }

  function shadeColor(color, amount) {
    return {
      r: clamp(Math.round(color.r + amount), 0, 255),
      g: clamp(Math.round(color.g + amount), 0, 255),
      b: clamp(Math.round(color.b + amount), 0, 255)
    };
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (hp >= 0 && hp < 1) {
      r1 = c;
      g1 = x;
    } else if (hp < 2) {
      r1 = x;
      g1 = c;
    } else if (hp < 3) {
      g1 = c;
      b1 = x;
    } else if (hp < 4) {
      g1 = x;
      b1 = c;
    } else if (hp < 5) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }

    const m = l - c / 2;
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function randomParticleColor() {
    const hue = randomRange(0, 360);
    return hslToRgb(hue, randomRange(0.74, 0.94), randomRange(0.52, 0.68));
  }

  function randomAlienColor() {
    const palettes = [
      { r: 99, g: 245, b: 153 },
      { r: 72, g: 224, b: 221 },
      { r: 176, g: 115, b: 255 },
      { r: 236, g: 255, b: 93 }
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  function tierForMass(mass) {
    let tier = bodyTiers[0];
    for (const candidate of bodyTiers) {
      if (mass >= candidate.threshold) {
        tier = candidate;
      }
    }
    return tier;
  }

  function nextTierAfter(tier) {
    const index = bodyTiers.indexOf(tier);
    return bodyTiers[index + 1] || null;
  }

  function radiusAtTier(tier) {
    const radii = {
      particle: 11,
      rock: 22,
      boulder: 36,
      asteroid: 52,
      "dwarf moon": 78,
      moon: 110,
      planet: 158
    };
    return radii[tier.name] || 11;
  }

  function radiusFromMass(mass) {
    const tier = tierForMass(mass);
    const nextTier = nextTierAfter(tier);

    if (!nextTier) {
      return radiusAtTier(tier) + Math.log2(Math.max(1, mass / tier.threshold)) * 22;
    }

    const startRadius = radiusAtTier(tier);
    const endRadius = radiusAtTier(nextTier) - 3;
    const progress = clamp((mass - tier.threshold) / (nextTier.threshold - tier.threshold), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 1.8);
    return startRadius + (endRadius - startRadius) * eased;
  }

  function maybeNotifyText(message) {
    const element = document.createElement("div");
    element.className = "notification";
    element.textContent = message;
    notifications.appendChild(element);

    window.setTimeout(function () {
      element.classList.add("is-leaving");
    }, 2200);

    window.setTimeout(function () {
      element.remove();
    }, 2600);
  }

  function maybeNotifyTier(tier, previousTier) {
    if (tier.name === "particle" || tier.threshold <= previousTier.threshold) {
      return;
    }

    maybeNotifyText("You have made " + tier.article + " " + tier.name + ".");
  }

  function createTechRow(tech, className) {
    const row = document.createElement("div");
    const dot = document.createElement("span");
    const name = document.createElement("span");
    const count = document.createElement("strong");

    row.className = className;
    row.dataset.techKey = tech.key;
    row.style.setProperty("--tech-color", tech.color);
    dot.className = "tech-row__dot";
    name.className = className + "__name";
    count.className = className + "__count";
    name.textContent = tech.label;
    count.textContent = "0";

    row.append(dot, name, count);
    return row;
  }

  function closestEventTarget(event, selector) {
    return event.target instanceof Element ? event.target.closest(selector) : null;
  }

  function techByKey(key) {
    return techTypes.find((tech) => tech.key === key) || null;
  }

  function toolById(id) {
    return toolCatalog.find((tool) => tool.id === id) || toolCatalog[0];
  }

  function recipeById(id) {
    return buildRecipes.find((recipe) => recipe.id === id) || null;
  }

  function equippedTool() {
    return toolById(equippedToolId);
  }

  function isSuctionEquipped() {
    return equippedToolId === defaultToolId;
  }

  function hasTool(toolId) {
    return unlockedToolIds.includes(toolId);
  }

  function filteredBuildRecipes() {
    if (activeBuildFilter === "all") {
      return buildRecipes;
    }
    return buildRecipes.filter((recipe) => recipe.category === activeBuildFilter);
  }

  function canAffordRecipe(recipe) {
    return Object.entries(recipe.cost).every(([techKey, amount]) => Math.floor(techInventory[techKey] || 0) >= amount);
  }

  function isRecipeUnlocked(recipe) {
    return recipe.unlockToolId ? hasTool(recipe.unlockToolId) : false;
  }

  function isStructureRecipe(recipe) {
    return recipe && recipe.category === "structures" && Boolean(recipe.structureType);
  }

  function formatRecipeCost(recipe) {
    return Object.entries(recipe.cost)
      .map(([techKey, amount]) => {
        const tech = techByKey(techKey);
        return amount + " " + (tech ? tech.label : techKey);
      })
      .join(", ");
  }

  function createBuildFilterTabs() {
    if (!buildMenuTabs) {
      return;
    }

    buildMenuTabs.textContent = "";
    for (const filter of buildFilters) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "build-menu__tab";
      tab.dataset.filter = filter.key;
      tab.setAttribute("role", "tab");
      tab.textContent = filter.label;
      buildMenuTabs.append(tab);
    }
  }

  function updateBuildFilterTabs() {
    if (!buildMenuTabs) {
      return;
    }

    for (const tab of buildMenuTabs.querySelectorAll(".build-menu__tab")) {
      const selected = tab.dataset.filter === activeBuildFilter;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    }
  }

  function renderBuildMenu() {
    if (!buildMenuList) {
      return;
    }

    updateBuildFilterTabs();
    buildMenuList.textContent = "";

    const recipes = filteredBuildRecipes();
    if (!recipes.length) {
      const empty = document.createElement("div");
      empty.className = "build-menu__empty";
      empty.textContent = activeBuildFilter === "structures" ? "No structures available yet." : "No blueprints available yet.";
      buildMenuList.append(empty);
    }

    for (const recipe of recipes) {
      const card = document.createElement("button");
      const iconFrame = document.createElement("span");
      const icon = document.createElement("img");
      const category = document.createElement("span");
      const title = document.createElement("strong");
      const description = document.createElement("span");
      const footer = document.createElement("span");
      const cost = document.createElement("span");
      const action = document.createElement("span");
      const unlocked = isRecipeUnlocked(recipe);
      const affordable = canAffordRecipe(recipe);

      card.type = "button";
      card.className = "build-card";
      card.dataset.recipeId = recipe.id;
      card.disabled = !unlocked && !affordable;
      card.classList.toggle("is-unlocked", unlocked);
      card.classList.toggle("is-locked", !unlocked && !affordable);

      iconFrame.className = "build-card__icon";
      category.className = "build-card__category";
      title.className = "build-card__title";
      description.className = "build-card__description";
      footer.className = "build-card__footer";
      cost.className = "build-card__cost";
      action.className = "build-card__action";

      icon.src = recipe.icon || "";
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      category.textContent = recipe.category === "tools" ? "Tool" : "Structure";
      title.textContent = recipe.name;
      description.textContent = recipe.description;
      cost.textContent = formatRecipeCost(recipe);
      if (unlocked) {
        action.textContent = recipe.unlockToolId === equippedToolId ? "Equipped" : "Equip";
      } else if (isStructureRecipe(recipe)) {
        action.textContent = affordable ? "Place" : "Needs tech";
      } else {
        action.textContent = affordable ? "Craft" : "Needs tech";
      }

      iconFrame.append(icon);
      footer.append(cost, action);
      card.append(iconFrame, category, title, description, footer);
      buildMenuList.append(card);
    }

    if (buildMenuStatus) {
      const shown = recipes.length;
      const total = buildRecipes.length;
      buildMenuStatus.textContent = shown + "/" + total + " Blueprints";
    }
  }

  function updateToolHotbar() {
    if (!toolHotbar) {
      return;
    }

    toolHotbar.textContent = "";
    toolHotbar.classList.toggle("is-visible", unlockedToolIds.length > 1);

    unlockedToolIds.forEach((toolId, index) => {
      const tool = toolById(toolId);
      const slot = document.createElement("button");
      const key = document.createElement("span");
      const name = document.createElement("strong");

      slot.type = "button";
      slot.className = "tool-slot";
      slot.dataset.toolId = tool.id;
      slot.classList.toggle("is-equipped", tool.id === equippedToolId);
      slot.style.setProperty("--tool-color", tool.color);
      key.className = "tool-slot__key";
      name.className = "tool-slot__name";
      key.textContent = (index + 1).toString();
      name.textContent = tool.shortName;

      slot.append(key, name);
      toolHotbar.append(slot);
    });
  }

  function selectTool(toolId) {
    if (!hasTool(toolId)) {
      return;
    }

    equippedToolId = toolId;
    toolFireCooldown = Math.min(toolFireCooldown, playerLaserCooldown);
    updateToolHotbar();
    renderBuildMenu();
  }

  function cycleTool(direction) {
    if (unlockedToolIds.length < 2) {
      return;
    }

    const currentIndex = Math.max(0, unlockedToolIds.indexOf(equippedToolId));
    const nextIndex = (currentIndex + direction + unlockedToolIds.length) % unlockedToolIds.length;
    selectTool(unlockedToolIds[nextIndex]);
  }

  function unlockTool(toolId) {
    if (!hasTool(toolId)) {
      unlockedToolIds.push(toolId);
    }
    selectTool(toolId);
  }

  function spendRecipeCost(recipe) {
    for (const [techKey, amount] of Object.entries(recipe.cost)) {
      techInventory[techKey] = Math.max(0, Math.floor(techInventory[techKey] || 0) - amount);
    }
  }

  function startStructurePlacement(recipeId) {
    const recipe = recipeById(recipeId);
    if (!isStructureRecipe(recipe) || !canAffordRecipe(recipe)) {
      return;
    }

    activePlacementRecipeId = recipe.id;
    setBuildMenuOpen(false);
    mouse.left = false;
    mouse.right = false;
    maybeNotifyText("Choose a dwarf moon, moon, or planet surface for the " + recipe.name.toLowerCase() + ".");
  }

  function cancelStructurePlacement() {
    if (!activePlacementRecipeId) {
      return;
    }

    activePlacementRecipeId = null;
    mouse.left = false;
    mouse.right = false;
  }

  function craftRecipe(recipeId) {
    const recipe = buildRecipes.find((candidate) => candidate.id === recipeId);
    if (!recipe) {
      return;
    }

    if (isRecipeUnlocked(recipe)) {
      if (recipe.unlockToolId) {
        selectTool(recipe.unlockToolId);
      }
      return;
    }

    if (!canAffordRecipe(recipe)) {
      return;
    }

    if (isStructureRecipe(recipe)) {
      startStructurePlacement(recipe.id);
      return;
    }

    spendRecipeCost(recipe);

    if (recipe.unlockToolId) {
      unlockTool(recipe.unlockToolId);
    }

    updateTechUi();
    maybeNotifyText(recipe.name + " crafted.");
  }

  function initializeTechUi() {
    if (!techLedgerList || !buildMenuList) {
      return;
    }

    techLedgerList.textContent = "";
    if (buildMenuTech) {
      buildMenuTech.textContent = "";
    }

    for (const tech of techTypes) {
      techLedgerList.append(createTechRow(tech, "tech-row"));
      if (buildMenuTech) {
        buildMenuTech.append(createTechRow(tech, "build-row"));
      }
    }

    createBuildFilterTabs();
    updateTechUi();
    updateToolHotbar();
  }

  function updateTechUi() {
    if (!techLedgerList) {
      return;
    }

    for (const tech of techTypes) {
      const value = Math.floor(techInventory[tech.key] || 0).toString();
      const ledgerCount = techLedgerList.querySelector('[data-tech-key="' + tech.key + '"] .' + "tech-row__count");

      if (ledgerCount) {
        ledgerCount.textContent = value;
      }

      if (buildMenuTech) {
        const buildCount = buildMenuTech.querySelector('[data-tech-key="' + tech.key + '"] .' + "build-row__count");
        if (buildCount) {
          buildCount.textContent = value;
        }
      }
    }

    renderBuildMenu();
  }

  function setBuildMenuOpen(open) {
    buildMenuOpen = Boolean(open);
    if (buildMenuOpen) {
      cancelStructurePlacement();
      mouse.left = false;
      mouse.right = false;
    }
    if (!buildMenu) {
      return;
    }

    buildMenu.classList.toggle("is-open", buildMenuOpen);
    buildMenu.setAttribute("aria-hidden", buildMenuOpen ? "false" : "true");
  }

  function updateMapToggle() {
    if (!mapToggle) {
      return;
    }

    mapToggle.classList.toggle("is-active", mapVisible);
    mapToggle.setAttribute("aria-pressed", mapVisible ? "true" : "false");
  }

  function setMapVisible(visible) {
    mapVisible = Boolean(visible);
    updateMapToggle();
  }

  function serializeTechInventory() {
    const snapshot = {};
    for (const tech of techTypes) {
      snapshot[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0));
    }
    return snapshot;
  }

  function serializeToolInventory() {
    return unlockedToolIds.filter((toolId, index) => toolCatalog.some((tool) => tool.id === toolId) && unlockedToolIds.indexOf(toolId) === index);
  }

  function applyToolInventory(tools, equipped) {
    const validTools = Array.isArray(tools)
      ? tools.filter((toolId, index) => toolCatalog.some((tool) => tool.id === toolId) && tools.indexOf(toolId) === index)
      : [];

    unlockedToolIds = validTools.includes(defaultToolId) ? validTools : [defaultToolId].concat(validTools);
    equippedToolId = unlockedToolIds.includes(equipped) ? equipped : unlockedToolIds[0];
    updateToolHotbar();
    renderBuildMenu();
  }

  function applyTechInventory(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const tech of techTypes) {
      techInventory[tech.key] = Math.max(0, Math.floor(finiteOr(snapshot[tech.key], techInventory[tech.key] || 0)));
    }
    updateTechUi();
  }

  function initializeNetworkIdentity() {
    const storageKey = "spaice.playerId";
    const nameKey = "spaice.playerName";
    let playerId = "";

    try {
      playerId = localStorage.getItem(storageKey) || "";

      if (!playerId) {
        playerId = "player-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        localStorage.setItem(storageKey, playerId);
      }
    } catch {
      playerId = "player-" + Math.random().toString(36).slice(2, 10);
    }

    const fallbackName = "Player " + playerId.slice(-4).toUpperCase();
    let playerName = fallbackName;

    try {
      playerName = localStorage.getItem(nameKey) || fallbackName;
      localStorage.setItem(nameKey, playerName);
    } catch {
      playerName = fallbackName;
    }

    player.id = playerId;
    player.name = playerName;
    document.body.dataset.playerId = playerId;
  }

  async function loadPersistentState() {
    if (!persistence.enabled || persistence.loadInFlight) {
      return;
    }

    persistence.loadInFlight = true;

    try {
      const data = await fetchPersistentJson("/api/world/state?playerId=" + encodeURIComponent(player.id));
      applyPersistentPayload(data, { includePlayer: true });
      persistence.online = true;
      persistence.storage = data.storage || "database";
    } catch (error) {
      persistence.online = false;
      persistence.storage = "none";
      console.warn("SpAice persistence unavailable.", error);
    } finally {
      persistence.loadInFlight = false;
    }
  }

  async function pollPersistentState() {
    if (!persistence.enabled || persistence.loadInFlight || persistence.saveInFlight) {
      return;
    }

    persistence.loadInFlight = true;

    try {
      const data = await fetchPersistentJson("/api/world/state?playerId=" + encodeURIComponent(player.id));
      persistence.online = true;
      persistence.storage = data.storage || persistence.storage;
    } catch {
      persistence.online = false;
    } finally {
      persistence.loadInFlight = false;
    }
  }

  async function savePersistentState(options) {
    if (!persistence.enabled || persistence.saveInFlight) {
      return;
    }

    persistence.saveInFlight = true;

    try {
      const includeWorld = !options || options.includeWorld !== false;
      const data = await fetchPersistentJson("/api/world/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersistentPayload(includeWorld))
      });
      persistence.online = true;
      persistence.storage = data.storage || persistence.storage;
    } catch {
      persistence.online = false;
    } finally {
      persistence.saveInFlight = false;
    }
  }

  async function fetchPersistentJson(url, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, 2500);

    try {
      const response = await fetch(url, Object.assign({}, options, { signal: controller.signal }));

      if (!response.ok) {
        throw new Error("Persistence request failed: " + response.status);
      }

      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function updatePersistence(dt) {
    if (!persistence.enabled) {
      return;
    }

    persistence.saveTimer -= dt;
    persistence.pollTimer -= dt;

    if (persistence.saveTimer <= 0 && !persistence.saveInFlight) {
      persistence.saveTimer = persistenceSaveInterval;
      void savePersistentState({ includeWorld: true });
    }

    if (document.visibilityState === "hidden" && persistence.pollTimer <= 0 && !persistence.loadInFlight && !persistence.saveInFlight) {
      persistence.pollTimer = persistencePollInterval;
      void pollPersistentState();
    }
  }

  function buildPersistentPayload(includeWorld) {
    const payload = {
      playerId: player.id,
      player: {
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        radius: player.radius,
        health: player.health,
        maxHealth: player.maxHealth,
        tech: serializeTechInventory(),
        tools: serializeToolInventory(),
        equippedTool: equippedToolId,
        landed: player.landed,
        cameraRoll
      }
    };

    if (includeWorld) {
      payload.world = {
        elapsed: performance.now() / 1000,
        particles: particles.map(serializeParticle),
        alienoids: rivals.map(serializeRival),
        ufos: ufos.map(serializeUfo),
        rambots: rambots.map(serializeRambot),
        structures: structures.map(serializeStructure),
        rivalProjectiles: rivalProjectiles.map(serializeProjectile),
        starDust: starDust.map(serializeStar),
        nextParticleId,
        nextAlienoidId: nextRivalId,
        nextUfoId,
        nextRambotId,
        nextStructureId,
        mobSpawnTimers: { ...mobSpawnTimers }
      };
    }

    return payload;
  }

  function applyPersistentPayload(data, options) {
    if (!data || !data.ok) {
      return;
    }

    if (data.world) {
      applyWorldSnapshot(data.world);
    }

    if (options && options.includePlayer && data.player) {
      applyPlayerSnapshot(data.player);
    }
  }

  function applyWorldSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    if (Array.isArray(snapshot.starDust) && snapshot.starDust.length) {
      starDust.length = 0;
      starDust.push(...snapshot.starDust.map(normalizeStarSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.particles) && snapshot.particles.length) {
      particles.length = 0;
      particles.push(...snapshot.particles.map(normalizeParticleSnapshot).filter(Boolean));
    }

    const alienoidSnapshots = Array.isArray(snapshot.alienoids) ? snapshot.alienoids : snapshot.rivals;
    if (Array.isArray(alienoidSnapshots)) {
      rivals.length = 0;
      rivals.push(...alienoidSnapshots.map(normalizeRivalSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.ufos)) {
      ufos.length = 0;
      ufos.push(...snapshot.ufos.map(normalizeUfoSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.rambots)) {
      rambots.length = 0;
      rambots.push(...snapshot.rambots.map(normalizeRambotSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.structures)) {
      structures.length = 0;
      structures.push(...snapshot.structures.map(normalizeStructureSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.rivalProjectiles)) {
      rivalProjectiles.length = 0;
      rivalProjectiles.push(...snapshot.rivalProjectiles.map(normalizeProjectileSnapshot).filter(Boolean));
    }

    nextParticleId = Math.max(
      Number(snapshot.nextParticleId) || 1,
      particles.reduce((largest, particle) => Math.max(largest, particle.id + 1), 1)
    );
    nextRivalId = Math.max(
      Number(snapshot.nextAlienoidId) || Number(snapshot.nextRivalId) || 1,
      rivals.reduce((largest, rival) => Math.max(largest, rival.id + 1), 1)
    );
    nextUfoId = Math.max(
      Number(snapshot.nextUfoId) || 1,
      ufos.reduce((largest, ufo) => Math.max(largest, ufo.id + 1), 1)
    );
    nextRambotId = Math.max(
      Number(snapshot.nextRambotId) || 1,
      rambots.reduce((largest, rambot) => Math.max(largest, rambot.id + 1), 1)
    );
    nextStructureId = Math.max(
      Number(snapshot.nextStructureId) || 1,
      structures.reduce((largest, structure) => Math.max(largest, structure.id + 1), 1)
    );

    applyMobSpawnTimers(snapshot.mobSpawnTimers);
  }

  function applyPlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    player.x = finiteOr(snapshot.x, player.x);
    player.y = finiteOr(snapshot.y, player.y);
    player.vx = finiteOr(snapshot.vx, 0);
    player.vy = finiteOr(snapshot.vy, 0);
    player.radius = finiteOr(snapshot.radius, player.radius);
    player.health = clamp(finiteOr(snapshot.health, player.health), 0, player.maxHealth);
    player.maxHealth = clamp(finiteOr(snapshot.maxHealth, player.maxHealth), 1, 100);
    applyTechInventory(snapshot.tech);
    applyToolInventory(snapshot.tools, snapshot.equippedTool);
    player.landed = normalizeLandingSnapshot(snapshot.landed);
    cameraRoll = finiteOr(snapshot.cameraRoll, cameraRoll);
  }

  function serializeParticle(particle) {
    return {
      id: particle.id,
      x: particle.x,
      y: particle.y,
      vx: particle.vx,
      vy: particle.vy,
      mass: particle.mass,
      radius: particle.radius,
      color: particle.color,
      textureSeed: particle.textureSeed,
      wobble: particle.wobble,
      pulse: particle.pulse
    };
  }

  function serializeRival(rival) {
    return {
      id: rival.id,
      x: rival.x,
      y: rival.y,
      vx: rival.vx,
      vy: rival.vy,
      radius: rival.radius,
      health: rival.health,
      maxHealth: rival.maxHealth,
      color: rival.color,
      flash: rival.flash,
      hitCooldown: rival.hitCooldown,
      landed: rival.landed,
      residentTier: rival.residentTier,
      shootCooldown: rival.shootCooldown,
      strafeSign: rival.strafeSign,
      rotation: rival.rotation,
      wobble: rival.wobble
    };
  }

  function serializeUfo(ufo) {
    return {
      id: ufo.id,
      x: ufo.x,
      y: ufo.y,
      vx: ufo.vx,
      vy: ufo.vy,
      radius: ufo.radius,
      health: ufo.health,
      maxHealth: ufo.maxHealth,
      color: ufo.color,
      flash: ufo.flash,
      hitCooldown: ufo.hitCooldown,
      strafeSign: ufo.strafeSign,
      rotation: ufo.rotation,
      beamAngle: ufo.beamAngle,
      beamPulse: ufo.beamPulse,
      wobble: ufo.wobble
    };
  }

  function serializeRambot(rambot) {
    return {
      id: rambot.id,
      x: rambot.x,
      y: rambot.y,
      vx: rambot.vx,
      vy: rambot.vy,
      radius: rambot.radius,
      health: rambot.health,
      maxHealth: rambot.maxHealth,
      color: rambot.color,
      flash: rambot.flash,
      hitCooldown: rambot.hitCooldown,
      strafeSign: rambot.strafeSign,
      rotation: rambot.rotation,
      chargeCooldown: rambot.chargeCooldown,
      chargeTimer: rambot.chargeTimer,
      recoverTimer: rambot.recoverTimer,
      chargeDirX: rambot.chargeDirX,
      chargeDirY: rambot.chargeDirY,
      impactCooldown: rambot.impactCooldown,
      wobble: rambot.wobble
    };
  }

  function serializeProjectile(projectile) {
    return {
      x: projectile.x,
      y: projectile.y,
      vx: projectile.vx,
      vy: projectile.vy,
      radius: projectile.radius,
      length: projectile.length,
      color: projectile.color,
      life: projectile.life,
      maxLife: projectile.maxLife
    };
  }

  function serializeStructure(structure) {
    return {
      id: structure.id,
      type: structure.type,
      bodyId: structure.bodyId,
      angle: structure.angle,
      x: structure.x,
      y: structure.y,
      aimAngle: structure.aimAngle,
      deploy: structure.deploy,
      shootCooldown: structure.shootCooldown,
      wobble: structure.wobble
    };
  }

  function serializeStar(star) {
    return {
      x: star.x,
      y: star.y,
      r: star.r,
      a: star.a
    };
  }

  function normalizeParticleSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const mass = Math.max(1, finiteOr(snapshot.mass, 1));
    const tier = tierForMass(mass);
    const fallbackId = nextParticleId;
    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      mass,
      radius: radiusFromMass(mass),
      tier,
      textureSeed: finiteOr(snapshot.textureSeed, Math.random() * 1000),
      color: normalizeColorSnapshot(snapshot.color, randomParticleColor()),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      pulse: finiteOr(snapshot.pulse, randomRange(0.8, 1.25))
    };
  }

  function normalizeRivalSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallback = randomAlienColor();
    const fallbackId = nextRivalId;
    return {
      kind: "alienoid",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 28),
      health: clamp(finiteOr(snapshot.health, 100), 0, 100),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, 100), 1, 100),
      color: normalizeColorSnapshot(snapshot.color, fallback),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      landed: normalizeLandingSnapshot(snapshot.landed),
      residentTier: typeof snapshot.residentTier === "string" ? snapshot.residentTier : null,
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(0.8, 2.1)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeUfoSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextUfoId;
    return {
      kind: "ufo",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 34),
      health: clamp(finiteOr(snapshot.health, 130), 0, 130),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, 130), 1, 130),
      color: normalizeColorSnapshot(snapshot.color, { r: 112, g: 226, b: 255 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      beamAngle: finiteOr(snapshot.beamAngle, Math.PI / 2),
      beamPulse: finiteOr(snapshot.beamPulse, randomRange(0, Math.PI * 2)),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeRambotSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextRambotId;
    return {
      kind: "rambot",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 38),
      health: clamp(finiteOr(snapshot.health, 210), 0, 210),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, 210), 1, 210),
      color: normalizeColorSnapshot(snapshot.color, { r: 184, g: 196, b: 204 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      chargeCooldown: finiteOr(snapshot.chargeCooldown, randomRange(1.1, 2.4)),
      chargeTimer: finiteOr(snapshot.chargeTimer, 0),
      recoverTimer: finiteOr(snapshot.recoverTimer, 0),
      chargeDirX: finiteOr(snapshot.chargeDirX, 1),
      chargeDirY: finiteOr(snapshot.chargeDirY, 0),
      impactCooldown: finiteOr(snapshot.impactCooldown, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeStructureSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const type = snapshot.type === "turret" ? "turret" : null;
    if (!type) {
      return null;
    }

    const angle = finiteOr(snapshot.angle, 0);
    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextStructureId))),
      type,
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      angle,
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      aimAngle: finiteOr(snapshot.aimAngle, angle),
      deploy: clamp(finiteOr(snapshot.deploy, 0), 0, 1),
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(0.2, 0.8)),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function applyMobSpawnTimers(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const key of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[key] = clamp(finiteOr(snapshot[key], mobSpawnTimers[key]), 0, mobSpawnIntervals[key]);
    }
  }

  function normalizeProjectileSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 5),
      length: finiteOr(snapshot.length, 40),
      color: normalizeColorSnapshot(snapshot.color, { r: 114, g: 244, b: 255 }),
      life: finiteOr(snapshot.life, 1),
      maxLife: finiteOr(snapshot.maxLife, 2.2)
    };
  }

  function normalizeStarSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      r: finiteOr(snapshot.r, 1),
      a: clamp(finiteOr(snapshot.a, 0.4), 0, 1)
    };
  }

  function normalizeColorSnapshot(snapshot, fallback) {
    if (!snapshot || typeof snapshot !== "object") {
      return fallback;
    }

    return {
      r: clamp(Math.round(finiteOr(snapshot.r, fallback.r)), 0, 255),
      g: clamp(Math.round(finiteOr(snapshot.g, fallback.g)), 0, 255),
      b: clamp(Math.round(finiteOr(snapshot.b, fallback.b)), 0, 255)
    };
  }

  function normalizeLandingSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      angle: finiteOr(snapshot.angle, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0)
    };
  }

  function finiteOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function createParticle(x, y, mass, color) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(5, 36);
    const tier = tierForMass(mass);
    return {
      id: nextParticleId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      mass,
      radius: radiusFromMass(mass),
      tier,
      textureSeed: Math.random() * 1000,
      color,
      wobble: randomRange(0, Math.PI * 2),
      pulse: randomRange(0.8, 1.25)
    };
  }

  function spawnParticleNearPlayer() {
    const angle = randomRange(0, Math.PI * 2);
    const minDist = Math.min(width, height) * 0.38 + 150;
    const maxDist = Math.max(width, height) * 0.74 + 420;
    const dist = randomRange(minDist, maxDist);
    const drift = rotatePoint(randomRange(-44, 44), randomRange(-44, 44), angle + Math.PI / 2);
    const particle = createParticle(
      player.x + Math.cos(angle) * dist + drift.x,
      player.y + Math.sin(angle) * dist + drift.y,
      1,
      randomParticleColor()
    );
    particle.vx += -Math.cos(angle) * randomRange(6, 26);
    particle.vy += -Math.sin(angle) * randomRange(6, 26);
    particles.push(particle);
  }

  function seedParticles() {
    particles.length = 0;
    for (let i = 0; i < targetParticles; i += 1) {
      spawnParticleNearPlayer();
    }
  }

  function createRival(x, y) {
    const color = randomAlienColor();
    return {
      kind: "alienoid",
      id: nextRivalId++,
      x,
      y,
      vx: randomRange(-18, 18),
      vy: randomRange(-18, 18),
      radius: 28,
      health: 100,
      maxHealth: 100,
      color,
      flash: 0,
      hitCooldown: 0,
      landed: null,
      residentTier: null,
      shootCooldown: randomRange(0.8, 2.1),
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createUfo(x, y) {
    return {
      kind: "ufo",
      id: nextUfoId++,
      x,
      y,
      vx: randomRange(-24, 24),
      vy: randomRange(-24, 24),
      radius: 34,
      health: 130,
      maxHealth: 130,
      color: { r: 112, g: 226, b: 255 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      beamAngle: Math.PI / 2,
      beamPulse: randomRange(0, Math.PI * 2),
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createRambot(x, y) {
    return {
      kind: "rambot",
      id: nextRambotId++,
      x,
      y,
      vx: randomRange(-10, 10),
      vy: randomRange(-10, 10),
      radius: 38,
      health: 210,
      maxHealth: 210,
      color: { r: 184, g: 196, b: 204 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      chargeCooldown: randomRange(1.2, 2.6),
      chargeTimer: 0,
      recoverTimer: 0,
      chargeDirX: 1,
      chargeDirY: 0,
      impactCooldown: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createHealthPickup(x, y, vx, vy) {
    const angle = randomRange(0, Math.PI * 2);
    const burst = randomRange(70, 145);
    return {
      x,
      y,
      vx: vx * 0.18 + Math.cos(angle) * burst,
      vy: vy * 0.18 + Math.sin(angle) * burst,
      radius: 14,
      heal: healthPickupHeal,
      life: healthPickupLifetime,
      maxLife: healthPickupLifetime,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createTechPickup(techKey, x, y, vx, vy) {
    const tech = techTypes.find((candidate) => candidate.key === techKey) || techTypes[0];
    const angle = randomRange(0, Math.PI * 2);
    const burst = randomRange(60, 132);
    return {
      key: tech.key,
      label: tech.label,
      color: tech.color,
      x,
      y,
      vx: vx * 0.14 + Math.cos(angle) * burst,
      vy: vy * 0.14 + Math.sin(angle) * burst,
      radius: 15,
      life: techPickupLifetime,
      maxLife: techPickupLifetime,
      rotation: randomRange(0, Math.PI * 2),
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function dropHealthPickups(rival) {
    if (player.health >= player.maxHealth) {
      return;
    }

    const count = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i += 1) {
      healthPickups.push(createHealthPickup(rival.x, rival.y, rival.vx, rival.vy));
    }
  }

  function mobName(mob) {
    if (mob.kind === "ufo") {
      return "UFO";
    }
    if (mob.kind === "rambot") {
      return "Rambot";
    }
    return "Alienoid";
  }

  function dropMobTech(mob) {
    let techKey = "weapon";
    if (mob.kind === "ufo") {
      techKey = "suction";
    } else if (mob.kind === "rambot") {
      techKey = "plating";
    }

    techPickups.push(createTechPickup(techKey, mob.x, mob.y, mob.vx, mob.vy));
  }

  function damageMob(mob, damage, color, message) {
    if (mob.health <= 0) {
      return false;
    }

    mob.health = Math.max(0, mob.health - damage);
    mob.flash = 0.28;
    mob.hitCooldown = 0.42;

    if (color) {
      sparks.push({
        x: mob.x,
        y: mob.y,
        radius: mob.radius * 2,
        color,
        life: 0.34,
        maxLife: 0.34
      });
    }

    if (mob.health <= 0) {
      dropHealthPickups(mob);
      dropMobTech(mob);
      maybeNotifyText(message || mobName(mob) + " knocked out.");
      return true;
    }

    return false;
  }

  function knockMob(mob, nx, ny, force) {
    if (mob.landed) {
      mob.landed = null;
      mob.residentTier = null;
    }

    mob.vx += nx * force;
    mob.vy += ny * force;

    if (mob.kind === "rambot") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.28);
      mob.chargeTimer = Math.max(0, (mob.chargeTimer || 0) - 0.22);
    }
  }

  function attachRivalToBody(rival, body, residentTier) {
    rival.landed = {
      bodyId: body.id,
      angle: randomRange(0, Math.PI * 2),
      walkSpeed: randomRange(-18, 18)
    };
    rival.residentTier = residentTier || body.tier.name;
    rival.health = rival.maxHealth;
    rival.flash = Math.max(rival.flash, 0.12);
    applyRivalSurfaceConstraint(rival);
  }

  function spawnAlienoidNearPlayer() {
    const spawn = randomOffscreenPoint(110, 360);
    rivals.push(createRival(spawn.x, spawn.y));
  }

  function spawnUfoNearPlayer() {
    const spawn = randomOffscreenPoint(180, 520);
    ufos.push(createUfo(spawn.x, spawn.y));
  }

  function spawnRambotNearPlayer() {
    const spawn = randomOffscreenPoint(220, 620);
    rambots.push(createRambot(spawn.x, spawn.y));
  }

  function spawnMobByKind(kind) {
    if (kind === "ufo") {
      spawnUfoNearPlayer();
      return;
    }
    if (kind === "rambot") {
      spawnRambotNearPlayer();
      return;
    }
    spawnAlienoidNearPlayer();
  }

  function updateMobSpawns(dt) {
    for (const kind of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[kind] -= dt;
      while (mobSpawnTimers[kind] <= 0) {
        spawnMobByKind(kind);
        mobSpawnTimers[kind] += mobSpawnIntervals[kind];
      }
    }
  }

  function seedStarDust() {
    starDust.length = 0;
    for (let i = 0; i < 180; i += 1) {
      starDust.push({
        x: randomRange(-3600, 3600),
        y: randomRange(-3600, 3600),
        r: randomRange(0.5, 1.8),
        a: randomRange(0.18, 0.68)
      });
    }
  }

  function cameraLocalToWorld(x, y) {
    return rotatePoint(x, y, -cameraRoll);
  }

  function worldToScreen(x, y) {
    const local = rotatePoint(x - player.x, y - player.y, cameraRoll);
    return {
      x: width / 2 + local.x,
      y: height / 2 + local.y
    };
  }

  function screenToWorld(x, y) {
    const local = cameraLocalToWorld(x - width / 2, y - height / 2);
    return {
      x: player.x + local.x,
      y: player.y + local.y
    };
  }

  function randomOffscreenPoint(margin, spread) {
    const side = Math.floor(Math.random() * 4);
    const halfW = width / 2;
    const halfH = height / 2;
    let localX = randomRange(-halfW - spread, halfW + spread);
    let localY = randomRange(-halfH - spread, halfH + spread);

    if (side === 0) {
      localY = -halfH - margin - randomRange(0, spread);
    } else if (side === 1) {
      localX = halfW + margin + randomRange(0, spread);
    } else if (side === 2) {
      localY = halfH + margin + randomRange(0, spread);
    } else {
      localX = -halfW - margin - randomRange(0, spread);
    }

    const world = cameraLocalToWorld(localX, localY);
    return {
      x: player.x + world.x,
      y: player.y + world.y
    };
  }

  function getCursorAimAngle() {
    const fromCenterX = mouse.x - width / 2;
    const fromCenterY = mouse.y - height / 2;
    return Math.atan2(fromCenterY || -0.35, fromCenterX || 1);
  }

  function updateGadgetAim(dt) {
    const targetAngle = getCursorAimAngle();
    const delta = shortestAngleDelta(gadgetAngle, targetAngle);
    const maxTurn = 4.4 * dt;
    gadgetAngle += clamp(delta, -maxTurn, maxTurn);
  }

  function getAim() {
    const local = {
      x: Math.cos(gadgetAngle),
      y: Math.sin(gadgetAngle)
    };
    const world = cameraLocalToWorld(local.x, local.y);
    return {
      local,
      world,
      angle: gadgetAngle
    };
  }

  function getFunnel(aim) {
    const reach = funnelShape.captureX;
    return {
      x: player.x + aim.world.x * reach,
      y: player.y + aim.world.y * reach,
      mouthX: player.x + aim.world.x * funnelShape.rimX,
      mouthY: player.y + aim.world.y * funnelShape.rimX,
      radius: funnelShape.rimHalf,
      reach,
      mouthReach: funnelShape.rimX
    };
  }

  function funnelHalfAt(localX) {
    const t = clamp((localX - funnelShape.backX) / (funnelShape.rimX - funnelShape.backX), 0, 1);
    return funnelShape.backHalf + (funnelShape.rimHalf - funnelShape.backHalf) * t;
  }

  function bodyById(id) {
    for (const particle of particles) {
      if (particle.id === id) {
        return particle;
      }
    }
    return null;
  }

  function isLandableBody(particle) {
    return particle.tier.threshold >= 100;
  }

  function isStructureHostBody(particle) {
    return particle && particle.tier.threshold >= structurePlacementTierThreshold;
  }

  function isMappedBody(particle) {
    return particle.tier.threshold >= mappedBodyThreshold;
  }

  function surfaceDistanceToPlayer(particle) {
    return Math.max(0, Math.hypot(player.x - particle.x, player.y - particle.y) - particle.radius);
  }

  function findNearestProgressBody() {
    if (player.landed) {
      const landedBody = bodyById(player.landed.bodyId);
      if (landedBody) {
        return landedBody;
      }
    }

    let nearest = null;
    let nearestDistance = Infinity;

    for (const particle of particles) {
      const distance = surfaceDistanceToPlayer(particle);
      if (distance < nearestDistance) {
        nearest = particle;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function findNearestLandableBody() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const particle of particles) {
      if (!isLandableBody(particle)) {
        continue;
      }

      const dx = player.x - particle.x;
      const dy = player.y - particle.y;
      const distance = Math.hypot(dx, dy);
      const landingRange = particle.radius + playerFootOffset + 90;

      if (distance < landingRange && distance < nearestDistance) {
        nearest = particle;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function findStructurePlacementAt(worldX, worldY) {
    let best = null;
    let bestScore = Infinity;

    for (const body of particles) {
      if (!isStructureHostBody(body)) {
        continue;
      }

      const dx = worldX - body.x;
      const dy = worldY - body.y;
      const dist = Math.hypot(dx, dy) || 1;
      const surfaceDelta = Math.abs(dist - body.radius);
      if (surfaceDelta > structurePlacementLeeway) {
        continue;
      }

      const angle = Math.atan2(dy, dx);
      const x = body.x + Math.cos(angle) * (body.radius + structureSurfaceOffset);
      const y = body.y + Math.sin(angle) * (body.radius + structureSurfaceOffset);
      const screen = worldToScreen(x, y);
      const screenDistance = Math.hypot(mouse.x - screen.x, mouse.y - screen.y);
      const score = surfaceDelta + screenDistance * 0.08;

      if (score < bestScore) {
        bestScore = score;
        best = {
          valid: true,
          body,
          bodyId: body.id,
          angle,
          x,
          y
        };
      }
    }

    if (best) {
      return best;
    }

    return {
      valid: false,
      body: null,
      bodyId: null,
      angle: Math.atan2(worldY - player.y, worldX - player.x),
      x: worldX,
      y: worldY
    };
  }

  function currentStructurePlacement() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    return findStructurePlacementAt(cursor.x, cursor.y);
  }

  function createStructure(recipe, placement) {
    return {
      id: nextStructureId++,
      type: recipe.structureType,
      bodyId: placement.bodyId,
      angle: placement.angle,
      x: placement.x,
      y: placement.y,
      aimAngle: placement.angle,
      deploy: 0,
      shootCooldown: randomRange(0.2, 0.8),
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function applyStructureSurfaceConstraint(structure) {
    const body = bodyById(structure.bodyId);
    if (!isStructureHostBody(body)) {
      return false;
    }

    structure.x = body.x + Math.cos(structure.angle) * (body.radius + structureSurfaceOffset);
    structure.y = body.y + Math.sin(structure.angle) * (body.radius + structureSurfaceOffset);
    return true;
  }

  function confirmStructurePlacement() {
    const recipe = recipeById(activePlacementRecipeId);
    if (!isStructureRecipe(recipe)) {
      cancelStructurePlacement();
      return false;
    }

    if (!canAffordRecipe(recipe)) {
      maybeNotifyText("Not enough tech for " + recipe.name + ".");
      cancelStructurePlacement();
      updateTechUi();
      return false;
    }

    const placement = currentStructurePlacement();
    if (!placement.valid) {
      maybeNotifyText("Structures need a dwarf moon, moon, or planet surface.");
      return false;
    }

    spendRecipeCost(recipe);
    structures.push(createStructure(recipe, placement));
    activePlacementRecipeId = null;
    updateTechUi();
    maybeNotifyText(recipe.name + " placed.");
    return true;
  }

  function findResidentBodyForTier(tierName) {
    let best = null;
    let bestDistance = Infinity;

    for (const particle of particles) {
      if (!isLandableBody(particle) || particle.tier.name !== tierName) {
        continue;
      }

      const distance = Math.hypot(player.x - particle.x, player.y - particle.y);
      if (distance < bestDistance) {
        best = particle;
        bestDistance = distance;
      }
    }

    return best;
  }

  function hasResidentRivalForTier(tierName) {
    for (const rival of rivals) {
      if (rival.health <= 0 || !rival.landed || rival.residentTier !== tierName) {
        continue;
      }

      const body = bodyById(rival.landed.bodyId);
      if (body && isLandableBody(body) && body.tier.name === tierName) {
        return true;
      }
    }

    return false;
  }

  function findAvailableRivalForLanding() {
    for (const rival of rivals) {
      if (rival.health > 0 && !rival.landed) {
        return rival;
      }
    }

    const spawn = randomOffscreenPoint(140, 440);
    const rival = createRival(spawn.x, spawn.y);
    rivals.push(rival);
    return rival;
  }

  function ensureResidentRivals() {
    for (const tier of bodyTiers) {
      if (tier.threshold < 100) {
        continue;
      }

      if (hasResidentRivalForTier(tier.name)) {
        continue;
      }

      const body = findResidentBodyForTier(tier.name);
      if (!body) {
        continue;
      }

      attachRivalToBody(findAvailableRivalForLanding(), body, tier.name);
    }
  }

  function applyRivalSurfaceConstraint(rival) {
    if (!rival.landed) {
      return false;
    }

    const body = bodyById(rival.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      rival.landed = null;
      rival.residentTier = null;
      rival.rotation = 0;
      return false;
    }

    const normal = {
      x: Math.cos(rival.landed.angle),
      y: Math.sin(rival.landed.angle)
    };
    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const walkSpeed = rival.landed.walkSpeed || 0;
    const distanceFromCenter = body.radius + rivalFootOffset;

    rival.x = body.x + normal.x * distanceFromCenter;
    rival.y = body.y + normal.y * distanceFromCenter;
    rival.vx = body.vx + tangent.x * walkSpeed;
    rival.vy = body.vy + tangent.y * walkSpeed;
    rival.rotation = rival.landed.angle + Math.PI / 2;
    return true;
  }

  function updateLandedRival(rival, dt) {
    const body = bodyById(rival.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      rival.landed = null;
      rival.residentTier = null;
      rival.rotation = 0;
      return;
    }

    const surfaceRadius = Math.max(24, body.radius);
    const driftSpeed = Math.sin(performance.now() * 0.00055 + rival.wobble) * 20;
    rival.landed.walkSpeed = rival.landed.walkSpeed * Math.pow(0.86, dt) + driftSpeed * (1 - Math.pow(0.04, dt));
    rival.landed.angle += (rival.landed.walkSpeed / surfaceRadius) * dt;
    applyRivalSurfaceConstraint(rival);
  }

  function detachFromBody(jumpStrength) {
    if (!player.landed) {
      return;
    }

    const body = bodyById(player.landed.bodyId);
    if (body) {
      const normal = {
        x: Math.cos(player.landed.angle),
        y: Math.sin(player.landed.angle)
      };
      player.vx = body.vx + normal.x * jumpStrength;
      player.vy = body.vy + normal.y * jumpStrength;
    }

    player.landed = null;
    jumpQueued = false;
  }

  function applyLandedSurfaceConstraint() {
    if (!player.landed) {
      return false;
    }

    const body = bodyById(player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      detachFromBody(130);
      return false;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const distanceFromCenter = body.radius + playerFootOffset;
    const walkSpeed = player.landed.walkSpeed || 0;

    player.x = body.x + normal.x * distanceFromCenter;
    player.y = body.y + normal.y * distanceFromCenter;
    player.vx = body.vx + tangent.x * walkSpeed;
    player.vy = body.vy + tangent.y * walkSpeed;
    return true;
  }

  function toggleLanding() {
    if (player.landed) {
      detachFromBody(190);
      return;
    }

    const body = findNearestLandableBody();
    if (!body) {
      return;
    }

    const angle = Math.atan2(player.y - body.y, player.x - body.x);
    player.landed = {
      bodyId: body.id,
      angle,
      walkSpeed: 0
    };
    applyLandedSurfaceConstraint();
  }

  function updateLandedPlayer(dt) {
    const body = bodyById(player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      detachFromBody(120);
      return;
    }

    if (jumpQueued) {
      jumpQueued = false;
      detachFromBody(380);
      return;
    }

    const surfaceCircumferenceRadius = Math.max(24, body.radius);
    const walkSpeed = keys.has("KeyS") ? 68 : 128;
    let walkDirection = 0;

    if (keys.has("KeyA")) {
      walkDirection -= 1;
    }
    if (keys.has("KeyD")) {
      walkDirection += 1;
    }

    player.landed.walkSpeed = walkDirection * walkSpeed;
    player.landed.angle += (player.landed.walkSpeed / surfaceCircumferenceRadius) * dt;
    applyLandedSurfaceConstraint();
  }

  function updateLandedGadgetThrust(dt) {
    if (!isSuctionEquipped() || !player.landed || (!mouse.left && !mouse.right)) {
      return;
    }

    const body = bodyById(player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      return;
    }

    const aim = getAim();
    const direction = mouse.left ? 1 : -1;
    const massDamping = clamp(1 / Math.pow(Math.max(1, body.mass / 100), 0.38), 0.18, 1);
    const thrust = 155 * massDamping;
    const maxSpeed = 220 * massDamping + 60;

    body.vx += aim.world.x * direction * thrust * dt;
    body.vy += aim.world.y * direction * thrust * dt;

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }
  }

  function updatePlayer(dt) {
    if (player.landed) {
      updateLandedPlayer(dt);
      return;
    }

    let localX = 0;
    let localY = 0;

    if (keys.has("KeyA")) {
      localX -= 1;
    }
    if (keys.has("KeyD")) {
      localX += 1;
    }
    if (keys.has("KeyW")) {
      localY -= 1;
    }
    if (keys.has("KeyS")) {
      localY += 1;
    }

    if (keys.has("KeyQ")) {
      cameraRoll -= 1.9 * dt;
    }
    if (keys.has("KeyE")) {
      cameraRoll += 1.9 * dt;
    }

    if (localX || localY) {
      const local = normalize(localX, localY);
      const world = cameraLocalToWorld(local.x, local.y);
      const thrust = 640;
      player.vx += world.x * thrust * dt;
      player.vy += world.y * thrust * dt;
    }

    const speed = length(player.vx, player.vy);
    const maxSpeed = 430;
    if (speed > maxSpeed) {
      player.vx = (player.vx / speed) * maxSpeed;
      player.vy = (player.vy / speed) * maxSpeed;
    }

    const drag = Math.pow(0.18, dt);
    player.vx *= drag;
    player.vy *= drag;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
  }

  function applyGadgetForces(target, aim, funnel, dt) {
    const toTargetX = target.x - player.x;
    const toTargetY = target.y - player.y;
    const forward = toTargetX * aim.world.x + toTargetY * aim.world.y;
    const sideX = toTargetX - aim.world.x * forward;
    const sideY = toTargetY - aim.world.y * forward;
    const side = length(sideX, sideY);
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const inCone = forward > -70 && forward < 560 && side < coneWidth;
    const toMouthX = funnel.x - target.x;
    const toMouthY = funnel.y - target.y;
    const mouthDist = length(toMouthX, toMouthY);

    if (mouse.left && inCone) {
      const pull = normalize(toMouthX, toMouthY);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const distanceStrength = clamp(1 - mouthDist / 620, 0.16, 1);
      const force = 1180 * coneStrength * distanceStrength;
      target.vx += pull.x * force * dt;
      target.vy += pull.y * force * dt;

      if (mouthDist < funnel.radius + target.radius * 2.2) {
        const cup = normalize(toMouthX, toMouthY);
        const ringTarget = Math.max(0, funnel.radius * 0.42 - target.radius * 0.22);
        const current = mouthDist || 1;
        const settle = (current - ringTarget) * 22;
        target.vx += cup.x * settle * dt;
        target.vy += cup.y * settle * dt;
        target.vx *= Math.pow(0.035, dt);
        target.vy *= Math.pow(0.035, dt);
      }
    }

    if (mouse.right && forward > -20 && forward < 470 && side < coneWidth * 0.9) {
      const blastFalloff = clamp(1 - Math.max(0, forward) / 520, 0.22, 1);
      const sidePush = normalize(sideX, sideY);
      const force = 1450 * blastFalloff;
      target.vx += (aim.world.x * force + sidePush.x * 120) * dt;
      target.vy += (aim.world.y * force + sidePush.y * 120) * dt;
    }
  }

  function collideFunnelSegment(state, ax, ay, bx, by, radius) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((state.x - ax) * abx + (state.y - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = state.x - closestX;
    const dy = state.y - closestY;
    const dist = Math.hypot(dx, dy);
    const minDist = radius + funnelShape.wallThickness;

    if (dist >= minDist) {
      return false;
    }

    let nx = dx / (dist || 1);
    let ny = dy / (dist || 1);
    if (dist < 0.001) {
      nx = -aby / Math.sqrt(abLenSq);
      ny = abx / Math.sqrt(abLenSq);
    }

    const overlap = minDist - dist;
    state.x += nx * overlap;
    state.y += ny * overlap;

    const incoming = state.vx * nx + state.vy * ny;
    if (incoming < 0) {
      state.vx -= incoming * 1.26 * nx;
      state.vy -= incoming * 1.26 * ny;

      const tx = -ny;
      const ty = nx;
      const tangent = state.vx * tx + state.vy * ty;
      state.vx -= tangent * 0.1 * tx;
      state.vy -= tangent * 0.1 * ty;
    }

    return true;
  }

  function resolveFunnelBucket(target, aim, dt) {
    const normal = { x: -aim.world.y, y: aim.world.x };
    const relX = target.x - player.x;
    const relY = target.y - player.y;
    const velocityX = target.vx - player.vx;
    const velocityY = target.vy - player.vy;
    const state = {
      x: relX * aim.world.x + relY * aim.world.y,
      y: relX * normal.x + relY * normal.y,
      vx: velocityX * aim.world.x + velocityY * aim.world.y,
      vy: velocityX * normal.x + velocityY * normal.y
    };

    let touchedBucket = false;
    const backX = funnelShape.backX;
    const backHalf = funnelShape.backHalf;
    const rimX = funnelShape.rimX;
    const rimHalf = funnelShape.rimHalf;
    const radius = target.radius;

    touchedBucket = collideFunnelSegment(state, backX, -backHalf, rimX, -rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(state, backX, backHalf, rimX, rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(state, backX, -backHalf, backX, backHalf, radius) || touchedBucket;

    if (state.x >= backX && state.x <= rimX) {
      const half = funnelHalfAt(state.x);
      const availableHalf = Math.max(7, half - radius * 0.42);
      if (Math.abs(state.y) > availableHalf && Math.abs(state.y) < half) {
        const side = Math.sign(state.y) || 1;
        state.y = side * availableHalf;
        if (state.vy * side > 0) {
          state.vy *= -0.22;
        }
        touchedBucket = true;
      }
    }

    if (
      state.x < backX + radius &&
      state.x > backX - radius * 1.35 &&
      Math.abs(state.y) < backHalf + radius * 0.8 &&
      (state.x >= backX || state.vx < 0)
    ) {
      state.x = backX + radius;
      if (state.vx < 0) {
        state.vx *= -0.24;
      }
      touchedBucket = true;
    }

    const cupHalf = funnelHalfAt(state.x);
    const insideCup =
      state.x > backX - radius * 0.35 &&
      state.x < rimX + radius * 0.55 &&
      Math.abs(state.y) < cupHalf + radius * 0.25;

    if (insideCup || touchedBucket) {
      const damping = Math.pow(mouse.right ? 0.72 : 0.18, dt);
      state.vx *= damping;
      state.vy *= damping;

      if (!mouse.right) {
        state.vx += (funnelShape.captureX - state.x) * 7.5 * dt;
        state.vy += -state.y * 8.5 * dt;
      }

      if (mouse.left) {
        state.vx += (funnelShape.captureX - state.x) * 6.5 * dt;
        state.vy += -state.y * 6.5 * dt;
      }
    }

    target.x = player.x + aim.world.x * state.x + normal.x * state.y;
    target.y = player.y + aim.world.y * state.x + normal.y * state.y;
    target.vx = player.vx + aim.world.x * state.vx + normal.x * state.vy;
    target.vy = player.vy + aim.world.y * state.vx + normal.y * state.vy;
  }

  function updateParticles(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const landedBodyId = player.landed ? player.landed.bodyId : null;
    const suctionActive = isSuctionEquipped();

    spawnTimer -= dt;
    while (particles.length < targetParticles && spawnTimer <= 0) {
      spawnParticleNearPlayer();
      spawnTimer += 0.14;
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      const isLandedBody = particle.id === landedBodyId;
      if (suctionActive && !isLandedBody) {
        applyGadgetForces(particle, aim, funnel, dt);
      }

      particle.vx += Math.sin(particle.wobble + performance.now() * 0.0007) * 4 * dt;
      particle.vy += Math.cos(particle.wobble * 1.7 + performance.now() * 0.0006) * 4 * dt;
      particle.vx *= Math.pow(0.82, dt);
      particle.vy *= Math.pow(0.82, dt);
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (suctionActive && !isLandedBody) {
        resolveFunnelBucket(particle, aim, dt);
      }

      const fromPlayer = length(particle.x - player.x, particle.y - player.y);
      const cullDistance = Math.max(width, height) * 1.35 + 1100;
      if (!particle.tier.solid && fromPlayer > cullDistance && particles.length > targetParticles * 0.65) {
        particles.splice(i, 1);
      }
    }

    mergeParticles();
    resolvePlayerBodyCollisions();
  }

  function dominantMergeBody(a, b) {
    if (a.tier.threshold !== b.tier.threshold) {
      return a.tier.threshold > b.tier.threshold ? a : b;
    }

    return a.mass >= b.mass ? a : b;
  }

  function mergeParticles() {
    let mergesThisFrame = 0;

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.radius + b.radius;

        if (dx * dx + dy * dy <= minDist * minDist) {
          const mass = a.mass + b.mass;
          const previousTier = a.tier.threshold >= b.tier.threshold ? a.tier : b.tier;
          const tier = tierForMass(mass);
          const graduated = tier.threshold > previousTier.threshold;
          const visualSource = dominantMergeBody(a, b);
          const color = graduated ? mixColor(a.color, b.color, a.mass, b.mass) : visualSource.color;
          const merged = {
            id: graduated ? nextParticleId++ : visualSource.id,
            x: (a.x * a.mass + b.x * b.mass) / mass,
            y: (a.y * a.mass + b.y * b.mass) / mass,
            vx: (a.vx * a.mass + b.vx * b.mass) / mass,
            vy: (a.vy * a.mass + b.vy * b.mass) / mass,
            mass,
            radius: radiusFromMass(mass),
            tier,
            textureSeed: graduated
              ? (a.textureSeed * a.mass + b.textureSeed * b.mass) / mass + mass * 0.73
              : visualSource.textureSeed,
            color,
            wobble: graduated ? randomRange(0, Math.PI * 2) : visualSource.wobble,
            pulse: graduated ? randomRange(0.8, 1.25) : visualSource.pulse
          };

          if (player.landed && (player.landed.bodyId === a.id || player.landed.bodyId === b.id)) {
            player.landed.bodyId = merged.id;
            player.landed.angle = Math.atan2(player.y - merged.y, player.x - merged.x);
          }

          for (const rival of rivals) {
            if (rival.landed && (rival.landed.bodyId === a.id || rival.landed.bodyId === b.id)) {
              rival.landed.bodyId = merged.id;
              rival.landed.angle = Math.atan2(rival.y - merged.y, rival.x - merged.x);
              rival.residentTier = merged.tier.name;
              applyRivalSurfaceConstraint(rival);
            }
          }

          for (const structure of structures) {
            if (structure.bodyId === a.id || structure.bodyId === b.id) {
              structure.bodyId = merged.id;
              structure.angle = Math.atan2(structure.y - merged.y, structure.x - merged.x);
              applyStructureSurfaceConstraint(structure);
            }
          }

          sparks.push({
            x: merged.x,
            y: merged.y,
            radius: merged.radius * 1.8,
            color,
            life: 0.42,
            maxLife: 0.42
          });

          particles.splice(j, 1);
          particles.splice(i, 1, merged);
          maybeNotifyTier(tier, previousTier);
          mergesThisFrame += 1;
          j = i;

          if (mergesThisFrame > 8) {
            return;
          }
        }
      }
    }
  }

  function updateSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) {
        sparks.splice(i, 1);
      }
    }
  }

  function playerPickupDistance(pickup) {
    const screenDelta = rotatePoint(pickup.x - player.x, pickup.y - player.y, cameraRoll);
    const local = rotatePoint(screenDelta.x, screenDelta.y, -playerSurfaceRotation());
    return distanceToSegment(local.x, local.y, 0, -48, 0, 88);
  }

  function playerCanCollectPickup(pickup) {
    return playerPickupDistance(pickup) < pickup.radius + 43;
  }

  function updateHealthPickups(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const suctionActive = isSuctionEquipped();

    for (let i = healthPickups.length - 1; i >= 0; i -= 1) {
      const pickup = healthPickups[i];
      pickup.life -= dt;

      if (suctionActive) {
        applyGadgetForces(pickup, aim, funnel, dt);
      }

      const toPlayerX = player.x - pickup.x;
      const toPlayerY = player.y - pickup.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const canHeal = player.health < player.maxHealth;

      if (canHeal && dist < 320) {
        const pull = clamp(1 - dist / 320, 0, 1);
        pickup.vx += (toPlayerX / dist) * (180 + pull * 520) * pull * dt;
        pickup.vy += (toPlayerY / dist) * (180 + pull * 520) * pull * dt;
      }

      pickup.vx *= Math.pow(0.28, dt);
      pickup.vy *= Math.pow(0.28, dt);
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;

      if (suctionActive) {
        resolveFunnelBucket(pickup, aim, dt);
      }

      if (canHeal && playerCanCollectPickup(pickup)) {
        player.health = Math.min(player.maxHealth, player.health + pickup.heal);
        sparks.push({
          x: player.x,
          y: player.y,
          radius: 46,
          color: { r: 101, g: 245, b: 154 },
          life: 0.26,
          maxLife: 0.26
        });
        healthPickups.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      const cullDistance = Math.max(width, height) * 1.55 + 900;
      if (pickup.life <= 0 || fromPlayer > cullDistance) {
        healthPickups.splice(i, 1);
      }
    }
  }

  function updateTechPickups(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const suctionActive = isSuctionEquipped();

    for (let i = techPickups.length - 1; i >= 0; i -= 1) {
      const pickup = techPickups[i];
      pickup.life -= dt;
      pickup.rotation += (1.4 + Math.sin(pickup.wobble) * 0.4) * dt;

      if (suctionActive) {
        applyGadgetForces(pickup, aim, funnel, dt);
      }

      const toPlayerX = player.x - pickup.x;
      const toPlayerY = player.y - pickup.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist < 360) {
        const pull = clamp(1 - dist / 360, 0, 1);
        pickup.vx += (toPlayerX / dist) * (150 + pull * 470) * pull * dt;
        pickup.vy += (toPlayerY / dist) * (150 + pull * 470) * pull * dt;
      }

      pickup.vx *= Math.pow(0.32, dt);
      pickup.vy *= Math.pow(0.32, dt);
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;

      if (suctionActive) {
        resolveFunnelBucket(pickup, aim, dt);
      }

      if (playerCanCollectPickup(pickup)) {
        techInventory[pickup.key] = Math.max(0, Math.floor(techInventory[pickup.key] || 0)) + 1;
        updateTechUi();
        maybeNotifyText("+1 " + pickup.label);
        sparks.push({
          x: pickup.x,
          y: pickup.y,
          radius: 42,
          color: hslToRgb(330, 0.88, 0.64),
          life: 0.28,
          maxLife: 0.28
        });
        techPickups.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      const cullDistance = Math.max(width, height) * 1.55 + 900;
      if (pickup.life <= 0 || fromPlayer > cullDistance) {
        techPickups.splice(i, 1);
      }
    }
  }

  function resolvePlayerBodyCollisions() {
    for (const particle of particles) {
      if (!particle.tier.solid) {
        continue;
      }
      if (player.landed && player.landed.bodyId === particle.id) {
        continue;
      }

      const dx = player.x - particle.x;
      const dy = player.y - particle.y;
      const rawDist = Math.hypot(dx, dy);
      const dist = rawDist || 1;
      const minDist = player.radius + particle.radius * 0.92;

      if (dist >= minDist) {
        continue;
      }

      const nx = rawDist ? dx / dist : 1;
      const ny = rawDist ? dy / dist : 0;
      const overlap = minDist - dist;
      const bodyShare = clamp(4 / (particle.mass + 4), 0.03, 0.28);
      const playerShare = 1 - bodyShare;

      player.x += nx * overlap * playerShare;
      player.y += ny * overlap * playerShare;
      particle.x -= nx * overlap * bodyShare;
      particle.y -= ny * overlap * bodyShare;

      const relativeVelocity = (player.vx - particle.vx) * nx + (player.vy - particle.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.92;
        player.vx += nx * impulse * 0.72;
        player.vy += ny * impulse * 0.72;
        particle.vx -= nx * impulse * bodyShare;
        particle.vy -= ny * impulse * bodyShare;
      }
    }
  }

  function allCombatMobs() {
    return rivals.concat(ufos, rambots);
  }

  function damageMobsWithProjectiles() {
    for (const particle of particles) {
      if (particle.tier.threshold < 10 || particle.tier.solid) {
        continue;
      }

      const speed = Math.hypot(particle.vx, particle.vy);
      if (speed < projectileDamageSpeed) {
        continue;
      }

      for (const mob of allCombatMobs()) {
        if (mob.health <= 0 || mob.hitCooldown > 0) {
          continue;
        }

        const dx = mob.x - particle.x;
        const dy = mob.y - particle.y;
        const dist = Math.hypot(dx, dy) || 1;
        const hitDistance = mob.radius + particle.radius * 1.12;
        if (dist > hitDistance) {
          continue;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const damage = Math.min(85, 18 + (speed - projectileDamageSpeed) * 0.16 + Math.sqrt(particle.mass) * 0.75);
        knockMob(mob, nx, ny, 170 + speed * 0.38);
        particle.vx *= 0.92;
        particle.vy *= 0.92;

        damageMob(mob, damage, particle.color, mobName(mob) + " knocked out by " + particle.tier.article + " " + particle.tier.name + ".");
      }
    }
  }

  function firePlayerLaser() {
    const aim = getAim();
    const muzzleDistance = 80;
    const color = { r: 255, g: 115, b: 173 };

    playerLasers.push({
      x: player.x + aim.world.x * muzzleDistance,
      y: player.y + aim.world.y * muzzleDistance,
      vx: aim.world.x * playerLaserSpeed + player.vx * 0.18,
      vy: aim.world.y * playerLaserSpeed + player.vy * 0.18,
      radius: 7,
      length: 64,
      color,
      life: 0.9,
      maxLife: 0.9,
      damage: playerLaserDamage,
      knockback: playerLaserKnockback,
      sourceX: player.x,
      sourceY: player.y,
      ignoredBodyId: player.landed ? player.landed.bodyId : null
    });

    sparks.push({
      x: player.x + aim.world.x * muzzleDistance,
      y: player.y + aim.world.y * muzzleDistance,
      radius: 24,
      color,
      life: 0.14,
      maxLife: 0.14
    });

    if (!player.landed) {
      player.vx -= aim.world.x * 24;
      player.vy -= aim.world.y * 24;
    }
  }

  function updateEquippedTool(dt) {
    toolFireCooldown = Math.max(0, toolFireCooldown - dt);

    if (buildMenuOpen || equippedToolId !== "laser-pistol" || !mouse.left || toolFireCooldown > 0) {
      return;
    }

    firePlayerLaser();
    toolFireCooldown = playerLaserCooldown;
  }

  function updatePlayerLasers(dt) {
    for (let i = playerLasers.length - 1; i >= 0; i -= 1) {
      const laser = playerLasers[i];
      laser.life -= dt;
      laser.x += laser.vx * dt;
      laser.y += laser.vy * dt;

      const speed = Math.hypot(laser.vx, laser.vy) || 1;
      const dirX = laser.vx / speed;
      const dirY = laser.vy / speed;
      const tailX = laser.x - dirX * laser.length;
      const tailY = laser.y - dirY * laser.length;
      const ignoredBodyId = Number.isFinite(laser.ignoredBodyId) ? laser.ignoredBodyId : player.landed ? player.landed.bodyId : null;
      const blocker = findBlockingLandableBody(tailX, tailY, laser.x, laser.y, laser.radius, ignoredBodyId);

      if (blocker) {
        sparks.push({
          x: blocker.x,
          y: blocker.y,
          radius: 30,
          color: laser.color,
          life: 0.2,
          maxLife: 0.2
        });
        playerLasers.splice(i, 1);
        continue;
      }

      let hit = false;
      for (const mob of allCombatMobs()) {
        if (mob.health <= 0 || mob.hitCooldown > 0) {
          continue;
        }

        const dist = distanceToSegment(mob.x, mob.y, tailX, tailY, laser.x, laser.y);
        if (dist >= mob.radius + laser.radius) {
          continue;
        }

        knockMob(mob, dirX, dirY, laser.knockback || 170);
        damageMob(mob, laser.damage || playerLaserDamage, laser.color, laser.hitMessage || mobName(mob) + " dropped by the laser pistol.");
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 38,
          color: laser.color,
          life: 0.24,
          maxLife: 0.24
        });
        playerLasers.splice(i, 1);
        hit = true;
        break;
      }

      if (hit) {
        continue;
      }

      const originX = Number.isFinite(laser.sourceX) ? laser.sourceX : player.x;
      const originY = Number.isFinite(laser.sourceY) ? laser.sourceY : player.y;
      const fromSource = Math.hypot(laser.x - originX, laser.y - originY);
      const cullDistance = Math.max(width, height) * 1.5 + 900;
      if (laser.life <= 0 || fromSource > cullDistance) {
        playerLasers.splice(i, 1);
      }
    }
  }

  function resolveMobBodyCollisions() {
    for (const mob of allCombatMobs()) {
      if (mob.health <= 0) {
        continue;
      }

      for (const particle of particles) {
        if (!particle.tier.solid) {
          continue;
        }
        if (mob.landed && mob.landed.bodyId === particle.id) {
          continue;
        }

        const dx = mob.x - particle.x;
        const dy = mob.y - particle.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = mob.radius + particle.radius * 0.92;

        if (dist >= minDist) {
          continue;
        }

        if (mob.landed) {
          mob.landed = null;
          mob.residentTier = null;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        const bodyShare = clamp(3 / (particle.mass + 3), 0.02, 0.22);
        const mobShare = 1 - bodyShare;
        const bodySpeed = Math.hypot(particle.vx, particle.vy);

        mob.x += nx * overlap * mobShare;
        mob.y += ny * overlap * mobShare;
        particle.x -= nx * overlap * bodyShare;
        particle.y -= ny * overlap * bodyShare;

        const relativeVelocity = (mob.vx - particle.vx) * nx + (mob.vy - particle.vy) * ny;
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.96;
          mob.vx += nx * impulse * 0.86;
          mob.vy += ny * impulse * 0.86;
          particle.vx -= nx * impulse * bodyShare;
          particle.vy -= ny * impulse * bodyShare;
        }

        if (bodySpeed > rivalBodyImpactSpeed && mob.hitCooldown <= 0) {
          const damage = Math.min(90, 16 + (bodySpeed - rivalBodyImpactSpeed) * 0.18 + Math.sqrt(particle.mass) * 0.65);
          if (damageMob(mob, damage, particle.color, mobName(mob) + " crushed by " + particle.tier.article + " " + particle.tier.name + ".")) {
            break;
          }
        }
      }
    }
  }

  function fireRivalLaser(rival, toPlayerX, toPlayerY, dist) {
    const leadTime = clamp(dist / rivalProjectileSpeed, 0, 1.35);
    const targetX = player.x + player.vx * leadTime * 0.72;
    const targetY = player.y + player.vy * leadTime * 0.72;
    const aim = normalize(targetX - rival.x, targetY - rival.y);
    const muzzleDistance = rival.radius + 18;
    const laserColor = shadeColor(rival.color, 64);

    rivalProjectiles.push({
      x: rival.x + aim.x * muzzleDistance,
      y: rival.y + aim.y * muzzleDistance,
      vx: aim.x * rivalProjectileSpeed + rival.vx * 0.18,
      vy: aim.y * rivalProjectileSpeed + rival.vy * 0.18,
      radius: 5,
      length: randomRange(34, 46),
      color: laserColor,
      life: 2.2,
      maxLife: 2.2
    });

    sparks.push({
      x: rival.x + aim.x * muzzleDistance,
      y: rival.y + aim.y * muzzleDistance,
      radius: 28,
      color: rival.color,
      life: 0.18,
      maxLife: 0.18
    });

    rival.shootCooldown = randomRange(4.5, 7.25);
    rival.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    return Math.hypot(px - closestX, py - closestY);
  }

  function segmentBodyIntersection(body, ax, ay, bx, by, padding) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((body.x - ax) * abx + (body.y - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = body.x - closestX;
    const dy = body.y - closestY;
    const blockRadius = body.radius + padding;

    if (dx * dx + dy * dy > blockRadius * blockRadius) {
      return null;
    }

    return {
      x: closestX,
      y: closestY,
      t
    };
  }

  function findBlockingLandableBody(ax, ay, bx, by, padding, ignoredBodyId) {
    let nearest = null;

    for (const particle of particles) {
      if (!isLandableBody(particle) || particle.id === ignoredBodyId) {
        continue;
      }

      const hit = segmentBodyIntersection(particle, ax, ay, bx, by, padding);
      if (!hit || (nearest && hit.t >= nearest.t)) {
        continue;
      }

      nearest = {
        body: particle,
        x: hit.x,
        y: hit.y,
        t: hit.t
      };
    }

    return nearest;
  }

  function hasClearShotAtPlayer(rival) {
    const ignoredBodyId = rival.landed ? rival.landed.bodyId : null;
    return !findBlockingLandableBody(rival.x, rival.y, player.x, player.y, player.radius * 0.18, ignoredBodyId);
  }

  function hasClearShotAtMob(x, y, mob, ignoredBodyId) {
    return !findBlockingLandableBody(x, y, mob.x, mob.y, mob.radius * 0.2, ignoredBodyId);
  }

  function findTurretTarget(turret) {
    let best = null;
    let bestDistance = Infinity;

    for (const mob of allCombatMobs()) {
      if (mob.health <= 0) {
        continue;
      }

      const distance = Math.hypot(mob.x - turret.x, mob.y - turret.y);
      if (distance > turretRange || distance >= bestDistance) {
        continue;
      }

      const normalX = Math.cos(turret.angle);
      const normalY = Math.sin(turret.angle);
      const aboveSurface = (mob.x - turret.x) * normalX + (mob.y - turret.y) * normalY;
      if (aboveSurface < -mob.radius * 0.2) {
        continue;
      }

      if (!hasClearShotAtMob(turret.x, turret.y, mob, turret.bodyId)) {
        continue;
      }

      best = mob;
      bestDistance = distance;
    }

    return best;
  }

  function fireTurretLaser(turret, target, dist) {
    const leadTime = clamp(dist / turretLaserSpeed, 0, 1.1);
    const targetX = target.x + target.vx * leadTime * 0.52;
    const targetY = target.y + target.vy * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;

    playerLasers.push({
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * turretLaserSpeed,
      vy: aim.y * turretLaserSpeed,
      radius: 4,
      length: 38,
      color,
      life: 1.05,
      maxLife: 1.05,
      damage: turretLaserDamage,
      knockback: turretLaserKnockback,
      hitMessage: mobName(target) + " dropped by a turret.",
      sourceX: turret.x,
      sourceY: turret.y,
      ignoredBodyId: turret.bodyId
    });

    sparks.push({
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      radius: 28,
      color,
      life: 0.16,
      maxLife: 0.16
    });

    turret.shootCooldown = turretShootCooldown;
  }

  function updateStructures(dt) {
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (!applyStructureSurfaceConstraint(structure)) {
        sparks.push({
          x: structure.x,
          y: structure.y,
          radius: 46,
          color: { r: 255, g: 209, b: 102 },
          life: 0.28,
          maxLife: 0.28
        });
        structures.splice(i, 1);
        continue;
      }

      structure.shootCooldown = Math.max(0, structure.shootCooldown - dt);
      const target = structure.type === "turret" ? findTurretTarget(structure) : null;
      const normalAngle = structure.angle;

      if (target) {
        const targetAngle = Math.atan2(target.y - structure.y, target.x - structure.x);
        structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, targetAngle), -4.2 * dt, 4.2 * dt);
        structure.deploy = clamp(structure.deploy + dt * 2.8, 0, 1);

        const dist = Math.hypot(target.x - structure.x, target.y - structure.y);
        if (structure.deploy > 0.72 && structure.shootCooldown <= 0) {
          fireTurretLaser(structure, target, dist);
        }
      } else {
        structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, normalAngle), -2.2 * dt, 2.2 * dt);
        structure.deploy = clamp(structure.deploy - dt * 1.6, 0, 1);
      }
    }
  }

  function updateRivalProjectiles(dt) {
    player.hitCooldown = Math.max(0, player.hitCooldown - dt);
    player.hitFlash = Math.max(0, player.hitFlash - dt);

    for (let i = rivalProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = rivalProjectiles[i];
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const dirX = projectile.vx / speed;
      const dirY = projectile.vy / speed;
      const tailX = projectile.x - dirX * projectile.length;
      const tailY = projectile.y - dirY * projectile.length;
      const blocker = findBlockingLandableBody(tailX, tailY, projectile.x, projectile.y, projectile.radius);

      if (blocker) {
        sparks.push({
          x: blocker.x,
          y: blocker.y,
          radius: 34,
          color: projectile.color,
          life: 0.22,
          maxLife: 0.22
        });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      const dist = distanceToSegment(player.x, player.y, tailX, tailY, projectile.x, projectile.y);
      const hitDistance = player.radius * 0.72 + projectile.radius;

      if (dist < hitDistance && player.hitCooldown <= 0) {
        const nx = dirX;
        const ny = dirY;
        if (player.landed) {
          detachFromBody(160);
        }
        player.vx += nx * 190 + projectile.vx * 0.34;
        player.vy += ny * 190 + projectile.vy * 0.34;
        player.health = Math.max(0, player.health - rivalProjectileDamage);
        player.hitCooldown = 0.7;
        player.hitFlash = 0.28;
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 44,
          color: projectile.color,
          life: 0.34,
          maxLife: 0.34
        });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(projectile.x - player.x, projectile.y - player.y);
      const cullDistance = Math.max(width, height) * 1.65 + 900;
      if (projectile.life <= 0 || fromPlayer > cullDistance) {
        rivalProjectiles.splice(i, 1);
      }
    }
  }

  function applyUfoTractorBeam(ufo, dt) {
    let bestParticle = null;
    let bestScore = Infinity;
    const playerBody = player.landed ? bodyById(player.landed.bodyId) : null;

    for (const particle of particles) {
      const distance = Math.hypot(particle.x - ufo.x, particle.y - ufo.y);
      let score = distance;
      if (particle === playerBody) {
        score *= 0.18;
      } else if (particle.tier.solid) {
        score = distance * 0.55 - particle.radius;
      }

      if (distance < ufoTractorRange && score < bestScore) {
        bestParticle = particle;
        bestScore = score;
      }
    }

    if (bestParticle) {
      const targetAngle = Math.atan2(bestParticle.y - ufo.y, bestParticle.x - ufo.x);
      const turn = shortestAngleDelta(ufo.beamAngle, targetAngle);
      ufo.beamAngle += clamp(turn, -ufoBeamMaxTurn * dt, ufoBeamMaxTurn * dt);
    } else {
      const turn = shortestAngleDelta(ufo.beamAngle, ufo.rotation + Math.PI / 2);
      ufo.beamAngle += clamp(turn, -ufoBeamMaxTurn * 0.65 * dt, ufoBeamMaxTurn * 0.65 * dt);
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      const relX = particle.x - originX;
      const relY = particle.y - originY;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const beamHalf = ufoTractorWidth * (1 - clamp(forward / ufoTractorRange, 0, 1) * 0.55) + particle.radius * 0.45;

      if (forward < 0 || forward > ufoTractorRange || Math.abs(side) > beamHalf) {
        continue;
      }

      const pullStrength = clamp(1 - forward / ufoTractorRange, 0.12, 1);
      const centerStrength = clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0, 1);
      const toOriginX = originX - particle.x;
      const toOriginY = originY - particle.y;

      if (particle.tier.solid) {
        drainBodyWithUfoTractor(ufo, particle, pullStrength, centerStrength, dt);
        continue;
      }

      const toOrigin = normalize(toOriginX, toOriginY);
      const force = ufoTractorForce * pullStrength * (0.45 + centerStrength * 0.75);

      particle.vx += (toOrigin.x * force - normalX * side * 7.5) * dt;
      particle.vy += (toOrigin.y * force - normalY * side * 7.5) * dt;

      if (Math.hypot(toOriginX, toOriginY) < ufo.radius + particle.radius * 1.05) {
        const speed = Math.hypot(particle.vx, particle.vy);
        if (particle.tier.threshold >= 10 && speed >= projectileDamageSpeed && ufo.hitCooldown <= 0) {
          const damage = Math.min(85, 18 + (speed - projectileDamageSpeed) * 0.16 + Math.sqrt(particle.mass) * 0.75);
          damageMob(ufo, damage, particle.color, "UFO knocked out by " + particle.tier.article + " " + particle.tier.name + ".");
        }
        sparks.push({
          x: particle.x,
          y: particle.y,
          radius: Math.max(18, particle.radius * 1.5),
          color: ufo.color,
          life: 0.2,
          maxLife: 0.2
        });
        particles.splice(i, 1);
      }
    }
  }

  function drainBodyWithUfoTractor(ufo, body, pullStrength, centerStrength, dt) {
    if (body.mass <= 1) {
      return;
    }

    const previousTier = body.tier;
    const drain = Math.min(
      body.mass - 1,
      (ufoBodyDrainRate + Math.sqrt(body.mass) * 0.045) * pullStrength * (0.35 + centerStrength * 0.65) * dt
    );

    if (drain <= 0) {
      return;
    }

    body.mass -= drain;
    body.radius = radiusFromMass(body.mass);
    body.tier = tierForMass(body.mass);
    body.textureSeed += drain * 0.013;

    if (Math.random() < dt * 2.6) {
      sparks.push({
        x: body.x + randomRange(-body.radius * 0.42, body.radius * 0.42),
        y: body.y + randomRange(-body.radius * 0.42, body.radius * 0.42),
        radius: Math.max(16, body.radius * 0.18),
        color: ufo.color,
        life: 0.2,
        maxLife: 0.2
      });
    }

    if (body.tier !== previousTier) {
      for (const rival of rivals) {
        if (rival.landed && rival.landed.bodyId === body.id) {
          rival.residentTier = body.tier.name;
        }
      }
    }
  }

  function updateUfos(dt) {
    for (let i = ufos.length - 1; i >= 0; i -= 1) {
      const ufo = ufos[i];
      ufo.hitCooldown = Math.max(0, ufo.hitCooldown - dt);
      ufo.flash = Math.max(0, ufo.flash - dt);

      if (ufo.health <= 0) {
        ufos.splice(i, 1);
        continue;
      }

      const toPlayerX = player.x - ufo.x;
      const toPlayerY = player.y - ufo.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.7 + 1800) {
        const spawn = randomOffscreenPoint(180, 560);
        ufo.x = spawn.x;
        ufo.y = spawn.y;
        ufo.vx = randomRange(-24, 24);
        ufo.vy = randomRange(-24, 24);
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * ufo.strafeSign;
      const tangentY = nx * ufo.strafeSign;
      const desiredDistance = 430;
      const chaseForce = dist > desiredDistance ? 92 : -44;
      const strafeForce = dist < 880 ? 56 : 18;

      ufo.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      ufo.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
      ufo.vx += Math.sin(performance.now() * 0.00058 + ufo.wobble) * 10 * dt;
      ufo.vy += Math.cos(performance.now() * 0.00052 + ufo.wobble) * 10 * dt;
      ufo.vx *= Math.pow(0.75, dt);
      ufo.vy *= Math.pow(0.75, dt);

      const speed = Math.hypot(ufo.vx, ufo.vy);
      const maxSpeed = dist > 760 ? 170 : 132;
      if (speed > maxSpeed) {
        ufo.vx = (ufo.vx / speed) * maxSpeed;
        ufo.vy = (ufo.vy / speed) * maxSpeed;
      }

      ufo.x += ufo.vx * dt;
      ufo.y += ufo.vy * dt;
      applyUfoTractorBeam(ufo, dt);
      ufo.rotation = ufo.beamAngle - Math.PI / 2;
    }
  }

  function updateRivals(dt) {
    for (let i = rivals.length - 1; i >= 0; i -= 1) {
      const rival = rivals[i];
      rival.hitCooldown = Math.max(0, rival.hitCooldown - dt);
      rival.flash = Math.max(0, rival.flash - dt);

      if (rival.health <= 0) {
        rivals.splice(i, 1);
        continue;
      }

      rival.shootCooldown = Math.max(0, rival.shootCooldown - dt);

      if (rival.landed) {
        updateLandedRival(rival, dt);
        continue;
      }

      const toPlayerX = player.x - rival.x;
      const toPlayerY = player.y - rival.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.4 + 1600) {
        const spawn = randomOffscreenPoint(150, 500);
        rival.x = spawn.x;
        rival.y = spawn.y;
        rival.vx = randomRange(-16, 16);
        rival.vy = randomRange(-16, 16);
        rival.shootCooldown = randomRange(0.8, 2.2);
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * rival.strafeSign;
      const tangentY = nx * rival.strafeSign;
      const desiredDistance = 300;
      const chaseForce = dist > desiredDistance ? 136 : -62;
      const strafeForce = dist < rivalShootRange ? 46 : 12;

      rival.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      rival.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

      if (dist < rivalShootRange && rival.shootCooldown <= 0 && hasClearShotAtPlayer(rival)) {
        fireRivalLaser(rival, toPlayerX, toPlayerY, dist);
      }

      rival.vx += Math.sin(performance.now() * 0.0006 + rival.wobble) * 8 * dt;
      rival.vy += Math.cos(performance.now() * 0.0005 + rival.wobble) * 8 * dt;
      rival.vx *= Math.pow(0.72, dt);
      rival.vy *= Math.pow(0.72, dt);

      const speed = Math.hypot(rival.vx, rival.vy);
      const maxSpeed = dist > 620 ? 185 : 142;
      if (speed > maxSpeed) {
        rival.vx = (rival.vx / speed) * maxSpeed;
        rival.vy = (rival.vy / speed) * maxSpeed;
      }

      rival.x += rival.vx * dt;
      rival.y += rival.vy * dt;
      rival.rotation = Math.atan2(ny, nx) + Math.PI / 2 + Math.sin(performance.now() * 0.002 + rival.wobble) * 0.08;
    }

    updateRivalProjectiles(dt);
  }

  function hitPlayerWithRambot(rambot, nx, ny) {
    if (player.hitCooldown > 0 || rambot.impactCooldown > 0) {
      return;
    }

    if (player.landed) {
      detachFromBody(210);
    }

    player.vx += nx * 360 + rambot.vx * 0.48;
    player.vy += ny * 360 + rambot.vy * 0.48;
    player.health = Math.max(0, player.health - rambotImpactDamage);
    player.hitCooldown = 0.85;
    player.hitFlash = 0.32;
    rambot.impactCooldown = 0.9;
    rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.55);
    rambot.chargeTimer = 0;
    rambot.vx -= nx * 180;
    rambot.vy -= ny * 180;

    sparks.push({
      x: player.x,
      y: player.y,
      radius: 58,
      color: rambot.color,
      life: 0.34,
      maxLife: 0.34
    });
  }

  function updateRambotPlayerImpact(rambot) {
    const dx = player.x - rambot.x;
    const dy = player.y - rambot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = player.radius * 0.74 + rambot.radius * 0.86;

    if (dist > hitDistance) {
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > rambotImpactSpeed;
    const overlap = hitDistance - dist;

    player.x += nx * overlap * 0.72;
    player.y += ny * overlap * 0.72;
    rambot.x -= nx * overlap * 0.28;
    rambot.y -= ny * overlap * 0.28;

    if (charging) {
      hitPlayerWithRambot(rambot, nx, ny);
    }
  }

  function updateRambots(dt) {
    for (let i = rambots.length - 1; i >= 0; i -= 1) {
      const rambot = rambots[i];
      rambot.hitCooldown = Math.max(0, rambot.hitCooldown - dt);
      rambot.flash = Math.max(0, rambot.flash - dt);
      rambot.impactCooldown = Math.max(0, rambot.impactCooldown - dt);

      if (rambot.health <= 0) {
        rambots.splice(i, 1);
        continue;
      }

      const toPlayerX = player.x - rambot.x;
      const toPlayerY = player.y - rambot.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.5 + 1800) {
        const spawn = randomOffscreenPoint(220, 640);
        rambot.x = spawn.x;
        rambot.y = spawn.y;
        rambot.vx = randomRange(-10, 10);
        rambot.vy = randomRange(-10, 10);
        rambot.chargeCooldown = randomRange(1.2, 2.6);
        rambot.chargeTimer = 0;
        rambot.recoverTimer = 0;
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * rambot.strafeSign;
      const tangentY = nx * rambot.strafeSign;

      if (rambot.chargeTimer > 0) {
        rambot.chargeTimer -= dt;
        rambot.vx += rambot.chargeDirX * 900 * dt;
        rambot.vy += rambot.chargeDirY * 900 * dt;
        if (rambot.chargeTimer <= 0) {
          rambot.recoverTimer = randomRange(0.55, 0.9);
          rambot.chargeCooldown = randomRange(1.6, 3.1);
        }
      } else if (rambot.recoverTimer > 0) {
        rambot.recoverTimer -= dt;
        rambot.vx *= Math.pow(0.22, dt);
        rambot.vy *= Math.pow(0.22, dt);
      } else {
        rambot.chargeCooldown -= dt;
        rambot.vx += nx * 118 * dt + tangentX * 22 * dt;
        rambot.vy += ny * 118 * dt + tangentY * 22 * dt;

        if (dist < 860 && rambot.chargeCooldown <= 0) {
          rambot.chargeDirX = nx;
          rambot.chargeDirY = ny;
          rambot.chargeTimer = randomRange(0.62, 0.82);
          rambot.impactCooldown = 0;
          rambot.vx += nx * 170;
          rambot.vy += ny * 170;
        }
      }

      rambot.vx += Math.sin(performance.now() * 0.0005 + rambot.wobble) * 5 * dt;
      rambot.vy += Math.cos(performance.now() * 0.00045 + rambot.wobble) * 5 * dt;
      rambot.vx *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);
      rambot.vy *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);

      const speed = Math.hypot(rambot.vx, rambot.vy);
      const maxSpeed = rambot.chargeTimer > 0 ? 430 : 150;
      if (speed > maxSpeed) {
        rambot.vx = (rambot.vx / speed) * maxSpeed;
        rambot.vy = (rambot.vy / speed) * maxSpeed;
      }

      rambot.x += rambot.vx * dt;
      rambot.y += rambot.vy * dt;
      updateRambotPlayerImpact(rambot);
      rambot.rotation = Math.atan2(rambot.vy || ny, rambot.vx || nx) + Math.PI / 2;
    }
  }

  function textureNoise(seed, index) {
    return Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453 % 1;
  }

  function drawGlow(particle, radius, strength) {
    const glow = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      radius * 2.8
    );
    glow.addColorStop(0, colorString(particle.color, 0.74 * strength));
    glow.addColorStop(0.35, colorString(particle.color, 0.26 * strength));
    glow.addColorStop(1, colorString(particle.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTinyParticle(particle, radius) {
    ctx.globalCompositeOperation = "lighter";
    drawGlow(particle, radius, 1);

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = colorString(particle.color, 0.92);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
    ctx.beginPath();
    ctx.arc(particle.x - radius * 0.28, particle.y - radius * 0.34, Math.max(1.4, radius * 0.22), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRockShape(particle, radius, roughness, sides) {
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const angle = (Math.PI * 2 * i) / sides;
      const n = Math.sin(particle.textureSeed * 3.1 + i * 1.83) * 0.5 + Math.sin(particle.textureSeed * 1.7 + i * 4.31) * 0.5;
      const r = radius * (1 + n * roughness);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }

  function drawCraters(radius, seed, count, color, alphaScale) {
    for (let i = 0; i < count; i += 1) {
      const angle = textureNoise(seed, i) * Math.PI * 2;
      const spread = Math.sqrt(Math.abs(textureNoise(seed + 4.7, i + 11))) * radius * 0.72;
      const craterRadius = radius * (0.08 + Math.abs(textureNoise(seed + 9.2, i + 23)) * 0.14);
      const x = Math.cos(angle) * spread;
      const y = Math.sin(angle) * spread;
      const light = shadeColor(color, 58);
      const dark = shadeColor(color, -74);

      ctx.fillStyle = colorString(dark, 0.24 * alphaScale);
      ctx.beginPath();
      ctx.arc(x, y, craterRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = colorString(light, 0.18 * alphaScale);
      ctx.lineWidth = Math.max(1.2, craterRadius * 0.16);
      ctx.beginPath();
      ctx.arc(x - craterRadius * 0.18, y - craterRadius * 0.2, craterRadius * 0.82, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawRockBody(particle, radius, tierName) {
    const isAsteroid = tierName === "asteroid";
    const base = isAsteroid ? shadeColor(particle.color, -28) : shadeColor(particle.color, -12);
    const light = shadeColor(particle.color, 66);
    const dark = shadeColor(particle.color, -82);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.textureSeed);

    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.4, radius * 0.08, 0, 0, radius);
    gradient.addColorStop(0, colorString(light, 0.95));
    gradient.addColorStop(0.46, colorString(base, 0.98));
    gradient.addColorStop(1, colorString(dark, 0.98));
    ctx.fillStyle = gradient;

    drawRockShape(particle, radius, isAsteroid ? 0.22 : 0.15, isAsteroid ? 19 : 15);
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = colorString(dark, isAsteroid ? 0.42 : 0.28);
    ctx.lineWidth = Math.max(1.2, radius * 0.045);
    for (let i = 0; i < (isAsteroid ? 7 : 4); i += 1) {
      const y = (textureNoise(particle.textureSeed, i) - 0.5) * radius * 1.25;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.72, y);
      ctx.quadraticCurveTo(
        -radius * 0.1,
        y + textureNoise(particle.textureSeed + 3, i) * radius * 0.5,
        radius * 0.72,
        y + textureNoise(particle.textureSeed + 6, i) * radius * 0.32
      );
      ctx.stroke();
    }

    drawCraters(radius, particle.textureSeed, isAsteroid ? 7 : 4, particle.color, isAsteroid ? 0.9 : 0.65);
    ctx.restore();
  }

  function drawMoonBody(particle, radius, tierName) {
    const baseShift = tierName === "dwarf moon" ? -10 : 18;
    const base = shadeColor(particle.color, baseShift);
    const light = shadeColor(particle.color, 80);
    const dark = shadeColor(particle.color, -70);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.textureSeed * 0.18);

    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.04, 0, 0, radius);
    gradient.addColorStop(0, colorString(light, 0.96));
    gradient.addColorStop(0.52, colorString(base, 0.98));
    gradient.addColorStop(1, colorString(dark, 0.98));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = colorString(dark, tierName === "moon" ? 0.16 : 0.24);
    ctx.lineWidth = Math.max(1.4, radius * 0.045);
    for (let i = 0; i < 4; i += 1) {
      const y = -radius * 0.45 + i * radius * 0.3;
      ctx.beginPath();
      ctx.ellipse(0, y, radius * 0.9, radius * 0.12, textureNoise(particle.textureSeed, i) * 0.4 - 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawCraters(radius, particle.textureSeed, tierName === "moon" ? 11 : 8, particle.color, 0.92);
    ctx.restore();
  }

  function drawPlanetBody(particle, radius) {
    const light = shadeColor(particle.color, 84);
    const mid = shadeColor(particle.color, 8);
    const dark = shadeColor(particle.color, -76);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.textureSeed * 0.12);

    ctx.globalCompositeOperation = "lighter";
    drawGlow({ x: 0, y: 0, color: particle.color }, radius, 0.38);
    ctx.globalCompositeOperation = "source-over";

    const gradient = ctx.createRadialGradient(-radius * 0.4, -radius * 0.36, radius * 0.02, 0, 0, radius);
    gradient.addColorStop(0, colorString(light, 0.98));
    gradient.addColorStop(0.55, colorString(mid, 0.98));
    gradient.addColorStop(1, colorString(dark, 0.98));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();

    for (let i = 0; i < 7; i += 1) {
      const y = -radius * 0.62 + i * radius * 0.21;
      const bandColor = i % 2 === 0 ? shadeColor(particle.color, 46) : shadeColor(particle.color, -34);
      ctx.fillStyle = colorString(bandColor, 0.2);
      ctx.beginPath();
      ctx.ellipse(0, y, radius * 1.12, radius * (0.05 + Math.abs(textureNoise(particle.textureSeed, i)) * 0.035), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.strokeStyle = colorString(light, 0.32);
    ctx.lineWidth = Math.max(1.6, radius * 0.045);
    ctx.beginPath();
    ctx.arc(0, 0, radius + Math.max(4, radius * 0.07), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBody(particle, time) {
    const pulse = 1 + Math.sin(time * 0.004 * particle.pulse + particle.id) * 0.035;
    const radius = particle.radius * pulse;

    if (particle.tier.name === "particle") {
      drawTinyParticle(particle, radius);
      return;
    }

    ctx.globalCompositeOperation = "lighter";
    drawGlow(particle, radius, particle.tier.name === "planet" ? 0.32 : 0.48);
    ctx.globalCompositeOperation = "source-over";

    if (particle.tier.name === "rock" || particle.tier.name === "boulder" || particle.tier.name === "asteroid") {
      drawRockBody(particle, radius, particle.tier.name);
    } else if (particle.tier.name === "dwarf moon" || particle.tier.name === "moon") {
      drawMoonBody(particle, radius, particle.tier.name);
    } else {
      drawPlanetBody(particle, radius);
    }
  }

  function drawHealthPickup(pickup, time) {
    const fade = clamp(Math.min(pickup.life, 1.6) / 1.6, 0, 1);
    const bob = Math.sin(time * 0.006 + pickup.wobble) * 2.5;
    const pulse = 1 + Math.sin(time * 0.012 + pickup.wobble) * 0.08;

    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 34);
    glow.addColorStop(0, "rgba(123, 255, 173, 0.68)");
    glow.addColorStop(0.52, "rgba(85, 246, 151, 0.24)");
    glow.addColorStop(1, "rgba(85, 246, 151, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(14, 42, 34, 0.88)";
    ctx.strokeStyle = "rgba(198, 255, 219, 0.94)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#75ff9e";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawTechPickup(pickup, time) {
    const fade = clamp(Math.min(pickup.life, 1.8) / 1.8, 0, 1);
    const bob = Math.sin(time * 0.0065 + pickup.wobble) * 3;
    const size = pickup.radius;

    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    ctx.rotate(pickup.rotation);
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 38);
    glow.addColorStop(0, "rgba(255, 115, 173, 0.58)");
    glow.addColorStop(0.5, "rgba(88, 226, 255, 0.22)");
    glow.addColorStop(1, "rgba(88, 226, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(11, 18, 38, 0.92)";
    ctx.strokeStyle = pickup.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-1, 4);
    ctx.lineTo(7, -6);
    ctx.moveTo(-7, 7);
    ctx.lineTo(7, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawRival(rival, time) {
    if (rival.health <= 0) {
      return;
    }

    const pulse = rival.flash > 0 ? 1 + Math.sin(time * 0.07) * 0.08 : 1;
    const bodyColor = rival.flash > 0 ? { r: 255, g: 236, b: 194 } : rival.color;

    ctx.save();
    ctx.translate(rival.x, rival.y);
    ctx.rotate(rival.rotation || 0);
    ctx.scale(pulse, pulse);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;

    const glow = ctx.createRadialGradient(0, -5, 4, 0, -5, 48);
    glow.addColorStop(0, colorString(bodyColor, 0.32));
    glow.addColorStop(1, colorString(bodyColor, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -3, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, -29);
    ctx.quadraticCurveTo(-24, -47, -34, -34);
    ctx.moveTo(8, -29);
    ctx.quadraticCurveTo(24, -47, 34, -34);
    ctx.stroke();

    ctx.fillStyle = "#ffe96d";
    for (const x of [-34, 34]) {
      ctx.beginPath();
      ctx.arc(x, -34, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const headGradient = ctx.createRadialGradient(-10, -20, 4, 0, -8, 34);
    headGradient.addColorStop(0, colorString(shadeColor(bodyColor, 74), 0.98));
    headGradient.addColorStop(0.62, colorString(bodyColor, 0.98));
    headGradient.addColorStop(1, colorString(shadeColor(bodyColor, -82), 0.96));
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.bezierCurveTo(27, -35, 34, -12, 21, 7);
    ctx.bezierCurveTo(14, 20, -14, 20, -21, 7);
    ctx.bezierCurveTo(-34, -12, -27, -35, 0, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.ellipse(-11, -25, 5, 3.5, -0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#07101c";
    for (const x of [-10, 10]) {
      ctx.beginPath();
      ctx.ellipse(x, -10, 8, 12, x < 0 ? -0.24 : 0.24, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(189, 255, 238, 0.8)";
    for (const x of [-13, 7]) {
      ctx.beginPath();
      ctx.arc(x, -15, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(21, 24, 41, 0.72)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(bodyColor, -42), 0.95);
    roundRectPath(-16, 13, 32, 31, 12);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(bodyColor, 58), 0.8);
    roundRectPath(-7, 20, 14, 10, 4);
    ctx.fill();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-17, 23);
    ctx.quadraticCurveTo(-31, 31, -27, 44);
    ctx.moveTo(17, 23);
    ctx.quadraticCurveTo(32, 26, 34, 11);
    ctx.stroke();

    ctx.strokeStyle = colorString(bodyColor, 0.95);
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.translate(35, 9);
    ctx.rotate(-0.12);
    ctx.fillStyle = "#6e7581";
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    roundRectPath(-2, -6, 24, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3f4650";
    ctx.beginPath();
    ctx.arc(24, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-8, 41);
    ctx.lineTo(-15, 53);
    ctx.moveTo(8, 41);
    ctx.lineTo(15, 53);
    ctx.stroke();

    ctx.strokeStyle = colorString(bodyColor, 0.92);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    if (!rival.landed) {
      const healthPct = clamp(rival.health / rival.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      roundRectPath(-24, -43, 48, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-24, -43, 48 * healthPct, 6, 3);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawUfoTractorBeam(ufo, time) {
    if (ufo.health <= 0) {
      return;
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;
    const endX = originX + dirX * ufoTractorRange;
    const endY = originY + dirY * ufoTractorRange;
    const pulse = 0.82 + Math.sin(time * 0.008 + ufo.beamPulse) * 0.18;
    const topHalf = 24;
    const bottomHalf = ufoTractorWidth * pulse;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const gradient = ctx.createLinearGradient(originX, originY, endX, endY);
    gradient.addColorStop(0, "rgba(116, 244, 255, 0.48)");
    gradient.addColorStop(0.58, "rgba(116, 244, 255, 0.22)");
    gradient.addColorStop(1, "rgba(116, 244, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(originX + normalX * topHalf, originY + normalY * topHalf);
    ctx.lineTo(originX - normalX * topHalf, originY - normalY * topHalf);
    ctx.lineTo(endX - normalX * bottomHalf, endY - normalY * bottomHalf);
    ctx.lineTo(endX + normalX * bottomHalf, endY + normalY * bottomHalf);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(205, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      const side = i * 24 * pulse;
      ctx.beginPath();
      ctx.moveTo(originX + normalX * side, originY + normalY * side);
      ctx.quadraticCurveTo(
        (originX + endX) / 2 + normalX * (side + Math.sin(time * 0.006 + i + ufo.beamPulse) * 18),
        (originY + endY) / 2 + normalY * (side + Math.sin(time * 0.006 + i + ufo.beamPulse) * 18),
        endX + normalX * side * 2,
        endY + normalY * side * 2
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawUfo(ufo, time) {
    if (ufo.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hullColor = ufo.flash > 0 ? flashColor : ufo.color;
    const pulse = ufo.flash > 0 ? 1 + Math.sin(time * 0.08) * 0.07 : 1;

    ctx.save();
    ctx.translate(ufo.x, ufo.y);
    ctx.rotate(ufo.rotation || 0);
    ctx.scale(pulse, pulse);

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 72);
    glow.addColorStop(0, colorString(hullColor, 0.3));
    glow.addColorStop(1, colorString(hullColor, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const dome = ctx.createRadialGradient(-10, -18, 4, 0, -12, 26);
    dome.addColorStop(0, "rgba(235, 255, 255, 0.95)");
    dome.addColorStop(0.5, colorString(hullColor, 0.82));
    dome.addColorStop(1, "rgba(30, 58, 84, 0.92)");
    ctx.fillStyle = dome;
    ctx.strokeStyle = "#14192a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -12, 28, 20, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const hull = ctx.createLinearGradient(0, -16, 0, 24);
    hull.addColorStop(0, colorString(shadeColor(hullColor, 70), 0.96));
    hull.addColorStop(0.48, colorString(hullColor, 0.98));
    hull.addColorStop(1, colorString(shadeColor(hullColor, -88), 0.96));
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.ellipse(0, 4, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe56f";
    for (const x of [-28, 0, 28]) {
      ctx.beginPath();
      ctx.arc(x, 8 + Math.sin(time * 0.01 + x) * 1.2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const healthPct = clamp(ufo.health / ufo.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    roundRectPath(-28, -46, 56, 6, 3);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-28, -46, 56 * healthPct, 6, 3);
    ctx.fill();

    ctx.restore();
  }

  function drawRambot(rambot, time) {
    if (rambot.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const metal = rambot.flash > 0 ? flashColor : rambot.color;
    const pulse = rambot.flash > 0 ? 1 + Math.sin(time * 0.08) * 0.06 : 1;
    const chargeGlow = rambot.chargeTimer > 0 ? 0.58 + Math.sin(time * 0.024) * 0.22 : 0.18;

    ctx.save();
    ctx.translate(rambot.x, rambot.y);
    ctx.rotate(rambot.rotation || 0);
    ctx.scale(pulse, pulse);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 3, 8, 0, 3, 76);
    glow.addColorStop(0, "rgba(255, 209, 102, " + chargeGlow + ")");
    glow.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 3, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 5;
    ctx.fillStyle = colorString(shadeColor(metal, -58), 0.98);
    roundRectPath(-33, -11, 66, 49, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, 34), 0.98);
    roundRectPath(-25, -34, 50, 40, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, -92), 0.95);
    roundRectPath(-40, -1, 13, 45, 5);
    ctx.fill();
    ctx.stroke();
    roundRectPath(27, -1, 13, 45, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(-12, -16, 5, 0, Math.PI * 2);
    ctx.arc(12, -16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#ff7766";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -42);
    ctx.lineTo(-32, -55);
    ctx.moveTo(20, -42);
    ctx.lineTo(32, -55);
    ctx.stroke();

    ctx.fillStyle = "#d9e3e8";
    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, -49);
    ctx.lineTo(0, -68);
    ctx.lineTo(18, -49);
    ctx.lineTo(8, -42);
    ctx.lineTo(0, -52);
    ctx.lineTo(-8, -42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, 74), 0.42);
    roundRectPath(-17, 13, 34, 9, 4);
    ctx.fill();

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-18, 35);
    ctx.lineTo(-25, 54);
    ctx.moveTo(18, 35);
    ctx.lineTo(25, 54);
    ctx.stroke();

    ctx.strokeStyle = colorString(shadeColor(metal, -16), 0.96);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const healthPct = clamp(rambot.health / rambot.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-32, -76, 64, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-32, -76, 64 * healthPct, 7, 3.5);
    ctx.fill();

    ctx.restore();
  }

  function drawRivalProjectile(projectile) {
    ctx.save();
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const dirX = projectile.vx / speed;
    const dirY = projectile.vy / speed;
    const tailX = projectile.x - dirX * projectile.length;
    const tailY = projectile.y - dirY * projectile.length;
    const fade = clamp(projectile.life / projectile.maxLife, 0, 1);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const glow = ctx.createLinearGradient(tailX, tailY, projectile.x, projectile.y);
    glow.addColorStop(0, colorString(projectile.color, 0));
    glow.addColorStop(0.35, colorString(projectile.color, 0.32 * fade));
    glow.addColorStop(1, colorString(projectile.color, 0.86 * fade));
    ctx.strokeStyle = glow;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.88 * fade) + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawTurret(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.006 + (structure.wobble || 0)) * 0.04;
    const baseRotation = structure.angle + Math.PI / 2;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 115, b: 173 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(baseRotation);

    ctx.fillStyle = "rgba(6, 10, 24, 0.78)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-31, 6, 62, 19, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(207, 215, 231, 0.9)";
    ctx.strokeStyle = "rgba(10, 14, 27, 0.82)";
    roundRectPath(-23, -12 - deploy * 8, 46, 26 + deploy * 7, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(accent, 0.22 + deploy * 0.32);
    ctx.beginPath();
    ctx.arc(0, -2 - deploy * 7, 13 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const barrelAngle = structure.aimAngle || structure.angle;
    const barrelLength = 30 + deploy * 34;
    const barrelBaseX = structure.x + Math.cos(structure.angle) * (10 + deploy * 7);
    const barrelBaseY = structure.y + Math.sin(structure.angle) * (10 + deploy * 7);

    ctx.save();
    ctx.globalAlpha *= alpha * (0.72 + deploy * 0.28);
    ctx.translate(barrelBaseX, barrelBaseY);
    ctx.rotate(barrelAngle);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(11, 15, 28, 0.92)";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(barrelLength, 0);
    ctx.stroke();
    ctx.strokeStyle = colorString(accent, 0.84);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = colorString(accent, 0.88);
    ctx.beginPath();
    ctx.arc(barrelLength + 2, 0, 5 + deploy * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStructures(time) {
    for (const structure of structures) {
      drawTurret(structure, time, 1, true);
    }
  }

  function drawStructurePlacementPreview(time) {
    if (!activePlacementRecipeId) {
      return;
    }

    const recipe = recipeById(activePlacementRecipeId);
    if (!isStructureRecipe(recipe)) {
      return;
    }

    const placement = currentStructurePlacement();
    const preview = {
      type: recipe.structureType,
      bodyId: placement.bodyId,
      angle: placement.angle,
      x: placement.x,
      y: placement.y,
      aimAngle: placement.angle,
      deploy: placement.valid ? 0.58 : 0.2,
      wobble: 0
    };

    drawTurret(preview, time, placement.valid ? 0.48 : 0.34, placement.valid);

    ctx.save();
    ctx.globalAlpha = placement.valid ? 0.34 : 0.42;
    ctx.strokeStyle = placement.valid ? "rgba(88, 226, 255, 0.85)" : "rgba(255, 100, 100, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(placement.x, placement.y, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawRivals(time) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    for (const ufo of ufos) {
      drawUfoTractorBeam(ufo, time);
    }

    for (const projectile of rivalProjectiles) {
      drawRivalProjectile(projectile);
    }

    for (const laser of playerLasers) {
      drawRivalProjectile(laser);
    }

    drawStructures(time);
    drawStructurePlacementPreview(time);

    for (const ufo of ufos) {
      drawUfo(ufo, time);
    }

    for (const rambot of rambots) {
      drawRambot(rambot, time);
    }

    for (const rival of rivals) {
      drawRival(rival, time);
    }

    ctx.restore();
  }

  function drawBackground() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    const gradient = ctx.createLinearGradient(player.x - width, player.y - height, player.x + width, player.y + height);
    gradient.addColorStop(0, "#06102d");
    gradient.addColorStop(0.5, "#080716");
    gradient.addColorStop(1, "#101234");
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x - width, player.y - height, width * 2, height * 2);

    const nebulae = [
      { x: -1260, y: -920, r: 520, color: { r: 83, g: 121, b: 255 }, alpha: 0.18 },
      { x: 880, y: -740, r: 460, color: { r: 211, g: 79, b: 194 }, alpha: 0.15 },
      { x: -1460, y: 980, r: 540, color: { r: 255, g: 109, b: 171 }, alpha: 0.13 },
      { x: 1280, y: 1000, r: 620, color: { r: 63, g: 183, b: 255 }, alpha: 0.14 },
      { x: 320, y: 1450, r: 420, color: { r: 121, g: 89, b: 255 }, alpha: 0.12 }
    ];
    for (const nebula of nebulae) {
      const wrap = 3600;
      const x = nebula.x + Math.round((player.x - nebula.x) / wrap) * wrap;
      const y = nebula.y + Math.round((player.y - nebula.y) / wrap) * wrap;
      const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, nebula.r);
      nebulaGradient.addColorStop(0, colorString(nebula.color, nebula.alpha));
      nebulaGradient.addColorStop(0.48, colorString(nebula.color, nebula.alpha * 0.34));
      nebulaGradient.addColorStop(1, colorString(nebula.color, 0));
      ctx.fillStyle = nebulaGradient;
      ctx.beginPath();
      ctx.arc(x, y, nebula.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(1, 3, 12, 0.18)";
    ctx.fillRect(player.x - width * 2, player.y - height * 2, width * 4, height * 4);

    for (const star of starDust) {
      const wrap = 7200;
      let x = star.x + Math.round((player.x - star.x) / wrap) * wrap;
      let y = star.y + Math.round((player.y - star.y) / wrap) * wrap;
      ctx.beginPath();
      ctx.fillStyle = "rgba(236, 247, 255, " + star.a + ")";
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawParticles(time) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    ctx.globalCompositeOperation = "lighter";

    for (const spark of sparks) {
      const progress = 1 - spark.life / spark.maxLife;
      ctx.beginPath();
      ctx.strokeStyle = colorString(spark.color, 0.36 * (1 - progress));
      ctx.lineWidth = 2.5;
      ctx.arc(spark.x, spark.y, spark.radius * (0.65 + progress), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const particle of particles) {
      drawBody(particle, time);
    }

    ctx.globalCompositeOperation = "source-over";
    for (const pickup of healthPickups) {
      drawHealthPickup(pickup, time);
    }
    for (const pickup of techPickups) {
      drawTechPickup(pickup, time);
    }

    ctx.restore();
  }

  function drawGadgetField(aim) {
    if (!isSuctionEquipped() || (!mouse.left && !mouse.right)) {
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const mouthX = centerX + aim.local.x * funnelShape.rimX;
    const mouthY = centerY + aim.local.y * funnelShape.rimX;
    const normal = { x: -aim.local.y, y: aim.local.x };
    const fieldLength = mouse.left ? 320 : 250;
    const time = performance.now() * 0.004;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (let i = 0; i < 10; i += 1) {
      const t = i / 9;
      const side = (t - 0.5) * (mouse.left ? 150 : 122);
      const phase = Math.sin(time + i * 1.7) * 8;
      const startScale = mouse.left ? fieldLength : 18;
      const endScale = mouse.left ? 18 : fieldLength;
      const startX = mouthX + aim.local.x * startScale + normal.x * (side + phase);
      const startY = mouthY + aim.local.y * startScale + normal.y * (side + phase);
      const endX = mouthX + aim.local.x * endScale + normal.x * side * 0.18;
      const endY = mouthY + aim.local.y * endScale + normal.y * side * 0.18;

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      if (mouse.left) {
        gradient.addColorStop(0, "rgba(114, 244, 255, 0)");
        gradient.addColorStop(0.58, "rgba(114, 244, 255, 0.22)");
        gradient.addColorStop(1, "rgba(229, 109, 255, 0.52)");
      } else {
        gradient.addColorStop(0, "rgba(255, 229, 120, 0.6)");
        gradient.addColorStop(0.62, "rgba(255, 117, 79, 0.26)");
        gradient.addColorStop(1, "rgba(255, 117, 79, 0)");
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = mouse.left ? 2 : 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        (startX + endX) / 2 + normal.x * Math.sin(time * 0.7 + i) * 16,
        (startY + endY) / 2 + normal.y * Math.sin(time * 0.7 + i) * 16,
        endX,
        endY
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function roundRectPath(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawJetFlames(time) {
    const moving = keys.has("KeyW") || keys.has("KeyS") || keys.has("KeyA") || keys.has("KeyD");
    if (!moving || player.landed) {
      return;
    }

    const flicker = 1 + Math.sin(time * 0.032) * 0.18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const x of [-16, 16]) {
      const gradient = ctx.createRadialGradient(x, 50, 0, x, 56, 25 * flicker);
      gradient.addColorStop(0, "rgba(255, 255, 184, 0.96)");
      gradient.addColorStop(0.42, "rgba(78, 218, 255, 0.58)");
      gradient.addColorStop(1, "rgba(75, 111, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, 54, 9 * flicker, 25 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function playerSurfaceRotation() {
    if (!player.landed) {
      return 0;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const screenNormal = rotatePoint(normal.x, normal.y, cameraRoll);
    return Math.atan2(screenNormal.y, screenNormal.x) + Math.PI / 2;
  }

  function playerLocalToScreen(x, y, time, rotation) {
    const bob = player.landed ? 0 : Math.sin(time * 0.004) * 2.4;
    const point = rotatePoint(x, y, rotation);
    return {
      x: width / 2 + point.x,
      y: height / 2 + bob + point.y
    };
  }

  function drawGripArm(startX, startY, bendX, bendY, handX, handY, handAngle) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(bendX, bendY, handX, handY);
    ctx.stroke();

    ctx.strokeStyle = "#f8f5ec";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(handAngle);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(23, 27, 44, 0.65)";
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-2, i * 3);
      ctx.lineTo(7, i * 3 + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function gadgetScreenPoint(aim, time, x, y) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const rotated = rotatePoint(x, y, aim.angle);
    return {
      x: centerX + rotated.x,
      y: centerY + rotated.y
    };
  }

  function drawHeldArm(startX, startY, hand, bendLift, handAngle, time, bodyRotation) {
    const shoulder = playerLocalToScreen(startX, startY, time, bodyRotation);
    const shoulderX = shoulder.x;
    const shoulderY = shoulder.y;
    const midX = (shoulderX + hand.x) / 2;
    const midY = (shoulderY + hand.y) / 2;
    const dx = hand.x - shoulderX;
    const dy = hand.y - shoulderY;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const bendX = midX + normalX * bendLift;
    const bendY = midY + normalY * bendLift;

    drawGripArm(shoulderX, shoulderY, bendX, bendY, hand.x, hand.y, handAngle);
  }

  function drawHeldArms(aim, time, layer) {
    const bodyRotation = playerSurfaceRotation();
    const topHand = gadgetScreenPoint(aim, time, 29, -9);
    const lowerHand = gadgetScreenPoint(aim, time, 46, 17);

    if (layer === "back") {
      drawHeldArm(-24, 24, topHand, -18, aim.angle - 0.18, time, bodyRotation);
      return;
    }

    drawHeldArm(24, 32, lowerHand, 18, aim.angle + 0.18, time, bodyRotation);
  }

  function drawAstronautBody(time, localVelocity, bodyRotation) {
    const bob = player.landed ? 0 : Math.sin(time * 0.004) * 2.4;
    const lean = player.landed ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;

    ctx.save();
    ctx.translate(width / 2, height / 2 + bob);
    ctx.rotate(bodyRotation);
    ctx.rotate(lean);
    if (player.landed && keys.has("KeyS")) {
      ctx.translate(0, playerFootOffset);
      ctx.scale(1.08, 0.84);
      ctx.translate(0, -playerFootOffset);
    }
    drawJetFlames(time);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    ctx.lineWidth = 4;

    ctx.fillStyle = "#f4f2ea";
    roundRectPath(-27, 18, 54, 58, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#d9dee8";
    roundRectPath(-22, 52, 18, 42, 8);
    ctx.fill();
    ctx.stroke();
    roundRectPath(4, 52, 18, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f8f5ec";
    roundRectPath(-43, 20, 18, 31, 9);
    ctx.fill();
    ctx.stroke();
    roundRectPath(25, 20, 18, 31, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -22, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    roundRectPath(-54, -28, 13, 28, 7);
    ctx.fill();
    ctx.stroke();
    roundRectPath(41, -28, 13, 28, 7);
    ctx.fill();
    ctx.stroke();

    const visorGradient = ctx.createLinearGradient(-30, -50, 34, 14);
    visorGradient.addColorStop(0, "#172847");
    visorGradient.addColorStop(0.45, "#050a18");
    visorGradient.addColorStop(1, "#0d3f6a");
    ctx.fillStyle = visorGradient;
    ctx.beginPath();
    ctx.ellipse(0, -23, 33, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
    ctx.beginPath();
    ctx.ellipse(-18, -34, 8, 5, -0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(54, 184, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(14, -18, 14, 8, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cfd7e7";
    roundRectPath(-24, 26, 48, 28, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#172033";
    roundRectPath(-14, 32, 12, 8, 3);
    ctx.fill();
    roundRectPath(4, 32, 12, 8, 3);
    ctx.fill();

    ctx.fillStyle = "#ef6262";
    ctx.beginPath();
    ctx.arc(-8, 47, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64e3ff";
    ctx.beginPath();
    ctx.arc(8, 47, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f6f2e9";
    roundRectPath(-29, 89, 26, 12, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(3, 89, 26, 12, 6);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawLaserPistol(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = mouse.left && toolFireCooldown > playerLaserCooldown * 0.45;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(5, 13);
    ctx.lineTo(40, 18);
    ctx.stroke();

    ctx.strokeStyle = "#f4f2ea";
    ctx.lineWidth = 4;
    ctx.stroke();

    const bodyGradient = ctx.createLinearGradient(8, -18, 70, 18);
    bodyGradient.addColorStop(0, "#f8fbff");
    bodyGradient.addColorStop(0.5, "#cfd7e7");
    bodyGradient.addColorStop(1, "#8e9aae");
    ctx.fillStyle = bodyGradient;
    roundRectPath(10, -17, 55, 34, 10);
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.stroke();

    const barrelGradient = ctx.createLinearGradient(55, -8, 108, 8);
    barrelGradient.addColorStop(0, "#5f6879");
    barrelGradient.addColorStop(0.42, "#fbf7ff");
    barrelGradient.addColorStop(1, "#ff73ad");
    ctx.fillStyle = barrelGradient;
    roundRectPath(55, -9, 52, 18, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#2a3047";
    roundRectPath(24, 14, 22, 28, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ff73ad";
    ctx.beginPath();
    ctx.arc(51, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      const flash = ctx.createRadialGradient(112, 0, 2, 112, 0, 42);
      flash.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      flash.addColorStop(0.35, "rgba(255, 115, 173, 0.68)");
      flash.addColorStop(1, "rgba(255, 115, 173, 0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(112, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawGadget(aim, time) {
    if (equippedToolId === "laser-pistol") {
      drawLaserPistol(aim, time);
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = mouse.left || mouse.right;
    const energyColor = mouse.right ? "#ffb35c" : "#67edff";

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(7, 14);
    ctx.lineTo(46, 19);
    ctx.stroke();

    ctx.strokeStyle = "#f4f2ea";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#edf1f5";
    roundRectPath(8, -19, 60, 38, 14);
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.stroke();

    const barrelGradient = ctx.createLinearGradient(35, -13, 98, 13);
    barrelGradient.addColorStop(0, "#98a8c1");
    barrelGradient.addColorStop(0.42, "#f8fbff");
    barrelGradient.addColorStop(1, "#8ccfe8");
    ctx.fillStyle = barrelGradient;
    roundRectPath(42, -13, 54, 26, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#29324c";
    roundRectPath(20, 16, 28, 18, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#edf1f5";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(28, 18);
    ctx.quadraticCurveTo(36, 35, 51, 25);
    ctx.stroke();

    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(funnelShape.backX, -funnelShape.backHalf);
    ctx.lineTo(funnelShape.rimX, -funnelShape.rimHalf);
    ctx.lineTo(funnelShape.rimX, funnelShape.rimHalf);
    ctx.lineTo(funnelShape.backX, funnelShape.backHalf);
    ctx.closePath();
    ctx.stroke();

    const funnelGradient = ctx.createLinearGradient(
      funnelShape.backX,
      -funnelShape.rimHalf,
      funnelShape.rimX,
      funnelShape.rimHalf
    );
    funnelGradient.addColorStop(0, "#fff7da");
    funnelGradient.addColorStop(0.45, "#78ddf7");
    funnelGradient.addColorStop(1, "#a46bff");
    ctx.fillStyle = funnelGradient;
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.moveTo(funnelShape.backX, -funnelShape.backHalf);
    ctx.lineTo(funnelShape.rimX, -funnelShape.rimHalf);
    ctx.lineTo(funnelShape.rimX, funnelShape.rimHalf);
    ctx.lineTo(funnelShape.backX, funnelShape.backHalf);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    ctx.stroke();

    const mouthGradient = ctx.createRadialGradient(funnelShape.rimX - 4, 0, 4, funnelShape.rimX, 0, funnelShape.rimHalf);
    mouthGradient.addColorStop(0, "rgba(4, 11, 26, 0.03)");
    mouthGradient.addColorStop(0.72, "rgba(4, 11, 26, 0.09)");
    mouthGradient.addColorStop(1, "rgba(255, 255, 255, 0.04)");
    ctx.fillStyle = mouthGradient;
    ctx.beginPath();
    ctx.ellipse(funnelShape.rimX - 2, 0, 13, funnelShape.rimHalf - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = active ? energyColor : "rgba(255, 255, 255, 0.48)";
    ctx.lineWidth = active ? 4 : 2;
    ctx.beginPath();
    ctx.arc(funnelShape.rimX, 0, funnelShape.rimHalf - 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = energyColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        const offset = Math.sin(time * 0.008 + i) * 4;
        ctx.beginPath();
        ctx.arc(funnelShape.rimX + offset, 0, 22 + i * 7, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawPlayer(time) {
    const localVelocity = rotatePoint(player.vx, player.vy, cameraRoll);
    const bodyRotation = playerSurfaceRotation();
    const aim = getAim();
    drawGadgetField(aim);
    drawAstronautBody(time, localVelocity, bodyRotation);
    drawHeldArms(aim, time, "back");
    drawGadget(aim, time);
    drawHeldArms(aim, time, "front");
    drawPlayerHealthBar();
  }

  function drawPlayerHealthBar() {
    const pct = clamp(player.health / player.maxHealth, 0, 1);
    const barWidth = 74;
    const barY = height / 2 - 86;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    roundRectPath(width / 2 - barWidth / 2, barY, barWidth, 8, 4);
    ctx.fill();
    ctx.fillStyle = pct > 0.55 ? "#61f59a" : pct > 0.28 ? "#f5d65b" : "#ff6262";
    roundRectPath(width / 2 - barWidth / 2, barY, barWidth * pct, 8, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.74);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.52)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function mapMarkerRadius(tierName) {
    const sizes = {
      asteroid: 4,
      "dwarf moon": 5.5,
      moon: 7,
      planet: 9
    };
    return sizes[tierName] || 4;
  }

  function mapMarkerLabel(tierName) {
    const labels = {
      asteroid: "A",
      "dwarf moon": "D",
      moon: "M",
      planet: "P"
    };
    return labels[tierName] || "";
  }

  function drawMapOverlay() {
    if (!mapVisible) {
      return;
    }

    const margin = width <= 560 ? 10 : 16;
    const controlClearance = width <= 560 ? 58 : 62;
    const size = Math.round(clamp(Math.min(width, height) * 0.27, 168, 252));
    const x = width - margin - size;
    const y = Math.max(margin, height - margin - controlClearance - size);
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const mapRadius = size * 0.41;
    const bodies = particles.filter(isMappedBody).sort((a, b) => a.mass - b.mass);
    let farthest = 0;

    for (const body of bodies) {
      farthest = Math.max(farthest, Math.hypot(body.x - player.x, body.y - player.y));
    }

    const range = clamp(farthest * 1.08, 1400, 9000);

    ctx.save();
    ctx.fillStyle = "rgba(3, 8, 24, 0.72)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    roundRectPath(x, y, size, size, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(x + 1, y + 1, size - 2, size - 2);
    ctx.clip();

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    ctx.strokeStyle = "rgba(88, 226, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (mapRadius / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(centerX - mapRadius, centerY);
    ctx.lineTo(centerX + mapRadius, centerY);
    ctx.moveTo(centerX, centerY - mapRadius);
    ctx.lineTo(centerX, centerY + mapRadius);
    ctx.stroke();

    for (const body of bodies) {
      const local = rotatePoint(body.x - player.x, body.y - player.y, cameraRoll);
      const distance = Math.hypot(local.x, local.y);
      const markerLimit = mapRadius - 14;
      const markerScale = markerLimit / range;
      const clamped = distance > range;
      const direction = distance > 0 ? { x: local.x / distance, y: local.y / distance } : { x: 0, y: -1 };
      const markerX = centerX + (clamped ? direction.x * markerLimit : local.x * markerScale);
      const markerY = centerY + (clamped ? direction.y * markerLimit : local.y * markerScale);
      const markerRadius = mapMarkerRadius(body.tier.name);
      const label = mapMarkerLabel(body.tier.name);

      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = colorString(body.color, clamped ? 0.22 : 0.28);
      ctx.beginPath();
      ctx.arc(markerX, markerY, markerRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = colorString(body.color, 0.9);
      ctx.strokeStyle = clamped ? "rgba(255, 255, 255, 0.86)" : "rgba(3, 8, 24, 0.86)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(markerX, markerY, markerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (label) {
        ctx.fillStyle = "#f8fbff";
        ctx.font = "900 9px Inter, ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, markerX, markerY + 0.2);
      }
    }

    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = "#58e2ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX + 7, centerY + 7);
    ctx.lineTo(centerX, centerY + 3);
    ctx.lineTo(centerX - 7, centerY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function updateHud() {
    let largest = 1;
    let largestParticle = null;
    for (const particle of particles) {
      if (particle.mass > largest) {
        largest = particle.mass;
        largestParticle = particle;
      }
    }

    massValue.textContent = Math.round(largest).toString();
    particleValue.textContent = particles.length.toString();
    healthValue.textContent = Math.round(player.health).toString();
    healthFill.style.width = Math.round(clamp(player.health / player.maxHealth, 0, 1) * 100) + "%";
    if (activePlacementRecipeId) {
      modeValue.textContent = "Place";
    } else if (buildMenuOpen) {
      modeValue.textContent = "Build";
    } else if (equippedToolId === "laser-pistol") {
      modeValue.textContent = mouse.left ? "Fire" : "Laser";
    } else {
      modeValue.textContent = player.landed && mouse.left ? "Tow" : player.landed && mouse.right ? "Push" : player.landed ? "Landed" : mouse.left ? "Suck" : mouse.right ? "Blow" : "Drift";
    }

    const progressBody = findNearestProgressBody() || largestParticle;
    const progressMass = progressBody ? progressBody.mass : largest;
    const tier = progressBody ? progressBody.tier : bodyTiers[0];
    const nextTier = nextTierAfter(tier);
    if (!nextTier) {
      nextMilestoneLabel.textContent = "Planet made";
      nextMilestoneValue.textContent = Math.round(progressMass).toString();
      milestoneFill.style.width = "100%";
      return;
    }

    const start = tier.threshold;
    const end = nextTier.threshold;
    const progress = clamp((progressMass - start) / (end - start), 0, 1);
    nextMilestoneLabel.textContent = "Next " + nextTier.name;
    nextMilestoneValue.textContent = Math.round(progressMass) + "/" + end;
    milestoneFill.style.width = Math.round(progress * 100) + "%";
  }

  function tick(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
    lastTime = now;

    updatePlayer(dt);
    updateGadgetAim(dt);
    updateEquippedTool(dt);
    updateLandedGadgetThrust(dt);
    updateMobSpawns(dt);
    updateParticles(dt);
    applyLandedSurfaceConstraint();
    updateRivals(dt);
    updateUfos(dt);
    updateRambots(dt);
    updateStructures(dt);
    updatePlayerLasers(dt);
    resolveMobBodyCollisions();
    damageMobsWithProjectiles();
    updateSparks(dt);
    updateHealthPickups(dt);
    updateTechPickups(dt);
    updatePersistence(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawParticles(now);
    drawRivals(now);
    drawPlayer(now);
    drawVignette();
    drawMapOverlay();
    updateHud();

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);

  if (buildMenuTabs) {
    buildMenuTabs.addEventListener("click", function (event) {
      const tab = closestEventTarget(event, ".build-menu__tab");
      if (!tab) {
        return;
      }

      activeBuildFilter = tab.dataset.filter || "all";
      renderBuildMenu();
    });
  }

  if (buildMenuList) {
    buildMenuList.addEventListener("click", function (event) {
      const card = closestEventTarget(event, ".build-card");
      if (!card || card.disabled) {
        return;
      }

      craftRecipe(card.dataset.recipeId);
    });
  }

  if (toolHotbar) {
    toolHotbar.addEventListener("click", function (event) {
      const slot = closestEventTarget(event, ".tool-slot");
      if (!slot) {
        return;
      }

      selectTool(slot.dataset.toolId);
    });
  }

  if (mapToggle) {
    mapToggle.addEventListener("click", function () {
      setMapVisible(!mapVisible);
    });
  }

  window.addEventListener("keydown", function (event) {
    if (!event.repeat && /^Digit[1-9]$/.test(event.code)) {
      const slot = Number(event.code.slice(5)) - 1;
      if (unlockedToolIds[slot]) {
        event.preventDefault();
        selectTool(unlockedToolIds[slot]);
        return;
      }
    }

    if (event.code === "KeyM" && !event.repeat) {
      event.preventDefault();
      setMapVisible(!mapVisible);
      return;
    }

    if (event.code === "KeyB" && !event.repeat) {
      event.preventDefault();
      setBuildMenuOpen(!buildMenuOpen);
      return;
    }
    if (event.code === "Escape" && activePlacementRecipeId) {
      event.preventDefault();
      cancelStructurePlacement();
      return;
    }
    if (event.code === "Escape" && buildMenuOpen) {
      event.preventDefault();
      setBuildMenuOpen(false);
      return;
    }
    if (event.code === "Escape" && mapVisible) {
      event.preventDefault();
      setMapVisible(false);
      return;
    }

    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "Space"].includes(event.code)) {
      event.preventDefault();
      if (event.code === "Space" && !event.repeat) {
        toggleLanding();
      }
      if (event.code === "KeyW" && player.landed && !event.repeat) {
        jumpQueued = true;
      }
      keys.add(event.code);
    }
  });

  window.addEventListener("keyup", function (event) {
    keys.delete(event.code);
  });

  window.addEventListener("blur", function () {
    keys.clear();
    jumpQueued = false;
    mouse.left = false;
    mouse.right = false;
  });

  window.addEventListener("mousemove", function (event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.seen = true;
  });

  window.addEventListener("mousedown", function (event) {
    if (closestEventTarget(event, ".build-menu, .tool-hotbar, .map-toggle")) {
      return;
    }

    if (activePlacementRecipeId) {
      event.preventDefault();
      if (event.button === 0) {
        confirmStructurePlacement();
      } else if (event.button === 2) {
        cancelStructurePlacement();
      }
      return;
    }

    if (event.button === 0) {
      mouse.left = true;
    }
    if (event.button === 2) {
      mouse.right = true;
    }
  });

  window.addEventListener("mouseup", function (event) {
    if (closestEventTarget(event, ".build-menu, .tool-hotbar, .map-toggle")) {
      return;
    }

    if (event.button === 0) {
      mouse.left = false;
    }
    if (event.button === 2) {
      mouse.right = false;
    }
  });

  window.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  window.addEventListener("wheel", function (event) {
    if (closestEventTarget(event, ".build-menu")) {
      return;
    }
    if (unlockedToolIds.length < 2) {
      return;
    }

    event.preventDefault();
    cycleTool(event.deltaY >= 0 ? 1 : -1);
  }, { passive: false });

  async function startGame() {
    initializeNetworkIdentity();
    initializeTechUi();
    updateMapToggle();
    resize();
    seedStarDust();
    seedParticles();
    await loadPersistentState();

    if (!starDust.length) {
      seedStarDust();
    }
    if (!particles.length) {
      seedParticles();
    }

    lastTime = performance.now();
    requestAnimationFrame(tick);
  }

  void startGame();
}());
