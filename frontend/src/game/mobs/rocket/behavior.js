  function launchRocketBossSplitMinions(rocket, targetPlayer) {
    if (!rocket || !rocket.isBoss || !targetPlayer || !isMobBeaconReady("rocket")) {
      return;
    }

    const aim = normalize(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const sideX = -aim.y;
    const sideY = aim.x;

    for (const side of [-1, 1]) {
      const minion = createRocket(
        rocket.x + sideX * side * rocket.radius * 0.34,
        rocket.y + sideY * side * rocket.radius * 0.34,
        {
          vx: finiteOr(rocket.vx, 0) * 0.18 + sideX * side * 280 + aim.x * 105,
          vy: finiteOr(rocket.vy, 0) * 0.18 + sideY * side * 280 + aim.y * 105,
          rotation: Math.atan2(sideY * side + aim.y * 0.28, sideX * side + aim.x * 0.28) + Math.PI / 2,
          chargeCooldown: randomRange(0.42, 0.72),
          recoverTimer: randomRange(0.18, 0.32),
          chargeTimer: 0,
          chargePower: 0,
          chargeDirX: aim.x,
          chargeDirY: aim.y,
          blastTimer: 0.24,
          summonAge: 0,
          summonDuration: 0.22,
          summonBaseRadius: mobEntityBlueprints.rocket.radius,
          summonSpinSpeed: side * 4.8
        }
      );
      minion.radius = Math.max(1, mobEntityBlueprints.rocket.radius * 0.2);
      rockets.push(minion);
    }

    rocket.blastTimer = Math.max(finiteOr(rocket.blastTimer, 0), 0.44);
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.56);
    resetBossAltAttackCooldown(rocket);
    sparks.push({
      x: rocket.x,
      y: rocket.y,
      radius: rocket.radius * 1.6,
      color: rocket.color,
      life: 0.32,
      maxLife: 0.32,
      summonTelegraph: true
    });
    playSound("missile", { throttleKey: "rocketBossSplit", throttle: 0.3 });
  }

  function updateRocketShip(rocket, dt) {
    const playerTarget = combatTargetForMob(rocket);
    if (!playerTarget) {
      updateFamiliarMob(rocket, dt);
      return;
    }
    const target = rocketAttackTarget(rocket, playerTarget);
    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    const toTargetX = target.x - rocket.x;
    const toTargetY = target.y - rocket.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;

    if (dist > Math.max(width, height) * 2.9 + 2400) {
      const spawn = relocatedMobOffscreenPoint(320, 900, targetPlayer);
      rocket.x = spawn.x;
      rocket.y = spawn.y;
      rocket.vx = randomRange(-24, 24);
      rocket.vy = randomRange(-24, 24);
      rocket.chargeCooldown = randomRange(0.65, 1.35);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.recoverTimer = 0;
      rocket.impactCooldown = 0;
      continueRocketFromDifferentSide(rocket);
      return;
    }

    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rocket.strafeSign;
    const tangentY = nx * rocket.strafeSign;
    const bossAltReady = tickBossAltAttackCooldown(rocket, dt);

    if (rocket.chargeTimer > 0) {
      rocket.chargeTimer = Math.max(0, rocket.chargeTimer - dt);
      const progress = 1 - clamp(rocket.chargeTimer / rocketChargeDuration, 0, 1);
      rocket.chargePower = progress;
      rocket.vx += rocket.chargeDirX * (980 + progress * 2600) * dt;
      rocket.vy += rocket.chargeDirY * (980 + progress * 2600) * dt;
      rocket.vx *= Math.pow(0.985, dt);
      rocket.vy *= Math.pow(0.985, dt);

      if (rocket.chargeTimer <= 0) {
        rocket.recoverTimer = randomRange(1.05, 1.42);
        rocket.chargeCooldown = randomRange(rocketChargeCooldownMin, rocketChargeCooldownMax);
        rocket.chargePower = 0;
        continueRocketFromDifferentSide(rocket);
      }
    } else if (rocket.recoverTimer > 0) {
      rocket.recoverTimer = Math.max(0, rocket.recoverTimer - dt);
      const recoverForce = bossChaseForce(rocket, 88);
      const recoverStrafeForce = bossStrafeForce(rocket, 64);
      rocket.vx += (-nx * recoverForce + tangentX * recoverStrafeForce) * dt;
      rocket.vy += (-ny * recoverForce + tangentY * recoverStrafeForce) * dt;
      rocket.vx *= Math.pow(0.76, dt);
      rocket.vy *= Math.pow(0.76, dt);
    } else if (bossAltReady && rocket.isBoss && Math.hypot(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y) < 1280) {
      launchRocketBossSplitMinions(rocket, targetPlayer);
      rocket.vx += -nx * 120 * dt;
      rocket.vy += -ny * 120 * dt;
    } else {
      rocket.chargeCooldown = Math.max(0, finiteOr(rocket.chargeCooldown, 0) - dt);
      const rangeForce = bossChaseForce(rocket, dist > 820 ? 180 : dist < 540 ? -176 : 24);
      const strafeForce = bossStrafeForce(rocket, 92 + Math.sin(performance.now() * 0.001 + rocket.wobble) * 16);
      rocket.vx += (nx * rangeForce + tangentX * strafeForce) * dt;
      rocket.vy += (ny * rangeForce + tangentY * strafeForce) * dt;
      rocket.vx *= Math.pow(0.72, dt);
      rocket.vy *= Math.pow(0.72, dt);

      const canCharge = dist > 360 && dist < 1220 && hasClearShotAtRocketTarget(rocket, target);
      if (rocket.chargeCooldown <= 0 && canCharge) {
        const leadTime = clamp(dist / rocketChargeMaxSpeed, 0.15, 0.7);
        rocket.lockX = target.x + finiteOr(target.vx, 0) * leadTime * 0.72;
        rocket.lockY = target.y + finiteOr(target.vy, 0) * leadTime * 0.72;
        const aim = normalize(rocket.lockX - rocket.x, rocket.lockY - rocket.y);
        rocket.chargeDirX = aim.x;
        rocket.chargeDirY = aim.y;
        rocket.chargeTimer = rocketChargeDuration * (rocket.isBoss ? 1.18 : 1);
        rocket.chargePower = 0;
        rocket.blastTimer = 0.46;
      }
    }

    rocket.blastTimer = Math.max(0, finiteOr(rocket.blastTimer, 0) - dt);
    rocket.vx += Math.sin(performance.now() * 0.00062 + rocket.wobble) * 5 * dt;
    rocket.vy += Math.cos(performance.now() * 0.00058 + rocket.wobble) * 5 * dt;

    const speed = Math.hypot(rocket.vx, rocket.vy);
    const chargeProgress = clamp(rocket.chargePower || 0, 0, 1);
    const baseMaxSpeed = rocket.chargeTimer > 0
      ? 330 + chargeProgress * (rocketChargeMaxSpeed - 330)
      : rocket.recoverTimer > 0
        ? 520
        : 245;
    const maxSpeed = bossChaseMaxSpeed(
      rocket,
      baseMaxSpeed,
      rocket.chargeTimer > 0 ? rocket.chargeDirX : nx,
      rocket.chargeTimer > 0 ? rocket.chargeDirY : ny
    );
    if (speed > maxSpeed) {
      rocket.vx = (rocket.vx / speed) * maxSpeed;
      rocket.vy = (rocket.vy / speed) * maxSpeed;
    }

    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;
    updateRocketPlayerImpact(rocket, playerTarget);
    updateRocketStructureImpact(rocket);

    const facingX = rocket.chargeTimer > 0 ? rocket.chargeDirX : rocket.vx;
    const facingY = rocket.chargeTimer > 0 ? rocket.chargeDirY : rocket.vy;
    rocket.rotation = Math.atan2(facingY || targetPlayer.y - rocket.y, facingX || targetPlayer.x - rocket.x) + Math.PI / 2;
  }

  function continueRocketFromDifferentSide(rocket) {
    rocket.strafeSign = rocket.strafeSign < 0 ? 1 : -1;
  }

  function updateRockets(dt) {
    for (let i = rockets.length - 1; i >= 0; i -= 1) {
      const rocket = rockets[i];
      tickMobDamageTimers(rocket, dt);
      rocket.flash = Math.max(0, rocket.flash - dt);
      rocket.impactCooldown = Math.max(0, rocket.impactCooldown - dt);
      rocket.blastTimer = Math.max(0, rocket.blastTimer - dt);

      if (rocket.health <= 0) {
        rockets.splice(i, 1);
        continue;
      }
      if (isMobSummoning(rocket)) {
        continue;
      }
      updateBossSpawnPressure(rocket, dt);
      if (isMobDisabled(rocket)) {
        rocket.lockTimer = 0;
        rocket.volleyTimer = 0;
        rocket.volleyShots = 0;
        rocket.scanProgress = 0;
        rocket.chargeTimer = 0;
        rocket.chargePower = 0;
        updateDisabledMobDrift(rocket, dt);
        continue;
      }

      if (updateSurvivalCampMobHome(rocket, dt)) {
        continue;
      }

      if (rocket.kind !== "satellite") {
        updateRocketShip(rocket, dt);
        continue;
      }

      const playerTarget = combatTargetForMob(rocket);
      if (!playerTarget) {
        updateFamiliarMob(rocket, dt);
        continue;
      }
      const target = rocketAttackTarget(rocket, playerTarget);
      const targetPlayer = playerTarget.player;
      const toPlayerX = target.x - rocket.x;
      const toPlayerY = target.y - rocket.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const bossAltReady = tickBossAltAttackCooldown(rocket, dt);

      if (dist > Math.max(width, height) * 2.7 + 2000) {
        const spawn = relocatedMobOffscreenPoint(230, 680, targetPlayer);
        rocket.x = spawn.x;
        rocket.y = spawn.y;
        rocket.vx = randomRange(-14, 14);
        rocket.vy = randomRange(-14, 14);
        rocket.scanProgress = 0;
        rocket.lockTimer = 0;
        rocket.blastTimer = 0;
        rocket.volleyTimer = 0;
        rocket.volleyShots = 0;
        rocket.recoverTimer = 0;
        continue;
      }

      const nx = toPlayerX / dist;
      const ny = toPlayerY / dist;
      const tangentX = -ny * rocket.strafeSign;
      const tangentY = nx * rocket.strafeSign;
      const targetAngle = Math.atan2(ny, nx);
      const turn = shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle);
      rocket.scannerAngle = (rocket.scannerAngle || targetAngle) + clamp(turn, -2.35 * dt, 2.35 * dt);

      if (bossAltReady && rocket.isBoss && Math.hypot(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y) < 1280) {
        fireSatelliteBossSeekingMissiles(rocket, playerTarget);
      } else if (rocket.volleyShots > 0) {
        rocket.volleyTimer -= dt;
        const volleyRetreatForce = bossChaseForce(rocket, 42);
        const volleyStrafeForce = bossStrafeForce(rocket, 24);
        rocket.vx += -nx * volleyRetreatForce * dt + tangentX * volleyStrafeForce * dt;
        rocket.vy += -ny * volleyRetreatForce * dt + tangentY * volleyStrafeForce * dt;

        if (rocket.volleyTimer <= 0) {
          fireRocketMissile(rocket, target);
          rocket.volleyShots -= 1;
          rocket.volleyTimer = rocket.volleyShots > 0 ? satelliteVolleySpacing : 0;
          if (rocket.volleyShots <= 0) {
            rocket.recoverTimer = randomRange(0.86, 1.18);
            rocket.scanProgress = 0;
          }
        }
      } else if (rocket.lockTimer > 0) {
        rocket.lockTimer -= dt;
        rocket.vx *= Math.pow(0.16, dt);
        rocket.vy *= Math.pow(0.16, dt);
        const lockStrafeForce = bossStrafeForce(rocket, 18);
        const lockRetreatForce = bossChaseForce(rocket, 18);
        rocket.vx += tangentX * lockStrafeForce * dt - nx * lockRetreatForce * dt;
        rocket.vy += tangentY * lockStrafeForce * dt - ny * lockRetreatForce * dt;
        if (rocket.lockTimer <= 0) {
          rocket.volleyShots = satelliteVolleyCount;
          rocket.volleyTimer = 0.01;
        }
      } else if (rocket.recoverTimer > 0) {
        rocket.recoverTimer -= dt;
        rocket.scanProgress = Math.max(0, rocket.scanProgress - dt * 1.1);
        const recoverForce = bossChaseForce(rocket, 72);
        const recoverStrafeForce = bossStrafeForce(rocket, 28);
        rocket.vx += -nx * recoverForce * dt + tangentX * recoverStrafeForce * dt;
        rocket.vy += -ny * recoverForce * dt + tangentY * recoverStrafeForce * dt;
        rocket.vx *= Math.pow(0.52, dt);
        rocket.vy *= Math.pow(0.52, dt);
      } else {
        const scanTurn = Math.abs(shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle));
        const inRange = dist > 420 && dist < 1040;
        const scanning = inRange && scanTurn < 0.34 && hasClearShotAtRocketTarget(rocket, target);
        const previousScanProgress = rocket.scanProgress || 0;
        rocket.scanProgress = clamp(rocket.scanProgress + (scanning ? dt * 0.86 : -dt * 1.05), 0, 1);

        const rangeForce = bossChaseForce(rocket, dist > 760 ? 132 : dist < 540 ? -128 : 12);
        const strafeForce = bossStrafeForce(rocket, 76 + rocket.scanProgress * 36);
        rocket.vx += nx * rangeForce * dt + tangentX * strafeForce * dt;
        rocket.vy += ny * rangeForce * dt + tangentY * strafeForce * dt;

        if (rocket.scanProgress >= 1) {
          rocket.lockX = target.x + finiteOr(target.vx, 0) * 0.46;
          rocket.lockY = target.y + finiteOr(target.vy, 0) * 0.46;
          rocket.lockTimer = satelliteLockDuration;
          rocket.scanProgress = 1;
          if (previousScanProgress < 1) {
            playSound("satelliteLock", { throttleKey: "satelliteLock:" + rocket.id, throttle: 0.58 });
          }
        }
      }

      rocket.vx += Math.sin(performance.now() * 0.00048 + rocket.wobble) * 6 * dt;
      rocket.vy += Math.cos(performance.now() * 0.00044 + rocket.wobble) * 6 * dt;
      rocket.vx *= Math.pow(0.7, dt);
      rocket.vy *= Math.pow(0.7, dt);

      const speed = Math.hypot(rocket.vx, rocket.vy);
      const maxSpeed = bossChaseMaxSpeed(rocket, rocket.volleyShots > 0 || rocket.lockTimer > 0 ? 118 : rocket.recoverTimer > 0 ? 152 : 194, nx, ny);
      if (speed > maxSpeed) {
        rocket.vx = (rocket.vx / speed) * maxSpeed;
        rocket.vy = (rocket.vy / speed) * maxSpeed;
      }

      rocket.x += rocket.vx * dt;
      rocket.y += rocket.vy * dt;
      updateRocketPlayerImpact(rocket, playerTarget);
      updateRocketStructureImpact(rocket);
      const aimX = Number.isFinite(rocket.lockX) ? rocket.lockX : target.x;
      const aimY = Number.isFinite(rocket.lockY) ? rocket.lockY : target.y;
      const aimAngle = rocket.volleyShots > 0 || rocket.lockTimer > 0
        ? Math.atan2(aimY - rocket.y, aimX - rocket.x)
        : rocket.scannerAngle || targetAngle;
      rocket.rotation = aimAngle + Math.PI / 2;
    }
  }

