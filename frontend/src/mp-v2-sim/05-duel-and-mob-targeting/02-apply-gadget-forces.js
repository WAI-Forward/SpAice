  function applyGadgetForces(target, actor, input, dt, options) {
    if (!target || !actor || !input || !isSuctionToolId(input.equippedTool)) {
      return false;
    }
    const pulling = input.buttons.pull || input.toolMode === "pull";
    const pushing = input.buttons.push || input.toolMode === "push";
    const holding = input.buttons.hold || input.toolMode === "hold";
    if (!pulling && !pushing && !holding) {
      return false;
    }

    const aim = aimVector(input);
    const funnel = actorFunnel(actor, aim);
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aim.x + toTargetY * aim.y;
    const sideX = toTargetX - aim.x * forward;
    const sideY = toTargetY - aim.y * forward;
    const side = Math.hypot(sideX, sideY);
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const targetRadius = finiteOr(target.radius, 1);
    const forceReach = gadgetForceReachForInput(actor, input);
    const holdReach = gadgetHoldReachForInput(actor, input);
    const inCone = forward > -70 && forward < forceReach && side < coneWidth + targetRadius * 0.2;
    const middleGatherRange = holding && gadgetMiddleGatherRange(forward, side, targetRadius, holdReach);
    if (!inCone && !middleGatherRange) {
      return false;
    }

    const response = bodyPushResponse(target);
    const pullTowardActor = Boolean(options && options.pullTowardActor === true);
    const torquePoint = target.tier ? bodySurfacePointForForce(target, actor.x, actor.y) : null;
    if (holding) {
      const holdX = actor.x + aim.x * holdReach;
      const holdY = actor.y + aim.y * holdReach;
      const toHoldX = holdX - target.x;
      const toHoldY = holdY - target.y;
      const holdDistance = Math.hypot(toHoldX, toHoldY);
      const hold = normalize(toHoldX, toHoldY);
      const desiredSpeed = clamp(holdDistance * 5.4, 0, 520);
      const gatherWidth = middleGatherRange ? 188 + targetRadius : coneWidth;
      const coneStrength = inCone
        ? clamp(1 - side / Math.max(1, coneWidth), 0, 1)
        : clamp(1 - side / Math.max(1, gatherWidth), 0.16, 0.78);
      const steer = clamp((4.8 + Math.max(0.22, response) * 8.6) * coneStrength * dt, 0, 1);
      const deltaVx = (hold.x * desiredSpeed - target.vx) * steer;
      const deltaVy = (hold.y * desiredSpeed - target.vy) * steer;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, Math.max(0.22, response));
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
      target.vx *= Math.pow(0.18 + (1 - response) * 0.42, dt);
      target.vy *= Math.pow(0.18 + (1 - response) * 0.42, dt);
      return true;
    }

    if (pulling) {
      markGadgetPullContactIntent(target, actor, aim, pullTowardActor);
      const pullTargetX = pullTowardActor ? actor.x : funnel.x;
      const pullTargetY = pullTowardActor ? actor.y : funnel.y;
      const toPullTarget = normalize(pullTargetX - target.x, pullTargetY - target.y);
      const pullDistance = Math.hypot(pullTargetX - target.x, pullTargetY - target.y);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const distanceStrength = clamp(1 - pullDistance / 620, pullTowardActor ? 0.28 : 0.16, 1);
      const force = (pullTowardActor ? 1660 : 1180) * gadgetSuckFactor(actor, input) * coneStrength * distanceStrength * response;
      const deltaVx = toPullTarget.x * force * dt;
      const deltaVy = toPullTarget.y * force * dt;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, response);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
    }

    if (pushing && forward > -20 - targetRadius * 0.15 && forward < 470 + targetRadius && side < coneWidth * 0.95 + targetRadius * 0.32) {
      const blastFalloff = clamp(1 - Math.max(0, forward) / 520, 0.22, 1);
      const sidePush = normalize(sideX, sideY);
      const force = 1450 * gadgetBlowFactor(actor, input) * blastFalloff * response;
      const deltaVx = (aim.x * force + sidePush.x * 120 * response) * dt;
      const deltaVy = (aim.y * force + sidePush.y * 120 * response) * dt;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, response);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
    }

    return true;
  }

  function viciousVacuumTargetInfluence(actor, input, target, mode) {
    if (!actor || !input || !target || !isViciousVacuumToolId(input.equippedTool)) {
      return null;
    }
    if (mode === "pull" && !(input.buttons.pull || input.toolMode === "pull")) {
      return null;
    }
    if (mode === "push" && !(input.buttons.push || input.toolMode === "push")) {
      return null;
    }

    const aim = aimVector(input);
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aim.x + toTargetY * aim.y;
    const sideX = toTargetX - aim.x * forward;
    const sideY = toTargetY - aim.y * forward;
    const side = Math.hypot(sideX, sideY);
    const targetRadius = Math.max(0, finiteOr(target.radius, 0));
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const pullRange = forward > -70 && forward < gadgetForceReachForInput(actor, input) + targetRadius && side < coneWidth + targetRadius * 0.28;
    const pushRange = forward > -20 && forward < 470 + targetRadius && side < coneWidth * 0.95 + targetRadius * 0.28;
    const activeRange = mode === "push" ? pushRange : pullRange;
    if (!activeRange) {
      return null;
    }

    return {
      aim,
      sideX,
      sideY,
      forward,
      side,
      coneWidth,
      pullStrength: clamp(1 - Math.max(0, forward) / (mode === "push" ? 520 : 620), mode === "push" ? 0.18 : 0.1, 1),
      centerStrength: clamp(1 - side / Math.max(1, coneWidth + targetRadius * 0.35), 0, 1)
    };
  }

  function drainBodyWithViciousVacuum(state, seedHolder, actor, input, body, dt) {
    if (!body || !isAsteroidOrLarger(body) || body.mass <= 1) {
      return false;
    }
    const influence = viciousVacuumTargetInfluence(actor, input, body, "pull");
    if (!influence) {
      return false;
    }

    const drain = Math.min(
      body.mass - 1,
      (VICIOUS_VACUUM_BODY_DRAIN_RATE + Math.sqrt(body.mass) * 0.05) *
        gadgetSuckFactor(actor, input) *
        influence.pullStrength *
        (0.35 + influence.centerStrength * 0.65) *
        dt
    );
    if (drain <= 0) {
      return false;
    }

    const source = {
      id: -1,
      x: actor.x + influence.aim.x * 44,
      y: actor.y + influence.aim.y * 44,
      beamAngle: Math.atan2(influence.aim.y, influence.aim.x),
      color: { r: 255, g: 95, b: 135 },
      wobble: finiteOr(actor.walkCycle, 0)
    };
    body.mass -= drain;
    updateBodyAfterMassChange(body);
    body.textureSeed = finiteOr(body.textureSeed, 0) + drain * 0.013;
    body.ufoSapParticleBuffer = Math.max(0, finiteOr(body.ufoSapParticleBuffer, 0)) + drain;
    if (body.ufoSapParticleBuffer >= UFO_SAP_FRAGMENT_MASS) {
      const fragments = Math.min(
        UFO_SAP_MAX_FRAGMENTS_PER_BURST,
        Math.max(1, Math.floor(body.ufoSapParticleBuffer / UFO_SAP_FRAGMENT_MASS))
      );
      let remaining = body.ufoSapParticleBuffer;
      for (let i = 0; i < fragments; i += 1) {
        const fragmentMass = remaining / (fragments - i);
        remaining -= fragmentMass;
        emitUfoSapParticle(state, seedHolder, source, body, fragmentMass, influence.pullStrength, influence.centerStrength);
      }
      body.ufoSapParticleBuffer = Math.max(0, remaining);
    }
    state.events.push({ type: "viciousVacuum.bodyDrained", playerId: actor.id, bodyId: body.id, tick: state.tick });
    return true;
  }

  function applyViciousVacuumToMob(state, actor, input, mob, dt) {
    if (!state || !actor || !input || !mob || mob.health <= 0 || !isViciousVacuumToolId(input.equippedTool)) {
      return false;
    }

    let affected = false;
    if (viciousVacuumTargetInfluence(actor, input, mob, "push")) {
      applyGadgetForces(mob, actor, {
        ...input,
        toolMode: "push",
        buttons: { ...input.buttons, pull: false, hold: false, push: true }
      }, dt, { captureInFunnel: false });
      if (mob.landed) {
        mob.landed = null;
        mob.residentTier = null;
      }
      affected = true;
    }

    const influence = viciousVacuumTargetInfluence(actor, input, mob, "pull");
    if (!influence) {
      return affected;
    }

    mob.visciousVacuumDrainTimer = Math.max(0, finiteOr(mob.visciousVacuumDrainTimer, 0) - dt);
    if (mob.visciousVacuumDrainTimer > 0) {
      return true;
    }

    mob.visciousVacuumDrainTimer += VICIOUS_VACUUM_MOB_DRAIN_TICK_INTERVAL;
    const strength = influence.pullStrength * (0.4 + influence.centerStrength * 0.6) * gadgetSuckFactor(actor, input);
    const before = Math.max(0, finiteOr(mob.health, 0));
    const damage = VICIOUS_VACUUM_MOB_DRAIN_RATE * VICIOUS_VACUUM_MOB_DRAIN_TICK_INTERVAL * strength;
    damageMob(state, mob, damage, "vicious-vacuum", actor.id || "");
    const drained = Math.max(0, before - Math.max(0, finiteOr(mob.health, 0)));
    if (drained > 0 && actor.health > 0) {
      actor.health = Math.min(finiteOr(actor.maxHealth, PLAYER_MAX_HEALTH), finiteOr(actor.health, 0) + drained);
      state.events.push({ type: "viciousVacuum.mobDrained", playerId: actor.id, mobId: mob.id, kind: mob.kind, amount: drained, tick: state.tick });
    }
    return true;
  }

  function isLandableBody(body) {
    const tier = body && body.tier ? body.tier : body ? tierForMass(body.mass) : null;
    return Boolean(tier && tier.name !== "star" && finiteOr(tier.threshold, 0) >= 150);
  }

  function findNearestLandableBody(world, player) {
    if (!world || !player) {
      return null;
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (const body of world.particles || []) {
      if (!isLandableBody(body)) {
        continue;
      }

      const dx = finiteOr(player.x, 0) - finiteOr(body.x, 0);
      const dy = finiteOr(player.y, 0) - finiteOr(body.y, 0);
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const landingRange = finiteOr(body.radius, radiusFromMass(body.mass)) +
        surfaceExtensionAtAngle(world, body, angle) +
        PLAYER_FOOT_OFFSET +
        LANDING_RANGE_PADDING;

      if (distance < landingRange && distance < nearestDistance) {
        nearest = body;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function detachPlayerFromBody(world, player, jumpStrength) {
    if (!player || !player.landed) {
      return;
    }

    const angle = finiteOr(player.landed.angle, 0);
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const bridge = player.landed.bridgeId ? activeBridgeById(world, player.landed.bridgeId) : null;
    const pose = bridge ? bridgeSurfacePose(world, bridge, player.landed.bridgeT, player.landed.bridgeSide, player.landed.walkSpeed) : null;
    const body = bodyById(world, player.landed.bodyId);
    const baseVx = pose ? pose.vx : finiteOr(body && body.vx, player.vx);
    const baseVy = pose ? pose.vy : finiteOr(body && body.vy, player.vy);
    player.vx = baseVx + normalX * finiteOr(jumpStrength, 0);
    player.vy = baseVy + normalY * finiteOr(jumpStrength, 0);
    player.landed = null;
  }

  function applyLandedSurfaceConstraint(world, player) {
    if (!player || !player.landed) {
      return false;
    }

    if (player.landed.bridgeId) {
      const bridge = activeBridgeById(world, player.landed.bridgeId);
      const pose = bridge ? bridgeSurfacePose(world, bridge, player.landed.bridgeT, player.landed.bridgeSide, player.landed.walkSpeed) : null;
      if (!pose) {
        detachPlayerFromBody(world, player, 130);
        return false;
      }
      player.landed.bridgeT = pose.t;
      player.landed.bridgeSide = pose.side;
      player.landed.angle = pose.angle;
      player.x = pose.x;
      player.y = pose.y;
      player.vx = pose.vx;
      player.vy = pose.vy;
      player.cameraRoll = 0;
      return true;
    }

    const body = bodyById(world, player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      detachPlayerFromBody(world, player, 130);
      return false;
    }

    const angle = finiteOr(player.landed.angle, 0);
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const tangentX = -normalY;
    const tangentY = normalX;
    const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
    const distanceFromCenter = finiteOr(body.radius, radiusFromMass(body.mass)) + surfaceOffset + PLAYER_FOOT_OFFSET;
    const walkSpeed = finiteOr(player.landed.walkSpeed, 0);
    const surfaceVelocity = bodySurfaceVelocityAtAngle(body, angle, surfaceOffset);

    player.x = finiteOr(body.x, 0) + normalX * distanceFromCenter;
    player.y = finiteOr(body.y, 0) + normalY * distanceFromCenter;
    player.vx = surfaceVelocity.x + tangentX * walkSpeed;
    player.vy = surfaceVelocity.y + tangentY * walkSpeed;
    player.cameraRoll = 0;
    return true;
  }

  function applyGadgetThrustToBody(body, aim, direction, dt, strengthFactor, forcePoint) {
    if (!body || !isLandableBody(body)) {
      return false;
    }

    const upgradeFactor = Math.max(0.1, finiteOr(strengthFactor, 1));
    const massDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(body.mass, 1) / 100), 0.38), 0.18, 1);
    const thrust = 155 * massDamping * upgradeFactor;
    const speedFactor = clamp(Math.sqrt(upgradeFactor), 0.6, 1.75);
    const baseMaxSpeed = (220 * massDamping + 60) * speedFactor;
    const aimWorld = aim || { x: 1, y: 0 };
    const previousVx = finiteOr(body.vx, 0);
    const previousVy = finiteOr(body.vy, 0);
    const previousSpeed = Math.hypot(previousVx, previousVy);
    const accelerationX = aimWorld.x * direction * thrust * dt;
    const accelerationY = aimWorld.y * direction * thrust * dt;
    const progradeGain = previousSpeed > 0
      ? Math.max(0, (previousVx * accelerationX + previousVy * accelerationY) / previousSpeed)
      : 0;
    const maxSpeed = Math.max(baseMaxSpeed, previousSpeed + progradeGain);

    const point = forcePoint
      ? bodySurfacePointForForce(body, forcePoint.x, forcePoint.y)
      : bodySurfacePointForForce(body, body.x - aimWorld.x, body.y - aimWorld.y);
    applyBodyVelocityChangeAtPoint(body, accelerationX, accelerationY, point.x, point.y, 1);

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }
    return true;
  }

  function togglePlayerLanding(state, player) {
    const world = state && state.world;
    if (!world || !player || player.health <= 0) {
      return false;
    }

    if (player.landed) {
      detachPlayerFromBody(world, player, 190);
      return true;
    }

    const body = findNearestLandableBody(world, player);
    if (!body) {
      return false;
    }

    const angle = Math.atan2(finiteOr(player.y, 0) - finiteOr(body.y, 0), finiteOr(player.x, 0) - finiteOr(body.x, 0));
    player.landed = {
      bodyId: body.id,
      bridgeId: 0,
      bridgeT: 0,
      bridgeSide: 1,
      bridgeInputSign: 1,
      angle,
      walkSpeed: 0,
      walkCycle: finiteOr(player.walkCycle, 0)
    };
    applyLandedSurfaceConstraint(world, player);
    return true;
  }

  function updateBridgeLandedPlayer(state, player, input, dt) {
    const world = state && state.world;
    const bridge = world && player && player.landed ? activeBridgeById(world, player.landed.bridgeId) : null;
    const geometry = bridge ? bridgeGeometry(bridge) : null;
    if (!world || !player || !bridge || !geometry) {
      detachPlayerFromBody(world, player, 120);
      return;
    }

    if (input.buttons.land && input.landAction !== "land") {
      detachPlayerFromBody(world, player, 190);
      player.moving = false;
      player.crouching = false;
      return;
    }

    const walkSpeed = input.buttons.down ? 68 : 128;
    const holdActive = input.buttons.hold || input.toolMode === "hold";
    let walkDirection = 0;
    if (!holdActive && input.buttons.left) {
      walkDirection -= 1;
    }
    if (!holdActive && input.buttons.right) {
      walkDirection += 1;
    }
    walkDirection = clamp(walkDirection, -1, 1);

    const inputSign = finiteOr(player.landed.bridgeInputSign, 1) < 0 ? -1 : 1;
    const pathSpeed = walkDirection * inputSign * walkSpeed;
    player.landed.walkSpeed = pathSpeed;
    if (walkDirection) {
      player.walkCycle = finiteOr(player.walkCycle, 0) + (2.3 + Math.abs(pathSpeed) * 0.052) * dt;
    }
    player.landed.walkCycle = finiteOr(player.walkCycle, 0);
    player.landed.bridgeT = finiteOr(player.landed.bridgeT, 0) + pathSpeed * dt;

    const startJoin = bridgeEndpointJoin(world, bridge, bridge.bodyId, player.landed.bridgeSide);
    const endJoin = bridgeEndpointJoin(world, bridge, bridge.linkedBodyId, player.landed.bridgeSide);
    const startExitT = startJoin ? startJoin.t : 0;
    const endExitT = endJoin ? endJoin.t : geometry.length;

    if (pathSpeed < 0 && player.landed.bridgeT <= startExitT) {
      transferPlayerFromBridgeToBody(world, player, bridge, bridge.bodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    if (pathSpeed > 0 && player.landed.bridgeT >= endExitT) {
      transferPlayerFromBridgeToBody(world, player, bridge, bridge.linkedBodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    player.landed.bridgeT = clamp(player.landed.bridgeT, startExitT, endExitT);
    player.moving = Boolean(walkDirection);
    player.crouching = Boolean(input.buttons.down);
    applyLandedSurfaceConstraint(world, player);
  }
