  function repairWithSpanner(dt) {
    if (equippedToolId !== "spanner" || areToolsDisabled() || !mouse.left || buildMenuOpen) {
      return false;
    }

    const target = findSpannerRepairTarget();
    if (!target) {
      return false;
    }

    if (!drainPlayerEnergy(spannerRepairEnergyDrain, dt)) {
      notifyEnergyDepleted();
      return false;
    }

    if (repairStructure(target, currentSpannerRepairRate() * dt)) {
      const color = { r: 102, g: 224, b: 184 };
      if (Math.random() < dt * 9) {
        sparks.push({
          x: target.x + randomRange(-16, 16),
          y: target.y + randomRange(-16, 16),
          radius: 18,
          color,
          life: 0.18,
          maxLife: 0.18
        });
      }
      playSound("pickupTech", { throttleKey: "spannerRepair", throttle: 0.22 });
      return true;
    }

    return false;
  }

  function structureTargetPoint(structure, cursor) {
    if (isLinkedStructureType(structure.type)) {
      const firstDistance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      const x2 = finiteOr(structure.x2, structure.x);
      const y2 = finiteOr(structure.y2, structure.y);
      const secondDistance = Math.hypot(x2 - cursor.x, y2 - cursor.y);
      if (secondDistance < firstDistance) {
        return { x: x2, y: y2, distance: secondDistance };
      }
      return { x: structure.x, y: structure.y, distance: firstDistance };
    }

    return {
      x: structure.x,
      y: structure.y,
      distance: Math.hypot(structure.x - cursor.x, structure.y - cursor.y)
    };
  }

  function findSpannerDismantleTarget() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestScore = Infinity;

    for (const structure of structures) {
      if (structure.health <= 0) {
        continue;
      }

      const targetPoint = structureTargetPoint(structure, cursor);
      const playerDistance = Math.hypot(targetPoint.x - player.x, targetPoint.y - player.y);
      const hitRadius = structureHitRadius(structure);
      if (targetPoint.distance > hitRadius + 38 || playerDistance > spannerRepairRange + hitRadius) {
        continue;
      }

      const score = targetPoint.distance + playerDistance * 0.18;
      if (score < bestScore) {
        best = structure;
        bestScore = score;
      }
    }

    return best;
  }

  function refundDismantledStructure(structure) {
    const recipe = recipeByStructureType(structure.type);
    if (!recipe) {
      return 0;
    }

    return refundRecipeCost(recipe, 0.8);
  }

  function dismantleStructureWithSpanner(dt) {
    if (equippedToolId !== "spanner" || areToolsDisabled() || !mouse.right || buildMenuOpen) {
      return false;
    }

    const target = findSpannerDismantleTarget();
    if (!target) {
      return false;
    }

    if (!drainPlayerEnergy(spannerDismantleEnergyDrain, dt)) {
      notifyEnergyDepleted();
      return false;
    }

    const maxHealth = Math.max(1, finiteOr(target.maxHealth, structureMaxHealth(target.type)));
    const health = clamp(finiteOr(target.health, maxHealth), 0, maxHealth);
    target.maxHealth = maxHealth;
    target.health = Math.max(0, health - currentSpannerDismantleRate() * dt);
    target.flash = Math.max(target.flash || 0, 0.16);
    if (isSurvivalCampStructure(target)) {
      wakeSurvivalCampFromStructure(target, player.id || "");
    }

    if (Math.random() < dt * 10) {
      sparks.push({
        x: target.x + randomRange(-16, 16),
        y: target.y + randomRange(-16, 16),
        radius: 18,
        color: { r: 102, g: 224, b: 184 },
        life: 0.18,
        maxLife: 0.18
      });
    }
    playSound("mobHit", { throttleKey: "spannerDismantle", throttle: 0.18, volume: 0.72 });

    if (target.health <= 0) {
      const index = structures.indexOf(target);
      if (index !== -1) {
        structures.splice(index, 1);
      }
      sparks.push({
        x: target.x,
        y: target.y,
        radius: structureHitRadius(target) * 1.35,
        color: { r: 102, g: 224, b: 184 },
        life: 0.28,
        maxLife: 0.28
      });
      const refunded = refundDismantledStructure(target);
      updateTechUi();
      playSound("pickupTech", { throttleKey: "spannerRefund", throttle: 0.08 });
      maybeNotifyText(target.type.replace(/-/g, " ") + (refunded > 0 ? " dismantled. Tech recovered." : " dismantled."));
    }

    return true;
  }

  function findSpannerStrikeTarget() {
    const aim = getAim();
    const ax = player.x + aim.world.x * 28;
    const ay = player.y + aim.world.y * 28;
    const bx = player.x + aim.world.x * spannerStrikeRange;
    const by = player.y + aim.world.y * spannerStrikeRange;
    let best = null;
    let bestDistance = Infinity;

    for (const mob of allCombatMobs()) {
      if (!isMechanicalMob(mob) || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }

      const segmentDistance = distanceToSegment(mob.x, mob.y, ax, ay, bx, by);
      const playerDistance = Math.hypot(mob.x - player.x, mob.y - player.y);
      if (segmentDistance > mob.radius + 18 || playerDistance > spannerStrikeRange + mob.radius || playerDistance >= bestDistance) {
        continue;
      }

      best = mob;
      bestDistance = playerDistance;
    }

    return best;
  }

  function strikeWithSpanner() {
    if (!isSpannerEquipped() || !mouse.right || buildMenuOpen || toolFireCooldown > 0) {
      return false;
    }

    if (!spendPlayerEnergy(spannerStrikeEnergyCost)) {
      notifyEnergyDepleted();
      return false;
    }

    const target = findSpannerStrikeTarget();
    toolFireCooldown = currentSpannerStrikeCooldown();
    if (!target) {
      return false;
    }

    const aim = getAim();
    knockMob(target, aim.world.x, aim.world.y, 115);
    damageMob(
      target,
      spannerStrikeDamage,
      { r: 102, g: 224, b: 184 },
      mobName(target) + " dismantled by the spanner.",
      { sourceTool: "spanner" }
    );
    sparks.push({
      x: target.x,
      y: target.y,
      radius: target.radius * 1.5,
      color: { r: 102, g: 224, b: 184 },
      life: 0.26,
      maxLife: 0.26
    });
    return true;
  }

  function pistonPunchSegment(aimOverride) {
    const aim = aimOverride || getAim();
    const startX = player.x + aim.world.x * 34;
    const startY = player.y + aim.world.y * 34;
    return {
      ax: startX,
      ay: startY,
      bx: player.x + aim.world.x * pistonPunchRange,
      by: player.y + aim.world.y * pistonPunchRange,
      nx: aim.world.x,
      ny: aim.world.y
    };
  }

  function findPistonPunchTarget(punchOverride) {
    const punch = punchOverride || pistonPunchSegment();
    let best = null;
    let bestDistance = Infinity;

    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
        continue;
      }

      const segmentDistance = distanceToSegment(mob.x, mob.y, punch.ax, punch.ay, punch.bx, punch.by);
      const playerDistance = Math.hypot(mob.x - player.x, mob.y - player.y);
      if (segmentDistance > mob.radius + 24 || playerDistance > pistonPunchRange + mob.radius || playerDistance >= bestDistance) {
        continue;
      }

      best = mob;
      bestDistance = playerDistance;
    }

    return best;
  }

  function snapPistonPunchAimToCursor() {
    gadgetAngle = getCursorAimAngle();
    return getAim();
  }

  function emitPistonPunchMiss(punch) {
    sparks.push({
      x: punch.bx,
      y: punch.by,
      radius: 52,
      color: { r: 255, g: 209, b: 102 },
      life: 0.18,
      maxLife: 0.18
    });
  }

  function firePistonPunch() {
    if (!isPistonPunchEquipped() || !mouse.left || buildMenuOpen || toolFireCooldown > 0) {
      return false;
    }

    if (!spendPlayerEnergy(pistonPunchEnergyCost)) {
      notifyEnergyDepleted();
      return false;
    }

    const punch = pistonPunchSegment(snapPistonPunchAimToCursor());
    const target = findPistonPunchTarget(punch);
    toolFireCooldown = pistonPunchCooldown;
    if (!target) {
      emitPistonPunchMiss(punch);
      playSound("mobHit", { throttleKey: "pistonPunchMiss", throttle: 0.2, volume: 0.44 });
      return true;
    }

    knockMob(target, punch.nx, punch.ny, pistonPunchKnockback);
    damageMob(
      target,
      pistonPunchDamage,
      { r: 255, g: 209, b: 102 },
      mobName(target) + " punched by the Piston Punch.",
      { sourceTool: pistonPunchToolId }
    );
    sparks.push({
      x: target.x,
      y: target.y,
      radius: Math.max(62, target.radius * 1.8),
      color: { r: 255, g: 209, b: 102 },
      life: 0.28,
      maxLife: 0.28
    });
    playSound("rambotCharge", { throttleKey: "pistonPunchHit", throttle: 0.18, volume: 0.72 });
    return true;
  }

  function familiarNetSwipeSegment() {
    const aim = getAim();
    const startX = player.x + aim.world.x * 24;
    const startY = player.y + aim.world.y * 24;
    return {
      ax: startX,
      ay: startY,
      bx: player.x + aim.world.x * familiarNetRange,
      by: player.y + aim.world.y * familiarNetRange,
      nx: aim.world.x,
      ny: aim.world.y
    };
  }

  function findFamiliarNetTarget() {
    const swipe = familiarNetSwipeSegment();
    let best = null;
    let bestScore = Infinity;
    const aimAngle = Math.atan2(swipe.ny, swipe.nx);

    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0 || mob.isBoss || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
        continue;
      }

      const mobDx = mob.x - player.x;
      const mobDy = mob.y - player.y;
      const segmentDistance = distanceToSegment(mob.x, mob.y, swipe.ax, swipe.ay, swipe.bx, swipe.by);
      const playerDistance = Math.hypot(mobDx, mobDy);
      const mobAngle = Math.atan2(mobDy, mobDx);
      const angleDelta = Math.abs(shortestAngleDelta(aimAngle, mobAngle));
      const inSwipeLine = segmentDistance <= mob.radius + familiarNetCatchLinePadding;
      const inSwipeArc = angleDelta <= familiarNetCatchHalfAngle;
      if (
        playerDistance > familiarNetRange + mob.radius ||
        (!inSwipeLine && !inSwipeArc)
      ) {
        continue;
      }

      const score = playerDistance + angleDelta * 55 + segmentDistance * 0.3;
      if (score >= bestScore) {
        continue;
      }

      best = mob;
      bestScore = score;
    }

    return best;
  }

  function startFamiliarNetSwing(direction) {
    familiarNetSwingTimer = familiarNetSwingDuration;
    familiarNetSwingDirection = direction < 0 ? -1 : 1;
  }

  function removeMobFromCollection(mob) {
    const collection = mob && mobCollectionByKind(mob.kind);
    if (!Array.isArray(collection)) {
      return false;
    }
    const index = collection.indexOf(mob);
    if (index < 0) {
      return false;
    }
    collection.splice(index, 1);
    return true;
  }

  function captureMobWithFamiliarNet() {
    if (!isFamiliarNetEquipped() || !mouse.left || buildMenuOpen || toolFireCooldown > 0) {
      return false;
    }

    startFamiliarNetSwing(-1);
    toolFireCooldown = familiarNetCooldown;
    if (familiarNetCapture) {
      playSound("mobHit", { throttleKey: "familiarNetFull", throttle: 0.22, volume: 0.34 });
      maybeNotifyText("The familiar net is already holding one mob.");
      resetMouseButtons();
      return true;
    }
    if (hasActiveLocalPlayerFamiliar()) {
      playSound("mobHit", { throttleKey: "familiarNetActive", throttle: 0.22, volume: 0.34 });
      maybeNotifyText("Your familiar is already out.");
      resetMouseButtons();
      return true;
    }

    const target = findFamiliarNetTarget();
    if (!target) {
      playSound("mobHit", { throttleKey: "familiarNetMiss", throttle: 0.22, volume: 0.42 });
      resetMouseButtons();
      return true;
    }

    familiarNetCapture = {
      kind: target.kind,
      health: clamp(finiteOr(target.health, target.maxHealth), 1, finiteOr(target.maxHealth, target.health || 1)),
      maxHealth: Math.max(1, finiteOr(target.maxHealth, target.health || 1)),
      color: target.color ? { ...target.color } : null
    };
    removeMobFromCollection(target);
    sparks.push({
      x: target.x,
      y: target.y,
      radius: Math.max(48, target.radius * 2.2),
      color: target.color || { r: 102, g: 224, b: 184 },
      life: 0.32,
      maxLife: 0.32
    });
    playSound("pickupTech", { throttleKey: "familiarNetCatch", throttle: 0.18 });
    maybeNotifyText("Caught " + mobName(target).toLowerCase() + " in the familiar net.");
    resetMouseButtons();
    return true;
  }

  function releaseFamiliarFromNet() {
    if (!isFamiliarNetEquipped() || !mouse.right || buildMenuOpen || toolFireCooldown > 0) {
      return false;
    }

    startFamiliarNetSwing(1);
    if (!familiarNetCapture) {
      if (commandLocalFamiliarsToCursor()) {
        return true;
      }
      toolFireCooldown = familiarNetReleaseCooldown;
      playSound("mobHit", { throttleKey: "familiarNetEmpty", throttle: 0.22, volume: 0.28 });
      resetMouseButtons();
      return true;
    }
    if (hasActiveLocalPlayerFamiliar()) {
      toolFireCooldown = familiarNetReleaseCooldown;
      playSound("mobHit", { throttleKey: "familiarNetActive", throttle: 0.22, volume: 0.34 });
      maybeNotifyText("Your familiar is already out.");
      resetMouseButtons();
      return true;
    }

    const aim = getAim();
    const releaseDistance = 118;
    const x = player.x + aim.world.x * releaseDistance;
    const y = player.y + aim.world.y * releaseDistance;
    const familiar = createMobByKind(familiarNetCapture.kind, x, y, {
      team: "player",
      health: familiarNetCapture.health,
      maxHealth: familiarNetCapture.maxHealth,
      color: familiarNetCapture.color || undefined,
      summonAge: 0,
      summonDuration: 0.42,
      summonSpinSpeed: 8
    });
    familiar.team = "player";
    familiar.familiarOwnerPlayerId = localFamiliarOwnerId();
    familiar.summonBaseRadius = Math.max(1, finiteOr(familiar.radius, 28));
    familiar.radius = 0;
    familiar.vx += aim.world.x * 140 + finiteOr(player.vx, 0) * 0.2;
    familiar.vy += aim.world.y * 140 + finiteOr(player.vy, 0) * 0.2;
    collectionPushMob(familiar.kind, familiar);
    sparks.push({
      x,
      y,
      radius: 82,
      color: familiar.color || { r: 102, g: 224, b: 184 },
      life: 0.36,
      maxLife: 0.36,
      summonTelegraph: true
    });
    familiarNetCapture = null;
    toolFireCooldown = familiarNetReleaseCooldown;
    playSound("pickupHealth", { throttleKey: "familiarNetRelease", throttle: 0.18 });
    maybeNotifyText("Released familiar " + mobName(familiar).toLowerCase() + ".");
    resetMouseButtons();
    return true;
  }
