  function setStartMenuView(view, options) {
    const nextView = startMenu.titles[view] ? view : "main";
    if (!options || options.push !== false) {
      if (startMenu.view !== nextView) {
        startMenu.history.push(startMenu.view);
      }
    }
    startMenu.view = nextView;
    renderStartMenu();

    if (nextView === "load") {
      if (isAccountSignedIn()) {
        void refreshAccountSaves();
      }
      renderStartSavedGames();
    }
    if (nextView === "lobby") {
      renderLobby();
      void refreshLobbyPlayerSearch();
    }
    if (nextView === "multiplayer-survival") {
      renderSharedWorldStats();
      void refreshSharedWorldStats(false);
    }
    if (nextView === "leaderboard") {
      renderLeaderboard();
      void refreshLeaderboard(false);
    }
    if (nextView === "store") {
      renderSkinStore();
      void refreshSkinEntitlements();
    }
  }

  function goBackStartMenu() {
    if (startMenu.view === "lobby") {
      leaveLobby();
      return;
    }

    const previous = startMenu.history.pop() || "main";
    setStartMenuView(previous, { push: false });
  }

  function renderStartMenu() {
    if (!difficultyScreen) {
      return;
    }

    let title = startMenu.view === "load" && isMultiplayerSaveLoadContext()
      ? ["Multiplayer", "Load Save"]
      : startMenu.titles[startMenu.view] || startMenu.titles.main;
    if (startMenu.view === "single-options") {
      title = ["Single Player", gameModeLabel(startMenu.selectedGameMode)];
    }
    if (startMenuEyebrow) {
      startMenuEyebrow.textContent = title[0];
    }
    if (startMenuTitle) {
      startMenuTitle.textContent = title[1];
    }
    if (startMenuBack) {
      startMenuBack.hidden = startMenu.view === "main";
      startMenuBack.textContent = startMenu.view === "lobby" ? "Leave" : "Back";
    }
    if (startMenuPanel) {
      startMenuPanel.dataset.activeMenuView = startMenu.view;
    }

    difficultyScreen.querySelectorAll("[data-menu-view]").forEach((viewElement) => {
      viewElement.classList.toggle("is-active", viewElement.dataset.menuView === startMenu.view);
    });

    syncMenuSettingsControls();
    renderStartSavedGames();
    renderLobby();
    renderSharedWorldStats();
    if (startMenu.view === "leaderboard") {
      renderLeaderboard();
    }
    if (startMenu.view === "store") {
      renderSkinStore();
    }
  }

  function syncMenuSettingsControls() {
    applyUiScale(gameSettings.uiScale);
    updateZoomUi();
    updateDynamicLightingUi();
    updateSurfaceCameraRotationUi();
    updateHudEnabledUi();
    updatePlayerBarSettingsUi();
    updateSoundToggle();
    renderControlBindings();
  }

  function renderStartSavedGames() {
    if (!startSavedGameList) {
      return;
    }

    startSavedGameList.textContent = "";
    const lobbySaveMode = isMultiplayerSaveLoadContext();
    if (!canUseManualSaves()) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "Log in from Settings to load named saves.";
      startSavedGameList.append(empty);
      return;
    }

    if (accountState.savesLoading) {
      const loading = document.createElement("p");
      loading.className = "start-menu__empty";
      loading.textContent = "Loading saves...";
      startSavedGameList.append(loading);
      return;
    }

    if (!accountState.saves.length) {
      if (isPlatformLocalSaveRuntime() && !isAccountSignedIn()) {
        const row = createStartMenuRow(isGamePixRuntime() ? "Local progress" : "Guest progress", lobbySaveMode ? "Use" : "Continue", lobbySaveMode ? "load-lobby-guest" : "continue-guest");
        startSavedGameList.append(row);
        return;
      }
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "No saved worlds yet.";
      startSavedGameList.append(empty);
      return;
    }

    for (const save of accountState.saves) {
      const row = createStartMenuRow(save.name || "Saved world", lobbySaveMode ? "Use" : "Load", lobbySaveMode ? "load-lobby-save" : "load-save", {
        saveId: save.id || "",
        canDelete: true
      });
      startSavedGameList.append(row);
    }
  }

  function createStartMenuRow(label, actionLabel, action, options) {
    const row = document.createElement("div");
    const details = document.createElement("div");
    const name = document.createElement("strong");
    const actions = document.createElement("div");
    const button = document.createElement("button");
    const settings = options && typeof options === "object" ? options : {};

    row.className = "start-menu__row";
    actions.className = "start-menu__row-actions";
    name.textContent = label;
    button.className = "settings-panel__save-action";
    button.type = "button";
    button.dataset.menuAction = action;
    if (settings.saveId) {
      button.dataset.saveId = settings.saveId;
    }
    button.disabled = accountState.busy;
    button.textContent = actionLabel;
    actions.append(button);
    if (settings.canDelete && settings.saveId) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "settings-panel__save-action settings-panel__save-action--danger";
      deleteButton.type = "button";
      deleteButton.dataset.menuAction = "delete-save";
      deleteButton.dataset.saveId = settings.saveId;
      deleteButton.disabled = accountState.busy;
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", 'Delete "' + label + '"');
      actions.append(deleteButton);
    }
    details.append(name);
    row.append(details, actions);
    return row;
  }
