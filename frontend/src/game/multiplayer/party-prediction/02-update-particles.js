  function updateParticles(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const landedBodyId = player.landed ? player.landed.bodyId : null;
    const localGadgetState = localGadgetStateForFrame(aim, funnel);
    const suctionActive = localGadgetState.active;
    const vacuumBucketActive = hasVacuumBucketCollider();
    const partyGadgetStates = activePartyGadgetStates();
    const particleSpawnAnchors = activeParticleSpawnAnchors();
    const activeTargetParticles = activeParticleTargetCount(particleSpawnAnchors);
    const maxParticleBudget = activeTargetParticles;
    const playfieldFill = useParticlePlayfieldFill();
    const localFillRadius = playfieldFill ? particlePlayfieldRadius() : particleDensityRadius();

    pruneInvalidParticles();
    let ambientParticleCount = countAmbientParticles();
    spawnTimer -= dt;
    while (spawnTimer <= 0) {
      const underdense = mostUnderdenseParticleAnchor(particleSpawnAnchors);
      const needsLocalFill = underdense.score > 0.5 && underdense.localCount < underdense.localTarget;
      if (ambientParticleCount >= activeTargetParticles && (!needsLocalFill || ambientParticleCount >= maxParticleBudget)) {
        const recycled = needsLocalFill && playfieldFill ? farthestRecyclableAmbientParticle(particleSpawnAnchors, localFillRadius * 1.18) : null;
        if (!recycled || !recycleParticleNearPlayer(recycled, underdense.anchor, { localFill: true, playfieldFill: true, anchors: particleSpawnAnchors })) {
          break;
        }
        spawnTimer += 0.035;
        continue;
      }
      spawnParticleNearPlayer(needsLocalFill ? underdense.anchor : randomParticleSpawnAnchor(particleSpawnAnchors), {
        localFill: needsLocalFill,
        playfieldFill: needsLocalFill && playfieldFill,
        anchors: particleSpawnAnchors
      });
      ambientParticleCount += 1;
      const deficit = clamp((activeTargetParticles - ambientParticleCount) / Math.max(1, activeTargetParticles), 0, 1);
      spawnTimer += needsLocalFill ? 0.035 : 0.11 - deficit * 0.07;
    }

    if (isPartySessionActive() || multiplayer.remoteUniverses.size > 0) {
      applyLocalBodyGravity(dt);
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      const isLandedBody = particle.id === landedBodyId;
      decayGadgetPullContactIntent(particle, dt);
      if (particle.ufoSapTimer !== undefined) {
        particle.ufoSapTimer = Math.max(0, finiteOr(particle.ufoSapTimer, 0) - dt);
      }
      if (particle.ufoSapSourceGraceTimer !== undefined) {
        particle.ufoSapSourceGraceTimer = Math.max(0, finiteOr(particle.ufoSapSourceGraceTimer, 0) - dt);
      }
      particle.spawnAge = Math.min(
        particleSpawnTransitionDuration,
        Math.max(0, finiteOr(particle.spawnAge, particleSpawnTransitionDuration)) + dt
      );
      if (isStarBody(particle)) {
        ambientParticleCount += updateStarParticleEmission(particle, dt, maxParticleBudget);
      }

      if (
        suctionActive &&
        partyGadgetCanAffectParticle(localGadgetState, particle) &&
        gadgetStateMayReachTarget(localGadgetState, particle, 0)
      ) {
        applyActorGadgetForces(particle, localGadgetState, dt);
        drainBodyWithVisciousVacuum(localGadgetState, particle, dt);
      }
      for (const state of partyGadgetStates) {
        if (partyGadgetCanAffectParticle(state, particle) && state.active && gadgetStateMayReachTarget(state, particle, 0)) {
          applyActorGadgetForces(particle, state, dt);
          drainBodyWithVisciousVacuum(state, particle, dt);
        }
      }

      if (particle.gadgetStabilized && length(particle.vx, particle.vy) > gadgetStabilizedBreakSpeed) {
        particle.gadgetStabilized = false;
      }

      applyOrbitCaptureForces(particle, particles, dt);
      if (!particle.tier.solid) {
        particle.vx += Math.sin(particle.wobble + performance.now() * 0.0007) * 4 * dt;
        particle.vy += Math.cos(particle.wobble * 1.7 + performance.now() * 0.0006) * 4 * dt;
        particle.vx *= Math.pow(0.82, dt);
        particle.vy *= Math.pow(0.82, dt);
      }
      if (particle.gadgetStabilized && particle.tier.solid && length(particle.vx, particle.vy) <= gadgetStabilizedBreakSpeed) {
        particle.vx = 0;
        particle.vy = 0;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      maybeWakeSurvivalCampFromMovedBody(particle);
      integrateBodyAngularMotion(particle, dt);
      if (
        vacuumBucketActive &&
        partyGadgetCanAffectParticle(localGadgetState, particle) &&
        gadgetStateMayReachTarget(localGadgetState, particle, 0)
      ) {
        resolveActorFunnelBucket(particle, localGadgetState, dt);
      }
      for (const state of partyGadgetStates) {
        if (state.bucketActive && partyGadgetCanAffectParticle(state, particle) && gadgetStateMayReachTarget(state, particle, 0)) {
          resolveActorFunnelBucket(particle, state, dt);
        }
      }

      const fromPlayer = nearestPartyAnchorDistance(particle.x, particle.y, particleSpawnAnchors);
      const cullDistance = Math.max(width, height) * 1.85 + 1600;
      if (!particle.tier.solid && fromPlayer > cullDistance && ambientParticleCount > activeTargetParticles * 0.82) {
        particles.splice(i, 1);
        if (isAmbientDensityParticle(particle)) {
          ambientParticleCount -= 1;
        }
      }
    }

    pruneExcessAmbientParticles(particleSpawnAnchors, maxParticleBudget);

    mergeParticles();
    resolvePlayerBodyCollisions();
  }

  function canLocalGravityClusterBody(body) {
    return Boolean(
      body &&
      body.tier &&
      body.tier.threshold <= thresholdForTierName("asteroid") &&
      !isProtectedStrategicBody(body)
    );
  }

  function localGravityBucketKey(x, y, cellSize) {
    return Math.floor(x / cellSize) + ":" + Math.floor(y / cellSize);
  }

  function applyLocalBodyGravity(dt) {
    if (!Array.isArray(particles) || particles.length < 2 || dt <= 0) {
      return;
    }

    const cellSize = localBodyGravityRadius;
    const buckets = new Map();
    for (const body of particles) {
      if (!canLocalGravityClusterBody(body)) {
        continue;
      }
      const key = localGravityBucketKey(body.x, body.y, cellSize);
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(body);
    }

    const checked = new Set();
    for (const a of particles) {
      if (!canLocalGravityClusterBody(a)) {
        continue;
      }
      const cellX = Math.floor(a.x / cellSize);
      const cellY = Math.floor(a.y / cellSize);
      for (let gx = cellX - 1; gx <= cellX + 1; gx += 1) {
        for (let gy = cellY - 1; gy <= cellY + 1; gy += 1) {
          const bucket = buckets.get(gx + ":" + gy);
          if (!bucket) {
            continue;
          }
          for (const b of bucket) {
            if (!b || a === b || !canLocalGravityClusterBody(b)) {
              continue;
            }
            const low = Math.min(a.id, b.id);
            const high = Math.max(a.id, b.id);
            const pairKey = low + ":" + high;
            if (checked.has(pairKey)) {
              continue;
            }
            checked.add(pairKey);
            if (areBodiesTetherConnected(a, b)) {
              continue;
            }
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy);
            const reach = localBodyGravityRadius + Math.max(0, finiteOr(a.radius, 0) + finiteOr(b.radius, 0)) * 0.45;
            if (distance <= 0.001 || distance > reach) {
              continue;
            }
            const closeness = 1 - distance / reach;
            const totalMass = Math.max(1, finiteOr(a.mass, 1) + finiteOr(b.mass, 1));
            const force = Math.min(localBodyGravityMaxAcceleration, localBodyGravityForce * closeness * closeness);
            const nx = dx / distance;
            const ny = dy / distance;
            a.vx += nx * force * clamp(finiteOr(b.mass, 1) / totalMass, 0.12, 0.88) * dt;
            a.vy += ny * force * clamp(finiteOr(b.mass, 1) / totalMass, 0.12, 0.88) * dt;
            b.vx -= nx * force * clamp(finiteOr(a.mass, 1) / totalMass, 0.12, 0.88) * dt;
            b.vy -= ny * force * clamp(finiteOr(a.mass, 1) / totalMass, 0.12, 0.88) * dt;
          }
        }
      }
    }
  }

  function dominantMergeBody(a, b) {
    if (a.tier.threshold !== b.tier.threshold) {
      return a.tier.threshold > b.tier.threshold ? a : b;
    }

    return a.mass >= b.mass ? a : b;
  }

  function tierIndex(tier) {
    return Math.max(0, bodyTiers.findIndex((candidate) => candidate.name === tier.name));
  }

  function isProtectedStrategicBody(particle) {
    return particle.tier.threshold >= thresholdForTierName("moon");
  }

  function isGrowthMatter(particle) {
    return particle.tier.name === "particle" || particle.tier.name === "rock" || particle.tier.name === "boulder";
  }

  function isBoulderBody(particle) {
    return particle && particle.tier && particle.tier.name === "boulder";
  }

  function isAsteroidBody(particle) {
    return particle && particle.tier && particle.tier.name === "asteroid";
  }

  function isUfoBeamCargo(particle) {
    return particle && finiteOr(particle.ufoSapTimer, 0) > 0;
  }

  function isFreshUfoSapSourcePair(a, b) {
    return Boolean(
      a &&
      b &&
      (
        (finiteOr(a.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(a.ufoExtractedFromId, 0))) === b.id) ||
        (finiteOr(b.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(b.ufoExtractedFromId, 0))) === a.id)
      )
    );
  }

  function canUfoTractorAffectParticle(particle) {
    if (!particle || !particle.tier) {
      return false;
    }

    return (
      particle.tier.name === "particle" ||
      particle.tier.name === "rock" ||
      isBoulderBody(particle) ||
      isAsteroidOrLarger(particle)
    );
  }

  function canUfoAbsorbParticle(ufo, particle) {
    return Boolean(
      particle &&
      particle.tier &&
      !particle.survivalCampBody &&
      (
        particle.tier.name === "particle" ||
        particle.tier.name === "rock" ||
        (ufo && ufo.isBoss && isBoulderBody(particle))
      )
    );
  }

  function shouldUfoImpactBody(ufo, particle) {
    return ufo && ufo.isBoss ? isAsteroidBody(particle) : isBoulderBody(particle);
  }

  function shouldUfoSiphonBody(ufo, particle) {
    if (ufo && ufo.isBoss) {
      return isAsteroidOrLarger(particle) && !isAsteroidBody(particle);
    }
    return isAsteroidOrLarger(particle);
  }

  function shouldSkipParticleMerge(a, b) {
    return isFreshUfoSapSourcePair(a, b);
  }

  function isMergeBlockingTether(structure) {
    return Boolean(
      structure &&
      structure.type === "tether" &&
      finiteOr(structure.health, structureMaxHealth(structure.type)) > 0 &&
      !isStructureDisabled(structure) &&
      structure.bodyId &&
      structure.linkedBodyId &&
      structure.bodyId !== structure.linkedBodyId
    );
  }

  function areBodiesTetherConnected(a, b) {
    if (!a || !b || a.id === b.id) {
      return false;
    }

    const targetId = b.id;
    const pending = [a.id];
    const visited = new Set(pending);

    while (pending.length) {
      const bodyId = pending.pop();

      for (const structure of structures) {
        if (!isMergeBlockingTether(structure)) {
          continue;
        }

        let nextBodyId = 0;
        if (structure.bodyId === bodyId) {
          nextBodyId = structure.linkedBodyId;
        } else if (structure.linkedBodyId === bodyId) {
          nextBodyId = structure.bodyId;
        }

        if (!nextBodyId || visited.has(nextBodyId)) {
          continue;
        }
        if (nextBodyId === targetId) {
          return true;
        }

        visited.add(nextBodyId);
        pending.push(nextBodyId);
      }
    }

    return false;
  }

  function bodyAbsorptionTierRank(body) {
    if (!body || !body.tier) {
      return -1;
    }
    const tierName = String(body.tier.name || "");
    const bodyTierIndex = bodyTiers.findIndex((candidate) => candidate.name === tierName);
    if (bodyTierIndex >= 0) {
      return bodyTierIndex;
    }
    const stellarIndex = stellarBranchTiers.findIndex((candidate) => candidate.name === tierName);
    return stellarIndex >= 0 ? bodyTiers.length + stellarIndex : -1;
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
    if (areBodiesTetherConnected(a, b)) {
      return null;
    }

    const aCanAbsorb = canAbsorbBody(a, b);
    const bCanAbsorb = canAbsorbBody(b, a);
    if (aCanAbsorb && bCanAbsorb) {
      return a.mass >= b.mass ? { absorber: a, absorbed: b } : { absorber: b, absorbed: a };
    }
    if (aCanAbsorb) {
      return { absorber: a, absorbed: b };
    }
    if (bCanAbsorb) {
      return { absorber: b, absorbed: a };
    }
    return null;
  }

  function resolveBodyBounce(a, b, dx, dy, minDist) {
    if (clusternautsTestConfig) {
      clusternautsTestCounters.bodyBounces += 1;
    }
    const rawDist = Math.hypot(dx, dy);
    const dist = rawDist || 1;
    const nx = rawDist ? dx / dist : 1;
    const ny = rawDist ? dy / dist : 0;
    const overlap = Math.max(0, minDist - dist);
    const totalMass = Math.max(1, a.mass + b.mass);
    const aShare = clamp(b.mass / totalMass, 0.08, 0.92);
    const bShare = clamp(a.mass / totalMass, 0.08, 0.92);

    a.x -= nx * overlap * aShare;
    a.y -= ny * overlap * aShare;
    b.x += nx * overlap * bShare;
    b.y += ny * overlap * bShare;

    const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relativeVelocity < 0) {
      a.gadgetStabilized = false;
      b.gadgetStabilized = false;
      const impulse = -relativeVelocity * 0.86;
      const contactX = (a.x + b.x) * 0.5;
      const contactY = (a.y + b.y) * 0.5;
      applyBodyVelocityChangeAtPoint(a, -nx * impulse * aShare, -ny * impulse * aShare, contactX, contactY, bodyConstraintTorqueResponse);
      applyBodyVelocityChangeAtPoint(b, nx * impulse * bShare, ny * impulse * bShare, contactX, contactY, bodyConstraintTorqueResponse);
    }
  }
