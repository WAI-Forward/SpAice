  function updateLandedPlayer(dt) {
    if (player.landed.bridgeId) {
      updateBridgeLandedPlayer(dt);
      return;
    }

    const body = bodyById(player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      detachFromBody(120);
      return;
    }

    if (jumpQueued) {
      jumpQueued = false;
      detachFromBody(380);
      return;
    }

    const surfaceCircumferenceRadius = Math.max(24, body.radius + surfaceExtensionAtAngle(body, player.landed.angle));
    const asteroidWalkMultiplier = body.tier.name === "asteroid" ? 0.78 : 1;
    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const walkSpeed = (isMovementKeyPressed("down") ? 68 : 128) * asteroidWalkMultiplier * weaponSlowFactor;
    const vacuumHoldActive = isVacuumHoldActive();
    let walkDirection = touchLandedWalkDirection(body);

    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("left")) {
      walkDirection -= 1;
    }
    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("right")) {
      walkDirection += 1;
    }
    walkDirection = clamp(walkDirection, -1, 1);

    player.landed.walkSpeed = walkDirection * walkSpeed;
    if (walkDirection) {
      player.walkCycle += (2.3 + Math.abs(player.landed.walkSpeed) * 0.052) * dt;
      player.landed.walkCycle = player.walkCycle;
    } else {
      player.landed.walkCycle = player.walkCycle;
    }
    const previousAngle = player.landed.angle;
    player.landed.angle += (player.landed.walkSpeed / surfaceCircumferenceRadius) * dt;
    const bridgeTransfer = findBridgeTransferFromBody(body.id, player.landed.angle, walkDirection);
    if (bridgeTransfer && Math.abs(shortestAngleDelta(previousAngle, bridgeTransfer.endpoint.angle)) >= Math.abs(shortestAngleDelta(player.landed.angle, bridgeTransfer.endpoint.angle))) {
      if (transferPlayerToBridge(bridgeTransfer, walkDirection, walkSpeed)) {
        cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
        return;
      }
    }
    cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
    applyLandedSurfaceConstraint();
  }

  function updateLandedGadgetThrust(dt) {
    if (!canUseSuctionControls() || !player.landed || (!mouse.left && !mouse.right)) {
      return;
    }

    const body = bodyById(player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      return;
    }

    const direction = mouse.left ? 1 : -1;
    const strengthFactor = mouse.left ? currentGadgetSuckFactor() : currentGadgetBlowFactor();
    if (applyGadgetThrustToBody(body, getAim().world, direction, dt, strengthFactor, { x: player.x, y: player.y })) {
      markSurvivalCampBodyMovedByPlayer(body, player.id || "");
    }
  }

  function applyGadgetThrustToBody(body, aimWorld, direction, dt, strengthFactor = 1, forcePoint) {
    if (!body || !isLandableBody(body)) {
      return false;
    }

    const upgradeFactor = Math.max(0.1, finiteOr(strengthFactor, 1));
    const massDamping = clamp(1 / Math.pow(Math.max(1, body.mass / 100), 0.38), 0.18, 1);
    const thrust = 155 * massDamping * upgradeFactor;
    const speedFactor = clamp(Math.sqrt(upgradeFactor), 0.6, 1.75);
    const baseMaxSpeed = (220 * massDamping + 60) * speedFactor;
    const aim = aimWorld || { x: 1, y: 0 };
    const previousVx = finiteOr(body.vx, 0);
    const previousVy = finiteOr(body.vy, 0);
    const previousSpeed = Math.hypot(previousVx, previousVy);
    const accelerationX = aim.x * direction * thrust * dt;
    const accelerationY = aim.y * direction * thrust * dt;
    const progradeGain = previousSpeed > 0
      ? Math.max(0, (previousVx * accelerationX + previousVy * accelerationY) / previousSpeed)
      : 0;
    const maxSpeed = Math.max(baseMaxSpeed, previousSpeed + progradeGain);

    const point = forcePoint
      ? bodySurfacePointForForce(body, forcePoint.x, forcePoint.y)
      : bodySurfacePointForForce(body, body.x - aim.x, body.y - aim.y);
    applyBodyVelocityChangeAtPoint(body, accelerationX, accelerationY, point.x, point.y, 1);

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }
    return true;
  }

  function updatePartyLandedGadgetThrusts(dt) {
    for (const state of activePartyGadgetStates()) {
      if (!state.landedBodyId || (!state.left && !state.right)) {
        continue;
      }

      const body = bodyById(state.landedBodyId);
      const direction = state.left ? 1 : -1;
      const strengthFactor = state.left ? state.suckFactor : state.blowFactor;
      const forcePoint = state.actor ? { x: state.actor.x, y: state.actor.y } : null;
      if (applyGadgetThrustToBody(body, state.aimWorld, direction, dt, strengthFactor, forcePoint)) {
        markSurvivalCampBodyMovedByPlayer(body, state.playerId || state.actor && state.actor.id || "");
      }
    }
  }

  function updateEnergySystems(dt) {
    for (const body of particles) {
      normalizeBodyEnergy(body);
      if (body.maxEnergy > 0 && body.energy < body.maxEnergy) {
        body.energy = Math.min(body.maxEnergy, body.energy + energyRegenForBody(body) * dt);
      }
    }

    const targetMaxEnergy = targetPlayerMaxEnergy();
    player.maxEnergy = clamp(finiteOr(player.maxEnergy, playerBaseMaxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    if (player.maxEnergy < targetMaxEnergy) {
      const growthRate = 0.32 + Math.sqrt(Math.max(0, finiteOr(lifeStats.absorbedParticleMass, 0))) * 0.0025;
      player.maxEnergy = Math.min(targetMaxEnergy, player.maxEnergy + growthRate * dt);
    }
    player.energy = clamp(finiteOr(player.energy, player.maxEnergy), 0, player.maxEnergy);
    if (player.energy >= player.maxEnergy) {
      return;
    }

    let regen = playerBaseEnergyRegen;
    if (player.landed) {
      const landedBody = bodyById(player.landed.bodyId);
      if (landedBody) {
        regen += energyRegenForBody(landedBody) * landedEnergyRegenShare;
      }
    }

    player.energy = Math.min(player.maxEnergy, player.energy + regen * dt);
  }

  function updatePlayerEnergySystems(dt) {
    const targetMaxEnergy = targetPlayerMaxEnergy();
    player.maxEnergy = clamp(finiteOr(player.maxEnergy, playerBaseMaxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    if (player.maxEnergy < targetMaxEnergy) {
      const growthRate = 0.32 + Math.sqrt(Math.max(0, finiteOr(lifeStats.absorbedParticleMass, 0))) * 0.0025;
      player.maxEnergy = Math.min(targetMaxEnergy, player.maxEnergy + growthRate * dt);
    }
    player.energy = clamp(finiteOr(player.energy, player.maxEnergy), 0, player.maxEnergy);
    if (player.energy >= player.maxEnergy) {
      return;
    }

    let regen = playerBaseEnergyRegen;
    if (player.landed) {
      const landedBody = bodyById(player.landed.bodyId);
      if (landedBody) {
        regen += energyRegenForBody(landedBody) * landedEnergyRegenShare;
      }
    }

    player.energy = Math.min(player.maxEnergy, player.energy + regen * dt);
  }

  function updateToolEnergyUsage(dt) {
    if (!isContinuousPlayerEnergyInputPressed()) {
      playerContinuousEnergyLocked = false;
    }

    if (areToolsDisabled() || buildMenuOpen) {
      return;
    }

    if (touchControlState.active) {
      if (touchControlState.toolsSuppressed && canUseContinuousPlayerEnergy(suctionEnergyDrain, dt)) {
        touchControlState.toolsSuppressed = false;
      }
      refreshTouchFireButtons();
    }

    if (isSuctionEquipped() && isGadgetButtonPressed()) {
      if (!drainContinuousPlayerEnergy(suctionEnergyDrain, dt)) {
        suppressTouchToolsUntilEnergyReturns();
        notifyEnergyDepleted();
      }
    }
  }

  function updatePlayer(dt) {
    player.weaponSlow = Math.max(0, finiteOr(player.weaponSlow, 0) - weaponSlowDecay * dt);
    const vacuumHoldActive = isVacuumHoldActive();

    if (player.landed) {
      updateLandedPlayer(dt);
      return;
    }

    if (player.spacecraftInterior) {
      updateSpacecraftInteriorPlayer(dt);
      return;
    }

    let localX = 0;
    let localY = 0;

    if (isMovementKeyPressed("left")) {
      localX -= 1;
    }
    if (isMovementKeyPressed("right")) {
      localX += 1;
    }
    if (isMovementKeyPressed("up")) {
      localY -= 1;
    }
    if (isMovementKeyPressed("down")) {
      localY += 1;
    }

    if (isControlPressed("rollLeft")) {
      cameraRoll -= 1.9 * dt;
    }
    if (isControlPressed("rollRight")) {
      cameraRoll += 1.9 * dt;
    }

    if (!vacuumHoldActive && (localX || localY)) {
      const local = normalize(localX, localY);
      const world = cameraLocalToWorld(local.x, local.y);
      const suctionActive = canUseSuctionControls() && isGadgetButtonPressed();
      let boosting = false;
      if (!suctionActive && isJetpackBoostPressed()) {
        boosting = drainContinuousPlayerEnergy(jetpackBoostEnergyDrain, dt);
        if (!boosting) {
          notifyEnergyDepleted();
        }
      }
      const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
      const thrust = 640 * (suctionActive ? 0.56 : 1) * (boosting ? jetpackBoostThrustMultiplier : 1) * weaponSlowFactor;
      player.vx += world.x * thrust * dt;
      player.vy += world.y * thrust * dt;
    }

    const speed = length(player.vx, player.vy);
    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const boostSpeed = canUseJetpackBoost(dt) ? jetpackBoostSpeedMultiplier : 1;
    const rocketSuitActive = isRocketSuitEquipped() && mouse.left && !buildMenuOpen;
    const rocketSuitMaxSpeed = rocketSuitBaseMaxSpeed + clamp(finiteOr(player.rocketSuitCharge, 0), 0, 1) * rocketSuitChargeMaxSpeed;
    const maxSpeed = vacuumHoldActive
      ? 0
      : rocketSuitActive
        ? rocketSuitMaxSpeed
        : ((canUseSuctionControls() && isGadgetButtonPressed()) ? 275 : 430 * boostSpeed) * weaponSlowFactor;
    if (speed > maxSpeed) {
      player.vx = (player.vx / speed) * maxSpeed;
      player.vy = (player.vy / speed) * maxSpeed;
    }

    const drag = Math.pow(0.18, dt);
    player.vx *= drag;
    player.vy *= drag;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    updatePlayerSpacecraftEntry();
  }
