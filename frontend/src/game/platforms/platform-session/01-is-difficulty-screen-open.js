  function isDifficultyScreenOpen() {
    return Boolean(difficultyScreen && difficultyScreen.classList.contains("is-open"));
  }

  function isCrazyGamesGameplayPlayable() {
    return runState.active && !deathState.active && !gamePaused && !isDifficultyScreenOpen();
  }

  function updateCrazyGamesGameplayState(reason) {
    const playable = isCrazyGamesGameplayPlayable();
    setCrazyGamesGameplayActive(playable, reason);
    setGamePixGameplayActive(playable, reason);
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

  function setCrazyGamesLoadingActive(active, reason) {
    const nextActive = Boolean(active);
    setGamePixLoadingActive(nextActive, reason);
    if (!isCrazyGamesRuntime() || crazyGamesState.loadingEventsDisabled || crazyGamesState.loadingActive === nextActive) {
      return;
    }

    const game = crazyGamesGameModule();
    const methodName = nextActive ? "loadingStart" : "loadingStop";
    if (!game || typeof game[methodName] !== "function") {
      return;
    }

    try {
      game[methodName]();
      crazyGamesState.loadingActive = nextActive;
      logCrazyGamesQa(nextActive ? "loading start" : "loading stop", { reason });
    } catch (error) {
      crazyGamesState.loadingEventsDisabled = true;
      console.warn("CrazyGames loading event unavailable.", { reason, error });
    }
  }

  function gamePixBridgeTargets() {
    const targets = [];
    for (const target of [window.parent, window.top]) {
      if (target && target !== window && !targets.includes(target)) {
        targets.push(target);
      }
    }
    return targets;
  }

  function gamePixSdkCandidates() {
    return [window.$GPX, window.GamePix, window.GamePixSDK, window.GPX].filter(function (candidate, index, candidates) {
      return candidate && typeof candidate === "object" && candidates.indexOf(candidate) === index;
    });
  }

  function warnGamePixEventOnce(key, details) {
    if (gamePixState.eventWarnings[key]) {
      return;
    }
    gamePixState.eventWarnings[key] = true;
    console.warn("GamePix SDK bridge warning.", details || { key });
  }

  function callGamePixSdkMethod(methodNames, payload, reason) {
    let delivered = false;
    for (const sdk of gamePixSdkCandidates()) {
      for (const methodName of methodNames) {
        const method = sdk && sdk[methodName];
        if (typeof method !== "function") {
          continue;
        }
        try {
          method.call(sdk, payload);
          delivered = true;
        } catch (error) {
          warnGamePixEventOnce(methodName, { methodName, reason, error });
        }
      }
    }
    return delivered;
  }

  function dispatchGamePixCustomEvent(type, payload, reason) {
    let delivered = false;
    for (const sdk of gamePixSdkCandidates()) {
      if (typeof sdk.emit === "function") {
        try {
          sdk.emit(type, payload);
          delivered = true;
        } catch (error) {
          warnGamePixEventOnce("emit:" + type, { type, reason, error });
        }
      }
      if (typeof sdk.dispatchEvent === "function") {
        try {
          sdk.dispatchEvent(Object.assign({ type }, payload || {}));
          delivered = true;
        } catch {
          if (typeof CustomEvent === "function") {
            try {
              sdk.dispatchEvent(new CustomEvent(type, { detail: payload || {} }));
              delivered = true;
            } catch (error) {
              warnGamePixEventOnce("dispatch:" + type, { type, reason, error });
            }
          }
        }
      }
    }
    return delivered;
  }

  function emitGamePixEvent(type, payload, reason) {
    if (!isGamePixRuntime()) {
      return false;
    }

    const cleanPayload = payload && typeof payload === "object" ? payload : {};
    const message = Object.assign({ type }, cleanPayload);
    let delivered = false;

    for (const target of gamePixBridgeTargets()) {
      try {
        target.postMessage(message, gamePixEventTargetOrigin);
        delivered = true;
      } catch (error) {
        warnGamePixEventOnce("postMessage:" + type, { type, reason, error });
      }
    }

    return dispatchGamePixCustomEvent(type, cleanPayload, reason) || delivered;
  }

  function setGamePixGameplayActive(active, reason) {
    const nextActive = Boolean(active);
    if (!isGamePixRuntime() || gamePixState.gameplayActive === nextActive) {
      return;
    }

    gamePixState.gameplayActive = nextActive;
    const type = nextActive ? "gameplay_start" : "gameplay_stop";
    const payload = { reason: reason || "" };
    callGamePixSdkMethod(nextActive ? ["gameplayStart", "gameStart", "start"] : ["gameplayStop", "gameStop", "stop"], payload, reason);
    emitGamePixEvent(type, payload, reason);
  }

  function setGamePixLoadingActive(active, reason) {
    const nextActive = Boolean(active);
    if (!isGamePixRuntime() || gamePixState.loadingActive === nextActive) {
      return;
    }

    gamePixState.loadingActive = nextActive;
    const type = nextActive ? "loading_start" : "loading_stop";
    const payload = { reason: reason || "" };
    callGamePixSdkMethod(nextActive ? ["loadingStart", "gameLoadingStart"] : ["loadingStop", "gameLoadingStop"], payload, reason);
    emitGamePixEvent(type, payload, reason);
  }

  function updateGamePixScore(score, reason) {
    if (!isGamePixRuntime()) {
      return false;
    }
    const cleanScore = Math.max(0, Math.round(finiteOr(score, 0)));
    if (gamePixState.lastScore === cleanScore) {
      return true;
    }
    gamePixState.lastScore = cleanScore;
    const payload = { score: cleanScore };
    callGamePixSdkMethod(["updateScore", "setScore", "score"], payload, reason);
    return emitGamePixEvent("update_score", payload, reason);
  }

  function updateGamePixLevel(level, reason) {
    if (!isGamePixRuntime()) {
      return false;
    }
    const cleanLevel = String(level || "").trim();
    if (!cleanLevel || gamePixState.lastLevel === cleanLevel) {
      return true;
    }
    gamePixState.lastLevel = cleanLevel;
    const payload = { level: cleanLevel };
    callGamePixSdkMethod(["updateLevel", "setLevel", "level"], payload, reason);
    return emitGamePixEvent("update_level", payload, reason);
  }

  async function withCrazyGamesLoading(reason, task) {
    setCrazyGamesLoadingActive(true, reason);
    try {
      return await task();
    } finally {
      setCrazyGamesLoadingActive(false, reason);
    }
  }

  function crazyGamesSdkScriptUrl() {
    const configured = typeof window.CLUSTERNAUTS_CRAZYGAMES_SDK_URL === "string" ? window.CLUSTERNAUTS_CRAZYGAMES_SDK_URL.trim() : "";
    return configured || crazyGamesSdkUrl;
  }

  function waitForCrazyGamesSdkScript() {
    if (window.CrazyGames && window.CrazyGames.SDK) {
      return Promise.resolve(window.CrazyGames.SDK);
    }
    if (!isCrazyGamesRuntime()) {
      return Promise.resolve(null);
    }
    if (crazyGamesState.sdkLoadPromise) {
      return crazyGamesState.sdkLoadPromise;
    }

    crazyGamesState.sdkLoadPromise = new Promise(function (resolve) {
      const script = document.createElement("script");
      let settled = false;
      let timeoutId = 0;

      function finish(sdk) {
        if (settled) {
          return;
        }
        settled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(sdk || null);
      }

      script.src = crazyGamesSdkScriptUrl();
      script.async = true;
      script.onload = function () {
        finish(window.CrazyGames && window.CrazyGames.SDK);
      };
      script.onerror = function () {
        console.warn("CrazyGames SDK script failed to load.");
        finish(null);
      };

      timeoutId = setTimeout(function () {
        console.warn("CrazyGames SDK script timed out.");
        finish(null);
      }, crazyGamesSdkLoadTimeoutMs);

      (document.head || document.documentElement).appendChild(script);
    });

    return crazyGamesState.sdkLoadPromise;
  }

  async function initializeCrazyGamesIntegration() {
    if (crazyGamesState.initPromise) {
      return crazyGamesState.initPromise;
    }

    crazyGamesState.initPromise = (async function () {
      let sdk = null;
      let usedReadyPromise = false;
      applyLocalMuteAudioOverride();
      try {
        if (window.CLUSTERNAUTS_CRAZYGAMES_SDK_READY && typeof window.CLUSTERNAUTS_CRAZYGAMES_SDK_READY.then === "function") {
          usedReadyPromise = true;
          sdk = await window.CLUSTERNAUTS_CRAZYGAMES_SDK_READY;
          if (!sdk) {
            return null;
          }
        }
        sdk = sdk || (window.CrazyGames && window.CrazyGames.SDK) || await waitForCrazyGamesSdkScript();
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
          try {
            applyCrazyGamesSettings(sdk.game.settings);
          } catch (error) {
            console.warn("CrazyGames settings unavailable.", error);
          }
          configureCrazyGamesMultiplayer(sdk.game);
          if (!crazyGamesState.settingsListener && typeof sdk.game.addSettingsChangeListener === "function") {
            crazyGamesState.settingsListener = function (newSettings) {
              applyCrazyGamesSettings(newSettings);
            };
            try {
              sdk.game.addSettingsChangeListener(crazyGamesState.settingsListener);
            } catch (error) {
              crazyGamesState.settingsListener = null;
              console.warn("CrazyGames settings listener unavailable.", error);
            }
          }
        }

        if (sdk.user) {
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
          if (!crazyGamesState.authListener && typeof sdk.user.addAuthListener === "function") {
            crazyGamesState.authListener = function () {
              return handleCrazyGamesAuthChange("auth-listener");
            };
            try {
              sdk.user.addAuthListener(crazyGamesState.authListener);
            } catch (error) {
              crazyGamesState.authListener = null;
              console.warn("CrazyGames auth listener unavailable.", error);
            }
          }
        }

        await handleCrazyGamesAuthChange("startup");
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

  async function handleCrazyGamesAuthChange(reason) {
    await refreshCrazyGamesVisibleUser();
    // build:render:start
    await authenticateWithCrazyGames();
    // build:render:end
    if (isCrazyGamesRuntime()) {
      await refreshAccountSaves();
    }
    updateAccountUi();
    logCrazyGamesQa("auth state refreshed", {
      reason,
      hasUser: Boolean(crazyGamesState.user)
    });
  }

  async function authenticateWithCrazyGames() {
    // build:crazygames:start
    return;
    // build:crazygames:end
    // build:render:start
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
    // build:render:end
  }

  function isCrazyGamesUnauthenticatedError(error) {
    const code = String((error && error.code) || (error && error.message) || error || "");
    return code.includes("userNotAuthenticated") || code.includes("userCancelled");
  }

  function isCrazyGamesAlreadySignedInError(error) {
    const code = String((error && error.code) || (error && error.message) || error || "");
    return code.includes("userAlreadySignedIn");
  }

  function crazyGamesLogoutMethod() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    const userModule = sdk && sdk.user;
    if (!userModule) {
      return null;
    }

    for (const methodName of ["logout", "logOut", "signOut", "signout"]) {
      if (typeof userModule[methodName] === "function") {
        return function () {
          return userModule[methodName]();
        };
      }
    }

    return null;
  }

