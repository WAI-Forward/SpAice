  function normalizePlayer(source, fallbackId, index) {
    const snapshot = source && typeof source === "object" ? source : {};
    const playerId = String(snapshot.id || snapshot.playerId || fallbackId || "");
    const angle = index ? (Math.PI * 2 * index) / MAX_PLAYERS : 0;
    const spawnRadius = index ? 120 + index * 22 : 0;
    const maxHealth = clamp(Number.isFinite(Number(snapshot.maxHealth)) ? snapshot.maxHealth : PLAYER_MAX_HEALTH, 1, PLAYER_MAX_HEALTH);
    const maxEnergy = clamp(Number.isFinite(Number(snapshot.maxEnergy)) ? snapshot.maxEnergy : PLAYER_MAX_ENERGY, PLAYER_MAX_ENERGY, 260);
    const statusEffects = normalizePlayerStatusEffects(snapshot.statusEffects, snapshot.toolDisabledTimer);
    return {
      id: playerId,
      name: String(snapshot.name || (playerId ? "Player " + playerId.slice(-4).toUpperCase() : "Player")),
      teamId: String(snapshot.teamId || "").replace(/[^\w.-]/g, "").slice(0, 80),
      skinId: String(snapshot.skinId || "").replace(/[^\w.-]/g, "").slice(0, 64),
      trailId: String(snapshot.trailId || "").replace(/[^\w.-]/g, "").slice(0, 64),
      x: finiteOr(snapshot.x, Math.cos(angle) * spawnRadius),
      y: finiteOr(snapshot.y, Math.sin(angle) * spawnRadius),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, PLAYER_RADIUS),
      health: clamp(Number.isFinite(Number(snapshot.health)) ? snapshot.health : maxHealth, 0, maxHealth),
      maxHealth,
      energy: clamp(Number.isFinite(Number(snapshot.energy)) ? snapshot.energy : maxEnergy, 0, maxEnergy),
      maxEnergy,
      score: Math.max(1, Math.round(finiteOr(snapshot.score, 1))),
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      respawnTimer: Math.max(0, finiteOr(snapshot.respawnTimer, 0)),
      invulnerableTimer: Math.max(0, finiteOr(snapshot.invulnerableTimer, 0)),
      statusEffects,
      toolDisabledTimer: statusEffects.disabled,
      toolFireCooldown: Math.max(0, finiteOr(snapshot.toolFireCooldown, 0)),
      landed: normalizeLandingSnapshot(snapshot.landed),
      spacecraftInterior: normalizeSpacecraftInteriorSnapshot(snapshot.spacecraftInterior),
      walkCycle: finiteOr(snapshot.walkCycle, 0),
      cameraRoll: finiteOr(snapshot.cameraRoll, 0),
      aimAngle: finiteOr(snapshot.aimAngle, 0),
      aimLocalAngle: Number.isFinite(Number(snapshot.aimLocalAngle))
        ? finiteOr(snapshot.aimLocalAngle, 0)
        : finiteOr(snapshot.aimAngle, 0) + finiteOr(snapshot.cameraRoll, 0),
      equippedTool: String(snapshot.equippedTool || DEFAULT_TOOL_ID),
      toolMode: String(snapshot.toolMode || "idle"),
      moving: Boolean(snapshot.moving),
      boosting: Boolean(snapshot.boosting),
      jetpackMoveX: finiteOr(snapshot.jetpackMoveX, 0),
      jetpackMoveY: finiteOr(snapshot.jetpackMoveY, -1),
      crouching: Boolean(snapshot.crouching),
      rocketSuitCharge: clamp(finiteOr(snapshot.rocketSuitCharge, 0), 0, 1),
      rocketSuitActive: Boolean(snapshot.rocketSuitActive),
      tech: defaultTechInventory(snapshot.tech),
      tools: Array.isArray(snapshot.tools) && snapshot.tools.length ? snapshot.tools.slice(0, 8).map(String) : [DEFAULT_TOOL_ID],
      equippedTools: Array.isArray(snapshot.equippedTools) && snapshot.equippedTools.length ? snapshot.equippedTools.slice(0, 8).map(String) : [DEFAULT_TOOL_ID],
      toolUpgrades: snapshot.toolUpgrades && typeof snapshot.toolUpgrades === "object" ? clone(snapshot.toolUpgrades) : {},
      familiarNetCapture: normalizeFamiliarNetCapture(snapshot.familiarNetCapture),
      familiarNetFireHeld: Boolean(snapshot.familiarNetFireHeld),
      familiarNetReleaseHeld: Boolean(snapshot.familiarNetReleaseHeld),
      personalTether: normalizePersonalTetherSnapshot(snapshot.personalTether),
      personalTetherFireHeld: Boolean(snapshot.personalTetherFireHeld),
      personalTetherReleaseHeld: Boolean(snapshot.personalTetherReleaseHeld),
      lastInputSeq: Math.max(0, Math.floor(finiteOr(snapshot.lastInputSeq, 0)))
    };
  }

  function normalizePersonalTetherSnapshot(source) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const bodyId = Math.max(0, Math.floor(finiteOr(source.bodyId, 0)));
    if (!bodyId) {
      return null;
    }
    return {
      bodyId,
      angle: finiteOr(source.angle, 0),
      surfaceOffset: Math.max(0, finiteOr(source.surfaceOffset, 0)),
      restLength: clamp(finiteOr(source.restLength, 0), 80, PERSONAL_TETHER_MAX_REST_LENGTH),
      deploy: clamp(finiteOr(source.deploy, 1), 0, 1),
      wobble: finiteOr(source.wobble, 0)
    };
  }

  function normalizeFamiliarNetCapture(source) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const kind = MOB_TIER_ORDER.includes(source.kind) ? source.kind : "";
    if (!kind || source.isBoss) {
      return null;
    }
    return {
      kind,
      health: Math.max(1, finiteOr(source.health, 1)),
      maxHealth: Math.max(1, finiteOr(source.maxHealth, source.health || 1)),
      color: cloneColor(source.color)
    };
  }

  function normalizeLandingSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      bridgeId: Math.max(0, Math.floor(finiteOr(snapshot.bridgeId, 0))),
      bridgeT: Math.max(0, finiteOr(snapshot.bridgeT, 0)),
      bridgeSide: finiteOr(snapshot.bridgeSide, 1) < 0 ? -1 : 1,
      bridgeInputSign: finiteOr(snapshot.bridgeInputSign, 1) < 0 ? -1 : 1,
      angle: finiteOr(snapshot.angle, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      walkCycle: finiteOr(snapshot.walkCycle, 0)
    };
  }

  function normalizeSpacecraftInteriorSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      spacecraftId: Math.max(1, Math.floor(finiteOr(snapshot.spacecraftId, 0))),
      localX: finiteOr(snapshot.localX, 0),
      localY: finiteOr(snapshot.localY, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      forceExit: Boolean(snapshot.forceExit),
      forceExitSpeed: Math.max(0, finiteOr(snapshot.forceExitSpeed, 0)),
      onFloor: snapshot.onFloor !== false
    };
  }

  function normalizeParticle(source, fallbackId, seedHolder) {
    const snapshot = source && typeof source === "object" ? source : {};
    const mass = Math.max(1, finiteOr(snapshot.mass, 1));
    const stellarOutcome = normalizedStellarOutcomeName(snapshot.stellarOutcome);
    const tier = tierForMassAndStellarOutcome(mass, stellarOutcome);
    const colorFallback = !snapshot.color && seedHolder ? randomParticleColor(seedHolder) : { r: 110, g: 190, b: 255 };
    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      mass,
      radius: radiusFromMassForTier(mass, tier),
      tier: clone(tier),
      energy: finiteOr(snapshot.energy, 0),
      maxEnergy: finiteOr(snapshot.maxEnergy, 0),
      rotation: finiteOr(snapshot.rotation, 0),
      angularVelocity: clamp(finiteOr(snapshot.angularVelocity, 0), -BODY_MAX_ANGULAR_SPEED, BODY_MAX_ANGULAR_SPEED),
      color: normalizeColor(snapshot.color, colorFallback),
      textureSeed: finiteOr(snapshot.textureSeed, seedHolder ? randomRange(seedHolder, 0, 1000) : 0),
      wobble: finiteOr(snapshot.wobble, seedHolder ? randomRange(seedHolder, 0, Math.PI * 2) : 0),
      pulse: finiteOr(snapshot.pulse, 1),
      spawnAge: clamp(finiteOr(snapshot.spawnAge, PARTICLE_SPAWN_TRANSITION_DURATION), 0, PARTICLE_SPAWN_TRANSITION_DURATION),
      spawnSizeScale: finiteOr(snapshot.spawnSizeScale, 1),
      orbitHostId: Math.max(0, Math.floor(finiteOr(snapshot.orbitHostId, 0))),
      orbitRingIndex: Math.max(0, Math.floor(finiteOr(snapshot.orbitRingIndex, 0))),
      orbitDirection: finiteOr(snapshot.orbitDirection, 1) < 0 ? -1 : 1,
      orbitStrength: clamp(finiteOr(snapshot.orbitStrength, 0), 0, 1),
      orbitGrace: Math.max(0, finiteOr(snapshot.orbitGrace, 0)),
      starBirthAge: clamp(finiteOr(snapshot.starBirthAge, tier.name === "star" ? STAR_BIRTH_TRANSITION_DURATION : 0), 0, STAR_BIRTH_TRANSITION_DURATION),
      starEmissionAccumulator: Math.max(0, finiteOr(snapshot.starEmissionAccumulator, 0)),
      stellarGrowthStarted: Boolean(snapshot.stellarGrowthStarted),
      stellarGrowthRate: Math.max(0, finiteOr(snapshot.stellarGrowthRate, 0)),
      stellarGrowthLastSampleAt: Math.max(0, finiteOr(snapshot.stellarGrowthLastSampleAt, 0)),
      stellarOutcome,
      randomEventId: typeof snapshot.randomEventId === "string" ? snapshot.randomEventId : "",
      randomEventRegionX: finiteOr(snapshot.randomEventRegionX, Number.NaN),
      randomEventRegionY: finiteOr(snapshot.randomEventRegionY, Number.NaN),
      ufoSapTimer: Math.max(0, finiteOr(snapshot.ufoSapTimer, 0)),
      ufoSapSourceGraceTimer: Math.max(0, finiteOr(snapshot.ufoSapSourceGraceTimer, 0)),
      ufoExtractedById: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedById, 0))),
      ufoExtractedFromId: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedFromId, 0))),
      ufoSapParticleBuffer: Math.max(0, finiteOr(snapshot.ufoSapParticleBuffer, 0)),
      ownerPlayerId: tier.name !== "particle" && typeof snapshot.ownerPlayerId === "string" ? snapshot.ownerPlayerId : "",
      survivalCampId: typeof snapshot.survivalCampId === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot.survivalCampY, 0),
      survivalCampHomeX: finiteOr(snapshot.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(snapshot.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(snapshot.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(snapshot.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof snapshot.survivalCampLastMoverPlayerId === "string" ? snapshot.survivalCampLastMoverPlayerId : "",
      lastControllingPlayerId: typeof snapshot.lastControllingPlayerId === "string" ? snapshot.lastControllingPlayerId : "",
      lastPlayerControlBelowSpeedAt: Math.max(0, finiteOr(snapshot.lastPlayerControlBelowSpeedAt, 0)),
      playerImpactDebrisCooldown: Math.max(0, finiteOr(snapshot.playerImpactDebrisCooldown, 0)),
      survivalCampBody: Boolean(snapshot.survivalCampBody),
      ambientSpawnRock: Boolean(snapshot.ambientSpawnRock)
    };
  }

  function randomParticleColor(seedHolder) {
    const hue = randomRange(seedHolder, 0, 360);
    return hslToRgb(hue, randomRange(seedHolder, 0.74, 0.94), randomRange(seedHolder, 0.52, 0.68));
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (hp >= 0 && hp < 1) {
      r1 = c;
      g1 = x;
    } else if (hp < 2) {
      r1 = x;
      g1 = c;
    } else if (hp < 3) {
      g1 = c;
      b1 = x;
    } else if (hp < 4) {
      g1 = x;
      b1 = c;
    } else if (hp < 5) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }

    const m = l - c / 2;
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function nearestPlayerDistance(x, y, players) {
    let nearest = Infinity;
    for (const player of players) {
      const distance = Math.hypot(x - player.x, y - player.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function ambientDensityAt(world, x, y) {
    const crowdRadius = 480;
    const crowdRadiusSq = crowdRadius * crowdRadius;
    let nearest = Infinity;
    let crowdCount = 0;
    for (const body of world.particles) {
      if (!body || body.tier && body.tier.solid) {
        continue;
      }
      const dx = x - body.x;
      const dy = y - body.y;
      const distanceSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSq);
      if (distance < nearest) {
        nearest = distance;
      }
      if (distanceSq <= crowdRadiusSq) {
        crowdCount += 1;
      }
    }
    return { nearest: Number.isFinite(nearest) ? nearest : crowdRadius, crowdCount };
  }

  function particlePatchNoise(cellX, cellY, salt) {
    const wave = Math.sin(cellX * 127.1 + cellY * 311.7 + salt * 74.3) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function particlePatchAffinityAt(x, y) {
    const cellSize = 1850;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    let affinity = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        const patchX = cellX + xOffset;
        const patchY = cellY + yOffset;
        const roll = particlePatchNoise(patchX, patchY, 0);
        if (roll < 0.58) {
          continue;
        }

        const centerX = (patchX + particlePatchNoise(patchX, patchY, 1)) * cellSize;
        const centerY = (patchY + particlePatchNoise(patchX, patchY, 2)) * cellSize;
        const radius = 720 + particlePatchNoise(patchX, patchY, 3) * 620;
        const distance = Math.hypot(x - centerX, y - centerY);
        const falloff = clamp(1 - distance / radius, 0, 1);
        const strength = 0.68 + particlePatchNoise(patchX, patchY, 4) * 0.52;
        affinity += falloff * falloff * strength;
      }
    }

    return clamp(affinity, 0, 1);
  }

  function particleVoidAffinityAt(x, y) {
    const cellSize = 2350;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    let affinity = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        const patchX = cellX + xOffset;
        const patchY = cellY + yOffset;
        const roll = particlePatchNoise(patchX, patchY, 9);
        if (roll < 0.64) {
          continue;
        }

        const centerX = (patchX + particlePatchNoise(patchX, patchY, 10)) * cellSize;
        const centerY = (patchY + particlePatchNoise(patchX, patchY, 11)) * cellSize;
        const radius = 780 + particlePatchNoise(patchX, patchY, 12) * 760;
        const distance = Math.hypot(x - centerX, y - centerY);
        const falloff = clamp(1 - distance / radius, 0, 1);
        const strength = 0.54 + particlePatchNoise(patchX, patchY, 13) * 0.5;
        affinity += falloff * falloff * strength;
      }
    }

    return clamp(affinity, 0, 1);
  }

  function chooseAmbientParticleSpawnPoint(world, anchor, players, seedHolder, options) {
    const localFill = Boolean(options && options.localFill);
    const localFillRadius = AMBIENT_PARTICLE_PLAYFIELD_RADIUS;
    const speed = Math.hypot(finiteOr(anchor.vx, 0), finiteOr(anchor.vy, 0));
    const moving = speed > 45;
    const travel = moving ? normalize(anchor.vx, anchor.vy) : { x: 0, y: 0 };
    const bowWave = Boolean(anchor.ambientAnchorBowWave && moving);
    const bowStrength = bowWave
      ? clamp(Object.prototype.hasOwnProperty.call(anchor, "ambientAnchorWeight") ? finiteOr(anchor.ambientAnchorWeight, 0) : 1, 0.02, 1)
      : 0;
    const bodyRadius = Math.max(0, finiteOr(anchor.radius, 0));
    let best = null;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const bowRoll = nextRandom(seedHolder);
      const wakeBias = bowWave && bowRoll < 0.26 + bowStrength * 0.1;
      const noseBias = bowWave && !wakeBias && bowRoll > 0.9 - bowStrength * 0.22;
      const bowSpread = randomRange(seedHolder, 0.18, 1.22 - bowStrength * 0.32);
      const bowSide = nextRandom(seedHolder) < 0.5 ? -1 : 1;
      const aheadBias = moving && nextRandom(seedHolder) < (bowWave ? 0.48 + bowStrength * 0.32 : 0.58);
      const angle = bowWave
        ? Math.atan2(travel.y, travel.x) + (wakeBias ? Math.PI + randomRange(seedHolder, -0.72, 0.72) : noseBias ? randomRange(seedHolder, -0.22, 0.22) : bowSide * bowSpread)
        : aheadBias
          ? Math.atan2(travel.y, travel.x) + randomRange(seedHolder, -1.05, 1.05)
          : randomRange(seedHolder, 0, Math.PI * 2);
      const baseMinDist = bowWave
        ? Math.max(bodyRadius + 46, 122)
        : AMBIENT_PARTICLE_MIN_PLAYER_DISTANCE * randomRange(seedHolder, 1, 1.12);
      const minDist = bowWave
        ? baseMinDist
        : localFill
        ? Math.min(baseMinDist, Math.max(120, AMBIENT_PARTICLE_DENSITY_RADIUS * 0.74))
        : baseMinDist;
      const broadMaxDist = bowWave
        ? Math.min(Math.max(minDist + 100, bodyRadius + 210 + speed * (0.03 + bowStrength * 0.045)), 520)
        : AMBIENT_PARTICLE_MAX_PLAYER_DISTANCE + clamp(speed * 0.82, 0, 620);
      const maxDist = bowWave
        ? broadMaxDist
        : localFill
        ? Math.max(minDist + 60, Math.min(broadMaxDist, localFillRadius * 0.92))
        : broadMaxDist;
      const dist = randomRange(seedHolder, minDist, maxDist);
      const ahead = bowWave
        ? wakeBias
          ? -randomRange(seedHolder, bodyRadius * 0.25, bodyRadius * (0.95 + bowStrength * 0.7) + speed * 0.1)
          : clamp(speed * randomRange(seedHolder, 0.005, 0.05 + bowStrength * 0.05), 0, 96)
        : moving ? clamp(speed * randomRange(seedHolder, 0.18, 1.2), 0, 820) : 0;
      const driftRange = bowWave ? Math.max(12, Math.min(58, bodyRadius * (0.09 + bowStrength * 0.08))) : localFill ? 110 : 220;
      const drift = rotatePoint(
        randomRange(seedHolder, -driftRange, driftRange),
        randomRange(seedHolder, -driftRange, driftRange),
        angle + Math.PI / 2
      );
      let x = anchor.x + travel.x * ahead + Math.cos(angle) * dist + drift.x;
      let y = anchor.y + travel.y * ahead + Math.sin(angle) * dist + drift.y;
      if (localFill) {
        const localDx = x - anchor.x;
        const localDy = y - anchor.y;
        const localDistance = Math.hypot(localDx, localDy);
        const maxLocalDistance = Math.max(120, localFillRadius * 0.96);
        if (localDistance > maxLocalDistance) {
          const scale = (maxLocalDistance * randomRange(seedHolder, 0.9, 0.99)) / localDistance;
          x = anchor.x + localDx * scale;
          y = anchor.y + localDy * scale;
        }
      }
      const nearest = nearestPlayerDistance(x, y, players);
      const density = ambientDensityAt(world, x, y);
      const patchAffinity = particlePatchAffinityAt(x, y);
      const voidAffinity = particleVoidAffinityAt(x, y) * (1 - patchAffinity * 0.55);
      const minAnchorDistance = bowWave ? Math.max(70, bodyRadius + 52) : AMBIENT_PARTICLE_MIN_PLAYER_DISTANCE;
      const tooCloseToPlayer = Math.max(0, minAnchorDistance - nearest);
      const patchWeight = localFill ? 0.24 : 1;
      const preferredSpacing = AMBIENT_PARTICLE_PREFERRED_SPACING * (1 - patchAffinity * 0.16 + voidAffinity * 0.55);
      const spacingPenalty = Math.max(0, preferredSpacing - density.nearest);
      const score =
        nearest * (bowWave ? 0.015 : 0.16) +
        density.nearest * (1.08 - patchAffinity * 0.2 + voidAffinity * 0.22) +
        patchAffinity * 860 * patchWeight -
        voidAffinity * 560 * (localFill ? 0.48 : 1) -
        density.crowdCount * (135 - patchAffinity * 45 + voidAffinity * 72) -
        (1 - patchAffinity) * 105 * patchWeight -
        tooCloseToPlayer * (bowWave ? 3.8 : 7.5) -
        spacingPenalty * (3.2 - patchAffinity * 1.25 + voidAffinity * 1.2);
      if (!best || score > best.score) {
        best = { x, y, angle, score, patchAffinity, voidAffinity, densityNearest: density.nearest, crowdCount: density.crowdCount, bowWave, localFill };
      }
    }
    return best || {
      x: anchor.x,
      y: anchor.y,
      angle: randomRange(seedHolder, 0, Math.PI * 2),
      patchAffinity: particlePatchAffinityAt(anchor.x, anchor.y),
      voidAffinity: particleVoidAffinityAt(anchor.x, anchor.y),
      densityNearest: 480,
      crowdCount: 0,
      score: 0,
      bowWave,
      localFill
    };
  }

  function ambientMassDetail(spawnPoint, roll, salt) {
    const x = finiteOr(spawnPoint && spawnPoint.x, 0);
    const y = finiteOr(spawnPoint && spawnPoint.y, 0);
    const wave = Math.sin(x * 0.017 + y * 0.023 + roll * 977.3 + salt * 43.7) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function randomAmbientParticleMass(seedHolder, spawnPoint) {
    const patchAffinity = clamp(finiteOr(spawnPoint && spawnPoint.patchAffinity, 0), 0, 1);
    const voidAffinity = clamp(finiteOr(spawnPoint && spawnPoint.voidAffinity, 0), 0, 1);
    const richness = clamp(patchAffinity - voidAffinity * 0.55, 0, 1);
    const spacingRoom = clamp((finiteOr(spawnPoint && spawnPoint.densityNearest, 260) - 185) / 260, 0.12, 1);
    const crowdRoom = clamp(1 - finiteOr(spawnPoint && spawnPoint.crowdCount, 0) * 0.12, 0.38, 1);
    const resourceRoom = spacingRoom * crowdRoom;
    const roll = nextRandom(seedHolder);
    const detail = ambientMassDetail(spawnPoint, roll, 1);
    const rockChanceScale = spawnPoint && spawnPoint.bowWave ? 0.12 : spawnPoint && spawnPoint.localFill ? 0.35 : 1;
    const rockChance = Math.max(0, (richness - 0.28) / 0.72) * (0.04 + richness * 0.065) * resourceRoom * rockChanceScale;

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

  function randomBowWaveParticleColor(seedHolder) {
    return hslToRgb(
      randomRange(seedHolder, 24, 56),
      randomRange(seedHolder, 0.84, 0.98),
      randomRange(seedHolder, 0.56, 0.72)
    );
  }

  function createAmbientParticle(world, anchor, players, seedHolder, options) {
    const recycled = options && options.recycledBody;
    const spawnPoint = chooseAmbientParticleSpawnPoint(world, anchor, players, seedHolder, options);
    const bowWave = Boolean(spawnPoint.bowWave);
    const mass = randomAmbientParticleMass(seedHolder, spawnPoint);
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const speed = randomRange(seedHolder, 5, 36);
    const particleId = recycled ? recycled.id : world.nextParticleId++;
    const textureSeed = randomRange(seedHolder, 0, 1000);
    const bowStrength = bowWave
      ? clamp(Object.prototype.hasOwnProperty.call(anchor, "ambientAnchorWeight") ? finiteOr(anchor.ambientAnchorWeight, 0) : 1, 0.02, 1)
      : 0;
    const inheritScale = bowWave ? 0.01 + bowStrength * 0.018 : 0.08;
    const inwardSpeed = bowWave ? randomRange(seedHolder, 14 + bowStrength * 18, 36 + bowStrength * 48) : randomRange(seedHolder, 6, 26);
    const particle = normalizeParticle(
      {
        id: particleId,
        x: spawnPoint.x,
        y: spawnPoint.y,
        vx: Math.cos(angle) * speed + finiteOr(anchor.vx, 0) * inheritScale - Math.cos(spawnPoint.angle) * inwardSpeed,
        vy: Math.sin(angle) * speed + finiteOr(anchor.vy, 0) * inheritScale - Math.sin(spawnPoint.angle) * inwardSpeed,
        mass,
        color: bowWave ? randomBowWaveParticleColor(seedHolder) : randomParticleColor(seedHolder),
        textureSeed,
        wobble: randomRange(seedHolder, 0, Math.PI * 2),
        pulse: randomRange(seedHolder, 0.8, 1.25),
        spawnAge: 0,
        spawnSizeScale: ambientSpawnSizeScale(particleId, textureSeed)
      },
      particleId,
      seedHolder
    );
    particle.ambientSpawnRock = particle.tier && particle.tier.name === "rock";
    if (recycled) {
      Object.keys(recycled).forEach((key) => {
        delete recycled[key];
      });
      Object.assign(recycled, particle);
      return recycled;
    }
    return particle;
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
