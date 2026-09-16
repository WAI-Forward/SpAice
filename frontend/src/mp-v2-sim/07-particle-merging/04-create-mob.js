  function createMob(world, kind, x, y, seedHolder, options) {
    const settings = options && typeof options === "object" ? options : {};
    const id = world.nextMobIds[kind]++;
    const healthByKind = {
      alienoid: 100,
      ufo: 130,
      rambot: 210,
      engineer: 140,
      tesla: 150,
      satellite: 180,
      rocket: 170,
      fighter: 230
    };
    const radiusByKind = {
      alienoid: 28,
      ufo: 34,
      rambot: 38,
      engineer: 33,
      tesla: 32,
      satellite: 36,
      rocket: 34,
      fighter: 40
    };
    const colorByKind = {
      alienoid: { r: 255, g: 115, b: 173 },
      ufo: { r: 112, g: 226, b: 255 },
      rambot: { r: 184, g: 196, b: 204 },
      engineer: { r: 102, g: 224, b: 184 },
      tesla: { r: 157, g: 255, b: 122 },
      satellite: { r: 169, g: 133, b: 255 },
      rocket: { r: 169, g: 133, b: 255 },
      fighter: { r: 119, g: 167, b: 255 }
    };
    const isBoss = Boolean(settings.isBoss);
    const bossStars = isBoss ? bossStarRankValue(settings.bossStars) : 0;
    const eliteStars = isBoss ? 0 : mobEliteStarRankValue(settings.eliteStars);
    const eliteGroupSize = eliteStars > 0
      ? Math.max(MOB_ELITE_COMPRESSION_SIZE, Math.floor(finiteOr(settings.eliteGroupSize, eliteStars * MOB_ELITE_COMPRESSION_SIZE)))
      : 1;
    const baseMaxHealth = healthByKind[kind] || 100;
    const maxHealth = isBoss
      ? baseMaxHealth * MOB_BOSS_HEALTH_MULTIPLIER * bossHealthScaleForStars(bossStars)
      : baseMaxHealth * mobEliteHealthScale(eliteStars);
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const mob = {
      id,
      kind,
      x,
      y,
      vx: Math.cos(angle) * randomRange(seedHolder, 10, 44),
      vy: Math.sin(angle) * randomRange(seedHolder, 10, 44),
      radius: (radiusByKind[kind] || 28) * (isBoss ? MOB_BOSS_RADIUS_MULTIPLIER : mobEliteRadiusScale(eliteStars)),
      health: maxHealth,
      maxHealth,
      disabledTimer: 0,
      color: colorByKind[kind] || colorByKind.alienoid,
      shootCooldown: kind === "alienoid" ? randomRange(seedHolder, 0.8, 2.1) : 0,
      strafeSign: randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1,
      rotation: kind === "rocket" ? angle + Math.PI / 2 : 0,
      beamAngle: kind === "ufo" ? Math.PI / 2 : 0,
      beamPulse: kind === "ufo" ? randomRange(seedHolder, 0, Math.PI * 2) : 0,
      tractorDisabledTimer: kind === "ufo" ? 0 : undefined,
      bossBeamMode: kind === "ufo" ? "tractor" : undefined,
      bossBeamTimer: kind === "ufo" ? UFO_BOSS_NORMAL_BEAM_DURATION : undefined,
      wobble: randomRange(seedHolder, 0, Math.PI * 2),
      eliteStars,
      eliteGroupSize,
      isBoss,
      bossBaseKind: isBoss ? kind : "",
      bossStars,
      minionCooldown: isBoss ? randomRange(seedHolder, MOB_BOSS_MINION_COOLDOWN_MIN, MOB_BOSS_MINION_COOLDOWN_MAX) : 0,
      altAttackCooldown: isBoss ? randomRange(seedHolder, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) * bossCooldownScaleForStars(bossStars) : 0,
      bossBodyEvadeTimer: 0,
      bossBodyEvadeSpeedCap: 0,
      team: settings.team === "player" ? "player" : ""
    };

    if (kind === "rambot") {
      Object.assign(mob, {
        chargeCooldown: randomRange(seedHolder, 1.2, 2.6),
        chargeTimer: 0,
        recoverTimer: 0,
        chargeDirX: 1,
        chargeDirY: 0,
        impactCooldown: 0,
        headAngle: angle,
        pistonTimer: 0,
        pistonDuration: RAMBOT_BOSS_PISTON_DURATION,
        pistonHit: false
      });
    } else if (kind === "engineer") {
      Object.assign(mob, {
        healCooldown: randomRange(seedHolder, 0.35, 0.9),
        healPulse: 0,
        repairBeamAngle: 0,
        targetKind: "",
        targetId: 0
      });
    } else if (kind === "tesla") {
      Object.assign(mob, {
        shootCooldown: randomRange(seedHolder, 1.2, 2.5),
        lightningWarmup: 0,
        lightningFlash: 0,
        lightningAngle: 0
      });
    } else if (kind === "satellite") {
      Object.assign(mob, {
        scannerAngle: 0,
        scanProgress: 0,
        lockTimer: 0,
        blastTimer: 0,
        recoverTimer: 0,
        lockX: x,
        lockY: y,
        blastDirX: 1,
        blastDirY: 0,
        volleyTimer: 0,
        volleyShots: 0,
        impactCooldown: 0
      });
    } else if (kind === "rocket") {
      Object.assign(mob, {
        chargeCooldown: randomRange(seedHolder, 0.6, 1.6),
        chargeTimer: 0,
        chargeDirX: Math.cos(angle),
        chargeDirY: Math.sin(angle),
        chargePower: 0,
        recoverTimer: 0,
        lockX: x,
        lockY: y,
        impactCooldown: 0,
        blastTimer: 0
      });
    } else if (kind === "fighter") {
      Object.assign(mob, {
        shootCooldown: randomRange(seedHolder, 1.0, 2.4),
        machineGunShots: 0,
        machineGunTimer: 0,
        shieldCharge: FIGHTER_SHIELD_MAX_CHARGE,
        shieldRecharge: 0,
        shieldActive: 0
      });
    }

    return normalizeEntity(Object.assign(mob, settings, { eliteStars, eliteGroupSize }), id, kind);
  }

  function spawnMobByKind(world, kind, anchor, players, seedHolder) {
    const spawn = chooseMobSpawnPoint(world, kind, anchor, players, seedHolder);
    mobCollectionByKind(world, kind).push(createMob(world, kind, spawn.x, spawn.y, seedHolder));
  }

  function spawnMobByKindAt(world, kind, x, y, seedHolder) {
    mobCollectionByKind(world, kind).push(createMob(world, kind, x, y, seedHolder));
  }

  function mobBossProgressReady(world, kind) {
    return Math.max(0, finiteOr(world.mobBossProgressByKind && world.mobBossProgressByKind[kind], 0)) >= MOB_BOSS_DEFEATS_TO_UNLOCK;
  }

  function previousMobBossDefeated(world, kind) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    if (index <= 0) {
      return true;
    }
    const previousKind = MOB_TIER_ORDER[index - 1];
    return Math.max(0, Math.floor(finiteOr(world.mobBossDefeatsByKind && world.mobBossDefeatsByKind[previousKind], 0))) > 0;
  }

  function isMobBossUnlocked(world, kind) {
    return mobBossProgressReady(world, kind) && previousMobBossDefeated(world, kind);
  }

  function hasLiveMobBoss(world, kind) {
    return mobCollectionByKind(world, kind).some((mob) => mob && mob.kind === kind && mob.isBoss && mob.health > 0);
  }

  function maybeScheduleMobBoss(state, kind, seedHolder) {
    const world = state.world;
    if (!world.mobBossWarnings || !world.mobBossWarnings[kind]) {
      return;
    }
    const warning = world.mobBossWarnings[kind];
    if (warning.active || !isMobBossUnlocked(world, kind) || hasLiveMobBoss(world, kind)) {
      return;
    }
    warning.active = true;
    warning.timer = MOB_BOSS_WARNING_DURATION;
    warning.lastNoticeSecond = -1;
    state.events.push({ type: "mob.boss.warning", kind, seconds: MOB_BOSS_WARNING_DURATION, tick: state.tick });
  }

  function spawnBossByKind(state, kind, anchor, players, seedHolder) {
    const spawn = chooseMobSpawnPoint(state.world, kind, anchor, players, seedHolder);
    const bossStars = Math.max(0, Math.floor(finiteOr(state.world.mobBossDefeatsByKind && state.world.mobBossDefeatsByKind[kind], 0)));
    const boss = createMob(state.world, kind, spawn.x, spawn.y, seedHolder, { isBoss: true, bossStars });
    mobCollectionByKind(state.world, kind).push(boss);
    spawnBossEscortMobs(state, kind, boss, seedHolder);
    state.events.push({ type: "mob.boss.spawned", mobId: boss.id, kind, bossStars, x: boss.x, y: boss.y, color: cloneColor(boss.color), tick: state.tick });
  }

  function spawnBossEscortMobs(state, kind, boss, seedHolder) {
    const collection = mobCollectionByKind(state.world, kind);
    const escortCount = Math.floor(randomRange(seedHolder, MOB_BOSS_ESCORT_SPAWN_MIN, MOB_BOSS_ESCORT_SPAWN_MAX + 1));
    const startAngle = randomRange(seedHolder, 0, Math.PI * 2);

    for (let i = 0; i < escortCount; i += 1) {
      const angle = startAngle + (Math.PI * 2 * i) / escortCount + randomRange(seedHolder, -0.28, 0.28);
      const distance = Math.max(boss.radius * 1.35, randomRange(seedHolder, 115, 210));
      const escort = createMob(
        state.world,
        kind,
        boss.x + Math.cos(angle) * distance,
        boss.y + Math.sin(angle) * distance,
        seedHolder
      );
      escort.vx += Math.cos(angle) * randomRange(seedHolder, 38, 96) + finiteOr(boss.vx, 0) * 0.12;
      escort.vy += Math.sin(angle) * randomRange(seedHolder, 38, 96) + finiteOr(boss.vy, 0) * 0.12;
      collection.push(escort);
    }
  }

  function updateMobBossWarnings(state, players, dt, seedHolder) {
    const world = state.world;
    if (!world.mobBossWarnings) {
      return;
    }
    for (const kind of MOB_TIER_ORDER) {
      const warning = world.mobBossWarnings[kind];
      if (!warning || !warning.active) {
        continue;
      }
      if (!isMobBeaconReady(world, kind)) {
        warning.timer = Math.max(1, finiteOr(warning.timer, 1));
        warning.lastNoticeSecond = -1;
        continue;
      }
      warning.timer = Math.max(0, finiteOr(warning.timer, 0) - dt);
      const seconds = Math.ceil(warning.timer);
      if (warning.lastNoticeSecond !== seconds) {
        warning.lastNoticeSecond = seconds;
        state.events.push({ type: "mob.boss.warning", kind, seconds, tick: state.tick });
      }
      if (warning.timer > 0) {
        continue;
      }
      warning.active = false;
      warning.lastNoticeSecond = -1;
      if (!hasLiveMobBoss(world, kind)) {
        spawnBossByKind(state, kind, leastPopulatedMobAnchor(world, players), players, seedHolder);
      }
    }
  }

  function activeWorldPlayers(state) {
    return Object.values(state.players || {}).filter((entry) => (
      entry &&
      entry.health > 0 &&
      Number.isFinite(Number(entry.x)) &&
      Number.isFinite(Number(entry.y))
    ));
  }

  function effectiveWorldPlayerCount(players) {
    const source = Array.isArray(players) && players.length ? players : [];
    return effectiveParticlePlayerCount(source);
  }

  function startMobSpawnGracePeriod(world) {
    world.mobSpawnRestTimer = MOB_SPAWN_REST_DURATION;
    world.mobSpawnRestDrainTimer = 0;
    world.mobSpawnRestCooldownTimer = MOB_SPAWN_REST_COOLDOWN;
  }

  function updateMobSpawnRest(world, players, dt) {
    world.mobSpawnRestTimer = Math.max(0, finiteOr(world.mobSpawnRestTimer, 0));
    world.mobSpawnRestDrainTimer = Math.max(0, finiteOr(world.mobSpawnRestDrainTimer, 0));
    world.mobSpawnRestCooldownTimer = Math.max(0, finiteOr(world.mobSpawnRestCooldownTimer, MOB_SPAWN_REST_COOLDOWN));
    const manageableThreshold = manageableMobRestThreshold(players);

    if (world.mobSpawnRestDrainTimer > 0) {
      world.mobSpawnRestDrainTimer = Math.max(0, world.mobSpawnRestDrainTimer - dt);
      if (totalLiveMobCount(world) <= manageableThreshold || world.mobSpawnRestDrainTimer <= 0) {
        startMobSpawnGracePeriod(world);
      }
      return true;
    }

    if (world.mobSpawnRestTimer > 0) {
      world.mobSpawnRestTimer = Math.max(0, world.mobSpawnRestTimer - dt);
      return true;
    }

    world.mobSpawnRestCooldownTimer = Math.max(0, world.mobSpawnRestCooldownTimer - dt);
    if (world.mobSpawnRestCooldownTimer > 0) {
      return false;
    }

    world.mobSpawnRestDrainTimer = MOB_SPAWN_REST_DRAIN_MAX_DURATION;
    world.mobSpawnRestCooldownTimer = MOB_SPAWN_REST_COOLDOWN;
    if (totalLiveMobCount(world) <= manageableThreshold) {
      startMobSpawnGracePeriod(world);
    }
    return true;
  }

  function updateMobSpawns(state, dt) {
    const world = state.world;
    const players = activeWorldPlayers(state);
    if (!players.length) {
      if (!isHordeGameMode(state.gameMode || world.gameMode)) {
        world.mobBeacons = [];
        ensureSurvivalSpawnState(world);
      }
      return;
    }
    const seedHolder = { seed: state.seed >>> 0 };
    if (!isHordeGameMode(state.gameMode || world.gameMode)) {
      updateSurvivalAllowanceMobSpawns(state, world, players, dt, seedHolder);
      state.seed = seedHolder.seed >>> 0;
      return;
    }

    updateHordeMobSpawns(state, world, players, dt, seedHolder);
    state.seed = seedHolder.seed >>> 0;
  }

  function isAmbientParticle(body) {
    return Boolean(body && body.tier && !body.tier.solid);
  }

  function countAmbientParticles(world) {
    let count = 0;
    for (const body of world.particles) {
      if (isAmbientParticle(body)) {
        count += 1;
      }
    }
    return count;
  }
