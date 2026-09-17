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

  function wakeSurvivalCampFromPlayerBodyMerge(absorber, absorbed, scoredBodyIds) {
    if (typeof wakeSurvivalCampFromBody !== "function") {
      return false;
    }
    if (absorbed && absorbed.survivalCampBody && scoredBodyIds.has(absorber && absorber.id)) {
      return wakeSurvivalCampFromBody(absorbed, player.id || "", { allowScoredBody: true });
    }
    if (absorber && absorber.survivalCampBody && scoredBodyIds.has(absorbed && absorbed.id)) {
      return wakeSurvivalCampFromBody(absorber, player.id || "", { allowScoredBody: true });
    }
    return false;
  }

  function mergeParticles() {
    let mergesThisFrame = 0;
    let restartScan = true;

    while (restartScan) {
      restartScan = false;
      const maxRadius = particles.reduce((largest, particle) => Math.max(largest, finiteOr(particle && particle.radius, 0)), 0);
      const order = particles
        .map((particle, index) => ({ index, x: finiteOr(particle && particle.x, 0) }))
        .sort((a, b) => a.x - b.x);
      const allowBounceResolution = mergesThisFrame === 0;

      mergeScan:
      for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
        const i = order[orderIndex].index;
        const a = particles[i];
        if (!a) {
          continue;
        }
        const maxDx = a.radius + maxRadius;

        for (let nextIndex = orderIndex + 1; nextIndex < order.length; nextIndex += 1) {
          const j = order[nextIndex].index;
          const b = particles[j];
          if (!b || i === j) {
            continue;
          }
          if (b.x - a.x > maxDx) {
            break;
          }
          if (shouldSkipParticleMerge(a, b)) {
            continue;
          }

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = a.radius + b.radius;
          if (Math.abs(dy) > minDist) {
            continue;
          }

          if (dx * dx + dy * dy <= minDist * minDist) {
            const absorbingPair = absorbingCollisionPair(a, b);
            if (!absorbingPair || shouldOrbitPreventMerge(a, b)) {
              if (!absorbingPair) {
                emitBodyCrashDebris(a, b, dx, dy);
              }
              if (allowBounceResolution) {
                resolveBodyBounce(a, b, dx, dy, minDist);
              }
              continue;
            }

            const absorberIndex = particles.indexOf(absorbingPair.absorber);
            const absorbedIndex = particles.indexOf(absorbingPair.absorbed);
          if (absorberIndex < 0 || absorbedIndex < 0 || absorberIndex === absorbedIndex) {
            continue;
          }

          const scoredBodyIds = connectedScoredBodyIds();
          const absorberIsScoredBody = scoredBodyIds.has(absorbingPair.absorber.id);
          wakeSurvivalCampFromPlayerBodyMerge(absorbingPair.absorber, absorbingPair.absorbed, scoredBodyIds);
          recordPlayerAbsorption(absorbingPair.absorber, absorbingPair.absorbed);
          const mass = absorbingPair.absorber.mass + absorbingPair.absorbed.mass;
          const previousTier = a.tier.threshold >= b.tier.threshold ? a.tier : b.tier;
          let tier = tierForMass(mass);
          const stellarSource = stellarGrowthSourceForMerge(a, b, absorbingPair.absorber);
          const previousStellarMass = Math.max(0, finiteOr(stellarSource && stellarSource.mass, 0));
          const gainedStellarMass = Math.max(0, mass - previousStellarMass);
          const graduated = tier.threshold > previousTier.threshold || (mass >= stellarEvolutionEndThreshold && !stellarOutcomeTierNames.includes(previousTier.name));
          const becameStar = tier.name === "star" && previousTier.name !== "star";
          const visualSource = graduated ? dominantMergeBody(a, b) : absorbingPair.absorber;
          const color = graduated ? mixColor(a.color, b.color, a.mass, b.mass) : absorbingPair.absorber.color;
          const absorbedParticleLightColor = absorbingPair.absorbed.color || color;
          const previousMergeRadius = Math.max(finiteOr(a.radius, 0), finiteOr(b.radius, 0));
          normalizeBodyEnergy(a);
          normalizeBodyEnergy(b);
          const storedEnergy = clamp(finiteOr(a.energy, 0), 0, Math.max(1, finiteOr(a.maxEnergy, 0)))
            + clamp(finiteOr(b.energy, 0), 0, Math.max(1, finiteOr(b.maxEnergy, 0)));
          const merged = {
            id: graduated ? nextParticleId++ : visualSource.id,
            x: (a.x * a.mass + b.x * b.mass) / mass,
            y: (a.y * a.mass + b.y * b.mass) / mass,
            vx: (a.vx * a.mass + b.vx * b.mass) / mass,
            vy: (a.vy * a.mass + b.vy * b.mass) / mass,
            mass,
            radius: radiusFromMass(mass),
            tier,
            rotation: graduated
              ? (finiteOr(a.rotation, 0) * a.mass + finiteOr(b.rotation, 0) * b.mass) / mass
              : finiteOr(visualSource.rotation, 0),
            angularVelocity: clamp(
              (finiteOr(a.angularVelocity, 0) * a.mass + finiteOr(b.angularVelocity, 0) * b.mass) / mass,
              -bodyMaxAngularSpeed,
              bodyMaxAngularSpeed
            ),
            textureSeed: graduated
              ? (a.textureSeed * a.mass + b.textureSeed * b.mass) / mass + mass * 0.73
              : visualSource.textureSeed,
            color,
            wobble: graduated ? randomRange(0, Math.PI * 2) : visualSource.wobble,
            pulse: graduated ? randomRange(0.8, 1.25) : visualSource.pulse,
            starBirthAge: becameStar
              ? 0
              : tier.name === "star"
                ? finiteOr(visualSource.starBirthAge, starBirthTransitionDuration)
                : 0,
            starEmissionAccumulator: tier.name === "star"
              ? finiteOr(visualSource.starEmissionAccumulator, 0)
              : 0
          };
          applySurvivalCampMergeState(merged, [visualSource, absorbingPair.absorber, absorbingPair.absorbed, a, b], {
            clearCampState: absorberIsScoredBody
          });
          if (graduated) {
            merged.promotionStartedAt = performance.now();
            merged.promotionDuration = bodyPromotionEffectDuration;
            merged.promotionColor = shadeColor(color, 88);
            merged.promotedFromTier = previousTier.name;
            merged.promotedToTier = tier.name;
          }
          copyStellarGrowthState(merged, stellarSource);
          updateStellarGrowthForMerge(merged, previousStellarMass, gainedStellarMass, performance.now() / 1000);
          finalizeStellarOutcomeTier(merged);
          tier = merged.tier;
          if (tier.threshold > previousTier.threshold) {
            merged.radius = Math.max(merged.radius, previousMergeRadius * bodyTierEvolutionSizeScale);
          }
          normalizeBodyEnergy(merged);
          merged.energy = clamp(storedEnergy, 0, merged.maxEnergy || 0);

          if (player.landed && (player.landed.bodyId === a.id || player.landed.bodyId === b.id)) {
            if (isStarBody(merged)) {
              ejectActorFromStarBirth(player, merged, playerFootOffset);
            } else {
              player.landed.bodyId = merged.id;
              player.landed.angle = Math.atan2(player.y - merged.y, player.x - merged.x);
            }
          }

          for (const rival of rivals) {
            if (rival.landed && (rival.landed.bodyId === a.id || rival.landed.bodyId === b.id)) {
              if (isStarBody(merged)) {
                ejectActorFromStarBirth(rival, merged, rivalFootOffset);
                rival.residentTier = merged.tier.name;
              } else {
                rival.landed.bodyId = merged.id;
                rival.landed.angle = Math.atan2(rival.y - merged.y, rival.x - merged.x);
                rival.residentTier = merged.tier.name;
                applyRivalSurfaceConstraint(rival);
              }
            }
          }

          const destroyedStructureCount = remapOrDestroyMergedBodyStructures(absorbingPair.absorber, absorbingPair.absorbed, merged);
          if (becameStar) {
            emitStarFormationBurst(merged, destroyedStructureCount);
            maybeNotifyText(
              destroyedStructureCount
                ? "Planet collapsed into a star. Structures burned away."
                : "Planet collapsed into a star.",
              { groupKey: "star-formed" }
            );
          } else if (stellarOutcomeTierNames.includes(tier.name) && !stellarOutcomeTierNames.includes(previousTier.name)) {
            maybeNotifyText("Star collapsed into " + tier.article + " " + tier.name + ".", { groupKey: "stellar-branch-formed" });
          }

          sparks.push({
            x: merged.x,
            y: merged.y,
            radius: merged.radius * 1.8,
            color: absorbedParticleLightColor,
            life: 0.42,
            maxLife: 0.42
          });
          if (graduated) {
            sparks.push({
              x: merged.x,
              y: merged.y,
              radius: Math.max(merged.radius * 2.65, 58),
              color: merged.promotionColor || color,
              life: bodyPromotionEffectDuration,
              maxLife: bodyPromotionEffectDuration,
              promotionBurst: true
            });
          }

          particles[absorberIndex] = merged;
          particles.splice(absorbedIndex, 1);
          playSound(graduated ? "milestone" : "merge", {
            volume: clamp(0.45 + Math.log2(Math.max(1, mass)) * 0.08, 0.45, 1.1)
          });
          recordObjectiveCreatedBodyMass(mass);
          maybeNotifyTier(tier, previousTier);
          mergesThisFrame += 1;
          if (clusternautsTestConfig) {
            clusternautsTestCounters.particleMerges += 1;
          }
          if (mergesThisFrame > 8) {
            return;
          }
          restartScan = true;
          break mergeScan;
        }
      }
    }
    }
  }

  function emitBodyCrashDebris(a, b, dx, dy) {
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
    emitted += shedCrashParticlesFromBody(a, -nx, -ny, lossCount);
    emitted += shedCrashParticlesFromBody(b, nx, ny, lossCount);
    return emitted;
  }

  function shedCrashParticlesFromBody(body, nx, ny, requestedLoss) {
    if (!body || body.tier && body.tier.name === "particle") {
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
    const color = ejectedParticleColor(body);
    for (let i = 0; i < count; i += 1) {
      const spread = count > 1 ? (i / (count - 1) - 0.5) : 0;
      const particle = createParticle(
        finiteOr(body.x, 0) + nx * contactRadius + sideX * spread * 22,
        finiteOr(body.y, 0) + ny * contactRadius + sideY * spread * 22,
        1,
        color
      );
      const burst = randomRange(70, 170);
      particle.vx = finiteOr(body.vx, 0) * 0.35 + nx * burst + sideX * randomRange(-58, 58);
      particle.vy = finiteOr(body.vy, 0) * 0.35 + ny * burst + sideY * randomRange(-58, 58);
      particle.spawnAge = 0;
      particle.ufoSapSourceGraceTimer = Math.max(finiteOr(particle.ufoSapSourceGraceTimer, 0), 0.45);
      particle.ufoExtractedFromId = body.id;
      particles.push(particle);
    }

    body.mass = Math.max(1, finiteOr(body.mass, 1) - count);
    body.tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    normalizeBodyEnergy(body);
    return count;
  }

  function structureTouchesBody(structure, bodyId) {
    return Boolean(structure && (structure.bodyId === bodyId || structure.linkedBodyId === bodyId));
  }

  function remapOrDestroyMergedBodyStructures(absorber, absorbed, merged) {
    if (isStarBody(merged)) {
      for (const structure of structures) {
        if (!structure) {
          continue;
        }
        if (structure.bodyId === absorber.id || structure.bodyId === absorbed.id) {
          structure.bodyId = merged.id;
        }
        if (structure.linkedBodyId === absorber.id || structure.linkedBodyId === absorbed.id) {
          structure.linkedBodyId = merged.id;
        }
      }
      return destroyStructuresForStarBody(merged);
    }

    let destroyed = 0;
    for (let index = structures.length - 1; index >= 0; index -= 1) {
      const structure = structures[index];
      if (!structure) {
        continue;
      }
      if (structureTouchesBody(structure, absorbed.id)) {
        dropStructureTechPickups(structure);
        structures.splice(index, 1);
        destroyed += 1;
        continue;
      }
      if (structure.bodyId === absorber.id) {
        structure.bodyId = merged.id;
      }
      if (structure.linkedBodyId === absorber.id) {
        structure.linkedBodyId = merged.id;
      }
      if (structureTouchesBody(structure, merged.id)) {
        applyStructureSurfaceConstraint(structure);
      }
    }
    return destroyed;
  }

  function updateSparks(dt) {
