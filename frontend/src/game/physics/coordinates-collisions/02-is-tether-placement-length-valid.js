  function isTetherPlacementLengthValid(firstPlacement, secondPlacement) {
    return Boolean(
      firstPlacement &&
      secondPlacement &&
      firstPlacement.body &&
      secondPlacement.body &&
      tetherPlacementLength(firstPlacement, secondPlacement) <=
        tetherMaxRestLengthForBodies(firstPlacement.body, secondPlacement.body) + tetherPositionSlop
    );
  }

  function linkedStructureRestLength(type, placement, linkedPlacement) {
    const length = tetherPlacementLength(placement, linkedPlacement);
    if (type === "tether") {
      return Math.min(length, tetherMaxRestLengthForBodies(placement.body, linkedPlacement.body));
    }
    return length;
  }

  function maxEnergyForBody(body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }

    return Math.round(80 + Math.sqrt(Math.max(1, body.mass)) * 4.2);
  }

  function batteryCountForBody(bodyId) {
    let count = 0;
    for (const structure of structures) {
      if (structure.type === "battery" && structure.bodyId === bodyId && structure.health > 0 && !isStructureDisabled(structure)) {
        count += 1;
      }
    }
    return count;
  }

  function energyRegenForBody(body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }

    return 2.2 + Math.sqrt(Math.max(1, body.mass)) * 0.075 + batteryCountForBody(body.id) * batteryEnergyRegenBonus;
  }

  function normalizeBodyEnergy(body) {
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
    body.energy = previousMax > 0
      ? clamp(previousEnergy, 0, maxEnergy)
      : maxEnergy;
  }

  function spendBodyEnergy(body, amount) {
    normalizeBodyEnergy(body);
    const cost = Math.max(0, finiteOr(amount, 0));
    if (!body || cost <= 0) {
      return true;
    }
    if (body.energy < cost) {
      return false;
    }

    body.energy = Math.max(0, body.energy - cost);
    return true;
  }

  function canSpendBodyEnergy(body, amount) {
    normalizeBodyEnergy(body);
    return Boolean(body) && finiteOr(body.energy, 0) >= Math.max(0, finiteOr(amount, 0));
  }

  function playerEnergyPct() {
    return clamp(player.energy / Math.max(1, player.maxEnergy), 0, 1);
  }

  function targetPlayerMaxEnergy() {
    const absorbedMass = Math.max(0, finiteOr(lifeStats.absorbedParticleMass, 0));
    const absorbedCount = Math.max(0, finiteOr(lifeStats.absorbedParticleCount, 0));
    return clamp(
      playerBaseMaxEnergy + Math.sqrt(absorbedMass) * playerMaxEnergyMassScale + absorbedCount * playerMaxEnergyCountScale,
      playerBaseMaxEnergy,
      playerMaxEnergyCap
    );
  }

  function recordPlayerAbsorption(absorber, absorbed) {
    if (!absorber || !absorbed || !isGrowthMatter(absorbed)) {
      return;
    }

    const scoredIds = connectedScoredBodyIds();
    if (!scoredIds.has(absorber.id)) {
      return;
    }

    lifeStats.absorbedParticleMass += Math.max(0, finiteOr(absorbed.mass, 0));
    lifeStats.absorbedParticleCount += 1;
  }

  function hasPlayerEnergy(amount = 0.05) {
    if (areToolsDisabled()) {
      return false;
    }
    return player.energy > Math.max(0, amount);
  }

  function continuousPlayerEnergyCost(rate, dt = 1 / 60) {
    return Math.max(0, finiteOr(rate, 0)) * Math.max(0, finiteOr(dt, 0));
  }

  function continuousPlayerEnergyActivationCost(rate, dt = 1 / 60) {
    return Math.max(playerContinuousEnergyActivationCost, continuousPlayerEnergyCost(rate, dt));
  }

  function isContinuousPlayerEnergyInputPressed() {
    return (
      (isSuctionEquipped() && isGadgetButtonPressed()) ||
      (equippedToolId === "spanner" && (mouse.left || mouse.right)) ||
      isJetpackBoostRequested()
    );
  }

  function canUseContinuousPlayerEnergy(rate, dt = 1 / 60) {
    if (playerContinuousEnergyLocked || areToolsDisabled()) {
      return false;
    }
    return canSpendPlayerEnergy(continuousPlayerEnergyActivationCost(rate, dt));
  }

  function spendPlayerEnergy(amount) {
    const cost = Math.max(0, finiteOr(amount, 0));
    if (cost <= 0) {
      return true;
    }
    if (areToolsDisabled()) {
      return false;
    }
    if (player.energy < cost) {
      player.energy = 0;
      return false;
    }

    player.energy -= cost;
    return true;
  }

  function canSpendPlayerEnergy(amount) {
    if (areToolsDisabled()) {
      return false;
    }
    return player.energy >= Math.max(0, finiteOr(amount, 0));
  }

  function drainPlayerEnergy(rate, dt) {
    return spendPlayerEnergy(Math.max(0, finiteOr(rate, 0)) * Math.max(0, finiteOr(dt, 0)));
  }

  function drainContinuousPlayerEnergy(rate, dt) {
    if (!canUseContinuousPlayerEnergy(rate, dt)) {
      playerContinuousEnergyLocked = true;
      return false;
    }
    if (!drainPlayerEnergy(rate, dt)) {
      playerContinuousEnergyLocked = true;
      return false;
    }
    return true;
  }

  function notifyEnergyDepleted() {
    maybeNotifyText("Energy depleted.", { groupKey: "energy-depleted" });
  }

  function isJetpackBoostPressed() {
    if (areToolsDisabled()) {
      return false;
    }
    return isJetpackBoostRequested();
  }

  function isJetpackBoostRequested() {
    return keys.has("ShiftLeft") || keys.has("ShiftRight") || isTouchBoostPressed();
  }

  function canUseJetpackBoost(dt = 1 / 60) {
    return isJetpackBoostPressed() && canUseContinuousPlayerEnergy(jetpackBoostEnergyDrain, dt);
  }

  function isMappedBody(particle) {
    return particle.tier.threshold >= mappedBodyThreshold;
  }

  function surfaceDistanceToPlayer(particle) {
    const dx = player.x - particle.x;
    const dy = player.y - particle.y;
    const angle = Math.atan2(dy, dx);
    return Math.max(0, Math.hypot(dx, dy) - particle.radius - surfaceExtensionAtAngle(particle, angle));
  }

  function findNearestProgressBody() {
    if (player.landed) {
      const landedBody = bodyById(player.landed.bodyId);
      if (landedBody) {
        return landedBody;
      }
    }

    let nearest = null;
    let nearestDistance = Infinity;

    for (const particle of particles) {
      const distance = surfaceDistanceToPlayer(particle);
      if (distance < nearestDistance) {
        nearest = particle;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function findBucketProgressBody() {
    if (!isSuctionEquipped()) {
      return null;
    }

    const aim = getAim();
    const state = {
      actor: player,
      aimWorld: aim.world,
      funnel: getFunnel(aim),
      left: false,
      middle: false,
      right: false,
      bucketActive: true,
      bucketPadding: 0,
      landedBodyId: player.landed ? player.landed.bodyId : null
    };
    let best = null;
    let bestMass = 0;

    for (const particle of particles) {
      if (!partyGadgetCanAffectParticle(state, particle)) {
        continue;
      }
      if (!partyGadgetBucketContact(state, particle, 0)) {
        continue;
      }
      const mass = finiteOr(particle.mass, 0);
      if (mass > bestMass) {
        best = particle;
        bestMass = mass;
      }
    }

    return best;
  }

  function findNearestLandableBody() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const particle of particles) {
      if (!isLandableBody(particle)) {
        continue;
      }

      const dx = player.x - particle.x;
      const dy = player.y - particle.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const landingRange = particle.radius + surfaceExtensionAtAngle(particle, angle) + playerFootOffset + 90;

      if (distance < landingRange && distance < nearestDistance) {
        nearest = particle;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function findStructurePlacementAt(worldX, worldY) {
    const recipe = recipeById(activePlacementRecipeId);
    const structureType = recipe && recipe.structureType;
    let best = null;
    let bestScore = Infinity;

    for (const body of particles) {
      if (!isStructureHostBodyForType(body, structureType)) {
        continue;
      }

      const dx = worldX - body.x;
      const dy = worldY - body.y;
      const dist = Math.hypot(dx, dy) || 1;
      const angle = Math.atan2(dy, dx);
      const surfaceOffset = surfaceExtensionAtAngle(body, angle);
      const surfaceDelta = Math.abs(dist - body.radius - surfaceOffset);
      if (surfaceDelta > structurePlacementLeeway) {
        continue;
      }

      const centerOffset = structureCenterOffset(structureType, surfaceOffset);
      const x = body.x + Math.cos(angle) * (body.radius + centerOffset);
      const y = body.y + Math.sin(angle) * (body.radius + centerOffset);
      const screen = worldToScreen(x, y);
      const screenDistance = Math.hypot(mouse.x - screen.x, mouse.y - screen.y);
      const score = surfaceDelta + screenDistance * 0.08;

      if (score < bestScore) {
        bestScore = score;
        best = {
          valid: true,
          body,
          bodyId: body.id,
          angle,
          surfaceOffset,
          x,
          y
        };
      }
    }

    if (best) {
      return best;
    }

    return {
      valid: false,
      body: null,
      bodyId: null,
      angle: Math.atan2(worldY - player.y, worldX - player.x),
      surfaceOffset: 0,
      x: worldX,
      y: worldY
    };
  }

  function currentStructurePlacement() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    return findStructurePlacementAt(cursor.x, cursor.y);
  }

  function refreshPlacementAnchor(placement) {
    if (!placement || !placement.bodyId) {
      return placement;
    }

    const body = bodyById(placement.bodyId);
    const recipe = recipeById(activePlacementRecipeId);
    if (!isStructureHostBodyForType(body, recipe && recipe.structureType)) {
      return Object.assign({}, placement, { valid: false, body: null });
    }

    const surfaceOffset = surfaceExtensionAtAngle(body, placement.angle);
    const centerOffset = structureCenterOffset(recipe && recipe.structureType, surfaceOffset);
    return Object.assign({}, placement, {
      valid: true,
      body,
      surfaceOffset,
      x: body.x + Math.cos(placement.angle) * (body.radius + centerOffset),
      y: body.y + Math.sin(placement.angle) * (body.radius + centerOffset)
    });
  }

  function createStructure(recipe, placement, linkedPlacement) {
    const restCenterDx = linkedPlacement ? linkedPlacement.body.x - placement.body.x : 0;
    const restCenterDy = linkedPlacement ? linkedPlacement.body.y - placement.body.y : 0;
    const restCenterAngle = Math.atan2(restCenterDy, restCenterDx);
    const structure = {
      id: nextStructureId++,
      type: recipe.structureType,
      ownerPlayerId: player.id,
      bodyId: placement.bodyId,
      linkedBodyId: linkedPlacement ? linkedPlacement.bodyId : 0,
      angle: placement.angle,
      linkedAngle: linkedPlacement ? linkedPlacement.angle : 0,
      surfaceOffset: placement.surfaceOffset,
      linkedSurfaceOffset: linkedPlacement ? linkedPlacement.surfaceOffset : 0,
      x: placement.x,
      y: placement.y,
      x2: linkedPlacement ? linkedPlacement.x : placement.x,
      y2: linkedPlacement ? linkedPlacement.y : placement.y,
      restLength: linkedPlacement ? linkedStructureRestLength(recipe.structureType, placement, linkedPlacement) : 0,
      restCenterDx,
      restCenterDy,
      bridgeAngleOffset: recipe.structureType === "bridge" && linkedPlacement ? shortestAngleDelta(restCenterAngle, placement.angle) : 0,
      bridgeLinkedAngleOffset: recipe.structureType === "bridge" && linkedPlacement ? shortestAngleDelta(restCenterAngle, linkedPlacement.angle) : 0,
      aimAngle: placement.angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: randomRange(0.2, 0.8),
      burstTimer: 0,
      burstCooldown: randomRange(0.4, accumulatorBurstInterval),
      healPulse: 0,
      missileCharge: 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: placement.x,
      targetY: placement.y,
      targetCount: 0,
      health: structureMaxHealth(recipe.structureType),
      maxHealth: structureMaxHealth(recipe.structureType),
      disabledTimer: 0,
      flash: 0,
      tech: normalizeTradeOffer(null),
      tradeOffers: [],
      tradeOfferSeq: 1,
      tradeVessel: null,
      wobble: randomRange(0, Math.PI * 2)
    };
    return structure;
  }

  function applyLinkedStructureSurfaceConstraint(structure) {
    const firstBody = bodyById(structure.bodyId);
    const secondBody = bodyById(structure.linkedBodyId);
    if (!isStructureHostBodyForType(firstBody, structure.type) || !isStructureHostBodyForType(secondBody, structure.type) || firstBody.id === secondBody.id) {
      return false;
    }

    const firstOffset = structureCenterOffset(structure.type, structureBaseSurfaceOffset(structure));
    const secondSurfaceOffset = Math.max(0, finiteOr(structure.linkedSurfaceOffset, 0));
    const secondOffset = structureCenterOffset(structure.type, secondSurfaceOffset);
    structure.x = firstBody.x + Math.cos(structure.angle) * (firstBody.radius + firstOffset);
    structure.y = firstBody.y + Math.sin(structure.angle) * (firstBody.radius + firstOffset);
    structure.x2 = secondBody.x + Math.cos(structure.linkedAngle) * (secondBody.radius + secondOffset);
    structure.y2 = secondBody.y + Math.sin(structure.linkedAngle) * (secondBody.radius + secondOffset);
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
