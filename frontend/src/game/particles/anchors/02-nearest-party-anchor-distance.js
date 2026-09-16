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

  const fastParticleBodyAnchorMinSpeed = 180;
  const fastParticleBodyAnchorFullSpeed = 720;
  const fastParticleBodyAnchorMaxCount = 5;

  function particleAnchorWeight(anchor) {
    return clamp(finiteOr(anchor && anchor.particleAnchorWeight, 1), 0.18, 1);
  }

  function fastBodyParticleAnchorWeight(body) {
    const speed = Math.hypot(finiteOr(body && body.vx, 0), finiteOr(body && body.vy, 0));
    if (speed < fastParticleBodyAnchorMinSpeed) {
      return 0;
    }
    return clamp(
      (speed - fastParticleBodyAnchorMinSpeed) / (fastParticleBodyAnchorFullSpeed - fastParticleBodyAnchorMinSpeed),
      0.18,
      1
    );
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
    const nearPlayerRadius = particleDensityRadius() * 0.5;
    for (const candidate of candidates) {
      const body = candidate.body;
      const nearPlayer = nearestPartyAnchorDistance(body.x, body.y, sourcePlayerAnchors) <= nearPlayerRadius;
      const weight = nearPlayer ? candidate.weight * 0.42 : candidate.weight;
      if (weight < 0.12) {
        continue;
      }
      anchors.push({
        x: body.x,
        y: body.y,
        vx: finiteOr(body.vx, 0),
        vy: finiteOr(body.vy, 0),
        bodyId: body.id,
        particleAnchorWeight: weight,
        particleAnchorTargetScale: 0.38 + weight * 0.72,
        particleAnchorType: "fast-body"
      });
      if (anchors.length >= fastParticleBodyAnchorMaxCount) {
        break;
      }
    }
    return anchors;
  }

  function activeParticleSpawnAnchors() {
    const anchors = activePartyPlayerAnchors();
    return anchors.concat(activeFastBodyParticleAnchors(anchors));
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
    return Boolean(particle && particle.tier && !particle.randomEventId && !particle.tier.solid && !isUfoBeamCargo(particle));
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
    let count = 0;
    forAmbientParticlesNear(anchor.x, anchor.y, radius, function (particle) {
      const dx = particle.x - anchor.x;
      const dy = particle.y - anchor.y;
      if (dx * dx + dy * dy <= radiusSq) {
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
      const anchorTargetScale = clamp(finiteOr(anchor.particleAnchorTargetScale, particleAnchorWeight(anchor)), 0.18, 1.1);
      const anchorLocalTarget = Math.max(6, Math.round(localTarget * anchorTargetScale));
      const deficit = anchorLocalTarget - localCount;
      const score = deficit + clamp(speed / 480, 0, 1.15) + particleAnchorWeight(anchor) * 0.35;
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
    let best = null;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const aheadBias = moving && Math.random() < 0.58;
      const angle = aheadBias
        ? Math.atan2(travel.y, travel.x) + randomRange(-1.05, 1.05)
        : randomRange(0, Math.PI * 2);
      const baseMinDist = minPlayerDistance * randomRange(1, 1.12);
      const minDist = localFill
        ? Math.min(baseMinDist, Math.max(120, particleDensityRadius() * 0.74))
        : baseMinDist;
      const broadMaxDist = maxPlayerDistance + clamp(speed * 0.82, 0, 620);
      const maxDist = localFill ? Math.max(minDist + 60, Math.min(broadMaxDist, localFillRadius * 0.92)) : broadMaxDist;
      const dist = randomRange(minDist, maxDist);
      const ahead = moving ? clamp(speed * randomRange(0.18, 1.2), 0, 820) : 0;
      const driftRange = localFill ? 110 : 220;
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
      const tooCloseToPlayer = Math.max(0, minPlayerDistance - nearestPlayer);
      const patchWeight = localFill ? 0.24 : 1;
      const preferredSpacing = preferredParticleSpacing * (1 - patchAffinity * 0.16 + voidAffinity * 0.55);
      const spacingPenalty = Math.max(0, preferredSpacing - density.nearest);
      const score =
        nearestPlayer * 0.16 +
        density.nearest * (1.08 - patchAffinity * 0.2 + voidAffinity * 0.22) +
        patchAffinity * 860 * patchWeight -
        voidAffinity * 560 * (localFill ? 0.48 : 1) -
        density.crowdCount * (135 - patchAffinity * 45 + voidAffinity * 72) -
        (1 - patchAffinity) * 105 * patchWeight -
        tooCloseToPlayer * 7.5 -
        spacingPenalty * (3.2 - patchAffinity * 1.25 + voidAffinity * 1.2);
      if (!best || score > best.score) {
        best = { x, y, angle, score, patchAffinity, voidAffinity, densityNearest: density.nearest, crowdCount: density.crowdCount };
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
      crowdCount: 0
    };
  }

  function spawnParticleNearPlayer(anchor, options) {
    const source = anchor || randomParticleSpawnAnchor(options && options.anchors);
    const spawnPoint = chooseParticleSpawnPoint(source, options);
    const particle = createParticle(
      spawnPoint.x,
      spawnPoint.y,
      randomAmbientParticleMass(spawnPoint),
      randomParticleColor()
    );
    particle.ambientSpawnRock = particle.tier && particle.tier.name === "rock";
    particle.vx += finiteOr(source.vx, 0) * 0.08 - Math.cos(spawnPoint.angle) * randomRange(6, 26);
    particle.vy += finiteOr(source.vy, 0) * 0.08 - Math.sin(spawnPoint.angle) * randomRange(6, 26);
    particles.push(particle);
  }

  function recycleParticleNearPlayer(particle, anchor, options) {
    if (!particle) {
      return false;
    }
    const id = particle.id;
    const source = anchor || randomParticleSpawnAnchor(options && options.anchors);
    const spawnPoint = chooseParticleSpawnPoint(source, options);
    const replacement = createParticle(
      spawnPoint.x,
      spawnPoint.y,
      randomAmbientParticleMass(spawnPoint),
      randomParticleColor()
    );
    replacement.id = id;
    replacement.ambientSpawnRock = replacement.tier && replacement.tier.name === "rock";
    replacement.spawnSizeScale = ambientSpawnSizeScale(replacement.id, replacement.textureSeed);
    replacement.vx += finiteOr(source.vx, 0) * 0.08 - Math.cos(spawnPoint.angle) * randomRange(6, 26);
    replacement.vy += finiteOr(source.vy, 0) * 0.08 - Math.sin(spawnPoint.angle) * randomRange(6, 26);
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
