          storage: persistence.storage,
          crazyGamesDataModuleAvailable: progressSaveAdapter.dataModuleAvailable,
          crazyGamesLastLoadSource: progressSaveAdapter.lastLoadSource,
          crazyGamesLastSaveSource: progressSaveAdapter.lastSaveSource
        };
      },
      setSoundEnabled: setSoundEnabled,
      soundState: function () {
        return {
          userEnabled: soundState.enabled,
          platformMuted: isPlatformAudioMuted(),
          effectiveMuted: isEffectiveGameAudioMuted(),
          allowed: isGameAudioAllowed(),
          masterGain: soundState.masterGain ? soundState.masterGain.gain.value : null,
          crazyGamesMuteAudio: crazyGamesState.muteAudio === true,
          hasSettingsListener: typeof crazyGamesState.settingsListener === "function"
        };
      },
      snapshot: createClusternautsFrameRateSnapshot
    };
  }

  installClusternautsTestHarness();
  // build:backend:start
  installAccountLoginMessageListener();
  // build:backend:end

  window.addEventListener("resize", function () {
    resize();
    syncCompactHudControls();
    if (techLedger && techLedger.style.left && techLedger.style.top) {
      const rect = techLedger.getBoundingClientRect();
      clampTechLedgerPosition(rect.left, rect.top);
    }
  });
  window.addEventListener("pointerdown", resumeAudioFromUserGesture, { capture: true });
  window.addEventListener("mousedown", resumeAudioFromUserGesture, { capture: true });
  window.addEventListener("touchend", resumeAudioFromUserGesture, { capture: true });
  window.addEventListener("keydown", resumeAudioFromUserGesture, { capture: true });
  window.addEventListener("focus", requestAudioResume);
  window.addEventListener("pageshow", requestAudioResume);

  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      setSoundEnabled(!soundState.enabled);
    });
  }

  if (menuSoundToggle) {
    menuSoundToggle.addEventListener("click", function () {
      setSoundEnabled(!soundState.enabled);
    });
  }

  if (settingsToggle) {
    settingsToggle.addEventListener("click", function () {
      setSettingsOpen(!settingsOpen);
    });
  }

  if (objectiveToggle) {
    objectiveToggle.addEventListener("click", function () {
      setObjectivesOpen(!objectivesOpen);
    });
  }

  if (settingsClose) {
    settingsClose.addEventListener("click", function () {
      setSettingsOpen(false);
    });
  }

  if (settingsPanel) {
    settingsPanel.addEventListener("click", function (event) {
      event.stopPropagation();

      const sectionToggle = closestEventTarget(event, "[data-settings-section-toggle]");
      if (sectionToggle) {
        const sectionName = sectionToggle.dataset.settingsSectionToggle || "";
        const section = settingsPanel.querySelector("[data-settings-section=\"" + sectionName + "\"]");
        const shouldOpen = !(section && section.classList.contains("is-open"));
        setSettingsSectionOpen(sectionName, shouldOpen);
        return;
      }

      const button = closestEventTarget(event, "button[data-control-action]");
      if (!button) {
        return;
      }

      pendingControlRemap = button.dataset.controlAction || null;
      renderControlBindings();
    });
  }

  if (uiScaleInput) {
    uiScaleInput.addEventListener("input", function () {
      applyUiScale(Number(uiScaleInput.value) / 100);
      writeGameSettings();
    });
  }

  if (menuUiScaleInput) {
    menuUiScaleInput.addEventListener("input", function () {
      applyUiScale(Number(menuUiScaleInput.value) / 100);
      writeGameSettings();
    });
  }

  if (zoomInput) {
    zoomInput.addEventListener("input", function () {
      setCameraZoom(sliderValueToCameraZoom(zoomInput.value));
    });
  }

  if (menuZoomInput) {
    menuZoomInput.addEventListener("input", function () {
      setCameraZoom(sliderValueToCameraZoom(menuZoomInput.value));
    });
  }

  if (dynamicLightingInput) {
    dynamicLightingInput.addEventListener("change", function () {
      applyDynamicLightingSetting(dynamicLightingInput.checked);
    });
  }

  if (menuDynamicLightingInput) {
    menuDynamicLightingInput.addEventListener("change", function () {
      applyDynamicLightingSetting(menuDynamicLightingInput.checked);
    });
  }

  if (surfaceCameraRotationInput) {
    surfaceCameraRotationInput.addEventListener("change", function () {
      applySurfaceCameraRotationSetting(surfaceCameraRotationInput.checked);
    });
  }

  if (menuSurfaceCameraRotationInput) {
    menuSurfaceCameraRotationInput.addEventListener("change", function () {
      applySurfaceCameraRotationSetting(menuSurfaceCameraRotationInput.checked);
    });
  }

  if (touchScreenInput) {
    touchScreenInput.addEventListener("change", function () {
      applyTouchScreenSetting(touchScreenInput.checked);
    });
  }

  if (hudEnabledInput) {
    hudEnabledInput.addEventListener("change", function () {
      applyHudEnabledSetting(hudEnabledInput.checked);
    });
  }

  if (playerHealthBarInput) {
    playerHealthBarInput.addEventListener("change", function () {
      applyPlayerHealthBarSetting(playerHealthBarInput.checked);
    });
  }

  if (playerEnergyBarInput) {
    playerEnergyBarInput.addEventListener("change", function () {
      applyPlayerEnergyBarSetting(playerEnergyBarInput.checked);
    });
  }

  if (menuTouchScreenInput) {
    menuTouchScreenInput.addEventListener("change", function () {
      applyTouchScreenSetting(menuTouchScreenInput.checked);
    });
  }

  if (menuPlayerHealthBarInput) {
    menuPlayerHealthBarInput.addEventListener("change", function () {
      applyPlayerHealthBarSetting(menuPlayerHealthBarInput.checked);
    });
  }

  if (menuPlayerEnergyBarInput) {
    menuPlayerEnergyBarInput.addEventListener("change", function () {
      applyPlayerEnergyBarSetting(menuPlayerEnergyBarInput.checked);
    });
  }

  if (copySettingsJoinCodeButton) {
    copySettingsJoinCodeButton.addEventListener("click", function () {
      copyTextToClipboard(activePartyJoinCode(), "World code copied.");
      maybeNotifyText("World code copied.");
    });
  }

  if (accountLoginForm) {
    accountLoginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void submitAccountAuth(false);
    });
  }

  if (accountSignupButton) {
    accountSignupButton.addEventListener("click", function () {
      void submitAccountAuth(true);
    });
  }

  if (accountLogoutButton) {
    accountLogoutButton.addEventListener("click", function () {
      void logoutAccount();
    });
  }

  if (startMenuAccountLogoutButton) {
    startMenuAccountLogoutButton.addEventListener("click", function () {
      void logoutAccount();
    });
  }

  if (crazyGamesLoginButton) {
    crazyGamesLoginButton.addEventListener("click", function () {
      void promptCrazyGamesLogin();
    });
  }

  if (saveGameForm) {
    saveGameForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void saveManualGame();
    });
  }

  if (restartGameButton) {
    restartGameButton.addEventListener("click", function () {
      setRestartGameConfirmOpen(true);
    });
  }

  if (restartGameSaveFirstButton) {
    restartGameSaveFirstButton.addEventListener("click", function () {
      void saveThenRestartGame();
    });
  }

  if (restartGameAnywayButton) {
    restartGameAnywayButton.addEventListener("click", function () {
      void restartGameFromSettings();
    });
  }

  if (restartGameCancelButton) {
    restartGameCancelButton.addEventListener("click", function () {
      setRestartGameConfirmOpen(false);
    });
  }

  if (loadGameForm) {
    loadGameForm.addEventListener("submit", function (event) {
      event.preventDefault();
      void loadManualGame(loadGameNameInput && loadGameNameInput.value);
    });
  }

  if (savedGameList) {
    savedGameList.addEventListener("click", function (event) {
      const deleteButton = closestEventTarget(event, "button[data-save-delete-id]");
      if (deleteButton && deleteButton.dataset.saveDeleteId) {
        event.preventDefault();
        void deleteManualGame(deleteButton.dataset.saveDeleteId);
        return;
      }

      const button = closestEventTarget(event, "button[data-save-id]");
      if (!button || !button.dataset.saveId) {
        return;
      }

      void loadManualGame(button.dataset.saveId);
    });
  }

  if (resetControlsButton) {
    resetControlsButton.addEventListener("click", resetControlBindings);
  }

  if (menuResetControlsButton) {
    menuResetControlsButton.addEventListener("click", resetControlBindings);
  }

  if (onlineToggle) {
    onlineToggle.addEventListener("click", function () {
      const open = multiplayer.socialMode === "online" ? !multiplayer.panelOpen : true;
      setSocialPanelOpen(open, "online");
    });
  }

  if (leaderboardToggle) {
    leaderboardToggle.addEventListener("click", function () {
      setLeaderboardOpen(!leaderboard.open);
    });
  }

  if (leaderboardModeFilter) {
    leaderboardModeFilter.addEventListener("change", function () {
      setLeaderboardFilters(leaderboardModeFilter.value, leaderboard.filters && leaderboard.filters.mode, leaderboard.filters && leaderboard.filters.difficulty);
    });
  }

  if (menuLeaderboardModeFilter) {
    menuLeaderboardModeFilter.addEventListener("change", function () {
      setLeaderboardFilters(menuLeaderboardModeFilter.value, leaderboard.filters && leaderboard.filters.mode, leaderboard.filters && leaderboard.filters.difficulty);
    });
  }

  if (leaderboardPlayersFilter) {
    leaderboardPlayersFilter.addEventListener("change", function () {
      setLeaderboardFilters(leaderboard.filters && leaderboard.filters.gameMode, leaderboardPlayersFilter.value, leaderboard.filters && leaderboard.filters.difficulty);
    });
  }

  if (menuLeaderboardPlayersFilter) {
    menuLeaderboardPlayersFilter.addEventListener("change", function () {
      setLeaderboardFilters(leaderboard.filters && leaderboard.filters.gameMode, menuLeaderboardPlayersFilter.value, leaderboard.filters && leaderboard.filters.difficulty);
    });
  }

  if (leaderboardDifficultyFilter) {
    leaderboardDifficultyFilter.addEventListener("change", function () {
      setLeaderboardFilters(leaderboard.filters && leaderboard.filters.gameMode, leaderboard.filters && leaderboard.filters.mode, leaderboardDifficultyFilter.value);
    });
  }

  if (menuLeaderboardDifficultyFilter) {
    menuLeaderboardDifficultyFilter.addEventListener("change", function () {
      setLeaderboardFilters(leaderboard.filters && leaderboard.filters.gameMode, leaderboard.filters && leaderboard.filters.mode, menuLeaderboardDifficultyFilter.value);
    });
  }

  if (touchLandButton) {
    touchLandButton.addEventListener("click", function (event) {
      event.preventDefault();
      resetMouseButtons();
      requestLandingToggle();
      updateTouchLandButton();
    });
  }

  if (vitalsToggle) {
    vitalsToggle.addEventListener("click", function () {
      setVitalsHudOpen(!vitalsHudOpen);
    });
  }

  if (resourcesToggle) {
    resourcesToggle.addEventListener("click", function () {
      setResourcesHudOpen(!resourcesHudOpen);
    });
  }

  if (buildToggle) {
    buildToggle.addEventListener("click", function () {
      setBuildMenuOpen(!buildMenuOpen);
    });
  }

  if (mapToggle) {
    mapToggle.addEventListener("click", function () {
      setMapHudOpen(!mapHudOpen);
    });
  }

  if (mapMinimumBodyFilter) {
    mapMinimumBodyFilter.addEventListener("change", function () {
      setMapMinimumBodyTier(mapMinimumBodyFilter.value);
    });
  }

  if (mapMaximumBodyFilter) {
    mapMaximumBodyFilter.addEventListener("change", function () {
      setMapMaximumBodyTier(mapMaximumBodyFilter.value);
    });
  }

  if (techLedgerTitle) {
    techLedgerTitle.addEventListener("pointerdown", beginTechLedgerDrag);
  }

  if (techLedger) {
    techLedger.addEventListener("pointermove", updateTechLedgerDrag);
    techLedger.addEventListener("pointerup", endTechLedgerDrag);
    techLedger.addEventListener("pointercancel", endTechLedgerDrag);
  }

  if (socialPanelClose) {
    socialPanelClose.addEventListener("click", function () {
      setSocialPanelOpen(false);
    });
  }

  if (playerSearch) {
    playerSearch.addEventListener("input", function () {
      window.clearTimeout(playerSearch._searchTimer);
      playerSearch._searchTimer = window.setTimeout(function () {
        void refreshPlayerSearch();
      }, 180);
    });
  }

  if (friendsOnlyFilter) {
    friendsOnlyFilter.addEventListener("change", function () {
      void refreshPlayerSearch();
    });
  }

  if (playerSearchList) {
    playerSearchList.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-player-id]");
      if (!button) {
        return;
      }

      const targetPlayerId = button.dataset.playerId || "";
      if (button.dataset.action === "invite") {
        inviteFriend(targetPlayerId);
      } else if (button.dataset.action === "team") {
        sendMultiplayer({
          type: "interaction.choice",
          targetPlayerId,
          choice: "team"
        });
        maybeNotifyText("Team up request sent.");
      }
    });
  }

  if (investigateSignal) {
    investigateSignal.addEventListener("click", function () {
      choosePendingSignal("investigate");
    });
  }

  if (avoidSignal) {
    avoidSignal.addEventListener("click", function () {
      choosePendingSignal("avoid");
    });
  }
