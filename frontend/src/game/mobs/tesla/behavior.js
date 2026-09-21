  function updateTeslas(dt) {
    for (let i = teslas.length - 1; i >= 0; i -= 1) {
      const tesla = teslas[i];
      tickMobDamageTimers(tesla, dt);
      tesla.flash = Math.max(0, tesla.flash - dt);
      tesla.shootCooldown = Math.max(0, tesla.shootCooldown - dt);
      tesla.lightningFlash = Math.max(0, (tesla.lightningFlash || 0) - dt);

      if (tesla.health <= 0) {
        teslas.splice(i, 1);
        continue;
      }
      if (isMobSummoning(tesla)) {
        continue;
      }
      if (shouldSleepDistantSurvivalMob(tesla)) {
        continue;
      }
      updateBossSpawnPressure(tesla, dt);
      if (isMobDisabled(tesla)) {
        tesla.lightningWarmup = 0;
        updateDisabledMobDrift(tesla, dt);
        continue;
      }

      if (updateSurvivalCampMobHome(tesla, dt)) {
        continue;
      }

      const playerTarget = combatTargetForMob(tesla);
      if (!playerTarget) {
        updateFamiliarMob(tesla, dt);
        continue;
      }
      const targetPlayer = playerTarget.player;
      const target = electricAttackTarget(tesla, playerTarget);
      const toPlayerX = target.x - tesla.x;
      const toPlayerY = target.y - tesla.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const playerDist = Math.hypot(targetPlayer.x - tesla.x, targetPlayer.y - tesla.y) || 1;
      const previousWarmup = tesla.lightningWarmup || 0;
      const bossAltReady = tickBossAltAttackCooldown(tesla, dt);

      if (playerDist > Math.max(width, height) * 2.6 + 1800) {
        const spawn = relocatedMobOffscreenPoint(190, 560, targetPlayer);
        tesla.x = spawn.x;
        tesla.y = spawn.y;
        tesla.vx = randomRange(-18, 18);
        tesla.vy = randomRange(-18, 18);
        tesla.shootCooldown = randomRange(1.2, 2.5);
        continue;
      }

      if (bossAltReady && playerDist < teslaBossEmpPulseRange * 1.12) {
        applyEmpPulse(tesla.x, tesla.y, teslaBossEmpPulseRange, teslaBossEmpPulseDisableDuration, {
          affectMobs: true,
          affectPlayers: !isPlayerTeamMob(tesla),
          affectStructures: !isPlayerTeamMob(tesla),
          sourceMob: tesla,
          color: tesla.color,
          cause: "Tesla boss EMP"
        });
        resetBossAltAttackCooldown(tesla);
        tesla.lightningWarmup = 0;
        tesla.lightningFlash = Math.max(tesla.lightningFlash || 0, 0.48);
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * tesla.strafeSign;
      const tangentY = nx * tesla.strafeSign;
      const desiredDistance = 520;
      const chaseForce = bossChaseForce(tesla, dist > desiredDistance ? 92 : -64);
      const strafeForce = bossStrafeForce(tesla, dist < 940 ? 72 : 20);

      tesla.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      tesla.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

      if (dist < teslaLightningRange && hasClearShotAtElectricTarget(tesla, target)) {
        tesla.lightningWarmup = clamp((tesla.lightningWarmup || 0) + dt * 1.65, 0, 1);
        if (previousWarmup < 0.18 && tesla.lightningWarmup >= 0.18) {
          playSound("teslaWarmup", { throttleKey: "teslaWarmup:" + tesla.id, throttle: 0.7 });
        }
        if (tesla.shootCooldown <= 0 && tesla.lightningWarmup >= 1) {
          fireTeslaLightning(tesla, target, dist);
        }
      } else {
        tesla.lightningWarmup = Math.max(0, (tesla.lightningWarmup || 0) - dt * 1.8);
      }

      tesla.vx += Math.sin(performance.now() * 0.00082 + tesla.wobble) * 14 * dt;
      tesla.vy += Math.cos(performance.now() * 0.00077 + tesla.wobble) * 14 * dt;
      tesla.vx *= Math.pow(0.7, dt);
      tesla.vy *= Math.pow(0.7, dt);

      const speed = Math.hypot(tesla.vx, tesla.vy);
      const maxSpeed = bossChaseMaxSpeed(tesla, dist > 760 ? 176 : 138, nx, ny);
      if (speed > maxSpeed) {
        tesla.vx = (tesla.vx / speed) * maxSpeed;
        tesla.vy = (tesla.vy / speed) * maxSpeed;
      }

      tesla.x += tesla.vx * dt;
      tesla.y += tesla.vy * dt;
      tesla.lightningAngle = Math.atan2(ny, nx);
      tesla.rotation = tesla.lightningAngle + Math.PI / 2;
    }
  }
