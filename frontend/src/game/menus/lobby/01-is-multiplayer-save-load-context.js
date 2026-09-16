  function isMultiplayerSaveLoadContext() {
    return Boolean(
      startMenu.history.includes("multiplayer") ||
      startMenu.history.includes("multiplayer-horde") ||
      startMenu.history.includes("lobby") ||
      multiplayer.lobby
    );
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
    if (action === "single-horde") {
      setSelectedGameMode("horde");
      setStartMenuView("single-options");
      return;
    }
    if (action === "single-survival") {
      setSelectedGameMode("survival");
      setStartMenuView("single-options");
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
    if (action === "delete-save") {
      void deleteManualGame(sourceElement && sourceElement.dataset.saveId);
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
    if (action === "multiplayer-horde") {
      setSelectedGameMode("horde");
      setStartMenuView("multiplayer-horde");
      return;
    }
    if (action === "multiplayer-survival") {
      setSelectedGameMode("survival");
      setStartMenuView("multiplayer-survival");
      return;
    }
    if (action === "store") {
      if (isSkinStoreRuntime()) {
        setStartMenuView("store");
      }
      return;
    }
    if (action === "buy-skin" || action === "equip-skin") {
      const skin = skinById(sourceElement && sourceElement.dataset.skinId);
      if (skin) {
        setStorePreviewSkin(skin.id);
        activateSkinRecipe(skin);
      }
      return;
    }
    if (action === "leaderboard") {
      setStartMenuView("leaderboard");
      return;
    }
    if (action === "multiplayer-load-game") {
      setStartMenuView("load");
      return;
    }
    if (action === "join-shared-world") {
      setSelectedGameMode("survival");
      joinSharedWorld();
      return;
    }
    if (action === "create-lobby") {
      setSelectedGameMode("horde");
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
    resetFrameClock();
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
    if (isPlatformLocalSaveRuntime() && !isAccountSignedIn()) {
      return await loadLobbyCrazyGamesSave(cleanSaveId);
    }
    if (!isAccountSignedIn()) {
      setLobbyStatus(isPlatformLocalSaveRuntime() ? "Guest progress is already available." : "Log in to use saved worlds.", "error");
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

  async function loadLobbyCrazyGamesSave(saveId) {
    const cleanSaveId = String(saveId || "").trim();
    if (!cleanSaveId) {
      setLobbyStatus("Choose a saved world.", "error");
      return;
    }

    try {
      const payload = parseCrazyGamesManualSavePayload(await readCrazyGamesStorageItem(crazyGamesManualSavePayloadKey(cleanSaveId)));
      const saves = await readCrazyGamesManualSaveIndex();
      const metadata = saves.find((entry) => entry && entry.id === cleanSaveId);
      const saveName = metadata && metadata.name ? metadata.name : "saved world";
      if (!payload || typeof payload !== "object" || !payload.player || !payload.world) {
        setLobbyStatus("Could not use this save.", "error");
        return;
      }

      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      resetDeathState();
      applyPersistentPayload(Object.assign({ ok: true, universeId: platformLocalUniverseId() }, payload), { includePlayer: true });
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
      console.warn("Platform local lobby save load failed.", error);
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

  function setSharedWorldStatus(message, state) {
    if (!sharedWorldStatus) {
      return;
    }
    sharedWorldStatus.textContent = message || "";
    sharedWorldStatus.classList.toggle("is-success", state === "success");
    sharedWorldStatus.classList.toggle("is-error", state === "error");
  }

  function formatSharedWorldStatNumber(value) {
    const number = Math.max(0, finiteOr(value, 0));
    if (number >= 1000000) {
      return (number / 1000000).toFixed(number >= 10000000 ? 0 : 1) + "m";
    }
    if (number >= 10000) {
      return Math.round(number / 1000) + "k";
    }
    return String(Math.round(number));
  }

  function formatSharedWorldDuration(seconds) {
    const total = Math.max(0, Math.floor(finiteOr(seconds, 0)));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (days > 0) {
      return days + "d " + hours + "h";
    }
    if (hours > 0) {
      return hours + "h " + minutes + "m";
    }
    return minutes + "m";
  }

  function normalizeSharedWorldStats(source) {
    const stats = source && typeof source === "object" ? source : {};
    const world = stats.world && typeof stats.world === "object" ? stats.world : {};
    const bounds = world.bounds && typeof world.bounds === "object" ? world.bounds : {};
    const topPlayer = stats.topPlayer && typeof stats.topPlayer === "object" ? stats.topPlayer : {};
    return {
      status: String(stats.status || "idle"),
      runningSeconds: Math.max(0, finiteOr(stats.runningSeconds, 0)),
      tick: Math.max(0, Math.floor(finiteOr(stats.tick, 0))),
      observedAt: Math.max(0, finiteOr(stats.observedAt, 0)),
      savedAt: Math.max(0, finiteOr(stats.savedAt, 0)),
      onlinePlayers: Math.max(0, Math.floor(finiteOr(stats.onlinePlayers, 0))),
      knownPlayers: Math.max(0, Math.floor(finiteOr(stats.knownPlayers, 0))),
      maxPlayers: Math.max(1, Math.floor(finiteOr(stats.maxPlayers, 1))),
      teamCount: Math.max(0, Math.floor(finiteOr(stats.teamCount, 0))),
      topPlayer: {
        playerId: String(topPlayer.playerId || ""),
        publicName: String(topPlayer.publicName || "No players yet"),
        score: Math.max(0, Math.round(finiteOr(topPlayer.score, 0))),
        online: Boolean(topPlayer.online)
      },
      world: {
        width: Math.max(0, finiteOr(bounds.width, 0)),
        height: Math.max(0, finiteOr(bounds.height, 0)),
        area: Math.max(0, finiteOr(bounds.area, 0)),
        radiusFromOrigin: Math.max(0, finiteOr(bounds.radiusFromOrigin, 0)),
        particles: Math.max(0, Math.floor(finiteOr(world.particles, 0))),
        totalMass: Math.max(0, finiteOr(world.totalMass, 0)),
        blackHoles: Math.max(0, Math.floor(finiteOr(world.blackHoles, 0))),
        mobCount: Math.max(0, Math.floor(finiteOr(world.mobCount, 0))),
        bosses: Math.max(0, Math.floor(finiteOr(world.bosses, 0))),
        structures: Math.max(0, Math.floor(finiteOr(world.structures, 0))),
        spacecrafts: Math.max(0, Math.floor(finiteOr(world.spacecrafts, 0))),
        techPickups: Math.max(0, Math.floor(finiteOr(world.techPickups, 0))),
        healthPickups: Math.max(0, Math.floor(finiteOr(world.healthPickups, 0))),
        projectiles: Math.max(0, Math.floor(finiteOr(world.projectiles, 0))),
        entityCount: Math.max(0, Math.floor(finiteOr(world.entityCount, 0))),
        activeEvent: world.activeEvent && typeof world.activeEvent === "object" ? {
          id: String(world.activeEvent.id || ""),
          timer: Math.max(0, finiteOr(world.activeEvent.timer, 0))
        } : null,
        mobBreakdown: world.mobBreakdown && typeof world.mobBreakdown === "object" ? world.mobBreakdown : {}
      }
    };
  }

  function applySharedWorldStats(source) {
    multiplayer.sharedWorldStats = normalizeSharedWorldStats(source);
    multiplayer.sharedWorldStatsLoadedAt = performance.now();
    renderSharedWorldStats();
  }

  function renderSharedWorldStat(label, value, options) {
    const item = document.createElement("div");
    const labelElement = document.createElement("span");
    const valueElement = document.createElement("strong");
    item.className = "shared-world-stat";
    if (options && options.wide) {
      item.classList.add("shared-world-stat--wide");
    }
    labelElement.textContent = label;
    valueElement.textContent = value;
    item.append(labelElement, valueElement);
    return item;
  }

  function renderSharedWorldStats() {
    if (!sharedWorldStats) {
      return;
    }

    sharedWorldStats.textContent = "";
    const stats = multiplayer.sharedWorldStats;
    if (!stats) {
      sharedWorldStats.append(
        renderSharedWorldStat("World age", multiplayer.sharedWorldStatsLoading ? "Loading..." : "Unknown"),
        renderSharedWorldStat("Leader", "Unknown"),
        renderSharedWorldStat("Online", "0/" + crazyGamesRoomMaxPlayers),
        renderSharedWorldStat("Mobs", "Unknown")
      );
      return;
    }

    const top = stats.topPlayer;
    const leader = top.score > 0 ? top.publicName + " - " + formatSharedWorldStatNumber(top.score) + " pts" : "No scores yet";
    const activeEvent = stats.world.activeEvent && stats.world.activeEvent.id
      ? stats.world.activeEvent.id + " " + Math.ceil(stats.world.activeEvent.timer) + "s"
      : stats.world.blackHoles > 0
      ? stats.world.blackHoles + " black hole" + (stats.world.blackHoles === 1 ? "" : "s")
      : "No major event";
    sharedWorldStats.append(
      renderSharedWorldStat("Active run time", formatSharedWorldDuration(stats.runningSeconds)),
      renderSharedWorldStat("Leader", leader),
      renderSharedWorldStat("Online", stats.onlinePlayers + "/" + stats.maxPlayers),
      renderSharedWorldStat("Mobs", formatSharedWorldStatNumber(stats.world.mobCount) + " + " + formatSharedWorldStatNumber(stats.world.bosses) + " bosses"),
      renderSharedWorldStat("World", formatSharedWorldStatNumber(stats.world.particles) + " bodies, " + formatSharedWorldStatNumber(stats.world.structures) + " structures", { wide: true }),
      renderSharedWorldStat("Cycle", activeEvent, { wide: true })
    );
  }

  async function refreshSharedWorldStats(force) {
    if (!window.fetch || multiplayer.sharedWorldStatsLoading) {
      renderSharedWorldStats();
      return;
    }
    if (!force && multiplayer.sharedWorldStats && performance.now() - multiplayer.sharedWorldStatsLoadedAt < 10000) {
      renderSharedWorldStats();
      return;
    }

    multiplayer.sharedWorldStatsLoading = true;
    renderSharedWorldStats();
    try {
      const data = await fetchPersistentJson("/api/world/shared");
      if (data && data.ok && data.sharedWorld) {
        applySharedWorldStats(data.sharedWorld);
      }
    } catch (error) {
      console.warn("Clusternauts shared world stats failed.", error);
      renderSharedWorldStats();
    } finally {
      multiplayer.sharedWorldStatsLoading = false;
      renderSharedWorldStats();
    }
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
    const gameMode = normalizeGameMode(options && options.gameMode || startMenu.selectedGameMode || "horde");
    clearCurrentAccountSave();
    setFriendJoinsEnabled(true, "lobby-create", { persist: true, notify: false, startRun: false });
    multiplayer.lobbyCreatePending = true;
    multiplayer.lobbyJoinPending = "";
    multiplayer.sharedWorldJoinPending = false;
    multiplayer.lobbyGameMode = gameMode;
    multiplayer.lobbyLoadedSnapshot = loadedSnapshot;
    multiplayer.lobbyLoadedSaveName = loadedSaveName;
    multiplayer.lobbyRequestStartedAt = performance.now();
    setLobbyStatus(loadedSnapshot ? 'Creating ' + gameModeLabel(gameMode) + ' lobby from "' + loadedSaveName + '"...' : "Creating " + gameModeLabel(gameMode) + " lobby...", "");
    setSharedWorldStatus("", "");
    setStartMenuView("lobby");
    setCrazyGamesLoadingActive(true, "lobby-create");
    connectMultiplayer();
    flushLobbyRequests("create-lobby");
  }

  function joinSharedWorld() {
    prepareForLobbyJoin();
    setSelectedGameMode("survival");
    setFriendJoinsEnabled(true, "shared-world-join", { persist: true, notify: false, startRun: false });
    clearCurrentAccountSave();
    multiplayer.lobbyCreatePending = false;
    multiplayer.lobbyJoinPending = "";
    multiplayer.sharedWorldJoinPending = true;
    multiplayer.lobbyGameMode = "survival";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    setSharedWorldStatus("Joining shared world...", "");
    setCrazyGamesLoadingActive(true, "shared-world-join");
    connectMultiplayer();
    flushSharedWorldRequests("shared-world-join");
  }

