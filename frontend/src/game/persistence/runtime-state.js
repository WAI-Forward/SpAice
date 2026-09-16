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
  const progressSaveAdapter = {
    dataModuleAvailable: false,
    lastLoadSource: "",
    lastSaveSource: "",
    dataModuleStatusLogged: false,
    localFallbackStatusLogged: false,
    dataModuleSaveLogged: false,
    localSaveLogged: false,
    loadFailureLoggedAt: -Infinity,
    saveFailureLoggedAt: -Infinity
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
    difficultyId: defaultDifficultyId,
    gameMode: "horde"
  };
  const startMenu = {
    view: "main",
    history: [],
    selectedGameMode: "horde",
    titles: {
      main: ["Clusternauts", "Clusternauts"],
      single: ["Single Player", "Choose Mode"],
      "single-options": ["Single Player", "Horde Mode"],
      load: ["Single Player", "Load Save"],
      difficulty: ["New Game", "Choose Difficulty"],
      multiplayer: ["Multiplayer", "Choose Mode"],
      "multiplayer-horde": ["Multiplayer", "Horde Mode"],
      "multiplayer-survival": ["Multiplayer", "Survival"],
      lobby: ["Multiplayer", "Lobby"],
      // build:render:start
      store: ["Store", "Store"],
      // build:render:end
      leaderboard: ["Leaderboard", "Top Runs"],
      settings: ["Settings", "Settings"]
    }
  };
  const storeFilterDefinitions = [
    { key: "suit", label: "Colours" },
    { key: "costume", label: "Costumes" },
    { key: "trail", label: "Trails" }
  ];
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
    submittedDeathKey: "",
    submittedCrazyGamesKey: "",
    filters: {
      mode: "all",
      difficulty: "all"
    }
  };
