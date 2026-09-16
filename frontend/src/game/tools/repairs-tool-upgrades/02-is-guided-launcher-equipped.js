  function isGuidedLauncherEquipped() {
    return equippedToolId === guidedLauncherToolId && !areToolsDisabled();
  }

  function addGuidedLauncherPathPoint(missile, point) {
    if (!missile || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return;
    }
    const path = Array.isArray(missile.guidedPath) ? missile.guidedPath : (missile.guidedPath = []);
    const last = path[path.length - 1];
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < guidedLauncherPathPointSpacing) {
      last.x = point.x;
      last.y = point.y;
    } else {
      path.push({ x: point.x, y: point.y });
    }
    while (path.length > guidedLauncherMaxPathPoints) {
      path.splice(1, 1);
      missile.guidedIndex = Math.max(1, finiteOr(missile.guidedIndex, 1) - 1);
    }
    missile.targetX = point.x;
    missile.targetY = point.y;
  }

  function launchGuidedLauncherMissile() {
    const aim = getAim();
    const cursor = screenToWorld(mouse.x, mouse.y);
    const muzzleDistance = 78;
    const color = { r: 255, g: 184, b: 88 };
    const startX = player.x + aim.world.x * muzzleDistance;
    const startY = player.y + aim.world.y * muzzleDistance;
    const missile = {
      x: startX,
      y: startY,
      vx: aim.world.x * launcherMissileSpeed * 0.78 + finiteOr(player.vx, 0) * 0.14,
      vy: aim.world.y * launcherMissileSpeed * 0.78 + finiteOr(player.vy, 0) * 0.14,
      radius: 10,
      length: 62,
      color,
      life: guidedLauncherMissileLife,
      maxLife: guidedLauncherMissileLife,
      damage: launcherMissileDamage * 0.88,
      rocket: true,
      guided: true,
      guidedReleased: false,
      guidedIndex: 1,
      guidedPath: [{ x: startX, y: startY }],
      targetX: cursor.x,
      targetY: cursor.y,
      targetCount: 1,
      ignoredBodyId: player.landed ? player.landed.bodyId : null
    };

    addGuidedLauncherPathPoint(missile, cursor);
    launcherMissiles.push(missile);
    guidedLauncherState.activeMissile = missile;
    toolFireCooldown = guidedLauncherCooldown;

    if (!player.landed) {
      player.weaponSlow = clamp(finiteOr(player.weaponSlow, 0) + 0.2, 0, weaponSlowMax);
      player.vx -= aim.world.x * 34;
      player.vy -= aim.world.y * 34;
    }

    sparks.push({
      x: startX,
      y: startY,
      radius: 36,
      color,
      life: 0.22,
      maxLife: 0.22
    });
    playSound("missile");
    return true;
  }

  function updateGuidedLauncher() {
    const active = guidedLauncherState.activeMissile;
    if (active && !launcherMissiles.includes(active)) {
      guidedLauncherState.activeMissile = null;
    }

    if (guidedLauncherState.activeMissile && (!isGuidedLauncherEquipped() || buildMenuOpen || !mouse.left)) {
      guidedLauncherState.activeMissile.guidedReleased = true;
      guidedLauncherState.activeMissile = null;
    }

    if (!isGuidedLauncherEquipped() || buildMenuOpen) {
      return false;
    }

    if (guidedLauncherState.activeMissile) {
      addGuidedLauncherPathPoint(guidedLauncherState.activeMissile, screenToWorld(mouse.x, mouse.y));
      return true;
    }

    if (!mouse.left || toolFireCooldown > 0) {
      return false;
    }

    if (!canSpendPlayerEnergy(guidedLauncherEnergyCost)) {
      notifyEnergyDepleted();
      toolFireCooldown = 0.25;
      return true;
    }

    spendPlayerEnergy(guidedLauncherEnergyCost);
    return launchGuidedLauncherMissile();
  }

  function updateRocketSuit(dt) {
    const active = isRocketSuitEquipped() && mouse.left && !buildMenuOpen;
    player.rocketSuitActive = false;

    if (!active) {
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - rocketSuitChargeDecay * dt);
      return false;
    }

    if (!canUseContinuousPlayerEnergy(rocketSuitEnergyDrain, dt)) {
      notifyEnergyDepleted();
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - rocketSuitChargeDecay * dt);
      return false;
    }

    if (player.landed) {
      detachFromBody(95);
    }

    if (!drainContinuousPlayerEnergy(rocketSuitEnergyDrain, dt)) {
      notifyEnergyDepleted();
      return false;
    }

    const aim = getAim();
    const charge = clamp(finiteOr(player.rocketSuitCharge, 0) + rocketSuitChargeRate * dt, 0, 1);
    const thrust = rocketSuitBaseThrust + rocketSuitChargeThrust * charge;
    const maxSpeed = rocketSuitBaseMaxSpeed + rocketSuitChargeMaxSpeed * charge;
    player.rocketSuitCharge = charge;
    player.rocketSuitActive = true;
    player.vx += aim.world.x * thrust * dt;
    player.vy += aim.world.y * thrust * dt;

    const speed = Math.hypot(player.vx, player.vy);
    if (speed > maxSpeed) {
      player.vx = (player.vx / speed) * maxSpeed;
      player.vy = (player.vy / speed) * maxSpeed;
    }

    const hitSpeed = Math.max(speed, Math.hypot(player.vx, player.vy));
    if (hitSpeed > rocketImpactSpeed * 0.7) {
      for (const mob of allCombatMobs()) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0 || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
          continue;
        }
        const dx = mob.x - player.x;
        const dy = mob.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const hitDistance = mob.radius + player.radius * 0.72;
        if (dist > hitDistance) {
          continue;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        knockMob(mob, nx, ny, rocketSuitMobKnockback + hitSpeed * 0.22);
        damageMob(
          mob,
          rocketSuitMobDamage + Math.max(0, hitSpeed - rocketImpactSpeed * 0.7) * rocketSuitMobDamageSpeedScale,
          { r: 169, g: 133, b: 255 },
          mobName(mob) + " rammed by the Rocket Suit.",
          { sourceTool: rocketSuitToolId }
        );
        player.vx -= nx * 120;
        player.vy -= ny * 120;
        break;
      }
    }

    return true;
  }

  function updateEquippedTool(dt) {
    toolFireCooldown = Math.max(0, toolFireCooldown - dt);
    familiarNetSwingTimer = Math.max(0, familiarNetSwingTimer - dt);
    if (updateRocketSuit(dt)) {
      return;
    }
    if (captureMobWithFamiliarNet()) {
      return;
    }
    if (releaseFamiliarFromNet()) {
      return;
    }
    if (repairWithSpanner(dt)) {
      return;
    }
    if (dismantleStructureWithSpanner(dt)) {
      return;
    }
    if (strikeWithSpanner()) {
      return;
    }
    if (firePistonPunch()) {
      return;
    }
    if (fireEmpTool()) {
      return;
    }
    if (updateGuidedLauncher()) {
      return;
    }

    const weapon = equippedWeapon();

    if (areToolsDisabled() || buildMenuOpen || !weapon || !mouse.left || toolFireCooldown > 0) {
      return;
    }

    const energyCost = finiteOr(weapon.energyCost, playerWeaponDefaults.energyCost);
    if (!canSpendPlayerEnergy(energyCost)) {
      notifyEnergyDepleted();
      return;
    }

    firePlayerLaser(weapon);
    spendPlayerEnergy(energyCost);
    toolFireCooldown = weapon.cooldown;
  }

  function updateToolDisable(dt) {
    updatePlayerStatusEffects(dt);
    if (!areToolsDisabled()) {
      return;
    }

    resetMouseButtons();
  }
