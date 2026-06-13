(function () {
  "use strict";

  const mpV2Sim = window.ClusternautsMpV2Sim || null;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const healthValue = document.getElementById("healthValue");
  const healthFill = document.getElementById("healthFill");
  const energyValue = document.getElementById("energyValue");
  const energyFill = document.getElementById("energyFill");
  const scoreValue = document.getElementById("scoreValue");
  const difficultyValue = document.getElementById("difficultyValue");
  const gameVitalsHud = document.getElementById("gameVitalsHud");
  const touchLandButton = document.getElementById("touchLandButton");
  const currentBodyLabel = document.getElementById("currentBodyLabel");
  const nextMilestoneLabel = document.getElementById("nextMilestoneLabel");
  const nextMilestoneValue = document.getElementById("nextMilestoneValue");
  const milestoneFill = document.getElementById("milestoneFill");
  const leaderboardToggle = document.getElementById("leaderboardToggle");
  const leaderboardPanel = document.getElementById("leaderboardPanel");
  const leaderboardList = document.getElementById("leaderboardList");
  const vitalsToggle = document.getElementById("vitalsToggle");
  const resourcesToggle = document.getElementById("resourcesToggle");
  const buildToggle = document.getElementById("buildToggle");
  const mapToggle = document.getElementById("mapToggle");
  const touchJoystick = document.getElementById("touchJoystick");
  const touchJoystickStick = document.getElementById("touchJoystickStick");
  const touchFireJoystick = document.getElementById("touchFireJoystick");
  const touchFireJoystickStick = document.getElementById("touchFireJoystickStick");
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
  const settingsSections = settingsPanel ? Array.from(settingsPanel.querySelectorAll("[data-settings-section]")) : [];
  const settingsSectionToggles = settingsPanel ? Array.from(settingsPanel.querySelectorAll("[data-settings-section-toggle]")) : [];
  const uiScaleInput = document.getElementById("uiScaleInput");
  const uiScaleValue = document.getElementById("uiScaleValue");
  const zoomInput = document.getElementById("zoomInput");
  const zoomValue = document.getElementById("zoomValue");
  const surfaceCameraRotationInput = document.getElementById("surfaceCameraRotationInput");
  const touchScreenInput = document.getElementById("touchScreenInput");
  const hudEnabledInput = document.getElementById("hudEnabledInput");
  const multiplayerToggleInput = document.getElementById("multiplayerToggleInput");
  const settingsJoinCodeValue = document.getElementById("settingsJoinCodeValue");
  const copySettingsJoinCodeButton = document.getElementById("copySettingsJoinCodeButton");
  const multiplayerStatus = document.getElementById("multiplayerStatus");
  const multiplayerPanelStatus = document.getElementById("multiplayerPanelStatus");
  const multiplayerPanelToggle = document.getElementById("multiplayerPanelToggle");
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
  const restartGameButton = document.getElementById("restartGameButton");
  const restartGameConfirm = document.getElementById("restartGameConfirm");
  const restartGamePrompt = document.getElementById("restartGamePrompt");
  const restartGameSaveFirstButton = document.getElementById("restartGameSaveFirstButton");
  const restartGameAnywayButton = document.getElementById("restartGameAnywayButton");
  const restartGameCancelButton = document.getElementById("restartGameCancelButton");
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
  const startMenuBack = document.getElementById("startMenuBack");
  const startMenuEyebrow = document.getElementById("startMenuEyebrow");
  const startMenuTitle = document.getElementById("startMenuTitle");
  const startSavedGameList = document.getElementById("startSavedGameList");
  const lobbyCodeInput = document.getElementById("lobbyCodeInput");
  const joinLobbyButton = document.getElementById("joinLobbyButton");
  const lobbyCodeValue = document.getElementById("lobbyCodeValue");
  const copyLobbyCodeButton = document.getElementById("copyLobbyCodeButton");
  const lobbyDifficultySelect = document.getElementById("lobbyDifficultySelect");
  const lobbyDifficultyToggle = document.getElementById("lobbyDifficultyToggle");
  const lobbyDifficultyMenu = document.getElementById("lobbyDifficultyMenu");
  const lobbyPlayerSlots = document.getElementById("lobbyPlayerSlots");
  const lobbyPlayerSearch = document.getElementById("lobbyPlayerSearch");
  const lobbyPlayerSearchList = document.getElementById("lobbyPlayerSearchList");
  const startLobbyButton = document.getElementById("startLobbyButton");
  const leaveLobbyButton = document.getElementById("leaveLobbyButton");
  const lobbyStatus = document.getElementById("lobbyStatus");
  const menuSoundToggle = document.getElementById("menuSoundToggle");
  const menuUiScaleInput = document.getElementById("menuUiScaleInput");
  const menuUiScaleValue = document.getElementById("menuUiScaleValue");
  const menuZoomInput = document.getElementById("menuZoomInput");
  const menuZoomValue = document.getElementById("menuZoomValue");
  const menuSurfaceCameraRotationInput = document.getElementById("menuSurfaceCameraRotationInput");
  const menuTouchScreenInput = document.getElementById("menuTouchScreenInput");
  const menuResetControlsButton = document.getElementById("menuResetControlsButton");
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
  const deathMainMenuButton = document.getElementById("deathMainMenuButton");
  const externalBackendOrigin = "https://36ff-92-29-230-204.ngrok-free.app";
  const serverMaintenanceMessage = "Server is down for maintenance.  Please try again later";
  const crazyGamesState = {
    sdk: null,
    initPromise: null,
    initialized: false,
    muteAudio: false,
    gameplayActive: false,
    gameplayEventsDisabled: false,
    settingsListener: null,
    authListener: null,
    roomJoinListener: null,
    authAvailable: true,
    authPromptActive: false,
    user: null,
    instantMultiplayer: false,
    instantMultiplayerHandled: false,
    initialInviteHandled: false,
    lastRoomReport: "",
    lastInviteLinkKey: "",
    inviteLinkPending: false,
    inviteLink: ""
  };
  const crazyGamesRoomMaxPlayers = 4;
  const clusternautsTestConfig = window.__CLUSTERNAUTS_TEST__ || null;
  const joinedPlayerIsolationStorageKey = "clusternauts.debug.joinedPlayerIsolation";
  const joinedPlayerIsolationComponentsStorageKey = "clusternauts.debug.joinedPlayerComponents";
  const joinedPlayerIsolationComponentDefaults = Object.freeze({
    hostWorldSnapshots: false,
    partyPlayerSnapshots: false,
    partyPhysicsAuthority: false,
    partyPhysicsRejects: false,
    partyInput: true,
    partyInputGadgetState: false,
    localPhysicsLeases: false,
    relayHostEntityEffects: false,
    followerWorldSmoothing: false,
    followerGadgetPrediction: false,
    followerPickupPrediction: false,
    followerBodyCollisions: false
  });
  const joinedPlayerIsolation = {
    enabled: false,
    components: { ...joinedPlayerIsolationComponentDefaults }
  };
  const clusternautsTestCounters = {
    particleMerges: 0,
    bodyBounces: 0,
    buildMenuRenders: 0
  };
  let lastClientErrorReportAt = -Infinity;
  let lastServerMaintenanceNoticeAt = -Infinity;

  installClientErrorReporting();

  const keys = new Set();
  const settingsStorageKey = "clusternauts.settings";
  const legacySettingsStorageKey = "spaice.settings";
  const manualSaveStoragePrefix = "clusternauts.manualSave.";
  const legacyManualSaveStoragePrefix = "spaice.manualSave.";
  const accountSessionStorageKey = "clusternauts.accountSession";
  const playerIdStorageKey = "clusternauts.playerId";
  const legacyPlayerIdStorageKey = "spaice.playerId";
  const multiplayerPreferenceStorageKey = "clusternauts.multiplayer.enabled";
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
  let vitalsHudOpen = false;
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
    if (value.startsWith("/api") && shouldUseExternalBackend()) {
      return backendOrigin() + value;
    }
    return value;
  }

  function websocketUrl() {
    if (shouldUseExternalBackend()) {
      return backendOrigin().replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/ws";
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return protocol + "//" + window.location.host + "/ws";
  }

  function shouldUseExternalBackend() {
    if (configuredBackendOrigin()) {
      return true;
    }
    if (isCrazyGamesRuntime()) {
      return true;
    }
    return false;
  }

  function backendOrigin() {
    return configuredBackendOrigin() || externalBackendOrigin;
  }

  function configuredBackendOrigin() {
    return typeof window.CLUSTERNAUTS_BACKEND_ORIGIN === "string" ? window.CLUSTERNAUTS_BACKEND_ORIGIN.replace(/\/+$/, "") : "";
  }

  function createServerMaintenanceError(cause) {
    const error = new Error(serverMaintenanceMessage);
    error.name = "ServerMaintenanceError";
    error.cause = cause;
    return error;
  }

  function isServerMaintenanceError(error) {
    return Boolean(error && error.message === serverMaintenanceMessage);
  }

  function backendErrorMessage(error, fallback) {
    return isServerMaintenanceError(error) ? serverMaintenanceMessage : fallback;
  }

  function notifyServerMaintenance() {
    const now = performance.now();
    if (now - lastServerMaintenanceNoticeAt < 15000) {
      return;
    }
    lastServerMaintenanceNoticeAt = now;
    maybeNotifyText(serverMaintenanceMessage, { groupKey: "server-maintenance" });
  }

  function isLocalDevelopmentHost(hostName) {
    const host = String(hostName || "").toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    return (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "" ||
      host.endsWith(".localhost") ||
      isPrivateIpv4Host(host)
    );
  }

  function isPrivateIpv4Host(hostName) {
    const parts = String(hostName || "").split(".");
    if (parts.length !== 4) {
      return false;
    }

    const octets = parts.map((part) => Number(part));
    if (octets.some((octet, index) => !Number.isInteger(octet) || octet < 0 || octet > 255 || String(octet) !== parts[index])) {
      return false;
    }

    return (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 169 && octets[1] === 254)
    );
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
  const gameplayPointerBlockSelector = ".build-menu, .tool-hotbar, .online-toggle, .sound-toggle, .settings-toggle, .settings-panel, .social-panel, .signal-panel, .command-panel, .player-interaction, .trade-panel, .leaderboard-panel, .hud__leaderboard-toggle, .hud__land-action, .compact-hud-toggles, .touch-joystick, .tech-ledger";
  const touchControlState = {
    active: false,
    pointerId: null,
    fireButton: "",
    fireReady: false,
    aimX: 0,
    aimY: -1,
    toolsSuppressed: false,
    lastTapAt: -Infinity,
    lastTapX: 0,
    lastTapY: 0,
    suppressMouseUntil: -Infinity
  };
  const touchJoystickState = {
    active: false,
    pointerId: null,
    moveX: 0,
    moveY: 0,
    boost: false,
    lastTapAt: -Infinity,
    lastTapX: 0,
    lastTapY: 0
  };
  const touchMoveAxisThreshold = 0.26;
  const touchDoubleTapWindow = 340;
  const touchDoubleTapDistance = 56;

  function isKeyboardMovementKeyPressed(direction) {
    return movementKeyAliases[direction].some((code) => keys.has(code));
  }

  function isMovementKeyPressed(direction) {
    if (isKeyboardMovementKeyPressed(direction)) {
      return true;
    }
    return isTouchMovementPressed(direction);
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
  const solidBodyPlayerDamageSpeed = 520;
  const weaponSlowDecay = 0.18;
  const weaponSlowMax = 0.58;
  const rivalProjectileSpeed = 360;
  const rivalShootRange = 980;
  const rivalProjectileDamage = 10;
  const rambotImpactDamage = 18;
  const rambotImpactSpeed = 260;
  const playerHurtboxTopOffset = -38;
  const playerHurtboxBottomOffset = 112;
  const playerProjectileHurtboxScale = 0.72;
  const playerBodyHurtboxScale = 0.86;
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
    bridge: 170,
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
  const playerContinuousEnergyActivationCost = 2;
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
      mobIntervalScale: 0.82,
      mobBatchScale: 1.12,
      mobBonusChanceScale: 1.1,
      mobDamageMultiplier: 0.62,
      healthDropMultiplier: 1.45,
      techDropMultiplier: 1.45,
      bodyScoreMultiplier: 0.75,
      mobScoreMultiplier: 0.65
    },
    medium: {
      id: "medium",
      label: "Medium",
      mobIntervalScale: 0.72,
      mobBatchScale: 1.24,
      mobBonusChanceScale: 1.22,
      mobDamageMultiplier: 0.82,
      healthDropMultiplier: 1.2,
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
      mobDamageMultiplier: 1,
      healthDropMultiplier: 1,
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
  const mobSpawnRestDuration = 24;
  const mobSpawnRestCooldown = 150;
  const ufoTractorRange = 520;
  const ufoTractorWidth = 118;
  const ufoTractorForce = 2350;
  const ufoBeamMaxTurn = 1.15;
  const ufoBodyDrainRate = 1.8;
  const ufoSapFragmentMass = 1;
  const ufoSapMaxFragmentsPerBurst = 3;
  const ufoSapSourceGraceDuration = 0.45;
  const ufoSapCargoDuration = 3.25;
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
  const bridgeHalfWidth = 18;
  const bridgeWalkTransferAngle = 0.11;
  const bridgeWalkExitAnglePadding = 0.045;
  const bridgeMinAnchorLength = 80;
  const bridgeMinCurveLength = 54;
  const bridgeMaxCurveLength = 138;
  const bridgeMaxAngularSpeed = 2.7;
  const bridgeAngularDamping = 0.74;
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
    },
    {
      id: "bridge",
      name: "Bridge",
      category: "structures",
      description: "A rigid plated span that welds two bodies together and lets you walk between them.",
      cost: { plating: 12, propulsion: 2 },
      structureType: "bridge",
      icon: "assets/bridge.svg"
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
    serverUnavailable: false,
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
  const startMenu = {
    view: "main",
    history: [],
    titles: {
      main: ["Clusternauts", "Clusternauts"],
      single: ["Single Player", "Choose Mode"],
      load: ["Single Player", "Load Save"],
      difficulty: ["New Game", "Choose Difficulty"],
      multiplayer: ["Multiplayer", "Party Setup"],
      lobby: ["Multiplayer", "Lobby"],
      settings: ["Settings", "Settings"]
    }
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
  let restartGameInFlight = false;
  const leaderboard = {
    open: false,
    entries: [],
    refreshInFlight: false,
    submitInFlight: false,
    lastRefreshAt: 0,
    statusMessage: "",
    submittedDeathKey: ""
  };
  const multiplayerSnapshotInterval = 0.25;
  const partyInputInterval = 0.05;
  const partyActiveInputInterval = 1 / 30;
  const partyWorldSnapshotInterval = 0.1;
  const partyActiveWorldSnapshotInterval = 0.05;
  const partyRemotePredictionLead = 0.12;
  const partyRemotePredictionMax = 0.28;
  const partyRemoteGadgetPredictionLead = 0.06;
  const partyRemoteGadgetPredictionMax = 0.18;
  const partyPhysicsSessionActiveHoldMs = 900;
  const partyPhysicsSessionLocalHoldMs = 860;
  const partyPhysicsSessionUpdateIntervalMs = 34;
  const partyGadgetIntentFreshMs = 1100;
  const partyFollowerPredictionHoldMs = 420;
  const remoteSnapshotRenderDelay = multiplayerSnapshotInterval * 0.8;
  const remoteSnapshotExtrapolateLimit = multiplayerSnapshotInterval * 1.35;
  const remoteSnapshotBufferLimit = 6;
  const multiplayerV2MaxFrameDt = 0.16;
  const multiplayerV2MaxCatchUpSteps = 6;
  const multiplayerV2MaxAccumulator = multiplayerV2MaxFrameDt;
  const multiplayerV2LocalCorrectionBlendPerFrame = 0.42;
  const multiplayerV2RemoteSnapshotRenderDelay = 0.07;
  const multiplayerV2RemoteSnapshotExtrapolateLimit = 0.16;
  const remoteEffectInterval = 0.18;
  const remoteStaleMs = 16000;
  const remoteUniverseAlphaScale = 0.32;
  const playerInteractionRange = 250;
  const playerInteractionChoiceConfigs = {
    trade: { key: "trade", label: "Trade", icon: "$", speech: "Trade?", emote: "swap" },
    duel: { key: "duel", label: "Duel", icon: "!", speech: "Duel?", emote: "duel" },
    truce: { key: "truce", label: "Truce", icon: "=", speech: "Truce?", emote: "peace" }
  };
  const multiplayer = {
    enabled: Boolean(window.WebSocket),
    socket: null,
    connected: false,
    serverUnavailable: false,
    profile: null,
    universeId: "",
    bubbleRadius: 5000,
    roomId: "",
    roomMode: "world-overlap",
    roomPlayerCount: 0,
    roomMaxPlayers: crazyGamesRoomMaxPlayers,
    roomJoinable: false,
    roomCreatePending: false,
    pendingJoinRoomId: "",
    pendingJoinMode: "world-overlap",
    joinRequestedRoomId: "",
    lobby: null,
    lobbyLoadedSnapshot: null,
    lobbyLoadedSaveName: "",
    lobbyCreatePending: false,
    lobbyJoinPending: "",
    lobbyRequestStartedAt: 0,
    lobbyInviteLink: "",
    partySession: null,
    partyJoinCode: "",
    partyMode: "solo",
    partyHostId: "",
    partyHostUniverseId: "",
    partyPlayerSnapshots: new Map(),
    partyPhysicsSessions: new Map(),
    partyInputSeqByPlayer: new Map(),
    localPartyPhysicsSessions: new Map(),
    partyPhysicsSeq: 0,
    partyInputTimer: 0,
    partyInputSeq: 0,
    partyLastInputSnapshot: null,
    partySnapshotTimer: 0,
    partyRespawnInvulnerableTimer: 0,
    anomaly: null,
    friendJoinsEnabled: false,
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
    duels: new Set(),
    claimedTechPickupIds: new Set(),
    claimedHealthPickupIds: new Set(),
    trade: null,
    v2: {
      active: false,
      roomId: "",
      state: null,
      authoritativeState: null,
      inputSeq: 0,
      clientTick: 0,
      fixedAccumulator: 0,
      sendAccumulator: 0,
      pendingInputs: [],
      landRequested: "",
      lastServerTick: 0,
      lastAckInputSeq: 0,
      ignoreDeathEventsBeforeTick: 0,
      visualBlend: null,
      eventKeys: new Map(),
      perf: {
        clientStepMs: 0,
        reconcileMs: 0,
        syncMs: 0,
        pendingInputs: 0,
        entityCount: 0,
        snapshotBytes: 0,
        serverStepMs: 0,
        serverSnapshotBytes: 0,
        serverMaxInputQueue: 0
      }
    }
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
  let nextRivalProjectileId = 1;
  let nextTechPickupId = 1;
  let nextHealthPickupId = 1;
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
  let playerContinuousEnergyLocked = false;
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
  let mobSpawnRestTimer = 0;
  let mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
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
    width = viewportDimension("width");
    height = viewportDimension("height");
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

  function viewportDimension(axis) {
    const isWidth = axis === "width";
    const fallback = isWidth ? 1280 : 720;
    const visualViewport = window.visualViewport;
    const candidates = [
      isWidth ? window.innerWidth : window.innerHeight,
      visualViewport && (isWidth ? visualViewport.width : visualViewport.height),
      document.documentElement && (isWidth ? document.documentElement.clientWidth : document.documentElement.clientHeight),
      document.body && (isWidth ? document.body.clientWidth : document.body.clientHeight),
      canvas && (isWidth ? canvas.clientWidth : canvas.clientHeight),
      fallback
    ];

    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    return fallback;
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
      touchScreen: shouldEnableTouchControlsByDefault(),
      hudEnabled: true,
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
        touchScreen: typeof stored.touchScreen === "boolean" ? stored.touchScreen : defaults.touchScreen,
        hudEnabled: typeof stored.hudEnabled === "boolean" ? stored.hudEnabled : defaults.hudEnabled,
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
        touchScreen: gameSettings.touchScreen,
        hudEnabled: gameSettings.hudEnabled,
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

  function shouldEnableTouchControlsByDefault() {
    const hasTouchPoints = Number(navigator.maxTouchPoints || 0) > 0;
    const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return Boolean(hasTouchPoints || coarsePointer || "ontouchstart" in window);
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
    if (menuUiScaleInput) {
      menuUiScaleInput.value = String(Math.round(gameSettings.uiScale * 100));
    }
    if (menuUiScaleValue) {
      menuUiScaleValue.textContent = Math.round(gameSettings.uiScale * 100) + "%";
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
    if (menuZoomInput) {
      menuZoomInput.value = String(Math.round(cameraZoomToSliderValue(cameraZoom)));
    }
    if (menuZoomValue) {
      menuZoomValue.textContent = Math.round(cameraZoom * 100) + "%";
    }
  }

  function updateSurfaceCameraRotationUi() {
    if (surfaceCameraRotationInput) {
      surfaceCameraRotationInput.checked = Boolean(gameSettings.surfaceCameraRotation);
    }
    if (menuSurfaceCameraRotationInput) {
      menuSurfaceCameraRotationInput.checked = Boolean(gameSettings.surfaceCameraRotation);
    }
  }

  function updateTouchScreenUi() {
    if (touchScreenInput) {
      touchScreenInput.checked = Boolean(gameSettings.touchScreen);
    }
    if (menuTouchScreenInput) {
      menuTouchScreenInput.checked = Boolean(gameSettings.touchScreen);
    }
    if (touchJoystick) {
      touchJoystick.classList.toggle("is-enabled", Boolean(gameSettings.touchScreen));
      touchJoystick.setAttribute("aria-hidden", gameSettings.touchScreen ? "false" : "true");
    }
    if (touchFireJoystick) {
      touchFireJoystick.classList.toggle("is-enabled", Boolean(gameSettings.touchScreen));
      touchFireJoystick.setAttribute("aria-hidden", gameSettings.touchScreen ? "false" : "true");
    }
  }

  function updateHudEnabledUi() {
    const hudEnabled = gameSettings.hudEnabled !== false;
    document.body.classList.toggle("hud-hidden", !hudEnabled);
    document.body.classList.toggle("hud-menu-open", settingsOpen || buildMenuOpen);
    if (hudEnabledInput) {
      hudEnabledInput.checked = hudEnabled;
    }
    syncCompactHudControls();
    updateToolHotbar();
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

  function applyTouchScreenSetting(enabled) {
    gameSettings.touchScreen = Boolean(enabled);
    updateTouchScreenUi();
    if (!gameSettings.touchScreen) {
      resetMouseButtons();
    }
    updateTouchLandButton();
    writeGameSettings();
  }

  function applyHudEnabledSetting(enabled) {
    gameSettings.hudEnabled = Boolean(enabled);
    if (!gameSettings.hudEnabled) {
      setLeaderboardOpen(false);
      setBuildMenuOpen(false);
      setSocialPanelOpen(false);
      resetMouseButtons();
    }
    updateHudEnabledUi();
    writeGameSettings();
  }

  function setSettingsSectionOpen(sectionName, open) {
    let openedSection = null;
    settingsSections.forEach(function (section) {
      const name = section.dataset.settingsSection || "";
      const isTarget = name === sectionName;
      const isOpen = isTarget && open;
      const body = section.querySelector(".settings-panel__section-body");
      section.classList.toggle("is-open", isOpen);
      if (body) {
        body.hidden = !isOpen;
      }
      if (isOpen) {
        openedSection = name;
      }
    });

    settingsSectionToggles.forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", toggle.dataset.settingsSectionToggle === openedSection ? "true" : "false");
    });
  }

  function ensureSettingsSectionOpen() {
    if (!settingsSections.length) {
      return;
    }
    const openSection = settingsSections.find(function (section) {
      return section.classList.contains("is-open");
    });
    if (!openSection) {
      setSettingsSectionOpen(settingsSections[0].dataset.settingsSection || "", true);
    }
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
      ensureSettingsSectionOpen();
      updateSettingsJoinCodeUi();
      void refreshAccountSaves();
    }

    renderControlBindings();
    updateHudEnabledUi();
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
    playerContinuousEnergyLocked = false;
    resetTouchControlState();
  }

  function resetTouchControlState() {
    resetTouchFireState();
    resetTouchJoystickState();
  }

  function resetTouchFireState() {
    touchControlState.active = false;
    touchControlState.pointerId = null;
    touchControlState.fireButton = "";
    touchControlState.fireReady = false;
    touchControlState.aimX = 0;
    touchControlState.aimY = -1;
    touchControlState.toolsSuppressed = false;
    updateTouchFireJoystickUi();
  }

  function resetTouchJoystickState() {
    touchJoystickState.active = false;
    touchJoystickState.pointerId = null;
    touchJoystickState.moveX = 0;
    touchJoystickState.moveY = 0;
    touchJoystickState.boost = false;
    updateTouchJoystickUi();
  }

  function clearMouseButtonsOnly() {
    mouse.left = false;
    mouse.middle = false;
    mouse.right = false;
    playerContinuousEnergyLocked = false;
  }

  function suppressTouchToolsUntilEnergyReturns() {
    if (!gameSettings.touchScreen || !touchControlState.active) {
      resetMouseButtons();
      return;
    }

    touchControlState.toolsSuppressed = true;
    clearMouseButtonsOnly();
  }

  function refreshTouchFireButtons() {
    if (!touchControlState.active || !touchControlState.fireButton || !touchControlState.fireReady) {
      clearMouseButtonsOnly();
      return;
    }
    if (touchControlState.toolsSuppressed) {
      clearMouseButtonsOnly();
      return;
    }
    setTouchFireButton(touchControlState.fireButton);
  }

  function isTouchMovementPressed(direction) {
    if (!gameSettings.touchScreen || !touchJoystickState.active) {
      return false;
    }

    if (direction === "left") {
      return touchJoystickState.moveX < -touchMoveAxisThreshold;
    }
    if (direction === "right") {
      return touchJoystickState.moveX > touchMoveAxisThreshold;
    }
    if (direction === "up") {
      return touchJoystickState.moveY < -touchMoveAxisThreshold;
    }
    if (direction === "down") {
      return touchJoystickState.moveY > touchMoveAxisThreshold;
    }
    return false;
  }

  function touchLandedWalkDirection(body) {
    if (!gameSettings.touchScreen || !touchJoystickState.active || !player.landed || !body) {
      return 0;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const aim = cameraLocalToWorld(touchJoystickState.moveX, touchJoystickState.moveY);
    const tangentAmount = aim.x * tangent.x + aim.y * tangent.y;
    if (Math.abs(tangentAmount) < touchMoveAxisThreshold) {
      return 0;
    }
    return tangentAmount > 0 ? 1 : -1;
  }

  function updatePointerAimFromEvent(event) {
    if (!event || !canvas || typeof canvas.getBoundingClientRect !== "function") {
      return;
    }
    const clientX = Number(event.clientX);
    const clientY = Number(event.clientY);
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
    mouse.seen = true;
  }

  function updateTouchAimFromPointer(event) {
    updatePointerAimFromEvent(event);
  }

  function updateTouchAimFromVector(x, y) {
    const distance = Math.hypot(x, y);
    if (distance < 0.08) {
      touchControlState.fireReady = false;
      clearMouseButtonsOnly();
      return;
    }

    const aimX = x / distance;
    const aimY = y / distance;
    const aimRadius = Math.max(120, Math.min(width, height) * 0.34);
    touchControlState.fireReady = true;
    touchControlState.aimX = aimX;
    touchControlState.aimY = aimY;
    mouse.x = width / 2 + aimX * aimRadius;
    mouse.y = height / 2 + aimY * aimRadius;
    mouse.seen = true;
    refreshTouchFireButtons();
  }

  function isTouchJoystickPointer(event) {
    return Boolean(isTouchGameplayPointer(event) && touchJoystick && (event.target === touchJoystick || touchJoystick.contains(event.target)));
  }

  function isTouchFireJoystickPointer(event) {
    return Boolean(isTouchGameplayPointer(event) && touchFireJoystick && (event.target === touchFireJoystick || touchFireJoystick.contains(event.target)));
  }

  function updateTouchJoystickUi() {
    if (!touchJoystickStick) {
      return;
    }

    const travel = 37;
    touchJoystickStick.style.transform = "translate(" +
      (touchJoystickState.moveX * travel).toFixed(1) + "px, " +
      (touchJoystickState.moveY * travel).toFixed(1) + "px)";
    if (touchJoystick) {
      touchJoystick.classList.toggle("is-active", touchJoystickState.active);
      touchJoystick.classList.toggle("is-boosting", touchJoystickState.active && touchJoystickState.boost);
    }
  }

  function updateTouchFireJoystickUi() {
    if (!touchFireJoystickStick) {
      return;
    }

    const travel = 37;
    const x = touchControlState.fireReady ? touchControlState.aimX : 0;
    const y = touchControlState.fireReady ? touchControlState.aimY : 0;
    touchFireJoystickStick.style.transform = "translate(" +
      (x * travel).toFixed(1) + "px, " +
      (y * travel).toFixed(1) + "px)";
    if (touchFireJoystick) {
      touchFireJoystick.classList.toggle("is-active", touchControlState.active);
    }
  }

  function updateTouchJoystickFromPointer(event) {
    if (!touchJoystick) {
      return;
    }

    const base = touchJoystick.querySelector(".touch-joystick__base");
    const rect = (base || touchJoystick).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const amount = clamp(distance / radius, 0, 1);

    if (amount < 0.08) {
      touchJoystickState.moveX = 0;
      touchJoystickState.moveY = 0;
    } else {
      const normal = normalize(dx, dy);
      touchJoystickState.moveX = normal.x * amount;
      touchJoystickState.moveY = normal.y * amount;
    }

    updateTouchJoystickUi();
  }

  function updateTouchFireJoystickFromPointer(event) {
    if (!touchFireJoystick) {
      return;
    }

    const base = touchFireJoystick.querySelector(".touch-joystick__base");
    const rect = (base || touchFireJoystick).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const amount = clamp(distance / radius, 0, 1);

    if (amount < 0.08) {
      touchControlState.fireReady = false;
      clearMouseButtonsOnly();
    } else {
      const normal = normalize(dx, dy);
      updateTouchAimFromVector(normal.x * amount, normal.y * amount);
    }

    updateTouchFireJoystickUi();
  }

  function beginTouchJoystick(event) {
    if (!isTouchJoystickPointer(event) || deathState.active || !runState.active || touchJoystickState.active) {
      return false;
    }

    event.preventDefault();
    touchControlState.suppressMouseUntil = performance.now() + 900;
    const now = performance.now();
    const tapDistance = Math.hypot(event.clientX - touchJoystickState.lastTapX, event.clientY - touchJoystickState.lastTapY);
    const doubleTap = now - touchJoystickState.lastTapAt <= touchDoubleTapWindow && tapDistance <= touchDoubleTapDistance;
    touchJoystickState.active = true;
    touchJoystickState.pointerId = event.pointerId;
    touchJoystickState.boost = doubleTap;
    touchJoystickState.lastTapAt = now;
    touchJoystickState.lastTapX = event.clientX;
    touchJoystickState.lastTapY = event.clientY;
    updateTouchJoystickFromPointer(event);

    if (touchJoystick && touchJoystick.setPointerCapture) {
      try {
        touchJoystick.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail if the browser already released the touch.
      }
    }

    return true;
  }

  function updateTouchJoystick(event) {
    if (!touchJoystickState.active || event.pointerId !== touchJoystickState.pointerId) {
      return false;
    }

    event.preventDefault();
    updateTouchJoystickFromPointer(event);
    return true;
  }

  function endTouchJoystick(event) {
    if (!touchJoystickState.active || event.pointerId !== touchJoystickState.pointerId) {
      return false;
    }

    event.preventDefault();
    resetTouchJoystickState();

    if (touchJoystick && touchJoystick.releasePointerCapture) {
      try {
        touchJoystick.releasePointerCapture(event.pointerId);
      } catch {
        // Some browsers release capture before pointerup is delivered.
      }
    }

    return true;
  }

  function beginTouchFireJoystick(event) {
    if (!isTouchFireJoystickPointer(event) || deathState.active || !runState.active || touchControlState.active) {
      return false;
    }

    event.preventDefault();
    touchControlState.suppressMouseUntil = performance.now() + 900;
    updateTouchAimFromPointer(event);

    if (activePlacementRecipeId) {
      confirmStructurePlacement();
      return true;
    }

    if (areToolsDisabled()) {
      resetMouseButtons();
      return true;
    }

    if (handleCommunicationRelayClick()) {
      resetMouseButtons();
      return true;
    }

    const now = performance.now();
    const tapDistance = Math.hypot(event.clientX - touchControlState.lastTapX, event.clientY - touchControlState.lastTapY);
    const doubleTap = now - touchControlState.lastTapAt <= touchDoubleTapWindow && tapDistance <= touchDoubleTapDistance;
    const fireButton = doubleTap ? "right" : "left";

    touchControlState.active = true;
    touchControlState.pointerId = event.pointerId;
    touchControlState.fireButton = fireButton;
    touchControlState.toolsSuppressed = false;
    touchControlState.lastTapAt = now;
    touchControlState.lastTapX = event.clientX;
    touchControlState.lastTapY = event.clientY;
    updateTouchFireJoystickFromPointer(event);

    if (touchFireJoystick && touchFireJoystick.setPointerCapture) {
      try {
        touchFireJoystick.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail if the browser already released the touch.
      }
    }

    if (isSuctionEquipped() && touchControlState.fireReady) {
      playSound(fireButton === "right" ? "gadgetBlow" : "gadgetSuck", { throttleKey: "gadget", throttle: 0.12 });
    }

    return true;
  }

  function updateTouchFireJoystick(event) {
    if (!touchControlState.active || event.pointerId !== touchControlState.pointerId) {
      return false;
    }

    event.preventDefault();
    updateTouchFireJoystickFromPointer(event);
    return true;
  }

  function endTouchFireJoystick(event) {
    if (!touchControlState.active || event.pointerId !== touchControlState.pointerId) {
      return false;
    }

    event.preventDefault();
    clearMouseButtonsOnly();
    resetTouchFireState();

    if (touchFireJoystick && touchFireJoystick.releasePointerCapture) {
      try {
        touchFireJoystick.releasePointerCapture(event.pointerId);
      } catch {
        // Some browsers release capture before pointerup is delivered.
      }
    }

    return true;
  }

  function isTouchGameplayPointer(event) {
    return Boolean(gameSettings.touchScreen && event && event.pointerType === "touch");
  }

  function isGameplayPointerBlocked(event) {
    return Boolean(closestEventTarget(event, gameplayPointerBlockSelector));
  }

  function shouldSuppressSyntheticMouseEvent() {
    return Boolean(gameSettings.touchScreen && performance.now() < touchControlState.suppressMouseUntil);
  }

  function setTouchFireButton(button) {
    mouse.left = button === "left";
    mouse.middle = false;
    mouse.right = button === "right";
  }

  function isTouchBoostPressed() {
    return Boolean(gameSettings.touchScreen && touchJoystickState.active && touchJoystickState.boost);
  }

  function canShowTouchLandButton() {
    return Boolean(gameSettings.touchScreen && runState.active && !deathState.active && (player.landed || findNearestLandableBody()));
  }

  function updateTouchLandButton() {
    if (!touchLandButton) {
      return;
    }

    const visible = canShowTouchLandButton();
    touchLandButton.classList.toggle("is-visible", visible);
    touchLandButton.hidden = !visible;
    touchLandButton.textContent = player.landed ? "Take off" : "Land";
    touchLandButton.setAttribute("aria-label", player.landed ? "Take off from body" : "Land on nearby body");
  }

  function beginTouchControl(event) {
    if (beginTouchJoystick(event)) {
      return;
    }
    if (beginTouchFireJoystick(event)) {
      return;
    }

    if (!isTouchGameplayPointer(event) || deathState.active || !runState.active || isGameplayPointerBlocked(event)) {
      return;
    }
    event.preventDefault();
    touchControlState.suppressMouseUntil = performance.now() + 900;
  }

  function updateTouchControl(event) {
    if (updateTouchJoystick(event)) {
      return;
    }
    if (updateTouchFireJoystick(event)) {
      return;
    }
  }

  function endTouchControl(event) {
    if (endTouchJoystick(event)) {
      return;
    }
    if (endTouchFireJoystick(event)) {
      return;
    }
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
    const audioAllowed = isGameAudioAllowed();
    for (const toggle of [soundToggle, menuSoundToggle]) {
      if (!toggle) {
        continue;
      }
      toggle.classList.toggle("is-active", audioAllowed);
      toggle.classList.toggle("is-muted", !audioAllowed);
      toggle.setAttribute("aria-pressed", soundState.enabled ? "true" : "false");
      toggle.setAttribute("aria-label", soundState.enabled ? "Mute sound effects" : "Unmute sound effects");
      toggle.textContent = audioAllowed ? "SFX On" : "SFX Off";
    }
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

  function toolIdListsEqual(first, second) {
    if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length) {
      return false;
    }

    for (let index = 0; index < first.length; index += 1) {
      if (first[index] !== second[index]) {
        return false;
      }
    }

    return true;
  }

  function toolUpgradeLevelsEqual(first, second) {
    const left = first && typeof first === "object" ? first : {};
    const right = second && typeof second === "object" ? second : {};

    for (const [toolId, upgrades] of Object.entries(toolUpgradeDefinitions)) {
      const leftToolLevels = left[toolId] && typeof left[toolId] === "object" ? left[toolId] : {};
      const rightToolLevels = right[toolId] && typeof right[toolId] === "object" ? right[toolId] : {};
      for (const upgrade of upgrades) {
        if (Math.max(0, finiteOr(leftToolLevels[upgrade.id], 0)) !== Math.max(0, finiteOr(rightToolLevels[upgrade.id], 0))) {
          return false;
        }
      }
    }

    return true;
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

    if (isMultiplayerV2Active() && sendMultiplayerV2BuildAction({
      action: "upgradeTool",
      toolId,
      upgradeId
    })) {
      playSound("craft");
      maybeNotifyText(toolById(toolId).shortName + " " + upgrade.name.toLowerCase() + " upgraded.");
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
    return isSuctionEquipped() && !areToolsDisabled() && canUseContinuousPlayerEnergy(suctionEnergyDrain);
  }

  function hasVacuumBucketCollider() {
    return isSuctionEquipped();
  }

  function isSpannerEquipped() {
    return equippedToolId === "spanner" && !areToolsDisabled() && canUseContinuousPlayerEnergy(spannerRepairEnergyDrain);
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

    clusternautsTestCounters.buildMenuRenders += 1;
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
    toolHotbar.classList.toggle("is-visible", gameSettings.hudEnabled !== false && hotbarToolIds.length > 0 && (unlockedToolIds.length > 1 || buildMenuOpen));

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

    if (isMultiplayerV2Active() && sendMultiplayerV2BuildAction({
      action: "setEquippedTools",
      equippedTool: toolId,
      equippedTools: serializeEquippedToolInventory()
    })) {
      playSound("select");
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

    if (isMultiplayerV2Active()) {
      const nextHotbarToolIds = isToolEquipped(toolId) ? hotbarToolIds.slice() : hotbarToolIds.concat(toolId);
      if (sendMultiplayerV2BuildAction({
        action: "setEquippedTools",
        equippedTool: toolId,
        equippedTools: nextHotbarToolIds
      })) {
        playSound("select");
        return;
      }
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

    if (isMultiplayerV2Active()) {
      const nextHotbarToolIds = hotbarToolIds.filter((equippedId) => equippedId !== toolId);
      const nextEquippedToolId = equippedToolId === toolId ? nextHotbarToolIds[0] || defaultToolId : equippedToolId;
      if (sendMultiplayerV2BuildAction({
        action: "setEquippedTools",
        equippedTool: nextEquippedToolId,
        equippedTools: nextHotbarToolIds
      })) {
        playSound("select");
        return;
      }
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
    if (isLinkedStructureType(recipe.structureType)) {
      maybeNotifyText("Choose a boulder or larger body for the first " + recipe.name.toLowerCase() + " anchor.");
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

    if (isMultiplayerV2Active() && sendMultiplayerV2BuildAction({
      action: "craftTool",
      recipeId: recipe.id
    })) {
      playSound("craft");
      maybeNotifyText(recipe.name + " crafted.");
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
    if (gameSettings.hudEnabled === false) {
      if (gameVitalsHud) {
        gameVitalsHud.classList.remove("is-compact", "is-compact-open");
        gameVitalsHud.setAttribute("aria-hidden", "true");
      }
      if (techLedger) {
        techLedger.classList.remove("is-open");
        techLedger.setAttribute("aria-hidden", "true");
      }
      for (const toggle of [vitalsToggle, resourcesToggle, buildToggle, mapToggle]) {
        if (toggle) {
          toggle.classList.remove("is-active");
          toggle.setAttribute("aria-expanded", "false");
        }
      }
      return;
    }

    const compact = isCompactHudViewport();
    const vitalsVisible = !compact || vitalsHudOpen;

    if (gameVitalsHud) {
      gameVitalsHud.classList.toggle("is-compact", compact);
      gameVitalsHud.classList.toggle("is-compact-open", vitalsVisible);
      gameVitalsHud.setAttribute("aria-hidden", vitalsVisible ? "false" : "true");
    }

    if (vitalsToggle) {
      vitalsToggle.classList.toggle("is-active", compact && vitalsHudOpen);
      vitalsToggle.setAttribute("aria-expanded", compact && vitalsHudOpen ? "true" : "false");
    }

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

  function setVitalsHudOpen(open) {
    vitalsHudOpen = Boolean(open);
    syncCompactHudControls();
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
    updateHudEnabledUi();
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

    const nextUnlockedToolIds = validTools.includes(defaultToolId) ? validTools : [defaultToolId].concat(validTools);
    const hotbarSource = Array.isArray(equippedTools) ? equippedTools : nextUnlockedToolIds;
    const nextHotbarToolIds = hotbarSource.filter((toolId, index) => nextUnlockedToolIds.includes(toolId) && hotbarSource.indexOf(toolId) === index);
    const nextEquippedToolId = nextHotbarToolIds.includes(equipped) ? equipped : nextHotbarToolIds[0] || null;

    if (
      toolIdListsEqual(unlockedToolIds, nextUnlockedToolIds) &&
      toolIdListsEqual(hotbarToolIds, nextHotbarToolIds) &&
      equippedToolId === nextEquippedToolId
    ) {
      return false;
    }

    unlockedToolIds = nextUnlockedToolIds;
    hotbarToolIds = nextHotbarToolIds;
    equippedToolId = nextEquippedToolId;
    updateToolHotbar();
    renderBuildMenu();
    return true;
  }

  function applyToolUpgrades(snapshot) {
    const nextToolUpgradeLevels = normalizeToolUpgrades(snapshot);
    if (toolUpgradeLevelsEqual(toolUpgradeLevels, nextToolUpgradeLevels)) {
      return false;
    }

    toolUpgradeLevels = nextToolUpgradeLevels;
    renderBuildMenu();
    return true;
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

  function difficultyMobDamage(damage) {
    return Math.max(0, finiteOr(damage, 0) * finiteOr(activeDifficulty().mobDamageMultiplier, 1));
  }

  function difficultyHealthDropChance(baseChance) {
    return clamp(finiteOr(baseChance, 0) * finiteOr(activeDifficulty().healthDropMultiplier, 1), 0, 0.96);
  }

  function resetMobSpawnTimers() {
    for (const kind of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[kind] = difficultyMobSpawnInterval(kind);
    }
    mobSpawnRestTimer = 0;
    mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
  }

  function setDifficultyScreenOpen(open) {
    if (difficultyScreen) {
      difficultyScreen.classList.toggle("is-open", Boolean(open));
      difficultyScreen.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (open) {
      renderStartMenu();
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

  function setStartMenuView(view, options) {
    const nextView = startMenu.titles[view] ? view : "main";
    if (!options || options.push !== false) {
      if (startMenu.view !== nextView) {
        startMenu.history.push(startMenu.view);
      }
    }
    startMenu.view = nextView;
    renderStartMenu();

    if (nextView === "load") {
      if (isAccountSignedIn()) {
        void refreshAccountSaves();
      }
      renderStartSavedGames();
    }
    if (nextView === "lobby") {
      renderLobby();
      void refreshLobbyPlayerSearch();
    }
  }

  function goBackStartMenu() {
    if (startMenu.view === "lobby") {
      leaveLobby();
      return;
    }

    const previous = startMenu.history.pop() || "main";
    setStartMenuView(previous, { push: false });
  }

  function renderStartMenu() {
    if (!difficultyScreen) {
      return;
    }

    const title = startMenu.view === "load" && isMultiplayerSaveLoadContext()
      ? ["Multiplayer", "Load Save"]
      : startMenu.titles[startMenu.view] || startMenu.titles.main;
    if (startMenuEyebrow) {
      startMenuEyebrow.textContent = title[0];
    }
    if (startMenuTitle) {
      startMenuTitle.textContent = title[1];
    }
    if (startMenuBack) {
      startMenuBack.hidden = startMenu.view === "main";
      startMenuBack.textContent = startMenu.view === "lobby" ? "Leave" : "Back";
    }

    difficultyScreen.querySelectorAll("[data-menu-view]").forEach((viewElement) => {
      viewElement.classList.toggle("is-active", viewElement.dataset.menuView === startMenu.view);
    });

    syncMenuSettingsControls();
    renderStartSavedGames();
    renderLobby();
  }

  function syncMenuSettingsControls() {
    applyUiScale(gameSettings.uiScale);
    updateZoomUi();
    updateSurfaceCameraRotationUi();
    updateHudEnabledUi();
    updateSoundToggle();
  }

  function renderStartSavedGames() {
    if (!startSavedGameList) {
      return;
    }

    startSavedGameList.textContent = "";
    const lobbySaveMode = isMultiplayerSaveLoadContext();
    if (isCrazyGamesRuntime() && !isAccountSignedIn()) {
      const row = createStartMenuRow("Guest progress", lobbySaveMode ? "Use" : "Continue", lobbySaveMode ? "load-lobby-guest" : "continue-guest");
      startSavedGameList.append(row);
      return;
    }

    if (!isAccountSignedIn()) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "Log in from Settings to load named saves.";
      startSavedGameList.append(empty);
      return;
    }

    if (accountState.savesLoading) {
      const loading = document.createElement("p");
      loading.className = "start-menu__empty";
      loading.textContent = "Loading saves...";
      startSavedGameList.append(loading);
      return;
    }

    if (!accountState.saves.length) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "No saved worlds yet.";
      startSavedGameList.append(empty);
      return;
    }

    for (const save of accountState.saves) {
      const row = createStartMenuRow(save.name || "Saved world", lobbySaveMode ? "Use" : "Load", lobbySaveMode ? "load-lobby-save" : "load-save");
      const button = row.querySelector("button");
      if (button) {
        button.dataset.saveId = save.id || "";
      }
      startSavedGameList.append(row);
    }
  }

  function createStartMenuRow(label, actionLabel, action) {
    const row = document.createElement("div");
    const details = document.createElement("div");
    const name = document.createElement("strong");
    const button = document.createElement("button");

    row.className = "start-menu__row";
    name.textContent = label;
    button.className = "settings-panel__save-action";
    button.type = "button";
    button.dataset.menuAction = action;
    button.textContent = actionLabel;
    details.append(name);
    row.append(details, button);
    return row;
  }

  function isMultiplayerSaveLoadContext() {
    return Boolean(startMenu.history.includes("multiplayer") || startMenu.history.includes("lobby") || multiplayer.lobby);
  }

  function handleStartMenuAction(action, sourceElement) {
    if (action === "back") {
      goBackStartMenu();
      return;
    }
    if (action === "single") {
      setStartMenuView("single");
      return;
    }
    if (action === "new-game") {
      setStartMenuView("difficulty");
      return;
    }
    if (action === "load-game") {
      setStartMenuView("load");
      return;
    }
    if (action === "load-save") {
      void loadManualGame(sourceElement && sourceElement.dataset.saveId);
      return;
    }
    if (action === "load-lobby-save") {
      void loadLobbySave(sourceElement && sourceElement.dataset.saveId);
      return;
    }
    if (action === "load-lobby-guest") {
      void loadLobbyGuestProgress();
      return;
    }
    if (action === "continue-guest") {
      void continueGuestProgress();
      return;
    }
    if (action === "multiplayer") {
      setStartMenuView("multiplayer");
      return;
    }
    if (action === "multiplayer-load-game") {
      setStartMenuView("load");
      return;
    }
    if (action === "create-lobby") {
      createLobby();
      return;
    }
    if (action === "join-lobby") {
      joinLobby(lobbyCodeInput && lobbyCodeInput.value);
      return;
    }
    if (action === "start-lobby") {
      startLobby();
      return;
    }
    if (action === "lobby-load-game") {
      if (!isLobbyHost()) {
        setLobbyStatus("Only the host can load a save.", "error");
        return;
      }
      setStartMenuView("load");
      return;
    }
    if (action === "leave-lobby") {
      leaveLobby();
      return;
    }
    if (action === "settings") {
      setStartMenuView("settings");
    }
  }

  async function continueGuestProgress() {
    resetSoloMultiplayerSession();
    resetLocalPlayerState();
    resetLocalWorldState();
    resetLifeStats();
    resetDeathState();
    await loadPersistentState();
    runState.active = true;
    persistence.saveTimer = persistenceSaveInterval;
    persistence.pollTimer = persistencePollInterval;
    setDifficultyScreenOpen(false);
    resetMouseButtons();
    lastTime = performance.now();
    updateHud();
    connectMultiplayer();
    maybeNotifyText("Guest progress loaded.");
  }

  async function loadLobbySave(saveId) {
    const cleanSaveId = String(saveId || "").trim();
    if (multiplayer.lobby && !isLobbyHost()) {
      setLobbyStatus("Only the host can load a save.", "error");
      return;
    }
    if (!isAccountSignedIn()) {
      setLobbyStatus(isCrazyGamesRuntime() ? "Guest progress is already available." : "Log in to use saved worlds.", "error");
      return;
    }
    if (!cleanSaveId) {
      setLobbyStatus("Choose a saved world.", "error");
      return;
    }

    try {
      const data = await fetchPersistentJson("/api/saves/" + encodeURIComponent(cleanSaveId), {
        headers: accountAuthHeaders()
      });
      const payload = data && data.payload;
      const saveName = data && data.save && data.save.name ? data.save.name : "saved world";
      if (!payload || typeof payload !== "object" || !payload.player || !payload.world) {
        setLobbyStatus("Could not use this save.", "error");
        return;
      }

      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
      applyPersistentPayload(Object.assign({ ok: true }, payload), { includePlayer: true });
      applyRunSnapshot(payload.run);
      runState.active = false;
      multiplayer.lobbyLoadedSnapshot = payload;
      multiplayer.lobbyLoadedSaveName = saveName;
      setLoadedLobbyDifficulty(payload.run && payload.run.difficulty ? payload.run.difficulty : payload.world.difficulty || selectedLobbyDifficulty());
      if (multiplayer.lobby) {
        setStartMenuView("lobby", { push: false });
        setLobbyStatus('Using "' + saveName + '".', "success");
      } else {
        createLobby({ loadedSnapshot: payload, loadedSaveName: saveName });
      }
    } catch (error) {
      console.warn("Clusternauts lobby save load failed.", error);
      setLobbyStatus("Could not use this save.", "error");
    }
  }

  async function loadLobbyGuestProgress() {
    if (multiplayer.lobby && !isLobbyHost()) {
      setLobbyStatus("Only the host can load a save.", "error");
      return;
    }

    try {
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
      await loadPersistentState();
      runState.active = false;
      const payload = buildPersistentPayload(true);
      multiplayer.lobbyLoadedSnapshot = payload;
      multiplayer.lobbyLoadedSaveName = "Guest progress";
      setLoadedLobbyDifficulty(payload.run && payload.run.difficulty ? payload.run.difficulty : payload.world.difficulty || selectedLobbyDifficulty());
      if (multiplayer.lobby) {
        setStartMenuView("lobby", { push: false });
        setLobbyStatus("Using guest progress.", "success");
      } else {
        createLobby({ loadedSnapshot: payload, loadedSaveName: "Guest progress" });
      }
    } catch (error) {
      console.warn("Clusternauts lobby guest load failed.", error);
      setLobbyStatus("Could not use guest progress.", "error");
    }
  }

  function setLobbyStatus(message, state) {
    if (!lobbyStatus) {
      return;
    }
    lobbyStatus.textContent = message || "";
    lobbyStatus.classList.toggle("is-success", state === "success");
    lobbyStatus.classList.toggle("is-error", state === "error");
  }

  function lobbyPlayers() {
    return multiplayer.lobby && Array.isArray(multiplayer.lobby.players) ? multiplayer.lobby.players : [];
  }

  function isLobbyHost() {
    return Boolean(multiplayer.lobby && multiplayer.lobby.hostPlayerId === player.id);
  }

  function createLobby(options) {
    const loadedSnapshot = options && options.loadedSnapshot && typeof options.loadedSnapshot === "object" ? options.loadedSnapshot : null;
    const loadedSaveName = loadedSnapshot ? String(options.loadedSaveName || "saved world") : "";
    setFriendJoinsEnabled(true, "lobby-create", { persist: true, notify: false, startRun: false });
    multiplayer.lobbyCreatePending = true;
    multiplayer.lobbyJoinPending = "";
    multiplayer.lobbyLoadedSnapshot = loadedSnapshot;
    multiplayer.lobbyLoadedSaveName = loadedSaveName;
    multiplayer.lobbyRequestStartedAt = performance.now();
    setLobbyStatus(loadedSnapshot ? 'Creating lobby from "' + loadedSaveName + '"...' : "Creating lobby...", "");
    setStartMenuView("lobby");
    connectMultiplayer();
    flushLobbyRequests("create-lobby");
  }

  function joinLobby(code) {
    const cleanCode = sanitizeLobbyCode(code);
    if (!cleanCode) {
      setLobbyStatus("Enter a lobby code.", "error");
      setStartMenuView("multiplayer", { push: false });
      return;
    }
    setFriendJoinsEnabled(true, "lobby-join", { persist: true, notify: false, startRun: false });
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = cleanCode;
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    multiplayer.lobbyRequestStartedAt = performance.now();
    setLobbyStatus("Joining lobby...", "");
    setStartMenuView("lobby");
    connectMultiplayer();
    flushLobbyRequests("join-lobby");
  }

  function sanitizeLobbyCode(code) {
    return String(code || "").replace(/[^\w-]/g, "").trim().slice(0, 12).toUpperCase();
  }

  function selectedLobbyDifficulty() {
    return multiplayer.lobby && difficultyDefinitions[multiplayer.lobby.difficulty]
      ? multiplayer.lobby.difficulty
      : runState.difficultyId || defaultDifficultyId;
  }

  function lobbyDifficultySummary(difficulty) {
    if (difficulty === "easy") {
      return "Fast mobs, softer hits";
    }
    if (difficulty === "hard") {
      return "More mobs";
    }
    return "Busy mobs, lighter hits";
  }

  function lobbyDifficultyDisplayText(difficulty) {
    const definition = difficultyDefinition(difficulty);
    return definition.label + " - " + lobbyDifficultySummary(definition.id);
  }

  function setLobbyDifficultyMenuOpen(open) {
    const isOpen = Boolean(open && lobbyDifficultyToggle && !lobbyDifficultyToggle.disabled);
    if (lobbyDifficultySelect) {
      lobbyDifficultySelect.classList.toggle("is-open", isOpen);
    }
    if (lobbyDifficultyToggle) {
      lobbyDifficultyToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    if (lobbyDifficultyMenu) {
      lobbyDifficultyMenu.hidden = !isOpen;
    }
  }

  function setLobbyDifficulty(difficulty) {
    if (!difficultyDefinitions[difficulty]) {
      return;
    }
    if (multiplayer.lobby) {
      multiplayer.lobby.difficulty = difficulty;
    }
    renderLobby();
    sendMultiplayer({
      type: "lobby.setDifficulty",
      difficulty
    });
  }

  function setLoadedLobbyDifficulty(difficulty) {
    if (!difficultyDefinitions[difficulty]) {
      return;
    }
    if (multiplayer.lobby) {
      setLobbyDifficulty(difficulty);
      return;
    }
    applyDifficulty(difficulty);
    renderLobby();
  }

  function startLobby() {
    if (!multiplayer.lobby || !isLobbyHost()) {
      setLobbyStatus("Only the host can start.", "error");
      return;
    }
    if (multiplayer.lobbyLoadedSnapshot) {
      applyPersistentPayload(Object.assign({ ok: true }, multiplayer.lobbyLoadedSnapshot), { includePlayer: true });
      applyRunSnapshot(multiplayer.lobbyLoadedSnapshot.run);
    } else {
      applyDifficulty(selectedLobbyDifficulty());
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
    }
    sendMultiplayer({
      type: "lobby.start",
      netcodeVersion: 2,
      difficulty: selectedLobbyDifficulty(),
      snapshot: multiplayer.lobbyLoadedSnapshot || buildPersistentPayload(true)
    });
    setLobbyStatus("Starting shared world...", "");
  }

  function leaveLobby() {
    sendMultiplayer({ type: "lobby.leave" });
    multiplayer.lobby = null;
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = "";
    multiplayer.lobbyRequestStartedAt = 0;
    multiplayer.lobbyInviteLink = "";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    setLobbyStatus("", "");
    setStartMenuView("multiplayer", { push: false });
  }

  function applyLobbyState(message) {
    multiplayer.lobby = normalizeLobbyState(message && message.lobby ? message.lobby : message);
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = "";
    multiplayer.lobbyRequestStartedAt = 0;
    setLobbyStatus(
      multiplayer.lobby.status === "started"
        ? "Shared world starting."
        : multiplayer.lobbyLoadedSnapshot
        ? 'Using "' + (multiplayer.lobbyLoadedSaveName || "saved world") + '".'
        : "",
      multiplayer.lobby.status === "started" || multiplayer.lobbyLoadedSnapshot ? "success" : ""
    );
    setStartMenuView("lobby", { push: false });
    updateLobbyCrazyGamesRoom("lobby-state");
    renderLobby();
  }

  function normalizeLobbyState(source) {
    const lobby = source && typeof source === "object" ? source : {};
    return {
      id: String(lobby.id || ""),
      code: sanitizeLobbyCode(lobby.code || lobby.id),
      hostPlayerId: String(lobby.hostPlayerId || ""),
      maxPlayers: Math.max(1, Math.floor(finiteOr(lobby.maxPlayers, crazyGamesRoomMaxPlayers))),
      difficulty: difficultyDefinitions[lobby.difficulty] ? lobby.difficulty : defaultDifficultyId,
      status: String(lobby.status || "open"),
      players: Array.isArray(lobby.players)
        ? lobby.players.map(normalizeLobbyPlayer).filter(Boolean)
        : []
    };
  }

  function normalizeLobbyPlayer(source) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const playerId = String(source.playerId || "");
    if (!playerId) {
      return null;
    }
    return {
      playerId,
      publicName: String(source.publicName || source.name || playerId),
      online: source.online !== false
    };
  }

  function renderLobby() {
    if (!lobbyPlayerSlots) {
      return;
    }

    const lobby = multiplayer.lobby;
    const requestPending = Boolean(!lobby && (multiplayer.lobbyCreatePending || multiplayer.lobbyJoinPending));
    const requestAge = requestPending ? performance.now() - multiplayer.lobbyRequestStartedAt : 0;
    const host = isLobbyHost();
    const maxPlayers = lobby ? lobby.maxPlayers || crazyGamesRoomMaxPlayers : crazyGamesRoomMaxPlayers;
    const players = lobbyPlayers();
    if (lobbyCodeValue) {
      lobbyCodeValue.textContent = lobby ? lobby.code || lobby.id || "----" : requestPending ? "..." : "----";
    }
    if (copyLobbyCodeButton) {
      copyLobbyCodeButton.disabled = !lobby || !(lobby.code || lobby.id);
    }
    if (startLobbyButton) {
      startLobbyButton.disabled = !lobby || !host || !players.length;
    }
    if (leaveLobbyButton) {
      leaveLobbyButton.textContent = lobby ? "Leave" : "Back";
    }
    const selectedDifficulty = selectedLobbyDifficulty();
    const difficultyLocked = Boolean(lobby && !host);
    if (lobbyDifficultySelect) {
      lobbyDifficultySelect.classList.toggle("is-disabled", difficultyLocked);
    }
    if (lobbyDifficultyToggle) {
      lobbyDifficultyToggle.textContent = lobbyDifficultyDisplayText(selectedDifficulty);
      lobbyDifficultyToggle.disabled = difficultyLocked;
      if (difficultyLocked) {
        setLobbyDifficultyMenuOpen(false);
      }
    }
    if (lobbyDifficultyMenu) {
      lobbyDifficultyMenu.querySelectorAll("[data-lobby-difficulty]").forEach((button) => {
        const difficulty = button.dataset.lobbyDifficulty || defaultDifficultyId;
        const selected = difficulty === selectedDifficulty;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
      });
    }

    lobbyPlayerSlots.textContent = "";
    for (let index = 0; index < maxPlayers; index += 1) {
      const slot = document.createElement("div");
      const occupant = players[index];
      slot.className = "lobby-slot";
      slot.classList.toggle("is-filled", Boolean(occupant));

      const name = document.createElement("strong");
      const status = document.createElement("span");
      name.textContent = occupant ? occupant.publicName || occupant.playerId : "Open slot";
      status.textContent = occupant
        ? occupant.playerId === (lobby && lobby.hostPlayerId)
          ? "Host"
          : occupant.playerId === player.id
          ? "You"
          : "Player"
        : "Invite";
      slot.append(name, status);

      if (host && occupant && occupant.playerId !== player.id) {
        const kick = document.createElement("button");
        kick.className = "settings-panel__save-action settings-panel__save-action--danger";
        kick.type = "button";
        kick.dataset.lobbyKick = occupant.playerId;
        kick.textContent = "Kick";
        slot.append(kick);
      }

      lobbyPlayerSlots.append(slot);
    }

    renderLobbyPlayerSearch();
    if (requestPending && requestAge > 4500) {
      setLobbyStatus(
        multiplayer.connected
          ? "Lobby create request was sent, but the server did not answer. Restart the local server so the new backend code is running."
          : multiplayer.serverUnavailable
          ? serverMaintenanceMessage
          : "Connecting to multiplayer server...",
        multiplayer.connected || multiplayer.serverUnavailable ? "error" : ""
      );
    }
  }

  async function refreshLobbyPlayerSearch() {
    if (!window.fetch || !lobbyPlayerSearchList || !multiplayer.lobby) {
      renderLobbyPlayerSearch();
      return;
    }

    try {
      const url =
        "/api/players/search?playerId=" +
        encodeURIComponent(player.id) +
        "&q=" +
        encodeURIComponent(lobbyPlayerSearch ? lobbyPlayerSearch.value || "" : "") +
        "&friendsOnly=false&relayOnly=false";
      const data = await fetchPersistentJson(url);
      if (data && data.ok) {
        multiplayer.players = Array.isArray(data.players) ? data.players : [];
      }
      renderLobbyPlayerSearch();
    } catch (error) {
      renderLobbyPlayerSearch(backendErrorMessage(error, "Search unavailable."));
    }
  }

  function renderLobbyPlayerSearch(message) {
    if (!lobbyPlayerSearchList) {
      return;
    }
    lobbyPlayerSearchList.textContent = "";

    if (!multiplayer.lobby) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "Create or join a lobby first.";
      lobbyPlayerSearchList.append(empty);
      return;
    }

    const existing = new Set(lobbyPlayers().map((entry) => entry.playerId));
    const players = (multiplayer.players || []).filter(
      (candidate) => candidate.playerId && candidate.online && !existing.has(candidate.playerId)
    );
    if (message || !players.length) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = message || "No online players found.";
      lobbyPlayerSearchList.append(empty);
      return;
    }

    for (const candidate of players.slice(0, 8)) {
      const row = document.createElement("div");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const status = document.createElement("span");
      const invite = document.createElement("button");
      row.className = "start-menu__row";
      name.textContent = candidate.publicName || candidate.playerId;
      status.textContent = "Online";
      invite.className = "settings-panel__save-action";
      invite.type = "button";
      invite.dataset.lobbyInvite = candidate.playerId;
      invite.textContent = "Invite";
      invite.disabled = !candidate.online || !isLobbyHost();
      details.append(name, status);
      row.append(details, invite);
      lobbyPlayerSearchList.append(row);
    }
  }

  function updateLobbyCrazyGamesRoom(reason) {
    if (!multiplayer.lobby) {
      return;
    }
    multiplayer.roomId = multiplayer.lobby.code || multiplayer.lobby.id;
    multiplayer.roomMode = "party-lobby";
    multiplayer.roomPlayerCount = lobbyPlayers().length;
    multiplayer.roomMaxPlayers = multiplayer.lobby.maxPlayers || crazyGamesRoomMaxPlayers;
    multiplayer.roomJoinable = multiplayer.roomPlayerCount < multiplayer.roomMaxPlayers;
    reportCrazyGamesRoom(reason || "lobby-state");
  }

  function activePartyJoinCode() {
    if (multiplayer.partyJoinCode) {
      return multiplayer.partyJoinCode;
    }
    if (!multiplayer.partySession) {
      return "";
    }
    return sanitizeLobbyCode(multiplayer.partySession.joinCode || multiplayer.partySession.code || multiplayer.partySession.lobbyId);
  }

  function updateSettingsJoinCodeUi() {
    const code = activePartyJoinCode();
    if (settingsJoinCodeValue) {
      settingsJoinCodeValue.textContent = code || "----";
    }
    if (copySettingsJoinCodeButton) {
      copySettingsJoinCodeButton.disabled = !code;
    }
  }

  function isPartySessionActive() {
    return Boolean(multiplayer.partySession && multiplayer.partySession.id);
  }

  function isPartyHost() {
    return isPartySessionActive() && multiplayer.partyHostId === player.id;
  }

  function isSharedWorldFollower() {
    return isPartySessionActive() && !isPartyHost();
  }

  function queryValue(name) {
    const href = String(window.location && window.location.href || "");
    const query = href.includes("?") ? href.slice(href.indexOf("?") + 1).split("#")[0] : "";
    if (!query) {
      return "";
    }
    for (const part of query.split("&")) {
      const pieces = part.split("=");
      const key = decodeURIComponent(pieces[0] || "").trim();
      if (key === name) {
        return decodeURIComponent(pieces.slice(1).join("=") || "");
      }
    }
    return "";
  }

  function queryFlagEnabled(name) {
    const value = queryValue(name).trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "false" && value !== "off";
  }

  function joinedPlayerComponentListConfig(value) {
    return String(value || "").split(",").reduce(function (config, entry) {
      const key = entry.trim();
      if (Object.prototype.hasOwnProperty.call(joinedPlayerIsolationComponentDefaults, key)) {
        config[key] = true;
      }
      return config;
    }, {});
  }

  function configureJoinedPlayerIsolation(options) {
    const source = options && typeof options === "object" ? options : {};
    if (Object.prototype.hasOwnProperty.call(source, "enabled")) {
      joinedPlayerIsolation.enabled = source.enabled === true || source.enabled === "1" || source.enabled === "true";
    }
    const components = source.components && typeof source.components === "object" ? source.components : source;
    for (const key of Object.keys(joinedPlayerIsolationComponentDefaults)) {
      if (Object.prototype.hasOwnProperty.call(components, key)) {
        joinedPlayerIsolation.components[key] = components[key] === true || components[key] === "1" || components[key] === "true";
      }
    }
    return {
      enabled: joinedPlayerIsolation.enabled,
      components: { ...joinedPlayerIsolation.components }
    };
  }

  function initializeJoinedPlayerIsolation() {
    const windowConfig = window.CLUSTERNAUTS_JOINED_PLAYER_ISOLATION;
    const windowComponents = window.CLUSTERNAUTS_JOINED_PLAYER_COMPONENTS;
    if (windowConfig && typeof windowConfig === "object") {
      configureJoinedPlayerIsolation(windowConfig);
    } else if (windowConfig !== undefined) {
      configureJoinedPlayerIsolation({ enabled: windowConfig });
    }
    if (windowComponents && typeof windowComponents === "object") {
      configureJoinedPlayerIsolation({ components: windowComponents });
    }
    if (clusternautsTestConfig && clusternautsTestConfig.joinedPlayerIsolation) {
      configureJoinedPlayerIsolation(clusternautsTestConfig.joinedPlayerIsolation);
    }
    if (queryFlagEnabled("joinedPlayerIsolation")) {
      configureJoinedPlayerIsolation({ enabled: true });
    }
    const queryComponents = queryValue("joinedPlayerComponents");
    if (queryComponents) {
      configureJoinedPlayerIsolation({ components: joinedPlayerComponentListConfig(queryComponents) });
    }
    try {
      const stored = window.localStorage.getItem(joinedPlayerIsolationStorageKey);
      if (stored === "1" || stored === "true") {
        configureJoinedPlayerIsolation({ enabled: true });
      } else if (stored === "0" || stored === "false") {
        configureJoinedPlayerIsolation({ enabled: false });
      }
      const storedComponents = window.localStorage.getItem(joinedPlayerIsolationComponentsStorageKey);
      if (storedComponents) {
        try {
          configureJoinedPlayerIsolation({ components: JSON.parse(storedComponents) });
        } catch {
          configureJoinedPlayerIsolation({ components: joinedPlayerComponentListConfig(storedComponents) });
        }
      }
    } catch {
      // Ignore storage failures; URL/window/test flags still work.
    }
  }

  function isJoinedPlayerIsolationActive() {
    return Boolean(joinedPlayerIsolation.enabled && isSharedWorldFollower() && !isMultiplayerV2Active());
  }

  function joinedPlayerIsolationAllows(component) {
    if (!isJoinedPlayerIsolationActive()) {
      return true;
    }
    return joinedPlayerIsolation.components[component] === true;
  }

  initializeJoinedPlayerIsolation();

  function isPartyV2Session(session) {
    return Boolean(session && Number(session.netcodeVersion || 1) >= 2);
  }

  function isMultiplayerV2Active() {
    return Boolean(multiplayer.v2.active && multiplayer.v2.roomId && mpV2Sim);
  }

  function requestLandingToggle() {
    if (isMultiplayerV2Active()) {
      multiplayer.v2.landRequested = player.landed ? "takeoff" : "land";
      return true;
    }
    toggleLanding();
    return true;
  }

  function resetMultiplayerV2State() {
    multiplayer.v2.active = false;
    multiplayer.v2.roomId = "";
    multiplayer.v2.state = null;
    multiplayer.v2.authoritativeState = null;
    multiplayer.v2.inputSeq = 0;
    multiplayer.v2.clientTick = 0;
    multiplayer.v2.fixedAccumulator = 0;
    multiplayer.v2.sendAccumulator = 0;
    multiplayer.v2.pendingInputs = [];
    multiplayer.v2.landRequested = "";
    multiplayer.v2.lastServerTick = 0;
    multiplayer.v2.lastAckInputSeq = 0;
    multiplayer.v2.ignoreDeathEventsBeforeTick = 0;
    multiplayer.v2.visualBlend = null;
    multiplayer.v2.eventKeys = new Map();
  }

  function resetSoloMultiplayerSession() {
    resetMultiplayerV2State();
    multiplayer.partySession = null;
    multiplayer.partyJoinCode = "";
    multiplayer.partyMode = "solo";
    multiplayer.partyHostId = "";
    multiplayer.partyHostUniverseId = "";
    multiplayer.partyPlayerSnapshots.clear();
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    multiplayer.partyInputTimer = 0;
    multiplayer.partyInputSeq = 0;
    multiplayer.partyLastInputSnapshot = null;
    multiplayer.partySnapshotTimer = 0;
    multiplayer.partyRespawnInvulnerableTimer = 0;
    multiplayer.duels.clear();
    multiplayer.anomaly = null;
    multiplayer.lobby = null;
    multiplayer.lobbyInviteLink = "";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    updateSettingsJoinCodeUi();
  }

  function multiplayerV2EventKey(event) {
    if (!event || typeof event !== "object") {
      return "";
    }
    return [
      Math.max(0, Math.floor(finiteOr(event.tick, 0))),
      String(event.type || ""),
      String(event.kind || ""),
      String(event.mobId || ""),
      String(event.playerId || ""),
      String(event.projectileId || ""),
      String(event.pickupId || ""),
      String(event.keptId || ""),
      String(event.removedId || ""),
      String(event.cause || "")
    ].join(":");
  }

  function processMultiplayerV2BodyMergeEvent(event) {
    const mass = Math.max(1, finiteOr(event && event.mass, 1));
    const tier = event && event.tier && typeof event.tier === "object" ? event.tier : tierForMass(mass);
    const previousTier = event && event.previousTier && typeof event.previousTier === "object"
      ? event.previousTier
      : tier;
    const graduated = event && Object.prototype.hasOwnProperty.call(event, "graduated")
      ? Boolean(event.graduated)
      : tier.threshold > previousTier.threshold;

    playSound(graduated ? "milestone" : "merge", {
      throttleKey: "mpV2BodyMerge",
      throttle: 0.09,
      volume: clamp(0.45 + Math.log2(mass) * 0.08, 0.45, 1.1)
    });
    maybeNotifyTier(tier, previousTier);
  }

  function multiplayerV2DeathCause(event) {
    const cause = String(event && event.cause || "");
    if (cause === "body-impact") {
      return "Crushing impact";
    }
    if (cause === "mob-contact") {
      return "Hostile contact";
    }
    if (cause === "projectile") {
      return "Contact fire";
    }
    return "Hull failure";
  }

  function markMultiplayerV2EventSeen(event) {
    const key = multiplayerV2EventKey(event);
    if (!key) {
      return false;
    }
    if (!multiplayer.v2.eventKeys || typeof multiplayer.v2.eventKeys.has !== "function") {
      multiplayer.v2.eventKeys = new Map();
    }
    const now = performance.now();
    for (const [eventKey, seenAt] of multiplayer.v2.eventKeys.entries()) {
      if (now - seenAt > 3500) {
        multiplayer.v2.eventKeys.delete(eventKey);
      }
    }
    if (multiplayer.v2.eventKeys.has(key)) {
      return false;
    }
    multiplayer.v2.eventKeys.set(key, now);
    return true;
  }

  function processMultiplayerV2Events(events) {
    if (!Array.isArray(events)) {
      return;
    }
    for (const event of events) {
      if (!markMultiplayerV2EventSeen(event)) {
        continue;
      }
      if (event.type === "mob.hit") {
        playSound("mobHit", { throttleKey: "mpV2MobHit", throttle: 0.04 });
      } else if (event.type === "mob.defeated") {
        playSound("mobDestroyed", { throttleKey: "mpV2MobDestroyed", throttle: 0.08 });
      } else if (event.type === "player.shot") {
        playSound("laser", { throttleKey: "mpV2PlayerShot:" + String(event.projectileId || ""), throttle: 0.02 });
      } else if (event.type === "player.hitByPlayerProjectile") {
        playSound("mobHit", { throttleKey: "mpV2PlayerProjectileHit", throttle: 0.06 });
      } else if (event.type === "body.merged") {
        processMultiplayerV2BodyMergeEvent(event);
      } else if (event.type === "pickup.tech" && String(event.playerId || "") === player.id) {
        playSound("pickupTech", { throttleKey: "mpV2PickupTech", throttle: 0.05 });
      } else if (event.type === "pickup.health" && String(event.playerId || "") === player.id) {
        playSound("pickupHealth", { throttleKey: "mpV2PickupHealth", throttle: 0.08 });
      } else if (event.type === "player.died" && String(event.playerId || "") === player.id) {
        if (Math.floor(finiteOr(event.tick, 0)) <= Math.floor(finiteOr(multiplayer.v2.ignoreDeathEventsBeforeTick, 0))) {
          continue;
        }
        beginPlayerDeath(multiplayerV2DeathCause(event));
      }
    }
  }

  function partyV2StartState(message) {
    const snapshot = message && message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
    if (snapshot && snapshot.v2 && snapshot.state) {
      return mpV2Sim.serializeState(snapshot.state);
    }
    const sessionPlayers = message && message.session && Array.isArray(message.session.players) ? message.session.players : lobbyPlayers();
    return mpV2Sim.createInitialState(snapshot || buildPersistentPayload(true), sessionPlayers, {
      seed: message && (message.sessionId || message.id || message.roomId || "client-v2")
    });
  }

  function startMultiplayerV2(message) {
    if (!mpV2Sim) {
      maybeNotifyText("Multiplayer V2 unavailable.");
      return false;
    }
    const session = message && message.session && typeof message.session === "object" ? message.session : multiplayer.partySession;
    const roomId = String(session && (session.sessionId || session.id) || message && message.roomId || "");
    if (!roomId) {
      return false;
    }
    resetMultiplayerV2State();
    multiplayer.v2.active = true;
    multiplayer.v2.roomId = roomId;
    multiplayer.v2.state = partyV2StartState(message || {});
    multiplayer.v2.authoritativeState = mpV2Sim.serializeState(multiplayer.v2.state);
    multiplayer.v2.lastServerTick = multiplayer.v2.state.tick || 0;
    multiplayer.v2.lastAckInputSeq = 0;
    multiplayer.v2.pendingInputs = [];
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPlayerSnapshots.clear();
    syncMultiplayerV2StateToGame({ snapLocal: true });
    return true;
  }

  function buildMultiplayerV2Input(seq) {
    if (!isContinuousPlayerEnergyInputPressed()) {
      playerContinuousEnergyLocked = false;
    }
    const aim = getAim();
    const toolMode = multiplayerLocalToolModeForInput();
    const landAction = multiplayer.v2.landRequested === "takeoff" ? "takeoff" : multiplayer.v2.landRequested === "land" ? "land" : "";
    multiplayer.v2.landRequested = "";
    return {
      playerId: player.id,
      roomId: multiplayer.v2.roomId,
      seq,
      clientTick: multiplayer.v2.clientTick,
      aimAngle: Math.atan2(aim.world.y, aim.world.x),
      aimLocalAngle: aim.angle,
      equippedTool: equippedToolId || defaultToolId,
      toolMode,
      buttons: {
        up: isMovementKeyPressed("up"),
        down: isMovementKeyPressed("down"),
        left: isMovementKeyPressed("left"),
        right: isMovementKeyPressed("right"),
        land: Boolean(landAction),
        landAction,
        boost: canSendMultiplayerBoostInput(),
        pull: toolMode === "pull",
        push: toolMode === "push",
        hold: toolMode === "hold",
        fire: toolMode === "fire"
      }
    };
  }

  function multiplayerV2FrameDt(dt) {
    return Math.min(multiplayerV2MaxFrameDt, Math.max(0, finiteOr(dt, 0)));
  }

  function multiplayerV2DuelPairsForPrediction() {
    const pairs = [];
    for (const peerId of multiplayer.duels || []) {
      const ids = [player.id, String(peerId || "")].filter(Boolean).sort();
      if (ids.length === 2 && ids[0] !== ids[1]) {
        pairs.push(ids.join("|"));
      }
    }
    return pairs;
  }

  function frameRateIndependentBlend(perFrameBlend, dt) {
    const blend = clamp(finiteOr(perFrameBlend, 0), 0, 1);
    if (blend >= 1) {
      return 1;
    }
    const frames = Math.max(0, finiteOr(dt, 1 / 60)) * 60;
    return clamp(1 - Math.pow(1 - blend, frames), 0, 1);
  }

  function sendMultiplayerV2Input(input) {
    if (!input || !isMultiplayerV2Active()) {
      return false;
    }
    return sendMultiplayer({
      type: "mp.v2.input",
      roomId: multiplayer.v2.roomId,
      seq: input.seq,
      clientTick: input.clientTick,
      aimAngle: input.aimAngle,
      aimLocalAngle: input.aimLocalAngle,
      equippedTool: input.equippedTool,
      toolMode: input.toolMode,
      buttons: input.buttons
    });
  }

  function applyLocalMultiplayerV2BuildAction(action) {
    if (!mpV2Sim || !isMultiplayerV2Active() || !multiplayer.v2.state || !action || typeof action !== "object") {
      return false;
    }

    let changed = false;
    if (action.action === "craftTool") {
      changed = mpV2Sim.craftTool(multiplayer.v2.state, player.id, action.recipeId);
    } else if (action.action === "upgradeTool") {
      changed = mpV2Sim.upgradeTool(multiplayer.v2.state, player.id, action.toolId, action.upgradeId);
    } else if (action.action === "setEquippedTools") {
      changed = mpV2Sim.setEquippedTools(multiplayer.v2.state, player.id, action.equippedTool, action.equippedTools);
    } else if (action.action === "placeStructure") {
      changed = mpV2Sim.placeStructure(multiplayer.v2.state, player.id, action.recipeId, action.placement, action.linkedPlacement);
    }

    if (changed) {
      syncMultiplayerV2StateToGame({ snapLocal: true });
    }
    return changed;
  }

  function sendMultiplayerV2BuildAction(action) {
    if (!isMultiplayerV2Active() || !action || typeof action !== "object") {
      return false;
    }

    const sent = sendMultiplayer({
      type: "mp.v2.action",
      roomId: multiplayer.v2.roomId,
      ...action
    });
    if (sent) {
      applyLocalMultiplayerV2BuildAction(action);
    }
    return sent;
  }

  function multiplayerV2WorldEntityCount(world) {
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

  function updateMultiplayerV2Perf(patch) {
    if (!multiplayer.v2.perf) {
      multiplayer.v2.perf = {};
    }
    Object.assign(multiplayer.v2.perf, patch || {});
    if (typeof window !== "undefined") {
      window.__clusternautsMultiplayerPerf = {
        ...(window.__clusternautsMultiplayerPerf || {}),
        v2: { ...multiplayer.v2.perf }
      };
    }
  }

  function applyMultiplayerV2Snapshot(message) {
    if (!mpV2Sim || !message || !message.state) {
      return;
    }
    const reconcileStart = performance.now();
    if (!multiplayer.v2.active) {
      resetMultiplayerV2State();
      multiplayer.v2.active = true;
      multiplayer.v2.roomId = String(message.roomId || "");
    }
    const ack = message.ackInputSeq && typeof message.ackInputSeq === "object"
      ? Math.max(0, Math.floor(finiteOr(message.ackInputSeq[player.id], multiplayer.v2.lastAckInputSeq)))
      : multiplayer.v2.lastAckInputSeq;
    multiplayer.v2.lastAckInputSeq = Math.max(multiplayer.v2.lastAckInputSeq, ack);
    multiplayer.v2.pendingInputs = multiplayer.v2.pendingInputs.filter((input) => input.seq > multiplayer.v2.lastAckInputSeq);
    multiplayer.v2.authoritativeState = mpV2Sim.serializeState(message.state);
    multiplayer.v2.lastServerTick = Math.max(multiplayer.v2.lastServerTick, Math.floor(finiteOr(message.serverTick, message.state.tick || 0)));
    if (message.perf && typeof message.perf === "object") {
      updateMultiplayerV2Perf({
        serverStepMs: finiteOr(message.perf.stepMs, multiplayer.v2.perf && multiplayer.v2.perf.serverStepMs),
        serverSnapshotBytes: finiteOr(message.perf.snapshotBytes, multiplayer.v2.perf && multiplayer.v2.perf.serverSnapshotBytes),
        serverMaxInputQueue: finiteOr(message.perf.maxInputQueue, multiplayer.v2.perf && multiplayer.v2.perf.serverMaxInputQueue)
      });
    }
    processMultiplayerV2Events(message.events);

    const oldX = player.x;
    const oldY = player.y;
    const replayInputs = multiplayer.v2.pendingInputs.map((input) => Object.assign({}, input));
    multiplayer.v2.state = mpV2Sim.replayFromSnapshot(multiplayer.v2.authoritativeState, replayInputs, {
      dt: mpV2Sim.TICK_DT,
      enableMobs: true,
      duels: multiplayerV2DuelPairsForPrediction()
    });
    syncMultiplayerV2StateToGame({ previousLocalX: oldX, previousLocalY: oldY, blendDt: mpV2Sim.TICK_DT });
    updateMultiplayerV2Perf({
      reconcileMs: performance.now() - reconcileStart,
      pendingInputs: multiplayer.v2.pendingInputs.length,
      entityCount: multiplayerV2WorldEntityCount(message.state.world)
    });
  }

  function syncMultiplayerV2StateToGame(options) {
    const state = multiplayer.v2.state;
    if (!state || !state.players || !state.world) {
      return;
    }
    const local = state.players[player.id];
    if (local) {
      const previousHealth = player.health;
      const previousX = Number.isFinite(options && options.previousLocalX) ? options.previousLocalX : player.x;
      const previousY = Number.isFinite(options && options.previousLocalY) ? options.previousLocalY : player.y;
      const snapLocal = Boolean(options && options.snapLocal);
      const localLanding = normalizeLandingSnapshot(local.landed);
      const error = Math.hypot(local.x - previousX, local.y - previousY);
      const correctionBlend = frameRateIndependentBlend(
        multiplayerV2LocalCorrectionBlendPerFrame,
        options && options.blendDt
      );
      const blend = !snapLocal && !localLanding && error < 360 ? correctionBlend : 1;
      player.x = previousX + (finiteOr(local.x, previousX) - previousX) * blend;
      player.y = previousY + (finiteOr(local.y, previousY) - previousY) * blend;
      player.vx = finiteOr(local.vx, player.vx);
      player.vy = finiteOr(local.vy, player.vy);
      player.radius = finiteOr(local.radius, player.radius);
      player.maxHealth = clamp(finiteOr(local.maxHealth, player.maxHealth), 1, 100);
      player.health = clamp(finiteOr(local.health, player.health), 0, player.maxHealth);
      player.maxEnergy = clamp(finiteOr(local.maxEnergy, player.maxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
      player.energy = clamp(finiteOr(local.energy, player.energy), 0, player.maxEnergy);
      player.hitCooldown = Math.max(0, finiteOr(local.hitCooldown, player.hitCooldown || 0));
      player.landed = localLanding;
      player.walkCycle = finiteOr(local.walkCycle, player.walkCycle);
      cameraRoll = player.landed ? surfaceCameraRollForAngle(player.landed.angle) : finiteOr(local.cameraRoll, cameraRoll);
      syncTechInventoryFromMultiplayerV2(local.tech);
      applyToolInventory(local.tools, local.equippedTool, local.equippedTools);
      applyToolUpgrades(local.toolUpgrades);
      if (!deathState.active && previousHealth > player.health && player.health > 0) {
        playSound("hit", { throttleKey: "mpV2LocalDamage", throttle: 0.08 });
      }
      if (!deathState.active && previousHealth > 0 && player.health <= 0) {
        beginPlayerDeath("Hull failure");
      }
    }

    const syncStart = performance.now();
    syncMultiplayerV2World(state.world);
    syncMultiplayerV2RemotePlayers(state);
    updateMultiplayerV2Perf({
      syncMs: performance.now() - syncStart,
      entityCount: multiplayerV2WorldEntityCount(state.world)
    });
    updateHud();
  }

  function syncTechInventoryFromMultiplayerV2(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }
    let changed = false;
    for (const tech of techTypes) {
      const nextValue = Math.max(0, Math.floor(finiteOr(snapshot[tech.key], techInventory[tech.key] || 0)));
      if (techInventory[tech.key] !== nextValue) {
        techInventory[tech.key] = nextValue;
        changed = true;
      }
    }
    if (changed) {
      updateTechUi();
    }
  }

  function syncMultiplayerV2EntityList(target, sourceList, normalizer) {
    const incoming = Array.isArray(sourceList) ? sourceList : [];
    const existingById = new Map();
    for (const entity of target) {
      if (entity && entity.id !== undefined && entity.id !== null) {
        existingById.set(String(entity.id), entity);
      }
    }

    const next = [];
    for (const snapshot of incoming) {
      const normalized = normalizer(snapshot);
      if (!normalized) {
        continue;
      }
      const existing = existingById.get(String(normalized.id));
      if (existing) {
        Object.assign(existing, normalized);
        next.push(existing);
      } else {
        next.push(normalized);
      }
    }

    target.length = 0;
    target.push(...next);
  }

  function syncMultiplayerV2World(world) {
    const source = world && typeof world === "object" ? world : {};
    if (Array.isArray(source.claimedTechPickupIds)) {
      multiplayer.claimedTechPickupIds = new Set(source.claimedTechPickupIds.map(String));
    }
    if (Array.isArray(source.claimedHealthPickupIds)) {
      multiplayer.claimedHealthPickupIds = new Set(source.claimedHealthPickupIds.map(String));
    }
    if (Array.isArray(source.starDust)) {
      starDust.length = 0;
      starDust.push(...source.starDust.map(normalizeStarSnapshot).filter(Boolean));
    }
    syncMultiplayerV2EntityList(particles, source.particles, normalizeParticleSnapshot);
    syncMultiplayerV2EntityList(rivals, source.alienoids, normalizeRivalSnapshot);
    syncMultiplayerV2EntityList(ufos, source.ufos, normalizeUfoSnapshot);
    syncMultiplayerV2EntityList(rambots, source.rambots, normalizeRambotSnapshot);
    syncMultiplayerV2EntityList(engineers, source.engineers, normalizeEngineerSnapshot);
    syncMultiplayerV2EntityList(teslas, source.teslas, normalizeTeslaSnapshot);
    syncMultiplayerV2EntityList(rockets, source.rockets, normalizeRocketSnapshot);
    syncMultiplayerV2EntityList(fighters, source.fighters, normalizeFighterSnapshot);
    syncMultiplayerV2EntityList(structures, source.structures, normalizeStructureSnapshot);
    syncMultiplayerV2EntityList(rivalProjectiles, source.rivalProjectiles, normalizeProjectileSnapshot);
    syncMultiplayerV2EntityList(techPickups, source.techPickups, normalizeTechPickupSnapshot);
    syncMultiplayerV2EntityList(healthPickups, source.healthPickups, normalizeHealthPickupSnapshot);
    nextParticleId = Math.max(finiteOr(source.nextParticleId, nextParticleId), particles.reduce((largest, body) => Math.max(largest, body.id + 1), 1));
    nextTechPickupId = Math.max(finiteOr(source.nextTechPickupId, nextTechPickupId), techPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1));
    nextHealthPickupId = Math.max(finiteOr(source.nextHealthPickupId, nextHealthPickupId), healthPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1));
  }

  function syncMultiplayerV2RemotePlayers(state) {
    const now = performance.now();
    const players = state && state.players ? state.players : {};
    for (const [remotePlayerId, remotePlayer] of Object.entries(players)) {
      if (!remotePlayer || remotePlayerId === player.id) {
        continue;
      }
      const remote = getRemoteUniverse("solo:" + remotePlayerId);
      remote.playerId = remotePlayerId;
      remote.publicName = remotePlayer.name || remote.publicName || remotePlayerId;
      remote.partySessionId = multiplayer.partySession ? multiplayer.partySession.id : "";
      remote.transform = createRemoteTransform(0, 0, 1, "overlap", "party");
      remote.displayTransform = remote.displayTransform || { ...remote.transform };
      remote.snapshot = normalizeRemoteSnapshot({
        player: {
          ...remotePlayer,
          equippedTool: remotePlayer.equippedTool || defaultToolId,
          toolMode: remotePlayer.toolMode || "idle",
          toolActive: remotePlayer.toolMode && remotePlayer.toolMode !== "idle"
        },
        world: {
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
          healthPickups: []
        }
      });
      remote.seenAt = now;
      addRemoteSnapshotFrame(remote, remote.snapshot, now / 1000);
    }
  }

  function stepMultiplayerV2Simulation(dt, includeExternalSystems) {
    if (!isMultiplayerV2Active()) {
      return;
    }
    const frameDt = multiplayerV2FrameDt(dt);
    updateGadgetAim(frameDt);
    multiplayer.v2.fixedAccumulator = Math.min(multiplayerV2MaxAccumulator, multiplayer.v2.fixedAccumulator + frameDt);
    const stepStart = performance.now();
    let stepped = 0;
    while (multiplayer.v2.fixedAccumulator + 0.000001 >= mpV2Sim.TICK_DT && stepped < multiplayerV2MaxCatchUpSteps) {
      multiplayer.v2.fixedAccumulator -= mpV2Sim.TICK_DT;
      multiplayer.v2.clientTick += 1;
      const input = buildMultiplayerV2Input(multiplayer.v2.inputSeq + 1);
      multiplayer.v2.inputSeq = input.seq;
      multiplayer.v2.pendingInputs.push(input);
      while (multiplayer.v2.pendingInputs.length > 180) {
        multiplayer.v2.pendingInputs.shift();
      }
      mpV2Sim.step(multiplayer.v2.state, { [player.id]: input }, {
        dt: mpV2Sim.TICK_DT,
        enableMobs: true,
        duels: multiplayerV2DuelPairsForPrediction()
      });
      processMultiplayerV2Events(multiplayer.v2.state && multiplayer.v2.state.events);
      sendMultiplayerV2Input(input);
      stepped += 1;
    }
    if (stepped >= multiplayerV2MaxCatchUpSteps) {
      multiplayer.v2.fixedAccumulator = Math.min(multiplayer.v2.fixedAccumulator, mpV2Sim.TICK_DT * multiplayerV2MaxCatchUpSteps);
    }
    if (stepped) {
      updateMultiplayerV2Perf({
        clientStepMs: performance.now() - stepStart,
        pendingInputs: multiplayer.v2.pendingInputs.length,
        entityCount: multiplayerV2WorldEntityCount(multiplayer.v2.state && multiplayer.v2.state.world)
      });
    }
    syncMultiplayerV2StateToGame({ blendDt: frameDt || mpV2Sim.TICK_DT });
    updateRemoteVisualTransforms(frameDt);
    updateRemoteInteractions(frameDt);
    updateInteractionState(frameDt);
    pruneRemoteUniverses();
    updateSparks(frameDt);
    if (includeExternalSystems) {
      updateMultiplayer(frameDt);
    }
  }

  function applyPartyState(message) {
    const session = message && message.session && typeof message.session === "object" ? message.session : message;
    if (!session || typeof session !== "object") {
      return;
    }
    if (!multiplayer.partySession) {
      multiplayer.partySession = {
        id: String(session.sessionId || session.id || ""),
        lobbyId: String(session.lobbyId || ""),
        code: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
        joinCode: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
        maxPlayers: Math.max(1, Math.floor(finiteOr(session.maxPlayers, crazyGamesRoomMaxPlayers))),
        players: [],
        pvpMode: String(session.pvpMode || "party-off"),
        netcodeVersion: Math.max(1, Math.floor(finiteOr(session.netcodeVersion, 1)))
      };
    }
    multiplayer.partySession.id = String(session.sessionId || session.id || multiplayer.partySession.id || "");
    multiplayer.partySession.lobbyId = String(session.lobbyId || multiplayer.partySession.lobbyId || "");
    multiplayer.partySession.code = sanitizeLobbyCode(session.joinCode || session.code || multiplayer.partySession.code || multiplayer.partySession.lobbyId);
    multiplayer.partySession.joinCode = multiplayer.partySession.code;
    multiplayer.partySession.maxPlayers = Math.max(1, Math.floor(finiteOr(session.maxPlayers, multiplayer.partySession.maxPlayers || crazyGamesRoomMaxPlayers)));
    multiplayer.partySession.players = Array.isArray(session.players)
      ? session.players.map(normalizeLobbyPlayer).filter(Boolean)
      : multiplayer.partySession.players || [];
    multiplayer.partySession.pvpMode = String(session.pvpMode || multiplayer.partySession.pvpMode || "party-off");
    multiplayer.partySession.netcodeVersion = Math.max(1, Math.floor(finiteOr(session.netcodeVersion, multiplayer.partySession.netcodeVersion || 1)));
    multiplayer.partyJoinCode = multiplayer.partySession.joinCode;
    multiplayer.partyHostId = String(session.hostPlayerId || multiplayer.partyHostId || player.id);
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    updateSettingsJoinCodeUi();
  }

  function applyPartyStart(message) {
    const session = message && message.session && typeof message.session === "object" ? message.session : message;
    const difficulty = difficultyDefinitions[session.difficulty] ? session.difficulty : selectedLobbyDifficulty();
    multiplayer.partySession = {
      id: String(session.sessionId || session.id || ""),
      lobbyId: String(session.lobbyId || ""),
      code: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
      joinCode: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
      maxPlayers: Math.max(1, Math.floor(finiteOr(session.maxPlayers, crazyGamesRoomMaxPlayers))),
      players: Array.isArray(session.players) ? session.players.map(normalizeLobbyPlayer).filter(Boolean) : lobbyPlayers(),
      pvpMode: String(session.pvpMode || "party-off"),
      netcodeVersion: Math.max(1, Math.floor(finiteOr(session.netcodeVersion, 1)))
    };
    multiplayer.partyJoinCode = multiplayer.partySession.joinCode;
    multiplayer.partyMode = "party";
    multiplayer.partyHostId = String(session.hostPlayerId || message.hostPlayerId || player.id);
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    multiplayer.partyPlayerSnapshots.clear();
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    multiplayer.partyInputTimer = 0;
    multiplayer.partyInputSeq = 0;
    multiplayer.partyLastInputSnapshot = null;
    multiplayer.lobby = null;
    multiplayer.lobbyInviteLink = "";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";

    applyDifficulty(difficulty);
    resetLocalPlayerState();
    resetLocalWorldState();
    resetLifeStats();
    resetDeathState();

    if (isPartyV2Session(multiplayer.partySession) && startMultiplayerV2(message)) {
      runState.active = true;
      gamePaused = false;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setDifficultyScreenOpen(false);
      resetMouseButtons();
      lastTime = performance.now();
      updateHud();
      updateSettingsJoinCodeUi();
      connectMultiplayer();
      maybeNotifyText("Joined server-authoritative shared world.");
      clearCrazyGamesRoomState("party-start-v2");
      return;
    }

    resetMultiplayerV2State();

    if (message.snapshot && typeof message.snapshot === "object") {
      if (message.snapshot.world) {
        applyWorldSnapshot(message.snapshot.world);
      }
      if (isPartyHost() && message.snapshot.player) {
        applyPlayerSnapshot(message.snapshot.player);
      }
    }

    runState.active = true;
    gamePaused = false;
    persistence.saveTimer = persistenceSaveInterval;
    persistence.pollTimer = persistencePollInterval;
    setDifficultyScreenOpen(false);
    resetMouseButtons();
    lastTime = performance.now();
    updateHud();
    updateSettingsJoinCodeUi();
    connectMultiplayer();
    maybeNotifyText(isPartyHost() ? "Shared world started." : "Joined shared world.");
    clearCrazyGamesRoomState("party-start");
  }

  function applyPartyHostChanged(message) {
    if (message && message.session) {
      applyPartyState(message);
    }
    multiplayer.partyHostId = String(message.hostPlayerId || "");
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    maybeNotifyText(isPartyHost() ? "You are now host." : "Host migrated.");
    if (message.snapshot && isPartyHost()) {
      applyWorldSnapshot(message.snapshot.world);
    }
  }

  function applyPartyWorldSnapshot(message) {
    if (!isPartySessionActive() || isPartyHost()) {
      return;
    }
    if (!joinedPlayerIsolationAllows("hostWorldSnapshots")) {
      return;
    }
    const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : message;
    if (snapshot.world) {
      applyWorldSnapshot(snapshot.world, { smoothParticles: true, smoothEntities: true });
    }
    if (snapshot.player) {
      applyPartyPlayerSnapshot({
        fromPlayerId: multiplayer.partyHostId,
        publicName: message.hostName || "Host",
        snapshot: { player: snapshot.player }
      });
    }
  }

  function applyPartyPlayerSnapshot(message) {
    const fromPlayerId = String(message.fromPlayerId || message.playerId || "");
    if (!fromPlayerId || fromPlayerId === player.id) {
      return;
    }
    const source = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : message;
    if (!joinedPlayerIsolationAllows("partyPlayerSnapshots")) {
      applyPartyPlayerVisualSnapshot(message, source);
      return;
    }
    const inputSeq = partyInputSeqFromSnapshot(source);
    if (inputSeq > 0) {
      const previousSeq = multiplayer.partyInputSeqByPlayer.get(fromPlayerId) || 0;
      if (inputSeq < previousSeq) {
        return;
      }
      multiplayer.partyInputSeqByPlayer.set(fromPlayerId, inputSeq);
    }
    multiplayer.partyPlayerSnapshots.set(fromPlayerId, {
      playerId: fromPlayerId,
      snapshot: source,
      receivedAt: performance.now()
    });
    const remote = getRemoteUniverse("solo:" + fromPlayerId);
    remote.playerId = fromPlayerId;
    remote.publicName = message.publicName || message.fromName || remote.publicName || fromPlayerId;
    remote.partySessionId = multiplayer.partySession ? multiplayer.partySession.id : "";
    remote.teamId = message.teamId || remote.teamId || "";
    remote.transform = createRemoteTransform(0, 0, 1, "overlap", multiplayer.anomaly ? "anomaly" : "party");
    remote.displayTransform = { ...remote.transform };
    remote.snapshot = normalizeRemoteSnapshot({
      player: source.player || source,
      world: {
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
        healthPickups: []
      }
    });
    remote.seenAt = performance.now();
    addRemoteSnapshotFrame(remote, remote.snapshot, remote.seenAt / 1000);
  }

  function applyPartyPlayerVisualSnapshot(message, source) {
    const fromPlayerId = String(message.fromPlayerId || message.playerId || "");
    const playerSource = source && source.player && typeof source.player === "object" ? source.player : source;
    const incomingPlayer = normalizeRemotePlayerSnapshot(playerSource);
    if (!fromPlayerId || !incomingPlayer) {
      return;
    }

    const remote = getRemoteUniverse("solo:" + fromPlayerId);
    remote.playerId = fromPlayerId;
    remote.publicName = message.publicName || message.fromName || remote.publicName || fromPlayerId;
    remote.partySessionId = multiplayer.partySession ? multiplayer.partySession.id : "";
    remote.teamId = message.teamId || remote.teamId || "";
    remote.transform = remote.transform || createRemoteTransform(0, 0, 1, "overlap", multiplayer.anomaly ? "anomaly" : "party");
    remote.displayTransform = remote.displayTransform || { ...remote.transform };

    const previousSnapshot = remote.snapshot || normalizeRemoteSnapshot({
      player: incomingPlayer,
      world: {
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
        healthPickups: []
      }
    });
    const previousPlayer = previousSnapshot && previousSnapshot.player ? previousSnapshot.player : incomingPlayer;
    const visualPlayer = {
      ...previousPlayer,
      id: incomingPlayer.id || previousPlayer.id || fromPlayerId,
      name: incomingPlayer.name || previousPlayer.name || remote.publicName,
      aimAngle: incomingPlayer.aimAngle,
      aimLocalAngle: incomingPlayer.aimLocalAngle,
      visualAimLocalAngle: incomingPlayer.visualAimLocalAngle,
      cameraRoll: incomingPlayer.cameraRoll,
      equippedTool: incomingPlayer.equippedTool,
      toolMode: incomingPlayer.toolMode,
      toolActive: incomingPlayer.toolActive,
      moving: incomingPlayer.moving,
      crouching: incomingPlayer.crouching
    };

    remote.snapshot = {
      player: visualPlayer,
      world: previousSnapshot.world || {
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
        healthPickups: []
      }
    };
    remote.seenAt = performance.now();
    addRemoteSnapshotFrame(remote, remote.snapshot, remote.seenAt / 1000);
  }

  function partySessionIncludesPlayer(playerId) {
    const id = String(playerId || "");
    return Boolean(
      id &&
      multiplayer.partySession &&
      Array.isArray(multiplayer.partySession.players) &&
      multiplayer.partySession.players.some((entry) => {
        if (!entry) {
          return false;
        }
        return String(entry.playerId || entry.id || entry) === id;
      })
    );
  }

  function partyPhysicsRequestOwner(message) {
    return String(message && (message.fromPlayerId || message.playerId || message.ownerPlayerId) || "");
  }

  function partyPhysicsRequestSeq(message) {
    return Math.max(0, Math.floor(finiteOr(message && message.seq, 0)));
  }

  function partyPhysicsRequestActor(message) {
    return normalizeRemotePlayerSnapshot(message && message.actor);
  }

  function partyPhysicsCorrectionLimit(type, entity) {
    const radius = Math.max(1, finiteOr(entity && entity.radius, 1));
    if (normalizePartyEntityType(type) === "particle" && entity && entity.tier && entity.tier.solid) {
      return Math.max(720, radius * 5.2);
    }
    return Math.max(980, radius * 7.5);
  }

  function hostLocalPartyPhysicsConflict(type, entity) {
    if (!isPartyHost() || !entity || !canUseSuctionControls()) {
      return false;
    }
    const state = localPartyGadgetState(buildPersistentPayload(false).player);
    if (!state) {
      return false;
    }
    const cleanType = normalizePartyEntityType(type);
    if (cleanType === "particle" && state.landedBodyId === entity.id && (state.left || state.right)) {
      return true;
    }
    if (!state.active) {
      return false;
    }
    if (cleanType === "particle" && !partyGadgetCanAffectParticle(state, entity)) {
      return false;
    }
    const probe = partyGadgetParticleProbe(state, entity, { padding: 24 });
    return Boolean(probe.force || probe.bucket);
  }

  function validatePartyPhysicsRequest(message, options) {
    if (!isPartyHost()) {
      return { ok: false, reason: "not-host" };
    }
    const owner = partyPhysicsRequestOwner(message);
    if (!partySessionIncludesPlayer(owner)) {
      return { ok: false, reason: "not-party-member" };
    }
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const incoming = normalizePartyEntityState(type, message && message.state);
    const entity = findPartyEntity(type, id);
    if (!type || !id || !incoming || incoming.id !== id || !entity) {
      return { ok: false, reason: "missing-entity", type, id, owner };
    }
    const now = performance.now();
    const current = partyPhysicsSession(type, id, now);
    const seq = partyPhysicsRequestSeq(message);
    if (current && current.playerId && current.playerId !== owner) {
      return { ok: false, reason: "claimed", type, id, owner, entity };
    }
    if (current && seq > 0 && finiteOr(current.seq, 0) > 0 && seq < finiteOr(current.seq, 0)) {
      return { ok: false, reason: "stale", type, id, owner, entity };
    }
    if (!(options && options.allowExistingOwner) && hostLocalPartyPhysicsConflict(type, entity) && owner !== player.id) {
      return { ok: false, reason: "host-local-control", type, id, owner, entity };
    }

    const actor = partyPhysicsRequestActor(message);
    if (!actor) {
      return { ok: false, reason: "missing-actor", type, id, owner, entity };
    }
    const reach = gadgetForceReach + Math.max(300, finiteOr(entity.radius, 1) * 3.4);
    const hostDistance = Math.hypot(entity.x - actor.x, entity.y - actor.y);
    const incomingDistance = Math.hypot(incoming.x - actor.x, incoming.y - actor.y);
    if (Math.min(hostDistance, incomingDistance) > reach) {
      return { ok: false, reason: "out-of-range", type, id, owner, entity };
    }

    const correctionDistance = Math.hypot(incoming.x - entity.x, incoming.y - entity.y);
    if (correctionDistance > partyPhysicsCorrectionLimit(type, entity)) {
      return { ok: false, reason: "correction-too-large", type, id, owner, entity };
    }

    return { ok: true, type, id, owner, entity, incoming, seq, actor };
  }

  function applyAcceptedPartyPhysicsSession(validation, message) {
    const now = performance.now();
    const active = message && message.active !== false;
    const lease = active ? partyPhysicsSessionActiveHoldMs : partyFollowerPredictionHoldMs;
    const key = partyEntityKey(validation.type, validation.id);
    multiplayer.partyPhysicsSessions.set(key, {
      type: validation.type,
      id: validation.id,
      key,
      playerId: validation.owner,
      seq: validation.seq,
      expiresAt: now + lease,
      accepted: true,
      receivedAt: now
    });

    const solidParticle = validation.type === "particle" && validation.entity && validation.entity.tier && validation.entity.tier.solid;
    applyPartyEntityMotionState(validation.entity, validation.incoming, {
      positionBlend: solidParticle ? 0.86 : 0.94,
      velocityBlend: solidParticle ? 0.82 : 0.92
    });
    if (validation.type === "particle") {
      validation.entity.gadgetStabilized = false;
    }
    return validation.entity;
  }

  function sendPartyPhysicsHostAuthority(action, validation, entity) {
    sendMultiplayer({
      type: "party.physics.authority",
      action,
      entityType: validation.type,
      entityId: validation.id,
      ownerPlayerId: validation.owner,
      seq: validation.seq,
      state: entity ? serializePartyEntity(validation.type, entity) : null
    });
  }

  function sendPartyPhysicsHostReject(message, reason, entity) {
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    sendMultiplayer({
      type: "party.physics.reject",
      targetPlayerId: partyPhysicsRequestOwner(message),
      entityType: type,
      entityId: id,
      seq: partyPhysicsRequestSeq(message),
      reason,
      state: entity ? serializePartyEntity(type, entity) : null
    });
  }

  function handlePartyPhysicsSessionRequest(message) {
    const validation = validatePartyPhysicsRequest(message, {
      allowExistingOwner: message && message.type === "party.physics.state"
    });
    if (!validation.ok) {
      sendPartyPhysicsHostReject(message, validation.reason, validation.entity);
      return;
    }
    const entity = applyAcceptedPartyPhysicsSession(validation, message);
    sendPartyPhysicsHostAuthority(message.type === "party.physics.start" ? "start" : "state", validation, entity);
  }

  function handlePartyPhysicsEndRequest(message) {
    if (!isPartyHost()) {
      return;
    }
    const owner = partyPhysicsRequestOwner(message);
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const key = partyEntityKey(type, id);
    const entity = findPartyEntity(type, id);
    const claim = key ? partyPhysicsSession(type, id, performance.now()) : null;
    if ((!claim || claim.playerId !== owner) && message && message.reason === "collected" && type === "healthPickup") {
      const validation = validatePartyPhysicsRequest(message, { allowExistingOwner: true });
      if (!validation.ok) {
        sendPartyPhysicsHostReject(message, validation.reason, validation.entity);
        return;
      }
      removePartyEntity(type, id);
      multiplayer.partyPhysicsSessions.delete(key);
      sendPartyPhysicsHostAuthority("remove", validation, entity);
      return;
    }
    if (!owner || !key || !claim || claim.playerId !== owner) {
      sendPartyPhysicsHostReject(message, "end-not-owned", entity);
      return;
    }
    const incoming = normalizePartyEntityState(type, message && message.state);
    if (incoming && entity) {
      applyPartyEntityMotionState(entity, incoming, { positionBlend: 0.58, velocityBlend: 0.68 });
    }
    multiplayer.partyPhysicsSessions.delete(key);
    sendPartyPhysicsHostAuthority("end", { type, id, owner, seq: partyPhysicsRequestSeq(message) }, entity);
  }

  function applyPartyPhysicsAuthority(message) {
    if (!isPartySessionActive()) {
      return;
    }
    if (!joinedPlayerIsolationAllows("partyPhysicsAuthority")) {
      return;
    }
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const key = partyEntityKey(type, id);
    const owner = String(message && message.ownerPlayerId || "");
    const action = String(message && message.action || "update");
    if (!type || !id || !key || !owner) {
      return;
    }
    const now = performance.now();
    const entity = findPartyEntity(type, id);
    const incoming = normalizePartyEntityState(type, message && message.state);

    if (action === "end" || action === "release" || action === "remove") {
      multiplayer.partyPhysicsSessions.delete(key);
      if (owner === player.id) {
        multiplayer.localPartyPhysicsSessions.delete(key);
      }
      if (action === "remove") {
        if (type === "healthPickup") {
          multiplayer.claimedHealthPickupIds.add(String(id));
        }
        removePartyEntity(type, id);
        return;
      }
      if (entity && incoming) {
        applyPartyEntityMotionState(entity, incoming, { positionBlend: owner === player.id ? 0.28 : 0.58, velocityBlend: 0.64 });
        markEntitySmoothingTarget(entity, incoming, now);
      }
      return;
    }

    multiplayer.partyPhysicsSessions.set(key, {
      type,
      id,
      key,
      playerId: owner,
      seq: partyPhysicsRequestSeq(message),
      expiresAt: now + partyPhysicsSessionActiveHoldMs,
      accepted: true,
      receivedAt: now
    });

    if (owner === player.id) {
      const localClaim = multiplayer.localPartyPhysicsSessions.get(key);
      if (localClaim) {
        localClaim.accepted = true;
        localClaim.expiresAt = Math.max(finiteOr(localClaim.expiresAt, 0), now + partyPhysicsSessionLocalHoldMs);
      }
      return;
    }

    if (entity && incoming) {
      applyPartyEntityMotionState(entity, incoming, { positionBlend: 0.72, velocityBlend: 0.78 });
      markEntitySmoothingTarget(entity, incoming, now);
    }
  }

  function applyPartyPhysicsReject(message) {
    if (!joinedPlayerIsolationAllows("partyPhysicsRejects")) {
      return;
    }
    const targetPlayerId = String(message && message.targetPlayerId || "");
    if (targetPlayerId && targetPlayerId !== player.id) {
      return;
    }
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const key = partyEntityKey(type, id);
    if (!key) {
      return;
    }
    multiplayer.localPartyPhysicsSessions.delete(key);
    const claim = multiplayer.partyPhysicsSessions.get(key);
    if (claim && claim.playerId === player.id) {
      multiplayer.partyPhysicsSessions.delete(key);
    }
    const entity = findPartyEntity(type, id);
    const incoming = normalizePartyEntityState(type, message && message.state);
    if (entity && incoming) {
      applyPartyEntityMotionState(entity, incoming, { positionBlend: 0.84, velocityBlend: 0.9 });
      markEntitySmoothingTarget(entity, incoming, performance.now());
    }
  }

  function copyTextToClipboard(text, successMessage) {
    const value = String(text || "");
    if (!value) {
      return;
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(value).then(function () {
        setLobbyStatus(successMessage || "Copied.", "success");
      }).catch(function () {
        setLobbyStatus(value, "success");
      });
      return;
    }
    setLobbyStatus(value, "success");
  }

  async function beginRunWithDifficulty(id) {
    if (runState.active) {
      return;
    }
    resetSoloMultiplayerSession();
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
    updateSettingsJoinCodeUi();
    void refreshLeaderboard(true);
    await savePersistentState({ includeWorld: true });
    connectMultiplayer();
    if (multiplayer.friendJoinsEnabled && !multiplayer.pendingJoinRoomId && !multiplayer.roomCreatePending) {
      requestCrazyGamesRoomCreate("run-start");
    }
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
    nextRivalProjectileId = 1;
    nextTechPickupId = 1;
    nextHealthPickupId = 1;
    multiplayer.claimedTechPickupIds.clear();
    multiplayer.claimedHealthPickupIds.clear();
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
    updateRestartGameUi();

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
    clearCrazyGamesRoomState("identity-changed");

    player.id = cleanPlayerId;
    player.name = "Player " + cleanPlayerId.slice(-4).toUpperCase();
    document.body.dataset.playerId = cleanPlayerId;
    try {
      window.localStorage.setItem(playerIdStorageKey, cleanPlayerId);
    } catch {
      // Local storage can be unavailable in private or locked-down browser contexts.
    }

    if (runState.active && multiplayer.friendJoinsEnabled) {
      requestCrazyGamesRoomCreate("identity-changed");
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

  function readMultiplayerPreference() {
    try {
      const stored = window.localStorage.getItem(multiplayerPreferenceStorageKey);
      if (stored === "1") {
        return true;
      }
      if (stored === "0") {
        return false;
      }
    } catch {
      // Local storage can be unavailable in private or locked-down browser contexts.
    }
    return !isCrazyGamesRuntime();
  }

  function writeMultiplayerPreference(enabled) {
    try {
      window.localStorage.setItem(multiplayerPreferenceStorageKey, enabled ? "1" : "0");
    } catch {
      // Preference persistence is best-effort.
    }
  }

  function multiplayerStatusText() {
    if (!multiplayer.friendJoinsEnabled) {
      return "Multiplayer Off";
    }
    if (multiplayer.pendingJoinRoomId) {
      return "Joining friend room";
    }
    if (multiplayer.serverUnavailable && !multiplayer.connected) {
      return serverMaintenanceMessage;
    }
    if (multiplayer.roomCreatePending) {
      return "Multiplayer On";
    }
    if (multiplayer.roomId && multiplayer.roomPlayerCount >= multiplayer.roomMaxPlayers) {
      return "Room full";
    }
    if (multiplayer.roomId && multiplayer.roomJoinable) {
      return "Multiplayer On: Friends can join";
    }
    return "Multiplayer On";
  }

  function updateMultiplayerModeUi() {
    const enabled = Boolean(multiplayer.friendJoinsEnabled);
    const text = multiplayerStatusText();
    if (multiplayerToggleInput) {
      multiplayerToggleInput.checked = enabled;
    }
    if (multiplayerStatus) {
      multiplayerStatus.textContent = text;
      multiplayerStatus.classList.toggle("is-success", enabled && text !== "Room full" && !multiplayer.serverUnavailable);
      multiplayerStatus.classList.toggle("is-error", text === "Room full" || multiplayer.serverUnavailable);
    }
    if (multiplayerPanelStatus) {
      multiplayerPanelStatus.textContent = text;
    }
    if (multiplayerPanelToggle) {
      multiplayerPanelToggle.textContent = enabled ? "Disable" : "Enable";
    }
    const panelRow = multiplayerPanelStatus ? multiplayerPanelStatus.closest(".social-panel__multiplayer") : null;
    if (panelRow) {
      panelRow.classList.toggle("is-on", enabled && text !== "Room full" && !multiplayer.serverUnavailable);
      panelRow.classList.toggle("is-full", text === "Room full" || multiplayer.serverUnavailable);
    }
  }

  function sendMultiplayerOptIn() {
    sendMultiplayer({
      type: "multiplayer.optIn",
      enabled: Boolean(multiplayer.friendJoinsEnabled)
    });
  }

  function setFriendJoinsEnabled(enabled, reason, options) {
    const nextEnabled = Boolean(enabled);
    const changed = multiplayer.friendJoinsEnabled !== nextEnabled;
    multiplayer.friendJoinsEnabled = nextEnabled;
    if (!options || options.persist !== false) {
      writeMultiplayerPreference(nextEnabled);
    }

    if (!nextEnabled) {
      multiplayer.roomCreatePending = false;
      multiplayer.pendingJoinRoomId = "";
      if (multiplayer.connected) {
        sendMultiplayerOptIn();
        sendMultiplayer({ type: "overlap.leave" });
      }
      multiplayer.remoteUniverses.clear();
      clearCrazyGamesRoomState(reason || "multiplayer-off");
      if (!options || options.notify !== false) {
        maybeNotifyText("Multiplayer Off");
      }
      updateMultiplayerModeUi();
      if (multiplayer.panelOpen) {
        renderPlayerSearch();
      }
      return;
    }

    connectMultiplayer();
    if (multiplayer.connected) {
      sendMultiplayerOptIn();
    }
    if (changed && (!options || options.notify !== false)) {
      maybeNotifyText("Multiplayer On");
    }
    if (!runState.active && (!options || options.startRun !== false)) {
      void beginRunWithDifficulty(defaultDifficultyId);
    } else if (runState.active && !multiplayer.roomId && !multiplayer.pendingJoinRoomId) {
      requestCrazyGamesRoomCreate(reason || "multiplayer-on");
    }
    updateMultiplayerModeUi();
    if (multiplayer.panelOpen) {
      renderPlayerSearch();
    }
  }

  function sanitizeCrazyGamesRoomId(roomId) {
    return String(roomId || "").trim().slice(0, 96);
  }

  function normalizeCrazyGamesRoomMode(mode) {
    return String(mode || "world-overlap").trim().slice(0, 32) || "world-overlap";
  }

  function crazyGamesRoomInviteParams(roomId, mode) {
    return {
      roomId,
      mode: normalizeCrazyGamesRoomMode(mode),
      maxPlayers: String(crazyGamesRoomMaxPlayers)
    };
  }

  function logCrazyGamesQa(event, details) {
    if (!window.console || typeof console.info !== "function") {
      return;
    }

    console.info("[CrazyGames QA] " + event, details || {});
  }

  function isCrazyGamesRoomApiAvailable() {
    const game = crazyGamesGameModule();
    return Boolean(game && typeof game.updateRoom === "function");
  }

  function callCrazyGamesRoomMethod(methodName, payload, reason) {
    const game = crazyGamesGameModule();
    if (!game || typeof game[methodName] !== "function") {
      return false;
    }

    try {
      const result = payload === undefined ? game[methodName]() : game[methodName](payload);
      if (result && typeof result.catch === "function") {
        result.catch(function (error) {
          console.warn("CrazyGames room method failed.", { methodName, reason, error });
        });
      }
      return true;
    } catch (error) {
      console.warn("CrazyGames room method unavailable.", { methodName, reason, error });
      return false;
    }
  }

  function storeCrazyGamesInviteLink(inviteKey, link, inviteParams, reason) {
    if (crazyGamesState.lastInviteLinkKey !== inviteKey) {
      return;
    }

    crazyGamesState.inviteLinkPending = false;
    crazyGamesState.inviteLink = typeof link === "string" ? link : String(link || "");
    if (normalizeCrazyGamesRoomMode(inviteParams.mode) === "party-lobby") {
      multiplayer.lobbyInviteLink = crazyGamesState.inviteLink;
      renderLobby();
    }
    logCrazyGamesQa("invite link received", {
      reason,
      roomId: inviteParams.roomId,
      inviteParams,
      hasInviteLink: Boolean(crazyGamesState.inviteLink)
    });
  }

  function clearCrazyGamesInviteLinkState() {
    crazyGamesState.lastInviteLinkKey = "";
    crazyGamesState.inviteLinkPending = false;
    crazyGamesState.inviteLink = "";
    multiplayer.lobbyInviteLink = "";
  }

  function requestCrazyGamesInviteLink(inviteParams, reason) {
    const game = crazyGamesGameModule();
    if (!game || typeof game.inviteLink !== "function") {
      return false;
    }

    const cleanInviteParams = crazyGamesRoomInviteParams(inviteParams.roomId, inviteParams.mode);
    const inviteKey = JSON.stringify(cleanInviteParams);
    if (crazyGamesState.lastInviteLinkKey === inviteKey && (crazyGamesState.inviteLinkPending || crazyGamesState.inviteLink)) {
      return true;
    }

    crazyGamesState.lastInviteLinkKey = inviteKey;
    crazyGamesState.inviteLinkPending = true;
    crazyGamesState.inviteLink = "";
    logCrazyGamesQa("invite link requested", {
      reason,
      roomId: cleanInviteParams.roomId,
      inviteParams: cleanInviteParams
    });

    try {
      const result = game.inviteLink(cleanInviteParams);
      if (result && typeof result.then === "function") {
        result.then(function (link) {
          storeCrazyGamesInviteLink(inviteKey, link, cleanInviteParams, reason);
        }).catch(function (error) {
          if (crazyGamesState.lastInviteLinkKey === inviteKey) {
            crazyGamesState.inviteLinkPending = false;
          }
          console.warn("CrazyGames invite link failed.", { reason, inviteParams: cleanInviteParams, error });
        });
      } else {
        storeCrazyGamesInviteLink(inviteKey, result, cleanInviteParams, reason);
      }
      return true;
    } catch (error) {
      if (crazyGamesState.lastInviteLinkKey === inviteKey) {
        crazyGamesState.inviteLinkPending = false;
      }
      console.warn("CrazyGames invite link unavailable.", { reason, inviteParams: cleanInviteParams, error });
      return false;
    }
  }

  function reportCrazyGamesRoom(reason) {
    if (!isCrazyGamesRuntime()) {
      return;
    }
    if (!multiplayer.friendJoinsEnabled) {
      leaveCrazyGamesRoom(reason || "multiplayer-off");
      return;
    }

    const roomId = sanitizeCrazyGamesRoomId(multiplayer.roomId);
    if (!roomId) {
      leaveCrazyGamesRoom(reason);
      return;
    }

    const mode = normalizeCrazyGamesRoomMode(multiplayer.roomMode);
    const isJoinable = Boolean(multiplayer.roomJoinable && multiplayer.roomPlayerCount < multiplayer.roomMaxPlayers);
    const payload = {
      roomId,
      isJoinable,
      inviteParams: crazyGamesRoomInviteParams(roomId, mode)
    };
    const reportKey = JSON.stringify(payload);
    if (crazyGamesState.lastRoomReport === reportKey) {
      if (isJoinable) {
        requestCrazyGamesInviteLink(payload.inviteParams, reason);
      } else {
        clearCrazyGamesInviteLinkState();
      }
      return;
    }

    crazyGamesState.lastRoomReport = reportKey;
    const inviteLinkRequested = isJoinable ? requestCrazyGamesInviteLink(payload.inviteParams, reason) : false;
    if (!isJoinable) {
      clearCrazyGamesInviteLinkState();
    }

    if (!callCrazyGamesRoomMethod("updateRoom", payload, reason)) {
      const game = crazyGamesGameModule();
      if (game && typeof game.showInviteButton === "function" && isJoinable && !inviteLinkRequested) {
        callCrazyGamesRoomMethod("showInviteButton", payload.inviteParams, reason);
      } else if (game && typeof game.hideInviteButton === "function" && !isJoinable) {
        callCrazyGamesRoomMethod("hideInviteButton", undefined, reason);
      }
    }
  }

  function leaveCrazyGamesRoom(reason) {
    if (!crazyGamesState.lastRoomReport) {
      return;
    }

    crazyGamesState.lastRoomReport = "";
    clearCrazyGamesInviteLinkState();
    if (!callCrazyGamesRoomMethod("leftRoom", undefined, reason)) {
      callCrazyGamesRoomMethod("hideInviteButton", undefined, reason);
    }
  }

  function applyCrazyGamesRoomState(message) {
    const roomId = sanitizeCrazyGamesRoomId(message && message.roomId);
    if (!roomId) {
      clearCrazyGamesRoomState("missing-room-id");
      return;
    }

    multiplayer.roomId = roomId;
    multiplayer.roomMode = normalizeCrazyGamesRoomMode(message.mode);
    multiplayer.roomMaxPlayers = Math.max(1, Math.floor(finiteOr(message.maxPlayers, crazyGamesRoomMaxPlayers)));
    multiplayer.roomPlayerCount = Math.max(0, Math.floor(finiteOr(message.playerCount, 1)));
    multiplayer.roomJoinable = message.isJoinable !== false && multiplayer.roomPlayerCount < multiplayer.roomMaxPlayers;
    if (multiplayer.joinRequestedRoomId === roomId) {
      multiplayer.joinRequestedRoomId = "";
      logCrazyGamesQa("roomId joined", {
        roomId,
        mode: multiplayer.roomMode,
        playerCount: multiplayer.roomPlayerCount,
        maxPlayers: multiplayer.roomMaxPlayers
      });
    }
    reportCrazyGamesRoom("room-state");
    updateMultiplayerModeUi();
  }

  function clearCrazyGamesRoomState(reason) {
    multiplayer.roomId = "";
    multiplayer.roomMode = "world-overlap";
    multiplayer.roomPlayerCount = 0;
    multiplayer.roomMaxPlayers = crazyGamesRoomMaxPlayers;
    multiplayer.roomJoinable = false;
    multiplayer.joinRequestedRoomId = "";
    leaveCrazyGamesRoom(reason);
    updateMultiplayerModeUi();
  }

  function requestCrazyGamesRoomCreate(reason) {
    if (!multiplayer.friendJoinsEnabled || !multiplayer.enabled || !player.id) {
      return;
    }

    multiplayer.roomCreatePending = true;
    multiplayer.pendingJoinRoomId = "";
    connectMultiplayer();
    flushMultiplayerRoomRequests(reason || "create-room");
    updateMultiplayerModeUi();
  }

  function requestCrazyGamesRoomJoin(roomId, mode, reason) {
    const cleanRoomId = sanitizeCrazyGamesRoomId(roomId);
    if (!cleanRoomId || !multiplayer.enabled || !player.id) {
      return;
    }

    multiplayer.pendingJoinRoomId = cleanRoomId;
    multiplayer.pendingJoinMode = normalizeCrazyGamesRoomMode(mode);
    multiplayer.joinRequestedRoomId = cleanRoomId;
    multiplayer.roomCreatePending = false;
    connectMultiplayer();
    flushMultiplayerRoomRequests(reason || "join-room");
    updateMultiplayerModeUi();
  }

  function flushMultiplayerRoomRequests(reason) {
    if (!multiplayer.connected) {
      return;
    }

    if (multiplayer.pendingJoinRoomId) {
      const roomId = multiplayer.pendingJoinRoomId;
      const mode = multiplayer.pendingJoinMode;
      if (sendMultiplayer({ type: "room.join", roomId, mode })) {
        multiplayer.pendingJoinRoomId = "";
      }
      return;
    }

    if (multiplayer.friendJoinsEnabled && multiplayer.roomCreatePending) {
      if (sendMultiplayer({ type: "room.create", mode: "world-overlap", reason: reason || "room-create" })) {
        multiplayer.roomCreatePending = false;
        updateMultiplayerModeUi();
      }
    }
  }

  function flushLobbyRequests(reason) {
    if (!multiplayer.connected) {
      return;
    }

    if (multiplayer.lobbyJoinPending) {
      const code = multiplayer.lobbyJoinPending;
      if (sendMultiplayer({ type: "lobby.join", code, reason: reason || "lobby-join" })) {
        multiplayer.lobbyJoinPending = "";
      }
      return;
    }

    if (multiplayer.lobbyCreatePending) {
      if (sendMultiplayer({ type: "lobby.create", difficulty: selectedLobbyDifficulty(), reason: reason || "lobby-create" })) {
        multiplayer.lobbyCreatePending = false;
      }
    }
  }

  function handleCrazyGamesJoinParams(inviteParams, reason) {
    const params = inviteParams && typeof inviteParams === "object" ? inviteParams : {};
    const roomId = sanitizeCrazyGamesRoomId(params.roomId || params.roomName);
    if (!roomId) {
      return false;
    }

    logCrazyGamesQa("invite params used", {
      reason,
      roomId,
      inviteParams: params
    });
    if (normalizeCrazyGamesRoomMode(params.mode) === "party-lobby") {
      joinLobby(roomId);
      maybeNotifyText("Joined lobby");
      return true;
    }
    setFriendJoinsEnabled(true, reason || "invite-join", { persist: true, notify: false, startRun: false });
    if (!runState.active) {
      void beginRunWithDifficulty(defaultDifficultyId);
    }
    requestCrazyGamesRoomJoin(roomId, params.mode || "world-overlap", reason);
    maybeNotifyText("Joined friend room");
    return true;
  }

  async function readCrazyGamesInviteParams(game) {
    if (!game) {
      return null;
    }

    if (game.inviteParams && typeof game.inviteParams === "object") {
      return game.inviteParams;
    }

    if (typeof game.getInviteParam !== "function") {
      return null;
    }

    const params = {};
    for (const key of ["roomId", "roomName", "mode", "maxPlayers"]) {
      try {
        const value = await game.getInviteParam(key);
        if (value != null && value !== "") {
          params[key] = value;
        }
      } catch {
        // Missing invite params are normal on ordinary starts.
      }
    }
    return Object.keys(params).length ? params : null;
  }

  async function refreshCrazyGamesVisibleUser() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    if (!sdk || !sdk.user || typeof sdk.user.getUser !== "function") {
      return;
    }

    try {
      const user = await sdk.user.getUser();
      crazyGamesState.user = user && typeof user === "object" ? user : null;
      if (crazyGamesState.user && crazyGamesState.user.username) {
        player.name = sanitizePlayerName(crazyGamesState.user.username) || player.name;
        if (publicNameValue) {
          publicNameValue.textContent = player.name;
        }
      }
    } catch {
      crazyGamesState.user = null;
    }
  }

  function configureCrazyGamesMultiplayer(game) {
    if (!game || crazyGamesState.roomJoinListener) {
      return;
    }

    crazyGamesState.instantMultiplayer = Boolean(game.isInstantMultiplayer || game.isInstantJoin);
    crazyGamesState.roomJoinListener = function (inviteParams) {
      handleCrazyGamesJoinParams(inviteParams, "join-listener");
    };

    if (typeof game.addJoinRoomListener === "function") {
      try {
        game.addJoinRoomListener(crazyGamesState.roomJoinListener);
      } catch (error) {
        console.warn("CrazyGames room join listener unavailable.", error);
      }
    }
  }

  async function handleCrazyGamesStartupMultiplayer(game) {
    if (!game || crazyGamesState.initialInviteHandled) {
      return;
    }

    crazyGamesState.initialInviteHandled = true;
    const inviteParams = await readCrazyGamesInviteParams(game);
    if (handleCrazyGamesJoinParams(inviteParams, "startup-invite")) {
      return;
    }

    if (crazyGamesState.instantMultiplayer && !crazyGamesState.instantMultiplayerHandled) {
      crazyGamesState.instantMultiplayerHandled = true;
      setStartMenuView("lobby", { push: false });
      setDifficultyScreenOpen(true);
      createLobby();
    }
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
          configureCrazyGamesMultiplayer(sdk.game);
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
          } else if (typeof sdk.user.isUserAccountAvailable === "boolean") {
            crazyGamesState.authAvailable = sdk.user.isUserAccountAvailable;
            updateAccountUi();
          }
          crazyGamesState.authListener = function () {
            void authenticateWithCrazyGames();
          };
          sdk.user.addAuthListener(crazyGamesState.authListener);
        }

        await refreshCrazyGamesVisibleUser();
        await authenticateWithCrazyGames();
        await handleCrazyGamesStartupMultiplayer(sdk.game);
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
      await refreshCrazyGamesVisibleUser();
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
      renderStartSavedGames();
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
      renderStartSavedGames();
      return;
    }

    if (accountState.savesLoading) {
      const loading = document.createElement("p");
      loading.className = "settings-panel__save-empty";
      loading.textContent = "Loading saves...";
      savedGameList.append(loading);
      renderStartSavedGames();
      return;
    }

    if (!accountState.saves.length) {
      const empty = document.createElement("p");
      empty.className = "settings-panel__save-empty";
      empty.textContent = "No saved worlds yet.";
      savedGameList.append(empty);
      renderStartSavedGames();
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
    renderStartSavedGames();
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
    if (account.crazyGamesUsername) {
      player.name = sanitizePlayerName(account.crazyGamesUsername) || player.name;
      if (publicNameValue) {
        publicNameValue.textContent = player.name;
      }
    }
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
      const message = isServerMaintenanceError(error)
        ? serverMaintenanceMessage
        : error instanceof Error
        ? error.message.replace(/^Request failed \d+:?\s*/, "")
        : "Account request failed.";
      setManualSaveStatus(message, "error");
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
      setManualSaveStatus(backendErrorMessage(error, "Could not load saved games."), "error");
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

    if (isPartySessionActive() && !isPartyHost()) {
      setManualSaveStatus("Only the host can save this shared world.", "error");
      return false;
    }

    if (!isAccountSignedIn()) {
      if (isCrazyGamesRuntime()) {
        return await saveGuestProgress();
      }
      setManualSaveStatus("Create an account or log in to save.", "error");
      return false;
    }
    if (!name) {
      setManualSaveStatus("Enter a save name.", "error");
      return false;
    }
    if (!runState.active || deathState.active) {
      setManualSaveStatus("Start a live run before saving.", "error");
      return false;
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
      return true;
    } catch (error) {
      console.warn("Clusternauts manual save failed.", error);
      setManualSaveStatus(backendErrorMessage(error, "Could not save this game."), "error");
      return false;
    }
  }

  async function saveGuestProgress() {
    if (isPartySessionActive() && !isPartyHost()) {
      setManualSaveStatus("Only the host can save this shared world.", "error");
      return false;
    }

    if (!runState.active || deathState.active) {
      setManualSaveStatus("Start a live run before saving.", "error");
      return false;
    }

    setAccountBusy(true);
    try {
      updateLifeStats();
      await waitForPersistenceIdle();
      await savePersistentState({ includeWorld: true });
      await waitForPersistenceIdle();
      if (!persistence.online) {
        setManualSaveStatus(persistence.serverUnavailable ? serverMaintenanceMessage : "Could not save guest progress.", "error");
        return false;
      }
      setManualSaveStatus("Guest progress saved.", "success");
      maybeNotifyText("Guest progress saved.");
      return true;
    } finally {
      setAccountBusy(false);
    }
  }

  function updateRestartGameUi() {
    if (restartGameButton) {
      restartGameButton.disabled = restartGameInFlight || accountState.busy;
      restartGameButton.textContent = restartGameInFlight ? "Restarting..." : "Restart game";
    }

    const canSaveCurrentRun = runState.active && !deathState.active;
    if (restartGamePrompt) {
      restartGamePrompt.textContent = canSaveCurrentRun ? "Save your current game before restarting?" : "Start a new game?";
    }
    if (restartGameSaveFirstButton) {
      restartGameSaveFirstButton.disabled = restartGameInFlight || accountState.busy || !canSaveCurrentRun;
    }
    if (restartGameAnywayButton) {
      restartGameAnywayButton.disabled = restartGameInFlight || accountState.busy;
      restartGameAnywayButton.textContent = canSaveCurrentRun ? "Restart" : "New game";
    }
    if (restartGameCancelButton) {
      restartGameCancelButton.disabled = restartGameInFlight;
    }
  }

  function setRestartGameConfirmOpen(open) {
    if (restartGameConfirm) {
      restartGameConfirm.hidden = !open;
    }
    updateRestartGameUi();
  }

  async function restartGameFromSettings() {
    if (restartGameInFlight) {
      return;
    }

    restartGameInFlight = true;
    updateRestartGameUi();

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
      console.warn("Clusternauts restart cleanup failed.", error);
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
      clearCrazyGamesRoomState("restart-game");

      clearStoredNetworkIdentity();
      resetSoloMultiplayerSession();
      runState.active = false;
      gamePaused = false;
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
      initializeNetworkIdentity();
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setRestartGameConfirmOpen(false);
      setSettingsOpen(false);
      setStartMenuView("main", { push: false });
      setDifficultyScreenOpen(true);
      resetMouseButtons();
      lastTime = performance.now();
      void refreshLeaderboard(true);
      updateHud();
      setManualSaveStatus("Choose a difficulty to start a new game.", "success");
      maybeNotifyText("New game ready.");
    } catch (error) {
      console.warn("Clusternauts restart failed.", error);
      setManualSaveStatus("Could not restart the game.", "error");
    } finally {
      restartGameInFlight = false;
      updateRestartGameUi();
    }
  }

  async function saveThenRestartGame() {
    if (restartGameInFlight) {
      return;
    }

    const saved = await saveManualGame();
    if (!saved) {
      setRestartGameConfirmOpen(true);
      return;
    }

    await restartGameFromSettings();
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

      resetSoloMultiplayerSession();
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
    playerContinuousEnergyLocked = false;

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
      persistence.serverUnavailable = false;
      persistence.storage = data.storage || "database";
    } catch (error) {
      persistence.online = false;
      persistence.serverUnavailable = isServerMaintenanceError(error);
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
      persistence.serverUnavailable = false;
      persistence.storage = data.storage || persistence.storage;
    } catch (error) {
      persistence.online = false;
      persistence.serverUnavailable = isServerMaintenanceError(error);
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
      persistence.serverUnavailable = false;
      persistence.storage = data.storage || persistence.storage;
    } catch (error) {
      persistence.online = false;
      persistence.serverUnavailable = isServerMaintenanceError(error);
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
      let response;
      try {
        response = await fetch(apiUrl(url), Object.assign({}, options, { signal: controller.signal }));
      } catch (error) {
        throw createServerMaintenanceError(error);
      }

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw createServerMaintenanceError(response.status);
        }
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
      leaderboard.statusMessage = "";
      if (leaderboard.open) {
        renderLeaderboard();
      }
    } catch (error) {
      leaderboard.statusMessage = backendErrorMessage(error, "Leaderboard unavailable.");
      if (leaderboard.open) {
        renderLeaderboard();
      }
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
      leaderboard.statusMessage = "";
      if (leaderboard.open) {
        renderLeaderboard();
      }
      deathState.leaderboardSubmitted = true;
      return true;
    } catch (error) {
      leaderboard.statusMessage = backendErrorMessage(error, "Could not save this run.");
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
        if (!structure || !isLinkedStructureType(structure.type) || structure.health <= 0 || !structure.bodyId || !structure.linkedBodyId) {
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
    const multiplayerDeath = isPartySessionActive();
    if (deathLeaderboardForm) {
      deathLeaderboardForm.hidden = multiplayerDeath;
    }
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
    if (playAgainButton) {
      playAgainButton.disabled = false;
      playAgainButton.textContent = multiplayerDeath ? "Respawn" : "Play again";
      playAgainButton.classList.remove("is-loading");
    }
    if (deathMainMenuButton) {
      deathMainMenuButton.disabled = false;
      deathMainMenuButton.textContent = "Exit to main menu";
      deathMainMenuButton.classList.remove("is-loading");
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
      deathLeaderboardStatus.textContent = leaderboard.statusMessage || "Could not save this run.";
    }
  }

  function damageLocalPlayer(damage, options) {
    if (deathState.active || player.health <= 0) {
      return false;
    }
    if (multiplayer.partyRespawnInvulnerableTimer > 0) {
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
    if (!isPartySessionActive()) {
      clearCrazyGamesRoomState("death");
    }
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

  async function hardResetAfterDeath(options) {
    if (deathState.resetInFlight) {
      return;
    }

    const config = options && typeof options === "object" ? options : {};
    const loadingButton = config.button || playAgainButton;
    const nextStartMenuView = config.startMenuView || "main";
    const loadingText = config.loadingText || "Resetting...";
    const doneText = config.doneText || (loadingButton === deathMainMenuButton ? "Exit to main menu" : "Play again");

    deathState.resetInFlight = true;
    if (playAgainButton) {
      playAgainButton.disabled = true;
    }
    if (deathMainMenuButton) {
      deathMainMenuButton.disabled = true;
    }
    if (loadingButton) {
      loadingButton.textContent = loadingText;
      loadingButton.classList.add("is-loading");
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
      clearCrazyGamesRoomState("death-reset");

      clearStoredNetworkIdentity();
      resetSoloMultiplayerSession();
      runState.active = false;
      gamePaused = false;
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      initializeNetworkIdentity();
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      resetDeathState();
      setStartMenuView(nextStartMenuView, { push: false });
      setDifficultyScreenOpen(true);
      resetMouseButtons();
      lastTime = performance.now();
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
      if (deathMainMenuButton) {
        deathMainMenuButton.disabled = false;
        deathMainMenuButton.textContent = "Exit to main menu";
        deathMainMenuButton.classList.remove("is-loading");
      }
      if (loadingButton && loadingButton !== playAgainButton && loadingButton !== deathMainMenuButton) {
        loadingButton.textContent = doneText;
        loadingButton.classList.remove("is-loading");
      }
    }
  }

  function exitDeathToMainMenu() {
    if (deathState.resetInFlight) {
      return;
    }
    void hardResetAfterDeath({
      button: deathMainMenuButton,
      loadingText: "Exiting...",
      doneText: "Exit to main menu",
      startMenuView: "main"
    });
  }

  function chooseMultiplayerRespawnPoint(deathX, deathY) {
    const minRespawnDistance = 2400;
    const maxRespawnDistance = 5600;
    const idealRespawnDistance = 3600;
    const idealObjectClearance = 1100;
    let best = null;

    function clearanceFromEntity(x, y, entity, extraPadding) {
      if (!entity) {
        return Infinity;
      }
      const entityX = Number(entity.x);
      const entityY = Number(entity.y);
      if (!Number.isFinite(entityX) || !Number.isFinite(entityY)) {
        return Infinity;
      }
      const radius = Math.max(0, finiteOr(entity.radius, 0)) + Math.max(0, finiteOr(extraPadding, 0));
      return Math.hypot(x - entityX, y - entityY) - radius;
    }

    function objectClearanceAt(x, y) {
      let clearance = Infinity;

      function considerCollection(collection, padding) {
        if (!Array.isArray(collection)) {
          return;
        }
        for (const entity of collection) {
          clearance = Math.min(clearance, clearanceFromEntity(x, y, entity, padding));
        }
      }

      considerCollection(particles, 420);
      considerCollection(rivals, 360);
      considerCollection(ufos, 360);
      considerCollection(rambots, 360);
      considerCollection(engineers, 360);
      considerCollection(teslas, 360);
      considerCollection(rockets, 360);
      considerCollection(fighters, 360);
      considerCollection(techPickups, 220);
      considerCollection(healthPickups, 220);

      for (const structure of structures) {
        if (!structure || structure.health <= 0) {
          continue;
        }
        const structureRadius = typeof structureHitRadius === "function" ? structureHitRadius(structure) : 48;
        clearance = Math.min(clearance, clearanceFromEntity(x, y, Object.assign({}, structure, { radius: structureRadius }), 360));
      }

      for (const anchor of activePartyPlayerAnchors()) {
        if (!anchor || anchor.playerId === player.id) {
          continue;
        }
        clearance = Math.min(clearance, clearanceFromEntity(x, y, anchor, 620));
      }

      return Number.isFinite(clearance) ? clearance : idealObjectClearance;
    }

    function considerCandidate(x, y) {
      const deathDistance = Math.hypot(x - deathX, y - deathY);
      if (deathDistance < minRespawnDistance) {
        return;
      }
      const clearance = objectClearanceAt(x, y);
      const clearanceScore = Math.min(clearance, idealObjectClearance) * 2.4;
      const distanceScore = deathDistance * 0.32 - Math.abs(deathDistance - idealRespawnDistance) * 0.38;
      const score = clearanceScore + distanceScore + randomRange(0, 180);
      if (!best || score > best.score) {
        best = {
          x,
          y,
          score,
          clearance,
          deathDistance
        };
      }
    }

    for (let i = 0; i < 96; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const distance = randomRange(minRespawnDistance, maxRespawnDistance);
      considerCandidate(
        deathX + Math.cos(angle) * distance,
        deathY + Math.sin(angle) * distance
      );
    }

    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12 + randomRange(-0.12, 0.12);
      considerCandidate(
        deathX + Math.cos(angle) * idealRespawnDistance,
        deathY + Math.sin(angle) * idealRespawnDistance
      );
    }

    if (best) {
      return {
        x: best.x,
        y: best.y
      };
    }

    const fallbackAngle = randomRange(0, Math.PI * 2);
    return {
      x: deathX + Math.cos(fallbackAngle) * idealRespawnDistance,
      y: deathY + Math.sin(fallbackAngle) * idealRespawnDistance
    };
  }

  function respawnMultiplayerPlayer() {
    if (!isPartySessionActive() || deathState.resetInFlight) {
      return;
    }

    deathState.resetInFlight = true;
    const spawn = chooseMultiplayerRespawnPoint(player.x, player.y);
    resetLocalPlayerState();
    resetLifeStats();
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.hitCooldown = 0;
    player.hitFlash = 0;
    player.landed = null;
    multiplayer.partyRespawnInvulnerableTimer = 3.5;
    resetDeathState();
    deathState.resetInFlight = false;
    lastTime = performance.now();
    const respawnSnapshot = buildPersistentPayload(false).player;
    if (isMultiplayerV2Active() && mpV2Sim && typeof mpV2Sim.respawnPlayer === "function") {
      mpV2Sim.respawnPlayer(multiplayer.v2.state, player.id, respawnSnapshot);
      multiplayer.v2.authoritativeState = mpV2Sim.serializeState(multiplayer.v2.state);
      multiplayer.v2.ignoreDeathEventsBeforeTick = Math.max(
        Math.floor(finiteOr(multiplayer.v2.ignoreDeathEventsBeforeTick, 0)),
        Math.floor(finiteOr(multiplayer.v2.lastServerTick, 0)),
        Math.floor(finiteOr(multiplayer.v2.state && multiplayer.v2.state.tick, 0))
      );
      multiplayer.v2.pendingInputs = [];
      multiplayer.v2.fixedAccumulator = 0;
      syncMultiplayerV2StateToGame({ snapLocal: true });
    }
    sendMultiplayer({
      type: "party.respawn",
      snapshot: {
        player: respawnSnapshot
      }
    });
    maybeNotifyText("Respawned.");
  }

  function updatePersistence(dt) {
    if (!persistence.enabled || persistence.resetInFlight || deathState.active || !runState.active) {
      return;
    }
    if (isPartySessionActive() && !isPartyHost()) {
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
    if (!isCrazyGamesRuntime() && !hasCommunicationRelay()) {
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
    const relayOnly = multiplayer.socialMode === "relay" && !isCrazyGamesRuntime();

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
    } catch (error) {
      renderPlayerSearch(backendErrorMessage(error, "Search unavailable."));
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
      const hasRelay = isCrazyGamesRuntime() || Boolean(candidate.hasCommunicationRelay);

      row.className = "social-row";
      main.className = "social-row__main";
      name.className = "social-row__name";
      status.className = "social-row__status";
      name.textContent = candidate.publicName || candidate.playerId;
      if (multiplayer.socialMode === "relay") {
        status.textContent = !multiplayer.friendJoinsEnabled
          ? "Multiplayer Off"
          : candidate.friend
          ? "Friend relay online"
          : "Relay online";
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
        action.disabled = !multiplayer.friendJoinsEnabled || !candidate.online || !hasRelay || (!isCrazyGamesRuntime() && !hasCommunicationRelay());
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
    if (leaderboard.statusMessage) {
      const status = document.createElement("div");
      status.className = "leaderboard-row";
      status.textContent = leaderboard.statusMessage;
      leaderboardList.append(status);
    }
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
    if (!multiplayer.friendJoinsEnabled) {
      maybeNotifyText("Multiplayer Off");
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
      setCommandLockedState(!multiplayer.commandUnlocked);
      void refreshPlayerSearch();
      focusCommandInput();
      window.requestAnimationFrame(focusCommandInput);
      window.setTimeout(function () {
        focusCommandInput();
      }, 0);
    } else {
      commandInput.blur();
      commandInput.type = multiplayer.commandUnlocked ? "text" : "password";
      commandInput.value = "";
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

  const spawnBodyCommandNames = bodyTiers
    .filter((tier) => tier.threshold > 0)
    .map((tier) => tier.name.replace(/\s+/g, "-"));
  const spawnMobCommandNames = ["alienoid", "ufo", "rambot", "tesla", "engineer", "satellite", "rocket", "fighter"];

  function normalizeSpawnCommandToken(token) {
    return String(token || "").trim().toLowerCase().replace(/[-_\s]+/g, "");
  }

  function mobKindForCommandToken(token) {
    const normalized = normalizeSpawnCommandToken(token);
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

  function mobLabelForKind(kind) {
    if (kind === "ufo") return "UFO";
    if (kind === "rambot") return "Rambot";
    if (kind === "tesla") return "Tesla";
    if (kind === "engineer") return "Engineer";
    if (kind === "satellite") return "Satellite";
    if (kind === "rocket") return "Rocket ship";
    if (kind === "fighter") return "Fighter ship";
    return "Alienoid";
  }

  function parseSpawnTargetAndAmount(rawTarget) {
    const parts = String(rawTarget || "").trim().split(/\s+/).filter(Boolean);
    let amount = 1;
    if (parts.length > 1) {
      const maybeAmount = Math.floor(Number(parts[parts.length - 1]));
      if (Number.isFinite(maybeAmount) && maybeAmount > 0) {
        amount = clamp(maybeAmount, 1, 100);
        parts.pop();
      }
    }
    return {
      target: parts.join(" "),
      amount
    };
  }

  function completeSpawnCommand() {
    if (!commandInput) {
      return;
    }
    const command = commandInput.value;
    const match = command.match(/^\/spawn\s+(body|mob)(?:\s+(.+))?$/i);
    if (!match) {
      commandInput.value = "/spawn ";
      commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
      updateCommandHint();
      return;
    }
    const category = match[1].toLowerCase();
    const names = category === "mob" ? spawnMobCommandNames : spawnBodyCommandNames;
    const rawTarget = String(match[2] || "").trim();
    const amountMatch = rawTarget.match(/^(.*?)(?:\s+(\d+))?$/);
    const partialTarget = amountMatch ? amountMatch[1].trim() : rawTarget;
    const amountSuffix = amountMatch && amountMatch[2] ? " " + amountMatch[2] : "";
    const partial = normalizeSpawnCommandToken(partialTarget);
    const matches = names.filter((name) => !partial || normalizeSpawnCommandToken(name).startsWith(partial));
    if (!matches.length) {
      updateCommandHint();
      return;
    }
    if (!multiplayer.commandCompletions.length || multiplayer.commandCompletions.join("|") !== matches.join("|")) {
      multiplayer.commandCompletions = matches;
      multiplayer.commandCompletionIndex = 0;
    } else {
      multiplayer.commandCompletionIndex = (multiplayer.commandCompletionIndex + 1) % multiplayer.commandCompletions.length;
    }
    const selected = multiplayer.commandCompletions[multiplayer.commandCompletionIndex];
    commandInput.value = "/spawn " + category + " " + selected + amountSuffix;
    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
    updateCommandHint();
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
      commandHint.textContent = "Available: /tp <player>, /spawn mob <type> <amount>, /spawn body <type> <amount>, /tech <type> <amount>, /reset all";
      return;
    }

    if (/^\/reset(\s|$)/i.test(value)) {
      commandHint.textContent = "Available: /reset world, /reset players, /reset all";
      return;
    }

    if (/^\/spawn(\s|$)/i.test(value)) {
      commandHint.textContent = "Mobs: alienoid, ufo, rambot, tesla, engineer, satellite, rocket, fighter. Bodies: rock, boulder, asteroid, dwarf-moon, moon, planet.";
      return;
    }

    if (/^\/tech(\s|$)/i.test(value)) {
      commandHint.textContent = "Tech: all, suction, weapon, plating, energy, repair, target, propulsion, shield, communication";
      return;
    }

    if (!/^\/tp(\s|$)/i.test(value)) {
      commandHint.textContent = "Available: /tp <player>, /spawn mob <type> <amount>, /spawn body <type> <amount>, /tech <type> <amount>, /reset all";
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
      if (/^\/spawn(\s|$)/i.test(command)) {
        completeSpawnCommand();
        return;
      }
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
      maybeNotifyText("Unknown command. Try /tp <player>, /spawn mob <type> <amount>, /spawn body <type> <amount>, /tech <type> <amount>, or /reset all.");
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

  function sendPartyCommand(payload) {
    if (!payload || !isPartySessionActive()) {
      return false;
    }
    return sendMultiplayer({
      type: "party.command",
      roomId: multiplayer.v2.roomId || (multiplayer.partySession && multiplayer.partySession.id) || "",
      ...payload
    });
  }

  function spawnBodyFromCommand(tier, source) {
    if (!tier || !source) {
      return null;
    }
    const mass = Math.max(1, tier.threshold);
    const direction = {
      x: finiteOr(source.directionX, 1),
      y: finiteOr(source.directionY, 0)
    };
    const directionLength = Math.hypot(direction.x, direction.y) || 1;
    const dirX = direction.x / directionLength;
    const dirY = direction.y / directionLength;
    const radius = radiusFromMass(mass);
    const originRadius = Math.max(1, finiteOr(source.radius, player.radius));
    const distance = Math.max(180, originRadius + radius + 120);
    const sideOffset = (((nextParticleId - 1) % 7) - 3) * Math.min(radius * 0.9 + 18, 160);
    const body = createParticle(
      finiteOr(source.x, player.x) + dirX * distance - dirY * sideOffset,
      finiteOr(source.y, player.y) + dirY * distance + dirX * sideOffset,
      mass,
      randomParticleColor()
    );
    body.vx = 0;
    body.vy = 0;
    particles.push(body);
    return body;
  }

  function spawnMobFromCommand(kind, source) {
    const anchor = {
      x: finiteOr(source && source.x, player.x),
      y: finiteOr(source && source.y, player.y),
      vx: finiteOr(player.vx, 0),
      vy: finiteOr(player.vy, 0),
      radius: finiteOr(source && source.radius, player.radius)
    };
    spawnMobByKind(kind, anchor);
  }

  function localSpawnCommandSource() {
    const aimAngle = getCursorAimAngle();
    const direction = cameraLocalToWorld(Math.cos(aimAngle), Math.sin(aimAngle));
    return {
      x: player.x,
      y: player.y,
      radius: player.radius,
      directionX: direction.x,
      directionY: direction.y
    };
  }

  function executeSpawnCommand(command) {
    const match = command.match(/^\/spawn\s+(body|mob)(?:\s+(.+))?$/i);
    const category = match && match[1] ? match[1].toLowerCase() : "";
    const parsed = parseSpawnTargetAndAmount(match && match[2] ? match[2] : "");
    if (!match || !parsed.target) {
      maybeNotifyText("Use /spawn mob alienoid 3 or /spawn body asteroid 2.");
      updateCommandHint();
      return;
    }

    const source = localSpawnCommandSource();
    if (category === "mob") {
      const kind = mobKindForCommandToken(parsed.target);
      if (!kind) {
        maybeNotifyText("Unknown mob. Try alienoid, ufo, rambot, tesla, engineer, satellite, rocket, or fighter.");
        return;
      }
      if (isMultiplayerV2Active() || isSharedWorldFollower()) {
        const sent = sendPartyCommand({
          command: "spawnMob",
          mob: kind,
          amount: parsed.amount,
          source
        });
        maybeNotifyText(sent ? "Spawned " + parsed.amount + " " + mobLabelForKind(kind) + (parsed.amount === 1 ? "." : "s.") : "Multiplayer command unavailable.");
        return;
      }
      for (let i = 0; i < parsed.amount; i += 1) {
        spawnMobFromCommand(kind, source);
      }
      maybeNotifyText("Spawned " + parsed.amount + " " + mobLabelForKind(kind) + (parsed.amount === 1 ? "." : "s."));
      void savePersistentState({ includeWorld: true });
      return;
    }

    const tier = bodyTierForCommandToken(parsed.target);
    if (!tier) {
      maybeNotifyText("Unknown body type. Try rock, boulder, asteroid, dwarf-moon, moon, or planet.");
      return;
    }

    if (isMultiplayerV2Active() || isSharedWorldFollower()) {
      const sent = sendPartyCommand({
        command: "spawnBody",
        body: tier.name,
        amount: parsed.amount,
        source
      });
      maybeNotifyText(sent ? "Spawned " + parsed.amount + " " + tier.name + (parsed.amount === 1 ? "." : "s.") : "Multiplayer command unavailable.");
      return;
    }

    for (let i = 0; i < parsed.amount; i += 1) {
      spawnBodyFromCommand(tier, source);
    }
    maybeNotifyText("Spawned " + parsed.amount + " " + tier.name + (parsed.amount === 1 ? "." : "s."));
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

  function addTechFromCommand(tech, amount, all) {
    if (all) {
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

  function executeTechCommand(command) {
    const match = command.match(/^\/tech\s+([^\s]+)(?:\s+([^\s]+))?$/i);
    const techToken = match && match[1] ? match[1] : "";
    const normalizedTechToken = techToken.toLowerCase();
    const amountToken = match && match[2] ? match[2] : "";
    const tech = techTypeForCommandToken(techToken);
    const amount = Math.floor(Number(amountToken));
    const all = normalizedTechToken === "all";

    if ((!tech && !all) || !Number.isFinite(amount) || amount <= 0) {
      maybeNotifyText("Use /tech all 10, /tech weapon 10, /tech suction 25, etc.");
      updateCommandHint();
      return;
    }

    if (isMultiplayerV2Active()) {
      const sent = sendPartyCommand({
        command: "tech",
        tech: all ? "all" : tech.key,
        amount
      });
      maybeNotifyText(sent ? (all ? "Added " + amount + " of every tech type." : "Added " + amount + " " + tech.label.toLowerCase() + ".") : "Multiplayer command unavailable.");
      return;
    }

    addTechFromCommand(tech, amount, all);
  }

  function handlePartyCommand(message) {
    if (!isPartyHost() || isMultiplayerV2Active()) {
      return;
    }
    const command = String(message && message.command || "");
    if (command !== "spawnBody" && command !== "spawnMob") {
      return;
    }
    const amount = clamp(Math.max(1, Math.floor(finiteOr(message.amount, 1))), 1, 100);
    const source = message.source && typeof message.source === "object" ? message.source : {};
    if (command === "spawnMob") {
      const kind = mobKindForCommandToken(message.mob);
      if (!kind) {
        return;
      }
      for (let i = 0; i < amount; i += 1) {
        spawnMobFromCommand(kind, source);
      }
      maybeNotifyText((message.publicName || "A player") + " spawned " + amount + " " + mobLabelForKind(kind) + (amount === 1 ? "." : "s."));
      void savePersistentState({ includeWorld: true });
      return;
    }
    const tier = bodyTierForCommandToken(message.body);
    if (!tier) {
      return;
    }
    for (let i = 0; i < amount; i += 1) {
      spawnBodyFromCommand(tier, source);
    }
    maybeNotifyText((message.publicName || "A player") + " spawned " + amount + " " + tier.name + (amount === 1 ? "." : "s."));
    void savePersistentState({ includeWorld: true });
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
      multiplayer.serverUnavailable = false;
      multiplayer.reconnectDelay = 1.5;
      updateMultiplayerModeUi();
      sendMultiplayer({
        type: "hello",
        playerId: player.id,
        multiplayerOptIn: Boolean(multiplayer.friendJoinsEnabled),
        relayBypass: isCrazyGamesRuntime(),
        snapshot: buildRealtimeSnapshot()
      });
      flushMultiplayerRoomRequests("socket-open");
      flushLobbyRequests("socket-open");
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
    multiplayer.serverUnavailable = true;
    multiplayer.socket = null;
    multiplayer.reconnectTimer = multiplayer.reconnectDelay;
    multiplayer.reconnectDelay = Math.min(12, multiplayer.reconnectDelay * 1.5);
    notifyServerMaintenance();
    updateMultiplayerModeUi();
    if (multiplayer.lobby || multiplayer.lobbyCreatePending || multiplayer.lobbyJoinPending) {
      setLobbyStatus(serverMaintenanceMessage, "error");
      renderLobby();
    }
    if (multiplayer.lobby && multiplayer.lobby.code) {
      multiplayer.lobbyJoinPending = multiplayer.lobby.code;
    }
    if (multiplayer.roomId) {
      multiplayer.roomJoinable = false;
      reportCrazyGamesRoom("socket-closed");
    }
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
      flushMultiplayerRoomRequests("bootstrap");
      flushLobbyRequests("bootstrap");
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
      if (multiplayer.lobby) {
        void refreshLobbyPlayerSearch();
      }
      return;
    }

    if (message.type === "room.state") {
      applyCrazyGamesRoomState(message);
      return;
    }

    if (message.type === "room.player.joined") {
      maybeNotifyText((message.publicName || "A player") + " joined.");
      return;
    }

    if (message.type === "room.join.failed") {
      multiplayer.pendingJoinRoomId = "";
      multiplayer.joinRequestedRoomId = "";
      multiplayer.roomCreatePending = false;
      if (multiplayer.roomId === message.roomId) {
        clearCrazyGamesRoomState("join-failed");
      }
      maybeNotifyText(message.message || "Multiplayer room is unavailable.");
      return;
    }

    if (message.type === "lobby.state") {
      applyLobbyState(message);
      return;
    }

    if (message.type === "lobby.join.failed") {
      multiplayer.lobbyCreatePending = false;
      multiplayer.lobbyJoinPending = "";
      setLobbyStatus(message.message || "Lobby unavailable.", "error");
      maybeNotifyText(message.message || "Lobby unavailable.");
      setStartMenuView("multiplayer", { push: false });
      return;
    }

    if (message.type === "lobby.invite") {
      if (!multiplayer.friendJoinsEnabled) {
        maybeNotifyText("Multiplayer Off");
        return;
      }
      multiplayer.pendingSignal = {
        kind: "lobby",
        lobbyId: message.lobbyId,
        code: message.code,
        fromPlayerId: message.fromPlayerId,
        fromName: message.fromName
      };
      if (signalName) {
        signalName.textContent = (message.fromName || "Player") + " invited you";
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
      return;
    }

    if (message.type === "lobby.kicked") {
      multiplayer.lobby = null;
      multiplayer.lobbyInviteLink = "";
      setStartMenuView("multiplayer", { push: false });
      maybeNotifyText(message.message || "Removed from lobby.");
      return;
    }

    if (message.type === "party.start") {
      applyPartyStart(message);
      return;
    }

    if (message.type === "party.state") {
      applyPartyState(message);
      return;
    }

    if (message.type === "mp.v2.snapshot") {
      applyMultiplayerV2Snapshot(message);
      return;
    }

    if (message.type === "mp.v2.event") {
      return;
    }

    if (message.type === "party.host.changed") {
      applyPartyHostChanged(message);
      return;
    }

    if (message.type === "party.world.snapshot") {
      applyPartyWorldSnapshot(message);
      return;
    }

    if (message.type === "party.player.snapshot") {
      applyPartyPlayerSnapshot(message);
      return;
    }

    if (message.type === "player.respawn") {
      applyPartyPlayerSnapshot(message);
      return;
    }

    if (message.type === "party.tech.claimed") {
      applyTechPickupClaim(message);
      return;
    }

    if (message.type === "party.command") {
      handlePartyCommand(message);
      return;
    }

    if (message.type === "party.physics.start" || message.type === "party.physics.state") {
      handlePartyPhysicsSessionRequest(message);
      return;
    }

    if (message.type === "party.physics.end") {
      handlePartyPhysicsEndRequest(message);
      return;
    }

    if (message.type === "party.physics.authority") {
      applyPartyPhysicsAuthority(message);
      return;
    }

    if (message.type === "party.physics.reject") {
      applyPartyPhysicsReject(message);
      return;
    }

    if (message.type === "anomaly.ready") {
      showAnomalyPrompt(message);
      return;
    }

    if (message.type === "anomaly.start") {
      multiplayer.anomaly = {
        id: message.encounterId || "",
        teamId: message.teamId || "",
        phase: "overlap",
        endsAt: finiteOr(message.endsAt, Date.now() + 90000)
      };
      maybeNotifyText("Anomaly investigated.");
      return;
    }

    if (message.type === "anomaly.end") {
      multiplayer.anomaly = null;
      maybeNotifyText("Anomaly separated.");
      return;
    }

    if (message.type === "signal.detected") {
      if (!multiplayer.friendJoinsEnabled) {
        sendMultiplayer({
          type: "signal.choice",
          signalId: message.signalId,
          choice: "avoid"
        });
        return;
      }
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
      if (!multiplayer.friendJoinsEnabled) {
        maybeNotifyText("Multiplayer Off");
        return;
      }
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

  function showAnomalyPrompt(message) {
    multiplayer.pendingSignal = {
      kind: "anomaly",
      encounterId: message.encounterId,
      otherPartySize: Math.max(1, Math.floor(finiteOr(message.otherPartySize, 1)))
    };
    if (signalName) {
      signalName.textContent = "Equal party detected";
    }
    if (investigateSignal) {
      investigateSignal.textContent = "Investigate";
    }
    if (avoidSignal) {
      avoidSignal.textContent = "Flee";
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

    if (pending.kind === "lobby") {
      if (choice === "investigate") {
        joinLobby(pending.code || pending.lobbyId);
      }
      hideSignalPrompt();
      return;
    }

    if (pending.kind === "anomaly") {
      sendMultiplayer({
        type: "anomaly.choice",
        encounterId: pending.encounterId,
        choice
      });
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
    return playerInteractionChoiceConfigs[key] || null;
  }

  function normalizeInteractionChoice(key) {
    return interactionChoiceByKey(key) ? key : "";
  }

  function isDuelingWith(playerId) {
    return Boolean(playerId && multiplayer.duels.has(playerId));
  }

  function interactionChoicesForPlayer(playerId) {
    return [
      playerInteractionChoiceConfigs.trade,
      isDuelingWith(playerId) ? playerInteractionChoiceConfigs.truce : playerInteractionChoiceConfigs.duel
    ];
  }

  function interactionMenuChoiceByKey(menu, key) {
    return menu && Array.isArray(menu.choices)
      ? menu.choices.find((choice) => choice && choice.key === key) || null
      : null;
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
    const choices = interactionChoicesForPlayer(targetPlayerId);
    const selectedIndex = Math.max(
      0,
      choices.findIndex((choice) => choice.key === requested)
    );
    multiplayer.interactionMenu = {
      targetPlayerId,
      targetName: target.publicName || target.player.name || "Contact",
      requestedChoice: requested,
      choices,
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
    menu.choices.forEach((choice, index) => {
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

    const count = menu.choices.length;
    menu.selectedIndex = (menu.selectedIndex + delta + count) % count;
    renderPlayerInteractionMenu();
  }

  function choosePlayerInteraction(choiceKey) {
    const menu = multiplayer.interactionMenu;
    const choice = normalizeInteractionChoice(choiceKey);
    if (!menu || !choice || !interactionMenuChoiceByKey(menu, choice)) {
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

    if (message.accepted && choice === "duel") {
      if (peerId) {
        multiplayer.duels.add(peerId);
      }
      maybeNotifyText("Duel agreed with " + peerName + ". PvP is on.");
      return;
    }

    if (message.accepted && choice === "truce") {
      if (peerId) {
        multiplayer.duels.delete(peerId);
      }
      maybeNotifyText("Truce agreed with " + peerName + ". PvP is off.");
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

  function partyPlayerIds() {
    return new Set(
      multiplayer.partySession && Array.isArray(multiplayer.partySession.players)
        ? multiplayer.partySession.players.map((entry) => entry.playerId).filter(Boolean)
        : []
    );
  }

  function partyInputSeqFromSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    const gadget = source.gadget && typeof source.gadget === "object" ? source.gadget : null;
    return Math.max(0, Math.floor(finiteOr(gadget && gadget.seq, 0)));
  }

  function isFriendlyPartyPlayer(playerId) {
    if (!playerId || !isPartySessionActive()) {
      return false;
    }
    return partyPlayerIds().has(playerId);
  }

  function canDamageRemotePlayer(remote) {
    if (!remote || !remote.playerId) {
      return false;
    }
    if (multiplayer.anomaly && remote.teamId && multiplayer.anomaly.teamId) {
      return remote.teamId !== multiplayer.anomaly.teamId;
    }
    if (isFriendlyPartyPlayer(remote.playerId)) {
      return false;
    }
    return isDuelingWith(remote.playerId);
  }

  function canDamageRemotePlayerFromPve(remote) {
    return Boolean(remote && remote.playerId);
  }

  function canReceiveDamageFromPlayer(fromPlayerId, fromTeamId) {
    if (!fromPlayerId) {
      return true;
    }
    if (multiplayer.anomaly && fromTeamId && multiplayer.anomaly.teamId) {
      return fromTeamId !== multiplayer.anomaly.teamId;
    }
    if (isFriendlyPartyPlayer(fromPlayerId)) {
      return false;
    }
    return isDuelingWith(fromPlayerId);
  }

  function normalizeEntityEffectSourceKind(effect) {
    const kind = typeof (effect && effect.sourceKind) === "string" ? effect.sourceKind : "";
    if (kind === "player" || kind === "mob" || kind === "environment" || kind === "gadget") {
      return kind;
    }
    if (effect && effect.pvpOnly === true) {
      return "player";
    }
    if (effect && effect.entityType === "player" && (finiteOr(effect.damage, 0) > 0 || finiteOr(effect.toolDisable, 0) > 0)) {
      return "player";
    }
    return "gadget";
  }

  function canReceiveRemotePlayerEffect(message, effect) {
    const damage = Math.max(0, finiteOr(effect && effect.damage, 0));
    const toolDisable = Math.max(0, finiteOr(effect && effect.toolDisable, 0));
    if (damage <= 0 && toolDisable <= 0) {
      return true;
    }

    const sourceKind = normalizeEntityEffectSourceKind(effect);
    if (sourceKind !== "player" && effect.pvpOnly !== true) {
      return true;
    }
    return canReceiveDamageFromPlayer(message.fromPlayerId, message.fromTeamId);
  }

  function remoteEffectCause(effect, fallback) {
    const cause = typeof (effect && effect.cause) === "string" ? effect.cause.trim().slice(0, 60) : "";
    return cause || fallback || "Contact fire";
  }

  function normalizePartyEntityType(type) {
    const value = String(type || "");
    if (value === "body" || value === "rock" || value === "boulder") {
      return "particle";
    }
    if (value === "rival") {
      return "alienoid";
    }
    if (value === "projectile") {
      return "rivalProjectile";
    }
    if (
      value === "particle" ||
      value === "techPickup" ||
      value === "healthPickup" ||
      value === "rivalProjectile" ||
      value === "alienoid" ||
      value === "ufo" ||
      value === "rambot" ||
      value === "engineer" ||
      value === "tesla" ||
      value === "rocket" ||
      value === "fighter"
    ) {
      return value;
    }
    return "";
  }

  function partyEntityId(id) {
    return Math.max(1, Math.floor(finiteOr(id, 0)));
  }

  function partyEntityKey(type, id) {
    const cleanType = normalizePartyEntityType(type);
    const cleanId = partyEntityId(id);
    return cleanType && cleanId ? cleanType + ":" + cleanId : "";
  }

  function partyEntityCollection(type) {
    switch (normalizePartyEntityType(type)) {
      case "particle":
        return particles;
      case "techPickup":
        return techPickups;
      case "healthPickup":
        return healthPickups;
      case "rivalProjectile":
        return rivalProjectiles;
      case "alienoid":
        return rivals;
      case "ufo":
        return ufos;
      case "rambot":
        return rambots;
      case "engineer":
        return engineers;
      case "tesla":
        return teslas;
      case "rocket":
        return rockets;
      case "fighter":
        return fighters;
      default:
        return null;
    }
  }

  function findPartyEntity(type, id) {
    const collection = partyEntityCollection(type);
    const cleanId = partyEntityId(id);
    if (!collection || !cleanId) {
      return null;
    }
    return collection.find((entity) => entity && partyEntityId(entity.id) === cleanId) || null;
  }

  function removePartyEntity(type, id) {
    const collection = partyEntityCollection(type);
    const cleanId = partyEntityId(id);
    if (!collection || !cleanId) {
      return null;
    }
    const index = collection.findIndex((entity) => entity && partyEntityId(entity.id) === cleanId);
    if (index < 0) {
      return null;
    }
    const entity = collection[index];
    collection.splice(index, 1);
    return entity;
  }

  function serializePartyEntity(type, entity) {
    const cleanType = normalizePartyEntityType(type);
    if (!entity || !cleanType) {
      return null;
    }
    if (cleanType === "particle") {
      return serializeParticle(entity);
    }
    if (cleanType === "techPickup") {
      return serializeTechPickup(entity);
    }
    if (cleanType === "healthPickup") {
      return serializeHealthPickup(entity);
    }
    if (cleanType === "rivalProjectile") {
      return serializeProjectile(entity);
    }
    if (cleanType === "alienoid") {
      return serializeRival(entity);
    }
    if (cleanType === "ufo") {
      return serializeUfo(entity);
    }
    if (cleanType === "rambot") {
      return serializeRambot(entity);
    }
    if (cleanType === "engineer") {
      return serializeEngineer(entity);
    }
    if (cleanType === "tesla") {
      return serializeTesla(entity);
    }
    if (cleanType === "rocket") {
      return serializeRocket(entity);
    }
    if (cleanType === "fighter") {
      return serializeFighter(entity);
    }
    return null;
  }

  function normalizePartyEntityState(type, state) {
    const cleanType = normalizePartyEntityType(type);
    const source = state && typeof state === "object" ? state : {};
    const id = partyEntityId(source.id);
    if (!cleanType || !id) {
      return null;
    }
    return {
      ...source,
      id,
      x: clamp(finiteOr(source.x, 0), -1000000, 1000000),
      y: clamp(finiteOr(source.y, 0), -1000000, 1000000),
      vx: clamp(finiteOr(source.vx, 0), -2200, 2200),
      vy: clamp(finiteOr(source.vy, 0), -2200, 2200),
      radius: Math.max(1, finiteOr(source.radius, 1))
    };
  }

  function applyPartyEntityMotionState(entity, incoming, options) {
    if (!entity || !incoming) {
      return false;
    }
    const positionBlend = clamp(finiteOr(options && options.positionBlend, 1), 0, 1);
    const velocityBlend = clamp(finiteOr(options && options.velocityBlend, positionBlend), 0, 1);
    entity.x += (finiteOr(incoming.x, entity.x) - entity.x) * positionBlend;
    entity.y += (finiteOr(incoming.y, entity.y) - entity.y) * positionBlend;
    entity.vx += (finiteOr(incoming.vx, entity.vx) - entity.vx) * velocityBlend;
    entity.vy += (finiteOr(incoming.vy, entity.vy) - entity.vy) * velocityBlend;
    if (Number.isFinite(Number(incoming.life)) && Number.isFinite(Number(entity.life)) && options && options.copyLife) {
      entity.life = Math.max(0, finiteOr(incoming.life, entity.life));
    }
    return true;
  }

  function prunePartyPhysicsSessions(now) {
    const time = finiteOr(now, performance.now());
    for (const [key, session] of multiplayer.partyPhysicsSessions) {
      if (
        !session ||
        finiteOr(session.expiresAt, 0) <= time ||
        !findPartyEntity(session.type, session.id)
      ) {
        multiplayer.partyPhysicsSessions.delete(key);
      }
    }
    for (const [key, session] of multiplayer.localPartyPhysicsSessions) {
      if (
        !session ||
        finiteOr(session.expiresAt, 0) <= time ||
        !findPartyEntity(session.type, session.id)
      ) {
        if (session && !session.endSent) {
          sendPartyPhysicsEnd(session, "expired");
        }
        multiplayer.localPartyPhysicsSessions.delete(key);
        const shared = multiplayer.partyPhysicsSessions.get(key);
        if (shared && shared.playerId === player.id) {
          multiplayer.partyPhysicsSessions.delete(key);
        }
      }
    }
  }

  function partyPhysicsSession(type, id, now) {
    prunePartyPhysicsSessions(now);
    const key = partyEntityKey(type, id);
    return key ? multiplayer.partyPhysicsSessions.get(key) || null : null;
  }

  function localPartyPhysicsSession(type, id, now) {
    prunePartyPhysicsSessions(now);
    const key = partyEntityKey(type, id);
    return key ? multiplayer.localPartyPhysicsSessions.get(key) || null : null;
  }

  function hasLocalPartyPhysicsSession(type, id, now) {
    const session = localPartyPhysicsSession(type, id, now);
    return Boolean(session && session.playerId === player.id);
  }

  function partyPhysicsSnapshotActor() {
    return buildPersistentPayload(false).player;
  }

  function sendPartyPhysicsMessage(kind, session, entity, extra) {
    if (!session || !isPartySessionActive()) {
      return false;
    }
    const state = entity ? serializePartyEntity(session.type, entity) : null;
    const payload = {
      type: kind,
      entityType: session.type,
      entityId: session.id,
      seq: session.seq,
      state,
      actor: (extra && extra.actor) || session.actor || partyPhysicsSnapshotActor(),
      mode: (extra && extra.mode) || session.mode || "idle",
      active: extra && Object.prototype.hasOwnProperty.call(extra, "active") ? extra.active !== false : session.active !== false
    };
    if (extra && extra.reason) {
      payload.reason = extra.reason;
    }
    return sendMultiplayer(payload);
  }

  function sendPartyPhysicsEnd(session, reason) {
    if (!session || session.endSent) {
      return false;
    }
    const sent = sendPartyPhysicsMessage("party.physics.end", session, findPartyEntity(session.type, session.id), {
      reason: reason || "ended",
      active: false
    });
    session.endSent = sent || session.endSent;
    return sent;
  }

  function markLocalPartyPhysicsSession(type, entity, now, options) {
    if (!isSharedWorldFollower() || !entity) {
      return null;
    }
    if (!joinedPlayerIsolationAllows("localPhysicsLeases")) {
      return null;
    }
    const cleanType = normalizePartyEntityType(type);
    const cleanId = partyEntityId(entity.id);
    const key = partyEntityKey(cleanType, cleanId);
    if (!key) {
      return null;
    }

    const time = finiteOr(now, performance.now());
    prunePartyPhysicsSessions(time);
    let session = multiplayer.localPartyPhysicsSessions.get(key);
    if (!session) {
      session = {
        type: cleanType,
        id: cleanId,
        key,
        playerId: player.id,
        seq: ++multiplayer.partyPhysicsSeq,
        expiresAt: time + partyPhysicsSessionLocalHoldMs,
        lastSentAt: 0,
        startSent: false,
        accepted: false,
        endSent: false,
        mode: options && options.mode ? options.mode : "idle",
        active: !(options && options.active === false),
        actor: options && options.actor ? options.actor : null
      };
      multiplayer.localPartyPhysicsSessions.set(key, session);
    }

    session.expiresAt = Math.max(finiteOr(session.expiresAt, 0), time + partyPhysicsSessionLocalHoldMs);
    session.mode = options && options.mode ? options.mode : session.mode;
    session.active = !(options && options.active === false);
    session.actor = options && options.actor ? options.actor : session.actor;
    session.endSent = false;
    multiplayer.partyPhysicsSessions.set(key, {
      ...session,
      local: true
    });

    const force = options && options.force;
    const elapsed = time - finiteOr(session.lastSentAt, 0);
    const messageType = session.startSent ? "party.physics.state" : "party.physics.start";
    if (force || !session.lastSentAt || elapsed >= partyPhysicsSessionUpdateIntervalMs) {
      const sent = sendPartyPhysicsMessage(messageType, session, entity, {
        actor: session.actor,
        mode: session.mode,
        active: session.active
      });
      if (sent) {
        session.lastSentAt = time;
        session.startSent = true;
      }
    }
    return session;
  }

  function releaseLocalPartyPhysicsSession(type, id, reason) {
    const key = partyEntityKey(type, id);
    if (!key) {
      return false;
    }
    const session = multiplayer.localPartyPhysicsSessions.get(key);
    if (!session) {
      return false;
    }
    sendPartyPhysicsEnd(session, reason || "ended");
    multiplayer.localPartyPhysicsSessions.delete(key);
    const shared = multiplayer.partyPhysicsSessions.get(key);
    if (shared && shared.playerId === player.id) {
      multiplayer.partyPhysicsSessions.delete(key);
    }
    return true;
  }

  function clearLocalPartyPhysicsSession(type, id) {
    const key = partyEntityKey(type, id);
    if (!key) {
      return false;
    }
    multiplayer.localPartyPhysicsSessions.delete(key);
    const shared = multiplayer.partyPhysicsSessions.get(key);
    if (shared && shared.playerId === player.id) {
      multiplayer.partyPhysicsSessions.delete(key);
    }
    return true;
  }

  function releaseMissingLocalPartyPhysicsSessions(activeKeys, reason) {
    const keep = activeKeys || new Set();
    for (const [key, session] of Array.from(multiplayer.localPartyPhysicsSessions.entries())) {
      if (!keep.has(key)) {
        releaseLocalPartyPhysicsSession(session.type, session.id, reason || "inactive");
      }
    }
  }

  function buildLocalPartyGadgetSnapshot(playerSnapshot, seq) {
    if (!joinedPlayerIsolationAllows("partyInputGadgetState")) {
      return {
        seq,
        sentAt: performance.now(),
        active: false,
        mode: "idle",
        aimAngle: finiteOr(playerSnapshot && playerSnapshot.aimAngle, 0),
        x: finiteOr(playerSnapshot && playerSnapshot.x, player.x),
        y: finiteOr(playerSnapshot && playerSnapshot.y, player.y),
        vx: finiteOr(playerSnapshot && playerSnapshot.vx, player.vx),
        vy: finiteOr(playerSnapshot && playerSnapshot.vy, player.vy),
        landedBodyId: 0,
        landedThrustDirection: 0,
        suckFactor: 1,
        blowFactor: 1
      };
    }
    const state = localPartyGadgetState(playerSnapshot);
    const mode = state ? state.mode : "idle";
    const active = Boolean(state && state.active);
    const now = performance.now();
    const landedThrustDirection = state && state.landedBodyId && (state.left || state.right) ? (state.left ? 1 : -1) : 0;

    return {
      seq,
      sentAt: now,
      active,
      mode,
      aimAngle: finiteOr(playerSnapshot && playerSnapshot.aimAngle, 0),
      x: finiteOr(playerSnapshot && playerSnapshot.x, player.x),
      y: finiteOr(playerSnapshot && playerSnapshot.y, player.y),
      vx: finiteOr(playerSnapshot && playerSnapshot.vx, player.vx),
      vy: finiteOr(playerSnapshot && playerSnapshot.vy, player.vy),
      landedBodyId: state && state.landedBodyId ? state.landedBodyId : 0,
      landedThrustDirection,
      suckFactor: state ? state.suckFactor : 1,
      blowFactor: state ? state.blowFactor : 1
    };
  }

  function buildPartyInputSnapshot(seq) {
    const snapshot = buildPersistentPayload(false);
    return {
      player: snapshot.player,
      gadget: buildLocalPartyGadgetSnapshot(snapshot.player, seq)
    };
  }

  function partyInputMotionSharp(snapshot) {
    const previous = multiplayer.partyLastInputSnapshot;
    if (!snapshot || !previous || !snapshot.player || !previous.player) {
      return false;
    }

    const currentPlayer = snapshot.player;
    const previousPlayer = previous.player;
    const distance = Math.hypot(
      finiteOr(currentPlayer.x, 0) - finiteOr(previousPlayer.x, 0),
      finiteOr(currentPlayer.y, 0) - finiteOr(previousPlayer.y, 0)
    );
    const velocityDelta = Math.hypot(
      finiteOr(currentPlayer.vx, 0) - finiteOr(previousPlayer.vx, 0),
      finiteOr(currentPlayer.vy, 0) - finiteOr(previousPlayer.vy, 0)
    );
    const aimDelta = Math.abs(shortestAngleDelta(
      finiteOr(previous.gadget && previous.gadget.aimAngle, finiteOr(previousPlayer.aimAngle, 0)),
      finiteOr(snapshot.gadget && snapshot.gadget.aimAngle, finiteOr(currentPlayer.aimAngle, 0))
    ));
    const modeChanged = (previous.gadget && previous.gadget.mode) !== (snapshot.gadget && snapshot.gadget.mode);

    return modeChanged || aimDelta > 0.16 || distance > 70 || velocityDelta > 180;
  }

  function partyInputIntervalFor(snapshot) {
    const gadget = snapshot && snapshot.gadget;
    if ((gadget && (gadget.active || gadget.landedThrustDirection)) || partyInputMotionSharp(snapshot)) {
      return partyActiveInputInterval;
    }
    return partyInputInterval;
  }

  function hasRecentPartyGadgetActivity() {
    if (!isPartySessionActive()) {
      return false;
    }

    const local = buildLocalPartyGadgetSnapshot(buildPersistentPayload(false).player, multiplayer.partyInputSeq + 1);
    if (local.active || local.landedThrustDirection) {
      return true;
    }

    if (!isPartyHost()) {
      return false;
    }

    const now = performance.now();
    for (const entry of multiplayer.partyPlayerSnapshots.values()) {
      const snapshot = entry && entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : null;
      const gadget = snapshot && snapshot.gadget && typeof snapshot.gadget === "object" ? snapshot.gadget : null;
      const remotePlayer = snapshot && snapshot.player && typeof snapshot.player === "object" ? snapshot.player : null;
      if (
        gadget &&
        (
          gadget.active ||
          gadget.landedThrustDirection
        ) &&
        now - finiteOr(entry.receivedAt, 0) <= partyGadgetIntentFreshMs
      ) {
        return true;
      }
      if (
        remotePlayer &&
        isPartyGadgetActiveMode(remotePlayer.toolMode) &&
        now - finiteOr(entry.receivedAt, 0) <= partyGadgetIntentFreshMs
      ) {
        return true;
      }
    }
    return false;
  }

  function buildRealtimeSnapshot() {
    return buildPersistentPayload(true);
  }

  function updateMultiplayer(dt) {
    if (!multiplayer.enabled) {
      return;
    }

    multiplayer.partyRespawnInvulnerableTimer = Math.max(0, multiplayer.partyRespawnInvulnerableTimer - dt);
    if (isPartySessionActive()) {
      prunePartyPhysicsSessions(performance.now());
    }

    if (!multiplayer.socket && multiplayer.reconnectTimer <= 0) {
      connectMultiplayer();
    }

    if (!multiplayer.socket && multiplayer.reconnectTimer > 0) {
      multiplayer.reconnectTimer -= dt;
    }

    multiplayer.partyInputTimer -= dt;
    if (multiplayer.connected && isPartySessionActive() && !isMultiplayerV2Active() && joinedPlayerIsolationAllows("partyInput") && multiplayer.partyInputTimer <= 0) {
      const snapshot = buildPartyInputSnapshot(multiplayer.partyInputSeq + 1);
      const inputInterval = partyInputIntervalFor(snapshot);
      multiplayer.partyInputTimer = inputInterval;
      multiplayer.partyInputSeq += 1;
      multiplayer.partyLastInputSnapshot = snapshot;
      sendMultiplayer({
        type: "party.input",
        snapshot
      });
    }

    multiplayer.snapshotTimer -= dt;
    const snapshotInterval = isPartyHost() && hasRecentPartyGadgetActivity()
      ? partyActiveWorldSnapshotInterval
      : isPartyHost()
      ? partyWorldSnapshotInterval
      : multiplayerSnapshotInterval;
    if (multiplayer.snapshotTimer > snapshotInterval) {
      multiplayer.snapshotTimer = snapshotInterval;
    }
    if (multiplayer.connected && multiplayer.snapshotTimer <= 0) {
      multiplayer.snapshotTimer = snapshotInterval;
      const snapshot = isMultiplayerV2Active() || isSharedWorldFollower() ? buildPersistentPayload(false) : buildRealtimeSnapshot();
      sendMultiplayer({
        type: "input",
        multiplayerOptIn: Boolean(multiplayer.friendJoinsEnabled),
        snapshot
      });
      if (isPartySessionActive()) {
        if (isPartyHost() && !isMultiplayerV2Active()) {
          sendMultiplayer({
            type: "party.world.snapshot",
            snapshot
          });
        }
      }
    }

    updateRemoteVisualTransforms(dt);
    updateRemoteInteractions(dt);
    updateInteractionState(dt);
    pruneRemoteUniverses();
  }

  function createRemoteTransform(offsetX, offsetY, alpha, phase, mode) {
    return {
      offsetX: finiteOr(offsetX, 0),
      offsetY: finiteOr(offsetY, 0),
      alpha: clamp(finiteOr(alpha, 0), 0, 1),
      phase: phase || "approach",
      mode: mode || "random"
    };
  }

  function displayTransformFor(remote) {
    return remote.displayTransform || remote.transform || createRemoteTransform(0, 0, 0, "approach");
  }

  function isPermanentRemoteOverlap(remote) {
    const transform = displayTransformFor(remote);
    return transform.mode === "world-overlap" || transform.mode === "friend" || transform.mode === "party";
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
            remote.transform.phase,
            remote.transform.mode
          );
        } else {
          remote.displayTransform.offsetX += (remote.transform.offsetX - remote.displayTransform.offsetX) * positionBlend;
          remote.displayTransform.offsetY += (remote.transform.offsetY - remote.displayTransform.offsetY) * positionBlend;
          remote.displayTransform.alpha += (remote.transform.alpha - remote.displayTransform.alpha) * alphaBlend;
          remote.displayTransform.phase = remote.transform.phase;
          remote.displayTransform.mode = remote.transform.mode;
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
      remote.partySessionId = transform.partySessionId || remote.partySessionId || "";
      remote.teamId = transform.teamId || remote.teamId || "";
      remote.transform = createRemoteTransform(
        finiteOr(transform.offsetX, remote.transform.offsetX || 0),
        finiteOr(transform.offsetY, remote.transform.offsetY || 0),
        finiteOr(transform.alpha, remote.transform.alpha || 0),
        transform.phase || message.phase || remote.transform.phase || "approach",
        message.mode || transform.mode || remote.transform.mode || "random"
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
      transform.phase || remote.transform.phase,
      transform.mode || remote.transform.mode || "random"
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
        partySessionId: "",
        teamId: "",
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
        rivalProjectiles: Array.isArray(world.rivalProjectiles) ? world.rivalProjectiles.map(normalizeProjectileSnapshot).filter(Boolean) : [],
        techPickups: Array.isArray(world.techPickups) ? world.techPickups.map(normalizeTechPickupSnapshot).filter(Boolean) : [],
        healthPickups: Array.isArray(world.healthPickups) ? world.healthPickups.map(normalizeHealthPickupSnapshot).filter(Boolean) : []
      }
    };
  }

  function normalizeRemotePlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const maxHealth = clamp(finiteOr(snapshot.maxHealth, 100), 1, 100);
    const maxEnergy = clamp(finiteOr(snapshot.maxEnergy, playerBaseMaxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    const energy = clamp(finiteOr(snapshot.energy, maxEnergy), 0, maxEnergy);
    const equippedTool = toolCatalog.some((tool) => tool.id === snapshot.equippedTool) ? snapshot.equippedTool : null;
    const toolMode = ["pull", "push", "hold", "fire", "idle"].includes(snapshot.toolMode) ? snapshot.toolMode : "idle";
    const activeToolMode = equippedTool && actorCanAffordMultiplayerToolMode({ energy }, equippedTool, toolMode) ? toolMode : "idle";
    const camera = finiteOr(snapshot.cameraRoll, 0);
    const hasAimAngle = Number.isFinite(Number(snapshot.aimAngle));
    const hasAimLocalAngle = Number.isFinite(Number(snapshot.aimLocalAngle));
    const aimAngle = hasAimAngle ? finiteOr(snapshot.aimAngle, 0) : finiteOr(snapshot.aimLocalAngle, 0) - camera;
    const aimLocalAngle = hasAimLocalAngle ? finiteOr(snapshot.aimLocalAngle, 0) : null;
    const visualAimLocalAngle = hasAimLocalAngle ? aimLocalAngle : aimAngle + camera;
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
      energy,
      maxEnergy,
      landed: normalizeLandingSnapshot(snapshot.landed),
      walkCycle: finiteOr(snapshot.walkCycle, snapshot.landed && snapshot.landed.walkCycle),
      cameraRoll: camera,
      hasCommunicationRelay: Boolean(snapshot.hasCommunicationRelay),
      aimAngle,
      aimLocalAngle,
      visualAimLocalAngle,
      equippedTool,
      toolMode: activeToolMode,
      toolActive: Boolean(equippedTool && activeToolMode !== "idle" && (snapshot.toolActive || activeToolMode !== "idle")),
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

    const renderDelay = isMultiplayerV2Active() ? multiplayerV2RemoteSnapshotRenderDelay : remoteSnapshotRenderDelay;
    const extrapolateLimit = isMultiplayerV2Active() ? multiplayerV2RemoteSnapshotExtrapolateLimit : remoteSnapshotExtrapolateLimit;
    const renderAt = now - renderDelay;
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
      const lead = clamp(renderAt - previousFrame.receivedAt, 0, extrapolateLimit);
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
        { angleKeys: ["cameraRoll", "aimAngle", "aimLocalAngle", "visualAimLocalAngle"], scalarKeys: ["radius", "health", "maxHealth", "energy", "maxEnergy", "walkCycle"] }
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
          scalarKeys: ["x2", "y2", "deploy", "thrustAmount", "thrustDirection", "health", "maxHealth", "disabledTimer", "flash", "restLength", "restCenterDx", "restCenterDy", "linkedSurfaceOffset", "burstTimer", "burstCooldown", "missileCharge", "lockTimer", "beepTimer", "targetX", "targetY", "targetCount"]
        }),
        rivalProjectiles: interpolateRemoteEntityList(fromWorld.rivalProjectiles, toWorld.rivalProjectiles, progress, lead, {
          scalarKeys: ["radius", "length", "life", "maxLife"]
        }),
        techPickups: interpolateRemoteEntityList(fromWorld.techPickups, toWorld.techPickups, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "life", "maxLife"]
        }),
        healthPickups: interpolateRemoteEntityList(fromWorld.healthPickups, toWorld.healthPickups, progress, lead, {
          scalarKeys: ["radius", "heal", "life", "maxLife"]
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
      bridgeId: toLanding.bridgeId || 0,
      bridgeT: finiteOr(fromLanding.bridgeT, 0) + (finiteOr(toLanding.bridgeT, 0) - finiteOr(fromLanding.bridgeT, 0)) * progress,
      bridgeSide: finiteOr(toLanding.bridgeSide, 1) < 0 ? -1 : 1,
      bridgeInputSign: finiteOr(toLanding.bridgeInputSign, 1) < 0 ? -1 : 1,
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
    if (overlapId && multiplayer.roomId === overlapId) {
      clearCrazyGamesRoomState("overlap-ended");
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

  let remoteContactCache = null;

  function remoteContactCacheForFrame() {
    const now = performance.now();
    if (
      remoteContactCache &&
      remoteContactCache.time === now &&
      remoteContactCache.remoteCount === multiplayer.remoteUniverses.size
    ) {
      return remoteContactCache;
    }

    const sharedBodies = [];
    const combatPlayers = [];
    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!isRemoteUniverseInteractive(remote)) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const transform = displayTransformFor(remote);
      if (!snapshot || !transform) {
        continue;
      }

      const world = snapshot.world || {};
      if (Array.isArray(world.particles)) {
        for (const particle of world.particles) {
          if (!isMappedBody(particle)) {
            continue;
          }

          const body = transformedRemoteEntity(particle, transform);
          if (Math.hypot(body.x - player.x, body.y - player.y) > multiplayer.bubbleRadius + 1800) {
            continue;
          }

          sharedBodies.push({
            remote,
            source: particle,
            body
          });
        }
      }

      if (snapshot.player && snapshot.player.health > 0) {
        combatPlayers.push({
          local: false,
          remote,
          player: transformedRemoteEntity(snapshot.player, transform),
          publicName: remote.publicName || snapshot.player.name || "Contact"
        });
      }
    }

    remoteContactCache = {
      time: now,
      remoteCount: multiplayer.remoteUniverses.size,
      sharedBodies,
      combatPlayers
    };
    return remoteContactCache;
  }

  function collectRemoteSharedBodies() {
    return remoteContactCacheForFrame().sharedBodies;
  }

  function collectRemoteCombatPlayers() {
    return remoteContactCacheForFrame().combatPlayers;
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

  function sendPartyHostEntityEffect(effect) {
    if (!isSharedWorldFollower() || !multiplayer.partyHostId || !effect) {
      return;
    }
    if (!joinedPlayerIsolationAllows("relayHostEntityEffects")) {
      return;
    }

    sendMultiplayer({
      type: "entity.effect",
      targetUniverseId: multiplayer.partyHostUniverseId || "solo:" + multiplayer.partyHostId,
      targetPlayerId: multiplayer.partyHostId,
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
    const localGadgetState = suctionActive ? localGadgetStateForFrame(aim, funnel) : null;

    for (const remote of multiplayer.remoteUniverses.values()) {
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || !remote.transform || remote.transform.alpha < 0.72 || remote.transform.phase !== "overlap") {
        continue;
      }

      if (suctionActive && applyRemoteGadgetEffect(remote, localGadgetState, dt)) {
        multiplayer.effectTimer = remoteEffectInterval;
        return;
      }

      if (applyRemoteLaserEffect(remote)) {
        multiplayer.effectTimer = remoteEffectInterval;
        return;
      }
    }
  }

  function applyRemoteGadgetEffect(remote, localGadgetState, dt) {
    const snapshot = displaySnapshotFor(remote);
    const particlesSnapshot = snapshot && snapshot.world ? snapshot.world.particles || [] : [];
    const transform = displayTransformFor(remote);
    for (const particle of particlesSnapshot) {
      if (!isMappedBody(particle)) {
        continue;
      }

      const localBody = transformedRemoteEntity(particle, transform);
      if (!gadgetStateMayReachTarget(localGadgetState, localBody, 0)) {
        continue;
      }
      const beforeVx = localBody.vx;
      const beforeVy = localBody.vy;
      applyActorGadgetForces(localBody, localGadgetState, dt);

      const impulseX = localBody.vx - beforeVx;
      const impulseY = localBody.vy - beforeVy;
      if (Math.hypot(impulseX, impulseY) < 18) {
        continue;
      }

      sendRemoteEntityEffect(remote, {
        entityType: "particle",
        entityId: particle.id,
        sourceKind: "gadget",
        impulseX,
        impulseY
      });
      return true;
    }

    for (const mob of remoteCombatMobSnapshots(snapshot)) {
      if (!mob || mob.health <= 0) {
        continue;
      }

      const localMob = transformedRemoteEntity(mob, transform);
      if (!gadgetStateMayReachTarget(localGadgetState, localMob, 0)) {
        continue;
      }
      const beforeVx = localMob.vx;
      const beforeVy = localMob.vy;
      applyActorGadgetForces(localMob, localGadgetState, dt);

      const impulseX = localMob.vx - beforeVx;
      const impulseY = localMob.vy - beforeVy;
      if (Math.hypot(impulseX, impulseY) < 18) {
        continue;
      }

      sendRemoteEntityEffect(remote, {
        entityType: mob.kind,
        entityId: mob.id,
        sourceKind: "gadget",
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
          sourceKind: "player",
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
      const playerDist = distanceToPlayerHurtboxSegment(remotePlayer, tailX, tailY, laser.x, laser.y);

      if (canDamageRemotePlayer(remote) && playerDist < (remotePlayer.radius || 34) * playerProjectileHurtboxScale + laser.radius) {
        sendRemoteEntityEffect(remote, {
          entityType: "player",
          sourceKind: "player",
          pvpOnly: true,
          cause: "Contact fire",
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
      if (!canReceiveRemotePlayerEffect(message, effect)) {
        return;
      }
      if (multiplayer.partyRespawnInvulnerableTimer > 0 && damage > 0) {
        return;
      }
      if (player.landed && (Math.abs(impulseX) + Math.abs(impulseY) > 80 || damage > 0)) {
        detachFromBody(150);
      }
      player.vx += impulseX;
      player.vy += impulseY;
      if (damage > 0 && player.hitCooldown <= 0) {
        damageLocalPlayer(damage, {
          cause: remoteEffectCause(effect, normalizeEntityEffectSourceKind(effect) === "mob" ? "Hostile contact" : "Contact fire"),
          cooldown: 0.7,
          flash: 0.3
        });
        maybeNotifyText("Hull hit by " + remoteEffectCause(effect, message.fromPlayerId || "a contact") + ".");
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
    const toolMode = multiplayerLocalToolModeForInput();
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
        techPickups: techPickups.map(serializeTechPickup),
        healthPickups: healthPickups.map(serializeHealthPickup),
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
        nextRivalProjectileId,
        nextTechPickupId,
        nextHealthPickupId,
        difficulty: runState.difficultyId,
        mobSpawnTimers: { ...mobSpawnTimers },
        mobSpawnRestTimer,
        mobSpawnRestCooldownTimer,
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

  function shouldSmoothWorldEntities(options) {
    return Boolean(options && (options.smoothEntities || options.smoothParticles));
  }

  function applyWorldSnapshot(snapshot, options) {
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
      if (options && options.smoothParticles) {
        applySmoothedParticleSnapshots(snapshot.particles);
      } else {
        particles.length = 0;
        particles.push(...snapshot.particles.map(normalizeParticleSnapshot).filter(Boolean));
      }
    }

    const alienoidSnapshots = Array.isArray(snapshot.alienoids) ? snapshot.alienoids : snapshot.rivals;
    if (Array.isArray(alienoidSnapshots)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rivals, alienoidSnapshots, normalizeRivalSnapshot, { entityType: "alienoid" });
      } else {
        rivals.length = 0;
        rivals.push(...alienoidSnapshots.map(normalizeRivalSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.ufos)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(ufos, snapshot.ufos, normalizeUfoSnapshot, { entityType: "ufo" });
      } else {
        ufos.length = 0;
        ufos.push(...snapshot.ufos.map(normalizeUfoSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.rambots)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rambots, snapshot.rambots, normalizeRambotSnapshot, { entityType: "rambot" });
      } else {
        rambots.length = 0;
        rambots.push(...snapshot.rambots.map(normalizeRambotSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.engineers)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(engineers, snapshot.engineers, normalizeEngineerSnapshot, { entityType: "engineer" });
      } else {
        engineers.length = 0;
        engineers.push(...snapshot.engineers.map(normalizeEngineerSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.teslas)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(teslas, snapshot.teslas, normalizeTeslaSnapshot, { entityType: "tesla" });
      } else {
        teslas.length = 0;
        teslas.push(...snapshot.teslas.map(normalizeTeslaSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.rockets)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rockets, snapshot.rockets, normalizeRocketSnapshot, { entityType: "rocket" });
      } else {
        rockets.length = 0;
        rockets.push(...snapshot.rockets.map(normalizeRocketSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.fighters)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(fighters, snapshot.fighters, normalizeFighterSnapshot, { entityType: "fighter" });
      } else {
        fighters.length = 0;
        fighters.push(...snapshot.fighters.map(normalizeFighterSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.structures)) {
      structures.length = 0;
      structures.push(...snapshot.structures.map(normalizeStructureSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.rivalProjectiles)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rivalProjectiles, snapshot.rivalProjectiles, normalizeProjectileSnapshot, { snapDistance: 520, entityType: "rivalProjectile" });
      } else {
        rivalProjectiles.length = 0;
        rivalProjectiles.push(...snapshot.rivalProjectiles.map(normalizeProjectileSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.techPickups)) {
      const pickupSnapshots = snapshot.techPickups.filter((pickup) => !multiplayer.claimedTechPickupIds.has(String(pickup && pickup.id)));
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(techPickups, pickupSnapshots, normalizeTechPickupSnapshot, { snapDistance: 520, entityType: "techPickup" });
      } else {
        techPickups.length = 0;
        techPickups.push(...pickupSnapshots.map(normalizeTechPickupSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.healthPickups)) {
      const pickupSnapshots = snapshot.healthPickups.filter((pickup) => !multiplayer.claimedHealthPickupIds.has(String(pickup && pickup.id)));
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(healthPickups, pickupSnapshots, normalizeHealthPickupSnapshot, { snapDistance: 520, entityType: "healthPickup" });
      } else {
        healthPickups.length = 0;
        healthPickups.push(...pickupSnapshots.map(normalizeHealthPickupSnapshot).filter(Boolean));
      }
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
    nextRivalProjectileId = Math.max(
      Number(snapshot.nextRivalProjectileId) || 1,
      rivalProjectiles.reduce((largest, projectile) => Math.max(largest, finiteOr(projectile.id, 0) + 1), 1)
    );
    nextTechPickupId = Math.max(
      Number(snapshot.nextTechPickupId) || 1,
      techPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );
    nextHealthPickupId = Math.max(
      Number(snapshot.nextHealthPickupId) || 1,
      healthPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );

    applyMobSpawnTimers(snapshot.mobSpawnTimers);
    applyMobSpawnRestState(snapshot);
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
      pulse: particle.pulse,
      spawnSizeScale: particle.spawnSizeScale,
      ufoSapTimer: particle.ufoSapTimer,
      ufoSapSourceGraceTimer: particle.ufoSapSourceGraceTimer,
      ufoExtractedById: particle.ufoExtractedById,
      ufoExtractedFromId: particle.ufoExtractedFromId,
      ufoSapParticleBuffer: particle.ufoSapParticleBuffer
    };
  }

  function applySmoothedParticleSnapshots(snapshotParticles) {
    const normalized = snapshotParticles.map(normalizeParticleSnapshot).filter(Boolean);
    const existingById = new Map();
    for (const particle of particles) {
      existingById.set(particle.id, particle);
    }

    const now = performance.now();
    const nextParticles = [];
    const seenIds = new Set();
    for (const incoming of normalized) {
      const existing = existingById.get(incoming.id);
      if (!existing) {
        markParticleSmoothingTarget(incoming, incoming, now);
        nextParticles.push(incoming);
        seenIds.add(incoming.id);
        continue;
      }

      seenIds.add(incoming.id);
      if (hasLocalPartyPhysicsSession("particle", existing.id, now)) {
        const displayX = existing.x;
        const displayY = existing.y;
        const displayVx = existing.vx;
        const displayVy = existing.vy;
        Object.assign(existing, incoming);
        existing.x = displayX;
        existing.y = displayY;
        existing.vx = displayVx;
        existing.vy = displayVy;
        markParticleSmoothingTarget(existing, incoming, now);
        nextParticles.push(existing);
        continue;
      }

      const distance = Math.hypot(incoming.x - existing.x, incoming.y - existing.y);
      const predictedLocally = now < finiteOr(existing._partyPredictedUntil, 0);
      const snapDistance = predictedLocally ? Math.max(1800, incoming.radius * 8) : Math.max(900, incoming.radius * 5);
      const shouldSnap = distance > snapDistance;
      const displayX = shouldSnap ? incoming.x : existing.x;
      const displayY = shouldSnap ? incoming.y : existing.y;
      const displayVx = shouldSnap ? incoming.vx : existing.vx;
      const displayVy = shouldSnap ? incoming.vy : existing.vy;

      Object.assign(existing, incoming);
      existing.x = displayX;
      existing.y = displayY;
      existing.vx = displayVx;
      existing.vy = displayVy;
      if (shouldSnap) {
        existing._partyPredictedUntil = 0;
      }
      markParticleSmoothingTarget(existing, incoming, now);
      nextParticles.push(existing);
    }

    for (const particle of particles) {
      if (!seenIds.has(particle.id) && hasLocalPartyPhysicsSession("particle", particle.id, now)) {
        clearLocalPartyPhysicsSession("particle", particle.id);
      }
    }

    particles.length = 0;
    particles.push(...nextParticles);
  }

  function applySmoothedEntitySnapshots(collection, snapshots, normalizeSnapshot, options) {
    if (!Array.isArray(collection) || !Array.isArray(snapshots) || typeof normalizeSnapshot !== "function") {
      return;
    }

    const normalized = snapshots.map(normalizeSnapshot).filter(Boolean);
    const existingById = new Map();
    for (const entity of collection) {
      if (entity && entity.id !== undefined && entity.id !== null) {
        existingById.set(String(entity.id), entity);
      }
    }

    const now = performance.now();
    const snapDistance = options && Number.isFinite(Number(options.snapDistance)) ? Number(options.snapDistance) : 900;
    const entityType = options && options.entityType ? normalizePartyEntityType(options.entityType) : "";
    const nextEntities = [];
    const seenIds = new Set();
    for (const incoming of normalized) {
      const existing = existingById.get(String(incoming.id));
      if (!existing) {
        markEntitySmoothingTarget(incoming, incoming, now);
        nextEntities.push(incoming);
        seenIds.add(String(incoming.id));
        continue;
      }

      seenIds.add(String(incoming.id));
      if (entityType && hasLocalPartyPhysicsSession(entityType, incoming.id, now)) {
        const displayX = existing.x;
        const displayY = existing.y;
        const displayVx = existing.vx;
        const displayVy = existing.vy;
        Object.assign(existing, incoming);
        existing.x = displayX;
        existing.y = displayY;
        existing.vx = displayVx;
        existing.vy = displayVy;
        markEntitySmoothingTarget(existing, incoming, now);
        nextEntities.push(existing);
        continue;
      }

      const distance = Math.hypot(incoming.x - existing.x, incoming.y - existing.y);
      const shouldSnap = distance > Math.max(snapDistance, finiteOr(incoming.radius, 1) * 5);
      const displayX = shouldSnap ? incoming.x : existing.x;
      const displayY = shouldSnap ? incoming.y : existing.y;
      const displayVx = shouldSnap ? incoming.vx : existing.vx;
      const displayVy = shouldSnap ? incoming.vy : existing.vy;

      Object.assign(existing, incoming);
      existing.x = displayX;
      existing.y = displayY;
      existing.vx = displayVx;
      existing.vy = displayVy;
      markEntitySmoothingTarget(existing, incoming, now);
      nextEntities.push(existing);
    }

    if (entityType) {
      for (const entity of collection) {
        if (
          entity &&
          entity.id !== undefined &&
          entity.id !== null &&
          !seenIds.has(String(entity.id)) &&
          hasLocalPartyPhysicsSession(entityType, entity.id, now)
        ) {
          clearLocalPartyPhysicsSession(entityType, entity.id);
        }
      }
    }

    collection.length = 0;
    collection.push(...nextEntities);
  }

  function markParticleSmoothingTarget(particle, target, receivedAt) {
    particle._partyTargetX = finiteOr(target.x, particle.x);
    particle._partyTargetY = finiteOr(target.y, particle.y);
    particle._partyTargetVx = finiteOr(target.vx, particle.vx);
    particle._partyTargetVy = finiteOr(target.vy, particle.vy);
    particle._partyTargetReceivedAt = receivedAt;
  }

  function markEntitySmoothingTarget(entity, target, receivedAt) {
    entity._partyTargetX = finiteOr(target.x, entity.x);
    entity._partyTargetY = finiteOr(target.y, entity.y);
    entity._partyTargetVx = finiteOr(target.vx, entity.vx);
    entity._partyTargetVy = finiteOr(target.vy, entity.vy);
    entity._partyTargetReceivedAt = receivedAt;
  }

  function markFollowerPredictedParticle(particle, now) {
    if (!particle) {
      return;
    }
    const until = finiteOr(now, performance.now()) + partyFollowerPredictionHoldMs;
    particle._partyPredictedUntil = Math.max(finiteOr(particle._partyPredictedUntil, 0), until);
  }

  function updateFollowerWorldSmoothing(dt) {
    if (!isSharedWorldFollower()) {
      return;
    }

    const positionBlend = 1 - Math.pow(0.00035, dt);
    const velocityBlend = 1 - Math.pow(0.0015, dt);
    const now = performance.now();

    for (const particle of particles) {
      if (hasLocalPartyPhysicsSession("particle", particle.id, now)) {
        continue;
      }
      if (!Number.isFinite(particle._partyTargetX) || !Number.isFinite(particle._partyTargetY)) {
        continue;
      }

      const age = Math.max(0, Math.min(0.18, (now - finiteOr(particle._partyTargetReceivedAt, now)) / 1000));
      const targetVx = finiteOr(particle._partyTargetVx, particle.vx);
      const targetVy = finiteOr(particle._partyTargetVy, particle.vy);
      const targetX = finiteOr(particle._partyTargetX, particle.x) + targetVx * age;
      const targetY = finiteOr(particle._partyTargetY, particle.y) + targetVy * age;
      const error = Math.hypot(targetX - particle.x, targetY - particle.y);

      if (error > Math.max(900, particle.radius * 5)) {
        particle.x = targetX;
        particle.y = targetY;
        particle.vx = targetVx;
        particle.vy = targetVy;
        particle._partyPredictedUntil = 0;
        continue;
      }

      const predictedLocally = now < finiteOr(particle._partyPredictedUntil, 0);
      const correctionScale = predictedLocally ? 0.42 : 1;
      particle.vx += (targetVx - particle.vx) * velocityBlend * correctionScale;
      particle.vy += (targetVy - particle.vy) * velocityBlend * correctionScale;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.x += (targetX - particle.x) * positionBlend * correctionScale;
      particle.y += (targetY - particle.y) * positionBlend * correctionScale;
    }

    updateSmoothedEntityCollection(rivals, dt, { positionBlend, velocityBlend, entityType: "alienoid" });
    updateSmoothedEntityCollection(ufos, dt, { positionBlend, velocityBlend, entityType: "ufo" });
    updateSmoothedEntityCollection(rambots, dt, { positionBlend, velocityBlend, entityType: "rambot" });
    updateSmoothedEntityCollection(engineers, dt, { positionBlend, velocityBlend, entityType: "engineer" });
    updateSmoothedEntityCollection(teslas, dt, { positionBlend, velocityBlend, entityType: "tesla" });
    updateSmoothedEntityCollection(rockets, dt, { positionBlend, velocityBlend, entityType: "rocket" });
    updateSmoothedEntityCollection(fighters, dt, { positionBlend, velocityBlend, entityType: "fighter" });
    updateSmoothedEntityCollection(rivalProjectiles, dt, { positionBlend, velocityBlend, tickLife: true, maxAge: 0.12, snapDistance: 520, entityType: "rivalProjectile" });
    updateSmoothedEntityCollection(techPickups, dt, { positionBlend, velocityBlend, tickLife: true, tickRotation: true, maxAge: 0.18, snapDistance: 520, entityType: "techPickup" });
    updateSmoothedEntityCollection(healthPickups, dt, { positionBlend, velocityBlend, tickLife: true, maxAge: 0.18, snapDistance: 520, entityType: "healthPickup" });
  }

  function updateFollowerGadgetPrediction(dt) {
    if (!isSharedWorldFollower()) {
      return;
    }

    const snapshot = buildPersistentPayload(false);
    const state = localPartyGadgetState(snapshot.player);
    if (!state) {
      releaseMissingLocalPartyPhysicsSessions(new Set(), "inactive");
      return;
    }

    const now = performance.now();
    const controlledBodyIds = new Set();
    const activeEntityKeys = new Set();
    const predictionState = state;
    const authorityOptions = {
      actor: snapshot.player,
      mode: state.mode,
      active: state.active
    };
    if (state.landedBodyId && (state.left || state.right)) {
      const body = bodyById(state.landedBodyId);
      const direction = state.left ? 1 : -1;
      const strengthFactor = state.left ? state.suckFactor : state.blowFactor;
      if (applyGadgetThrustToBody(body, state.aimWorld, direction, dt, strengthFactor)) {
        integrateFollowerPredictedEntity(body, dt);
        controlledBodyIds.add(body.id);
        markFollowerPredictedParticle(body, now);
        markLocalPartyPhysicsSession("particle", body, now, authorityOptions);
        activeEntityKeys.add(partyEntityKey("particle", body.id));
      }
    }

    for (const particle of particles) {
      if (!partyGadgetCanAffectParticle(state, particle)) {
        continue;
      }
      if (!gadgetStateMayReachTarget(predictionState, particle, 24)) {
        continue;
      }

      const probe = partyGadgetParticleProbe(predictionState, particle, { padding: 24 });
      let forcePredicted = false;
      let bucketPredicted = false;
      if (state.active && probe.force) {
        forcePredicted = applyActorGadgetForces(particle, predictionState, dt) || forcePredicted;
      }
      if (forcePredicted) {
        integrateFollowerPredictedEntity(particle, dt);
      }
      if (probe.bucket) {
        bucketPredicted = resolveActorFunnelBucket(particle, predictionState, dt) || bucketPredicted;
      }
      if (forcePredicted || bucketPredicted) {
        controlledBodyIds.add(particle.id);
        markFollowerPredictedParticle(particle, now);
      }
      if (forcePredicted) {
        markLocalPartyPhysicsSession("particle", particle, now, authorityOptions);
        activeEntityKeys.add(partyEntityKey("particle", particle.id));
      }
    }

    const predictPickup = (type, pickup) => {
      if (!pickup) {
        return;
      }
      const key = partyEntityKey(type, pickup.id);
      if (!gadgetStateMayReachTarget(predictionState, pickup, 18)) {
        return;
      }
      const probe = partyGadgetParticleProbe(predictionState, pickup, { padding: 18 });
      if (!state.active || !probe.force) {
        return;
      }
      if (applyActorGadgetForces(pickup, predictionState, dt, { captureInFunnel: false, pullTowardActor: type === "techPickup" })) {
        integrateFollowerPredictedEntity(pickup, dt);
        markLocalPartyPhysicsSession(type, pickup, now, authorityOptions);
        if (key) {
          activeEntityKeys.add(key);
        }
      }
    };

    for (const pickup of techPickups) {
      predictPickup("techPickup", pickup);
    }
    for (const pickup of healthPickups) {
      predictPickup("healthPickup", pickup);
    }

    releaseMissingLocalPartyPhysicsSessions(activeEntityKeys, "inactive");
    resolveFollowerControlledBodyCollisions(controlledBodyIds);
  }

  function resolveFollowerControlledBodyCollisions(controlledBodyIds) {
    if (!controlledBodyIds || !controlledBodyIds.size) {
      return;
    }

    for (const bodyId of controlledBodyIds) {
      const body = bodyById(bodyId);
      if (!body || !body.tier || !body.tier.solid) {
        continue;
      }

      for (const other of particles) {
        if (!other || other.id === body.id || !other.tier || !other.tier.solid) {
          continue;
        }

        const dx = body.x - other.x;
        const dy = body.y - other.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = solidBodyContactRadius(body) + solidBodyContactRadius(other);
        if (dist >= minDist) {
          continue;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        body.x += nx * overlap;
        body.y += ny * overlap;

        const relativeVelocity = (body.vx - other.vx) * nx + (body.vy - other.vy) * ny;
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.92;
          body.vx += nx * impulse;
          body.vy += ny * impulse;
          const tangentX = -ny;
          const tangentY = nx;
          const tangentVelocity = body.vx * tangentX + body.vy * tangentY;
          body.vx -= tangentX * tangentVelocity * 0.12;
          body.vy -= tangentY * tangentVelocity * 0.12;
        }
      }
    }
  }

  function updateSmoothedEntityCollection(collection, dt, options) {
    const positionBlend = options && Number.isFinite(Number(options.positionBlend)) ? Number(options.positionBlend) : 1 - Math.pow(0.00035, dt);
    const velocityBlend = options && Number.isFinite(Number(options.velocityBlend)) ? Number(options.velocityBlend) : 1 - Math.pow(0.0015, dt);
    const maxAge = options && Number.isFinite(Number(options.maxAge)) ? Number(options.maxAge) : 0.18;
    const snapDistance = options && Number.isFinite(Number(options.snapDistance)) ? Number(options.snapDistance) : 900;
    const entityType = options && options.entityType ? normalizePartyEntityType(options.entityType) : "";
    const now = performance.now();

    for (const entity of collection) {
      if (entityType && hasLocalPartyPhysicsSession(entityType, entity.id, now)) {
        continue;
      }
      if (!Number.isFinite(entity._partyTargetX) || !Number.isFinite(entity._partyTargetY)) {
        continue;
      }

      if (options && options.tickLife && Number.isFinite(Number(entity.life))) {
        entity.life = Math.max(0, finiteOr(entity.life, 0) - dt);
      }
      if (options && options.tickRotation) {
        entity.rotation = finiteOr(entity.rotation, 0) + (1.4 + Math.sin(finiteOr(entity.wobble, 0)) * 0.4) * dt;
      }

      const age = Math.max(0, Math.min(maxAge, (now - finiteOr(entity._partyTargetReceivedAt, now)) / 1000));
      const targetVx = finiteOr(entity._partyTargetVx, entity.vx);
      const targetVy = finiteOr(entity._partyTargetVy, entity.vy);
      const targetX = finiteOr(entity._partyTargetX, entity.x) + targetVx * age;
      const targetY = finiteOr(entity._partyTargetY, entity.y) + targetVy * age;
      const error = Math.hypot(targetX - entity.x, targetY - entity.y);

      if (error > Math.max(snapDistance, finiteOr(entity.radius, 1) * 5)) {
        entity.x = targetX;
        entity.y = targetY;
        entity.vx = targetVx;
        entity.vy = targetVy;
        continue;
      }

      entity.vx += (targetVx - entity.vx) * velocityBlend;
      entity.vy += (targetVy - entity.vy) * velocityBlend;
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
      entity.x += (targetX - entity.x) * positionBlend;
      entity.y += (targetY - entity.y) * positionBlend;
    }
  }

  function integrateFollowerPredictedEntity(entity, dt) {
    if (!entity) {
      return false;
    }

    if (entity.tier) {
      if (entity.gadgetStabilized && length(entity.vx, entity.vy) > gadgetStabilizedBreakSpeed) {
        entity.gadgetStabilized = false;
      }
      if (!entity.gadgetStabilized || !entity.tier.solid) {
        entity.vx += Math.sin(finiteOr(entity.wobble, 0) + performance.now() * 0.0007) * 4 * dt;
        entity.vy += Math.cos(finiteOr(entity.wobble, 0) * 1.7 + performance.now() * 0.0006) * 4 * dt;
      }
      const dragBase = entity.tier.solid
        ? clamp(0.9 + Math.log10(Math.max(10, finiteOr(entity.mass, 1))) * 0.014, 0.9, 0.955)
        : 0.82;
      entity.vx *= Math.pow(dragBase, dt);
      entity.vy *= Math.pow(dragBase, dt);
      if (entity.gadgetStabilized && entity.tier.solid && length(entity.vx, entity.vy) <= gadgetStabilizedBreakSpeed) {
        entity.vx = 0;
        entity.vy = 0;
      }
    } else {
      entity.vx *= Math.pow(0.9, dt);
      entity.vy *= Math.pow(0.9, dt);
    }

    entity.x += finiteOr(entity.vx, 0) * dt;
    entity.y += finiteOr(entity.vy, 0) * dt;
    return true;
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

  function serializeTechPickup(pickup) {
    return {
      id: pickup.id,
      key: pickup.key,
      x: pickup.x,
      y: pickup.y,
      vx: pickup.vx,
      vy: pickup.vy,
      radius: pickup.radius,
      life: pickup.life,
      maxLife: pickup.maxLife,
      rotation: pickup.rotation,
      wobble: pickup.wobble
    };
  }

  function serializeHealthPickup(pickup) {
    return {
      id: pickup.id,
      x: pickup.x,
      y: pickup.y,
      vx: pickup.vx,
      vy: pickup.vy,
      radius: pickup.radius,
      heal: pickup.heal,
      life: pickup.life,
      maxLife: pickup.maxLife,
      wobble: pickup.wobble
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
      restCenterDx: structure.restCenterDx,
      restCenterDy: structure.restCenterDy,
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
      pulse: finiteOr(snapshot.pulse, randomRange(0.8, 1.25)),
      spawnSizeScale: finiteOr(snapshot.spawnSizeScale, 1),
      ufoSapTimer: Math.max(0, finiteOr(snapshot.ufoSapTimer, 0)),
      ufoSapSourceGraceTimer: Math.max(0, finiteOr(snapshot.ufoSapSourceGraceTimer, 0)),
      ufoExtractedById: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedById, 0))),
      ufoExtractedFromId: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedFromId, 0))),
      ufoSapParticleBuffer: Math.max(0, finiteOr(snapshot.ufoSapParticleBuffer, 0))
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
      restCenterDx: finiteOr(snapshot.restCenterDx, 0),
      restCenterDy: finiteOr(snapshot.restCenterDy, 0),
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

  function applyMobSpawnRestState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    mobSpawnRestTimer = clamp(finiteOr(snapshot.mobSpawnRestTimer, mobSpawnRestTimer), 0, mobSpawnRestDuration);
    mobSpawnRestCooldownTimer = clamp(finiteOr(snapshot.mobSpawnRestCooldownTimer, mobSpawnRestCooldownTimer), 0, mobSpawnRestCooldown);
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
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextRivalProjectileId))),
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
      knockback: finiteOr(snapshot.knockback, 0),
      toolDisable: finiteOr(snapshot.toolDisable, 0),
      cause: typeof snapshot.cause === "string" ? snapshot.cause : "",
      sourcePlayerId: typeof snapshot.sourcePlayerId === "string" ? snapshot.sourcePlayerId : "",
      weaponLabel: typeof snapshot.weaponLabel === "string" ? snapshot.weaponLabel : "",
      piercesMobs: Boolean(snapshot.piercesMobs),
      lightning: Boolean(snapshot.lightning),
      rocket: Boolean(snapshot.rocket)
    };
  }

  function normalizeTechPickupSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const tech = techTypes.find((candidate) => candidate.key === snapshot.key) || techTypes[0];
    const id = Math.max(1, Math.floor(finiteOr(snapshot.id, nextTechPickupId)));
    if (multiplayer.claimedTechPickupIds.has(String(id))) {
      return null;
    }

    return {
      id,
      key: tech.key,
      label: tech.label,
      color: tech.color,
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 15),
      life: clamp(finiteOr(snapshot.life, techPickupLifetime), 0, techPickupLifetime),
      maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, techPickupLifetime)),
      rotation: finiteOr(snapshot.rotation, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeHealthPickupSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextHealthPickupId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 14),
      heal: clamp(finiteOr(snapshot.heal, healthPickupHeal), 1, 100),
      life: clamp(finiteOr(snapshot.life, healthPickupLifetime), 0, healthPickupLifetime),
      maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, healthPickupLifetime)),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
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
      bridgeId: Math.max(0, Math.floor(finiteOr(snapshot.bridgeId, 0))),
      bridgeT: Math.max(0, finiteOr(snapshot.bridgeT, 0)),
      bridgeSide: finiteOr(snapshot.bridgeSide, 1) < 0 ? -1 : 1,
      bridgeInputSign: finiteOr(snapshot.bridgeInputSign, 1) < 0 ? -1 : 1,
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
    const id = nextParticleId++;
    const textureSeed = Math.random() * 1000;
    const particle = {
      id,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      mass,
      radius: radiusFromMass(mass),
      tier,
      textureSeed,
      color,
      wobble: randomRange(0, Math.PI * 2),
      pulse: randomRange(0.8, 1.25),
      spawnSizeScale: ambientSpawnSizeScale(id, textureSeed)
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

  function ambientSpawnSizeScale(id, textureSeed) {
    const wave = Math.sin(id * 12.9898 + textureSeed * 78.233) * 43758.5453;
    const unit = wave - Math.floor(wave);
    if (unit < 0.74) {
      return 1;
    }
    if (unit < 0.94) {
      return 1.08;
    }
    return 1.16;
  }

  function addUniquePlayerAnchor(anchors, seenPlayerIds, anchor) {
    if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
      return;
    }

    const playerId = String(anchor.playerId || "");
    if (playerId) {
      if (seenPlayerIds.has(playerId)) {
        return;
      }
      seenPlayerIds.add(playerId);
    }

    anchors.push({
      x: anchor.x,
      y: anchor.y,
      vx: finiteOr(anchor.vx, 0),
      vy: finiteOr(anchor.vy, 0),
      playerId
    });
  }

  function addRemoteUniversePlayerAnchors(anchors, seenPlayerIds) {
    if (!multiplayer.remoteUniverses.size) {
      return;
    }

    const now = performance.now();
    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!remote || now - finiteOr(remote.seenAt, 0) > 2200) {
        continue;
      }

      const transform = displayTransformFor(remote);
      if (!transform || transform.alpha <= 0.02) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const remotePlayer = normalizeRemotePlayerSnapshot(snapshot && snapshot.player);
      if (!remotePlayer || remotePlayer.health <= 0) {
        continue;
      }

      const transformed = transformedRemoteEntity(remotePlayer, transform);
      addUniquePlayerAnchor(anchors, seenPlayerIds, {
        x: transformed.x,
        y: transformed.y,
        vx: transformed.vx,
        vy: transformed.vy,
        playerId: remote.playerId || remotePlayer.id
      });
    }
  }

  function activePartyPlayerAnchors() {
    const anchors = [];
    const seenPlayerIds = new Set();
    addUniquePlayerAnchor(anchors, seenPlayerIds, {
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      playerId: player.id
    });

    if (isPartyHost() && multiplayer.partyPlayerSnapshots.size) {
      const now = performance.now();
      for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
        if (!entry || now - finiteOr(entry.receivedAt, 0) > 2200) {
          continue;
        }

        const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
        const remotePlayer = normalizeRemotePlayerSnapshot(source.player || source);
        if (!remotePlayer || remotePlayer.health <= 0) {
          continue;
        }
        addUniquePlayerAnchor(anchors, seenPlayerIds, {
          x: remotePlayer.x,
          y: remotePlayer.y,
          vx: remotePlayer.vx,
          vy: remotePlayer.vy,
          playerId
        });
      }
    }

    addRemoteUniversePlayerAnchors(anchors, seenPlayerIds);
    return anchors;
  }

  function activeMobSpawnAnchors() {
    const anchors = [];
    const seenPlayerIds = new Set();
    if (!deathState.active && player.health > 0) {
      addUniquePlayerAnchor(anchors, seenPlayerIds, {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        playerId: player.id
      });
    }

    if (isPartyHost() && multiplayer.partyPlayerSnapshots.size) {
      const now = performance.now();
      for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
        if (!entry || now - finiteOr(entry.receivedAt, 0) > 2200) {
          continue;
        }

        const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
        const remotePlayer = predictPartyRemotePlayer(
          normalizeRemotePlayerSnapshot(source.player || source),
          entry.receivedAt
        );
        if (!remotePlayer || remotePlayer.health <= 0) {
          continue;
        }
        addUniquePlayerAnchor(anchors, seenPlayerIds, {
          x: remotePlayer.x,
          y: remotePlayer.y,
          vx: remotePlayer.vx,
          vy: remotePlayer.vy,
          playerId
        });
      }
    }

    addRemoteUniversePlayerAnchors(anchors, seenPlayerIds);

    if (!anchors.length) {
      addUniquePlayerAnchor(anchors, seenPlayerIds, {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        playerId: player.id
      });
    }

    return anchors.slice(0, crazyGamesRoomMaxPlayers);
  }

  function leastPopulatedMobSpawnAnchor(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    const counts = source.map(() => 0);

    for (const mob of liveMobsForSpawnPlacement()) {
      let bestIndex = 0;
      let bestDistance = Infinity;
      for (let i = 0; i < source.length; i += 1) {
        const anchor = source[i];
        const distance = Math.hypot(mob.x - anchor.x, mob.y - anchor.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }
      counts[bestIndex] += 1;
    }

    let minCount = Infinity;
    for (const count of counts) {
      minCount = Math.min(minCount, count);
    }

    const candidates = source.filter((_, index) => counts[index] === minCount);
    return candidates[Math.floor(Math.random() * candidates.length)] || source[0] || player;
  }

  function effectiveMobAnchorCount(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    const clusterRadius = particleDensityRadius() * 0.95;
    const clusters = [];

    for (const anchor of source) {
      let cluster = null;
      for (const candidate of clusters) {
        if (Math.hypot(anchor.x - candidate.x, anchor.y - candidate.y) <= clusterRadius) {
          cluster = candidate;
          break;
        }
      }

      if (!cluster) {
        clusters.push({ x: anchor.x, y: anchor.y, count: 1 });
        continue;
      }

      cluster.x = (cluster.x * cluster.count + anchor.x) / (cluster.count + 1);
      cluster.y = (cluster.y * cluster.count + anchor.y) / (cluster.count + 1);
      cluster.count += 1;
    }

    return clusters.reduce((total, cluster) => total + 1 + Math.max(0, cluster.count - 1) * 0.42, 0) || 1;
  }

  function nearestPartyAnchorDistance(x, y, anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activePartyPlayerAnchors();
    let nearest = Infinity;
    for (const anchor of source) {
      const distance = Math.hypot(x - anchor.x, y - anchor.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function mobCollectionByKind(kind) {
    if (kind === "ufo") {
      return ufos;
    }
    if (kind === "rambot") {
      return rambots;
    }
    if (kind === "engineer") {
      return engineers;
    }
    if (kind === "tesla") {
      return teslas;
    }
    if (kind === "satellite" || kind === "rocket") {
      return rockets;
    }
    if (kind === "fighter") {
      return fighters;
    }
    return rivals;
  }

  function liveMobCount(kind) {
    let count = 0;
    for (const mob of mobCollectionByKind(kind)) {
      if (mob && mob.health > 0 && (kind !== "satellite" && kind !== "rocket" || mob.kind === kind)) {
        count += 1;
      }
    }
    return count;
  }

  let liveMobSpawnCache = null;

  function liveMobsForSpawnPlacement() {
    const now = performance.now();
    const collectionSize = rivals.length + ufos.length + rambots.length + engineers.length + teslas.length + rockets.length + fighters.length;
    if (
      liveMobSpawnCache &&
      liveMobSpawnCache.time === now &&
      liveMobSpawnCache.collectionSize === collectionSize
    ) {
      return liveMobSpawnCache.mobs;
    }

    const mobs = [];
    for (const collection of [rivals, ufos, rambots, engineers, teslas, rockets, fighters]) {
      for (const mob of collection) {
        if (mob && mob.health > 0) {
          mobs.push(mob);
        }
      }
    }
    liveMobSpawnCache = {
      time: now,
      collectionSize,
      mobs
    };
    return mobs;
  }

  function effectiveParticleAnchorCount(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activePartyPlayerAnchors();
    const clusterRadius = particleDensityRadius() * 0.72;
    const clusters = [];

    for (const anchor of source) {
      let cluster = null;
      for (const candidate of clusters) {
        if (Math.hypot(anchor.x - candidate.x, anchor.y - candidate.y) <= clusterRadius) {
          cluster = candidate;
          break;
        }
      }

      if (!cluster) {
        clusters.push({ x: anchor.x, y: anchor.y, count: 1 });
        continue;
      }

      cluster.x = (cluster.x * cluster.count + anchor.x) / (cluster.count + 1);
      cluster.y = (cluster.y * cluster.count + anchor.y) / (cluster.count + 1);
      cluster.count += 1;
    }

    return clusters.reduce((total, cluster) => total + 1 + Math.max(0, cluster.count - 1) * 0.28, 0) || 1;
  }

  function activeParticleTargetCount(anchorCount) {
    const count = Array.isArray(anchorCount)
      ? effectiveParticleAnchorCount(anchorCount)
      : Math.max(1, finiteOr(anchorCount, 1));
    if (!isPartyHost()) {
      return targetParticles;
    }
    return Math.round(targetParticles * (0.92 + Math.max(0, count - 1) * 0.48));
  }

  function particleDensityRadius() {
    const spawnWidth = Math.max(640, finiteOr(width, 0));
    const spawnHeight = Math.max(360, finiteOr(height, 0));
    return Math.hypot(spawnWidth, spawnHeight) * 0.62 + 260;
  }

  function particlePlayfieldRadius() {
    const zoom = Math.max(0.35, finiteOr(cameraZoom, 1));
    const spawnWidth = Math.max(640, finiteOr(width, 0) / zoom);
    const spawnHeight = Math.max(360, finiteOr(height, 0) / zoom);
    const viewportRadius = Math.hypot(spawnWidth, spawnHeight) * 0.5;
    return Math.max(1420, Math.min(particleDensityRadius() + 320, viewportRadius + 760));
  }

  function useParticlePlayfieldFill() {
    return isPartySessionActive() || multiplayer.remoteUniverses.size > 0;
  }

  function isAmbientDensityParticle(particle) {
    return Boolean(particle && particle.tier && !particle.tier.solid && !isUfoBeamCargo(particle));
  }

  function countAmbientParticles() {
    let count = 0;
    for (const particle of particles) {
      if (isAmbientDensityParticle(particle)) {
        count += 1;
      }
    }
    return count;
  }

  let ambientDensityCache = null;

  function ambientDensityCellKey(cellX, cellY) {
    return cellX + ":" + cellY;
  }

  function ambientDensityGrid() {
    const cellSize = 480;
    const now = performance.now();
    if (
      ambientDensityCache &&
      ambientDensityCache.time === now &&
      ambientDensityCache.particleCount === particles.length
    ) {
      return ambientDensityCache;
    }

    const cells = new Map();
    for (const particle of particles) {
      if (!isAmbientDensityParticle(particle)) {
        continue;
      }
      const cellX = Math.floor(particle.x / cellSize);
      const cellY = Math.floor(particle.y / cellSize);
      const key = ambientDensityCellKey(cellX, cellY);
      if (!cells.has(key)) {
        cells.set(key, []);
      }
      cells.get(key).push(particle);
    }

    ambientDensityCache = {
      time: now,
      particleCount: particles.length,
      cellSize,
      cells
    };
    return ambientDensityCache;
  }

  function forAmbientParticlesNear(x, y, radius, callback) {
    const grid = ambientDensityGrid();
    const cellSize = grid.cellSize;
    const minX = Math.floor((x - radius) / cellSize);
    const maxX = Math.floor((x + radius) / cellSize);
    const minY = Math.floor((y - radius) / cellSize);
    const maxY = Math.floor((y + radius) / cellSize);
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      for (let cellY = minY; cellY <= maxY; cellY += 1) {
        const bucket = grid.cells.get(ambientDensityCellKey(cellX, cellY));
        if (!bucket) {
          continue;
        }
        for (const particle of bucket) {
          callback(particle);
        }
      }
    }
  }

  function countAmbientParticlesNearAnchor(anchor, radius) {
    const radiusSq = radius * radius;
    let count = 0;
    forAmbientParticlesNear(anchor.x, anchor.y, radius, function (particle) {
      const dx = particle.x - anchor.x;
      const dy = particle.y - anchor.y;
      if (dx * dx + dy * dy <= radiusSq) {
        count += 1;
      }
    });
    return count;
  }

  function localParticleTargetPerAnchor(anchorCount) {
    if (!useParticlePlayfieldFill()) {
      const count = Math.max(1, Math.floor(finiteOr(anchorCount, 1)));
      return Math.round(targetParticles * (isPartyHost() ? clamp(0.54 + 0.08 / count, 0.52, 0.62) : 0.62));
    }
    return Math.round(targetParticles * (isPartyHost() ? 0.32 : 0.38));
  }

  function mostUnderdenseParticleAnchor(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activePartyPlayerAnchors();
    const densityRadius = useParticlePlayfieldFill() ? particlePlayfieldRadius() : particleDensityRadius();
    const localTarget = localParticleTargetPerAnchor(effectiveParticleAnchorCount(source));
    let best = null;

    for (const anchor of source) {
      const localCount = countAmbientParticlesNearAnchor(anchor, densityRadius);
      const speed = Math.hypot(finiteOr(anchor.vx, 0), finiteOr(anchor.vy, 0));
      const deficit = localTarget - localCount;
      const score = deficit + clamp(speed / 480, 0, 0.75);
      if (!best || score > best.score) {
        best = { anchor, localCount, localTarget, score };
      }
    }

    return best || { anchor: source[0] || player, localCount: 0, localTarget, score: 0 };
  }

  function ambientParticleDensityAt(x, y) {
    const crowdRadius = 480;
    const crowdRadiusSq = crowdRadius * crowdRadius;
    let nearest = Infinity;
    let crowdCount = 0;
    forAmbientParticlesNear(x, y, crowdRadius, function (particle) {
      const dx = x - particle.x;
      const dy = y - particle.y;
      const distanceSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSq);
      if (distance < nearest) {
        nearest = distance;
      }
      if (distanceSq <= crowdRadiusSq) {
        crowdCount += 1;
      }
    });
    return { nearest: Number.isFinite(nearest) ? nearest : crowdRadius, crowdCount };
  }

  function particlePatchNoise(cellX, cellY, salt) {
    const wave = Math.sin(cellX * 127.1 + cellY * 311.7 + salt * 74.3) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function particlePatchAffinityAt(x, y) {
    const cellSize = 1850;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    let affinity = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        const patchX = cellX + xOffset;
        const patchY = cellY + yOffset;
        const roll = particlePatchNoise(patchX, patchY, 0);
        if (roll < 0.58) {
          continue;
        }

        const centerX = (patchX + particlePatchNoise(patchX, patchY, 1)) * cellSize;
        const centerY = (patchY + particlePatchNoise(patchX, patchY, 2)) * cellSize;
        const radius = 720 + particlePatchNoise(patchX, patchY, 3) * 620;
        const distance = Math.hypot(x - centerX, y - centerY);
        const falloff = clamp(1 - distance / radius, 0, 1);
        const strength = 0.68 + particlePatchNoise(patchX, patchY, 4) * 0.52;
        affinity += falloff * falloff * strength;
      }
    }

    return clamp(affinity, 0, 1);
  }

  function chooseParticleSpawnPoint(anchor, options) {
    const localFill = Boolean(options && options.localFill);
    const playfieldFill = Boolean(options && options.playfieldFill);
    const source = anchor || randomPartySpawnAnchor();
    const anchors = activePartyPlayerAnchors();
    const zoom = Math.max(0.35, finiteOr(cameraZoom, 1));
    const spawnWidth = Math.max(640, finiteOr(width, 0) / zoom);
    const spawnHeight = Math.max(360, finiteOr(height, 0) / zoom);
    const viewportRadius = Math.hypot(spawnWidth, spawnHeight) * 0.5;
    const minPlayerDistance = viewportRadius + 140;
    const preferredParticleSpacing = 170;
    const localFillRadius = particlePlayfieldRadius();
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const moving = speed > 45;
    const travel = moving ? normalize(source.vx, source.vy) : { x: 0, y: 0 };
    let best = null;

    for (let attempt = 0; attempt < 22; attempt += 1) {
      const aheadBias = moving && Math.random() < 0.58;
      const angle = aheadBias
        ? Math.atan2(travel.y, travel.x) + randomRange(-1.05, 1.05)
        : randomRange(0, Math.PI * 2);
      const baseMinDist = minPlayerDistance * randomRange(1, 1.16);
      const playfieldMinDist = Math.max(viewportRadius * 0.86, localFillRadius * 0.48);
      const minDist = localFill
        ? Math.min(baseMinDist, Math.max(playfieldFill ? playfieldMinDist : 120, localFillRadius * (playfieldFill ? 0.48 : 0.74)))
        : baseMinDist;
      const broadMaxDist = viewportRadius * 1.85 + clamp(speed * 1.15, 0, 760);
      const maxDist = localFill ? Math.max(minDist + 60, Math.min(broadMaxDist, localFillRadius * 0.92)) : broadMaxDist;
      const dist = randomRange(minDist, maxDist);
      const ahead = moving ? clamp(speed * randomRange(0.18, 1.35), 0, 920) : 0;
      const driftRange = localFill ? 110 : 220;
      const drift = rotatePoint(randomRange(-driftRange, driftRange), randomRange(-driftRange, driftRange), angle + Math.PI / 2);
      let x = source.x + travel.x * ahead + Math.cos(angle) * dist + drift.x;
      let y = source.y + travel.y * ahead + Math.sin(angle) * dist + drift.y;
      if (localFill) {
        const localDx = x - source.x;
        const localDy = y - source.y;
        const localDistance = Math.hypot(localDx, localDy);
        const maxLocalDistance = Math.max(120, localFillRadius * 0.96);
        if (localDistance > maxLocalDistance) {
          const scale = (maxLocalDistance * randomRange(0.9, 0.99)) / localDistance;
          x = source.x + localDx * scale;
          y = source.y + localDy * scale;
        }
      }
      const nearestPlayer = nearestPartyAnchorDistance(x, y, anchors);
      const density = ambientParticleDensityAt(x, y);
      const patchAffinity = particlePatchAffinityAt(x, y);
      const tooCloseToPlayer = Math.max(0, minPlayerDistance - nearestPlayer);
      const patchWeight = localFill ? 0.24 : 1;
      const preferredSpacing = preferredParticleSpacing * (1 - patchAffinity * 0.38);
      const spacingPenalty = Math.max(0, preferredSpacing - density.nearest);
      const score =
        nearestPlayer * 0.16 +
        density.nearest * (1.08 - patchAffinity * 0.48) +
        patchAffinity * 720 * patchWeight -
        density.crowdCount * (135 - patchAffinity * 88) -
        (1 - patchAffinity) * 105 * patchWeight -
        tooCloseToPlayer * 7.5 -
        spacingPenalty * (3.2 - patchAffinity * 1.1);
      if (!best || score > best.score) {
        best = { x, y, angle, score };
      }
    }

    return best || { x: source.x, y: source.y, angle: randomRange(0, Math.PI * 2), score: 0 };
  }

  function spawnParticleNearPlayer(anchor, options) {
    const source = anchor || randomPartySpawnAnchor();
    const spawnPoint = chooseParticleSpawnPoint(source, options);
    const particle = createParticle(
      spawnPoint.x,
      spawnPoint.y,
      randomAmbientParticleMass(),
      randomParticleColor()
    );
    particle.vx += finiteOr(source.vx, 0) * 0.08 - Math.cos(spawnPoint.angle) * randomRange(6, 26);
    particle.vy += finiteOr(source.vy, 0) * 0.08 - Math.sin(spawnPoint.angle) * randomRange(6, 26);
    particles.push(particle);
  }

  function recycleParticleNearPlayer(particle, anchor, options) {
    if (!particle) {
      return false;
    }
    const id = particle.id;
    const source = anchor || randomPartySpawnAnchor();
    const spawnPoint = chooseParticleSpawnPoint(source, options);
    const replacement = createParticle(
      spawnPoint.x,
      spawnPoint.y,
      randomAmbientParticleMass(),
      randomParticleColor()
    );
    replacement.id = id;
    replacement.spawnSizeScale = ambientSpawnSizeScale(replacement.id, replacement.textureSeed);
    replacement.vx += finiteOr(source.vx, 0) * 0.08 - Math.cos(spawnPoint.angle) * randomRange(6, 26);
    replacement.vy += finiteOr(source.vy, 0) * 0.08 - Math.sin(spawnPoint.angle) * randomRange(6, 26);
    Object.keys(particle).forEach(function (key) {
      delete particle[key];
    });
    Object.assign(particle, replacement);
    return true;
  }

  function randomPartySpawnAnchor() {
    const anchors = activePartyPlayerAnchors();
    return anchors[Math.floor(Math.random() * anchors.length)] || anchors[0] || player;
  }

  function seedParticles() {
    particles.length = 0;
    const anchors = activePartyPlayerAnchors();
    const targetCount = activeParticleTargetCount(anchors);
    for (let i = 0; i < targetCount; i += 1) {
      spawnParticleNearPlayer(anchors.length > 1 ? mostUnderdenseParticleAnchor(anchors).anchor : undefined, {
        localFill: anchors.length > 1,
        playfieldFill: anchors.length > 1 && useParticlePlayfieldFill()
      });
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
      id: nextHealthPickupId++,
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
      id: nextTechPickupId++,
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

    const dropChance = difficultyHealthDropChance(rival.kind === "ufo" ? 0.55 : 0.45);
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
    const particleBudget = isPartySessionActive() || multiplayer.remoteUniverses.size
      ? targetParticles * 1.9
      : targetParticles * 3;
    if (!mob || damage <= 0 || particles.length > particleBudget) {
      return;
    }

    const maxCount = isPartySessionActive() || multiplayer.remoteUniverses.size
      ? Math.max(1, Math.min(2, mobDamageParticleMax))
      : mobDamageParticleMax;
    const count = Math.floor(randomRange(mobDamageParticleMin, maxCount + 1));
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

  function solidBodyPlayerImpactDamage(body, impactSpeed, baseDamage) {
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const speedDamage = Math.max(0, impactSpeed - solidBodyPlayerDamageSpeed) * 0.16;
    const massDamage = Math.sqrt(mass) * 0.55;
    return Math.min(80, baseDamage + speedDamage + massDamage);
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

  function nearestMobDistance(x, y, kind) {
    let nearestSq = Infinity;
    for (const mob of liveMobsForSpawnPlacement()) {
      const sameKind = kind === "alienoid"
        ? mob.kind === "alienoid"
        : kind === "satellite" || kind === "rocket"
        ? mob.kind === kind
        : mob.kind === kind;
      const weight = sameKind ? 1 : 0.55;
      const dx = x - mob.x;
      const dy = y - mob.y;
      const distanceSq = (dx * dx + dy * dy) / (weight * weight);
      if (distanceSq < nearestSq) {
        nearestSq = distanceSq;
      }
    }
    return Math.sqrt(nearestSq);
  }

  function chooseMobSpawnPoint(kind, margin, spread, anchor, spawnAnchors) {
    const source = anchor || leastPopulatedMobSpawnAnchor(activeMobSpawnAnchors());
    const anchors = Array.isArray(spawnAnchors) && spawnAnchors.length ? spawnAnchors : activeMobSpawnAnchors();
    const zoom = Math.max(0.35, finiteOr(cameraZoom, 1));
    const spawnWidth = Math.max(640, finiteOr(width, 0) / zoom);
    const spawnHeight = Math.max(360, finiteOr(height, 0) / zoom);
    const viewportRadius = Math.hypot(spawnWidth, spawnHeight) * 0.5;
    const minPlayerDistance = viewportRadius + Math.max(120, margin);
    const maxDistance = minPlayerDistance + Math.max(420, spread);
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const moving = speed > 50;
    const travel = moving ? normalize(source.vx, source.vy) : { x: 0, y: 0 };
    let best = null;

    const attemptLimit = liveMobsForSpawnPlacement().length > 24 ? 14 : 20;
    for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
      const aheadBias = moving && Math.random() < 0.5;
      const angle = aheadBias
        ? Math.atan2(travel.y, travel.x) + randomRange(-1.15, 1.15)
        : randomRange(0, Math.PI * 2);
      const dist = randomRange(minPlayerDistance, maxDistance);
      const ahead = moving ? clamp(speed * randomRange(0.12, 1.2), 0, 760) : 0;
      const drift = rotatePoint(randomRange(-220, 220), randomRange(-220, 220), angle + Math.PI / 2);
      const x = source.x + travel.x * ahead + Math.cos(angle) * dist + drift.x;
      const y = source.y + travel.y * ahead + Math.sin(angle) * dist + drift.y;
      const nearestPlayer = nearestPartyAnchorDistance(x, y, anchors);
      const nearestMob = nearestMobDistance(x, y, kind);
      const tooCloseToPlayer = Math.max(0, minPlayerDistance - nearestPlayer);
      const tooFarFromSource = Math.max(0, Math.hypot(x - source.x, y - source.y) - maxDistance * 1.15);
      const score =
        nearestPlayer * 0.18 +
        nearestMob * 0.62 -
        tooCloseToPlayer * 10 -
        tooFarFromSource * 1.4;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
    }

    return best || randomOffscreenPoint(margin, spread, source);
  }

  function spawnAlienoidNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("alienoid", 110, 360, anchor, anchors);
    rivals.push(createRival(spawn.x, spawn.y));
  }

  function spawnUfoNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("ufo", 180, 520, anchor, anchors);
    ufos.push(createUfo(spawn.x, spawn.y));
  }

  function spawnRambotNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("rambot", 220, 620, anchor, anchors);
    rambots.push(createRambot(spawn.x, spawn.y));
  }

  function spawnEngineerNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("engineer", 210, 600, anchor, anchors);
    engineers.push(createEngineer(spawn.x, spawn.y));
  }

  function spawnTeslaNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("tesla", 190, 560, anchor, anchors);
    teslas.push(createTesla(spawn.x, spawn.y));
  }

  function spawnSatelliteNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("satellite", 230, 680, anchor, anchors);
    rockets.push(createSatellite(spawn.x, spawn.y));
  }

  function spawnRocketNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("rocket", 320, 900, anchor, anchors);
    rockets.push(createRocket(spawn.x, spawn.y));
  }

  function spawnFighterNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("fighter", 260, 760, anchor, anchors);
    fighters.push(createFighter(spawn.x, spawn.y));
  }

  function spawnMobByKind(kind, anchor, anchors) {
    if (kind === "ufo") {
      spawnUfoNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "rambot") {
      spawnRambotNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "engineer") {
      spawnEngineerNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "tesla") {
      spawnTeslaNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "satellite") {
      spawnSatelliteNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "rocket") {
      spawnRocketNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "fighter") {
      spawnFighterNearPlayer(anchor, anchors);
      return;
    }
    spawnAlienoidNearPlayer(anchor, anchors);
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

  function baseMobSpawnBatchLimit(kind) {
    const interval = difficultyMobSpawnInterval(kind);
    if (!interval) {
      return baseMaxMobSpawnBatchSize;
    }

    const growthInterval = interval * mobSpawnCapGrowthIntervalMultiplier;
    const rawLimit = baseMaxMobSpawnBatchSize + Math.floor(currentLifeSeconds() / growthInterval);
    return Math.max(1, Math.round(rawLimit * activeDifficulty().mobBatchScale));
  }

  function baseLiveMobCap(kind) {
    if (kind === "alienoid") {
      return 5;
    }
    if (kind === "ufo") {
      return 4;
    }
    if (kind === "rambot" || kind === "engineer" || kind === "tesla") {
      return 3;
    }
    return 2;
  }

  function maxLiveMobCount(kind, anchors) {
    const interval = difficultyMobSpawnInterval(kind) || 120;
    const growth = Math.min(5, Math.floor(currentLifeSeconds() / Math.max(45, interval * 3.5)));
    const effectiveCount = Math.min(crazyGamesRoomMaxPlayers, effectiveMobAnchorCount(anchors));
    const playerScale = 1 + Math.max(0, effectiveCount - 1) * 0.3;
    return Math.max(1, Math.round((baseLiveMobCap(kind) + growth) * playerScale * activeDifficulty().mobBatchScale));
  }

  function maxMobSpawnBatchSize(kind, playerCount) {
    const count = Math.max(1, Math.min(crazyGamesRoomMaxPlayers, finiteOr(playerCount, 1)));
    return Math.max(1, Math.round(baseMobSpawnBatchLimit(kind) * (1 + Math.max(0, count - 1) * 0.55)));
  }

  function mobSpawnBonusSlotChanceScale(bonusSlot) {
    if (bonusSlot < 2) {
      return activeDifficulty().mobBonusChanceScale;
    }
    return Math.pow(thirdMobSpawnChanceScale, bonusSlot - 1) * activeDifficulty().mobBonusChanceScale;
  }

  function rollMobSpawnBatchSize(kind, batchLimit) {
    const index = mobTierOrder.indexOf(kind);
    const nextKind = mobTierOrder[index + 1];

    const defeats = Math.max(0, mobDefeatsByKind[nextKind || kind] || 0);
    let batchSize = 1;
    for (let bonusSlot = 1; bonusSlot < batchLimit; bonusSlot += 1) {
      const chanceScale = mobSpawnBonusSlotChanceScale(bonusSlot);
      const chance = clamp(defeats / (previousTierDefeatsToUnlock * bonusSlot), 0, 0.92) * chanceScale;
      if (Math.random() < chance) {
        batchSize += 1;
      }
    }
    return batchSize;
  }

  function mobSpawnBatchSize(kind, playerCount) {
    const count = Math.max(1, Math.min(crazyGamesRoomMaxPlayers, finiteOr(playerCount, 1)));
    const batchLimit = baseMobSpawnBatchLimit(kind);
    let batchSize = rollMobSpawnBatchSize(kind, batchLimit);
    const bonusRolls = Math.floor(Math.max(0, count - 1));
    for (let i = 0; i < bonusRolls; i += 1) {
      batchSize += Math.random() < 0.55 ? rollMobSpawnBatchSize(kind, batchLimit) : 0;
    }
    const fractionalBonus = Math.max(0, count - 1) - bonusRolls;
    if (fractionalBonus > 0 && Math.random() < fractionalBonus * 0.55) {
      batchSize += rollMobSpawnBatchSize(kind, batchLimit);
    }
    return Math.min(maxMobSpawnBatchSize(kind, count), Math.max(1, batchSize));
  }

  function updateMobSpawnRest(dt) {
    if (mobSpawnRestTimer > 0) {
      mobSpawnRestTimer = Math.max(0, mobSpawnRestTimer - dt);
      return true;
    }

    mobSpawnRestCooldownTimer = Math.max(0, mobSpawnRestCooldownTimer - dt);
    if (mobSpawnRestCooldownTimer > 0) {
      return false;
    }

    mobSpawnRestTimer = mobSpawnRestDuration;
    mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
    return true;
  }

  function updateMobSpawns(dt) {
    const anchors = activeMobSpawnAnchors();
    if (updateMobSpawnRest(dt)) {
      return;
    }

    const playerCount = effectiveMobAnchorCount(anchors);
    for (const kind of Object.keys(mobSpawnIntervals)) {
      if (!isMobTierUnlocked(kind)) {
        mobSpawnTimers[kind] = Math.max(0, mobSpawnTimers[kind] - dt);
        continue;
      }

      mobSpawnTimers[kind] -= dt;
      while (mobSpawnTimers[kind] <= 0) {
        const remainingSlots = maxLiveMobCount(kind, anchors) - liveMobCount(kind);
        const batchSize = Math.max(0, Math.min(remainingSlots, mobSpawnBatchSize(kind, playerCount)));
        for (let i = 0; i < batchSize; i += 1) {
          spawnMobByKind(kind, leastPopulatedMobSpawnAnchor(anchors), anchors);
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

  function randomOffscreenPoint(margin, spread, anchor) {
    const source = anchor || player;
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
      x: finiteOr(source.x, player.x) + world.x,
      y: finiteOr(source.y, player.y) + world.y
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
    return actorFunnel(player, aim.world);
  }

  function actorFunnel(actor, aimWorld) {
    const source = actor || player;
    const aim = aimWorld || { x: 1, y: 0 };
    const reach = funnelShape.captureX;
    return {
      x: source.x + aim.x * reach,
      y: source.y + aim.y * reach,
      mouthX: source.x + aim.x * funnelShape.rimX,
      mouthY: source.y + aim.y * funnelShape.rimX,
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
    if (isLinkedStructureType(type)) {
      return thresholdForTierName("boulder");
    }
    return structurePlacementTierThreshold;
  }

  function isStructureHostBodyForType(particle, type) {
    return particle && particle.tier.threshold >= structurePlacementThresholdForType(type);
  }

  function isKnownStructureType(type) {
    return type === "turret" || type === "missile-launcher" || type === "accumulator" || type === "shield-generator" || type === "plating-block" || type === "battery" || type === "communication-relay" || type === "jet" || type === "tether" || type === "bridge";
  }

  function isLinkedStructureType(type) {
    return type === "tether" || type === "bridge";
  }

  function isActiveBridge(structure) {
    return Boolean(structure && structure.type === "bridge" && structure.health > 0 && !isStructureDisabled(structure));
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
    if (structure.type === "bridge") {
      return 46;
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

  function platingBlockAtImpactAngle(body, angle) {
    if (!body) {
      return null;
    }

    let blocker = null;
    let highestOffset = -Infinity;
    for (const structure of structures) {
      if (!structure || structure.health <= 0 || !platingBlockCoversAngle(body, structure, angle)) {
        continue;
      }

      const topOffset = platingBlockTopOffset(structure);
      if (topOffset > highestOffset) {
        blocker = structure;
        highestOffset = topOffset;
      }
    }

    return blocker;
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
    if (type === "bridge") {
      return surfaceOffset + 16;
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

  function continuousPlayerEnergyCost(rate, dt = 1 / 60) {
    return Math.max(0, finiteOr(rate, 0)) * Math.max(0, finiteOr(dt, 0));
  }

  function continuousPlayerEnergyActivationCost(rate, dt = 1 / 60) {
    return Math.max(playerContinuousEnergyActivationCost, continuousPlayerEnergyCost(rate, dt));
  }

  function isContinuousPlayerEnergyInputPressed() {
    return (
      (isSuctionEquipped() && isGadgetButtonPressed()) ||
      (equippedToolId === "spanner" && (mouse.left || mouse.right)) ||
      isTouchBoostPressed() ||
      keys.has("ShiftLeft") ||
      keys.has("ShiftRight")
    );
  }

  function canUseContinuousPlayerEnergy(rate, dt = 1 / 60) {
    if (playerContinuousEnergyLocked) {
      return false;
    }
    return canSpendPlayerEnergy(continuousPlayerEnergyActivationCost(rate, dt));
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

  function canSpendPlayerEnergy(amount) {
    return player.energy >= Math.max(0, finiteOr(amount, 0));
  }

  function drainPlayerEnergy(rate, dt) {
    return spendPlayerEnergy(Math.max(0, finiteOr(rate, 0)) * Math.max(0, finiteOr(dt, 0)));
  }

  function drainContinuousPlayerEnergy(rate, dt) {
    if (!canUseContinuousPlayerEnergy(rate, dt)) {
      playerContinuousEnergyLocked = true;
      return false;
    }
    if (!drainPlayerEnergy(rate, dt)) {
      playerContinuousEnergyLocked = true;
      return false;
    }
    return true;
  }

  function notifyEnergyDepleted() {
    maybeNotifyText("Energy depleted.", { groupKey: "energy-depleted" });
  }

  function isJetpackBoostPressed() {
    return keys.has("ShiftLeft") || keys.has("ShiftRight") || isTouchBoostPressed();
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

  function findBucketProgressBody() {
    if (!isSuctionEquipped()) {
      return null;
    }

    const aim = getAim();
    const state = {
      actor: player,
      aimWorld: aim.world,
      funnel: getFunnel(aim),
      left: false,
      middle: false,
      right: false,
      bucketActive: true,
      bucketPadding: 0,
      landedBodyId: player.landed ? player.landed.bodyId : null
    };
    let best = null;
    let bestMass = 0;

    for (const particle of particles) {
      if (!partyGadgetCanAffectParticle(state, particle)) {
        continue;
      }
      if (!partyGadgetBucketContact(state, particle, 0)) {
        continue;
      }
      const mass = finiteOr(particle.mass, 0);
      if (mass > bestMass) {
        best = particle;
        bestMass = mass;
      }
    }

    return best;
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
      restCenterDx: linkedPlacement ? linkedPlacement.body.x - placement.body.x : 0,
      restCenterDy: linkedPlacement ? linkedPlacement.body.y - placement.body.y : 0,
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

  function applyLinkedStructureSurfaceConstraint(structure) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!isStructureHostBodyForType(firstBody, structure.type) || !isStructureHostBodyForType(secondBody, structure.type) || firstBody.id === secondBody.id) {
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
    if (structure.type === "bridge") {
      structure.restCenterDx = finiteOr(structure.restCenterDx, secondBody.x - firstBody.x);
      structure.restCenterDy = finiteOr(structure.restCenterDy, secondBody.y - firstBody.y);
    }
    return true;
  }

  function applyStructureSurfaceConstraint(structure) {
    if (isLinkedStructureType(structure.type)) {
      return applyLinkedStructureSurfaceConstraint(structure);
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

  function rotateBodyMountedFrame(bodyId, angleStep) {
    if (!bodyId || Math.abs(angleStep) <= 0.000001) {
      return;
    }

    for (const mounted of structures) {
      if (mounted.bodyId === bodyId) {
        mounted.angle += angleStep;
      }
      if (isLinkedStructureType(mounted.type) && mounted.linkedBodyId === bodyId) {
        mounted.linkedAngle += angleStep;
      }
    }

    if (player.landed && !player.landed.bridgeId && player.landed.bodyId === bodyId) {
      player.landed.angle += angleStep;
    }

    for (const rival of rivals) {
      if (rival.landed && !rival.landed.bridgeId && rival.landed.bodyId === bodyId) {
        rival.landed.angle += angleStep;
      }
    }
  }

  function activeBridgeById(id) {
    const cleanId = Math.max(1, Math.floor(finiteOr(id, 0)));
    for (const structure of structures) {
      if (structure.id === cleanId && isActiveBridge(structure)) {
        return structure;
      }
    }
    return null;
  }

  function bridgeGeometry(structure) {
    if (!structure) {
      return null;
    }

    const x1 = finiteOr(structure.x, 0);
    const y1 = finiteOr(structure.y, 0);
    const x2 = finiteOr(structure.x2, x1);
    const y2 = finiteOr(structure.y2, y1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < bridgeMinAnchorLength) {
      return null;
    }

    const ux = dx / length;
    const uy = dy / length;
    return {
      x1,
      y1,
      x2,
      y2,
      dx,
      dy,
      length,
      ux,
      uy,
      nx: -uy,
      ny: ux
    };
  }

  function bridgeCurveLengthForGeometry(geometry) {
    if (!geometry) {
      return 0;
    }

    return Math.min(
      geometry.length * 0.46,
      clamp(geometry.length * 0.18, bridgeMinCurveLength, bridgeMaxCurveLength)
    );
  }

  function cubicBezierPoint(p0, p1, p2, p3, t) {
    const s = clamp(t, 0, 1);
    const inv = 1 - s;
    const inv2 = inv * inv;
    const s2 = s * s;
    return {
      x: p0.x * inv2 * inv + p1.x * 3 * inv2 * s + p2.x * 3 * inv * s2 + p3.x * s2 * s,
      y: p0.y * inv2 * inv + p1.y * 3 * inv2 * s + p2.y * 3 * inv * s2 + p3.y * s2 * s
    };
  }

  function cubicBezierDerivative(p0, p1, p2, p3, t) {
    const s = clamp(t, 0, 1);
    const inv = 1 - s;
    return {
      x: 3 * inv * inv * (p1.x - p0.x) + 6 * inv * s * (p2.x - p1.x) + 3 * s * s * (p3.x - p2.x),
      y: 3 * inv * inv * (p1.y - p0.y) + 6 * inv * s * (p2.y - p1.y) + 3 * s * s * (p3.y - p2.y)
    };
  }

  function bridgeBodySurfacePoint(body, angle) {
    const distanceFromCenter = body.radius + surfaceExtensionAtAngle(body, angle) + playerFootOffset;
    return {
      x: body.x + Math.cos(angle) * distanceFromCenter,
      y: body.y + Math.sin(angle) * distanceFromCenter
    };
  }

  function bridgeEndpointCurve(structure, bodyId, side) {
    const geometry = bridgeGeometry(structure);
    const body = bodyById(bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }

    const join = bridgeEndpointJoin(structure, bodyId, side);
    if (!join) {
      return null;
    }

    const cleanSide = join.side;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = bridgeHalfWidth + playerFootOffset;
    const curveLength = bridgeCurveLengthForGeometry(geometry);
    if (curveLength <= 0) {
      return null;
    }

    const bodyPoint = bridgeBodySurfacePoint(body, join.angle);
    const straightT = join.atStart ? curveLength : geometry.length - curveLength;
    const straightPoint = {
      x: geometry.x1 + geometry.ux * straightT + normalX * offset,
      y: geometry.y1 + geometry.uy * straightT + normalY * offset
    };
    const bodyTangent = {
      x: -Math.sin(join.angle),
      y: Math.cos(join.angle)
    };
    const startBodyDirection = join.entryWalkDirection;
    const endBodyDirection = -join.entryWalkDirection;
    const handle = curveLength * 0.42;
    const bodyNormalAngle = join.angle;
    const bridgeNormalAngle = Math.atan2(normalY, normalX);

    if (join.atStart) {
      const p0 = bodyPoint;
      const p3 = straightPoint;
      const d0 = {
        x: bodyTangent.x * startBodyDirection,
        y: bodyTangent.y * startBodyDirection
      };
      const d1 = { x: geometry.ux, y: geometry.uy };
      return {
        p0,
        p1: { x: p0.x + d0.x * handle, y: p0.y + d0.y * handle },
        p2: { x: p3.x - d1.x * handle, y: p3.y - d1.y * handle },
        p3,
        curveLength,
        normalStartAngle: bodyNormalAngle,
        normalEndAngle: bridgeNormalAngle,
        geometry,
        join
      };
    }

    const p0 = straightPoint;
    const p3 = bodyPoint;
    const d0 = { x: geometry.ux, y: geometry.uy };
    const d1 = {
      x: bodyTangent.x * endBodyDirection,
      y: bodyTangent.y * endBodyDirection
    };
    return {
      p0,
      p1: { x: p0.x + d0.x * handle, y: p0.y + d0.y * handle },
      p2: { x: p3.x - d1.x * handle, y: p3.y - d1.y * handle },
      p3,
      curveLength,
      normalStartAngle: bridgeNormalAngle,
      normalEndAngle: bodyNormalAngle,
      geometry,
      join
    };
  }

  function bridgeCurveSurfacePose(curve, progress, walkSpeed, baseVx, baseVy) {
    if (!curve) {
      return null;
    }

    const s = clamp(progress, 0, 1);
    const point = cubicBezierPoint(curve.p0, curve.p1, curve.p2, curve.p3, s);
    const derivative = cubicBezierDerivative(curve.p0, curve.p1, curve.p2, curve.p3, s);
    const tangent = normalize(derivative.x, derivative.y);
    const normalBlend = s * s * (3 - 2 * s);
    const normalAngle = curve.normalStartAngle + shortestAngleDelta(curve.normalStartAngle, curve.normalEndAngle) * normalBlend;

    return {
      x: point.x,
      y: point.y,
      vx: baseVx + tangent.x * walkSpeed,
      vy: baseVy + tangent.y * walkSpeed,
      angle: normalAngle
    };
  }

  function bridgeSurfacePose(structure, t, side, walkSpeedOverride) {
    const geometry = bridgeGeometry(structure);
    if (!geometry) {
      return null;
    }

    const clampedT = clamp(finiteOr(t, 0), 0, geometry.length);
    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = bridgeHalfWidth + playerFootOffset;
    const walkSpeed = Number.isFinite(Number(walkSpeedOverride))
      ? finiteOr(walkSpeedOverride, 0)
      : (player.landed ? finiteOr(player.landed.walkSpeed, 0) : 0);
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    const blend = geometry.length > 0 ? clampedT / geometry.length : 0;
    const baseVx = firstBody && secondBody
      ? finiteOr(firstBody.vx, 0) * (1 - blend) + finiteOr(secondBody.vx, 0) * blend
      : 0;
    const baseVy = firstBody && secondBody
      ? finiteOr(firstBody.vy, 0) * (1 - blend) + finiteOr(secondBody.vy, 0) * blend
      : 0;
    const curveLength = bridgeCurveLengthForGeometry(geometry);

    if (curveLength > 0 && clampedT < curveLength) {
      const startCurve = bridgeEndpointCurve(structure, structure.bodyId, cleanSide);
      const curvePose = bridgeCurveSurfacePose(startCurve, clampedT / curveLength, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return {
          ...curvePose,
          t: clampedT,
          side: cleanSide,
          geometry
        };
      }
    }

    if (curveLength > 0 && clampedT > geometry.length - curveLength) {
      const endCurve = bridgeEndpointCurve(structure, structure.linkedBodyId, cleanSide);
      const denominator = Math.max(1, curveLength);
      const curvePose = bridgeCurveSurfacePose(endCurve, (clampedT - (geometry.length - curveLength)) / denominator, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return {
          ...curvePose,
          t: clampedT,
          side: cleanSide,
          geometry
        };
      }
    }

    return {
      x: geometry.x1 + geometry.ux * clampedT + normalX * offset,
      y: geometry.y1 + geometry.uy * clampedT + normalY * offset,
      vx: baseVx + geometry.ux * walkSpeed,
      vy: baseVy + geometry.uy * walkSpeed,
      angle: Math.atan2(normalY, normalX),
      t: clampedT,
      side: cleanSide,
      geometry
    };
  }

  function bridgeSurfaceSideForPoint(structure, x, y, fallbackSide) {
    const geometry = bridgeGeometry(structure);
    if (!geometry) {
      return finiteOr(fallbackSide, 1) < 0 ? -1 : 1;
    }

    const relX = finiteOr(x, geometry.x1) - geometry.x1;
    const relY = finiteOr(y, geometry.y1) - geometry.y1;
    const t = clamp(relX * geometry.ux + relY * geometry.uy, 0, geometry.length);
    const centerX = geometry.x1 + geometry.ux * t;
    const centerY = geometry.y1 + geometry.uy * t;
    const sideScore = (finiteOr(x, centerX) - centerX) * geometry.nx + (finiteOr(y, centerY) - centerY) * geometry.ny;
    if (Math.abs(sideScore) < 0.001) {
      return finiteOr(fallbackSide, 1) < 0 ? -1 : 1;
    }
    return sideScore < 0 ? -1 : 1;
  }

  function bridgeEndpointJoin(structure, bodyId, side) {
    if (!isActiveBridge(structure)) {
      return null;
    }

    const geometry = bridgeGeometry(structure);
    const body = bodyById(bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }

    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const atStart = structure.bodyId === bodyId;
    const atEnd = structure.linkedBodyId === bodyId;
    if (!atStart && !atEnd) {
      return null;
    }

    const endpointX = atStart ? geometry.x1 : geometry.x2;
    const endpointY = atStart ? geometry.y1 : geometry.y2;
    const playerBridgeOffset = bridgeHalfWidth + playerFootOffset;
    const joinX = endpointX + geometry.nx * cleanSide * playerBridgeOffset;
    const joinY = endpointY + geometry.ny * cleanSide * playerBridgeOffset;
    const angle = Math.atan2(joinY - body.y, joinX - body.x);
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    const bridgeDirX = atStart ? geometry.ux : -geometry.ux;
    const bridgeDirY = atStart ? geometry.uy : -geometry.uy;
    const entryWalkDirection = tangentX * bridgeDirX + tangentY * bridgeDirY >= 0 ? 1 : -1;
    const desiredPathSign = atStart ? 1 : -1;

    return {
      t: atStart ? 0 : geometry.length,
      angle,
      bodyId,
      otherBodyId: atStart ? structure.linkedBodyId : structure.bodyId,
      side: cleanSide,
      atStart,
      geometry,
      entryWalkDirection,
      inputSign: desiredPathSign * entryWalkDirection
    };
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
      maybeNotifyText(isLinkedStructureType(recipe.structureType)
        ? recipe.name + "s need boulder-sized or larger bodies."
        : "Structures need a dwarf moon, moon, planet, or plate surface.");
      return false;
    }

    if (isLinkedStructureType(recipe.structureType)) {
      if (!pendingTetherAnchor) {
        pendingTetherAnchor = placement;
        maybeNotifyText("Choose another body for the other end of the " + recipe.name.toLowerCase() + ".");
        playSound("select");
        return true;
      }

      const firstPlacement = refreshPlacementAnchor(pendingTetherAnchor);
      if (!firstPlacement || !firstPlacement.valid) {
        pendingTetherAnchor = null;
        maybeNotifyText("The first " + recipe.name.toLowerCase() + " anchor is no longer available.");
        return false;
      }

      if (placement.bodyId === firstPlacement.bodyId) {
        maybeNotifyText("The " + recipe.name.toLowerCase() + " needs two different bodies.");
        return false;
      }

      if (isMultiplayerV2Active()) {
        if (!sendMultiplayerV2BuildAction({
          action: "placeStructure",
          recipeId: recipe.id,
          placement: {
            bodyId: firstPlacement.bodyId,
            angle: firstPlacement.angle
          },
          linkedPlacement: {
            bodyId: placement.bodyId,
            angle: placement.angle
          }
        })) {
          maybeNotifyText("Reconnect before placing " + recipe.name.toLowerCase() + ".");
          return false;
        }
        pendingTetherAnchor = null;
        activePlacementRecipeId = null;
        playSound("place");
        maybeNotifyText(recipe.name + " placed.");
        return true;
      }

      spendRecipeCost(recipe);
      structures.push(createStructure(recipe, firstPlacement, placement));
      pendingTetherAnchor = null;
    } else {
      if (isMultiplayerV2Active()) {
        if (!sendMultiplayerV2BuildAction({
          action: "placeStructure",
          recipeId: recipe.id,
          placement: {
            bodyId: placement.bodyId,
            angle: placement.angle
          }
        })) {
          maybeNotifyText("Reconnect before placing " + recipe.name.toLowerCase() + ".");
          return false;
        }
        activePlacementRecipeId = null;
        playSound("place");
        maybeNotifyText(recipe.name + " placed.");
        return true;
      }

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
    if (!rival.landed && gameSettings.hudEnabled !== false) {
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

  function findBridgeTransferFromBody(bodyId, angle, walkDirection) {
    if (!bodyId || !walkDirection) {
      return null;
    }

    let best = null;
    let bestDelta = Infinity;
    for (const structure of structures) {
      for (const side of [-1, 1]) {
        const endpoint = bridgeEndpointJoin(structure, bodyId, side);
        if (!endpoint || endpoint.entryWalkDirection !== Math.sign(walkDirection)) {
          continue;
        }

        const delta = Math.abs(shortestAngleDelta(angle, endpoint.angle));
        if (delta > bridgeWalkTransferAngle || delta >= bestDelta) {
          continue;
        }

        best = { structure, endpoint, inputSign: endpoint.inputSign };
        bestDelta = delta;
      }
    }

    return best;
  }

  function transferPlayerToBridge(transfer, walkDirection, walkSpeed) {
    if (!transfer || !transfer.structure || !transfer.endpoint) {
      return false;
    }

    player.landed = {
      bodyId: transfer.endpoint.bodyId,
      bridgeId: transfer.structure.id,
      bridgeT: transfer.endpoint.t,
      bridgeSide: transfer.endpoint.side,
      bridgeInputSign: transfer.inputSign,
      angle: transfer.endpoint.angle,
      walkSpeed: finiteOr(walkSpeed, 0) * Math.sign(walkDirection || 1),
      walkCycle: player.walkCycle || 0
    };
    applyLandedSurfaceConstraint();
    return true;
  }

  function transferPlayerFromBridgeToBody(structure, bodyId, side, pathSpeed) {
    const join = bridgeEndpointJoin(structure, bodyId, side);
    const body = bodyById(bodyId);
    if (!join || !body || !isLandableBody(body)) {
      return false;
    }

    const bridgeMotionSign = Math.sign(finiteOr(pathSpeed, 0) || (join.atStart ? -1 : 1));
    const incomingDirX = join.geometry.ux * bridgeMotionSign;
    const incomingDirY = join.geometry.uy * bridgeMotionSign;
    const tangentX = -Math.sin(join.angle);
    const tangentY = Math.cos(join.angle);
    const bodyWalkDirection = tangentX * incomingDirX + tangentY * incomingDirY >= 0 ? 1 : -1;
    const continuationAngle = join.angle + bodyWalkDirection * (bridgeWalkTransferAngle + bridgeWalkExitAnglePadding);
    player.landed = {
      bodyId: body.id,
      angle: continuationAngle,
      walkSpeed: Math.abs(finiteOr(pathSpeed, 0)) * bodyWalkDirection,
      walkCycle: player.walkCycle || 0
    };
    applyLandedSurfaceConstraint();
    return true;
  }

  function detachFromBody(jumpStrength) {
    if (!player.landed) {
      return;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const bridge = player.landed.bridgeId ? activeBridgeById(player.landed.bridgeId) : null;
    const pose = bridge ? bridgeSurfacePose(bridge, player.landed.bridgeT, player.landed.bridgeSide) : null;
    const body = bodyById(player.landed.bodyId);
    const baseVx = pose ? pose.vx : (body ? body.vx : player.vx);
    const baseVy = pose ? pose.vy : (body ? body.vy : player.vy);
    player.vx = baseVx + normal.x * jumpStrength;
    player.vy = baseVy + normal.y * jumpStrength;

    player.landed = null;
    jumpQueued = false;
    playSound("detach");
  }

  function applyLandedSurfaceConstraint() {
    if (!player.landed) {
      return false;
    }

    if (player.landed.bridgeId) {
      const bridge = activeBridgeById(player.landed.bridgeId);
      const pose = bridge ? bridgeSurfacePose(bridge, player.landed.bridgeT, player.landed.bridgeSide) : null;
      if (!pose) {
        detachFromBody(130);
        return false;
      }

      player.landed.bridgeT = pose.t;
      player.landed.bridgeSide = pose.side;
      player.landed.angle = pose.angle;
      player.x = pose.x;
      player.y = pose.y;
      player.vx = pose.vx;
      player.vy = pose.vy;
      return true;
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

  function updateBridgeLandedPlayer(dt) {
    const bridge = activeBridgeById(player.landed.bridgeId);
    const geometry = bridge ? bridgeGeometry(bridge) : null;
    if (!bridge || !geometry) {
      detachFromBody(120);
      return;
    }

    if (jumpQueued) {
      jumpQueued = false;
      detachFromBody(380);
      return;
    }

    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const walkSpeed = (isMovementKeyPressed("down") ? 68 : 128) * weaponSlowFactor;
    const vacuumHoldActive = isVacuumHoldActive();
    let walkDirection = 0;

    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("left")) {
      walkDirection -= 1;
    }
    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("right")) {
      walkDirection += 1;
    }
    if (gameSettings.touchScreen && touchJoystickState.active) {
      const world = cameraLocalToWorld(touchJoystickState.moveX, touchJoystickState.moveY);
      const projected = (world.x * geometry.ux + world.y * geometry.uy) * finiteOr(player.landed.bridgeInputSign, 1);
      if (Math.abs(projected) > touchMoveAxisThreshold) {
        walkDirection += Math.sign(projected);
      }
    }
    walkDirection = clamp(walkDirection, -1, 1);

    const inputSign = finiteOr(player.landed.bridgeInputSign, 1) < 0 ? -1 : 1;
    const pathSpeed = walkDirection * inputSign * walkSpeed;
    player.landed.walkSpeed = pathSpeed;
    if (walkDirection) {
      player.walkCycle += (2.3 + Math.abs(pathSpeed) * 0.052) * dt;
    }
    player.landed.walkCycle = player.walkCycle;
    player.landed.bridgeT += pathSpeed * dt;

    const startJoin = bridgeEndpointJoin(bridge, bridge.bodyId, player.landed.bridgeSide);
    const endJoin = bridgeEndpointJoin(bridge, bridge.linkedBodyId, player.landed.bridgeSide);
    const startExitT = startJoin ? startJoin.t : 0;
    const endExitT = endJoin ? endJoin.t : geometry.length;

    if (pathSpeed < 0 && player.landed.bridgeT <= startExitT) {
      transferPlayerFromBridgeToBody(bridge, bridge.bodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    if (pathSpeed > 0 && player.landed.bridgeT >= endExitT) {
      transferPlayerFromBridgeToBody(bridge, bridge.linkedBodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    player.landed.bridgeT = clamp(player.landed.bridgeT, startExitT, endExitT);

    applyLandedSurfaceConstraint();
    cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
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
    if (player.landed.bridgeId) {
      updateBridgeLandedPlayer(dt);
      return;
    }

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
    let walkDirection = touchLandedWalkDirection(body);

    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("left")) {
      walkDirection -= 1;
    }
    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("right")) {
      walkDirection += 1;
    }
    walkDirection = clamp(walkDirection, -1, 1);

    player.landed.walkSpeed = walkDirection * walkSpeed;
    if (walkDirection) {
      player.walkCycle += (2.3 + Math.abs(player.landed.walkSpeed) * 0.052) * dt;
      player.landed.walkCycle = player.walkCycle;
    } else {
      player.landed.walkCycle = player.walkCycle;
    }
    const previousAngle = player.landed.angle;
    player.landed.angle += (player.landed.walkSpeed / surfaceCircumferenceRadius) * dt;
    const bridgeTransfer = findBridgeTransferFromBody(body.id, player.landed.angle, walkDirection);
    if (bridgeTransfer && Math.abs(shortestAngleDelta(previousAngle, bridgeTransfer.endpoint.angle)) >= Math.abs(shortestAngleDelta(player.landed.angle, bridgeTransfer.endpoint.angle))) {
      if (transferPlayerToBridge(bridgeTransfer, walkDirection, walkSpeed)) {
        cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
        return;
      }
    }
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

    const direction = mouse.left ? 1 : -1;
    const strengthFactor = mouse.left ? currentGadgetSuckFactor() : currentGadgetBlowFactor();
    applyGadgetThrustToBody(body, getAim().world, direction, dt, strengthFactor);
  }

  function applyGadgetThrustToBody(body, aimWorld, direction, dt, strengthFactor = 1) {
    if (!body || !isLandableBody(body)) {
      return false;
    }

    const upgradeFactor = Math.max(0.1, finiteOr(strengthFactor, 1));
    const massDamping = clamp(1 / Math.pow(Math.max(1, body.mass / 100), 0.38), 0.18, 1);
    const thrust = 155 * massDamping * upgradeFactor;
    const speedFactor = clamp(Math.sqrt(upgradeFactor), 0.6, 1.75);
    const baseMaxSpeed = (220 * massDamping + 60) * speedFactor;
    const aim = aimWorld || { x: 1, y: 0 };
    const previousVx = finiteOr(body.vx, 0);
    const previousVy = finiteOr(body.vy, 0);
    const previousSpeed = Math.hypot(previousVx, previousVy);
    const accelerationX = aim.x * direction * thrust * dt;
    const accelerationY = aim.y * direction * thrust * dt;
    const progradeGain = previousSpeed > 0
      ? Math.max(0, (previousVx * accelerationX + previousVy * accelerationY) / previousSpeed)
      : 0;
    const maxSpeed = Math.max(baseMaxSpeed, previousSpeed + progradeGain);

    body.vx = previousVx + accelerationX;
    body.vy = previousVy + accelerationY;

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }
    return true;
  }

  function updatePartyLandedGadgetThrusts(dt) {
    for (const state of activePartyGadgetStates()) {
      if (!state.landedBodyId || (!state.left && !state.right)) {
        continue;
      }

      const body = bodyById(state.landedBodyId);
      const direction = state.left ? 1 : -1;
      const strengthFactor = state.left ? state.suckFactor : state.blowFactor;
      applyGadgetThrustToBody(body, state.aimWorld, direction, dt, strengthFactor);
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

  function updatePlayerEnergySystems(dt) {
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
    if (!isContinuousPlayerEnergyInputPressed()) {
      playerContinuousEnergyLocked = false;
    }

    if (areToolsDisabled() || buildMenuOpen) {
      return;
    }

    if (touchControlState.active) {
      if (touchControlState.toolsSuppressed && canUseContinuousPlayerEnergy(suctionEnergyDrain, dt)) {
        touchControlState.toolsSuppressed = false;
      }
      refreshTouchFireButtons();
    }

    if (isSuctionEquipped() && isGadgetButtonPressed()) {
      if (!drainContinuousPlayerEnergy(suctionEnergyDrain, dt)) {
        suppressTouchToolsUntilEnergyReturns();
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
      let boosting = false;
      if (!suctionActive && isJetpackBoostPressed()) {
        boosting = drainContinuousPlayerEnergy(jetpackBoostEnergyDrain, dt);
        if (!boosting) {
          notifyEnergyDepleted();
        }
      }
      const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
      const thrust = 640 * (suctionActive ? 0.56 : 1) * (boosting ? jetpackBoostThrustMultiplier : 1) * weaponSlowFactor;
      player.vx += world.x * thrust * dt;
      player.vy += world.y * thrust * dt;
    }

    const speed = length(player.vx, player.vy);
    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const boostSpeed = isJetpackBoostPressed() && canUseContinuousPlayerEnergy(jetpackBoostEnergyDrain, dt) ? jetpackBoostSpeedMultiplier : 1;
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
    return applyActorGadgetForces(target, {
      actor: player,
      aimWorld: aim.world,
      funnel,
      left: canUseSuctionControls() && mouse.left,
      middle: canUseSuctionControls() && mouse.middle,
      right: canUseSuctionControls() && mouse.right,
      suckFactor: currentGadgetSuckFactor(),
      blowFactor: currentGadgetBlowFactor()
    }, dt, options);
  }

  function localGadgetStateForFrame(aim, funnel) {
    const enabled = canUseSuctionControls();
    return {
      playerId: player.id || "",
      actor: player,
      aimWorld: aim.world,
      funnel,
      left: enabled && mouse.left,
      middle: enabled && mouse.middle,
      right: enabled && mouse.right,
      suckFactor: currentGadgetSuckFactor(),
      blowFactor: currentGadgetBlowFactor(),
      bucketActive: enabled,
      bucketPadding: 0,
      landedBodyId: player.landed ? player.landed.bodyId : null,
      active: enabled && (mouse.left || mouse.middle || mouse.right)
    };
  }

  function isPartyGadgetActiveMode(mode) {
    return mode === "pull" || mode === "push" || mode === "hold";
  }

  function normalizePartyGadgetMode(mode) {
    if (mode !== "pull" && mode !== "push" && mode !== "hold" && mode !== "idle") {
      return "idle";
    }
    return mode;
  }

  function multiplayerEnergyCheckDt(dt) {
    return clamp(Number.isFinite(Number(dt)) ? finiteOr(dt, 1 / 60) : 1 / 60, 0.001, 0.05);
  }

  function multiplayerContinuousEnergyCost(rate, dt) {
    return Math.max(0, finiteOr(rate, 0)) * multiplayerEnergyCheckDt(dt);
  }

  function multiplayerContinuousEnergyActivationCost(rate, dt) {
    return Math.max(playerContinuousEnergyActivationCost, multiplayerContinuousEnergyCost(rate, dt));
  }

  function multiplayerToolModeEnergyCost(equippedTool, mode, dt) {
    if (!mode || mode === "idle") {
      return 0;
    }
    if (equippedTool === defaultToolId && isPartyGadgetActiveMode(mode)) {
      return multiplayerContinuousEnergyActivationCost(suctionEnergyDrain, dt);
    }
    if (mode === "fire") {
      const weapon = weaponByToolId(equippedTool);
      return weapon ? Math.max(0, finiteOr(weapon.energyCost, playerWeaponDefaults.energyCost)) : Infinity;
    }
    return Infinity;
  }

  function actorCanAffordMultiplayerToolMode(actor, equippedTool, mode, dt) {
    const cost = multiplayerToolModeEnergyCost(equippedTool, mode, dt);
    if (actor === player && playerContinuousEnergyLocked && equippedTool === defaultToolId && isPartyGadgetActiveMode(mode)) {
      return false;
    }
    return finiteOr(actor && actor.energy, 0) >= cost;
  }

  function multiplayerLocalToolModeForInput(dt) {
    if (areToolsDisabled()) {
      return "idle";
    }
    if (isWeaponTool(equippedToolId)) {
      return mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt) ? "fire" : "idle";
    }
    if (!isSuctionEquipped() || !actorCanAffordMultiplayerToolMode(player, defaultToolId, "pull", dt)) {
      if (isSuctionEquipped() && isGadgetButtonPressed()) {
        playerContinuousEnergyLocked = true;
      }
      return "idle";
    }
    return mouse.middle ? "hold" : mouse.left ? "pull" : mouse.right ? "push" : "idle";
  }

  function canSendMultiplayerBoostInput(dt) {
    if (!isJetpackBoostPressed()) {
      return false;
    }
    if (playerContinuousEnergyLocked || player.energy < multiplayerContinuousEnergyActivationCost(jetpackBoostEnergyDrain, dt)) {
      playerContinuousEnergyLocked = true;
      return false;
    }
    return true;
  }

  function actorFromPartyPlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }
    return {
      id: typeof snapshot.id === "string" ? snapshot.id : player.id,
      name: typeof snapshot.name === "string" ? snapshot.name : player.name,
      x: finiteOr(snapshot.x, player.x),
      y: finiteOr(snapshot.y, player.y),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, player.radius),
      energy: finiteOr(snapshot.energy, player.energy),
      maxEnergy: finiteOr(snapshot.maxEnergy, player.maxEnergy),
      equippedTool: typeof snapshot.equippedTool === "string" ? snapshot.equippedTool : equippedToolId,
      toolMode: normalizePartyGadgetMode(snapshot.toolMode),
      landed: normalizeLandingSnapshot(snapshot.landed),
      aimAngle: finiteOr(snapshot.aimAngle, 0)
    };
  }

  function partyGadgetActorFromIntent(actor, gadget, receivedAt, options) {
    const source = actor ? {
      ...actor,
      landed: actor.landed ? { ...actor.landed } : null
    } : null;
    if (!source) {
      return null;
    }

    if (gadget && typeof gadget === "object") {
      source.x = finiteOr(gadget.x, source.x);
      source.y = finiteOr(gadget.y, source.y);
      source.vx = finiteOr(gadget.vx, source.vx);
      source.vy = finiteOr(gadget.vy, source.vy);
    }

    const now = performance.now();
    const lead = clamp(
      (now - finiteOr(receivedAt, now)) / 1000 + finiteOr(options && options.lead, 0),
      0,
      finiteOr(options && options.maxLead, 0)
    );

    source.x += finiteOr(source.vx, 0) * lead;
    source.y += finiteOr(source.vy, 0) * lead;
    return source;
  }

  function partyGadgetStateFromActor(actor, gadget, receivedAt, options) {
    if (!actor || actor.equippedTool !== defaultToolId) {
      return null;
    }

    const intent = gadget && typeof gadget === "object" ? gadget : null;
    const mode = normalizePartyGadgetMode(intent && intent.mode ? intent.mode : actor.toolMode);
    const active = isPartyGadgetActiveMode(mode) &&
      actorCanAffordMultiplayerToolMode(actor, defaultToolId, mode, options && options.dt) &&
      (!intent || intent.active !== false);
    const aimAngle = finiteOr(intent && intent.aimAngle, actor.aimAngle);
    const aimWorld = normalize(Math.cos(aimAngle), Math.sin(aimAngle));
    const gadgetActor = partyGadgetActorFromIntent(actor, intent, receivedAt, {
      lead: options && Number.isFinite(Number(options.lead)) ? options.lead : 0,
      maxLead: options && Number.isFinite(Number(options.maxLead)) ? options.maxLead : 0
    });
    return {
      playerId: actor.id || "",
      seq: Math.max(0, Math.floor(finiteOr(intent && intent.seq, 0))),
      sentAt: finiteOr(intent && intent.sentAt, 0),
      receivedAt: finiteOr(receivedAt, performance.now()),
      actor: gadgetActor,
      aimWorld,
      funnel: actorFunnel(gadgetActor, aimWorld),
      left: active && mode === "pull",
      middle: active && mode === "hold",
      right: active && mode === "push",
      suckFactor: finiteOr(options && options.suckFactor, 1),
      blowFactor: finiteOr(options && options.blowFactor, 1),
      bucketActive: true,
      bucketPadding: finiteOr(options && options.bucketPadding, 0),
      landedBodyId: actor.landed ? actor.landed.bodyId : null,
      mode,
      active
    };
  }

  function localPartyGadgetState(playerSnapshot) {
    return partyGadgetStateFromActor(actorFromPartyPlayerSnapshot(playerSnapshot), null, performance.now(), {
      suckFactor: currentGadgetSuckFactor(),
      blowFactor: currentGadgetBlowFactor(),
      bucketPadding: 0,
      lead: 0,
      maxLead: 0
    });
  }

  function partyGadgetBucketContact(state, target, extraPadding) {
    if (!state || !state.actor || !target) {
      return false;
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const normal = { x: -aimWorld.y, y: aimWorld.x };
    const relX = target.x - actor.x;
    const relY = target.y - actor.y;
    const localX = relX * aimWorld.x + relY * aimWorld.y;
    const localY = relX * normal.x + relY * normal.y;
    const requestedBucketPadding = Math.max(0, finiteOr(state.bucketPadding, 0)) + Math.max(0, finiteOr(extraPadding, 0));
    const bucketPadding = requestedBucketPadding > 0
      ? clamp(target.radius * 0.35, 5, requestedBucketPadding)
      : 0;
    const radius = target.radius + bucketPadding;
    const wallRadius = radius + funnelShape.wallThickness;
    const backX = funnelShape.backX;
    const backHalf = funnelShape.backHalf;
    const rimX = funnelShape.rimX;
    const rimHalf = funnelShape.rimHalf;

    if (distanceToSegment(localX, localY, backX, -backHalf, rimX, -rimHalf) < wallRadius) {
      return true;
    }
    if (distanceToSegment(localX, localY, backX, backHalf, rimX, rimHalf) < wallRadius) {
      return true;
    }
    if (distanceToSegment(localX, localY, backX, -backHalf, backX, backHalf) < wallRadius) {
      return true;
    }
    if (
      localX < backX + radius &&
      localX > backX - radius * 1.35 &&
      Math.abs(localY) < backHalf + radius * 0.8
    ) {
      return true;
    }

    const cupHalf = funnelHalfAt(localX);
    return (
      localX > backX - radius * 0.35 &&
      localX < rimX + radius * 0.55 &&
      Math.abs(localY) < cupHalf + radius * 0.25
    );
  }

  function partyGadgetParticleProbe(state, target, options) {
    if (!state || !state.actor || !target) {
      return { force: false, bucket: false, score: Infinity };
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aimWorld.x + toTargetY * aimWorld.y;
    const sideX = toTargetX - aimWorld.x * forward;
    const sideY = toTargetY - aimWorld.y * forward;
    const side = length(sideX, sideY);
    const padding = Math.max(0, finiteOr(options && options.padding, 0));
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const pullHoldRange = (state.left || state.middle) &&
      forward > -80 - padding * 0.25 &&
      forward < gadgetForceReach + target.radius + padding &&
      side < coneWidth + target.radius + padding * 0.35;
    const pushRange = state.right &&
      forward > -28 - padding * 0.2 &&
      forward < 470 + target.radius + padding &&
      side < coneWidth * 0.9 + target.radius + padding * 0.35;
    const bucket = partyGadgetBucketContact(state, target, padding);
    const funnel = state.funnel || actorFunnel(actor, aimWorld);
    const mouthDistance = Math.hypot(funnel.x - target.x, funnel.y - target.y);

    return {
      force: Boolean(pullHoldRange || pushRange),
      bucket,
      score: Math.min(Math.abs(forward - funnelShape.captureX) + side * 1.4, mouthDistance)
    };
  }

  function applyActorGadgetForces(target, state, dt, options = {}) {
    if (!state || !state.actor || !target) {
      return false;
    }
    const leftActive = state.left === true;
    const middleActive = state.middle === true;
    const rightActive = state.right === true;
    if (!leftActive && !middleActive && !rightActive) {
      return false;
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const funnel = state.funnel || actorFunnel(actor, aimWorld);
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aimWorld.x + toTargetY * aimWorld.y;
    const sideX = toTargetX - aimWorld.x * forward;
    const sideY = toTargetY - aimWorld.y * forward;
    const side = length(sideX, sideY);
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const inCone = forward > -70 && forward < gadgetForceReach && side < coneWidth;
    const toMouthX = funnel.x - target.x;
    const toMouthY = funnel.y - target.y;
    const mouthDist = length(toMouthX, toMouthY);
    const pushResponse = bodyPushResponse(target);
    const captureInFunnel = options.captureInFunnel !== false;
    const pullTowardActor = options.pullTowardActor === true;

    if (middleActive && inCone) {
      const holdX = actor.x + aimWorld.x * gadgetHoldReach;
      const holdY = actor.y + aimWorld.y * gadgetHoldReach;
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
      return true;
    }

    if (leftActive || rightActive) {
      target.gadgetStabilized = false;
    }

    if (leftActive && inCone) {
      const pullTargetX = pullTowardActor ? actor.x : funnel.x;
      const pullTargetY = pullTowardActor ? actor.y : funnel.y;
      const toPullTargetX = pullTargetX - target.x;
      const toPullTargetY = pullTargetY - target.y;
      const pullDistance = length(toPullTargetX, toPullTargetY);
      const pull = normalize(toPullTargetX, toPullTargetY);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const distanceStrength = clamp(1 - pullDistance / 620, pullTowardActor ? 0.28 : 0.16, 1);
      const baseForce = pullTowardActor ? 1660 : 1180;
      const force = baseForce * finiteOr(state.suckFactor, 1) * coneStrength * distanceStrength * pushResponse;
      target.vx += pull.x * force * dt;
      target.vy += pull.y * force * dt;

      if (!pullTowardActor && captureInFunnel && mouthDist < funnel.radius + target.radius * 2.2) {
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
      const force = 1450 * finiteOr(state.blowFactor, 1) * blastFalloff * pushResponse;
      target.vx += (aimWorld.x * force + sidePush.x * 120 * pushResponse) * dt;
      target.vy += (aimWorld.y * force + sidePush.y * 120 * pushResponse) * dt;
    }

    return leftActive || rightActive;
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
    return resolveActorFunnelBucket(target, {
      actor: player,
      aimWorld: aim.world,
      left: canUseSuctionControls() && mouse.left,
      right: canUseSuctionControls() && mouse.right
    }, dt);
  }

  function resolveActorFunnelBucket(target, state, dt) {
    if (!state || !state.actor || !target) {
      return false;
    }
    const leftActive = state.left === true;
    const rightActive = state.right === true;
    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const normal = { x: -aimWorld.y, y: aimWorld.x };
    const relX = target.x - actor.x;
    const relY = target.y - actor.y;
    const velocityX = target.vx - finiteOr(actor.vx, 0);
    const velocityY = target.vy - finiteOr(actor.vy, 0);
    const originalState = {
      x: relX * aimWorld.x + relY * aimWorld.y,
      y: relX * normal.x + relY * normal.y,
      vx: velocityX * aimWorld.x + velocityY * aimWorld.y,
      vy: velocityX * normal.x + velocityY * normal.y
    };
    const bucketState = {
      ...originalState
    };
    const pushResponse = bodyPushResponse(target);

    let touchedBucket = false;
    const backX = funnelShape.backX;
    const backHalf = funnelShape.backHalf;
    const rimX = funnelShape.rimX;
    const rimHalf = funnelShape.rimHalf;
    const requestedBucketPadding = Math.max(0, finiteOr(state.bucketPadding, 0));
    const bucketPadding = requestedBucketPadding > 0
      ? clamp(target.radius * 0.35, 5, requestedBucketPadding)
      : 0;
    const radius = target.radius + bucketPadding;

    touchedBucket = collideFunnelSegment(bucketState, backX, -backHalf, rimX, -rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, backX, backHalf, rimX, rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, backX, -backHalf, backX, backHalf, radius) || touchedBucket;

    if (bucketState.x >= backX && bucketState.x <= rimX) {
      const half = funnelHalfAt(bucketState.x);
      const availableHalf = Math.max(7, half - radius * 0.42);
      if (Math.abs(bucketState.y) > availableHalf && Math.abs(bucketState.y) < half) {
        const side = Math.sign(bucketState.y) || 1;
        bucketState.y = side * availableHalf;
        if (bucketState.vy * side > 0) {
          bucketState.vy *= -0.22;
        }
        touchedBucket = true;
      }
    }

    if (
      bucketState.x < backX + radius &&
      bucketState.x > backX - radius * 1.35 &&
      Math.abs(bucketState.y) < backHalf + radius * 0.8 &&
      (bucketState.x >= backX || bucketState.vx < 0)
    ) {
      bucketState.x = backX + radius;
      if (bucketState.vx < 0) {
        bucketState.vx *= -0.24;
      }
      touchedBucket = true;
    }

    const cupHalf = funnelHalfAt(bucketState.x);
    const insideCup =
      bucketState.x > backX - radius * 0.35 &&
      bucketState.x < rimX + radius * 0.55 &&
      Math.abs(bucketState.y) < cupHalf + radius * 0.25;

    if (insideCup || touchedBucket) {
      const damping = Math.pow(rightActive ? 0.72 : 0.18, dt);
      bucketState.vx *= damping;
      bucketState.vy *= damping;

      if (!rightActive) {
        bucketState.vx += (funnelShape.captureX - bucketState.x) * 7.5 * dt;
        bucketState.vy += -bucketState.y * 8.5 * dt;
      }

      if (leftActive) {
        bucketState.vx += (funnelShape.captureX - bucketState.x) * 6.5 * dt;
        bucketState.vy += -bucketState.y * 6.5 * dt;
      }
    }

    const resolvedState = {
      x: originalState.x + (bucketState.x - originalState.x) * pushResponse,
      y: originalState.y + (bucketState.y - originalState.y) * pushResponse,
      vx: originalState.vx + (bucketState.vx - originalState.vx) * pushResponse,
      vy: originalState.vy + (bucketState.vy - originalState.vy) * pushResponse
    };

    target.x = actor.x + aimWorld.x * resolvedState.x + normal.x * resolvedState.y;
    target.y = actor.y + aimWorld.y * resolvedState.x + normal.y * resolvedState.y;
    target.vx = finiteOr(actor.vx, 0) + aimWorld.x * resolvedState.vx + normal.x * resolvedState.vy;
    target.vy = finiteOr(actor.vy, 0) + aimWorld.y * resolvedState.vx + normal.y * resolvedState.vy;
    return insideCup || touchedBucket;
  }

  function isValidParticleState(particle) {
    return Boolean(
      particle &&
      particle.tier &&
      Number.isFinite(particle.x) &&
      Number.isFinite(particle.y) &&
      Number.isFinite(particle.vx) &&
      Number.isFinite(particle.vy) &&
      Number.isFinite(particle.mass) &&
      Number.isFinite(particle.radius)
    );
  }

  function activePartyGadgetStates() {
    if (!isPartyHost() || !multiplayer.partyPlayerSnapshots.size) {
      return [];
    }

    const now = performance.now();
    const states = [];
    for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
      if (!entry || now - finiteOr(entry.receivedAt, 0) > 1100) {
        multiplayer.partyPlayerSnapshots.delete(playerId);
        continue;
      }

      const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
      const gadget = source.gadget && typeof source.gadget === "object" ? source.gadget : null;
      const remotePlayer = predictPartyRemotePlayer(
        normalizeRemotePlayerSnapshot(source.player || source),
        entry.receivedAt,
        gadget && gadget.active
          ? { lead: partyRemoteGadgetPredictionLead, maxLead: partyRemoteGadgetPredictionMax }
          : null
      );
      const state = partyGadgetStateForPlayer(remotePlayer, gadget, entry.receivedAt);
      if (state) {
        states.push(state);
      }
    }
    return states;
  }

  function predictPartyRemotePlayer(remotePlayer, receivedAt, options) {
    if (!remotePlayer) {
      return null;
    }

    const predicted = {
      ...remotePlayer,
      landed: remotePlayer.landed ? { ...remotePlayer.landed } : null
    };
    const now = performance.now();
    const lead = clamp(
      (now - finiteOr(receivedAt, now)) / 1000 + finiteOr(options && options.lead, partyRemotePredictionLead),
      0,
      finiteOr(options && options.maxLead, partyRemotePredictionMax)
    );

    if (predicted.landed) {
      if (predicted.landed.bridgeId) {
        const bridge = activeBridgeById(predicted.landed.bridgeId);
        const geometry = bridge ? bridgeGeometry(bridge) : null;
        if (bridge && geometry) {
          predicted.landed.bridgeT = clamp(
            finiteOr(predicted.landed.bridgeT, 0) + finiteOr(predicted.landed.walkSpeed, 0) * lead,
            0,
            geometry.length
          );
          const pose = bridgeSurfacePose(bridge, predicted.landed.bridgeT, predicted.landed.bridgeSide, predicted.landed.walkSpeed);
          if (pose) {
            predicted.landed.angle = pose.angle;
            predicted.x = pose.x;
            predicted.y = pose.y;
            predicted.vx = pose.vx;
            predicted.vy = pose.vy;
            return predicted;
          }
        }
      }

      const body = bodyById(predicted.landed.bodyId);
      if (body && isLandableBody(body)) {
        const surfaceRadius = Math.max(24, body.radius + surfaceExtensionAtAngle(body, predicted.landed.angle));
        predicted.landed.angle += (finiteOr(predicted.landed.walkSpeed, 0) / surfaceRadius) * lead;
        const normal = {
          x: Math.cos(predicted.landed.angle),
          y: Math.sin(predicted.landed.angle)
        };
        const tangent = { x: -normal.y, y: normal.x };
        const surfaceOffset = surfaceExtensionAtAngle(body, predicted.landed.angle);
        const distanceFromCenter = body.radius + surfaceOffset + playerFootOffset;
        const walkSpeed = finiteOr(predicted.landed.walkSpeed, 0);
        predicted.x = body.x + normal.x * distanceFromCenter;
        predicted.y = body.y + normal.y * distanceFromCenter;
        predicted.vx = finiteOr(body.vx, 0) + tangent.x * walkSpeed;
        predicted.vy = finiteOr(body.vy, 0) + tangent.y * walkSpeed;
        return predicted;
      }
    }

    predicted.x += finiteOr(predicted.vx, 0) * lead;
    predicted.y += finiteOr(predicted.vy, 0) * lead;
    return predicted;
  }

  function partyGadgetStateForPlayer(remotePlayer, gadget, receivedAt) {
    return partyGadgetStateFromActor(remotePlayer, gadget, receivedAt, {
      bucketPadding: 0,
      suckFactor: finiteOr(gadget && gadget.suckFactor, 1),
      blowFactor: finiteOr(gadget && gadget.blowFactor, 1),
      lead: gadget && gadget.active ? partyRemoteGadgetPredictionLead : 0,
      maxLead: gadget && gadget.active ? partyRemoteGadgetPredictionMax : 0
    });
  }

  function partyGadgetCanAffectParticle(state, particle) {
    return Boolean(
      state &&
      particle &&
      particle.id !== state.landedBodyId
    );
  }

  function gadgetStateMayReachTarget(state, target, padding) {
    if (!state || !state.actor || !target) {
      return false;
    }

    const reach = gadgetForceReach + Math.max(0, finiteOr(target.radius, 0)) + Math.max(0, finiteOr(padding, 0)) + 180;
    const dx = target.x - state.actor.x;
    const dy = target.y - state.actor.y;
    return dx * dx + dy * dy <= reach * reach;
  }

  function pruneExcessAmbientParticles(anchors, maxParticleBudget) {
    let ambientCount = countAmbientParticles();
    if (ambientCount <= maxParticleBudget) {
      return;
    }

    for (let remaining = ambientCount - maxParticleBudget; remaining > 0; remaining -= 1) {
      let removeIndex = -1;
      let removeScore = -Infinity;

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        if (!isAmbientDensityParticle(particle)) {
          continue;
        }

        const distance = nearestPartyAnchorDistance(particle.x, particle.y, anchors);
        const score = distance + Math.max(0, particle.mass - 1) * 8;
        if (score > removeScore) {
          removeScore = score;
          removeIndex = i;
        }
      }

      if (removeIndex < 0) {
        return;
      }
      particles.splice(removeIndex, 1);
      ambientCount -= 1;
    }
  }

  function farthestRecyclableAmbientParticle(anchors, keepRadius) {
    let best = null;
    let bestDistance = -Infinity;
    for (const particle of particles) {
      if (!particle || !particle.tier || particle.tier.name !== "particle" || finiteOr(particle.ufoSapTimer, 0) > 0) {
        continue;
      }
      const distance = nearestPartyAnchorDistance(particle.x, particle.y, anchors);
      if (distance <= keepRadius || distance <= bestDistance) {
        continue;
      }
      best = particle;
      bestDistance = distance;
    }
    return best;
  }

  function pruneInvalidParticles() {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (!isValidParticleState(particles[i])) {
        particles.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const landedBodyId = player.landed ? player.landed.bodyId : null;
    const localGadgetState = localGadgetStateForFrame(aim, funnel);
    const suctionActive = localGadgetState.active;
    const vacuumBucketActive = hasVacuumBucketCollider();
    const partyGadgetStates = activePartyGadgetStates();
    const partySpawnAnchors = activePartyPlayerAnchors();
    const activeTargetParticles = activeParticleTargetCount(partySpawnAnchors);
    const maxParticleBudget = Math.round(activeTargetParticles * 1.28);
    const playfieldFill = useParticlePlayfieldFill();
    const localFillRadius = playfieldFill ? particlePlayfieldRadius() : particleDensityRadius();

    pruneInvalidParticles();
    let ambientParticleCount = countAmbientParticles();
    spawnTimer -= dt;
    while (spawnTimer <= 0) {
      const underdense = mostUnderdenseParticleAnchor(partySpawnAnchors);
      const needsLocalFill = underdense.score > 0.5 && underdense.localCount < underdense.localTarget;
      if (ambientParticleCount >= activeTargetParticles && (!needsLocalFill || ambientParticleCount >= maxParticleBudget)) {
        const recycled = needsLocalFill && playfieldFill ? farthestRecyclableAmbientParticle(partySpawnAnchors, localFillRadius * 1.18) : null;
        if (!recycled || !recycleParticleNearPlayer(recycled, underdense.anchor, { localFill: true, playfieldFill: true })) {
          break;
        }
        spawnTimer += 0.035;
        continue;
      }
      spawnParticleNearPlayer(needsLocalFill ? underdense.anchor : randomPartySpawnAnchor(), { localFill: needsLocalFill, playfieldFill: needsLocalFill && playfieldFill });
      ambientParticleCount += 1;
      const deficit = clamp((activeTargetParticles - ambientParticleCount) / Math.max(1, activeTargetParticles), 0, 1);
      spawnTimer += needsLocalFill ? 0.035 : 0.11 - deficit * 0.07;
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      const isLandedBody = particle.id === landedBodyId;
      if (particle.ufoSapTimer !== undefined) {
        particle.ufoSapTimer = Math.max(0, finiteOr(particle.ufoSapTimer, 0) - dt);
      }
      if (particle.ufoSapSourceGraceTimer !== undefined) {
        particle.ufoSapSourceGraceTimer = Math.max(0, finiteOr(particle.ufoSapSourceGraceTimer, 0) - dt);
      }

      if (
        suctionActive &&
        !isLandedBody &&
        gadgetStateMayReachTarget(localGadgetState, particle, 0)
      ) {
        applyActorGadgetForces(particle, localGadgetState, dt);
      }
      for (const state of partyGadgetStates) {
        if (partyGadgetCanAffectParticle(state, particle) && state.active && gadgetStateMayReachTarget(state, particle, 0)) {
          applyActorGadgetForces(particle, state, dt);
        }
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
      if (
        vacuumBucketActive &&
        !isLandedBody &&
        gadgetStateMayReachTarget(localGadgetState, particle, 0)
      ) {
        resolveActorFunnelBucket(particle, localGadgetState, dt);
      }
      for (const state of partyGadgetStates) {
        if (state.bucketActive && partyGadgetCanAffectParticle(state, particle) && gadgetStateMayReachTarget(state, particle, 0)) {
          resolveActorFunnelBucket(particle, state, dt);
        }
      }

      const fromPlayer = nearestPartyAnchorDistance(particle.x, particle.y, partySpawnAnchors);
      const cullDistance = Math.max(width, height) * 1.85 + 1600;
      if (!particle.tier.solid && fromPlayer > cullDistance && ambientParticleCount > activeTargetParticles * 0.82) {
        particles.splice(i, 1);
        if (isAmbientDensityParticle(particle)) {
          ambientParticleCount -= 1;
        }
      }
    }

    pruneExcessAmbientParticles(partySpawnAnchors, maxParticleBudget);

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

  function isFreshUfoSapSourcePair(a, b) {
    return Boolean(
      a &&
      b &&
      (
        (finiteOr(a.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(a.ufoExtractedFromId, 0))) === b.id) ||
        (finiteOr(b.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(b.ufoExtractedFromId, 0))) === a.id)
      )
    );
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
    return isFreshUfoSapSourcePair(a, b);
  }

  function areBodiesDirectlyTethered(a, b) {
    if (!a || !b || a.id === b.id) {
      return false;
    }

    for (const structure of structures) {
      if (
        isLinkedStructureType(structure.type) &&
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
    if (clusternautsTestConfig) {
      clusternautsTestCounters.bodyBounces += 1;
    }
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
    let restartScan = true;

    while (restartScan) {
      restartScan = false;
      const maxRadius = particles.reduce((largest, particle) => Math.max(largest, finiteOr(particle && particle.radius, 0)), 0);
      const order = particles
        .map((particle, index) => ({ index, x: finiteOr(particle && particle.x, 0) }))
        .sort((a, b) => a.x - b.x);
      const allowBounceResolution = mergesThisFrame === 0;

      mergeScan:
      for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
        const i = order[orderIndex].index;
        const a = particles[i];
        if (!a) {
          continue;
        }
        const maxDx = a.radius + maxRadius;

        for (let nextIndex = orderIndex + 1; nextIndex < order.length; nextIndex += 1) {
          const j = order[nextIndex].index;
          const b = particles[j];
          if (!b || i === j) {
            continue;
          }
          if (b.x - a.x > maxDx) {
            break;
          }
          if (shouldSkipParticleMerge(a, b)) {
            continue;
          }

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = a.radius + b.radius;
          if (Math.abs(dy) > minDist) {
            continue;
          }

          if (dx * dx + dy * dy <= minDist * minDist) {
            const absorbingPair = absorbingCollisionPair(a, b);
            if (!absorbingPair) {
              if (allowBounceResolution) {
                resolveBodyBounce(a, b, dx, dy, minDist);
              }
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
          if (clusternautsTestConfig) {
            clusternautsTestCounters.particleMerges += 1;
          }
          if (mergesThisFrame > 8) {
            return;
          }
          restartScan = true;
          break mergeScan;
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
    const sparkBudget = isPartySessionActive() || multiplayer.remoteUniverses.size ? 96 : 150;
    if (sparks.length > sparkBudget) {
      sparks.splice(0, sparks.length - sparkBudget);
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

  function awardHealthPickup(pickup) {
    if (!pickup) {
      return;
    }
    player.health = Math.min(player.maxHealth, player.health + Math.max(0, finiteOr(pickup.heal, healthPickupHeal)));
    playSound("pickupHealth");
    sparks.push({
      x: player.x,
      y: player.y,
      radius: 46,
      color: { r: 101, g: 245, b: 154 },
      life: 0.26,
      maxLife: 0.26
    });
  }

  function updateHealthPickups(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const localGadgetState = localGadgetStateForFrame(aim, funnel);
    const suctionActive = localGadgetState.active;

    for (let i = healthPickups.length - 1; i >= 0; i -= 1) {
      const pickup = healthPickups[i];
      pickup.life -= dt;

      if (suctionActive && gadgetStateMayReachTarget(localGadgetState, pickup, 0)) {
        applyActorGadgetForces(pickup, localGadgetState, dt, { captureInFunnel: false, pullTowardActor: true });
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
        awardHealthPickup(pickup);
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
    const localGadgetState = localGadgetStateForFrame(aim, funnel);
    const suctionActive = localGadgetState.active;

    for (let i = techPickups.length - 1; i >= 0; i -= 1) {
      const pickup = techPickups[i];
      pickup.life -= dt;
      pickup.rotation += (1.4 + Math.sin(pickup.wobble) * 0.4) * dt;

      if (suctionActive && gadgetStateMayReachTarget(localGadgetState, pickup, 0)) {
        applyActorGadgetForces(pickup, localGadgetState, dt, { captureInFunnel: false });
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
        if (isPartySessionActive()) {
          if (!requestTechPickupClaim(pickup)) {
            continue;
          }
        } else {
          awardTechPickup(pickup);
        }
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

  function updateFollowerTechPickups() {
    for (let i = techPickups.length - 1; i >= 0; i -= 1) {
      const pickup = techPickups[i];
      if (!pickup || multiplayer.claimedTechPickupIds.has(String(pickup.id))) {
        techPickups.splice(i, 1);
        continue;
      }
      if (playerCanCollectPickup(pickup)) {
        if (!requestTechPickupClaim(pickup)) {
          continue;
        }
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

  function updateFollowerHealthPickups() {
    for (let i = healthPickups.length - 1; i >= 0; i -= 1) {
      const pickup = healthPickups[i];
      if (!pickup || multiplayer.claimedHealthPickupIds.has(String(pickup.id))) {
        healthPickups.splice(i, 1);
        continue;
      }
      if (player.health < player.maxHealth && playerCanCollectPickup(pickup)) {
        if (!requestHealthPickupClaim(pickup)) {
          continue;
        }
        awardHealthPickup(pickup);
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

  function requestTechPickupClaim(pickup) {
    if (!pickup || multiplayer.claimedTechPickupIds.has(String(pickup.id))) {
      return false;
    }
    multiplayer.claimedTechPickupIds.add(String(pickup.id));
    const sent = sendMultiplayer({
      type: "party.tech.pickup",
      pickupId: pickup.id,
      key: pickup.key,
      x: pickup.x,
      y: pickup.y
    });
    if (!sent) {
      multiplayer.claimedTechPickupIds.delete(String(pickup.id));
    }
    return sent;
  }

  function requestHealthPickupClaim(pickup) {
    if (!pickup || multiplayer.claimedHealthPickupIds.has(String(pickup.id))) {
      return false;
    }
    const now = performance.now();
    const actor = buildPersistentPayload(false).player;
    const session = markLocalPartyPhysicsSession("healthPickup", pickup, now, {
      actor,
      mode: "idle",
      active: false,
      force: true
    });
    if (!session) {
      return false;
    }
    const sent = sendPartyPhysicsEnd(session, "collected");
    if (!sent) {
      return false;
    }
    multiplayer.claimedHealthPickupIds.add(String(pickup.id));
    multiplayer.localPartyPhysicsSessions.delete(session.key);
    multiplayer.partyPhysicsSessions.delete(session.key);
    return true;
  }

  function awardTechPickup(pickup) {
    if (!pickup) {
      return;
    }
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
  }

  function removeTechPickupById(pickupId) {
    const id = String(pickupId || "");
    if (!id) {
      return null;
    }
    const index = techPickups.findIndex((pickup) => String(pickup.id) === id);
    if (index < 0) {
      return null;
    }
    const pickup = techPickups[index];
    techPickups.splice(index, 1);
    return pickup;
  }

  function applyTechPickupClaim(message) {
    const pickupId = String(message && message.pickupId || "");
    if (!pickupId) {
      return;
    }
    const pickup = removeTechPickupById(pickupId) || techPickupFromClaim(message);
    multiplayer.claimedTechPickupIds.add(pickupId);
    if (message.claimedByPlayerId === player.id) {
      awardTechPickup(pickup);
    }
  }

  function techPickupFromClaim(message) {
    const tech = techTypes.find((candidate) => candidate.key === (message && message.key)) || techTypes[0];
    return {
      id: Math.max(1, Math.floor(finiteOr(message && message.pickupId, nextTechPickupId))),
      key: tech.key,
      label: tech.label,
      color: tech.color,
      x: finiteOr(message && message.x, player.x),
      y: finiteOr(message && message.y, player.y),
      vx: 0,
      vy: 0,
      radius: 15,
      life: 0,
      maxLife: techPickupLifetime,
      rotation: 0,
      wobble: 0
    };
  }

  function resolvePlayerBodyCollisions() {
    for (const particle of particles) {
      if (!particle.tier.solid) {
        continue;
      }
      if (player.landed && player.landed.bodyId === particle.id) {
        continue;
      }

      const contact = playerCircleHurtboxContact(player, particle.x, particle.y, solidBodyContactRadius(particle), playerBodyHurtboxScale);
      if (!contact) {
        continue;
      }

      const nx = contact.nx;
      const ny = contact.ny;
      const overlap = contact.overlap;
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

  function resolveFollowerPlayerBodyCollisions() {
    for (const particle of particles) {
      if (!particle.tier.solid) {
        continue;
      }
      if (player.landed && player.landed.bodyId === particle.id) {
        continue;
      }

      const contact = playerCircleHurtboxContact(player, particle.x, particle.y, solidBodyContactRadius(particle), playerBodyHurtboxScale);
      if (!contact) {
        continue;
      }

      const nx = contact.nx;
      const ny = contact.ny;
      const overlap = contact.overlap;

      player.x += nx * overlap;
      player.y += ny * overlap;

      const relativeVelocity = (player.vx - particle.vx) * nx + (player.vy - particle.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.72;
        player.vx += nx * impulse;
        player.vy += ny * impulse;
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

  function sharedBodyPlayerImpactDamage(body, impactSpeed, baseDamage) {
    return body && body.tier && body.tier.solid
      ? solidBodyPlayerImpactDamage(body, impactSpeed, baseDamage)
      : Math.min(90, baseDamage + Math.max(0, impactSpeed - rivalBodyImpactSpeed) * 0.16 + Math.sqrt(body.mass) * 0.62);
  }

  function sendSharedBodyImpactEffect(contact, keyPrefix, nx, ny, impactSpeed) {
    const impulse = 70 + impactSpeed * 0.28;
    sendThrottledRemoteEntityEffect(contact.remote, keyPrefix + ":" + contact.source.id, 0.18, {
      entityType: "particle",
      entityId: contact.source.id,
      sourceKind: "environment",
      cause: "Shared body impact",
      impulseX: -nx * impulse,
      impulseY: -ny * impulse
    });
  }

  function resolveRemoteBodyPlayerCollisions() {
    for (const contact of collectRemoteSharedBodies()) {
      const body = contact.body;
      const bodyContact = playerCircleHurtboxContact(
        player,
        body.x,
        body.y,
        body.tier.solid ? solidBodyContactRadius(body) : body.radius * 1.08,
        playerBodyHurtboxScale
      );
      if (!bodyContact) {
        continue;
      }

      const nx = bodyContact.nx;
      const ny = bodyContact.ny;
      const relativeVelocity = (player.vx - body.vx) * nx + (player.vy - body.vy) * ny;
      const incomingSpeed = Math.max(0, -relativeVelocity);
      const bodySpeed = Math.hypot(body.vx, body.vy);
      const impactSpeed = Math.max(incomingSpeed, bodySpeed);

      if (body.tier.solid) {
        const overlap = bodyContact.overlap;
        player.x += nx * overlap * 0.82;
        player.y += ny * overlap * 0.82;

        if (incomingSpeed > 0) {
          const impulse = incomingSpeed * 0.74;
          player.vx += nx * impulse;
          player.vy += ny * impulse;
          sendSharedBodyImpactEffect(contact, "player-body-bounce", nx, ny, incomingSpeed);
        }
      }

      if (isPermanentRemoteOverlap(contact.remote)) {
        continue;
      }

      const damageThreshold = body.tier.solid ? solidBodyPlayerDamageSpeed : projectileDamageSpeed;
      if (impactSpeed < damageThreshold || player.hitCooldown > 0) {
        continue;
      }

      if (player.landed) {
        detachFromBody(170);
      }

      const damage = sharedBodyPlayerImpactDamage(body, impactSpeed, 10);
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
    if (equippedToolId !== "spanner" || areToolsDisabled() || !mouse.left || buildMenuOpen) {
      return false;
    }

    if (!canUseContinuousPlayerEnergy(spannerRepairEnergyDrain, dt)) {
      playerContinuousEnergyLocked = true;
      notifyEnergyDepleted();
      return false;
    }

    const target = findSpannerRepairTarget();
    if (!target) {
      return false;
    }

    if (!drainContinuousPlayerEnergy(spannerRepairEnergyDrain, dt)) {
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
    if (isLinkedStructureType(structure.type)) {
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
    if (equippedToolId !== "spanner" || areToolsDisabled() || !mouse.right || buildMenuOpen) {
      return false;
    }

    if (!canUseContinuousPlayerEnergy(spannerDismantleEnergyDrain, dt)) {
      playerContinuousEnergyLocked = true;
      notifyEnergyDepleted();
      return false;
    }

    const target = findSpannerDismantleTarget();
    if (!target) {
      return false;
    }

    if (!drainContinuousPlayerEnergy(spannerDismantleEnergyDrain, dt)) {
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

    const energyCost = finiteOr(weapon.energyCost, playerWeaponDefaults.energyCost);
    if (!canSpendPlayerEnergy(energyCost)) {
      notifyEnergyDepleted();
      return;
    }

    firePlayerLaser(weapon);
    spendPlayerEnergy(energyCost);
    toolFireCooldown = weapon.cooldown;
  }

  function updateToolDisable(dt) {
    if (toolDisabledTimer <= 0) {
      return;
    }

    toolDisabledTimer = Math.max(0, toolDisabledTimer - dt);
    resetMouseButtons();
  }

  function updatePlayerLasers(dt, options) {
    const relaySharedWorldHits = Boolean(options && options.relaySharedWorldHits);
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

        const knockback = laser.knockback || 170;
        if (relaySharedWorldHits) {
          sendPartyHostEntityEffect({
            entityType: mob.kind,
            entityId: mob.id,
            sourceKind: "player",
            damage: laser.damage || playerWeaponDefaults.damage,
            impulseX: dirX * knockback,
            impulseY: dirY * knockback,
            color: laser.color
          });
        }
        knockMob(mob, dirX, dirY, knockback);
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
      id: nextRivalProjectileId++,
      x: rival.x + aim.x * muzzleDistance,
      y: rival.y + aim.y * muzzleDistance,
      vx: aim.x * rivalProjectileSpeed + rival.vx * 0.18,
      vy: aim.y * rivalProjectileSpeed + rival.vy * 0.18,
      radius: 5,
      length: randomRange(34, 46),
      color: laserColor,
      life: 2.2,
      maxLife: 2.2,
      damage: difficultyMobDamage(rivalProjectileDamage),
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
      id: nextRivalProjectileId++,
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      vx: aim.x * 980 + tesla.vx * 0.08,
      vy: aim.y * 980 + tesla.vy * 0.08,
      radius: 8,
      length: randomRange(76, 104),
      color,
      life: 0.58,
      maxLife: 0.58,
      damage: difficultyMobDamage(teslaLightningDamage),
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
      id: nextRivalProjectileId++,
      x: rocket.x + aim.x * muzzleDistance + normalX * side * 17,
      y: rocket.y + aim.y * muzzleDistance + normalY * side * 17,
      vx: aim.x * satelliteMissileSpeed + rocket.vx * 0.12,
      vy: aim.y * satelliteMissileSpeed + rocket.vy * 0.12,
      radius: 10,
      length: randomRange(42, 54),
      color,
      life: 2.4,
      maxLife: 2.4,
      damage: difficultyMobDamage(satelliteMissileDamage),
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
        id: nextRivalProjectileId++,
        x: fighter.x + aim.x * (fighter.radius + 16) + normalX * side * 19,
        y: fighter.y + aim.y * (fighter.radius + 16) + normalY * side * 19,
        vx: aim.x * (rivalProjectileSpeed + 60) + fighter.vx * 0.14,
        vy: aim.y * (rivalProjectileSpeed + 60) + fighter.vy * 0.14,
        radius: 5,
        length: randomRange(38, 50),
        color,
        life: 2.0,
        maxLife: 2.0,
        damage: difficultyMobDamage(9),
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

  function pointToSegmentContact(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = closestX - px;
    const dy = closestY - py;
    const distance = Math.hypot(dx, dy);
    return {
      x: closestX,
      y: closestY,
      distance,
      nx: distance ? dx / distance : 1,
      ny: distance ? dy / distance : 0
    };
  }

  function playerHurtboxDownVector(targetPlayer) {
    if (targetPlayer && targetPlayer.landed && Number.isFinite(Number(targetPlayer.landed.angle))) {
      const angle = finiteOr(targetPlayer.landed.angle, 0) + Math.PI;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    }

    const angle = targetPlayer === player
      ? Math.PI / 2 - cameraRoll
      : finiteOr(targetPlayer && targetPlayer.cameraRoll, 0) - cameraRoll + Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  function playerHurtboxSegment(targetPlayer) {
    const down = playerHurtboxDownVector(targetPlayer);
    const x = finiteOr(targetPlayer && targetPlayer.x, player.x);
    const y = finiteOr(targetPlayer && targetPlayer.y, player.y);
    return {
      ax: x + down.x * playerHurtboxTopOffset,
      ay: y + down.y * playerHurtboxTopOffset,
      bx: x + down.x * playerHurtboxBottomOffset,
      by: y + down.y * playerHurtboxBottomOffset
    };
  }

  function distanceBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
    function orientation(px, py, qx, qy, rx, ry) {
      const value = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
      if (Math.abs(value) < 0.000001) {
        return 0;
      }
      return value > 0 ? 1 : 2;
    }

    function onSegment(px, py, qx, qy, rx, ry) {
      return qx <= Math.max(px, rx) + 0.000001 &&
        qx + 0.000001 >= Math.min(px, rx) &&
        qy <= Math.max(py, ry) + 0.000001 &&
        qy + 0.000001 >= Math.min(py, ry);
    }

    const o1 = orientation(ax, ay, bx, by, cx, cy);
    const o2 = orientation(ax, ay, bx, by, dx, dy);
    const o3 = orientation(cx, cy, dx, dy, ax, ay);
    const o4 = orientation(cx, cy, dx, dy, bx, by);

    if (
      (o1 !== o2 && o3 !== o4) ||
      (o1 === 0 && onSegment(ax, ay, cx, cy, bx, by)) ||
      (o2 === 0 && onSegment(ax, ay, dx, dy, bx, by)) ||
      (o3 === 0 && onSegment(cx, cy, ax, ay, dx, dy)) ||
      (o4 === 0 && onSegment(cx, cy, bx, by, dx, dy))
    ) {
      return 0;
    }

    return Math.min(
      distanceToSegment(ax, ay, cx, cy, dx, dy),
      distanceToSegment(bx, by, cx, cy, dx, dy),
      distanceToSegment(cx, cy, ax, ay, bx, by),
      distanceToSegment(dx, dy, ax, ay, bx, by)
    );
  }

  function distanceToPlayerHurtboxSegment(targetPlayer, ax, ay, bx, by) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    return distanceBetweenSegments(ax, ay, bx, by, hurtbox.ax, hurtbox.ay, hurtbox.bx, hurtbox.by);
  }

  function playerCircleHurtboxContact(targetPlayer, cx, cy, circleRadius, playerScale) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    const contact = pointToSegmentContact(cx, cy, hurtbox.ax, hurtbox.ay, hurtbox.bx, hurtbox.by);
    const playerRadius = Math.max(1, finiteOr(targetPlayer && targetPlayer.radius, player.radius)) * playerScale;
    const minDist = playerRadius + Math.max(0, finiteOr(circleRadius, 0));
    if (contact.distance >= minDist) {
      return null;
    }

    return Object.assign(contact, {
      overlap: minDist - contact.distance,
      minDist,
      playerRadius
    });
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

  function updateBridge(structure, dt) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return;
    }

    structure.deploy = clamp((structure.deploy || 0) + dt * 2.8, 0, 1);

    let restDx = finiteOr(structure.restCenterDx, secondBody.x - firstBody.x);
    let restDy = finiteOr(structure.restCenterDy, secondBody.y - firstBody.y);
    let restLength = Math.hypot(restDx, restDy);
    if (restLength < 1) {
      restDx = secondBody.x - firstBody.x;
      restDy = secondBody.y - firstBody.y;
      restLength = Math.hypot(restDx, restDy) || 1;
    }

    const firstMass = Math.max(1, finiteOr(firstBody.mass, 1));
    const secondMass = Math.max(1, finiteOr(secondBody.mass, 1));
    const totalMass = firstMass + secondMass;
    const firstShare = clamp(secondMass / totalMass, 0.08, 0.92);
    const secondShare = clamp(firstMass / totalMass, 0.08, 0.92);
    const currentDx = secondBody.x - firstBody.x;
    const currentDy = secondBody.y - firstBody.y;
    const leverLengthSq = Math.max(1, currentDx * currentDx + currentDy * currentDy);
    const relativeVx = finiteOr(secondBody.vx, 0) - finiteOr(firstBody.vx, 0);
    const relativeVy = finiteOr(secondBody.vy, 0) - finiteOr(firstBody.vy, 0);
    const angularVelocity = clamp(
      ((currentDx * relativeVy - currentDy * relativeVx) / leverLengthSq) * Math.pow(bridgeAngularDamping, dt),
      -bridgeMaxAngularSpeed,
      bridgeMaxAngularSpeed
    );
    const angleStep = angularVelocity * dt;

    if (Math.abs(angleStep) > 0.000001) {
      const rotated = rotatePoint(restDx, restDy, angleStep);
      restDx = rotated.x;
      restDy = rotated.y;
      rotateBodyMountedFrame(firstBody.id, angleStep);
      rotateBodyMountedFrame(secondBody.id, angleStep);
    }

    structure.restCenterDx = restDx;
    structure.restCenterDy = restDy;

    const centerX = (firstBody.x * firstMass + secondBody.x * secondMass) / totalMass;
    const centerY = (firstBody.y * firstMass + secondBody.y * secondMass) / totalMass;
    firstBody.x = centerX - restDx * firstShare;
    firstBody.y = centerY - restDy * firstShare;
    secondBody.x = centerX + restDx * secondShare;
    secondBody.y = centerY + restDy * secondShare;

    const averageVx = (finiteOr(firstBody.vx, 0) * firstMass + finiteOr(secondBody.vx, 0) * secondMass) / totalMass;
    const averageVy = (finiteOr(firstBody.vy, 0) * firstMass + finiteOr(secondBody.vy, 0) * secondMass) / totalMass;
    const firstRadiusX = -restDx * firstShare;
    const firstRadiusY = -restDy * firstShare;
    const secondRadiusX = restDx * secondShare;
    const secondRadiusY = restDy * secondShare;
    const firstTargetVx = averageVx - angularVelocity * firstRadiusY;
    const firstTargetVy = averageVy + angularVelocity * firstRadiusX;
    const secondTargetVx = averageVx - angularVelocity * secondRadiusY;
    const secondTargetVy = averageVy + angularVelocity * secondRadiusX;
    const velocityBlend = 1 - Math.pow(0.0001, dt);
    firstBody.vx += (firstTargetVx - firstBody.vx) * velocityBlend;
    firstBody.vy += (firstTargetVy - firstBody.vy) * velocityBlend;
    secondBody.vx += (secondTargetVx - secondBody.vx) * velocityBlend;
    secondBody.vy += (secondTargetVy - secondBody.vy) * velocityBlend;

    applyLinkedStructureSurfaceConstraint(structure);

    if (Math.random() < dt * 0.7) {
      const geometry = bridgeGeometry(structure);
      if (geometry) {
        const t = randomRange(bridgeHalfWidth, Math.max(bridgeHalfWidth, geometry.length - bridgeHalfWidth));
        sparks.push({
          x: geometry.x1 + geometry.ux * t + randomRange(-6, 6),
          y: geometry.y1 + geometry.uy * t + randomRange(-6, 6),
          radius: 14,
          color: { r: 255, g: 209, b: 102 },
          life: 0.14,
          maxLife: 0.14
        });
      }
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

      if (structure.type === "bridge") {
        updateBridge(structure, dt);
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
            damageStructure(structure, difficultyMobDamage(structureRocketDamage), projectile.color);
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

      const playerHitScale = projectile.rocket ? 0.86 : 0.72;
      const dist = distanceToPlayerHurtboxSegment(player, tailX, tailY, projectile.x, projectile.y);
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
        if (!canDamageRemotePlayerFromPve(target.remote)) {
          continue;
        }
        const remotePlayer = target.player;
        const remoteDist = distanceToPlayerHurtboxSegment(remotePlayer, tailX, tailY, projectile.x, projectile.y);
        const remoteHitDistance = (remotePlayer.radius || player.radius) * playerHitScale + hitRadius;

        if (remoteDist >= remoteHitDistance) {
          continue;
        }

        sendRemoteEntityEffect(target.remote, {
          entityType: "player",
          sourceKind: "mob",
          cause: projectile.cause || "Alienoid laser",
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

    if (body.ufoSapParticleBuffer < ufoSapFragmentMass) {
      return;
    }

    const originX = ufo.x + Math.cos(ufo.beamAngle) * 26;
    const originY = ufo.y + Math.sin(ufo.beamAngle) * 26;
    const toUfo = normalize(originX - body.x, originY - body.y);
    const tangentX = -toUfo.y;
    const tangentY = toUfo.x;
    const pullSpeed = 170 + pullStrength * 170 + centerStrength * 120;
    const particlesToEmit = Math.min(
      ufoSapMaxFragmentsPerBurst,
      Math.max(1, Math.floor(body.ufoSapParticleBuffer / ufoSapFragmentMass))
    );
    let remainingMass = body.ufoSapParticleBuffer;
    let sparkX = body.x + toUfo.x * Math.max(1, body.radius + 2);
    let sparkY = body.y + toUfo.y * Math.max(1, body.radius + 2);

    for (let i = 0; i < particlesToEmit; i += 1) {
      const remainingParticles = particlesToEmit - i;
      const fragmentMass = remainingMass / remainingParticles;
      remainingMass -= fragmentMass;
      const fragmentRadius = radiusFromMass(fragmentMass);
      const surfaceX = body.x + toUfo.x * Math.max(1, body.radius + fragmentRadius + 5);
      const surfaceY = body.y + toUfo.y * Math.max(1, body.radius + fragmentRadius + 5);
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
      particle.ufoSapTimer = ufoSapCargoDuration;
      particle.ufoSapSourceGraceTimer = ufoSapSourceGraceDuration;
      particle.wobble = ufo.wobble + randomRange(-0.45, 0.45);
      sparkX = surfaceX;
      sparkY = surfaceY;
    }

    body.ufoSapParticleBuffer = Math.max(0, remainingMass);

    sparks.push({
      x: sparkX,
      y: sparkY,
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
    const impactAngle = Math.atan2(ny, nx);
    const platingBlocker = platingBlockAtImpactAngle(body, impactAngle);
    if (platingBlocker) {
      const damage = difficultyMobDamage(structureRambotDamage + Math.max(0, impactSpeed - rambotBodyImpactSpeed) * 0.045);
      damageStructure(platingBlocker, damage, rambot.color);
      rambot.impactCooldown = 0.95;
      rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.65);
      rambot.chargeTimer = 0;
      rambot.vx += nx * 250;
      rambot.vy += ny * 250;
      playSound("mobHit", { throttleKey: "rambotPlateImpact" });
      return;
    }

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
    damageLocalPlayer(difficultyMobDamage(ufoUndersideDamage), {
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
        const spawn = randomOffscreenPoint(180, 560, targetPlayer);
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
        const spawn = randomOffscreenPoint(150, 500, targetPlayer);
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
        sourceKind: "mob",
        cause: "Rambot charge",
        damage: difficultyMobDamage(rambotImpactDamage),
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
      damageLocalPlayer(difficultyMobDamage(rambotImpactDamage), {
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
      damageStructure(structure, difficultyMobDamage(structureRambotDamage + Math.max(0, speed - rambotImpactSpeed) * 0.045), rambot.color);
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
        const spawn = randomOffscreenPoint(220, 640, targetPlayer);
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
        const spawn = randomOffscreenPoint(210, 600, targetPlayer);
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
        const spawn = randomOffscreenPoint(190, 560, targetPlayer);
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
        sourceKind: "mob",
        cause: "Rocket ship",
        damage: difficultyMobDamage(rocketImpactDamage),
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
      damageLocalPlayer(difficultyMobDamage(rocketImpactDamage), {
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
      damageStructure(structure, difficultyMobDamage(structureRocketDamage + Math.max(0, speed - rocketImpactSpeed) * 0.035), rocket.color);
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
      const spawn = randomOffscreenPoint(320, 900, targetPlayer);
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
        const spawn = randomOffscreenPoint(230, 680, targetPlayer);
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
        const spawn = randomOffscreenPoint(260, 760, targetPlayer);
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
    const spawnSizeScale = particle.tier.name === "particle" ? clamp(finiteOr(particle.spawnSizeScale, 1), 1, 1.18) : 1;
    const radius = particle.radius * pulse * spawnSizeScale;

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

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(ufo.health / ufo.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      roundRectPath(-28, -46, 56, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-28, -46, 56 * healthPct, 6, 3);
      ctx.fill();
    }

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

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(rambot.health / rambot.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-32, -76, 64, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-32, -76, 64 * healthPct, 7, 3.5);
      ctx.fill();
    }

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

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(tesla.health / tesla.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-28, -48, 56, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-28, -48, 56 * healthPct, 6, 3);
      ctx.fill();
    }

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

    if (gameSettings.hudEnabled !== false) {
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

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-30, -76, 60, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-30, -76, 60 * healthPct, 7, 3.5);
      ctx.fill();
    }

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

    if (gameSettings.hudEnabled !== false) {
      const satelliteHealthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-30, -74, 60, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = satelliteHealthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-30, -74, 60 * satelliteHealthPct, 7, 3.5);
      ctx.fill();
    }

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

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-30, -76, 60, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-30, -76, 60 * healthPct, 7, 3.5);
      ctx.fill();
    }

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

    if (gameSettings.hudEnabled !== false) {
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
    }

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

  function drawBridge(structure, time, alpha, valid) {
    const x2 = finiteOr(structure.x2, structure.x);
    const y2 = finiteOr(structure.y2, structure.y);
    const dx = x2 - structure.x;
    const dy = y2 - structure.y;
    const length = Math.hypot(dx, dy);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 209, b: 102 };

    if (length > 8) {
      const angle = Math.atan2(dy, dx);
      const deploy = clamp(structure.deploy || 0, 0, 1);
      const segmentCount = Math.max(3, Math.min(18, Math.ceil(length / 96)));
      const segmentLength = length / segmentCount;

      ctx.save();
      ctx.globalAlpha *= alpha * (valid === false ? 0.58 : 0.92);
      ctx.translate(structure.x, structure.y);
      ctx.rotate(angle);

      ctx.fillStyle = "rgba(5, 8, 18, 0.92)";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(10, -17, 24, -bridgeHalfWidth - 8, 42, -bridgeHalfWidth - 7);
      ctx.lineTo(42, bridgeHalfWidth + 7);
      ctx.bezierCurveTo(24, bridgeHalfWidth + 8, 10, 17, 0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(length, -8);
      ctx.bezierCurveTo(length - 10, -17, length - 24, -bridgeHalfWidth - 8, length - 42, -bridgeHalfWidth - 7);
      ctx.lineTo(length - 42, bridgeHalfWidth + 7);
      ctx.bezierCurveTo(length - 24, bridgeHalfWidth + 8, length - 10, 17, length, 8);
      ctx.closePath();
      ctx.fill();

      roundRectPath(10, -bridgeHalfWidth - 5, Math.max(1, length - 20), bridgeHalfWidth * 2 + 10, 8);
      ctx.fill();

      const deckGradient = ctx.createLinearGradient(0, -bridgeHalfWidth, 0, bridgeHalfWidth);
      deckGradient.addColorStop(0, "#f8fbff");
      deckGradient.addColorStop(0.5, "#9aa4b8");
      deckGradient.addColorStop(1, "#3a4258");
      ctx.fillStyle = deckGradient;
      roundRectPath(16, -bridgeHalfWidth, Math.max(1, length - 32), bridgeHalfWidth * 2, 6);
      ctx.fill();

      ctx.strokeStyle = "rgba(6, 10, 24, 0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(22, -bridgeHalfWidth + 4);
      ctx.lineTo(length - 22, -bridgeHalfWidth + 4);
      ctx.moveTo(22, bridgeHalfWidth - 4);
      ctx.lineTo(length - 22, bridgeHalfWidth - 4);
      ctx.stroke();

      for (let i = 0; i < segmentCount; i += 1) {
        const start = 18 + i * segmentLength;
        const end = Math.min(length - 18, start + segmentLength * 0.72);
        ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 209, 102, 0.76)" : "rgba(88, 226, 255, 0.58)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(start, -bridgeHalfWidth + 5);
        ctx.lineTo(end, bridgeHalfWidth - 5);
        ctx.moveTo(start, bridgeHalfWidth - 5);
        ctx.lineTo(end, -bridgeHalfWidth + 5);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.12 + deploy * 0.12);
      ctx.lineWidth = bridgeHalfWidth * 2 + 18;
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(length - 22, 0);
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
    } else if (structure.type === "bridge") {
      drawBridge(structure, time, alpha, valid);
    } else if (structure.type === "missile-launcher") {
      drawMissileLauncher(structure, time, alpha, valid);
    } else {
      drawTurret(structure, time, alpha, valid);
    }

    drawStructureStatus(structure, alpha, valid);
  }

  function drawStructureStatus(structure, alpha, valid) {
    if (gameSettings.hudEnabled === false) {
      return;
    }

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
    const firstTetherPlacement = isLinkedStructureType(recipe.structureType) && pendingTetherAnchor
      ? refreshPlacementAnchor(pendingTetherAnchor)
      : null;
    const tetherSecondValid = Boolean(
      !isLinkedStructureType(recipe.structureType) ||
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
      const sharedEntityAlpha = transformAlpha * (transform.phase === "overlap" ? 0.56 : 0.3);
      const sharedBodyAlpha = transform.phase === "overlap" ? sharedEntityAlpha : alpha;
      const remotePlayerAlpha = transformAlpha * (transform.phase === "overlap" ? 0.9 : 0.48);
      const world = snapshot.world;
      const renderRadius = remoteUniverseRenderRadius();
      const renderRadiusSq = renderRadius * renderRadius;
      ctx.save();
      ctx.globalAlpha = sharedBodyAlpha;
      ctx.globalCompositeOperation = "lighter";

      let remoteBodiesDrawn = 0;
      for (const particle of world.particles) {
        if (!isMappedBody(particle)) {
          continue;
        }
        const transformed = transformedRemoteEntity(particle, transform);
        if (distanceSqToPlayer(transformed) > renderRadiusSq) {
          continue;
        }
        drawBody(transformed, time);
        remoteBodiesDrawn += 1;
        if (remoteBodiesDrawn >= 32) {
          break;
        }
      }

      ctx.globalCompositeOperation = "source-over";
      let remoteStructuresDrawn = 0;
      for (const structure of world.structures || []) {
        const transformed = transformedRemoteEntity(structure, transform);
        if (distanceSqToPlayer(transformed) > renderRadiusSq) {
          continue;
        }
        drawRemoteStructure(transformed, time);
        remoteStructuresDrawn += 1;
        if (remoteStructuresDrawn >= 24) {
          break;
        }
      }

      ctx.globalAlpha = sharedEntityAlpha;
      drawRemoteEntityCollection(world.rivalProjectiles, transform, drawRivalProjectile, time, 24, renderRadiusSq);
      drawRemoteEntityCollection(world.ufos, transform, drawUfo, time, 10, renderRadiusSq);
      drawRemoteEntityCollection(world.rambots, transform, drawRambot, time, 10, renderRadiusSq);
      drawRemoteEntityCollection(world.engineers, transform, drawEngineer, time, 10, renderRadiusSq);
      drawRemoteEntityCollection(world.teslas, transform, drawTesla, time, 10, renderRadiusSq);
      drawRemoteEntityCollection(world.rockets, transform, drawRocket, time, 10, renderRadiusSq);
      drawRemoteEntityCollection(world.fighters, transform, drawFighter, time, 10, renderRadiusSq);
      drawRemoteEntityCollection(world.alienoids, transform, drawRival, time, 14, renderRadiusSq);

      if (snapshot.player) {
        ctx.globalAlpha = remotePlayerAlpha;
        drawRemotePlayer(transformedRemoteEntity(snapshot.player, transform), remote.publicName, time);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  function distanceSqToPlayer(entity) {
    const dx = finiteOr(entity && entity.x, player.x) - player.x;
    const dy = finiteOr(entity && entity.y, player.y) - player.y;
    return dx * dx + dy * dy;
  }

  function remoteUniverseRenderRadius() {
    const zoom = Math.max(0.35, finiteOr(cameraZoom, 1));
    return Math.hypot(width, height) / zoom * 0.75 + 1600;
  }

  function drawRemoteEntityCollection(collection, transform, drawFn, time, limit, radiusSq) {
    if (!Array.isArray(collection) || !collection.length) {
      return;
    }
    let drawn = 0;
    for (const entity of collection) {
      const transformed = transformedRemoteEntity(entity, transform);
      if (distanceSqToPlayer(transformed) > radiusSq) {
        continue;
      }
      drawFn(transformed, time);
      drawn += 1;
      if (drawn >= limit) {
        return;
      }
    }
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

  function remotePlayerVisualAimAngle(remotePlayer) {
    if (Number.isFinite(Number(remotePlayer.visualAimLocalAngle))) {
      return finiteOr(remotePlayer.visualAimLocalAngle, 0) - cameraRoll;
    }
    if (Number.isFinite(Number(remotePlayer.aimAngle))) {
      return finiteOr(remotePlayer.aimAngle, 0);
    }
    if (Number.isFinite(Number(remotePlayer.aimLocalAngle))) {
      return finiteOr(remotePlayer.aimLocalAngle, 0) - finiteOr(remotePlayer.cameraRoll, 0);
    }
    return Math.atan2(remotePlayer.vy || 0, remotePlayer.vx || 1);
  }

  function drawRemotePlayer(remotePlayer, publicName, time) {
    const aimAngle = remotePlayerVisualAimAngle(remotePlayer);
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

    if (gameSettings.hudEnabled !== false) {
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
  }

  function drawRemoteInteractionBubble(remotePlayer, screen) {
    const emote = multiplayer.remoteEmotes.get(remotePlayer.id);
    if (!emote) {
      return;
    }

    const alpha = clamp(Math.min(1, emote.life / 0.45), 0, 1);
    const speech = emote.speech || emote.label || "";
    const symbol = emote.emote === "duel" ? "!" : emote.emote === "peace" ? "=" : "$";
    const y = screen.y - 154;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.font = "900 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bubbleWidth = Math.min(130, ctx.measureText(speech).width + 42);
    ctx.fillStyle = "rgba(3, 8, 24, 0.78)";
    ctx.strokeStyle = emote.emote === "duel" || emote.emote === "peace" ? "rgba(255, 229, 111, 0.72)" : "rgba(88, 226, 255, 0.62)";
    ctx.lineWidth = 1.5;
    roundRectPath(screen.x - bubbleWidth / 2, y - 15, bubbleWidth, 30, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = emote.emote === "duel" || emote.emote === "peace" ? "#ffe56f" : "#58e2ff";
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
    const active = canUseSuctionControls() && isGadgetButtonPressed();
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
    if (gameSettings.hudEnabled === false) {
      return;
    }

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
      let remoteMapBodies = 0;
      for (const body of snapshot.world.particles) {
        if (!isMappedBody(body)) {
          continue;
        }
        contacts.bodies.push({
          body: transformedRemoteEntity(body, transform),
          alpha,
          publicName: remote.publicName
        });
        remoteMapBodies += 1;
        if (remoteMapBodies >= 18) {
          break;
        }
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
    if (gameSettings.hudEnabled === false) {
      return;
    }

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
    if (gameSettings.hudEnabled === false) {
      return;
    }

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
    updateTouchLandButton();

    const progressBody = findBucketProgressBody() || findNearestProgressBody() || largestParticle;
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

  function stepGameplaySimulation(dt, options) {
    const includeExternalSystems = !options || options.includeExternalSystems !== false;
    if (isMultiplayerV2Active()) {
      stepMultiplayerV2Simulation(dt, includeExternalSystems);
      return;
    }
    if (isSharedWorldFollower()) {
      stepSharedWorldFollowerSimulation(dt, includeExternalSystems);
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
    updatePartyLandedGadgetThrusts(dt);
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
    applyLandedSurfaceConstraint();
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
    if (includeExternalSystems) {
      updatePersistence(dt);
      updateMultiplayer(dt);
    }
  }

  function stepSharedWorldFollowerSimulation(dt, includeExternalSystems) {
    updateLifeStats();
    updateToolDisable(dt);
    updatePlayerEnergySystems(dt);
    updateToolEnergyUsage(dt);
    updatePlayer(dt);
    updateGadgetAim(dt);
    updateEquippedTool(dt);
    updatePlayerLasers(dt, { relaySharedWorldHits: joinedPlayerIsolationAllows("relayHostEntityEffects") });
    if (joinedPlayerIsolationAllows("followerWorldSmoothing")) {
      updateFollowerWorldSmoothing(dt);
    }
    if (joinedPlayerIsolationAllows("followerGadgetPrediction")) {
      updateFollowerGadgetPrediction(dt);
    }
    if (joinedPlayerIsolationAllows("followerPickupPrediction")) {
      updateFollowerTechPickups();
      updateFollowerHealthPickups();
    }
    applyLandedSurfaceConstraint();
    if (joinedPlayerIsolationAllows("followerBodyCollisions")) {
      resolveFollowerPlayerBodyCollisions();
    }
    updateSparks(dt);

    if (includeExternalSystems) {
      updatePersistence(dt);
      updateMultiplayer(dt);
    }
  }

  function tick(now) {
    const frameDt = Math.max(0, (now - lastTime) / 1000 || 0);
    const dt = Math.min(0.033, frameDt);
    const gameplayDt = isMultiplayerV2Active() ? multiplayerV2FrameDt(frameDt) : dt;
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

    stepGameplaySimulation(gameplayDt);

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

  function resetClusternautsTestCounters() {
    clusternautsTestCounters.particleMerges = 0;
    clusternautsTestCounters.bodyBounces = 0;
    clusternautsTestCounters.buildMenuRenders = 0;
  }

  function configureClusternautsTestInput(input) {
    keys.clear();
    const codes = input && Array.isArray(input.keys) ? input.keys : [];
    for (const code of codes) {
      if (typeof code === "string" && code) {
        keys.add(code);
      }
    }

    if (input && input.mouse) {
      mouse.x = finiteOr(input.mouse.x, mouse.x);
      mouse.y = finiteOr(input.mouse.y, mouse.y);
      mouse.left = Boolean(input.mouse.left);
      mouse.middle = Boolean(input.mouse.middle);
      mouse.right = Boolean(input.mouse.right);
      mouse.seen = true;
    } else {
      resetMouseButtons();
    }
  }

  function countWorldMass(list) {
    return list.reduce(function (total, body) {
      return total + Math.max(0, finiteOr(body.mass, 0));
    }, 0);
  }

  function createClusternautsFrameRateSnapshot() {
    const majorBodies = particles.filter(function (particle) {
      return finiteOr(particle.mass, 0) >= mappedBodyThreshold;
    });
    const mobCounts = {
      alienoids: rivals.length,
      ufos: ufos.length,
      rambots: rambots.length,
      engineers: engineers.length,
      teslas: teslas.length,
      rockets: rockets.length,
      fighters: fighters.length
    };
    const mobCount = Object.keys(mobCounts).reduce(function (total, key) {
      return total + mobCounts[key];
    }, 0);

    updateLifeStats();

    return {
      active: runState.active,
      difficulty: runState.difficultyId,
      deathActive: deathState.active,
      player: {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        health: player.health,
        maxHealth: player.maxHealth,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        aimAngle: Math.atan2(getAim().world.y, getAim().world.x),
        aimLocalAngle: getAim().angle,
        landed: normalizeLandingSnapshot(player.landed),
        walkCycle: player.walkCycle,
        cameraRoll,
        bodyRotation: typeof playerSurfaceRotation === "function" ? playerSurfaceRotation() : 0,
        hitCooldown: player.hitCooldown,
        respawnInvulnerable: multiplayer.partyRespawnInvulnerableTimer
      },
      particles: {
        count: particles.length,
        totalMass: countWorldMass(particles),
        majorCount: majorBodies.length,
        majorMass: countWorldMass(majorBodies),
        largestMass: particles.reduce(function (largest, particle) {
          return Math.max(largest, finiteOr(particle.mass, 0));
        }, 0)
      },
      structures: {
        count: structures.length
      },
      mobs: Object.assign({
        total: mobCount
      }, mobCounts),
      score: {
        current: lifeStats.currentScore,
        best: lifeStats.bestScore,
        body: lifeStats.bodyScore,
        mob: lifeStats.mobScore
      },
      events: {
        particleMerges: clusternautsTestCounters.particleMerges,
        bodyBounces: clusternautsTestCounters.bodyBounces,
        buildMenuRenders: clusternautsTestCounters.buildMenuRenders,
        playerAbsorptions: lifeStats.absorbedParticleCount,
        mobsDefeated: lifeStats.mobsDefeated
      }
    };
  }

  function normalizeClusternautsTestPartyPlayers(players) {
    const source = Array.isArray(players) && players.length ? players : [player.id];
    return source.map((entry) => {
      if (typeof entry === "string") {
        return {
          playerId: entry,
          publicName: entry,
          online: true
        };
      }
      const playerId = String(entry && entry.playerId || "");
      return playerId
        ? {
            playerId,
            publicName: String(entry.publicName || playerId),
            online: entry.online !== false
          }
        : null;
    }).filter(Boolean);
  }

  function configureClusternautsTestParty(options) {
    const config = options || {};
    player.id = String(config.playerId || player.id || "local-player");
    multiplayer.universeId = "solo:" + player.id;
    multiplayer.partyHostId = String(config.hostPlayerId || player.id);
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    multiplayer.partySession = {
      id: String(config.sessionId || "test-party"),
      lobbyId: "",
      players: normalizeClusternautsTestPartyPlayers(config.players || [multiplayer.partyHostId, player.id]),
      pvpMode: String(config.pvpMode || "party-off"),
      netcodeVersion: Math.max(1, Math.floor(finiteOr(config.netcodeVersion, 1)))
    };
    multiplayer.partyMode = "party";
    multiplayer.partyPlayerSnapshots.clear();
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    multiplayer.duels.clear();
    multiplayer.anomaly = config.anomalyTeamId
      ? {
          id: "test-anomaly",
          teamId: String(config.anomalyTeamId),
          phase: "overlap",
          endsAt: Date.now() + 60000
        }
      : null;
  }

  function configureClusternautsTestPlayerState(options) {
    const config = options || {};
    if (Number.isFinite(Number(config.health))) {
      player.health = clamp(Number(config.health), 0, player.maxHealth);
    }
    if (Number.isFinite(Number(config.maxHealth))) {
      player.maxHealth = clamp(Number(config.maxHealth), 1, 100);
      player.health = clamp(player.health, 0, player.maxHealth);
    }
    if (Number.isFinite(Number(config.hitCooldown))) {
      player.hitCooldown = Math.max(0, Number(config.hitCooldown));
    }
    if (Number.isFinite(Number(config.maxEnergy))) {
      player.maxEnergy = clamp(Number(config.maxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
      player.energy = clamp(player.energy, 0, player.maxEnergy);
    }
    if (Number.isFinite(Number(config.energy))) {
      player.energy = clamp(Number(config.energy), 0, player.maxEnergy);
    }
    if (Number.isFinite(Number(config.respawnInvulnerable))) {
      multiplayer.partyRespawnInvulnerableTimer = Math.max(0, Number(config.respawnInvulnerable));
    }
  }

  function setClusternautsTestParticles(list) {
    particles.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const particle = normalizeParticleSnapshot(entry);
      if (particle) {
        particles.push(particle);
      }
    }
    nextParticleId = Math.max(
      nextParticleId,
      particles.reduce((largest, particle) => Math.max(largest, finiteOr(particle.id, 0) + 1), 1)
    );
    return particles.map(serializeParticle);
  }

  function setClusternautsTestTechPickups(list) {
    techPickups.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const pickup = normalizeTechPickupSnapshot(entry);
      if (pickup) {
        techPickups.push(pickup);
      }
    }
    nextTechPickupId = Math.max(
      nextTechPickupId,
      techPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );
    return techPickups.map(serializeTechPickup);
  }

  function setClusternautsTestHealthPickups(list) {
    healthPickups.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const pickup = normalizeHealthPickupSnapshot(entry);
      if (pickup) {
        healthPickups.push(pickup);
      }
    }
    nextHealthPickupId = Math.max(
      nextHealthPickupId,
      healthPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );
    return healthPickups.map(serializeHealthPickup);
  }

  function createClusternautsTestPartyState(config) {
    const source = config || {};
    const actor = source.actor && typeof source.actor === "object"
      ? {
          id: String(source.playerId || source.actor.id || "remote-player"),
          x: finiteOr(source.actor.x, 0),
          y: finiteOr(source.actor.y, 0),
          vx: finiteOr(source.actor.vx, 0),
          vy: finiteOr(source.actor.vy, 0),
          radius: finiteOr(source.actor.radius, player.radius),
          equippedTool: defaultToolId,
          toolMode: source.mode || "pull",
          energy: finiteOr(source.actor.energy, 100),
          landed: normalizeLandingSnapshot(source.actor.landed),
          aimAngle: finiteOr(source.actor.aimAngle, 0)
        }
      : {
          id: String(source.playerId || "remote-player"),
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: player.radius,
          equippedTool: defaultToolId,
          toolMode: source.mode || "pull",
          energy: 100,
          landed: null,
          aimAngle: finiteOr(source.aimAngle, 0)
        };
    const aimWorld = normalize(Math.cos(finiteOr(source.aimAngle, actor.aimAngle)), Math.sin(finiteOr(source.aimAngle, actor.aimAngle)));
    return {
      playerId: actor.id,
      seq: Math.max(0, Math.floor(finiteOr(source.seq, 0))),
      sentAt: finiteOr(source.sentAt, performance.now()),
      receivedAt: performance.now() - Math.max(0, finiteOr(source.receivedAgoMs, 0)),
      actor,
      aimWorld,
      funnel: actorFunnel(actor, aimWorld),
      left: source.mode !== "push" && source.mode !== "hold",
      middle: source.mode === "hold",
      right: source.mode === "push",
      active: source.active !== false,
      suckFactor: finiteOr(source.suckFactor, 1),
      blowFactor: finiteOr(source.blowFactor, 1),
      bucketActive: source.bucketActive !== false,
      bucketPadding: finiteOr(source.bucketPadding, 0),
      landedBodyId: Math.max(0, Math.floor(finiteOr(source.landedBodyId, actor.landed ? actor.landed.bodyId : 0))),
      mode: source.mode || "pull"
    };
  }

  function installClusternautsTestHarness() {
    if (!clusternautsTestConfig) {
      return;
    }

    window.__clusternautsTestHarness = {
      startRun: function (options) {
        const config = options || {};
        if (config.viewport) {
          window.innerWidth = Math.max(1, Math.floor(finiteOr(config.viewport.width, window.innerWidth || 1280)));
          window.innerHeight = Math.max(1, Math.floor(finiteOr(config.viewport.height, window.innerHeight || 720)));
        }
        resize();
        resetSoloMultiplayerSession();
        applyDifficulty(config.difficulty || defaultDifficultyId);
        resetLocalPlayerState();
        resetLocalWorldState();
        resetLifeStats();
        resetDeathState();
        resetClusternautsTestCounters();
        configureClusternautsTestInput(config.input);
        runState.active = true;
        gamePaused = false;
        persistence.enabled = false;
        multiplayer.enabled = false;
        setDifficultyScreenOpen(false);
        lastTime = performance.now();
        return createClusternautsFrameRateSnapshot();
      },
      setInput: function (input) {
        configureClusternautsTestInput(input);
      },
      requestLandingToggle: function () {
        return requestLandingToggle();
      },
      step: function (dt) {
        const seconds = Math.max(0, finiteOr(dt, 0));
        if (!runState.active) {
          return createClusternautsFrameRateSnapshot();
        }
        if (deathState.active) {
          updateDeath(seconds);
          return createClusternautsFrameRateSnapshot();
        }
        if (!gamePaused) {
          stepGameplaySimulation(seconds, { includeExternalSystems: false });
        }
        return createClusternautsFrameRateSnapshot();
      },
      frame: function (dt) {
        const seconds = Math.max(0, finiteOr(dt, 0));
        const now = performance.now();
        if (!runState.active) {
          return createClusternautsFrameRateSnapshot();
        }
        if (deathState.active) {
          updateDeath(seconds);
        } else if (!gamePaused) {
          stepGameplaySimulation(seconds, { includeExternalSystems: false });
        }
        updateRemoteVisualTransforms(seconds);
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
        return createClusternautsFrameRateSnapshot();
      },
      configureParty: function (options) {
        configureClusternautsTestParty(options);
        return createClusternautsFrameRateSnapshot();
      },
      startMultiplayerV2: function (options) {
        const source = options && typeof options === "object" ? options : {};
        if (!multiplayer.partySession) {
          configureClusternautsTestParty({ netcodeVersion: 2 });
        }
        multiplayer.partySession.netcodeVersion = 2;
        return startMultiplayerV2({
          roomId: String(source.roomId || multiplayer.partySession.id || "test-v2"),
          session: multiplayer.partySession,
          snapshot: source.snapshot || buildPersistentPayload(true)
        });
      },
      multiplayerV2State: function () {
        return multiplayer.v2.state && mpV2Sim ? mpV2Sim.serializeState(multiplayer.v2.state) : null;
      },
      setPlayerState: function (options) {
        configureClusternautsTestPlayerState(options);
        return createClusternautsFrameRateSnapshot();
      },
      advancePartyTimers: function (dt) {
        multiplayer.partyRespawnInvulnerableTimer = Math.max(0, multiplayer.partyRespawnInvulnerableTimer - Math.max(0, finiteOr(dt, 0)));
        return createClusternautsFrameRateSnapshot();
      },
      setDuel: function (playerId, enabled) {
        const id = String(playerId || "");
        if (id && enabled) {
          multiplayer.duels.add(id);
        } else if (id) {
          multiplayer.duels.delete(id);
        }
        return createClusternautsFrameRateSnapshot();
      },
      applyEntityEffect: function (message) {
        const source = message && typeof message === "object" ? message : {};
        applyRemoteEntityEffect({
          fromPlayerId: String(source.fromPlayerId || ""),
          fromTeamId: String(source.fromTeamId || ""),
          targetUniverseId: multiplayer.universeId,
          effect: source.effect || source
        });
        return createClusternautsFrameRateSnapshot();
      },
      setParticles: setClusternautsTestParticles,
      getParticles: function () {
        return particles.map(serializeParticle);
      },
      setTechPickups: setClusternautsTestTechPickups,
      getTechPickups: function () {
        return techPickups.map(serializeTechPickup);
      },
      setHealthPickups: setClusternautsTestHealthPickups,
      getHealthPickups: function () {
        return healthPickups.map(serializeHealthPickup);
      },
      localPhysicsOwner: function (type, id) {
        const session = localPartyPhysicsSession(type, id, performance.now());
        return session ? session.playerId || "" : "";
      },
      partyPhysicsOwner: function (type, id) {
        const session = partyPhysicsSession(type, id, performance.now());
        return session ? session.playerId || "" : "";
      },
      applyWorldSnapshot: function (world, options) {
        applyWorldSnapshot(world || {}, options || { smoothParticles: true, smoothEntities: true });
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyWorldSnapshot: function (message) {
        applyPartyWorldSnapshot(message || {});
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyPlayerSnapshot: function (message) {
        applyPartyPlayerSnapshot(message || {});
        return createClusternautsFrameRateSnapshot();
      },
      applyRemoteSnapshot: function (message) {
        applyRemoteSnapshot(message || {});
        updateRemoteVisualTransforms(0);
        return createClusternautsFrameRateSnapshot();
      },
      remotePlayerSnapshot: function (playerId) {
        const remote = multiplayer.remoteUniverses.get("solo:" + String(playerId || ""));
        return remote && remote.snapshot && remote.snapshot.player ? { ...remote.snapshot.player } : null;
      },
      setJoinedPlayerIsolation: function (options) {
        return configureJoinedPlayerIsolation(options || {});
      },
      joinedPlayerIsolation: function () {
        return {
          active: isJoinedPlayerIsolationActive(),
          enabled: joinedPlayerIsolation.enabled,
          components: { ...joinedPlayerIsolation.components }
        };
      },
      applyPartyPhysicsRequest: function (options) {
        const source = options && typeof options === "object" ? options : {};
        handlePartyPhysicsSessionRequest({
          type: source.messageType || "party.physics.start",
          fromPlayerId: String(source.playerId || "joiner"),
          entityType: source.entityType || "particle",
          entityId: source.entityId,
          seq: Math.max(0, Math.floor(finiteOr(source.seq, 1))),
          state: source.state || null,
          actor: source.actor || { id: String(source.playerId || "joiner"), x: 0, y: 0, vx: 0, vy: 0, radius: player.radius, equippedTool: defaultToolId, toolMode: source.mode || "pull", energy: 100, aimAngle: 0 },
          mode: source.mode || "pull",
          active: source.active !== false,
          reason: source.reason || ""
        });
        return {
          owner: source.entityType && source.entityId ? (partyPhysicsSession(source.entityType, source.entityId, performance.now()) || {}).playerId || "" : "",
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      endPartyPhysicsRequest: function (options) {
        const source = options && typeof options === "object" ? options : {};
        handlePartyPhysicsEndRequest({
          type: "party.physics.end",
          fromPlayerId: String(source.playerId || "joiner"),
          entityType: source.entityType || "particle",
          entityId: source.entityId,
          seq: Math.max(0, Math.floor(finiteOr(source.seq, 1))),
          state: source.state || null,
          actor: source.actor || { id: String(source.playerId || "joiner"), x: 0, y: 0, vx: 0, vy: 0, radius: player.radius, equippedTool: defaultToolId, toolMode: source.mode || "pull", energy: 100, aimAngle: 0 },
          mode: source.mode || "pull",
          active: source.active !== false,
          reason: source.reason || "ended"
        });
        return {
          owner: source.entityType && source.entityId ? (partyPhysicsSession(source.entityType, source.entityId, performance.now()) || {}).playerId || "" : "",
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyPhysicsAuthority: function (message) {
        applyPartyPhysicsAuthority(message || {});
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyPhysicsReject: function (message) {
        applyPartyPhysicsReject(message || {});
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      rememberBucketBodies: function (bodyIds) {
        return buildPartyInputSnapshot(multiplayer.partyInputSeq + 1);
      },
      previewPartyInput: function (seq) {
        return buildPartyInputSnapshot(Math.max(1, Math.floor(finiteOr(seq, multiplayer.partyInputSeq + 1))));
      },
      applyPartyGadgetForces: function (options) {
        const source = options && typeof options === "object" ? options : {};
        const state = createClusternautsTestPartyState(source);
        const body = bodyById(Math.max(1, Math.floor(finiteOr(source.bodyId, 0))));
        const changed = applyActorGadgetForces(body, state, Math.max(0, finiteOr(source.dt, 1 / 30)), source.forceOptions || {});
        return {
          changed,
          particles: particles.map(serializeParticle)
        };
      },
      mergeParticles: function () {
        mergeParticles();
        return particles.map(serializeParticle);
      },
      resolvePartyBucket: function (options) {
        const source = options && typeof options === "object" ? options : {};
        const state = createClusternautsTestPartyState(source);
        const body = bodyById(Math.max(1, Math.floor(finiteOr(source.bodyId, 0))));
        const changed = resolveActorFunnelBucket(body, state, Math.max(0, finiteOr(source.dt, 1 / 30)));
        return {
          changed,
          particles: particles.map(serializeParticle)
        };
      },
      snapshot: createClusternautsFrameRateSnapshot
    };
  }

  installClusternautsTestHarness();

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

  if (menuSoundToggle) {
    menuSoundToggle.addEventListener("click", function () {
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

      const sectionToggle = closestEventTarget(event, "[data-settings-section-toggle]");
      if (sectionToggle) {
        const sectionName = sectionToggle.dataset.settingsSectionToggle || "";
        const section = settingsPanel.querySelector("[data-settings-section=\"" + sectionName + "\"]");
        const shouldOpen = !(section && section.classList.contains("is-open"));
        setSettingsSectionOpen(sectionName, shouldOpen);
        return;
      }

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

  if (menuUiScaleInput) {
    menuUiScaleInput.addEventListener("input", function () {
      applyUiScale(Number(menuUiScaleInput.value) / 100);
      writeGameSettings();
    });
  }

  if (zoomInput) {
    zoomInput.addEventListener("input", function () {
      setCameraZoom(sliderValueToCameraZoom(zoomInput.value));
    });
  }

  if (menuZoomInput) {
    menuZoomInput.addEventListener("input", function () {
      setCameraZoom(sliderValueToCameraZoom(menuZoomInput.value));
    });
  }

  if (surfaceCameraRotationInput) {
    surfaceCameraRotationInput.addEventListener("change", function () {
      applySurfaceCameraRotationSetting(surfaceCameraRotationInput.checked);
    });
  }

  if (menuSurfaceCameraRotationInput) {
    menuSurfaceCameraRotationInput.addEventListener("change", function () {
      applySurfaceCameraRotationSetting(menuSurfaceCameraRotationInput.checked);
    });
  }

  if (touchScreenInput) {
    touchScreenInput.addEventListener("change", function () {
      applyTouchScreenSetting(touchScreenInput.checked);
    });
  }

  if (hudEnabledInput) {
    hudEnabledInput.addEventListener("change", function () {
      applyHudEnabledSetting(hudEnabledInput.checked);
    });
  }

  if (menuTouchScreenInput) {
    menuTouchScreenInput.addEventListener("change", function () {
      applyTouchScreenSetting(menuTouchScreenInput.checked);
    });
  }

  if (multiplayerToggleInput) {
    multiplayerToggleInput.addEventListener("change", function () {
      setFriendJoinsEnabled(multiplayerToggleInput.checked, "settings-toggle");
    });
  }

  if (multiplayerPanelToggle) {
    multiplayerPanelToggle.addEventListener("click", function () {
      setFriendJoinsEnabled(!multiplayer.friendJoinsEnabled, "panel-toggle");
    });
  }

  if (copySettingsJoinCodeButton) {
    copySettingsJoinCodeButton.addEventListener("click", function () {
      copyTextToClipboard(activePartyJoinCode(), "World code copied.");
      maybeNotifyText("World code copied.");
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

  if (restartGameButton) {
    restartGameButton.addEventListener("click", function () {
      setRestartGameConfirmOpen(true);
    });
  }

  if (restartGameSaveFirstButton) {
    restartGameSaveFirstButton.addEventListener("click", function () {
      void saveThenRestartGame();
    });
  }

  if (restartGameAnywayButton) {
    restartGameAnywayButton.addEventListener("click", function () {
      void restartGameFromSettings();
    });
  }

  if (restartGameCancelButton) {
    restartGameCancelButton.addEventListener("click", function () {
      setRestartGameConfirmOpen(false);
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

  if (menuResetControlsButton) {
    menuResetControlsButton.addEventListener("click", resetControlBindings);
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

  if (touchLandButton) {
    touchLandButton.addEventListener("click", function (event) {
      event.preventDefault();
      resetMouseButtons();
      requestLandingToggle();
      updateTouchLandButton();
    });
  }

  if (vitalsToggle) {
    vitalsToggle.addEventListener("click", function () {
      setVitalsHudOpen(!vitalsHudOpen);
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
      const action = closestEventTarget(event, "[data-menu-action]");
      if (action && action.dataset.menuAction) {
        event.preventDefault();
        handleStartMenuAction(action.dataset.menuAction, action);
        return;
      }

      const lobbyDifficultyToggleTarget = closestEventTarget(event, "#lobbyDifficultyToggle");
      if (lobbyDifficultyToggleTarget) {
        event.preventDefault();
        setLobbyDifficultyMenuOpen(!(lobbyDifficultySelect && lobbyDifficultySelect.classList.contains("is-open")));
        return;
      }

      const lobbyDifficulty = closestEventTarget(event, "[data-lobby-difficulty]");
      if (lobbyDifficulty && lobbyDifficulty.dataset.lobbyDifficulty) {
        event.preventDefault();
        setLobbyDifficulty(lobbyDifficulty.dataset.lobbyDifficulty);
        setLobbyDifficultyMenuOpen(false);
        return;
      }

      if (!closestEventTarget(event, ".lobby-difficulty-select")) {
        setLobbyDifficultyMenuOpen(false);
      }

      const invite = closestEventTarget(event, "[data-lobby-invite]");
      if (invite && invite.dataset.lobbyInvite) {
        event.preventDefault();
        sendMultiplayer({ type: "lobby.invite", targetPlayerId: invite.dataset.lobbyInvite });
        setLobbyStatus("Invite sent.", "success");
        return;
      }

      const kick = closestEventTarget(event, "[data-lobby-kick]");
      if (kick && kick.dataset.lobbyKick) {
        event.preventDefault();
        sendMultiplayer({ type: "lobby.kick", targetPlayerId: kick.dataset.lobbyKick });
        return;
      }

      const button = closestEventTarget(event, ".difficulty-card");
      if (!button || !button.dataset.difficulty) {
        return;
      }
      if (startMenu.view !== "difficulty") {
        return;
      }
      void beginRunWithDifficulty(button.dataset.difficulty);
    });
  }

  if (lobbyCodeInput) {
    lobbyCodeInput.addEventListener("keydown", function (event) {
      if (event.code === "Enter") {
        event.preventDefault();
        joinLobby(lobbyCodeInput.value);
      }
    });
  }

  if (lobbyPlayerSearch) {
    lobbyPlayerSearch.addEventListener("input", function () {
      window.clearTimeout(lobbyPlayerSearch._searchTimer);
      lobbyPlayerSearch._searchTimer = window.setTimeout(function () {
        void refreshLobbyPlayerSearch();
      }, 180);
    });
  }

  if (copyLobbyCodeButton) {
    copyLobbyCodeButton.addEventListener("click", function () {
      copyTextToClipboard(multiplayer.lobby && (multiplayer.lobby.code || multiplayer.lobby.id), "Lobby code copied.");
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
      if (isPartySessionActive()) {
        respawnMultiplayerPlayer();
      } else {
        void hardResetAfterDeath();
      }
    });
  }

  if (deathMainMenuButton) {
    deathMainMenuButton.addEventListener("click", function () {
      exitDeathToMainMenu();
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
        const selected = multiplayer.interactionMenu.choices[multiplayer.interactionMenu.selectedIndex];
        choosePlayerInteraction(selected && selected.key);
        return;
      }
      if (/^Digit[1-2]$/.test(event.code)) {
        event.preventDefault();
        const selected = multiplayer.interactionMenu.choices[Number(event.code.slice(5)) - 1];
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
        requestLandingToggle();
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
    updatePointerAimFromEvent(event);
  });

  window.addEventListener("pointerdown", beginTouchControl, { passive: false });
  window.addEventListener("pointermove", function (event) {
    if (!isTouchGameplayPointer(event)) {
      updatePointerAimFromEvent(event);
    }
    updateTouchControl(event);
  }, { passive: false });
  window.addEventListener("pointerup", endTouchControl, { passive: false });
  window.addEventListener("pointercancel", endTouchControl, { passive: false });
  window.addEventListener("selectstart", function (event) {
    if (gameSettings.touchScreen && !isEditableEventTarget(event)) {
      event.preventDefault();
    }
  });

  window.addEventListener("mousedown", function (event) {
    if (shouldSuppressSyntheticMouseEvent()) {
      event.preventDefault();
      return;
    }

    if (deathState.active || !runState.active) {
      return;
    }

    if (isGameplayPointerBlocked(event)) {
      return;
    }

    updatePointerAimFromEvent(event);

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
    if (shouldSuppressSyntheticMouseEvent()) {
      event.preventDefault();
      return;
    }

    if (deathState.active || !runState.active) {
      resetMouseButtons();
      return;
    }

    if (isGameplayPointerBlocked(event)) {
      return;
    }

    updatePointerAimFromEvent(event);

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

    if (isGameplayPointerBlocked(event)) {
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
    applyUiScale(gameSettings.uiScale);
    setCameraZoom(gameSettings.zoom);
    updateSurfaceCameraRotationUi();
    updateTouchScreenUi();
    updateHudEnabledUi();
    renderControlBindings();
    initializeTechUi();
    updateSoundToggle();
    resize();
    syncCompactHudControls();
    seedStarDust();
    seedParticles();
    applyDifficulty(defaultDifficultyId);
    resetLifeStats();
    setStartMenuView("main", { push: false });
    setDifficultyScreenOpen(true);
    void refreshLeaderboard(true);
    updateOnlineUi();
    updateAccountUi();
    setFriendJoinsEnabled(readMultiplayerPreference(), "startup", { persist: false, notify: false, startRun: false });
    void initializeCrazyGamesIntegration().then(function () {
      updateCrazyGamesGameplayState("sdk-ready");
    });

    if (!starDust.length) {
      seedStarDust();
    }
    if (!particles.length) {
      seedParticles();
    }

    lastTime = performance.now();
    requestAnimationFrame(tick);
  }

  if (!clusternautsTestConfig || !clusternautsTestConfig.skipAutoStart) {
    void startGame();
  }
}());
