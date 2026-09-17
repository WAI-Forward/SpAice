  function installClusternautsTestHarness() {
    if (!clusternautsTestConfig) {
      return;
    }

    window.__clusternautsTestHarness = {
      snapshot: function () {
        return createClusternautsFrameRateSnapshot();
      },
      playerId: function () {
        return String(player.id || "");
      },
      objectiveState: function () {
        updateObjectiveState();
        return {
          state: serializeObjectiveState(),
          snapshots: objectiveSnapshots().map(function (snapshot) {
            return {
              id: snapshot.definition.id,
              complete: snapshot.progress.complete,
              value: snapshot.progress.value,
              target: snapshot.progress.target,
              label: snapshot.progress.label,
              available: snapshot.available,
              current: snapshot.current,
              claimed: objectiveIsClaimed(snapshot.definition)
            };
          })
        };
      },
      techInventory: function () {
        return Object.assign({}, techInventory);
      },
      claimObjectiveReward: function (id) {
        claimObjectiveReward(id);
        return {
          objectives: serializeObjectiveState(),
          tech: Object.assign({}, techInventory),
          player: {
            health: player.health,
            maxHealth: player.maxHealth
          }
        };
      },
      completeObjective: function (id) {
        const objectiveId = String(id || "");
        if (objectiveDefinitions.some((definition) => definition.id === objectiveId)) {
          objectiveState.completed[objectiveId] = true;
          objectiveState.renderSignature = "";
        }
        return serializeObjectiveState();
      },
      startRun: function (options) {
        const config = options || {};
        if (config.viewport) {
          window.innerWidth = Math.max(1, Math.floor(finiteOr(config.viewport.width, window.innerWidth || 1280)));
          window.innerHeight = Math.max(1, Math.floor(finiteOr(config.viewport.height, window.innerHeight || 720)));
        }
        if (Number.isFinite(Number(config.cameraZoom))) {
          setCameraZoom(Number(config.cameraZoom));
        }
        resize();
        resetSoloMultiplayerSession();
        if (config.gameMode) {
          applyGameMode(config.gameMode);
        }
        applyDifficulty(config.difficulty || defaultDifficultyId);
        resetLocalPlayerState();
        resetLocalWorldState();
        resetLifeStats();
        resetDeathState();
        resetClusternautsTestCounters();
        resetRenderPerformance();
        configureClusternautsTestInput(config.input);
        runState.active = true;
        gamePaused = false;
        persistence.enabled = false;
        multiplayer.enabled = false;
        setDifficultyScreenOpen(false);
        resetFrameClock();
        return createClusternautsFrameRateSnapshot();
      },
      setInput: function (input) {
        configureClusternautsTestInput(input);
      },
      warmMobBeacon: function (kind, age) {
        const beaconKind = mobTierOrder.includes(String(kind || "")) ? String(kind || "") : "alienoid";
        const beacon = ensureMobBeacon(beaconKind, activeMobSpawnAnchors());
        beacon.health = Math.max(1, finiteOr(beacon.health, beacon.maxHealth));
        beacon.respawnTimer = 0;
        beacon.age = Math.max(finiteOr(beacon.age, 0), finiteOr(age, mobBeaconWarmupDuration));
        mobWaveTimer = 0;
        return createClusternautsFrameRateSnapshot();
      },
      setSettingsOpen: function (open) {
        setSettingsOpen(Boolean(open));
        return {
          settingsOpen,
          gamePaused
        };
      },
      runCommand: function (command) {
        multiplayer.commandUnlocked = true;
        void executeCommand(String(command || ""));
        return createClusternautsFrameRateSnapshot();
      },
      requestLandingToggle: function () {
        return requestLandingToggle();
      },
      startRandomEvent: function (id) {
        const eventId = String(id || "");
        const definition = randomEventDefinitions.find(function (candidate) {
          return candidate.id === eventId;
        });
        if (!definition) {
          return null;
        }
        if (randomEventState.active) {
          finishRandomEvent("test");
        }
        startRandomEvent(definition);
        return createClusternautsFrameRateSnapshot();
      },
      finishRandomEvent: function () {
        finishRandomEvent("test");
        return createClusternautsFrameRateSnapshot();
      },
      step: function (dt) {
        const seconds = Math.max(0, finiteOr(dt, 0));
        if (!runState.active) {
          return createClusternautsFrameRateSnapshot();
        }
        if (deathState.active) {
          updateDeath(seconds);
          return createClusternautsFrameRateSnapshot();
        }
        if (!gamePaused) {
          stepRuntimeGameplayFrame(seconds, { includeExternalSystems: false });
        }
        return createClusternautsFrameRateSnapshot();
      },
      frame: function (dt) {
        const seconds = Math.max(0, finiteOr(dt, 0));
        const now = performance.now();
        beginRenderFrame(seconds);
        if (!runState.active) {
          return createClusternautsFrameRateSnapshot();
        }
        if (deathState.active) {
          updateDeath(seconds);
        } else if (!gamePaused) {
          stepRuntimeGameplayFrame(seconds, { includeExternalSystems: false });
        }
        updateRemoteVisualTransforms(seconds);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        drawBackground();
        drawParticles(now);
        drawRemoteUniverses(now);
        drawRivals(now);
        drawPlayer(now);
        drawDynamicLighting(now);
        drawVignette();
        drawMapOverlay();
        updateHud();
        return createClusternautsFrameRateSnapshot();
      },
      configureParty: function (options) {
        configureClusternautsTestParty(options);
        return createClusternautsFrameRateSnapshot();
      },
      startMultiplayerV2: function (options) {
        const source = options && typeof options === "object" ? options : {};
        if (!multiplayer.partySession) {
          configureClusternautsTestParty({ netcodeVersion: 2 });
        }
        multiplayer.partySession.netcodeVersion = 2;
        return startMultiplayerV2({
          roomId: String(source.roomId || multiplayer.partySession.id || "test-v2"),
          session: multiplayer.partySession,
          snapshot: source.snapshot || buildPersistentPayload(true)
        });
      },
      multiplayerV2State: function () {
        return multiplayer.v2.state && mpV2Sim ? mpV2Sim.serializeState(multiplayer.v2.state) : null;
      },
      applyMultiplayerV2Snapshot: function (message) {
        applyMultiplayerV2Snapshot(message || {});
        return createClusternautsFrameRateSnapshot();
      },
      processMultiplayerV2Events: function (events, options) {
        processMultiplayerV2Events(events, options || {});
        return createClusternautsFrameRateSnapshot();
      },
      respawnMultiplayerPlayer: function () {
        respawnMultiplayerPlayer();
        return createClusternautsFrameRateSnapshot();
      },
      setPlayerState: function (options) {
        configureClusternautsTestPlayerState(options);
        return createClusternautsFrameRateSnapshot();
      },
      advancePartyTimers: function (dt) {
        multiplayer.partyRespawnInvulnerableTimer = Math.max(0, multiplayer.partyRespawnInvulnerableTimer - Math.max(0, finiteOr(dt, 0)));
        return createClusternautsFrameRateSnapshot();
      },
      setDuel: function (playerId, enabled) {
        const id = String(playerId || "");
        if (id && enabled) {
          multiplayer.duels.add(id);
        } else if (id) {
          multiplayer.duels.delete(id);
        }
        return createClusternautsFrameRateSnapshot();
      },
      applyEntityEffect: function (message) {
        const source = message && typeof message === "object" ? message : {};
        applyRemoteEntityEffect({
          fromPlayerId: String(source.fromPlayerId || ""),
          fromTeamId: String(source.fromTeamId || ""),
          targetUniverseId: multiplayer.universeId,
          effect: source.effect || source
        });
        return createClusternautsFrameRateSnapshot();
      },
      setParticles: setClusternautsTestParticles,
      getParticles: function () {
        return particles.map(serializeParticle);
      },
      setStructures: function (items) {
        structures.length = 0;
        if (Array.isArray(items)) {
          for (const structure of items) {
            structures.push(Object.assign({}, structure));
          }
        }
        return {
          structures: structures.map(function (structure) {
            return Object.assign({}, structure);
          })
        };
      },
      getStructures: function () {
        return structures.map(function (structure) {
          return Object.assign({}, structure);
        });
      },
      scoredBodyIds: function () {
        return Array.from(connectedScoredBodyIds());
      },
      setAlienoids: function (items) {
        rivals.length = 0;
        for (const mob of Array.isArray(items) ? items : []) {
          rivals.push(Object.assign({}, mob));
        }
        return rivals.map(function (mob) {
          return Object.assign({}, mob);
        });
      },
      getAlienoids: function () {
        return rivals.map(function (mob) {
          return Object.assign({}, mob);
        });
      },
      setTechPickups: setClusternautsTestTechPickups,
      getTechPickups: function () {
        return techPickups.map(serializeTechPickup);
      },
      setHealthPickups: setClusternautsTestHealthPickups,
      getHealthPickups: function () {
        return healthPickups.map(serializeHealthPickup);
      },
      setTeslas: setClusternautsTestTeslas,
      getTeslas: function () {
        return teslas.map(serializeTesla);
      },
      getRivalProjectiles: function () {
        return rivalProjectiles.map(serializeProjectile);
      },
      localPhysicsOwner: function (type, id) {
        const session = localPartyPhysicsSession(type, id, performance.now());
        return session ? session.playerId || "" : "";
      },
      partyPhysicsOwner: function (type, id) {
        const session = partyPhysicsSession(type, id, performance.now());
        return session ? session.playerId || "" : "";
      },
      applyWorldSnapshot: function (world, options) {
        applyWorldSnapshot(world || {}, options || { smoothParticles: true, smoothEntities: true });
        return {
          particles: particles.map(serializeParticle),
          rivalProjectiles: rivalProjectiles.map(serializeProjectile),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyWorldSnapshot: function (message) {
        applyPartyWorldSnapshot(message || {});
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyPlayerSnapshot: function (message) {
        applyPartyPlayerSnapshot(message || {});
        return createClusternautsFrameRateSnapshot();
      },
      applyHealthPickupClaim: function (message) {
        applyHealthPickupClaim(message || {});
        return createClusternautsFrameRateSnapshot();
      },
      applyRemoteSnapshot: function (message) {
        applyRemoteSnapshot(message || {});
        updateRemoteVisualTransforms(0);
        return createClusternautsFrameRateSnapshot();
      },
      remotePlayerSnapshot: function (playerId) {
        const remote = multiplayer.remoteUniverses.get("solo:" + String(playerId || ""));
        return remote && remote.snapshot && remote.snapshot.player ? { ...remote.snapshot.player } : null;
      },
      setJoinedPlayerIsolation: function (options) {
        return configureJoinedPlayerIsolation(options || {});
      },
      joinedPlayerIsolation: function () {
        return {
          active: isJoinedPlayerIsolationActive(),
          enabled: joinedPlayerIsolation.enabled,
          components: { ...joinedPlayerIsolation.components }
        };
      },
      applyPartyPhysicsRequest: function (options) {
        const source = options && typeof options === "object" ? options : {};
        handlePartyPhysicsSessionRequest({
          type: source.messageType || "party.physics.start",
          fromPlayerId: String(source.playerId || "joiner"),
          entityType: source.entityType || "particle",
          entityId: source.entityId,
          seq: Math.max(0, Math.floor(finiteOr(source.seq, 1))),
          state: source.state || null,
          actor: source.actor || { id: String(source.playerId || "joiner"), x: 0, y: 0, vx: 0, vy: 0, radius: player.radius, equippedTool: defaultToolId, toolMode: source.mode || "pull", energy: 100, aimAngle: 0 },
          mode: source.mode || "pull",
          active: source.active !== false,
          reason: source.reason || ""
        });
        return {
          owner: source.entityType && source.entityId ? (partyPhysicsSession(source.entityType, source.entityId, performance.now()) || {}).playerId || "" : "",
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      endPartyPhysicsRequest: function (options) {
        const source = options && typeof options === "object" ? options : {};
        handlePartyPhysicsEndRequest({
          type: "party.physics.end",
          fromPlayerId: String(source.playerId || "joiner"),
          entityType: source.entityType || "particle",
          entityId: source.entityId,
          seq: Math.max(0, Math.floor(finiteOr(source.seq, 1))),
          state: source.state || null,
          actor: source.actor || { id: String(source.playerId || "joiner"), x: 0, y: 0, vx: 0, vy: 0, radius: player.radius, equippedTool: defaultToolId, toolMode: source.mode || "pull", energy: 100, aimAngle: 0 },
          mode: source.mode || "pull",
          active: source.active !== false,
          reason: source.reason || "ended"
        });
        return {
          owner: source.entityType && source.entityId ? (partyPhysicsSession(source.entityType, source.entityId, performance.now()) || {}).playerId || "" : "",
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyPhysicsAuthority: function (message) {
        applyPartyPhysicsAuthority(message || {});
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      applyPartyPhysicsReject: function (message) {
        applyPartyPhysicsReject(message || {});
        return {
          particles: particles.map(serializeParticle),
          techPickups: techPickups.map(serializeTechPickup),
          healthPickups: healthPickups.map(serializeHealthPickup)
        };
      },
      rememberBucketBodies: function (bodyIds) {
        return buildPartyInputSnapshot(multiplayer.partyInputSeq + 1);
      },
      previewPartyInput: function (seq) {
        return buildPartyInputSnapshot(Math.max(1, Math.floor(finiteOr(seq, multiplayer.partyInputSeq + 1))));
      },
      applyPartyGadgetForces: function (options) {
        const source = options && typeof options === "object" ? options : {};
        const state = createClusternautsTestPartyState(source);
        const body = bodyById(Math.max(1, Math.floor(finiteOr(source.bodyId, 0))));
        const changed = applyActorGadgetForces(body, state, Math.max(0, finiteOr(source.dt, 1 / 30)), source.forceOptions || {});
        return {
          changed,
          particles: particles.map(serializeParticle)
        };
      },
      mergeParticles: function () {
        mergeParticles();
        return particles.map(serializeParticle);
      },
      resolvePartyBucket: function (options) {
        const source = options && typeof options === "object" ? options : {};
        const state = createClusternautsTestPartyState(source);
        const body = bodyById(Math.max(1, Math.floor(finiteOr(source.bodyId, 0))));
        const changed = resolveActorFunnelBucket(body, state, Math.max(0, finiteOr(source.dt, 1 / 30)));
        return {
          changed,
          particles: particles.map(serializeParticle)
        };
      },
      initializeCrazyGamesIntegration: initializeCrazyGamesIntegration,
      promptCrazyGamesLogin: function () {
        return promptCrazyGamesLogin();
      },
      logoutAccount: function () {
        return logoutAccount();
      },
      setCrazyGamesGameplayActive: function (active, reason) {
        setCrazyGamesGameplayActive(active, reason || "test");
        return {
          gameplayActive: crazyGamesState.gameplayActive
        };
      },
      setCrazyGamesLoadingActive: function (active, reason) {
        setCrazyGamesLoadingActive(active, reason || "test");
        return {
          loadingActive: crazyGamesState.loadingActive
        };
      },
      withCrazyGamesLoading: function (reason, fail) {
        return withCrazyGamesLoading(reason || "test", async function () {
          if (fail) {
            throw new Error("test loading failure");
          }
          return {
            loadingActive: crazyGamesState.loadingActive
          };
        });
      },
      reportCrazyGamesRoom: function (state) {
        const source = state || {};
        multiplayer.friendJoinsEnabled = source.friendJoinsEnabled !== false;
        multiplayer.roomId = String(source.roomId || "");
        multiplayer.roomMode = String(source.mode || "world-overlap");
        multiplayer.roomPlayerCount = Math.max(0, Math.floor(finiteOr(source.playerCount, 1)));
        multiplayer.roomMaxPlayers = Math.max(1, Math.floor(finiteOr(source.maxPlayers, crazyGamesRoomMaxPlayers)));
        multiplayer.roomJoinable = source.isJoinable !== false;
        reportCrazyGamesRoom(source.reason || "test-room");
        return {
          lastRoomReport: crazyGamesState.lastRoomReport,
          inviteLinkPending: crazyGamesState.inviteLinkPending,
          inviteLink: crazyGamesState.inviteLink
        };
      },
      leaveCrazyGamesRoom: function (reason) {
        leaveCrazyGamesRoom(reason || "test-leave");
        return {
          lastRoomReport: crazyGamesState.lastRoomReport,
          inviteLink: crazyGamesState.inviteLink
        };
      },
      handleCrazyGamesJoinParams: function (inviteParams, reason) {
        return handleCrazyGamesJoinParams(inviteParams, reason || "test-invite");
      },
      applyCrazyGamesRoomState: function (message) {
        applyCrazyGamesRoomState(message || {});
        return {
          roomId: multiplayer.roomId,
          roomMode: multiplayer.roomMode,
          roomPlayerCount: multiplayer.roomPlayerCount,
          roomMaxPlayers: multiplayer.roomMaxPlayers,
          roomJoinable: multiplayer.roomJoinable
        };
      },
      crazyGamesState: function () {
        return {
          gameplayActive: crazyGamesState.gameplayActive,
          loadingActive: crazyGamesState.loadingActive,
          hasAuthListener: typeof crazyGamesState.authListener === "function",
          hasRoomJoinListener: typeof crazyGamesState.roomJoinListener === "function",
          user: crazyGamesState.user,
          instantMultiplayer: crazyGamesState.instantMultiplayer,
          instantMultiplayerHandled: crazyGamesState.instantMultiplayerHandled
        };
      },
      gamePixState: function () {
        return {
          gameplayActive: gamePixState.gameplayActive,
          loadingActive: gamePixState.loadingActive,
          lastScore: gamePixState.lastScore,
          lastLevel: gamePixState.lastLevel,
          submittedScoreKey: gamePixState.submittedScoreKey
        };
      },
      loadPersistentState: function () {
        return loadPersistentState();
      },
      savePersistentState: function (options) {
        return savePersistentState(options || { includeWorld: true });
      },
      saveManualGame: function (name) {
        if (saveGameNameInput && name !== undefined) {
          saveGameNameInput.value = String(name || "");
        }
        return saveManualGame();
      },
      loadManualGame: function (saveId) {
        return loadManualGame(saveId);
      },
      accountState: function () {
        return {
          username: accountState.username,
          displayName: accountState.displayName,
          saves: accountState.saves.map((save) => Object.assign({}, save)),
          currentSaveId: accountState.currentSaveId,
          currentSaveName: accountState.currentSaveName,
          currentSaveUsername: accountState.currentSaveUsername,
          savesLoading: accountState.savesLoading
        };
      },
      submitDeathLeaderboardScore: function (stats, runName) {
        return submitDeathLeaderboardScore(stats || {}, runName || "Test Pilot");
      },
      setPersistenceEnabled: function (enabled) {
        persistence.enabled = Boolean(enabled);
        return {
          enabled: persistence.enabled,
          storage: persistence.storage
        };
      },
      persistenceState: function () {
        return {
          enabled: persistence.enabled,
          online: persistence.online,
