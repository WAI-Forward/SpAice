  function applyOrbitCaptureForces(body, bodies, dt) {
    if (!body || !Array.isArray(bodies) || dt <= 0) {
      return false;
    }
    const capture = findOrbitCapture(body, bodies);
    if (!capture) {
      if (finiteOr(body.orbitGrace, 0) > 0) {
        body.orbitGrace = Math.max(0, finiteOr(body.orbitGrace, 0) - dt);
      } else if (finiteOr(body.orbitStrength, 0) > 0) {
        clearOrbitState(body);
      }
      return false;
    }

    const host = capture.host;
    const distance = capture.distance || 1;
    const nx = capture.dx / distance;
    const ny = capture.dy / distance;
    const tangentX = -ny;
    const tangentY = nx;
    const relVx = finiteOr(body.vx, 0) - finiteOr(host.vx, 0);
    const relVy = finiteOr(body.vy, 0) - finiteOr(host.vy, 0);
    const radialSpeed = relVx * nx + relVy * ny;
    const tangentVelocity = relVx * tangentX + relVy * tangentY;
    const relativeSpeed = Math.hypot(relVx, relVy);
    const inwardSpeed = Math.max(0, -radialSpeed);
    const retainedByHost = Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0))) === host.id;
    const breachSpeed = ORBIT_CAPTURE_STRONG_INWARD_SPEED + (retainedByHost ? 92 : 0);
    if (capture.delta < 0 && inwardSpeed > breachSpeed) {
      clearOrbitState(body);
      return false;
    }
    const radialCloseness = clamp(1 - Math.abs(capture.delta) / Math.max(1, capture.band * 2.35), 0, 1);
    const speedFactor = clamp(1 - Math.max(0, relativeSpeed - 90) / ORBIT_CAPTURE_MAX_RELATIVE_SPEED, 0.16, 1);
    const breachFactor = clamp(1 - Math.max(0, inwardSpeed - ORBIT_CAPTURE_STRONG_INWARD_SPEED) / 260, 0, 1);
    const massResponse = clamp(Math.pow(Math.max(1, finiteOr(host.mass, 1)) / Math.max(1, finiteOr(body.mass, 1)), 0.18), 0.28, 1.85);
    const strength = radialCloseness * speedFactor * (0.22 + breachFactor * 0.78);
    if (strength <= 0.012) {
      return false;
    }

    const direction = orbitDirectionForBody(body, host, nx, ny, relVx, relVy);
    const desiredTangential = orbitalSpeedForRing(host, capture.ringIndex, capture.radius) * direction;
    const radialAccel = clamp(
      -capture.delta * ORBIT_RADIAL_SPRING - radialSpeed * ORBIT_RADIAL_DAMPING,
      -ORBIT_MAX_ACCELERATION,
      ORBIT_MAX_ACCELERATION
    );
    const tangentAccel = clamp(
      (desiredTangential - tangentVelocity) * ORBIT_TANGENTIAL_DAMPING,
      -ORBIT_MAX_ACCELERATION,
      ORBIT_MAX_ACCELERATION
    );
    const accelScale = strength * massResponse;
    body.vx += (nx * radialAccel + tangentX * tangentAccel) * accelScale * dt;
    body.vy += (ny * radialAccel + tangentY * tangentAccel) * accelScale * dt;
    body.orbitHostId = host.id;
    body.orbitRingIndex = capture.ringIndex;
    body.orbitDirection = direction;
    body.orbitStrength = clamp(finiteOr(body.orbitStrength, 0) + strength * dt * 4.4, 0, 1);
    body.orbitGrace = ORBIT_RETENTION_SECONDS;
    return true;
  }

  function shouldOrbitPreventMerge(a, b) {
    const first = bestOrbitRingForBody(a, b);
    const second = bestOrbitRingForBody(b, a);
    const capture = first && (!second || first.score <= second.score) ? first : second;
    if (!capture) {
      return false;
    }
    const orbiter = capture.host === a ? b : a;
    const host = capture.host;
    const distance = capture.distance || 1;
    const nx = capture.dx / distance;
    const ny = capture.dy / distance;
    const relVx = finiteOr(orbiter.vx, 0) - finiteOr(host.vx, 0);
    const relVy = finiteOr(orbiter.vy, 0) - finiteOr(host.vy, 0);
    const inwardSpeed = Math.max(0, -(relVx * nx + relVy * ny));
    const orbitingHost = Math.max(0, Math.floor(finiteOr(orbiter.orbitHostId, 0))) === host.id;
    const threshold = ORBIT_CAPTURE_STRONG_INWARD_SPEED + (orbitingHost ? 92 : 0);
    return inwardSpeed < threshold;
  }

  function resolveOrbitPreventedMerge(a, b) {
    const first = bestOrbitRingForBody(a, b);
    const second = bestOrbitRingForBody(b, a);
    const capture = first && (!second || first.score <= second.score) ? first : second;
    if (!capture) {
      return false;
    }
    const host = capture.host;
    const orbiter = host === a ? b : a;
    const dx = finiteOr(orbiter.x, 0) - finiteOr(host.x, 0);
    const dy = finiteOr(orbiter.y, 0) - finiteOr(host.y, 0);
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const minDistance = solidContactRadius(host) + Math.max(1, finiteOr(orbiter.radius, radiusFromMass(orbiter.mass))) + 3;
    if (distance < minDistance) {
      orbiter.x = finiteOr(host.x, 0) + nx * minDistance;
      orbiter.y = finiteOr(host.y, 0) + ny * minDistance;
    }
    const radialSpeed = (finiteOr(orbiter.vx, 0) - finiteOr(host.vx, 0)) * nx + (finiteOr(orbiter.vy, 0) - finiteOr(host.vy, 0)) * ny;
    if (radialSpeed < 0) {
      orbiter.vx -= nx * radialSpeed * 1.08;
      orbiter.vy -= ny * radialSpeed * 1.08;
    }
    return true;
  }

  function starParticleEmissionRate(body) {
    return STAR_PARTICLE_EMISSION_BASE_RATE + Math.max(0, finiteOr(body && body.radius, 0)) * STAR_PARTICLE_EMISSION_RADIUS_SCALE;
  }

  function isLinkedStructureType(type) {
    return type === "tether" || type === "bridge";
  }

  function isActiveLinkedBodyStructure(structure) {
    return Boolean(
      structure &&
      isLinkedStructureType(structure.type) &&
      finiteOr(structure.health, 0) > 0 &&
      !isStructureDisabled(structure) &&
      structure.bodyId &&
      structure.linkedBodyId
    );
  }

  function isBodyAttachedToBodyByLinkedStructures(world, targetBody, rootBodyId) {
    const targetBodyId = targetBody && targetBody.id;
    const cleanRootBodyId = Math.max(0, Math.floor(finiteOr(rootBodyId, 0)));
    if (!world || !targetBodyId || !cleanRootBodyId || targetBodyId === cleanRootBodyId) {
      return false;
    }

    const structures = Array.isArray(world.structures) ? world.structures : [];
    const visited = new Set([cleanRootBodyId]);
    const queue = [cleanRootBodyId];
    for (let i = 0; i < queue.length; i += 1) {
      const bodyId = queue[i];
      for (const structure of structures) {
        if (!isActiveLinkedBodyStructure(structure)) {
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
        if (nextBodyId === targetBodyId) {
          return true;
        }
        visited.add(nextBodyId);
        queue.push(nextBodyId);
      }
    }

    return false;
  }

  function canPlayerGadgetAffectBody(world, player, body) {
    return Boolean(
      body &&
      (!player || !player.landed || (
        player.landed.bodyId !== body.id &&
        !isBodyAttachedToBodyByLinkedStructures(world, body, player.landed.bodyId)
      ))
    );
  }

  function structurePlacementThresholdForType(type) {
    return isLinkedStructureType(type) ? thresholdForTierName("boulder") : STRUCTURE_PLACEMENT_TIER_THRESHOLD;
  }

  function isStructureHostBodyForType(body, type) {
    return Boolean(body && body.tier && body.tier.name !== "star" && body.tier.threshold >= structurePlacementThresholdForType(type));
  }

  function structureBaseSurfaceOffset(structure) {
    return Math.max(0, finiteOr(structure && structure.surfaceOffset, 0));
  }

  function platingBlockTopOffset(structure) {
    return structureBaseSurfaceOffset(structure) + PLATING_BLOCK_HEIGHT;
  }

  function platingBlockHalfAngle(body, structure) {
    const centerRadius = Math.max(24, finiteOr(body.radius, radiusFromMass(body.mass)) + structureBaseSurfaceOffset(structure) + PLATING_BLOCK_HEIGHT * 0.5);
    return Math.min(Math.PI, PLATING_BLOCK_WIDTH / centerRadius / 2);
  }

  function platingBlockCoversAngle(body, structure, angle) {
    return Boolean(
      body &&
      structure &&
      structure.type === "plating-block" &&
      structure.bodyId === body.id &&
      finiteOr(structure.health, 1) > 0 &&
      Math.abs(shortestAngleDelta(finiteOr(structure.angle, 0), angle)) <= platingBlockHalfAngle(body, structure)
    );
  }

  function surfaceExtensionAtAngle(world, body, angle) {
    let extension = 0;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    for (const structure of structures) {
      if (platingBlockCoversAngle(body, structure, angle)) {
        extension = Math.max(extension, platingBlockTopOffset(structure));
      }
    }
    return extension;
  }

  function structureCenterOffset(type, surfaceOffset) {
    if (type === "plating-block") return surfaceOffset + PLATING_BLOCK_HEIGHT * 0.5;
    if (type === "battery") return surfaceOffset + 15;
    if (type === "container") return surfaceOffset + 19;
    if (type === "trading-port") return surfaceOffset + 24;
    if (type === "medbay") return surfaceOffset + 20;
    if (type === "shield-generator") return surfaceOffset + 20;
    if (type === "missile-launcher") return surfaceOffset + 22;
    if (type === "jet") return surfaceOffset + 18;
    if (type === "tether") return surfaceOffset + 14;
    if (type === "bridge") return surfaceOffset + 16;
    return surfaceOffset + STRUCTURE_SURFACE_OFFSET;
  }

  function tetherBodyRadius(body) {
    return Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
  }

  function tetherGiveForBodies(firstBody, secondBody) {
    const averageRadius = (tetherBodyRadius(firstBody) + tetherBodyRadius(secondBody)) * 0.5;
    return clamp(averageRadius * TETHER_GIVE_RADIUS_SCALE, TETHER_MIN_GIVE, TETHER_MAX_GIVE);
  }

  function tetherMaxRestLengthForBodies(firstBody, secondBody) {
    const combinedRadius = tetherBodyRadius(firstBody) + tetherBodyRadius(secondBody);
    return clamp(combinedRadius * TETHER_REST_LENGTH_RADIUS_SCALE, TETHER_MIN_REST_LENGTH, TETHER_MAX_REST_LENGTH);
  }

  function normalizedTetherRestLength(structure, firstBody, secondBody, fallbackLength) {
    const savedRestLength = finiteOr(structure && structure.restLength, 0);
    const requestedLength = savedRestLength > 0 ? savedRestLength : fallbackLength;
    return clamp(requestedLength, 80, tetherMaxRestLengthForBodies(firstBody, secondBody));
  }

  function tetherPlacementLength(firstPlacement, secondPlacement) {
    return Math.hypot(
      finiteOr(secondPlacement && secondPlacement.x, 0) - finiteOr(firstPlacement && firstPlacement.x, 0),
      finiteOr(secondPlacement && secondPlacement.y, 0) - finiteOr(firstPlacement && firstPlacement.y, 0)
    );
  }

  function isTetherPlacementLengthValid(firstPlacement, secondPlacement) {
    return Boolean(
      firstPlacement &&
      secondPlacement &&
      firstPlacement.body &&
      secondPlacement.body &&
      tetherPlacementLength(firstPlacement, secondPlacement) <=
        tetherMaxRestLengthForBodies(firstPlacement.body, secondPlacement.body) + TETHER_POSITION_SLOP
    );
  }

  function linkedStructureRestLength(type, placement, linkedPlacement) {
    const length = tetherPlacementLength(placement, linkedPlacement);
    if (type === "tether") {
      return Math.min(length, tetherMaxRestLengthForBodies(placement.body, linkedPlacement.body));
    }
    return length;
  }

  function structureMaxHealth(type) {
    return STRUCTURE_MAX_HEALTH[type] || 100;
  }

  function structureHitRadius(structure) {
    if (!structure) return 48;
    if (structure.type === "battery") return 42;
    if (structure.type === "container") return 48;
    if (structure.type === "trading-port") return 58;
    if (structure.type === "medbay") return 52;
    if (structure.type === "accumulator") return 44;
    if (structure.type === "shield-generator") return 50;
    if (structure.type === "missile-launcher") return 52;
    if (structure.type === "communication-relay") return 52;
    if (structure.type === "jet") return 46;
    if (structure.type === "tether") return 42;
    if (structure.type === "bridge") return 46;
    return 48;
  }

  function bodyById(world, bodyId) {
    const cleanId = Math.max(1, Math.floor(finiteOr(bodyId, 0)));
    return world && Array.isArray(world.particles)
      ? world.particles.find((body) => body && body.id === cleanId) || null
      : null;
  }

  function isStructureHostBody(body) {
    return isStructureHostBodyForType(body, "");
  }

  function isStructureDisabled(structure) {
    return Boolean(structure && finiteOr(structure.disabledTimer, 0) > 0);
  }

  function isActiveBridge(structure) {
    return Boolean(structure && structure.type === "bridge" && finiteOr(structure.health, 0) > 0 && !isStructureDisabled(structure));
  }

  function batteryCountForBody(world, bodyId) {
    let count = 0;
    for (const structure of world && world.structures || []) {
      if (
        structure &&
        structure.type === "battery" &&
        structure.bodyId === bodyId &&
        finiteOr(structure.health, 0) > 0 &&
        !isStructureDisabled(structure)
      ) {
        count += 1;
      }
    }
    return count;
  }

  function maxEnergyForBody(body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }
    return Math.round(80 + Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 4.2);
  }
