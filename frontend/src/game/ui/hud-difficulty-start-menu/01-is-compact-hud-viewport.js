  function isCompactHudViewport() {
    return window.innerWidth <= compactHudBreakpoint || window.innerHeight <= compactHudHeightBreakpoint;
  }

  function syncMapMinimumBodyControlVisibility(compact) {
    const compactViewport = typeof compact === "boolean" ? compact : isCompactHudViewport();
    const visible = gameSettings.hudEnabled !== false && runState.active && !deathState.active && (!compactViewport || mapHudOpen);
    for (const element of [mapMinimumBodyControl, mapSpeedometer]) {
      if (!element) {
        continue;
      }
      element.classList.toggle("is-open", visible);
      element.setAttribute("aria-hidden", visible ? "false" : "true");
    }
  }

  function syncCompactHudControls() {
    if (gameSettings.hudEnabled === false) {
      if (gameVitalsHud) {
        gameVitalsHud.classList.remove("is-compact", "is-compact-open");
        gameVitalsHud.setAttribute("aria-hidden", "true");
      }
      if (techLedger) {
        techLedger.classList.remove("is-open");
        techLedger.setAttribute("aria-hidden", "true");
      }
      if (objectiveTree) {
        objectiveTree.classList.remove("is-open");
        objectiveTree.setAttribute("aria-hidden", "true");
      }
      for (const toggle of [vitalsToggle, resourcesToggle, buildToggle, objectiveToggle, mapToggle]) {
        if (toggle) {
          toggle.classList.remove("is-active");
          toggle.setAttribute("aria-expanded", "false");
        }
      }
      syncMapMinimumBodyControlVisibility(false);
      return;
    }

    const compact = isCompactHudViewport();
    const vitalsVisible = !compact || vitalsHudOpen;

    if (gameVitalsHud) {
      gameVitalsHud.classList.toggle("is-compact", compact);
      gameVitalsHud.classList.toggle("is-compact-open", vitalsVisible);
      gameVitalsHud.setAttribute("aria-hidden", vitalsVisible ? "false" : "true");
    }

    if (vitalsToggle) {
      vitalsToggle.classList.toggle("is-active", compact && vitalsHudOpen);
      vitalsToggle.setAttribute("aria-expanded", compact && vitalsHudOpen ? "true" : "false");
    }

    if (techLedger) {
      techLedger.classList.toggle("is-open", resourcesHudOpen);
      techLedger.setAttribute("aria-hidden", resourcesHudOpen ? "false" : "true");
    }

    if (resourcesToggle) {
      resourcesToggle.classList.toggle("is-active", resourcesHudOpen);
      resourcesToggle.setAttribute("aria-expanded", resourcesHudOpen ? "true" : "false");
    }

    if (objectiveTree) {
      objectiveTree.classList.toggle("is-open", objectivesOpen);
      objectiveTree.setAttribute("aria-hidden", objectivesOpen ? "false" : "true");
    }

    if (objectiveToggle) {
      objectiveToggle.classList.toggle("is-active", objectivesOpen);
      objectiveToggle.setAttribute("aria-expanded", objectivesOpen ? "true" : "false");
    }

    if (mapToggle) {
      mapToggle.classList.toggle("is-active", compact && mapHudOpen);
      mapToggle.setAttribute("aria-expanded", compact && mapHudOpen ? "true" : "false");
    }

    syncMapMinimumBodyControlVisibility(compact);
  }

  function setVitalsHudOpen(open) {
    vitalsHudOpen = Boolean(open);
    syncCompactHudControls();
  }

  function setResourcesHudOpen(open) {
    resourcesHudOpen = Boolean(open);
    syncCompactHudControls();
  }

  function setObjectivesOpen(open) {
    objectivesOpen = Boolean(open);
    if (objectivesOpen) {
      setBuildMenuOpen(false);
      renderObjectiveTree(true);
      resetMouseButtons();
    }
    syncCompactHudControls();
    updateHudEnabledUi();
    updateTouchScreenUi();
  }

  function setMapHudOpen(open) {
    mapHudOpen = Boolean(open);
    syncCompactHudControls();
  }

  function clampTechLedgerPosition(left, top) {
    if (!techLedger) {
      return;
    }

    const rect = techLedger.getBoundingClientRect();
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

    techLedger.style.left = clamp(left, margin, maxLeft) + "px";
    techLedger.style.top = clamp(top, margin, maxTop) + "px";
    techLedger.style.right = "auto";
    techLedger.style.bottom = "auto";
  }

  function beginTechLedgerDrag(event) {
    if (!techLedger || event.button > 0) {
      return;
    }

    const rect = techLedger.getBoundingClientRect();
    techLedgerDrag.active = true;
    techLedgerDrag.pointerId = event.pointerId;
    techLedgerDrag.offsetX = event.clientX - rect.left;
    techLedgerDrag.offsetY = event.clientY - rect.top;
    techLedger.classList.add("is-dragging");
    techLedger.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateTechLedgerDrag(event) {
    if (!techLedgerDrag.active || techLedgerDrag.pointerId !== event.pointerId) {
      return;
    }

    clampTechLedgerPosition(event.clientX - techLedgerDrag.offsetX, event.clientY - techLedgerDrag.offsetY);
    event.preventDefault();
  }

  function endTechLedgerDrag(event) {
    if (!techLedgerDrag.active || techLedgerDrag.pointerId !== event.pointerId) {
      return;
    }

    techLedgerDrag.active = false;
    techLedgerDrag.pointerId = null;
    if (techLedger) {
      techLedger.classList.remove("is-dragging");
      if (techLedger.hasPointerCapture(event.pointerId)) {
        techLedger.releasePointerCapture(event.pointerId);
      }
    }
  }

  function beginObjectiveTreePan(event) {
    if (!objectiveTreeList || event.button > 0 || closestEventTarget(event, ".objective-node")) {
      return;
    }

    objectiveTreePan.active = true;
    objectiveTreePan.pointerId = event.pointerId;
    objectiveTreePan.startX = event.clientX;
    objectiveTreePan.startY = event.clientY;
    objectiveTreePan.scrollLeft = objectiveTreeList.scrollLeft;
    objectiveTreePan.scrollTop = objectiveTreeList.scrollTop;
    objectiveTreePan.scale = objectiveTreeInteractionScale();
    objectiveTreeList.classList.add("is-panning");
    objectiveTreeList.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateObjectiveTreePan(event) {
    if (!objectiveTreePan.active || objectiveTreePan.pointerId !== event.pointerId || !objectiveTreeList) {
      return;
    }

    const deltaX = event.clientX - objectiveTreePan.startX;
    const deltaY = event.clientY - objectiveTreePan.startY;
    const scale = objectiveTreePan.scale || 1;
    objectiveTreeList.scrollLeft = objectiveTreePan.scrollLeft - deltaX / scale;
    objectiveTreeList.scrollTop = objectiveTreePan.scrollTop - deltaY / scale;
    objectiveState.scrollLeft = objectiveTreeList.scrollLeft;
    objectiveState.scrollTop = objectiveTreeList.scrollTop;
    objectiveState.hasUserPanned = true;
    event.preventDefault();
  }

  function endObjectiveTreePan(event) {
    if (!objectiveTreePan.active || objectiveTreePan.pointerId !== event.pointerId) {
      return;
    }

    objectiveTreePan.active = false;
    objectiveTreePan.pointerId = null;
    if (objectiveTreeList) {
      objectiveTreeList.classList.remove("is-panning");
      objectiveState.scrollLeft = objectiveTreeList.scrollLeft;
      objectiveState.scrollTop = objectiveTreeList.scrollTop;
      if (objectiveTreeList.hasPointerCapture(event.pointerId)) {
        objectiveTreeList.releasePointerCapture(event.pointerId);
      }
    }
  }

  function zoomObjectiveTree(event) {
    if (!objectiveTreeList) {
      return;
    }

    const oldZoom = objectiveGraphZoom();
    const nextZoom = clamp(oldZoom * Math.exp(-finiteOr(event.deltaY, 0) * 0.0016), 0.35, 1.8);
    if (Math.abs(nextZoom - oldZoom) < 0.001) {
      event.preventDefault();
      return;
    }

    const rect = objectiveTreeList.getBoundingClientRect();
    const uiScale = objectiveTreeInteractionScale();
    const pointerX = (event.clientX - rect.left) / uiScale;
    const pointerY = (event.clientY - rect.top) / uiScale;
    const graphX = (objectiveTreeList.scrollLeft + pointerX) / oldZoom;
    const graphY = (objectiveTreeList.scrollTop + pointerY) / oldZoom;

    objectiveState.zoom = nextZoom;
    objectiveState.hasUserPanned = true;
    objectiveState.renderSignature = "";
    renderObjectiveTree(true);

    objectiveTreeList.scrollLeft = Math.max(0, graphX * nextZoom - pointerX);
    objectiveTreeList.scrollTop = Math.max(0, graphY * nextZoom - pointerY);
    objectiveState.scrollLeft = objectiveTreeList.scrollLeft;
    objectiveState.scrollTop = objectiveTreeList.scrollTop;
    event.preventDefault();
  }

  function setBuildMenuOpen(open) {
    buildMenuOpen = Boolean(open);
    if (buildMenuOpen) {
      setObjectivesOpen(false);
      cancelStructurePlacement();
      resetMouseButtons();
      renderBuildMenu();
      void refreshSkinEntitlements();
    }
    if (!buildMenu) {
      return;
    }

    buildMenu.classList.toggle("is-open", buildMenuOpen);
    buildMenu.setAttribute("aria-hidden", buildMenuOpen ? "false" : "true");
    if (buildToggle) {
      buildToggle.classList.toggle("is-active", buildMenuOpen);
      buildToggle.setAttribute("aria-expanded", buildMenuOpen ? "true" : "false");
      buildToggle.setAttribute("aria-label", buildMenuOpen ? "Close build menu" : "Open build menu");
    }
    updateToolHotbar();
    updateHudEnabledUi();
    updateTouchScreenUi();
  }

  function serializeTechInventory() {
    const snapshot = {};
    for (const tech of techTypes) {
      snapshot[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0));
    }
    return snapshot;
  }

  function serializeToolInventory() {
    return unlockedToolIds.filter((toolId, index) => toolCatalog.some((tool) => tool.id === toolId) && unlockedToolIds.indexOf(toolId) === index);
  }

  function serializeEquippedToolInventory() {
    return hotbarToolIds.filter((toolId, index) => hasTool(toolId) && hotbarToolIds.indexOf(toolId) === index);
  }

  function serializeToolUpgrades() {
    return normalizeToolUpgrades(toolUpgradeLevels);
  }

  function applyToolInventory(tools, equipped, equippedTools) {
    const validTools = Array.isArray(tools)
      ? tools.filter((toolId, index) => toolCatalog.some((tool) => tool.id === toolId) && tools.indexOf(toolId) === index)
      : [];

    const nextUnlockedToolIds = validTools.includes(defaultToolId) ? validTools : [defaultToolId].concat(validTools);
    const hotbarSource = Array.isArray(equippedTools) ? equippedTools : nextUnlockedToolIds;
    const nextHotbarToolIds = hotbarSource.filter((toolId, index) => nextUnlockedToolIds.includes(toolId) && hotbarSource.indexOf(toolId) === index);
    const nextEquippedToolId = nextHotbarToolIds.includes(equipped) ? equipped : nextHotbarToolIds[0] || null;

    if (
      toolIdListsEqual(unlockedToolIds, nextUnlockedToolIds) &&
      toolIdListsEqual(hotbarToolIds, nextHotbarToolIds) &&
      equippedToolId === nextEquippedToolId
    ) {
      return false;
    }

    unlockedToolIds = nextUnlockedToolIds;
    hotbarToolIds = nextHotbarToolIds;
    equippedToolId = nextEquippedToolId;
    updateToolHotbar();
    renderBuildMenu();
    return true;
  }

  function applyToolUpgrades(snapshot) {
    const nextToolUpgradeLevels = normalizeToolUpgrades(snapshot);
    if (toolUpgradeLevelsEqual(toolUpgradeLevels, nextToolUpgradeLevels)) {
      return false;
    }

    toolUpgradeLevels = nextToolUpgradeLevels;
    renderBuildMenu();
    return true;
  }

  function applyTechInventory(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const tech of techTypes) {
      techInventory[tech.key] = Math.max(0, Math.floor(finiteOr(snapshot[tech.key], techInventory[tech.key] || 0)));
    }
    updateTechUi();
  }

  function difficultyDefinition(id) {
    return difficultyDefinitions[id] || difficultyDefinitions[defaultDifficultyId];
  }

  function activeDifficulty() {
    return difficultyDefinition(runState.difficultyId);
  }

  function difficultyLabel(id) {
    return difficultyDefinition(id).label;
  }

  function normalizeGameMode(mode) {
    return String(mode || "").toLowerCase() === "survival" ? "survival" : "horde";
  }

  function gameModeLabel(mode) {
    return normalizeGameMode(mode) === "survival" ? "Survival" : "Horde Mode";
  }

  function isHordeModeActive() {
    return normalizeGameMode(runState.gameMode) === "horde";
  }

  function applyGameMode(mode) {
    runState.gameMode = normalizeGameMode(mode);
    updateDifficultyUi();
  }

  function setSelectedGameMode(mode) {
    startMenu.selectedGameMode = normalizeGameMode(mode);
    if (!runState.active) {
      applyGameMode(startMenu.selectedGameMode);
    }
  }

  function difficultyMobSpawnInterval(kind) {
    const interval = mobSpawnIntervals[kind] || 1;
    return Math.max(0.5, interval * activeDifficulty().mobIntervalScale);
  }

  function difficultyMobWaveInterval() {
    return Math.max(0.5, mobWaveInterval * activeDifficulty().mobIntervalScale);
  }

  function difficultyMobFirstWaveDelay() {
    return Math.max(0.5, finiteOr(activeDifficulty().mobFirstWaveDelay, difficultyMobWaveInterval()));
  }

  function difficultyMobDamage(damage) {
    return Math.max(0, finiteOr(damage, 0) * finiteOr(activeDifficulty().mobDamageMultiplier, 1));
  }

  function difficultyHealthDropChance(baseChance) {
    return clamp(finiteOr(baseChance, 0) * finiteOr(activeDifficulty().healthDropMultiplier, 1), 0, 0.96);
  }

  function resetMobSpawnTimers() {
    for (const kind of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[kind] = difficultyMobSpawnInterval(kind);
    }
    mobWaveTimer = difficultyMobFirstWaveDelay();
    mobWaveCount = 0;
    mobSpawnRestTimer = 0;
    mobSpawnRestDrainTimer = 0;
    mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
    survivalSpawnState.nextCampCheckTick = 0;
    survivalSpawnState.exploredInitialized = false;
    survivalSpawnState.exploredMinX = 0;
    survivalSpawnState.exploredMaxX = 0;
    survivalSpawnState.exploredMinY = 0;
    survivalSpawnState.exploredMaxY = 0;
  }

  function setDifficultyScreenOpen(open) {
    if (difficultyScreen) {
      difficultyScreen.classList.toggle("is-open", Boolean(open));
      difficultyScreen.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (open) {
      resetMouseButtons();
      renderStartMenu();
    }
    updateTouchScreenUi();
    updateCrazyGamesGameplayState(open ? "difficulty-screen-open" : "difficulty-screen-closed");
  }

  function setGamePaused(paused) {
    const wasPaused = gamePaused;
    const pauseAllowed = !isPartySessionActive();
    gamePaused = Boolean(paused) && runState.active && !deathState.active && pauseAllowed;
    keys.clear();
    jumpQueued = false;
    resetMouseButtons();

    if (wasPaused && !gamePaused) {
      resetFrameClock();
    }
    updateTouchScreenUi();
    updateCrazyGamesGameplayState(gamePaused ? "pause" : "resume");
  }

  function applyDifficulty(id) {
    runState.difficultyId = difficultyDefinitions[id] ? id : defaultDifficultyId;
    resetMobSpawnTimers();
    updateDifficultyUi();
  }

  function updateDifficultyUi() {
    if (difficultyValue) {
      const label = gameModeLabel(runState.gameMode) + " - " + activeDifficulty().label;
      if (difficultyValue.textContent !== label) {
        difficultyValue.textContent = label;
      }
    }
  }
