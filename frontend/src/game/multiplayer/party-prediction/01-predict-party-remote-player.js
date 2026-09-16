  function predictPartyRemotePlayer(remotePlayer, receivedAt, options) {
    if (!remotePlayer) {
      return null;
    }

    const predicted = {
      ...remotePlayer,
      landed: remotePlayer.landed ? { ...remotePlayer.landed } : null
    };
    const now = performance.now();
    const lead = clamp(
      (now - finiteOr(receivedAt, now)) / 1000 + finiteOr(options && options.lead, partyRemotePredictionLead),
      0,
      finiteOr(options && options.maxLead, partyRemotePredictionMax)
    );

    if (predicted.landed) {
      if (predicted.landed.bridgeId) {
        const bridge = activeBridgeById(predicted.landed.bridgeId);
        const geometry = bridge ? bridgeGeometry(bridge) : null;
        if (bridge && geometry) {
          predicted.landed.bridgeT = clamp(
            finiteOr(predicted.landed.bridgeT, 0) + finiteOr(predicted.landed.walkSpeed, 0) * lead,
            0,
            geometry.length
          );
          const pose = bridgeSurfacePose(bridge, predicted.landed.bridgeT, predicted.landed.bridgeSide, predicted.landed.walkSpeed);
          if (pose) {
            predicted.landed.angle = pose.angle;
            predicted.x = pose.x;
            predicted.y = pose.y;
            predicted.vx = pose.vx;
            predicted.vy = pose.vy;
            return predicted;
          }
        }
      }

      const body = bodyById(predicted.landed.bodyId);
      if (body && isLandableBody(body)) {
        const surfaceRadius = Math.max(24, body.radius + surfaceExtensionAtAngle(body, predicted.landed.angle));
        predicted.landed.angle += (finiteOr(predicted.landed.walkSpeed, 0) / surfaceRadius) * lead;
        const normal = {
          x: Math.cos(predicted.landed.angle),
          y: Math.sin(predicted.landed.angle)
        };
        const tangent = { x: -normal.y, y: normal.x };
        const surfaceOffset = surfaceExtensionAtAngle(body, predicted.landed.angle);
        const distanceFromCenter = body.radius + surfaceOffset + playerFootOffset;
        const walkSpeed = finiteOr(predicted.landed.walkSpeed, 0);
        predicted.x = body.x + normal.x * distanceFromCenter;
        predicted.y = body.y + normal.y * distanceFromCenter;
        predicted.vx = finiteOr(body.vx, 0) + tangent.x * walkSpeed;
        predicted.vy = finiteOr(body.vy, 0) + tangent.y * walkSpeed;
        return predicted;
      }
    }

    predicted.x += finiteOr(predicted.vx, 0) * lead;
    predicted.y += finiteOr(predicted.vy, 0) * lead;
    return predicted;
  }

  function partyGadgetStateForPlayer(remotePlayer, gadget, receivedAt) {
    return partyGadgetStateFromActor(remotePlayer, gadget, receivedAt, {
      bucketPadding: 0,
      suckFactor: finiteOr(gadget && gadget.suckFactor, 1),
      rangeFactor: finiteOr(gadget && gadget.rangeFactor, finiteOr(gadget && gadget.suckFactor, 1)),
      blowFactor: finiteOr(gadget && gadget.blowFactor, 1),
      lead: gadget && gadget.active ? partyRemoteGadgetPredictionLead : 0,
      maxLead: gadget && gadget.active ? partyRemoteGadgetPredictionMax : 0
    });
  }

  function partyGadgetCanAffectParticle(state, particle) {
    return Boolean(
      state &&
      particle &&
      particle.id !== state.landedBodyId &&
      !isBodyAttachedToBodyByLinkedStructures(particle, state.landedBodyId)
    );
  }

  function gadgetStateMayReachTarget(state, target, padding) {
    if (!state || !state.actor || !target) {
      return false;
    }

    const reach = gadgetForceReachForState(state) + Math.max(0, finiteOr(target.radius, 0)) + Math.max(0, finiteOr(padding, 0)) + 180;
    const dx = target.x - state.actor.x;
    const dy = target.y - state.actor.y;
    return dx * dx + dy * dy <= reach * reach;
  }

  function pruneExcessAmbientParticles(anchors, maxParticleBudget) {
    let ambientCount = countAmbientParticles();
    if (ambientCount <= maxParticleBudget) {
      return;
    }

    for (let remaining = ambientCount - maxParticleBudget; remaining > 0; remaining -= 1) {
      let removeIndex = -1;
      let removeScore = -Infinity;

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        if (!isAmbientDensityParticle(particle)) {
          continue;
        }

        const distance = nearestPartyAnchorDistance(particle.x, particle.y, anchors);
        const score = distance + Math.max(0, particle.mass - 1) * 8;
        if (score > removeScore) {
          removeScore = score;
          removeIndex = i;
        }
      }

      if (removeIndex < 0) {
        return;
      }
      particles.splice(removeIndex, 1);
      ambientCount -= 1;
    }
  }

  function farthestRecyclableAmbientParticle(anchors, keepRadius) {
    let best = null;
    let bestDistance = -Infinity;
    for (const particle of particles) {
      if (
        !particle ||
        !particle.tier ||
        particle.tier.solid ||
        particle.randomEventId ||
        particle.survivalCampBody ||
        finiteOr(particle.ufoSapTimer, 0) > 0 ||
        isUfoBeamCargo(particle)
      ) {
        continue;
      }
      const distance = nearestPartyAnchorDistance(particle.x, particle.y, anchors);
      if (distance <= keepRadius || distance <= bestDistance) {
        continue;
      }
      best = particle;
      bestDistance = distance;
    }
    return best;
  }

  function pruneInvalidParticles() {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (!isValidParticleState(particles[i])) {
        particles.splice(i, 1);
      }
    }
  }

  function starParticleColor(star) {
    const core = { r: 255, g: 210, b: 92 };
    const ember = { r: 255, g: 116, b: 70 };
    return mixColor(core, mixColor(star.color, ember, 1, 2), 3, 2);
  }

  function emitStarParticle(star) {
    const angle = randomRange(0, Math.PI * 2);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    const tangent = randomRange(-62, 62);
    const spawnDistance = solidBodyContactRadius(star) + randomRange(58, 108);
    const mass = Math.random() < 0.78 ? 1 : 2;
    const particle = createParticle(
      star.x + nx * spawnDistance,
      star.y + ny * spawnDistance,
      mass,
      starParticleColor(star)
    );
    const speed = randomRange(78, 178);
    particle.vx = finiteOr(star.vx, 0) * 0.35 + nx * speed - ny * tangent;
    particle.vy = finiteOr(star.vy, 0) * 0.35 + ny * speed + nx * tangent;
    particle.spawnAge = 0;
    particle.spawnSizeScale = randomRange(1, 1.18);
    particles.push(particle);
  }

  function recycleAmbientParticleForStarEmission(star) {
    let removeIndex = -1;
    let removeScore = -Infinity;
    const protectedRadius = solidBodyContactRadius(star) + 420;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      if (
        !particle ||
        particle === star ||
        !particle.tier ||
        particle.tier.name !== "particle" ||
        particle.randomEventId ||
        isUfoBeamCargo(particle)
      ) {
        continue;
      }

      const distanceFromStar = Math.hypot(finiteOr(particle.x, 0) - finiteOr(star.x, 0), finiteOr(particle.y, 0) - finiteOr(star.y, 0));
      if (distanceFromStar < protectedRadius) {
        continue;
      }
      const score = distanceFromStar + Math.max(0, finiteOr(particle.mass, 1) - 1) * 70;
      if (score > removeScore) {
        removeScore = score;
        removeIndex = i;
      }
    }

    if (removeIndex < 0) {
      return false;
    }
    particles.splice(removeIndex, 1);
    return true;
  }

  function updateStarParticleEmission(star, dt, particleBudget) {
    if (!isStarBody(star)) {
      return 0;
    }

    star.starBirthAge = Math.min(
      starBirthTransitionDuration,
      Math.max(0, finiteOr(star.starBirthAge, starBirthTransitionDuration)) + dt
    );
    star.starEmissionAccumulator = finiteOr(star.starEmissionAccumulator, 0) + starParticleEmissionRate(star) * dt;
    let emitted = 0;
    let recycled = 0;
    const budgetLimit = particleBudget + 36;
    while (
      star.starEmissionAccumulator >= 1 &&
      emitted < starParticleEmissionMaxPerFrame
    ) {
      if (particles.length >= budgetLimit) {
        if (!recycleAmbientParticleForStarEmission(star)) {
          break;
        }
        recycled += 1;
      }
      star.starEmissionAccumulator -= 1;
      emitStarParticle(star);
      emitted += 1;
    }
    return Math.max(0, emitted - recycled);
  }

  function pushStarStructureDestructionSpark(structure, star) {
    const points = [
      { x: finiteOr(structure.x, star.x), y: finiteOr(structure.y, star.y) }
    ];
    if (structure.linkedBodyId) {
      points.push({ x: finiteOr(structure.x2, structure.x), y: finiteOr(structure.y2, structure.y) });
    }

    for (const point of points) {
      sparks.push({
        x: point.x,
        y: point.y,
        radius: randomRange(44, 96),
        color: { r: 255, g: 142, b: 74 },
        life: randomRange(0.32, 0.62),
        maxLife: 0.62,
        vx: randomRange(-80, 80),
        vy: randomRange(-80, 80)
      });
    }
  }

  function droppedStructureTechCount(amount) {
    return Math.max(1, Math.floor(Math.max(0, finiteOr(amount, 0)) * 0.75));
  }

  function dropStructureTechPickups(structure) {
    if (!structure) {
      return 0;
    }
    let dropped = 0;
    const x = finiteOr(structure.x, player.x);
    const y = finiteOr(structure.y, player.y);
    const vx = finiteOr(structure.vx, 0);
    const vy = finiteOr(structure.vy, 0);
    const recipe = recipeByStructureType(structure.type);
    if (recipe && recipe.cost) {
      for (const [techKey, amount] of Object.entries(recipe.cost)) {
        const count = droppedStructureTechCount(amount);
        for (let i = 0; i < count; i += 1) {
          techPickups.push(createTechPickup(techKey, x, y, vx, vy));
          dropped += 1;
        }
      }
    }

    const storedTech = normalizeTradeOffer(structure.tech);
    for (const tech of techTypes) {
      const count = Math.max(0, Math.floor(finiteOr(storedTech[tech.key], 0)));
      for (let i = 0; i < count; i += 1) {
        techPickups.push(createTechPickup(tech.key, x, y, vx, vy));
        dropped += 1;
      }
    }
    return dropped;
  }

  function destroyStructuresForStarBody(star) {
    let destroyed = 0;
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (structure && (structure.bodyId === star.id || structure.linkedBodyId === star.id)) {
        pushStarStructureDestructionSpark(structure, star);
        dropStructureTechPickups(structure);
        structures.splice(i, 1);
        destroyed += 1;
      }
    }
    return destroyed;
  }

  function emitStarFormationBurst(star, destroyedStructureCount) {
    const burstCount = clamp(22 + destroyedStructureCount * 4, 22, 48);
    for (let i = 0; i < burstCount; i += 1) {
      const angle = (Math.PI * 2 * i) / burstCount + randomRange(-0.12, 0.12);
      const speed = randomRange(120, 430);
      sparks.push({
        x: star.x + Math.cos(angle) * randomRange(star.radius * 0.24, star.radius * 0.88),
        y: star.y + Math.sin(angle) * randomRange(star.radius * 0.24, star.radius * 0.88),
        radius: randomRange(star.radius * 0.18, star.radius * 0.58),
        color: i % 3 === 0 ? { r: 255, g: 244, b: 168 } : { r: 255, g: 122, b: 66 },
        life: randomRange(0.42, 0.95),
        maxLife: 0.95,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      });
    }
  }

  function ejectActorFromStarBirth(actor, star, footOffset) {
    if (!actor || !actor.landed) {
      return;
    }
    const angle = Math.atan2(finiteOr(actor.y, star.y) - star.y, finiteOr(actor.x, star.x) - star.x);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    actor.x = star.x + nx * (solidBodyContactRadius(star) + finiteOr(actor.radius, player.radius) + Math.max(24, footOffset * 0.35));
    actor.y = star.y + ny * (solidBodyContactRadius(star) + finiteOr(actor.radius, player.radius) + Math.max(24, footOffset * 0.35));
    actor.vx = finiteOr(star.vx, 0) + nx * starContactKnockback;
    actor.vy = finiteOr(star.vy, 0) + ny * starContactKnockback;
    actor.landed = null;
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

  function updateStellarGrowthForMerge(body, previousMass, gainedMass, nowSeconds) {
    if (!body || finiteOr(body.mass, 0) < thresholdForTierName("star")) {
      return;
    }

    const now = Math.max(0, finiteOr(nowSeconds, performance.now() / 1000));
    if (previousMass < thresholdForTierName("star")) {
      body.stellarGrowthStarted = true;
      body.stellarGrowthLastSampleAt = now;
      if (finiteOr(body.mass, 0) >= stellarEvolutionEndThreshold) {
        body.stellarGrowthRate = Math.max(finiteOr(body.stellarGrowthRate, 0), Math.max(0, finiteOr(body.mass, 0) - thresholdForTierName("star")));
      }
      return;
    }

    const elapsed = Math.max(1 / 30, now - finiteOr(body.stellarGrowthLastSampleAt, now));
    const instantRate = Math.max(0, finiteOr(gainedMass, 0)) / elapsed;
    const previousRate = Math.max(0, finiteOr(body.stellarGrowthRate, 0));
    const alpha = clamp(elapsed / Math.max(0.001, stellarGrowthAverageWindowSeconds), 0.08, 0.55);
    body.stellarGrowthRate = previousRate > 0 ? previousRate + (instantRate - previousRate) * alpha : instantRate;
    body.stellarGrowthStarted = true;
    body.stellarGrowthLastSampleAt = now;
  }

  function finalizeStellarOutcomeTier(body) {
    if (!body) {
      return;
    }
    if (finiteOr(body.mass, 0) >= stellarEvolutionEndThreshold) {
      body.stellarOutcome = normalizedStellarOutcomeName(body.stellarOutcome) || stellarOutcomeForGrowthRate(body.stellarGrowthRate);
    }
    body.tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
    body.radius = radiusFromMassForTier(body.mass, body.tier);
  }
