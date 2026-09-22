  function serializeParticle(particle) {
    return {
      id: particle.id,
      x: particle.x,
      y: particle.y,
      vx: particle.vx,
      vy: particle.vy,
      mass: particle.mass,
      radius: particle.radius,
      energy: particle.energy,
      maxEnergy: particle.maxEnergy,
      rotation: particle.rotation,
      angularVelocity: particle.angularVelocity,
      color: particle.color,
      textureSeed: particle.textureSeed,
      wobble: particle.wobble,
      pulse: particle.pulse,
      spawnAge: particle.spawnAge,
      spawnSizeScale: particle.spawnSizeScale,
      orbitHostId: particle.orbitHostId,
      orbitRingIndex: particle.orbitRingIndex,
      orbitDirection: particle.orbitDirection,
      orbitStrength: particle.orbitStrength,
      orbitGrace: particle.orbitGrace,
      starBirthAge: particle.starBirthAge,
      starEmissionAccumulator: particle.starEmissionAccumulator,
      stellarGrowthStarted: Boolean(particle.stellarGrowthStarted),
      stellarGrowthRate: particle.stellarGrowthRate,
      stellarGrowthLastSampleAt: particle.stellarGrowthLastSampleAt,
      stellarOutcome: particle.stellarOutcome || "",
      randomEventId: particle.randomEventId || "",
      randomEventRegionX: particle.randomEventRegionX,
      randomEventRegionY: particle.randomEventRegionY,
      ufoSapTimer: particle.ufoSapTimer,
      ufoSapSourceGraceTimer: particle.ufoSapSourceGraceTimer,
      ufoExtractedById: particle.ufoExtractedById,
      ufoExtractedFromId: particle.ufoExtractedFromId,
      ufoSapParticleBuffer: particle.ufoSapParticleBuffer,
      ownerPlayerId: particle.tier && particle.tier.name !== "particle" ? particle.ownerPlayerId || "" : "",
      survivalCampId: particle.survivalCampId || "",
      survivalCampX: particle.survivalCampX,
      survivalCampY: particle.survivalCampY,
      survivalCampHomeX: particle.survivalCampHomeX,
      survivalCampHomeY: particle.survivalCampHomeY,
      survivalCampMovedByPlayer: Boolean(particle.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(particle.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: particle.survivalCampLastMoverPlayerId || "",
      lastControllingPlayerId: particle.lastControllingPlayerId || "",
      lastPlayerControlAt: Math.max(0, finiteOr(particle.lastPlayerControlAt, 0)),
      lastPlayerControlBelowSpeedAt: Math.max(0, finiteOr(particle.lastPlayerControlBelowSpeedAt, 0)),
      playerImpactDebrisCooldown: Math.max(0, finiteOr(particle.playerImpactDebrisCooldown, 0)),
      survivalCampBody: Boolean(particle.survivalCampBody),
      ambientSpawnRock: Boolean(particle.ambientSpawnRock)
    };
  }

  function applySmoothedParticleSnapshots(snapshotParticles) {
    const normalized = snapshotParticles.map(normalizeParticleSnapshot).filter(Boolean);
    const existingById = new Map();
    for (const particle of particles) {
      existingById.set(particle.id, particle);
    }

    const now = performance.now();
    const nextParticles = [];
    const seenIds = new Set();
    for (const incoming of normalized) {
      const existing = existingById.get(incoming.id);
      if (!existing) {
        markParticleSmoothingTarget(incoming, incoming, now);
        nextParticles.push(incoming);
        seenIds.add(incoming.id);
        continue;
      }

      seenIds.add(incoming.id);
      if (hasLocalPartyPhysicsSession("particle", existing.id, now)) {
        const displayX = existing.x;
        const displayY = existing.y;
        const displayVx = existing.vx;
        const displayVy = existing.vy;
        const displayRotation = finiteOr(existing.rotation, 0);
        const displayAngularVelocity = finiteOr(existing.angularVelocity, 0);
        Object.assign(existing, incoming);
        existing.x = displayX;
        existing.y = displayY;
        existing.vx = displayVx;
        existing.vy = displayVy;
        existing.rotation = displayRotation;
        existing.angularVelocity = displayAngularVelocity;
        markParticleSmoothingTarget(existing, incoming, now);
        nextParticles.push(existing);
        continue;
      }

      const distance = Math.hypot(incoming.x - existing.x, incoming.y - existing.y);
      const predictedLocally = now < finiteOr(existing._partyPredictedUntil, 0);
      const snapDistance = predictedLocally ? Math.max(1800, incoming.radius * 8) : Math.max(900, incoming.radius * 5);
      const shouldSnap = distance > snapDistance;
      const displayX = shouldSnap ? incoming.x : existing.x;
      const displayY = shouldSnap ? incoming.y : existing.y;
      const displayVx = shouldSnap ? incoming.vx : existing.vx;
      const displayVy = shouldSnap ? incoming.vy : existing.vy;

      Object.assign(existing, incoming);
      existing.x = displayX;
      existing.y = displayY;
      existing.vx = displayVx;
      existing.vy = displayVy;
      if (shouldSnap) {
        existing._partyPredictedUntil = 0;
      }
      markParticleSmoothingTarget(existing, incoming, now);
      nextParticles.push(existing);
    }

    for (const particle of particles) {
      if (!seenIds.has(particle.id) && hasLocalPartyPhysicsSession("particle", particle.id, now)) {
        clearLocalPartyPhysicsSession("particle", particle.id);
      }
    }

    particles.length = 0;
    particles.push(...nextParticles);
  }

  function applySmoothedEntitySnapshots(collection, snapshots, normalizeSnapshot, options) {
    if (!Array.isArray(collection) || !Array.isArray(snapshots) || typeof normalizeSnapshot !== "function") {
      return;
    }

    const normalized = snapshots.map(normalizeSnapshot).filter(Boolean);
    const existingById = new Map();
    for (const entity of collection) {
      if (entity && entity.id !== undefined && entity.id !== null) {
        existingById.set(String(entity.id), entity);
      }
    }

    const now = performance.now();
    const snapDistance = options && Number.isFinite(Number(options.snapDistance)) ? Number(options.snapDistance) : 900;
    const entityType = options && options.entityType ? normalizePartyEntityType(options.entityType) : "";
    const nextEntities = [];
    const seenIds = new Set();
    for (const incoming of normalized) {
      const existing = existingById.get(String(incoming.id));
      if (!existing) {
        markEntitySmoothingTarget(incoming, incoming, now);
        nextEntities.push(incoming);
        seenIds.add(String(incoming.id));
        continue;
      }

      seenIds.add(String(incoming.id));
      if (entityType && hasLocalPartyPhysicsSession(entityType, incoming.id, now)) {
        const displayX = existing.x;
        const displayY = existing.y;
        const displayVx = existing.vx;
        const displayVy = existing.vy;
        Object.assign(existing, incoming);
        existing.x = displayX;
        existing.y = displayY;
        existing.vx = displayVx;
        existing.vy = displayVy;
        markEntitySmoothingTarget(existing, incoming, now);
        nextEntities.push(existing);
        continue;
      }

      const distance = Math.hypot(incoming.x - existing.x, incoming.y - existing.y);
      const shouldSnap = distance > Math.max(snapDistance, finiteOr(incoming.radius, 1) * 5);
      const displayX = shouldSnap ? incoming.x : existing.x;
      const displayY = shouldSnap ? incoming.y : existing.y;
      const displayVx = shouldSnap ? incoming.vx : existing.vx;
      const displayVy = shouldSnap ? incoming.vy : existing.vy;

      Object.assign(existing, incoming);
      existing.x = displayX;
      existing.y = displayY;
      existing.vx = displayVx;
      existing.vy = displayVy;
      markEntitySmoothingTarget(existing, incoming, now);
      nextEntities.push(existing);
    }

    if (entityType) {
      for (const entity of collection) {
        if (
          entity &&
          entity.id !== undefined &&
          entity.id !== null &&
          !seenIds.has(String(entity.id)) &&
          hasLocalPartyPhysicsSession(entityType, entity.id, now)
        ) {
          clearLocalPartyPhysicsSession(entityType, entity.id);
        }
      }
    }

    collection.length = 0;
    collection.push(...nextEntities);
  }

  function markParticleSmoothingTarget(particle, target, receivedAt) {
    particle._partyTargetX = finiteOr(target.x, particle.x);
    particle._partyTargetY = finiteOr(target.y, particle.y);
    particle._partyTargetVx = finiteOr(target.vx, particle.vx);
    particle._partyTargetVy = finiteOr(target.vy, particle.vy);
    particle._partyTargetRotation = finiteOr(target.rotation, particle.rotation);
    particle._partyTargetAngularVelocity = finiteOr(target.angularVelocity, particle.angularVelocity);
    particle._partyTargetReceivedAt = receivedAt;
  }

  function markEntitySmoothingTarget(entity, target, receivedAt) {
    entity._partyTargetX = finiteOr(target.x, entity.x);
    entity._partyTargetY = finiteOr(target.y, entity.y);
    entity._partyTargetVx = finiteOr(target.vx, entity.vx);
    entity._partyTargetVy = finiteOr(target.vy, entity.vy);
    entity._partyTargetReceivedAt = receivedAt;
  }

  function markFollowerPredictedParticle(particle, now) {
    if (!particle) {
      return;
    }
    const until = finiteOr(now, performance.now()) + partyFollowerPredictionHoldMs;
    particle._partyPredictedUntil = Math.max(finiteOr(particle._partyPredictedUntil, 0), until);
  }

  function updateFollowerWorldSmoothing(dt) {
    if (!isSharedWorldFollower()) {
      return;
    }

    const positionBlend = 1 - Math.pow(0.00035, dt);
    const velocityBlend = 1 - Math.pow(0.0015, dt);
    const now = performance.now();

    for (const particle of particles) {
      if (hasLocalPartyPhysicsSession("particle", particle.id, now)) {
        continue;
      }
      if (!Number.isFinite(particle._partyTargetX) || !Number.isFinite(particle._partyTargetY)) {
        continue;
      }

      const age = Math.max(0, Math.min(0.18, (now - finiteOr(particle._partyTargetReceivedAt, now)) / 1000));
      const targetVx = finiteOr(particle._partyTargetVx, particle.vx);
      const targetVy = finiteOr(particle._partyTargetVy, particle.vy);
      const targetAngularVelocity = finiteOr(particle._partyTargetAngularVelocity, particle.angularVelocity);
      const targetX = finiteOr(particle._partyTargetX, particle.x) + targetVx * age;
      const targetY = finiteOr(particle._partyTargetY, particle.y) + targetVy * age;
      const targetRotation = finiteOr(particle._partyTargetRotation, particle.rotation) + targetAngularVelocity * age;
      const error = Math.hypot(targetX - particle.x, targetY - particle.y);

      if (error > Math.max(900, particle.radius * 5)) {
        particle.x = targetX;
        particle.y = targetY;
        particle.vx = targetVx;
        particle.vy = targetVy;
        particle.rotation = targetRotation;
        particle.angularVelocity = targetAngularVelocity;
        particle._partyPredictedUntil = 0;
        continue;
      }

      const predictedLocally = now < finiteOr(particle._partyPredictedUntil, 0);
      const correctionScale = predictedLocally ? 0.42 : 1;
      particle.vx += (targetVx - particle.vx) * velocityBlend * correctionScale;
      particle.vy += (targetVy - particle.vy) * velocityBlend * correctionScale;
      particle.angularVelocity = finiteOr(particle.angularVelocity, 0) + (targetAngularVelocity - finiteOr(particle.angularVelocity, 0)) * velocityBlend * correctionScale;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation = finiteOr(particle.rotation, 0) + finiteOr(particle.angularVelocity, 0) * dt;
      particle.x += (targetX - particle.x) * positionBlend * correctionScale;
      particle.y += (targetY - particle.y) * positionBlend * correctionScale;
      particle.rotation += shortestAngleDelta(particle.rotation, targetRotation) * positionBlend * correctionScale;
    }

    updateSmoothedEntityCollection(rivals, dt, { positionBlend, velocityBlend, entityType: "alienoid" });
    updateSmoothedEntityCollection(ufos, dt, { positionBlend, velocityBlend, entityType: "ufo" });
    updateSmoothedEntityCollection(rambots, dt, { positionBlend, velocityBlend, entityType: "rambot" });
    updateSmoothedEntityCollection(engineers, dt, { positionBlend, velocityBlend, entityType: "engineer" });
    updateSmoothedEntityCollection(teslas, dt, { positionBlend, velocityBlend, entityType: "tesla" });
    updateSmoothedEntityCollection(rockets, dt, { positionBlend, velocityBlend, entityType: "rocket" });
    updateSmoothedEntityCollection(fighters, dt, { positionBlend, velocityBlend, entityType: "fighter" });
    updateSmoothedEntityCollection(mobBeacons, dt, { positionBlend, velocityBlend, entityType: "beacon" });
    updateSmoothedEntityCollection(rivalProjectiles, dt, { positionBlend, velocityBlend, tickLife: true, maxAge: 0.12, snapDistance: 520, entityType: "rivalProjectile" });
    updateSmoothedEntityCollection(techPickups, dt, { positionBlend, velocityBlend, tickLife: true, tickRotation: true, maxAge: 0.18, snapDistance: 520, entityType: "techPickup" });
    updateSmoothedEntityCollection(healthPickups, dt, { positionBlend, velocityBlend, tickLife: true, maxAge: 0.18, snapDistance: 520, entityType: "healthPickup" });
  }

  function updateFollowerGadgetPrediction(dt) {
    if (!isSharedWorldFollower()) {
      return;
    }

    const snapshot = buildPersistentPayload(false);
    const state = localPartyGadgetState(snapshot.player);
    if (!state) {
      releaseMissingLocalPartyPhysicsSessions(new Set(), "inactive");
      return;
    }

    const now = performance.now();
    const controlledBodyIds = new Set();
    const activeEntityKeys = new Set();
    const predictionState = state;
    const authorityOptions = {
      actor: snapshot.player,
      mode: state.mode,
      rangeFactor: state.rangeFactor,
      active: state.active
    };
    if (state.landedBodyId && (state.left || state.right)) {
      const body = bodyById(state.landedBodyId);
      const direction = state.left ? 1 : -1;
      const strengthFactor = state.left ? state.suckFactor : state.blowFactor;
      if (applyGadgetThrustToBody(body, state.aimWorld, direction, dt, strengthFactor, state.actor ? { x: state.actor.x, y: state.actor.y } : null)) {
        markSurvivalCampBodyMovedByPlayer(body, state.playerId || state.actor && state.actor.id || "");
        integrateFollowerPredictedEntity(body, dt);
        controlledBodyIds.add(body.id);
        markFollowerPredictedParticle(body, now);
        markLocalPartyPhysicsSession("particle", body, now, authorityOptions);
        activeEntityKeys.add(partyEntityKey("particle", body.id));
      }
    }

    for (const particle of particles) {
      if (!partyGadgetCanAffectParticle(state, particle)) {
        continue;
      }
      if (!gadgetStateMayReachTarget(predictionState, particle, 24)) {
        continue;
      }

      const probe = partyGadgetParticleProbe(predictionState, particle, { padding: 24 });
      let forcePredicted = false;
      let bucketPredicted = false;
      if (state.active && probe.force) {
        forcePredicted = applyActorGadgetForces(particle, predictionState, dt) || forcePredicted;
      }
      if (forcePredicted) {
        integrateFollowerPredictedEntity(particle, dt);
      }
      if (probe.bucket) {
        bucketPredicted = resolveActorFunnelBucket(particle, predictionState, dt) || bucketPredicted;
      }
      if (forcePredicted || bucketPredicted) {
        markSurvivalCampBodyMovedByPlayer(particle, state.playerId || state.actor && state.actor.id || "");
        controlledBodyIds.add(particle.id);
        markFollowerPredictedParticle(particle, now);
      }
      if (forcePredicted) {
        markLocalPartyPhysicsSession("particle", particle, now, authorityOptions);
        activeEntityKeys.add(partyEntityKey("particle", particle.id));
      }
    }

    const predictPickup = (type, pickup) => {
      if (!pickup) {
        return;
      }
      const key = partyEntityKey(type, pickup.id);
      if (!gadgetStateMayReachTarget(predictionState, pickup, 18)) {
        return;
      }
      const probe = partyGadgetParticleProbe(predictionState, pickup, { padding: 18 });
      if (!state.active || !probe.force) {
        return;
      }
      if (applyActorGadgetForces(pickup, predictionState, dt, { captureInFunnel: false, pullTowardActor: type === "techPickup" })) {
        integrateFollowerPredictedEntity(pickup, dt);
        markLocalPartyPhysicsSession(type, pickup, now, authorityOptions);
        if (key) {
          activeEntityKeys.add(key);
        }
      }
    };

    for (const pickup of techPickups) {
      predictPickup("techPickup", pickup);
    }
    for (const pickup of healthPickups) {
      predictPickup("healthPickup", pickup);
    }

    releaseMissingLocalPartyPhysicsSessions(activeEntityKeys, "inactive");
    resolveFollowerControlledBodyCollisions(controlledBodyIds);
  }

  function resolveFollowerControlledBodyCollisions(controlledBodyIds) {
    if (!controlledBodyIds || !controlledBodyIds.size) {
      return;
    }

    for (const bodyId of controlledBodyIds) {
      const body = bodyById(bodyId);
      if (!body || !body.tier || !body.tier.solid) {
        continue;
      }

      for (const other of particles) {
        if (!other || other.id === body.id || !other.tier || !other.tier.solid) {
          continue;
        }

        const dx = body.x - other.x;
        const dy = body.y - other.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = solidBodyContactRadius(body) + solidBodyContactRadius(other);
        if (dist >= minDist) {
          continue;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        body.x += nx * overlap;
        body.y += ny * overlap;

        const relativeVelocity = (body.vx - other.vx) * nx + (body.vy - other.vy) * ny;
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.92;
          const pointX = body.x - nx * bodyAngularInertiaRadius(body);
          const pointY = body.y - ny * bodyAngularInertiaRadius(body);
          applyBodyVelocityChangeAtPoint(body, nx * impulse, ny * impulse, pointX, pointY, bodyConstraintTorqueResponse);
          const tangentX = -ny;
          const tangentY = nx;
          const tangentVelocity = body.vx * tangentX + body.vy * tangentY;
          applyBodyVelocityChangeAtPoint(body, -tangentX * tangentVelocity * 0.12, -tangentY * tangentVelocity * 0.12, pointX, pointY, bodyConstraintTorqueResponse);
        }
      }
    }
  }

  function updateSmoothedEntityCollection(collection, dt, options) {
    const positionBlend = options && Number.isFinite(Number(options.positionBlend)) ? Number(options.positionBlend) : 1 - Math.pow(0.00035, dt);
    const velocityBlend = options && Number.isFinite(Number(options.velocityBlend)) ? Number(options.velocityBlend) : 1 - Math.pow(0.0015, dt);
    const maxAge = options && Number.isFinite(Number(options.maxAge)) ? Number(options.maxAge) : 0.18;
    const snapDistance = options && Number.isFinite(Number(options.snapDistance)) ? Number(options.snapDistance) : 900;
    const entityType = options && options.entityType ? normalizePartyEntityType(options.entityType) : "";
    const now = performance.now();

    for (const entity of collection) {
      if (entityType && hasLocalPartyPhysicsSession(entityType, entity.id, now)) {
        continue;
      }
      if (!Number.isFinite(entity._partyTargetX) || !Number.isFinite(entity._partyTargetY)) {
        continue;
      }

      if (options && options.tickLife && Number.isFinite(Number(entity.life))) {
        entity.life = Math.max(0, finiteOr(entity.life, 0) - dt);
      }
      if (options && options.tickRotation) {
        entity.rotation = finiteOr(entity.rotation, 0) + (1.4 + Math.sin(finiteOr(entity.wobble, 0)) * 0.4) * dt;
      }

      const age = Math.max(0, Math.min(maxAge, (now - finiteOr(entity._partyTargetReceivedAt, now)) / 1000));
      const targetVx = finiteOr(entity._partyTargetVx, entity.vx);
      const targetVy = finiteOr(entity._partyTargetVy, entity.vy);
      const targetX = finiteOr(entity._partyTargetX, entity.x) + targetVx * age;
      const targetY = finiteOr(entity._partyTargetY, entity.y) + targetVy * age;
      const error = Math.hypot(targetX - entity.x, targetY - entity.y);

      if (error > Math.max(snapDistance, finiteOr(entity.radius, 1) * 5)) {
        entity.x = targetX;
        entity.y = targetY;
        entity.vx = targetVx;
        entity.vy = targetVy;
        continue;
      }

      entity.vx += (targetVx - entity.vx) * velocityBlend;
      entity.vy += (targetVy - entity.vy) * velocityBlend;
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
      entity.x += (targetX - entity.x) * positionBlend;
      entity.y += (targetY - entity.y) * positionBlend;
    }
  }
