  function buildPersistentPayload(includeWorld) {
    const aim = getAim();
    const toolMode = multiplayerLocalToolModeForInput();
    const jetpackMove = typeof jetpackLocalMoveVector === "function"
      ? jetpackLocalMoveVector()
      : { x: 0, y: -1 };
    const payload = {
      playerId: player.id,
      player: {
        id: player.id,
        name: player.name,
        skinId: activeSkinId(),
        trailId: activeTrailId(),
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        radius: player.radius,
        health: player.health,
        maxHealth: player.maxHealth,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        statusEffects: serializePlayerStatusEffects(),
        toolDisabledTimer,
        score: Math.max(1, Math.round(lifeStats.bestScore || lifeStats.currentScore || 1)),
        difficulty: runState.difficultyId,
        tech: serializeTechInventory(),
        tools: serializeToolInventory(),
        equippedTools: serializeEquippedToolInventory(),
        toolUpgrades: serializeToolUpgrades(),
        objectives: serializeObjectiveState(),
        equippedTool: equippedToolId,
        landed: player.landed,
        spacecraftInterior: player.spacecraftInterior,
        walkCycle: player.walkCycle,
        cameraRoll,
        hasCommunicationRelay: hasCommunicationRelay(),
        aimAngle: Math.atan2(aim.world.y, aim.world.x),
        aimLocalAngle: aim.angle,
        toolMode,
        toolActive: toolMode !== "idle",
        personalTether: serializePersonalTether(),
        gameMode: normalizeGameMode(runState.gameMode),
        moving: isMoving(),
        boosting: typeof isJetpackBoostFlameActive === "function"
          ? isJetpackBoostFlameActive(renderPerformance.lastFrameDt || 1 / 60)
          : false,
        jetpackMoveX: finiteOr(jetpackMove.x, 0),
        jetpackMoveY: finiteOr(jetpackMove.y, -1),
        crouching: Boolean(player.landed && isMovementKeyPressed("down"))
      }
    };

    if (includeWorld) {
      payload.world = {
        elapsed: performance.now() / 1000,
        particles: particles.map(serializeParticle),
        alienoids: rivals.map(serializeRival),
        ufos: ufos.map(serializeUfo),
        rambots: rambots.map(serializeRambot),
        engineers: engineers.map(serializeEngineer),
        teslas: teslas.map(serializeTesla),
        rockets: rockets.map(serializeRocket),
        fighters: fighters.map(serializeFighter),
        mobBeacons: isHordeModeActive() ? mobBeacons.map(serializeMobBeacon) : [],
        structures: structures.map(serializeStructure),
        spacecrafts: spacecrafts.map(serializeSpacecraft),
        rivalProjectiles: rivalProjectiles.map(serializeProjectile),
        techPickups: techPickups.map(serializeTechPickup),
        healthPickups: healthPickups.map(serializeHealthPickup),
        starDust: starDust.map(serializeStar),
        nextParticleId,
        nextAlienoidId: nextRivalId,
        nextUfoId,
        nextRambotId,
        nextEngineerId,
        nextTeslaId,
        nextRocketId,
        nextFighterId,
        nextMobBeaconId,
        nextSurvivalCampId,
        nextStructureId,
        nextSpacecraftId,
        nextRivalProjectileId,
        nextTechPickupId,
        nextHealthPickupId,
        difficulty: runState.difficultyId,
        gameMode: normalizeGameMode(runState.gameMode),
        mobSpawnTimers: { ...mobSpawnTimers },
        mobWaveTimer,
        mobWaveCount,
        mobSpawnRestTimer,
        mobSpawnRestDrainTimer,
        mobSpawnRestCooldownTimer,
        mobDefeatsByKind: { ...mobDefeatsByKind },
        mobBossDefeatsByKind: { ...mobBossDefeatsByKind },
        mobBossProgressByKind: { ...mobBossProgressByKind },
        mobBossWarnings: serializeMobBossWarnings(),
        survivalSpawnState: serializeSurvivalSpawnState(),
        objectives: serializeObjectiveState(),
        randomEvents: serializeRandomEventState()
      };
    }

    return payload;
  }

  function applyPersistentPayload(data, options) {
    if (!data || !data.ok) {
      return;
    }

    if (data.universeId) {
      multiplayer.universeId = data.universeId;
    }

    if (data.profile) {
      applyMultiplayerProfile(data.profile);
    }

    if (data.world) {
      applyWorldSnapshot(data.world);
    }

    if (options && options.includePlayer && data.player) {
      applyPlayerSnapshot(data.player);
    }
  }

  function shouldSmoothWorldEntities(options) {
    return Boolean(options && (options.smoothEntities || options.smoothParticles));
  }

  function applyWorldSnapshot(snapshot, options) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    if (Array.isArray(snapshot.starDust)) {
      starDust.length = 0;
      starDust.push(...snapshot.starDust.map(normalizeStarSnapshot).filter(Boolean));
    }

    if (snapshot.difficulty && difficultyDefinitions[snapshot.difficulty]) {
      applyDifficulty(snapshot.difficulty);
    }
    applyGameMode(snapshot.gameMode || runState.gameMode);

    if (Array.isArray(snapshot.particles)) {
      if (options && options.smoothParticles) {
        applySmoothedParticleSnapshots(snapshot.particles);
      } else {
        particles.length = 0;
        particles.push(...snapshot.particles.map(normalizeParticleSnapshot).filter(Boolean));
      }
    }

    const alienoidSnapshots = Array.isArray(snapshot.alienoids) ? snapshot.alienoids : snapshot.rivals;
    if (Array.isArray(alienoidSnapshots)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rivals, alienoidSnapshots, normalizeRivalSnapshot, { entityType: "alienoid" });
      } else {
        rivals.length = 0;
        rivals.push(...alienoidSnapshots.map(normalizeRivalSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.ufos)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(ufos, snapshot.ufos, normalizeUfoSnapshot, { entityType: "ufo" });
      } else {
        ufos.length = 0;
        ufos.push(...snapshot.ufos.map(normalizeUfoSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.rambots)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rambots, snapshot.rambots, normalizeRambotSnapshot, { entityType: "rambot" });
      } else {
        rambots.length = 0;
        rambots.push(...snapshot.rambots.map(normalizeRambotSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.engineers)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(engineers, snapshot.engineers, normalizeEngineerSnapshot, { entityType: "engineer" });
      } else {
        engineers.length = 0;
        engineers.push(...snapshot.engineers.map(normalizeEngineerSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.teslas)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(teslas, snapshot.teslas, normalizeTeslaSnapshot, { entityType: "tesla" });
      } else {
        teslas.length = 0;
        teslas.push(...snapshot.teslas.map(normalizeTeslaSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.rockets)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rockets, snapshot.rockets, normalizeRocketSnapshot, { entityType: "rocket" });
      } else {
        rockets.length = 0;
        rockets.push(...snapshot.rockets.map(normalizeRocketSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.fighters)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(fighters, snapshot.fighters, normalizeFighterSnapshot, { entityType: "fighter" });
      } else {
        fighters.length = 0;
        fighters.push(...snapshot.fighters.map(normalizeFighterSnapshot).filter(Boolean));
      }
    }

    if (!isHordeModeActive()) {
      mobBeacons.length = 0;
    } else if (Array.isArray(snapshot.mobBeacons)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(mobBeacons, snapshot.mobBeacons, normalizeMobBeaconSnapshot, { snapDistance: 720, entityType: "beacon" });
      } else {
        mobBeacons.length = 0;
        mobBeacons.push(...snapshot.mobBeacons.map(normalizeMobBeaconSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.structures)) {
      structures.length = 0;
      structures.push(...snapshot.structures.map(normalizeStructureSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.spacecrafts)) {
      spacecrafts.length = 0;
      spacecrafts.push(...snapshot.spacecrafts.map(normalizeSpacecraftSnapshot).filter(Boolean));
    }

    if (Array.isArray(snapshot.rivalProjectiles)) {
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(rivalProjectiles, snapshot.rivalProjectiles, normalizeProjectileSnapshot, { snapDistance: 520, entityType: "rivalProjectile" });
      } else {
        rivalProjectiles.length = 0;
        rivalProjectiles.push(...snapshot.rivalProjectiles.map(normalizeProjectileSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.techPickups)) {
      const pickupSnapshots = snapshot.techPickups.filter((pickup) => !multiplayer.claimedTechPickupIds.has(String(pickup && pickup.id)));
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(techPickups, pickupSnapshots, normalizeTechPickupSnapshot, { snapDistance: 520, entityType: "techPickup" });
      } else {
        techPickups.length = 0;
        techPickups.push(...pickupSnapshots.map(normalizeTechPickupSnapshot).filter(Boolean));
      }
    }

    if (Array.isArray(snapshot.healthPickups)) {
      const pickupSnapshots = snapshot.healthPickups.filter((pickup) => !multiplayer.claimedHealthPickupIds.has(String(pickup && pickup.id)));
      if (shouldSmoothWorldEntities(options)) {
        applySmoothedEntitySnapshots(healthPickups, pickupSnapshots, normalizeHealthPickupSnapshot, { snapDistance: 520, entityType: "healthPickup" });
      } else {
        healthPickups.length = 0;
        healthPickups.push(...pickupSnapshots.map(normalizeHealthPickupSnapshot).filter(Boolean));
      }
    }

    nextParticleId = Math.max(
      Number(snapshot.nextParticleId) || 1,
      particles.reduce((largest, particle) => Math.max(largest, particle.id + 1), 1)
    );
    nextRivalId = Math.max(
      Number(snapshot.nextAlienoidId) || Number(snapshot.nextRivalId) || 1,
      rivals.reduce((largest, rival) => Math.max(largest, rival.id + 1), 1)
    );
    nextUfoId = Math.max(
      Number(snapshot.nextUfoId) || 1,
      ufos.reduce((largest, ufo) => Math.max(largest, ufo.id + 1), 1)
    );
    nextRambotId = Math.max(
      Number(snapshot.nextRambotId) || 1,
      rambots.reduce((largest, rambot) => Math.max(largest, rambot.id + 1), 1)
    );
    nextEngineerId = Math.max(
      Number(snapshot.nextEngineerId) || 1,
      engineers.reduce((largest, engineer) => Math.max(largest, engineer.id + 1), 1)
    );
    nextTeslaId = Math.max(
      Number(snapshot.nextTeslaId) || 1,
      teslas.reduce((largest, tesla) => Math.max(largest, tesla.id + 1), 1)
    );
    nextRocketId = Math.max(
      Number(snapshot.nextRocketId) || 1,
      rockets.reduce((largest, rocket) => Math.max(largest, rocket.id + 1), 1)
    );
    nextFighterId = Math.max(
      Number(snapshot.nextFighterId) || 1,
      fighters.reduce((largest, fighter) => Math.max(largest, fighter.id + 1), 1)
    );
    nextMobBeaconId = Math.max(
      Number(snapshot.nextMobBeaconId) || 1,
      mobBeacons.reduce((largest, beacon) => Math.max(largest, finiteOr(beacon.id, 0) + 1), 1)
    );
    nextSurvivalCampId = Math.max(1, Number(snapshot.nextSurvivalCampId) || nextSurvivalCampId);
    nextStructureId = Math.max(
      Number(snapshot.nextStructureId) || 1,
      structures.reduce((largest, structure) => Math.max(largest, structure.id + 1), 1)
    );
    nextSpacecraftId = Math.max(
      Number(snapshot.nextSpacecraftId) || 1,
      spacecrafts.reduce((largest, craft) => Math.max(largest, finiteOr(craft.id, 0) + 1), 1)
    );
    nextRivalProjectileId = Math.max(
      Number(snapshot.nextRivalProjectileId) || 1,
      rivalProjectiles.reduce((largest, projectile) => Math.max(largest, finiteOr(projectile.id, 0) + 1), 1)
    );
    nextTechPickupId = Math.max(
      Number(snapshot.nextTechPickupId) || 1,
      techPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );
    nextHealthPickupId = Math.max(
      Number(snapshot.nextHealthPickupId) || 1,
      healthPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );

    applyMobSpawnTimers(snapshot.mobSpawnTimers);
    applyMobWaveState(snapshot);
    applyMobSpawnRestState(snapshot);
    applyMobDefeatsByKind(snapshot.mobDefeatsByKind);
    applyMobBossDefeatsByKind(snapshot.mobBossDefeatsByKind);
    applyMobBossProgressByKind(snapshot.mobBossProgressByKind, snapshot.mobDefeatsByKind, snapshot.mobBossDefeatsByKind);
    applyMobBossWarnings(snapshot.mobBossWarnings);
    applySurvivalSpawnState(snapshot.survivalSpawnState);
    if (snapshot.objectives) {
      applyObjectiveState(snapshot.objectives);
    }
    if (snapshot.randomEvents) {
      applyRandomEventState(snapshot.randomEvents);
    }
    syncSpacecraftsToRandomEventState();
  }

  function serializeSurvivalSpawnState() {
    return {
      nextCampCheckTick: Math.max(0, finiteOr(survivalSpawnState.nextCampCheckTick, survivalSpawnState.nextCampCheckAt || 0))
    };
  }

  function applySurvivalSpawnState(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    survivalSpawnState.nextCampCheckTick = Math.max(0, finiteOr(source.nextCampCheckTick, source.nextCampCheckAt || 0));
  }

  function applyPlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    player.x = finiteOr(snapshot.x, player.x);
    player.y = finiteOr(snapshot.y, player.y);
    player.vx = finiteOr(snapshot.vx, 0);
    player.vy = finiteOr(snapshot.vy, 0);
    player.radius = finiteOr(snapshot.radius, player.radius);
    player.maxHealth = clamp(finiteOr(snapshot.maxHealth, player.maxHealth), 1, 100);
    player.health = clamp(finiteOr(snapshot.health, player.health), 0, player.maxHealth);
    player.maxEnergy = clamp(finiteOr(snapshot.maxEnergy, player.maxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    player.energy = clamp(finiteOr(snapshot.energy, player.maxEnergy), 0, player.maxEnergy);
    applySerializedPlayerStatusEffects({
      ...(snapshot.statusEffects && typeof snapshot.statusEffects === "object" ? snapshot.statusEffects : {}),
      toolDisabledTimer: snapshot.toolDisabledTimer
    });
    if (snapshot.difficulty && difficultyDefinitions[snapshot.difficulty]) {
      applyDifficulty(snapshot.difficulty);
    }
    applyTechInventory(snapshot.tech);
    applyToolInventory(snapshot.tools, snapshot.equippedTool, snapshot.equippedTools);
    applyToolUpgrades(snapshot.toolUpgrades);
    if (snapshot.objectives) {
      applyObjectiveState(snapshot.objectives);
    }
    player.landed = normalizeLandingSnapshot(snapshot.landed);
    player.spacecraftInterior = normalizeSpacecraftInteriorSnapshot(snapshot.spacecraftInterior);
    applyPersonalTetherSnapshot(snapshot.personalTether);
    player.walkCycle = finiteOr(snapshot.walkCycle, player.landed ? player.landed.walkCycle : player.walkCycle);
    cameraRoll = player.landed ? surfaceCameraRollForAngle(player.landed.angle) : (player.spacecraftInterior ? 0 : finiteOr(snapshot.cameraRoll, cameraRoll));
  }
