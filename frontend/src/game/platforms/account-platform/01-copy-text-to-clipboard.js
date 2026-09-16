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
    applyGameMode(startMenu.selectedGameMode);
    applyDifficulty(id);
    runState.active = true;
    resetLocalPlayerState();
    resetLocalWorldState();
    resetLifeStats();
    resetDeathState();
    persistence.saveTimer = persistenceSaveInterval;
    persistence.pollTimer = persistencePollInterval;
    setDifficultyScreenOpen(false);
    resetFrameClock();
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
    mobBeacons.length = 0;
    rivalProjectiles.length = 0;
    playerLasers.length = 0;
    launcherMissiles.length = 0;
    guidedLauncherState.activeMissile = null;
    structures.length = 0;
    spacecrafts.length = 0;
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
    nextMobBeaconId = 1;
    nextSurvivalCampId = 1;
    nextStructureId = 1;
    nextSpacecraftId = 1;
    nextRivalProjectileId = 1;
    nextTechPickupId = 1;
    nextHealthPickupId = 1;
    multiplayer.claimedTechPickupIds.clear();
    multiplayer.claimedHealthPickupIds.clear();
    spawnTimer = 0;

    resetMobSpawnTimers();

    resetMobDefeatsByKind();
    resetMobBossWarnings();
    resetRandomEventState();

    seedStarDust();
    seedParticles();
    seedSpacecrafts();
    resetFrameClock();
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
    resetObjectiveState();
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

  function logAccountAuth(event, details) {
    if (!window.console || typeof console.info !== "function") {
      return;
    }
    console.info("[Clusternauts auth] " + event, details || {});
  }

  function createAuthDebugId() {
    const randomPart = window.crypto && typeof window.crypto.getRandomValues === "function"
      ? Array.from(window.crypto.getRandomValues(new Uint32Array(2))).map((value) => value.toString(36)).join("")
      : Math.random().toString(36).slice(2);
    return "itch-" + Date.now().toString(36) + "-" + randomPart;
  }

  function isAccountSignedIn() {
    return Boolean(accountState.token && accountState.username);
  }

  function sanitizeCrazyGamesStorageKeyPart(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function crazyGamesVisibleUserName() {
    const user = crazyGamesState.user && typeof crazyGamesState.user === "object" ? crazyGamesState.user : null;
    if (!user) {
      return "";
    }
    return sanitizePlayerName(user.username || user.displayName || user.name);
  }

  function isCrazyGamesUserSignedIn() {
    return isCrazyGamesRuntime() && Boolean(crazyGamesState.user && typeof crazyGamesState.user === "object");
  }

  function isPlatformLocalSaveRuntime() {
    return isCrazyGamesRuntime() || isGamePixRuntime();
  }

  function platformLocalUniverseId() {
    return (isGamePixRuntime() ? "gamepix:" : "crazygames:") + player.id;
  }

  function crazyGamesManualSaveOwnerKey() {
    if (!isCrazyGamesRuntime()) {
      return "";
    }
    const user = crazyGamesState.user && typeof crazyGamesState.user === "object" ? crazyGamesState.user : null;
    if (!user) {
      return "cg-guest";
    }

    const stableId = user.userId || user.id || user.profileId || user.username || user.displayName || user.name || "account";
    return "cg-" + (sanitizeCrazyGamesStorageKeyPart(stableId) || "account").slice(0, 21);
  }

  function gamePixManualSaveOwnerKey() {
    return isGamePixRuntime() ? "gamepix-local" : "";
  }

  function platformLocalSaveOwnerKey() {
    return crazyGamesManualSaveOwnerKey() || gamePixManualSaveOwnerKey();
  }

  function activeManualSaveOwnerKey() {
    if (isAccountSignedIn()) {
      return accountState.username;
    }
    return platformLocalSaveOwnerKey();
  }

  function canUseManualSaves() {
    return isAccountSignedIn() || isPlatformLocalSaveRuntime();
  }

  function crazyGamesAccountStatusText() {
    if (!isCrazyGamesUserSignedIn()) {
      return "Playing as guest";
    }

    const userName = crazyGamesVisibleUserName();
    return userName ? "Logged in as " + userName : "Logged in to CrazyGames";
  }

  function currentAccountOriginLabel() {
    if (isCrazyGamesUserSignedIn() || accountState.crazyGamesLinked === true) {
      return "CrazyGames";
    }
    // build:backend:start
    if (accountState.waiLinked === true || isAccountSignedIn()) {
      return "Login";
    }
    // build:backend:end
    return "";
  }

  function publicPlayerAccountName() {
    return sanitizePlayerName(player.name || accountState.displayName || accountState.username) || "Player";
  }

  function publicPlayerAccountLabel() {
    const origin = currentAccountOriginLabel();
    const name = publicPlayerAccountName();
    return origin ? name + " " + origin : name;
  }

  function updatePublicNameValue() {
    if (!publicNameValue) {
      return;
    }
    const relayMode = multiplayer.socialMode === "relay";
    publicNameValue.textContent = relayMode ? "Friends" : publicPlayerAccountLabel();
    publicNameValue.classList.toggle("is-account-origin", !relayMode && Boolean(currentAccountOriginLabel()));
  }

  function currentAccountSave() {
    const ownerKey = activeManualSaveOwnerKey();
    if (!ownerKey || !accountState.currentSaveId || accountState.currentSaveUsername !== ownerKey) {
      return null;
    }
    return {
      id: accountState.currentSaveId,
      name: accountState.currentSaveName || "Saved world",
      username: ownerKey
    };
  }

  function setCurrentAccountSave(save) {
    const metadata = save && typeof save === "object" ? save : {};
    const id = String(metadata.id || "").trim();
    const ownerKey = activeManualSaveOwnerKey();
    if (!id || !ownerKey) {
      clearCurrentAccountSave();
      return;
    }

    accountState.currentSaveId = id;
    accountState.currentSaveName = sanitizeManualSaveName(metadata.name) || "Saved world";
    accountState.currentSaveUsername = sanitizeAccountUsername(metadata.username || ownerKey) || ownerKey;
    updateAccountUi();
  }

  function clearCurrentAccountSave() {
    accountState.currentSaveId = "";
    accountState.currentSaveName = "";
    accountState.currentSaveUsername = "";
    updateAccountUi();
  }

  function setAccountBusy(busy) {
    accountState.busy = Boolean(busy);
    updateAccountUi();
  }

  function renderManualSaveForm() {
    const currentSave = currentAccountSave();
    if (saveGameForm) {
      saveGameForm.classList.toggle("is-overwrite", Boolean(currentSave));
    }
    if (saveGameNameInput) {
      saveGameNameInput.hidden = Boolean(currentSave);
      if (currentSave) {
        saveGameNameInput.value = currentSave.name;
      }
    }
    if (saveGameButton) {
      const signedIn = isAccountSignedIn();
      const crazyGamesRuntime = isCrazyGamesRuntime();
      const gamePixRuntime = isGamePixRuntime();
      const crazyGamesSignedIn = isCrazyGamesUserSignedIn();
      saveGameButton.disabled = !canUseManualSaves() || accountState.busy;
      saveGameButton.textContent = currentSave
        ? 'Save over "' + currentSave.name + '"'
        : signedIn
        ? "Save"
        : crazyGamesRuntime
        ? crazyGamesSignedIn
          ? "Save progress"
          : "Save guest"
        : gamePixRuntime
        ? "Save"
        : "Log in";
      saveGameButton.setAttribute("aria-label", currentSave ? 'Save over "' + currentSave.name + '"' : saveGameButton.textContent);
    }
  }

  function updateAccountUi() {
    const signedIn = isAccountSignedIn();
    const crazyGamesRuntime = isCrazyGamesRuntime();
    const gamePixRuntime = isGamePixRuntime();
    const crazyGamesSignedIn = isCrazyGamesUserSignedIn();
    const displaySignedIn = signedIn || crazyGamesSignedIn;

    if (accountLoginForm) {
      accountLoginForm.hidden = crazyGamesRuntime || gamePixRuntime || signedIn;
    }
    if (crazyGamesAccount) {
      crazyGamesAccount.hidden = !crazyGamesRuntime;
    }
    if (crazyGamesAccountStatus) {
      crazyGamesAccountStatus.textContent = crazyGamesRuntime
        ? crazyGamesAccountStatusText()
        : signedIn
        ? "Signed in with CrazyGames"
        : "Playing as guest";
    }
    if (crazyGamesLoginButton) {
      crazyGamesLoginButton.hidden = !crazyGamesRuntime || crazyGamesSignedIn || crazyGamesState.authAvailable === false;
      crazyGamesLoginButton.disabled = accountState.busy || crazyGamesState.authPromptActive;
    }
    if (accountSignedIn) {
      accountSignedIn.hidden = crazyGamesRuntime || gamePixRuntime || !signedIn;
    }
    if (accountNameValue) {
      accountNameValue.textContent = signedIn ? accountState.displayName || accountState.username : "Signed out";
    }
    if (startMenuAccount) {
      startMenuAccount.hidden = gamePixRuntime;
      startMenuAccount.classList.toggle("is-loading", !displaySignedIn && accountState.sessionLoading === true);
      startMenuAccount.classList.toggle("is-signed-out", !displaySignedIn && accountState.sessionLoading !== true);
      startMenuAccount.classList.toggle("is-wai-linked", accountState.waiLinked === true);
    }
    if (startMenuAccountLabel) {
      startMenuAccountLabel.textContent = displaySignedIn
        ? "Signed in as"
        : accountState.sessionLoading
        ? accountSessionLoadingLabel()
        : "Not signed in";
    }
    if (startMenuAccountName) {
      renderStartMenuAccountName(displaySignedIn);
    }
    if (startMenuAccountLogoutButton) {
      startMenuAccountLogoutButton.hidden = !signedIn || crazyGamesRuntime;
      startMenuAccountLogoutButton.disabled = accountState.busy;
    }
    updatePublicNameValue();
    if (accountLoginButton) {
      accountLoginButton.disabled = accountState.busy;
    }
    if (accountSignupButton) {
      accountSignupButton.disabled = accountState.busy;
    }
    if (accountLogoutButton) {
      accountLogoutButton.hidden = crazyGamesRuntime || gamePixRuntime;
      accountLogoutButton.disabled = accountState.busy;
    }
    renderManualSaveForm();
    updateRestartGameUi();

    renderSavedGames();
  }

  function accountSessionLoadingLabel() {
    // build:backend:start
    return "Login";
    // build:backend:end
    // build:crazygames:start
    return "Account";
    // build:crazygames:end
    // build:gamepix:start
    return "Local saves";
    // build:gamepix:end
  }

  function renderStartMenuAccountName(signedIn) {
    if (!startMenuAccountName) {
      return;
    }

    startMenuAccountName.textContent = "";
    if (signedIn) {
      startMenuAccountName.textContent = isAccountSignedIn()
        ? accountState.displayName || accountState.username
        : crazyGamesVisibleUserName() || "CrazyGames player";
      return;
    }
    if (accountState.sessionLoading) {
      startMenuAccountName.textContent = "Checking session...";
      return;
    }

    // build:backend:start
    const loginLink = document.createElement("a");
    loginLink.className = "start-menu__account-login";
    loginLink.href = waiLoginUrl();
    loginLink.textContent = "login";
    loginLink.addEventListener("click", function (event) {
      if (isPortalBackendRuntime()) {
        event.preventDefault();
        openWaiLogin();
        return;
      }
      setManualSaveStatus("Opening login...", "success");
    });
    startMenuAccountName.append(loginLink, document.createTextNode(" to save"));
    // build:backend:end
    // build:crazygames:start
    startMenuAccountName.textContent = "Guest progress enabled";
    // build:crazygames:end
    // build:gamepix:start
    startMenuAccountName.textContent = "Local saves enabled";
    // build:gamepix:end
  }

  function sanitizeNetworkIdentity(value) {
    return String(value || "").replace(/[^\w .:'-]/g, "").trim().slice(0, 80);
  }

