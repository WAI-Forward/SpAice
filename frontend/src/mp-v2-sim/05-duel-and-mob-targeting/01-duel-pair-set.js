  function duelPairSet(options) {
    const source = options && (options.duels || options.activeDuels || options.duelPairs);
    if (source instanceof Set) {
      return source;
    }
    const pairs = new Set();
    if (Array.isArray(source)) {
      for (const entry of source) {
        if (Array.isArray(entry)) {
          const key = normalizeDuelPairKey(entry[0], entry[1]);
          if (key) {
            pairs.add(key);
          }
        } else {
          const text = String(entry || "");
          if (text) {
            pairs.add(text);
          }
        }
      }
    } else if (source && typeof source === "object") {
      for (const [key, active] of Object.entries(source)) {
        if (active) {
          pairs.add(String(key));
        }
      }
    }
    return pairs;
  }

  function playersAreDueling(options, a, b) {
    const key = normalizeDuelPairKey(a, b);
    return Boolean(key && duelPairSet(options).has(key));
  }

  function sharedPublicPvpEnabled(options) {
    return Boolean(options && (options.pvpMode === "shared-public" || options.worldMode === "shared-public"));
  }

  function playerTeamId(state, options, playerId) {
    const id = String(playerId || "");
    if (!id) {
      return "";
    }
    const teamsByPlayerId = options && options.teamsByPlayerId;
    if (teamsByPlayerId instanceof Map) {
      return String(teamsByPlayerId.get(id) || "");
    }
    if (teamsByPlayerId && typeof teamsByPlayerId === "object" && Object.prototype.hasOwnProperty.call(teamsByPlayerId, id)) {
      return String(teamsByPlayerId[id] || "");
    }
    const player = state && state.players && state.players[id];
    return String(player && player.teamId || "");
  }

  function canPlayerOwnedDamagePlayer(state, options, sourcePlayerId, targetPlayerId) {
    const sourceId = String(sourcePlayerId || "");
    const targetId = String(targetPlayerId || "");
    if (!sourceId || !targetId || sourceId === targetId) {
      return false;
    }
    if (sharedPublicPvpEnabled(options)) {
      const sourceTeamId = playerTeamId(state, options, sourceId);
      const targetTeamId = playerTeamId(state, options, targetId);
      return !sourceTeamId || !targetTeamId || sourceTeamId !== targetTeamId;
    }
    return playersAreDueling(options, sourceId, targetId);
  }

  function isGadgetToolMode(mode) {
    return mode === "pull" || mode === "push" || mode === "hold";
  }

  function toolUpgradeLevel(player, toolId, upgradeId) {
    const toolLevels = player && player.toolUpgrades && player.toolUpgrades[toolId] && typeof player.toolUpgrades[toolId] === "object"
      ? player.toolUpgrades[toolId]
      : {};
    return Math.max(0, finiteOr(toolLevels[upgradeId], 0));
  }

  function upgradeBonus(level, bonusScale) {
    const cleanLevel = Math.max(0, finiteOr(level, 0));
    const cleanScale = Math.max(0, finiteOr(bonusScale, 0));
    return cleanScale * (0.28 / Math.log1p(0.5)) * Math.log1p(cleanLevel * 0.5);
  }

  function toolUpgradeFactor(player, toolId, upgradeId) {
    const bonuses = TOOL_UPGRADE_BONUS_SCALES[toolId] || {};
    return 1 + upgradeBonus(toolUpgradeLevel(player, toolId, upgradeId), bonuses[upgradeId] || 0);
  }

  function gadgetSuckFactor(player, input) {
    return toolUpgradeFactor(player, isSuctionToolId(input && input.equippedTool) ? input.equippedTool : DEFAULT_TOOL_ID, "suck");
  }

  function gadgetBlowFactor(player, input) {
    return toolUpgradeFactor(player, isSuctionToolId(input && input.equippedTool) ? input.equippedTool : DEFAULT_TOOL_ID, "blow");
  }

  function gadgetRangeFactor(player, input) {
    return gadgetSuckFactor(player, input);
  }

  function gadgetForceReachForInput(player, input) {
    return GADGET_FORCE_REACH * Math.max(0.1, finiteOr(gadgetRangeFactor(player, input), 1));
  }

  function gadgetHoldReachForInput(player, input) {
    const suction = Math.max(0.1, finiteOr(gadgetSuckFactor(player, input), 1));
    const propulsion = Math.max(0.1, finiteOr(gadgetBlowFactor(player, input), 1));
    const nearReach = FUNNEL.rimX + 5;
    const farReach = nearReach + 2 * (GADGET_HOLD_REACH - nearReach) * Math.max(suction, propulsion);
    const balance = clamp(1 + 1.25 * (propulsion - suction) / Math.max(suction, propulsion), 0.3, 1.7);
    return nearReach + (farReach - nearReach) * 0.5 * balance;
  }

  function gadgetPushReachForInput(player, input) {
    return GADGET_PUSH_REACH * Math.max(0.1, finiteOr(gadgetBlowFactor(player, input), 1));
  }

  function weaponByToolId(player, toolId) {
    const id = String(toolId || "");
    const base = PLAYER_WEAPON_DEFINITIONS[id] || null;
    if (!base || !playerHasTool(player, id)) {
      return null;
    }
    const rangeFactor = toolUpgradeFactor(player, id, "range");
    return {
      ...base,
      damage: base.damage * toolUpgradeFactor(player, id, "damage"),
      life: base.life * rangeFactor
    };
  }

  function sanitizeInput(source, fallbackPlayer, options) {
    const input = source && typeof source === "object" ? source : {};
    const buttons = input.buttons && typeof input.buttons === "object" ? input.buttons : {};
    const fallback = fallbackPlayer && typeof fallbackPlayer === "object" ? fallbackPlayer : {};
    const fallbackAimAngle = finiteOr(fallback.aimAngle, 0);
    const aimAngle = Number.isFinite(Number(input.aimAngle)) ? finiteOr(input.aimAngle, 0) : fallbackAimAngle;
    const fallbackAimLocalAngle = Number.isFinite(Number(fallback.aimLocalAngle))
      ? finiteOr(fallback.aimLocalAngle, 0)
      : aimAngle;
    const validToolModes = ["pull", "push", "hold", "fire", "release", "dismantle", "idle"];
    const fallbackToolMode = validToolModes.includes(fallback.toolMode) ? fallback.toolMode : "idle";
    const toolsDisabled = hasPlayerStatusEffect(fallback, "disabled");
    const equippedTool = String(input.equippedTool || fallback.equippedTool || DEFAULT_TOOL_ID);
    let toolMode = toolsDisabled ? "idle" : (validToolModes.includes(input.toolMode) ? input.toolMode : fallbackToolMode);
    if (isFamiliarNetToolId(equippedTool) && (toolMode === "push" || buttons.push === true)) {
      toolMode = "release";
    }
    if (toolMode === "idle" && isSuctionToolId(equippedTool)) {
      toolMode = buttons.hold === true ? "hold" : buttons.pull === true ? "pull" : buttons.push === true ? "push" : "idle";
    }
    if (!isSuctionToolId(equippedTool) && isGadgetToolMode(toolMode)) {
      toolMode = "idle";
    }
    if (!isSpannerToolId(equippedTool) && toolMode === "dismantle") {
      toolMode = "idle";
    }
    if (!isFamiliarNetToolId(equippedTool) && !isPersonalTetherToolId(equippedTool) && toolMode === "release") {
      toolMode = "idle";
    }
    const requireEnergy = Boolean(options && options.requireEnergy);
    const dt = options && Number.isFinite(Number(options.dt)) ? Math.max(0, finiteOr(options.dt, TICK_DT)) : TICK_DT;
    const committedToolMode = Boolean(
      options &&
      options.allowCommittedToolMode &&
      isSuctionToolId(equippedTool) &&
      isGadgetToolMode(toolMode) &&
      isSuctionToolId(fallback.equippedTool) &&
      fallbackToolMode === toolMode
    );
    if (
      requireEnergy &&
      isSuctionToolId(equippedTool) &&
      isGadgetToolMode(toolMode) &&
      !committedToolMode &&
      !canSpendPlayerEnergy(fallback, continuousEnergyActivationCost(gadgetEnergyCost(dt)))
    ) {
      toolMode = "idle";
    }
    const gadgetButtonsAllowed = !toolsDisabled && isSuctionToolId(equippedTool) && isGadgetToolMode(toolMode);
    const rawLandAction = input.landAction || buttons.landAction || "";
    const familiarCommandSource = input.familiarCommand && typeof input.familiarCommand === "object" ? input.familiarCommand : null;
    const familiarCommand = familiarCommandSource ? {
      x: finiteOr(familiarCommandSource.x, finiteOr(fallback.x, 0)),
      y: finiteOr(familiarCommandSource.y, finiteOr(fallback.y, 0))
    } : null;
    return {
      seq: Math.max(0, Math.floor(finiteOr(input.seq, 0))),
      clientTick: Math.max(0, Math.floor(finiteOr(input.clientTick, 0))),
      aimAngle,
      aimLocalAngle: Number.isFinite(Number(input.aimLocalAngle))
        ? finiteOr(input.aimLocalAngle, 0)
        : fallbackAimLocalAngle,
      equippedTool,
      toolMode,
      familiarCommand,
      landAction: rawLandAction === "takeoff" ? "takeoff" : rawLandAction === "land" ? "land" : "",
      buttons: {
        up: buttons.up === true,
        down: buttons.down === true,
        left: buttons.left === true,
        right: buttons.right === true,
        land: buttons.land === true,
        boost: !toolsDisabled && buttons.boost === true && (!requireEnergy || canSpendPlayerEnergy(fallback, continuousEnergyActivationCost(boostEnergyCost(dt)))),
        pull: gadgetButtonsAllowed && toolMode === "pull",
        push: gadgetButtonsAllowed && toolMode === "push",
        hold: gadgetButtonsAllowed && toolMode === "hold",
        fire: !toolsDisabled && (buttons.fire === true || toolMode === "fire"),
        release: !toolsDisabled && (isFamiliarNetToolId(equippedTool) || isPersonalTetherToolId(equippedTool)) && (buttons.release === true || toolMode === "release"),
        dismantle: !toolsDisabled && isSpannerToolId(equippedTool) && (buttons.dismantle === true || toolMode === "dismantle")
      }
    };
  }

  function aimVector(input) {
    const angle = finiteOr(input && input.aimAngle, 0);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  function bodyPushResponse(body) {
    if (isStarBody(body)) {
      return 0.22;
    }

    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    if (mass < 150) {
      return 1;
    }
    return clamp(Math.pow(150 / mass, 0.48), 0.18, 1);
  }

  function decayGadgetPullContactIntent(body, dt) {
    if (!body) {
      return;
    }
    if (body.gadgetPullContactTimer !== undefined) {
      body.gadgetPullContactTimer = Math.max(0, finiteOr(body.gadgetPullContactTimer, 0) - dt);
    }
    if (body.directGadgetForceTimer !== undefined) {
      body.directGadgetForceTimer = Math.max(0, finiteOr(body.directGadgetForceTimer, 0) - dt);
    }
  }

  function markGadgetPullContactIntent(body, actor, aim, pullTowardActor) {
    if (!body || !body.tier || !body.tier.solid || !actor || !aim) {
      return;
    }
    body.gadgetPullContactTimer = 0.09;
    body.gadgetPullActorId = actor.id || "";
    body.gadgetPullAimX = finiteOr(aim.x, 1);
    body.gadgetPullAimY = finiteOr(aim.y, 0);
    body.gadgetPullTowardActor = pullTowardActor === true;
  }

  function inheritGadgetPullContactIntent(target, firstSource, secondSource) {
    if (!target) {
      return;
    }

    const firstTimer = Math.max(0, finiteOr(firstSource && firstSource.gadgetPullContactTimer, 0));
    const secondTimer = Math.max(0, finiteOr(secondSource && secondSource.gadgetPullContactTimer, 0));
    const source = secondTimer > firstTimer ? secondSource : firstSource;
    const timer = Math.max(firstTimer, secondTimer);
    if (!source || timer <= 0) {
      return;
    }

    target.gadgetPullContactTimer = timer;
    target.gadgetPullActorId = source.gadgetPullActorId || "";
    target.gadgetPullAimX = finiteOr(source.gadgetPullAimX, 1);
    target.gadgetPullAimY = finiteOr(source.gadgetPullAimY, 0);
    target.gadgetPullTowardActor = source.gadgetPullTowardActor === true;
  }

  function markDirectGadgetBodyForceIntent(body, actor) {
    if (!body || !body.tier || !body.tier.solid || !actor || !actor.landed || actor.landed.bridgeId) {
      return;
    }
    const landedBodyId = Math.max(0, Math.floor(finiteOr(actor.landed.bodyId, 0)));
    if (!landedBodyId || landedBodyId === body.id) {
      return;
    }
    body.directGadgetForceTimer = 0.12;
    body.directGadgetForceActorId = actor.id || "";
    body.directGadgetForceLandedBodyId = landedBodyId;
  }

  function isDirectGadgetForcedFromLandedBody(body, landedBody) {
    return Boolean(
      body &&
      landedBody &&
      body.tier &&
      body.tier.solid &&
      finiteOr(body.directGadgetForceTimer, 0) > 0 &&
      Math.max(0, Math.floor(finiteOr(body.directGadgetForceLandedBodyId, 0))) === landedBody.id
    );
  }

  function isSelfVacuumPulledBodyContact(player, body, nx, ny) {
    if (!player || !body || !body.tier || !body.tier.solid || finiteOr(body.gadgetPullContactTimer, 0) <= 0) {
      return false;
    }

    const actorId = body.gadgetPullActorId || "";
    if (actorId && player.id && actorId !== player.id) {
      return false;
    }

    const aimX = finiteOr(body.gadgetPullAimX, 1);
    const aimY = finiteOr(body.gadgetPullAimY, 0);
    const toBodyX = finiteOr(body.x, 0) - finiteOr(player.x, 0);
    const toBodyY = finiteOr(body.y, 0) - finiteOr(player.y, 0);
    const bodyForward = toBodyX * aimX + toBodyY * aimY;
    const sideX = toBodyX - aimX * bodyForward;
    const sideY = toBodyY - aimY * bodyForward;
    const side = Math.hypot(sideX, sideY);
    const contactRadius = solidContactRadius(body);
    const playerRadius = Math.max(1, finiteOr(player.radius, PLAYER_RADIUS));
    const closeSuctionCorridor = bodyForward > -contactRadius * 0.65 && side < contactRadius + playerRadius * 0.9;
    const contactFacesAim = nx * aimX + ny * aimY < -0.16;
    const bodyClosingSpeed = (finiteOr(body.vx, 0) - finiteOr(player.vx, 0)) * nx +
      (finiteOr(body.vy, 0) - finiteOr(player.vy, 0)) * ny;

    return closeSuctionCorridor && (contactFacesAim || bodyClosingSpeed > 8);
  }

  function resolveSelfVacuumPulledBodyContact(player, body, nx, ny, overlap, damping) {
    body.x -= nx * overlap;
    body.y -= ny * overlap;

    const closingSpeed = (finiteOr(body.vx, 0) - finiteOr(player.vx, 0)) * nx +
      (finiteOr(body.vy, 0) - finiteOr(player.vy, 0)) * ny;
    if (closingSpeed > 0) {
      const impulse = closingSpeed * finiteOr(damping, 0.86);
      const pointX = finiteOr(body.x, 0) + nx * bodyAngularInertiaRadius(body);
      const pointY = finiteOr(body.y, 0) + ny * bodyAngularInertiaRadius(body);
      applyBodyVelocityChangeAtPoint(body, -nx * impulse, -ny * impulse, pointX, pointY, BODY_CONSTRAINT_TORQUE_RESPONSE);
    }
  }

  function actorFunnel(actor, aim) {
    return {
      x: actor.x + aim.x * FUNNEL.captureX,
      y: actor.y + aim.y * FUNNEL.captureX,
      radius: FUNNEL.rimHalf
    };
  }

  function funnelHalfAt(localX) {
    const t = clamp((localX - FUNNEL.backX) / (FUNNEL.rimX - FUNNEL.backX), 0, 1);
    return FUNNEL.backHalf + (FUNNEL.rimHalf - FUNNEL.backHalf) * t;
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
    const minDist = radius + FUNNEL.wallThickness;

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

  function resolveFunnelBucket(target, actor, input, dt) {
    if (!target || !actor || actor.health <= 0 || !isSuctionToolId(actor.equippedTool)) {
      return false;
    }

    const safeInput = sanitizeInput(input, actor, { dt, requireEnergy: true, allowCommittedToolMode: true });
    const leftActive = safeInput.buttons.pull || safeInput.toolMode === "pull";
    const rightActive = safeInput.buttons.push || safeInput.toolMode === "push";
    const aim = { x: Math.cos(actor.aimAngle), y: Math.sin(actor.aimAngle) };
    const normal = { x: -aim.y, y: aim.x };
    const relX = target.x - actor.x;
    const relY = target.y - actor.y;
    const velocityX = target.vx - finiteOr(actor.vx, 0);
    const velocityY = target.vy - finiteOr(actor.vy, 0);
    const originalState = {
      x: relX * aim.x + relY * aim.y,
      y: relX * normal.x + relY * normal.y,
      vx: velocityX * aim.x + velocityY * aim.y,
      vy: velocityX * normal.x + velocityY * normal.y
    };
    const bucketState = { ...originalState };
    const pushResponse = bodyPushResponse(target);
    const radius = finiteOr(target.radius, 1);

    let touchedBucket = false;
    touchedBucket = collideFunnelSegment(bucketState, FUNNEL.backX, -FUNNEL.backHalf, FUNNEL.rimX, -FUNNEL.rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, FUNNEL.backX, FUNNEL.backHalf, FUNNEL.rimX, FUNNEL.rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, FUNNEL.backX, -FUNNEL.backHalf, FUNNEL.backX, FUNNEL.backHalf, radius) || touchedBucket;

    if (bucketState.x >= FUNNEL.backX && bucketState.x <= FUNNEL.rimX) {
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
      bucketState.x < FUNNEL.backX + radius &&
      bucketState.x > FUNNEL.backX - radius * 1.35 &&
      Math.abs(bucketState.y) < FUNNEL.backHalf + radius * 0.8 &&
      (bucketState.x >= FUNNEL.backX || bucketState.vx < 0)
    ) {
      bucketState.x = FUNNEL.backX + radius;
      if (bucketState.vx < 0) {
        bucketState.vx *= -0.24;
      }
      touchedBucket = true;
    }

    const cupHalf = funnelHalfAt(bucketState.x);
    const insideCup =
      bucketState.x > FUNNEL.backX - radius * 0.35 &&
      bucketState.x < FUNNEL.rimX + radius * 0.55 &&
      Math.abs(bucketState.y) < cupHalf + radius * 0.25;

    if (insideCup || touchedBucket) {
      const damping = Math.pow(rightActive ? 0.72 : 0.18, dt);
      bucketState.vx *= damping;
      bucketState.vy *= damping;

      if (!rightActive) {
        bucketState.vx += (FUNNEL.captureX - bucketState.x) * 7.5 * dt;
        bucketState.vy += -bucketState.y * 8.5 * dt;
      }

      if (leftActive) {
        bucketState.vx += (FUNNEL.captureX - bucketState.x) * 6.5 * dt;
        bucketState.vy += -bucketState.y * 6.5 * dt;
      }
    }

    const resolvedState = {
      x: originalState.x + (bucketState.x - originalState.x) * pushResponse,
      y: originalState.y + (bucketState.y - originalState.y) * pushResponse,
      vx: originalState.vx + (bucketState.vx - originalState.vx) * pushResponse,
      vy: originalState.vy + (bucketState.vy - originalState.vy) * pushResponse
    };

    target.x = actor.x + aim.x * resolvedState.x + normal.x * resolvedState.y;
    target.y = actor.y + aim.y * resolvedState.x + normal.y * resolvedState.y;
    target.vx = finiteOr(actor.vx, 0) + aim.x * resolvedState.vx + normal.x * resolvedState.vy;
    target.vy = finiteOr(actor.vy, 0) + aim.y * resolvedState.vx + normal.y * resolvedState.vy;
    if (insideCup || touchedBucket) {
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
    }
    return insideCup || touchedBucket;
  }

  function gadgetMiddleGatherRange(forward, side, targetRadius, holdReach) {
    const radius = Math.max(0, finiteOr(targetRadius, 0));
    return (
      forward > FUNNEL.backX - 130 &&
      forward < Math.max(1, finiteOr(holdReach, GADGET_HOLD_REACH)) + radius + 90 &&
      side < 188 + radius
    );
  }
