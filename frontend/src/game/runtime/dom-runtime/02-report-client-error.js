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

    fetch(apiUrl("/api/client-error"), withBackendRequestOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    })).catch(function () {
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

  function backendRouteUrl(url) {
    const value = String(url || "");
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    if (shouldUseExternalBackend()) {
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
    if (isGamePixRuntime()) {
      return true;
    }
    return false;
  }

  function backendOrigin() {
    return configuredBackendOrigin() || defaultExternalBackendOrigin;
  }

  function configuredBackendOrigin() {
    return typeof window.CLUSTERNAUTS_BACKEND_ORIGIN === "string" ? window.CLUSTERNAUTS_BACKEND_ORIGIN.replace(/\/+$/, "") : "";
  }

  function withBackendRequestOptions(options) {
    const requestOptions = Object.assign({}, options || {});
    const headers = Object.assign({}, requestOptions.headers || {});
    if (shouldSkipNgrokBrowserWarning()) {
      headers[ngrokSkipBrowserWarningHeader] = "1";
    }
    requestOptions.headers = headers;
    if (shouldUseExternalBackend()) {
      requestOptions.credentials = "include";
    }
    return requestOptions;
  }

  function shouldSkipNgrokBrowserWarning() {
    if (!shouldUseExternalBackend()) {
      return false;
    }

    try {
      const host = new URL(backendOrigin()).hostname.toLowerCase();
      return host === "ngrok-free.app" || host.endsWith(".ngrok-free.app") || host === "ngrok.app" || host.endsWith(".ngrok.app");
    } catch {
      return false;
    }
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

  function isItchRuntime() {
    return Boolean(window.CLUSTERNAUTS_ITCH_BUILD) || isItchHost(window.location.hostname);
  }

  function isItchHost(hostName) {
    const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
    return host === "itch.io" || host.endsWith(".itch.io") || host === "itch.zone" || host.endsWith(".itch.zone");
  }

  function isGamePixRuntime() {
    return Boolean(window.CLUSTERNAUTS_GAMEPIX_BUILD) || isGamePixHost(window.location.hostname);
  }

  function isGamePixHost(hostName) {
    const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
    return (
      host === "gamepix.com" ||
      host.endsWith(".gamepix.com")
    );
  }

  function readSearchParam(name) {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return params.has(name) ? params.get(name) : null;
    } catch {
      return null;
    }
  }

  function parseBooleanSearchParam(value) {
    const normalized = String(value == null ? "" : value).trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
      return false;
    }
    return null;
  }

  function readLocalMuteAudioOverride() {
    if (!isLocalDevelopmentHost(window.location.hostname) && !(clusternautsTestConfig && clusternautsTestConfig.allowMuteAudioQueryParam)) {
      return null;
    }
    return parseBooleanSearchParam(readSearchParam("muteAudio"));
  }

  const mouse = {
    x: 0,
    y: 0,
    left: false,
    middle: false,
    right: false,
    seen: false
  };
  const gameplayPointerBlockSelector = ".build-menu, .tool-hotbar, .online-toggle, .sound-toggle, .settings-toggle, .settings-panel, .social-panel, .signal-panel, .command-panel, .player-interaction, .trade-panel, .container-panel, .trade-port-panel, .leaderboard-panel, .hud__leaderboard-toggle, .hud__land-action, .compact-hud-toggles, .map-filter, .touch-joystick, .tech-ledger, .notifications";
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
  const touchPinchState = {
    active: false,
    pointers: new Map(),
    startDistance: 0,
    startZoom: 0
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
    spacecraftInterior: null,
    walkCycle: 0,
    weaponSlow: 0,
    rocketSuitCharge: 0,
    rocketSuitActive: false
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
  const mobBeacons = [];
  const rivalProjectiles = [];
  const playerLasers = [];
  const launcherMissiles = [];
  const structures = [];
  const spacecrafts = [];
  const healthPickups = [];
  const techPickups = [];
  const targetParticles = 94;
  const playerFootOffset = 101;
  const rivalFootOffset = 32;
  const projectileDamageSpeed = 155;
  const rivalBodyImpactSpeed = 110;
  const bodyImpactRepeatDamageCooldown = 1.15;
  const bodyImpactBaseKnockback = 145;
  const bodyImpactMaxKnockback = 320;
  const bossBodyEvadeDuration = 1.05;
  const bossBodyEvadeMinSpeed = 520;
  const bossBodyEvadeMaxSpeed = 960;
  const solidBodyDamageSpeed = 92;
  const solidBodyPlayerDamageSpeed = 520;
  const weaponSlowDecay = 0.18;
  const weaponSlowMax = 0.58;
  const rivalProjectileSpeed = 430;
  const rivalShootRange = 1080;
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
  const teslaLightningRange = 830;
  const teslaLightningDamage = 8;
  const teslaToolDisableDuration = 3.2;
  const empToolId = "emp-tool";
  const familiarNetToolId = "familiar-net";
  const pistonPunchToolId = "piston-punch";
  const guidedLauncherToolId = "guided-launcher";
  const machineGunToolId = "machine-gun";
  const rocketSuitToolId = "rocket-suit";
  const personalTetherToolId = "personal-tether";
  const empPulseRange = 900;
  const empPulseDisableDuration = 4.8;
  const empPulseEnergyCost = 28;
  const empPulseCooldown = 7.5;
  const pistonPunchRange = 235;
  const pistonPunchDamage = 32;
  const pistonPunchKnockback = 520;
  const pistonPunchEnergyCost = 12;
  const pistonPunchCooldown = 0.72;
  const teslaBossEmpPulseRange = 620;
  const teslaBossEmpPulseDisableDuration = 4.8;
  const rocketImpactDamage = 24;
  const rocketImpactSpeed = 320;
  const rocketSuitEnergyDrain = 18;
  const rocketSuitBaseThrust = 760;
  const rocketSuitChargeThrust = 1680;
  const rocketSuitChargeRate = 0.82;
  const rocketSuitChargeDecay = 1.9;
  const rocketSuitBaseMaxSpeed = 520;
  const rocketSuitChargeMaxSpeed = 780;
  const rocketSuitMobDamage = 24;
  const rocketSuitMobDamageSpeedScale = 0.036;
  const rocketSuitMobKnockback = 330;
  const satelliteMissileSpeed = 730;
  const satelliteMissileDamage = 15;
  const satelliteLockDuration = 0.82;
  const satelliteVolleySpacing = 0.24;
  const satelliteVolleyCount = 3;
  const satelliteBossSeekingMissileCount = 3;
  const satelliteBossSeekingMissileSpeed = 500;
  const satelliteBossSeekingMissileTurnRate = 3.45;
  const satelliteBossSeekingMissileLife = 5.0;
  const rocketChargeDuration = 1.18;
  const rocketChargeCooldownMin = 1.25;
  const rocketChargeCooldownMax = 2.15;
  const rocketChargeMaxSpeed = 860;
  const fighterShootRange = 1080;
  const fighterShieldCycle = 10;
  const fighterShieldMaxCharge = 3;
  const structureMaxHealthByType = {
    "plating-block": 150,
    container: 140,
    "trading-port": 160,
    battery: 120,
    accumulator: 120,
    "shield-generator": 130,
    "communication-relay": 120,
    medbay: 135,
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
  const medbayHealRate = 4.5;
  const medbayEnergyDrain = 10;
  const healthPickupHeal = 8;
  const healthPickupLifetime = 18;
  const techPickupLifetime = 28;
  const mappedBodyThreshold = 10;
  const mobSpawnIntervals = {
    alienoid: 2 * 60,
    ufo: 3 * 60,
    rambot: 5 * 60,
    engineer: 7 * 60,
    tesla: 11 * 60,
    satellite: 13 * 60,
    rocket: 14 * 60,
    fighter: 16 * 60
  };
  const mobWaveInterval = mobSpawnIntervals.alienoid;
  const mobWaveStartingMobsPerPlayer = 3;
  const mobWaveGrowthWaves = 4;
  const mobWaveClumpMinRadius = 38;
  const mobWaveClumpMaxRadius = 175;
  const mobBeaconWarmupDuration = 60;
  const mobBeaconRespawnDuration = 5 * 60;
  const mobBeaconMinPlayerDistance = 2800;
  const mobBeaconMaxPlayerDistance = 6200;
