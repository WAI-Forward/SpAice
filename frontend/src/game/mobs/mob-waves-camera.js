  function rollMobWaveSize(anchors) {
    const playerCount = Math.max(1, Math.min(crazyGamesRoomMaxPlayers, Array.isArray(anchors) && anchors.length ? anchors.length : 1));
    const wavesCompleted = Math.max(0, finiteOr(mobWaveCount, 0));
    const mobsPerPlayer = mobWaveStartingMobsPerPlayer + wavesCompleted / Math.max(1, mobWaveGrowthWaves);
    const ideal = mobsPerPlayer * playerCount * mobWaveSizeDifficultyScale() + mobWaveBossPressure() * mobBossSpawnBatchBonus;
    const whole = Math.floor(ideal);
    const rounded = whole + (Math.random() < ideal - whole ? 1 : 0);
    return Math.max(playerCount, rounded);
  }

  function chooseMobWaveKind(eligibleKinds, anchors, reservedCounts) {
    let leastReserved = Infinity;
    const candidates = [];

    for (const kind of eligibleKinds) {
      const reserved = Math.max(0, reservedCounts[kind] || 0);
      const remainingSlots = maxLiveMobCount(kind, anchors) - liveMobCount(kind) - reserved;
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
    return candidates[Math.floor(Math.random() * candidates.length)] || "";
  }

  function buildMobWaveSlots(targetCount, anchors) {
    const eligibleKinds = unlockedMobKinds().filter(isMobBeaconReady);
    const reservedCounts = {};
    const slots = [];

    for (let i = 0; i < targetCount; i += 1) {
      const kind = chooseMobWaveKind(eligibleKinds, anchors, reservedCounts);
      if (!kind) {
        break;
      }
      reservedCounts[kind] = Math.max(0, reservedCounts[kind] || 0) + 1;
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
      while (remaining >= mobEliteCompressionSize) {
        const groupSize = Math.min(remaining, mobEliteCompressionSize * mobEliteMaxStars);
        const stars = clamp(Math.floor(groupSize / mobEliteCompressionSize), 1, mobEliteMaxStars);
        const represented = stars * mobEliteCompressionSize;
        entries.push({ kind, eliteStars: stars, eliteGroupSize: represented });
        remaining -= represented;
      }
      for (let i = 0; i < remaining; i += 1) {
        entries.push({ kind, eliteStars: 0, eliteGroupSize: 1 });
      }
    }
    return entries;
  }

  function chooseMobWaveClumpCenter(anchor, anchors) {
    return chooseMobSpawnPoint("alienoid", 190, 620, anchor, anchors);
  }

  function clumpOffset(index, count) {
    const angle = randomRange(0, Math.PI * 2) + index * 2.399963229728653;
    const progress = count > 1 ? index / Math.max(1, count - 1) : 0;
    const radius = randomRange(mobWaveClumpMinRadius, mobWaveClumpMaxRadius) * (0.72 + progress * 0.34);
    return {
      x: Math.cos(angle) * radius + randomRange(-22, 22),
      y: Math.sin(angle) * radius + randomRange(-22, 22)
    };
  }

  function splitMobWaveSlotsByAnchor(slots, anchors) {
    const groups = anchors.map(() => []);
    if (!groups.length) {
      return groups;
    }

    for (const kind of slots) {
      let leastCount = Infinity;
      const candidates = [];
      for (let i = 0; i < groups.length; i += 1) {
        if (groups[i].length < leastCount) {
          candidates.length = 0;
          leastCount = groups[i].length;
        }
        if (groups[i].length === leastCount) {
          candidates.push(i);
        }
      }
      const groupIndex = candidates[Math.floor(Math.random() * candidates.length)] || 0;
      groups[groupIndex].push(kind);
    }

    return groups;
  }

  function spawnMobWave(slots, anchors) {
    const sourceAnchors = (Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors()).slice(0, crazyGamesRoomMaxPlayers);
    const groups = splitMobWaveSlotsByAnchor(slots, sourceAnchors);
    const spawnedKinds = new Set();

    for (let anchorIndex = 0; anchorIndex < groups.length; anchorIndex += 1) {
      const kinds = groups[anchorIndex];
      if (!kinds.length) {
        continue;
      }
      const center = chooseMobWaveClumpCenter(sourceAnchors[anchorIndex], sourceAnchors);
      const entries = compressMobSpawnSlots(kinds);
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const offset = clumpOffset(i, entries.length);
        const mob = createMobByKind(entry.kind, center.x + offset.x, center.y + offset.y, {
          eliteStars: entry.eliteStars,
          eliteGroupSize: entry.eliteGroupSize
        });
        mobCollectionByKind(entry.kind).push(mob);
        spawnedKinds.add(entry.kind);
      }
    }

    return spawnedKinds;
  }

  function startMobSpawnGracePeriod() {
    mobSpawnRestTimer = mobSpawnRestDuration;
    mobSpawnRestDrainTimer = 0;
    mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
  }

  function updateMobSpawnRest(dt, anchors) {
    const manageableThreshold = manageableMobRestThreshold(anchors);

    if (mobSpawnRestDrainTimer > 0) {
      mobSpawnRestDrainTimer = Math.max(0, mobSpawnRestDrainTimer - dt);
      if (totalLiveMobCount() <= manageableThreshold || mobSpawnRestDrainTimer <= 0) {
        startMobSpawnGracePeriod();
      }
      return true;
    }

    if (mobSpawnRestTimer > 0) {
      mobSpawnRestTimer = Math.max(0, mobSpawnRestTimer - dt);
      return true;
    }

    mobSpawnRestCooldownTimer = Math.max(0, mobSpawnRestCooldownTimer - dt);
    if (mobSpawnRestCooldownTimer > 0) {
      return false;
    }

    mobSpawnRestDrainTimer = mobSpawnRestDrainMaxDuration;
    mobSpawnRestCooldownTimer = mobSpawnRestCooldown;
    if (totalLiveMobCount() <= manageableThreshold) {
      startMobSpawnGracePeriod();
    }
    return true;
  }

  function updateMobSpawns(dt) {
    const anchors = activeMobSpawnAnchors();
    if (!isHordeModeActive()) {
      updateSurvivalAllowanceMobSpawns(dt, anchors);
      return;
    }
    updateHordeMobSpawns(dt, anchors);
  }

  function seedStarDust() {
    starDust.length = 0;
    for (let i = 0; i < 180; i += 1) {
      starDust.push({
        x: randomRange(-3600, 3600),
        y: randomRange(-3600, 3600),
        r: randomRange(0.5, 1.8),
        a: randomRange(0.18, 0.68)
      });
    }
  }

  function cameraLocalToWorld(x, y) {
    return rotatePoint(x, y, -cameraRoll);
  }
