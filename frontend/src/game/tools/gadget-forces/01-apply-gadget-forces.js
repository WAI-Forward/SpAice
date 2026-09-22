  function applyGadgetForces(target, aim, funnel, dt, options = {}) {
    return applyActorGadgetForces(target, {
      actor: player,
      aimWorld: aim.world,
      funnel,
      left: canUseSuctionControls() && mouse.left,
      middle: canUseSuctionControls() && mouse.middle,
      right: canUseSuctionControls() && mouse.right,
      suckFactor: currentGadgetSuckFactor(),
      rangeFactor: currentGadgetRangeFactor(),
      blowFactor: currentGadgetBlowFactor(),
      toolId: equippedToolId,
      viscious: isVisciousVacuumEquipped()
    }, dt, options);
  }

  function localGadgetStateForFrame(aim, funnel) {
    const enabled = canUseSuctionControls();
    return {
      playerId: player.id || "",
      actor: player,
      aimWorld: aim.world,
      funnel,
      left: enabled && mouse.left,
      middle: enabled && mouse.middle,
      right: enabled && mouse.right,
      suckFactor: currentGadgetSuckFactor(),
      rangeFactor: currentGadgetRangeFactor(),
      blowFactor: currentGadgetBlowFactor(),
      toolId: equippedToolId,
      viscious: isVisciousVacuumEquipped(),
      bucketActive: enabled,
      bucketPadding: 0,
      landedBodyId: player.landed ? player.landed.bodyId : null,
      active: enabled && (mouse.left || mouse.middle || mouse.right)
    };
  }

  function isPartyGadgetActiveMode(mode) {
    return mode === "pull" || mode === "push" || mode === "hold";
  }

  function normalizePartyGadgetMode(mode) {
    if (mode !== "pull" && mode !== "push" && mode !== "hold" && mode !== "idle") {
      return "idle";
    }
    return mode;
  }

  function multiplayerEnergyCheckDt(dt) {
    return clamp(Number.isFinite(Number(dt)) ? finiteOr(dt, 1 / 60) : 1 / 60, 0.001, 0.05);
  }

  function multiplayerContinuousEnergyCost(rate, dt) {
    return Math.max(0, finiteOr(rate, 0)) * multiplayerEnergyCheckDt(dt);
  }

  function multiplayerContinuousEnergyActivationCost(rate, dt) {
    return Math.max(playerContinuousEnergyActivationCost, multiplayerContinuousEnergyCost(rate, dt));
  }

  function multiplayerToolModeEnergyCost(equippedTool, mode, dt) {
    if (!mode || mode === "idle") {
      return 0;
    }
    if (equippedTool === "spanner") {
      if (mode === "fire") {
        return multiplayerContinuousEnergyCost(spannerRepairEnergyDrain, dt);
      }
      if (mode === "dismantle") {
        return multiplayerContinuousEnergyCost(spannerDismantleEnergyDrain, dt);
      }
    }
    if (isSuctionTool(equippedTool) && isPartyGadgetActiveMode(mode)) {
      return multiplayerContinuousEnergyActivationCost(suctionEnergyDrain, dt);
    }
    if ((equippedTool === familiarNetToolId || equippedTool === personalTetherToolId) && (mode === "fire" || mode === "release")) {
      return 0;
    }
    if (mode === "fire") {
      if (isEmpTool(equippedTool)) {
        return empPulseEnergyCost;
      }
      if (isPistonPunchTool(equippedTool)) {
        return pistonPunchEnergyCost;
      }
      const weapon = weaponByToolId(equippedTool);
      return weapon ? Math.max(0, finiteOr(weapon.energyCost, playerWeaponDefaults.energyCost)) : Infinity;
    }
    return Infinity;
  }

  function actorCanAffordMultiplayerToolMode(actor, equippedTool, mode, dt) {
    if (Math.max(
      finiteOr(actor && actor.toolDisabledTimer, 0),
      finiteOr(actor && actor.statusEffects && actor.statusEffects.disabled, 0)
    ) > 0) {
      return false;
    }
    const cost = multiplayerToolModeEnergyCost(equippedTool, mode, dt);
    if (actor === player && playerContinuousEnergyLocked && isSuctionTool(equippedTool) && isPartyGadgetActiveMode(mode)) {
      return false;
    }
    return finiteOr(actor && actor.energy, 0) >= cost;
  }

  function multiplayerLocalToolModeForInput(dt) {
    if (areToolsDisabled()) {
      if (equippedToolId === familiarNetToolId) {
        multiplayer.v2.familiarNetFireHeld = mouse.left;
        multiplayer.v2.familiarNetReleaseHeld = mouse.right;
      }
      return "idle";
    }
    if (equippedToolId !== familiarNetToolId) {
      multiplayer.v2.familiarNetFireHeld = mouse.left;
      multiplayer.v2.familiarNetReleaseHeld = mouse.right;
    }
    if (isWeaponTool(equippedToolId)) {
      return mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt) ? "fire" : "idle";
    }
    if (isEmpTool(equippedToolId)) {
      return mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt) ? "fire" : "idle";
    }
    if (isPistonPunchTool(equippedToolId)) {
      return mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt) ? "fire" : "idle";
    }
    if (equippedToolId === familiarNetToolId) {
      const firePressed = mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt);
      const releasePressed = mouse.right && actorCanAffordMultiplayerToolMode(player, equippedToolId, "release", dt);
      const fireStarted = firePressed && !multiplayer.v2.familiarNetFireHeld;
      const releaseStarted = releasePressed && !multiplayer.v2.familiarNetReleaseHeld;
      multiplayer.v2.familiarNetFireHeld = mouse.left;
      multiplayer.v2.familiarNetReleaseHeld = mouse.right;
      if (fireStarted) {
        return "fire";
      }
      if (releaseStarted) {
        return "release";
      }
      return "idle";
    }
    if (equippedToolId === personalTetherToolId) {
      if (mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt)) {
        return "fire";
      }
      if (mouse.right && actorCanAffordMultiplayerToolMode(player, equippedToolId, "release", dt)) {
        return "release";
      }
      return "idle";
    }
    if (equippedToolId === "spanner") {
      if (mouse.left && actorCanAffordMultiplayerToolMode(player, equippedToolId, "fire", dt)) {
        return "fire";
      }
      if (mouse.right && actorCanAffordMultiplayerToolMode(player, equippedToolId, "dismantle", dt)) {
        return "dismantle";
      }
      return "idle";
    }
    if (!isSuctionEquipped() || !actorCanAffordMultiplayerToolMode(player, equippedToolId, "pull", dt)) {
      if (isSuctionEquipped() && isGadgetButtonPressed()) {
        playerContinuousEnergyLocked = true;
      }
      return "idle";
    }
    return mouse.middle ? "hold" : mouse.left ? "pull" : mouse.right ? "push" : "idle";
  }

  function canSendMultiplayerBoostInput(dt) {
    if (!isJetpackBoostPressed()) {
      return false;
    }
    if (playerContinuousEnergyLocked || player.energy < multiplayerContinuousEnergyActivationCost(jetpackBoostEnergyDrain, dt)) {
      playerContinuousEnergyLocked = true;
      return false;
    }
    return true;
  }

  function actorFromPartyPlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }
    return {
      id: typeof snapshot.id === "string" ? snapshot.id : player.id,
      name: typeof snapshot.name === "string" ? snapshot.name : player.name,
      x: finiteOr(snapshot.x, player.x),
      y: finiteOr(snapshot.y, player.y),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, player.radius),
      energy: finiteOr(snapshot.energy, player.energy),
      maxEnergy: finiteOr(snapshot.maxEnergy, player.maxEnergy),
      statusEffects: normalizeRemotePlayerStatusEffects(snapshot.statusEffects, snapshot.toolDisabledTimer),
      toolDisabledTimer: normalizeRemotePlayerStatusEffects(snapshot.statusEffects, snapshot.toolDisabledTimer).disabled,
      equippedTool: typeof snapshot.equippedTool === "string" ? snapshot.equippedTool : equippedToolId,
      toolMode: normalizePartyGadgetMode(snapshot.toolMode),
      landed: normalizeLandingSnapshot(snapshot.landed),
      aimAngle: finiteOr(snapshot.aimAngle, 0)
    };
  }

  function partyGadgetActorFromIntent(actor, gadget, receivedAt, options) {
    const source = actor ? {
      ...actor,
      landed: actor.landed ? { ...actor.landed } : null
    } : null;
    if (!source) {
      return null;
    }

    if (gadget && typeof gadget === "object") {
      source.x = finiteOr(gadget.x, source.x);
      source.y = finiteOr(gadget.y, source.y);
      source.vx = finiteOr(gadget.vx, source.vx);
      source.vy = finiteOr(gadget.vy, source.vy);
    }

    const now = performance.now();
    const lead = clamp(
      (now - finiteOr(receivedAt, now)) / 1000 + finiteOr(options && options.lead, 0),
      0,
      finiteOr(options && options.maxLead, 0)
    );

    source.x += finiteOr(source.vx, 0) * lead;
    source.y += finiteOr(source.vy, 0) * lead;
    return source;
  }

  function partyGadgetStateFromActor(actor, gadget, receivedAt, options) {
    if (!actor || !isSuctionTool(actor.equippedTool)) {
      return null;
    }

    const intent = gadget && typeof gadget === "object" ? gadget : null;
    const mode = normalizePartyGadgetMode(intent && intent.mode ? intent.mode : actor.toolMode);
    const active = isPartyGadgetActiveMode(mode) &&
      actorCanAffordMultiplayerToolMode(actor, actor.equippedTool || defaultToolId, mode, options && options.dt) &&
      (!intent || intent.active !== false);
    const aimAngle = finiteOr(intent && intent.aimAngle, actor.aimAngle);
    const aimWorld = normalize(Math.cos(aimAngle), Math.sin(aimAngle));
    const gadgetActor = partyGadgetActorFromIntent(actor, intent, receivedAt, {
      lead: options && Number.isFinite(Number(options.lead)) ? options.lead : 0,
      maxLead: options && Number.isFinite(Number(options.maxLead)) ? options.maxLead : 0
    });
    return {
      playerId: actor.id || "",
      seq: Math.max(0, Math.floor(finiteOr(intent && intent.seq, 0))),
      sentAt: finiteOr(intent && intent.sentAt, 0),
      receivedAt: finiteOr(receivedAt, performance.now()),
      actor: gadgetActor,
      aimWorld,
      funnel: actorFunnel(gadgetActor, aimWorld),
      left: active && mode === "pull",
      middle: active && mode === "hold",
      right: active && mode === "push",
      suckFactor: finiteOr(options && options.suckFactor, 1),
      rangeFactor: finiteOr(options && options.rangeFactor, finiteOr(options && options.suckFactor, 1)),
      blowFactor: finiteOr(options && options.blowFactor, 1),
      toolId: actor.equippedTool || defaultToolId,
      viscious: actor.equippedTool === visciousVacuumToolId,
      bucketActive: true,
      bucketPadding: finiteOr(options && options.bucketPadding, 0),
      landedBodyId: actor.landed ? actor.landed.bodyId : null,
      mode,
      active
    };
  }

  function localPartyGadgetState(playerSnapshot) {
    return partyGadgetStateFromActor(actorFromPartyPlayerSnapshot(playerSnapshot), null, performance.now(), {
      suckFactor: currentGadgetSuckFactor(),
      rangeFactor: currentGadgetRangeFactor(),
      blowFactor: currentGadgetBlowFactor(),
      bucketPadding: 0,
      lead: 0,
      maxLead: 0
    });
  }

  function partyGadgetBucketContact(state, target, extraPadding) {
    if (!state || !state.actor || !target) {
      return false;
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const normal = { x: -aimWorld.y, y: aimWorld.x };
    const relX = target.x - actor.x;
    const relY = target.y - actor.y;
    const localX = relX * aimWorld.x + relY * aimWorld.y;
    const localY = relX * normal.x + relY * normal.y;
    const requestedBucketPadding = Math.max(0, finiteOr(state.bucketPadding, 0)) + Math.max(0, finiteOr(extraPadding, 0));
    const bucketPadding = requestedBucketPadding > 0
      ? clamp(target.radius * 0.35, 5, requestedBucketPadding)
      : 0;
    const radius = target.radius + bucketPadding;
    const wallRadius = radius + funnelShape.wallThickness;
    const backX = funnelShape.backX;
    const backHalf = funnelShape.backHalf;
    const rimX = funnelShape.rimX;
    const rimHalf = funnelShape.rimHalf;

    if (distanceToSegment(localX, localY, backX, -backHalf, rimX, -rimHalf) < wallRadius) {
      return true;
    }
    if (distanceToSegment(localX, localY, backX, backHalf, rimX, rimHalf) < wallRadius) {
      return true;
    }
    if (distanceToSegment(localX, localY, backX, -backHalf, backX, backHalf) < wallRadius) {
      return true;
    }
    if (
      localX < backX + radius &&
      localX > backX - radius * 1.35 &&
      Math.abs(localY) < backHalf + radius * 0.8
    ) {
      return true;
    }

    const cupHalf = funnelHalfAt(localX);
    return (
      localX > backX - radius * 0.35 &&
      localX < rimX + radius * 0.55 &&
      Math.abs(localY) < cupHalf + radius * 0.25
    );
  }

  function gadgetRangeFactorForState(state) {
    return Math.max(0.1, finiteOr(state && state.rangeFactor, finiteOr(state && state.suckFactor, 1)));
  }

  function gadgetForceReachForState(state) {
    return gadgetForceReach * gadgetRangeFactorForState(state);
  }

  function gadgetPushReachForState(state) {
    return gadgetPushReach * Math.max(0.1, finiteOr(state && state.blowFactor, 1));
  }

  function gadgetHoldBalanceFactor(suckFactor, blowFactor) {
    const suction = Math.max(0.1, finiteOr(suckFactor, 1));
    const propulsion = Math.max(0.1, finiteOr(blowFactor, 1));
    return clamp(1 + 1.25 * (propulsion - suction) / Math.max(suction, propulsion), 0.3, 1.7);
  }

  function gadgetHoldFarReach(rangeFactor) {
    const nearReach = funnelShape.rimX + 5;
    return nearReach + 2 * (gadgetHoldReach - nearReach) * Math.max(1, finiteOr(rangeFactor, 1));
  }

  function gadgetHoldReachFromFactors(holdFactor, rangeFactor) {
    const nearReach = funnelShape.rimX + 5;
    return nearReach + (gadgetHoldFarReach(rangeFactor) - nearReach) * 0.5 * Math.max(0.1, finiteOr(holdFactor, 1));
  }

  function gadgetHoldReachForState(state) {
    const suction = Math.max(0.1, finiteOr(state && state.suckFactor, 1));
    const propulsion = Math.max(0.1, finiteOr(state && state.blowFactor, 1));
    return gadgetHoldReachFromFactors(gadgetHoldBalanceFactor(suction, propulsion), Math.max(suction, propulsion));
  }

  function partyGadgetMiddleGatherRange(forward, side, targetRadius, padding, state) {
    const radius = Math.max(0, finiteOr(targetRadius, 0));
    const extra = Math.max(0, finiteOr(padding, 0));
    const holdReach = gadgetHoldReachForState(state);
    return (
      forward > funnelShape.backX - 130 - extra * 0.25 &&
      forward < holdReach + radius + 90 + extra &&
      side < 188 + radius + extra * 0.45
    );
  }

  function partyGadgetParticleProbe(state, target, options) {
    if (!state || !state.actor || !target) {
      return { force: false, bucket: false, score: Infinity };
    }

    const actor = state.actor;
    const aimWorld = state.aimWorld || { x: 1, y: 0 };
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aimWorld.x + toTargetY * aimWorld.y;
    const sideX = toTargetX - aimWorld.x * forward;
    const sideY = toTargetY - aimWorld.y * forward;
    const side = length(sideX, sideY);
    const padding = Math.max(0, finiteOr(options && options.padding, 0));
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const forceReach = gadgetForceReachForState(state);
    const holdReach = gadgetHoldReachForState(state);
    const pullHoldRange = (state.left || state.middle) &&
      forward > -80 - padding * 0.25 &&
      forward < forceReach + target.radius + padding &&
      side < coneWidth + target.radius + padding * 0.35;
    const middleGatherRange = state.middle &&
      partyGadgetMiddleGatherRange(forward, side, target.radius, padding, state);
    const pushRange = state.right &&
      forward > -28 - padding * 0.2 &&
      forward < gadgetPushReachForState(state) + target.radius + padding &&
      side < coneWidth * 0.9 + target.radius + padding * 0.35;
    const bucket = partyGadgetBucketContact(state, target, padding);
    const funnel = state.funnel || actorFunnel(actor, aimWorld);
    const mouthDistance = Math.hypot(funnel.x - target.x, funnel.y - target.y);

    return {
      force: Boolean(pullHoldRange || middleGatherRange || pushRange),
      bucket,
      score: Math.min(
        Math.abs(forward - funnelShape.captureX) + side * 1.4,
        middleGatherRange ? Math.abs(forward - holdReach) + side * 0.65 : mouthDistance
      )
    };
  }
