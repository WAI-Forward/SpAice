  function stepGameplaySimulation(dt, options) {
    const includeExternalSystems = !options || options.includeExternalSystems !== false;
    if (isMultiplayerV2Active()) {
      stepMultiplayerV2Simulation(dt, includeExternalSystems);
      return;
    }
    if (isSharedWorldFollower()) {
      stepSharedWorldFollowerSimulation(dt, includeExternalSystems);
      return;
    }

    updateLifeStats();
    updateToolDisable(dt);
    updateEnergySystems(dt);
    updateToolEnergyUsage(dt);
    updatePlayer(dt);
    updatePersonalTether(dt);
    updateGadgetAim(dt);
    updateEquippedTool(dt);
    updateLandedGadgetThrust(dt);
    updatePartyLandedGadgetThrusts(dt);
    updateRandomEvents(dt);
    updateMobSpawns(dt);
    updateMobBeaconGadgetForces(dt);
    updateParticles(dt);
    updateVisciousVacuumMobs(dt);
    updateSpacecrafts(dt);
    applyLandedSurfaceConstraint();
    updateRivals(dt);
    updateUfos(dt);
    updateRambots(dt);
    updateEngineers(dt);
    updateTeslas(dt);
    updateRockets(dt);
    updateFighters(dt);
    updateStructures(dt);
    applyLandedSurfaceConstraint();
    updatePlayerLasers(dt);
    updateLauncherMissiles(dt);
    resolveShieldGeneratorMobCollisions(dt);
    resolveMobBodyCollisions();
    damageMobsWithProjectiles();
    resolveRemoteBodyPlayerCollisions();
    resolveRemoteBodyMobCollisions();
    updateSparks(dt);
    updateHealthPickups(dt);
    updateTechPickups(dt);
    if (includeExternalSystems) {
      updatePersistence(dt);
      updateMultiplayer(dt);
    }
  }

  function stepSharedWorldFollowerSimulation(dt, includeExternalSystems) {
    updateLifeStats();
    updateToolDisable(dt);
    updatePlayerEnergySystems(dt);
    updateToolEnergyUsage(dt);
    updatePlayer(dt);
    updatePersonalTether(dt);
    updateGadgetAim(dt);
    updateEquippedTool(dt);
    updatePlayerLasers(dt, { relaySharedWorldHits: joinedPlayerIsolationAllows("relayHostEntityEffects") });
    if (joinedPlayerIsolationAllows("followerWorldSmoothing")) {
      updateFollowerWorldSmoothing(dt);
    }
    if (joinedPlayerIsolationAllows("followerGadgetPrediction")) {
      updateFollowerGadgetPrediction(dt);
    }
    if (joinedPlayerIsolationAllows("followerPickupPrediction")) {
      updateFollowerTechPickups();
      updateFollowerHealthPickups();
    }
    applyLandedSurfaceConstraint();
    if (joinedPlayerIsolationAllows("followerBodyCollisions")) {
      resolveFollowerPlayerBodyCollisions();
    }
    updateSparks(dt);

    if (includeExternalSystems) {
      updatePersistence(dt);
      updateMultiplayer(dt);
    }
  }

  function stepRuntimeGameplayFrame(frameDt, options) {
    const includeExternalSystems = !options || options.includeExternalSystems !== false;
    if (isMultiplayerV2Active()) {
      stepGameplaySimulation(multiplayerV2FrameDt(frameDt), { includeExternalSystems });
      return;
    }
    if (isSharedWorldFollower()) {
      stepGameplaySimulation(Math.min(0.033, Math.max(0, finiteOr(frameDt, 0))), { includeExternalSystems });
      return;
    }

    const dt = Math.min(soloSimulationMaxFrameDt, Math.max(0, finiteOr(frameDt, 0)));
    soloSimulationAccumulator = Math.min(soloSimulationMaxAccumulator, soloSimulationAccumulator + dt);

    let steps = 0;
    while (soloSimulationAccumulator + 0.000001 >= soloSimulationTickDt && steps < soloSimulationMaxCatchUpSteps) {
      soloSimulationAccumulator -= soloSimulationTickDt;
      stepGameplaySimulation(soloSimulationTickDt, { includeExternalSystems });
      steps += 1;
    }

    if (steps >= soloSimulationMaxCatchUpSteps) {
      soloSimulationAccumulator = Math.min(soloSimulationAccumulator, soloSimulationTickDt * soloSimulationMaxCatchUpSteps);
    }
  }

  function tick(now) {
    const frameDt = Math.max(0, (now - lastTime) / 1000 || 0);
    const dt = Math.min(0.033, frameDt);
    lastTime = now;
    beginRenderFrame(frameDt);
    requestAudioResume();

    if (!runState.active) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawParticles(now);
      drawDynamicLighting(now);
      updateHud();
      requestAnimationFrame(tick);
      return;
    }

    if (deathState.active) {
      updateDeath(dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawParticles(now);
      drawRemoteUniverses(now);
      drawRivals(now);
      drawPlayer(now);
      drawDynamicLighting(now);
      drawDeathVignette();
      updateHud();
      requestAnimationFrame(tick);
      return;
    }

    if (gamePaused) {
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
      requestAnimationFrame(tick);
      return;
    }

    stepRuntimeGameplayFrame(frameDt);

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

    requestAnimationFrame(tick);
  }

  function resetClusternautsTestCounters() {
    clusternautsTestCounters.particleMerges = 0;
    clusternautsTestCounters.bodyBounces = 0;
    clusternautsTestCounters.buildMenuRenders = 0;
  }

  function configureClusternautsTestInput(input) {
    keys.clear();
    const codes = input && Array.isArray(input.keys) ? input.keys : [];
    for (const code of codes) {
      if (typeof code === "string" && code) {
        keys.add(code);
      }
    }

    if (input && input.mouse) {
      mouse.x = finiteOr(input.mouse.x, mouse.x);
      mouse.y = finiteOr(input.mouse.y, mouse.y);
      mouse.left = Boolean(input.mouse.left);
      mouse.middle = Boolean(input.mouse.middle);
      mouse.right = Boolean(input.mouse.right);
      mouse.seen = true;
    } else {
      resetMouseButtons();
    }
  }

  function countWorldMass(list) {
    return list.reduce(function (total, body) {
      return total + Math.max(0, finiteOr(body.mass, 0));
    }, 0);
  }

  function createClusternautsFrameRateSnapshot() {
    const majorBodies = particles.filter(function (particle) {
      return finiteOr(particle.mass, 0) >= mappedBodyThreshold;
    });
    const mobCounts = {
      alienoids: rivals.length,
      ufos: ufos.length,
      rambots: rambots.length,
      engineers: engineers.length,
      teslas: teslas.length,
      rockets: rockets.length,
      fighters: fighters.length
    };
    const mobCount = Object.keys(mobCounts).reduce(function (total, key) {
      return total + mobCounts[key];
    }, 0);

    updateLifeStats();

    const playerEnergyDisabled = typeof isLocalPlayerEnergyDisabled === "function" ? isLocalPlayerEnergyDisabled() : toolDisabledTimer > 0;
    return {
      active: runState.active,
      difficulty: runState.difficultyId,
      deathActive: deathState.active,
      player: {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        health: player.health,
        maxHealth: player.maxHealth,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        statusEffects: serializePlayerStatusEffects(),
        toolDisabledTimer,
        aimAngle: Math.atan2(getAim().world.y, getAim().world.x),
        aimLocalAngle: getAim().angle,
        landed: normalizeLandingSnapshot(player.landed),
        spacecraftInterior: normalizeSpacecraftInteriorSnapshot(player.spacecraftInterior),
        walkCycle: player.walkCycle,
        cameraRoll,
        cameraZoom,
        bodyRotation: typeof playerSurfaceRotation === "function" ? playerSurfaceRotation() : 0,
        hitCooldown: player.hitCooldown,
        respawnInvulnerable: multiplayer.partyRespawnInvulnerableTimer
      },
      renderStatus: {
        statusEffects: typeof activePlayerStatusEffectEntries === "function"
          ? activePlayerStatusEffectEntries().map(function (effect) {
            return {
              id: effect.id,
              remaining: effect.remaining,
              maxDuration: effect.maxDuration,
              seconds: effect.seconds,
              progress: clamp(effect.remaining / Math.max(0.001, effect.maxDuration), 0, 1)
            };
          })
          : [],
        playerEnergyBar: {
          disabled: playerEnergyDisabled,
          blockedIcon: playerEnergyDisabled,
          colors: typeof playerEnergyStatusBarColors === "function"
            ? playerEnergyStatusBarColors(playerEnergyDisabled, playerEnergyPct())
            : null
        },
        jetpackBoostFlame: {
          active: typeof isJetpackBoostFlameActive === "function"
            ? isJetpackBoostFlameActive(1 / 60)
            : false
        }
      },
      particles: {
        count: particles.length,
        totalMass: countWorldMass(particles),
        majorCount: majorBodies.length,
        majorMass: countWorldMass(majorBodies),
        largestMass: particles.reduce(function (largest, particle) {
          return Math.max(largest, finiteOr(particle.mass, 0));
        }, 0)
      },
      structures: {
        count: structures.length
      },
      spacecrafts: spacecrafts.map(function (craft) {
        return {
          id: craft.id,
          blueprintId: craft.blueprintId,
          eventId: craft.eventId || "",
          name: craft.name,
          x: craft.x,
          y: craft.y,
          vx: craft.vx,
          vy: craft.vy,
          door: craft.door ? { ...craft.door } : null,
          components: craft.components.map(function (component) {
            return {
              id: component.id,
              kind: component.kind,
              x: component.x,
              y: component.y,
              w: component.w,
              h: component.h,
              floorInset: component.floorInset,
              health: component.health,
              maxHealth: component.maxHealth
            };
          })
        };
      }),
      randomEvent: randomEventState.active ? { ...randomEventState.active } : null,
      effects: {
        sparks: {
          count: sparks.length,
          latest: sparks.slice(-6).map(function (spark) {
            return {
              x: spark.x,
              y: spark.y,
              radius: spark.radius,
              color: spark.color,
              life: spark.life,
              maxLife: spark.maxLife
            };
          })
        }
      },
      mobs: Object.assign({
        total: mobCount
      }, mobCounts),
      score: {
        current: lifeStats.currentScore,
        best: lifeStats.bestScore,
        body: lifeStats.bodyScore,
        mob: lifeStats.mobScore
      },
      events: {
        particleMerges: clusternautsTestCounters.particleMerges,
        bodyBounces: clusternautsTestCounters.bodyBounces,
        buildMenuRenders: clusternautsTestCounters.buildMenuRenders,
        playerAbsorptions: lifeStats.absorbedParticleCount,
        mobsDefeated: lifeStats.mobsDefeated
      }
    };
  }

  function normalizeClusternautsTestPartyPlayers(players) {
    const source = Array.isArray(players) && players.length ? players : [player.id];
    return source.map((entry) => {
      if (typeof entry === "string") {
        return {
          playerId: entry,
          publicName: entry,
          online: true
        };
      }
      const playerId = String(entry && entry.playerId || "");
      return playerId
        ? {
            playerId,
            publicName: String(entry.publicName || playerId),
            online: entry.online !== false
          }
        : null;
    }).filter(Boolean);
  }

  function configureClusternautsTestParty(options) {
    const config = options || {};
    player.id = String(config.playerId || player.id || "local-player");
    multiplayer.universeId = "solo:" + player.id;
    multiplayer.partyHostId = String(config.hostPlayerId || player.id);
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    multiplayer.partySession = {
      id: String(config.sessionId || "test-party"),
      lobbyId: "",
      players: normalizeClusternautsTestPartyPlayers(config.players || [multiplayer.partyHostId, player.id]),
      pvpMode: String(config.pvpMode || "party-off"),
      netcodeVersion: Math.max(1, Math.floor(finiteOr(config.netcodeVersion, 1)))
    };
    multiplayer.partyMode = "party";
    multiplayer.partyPlayerSnapshots.clear();
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    multiplayer.duels.clear();
    multiplayer.anomaly = config.anomalyTeamId
      ? {
          id: "test-anomaly",
          teamId: String(config.anomalyTeamId),
          phase: "overlap",
          endsAt: Date.now() + 60000
        }
      : null;
  }

  function configureClusternautsTestPlayerState(options) {
    const config = options || {};
    if (Number.isFinite(Number(config.x))) {
      player.x = Number(config.x);
    }
    if (Number.isFinite(Number(config.y))) {
      player.y = Number(config.y);
    }
    if (Number.isFinite(Number(config.vx))) {
      player.vx = Number(config.vx);
    }
    if (Number.isFinite(Number(config.vy))) {
      player.vy = Number(config.vy);
    }
    if (Number.isFinite(Number(config.cameraRoll))) {
      cameraRoll = Number(config.cameraRoll);
    }
    if (Number.isFinite(Number(config.gadgetAngle))) {
      gadgetAngle = Number(config.gadgetAngle);
    }
    if (Number.isFinite(Number(config.health))) {
      player.health = clamp(Number(config.health), 0, player.maxHealth);
    }
    if (Number.isFinite(Number(config.maxHealth))) {
      player.maxHealth = clamp(Number(config.maxHealth), 1, 100);
      player.health = clamp(player.health, 0, player.maxHealth);
    }
    if (Number.isFinite(Number(config.hitCooldown))) {
      player.hitCooldown = Math.max(0, Number(config.hitCooldown));
    }
    if (Number.isFinite(Number(config.maxEnergy))) {
      player.maxEnergy = clamp(Number(config.maxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
      player.energy = clamp(player.energy, 0, player.maxEnergy);
    }
    if (Number.isFinite(Number(config.energy))) {
      player.energy = clamp(Number(config.energy), 0, player.maxEnergy);
    }
    if (Number.isFinite(Number(config.toolDisabledTimer))) {
      playerStatusEffects.disabled = Math.max(0, Number(config.toolDisabledTimer));
      playerStatusEffectMaxDurations.disabled = playerStatusEffects.disabled;
      syncLegacyToolDisabledTimer();
    }
    if (config.statusEffects && typeof config.statusEffects === "object") {
      applySerializedPlayerStatusEffects(config.statusEffects);
    }
    if (Number.isFinite(Number(config.respawnInvulnerable))) {
      multiplayer.partyRespawnInvulnerableTimer = Math.max(0, Number(config.respawnInvulnerable));
    }
  }

  function setClusternautsTestParticles(list) {
    particles.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const particle = normalizeParticleSnapshot(entry);
      if (particle) {
        particles.push(particle);
      }
    }
    nextParticleId = Math.max(
      nextParticleId,
      particles.reduce((largest, particle) => Math.max(largest, finiteOr(particle.id, 0) + 1), 1)
    );
    return particles.map(serializeParticle);
  }

