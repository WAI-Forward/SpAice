  function createSummonedMob(kind, x, y, sourceMob) {
    const mob = createMobByKind(kind, x, y, {
      summonAge: 0,
      summonDuration: engineerBossSummonDuration,
      summonSpinSpeed: randomRange(7.5, 11.5) * (Math.random() < 0.5 ? -1 : 1)
    });
    mob.summonBaseRadius = Math.max(1, finiteOr(mob.radius, 28));
    mob.radius = 0;
    mob.vx += finiteOr(sourceMob && sourceMob.vx, 0) * 0.12;
    mob.vy += finiteOr(sourceMob && sourceMob.vy, 0) * 0.12;
    return mob;
  }

  function summonEngineerBossMob(engineer, targetPlayer) {
    if (!engineer || !engineer.isBoss) {
      return false;
    }
    const kind = randomEngineerBossSummonKind();
    if (!kind) {
      return false;
    }
    const angleToPlayer = targetPlayer ? Math.atan2(targetPlayer.y - engineer.y, targetPlayer.x - engineer.x) : randomRange(0, Math.PI * 2);
    const angle = angleToPlayer + randomRange(-0.95, 0.95);
    const distance = randomRange(185, 315);
    const x = engineer.x + Math.cos(angle) * distance + randomRange(-42, 42);
    const y = engineer.y + Math.sin(angle) * distance + randomRange(-42, 42);
    const mob = createSummonedMob(kind, x, y, engineer);
    collectionPushMob(kind, mob);

    sparks.push({
      x,
      y,
      radius: engineerBossSummonRadius,
      color: mob.color || engineer.color,
      life: engineerBossSummonDuration,
      maxLife: engineerBossSummonDuration,
      summonTelegraph: true
    });
    sparks.push({
      x: engineer.x,
      y: engineer.y,
      radius: engineer.radius * 2.2,
      color: engineer.color,
      life: 0.28,
      maxLife: 0.28
    });
    playSound("pickupTech", { throttleKey: "engineerBossSummon:" + engineer.id, throttle: 0.45 });
    resetBossAltAttackCooldown(engineer);
    return true;
  }

  function updateMobBossWarnings(dt, anchors) {
    for (const kind of mobTierOrder) {
      const warning = mobBossWarningFor(kind);
      if (!warning || !warning.active) {
        continue;
      }

      if (!isMobBeaconReady(kind)) {
        warning.timer = Math.max(1, finiteOr(warning.timer, 1));
        warning.lastNoticeSecond = -1;
        continue;
      }

      warning.timer = Math.max(0, finiteOr(warning.timer, 0) - dt);
      updateMobBossCountdownNotice(kind, false);
      if (warning.timer > 0) {
        continue;
      }

      warning.active = false;
      warning.lastNoticeSecond = -1;
      if (!hasLiveMobBoss(kind)) {
        spawnBossByKind(kind, leastPopulatedMobSpawnAnchor(anchors), anchors);
      }
    }
  }

  function spawnMobByKind(kind, anchor, anchors) {
    if (kind === "ufo") {
      spawnUfoNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "rambot") {
      spawnRambotNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "engineer") {
      spawnEngineerNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "tesla") {
      spawnTeslaNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "satellite") {
      spawnSatelliteNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "rocket") {
      spawnRocketNearPlayer(anchor, anchors);
      return;
    }
    if (kind === "fighter") {
      spawnFighterNearPlayer(anchor, anchors);
      return;
    }
    spawnAlienoidNearPlayer(anchor, anchors);
  }

  function spawnMobByKindAt(kind, x, y) {
    mobCollectionByKind(kind).push(createMobByKind(kind, x, y));
  }

  function isMobTierUnlocked(kind) {
    const index = mobTierOrder.indexOf(kind);
    if (index <= 0) {
      return true;
    }

    const previousKind = mobTierOrder[index - 1];
    return mobDefeatsByKind[previousKind] >= previousMobTierDefeatsTarget(previousKind);
  }

  function unlockedMobKinds() {
    return mobTierOrder.filter((kind) => isMobTierUnlocked(kind));
  }

  function currentLifeSeconds() {
    return Math.max(0, (performance.now() - lifeStats.startedAt) / 1000);
  }

  function baseMobSpawnBatchLimit(kind) {
    const interval = difficultyMobSpawnInterval(kind);
    if (!interval) {
      return baseMaxMobSpawnBatchSize;
    }

    const growthInterval = interval * mobSpawnCapGrowthIntervalMultiplier;
    const rawLimit = baseMaxMobSpawnBatchSize + Math.floor(currentLifeSeconds() / growthInterval);
    return Math.max(1, Math.round(rawLimit * activeDifficulty().mobBatchScale) + mobBossSpawnPressure(kind) * mobBossSpawnBatchBonus);
  }

  function baseLiveMobCap(kind) {
    if (kind === "alienoid") {
      return 5;
    }
    if (kind === "ufo") {
      return 4;
    }
    if (kind === "rambot" || kind === "engineer" || kind === "tesla") {
      return 3;
    }
    return 2;
  }

  function maxLiveMobCount(kind, anchors) {
    const interval = difficultyMobSpawnInterval(kind) || 120;
    const growth = Math.min(5, Math.floor(currentLifeSeconds() / Math.max(45, interval * 3.5)));
    const playerCount = Math.min(crazyGamesRoomMaxPlayers, Array.isArray(anchors) && anchors.length ? anchors.length : 1);
    const playerScale = 1 + Math.max(0, playerCount - 1) * 0.3;
    const bossPressureCap = mobBossSpawnPressure(kind) * mobBossLiveCapBonus;
    return Math.max(1, Math.round((baseLiveMobCap(kind) + growth) * playerScale * activeDifficulty().mobBatchScale) + bossPressureCap);
  }

  function maxMobSpawnBatchSize(kind, playerCount) {
    const count = Math.max(1, Math.min(crazyGamesRoomMaxPlayers, finiteOr(playerCount, 1)));
    return Math.max(1, Math.round(baseMobSpawnBatchLimit(kind) * (1 + Math.max(0, count - 1) * 0.55)));
  }

  function startingMobSpawnBonusChance(bonusSlot) {
    const chances = activeDifficulty().mobStartingBatchBonusChances;
    if (!Array.isArray(chances)) {
      return 0;
    }
    return clamp(finiteOr(chances[bonusSlot - 1], 0), 0, 0.92);
  }

  function mobSpawnBonusSlotChance(kind, bonusSlot, defeats) {
    const index = mobTierOrder.indexOf(kind);
    const nextKind = mobTierOrder[index + 1];
    const progressScale = bonusSlot < 2
      ? activeDifficulty().mobBonusChanceScale
      : Math.pow(thirdMobSpawnChanceScale, bonusSlot - 1) * activeDifficulty().mobBonusChanceScale;
    const progressChance = clamp(defeats / (previousMobTierDefeatsTarget(nextKind || kind) * bonusSlot), 0, 0.92) * progressScale;
    return clamp(Math.max(startingMobSpawnBonusChance(bonusSlot), progressChance), 0, 0.92);
  }

  function rollMobSpawnBatchSize(kind, batchLimit) {
    const index = mobTierOrder.indexOf(kind);
    const nextKind = mobTierOrder[index + 1];

    const defeats = Math.max(0, mobDefeatsByKind[nextKind || kind] || 0);
    let batchSize = 1;
    for (let bonusSlot = 1; bonusSlot < batchLimit; bonusSlot += 1) {
      const chance = mobSpawnBonusSlotChance(kind, bonusSlot, defeats);
      if (Math.random() < chance) {
        batchSize += 1;
      }
    }
    return batchSize;
  }

  function mobSpawnBatchSize(kind, playerCount) {
    const count = Math.max(1, Math.min(crazyGamesRoomMaxPlayers, finiteOr(playerCount, 1)));
    const batchLimit = baseMobSpawnBatchLimit(kind);
    let batchSize = rollMobSpawnBatchSize(kind, batchLimit);
    const bonusRolls = Math.floor(Math.max(0, count - 1));
    for (let i = 0; i < bonusRolls; i += 1) {
      batchSize += Math.random() < 0.55 ? rollMobSpawnBatchSize(kind, batchLimit) : 0;
    }
    const fractionalBonus = Math.max(0, count - 1) - bonusRolls;
    if (fractionalBonus > 0 && Math.random() < fractionalBonus * 0.55) {
      batchSize += rollMobSpawnBatchSize(kind, batchLimit);
    }
    batchSize += mobBossSpawnPressure(kind) * mobBossSpawnBatchBonus;
    return Math.min(maxMobSpawnBatchSize(kind, count), Math.max(1, batchSize));
  }

  function mobSpawnIntervalWithBossPressure(kind) {
    const interval = difficultyMobSpawnInterval(kind);
    return interval * (mobBossSpawnPressure(kind) > 0 ? mobBossSpawnIntervalScale : 1);
  }

  function mobWaveBossPressure() {
    let count = 0;
    for (const kind of mobTierOrder) {
      count += liveMobBossCount(kind);
    }
    return Math.min(3, count);
  }

  function mobWaveIntervalWithBossPressure() {
    const interval = difficultyMobWaveInterval();
    return interval * (mobWaveBossPressure() > 0 ? mobBossSpawnIntervalScale : 1);
  }

  function mobWaveSizeDifficultyScale() {
    const mediumScale = finiteOr(difficultyDefinitions.medium && difficultyDefinitions.medium.mobBatchScale, 1.24);
    return clamp(finiteOr(activeDifficulty().mobBatchScale, mediumScale) / mediumScale, 0.8, 1.2);
  }
