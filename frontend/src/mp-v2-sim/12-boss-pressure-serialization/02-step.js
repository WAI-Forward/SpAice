  function step(state, inputsByPlayerId, options) {
    if (!state || !state.world || !state.players) {
      return state;
    }
    const dt = clamp(options && options.dt, 0.001, 0.05) || TICK_DT;
    const enableMobs = Boolean(options && options.enableMobs === true);
    const inputs = inputsByPlayerId && typeof inputsByPlayerId === "object" ? inputsByPlayerId : {};
    state.gameMode = normalizeGameMode(options && options.gameMode || state.gameMode || state.world && state.world.gameMode);
    state.world.gameMode = state.gameMode;
    state.events = [];
    state._mobDamageParticles = [];
    state._emitMobDamageParticles = !options || options.emitMobDamageParticles !== false;
    for (const [playerId, player] of Object.entries(state.players)) {
      stepPlayer(state, player, inputs[playerId] || {}, dt);
    }
    applyGadgets(state, inputs, dt);
    applyLocalBodyGravity(state, dt);
    for (const body of state.world.particles) {
      integrateBody(state, body, dt, state.tick);
    }
    updateBodyEnergySystems(state, dt);
    updateStructures(state, inputs, dt);
    syncLandedPlayersToSurfaces(state);
    updateAmbientParticleSpawning(state);
    updateRandomEvents(state, dt);
    updateSpacecrafts(state, dt);
    resolveGadgetBuckets(state, inputs, dt);
    resolvePlayerBodyCollisions(state);
    mergeParticles(state);
    syncStructuresToSurfaces(state, true);
    syncLandedPlayersToSurfaces(state);
    updatePickups(state, dt);
    if (enableMobs) {
      updateMobSpawns(state, dt);
      updateMobs(state, dt, options);
    } else {
      updateRivalProjectiles(state, dt, options);
    }
    flushMobDamageParticles(state);
    delete state._mobDamageParticles;
    delete state._emitMobDamageParticles;
    state.tick = Math.max(0, Math.floor(finiteOr(state.tick, 0))) + 1;
    return state;
  }

  function serializePlayers(players) {
    const result = {};
    const source = players && typeof players === "object" ? players : {};
    for (const [playerId, player] of Object.entries(source)) {
      const cloned = clonePlayer(player);
      if (cloned) {
        result[playerId] = cloned;
      }
    }
    return result;
  }

  function serializeMobSpawnTimers(world) {
    const result = {};
    const source = world && world.mobSpawnTimers && typeof world.mobSpawnTimers === "object" ? world.mobSpawnTimers : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = finiteOr(source[kind], MOB_SPAWN_INTERVALS[kind]);
    }
    return result;
  }

  function serializeMobDefeats(world) {
    const result = {};
    const source = world && world.mobDefeatsByKind && typeof world.mobDefeatsByKind === "object" ? world.mobDefeatsByKind : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = Math.max(0, Math.floor(finiteOr(source[kind], 0)));
    }
    return result;
  }

  function serializeMobBossDefeats(world) {
    const result = {};
    const source = world && world.mobBossDefeatsByKind && typeof world.mobBossDefeatsByKind === "object" ? world.mobBossDefeatsByKind : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = Math.max(0, Math.floor(finiteOr(source[kind], 0)));
    }
    return result;
  }

  function serializeMobBossProgress(world) {
    const result = {};
    const source = world && world.mobBossProgressByKind && typeof world.mobBossProgressByKind === "object" ? world.mobBossProgressByKind : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = clamp(Math.floor(finiteOr(source[kind], 0)), 0, MOB_BOSS_DEFEATS_TO_UNLOCK);
    }
    return result;
  }

  function serializeMobBossWarnings(world) {
    const result = {};
    const source = world && world.mobBossWarnings && typeof world.mobBossWarnings === "object" ? world.mobBossWarnings : {};
    for (const kind of MOB_TIER_ORDER) {
      const warning = source[kind] && typeof source[kind] === "object" ? source[kind] : {};
      result[kind] = {
        active: Boolean(warning.active),
        timer: clamp(finiteOr(warning.timer, 0), 0, MOB_BOSS_WARNING_DURATION),
        lastNoticeSecond: Math.floor(finiteOr(warning.lastNoticeSecond, -1))
      };
    }
    return result;
  }

  function serializeNextMobIds(world) {
    const result = {};
    const source = world && world.nextMobIds && typeof world.nextMobIds === "object" ? world.nextMobIds : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = Math.max(1, Math.floor(finiteOr(source[kind], 1)));
    }
    return result;
  }

  function serializeWorld(world, options) {
    const source = world && typeof world === "object" ? world : {};
    const includeCosmetic = !(options && options.compact === true);
    const result = {
      particles: Array.isArray(source.particles) ? source.particles.map(serializeParticleState).filter(Boolean) : [],
      techPickups: Array.isArray(source.techPickups) ? source.techPickups.map((pickup) => serializePickupState(pickup, "tech")).filter(Boolean) : [],
      healthPickups: Array.isArray(source.healthPickups) ? source.healthPickups.map((pickup) => serializePickupState(pickup, "health")).filter(Boolean) : [],
      alienoids: Array.isArray(source.alienoids) ? source.alienoids.map(serializeLiveMobState).filter(Boolean) : [],
      ufos: Array.isArray(source.ufos) ? source.ufos.map(serializeLiveMobState).filter(Boolean) : [],
      rambots: Array.isArray(source.rambots) ? source.rambots.map(serializeLiveMobState).filter(Boolean) : [],
      engineers: Array.isArray(source.engineers) ? source.engineers.map(serializeLiveMobState).filter(Boolean) : [],
      teslas: Array.isArray(source.teslas) ? source.teslas.map(serializeLiveMobState).filter(Boolean) : [],
      rockets: Array.isArray(source.rockets) ? source.rockets.map(serializeLiveMobState).filter(Boolean) : [],
      fighters: Array.isArray(source.fighters) ? source.fighters.map(serializeLiveMobState).filter(Boolean) : [],
      mobBeacons: isHordeGameMode(source.gameMode) && Array.isArray(source.mobBeacons) ? source.mobBeacons.map(serializeEntityState).filter(Boolean) : [],
      rivalProjectiles: Array.isArray(source.rivalProjectiles) ? source.rivalProjectiles.map(serializeEntityState).filter(Boolean) : [],
      structures: Array.isArray(source.structures) ? clone(source.structures) : [],
      spacecrafts: Array.isArray(source.spacecrafts) ? source.spacecrafts.map(serializeSpacecraftState).filter(Boolean) : [],
      claimedTechPickupIds: serializeClaimedPickupIds(source.claimedTechPickupIds),
      claimedHealthPickupIds: serializeClaimedPickupIds(source.claimedHealthPickupIds),
      nextParticleId: Math.max(1, Math.floor(finiteOr(source.nextParticleId, 1))),
      nextTechPickupId: Math.max(1, Math.floor(finiteOr(source.nextTechPickupId, 1))),
      nextHealthPickupId: Math.max(1, Math.floor(finiteOr(source.nextHealthPickupId, 1))),
      nextMobBeaconId: Math.max(1, Math.floor(finiteOr(source.nextMobBeaconId, 1))),
      nextSurvivalCampId: Math.max(1, Math.floor(finiteOr(source.nextSurvivalCampId, 1))),
      nextRivalProjectileId: Math.max(1, Math.floor(finiteOr(source.nextRivalProjectileId, 1))),
      nextStructureId: Math.max(
        1,
        Math.floor(finiteOr(source.nextStructureId, 1)),
        Array.isArray(source.structures)
          ? source.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
          : 1
      ),
      nextSpacecraftId: Math.max(
        1,
        Math.floor(finiteOr(source.nextSpacecraftId, 1)),
        Array.isArray(source.spacecrafts)
          ? source.spacecrafts.reduce((largest, craft) => Math.max(largest, Math.floor(finiteOr(craft && craft.id, 0)) + 1), 1)
          : 1
      ),
      nextMobIds: serializeNextMobIds(source),
      mobSpawnTimers: serializeMobSpawnTimers(source),
      mobWaveTimer: clamp(finiteOr(source.mobWaveTimer, difficultyMobWaveInterval(source)), 0, difficultyMobWaveInterval(source)),
      mobWaveCount: Math.max(0, Math.floor(finiteOr(source.mobWaveCount, 0))),
      mobDefeatsByKind: serializeMobDefeats(source),
      mobBossDefeatsByKind: serializeMobBossDefeats(source),
      mobBossProgressByKind: serializeMobBossProgress(source),
      mobBossWarnings: serializeMobBossWarnings(source),
      mobSpawnRestTimer: clamp(finiteOr(source.mobSpawnRestTimer, 0), 0, MOB_SPAWN_REST_DURATION),
      mobSpawnRestDrainTimer: clamp(finiteOr(source.mobSpawnRestDrainTimer, 0), 0, MOB_SPAWN_REST_DRAIN_MAX_DURATION),
      mobSpawnRestCooldownTimer: clamp(finiteOr(source.mobSpawnRestCooldownTimer, MOB_SPAWN_REST_COOLDOWN), 0, MOB_SPAWN_REST_COOLDOWN),
      survivalSpawnState: serializeSurvivalSpawnState(source.survivalSpawnState),
      difficulty: String(source.difficulty || "medium"),
      gameMode: normalizeGameMode(source.gameMode),
      ambientParticleSpawning: source.ambientParticleSpawning === true,
      randomEvents: serializeRandomEventState(source.randomEvents)
    };
    if (includeCosmetic) {
      result.starDust = Array.isArray(source.starDust) ? clone(source.starDust) : [];
    }
    return result;
  }

  function serializeClaimedPickupIds(source) {
    const values = Array.isArray(source) ? source.map(String).filter(Boolean) : [];
    if (values.length <= PICKUP_CLAIM_HISTORY_LIMIT) {
      return values;
    }
    return values.slice(values.length - PICKUP_CLAIM_HISTORY_LIMIT);
  }

  function serializeState(state) {
    const source = state && typeof state === "object" ? state : {};
    const gameMode = normalizeGameMode(source.gameMode || source.world && source.world.gameMode);
    const world = serializeWorld(source.world, { compact: true });
    world.gameMode = gameMode;
    if (gameMode === "survival") {
      world.mobBeacons = [];
    }
    return {
      version: VERSION,
      tick: Math.max(0, Math.floor(finiteOr(source.tick, 0))),
      seed: finiteOr(source.seed, 0) >>> 0,
      difficulty: String(source.difficulty || "medium"),
      gameMode,
      players: serializePlayers(source.players),
      world,
      events: Array.isArray(source.events) ? source.events.map((event) => event && typeof event === "object" ? { ...event } : event).filter(Boolean) : []
    };
  }

  function replayFromSnapshot(snapshotState, inputs, options) {
    const state = serializeState(snapshotState);
    const pending = Array.isArray(inputs) ? inputs : [];
    const replayOptions = {
      dt: options && options.dt || TICK_DT,
      enableMobs: Boolean(options && options.enableMobs === true),
      emitMobDamageParticles: !options || options.emitMobDamageParticles !== false
    };
    for (const input of pending) {
      step(state, { [String(input.playerId || "")]: input }, replayOptions);
    }
    return state;
  }

  function replayLocalPlayerFromSnapshot(snapshotState, inputs, options) {
    const state = serializeState(snapshotState);
    const pending = Array.isArray(inputs) ? inputs : [];
    const dt = options && options.dt || TICK_DT;
    for (const input of pending) {
      const playerId = String(input && input.playerId || "");
      const local = state.players && state.players[playerId];
      if (!local) {
        continue;
      }
      state._mobDamageParticles = [];
      state._emitMobDamageParticles = false;
      stepPlayer(state, local, input, dt);
      applyGadgets(state, { [playerId]: input }, dt);
      syncLandedPlayersToSurfaces(state);
      updatePickups(state, dt);
      delete state._mobDamageParticles;
      delete state._emitMobDamageParticles;
      state.tick = Math.max(0, Math.floor(finiteOr(state.tick, 0))) + 1;
    }
    return state;
  }

  return {
    VERSION,
    TICK_RATE,
    TICK_DT,
    SNAPSHOT_RATE,
    SNAPSHOT_INTERVAL_TICKS,
    MAX_PLAYERS,
    DEFAULT_TOOL_ID,
    ENABLE_MOBS_BY_DEFAULT,
    createInitialState,
    addPlayer,
    setPlayerTeam,
    addTechToPlayer,
    craftTool,
    setEquippedTools,
    upgradeTool,
    placeStructure,
    transferContainerTech,
    transferStructureTech,
    setTradingPortOffer,
    removeTradingPortOffer,
    acceptTradingPortOffer,
    applyPlayerStatusEffect,
    spawnBody,
    spawnMob,
    spawnBoss,
    killAllMobs,
    forceRandomEvent,
    removePlayer,
    respawnPlayer,
    registerRandomEventDefinition,
    sanitizeInput,
    step,
    serializeState,
    replayFromSnapshot,
    replayLocalPlayerFromSnapshot,
    normalizePlayer,
    normalizeWorld,
    radiusFromMass,
    tierForMass,
    constants: {
      PLAYER_RADIUS,
      PLAYER_MAX_HEALTH,
      PLAYER_MAX_ENERGY,
      GADGET_FORCE_REACH,
      BODY_TIERS,
      TECH_KEYS,
      MOB_TIER_ORDER,
      HEALTH_DROP_BASE_CHANCES,
      DIFFICULTY_MOB_SETTINGS,
      SOLID_BODY_PLAYER_DAMAGE_SPEED
    },
    survival: {
      allowanceCosts: { ...SURVIVAL_ALLOWANCE_MOB_COSTS },
      mobAllowanceCost: survivalMobAllowanceCost,
      allowanceCandidateList: survivalAllowanceCandidateList,
      planAllowanceMobs: planSurvivalAllowanceMobs
    }
  };
});
