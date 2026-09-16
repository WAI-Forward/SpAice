  function isPersonalTetherEquipped() {
    return equippedToolId === personalTetherToolId && !areToolsDisabled();
  }

  function hasPersonalTether() {
    return personalTetherState.bodyId > 0;
  }

  function clearPersonalTether(options) {
    if (!hasPersonalTether()) {
      return false;
    }
    personalTetherState.bodyId = 0;
    personalTetherState.angle = 0;
    personalTetherState.surfaceOffset = 0;
    personalTetherState.restLength = 0;
    personalTetherState.deploy = 0;
    personalTetherState.wobble = 0;
    if (!options || options.notify !== false) {
      maybeNotifyText("Personal tether detached.", { groupKey: "personal-tether" });
    }
    return true;
  }

  function personalTetherAnchor(body) {
    if (!body) {
      return null;
    }
    const angle = finiteOr(personalTetherState.angle, 0);
    const surfaceOffset = Math.max(0, finiteOr(personalTetherState.surfaceOffset, 0));
    const radius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + surfaceOffset;
    return {
      x: finiteOr(body.x, 0) + Math.cos(angle) * radius,
      y: finiteOr(body.y, 0) + Math.sin(angle) * radius,
      angle
    };
  }

  function personalTetherEndpoint() {
    const body = bodyById(personalTetherState.bodyId);
    const anchor = personalTetherAnchor(body);
    if (!body || !anchor) {
      return null;
    }
    return {
      body,
      x: anchor.x,
      y: anchor.y,
      angle: anchor.angle,
      restLength: Math.max(80, finiteOr(personalTetherState.restLength, 0)),
      deploy: clamp(finiteOr(personalTetherState.deploy, 0), 0, 1),
      wobble: finiteOr(personalTetherState.wobble, 0)
    };
  }

  function serializePersonalTether() {
    return hasPersonalTether()
      ? {
          bodyId: personalTetherState.bodyId,
          angle: personalTetherState.angle,
          surfaceOffset: personalTetherState.surfaceOffset,
          restLength: personalTetherState.restLength,
          deploy: personalTetherState.deploy,
          wobble: personalTetherState.wobble
        }
      : null;
  }

  function applyPersonalTetherSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : null;
    if (!source || !bodyById(source.bodyId)) {
      clearPersonalTether({ notify: false });
      return false;
    }
    personalTetherState.bodyId = Math.max(0, Math.floor(finiteOr(source.bodyId, 0)));
    personalTetherState.angle = finiteOr(source.angle, 0);
    personalTetherState.surfaceOffset = Math.max(0, finiteOr(source.surfaceOffset, 0));
    personalTetherState.restLength = clamp(finiteOr(source.restLength, 0), 80, personalTetherMaxRestLength);
    personalTetherState.deploy = clamp(finiteOr(source.deploy, 1), 0, 1);
    personalTetherState.wobble = finiteOr(source.wobble, randomRange(0, Math.PI * 2));
    return true;
  }

  function findPersonalTetherTarget() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestScore = Infinity;

    for (const body of particles) {
      if (!isLandableBody(body)) {
        continue;
      }
      const dx = cursor.x - body.x;
      const dy = cursor.y - body.y;
      const distance = Math.hypot(dx, dy) || 1;
      const angle = Math.atan2(dy, dx);
      const surfaceOffset = surfaceExtensionAtAngle(body, angle);
      const contactRadius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + surfaceOffset;
      const cursorBodyGap = Math.max(0, distance - contactRadius);
      const playerDistance = Math.max(0, Math.hypot(player.x - body.x, player.y - body.y) - contactRadius);
      if (cursorBodyGap > 84 || playerDistance > personalTetherMaxAttachDistance) {
        continue;
      }
      const score = cursorBodyGap + Math.max(0, contactRadius - distance) * 0.18 + playerDistance * 0.08;
      if (score < bestScore) {
        bestScore = score;
        best = { body, angle, surfaceOffset };
      }
    }

    return best;
  }

  function attachPersonalTetherToTarget(target) {
    if (!target || !target.body) {
      maybeNotifyText("Aim the personal tether at a non-star body.", { groupKey: "personal-tether" });
      return false;
    }

    const body = target.body;
    const surfaceRadius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + Math.max(0, finiteOr(target.surfaceOffset, 0));
    const anchorX = body.x + Math.cos(target.angle) * surfaceRadius;
    const anchorY = body.y + Math.sin(target.angle) * surfaceRadius;
    const length = Math.hypot(player.x - anchorX, player.y - anchorY);
    if (length > personalTetherMaxAttachDistance) {
      maybeNotifyText("That body is too far for the personal tether.", { groupKey: "personal-tether" });
      return false;
    }

    personalTetherState.bodyId = body.id;
    personalTetherState.angle = target.angle;
    personalTetherState.surfaceOffset = Math.max(0, finiteOr(target.surfaceOffset, 0));
    personalTetherState.restLength = clamp(length, 80, personalTetherMaxRestLength);
    personalTetherState.deploy = 0.15;
    personalTetherState.wobble = randomRange(0, Math.PI * 2);
    maybeNotifyText("Personal tether attached.", { groupKey: "personal-tether" });
    playSound("place", { throttleKey: "personalTetherAttach", throttle: 0.12, volume: 0.7 });
    return true;
  }

  function handlePersonalTetherMouseDown(button) {
    if (!isPersonalTetherEquipped() || buildMenuOpen) {
      return false;
    }
    if (button === 2) {
      if (clearPersonalTether()) {
        playSound("detach", { throttleKey: "personalTetherDetach", throttle: 0.12, volume: 0.74 });
      }
      clearMouseButtonsOnly();
      return true;
    }
    if (button !== 0) {
      return false;
    }

    attachPersonalTetherToTarget(findPersonalTetherTarget());
    clearMouseButtonsOnly();
    return true;
  }

  function updatePersonalTether(dt) {
    if (!hasPersonalTether()) {
      return false;
    }

    const body = bodyById(personalTetherState.bodyId);
    if (!body || !isLandableBody(body)) {
      clearPersonalTether({ notify: false });
      return false;
    }

    personalTetherState.deploy = clamp(finiteOr(personalTetherState.deploy, 0) + dt * 5.2, 0, 1);
    const anchor = personalTetherAnchor(body);
    const dx = player.x - anchor.x;
    const dy = player.y - anchor.y;
    const distance = Math.hypot(dx, dy) || 1;
    const restLength = clamp(finiteOr(personalTetherState.restLength, distance), 80, personalTetherMaxRestLength);
    personalTetherState.restLength = restLength;
    const tautLength = restLength + personalTetherGive;
    if (distance <= tautLength) {
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const extension = distance - tautLength;
    const relativeSpeed = (finiteOr(player.vx, 0) - finiteOr(body.vx, 0)) * nx +
      (finiteOr(player.vy, 0) - finiteOr(body.vy, 0)) * ny;
    const pullSpeed = Math.max(0, relativeSpeed);
    const bodyMassDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(body.mass, 1)) / 420, 0.32), 0.09, 1.12);
    const bodyAcceleration = clamp(
      (extension * personalTetherSpring + pullSpeed * personalTetherDamping) * bodyMassDamping,
      0,
      personalTetherBodyMaxAcceleration
    );
    const playerAcceleration = clamp(
      extension * (personalTetherSpring + 1.4) + pullSpeed * (personalTetherDamping + 1.2),
      0,
      personalTetherPlayerMaxAcceleration
    );
    const bodyDelta = bodyAcceleration * dt;
    const playerDelta = playerAcceleration * dt;

    applyBodyVelocityChangeAtPoint(body, nx * bodyDelta, ny * bodyDelta, anchor.x, anchor.y, bodyConstraintTorqueResponse);
    markSurvivalCampBodyMovedByPlayer(body, player.id || "");
    player.vx -= nx * playerDelta;
    player.vy -= ny * playerDelta;

    if (extension > 180) {
      const correction = (extension - 180) * 0.08;
      body.x += nx * correction * bodyMassDamping;
      body.y += ny * correction * bodyMassDamping;
      player.x -= nx * correction * 0.42;
      player.y -= ny * correction * 0.42;
    }

    if (Math.random() < dt * clamp(extension / 220, 0.04, 0.48)) {
      sparks.push({
        x: (player.x + anchor.x) / 2 + randomRange(-8, 8),
        y: (player.y + anchor.y) / 2 + randomRange(-8, 8),
        radius: 16 + clamp(extension * 0.05, 0, 18),
        color: { r: 169, g: 133, b: 255 },
        life: 0.14,
        maxLife: 0.14
      });
    }

    return true;
  }
