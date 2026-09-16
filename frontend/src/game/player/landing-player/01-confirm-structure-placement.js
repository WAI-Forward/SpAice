  function confirmStructurePlacement() {
    const recipe = recipeById(activePlacementRecipeId);
    if (!isStructureRecipe(recipe)) {
      cancelStructurePlacement();
      return false;
    }

    if (!canAffordRecipe(recipe)) {
      maybeNotifyText("Not enough tech for " + recipe.name + ".");
      cancelStructurePlacement();
      updateTechUi();
      return false;
    }

    const placement = currentStructurePlacement();
    if (!placement.valid) {
      maybeNotifyText(recipe.structureType === "tether"
        ? "Tethers can anchor to non-star boulders, asteroids, or larger bodies."
        : isLinkedStructureType(recipe.structureType)
          ? recipe.name + "s need non-star boulder-sized or larger bodies."
          : "Structures need a moon, planet, or plate surface.");
      return false;
    }

    if (isLinkedStructureType(recipe.structureType)) {
      if (!pendingTetherAnchor) {
        pendingTetherAnchor = placement;
        maybeNotifyText("Choose another body for the other end of the " + recipe.name.toLowerCase() + ".");
        playSound("select");
        return true;
      }

      const firstPlacement = refreshPlacementAnchor(pendingTetherAnchor);
      if (!firstPlacement || !firstPlacement.valid) {
        pendingTetherAnchor = null;
        maybeNotifyText("The first " + recipe.name.toLowerCase() + " anchor is no longer available.");
        return false;
      }

      if (placement.bodyId === firstPlacement.bodyId) {
        maybeNotifyText("The " + recipe.name.toLowerCase() + " needs two different bodies.");
        return false;
      }

      if (recipe.structureType === "tether" && !isTetherPlacementLengthValid(firstPlacement, placement)) {
        maybeNotifyText("Tether anchors are too far apart.");
        return false;
      }

      if (isMultiplayerV2Active()) {
        if (!sendMultiplayerV2BuildAction({
          action: "placeStructure",
          recipeId: recipe.id,
          placement: {
            bodyId: firstPlacement.bodyId,
            angle: firstPlacement.angle
          },
          linkedPlacement: {
            bodyId: placement.bodyId,
            angle: placement.angle
          }
        })) {
          maybeNotifyText("Reconnect before placing " + recipe.name.toLowerCase() + ".");
          return false;
        }
        pendingTetherAnchor = null;
        activePlacementRecipeId = null;
        playSound("place");
        maybeNotifyText(recipe.name + " placed.");
        return true;
      }

      spendRecipeCost(recipe);
      structures.push(createStructure(recipe, firstPlacement, placement));
      pendingTetherAnchor = null;
    } else {
      if (isMultiplayerV2Active()) {
        if (!sendMultiplayerV2BuildAction({
          action: "placeStructure",
          recipeId: recipe.id,
          placement: {
            bodyId: placement.bodyId,
            angle: placement.angle
          }
        })) {
          maybeNotifyText("Reconnect before placing " + recipe.name.toLowerCase() + ".");
          return false;
        }
        activePlacementRecipeId = null;
        playSound("place");
        maybeNotifyText(recipe.name + " placed.");
        return true;
      }

      spendRecipeCost(recipe);
      structures.push(createStructure(recipe, placement));
    }
    activePlacementRecipeId = null;
    updateTechUi();
    playSound("place");
    maybeNotifyText(recipe.name + " placed.");
    return true;
  }

  function communicationRelayAtCursor() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestDistance = Infinity;

    for (const structure of structures) {
      if (structure.type !== "communication-relay" || structure.health <= 0) {
        continue;
      }

      const distance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      if (distance > structureHitRadius(structure) + 18 || distance >= bestDistance) {
        continue;
      }

      best = structure;
      bestDistance = distance;
    }

    return best;
  }

  function handleCommunicationRelayClick() {
    const relay = communicationRelayAtCursor();
    if (!relay) {
      return false;
    }

    openRelayContacts();
    playSound("select");
    return true;
  }

  function findResidentBodyForTier(tierName) {
    let best = null;
    let bestDistance = Infinity;

    for (const particle of particles) {
      if (!isLandableBody(particle) || particle.tier.name !== tierName) {
        continue;
      }

      const distance = Math.hypot(player.x - particle.x, player.y - particle.y);
      if (distance < bestDistance) {
        best = particle;
        bestDistance = distance;
      }
    }

    return best;
  }

  function hasResidentRivalForTier(tierName) {
    for (const rival of rivals) {
      if (rival.health <= 0 || !rival.landed || rival.residentTier !== tierName) {
        continue;
      }

      const body = bodyById(rival.landed.bodyId);
      if (body && isLandableBody(body) && body.tier.name === tierName) {
        return true;
      }
    }

    return false;
  }

  function findAvailableRivalForLanding() {
    for (const rival of rivals) {
      if (rival.health > 0 && !rival.landed) {
        return rival;
      }
    }

    const spawn = randomOffscreenPoint(140, 440);
    const rival = createRival(spawn.x, spawn.y);
    rivals.push(rival);
    return rival;
  }

  function ensureResidentRivals() {
    for (const tier of bodyTiers) {
      if (tier.threshold < thresholdForTierName("asteroid")) {
        continue;
      }

      if (hasResidentRivalForTier(tier.name)) {
        continue;
      }

      const body = findResidentBodyForTier(tier.name);
      if (!body) {
        continue;
      }

      attachRivalToBody(findAvailableRivalForLanding(), body, tier.name);
    }
  }

  function applyRivalSurfaceConstraint(rival) {
    if (!rival.landed && gameSettings.hudEnabled !== false) {
      return false;
    }

    const body = bodyById(rival.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      rival.landed = null;
      rival.residentTier = null;
      rival.rotation = 0;
      return false;
    }

    const normal = {
      x: Math.cos(rival.landed.angle),
      y: Math.sin(rival.landed.angle)
    };
    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const walkSpeed = rival.landed.walkSpeed || 0;
    const surfaceOffset = surfaceExtensionAtAngle(body, rival.landed.angle);
    const distanceFromCenter = body.radius + surfaceOffset + rivalFootOffset;
    const surfaceVelocity = bodySurfaceVelocityAtAngle(body, rival.landed.angle, surfaceOffset);

    rival.x = body.x + normal.x * distanceFromCenter;
    rival.y = body.y + normal.y * distanceFromCenter;
    rival.vx = surfaceVelocity.x + tangent.x * walkSpeed;
    rival.vy = surfaceVelocity.y + tangent.y * walkSpeed;
    rival.rotation = rival.landed.angle + Math.PI / 2;
    return true;
  }

  function updateLandedRival(rival, dt) {
    const body = bodyById(rival.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      rival.landed = null;
      rival.residentTier = null;
      rival.rotation = 0;
      return;
    }

    const surfaceRadius = Math.max(24, body.radius + surfaceExtensionAtAngle(body, rival.landed.angle));
    const driftSpeed = Math.sin(performance.now() * 0.00055 + rival.wobble) * 20;
    rival.landed.walkSpeed = rival.landed.walkSpeed * Math.pow(0.86, dt) + driftSpeed * (1 - Math.pow(0.04, dt));
    rival.landed.angle += (rival.landed.walkSpeed / surfaceRadius) * dt;
    applyRivalSurfaceConstraint(rival);
  }

  function findBridgeTransferFromBody(bodyId, angle, walkDirection) {
    if (!bodyId || !walkDirection) {
      return null;
    }

    let best = null;
    let bestDelta = Infinity;
    for (const structure of structures) {
      for (const side of [-1, 1]) {
        const endpoint = bridgeEndpointJoin(structure, bodyId, side);
        if (!endpoint || endpoint.entryWalkDirection !== Math.sign(walkDirection)) {
          continue;
        }

        const delta = Math.abs(shortestAngleDelta(angle, endpoint.angle));
        if (delta > bridgeWalkTransferAngle || delta >= bestDelta) {
          continue;
        }

        best = { structure, endpoint, inputSign: endpoint.inputSign };
        bestDelta = delta;
      }
    }

    return best;
  }

  function transferPlayerToBridge(transfer, walkDirection, walkSpeed) {
    if (!transfer || !transfer.structure || !transfer.endpoint) {
      return false;
    }

    player.landed = {
      bodyId: transfer.endpoint.bodyId,
      bridgeId: transfer.structure.id,
      bridgeT: transfer.endpoint.t,
      bridgeSide: transfer.endpoint.side,
      bridgeInputSign: transfer.inputSign,
      angle: transfer.endpoint.angle,
      walkSpeed: finiteOr(walkSpeed, 0) * Math.sign(walkDirection || 1),
      walkCycle: player.walkCycle || 0
    };
    applyLandedSurfaceConstraint();
    return true;
  }

  function transferPlayerFromBridgeToBody(structure, bodyId, side, pathSpeed) {
    const join = bridgeEndpointJoin(structure, bodyId, side);
    const body = bodyById(bodyId);
    if (!join || !body || !isLandableBody(body)) {
      return false;
    }

    const bridgeMotionSign = Math.sign(finiteOr(pathSpeed, 0) || (join.atStart ? -1 : 1));
    const incomingDirX = join.geometry.ux * bridgeMotionSign;
    const incomingDirY = join.geometry.uy * bridgeMotionSign;
    const tangentX = -Math.sin(join.angle);
    const tangentY = Math.cos(join.angle);
    const bodyWalkDirection = tangentX * incomingDirX + tangentY * incomingDirY >= 0 ? 1 : -1;
    const continuationAngle = join.angle + bodyWalkDirection * (bridgeWalkTransferAngle + bridgeWalkExitAnglePadding);
    player.landed = {
      bodyId: body.id,
      angle: continuationAngle,
      walkSpeed: Math.abs(finiteOr(pathSpeed, 0)) * bodyWalkDirection,
      walkCycle: player.walkCycle || 0
    };
    applyLandedSurfaceConstraint();
    return true;
  }

  function detachFromBody(jumpStrength) {
    if (!player.landed) {
      return;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const bridge = player.landed.bridgeId ? activeBridgeById(player.landed.bridgeId) : null;
    const pose = bridge ? bridgeSurfacePose(bridge, player.landed.bridgeT, player.landed.bridgeSide) : null;
    const body = bodyById(player.landed.bodyId);
    const baseVx = pose ? pose.vx : (body ? body.vx : player.vx);
    const baseVy = pose ? pose.vy : (body ? body.vy : player.vy);
    player.vx = baseVx + normal.x * jumpStrength;
    player.vy = baseVy + normal.y * jumpStrength;

    player.landed = null;
    jumpQueued = false;
    playSound("detach");
  }

  function applyLandedSurfaceConstraint() {
    if (!player.landed) {
      return false;
    }

    if (player.landed.bridgeId) {
      const bridge = activeBridgeById(player.landed.bridgeId);
      const pose = bridge ? bridgeSurfacePose(bridge, player.landed.bridgeT, player.landed.bridgeSide) : null;
      if (!pose) {
        detachFromBody(130);
        return false;
      }

      player.landed.bridgeT = pose.t;
      player.landed.bridgeSide = pose.side;
      player.landed.angle = pose.angle;
      player.x = pose.x;
      player.y = pose.y;
      player.vx = pose.vx;
      player.vy = pose.vy;
      return true;
    }

    const body = bodyById(player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      detachFromBody(130);
      return false;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const surfaceOffset = surfaceExtensionAtAngle(body, player.landed.angle);
    const distanceFromCenter = body.radius + surfaceOffset + playerFootOffset;
    const walkSpeed = player.landed.walkSpeed || 0;
    const surfaceVelocity = bodySurfaceVelocityAtAngle(body, player.landed.angle, surfaceOffset);

    player.x = body.x + normal.x * distanceFromCenter;
    player.y = body.y + normal.y * distanceFromCenter;
    player.vx = surfaceVelocity.x + tangent.x * walkSpeed;
    player.vy = surfaceVelocity.y + tangent.y * walkSpeed;
    return true;
  }

  function updateBridgeLandedPlayer(dt) {
    const bridge = activeBridgeById(player.landed.bridgeId);
    const geometry = bridge ? bridgeGeometry(bridge) : null;
    if (!bridge || !geometry) {
      detachFromBody(120);
      return;
    }

    if (jumpQueued) {
      jumpQueued = false;
      detachFromBody(380);
      return;
    }

    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.62;
    const walkSpeed = (isMovementKeyPressed("down") ? 68 : 128) * weaponSlowFactor;
    const vacuumHoldActive = isVacuumHoldActive();
    let walkDirection = 0;

    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("left")) {
      walkDirection -= 1;
    }
    if (!vacuumHoldActive && isKeyboardMovementKeyPressed("right")) {
      walkDirection += 1;
    }
    if (gameSettings.touchScreen && touchJoystickState.active) {
      const world = cameraLocalToWorld(touchJoystickState.moveX, touchJoystickState.moveY);
      const projected = (world.x * geometry.ux + world.y * geometry.uy) * finiteOr(player.landed.bridgeInputSign, 1);
      if (Math.abs(projected) > touchMoveAxisThreshold) {
        walkDirection += Math.sign(projected);
      }
    }
    walkDirection = clamp(walkDirection, -1, 1);

    const inputSign = finiteOr(player.landed.bridgeInputSign, 1) < 0 ? -1 : 1;
    const pathSpeed = walkDirection * inputSign * walkSpeed;
    player.landed.walkSpeed = pathSpeed;
    if (walkDirection) {
      player.walkCycle += (2.3 + Math.abs(pathSpeed) * 0.052) * dt;
    }
    player.landed.walkCycle = player.walkCycle;
    player.landed.bridgeT += pathSpeed * dt;

    const startJoin = bridgeEndpointJoin(bridge, bridge.bodyId, player.landed.bridgeSide);
    const endJoin = bridgeEndpointJoin(bridge, bridge.linkedBodyId, player.landed.bridgeSide);
    const startExitT = startJoin ? startJoin.t : 0;
    const endExitT = endJoin ? endJoin.t : geometry.length;

    if (pathSpeed < 0 && player.landed.bridgeT <= startExitT) {
      transferPlayerFromBridgeToBody(bridge, bridge.bodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    if (pathSpeed > 0 && player.landed.bridgeT >= endExitT) {
      transferPlayerFromBridgeToBody(bridge, bridge.linkedBodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    player.landed.bridgeT = clamp(player.landed.bridgeT, startExitT, endExitT);

    applyLandedSurfaceConstraint();
    cameraRoll = surfaceCameraRollForAngle(player.landed.angle);
  }

  function toggleLanding() {
    if (player.landed) {
      detachFromBody(190);
      return;
    }

    const body = findNearestLandableBody();
    if (!body) {
      return;
    }

    const angle = Math.atan2(player.y - body.y, player.x - body.x);
    player.landed = {
      bodyId: body.id,
      angle,
      walkSpeed: 0,
      walkCycle: player.walkCycle || 0
    };
    cameraRoll = surfaceCameraRollForAngle(angle);
    applyLandedSurfaceConstraint();
    playSound("landing");
  }
