  function worldToScreen(x, y) {
    const local = rotatePoint(x - player.x, y - player.y, cameraRoll);
    return {
      x: width / 2 + local.x * cameraZoom,
      y: height / 2 + local.y * cameraZoom
    };
  }

  function worldViewRadius(padding) {
    const zoom = Math.max(0.001, finiteOr(cameraZoom, 1));
    return Math.hypot(width, height) / (2 * zoom) + Math.max(0, finiteOr(padding, 0));
  }

  function isWorldCircleNearView(x, y, radius, padding) {
    const reach = worldViewRadius(Math.max(0, finiteOr(radius, 0)) + Math.max(0, finiteOr(padding, 0)));
    const dx = finiteOr(x, player.x) - player.x;
    const dy = finiteOr(y, player.y) - player.y;
    return dx * dx + dy * dy <= reach * reach;
  }

  function screenToWorld(x, y) {
    const local = cameraLocalToWorld((x - width / 2) / cameraZoom, (y - height / 2) / cameraZoom);
    return {
      x: player.x + local.x,
      y: player.y + local.y
    };
  }

  function randomOffscreenPoint(margin, spread, anchor, zoomOverride) {
    const source = anchor || player;
    const side = Math.floor(Math.random() * 4);
    const offscreenZoom = Math.max(0.001, finiteOr(zoomOverride, cameraZoom));
    const halfW = width / (2 * offscreenZoom);
    const halfH = height / (2 * offscreenZoom);
    let localX = randomRange(-halfW - spread, halfW + spread);
    let localY = randomRange(-halfH - spread, halfH + spread);

    if (side === 0) {
      localY = -halfH - margin - randomRange(0, spread);
    } else if (side === 1) {
      localX = halfW + margin + randomRange(0, spread);
    } else if (side === 2) {
      localY = halfH + margin + randomRange(0, spread);
    } else {
      localX = -halfW - margin - randomRange(0, spread);
    }

    const world = cameraLocalToWorld(localX, localY);
    return {
      x: finiteOr(source.x, player.x) + world.x,
      y: finiteOr(source.y, player.y) + world.y
    };
  }

  function relocatedMobOffscreenPoint(margin, spread, anchor) {
    return randomOffscreenPoint(
      Math.max(0, finiteOr(margin, 0)) + mobRelocationEdgePaddingBonus,
      Math.max(0, finiteOr(spread, 0)) * mobRelocationSpreadMultiplier,
      anchor
    );
  }

  function getCursorAimAngle() {
    const fromCenterX = mouse.x - width / 2;
    const fromCenterY = mouse.y - height / 2;
    return Math.atan2(fromCenterY || -0.35, fromCenterX || 1);
  }

  function updateGadgetAim(dt) {
    const targetAngle = getCursorAimAngle();
    const delta = shortestAngleDelta(gadgetAngle, targetAngle);
    const maxTurn = 4.4 * dt;
    gadgetAngle += clamp(delta, -maxTurn, maxTurn);
  }

  function getAim() {
    const local = {
      x: Math.cos(gadgetAngle),
      y: Math.sin(gadgetAngle)
    };
    const world = cameraLocalToWorld(local.x, local.y);
    return {
      local,
      world,
      angle: gadgetAngle
    };
  }

  function getFunnel(aim) {
    return actorFunnel(player, aim.world);
  }

  function actorFunnel(actor, aimWorld) {
    const source = actor || player;
    const aim = aimWorld || { x: 1, y: 0 };
    const reach = funnelShape.captureX;
    return {
      x: source.x + aim.x * reach,
      y: source.y + aim.y * reach,
      mouthX: source.x + aim.x * funnelShape.rimX,
      mouthY: source.y + aim.y * funnelShape.rimX,
      radius: funnelShape.rimHalf,
      reach,
      mouthReach: funnelShape.rimX
    };
  }

  function funnelHalfAt(localX) {
    const t = clamp((localX - funnelShape.backX) / (funnelShape.rimX - funnelShape.backX), 0, 1);
    return funnelShape.backHalf + (funnelShape.rimHalf - funnelShape.backHalf) * t;
  }

  function bodyById(id) {
    for (const particle of particles) {
      if (particle.id === id) {
        return particle;
      }
    }
    return null;
  }

  function isLandableBody(particle) {
    return isAsteroidOrLarger(particle) && !isStarBody(particle);
  }

  function bodyPushResponse(target) {
    if (isStarBody(target)) {
      return 0.22;
    }

    const mass = Math.max(1, finiteOr(target && target.mass, 1));
    const asteroidThreshold = thresholdForTierName("asteroid");
    if (mass < asteroidThreshold) {
      return 1;
    }

    return clamp(0.34 / Math.pow(mass / asteroidThreshold, 0.72), 0.025, 1);
  }

  function decayGadgetPullContactIntent(target, dt) {
    if (!target) {
      return;
    }
    if (target.gadgetPullContactTimer !== undefined) {
      target.gadgetPullContactTimer = Math.max(0, finiteOr(target.gadgetPullContactTimer, 0) - dt);
    }
    if (target.directGadgetForceTimer !== undefined) {
      target.directGadgetForceTimer = Math.max(0, finiteOr(target.directGadgetForceTimer, 0) - dt);
    }
  }

  function markGadgetPullContactIntent(target, actor, aimWorld, pullTowardActor) {
    if (!target || !target.tier || !target.tier.solid || !actor || !aimWorld) {
      return;
    }
    target.gadgetPullContactTimer = 0.09;
    target.gadgetPullActorId = actor.id || "";
    target.gadgetPullAimX = finiteOr(aimWorld.x, 1);
    target.gadgetPullAimY = finiteOr(aimWorld.y, 0);
    target.gadgetPullTowardActor = pullTowardActor === true;
  }

  function markDirectGadgetBodyForceIntent(target, actor) {
    if (!target || !target.tier || !target.tier.solid || !actor || !actor.landed || actor.landed.bridgeId) {
      return;
    }
    const landedBodyId = Math.max(0, Math.floor(finiteOr(actor.landed.bodyId, 0)));
    if (!landedBodyId || landedBodyId === target.id) {
      return;
    }
    target.directGadgetForceTimer = 0.12;
    target.directGadgetForceActorId = actor.id || "";
    target.directGadgetForceLandedBodyId = landedBodyId;
  }

  function isDirectGadgetForcedFromLandedBody(target, landedBody) {
    return Boolean(
      target &&
      landedBody &&
      target.tier &&
      target.tier.solid &&
      finiteOr(target.directGadgetForceTimer, 0) > 0 &&
      Math.max(0, Math.floor(finiteOr(target.directGadgetForceLandedBodyId, 0))) === landedBody.id
    );
  }

  function isSelfVacuumPulledBodyContact(targetPlayer, body, nx, ny) {
    if (!targetPlayer || !body || !body.tier || !body.tier.solid || finiteOr(body.gadgetPullContactTimer, 0) <= 0) {
      return false;
    }

    const actorId = body.gadgetPullActorId || "";
    if (actorId && targetPlayer.id && actorId !== targetPlayer.id) {
      return false;
    }

    const aimX = finiteOr(body.gadgetPullAimX, 1);
    const aimY = finiteOr(body.gadgetPullAimY, 0);
    const toBodyX = finiteOr(body.x, 0) - finiteOr(targetPlayer.x, 0);
    const toBodyY = finiteOr(body.y, 0) - finiteOr(targetPlayer.y, 0);
    const bodyForward = toBodyX * aimX + toBodyY * aimY;
    const sideX = toBodyX - aimX * bodyForward;
    const sideY = toBodyY - aimY * bodyForward;
    const side = Math.hypot(sideX, sideY);
    const contactRadius = solidBodyContactRadius(body);
    const playerRadius = Math.max(1, finiteOr(targetPlayer.radius, player.radius));
    const closeSuctionCorridor = bodyForward > -contactRadius * 0.65 && side < contactRadius + playerRadius * 0.9;
    const contactFacesAim = nx * aimX + ny * aimY < -0.16;
    const bodyClosingSpeed = (finiteOr(body.vx, 0) - finiteOr(targetPlayer.vx, 0)) * nx +
      (finiteOr(body.vy, 0) - finiteOr(targetPlayer.vy, 0)) * ny;

    return closeSuctionCorridor && (contactFacesAim || bodyClosingSpeed > 8);
  }

  function resolveSelfVacuumPulledBodyContact(targetPlayer, body, nx, ny, overlap, damping) {
    body.x -= nx * overlap;
    body.y -= ny * overlap;

    const closingSpeed = (finiteOr(body.vx, 0) - finiteOr(targetPlayer.vx, 0)) * nx +
      (finiteOr(body.vy, 0) - finiteOr(targetPlayer.vy, 0)) * ny;
    if (closingSpeed > 0) {
      const impulse = closingSpeed * finiteOr(damping, 0.86);
      const pointX = finiteOr(body.x, 0) + nx * bodyAngularInertiaRadius(body);
      const pointY = finiteOr(body.y, 0) + ny * bodyAngularInertiaRadius(body);
      applyBodyVelocityChangeAtPoint(body, -nx * impulse, -ny * impulse, pointX, pointY, bodyConstraintTorqueResponse);
    }
  }

  function isStructureHostBody(particle) {
    return particle && particle.tier && !isStarBody(particle) && particle.tier.threshold >= structurePlacementTierThreshold;
  }

  function structurePlacementThresholdForType(type) {
    if (isLinkedStructureType(type)) {
      return thresholdForTierName("boulder");
    }
    return structurePlacementTierThreshold;
  }

  function isStructureHostBodyForType(particle, type) {
    return particle && particle.tier && !isStarBody(particle) && particle.tier.threshold >= structurePlacementThresholdForType(type);
  }

  function isKnownStructureType(type) {
    return type === "turret" || type === "missile-launcher" || type === "accumulator" || type === "shield-generator" || type === "plating-block" || type === "container" || type === "trading-port" || type === "battery" || type === "medbay" || type === "communication-relay" || type === "jet" || type === "tether" || type === "bridge";
  }

  function isLinkedStructureType(type) {
    return type === "tether" || type === "bridge";
  }

  function isActiveLinkedBodyStructure(structure) {
    return Boolean(
      structure &&
      isLinkedStructureType(structure.type) &&
      structure.health > 0 &&
      !isStructureDisabled(structure) &&
      structure.bodyId &&
      structure.linkedBodyId
    );
  }

  function isBodyAttachedToBodyByLinkedStructures(targetBody, rootBodyId) {
    const targetBodyId = targetBody && targetBody.id;
    const cleanRootBodyId = Math.max(0, Math.floor(finiteOr(rootBodyId, 0)));
    if (!targetBodyId || !cleanRootBodyId || targetBodyId === cleanRootBodyId) {
      return false;
    }

    const visited = new Set([cleanRootBodyId]);
    const queue = [cleanRootBodyId];
    for (let i = 0; i < queue.length; i += 1) {
      const bodyId = queue[i];
      for (const structure of structures) {
        if (!isActiveLinkedBodyStructure(structure)) {
          continue;
        }

        let nextBodyId = 0;
        if (structure.bodyId === bodyId) {
          nextBodyId = structure.linkedBodyId;
        } else if (structure.linkedBodyId === bodyId) {
          nextBodyId = structure.bodyId;
        }

        if (!nextBodyId || visited.has(nextBodyId)) {
          continue;
        }
        if (nextBodyId === targetBodyId) {
          return true;
        }
        visited.add(nextBodyId);
        queue.push(nextBodyId);
      }
    }

    return false;
  }

  function isActiveBridge(structure) {
    return Boolean(structure && structure.type === "bridge" && structure.health > 0 && !isStructureDisabled(structure));
  }

  function hasCommunicationRelay() {
    return structures.some((structure) => structure.type === "communication-relay" && structure.health > 0);
  }

  function structureMaxHealth(type) {
    return structureMaxHealthByType[type] || 100;
  }

  function structureHitRadius(structure) {
    if (structure.type === "plating-block") {
      return 48;
    }
    if (structure.type === "battery") {
      return 42;
    }
    if (structure.type === "container") {
      return 48;
    }
    if (structure.type === "trading-port") {
      return 58;
    }
    if (structure.type === "medbay") {
      return 52;
    }
    if (structure.type === "accumulator") {
      return 44;
    }
    if (structure.type === "shield-generator") {
      return 50;
    }
    if (structure.type === "missile-launcher") {
      return 52;
    }
    if (structure.type === "communication-relay") {
      return 52;
    }
    if (structure.type === "jet") {
      return 46;
    }
    if (structure.type === "tether") {
      return 42;
    }
    if (structure.type === "bridge") {
      return 46;
    }
    return 48;
  }

  function isStructureDisabled(structure) {
    return structure && structure.disabledTimer > 0;
  }

  function isPlatingBlock(structure) {
    return structure && structure.type === "plating-block";
  }

  function structureBaseSurfaceOffset(structure) {
    return Math.max(0, finiteOr(structure && structure.surfaceOffset, 0));
  }

  function platingBlockTopOffset(structure) {
    return structureBaseSurfaceOffset(structure) + platingBlockHeight;
  }

  function platingBlockHalfAngle(body, structure) {
    const centerRadius = Math.max(24, body.radius + structureBaseSurfaceOffset(structure) + platingBlockHeight * 0.5);
    return Math.min(Math.PI, platingBlockWidth / centerRadius / 2);
  }

  function platingBlockCoversAngle(body, structure, angle) {
    if (!isPlatingBlock(structure) || structure.bodyId !== body.id) {
      return false;
    }

    return Math.abs(shortestAngleDelta(structure.angle, angle)) <= platingBlockHalfAngle(body, structure);
  }

  function surfaceExtensionAtAngle(body, angle) {
    if (!body) {
      return 0;
    }

    let extension = 0;
    for (const structure of structures) {
      if (platingBlockCoversAngle(body, structure, angle)) {
        extension = Math.max(extension, platingBlockTopOffset(structure));
      }
    }

    return extension;
  }

  function platingBlockAtImpactAngle(body, angle) {
    if (!body) {
      return null;
    }

    let blocker = null;
    let highestOffset = -Infinity;
    for (const structure of structures) {
      if (!structure || structure.health <= 0 || !platingBlockCoversAngle(body, structure, angle)) {
        continue;
      }

      const topOffset = platingBlockTopOffset(structure);
      if (topOffset > highestOffset) {
        blocker = structure;
        highestOffset = topOffset;
      }
    }

    return blocker;
  }

  function structureCenterOffset(type, surfaceOffset) {
    if (type === "plating-block") {
      return surfaceOffset + platingBlockHeight * 0.5;
    }
    if (type === "battery") {
      return surfaceOffset + 15;
    }
    if (type === "container") {
      return surfaceOffset + 19;
    }
    if (type === "trading-port") {
      return surfaceOffset + 24;
    }
    if (type === "medbay") {
      return surfaceOffset + 20;
    }
    if (type === "shield-generator") {
      return surfaceOffset + 20;
    }
    if (type === "missile-launcher") {
      return surfaceOffset + 22;
    }
    if (type === "jet") {
      return surfaceOffset + 18;
    }
    if (type === "tether") {
      return surfaceOffset + 14;
    }
    if (type === "bridge") {
      return surfaceOffset + 16;
    }

    return surfaceOffset + structureSurfaceOffset;
  }

  function tetherBodyRadius(body) {
    return Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
  }

  function tetherGiveForBodies(firstBody, secondBody) {
    const averageRadius = (tetherBodyRadius(firstBody) + tetherBodyRadius(secondBody)) * 0.5;
    return clamp(averageRadius * tetherGiveRadiusScale, tetherMinGive, tetherMaxGive);
  }

  function tetherMaxRestLengthForBodies(firstBody, secondBody) {
    const combinedRadius = tetherBodyRadius(firstBody) + tetherBodyRadius(secondBody);
    return clamp(combinedRadius * tetherRestLengthRadiusScale, tetherMinRestLength, tetherMaxRestLength);
  }

  function normalizedTetherRestLength(structure, firstBody, secondBody, fallbackLength) {
    const savedRestLength = finiteOr(structure && structure.restLength, 0);
    const requestedLength = savedRestLength > 0 ? savedRestLength : fallbackLength;
    return clamp(requestedLength, 80, tetherMaxRestLengthForBodies(firstBody, secondBody));
  }

  function tetherPlacementLength(firstPlacement, secondPlacement) {
    return Math.hypot(
      finiteOr(secondPlacement && secondPlacement.x, 0) - finiteOr(firstPlacement && firstPlacement.x, 0),
      finiteOr(secondPlacement && secondPlacement.y, 0) - finiteOr(firstPlacement && firstPlacement.y, 0)
    );
  }
