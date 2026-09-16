  function updateRivals(dt) {
    for (let i = rivals.length - 1; i >= 0; i -= 1) {
      const rival = rivals[i];
      tickMobDamageTimers(rival, dt);
      rival.flash = Math.max(0, rival.flash - dt);

      if (rival.health <= 0) {
        rivals.splice(i, 1);
        continue;
      }
      if (isMobSummoning(rival)) {
        continue;
      }
      updateBossSpawnPressure(rival, dt);

      rival.shootCooldown = Math.max(0, rival.shootCooldown - dt);
      const bossAltReady = tickBossAltAttackCooldown(rival, dt);
      if (isMobDisabled(rival)) {
        updateDisabledMobDrift(rival, dt);
        continue;
      }

      if (updateSurvivalCampMobHome(rival, dt)) {
        continue;
      }

      if (rival.landed) {
        updateLandedRival(rival, dt);
        continue;
      }

      const target = combatTargetForMob(rival);
      if (!target) {
        updateFamiliarMob(rival, dt);
        continue;
      }
      const targetPlayer = target.player;
      const toPlayerX = targetPlayer.x - rival.x;
      const toPlayerY = targetPlayer.y - rival.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist > Math.max(width, height) * 2.4 + 1600) {
        const spawn = relocatedMobOffscreenPoint(150, 500, targetPlayer);
        rival.x = spawn.x;
        rival.y = spawn.y;
        rival.vx = randomRange(-16, 16);
        rival.vy = randomRange(-16, 16);
        rival.shootCooldown = randomRange(0.8, 2.2);
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * rival.strafeSign;
      const tangentY = nx * rival.strafeSign;
      const desiredDistance = 300;
      const chaseForce = bossChaseForce(rival, dist > desiredDistance ? 136 : -62);
      const strafeForce = bossStrafeForce(rival, dist < rivalShootRange ? 46 : 12);

      rival.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      rival.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

      if (dist < rivalShootRange && rival.shootCooldown <= 0 && hasClearShotAtCombatTarget(rival, target)) {
        fireRivalLaser(rival, target, dist);
      }
      if (bossAltReady && dist < rivalShootRange * 1.16 && hasClearShotAtCombatTarget(rival, target)) {
        fireAlienoidBossShotgunBlast(rival, target, dist);
      }

      rival.vx += Math.sin(performance.now() * 0.0006 + rival.wobble) * 8 * dt;
      rival.vy += Math.cos(performance.now() * 0.0005 + rival.wobble) * 8 * dt;
      rival.vx *= Math.pow(0.72, dt);
      rival.vy *= Math.pow(0.72, dt);

      const speed = Math.hypot(rival.vx, rival.vy);
      const maxSpeed = bossChaseMaxSpeed(rival, dist > 620 ? 275 : 190, nx, ny);
      if (speed > maxSpeed) {
        rival.vx = (rival.vx / speed) * maxSpeed;
        rival.vy = (rival.vy / speed) * maxSpeed;
      }

      rival.x += rival.vx * dt;
      rival.y += rival.vy * dt;
      rival.rotation = Math.atan2(ny, nx) + Math.PI / 2 + Math.sin(performance.now() * 0.002 + rival.wobble) * 0.08;
    }

    updateRivalProjectiles(dt);
  }

