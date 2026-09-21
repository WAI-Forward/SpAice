  function updateFighters(dt) {
    for (let i = fighters.length - 1; i >= 0; i -= 1) {
      const fighter = fighters[i];
      tickMobDamageTimers(fighter, dt);
      fighter.flash = Math.max(0, fighter.flash - dt);
      fighter.shootCooldown = Math.max(0, fighter.shootCooldown - dt);
      fighter.machineGunTimer = Math.max(0, finiteOr(fighter.machineGunTimer, 0) - dt);

      if (fighter.shieldActive > 0) {
        const before = fighter.shieldActive;
        fighter.shieldActive = Math.max(0, fighter.shieldActive - dt);
        fighter.shieldCharge = Math.max(0, fighter.shieldCharge - Math.min(dt, before));
        fighter.shieldRecharge = fighterShieldCycle;
      } else if (fighter.shieldCharge < fighterShieldMaxCharge) {
        fighter.shieldRecharge = Math.max(0, fighter.shieldRecharge - dt);
        if (fighter.shieldRecharge <= 0) {
          fighter.shieldCharge = fighterShieldMaxCharge;
        }
      }

      if (fighter.health <= 0) {
        fighters.splice(i, 1);
        continue;
      }
      if (isMobSummoning(fighter)) {
        continue;
      }
      if (shouldSleepDistantSurvivalMob(fighter)) {
        continue;
      }
      updateBossSpawnPressure(fighter, dt);
      if (isMobDisabled(fighter)) {
        fighter.shieldActive = 0;
        fighter.shootCooldown = Math.max(fighter.shootCooldown, 0.24);
        fighter.machineGunShots = 0;
        updateDisabledMobDrift(fighter, dt);
        continue;
      }

      if (updateSurvivalCampMobHome(fighter, dt)) {
        continue;
      }

      const target = combatTargetForMob(fighter);
      if (!target) {
        updateFamiliarMob(fighter, dt);
        continue;
      }
      const targetPlayer = target.player;
      const toPlayerX = targetPlayer.x - fighter.x;
      const toPlayerY = targetPlayer.y - fighter.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.8 + 2200) {
        const spawn = relocatedMobOffscreenPoint(260, 760, targetPlayer);
        fighter.x = spawn.x;
        fighter.y = spawn.y;
        fighter.vx = randomRange(-20, 20);
        fighter.vy = randomRange(-20, 20);
        fighter.shootCooldown = randomRange(1.0, 2.4);
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * fighter.strafeSign;
      const tangentY = nx * fighter.strafeSign;

      const chaseForce = bossChaseForce(fighter, dist > 560 ? 110 : -62);
      const strafeForce = bossStrafeForce(fighter, dist < 1050 ? 78 : 24);
      fighter.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      fighter.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

      const bossAltReady = tickBossAltAttackCooldown(fighter, dt);
      const clearShot = hasClearShotAtCombatTarget(fighter, target);
      if (fighter.isBoss && finiteOr(fighter.machineGunShots, 0) > 0) {
        if (fighter.machineGunTimer <= 0 && dist < fighterShootRange * 1.32 && clearShot) {
          fireFighterBossMachineGunShot(fighter, target, dist);
          fighter.machineGunShots = Math.max(0, Math.floor(finiteOr(fighter.machineGunShots, 0)) - 1);
          fighter.machineGunTimer = fighter.machineGunShots > 0 ? 0.065 : 0;
        } else if (!clearShot || dist >= fighterShootRange * 1.48) {
          fighter.machineGunShots = 0;
        }
      } else if (bossAltReady && fighter.isBoss && dist < fighterShootRange * 1.25 && clearShot) {
        fighter.machineGunShots = 16;
        fighter.machineGunTimer = 0;
        fighter.shootCooldown = Math.max(fighter.shootCooldown, 1.2);
        resetBossAltAttackCooldown(fighter);
      } else if (dist < fighterShootRange && fighter.shootCooldown <= 0 && clearShot) {
        fireFighterGuns(fighter, target, dist);
      }

      fighter.vx += Math.sin(performance.now() * 0.00052 + fighter.wobble) * 9 * dt;
      fighter.vy += Math.cos(performance.now() * 0.00047 + fighter.wobble) * 9 * dt;
      fighter.vx *= Math.pow(0.72, dt);
      fighter.vy *= Math.pow(0.72, dt);

      const speed = Math.hypot(fighter.vx, fighter.vy);
      const maxSpeed = bossChaseMaxSpeed(fighter, dist > 820 ? 210 : 162, nx, ny);
      if (speed > maxSpeed) {
        fighter.vx = (fighter.vx / speed) * maxSpeed;
        fighter.vy = (fighter.vy / speed) * maxSpeed;
      }

      fighter.x += fighter.vx * dt;
      fighter.y += fighter.vy * dt;
      fighter.rotation = Math.atan2(ny, nx) + Math.PI / 2;
    }
  }
