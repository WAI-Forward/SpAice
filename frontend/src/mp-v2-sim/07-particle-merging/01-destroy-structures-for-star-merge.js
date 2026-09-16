  function destroyStructuresForStarMerge(state, keep, absorb) {
    const world = state && state.world;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    const ids = new Set([keep && keep.id, absorb && absorb.id]);
    let destroyed = 0;
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (structure && (ids.has(structure.bodyId) || ids.has(structure.linkedBodyId))) {
        dropStructureTechPickupsForMerge(state, structure);
        structures.splice(i, 1);
        destroyed += 1;
      }
    }
    return destroyed;
  }

  function droppedStructureTechCount(amount) {
    return Math.max(1, Math.floor(Math.max(0, finiteOr(amount, 0)) * 0.75));
  }

  function dropStructureTechPickupsForMerge(state, structure) {
    const world = state && state.world;
    if (!state || !world || !structure) {
      return 0;
    }
    let dropped = 0;
    const recipe = recipeByStructureType(structure.type);
    const x = finiteOr(structure.x, 0);
    const y = finiteOr(structure.y, 0);
    const vx = finiteOr(structure.vx, 0);
    const vy = finiteOr(structure.vy, 0);
    if (recipe && recipe.cost) {
      for (const [techKey, amount] of Object.entries(recipe.cost)) {
        if (!TECH_KEYS.includes(techKey)) {
          continue;
        }
        const count = droppedStructureTechCount(amount);
        for (let i = 0; i < count; i += 1) {
          createTechPickup(state, techKey, x, y, vx, vy);
          dropped += 1;
        }
      }
    }

    const storedTech = cloneTechInventory(structure.tech);
    for (const key of TECH_KEYS) {
      const count = Math.max(0, Math.floor(finiteOr(storedTech[key], 0)));
      for (let i = 0; i < count; i += 1) {
        createTechPickup(state, key, x, y, vx, vy);
        dropped += 1;
      }
    }
    return dropped;
  }

  function ejectPlayerFromStarBirth(player, star) {
    if (!player || !player.landed || !star) {
      return;
    }
    const angle = Math.atan2(finiteOr(player.y, star.y) - star.y, finiteOr(player.x, star.x) - star.x);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    player.x = star.x + nx * (star.radius * 1.06 + finiteOr(player.radius, PLAYER_RADIUS) + 36);
    player.y = star.y + ny * (star.radius * 1.06 + finiteOr(player.radius, PLAYER_RADIUS) + 36);
    player.vx = finiteOr(star.vx, 0) + nx * STAR_CONTACT_KNOCKBACK;
    player.vy = finiteOr(star.vy, 0) + ny * STAR_CONTACT_KNOCKBACK;
    player.landed = null;
  }

  function stellarGrowthSourceForMerge(a, b, fallback) {
    if (a && (a.stellarGrowthStarted || normalizedStellarOutcomeName(a.stellarOutcome) || a.tier && a.tier.name === "star")) {
      return a;
    }
    if (b && (b.stellarGrowthStarted || normalizedStellarOutcomeName(b.stellarOutcome) || b.tier && b.tier.name === "star")) {
      return b;
    }
    return fallback || a || b || null;
  }

  function copyStellarGrowthState(target, source) {
    target.stellarGrowthStarted = Boolean(source && source.stellarGrowthStarted);
    target.stellarGrowthRate = Math.max(0, finiteOr(source && source.stellarGrowthRate, 0));
    target.stellarGrowthLastSampleAt = Math.max(0, finiteOr(source && source.stellarGrowthLastSampleAt, 0));
    target.stellarOutcome = normalizedStellarOutcomeName(source && source.stellarOutcome);
  }

  function survivalCampMergeSource(sources) {
    for (const source of sources) {
      if (source && source.survivalCampBody && source.survivalCampId) {
        return source;
      }
    }
    return null;
  }

  function clearSurvivalCampMergeState(body) {
    if (!body) {
      return;
    }
    body.survivalCampId = "";
    body.survivalCampX = finiteOr(body.x, 0);
    body.survivalCampY = finiteOr(body.y, 0);
    body.survivalCampHomeX = Number.NaN;
    body.survivalCampHomeY = Number.NaN;
    body.survivalCampMovedByPlayer = false;
    body.survivalCampBodyMovedWakeSent = false;
    body.survivalCampLastMoverPlayerId = "";
    body.survivalCampBody = false;
  }

  function applySurvivalCampMergeState(merged, sources, options) {
    if (options && options.clearCampState) {
      clearSurvivalCampMergeState(merged);
      return;
    }
    const source = survivalCampMergeSource(sources);
    if (!merged || !source) {
      return;
    }
    merged.survivalCampId = source.survivalCampId;
    merged.survivalCampX = finiteOr(source.survivalCampX, merged.x);
    merged.survivalCampY = finiteOr(source.survivalCampY, merged.y);
    merged.survivalCampHomeX = finiteOr(merged.x, source.survivalCampHomeX);
    merged.survivalCampHomeY = finiteOr(merged.y, source.survivalCampHomeY);
    merged.survivalCampMovedByPlayer = false;
    merged.survivalCampBodyMovedWakeSent = false;
    merged.survivalCampLastMoverPlayerId = "";
    merged.survivalCampBody = true;
  }

  function updateStellarGrowthForMerge(body, previousMass, gainedMass, nowSeconds) {
    if (!body || finiteOr(body.mass, 0) < thresholdForTierName("star")) {
      return;
    }
    const now = Math.max(0, finiteOr(nowSeconds, 0));
    if (previousMass < thresholdForTierName("star")) {
      body.stellarGrowthStarted = true;
      body.stellarGrowthLastSampleAt = now;
      if (finiteOr(body.mass, 0) >= STELLAR_EVOLUTION_END_THRESHOLD) {
        body.stellarGrowthRate = Math.max(finiteOr(body.stellarGrowthRate, 0), Math.max(0, finiteOr(body.mass, 0) - thresholdForTierName("star")));
      }
      return;
    }
    const elapsed = Math.max(1 / 30, now - finiteOr(body.stellarGrowthLastSampleAt, now));
    const instantRate = Math.max(0, finiteOr(gainedMass, 0)) / elapsed;
    const previousRate = Math.max(0, finiteOr(body.stellarGrowthRate, 0));
    const alpha = clamp(elapsed / Math.max(0.001, STELLAR_GROWTH_AVERAGE_WINDOW_SECONDS), 0.08, 0.55);
    body.stellarGrowthRate = previousRate > 0 ? previousRate + (instantRate - previousRate) * alpha : instantRate;
    body.stellarGrowthStarted = true;
    body.stellarGrowthLastSampleAt = now;
  }

  function finalizeStellarOutcomeTier(body) {
    if (!body) {
      return;
    }
    if (finiteOr(body.mass, 0) >= STELLAR_EVOLUTION_END_THRESHOLD) {
      body.stellarOutcome = normalizedStellarOutcomeName(body.stellarOutcome) || stellarOutcomeForGrowthRate(body.stellarGrowthRate);
    }
    body.tier = clone(tierForMassAndStellarOutcome(body.mass, body.stellarOutcome));
    body.radius = radiusFromMassForTier(body.mass, body.tier);
  }

  function playerScoredBodyIds(state, player) {
    const world = state && state.world;
    const bodyIds = new Set();
    if (!world || !player) {
      return bodyIds;
    }

    if (player.landed && bodyById(world, player.landed.bodyId)) {
      bodyIds.add(Math.floor(finiteOr(player.landed.bodyId, 0)));
    }

    const playerId = String(player.id || "");
    for (const structure of world.structures || []) {
      if (!structure || String(structure.ownerPlayerId || "") !== playerId) {
        continue;
      }
      if (structure.bodyId && bodyById(world, structure.bodyId)) {
        bodyIds.add(Math.floor(finiteOr(structure.bodyId, 0)));
      }
      if (structure.linkedBodyId && bodyById(world, structure.linkedBodyId)) {
        bodyIds.add(Math.floor(finiteOr(structure.linkedBodyId, 0)));
      }
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const structure of world.structures || []) {
        if (!structure || !structure.linkedBodyId) {
          continue;
        }
        const firstId = Math.floor(finiteOr(structure.bodyId, 0));
        const secondId = Math.floor(finiteOr(structure.linkedBodyId, 0));
        const firstKnown = bodyIds.has(firstId);
        const secondKnown = bodyIds.has(secondId);
        if (firstKnown && !secondKnown && bodyById(world, secondId)) {
          bodyIds.add(secondId);
          changed = true;
        } else if (secondKnown && !firstKnown && bodyById(world, firstId)) {
          bodyIds.add(firstId);
          changed = true;
        }
      }
    }

    return bodyIds;
  }

  function playerIdForScoredBody(state, body) {
    if (!state || !body) {
      return "";
    }
    for (const player of Object.values(state.players || {})) {
      if (playerScoredBodyIds(state, player).has(body.id)) {
        return String(player.id || "");
      }
    }
    return "";
  }

  function wakeSurvivalCampFromAbsorbedBody(state, absorber, absorbed) {
    const playerId = playerIdForScoredBody(state, absorber);
    if (!absorbed || !absorbed.survivalCampBody || !playerId) {
      return false;
    }
    if (typeof wakeSurvivalCampFromBody === "function") {
      return wakeSurvivalCampFromBody(state, absorbed, playerId);
    }
    return false;
  }

  function bodyAbsorptionTierRank(body) {
    if (!body || !body.tier) {
      return -1;
    }
    const tierName = String(body.tier.name || "");
    const bodyTierIndex = BODY_TIERS.findIndex((candidate) => candidate.name === tierName);
    if (bodyTierIndex >= 0) {
      return bodyTierIndex;
    }
    const stellarIndex = STELLAR_BRANCH_TIERS.findIndex((candidate) => candidate.name === tierName);
    return stellarIndex >= 0 ? BODY_TIERS.length + stellarIndex : -1;
  }

  function canAbsorbBody(absorber, absorbed) {
    const absorberRank = bodyAbsorptionTierRank(absorber);
    const absorbedRank = bodyAbsorptionTierRank(absorbed);
    if (absorberRank < 0 || absorbedRank < 0) {
      return false;
    }
    if (absorberRank === absorbedRank) {
      return absorberRank === 0 && absorbedRank === 0;
    }
    return absorberRank > absorbedRank;
  }

  function absorbingCollisionPair(a, b) {
    const aCanAbsorb = canAbsorbBody(a, b);
    const bCanAbsorb = canAbsorbBody(b, a);
    if (aCanAbsorb && bCanAbsorb) {
      return finiteOr(a.mass, 0) >= finiteOr(b.mass, 0)
        ? { absorber: a, absorbed: b }
        : { absorber: b, absorbed: a };
    }
    if (aCanAbsorb) {
      return { absorber: a, absorbed: b };
    }
    if (bCanAbsorb) {
      return { absorber: b, absorbed: a };
    }
    return null;
  }

  function emitBodyCrashDebris(state, a, b, dx, dy) {
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const relVx = finiteOr(b.vx, 0) - finiteOr(a.vx, 0);
    const relVy = finiteOr(b.vy, 0) - finiteOr(a.vy, 0);
    const impactSpeed = Math.hypot(relVx, relVy);
    if (impactSpeed < 320) {
      return 0;
    }
    const lossCount = clamp(Math.floor((impactSpeed - 260) / 130), 1, 6);
    let emitted = 0;
    emitted += shedCrashParticlesFromBody(state, a, -nx, -ny, lossCount);
    emitted += shedCrashParticlesFromBody(state, b, nx, ny, lossCount);
    return emitted;
  }

  function shedCrashParticlesFromBody(state, body, nx, ny, requestedLoss) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles) || !body || body.tier && body.tier.name === "particle") {
      return 0;
    }
    const availableLoss = Math.max(0, Math.floor(finiteOr(body.mass, 1) - 1));
    const count = Math.min(Math.max(0, Math.floor(finiteOr(requestedLoss, 0))), availableLoss);
    if (count <= 0) {
      return 0;
    }

    const sideX = -ny;
    const sideY = nx;
    const contactRadius = Math.max(8, finiteOr(body.radius, radiusFromMass(body.mass)) + 28);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const color = ejectedParticleColor(body);
    for (let i = 0; i < count; i += 1) {
      const id = world.nextParticleId++;
      const spread = count > 1 ? (i / (count - 1) - 0.5) : 0;
      const burst = randomRange(seedHolder, 70, 170);
      const textureSeed = randomRange(seedHolder, 0, 1000);
      world.particles.push(normalizeParticle({
        id,
        x: finiteOr(body.x, 0) + nx * contactRadius + sideX * spread * 22,
        y: finiteOr(body.y, 0) + ny * contactRadius + sideY * spread * 22,
        vx: finiteOr(body.vx, 0) * 0.35 + nx * burst + sideX * randomRange(seedHolder, -58, 58),
        vy: finiteOr(body.vy, 0) * 0.35 + ny * burst + sideY * randomRange(seedHolder, -58, 58),
        mass: 1,
        color,
        textureSeed,
        wobble: randomRange(seedHolder, 0, Math.PI * 2),
        pulse: randomRange(seedHolder, 0.8, 1.25),
        spawnAge: 0,
        spawnSizeScale: ambientSpawnSizeScale(id, textureSeed),
        ufoSapSourceGraceTimer: 0.45,
        ufoExtractedFromId: body.id
      }, id, seedHolder));
    }
    state.seed = seedHolder.seed >>> 0;
    body.mass = Math.max(1, finiteOr(body.mass, 1) - count);
    body.tier = clone(tierForMassAndStellarOutcome(body.mass, body.stellarOutcome));
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    normalizeBodyEnergy(world, body);
    return count;
  }

  function structureTouchesBody(structure, bodyId) {
    return Boolean(structure && (structure.bodyId === bodyId || structure.linkedBodyId === bodyId));
  }

  function ejectedParticleColor(body) {
    return mixColor(normalizeColor(body && body.color, { r: 110, g: 190, b: 255 }), { r: 255, g: 255, b: 255 }, 4, 1);
  }

  function destroyAbsorbedBodyStructuresForMerge(state, absorbed) {
    const world = state && state.world;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    let destroyed = 0;
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (!structureTouchesBody(structure, absorbed && absorbed.id)) {
        continue;
      }
      dropStructureTechPickupsForMerge(state, structure);
      structures.splice(i, 1);
      destroyed += 1;
    }
    return destroyed;
  }

  function mergeParticlePair(state, a, b, removed) {
    if (!a || !b || removed.has(a.id) || removed.has(b.id)) {
      return false;
    }
    if (
      (finiteOr(a.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(a.ufoExtractedFromId, 0))) === b.id) ||
      (finiteOr(b.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(b.ufoExtractedFromId, 0))) === a.id)
    ) {
      return false;
    }
    if (areBodiesTetherConnected(state.world, a, b)) {
      return false;
    }
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const mergeDistance = a.radius + b.radius;
    if (dx * dx + dy * dy > mergeDistance * mergeDistance) {
      return false;
    }
    if (shouldOrbitPreventMerge(a, b)) {
      resolveOrbitPreventedMerge(a, b);
      return false;
    }
    const absorbingPair = absorbingCollisionPair(a, b);
    if (!absorbingPair) {
      emitBodyCrashDebris(state, a, b, dx, dy);
      resolveBodyBounce(a, b, dx, dy, mergeDistance);
      return false;
    }

    const totalMass = a.mass + b.mass;
    const keep = absorbingPair.absorber;
    const absorb = absorbingPair.absorbed;
    const keepIsScoredBody = Boolean(playerIdForScoredBody(state, keep));
    wakeSurvivalCampFromAbsorbedBody(state, keep, absorb);
    const previousTier = a.tier.threshold >= b.tier.threshold ? a.tier : b.tier;
    const stellarSource = stellarGrowthSourceForMerge(a, b, keep);
    const previousStellarMass = Math.max(0, finiteOr(stellarSource && stellarSource.mass, 0));
    const gainedStellarMass = Math.max(0, totalMass - previousStellarMass);
    let nextTier = tierForMass(totalMass);
    const graduated = nextTier.threshold > previousTier.threshold || (totalMass >= STELLAR_EVOLUTION_END_THRESHOLD && !STELLAR_OUTCOME_TIER_NAMES.includes(previousTier.name));
    const becameStar = nextTier.name === "star" && previousTier.name !== "star";
    const color = graduated ? mixColor(a.color, b.color, a.mass, b.mass) : keep.color;
    const previousMergeRadius = Math.max(finiteOr(a.radius, 0), finiteOr(b.radius, 0));
    const keptStarBirthAge = finiteOr(keep.starBirthAge, STAR_BIRTH_TRANSITION_DURATION);
    const keptStarEmissionAccumulator = finiteOr(keep.starEmissionAccumulator, 0);
    keep.x = (a.x * a.mass + b.x * b.mass) / totalMass;
    keep.y = (a.y * a.mass + b.y * b.mass) / totalMass;
    keep.vx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
    keep.vy = (a.vy * a.mass + b.vy * b.mass) / totalMass;
    keep.mass = totalMass;
    keep.radius = radiusFromMass(totalMass);
    keep.tier = clone(nextTier);
    keep.rotation = keep === a ? finiteOr(a.rotation, 0) : finiteOr(b.rotation, 0);
    keep.angularVelocity = clamp(
      (finiteOr(a.angularVelocity, 0) * a.mass + finiteOr(b.angularVelocity, 0) * b.mass) / totalMass,
      -BODY_MAX_ANGULAR_SPEED,
      BODY_MAX_ANGULAR_SPEED
    );
    keep.color = color;
    keep.starBirthAge = becameStar ? 0 : nextTier.name === "star" ? keptStarBirthAge : 0;
    keep.starEmissionAccumulator = nextTier.name === "star" ? keptStarEmissionAccumulator : 0;
    applySurvivalCampMergeState(keep, [keep, absorb, a, b], {
      clearCampState: keepIsScoredBody
    });
    copyStellarGrowthState(keep, stellarSource);
    updateStellarGrowthForMerge(keep, previousStellarMass, gainedStellarMass, Math.max(0, finiteOr(state && state.tick, 0)) * TICK_DT);
    finalizeStellarOutcomeTier(keep);
    nextTier = keep.tier;
    if (nextTier.threshold > previousTier.threshold) {
      keep.radius = Math.max(keep.radius, previousMergeRadius * BODY_TIER_EVOLUTION_SIZE_SCALE);
    }
    removed.add(absorb.id);
    const destroyedStructureCount = isStarBody(keep)
      ? destroyStructuresForStarMerge(state, keep, absorb)
      : destroyAbsorbedBodyStructuresForMerge(state, absorb);
    state.events.push({
      type: "body.merged",
      keptId: keep.id,
      removedId: absorb.id,
      x: keep.x,
      y: keep.y,
      radius: keep.radius,
      color: cloneColor(keep.color),
      absorbedX: absorb.x,
      absorbedY: absorb.y,
      absorbedRadius: absorb.radius,
      absorbedColor: cloneColor(absorb.color),
      mass: totalMass,
      tier: clone(keep.tier),
      previousTier: clone(previousTier),
      graduated,
      becameStar,
      promotedFromTier: previousTier.name,
      promotedToTier: nextTier.name,
      stellarOutcome: keep.stellarOutcome || "",
      destroyedStructures: destroyedStructureCount,
      tick: state.tick
    });
    for (const player of Object.values(state.players || {})) {
      if (!player || !player.landed || (player.landed.bodyId !== keep.id && player.landed.bodyId !== absorb.id)) {
        continue;
      }
      if (isStarBody(keep)) {
        ejectPlayerFromStarBirth(player, keep);
      } else {
        player.landed.bodyId = keep.id;
        player.landed.angle = Math.atan2(finiteOr(player.y, keep.y) - keep.y, finiteOr(player.x, keep.x) - keep.x);
        applyLandedSurfaceConstraint(state.world, player);
      }
    }
    return true;
  }

  function mergeParticlesPairwise(state, bodies) {
    const removed = new Set();
    for (let i = 0; i < bodies.length; i += 1) {
      const a = bodies[i];
      if (!a || removed.has(a.id)) {
        continue;
      }
      for (let j = i + 1; j < bodies.length; j += 1) {
        mergeParticlePair(state, a, bodies[j], removed);
      }
    }
    return removed;
  }

  function particleBucketKey(x, y, cellSize) {
    return Math.floor(x / cellSize) + "," + Math.floor(y / cellSize);
  }

  function buildParticleBuckets(bodies, cellSize) {
    const buckets = new Map();
    let maxRadius = 1;
    for (const body of bodies) {
      if (!body) {
        continue;
      }
      maxRadius = Math.max(maxRadius, finiteOr(body.radius, 1));
      const key = particleBucketKey(body.x, body.y, cellSize);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(body);
      } else {
        buckets.set(key, [body]);
      }
    }
    return { buckets, maxRadius };
  }

  function mergeParticlesSpatial(state, bodies) {
    const cellSize = 320;
    const grid = buildParticleBuckets(bodies, cellSize);
    const removed = new Set();
    const checked = new Set();
    for (const a of bodies) {
      if (!a || removed.has(a.id)) {
        continue;
      }
      const cx = Math.floor(a.x / cellSize);
      const cy = Math.floor(a.y / cellSize);
      const range = Math.max(1, Math.ceil((finiteOr(a.radius, 1) + grid.maxRadius) / cellSize));
      for (let gx = cx - range; gx <= cx + range; gx += 1) {
        for (let gy = cy - range; gy <= cy + range; gy += 1) {
          const bucket = grid.buckets.get(gx + "," + gy);
          if (!bucket) {
            continue;
          }
          for (const b of bucket) {
            if (!b || a === b || removed.has(b.id)) {
              continue;
            }
            const low = Math.min(a.id, b.id);
            const high = Math.max(a.id, b.id);
            const key = low + ":" + high;
            if (checked.has(key)) {
              continue;
            }
            checked.add(key);
            mergeParticlePair(state, a, b, removed);
          }
        }
      }
    }
    return removed;
  }

  function canLocalGravityClusterBody(body) {
    return Boolean(body && body.tier && finiteOr(body.tier.threshold, 0) <= thresholdForTierName("asteroid"));
  }

  function applyLocalBodyGravity(state, dt) {
    const bodies = state && state.world && Array.isArray(state.world.particles) ? state.world.particles : [];
    if (bodies.length < 2 || dt <= 0) {
      return;
    }

    const cellSize = LOCAL_BODY_GRAVITY_RADIUS;
    const buckets = new Map();
    for (const body of bodies) {
      if (!canLocalGravityClusterBody(body)) {
        continue;
      }
      const key = particleBucketKey(body.x, body.y, cellSize);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(body);
      } else {
        buckets.set(key, [body]);
      }
    }

    const checked = new Set();
    for (const a of bodies) {
      if (!canLocalGravityClusterBody(a)) {
        continue;
      }
      const cellX = Math.floor(a.x / cellSize);
      const cellY = Math.floor(a.y / cellSize);
      for (let gx = cellX - 1; gx <= cellX + 1; gx += 1) {
        for (let gy = cellY - 1; gy <= cellY + 1; gy += 1) {
          const bucket = buckets.get(gx + "," + gy);
          if (!bucket) {
            continue;
          }
          for (const b of bucket) {
            if (!b || a === b || !canLocalGravityClusterBody(b)) {
              continue;
            }
            const low = Math.min(a.id, b.id);
            const high = Math.max(a.id, b.id);
            const key = low + ":" + high;
            if (checked.has(key)) {
              continue;
            }
            checked.add(key);
            if (areBodiesTetherConnected(state.world, a, b)) {
              continue;
            }
            const dx = finiteOr(b.x, 0) - finiteOr(a.x, 0);
            const dy = finiteOr(b.y, 0) - finiteOr(a.y, 0);
            const distance = Math.hypot(dx, dy);
            const reach = LOCAL_BODY_GRAVITY_RADIUS + Math.max(0, finiteOr(a.radius, 0) + finiteOr(b.radius, 0)) * 0.45;
            if (distance <= 0.001 || distance > reach) {
              continue;
            }
            const closeness = 1 - distance / reach;
            const totalMass = Math.max(1, finiteOr(a.mass, 1) + finiteOr(b.mass, 1));
            const force = Math.min(LOCAL_BODY_GRAVITY_MAX_ACCELERATION, LOCAL_BODY_GRAVITY_FORCE * closeness * closeness);
            const nx = dx / distance;
            const ny = dy / distance;
            const aShare = clamp(finiteOr(b.mass, 1) / totalMass, 0.12, 0.88);
            const bShare = clamp(finiteOr(a.mass, 1) / totalMass, 0.12, 0.88);
            a.vx += nx * force * aShare * dt;
            a.vy += ny * force * aShare * dt;
            b.vx -= nx * force * bShare * dt;
            b.vy -= ny * force * bShare * dt;
          }
        }
      }
    }
  }

  function mergeParticles(state) {
    const bodies = state.world.particles;
    const removed = bodies.length < 36 ? mergeParticlesPairwise(state, bodies) : mergeParticlesSpatial(state, bodies);
    if (removed.size) {
      state.world.particles = bodies.filter((body) => body && !removed.has(body.id));
    }
  }

  function mobCollectionByKind(world, kind) {
    if (kind === "ufo") {
      return world.ufos;
    }
    if (kind === "rambot") {
      return world.rambots;
    }
    if (kind === "engineer") {
      return world.engineers;
    }
    if (kind === "tesla") {
      return world.teslas;
    }
    if (kind === "satellite" || kind === "rocket") {
      return world.rockets;
    }
    if (kind === "fighter") {
      return world.fighters;
    }
    return world.alienoids;
  }

  function difficultyMobSettings(state) {
    return DIFFICULTY_MOB_SETTINGS[state && state.difficulty] || DIFFICULTY_MOB_SETTINGS.medium;
  }

  function difficultyHealthDropChance(state, kind) {
    const baseChance = kind === "ufo" ? HEALTH_DROP_BASE_CHANCES.ufo : HEALTH_DROP_BASE_CHANCES.default;
    return clamp(baseChance * finiteOr(difficultyMobSettings(state).healthDropMultiplier, 1), 0, 0.96);
  }

  function difficultyMobSpawnInterval(state, kind) {
    const interval = MOB_SPAWN_INTERVALS[kind] || 120;
    return interval * difficultyMobSettings(state).intervalScale;
  }

  function difficultyMobWaveInterval(state) {
    return MOB_WAVE_INTERVAL * difficultyMobSettings(state).intervalScale;
  }

  function difficultyMobFirstWaveDelay(state) {
    return Math.max(0.5, finiteOr(difficultyMobSettings(state).firstWaveDelay, difficultyMobWaveInterval(state)));
  }

  function anyPlayerNeedsHealth(state) {
    const players = state && state.players && typeof state.players === "object" ? state.players : {};
    return Object.values(players).some((player) => {
      return player && finiteOr(player.health, 0) > 0 && finiteOr(player.health, 0) < finiteOr(player.maxHealth, PLAYER_MAX_HEALTH);
    });
  }

  function shouldDropHealthPickup(state, mob) {
    if (!anyPlayerNeedsHealth(state)) {
      return false;
    }
    const kind = mob && mob.kind || "alienoid";
    const kindIndex = Math.max(0, MOB_TIER_ORDER.indexOf(kind));
    const seed = (
      finiteOr(state && state.seed, 1) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(state && state.tick, 0)) + 1), 2246822519) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(mob && mob.id, 1))), 3266489917) ^
      Math.imul(kindIndex + 1, 668265263)
    ) >>> 0;
    return seededRange(seed, 0, 1).value < difficultyHealthDropChance(state, kind);
  }
