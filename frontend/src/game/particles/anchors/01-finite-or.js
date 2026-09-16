  function finiteOr(value, fallback) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function createCelestialBodyState(options) {
    const settings = options || {};
    const mass = Math.max(0.001, finiteOr(settings.mass, 1));
    const stellarOutcome = normalizedStellarOutcomeName(settings.stellarOutcome);
    const tier = tierForMassAndStellarOutcome(mass, stellarOutcome);
    const id = Number.isFinite(Number(settings.id))
      ? Math.max(1, Math.floor(Number(settings.id)))
      : nextParticleId++;
    const textureSeed = finiteOr(settings.textureSeed, Math.random() * 1000);
    const body = {
      id,
      x: finiteOr(settings.x, 0),
      y: finiteOr(settings.y, 0),
      vx: finiteOr(settings.vx, 0),
      vy: finiteOr(settings.vy, 0),
      mass,
      radius: radiusFromMassForTier(mass, tier),
      tier,
      rotation: finiteOr(settings.rotation, 0),
      angularVelocity: finiteOr(settings.angularVelocity, 0),
      textureSeed,
      color: settings.color || randomParticleColor(),
      wobble: finiteOr(settings.wobble, randomRange(0, Math.PI * 2)),
      pulse: finiteOr(settings.pulse, randomRange(0.8, 1.25)),
      spawnAge: clamp(finiteOr(settings.spawnAge, 0), 0, particleSpawnTransitionDuration),
      spawnSizeScale: finiteOr(settings.spawnSizeScale, ambientSpawnSizeScale(id, textureSeed)),
      starBirthAge: clamp(finiteOr(settings.starBirthAge, tier.name === "star" ? 0 : starBirthTransitionDuration), 0, starBirthTransitionDuration),
      starEmissionAccumulator: Math.max(0, finiteOr(settings.starEmissionAccumulator, 0)),
      stellarGrowthStarted: Boolean(settings.stellarGrowthStarted),
      stellarGrowthRate: Math.max(0, finiteOr(settings.stellarGrowthRate, 0)),
      stellarGrowthLastSampleAt: Math.max(0, finiteOr(settings.stellarGrowthLastSampleAt, 0)),
      stellarOutcome,
      survivalCampId: typeof settings.survivalCampId === "string" ? settings.survivalCampId : "",
      survivalCampX: finiteOr(settings.survivalCampX, 0),
      survivalCampY: finiteOr(settings.survivalCampY, 0),
      survivalCampHomeX: finiteOr(settings.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(settings.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(settings.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(settings.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof settings.survivalCampLastMoverPlayerId === "string" ? settings.survivalCampLastMoverPlayerId : "",
      survivalCampBody: Boolean(settings.survivalCampBody)
    };
    normalizeBodyEnergy(body);
    return body;
  }

  function nextMobId(kind) {
    if (kind === "ufo") {
      return nextUfoId++;
    }
    if (kind === "rambot") {
      return nextRambotId++;
    }
    if (kind === "engineer") {
      return nextEngineerId++;
    }
    if (kind === "tesla") {
      return nextTeslaId++;
    }
    if (kind === "satellite" || kind === "rocket") {
      return nextRocketId++;
    }
    if (kind === "fighter") {
      return nextFighterId++;
    }
    return nextRivalId++;
  }

  function bossStarRankValue(value) {
    return Math.max(0, Math.floor(finiteOr(value, 0)));
  }

  function bossStarRank(mob) {
    return mob && mob.isBoss ? bossStarRankValue(mob.bossStars) : 0;
  }

  function bossHealthScaleForStars(stars) {
    return 1 + bossStarRankValue(stars) * mobBossStarHealthMultiplier;
  }

  function bossStatScaleForStars(stars, perStar) {
    return 1 + bossStarRankValue(stars) * Math.max(0, finiteOr(perStar, 0));
  }

  function bossCooldownScaleForStars(stars) {
    return clamp(1 - bossStarRankValue(stars) * mobBossStarCooldownReduction, 0.42, 1);
  }

  function mobEliteStarRankValue(value) {
    return clamp(Math.floor(finiteOr(value, 0)), 0, mobEliteMaxStars);
  }

  function mobEliteStarRank(mob) {
    return mob && !mob.isBoss ? mobEliteStarRankValue(mob.eliteStars) : 0;
  }

  function mobEliteRewardValue(mob) {
    const stars = mobEliteStarRank(mob);
    return stars > 0
      ? Math.max(1, Math.floor(finiteOr(mob && mob.eliteGroupSize, stars * mobEliteCompressionSize)))
      : 1;
  }

  function mobEliteHealthScale(stars) {
    return 1 + mobEliteStarRankValue(stars) * mobEliteHealthMultiplier;
  }

  function mobEliteRadiusScale(stars) {
    return 1 + mobEliteStarRankValue(stars) * mobEliteRadiusMultiplier;
  }

  function mobEliteStatScale(mob, perStar) {
    const stars = mobEliteStarRank(mob);
    return stars > 0 ? 1 + stars * Math.max(0, finiteOr(perStar, 0)) : 1;
  }

  function mobEliteCooldownScale(mob) {
    const stars = mobEliteStarRank(mob);
    return stars > 0 ? clamp(1 - stars * mobEliteCooldownReduction, 0.7, 1) : 1;
  }

  function createMobFromBlueprint(kind, x, y, overrides) {
    const blueprint = mobEntityBlueprints[kind] || mobEntityBlueprints.alienoid;
    const settings = overrides || {};
    const color = blueprint.color ? { ...blueprint.color } : randomAlienColor();
    const speedJitter = Math.max(0, finiteOr(blueprint.speedJitter, 16));
    const isBoss = Boolean(settings.isBoss);
    const bossStars = isBoss ? Math.max(0, Math.floor(finiteOr(settings.bossStars, 0))) : 0;
    const eliteStars = isBoss ? 0 : mobEliteStarRankValue(settings.eliteStars);
    const eliteGroupSize = eliteStars > 0
      ? Math.max(mobEliteCompressionSize, Math.floor(finiteOr(settings.eliteGroupSize, eliteStars * mobEliteCompressionSize)))
      : 1;
    const radius = isBoss ? blueprint.radius * mobBossRadiusMultiplier : blueprint.radius * mobEliteRadiusScale(eliteStars);
    const maxHealth = isBoss
      ? blueprint.health * mobBossHealthMultiplier * bossHealthScaleForStars(bossStars)
      : blueprint.health * mobEliteHealthScale(eliteStars);
    return Object.assign({
      kind,
      id: nextMobId(kind),
      x,
      y,
      vx: randomRange(-speedJitter, speedJitter),
      vy: randomRange(-speedJitter, speedJitter),
      radius,
      health: maxHealth,
      maxHealth,
      color,
      flash: 0,
      hitCooldown: 0,
      disabledTimer: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      rotation: 0,
      wobble: randomRange(0, Math.PI * 2),
      eliteStars,
      eliteGroupSize,
      bossStars,
      team: settings.team === "player" ? "player" : "",
      summonAge: Math.max(0, finiteOr(settings.summonAge, 0)),
      summonDuration: Math.max(0, finiteOr(settings.summonDuration, 0)),
      summonBaseRadius: Math.max(0, finiteOr(settings.summonBaseRadius, radius)),
      summonSpinSpeed: finiteOr(settings.summonSpinSpeed, 0)
    }, settings, { eliteStars, eliteGroupSize, bossStars });
  }

  function createBossMob(kind, x, y) {
    const bossStars = Math.max(0, Math.floor(finiteOr(mobBossDefeatsByKind[kind], 0)));
    const boss = createMobByKind(kind, x, y, {
      isBoss: true,
      bossBaseKind: kind,
      bossStars,
      minionCooldown: randomRange(mobBossMinionCooldownMin, mobBossMinionCooldownMax),
      altAttackCooldown: randomRange(mobBossAltAttackCooldownMin, mobBossAltAttackCooldownMax) * bossCooldownScaleForStars(bossStars),
      bossBodyEvadeTimer: 0,
      bossBodyEvadeSpeedCap: 0
    });
    boss.flash = Math.max(boss.flash || 0, 0.6);
    return boss;
  }

  function createMobByKind(kind, x, y, overrides) {
    if (kind === "ufo") {
      return createUfo(x, y, overrides);
    }
    if (kind === "rambot") {
      return createRambot(x, y, overrides);
    }
    if (kind === "engineer") {
      return createEngineer(x, y, overrides);
    }
    if (kind === "tesla") {
      return createTesla(x, y, overrides);
    }
    if (kind === "satellite") {
      return createSatellite(x, y, overrides);
    }
    if (kind === "rocket") {
      return createRocket(x, y, overrides);
    }
    if (kind === "fighter") {
      return createFighter(x, y, overrides);
    }
    return createRival(x, y, overrides);
  }

  function createParticle(x, y, mass, color) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(5, 36);
    return createCelestialBodyState({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      mass,
      color
    });
  }

  function ambientMassDetail(spawnPoint, roll, salt) {
    const x = finiteOr(spawnPoint && spawnPoint.x, 0);
    const y = finiteOr(spawnPoint && spawnPoint.y, 0);
    const wave = Math.sin(x * 0.017 + y * 0.023 + roll * 977.3 + salt * 43.7) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function randomAmbientParticleMass(spawnPoint) {
    const patchAffinity = clamp(finiteOr(spawnPoint && spawnPoint.patchAffinity, 0), 0, 1);
    const voidAffinity = clamp(finiteOr(spawnPoint && spawnPoint.voidAffinity, 0), 0, 1);
    const richness = clamp(patchAffinity - voidAffinity * 0.55, 0, 1);
    const spacingRoom = clamp((finiteOr(spawnPoint && spawnPoint.densityNearest, 260) - 185) / 260, 0.12, 1);
    const crowdRoom = clamp(1 - finiteOr(spawnPoint && spawnPoint.crowdCount, 0) * 0.12, 0.38, 1);
    const resourceRoom = spacingRoom * crowdRoom;
    const roll = Math.random();
    const detail = ambientMassDetail(spawnPoint, roll, 1);
    const rockChance = Math.max(0, (richness - 0.28) / 0.72) * (0.04 + richness * 0.065) * resourceRoom;

    if (roll < rockChance) {
      return 10;
    }

    const particleRoll = (roll - rockChance) / Math.max(0.0001, 1 - rockChance);
    const tinyCutoff = clamp(0.58 - richness * 0.2 + voidAffinity * 0.22, 0.38, 0.78);
    const smallCutoff = clamp(0.84 - richness * 0.14 + voidAffinity * 0.08, tinyCutoff + 0.08, 0.94);
    const mediumCutoff = clamp(0.96 - richness * 0.06, smallCutoff + 0.03, 0.985);

    if (particleRoll < tinyCutoff) {
      return 1;
    }
    if (particleRoll < smallCutoff) {
      return richness > 0.62 && detail < 0.34 ? 3 : 2;
    }
    if (particleRoll < mediumCutoff) {
      return 3;
    }
    return 4;
  }

  function ambientSpawnSizeScale(id, textureSeed) {
    const wave = Math.sin(id * 12.9898 + textureSeed * 78.233) * 43758.5453;
    const unit = wave - Math.floor(wave);
    if (unit < 0.74) {
      return 1;
    }
    if (unit < 0.94) {
      return 1.08;
    }
    return 1.16;
  }

  function addUniquePlayerAnchor(anchors, seenPlayerIds, anchor) {
    if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
      return;
    }

    const playerId = String(anchor.playerId || "");
    if (playerId) {
      if (seenPlayerIds.has(playerId)) {
        return;
      }
      seenPlayerIds.add(playerId);
    }

    anchors.push({
      x: anchor.x,
      y: anchor.y,
      vx: finiteOr(anchor.vx, 0),
      vy: finiteOr(anchor.vy, 0),
      playerId
    });
  }

  function addRemoteUniversePlayerAnchors(anchors, seenPlayerIds) {
    if (!multiplayer.remoteUniverses.size) {
      return;
    }

    const now = performance.now();
    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!remote || now - finiteOr(remote.seenAt, 0) > 2200) {
        continue;
      }

      const transform = displayTransformFor(remote);
      if (!transform || transform.alpha <= 0.02) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const remotePlayer = normalizeRemotePlayerSnapshot(snapshot && snapshot.player);
      if (!remotePlayer || remotePlayer.health <= 0) {
        continue;
      }

      const transformed = transformedRemoteEntity(remotePlayer, transform);
      addUniquePlayerAnchor(anchors, seenPlayerIds, {
        x: transformed.x,
        y: transformed.y,
        vx: transformed.vx,
        vy: transformed.vy,
        playerId: remote.playerId || remotePlayer.id
      });
    }
  }

  function activePartyPlayerAnchors() {
    const anchors = [];
    const seenPlayerIds = new Set();
    addUniquePlayerAnchor(anchors, seenPlayerIds, {
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      playerId: player.id
    });

    if (isPartyHost() && multiplayer.partyPlayerSnapshots.size) {
      const now = performance.now();
      for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
        if (!entry || now - finiteOr(entry.receivedAt, 0) > 2200) {
          continue;
        }

        const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
        const remotePlayer = normalizeRemotePlayerSnapshot(source.player || source);
        if (!remotePlayer || remotePlayer.health <= 0) {
          continue;
        }
        addUniquePlayerAnchor(anchors, seenPlayerIds, {
          x: remotePlayer.x,
          y: remotePlayer.y,
          vx: remotePlayer.vx,
          vy: remotePlayer.vy,
          playerId
        });
      }
    }

    addRemoteUniversePlayerAnchors(anchors, seenPlayerIds);
    return anchors;
  }

  function activeMobSpawnAnchors() {
    const anchors = [];
    const seenPlayerIds = new Set();
    if (!deathState.active && player.health > 0) {
      addUniquePlayerAnchor(anchors, seenPlayerIds, {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        playerId: player.id
      });
    }

    if (isPartyHost() && multiplayer.partyPlayerSnapshots.size) {
      const now = performance.now();
      for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
        if (!entry || now - finiteOr(entry.receivedAt, 0) > 2200) {
          continue;
        }

        const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
        const remotePlayer = predictPartyRemotePlayer(
          normalizeRemotePlayerSnapshot(source.player || source),
          entry.receivedAt
        );
        if (!remotePlayer || remotePlayer.health <= 0) {
          continue;
        }
        addUniquePlayerAnchor(anchors, seenPlayerIds, {
          x: remotePlayer.x,
          y: remotePlayer.y,
          vx: remotePlayer.vx,
          vy: remotePlayer.vy,
          playerId
        });
      }
    }

    addRemoteUniversePlayerAnchors(anchors, seenPlayerIds);

    if (!anchors.length) {
      addUniquePlayerAnchor(anchors, seenPlayerIds, {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        playerId: player.id
      });
    }

    return anchors.slice(0, crazyGamesRoomMaxPlayers);
  }

  function leastPopulatedMobSpawnAnchor(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    const counts = source.map(() => 0);

    for (const mob of liveMobsForSpawnPlacement()) {
      let bestIndex = 0;
      let bestDistance = Infinity;
      for (let i = 0; i < source.length; i += 1) {
        const anchor = source[i];
        const distance = Math.hypot(mob.x - anchor.x, mob.y - anchor.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }
      counts[bestIndex] += 1;
    }

    let minCount = Infinity;
    for (const count of counts) {
      minCount = Math.min(minCount, count);
    }

    const candidates = source.filter((_, index) => counts[index] === minCount);
    return candidates[Math.floor(Math.random() * candidates.length)] || source[0] || player;
  }

  function effectiveMobAnchorCount(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    const clusterRadius = particleDensityRadius() * 0.95;
    const clusters = [];

    for (const anchor of source) {
      let cluster = null;
      for (const candidate of clusters) {
        if (Math.hypot(anchor.x - candidate.x, anchor.y - candidate.y) <= clusterRadius) {
          cluster = candidate;
          break;
        }
      }

      if (!cluster) {
        clusters.push({ x: anchor.x, y: anchor.y, count: 1 });
        continue;
      }

      cluster.x = (cluster.x * cluster.count + anchor.x) / (cluster.count + 1);
      cluster.y = (cluster.y * cluster.count + anchor.y) / (cluster.count + 1);
      cluster.count += 1;
    }

    return clusters.reduce((total, cluster) => total + 1 + Math.max(0, cluster.count - 1) * 0.42, 0) || 1;
  }
