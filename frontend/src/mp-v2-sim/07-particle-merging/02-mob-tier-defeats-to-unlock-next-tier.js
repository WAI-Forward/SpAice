  function mobTierDefeatsToUnlockNextTier(kind) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    return MOB_TIER_UNLOCK_BASE_DEFEATS + Math.max(0, index);
  }

  function mobTierUnlockDefeatTarget(kind, playerCount) {
    const count = Math.max(1, Math.min(MAX_PLAYERS, Math.floor(finiteOr(playerCount, 1))));
    return mobTierDefeatsToUnlockNextTier(kind) * count;
  }

  function mobTierUnlockPlayerCount(state) {
    const players = state && state.players && typeof state.players === "object" ? Object.values(state.players) : [];
    return Math.max(1, players.filter(Boolean).length);
  }

  function isMobTierUnlocked(state, world, kind) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    if (index <= 0) {
      return true;
    }
    const previousKind = MOB_TIER_ORDER[index - 1];
    return finiteOr(world.mobDefeatsByKind && world.mobDefeatsByKind[previousKind], 0) >= mobTierUnlockDefeatTarget(previousKind, mobTierUnlockPlayerCount(state));
  }

  function baseLiveMobCap(kind) {
    if (kind === "alienoid") return 5;
    if (kind === "ufo") return 4;
    if (kind === "rambot" || kind === "engineer" || kind === "tesla") return 3;
    return 2;
  }

  function liveMobCount(world, kind) {
    let count = 0;
    for (const mob of mobCollectionByKind(world, kind)) {
      if (mob && mob.health > 0 && (kind !== "satellite" && kind !== "rocket" || mob.kind === kind)) {
        count += 1;
      }
    }
    return count;
  }

  function liveMobBossCount(world, kind) {
    return mobCollectionByKind(world, kind).filter((mob) => mob && mob.kind === kind && mob.isBoss && mob.health > 0).length;
  }

  function mobBossSpawnPressure(world, kind) {
    return Math.min(3, liveMobBossCount(world, kind));
  }

  function totalLiveMobCount(world) {
    let count = 0;
    for (const collectionName of MOB_COLLECTIONS) {
      for (const mob of world[collectionName] || []) {
        if (mob && mob.health > 0) {
          count += 1;
        }
      }
    }
    return count;
  }

  function manageableMobRestThreshold(players) {
    const playerCount = Math.min(MAX_PLAYERS, Array.isArray(players) && players.length ? players.length : 1);
    return Math.max(1, Math.ceil(MOB_SPAWN_REST_MANAGEABLE_MOBS_PER_PLAYER * playerCount));
  }

  function maxLiveMobCount(state, kind, players) {
    const elapsed = Math.max(0, finiteOr(state.tick, 0) * TICK_DT);
    const interval = difficultyMobSpawnInterval(state, kind);
    const growth = Math.min(5, Math.floor(elapsed / Math.max(45, interval * 3.5)));
    const playerCount = Math.min(MAX_PLAYERS, Array.isArray(players) && players.length ? players.length : 1);
    const playerScale = 1 + Math.max(0, playerCount - 1) * 0.35;
    const bossPressureCap = mobBossSpawnPressure(state.world, kind) * MOB_BOSS_LIVE_CAP_BONUS;
    return Math.max(1, Math.round((baseLiveMobCap(kind) + growth) * playerScale * difficultyMobSettings(state).batchScale) + bossPressureCap);
  }

  function baseMobSpawnBatchLimit(state, kind) {
    const elapsed = Math.max(0, finiteOr(state.tick, 0) * TICK_DT);
    const interval = difficultyMobSpawnInterval(state, kind);
    if (!interval) {
      return BASE_MAX_MOB_SPAWN_BATCH_SIZE;
    }
    const growthInterval = interval * MOB_SPAWN_CAP_GROWTH_INTERVAL_MULTIPLIER;
    const rawLimit = BASE_MAX_MOB_SPAWN_BATCH_SIZE + Math.floor(elapsed / growthInterval);
    return Math.max(1, Math.round(rawLimit * difficultyMobSettings(state).batchScale) + mobBossSpawnPressure(state.world, kind) * MOB_BOSS_SPAWN_BATCH_BONUS);
  }

  function startingMobSpawnBonusChance(state, bonusSlot) {
    const chances = difficultyMobSettings(state).startingBatchBonusChances;
    if (!Array.isArray(chances)) {
      return 0;
    }
    return clamp(finiteOr(chances[bonusSlot - 1], 0), 0, 0.92);
  }

  function mobSpawnBonusSlotChance(state, world, kind, bonusSlot) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    const nextKind = MOB_TIER_ORDER[index + 1];
    const defeats = Math.max(0, finiteOr(world.mobDefeatsByKind && world.mobDefeatsByKind[nextKind || kind], 0));
    const settings = difficultyMobSettings(state);
    const bonusChanceScale = finiteOr(settings.bonusChanceScale, 1);
    const progressScale = bonusSlot < 2
      ? bonusChanceScale
      : Math.pow(THIRD_MOB_SPAWN_CHANCE_SCALE, bonusSlot - 1) * bonusChanceScale;
    const progressChance = clamp(defeats / (mobTierUnlockDefeatTarget(nextKind || kind, mobTierUnlockPlayerCount(state)) * bonusSlot), 0, 0.92) * progressScale;
    return clamp(Math.max(startingMobSpawnBonusChance(state, bonusSlot), progressChance), 0, 0.92);
  }

  function rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder) {
    let batchSize = 1;
    for (let bonusSlot = 1; bonusSlot < batchLimit; bonusSlot += 1) {
      if (randomRange(seedHolder, 0, 1) < mobSpawnBonusSlotChance(state, world, kind, bonusSlot)) {
        batchSize += 1;
      }
    }
    return batchSize;
  }

  function maxMobSpawnBatchSize(state, kind, players) {
    const effectiveCount = Math.min(MAX_PLAYERS, effectiveWorldPlayerCount(players));
    return Math.max(1, Math.round(baseMobSpawnBatchLimit(state, kind) * (1 + Math.max(0, effectiveCount - 1) * 0.55)));
  }

  function mobSpawnBatchSize(state, world, kind, players, seedHolder) {
    const effectiveCount = Math.min(MAX_PLAYERS, effectiveWorldPlayerCount(players));
    const batchLimit = baseMobSpawnBatchLimit(state, kind);
    let batchSize = rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder);
    const bonusRolls = Math.floor(Math.max(0, effectiveCount - 1));
    for (let i = 0; i < bonusRolls; i += 1) {
      batchSize += randomRange(seedHolder, 0, 1) < 0.55
        ? rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder)
        : 0;
    }
    const fractionalBonus = Math.max(0, effectiveCount - 1) - bonusRolls;
    if (fractionalBonus > 0 && randomRange(seedHolder, 0, 1) < fractionalBonus * 0.55) {
      batchSize += rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder);
    }
    batchSize += mobBossSpawnPressure(world, kind) * MOB_BOSS_SPAWN_BATCH_BONUS;
    return Math.min(maxMobSpawnBatchSize(state, kind, players), Math.max(1, batchSize));
  }

  function mobSpawnIntervalWithBossPressure(state, kind) {
    const interval = difficultyMobSpawnInterval(state, kind);
    return interval * (mobBossSpawnPressure(state.world, kind) > 0 ? MOB_BOSS_SPAWN_INTERVAL_SCALE : 1);
  }

  function unlockedMobKinds(state, world) {
    return MOB_TIER_ORDER.filter((kind) => isMobTierUnlocked(state, world, kind));
  }

  function mobWaveBossPressure(world) {
    let count = 0;
    for (const kind of MOB_TIER_ORDER) {
      count += liveMobBossCount(world, kind);
    }
    return Math.min(3, count);
  }

  function mobWaveIntervalWithBossPressure(state) {
    const interval = difficultyMobWaveInterval(state);
    return interval * (mobWaveBossPressure(state.world) > 0 ? MOB_BOSS_SPAWN_INTERVAL_SCALE : 1);
  }

  function mobWaveSizeDifficultyScale(state) {
    const mediumScale = finiteOr(DIFFICULTY_MOB_SETTINGS.medium && DIFFICULTY_MOB_SETTINGS.medium.batchScale, 1.24);
    return clamp(finiteOr(difficultyMobSettings(state).batchScale, mediumScale) / mediumScale, 0.8, 1.2);
  }

  function rollMobWaveSize(state, world, players, seedHolder) {
    const playerCount = Math.max(1, Math.min(MAX_PLAYERS, Array.isArray(players) && players.length ? players.length : 1));
    const wavesCompleted = Math.max(0, finiteOr(world.mobWaveCount, 0));
    const mobsPerPlayer = MOB_WAVE_STARTING_MOBS_PER_PLAYER + wavesCompleted / Math.max(1, MOB_WAVE_GROWTH_WAVES);
    const ideal = mobsPerPlayer * playerCount * mobWaveSizeDifficultyScale(state) + mobWaveBossPressure(world) * MOB_BOSS_SPAWN_BATCH_BONUS;
    const whole = Math.floor(ideal);
    const rounded = whole + (randomRange(seedHolder, 0, 1) < ideal - whole ? 1 : 0);
    return Math.max(playerCount, rounded);
  }

  function chooseMobWaveKind(state, world, eligibleKinds, players, reservedCounts, seedHolder) {
    let leastReserved = Infinity;
    const candidates = [];

    for (const kind of eligibleKinds) {
      const reserved = Math.max(0, finiteOr(reservedCounts[kind], 0));
      const remainingSlots = maxLiveMobCount(state, kind, players) - liveMobCount(world, kind) - reserved;
      if (remainingSlots <= 0) {
        continue;
      }
      if (reserved < leastReserved) {
        candidates.length = 0;
        leastReserved = reserved;
      }
      if (reserved === leastReserved) {
        candidates.push(kind);
      }
    }

    if (!candidates.length) {
      return "";
    }
    return candidates[Math.floor(randomRange(seedHolder, 0, candidates.length))] || "";
  }

  function buildMobWaveSlots(state, world, targetCount, players, seedHolder) {
    const eligibleKinds = unlockedMobKinds(state, world).filter((kind) => isMobBeaconReady(world, kind));
    const reservedCounts = {};
    const slots = [];

    for (let i = 0; i < targetCount; i += 1) {
      const kind = chooseMobWaveKind(state, world, eligibleKinds, players, reservedCounts, seedHolder);
      if (!kind) {
        break;
      }
      reservedCounts[kind] = Math.max(0, finiteOr(reservedCounts[kind], 0)) + 1;
      slots.push(kind);
    }

    return slots;
  }

  function compressMobSpawnSlots(slots) {
    const remainingByKind = {};
    const order = [];
    for (const kind of slots) {
      if (!remainingByKind[kind]) {
        remainingByKind[kind] = 0;
        order.push(kind);
      }
      remainingByKind[kind] += 1;
    }

    const entries = [];
    for (const kind of order) {
      let remaining = remainingByKind[kind];
      while (remaining >= MOB_ELITE_COMPRESSION_SIZE) {
        const groupSize = Math.min(remaining, MOB_ELITE_COMPRESSION_SIZE * MOB_ELITE_MAX_STARS);
        const stars = clamp(Math.floor(groupSize / MOB_ELITE_COMPRESSION_SIZE), 1, MOB_ELITE_MAX_STARS);
        const represented = stars * MOB_ELITE_COMPRESSION_SIZE;
        entries.push({ kind, eliteStars: stars, eliteGroupSize: represented });
        remaining -= represented;
      }
      for (let i = 0; i < remaining; i += 1) {
        entries.push({ kind, eliteStars: 0, eliteGroupSize: 1 });
      }
    }
    return entries;
  }

  function chooseMobWaveClumpCenter(world, anchor, players, seedHolder) {
    return chooseMobSpawnPoint(world, "alienoid", anchor, players, seedHolder);
  }
