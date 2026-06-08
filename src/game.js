(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const healthValue = document.getElementById("healthValue");
  const healthFill = document.getElementById("healthFill");
  const energyValue = document.getElementById("energyValue");
  const energyFill = document.getElementById("energyFill");
  const scoreValue = document.getElementById("scoreValue");
  const difficultyValue = document.getElementById("difficultyValue");
  const currentBodyLabel = document.getElementById("currentBodyLabel");
  const nextMilestoneLabel = document.getElementById("nextMilestoneLabel");
  const nextMilestoneValue = document.getElementById("nextMilestoneValue");
  const milestoneFill = document.getElementById("milestoneFill");
  const leaderboardToggle = document.getElementById("leaderboardToggle");
  const leaderboardPanel = document.getElementById("leaderboardPanel");
  const leaderboardList = document.getElementById("leaderboardList");
  const resourcesToggle = document.getElementById("resourcesToggle");
  const buildToggle = document.getElementById("buildToggle");
  const mapToggle = document.getElementById("mapToggle");
  const notifications = document.getElementById("notifications");
  const notificationGroups = new Map();
  const techLedger = document.getElementById("techLedger");
  const techLedgerTitle = techLedger ? techLedger.querySelector(".tech-ledger__title") : null;
  const techLedgerList = document.getElementById("techLedgerList");
  const buildMenu = document.getElementById("buildMenu");
  const buildMenuTabs = document.getElementById("buildMenuTabs");
  const buildMenuTech = document.getElementById("buildMenuTech");
  const buildMenuList = document.getElementById("buildMenuList");
  const buildMenuDetail = document.getElementById("buildMenuDetail");
  const buildMenuStatus = document.getElementById("buildMenuStatus");
  const buildMenuClose = document.getElementById("buildMenuClose");
  const toolHotbar = document.getElementById("toolHotbar");
  const onlineToggle = document.getElementById("onlineToggle");
  const onlineCount = document.getElementById("onlineCount");
  const soundToggle = document.getElementById("soundToggle");
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsPanel = document.getElementById("settingsPanel");
  const settingsClose = document.getElementById("settingsClose");
  const uiScaleInput = document.getElementById("uiScaleInput");
  const uiScaleValue = document.getElementById("uiScaleValue");
  const zoomInput = document.getElementById("zoomInput");
  const zoomValue = document.getElementById("zoomValue");
  const surfaceCameraRotationInput = document.getElementById("surfaceCameraRotationInput");
  const accountLoginForm = document.getElementById("accountLoginForm");
  const accountUsernameInput = document.getElementById("accountUsernameInput");
  const accountPasswordInput = document.getElementById("accountPasswordInput");
  const accountLoginButton = document.getElementById("accountLoginButton");
  const accountSignupButton = document.getElementById("accountSignupButton");
  const crazyGamesAccount = document.getElementById("crazyGamesAccount");
  const crazyGamesAccountStatus = document.getElementById("crazyGamesAccountStatus");
  const crazyGamesLoginButton = document.getElementById("crazyGamesLoginButton");
  const accountSignedIn = document.getElementById("accountSignedIn");
  const accountNameValue = document.getElementById("accountNameValue");
  const accountLogoutButton = document.getElementById("accountLogoutButton");
  const saveGameForm = document.getElementById("saveGameForm");
  const saveGameNameInput = document.getElementById("saveGameNameInput");
  const saveGameButton = document.getElementById("saveGameButton");
  const loadGameForm = document.getElementById("loadGameForm");
  const loadGameNameInput = document.getElementById("loadGameNameInput");
  const savedGameList = document.getElementById("savedGameList");
  const saveGameStatus = document.getElementById("saveGameStatus");
  const controlBindingsList = document.getElementById("controlBindingsList");
  const resetControlsButton = document.getElementById("resetControlsButton");
  const socialPanel = document.getElementById("socialPanel");
  const socialPanelClose = document.getElementById("socialPanelClose");
  const publicNameValue = document.getElementById("publicNameValue");
  const playerSearch = document.getElementById("playerSearch");
  const friendsOnlyFilter = document.getElementById("friendsOnlyFilter");
  const playerSearchList = document.getElementById("playerSearchList");
  const signalPanel = document.getElementById("signalPanel");
  const signalName = document.getElementById("signalName");
  const investigateSignal = document.getElementById("investigateSignal");
  const avoidSignal = document.getElementById("avoidSignal");
  const difficultyScreen = document.getElementById("difficultyScreen");
  const commandPanel = document.getElementById("commandPanel");
  const commandInput = document.getElementById("commandInput");
  const commandHint = document.getElementById("commandHint");
  const playerInteractionPanel = document.getElementById("playerInteractionPanel");
  const playerInteractionName = document.getElementById("playerInteractionName");
  const playerInteractionChoices = document.getElementById("playerInteractionChoices");
  const tradePanel = document.getElementById("tradePanel");
  const tradePeerName = document.getElementById("tradePeerName");
  const tradeClose = document.getElementById("tradeClose");
  const tradeOfferList = document.getElementById("tradeOfferList");
  const tradeReceiveList = document.getElementById("tradeReceiveList");
  const tradeSendOffer = document.getElementById("tradeSendOffer");
  const tradeAccept = document.getElementById("tradeAccept");
  const tradeStatus = document.getElementById("tradeStatus");
  const deathScreen = document.getElementById("deathScreen");
  const deathStatsList = document.getElementById("deathStatsList");
  const deathLeaderboardForm = document.getElementById("deathLeaderboardForm");
  const deathRunNameInput = document.getElementById("deathRunNameInput");
  const deathLeaderboardButton = document.getElementById("deathLeaderboardButton");
  const deathLeaderboardStatus = document.getElementById("deathLeaderboardStatus");
  const playAgainButton = document.getElementById("playAgainButton");
  const renderBackendOrigin = "https://clusternaut.onrender.com";
  const crazyGamesState = {
    sdk: null,
    initPromise: null,
    initialized: false,
    muteAudio: false,
    gameplayActive: false,
    gameplayEventsDisabled: false,
    settingsListener: null,
    authListener: null,
    authAvailable: true,
    authPromptActive: false
  };
  let lastClientErrorReportAt = -Infinity;

  installClientErrorReporting();

  const keys = new Set();
  const settingsStorageKey = "clusternauts.settings";
  const legacySettingsStorageKey = "spaice.settings";
  const manualSaveStoragePrefix = "clusternauts.manualSave.";
  const legacyManualSaveStoragePrefix = "spaice.manualSave.";
  const accountSessionStorageKey = "clusternauts.accountSession";
  const playerIdStorageKey = "clusternauts.playerId";
  const legacyPlayerIdStorageKey = "spaice.playerId";
  const commandPassword = "imacheater";
  const defaultControlBindings = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    rollLeft: "KeyQ",
    rollRight: "KeyE",
    land: "Space",
    build: "KeyR"
  };
  const controlBindingLabels = [
    { action: "up", label: "Move up" },
    { action: "down", label: "Move down" },
    { action: "left", label: "Move left" },
    { action: "right", label: "Move right" },
    { action: "rollLeft", label: "Roll left" },
    { action: "rollRight", label: "Roll right" },
    { action: "land", label: "Land / take off" },
    { action: "build", label: "Build menu" }
  ];
  const movementKeyAliases = {
    up: [],
    down: [],
    left: [],
    right: []
  };
  const movementControlCodes = new Set();
  const gameSettings = readGameSettings();
  let settingsOpen = false;
  let pendingControlRemap = null;
  let gamePaused = false;
  const compactHudBreakpoint = 900;
  const compactHudHeightBreakpoint = 560;
  let resourcesHudOpen = false;
  let mapHudOpen = false;
  const techLedgerDrag = {
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0
  };
  const accountState = {
    token: "",
    username: "",
    saves: [],
    busy: false,
    savesLoading: false,
    crazyGamesLinked: false
  };

  syncControlBindings();

  function installClientErrorReporting() {
    window.addEventListener("error", function (event) {
      reportClientError({
        kind: "error",
        message: event.message || "Uncaught client error",
        source: event.filename || "",
        line: event.lineno || 0,
        column: event.colno || 0,
        stack: event.error && event.error.stack ? event.error.stack : ""
      });
    });

    window.addEventListener("unhandledrejection", function (event) {
      const reason = event.reason;
      reportClientError({
        kind: "unhandledrejection",
        message: reason && reason.message ? reason.message : String(reason || "Unhandled promise rejection"),
        source: "",
        line: 0,
        column: 0,
        stack: reason && reason.stack ? reason.stack : ""
      });
    });
  }

  function reportClientError(details) {
    const now = performance.now();
    if (now - lastClientErrorReportAt < 1000) {
      return;
    }
    lastClientErrorReportAt = now;

    const payload = Object.assign({
      href: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }, details || {});

    if (window.console && console.error) {
      console.error("[Clusternauts client error]", payload);
    }

    if (!window.fetch) {
      return;
    }

    fetch(apiUrl("/api/client-error"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {
      // If reporting fails, keep the original error as the only console signal.
    });
  }

  function apiUrl(url) {
    const value = String(url || "");
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    if (value.startsWith("/api") && shouldUseRenderBackend()) {
      return backendOrigin() + value;
    }
    return value;
  }

  function websocketUrl() {
    if (shouldUseRenderBackend()) {
      return backendOrigin().replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/ws";
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return protocol + "//" + window.location.host + "/ws";
  }

  function shouldUseRenderBackend() {
    const hostName = String(window.location.hostname || "").toLowerCase();
    if (configuredBackendOrigin()) {
      return true;
    }
    if (isLocalDevelopmentHost(hostName)) {
      return false;
    }
    return hostName !== renderBackendHost();
  }

  function backendOrigin() {
    return configuredBackendOrigin() || renderBackendOrigin;
  }

  function configuredBackendOrigin() {
    return typeof window.CLUSTERNAUTS_BACKEND_ORIGIN === "string" ? window.CLUSTERNAUTS_BACKEND_ORIGIN.replace(/\/+$/, "") : "";
  }

  function renderBackendHost() {
    try {
      return new URL(renderBackendOrigin).hostname.toLowerCase();
    } catch {
      return "clusternaut.onrender.com";
    }
  }

  function isLocalDevelopmentHost(hostName) {
    return hostName === "localhost" || hostName === "127.0.0.1" || hostName === "::1" || hostName === "";
  }

  function crazyGamesSdkEnvironment() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    return sdk && typeof sdk.environment === "string" ? sdk.environment.toLowerCase() : "";
  }

  function isCrazyGamesHost(hostName) {
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

  function isCrazyGamesRuntime() {
    return Boolean(window.CLUSTERNAUTS_CRAZYGAMES_BUILD) || isCrazyGamesHost(window.location.hostname) || crazyGamesSdkEnvironment() === "crazygames";
  }

  const mouse = {
    x: 0,
    y: 0,
    left: false,
    middle: false,
    right: false,
    seen: false
  };

  function isMovementKeyPressed(direction) {
    return movementKeyAliases[direction].some((code) => keys.has(code));
  }

  function isMoving() {
    if (isVacuumHoldActive()) {
      return false;
    }
    return Object.keys(movementKeyAliases).some(isMovementKeyPressed);
  }

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
    energy: 100,
    maxEnergy: 100,
    hitCooldown: 0,
    hitFlash: 0,
    landed: null,
    walkCycle: 0,
    weaponSlow: 0
  };

  const particles = [];
  const sparks = [];
  const starDust = [];
  const rivals = [];
  const ufos = [];
  const rambots = [];
  const engineers = [];
  const teslas = [];
  const rockets = [];
  const fighters = [];
  const rivalProjectiles = [];
  const playerLasers = [];
  const launcherMissiles = [];
  const structures = [];
  const healthPickups = [];
  const techPickups = [];
  const targetParticles = 78;
  const playerFootOffset = 101;
  const rivalFootOffset = 32;
  const projectileDamageSpeed = 155;
  const rivalBodyImpactSpeed = 110;
  const bodyImpactRepeatDamageCooldown = 1.15;
  const bodyImpactBaseKnockback = 145;
  const bodyImpactMaxKnockback = 320;
  const solidBodyDamageSpeed = 92;
  const weaponSlowDecay = 0.18;
  const weaponSlowMax = 0.58;
  const rivalProjectileSpeed = 360;
  const rivalShootRange = 980;
  const rivalProjectileDamage = 10;
  const rambotImpactDamage = 18;
  const rambotImpactSpeed = 260;
  const engineerHealRange = 620;
  const engineerHealRate = 18;
  const engineerHealCooldown = 0.55;
  const teslaLightningRange = 760;
  const teslaLightningDamage = 8;
  const teslaToolDisableDuration = 3.2;
  const rocketImpactDamage = 24;
  const rocketImpactSpeed = 320;
  const satelliteMissileSpeed = 630;
  const satelliteMissileDamage = 15;
  const satelliteLockDuration = 0.82;
  const satelliteVolleySpacing = 0.24;
  const satelliteVolleyCount = 3;
  const rocketChargeDuration = 1.18;
  const rocketChargeCooldownMin = 1.25;
  const rocketChargeCooldownMax = 2.15;
  const rocketChargeMaxSpeed = 860;
  const fighterShootRange = 980;
  const fighterShieldCycle = 10;
  const fighterShieldMaxCharge = 3;
  const structureMaxHealthByType = {
    "plating-block": 150,
    battery: 120,
    accumulator: 120,
    "shield-generator": 130,
    "communication-relay": 120,
    jet: 120,
    tether: 130,
    "missile-launcher": 125,
    turret: 110
  };
  const structureRambotDamage = 34;
  const structureRocketDamage = 30;
  const structureTeslaDisableDuration = 4.5;
  const spannerRepairRate = 26;
  const spannerDismantleRate = 32;
  const spannerRepairRange = 125;
  const spannerStrikeRange = 150;
  const spannerStrikeDamage = 18;
  const spannerStrikeCooldown = 1.25;
  const spannerTechBonusChance = 0.75;
  const playerBaseEnergyRegen = 6.5;
  const landedEnergyRegenShare = 0.58;
  const suctionEnergyDrain = 12;
  const spannerRepairEnergyDrain = 8.5;
  const spannerDismantleEnergyDrain = 10;
  const spannerStrikeEnergyCost = 7;
  const jetpackBoostEnergyDrain = 20;
  const jetpackBoostThrustMultiplier = 1.42;
  const jetpackBoostSpeedMultiplier = 1.38;
  const playerBaseMaxEnergy = 100;
  const playerMaxEnergyCap = 260;
  const playerMaxEnergyMassScale = 0.55;
  const playerMaxEnergyCountScale = 0.015;
  const turretEnergyCost = 8;
  const accumulatorBurstCost = 6;
  const accumulatorBurstInterval = 2.4;
  const accumulatorBurstDuration = 0.62;
  const batteryEnergyRegenBonus = 4.2;
  const healthPickupHeal = 8;
  const healthPickupLifetime = 18;
  const techPickupLifetime = 28;
  const mappedBodyThreshold = 10;
  const mobSpawnIntervals = {
    alienoid: 2 * 60,
    ufo: 3 * 60,
    rambot: 5 * 60,
    tesla: 7 * 60,
    engineer: 11 * 60,
    satellite: 13 * 60,
    rocket: 14 * 60,
    fighter: 16 * 60
  };
  const difficultyDefinitions = {
    easy: {
      id: "easy",
      label: "Easy",
      mobIntervalScale: 1.45,
      mobBatchScale: 0.72,
      mobBonusChanceScale: 0.72,
      techDropMultiplier: 1.45,
      bodyScoreMultiplier: 0.75,
      mobScoreMultiplier: 0.65
    },
    medium: {
      id: "medium",
      label: "Medium",
      mobIntervalScale: 1,
      mobBatchScale: 1,
      mobBonusChanceScale: 1,
      techDropMultiplier: 1.15,
      bodyScoreMultiplier: 1,
      mobScoreMultiplier: 1
    },
    hard: {
      id: "hard",
      label: "Hard",
      mobIntervalScale: 0.62,
      mobBatchScale: 1.38,
      mobBonusChanceScale: 1.35,
      techDropMultiplier: 1,
      bodyScoreMultiplier: 1.25,
      mobScoreMultiplier: 1.65
    }
  };
  const defaultDifficultyId = "medium";
  const mobScoreValues = {
    alienoid: 100,
    ufo: 175,
    rambot: 240,
    tesla: 325,
    engineer: 400,
    satellite: 520,
    rocket: 560,
    fighter: 700
  };
  const mobTierOrder = ["alienoid", "ufo", "rambot", "tesla", "engineer", "satellite", "rocket", "fighter"];
  const previousTierDefeatsToUnlock = 3;
  const baseMaxMobSpawnBatchSize = 3;
  const mobSpawnCapGrowthIntervalMultiplier = 10;
  const thirdMobSpawnChanceScale = 0.45;
  const ufoTractorRange = 520;
  const ufoTractorWidth = 118;
  const ufoTractorForce = 2350;
  const ufoBeamMaxTurn = 1.15;
  const ufoBodyDrainRate = 1.8;
  const ufoUndersideDamage = 14;
  const mobDamageParticleMin = 2;
  const mobDamageParticleMax = 4;
  const mobDamageParticleMass = 1;
  const rambotBodyImpactSpeed = 285;
  const rambotBodyImpactDrain = 11;
  const playerWeaponDefaults = {
    speed: 620,
    damage: 28,
    cooldown: 0.9,
    knockback: 260,
    movementSlow: 0.15,
    life: 0.62,
    length: 50,
    radius: 6,
    color: { r: 255, g: 115, b: 173 },
    label: "laser pistol"
  };
  const weaponDefinitions = {
    "laser-pistol": playerWeaponDefaults,
    "laser-rifle": {
      speed: 740,
      damage: 30,
      cooldown: 1.25,
      knockback: 260,
      movementSlow: 0.22,
      life: 0.72,
      length: 76,
      radius: 5,
      color: { r: 255, g: 115, b: 173 },
      piercesMobs: true,
      label: "laser rifle"
    }
  };
  playerWeaponDefaults.energyCost = 8;
  weaponDefinitions["laser-rifle"].energyCost = 12;
  const turretLaserSpeed = 760;
  const turretLaserDamage = 24;
  const turretLaserKnockback = 210;
  const turretShootCooldown = 2.2;
  const turretRange = 560;
  const missileLauncherRange = 1120;
  const missileLauncherClusterRadius = 210;
  const missileLauncherMinClusterSize = 2;
  const missileLauncherProductionTime = 9.5;
  const missileLauncherLockDuration = 0.62;
  const missileLauncherEnergyCost = 22;
  const launcherMissileSpeed = 520;
  const launcherMissileTurnRate = 3.8;
  const launcherMissileLife = 5.8;
  const launcherMissileDamage = 68;
  const launcherMissileAoERadius = 220;
  const launcherMissileKnockback = 320;
  const structurePlacementTierThreshold = 500;
  const structureSurfaceOffset = 18;
  const structurePlacementLeeway = 72;
  const platingBlockWidth = 74;
  const platingBlockHeight = 28;
  const accumulatorRange = 680;
  const accumulatorForce = 620;
  const shieldGeneratorFieldPadding = 148;
  const shieldGeneratorActiveDuration = 0.5;
  const shieldGeneratorProjectileCost = 10;
  const shieldGeneratorLightningCost = 14;
  const shieldGeneratorRocketCost = 18;
  const shieldGeneratorPowerOutDuration = 1.45;
  const shieldGeneratorMobCost = 8;
  const shieldGeneratorMobCooldown = 0.16;
  const shieldGeneratorMobMinBounceSpeed = 155;
  const tetherGiveRadiusScale = 0.85;
  const tetherMinGive = 32;
  const tetherMaxGive = 220;
  const tetherSpring = 34;
  const tetherDamping = 9.5;
  const tetherMaxAcceleration = 760;
  const jetEnergyDrain = 9;
  const jetThrust = 620;
  const defaultToolId = "suction-gadget";
  const techTypes = [
    { key: "suction", label: "Suction Tech", color: "#58e2ff" },
    { key: "weapon", label: "Weapon Tech", color: "#ff73ad" },
    { key: "plating", label: "Plating Tech", color: "#ffd166" },
    { key: "energy", label: "Energy Tech", color: "#9dff7a" },
    { key: "repair", label: "Repair Tech", color: "#66e0b8" },
    { key: "target", label: "Target Tech", color: "#ffb858" },
    { key: "propulsion", label: "Propulsion Tech", color: "#a985ff" },
    { key: "shield", label: "Shield Tech", color: "#77a7ff" },
    { key: "communication", label: "Communication Tech", color: "#ffb86b" }
  ];
  const buildFilters = [
    { key: "all", label: "All" },
    { key: "tools", label: "Tools" },
    { key: "structures", label: "Structures" }
  ];
  const toolCatalog = [
    { id: defaultToolId, name: "Vacuum gadget", shortName: "Vacuum", color: "#58e2ff" },
    { id: "laser-pistol", name: "Laser pistol", shortName: "Pistol", color: "#ff73ad" },
    { id: "laser-rifle", name: "Laser rifle", shortName: "Rifle", color: "#ff73ad" },
    { id: "spanner", name: "Spanner", shortName: "Spanner", color: "#66e0b8" }
  ];
  const buildRecipes = [
    {
      id: defaultToolId,
      name: "Vacuum gadget",
      category: "tools",
      description: "Your default matter-moving gadget. Left click sucks objects inward, right click blows them away, and middle click steadies objects at reach while anchoring you in place.",
      cost: {},
      unlockToolId: defaultToolId,
      icon: "assets/vacuum-gadget.svg"
    },
    {
      id: "laser-pistol",
      name: "Laser pistol",
      category: "tools",
      description: "A compact sidearm that fires focused weapon-tech bolts.",
      cost: { weapon: 10, plating: 1 },
      unlockToolId: "laser-pistol",
      icon: "assets/laser-pistol.svg"
    },
    {
      id: "laser-rifle",
      name: "Laser rifle",
      category: "tools",
      description: "A long-barreled weapon that fires slower bolts through enemy lines.",
      cost: { weapon: 13, plating: 2, target: 3 },
      unlockToolId: "laser-rifle",
      icon: "assets/laser-rifle.svg"
    },
    {
      id: "spanner",
      name: "Spanner",
      category: "tools",
      description: "A repair tool that patches structures and dismantles mechanical mobs up close.",
      cost: { repair: 3, weapon: 10 },
      unlockToolId: "spanner",
      icon: "assets/spanner.svg"
    },
    {
      id: "plating-block",
      name: "Plating block",
      category: "structures",
      description: "A plated body segment that extends walkable surface and supports more plates.",
      cost: { plating: 4 },
      structureType: "plating-block",
      icon: "assets/plating-block.svg"
    },
    {
      id: "battery",
      name: "Battery",
      category: "structures",
      description: "A charged surface cell that increases its host body's energy recovery.",
      cost: { energy: 5, plating: 3 },
      structureType: "battery",
      icon: "assets/battery.svg"
    },
    {
      id: "accumulator",
      name: "Accumulator",
      category: "structures",
      description: "A suction-plated collector that pulls loose particles into its host body.",
      cost: { plating: 3, suction: 5 },
      structureType: "accumulator",
      icon: "assets/accumulator.svg"
    },
    {
      id: "turret",
      name: "Turret",
      category: "structures",
      description: "A folding surface turret that guards its host body from nearby mobs.",
      cost: { plating: 3, weapon: 5 },
      structureType: "turret",
      icon: "assets/turret.svg"
    },
    {
      id: "missile-launcher",
      name: "Missile launcher",
      category: "structures",
      description: "A plated launcher that fabricates guided missiles and fires them at clustered mobs.",
      cost: { plating: 5, weapon: 7, propulsion: 5, target: 4 },
      structureType: "missile-launcher",
      icon: "assets/missile-launcher.svg"
    },
    {
      id: "shield-generator",
      name: "Shield generator",
      category: "structures",
      description: "A shield-tech dome that blocks hostile fire and bounces mobs away from its host body while spending body energy.",
      cost: { plating: 4, shield: 5, energy: 3 },
      structureType: "shield-generator",
      icon: "assets/shield-generator.svg"
    },
    {
      id: "communication-relay",
      name: "Communication relay",
      category: "structures",
      description: "A paired relay that can form permanent friend links with other relay owners.",
      cost: { plating: 3, communication: 3 },
      structureType: "communication-relay",
      icon: "assets/communication-relay.svg"
    },
    {
      id: "jet",
      name: "Jet",
      category: "structures",
      description: "A surface thruster that pushes its host body forward with W or reverses with S while you are landed there.",
      cost: { plating: 4, propulsion: 5, energy: 2 },
      structureType: "jet",
      icon: "assets/jet.svg"
    },
    {
      id: "tether",
      name: "Tether",
      category: "structures",
      description: "A telescoping pole that links two bodies with a little springy give.",
      cost: { plating: 5, suction: 2, propulsion: 2 },
      structureType: "tether",
      icon: "assets/tether.svg"
    }
  ];
  const toolUpgradeDefinitions = {
    "laser-pistol": [
      { id: "damage", name: "Damage", techKey: "weapon", cost: 3, maxBonus: 0.9 },
      { id: "range", name: "Range", techKey: "target", cost: 3, maxBonus: 0.9 }
    ],
    "laser-rifle": [
      { id: "damage", name: "Damage", techKey: "weapon", cost: 5, maxBonus: 0.9 },
      { id: "range", name: "Range", techKey: "target", cost: 5, maxBonus: 0.9 }
    ],
    spanner: [
      { id: "repair-speed", name: "Repair speed", techKey: "repair", cost: 3, maxBonus: 1.15 },
      { id: "dismantle-speed", name: "Dismantle speed", techKey: "weapon", cost: 3, maxBonus: 1.15 }
    ],
    [defaultToolId]: [
      { id: "suck", name: "Suck strength", techKey: "suction", cost: 3, maxBonus: 1.2 },
      { id: "blow", name: "Blow strength", techKey: "propulsion", cost: 3, maxBonus: 1.2 }
    ]
  };
  const techInventory = {};
  const persistenceSaveInterval = 5;
  const persistencePollInterval = 15;
  const deathAnimationDuration = 2.45;
  const persistence = {
    enabled: Boolean(window.fetch),
    loadInFlight: false,
    saveInFlight: false,
    resetInFlight: false,
    online: false,
    storage: "none",
    saveTimer: persistenceSaveInterval,
    pollTimer: persistencePollInterval
  };
  const lifeStats = {
    startedAt: performance.now(),
    maxMass: 1,
    maxTierName: "particle",
    mobsDefeated: 0,
    techCollected: 0,
    mobScore: 0,
    currentScore: 0,
    bestScore: 0,
    bodyScore: 0,
    bestBodyScore: 0,
    scoredBodyMass: 0,
    bestScoredBodyMass: 0,
    scoredBodies: 0,
    bestScoredBodies: 0,
    absorbedParticleMass: 0,
    absorbedParticleCount: 0
  };
  const runState = {
    active: false,
    difficultyId: defaultDifficultyId
  };
  const deathState = {
    active: false,
    summaryReady: false,
    resetInFlight: false,
    leaderboardSubmitted: false,
    timer: 0,
    stats: null,
    cause: "Unknown impact"
  };
  const leaderboard = {
    open: false,
    entries: [],
    refreshInFlight: false,
    submitInFlight: false,
    lastRefreshAt: 0,
    submittedDeathKey: ""
  };
  const multiplayerSnapshotInterval = 0.25;
  const remoteSnapshotRenderDelay = multiplayerSnapshotInterval * 0.8;
  const remoteSnapshotExtrapolateLimit = multiplayerSnapshotInterval * 1.35;
  const remoteSnapshotBufferLimit = 6;
  const remoteEffectInterval = 0.18;
  const remoteStaleMs = 16000;
  const remoteUniverseAlphaScale = 0.32;
  const playerInteractionRange = 250;
  const playerInteractionChoicesConfig = [
    { key: "trade", label: "Trade", icon: "$", speech: "Trade?", emote: "swap" },
    { key: "truce", label: "Truce", icon: "!", speech: "Truce?", emote: "peace" },
    { key: "team", label: "Team", icon: "+", speech: "Team?", emote: "team" }
  ];
  const multiplayer = {
    enabled: Boolean(window.WebSocket),
    socket: null,
    connected: false,
    profile: null,
    universeId: "",
    bubbleRadius: 5000,
    onlineCount: 0,
    players: [],
    panelOpen: false,
    socialMode: "online",
    pendingSignal: null,
    remoteUniverses: new Map(),
    snapshotTimer: 0,
    effectTimer: 0,
    reconnectTimer: 0,
    reconnectDelay: 1.5,
    commandOpen: false,
    commandUnlocked: false,
    commandCompletions: [],
    commandCompletionIndex: 0,
    interactionMenu: null,
    incomingInteractions: new Map(),
    remoteEmotes: new Map(),
    truces: new Set(),
    trade: null
  };
  const bodyTiers = [
    { name: "particle", threshold: 0, article: "a", solid: false },
    { name: "rock", threshold: 10, article: "a", solid: false },
    { name: "boulder", threshold: 50, article: "a", solid: true },
    { name: "asteroid", threshold: 150, article: "an", solid: true },
    { name: "dwarf moon", threshold: 750, article: "a", solid: true },
    { name: "moon", threshold: 1500, article: "a", solid: true },
    { name: "planet", threshold: 7500, article: "a", solid: true }
  ];
  const funnelShape = {
    backX: 88,
    backHalf: 22,
    rimX: 134,
    rimHalf: 40,
    captureX: 111,
    wallThickness: 5
  };
  const gadgetForceReach = 560;
  const gadgetHoldReach = gadgetForceReach * 0.5;
  const gadgetStabilizedBreakSpeed = 18;
  const soundPreferenceKey = "clusternauts.sound.enabled";
  const legacySoundPreferenceKey = "spaice.sound.enabled";
  const soundState = {
    enabled: readSoundPreference(),
    context: null,
    masterGain: null,
    unavailable: false,
    unlocked: false,
    lastPlayed: Object.create(null)
  };

  let width = 1;
  let height = 1;
  let dpr = 1;
  let cameraZoom = gameSettings.zoom;
  let cameraRoll = 0;
  let gadgetAngle = -0.32;
  let lastTime = performance.now();
  let spawnTimer = 0;
  let nextParticleId = 1;
  let nextRivalId = 1;
  let nextUfoId = 1;
  let nextRambotId = 1;
  let nextEngineerId = 1;
  let nextTeslaId = 1;
  let nextRocketId = 1;
  let nextFighterId = 1;
  let nextStructureId = 1;
  let jumpQueued = false;
  let buildMenuOpen = false;
  let activePlacementRecipeId = null;
  let pendingTetherAnchor = null;
  let activeBuildFilter = "all";
  let selectedBuildRecipeId = buildRecipes[0] ? buildRecipes[0].id : null;
  let unlockedToolIds = [defaultToolId];
  let hotbarToolIds = [defaultToolId];
  let equippedToolId = defaultToolId;
  let toolUpgradeLevels = createDefaultToolUpgradeLevels();
  let toolFireCooldown = 0;
  let toolDisabledTimer = 0;
  const mobSpawnTimers = {
    alienoid: mobSpawnIntervals.alienoid,
    ufo: mobSpawnIntervals.ufo,
    rambot: mobSpawnIntervals.rambot,
    tesla: mobSpawnIntervals.tesla,
    engineer: mobSpawnIntervals.engineer,
    satellite: mobSpawnIntervals.satellite,
    rocket: mobSpawnIntervals.rocket,
    fighter: mobSpawnIntervals.fighter
  };
  const mobDefeatsByKind = {
    alienoid: 0,
    ufo: 0,
    rambot: 0,
    tesla: 0,
    engineer: 0,
    satellite: 0,
    rocket: 0,
    fighter: 0
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

  function readMigratedLocalStorage(currentKey, legacyKey) {
    const current = window.localStorage.getItem(currentKey);
    if (current !== null) {
      return current;
    }

    const legacy = legacyKey ? window.localStorage.getItem(legacyKey) : null;
    if (legacy !== null) {
      window.localStorage.setItem(currentKey, legacy);
    }
    return legacy;
  }

  function removeMigratedLocalStorage(currentKey, legacyKey) {
    window.localStorage.removeItem(currentKey);
    if (legacyKey) {
      window.localStorage.removeItem(legacyKey);
    }
  }

  function readStoredAccountSession() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(accountSessionStorageKey) || "null");
      if (!stored || typeof stored !== "object") {
        return null;
      }
      const token = typeof stored.token === "string" ? stored.token : "";
      const username = sanitizeAccountUsername(stored.username);
      const crazyGamesLinked = stored.crazyGamesLinked === true;
      return token && username ? { token, username, crazyGamesLinked } : null;
    } catch {
      return null;
    }
  }

  function writeStoredAccountSession() {
    try {
      if (!accountState.token || !accountState.username) {
        window.localStorage.removeItem(accountSessionStorageKey);
        return;
      }

      window.localStorage.setItem(accountSessionStorageKey, JSON.stringify({
        token: accountState.token,
        username: accountState.username,
        crazyGamesLinked: accountState.crazyGamesLinked === true
      }));
    } catch {
      // Local storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function sanitizeAccountUsername(name) {
    return String(name || "").toLowerCase().replace(/[^\w.-]/g, "").slice(0, 24);
  }

  function readGameSettings() {
    const defaults = {
      uiScale: 1,
      zoom: 0.62,
      surfaceCameraRotation: false,
      controls: Object.assign({}, defaultControlBindings)
    };

    try {
      const stored = JSON.parse(readMigratedLocalStorage(settingsStorageKey, legacySettingsStorageKey) || "null");
      if (!stored || typeof stored !== "object") {
        return defaults;
      }

      const storedZoom = Number(stored.zoom);
      const zoom = storedZoom === 1 ? defaults.zoom : storedZoom;

      return {
        uiScale: clamp(Number(stored.uiScale) || defaults.uiScale, 0.8, 1.3),
        zoom: clamp(zoom || defaults.zoom, 0.4, 1.75),
        surfaceCameraRotation: stored.surfaceCameraRotation === true,
        controls: normalizeControlBindings(stored.controls)
      };
    } catch (error) {
      return defaults;
    }
  }

  function writeGameSettings() {
    try {
      window.localStorage.setItem(settingsStorageKey, JSON.stringify({
        uiScale: gameSettings.uiScale,
        zoom: gameSettings.zoom,
        surfaceCameraRotation: gameSettings.surfaceCameraRotation,
        controls: gameSettings.controls
      }));
    } catch (error) {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function normalizeControlBindings(source) {
    const controls = Object.assign({}, defaultControlBindings);
    const snapshot = source && typeof source === "object" ? source : {};

    for (const action of Object.keys(defaultControlBindings)) {
      if (typeof snapshot[action] === "string" && snapshot[action]) {
        controls[action] = snapshot[action];
      }
    }

    if (snapshot.build === "KeyB") {
      for (const action of Object.keys(controls)) {
        if (action !== "build" && controls[action] === defaultControlBindings.build) {
          controls[action] = "KeyB";
        }
      }
      controls.build = defaultControlBindings.build;
    }

    return controls;
  }

  function syncControlBindings() {
    const controls = normalizeControlBindings(gameSettings.controls);
    gameSettings.controls = controls;

    movementKeyAliases.up = [controls.up, "ArrowUp"].filter(Boolean);
    movementKeyAliases.down = [controls.down, "ArrowDown"].filter(Boolean);
    movementKeyAliases.left = [controls.left, "ArrowLeft"].filter(Boolean);
    movementKeyAliases.right = [controls.right, "ArrowRight"].filter(Boolean);

    movementControlCodes.clear();
    for (const codes of Object.values(movementKeyAliases)) {
      for (const code of codes) {
        movementControlCodes.add(code);
      }
    }
  }

  function controlCodeFor(action) {
    return gameSettings.controls[action] || defaultControlBindings[action] || "";
  }

  function isControlPressed(action) {
    const code = controlCodeFor(action);
    return Boolean(code && keys.has(code));
  }

  function formatControlCode(code) {
    const labels = {
      Space: "Space",
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      NumpadAdd: "Numpad +",
      NumpadSubtract: "Numpad -"
    };

    if (labels[code]) {
      return labels[code];
    }
    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3);
    }
    if (/^Digit[0-9]$/.test(code)) {
      return code.slice(5);
    }
    if (/^Numpad[0-9]$/.test(code)) {
      return "Numpad " + code.slice(6);
    }
    return code || "Unbound";
  }

  function applyUiScale(scale) {
    gameSettings.uiScale = clamp(Number(scale) || 1, 0.8, 1.3);
    document.documentElement.style.setProperty("--ui-scale", gameSettings.uiScale.toFixed(2));

    if (uiScaleInput) {
      uiScaleInput.value = String(Math.round(gameSettings.uiScale * 100));
    }
    if (uiScaleValue) {
      uiScaleValue.textContent = Math.round(gameSettings.uiScale * 100) + "%";
    }
  }

  function renderControlBindings() {
    if (!controlBindingsList) {
      return;
    }

    controlBindingsList.textContent = "";
    for (const binding of controlBindingLabels) {
      const row = document.createElement("div");
      const label = document.createElement("span");
      const button = document.createElement("button");
      const code = controlCodeFor(binding.action);

      row.className = "settings-row";
      label.className = "settings-row__label";
      label.textContent = binding.label;
      button.className = "settings-row__key";
      button.type = "button";
      button.dataset.controlAction = binding.action;
      button.textContent = pendingControlRemap === binding.action ? "Press key" : formatControlCode(code);
      button.classList.toggle("is-listening", pendingControlRemap === binding.action);
      button.setAttribute("aria-label", "Remap " + binding.label);

      row.append(label, button);
      controlBindingsList.append(row);
    }
  }

  function updateZoomUi() {
    if (zoomInput) {
      zoomInput.value = String(Math.round(cameraZoomToSliderValue(cameraZoom)));
    }
    if (zoomValue) {
      zoomValue.textContent = Math.round(cameraZoom * 100) + "%";
    }
  }

  function updateSurfaceCameraRotationUi() {
    if (surfaceCameraRotationInput) {
      surfaceCameraRotationInput.checked = Boolean(gameSettings.surfaceCameraRotation);
    }
  }

  function surfaceCameraRollForAngle(angle) {
    return gameSettings.surfaceCameraRotation ? cameraRollForSurfaceAngle(angle) : 0;
  }

  function applySurfaceCameraRotationSetting(enabled) {
    gameSettings.surfaceCameraRotation = Boolean(enabled);
    updateSurfaceCameraRotationUi();
    if (player.landed) {
      cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
    }
    writeGameSettings();
  }

  function setSettingsOpen(open) {
    settingsOpen = Boolean(open);
    pendingControlRemap = null;
    setGamePaused(settingsOpen);

    if (settingsPanel) {
      settingsPanel.classList.toggle("is-open", settingsOpen);
      settingsPanel.setAttribute("aria-hidden", settingsOpen ? "false" : "true");
    }
    if (settingsToggle) {
      settingsToggle.classList.toggle("is-active", settingsOpen);
      settingsToggle.setAttribute("aria-expanded", settingsOpen ? "true" : "false");
      settingsToggle.setAttribute("aria-label", settingsOpen ? "Close settings" : "Open settings");
    }

    if (settingsOpen) {
      setLeaderboardOpen(false);
      setBuildMenuOpen(false);
      setSocialPanelOpen(false);
      resetMouseButtons();
      void refreshAccountSaves();
    }

    renderControlBindings();
  }

  function remapControl(action, code) {
    if (!defaultControlBindings[action] || !code || code === "Escape") {
      pendingControlRemap = null;
      renderControlBindings();
      return;
    }

    const previousCode = gameSettings.controls[action];
    for (const key of Object.keys(gameSettings.controls)) {
      if (key !== action && gameSettings.controls[key] === code) {
        gameSettings.controls[key] = previousCode && previousCode !== code ? previousCode : defaultControlBindings[key];
      }
    }

    gameSettings.controls[action] = code;
    syncControlBindings();
    keys.clear();
    pendingControlRemap = null;
    writeGameSettings();
    renderControlBindings();
  }

  function resetControlBindings() {
    gameSettings.controls = Object.assign({}, defaultControlBindings);
    syncControlBindings();
    keys.clear();
    pendingControlRemap = null;
    writeGameSettings();
    renderControlBindings();
  }

  function length(x, y) {
    return Math.hypot(x, y);
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function resetMouseButtons() {
    mouse.left = false;
    mouse.middle = false;
    mouse.right = false;
  }

  function isGadgetButtonPressed() {
    return mouse.left || mouse.middle || mouse.right;
  }

  function isVacuumHoldActive() {
    return canUseSuctionControls() && mouse.middle;
  }

  function rotatePoint(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      x: x * c - y * s,
      y: x * s + y * c
    };
  }

  const cameraZoomMin = 0.4;
  const cameraZoomDefault = 0.62;
  const cameraZoomMax = 1.75;
  const cameraZoomSliderMid = 100;
  const cameraZoomSliderMax = 200;
  const cameraZoomStep = 1.12;

  function sliderValueToCameraZoom(value) {
    const sliderValue = clamp(Number(value) || 0, 0, cameraZoomSliderMax);
    if (sliderValue <= cameraZoomSliderMid) {
      return cameraZoomMin + (cameraZoomDefault - cameraZoomMin) * (sliderValue / cameraZoomSliderMid);
    }
    return cameraZoomDefault + (cameraZoomMax - cameraZoomDefault) * ((sliderValue - cameraZoomSliderMid) / cameraZoomSliderMid);
  }

  function cameraZoomToSliderValue(zoom) {
    const clampedZoom = clamp(Number(zoom) || cameraZoomDefault, cameraZoomMin, cameraZoomMax);
    if (clampedZoom <= cameraZoomDefault) {
      return ((clampedZoom - cameraZoomMin) / (cameraZoomDefault - cameraZoomMin)) * cameraZoomSliderMid;
    }
    return cameraZoomSliderMid + ((clampedZoom - cameraZoomDefault) / (cameraZoomMax - cameraZoomDefault)) * cameraZoomSliderMid;
  }

  function setCameraZoom(nextZoom) {
    cameraZoom = clamp(nextZoom, cameraZoomMin, cameraZoomMax);
    gameSettings.zoom = cameraZoom;
    updateZoomUi();
    writeGameSettings();
  }

  function adjustCameraZoom(direction) {
    const multiplier = direction > 0 ? cameraZoomStep : 1 / cameraZoomStep;
    setCameraZoom(cameraZoom * multiplier);
  }

  function cameraRollForSurfaceAngle(angle) {
    return -angle - Math.PI / 2;
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

  function ejectedParticleColor(body) {
    const base = body && body.color ? body.color : randomParticleColor();
    return mixColor(base, randomParticleColor(), 3, 1);
  }

  function readSoundPreference() {
    try {
      return readMigratedLocalStorage(soundPreferenceKey, legacySoundPreferenceKey) !== "off";
    } catch (error) {
      return true;
    }
  }

  function writeSoundPreference() {
    try {
      window.localStorage.setItem(soundPreferenceKey, soundState.enabled ? "on" : "off");
    } catch (error) {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function updateSoundToggle() {
    if (!soundToggle) {
      return;
    }

    const audioAllowed = isGameAudioAllowed();
    soundToggle.classList.toggle("is-active", audioAllowed);
    soundToggle.classList.toggle("is-muted", !audioAllowed);
    soundToggle.setAttribute("aria-pressed", soundState.enabled ? "true" : "false");
    soundToggle.setAttribute("aria-label", soundState.enabled ? "Mute sound effects" : "Unmute sound effects");
    soundToggle.textContent = audioAllowed ? "SFX On" : "SFX Off";
  }

  function isGameAudioAllowed() {
    return soundState.enabled && !crazyGamesState.muteAudio;
  }

  function syncMasterGain() {
    if (soundState.masterGain) {
      soundState.masterGain.gain.value = isGameAudioAllowed() ? 0.72 : 0;
    }
  }

  function ensureAudioContext() {
    if (!soundState.enabled || soundState.unavailable) {
      return null;
    }

    if (!soundState.context) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) {
        return null;
      }

      try {
        const context = new AudioContextConstructor();
        const masterGain = context.createGain();
        masterGain.connect(context.destination);
        soundState.context = context;
        soundState.masterGain = masterGain;
        syncMasterGain();
      } catch (error) {
        soundState.unavailable = true;
        soundState.context = null;
        soundState.masterGain = null;
        soundState.unlocked = false;
        console.warn("Clusternauts audio unavailable.", error);
        return null;
      }
    }

    return soundState.context;
  }

  function unlockAudio() {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }
    soundState.unlocked = true;
    updateSoundToggle();
  }

  function setSoundEnabled(enabled) {
    soundState.enabled = Boolean(enabled);
    writeSoundPreference();
    syncMasterGain();
    updateSoundToggle();

    if (!isGameAudioAllowed()) {
      return;
    }

    unlockAudio();
    playSound("ui", { throttle: 0 });
  }

  function setCrazyGamesAudioMuted(muted) {
    crazyGamesState.muteAudio = Boolean(muted);
    syncMasterGain();
    updateSoundToggle();
  }

  function canPlaySound(key, throttle) {
    if (!isGameAudioAllowed()) {
      return false;
    }

    const context = ensureAudioContext();
    if (!context || !soundState.unlocked) {
      return false;
    }

    const now = context.currentTime;
    const interval = Number.isFinite(throttle) ? throttle : 0.04;
    if (key && now - (soundState.lastPlayed[key] || -Infinity) < interval) {
      return false;
    }

    if (key) {
      soundState.lastPlayed[key] = now;
    }
    return true;
  }

  function connectSoundNode(node) {
    if (soundState.masterGain) {
      node.connect(soundState.masterGain);
    }
  }

  function playTone(options) {
    const context = ensureAudioContext();
    if (!context || !soundState.unlocked) {
      return;
    }

    try {
      const delay = Math.max(0, finiteOr(options.delay, 0));
      const duration = Math.max(0.02, finiteOr(options.duration, 0.16));
      const gainAmount = Math.max(0.0001, finiteOr(options.gain, 0.04));
      const frequency = Math.max(1, finiteOr(options.frequency, 440));
      const endFrequency = Math.max(1, finiteOr(options.endFrequency, frequency));
      const attack = Math.max(0.002, Math.min(duration * 0.45, finiteOr(options.attack, 0.01)));
      const start = context.currentTime + delay;
      const end = start + duration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = options.type || "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
      if (Number.isFinite(options.detune) && oscillator.detune) {
        oscillator.detune.setValueAtTime(options.detune, start);
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainAmount, start + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      connectSoundNode(gain);
      oscillator.start(start);
      oscillator.stop(end + 0.03);
    } catch (error) {
      soundState.unavailable = true;
      console.warn("Clusternauts tone skipped.", error);
    }
  }

  function playNoise(options) {
    const context = ensureAudioContext();
    if (!context || !soundState.unlocked) {
      return;
    }

    try {
      const delay = Math.max(0, finiteOr(options.delay, 0));
      const duration = Math.max(0.02, finiteOr(options.duration, 0.18));
      const gainAmount = Math.max(0.0001, finiteOr(options.gain, 0.04));
      const sampleRate = Math.max(1, finiteOr(context.sampleRate, 44100));
      const start = context.currentTime + delay;
      const end = start + duration;
      const buffer = context.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.65);
      }

      source.buffer = buffer;
      filter.type = options.filterType || "bandpass";
      filter.frequency.setValueAtTime(Math.max(40, finiteOr(options.frequency, 900)), start);
      filter.Q.setValueAtTime(Math.max(0.1, finiteOr(options.q, 1.4)), start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainAmount, start + Math.min(0.015, duration * 0.4));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      source.connect(filter);
      filter.connect(gain);
      connectSoundNode(gain);
      source.start(start);
      source.stop(end + 0.03);
    } catch (error) {
      soundState.unavailable = true;
      console.warn("Clusternauts noise skipped.", error);
    }
  }

  function soundThrottleFor(name) {
    const throttles = {
      select: 0.06,
      laser: 0.08,
      turret: 0.12,
      lock: 0.12,
      enemyLaser: 0.18,
      fighter: 0.12,
      hit: 0.18,
      mobHit: 0.08,
      merge: 0.09,
      pickupHealth: 0.08,
      pickupTech: 0.05,
      shield: 0.16,
      detach: 0.16,
      landing: 0.16
    };
    return throttles[name] || 0.04;
  }

  function playSound(name, options) {
    const settings = options || {};
    const volume = Math.max(0, finiteOr(settings.volume, 1));
    const throttle = Number.isFinite(settings.throttle) ? settings.throttle : soundThrottleFor(name);
    if (!canPlaySound(settings.throttleKey || name, throttle)) {
      return;
    }

    if (name === "ui") {
      playTone({ frequency: 460, endFrequency: 620, duration: 0.08, gain: 0.018 * volume, type: "triangle" });
    } else if (name === "select") {
      playTone({ frequency: 520, endFrequency: 360, duration: 0.07, gain: 0.02 * volume, type: "square" });
    } else if (name === "gadgetSuck") {
      playNoise({ duration: 0.11, gain: 0.026 * volume, frequency: 720, filterType: "lowpass", q: 0.9 });
      playTone({ frequency: 260, endFrequency: 118, duration: 0.14, gain: 0.024 * volume, type: "triangle" });
    } else if (name === "gadgetBlow") {
      playNoise({ duration: 0.13, gain: 0.034 * volume, frequency: 520, filterType: "lowpass", q: 0.7 });
      playTone({ frequency: 128, endFrequency: 245, duration: 0.12, gain: 0.022 * volume, type: "sawtooth" });
    } else if (name === "craft") {
      playTone({ frequency: 420, endFrequency: 640, duration: 0.1, gain: 0.032 * volume, type: "triangle" });
      playTone({ frequency: 640, endFrequency: 920, duration: 0.12, gain: 0.026 * volume, delay: 0.06, type: "triangle" });
      playTone({ frequency: 920, endFrequency: 1180, duration: 0.14, gain: 0.02 * volume, delay: 0.13, type: "sine" });
    } else if (name === "place") {
      playNoise({ duration: 0.12, gain: 0.04 * volume, frequency: 240, filterType: "lowpass", q: 0.8 });
      playTone({ frequency: 160, endFrequency: 115, duration: 0.16, gain: 0.03 * volume, type: "triangle" });
    } else if (name === "landing") {
      playTone({ frequency: 220, endFrequency: 132, duration: 0.16, gain: 0.028 * volume, type: "triangle" });
      playNoise({ duration: 0.08, gain: 0.018 * volume, frequency: 520, filterType: "lowpass" });
    } else if (name === "detach") {
      playNoise({ duration: 0.14, gain: 0.026 * volume, frequency: 840, q: 0.7 });
      playTone({ frequency: 180, endFrequency: 320, duration: 0.13, gain: 0.018 * volume, type: "sine" });
    } else if (name === "laser") {
      playTone({ frequency: 980, endFrequency: 1480, duration: 0.08, gain: 0.034 * volume, type: "sawtooth" });
      playNoise({ duration: 0.06, gain: 0.014 * volume, frequency: 2300, q: 2.2 });
    } else if (name === "turret") {
      playTone({ frequency: 760, endFrequency: 1120, duration: 0.07, gain: 0.025 * volume, type: "sawtooth" });
    } else if (name === "lock") {
      playTone({ frequency: 1180, endFrequency: 1420, duration: 0.08, gain: 0.022 * volume, type: "square" });
      playTone({ frequency: 1620, endFrequency: 1320, duration: 0.08, gain: 0.018 * volume, delay: 0.075, type: "triangle" });
    } else if (name === "enemyLaser") {
      playTone({ frequency: 520, endFrequency: 360, duration: 0.11, gain: 0.024 * volume, type: "square" });
      playNoise({ duration: 0.08, gain: 0.012 * volume, frequency: 1600, q: 1.6 });
    } else if (name === "lightning") {
      playNoise({ duration: 0.18, gain: 0.05 * volume, frequency: 2600, q: 4.5 });
      playTone({ frequency: 1700, endFrequency: 520, duration: 0.16, gain: 0.024 * volume, type: "square" });
    } else if (name === "missile") {
      playNoise({ duration: 0.2, gain: 0.038 * volume, frequency: 340, filterType: "lowpass", q: 0.7 });
      playTone({ frequency: 130, endFrequency: 86, duration: 0.22, gain: 0.032 * volume, type: "sawtooth" });
    } else if (name === "fighter") {
      playTone({ frequency: 720, endFrequency: 520, duration: 0.05, gain: 0.022 * volume, type: "square" });
      playTone({ frequency: 760, endFrequency: 540, duration: 0.05, gain: 0.018 * volume, delay: 0.035, type: "square" });
    } else if (name === "hit") {
      playNoise({ duration: 0.15, gain: 0.045 * volume, frequency: 420, filterType: "lowpass", q: 0.9 });
      playTone({ frequency: 150, endFrequency: 86, duration: 0.18, gain: 0.035 * volume, type: "triangle" });
    } else if (name === "mobHit") {
      playNoise({ duration: 0.08, gain: 0.026 * volume, frequency: 1250, q: 1.9 });
      playTone({ frequency: 390, endFrequency: 260, duration: 0.08, gain: 0.018 * volume, type: "triangle" });
    } else if (name === "mobDestroyed") {
      playNoise({ duration: 0.2, gain: 0.045 * volume, frequency: 760, q: 1.2 });
      playTone({ frequency: 520, endFrequency: 190, duration: 0.22, gain: 0.032 * volume, type: "sawtooth" });
    } else if (name === "merge") {
      playTone({ frequency: 180, endFrequency: 260, duration: 0.16, gain: 0.026 * volume, type: "triangle" });
      playTone({ frequency: 360, endFrequency: 520, duration: 0.18, gain: 0.018 * volume, delay: 0.05, type: "sine" });
    } else if (name === "milestone") {
      playTone({ frequency: 240, endFrequency: 360, duration: 0.18, gain: 0.034 * volume, type: "triangle" });
      playTone({ frequency: 480, endFrequency: 860, duration: 0.26, gain: 0.03 * volume, delay: 0.08, type: "sine" });
    } else if (name === "pickupHealth") {
      playTone({ frequency: 520, endFrequency: 760, duration: 0.1, gain: 0.024 * volume, type: "triangle" });
      playTone({ frequency: 760, endFrequency: 960, duration: 0.12, gain: 0.018 * volume, delay: 0.055, type: "sine" });
    } else if (name === "pickupTech") {
      playTone({ frequency: 740, endFrequency: 1160, duration: 0.08, gain: 0.022 * volume, type: "sine" });
      playTone({ frequency: 1240, endFrequency: 1820, duration: 0.1, gain: 0.016 * volume, delay: 0.045, type: "triangle" });
    } else if (name === "shield") {
      playTone({ frequency: 300, endFrequency: 920, duration: 0.16, gain: 0.03 * volume, type: "triangle" });
      playNoise({ duration: 0.1, gain: 0.018 * volume, frequency: 1800, q: 3.2 });
    } else if (name === "jam") {
      playTone({ frequency: 110, endFrequency: 98, duration: 0.26, gain: 0.035 * volume, type: "sawtooth" });
      playNoise({ duration: 0.22, gain: 0.028 * volume, frequency: 1900, q: 4.4 });
    } else if (name === "death") {
      playNoise({ duration: 0.44, gain: 0.07 * volume, frequency: 280, filterType: "lowpass", q: 0.8 });
      playTone({ frequency: 220, endFrequency: 42, duration: 0.72, gain: 0.058 * volume, type: "sawtooth" });
      playTone({ frequency: 650, endFrequency: 120, duration: 0.5, gain: 0.032 * volume, delay: 0.08, type: "triangle" });
    }
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

  function thresholdForTierName(name) {
    const tier = bodyTiers.find((candidate) => candidate.name === name);
    return tier ? tier.threshold : 0;
  }

  function bodyTierForCommandToken(token) {
    const normalized = String(token || "")
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
    return bodyTiers.find((candidate) => candidate.name === normalized) || null;
  }

  function isAsteroidOrLarger(particle) {
    return particle && particle.tier && particle.tier.threshold >= thresholdForTierName("asteroid");
  }

  function formatTierName(name) {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
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

  function solidBodyContactRadius(body) {
    const radius = Math.max(0, finiteOr(body && body.radius, 0));
    if (!body || !body.tier || !body.tier.solid) {
      return radius;
    }

    if (body.tier.name === "planet") {
      return radius * 1.02;
    }

    return radius * 0.92;
  }

  function pluralizeBodyName(name) {
    if (name === "dwarf moon") {
      return "dwarf moons";
    }
    if (name === "particle") {
      return "particles";
    }
    return name + "s";
  }

  function pluralizeMobName(name) {
    if (name === "UFO") {
      return "UFOs";
    }
    if (name.endsWith("ship")) {
      return name + "s";
    }
    return name + "s";
  }

  function bodyDefeatNotificationOptions(mob, body, verb) {
    const mobLabel = mobName(mob);
    const bodyName = body && body.tier ? body.tier.name : "body";
    const bodyArticle = body && body.tier ? body.tier.article : "a";
    const capitalVerb = verb.charAt(0).toUpperCase() + verb.slice(1);

    return {
      groupKey: "body-defeat:" + verb + ":" + mob.kind + ":" + bodyName,
      format: function (count) {
        if (count === 1) {
          return mobLabel + " " + verb + " by " + bodyArticle + " " + bodyName + ".";
        }
        return capitalVerb + " " + count + " " + pluralizeMobName(mobLabel) + " with " + pluralizeBodyName(bodyName) + ".";
      }
    };
  }

  function notificationIncrement(options) {
    const increment = Number(options && options.increment);
    return Number.isFinite(increment) ? Math.max(1, Math.floor(increment)) : 1;
  }

  function notificationInitialCount(options) {
    const count = Number(options && options.initialCount);
    return Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  }

  function notificationLifetime(options) {
    const lifetime = Number(options && options.lifetime);
    return Number.isFinite(lifetime) ? Math.max(700, lifetime) : 2200;
  }

  function scheduleNotificationRemoval(element, groupKey, options) {
    const group = groupKey ? notificationGroups.get(groupKey) : null;
    const lifetime = notificationLifetime(options);

    if (group) {
      window.clearTimeout(group.leaveTimer);
      window.clearTimeout(group.removeTimer);
      group.leaveTimer = window.setTimeout(function () {
        element.classList.add("is-leaving");
      }, lifetime);
      group.removeTimer = window.setTimeout(function () {
        if (notificationGroups.get(groupKey) === group) {
          notificationGroups.delete(groupKey);
        }
        element.remove();
      }, lifetime + 400);
      return;
    }

    window.setTimeout(function () {
      element.classList.add("is-leaving");
    }, lifetime);

    window.setTimeout(function () {
      element.remove();
    }, lifetime + 400);
  }

  function maybeNotifyText(message, options) {
    const groupKey = options && options.groupKey ? String(options.groupKey) : "";
    const formatter = options && typeof options.format === "function" ? options.format : null;

    if (groupKey && notificationGroups.has(groupKey)) {
      const group = notificationGroups.get(groupKey);
      group.count += notificationIncrement(options);
      group.format = formatter || group.format;
      group.element.classList.remove("is-leaving");
      group.element.textContent = group.format ? group.format(group.count) : message;
      scheduleNotificationRemoval(group.element, groupKey, options);
      return;
    }

    const element = document.createElement("div");
    const initialCount = notificationInitialCount(options);
    element.className = "notification";
    element.textContent = formatter ? formatter(initialCount) : message;
    notifications.appendChild(element);

    if (groupKey) {
      notificationGroups.set(groupKey, {
        element,
        count: initialCount,
        format: formatter,
        leaveTimer: 0,
        removeTimer: 0
      });
    }

    scheduleNotificationRemoval(element, groupKey, options);
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

  function isEditableEventTarget(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName;
    return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function isBrowserScrollKey(event) {
    return event.code === "ArrowUp" || event.code === "ArrowDown" || event.code === "Space";
  }

  function isKeyboardControlEventTarget(event) {
    const target = event.target;
    return target instanceof HTMLElement && Boolean(target.closest("button, a[href], [role='button'], [role='link'], [role='menuitem'], [role='tab']"));
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

  function recipeByStructureType(type) {
    return buildRecipes.find((recipe) => recipe.structureType === type) || null;
  }

  function createDefaultToolUpgradeLevels() {
    const levels = {};
    for (const [toolId, upgrades] of Object.entries(toolUpgradeDefinitions)) {
      levels[toolId] = {};
      for (const upgrade of upgrades) {
        levels[toolId][upgrade.id] = 0;
      }
    }
    return levels;
  }

  function normalizeToolUpgrades(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    const levels = createDefaultToolUpgradeLevels();

    for (const [toolId, upgrades] of Object.entries(toolUpgradeDefinitions)) {
      const toolLevels = snapshot[toolId] && typeof snapshot[toolId] === "object" ? snapshot[toolId] : {};
      for (const upgrade of upgrades) {
        levels[toolId][upgrade.id] = Math.max(0, finiteOr(toolLevels[upgrade.id], 0));
      }
    }

    return levels;
  }

  function toolUpgradeOptions(toolId) {
    return toolUpgradeDefinitions[toolId] || [];
  }

  function toolUpgradeById(toolId, upgradeId) {
    return toolUpgradeOptions(toolId).find((upgrade) => upgrade.id === upgradeId) || null;
  }

  function toolUpgradeLevel(toolId, upgradeId) {
    const toolLevels = toolUpgradeLevels[toolId] || {};
    return Math.max(0, finiteOr(toolLevels[upgradeId], 0));
  }

  function upgradeBonus(level, maxBonus) {
    return Math.max(0, finiteOr(maxBonus, 0)) * (1 - Math.pow(0.72, Math.max(0, level)));
  }

  function toolUpgradeBonus(toolId, upgradeId) {
    const upgrade = toolUpgradeById(toolId, upgradeId);
    return upgrade ? upgradeBonus(toolUpgradeLevel(toolId, upgrade.id), upgrade.maxBonus) : 0;
  }

  function toolUpgradeFactor(toolId, upgradeId) {
    return 1 + toolUpgradeBonus(toolId, upgradeId);
  }

  function formatUpgradeBonus(value) {
    const percent = Math.max(0, value) * 100;

    if (percent > 0 && percent < 0.1) {
      return "+<0.1%";
    }

    const decimals = percent < 1 ? 2 : 1;
    return "+" + percent.toFixed(decimals).replace(/\.0$/, "") + "%";
  }

  function formatUpgradeLevel(value) {
    const level = Math.max(0, value);
    return Number.isInteger(level) ? String(level) : level.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function canAffordUpgrade(upgrade) {
    return upgrade && Math.floor(techInventory[upgrade.techKey] || 0) >= upgrade.cost;
  }

  function spendUpgradeCost(upgrade) {
    techInventory[upgrade.techKey] = Math.max(0, Math.floor(techInventory[upgrade.techKey] || 0) - upgrade.cost);
  }

  function upgradeTool(toolId, upgradeId) {
    const upgrade = toolUpgradeById(toolId, upgradeId);
    if (!upgrade || !hasTool(toolId) || !canAffordUpgrade(upgrade)) {
      return;
    }

    spendUpgradeCost(upgrade);
    if (!toolUpgradeLevels[toolId]) {
      toolUpgradeLevels[toolId] = {};
    }
    toolUpgradeLevels[toolId][upgrade.id] = toolUpgradeLevel(toolId, upgrade.id) + 1;
    updateTechUi();
    playSound("craft");
    maybeNotifyText(toolById(toolId).shortName + " " + upgrade.name.toLowerCase() + " upgraded.");
  }

  function equippedTool() {
    return toolById(equippedToolId);
  }

  function areToolsDisabled() {
    return toolDisabledTimer > 0;
  }

  function isSuctionEquipped() {
    return equippedToolId === defaultToolId;
  }

  function canUseSuctionControls() {
    return isSuctionEquipped() && !areToolsDisabled() && hasPlayerEnergy();
  }

  function hasVacuumBucketCollider() {
    return isSuctionEquipped();
  }

  function isSpannerEquipped() {
    return equippedToolId === "spanner" && !areToolsDisabled() && hasPlayerEnergy();
  }

  function weaponByToolId(toolId) {
    const base = weaponDefinitions[toolId] || null;
    if (!base) {
      return null;
    }

    const rangeFactor = toolUpgradeFactor(toolId, "range");
    return {
      ...base,
      damage: base.damage * toolUpgradeFactor(toolId, "damage"),
      life: base.life * rangeFactor
    };
  }

  function equippedWeapon() {
    return weaponByToolId(equippedToolId);
  }

  function isWeaponTool(toolId) {
    return Boolean(weaponDefinitions[toolId]);
  }

  function isMechanicalMob(mob) {
    return mob && ["ufo", "rambot", "satellite", "rocket", "fighter"].includes(mob.kind);
  }

  function hasTool(toolId) {
    return unlockedToolIds.includes(toolId);
  }

  function isToolEquipped(toolId) {
    return hotbarToolIds.includes(toolId);
  }

  function currentSpannerRepairRate() {
    return spannerRepairRate * toolUpgradeFactor("spanner", "repair-speed");
  }

  function currentSpannerDismantleRate() {
    return spannerDismantleRate * toolUpgradeFactor("spanner", "dismantle-speed");
  }

  function currentSpannerStrikeCooldown() {
    return spannerStrikeCooldown / toolUpgradeFactor("spanner", "dismantle-speed");
  }

  function currentGadgetSuckFactor() {
    return toolUpgradeFactor(defaultToolId, "suck");
  }

  function currentGadgetBlowFactor() {
    return toolUpgradeFactor(defaultToolId, "blow");
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

  function buildRecipeActionText(recipe) {
    if (isRecipeUnlocked(recipe)) {
      return isToolEquipped(recipe.unlockToolId) ? "Unequip" : "Equip";
    }

    if (isStructureRecipe(recipe)) {
      return canAffordRecipe(recipe) ? "Place" : "Needs tech";
    }

    return canAffordRecipe(recipe) ? "Craft" : "Needs tech";
  }

  function isBuildRecipeActionAvailable(recipe) {
    return isRecipeUnlocked(recipe) || canAffordRecipe(recipe);
  }

  function upgradeActionText(toolId, upgrade) {
    if (!hasTool(toolId)) {
      return "Craft tool first";
    }
    return canAffordUpgrade(upgrade) ? "Upgrade" : "Needs tech";
  }

  function createCostRow(techKey, amount) {
    const tech = techByKey(techKey);
    const row = document.createElement("div");
    const label = document.createElement("dt");
    const value = document.createElement("dd");
    const owned = Math.floor(techInventory[techKey] || 0);

    row.className = "build-detail__cost-row";
    row.style.setProperty("--tech-color", tech ? tech.color : "#dffcff");
    label.textContent = tech ? tech.label : techKey;
    value.textContent = owned + "/" + amount;
    value.classList.toggle("is-short", owned < amount);

    row.append(label, value);
    return row;
  }

  function createToolUpgradeSection(recipe) {
    const toolId = recipe && recipe.unlockToolId;
    const upgrades = toolId ? toolUpgradeOptions(toolId) : [];
    if (!upgrades.length) {
      return null;
    }

    const section = document.createElement("div");
    const title = document.createElement("span");

    section.className = "build-detail__upgrades";
    title.className = "build-detail__section-title";
    title.textContent = "Upgrades";
    section.append(title);

    for (const upgrade of upgrades) {
      const level = toolUpgradeLevel(toolId, upgrade.id);
      const currentBonus = upgradeBonus(level, upgrade.maxBonus);
      const nextBonus = upgradeBonus(level + 1, upgrade.maxBonus);
      const row = document.createElement("div");
      const summary = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      const cost = document.createElement("dl");
      const action = document.createElement("button");

      row.className = "build-upgrade";
      row.classList.toggle("is-disabled", !hasTool(toolId));
      summary.className = "build-upgrade__summary";
      name.className = "build-upgrade__name";
      meta.className = "build-upgrade__meta";
      cost.className = "build-upgrade__cost";
      action.className = "build-upgrade__action build-detail__upgrade-action";
      action.type = "button";
      action.dataset.toolId = toolId;
      action.dataset.upgradeId = upgrade.id;
      action.textContent = upgradeActionText(toolId, upgrade);
      action.disabled = !hasTool(toolId) || !canAffordUpgrade(upgrade);

      name.textContent = upgrade.name;
      meta.textContent =
        "Level " +
        formatUpgradeLevel(level) +
        "  " +
        formatUpgradeBonus(currentBonus) +
        " now, " +
        formatUpgradeBonus(nextBonus - currentBonus) +
        " next";

      cost.append(createCostRow(upgrade.techKey, upgrade.cost));
      summary.append(name, meta);
      row.append(summary, cost, action);
      section.append(row);
    }

    return section;
  }

  function ensureSelectedBuildRecipe(recipes) {
    if (!recipes.length) {
      selectedBuildRecipeId = null;
      return null;
    }

    if (!recipes.some((recipe) => recipe.id === selectedBuildRecipeId)) {
      selectedBuildRecipeId = recipes[0].id;
    }

    return recipeById(selectedBuildRecipeId);
  }

  function renderBuildDetail(recipe) {
    if (!buildMenuDetail) {
      return;
    }

    buildMenuDetail.textContent = "";

    if (!recipe) {
      const empty = document.createElement("div");
      empty.className = "build-detail__empty";
      empty.textContent = "Select a blueprint";
      buildMenuDetail.append(empty);
      return;
    }

    const category = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const costTitle = document.createElement("span");
    const costList = document.createElement("dl");
    const action = document.createElement("button");
    const upgradeSection = createToolUpgradeSection(recipe);

    category.className = "build-detail__category";
    title.className = "build-detail__title";
    description.className = "build-detail__description";
    costTitle.className = "build-detail__section-title";
    costList.className = "build-detail__cost";
    action.className = "build-detail__action";

    category.textContent = recipe.category === "tools" ? "Tool" : "Structure";
    title.textContent = recipe.name;
    description.textContent = recipe.description;
    const costEntries = Object.entries(recipe.cost);
    costTitle.textContent = costEntries.length ? "Cost" : "Status";
    action.type = "button";
    action.dataset.recipeId = recipe.id;
    action.textContent = buildRecipeActionText(recipe);
    action.disabled = !isBuildRecipeActionAvailable(recipe);

    if (!costEntries.length) {
      const status = document.createElement("div");
      status.className = "build-detail__status";
      status.textContent = hasTool(recipe.unlockToolId) ? "Available by default" : "No tech required";
      costList.append(status);
    }

    for (const [techKey, amount] of costEntries) {
      costList.append(createCostRow(techKey, amount));
    }

    buildMenuDetail.append(category, title, description, costTitle, costList, action);
    if (upgradeSection) {
      buildMenuDetail.append(upgradeSection);
    }
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
    const selectedRecipe = ensureSelectedBuildRecipe(recipes);
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
      const title = document.createElement("strong");
      const unlocked = isRecipeUnlocked(recipe);
      const ownedTool = Boolean(recipe.unlockToolId && hasTool(recipe.unlockToolId));
      const affordable = canAffordRecipe(recipe);

      card.type = "button";
      card.className = "build-card";
      card.dataset.recipeId = recipe.id;
      card.setAttribute("aria-pressed", recipe.id === selectedBuildRecipeId ? "true" : "false");
      card.setAttribute("aria-label", recipe.name + " " + (recipe.category === "tools" ? "tool" : "structure"));
      card.title = recipe.name;
      card.classList.toggle("is-unlocked", unlocked);
      card.classList.toggle("is-owned-tool", ownedTool);
      card.classList.toggle("is-locked", !ownedTool && !affordable);
      card.classList.toggle("is-selected", recipe.id === selectedBuildRecipeId);

      iconFrame.className = "build-card__icon";
      title.className = "build-card__title";

      icon.src = recipe.icon || "";
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      title.textContent = recipe.name;

      iconFrame.append(icon);
      card.append(iconFrame, title);
      buildMenuList.append(card);
    }

    renderBuildDetail(selectedRecipe);

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
    toolHotbar.classList.toggle("is-visible", hotbarToolIds.length > 0 && (unlockedToolIds.length > 1 || buildMenuOpen));

    hotbarToolIds.forEach((toolId, index) => {
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
    if (!isToolEquipped(toolId)) {
      return;
    }

    equippedToolId = toolId;
    toolFireCooldown = Math.min(toolFireCooldown, (equippedWeapon() || playerWeaponDefaults).cooldown);
    updateToolHotbar();
    renderBuildMenu();
    playSound("select");
  }

  function cycleTool(direction) {
    if (hotbarToolIds.length < 2) {
      return;
    }

    const currentIndex = Math.max(0, hotbarToolIds.indexOf(equippedToolId));
    const nextIndex = (currentIndex + direction + hotbarToolIds.length) % hotbarToolIds.length;
    selectTool(hotbarToolIds[nextIndex]);
  }

  function equipTool(toolId) {
    if (!hasTool(toolId)) {
      return;
    }

    if (!isToolEquipped(toolId)) {
      hotbarToolIds.push(toolId);
    }
    selectTool(toolId);
  }

  function unequipTool(toolId) {
    if (!isToolEquipped(toolId)) {
      return;
    }

    hotbarToolIds = hotbarToolIds.filter((equippedId) => equippedId !== toolId);
    if (equippedToolId === toolId) {
      equippedToolId = hotbarToolIds[0] || null;
      toolFireCooldown = Math.min(toolFireCooldown, (equippedWeapon() || playerWeaponDefaults).cooldown);
    }

    updateToolHotbar();
    renderBuildMenu();
    playSound("select");
  }

  function toggleToolEquip(toolId) {
    if (!hasTool(toolId)) {
      return;
    }

    if (isToolEquipped(toolId)) {
      unequipTool(toolId);
    } else {
      equipTool(toolId);
    }
  }

  function unlockTool(toolId) {
    if (!hasTool(toolId)) {
      unlockedToolIds.push(toolId);
    }
    equipTool(toolId);
  }

  function spendRecipeCost(recipe) {
    for (const [techKey, amount] of Object.entries(recipe.cost)) {
      techInventory[techKey] = Math.max(0, Math.floor(techInventory[techKey] || 0) - amount);
    }
  }

  function refundRecipeCost(recipe, factor) {
    let refunded = 0;
    for (const [techKey, amount] of Object.entries(recipe.cost)) {
      if (amount <= 0) {
        continue;
      }

      const refundAmount = Math.max(1, Math.floor(Math.max(0, amount) * factor));
      techInventory[techKey] = Math.max(0, Math.floor(techInventory[techKey] || 0)) + refundAmount;
      refunded += refundAmount;
    }
    return refunded;
  }

  function startStructurePlacement(recipeId) {
    const recipe = recipeById(recipeId);
    if (!isStructureRecipe(recipe) || !canAffordRecipe(recipe)) {
      return;
    }

    activePlacementRecipeId = recipe.id;
    pendingTetherAnchor = null;
    setBuildMenuOpen(false);
    resetMouseButtons();
    if (recipe.structureType === "tether") {
      maybeNotifyText("Choose a boulder or larger body for the first tether anchor.");
    } else {
      maybeNotifyText("Choose a dwarf moon, moon, planet, or plate surface for the " + recipe.name.toLowerCase() + ".");
    }
  }

  function cancelStructurePlacement() {
    if (!activePlacementRecipeId) {
      return;
    }

    activePlacementRecipeId = null;
    pendingTetherAnchor = null;
    resetMouseButtons();
  }

  function craftRecipe(recipeId) {
    const recipe = buildRecipes.find((candidate) => candidate.id === recipeId);
    if (!recipe) {
      return;
    }

    if (isRecipeUnlocked(recipe)) {
      if (recipe.unlockToolId) {
        toggleToolEquip(recipe.unlockToolId);
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
    playSound("craft");
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

  function isCompactHudViewport() {
    return window.innerWidth <= compactHudBreakpoint || window.innerHeight <= compactHudHeightBreakpoint;
  }

  function syncCompactHudControls() {
    const compact = isCompactHudViewport();

    if (techLedger) {
      techLedger.classList.toggle("is-open", resourcesHudOpen);
      techLedger.setAttribute("aria-hidden", resourcesHudOpen ? "false" : "true");
    }

    if (resourcesToggle) {
      resourcesToggle.classList.toggle("is-active", resourcesHudOpen);
      resourcesToggle.setAttribute("aria-expanded", resourcesHudOpen ? "true" : "false");
    }

    if (mapToggle) {
      mapToggle.classList.toggle("is-active", compact && mapHudOpen);
      mapToggle.setAttribute("aria-expanded", compact && mapHudOpen ? "true" : "false");
    }
  }

  function setResourcesHudOpen(open) {
    resourcesHudOpen = Boolean(open);
    syncCompactHudControls();
  }

  function setMapHudOpen(open) {
    mapHudOpen = Boolean(open);
    syncCompactHudControls();
  }

  function clampTechLedgerPosition(left, top) {
    if (!techLedger) {
      return;
    }

    const rect = techLedger.getBoundingClientRect();
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

    techLedger.style.left = clamp(left, margin, maxLeft) + "px";
    techLedger.style.top = clamp(top, margin, maxTop) + "px";
    techLedger.style.right = "auto";
    techLedger.style.bottom = "auto";
  }

  function beginTechLedgerDrag(event) {
    if (!techLedger || event.button > 0) {
      return;
    }

    const rect = techLedger.getBoundingClientRect();
    techLedgerDrag.active = true;
    techLedgerDrag.pointerId = event.pointerId;
    techLedgerDrag.offsetX = event.clientX - rect.left;
    techLedgerDrag.offsetY = event.clientY - rect.top;
    techLedger.classList.add("is-dragging");
    techLedger.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateTechLedgerDrag(event) {
    if (!techLedgerDrag.active || techLedgerDrag.pointerId !== event.pointerId) {
      return;
    }

    clampTechLedgerPosition(event.clientX - techLedgerDrag.offsetX, event.clientY - techLedgerDrag.offsetY);
    event.preventDefault();
  }

  function endTechLedgerDrag(event) {
    if (!techLedgerDrag.active || techLedgerDrag.pointerId !== event.pointerId) {
      return;
    }

    techLedgerDrag.active = false;
    techLedgerDrag.pointerId = null;
    if (techLedger) {
      techLedger.classList.remove("is-dragging");
      if (techLedger.hasPointerCapture(event.pointerId)) {
        techLedger.releasePointerCapture(event.pointerId);
      }
    }
  }

  function setBuildMenuOpen(open) {
    buildMenuOpen = Boolean(open);
    if (buildMenuOpen) {
      cancelStructurePlacement();
      resetMouseButtons();
    }
    if (!buildMenu) {
      return;
    }

    buildMenu.classList.toggle("is-open", buildMenuOpen);
    buildMenu.setAttribute("aria-hidden", buildMenuOpen ? "false" : "true");
    if (buildToggle) {
      buildToggle.classList.toggle("is-active", buildMenuOpen);
      buildToggle.setAttribute("aria-expanded", buildMenuOpen ? "true" : "false");
      buildToggle.setAttribute("aria-label", buildMenuOpen ? "Close build menu" : "Open build menu");
    }
    updateToolHotbar();
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

  function serializeEquippedToolInventory() {
    return hotbarToolIds.filter((toolId, index) => hasTool(toolId) && hotbarToolIds.indexOf(toolId) === index);
  }

  function serializeToolUpgrades() {
    return normalizeToolUpgrades(toolUpgradeLevels);
  }

  function applyToolInventory(tools, equipped, equippedTools) {
    const validTools = Array.isArray(tools)
      ? tools.filter((toolId, index) => toolCatalog.some((tool) => tool.id === toolId) && tools.indexOf(toolId) === index)
      : [];

    unlockedToolIds = validTools.includes(defaultToolId) ? validTools : [defaultToolId].concat(validTools);
    const hotbarSource = Array.isArray(equippedTools) ? equippedTools : unlockedToolIds;
    hotbarToolIds = hotbarSource.filter((toolId, index) => hasTool(toolId) && hotbarSource.indexOf(toolId) === index);
    equippedToolId = hotbarToolIds.includes(equipped) ? equipped : hotbarToolIds[0] || null;
    updateToolHotbar();
    renderBuildMenu();
  }

  function applyToolUpgrades(snapshot) {
    toolUpgradeLevels = normalizeToolUpgrades(snapshot);
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

  function difficultyDefinition(id) {
    return difficultyDefinitions[id] || difficultyDefinitions[defaultDifficultyId];
  }

  function activeDifficulty() {
    return difficultyDefinition(runState.difficultyId);
  }

  function difficultyLabel(id) {
    return difficultyDefinition(id).label;
  }

  function difficultyMobSpawnInterval(kind) {
    const interval = mobSpawnIntervals[kind] || 1;
    return Math.max(0.5, interval * activeDifficulty().mobIntervalScale);
  }

  function resetMobSpawnTimers() {
    for (const kind of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[kind] = difficultyMobSpawnInterval(kind);
    }
  }

  function setDifficultyScreenOpen(open) {
    if (difficultyScreen) {
      difficultyScreen.classList.toggle("is-open", Boolean(open));
      difficultyScreen.setAttribute("aria-hidden", open ? "false" : "true");
    }
    updateCrazyGamesGameplayState(open ? "difficulty-screen-open" : "difficulty-screen-closed");
  }

  function setGamePaused(paused) {
    gamePaused = Boolean(paused) && runState.active && !deathState.active;
    keys.clear();
    jumpQueued = false;
    resetMouseButtons();

    if (!gamePaused) {
      lastTime = performance.now();
    }
    updateCrazyGamesGameplayState(gamePaused ? "pause" : "resume");
  }

  function applyDifficulty(id) {
    runState.difficultyId = difficultyDefinitions[id] ? id : defaultDifficultyId;
    resetMobSpawnTimers();
    updateDifficultyUi();
  }

  function updateDifficultyUi() {
    if (difficultyValue) {
      difficultyValue.textContent = activeDifficulty().label;
    }
  }

  async function beginRunWithDifficulty(id) {
    if (runState.active) {
      return;
    }
    applyDifficulty(id);
    runState.active = true;
    resetLocalPlayerState();
    resetLocalWorldState();
    resetLifeStats();
    resetDeathState();
    persistence.saveTimer = persistenceSaveInterval;
    persistence.pollTimer = persistencePollInterval;
    setDifficultyScreenOpen(false);
    lastTime = performance.now();
    updateHud();
    void refreshLeaderboard(true);
    await savePersistentState({ includeWorld: true });
    connectMultiplayer();
    updateCrazyGamesGameplayState("run-start");
  }

  function resetLocalWorldState() {
    cancelStructurePlacement();
    hideSignalPrompt();
    player.landed = null;
    particles.length = 0;
    sparks.length = 0;
    rivals.length = 0;
    ufos.length = 0;
    rambots.length = 0;
    engineers.length = 0;
    teslas.length = 0;
    rockets.length = 0;
    fighters.length = 0;
    rivalProjectiles.length = 0;
    playerLasers.length = 0;
    launcherMissiles.length = 0;
    structures.length = 0;
    healthPickups.length = 0;
    techPickups.length = 0;
    multiplayer.remoteUniverses.clear();
    nextParticleId = 1;
    nextRivalId = 1;
    nextUfoId = 1;
    nextRambotId = 1;
    nextEngineerId = 1;
    nextTeslaId = 1;
    nextRocketId = 1;
    nextFighterId = 1;
    nextStructureId = 1;
    spawnTimer = 0;

    resetMobSpawnTimers();

    resetMobDefeatsByKind();

    seedStarDust();
    seedParticles();
  }

  function resetLifeStats() {
    lifeStats.startedAt = performance.now();
    lifeStats.maxMass = 1;
    lifeStats.maxTierName = "particle";
    lifeStats.mobsDefeated = 0;
    lifeStats.techCollected = 0;
    lifeStats.mobScore = 0;
    lifeStats.currentScore = 0;
    lifeStats.bestScore = 0;
    lifeStats.bodyScore = 0;
    lifeStats.bestBodyScore = 0;
    lifeStats.scoredBodyMass = 0;
    lifeStats.bestScoredBodyMass = 0;
    lifeStats.scoredBodies = 0;
    lifeStats.bestScoredBodies = 0;
    lifeStats.absorbedParticleMass = 0;
    lifeStats.absorbedParticleCount = 0;
  }

  function sanitizePlayerName(name) {
    return String(name || "").trim().replace(/\s+/g, " ").slice(0, 32);
  }

  function sanitizeManualSaveName(name) {
    return String(name || "").replace(/[^\w .:'-]/g, "").trim().replace(/\s+/g, " ").slice(0, 32);
  }

  function manualSaveStorageKey(name) {
    return manualSaveStoragePrefix + sanitizeManualSaveName(name).toLowerCase();
  }

  function legacyManualSaveStorageKey(name) {
    return legacyManualSaveStoragePrefix + sanitizeManualSaveName(name).toLowerCase();
  }

  function setManualSaveStatus(message, state) {
    if (!saveGameStatus) {
      return;
    }

    saveGameStatus.textContent = message || "";
    saveGameStatus.classList.toggle("is-success", state === "success");
    saveGameStatus.classList.toggle("is-error", state === "error");
  }

  function accountAuthHeaders() {
    return accountState.token ? { Authorization: "Bearer " + accountState.token } : {};
  }

  function isAccountSignedIn() {
    return Boolean(accountState.token && accountState.username);
  }

  function setAccountBusy(busy) {
    accountState.busy = Boolean(busy);
    updateAccountUi();
  }

  function updateAccountUi() {
    const signedIn = isAccountSignedIn();
    const crazyGamesRuntime = isCrazyGamesRuntime();

    if (accountLoginForm) {
      accountLoginForm.hidden = crazyGamesRuntime || signedIn;
    }
    if (crazyGamesAccount) {
      crazyGamesAccount.hidden = !crazyGamesRuntime;
    }
    if (crazyGamesAccountStatus) {
      crazyGamesAccountStatus.textContent = signedIn ? "Signed in with CrazyGames" : "Playing as guest";
    }
    if (crazyGamesLoginButton) {
      crazyGamesLoginButton.hidden = !crazyGamesRuntime || signedIn || crazyGamesState.authAvailable === false;
      crazyGamesLoginButton.disabled = accountState.busy || crazyGamesState.authPromptActive;
    }
    if (accountSignedIn) {
      accountSignedIn.hidden = crazyGamesRuntime || !signedIn;
    }
    if (accountNameValue) {
      accountNameValue.textContent = signedIn ? accountState.username : "Signed out";
    }
    if (accountLoginButton) {
      accountLoginButton.disabled = accountState.busy;
    }
    if (accountSignupButton) {
      accountSignupButton.disabled = accountState.busy;
    }
    if (accountLogoutButton) {
      accountLogoutButton.hidden = crazyGamesRuntime;
      accountLogoutButton.disabled = accountState.busy;
    }
    if (saveGameButton) {
      saveGameButton.disabled = (!signedIn && !crazyGamesRuntime) || accountState.busy;
      saveGameButton.textContent = signedIn ? "Save" : crazyGamesRuntime ? "Save guest" : "Log in";
    }

    renderSavedGames();
  }

  function sanitizeNetworkIdentity(value) {
    return String(value || "").replace(/[^\w .:'-]/g, "").trim().slice(0, 80);
  }

  function adoptLinkedPlayerId(linkedPlayerId) {
    const cleanPlayerId = sanitizeNetworkIdentity(linkedPlayerId);
    if (!cleanPlayerId || cleanPlayerId === player.id || runState.active) {
      return;
    }

    if (multiplayer.socket) {
      try {
        multiplayer.socket.close();
      } catch {
        // Reconnecting under the account-linked id is best-effort before a run starts.
      }
    }
    multiplayer.socket = null;
    multiplayer.connected = false;
    multiplayer.reconnectTimer = 0;
    multiplayer.remoteUniverses.clear();

    player.id = cleanPlayerId;
    player.name = "Player " + cleanPlayerId.slice(-4).toUpperCase();
    document.body.dataset.playerId = cleanPlayerId;
    try {
      window.localStorage.setItem(playerIdStorageKey, cleanPlayerId);
    } catch {
      // Local storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function applyCrazyGamesSettings(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    setCrazyGamesAudioMuted(source.muteAudio === true);
  }

  function crazyGamesGameModule() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    return sdk && sdk.game ? sdk.game : null;
  }

  function isDifficultyScreenOpen() {
    return Boolean(difficultyScreen && difficultyScreen.classList.contains("is-open"));
  }

  function isCrazyGamesGameplayPlayable() {
    return runState.active && !deathState.active && !gamePaused && !isDifficultyScreenOpen();
  }

  function updateCrazyGamesGameplayState(reason) {
    setCrazyGamesGameplayActive(isCrazyGamesGameplayPlayable(), reason);
  }

  function setCrazyGamesGameplayActive(active, reason) {
    const nextActive = Boolean(active);
    if (crazyGamesState.gameplayEventsDisabled || crazyGamesState.gameplayActive === nextActive) {
      return;
    }

    const game = crazyGamesGameModule();
    const methodName = nextActive ? "gameplayStart" : "gameplayStop";
    if (!game || typeof game[methodName] !== "function") {
      return;
    }

    try {
      game[methodName]();
      crazyGamesState.gameplayActive = nextActive;
    } catch (error) {
      crazyGamesState.gameplayEventsDisabled = true;
      console.warn("CrazyGames gameplay event unavailable.", { reason, error });
    }
  }

  async function initializeCrazyGamesIntegration() {
    if (crazyGamesState.initPromise) {
      return crazyGamesState.initPromise;
    }

    crazyGamesState.initPromise = (async function () {
      let sdk = null;
      let usedReadyPromise = false;
      try {
        if (window.CLUSTERNAUTS_CRAZYGAMES_SDK_READY && typeof window.CLUSTERNAUTS_CRAZYGAMES_SDK_READY.then === "function") {
          usedReadyPromise = true;
          sdk = await window.CLUSTERNAUTS_CRAZYGAMES_SDK_READY;
          if (!sdk) {
            return null;
          }
        }
        sdk = sdk || (window.CrazyGames && window.CrazyGames.SDK);
        if (!sdk) {
          crazyGamesState.authAvailable = false;
          updateAccountUi();
          return null;
        }
        crazyGamesState.sdk = sdk;

        if (!crazyGamesState.initialized && !usedReadyPromise && typeof sdk.init === "function") {
          await sdk.init();
        }
        crazyGamesState.initialized = true;

        if (sdk.game) {
          applyCrazyGamesSettings(sdk.game.settings);
          if (typeof sdk.game.addSettingsChangeListener === "function") {
            crazyGamesState.settingsListener = function (newSettings) {
              applyCrazyGamesSettings(newSettings);
            };
            sdk.game.addSettingsChangeListener(crazyGamesState.settingsListener);
          }
        }

        if (sdk.user && typeof sdk.user.addAuthListener === "function") {
          if (typeof sdk.user.isUserAccountAvailable === "function") {
            try {
              crazyGamesState.authAvailable = await sdk.user.isUserAccountAvailable();
            } catch {
              crazyGamesState.authAvailable = true;
            }
            updateAccountUi();
          }
          crazyGamesState.authListener = function () {
            void authenticateWithCrazyGames();
          };
          sdk.user.addAuthListener(crazyGamesState.authListener);
        }

        await authenticateWithCrazyGames();
      } catch (error) {
        crazyGamesState.authAvailable = false;
        updateAccountUi();
        console.warn("CrazyGames SDK unavailable.", error);
      }
      return sdk;
    }());

    return crazyGamesState.initPromise;
  }

  async function authenticateWithCrazyGames() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    if (!sdk || !sdk.user || typeof sdk.user.getUserToken !== "function") {
      return;
    }
    if (!isCrazyGamesHost(window.location.hostname) && crazyGamesSdkEnvironment() !== "crazygames") {
      return;
    }

    try {
      const crazyGamesToken = await sdk.user.getUserToken();
      if (!crazyGamesToken) {
        updateAccountUi();
        return;
      }

      const data = await fetchPersistentJson("/api/auth/crazygames", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({
          token: crazyGamesToken,
          playerId: player.id,
          sessionToken: accountState.token
        })
      });
      applyAccountSession(data);
      await refreshAccountSaves();
      setManualSaveStatus("Signed in with CrazyGames.", "success");
    } catch (error) {
      if (!isCrazyGamesUnauthenticatedError(error)) {
        console.warn("CrazyGames account login unavailable.", error);
      }
    } finally {
      updateAccountUi();
    }
  }

  function isCrazyGamesUnauthenticatedError(error) {
    const code = String((error && error.code) || (error && error.message) || error || "");
    return code.includes("userNotAuthenticated") || code.includes("userCancelled");
  }

  function isCrazyGamesAlreadySignedInError(error) {
    const code = String((error && error.code) || (error && error.message) || error || "");
    return code.includes("userAlreadySignedIn");
  }

  async function promptCrazyGamesLogin() {
    if (accountState.busy || crazyGamesState.authPromptActive) {
      return;
    }

    crazyGamesState.authPromptActive = true;
    setAccountBusy(true);
    try {
      await initializeCrazyGamesIntegration();
      const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
      if (!sdk || !sdk.user || typeof sdk.user.showAuthPrompt !== "function") {
        crazyGamesState.authAvailable = false;
        setManualSaveStatus("CrazyGames login is unavailable here.", "error");
        return;
      }

      await sdk.user.showAuthPrompt();
      await authenticateWithCrazyGames();
    } catch (error) {
      if (isCrazyGamesAlreadySignedInError(error)) {
        await authenticateWithCrazyGames();
      } else if (isCrazyGamesUnauthenticatedError(error)) {
        setManualSaveStatus("Continuing as guest.", "success");
      } else {
        setManualSaveStatus("CrazyGames login did not complete.", "error");
        console.warn("CrazyGames auth prompt failed.", error);
      }
    } finally {
      crazyGamesState.authPromptActive = false;
      setAccountBusy(false);
    }
  }

  function renderSavedGames() {
    if (!savedGameList) {
      return;
    }

    savedGameList.textContent = "";

    if (!isAccountSignedIn()) {
      const empty = document.createElement("p");
      empty.className = "settings-panel__save-empty";
      empty.textContent = isCrazyGamesRuntime()
        ? "Guest progress autosaves on this device. Sign in with CrazyGames for named saves."
        : "Log in to save and load worlds.";
      savedGameList.append(empty);
      return;
    }

    if (accountState.savesLoading) {
      const loading = document.createElement("p");
      loading.className = "settings-panel__save-empty";
      loading.textContent = "Loading saves...";
      savedGameList.append(loading);
      return;
    }

    if (!accountState.saves.length) {
      const empty = document.createElement("p");
      empty.className = "settings-panel__save-empty";
      empty.textContent = "No saved worlds yet.";
      savedGameList.append(empty);
      return;
    }

    for (const save of accountState.saves) {
      const row = document.createElement("div");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const button = document.createElement("button");
      row.className = "settings-panel__save-item";
      details.className = "settings-panel__save-details";
      name.textContent = save.name || "Saved world";
      button.className = "settings-panel__save-action";
      button.type = "button";
      button.dataset.saveId = save.id || "";
      button.textContent = "Load";
      details.append(name);
      row.append(details, button);
      savedGameList.append(row);
    }
  }

  async function bootstrapAccountSession() {
    if (isCrazyGamesRuntime()) {
      accountState.token = "";
      accountState.username = "";
      accountState.saves = [];
      accountState.crazyGamesLinked = false;
      updateAccountUi();
      return;
    }

    const stored = readStoredAccountSession();
    if (!stored) {
      updateAccountUi();
      return;
    }

    accountState.token = stored.token;
    accountState.username = stored.username;
    accountState.crazyGamesLinked = stored.crazyGamesLinked === true;
    updateAccountUi();

    try {
      const data = await fetchPersistentJson("/api/auth/session", {
        headers: accountAuthHeaders()
      });
      applyAccountSession(data);
      await refreshAccountSaves();
    } catch (error) {
      accountState.token = "";
      accountState.username = "";
      accountState.saves = [];
      accountState.crazyGamesLinked = false;
      writeStoredAccountSession();
      updateAccountUi();
      console.warn("Clusternauts account session unavailable.", error);
    }
  }

  function applyAccountSession(data) {
    const account = data && data.account && typeof data.account === "object" ? data.account : {};
    accountState.token = typeof data.sessionToken === "string" ? data.sessionToken : accountState.token;
    accountState.username = sanitizeAccountUsername(account.username || accountState.username);
    accountState.crazyGamesLinked = account.crazyGamesLinked === true;
    adoptLinkedPlayerId(account.linkedPlayerId);
    writeStoredAccountSession();
    updateAccountUi();
  }

  async function submitAccountAuth(createNew) {
    if (isCrazyGamesRuntime()) {
      await promptCrazyGamesLogin();
      return;
    }

    if (accountState.busy) {
      return;
    }

    const username = sanitizeAccountUsername(accountUsernameInput && accountUsernameInput.value);
    const password = accountPasswordInput ? accountPasswordInput.value : "";
    if (!username || username.length < 3) {
      setManualSaveStatus("Enter a username with at least 3 characters.", "error");
      return;
    }
    if (password.length < 6) {
      setManualSaveStatus("Enter a password with at least 6 characters.", "error");
      return;
    }

    setAccountBusy(true);
    try {
      const data = await fetchPersistentJson(createNew ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          playerId: player.id
        })
      });
      applyAccountSession(data);
      if (accountPasswordInput) {
        accountPasswordInput.value = "";
      }
      await refreshAccountSaves();
      setManualSaveStatus(createNew ? "Account created." : "Logged in.", "success");
    } catch (error) {
      setManualSaveStatus(error instanceof Error ? error.message.replace(/^Request failed \d+:?\s*/, "") : "Account request failed.", "error");
    } finally {
      setAccountBusy(false);
    }
  }

  async function logoutAccount() {
    if (isCrazyGamesRuntime()) {
      setManualSaveStatus("Use your CrazyGames account menu to sign out.", "error");
      return;
    }

    if (!isAccountSignedIn() || accountState.busy) {
      return;
    }

    setAccountBusy(true);
    try {
      await fetchPersistentJson("/api/auth/logout", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ sessionToken: accountState.token })
      });
    } catch (error) {
      console.warn("Clusternauts logout failed.", error);
    } finally {
      accountState.token = "";
      accountState.username = "";
      accountState.saves = [];
      accountState.crazyGamesLinked = false;
      writeStoredAccountSession();
      setManualSaveStatus("Logged out.", "success");
      setAccountBusy(false);
    }
  }

  async function refreshAccountSaves() {
    if (!isAccountSignedIn() || accountState.savesLoading) {
      return;
    }

    accountState.savesLoading = true;
    renderSavedGames();
    try {
      const data = await fetchPersistentJson("/api/saves", {
        headers: accountAuthHeaders()
      });
      accountState.saves = Array.isArray(data.saves) ? data.saves : [];
    } catch (error) {
      setManualSaveStatus("Could not load saved games.", "error");
      console.warn("Clusternauts save list failed.", error);
    } finally {
      accountState.savesLoading = false;
      updateAccountUi();
    }
  }

  function buildRunSnapshot() {
    return {
      active: runState.active,
      difficulty: runState.difficultyId,
      lifeStats: {
        elapsed: Math.max(0, (performance.now() - lifeStats.startedAt) / 1000),
        maxMass: lifeStats.maxMass,
        maxTierName: lifeStats.maxTierName,
        mobsDefeated: lifeStats.mobsDefeated,
        techCollected: lifeStats.techCollected,
        mobScore: lifeStats.mobScore,
        currentScore: lifeStats.currentScore,
        bestScore: lifeStats.bestScore,
        bodyScore: lifeStats.bodyScore,
        bestBodyScore: lifeStats.bestBodyScore,
        scoredBodyMass: lifeStats.scoredBodyMass,
        bestScoredBodyMass: lifeStats.bestScoredBodyMass,
        scoredBodies: lifeStats.scoredBodies,
        bestScoredBodies: lifeStats.bestScoredBodies,
        absorbedParticleMass: lifeStats.absorbedParticleMass,
        absorbedParticleCount: lifeStats.absorbedParticleCount
      }
    };
  }

  function applyRunSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    const stats = source.lifeStats && typeof source.lifeStats === "object" ? source.lifeStats : {};
    const elapsed = Math.max(0, finiteOr(stats.elapsed, 0));

    if (source.difficulty && difficultyDefinitions[source.difficulty]) {
      applyDifficulty(source.difficulty);
    }

    lifeStats.startedAt = performance.now() - elapsed * 1000;
    lifeStats.maxMass = Math.max(1, finiteOr(stats.maxMass, lifeStats.maxMass));
    lifeStats.maxTierName = typeof stats.maxTierName === "string" && stats.maxTierName ? stats.maxTierName : lifeStats.maxTierName;
    lifeStats.mobsDefeated = Math.max(0, Math.floor(finiteOr(stats.mobsDefeated, lifeStats.mobsDefeated)));
    lifeStats.techCollected = Math.max(0, Math.floor(finiteOr(stats.techCollected, lifeStats.techCollected)));
    lifeStats.mobScore = Math.max(0, finiteOr(stats.mobScore, lifeStats.mobScore));
    lifeStats.currentScore = Math.max(0, finiteOr(stats.currentScore, lifeStats.currentScore));
    lifeStats.bestScore = Math.max(0, finiteOr(stats.bestScore, lifeStats.bestScore));
    lifeStats.bodyScore = Math.max(0, finiteOr(stats.bodyScore, lifeStats.bodyScore));
    lifeStats.bestBodyScore = Math.max(0, finiteOr(stats.bestBodyScore, lifeStats.bestBodyScore));
    lifeStats.scoredBodyMass = Math.max(0, finiteOr(stats.scoredBodyMass, lifeStats.scoredBodyMass));
    lifeStats.bestScoredBodyMass = Math.max(0, finiteOr(stats.bestScoredBodyMass, lifeStats.bestScoredBodyMass));
    lifeStats.scoredBodies = Math.max(0, Math.floor(finiteOr(stats.scoredBodies, lifeStats.scoredBodies)));
    lifeStats.bestScoredBodies = Math.max(0, Math.floor(finiteOr(stats.bestScoredBodies, lifeStats.bestScoredBodies)));
    lifeStats.absorbedParticleMass = Math.max(0, finiteOr(stats.absorbedParticleMass, lifeStats.absorbedParticleMass));
    lifeStats.absorbedParticleCount = Math.max(0, Math.floor(finiteOr(stats.absorbedParticleCount, lifeStats.absorbedParticleCount)));
  }

  async function saveManualGame() {
    const name = sanitizeManualSaveName(saveGameNameInput && saveGameNameInput.value);

    if (!isAccountSignedIn()) {
      if (isCrazyGamesRuntime()) {
        await saveGuestProgress();
        return;
      }
      setManualSaveStatus("Create an account or log in to save.", "error");
      return;
    }
    if (!name) {
      setManualSaveStatus("Enter a save name.", "error");
      return;
    }
    if (!runState.active || deathState.active) {
      setManualSaveStatus("Start a live run before saving.", "error");
      return;
    }

    try {
      updateLifeStats();
      const payload = buildPersistentPayload(true);
      payload.run = buildRunSnapshot();
      const data = await fetchPersistentJson("/api/saves", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ name, payload })
      });
      accountState.saves = Array.isArray(data.saves) ? data.saves : accountState.saves;
      if (saveGameNameInput) {
        saveGameNameInput.value = name;
      }
      renderSavedGames();
      setManualSaveStatus('Saved "' + name + '".', "success");
      maybeNotifyText('Saved "' + name + '".');
    } catch (error) {
      console.warn("Clusternauts manual save failed.", error);
      setManualSaveStatus("Could not save this game.", "error");
    }
  }

  async function saveGuestProgress() {
    if (!runState.active || deathState.active) {
      setManualSaveStatus("Start a live run before saving.", "error");
      return;
    }

    setAccountBusy(true);
    try {
      updateLifeStats();
      await waitForPersistenceIdle();
      await savePersistentState({ includeWorld: true });
      await waitForPersistenceIdle();
      if (!persistence.online) {
        setManualSaveStatus("Could not save guest progress.", "error");
        return;
      }
      setManualSaveStatus("Guest progress saved.", "success");
      maybeNotifyText("Guest progress saved.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function loadManualGame(saveId) {
    const cleanSaveId = String(saveId || "").trim();

    if (!isAccountSignedIn()) {
      setManualSaveStatus(isCrazyGamesRuntime() ? "Guest progress loads automatically on startup." : "Log in to load saved games.", "error");
      return;
    }
    if (!cleanSaveId) {
      setManualSaveStatus("Choose a saved game.", "error");
      return;
    }

    try {
      const data = await fetchPersistentJson("/api/saves/" + encodeURIComponent(cleanSaveId), {
        headers: accountAuthHeaders()
      });
      const payload = data && data.payload;
      const saveName = data && data.save && data.save.name ? data.save.name : "saved world";

      if (!payload || typeof payload !== "object" || !payload.player || !payload.world) {
        setManualSaveStatus("Could not load this save.", "error");
        return;
      }

      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
      runState.active = true;
      applyPersistentPayload(Object.assign({ ok: true }, payload), { includePlayer: true });
      applyRunSnapshot(payload.run);
      runState.active = true;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setDifficultyScreenOpen(false);
      setSettingsOpen(false);
      resetMouseButtons();
      lastTime = performance.now();
      updateHud();
      void savePersistentState({ includeWorld: true });
      connectMultiplayer();
      setManualSaveStatus('Loaded "' + saveName + '".', "success");
      maybeNotifyText('Loaded "' + saveName + '".');
    } catch (error) {
      console.warn("Clusternauts manual load failed.", error);
      setManualSaveStatus("Could not load this save.", "error");
    }
  }

  function resetLocalPlayerState() {
    cancelStructurePlacement();
    hideSignalPrompt();
    keys.clear();
    resetMouseButtons();
    player.x = 0;
    player.y = 0;
    player.vx = 0;
    player.vy = 0;
    player.radius = 34;
    player.health = 100;
    player.maxHealth = 100;
    player.energy = playerBaseMaxEnergy;
    player.maxEnergy = playerBaseMaxEnergy;
    player.hitCooldown = 0;
    player.hitFlash = 0;
    player.landed = null;
    player.walkCycle = 0;
    cameraRoll = 0;
    gadgetAngle = -0.32;
    toolFireCooldown = 0;
    toolDisabledTimer = 0;

    for (const tech of techTypes) {
      techInventory[tech.key] = 0;
    }

    applyToolInventory([defaultToolId], defaultToolId, [defaultToolId]);
    applyToolUpgrades(null);
    updateTechUi();
  }

  function resetDeathState() {
    deathState.active = false;
    deathState.summaryReady = false;
    deathState.resetInFlight = false;
    deathState.leaderboardSubmitted = false;
    deathState.timer = 0;
    deathState.stats = null;
    deathState.cause = "Unknown impact";
    resetDeathLeaderboardForm();
    setDeathScreenOpen(false);
  }

  function clearStoredNetworkIdentity() {
    try {
      removeMigratedLocalStorage(playerIdStorageKey, legacyPlayerIdStorageKey);
    } catch {
      // Local storage can be unavailable in private or restricted browser modes.
    }
  }

  function initializeNetworkIdentity() {
    let playerId = "";

    try {
      playerId = readMigratedLocalStorage(playerIdStorageKey, legacyPlayerIdStorageKey) || "";

      if (!playerId) {
        playerId = "player-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        localStorage.setItem(playerIdStorageKey, playerId);
      }
    } catch {
      playerId = "player-" + Math.random().toString(36).slice(2, 10);
    }

    player.id = playerId;
    player.name = "Player " + playerId.slice(-4).toUpperCase();
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
      console.warn("Clusternauts persistence unavailable.", error);
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

  async function waitForPersistenceIdle() {
    const startedAt = performance.now();

    while ((persistence.loadInFlight || persistence.saveInFlight) && performance.now() - startedAt < 3500) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  }

  async function fetchPersistentJson(url, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, 2500);

    try {
      const response = await fetch(apiUrl(url), Object.assign({}, options, { signal: controller.signal }));

      if (!response.ok) {
        let detail = "";
        try {
          const errorBody = await response.json();
          detail = errorBody && errorBody.message ? ": " + errorBody.message : "";
        } catch {
          detail = "";
        }
        throw new Error("Request failed " + response.status + detail);
      }

      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function refreshLeaderboard(force) {
    if (!window.fetch || leaderboard.refreshInFlight) {
      return;
    }

    const now = performance.now();
    if (!force && now - leaderboard.lastRefreshAt < 5000) {
      return;
    }

    leaderboard.refreshInFlight = true;
    try {
      const data = await fetchPersistentJson("/api/leaderboard?limit=40");
      leaderboard.entries = Array.isArray(data.entries) ? data.entries.map(normalizeLeaderboardEntry).filter(Boolean) : [];
      leaderboard.lastRefreshAt = now;
      if (leaderboard.open) {
        renderLeaderboard();
      }
    } catch (error) {
      console.warn("Clusternauts leaderboard unavailable.", error);
    } finally {
      leaderboard.refreshInFlight = false;
    }
  }

  async function submitDeathLeaderboardScore(stats, runName) {
    if (!window.fetch || !stats || leaderboard.submitInFlight) {
      return false;
    }

    const score = Math.max(1, Math.round(finiteOr(stats.score, stats.maxMass || 1)));
    const deathKey = [player.id, score, stats.survived, stats.cause, Math.floor(lifeStats.startedAt)].join("|");
    if (leaderboard.submittedDeathKey === deathKey) {
      return true;
    }

    const cleanName = sanitizePlayerName(runName) || sanitizePlayerName(player.name) || "Player";
    leaderboard.submitInFlight = true;
    leaderboard.submittedDeathKey = deathKey;
    try {
      const data = await fetchPersistentJson("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          name: cleanName,
          score,
          difficulty: stats.difficulty,
          bodyScore: stats.bodyScore,
          mobScore: stats.mobScore,
          ownedMass: stats.ownedMass,
          ownedBodies: stats.ownedBodies,
          maxMass: stats.maxMass,
          maxTier: stats.maxTier,
          survived: stats.survived,
          cause: stats.cause
        })
      });
      leaderboard.entries = Array.isArray(data.entries) ? data.entries.map(normalizeLeaderboardEntry).filter(Boolean) : leaderboard.entries;
      leaderboard.lastRefreshAt = performance.now();
      if (leaderboard.open) {
        renderLeaderboard();
      }
      deathState.leaderboardSubmitted = true;
      return true;
    } catch (error) {
      console.warn("Clusternauts leaderboard submit failed.", error);
      leaderboard.submittedDeathKey = "";
      return false;
    } finally {
      leaderboard.submitInFlight = false;
    }
  }

  function connectedScoredBodyIds() {
    const ids = new Set();

    if (player.landed && bodyById(player.landed.bodyId)) {
      ids.add(player.landed.bodyId);
    }

    for (const structure of structures) {
      if (!structure || structure.health <= 0) {
        continue;
      }
      if (structure.bodyId && bodyById(structure.bodyId)) {
        ids.add(structure.bodyId);
      }
      if (structure.linkedBodyId && bodyById(structure.linkedBodyId)) {
        ids.add(structure.linkedBodyId);
      }
    }

    if (!ids.size) {
      const progressBody = findNearestProgressBody();
      if (progressBody) {
        ids.add(progressBody.id);
      }
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const structure of structures) {
        if (!structure || structure.type !== "tether" || structure.health <= 0 || !structure.bodyId || !structure.linkedBodyId) {
          continue;
        }
        const firstKnown = ids.has(structure.bodyId);
        const secondKnown = ids.has(structure.linkedBodyId);
        if (firstKnown && !secondKnown && bodyById(structure.linkedBodyId)) {
          ids.add(structure.linkedBodyId);
          changed = true;
        } else if (secondKnown && !firstKnown && bodyById(structure.bodyId)) {
          ids.add(structure.bodyId);
          changed = true;
        }
      }
    }

    return ids;
  }

  function collectBodyScoreSnapshot() {
    const ids = connectedScoredBodyIds();
    let mass = 0;

    for (const id of ids) {
      const body = bodyById(id);
      if (body) {
        mass += Math.max(0, finiteOr(body.mass, 0));
      }
    }

    return {
      bodyCount: ids.size,
      mass,
      bodyScore: Math.round(mass * activeDifficulty().bodyScoreMultiplier)
    };
  }

  function scoreMobKill(kind) {
    const base = mobScoreValues[kind] || mobScoreValues.alienoid;
    return Math.max(1, Math.round(base * activeDifficulty().mobScoreMultiplier));
  }

  function updateLifeStats() {
    for (const particle of particles) {
      if (particle.mass > lifeStats.maxMass) {
        lifeStats.maxMass = particle.mass;
        lifeStats.maxTierName = particle.tier ? particle.tier.name : tierForMass(particle.mass).name;
      }
    }

    const bodyScore = collectBodyScoreSnapshot();
    lifeStats.scoredBodyMass = bodyScore.mass;
    lifeStats.scoredBodies = bodyScore.bodyCount;
    lifeStats.bodyScore = bodyScore.bodyScore;
    lifeStats.currentScore = Math.max(1, Math.round(bodyScore.bodyScore + lifeStats.mobScore));

    if (lifeStats.currentScore > lifeStats.bestScore) {
      lifeStats.bestScore = lifeStats.currentScore;
      lifeStats.bestBodyScore = lifeStats.bodyScore;
      lifeStats.bestScoredBodyMass = lifeStats.scoredBodyMass;
      lifeStats.bestScoredBodies = lifeStats.scoredBodies;
    }
  }

  function formatLifeDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return minutes + ":" + String(remainingSeconds).padStart(2, "0");
  }

  function collectDeathStats() {
    updateLifeStats();
    return {
      score: Math.round(lifeStats.bestScore),
      difficulty: runState.difficultyId,
      survived: formatLifeDuration((performance.now() - lifeStats.startedAt) / 1000),
      maxMass: Math.round(lifeStats.maxMass),
      maxTier: lifeStats.maxTierName,
      ownedMass: Math.round(lifeStats.bestScoredBodyMass),
      ownedBodies: lifeStats.bestScoredBodies,
      bodyScore: Math.round(lifeStats.bestBodyScore),
      mobScore: Math.round(lifeStats.mobScore),
      mobsDefeated: lifeStats.mobsDefeated,
      techCollected: lifeStats.techCollected,
      structures: structures.length,
      tools: unlockedToolIds.length,
      cause: deathState.cause
    };
  }

  function setDeathScreenOpen(open) {
    if (!deathScreen) {
      return;
    }

    deathScreen.classList.toggle("is-open", Boolean(open));
    deathScreen.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function renderDeathStats() {
    if (!deathStatsList || !deathState.stats) {
      return;
    }

    const stats = deathState.stats;
    const items = [
      ["Score", stats.score + " pts"],
      ["Difficulty", difficultyLabel(stats.difficulty)],
      ["Owned bodies", stats.ownedBodies + " / " + stats.ownedMass + "g"],
      ["Body points", stats.bodyScore],
      ["Mob points", stats.mobScore],
      ["Survived", stats.survived],
      ["Best body", formatTierName(stats.maxTier) + " / " + stats.maxMass + "g"],
      ["Mobs defeated", stats.mobsDefeated],
      ["Tech collected", stats.techCollected],
      ["Structures", stats.structures],
      ["Tools", stats.tools],
      ["Final blow", stats.cause]
    ];

    deathStatsList.textContent = "";
    for (const item of items) {
      const wrapper = document.createElement("div");
      const label = document.createElement("dt");
      const value = document.createElement("dd");
      wrapper.className = "death-screen__stat";
      label.textContent = item[0];
      value.textContent = String(item[1]);
      wrapper.append(label, value);
      deathStatsList.append(wrapper);
    }
  }

  function resetDeathLeaderboardForm() {
    if (deathRunNameInput) {
      deathRunNameInput.disabled = false;
      deathRunNameInput.value = sanitizePlayerName(player.name) || "Player";
    }
    if (deathLeaderboardButton) {
      deathLeaderboardButton.disabled = false;
      deathLeaderboardButton.textContent = "Save run";
      deathLeaderboardButton.classList.remove("is-loading", "is-saved");
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = "";
    }
  }

  async function saveDeathLeaderboardRun() {
    if (!deathState.stats || deathState.resetInFlight) {
      return;
    }
    if (deathState.leaderboardSubmitted) {
      if (deathLeaderboardStatus) {
        deathLeaderboardStatus.textContent = "Saved to leaderboard.";
      }
      return;
    }

    if (deathLeaderboardButton) {
      deathLeaderboardButton.disabled = true;
      deathLeaderboardButton.textContent = "Saving...";
      deathLeaderboardButton.classList.add("is-loading");
      deathLeaderboardButton.classList.remove("is-saved");
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = "";
    }

    const ok = await submitDeathLeaderboardScore(deathState.stats, deathRunNameInput && deathRunNameInput.value);
    if (ok) {
      if (deathRunNameInput) {
        deathRunNameInput.disabled = true;
      }
      if (deathLeaderboardButton) {
        deathLeaderboardButton.textContent = "Saved";
        deathLeaderboardButton.classList.remove("is-loading");
        deathLeaderboardButton.classList.add("is-saved");
      }
      if (deathLeaderboardStatus) {
        deathLeaderboardStatus.textContent = "Saved to leaderboard.";
      }
      return;
    }

    if (deathLeaderboardButton) {
      deathLeaderboardButton.disabled = false;
      deathLeaderboardButton.textContent = "Save run";
      deathLeaderboardButton.classList.remove("is-loading", "is-saved");
    }
    if (deathLeaderboardStatus) {
      deathLeaderboardStatus.textContent = "Could not save this run.";
    }
  }

  function damageLocalPlayer(damage, options) {
    if (deathState.active || player.health <= 0) {
      return false;
    }

    const amount = Math.max(0, finiteOr(damage, 0));
    if (amount <= 0) {
      return false;
    }

    player.health = Math.max(0, player.health - amount);
    player.hitCooldown = Math.max(player.hitCooldown, finiteOr(options && options.cooldown, 0.7));
    player.hitFlash = Math.max(player.hitFlash, finiteOr(options && options.flash, 0.3));

    if (player.health <= 0) {
      beginPlayerDeath(options && options.cause ? options.cause : "Hull failure");
      return true;
    }

    playSound("hit");
    return false;
  }

  function jamLocalPlayerTools(duration) {
    const amount = Math.max(0, finiteOr(duration, 0));
    if (amount <= 0 || deathState.active) {
      return;
    }

    toolDisabledTimer = Math.max(toolDisabledTimer, amount);
    toolFireCooldown = Math.max(toolFireCooldown, Math.min(amount, 1.2));
    resetMouseButtons();
    playSound("jam");
    maybeNotifyText("Tools disabled by electrical surge.");
  }

  function beginPlayerDeath(cause) {
    if (deathState.active) {
      return;
    }

    deathState.active = true;
    deathState.summaryReady = false;
    deathState.timer = 0;
    deathState.cause = cause || "Hull failure";
    deathState.stats = collectDeathStats();
    updateCrazyGamesGameplayState("death");
    resetDeathLeaderboardForm();
    playSound("death", { throttle: 0.8 });
    keys.clear();
    resetMouseButtons();
    jumpQueued = false;
    setBuildMenuOpen(false);
    setCommandOpen(false);
    setSocialPanelOpen(false);
    setLeaderboardOpen(false);
    hideSignalPrompt();
    broadcastPlayerDeathDrop();

    if (player.landed) {
      detachFromBody(120);
    }

    for (let i = 0; i < 18; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(50, 230);
      sparks.push({
        x: player.x + Math.cos(angle) * randomRange(8, player.radius),
        y: player.y + Math.sin(angle) * randomRange(8, player.radius),
        radius: randomRange(20, 58),
        color: i % 3 === 0 ? { r: 255, g: 98, b: 98 } : { r: 116, g: 244, b: 255 },
        life: randomRange(0.35, 0.9),
        maxLife: 0.9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      });
    }
  }

  function broadcastPlayerDeathDrop() {
    sendMultiplayer({
      type: "player.death",
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy
    });
  }

  function spawnCommunicationTechDrop(x, y, vx, vy, sourceName) {
    for (let i = 0; i < 3; i += 1) {
      techPickups.push(createTechPickup("communication", x, y, vx, vy));
    }
    maybeNotifyText((sourceName || "A contact") + " dropped communication tech.");
  }

  function updateDeath(dt) {
    deathState.timer += dt;
    player.vx *= Math.pow(0.42, dt);
    player.vy *= Math.pow(0.42, dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    for (const spark of sparks) {
      if (Number.isFinite(spark.vx) || Number.isFinite(spark.vy)) {
        spark.x += finiteOr(spark.vx, 0) * dt;
        spark.y += finiteOr(spark.vy, 0) * dt;
      }
    }
    updateSparks(dt);

    if (!deathState.summaryReady && deathState.timer >= deathAnimationDuration) {
      deathState.summaryReady = true;
      renderDeathStats();
      resetDeathLeaderboardForm();
      setDeathScreenOpen(true);
    }
  }

  async function hardResetAfterDeath() {
    if (deathState.resetInFlight) {
      return;
    }

    deathState.resetInFlight = true;
    if (playAgainButton) {
      playAgainButton.disabled = true;
      playAgainButton.textContent = "Resetting...";
      playAgainButton.classList.add("is-loading");
    }

    const previousPlayerId = player.id;

    try {
      await waitForPersistenceIdle();
      if (persistence.enabled && previousPlayerId) {
        await fetchPersistentJson("/api/reset/life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: previousPlayerId })
        });
      }
    } catch (error) {
      console.warn("Clusternauts death reset cleanup failed.", error);
    }

    try {
      if (multiplayer.socket) {
        multiplayer.socket.onclose = null;
        multiplayer.socket.onerror = null;
        multiplayer.socket.close();
      }
      multiplayer.socket = null;
      multiplayer.connected = false;
      multiplayer.reconnectTimer = 0;
      multiplayer.reconnectDelay = 1.5;
      multiplayer.profile = null;
      multiplayer.universeId = "";
      multiplayer.remoteUniverses.clear();

      clearStoredNetworkIdentity();
      runState.active = false;
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      initializeNetworkIdentity();
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      resetDeathState();
      setDifficultyScreenOpen(true);
      void refreshLeaderboard(true);
      updateHud();
    } catch (error) {
      console.warn("Clusternauts death reset failed.", error);
      deathState.resetInFlight = false;
    } finally {
      if (playAgainButton) {
        playAgainButton.disabled = false;
        playAgainButton.textContent = "Play again";
        playAgainButton.classList.remove("is-loading");
      }
    }
  }

  function updatePersistence(dt) {
    if (!persistence.enabled || persistence.resetInFlight || deathState.active || !runState.active) {
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

  function applyMultiplayerProfile(profile) {
    if (!profile || typeof profile !== "object") {
      return;
    }

    multiplayer.profile = profile;
    multiplayer.universeId = profile.universeId || multiplayer.universeId || ("solo:" + player.id);
    player.name = profile.publicName || player.name;
    if (publicNameValue) {
      publicNameValue.textContent = player.name;
    }
  }

  function updateOnlineUi() {
    if (onlineCount) {
      onlineCount.textContent = String(multiplayer.onlineCount || 0);
    }
    if (onlineToggle) {
      onlineToggle.classList.toggle("is-active", multiplayer.panelOpen && multiplayer.socialMode === "online");
    }
  }

  function setSocialPanelOpen(open, mode) {
    multiplayer.panelOpen = Boolean(open);
    if (mode) {
      multiplayer.socialMode = mode;
    }
    if (socialPanel) {
      socialPanel.classList.toggle("is-open", multiplayer.panelOpen);
      socialPanel.setAttribute("aria-hidden", multiplayer.panelOpen ? "false" : "true");
    }
    if (publicNameValue) {
      publicNameValue.textContent = multiplayer.socialMode === "relay" ? "Communication relay" : player.name;
    }
    updateOnlineUi();

    if (multiplayer.panelOpen) {
      void refreshPlayerSearch();
    }
  }

  function openRelayContacts() {
    if (!hasCommunicationRelay()) {
      maybeNotifyText("Build a communication relay first.");
      return;
    }

    setSocialPanelOpen(true, "relay");
  }

  async function refreshPlayerSearch() {
    if (!window.fetch || !playerSearchList) {
      return;
    }

    const query = playerSearch ? playerSearch.value : "";
    const friendsOnly = friendsOnlyFilter && friendsOnlyFilter.checked;
    const relayOnly = multiplayer.socialMode === "relay";

    try {
      const url =
        "/api/players/search?playerId=" +
        encodeURIComponent(player.id) +
        "&q=" +
        encodeURIComponent(query || "") +
        "&friendsOnly=" +
        (friendsOnly ? "true" : "false") +
        "&relayOnly=" +
        (relayOnly ? "true" : "false");
      const data = await fetchPersistentJson(url);
      if (data && data.ok) {
        multiplayer.players = Array.isArray(data.players) ? data.players : [];
        renderPlayerSearch();
      }
    } catch {
      renderPlayerSearch("Search unavailable.");
    }
  }

  function renderPlayerSearch(message) {
    if (!playerSearchList) {
      return;
    }

    playerSearchList.textContent = "";
    const players = multiplayer.players || [];

    if (message || !players.length) {
      const empty = document.createElement("div");
      empty.className = "social-row__empty";
      empty.textContent = message || "No signals found.";
      playerSearchList.append(empty);
      return;
    }

    for (const candidate of players) {
      const row = document.createElement("div");
      const main = document.createElement("div");
      const name = document.createElement("strong");
      const status = document.createElement("span");
      const action = document.createElement("button");
      const hasRelay = Boolean(candidate.hasCommunicationRelay);

      row.className = "social-row";
      main.className = "social-row__main";
      name.className = "social-row__name";
      status.className = "social-row__status";
      name.textContent = candidate.publicName || candidate.playerId;
      if (multiplayer.socialMode === "relay") {
        status.textContent = candidate.friend ? "Friend relay online" : "Relay online";
      } else {
        status.textContent = candidate.online
          ? candidate.friend
            ? hasRelay
              ? "Friend online, relay ready"
              : "Friend online"
            : hasRelay
            ? "Online, relay ready"
            : "Online"
          : candidate.friend
          ? "Friend offline"
          : "Offline";
      }

      action.type = "button";
      action.dataset.playerId = candidate.playerId;
      if (multiplayer.socialMode === "relay") {
        action.dataset.action = "invite";
        action.textContent = candidate.friend ? "Invite" : "Link";
        action.title = candidate.friend ? "Invite friend" : "Link as friends";
        action.disabled = !candidate.online || !hasRelay || !hasCommunicationRelay();
      }

      main.append(name, status);
      row.append(main);
      if (multiplayer.socialMode === "relay") {
        row.append(action);
      }
      playerSearchList.append(row);
    }
  }

  function largestMassInWorld(world) {
    const particlesSource = world && Array.isArray(world.particles) ? world.particles : [];
    return particlesSource.reduce((best, particle) => Math.max(best, finiteOr(particle && particle.mass, 0)), 0);
  }

  function normalizeLeaderboardEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const score = Math.max(1, Math.round(finiteOr(entry.score || entry.maxMass, 1)));
    return {
      id: String(entry.id || entry.playerId || "score"),
      playerId: String(entry.playerId || ""),
      name: sanitizePlayerName(entry.name) || "Player",
      score,
      difficulty: difficultyDefinitions[entry.difficulty] ? entry.difficulty : defaultDifficultyId,
      bodyScore: Math.max(0, Math.round(finiteOr(entry.bodyScore, 0))),
      mobScore: Math.max(0, Math.round(finiteOr(entry.mobScore, 0))),
      maxTier: String(entry.maxTier || "particle"),
      survived: String(entry.survived || ""),
      cause: String(entry.cause || ""),
      createdAt: finiteOr(entry.createdAt, 0),
      local: entry.playerId === player.id
    };
  }

  function localLeaderboardScore() {
    updateLifeStats();
    return Math.max(1, Math.round(lifeStats.bestScore || lifeStats.currentScore));
  }

  function collectLeaderboardEntries() {
    const entries = leaderboard.entries.map((entry) => ({
      ...entry,
      local: entry.playerId === player.id
    }));
    const liveEntries = [];

    if (!deathState.active) {
      liveEntries.push({
        id: (player.id || "local-player") + ":live",
        playerId: player.id || "local-player",
        name: player.name || "Player",
        score: localLeaderboardScore(),
        difficulty: runState.difficultyId,
        local: true,
        live: true
      });
    }
    const seenLivePlayers = new Set([player.id]);

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!remote || !remote.playerId || seenLivePlayers.has(remote.playerId)) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const remotePlayer = snapshot && snapshot.player ? snapshot.player : null;
      const remoteDifficulty = remotePlayer && difficultyDefinitions[remotePlayer.difficulty] ? remotePlayer.difficulty : defaultDifficultyId;
      const fallbackScore = largestMassInWorld(snapshot && snapshot.world) * difficultyDefinition(remoteDifficulty).bodyScoreMultiplier;
      const score = Math.max(1, Math.round(finiteOr(remotePlayer && remotePlayer.score, fallbackScore)));
      seenLivePlayers.add(remote.playerId);
      liveEntries.push({
        id: remote.playerId + ":live",
        playerId: remote.playerId,
        name: remote.publicName || (remotePlayer && remotePlayer.name) || "Contact",
        score,
        difficulty: remoteDifficulty,
        local: false,
        live: true
      });
    }

    entries.push(...liveEntries);
    return entries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.live !== b.live) {
        return a.live ? 1 : -1;
      }
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function renderLeaderboard() {
    if (!leaderboardList) {
      return;
    }

    leaderboardList.textContent = "";
    collectLeaderboardEntries().forEach((entry, index) => {
      const row = document.createElement("div");
      const rank = document.createElement("span");
      const name = document.createElement("strong");
      const score = document.createElement("span");

      row.className = "leaderboard-row";
      row.classList.toggle("is-local", entry.local);
      rank.className = "leaderboard-row__rank";
      name.className = "leaderboard-row__name";
      score.className = "leaderboard-row__score";

      rank.textContent = "#" + (index + 1);
      name.textContent = entry.name + " [" + difficultyLabel(entry.difficulty) + "]" + (entry.local ? " (you)" : "") + (entry.live ? " current" : "");
      score.textContent = entry.score + " pts";

      row.append(rank, name, score);
      leaderboardList.append(row);
    });
  }

  function setLeaderboardOpen(open) {
    leaderboard.open = Boolean(open);
    if (leaderboardPanel) {
      leaderboardPanel.classList.toggle("is-open", leaderboard.open);
      leaderboardPanel.setAttribute("aria-hidden", leaderboard.open ? "false" : "true");
    }
    if (leaderboardToggle) {
      leaderboardToggle.classList.toggle("is-active", leaderboard.open);
      leaderboardToggle.setAttribute("aria-expanded", leaderboard.open ? "true" : "false");
    }
    if (leaderboard.open) {
      renderLeaderboard();
      void refreshLeaderboard(false);
    }
  }

  function inviteFriend(targetPlayerId) {
    if (!targetPlayerId) {
      return;
    }

    sendMultiplayer({
      type: "friend.invite",
      targetPlayerId
    });
  }

  function focusCommandInput() {
    if (!commandInput) {
      return;
    }

    commandInput.focus({ preventScroll: true });
    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
  }

  function setCommandLockedState(locked) {
    multiplayer.commandUnlocked = !locked;
    if (!commandInput) {
      return;
    }

    commandInput.type = locked ? "password" : "text";
    commandInput.placeholder = locked ? "Password" : "/tp player";
    commandInput.value = locked ? "" : "/";
    multiplayer.commandCompletions = [];
    multiplayer.commandCompletionIndex = 0;
    updateCommandHint();
    focusCommandInput();
  }

  function setCommandOpen(open) {
    multiplayer.commandOpen = Boolean(open);
    if (commandPanel) {
      commandPanel.classList.toggle("is-open", multiplayer.commandOpen);
      commandPanel.setAttribute("aria-hidden", multiplayer.commandOpen ? "false" : "true");
    }

    if (!commandInput) {
      return;
    }

    if (multiplayer.commandOpen) {
      setCommandLockedState(true);
      void refreshPlayerSearch();
      focusCommandInput();
      window.requestAnimationFrame(focusCommandInput);
      window.setTimeout(function () {
        focusCommandInput();
      }, 0);
    } else {
      commandInput.blur();
      commandInput.type = "text";
      commandInput.value = "";
      multiplayer.commandUnlocked = false;
      multiplayer.commandCompletions = [];
      multiplayer.commandCompletionIndex = 0;
    }
  }

  function knownTeleportPlayers() {
    const players = [];
    const seen = new Set();
    const addPlayer = (candidate) => {
      if (
        !candidate ||
        !candidate.playerId ||
        candidate.playerId === player.id ||
        seen.has(candidate.playerId) ||
        !candidate.online
      ) {
        return;
      }

      seen.add(candidate.playerId);
      players.push(candidate);
    };

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!remote.playerId) {
        continue;
      }
      const snapshot = displaySnapshotFor(remote);
      addPlayer({
        playerId: remote.playerId,
        publicName: remote.publicName || remote.playerId,
        online: true,
        live: Boolean(snapshot && snapshot.player),
        remote
      });
    }

    for (const candidate of multiplayer.players || []) {
      addPlayer({
        playerId: candidate.playerId,
        publicName: candidate.publicName || candidate.playerId,
        online: Boolean(candidate.online),
        live: false,
        remote: null
      });
    }

    return players.sort((a, b) => {
      if (a.live !== b.live) {
        return a.live ? -1 : 1;
      }
      if (a.online !== b.online) {
        return a.online ? -1 : 1;
      }
      return String(a.publicName).localeCompare(String(b.publicName));
    });
  }

  function commandPlayerToken(name) {
    return String(name || "").trim().replace(/\s+/g, "_");
  }

  function normalizeCommandPlayerToken(token) {
    return String(token || "").trim().replace(/_/g, " ").toLowerCase();
  }

  function matchingTeleportPlayers(partial) {
    const normalized = normalizeCommandPlayerToken(partial);
    return knownTeleportPlayers().filter((candidate) => {
      const name = String(candidate.publicName || "").toLowerCase();
      const id = String(candidate.playerId || "").toLowerCase();
      const token = commandPlayerToken(candidate.publicName).toLowerCase();
      return !normalized || name.includes(normalized) || id.includes(normalized) || token.includes(normalized.replace(/\s+/g, "_"));
    });
  }

  function updateCommandHint() {
    if (!commandHint || !commandInput) {
      return;
    }

    if (!multiplayer.commandUnlocked) {
      commandHint.textContent = "Type password to unlock commands";
      return;
    }

    const value = commandInput.value.trim();
    if (!value) {
      commandHint.textContent = "Available: /tp <player>, /spawn body <type>, /tech <type> <amount>, /reset all";
      return;
    }

    if (/^\/reset(\s|$)/i.test(value)) {
      commandHint.textContent = "Available: /reset world, /reset players, /reset all";
      return;
    }

    if (/^\/spawn(\s|$)/i.test(value)) {
      commandHint.textContent = "Bodies: rock, boulder, asteroid, dwarf-moon, moon, planet";
      return;
    }

    if (/^\/tech(\s|$)/i.test(value)) {
      commandHint.textContent = "Tech: all, suction, weapon, plating, energy, repair, target, propulsion, shield, communication";
      return;
    }

    if (!/^\/tp(\s|$)/i.test(value)) {
      commandHint.textContent = "Available: /tp <player>, /spawn body <type>, /tech <type> <amount>, /reset all";
      return;
    }

    const partial = value.replace(/^\/tp\s*/i, "");
    const matches = matchingTeleportPlayers(partial).slice(0, 6);
    if (!matches.length) {
      commandHint.textContent = "No matching players. Open online list or overlap first.";
      return;
    }

    commandHint.textContent = matches
      .map((candidate) => commandPlayerToken(candidate.publicName) + (candidate.live ? "" : " (no live position)"))
      .join("  ");
  }

  function completeTeleportCommand() {
    if (!commandInput) {
      return;
    }

    if (!multiplayer.commandUnlocked) {
      updateCommandHint();
      return;
    }

    const command = commandInput.value;
    if (!/^\/tp(\s|$)/i.test(command)) {
      commandInput.value = "/tp ";
      updateCommandHint();
      return;
    }

    const partial = command.replace(/^\/tp\s*/i, "");
    const matches = matchingTeleportPlayers(partial);
    if (!matches.length) {
      updateCommandHint();
      return;
    }

    if (!multiplayer.commandCompletions.length || multiplayer.commandCompletions.map((item) => item.playerId).join("|") !== matches.map((item) => item.playerId).join("|")) {
      multiplayer.commandCompletions = matches;
      multiplayer.commandCompletionIndex = 0;
    } else {
      multiplayer.commandCompletionIndex = (multiplayer.commandCompletionIndex + 1) % multiplayer.commandCompletions.length;
    }

    const selected = multiplayer.commandCompletions[multiplayer.commandCompletionIndex];
    commandInput.value = "/tp " + commandPlayerToken(selected.publicName);
    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
    updateCommandHint();
  }

  function tryUnlockCommandConsole(rawCommand) {
    if (String(rawCommand || "") === commandPassword) {
      setCommandLockedState(false);
      maybeNotifyText("Commands unlocked.");
      return true;
    }

    maybeNotifyText("Incorrect password.");
    if (commandInput) {
      commandInput.value = "";
    }
    updateCommandHint();
    return false;
  }

  async function executeCommand(rawCommand) {
    if (!multiplayer.commandUnlocked) {
      tryUnlockCommandConsole(rawCommand);
      return;
    }

    const command = String(rawCommand || "").trim();
    if (!command) {
      setCommandOpen(false);
      return;
    }

    if (!command.startsWith("/")) {
      maybeNotifyText("Commands start with /.");
      setCommandOpen(false);
      return;
    }

    if (/^\/reset(\s|$)/i.test(command)) {
      const target = command.replace(/^\/reset\s*/i, "").trim().toLowerCase();
      await executeResetCommand(target);
      setCommandOpen(false);
      return;
    }

    if (/^\/spawn(\s|$)/i.test(command)) {
      executeSpawnCommand(command);
      setCommandOpen(false);
      return;
    }

    if (/^\/tech(\s|$)/i.test(command)) {
      executeTechCommand(command);
      setCommandOpen(false);
      return;
    }

    if (!/^\/tp(\s|$)/i.test(command)) {
      maybeNotifyText("Unknown command. Try /tp <player>, /spawn body <type>, /tech <type> <amount>, or /reset all.");
      setCommandOpen(false);
      return;
    }

    const targetToken = command.replace(/^\/tp\s*/i, "");
    if (!targetToken) {
      const livePlayers = knownTeleportPlayers().filter((candidate) => candidate.live);
      maybeNotifyText(livePlayers.length ? "Use Tab to choose: " + livePlayers.map((candidate) => commandPlayerToken(candidate.publicName)).join(", ") : "No live player positions yet.");
      updateCommandHint();
      return;
    }

    teleportToPlayer(targetToken);
    setCommandOpen(false);
  }

  function executeSpawnCommand(command) {
    const match = command.match(/^\/spawn\s+body(?:\s+(.+))?$/i);
    const typeToken = match && match[1] ? match[1].trim() : "";
    if (!match || !typeToken) {
      maybeNotifyText("Use /spawn body rock, boulder, asteroid, dwarf-moon, moon, or planet.");
      updateCommandHint();
      return;
    }

    const tier = bodyTierForCommandToken(typeToken);
    if (!tier) {
      maybeNotifyText("Unknown body type. Try rock, boulder, asteroid, dwarf-moon, moon, or planet.");
      return;
    }

    const mass = Math.max(1, tier.threshold);
    const aimAngle = getCursorAimAngle();
    const direction = cameraLocalToWorld(Math.cos(aimAngle), Math.sin(aimAngle));
    const radius = radiusFromMass(mass);
    const distance = Math.max(180, player.radius + radius + 120);
    const body = createParticle(
      player.x + direction.x * distance,
      player.y + direction.y * distance,
      mass,
      randomParticleColor()
    );
    body.vx = 0;
    body.vy = 0;
    particles.push(body);
    maybeNotifyText("Spawned " + tier.article + " " + tier.name + ".");
    void savePersistentState({ includeWorld: true });
  }

  function techTypeForCommandToken(token) {
    const normalized = String(token || "")
      .trim()
      .toLowerCase()
      .replace(/[-_\s]+/g, "")
      .replace(/tech$/, "");
    return techTypes.find((tech) => tech.key.replace(/[-_\s]+/g, "") === normalized) || null;
  }

  function executeTechCommand(command) {
    const match = command.match(/^\/tech\s+([^\s]+)(?:\s+([^\s]+))?$/i);
    const techToken = match && match[1] ? match[1] : "";
    const normalizedTechToken = techToken.toLowerCase();
    const amountToken = match && match[2] ? match[2] : "";
    const tech = techTypeForCommandToken(techToken);
    const amount = Math.floor(Number(amountToken));

    if ((!tech && normalizedTechToken !== "all") || !Number.isFinite(amount) || amount <= 0) {
      maybeNotifyText("Use /tech all 10, /tech weapon 10, /tech suction 25, etc.");
      updateCommandHint();
      return;
    }

    if (normalizedTechToken === "all") {
      for (const techType of techTypes) {
        techInventory[techType.key] = Math.max(0, Math.floor(techInventory[techType.key] || 0)) + amount;
      }
      updateTechUi();
      maybeNotifyText("Added " + amount + " of every tech type.");
      void savePersistentState({ includeWorld: false });
      return;
    }

    techInventory[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0)) + amount;
    updateTechUi();
    maybeNotifyText("Added " + amount + " " + tech.label.toLowerCase() + ".");
    void savePersistentState({ includeWorld: false });
  }

  async function executeResetCommand(target) {
    if (target !== "world" && target !== "players" && target !== "all") {
      maybeNotifyText("Use /reset world, /reset players, or /reset all.");
      updateCommandHint();
      return;
    }

    if (persistence.resetInFlight) {
      maybeNotifyText("Reset already running.");
      return;
    }

    persistence.resetInFlight = true;

    try {
      await waitForPersistenceIdle();
      await fetchPersistentJson("/api/reset/" + target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id })
      });

      if (target === "world") {
        resetLocalWorldState();
        await savePersistentState({ includeWorld: true });
        maybeNotifyText("World data reset.");
      } else if (target === "players") {
        resetLocalPlayerState();
        await savePersistentState({ includeWorld: false });
        maybeNotifyText("Player data reset.");
      } else {
        resetLocalPlayerState();
        resetLocalWorldState();
        await savePersistentState({ includeWorld: true });
        maybeNotifyText("World and player data reset.");
      }
    } catch (error) {
      maybeNotifyText("Reset failed: " + (error instanceof Error ? error.message : "unknown error"));
    } finally {
      persistence.resetInFlight = false;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
    }
  }

  function teleportToPlayer(targetToken) {
    const target = matchingTeleportPlayers(targetToken).find((candidate) => candidate.live) || matchingTeleportPlayers(targetToken)[0];
    if (!target) {
      maybeNotifyText("No player matched " + targetToken + ".");
      return;
    }

    const targetSnapshot = target.remote ? displaySnapshotFor(target.remote) : null;
    if (!target.remote || !targetSnapshot || !targetSnapshot.player) {
      maybeNotifyText(target.publicName + " has no live position yet. Overlap or invite them first.");
      return;
    }

    const remotePlayer = transformedRemoteEntity(targetSnapshot.player, displayTransformFor(target.remote));
    if (player.landed) {
      detachFromBody(120);
    }

    const angle = Math.atan2(player.y - remotePlayer.y, player.x - remotePlayer.x) || -Math.PI / 2;
    const offset = Math.max(150, (remotePlayer.radius || 34) + player.radius + 120);
    player.x = remotePlayer.x + Math.cos(angle) * offset;
    player.y = remotePlayer.y + Math.sin(angle) * offset;
    player.vx = 0;
    player.vy = 0;
    cameraRoll = 0;
    maybeNotifyText("Teleported near " + target.publicName + ".");
    void savePersistentState({ includeWorld: true });
    sendMultiplayer({
      type: "input",
      snapshot: buildRealtimeSnapshot()
    });
  }

  function connectMultiplayer() {
    if (!multiplayer.enabled || multiplayer.socket || !player.id) {
      return;
    }

    const socket = new WebSocket(websocketUrl());
    multiplayer.socket = socket;

    socket.addEventListener("open", function () {
      multiplayer.connected = true;
      multiplayer.reconnectDelay = 1.5;
      sendMultiplayer({
        type: "hello",
        playerId: player.id,
        snapshot: buildRealtimeSnapshot()
      });
    });

    socket.addEventListener("message", function (event) {
      try {
        handleMultiplayerMessage(JSON.parse(event.data));
      } catch (error) {
        reportClientError({
          kind: "multiplayer-message",
          message: error && error.message ? error.message : "Malformed multiplayer message",
          source: "/ws",
          line: 0,
          column: 0,
          stack: error && error.stack ? error.stack : ""
        });
      }
    });

    socket.addEventListener("close", scheduleMultiplayerReconnect);
    socket.addEventListener("error", scheduleMultiplayerReconnect);
  }

  function scheduleMultiplayerReconnect(event) {
    if (deathState.resetInFlight) {
      return;
    }

    if (event && event.currentTarget && multiplayer.socket !== event.currentTarget) {
      return;
    }

    multiplayer.connected = false;
    multiplayer.socket = null;
    multiplayer.reconnectTimer = multiplayer.reconnectDelay;
    multiplayer.reconnectDelay = Math.min(12, multiplayer.reconnectDelay * 1.5);
  }

  function sendMultiplayer(message) {
    const socket = multiplayer.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch {
      scheduleMultiplayerReconnect({ currentTarget: socket });
      try {
        socket.close();
      } catch {
        // The socket is already unusable; reconnect scheduling above is the important part.
      }
      return false;
    }
  }

  function handleMultiplayerMessage(message) {
    if (!message || typeof message !== "object") {
      return;
    }

    if (message.type === "bootstrap") {
      applyMultiplayerProfile(message.profile);
      multiplayer.universeId = message.universeId || multiplayer.universeId;
      multiplayer.bubbleRadius = finiteOr(message.bubbleRadius, multiplayer.bubbleRadius);
      multiplayer.onlineCount = Math.max(0, Math.floor(finiteOr(message.onlineCount, multiplayer.onlineCount)));
      multiplayer.players = Array.isArray(message.players) ? message.players : multiplayer.players;
      updateOnlineUi();
      if (multiplayer.panelOpen) {
        renderPlayerSearch();
      }
      return;
    }

    if (message.type === "error") {
      maybeNotifyText(message.message || "Multiplayer request failed.");
      return;
    }

    if (message.type === "presence.update") {
      multiplayer.onlineCount = Math.max(0, Math.floor(finiteOr(message.onlineCount, multiplayer.onlineCount)));
      updateOnlineUi();
      if (multiplayer.panelOpen) {
        void refreshPlayerSearch();
      }
      return;
    }

    if (message.type === "signal.detected") {
      showSignalPrompt(message);
      return;
    }

    if (message.type === "signal.ended") {
      hideSignalPrompt();
      if (message.reason === "timeout") {
        maybeNotifyText("Signal faded.");
      }
      return;
    }

    if (message.type === "overlap.start") {
      maybeNotifyText(message.mode === "friend" ? "Friend universe aligned." : "Universe overlap detected.");
      return;
    }

    if (message.type === "overlap.transform") {
      updateRemoteTransforms(message);
      return;
    }

    if (message.type === "overlap.snapshot") {
      applyRemoteSnapshot(message);
      return;
    }

    if (message.type === "overlap.end") {
      clearOverlap(message.overlapId);
      maybeNotifyText("Universe drift restored.");
      return;
    }

    if (message.type === "friend.invite") {
      showFriendInvite(message);
      return;
    }

    if (message.type === "friend.invite.sent") {
      maybeNotifyText(message.message || (message.online ? "Relay signal sent." : "Relay contact is offline."));
      if (multiplayer.panelOpen) {
        void refreshPlayerSearch();
      }
      return;
    }

    if (message.type === "player.death") {
      const transform = message.transform || {};
      spawnCommunicationTechDrop(
        finiteOr(message.x, 0) + finiteOr(transform.offsetX, 0),
        finiteOr(message.y, 0) + finiteOr(transform.offsetY, 0),
        finiteOr(message.vx, 0),
        finiteOr(message.vy, 0),
        message.fromName || "A contact"
      );
      return;
    }

    if (message.type === "interaction.request") {
      handleInteractionRequest(message);
      return;
    }

    if (message.type === "interaction.result") {
      handleInteractionResult(message);
      return;
    }

    if (message.type === "trade.offer") {
      handleTradeOffer(message);
      return;
    }

    if (message.type === "trade.accept") {
      handleTradeAccept(message);
      return;
    }

    if (message.type === "reset.world") {
      resetLocalWorldState();
      if (message.actorPlayerId !== player.id) {
        maybeNotifyText("World data reset.");
      }
      return;
    }

    if (message.type === "reset.players") {
      resetLocalPlayerState();
      if (message.actorPlayerId !== player.id) {
        maybeNotifyText("Player data reset.");
      }
      return;
    }

    if (message.type === "reset.all") {
      resetLocalPlayerState();
      resetLocalWorldState();
      if (message.actorPlayerId !== player.id) {
        maybeNotifyText("World and player data reset.");
      }
      return;
    }

    if (message.type === "entity.effect") {
      applyRemoteEntityEffect(message);
    }
  }

  function showSignalPrompt(message) {
    multiplayer.pendingSignal = {
      kind: "signal",
      signalId: message.signalId,
      other: message.other || null
    };
    if (signalName) {
      signalName.textContent = message.other && message.other.publicName ? message.other.publicName : "Unknown contact";
    }
    if (investigateSignal) {
      investigateSignal.textContent = "Investigate";
    }
    if (avoidSignal) {
      avoidSignal.textContent = "Avoid";
    }
    if (signalPanel) {
      signalPanel.classList.add("is-open");
      signalPanel.setAttribute("aria-hidden", "false");
    }
  }

  function showFriendInvite(message) {
    multiplayer.pendingSignal = {
      kind: "friend",
      fromPlayerId: message.fromPlayerId,
      fromName: message.fromName
    };
    if (signalName) {
      signalName.textContent = (message.fromName || "Friend") + " invited you";
    }
    if (investigateSignal) {
      investigateSignal.textContent = "Join";
    }
    if (avoidSignal) {
      avoidSignal.textContent = "Decline";
    }
    if (signalPanel) {
      signalPanel.classList.add("is-open");
      signalPanel.setAttribute("aria-hidden", "false");
    }
  }

  function hideSignalPrompt() {
    multiplayer.pendingSignal = null;
    if (signalPanel) {
      signalPanel.classList.remove("is-open");
      signalPanel.setAttribute("aria-hidden", "true");
    }
  }

  function choosePendingSignal(choice) {
    const pending = multiplayer.pendingSignal;
    if (!pending) {
      return;
    }

    if (pending.kind === "friend") {
      if (choice === "investigate") {
        sendMultiplayer({
          type: "friend.accept",
          fromPlayerId: pending.fromPlayerId
        });
      }
      hideSignalPrompt();
      return;
    }

    sendMultiplayer({
      type: "signal.choice",
      signalId: pending.signalId,
      choice
    });
    hideSignalPrompt();
  }

  function interactionChoiceByKey(key) {
    return playerInteractionChoicesConfig.find((choice) => choice.key === key) || null;
  }

  function normalizeInteractionChoice(key) {
    return interactionChoiceByKey(key) ? key : "";
  }

  function playerIdForInteractionTarget(target) {
    return target && target.remote ? target.remote.playerId || "" : "";
  }

  function findRemoteInteractionTargetByPlayerId(playerId) {
    if (!playerId) {
      return null;
    }

    for (const target of collectRemoteCombatPlayers()) {
      if (playerIdForInteractionTarget(target) === playerId) {
        return target;
      }
    }

    return null;
  }

  function findNearbyInteractionTarget() {
    let best = null;
    let bestDistance = Infinity;

    for (const target of collectRemoteCombatPlayers()) {
      const targetPlayerId = playerIdForInteractionTarget(target);
      if (!targetPlayerId) {
        continue;
      }

      const distance = Math.hypot(target.player.x - player.x, target.player.y - player.y);
      if (distance <= playerInteractionRange && distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    }

    return best;
  }

  function setPlayerInteractionMenu(open, target, requestedChoice) {
    if (!open || !target) {
      multiplayer.interactionMenu = null;
      if (playerInteractionPanel) {
        playerInteractionPanel.classList.remove("is-open");
        playerInteractionPanel.setAttribute("aria-hidden", "true");
      }
      return;
    }

    const targetPlayerId = playerIdForInteractionTarget(target);
    if (!targetPlayerId) {
      return;
    }

    const requested = normalizeInteractionChoice(requestedChoice);
    const selectedIndex = Math.max(
      0,
      playerInteractionChoicesConfig.findIndex((choice) => choice.key === requested)
    );
    multiplayer.interactionMenu = {
      targetPlayerId,
      targetName: target.publicName || target.player.name || "Contact",
      requestedChoice: requested,
      selectedIndex
    };
    renderPlayerInteractionMenu();
  }

  function renderPlayerInteractionMenu() {
    const menu = multiplayer.interactionMenu;
    if (!playerInteractionPanel || !playerInteractionChoices || !menu) {
      return;
    }

    if (playerInteractionName) {
      playerInteractionName.textContent = menu.requestedChoice
        ? menu.targetName + " is asking"
        : menu.targetName;
    }

    playerInteractionChoices.textContent = "";
    playerInteractionChoicesConfig.forEach((choice, index) => {
      const button = document.createElement("button");
      const icon = document.createElement("span");
      const label = document.createElement("span");
      button.type = "button";
      button.className = "player-interaction__choice";
      button.dataset.choice = choice.key;
      if (index === menu.selectedIndex) {
        button.classList.add("is-selected");
      }
      if (choice.key === menu.requestedChoice) {
        button.classList.add("is-requested");
      }
      icon.className = "player-interaction__icon";
      icon.textContent = choice.icon;
      label.textContent = choice.label;
      button.append(icon, label);
      playerInteractionChoices.append(button);
    });

    playerInteractionPanel.classList.add("is-open");
    playerInteractionPanel.setAttribute("aria-hidden", "false");
  }

  function movePlayerInteractionSelection(delta) {
    const menu = multiplayer.interactionMenu;
    if (!menu) {
      return;
    }

    const count = playerInteractionChoicesConfig.length;
    menu.selectedIndex = (menu.selectedIndex + delta + count) % count;
    renderPlayerInteractionMenu();
  }

  function choosePlayerInteraction(choiceKey) {
    const menu = multiplayer.interactionMenu;
    const choice = normalizeInteractionChoice(choiceKey);
    if (!menu || !choice) {
      return;
    }

    sendMultiplayer({
      type: "interaction.choice",
      targetPlayerId: menu.targetPlayerId,
      choice
    });
    showRemoteInteractionEmote(player.id, choice, player.name || "You");
    maybeNotifyText("Asked " + menu.targetName + " to " + interactionChoiceByKey(choice).label.toLowerCase() + ".");
    setPlayerInteractionMenu(false);
  }

  function openIncomingInteractionMenu() {
    let newest = null;
    for (const interaction of multiplayer.incomingInteractions.values()) {
      if (!newest || interaction.receivedAt > newest.receivedAt) {
        newest = interaction;
      }
    }

    if (!newest) {
      return false;
    }

    const target = findRemoteInteractionTargetByPlayerId(newest.fromPlayerId) || {
      remote: { playerId: newest.fromPlayerId },
      player: { name: newest.fromName || "Contact" },
      publicName: newest.fromName || "Contact"
    };
    setPlayerInteractionMenu(true, target, newest.choice);
    return true;
  }

  function beginNearbyInteraction() {
    if (openIncomingInteractionMenu()) {
      return true;
    }

    const target = findNearbyInteractionTarget();
    if (!target) {
      return false;
    }

    setPlayerInteractionMenu(true, target, "");
    return true;
  }

  function handleInteractionRequest(message) {
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    const choice = normalizeInteractionChoice(message.choice);
    if (!fromPlayerId || !choice) {
      return;
    }

    const fromName = message.fromName || "Contact";
    multiplayer.incomingInteractions.set(fromPlayerId, {
      fromPlayerId,
      fromName,
      choice,
      receivedAt: performance.now()
    });
    showRemoteInteractionEmote(fromPlayerId, choice, fromName);
    maybeNotifyText(fromName + " wants to " + interactionChoiceByKey(choice).label.toLowerCase() + ". Press Enter to respond.");
  }

  function handleInteractionResult(message) {
    const choice = normalizeInteractionChoice(message.choice);
    const targetPlayerId = typeof message.targetPlayerId === "string" ? message.targetPlayerId : "";
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    const peerId = fromPlayerId === player.id ? targetPlayerId : fromPlayerId;
    const peerName = message.peerName || message.fromName || "Contact";

    if (choice) {
      multiplayer.incomingInteractions.delete(peerId);
    }

    if (message.accepted && choice === "trade") {
      openTradeSession(peerId, peerName);
      return;
    }

    if (message.accepted && choice === "truce") {
      if (peerId) {
        multiplayer.truces.add(peerId);
      }
      maybeNotifyText("Truce agreed with " + peerName + ". PvP is off.");
      return;
    }

    if (message.accepted && choice === "team") {
      maybeNotifyText("Team formed with " + peerName + ".");
      return;
    }

    if (choice) {
      maybeNotifyText(peerName + " chose " + interactionChoiceByKey(choice).label + ".");
    }
  }

  function showRemoteInteractionEmote(playerId, choiceKey, fromName) {
    const choice = interactionChoiceByKey(choiceKey);
    if (!playerId || !choice) {
      return;
    }

    multiplayer.remoteEmotes.set(playerId, {
      playerId,
      label: choice.label,
      speech: choice.speech,
      emote: choice.emote,
      fromName: fromName || "Contact",
      life: 3.8,
      maxLife: 3.8
    });
  }

  function updateInteractionState(dt) {
    const now = performance.now();
    for (const [playerId, interaction] of multiplayer.incomingInteractions) {
      if (now - interaction.receivedAt > 18000) {
        multiplayer.incomingInteractions.delete(playerId);
      }
    }

    for (const [playerId, emote] of multiplayer.remoteEmotes) {
      emote.life -= dt;
      if (emote.life <= 0) {
        multiplayer.remoteEmotes.delete(playerId);
      }
    }

    if (multiplayer.interactionMenu) {
      const target = findRemoteInteractionTargetByPlayerId(multiplayer.interactionMenu.targetPlayerId);
      if (!target || Math.hypot(target.player.x - player.x, target.player.y - player.y) > playerInteractionRange + 80) {
        setPlayerInteractionMenu(false);
      }
    }
  }

  function normalizeTradeOffer(offer) {
    const source = offer && typeof offer === "object" ? offer : {};
    const normalized = {};
    for (const tech of techTypes) {
      normalized[tech.key] = Math.max(0, Math.floor(finiteOr(source[tech.key], 0)));
    }
    return normalized;
  }

  function tradeOfferTotal(offer) {
    return techTypes.reduce((total, tech) => total + Math.max(0, Math.floor(offer && offer[tech.key] || 0)), 0);
  }

  function canAffordTradeOffer(offer) {
    return techTypes.every((tech) => Math.max(0, Math.floor(offer && offer[tech.key] || 0)) <= Math.floor(techInventory[tech.key] || 0));
  }

  function openTradeSession(peerId, peerName) {
    if (!peerId) {
      return;
    }

    multiplayer.trade = {
      peerId,
      peerName: peerName || "Contact",
      localOffer: normalizeTradeOffer(null),
      remoteOffer: normalizeTradeOffer(null),
      localSent: false,
      remoteSent: false,
      localAccepted: false,
      remoteAccepted: false,
      completed: false
    };
    setPlayerInteractionMenu(false);
    renderTradePanel();
  }

  function closeTradeSession() {
    multiplayer.trade = null;
    if (tradePanel) {
      tradePanel.classList.remove("is-open");
      tradePanel.setAttribute("aria-hidden", "true");
    }
  }

  function renderTradePanel() {
    const trade = multiplayer.trade;
    if (!tradePanel || !trade) {
      return;
    }

    if (tradePeerName) {
      tradePeerName.textContent = "Trade with " + trade.peerName;
    }

    renderTradeOfferList();
    renderTradeReceiveList();
    updateTradeStatus();
    tradePanel.classList.add("is-open");
    tradePanel.setAttribute("aria-hidden", "false");
  }

  function renderTradeOfferList() {
    if (!tradeOfferList || !multiplayer.trade) {
      return;
    }

    tradeOfferList.textContent = "";
    for (const tech of techTypes) {
      const amount = Math.max(0, Math.floor(multiplayer.trade.localOffer[tech.key] || 0));
      const owned = Math.floor(techInventory[tech.key] || 0);
      const row = document.createElement("div");
      const dot = document.createElement("span");
      const name = document.createElement("span");
      const controls = document.createElement("span");
      const minus = document.createElement("button");
      const value = document.createElement("strong");
      const plus = document.createElement("button");

      row.className = "trade-row";
      row.style.setProperty("--tech-color", tech.color);
      dot.className = "trade-row__dot";
      name.className = "trade-row__name";
      name.textContent = tech.label + " (" + owned + ")";
      controls.className = "trade-row__controls";
      minus.type = "button";
      minus.dataset.tradeKey = tech.key;
      minus.dataset.tradeDelta = "-1";
      minus.textContent = "-";
      value.className = "trade-row__amount";
      value.textContent = amount.toString();
      plus.type = "button";
      plus.dataset.tradeKey = tech.key;
      plus.dataset.tradeDelta = "1";
      plus.textContent = "+";
      plus.disabled = amount >= owned;
      minus.disabled = amount <= 0;
      controls.append(minus, value, plus);
      row.append(dot, name, controls);
      tradeOfferList.append(row);
    }
  }

  function renderTradeReceiveList() {
    if (!tradeReceiveList || !multiplayer.trade) {
      return;
    }

    tradeReceiveList.textContent = "";
    for (const tech of techTypes) {
      const amount = Math.max(0, Math.floor(multiplayer.trade.remoteOffer[tech.key] || 0));
      const row = document.createElement("div");
      const dot = document.createElement("span");
      const name = document.createElement("span");
      const value = document.createElement("strong");
      row.className = "trade-row";
      row.style.setProperty("--tech-color", tech.color);
      dot.className = "trade-row__dot";
      name.className = "trade-row__name";
      name.textContent = tech.label;
      value.className = "trade-row__amount";
      value.textContent = amount.toString();
      row.append(dot, name, value);
      tradeReceiveList.append(row);
    }
  }

  function updateTradeStatus() {
    const trade = multiplayer.trade;
    if (!trade) {
      return;
    }

    if (tradeSendOffer) {
      tradeSendOffer.disabled = !canAffordTradeOffer(trade.localOffer) || trade.completed;
    }
    if (tradeAccept) {
      tradeAccept.disabled =
        trade.completed ||
        !trade.localSent ||
        !trade.remoteSent ||
        !canAffordTradeOffer(trade.localOffer) ||
        (tradeOfferTotal(trade.localOffer) <= 0 && tradeOfferTotal(trade.remoteOffer) <= 0);
    }
    if (!tradeStatus) {
      return;
    }

    if (!canAffordTradeOffer(trade.localOffer)) {
      tradeStatus.textContent = "You do not have enough tech for that offer.";
    } else if (trade.completed) {
      tradeStatus.textContent = "Trade complete.";
    } else if (trade.localAccepted && !trade.remoteAccepted) {
      tradeStatus.textContent = "Waiting for " + trade.peerName + " to accept.";
    } else if (!trade.remoteSent) {
      tradeStatus.textContent = trade.localSent ? "Offer sent. Waiting for their offer." : "Choose resources to trade.";
    } else if (!trade.localSent) {
      tradeStatus.textContent = trade.peerName + " sent an offer. Send yours to continue.";
    } else if (trade.remoteAccepted) {
      tradeStatus.textContent = trade.peerName + " accepted. Accept to complete.";
    } else {
      tradeStatus.textContent = "Both offers are ready.";
    }
  }

  function adjustTradeOffer(techKey, delta) {
    const trade = multiplayer.trade;
    const tech = techByKey(techKey);
    if (!trade || !tech || trade.completed) {
      return;
    }

    const current = Math.max(0, Math.floor(trade.localOffer[tech.key] || 0));
    const owned = Math.floor(techInventory[tech.key] || 0);
    trade.localOffer[tech.key] = clamp(current + delta, 0, owned);
    trade.localSent = false;
    trade.localAccepted = false;
    renderTradePanel();
  }

  function sendTradeOffer() {
    const trade = multiplayer.trade;
    if (!trade || !canAffordTradeOffer(trade.localOffer)) {
      return;
    }

    trade.localSent = true;
    trade.localAccepted = false;
    sendMultiplayer({
      type: "trade.offer",
      targetPlayerId: trade.peerId,
      offer: trade.localOffer
    });
    updateTradeStatus();
  }

  function acceptTradeOffer() {
    const trade = multiplayer.trade;
    if (!trade || trade.completed || !trade.localSent || !trade.remoteSent || !canAffordTradeOffer(trade.localOffer)) {
      return;
    }

    trade.localAccepted = true;
    sendMultiplayer({
      type: "trade.accept",
      targetPlayerId: trade.peerId,
      offer: trade.localOffer
    });

    if (trade.remoteAccepted) {
      completeTrade();
    } else {
      updateTradeStatus();
    }
  }

  function handleTradeOffer(message) {
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    if (!fromPlayerId) {
      return;
    }

    if (!multiplayer.trade || multiplayer.trade.peerId !== fromPlayerId) {
      openTradeSession(fromPlayerId, message.fromName || "Contact");
    }

    multiplayer.trade.remoteOffer = normalizeTradeOffer(message.offer);
    multiplayer.trade.remoteSent = true;
    multiplayer.trade.remoteAccepted = false;
    renderTradePanel();
    maybeNotifyText((message.fromName || "Contact") + " updated their trade offer.");
  }

  function handleTradeAccept(message) {
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    if (!fromPlayerId) {
      return;
    }

    if (!multiplayer.trade || multiplayer.trade.peerId !== fromPlayerId) {
      openTradeSession(fromPlayerId, message.fromName || "Contact");
    }

    multiplayer.trade.remoteOffer = normalizeTradeOffer(message.offer);
    multiplayer.trade.remoteSent = true;
    multiplayer.trade.remoteAccepted = true;
    if (multiplayer.trade.localAccepted) {
      completeTrade();
    } else {
      renderTradePanel();
      maybeNotifyText((message.fromName || "Contact") + " accepted the trade.");
    }
  }

  function completeTrade() {
    const trade = multiplayer.trade;
    if (!trade || trade.completed || !canAffordTradeOffer(trade.localOffer)) {
      updateTradeStatus();
      return;
    }

    for (const tech of techTypes) {
      techInventory[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0) - Math.max(0, Math.floor(trade.localOffer[tech.key] || 0)));
      techInventory[tech.key] += Math.max(0, Math.floor(trade.remoteOffer[tech.key] || 0));
    }

    trade.completed = true;
    updateTechUi();
    void savePersistentState({ includeWorld: false });
    renderTradePanel();
    maybeNotifyText("Trade complete with " + trade.peerName + ".");
  }

  function isTrucedWith(playerId) {
    return Boolean(playerId && multiplayer.truces.has(playerId));
  }

  function buildRealtimeSnapshot() {
    return buildPersistentPayload(true);
  }

  function updateMultiplayer(dt) {
    if (!multiplayer.enabled) {
      return;
    }

    if (!multiplayer.socket && multiplayer.reconnectTimer <= 0) {
      connectMultiplayer();
    }

    if (!multiplayer.socket && multiplayer.reconnectTimer > 0) {
      multiplayer.reconnectTimer -= dt;
    }

    multiplayer.snapshotTimer -= dt;
    if (multiplayer.connected && multiplayer.snapshotTimer <= 0) {
      multiplayer.snapshotTimer = multiplayerSnapshotInterval;
      sendMultiplayer({
        type: "input",
        snapshot: buildRealtimeSnapshot()
      });
    }

    updateRemoteVisualTransforms(dt);
    updateRemoteInteractions(dt);
    updateInteractionState(dt);
    pruneRemoteUniverses();
  }

  function createRemoteTransform(offsetX, offsetY, alpha, phase) {
    return {
      offsetX: finiteOr(offsetX, 0),
      offsetY: finiteOr(offsetY, 0),
      alpha: clamp(finiteOr(alpha, 0), 0, 1),
      phase: phase || "approach"
    };
  }

  function displayTransformFor(remote) {
    return remote.displayTransform || remote.transform || createRemoteTransform(0, 0, 0, "approach");
  }

  function displaySnapshotFor(remote) {
    return remote.displaySnapshot || remote.snapshot || null;
  }

  function updateRemoteVisualTransforms(dt) {
    const positionBlend = 1 - Math.pow(0.0008, dt);
    const alphaBlend = 1 - Math.pow(0.015, dt);
    const now = performance.now() / 1000;

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (remote.transform) {
        if (!remote.displayTransform) {
          remote.displayTransform = createRemoteTransform(
            remote.transform.offsetX,
            remote.transform.offsetY,
            remote.transform.alpha,
            remote.transform.phase
          );
        } else {
          remote.displayTransform.offsetX += (remote.transform.offsetX - remote.displayTransform.offsetX) * positionBlend;
          remote.displayTransform.offsetY += (remote.transform.offsetY - remote.displayTransform.offsetY) * positionBlend;
          remote.displayTransform.alpha += (remote.transform.alpha - remote.displayTransform.alpha) * alphaBlend;
          remote.displayTransform.phase = remote.transform.phase;
        }
      }

      remote.displaySnapshot = buildRemoteDisplaySnapshot(remote, now);
    }
  }

  function updateRemoteTransforms(message) {
    const transforms = Array.isArray(message.transforms) ? message.transforms : [];
    for (const transform of transforms) {
      if (!transform || !transform.universeId) {
        continue;
      }

      const remote = getRemoteUniverse(transform.universeId);
      remote.playerId = transform.playerId || remote.playerId;
      remote.publicName = transform.publicName || remote.publicName;
      remote.overlapId = message.overlapId || remote.overlapId;
      remote.transform = createRemoteTransform(
        finiteOr(transform.offsetX, remote.transform.offsetX || 0),
        finiteOr(transform.offsetY, remote.transform.offsetY || 0),
        finiteOr(transform.alpha, remote.transform.alpha || 0),
        transform.phase || message.phase || remote.transform.phase || "approach"
      );
      if (!remote.displayTransform) {
        remote.displayTransform = {
          ...remote.transform,
          alpha: Math.min(remote.transform.alpha, 0.08)
        };
      }
      remote.seenAt = performance.now();
    }
  }

  function updateRemoteTransformFromSnapshot(remote, transform) {
    if (!transform) {
      return;
    }

    remote.transform = createRemoteTransform(
      finiteOr(transform.offsetX, remote.transform.offsetX || 0),
      finiteOr(transform.offsetY, remote.transform.offsetY || 0),
      finiteOr(transform.alpha, remote.transform.alpha || 0),
      transform.phase || remote.transform.phase
    );

    if (!remote.displayTransform) {
      remote.displayTransform = {
        ...remote.transform,
        alpha: Math.min(remote.transform.alpha, 0.08)
      };
    }
  }

  function getRemoteUniverse(universeId) {
    if (!multiplayer.remoteUniverses.has(universeId)) {
      const initialTransform = createRemoteTransform(0, 0, 0, "approach");
      multiplayer.remoteUniverses.set(universeId, {
        universeId,
        playerId: "",
        publicName: "Unknown",
        overlapId: "",
        transform: initialTransform,
        displayTransform: { ...initialTransform },
        snapshot: null,
        displaySnapshot: null,
        snapshotFrames: [],
        effectCooldowns: new Map(),
        seenAt: performance.now()
      });
    }

    return multiplayer.remoteUniverses.get(universeId);
  }

  function applyRemoteSnapshot(message) {
    const universeId = message.universeId || (message.fromPlayerId ? "solo:" + message.fromPlayerId : "");
    if (!universeId || universeId === multiplayer.universeId) {
      return;
    }

    const remote = getRemoteUniverse(universeId);
    remote.playerId = message.fromPlayerId || remote.playerId;
    remote.publicName = message.publicName || remote.publicName;
    remote.overlapId = message.overlapId || remote.overlapId;
    updateRemoteTransformFromSnapshot(remote, message.transform);
    remote.snapshot = normalizeRemoteSnapshot(message.snapshot);
    remote.seenAt = performance.now();
    addRemoteSnapshotFrame(remote, remote.snapshot, remote.seenAt / 1000);
  }

  function normalizeRemoteSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    const world = source.world && typeof source.world === "object" ? source.world : {};
    return {
      player: normalizeRemotePlayerSnapshot(source.player),
      world: {
        particles: Array.isArray(world.particles) ? world.particles.map(normalizeParticleSnapshot).filter(Boolean) : [],
        alienoids: Array.isArray(world.alienoids) ? world.alienoids.map(normalizeRivalSnapshot).filter(Boolean) : [],
        ufos: Array.isArray(world.ufos) ? world.ufos.map(normalizeUfoSnapshot).filter(Boolean) : [],
        rambots: Array.isArray(world.rambots) ? world.rambots.map(normalizeRambotSnapshot).filter(Boolean) : [],
        engineers: Array.isArray(world.engineers) ? world.engineers.map(normalizeEngineerSnapshot).filter(Boolean) : [],
        teslas: Array.isArray(world.teslas) ? world.teslas.map(normalizeTeslaSnapshot).filter(Boolean) : [],
        rockets: Array.isArray(world.rockets) ? world.rockets.map(normalizeRocketSnapshot).filter(Boolean) : [],
        fighters: Array.isArray(world.fighters) ? world.fighters.map(normalizeFighterSnapshot).filter(Boolean) : [],
        structures: Array.isArray(world.structures) ? world.structures.map(normalizeStructureSnapshot).filter(Boolean) : [],
        rivalProjectiles: Array.isArray(world.rivalProjectiles) ? world.rivalProjectiles.map(normalizeProjectileSnapshot).filter(Boolean) : []
      }
    };
  }

  function normalizeRemotePlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const maxHealth = clamp(finiteOr(snapshot.maxHealth, 100), 1, 100);
    const maxEnergy = clamp(finiteOr(snapshot.maxEnergy, playerBaseMaxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    const equippedTool = toolCatalog.some((tool) => tool.id === snapshot.equippedTool) ? snapshot.equippedTool : null;
    const toolMode = ["pull", "push", "hold", "fire", "idle"].includes(snapshot.toolMode) ? snapshot.toolMode : "idle";
    const activeToolMode = equippedTool ? toolMode : "idle";
    return {
      id: typeof snapshot.id === "string" ? snapshot.id : "",
      name: typeof snapshot.name === "string" ? snapshot.name : "Player",
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 34),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      energy: clamp(finiteOr(snapshot.energy, maxEnergy), 0, maxEnergy),
      maxEnergy,
      landed: normalizeLandingSnapshot(snapshot.landed),
      walkCycle: finiteOr(snapshot.walkCycle, snapshot.landed && snapshot.landed.walkCycle),
      cameraRoll: finiteOr(snapshot.cameraRoll, 0),
      hasCommunicationRelay: Boolean(snapshot.hasCommunicationRelay),
      aimAngle: finiteOr(snapshot.aimAngle, finiteOr(snapshot.aimLocalAngle, 0) - finiteOr(snapshot.cameraRoll, 0)),
      equippedTool,
      toolMode: activeToolMode,
      toolActive: Boolean(equippedTool && (snapshot.toolActive || activeToolMode !== "idle")),
      moving: Boolean(snapshot.moving),
      crouching: Boolean(snapshot.crouching)
    };
  }

  function addRemoteSnapshotFrame(remote, snapshot, receivedAt) {
    if (!remote.snapshotFrames) {
      remote.snapshotFrames = [];
    }

    remote.snapshotFrames.push({ snapshot, receivedAt });
    while (remote.snapshotFrames.length > remoteSnapshotBufferLimit) {
      remote.snapshotFrames.shift();
    }

    if (!remote.displaySnapshot) {
      remote.displaySnapshot = snapshot;
    }
  }

  function buildRemoteDisplaySnapshot(remote, now) {
    const frames = remote.snapshotFrames || [];
    if (!frames.length) {
      return remote.snapshot;
    }

    const renderAt = now - remoteSnapshotRenderDelay;
    let previousFrame = null;
    let nextFrame = null;

    for (const frame of frames) {
      if (frame.receivedAt <= renderAt) {
        previousFrame = frame;
        continue;
      }

      nextFrame = frame;
      break;
    }

    if (!previousFrame) {
      return cloneRemoteSnapshot(nextFrame.snapshot);
    }

    if (!nextFrame) {
      const lead = clamp(renderAt - previousFrame.receivedAt, 0, remoteSnapshotExtrapolateLimit);
      return interpolateRemoteSnapshot(previousFrame.snapshot, previousFrame.snapshot, 1, lead);
    }

    const interval = Math.max(0.001, nextFrame.receivedAt - previousFrame.receivedAt);
    const progress = clamp((renderAt - previousFrame.receivedAt) / interval, 0, 1);
    return interpolateRemoteSnapshot(previousFrame.snapshot, nextFrame.snapshot, progress, 0);
  }

  function cloneRemoteSnapshot(snapshot) {
    return interpolateRemoteSnapshot(snapshot, snapshot, 1, 0);
  }

  function interpolateRemoteSnapshot(fromSnapshot, toSnapshot, progress, lead) {
    const fromWorld = fromSnapshot && fromSnapshot.world ? fromSnapshot.world : {};
    const toWorld = toSnapshot && toSnapshot.world ? toSnapshot.world : {};

    return {
      player: interpolateRemoteEntity(
        fromSnapshot && fromSnapshot.player,
        toSnapshot && toSnapshot.player,
        progress,
        lead,
        { angleKeys: ["cameraRoll", "aimAngle"], scalarKeys: ["radius", "health", "maxHealth", "energy", "maxEnergy", "walkCycle"] }
      ),
      world: {
        particles: interpolateRemoteEntityList(fromWorld.particles, toWorld.particles, progress, lead, {
          scalarKeys: ["mass", "radius", "energy", "maxEnergy"]
        }).map(refreshInterpolatedBody),
        alienoids: interpolateRemoteEntityList(fromWorld.alienoids, toWorld.alienoids, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth"]
        }),
        ufos: interpolateRemoteEntityList(fromWorld.ufos, toWorld.ufos, progress, lead, {
          angleKeys: ["rotation", "beamAngle"],
          scalarKeys: ["radius", "health", "maxHealth"]
        }),
        rambots: interpolateRemoteEntityList(fromWorld.rambots, toWorld.rambots, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth"]
        }),
        engineers: interpolateRemoteEntityList(fromWorld.engineers, toWorld.engineers, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "healPulse"]
        }),
        teslas: interpolateRemoteEntityList(fromWorld.teslas, toWorld.teslas, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "lightningWarmup", "lightningFlash"]
        }),
        rockets: interpolateRemoteEntityList(fromWorld.rockets, toWorld.rockets, progress, lead, {
          angleKeys: ["rotation", "scannerAngle"],
          scalarKeys: ["radius", "health", "maxHealth", "scanProgress", "lockTimer", "blastTimer", "volleyTimer", "volleyShots"]
        }),
        fighters: interpolateRemoteEntityList(fromWorld.fighters, toWorld.fighters, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "shieldCharge", "shieldActive", "shootCooldown"]
        }),
        structures: interpolateRemoteEntityList(fromWorld.structures, toWorld.structures, progress, lead, {
          angleKeys: ["angle", "linkedAngle", "aimAngle"],
          scalarKeys: ["x2", "y2", "deploy", "thrustAmount", "thrustDirection", "health", "maxHealth", "disabledTimer", "flash", "restLength", "linkedSurfaceOffset", "burstTimer", "burstCooldown", "missileCharge", "lockTimer", "beepTimer", "targetX", "targetY", "targetCount"]
        }),
        rivalProjectiles: interpolateRemoteEntityList(fromWorld.rivalProjectiles, toWorld.rivalProjectiles, progress, lead, {
          scalarKeys: ["radius", "length", "life", "maxLife"]
        })
      }
    };
  }

  function interpolateRemoteEntityList(fromList, toList, progress, lead, options) {
    const previousById = new Map();
    const sourceList = Array.isArray(fromList) ? fromList : [];
    const targetList = Array.isArray(toList) ? toList : [];

    for (const entity of sourceList) {
      if (entity && entity.id !== undefined && entity.id !== null) {
        previousById.set(String(entity.id), entity);
      }
    }

    return targetList
      .map((target) => {
        const previous = target && target.id !== undefined && target.id !== null
          ? previousById.get(String(target.id))
          : null;
        return interpolateRemoteEntity(previous, target, progress, lead, options);
      })
      .filter(Boolean);
  }

  function interpolateRemoteEntity(fromEntity, toEntity, progress, lead, options) {
    const source = toEntity || fromEntity;
    if (!source) {
      return null;
    }

    const result = cloneRemoteEntity(source);
    const fromX = finiteOr(fromEntity && fromEntity.x, finiteOr(source.x, 0));
    const fromY = finiteOr(fromEntity && fromEntity.y, finiteOr(source.y, 0));
    const toX = finiteOr(toEntity && toEntity.x, fromX);
    const toY = finiteOr(toEntity && toEntity.y, fromY);
    result.x = fromX + (toX - fromX) * progress + finiteOr(source.vx, 0) * lead;
    result.y = fromY + (toY - fromY) * progress + finiteOr(source.vy, 0) * lead;

    const scalarKeys = options && Array.isArray(options.scalarKeys) ? options.scalarKeys : [];
    for (const key of scalarKeys) {
      if (fromEntity && toEntity && Number.isFinite(Number(fromEntity[key])) && Number.isFinite(Number(toEntity[key]))) {
        result[key] = finiteOr(fromEntity[key], 0) + (finiteOr(toEntity[key], 0) - finiteOr(fromEntity[key], 0)) * progress;
      }
    }

    const angleKeys = options && Array.isArray(options.angleKeys) ? options.angleKeys : [];
    for (const key of angleKeys) {
      if (fromEntity && toEntity && Number.isFinite(Number(fromEntity[key])) && Number.isFinite(Number(toEntity[key]))) {
        const fromAngle = finiteOr(fromEntity[key], 0);
        result[key] = fromAngle + shortestAngleDelta(fromAngle, finiteOr(toEntity[key], fromAngle)) * progress;
      }
    }

    result.landed = interpolateRemoteLanding(fromEntity && fromEntity.landed, toEntity && toEntity.landed, progress, source.landed);
    return result;
  }

  function interpolateRemoteLanding(fromLanding, toLanding, progress, fallback) {
    if (!fromLanding || !toLanding || fromLanding.bodyId !== toLanding.bodyId) {
      return fallback ? { ...fallback } : null;
    }

    const angle = fromLanding.angle + shortestAngleDelta(fromLanding.angle, toLanding.angle) * progress;
    return {
      bodyId: toLanding.bodyId,
      angle,
      walkSpeed: finiteOr(fromLanding.walkSpeed, 0) + (finiteOr(toLanding.walkSpeed, 0) - finiteOr(fromLanding.walkSpeed, 0)) * progress,
      walkCycle: finiteOr(fromLanding.walkCycle, 0) + (finiteOr(toLanding.walkCycle, 0) - finiteOr(fromLanding.walkCycle, 0)) * progress
    };
  }

  function cloneRemoteEntity(entity) {
    return {
      ...entity,
      color: entity.color ? { ...entity.color } : entity.color,
      landed: entity.landed ? { ...entity.landed } : null
    };
  }

  function refreshInterpolatedBody(body) {
    if (!body) {
      return null;
    }

    body.mass = Math.max(1, finiteOr(body.mass, 1));
    body.radius = radiusFromMass(body.mass);
    body.tier = tierForMass(body.mass);
    normalizeBodyEnergy(body);
    return body;
  }

  function clearOverlap(overlapId) {
    for (const [universeId, remote] of multiplayer.remoteUniverses) {
      if (remote.overlapId === overlapId) {
        multiplayer.remoteUniverses.delete(universeId);
      }
    }
  }

  function pruneRemoteUniverses() {
    const now = performance.now();
    for (const [universeId, remote] of multiplayer.remoteUniverses) {
      if (now - remote.seenAt > remoteStaleMs) {
        multiplayer.remoteUniverses.delete(universeId);
      }
    }
  }

  function transformedRemoteEntity(entity, transform) {
    const transformed = Object.assign({}, entity, {
      x: finiteOr(entity.x, 0) + transform.offsetX,
      y: finiteOr(entity.y, 0) + transform.offsetY
    });
    if (Number.isFinite(Number(entity.x2)) && Number.isFinite(Number(entity.y2))) {
      transformed.x2 = finiteOr(entity.x2, 0) + transform.offsetX;
      transformed.y2 = finiteOr(entity.y2, 0) + transform.offsetY;
    }
    return transformed;
  }

  function isRemoteUniverseInteractive(remote) {
    const transform = displayTransformFor(remote);
    return Boolean(transform && transform.alpha >= 0.72 && transform.phase === "overlap");
  }

  function remoteCombatMobSnapshots(snapshot) {
    const world = snapshot && snapshot.world ? snapshot.world : {};
    return []
      .concat(world.alienoids || [])
      .concat(world.ufos || [])
      .concat(world.rambots || [])
      .concat(world.engineers || [])
      .concat(world.teslas || [])
      .concat(world.rockets || [])
      .concat(world.fighters || []);
  }

  function collectRemoteSharedBodies() {
    const bodies = [];

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!isRemoteUniverseInteractive(remote)) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const world = snapshot && snapshot.world ? snapshot.world : null;
      if (!world || !Array.isArray(world.particles)) {
        continue;
      }

      const transform = displayTransformFor(remote);
      for (const particle of world.particles || []) {
        if (!isMappedBody(particle)) {
          continue;
        }

        const body = transformedRemoteEntity(particle, transform);
        if (Math.hypot(body.x - player.x, body.y - player.y) > multiplayer.bubbleRadius + 1800) {
          continue;
        }

        bodies.push({
          remote,
          source: particle,
          body
        });
      }
    }

    return bodies;
  }

  function collectRemoteCombatPlayers() {
    const targets = [];

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!isRemoteUniverseInteractive(remote)) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || !snapshot.player || snapshot.player.health <= 0) {
        continue;
      }

      targets.push({
        local: false,
        remote,
        player: transformedRemoteEntity(snapshot.player, displayTransformFor(remote)),
        publicName: remote.publicName || snapshot.player.name || "Contact"
      });
    }

    return targets;
  }

  function collectCombatPlayerTargets() {
    return [
      {
        local: true,
        remote: null,
        player,
        publicName: player.name || "Player"
      }
    ].concat(collectRemoteCombatPlayers());
  }

  function nearestCombatPlayerTarget(x, y) {
    let best = null;
    let bestDistance = Infinity;

    for (const target of collectCombatPlayerTargets()) {
      if (!target.player || target.player.health <= 0) {
        continue;
      }

      const distance = Math.hypot(target.player.x - x, target.player.y - y);
      if (distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    }

    return best || {
      local: true,
      remote: null,
      player,
      publicName: player.name || "Player"
    };
  }

  function sendRemoteEntityEffect(remote, effect) {
    if (!remote || !remote.universeId || !effect) {
      return;
    }

    sendMultiplayer({
      type: "entity.effect",
      targetUniverseId: remote.universeId,
      targetPlayerId: remote.playerId,
      effect
    });
  }

  function sendThrottledRemoteEntityEffect(remote, key, cooldown, effect) {
    if (!remote || !key) {
      return;
    }

    if (!remote.effectCooldowns) {
      remote.effectCooldowns = new Map();
    }

    const now = performance.now();
    const nextAllowedAt = remote.effectCooldowns.get(key) || 0;
    if (now < nextAllowedAt) {
      return;
    }

    remote.effectCooldowns.set(key, now + cooldown * 1000);
    sendRemoteEntityEffect(remote, effect);
  }

  function updateRemoteInteractions(dt) {
    multiplayer.effectTimer = Math.max(0, multiplayer.effectTimer - dt);
    if (!multiplayer.connected || multiplayer.effectTimer > 0) {
      return;
    }

    const aim = getAim();
    const funnel = getFunnel(aim);
    const suctionActive = canUseSuctionControls() && isGadgetButtonPressed();

    for (const remote of multiplayer.remoteUniverses.values()) {
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || !remote.transform || remote.transform.alpha < 0.72 || remote.transform.phase !== "overlap") {
        continue;
      }

      if (suctionActive && applyRemoteGadgetEffect(remote, aim, funnel, dt)) {
        multiplayer.effectTimer = remoteEffectInterval;
        return;
      }

      if (applyRemoteLaserEffect(remote)) {
        multiplayer.effectTimer = remoteEffectInterval;
        return;
      }
    }
  }

  function applyRemoteGadgetEffect(remote, aim, funnel, dt) {
    const snapshot = displaySnapshotFor(remote);
    const particlesSnapshot = snapshot && snapshot.world ? snapshot.world.particles || [] : [];
    for (const particle of particlesSnapshot) {
      if (!isMappedBody(particle)) {
        continue;
      }

      const localBody = transformedRemoteEntity(particle, displayTransformFor(remote));
      const beforeVx = localBody.vx;
      const beforeVy = localBody.vy;
      applyGadgetForces(localBody, aim, funnel, dt);

      const impulseX = localBody.vx - beforeVx;
      const impulseY = localBody.vy - beforeVy;
      if (Math.hypot(impulseX, impulseY) < 18) {
        continue;
      }

      sendRemoteEntityEffect(remote, {
        entityType: "particle",
        entityId: particle.id,
        impulseX,
        impulseY
      });
      return true;
    }

    for (const mob of remoteCombatMobSnapshots(snapshot)) {
      if (!mob || mob.health <= 0) {
        continue;
      }

      const localMob = transformedRemoteEntity(mob, displayTransformFor(remote));
      const beforeVx = localMob.vx;
      const beforeVy = localMob.vy;
      applyGadgetForces(localMob, aim, funnel, dt);

      const impulseX = localMob.vx - beforeVx;
      const impulseY = localMob.vy - beforeVy;
      if (Math.hypot(impulseX, impulseY) < 18) {
        continue;
      }

      sendRemoteEntityEffect(remote, {
        entityType: mob.kind,
        entityId: mob.id,
        impulseX,
        impulseY
      });
      return true;
    }

    return false;
  }

  function applyRemoteLaserEffect(remote) {
    const snapshot = displaySnapshotFor(remote);
    if (!snapshot) {
      return false;
    }

    const transform = displayTransformFor(remote);
    const remoteMobs = remoteCombatMobSnapshots(snapshot);
    for (let i = playerLasers.length - 1; i >= 0; i -= 1) {
      const laser = playerLasers[i];
      const speed = Math.hypot(laser.vx, laser.vy) || 1;
      const dirX = laser.vx / speed;
      const dirY = laser.vy / speed;
      const tailX = laser.x - dirX * laser.length;
      const tailY = laser.y - dirY * laser.length;
      const piercesMobs = Boolean(laser.piercesMobs);
      const hitMobIds = Array.isArray(laser.hitMobIds) ? laser.hitMobIds : (laser.hitMobIds = []);
      let hitMob = false;

      for (const mob of remoteMobs) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0) {
          continue;
        }
        const hitMobId = mob.kind + ":" + mob.id;
        if (hitMobIds.includes(hitMobId)) {
          continue;
        }

        const remoteMob = transformedRemoteEntity(mob, transform);
        const mobDist = distanceToSegment(remoteMob.x, remoteMob.y, tailX, tailY, laser.x, laser.y);
        if (mobDist >= remoteMob.radius + laser.radius) {
          continue;
        }

        if (mob.kind === "fighter" && finiteOr(mob.shieldCharge, 0) > 0) {
          reflectEntityVelocity(laser, dirX, dirY, 0.44, 260);
          laser.color = shadeColor(normalizeColorSnapshot(mob.color, { r: 119, g: 167, b: 255 }), 36);
          laser.damage = Math.max(8, (laser.damage || playerWeaponDefaults.damage) * 0.45);
          laser.life = Math.min(laser.life, 0.55);
          sparks.push({
            x: laser.x,
            y: laser.y,
            radius: 46,
            color: laser.color,
            life: 0.28,
            maxLife: 0.28
          });
          return true;
        }

        sendRemoteEntityEffect(remote, {
          entityType: mob.kind,
          entityId: mob.id,
          damage: laser.damage || playerWeaponDefaults.damage,
          impulseX: dirX * (laser.knockback || playerWeaponDefaults.knockback),
          impulseY: dirY * (laser.knockback || playerWeaponDefaults.knockback),
          color: laser.color
        });
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 38,
          color: laser.color,
          life: 0.24,
          maxLife: 0.24
        });
        hitMobIds.push(hitMobId);
        hitMob = true;
        if (!piercesMobs) {
          playerLasers.splice(i, 1);
          return true;
        }
      }

      if (!snapshot.player) {
        if (hitMob) {
          return true;
        }
        continue;
      }

      const remotePlayer = transformedRemoteEntity(snapshot.player, transform);
      const playerDist = distanceToSegment(remotePlayer.x, remotePlayer.y, tailX, tailY, laser.x, laser.y);

      if (!isTrucedWith(remote.playerId) && playerDist < (remotePlayer.radius || 34) * 0.72 + laser.radius) {
        sendRemoteEntityEffect(remote, {
          entityType: "player",
          damage: laser.damage || playerWeaponDefaults.damage,
          impulseX: dirX * (laser.knockback || playerWeaponDefaults.knockback),
          impulseY: dirY * (laser.knockback || playerWeaponDefaults.knockback),
          color: laser.color
        });
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 42,
          color: laser.color,
          life: 0.28,
          maxLife: 0.28
        });
        playerLasers.splice(i, 1);
        return true;
      }

      if (hitMob) {
        return true;
      }
    }

    return false;
  }

  function applyRemoteEntityEffect(message) {
    const effect = message.effect && typeof message.effect === "object" ? message.effect : null;
    if (!effect || message.targetUniverseId !== multiplayer.universeId) {
      return;
    }

    const impulseX = finiteOr(effect.impulseX, 0);
    const impulseY = finiteOr(effect.impulseY, 0);
    const damage = Math.max(0, finiteOr(effect.damage, 0));
    const toolDisable = Math.max(0, finiteOr(effect.toolDisable, 0));

    if (effect.entityType === "player") {
      if (isTrucedWith(message.fromPlayerId) && damage > 0) {
        return;
      }
      if (player.landed && (Math.abs(impulseX) + Math.abs(impulseY) > 80 || damage > 0)) {
        detachFromBody(150);
      }
      player.vx += impulseX;
      player.vy += impulseY;
      if (damage > 0 && player.hitCooldown <= 0) {
        damageLocalPlayer(damage, {
          cause: "Contact fire",
          cooldown: 0.7,
          flash: 0.3
        });
        maybeNotifyText("Hull hit by " + (message.fromPlayerId || "a contact") + ".");
      }
      if (toolDisable > 0) {
        jamLocalPlayerTools(toolDisable);
      }
      return;
    }

    const target = findOwnedEntity(effect.entityType, effect.entityId);
    if (!target) {
      return;
    }

    if (target.kind && (Math.abs(impulseX) + Math.abs(impulseY) > 40 || damage > 0)) {
      target.landed = null;
      target.residentTier = null;
    }
    target.vx += impulseX;
    target.vy += impulseY;
    if (damage > 0 && Number.isFinite(target.health)) {
      const color = normalizeColorSnapshot(effect.color, { r: 255, g: 115, b: 173 });
      if (target.kind) {
        damageMob(target, damage, color, mobName(target) + " dropped by " + (message.fromPlayerId || "a contact") + ".");
      } else {
        target.health = Math.max(0, target.health - damage);
        target.hitCooldown = Math.max(target.hitCooldown || 0, 0.45);
        target.flash = Math.max(target.flash || 0, 0.24);
      }
    }
  }

  function findOwnedEntity(entityType, entityId) {
    const id = Number(entityId);
    const findById = (list) => list.find((entity) => entity.id === id) || null;

    if (entityType === "particle") {
      return findById(particles);
    }
    if (entityType === "alienoid") {
      return findById(rivals);
    }
    if (entityType === "ufo") {
      return findById(ufos);
    }
    if (entityType === "rambot") {
      return findById(rambots);
    }
    if (entityType === "engineer") {
      return findById(engineers);
    }
    if (entityType === "tesla") {
      return findById(teslas);
    }
    if (entityType === "rocket") {
      return findById(rockets);
    }
    if (entityType === "fighter") {
      return findById(fighters);
    }
    return null;
  }

  function buildPersistentPayload(includeWorld) {
    const aim = getAim();
    const toolMode = areToolsDisabled()
      ? "idle"
      : isWeaponTool(equippedToolId)
      ? mouse.left && hasPlayerEnergy() ? "fire" : "idle"
      : canUseSuctionControls()
      ? mouse.middle ? "hold" : mouse.left ? "pull" : mouse.right ? "push" : "idle"
      : "idle";
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
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        score: Math.max(1, Math.round(lifeStats.bestScore || lifeStats.currentScore || 1)),
        difficulty: runState.difficultyId,
        tech: serializeTechInventory(),
        tools: serializeToolInventory(),
        equippedTools: serializeEquippedToolInventory(),
        toolUpgrades: serializeToolUpgrades(),
        equippedTool: equippedToolId,
        landed: player.landed,
        walkCycle: player.walkCycle,
        cameraRoll,
        hasCommunicationRelay: hasCommunicationRelay(),
        aimAngle: Math.atan2(aim.world.y, aim.world.x),
        aimLocalAngle: aim.angle,
        toolMode,
        toolActive: toolMode !== "idle",
        moving: isMoving(),
        crouching: Boolean(player.landed && isMovementKeyPressed("down"))
      }
    };

    if (includeWorld) {
      payload.world = {
        elapsed: performance.now() / 1000,
        particles: particles.map(serializeParticle),
        alienoids: rivals.map(serializeRival),
        ufos: ufos.map(serializeUfo),
        rambots: rambots.map(serializeRambot),
        engineers: engineers.map(serializeEngineer),
        teslas: teslas.map(serializeTesla),
        rockets: rockets.map(serializeRocket),
        fighters: fighters.map(serializeFighter),
        structures: structures.map(serializeStructure),
        rivalProjectiles: rivalProjectiles.map(serializeProjectile),
        starDust: starDust.map(serializeStar),
        nextParticleId,
        nextAlienoidId: nextRivalId,
        nextUfoId,
        nextRambotId,
        nextEngineerId,
        nextTeslaId,
        nextRocketId,
        nextFighterId,
        nextStructureId,
        difficulty: runState.difficultyId,
        mobSpawnTimers: { ...mobSpawnTimers },
        mobDefeatsByKind: { ...mobDefeatsByKind }
      };
    }

    return payload;
  }

  function applyPersistentPayload(data, options) {
    if (!data || !data.ok) {
      return;
    }

    if (data.universeId) {
      multiplayer.universeId = data.universeId;
    }

    if (data.profile) {
      applyMultiplayerProfile(data.profile);
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

    if (Array.isArray(snapshot.starDust)) {
      starDust.length = 0;
      starDust.push(...snapshot.starDust.map(normalizeStarSnapshot).filter(Boolean));
    }

    if (snapshot.difficulty && difficultyDefinitions[snapshot.difficulty]) {
      applyDifficulty(snapshot.difficulty);
    }

    if (Array.isArray(snapshot.particles)) {
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

    if (Array.isArray(snapshot.engineers)) {
      engineers.length = 0;
      engineers.push(...snapshot.engineers.map(normalizeEngineerSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.teslas)) {
      teslas.length = 0;
      teslas.push(...snapshot.teslas.map(normalizeTeslaSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.rockets)) {
      rockets.length = 0;
      rockets.push(...snapshot.rockets.map(normalizeRocketSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.fighters)) {
      fighters.length = 0;
      fighters.push(...snapshot.fighters.map(normalizeFighterSnapshot).filter(Boolean));
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
    nextEngineerId = Math.max(
      Number(snapshot.nextEngineerId) || 1,
      engineers.reduce((largest, engineer) => Math.max(largest, engineer.id + 1), 1)
    );
    nextTeslaId = Math.max(
      Number(snapshot.nextTeslaId) || 1,
      teslas.reduce((largest, tesla) => Math.max(largest, tesla.id + 1), 1)
    );
    nextRocketId = Math.max(
      Number(snapshot.nextRocketId) || 1,
      rockets.reduce((largest, rocket) => Math.max(largest, rocket.id + 1), 1)
    );
    nextFighterId = Math.max(
      Number(snapshot.nextFighterId) || 1,
      fighters.reduce((largest, fighter) => Math.max(largest, fighter.id + 1), 1)
    );
    nextStructureId = Math.max(
      Number(snapshot.nextStructureId) || 1,
      structures.reduce((largest, structure) => Math.max(largest, structure.id + 1), 1)
    );

    applyMobSpawnTimers(snapshot.mobSpawnTimers);
    applyMobDefeatsByKind(snapshot.mobDefeatsByKind);
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
    player.maxHealth = clamp(finiteOr(snapshot.maxHealth, player.maxHealth), 1, 100);
    player.health = clamp(finiteOr(snapshot.health, player.health), 0, player.maxHealth);
    player.maxEnergy = clamp(finiteOr(snapshot.maxEnergy, player.maxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    player.energy = clamp(finiteOr(snapshot.energy, player.maxEnergy), 0, player.maxEnergy);
    if (snapshot.difficulty && difficultyDefinitions[snapshot.difficulty]) {
      applyDifficulty(snapshot.difficulty);
    }
    applyTechInventory(snapshot.tech);
    applyToolInventory(snapshot.tools, snapshot.equippedTool, snapshot.equippedTools);
    applyToolUpgrades(snapshot.toolUpgrades);
    player.landed = normalizeLandingSnapshot(snapshot.landed);
    player.walkCycle = finiteOr(snapshot.walkCycle, player.landed ? player.landed.walkCycle : player.walkCycle);
    cameraRoll = player.landed ? surfaceCameraRollForAngle(player.landed.angle) : finiteOr(snapshot.cameraRoll, cameraRoll);
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
      energy: particle.energy,
      maxEnergy: particle.maxEnergy,
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

  function serializeEngineer(engineer) {
    return {
      id: engineer.id,
      x: engineer.x,
      y: engineer.y,
      vx: engineer.vx,
      vy: engineer.vy,
      radius: engineer.radius,
      health: engineer.health,
      maxHealth: engineer.maxHealth,
      color: engineer.color,
      flash: engineer.flash,
      hitCooldown: engineer.hitCooldown,
      strafeSign: engineer.strafeSign,
      rotation: engineer.rotation,
      healCooldown: engineer.healCooldown,
      healPulse: engineer.healPulse,
      repairBeamAngle: engineer.repairBeamAngle,
      targetKind: engineer.targetKind,
      targetId: engineer.targetId,
      wobble: engineer.wobble
    };
  }

  function serializeTesla(tesla) {
    return {
      id: tesla.id,
      x: tesla.x,
      y: tesla.y,
      vx: tesla.vx,
      vy: tesla.vy,
      radius: tesla.radius,
      health: tesla.health,
      maxHealth: tesla.maxHealth,
      color: tesla.color,
      flash: tesla.flash,
      hitCooldown: tesla.hitCooldown,
      strafeSign: tesla.strafeSign,
      rotation: tesla.rotation,
      shootCooldown: tesla.shootCooldown,
      lightningWarmup: tesla.lightningWarmup,
      lightningFlash: tesla.lightningFlash,
      lightningAngle: tesla.lightningAngle,
      wobble: tesla.wobble
    };
  }

  function serializeRocket(rocket) {
    return {
      kind: rocket.kind === "satellite" ? "satellite" : "rocket",
      id: rocket.id,
      x: rocket.x,
      y: rocket.y,
      vx: rocket.vx,
      vy: rocket.vy,
      radius: rocket.radius,
      health: rocket.health,
      maxHealth: rocket.maxHealth,
      color: rocket.color,
      flash: rocket.flash,
      hitCooldown: rocket.hitCooldown,
      strafeSign: rocket.strafeSign,
      rotation: rocket.rotation,
      scannerAngle: rocket.scannerAngle,
      scanProgress: rocket.scanProgress,
      lockTimer: rocket.lockTimer,
      blastTimer: rocket.blastTimer,
      recoverTimer: rocket.recoverTimer,
      lockX: rocket.lockX,
      lockY: rocket.lockY,
      blastDirX: rocket.blastDirX,
      blastDirY: rocket.blastDirY,
      volleyTimer: rocket.volleyTimer,
      volleyShots: rocket.volleyShots,
      chargeCooldown: rocket.chargeCooldown,
      chargeTimer: rocket.chargeTimer,
      chargeDirX: rocket.chargeDirX,
      chargeDirY: rocket.chargeDirY,
      chargePower: rocket.chargePower,
      impactCooldown: rocket.impactCooldown,
      wobble: rocket.wobble
    };
  }

  function serializeFighter(fighter) {
    return {
      id: fighter.id,
      x: fighter.x,
      y: fighter.y,
      vx: fighter.vx,
      vy: fighter.vy,
      radius: fighter.radius,
      health: fighter.health,
      maxHealth: fighter.maxHealth,
      color: fighter.color,
      flash: fighter.flash,
      hitCooldown: fighter.hitCooldown,
      strafeSign: fighter.strafeSign,
      rotation: fighter.rotation,
      shootCooldown: fighter.shootCooldown,
      shieldCharge: fighter.shieldCharge,
      shieldRecharge: fighter.shieldRecharge,
      shieldActive: fighter.shieldActive,
      wobble: fighter.wobble
    };
  }

  function serializeProjectile(projectile) {
    return {
      id: projectile.id,
      x: projectile.x,
      y: projectile.y,
      vx: projectile.vx,
      vy: projectile.vy,
      radius: projectile.radius,
      length: projectile.length,
      color: projectile.color,
      life: projectile.life,
      maxLife: projectile.maxLife,
      damage: projectile.damage,
      toolDisable: projectile.toolDisable,
      cause: projectile.cause,
      lightning: Boolean(projectile.lightning),
      rocket: Boolean(projectile.rocket)
    };
  }

  function serializeStructure(structure) {
    return {
      id: structure.id,
      type: structure.type,
      bodyId: structure.bodyId,
      linkedBodyId: structure.linkedBodyId,
      angle: structure.angle,
      linkedAngle: structure.linkedAngle,
      surfaceOffset: structure.surfaceOffset,
      linkedSurfaceOffset: structure.linkedSurfaceOffset,
      x: structure.x,
      y: structure.y,
      x2: structure.x2,
      y2: structure.y2,
      restLength: structure.restLength,
      aimAngle: structure.aimAngle,
      deploy: structure.deploy,
      thrustAmount: structure.thrustAmount,
      thrustDirection: structure.thrustDirection,
      shootCooldown: structure.shootCooldown,
      burstTimer: structure.burstTimer,
      burstCooldown: structure.burstCooldown,
      missileCharge: structure.missileCharge,
      lockTimer: structure.lockTimer,
      beepTimer: structure.beepTimer,
      targetX: structure.targetX,
      targetY: structure.targetY,
      targetCount: structure.targetCount,
      health: structure.health,
      maxHealth: structure.maxHealth,
      disabledTimer: structure.disabledTimer,
      flash: structure.flash,
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
    const particle = {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      mass,
      radius: radiusFromMass(mass),
      tier,
      energy: finiteOr(snapshot.energy, Number.NaN),
      maxEnergy: finiteOr(snapshot.maxEnergy, Number.NaN),
      textureSeed: finiteOr(snapshot.textureSeed, Math.random() * 1000),
      color: normalizeColorSnapshot(snapshot.color, randomParticleColor()),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      pulse: finiteOr(snapshot.pulse, randomRange(0.8, 1.25))
    };
    normalizeBodyEnergy(particle);
    return particle;
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

  function normalizeEngineerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextEngineerId;
    return {
      kind: "engineer",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 33),
      health: clamp(finiteOr(snapshot.health, 140), 0, 140),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, 140), 1, 140),
      color: normalizeColorSnapshot(snapshot.color, { r: 102, g: 224, b: 184 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      healCooldown: finiteOr(snapshot.healCooldown, randomRange(0.35, 0.9)),
      healPulse: finiteOr(snapshot.healPulse, 0),
      repairBeamAngle: finiteOr(snapshot.repairBeamAngle, 0),
      targetKind: typeof snapshot.targetKind === "string" ? snapshot.targetKind : "",
      targetId: Math.max(0, Math.floor(finiteOr(snapshot.targetId, 0))),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeTeslaSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextTeslaId;
    return {
      kind: "tesla",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 32),
      health: clamp(finiteOr(snapshot.health, 150), 0, 150),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, 150), 1, 150),
      color: normalizeColorSnapshot(snapshot.color, { r: 157, g: 255, b: 122 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(1.2, 2.5)),
      lightningWarmup: finiteOr(snapshot.lightningWarmup, 0),
      lightningFlash: finiteOr(snapshot.lightningFlash, 0),
      lightningAngle: finiteOr(snapshot.lightningAngle, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeRocketSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextRocketId;
    const legacyShooter = !Number.isFinite(Number(snapshot.chargeCooldown)) && Number.isFinite(Number(snapshot.scanProgress));
    const kind = snapshot.kind === "satellite" || legacyShooter ? "satellite" : "rocket";
    const maxHealth = kind === "satellite" ? 180 : 170;
    return {
      kind,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, kind === "satellite" ? 36 : 34),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, maxHealth), 1, maxHealth),
      color: normalizeColorSnapshot(snapshot.color, { r: 169, g: 133, b: 255 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      scannerAngle: finiteOr(snapshot.scannerAngle, 0),
      scanProgress: clamp(finiteOr(snapshot.scanProgress, 0), 0, 1),
      lockTimer: finiteOr(snapshot.lockTimer, 0),
      blastTimer: finiteOr(snapshot.blastTimer, 0),
      recoverTimer: finiteOr(snapshot.recoverTimer, 0),
      lockX: finiteOr(snapshot.lockX, 0),
      lockY: finiteOr(snapshot.lockY, 0),
      blastDirX: finiteOr(snapshot.blastDirX, 1),
      blastDirY: finiteOr(snapshot.blastDirY, 0),
      volleyTimer: finiteOr(snapshot.volleyTimer, 0),
      volleyShots: Math.max(0, Math.floor(finiteOr(snapshot.volleyShots, 0))),
      chargeCooldown: finiteOr(snapshot.chargeCooldown, randomRange(0.6, 1.6)),
      chargeTimer: finiteOr(snapshot.chargeTimer, 0),
      chargeDirX: finiteOr(snapshot.chargeDirX, 1),
      chargeDirY: finiteOr(snapshot.chargeDirY, 0),
      chargePower: clamp(finiteOr(snapshot.chargePower, 0), 0, 1),
      impactCooldown: finiteOr(snapshot.impactCooldown, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeFighterSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextFighterId;
    return {
      kind: "fighter",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 40),
      health: clamp(finiteOr(snapshot.health, 230), 0, 230),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, 230), 1, 230),
      color: normalizeColorSnapshot(snapshot.color, { r: 119, g: 167, b: 255 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(1.0, 2.4)),
      shieldCharge: clamp(finiteOr(snapshot.shieldCharge, fighterShieldMaxCharge), 0, fighterShieldMaxCharge),
      shieldRecharge: clamp(finiteOr(snapshot.shieldRecharge, 0), 0, fighterShieldCycle),
      shieldActive: finiteOr(snapshot.shieldActive, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeStructureSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const type = isKnownStructureType(snapshot.type) ? snapshot.type : null;
    if (!type) {
      return null;
    }

    const angle = finiteOr(snapshot.angle, 0);
    const linkedAngle = finiteOr(snapshot.linkedAngle, angle + Math.PI);
    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextStructureId))),
      type,
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      linkedBodyId: Math.max(0, Math.floor(finiteOr(snapshot.linkedBodyId, 0))),
      angle,
      linkedAngle,
      surfaceOffset: Math.max(0, finiteOr(snapshot.surfaceOffset, 0)),
      linkedSurfaceOffset: Math.max(0, finiteOr(snapshot.linkedSurfaceOffset, 0)),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      x2: finiteOr(snapshot.x2, snapshot.x),
      y2: finiteOr(snapshot.y2, snapshot.y),
      restLength: Math.max(0, finiteOr(snapshot.restLength, 0)),
      aimAngle: finiteOr(snapshot.aimAngle, angle),
      deploy: clamp(finiteOr(snapshot.deploy, 0), 0, 1),
      thrustAmount: clamp(finiteOr(snapshot.thrustAmount, 0), 0, 1),
      thrustDirection: finiteOr(snapshot.thrustDirection, 1) < 0 ? -1 : 1,
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(0.2, 0.8)),
      burstTimer: Math.max(0, finiteOr(snapshot.burstTimer, 0)),
      burstCooldown: Math.max(0, finiteOr(snapshot.burstCooldown, randomRange(0.4, accumulatorBurstInterval))),
      missileCharge: clamp(finiteOr(snapshot.missileCharge, type === "missile-launcher" ? randomRange(0, 0.45) : 0), 0, 1),
      lockTimer: Math.max(0, finiteOr(snapshot.lockTimer, 0)),
      beepTimer: Math.max(0, finiteOr(snapshot.beepTimer, 0)),
      targetX: finiteOr(snapshot.targetX, 0),
      targetY: finiteOr(snapshot.targetY, 0),
      targetCount: Math.max(0, Math.floor(finiteOr(snapshot.targetCount, 0))),
      health: clamp(finiteOr(snapshot.health, structureMaxHealth(type)), 0, structureMaxHealth(type)),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, structureMaxHealth(type)), 1, structureMaxHealth(type)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function applyMobSpawnTimers(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const key of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[key] = clamp(finiteOr(snapshot[key], mobSpawnTimers[key]), 0, difficultyMobSpawnInterval(key));
    }
  }

  function applyMobDefeatsByKind(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const kind of mobTierOrder) {
      mobDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(snapshot[kind], mobDefeatsByKind[kind])));
    }
  }

  function resetMobDefeatsByKind() {
    for (const kind of mobTierOrder) {
      mobDefeatsByKind[kind] = 0;
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
      maxLife: finiteOr(snapshot.maxLife, 2.2),
      damage: finiteOr(snapshot.damage, rivalProjectileDamage),
      toolDisable: finiteOr(snapshot.toolDisable, 0),
      cause: typeof snapshot.cause === "string" ? snapshot.cause : "",
      lightning: Boolean(snapshot.lightning),
      rocket: Boolean(snapshot.rocket)
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
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      walkCycle: finiteOr(snapshot.walkCycle, 0)
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
    const particle = {
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
    normalizeBodyEnergy(particle);
    return particle;
  }

  function randomAmbientParticleMass() {
    const roll = Math.random();
    if (roll < 0.7) {
      return 1;
    }
    if (roll < 0.92) {
      return 2;
    }
    return 3;
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
      randomAmbientParticleMass(),
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

  function createEngineer(x, y) {
    return {
      kind: "engineer",
      id: nextEngineerId++,
      x,
      y,
      vx: randomRange(-16, 16),
      vy: randomRange(-16, 16),
      radius: 33,
      health: 140,
      maxHealth: 140,
      color: { r: 102, g: 224, b: 184 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      healCooldown: randomRange(0.35, 0.9),
      healPulse: 0,
      repairBeamAngle: 0,
      targetKind: "",
      targetId: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createTesla(x, y) {
    return {
      kind: "tesla",
      id: nextTeslaId++,
      x,
      y,
      vx: randomRange(-18, 18),
      vy: randomRange(-18, 18),
      radius: 32,
      health: 150,
      maxHealth: 150,
      color: { r: 157, g: 255, b: 122 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      shootCooldown: randomRange(1.2, 2.5),
      lightningWarmup: 0,
      lightningFlash: 0,
      lightningAngle: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createSatellite(x, y) {
    return {
      kind: "satellite",
      id: nextRocketId++,
      x,
      y,
      vx: randomRange(-14, 14),
      vy: randomRange(-14, 14),
      radius: 36,
      health: 180,
      maxHealth: 180,
      color: { r: 169, g: 133, b: 255 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      scannerAngle: 0,
      scanProgress: 0,
      lockTimer: 0,
      blastTimer: 0,
      recoverTimer: 0,
      lockX: x,
      lockY: y,
      blastDirX: 1,
      blastDirY: 0,
      volleyTimer: 0,
      volleyShots: 0,
      impactCooldown: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createRocket(x, y) {
    const angle = randomRange(0, Math.PI * 2);
    return {
      kind: "rocket",
      id: nextRocketId++,
      x,
      y,
      vx: Math.cos(angle) * randomRange(18, 44),
      vy: Math.sin(angle) * randomRange(18, 44),
      radius: 34,
      health: 170,
      maxHealth: 170,
      color: { r: 169, g: 133, b: 255 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: angle + Math.PI / 2,
      chargeCooldown: randomRange(0.6, 1.6),
      chargeTimer: 0,
      chargeDirX: Math.cos(angle),
      chargeDirY: Math.sin(angle),
      chargePower: 0,
      recoverTimer: 0,
      lockX: x,
      lockY: y,
      impactCooldown: 0,
      blastTimer: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createFighter(x, y) {
    return {
      kind: "fighter",
      id: nextFighterId++,
      x,
      y,
      vx: randomRange(-20, 20),
      vy: randomRange(-20, 20),
      radius: 40,
      health: 230,
      maxHealth: 230,
      color: { r: 119, g: 167, b: 255 },
      flash: 0,
      hitCooldown: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      shootCooldown: randomRange(1.0, 2.4),
      shieldCharge: fighterShieldMaxCharge,
      shieldRecharge: 0,
      shieldActive: 0,
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

    const dropChance = rival.kind === "ufo" ? 0.55 : 0.45;
    const count = Math.random() < dropChance ? 1 : 0;

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
    if (mob.kind === "engineer") {
      return "Engineer";
    }
    if (mob.kind === "tesla") {
      return "Tesla";
    }
    if (mob.kind === "satellite") {
      return "Satellite";
    }
    if (mob.kind === "rocket") {
      return "Rocket ship";
    }
    if (mob.kind === "fighter") {
      return "Fighter ship";
    }
    return "Alienoid";
  }

  function difficultyTechDropCount() {
    const multiplier = Math.max(1, finiteOr(activeDifficulty().techDropMultiplier, 1));
    let count = Math.floor(multiplier);
    if (Math.random() < multiplier - count) {
      count += 1;
    }
    return count;
  }

  function dropMobTech(mob) {
    let techKey = "weapon";
    if (mob.kind === "ufo") {
      techKey = "suction";
    } else if (mob.kind === "rambot") {
      techKey = "plating";
    } else if (mob.kind === "engineer") {
      techKey = "repair";
    } else if (mob.kind === "tesla") {
      techKey = "energy";
    } else if (mob.kind === "satellite") {
      techKey = "target";
    } else if (mob.kind === "rocket") {
      techKey = "propulsion";
    } else if (mob.kind === "fighter") {
      techKey = "shield";
    }

    const dropCount = difficultyTechDropCount();
    for (let i = 0; i < dropCount; i += 1) {
      techPickups.push(createTechPickup(techKey, mob.x, mob.y, mob.vx, mob.vy));
    }
    if (mob.defeatedBySpanner && isMechanicalMob(mob) && Math.random() < spannerTechBonusChance) {
      techPickups.push(createTechPickup(techKey, mob.x, mob.y, mob.vx, mob.vy));
    }
  }

  function emitMobDamageParticles(mob, damage, hitColor) {
    if (!mob || damage <= 0 || particles.length > targetParticles * 3) {
      return;
    }

    const count = Math.floor(randomRange(mobDamageParticleMin, mobDamageParticleMax + 1));
    const baseColor = mob.color || hitColor || randomParticleColor();
    const particleColor = hitColor ? mixColor(baseColor, hitColor, 3, 2) : ejectedParticleColor(mob);

    for (let i = 0; i < count; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(82, 176);
      const spawnDistance = Math.max(4, mob.radius * randomRange(0.25, 0.75));
      const particle = createParticle(
        mob.x + Math.cos(angle) * spawnDistance,
        mob.y + Math.sin(angle) * spawnDistance,
        mobDamageParticleMass,
        ejectedParticleColor({ color: particleColor })
      );

      particle.vx = finiteOr(mob.vx, 0) * 0.32 + Math.cos(angle) * speed + randomRange(-22, 22);
      particle.vy = finiteOr(mob.vy, 0) * 0.32 + Math.sin(angle) * speed + randomRange(-22, 22);
      particles.push(particle);
    }
  }

  function damageMob(mob, damage, color, message, options) {
    if (mob.health <= 0) {
      return false;
    }

    mob.lastDamageTool = options && options.sourceTool ? options.sourceTool : "";
    mob.health = Math.max(0, mob.health - damage);
    mob.flash = 0.28;
    mob.hitCooldown = 0.42;
    emitMobDamageParticles(mob, damage, color);

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
      mob.defeatedBySpanner = mob.lastDamageTool === "spanner";
      lifeStats.mobsDefeated += 1;
      lifeStats.mobScore += scoreMobKill(mob.kind);
      if (mobDefeatsByKind[mob.kind] !== undefined) {
        mobDefeatsByKind[mob.kind] += 1;
      }
      dropHealthPickups(mob);
      dropMobTech(mob);
      playSound("mobDestroyed");
      maybeNotifyText(message || mobName(mob) + " knocked out.", options && options.notification);
      return true;
    }

    playSound("mobHit");
    return false;
  }

  function tickMobBodyImpactCooldowns(mob, dt) {
    if (!mob.bodyImpactCooldowns) {
      return;
    }

    for (const bodyId of Object.keys(mob.bodyImpactCooldowns)) {
      const remaining = finiteOr(mob.bodyImpactCooldowns[bodyId], 0) - dt;
      if (remaining > 0) {
        mob.bodyImpactCooldowns[bodyId] = remaining;
      } else {
        delete mob.bodyImpactCooldowns[bodyId];
      }
    }
  }

  function tickMobDamageTimers(mob, dt) {
    mob.hitCooldown = Math.max(0, mob.hitCooldown - dt);
    tickMobBodyImpactCooldowns(mob, dt);
  }

  function canDamageMobWithBody(mob, body) {
    const cooldowns = mob.bodyImpactCooldowns;
    return !cooldowns || finiteOr(cooldowns[body.id], 0) <= 0;
  }

  function markMobDamagedByBody(mob, body) {
    if (!mob.bodyImpactCooldowns) {
      mob.bodyImpactCooldowns = {};
    }
    mob.bodyImpactCooldowns[body.id] = bodyImpactRepeatDamageCooldown;
  }

  function bodyImpactKnockbackForce(body, bodySpeed) {
    const speedBonus = Math.max(0, bodySpeed - solidBodyDamageSpeed) * 0.34;
    const massBonus = Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 2.45;
    return clamp(bodyImpactBaseKnockback + speedBonus + massBonus, bodyImpactBaseKnockback, bodyImpactMaxKnockback);
  }

  function solidBodyImpactDamage(body, impactSpeed, baseDamage) {
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const speedDamage = Math.max(0, impactSpeed - solidBodyDamageSpeed) * 0.26;
    const massDamage = Math.pow(mass, 0.42) * 1.45;
    const damageCap = clamp(105 + Math.sqrt(mass) * 2.2, 120, 320);
    return Math.min(damageCap, baseDamage + speedDamage + massDamage);
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
    } else if (mob.kind === "rocket") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.32);
      mob.lockTimer = 0;
      mob.volleyTimer = 0;
      mob.volleyShots = 0;
      mob.blastTimer = Math.max(0, (mob.blastTimer || 0) - 0.18);
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

  function spawnEngineerNearPlayer() {
    const spawn = randomOffscreenPoint(210, 600);
    engineers.push(createEngineer(spawn.x, spawn.y));
  }

  function spawnTeslaNearPlayer() {
    const spawn = randomOffscreenPoint(190, 560);
    teslas.push(createTesla(spawn.x, spawn.y));
  }

  function spawnSatelliteNearPlayer() {
    const spawn = randomOffscreenPoint(230, 680);
    rockets.push(createSatellite(spawn.x, spawn.y));
  }

  function spawnRocketNearPlayer() {
    const spawn = randomOffscreenPoint(320, 900);
    rockets.push(createRocket(spawn.x, spawn.y));
  }

  function spawnFighterNearPlayer() {
    const spawn = randomOffscreenPoint(260, 760);
    fighters.push(createFighter(spawn.x, spawn.y));
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
    if (kind === "engineer") {
      spawnEngineerNearPlayer();
      return;
    }
    if (kind === "tesla") {
      spawnTeslaNearPlayer();
      return;
    }
    if (kind === "satellite") {
      spawnSatelliteNearPlayer();
      return;
    }
    if (kind === "rocket") {
      spawnRocketNearPlayer();
      return;
    }
    if (kind === "fighter") {
      spawnFighterNearPlayer();
      return;
    }
    spawnAlienoidNearPlayer();
  }

  function isMobTierUnlocked(kind) {
    const index = mobTierOrder.indexOf(kind);
    if (index <= 0) {
      return true;
    }

    const previousKind = mobTierOrder[index - 1];
    return mobDefeatsByKind[previousKind] >= previousTierDefeatsToUnlock;
  }

  function currentLifeSeconds() {
    return Math.max(0, (performance.now() - lifeStats.startedAt) / 1000);
  }

  function maxMobSpawnBatchSize(kind) {
    const interval = difficultyMobSpawnInterval(kind);
    if (!interval) {
      return baseMaxMobSpawnBatchSize;
    }

    const growthInterval = interval * mobSpawnCapGrowthIntervalMultiplier;
    const rawLimit = baseMaxMobSpawnBatchSize + Math.floor(currentLifeSeconds() / growthInterval);
    return Math.max(1, Math.round(rawLimit * activeDifficulty().mobBatchScale));
  }

  function mobSpawnBonusSlotChanceScale(bonusSlot) {
    if (bonusSlot < 2) {
      return activeDifficulty().mobBonusChanceScale;
    }
    return Math.pow(thirdMobSpawnChanceScale, bonusSlot - 1) * activeDifficulty().mobBonusChanceScale;
  }

  function mobSpawnBatchSize(kind) {
    const index = mobTierOrder.indexOf(kind);
    const nextKind = mobTierOrder[index + 1];

    const defeats = Math.max(0, mobDefeatsByKind[nextKind || kind] || 0);
    let batchSize = 1;
    const batchLimit = maxMobSpawnBatchSize(kind);
    for (let bonusSlot = 1; bonusSlot < batchLimit; bonusSlot += 1) {
      const chanceScale = mobSpawnBonusSlotChanceScale(bonusSlot);
      const chance = clamp(defeats / (previousTierDefeatsToUnlock * bonusSlot), 0, 0.92) * chanceScale;
      if (Math.random() < chance) {
        batchSize += 1;
      }
    }
    return batchSize;
  }

  function updateMobSpawns(dt) {
    for (const kind of Object.keys(mobSpawnIntervals)) {
      if (!isMobTierUnlocked(kind)) {
        mobSpawnTimers[kind] = Math.max(0, mobSpawnTimers[kind] - dt);
        continue;
      }

      mobSpawnTimers[kind] -= dt;
      while (mobSpawnTimers[kind] <= 0) {
        const batchSize = mobSpawnBatchSize(kind);
        for (let i = 0; i < batchSize; i += 1) {
          spawnMobByKind(kind);
        }
        mobSpawnTimers[kind] += difficultyMobSpawnInterval(kind);
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
      x: width / 2 + local.x * cameraZoom,
      y: height / 2 + local.y * cameraZoom
    };
  }

  function screenToWorld(x, y) {
    const local = cameraLocalToWorld((x - width / 2) / cameraZoom, (y - height / 2) / cameraZoom);
    return {
      x: player.x + local.x,
      y: player.y + local.y
    };
  }

  function randomOffscreenPoint(margin, spread) {
    const side = Math.floor(Math.random() * 4);
    const halfW = width / (2 * cameraZoom);
    const halfH = height / (2 * cameraZoom);
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
    return isAsteroidOrLarger(particle);
  }

  function bodyPushResponse(target) {
    const mass = Math.max(1, finiteOr(target && target.mass, 1));
    const asteroidThreshold = thresholdForTierName("asteroid");
    if (mass < asteroidThreshold) {
      return 1;
    }

    return clamp(0.34 / Math.pow(mass / asteroidThreshold, 0.72), 0.025, 1);
  }

  function isStructureHostBody(particle) {
    return particle && particle.tier.threshold >= structurePlacementTierThreshold;
  }

  function structurePlacementThresholdForType(type) {
    if (type === "tether") {
      return thresholdForTierName("boulder");
    }
    return structurePlacementTierThreshold;
  }

  function isStructureHostBodyForType(particle, type) {
    return particle && particle.tier.threshold >= structurePlacementThresholdForType(type);
  }

  function isKnownStructureType(type) {
    return type === "turret" || type === "missile-launcher" || type === "accumulator" || type === "shield-generator" || type === "plating-block" || type === "battery" || type === "communication-relay" || type === "jet" || type === "tether";
  }

  function hasCommunicationRelay() {
    return structures.some((structure) => structure.type === "communication-relay" && structure.health > 0);
  }

  function structureMaxHealth(type) {
    return structureMaxHealthByType[type] || 100;
  }

  function structureHitRadius(structure) {
    if (structure.type === "plating-block") {
      return 48;
    }
    if (structure.type === "battery") {
      return 42;
    }
    if (structure.type === "accumulator") {
      return 44;
    }
    if (structure.type === "shield-generator") {
      return 50;
    }
    if (structure.type === "missile-launcher") {
      return 52;
    }
    if (structure.type === "communication-relay") {
      return 52;
    }
    if (structure.type === "jet") {
      return 46;
    }
    if (structure.type === "tether") {
      return 42;
    }
    return 48;
  }

  function isStructureDisabled(structure) {
    return structure && structure.disabledTimer > 0;
  }

  function isPlatingBlock(structure) {
    return structure && structure.type === "plating-block";
  }

  function structureBaseSurfaceOffset(structure) {
    return Math.max(0, finiteOr(structure && structure.surfaceOffset, 0));
  }

  function platingBlockTopOffset(structure) {
    return structureBaseSurfaceOffset(structure) + platingBlockHeight;
  }

  function platingBlockHalfAngle(body, structure) {
    const centerRadius = Math.max(24, body.radius + structureBaseSurfaceOffset(structure) + platingBlockHeight * 0.5);
    return Math.min(Math.PI, platingBlockWidth / centerRadius / 2);
  }

  function platingBlockCoversAngle(body, structure, angle) {
    if (!isPlatingBlock(structure) || structure.bodyId !== body.id) {
      return false;
    }

    return Math.abs(shortestAngleDelta(structure.angle, angle)) <= platingBlockHalfAngle(body, structure);
  }

  function surfaceExtensionAtAngle(body, angle) {
    if (!body) {
      return 0;
    }

    let extension = 0;
    for (const structure of structures) {
      if (platingBlockCoversAngle(body, structure, angle)) {
        extension = Math.max(extension, platingBlockTopOffset(structure));
      }
    }

    return extension;
  }

  function structureCenterOffset(type, surfaceOffset) {
    if (type === "plating-block") {
      return surfaceOffset + platingBlockHeight * 0.5;
    }
    if (type === "battery") {
      return surfaceOffset + 15;
    }
    if (type === "shield-generator") {
      return surfaceOffset + 20;
    }
    if (type === "missile-launcher") {
      return surfaceOffset + 22;
    }
    if (type === "jet") {
      return surfaceOffset + 18;
    }
    if (type === "tether") {
      return surfaceOffset + 14;
    }

    return surfaceOffset + structureSurfaceOffset;
  }

  function maxEnergyForBody(body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }

    return Math.round(80 + Math.sqrt(Math.max(1, body.mass)) * 4.2);
  }

  function batteryCountForBody(bodyId) {
    let count = 0;
    for (const structure of structures) {
      if (structure.type === "battery" && structure.bodyId === bodyId && structure.health > 0 && !isStructureDisabled(structure)) {
        count += 1;
      }
    }
    return count;
  }

  function energyRegenForBody(body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }

    return 2.2 + Math.sqrt(Math.max(1, body.mass)) * 0.075 + batteryCountForBody(body.id) * batteryEnergyRegenBonus;
  }

  function normalizeBodyEnergy(body) {
    if (!body) {
      return;
    }

    const maxEnergy = maxEnergyForBody(body);
    if (maxEnergy <= 0) {
      body.maxEnergy = 0;
      body.energy = 0;
      return;
    }

    const previousMax = Math.max(0, finiteOr(body.maxEnergy, 0));
    const previousEnergy = Number.isFinite(Number(body.energy)) ? finiteOr(body.energy, maxEnergy) : maxEnergy;
    body.maxEnergy = maxEnergy;
    body.energy = previousMax > 0
      ? clamp(previousEnergy, 0, maxEnergy)
      : maxEnergy;
  }

  function spendBodyEnergy(body, amount) {
    normalizeBodyEnergy(body);
    const cost = Math.max(0, finiteOr(amount, 0));
    if (!body || cost <= 0) {
      return true;
    }
    if (body.energy < cost) {
      return false;
    }

    body.energy = Math.max(0, body.energy - cost);
    return true;
  }

  function canSpendBodyEnergy(body, amount) {
    normalizeBodyEnergy(body);
    return Boolean(body) && finiteOr(body.energy, 0) >= Math.max(0, finiteOr(amount, 0));
  }

  function playerEnergyPct() {
    return clamp(player.energy / Math.max(1, player.maxEnergy), 0, 1);
  }

  function targetPlayerMaxEnergy() {
    const absorbedMass = Math.max(0, finiteOr(lifeStats.absorbedParticleMass, 0));
    const absorbedCount = Math.max(0, finiteOr(lifeStats.absorbedParticleCount, 0));
    return clamp(
      playerBaseMaxEnergy + Math.sqrt(absorbedMass) * playerMaxEnergyMassScale + absorbedCount * playerMaxEnergyCountScale,
      playerBaseMaxEnergy,
      playerMaxEnergyCap
    );
  }

  function recordPlayerAbsorption(absorber, absorbed) {
    if (!absorber || !absorbed || !isGrowthMatter(absorbed)) {
      return;
    }

    const scoredIds = connectedScoredBodyIds();
    if (!scoredIds.has(absorber.id)) {
      return;
    }

    lifeStats.absorbedParticleMass += Math.max(0, finiteOr(absorbed.mass, 0));
    lifeStats.absorbedParticleCount += 1;
  }

  function hasPlayerEnergy(amount = 0.05) {
    return player.energy > Math.max(0, amount);
  }

  function spendPlayerEnergy(amount) {
    const cost = Math.max(0, finiteOr(amount, 0));
    if (cost <= 0) {
      return true;
    }
    if (player.energy < cost) {
      player.energy = 0;
      return false;
    }

    player.energy -= cost;
    return true;
  }

  function drainPlayerEnergy(rate, dt) {
    return spendPlayerEnergy(Math.max(0, finiteOr(rate, 0)) * Math.max(0, finiteOr(dt, 0)));
  }

  function notifyEnergyDepleted() {
    maybeNotifyText("Energy depleted.", { groupKey: "energy-depleted" });
  }

  function isJetpackBoostPressed() {
    return keys.has("ShiftLeft") || keys.has("ShiftRight");
  }

  function isMappedBody(particle) {
    return particle.tier.threshold >= mappedBodyThreshold;
  }

  function surfaceDistanceToPlayer(particle) {
    const dx = player.x - particle.x;
    const dy = player.y - particle.y;
    const angle = Math.atan2(dy, dx);
    return Math.max(0, Math.hypot(dx, dy) - particle.radius - surfaceExtensionAtAngle(particle, angle));
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
      const angle = Math.atan2(dy, dx);
      const landingRange = particle.radius + surfaceExtensionAtAngle(particle, angle) + playerFootOffset + 90;

      if (distance < landingRange && distance < nearestDistance) {
        nearest = particle;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function findStructurePlacementAt(worldX, worldY) {
    const recipe = recipeById(activePlacementRecipeId);
    const structureType = recipe && recipe.structureType;
    let best = null;
    let bestScore = Infinity;

    for (const body of particles) {
      if (!isStructureHostBodyForType(body, structureType)) {
        continue;
      }

      const dx = worldX - body.x;
      const dy = worldY - body.y;
      const dist = Math.hypot(dx, dy) || 1;
      const angle = Math.atan2(dy, dx);
      const surfaceOffset = surfaceExtensionAtAngle(body, angle);
      const surfaceDelta = Math.abs(dist - body.radius - surfaceOffset);
      if (surfaceDelta > structurePlacementLeeway) {
        continue;
      }

      const centerOffset = structureCenterOffset(structureType, surfaceOffset);
      const x = body.x + Math.cos(angle) * (body.radius + centerOffset);
      const y = body.y + Math.sin(angle) * (body.radius + centerOffset);
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
          surfaceOffset,
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
      surfaceOffset: 0,
      x: worldX,
      y: worldY
    };
  }

  function currentStructurePlacement() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    return findStructurePlacementAt(cursor.x, cursor.y);
  }

  function refreshPlacementAnchor(placement) {
    if (!placement || !placement.bodyId) {
      return placement;
    }

    const body = bodyById(placement.bodyId);
    const recipe = recipeById(activePlacementRecipeId);
    if (!isStructureHostBodyForType(body, recipe && recipe.structureType)) {
      return Object.assign({}, placement, { valid: false, body: null });
    }

    const surfaceOffset = surfaceExtensionAtAngle(body, placement.angle);
    const centerOffset = structureCenterOffset(recipe && recipe.structureType, surfaceOffset);
    return Object.assign({}, placement, {
      valid: true,
      body,
      surfaceOffset,
      x: body.x + Math.cos(placement.angle) * (body.radius + centerOffset),
      y: body.y + Math.sin(placement.angle) * (body.radius + centerOffset)
    });
  }

  function createStructure(recipe, placement, linkedPlacement) {
    const structure = {
      id: nextStructureId++,
      type: recipe.structureType,
      bodyId: placement.bodyId,
      linkedBodyId: linkedPlacement ? linkedPlacement.bodyId : 0,
      angle: placement.angle,
      linkedAngle: linkedPlacement ? linkedPlacement.angle : 0,
      surfaceOffset: placement.surfaceOffset,
      linkedSurfaceOffset: linkedPlacement ? linkedPlacement.surfaceOffset : 0,
      x: placement.x,
      y: placement.y,
      x2: linkedPlacement ? linkedPlacement.x : placement.x,
      y2: linkedPlacement ? linkedPlacement.y : placement.y,
      restLength: linkedPlacement ? Math.hypot(linkedPlacement.x - placement.x, linkedPlacement.y - placement.y) : 0,
      aimAngle: placement.angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: randomRange(0.2, 0.8),
      burstTimer: 0,
      burstCooldown: randomRange(0.4, accumulatorBurstInterval),
      missileCharge: 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: placement.x,
      targetY: placement.y,
      targetCount: 0,
      health: structureMaxHealth(recipe.structureType),
      maxHealth: structureMaxHealth(recipe.structureType),
      disabledTimer: 0,
      flash: 0,
      wobble: randomRange(0, Math.PI * 2)
    };
    return structure;
  }

  function applyTetherSurfaceConstraint(structure) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!isStructureHostBodyForType(firstBody, "tether") || !isStructureHostBodyForType(secondBody, "tether") || firstBody.id === secondBody.id) {
      return false;
    }

    const firstOffset = structureCenterOffset(structure.type, structureBaseSurfaceOffset(structure));
    const secondSurfaceOffset = Math.max(0, finiteOr(structure.linkedSurfaceOffset, 0));
    const secondOffset = structureCenterOffset(structure.type, secondSurfaceOffset);
    structure.x = firstBody.x + Math.cos(structure.angle) * (firstBody.radius + firstOffset);
    structure.y = firstBody.y + Math.sin(structure.angle) * (firstBody.radius + firstOffset);
    structure.x2 = secondBody.x + Math.cos(structure.linkedAngle) * (secondBody.radius + secondOffset);
    structure.y2 = secondBody.y + Math.sin(structure.linkedAngle) * (secondBody.radius + secondOffset);
    structure.restLength = Math.max(80, finiteOr(structure.restLength, Math.hypot(structure.x2 - structure.x, structure.y2 - structure.y)));
    return true;
  }

  function applyStructureSurfaceConstraint(structure) {
    if (structure.type === "tether") {
      return applyTetherSurfaceConstraint(structure);
    }

    const body = bodyById(structure.bodyId);
    if (!isStructureHostBody(body)) {
      return false;
    }

    const surfaceOffset = structureBaseSurfaceOffset(structure);
    const centerOffset = structureCenterOffset(structure.type, surfaceOffset);
    structure.x = body.x + Math.cos(structure.angle) * (body.radius + centerOffset);
    structure.y = body.y + Math.sin(structure.angle) * (body.radius + centerOffset);
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
      maybeNotifyText(recipe.structureType === "tether"
        ? "Tethers need boulder-sized or larger bodies."
        : "Structures need a dwarf moon, moon, planet, or plate surface.");
      return false;
    }

    if (recipe.structureType === "tether") {
      if (!pendingTetherAnchor) {
        pendingTetherAnchor = placement;
        maybeNotifyText("Choose another body for the other end of the tether.");
        playSound("select");
        return true;
      }

      const firstPlacement = refreshPlacementAnchor(pendingTetherAnchor);
      if (!firstPlacement || !firstPlacement.valid) {
        pendingTetherAnchor = null;
        maybeNotifyText("The first tether anchor is no longer available.");
        return false;
      }

      if (placement.bodyId === firstPlacement.bodyId) {
        maybeNotifyText("The tether needs two different bodies.");
        return false;
      }

      spendRecipeCost(recipe);
      structures.push(createStructure(recipe, firstPlacement, placement));
      pendingTetherAnchor = null;
    } else {
      spendRecipeCost(recipe);
      structures.push(createStructure(recipe, placement));
    }
    activePlacementRecipeId = null;
    updateTechUi();
    playSound("place");
    maybeNotifyText(recipe.name + " placed.");
    return true;
  }

  function communicationRelayAtCursor() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestDistance = Infinity;

    for (const structure of structures) {
      if (structure.type !== "communication-relay" || structure.health <= 0) {
        continue;
      }

      const distance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      if (distance > structureHitRadius(structure) + 18 || distance >= bestDistance) {
        continue;
      }

      best = structure;
      bestDistance = distance;
    }

    return best;
  }

  function handleCommunicationRelayClick() {
    const relay = communicationRelayAtCursor();
    if (!relay) {
      return false;
    }

    openRelayContacts();
    playSound("select");
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
      if (tier.threshold < thresholdForTierName("asteroid")) {
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
    const surfaceOffset = surfaceExtensionAtAngle(body, rival.landed.angle);
    const distanceFromCenter = body.radius + surfaceOffset + rivalFootOffset;

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

    const surfaceRadius = Math.max(24, body.radius + surfaceExtensionAtAngle(body, rival.landed.angle));
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
    playSound("detach");
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
    const surfaceOffset = surfaceExtensionAtAngle(body, player.landed.angle);
    const distanceFromCenter = body.radius + surfaceOffset + playerFootOffset;
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
      walkSpeed: 0,
      walkCycle: player.walkCycle || 0
    };
    cameraRoll = surfaceCameraRollForAngle(angle);
    applyLandedSurfaceConstraint();
    playSound("landing");
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

    const surfaceCircumferenceRadius = Math.max(24, body.radius + surfaceExtensionAtAngle(body, player.landed.angle));
    const asteroidWalkMultiplier = body.tier.name === "asteroid" ? 0.78 : 1;
    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const walkSpeed = (isMovementKeyPressed("down") ? 68 : 128) * asteroidWalkMultiplier * weaponSlowFactor;
    const vacuumHoldActive = isVacuumHoldActive();
    let walkDirection = 0;

    if (!vacuumHoldActive && isMovementKeyPressed("left")) {
      walkDirection -= 1;
    }
    if (!vacuumHoldActive && isMovementKeyPressed("right")) {
      walkDirection += 1;
    }

    player.landed.walkSpeed = walkDirection * walkSpeed;
    if (walkDirection) {
      player.walkCycle += (2.3 + Math.abs(player.landed.walkSpeed) * 0.052) * dt;
      player.landed.walkCycle = player.walkCycle;
    } else {
      player.landed.walkCycle = player.walkCycle;
    }
    player.landed.angle += (player.landed.walkSpeed / surfaceCircumferenceRadius) * dt;
    cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
    applyLandedSurfaceConstraint();
  }

  function updateLandedGadgetThrust(dt) {
    if (!canUseSuctionControls() || !player.landed || (!mouse.left && !mouse.right)) {
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

  function updateEnergySystems(dt) {
    for (const body of particles) {
      normalizeBodyEnergy(body);
      if (body.maxEnergy > 0 && body.energy < body.maxEnergy) {
        body.energy = Math.min(body.maxEnergy, body.energy + energyRegenForBody(body) * dt);
      }
    }

    const targetMaxEnergy = targetPlayerMaxEnergy();
    player.maxEnergy = clamp(finiteOr(player.maxEnergy, playerBaseMaxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    if (player.maxEnergy < targetMaxEnergy) {
      const growthRate = 0.32 + Math.sqrt(Math.max(0, finiteOr(lifeStats.absorbedParticleMass, 0))) * 0.0025;
      player.maxEnergy = Math.min(targetMaxEnergy, player.maxEnergy + growthRate * dt);
    }
    player.energy = clamp(finiteOr(player.energy, player.maxEnergy), 0, player.maxEnergy);
    if (player.energy >= player.maxEnergy) {
      return;
    }

    let regen = playerBaseEnergyRegen;
    if (player.landed) {
      const landedBody = bodyById(player.landed.bodyId);
      if (landedBody) {
        regen += energyRegenForBody(landedBody) * landedEnergyRegenShare;
      }
    }

    player.energy = Math.min(player.maxEnergy, player.energy + regen * dt);
  }

  function updateToolEnergyUsage(dt) {
    if (areToolsDisabled() || buildMenuOpen) {
      return;
    }

    if (isSuctionEquipped() && isGadgetButtonPressed()) {
      if (!drainPlayerEnergy(suctionEnergyDrain, dt)) {
        resetMouseButtons();
        notifyEnergyDepleted();
      }
    }
  }

  function updatePlayer(dt) {
    player.weaponSlow = Math.max(0, finiteOr(player.weaponSlow, 0) - weaponSlowDecay * dt);
    const vacuumHoldActive = isVacuumHoldActive();

    if (player.landed) {
      updateLandedPlayer(dt);
      return;
    }

    let localX = 0;
    let localY = 0;

    if (isMovementKeyPressed("left")) {
      localX -= 1;
    }
    if (isMovementKeyPressed("right")) {
      localX += 1;
    }
    if (isMovementKeyPressed("up")) {
      localY -= 1;
    }
    if (isMovementKeyPressed("down")) {
      localY += 1;
    }

    if (isControlPressed("rollLeft")) {
      cameraRoll -= 1.9 * dt;
    }
    if (isControlPressed("rollRight")) {
      cameraRoll += 1.9 * dt;
    }

    if (!vacuumHoldActive && (localX || localY)) {
      const local = normalize(localX, localY);
      const world = cameraLocalToWorld(local.x, local.y);
      const suctionActive = canUseSuctionControls() && isGadgetButtonPressed();
      const boosting = !suctionActive && isJetpackBoostPressed() && drainPlayerEnergy(jetpackBoostEnergyDrain, dt);
      const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
      const thrust = 640 * (suctionActive ? 0.56 : 1) * (boosting ? jetpackBoostThrustMultiplier : 1) * weaponSlowFactor;
      player.vx += world.x * thrust * dt;
      player.vy += world.y * thrust * dt;
    }

    const speed = length(player.vx, player.vy);
    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const boostSpeed = isJetpackBoostPressed() && hasPlayerEnergy() ? jetpackBoostSpeedMultiplier : 1;
    const maxSpeed = vacuumHoldActive ? 0 : ((canUseSuctionControls() && isGadgetButtonPressed()) ? 275 : 430 * boostSpeed) * weaponSlowFactor;
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

  function applyGadgetForces(target, aim, funnel, dt, options = {}) {
    const controlsEnabled = canUseSuctionControls();
    const leftActive = controlsEnabled && mouse.left;
    const middleActive = controlsEnabled && mouse.middle;
    const rightActive = controlsEnabled && mouse.right;
    const toTargetX = target.x - player.x;
    const toTargetY = target.y - player.y;
    const forward = toTargetX * aim.world.x + toTargetY * aim.world.y;
    const sideX = toTargetX - aim.world.x * forward;
    const sideY = toTargetY - aim.world.y * forward;
    const side = length(sideX, sideY);
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const inCone = forward > -70 && forward < gadgetForceReach && side < coneWidth;
    const toMouthX = funnel.x - target.x;
    const toMouthY = funnel.y - target.y;
    const mouthDist = length(toMouthX, toMouthY);
    const pushResponse = bodyPushResponse(target);
    const captureInFunnel = options.captureInFunnel !== false;

    if (middleActive && inCone) {
      const holdX = player.x + aim.world.x * gadgetHoldReach;
      const holdY = player.y + aim.world.y * gadgetHoldReach;
      const toHoldX = holdX - target.x;
      const toHoldY = holdY - target.y;
      const holdDistance = length(toHoldX, toHoldY);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const response = Math.max(0.22, pushResponse);
      const desiredSpeed = clamp(holdDistance * 5.4, 0, 520);
      const hold = normalize(toHoldX, toHoldY);
      const desiredVx = hold.x * desiredSpeed;
      const desiredVy = hold.y * desiredSpeed;
      const steer = clamp((4.8 + response * 8.6) * coneStrength * dt, 0, 1);

      target.vx += (desiredVx - target.vx) * steer;
      target.vy += (desiredVy - target.vy) * steer;
      target.vx *= Math.pow(0.16 + (1 - response) * 0.42, dt);
      target.vy *= Math.pow(0.16 + (1 - response) * 0.42, dt);

      if (holdDistance < target.radius + 20 && length(target.vx, target.vy) < 58) {
        target.vx = 0;
        target.vy = 0;
        target.gadgetStabilized = true;
      } else {
        target.gadgetStabilized = false;
      }
      return;
    }

    if (leftActive || rightActive) {
      target.gadgetStabilized = false;
    }

    if (leftActive && inCone) {
      const pull = normalize(toMouthX, toMouthY);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const distanceStrength = clamp(1 - mouthDist / 620, 0.16, 1);
      const force = 1180 * currentGadgetSuckFactor() * coneStrength * distanceStrength * pushResponse;
      target.vx += pull.x * force * dt;
      target.vy += pull.y * force * dt;

      if (captureInFunnel && mouthDist < funnel.radius + target.radius * 2.2) {
        const cup = normalize(toMouthX, toMouthY);
        const ringTarget = Math.max(0, funnel.radius * 0.42 - target.radius * 0.22);
        const current = mouthDist || 1;
        const settle = (current - ringTarget) * 22 * pushResponse;
        target.vx += cup.x * settle * dt;
        target.vy += cup.y * settle * dt;
        target.vx *= Math.pow(0.035 + (1 - pushResponse) * 0.7, dt);
        target.vy *= Math.pow(0.035 + (1 - pushResponse) * 0.7, dt);
      }
    }

    if (rightActive && forward > -20 && forward < 470 && side < coneWidth * 0.9) {
      const blastFalloff = clamp(1 - Math.max(0, forward) / 520, 0.22, 1);
      const sidePush = normalize(sideX, sideY);
      const force = 1450 * currentGadgetBlowFactor() * blastFalloff * pushResponse;
      target.vx += (aim.world.x * force + sidePush.x * 120 * pushResponse) * dt;
      target.vy += (aim.world.y * force + sidePush.y * 120 * pushResponse) * dt;
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
    const controlsEnabled = canUseSuctionControls();
    const leftActive = controlsEnabled && mouse.left;
    const rightActive = controlsEnabled && mouse.right;
    const normal = { x: -aim.world.y, y: aim.world.x };
    const relX = target.x - player.x;
    const relY = target.y - player.y;
    const velocityX = target.vx - player.vx;
    const velocityY = target.vy - player.vy;
    const originalState = {
      x: relX * aim.world.x + relY * aim.world.y,
      y: relX * normal.x + relY * normal.y,
      vx: velocityX * aim.world.x + velocityY * aim.world.y,
      vy: velocityX * normal.x + velocityY * normal.y
    };
    const state = {
      ...originalState
    };
    const pushResponse = bodyPushResponse(target);

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
      const damping = Math.pow(rightActive ? 0.72 : 0.18, dt);
      state.vx *= damping;
      state.vy *= damping;

      if (!rightActive) {
        state.vx += (funnelShape.captureX - state.x) * 7.5 * dt;
        state.vy += -state.y * 8.5 * dt;
      }

      if (leftActive) {
        state.vx += (funnelShape.captureX - state.x) * 6.5 * dt;
        state.vy += -state.y * 6.5 * dt;
      }
    }

    const resolvedState = {
      x: originalState.x + (state.x - originalState.x) * pushResponse,
      y: originalState.y + (state.y - originalState.y) * pushResponse,
      vx: originalState.vx + (state.vx - originalState.vx) * pushResponse,
      vy: originalState.vy + (state.vy - originalState.vy) * pushResponse
    };

    target.x = player.x + aim.world.x * resolvedState.x + normal.x * resolvedState.y;
    target.y = player.y + aim.world.y * resolvedState.x + normal.y * resolvedState.y;
    target.vx = player.vx + aim.world.x * resolvedState.vx + normal.x * resolvedState.vy;
    target.vy = player.vy + aim.world.y * resolvedState.vx + normal.y * resolvedState.vy;
  }

  function updateParticles(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const landedBodyId = player.landed ? player.landed.bodyId : null;
    const suctionActive = canUseSuctionControls();
    const vacuumBucketActive = hasVacuumBucketCollider();

    spawnTimer -= dt;
    while (particles.length < targetParticles && spawnTimer <= 0) {
      spawnParticleNearPlayer();
      spawnTimer += 0.14;
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      const isLandedBody = particle.id === landedBodyId;
      if (particle.ufoSapTimer !== undefined) {
        particle.ufoSapTimer = Math.max(0, finiteOr(particle.ufoSapTimer, 0) - dt);
      }

      if (suctionActive && !isLandedBody && !isUfoBeamCargo(particle)) {
        applyGadgetForces(particle, aim, funnel, dt);
      }

      if (particle.gadgetStabilized && length(particle.vx, particle.vy) > gadgetStabilizedBreakSpeed) {
        particle.gadgetStabilized = false;
      }

      if (!particle.gadgetStabilized || !particle.tier.solid) {
        particle.vx += Math.sin(particle.wobble + performance.now() * 0.0007) * 4 * dt;
        particle.vy += Math.cos(particle.wobble * 1.7 + performance.now() * 0.0006) * 4 * dt;
      }
      const dragBase = particle.tier.solid
        ? clamp(0.9 + Math.log10(Math.max(10, particle.mass)) * 0.014, 0.9, 0.955)
        : 0.82;
      particle.vx *= Math.pow(dragBase, dt);
      particle.vy *= Math.pow(dragBase, dt);
      if (particle.gadgetStabilized && particle.tier.solid && length(particle.vx, particle.vy) <= gadgetStabilizedBreakSpeed) {
        particle.vx = 0;
        particle.vy = 0;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (vacuumBucketActive && !isLandedBody && !isUfoBeamCargo(particle)) {
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

  function tierIndex(tier) {
    return Math.max(0, bodyTiers.findIndex((candidate) => candidate.name === tier.name));
  }

  function isProtectedStrategicBody(particle) {
    return particle.tier.threshold >= thresholdForTierName("dwarf moon");
  }

  function isGrowthMatter(particle) {
    return particle.tier.name === "particle" || particle.tier.name === "rock" || particle.tier.name === "boulder";
  }

  function isBoulderBody(particle) {
    return particle && particle.tier && particle.tier.name === "boulder";
  }

  function isUfoBeamCargo(particle) {
    return particle && finiteOr(particle.ufoSapTimer, 0) > 0;
  }

  function canUfoTractorAffectParticle(particle) {
    if (!particle || !particle.tier) {
      return false;
    }

    return (
      particle.tier.name === "particle" ||
      particle.tier.name === "rock" ||
      isBoulderBody(particle) ||
      isAsteroidOrLarger(particle)
    );
  }

  function canUfoAbsorbParticle(particle) {
    return particle && particle.tier && (particle.tier.name === "particle" || particle.tier.name === "rock");
  }

  function shouldUfoSiphonBody(particle) {
    return isAsteroidOrLarger(particle);
  }

  function shouldSkipParticleMerge(a, b) {
    return isUfoBeamCargo(a) || isUfoBeamCargo(b);
  }

  function areBodiesDirectlyTethered(a, b) {
    if (!a || !b || a.id === b.id) {
      return false;
    }

    for (const structure of structures) {
      if (
        structure.type === "tether" &&
        structure.health > 0 &&
        (
          (structure.bodyId === a.id && structure.linkedBodyId === b.id) ||
          (structure.bodyId === b.id && structure.linkedBodyId === a.id)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  function canAbsorbBody(absorber, absorbed) {
    if (isProtectedStrategicBody(absorbed)) {
      return false;
    }

    if (isGrowthMatter(absorbed)) {
      return true;
    }

    if (absorbed.tier.name === "asteroid" || absorbed.tier.name === "dwarf moon") {
      return tierIndex(absorber.tier) > tierIndex(absorbed.tier) || absorber.mass >= absorbed.mass * 1.75;
    }

    return false;
  }

  function absorbingCollisionPair(a, b) {
    if (areBodiesDirectlyTethered(a, b)) {
      return null;
    }

    if (canAbsorbBody(a, b) && (!canAbsorbBody(b, a) || a.mass >= b.mass)) {
      return { absorber: a, absorbed: b };
    }
    if (canAbsorbBody(b, a)) {
      return { absorber: b, absorbed: a };
    }
    return null;
  }

  function resolveBodyBounce(a, b, dx, dy, minDist) {
    const rawDist = Math.hypot(dx, dy);
    const dist = rawDist || 1;
    const nx = rawDist ? dx / dist : 1;
    const ny = rawDist ? dy / dist : 0;
    const overlap = Math.max(0, minDist - dist);
    const totalMass = Math.max(1, a.mass + b.mass);
    const aShare = clamp(b.mass / totalMass, 0.08, 0.92);
    const bShare = clamp(a.mass / totalMass, 0.08, 0.92);

    a.x -= nx * overlap * aShare;
    a.y -= ny * overlap * aShare;
    b.x += nx * overlap * bShare;
    b.y += ny * overlap * bShare;

    const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relativeVelocity < 0) {
      a.gadgetStabilized = false;
      b.gadgetStabilized = false;
      const impulse = -relativeVelocity * 0.86;
      a.vx -= nx * impulse * aShare;
      a.vy -= ny * impulse * aShare;
      b.vx += nx * impulse * bShare;
      b.vy += ny * impulse * bShare;
    }
  }

  function mergeParticles() {
    let mergesThisFrame = 0;

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        if (shouldSkipParticleMerge(a, b)) {
          continue;
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.radius + b.radius;

        if (dx * dx + dy * dy <= minDist * minDist) {
          const absorbingPair = absorbingCollisionPair(a, b);
          if (!absorbingPair) {
            resolveBodyBounce(a, b, dx, dy, minDist);
            continue;
          }

          recordPlayerAbsorption(absorbingPair.absorber, absorbingPair.absorbed);
          const mass = absorbingPair.absorber.mass + absorbingPair.absorbed.mass;
          const previousTier = a.tier.threshold >= b.tier.threshold ? a.tier : b.tier;
          const tier = tierForMass(mass);
          const graduated = tier.threshold > previousTier.threshold;
          const visualSource = graduated ? dominantMergeBody(a, b) : absorbingPair.absorber;
          const color = graduated ? mixColor(a.color, b.color, a.mass, b.mass) : absorbingPair.absorber.color;
          normalizeBodyEnergy(a);
          normalizeBodyEnergy(b);
          const storedEnergy = clamp(finiteOr(a.energy, 0), 0, Math.max(1, finiteOr(a.maxEnergy, 0)))
            + clamp(finiteOr(b.energy, 0), 0, Math.max(1, finiteOr(b.maxEnergy, 0)));
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
          normalizeBodyEnergy(merged);
          merged.energy = clamp(storedEnergy, 0, merged.maxEnergy || 0);

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
            }
            if (structure.linkedBodyId === a.id || structure.linkedBodyId === b.id) {
              structure.linkedBodyId = merged.id;
            }
            if (structure.bodyId === merged.id || structure.linkedBodyId === merged.id) {
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
          playSound(graduated ? "milestone" : "merge", {
            volume: clamp(0.45 + Math.log2(Math.max(1, mass)) * 0.08, 0.45, 1.1)
          });
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
    const suctionActive = canUseSuctionControls();

    for (let i = healthPickups.length - 1; i >= 0; i -= 1) {
      const pickup = healthPickups[i];
      pickup.life -= dt;

      if (suctionActive) {
        applyGadgetForces(pickup, aim, funnel, dt, { captureInFunnel: false });
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

      if (canHeal && playerCanCollectPickup(pickup)) {
        player.health = Math.min(player.maxHealth, player.health + pickup.heal);
        playSound("pickupHealth");
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
    const suctionActive = canUseSuctionControls();

    for (let i = techPickups.length - 1; i >= 0; i -= 1) {
      const pickup = techPickups[i];
      pickup.life -= dt;
      pickup.rotation += (1.4 + Math.sin(pickup.wobble) * 0.4) * dt;

      if (suctionActive) {
        applyGadgetForces(pickup, aim, funnel, dt, { captureInFunnel: false });
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

      if (playerCanCollectPickup(pickup)) {
        techInventory[pickup.key] = Math.max(0, Math.floor(techInventory[pickup.key] || 0)) + 1;
        lifeStats.techCollected += 1;
        updateTechUi();
        playSound("pickupTech");
        maybeNotifyText("Gained 1 " + pickup.label, {
          groupKey: "tech-gained:" + pickup.key,
          format: function (count) {
            return "Gained " + count + " " + pickup.label;
          }
        });
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
      const minDist = player.radius + solidBodyContactRadius(particle);

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
    return rivals.concat(ufos, rambots, engineers, teslas, rockets, fighters);
  }

  function reflectEntityVelocity(entity, nx, ny, damping, minSpeed) {
    const dot = entity.vx * nx + entity.vy * ny;
    entity.vx = (entity.vx - 2 * dot * nx) * damping;
    entity.vy = (entity.vy - 2 * dot * ny) * damping;

    const speed = Math.hypot(entity.vx, entity.vy);
    if (speed < minSpeed) {
      entity.vx -= nx * minSpeed;
      entity.vy -= ny * minSpeed;
    }
  }

  function tryFighterShieldBlock(fighter, projectile, nx, ny, options) {
    if (!fighter || fighter.kind !== "fighter" || fighter.health <= 0 || fighter.shieldCharge <= 0) {
      return false;
    }

    fighter.shieldActive = Math.max(fighter.shieldActive || 0, 0.55);
    fighter.shieldRecharge = fighterShieldCycle;
    fighter.flash = Math.max(fighter.flash || 0, 0.08);

    const damping = options && Number.isFinite(options.damping) ? options.damping : 0.42;
    const minSpeed = options && Number.isFinite(options.minSpeed) ? options.minSpeed : 80;
    reflectEntityVelocity(projectile, nx, ny, damping, minSpeed);

    if (options && options.pushBack) {
      projectile.x -= nx * options.pushBack;
      projectile.y -= ny * options.pushBack;
    }

    sparks.push({
      x: fighter.x - nx * fighter.radius * 0.55,
      y: fighter.y - ny * fighter.radius * 0.55,
      radius: fighter.radius * 2.4,
      color: fighter.color,
      life: 0.32,
      maxLife: 0.32
    });

    playSound("shield");
    return true;
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
        if (tryFighterShieldBlock(mob, particle, nx, ny, { damping: 0.36, minSpeed: 110, pushBack: particle.radius * 0.8 })) {
          continue;
        }
        const damage = Math.min(85, 18 + (speed - projectileDamageSpeed) * 0.16 + Math.sqrt(particle.mass) * 0.75);
        knockMob(mob, nx, ny, 170 + speed * 0.38);
        particle.vx *= 0.92;
        particle.vy *= 0.92;

        damageMob(mob, damage, particle.color, mobName(mob) + " knocked out by " + particle.tier.article + " " + particle.tier.name + ".");
      }
    }
  }

  function sharedBodyImpactDamage(body, impactSpeed, baseDamage) {
    return body && body.tier && body.tier.solid
      ? solidBodyImpactDamage(body, impactSpeed, baseDamage)
      : Math.min(90, baseDamage + Math.max(0, impactSpeed - rivalBodyImpactSpeed) * 0.16 + Math.sqrt(body.mass) * 0.62);
  }

  function sendSharedBodyImpactEffect(contact, keyPrefix, nx, ny, impactSpeed) {
    const impulse = 70 + impactSpeed * 0.28;
    sendThrottledRemoteEntityEffect(contact.remote, keyPrefix + ":" + contact.source.id, 0.18, {
      entityType: "particle",
      entityId: contact.source.id,
      impulseX: -nx * impulse,
      impulseY: -ny * impulse
    });
  }

  function resolveRemoteBodyPlayerCollisions() {
    for (const contact of collectRemoteSharedBodies()) {
      const body = contact.body;
      const dx = player.x - body.x;
      const dy = player.y - body.y;
      const rawDist = Math.hypot(dx, dy);
      const dist = rawDist || 1;
      const minDist = player.radius + (body.tier.solid ? solidBodyContactRadius(body) : body.radius * 1.08);

      if (dist >= minDist) {
        continue;
      }

      const nx = rawDist ? dx / dist : 1;
      const ny = rawDist ? dy / dist : 0;
      const relativeVelocity = (player.vx - body.vx) * nx + (player.vy - body.vy) * ny;
      const incomingSpeed = Math.max(0, -relativeVelocity);
      const bodySpeed = Math.hypot(body.vx, body.vy);
      const impactSpeed = Math.max(incomingSpeed, bodySpeed);

      if (body.tier.solid) {
        const overlap = minDist - dist;
        player.x += nx * overlap * 0.82;
        player.y += ny * overlap * 0.82;

        if (incomingSpeed > 0) {
          const impulse = incomingSpeed * 0.74;
          player.vx += nx * impulse;
          player.vy += ny * impulse;
          sendSharedBodyImpactEffect(contact, "player-body-bounce", nx, ny, incomingSpeed);
        }
      }

      const damageThreshold = body.tier.solid ? solidBodyDamageSpeed : projectileDamageSpeed;
      if (impactSpeed < damageThreshold || player.hitCooldown > 0) {
        continue;
      }

      if (player.landed) {
        detachFromBody(170);
      }

      const damage = sharedBodyImpactDamage(body, impactSpeed, 10);
      player.vx += nx * (120 + impactSpeed * 0.32);
      player.vy += ny * (120 + impactSpeed * 0.32);
      damageLocalPlayer(damage, {
        cause: body.tier.article + " " + body.tier.name,
        cooldown: 0.78,
        flash: 0.32
      });
      sendSharedBodyImpactEffect(contact, "player-body-hit", nx, ny, impactSpeed);
      sparks.push({
        x: player.x,
        y: player.y,
        radius: 48,
        color: body.color,
        life: 0.3,
        maxLife: 0.3
      });
      maybeNotifyText("Hull clipped by " + body.tier.article + " " + body.tier.name + ".");
    }
  }

  function resolveRemoteBodyMobCollisions() {
    const remoteBodies = collectRemoteSharedBodies();
    if (!remoteBodies.length) {
      return;
    }

    for (const mob of allCombatMobs()) {
      if (mob.health <= 0) {
        continue;
      }

      for (const contact of remoteBodies) {
        const body = contact.body;
        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = mob.radius + (body.tier.solid ? solidBodyContactRadius(body) : body.radius * 1.08);

        if (dist >= minDist) {
          continue;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const relativeVelocity = (mob.vx - body.vx) * nx + (mob.vy - body.vy) * ny;
        const incomingSpeed = Math.max(0, -relativeVelocity);
        const bodySpeed = Math.hypot(body.vx, body.vy);
        const impactSpeed = Math.max(incomingSpeed, bodySpeed);

        if (mob.landed) {
          mob.landed = null;
          mob.residentTier = null;
        }

        if (body.tier.solid) {
          const overlap = minDist - dist;
          mob.x += nx * overlap * 0.78;
          mob.y += ny * overlap * 0.78;

          if (incomingSpeed > 0) {
            const impulse = incomingSpeed * 0.82;
            mob.vx += nx * impulse;
            mob.vy += ny * impulse;
            sendSharedBodyImpactEffect(contact, "mob-body-bounce", nx, ny, incomingSpeed);
          }
        }

        const damageThreshold = body.tier.solid ? solidBodyDamageSpeed : rivalBodyImpactSpeed;
        if (impactSpeed < damageThreshold || mob.hitCooldown > 0) {
          continue;
        }

        knockMob(mob, nx, ny, 145 + impactSpeed * 0.35);
        sendSharedBodyImpactEffect(contact, "mob-body-hit", nx, ny, impactSpeed);
        const damage = sharedBodyImpactDamage(body, impactSpeed, 12);
        if (damageMob(mob, damage, body.color, mobName(mob) + " crushed by " + body.tier.article + " " + body.tier.name + ".", {
          notification: bodyDefeatNotificationOptions(mob, body, "crushed")
        })) {
          break;
        }
      }
    }
  }

  function firePlayerLaser(weapon) {
    const spec = weapon || playerWeaponDefaults;
    const aim = getAim();
    const muzzleDistance = 80;
    const color = spec.color || playerWeaponDefaults.color;

    playerLasers.push({
      x: player.x + aim.world.x * muzzleDistance,
      y: player.y + aim.world.y * muzzleDistance,
      vx: aim.world.x * spec.speed + player.vx * 0.18,
      vy: aim.world.y * spec.speed + player.vy * 0.18,
      radius: spec.radius,
      length: spec.length,
      color,
      life: spec.life,
      maxLife: spec.life,
      damage: spec.damage,
      knockback: spec.knockback,
      piercesMobs: Boolean(spec.piercesMobs),
      hitMessage: null,
      weaponLabel: spec.label,
      sourceX: player.x,
      sourceY: player.y
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
      const slow = clamp(finiteOr(spec.movementSlow, playerWeaponDefaults.movementSlow), 0, 0.35);
      const immediateDrag = 1 - slow * 0.42;
      player.weaponSlow = clamp(finiteOr(player.weaponSlow, 0) + slow, 0, weaponSlowMax);
      player.vx = player.vx * immediateDrag - aim.world.x * (24 + slow * 120);
      player.vy = player.vy * immediateDrag - aim.world.y * (24 + slow * 120);
    } else {
      player.weaponSlow = clamp(
        finiteOr(player.weaponSlow, 0) + clamp(finiteOr(spec.movementSlow, playerWeaponDefaults.movementSlow), 0, 0.35),
        0,
        weaponSlowMax
      );
    }
    playSound("laser");
  }

  function findSpannerRepairTarget() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestScore = Infinity;

    for (const structure of structures) {
      const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
      const health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
      if (health >= maxHealth) {
        continue;
      }

      const cursorDistance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      const playerDistance = Math.hypot(structure.x - player.x, structure.y - player.y);
      const hitRadius = structureHitRadius(structure);
      if (cursorDistance > hitRadius + 38 || playerDistance > spannerRepairRange + hitRadius) {
        continue;
      }

      const score = cursorDistance + playerDistance * 0.18;
      if (score < bestScore) {
        best = structure;
        bestScore = score;
      }
    }

    return best;
  }

  function repairWithSpanner(dt) {
    if (!isSpannerEquipped() || !mouse.left || buildMenuOpen) {
      return false;
    }

    const target = findSpannerRepairTarget();
    if (!target) {
      return false;
    }

    if (!drainPlayerEnergy(spannerRepairEnergyDrain, dt)) {
      notifyEnergyDepleted();
      return false;
    }

    if (repairStructure(target, currentSpannerRepairRate() * dt)) {
      const color = { r: 102, g: 224, b: 184 };
      if (Math.random() < dt * 9) {
        sparks.push({
          x: target.x + randomRange(-16, 16),
          y: target.y + randomRange(-16, 16),
          radius: 18,
          color,
          life: 0.18,
          maxLife: 0.18
        });
      }
      playSound("pickupTech", { throttleKey: "spannerRepair", throttle: 0.22 });
      return true;
    }

    return false;
  }

  function structureTargetPoint(structure, cursor) {
    if (structure.type === "tether") {
      const firstDistance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      const x2 = finiteOr(structure.x2, structure.x);
      const y2 = finiteOr(structure.y2, structure.y);
      const secondDistance = Math.hypot(x2 - cursor.x, y2 - cursor.y);
      if (secondDistance < firstDistance) {
        return { x: x2, y: y2, distance: secondDistance };
      }
      return { x: structure.x, y: structure.y, distance: firstDistance };
    }

    return {
      x: structure.x,
      y: structure.y,
      distance: Math.hypot(structure.x - cursor.x, structure.y - cursor.y)
    };
  }

  function findSpannerDismantleTarget() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestScore = Infinity;

    for (const structure of structures) {
      if (structure.health <= 0) {
        continue;
      }

      const targetPoint = structureTargetPoint(structure, cursor);
      const playerDistance = Math.hypot(targetPoint.x - player.x, targetPoint.y - player.y);
      const hitRadius = structureHitRadius(structure);
      if (targetPoint.distance > hitRadius + 38 || playerDistance > spannerRepairRange + hitRadius) {
        continue;
      }

      const score = targetPoint.distance + playerDistance * 0.18;
      if (score < bestScore) {
        best = structure;
        bestScore = score;
      }
    }

    return best;
  }

  function refundDismantledStructure(structure) {
    const recipe = recipeByStructureType(structure.type);
    if (!recipe) {
      return 0;
    }

    return refundRecipeCost(recipe, 0.8);
  }

  function dismantleStructureWithSpanner(dt) {
    if (!isSpannerEquipped() || !mouse.right || buildMenuOpen) {
      return false;
    }

    const target = findSpannerDismantleTarget();
    if (!target) {
      return false;
    }

    if (!drainPlayerEnergy(spannerDismantleEnergyDrain, dt)) {
      notifyEnergyDepleted();
      return false;
    }

    const maxHealth = Math.max(1, finiteOr(target.maxHealth, structureMaxHealth(target.type)));
    const health = clamp(finiteOr(target.health, maxHealth), 0, maxHealth);
    target.maxHealth = maxHealth;
    target.health = Math.max(0, health - currentSpannerDismantleRate() * dt);
    target.flash = Math.max(target.flash || 0, 0.16);

    if (Math.random() < dt * 10) {
      sparks.push({
        x: target.x + randomRange(-16, 16),
        y: target.y + randomRange(-16, 16),
        radius: 18,
        color: { r: 102, g: 224, b: 184 },
        life: 0.18,
        maxLife: 0.18
      });
    }
    playSound("mobHit", { throttleKey: "spannerDismantle", throttle: 0.18, volume: 0.72 });

    if (target.health <= 0) {
      const index = structures.indexOf(target);
      if (index !== -1) {
        structures.splice(index, 1);
      }
      sparks.push({
        x: target.x,
        y: target.y,
        radius: structureHitRadius(target) * 1.35,
        color: { r: 102, g: 224, b: 184 },
        life: 0.28,
        maxLife: 0.28
      });
      const refunded = refundDismantledStructure(target);
      updateTechUi();
      playSound("pickupTech", { throttleKey: "spannerRefund", throttle: 0.08 });
      maybeNotifyText(target.type.replace(/-/g, " ") + (refunded > 0 ? " dismantled. Tech recovered." : " dismantled."));
    }

    return true;
  }

  function findSpannerStrikeTarget() {
    const aim = getAim();
    const ax = player.x + aim.world.x * 28;
    const ay = player.y + aim.world.y * 28;
    const bx = player.x + aim.world.x * spannerStrikeRange;
    const by = player.y + aim.world.y * spannerStrikeRange;
    let best = null;
    let bestDistance = Infinity;

    for (const mob of allCombatMobs()) {
      if (!isMechanicalMob(mob) || mob.health <= 0) {
        continue;
      }

      const segmentDistance = distanceToSegment(mob.x, mob.y, ax, ay, bx, by);
      const playerDistance = Math.hypot(mob.x - player.x, mob.y - player.y);
      if (segmentDistance > mob.radius + 18 || playerDistance > spannerStrikeRange + mob.radius || playerDistance >= bestDistance) {
        continue;
      }

      best = mob;
      bestDistance = playerDistance;
    }

    return best;
  }

  function strikeWithSpanner() {
    if (!isSpannerEquipped() || !mouse.right || buildMenuOpen || toolFireCooldown > 0) {
      return false;
    }

    if (!spendPlayerEnergy(spannerStrikeEnergyCost)) {
      notifyEnergyDepleted();
      return false;
    }

    const target = findSpannerStrikeTarget();
    toolFireCooldown = currentSpannerStrikeCooldown();
    if (!target) {
      return false;
    }

    const aim = getAim();
    knockMob(target, aim.world.x, aim.world.y, 115);
    damageMob(
      target,
      spannerStrikeDamage,
      { r: 102, g: 224, b: 184 },
      mobName(target) + " dismantled by the spanner.",
      { sourceTool: "spanner" }
    );
    sparks.push({
      x: target.x,
      y: target.y,
      radius: target.radius * 1.5,
      color: { r: 102, g: 224, b: 184 },
      life: 0.26,
      maxLife: 0.26
    });
    return true;
  }

  function updateEquippedTool(dt) {
    toolFireCooldown = Math.max(0, toolFireCooldown - dt);
    if (repairWithSpanner(dt)) {
      return;
    }
    if (dismantleStructureWithSpanner(dt)) {
      return;
    }
    if (strikeWithSpanner()) {
      return;
    }

    const weapon = equippedWeapon();

    if (areToolsDisabled() || buildMenuOpen || !weapon || !mouse.left || toolFireCooldown > 0) {
      return;
    }

    if (!spendPlayerEnergy(finiteOr(weapon.energyCost, playerWeaponDefaults.energyCost))) {
      notifyEnergyDepleted();
      return;
    }

    firePlayerLaser(weapon);
    toolFireCooldown = weapon.cooldown;
  }

  function updateToolDisable(dt) {
    if (toolDisabledTimer <= 0) {
      return;
    }

    toolDisabledTimer = Math.max(0, toolDisabledTimer - dt);
    resetMouseButtons();
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
      const ignoredBodyId = Number.isFinite(laser.ignoredBodyId) ? laser.ignoredBodyId : null;
      const blocker = findBlockingLandableBody(tailX, tailY, laser.x, laser.y, laser.radius, ignoredBodyId);
      const piercesMobs = Boolean(laser.piercesMobs);
      const hitMobIds = Array.isArray(laser.hitMobIds) ? laser.hitMobIds : (laser.hitMobIds = []);

      if (blocker) {
        sparks.push({
          x: blocker.x,
          y: blocker.y,
          radius: 30,
          color: laser.color,
          life: 0.2,
          maxLife: 0.2
        });
        playSound("mobHit", { throttleKey: "laserImpact" });
        playerLasers.splice(i, 1);
        continue;
      }

      let stoppedByHit = false;
      for (const mob of allCombatMobs()) {
        if (mob.health <= 0 || mob.hitCooldown > 0) {
          continue;
        }
        const hitMobId = mob.kind + ":" + mob.id;
        if (hitMobIds.includes(hitMobId)) {
          continue;
        }

        const dist = distanceToSegment(mob.x, mob.y, tailX, tailY, laser.x, laser.y);
        if (dist >= mob.radius + laser.radius) {
          continue;
        }

        if (tryFighterShieldBlock(mob, laser, dirX, dirY, { damping: 0.44, minSpeed: 260, pushBack: laser.radius * 3 })) {
          laser.color = shadeColor(mob.color, 36);
          laser.damage = Math.max(8, (laser.damage || playerWeaponDefaults.damage) * 0.45);
          laser.life = Math.min(laser.life, 0.55);
          stoppedByHit = true;
          break;
        }

        knockMob(mob, dirX, dirY, laser.knockback || 170);
        damageMob(mob, laser.damage || playerWeaponDefaults.damage, laser.color, laser.hitMessage || mobName(mob) + " dropped by the " + (laser.weaponLabel || playerWeaponDefaults.label) + ".");
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 38,
          color: laser.color,
          life: 0.24,
          maxLife: 0.24
        });
        hitMobIds.push(hitMobId);
        if (!piercesMobs) {
          playerLasers.splice(i, 1);
          stoppedByHit = true;
          break;
        }
      }

      if (stoppedByHit) {
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
        const minDist = mob.radius + solidBodyContactRadius(particle);

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
        const bodyShare = clamp(2.6 / (particle.mass + 2.6), 0.006, 0.18);
        const mobShare = 1 - bodyShare;
        const bodySpeed = Math.hypot(particle.vx, particle.vy);
        const mobSpeed = Math.hypot(mob.vx, mob.vy);

        if (
          mob.kind === "fighter" &&
          (bodySpeed > rivalBodyImpactSpeed || (particle.vx * nx + particle.vy * ny) > 40) &&
          tryFighterShieldBlock(mob, particle, nx, ny, { damping: 0.32, minSpeed: 95, pushBack: particle.radius * 0.18 })
        ) {
          mob.x += nx * Math.min(overlap, 18) * 0.5;
          mob.y += ny * Math.min(overlap, 18) * 0.5;
          continue;
        }

        mob.x += nx * overlap * mobShare;
        mob.y += ny * overlap * mobShare;
        particle.x -= nx * overlap * bodyShare;
        particle.y -= ny * overlap * bodyShare;

        const relativeVelocity = (mob.vx - particle.vx) * nx + (mob.vy - particle.vy) * ny;
        const impactSpeed = Math.max(0, -relativeVelocity);
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.96;
          mob.vx += nx * impulse * 0.86;
          mob.vy += ny * impulse * 0.86;
          particle.vx -= nx * impulse * bodyShare;
          particle.vy -= ny * impulse * bodyShare;
        }

        if (
          mob.kind === "rambot" &&
          mob.impactCooldown <= 0 &&
          (mob.chargeTimer > 0 || mobSpeed > rambotBodyImpactSpeed) &&
          impactSpeed > rambotBodyImpactSpeed * 0.45
        ) {
          damageBodyWithRambot(mob, particle, nx, ny, Math.max(mobSpeed, impactSpeed));
        }

        if (bodySpeed > solidBodyDamageSpeed && mob.hitCooldown <= 0 && canDamageMobWithBody(mob, particle)) {
          const impactSpeedForDamage = Math.max(bodySpeed, impactSpeed);
          const damage = solidBodyImpactDamage(particle, impactSpeedForDamage, 18);
          markMobDamagedByBody(mob, particle);
          knockMob(mob, nx, ny, bodyImpactKnockbackForce(particle, impactSpeedForDamage));
          if (damageMob(mob, damage, particle.color, mobName(mob) + " crushed by " + particle.tier.article + " " + particle.tier.name + ".", {
            notification: bodyDefeatNotificationOptions(mob, particle, "crushed")
          })) {
            break;
          }
        }
      }
    }
  }

  function fireRivalLaser(rival, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / rivalProjectileSpeed, 0, 1.35);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.72;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.72;
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
      maxLife: 2.2,
      damage: rivalProjectileDamage,
      toolDisable: 0,
      cause: "Alienoid laser",
      targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : ""
    });

    sparks.push({
      x: rival.x + aim.x * muzzleDistance,
      y: rival.y + aim.y * muzzleDistance,
      radius: 28,
      color: rival.color,
      life: 0.18,
      maxLife: 0.18
    });

    playSound("enemyLaser");
    rival.shootCooldown = randomRange(4.5, 7.25);
    rival.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
  }

  function fireTeslaLightning(tesla, target, dist) {
    const targetEntity = target && target.kind === "structure" ? target : (target && target.player ? target.player : target && target.target && target.target.player ? target.target.player : player);
    const leadTime = clamp(dist / 980, 0, 0.65);
    const aim = normalize(
      targetEntity.x + finiteOr(targetEntity.vx, 0) * leadTime * 0.42 - tesla.x,
      targetEntity.y + finiteOr(targetEntity.vy, 0) * leadTime * 0.42 - tesla.y
    );
    const color = { r: 157, g: 255, b: 122 };
    const muzzleDistance = tesla.radius + 12;

    rivalProjectiles.push({
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      vx: aim.x * 980 + tesla.vx * 0.08,
      vy: aim.y * 980 + tesla.vy * 0.08,
      radius: 8,
      length: randomRange(76, 104),
      color,
      life: 0.58,
      maxLife: 0.58,
      damage: teslaLightningDamage,
      toolDisable: teslaToolDisableDuration,
      cause: "Tesla lightning",
      lightning: true,
      targetStructureId: target && target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target && target.target && !target.target.local && target.target.remote ? target.target.remote.playerId : ""
    });

    tesla.shootCooldown = randomRange(2.3, 3.8);
    tesla.lightningFlash = 0.32;
    tesla.lightningWarmup = 0;
    tesla.lightningAngle = Math.atan2(aim.y, aim.x);
    tesla.rotation = tesla.lightningAngle + Math.PI / 2;

    sparks.push({
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      radius: 42,
      color,
      life: 0.24,
      maxLife: 0.24
    });
    playSound("lightning");
  }

  function fireRocketMissile(rocket, target) {
    const targetEntity = target && target.kind === "structure" ? target : (target && target.player ? target.player : target && target.target && target.target.player ? target.target.player : player);
    const targetX = Number.isFinite(rocket.lockX) ? rocket.lockX : targetEntity.x;
    const targetY = Number.isFinite(rocket.lockY) ? rocket.lockY : targetEntity.y;
    const aim = normalize(targetX - rocket.x, targetY - rocket.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const side = rocket.volleyShots % 2 === 0 ? 1 : -1;
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 18;

    rivalProjectiles.push({
      x: rocket.x + aim.x * muzzleDistance + normalX * side * 17,
      y: rocket.y + aim.y * muzzleDistance + normalY * side * 17,
      vx: aim.x * satelliteMissileSpeed + rocket.vx * 0.12,
      vy: aim.y * satelliteMissileSpeed + rocket.vy * 0.12,
      radius: 10,
      length: randomRange(42, 54),
      color,
      life: 2.4,
      maxLife: 2.4,
      damage: satelliteMissileDamage,
      toolDisable: 0,
      cause: "Satellite missile",
      rocket: true,
      targetStructureId: target && target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target && target.target && !target.target.local && target.target.remote ? target.target.remote.playerId : ""
    });

    rocket.blastTimer = 0.18;
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;

    sparks.push({
      x: rocket.x + aim.x * muzzleDistance,
      y: rocket.y + aim.y * muzzleDistance,
      radius: 34,
      color,
      life: 0.2,
      maxLife: 0.2
    });
    playSound("missile");
  }

  function fireFighterGuns(fighter, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / rivalProjectileSpeed, 0, 1.15);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.62;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.62;
    const aim = normalize(targetX - fighter.x, targetY - fighter.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const color = shadeColor(fighter.color, 46);

    for (const side of [-1, 1]) {
      rivalProjectiles.push({
        x: fighter.x + aim.x * (fighter.radius + 16) + normalX * side * 19,
        y: fighter.y + aim.y * (fighter.radius + 16) + normalY * side * 19,
        vx: aim.x * (rivalProjectileSpeed + 60) + fighter.vx * 0.14,
        vy: aim.y * (rivalProjectileSpeed + 60) + fighter.vy * 0.14,
        radius: 5,
        length: randomRange(38, 50),
        color,
        life: 2.0,
        maxLife: 2.0,
        damage: 9,
        toolDisable: 0,
        cause: "Fighter cannon",
        targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : ""
      });
    }

    fighter.shootCooldown = randomRange(2.2, 3.4);
    fighter.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
    playSound("fighter");
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
    const blockRadius = (body.tier && body.tier.name === "planet" ? solidBodyContactRadius(body) : body.radius) + padding;

    if (dx * dx + dy * dy > blockRadius * blockRadius) {
      return null;
    }

    return {
      x: closestX,
      y: closestY,
      t
    };
  }

  function segmentCircleIntersection(cx, cy, radius, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const fx = ax - cx;
    const fy = ay - cy;
    const a = dx * dx + dy * dy;

    if (a <= 0.000001) {
      return fx * fx + fy * fy <= radius * radius ? { x: ax, y: ay, t: 0 } : null;
    }

    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null;
    }

    const root = Math.sqrt(discriminant);
    const t1 = (-b - root) / (2 * a);
    const t2 = (-b + root) / (2 * a);
    let t = Number.POSITIVE_INFINITY;

    if (t1 >= 0 && t1 <= 1) {
      t = t1;
    }
    if (t2 >= 0 && t2 <= 1 && t2 < t) {
      t = t2;
    }
    if (!Number.isFinite(t) && c <= 0) {
      t = 0;
    }
    if (!Number.isFinite(t)) {
      return null;
    }

    return {
      x: ax + dx * t,
      y: ay + dy * t,
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

  function shieldGeneratorRadius(body) {
    if (!body) {
      return 0;
    }

    return body.radius + shieldGeneratorFieldPadding + Math.min(240, body.radius * 0.18);
  }

  function projectileShieldCost(projectile) {
    if (projectile && projectile.rocket) {
      return shieldGeneratorRocketCost;
    }
    if (projectile && projectile.lightning) {
      return shieldGeneratorLightningCost;
    }
    return shieldGeneratorProjectileCost;
  }

  function powerOutShieldGenerator(structure, color) {
    if (!structure || structure.health <= 0) {
      return;
    }

    structure.disabledTimer = Math.max(structure.disabledTimer || 0, shieldGeneratorPowerOutDuration);
    structure.burstTimer = 0;
    structure.flash = Math.max(structure.flash || 0, 0.26);
    sparks.push({
      x: structure.x,
      y: structure.y,
      radius: structureHitRadius(structure) * 1.45,
      color: color || { r: 119, g: 167, b: 255 },
      life: 0.24,
      maxLife: 0.24
    });
    playSound("lightning", { throttleKey: "shieldPowerOut" });
  }

  function activateShieldGeneratorBlock(structure, body, cost, hitX, hitY, color, radiusScale) {
    if (!structure || !body || structure.health <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    if (!spendBodyEnergy(body, cost)) {
      powerOutShieldGenerator(structure, color);
      return false;
    }

    structure.deploy = 1;
    structure.burstTimer = shieldGeneratorActiveDuration;
    structure.flash = Math.max(structure.flash || 0, 0.16);
    sparks.push({
      x: Number.isFinite(hitX) ? hitX : structure.x,
      y: Number.isFinite(hitY) ? hitY : structure.y,
      radius: shieldGeneratorRadius(body) * (radiusScale || 0.16),
      color: color || { r: 119, g: 167, b: 255 },
      life: 0.24,
      maxLife: 0.24
    });
    playSound("shield", { throttleKey: "shieldGenerator" });
    if (finiteOr(body.energy, 0) <= 0.05) {
      powerOutShieldGenerator(structure, color);
    }
    return true;
  }

  function findProjectileShieldBlocker(ax, ay, bx, by, padding, projectile) {
    let nearest = null;
    const cost = projectileShieldCost(projectile);

    for (const structure of structures) {
      if (structure.type !== "shield-generator" || structure.health <= 0 || isStructureDisabled(structure)) {
        continue;
      }

      const body = bodyById(structure.bodyId);
      if (!isStructureHostBody(body)) {
        continue;
      }

      const radius = shieldGeneratorRadius(body) + padding;
      const hit = segmentCircleIntersection(body.x, body.y, radius, ax, ay, bx, by);
      if (!hit || (nearest && hit.t >= nearest.t)) {
        continue;
      }

      nearest = {
        structure,
        body,
        cost,
        x: hit.x,
        y: hit.y,
        t: hit.t
      };
    }

    return nearest;
  }

  function tickMobShieldImpactCooldowns(mob, dt) {
    if (!mob.shieldImpactCooldowns) {
      return;
    }

    for (const structureId of Object.keys(mob.shieldImpactCooldowns)) {
      const remaining = finiteOr(mob.shieldImpactCooldowns[structureId], 0) - dt;
      if (remaining > 0) {
        mob.shieldImpactCooldowns[structureId] = remaining;
      } else {
        delete mob.shieldImpactCooldowns[structureId];
      }
    }
  }

  function shieldImpactCooldownFor(mob, structure) {
    return mob.shieldImpactCooldowns ? finiteOr(mob.shieldImpactCooldowns[structure.id], 0) : 0;
  }

  function markShieldImpact(mob, structure) {
    if (!mob.shieldImpactCooldowns) {
      mob.shieldImpactCooldowns = {};
    }
    mob.shieldImpactCooldowns[structure.id] = shieldGeneratorMobCooldown;
  }

  function resolveShieldGeneratorMobCollisions(dt) {
    for (const mob of allCombatMobs()) {
      tickMobShieldImpactCooldowns(mob, dt);
      if (mob.health <= 0) {
        continue;
      }

      for (const structure of structures) {
        if (structure.type !== "shield-generator" || structure.health <= 0 || isStructureDisabled(structure)) {
          continue;
        }

        const body = bodyById(structure.bodyId);
        if (!isStructureHostBody(body)) {
          continue;
        }

        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const shieldRadius = shieldGeneratorRadius(body);
        const hitDistance = shieldRadius + mob.radius;
        if (dist >= hitDistance) {
          continue;
        }

        const cooldown = shieldImpactCooldownFor(mob, structure);
        const nx = rawDist ? dx / dist : Math.cos(structure.angle);
        const ny = rawDist ? dy / dist : Math.sin(structure.angle);
        const speed = Math.hypot(mob.vx, mob.vy);
        const cost = shieldGeneratorMobCost * clamp(0.65 + speed / 520, 0.65, 1.8);

        if (cooldown <= 0) {
          if (!activateShieldGeneratorBlock(structure, body, cost, body.x + nx * shieldRadius, body.y + ny * shieldRadius, { r: 119, g: 167, b: 255 }, 0.2)) {
            continue;
          }
          markShieldImpact(mob, structure);
        }

        if (mob.landed) {
          mob.landed = null;
          mob.residentTier = null;
        }

        const overlap = hitDistance - dist;
        mob.x += nx * overlap;
        mob.y += ny * overlap;

        const relVx = mob.vx - body.vx;
        const relVy = mob.vy - body.vy;
        const incoming = relVx * nx + relVy * ny;
        if (incoming < 0) {
          mob.vx -= incoming * 1.72 * nx;
          mob.vy -= incoming * 1.72 * ny;
        }

        const outwardSpeed = (mob.vx - body.vx) * nx + (mob.vy - body.vy) * ny;
        if (outwardSpeed < shieldGeneratorMobMinBounceSpeed) {
          const boost = shieldGeneratorMobMinBounceSpeed - outwardSpeed;
          mob.vx += nx * boost;
          mob.vy += ny * boost;
        }

        body.vx -= nx * clamp((speed + shieldGeneratorMobMinBounceSpeed) / Math.max(80, body.mass), 0.4, 10);
        body.vy -= ny * clamp((speed + shieldGeneratorMobMinBounceSpeed) / Math.max(80, body.mass), 0.4, 10);
        knockMob(mob, nx, ny, 70 + speed * 0.14);
        break;
      }
    }
  }

  function hasClearShotAtCombatTarget(rival, target) {
    const ignoredBodyId = rival.landed ? rival.landed.bodyId : null;
    const targetPlayer = target && target.player ? target.player : player;
    return !findBlockingLandableBody(
      rival.x,
      rival.y,
      targetPlayer.x,
      targetPlayer.y,
      (targetPlayer.radius || player.radius) * 0.18,
      ignoredBodyId
    );
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

    playSound("turret");
    turret.shootCooldown = turretShootCooldown;
  }

  function launcherCanSeeMob(structure, mob) {
    const normalX = Math.cos(structure.angle);
    const normalY = Math.sin(structure.angle);
    const aboveSurface = (mob.x - structure.x) * normalX + (mob.y - structure.y) * normalY;
    return aboveSurface > -mob.radius * 0.25;
  }

  function findMobCluster(originX, originY, maxRange, options) {
    const settings = options || {};
    const sourceStructure = settings.structure || null;
    const preferredX = Number.isFinite(settings.preferredX) ? settings.preferredX : Number.NaN;
    const preferredY = Number.isFinite(settings.preferredY) ? settings.preferredY : Number.NaN;
    const minCount = Math.max(1, Math.floor(finiteOr(settings.minCount, missileLauncherMinClusterSize)));
    const clusterRadius = Math.max(40, finiteOr(settings.clusterRadius, missileLauncherClusterRadius));
    const mobs = allCombatMobs().filter((mob) => {
      if (!mob || mob.health <= 0) {
        return false;
      }
      if (sourceStructure && !launcherCanSeeMob(sourceStructure, mob)) {
        return false;
      }
      return Math.hypot(mob.x - originX, mob.y - originY) <= maxRange + clusterRadius;
    });
    let best = null;
    let bestScore = -Infinity;

    for (const anchor of mobs) {
      const members = [];
      for (const mob of mobs) {
        if (Math.hypot(mob.x - anchor.x, mob.y - anchor.y) <= clusterRadius) {
          members.push(mob);
        }
      }
      if (members.length < minCount) {
        continue;
      }

      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      let healthWeight = 0;
      for (const mob of members) {
        const weight = clamp(finiteOr(mob.health, 1) / Math.max(1, finiteOr(mob.maxHealth, mob.health || 1)), 0.35, 1.25);
        x += mob.x * weight;
        y += mob.y * weight;
        vx += finiteOr(mob.vx, 0) * weight;
        vy += finiteOr(mob.vy, 0) * weight;
        healthWeight += weight;
      }
      x /= Math.max(0.001, healthWeight);
      y /= Math.max(0.001, healthWeight);
      vx /= Math.max(0.001, healthWeight);
      vy /= Math.max(0.001, healthWeight);

      const distance = Math.hypot(x - originX, y - originY);
      if (distance > maxRange + clusterRadius * 0.35) {
        continue;
      }
      if (sourceStructure && !hasClearShotAtMob(sourceStructure.x, sourceStructure.y, { x, y, radius: 22 }, sourceStructure.bodyId)) {
        continue;
      }

      let spread = 0;
      for (const mob of members) {
        spread += Math.hypot(mob.x - x, mob.y - y);
      }
      spread /= members.length;

      const preferredDistance = Number.isFinite(preferredX) && Number.isFinite(preferredY)
        ? Math.hypot(x - preferredX, y - preferredY)
        : 0;
      const score = members.length * 1000 - spread * 1.35 - distance * 0.18 - preferredDistance * 0.48;
      if (score > bestScore) {
        bestScore = score;
        best = {
          x,
          y,
          vx,
          vy,
          count: members.length,
          radius: clusterRadius,
          members
        };
      }
    }

    return best;
  }

  function fireLauncherMissile(structure, cluster) {
    const leadTime = clamp(Math.hypot(cluster.x - structure.x, cluster.y - structure.y) / launcherMissileSpeed, 0, 1.2);
    const targetX = cluster.x + finiteOr(cluster.vx, 0) * leadTime * 0.36;
    const targetY = cluster.y + finiteOr(cluster.vy, 0) * leadTime * 0.36;
    const aim = normalize(targetX - structure.x, targetY - structure.y);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = 48;

    launcherMissiles.push({
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      vx: aim.x * launcherMissileSpeed,
      vy: aim.y * launcherMissileSpeed,
      radius: 11,
      length: 58,
      color,
      life: launcherMissileLife,
      maxLife: launcherMissileLife,
      damage: launcherMissileDamage,
      rocket: true,
      targetX,
      targetY,
      targetCount: cluster.count,
      ignoredBodyId: structure.bodyId
    });

    structure.missileCharge = 0;
    structure.lockTimer = 0;
    structure.beepTimer = 0;
    structure.targetX = targetX;
    structure.targetY = targetY;
    structure.targetCount = cluster.count;
    structure.deploy = 1;
    structure.aimAngle = Math.atan2(aim.y, aim.x);

    sparks.push({
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      radius: 42,
      color,
      life: 0.24,
      maxLife: 0.24
    });
    playSound("missile");
  }

  function updateMissileLauncher(structure, dt) {
    const body = bodyById(structure.bodyId);
    structure.missileCharge = clamp(finiteOr(structure.missileCharge, 0) + dt / missileLauncherProductionTime, 0, 1);
    structure.lockTimer = Math.max(0, finiteOr(structure.lockTimer, 0) - dt);
    structure.beepTimer = Math.max(0, finiteOr(structure.beepTimer, 0) - dt);

    const ready = structure.missileCharge >= 1;
    if (!ready) {
      structure.targetCount = 0;
      structure.deploy = clamp((structure.deploy || 0) + dt * 1.2, 0, 0.58 + structure.missileCharge * 0.28);
      structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, structure.angle), -1.7 * dt, 1.7 * dt);
      return;
    }

    const cluster = findMobCluster(structure.x, structure.y, missileLauncherRange, { structure });
    if (!cluster) {
      structure.targetCount = 0;
      structure.lockTimer = 0;
      structure.deploy = clamp((structure.deploy || 0) + dt * 1.6, 0, 0.9);
      structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, structure.angle), -1.9 * dt, 1.9 * dt);
      return;
    }

    structure.targetX = cluster.x;
    structure.targetY = cluster.y;
    structure.targetCount = cluster.count;
    const targetAngle = Math.atan2(cluster.y - structure.y, cluster.x - structure.x);
    structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, targetAngle), -3.4 * dt, 3.4 * dt);
    structure.deploy = clamp((structure.deploy || 0) + dt * 3.4, 0, 1);

    if (structure.lockTimer <= 0) {
      structure.lockTimer = missileLauncherLockDuration;
      structure.beepTimer = 0;
      playSound("lock", { throttleKey: "launcherLock:" + structure.id, throttle: 0.08 });
      return;
    }

    if (structure.beepTimer <= 0) {
      structure.beepTimer = 0.2;
      playSound("lock", { throttleKey: "launcherBeep:" + structure.id, throttle: 0.08, volume: 0.82 });
    }

    if (structure.lockTimer <= dt * 1.05 && canSpendBodyEnergy(body, missileLauncherEnergyCost)) {
      spendBodyEnergy(body, missileLauncherEnergyCost);
      fireLauncherMissile(structure, cluster);
    }
  }

  function explodeLauncherMissile(missile, x, y) {
    const color = missile.color || { r: 255, g: 184, b: 88 };
    let hits = 0;

    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0) {
        continue;
      }
      const dist = Math.hypot(mob.x - x, mob.y - y);
      const edgeDistance = Math.max(0, dist - mob.radius * 0.45);
      if (edgeDistance > launcherMissileAoERadius) {
        continue;
      }

      const falloff = 1 - edgeDistance / launcherMissileAoERadius;
      const nx = dist > 0 ? (mob.x - x) / dist : randomRange(-1, 1);
      const ny = dist > 0 ? (mob.y - y) / dist : randomRange(-1, 1);
      knockMob(mob, nx, ny, launcherMissileKnockback * (0.32 + falloff * 0.68));
      damageMob(mob, launcherMissileDamage * (0.42 + falloff * 0.58), color, mobName(mob) + " caught in a missile blast.");
      hits += 1;
    }

    sparks.push({
      x,
      y,
      radius: launcherMissileAoERadius * 0.68,
      color,
      life: 0.38,
      maxLife: 0.38
    });
    sparks.push({
      x,
      y,
      radius: launcherMissileAoERadius * 1.08,
      color: { r: 255, g: 115, b: 173 },
      life: 0.28,
      maxLife: 0.28
    });
    playSound(hits > 0 ? "mobDestroyed" : "hit", { throttleKey: "launcherExplosion" });
  }

  function updateLauncherMissiles(dt) {
    for (let i = launcherMissiles.length - 1; i >= 0; i -= 1) {
      const missile = launcherMissiles[i];
      const previousX = missile.x;
      const previousY = missile.y;
      missile.life = Math.max(0, finiteOr(missile.life, launcherMissileLife) - dt);

      const cluster = findMobCluster(missile.x, missile.y, 760, {
        minCount: 1,
        clusterRadius: missileLauncherClusterRadius,
        preferredX: missile.targetX,
        preferredY: missile.targetY
      });
      if (cluster) {
        const leadTime = clamp(Math.hypot(cluster.x - missile.x, cluster.y - missile.y) / launcherMissileSpeed, 0, 0.8);
        missile.targetX = cluster.x + finiteOr(cluster.vx, 0) * leadTime * 0.4;
        missile.targetY = cluster.y + finiteOr(cluster.vy, 0) * leadTime * 0.4;
        missile.targetCount = cluster.count;
      }

      const desiredAngle = Math.atan2(missile.targetY - missile.y, missile.targetX - missile.x);
      const speed = Math.max(launcherMissileSpeed * 0.45, Math.hypot(missile.vx, missile.vy) || launcherMissileSpeed);
      const currentAngle = Math.atan2(missile.vy, missile.vx);
      const angle = currentAngle + clamp(shortestAngleDelta(currentAngle, desiredAngle), -launcherMissileTurnRate * dt, launcherMissileTurnRate * dt);
      const targetSpeed = launcherMissileSpeed * (missile.life > launcherMissileLife - 0.24 ? 0.74 : 1);
      const nextSpeed = speed + (targetSpeed - speed) * (1 - Math.pow(0.05, dt));
      missile.vx = Math.cos(angle) * nextSpeed;
      missile.vy = Math.sin(angle) * nextSpeed;
      missile.x += missile.vx * dt;
      missile.y += missile.vy * dt;

      const travel = Math.hypot(missile.x - previousX, missile.y - previousY);
      const sweptLength = Math.max(missile.radius, travel + missile.radius);
      const dir = normalize(missile.vx, missile.vy);
      const tailX = missile.x - dir.x * sweptLength;
      const tailY = missile.y - dir.y * sweptLength;
      let shouldExplode = Math.hypot(missile.x - missile.targetX, missile.y - missile.targetY) < 34;

      for (const mob of allCombatMobs()) {
        if (!mob || mob.health <= 0) {
          continue;
        }
        const dist = distanceToSegment(mob.x, mob.y, tailX, tailY, missile.x, missile.y);
        if (dist < mob.radius + missile.radius) {
          shouldExplode = true;
          break;
        }
      }

      const blocker = findBlockingLandableBody(tailX, tailY, missile.x, missile.y, missile.radius * 0.85, missile.ignoredBodyId);
      if (blocker) {
        missile.x = blocker.x;
        missile.y = blocker.y;
        shouldExplode = true;
      }

      if (shouldExplode || missile.life <= 0) {
        explodeLauncherMissile(missile, missile.x, missile.y);
        launcherMissiles.splice(i, 1);
      } else if (Math.random() < dt * 16) {
        sparks.push({
          x: missile.x - dir.x * randomRange(8, 22),
          y: missile.y - dir.y * randomRange(8, 22),
          radius: randomRange(10, 22),
          color: missile.color,
          life: 0.14,
          maxLife: 0.14
        });
      }
    }
  }

  function damageStructure(structure, damage, color) {
    if (!structure || structure.health <= 0) {
      return false;
    }

    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    structure.maxHealth = maxHealth;
    structure.health = clamp(finiteOr(structure.health, maxHealth) - Math.max(0, damage), 0, maxHealth);
    structure.flash = 0.34;
    structure.disabledTimer = Math.max(structure.disabledTimer || 0, structure.health <= 0 ? 1.2 : 0);
    sparks.push({
      x: structure.x,
      y: structure.y,
      radius: structureHitRadius(structure) * 1.35,
      color: color || { r: 255, g: 184, b: 88 },
      life: 0.28,
      maxLife: 0.28
    });
    playSound("mobHit", { throttleKey: "structureDamage" });
    return structure.health <= 0;
  }

  function disableStructure(structure, duration, color) {
    if (!structure || structure.health <= 0) {
      return;
    }

    structure.disabledTimer = Math.max(structure.disabledTimer || 0, duration);
    structure.flash = Math.max(structure.flash || 0, 0.22);
    sparks.push({
      x: structure.x,
      y: structure.y,
      radius: structureHitRadius(structure) * 1.55,
      color: color || { r: 157, g: 255, b: 122 },
      life: 0.26,
      maxLife: 0.26
    });
    playSound("lightning", { throttleKey: "structureDisable" });
  }

  function repairStructure(structure, amount) {
    if (!structure) {
      return false;
    }

    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const current = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    if (current >= maxHealth) {
      return false;
    }

    structure.maxHealth = maxHealth;
    structure.health = Math.min(maxHealth, current + Math.max(0, amount));
    structure.flash = Math.max(structure.flash || 0, 0.12);
    if (structure.health > 0) {
      structure.disabledTimer = Math.min(structure.disabledTimer || 0, 0.4);
    }
    return true;
  }

  function nearestStructureTarget(x, y, maxRange, predicate) {
    let best = null;
    let bestDistance = Infinity;

    for (const structure of structures) {
      if (predicate && !predicate(structure)) {
        continue;
      }

      const distance = Math.hypot(structure.x - x, structure.y - y);
      if (distance > maxRange + structureHitRadius(structure) || distance >= bestDistance) {
        continue;
      }

      best = structure;
      bestDistance = distance;
    }

    return best;
  }

  function hasClearShotAtStructure(x, y, structure, ignoredBodyId) {
    return !findBlockingLandableBody(x, y, structure.x, structure.y, structureHitRadius(structure) * 0.14, ignoredBodyId);
  }

  function canAccumulatorPullParticle(particle) {
    return particle && particle.tier && particle.tier.name === "particle";
  }

  function updateAccumulator(structure, dt) {
    const body = bodyById(structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }

    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    structure.burstCooldown = Math.max(0, finiteOr(structure.burstCooldown, accumulatorBurstInterval) - dt);

    if (structure.burstTimer <= 0 && structure.burstCooldown <= 0) {
      if (spendBodyEnergy(body, accumulatorBurstCost)) {
        structure.burstTimer = accumulatorBurstDuration;
        structure.burstCooldown = accumulatorBurstInterval;
        sparks.push({
          x: structure.x,
          y: structure.y,
          radius: 62,
          color: { r: 88, g: 226, b: 255 },
          life: 0.24,
          maxLife: 0.24
        });
      } else {
        structure.burstCooldown = 0.6;
      }
    }

    let strongestPull = 0;
    const range = accumulatorRange + Math.min(260, body.radius * 0.9);
    const burstProgress = clamp(structure.burstTimer / accumulatorBurstDuration, 0, 1);
    const wave = Math.sin((1 - burstProgress) * Math.PI);

    if (structure.burstTimer > 0) {
      for (const particle of particles) {
        if (particle.id === body.id || !canAccumulatorPullParticle(particle) || !canAbsorbBody(body, particle)) {
          continue;
        }

        const toBodyX = body.x - particle.x;
        const toBodyY = body.y - particle.y;
        const dist = Math.hypot(toBodyX, toBodyY) || 1;
        if (dist > range + particle.radius) {
          continue;
        }

        const rawPull = clamp(1 - Math.max(0, dist - body.radius) / range, 0.02, 1);
        const pull = Math.pow(rawPull, 1.32) * (0.55 + wave * 0.9);
        const deployPull = 0.34 + clamp(structure.deploy || 0, 0, 1) * 0.66;
        const massResistance = clamp(1 / Math.pow(Math.max(1, particle.mass), 0.18), 0.26, 1);
        const force = accumulatorForce * 2.15 * pull * deployPull * massResistance;

        particle.vx += (toBodyX / dist) * force * dt;
        particle.vy += (toBodyY / dist) * force * dt;
        strongestPull = Math.max(strongestPull, pull);
      }
    }

    const targetDeploy = strongestPull > 0 ? 0.36 + strongestPull * 0.64 : 0;
    structure.deploy += (targetDeploy - (structure.deploy || 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);

    if (structure.burstTimer > 0 && Math.random() < dt * (1.2 + strongestPull * 3.2)) {
      sparks.push({
        x: structure.x + randomRange(-12, 12),
        y: structure.y + randomRange(-12, 12),
        radius: 24 + strongestPull * 34,
        color: { r: 88, g: 226, b: 255 },
        life: 0.18,
        maxLife: 0.18
      });
    }
  }

  function updateShieldGenerator(structure, dt) {
    const body = bodyById(structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }

    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    const hasPower = canSpendBodyEnergy(body, shieldGeneratorProjectileCost);
    const targetDeploy = hasPower ? 0.72 : 0.16;
    structure.deploy += (targetDeploy - (structure.deploy || 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);

    if (hasPower && structure.burstTimer > 0 && Math.random() < dt * 4.2) {
      const radius = shieldGeneratorRadius(body);
      const angle = randomRange(0, Math.PI * 2);
      sparks.push({
        x: body.x + Math.cos(angle) * radius,
        y: body.y + Math.sin(angle) * radius,
        radius: 28,
        color: { r: 119, g: 167, b: 255 },
        life: 0.18,
        maxLife: 0.18
      });
    }
  }

  function tetherGiveForBodies(firstBody, secondBody) {
    const averageRadius = (Math.max(1, finiteOr(firstBody && firstBody.radius, 1)) + Math.max(1, finiteOr(secondBody && secondBody.radius, 1))) * 0.5;
    return clamp(averageRadius * tetherGiveRadiusScale, tetherMinGive, tetherMaxGive);
  }

  function updateTether(structure, dt) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return;
    }

    const dx = structure.x2 - structure.x;
    const dy = structure.y2 - structure.y;
    const currentLength = Math.hypot(dx, dy) || 1;
    const nx = dx / currentLength;
    const ny = dy / currentLength;
    const restLength = Math.max(80, finiteOr(structure.restLength, currentLength));
    const stretch = currentLength - restLength;
    const give = tetherGiveForBodies(firstBody, secondBody);
    const giveError = Math.abs(stretch) > give ? stretch - Math.sign(stretch) * give : 0;
    const relativeVelocity = (secondBody.vx - firstBody.vx) * nx + (secondBody.vy - firstBody.vy) * ny;
    const totalMass = Math.max(1, firstBody.mass + secondBody.mass);
    const firstShare = clamp(secondBody.mass / totalMass, 0.1, 0.9);
    const secondShare = clamp(firstBody.mass / totalMass, 0.1, 0.9);

    structure.deploy = clamp((structure.deploy || 0) + dt * 2.2, 0, 1);

    if (!giveError) {
      return;
    }

    const acceleration = clamp(giveError * tetherSpring + relativeVelocity * tetherDamping, -tetherMaxAcceleration, tetherMaxAcceleration);
    firstBody.vx += nx * acceleration * firstShare * dt;
    firstBody.vy += ny * acceleration * firstShare * dt;
    secondBody.vx -= nx * acceleration * secondShare * dt;
    secondBody.vy -= ny * acceleration * secondShare * dt;

    const correction = clamp(giveError * 0.015, -2.6, 2.6);
    firstBody.x += nx * correction * firstShare;
    firstBody.y += ny * correction * firstShare;
    secondBody.x -= nx * correction * secondShare;
    secondBody.y -= ny * correction * secondShare;

    if (Math.random() < dt * clamp(Math.abs(giveError) / 140, 0.08, 0.9)) {
      sparks.push({
        x: (structure.x + structure.x2) / 2 + randomRange(-8, 8),
        y: (structure.y + structure.y2) / 2 + randomRange(-8, 8),
        radius: 18 + clamp(Math.abs(giveError) * 0.12, 0, 22),
        color: { r: 169, g: 133, b: 255 },
        life: 0.16,
        maxLife: 0.16
      });
    }
  }

  function updateJet(structure, dt) {
    const body = bodyById(structure.bodyId);
    const landedHere = player.landed && body && player.landed.bodyId === body.id;
    const forward = landedHere && isMovementKeyPressed("up");
    const reverse = landedHere && isMovementKeyPressed("down");
    const direction = forward === reverse ? 0 : (forward ? -1 : 1);

    structure.deploy = clamp((structure.deploy || 0) + dt * 3.6, 0, 1);

    if (!body || !isStructureHostBody(body) || !direction || buildMenuOpen) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      return;
    }

    const energyCost = jetEnergyDrain * dt;
    if (!spendBodyEnergy(body, energyCost)) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      notifyEnergyDepleted();
      return;
    }

    const nx = Math.cos(structure.angle);
    const ny = Math.sin(structure.angle);
    const massDamping = clamp(1 / Math.pow(Math.max(1, body.mass / 150), 0.42), 0.08, 1.1);
    const thrust = jetThrust * massDamping * clamp(structure.deploy || 0, 0.2, 1);

    body.vx += nx * direction * thrust * dt;
    body.vy += ny * direction * thrust * dt;

    const maxSpeed = 150 + massDamping * 210;
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }

    structure.thrustAmount += (1 - finiteOr(structure.thrustAmount, 0)) * (1 - Math.pow(0.02, dt));
    structure.thrustDirection = direction;

    if (Math.random() < dt * 2.8) {
      sparks.push({
        x: structure.x - nx * direction * 28 + randomRange(-8, 8),
        y: structure.y - ny * direction * 28 + randomRange(-8, 8),
        radius: 18 + randomRange(0, 18),
        color: { r: 169, g: 133, b: 255 },
        life: 0.14,
        maxLife: 0.14
      });
    }
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

      const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
      structure.maxHealth = maxHealth;
      structure.health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
      structure.disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0) - dt);
      structure.flash = Math.max(0, finiteOr(structure.flash, 0) - dt);

      if (structure.health <= 0 || isStructureDisabled(structure)) {
        structure.deploy = clamp((structure.deploy || 0) - dt * 2.1, 0, 1);
        structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
        continue;
      }

      if (structure.type === "plating-block") {
        structure.deploy = clamp((structure.deploy || 0) + dt * 4.2, 0, 1);
        continue;
      }

      if (structure.type === "battery") {
        structure.deploy = clamp((structure.deploy || 0) + dt * 3.4, 0, 1);
        if (Math.random() < dt * 0.7) {
          sparks.push({
            x: structure.x + randomRange(-10, 10),
            y: structure.y + randomRange(-10, 10),
            radius: 16,
            color: { r: 157, g: 255, b: 122 },
            life: 0.16,
            maxLife: 0.16
          });
        }
        continue;
      }

      if (structure.type === "accumulator") {
        updateAccumulator(structure, dt);
        continue;
      }

      if (structure.type === "shield-generator") {
        updateShieldGenerator(structure, dt);
        continue;
      }

      if (structure.type === "missile-launcher") {
        updateMissileLauncher(structure, dt);
        continue;
      }

      if (structure.type === "communication-relay") {
        structure.deploy = clamp((structure.deploy || 0) + dt * 2.4, 0, 1);
        if (Math.random() < dt * 0.65) {
          sparks.push({
            x: structure.x + randomRange(-10, 10),
            y: structure.y + randomRange(-34, 4),
            radius: 18,
            color: { r: 255, g: 184, b: 107 },
            life: 0.18,
            maxLife: 0.18
          });
        }
        continue;
      }

      if (structure.type === "jet") {
        updateJet(structure, dt);
        continue;
      }

      if (structure.type === "tether") {
        updateTether(structure, dt);
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
        const hostBody = bodyById(structure.bodyId);
        if (structure.deploy > 0.72 && structure.shootCooldown <= 0 && spendBodyEnergy(hostBody, turretEnergyCost)) {
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
      const previousX = projectile.x;
      const previousY = projectile.y;
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const dirX = projectile.vx / speed;
      const dirY = projectile.vy / speed;
      const travel = Math.hypot(projectile.x - previousX, projectile.y - previousY);
      const sweptLength = Math.max(projectile.length, travel + projectile.radius);
      const tailX = projectile.x - dirX * sweptLength;
      const tailY = projectile.y - dirY * sweptLength;
      const hitRadius = projectile.radius * (projectile.rocket ? 1.65 : 1);

      const shieldBlocker = findProjectileShieldBlocker(tailX, tailY, projectile.x, projectile.y, hitRadius, projectile);
      if (shieldBlocker && activateShieldGeneratorBlock(shieldBlocker.structure, shieldBlocker.body, shieldBlocker.cost, shieldBlocker.x, shieldBlocker.y, projectile.color, projectile.rocket ? 0.24 : 0.16)) {
        rivalProjectiles.splice(i, 1);
        continue;
      }

      let hitStructure = false;
      if (projectile.rocket || projectile.lightning) {
        for (const structure of structures) {
          if (structure.health <= 0) {
            continue;
          }

          const structureDist = distanceToSegment(structure.x, structure.y, tailX, tailY, projectile.x, projectile.y);
          if (structureDist >= structureHitRadius(structure) + hitRadius * 0.72) {
            continue;
          }

          if (projectile.lightning) {
            disableStructure(structure, structureTeslaDisableDuration, projectile.color);
          } else {
            damageStructure(structure, structureRocketDamage, projectile.color);
          }
          rivalProjectiles.splice(i, 1);
          hitStructure = true;
          break;
        }
      }

      if (hitStructure) {
        continue;
      }

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
        playSound("mobHit", { throttleKey: "projectileImpact" });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      const dist = distanceToSegment(player.x, player.y, tailX, tailY, projectile.x, projectile.y);
      const playerHitScale = projectile.rocket ? 0.86 : 0.72;
      const hitDistance = player.radius * playerHitScale + hitRadius;
      const overlapsPlayer = dist < hitDistance;
      const canDamagePlayer = player.hitCooldown <= 0 || (projectile.rocket && player.hitCooldown <= 0.16);

      if (overlapsPlayer && canDamagePlayer) {
        const nx = dirX;
        const ny = dirY;
        const damage = Math.max(0, finiteOr(projectile.damage, rivalProjectileDamage));
        const toolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));
        if (player.landed) {
          detachFromBody(160);
        }
        player.vx += nx * 190 + projectile.vx * 0.34;
        player.vy += ny * 190 + projectile.vy * 0.34;
        damageLocalPlayer(damage, {
          cause: projectile.cause || "Alienoid laser",
          cooldown: projectile.rocket ? 0.54 : 0.7,
          flash: 0.28
        });
        if (toolDisable > 0) {
          jamLocalPlayerTools(toolDisable);
        }
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

      if (overlapsPlayer && projectile.rocket) {
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 38,
          color: projectile.color,
          life: 0.24,
          maxLife: 0.24
        });
        playSound("mobHit", { throttleKey: "rocketMissileGraze" });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      let hitRemotePlayer = false;
      for (const target of collectRemoteCombatPlayers()) {
        const remotePlayer = target.player;
        const remoteDist = distanceToSegment(remotePlayer.x, remotePlayer.y, tailX, tailY, projectile.x, projectile.y);
        const remoteHitDistance = (remotePlayer.radius || player.radius) * playerHitScale + hitRadius;

        if (remoteDist >= remoteHitDistance) {
          continue;
        }

        sendRemoteEntityEffect(target.remote, {
          entityType: "player",
          damage: Math.max(0, finiteOr(projectile.damage, rivalProjectileDamage)),
          impulseX: dirX * 190 + projectile.vx * 0.34,
          impulseY: dirY * 190 + projectile.vy * 0.34,
          color: projectile.color,
          toolDisable: Math.max(0, finiteOr(projectile.toolDisable, 0))
        });
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 44,
          color: projectile.color,
          life: 0.34,
          maxLife: 0.34
        });
        rivalProjectiles.splice(i, 1);
        hitRemotePlayer = true;
        break;
      }

      if (hitRemotePlayer) {
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
      if (!canUfoTractorAffectParticle(particle)) {
        continue;
      }

      const distance = Math.hypot(particle.x - ufo.x, particle.y - ufo.y);
      const surfaceDistance = Math.max(0, distance - Math.max(0, particle.radius || 0));
      let score = surfaceDistance;
      if (particle === playerBody) {
        score *= 0.18;
      } else if (particle.tier.solid) {
        score = surfaceDistance * 0.55 - particle.radius;
      } else if (particle.tier.name === "particle") {
        score += 80;
      }

      if (surfaceDistance < ufoTractorRange && score < bestScore) {
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
      if (!canUfoTractorAffectParticle(particle)) {
        continue;
      }

      const relX = particle.x - originX;
      const relY = particle.y - originY;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const bodyReach = particle.tier.solid ? Math.max(0, particle.radius || 0) : 0;
      const surfaceForward = clamp(forward - bodyReach, 0, ufoTractorRange);
      const beamHalf = ufoTractorWidth * (1 - clamp(surfaceForward / ufoTractorRange, 0, 1) * 0.55) + particle.radius * 0.45;

      if (forward < -bodyReach || forward - bodyReach > ufoTractorRange || Math.abs(side) > beamHalf) {
        continue;
      }

      const pullStrength = clamp(1 - surfaceForward / ufoTractorRange, 0.12, 1);
      const centerStrength = clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0, 1);
      const toOriginX = originX - particle.x;
      const toOriginY = originY - particle.y;

      if (shouldUfoSiphonBody(particle)) {
        drainBodyWithUfoTractor(ufo, particle, pullStrength, centerStrength, dt);
        continue;
      }

      const toOrigin = normalize(toOriginX, toOriginY);
      const cargoBoost = particle.ufoExtractedById === ufo.id ? 1.35 : 1;
      const solidDragScale = particle.tier.solid ? 0.62 : 1;
      const force = ufoTractorForce * pullStrength * (0.45 + centerStrength * 0.75) * cargoBoost * solidDragScale;

      particle.vx += (toOrigin.x * force - normalX * side * 7.5) * dt;
      particle.vy += (toOrigin.y * force - normalY * side * 7.5) * dt;

      if (Math.hypot(toOriginX, toOriginY) < ufo.radius + particle.radius * 1.05) {
        const speed = Math.hypot(particle.vx, particle.vy);
        if (isBoulderBody(particle)) {
          if (speed >= rivalBodyImpactSpeed && ufo.hitCooldown <= 0) {
            const damage = Math.min(90, 20 + Math.max(0, speed - rivalBodyImpactSpeed) * 0.18 + Math.sqrt(particle.mass) * 0.8);
            knockMob(ufo, toOrigin.x, toOrigin.y, 150 + speed * 0.34);
            damageMob(ufo, damage, particle.color, "UFO cracked by " + particle.tier.article + " " + particle.tier.name + ".", {
              notification: bodyDefeatNotificationOptions(ufo, particle, "cracked")
            });
          }
          particle.vx -= toOrigin.x * (210 + speed * 0.18);
          particle.vy -= toOrigin.y * (210 + speed * 0.18);
          continue;
        }

        if (!canUfoAbsorbParticle(particle)) {
          continue;
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
    updateBodyAfterMassChange(body, previousTier);
    body.textureSeed += drain * 0.013;
    emitUfoSapParticles(ufo, body, drain, pullStrength, centerStrength);
  }

  function updateBodyAfterMassChange(body, previousTier) {
    body.radius = radiusFromMass(body.mass);
    body.tier = tierForMass(body.mass);
    normalizeBodyEnergy(body);
    body.textureSeed += 0.09;

    if (body.tier !== previousTier) {
      for (const rival of rivals) {
        if (rival.landed && rival.landed.bodyId === body.id) {
          rival.residentTier = body.tier.name;
        }
      }
    }
  }

  function emitMassParticle(body, x, y, vx, vy, mass) {
    const particle = createParticle(x, y, Math.max(0.001, finiteOr(mass, 1)), ejectedParticleColor(body));
    particle.vx = vx;
    particle.vy = vy;
    particles.push(particle);
    return particle;
  }

  function emitUfoSapParticles(ufo, body, lostMass, pullStrength, centerStrength) {
    body.ufoSapParticleBuffer = Math.max(0, finiteOr(body.ufoSapParticleBuffer, 0)) + lostMass;

    if (body.ufoSapParticleBuffer <= 0) {
      return;
    }

    const originX = ufo.x + Math.cos(ufo.beamAngle) * 26;
    const originY = ufo.y + Math.sin(ufo.beamAngle) * 26;
    const toUfo = normalize(originX - body.x, originY - body.y);
    const tangentX = -toUfo.y;
    const tangentY = toUfo.x;
    const surfaceX = body.x + toUfo.x * Math.max(1, body.radius + 2);
    const surfaceY = body.y + toUfo.y * Math.max(1, body.radius + 2);
    const pullSpeed = 170 + pullStrength * 170 + centerStrength * 120;
    const particlesToEmit = Math.min(5, Math.max(1, Math.ceil(body.ufoSapParticleBuffer / 0.32)));
    let remainingMass = body.ufoSapParticleBuffer;

    for (let i = 0; i < particlesToEmit; i += 1) {
      const remainingParticles = particlesToEmit - i;
      const fragmentMass = remainingMass / remainingParticles;
      remainingMass -= fragmentMass;
      const side = randomRange(-body.radius * 0.1, body.radius * 0.1);
      const jitter = randomRange(-34, 34);
      const particle = emitMassParticle(
        body,
        surfaceX + tangentX * side,
        surfaceY + tangentY * side,
        body.vx + toUfo.x * randomRange(pullSpeed * 0.75, pullSpeed * 1.2) + tangentX * jitter,
        body.vy + toUfo.y * randomRange(pullSpeed * 0.75, pullSpeed * 1.2) + tangentY * jitter,
        fragmentMass
      );
      particle.ufoExtractedById = ufo.id;
      particle.ufoExtractedFromId = body.id;
      particle.ufoSapTimer = 3.25;
      particle.wobble = ufo.wobble + randomRange(-0.45, 0.45);
    }

    body.ufoSapParticleBuffer = Math.max(0, remainingMass);

    sparks.push({
      x: surfaceX,
      y: surfaceY,
      radius: Math.max(14, Math.min(42, body.radius * 0.16)),
      color: ufo.color,
      life: 0.18,
      maxLife: 0.18
    });
  }

  function burstBodyFragments(body, lostMass, originX, originY, dirX, dirY, color) {
    const pieces = Math.max(1, Math.min(28, Math.floor(lostMass)));
    const tangentX = -dirY;
    const tangentY = dirX;

    for (let i = 0; i < pieces; i += 1) {
      const side = randomRange(-body.radius * 0.11, body.radius * 0.11);
      const speed = randomRange(180, 370);
      const scatter = randomRange(-145, 145);
      emitMassParticle(
        body,
        originX + tangentX * side + dirX * randomRange(2, 12),
        originY + tangentY * side + dirY * randomRange(2, 12),
        body.vx + dirX * speed + tangentX * scatter,
        body.vy + dirY * speed + tangentY * scatter
      );
    }

    sparks.push({
      x: originX,
      y: originY,
      radius: Math.max(34, Math.min(110, body.radius * 0.32)),
      color: color || body.color,
      life: 0.34,
      maxLife: 0.34
    });
  }

  function shedBodyMass(body, amount, originX, originY, dirX, dirY, color) {
    if (!body || body.mass <= 1) {
      return 0;
    }

    const lostMass = Math.min(body.mass - 1, Math.max(0, Math.floor(amount)));
    if (lostMass <= 0) {
      return 0;
    }

    const previousTier = body.tier;
    body.mass -= lostMass;
    updateBodyAfterMassChange(body, previousTier);
    burstBodyFragments(body, lostMass, originX, originY, dirX, dirY, color || body.color);
    return lostMass;
  }

  function damageBodyWithRambot(rambot, body, nx, ny, impactSpeed) {
    const drain = Math.min(
      36,
      rambotBodyImpactDrain + Math.sqrt(Math.max(1, body.mass)) * 0.045 + Math.max(0, impactSpeed - rambotBodyImpactSpeed) * 0.025
    );
    const originX = body.x + nx * body.radius;
    const originY = body.y + ny * body.radius;
    const lost = shedBodyMass(body, drain, originX, originY, nx, ny, body.color);

    if (lost <= 0) {
      return;
    }

    rambot.impactCooldown = 0.95;
    rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.65);
    rambot.chargeTimer = 0;
    rambot.vx += nx * 250;
    rambot.vy += ny * 250;
    body.vx -= nx * clamp(lost / Math.max(1, body.mass), 0.015, 0.16) * 95;
    body.vy -= ny * clamp(lost / Math.max(1, body.mass), 0.015, 0.16) * 95;
    playSound("mobHit", { throttleKey: "rambotBodyImpact" });
  }

  function updateUfoUndersideImpact(ufo) {
    if (player.hitCooldown > 0 || deathState.active || player.health <= 0) {
      return;
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const relX = player.x - ufo.x;
    const relY = player.y - ufo.y;
    const forward = relX * dirX + relY * dirY;
    const side = relX * normalX + relY * normalY;
    const distance = Math.hypot(relX, relY);

    if (forward < 6 || forward > ufo.radius + player.radius * 0.85 || Math.abs(side) > 52 || distance > ufo.radius + player.radius * 0.72) {
      return;
    }

    if (player.landed) {
      detachFromBody(150);
    }

    player.vx += dirX * 210 + ufo.vx * 0.38;
    player.vy += dirY * 210 + ufo.vy * 0.38;
    damageLocalPlayer(ufoUndersideDamage, {
      cause: "UFO underside",
      cooldown: 0.85,
      flash: 0.3
    });

    sparks.push({
      x: player.x,
      y: player.y,
      radius: 48,
      color: ufo.color,
      life: 0.28,
      maxLife: 0.28
    });
  }

  function ufoAttackTarget(playerTarget) {
    if (playerTarget && playerTarget.local && player.landed) {
      const body = bodyById(player.landed.bodyId);
      if (isAsteroidOrLarger(body)) {
        return {
          kind: "body",
          body,
          x: body.x,
          y: body.y,
          radius: body.radius
        };
      }
    }

    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: targetPlayer.radius || player.radius
    };
  }

  function updateUfos(dt) {
    for (let i = ufos.length - 1; i >= 0; i -= 1) {
      const ufo = ufos[i];
      tickMobDamageTimers(ufo, dt);
      ufo.flash = Math.max(0, ufo.flash - dt);

      if (ufo.health <= 0) {
        ufos.splice(i, 1);
        continue;
      }

      const target = nearestCombatPlayerTarget(ufo.x, ufo.y);
      const targetPlayer = target.player;
      const attackTarget = ufoAttackTarget(target);
      const toPlayerX = targetPlayer.x - ufo.x;
      const toPlayerY = targetPlayer.y - ufo.y;
      const playerDist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const toTargetX = attackTarget.x - ufo.x;
      const toTargetY = attackTarget.y - ufo.y;
      const dist = Math.hypot(toTargetX, toTargetY) || 1;

      if (playerDist > Math.max(width, height) * 2.7 + 1800) {
        const spawn = randomOffscreenPoint(180, 560);
        ufo.x = spawn.x;
        ufo.y = spawn.y;
        ufo.vx = randomRange(-24, 24);
        ufo.vy = randomRange(-24, 24);
        continue;
      }

      const nx = toTargetX / dist;
      const ny = toTargetY / dist;
      const tangentX = -ny * ufo.strafeSign;
      const tangentY = nx * ufo.strafeSign;
      const desiredDistance = attackTarget.kind === "body" ? clamp(attackTarget.radius + 350, 430, 660) : 430;
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
      updateUfoUndersideImpact(ufo);
      ufo.rotation = ufo.beamAngle - Math.PI / 2;
    }
  }

  function updateRivals(dt) {
    for (let i = rivals.length - 1; i >= 0; i -= 1) {
      const rival = rivals[i];
      tickMobDamageTimers(rival, dt);
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

      const target = nearestCombatPlayerTarget(rival.x, rival.y);
      const targetPlayer = target.player;
      const toPlayerX = targetPlayer.x - rival.x;
      const toPlayerY = targetPlayer.y - rival.y;
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

      if (dist < rivalShootRange && rival.shootCooldown <= 0 && hasClearShotAtCombatTarget(rival, target)) {
        fireRivalLaser(rival, target, dist);
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

  function hitCombatPlayerWithRambot(rambot, target, nx, ny) {
    const targetPlayer = target && target.player ? target.player : player;
    if ((target && target.local && player.hitCooldown > 0) || rambot.impactCooldown > 0) {
      return;
    }

    if (target && !target.local && target.remote) {
      sendRemoteEntityEffect(target.remote, {
        entityType: "player",
        damage: rambotImpactDamage,
        impulseX: nx * 360 + rambot.vx * 0.48,
        impulseY: ny * 360 + rambot.vy * 0.48,
        color: rambot.color
      });
    } else {
      if (player.landed) {
        detachFromBody(210);
      }

      player.vx += nx * 360 + rambot.vx * 0.48;
      player.vy += ny * 360 + rambot.vy * 0.48;
      damageLocalPlayer(rambotImpactDamage, {
        cause: "Rambot charge",
        cooldown: 0.85,
        flash: 0.32
      });
    }

    rambot.impactCooldown = 0.9;
    rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.55);
    rambot.chargeTimer = 0;
    rambot.vx -= nx * 180;
    rambot.vy -= ny * 180;

    sparks.push({
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: 58,
      color: rambot.color,
      life: 0.34,
      maxLife: 0.34
    });
  }

  function updateRambotPlayerImpact(rambot, target) {
    const targetPlayer = target && target.player ? target.player : player;
    const dx = targetPlayer.x - rambot.x;
    const dy = targetPlayer.y - rambot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = (targetPlayer.radius || player.radius) * 0.74 + rambot.radius * 0.86;

    if (dist > hitDistance) {
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > rambotImpactSpeed;
    const overlap = hitDistance - dist;

    if (target && target.local) {
      player.x += nx * overlap * 0.72;
      player.y += ny * overlap * 0.72;
    }
    rambot.x -= nx * overlap * 0.28;
    rambot.y -= ny * overlap * 0.28;

    if (charging) {
      hitCombatPlayerWithRambot(rambot, target || { local: true, remote: null, player }, nx, ny);
    }
  }

  function updateRambotStructureImpact(rambot) {
    if (rambot.impactCooldown > 0) {
      return;
    }

    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > rambotImpactSpeed;
    if (!charging) {
      return;
    }

    for (const structure of structures) {
      if (structure.health <= 0) {
        continue;
      }

      const dx = structure.x - rambot.x;
      const dy = structure.y - rambot.y;
      const dist = Math.hypot(dx, dy) || 1;
      const hitDistance = rambot.radius * 0.82 + structureHitRadius(structure);
      if (dist > hitDistance) {
        continue;
      }

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = hitDistance - dist;
      rambot.x -= nx * overlap * 0.34;
      rambot.y -= ny * overlap * 0.34;
      rambot.vx -= nx * 210;
      rambot.vy -= ny * 210;
      rambot.impactCooldown = 0.95;
      rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.58);
      rambot.chargeTimer = 0;
      damageStructure(structure, structureRambotDamage + Math.max(0, speed - rambotImpactSpeed) * 0.045, rambot.color);
      break;
    }
  }

  function rambotAttackTarget(playerTarget) {
    if (playerTarget && playerTarget.local && player.landed) {
      const body = bodyById(player.landed.bodyId);
      if (body && body.tier && body.tier.solid) {
        return {
          kind: "body",
          body,
          x: body.x,
          y: body.y,
          radius: body.radius
        };
      }
    }

    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: targetPlayer.radius || player.radius
    };
  }

  function updateRambots(dt) {
    for (let i = rambots.length - 1; i >= 0; i -= 1) {
      const rambot = rambots[i];
      tickMobDamageTimers(rambot, dt);
      rambot.flash = Math.max(0, rambot.flash - dt);
      rambot.impactCooldown = Math.max(0, rambot.impactCooldown - dt);

      if (rambot.health <= 0) {
        rambots.splice(i, 1);
        continue;
      }

      const target = nearestCombatPlayerTarget(rambot.x, rambot.y);
      const targetPlayer = target.player;
      const toPlayerX = targetPlayer.x - rambot.x;
      const toPlayerY = targetPlayer.y - rambot.y;
      const playerDist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const attackTarget = rambotAttackTarget(target);
      const toTargetX = attackTarget.x - rambot.x;
      const toTargetY = attackTarget.y - rambot.y;
      const dist = Math.hypot(toTargetX, toTargetY) || 1;

      if (playerDist > Math.max(width, height) * 2.5 + 1800) {
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

      const nx = toTargetX / dist;
      const ny = toTargetY / dist;
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

        const chargeRange = attackTarget.kind === "body" ? attackTarget.radius + 860 : 1080;
        if (dist < chargeRange && rambot.chargeCooldown <= 0) {
          rambot.chargeDirX = nx;
          rambot.chargeDirY = ny;
          rambot.chargeTimer = attackTarget.kind === "player" ? randomRange(0.92, 1.14) : randomRange(0.62, 0.82);
          rambot.impactCooldown = 0;
          const launchImpulse = attackTarget.kind === "player" ? 220 : 170;
          rambot.vx += nx * launchImpulse;
          rambot.vy += ny * launchImpulse;
        }
      }

      rambot.vx += Math.sin(performance.now() * 0.0005 + rambot.wobble) * 5 * dt;
      rambot.vy += Math.cos(performance.now() * 0.00045 + rambot.wobble) * 5 * dt;
      rambot.vx *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);
      rambot.vy *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);

      const speed = Math.hypot(rambot.vx, rambot.vy);
      const maxSpeed = rambot.chargeTimer > 0 ? 475 : 150;
      if (speed > maxSpeed) {
        rambot.vx = (rambot.vx / speed) * maxSpeed;
        rambot.vy = (rambot.vy / speed) * maxSpeed;
      }

      rambot.x += rambot.vx * dt;
      rambot.y += rambot.vy * dt;
      updateRambotPlayerImpact(rambot, target);
      updateRambotStructureImpact(rambot);
      rambot.rotation = Math.atan2(rambot.vy || ny, rambot.vx || nx) + Math.PI / 2;
    }
  }

  function electricAttackTarget(tesla, playerTarget) {
    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    const playerDistance = Math.hypot(targetPlayer.x - tesla.x, targetPlayer.y - tesla.y);
    const structure = nearestStructureTarget(tesla.x, tesla.y, teslaLightningRange * 0.95, (candidate) => candidate.health > 0);

    if (structure) {
      const structureDistance = Math.hypot(structure.x - tesla.x, structure.y - tesla.y);
      if (structureDistance < playerDistance * 1.12 && hasClearShotAtStructure(tesla.x, tesla.y, structure, null)) {
        return {
          kind: "structure",
          structure,
          x: structure.x,
          y: structure.y,
          vx: 0,
          vy: 0,
          radius: structureHitRadius(structure)
        };
      }
    }

    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      vx: finiteOr(targetPlayer.vx, 0),
      vy: finiteOr(targetPlayer.vy, 0),
      radius: targetPlayer.radius || player.radius
    };
  }

  function hasClearShotAtElectricTarget(tesla, target) {
    if (target.kind === "structure") {
      return hasClearShotAtStructure(tesla.x, tesla.y, target.structure, null);
    }
    return hasClearShotAtCombatTarget(tesla, target.target);
  }

  function findEngineerHealTarget(engineer) {
    let best = null;
    let bestScore = Infinity;

    for (const mob of allCombatMobs()) {
      if (mob === engineer || mob.kind === "engineer" || mob.health <= 0 || mob.health >= mob.maxHealth) {
        continue;
      }

      const distance = Math.hypot(mob.x - engineer.x, mob.y - engineer.y);
      const missing = Math.max(0, mob.maxHealth - mob.health);
      const score = distance - missing * 2.7;
      if (distance < engineerHealRange * 1.45 && score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }

    return best;
  }

  function updateEngineers(dt) {
    for (let i = engineers.length - 1; i >= 0; i -= 1) {
      const engineer = engineers[i];
      tickMobDamageTimers(engineer, dt);
      engineer.flash = Math.max(0, engineer.flash - dt);
      engineer.healCooldown = Math.max(0, engineer.healCooldown - dt);
      engineer.healPulse = Math.max(0, (engineer.healPulse || 0) - dt);

      if (engineer.health <= 0) {
        engineers.splice(i, 1);
        continue;
      }

      const playerTarget = nearestCombatPlayerTarget(engineer.x, engineer.y);
      const targetPlayer = playerTarget.player;
      const playerDist = Math.hypot(targetPlayer.x - engineer.x, targetPlayer.y - engineer.y) || 1;

      if (playerDist > Math.max(width, height) * 2.55 + 1800) {
        const spawn = randomOffscreenPoint(210, 600);
        engineer.x = spawn.x;
        engineer.y = spawn.y;
        engineer.vx = randomRange(-16, 16);
        engineer.vy = randomRange(-16, 16);
        engineer.healCooldown = randomRange(0.35, 0.9);
        continue;
      }

      const healTarget = findEngineerHealTarget(engineer);
      const focusX = healTarget ? healTarget.x : targetPlayer.x;
      const focusY = healTarget ? healTarget.y : targetPlayer.y;
      const toFocusX = focusX - engineer.x;
      const toFocusY = focusY - engineer.y;
      const focusDist = Math.hypot(toFocusX, toFocusY) || 1;
      const nx = toFocusX / focusDist;
      const ny = toFocusY / focusDist;
      const tangentX = -ny * engineer.strafeSign;
      const tangentY = nx * engineer.strafeSign;

      if (healTarget) {
        const desiredDistance = 260;
        const chaseForce = focusDist > desiredDistance ? 116 : -34;
        engineer.vx += nx * chaseForce * dt + tangentX * 34 * dt;
        engineer.vy += ny * chaseForce * dt + tangentY * 34 * dt;

        if (focusDist < engineerHealRange && engineer.healCooldown <= 0 && hasClearShotAtMob(engineer.x, engineer.y, healTarget, null)) {
          const healed = Math.min(healTarget.maxHealth - healTarget.health, engineerHealRate);
          if (healed > 0) {
            healTarget.health += healed;
            healTarget.flash = Math.max(healTarget.flash || 0, 0.12);
            engineer.healPulse = 0.38;
            engineer.repairBeamAngle = Math.atan2(healTarget.y - engineer.y, healTarget.x - engineer.x);
            engineer.targetKind = healTarget.kind;
            engineer.targetId = healTarget.id;
            sparks.push({
              x: healTarget.x,
              y: healTarget.y,
              radius: healTarget.radius * 1.4,
              color: engineer.color,
              life: 0.24,
              maxLife: 0.24
            });
            playSound("pickupHealth", { throttleKey: "engineerHeal", throttle: 0.22 });
          }
          engineer.healCooldown = engineerHealCooldown;
        }
      } else {
        const awayX = engineer.x - targetPlayer.x;
        const awayY = engineer.y - targetPlayer.y;
        const awayDist = Math.hypot(awayX, awayY) || 1;
        const keepAway = playerDist < 520 ? 90 : -18;
        engineer.vx += (awayX / awayDist) * keepAway * dt + tangentX * 22 * dt;
        engineer.vy += (awayY / awayDist) * keepAway * dt + tangentY * 22 * dt;
        engineer.targetKind = "";
        engineer.targetId = 0;
      }

      engineer.vx += Math.sin(performance.now() * 0.00058 + engineer.wobble) * 7 * dt;
      engineer.vy += Math.cos(performance.now() * 0.00052 + engineer.wobble) * 7 * dt;
      engineer.vx *= Math.pow(0.72, dt);
      engineer.vy *= Math.pow(0.72, dt);

      const speed = Math.hypot(engineer.vx, engineer.vy);
      const maxSpeed = healTarget && focusDist > 520 ? 170 : 132;
      if (speed > maxSpeed) {
        engineer.vx = (engineer.vx / speed) * maxSpeed;
        engineer.vy = (engineer.vy / speed) * maxSpeed;
      }

      engineer.x += engineer.vx * dt;
      engineer.y += engineer.vy * dt;
      engineer.rotation = Math.atan2(engineer.vy || ny, engineer.vx || nx) + Math.PI / 2;
    }
  }

  function updateTeslas(dt) {
    for (let i = teslas.length - 1; i >= 0; i -= 1) {
      const tesla = teslas[i];
      tickMobDamageTimers(tesla, dt);
      tesla.flash = Math.max(0, tesla.flash - dt);
      tesla.shootCooldown = Math.max(0, tesla.shootCooldown - dt);
      tesla.lightningFlash = Math.max(0, (tesla.lightningFlash || 0) - dt);

      if (tesla.health <= 0) {
        teslas.splice(i, 1);
        continue;
      }

      const playerTarget = nearestCombatPlayerTarget(tesla.x, tesla.y);
      const targetPlayer = playerTarget.player;
      const target = electricAttackTarget(tesla, playerTarget);
      const toPlayerX = target.x - tesla.x;
      const toPlayerY = target.y - tesla.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const playerDist = Math.hypot(targetPlayer.x - tesla.x, targetPlayer.y - tesla.y) || 1;

      if (playerDist > Math.max(width, height) * 2.6 + 1800) {
        const spawn = randomOffscreenPoint(190, 560);
        tesla.x = spawn.x;
        tesla.y = spawn.y;
        tesla.vx = randomRange(-18, 18);
        tesla.vy = randomRange(-18, 18);
        tesla.shootCooldown = randomRange(1.2, 2.5);
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * tesla.strafeSign;
      const tangentY = nx * tesla.strafeSign;
      const desiredDistance = 520;
      const chaseForce = dist > desiredDistance ? 92 : -64;
      const strafeForce = dist < 940 ? 72 : 20;

      tesla.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      tesla.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

      if (dist < teslaLightningRange && hasClearShotAtElectricTarget(tesla, target)) {
        tesla.lightningWarmup = clamp((tesla.lightningWarmup || 0) + dt * 1.65, 0, 1);
        if (tesla.shootCooldown <= 0 && tesla.lightningWarmup >= 1) {
          fireTeslaLightning(tesla, target, dist);
        }
      } else {
        tesla.lightningWarmup = Math.max(0, (tesla.lightningWarmup || 0) - dt * 1.8);
      }

      tesla.vx += Math.sin(performance.now() * 0.00082 + tesla.wobble) * 14 * dt;
      tesla.vy += Math.cos(performance.now() * 0.00077 + tesla.wobble) * 14 * dt;
      tesla.vx *= Math.pow(0.7, dt);
      tesla.vy *= Math.pow(0.7, dt);

      const speed = Math.hypot(tesla.vx, tesla.vy);
      const maxSpeed = dist > 760 ? 176 : 138;
      if (speed > maxSpeed) {
        tesla.vx = (tesla.vx / speed) * maxSpeed;
        tesla.vy = (tesla.vy / speed) * maxSpeed;
      }

      tesla.x += tesla.vx * dt;
      tesla.y += tesla.vy * dt;
      tesla.lightningAngle = Math.atan2(ny, nx);
      tesla.rotation = tesla.lightningAngle + Math.PI / 2;
    }
  }

  function hitCombatPlayerWithRocket(rocket, target, nx, ny) {
    const targetPlayer = target && target.player ? target.player : player;
    if ((target && target.local && player.hitCooldown > 0) || rocket.impactCooldown > 0) {
      return;
    }

    if (target && !target.local && target.remote) {
      sendRemoteEntityEffect(target.remote, {
        entityType: "player",
        damage: rocketImpactDamage,
        impulseX: nx * 420 + rocket.vx * 0.52,
        impulseY: ny * 420 + rocket.vy * 0.52,
        color: rocket.color
      });
    } else {
      if (player.landed) {
        detachFromBody(240);
      }

      player.vx += nx * 420 + rocket.vx * 0.52;
      player.vy += ny * 420 + rocket.vy * 0.52;
      damageLocalPlayer(rocketImpactDamage, {
        cause: "Rocket ship",
        cooldown: 0.9,
        flash: 0.34
      });
    }

    rocket.impactCooldown = 0.95;
    rocket.recoverTimer = Math.max(rocket.recoverTimer, 0.7);
    rocket.chargeCooldown = randomRange(rocketChargeCooldownMin, rocketChargeCooldownMax);
    rocket.chargeTimer = 0;
    rocket.chargePower = 0;
    rocket.strafeSign *= -1;
    rocket.blastTimer = 0;
    rocket.lockTimer = 0;
    rocket.scanProgress = 0;
    rocket.volleyTimer = 0;
    rocket.volleyShots = 0;
    rocket.vx -= nx * 260;
    rocket.vy -= ny * 260;

    sparks.push({
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: 68,
      color: rocket.color,
      life: 0.36,
      maxLife: 0.36
    });
  }

  function rocketAttackTarget(rocket, playerTarget) {
    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    const playerDistance = Math.hypot(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const structure = nearestStructureTarget(rocket.x, rocket.y, 1180, (candidate) => candidate.health > 0);

    if (structure) {
      const structureDistance = Math.hypot(structure.x - rocket.x, structure.y - rocket.y);
      if (structureDistance < playerDistance * 1.18 && hasClearShotAtStructure(rocket.x, rocket.y, structure, null)) {
        return {
          kind: "structure",
          structure,
          x: structure.x,
          y: structure.y,
          vx: 0,
          vy: 0,
          radius: structureHitRadius(structure)
        };
      }
    }

    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      vx: finiteOr(targetPlayer.vx, 0),
      vy: finiteOr(targetPlayer.vy, 0),
      radius: targetPlayer.radius || player.radius
    };
  }

  function hasClearShotAtRocketTarget(rocket, target) {
    if (target.kind === "structure") {
      return hasClearShotAtStructure(rocket.x, rocket.y, target.structure, null);
    }
    return hasClearShotAtCombatTarget(rocket, target.target);
  }

  function updateRocketPlayerImpact(rocket, target) {
    const targetPlayer = target && target.player ? target.player : player;
    const dx = targetPlayer.x - rocket.x;
    const dy = targetPlayer.y - rocket.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = (targetPlayer.radius || player.radius) * 0.74 + rocket.radius * 0.88;

    if (dist > hitDistance) {
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const overlap = hitDistance - dist;

    if (target && target.local) {
      player.x += nx * overlap * 0.68;
      player.y += ny * overlap * 0.68;
    }
    rocket.x -= nx * overlap * 0.32;
    rocket.y -= ny * overlap * 0.32;

    if (speed > rocketImpactSpeed) {
      hitCombatPlayerWithRocket(rocket, target || { local: true, remote: null, player }, nx, ny);
    }
  }

  function updateRocketStructureImpact(rocket) {
    if (rocket.impactCooldown > 0) {
      return;
    }

    const speed = Math.hypot(rocket.vx, rocket.vy);
    if (speed <= rocketImpactSpeed * 0.82) {
      return;
    }

    for (const structure of structures) {
      if (structure.health <= 0) {
        continue;
      }

      const dx = structure.x - rocket.x;
      const dy = structure.y - rocket.y;
      const dist = Math.hypot(dx, dy) || 1;
      const hitDistance = rocket.radius * 0.86 + structureHitRadius(structure);
      if (dist > hitDistance) {
        continue;
      }

      const nx = dx / dist;
      const ny = dy / dist;
      rocket.x -= nx * (hitDistance - dist) * 0.3;
      rocket.y -= ny * (hitDistance - dist) * 0.3;
      rocket.impactCooldown = 0.95;
      rocket.recoverTimer = Math.max(rocket.recoverTimer, 0.7);
      rocket.chargeCooldown = randomRange(rocketChargeCooldownMin, rocketChargeCooldownMax);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.strafeSign *= -1;
      rocket.blastTimer = 0;
      rocket.lockTimer = 0;
      rocket.scanProgress = 0;
      rocket.volleyTimer = 0;
      rocket.volleyShots = 0;
      rocket.vx -= nx * 240;
      rocket.vy -= ny * 240;
      damageStructure(structure, structureRocketDamage + Math.max(0, speed - rocketImpactSpeed) * 0.035, rocket.color);
      break;
    }
  }

  function updateRocketShip(rocket, dt) {
    const playerTarget = nearestCombatPlayerTarget(rocket.x, rocket.y);
    const target = rocketAttackTarget(rocket, playerTarget);
    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    const toTargetX = target.x - rocket.x;
    const toTargetY = target.y - rocket.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;

    if (dist > Math.max(width, height) * 2.9 + 2400) {
      const spawn = randomOffscreenPoint(320, 900);
      rocket.x = spawn.x;
      rocket.y = spawn.y;
      rocket.vx = randomRange(-24, 24);
      rocket.vy = randomRange(-24, 24);
      rocket.chargeCooldown = randomRange(0.65, 1.35);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.recoverTimer = 0;
      rocket.impactCooldown = 0;
      continueRocketFromDifferentSide(rocket);
      return;
    }

    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rocket.strafeSign;
    const tangentY = nx * rocket.strafeSign;

    if (rocket.chargeTimer > 0) {
      rocket.chargeTimer = Math.max(0, rocket.chargeTimer - dt);
      const progress = 1 - clamp(rocket.chargeTimer / rocketChargeDuration, 0, 1);
      rocket.chargePower = progress;
      rocket.vx += rocket.chargeDirX * (980 + progress * 2600) * dt;
      rocket.vy += rocket.chargeDirY * (980 + progress * 2600) * dt;
      rocket.vx *= Math.pow(0.985, dt);
      rocket.vy *= Math.pow(0.985, dt);

      if (rocket.chargeTimer <= 0) {
        rocket.recoverTimer = randomRange(1.05, 1.42);
        rocket.chargeCooldown = randomRange(rocketChargeCooldownMin, rocketChargeCooldownMax);
        rocket.chargePower = 0;
        continueRocketFromDifferentSide(rocket);
      }
    } else if (rocket.recoverTimer > 0) {
      rocket.recoverTimer = Math.max(0, rocket.recoverTimer - dt);
      rocket.vx += (-nx * 88 + tangentX * 64) * dt;
      rocket.vy += (-ny * 88 + tangentY * 64) * dt;
      rocket.vx *= Math.pow(0.76, dt);
      rocket.vy *= Math.pow(0.76, dt);
    } else {
      rocket.chargeCooldown = Math.max(0, finiteOr(rocket.chargeCooldown, 0) - dt);
      const rangeForce = dist > 820 ? 180 : dist < 540 ? -176 : 24;
      const strafeForce = 92 + Math.sin(performance.now() * 0.001 + rocket.wobble) * 16;
      rocket.vx += (nx * rangeForce + tangentX * strafeForce) * dt;
      rocket.vy += (ny * rangeForce + tangentY * strafeForce) * dt;
      rocket.vx *= Math.pow(0.72, dt);
      rocket.vy *= Math.pow(0.72, dt);

      const canCharge = dist > 360 && dist < 1220 && hasClearShotAtRocketTarget(rocket, target);
      if (rocket.chargeCooldown <= 0 && canCharge) {
        const leadTime = clamp(dist / rocketChargeMaxSpeed, 0.15, 0.7);
        rocket.lockX = target.x + finiteOr(target.vx, 0) * leadTime * 0.72;
        rocket.lockY = target.y + finiteOr(target.vy, 0) * leadTime * 0.72;
        const aim = normalize(rocket.lockX - rocket.x, rocket.lockY - rocket.y);
        rocket.chargeDirX = aim.x;
        rocket.chargeDirY = aim.y;
        rocket.chargeTimer = rocketChargeDuration;
        rocket.chargePower = 0;
        rocket.blastTimer = 0.46;
      }
    }

    rocket.blastTimer = Math.max(0, finiteOr(rocket.blastTimer, 0) - dt);
    rocket.vx += Math.sin(performance.now() * 0.00062 + rocket.wobble) * 5 * dt;
    rocket.vy += Math.cos(performance.now() * 0.00058 + rocket.wobble) * 5 * dt;

    const speed = Math.hypot(rocket.vx, rocket.vy);
    const chargeProgress = clamp(rocket.chargePower || 0, 0, 1);
    const maxSpeed = rocket.chargeTimer > 0
      ? 330 + chargeProgress * (rocketChargeMaxSpeed - 330)
      : rocket.recoverTimer > 0
        ? 520
        : 245;
    if (speed > maxSpeed) {
      rocket.vx = (rocket.vx / speed) * maxSpeed;
      rocket.vy = (rocket.vy / speed) * maxSpeed;
    }

    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;
    updateRocketPlayerImpact(rocket, playerTarget);
    updateRocketStructureImpact(rocket);

    const facingX = rocket.chargeTimer > 0 ? rocket.chargeDirX : rocket.vx;
    const facingY = rocket.chargeTimer > 0 ? rocket.chargeDirY : rocket.vy;
    rocket.rotation = Math.atan2(facingY || targetPlayer.y - rocket.y, facingX || targetPlayer.x - rocket.x) + Math.PI / 2;
  }

  function continueRocketFromDifferentSide(rocket) {
    rocket.strafeSign = rocket.strafeSign < 0 ? 1 : -1;
  }

  function updateRockets(dt) {
    for (let i = rockets.length - 1; i >= 0; i -= 1) {
      const rocket = rockets[i];
      tickMobDamageTimers(rocket, dt);
      rocket.flash = Math.max(0, rocket.flash - dt);
      rocket.impactCooldown = Math.max(0, rocket.impactCooldown - dt);
      rocket.blastTimer = Math.max(0, rocket.blastTimer - dt);

      if (rocket.health <= 0) {
        rockets.splice(i, 1);
        continue;
      }

      if (rocket.kind !== "satellite") {
        updateRocketShip(rocket, dt);
        continue;
      }

      const playerTarget = nearestCombatPlayerTarget(rocket.x, rocket.y);
      const target = rocketAttackTarget(rocket, playerTarget);
      const targetPlayer = playerTarget.player;
      const toPlayerX = target.x - rocket.x;
      const toPlayerY = target.y - rocket.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.7 + 2000) {
        const spawn = randomOffscreenPoint(230, 680);
        rocket.x = spawn.x;
        rocket.y = spawn.y;
        rocket.vx = randomRange(-14, 14);
        rocket.vy = randomRange(-14, 14);
        rocket.scanProgress = 0;
        rocket.lockTimer = 0;
        rocket.blastTimer = 0;
        rocket.volleyTimer = 0;
        rocket.volleyShots = 0;
        rocket.recoverTimer = 0;
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * rocket.strafeSign;
      const tangentY = nx * rocket.strafeSign;
      const targetAngle = Math.atan2(ny, nx);
      const turn = shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle);
      rocket.scannerAngle = (rocket.scannerAngle || targetAngle) + clamp(turn, -2.35 * dt, 2.35 * dt);

      if (rocket.volleyShots > 0) {
        rocket.volleyTimer -= dt;
        rocket.vx += -nx * 42 * dt + tangentX * 24 * dt;
        rocket.vy += -ny * 42 * dt + tangentY * 24 * dt;

        if (rocket.volleyTimer <= 0) {
          fireRocketMissile(rocket, target);
          rocket.volleyShots -= 1;
          rocket.volleyTimer = rocket.volleyShots > 0 ? satelliteVolleySpacing : 0;
          if (rocket.volleyShots <= 0) {
            rocket.recoverTimer = randomRange(0.86, 1.18);
            rocket.scanProgress = 0;
          }
        }
      } else if (rocket.lockTimer > 0) {
        rocket.lockTimer -= dt;
        rocket.vx *= Math.pow(0.16, dt);
        rocket.vy *= Math.pow(0.16, dt);
        rocket.vx += tangentX * 18 * dt - nx * 18 * dt;
        rocket.vy += tangentY * 18 * dt - ny * 18 * dt;
        if (rocket.lockTimer <= 0) {
          rocket.volleyShots = satelliteVolleyCount;
          rocket.volleyTimer = 0.01;
        }
      } else if (rocket.recoverTimer > 0) {
        rocket.recoverTimer -= dt;
        rocket.scanProgress = Math.max(0, rocket.scanProgress - dt * 1.1);
        rocket.vx += -nx * 72 * dt + tangentX * 28 * dt;
        rocket.vy += -ny * 72 * dt + tangentY * 28 * dt;
        rocket.vx *= Math.pow(0.52, dt);
        rocket.vy *= Math.pow(0.52, dt);
      } else {
        const scanTurn = Math.abs(shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle));
        const inRange = dist > 420 && dist < 1040;
        const scanning = inRange && scanTurn < 0.34 && hasClearShotAtRocketTarget(rocket, target);
        rocket.scanProgress = clamp(rocket.scanProgress + (scanning ? dt * 0.86 : -dt * 1.05), 0, 1);

        const rangeForce = dist > 760 ? 132 : dist < 540 ? -128 : 12;
        const strafeForce = 76 + rocket.scanProgress * 36;
        rocket.vx += nx * rangeForce * dt + tangentX * strafeForce * dt;
        rocket.vy += ny * rangeForce * dt + tangentY * strafeForce * dt;

        if (rocket.scanProgress >= 1) {
          rocket.lockX = target.x + finiteOr(target.vx, 0) * 0.46;
          rocket.lockY = target.y + finiteOr(target.vy, 0) * 0.46;
          rocket.lockTimer = satelliteLockDuration;
          rocket.scanProgress = 1;
        }
      }

      rocket.vx += Math.sin(performance.now() * 0.00048 + rocket.wobble) * 6 * dt;
      rocket.vy += Math.cos(performance.now() * 0.00044 + rocket.wobble) * 6 * dt;
      rocket.vx *= Math.pow(0.7, dt);
      rocket.vy *= Math.pow(0.7, dt);

      const speed = Math.hypot(rocket.vx, rocket.vy);
      const maxSpeed = rocket.volleyShots > 0 || rocket.lockTimer > 0 ? 118 : rocket.recoverTimer > 0 ? 152 : 194;
      if (speed > maxSpeed) {
        rocket.vx = (rocket.vx / speed) * maxSpeed;
        rocket.vy = (rocket.vy / speed) * maxSpeed;
      }

      rocket.x += rocket.vx * dt;
      rocket.y += rocket.vy * dt;
      updateRocketPlayerImpact(rocket, playerTarget);
      updateRocketStructureImpact(rocket);
      const aimX = Number.isFinite(rocket.lockX) ? rocket.lockX : target.x;
      const aimY = Number.isFinite(rocket.lockY) ? rocket.lockY : target.y;
      const aimAngle = rocket.volleyShots > 0 || rocket.lockTimer > 0
        ? Math.atan2(aimY - rocket.y, aimX - rocket.x)
        : rocket.scannerAngle || targetAngle;
      rocket.rotation = aimAngle + Math.PI / 2;
    }
  }

  function updateFighters(dt) {
    for (let i = fighters.length - 1; i >= 0; i -= 1) {
      const fighter = fighters[i];
      tickMobDamageTimers(fighter, dt);
      fighter.flash = Math.max(0, fighter.flash - dt);
      fighter.shootCooldown = Math.max(0, fighter.shootCooldown - dt);

      if (fighter.shieldActive > 0) {
        const before = fighter.shieldActive;
        fighter.shieldActive = Math.max(0, fighter.shieldActive - dt);
        fighter.shieldCharge = Math.max(0, fighter.shieldCharge - Math.min(dt, before));
        fighter.shieldRecharge = fighterShieldCycle;
      } else if (fighter.shieldCharge < fighterShieldMaxCharge) {
        fighter.shieldRecharge = Math.max(0, fighter.shieldRecharge - dt);
        if (fighter.shieldRecharge <= 0) {
          fighter.shieldCharge = fighterShieldMaxCharge;
        }
      }

      if (fighter.health <= 0) {
        fighters.splice(i, 1);
        continue;
      }

      const target = nearestCombatPlayerTarget(fighter.x, fighter.y);
      const targetPlayer = target.player;
      const toPlayerX = targetPlayer.x - fighter.x;
      const toPlayerY = targetPlayer.y - fighter.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.8 + 2200) {
        const spawn = randomOffscreenPoint(260, 760);
        fighter.x = spawn.x;
        fighter.y = spawn.y;
        fighter.vx = randomRange(-20, 20);
        fighter.vy = randomRange(-20, 20);
        fighter.shootCooldown = randomRange(1.0, 2.4);
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * fighter.strafeSign;
      const tangentY = nx * fighter.strafeSign;

      fighter.vx += nx * (dist > 560 ? 110 : -62) * dt + tangentX * (dist < 1050 ? 78 : 24) * dt;
      fighter.vy += ny * (dist > 560 ? 110 : -62) * dt + tangentY * (dist < 1050 ? 78 : 24) * dt;

      if (dist < fighterShootRange && fighter.shootCooldown <= 0 && hasClearShotAtCombatTarget(fighter, target)) {
        fireFighterGuns(fighter, target, dist);
      }

      fighter.vx += Math.sin(performance.now() * 0.00052 + fighter.wobble) * 9 * dt;
      fighter.vy += Math.cos(performance.now() * 0.00047 + fighter.wobble) * 9 * dt;
      fighter.vx *= Math.pow(0.72, dt);
      fighter.vy *= Math.pow(0.72, dt);

      const speed = Math.hypot(fighter.vx, fighter.vy);
      const maxSpeed = dist > 820 ? 210 : 162;
      if (speed > maxSpeed) {
        fighter.vx = (fighter.vx / speed) * maxSpeed;
        fighter.vy = (fighter.vy / speed) * maxSpeed;
      }

      fighter.x += fighter.vx * dt;
      fighter.y += fighter.vy * dt;
      fighter.rotation = Math.atan2(ny, nx) + Math.PI / 2;
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

    drawBodyEnergyMeter(particle, radius);
  }

  function drawBodyEnergyMeter(particle, radius) {
    if (!isStructureHostBody(particle)) {
      return;
    }

    normalizeBodyEnergy(particle);
    const maxEnergy = Math.max(1, finiteOr(particle.maxEnergy, maxEnergyForBody(particle)));
    const pct = clamp(finiteOr(particle.energy, maxEnergy) / maxEnergy, 0, 1);
    const meterRadius = clamp(radius * 0.24, 20, 44);
    const ringWidth = Math.max(5, meterRadius * 0.24);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(0, 0, meterRadius * 0.2, 0, 0, meterRadius + 14);
    halo.addColorStop(0, pct > 0.35 ? "rgba(157, 255, 122, 0.36)" : "rgba(245, 214, 91, 0.34)");
    halo.addColorStop(0.55, pct > 0.35 ? "rgba(88, 226, 255, 0.16)" : "rgba(255, 115, 173, 0.14)");
    halo.addColorStop(1, "rgba(88, 226, 255, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(3, 8, 24, 0.68)";
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius + 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = ringWidth;
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = pct > 0.35 ? "#9dff7a" : "#f5d65b";
    ctx.shadowColor = pct > 0.35 ? "rgba(157, 255, 122, 0.72)" : "rgba(245, 214, 91, 0.68)";
    ctx.shadowBlur = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(248, 251, 255, 0.92)";
    ctx.font = "900 " + Math.max(16, meterRadius * 0.7) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", 0, 1);
    ctx.restore();
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

  function drawTesla(tesla, time) {
    if (tesla.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 255, b: 214 };
    const energy = tesla.flash > 0 ? flashColor : tesla.color;
    const pulse = 1 + Math.sin(time * 0.012 + tesla.wobble) * 0.08 + (tesla.lightningWarmup || 0) * 0.08;

    ctx.save();
    ctx.translate(tesla.x, tesla.y);
    ctx.rotate(tesla.rotation || 0);
    ctx.scale(pulse, pulse);

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 78);
    glow.addColorStop(0, colorString(energy, 0.46));
    glow.addColorStop(1, colorString(energy, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorString(energy, 0.72);
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      const angle = time * 0.002 + tesla.wobble + i * (Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 7, Math.sin(angle) * 7, 26 + Math.sin(time * 0.009 + i) * 4, angle, angle + 1.2);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    const core = ctx.createRadialGradient(-8, -9, 3, 0, 0, 29);
    core.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    core.addColorStop(0.45, colorString(energy, 0.98));
    core.addColorStop(1, colorString(shadeColor(energy, -96), 0.94));
    ctx.fillStyle = core;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(energy, 0.24 + (tesla.lightningWarmup || 0) * 0.34);
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();

    const healthPct = clamp(tesla.health / tesla.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-28, -48, 56, 6, 3);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-28, -48, 56 * healthPct, 6, 3);
    ctx.fill();

    ctx.restore();
  }

  function drawEngineer(engineer, time) {
    if (engineer.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = engineer.flash > 0 ? flashColor : engineer.color;
    const pulse = 1 + Math.sin(time * 0.008 + engineer.wobble) * 0.06;

    ctx.save();
    ctx.translate(engineer.x, engineer.y);
    ctx.rotate(engineer.rotation || 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = colorString(hull, 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, engineer.radius * 1.28 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(12, 18, 30, 0.92)";
    ctx.strokeStyle = colorString(shadeColor(hull, 50), 0.76);
    ctx.lineWidth = 3;
    roundRectPath(-25, -28, 50, 56, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(hull, 0.86);
    roundRectPath(-17, -19, 34, 18, 7);
    ctx.fill();

    ctx.strokeStyle = colorString(hull, 0.82);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-26, -4);
    ctx.lineTo(-42, 12);
    ctx.moveTo(26, -4);
    ctx.lineTo(42, 12);
    ctx.stroke();

    ctx.strokeStyle = "rgba(248, 251, 255, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 18);
    ctx.stroke();

    if (engineer.healPulse > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(hull, clamp(engineer.healPulse / 0.38, 0, 1) * 0.72);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, engineer.radius * (1.6 + (0.38 - engineer.healPulse) * 2.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();

    const healthPct = clamp(engineer.health / engineer.maxHealth, 0, 1);
    ctx.save();
    ctx.translate(engineer.x, engineer.y);
    ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
    roundRectPath(-28, -50, 56, 6, 3);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-28, -50, 56 * healthPct, 6, 3);
    ctx.fill();
    ctx.restore();
  }

  function drawRocket(rocket, time) {
    if (rocket.health <= 0) {
      return;
    }

    if (rocket.kind === "satellite") {
      drawSatellite(rocket, time);
      return;
    }

    drawRocketShip(rocket, time);
  }

  function drawRocketShip(rocket, time) {
    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = rocket.flash > 0 ? flashColor : rocket.color;
    const chargePct = clamp(rocket.chargePower || 0, 0, 1);
    const charging = rocket.chargeTimer > 0;
    const lockX = Number.isFinite(rocket.lockX) ? rocket.lockX : rocket.x;
    const lockY = Number.isFinite(rocket.lockY) ? rocket.lockY : rocket.y;

    if (charging || rocket.blastTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const dirX = Math.cos((rocket.rotation || 0) - Math.PI / 2);
      const dirY = Math.sin((rocket.rotation || 0) - Math.PI / 2);
      const trailLength = 130 + chargePct * 240;
      const trail = ctx.createLinearGradient(
        rocket.x - dirX * trailLength,
        rocket.y - dirY * trailLength,
        rocket.x,
        rocket.y
      );
      trail.addColorStop(0, "rgba(169, 133, 255, 0)");
      trail.addColorStop(0.48, "rgba(255, 184, 88, " + (0.18 + chargePct * 0.3) + ")");
      trail.addColorStop(1, "rgba(255, 255, 255, " + (0.38 + chargePct * 0.34) + ")");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 18 + chargePct * 22;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rocket.x - dirX * trailLength, rocket.y - dirY * trailLength);
      ctx.lineTo(rocket.x - dirX * 20, rocket.y - dirY * 20);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 184, 88, 0.64)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lockX, lockY, 18 + Math.sin(time * 0.028) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.rotation || 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.globalCompositeOperation = "lighter";
    const flame = ctx.createRadialGradient(0, 38, 4, 0, 58, 68 + chargePct * 64);
    flame.addColorStop(0, "rgba(255, 255, 255, " + (0.42 + chargePct * 0.46) + ")");
    flame.addColorStop(0.32, "rgba(255, 184, 88, " + (0.42 + chargePct * 0.42) + ")");
    flame.addColorStop(1, "rgba(169, 133, 255, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.ellipse(0, 52, 13 + chargePct * 10, 44 + chargePct * 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(shadeColor(hull, -86), 0.98);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.bezierCurveTo(25, -30, 24, 22, 10, 48);
    ctx.lineTo(-10, 48);
    ctx.bezierCurveTo(-24, 22, -25, -30, 0, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, -34), 0.96);
    ctx.beginPath();
    ctx.moveTo(-16, 14);
    ctx.lineTo(-44, 44);
    ctx.lineTo(-13, 39);
    ctx.closePath();
    ctx.moveTo(16, 14);
    ctx.lineTo(44, 44);
    ctx.lineTo(13, 39);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 245, 220, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, -24, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const healthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-30, -76, 60, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-30, -76, 60 * healthPct, 7, 3.5);
    ctx.fill();

    ctx.restore();
  }

  function drawSatellite(rocket, time) {
    if (rocket.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = rocket.flash > 0 ? flashColor : rocket.color;
    const scanPct = clamp(rocket.scanProgress || 0, 0, 1);
    const locking = rocket.lockTimer > 0 || rocket.volleyShots > 0;
    const scanAngle = Number.isFinite(rocket.scannerAngle) ? rocket.scannerAngle : (rocket.rotation || 0) - Math.PI / 2;
    const lockX = Number.isFinite(rocket.lockX) ? rocket.lockX : rocket.x;
    const lockY = Number.isFinite(rocket.lockY) ? rocket.lockY : rocket.y;
    const thrust = rocket.recoverTimer > 0 ? 0.42 : locking ? 0.16 : 0.28;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (!locking) {
      const coneLength = 190 + scanPct * 150;
      ctx.fillStyle = colorString(hull, 0.05 + scanPct * 0.15);
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      ctx.arc(rocket.x, rocket.y, coneLength, scanAngle - 0.28, scanAngle + 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = colorString(hull, 0.22 + scanPct * 0.38);
      ctx.lineWidth = 2 + scanPct * 2;
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, 68 + scanPct * 34, scanAngle - 0.38, scanAngle + 0.38);
      ctx.stroke();
    } else {
      const lockPulse = 0.65 + Math.sin(time * 0.024) * 0.35;
      const reticleRadius = 26 + lockPulse * 8;
      ctx.strokeStyle = "rgba(255, 184, 88, 0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lockX, lockY, reticleRadius, 0, Math.PI * 2);
      ctx.moveTo(lockX - reticleRadius - 14, lockY);
      ctx.lineTo(lockX - 9, lockY);
      ctx.moveTo(lockX + 9, lockY);
      ctx.lineTo(lockX + reticleRadius + 14, lockY);
      ctx.moveTo(lockX, lockY - reticleRadius - 14);
      ctx.lineTo(lockX, lockY - 9);
      ctx.moveTo(lockX, lockY + 9);
      ctx.lineTo(lockX, lockY + reticleRadius + 14);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 184, 88, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      ctx.lineTo(lockX, lockY);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.rotation || 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = colorString(shadeColor(hull, -104), 0.96);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    roundRectPath(-23, -23, 46, 46, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(69, 126, 255, 0.78)";
    ctx.strokeStyle = "rgba(214, 235, 255, 0.72)";
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      roundRectPath(side * 35 - (side < 0 ? 58 : 0), -17, 58, 34, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(side * 35, -14);
      ctx.lineTo(side * 35, 14);
      ctx.moveTo(side * 55, -16);
      ctx.lineTo(side * 55, 16);
      ctx.moveTo(side * 75, -16);
      ctx.lineTo(side * 75, 16);
      ctx.stroke();
    }

    ctx.strokeStyle = colorString(shadeColor(hull, 74), 0.92);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, -58);
    ctx.moveTo(-12, -58);
    ctx.lineTo(12, -58);
    ctx.moveTo(0, 25);
    ctx.lineTo(0, 55);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 42), 0.96);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = locking ? "rgba(255, 184, 88, 0.95)" : colorString(hull, 0.62);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 25 + scanPct * 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.08, scanPct));
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    const satelliteHealthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-30, -74, 60, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = satelliteHealthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-30, -74, 60 * satelliteHealthPct, 7, 3.5);
    ctx.fill();

    ctx.restore();
    return;

    ctx.globalCompositeOperation = "lighter";
    const flame = ctx.createRadialGradient(0, 42, 4, 0, 54, 58 * thrust);
    flame.addColorStop(0, "rgba(255, 255, 255, " + (0.76 * thrust) + ")");
    flame.addColorStop(0.32, "rgba(255, 184, 88, " + (0.58 * thrust) + ")");
    flame.addColorStop(1, "rgba(169, 133, 255, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.ellipse(0, 50, 16, 48 * thrust, 0, 0, Math.PI * 2);
    ctx.fill();

    if (rocket.blastTimer > 0) {
      const muzzle = clamp(rocket.blastTimer / 0.18, 0, 1);
      ctx.fillStyle = "rgba(255, 184, 88, " + (0.7 * muzzle) + ")";
      ctx.beginPath();
      ctx.arc(0, -58, 22 + muzzle * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = colorString(hull, 0.54);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -26);
    ctx.lineTo(-43, -42);
    ctx.moveTo(18, -26);
    ctx.lineTo(43, -42);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 74), 0.92);
    ctx.beginPath();
    ctx.arc(-45, -43, 8 + scanPct * 3, 0, Math.PI * 2);
    ctx.arc(45, -43, 8 + scanPct * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorString(shadeColor(hull, -88), 0.98);
    ctx.strokeStyle = "#121827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.bezierCurveTo(28, -31, 27, 22, 13, 44);
    ctx.lineTo(-13, 44);
    ctx.bezierCurveTo(-27, 22, -28, -31, 0, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, -40), 0.98);
    roundRectPath(-37, -7, 13, 50, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(24, -7, 13, 50, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 64), 0.88);
    ctx.beginPath();
    ctx.ellipse(0, -18, 12, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = locking ? "rgba(255, 184, 88, 0.95)" : "rgba(255, 255, 255, 0.76)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -59, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * scanPct);
    ctx.stroke();

    const healthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-30, -76, 60, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-30, -76, 60 * healthPct, 7, 3.5);
    ctx.fill();

    ctx.restore();
  }

  function drawFighter(fighter, time) {
    if (fighter.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = fighter.flash > 0 ? flashColor : fighter.color;
    const shieldPct = clamp((fighter.shieldActive || 0) / 0.55, 0, 1);

    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate(fighter.rotation || 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (shieldPct > 0 || fighter.shieldCharge > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(fighter.color, 0.18 + shieldPct * 0.58);
      ctx.lineWidth = 4 + shieldPct * 4;
      ctx.beginPath();
      ctx.arc(0, 0, 58 + Math.sin(time * 0.012) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.fillStyle = colorString(shadeColor(hull, -72), 0.98);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(19, -10);
    ctx.lineTo(53, 22);
    ctx.lineTo(19, 19);
    ctx.lineTo(12, 43);
    ctx.lineTo(0, 30);
    ctx.lineTo(-12, 43);
    ctx.lineTo(-19, 19);
    ctx.lineTo(-53, 22);
    ctx.lineTo(-19, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 54), 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -12, 14, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colorString(shadeColor(hull, 68), 0.92);
    ctx.lineWidth = 6;
    for (const x of [-20, 20]) {
      ctx.beginPath();
      ctx.moveTo(x, -2);
      ctx.lineTo(x, -39);
      ctx.stroke();
    }

    const shieldChargePct = clamp((fighter.shieldCharge || 0) / fighterShieldMaxCharge, 0, 1);
    const healthPct = clamp(fighter.health / fighter.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-34, -78, 68, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-34, -78, 68 * healthPct, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    roundRectPath(-34, -68, 68, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = colorString(fighter.color, 0.92);
    roundRectPath(-34, -68, 68 * shieldChargePct, 5, 2.5);
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
    if (projectile.lightning) {
      ctx.strokeStyle = colorString(projectile.color, 0.7 * fade);
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      for (let i = 1; i <= 5; i += 1) {
        const t = i / 5;
        const jitter = Math.sin((projectile.x + projectile.y) * 0.03 + i * 2.4 + performance.now() * 0.026) * 16;
        ctx.lineTo(
          tailX + (projectile.x - tailX) * t - dirY * jitter,
          tailY + (projectile.y - tailY) * t + dirX * jitter
        );
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, " + (0.9 * fade) + ")";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (projectile.rocket) {
      const angle = Math.atan2(dirY, dirX);
      const trail = ctx.createLinearGradient(tailX, tailY, projectile.x, projectile.y);
      trail.addColorStop(0, "rgba(169, 133, 255, 0)");
      trail.addColorStop(0.42, colorString(projectile.color, 0.28 * fade));
      trail.addColorStop(1, colorString(projectile.color, 0.82 * fade));
      ctx.strokeStyle = trail;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(projectile.x, projectile.y);
      ctx.stroke();

      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#1b2130";
      ctx.strokeStyle = colorString(projectile.color, 0.9 * fade);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(9, 8);
      ctx.lineTo(0, 14);
      ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, " + (0.82 * fade) + ")";
      ctx.beginPath();
      ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

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

  function drawMissileLauncher(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const charge = clamp(finiteOr(structure.missileCharge, valid === false ? 0.35 : 1), 0, 1);
    const locking = finiteOr(structure.targetCount, 0) >= missileLauncherMinClusterSize && charge >= 1;
    const baseRotation = structure.angle + Math.PI / 2;
    const barrelAngle = Number.isFinite(Number(structure.aimAngle)) ? structure.aimAngle : structure.angle;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 184, b: 88 };
    const pulse = 0.72 + Math.sin(time * 0.011 + (structure.wobble || 0)) * 0.18;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(baseRotation);

    ctx.fillStyle = "rgba(7, 11, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.32)";
    ctx.lineWidth = 3;
    roundRectPath(-34, 8, 68, 20, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(198, 207, 224, 0.92)";
    ctx.strokeStyle = "rgba(10, 14, 27, 0.82)";
    roundRectPath(-26, -12 - deploy * 7, 52, 28 + deploy * 8, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(accent, 0.16 + charge * 0.36);
    ctx.beginPath();
    ctx.arc(0, -2 - deploy * 6, 12 + charge * 8 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const railBaseX = structure.x + Math.cos(structure.angle) * (12 + deploy * 8);
    const railBaseY = structure.y + Math.sin(structure.angle) * (12 + deploy * 8);
    const railLength = 36 + deploy * 32;

    ctx.save();
    ctx.globalAlpha *= alpha * (0.72 + deploy * 0.28);
    ctx.translate(railBaseX, railBaseY);
    ctx.rotate(barrelAngle);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(10, 14, 27, 0.94)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(railLength, -5);
    ctx.moveTo(0, 5);
    ctx.lineTo(railLength, 5);
    ctx.stroke();
    ctx.strokeStyle = colorString(accent, 0.68 + charge * 0.24);
    ctx.lineWidth = 4;
    ctx.stroke();

    if (charge > 0.08) {
      ctx.fillStyle = "rgba(19, 25, 39, 0.96)";
      ctx.strokeStyle = colorString(accent, 0.6 + charge * 0.32);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(railLength * charge - 10, -12);
      ctx.lineTo(railLength * charge + 12, 0);
      ctx.lineTo(railLength * charge - 10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    if (locking) {
      ctx.save();
      ctx.globalAlpha *= alpha * (0.28 + pulse * 0.16);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(structure.x, structure.y, 58 + Math.sin(time * 0.018) * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlatingBlock(structure, time, alpha, valid) {
    const deploy = Number.isFinite(Number(structure.deploy)) ? clamp(Number(structure.deploy), 0, 1) : 0.72;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 209, b: 102 };
    const shine = 0.42 + Math.sin(time * 0.004 + (structure.wobble || 0)) * 0.08;

    ctx.save();
    ctx.globalAlpha *= alpha * (0.62 + deploy * 0.38);
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    const gradient = ctx.createLinearGradient(0, -platingBlockHeight / 2, 0, platingBlockHeight / 2);
    gradient.addColorStop(0, colorString(shadeColor(accent, 46), 0.98));
    gradient.addColorStop(0.58, "rgba(72, 78, 94, 0.96)");
    gradient.addColorStop(1, "rgba(18, 23, 34, 0.98)");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = valid === false ? "rgba(255, 100, 100, 0.86)" : "rgba(248, 251, 255, 0.32)";
    ctx.lineWidth = 3;
    roundRectPath(-platingBlockWidth / 2, -platingBlockHeight / 2, platingBlockWidth, platingBlockHeight, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colorString(accent, 0.35 + shine * 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-platingBlockWidth / 2 + 8, -platingBlockHeight / 2 + 5);
    ctx.lineTo(platingBlockWidth / 2 - 8, -platingBlockHeight / 2 + 5);
    ctx.stroke();

    ctx.strokeStyle = "rgba(6, 10, 24, 0.42)";
    ctx.lineWidth = 1.5;
    for (const x of [-18, 0, 18]) {
      ctx.beginPath();
      ctx.moveTo(x, -platingBlockHeight / 2 + 4);
      ctx.lineTo(x, platingBlockHeight / 2 - 4);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(248, 251, 255, 0.68)";
    for (const x of [-28, 28]) {
      for (const y of [-7, 7]) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawBattery(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.008 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 157, g: 255, b: 122 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.86)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.32)";
    ctx.lineWidth = 3;
    roundRectPath(-28, -19, 56, 38, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(235, 246, 255, 0.88)";
    roundRectPath(-10, -25, 20, 7, 3);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fillHeight = 24 * deploy;
    const fill = ctx.createLinearGradient(0, 13, 0, -13);
    fill.addColorStop(0, colorString(accent, 0.42));
    fill.addColorStop(1, colorString(accent, 0.94));
    ctx.fillStyle = fill;
    roundRectPath(-18, 13 - fillHeight, 36, fillHeight, 5);
    ctx.fill();

    ctx.strokeStyle = colorString(accent, 0.5 + deploy * 0.32);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, (24 + deploy * 10) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f8fbff";
    ctx.beginPath();
    ctx.moveTo(4, -13);
    ctx.lineTo(-6, 1);
    ctx.lineTo(2, 1);
    ctx.lineTo(-4, 14);
    ctx.lineTo(12, -4);
    ctx.lineTo(3, -4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawAccumulator(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.007 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 88, g: 226, b: 255 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    const burstProgress = clamp(finiteOr(structure.burstTimer, 0) / accumulatorBurstDuration, 0, 1);
    if (burstProgress > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.12 + burstProgress * 0.42);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -2, 24 + (1 - burstProgress) * 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(6, 10, 24, 0.82)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-30, 8, 60, 17, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-26, -22, 24, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.48, "#8e9aae");
    shellGradient.addColorStop(1, "#30384d");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    roundRectPath(-24, -22, 48, 40, 10);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, 0.2 + deploy * 0.36);
    ctx.beginPath();
    ctx.arc(0, -2, (15 + deploy * 9) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.64 + deploy * 0.3);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, -2, 8 + i * 7 + deploy * 3, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.beginPath();
    ctx.arc(0, -2, 6 + deploy * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawShieldGenerator(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const active = clamp(finiteOr(structure.burstTimer, 0) / shieldGeneratorActiveDuration, 0, 1);
    const pulse = 1 + Math.sin(time * 0.007 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 119, g: 167, b: 255 };
    const body = bodyById(structure.bodyId);

    if (body && valid !== false) {
      const radius = shieldGeneratorRadius(body);
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.08 + deploy * 0.1 + active * 0.38);
      ctx.lineWidth = 2 + active * 7;
      ctx.beginPath();
      ctx.arc(body.x, body.y, radius + active * 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = colorString({ r: 248, g: 251, b: 255 }, (0.04 + active * 0.18) * deploy);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.arc(body.x, body.y, radius - 8 - i * 13 + Math.sin(time * 0.003 + i) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-31, 8, 62, 18, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-24, -24, 24, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.48, "#93a4c0");
    shellGradient.addColorStop(1, "#273149");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-25, 8);
    ctx.quadraticCurveTo(-20, -25 - deploy * 5, 0, -30 - deploy * 8);
    ctx.quadraticCurveTo(20, -25 - deploy * 5, 25, 8);
    ctx.lineTo(16, 18);
    ctx.lineTo(-16, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(accent, 0.36 + deploy * 0.34 + active * 0.26);
    ctx.lineWidth = 3 + active * 2;
    for (let i = 0; i < 3; i += 1) {
      const radius = (10 + i * 8 + deploy * 6 + active * 5) * pulse;
      ctx.beginPath();
      ctx.arc(0, -4, radius, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    ctx.fillStyle = colorString(accent, 0.25 + deploy * 0.45 + active * 0.3);
    ctx.beginPath();
    ctx.arc(0, -4, (13 + deploy * 7 + active * 6) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.94);
    ctx.beginPath();
    ctx.arc(0, -4, 6 + active * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCommunicationRelay(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.006 + (structure.wobble || 0)) * 0.06;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 184, b: 107 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.82)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-31, 9, 62, 17, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(235, 246, 255, 0.78)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -26 - deploy * 18);
    ctx.stroke();

    ctx.strokeStyle = colorString(accent, 0.84);
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -14 - deploy * 10);
      ctx.lineTo(side * (18 + deploy * 8), -28 - deploy * 14);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(accent, 0.28 + deploy * 0.42);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const radius = (13 + i * 9 + deploy * 7) * pulse;
      ctx.beginPath();
      ctx.arc(0, -35 - deploy * 14, radius, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.beginPath();
    ctx.arc(0, -35 - deploy * 14, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawJet(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const thrust = clamp(finiteOr(structure.thrustAmount, 0), 0, 1);
    const thrustDirection = finiteOr(structure.thrustDirection, 1) < 0 ? -1 : 1;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 169, g: 133, b: 255 };
    const flicker = 0.82 + Math.sin(time * 0.034 + (structure.wobble || 0)) * 0.18;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-30, 9, 60, 18, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-24, -24, 24, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.5, "#8d98ad");
    shellGradient.addColorStop(1, "#252d42");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, 12);
    ctx.lineTo(-17, -17 - deploy * 5);
    ctx.quadraticCurveTo(0, -28 - deploy * 8, 17, -17 - deploy * 5);
    ctx.lineTo(24, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(accent, 0.28 + deploy * 0.36);
    ctx.beginPath();
    ctx.ellipse(0, -7, 13 + deploy * 3, 8 + deploy * 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(10, 14, 27, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 15, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.72);
    ctx.lineWidth = 2;
    ctx.stroke();

    if (thrust > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.scale(1, thrustDirection);
      const flameLength = (24 + thrust * 48) * flicker;
      const flameWidth = 13 + thrust * 10;
      const flame = ctx.createLinearGradient(0, 18, 0, 18 + flameLength);
      flame.addColorStop(0, "rgba(248, 251, 255, " + (0.78 * thrust) + ")");
      flame.addColorStop(0.28, colorString({ r: 88, g: 226, b: 255 }, 0.72 * thrust));
      flame.addColorStop(1, colorString(accent, 0));
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-flameWidth, 15);
      ctx.quadraticCurveTo(-flameWidth * 0.35, 24 + flameLength * 0.34, 0, 18 + flameLength);
      ctx.quadraticCurveTo(flameWidth * 0.35, 24 + flameLength * 0.34, flameWidth, 15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawTetherAnchor(structure, x, y, angle, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 169, g: 133, b: 255 };
    const pulse = 1 + Math.sin(time * 0.006 + (structure.wobble || 0)) * 0.04;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-27, 7, 54, 17, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-20, -18, 20, 16);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.5, "#9aa4b8");
    shellGradient.addColorStop(1, "#30384d");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    roundRectPath(-21, -18, 42, 33, 9);
    ctx.fill();
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, (0.18 + deploy * 0.28) * alpha);
    ctx.beginPath();
    ctx.arc(0, -1, (12 + deploy * 5) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.beginPath();
    ctx.arc(0, -1, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawTether(structure, time, alpha, valid) {
    const x2 = finiteOr(structure.x2, structure.x);
    const y2 = finiteOr(structure.y2, structure.y);
    const dx = x2 - structure.x;
    const dy = y2 - structure.y;
    const length = Math.hypot(dx, dy);
    const poleAlpha = alpha * (valid === false ? 0.55 : 0.82);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 169, g: 133, b: 255 };

    if (length > 8) {
      const angle = Math.atan2(dy, dx);
      const deploy = clamp(structure.deploy || 0, 0, 1);
      const visibleLength = Math.max(0, length - 26);
      const segmentCount = Math.max(3, Math.min(12, Math.ceil(visibleLength / 105)));
      const segmentLength = visibleLength / segmentCount;

      ctx.save();
      ctx.globalAlpha *= poleAlpha;
      ctx.translate(structure.x, structure.y);
      ctx.rotate(angle);
      ctx.lineCap = "round";

      ctx.strokeStyle = "rgba(5, 8, 18, 0.9)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(length - 13, 0);
      ctx.stroke();

      ctx.strokeStyle = "rgba(235, 246, 255, 0.7)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(length - 16, 0);
      ctx.stroke();

      for (let i = 0; i < segmentCount; i += 1) {
        const start = 16 + i * segmentLength;
        const end = Math.min(length - 16, start + segmentLength * 0.72);
        const width = 7 - (i % 3) * 1.25;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(88, 226, 255, 0.58)" : colorString(accent, 0.58 + deploy * 0.22);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(start, 0);
        ctx.lineTo(end, 0);
        ctx.stroke();

        ctx.strokeStyle = "rgba(6, 10, 24, 0.62)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.min(length - 16, start + segmentLength * 0.78), -7);
        ctx.lineTo(Math.min(length - 16, start + segmentLength * 0.78), 7);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.14 + deploy * 0.12);
      ctx.lineWidth = 25;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(length - 18, 0);
      ctx.stroke();
      ctx.restore();
    }

    drawTetherAnchor(structure, structure.x, structure.y, structure.angle, time, alpha, valid);
    drawTetherAnchor(structure, x2, y2, finiteOr(structure.linkedAngle, structure.angle + Math.PI), time, alpha, valid);
  }

  function drawStructure(structure, time, alpha, valid) {
    if (structure.type === "plating-block") {
      drawPlatingBlock(structure, time, alpha, valid);
    } else if (structure.type === "battery") {
      drawBattery(structure, time, alpha, valid);
    } else if (structure.type === "accumulator") {
      drawAccumulator(structure, time, alpha, valid);
    } else if (structure.type === "shield-generator") {
      drawShieldGenerator(structure, time, alpha, valid);
    } else if (structure.type === "communication-relay") {
      drawCommunicationRelay(structure, time, alpha, valid);
    } else if (structure.type === "jet") {
      drawJet(structure, time, alpha, valid);
    } else if (structure.type === "tether") {
      drawTether(structure, time, alpha, valid);
    } else if (structure.type === "missile-launcher") {
      drawMissileLauncher(structure, time, alpha, valid);
    } else {
      drawTurret(structure, time, alpha, valid);
    }

    drawStructureStatus(structure, alpha, valid);
  }

  function drawStructureStatus(structure, alpha, valid) {
    if (valid === false || !Number.isFinite(Number(structure.health))) {
      return;
    }

    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    const damaged = health < maxHealth;
    const disabled = isStructureDisabled(structure) || health <= 0;
    if (!damaged && !disabled && !(structure.flash > 0)) {
      return;
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    if (disabled) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(157, 255, 122, 0.58)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(structure.x, structure.y, structureHitRadius(structure) * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    if (damaged) {
      const barWidth = 54;
      const barY = structure.y - structureHitRadius(structure) - 14;
      const pct = clamp(health / maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      roundRectPath(structure.x - barWidth / 2, barY, barWidth, 6, 3);
      ctx.fill();
      ctx.fillStyle = pct > 0.45 ? "#ffd166" : "#ff6d6d";
      roundRectPath(structure.x - barWidth / 2, barY, barWidth * pct, 6, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStructures(time) {
    for (const structure of structures) {
      drawStructure(structure, time, 1, true);
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
    const firstTetherPlacement = recipe.structureType === "tether" && pendingTetherAnchor
      ? refreshPlacementAnchor(pendingTetherAnchor)
      : null;
    const tetherSecondValid = Boolean(
      recipe.structureType !== "tether" ||
      !firstTetherPlacement ||
      (firstTetherPlacement.valid && placement.valid && firstTetherPlacement.bodyId !== placement.bodyId)
    );
    const preview = {
      type: recipe.structureType,
      bodyId: firstTetherPlacement ? firstTetherPlacement.bodyId : placement.bodyId,
      linkedBodyId: firstTetherPlacement ? placement.bodyId : 0,
      angle: firstTetherPlacement ? firstTetherPlacement.angle : placement.angle,
      linkedAngle: firstTetherPlacement ? placement.angle : 0,
      surfaceOffset: firstTetherPlacement ? firstTetherPlacement.surfaceOffset : placement.surfaceOffset,
      linkedSurfaceOffset: firstTetherPlacement ? placement.surfaceOffset : 0,
      x: firstTetherPlacement ? firstTetherPlacement.x : placement.x,
      y: firstTetherPlacement ? firstTetherPlacement.y : placement.y,
      x2: firstTetherPlacement ? placement.x : placement.x,
      y2: firstTetherPlacement ? placement.y : placement.y,
      restLength: firstTetherPlacement ? Math.hypot(placement.x - firstTetherPlacement.x, placement.y - firstTetherPlacement.y) : 0,
      aimAngle: firstTetherPlacement ? firstTetherPlacement.angle : placement.angle,
      deploy: placement.valid && tetherSecondValid ? 0.72 : 0.2,
      wobble: 0
    };
    const valid = placement.valid && tetherSecondValid && (!firstTetherPlacement || firstTetherPlacement.valid);

    drawStructure(preview, time, valid ? 0.48 : 0.34, valid);

    ctx.save();
    ctx.globalAlpha = valid ? 0.34 : 0.42;
    ctx.strokeStyle = valid ? "rgba(88, 226, 255, 0.85)" : "rgba(255, 100, 100, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(placement.x, placement.y, 44, 0, Math.PI * 2);
    ctx.stroke();
    if (firstTetherPlacement) {
      ctx.beginPath();
      ctx.arc(firstTetherPlacement.x, firstTetherPlacement.y, 44, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRivals(time) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
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

    for (const missile of launcherMissiles) {
      drawRivalProjectile(missile);
    }

    drawStructures(time);
    drawStructurePlacementPreview(time);

    for (const ufo of ufos) {
      drawUfo(ufo, time);
    }

    for (const rambot of rambots) {
      drawRambot(rambot, time);
    }

    for (const engineer of engineers) {
      drawEngineer(engineer, time);
    }

    for (const tesla of teslas) {
      drawTesla(tesla, time);
    }

    for (const rocket of rockets) {
      drawRocket(rocket, time);
    }

    for (const fighter of fighters) {
      drawFighter(fighter, time);
    }

    for (const rival of rivals) {
      drawRival(rival, time);
    }

    ctx.restore();
  }

  function drawBackground() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    const backgroundReach = Math.hypot(width, height) / Math.max(0.001, cameraZoom) + 240;
    const gradient = ctx.createLinearGradient(
      player.x - backgroundReach,
      player.y - backgroundReach,
      player.x + backgroundReach,
      player.y + backgroundReach
    );
    gradient.addColorStop(0, "#06102d");
    gradient.addColorStop(0.5, "#080716");
    gradient.addColorStop(1, "#101234");
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x - backgroundReach, player.y - backgroundReach, backgroundReach * 2, backgroundReach * 2);

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
    ctx.fillRect(player.x - backgroundReach, player.y - backgroundReach, backgroundReach * 2, backgroundReach * 2);

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
    ctx.scale(cameraZoom, cameraZoom);
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

  function drawRemoteUniverses(time) {
    if (!multiplayer.remoteUniverses.size) {
      return;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    for (const remote of multiplayer.remoteUniverses.values()) {
      const transform = displayTransformFor(remote);
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || transform.alpha <= 0.02) {
        continue;
      }

      const transformAlpha = clamp(transform.alpha, 0, 1);
      const alpha = transformAlpha * remoteUniverseAlphaScale;
      const sharedEntityAlpha = transformAlpha * (transform.phase === "overlap" ? 0.92 : 0.42);
      const sharedBodyAlpha = transform.phase === "overlap" ? sharedEntityAlpha : alpha;
      const world = snapshot.world;
      ctx.save();
      ctx.globalAlpha = sharedBodyAlpha;
      ctx.globalCompositeOperation = "lighter";

      for (const particle of world.particles) {
        if (!isMappedBody(particle)) {
          continue;
        }
        const transformed = transformedRemoteEntity(particle, transform);
        if (Math.hypot(transformed.x - player.x, transformed.y - player.y) > multiplayer.bubbleRadius + 1800) {
          continue;
        }
        drawBody(transformed, time);
      }

      ctx.globalCompositeOperation = "source-over";
      for (const structure of world.structures || []) {
        const transformed = transformedRemoteEntity(structure, transform);
        drawRemoteStructure(transformed, time);
      }

      ctx.globalAlpha = sharedEntityAlpha;
      for (const projectile of world.rivalProjectiles || []) {
        drawRivalProjectile(transformedRemoteEntity(projectile, transform));
      }
      for (const ufo of world.ufos || []) {
        drawUfo(transformedRemoteEntity(ufo, transform), time);
      }
      for (const rambot of world.rambots || []) {
        drawRambot(transformedRemoteEntity(rambot, transform), time);
      }
      for (const engineer of world.engineers || []) {
        drawEngineer(transformedRemoteEntity(engineer, transform), time);
      }
      for (const tesla of world.teslas || []) {
        drawTesla(transformedRemoteEntity(tesla, transform), time);
      }
      for (const rocket of world.rockets || []) {
        drawRocket(transformedRemoteEntity(rocket, transform), time);
      }
      for (const fighter of world.fighters || []) {
        drawFighter(transformedRemoteEntity(fighter, transform), time);
      }
      for (const rival of world.alienoids || []) {
        drawRival(transformedRemoteEntity(rival, transform), time);
      }

      if (snapshot.player) {
        drawRemotePlayer(transformedRemoteEntity(snapshot.player, transform), remote.publicName, time);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  function drawRemoteStructure(structure, time) {
    if (isKnownStructureType(structure.type)) {
      drawStructure(structure, time, 0.75, true);
      return;
    }

    ctx.save();
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle || 0);
    ctx.fillStyle = "rgba(88, 226, 255, 0.42)";
    roundRectPath(-10, -10, 20, 20, 5);
    ctx.fill();
    ctx.restore();
  }

  function remoteBodyRotation(remotePlayer) {
    if (remotePlayer.landed) {
      return remotePlayer.landed.angle + Math.PI / 2;
    }

    return finiteOr(remotePlayer.cameraRoll, 0) - cameraRoll;
  }

  function remotePlayerBob(remotePlayer, time) {
    if (remotePlayer.landed) {
      return 0;
    }

    const seed = String(remotePlayer.id || remotePlayer.name || "").length * 0.37;
    return Math.sin(time * 0.004 + seed) * 2.4;
  }

  function drawRemoteGadgetField(remotePlayer, aimAngle, time) {
    if (isWeaponTool(remotePlayer.equippedTool) || !remotePlayer.toolActive) {
      return;
    }

    const pulling = remotePlayer.toolMode === "pull";
    const pushing = remotePlayer.toolMode === "push";
    const holding = remotePlayer.toolMode === "hold";
    if (!pulling && !pushing && !holding) {
      return;
    }

    const dirX = Math.cos(aimAngle);
    const dirY = Math.sin(aimAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const mouthX = remotePlayer.x + dirX * funnelShape.rimX;
    const mouthY = remotePlayer.y + dirY * funnelShape.rimX;
    const fieldLength = holding ? gadgetHoldReach - funnelShape.rimX : pulling ? 270 : 220;
    const fieldWidth = holding ? 108 : pulling ? 118 : 96;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const side = (t - 0.5) * fieldWidth;
      const wave = Math.sin(time * 0.006 + i * 1.5) * 6;
      const startScale = pulling ? fieldLength : 16;
      const endScale = pulling ? 18 : fieldLength;
      const startX = mouthX + dirX * startScale + normalX * (side + wave);
      const startY = mouthY + dirY * startScale + normalY * (side + wave);
      const endX = mouthX + dirX * endScale + normalX * side * 0.18;
      const endY = mouthY + dirY * endScale + normalY * side * 0.18;
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);

      if (holding) {
        gradient.addColorStop(0, "rgba(126, 255, 191, 0)");
        gradient.addColorStop(0.5, "rgba(126, 255, 191, 0.34)");
        gradient.addColorStop(1, "rgba(255, 246, 139, 0.46)");
      } else if (pulling) {
        gradient.addColorStop(0, "rgba(114, 244, 255, 0)");
        gradient.addColorStop(0.58, "rgba(114, 244, 255, 0.24)");
        gradient.addColorStop(1, "rgba(229, 109, 255, 0.5)");
      } else {
        gradient.addColorStop(0, "rgba(255, 229, 120, 0.58)");
        gradient.addColorStop(0.62, "rgba(255, 117, 79, 0.24)");
        gradient.addColorStop(1, "rgba(255, 117, 79, 0)");
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = holding ? 2.5 : pulling ? 2 : 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        (startX + endX) / 2 + normalX * Math.sin(time * 0.004 + i) * 12,
        (startY + endY) / 2 + normalY * Math.sin(time * 0.004 + i) * 12,
        endX,
        endY
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRemoteJetFlames(time) {
    const flicker = 1 + Math.sin(time * 0.032) * 0.18;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const x of [-16, 16]) {
      const gradient = ctx.createRadialGradient(x, 50, 0, x, 56, 25 * flicker);
      gradient.addColorStop(0, "rgba(255, 255, 184, 0.92)");
      gradient.addColorStop(0.42, "rgba(78, 218, 255, 0.56)");
      gradient.addColorStop(1, "rgba(75, 111, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, 54, 9 * flicker, 25 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRemoteAstronautSuit(remotePlayer, time, bob, bodyRotation) {
    const localVelocity = rotatePoint(remotePlayer.vx || 0, remotePlayer.vy || 0, -bodyRotation);
    const lean = remotePlayer.landed ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;
    const damaged = remotePlayer.health <= 0;
    const crouching = remotePlayer.landed && remotePlayer.crouching;
    const remoteWalkCycle = finiteOr(remotePlayer.walkCycle, remotePlayer.landed ? remotePlayer.landed.walkCycle : time * 0.006);
    const remoteWalkSpeed = remotePlayer.landed ? remotePlayer.landed.walkSpeed || 0 : 0;
    const walkBounce = remotePlayer.landed && !crouching && Math.abs(remoteWalkSpeed) > 1
      ? Math.max(0, Math.sin(remoteWalkCycle * 2)) * 3
      : 0;

    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(bodyRotation);
    ctx.translate(0, -walkBounce);
    ctx.rotate(lean);
    if (crouching) {
      ctx.translate(0, playerFootOffset);
      ctx.scale(1.08, 0.84);
      ctx.translate(0, -playerFootOffset);
    }

    if (!remotePlayer.landed && (remotePlayer.moving || Math.hypot(remotePlayer.vx || 0, remotePlayer.vy || 0) > 34)) {
      drawRemoteJetFlames(time);
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    ctx.lineWidth = 4;

    ctx.fillStyle = damaged ? "#ffd7d7" : "#f4f2ea";
    roundRectPath(-22, 18, 44, 58, 13);
    ctx.fill();
    ctx.stroke();

    drawAstronautLegs(remoteWalkCycle, remoteWalkSpeed, crouching, damaged ? "#e9b9c0" : "#d9dee8");

    ctx.fillStyle = "#f8f5ec";
    roundRectPath(-35, 22, 13, 28, 7);
    ctx.fill();
    ctx.stroke();
    roundRectPath(22, 22, 13, 28, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = damaged ? "#fff1f1" : "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, -23, 38, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    roundRectPath(-45, -29, 10, 25, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(35, -29, 10, 25, 6);
    ctx.fill();
    ctx.stroke();

    const visorGradient = ctx.createLinearGradient(-27, -48, 29, 8);
    visorGradient.addColorStop(0, "#172847");
    visorGradient.addColorStop(0.45, "#050a18");
    visorGradient.addColorStop(1, damaged ? "#69213a" : "#0d3f6a");
    ctx.fillStyle = visorGradient;
    ctx.beginPath();
    ctx.ellipse(0, -24, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
    ctx.beginPath();
    ctx.ellipse(-15, -34, 7, 4, -0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(54, 184, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(12, -18, 11, 7, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cfd7e7";
    roundRectPath(-19, 27, 38, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#172033";
    roundRectPath(-11, 33, 9, 7, 3);
    ctx.fill();
    roundRectPath(2, 33, 9, 7, 3);
    ctx.fill();

    ctx.fillStyle = "#ef6262";
    ctx.beginPath();
    ctx.arc(-7, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64e3ff";
    ctx.beginPath();
    ctx.arc(7, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function remoteBodyPoint(x, y, bob, bodyRotation) {
    const point = rotatePoint(x, y, bodyRotation);
    return {
      x: point.x,
      y: bob + point.y
    };
  }

  function remoteGadgetPoint(aimAngle, bob, x, y) {
    const point = rotatePoint(x, y, aimAngle);
    return {
      x: point.x,
      y: bob + point.y
    };
  }

  function drawRemoteHeldArm(startX, startY, hand, bendLift, handAngle, bob, bodyRotation) {
    const shoulder = remoteBodyPoint(startX, startY, bob, bodyRotation);
    const midX = (shoulder.x + hand.x) / 2;
    const midY = (shoulder.y + hand.y) / 2;
    const dx = hand.x - shoulder.x;
    const dy = hand.y - shoulder.y;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;

    drawGripArm(
      shoulder.x,
      shoulder.y,
      midX + normalX * bendLift,
      midY + normalY * bendLift,
      hand.x,
      hand.y,
      handAngle
    );
  }

  function drawRemoteHeldArms(aimAngle, bob, bodyRotation, layer) {
    const topHand = remoteGadgetPoint(aimAngle, bob, 29, -9);
    const lowerHand = remoteGadgetPoint(aimAngle, bob, 46, 17);

    if (layer === "back") {
      drawRemoteHeldArm(-24, 24, topHand, -18, aimAngle - 0.18, bob, bodyRotation);
      return;
    }

    drawRemoteHeldArm(24, 32, lowerHand, 18, aimAngle + 0.18, bob, bodyRotation);
  }

  function drawRemoteLaserPistol(active, rifle) {
    const barrelLength = rifle ? 76 : 52;
    const muzzleX = 60 + barrelLength;
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

    const barrelGradient = ctx.createLinearGradient(55, -8, muzzleX, 8);
    barrelGradient.addColorStop(0, "#5f6879");
    barrelGradient.addColorStop(0.42, "#fbf7ff");
    barrelGradient.addColorStop(1, "#ff73ad");
    ctx.fillStyle = barrelGradient;
    roundRectPath(55, -9, barrelLength, 18, 7);
    ctx.fill();
    ctx.stroke();

    if (rifle) {
      ctx.fillStyle = "#252b3e";
      roundRectPath(72, 9, 42, 8, 4);
      ctx.fill();
      ctx.stroke();
    }

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
      const flash = ctx.createRadialGradient(muzzleX + 5, 0, 2, muzzleX + 5, 0, 42);
      flash.addColorStop(0, "rgba(255, 255, 255, 0.92)");
      flash.addColorStop(0.35, "rgba(255, 115, 173, 0.66)");
      flash.addColorStop(1, "rgba(255, 115, 173, 0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(muzzleX + 5, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawRemoteSuctionGadget(remotePlayer, time) {
    const active = remotePlayer.toolMode === "pull" || remotePlayer.toolMode === "push" || remotePlayer.toolMode === "hold";
    const energyColor = remotePlayer.toolMode === "hold" ? "#8fffd0" : remotePlayer.toolMode === "push" ? "#ffb35c" : "#67edff";

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

    ctx.fillStyle = "rgba(120, 221, 247, 0.28)";
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
  }

  function drawRemoteTool(remotePlayer, aimAngle, bob, time) {
    if (!remotePlayer.equippedTool) {
      return;
    }

    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(aimAngle);

    if (isWeaponTool(remotePlayer.equippedTool)) {
      drawRemoteLaserPistol(remotePlayer.toolMode === "fire", remotePlayer.equippedTool === "laser-rifle");
    } else {
      drawRemoteSuctionGadget(remotePlayer, time);
    }

    ctx.restore();
  }

  function drawRemotePlayer(remotePlayer, publicName, time) {
    const aimAngle = finiteOr(remotePlayer.aimAngle, Math.atan2(remotePlayer.vy || 0, remotePlayer.vx || 1));
    const bodyRotation = remoteBodyRotation(remotePlayer);
    const bob = remotePlayerBob(remotePlayer, time);

    drawRemoteGadgetField(remotePlayer, aimAngle, time);

    ctx.save();
    ctx.translate(remotePlayer.x, remotePlayer.y);
    ctx.shadowColor = "rgba(88, 226, 255, 0.42)";
    ctx.shadowBlur = 18;
    drawRemoteAstronautSuit(remotePlayer, time, bob, bodyRotation);
    ctx.shadowBlur = 0;
    drawRemoteHeldArms(aimAngle, bob, bodyRotation, "back");
    drawRemoteTool(remotePlayer, aimAngle, bob, time);
    drawRemoteHeldArms(aimAngle, bob, bodyRotation, "front");
    ctx.restore();

    const screen = worldToScreen(remotePlayer.x, remotePlayer.y);
    const pct = clamp(remotePlayer.health / Math.max(1, remotePlayer.maxHealth || 100), 0, 1);
    const label = publicName || remotePlayer.name || "Contact";

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(3, 8, 24, 0.62)";
    roundRectPath(screen.x - 37, screen.y - 91, 74, 8, 4);
    ctx.fill();
    ctx.fillStyle = pct > 0.55 ? "#61f59a" : pct > 0.28 ? "#f5d65b" : "#ff6262";
    roundRectPath(screen.x - 37, screen.y - 91, 74 * pct, 8, 4);
    ctx.fill();

    ctx.font = "800 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(3, 8, 24, 0.68)";
    const widthLabel = Math.min(160, ctx.measureText(label).width + 18);
    roundRectPath(screen.x - widthLabel / 2, screen.y - 120, widthLabel, 22, 8);
    ctx.fill();
    ctx.fillStyle = "#dffcff";
    ctx.fillText(label, screen.x, screen.y - 109, widthLabel - 10);
    ctx.restore();

    drawRemoteInteractionBubble(remotePlayer, screen);
  }

  function drawRemoteInteractionBubble(remotePlayer, screen) {
    const emote = multiplayer.remoteEmotes.get(remotePlayer.id);
    if (!emote) {
      return;
    }

    const alpha = clamp(Math.min(1, emote.life / 0.45), 0, 1);
    const speech = emote.speech || emote.label || "";
    const symbol = emote.emote === "team" ? "+" : emote.emote === "peace" ? "!" : "$";
    const y = screen.y - 154;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.font = "900 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bubbleWidth = Math.min(130, ctx.measureText(speech).width + 42);
    ctx.fillStyle = "rgba(3, 8, 24, 0.78)";
    ctx.strokeStyle = emote.emote === "peace" ? "rgba(255, 229, 111, 0.72)" : "rgba(88, 226, 255, 0.62)";
    ctx.lineWidth = 1.5;
    roundRectPath(screen.x - bubbleWidth / 2, y - 15, bubbleWidth, 30, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = emote.emote === "peace" ? "#ffe56f" : "#58e2ff";
    ctx.fillText(symbol, screen.x - bubbleWidth / 2 + 17, y + 0.5, 18);
    ctx.fillStyle = "#f8fbff";
    ctx.fillText(speech, screen.x + 12, y + 0.5, bubbleWidth - 34);
    ctx.restore();
  }

  function drawGadgetField(aim) {
    if (!canUseSuctionControls() || !isGadgetButtonPressed()) {
      return;
    }

    const holding = mouse.middle;
    const pulling = mouse.left && !holding;
    const centerX = width / 2;
    const centerY = height / 2;
    const mouthX = centerX + aim.local.x * funnelShape.rimX;
    const mouthY = centerY + aim.local.y * funnelShape.rimX;
    const normal = { x: -aim.local.y, y: aim.local.x };
    const fieldLength = holding ? gadgetHoldReach - funnelShape.rimX : pulling ? 320 : 250;
    const time = performance.now() * 0.004;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (let i = 0; i < 10; i += 1) {
      const t = i / 9;
      const side = (t - 0.5) * (holding ? 132 : pulling ? 150 : 122);
      const phase = Math.sin(time + i * 1.7) * 8;
      const startScale = pulling ? fieldLength : 18;
      const endScale = pulling ? 18 : fieldLength;
      const startX = mouthX + aim.local.x * startScale + normal.x * (side + phase);
      const startY = mouthY + aim.local.y * startScale + normal.y * (side + phase);
      const endX = mouthX + aim.local.x * endScale + normal.x * side * 0.18;
      const endY = mouthY + aim.local.y * endScale + normal.y * side * 0.18;

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      if (holding) {
        gradient.addColorStop(0, "rgba(126, 255, 191, 0)");
        gradient.addColorStop(0.5, "rgba(126, 255, 191, 0.38)");
        gradient.addColorStop(1, "rgba(255, 246, 139, 0.5)");
      } else if (pulling) {
        gradient.addColorStop(0, "rgba(114, 244, 255, 0)");
        gradient.addColorStop(0.58, "rgba(114, 244, 255, 0.22)");
        gradient.addColorStop(1, "rgba(229, 109, 255, 0.52)");
      } else {
        gradient.addColorStop(0, "rgba(255, 229, 120, 0.6)");
        gradient.addColorStop(0.62, "rgba(255, 117, 79, 0.26)");
        gradient.addColorStop(1, "rgba(255, 117, 79, 0)");
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = holding ? 2.5 : pulling ? 2 : 3;
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
    const moving = isMoving();
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
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(bendX, bendY, handX, handY);
    ctx.stroke();

    ctx.strokeStyle = "#f8f5ec";
    ctx.lineWidth = 7.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(handAngle);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6.5, 0, 0, Math.PI * 2);
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

  function drawAstronautLeg(x, hipY, footX, footY, bendX, bendY, suitColor, bootColor) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.quadraticCurveTo(bendX, bendY, footX, footY - 6);
    ctx.stroke();

    ctx.strokeStyle = suitColor;
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.save();
    ctx.translate(footX, footY);
    ctx.rotate((footX - x) * 0.012);
    ctx.fillStyle = bootColor;
    roundRectPath(-11, -5, 22, 11, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  function drawAstronautLegs(walkCycle, walkSpeed, crouching, suitColor) {
    const walking = !crouching && Math.abs(walkSpeed || 0) > 1;
    const stride = walking ? clamp(Math.abs(walkSpeed) / 128, 0, 1) : 0;
    const phase = finiteOr(walkCycle, 0);
    const leftStep = Math.sin(phase);
    const rightStep = Math.sin(phase + Math.PI);
    const leftLift = walking ? Math.max(0, Math.cos(phase)) * 7 * stride : 0;
    const rightLift = walking ? Math.max(0, Math.cos(phase + Math.PI)) * 7 * stride : 0;
    const bootColor = "#f6f2e9";

    drawAstronautLeg(
      -13,
      55,
      -13 + leftStep * 10 * stride,
      95 - leftLift,
      -15 - leftStep * 4 * stride,
      73 - leftLift * 0.5,
      suitColor,
      bootColor
    );
    drawAstronautLeg(
      13,
      55,
      13 + rightStep * 10 * stride,
      95 - rightLift,
      15 - rightStep * 4 * stride,
      73 - rightLift * 0.5,
      suitColor,
      bootColor
    );
  }

  function drawAstronautBody(time, localVelocity, bodyRotation) {
    const crouching = player.landed && isMovementKeyPressed("down");
    const walkSpeed = player.landed ? player.landed.walkSpeed || 0 : 0;
    const bob = player.landed ? 0 : Math.sin(time * 0.004) * 2.4;
    const lean = player.landed ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;
    const walkBounce = player.landed && !crouching && Math.abs(walkSpeed) > 1
      ? Math.max(0, Math.sin(player.walkCycle * 2)) * 3
      : 0;

    ctx.save();
    ctx.translate(width / 2, height / 2 + bob);
    ctx.rotate(bodyRotation);
    ctx.translate(0, -walkBounce);
    ctx.rotate(lean);
    if (crouching) {
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
    roundRectPath(-22, 18, 44, 58, 13);
    ctx.fill();
    ctx.stroke();

    drawAstronautLegs(player.walkCycle, walkSpeed, crouching, "#d9dee8");

    ctx.fillStyle = "#f8f5ec";
    roundRectPath(-35, 22, 13, 28, 7);
    ctx.fill();
    ctx.stroke();
    roundRectPath(22, 22, 13, 28, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, -23, 38, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    roundRectPath(-45, -29, 10, 25, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(35, -29, 10, 25, 6);
    ctx.fill();
    ctx.stroke();

    const visorGradient = ctx.createLinearGradient(-27, -48, 29, 8);
    visorGradient.addColorStop(0, "#172847");
    visorGradient.addColorStop(0.45, "#050a18");
    visorGradient.addColorStop(1, "#0d3f6a");
    ctx.fillStyle = visorGradient;
    ctx.beginPath();
    ctx.ellipse(0, -24, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
    ctx.beginPath();
    ctx.ellipse(-15, -34, 7, 4, -0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(54, 184, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(12, -18, 11, 7, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cfd7e7";
    roundRectPath(-19, 27, 38, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#172033";
    roundRectPath(-11, 33, 9, 7, 3);
    ctx.fill();
    roundRectPath(2, 33, 9, 7, 3);
    ctx.fill();

    ctx.fillStyle = "#ef6262";
    ctx.beginPath();
    ctx.arc(-7, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64e3ff";
    ctx.beginPath();
    ctx.arc(7, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawLaserPistol(aim, time, weaponId) {
    const rifle = weaponId === "laser-rifle";
    const weapon = weaponByToolId(weaponId) || playerWeaponDefaults;
    const barrelLength = rifle ? 76 : 52;
    const muzzleX = 60 + barrelLength;
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && mouse.left && toolFireCooldown > weapon.cooldown * 0.45;

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

    const barrelGradient = ctx.createLinearGradient(55, -8, muzzleX, 8);
    barrelGradient.addColorStop(0, "#5f6879");
    barrelGradient.addColorStop(0.42, "#fbf7ff");
    barrelGradient.addColorStop(1, "#ff73ad");
    ctx.fillStyle = barrelGradient;
    roundRectPath(55, -9, barrelLength, 18, 7);
    ctx.fill();
    ctx.stroke();

    if (rifle) {
      ctx.fillStyle = "#252b3e";
      roundRectPath(72, 9, 42, 8, 4);
      ctx.fill();
      ctx.stroke();
    }

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
      const flash = ctx.createRadialGradient(muzzleX + 5, 0, 2, muzzleX + 5, 0, 42);
      flash.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      flash.addColorStop(0.35, "rgba(255, 115, 173, 0.68)");
      flash.addColorStop(1, "rgba(255, 115, 173, 0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(muzzleX + 5, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawSpanner(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && (mouse.left || mouse.right);
    const swing = mouse.right && toolFireCooldown > currentSpannerStrikeCooldown() * 0.55 ? -0.28 : 0;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle + swing);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(8, 14);
    ctx.lineTo(94, -4);
    ctx.stroke();

    const metal = ctx.createLinearGradient(12, -10, 96, 14);
    metal.addColorStop(0, "#8e9aae");
    metal.addColorStop(0.45, "#f8fbff");
    metal.addColorStop(1, "#66e0b8");
    ctx.strokeStyle = metal;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(102, -6, 17, Math.PI * 0.2, Math.PI * 1.42);
    ctx.stroke();
    ctx.strokeStyle = active ? "#66e0b8" : "#f8fbff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#29324c";
    roundRectPath(16, 7, 31, 19, 7);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(102, 224, 184, 0.62)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(100, -6, 28 + Math.sin(time * 0.02) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawGadget(aim, time) {
    if (!equippedToolId) {
      return;
    }

    if (isWeaponTool(equippedToolId)) {
      drawLaserPistol(aim, time, equippedToolId);
      return;
    }
    if (equippedToolId === "spanner") {
      drawSpanner(aim, time);
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && isGadgetButtonPressed();
    const energyColor = mouse.middle ? "#8fffd0" : mouse.right ? "#ffb35c" : "#67edff";

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

    if (deathState.active) {
      const progress = clamp(deathState.timer / deathAnimationDuration, 0, 1);
      const tumble = progress * progress * Math.PI * 1.7;
      const fade = clamp(1 - Math.max(0, progress - 0.45) / 0.55, 0, 1);
      const deathScale = cameraZoom * (1 - progress * 0.18);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(width / 2, height / 2);
      ctx.rotate(tumble);
      ctx.scale(deathScale, deathScale);
      ctx.translate(-width / 2, -height / 2);
      drawAstronautBody(time, localVelocity, bodyRotation + progress * 0.3);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-width / 2, -height / 2);
    drawGadgetField(aim);
    drawAstronautBody(time, localVelocity, bodyRotation);
    drawHeldArms(aim, time, "back");
    drawGadget(aim, time);
    drawHeldArms(aim, time, "front");
    ctx.restore();
    drawPlayerHealthBar();
  }

  function drawPlayerHealthBar() {
    const pct = clamp(player.health / player.maxHealth, 0, 1);
    const energyPct = playerEnergyPct();
    const barWidth = 74;
    const barHeight = 8;
    const barX = width / 2 - barWidth / 2;
    const healthY = height / 2 - 86 * cameraZoom;
    const iconX = barX - 11;

    ctx.save();
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 132, 146, 0.96)";
    ctx.fillText("♥", iconX, healthY + barHeight * 0.5);

    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    roundRectPath(barX, healthY, barWidth, barHeight, 4);
    ctx.fill();
    ctx.fillStyle = pct > 0.55 ? "#61f59a" : pct > 0.28 ? "#f5d65b" : "#ff6262";
    roundRectPath(barX, healthY, barWidth * pct, barHeight, 4);
    ctx.fill();

    if (energyPct < 0.995) {
      const energyY = height / 2 + 82 * cameraZoom;
      ctx.fillStyle = "rgba(157, 255, 122, 0.96)";
      ctx.fillText("⚡", iconX, energyY + barHeight * 0.5);
      ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
      roundRectPath(barX, energyY, barWidth, barHeight, 4);
      ctx.fill();
      ctx.fillStyle = energyPct > 0.35 ? "#9dff7a" : "#f5d65b";
      roundRectPath(barX, energyY, barWidth * energyPct, barHeight, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.74);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.52)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawDeathVignette() {
    const progress = clamp(deathState.timer / deathAnimationDuration, 0, 1);
    const pulse = Math.sin(progress * Math.PI);
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.78);
    gradient.addColorStop(0, "rgba(255, 98, 98, " + (0.06 + pulse * 0.1) + ")");
    gradient.addColorStop(0.46, "rgba(12, 8, 24, " + (0.18 + progress * 0.24) + ")");
    gradient.addColorStop(1, "rgba(0, 0, 0, " + (0.42 + progress * 0.4) + ")");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (progress < 0.82) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 98, 98, " + (0.48 * (1 - progress)) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 80 + progress * Math.max(width, height) * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function mapMarkerRadius(tierName) {
    const sizes = {
      rock: 6.5,
      boulder: 7,
      asteroid: 7.5,
      "dwarf moon": 8,
      moon: 8.5,
      planet: 9.5
    };
    return sizes[tierName] || 6.5;
  }

  function mapMarkerLabel(tierName) {
    const labels = {
      rock: "R",
      boulder: "B",
      asteroid: "A",
      "dwarf moon": "D",
      moon: "M",
      planet: "P"
    };
    return labels[tierName] || "";
  }

  function formatMapDistance(distance) {
    if (distance >= 10000) {
      return Math.round(distance / 1000) + "k";
    }
    if (distance >= 1000) {
      return (distance / 1000).toFixed(distance >= 5000 ? 0 : 1) + "k";
    }
    return Math.round(distance).toString();
  }

  function projectMapPoint(worldX, worldY, centerX, centerY, mapRadius, range) {
    const local = rotatePoint(worldX - player.x, worldY - player.y, cameraRoll);
    const distance = Math.hypot(local.x, local.y);
    const markerLimit = mapRadius - 14;
    const markerScale = markerLimit / range;
    const clamped = distance > range;
    const direction = distance > 0 ? { x: local.x / distance, y: local.y / distance } : { x: 0, y: -1 };

    return {
      x: centerX + (clamped ? direction.x * markerLimit : local.x * markerScale),
      y: centerY + (clamped ? direction.y * markerLimit : local.y * markerScale),
      clamped,
      distance
    };
  }

  function collectRemoteMapContacts() {
    const contacts = {
      bodies: [],
      players: []
    };

    for (const remote of multiplayer.remoteUniverses.values()) {
      const transform = displayTransformFor(remote);
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || transform.alpha <= 0.02) {
        continue;
      }

      const alpha = clamp(transform.alpha, 0, 1);
      for (const body of snapshot.world.particles) {
        if (!isMappedBody(body)) {
          continue;
        }
        contacts.bodies.push({
          body: transformedRemoteEntity(body, transform),
          alpha,
          publicName: remote.publicName
        });
      }

      if (snapshot.player) {
        contacts.players.push({
          player: transformedRemoteEntity(snapshot.player, transform),
          alpha,
          publicName: remote.publicName
        });
      }
    }

    return contacts;
  }

  function drawMapBodyMarker(body, marker, options) {
    const markerRadius = mapMarkerRadius(body.tier.name);
    const label = mapMarkerLabel(body.tier.name);
    const alpha = clamp(options && Number.isFinite(options.alpha) ? options.alpha : 1, 0, 1);
    const remote = Boolean(options && options.remote);
    const haloAlpha = marker.clamped ? 0.12 : 0.15;

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = remote ? "rgba(88, 226, 255, " + 0.24 * alpha + ")" : colorString(body.color, haloAlpha * alpha);
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, markerRadius * (remote ? 1.85 : 1.55), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(body.color, remote ? 0.64 * alpha : 0.8 * alpha);
    ctx.strokeStyle = remote ? "rgba(88, 226, 255, " + 0.94 * alpha + ")" : marker.clamped ? "rgba(255, 255, 255, 0.86)" : "rgba(3, 8, 24, 0.86)";
    ctx.lineWidth = remote ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, markerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (label) {
      ctx.strokeStyle = "rgba(3, 8, 24, " + 0.82 * alpha + ")";
      ctx.lineWidth = 2.6;
      ctx.fillStyle = remote ? "rgba(223, 252, 255, " + alpha + ")" : "#f8fbff";
      ctx.font = "900 " + Math.max(14, Math.round(markerRadius * 1.8)) + "px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(label, marker.x, marker.y + 0.2);
      ctx.fillText(label, marker.x, marker.y + 0.2);
    }

    if (options && options.showDistance) {
      drawMapDistanceLabel(marker.x, marker.y + markerRadius + 8, marker.distance, remote ? alpha : 0.86, remote);
    }
  }

  function drawMapPlayerMarker(contact, marker) {
    const alpha = clamp(contact.alpha, 0, 1);
    const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.12;

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 115, 173, " + 0.22 * alpha + ")";
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 15 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "rgba(255, 245, 251, " + 0.96 * alpha + ")";
    ctx.strokeStyle = "rgba(255, 115, 173, " + 0.96 * alpha + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marker.x, marker.y - 8);
    ctx.lineTo(marker.x + 8, marker.y + 7);
    ctx.lineTo(marker.x, marker.y + 3);
    ctx.lineTo(marker.x - 8, marker.y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (marker.clamped) {
      ctx.fillStyle = "rgba(255, 115, 173, " + 0.92 * alpha + ")";
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawMapDistanceLabel(marker.x, marker.y + 17, marker.distance, alpha, true);
  }

  function drawMapDistanceLabel(x, y, distance, alpha, remote) {
    const label = formatMapDistance(distance);
    const labelWidth = Math.min(46, ctx.measureText(label).width + 8);

    ctx.save();
    ctx.font = "850 8px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = remote ? "rgba(4, 18, 28, " + 0.58 * alpha + ")" : "rgba(3, 8, 24, " + 0.58 * alpha + ")";
    roundRectPath(x - labelWidth / 2, y - 6, labelWidth, 12, 5);
    ctx.fill();
    ctx.fillStyle = remote ? "rgba(223, 252, 255, " + alpha + ")" : "rgba(248, 251, 255, " + alpha + ")";
    ctx.fillText(label, x, y + 0.2, labelWidth - 4);
    ctx.restore();
  }

  function drawMapRangeLabel(centerX, centerY, radius, label) {
    const x = centerX + radius * 0.72;
    const y = centerY - radius * 0.72;
    const labelWidth = Math.min(54, ctx.measureText(label).width + 10);

    ctx.save();
    ctx.font = "850 8px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(3, 8, 24, 0.68)";
    roundRectPath(x - labelWidth / 2, y - 6, labelWidth, 12, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(223, 252, 255, 0.82)";
    ctx.fillText(label, x, y + 0.2, labelWidth - 4);
    ctx.restore();
  }

  function drawMapOverlay() {
    if (isCompactHudViewport() && !mapHudOpen) {
      return;
    }

    const margin = width <= 560 ? 10 : 16;
    const size = Math.round(clamp(Math.min(width, height) * (width <= 560 ? 0.34 : 0.31), width <= 560 ? 160 : 190, width <= 560 ? 228 : 292));
    const x = width - margin - size;
    const compactControlsClearance = isCompactHudViewport() ? 58 : 0;
    const y = Math.max(margin, height - margin - compactControlsClearance - size);
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const mapRadius = size * 0.41;
    const bodies = particles.filter(isMappedBody).sort((a, b) => a.mass - b.mass);
    const remoteContacts = collectRemoteMapContacts();
    let farthest = 0;

    for (const body of bodies) {
      farthest = Math.max(farthest, Math.hypot(body.x - player.x, body.y - player.y));
    }
    for (const contact of remoteContacts.bodies) {
      farthest = Math.max(farthest, Math.hypot(contact.body.x - player.x, contact.body.y - player.y));
    }
    for (const contact of remoteContacts.players) {
      farthest = Math.max(farthest, Math.hypot(contact.player.x - player.x, contact.player.y - player.y));
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
      const ringRadius = (mapRadius / 3) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      drawMapRangeLabel(centerX, centerY, ringRadius, formatMapDistance((range / 3) * i));
    }

    ctx.beginPath();
    ctx.moveTo(centerX - mapRadius, centerY);
    ctx.lineTo(centerX + mapRadius, centerY);
    ctx.moveTo(centerX, centerY - mapRadius);
    ctx.lineTo(centerX, centerY + mapRadius);
    ctx.stroke();

    for (const body of bodies) {
      const marker = projectMapPoint(body.x, body.y, centerX, centerY, mapRadius, range);
      drawMapBodyMarker(body, marker, { showDistance: body.tier.name === "moon" || body.tier.name === "planet" || marker.clamped });
    }

    for (const contact of remoteContacts.bodies) {
      const marker = projectMapPoint(contact.body.x, contact.body.y, centerX, centerY, mapRadius, range);
      drawMapBodyMarker(
        contact.body,
        marker,
        { remote: true, alpha: contact.alpha, showDistance: true }
      );
    }

    for (const contact of remoteContacts.players) {
      drawMapPlayerMarker(contact, projectMapPoint(contact.player.x, contact.player.y, centerX, centerY, mapRadius, range));
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

    const healthPct = Math.round(clamp(player.health / player.maxHealth, 0, 1) * 100);
    healthValue.textContent = "HP: " + healthPct + "%";
    healthFill.style.width = healthPct + "%";
    if (energyValue && energyFill) {
      const energyPct = Math.round(playerEnergyPct() * 100);
      energyValue.textContent = "EP: " + Math.round(player.energy) + "/" + Math.round(player.maxEnergy);
      energyFill.style.width = energyPct + "%";
    }
    updateDifficultyUi();
    if (scoreValue) {
      scoreValue.textContent = Math.max(0, Math.round(lifeStats.bestScore || lifeStats.currentScore || 0)) + " pts";
    }

    const progressBody = findNearestProgressBody() || largestParticle;
    const progressMass = progressBody ? progressBody.mass : largest;
    const tier = progressBody ? progressBody.tier : bodyTiers[0];
    const nextTier = nextTierAfter(tier);
    const roundedProgressMass = Math.max(0, Math.round(progressMass));
    currentBodyLabel.textContent = formatTierName(tier.name).toUpperCase() + ":";
    if (!nextTier) {
      nextMilestoneLabel.textContent = "MAX";
      nextMilestoneValue.textContent = roundedProgressMass + " / " + Math.round(tier.threshold) + "+";
      milestoneFill.style.width = "100%";
      if (leaderboard.open) {
        renderLeaderboard();
      }
      return;
    }

    const start = tier.threshold;
    const end = nextTier.threshold;
    const progress = clamp((progressMass - start) / (end - start), 0, 1);
    nextMilestoneLabel.textContent = formatTierName(nextTier.name).toUpperCase();
    nextMilestoneValue.textContent = roundedProgressMass + " / " + Math.round(end);
    milestoneFill.style.width = Math.round(progress * 100) + "%";

    if (leaderboard.open) {
      renderLeaderboard();
    }
  }

  function tick(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
    lastTime = now;

    if (!runState.active) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawParticles(now);
      updateHud();
      requestAnimationFrame(tick);
      return;
    }

    if (deathState.active) {
      updateDeath(dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawParticles(now);
      drawRemoteUniverses(now);
      drawRivals(now);
      drawPlayer(now);
      drawDeathVignette();
      updateHud();
      requestAnimationFrame(tick);
      return;
    }

    if (gamePaused) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawParticles(now);
      drawRemoteUniverses(now);
      drawRivals(now);
      drawPlayer(now);
      drawVignette();
      drawMapOverlay();
      updateHud();
      requestAnimationFrame(tick);
      return;
    }

    updateLifeStats();
    updateToolDisable(dt);
    updateEnergySystems(dt);
    updateToolEnergyUsage(dt);
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
    updateEngineers(dt);
    updateTeslas(dt);
    updateRockets(dt);
    updateFighters(dt);
    updateStructures(dt);
    updatePlayerLasers(dt);
    updateLauncherMissiles(dt);
    resolveShieldGeneratorMobCollisions(dt);
    resolveMobBodyCollisions();
    damageMobsWithProjectiles();
    resolveRemoteBodyPlayerCollisions();
    resolveRemoteBodyMobCollisions();
    updateSparks(dt);
    updateHealthPickups(dt);
    updateTechPickups(dt);
    updatePersistence(dt);
    updateMultiplayer(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawParticles(now);
    drawRemoteUniverses(now);
    drawRivals(now);
    drawPlayer(now);
    drawVignette();
    drawMapOverlay();
    updateHud();

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", function () {
    resize();
    syncCompactHudControls();
    if (techLedger && techLedger.style.left && techLedger.style.top) {
      const rect = techLedger.getBoundingClientRect();
      clampTechLedgerPosition(rect.left, rect.top);
    }
  });
  window.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
  window.addEventListener("keydown", unlockAudio, { once: true, capture: true });

  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      setSoundEnabled(!soundState.enabled);
    });
  }

  if (settingsToggle) {
    settingsToggle.addEventListener("click", function () {
      setSettingsOpen(!settingsOpen);
    });
  }

  if (settingsClose) {
    settingsClose.addEventListener("click", function () {
      setSettingsOpen(false);
    });
  }

  if (settingsPanel) {
    settingsPanel.addEventListener("click", function (event) {
      event.stopPropagation();

      const button = closestEventTarget(event, "button[data-control-action]");
      if (!button) {
        return;
      }

      pendingControlRemap = button.dataset.controlAction || null;
      renderControlBindings();
    });
  }

  if (uiScaleInput) {
    uiScaleInput.addEventListener("input", function () {
      applyUiScale(Number(uiScaleInput.value) / 100);
      writeGameSettings();
    });
  }

  if (zoomInput) {
    zoomInput.addEventListener("input", function () {
      setCameraZoom(sliderValueToCameraZoom(zoomInput.value));
    });
  }

  if (surfaceCameraRotationInput) {
    surfaceCameraRotationInput.addEventListener("change", function () {
      applySurfaceCameraRotationSetting(surfaceCameraRotationInput.checked);
    });
  }

  if (accountLoginForm) {
    accountLoginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void submitAccountAuth(false);
    });
  }

  if (accountSignupButton) {
    accountSignupButton.addEventListener("click", function () {
      void submitAccountAuth(true);
    });
  }

  if (accountLogoutButton) {
    accountLogoutButton.addEventListener("click", function () {
      void logoutAccount();
    });
  }

  if (crazyGamesLoginButton) {
    crazyGamesLoginButton.addEventListener("click", function () {
      void promptCrazyGamesLogin();
    });
  }

  if (saveGameForm) {
    saveGameForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void saveManualGame();
    });
  }

  if (loadGameForm) {
    loadGameForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void loadManualGame(loadGameNameInput && loadGameNameInput.value);
    });
  }

  if (savedGameList) {
    savedGameList.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-save-id]");
      if (!button || !button.dataset.saveId) {
        return;
      }

      void loadManualGame(button.dataset.saveId);
    });
  }

  if (resetControlsButton) {
    resetControlsButton.addEventListener("click", resetControlBindings);
  }

  if (onlineToggle) {
    onlineToggle.addEventListener("click", function () {
      const open = multiplayer.socialMode === "online" ? !multiplayer.panelOpen : true;
      setSocialPanelOpen(open, "online");
    });
  }

  if (leaderboardToggle) {
    leaderboardToggle.addEventListener("click", function () {
      setLeaderboardOpen(!leaderboard.open);
    });
  }

  if (resourcesToggle) {
    resourcesToggle.addEventListener("click", function () {
      setResourcesHudOpen(!resourcesHudOpen);
    });
  }

  if (buildToggle) {
    buildToggle.addEventListener("click", function () {
      setBuildMenuOpen(!buildMenuOpen);
    });
  }

  if (mapToggle) {
    mapToggle.addEventListener("click", function () {
      setMapHudOpen(!mapHudOpen);
    });
  }

  if (techLedgerTitle) {
    techLedgerTitle.addEventListener("pointerdown", beginTechLedgerDrag);
  }

  if (techLedger) {
    techLedger.addEventListener("pointermove", updateTechLedgerDrag);
    techLedger.addEventListener("pointerup", endTechLedgerDrag);
    techLedger.addEventListener("pointercancel", endTechLedgerDrag);
  }

  if (socialPanelClose) {
    socialPanelClose.addEventListener("click", function () {
      setSocialPanelOpen(false);
    });
  }

  if (playerSearch) {
    playerSearch.addEventListener("input", function () {
      window.clearTimeout(playerSearch._searchTimer);
      playerSearch._searchTimer = window.setTimeout(function () {
        void refreshPlayerSearch();
      }, 180);
    });
  }

  if (friendsOnlyFilter) {
    friendsOnlyFilter.addEventListener("change", function () {
      void refreshPlayerSearch();
    });
  }

  if (playerSearchList) {
    playerSearchList.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-player-id]");
      if (!button) {
        return;
      }

      const targetPlayerId = button.dataset.playerId || "";
      if (button.dataset.action === "invite") {
        inviteFriend(targetPlayerId);
      }
    });
  }

  if (investigateSignal) {
    investigateSignal.addEventListener("click", function () {
      choosePendingSignal("investigate");
    });
  }

  if (avoidSignal) {
    avoidSignal.addEventListener("click", function () {
      choosePendingSignal("avoid");
    });
  }

  if (difficultyScreen) {
    difficultyScreen.addEventListener("click", function (event) {
      const button = closestEventTarget(event, ".difficulty-card");
      if (!button || !button.dataset.difficulty) {
        return;
      }
      void beginRunWithDifficulty(button.dataset.difficulty);
    });
  }

  if (commandInput) {
    commandInput.addEventListener("input", function () {
      multiplayer.commandCompletions = [];
      multiplayer.commandCompletionIndex = 0;
      updateCommandHint();
    });

    commandInput.addEventListener("keydown", function (event) {
      if (event.code === "Tab") {
        event.preventDefault();
        completeTeleportCommand();
        return;
      }

      if (event.code === "Enter") {
        event.preventDefault();
        void executeCommand(commandInput.value);
        return;
      }

      if (event.code === "Escape") {
        event.preventDefault();
        setCommandOpen(false);
      }
    });
  }

  if (playAgainButton) {
    playAgainButton.addEventListener("click", function () {
      void hardResetAfterDeath();
    });
  }

  if (deathLeaderboardForm) {
    deathLeaderboardForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void saveDeathLeaderboardRun();
    });
    deathLeaderboardForm.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

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
      if (!card) {
        return;
      }

      selectedBuildRecipeId = card.dataset.recipeId;
      renderBuildMenu();
    });
  }

  if (buildMenuClose) {
    buildMenuClose.addEventListener("click", function () {
      setBuildMenuOpen(false);
    });
  }

  if (buildMenuDetail) {
    buildMenuDetail.addEventListener("click", function (event) {
      const upgradeAction = closestEventTarget(event, ".build-detail__upgrade-action");
      if (upgradeAction) {
        if (!upgradeAction.disabled) {
          upgradeTool(upgradeAction.dataset.toolId, upgradeAction.dataset.upgradeId);
        }
        return;
      }

      const action = closestEventTarget(event, ".build-detail__action");
      if (!action || action.disabled) {
        return;
      }

      craftRecipe(action.dataset.recipeId);
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

  if (playerInteractionChoices) {
    playerInteractionChoices.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-choice]");
      if (!button) {
        return;
      }

      choosePlayerInteraction(button.dataset.choice);
    });
  }

  if (tradeClose) {
    tradeClose.addEventListener("click", closeTradeSession);
  }

  if (tradeOfferList) {
    tradeOfferList.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-trade-key]");
      if (!button) {
        return;
      }

      adjustTradeOffer(button.dataset.tradeKey, Number(button.dataset.tradeDelta) || 0);
    });
  }

  if (tradeSendOffer) {
    tradeSendOffer.addEventListener("click", sendTradeOffer);
  }

  if (tradeAccept) {
    tradeAccept.addEventListener("click", acceptTradeOffer);
  }

  window.addEventListener("keydown", function (event) {
    if (!settingsOpen) {
      return;
    }

    if (pendingControlRemap) {
      event.preventDefault();
      event.stopImmediatePropagation();
      remapControl(pendingControlRemap, event.code);
      return;
    }

    if (event.code === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      setSettingsOpen(false);
    }
  });

  window.addEventListener("keydown", function (event) {
    if (isBrowserScrollKey(event) && !settingsOpen && !isEditableEventTarget(event) && !isKeyboardControlEventTarget(event)) {
      event.preventDefault();
    }

    if (settingsOpen) {
      if (!isEditableEventTarget(event)) {
        event.preventDefault();
      }
      return;
    }

    if (!runState.active) {
      return;
    }

    if (deathState.active) {
      if (event.target === deathRunNameInput) {
        return;
      }
      if (event.target === deathLeaderboardButton) {
        return;
      }
      if (event.target === playAgainButton) {
        return;
      }

      event.preventDefault();
      return;
    }

    if (multiplayer.commandOpen) {
      if (commandInput && document.activeElement !== commandInput) {
        focusCommandInput();

        if (event.key && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          const start = commandInput.selectionStart ?? commandInput.value.length;
          const end = commandInput.selectionEnd ?? start;
          commandInput.value = commandInput.value.slice(0, start) + event.key + commandInput.value.slice(end);
          commandInput.setSelectionRange(start + event.key.length, start + event.key.length);
          commandInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      return;
    }

    if (multiplayer.interactionMenu) {
      if (event.code === "Escape") {
        event.preventDefault();
        setPlayerInteractionMenu(false);
        return;
      }
      if (event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        movePlayerInteractionSelection(-1);
        return;
      }
      if (event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        movePlayerInteractionSelection(1);
        return;
      }
      if (event.code === "Enter") {
        event.preventDefault();
        const selected = playerInteractionChoicesConfig[multiplayer.interactionMenu.selectedIndex];
        choosePlayerInteraction(selected && selected.key);
        return;
      }
      if (/^Digit[1-3]$/.test(event.code)) {
        event.preventDefault();
        const selected = playerInteractionChoicesConfig[Number(event.code.slice(5)) - 1];
        choosePlayerInteraction(selected && selected.key);
        return;
      }
    }

    if (event.code === "Enter" && !event.repeat && !buildMenuOpen && !leaderboard.open && !isEditableEventTarget(event)) {
      if (beginNearbyInteraction()) {
        event.preventDefault();
        return;
      }
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && !isEditableEventTarget(event)) {
      if (event.key === "+" || event.code === "NumpadAdd") {
        event.preventDefault();
        adjustCameraZoom(1);
        return;
      }
      if (event.key === "-" || event.code === "NumpadSubtract") {
        event.preventDefault();
        adjustCameraZoom(-1);
        return;
      }
      if (event.code === "KeyT" && !event.repeat) {
        event.preventDefault();
        setResourcesHudOpen(!resourcesHudOpen);
        return;
      }
    }

    if (event.code === "Slash" && !event.repeat) {
      event.preventDefault();
      setCommandOpen(true);
      return;
    }

    if (!event.repeat && /^Digit[1-9]$/.test(event.code)) {
      const slot = Number(event.code.slice(5)) - 1;
      if (hotbarToolIds[slot]) {
        event.preventDefault();
        selectTool(hotbarToolIds[slot]);
        return;
      }
    }

    if (event.code === controlCodeFor("build") && !event.repeat) {
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
    if (event.code === "Escape" && leaderboard.open) {
      event.preventDefault();
      setLeaderboardOpen(false);
      return;
    }
    if (event.code === "Escape" && multiplayer.pendingSignal) {
      event.preventDefault();
      choosePendingSignal("avoid");
      return;
    }
    if (event.code === "Escape" && multiplayer.panelOpen) {
      event.preventDefault();
      setSocialPanelOpen(false);
      return;
    }
    if (event.code === "Escape" && !event.repeat && !isEditableEventTarget(event)) {
      event.preventDefault();
      setSettingsOpen(true);
      return;
    }

    const controlCodes = [controlCodeFor("rollLeft"), controlCodeFor("rollRight"), controlCodeFor("land")];
    if (movementControlCodes.has(event.code) || controlCodes.includes(event.code) || event.code === "ShiftLeft" || event.code === "ShiftRight") {
      event.preventDefault();
      if (event.code === controlCodeFor("land") && !event.repeat) {
        toggleLanding();
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
    resetMouseButtons();
  });

  window.addEventListener("mousemove", function (event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.seen = true;
  });

  window.addEventListener("mousedown", function (event) {
    if (deathState.active || !runState.active) {
      return;
    }

    if (closestEventTarget(event, ".build-menu, .tool-hotbar, .online-toggle, .sound-toggle, .settings-toggle, .settings-panel, .social-panel, .signal-panel, .command-panel, .player-interaction, .trade-panel, .leaderboard-panel, .hud__leaderboard-toggle, .compact-hud-toggles, .tech-ledger")) {
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

    if (areToolsDisabled()) {
      event.preventDefault();
      resetMouseButtons();
      return;
    }

    if (event.button === 0) {
      if (handleCommunicationRelayClick()) {
        event.preventDefault();
        mouse.left = false;
        return;
      }

      mouse.left = true;
      if (isSuctionEquipped()) {
        playSound("gadgetSuck", { throttleKey: "gadget", throttle: 0.12 });
      }
    }
    if (event.button === 1) {
      event.preventDefault();
      mouse.middle = true;
      if (isSuctionEquipped()) {
        playSound("gadgetSuck", { throttleKey: "gadget", throttle: 0.12 });
      }
    }
    if (event.button === 2) {
      mouse.right = true;
      if (isSuctionEquipped()) {
        playSound("gadgetBlow", { throttleKey: "gadget", throttle: 0.12 });
      }
    }
  });

  window.addEventListener("mouseup", function (event) {
    if (deathState.active || !runState.active) {
      resetMouseButtons();
      return;
    }

    if (closestEventTarget(event, ".build-menu, .tool-hotbar, .online-toggle, .sound-toggle, .settings-toggle, .settings-panel, .social-panel, .signal-panel, .command-panel, .player-interaction, .trade-panel, .leaderboard-panel, .hud__leaderboard-toggle, .compact-hud-toggles, .tech-ledger")) {
      return;
    }

    if (event.button === 0) {
      mouse.left = false;
    }
    if (event.button === 1) {
      event.preventDefault();
      mouse.middle = false;
    }
    if (event.button === 2) {
      mouse.right = false;
    }
  });

  window.addEventListener("auxclick", function (event) {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  window.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  window.addEventListener("wheel", function (event) {
    if (deathState.active || !runState.active) {
      event.preventDefault();
      return;
    }

    if (closestEventTarget(event, ".build-menu, .tool-hotbar, .online-toggle, .sound-toggle, .settings-toggle, .settings-panel, .social-panel, .signal-panel, .command-panel, .player-interaction, .trade-panel, .leaderboard-panel, .hud__leaderboard-toggle, .compact-hud-toggles, .tech-ledger")) {
      return;
    }
    if (hotbarToolIds.length < 2) {
      return;
    }

    event.preventDefault();
    cycleTool(event.deltaY >= 0 ? 1 : -1);
  }, { passive: false });

  async function startGame() {
    initializeNetworkIdentity();
    await bootstrapAccountSession();
    void initializeCrazyGamesIntegration().then(function () {
      updateCrazyGamesGameplayState("sdk-ready");
    });
    applyUiScale(gameSettings.uiScale);
    setCameraZoom(gameSettings.zoom);
    updateSurfaceCameraRotationUi();
    renderControlBindings();
    initializeTechUi();
    updateSoundToggle();
    resize();
    syncCompactHudControls();
    seedStarDust();
    seedParticles();
    applyDifficulty(defaultDifficultyId);
    resetLifeStats();
    setDifficultyScreenOpen(true);
    void refreshLeaderboard(true);
    updateOnlineUi();
    updateAccountUi();

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
