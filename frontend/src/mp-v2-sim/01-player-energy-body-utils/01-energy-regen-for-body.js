  function energyRegenForBody(world, body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }
    return 2.2 + Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 0.075 + batteryCountForBody(world, body.id) * BATTERY_ENERGY_REGEN_BONUS;
  }

  function normalizeBodyEnergy(world, body) {
    if (!body) {
      return;
    }
    const maxEnergy = maxEnergyForBody(body);
    if (maxEnergy <= 0) {
      body.maxEnergy = 0;
      body.energy = 0;
      return;
    }
    const previousMax = Math.max(0, finiteOr(body.maxEnergy, 0));
    const previousEnergy = Number.isFinite(Number(body.energy)) ? finiteOr(body.energy, maxEnergy) : maxEnergy;
    body.maxEnergy = maxEnergy;
    body.energy = previousMax > 0 ? clamp(previousEnergy, 0, maxEnergy) : maxEnergy;
  }

  function spendBodyEnergy(world, body, amount) {
    normalizeBodyEnergy(world, body);
    const cost = Math.max(0, finiteOr(amount, 0));
    if (!body || cost <= 0) {
      return true;
    }
    if (finiteOr(body.energy, 0) < cost) {
      return false;
    }
    body.energy = Math.max(0, finiteOr(body.energy, 0) - cost);
    return true;
  }

  function canSpendBodyEnergy(world, body, amount) {
    normalizeBodyEnergy(world, body);
    return Boolean(body) && finiteOr(body.energy, 0) >= Math.max(0, finiteOr(amount, 0));
  }

  function updateBodyEnergySystems(state, dt) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return;
    }
    for (const body of world.particles) {
      normalizeBodyEnergy(world, body);
      if (body && finiteOr(body.maxEnergy, 0) > 0 && finiteOr(body.energy, 0) < finiteOr(body.maxEnergy, 0)) {
        body.energy = Math.min(body.maxEnergy, finiteOr(body.energy, 0) + energyRegenForBody(world, body) * dt);
      }
    }
  }

  function applyLinkedStructureSurfaceConstraint(world, structure) {
    const firstBody = bodyById(world, structure && structure.bodyId);
    const secondBody = bodyById(world, structure && structure.linkedBodyId);
    if (!isStructureHostBodyForType(firstBody, structure && structure.type) || !isStructureHostBodyForType(secondBody, structure && structure.type) || firstBody.id === secondBody.id) {
      return false;
    }

    const firstOffset = structureCenterOffset(structure.type, structureBaseSurfaceOffset(structure));
    const secondSurfaceOffset = Math.max(0, finiteOr(structure.linkedSurfaceOffset, 0));
    const secondOffset = structureCenterOffset(structure.type, secondSurfaceOffset);
    const firstRadius = finiteOr(firstBody.radius, radiusFromMass(firstBody.mass));
    const secondRadius = finiteOr(secondBody.radius, radiusFromMass(secondBody.mass));
    structure.x = firstBody.x + Math.cos(structure.angle) * (firstRadius + firstOffset);
    structure.y = firstBody.y + Math.sin(structure.angle) * (firstRadius + firstOffset);
    structure.x2 = secondBody.x + Math.cos(structure.linkedAngle) * (secondRadius + secondOffset);
    structure.y2 = secondBody.y + Math.sin(structure.linkedAngle) * (secondRadius + secondOffset);
    const currentLength = Math.hypot(structure.x2 - structure.x, structure.y2 - structure.y);
    structure.restLength = structure.type === "tether"
      ? normalizedTetherRestLength(structure, firstBody, secondBody, currentLength)
      : Math.max(80, finiteOr(structure.restLength, currentLength));
    if (structure.type === "bridge") {
      structure.restCenterDx = finiteOr(structure.restCenterDx, secondBody.x - firstBody.x);
      structure.restCenterDy = finiteOr(structure.restCenterDy, secondBody.y - firstBody.y);
    }
    return true;
  }

  function applyStructureSurfaceConstraint(world, structure) {
    if (!structure || typeof structure !== "object") {
      return false;
    }
    if (isLinkedStructureType(structure.type)) {
      return applyLinkedStructureSurfaceConstraint(world, structure);
    }

    const body = bodyById(world, structure.bodyId);
    if (!isStructureHostBodyForType(body, structure.type)) {
      return false;
    }

    const surfaceOffset = structureBaseSurfaceOffset(structure);
    const centerOffset = structureCenterOffset(structure.type, surfaceOffset);
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    structure.x = body.x + Math.cos(structure.angle) * (radius + centerOffset);
    structure.y = body.y + Math.sin(structure.angle) * (radius + centerOffset);
    return true;
  }

  function syncStructuresToSurfaces(state, removeInvalid) {
    const structures = state && state.world && Array.isArray(state.world.structures) ? state.world.structures : [];
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      if (!applyStructureSurfaceConstraint(state.world, structures[i]) && removeInvalid) {
        structures.splice(i, 1);
      }
    }
  }

  function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  function rotateBodyMountedFrame(state, bodyId, angleStep) {
    if (!bodyId || Math.abs(angleStep) <= 0.000001) {
      return;
    }

    for (const mounted of state.world.structures || []) {
      if (mounted.bodyId === bodyId) {
        mounted.angle = finiteOr(mounted.angle, 0) + angleStep;
      }
      if (isLinkedStructureType(mounted.type) && mounted.linkedBodyId === bodyId) {
        mounted.linkedAngle = finiteOr(mounted.linkedAngle, 0) + angleStep;
      }
    }

    for (const player of Object.values(state.players || {})) {
      if (player && player.landed && !player.landed.bridgeId && player.landed.bodyId === bodyId) {
        player.landed.angle = finiteOr(player.landed.angle, 0) + angleStep;
      }
    }
  }

  function bodyAngularInertiaRadius(body) {
    return Math.max(8, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 8));
  }

  function bodySurfaceVelocityAtPoint(body, pointX, pointY) {
    const angularVelocity = finiteOr(body && body.angularVelocity, 0);
    const rx = finiteOr(pointX, finiteOr(body && body.x, 0)) - finiteOr(body && body.x, 0);
    const ry = finiteOr(pointY, finiteOr(body && body.y, 0)) - finiteOr(body && body.y, 0);
    return {
      x: finiteOr(body && body.vx, 0) - angularVelocity * ry,
      y: finiteOr(body && body.vy, 0) + angularVelocity * rx
    };
  }

  function bodySurfaceVelocityAtAngle(body, angle, offset) {
    const radius = bodyAngularInertiaRadius(body) + Math.max(0, finiteOr(offset, 0));
    const pointX = finiteOr(body && body.x, 0) + Math.cos(angle) * radius;
    const pointY = finiteOr(body && body.y, 0) + Math.sin(angle) * radius;
    return bodySurfaceVelocityAtPoint(body, pointX, pointY);
  }

  function bodySurfacePointForForce(body, sourceX, sourceY) {
    const dx = finiteOr(sourceX, body && body.x) - finiteOr(body && body.x, 0);
    const dy = finiteOr(sourceY, body && body.y) - finiteOr(body && body.y, 0);
    const dist = Math.hypot(dx, dy) || 1;
    const radius = bodyAngularInertiaRadius(body);
    return {
      x: finiteOr(body && body.x, 0) + (dx / dist) * radius,
      y: finiteOr(body && body.y, 0) + (dy / dist) * radius
    };
  }

  function applyBodyTorqueFromVelocityChange(body, deltaVx, deltaVy, pointX, pointY, response) {
    if (!body || !body.tier || !Number.isFinite(Number(deltaVx)) || !Number.isFinite(Number(deltaVy))) {
      return;
    }

    const rx = finiteOr(pointX, body.x) - finiteOr(body.x, 0);
    const ry = finiteOr(pointY, body.y) - finiteOr(body.y, 0);
    const radius = bodyAngularInertiaRadius(body);
    const torque = rx * deltaVy - ry * deltaVx;
    if (Math.abs(torque) <= 0.000001) {
      return;
    }

    const torqueScale = body.tier.solid ? BODY_TORQUE_RESPONSE : BODY_TORQUE_RESPONSE * 0.42;
    body.angularVelocity = clamp(
      finiteOr(body.angularVelocity, 0) + (torque / Math.max(64, radius * radius)) * 2 * torqueScale * Math.max(0, finiteOr(response, 1)),
      -BODY_MAX_ANGULAR_SPEED,
      BODY_MAX_ANGULAR_SPEED
    );
  }

  function applyBodyVelocityChangeAtPoint(body, deltaVx, deltaVy, pointX, pointY, response) {
    if (!body || !Number.isFinite(Number(deltaVx)) || !Number.isFinite(Number(deltaVy))) {
      return;
    }
    body.vx = finiteOr(body.vx, 0) + deltaVx;
    body.vy = finiteOr(body.vy, 0) + deltaVy;
    applyBodyTorqueFromVelocityChange(body, deltaVx, deltaVy, pointX, pointY, response);
  }

  function activeBridgeById(world, id) {
    const cleanId = Math.max(1, Math.floor(finiteOr(id, 0)));
    for (const structure of world && world.structures || []) {
      if (structure && structure.id === cleanId && isActiveBridge(structure)) {
        return structure;
      }
    }
    return null;
  }

  function bridgeGeometry(structure) {
    if (!structure) {
      return null;
    }
    const x1 = finiteOr(structure.x, 0);
    const y1 = finiteOr(structure.y, 0);
    const x2 = finiteOr(structure.x2, x1);
    const y2 = finiteOr(structure.y2, y1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < BRIDGE_MIN_ANCHOR_LENGTH) {
      return null;
    }
    const ux = dx / length;
    const uy = dy / length;
    return {
      x1,
      y1,
      x2,
      y2,
      dx,
      dy,
      length,
      ux,
      uy,
      nx: -uy,
      ny: ux
    };
  }

  function bridgeCurveLengthForGeometry(geometry) {
    if (!geometry) {
      return 0;
    }
    return Math.min(
      geometry.length * 0.46,
      clamp(geometry.length * 0.18, BRIDGE_MIN_CURVE_LENGTH, BRIDGE_MAX_CURVE_LENGTH)
    );
  }

  function cubicBezierPoint(p0, p1, p2, p3, t) {
    const s = clamp(t, 0, 1);
    const inv = 1 - s;
    const inv2 = inv * inv;
    const s2 = s * s;
    return {
      x: p0.x * inv2 * inv + p1.x * 3 * inv2 * s + p2.x * 3 * inv * s2 + p3.x * s2 * s,
      y: p0.y * inv2 * inv + p1.y * 3 * inv2 * s + p2.y * 3 * inv * s2 + p3.y * s2 * s
    };
  }

  function cubicBezierDerivative(p0, p1, p2, p3, t) {
    const s = clamp(t, 0, 1);
    const inv = 1 - s;
    return {
      x: 3 * inv * inv * (p1.x - p0.x) + 6 * inv * s * (p2.x - p1.x) + 3 * s * s * (p3.x - p2.x),
      y: 3 * inv * inv * (p1.y - p0.y) + 6 * inv * s * (p2.y - p1.y) + 3 * s * s * (p3.y - p2.y)
    };
  }

  function bridgeBodySurfacePoint(world, body, angle) {
    const distanceFromCenter = finiteOr(body.radius, radiusFromMass(body.mass)) + surfaceExtensionAtAngle(world, body, angle) + PLAYER_FOOT_OFFSET;
    return {
      x: body.x + Math.cos(angle) * distanceFromCenter,
      y: body.y + Math.sin(angle) * distanceFromCenter
    };
  }

  function bridgeEndpointJoin(world, structure, bodyId, side) {
    if (!isActiveBridge(structure)) {
      return null;
    }
    const geometry = bridgeGeometry(structure);
    const body = bodyById(world, bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }
    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const atStart = structure.bodyId === bodyId;
    const atEnd = structure.linkedBodyId === bodyId;
    if (!atStart && !atEnd) {
      return null;
    }
    const endpointX = atStart ? geometry.x1 : geometry.x2;
    const endpointY = atStart ? geometry.y1 : geometry.y2;
    const playerBridgeOffset = BRIDGE_HALF_WIDTH + PLAYER_FOOT_OFFSET;
    const joinX = endpointX + geometry.nx * cleanSide * playerBridgeOffset;
    const joinY = endpointY + geometry.ny * cleanSide * playerBridgeOffset;
    const angle = Math.atan2(joinY - body.y, joinX - body.x);
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    const bridgeDirX = atStart ? geometry.ux : -geometry.ux;
    const bridgeDirY = atStart ? geometry.uy : -geometry.uy;
    const entryWalkDirection = tangentX * bridgeDirX + tangentY * bridgeDirY >= 0 ? 1 : -1;
    const desiredPathSign = atStart ? 1 : -1;
    return {
      t: atStart ? 0 : geometry.length,
      angle,
      bodyId,
      otherBodyId: atStart ? structure.linkedBodyId : structure.bodyId,
      side: cleanSide,
      atStart,
      geometry,
      entryWalkDirection,
      inputSign: desiredPathSign * entryWalkDirection
    };
  }

  function bridgeEndpointCurve(world, structure, bodyId, side) {
    const geometry = bridgeGeometry(structure);
    const body = bodyById(world, bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }
    const join = bridgeEndpointJoin(world, structure, bodyId, side);
    if (!join) {
      return null;
    }
    const cleanSide = join.side;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = BRIDGE_HALF_WIDTH + PLAYER_FOOT_OFFSET;
    const curveLength = bridgeCurveLengthForGeometry(geometry);
    if (curveLength <= 0) {
      return null;
    }
    const bodyPoint = bridgeBodySurfacePoint(world, body, join.angle);
    const straightT = join.atStart ? curveLength : geometry.length - curveLength;
    const straightPoint = {
      x: geometry.x1 + geometry.ux * straightT + normalX * offset,
      y: geometry.y1 + geometry.uy * straightT + normalY * offset
    };
    const bodyTangent = {
      x: -Math.sin(join.angle),
      y: Math.cos(join.angle)
    };
    const startBodyDirection = join.entryWalkDirection;
    const endBodyDirection = -join.entryWalkDirection;
    const handle = curveLength * 0.42;
    const bodyNormalAngle = join.angle;
    const bridgeNormalAngle = Math.atan2(normalY, normalX);
    if (join.atStart) {
      const p0 = bodyPoint;
      const p3 = straightPoint;
      const d0 = {
        x: bodyTangent.x * startBodyDirection,
        y: bodyTangent.y * startBodyDirection
      };
      const d1 = { x: geometry.ux, y: geometry.uy };
      return {
        p0,
        p1: { x: p0.x + d0.x * handle, y: p0.y + d0.y * handle },
        p2: { x: p3.x - d1.x * handle, y: p3.y - d1.y * handle },
        p3,
        curveLength,
        normalStartAngle: bodyNormalAngle,
        normalEndAngle: bridgeNormalAngle,
        geometry,
        join
      };
    }
    const p0 = straightPoint;
    const p3 = bodyPoint;
    const d0 = { x: geometry.ux, y: geometry.uy };
    const d1 = {
      x: bodyTangent.x * endBodyDirection,
      y: bodyTangent.y * endBodyDirection
    };
    return {
      p0,
      p1: { x: p0.x + d0.x * handle, y: p0.y + d0.y * handle },
      p2: { x: p3.x - d1.x * handle, y: p3.y - d1.y * handle },
      p3,
      curveLength,
      normalStartAngle: bridgeNormalAngle,
      normalEndAngle: bodyNormalAngle,
      geometry,
      join
    };
  }

  function bridgeCurveSurfacePose(curve, progress, walkSpeed, baseVx, baseVy) {
    if (!curve) {
      return null;
    }
    const s = clamp(progress, 0, 1);
    const point = cubicBezierPoint(curve.p0, curve.p1, curve.p2, curve.p3, s);
    const derivative = cubicBezierDerivative(curve.p0, curve.p1, curve.p2, curve.p3, s);
    const tangent = normalize(derivative.x, derivative.y);
    const normalBlend = s * s * (3 - 2 * s);
    const normalAngle = curve.normalStartAngle + shortestAngleDelta(curve.normalStartAngle, curve.normalEndAngle) * normalBlend;
    return {
      x: point.x,
      y: point.y,
      vx: baseVx + tangent.x * walkSpeed,
      vy: baseVy + tangent.y * walkSpeed,
      angle: normalAngle
    };
  }

  function bridgeSurfacePose(world, structure, t, side, walkSpeedOverride) {
    const geometry = bridgeGeometry(structure);
    if (!geometry) {
      return null;
    }
    const clampedT = clamp(finiteOr(t, 0), 0, geometry.length);
    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = BRIDGE_HALF_WIDTH + PLAYER_FOOT_OFFSET;
    const walkSpeed = Number.isFinite(Number(walkSpeedOverride)) ? finiteOr(walkSpeedOverride, 0) : 0;
    const firstBody = bodyById(world, structure.bodyId);
    const secondBody = bodyById(world, structure.linkedBodyId);
    const blend = geometry.length > 0 ? clampedT / geometry.length : 0;
    const baseVx = firstBody && secondBody
      ? finiteOr(firstBody.vx, 0) * (1 - blend) + finiteOr(secondBody.vx, 0) * blend
      : 0;
    const baseVy = firstBody && secondBody
      ? finiteOr(firstBody.vy, 0) * (1 - blend) + finiteOr(secondBody.vy, 0) * blend
      : 0;
    const curveLength = bridgeCurveLengthForGeometry(geometry);

    if (curveLength > 0 && clampedT < curveLength) {
      const startCurve = bridgeEndpointCurve(world, structure, structure.bodyId, cleanSide);
      const curvePose = bridgeCurveSurfacePose(startCurve, clampedT / curveLength, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return { ...curvePose, t: clampedT, side: cleanSide, geometry };
      }
    }
    if (curveLength > 0 && clampedT > geometry.length - curveLength) {
      const endCurve = bridgeEndpointCurve(world, structure, structure.linkedBodyId, cleanSide);
      const denominator = Math.max(1, curveLength);
      const curvePose = bridgeCurveSurfacePose(endCurve, (clampedT - (geometry.length - curveLength)) / denominator, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return { ...curvePose, t: clampedT, side: cleanSide, geometry };
      }
    }
    return {
      x: geometry.x1 + geometry.ux * clampedT + normalX * offset,
      y: geometry.y1 + geometry.uy * clampedT + normalY * offset,
      vx: baseVx + geometry.ux * walkSpeed,
      vy: baseVy + geometry.uy * walkSpeed,
      angle: Math.atan2(normalY, normalX),
      t: clampedT,
      side: cleanSide,
      geometry
    };
  }

