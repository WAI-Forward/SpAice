  window.addEventListener("keydown", function (event) {
    if (isBrowserScrollKey(event) && !settingsOpen && !isEditableEventTarget(event) && !isKeyboardControlEventTarget(event)) {
      event.preventDefault();
    }

    if ((event.code === "F10" || (event.ctrlKey && event.code === "Backquote")) && !event.repeat) {
      event.preventDefault();
      toggleDeveloperOverlay();
      return;
    }

    if (settingsOpen) {
      if (!isEditableEventTarget(event)) {
        event.preventDefault();
      }
      return;
    }

    if (!runState.active) {
      return;
    }

    if (deathState.active) {
      if (event.target === deathRunNameInput) {
        return;
      }
      if (event.target === playAgainButton) {
        return;
      }

      event.preventDefault();
      return;
    }

    if (multiplayer.commandOpen) {
      if (commandInput && document.activeElement !== commandInput) {
        focusCommandInput();

        if (event.key && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          const start = commandInput.selectionStart ?? commandInput.value.length;
          const end = commandInput.selectionEnd ?? start;
          commandInput.value = commandInput.value.slice(0, start) + event.key + commandInput.value.slice(end);
          commandInput.setSelectionRange(start + event.key.length, start + event.key.length);
          commandInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      return;
    }

    if (multiplayer.interactionMenu) {
      if (event.code === "Escape") {
        event.preventDefault();
        setPlayerInteractionMenu(false);
        return;
      }
      if (event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        movePlayerInteractionSelection(-1);
        return;
      }
      if (event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        movePlayerInteractionSelection(1);
        return;
      }
      if (event.code === "Enter") {
        event.preventDefault();
        const selected = multiplayer.interactionMenu.choices[multiplayer.interactionMenu.selectedIndex];
        choosePlayerInteraction(selected && selected.key);
        return;
      }
      if (/^Digit[1-2]$/.test(event.code)) {
        event.preventDefault();
        const selected = multiplayer.interactionMenu.choices[Number(event.code.slice(5)) - 1];
        choosePlayerInteraction(selected && selected.key);
        return;
      }
    }

    if (containerPanel && containerPanel.classList.contains("is-open") && event.code === "Escape") {
      event.preventDefault();
      closeContainerSession();
      return;
    }

    if (tradePortPanel && tradePortPanel.classList.contains("is-open") && event.code === "Escape") {
      event.preventDefault();
      closeTradePortSession();
      return;
    }

    if (event.code === "Enter" && !event.repeat && !buildMenuOpen && !leaderboard.open && !isEditableEventTarget(event)) {
      if (beginNearbyInteraction()) {
        event.preventDefault();
        return;
      }
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && !isEditableEventTarget(event)) {
      if (event.key === "+" || event.code === "NumpadAdd") {
        event.preventDefault();
        adjustCameraZoom(1);
        return;
      }
      if (event.key === "-" || event.code === "NumpadSubtract") {
        event.preventDefault();
        adjustCameraZoom(-1);
        return;
      }
      if (event.code === "KeyH" && !event.repeat) {
        event.preventDefault();
        applyHudEnabledSetting(gameSettings.hudEnabled === false);
        return;
      }
      if (event.code === "KeyT" && !event.repeat) {
        event.preventDefault();
        setResourcesHudOpen(!resourcesHudOpen);
        return;
      }
      if (event.code === controlCodeFor("objectives") && !event.repeat) {
        event.preventDefault();
        setObjectivesOpen(!objectivesOpen);
        return;
      }

      const directAction = actionForControlCode(event.code, directControlActions);
      if (directAction && (!event.repeat || directAction === "zoomIn" || directAction === "zoomOut")) {
        event.preventDefault();
        performDirectControlAction(directAction);
        return;
      }
    }

    if (event.code === "Slash" && !event.repeat) {
      event.preventDefault();
      setCommandOpen(true);
      return;
    }

    if (!event.repeat && /^Digit[1-9]$/.test(event.code)) {
      const slot = Number(event.code.slice(5)) - 1;
      if (hotbarToolIds[slot]) {
        event.preventDefault();
        selectTool(hotbarToolIds[slot]);
        return;
      }
    }

    if (event.code === controlCodeFor("build") && !event.repeat) {
      event.preventDefault();
      setBuildMenuOpen(!buildMenuOpen);
      return;
    }
    if (event.code === "Escape" && activePlacementRecipeId) {
      event.preventDefault();
      cancelStructurePlacement();
      return;
    }
    if (event.code === "Escape" && buildMenuOpen) {
      event.preventDefault();
      setBuildMenuOpen(false);
      return;
    }
    if (event.code === "Escape" && leaderboard.open) {
      event.preventDefault();
      setLeaderboardOpen(false);
      return;
    }
    if (event.code === "Escape" && objectivesOpen) {
      event.preventDefault();
      setObjectivesOpen(false);
      return;
    }
    if (event.code === "Escape" && multiplayer.pendingSignal) {
      event.preventDefault();
      choosePendingSignal("avoid");
      return;
    }
    if (event.code === "Escape" && multiplayer.panelOpen) {
      event.preventDefault();
      setSocialPanelOpen(false);
      return;
    }
    if (event.code === "Escape" && !event.repeat && !isEditableEventTarget(event)) {
      event.preventDefault();
      setSettingsOpen(true);
      return;
    }

    const controlCodes = [controlCodeFor("rollLeft"), controlCodeFor("rollRight"), controlCodeFor("land")];
    if (movementControlCodes.has(event.code) || controlCodes.includes(event.code) || event.code === "ShiftLeft" || event.code === "ShiftRight") {
      event.preventDefault();
      if (event.code === controlCodeFor("land") && !event.repeat) {
        requestLandingToggle();
      }
      keys.add(event.code);
    }
  });

  window.addEventListener("keyup", function (event) {
    keys.delete(event.code);
  });

  window.addEventListener("blur", function () {
    keys.clear();
    jumpQueued = false;
    resetMouseButtons();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      setCrazyGamesGameplayActive(false, "visibility-hidden");
      requestAudioResume();
    } else {
      requestAudioResume();
      updateCrazyGamesGameplayState("visibility-visible");
    }
  });

  window.addEventListener("pagehide", function () {
    setCrazyGamesGameplayActive(false, "pagehide");
    setCrazyGamesLoadingActive(false, "pagehide");
  });

  window.addEventListener("beforeunload", function () {
    setCrazyGamesGameplayActive(false, "beforeunload");
    setCrazyGamesLoadingActive(false, "beforeunload");
  });

  window.addEventListener("mousemove", function (event) {
    updatePointerAimFromEvent(event);
  });

  window.addEventListener("pointerdown", beginTouchControl, { passive: false });
  window.addEventListener("pointermove", function (event) {
    if (!isTouchGameplayPointer(event)) {
      updatePointerAimFromEvent(event);
    }
    updateTouchControl(event);
  }, { passive: false });
  window.addEventListener("pointerup", endTouchControl, { passive: false });
  window.addEventListener("pointercancel", endTouchControl, { passive: false });
  window.addEventListener("selectstart", function (event) {
    if (gameSettings.touchScreen && !isEditableEventTarget(event)) {
      event.preventDefault();
    }
  });

  window.addEventListener("mousedown", function (event) {
    if (pendingControlRemap) {
      const code = mouseControlCode(event);
      if (code) {
        event.preventDefault();
        event.stopImmediatePropagation();
        remapControl(pendingControlRemap, code);
      }
      return;
    }

    if (shouldSuppressSyntheticMouseEvent()) {
      event.preventDefault();
      return;
    }

    if (deathState.active || !runState.active) {
      return;
    }

    if (isGameplayPointerBlocked(event)) {
      return;
    }

    updatePointerAimFromEvent(event);

    const directAction = actionForControlCode(mouseControlCode(event), directControlActions);
    if (directAction) {
      event.preventDefault();
      performDirectControlAction(directAction);
      return;
    }

    if (activePlacementRecipeId) {
      event.preventDefault();
      if (event.button === 0) {
        confirmStructurePlacement();
      } else if (event.button === 2) {
        cancelStructurePlacement();
      }
      return;
    }

    if (event.button === 0 && handleTradePortClick()) {
      event.preventDefault();
      mouse.left = false;
      return;
    }

    if (event.button === 0 && handleContainerClick()) {
      event.preventDefault();
      mouse.left = false;
      return;
    }

    if (areToolsDisabled()) {
      event.preventDefault();
      resetMouseButtons();
      return;
    }

    if (handlePersonalTetherMouseDown(event.button)) {
      event.preventDefault();
      return;
    }

    if (event.button === 0) {
      if (handleCommunicationRelayClick()) {
        event.preventDefault();
        mouse.left = false;
        return;
      }

      mouse.left = true;
      if (isSuctionEquipped()) {
        playSound("gadgetSuck", { throttleKey: "gadget", throttle: 0.12 });
      }
    }
    if (event.button === 1) {
      event.preventDefault();
      mouse.middle = true;
      if (isSuctionEquipped()) {
        playSound("gadgetSuck", { throttleKey: "gadget", throttle: 0.12 });
      }
    }
    if (event.button === 2) {
      mouse.right = true;
      if (isSuctionEquipped()) {
        playSound("gadgetBlow", { throttleKey: "gadget", throttle: 0.12 });
      }
    }
  });

  window.addEventListener("mouseup", function (event) {
    const directAction = actionForControlCode(mouseControlCode(event), directControlActions);
    if (directAction) {
      event.preventDefault();
      return;
    }

    if (shouldSuppressSyntheticMouseEvent()) {
      event.preventDefault();
      return;
    }

    if (deathState.active || !runState.active) {
      resetMouseButtons();
      return;
    }

    if (isGameplayPointerBlocked(event)) {
      return;
    }

    updatePointerAimFromEvent(event);

    if (event.button === 0) {
      mouse.left = false;
    }
    if (event.button === 1) {
      event.preventDefault();
      mouse.middle = false;
    }
    if (event.button === 2) {
      mouse.right = false;
    }
  });

  window.addEventListener("auxclick", function (event) {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  window.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  window.addEventListener("wheel", function (event) {
    if (pendingControlRemap) {
      const code = wheelControlCode(event.deltaY);
      if (code) {
        event.preventDefault();
        event.stopImmediatePropagation();
        remapControl(pendingControlRemap, code);
      }
      return;
    }

    if (isScrollableWheelEventTarget(event)) {
      return;
    }

    if (deathState.active || !runState.active) {
      event.preventDefault();
      return;
    }

    if (isGameplayPointerBlocked(event)) {
      return;
    }

    event.preventDefault();
    const directAction = actionForControlCode(wheelControlCode(event.deltaY), directControlActions);
    if (directAction) {
      performDirectControlAction(directAction, { wheelDeltaY: event.deltaY });
    }
  }, { passive: false });

  async function startGame() {
    initializeNetworkIdentity();
    await bootstrapAccountSession();
    // build:render:start
    await handleSkinCheckoutReturn();
    // build:render:end
    applyUiScale(gameSettings.uiScale);
    setCameraZoom(gameSettings.zoom);
    updateDynamicLightingUi();
    updateSurfaceCameraRotationUi();
    updateTouchScreenUi();
    updateHudEnabledUi();
    updatePlayerBarSettingsUi();
    syncMapMinimumBodyFilter();
    renderControlBindings();
    initializeTechUi();
    updateSoundToggle();
    resize();
    syncCompactHudControls();
    seedStarDust();
    seedParticles();
    seedSpacecrafts();
    applyDifficulty(defaultDifficultyId);
    resetLifeStats();
    setStartMenuView("main", { push: false });
    setDifficultyScreenOpen(true);
    void refreshLeaderboard(true);
    updateOnlineUi();
    updateAccountUi();
    setFriendJoinsEnabled(false, "startup", { persist: false, notify: false, startRun: false });
    ensureOnlinePresence();
    void initializeCrazyGamesIntegration().then(async function () {
      if (isPlatformLocalSaveRuntime()) {
        await loadPersistentState();
      }
      updateCrazyGamesGameplayState("sdk-ready");
    });

    if (!starDust.length) {
      seedStarDust();
    }
    if (!particles.length) {
      seedParticles();
    }
    ensureDefaultSpacecrafts();

    resetFrameClock();
    resetRenderPerformance();
    requestAnimationFrame(tick);
  }

  if (!clusternautsTestConfig || !clusternautsTestConfig.skipAutoStart) {
    void startGame();
  }
}());
