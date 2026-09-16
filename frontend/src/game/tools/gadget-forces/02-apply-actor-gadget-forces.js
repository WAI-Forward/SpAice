  function applyActorGadgetForces(target, state, dt, options = {}) {
    if (!state || !state.actor || !target) {
      return false;
    }
    const leftActive = state.left === true;
    const middleActive = state.middle === true;
    const rightActive = state.right === true;
    if (!leftActive && !middleActive && !rightActive) {
      return false;
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const funnel = state.funnel || actorFunnel(actor, aimWorld);
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aimWorld.x + toTargetY * aimWorld.y;
    const sideX = toTargetX - aimWorld.x * forward;
    const sideY = toTargetY - aimWorld.y * forward;
    const side = length(sideX, sideY);
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const forceReach = gadgetForceReachForState(state);
    const holdReach = gadgetHoldReachForState(state);
    const inCone = forward > -70 && forward < forceReach && side < coneWidth;
    const toMouthX = funnel.x - target.x;
    const toMouthY = funnel.y - target.y;
    const mouthDist = length(toMouthX, toMouthY);
    const pushResponse = bodyPushResponse(target);
    const targetRadius = finiteOr(target.radius, 1);
    const captureInFunnel = options.captureInFunnel !== false;
    const pullTowardActor = options.pullTowardActor === true;
    const torquePoint = target.tier ? bodySurfacePointForForce(target, actor.x, actor.y) : null;

    const middleGatherRange = middleActive && partyGadgetMiddleGatherRange(forward, side, target.radius, 0, state);

    if (middleActive && (inCone || middleGatherRange)) {
      const holdX = actor.x + aimWorld.x * holdReach;
      const holdY = actor.y + aimWorld.y * holdReach;
      const toHoldX = holdX - target.x;
      const toHoldY = holdY - target.y;
      const holdDistance = length(toHoldX, toHoldY);
      const gatherWidth = middleGatherRange ? 188 + Math.max(0, finiteOr(target.radius, 0)) : coneWidth;
      const coneStrength = inCone
        ? clamp(1 - side / Math.max(1, coneWidth), 0, 1)
        : clamp(1 - side / Math.max(1, gatherWidth), 0.16, 0.78);
      const response = Math.max(0.22, pushResponse);
      const desiredSpeed = clamp(holdDistance * 5.4, 0, 520);
      const hold = normalize(toHoldX, toHoldY);
      const desiredVx = hold.x * desiredSpeed;
      const desiredVy = hold.y * desiredSpeed;
      const steer = clamp((4.8 + response * 8.6) * coneStrength * dt, 0, 1);
      const deltaVx = (desiredVx - target.vx) * steer;
      const deltaVy = (desiredVy - target.vy) * steer;

      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, response);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, state.playerId || actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
      target.vx *= Math.pow(0.16 + (1 - response) * 0.42, dt);
      target.vy *= Math.pow(0.16 + (1 - response) * 0.42, dt);

      if (holdDistance < target.radius + 20 && length(target.vx, target.vy) < 58) {
        target.vx = 0;
        target.vy = 0;
        target.gadgetStabilized = true;
      } else {
        target.gadgetStabilized = false;
      }
      return true;
    }

    if (leftActive || rightActive) {
      target.gadgetStabilized = false;
    }

    if (leftActive && inCone) {
      markGadgetPullContactIntent(target, actor, aimWorld, pullTowardActor);
      const pullTargetX = pullTowardActor ? actor.x : funnel.x;
      const pullTargetY = pullTowardActor ? actor.y : funnel.y;
      const toPullTargetX = pullTargetX - target.x;
      const toPullTargetY = pullTargetY - target.y;
      const pullDistance = length(toPullTargetX, toPullTargetY);
      const pull = normalize(toPullTargetX, toPullTargetY);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const distanceStrength = clamp(1 - pullDistance / 620, pullTowardActor ? 0.28 : 0.16, 1);
      const baseForce = pullTowardActor ? 1660 : 1180;
      const force = baseForce * finiteOr(state.suckFactor, 1) * coneStrength * distanceStrength * pushResponse;
      const deltaVx = pull.x * force * dt;
      const deltaVy = pull.y * force * dt;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, pushResponse);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, state.playerId || actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);

      if (!pullTowardActor && captureInFunnel && mouthDist < funnel.radius + target.radius * 2.2) {
        const cup = normalize(toMouthX, toMouthY);
        const ringTarget = Math.max(0, funnel.radius * 0.42 - target.radius * 0.22);
        const current = mouthDist || 1;
        const settle = (current - ringTarget) * 22 * pushResponse;
        const settleVx = cup.x * settle * dt;
        const settleVy = cup.y * settle * dt;
        if (torquePoint) {
          applyBodyVelocityChangeAtPoint(target, settleVx, settleVy, torquePoint.x, torquePoint.y, pushResponse);
        } else {
          target.vx += settleVx;
          target.vy += settleVy;
        }
        target.vx *= Math.pow(0.035 + (1 - pushResponse) * 0.7, dt);
        target.vy *= Math.pow(0.035 + (1 - pushResponse) * 0.7, dt);
      }
    }

    if (rightActive && forward > -20 - targetRadius * 0.15 && forward < 470 + targetRadius && side < coneWidth * 0.9 + targetRadius * 0.32) {
      const blastFalloff = clamp(1 - Math.max(0, forward) / 520, 0.22, 1);
      const sidePush = normalize(sideX, sideY);
      const force = 1450 * finiteOr(state.blowFactor, 1) * blastFalloff * pushResponse;
      const deltaVx = (aimWorld.x * force + sidePush.x * 120 * pushResponse) * dt;
      const deltaVy = (aimWorld.y * force + sidePush.y * 120 * pushResponse) * dt;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, pushResponse);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, state.playerId || actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
    }

    return leftActive || rightActive;
  }

  function visciousVacuumTargetInfluence(state, target, mode) {
    if (!state || !state.viscious || !state.actor || !target) {
      return null;
    }
    if (mode === "pull" && state.left !== true) {
      return null;
    }
    if (mode === "push" && state.right !== true) {
      return null;
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aimWorld.x + toTargetY * aimWorld.y;
    const sideX = toTargetX - aimWorld.x * forward;
    const sideY = toTargetY - aimWorld.y * forward;
    const side = length(sideX, sideY);
    const targetRadius = Math.max(0, finiteOr(target.radius, 0));
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const pullRange = forward > -70 && forward < gadgetForceReachForState(state) + targetRadius && side < coneWidth + targetRadius * 0.28;
    const pushRange = forward > -20 && forward < 470 + targetRadius && side < coneWidth * 0.95 + targetRadius * 0.28;
    const activeRange = mode === "push" ? pushRange : pullRange;
    if (!activeRange) {
      return null;
    }

    const maxReach = mode === "push" ? 520 : 620;
    return {
      aimWorld,
      sideX,
      sideY,
      forward,
      side,
      coneWidth,
      pullStrength: clamp(1 - Math.max(0, forward) / maxReach, mode === "push" ? 0.18 : visciousVacuumBodyDrainMinStrength, 1),
      centerStrength: clamp(1 - side / Math.max(1, coneWidth + targetRadius * 0.35), 0, 1)
    };
  }

  function drainBodyWithVisciousVacuum(state, body, dt) {
    if (!body || !isAsteroidOrLarger(body) || body.mass <= 1) {
      return false;
    }
    const influence = visciousVacuumTargetInfluence(state, body, "pull");
    if (!influence) {
      return false;
    }

    const previousTier = body.tier;
    const drain = Math.min(
      body.mass - 1,
      (visciousVacuumBodyDrainRate + Math.sqrt(body.mass) * 0.05) *
        finiteOr(state.suckFactor, 1) *
        influence.pullStrength *
        (0.35 + influence.centerStrength * 0.65) *
        dt
    );
    if (drain <= 0) {
      return false;
    }

    const source = {
      id: -1,
      x: state.actor.x + influence.aimWorld.x * 44,
      y: state.actor.y + influence.aimWorld.y * 44,
      beamAngle: Math.atan2(influence.aimWorld.y, influence.aimWorld.x),
      color: { r: 255, g: 95, b: 135 },
      wobble: performance.now() * 0.001
    };
    body.mass -= drain;
    updateBodyAfterMassChange(body, previousTier);
    body.textureSeed += drain * 0.013;
    emitUfoSapParticles(source, body, drain, influence.pullStrength, influence.centerStrength);
    playSound("ufoSiphon", {
      throttleKey: "visciousVacuumSiphon:" + (state.playerId || "local"),
      throttle: 0.42,
      volume: clamp(0.42 + influence.pullStrength * 0.38, 0.42, 0.82)
    });
    return true;
  }

  function applyVisciousVacuumToMob(state, mob, dt) {
    if (!mob || mob.health <= 0 || !state || !state.viscious || !state.active || !gadgetStateMayReachTarget(state, mob, 80)) {
      return false;
    }

    let affected = false;
    if (state.right && visciousVacuumTargetInfluence(state, mob, "push")) {
      applyActorGadgetForces(mob, {
        ...state,
        left: false,
        middle: false,
        right: true
      }, dt, { captureInFunnel: false });
      if (mob.landed) {
        mob.landed = null;
        mob.residentTier = null;
      }
      affected = true;
    }

    const influence = visciousVacuumTargetInfluence(state, mob, "pull");
    if (!influence) {
      return affected;
    }

    mob.visciousVacuumDrainTimer = Math.max(0, finiteOr(mob.visciousVacuumDrainTimer, 0) - dt);
    if (mob.visciousVacuumDrainTimer > 0) {
      return true;
    }

    mob.visciousVacuumDrainTimer += visciousVacuumMobDrainTickInterval;
    const strength = influence.pullStrength * (0.4 + influence.centerStrength * 0.6) * finiteOr(state.suckFactor, 1);
    const before = Math.max(0, finiteOr(mob.health, 0));
    const damage = visciousVacuumMobDrainRate * visciousVacuumMobDrainTickInterval * strength;
    damageMob(mob, damage, { r: 255, g: 95, b: 135 }, mobName(mob) + " drained by the Viscious Vacuum.", {
      sourceTool: visciousVacuumToolId
    });
    const drained = Math.max(0, before - Math.max(0, finiteOr(mob.health, 0)));
    if (drained > 0 && state.actor === player && player.health > 0) {
      player.health = Math.min(player.maxHealth, player.health + drained);
    }
    return true;
  }

  function updateVisciousVacuumMobs(dt) {
    const aim = getAim();
    const states = [];
    const localState = localGadgetStateForFrame(aim, getFunnel(aim));
    if (localState && localState.viscious && localState.active) {
      states.push(localState);
    }
    for (const state of activePartyGadgetStates()) {
      if (state && state.viscious && state.active) {
        states.push(state);
      }
    }
    if (!states.length) {
      return;
    }

    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0) {
        continue;
      }
      for (const state of states) {
        applyVisciousVacuumToMob(state, mob, dt);
        if (mob.health <= 0) {
          break;
        }
      }
    }
  }

  function updateMobBeaconGadgetForces(dt) {
    const aim = getAim();
    const states = [];
    const localState = localGadgetStateForFrame(aim, getFunnel(aim));
    if (localState && localState.active) {
      states.push(localState);
    }
    for (const state of activePartyGadgetStates()) {
      if (state && state.active) {
        states.push(state);
      }
    }
    if (!states.length) {
      return;
    }

    for (const beacon of mobBeacons) {
      if (!beacon || beacon.health <= 0) {
        continue;
      }
      for (const state of states) {
        if (gadgetStateMayReachTarget(state, beacon, 80)) {
          if (applyActorGadgetForces(beacon, state, dt, { captureInFunnel: false })) {
            beacon.gadgetForceTimer = 0.18;
          }
        }
      }
    }
  }

  function collideFunnelSegment(state, ax, ay, bx, by, radius) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((state.x - ax) * abx + (state.y - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = state.x - closestX;
    const dy = state.y - closestY;
    const dist = Math.hypot(dx, dy);
    const minDist = radius + funnelShape.wallThickness;

    if (dist >= minDist) {
      return false;
    }

    let nx = dx / (dist || 1);
    let ny = dy / (dist || 1);
    if (dist < 0.001) {
      nx = -aby / Math.sqrt(abLenSq);
      ny = abx / Math.sqrt(abLenSq);
    }

    const overlap = minDist - dist;
    state.x += nx * overlap;
    state.y += ny * overlap;

    const incoming = state.vx * nx + state.vy * ny;
    if (incoming < 0) {
      state.vx -= incoming * 1.26 * nx;
      state.vy -= incoming * 1.26 * ny;

      const tx = -ny;
      const ty = nx;
      const tangent = state.vx * tx + state.vy * ty;
      state.vx -= tangent * 0.1 * tx;
      state.vy -= tangent * 0.1 * ty;
    }

    return true;
  }

  function resolveFunnelBucket(target, aim, dt) {
    return resolveActorFunnelBucket(target, {
      actor: player,
      aimWorld: aim.world,
      left: canUseSuctionControls() && mouse.left,
      right: canUseSuctionControls() && mouse.right
    }, dt);
  }

  function resolveActorFunnelBucket(target, state, dt) {
    if (!state || !state.actor || !target) {
      return false;
    }
    const leftActive = state.left === true;
    const rightActive = state.right === true;
    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const normal = { x: -aimWorld.y, y: aimWorld.x };
    const relX = target.x - actor.x;
    const relY = target.y - actor.y;
    const velocityX = target.vx - finiteOr(actor.vx, 0);
    const velocityY = target.vy - finiteOr(actor.vy, 0);
    const originalState = {
      x: relX * aimWorld.x + relY * aimWorld.y,
      y: relX * normal.x + relY * normal.y,
      vx: velocityX * aimWorld.x + velocityY * aimWorld.y,
      vy: velocityX * normal.x + velocityY * normal.y
    };
    const bucketState = {
      ...originalState
    };
    const pushResponse = bodyPushResponse(target);

    let touchedBucket = false;
    const backX = funnelShape.backX;
    const backHalf = funnelShape.backHalf;
    const rimX = funnelShape.rimX;
    const rimHalf = funnelShape.rimHalf;
    const requestedBucketPadding = Math.max(0, finiteOr(state.bucketPadding, 0));
    const bucketPadding = requestedBucketPadding > 0
      ? clamp(target.radius * 0.35, 5, requestedBucketPadding)
      : 0;
    const radius = target.radius + bucketPadding;

    touchedBucket = collideFunnelSegment(bucketState, backX, -backHalf, rimX, -rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, backX, backHalf, rimX, rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, backX, -backHalf, backX, backHalf, radius) || touchedBucket;

    if (bucketState.x >= backX && bucketState.x <= rimX) {
      const half = funnelHalfAt(bucketState.x);
      const availableHalf = Math.max(7, half - radius * 0.42);
      if (Math.abs(bucketState.y) > availableHalf && Math.abs(bucketState.y) < half) {
        const side = Math.sign(bucketState.y) || 1;
        bucketState.y = side * availableHalf;
        if (bucketState.vy * side > 0) {
          bucketState.vy *= -0.22;
        }
        touchedBucket = true;
      }
    }

    if (
      bucketState.x < backX + radius &&
      bucketState.x > backX - radius * 1.35 &&
      Math.abs(bucketState.y) < backHalf + radius * 0.8 &&
      (bucketState.x >= backX || bucketState.vx < 0)
    ) {
      bucketState.x = backX + radius;
      if (bucketState.vx < 0) {
        bucketState.vx *= -0.24;
      }
      touchedBucket = true;
    }

    const cupHalf = funnelHalfAt(bucketState.x);
    const insideCup =
      bucketState.x > backX - radius * 0.35 &&
      bucketState.x < rimX + radius * 0.55 &&
      Math.abs(bucketState.y) < cupHalf + radius * 0.25;

    if (insideCup || touchedBucket) {
      const damping = Math.pow(rightActive ? 0.72 : 0.18, dt);
      bucketState.vx *= damping;
      bucketState.vy *= damping;

      if (!rightActive) {
        bucketState.vx += (funnelShape.captureX - bucketState.x) * 7.5 * dt;
        bucketState.vy += -bucketState.y * 8.5 * dt;
      }

      if (leftActive) {
        bucketState.vx += (funnelShape.captureX - bucketState.x) * 6.5 * dt;
        bucketState.vy += -bucketState.y * 6.5 * dt;
      }
    }

    const resolvedState = {
      x: originalState.x + (bucketState.x - originalState.x) * pushResponse,
      y: originalState.y + (bucketState.y - originalState.y) * pushResponse,
      vx: originalState.vx + (bucketState.vx - originalState.vx) * pushResponse,
      vy: originalState.vy + (bucketState.vy - originalState.vy) * pushResponse
    };

    target.x = actor.x + aimWorld.x * resolvedState.x + normal.x * resolvedState.y;
    target.y = actor.y + aimWorld.y * resolvedState.x + normal.y * resolvedState.y;
    target.vx = finiteOr(actor.vx, 0) + aimWorld.x * resolvedState.vx + normal.x * resolvedState.vy;
    target.vy = finiteOr(actor.vy, 0) + aimWorld.y * resolvedState.vx + normal.y * resolvedState.vy;
    if (insideCup || touchedBucket) {
      markSurvivalCampBodyMovedByPlayer(target, state.playerId || actor.id || "");
    }
    return insideCup || touchedBucket;
  }
