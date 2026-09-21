  function damageLocalPlayer(damage, options) {
    if (deathState.active || player.health <= 0) {
      return false;
    }
    if (multiplayer.partyRespawnInvulnerableTimer > 0) {
      return false;
    }

    const amount = Math.max(0, finiteOr(damage, 0));
    if (amount <= 0) {
      return false;
    }

    player.health = Math.max(0, player.health - amount);
    player.hitCooldown = Math.max(player.hitCooldown, finiteOr(options && options.cooldown, 0.7));
    player.hitFlash = Math.max(player.hitFlash, finiteOr(options && options.flash, 0.3));

    if (player.health <= 0) {
      beginPlayerDeath(options && options.cause ? options.cause : "Hull failure");
      return true;
    }

    playSound("hit");
    return false;
  }

  function jamLocalPlayerTools(duration) {
    const amount = Math.max(0, finiteOr(duration, 0));
    if (amount <= 0 || deathState.active) {
      return;
    }

    applyPlayerStatusEffect("disabled", amount);
    playSound("jam");
    maybeNotifyText("Tools disabled by electrical surge.");
  }

  function beginPlayerDeath(cause) {
    if (deathState.active) {
      return;
    }

    deathState.active = true;
    deathState.summaryReady = false;
    deathState.timer = 0;
    deathState.cause = cause || "Hull failure";
    deathState.stats = collectDeathStats();
    updateCrazyGamesGameplayState("death");
    if (!isPartySessionActive()) {
      clearCrazyGamesRoomState("death");
    }
    resetDeathLeaderboardForm();
    if (!clusternautsTestConfig) {
      void saveDeathLeaderboardRun();
    }
    playSound("death", { throttle: 0.8 });
    keys.clear();
    resetMouseButtons();
    jumpQueued = false;
    setBuildMenuOpen(false);
    setCommandOpen(false);
    setSocialPanelOpen(false);
    setLeaderboardOpen(false);
    hideSignalPrompt();
    broadcastPlayerDeathDrop();

    if (player.landed) {
      detachFromBody(120);
    }

    for (let i = 0; i < 18; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(50, 230);
      sparks.push({
        x: player.x + Math.cos(angle) * randomRange(8, player.radius),
        y: player.y + Math.sin(angle) * randomRange(8, player.radius),
        radius: randomRange(20, 58),
        color: i % 3 === 0 ? { r: 255, g: 98, b: 98 } : { r: 116, g: 244, b: 255 },
        life: randomRange(0.35, 0.9),
        maxLife: 0.9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      });
    }
  }

  function broadcastPlayerDeathDrop() {
    sendMultiplayer({
      type: "player.death",
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy
    });
  }

  function spawnCommunicationTechDrop(x, y, vx, vy, sourceName) {
    for (let i = 0; i < 3; i += 1) {
      techPickups.push(createTechPickup("communication", x, y, vx, vy));
    }
    maybeNotifyText((sourceName || "A contact") + " dropped communication tech.");
  }

  function updateDeath(dt) {
    deathState.timer += dt;
    player.vx *= Math.pow(0.42, dt);
    player.vy *= Math.pow(0.42, dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    for (const spark of sparks) {
      if (Number.isFinite(spark.vx) || Number.isFinite(spark.vy)) {
        spark.x += finiteOr(spark.vx, 0) * dt;
        spark.y += finiteOr(spark.vy, 0) * dt;
      }
    }
    updateSparks(dt);

    if (!deathState.summaryReady && deathState.timer >= deathAnimationDuration) {
      deathState.summaryReady = true;
      renderDeathStats();
      setDeathScreenOpen(true);
    }
  }

  async function resetAfterDeath(options) {
    if (deathState.resetInFlight) {
      return;
    }

    const config = options && typeof options === "object" ? options : {};
    const restartRun = config.restartRun === true;
    const loadingButton = config.button || playAgainButton;
    const nextStartMenuView = config.startMenuView || "main";
    const loadingText = config.loadingText || (restartRun ? "Restarting..." : "Resetting...");
    const doneText = config.doneText || (loadingButton === deathMainMenuButton ? "Exit to main menu" : "Restart run");
    const previousDifficultyId = runState.difficultyId;
    const previousGameMode = normalizeGameMode(runState.gameMode);

    deathState.resetInFlight = true;
    if (playAgainButton) {
      playAgainButton.disabled = true;
    }
    if (deathMainMenuButton) {
      deathMainMenuButton.disabled = true;
    }
    if (loadingButton) {
      loadingButton.textContent = loadingText;
      loadingButton.classList.add("is-loading");
    }

    const previousPlayerId = player.id;

    try {
      await renameDeathLeaderboardRun();
      await waitForPersistenceIdle();
      if (persistence.enabled && previousPlayerId) {
        await fetchPersistentJson("/api/reset/life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: previousPlayerId })
        });
      }
    } catch (error) {
      console.warn("Clusternauts death reset cleanup failed.", error);
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
      clearCrazyGamesRoomState("death-reset");

      clearStoredNetworkIdentity();
      resetSoloMultiplayerSession();
      runState.active = false;
      gamePaused = false;
      resetLocalPlayerState();
      resetLocalWorldState();
      resetLifeStats();
      initializeNetworkIdentity();
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      resetDeathState();
      if (restartRun) {
        setSelectedGameMode(previousGameMode);
        await beginRunWithDifficulty(previousDifficultyId);
        maybeNotifyText("Run restarted.");
      } else {
        setStartMenuView(nextStartMenuView, { push: false });
        setDifficultyScreenOpen(true);
        ensureOnlinePresence();
        resetMouseButtons();
        resetFrameClock();
        void refreshLeaderboard(true);
        updateHud();
      }
    } catch (error) {
      console.warn("Clusternauts death reset failed.", error);
      deathState.resetInFlight = false;
    } finally {
      if (playAgainButton) {
        playAgainButton.disabled = false;
        playAgainButton.textContent = isPartySessionActive() ? "Respawn" : "Restart run";
        playAgainButton.classList.remove("is-loading");
      }
      if (deathMainMenuButton) {
        deathMainMenuButton.disabled = false;
        deathMainMenuButton.textContent = "Exit to main menu";
        deathMainMenuButton.classList.remove("is-loading");
      }
      if (loadingButton && loadingButton !== playAgainButton && loadingButton !== deathMainMenuButton) {
        loadingButton.textContent = doneText;
        loadingButton.classList.remove("is-loading");
      }
    }
  }

  function restartSingleplayerAfterDeath() {
    return resetAfterDeath({
      button: playAgainButton,
      restartRun: true,
      loadingText: "Restarting...",
      doneText: "Restart run"
    });
  }

  function exitDeathToMainMenu() {
    if (deathState.resetInFlight) {
      return;
    }
    void resetAfterDeath({
      button: deathMainMenuButton,
      loadingText: "Exiting...",
      doneText: "Exit to main menu",
      startMenuView: "main"
    });
  }

  function chooseMultiplayerRespawnPoint(deathX, deathY) {
    const minRespawnDistance = 2400;
    const maxRespawnDistance = 5600;
    const idealRespawnDistance = 3600;
    const idealObjectClearance = 1100;
    let best = null;

    function clearanceFromEntity(x, y, entity, extraPadding) {
      if (!entity) {
        return Infinity;
      }
      const entityX = Number(entity.x);
      const entityY = Number(entity.y);
      if (!Number.isFinite(entityX) || !Number.isFinite(entityY)) {
        return Infinity;
      }
      const radius = Math.max(0, finiteOr(entity.radius, 0)) + Math.max(0, finiteOr(extraPadding, 0));
      return Math.hypot(x - entityX, y - entityY) - radius;
    }

    function objectClearanceAt(x, y) {
      let clearance = Infinity;

      function considerCollection(collection, padding) {
        if (!Array.isArray(collection)) {
          return;
        }
        for (const entity of collection) {
          clearance = Math.min(clearance, clearanceFromEntity(x, y, entity, padding));
        }
      }

      considerCollection(particles, 420);
      considerCollection(rivals, 360);
      considerCollection(ufos, 360);
      considerCollection(rambots, 360);
      considerCollection(engineers, 360);
      considerCollection(teslas, 360);
      considerCollection(rockets, 360);
      considerCollection(fighters, 360);
      considerCollection(techPickups, 220);
      considerCollection(healthPickups, 220);

      for (const structure of structures) {
        if (!structure || structure.health <= 0) {
          continue;
        }
        const structureRadius = typeof structureHitRadius === "function" ? structureHitRadius(structure) : 48;
        clearance = Math.min(clearance, clearanceFromEntity(x, y, Object.assign({}, structure, { radius: structureRadius }), 360));
      }

      for (const anchor of activePartyPlayerAnchors()) {
        if (!anchor || anchor.playerId === player.id) {
          continue;
        }
        clearance = Math.min(clearance, clearanceFromEntity(x, y, anchor, 620));
      }

      return Number.isFinite(clearance) ? clearance : idealObjectClearance;
    }

    function considerCandidate(x, y) {
      const deathDistance = Math.hypot(x - deathX, y - deathY);
      if (deathDistance < minRespawnDistance) {
        return;
      }
      const clearance = objectClearanceAt(x, y);
      const clearanceScore = Math.min(clearance, idealObjectClearance) * 2.4;
      const distanceScore = deathDistance * 0.32 - Math.abs(deathDistance - idealRespawnDistance) * 0.38;
      const score = clearanceScore + distanceScore + randomRange(0, 180);
      if (!best || score > best.score) {
        best = {
          x,
          y,
          score,
          clearance,
          deathDistance
        };
      }
    }

    for (let i = 0; i < 96; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const distance = randomRange(minRespawnDistance, maxRespawnDistance);
      considerCandidate(
        deathX + Math.cos(angle) * distance,
        deathY + Math.sin(angle) * distance
      );
    }

    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12 + randomRange(-0.12, 0.12);
      considerCandidate(
        deathX + Math.cos(angle) * idealRespawnDistance,
        deathY + Math.sin(angle) * idealRespawnDistance
      );
    }

    if (best) {
      return {
        x: best.x,
        y: best.y
      };
    }

    const fallbackAngle = randomRange(0, Math.PI * 2);
    return {
      x: deathX + Math.cos(fallbackAngle) * idealRespawnDistance,
      y: deathY + Math.sin(fallbackAngle) * idealRespawnDistance
    };
  }

  async function respawnMultiplayerPlayer(options) {
    if (!isPartySessionActive() || deathState.resetInFlight) {
      return;
    }

    deathState.resetInFlight = true;
    if (!(options && options.skipLeaderboardPersistence)) {
      await renameDeathLeaderboardRun();
    }
    const spawn = chooseMultiplayerRespawnPoint(player.x, player.y);
    resetLocalPlayerState();
    resetLifeStats();
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.hitCooldown = 0;
    player.hitFlash = 0;
    player.landed = null;
    multiplayer.partyRespawnInvulnerableTimer = 3.5;
    resetDeathState();
    deathState.resetInFlight = false;
    resetFrameClock();
    const respawnSnapshot = buildPersistentPayload(false).player;
    if (isMultiplayerV2Active() && mpV2Sim && typeof mpV2Sim.respawnPlayer === "function") {
      mpV2Sim.respawnPlayer(multiplayer.v2.state, player.id, respawnSnapshot);
      multiplayer.v2.authoritativeState = mpV2Sim.serializeState(multiplayer.v2.state);
      multiplayer.v2.ignoreDeathEventsBeforeTick = Math.max(
        Math.floor(finiteOr(multiplayer.v2.ignoreDeathEventsBeforeTick, 0)),
        Math.floor(finiteOr(multiplayer.v2.lastServerTick, 0)),
        Math.floor(finiteOr(multiplayer.v2.state && multiplayer.v2.state.tick, 0))
      );
      multiplayer.v2.pendingInputs = [];
      multiplayer.v2.fixedAccumulator = 0;
      if (typeof markMultiplayerV2RespawnAckPending === "function") {
        markMultiplayerV2RespawnAckPending();
      }
      syncMultiplayerV2StateToGame({ snapLocal: true });
    }
    sendMultiplayer({
      type: "party.respawn",
      snapshot: {
        player: respawnSnapshot
      }
    });
    maybeNotifyText("Respawned.");
  }

  function continueAfterDeath() {
    return isPartySessionActive()
      ? respawnMultiplayerPlayer()
      : restartSingleplayerAfterDeath();
  }
