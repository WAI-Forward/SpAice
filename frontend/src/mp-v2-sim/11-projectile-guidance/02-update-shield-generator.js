  function updateShieldGenerator(state, structure, dt) {
    const body = bodyById(state.world, structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }
    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    const hasPower = canSpendBodyEnergy(state.world, body, SHIELD_GENERATOR_PROJECTILE_COST);
    const targetDeploy = hasPower ? 0.72 : 0.16;
    structure.deploy += (targetDeploy - finiteOr(structure.deploy, 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);
  }

  function updateTether(state, structure, dt) {
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.2, 0, 1);
  }

  function isActiveTetherStructure(structure) {
    return Boolean(
      structure &&
      structure.type === "tether" &&
      finiteOr(structure.health, 0) > 0 &&
      !isStructureDisabled(structure)
    );
  }

  function applyTetherDistanceConstraint(state, structure, dt) {
    const firstBody = bodyById(state.world, structure.bodyId);
    const secondBody = bodyById(state.world, structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id || !applyLinkedStructureSurfaceConstraint(state.world, structure)) {
      return false;
    }

    const dx = structure.x2 - structure.x;
    const dy = structure.y2 - structure.y;
    const currentLength = Math.hypot(dx, dy) || 1;
    const nx = dx / currentLength;
    const ny = dy / currentLength;
    const restLength = normalizedTetherRestLength(structure, firstBody, secondBody, currentLength);
    structure.restLength = restLength;
    const give = tetherGiveForBodies(firstBody, secondBody);
    const minLength = Math.max(40, restLength - give);
    const maxLength = restLength + give;
    let lengthError = 0;
    if (currentLength > maxLength) {
      lengthError = currentLength - maxLength;
    } else if (currentLength < minLength) {
      lengthError = currentLength - minLength;
    }

    if (Math.abs(lengthError) <= TETHER_POSITION_SLOP) {
      return false;
    }

    const firstMass = Math.max(1, finiteOr(firstBody.mass, 1));
    const secondMass = Math.max(1, finiteOr(secondBody.mass, 1));
    const totalMass = firstMass + secondMass;
    const anchorFirstAgainstDirectGadget = isDirectGadgetForcedFromLandedBody(secondBody, firstBody);
    const anchorSecondAgainstDirectGadget = isDirectGadgetForcedFromLandedBody(firstBody, secondBody);
    let firstShare = clamp(secondMass / totalMass, 0.08, 0.92);
    let secondShare = clamp(firstMass / totalMass, 0.08, 0.92);
    if (anchorFirstAgainstDirectGadget && !anchorSecondAgainstDirectGadget) {
      firstShare = 0;
      secondShare = 1;
    } else if (anchorSecondAgainstDirectGadget && !anchorFirstAgainstDirectGadget) {
      firstShare = 1;
      secondShare = 0;
    }
    const correction = lengthError - Math.sign(lengthError) * TETHER_POSITION_SLOP;

    firstBody.x += nx * correction * firstShare;
    firstBody.y += ny * correction * firstShare;
    secondBody.x -= nx * correction * secondShare;
    secondBody.y -= ny * correction * secondShare;

    const relativeVelocity = (finiteOr(secondBody.vx, 0) - finiteOr(firstBody.vx, 0)) * nx +
      (finiteOr(secondBody.vy, 0) - finiteOr(firstBody.vy, 0)) * ny;
    const signedRelativeVelocity = relativeVelocity * Math.sign(correction);
    const velocityCorrection = clamp(
      (Math.abs(correction) * TETHER_SPRING + Math.max(0, signedRelativeVelocity) * TETHER_DAMPING) * dt * Math.sign(correction),
      -TETHER_MAX_ACCELERATION * dt,
      TETHER_MAX_ACCELERATION * dt
    );

    applyBodyVelocityChangeAtPoint(
      firstBody,
      nx * velocityCorrection * firstShare,
      ny * velocityCorrection * firstShare,
      structure.x,
      structure.y,
      BODY_CONSTRAINT_TORQUE_RESPONSE
    );
    applyBodyVelocityChangeAtPoint(
      secondBody,
      -nx * velocityCorrection * secondShare,
      -ny * velocityCorrection * secondShare,
      structure.x2,
      structure.y2,
      BODY_CONSTRAINT_TORQUE_RESPONSE
    );

    applyLinkedStructureSurfaceConstraint(state.world, structure);
    return true;
  }

  function resolveTetheredBodyCollision(state, structure) {
    const firstBody = bodyById(state.world, structure.bodyId);
    const secondBody = bodyById(state.world, structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return false;
    }

    const dx = secondBody.x - firstBody.x;
    const dy = secondBody.y - firstBody.y;
    const minDist = Math.max(1, finiteOr(firstBody.radius, radiusFromMass(firstBody.mass))) +
      Math.max(1, finiteOr(secondBody.radius, radiusFromMass(secondBody.mass)));
    if (dx * dx + dy * dy >= minDist * minDist) {
      return false;
    }

    resolveBodyBounce(firstBody, secondBody, dx, dy, minDist);
    applyLinkedStructureSurfaceConstraint(state.world, structure);
    return true;
  }

  function solveTetherConstraints(state, dt) {
    const structures = state && state.world && Array.isArray(state.world.structures) ? state.world.structures : [];
    let movedAny = false;
    for (let iteration = 0; iteration < TETHER_CONSTRAINT_ITERATIONS; iteration += 1) {
      let movedThisPass = false;
      for (const structure of structures) {
        if (isActiveTetherStructure(structure) && applyTetherDistanceConstraint(state, structure, dt)) {
          movedThisPass = true;
        }
        if (isActiveTetherStructure(structure) && resolveTetheredBodyCollision(state, structure)) {
          movedThisPass = true;
        }
      }
      movedAny = movedAny || movedThisPass;
      if (!movedThisPass) {
        break;
      }
    }

    if (movedAny) {
      syncStructuresToSurfaces(state, false);
    }
  }

  function addBridgeComponentRecord(adjacency, bodyId, record) {
    if (!adjacency.has(bodyId)) {
      adjacency.set(bodyId, []);
    }
    adjacency.get(bodyId).push(record);
  }

  function bridgeRigidRestAngle(structure, firstBody, secondBody) {
    return Math.atan2(
      finiteOr(structure.restCenterDy, secondBody.y - firstBody.y),
      finiteOr(structure.restCenterDx, secondBody.x - firstBody.x)
    );
  }

  function ensureBridgeRigidAnchorOffsets(structure, firstBody, secondBody) {
    const restAngle = bridgeRigidRestAngle(structure, firstBody, secondBody);
    if (!Number.isFinite(Number(structure.bridgeAngleOffset))) {
      structure.bridgeAngleOffset = shortestAngleDelta(restAngle, finiteOr(structure.angle, restAngle));
    }
    if (!Number.isFinite(Number(structure.bridgeLinkedAngleOffset))) {
      structure.bridgeLinkedAngleOffset = shortestAngleDelta(restAngle, finiteOr(structure.linkedAngle, restAngle + Math.PI));
    }
  }

  function addBridgeFrameCorrection(corrections, bodyId, currentAngle, desiredAngle) {
    if (!corrections.has(bodyId)) {
      corrections.set(bodyId, { sin: 0, cos: 0, count: 0 });
    }
    const delta = shortestAngleDelta(currentAngle, desiredAngle);
    const correction = corrections.get(bodyId);
    correction.sin += Math.sin(delta);
    correction.cos += Math.cos(delta);
    correction.count += 1;
  }

  function applyBridgeComponentAnchorCorrections(state, component) {
    const corrections = new Map();
    const desiredAngles = [];
    for (const record of component.records) {
      const structure = record.structure;
      const restAngle = bridgeRigidRestAngle(structure, record.firstBody, record.secondBody);
      const firstDesired = restAngle + finiteOr(structure.bridgeAngleOffset, 0);
      const secondDesired = restAngle + finiteOr(structure.bridgeLinkedAngleOffset, Math.PI);
      desiredAngles.push({ structure, firstDesired, secondDesired });
      addBridgeFrameCorrection(corrections, record.firstBody.id, finiteOr(structure.angle, firstDesired), firstDesired);
      addBridgeFrameCorrection(corrections, record.secondBody.id, finiteOr(structure.linkedAngle, secondDesired), secondDesired);
    }

    for (const bodyId of component.bodyIds) {
      const correction = corrections.get(bodyId);
      if (!correction || !correction.count) {
        continue;
      }
      const angleStep = Math.atan2(correction.sin, correction.cos);
      rotateBodyMountedFrame(state, bodyId, angleStep);
    }

    for (const desired of desiredAngles) {
      desired.structure.angle = desired.firstDesired;
      desired.structure.linkedAngle = desired.secondDesired;
    }
  }

  function bridgeConstraintRecords(state) {
    const world = state && state.world;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    const records = [];
    const adjacency = new Map();
    for (const structure of structures) {
      if (!isActiveBridge(structure)) {
        continue;
      }

      const firstBody = bodyById(world, structure.bodyId);
      const secondBody = bodyById(world, structure.linkedBodyId);
      if (!firstBody || !secondBody || firstBody.id === secondBody.id || !applyLinkedStructureSurfaceConstraint(world, structure)) {
        continue;
      }

      let restDx = finiteOr(structure.restCenterDx, secondBody.x - firstBody.x);
      let restDy = finiteOr(structure.restCenterDy, secondBody.y - firstBody.y);
      if (Math.hypot(restDx, restDy) < 1) {
        restDx = secondBody.x - firstBody.x;
        restDy = secondBody.y - firstBody.y;
      }
      structure.restCenterDx = restDx;
      structure.restCenterDy = restDy;
      ensureBridgeRigidAnchorOffsets(structure, firstBody, secondBody);

      const record = { structure, firstBody, secondBody };
      records.push(record);
      addBridgeComponentRecord(adjacency, firstBody.id, record);
      addBridgeComponentRecord(adjacency, secondBody.id, record);
    }
    return { records, adjacency };
  }

  function bridgeConstraintComponents(records, adjacency) {
    const components = [];
    const visitedBodies = new Set();
    const visitedStructures = new Set();
    for (const record of records) {
      if (visitedStructures.has(record.structure.id)) {
        continue;
      }

      const bodyIds = [];
      const componentRecords = [];
      const queue = [record.firstBody.id];
      visitedBodies.add(record.firstBody.id);
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const bodyId = queue[cursor];
        bodyIds.push(bodyId);
        for (const linkedRecord of adjacency.get(bodyId) || []) {
          if (!visitedStructures.has(linkedRecord.structure.id)) {
            visitedStructures.add(linkedRecord.structure.id);
            componentRecords.push(linkedRecord);
          }
          const otherBodyId = linkedRecord.firstBody.id === bodyId
            ? linkedRecord.secondBody.id
            : linkedRecord.firstBody.id;
          if (!visitedBodies.has(otherBodyId)) {
            visitedBodies.add(otherBodyId);
            queue.push(otherBodyId);
          }
        }
      }

      if (bodyIds.length > 1 && componentRecords.length) {
        components.push({ bodyIds, records: componentRecords });
      }
    }
    return components;
  }

  function solveBridgeConstraintComponent(state, component, dt) {
    const world = state && state.world;
    const bodies = component.bodyIds.map((bodyId) => bodyById(world, bodyId)).filter(Boolean);
    if (bodies.length < 2) {
      return false;
    }

    const bodyMap = new Map();
    const adjacency = new Map();
    let totalMass = 0;
    let centerX = 0;
    let centerY = 0;
    let averageVx = 0;
    let averageVy = 0;
    for (const body of bodies) {
      const mass = Math.max(1, finiteOr(body.mass, 1));
      bodyMap.set(body.id, { body, mass });
      totalMass += mass;
      centerX += finiteOr(body.x, 0) * mass;
      centerY += finiteOr(body.y, 0) * mass;
      averageVx += finiteOr(body.vx, 0) * mass;
      averageVy += finiteOr(body.vy, 0) * mass;
      adjacency.set(body.id, []);
    }
    if (totalMass <= 0) {
      return false;
    }
    centerX /= totalMass;
    centerY /= totalMass;
    averageVx /= totalMass;
    averageVy /= totalMass;

    for (const record of component.records) {
      addBridgeComponentRecord(adjacency, record.firstBody.id, record);
      addBridgeComponentRecord(adjacency, record.secondBody.id, record);
    }

    const rootId = bodies[0].id;
    const localOffsets = new Map([[rootId, { x: 0, y: 0 }]]);
    const queue = [rootId];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const bodyId = queue[cursor];
      const baseOffset = localOffsets.get(bodyId) || { x: 0, y: 0 };
      for (const record of adjacency.get(bodyId) || []) {
        const fromFirst = record.firstBody.id === bodyId;
        const otherBodyId = fromFirst ? record.secondBody.id : record.firstBody.id;
        if (!bodyMap.has(otherBodyId) || localOffsets.has(otherBodyId)) {
          continue;
        }
        const restDx = finiteOr(record.structure.restCenterDx, record.secondBody.x - record.firstBody.x);
        const restDy = finiteOr(record.structure.restCenterDy, record.secondBody.y - record.firstBody.y);
        localOffsets.set(otherBodyId, {
          x: baseOffset.x + (fromFirst ? restDx : -restDx),
          y: baseOffset.y + (fromFirst ? restDy : -restDy)
        });
        queue.push(otherBodyId);
      }
    }

    if (localOffsets.size !== bodies.length) {
      return false;
    }

    let restCenterX = 0;
    let restCenterY = 0;
    for (const body of bodies) {
      const entry = bodyMap.get(body.id);
      const offset = localOffsets.get(body.id);
      restCenterX += offset.x * entry.mass;
      restCenterY += offset.y * entry.mass;
    }
    restCenterX /= totalMass;
    restCenterY /= totalMass;

    let angularNumerator = 0;
    let angularDenominator = 0;
    for (const body of bodies) {
      const entry = bodyMap.get(body.id);
      const offset = localOffsets.get(body.id);
      offset.x -= restCenterX;
      offset.y -= restCenterY;
      const relativeVx = finiteOr(body.vx, 0) - averageVx;
      const relativeVy = finiteOr(body.vy, 0) - averageVy;
      angularNumerator += entry.mass * (offset.x * relativeVy - offset.y * relativeVx);
      angularDenominator += entry.mass * (offset.x * offset.x + offset.y * offset.y);
    }

    const angularVelocity = angularDenominator > 1
      ? clamp(
          (angularNumerator / angularDenominator) * Math.pow(BRIDGE_ANGULAR_DAMPING, dt),
          -BRIDGE_MAX_ANGULAR_SPEED,
          BRIDGE_MAX_ANGULAR_SPEED
        )
      : 0;
    const angleStep = angularVelocity * dt;
    if (Math.abs(angleStep) > 0.000001) {
      for (const record of component.records) {
        const rotatedRest = rotatePoint(
          finiteOr(record.structure.restCenterDx, record.secondBody.x - record.firstBody.x),
          finiteOr(record.structure.restCenterDy, record.secondBody.y - record.firstBody.y),
          angleStep
        );
        record.structure.restCenterDx = rotatedRest.x;
        record.structure.restCenterDy = rotatedRest.y;
      }
      for (const body of bodies) {
        rotateBodyMountedFrame(state, body.id, angleStep);
        const offset = localOffsets.get(body.id);
        const rotatedOffset = rotatePoint(offset.x, offset.y, angleStep);
        offset.x = rotatedOffset.x;
        offset.y = rotatedOffset.y;
      }
    }
    applyBridgeComponentAnchorCorrections(state, component);

    const velocityBlend = 1 - Math.pow(0.0001, dt);
    for (const body of bodies) {
      const offset = localOffsets.get(body.id);
      body.x = centerX + offset.x;
      body.y = centerY + offset.y;
      const targetVx = averageVx - angularVelocity * offset.y;
      const targetVy = averageVy + angularVelocity * offset.x;
      body.vx = finiteOr(body.vx, 0) + (targetVx - finiteOr(body.vx, 0)) * velocityBlend;
      body.vy = finiteOr(body.vy, 0) + (targetVy - finiteOr(body.vy, 0)) * velocityBlend;
      body.angularVelocity = clamp(
        finiteOr(body.angularVelocity, 0) + (angularVelocity - finiteOr(body.angularVelocity, 0)) * velocityBlend * 0.35,
        -BODY_MAX_ANGULAR_SPEED,
        BODY_MAX_ANGULAR_SPEED
      );
    }

    for (const record of component.records) {
      applyLinkedStructureSurfaceConstraint(world, record.structure);
    }
    return true;
  }

  function solveBridgeConstraints(state, dt) {
    const graph = bridgeConstraintRecords(state);
    if (!graph.records.length) {
      return;
    }

    let movedAny = false;
    for (const component of bridgeConstraintComponents(graph.records, graph.adjacency)) {
      if (solveBridgeConstraintComponent(state, component, dt)) {
        movedAny = true;
      }
    }
    if (movedAny) {
      syncStructuresToSurfaces(state, false);
    }
  }

  function updateBridge(state, structure, dt) {
    const firstBody = bodyById(state.world, structure.bodyId);
    const secondBody = bodyById(state.world, structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return;
    }
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.8, 0, 1);
  }

  function medbayHalfAngle(body, structure) {
    const centerRadius = Math.max(
      24,
      finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 24) +
        structureBaseSurfaceOffset(structure) +
        MEDBAY_INTERIOR_WIDTH * 0.18
    );
    return Math.min(Math.PI, MEDBAY_INTERIOR_WIDTH / centerRadius / 2);
  }

  function playerInsideMedbay(player, body, structure) {
    return Boolean(
      player &&
      player.landed &&
      !player.landed.bridgeId &&
      body &&
      player.landed.bodyId === body.id &&
      Math.abs(shortestAngleDelta(finiteOr(structure.angle, 0), finiteOr(player.landed.angle, 0))) <= medbayHalfAngle(body, structure)
    );
  }

