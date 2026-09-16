  function applyTetherDistanceConstraint(structure, dt) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id || !applyLinkedStructureSurfaceConstraint(structure)) {
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

    if (Math.abs(lengthError) <= tetherPositionSlop) {
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
    const correction = lengthError - Math.sign(lengthError) * tetherPositionSlop;

    firstBody.x += nx * correction * firstShare;
    firstBody.y += ny * correction * firstShare;
    secondBody.x -= nx * correction * secondShare;
    secondBody.y -= ny * correction * secondShare;

    const relativeVelocity = (finiteOr(secondBody.vx, 0) - finiteOr(firstBody.vx, 0)) * nx +
      (finiteOr(secondBody.vy, 0) - finiteOr(firstBody.vy, 0)) * ny;
    const signedRelativeVelocity = relativeVelocity * Math.sign(correction);
    const velocityCorrection = clamp(
      (Math.abs(correction) * tetherSpring + Math.max(0, signedRelativeVelocity) * tetherDamping) * dt * Math.sign(correction),
      -tetherMaxAcceleration * dt,
      tetherMaxAcceleration * dt
    );

    applyBodyVelocityChangeAtPoint(
      firstBody,
      nx * velocityCorrection * firstShare,
      ny * velocityCorrection * firstShare,
      structure.x,
      structure.y,
      bodyConstraintTorqueResponse
    );
    applyBodyVelocityChangeAtPoint(
      secondBody,
      -nx * velocityCorrection * secondShare,
      -ny * velocityCorrection * secondShare,
      structure.x2,
      structure.y2,
      bodyConstraintTorqueResponse
    );

    applyLinkedStructureSurfaceConstraint(structure);

    if (Math.random() < dt * clamp(Math.abs(correction) / 180, 0.03, 0.35)) {
      sparks.push({
        x: (structure.x + structure.x2) / 2 + randomRange(-8, 8),
        y: (structure.y + structure.y2) / 2 + randomRange(-8, 8),
        radius: 18 + clamp(Math.abs(correction) * 0.08, 0, 22),
        color: { r: 169, g: 133, b: 255 },
        life: 0.16,
        maxLife: 0.16
      });
    }

    return true;
  }

  function resolveTetheredBodyCollision(structure) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
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
    applyLinkedStructureSurfaceConstraint(structure);
    return true;
  }

  function solveTetherConstraints(dt) {
    let movedAny = false;
    for (let iteration = 0; iteration < tetherConstraintIterations; iteration += 1) {
      let movedThisPass = false;
      for (const structure of structures) {
        if (isActiveTetherStructure(structure) && applyTetherDistanceConstraint(structure, dt)) {
          movedThisPass = true;
        }
        if (isActiveTetherStructure(structure) && resolveTetheredBodyCollision(structure)) {
          movedThisPass = true;
        }
      }
      movedAny = movedAny || movedThisPass;
      if (!movedThisPass) {
        break;
      }
    }

    if (movedAny) {
      syncStructuresToSurfaces(false);
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

  function applyBridgeComponentAnchorCorrections(component) {
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
      rotateBodyMountedFrame(bodyId, angleStep);
    }

    for (const desired of desiredAngles) {
      desired.structure.angle = desired.firstDesired;
      desired.structure.linkedAngle = desired.secondDesired;
    }
  }

  function bridgeConstraintRecords() {
    const records = [];
    const adjacency = new Map();
    for (const structure of structures) {
      if (!isActiveBridge(structure)) {
        continue;
      }

      const firstBody = bodyById(structure.bodyId);
      const secondBody = bodyById(structure.linkedBodyId);
      if (!firstBody || !secondBody || firstBody.id === secondBody.id || !applyLinkedStructureSurfaceConstraint(structure)) {
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

  function solveBridgeConstraintComponent(component, dt) {
    const bodies = component.bodyIds.map(bodyById).filter(Boolean);
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
          (angularNumerator / angularDenominator) * Math.pow(bridgeAngularDamping, dt),
          -bridgeMaxAngularSpeed,
          bridgeMaxAngularSpeed
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
        rotateBodyMountedFrame(body.id, angleStep);
        const offset = localOffsets.get(body.id);
        const rotatedOffset = rotatePoint(offset.x, offset.y, angleStep);
        offset.x = rotatedOffset.x;
        offset.y = rotatedOffset.y;
      }
    }
    applyBridgeComponentAnchorCorrections(component);

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
        -bodyMaxAngularSpeed,
        bodyMaxAngularSpeed
      );
    }

    for (const record of component.records) {
      applyLinkedStructureSurfaceConstraint(record.structure);
    }
    return true;
  }

  function solveBridgeConstraints(dt) {
    const graph = bridgeConstraintRecords();
    if (!graph.records.length) {
      return;
    }

    let movedAny = false;
    for (const component of bridgeConstraintComponents(graph.records, graph.adjacency)) {
      if (solveBridgeConstraintComponent(component, dt)) {
        movedAny = true;
      }
    }
    if (movedAny) {
      syncStructuresToSurfaces(false);
    }
  }

  function updateBridge(structure, dt) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return;
    }

    structure.deploy = clamp((structure.deploy || 0) + dt * 2.8, 0, 1);

    if (Math.random() < dt * 0.7) {
      const geometry = bridgeGeometry(structure);
      if (geometry) {
        const t = randomRange(bridgeHalfWidth, Math.max(bridgeHalfWidth, geometry.length - bridgeHalfWidth));
        sparks.push({
          x: geometry.x1 + geometry.ux * t + randomRange(-6, 6),
          y: geometry.y1 + geometry.uy * t + randomRange(-6, 6),
          radius: 14,
          color: { r: 255, g: 209, b: 102 },
          life: 0.14,
          maxLife: 0.14
        });
      }
    }
  }

