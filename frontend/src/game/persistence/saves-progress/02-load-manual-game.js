  async function loadManualGame(saveId) {
    const cleanSaveId = String(saveId || "").trim();

    if (isPlatformLocalSaveRuntime() && !isAccountSignedIn()) {
      return await loadCrazyGamesManualGame(cleanSaveId);
    }
    if (!isAccountSignedIn()) {
      setManualSaveStatus(isPlatformLocalSaveRuntime() ? "Guest progress loads automatically on startup." : "Log in to load saved games.", "error");
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
      setCurrentAccountSave(data.save);
      runState.active = true;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setDifficultyScreenOpen(false);
      setSettingsOpen(false);
      resetMouseButtons();
      resetFrameClock();
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

  async function loadCrazyGamesManualGame(saveId) {
    const cleanSaveId = String(saveId || "").trim();
    if (!cleanSaveId) {
      setManualSaveStatus("Choose a saved game.", "error");
      return;
    }

    try {
      const payload = parseCrazyGamesManualSavePayload(await readCrazyGamesStorageItem(crazyGamesManualSavePayloadKey(cleanSaveId)));
      const saves = await readCrazyGamesManualSaveIndex();
      const metadata = saves.find((entry) => entry && entry.id === cleanSaveId);
      const saveName = metadata && metadata.name ? metadata.name : "saved world";

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
      applyPersistentPayload(Object.assign({ ok: true, universeId: platformLocalUniverseId() }, payload), { includePlayer: true });
      applyRunSnapshot(payload.run);
      setCurrentAccountSave(metadata || { id: cleanSaveId, name: saveName, username: activeManualSaveOwnerKey() });
      runState.active = true;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setDifficultyScreenOpen(false);
      setSettingsOpen(false);
      resetMouseButtons();
      resetFrameClock();
      updateHud();
      void savePersistentState({ includeWorld: true });
      connectMultiplayer();
      setManualSaveStatus('Loaded "' + saveName + '".', "success");
      maybeNotifyText('Loaded "' + saveName + '".');
    } catch (error) {
      console.warn("Platform local manual load failed.", error);
      setManualSaveStatus("Could not load this save.", "error");
    }
  }

  async function deleteManualGame(saveId) {
    const cleanSaveId = String(saveId || "").trim();
    if (isPlatformLocalSaveRuntime() && !isAccountSignedIn()) {
      return await deleteCrazyGamesManualGame(cleanSaveId);
    }
    if (!isAccountSignedIn()) {
      setManualSaveStatus("Log in to delete saved games.", "error");
      return;
    }
    if (!cleanSaveId) {
      setManualSaveStatus("Choose a saved game to delete.", "error");
      return;
    }
    if (accountState.busy) {
      return;
    }

    const save = accountState.saves.find((entry) => entry && entry.id === cleanSaveId);
    const saveName = save && save.name ? save.name : "this save";
    if (!window.confirm('Delete "' + saveName + '"? This cannot be undone.')) {
      return;
    }

    setAccountBusy(true);
    try {
      const data = await fetchPersistentJson("/api/saves/" + encodeURIComponent(cleanSaveId), {
        method: "DELETE",
        headers: accountAuthHeaders()
      });
      accountState.saves = Array.isArray(data.saves) ? data.saves : accountState.saves.filter((entry) => entry && entry.id !== cleanSaveId);
      const currentSave = currentAccountSave();
      if (currentSave && currentSave.id === cleanSaveId) {
        clearCurrentAccountSave();
      }
      renderSavedGames();
      setManualSaveStatus('Deleted "' + saveName + '".', "success");
      maybeNotifyText('Deleted "' + saveName + '".');
    } catch (error) {
      console.warn("Clusternauts manual delete failed.", error);
      setManualSaveStatus(backendErrorMessage(error, "Could not delete this save."), "error");
    } finally {
      setAccountBusy(false);
    }
  }

  async function deleteCrazyGamesManualGame(saveId) {
    const cleanSaveId = String(saveId || "").trim();
    if (!cleanSaveId) {
      setManualSaveStatus("Choose a saved game to delete.", "error");
      return;
    }
    if (accountState.busy) {
      return;
    }

    const save = accountState.saves.find((entry) => entry && entry.id === cleanSaveId);
    const saveName = save && save.name ? save.name : "this save";
    if (!window.confirm('Delete "' + saveName + '"? This cannot be undone.')) {
      return;
    }

    setAccountBusy(true);
    try {
      const nextSaves = (await readCrazyGamesManualSaveIndex()).filter((entry) => entry && entry.id !== cleanSaveId);
      await writeCrazyGamesManualSaveIndex(nextSaves);
      await writeCrazyGamesStorageItem(crazyGamesManualSavePayloadKey(cleanSaveId), "");
      const currentSave = currentAccountSave();
      if (currentSave && currentSave.id === cleanSaveId) {
        clearCurrentAccountSave();
      }
      renderSavedGames();
      setManualSaveStatus('Deleted "' + saveName + '".', "success");
      maybeNotifyText('Deleted "' + saveName + '".');
    } catch (error) {
      console.warn("Platform local manual delete failed.", error);
      setManualSaveStatus("Could not delete this save.", "error");
    } finally {
      setAccountBusy(false);
    }
  }
