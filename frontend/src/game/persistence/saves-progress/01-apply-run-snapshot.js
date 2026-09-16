  function applyRunSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    const stats = source.lifeStats && typeof source.lifeStats === "object" ? source.lifeStats : {};
    const elapsed = Math.max(0, finiteOr(stats.elapsed, 0));

    if (source.difficulty && difficultyDefinitions[source.difficulty]) {
      applyDifficulty(source.difficulty);
    }
    applyGameMode(source.gameMode || source.mode || runState.gameMode);

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

  function crazyGamesManualSaveIndexKey() {
    return crazyGamesManualSaveIndexPrefix + activeManualSaveOwnerKey();
  }

  function crazyGamesManualSavePayloadKey(saveId) {
    return crazyGamesManualSavePayloadPrefix + activeManualSaveOwnerKey() + "." + String(saveId || "").trim();
  }

  function gamePixLocalStorageModule() {
    const storage = window.GamePix && window.GamePix.localStorage;
    if (
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function"
    ) {
      return storage;
    }
    return null;
  }

  async function readCrazyGamesStorageItem(key) {
    const gamePixStorage = isGamePixRuntime() ? gamePixLocalStorageModule() : null;
    if (gamePixStorage) {
      try {
        const value = await Promise.resolve(gamePixStorage.getItem(key));
        if (value != null && value !== "") {
          return value;
        }
      } catch (error) {
        logCrazyGamesProgress("GamePix localStorage manual save read failed.", { key, error }, "warn", "load");
      }
    }

    const data = isCrazyGamesRuntime() ? crazyGamesDataModule() : null;
    if (data) {
      try {
        const value = await Promise.resolve(data.getItem(key));
        if (value != null && value !== "") {
          return value;
        }
      } catch (error) {
        logCrazyGamesProgress("Data Module manual save read failed.", { key, error }, "warn", "load");
      }
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      logCrazyGamesProgress("Local manual save read failed.", { key, error }, "warn", "load");
      return null;
    }
  }

  async function writeCrazyGamesStorageItem(key, value) {
    const raw = String(value == null ? "" : value);
    const gamePixStorage = isGamePixRuntime() ? gamePixLocalStorageModule() : null;
    const data = isCrazyGamesRuntime() ? crazyGamesDataModule() : null;
    let wrote = false;

    if (gamePixStorage) {
      try {
        if (!raw && typeof gamePixStorage.removeItem === "function") {
          await Promise.resolve(gamePixStorage.removeItem(key));
        } else {
          await Promise.resolve(gamePixStorage.setItem(key, raw));
        }
        wrote = true;
      } catch (error) {
        logCrazyGamesProgress("GamePix localStorage manual save write failed.", { key, error }, "warn", "save");
      }
    }

    if (data) {
      try {
        await Promise.resolve(data.setItem(key, raw));
        wrote = true;
      } catch (error) {
        logCrazyGamesProgress("Data Module manual save write failed.", { key, error }, "warn", "save");
      }
    }

    try {
      window.localStorage.setItem(key, raw);
      wrote = true;
    } catch (error) {
      logCrazyGamesProgress("Local manual save write failed.", { key, error }, "warn", "save");
    }

    return wrote;
  }

  function parseCrazyGamesManualSavePayload(raw) {
    const envelope = parseCrazyGamesProgressEnvelope(raw, "crazygames-manual-save");
    return envelope && envelope.payload ? envelope.payload : null;
  }

  function compareManualSaveMetadata(a, b) {
    const leftSavedAt = a && a.savedAt ? a.savedAt : 0;
    const rightSavedAt = b && b.savedAt ? b.savedAt : 0;
    if (rightSavedAt !== leftSavedAt) {
      return rightSavedAt - leftSavedAt;
    }
    return String((a && a.name) || "").localeCompare(String((b && b.name) || ""));
  }

  function normalizeCrazyGamesManualSaveMetadata(metadata) {
    const source = metadata && typeof metadata === "object" ? metadata : {};
    const id = String(source.id || "").trim();
    if (!id) {
      return null;
    }

    return {
      id,
      username: sanitizeAccountUsername(source.username || activeManualSaveOwnerKey()) || activeManualSaveOwnerKey(),
      name: sanitizeManualSaveName(source.name) || "Saved world",
      difficulty: String(source.difficulty || "medium").trim().slice(0, 32) || "medium",
      score: Math.max(1, Math.floor(finiteOr(source.score, 1))),
      createdAt: Math.max(0, Math.floor(finiteOr(source.createdAt, Date.now()))) || Date.now(),
      savedAt: Math.max(0, Math.floor(finiteOr(source.savedAt, Date.now()))) || Date.now()
    };
  }

  function parseCrazyGamesManualSaveIndex(raw) {
    if (!raw) {
      return [];
    }

    try {
      const envelope = typeof raw === "string" ? JSON.parse(raw) : raw;
      const saves = envelope && envelope.game === "clusternauts" && Array.isArray(envelope.saves) ? envelope.saves : [];
      return saves
        .map(normalizeCrazyGamesManualSaveMetadata)
        .filter(Boolean)
        .sort(compareManualSaveMetadata);
    } catch (error) {
      logCrazyGamesProgress("Could not parse manual save list.", error, "warn", "load");
      return [];
    }
  }

  async function readCrazyGamesManualSaveIndex() {
    return parseCrazyGamesManualSaveIndex(await readCrazyGamesStorageItem(crazyGamesManualSaveIndexKey()));
  }

  async function writeCrazyGamesManualSaveIndex(saves) {
    const cleanSaves = (Array.isArray(saves) ? saves : [])
      .map(normalizeCrazyGamesManualSaveMetadata)
      .filter(Boolean)
      .sort(compareManualSaveMetadata);
    const envelope = {
      saveVersion: crazyGamesProgressSaveVersion,
      game: "clusternauts",
      owner: activeManualSaveOwnerKey(),
      savedAt: Date.now(),
      saves: cleanSaves
    };
    const ok = await writeCrazyGamesStorageItem(crazyGamesManualSaveIndexKey(), JSON.stringify(envelope));
    if (ok) {
      accountState.saves = cleanSaves;
    }
    return ok;
  }

  function buildCrazyGamesManualSaveEnvelope(payload) {
    return {
      saveVersion: crazyGamesProgressSaveVersion,
      game: "clusternauts",
      owner: activeManualSaveOwnerKey(),
      savedAt: Date.now(),
      payload: compactCrazyGamesProgressPayload(payload)
    };
  }

  async function refreshCrazyGamesManualSaves() {
    if (!isPlatformLocalSaveRuntime() || accountState.savesLoading) {
      return;
    }

    accountState.savesLoading = true;
    renderSavedGames();
    try {
      accountState.saves = await readCrazyGamesManualSaveIndex();
    } finally {
      accountState.savesLoading = false;
      updateAccountUi();
    }
  }

  async function saveCrazyGamesManualGame(currentSave, name) {
    if (!runState.active || deathState.active) {
      setManualSaveStatus("Start a live run before saving.", "error");
      return false;
    }

    const saveName = sanitizeManualSaveName(name) || (isCrazyGamesUserSignedIn() ? "CrazyGames progress" : isGamePixRuntime() ? "GamePix save" : "Guest progress");
    const now = Date.now();
    const saveId = currentSave && currentSave.id ? currentSave.id : "cg-save-" + now.toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    const existingSaves = await readCrazyGamesManualSaveIndex();
    const existing = existingSaves.find((entry) => entry && entry.id === saveId);

    updateLifeStats();
    const payload = buildPersistentPayload(true);
    payload.run = buildRunSnapshot();

    const metadata = normalizeCrazyGamesManualSaveMetadata({
      id: saveId,
      username: activeManualSaveOwnerKey(),
      name: saveName,
      difficulty: payload.run.difficulty || payload.world.difficulty || payload.player.difficulty || "medium",
      score: payload.player.score || lifeStats.bestScore || 1,
      createdAt: existing ? existing.createdAt : now,
      savedAt: now
    });

    setAccountBusy(true);
    try {
      const payloadOk = await writeCrazyGamesStorageItem(crazyGamesManualSavePayloadKey(saveId), JSON.stringify(buildCrazyGamesManualSaveEnvelope(payload)));
      if (!payloadOk) {
        setManualSaveStatus("Could not save this game.", "error");
        return false;
      }

      const nextSaves = existingSaves.filter((entry) => entry && entry.id !== saveId);
      nextSaves.push(metadata);
      const indexOk = await writeCrazyGamesManualSaveIndex(nextSaves);
      if (!indexOk) {
        setManualSaveStatus("Could not update saved games.", "error");
        return false;
      }

      setCurrentAccountSave(metadata);
      if (saveGameNameInput) {
        saveGameNameInput.value = saveName;
      }
      setManualSaveStatus('Saved "' + saveName + '".', "success");
      maybeNotifyText('Saved "' + saveName + '".');
      return true;
    } finally {
      setAccountBusy(false);
    }
  }

  async function saveManualGame() {
    const currentSave = currentAccountSave();
    const name = currentSave ? currentSave.name : sanitizeManualSaveName(saveGameNameInput && saveGameNameInput.value);

    if (isPlatformLocalSaveRuntime() && !isAccountSignedIn()) {
      return await saveCrazyGamesManualGame(currentSave, name);
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
        body: JSON.stringify({ saveId: currentSave && currentSave.id, name, payload })
      });
      accountState.saves = Array.isArray(data.saves) ? data.saves : accountState.saves;
      if (data && data.save) {
        setCurrentAccountSave(data.save);
      }
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
        setManualSaveStatus(
          persistence.serverUnavailable ? serverMaintenanceMessage : isCrazyGamesUserSignedIn() ? "Could not save progress." : "Could not save guest progress.",
          "error"
        );
        return false;
      }
      const savedMessage = isCrazyGamesUserSignedIn()
        ? persistence.storage === "crazygames-data"
          ? "Synced with CrazyGames."
          : "Progress saved."
        : "Guest progress saved.";
      setManualSaveStatus(savedMessage, "success");
      maybeNotifyText(savedMessage);
      return true;
    } finally {
      setAccountBusy(false);
    }
  }

  function updateRestartGameUi() {
    if (restartGameButton) {
      restartGameButton.disabled = restartGameInFlight || accountState.busy;
      restartGameButton.textContent = restartGameInFlight ? "Exiting..." : "Exit to main menu";
    }

    const canSaveCurrentRun = runState.active && !deathState.active;
    if (restartGamePrompt) {
      restartGamePrompt.textContent = canSaveCurrentRun ? "Save your current game before exiting to the main menu?" : "Exit to the main menu?";
    }
    if (restartGameSaveFirstButton) {
      restartGameSaveFirstButton.disabled = restartGameInFlight || accountState.busy || !canSaveCurrentRun;
    }
    if (restartGameAnywayButton) {
      restartGameAnywayButton.disabled = restartGameInFlight || accountState.busy;
      restartGameAnywayButton.textContent = "Exit";
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
      clearCurrentAccountSave();
      initializeNetworkIdentity();
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setRestartGameConfirmOpen(false);
      setSettingsOpen(false);
      setStartMenuView("main", { push: false });
      setDifficultyScreenOpen(true);
      ensureOnlinePresence();
      resetMouseButtons();
      resetFrameClock();
      void refreshLeaderboard(true);
      updateHud();
      setManualSaveStatus("Main menu ready.", "success");
      maybeNotifyText("Main menu ready.");
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

