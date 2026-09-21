  const objectiveMetadataById = {
    create_rock: {
      icon: "R",
      hint: "Merge loose matter until one body becomes a rock.",
      progress: function () {
        return objectiveMassProgress("rock");
      }
    },
    create_boulder: {
      icon: "B",
      hint: "Keep merging matter until one body becomes a boulder.",
      progress: function () {
        return objectiveMassProgress("boulder");
      }
    },
    create_asteroid: {
      icon: "A",
      hint: "Grow a body into an asteroid.",
      progress: function () {
        return objectiveMassProgress("asteroid");
      }
    },
    create_moon: {
      icon: "M",
      hint: "Grow a body into a moon.",
      progress: function () {
        return objectiveMassProgress("moon");
      }
    },
    create_planet: {
      icon: "P",
      hint: "Grow a body into a planet.",
      progress: function () {
        return objectiveMassProgress("planet");
      }
    },
    create_star: {
      icon: "S",
      hint: "Collapse a planet into a star.",
      progress: function () {
        return objectiveMassProgress("star");
      }
    },
    create_white_dwarf: {
      icon: "W",
      hint: "Evolve a star into a white dwarf by keeping its growth rate below 80 per second.",
      progress: function () {
        return objectiveCreatedTierProgress("white dwarf");
      }
    },
    create_neutron_star: {
      icon: "N",
      hint: "Evolve a star into a neutron star with a growth rate from 80 to 220 per second.",
      progress: function () {
        return objectiveCreatedTierProgress("neutron star");
      }
    },
    create_black_hole: {
      icon: "B",
      hint: "Evolve a star into a black hole by raising its growth rate above 220 per second.",
      progress: function () {
        return objectiveCreatedTierProgress("black hole");
      }
    },
    reach_speed_520: {
      icon: ">",
      hint: "Break 520 speed on the map speedometer.",
      progress: function () {
        return objectiveSpeedProgress(520);
      }
    },
    reach_speed_1000: {
      icon: ">>",
      hint: "Break 1000 speed with boost, jets, or a fast ride.",
      progress: function () {
        return objectiveSpeedProgress(1000);
      }
    },
    reach_speed_2000: {
      icon: ">>>",
      hint: "Break 2000 speed with advanced propulsion.",
      progress: function () {
        return objectiveSpeedProgress(2000);
      }
    },
    reach_growth_rate_10: {
      icon: "+",
      hint: "Raise the Growth tracker in the HUD above 10 per second.",
      progress: function () {
        return objectiveGrowthRateProgress(10);
      }
    },
    kill_3_alienoids: objectiveMobMetadata("alienoid"),
    kill_3_ufos: objectiveMobMetadata("ufo"),
    kill_3_rambots: objectiveMobMetadata("rambot"),
    kill_3_teslas: objectiveMobMetadata("tesla"),
    kill_3_engineers: objectiveMobMetadata("engineer"),
    kill_3_satellites: objectiveMobMetadata("satellite"),
    kill_3_fighters: objectiveMobMetadata("fighter"),
    kill_3_rockets: objectiveMobMetadata("rocket"),
    kill_alienoid_boss: objectiveBossMetadata("alienoid"),
    kill_ufo_boss: objectiveBossMetadata("ufo"),
    kill_rambot_boss: objectiveBossMetadata("rambot"),
    kill_tesla_boss: objectiveBossMetadata("tesla"),
    kill_engineer_boss: objectiveBossMetadata("engineer"),
    kill_satellite_boss: objectiveBossMetadata("satellite"),
    kill_fighter_boss: objectiveBossMetadata("fighter"),
    kill_rocket_boss: objectiveBossMetadata("rocket"),
    make_laser_pistol: {
      icon: "P",
      hint: "Unlock the laser pistol from the build menu.",
      progress: function () {
        return objectiveToolProgress("laser-pistol");
      }
    },
    create_spanner: {
      icon: "S",
      hint: "Unlock the spanner from the build menu.",
      progress: function () {
        return objectiveToolProgress("spanner");
      }
    },
    create_rifle: {
      icon: "R",
      hint: "Unlock the laser rifle from the build menu.",
      progress: function () {
        return objectiveToolProgress("laser-rifle");
      }
    },
    create_turret: {
      icon: "T",
      hint: "Build a turret on a planet.",
      progress: function () {
        return objectiveStructureProgress("turret");
      }
    },
    create_accumulator: {
      icon: "A",
      hint: "Build an accumulator.",
      progress: function () {
        return objectiveStructureProgress("accumulator");
      }
    }
  };
  const objectiveDefinitions = progressionTree.nodes.map(function (node) {
    const metadata = objectiveMetadataById[node.id] || {};
    return {
      ...node,
      title: node.label,
      icon: metadata.icon,
      hint: metadata.hint || node.label,
      parent: node.prerequisites && node.prerequisites[0] ? node.prerequisites[0] : "",
      progress: metadata.progress
    };
  });
  const randomEventDefinitions = [];
  const randomEventDefaultCooldown = 300;
  const randomEventMinimumCooldown = 240;
  const randomEventState = {
    enabled: true,
    cooldown: randomEventDefaultCooldown,
    timer: randomEventDefaultCooldown,
    active: null,
    history: []
  };
  const particleStormEventId = "particle-storm";
  const meteorShowerEventId = "meteor-shower";
  const particleStormMapColor = { r: 88, g: 226, b: 255 };
  const meteorShowerMapColor = { r: 255, g: 166, b: 86 };
  const particleStormSettings = {
    duration: 52,
    radiusMin: 1350,
    radiusMax: 1900,
    initialCount: 12,
    maxActiveParticles: 32,
    spawnInterval: 0.58
  };
  const meteorShowerSettings = {
    duration: 46,
    radiusMin: 2000,
    radiusMax: 2800,
    initialCount: 4,
    maxActiveParticles: 12,
    spawnInterval: 0.95
  };
  const particleSpawnTransitionDuration = 0.52;
  const starBirthTransitionDuration = 1.35;
  const starParticleEmissionBaseRate = 0.65;
  const starParticleEmissionRadiusScale = 0.012;
  const starParticleEmissionMaxPerFrame = 4;
  const starContactDamagePerSecond = 34;
  const starContactDamageCooldown = 0.55;
  const starContactKnockback = 260;
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
  const gadgetPushReach = 470;
  const gadgetStabilizedBreakSpeed = 18;
  const soundPreferenceKey = "clusternauts.sound.enabled";
  const legacySoundPreferenceKey = "spaice.sound.enabled";
  const soundState = {
    enabled: readSoundPreference(),
    platformMuted: false,
    context: null,
    masterGain: null,
    unavailable: false,
    unlocked: false,
    resumePending: false,
    lastPlayed: Object.create(null)
  };

  let width = 1;
  let height = 1;
  let dpr = 1;
  let cameraZoom = gameSettings.zoom;
  let cameraRoll = 0;
  let gadgetAngle = -0.32;
  let lastTime = performance.now();
  const soloSimulationTickDt = 1 / 60;
  const soloSimulationMaxFrameDt = 0.1;
  const soloSimulationMaxAccumulator = soloSimulationTickDt * 5;
  const soloSimulationMaxCatchUpSteps = 4;
  let soloSimulationAccumulator = 0;
  let spawnTimer = 0;
  let nextParticleId = 1;
  let nextRivalId = 1;
  let nextUfoId = 1;
  let nextRambotId = 1;
  let nextEngineerId = 1;
  let nextTeslaId = 1;
  let nextRocketId = 1;
  let nextFighterId = 1;
  let nextMobBeaconId = 1;
  let nextSurvivalCampId = 1;
  let nextStructureId = 1;
  let nextSpacecraftId = 1;
  let nextRivalProjectileId = 1;
  let nextTechPickupId = 1;
  let nextHealthPickupId = 1;
  let jumpQueued = false;
  let buildMenuOpen = false;
  let activePlacementRecipeId = null;
  let pendingTetherAnchor = null;
  let activeBuildFilter = "all";
  let selectedBuildRecipeId = buildRecipes[0] ? buildRecipes[0].id : null;
  let ownedSkinIds = [];
  let equippedSkinId = "";
  let ownedTrailIds = [];
  let equippedTrailId = "";
  let storePreviewSkinId = "";
  let activeStoreFilters = new Set(storeFilterDefinitions.map((filter) => filter.key));
  let storePreviewAnimationFrameId = 0;
  let skinPurchasePendingId = "";
  let skinStatusMessage = "";
  let skinRefreshInFlight = false;
  let unlockedToolIds = [defaultToolId];
  let hotbarToolIds = [defaultToolId];
  let equippedToolId = defaultToolId;
  let toolUpgradeLevels = createDefaultToolUpgradeLevels();
  let toolFireCooldown = 0;
  let toolDisabledTimer = 0;
  const playerStatusEffects = {
    disabled: 0
  };
  const playerStatusEffectMaxDurations = {
    disabled: 0
  };
  let playerContinuousEnergyLocked = false;
  let familiarNetCapture = null;
  let familiarNetSwingTimer = 0;
  let familiarNetSwingDirection = -1;
  const guidedLauncherState = {
    activeMissile: null
  };
  const personalTetherState = {
    bodyId: 0,
    angle: 0,
    surfaceOffset: 0,
    restLength: 0,
    deploy: 0,
    wobble: 0
  };
  const playerStatusBarState = {
    health: { value: null, variant: "", changedAt: 0, fullAt: 0 },
    energy: { value: null, variant: "", changedAt: 0 }
  };

  function resetPlayerStatusBarState() {
    playerStatusBarState.health.value = null;
    playerStatusBarState.health.variant = "";
    playerStatusBarState.health.changedAt = 0;
    playerStatusBarState.health.fullAt = 0;
    playerStatusBarState.energy.value = null;
    playerStatusBarState.energy.variant = "";
    playerStatusBarState.energy.changedAt = 0;
  }

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
  let mobWaveTimer = mobWaveInterval;
  let mobWaveCount = 0;
  let mobSpawnRestTimer = 0;
  let mobSpawnRestDrainTimer = 0;
  let mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
  const survivalSpawnState = {
    nextCampCheckTick: 0,
    exploredInitialized: false,
    exploredMinX: 0,
    exploredMaxX: 0,
    exploredMinY: 0,
    exploredMaxY: 0,
    engagements: {}
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
  const mobBossDefeatsByKind = {
    alienoid: 0,
    ufo: 0,
    rambot: 0,
    tesla: 0,
    engineer: 0,
    satellite: 0,
    rocket: 0,
    fighter: 0
  };
  const mobBossProgressByKind = {
    alienoid: 0,
    ufo: 0,
    rambot: 0,
    tesla: 0,
    engineer: 0,
    satellite: 0,
    rocket: 0,
    fighter: 0
  };
  const mobBossWarnings = {};
  for (const kind of mobTierOrder) {
    mobBossWarnings[kind] = {
      active: false,
      timer: 0,
      lastNoticeSecond: -1
    };
  }

  for (const tech of techTypes) {
    techInventory[tech.key] = 0;
  }

  function resetRenderPerformance() {
    renderPerformance.frameId = 0;
    renderPerformance.quality = 1;
    renderPerformance.recoveryDelay = 0;
    renderPerformance.lastFrameDt = 1 / 60;
    resetRenderBudgets();
  }

  function resetFrameClock(now) {
    lastTime = finiteOr(now, performance.now());
    soloSimulationAccumulator = 0;
    if (typeof invalidateRenderCaches === "function") {
      invalidateRenderCaches();
    }
  }

  function beginRenderFrame(frameDt) {
    const dt = clamp(finiteOr(frameDt, 1 / 60), 0, 0.25);
    renderPerformance.frameId += 1;
    renderPerformance.lastFrameDt = dt;

    const slowFrameDt = 1 / 45;
    const verySlowFrameDt = 1 / 30;
    const targetQuality = dt >= verySlowFrameDt ? 0.48 : dt >= slowFrameDt ? 0.68 : 1;

    if (targetQuality < renderPerformance.quality) {
      renderPerformance.quality += (targetQuality - renderPerformance.quality) * 0.55;
      renderPerformance.recoveryDelay = 0.75;
    } else if (renderPerformance.recoveryDelay > 0) {
      renderPerformance.recoveryDelay = Math.max(0, renderPerformance.recoveryDelay - dt);
    } else {
      renderPerformance.quality += (1 - renderPerformance.quality) * 0.035;
    }

    renderPerformance.quality = clamp(renderPerformance.quality, 0.42, 1);
    resetRenderBudgets();
  }

  function resetRenderBudgets() {
    const quality = renderQuality();
    renderBudgets.tinyParticleGlows = Math.round(18 + quality * 48);
    renderBudgets.bodyGlows = Math.round(8 + quality * 22);
  }

  function renderQuality() {
    return clamp(finiteOr(renderPerformance.quality, 1), 0.42, 1);
  }

  function currentRenderFrameId() {
    return renderPerformance.frameId;
  }

  function renderQualityBelow(threshold) {
    return renderQuality() < finiteOr(threshold, 1);
  }

  function consumeTinyParticleGlowBudget() {
    if (renderBudgets.tinyParticleGlows <= 0) {
      return false;
    }
    renderBudgets.tinyParticleGlows -= 1;
    return true;
  }

  function consumeBodyGlowBudget() {
    if (renderBudgets.bodyGlows <= 0) {
      return false;
    }
    renderBudgets.bodyGlows -= 1;
    return true;
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
