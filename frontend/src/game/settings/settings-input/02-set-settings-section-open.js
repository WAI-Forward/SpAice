  function setSettingsSectionOpen(sectionName, open) {
    let openedSection = null;
    settingsSections.forEach(function (section) {
      const name = section.dataset.settingsSection || "";
      const isTarget = name === sectionName;
      const isOpen = isTarget && open;
      const body = section.querySelector(".settings-panel__section-body");
      section.classList.toggle("is-open", isOpen);
      if (body) {
        body.hidden = !isOpen;
      }
      if (isOpen) {
        openedSection = name;
      }
    });

    settingsSectionToggles.forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", toggle.dataset.settingsSectionToggle === openedSection ? "true" : "false");
    });
  }

  function setSettingsOpen(open) {
    settingsOpen = Boolean(open);
    pendingControlRemap = null;
    setGamePaused(settingsOpen);

    if (settingsPanel) {
      settingsPanel.classList.toggle("is-open", settingsOpen);
      settingsPanel.setAttribute("aria-hidden", settingsOpen ? "false" : "true");
    }
    if (settingsToggle) {
      settingsToggle.classList.toggle("is-active", settingsOpen);
      settingsToggle.setAttribute("aria-expanded", settingsOpen ? "true" : "false");
      settingsToggle.setAttribute("aria-label", settingsOpen ? "Close settings" : "Open settings");
    }

    if (settingsOpen) {
      setLeaderboardOpen(false);
      setBuildMenuOpen(false);
      setSocialPanelOpen(false);
      resetMouseButtons();
      setSettingsSectionOpen("", false);
      updateSettingsJoinCodeUi();
      void refreshAccountSaves();
    }

    renderControlBindings();
    updateHudEnabledUi();
  }

  function remapControl(action, code) {
    if (!isKnownControlAction(action) || !code || code === "Escape") {
      pendingControlRemap = null;
      renderControlBindings();
      return;
    }

    const previousCode = gameSettings.controls[action] || "";
    for (const key of Object.keys(gameSettings.controls)) {
      if (key !== action && gameSettings.controls[key] === code) {
        gameSettings.controls[key] = previousCode !== code ? previousCode : "";
      }
    }

    gameSettings.controls[action] = code;
    syncControlBindings();
    keys.clear();
    pendingControlRemap = null;
    writeGameSettings();
    renderControlBindings();
  }

  function mouseControlCode(event) {
    if (!event || !Number.isFinite(event.button)) {
      return "";
    }
    return "Mouse" + (Math.max(0, Math.floor(event.button)) + 1);
  }

  function wheelControlCode(deltaY) {
    if (!Number.isFinite(deltaY) || deltaY === 0) {
      return "";
    }
    return deltaY < 0 ? "WheelUp" : "WheelDown";
  }

  function performDirectControlAction(action, options) {
    const settings = options || {};
    if (action === "zoomIn") {
      if (Number.isFinite(settings.wheelDeltaY)) {
        adjustCameraZoomFromWheel(-Math.abs(settings.wheelDeltaY));
      } else {
        adjustCameraZoom(1);
      }
      return true;
    }
    if (action === "zoomOut") {
      if (Number.isFinite(settings.wheelDeltaY)) {
        adjustCameraZoomFromWheel(Math.abs(settings.wheelDeltaY));
      } else {
        adjustCameraZoom(-1);
      }
      return true;
    }
    if (action === "previousTool") {
      cycleTool(-1);
      return true;
    }
    if (action === "nextTool") {
      cycleTool(1);
      return true;
    }
    return false;
  }

  function resetControlBindings() {
    gameSettings.controls = Object.assign({}, defaultControlBindings);
    syncControlBindings();
    keys.clear();
    pendingControlRemap = null;
    writeGameSettings();
    renderControlBindings();
  }

  function length(x, y) {
    return Math.hypot(x, y);
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function resetMouseButtons() {
    mouse.left = false;
    mouse.middle = false;
    mouse.right = false;
    playerContinuousEnergyLocked = false;
    resetTouchControlState();
  }

  function resetTouchControlState() {
    resetTouchFireState();
    resetTouchJoystickState();
    resetTouchPinchState();
  }

  function resetTouchFireState() {
    touchControlState.active = false;
    touchControlState.pointerId = null;
    touchControlState.fireButton = "";
    touchControlState.fireReady = false;
    touchControlState.aimX = 0;
    touchControlState.aimY = -1;
    touchControlState.toolsSuppressed = false;
    updateTouchFireJoystickUi();
  }

  function resetTouchJoystickState() {
    touchJoystickState.active = false;
    touchJoystickState.pointerId = null;
    touchJoystickState.moveX = 0;
    touchJoystickState.moveY = 0;
    touchJoystickState.boost = false;
    updateTouchJoystickUi();
  }

  function resetTouchPinchState() {
    touchPinchState.active = false;
    touchPinchState.pointers.clear();
    touchPinchState.startDistance = 0;
    touchPinchState.startZoom = cameraZoom;
  }

  function clearMouseButtonsOnly() {
    mouse.left = false;
    mouse.middle = false;
    mouse.right = false;
    playerContinuousEnergyLocked = false;
  }

  function suppressTouchToolsUntilEnergyReturns() {
    if (!gameSettings.touchScreen || !touchControlState.active) {
      resetMouseButtons();
      return;
    }

    touchControlState.toolsSuppressed = true;
    clearMouseButtonsOnly();
  }

  function refreshTouchFireButtons() {
    if (!touchControlState.active || !touchControlState.fireButton || !touchControlState.fireReady) {
      clearMouseButtonsOnly();
      return;
    }
    if (touchControlState.toolsSuppressed) {
      clearMouseButtonsOnly();
      return;
    }
    setTouchFireButton(touchControlState.fireButton);
  }

  function isTouchMovementPressed(direction) {
    if (!gameSettings.touchScreen || !touchJoystickState.active) {
      return false;
    }

    if (direction === "left") {
      return touchJoystickState.moveX < -touchMoveAxisThreshold;
    }
    if (direction === "right") {
      return touchJoystickState.moveX > touchMoveAxisThreshold;
    }
    if (direction === "up") {
      return touchJoystickState.moveY < -touchMoveAxisThreshold;
    }
    if (direction === "down") {
      return touchJoystickState.moveY > touchMoveAxisThreshold;
    }
    return false;
  }

  function touchLandedWalkDirection(body) {
    if (!gameSettings.touchScreen || !touchJoystickState.active || !player.landed || !body) {
      return 0;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const aim = cameraLocalToWorld(touchJoystickState.moveX, touchJoystickState.moveY);
    const tangentAmount = aim.x * tangent.x + aim.y * tangent.y;
    if (Math.abs(tangentAmount) < touchMoveAxisThreshold) {
      return 0;
    }
    return tangentAmount > 0 ? 1 : -1;
  }

  function updatePointerAimFromEvent(event) {
    if (!event || !canvas || typeof canvas.getBoundingClientRect !== "function") {
      return;
    }
    const clientX = Number(event.clientX);
    const clientY = Number(event.clientY);
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
    mouse.seen = true;
  }

  function updateTouchAimFromPointer(event) {
    updatePointerAimFromEvent(event);
  }

  function updateTouchAimFromVector(x, y) {
    const distance = Math.hypot(x, y);
    if (distance < 0.08) {
      touchControlState.fireReady = false;
      clearMouseButtonsOnly();
      return;
    }

    const aimX = x / distance;
    const aimY = y / distance;
    const aimRadius = Math.max(120, Math.min(width, height) * 0.34);
    touchControlState.fireReady = true;
    touchControlState.aimX = aimX;
    touchControlState.aimY = aimY;
    mouse.x = width / 2 + aimX * aimRadius;
    mouse.y = height / 2 + aimY * aimRadius;
    mouse.seen = true;
    refreshTouchFireButtons();
  }

  function isTouchJoystickPointer(event) {
    return Boolean(isTouchGameplayPointer(event) && touchJoystick && (event.target === touchJoystick || touchJoystick.contains(event.target)));
  }

  function isTouchFireJoystickPointer(event) {
    return Boolean(isTouchGameplayPointer(event) && touchFireJoystick && (event.target === touchFireJoystick || touchFireJoystick.contains(event.target)));
  }

  function updateTouchJoystickUi() {
    if (!touchJoystickStick) {
      return;
    }

    const travel = 37;
    touchJoystickStick.style.transform = "translate(" +
      (touchJoystickState.moveX * travel).toFixed(1) + "px, " +
      (touchJoystickState.moveY * travel).toFixed(1) + "px)";
    if (touchJoystick) {
      touchJoystick.classList.toggle("is-active", touchJoystickState.active);
      touchJoystick.classList.toggle("is-boosting", touchJoystickState.active && touchJoystickState.boost);
    }
  }

  function updateTouchFireJoystickUi() {
    if (!touchFireJoystickStick) {
      return;
    }

    const travel = 37;
    const x = touchControlState.fireReady ? touchControlState.aimX : 0;
    const y = touchControlState.fireReady ? touchControlState.aimY : 0;
    touchFireJoystickStick.style.transform = "translate(" +
      (x * travel).toFixed(1) + "px, " +
      (y * travel).toFixed(1) + "px)";
    if (touchFireJoystick) {
      touchFireJoystick.classList.toggle("is-active", touchControlState.active);
    }
  }

  function updateTouchJoystickFromPointer(event) {
    if (!touchJoystick) {
      return;
    }

    const base = touchJoystick.querySelector(".touch-joystick__base");
    const rect = (base || touchJoystick).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const amount = clamp(distance / radius, 0, 1);

    if (amount < 0.08) {
      touchJoystickState.moveX = 0;
      touchJoystickState.moveY = 0;
    } else {
      const normal = normalize(dx, dy);
      touchJoystickState.moveX = normal.x * amount;
      touchJoystickState.moveY = normal.y * amount;
    }

    updateTouchJoystickUi();
  }

  function updateTouchFireJoystickFromPointer(event) {
    if (!touchFireJoystick) {
      return;
    }

    const base = touchFireJoystick.querySelector(".touch-joystick__base");
    const rect = (base || touchFireJoystick).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const amount = clamp(distance / radius, 0, 1);

    if (amount < 0.08) {
      touchControlState.fireReady = false;
      clearMouseButtonsOnly();
    } else {
      const normal = normalize(dx, dy);
      updateTouchAimFromVector(normal.x * amount, normal.y * amount);
    }

    updateTouchFireJoystickUi();
  }

  function beginTouchJoystick(event) {
    if (!isTouchJoystickPointer(event) || deathState.active || !runState.active || touchJoystickState.active) {
      return false;
    }

    event.preventDefault();
    touchControlState.suppressMouseUntil = performance.now() + 900;
    const now = performance.now();
    const tapDistance = Math.hypot(event.clientX - touchJoystickState.lastTapX, event.clientY - touchJoystickState.lastTapY);
    const doubleTap = now - touchJoystickState.lastTapAt <= touchDoubleTapWindow && tapDistance <= touchDoubleTapDistance;
    touchJoystickState.active = true;
    touchJoystickState.pointerId = event.pointerId;
    touchJoystickState.boost = doubleTap;
    touchJoystickState.lastTapAt = now;
    touchJoystickState.lastTapX = event.clientX;
    touchJoystickState.lastTapY = event.clientY;
    updateTouchJoystickFromPointer(event);

    if (touchJoystick && touchJoystick.setPointerCapture) {
      try {
        touchJoystick.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail if the browser already released the touch.
      }
    }

    return true;
  }

  function updateTouchJoystick(event) {
    if (!touchJoystickState.active || event.pointerId !== touchJoystickState.pointerId) {
      return false;
    }

    event.preventDefault();
    updateTouchJoystickFromPointer(event);
    return true;
  }

  function endTouchJoystick(event) {
    if (!touchJoystickState.active || event.pointerId !== touchJoystickState.pointerId) {
      return false;
    }

    event.preventDefault();
    resetTouchJoystickState();

    if (touchJoystick && touchJoystick.releasePointerCapture) {
      try {
        touchJoystick.releasePointerCapture(event.pointerId);
      } catch {
        // Some browsers release capture before pointerup is delivered.
      }
    }

    return true;
  }
