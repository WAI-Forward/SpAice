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
    player.spacecraftInterior = null;
    player.walkCycle = 0;
    cameraRoll = 0;
    gadgetAngle = -0.32;
    toolFireCooldown = 0;
    clearPlayerStatusEffects();
    playerContinuousEnergyLocked = false;
    familiarNetCapture = null;
    familiarNetSwingTimer = 0;
    familiarNetSwingDirection = -1;
    guidedLauncherState.activeMissile = null;
    clearPersonalTether({ notify: false });
    resetPlayerStatusBarState();

    for (const tech of techTypes) {
      techInventory[tech.key] = 0;
    }

    applyToolInventory([defaultToolId], defaultToolId, [defaultToolId]);
    applyToolUpgrades(null);
    updateTechUi();
    resetFrameClock();
  }

  function resetDeathState() {
    deathState.active = false;
    deathState.summaryReady = false;
    deathState.resetInFlight = false;
    deathState.leaderboardSubmitted = false;
    deathState.leaderboardEntryId = "";
    deathState.leaderboardCreatedAt = 0;
    deathState.leaderboardName = "";
    deathState.leaderboardSavePromise = null;
    deathState.leaderboardRenamePromise = null;
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

  function crazyGamesDataModule() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK) || window.CrazySDK;
    const data = sdk && sdk.data;
    if (
      data &&
      typeof data.getItem === "function" &&
      typeof data.setItem === "function"
    ) {
      return data;
    }
    return null;
  }

  async function initializeCrazyGamesProgressAdapter(reason) {
    if (!isCrazyGamesRuntime()) {
      return null;
    }

    try {
      await initializeCrazyGamesIntegration();
    } catch (error) {
      logCrazyGamesProgress("SDK init failed while preparing progress storage.", { reason, error }, "warn", "load");
    }

    await handleCrazyGamesAuthChange("progress-" + (reason || "refresh"));

    const data = crazyGamesDataModule();
    progressSaveAdapter.dataModuleAvailable = Boolean(data);
    if (data && !progressSaveAdapter.dataModuleStatusLogged) {
      progressSaveAdapter.dataModuleStatusLogged = true;
      console.info("[Clusternauts CrazyGames Data] Data Module available for progress saves.");
    } else if (!data && !progressSaveAdapter.localFallbackStatusLogged) {
      progressSaveAdapter.localFallbackStatusLogged = true;
      console.info("[Clusternauts CrazyGames Data] Data Module unavailable; using fallback progress storage.");
    }
    return data;
  }

  async function readGamePixProgressEnvelope() {
    const storage = gamePixLocalStorageModule();
    if (!storage) {
      return null;
    }

    try {
      const raw = await Promise.resolve(storage.getItem(crazyGamesProgressStorageKey));
      return parseCrazyGamesProgressEnvelope(raw, "gamepix-localStorage");
    } catch (error) {
      logCrazyGamesProgress("GamePix localStorage progress load failed.", error, "warn", "load");
      return null;
    }
  }

  async function writeGamePixProgressEnvelope(envelope) {
    const storage = gamePixLocalStorageModule();
    if (!storage) {
      return false;
    }

    try {
      await Promise.resolve(storage.setItem(crazyGamesProgressStorageKey, JSON.stringify(envelope)));
      return true;
    } catch (error) {
      logCrazyGamesProgress("GamePix localStorage progress save failed.", error, "warn", "save");
      return false;
    }
  }

  function logCrazyGamesProgress(message, details, level, kind) {
    const now = performance.now();
    const throttleKey = kind === "save" ? "saveFailureLoggedAt" : "loadFailureLoggedAt";
    if (level === "warn") {
      if (now - progressSaveAdapter[throttleKey] < 10000) {
        return;
      }
      progressSaveAdapter[throttleKey] = now;
    }

    const logger = level === "warn" && console.warn ? console.warn : console.info || console.log;
    if (details) {
      logger("[Clusternauts CrazyGames Data] " + message, details);
    } else {
      logger("[Clusternauts CrazyGames Data] " + message);
    }
  }

  function parseCrazyGamesProgressEnvelope(raw, source) {
    if (!raw) {
      return null;
    }

    try {
      const envelope = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!envelope || typeof envelope !== "object") {
        return null;
      }
      if (envelope.saveVersion !== crazyGamesProgressSaveVersion || envelope.game !== "clusternauts") {
        return null;
      }
      const payload = envelope.payload && typeof envelope.payload === "object" ? envelope.payload : null;
      if (!payload || (!payload.player && !payload.world)) {
        return null;
      }
      return {
        saveVersion: crazyGamesProgressSaveVersion,
        game: "clusternauts",
        savedAt: Math.max(0, Math.floor(finiteOr(envelope.savedAt, 0))),
        source: source || "",
        payload
      };
    } catch (error) {
      logCrazyGamesProgress("Could not parse saved progress.", { source, error }, "warn", "load");
      return null;
    }
  }

  function compactCrazyGamesProgressPayload(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    const compact = {
      playerId: String(source.playerId || player.id || ""),
      player: source.player && typeof source.player === "object" ? source.player : null,
      run: source.run && typeof source.run === "object" ? source.run : buildRunSnapshot()
    };

    if (source.world && typeof source.world === "object") {
      compact.world = Object.assign({}, source.world);
      delete compact.world.starDust;
      delete compact.world.rivalProjectiles;
    }

    return compact;
  }

  function buildCrazyGamesProgressEnvelope(includeWorld, previousEnvelope) {
    const payload = buildPersistentPayload(includeWorld);
    payload.run = buildRunSnapshot();

    if (!includeWorld && previousEnvelope && previousEnvelope.payload && previousEnvelope.payload.world) {
      payload.world = previousEnvelope.payload.world;
    }

    return {
      saveVersion: crazyGamesProgressSaveVersion,
      game: "clusternauts",
      savedAt: Date.now(),
      payload: compactCrazyGamesProgressPayload(payload)
    };
  }

  function applyCrazyGamesProgressEnvelope(envelope) {
    if (!envelope || !envelope.payload) {
      return false;
    }

    const payload = envelope.payload;
    applyPersistentPayload(Object.assign({ ok: true, universeId: "crazygames:" + player.id }, payload), { includePlayer: true });
    applyRunSnapshot(payload.run);
    return true;
  }

  function readLocalCrazyGamesProgressEnvelope() {
    try {
      return parseCrazyGamesProgressEnvelope(window.localStorage.getItem(crazyGamesProgressStorageKey), "localStorage");
    } catch (error) {
      logCrazyGamesProgress("Local progress fallback is unavailable.", error, "warn", "load");
      return null;
    }
  }

  function writeLocalCrazyGamesProgressEnvelope(envelope) {
    try {
      window.localStorage.setItem(crazyGamesProgressStorageKey, JSON.stringify(envelope));
      return true;
    } catch (error) {
      logCrazyGamesProgress("Could not write local fallback progress.", error, "warn", "save");
      return false;
    }
  }

  async function readCrazyGamesDataProgressEnvelope(data) {
    if (!data) {
      return null;
    }

    try {
      const raw = await Promise.resolve(data.getItem(crazyGamesProgressStorageKey));
      return parseCrazyGamesProgressEnvelope(raw, "crazygames-data");
    } catch (error) {
      logCrazyGamesProgress("Data Module progress load failed.", error, "warn", "load");
      return null;
    }
  }

  async function loadCrazyGamesProgressState() {
    const data = isCrazyGamesRuntime() ? await initializeCrazyGamesProgressAdapter("load") : null;

    return await withCrazyGamesLoading("progress-load", async function () {
      const dataEnvelope = isGamePixRuntime() ? await readGamePixProgressEnvelope() : await readCrazyGamesDataProgressEnvelope(data);
      const localEnvelope = readLocalCrazyGamesProgressEnvelope();
      const envelope = dataEnvelope || localEnvelope;

      if (!envelope) {
        return false;
      }

      if (applyCrazyGamesProgressEnvelope(envelope)) {
        progressSaveAdapter.lastLoadSource = envelope.source || "unknown";
        persistence.online = true;
        persistence.serverUnavailable = false;
        persistence.storage = progressSaveAdapter.lastLoadSource === "crazygames-data" ? "crazygames-data" : progressSaveAdapter.lastLoadSource === "gamepix-localStorage" ? "gamepix-localStorage" : "local";
        logCrazyGamesProgress("Loaded progress.", { source: progressSaveAdapter.lastLoadSource, savedAt: envelope.savedAt }, "info", "load");
        return true;
      }

      return false;
    });
  }

  async function saveCrazyGamesProgressState(includeWorld) {
    const data = isCrazyGamesRuntime() ? await initializeCrazyGamesProgressAdapter("save") : null;
    const previousEnvelope = isGamePixRuntime()
      ? await readGamePixProgressEnvelope() || readLocalCrazyGamesProgressEnvelope()
      : await readCrazyGamesDataProgressEnvelope(data) || readLocalCrazyGamesProgressEnvelope();
    const envelope = buildCrazyGamesProgressEnvelope(includeWorld, previousEnvelope);

    if (isGamePixRuntime() && await writeGamePixProgressEnvelope(envelope)) {
      progressSaveAdapter.lastSaveSource = "gamepix-localStorage";
      persistence.online = true;
      persistence.serverUnavailable = false;
      persistence.storage = "gamepix-localStorage";
      writeLocalCrazyGamesProgressEnvelope(envelope);
      if (!progressSaveAdapter.dataModuleSaveLogged) {
        progressSaveAdapter.dataModuleSaveLogged = true;
        logCrazyGamesProgress("Saved progress through GamePix localStorage.", { bytes: JSON.stringify(envelope).length }, "info", "save");
      }
      return true;
    }

    if (data) {
      try {
        await Promise.resolve(data.setItem(crazyGamesProgressStorageKey, JSON.stringify(envelope)));
        progressSaveAdapter.lastSaveSource = "crazygames-data";
        persistence.online = true;
        persistence.serverUnavailable = false;
        persistence.storage = "crazygames-data";
        writeLocalCrazyGamesProgressEnvelope(envelope);
        if (!progressSaveAdapter.dataModuleSaveLogged) {
          progressSaveAdapter.dataModuleSaveLogged = true;
          logCrazyGamesProgress("Saved progress through Data Module.", { bytes: JSON.stringify(envelope).length }, "info", "save");
        }
        return true;
      } catch (error) {
        logCrazyGamesProgress("Data Module progress save failed.", error, "warn", "save");
      }
    }

    if (writeLocalCrazyGamesProgressEnvelope(envelope)) {
      progressSaveAdapter.lastSaveSource = "localStorage";
      persistence.online = true;
      persistence.serverUnavailable = false;
      persistence.storage = "local";
      if (!progressSaveAdapter.localSaveLogged) {
        progressSaveAdapter.localSaveLogged = true;
        logCrazyGamesProgress("Saved progress through local fallback.", { bytes: JSON.stringify(envelope).length }, "info", "save");
      }
      return true;
    }

    return false;
  }

  async function loadPersistentState() {
    if (!persistence.enabled || persistence.loadInFlight) {
      return;
    }

    persistence.loadInFlight = true;

    try {
      if (isPlatformLocalSaveRuntime() && await loadCrazyGamesProgressState()) {
        return;
      }

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
      if (isPlatformLocalSaveRuntime()) {
        persistence.online = true;
        persistence.serverUnavailable = false;
        return;
      }

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
      if (isPlatformLocalSaveRuntime() && await saveCrazyGamesProgressState(includeWorld)) {
        return;
      }

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
