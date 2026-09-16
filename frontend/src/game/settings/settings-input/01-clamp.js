  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function readMigratedLocalStorage(currentKey, legacyKey) {
    const current = window.localStorage.getItem(currentKey);
    if (current !== null) {
      return current;
    }

    const legacy = legacyKey ? window.localStorage.getItem(legacyKey) : null;
    if (legacy !== null) {
      window.localStorage.setItem(currentKey, legacy);
    }
    return legacy;
  }

  function removeMigratedLocalStorage(currentKey, legacyKey) {
    window.localStorage.removeItem(currentKey);
    if (legacyKey) {
      window.localStorage.removeItem(legacyKey);
    }
  }

  function readStoredAccountSession() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(accountSessionStorageKey) || "null");
      if (!stored || typeof stored !== "object") {
        return null;
      }
      const token = typeof stored.token === "string" ? stored.token : "";
      const username = sanitizeAccountUsername(stored.username);
      const displayName = sanitizePlayerName(stored.displayName);
      const waiLinked = stored.waiLinked === true;
      const crazyGamesLinked = stored.crazyGamesLinked === true;
      return token && username ? { token, username, displayName, waiLinked, crazyGamesLinked } : null;
    } catch {
      return null;
    }
  }

  function writeStoredAccountSession() {
    try {
      if (!accountState.token || !accountState.username) {
        window.localStorage.removeItem(accountSessionStorageKey);
        return;
      }

      window.localStorage.setItem(accountSessionStorageKey, JSON.stringify({
        token: accountState.token,
        username: accountState.username,
        displayName: accountState.displayName,
        waiLinked: accountState.waiLinked === true,
        crazyGamesLinked: accountState.crazyGamesLinked === true
      }));
    } catch {
      // Local storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function sanitizeAccountUsername(name) {
    return String(name || "").toLowerCase().replace(/[^\w.-]/g, "").slice(0, 24);
  }

  function readGameSettings() {
    const defaults = {
      uiScale: 1,
      zoom: 0.62,
      dynamicLighting: true,
      surfaceCameraRotation: false,
      touchScreen: shouldEnableTouchControlsByDefault(),
      hudEnabled: true,
      playerHealthBar: true,
      playerEnergyBar: true,
      mapMinimumBodyTier: "auto",
      mapMaximumBodyTier: "auto",
      controls: Object.assign({}, defaultControlBindings)
    };

    try {
      const stored = JSON.parse(readMigratedLocalStorage(settingsStorageKey, legacySettingsStorageKey) || "null");
      if (!stored || typeof stored !== "object") {
        return defaults;
      }

      const storedZoom = Number(stored.zoom);
      const zoom = storedZoom === 1 ? defaults.zoom : storedZoom;

      return {
        uiScale: clamp(Number(stored.uiScale) || defaults.uiScale, 0.8, 1.3),
        zoom: clamp(zoom || defaults.zoom, 0.08, 1.75),
        dynamicLighting: typeof stored.dynamicLighting === "boolean" ? stored.dynamicLighting : defaults.dynamicLighting,
        surfaceCameraRotation: stored.surfaceCameraRotation === true,
        touchScreen: typeof stored.touchScreen === "boolean" ? stored.touchScreen : defaults.touchScreen,
        hudEnabled: typeof stored.hudEnabled === "boolean" ? stored.hudEnabled : defaults.hudEnabled,
        playerHealthBar: typeof stored.playerHealthBar === "boolean" ? stored.playerHealthBar : defaults.playerHealthBar,
        playerEnergyBar: typeof stored.playerEnergyBar === "boolean" ? stored.playerEnergyBar : defaults.playerEnergyBar,
        mapMinimumBodyTier: typeof stored.mapMinimumBodyTier === "string" ? stored.mapMinimumBodyTier : defaults.mapMinimumBodyTier,
        mapMaximumBodyTier: typeof stored.mapMaximumBodyTier === "string" ? stored.mapMaximumBodyTier : defaults.mapMaximumBodyTier,
        controls: normalizeControlBindings(stored.controls)
      };
    } catch (error) {
      return defaults;
    }
  }

  function writeGameSettings() {
    try {
      window.localStorage.setItem(settingsStorageKey, JSON.stringify({
        uiScale: gameSettings.uiScale,
        zoom: gameSettings.zoom,
        dynamicLighting: gameSettings.dynamicLighting,
        surfaceCameraRotation: gameSettings.surfaceCameraRotation,
        touchScreen: gameSettings.touchScreen,
        hudEnabled: gameSettings.hudEnabled,
        playerHealthBar: gameSettings.playerHealthBar,
        playerEnergyBar: gameSettings.playerEnergyBar,
        mapMinimumBodyTier: gameSettings.mapMinimumBodyTier,
        mapMaximumBodyTier: gameSettings.mapMaximumBodyTier,
        controls: gameSettings.controls
      }));
    } catch (error) {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function normalizeControlBindings(source) {
    const controls = Object.assign({}, defaultControlBindings);
    const snapshot = source && typeof source === "object" ? source : {};

    for (const action of Object.keys(defaultControlBindings)) {
      if (typeof snapshot[action] === "string") {
        controls[action] = snapshot[action];
      }
    }

    if (snapshot.build === "KeyB") {
      for (const action of Object.keys(controls)) {
        if (action !== "build" && controls[action] === defaultControlBindings.build) {
          controls[action] = "KeyB";
        }
      }
      controls.build = defaultControlBindings.build;
    }

    return controls;
  }

  function syncControlBindings() {
    const controls = normalizeControlBindings(gameSettings.controls);
    gameSettings.controls = controls;

    movementKeyAliases.up = [controls.up, "ArrowUp"].filter(Boolean);
    movementKeyAliases.down = [controls.down, "ArrowDown"].filter(Boolean);
    movementKeyAliases.left = [controls.left, "ArrowLeft"].filter(Boolean);
    movementKeyAliases.right = [controls.right, "ArrowRight"].filter(Boolean);

    movementControlCodes.clear();
    for (const codes of Object.values(movementKeyAliases)) {
      for (const code of codes) {
        movementControlCodes.add(code);
      }
    }
  }

  function controlCodeFor(action) {
    if (gameSettings.controls && Object.prototype.hasOwnProperty.call(gameSettings.controls, action)) {
      return gameSettings.controls[action] || "";
    }
    return defaultControlBindings[action] || "";
  }

  function isKnownControlAction(action) {
    return Object.prototype.hasOwnProperty.call(defaultControlBindings, action);
  }

  function actionForControlCode(code, actions) {
    if (!code) {
      return "";
    }
    const actionList = Array.isArray(actions) ? actions : Object.keys(defaultControlBindings);
    for (const action of actionList) {
      if (controlCodeFor(action) === code) {
        return action;
      }
    }
    return "";
  }

  function isControlPressed(action) {
    const code = controlCodeFor(action);
    return Boolean(code && keys.has(code));
  }

  function shouldEnableTouchControlsByDefault() {
    const hasTouchPoints = Number(navigator.maxTouchPoints || 0) > 0;
    const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return Boolean(hasTouchPoints || coarsePointer || "ontouchstart" in window);
  }

  function formatControlCode(code) {
    const labels = {
      Space: "Space",
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      NumpadAdd: "Numpad +",
      NumpadSubtract: "Numpad -",
      WheelUp: "Wheel up",
      WheelDown: "Wheel down"
    };

    if (labels[code]) {
      return labels[code];
    }
    if (/^Mouse\d+$/.test(code)) {
      return "Mouse " + code.slice(5);
    }
    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3);
    }
    if (/^Digit[0-9]$/.test(code)) {
      return code.slice(5);
    }
    if (/^Numpad[0-9]$/.test(code)) {
      return "Numpad " + code.slice(6);
    }
    return code || "Unbound";
  }

  function applyUiScale(scale) {
    gameSettings.uiScale = clamp(Number(scale) || 1, 0.8, 1.3);
    document.documentElement.style.setProperty("--ui-scale", gameSettings.uiScale.toFixed(2));

    if (uiScaleInput) {
      uiScaleInput.value = String(Math.round(gameSettings.uiScale * 100));
    }
    if (uiScaleValue) {
      uiScaleValue.textContent = Math.round(gameSettings.uiScale * 100) + "%";
    }
    if (menuUiScaleInput) {
      menuUiScaleInput.value = String(Math.round(gameSettings.uiScale * 100));
    }
    if (menuUiScaleValue) {
      menuUiScaleValue.textContent = Math.round(gameSettings.uiScale * 100) + "%";
    }
  }

  function renderControlBindings() {
    const bindingLists = [controlBindingsList, menuControlBindingsList].filter(Boolean);
    if (!bindingLists.length) {
      return;
    }

    bindingLists.forEach(function (bindingList) {
      bindingList.textContent = "";
      for (const binding of controlBindingLabels) {
        const row = document.createElement("div");
        const label = document.createElement("span");
        const button = document.createElement("button");
        const code = controlCodeFor(binding.action);

        row.className = "settings-row";
        label.className = "settings-row__label";
        label.textContent = binding.label;
        button.className = "settings-row__key";
        button.type = "button";
        button.dataset.controlAction = binding.action;
        button.textContent = pendingControlRemap === binding.action ? "Press input" : formatControlCode(code);
        button.classList.toggle("is-listening", pendingControlRemap === binding.action);
        button.setAttribute("aria-label", "Remap " + binding.label);

        row.append(label, button);
        bindingList.append(row);
      }
    });
  }

  function updateZoomUi() {
    if (zoomInput) {
      zoomInput.value = String(Math.round(cameraZoomToSliderValue(cameraZoom)));
    }
    if (zoomValue) {
      zoomValue.textContent = Math.round(cameraZoom * 100) + "%";
    }
    if (menuZoomInput) {
      menuZoomInput.value = String(Math.round(cameraZoomToSliderValue(cameraZoom)));
    }
    if (menuZoomValue) {
      menuZoomValue.textContent = Math.round(cameraZoom * 100) + "%";
    }
  }

  function updateSurfaceCameraRotationUi() {
    if (surfaceCameraRotationInput) {
      surfaceCameraRotationInput.checked = Boolean(gameSettings.surfaceCameraRotation);
    }
    if (menuSurfaceCameraRotationInput) {
      menuSurfaceCameraRotationInput.checked = Boolean(gameSettings.surfaceCameraRotation);
    }
  }

  function updateDynamicLightingUi() {
    const enabled = gameSettings.dynamicLighting !== false;
    if (dynamicLightingInput) {
      dynamicLightingInput.checked = enabled;
    }
    if (menuDynamicLightingInput) {
      menuDynamicLightingInput.checked = enabled;
    }
  }

  function updateTouchScreenUi() {
    const touchControlsVisible = canShowTouchControls();
    if (touchScreenInput) {
      touchScreenInput.checked = Boolean(gameSettings.touchScreen);
    }
    if (menuTouchScreenInput) {
      menuTouchScreenInput.checked = Boolean(gameSettings.touchScreen);
    }
    if (touchJoystick) {
      touchJoystick.classList.toggle("is-enabled", touchControlsVisible);
      touchJoystick.setAttribute("aria-hidden", touchControlsVisible ? "false" : "true");
    }
    if (touchFireJoystick) {
      touchFireJoystick.classList.toggle("is-enabled", touchControlsVisible);
      touchFireJoystick.setAttribute("aria-hidden", touchControlsVisible ? "false" : "true");
    }
  }

  function canShowTouchControls() {
    return Boolean(
      gameSettings.touchScreen &&
      runState.active &&
      !deathState.active &&
      !gamePaused &&
      !settingsOpen &&
      !buildMenuOpen &&
      !objectivesOpen &&
      !leaderboard.open &&
      !multiplayer.panelOpen &&
      !multiplayer.commandOpen &&
      !multiplayer.interactionMenu &&
      !multiplayer.trade &&
      !isDifficultyScreenOpen()
    );
  }

  function updateHudEnabledUi() {
    const hudEnabled = gameSettings.hudEnabled !== false;
    document.body.classList.toggle("hud-hidden", !hudEnabled);
    document.body.classList.toggle(
      "hud-menu-open",
      settingsOpen ||
        buildMenuOpen ||
        objectivesOpen ||
        Boolean(containerPanel && containerPanel.classList.contains("is-open")) ||
        Boolean(tradePortPanel && tradePortPanel.classList.contains("is-open"))
    );
    if (hudEnabledInput) {
      hudEnabledInput.checked = hudEnabled;
    }
    syncCompactHudControls();
    updateToolHotbar();
  }

  function updatePlayerBarSettingsUi() {
    const healthBarEnabled = gameSettings.playerHealthBar !== false;
    const energyBarEnabled = gameSettings.playerEnergyBar !== false;
    if (playerHealthBarInput) {
      playerHealthBarInput.checked = healthBarEnabled;
    }
    if (playerEnergyBarInput) {
      playerEnergyBarInput.checked = energyBarEnabled;
    }
    if (menuPlayerHealthBarInput) {
      menuPlayerHealthBarInput.checked = healthBarEnabled;
    }
    if (menuPlayerEnergyBarInput) {
      menuPlayerEnergyBarInput.checked = energyBarEnabled;
    }
  }

  function surfaceCameraRollForAngle(angle) {
    return gameSettings.surfaceCameraRotation ? cameraRollForSurfaceAngle(angle) : 0;
  }

  function applySurfaceCameraRotationSetting(enabled) {
    gameSettings.surfaceCameraRotation = Boolean(enabled);
    updateSurfaceCameraRotationUi();
    if (player.landed) {
      cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
    }
    writeGameSettings();
  }

  function applyDynamicLightingSetting(enabled) {
    gameSettings.dynamicLighting = Boolean(enabled);
    updateDynamicLightingUi();
    writeGameSettings();
  }

  function applyTouchScreenSetting(enabled) {
    gameSettings.touchScreen = Boolean(enabled);
    updateTouchScreenUi();
    if (!gameSettings.touchScreen) {
      resetMouseButtons();
    }
    updateTouchLandButton();
    writeGameSettings();
  }

  function applyHudEnabledSetting(enabled) {
    gameSettings.hudEnabled = Boolean(enabled);
    if (!gameSettings.hudEnabled) {
      setLeaderboardOpen(false);
      setBuildMenuOpen(false);
      setSocialPanelOpen(false);
      setObjectivesOpen(false);
      resetMouseButtons();
    }
    updateHudEnabledUi();
    writeGameSettings();
  }

  function applyPlayerHealthBarSetting(enabled) {
    gameSettings.playerHealthBar = Boolean(enabled);
    updatePlayerBarSettingsUi();
    writeGameSettings();
  }

  function applyPlayerEnergyBarSetting(enabled) {
    gameSettings.playerEnergyBar = Boolean(enabled);
    updatePlayerBarSettingsUi();
    writeGameSettings();
  }
