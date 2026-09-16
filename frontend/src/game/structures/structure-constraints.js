  function applyStructureSurfaceConstraint(structure) {
    if (isLinkedStructureType(structure.type)) {
      return applyLinkedStructureSurfaceConstraint(structure);
    }

    const body = bodyById(structure.bodyId);
    if (!isStructureHostBody(body)) {
      return false;
    }

    const surfaceOffset = structureBaseSurfaceOffset(structure);
    const centerOffset = structureCenterOffset(structure.type, surfaceOffset);
    structure.x = body.x + Math.cos(structure.angle) * (body.radius + centerOffset);
    structure.y = body.y + Math.sin(structure.angle) * (body.radius + centerOffset);
    return true;
  }

  function syncStructuresToSurfaces(removeInvalid) {
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      if (!applyStructureSurfaceConstraint(structures[i]) && removeInvalid) {
        structures.splice(i, 1);
      }
    }
  }

  function rotateBodyMountedFrame(bodyId, angleStep) {
    if (!bodyId || Math.abs(angleStep) <= 0.000001) {
      return;
    }

    for (const mounted of structures) {
      if (mounted.bodyId === bodyId) {
        mounted.angle += angleStep;
      }
      if (isLinkedStructureType(mounted.type) && mounted.linkedBodyId === bodyId) {
        mounted.linkedAngle += angleStep;
      }
    }

    if (player.landed && !player.landed.bridgeId && player.landed.bodyId === bodyId) {
      player.landed.angle += angleStep;
    }

    for (const rival of rivals) {
      if (rival.landed && !rival.landed.bridgeId && rival.landed.bodyId === bodyId) {
        rival.landed.angle += angleStep;
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

  function applyBodyTorqueFromVelocityChange(body, deltaVx, deltaVy, pointX, pointY, response) {
    if (!body || !body.tier || !Number.isFinite(Number(deltaVx)) || !Number.isFinite(Number(deltaVy))) {
      return;
    }

    const rx = finiteOr(pointX, body.x) - finiteOr(body.x, 0);
    const ry = finiteOr(pointY, body.y) - finiteOr(body.y, 0);
    const radius = bodyAngularInertiaRadius(body);
    const radiusSq = Math.max(64, radius * radius);
    const torque = rx * deltaVy - ry * deltaVx;
    if (Math.abs(torque) <= 0.000001) {
      return;
    }

    const torqueScale = body.tier.solid ? bodyTorqueResponse : bodyTorqueResponse * 0.42;
    body.angularVelocity = clamp(
      finiteOr(body.angularVelocity, 0) + (torque / radiusSq) * 2 * torqueScale * Math.max(0, finiteOr(response, 1)),
      -bodyMaxAngularSpeed,
      bodyMaxAngularSpeed
    );
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

  function applyBodyVelocityChangeAtPoint(body, deltaVx, deltaVy, pointX, pointY, response) {
    if (!body || !Number.isFinite(Number(deltaVx)) || !Number.isFinite(Number(deltaVy))) {
      return;
    }
    body.vx = finiteOr(body.vx, 0) + deltaVx;
    body.vy = finiteOr(body.vy, 0) + deltaVy;
    applyBodyTorqueFromVelocityChange(body, deltaVx, deltaVy, pointX, pointY, response);
  }

  function integrateBodyAngularMotion(body, dt) {
    if (!body || !body.tier) {
      return;
    }

    body.rotation = finiteOr(body.rotation, 0);
    body.angularVelocity = clamp(finiteOr(body.angularVelocity, 0), -bodyMaxAngularSpeed, bodyMaxAngularSpeed);
    if (Math.abs(body.angularVelocity) <= 0.000001) {
      body.angularVelocity = 0;
      return;
    }

    body.angularVelocity *= Math.pow(bodyAngularVelocityDamping, dt);
    const angleStep = body.angularVelocity * dt;
    if (Math.abs(angleStep) <= 0.000001) {
      return;
    }

    body.rotation += angleStep;
    rotateBodyMountedFrame(body.id, angleStep);
  }

  function activeBridgeById(id) {
    const cleanId = Math.max(1, Math.floor(finiteOr(id, 0)));
    for (const structure of structures) {
      if (structure.id === cleanId && isActiveBridge(structure)) {
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
    if (length < bridgeMinAnchorLength) {
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
      clamp(geometry.length * 0.18, bridgeMinCurveLength, bridgeMaxCurveLength)
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

  function bridgeBodySurfacePoint(body, angle) {
    const distanceFromCenter = body.radius + surfaceExtensionAtAngle(body, angle) + playerFootOffset;
    return {
      x: body.x + Math.cos(angle) * distanceFromCenter,
      y: body.y + Math.sin(angle) * distanceFromCenter
    };
  }

  function bridgeEndpointCurve(structure, bodyId, side) {
    const geometry = bridgeGeometry(structure);
    const body = bodyById(bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }

    const join = bridgeEndpointJoin(structure, bodyId, side);
    if (!join) {
      return null;
    }

    const cleanSide = join.side;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = bridgeHalfWidth + playerFootOffset;
    const curveLength = bridgeCurveLengthForGeometry(geometry);
    if (curveLength <= 0) {
      return null;
    }

    const bodyPoint = bridgeBodySurfacePoint(body, join.angle);
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

  function bridgeSurfacePose(structure, t, side, walkSpeedOverride) {
    const geometry = bridgeGeometry(structure);
    if (!geometry) {
      return null;
    }

    const clampedT = clamp(finiteOr(t, 0), 0, geometry.length);
    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = bridgeHalfWidth + playerFootOffset;
    const walkSpeed = Number.isFinite(Number(walkSpeedOverride))
      ? finiteOr(walkSpeedOverride, 0)
      : (player.landed ? finiteOr(player.landed.walkSpeed, 0) : 0);
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    const blend = geometry.length > 0 ? clampedT / geometry.length : 0;
    const baseVx = firstBody && secondBody
      ? finiteOr(firstBody.vx, 0) * (1 - blend) + finiteOr(secondBody.vx, 0) * blend
      : 0;
    const baseVy = firstBody && secondBody
      ? finiteOr(firstBody.vy, 0) * (1 - blend) + finiteOr(secondBody.vy, 0) * blend
      : 0;
    const curveLength = bridgeCurveLengthForGeometry(geometry);

    if (curveLength > 0 && clampedT < curveLength) {
      const startCurve = bridgeEndpointCurve(structure, structure.bodyId, cleanSide);
      const curvePose = bridgeCurveSurfacePose(startCurve, clampedT / curveLength, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return {
          ...curvePose,
          t: clampedT,
          side: cleanSide,
          geometry
        };
      }
    }

    if (curveLength > 0 && clampedT > geometry.length - curveLength) {
      const endCurve = bridgeEndpointCurve(structure, structure.linkedBodyId, cleanSide);
      const denominator = Math.max(1, curveLength);
      const curvePose = bridgeCurveSurfacePose(endCurve, (clampedT - (geometry.length - curveLength)) / denominator, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return {
          ...curvePose,
          t: clampedT,
          side: cleanSide,
          geometry
        };
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

  function bridgeSurfaceSideForPoint(structure, x, y, fallbackSide) {
    const geometry = bridgeGeometry(structure);
    if (!geometry) {
      return finiteOr(fallbackSide, 1) < 0 ? -1 : 1;
    }

    const relX = finiteOr(x, geometry.x1) - geometry.x1;
    const relY = finiteOr(y, geometry.y1) - geometry.y1;
    const t = clamp(relX * geometry.ux + relY * geometry.uy, 0, geometry.length);
    const centerX = geometry.x1 + geometry.ux * t;
    const centerY = geometry.y1 + geometry.uy * t;
    const sideScore = (finiteOr(x, centerX) - centerX) * geometry.nx + (finiteOr(y, centerY) - centerY) * geometry.ny;
    if (Math.abs(sideScore) < 0.001) {
      return finiteOr(fallbackSide, 1) < 0 ? -1 : 1;
    }
    return sideScore < 0 ? -1 : 1;
  }

  function bridgeEndpointJoin(structure, bodyId, side) {
    if (!isActiveBridge(structure)) {
      return null;
    }

    const geometry = bridgeGeometry(structure);
    const body = bodyById(bodyId);
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
    const playerBridgeOffset = bridgeHalfWidth + playerFootOffset;
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
