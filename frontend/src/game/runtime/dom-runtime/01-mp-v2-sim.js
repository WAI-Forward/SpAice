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
  const developerOverlay = document.getElementById("developerOverlay");
  const developerMetricsText = document.getElementById("developerMetricsText");
  const developerMetricsCopy = document.getElementById("developerMetricsCopy");
  const developerMetricsCopyStatus = document.getElementById("developerMetricsCopyStatus");
  const touchLandButton = document.getElementById("touchLandButton");
  const currentBodyLabel = document.getElementById("currentBodyLabel");
  const nextMilestoneLabel = document.getElementById("nextMilestoneLabel");
  const nextMilestoneValue = document.getElementById("nextMilestoneValue");
  const milestoneFill = document.getElementById("milestoneFill");
  const milestoneStellarFill = document.getElementById("milestoneStellarFill");
  const milestoneSplit = document.getElementById("milestoneSplit");
  const stellarRateLabel = document.getElementById("stellarRateLabel");
  const growthRateValue = document.getElementById("growthRateValue");
  const playerStatusEffectsHud = document.getElementById("playerStatusEffects");
  const leaderboardToggle = document.getElementById("leaderboardToggle");
  const leaderboardPanel = document.getElementById("leaderboardPanel");
  const leaderboardList = document.getElementById("leaderboardList");
  const leaderboardModeFilter = document.getElementById("leaderboardModeFilter");
  const leaderboardDifficultyFilter = document.getElementById("leaderboardDifficultyFilter");
  const vitalsToggle = document.getElementById("vitalsToggle");
  const resourcesToggle = document.getElementById("resourcesToggle");
  const buildToggle = document.getElementById("buildToggle");
  const objectiveToggle = document.getElementById("objectiveToggle");
  const objectiveTree = document.getElementById("objectiveTree");
  const objectiveTreeList = document.getElementById("objectiveTreeList");
  const objectiveTreeDetail = document.getElementById("objectiveTreeDetail");
  const objectiveTreeClose = document.getElementById("objectiveTreeClose");
  const objectiveSummary = document.getElementById("objectiveSummary");
  const objectiveClaimAll = document.getElementById("objectiveClaimAll");
  const mapToggle = document.getElementById("mapToggle");
  const mapMinimumBodyControl = document.getElementById("mapMinimumBodyControl");
  const mapMinimumBodyFilter = document.getElementById("mapMinimumBodyFilter");
  const mapMaximumBodyFilter = document.getElementById("mapMaximumBodyFilter");
  const mapSpeedometer = document.getElementById("mapSpeedometer");
  const mapSpeedValue = document.getElementById("mapSpeedValue");
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
  const dynamicLightingInput = document.getElementById("dynamicLightingInput");
  const surfaceCameraRotationInput = document.getElementById("surfaceCameraRotationInput");
  const touchScreenInput = document.getElementById("touchScreenInput");
  const hudEnabledInput = document.getElementById("hudEnabledInput");
  const playerHealthBarInput = document.getElementById("playerHealthBarInput");
  const playerEnergyBarInput = document.getElementById("playerEnergyBarInput");
  const settingsJoinCodeValue = document.getElementById("settingsJoinCodeValue");
  const copySettingsJoinCodeButton = document.getElementById("copySettingsJoinCodeButton");
  const multiplayerStatus = document.getElementById("multiplayerStatus");
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
  const startMenuPanel = difficultyScreen ? difficultyScreen.querySelector(".start-menu") : null;
  const startMenuBack = document.getElementById("startMenuBack");
  const startMenuEyebrow = document.getElementById("startMenuEyebrow");
  const startMenuTitle = document.getElementById("startMenuTitle");
  const startMenuAccount = document.getElementById("startMenuAccount");
  const startMenuAccountLabel = document.getElementById("startMenuAccountLabel");
  const startMenuAccountName = document.getElementById("startMenuAccountName");
  const startMenuAccountLogoutButton = document.getElementById("startMenuAccountLogoutButton");
  const menuLeaderboardList = document.getElementById("menuLeaderboardList");
  const menuLeaderboardModeFilter = document.getElementById("menuLeaderboardModeFilter");
  const menuLeaderboardDifficultyFilter = document.getElementById("menuLeaderboardDifficultyFilter");
  const startSavedGameList = document.getElementById("startSavedGameList");
  const startStoreStatus = document.getElementById("startStoreStatus");
  const startStoreFilters = document.getElementById("startStoreFilters");
  const startStoreList = document.getElementById("startStoreList");
  const startStorePreviewCanvas = document.getElementById("startStorePreviewCanvas");
  const startStorePreviewName = document.getElementById("startStorePreviewName");
  const startStorePreviewMeta = document.getElementById("startStorePreviewMeta");
  const lobbyCodeInput = document.getElementById("lobbyCodeInput");
  const joinLobbyButton = document.getElementById("joinLobbyButton");
  const sharedWorldStats = document.getElementById("sharedWorldStats");
  const sharedWorldStatus = document.getElementById("sharedWorldStatus");
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
  const menuDynamicLightingInput = document.getElementById("menuDynamicLightingInput");
  const menuSurfaceCameraRotationInput = document.getElementById("menuSurfaceCameraRotationInput");
  const menuTouchScreenInput = document.getElementById("menuTouchScreenInput");
  const menuPlayerHealthBarInput = document.getElementById("menuPlayerHealthBarInput");
  const menuPlayerEnergyBarInput = document.getElementById("menuPlayerEnergyBarInput");
  const menuControlBindingsList = document.getElementById("menuControlBindingsList");
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
  const containerPanel = document.getElementById("containerPanel");
  const containerName = document.getElementById("containerName");
  const containerClose = document.getElementById("containerClose");
  const containerPlayerList = document.getElementById("containerPlayerList");
  const containerStoredList = document.getElementById("containerStoredList");
  const containerStatus = document.getElementById("containerStatus");
  const tradePortPanel = document.getElementById("tradePortPanel");
  const tradePortName = document.getElementById("tradePortName");
  const tradePortClose = document.getElementById("tradePortClose");
  const tradePortOfferList = document.getElementById("tradePortOfferList");
  const tradePortBuyList = document.getElementById("tradePortBuyList");
  const tradePortPayList = document.getElementById("tradePortPayList");
  const tradePortPlayerList = document.getElementById("tradePortPlayerList");
  const tradePortStoredList = document.getElementById("tradePortStoredList");
  const tradePortAddOffer = document.getElementById("tradePortAddOffer");
  const tradePortRemoveOffer = document.getElementById("tradePortRemoveOffer");
  const tradePortStatus = document.getElementById("tradePortStatus");
  const deathScreen = document.getElementById("deathScreen");
  const deathStatsList = document.getElementById("deathStatsList");
  const deathLeaderboardForm = document.getElementById("deathLeaderboardForm");
  const deathRunNameInput = document.getElementById("deathRunNameInput");
  const deathLeaderboardButton = document.getElementById("deathLeaderboardButton");
  const deathLeaderboardStatus = document.getElementById("deathLeaderboardStatus");
  const playAgainButton = document.getElementById("playAgainButton");
  const deathMainMenuButton = document.getElementById("deathMainMenuButton");
  const defaultExternalBackendOrigin = "";
  const ngrokSkipBrowserWarningHeader = "Ngrok-Skip-Browser-Warning";
  const crazyGamesSdkUrl = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
  const crazyGamesSdkLoadTimeoutMs = 5000;
  const serverMaintenanceMessage = "Server is down for maintenance.  Please try again later";
  const gamePixEventTargetOrigin = "*";
  const crazyGamesState = {
    sdk: null,
    initPromise: null,
    sdkLoadPromise: null,
    initialized: false,
    muteAudio: false,
    gameplayActive: false,
    gameplayEventsDisabled: false,
    loadingActive: false,
    loadingEventsDisabled: false,
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
  const gamePixState = {
    gameplayActive: false,
    loadingActive: false,
    lastScore: null,
    lastLevel: "",
    submittedScoreKey: "",
    eventWarnings: Object.create(null)
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
  const renderPerformance = {
    frameId: 0,
    quality: 1,
    recoveryDelay: 0,
    lastFrameDt: 1 / 60
  };
  const renderBudgets = {
    tinyParticleGlows: 0,
    bodyGlows: 0
  };
  let lastClientErrorReportAt = -Infinity;
  let lastServerMaintenanceNoticeAt = -Infinity;
  let pendingWaiLoginAttemptId = "";
  let authDebugPollTimer = 0;
  let authDebugPollStartedAt = 0;
  let authDebugSeenEventCount = 0;

  installClientErrorReporting();

  const keys = new Set();
  const settingsStorageKey = "clusternauts.settings";
  const legacySettingsStorageKey = "spaice.settings";
  const manualSaveStoragePrefix = "clusternauts.manualSave.";
  const legacyManualSaveStoragePrefix = "spaice.manualSave.";
  const crazyGamesProgressStorageKey = "clusternauts.progress.autosave";
  const crazyGamesManualSaveIndexPrefix = "clusternauts.crazygames.manualSaves.index.";
  const crazyGamesManualSavePayloadPrefix = "clusternauts.crazygames.manualSaves.payload.";
  const crazyGamesProgressSaveVersion = 1;
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
    build: "KeyR",
    objectives: "KeyO",
    zoomIn: "WheelUp",
    zoomOut: "WheelDown",
    previousTool: "",
    nextTool: ""
  };
  const directControlActions = ["zoomIn", "zoomOut", "previousTool", "nextTool"];
  const controlBindingLabels = [
    { action: "up", label: "Move up" },
    { action: "down", label: "Move down" },
    { action: "left", label: "Move left" },
    { action: "right", label: "Move right" },
    { action: "rollLeft", label: "Roll left" },
    { action: "rollRight", label: "Roll right" },
    { action: "land", label: "Land / take off" },
    { action: "build", label: "Build menu" },
    { action: "objectives", label: "Objective tree" },
    { action: "zoomIn", label: "Zoom in" },
    { action: "zoomOut", label: "Zoom out" },
    { action: "previousTool", label: "Previous hotbar tool" },
    { action: "nextTool", label: "Next hotbar tool" }
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
  let objectivesOpen = false;
  let mapHudOpen = false;
  const developerMetricsRefreshMs = 250;
  const developerMetricsState = {
    open: false,
    lastUpdateAt: -Infinity,
    lastText: "",
    copyStatusClearAt: 0
  };
  const objectiveState = {
    completed: Object.create(null),
    claimed: Object.create(null),
    createdBodyMass: 0,
    maxTravelSpeed: 0,
    maxGrowthRate: 0,
    builtStructures: Object.create(null),
    renderSignature: "",
    selectedId: "",
    newlyCompleted: [],
    lastUpdateFrameId: -1000,
    scrollLeft: 0,
    scrollTop: 0,
    hasUserPanned: false,
    zoom: 1
  };
  const objectiveGraphLayout = Object.freeze({
    rootId: "create_rock",
    padding: 150,
    firstOrbitRadius: 148,
    orbitGap: 132,
    minimumRadius: 300,
    rootBranchAngles: Object.freeze({
      celestial_body: -90,
      speed: -156,
      growth_rate: -124,
      mob: -8,
      boss: 28,
      tool: 72,
      structure: 118
    }),
    categoryArcOffsets: Object.freeze({
      celestial_body: 0,
      speed: 0,
      growth_rate: 0,
      mob: 0,
      boss: 48,
      tool: -58,
      structure: 70
    }),
    categoryOrder: Object.freeze(["speed", "growth_rate", "celestial_body", "mob", "boss", "tool", "structure"]),
    siblingArcStep: 82,
    maxSiblingArcSpread: 248,
    minimumNodeArcGap: 112
  });
  const techLedgerDrag = {
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0
  };
  const objectiveTreePan = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    scale: 1
  };
  const accountState = {
    token: "",
    username: "",
    displayName: "",
    waiBirthdayMonthDay: "",
    saves: [],
    currentSaveId: "",
    currentSaveName: "",
    currentSaveUsername: "",
    busy: false,
    savesLoading: false,
    sessionLoading: true,
    waiLinked: false,
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
