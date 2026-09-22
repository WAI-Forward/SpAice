  let nearbyBodyIndex = null;
  function invalidateNearbyBodyIndex() {
    nearbyBodyIndex = null;
  }

  function bodiesNearWorldCircle(x, y, radius) {
    if (!nearbyBodyIndex || nearbyBodyIndex.count !== particles.length) {
      const cellSize = 1024;
      const cells = new Map();
      let maxRadius = 0;
      for (const body of particles) {
        if (!body) continue;
        const key = Math.floor(body.x / cellSize) + ":" + Math.floor(body.y / cellSize);
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(body);
        maxRadius = Math.max(maxRadius, finiteOr(body.radius, 0));
      }
      nearbyBodyIndex = { cells, cellSize, maxRadius, count: particles.length };
    }
    const index = nearbyBodyIndex;
    const reach = Math.max(0, radius) + index.maxRadius;
    const minX = Math.floor((x - reach) / index.cellSize);
    const maxX = Math.floor((x + reach) / index.cellSize);
    const minY = Math.floor((y - reach) / index.cellSize);
    const maxY = Math.floor((y + reach) / index.cellSize);
    const result = [];
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      for (let cellY = minY; cellY <= maxY; cellY += 1) {
        const bucket = index.cells.get(cellX + ":" + cellY);
        if (bucket) result.push(...bucket);
      }
    }
    return result;
  }

  function nearestPartyAnchorDistance(x, y, anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activePartyPlayerAnchors();
    let nearest = Infinity;
    for (const anchor of source) {
      const distance = Math.hypot(x - anchor.x, y - anchor.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function mobCollectionByKind(kind) {
    if (kind === "ufo") {
      return ufos;
    }
    if (kind === "rambot") {
      return rambots;
    }
    if (kind === "engineer") {
      return engineers;
    }
    if (kind === "tesla") {
      return teslas;
    }
    if (kind === "satellite" || kind === "rocket") {
      return rockets;
    }
    if (kind === "fighter") {
      return fighters;
    }
    return rivals;
  }

  function liveMobCount(kind) {
    let count = 0;
    for (const mob of mobCollectionByKind(kind)) {
      if (mob && mob.health > 0 && (kind !== "satellite" && kind !== "rocket" || mob.kind === kind)) {
        count += 1;
      }
    }
    return count;
  }

  function totalLiveMobCount() {
    let count = 0;
    for (const mob of liveMobsForSpawnPlacement()) {
      if (mob && mob.health > 0) {
        count += 1;
      }
    }
    return count;
  }

  function manageableMobRestThreshold(anchors) {
    const playerCount = Math.min(crazyGamesRoomMaxPlayers, Array.isArray(anchors) && anchors.length ? anchors.length : 1);
    return Math.max(1, Math.ceil(mobSpawnRestManageableMobsPerPlayer * playerCount));
  }

  let liveMobSpawnCache = null;

  function liveMobsForSpawnPlacement() {
    const now = performance.now();
    const collectionSize = rivals.length + ufos.length + rambots.length + engineers.length + teslas.length + rockets.length + fighters.length;
    if (
      liveMobSpawnCache &&
      liveMobSpawnCache.time === now &&
      liveMobSpawnCache.collectionSize === collectionSize
    ) {
      return liveMobSpawnCache.mobs;
    }

    const mobs = [];
    for (const collection of [rivals, ufos, rambots, engineers, teslas, rockets, fighters]) {
      for (const mob of collection) {
        if (mob && mob.health > 0) {
          mobs.push(mob);
        }
      }
    }
    liveMobSpawnCache = {
      time: now,
      collectionSize,
      mobs
    };
    return mobs;
  }

  const fastParticleBodyAnchorBaseMass = 150;
  const fastParticleBodyAnchorFullMass = thresholdForTierName("planet");
  const fastParticleBodyAnchorBaseSpeed = 1200;
  const fastParticleBodyAnchorMinSpeedFloor = 1000;
  const fastParticleBodyAnchorFullSpeedWindow = 500;
  const fastParticleBodyAnchorMaxCount = 5;
  const solidBodyBackgroundDamping = 0.992;

  function particleAnchorWeight(anchor) {
    if (anchor && Object.prototype.hasOwnProperty.call(anchor, "particleAnchorWeight")) {
      return clamp(finiteOr(anchor.particleAnchorWeight, 0), 0.02, 1);
    }
    return 1;
  }

  function fastBodyParticleAnchorWeight(body) {
    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    if (mass < fastParticleBodyAnchorBaseMass) {
      return 0;
    }
    const speed = Math.hypot(finiteOr(body && body.vx, 0), finiteOr(body && body.vy, 0));
    const minSpeed = clamp(
      fastParticleBodyAnchorBaseSpeed - Math.log2(Math.max(1, mass / fastParticleBodyAnchorBaseMass)) * 50,
      fastParticleBodyAnchorMinSpeedFloor,
      fastParticleBodyAnchorBaseSpeed
    );
    if (speed < minSpeed) {
      return 0;
    }
    return clamp(
      (speed - minSpeed) / fastParticleBodyAnchorFullSpeedWindow,
      0,
      1
    );
  }

  function fastBodyParticleWaveYieldScale(body, speedWeight) {
    const mass = Math.max(fastParticleBodyAnchorBaseMass, finiteOr(body && body.mass, fastParticleBodyAnchorBaseMass));
    const massProgress = clamp(Math.log2(mass / fastParticleBodyAnchorBaseMass) / Math.log2(fastParticleBodyAnchorFullMass / fastParticleBodyAnchorBaseMass), 0, 1);
    return 0.38 + (0.12 + 0.06 * massProgress) * speedWeight;
  }

  function isFastParticleBodyAnchor(body) {
    return Boolean(
      body &&
      body.tier &&
      body.tier.solid &&
      !body.randomEventId &&
      !isUfoBeamCargo(body) &&
      fastBodyParticleAnchorWeight(body) > 0
    );
  }

  function applySolidBodyBackgroundDamping(body, dt, playerAnchors) {
    if (!body || !body.tier || !body.tier.solid || body.gadgetStabilized) {
      return;
    }
    const speed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
    const fastTravel = clamp((speed - 300) / 700, 0, 1);
    const anchors = fastTravel > 0 ? Array.isArray(playerAnchors) ? playerAnchors : activePartyPlayerAnchors() : [];
    const distance = fastTravel > 0 ? anchors.length ? nearestPartyAnchorDistance(body.x, body.y, anchors) : Infinity : 0;
    const emptySpace = clamp((distance - particleDensityRadius()) / particlePlayfieldRadius(), 0, 1);
    const damping = Math.pow(solidBodyBackgroundDamping, dt) * Math.exp(-0.1 * fastTravel * emptySpace * dt);
    body.vx *= damping;
    body.vy *= damping;
    if (speed * damping < 0.08) {
      body.vx = 0;
      body.vy = 0;
    }
  }

  function randomBowWaveParticleColor() {
    return hslToRgb(randomRange(24, 56), randomRange(0.84, 0.98), randomRange(0.56, 0.72));
  }

  function activeFastBodyParticleAnchors(playerAnchors) {
    const candidates = [];
    for (const body of particles) {
      if (!isFastParticleBodyAnchor(body)) {
        continue;
      }
      const speed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
      const weight = fastBodyParticleAnchorWeight(body);
      candidates.push({ body, speed, weight });
    }

    candidates.sort(function (a, b) {
      return b.weight - a.weight || b.speed - a.speed || b.body.mass - a.body.mass;
    });

    const anchors = [];
    const sourcePlayerAnchors = Array.isArray(playerAnchors) && playerAnchors.length ? playerAnchors : activePartyPlayerAnchors();
    const visibleRadius = particlePlayfieldRadius();
    for (const candidate of candidates) {
      const body = candidate.body;
      if (nearestPartyAnchorDistance(body.x, body.y, sourcePlayerAnchors) > visibleRadius) {
        continue;
      }
      const weight = candidate.weight;
      if (weight < 0.12) {
        continue;
      }
      const waveYieldScale = fastBodyParticleWaveYieldScale(body, weight);
      anchors.push({
        x: body.x,
        y: body.y,
        vx: finiteOr(body.vx, 0),
        vy: finiteOr(body.vy, 0),
        radius: Math.max(0, finiteOr(body.radius, 0)),
        bodyId: body.id,
        particleAnchorWeight: weight,
        particleAnchorTargetScale: (0.08 + weight * 0.72) * waveYieldScale,
        particleAnchorWaveYieldScale: waveYieldScale,
        particleAnchorType: "fast-body",
        particleAnchorBowWave: true
      });
      if (anchors.length >= fastParticleBodyAnchorMaxCount) {
        break;
      }
    }
    return anchors;
  }

  function activeParticleSpawnAnchors() {
    const players = activePartyPlayerAnchors();
    const waves = activeFastBodyParticleAnchors(players);
    if (!waves.length) {
      return players;
    }
    const ambientPlayers = players.map(function (anchor) {
      const influence = waves.reduce(function (strongest, wave) {
        const distance = Math.hypot(anchor.x - wave.x, anchor.y - wave.y);
        return Math.max(strongest, particleAnchorWeight(wave) * clamp(1 - distance / particlePlayfieldRadius(), 0, 1));
      }, 0);
      const ambientScale = 1 - influence * 0.75;
      return Object.assign({}, anchor, { particleAnchorWeight: ambientScale, particleAnchorTargetScale: ambientScale });
    });
    return ambientPlayers.concat(waves);
  }

  function effectiveParticleAnchorCount(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeParticleSpawnAnchors();
    const clusterRadius = particleDensityRadius() * 0.72;
    const clusters = [];

    for (const anchor of source) {
      const weight = particleAnchorWeight(anchor);
      let cluster = null;
      for (const candidate of clusters) {
        if (Math.hypot(anchor.x - candidate.x, anchor.y - candidate.y) <= clusterRadius) {
          cluster = candidate;
          break;
        }
      }

      if (!cluster) {
        clusters.push({ x: anchor.x, y: anchor.y, count: weight });
        continue;
      }

      cluster.x = (cluster.x * cluster.count + anchor.x * weight) / (cluster.count + weight);
      cluster.y = (cluster.y * cluster.count + anchor.y * weight) / (cluster.count + weight);
      cluster.count += weight;
    }

    return clusters.reduce(function (total, cluster) {
      return total + Math.min(1, cluster.count) + Math.max(0, cluster.count - 1) * 0.28;
    }, 0) || 1;
  }

  function activeParticleTargetCount(anchorCount) {
    const count = Array.isArray(anchorCount)
      ? effectiveParticleAnchorCount(anchorCount)
      : Math.max(1, finiteOr(anchorCount, 1));
    if (!isPartySessionActive()) {
      return Math.round(targetParticles * (1 + Math.max(0, count - 1) * 0.48));
    }
    if (isPartySessionActive() && !isPartyHost()) {
      return targetParticles;
    }
    return Math.round(targetParticles * (0.92 + Math.max(0, count - 1) * 0.48));
  }

  function particleDensityRadius() {
    return 1040;
  }

  function particlePlayfieldRadius() {
    return 1720;
  }

  function useParticlePlayfieldFill() {
    return isPartySessionActive() || multiplayer.remoteUniverses.size > 0;
  }

  function isAmbientDensityParticle(particle) {
    return Boolean(
      particle &&
      particle.tier &&
      particle.tier.name === "particle" &&
      !particle.randomEventId &&
      !particle.survivalCampBody &&
      finiteOr(particle.ufoSapTimer, 0) <= 0 &&
      !isUfoBeamCargo(particle)
    );
  }

  function isRecyclableAmbientMatter(particle) {
    return Boolean(
      particle &&
      particle.tier &&
      !particle.randomEventId &&
      !particle.survivalCampBody &&
      finiteOr(particle.ufoSapTimer, 0) <= 0 &&
      !isUfoBeamCargo(particle) &&
      (particle.tier.name === "particle" || Boolean(particle.ambientSpawnRock))
    );
  }

  function countAmbientParticles() {
    let count = 0;
    for (const particle of particles) {
      if (isAmbientDensityParticle(particle)) {
        count += 1;
      }
    }
    return count;
  }

  let ambientDensityCache = null;

  function ambientDensityCellKey(cellX, cellY) {
    return cellX + ":" + cellY;
  }

  function ambientDensityGrid() {
    const cellSize = 480;
    const now = performance.now();
    if (
      ambientDensityCache &&
      ambientDensityCache.time === now &&
      ambientDensityCache.particleCount === particles.length
    ) {
      return ambientDensityCache;
    }

    const cells = new Map();
    for (const particle of particles) {
      if (!isAmbientDensityParticle(particle)) {
        continue;
      }
      const cellX = Math.floor(particle.x / cellSize);
      const cellY = Math.floor(particle.y / cellSize);
      const key = ambientDensityCellKey(cellX, cellY);
      if (!cells.has(key)) {
        cells.set(key, []);
      }
      cells.get(key).push(particle);
    }

    ambientDensityCache = {
      time: now,
      particleCount: particles.length,
      cellSize,
      cells
    };
    return ambientDensityCache;
  }

  function forAmbientParticlesNear(x, y, radius, callback) {
    const grid = ambientDensityGrid();
    const cellSize = grid.cellSize;
    const minX = Math.floor((x - radius) / cellSize);
    const maxX = Math.floor((x + radius) / cellSize);
    const minY = Math.floor((y - radius) / cellSize);
    const maxY = Math.floor((y + radius) / cellSize);
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      for (let cellY = minY; cellY <= maxY; cellY += 1) {
        const bucket = grid.cells.get(ambientDensityCellKey(cellX, cellY));
        if (!bucket) {
          continue;
        }
        for (const particle of bucket) {
          callback(particle);
        }
      }
    }
  }

  function countAmbientParticlesNearAnchor(anchor, radius) {
    const radiusSq = radius * radius;
    const bowWave = Boolean(anchor && anchor.particleAnchorBowWave);
    const speed = Math.hypot(finiteOr(anchor && anchor.vx, 0), finiteOr(anchor && anchor.vy, 0));
    const travel = bowWave && speed > 0.001 ? normalize(anchor.vx, anchor.vy) : { x: 0, y: 0 };
    const anchorRadius = Math.max(0, finiteOr(anchor && anchor.radius, 0));
    const bowLateralLimit = Math.max(150, anchorRadius + 170);
    let count = 0;
    forAmbientParticlesNear(anchor.x, anchor.y, radius, function (particle) {
      const dx = particle.x - anchor.x;
      const dy = particle.y - anchor.y;
      if (dx * dx + dy * dy <= radiusSq) {
        if (bowWave) {
          const forward = dx * travel.x + dy * travel.y;
          const lateral = Math.abs(dx * -travel.y + dy * travel.x);
          if (forward < -anchorRadius * 0.35 || lateral > bowLateralLimit) {
            return;
          }
        }
        count += 1;
      }
    });
    return count;
  }

  function localParticleTargetPerAnchor(anchorCount) {
    if (!useParticlePlayfieldFill()) {
      return 24;
    }
    return isPartyHost() ? 24 : 36;
  }

  function mostUnderdenseParticleAnchor(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeParticleSpawnAnchors();
    const densityRadius = useParticlePlayfieldFill() ? particlePlayfieldRadius() : particleDensityRadius();
    const localTarget = localParticleTargetPerAnchor(effectiveParticleAnchorCount(source));
    let best = null;

    for (const anchor of source) {
      const localCount = countAmbientParticlesNearAnchor(anchor, densityRadius);
      const speed = Math.hypot(finiteOr(anchor.vx, 0), finiteOr(anchor.vy, 0));
      const bowWave = Boolean(anchor.particleAnchorBowWave);
      const anchorTargetScale = clamp(finiteOr(anchor.particleAnchorTargetScale, particleAnchorWeight(anchor)), 0.02, 1.1);
      const anchorLocalTarget = Math.max(bowWave ? 1 : 6, Math.round(localTarget * anchorTargetScale));
      const deficit = anchorLocalTarget - localCount;
      const score = deficit + clamp(speed / 480, 0, 1.15) * (bowWave ? particleAnchorWeight(anchor) : 1) + particleAnchorWeight(anchor) * 0.35;
      if (!best || score > best.score) {
        best = { anchor, localCount, localTarget: anchorLocalTarget, score };
      }
    }

    return best || { anchor: source[0] || player, localCount: 0, localTarget, score: 0 };
  }

  function ambientParticleDensityAt(x, y) {
    const crowdRadius = 480;
    const crowdRadiusSq = crowdRadius * crowdRadius;
    let nearest = Infinity;
    let crowdCount = 0;
    forAmbientParticlesNear(x, y, crowdRadius, function (particle) {
      const dx = x - particle.x;
      const dy = y - particle.y;
      const distanceSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSq);
      if (distance < nearest) {
        nearest = distance;
      }
      if (distanceSq <= crowdRadiusSq) {
        crowdCount += 1;
      }
    });
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

  function chooseParticleSpawnPoint(anchor, options) {
    const localFill = Boolean(options && options.localFill);
    const playfieldFill = Boolean(options && options.playfieldFill);
    const anchors = options && Array.isArray(options.anchors) && options.anchors.length
      ? options.anchors
      : activeParticleSpawnAnchors();
    const source = anchor || randomParticleSpawnAnchor(anchors);
    const minPlayerDistance = 760;
    const maxPlayerDistance = 1760;
    const preferredParticleSpacing = 230;
    const localFillRadius = particlePlayfieldRadius();
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const moving = speed > 45;
    const travel = moving ? normalize(source.vx, source.vy) : { x: 0, y: 0 };
    const bowWave = Boolean(source.particleAnchorBowWave && moving);
    const bowStrength = bowWave ? particleAnchorWeight(source) : 0;
    const bodyRadius = Math.max(0, finiteOr(source.radius, 0));
    let best = null;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const bowRoll = Math.random();
      const wakeBias = bowWave && bowRoll < 0.26 + bowStrength * 0.1;
      const noseBias = bowWave && !wakeBias && bowRoll > 0.9 - bowStrength * 0.22;
      const bowSpread = randomRange(0.18, 1.22 - bowStrength * 0.32);
      const bowSide = Math.random() < 0.5 ? -1 : 1;
      const aheadBias = moving && Math.random() < (bowWave ? 0.48 + bowStrength * 0.32 : 0.58);
      const angle = bowWave
        ? Math.atan2(travel.y, travel.x) + (wakeBias ? Math.PI + randomRange(-0.72, 0.72) : noseBias ? randomRange(-0.22, 0.22) : bowSide * bowSpread)
        : aheadBias
          ? Math.atan2(travel.y, travel.x) + randomRange(-1.05, 1.05)
          : randomRange(0, Math.PI * 2);
      const baseMinDist = bowWave
        ? Math.max(bodyRadius + 46, 122)
        : minPlayerDistance * randomRange(1, 1.12);
      const minDist = bowWave
        ? baseMinDist
        : localFill
        ? Math.min(baseMinDist, Math.max(120, particleDensityRadius() * 0.74))
        : baseMinDist;
      const broadMaxDist = bowWave
        ? Math.min(Math.max(minDist + 100, bodyRadius + 210 + speed * (0.03 + bowStrength * 0.045)), 520)
        : maxPlayerDistance + clamp(speed * 0.82, 0, 620);
      const maxDist = bowWave
        ? broadMaxDist
        : localFill ? Math.max(minDist + 60, Math.min(broadMaxDist, localFillRadius * 0.92)) : broadMaxDist;
      const dist = randomRange(minDist, maxDist);
      const ahead = bowWave
        ? wakeBias
          ? -randomRange(bodyRadius * 0.25, bodyRadius * (0.95 + bowStrength * 0.7) + speed * 0.1)
          : clamp(speed * randomRange(0.005, 0.05 + bowStrength * 0.05), 0, 96)
        : moving ? clamp(speed * randomRange(0.18, 1.2), 0, 820) : 0;
      const driftRange = bowWave ? Math.max(12, Math.min(58, bodyRadius * (0.09 + bowStrength * 0.08))) : localFill ? 110 : 220;
      const drift = rotatePoint(randomRange(-driftRange, driftRange), randomRange(-driftRange, driftRange), angle + Math.PI / 2);
      let x = source.x + travel.x * ahead + Math.cos(angle) * dist + drift.x;
      let y = source.y + travel.y * ahead + Math.sin(angle) * dist + drift.y;
      if (localFill) {
        const localDx = x - source.x;
        const localDy = y - source.y;
        const localDistance = Math.hypot(localDx, localDy);
        const maxLocalDistance = Math.max(120, localFillRadius * 0.96);
        if (localDistance > maxLocalDistance) {
          const scale = (maxLocalDistance * randomRange(0.9, 0.99)) / localDistance;
          x = source.x + localDx * scale;
          y = source.y + localDy * scale;
        }
      }
      const nearestPlayer = nearestPartyAnchorDistance(x, y, anchors);
      const density = ambientParticleDensityAt(x, y);
      const patchAffinity = particlePatchAffinityAt(x, y);
      const voidAffinity = particleVoidAffinityAt(x, y) * (1 - patchAffinity * 0.55);
      const minAnchorDistance = bowWave ? Math.max(70, bodyRadius + 52) : minPlayerDistance;
      const tooCloseToPlayer = Math.max(0, minAnchorDistance - nearestPlayer);
      const patchWeight = localFill ? 0.24 : 1;
      const preferredSpacing = preferredParticleSpacing * (1 - patchAffinity * 0.16 + voidAffinity * 0.55);
      const spacingPenalty = Math.max(0, preferredSpacing - density.nearest);
      const score =
        nearestPlayer * (bowWave ? 0.015 : 0.16) +
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
      x: source.x,
      y: source.y,
      angle: randomRange(0, Math.PI * 2),
      score: 0,
      patchAffinity: particlePatchAffinityAt(source.x, source.y),
      voidAffinity: particleVoidAffinityAt(source.x, source.y),
      densityNearest: 480,
      crowdCount: 0,
      bowWave,
      localFill
    };
  }

  function spawnParticleNearPlayer(anchor, options) {
    const source = anchor || randomParticleSpawnAnchor(options && options.anchors);
    const spawnPoint = chooseParticleSpawnPoint(source, options);
    const bowWave = Boolean(spawnPoint.bowWave);
    const particle = createParticle(
      spawnPoint.x,
      spawnPoint.y,
      randomAmbientParticleMass(spawnPoint),
      bowWave ? randomBowWaveParticleColor() : randomParticleColor()
    );
    particle.ambientSpawnRock = particle.tier && particle.tier.name === "rock";
    const bowStrength = bowWave ? particleAnchorWeight(source) : 0;
    const inheritScale = bowWave ? 0.01 + bowStrength * 0.018 : 0.08;
    const inwardSpeed = bowWave ? randomRange(14 + bowStrength * 18, 36 + bowStrength * 48) : randomRange(6, 26);
    particle.vx += finiteOr(source.vx, 0) * inheritScale - Math.cos(spawnPoint.angle) * inwardSpeed;
    particle.vy += finiteOr(source.vy, 0) * inheritScale - Math.sin(spawnPoint.angle) * inwardSpeed;
    particles.push(particle);
  }

  function recycleParticleNearPlayer(particle, anchor, options) {
    if (!particle) {
      return false;
    }
    const id = particle.id;
    const source = anchor || randomParticleSpawnAnchor(options && options.anchors);
    const spawnPoint = chooseParticleSpawnPoint(source, options);
    const bowWave = Boolean(spawnPoint.bowWave);
    const replacement = createParticle(
      spawnPoint.x,
      spawnPoint.y,
      randomAmbientParticleMass(spawnPoint),
      bowWave ? randomBowWaveParticleColor() : randomParticleColor()
    );
    replacement.id = id;
    replacement.ambientSpawnRock = replacement.tier && replacement.tier.name === "rock";
    replacement.spawnSizeScale = ambientSpawnSizeScale(replacement.id, replacement.textureSeed);
    const bowStrength = bowWave ? particleAnchorWeight(source) : 0;
    const inheritScale = bowWave ? 0.01 + bowStrength * 0.018 : 0.08;
    const inwardSpeed = bowWave ? randomRange(14 + bowStrength * 18, 36 + bowStrength * 48) : randomRange(6, 26);
    replacement.vx += finiteOr(source.vx, 0) * inheritScale - Math.cos(spawnPoint.angle) * inwardSpeed;
    replacement.vy += finiteOr(source.vy, 0) * inheritScale - Math.sin(spawnPoint.angle) * inwardSpeed;
    Object.keys(particle).forEach(function (key) {
      delete particle[key];
    });
    Object.assign(particle, replacement);
    return true;
  }

  function randomPartySpawnAnchor() {
    const anchors = activePartyPlayerAnchors();
    return anchors[Math.floor(Math.random() * anchors.length)] || anchors[0] || player;
  }

  function randomParticleSpawnAnchor(anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeParticleSpawnAnchors();
    const totalWeight = source.reduce(function (total, anchor) {
      return total + particleAnchorWeight(anchor);
    }, 0);
    let roll = Math.random() * Math.max(0.001, totalWeight);
    for (const anchor of source) {
      roll -= particleAnchorWeight(anchor);
      if (roll <= 0) {
        return anchor;
      }
    }
    return source[Math.floor(Math.random() * source.length)] || source[0] || player;
  }
