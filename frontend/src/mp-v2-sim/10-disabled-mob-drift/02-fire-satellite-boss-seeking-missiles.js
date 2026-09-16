  function fireSatelliteBossSeekingMissiles(state, rocket, targetPlayer, seedHolder) {
    if (!rocket || !rocket.isBoss || !targetPlayer) {
      return;
    }
    const toTarget = normalize(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const baseAngle = Math.atan2(toTarget.y, toTarget.x);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 22;
    let firstProjectileId = 0;
    for (let i = 0; i < SATELLITE_BOSS_SEEKING_MISSILE_COUNT; i += 1) {
      const lineT = SATELLITE_BOSS_SEEKING_MISSILE_COUNT <= 1 ? 0 : i / (SATELLITE_BOSS_SEEKING_MISSILE_COUNT - 1) * 2 - 1;
      const angle = baseAngle + lineT * 0.46;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const sideX = -toTarget.y;
      const sideY = toTarget.x;
      const projectile = normalizeEntity({
        id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
        kind: "projectile",
        x: rocket.x + toTarget.x * muzzleDistance + sideX * lineT * 28,
        y: rocket.y + toTarget.y * muzzleDistance + sideY * lineT * 28,
        vx: dirX * SATELLITE_BOSS_SEEKING_MISSILE_SPEED + rocket.vx * 0.1,
        vy: dirY * SATELLITE_BOSS_SEEKING_MISSILE_SPEED + rocket.vy * 0.1,
        radius: 12,
        length: randomRange(seedHolder, 62, 80),
        color,
        life: SATELLITE_BOSS_SEEKING_MISSILE_LIFE,
        maxLife: SATELLITE_BOSS_SEEKING_MISSILE_LIFE,
        damage: bossScaledDamage(rocket, SATELLITE_MISSILE_DAMAGE * 0.82),
        toolDisable: 0,
        cause: "Satellite boss heat-seeking missile",
        ...playerTeamMobProjectileFields(rocket),
        rocket: true,
        heatSeeking: true,
        targetSpeed: SATELLITE_MISSILE_SPEED * 0.94,
        turnRate: SATELLITE_BOSS_SEEKING_MISSILE_TURN_RATE,
        targetPlayerId: targetPlayer.id || ""
      }, state.world.nextRivalProjectileId || 1, "projectile");
      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      if (!firstProjectileId) {
        firstProjectileId = projectile.id;
      }
    }
    rocket.blastTimer = 0.28;
    rocket.blastDirX = toTarget.x;
    rocket.blastDirY = toTarget.y;
    rocket.rotation = baseAngle + Math.PI / 2;
    rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.48);
    rocket.scanProgress = Math.max(0, finiteOr(rocket.scanProgress, 0) - 0.35);
    resetBossAltAttackCooldown(rocket, seedHolder);
    state.events.push({ type: "mob.shot", mobId: rocket.id, kind: "satellite", projectileId: firstProjectileId, attack: "alt", tick: state.tick });
  }

  function launchRocketBossSplitMinions(state, rocket, targetPlayer, seedHolder) {
    if (!state || !state.world || !rocket || !rocket.isBoss || !targetPlayer || !isMobBeaconReady(state.world, "rocket")) {
      return;
    }

    const aim = normalize(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const sideX = -aim.y;
    const sideY = aim.x;
    const collection = mobCollectionByKind(state.world, "rocket");
    let firstMobId = 0;

    for (const side of [-1, 1]) {
      const minion = createMob(
        state.world,
        "rocket",
        rocket.x + sideX * side * rocket.radius * 0.34,
        rocket.y + sideY * side * rocket.radius * 0.34,
        seedHolder,
        {}
      );
      minion.vx = finiteOr(rocket.vx, 0) * 0.18 + sideX * side * 280 + aim.x * 105;
      minion.vy = finiteOr(rocket.vy, 0) * 0.18 + sideY * side * 280 + aim.y * 105;
      minion.rotation = Math.atan2(sideY * side + aim.y * 0.28, sideX * side + aim.x * 0.28) + Math.PI / 2;
      minion.chargeCooldown = randomRange(seedHolder, 0.42, 0.72);
      minion.recoverTimer = randomRange(seedHolder, 0.18, 0.32);
      minion.chargeTimer = 0;
      minion.chargePower = 0;
      minion.chargeDirX = aim.x;
      minion.chargeDirY = aim.y;
      minion.blastTimer = 0.24;
      minion.summonAge = 0;
      minion.summonDuration = 0.22;
      minion.summonBaseRadius = 34;
      minion.summonSpinSpeed = side * 4.8;
      minion.radius = Math.max(1, 34 * 0.2);
      collection.push(minion);
      if (!firstMobId) {
        firstMobId = minion.id;
      }
    }

    rocket.blastTimer = Math.max(finiteOr(rocket.blastTimer, 0), 0.44);
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.56);
    resetBossAltAttackCooldown(rocket, seedHolder);
    state.events.push({ type: "mob.spawned", mobId: firstMobId, kind: "rocket", sourceMobId: rocket.id, attack: "rocketBossSplit", tick: state.tick });
  }

  function updateRocketShip(state, rocket, players, dt, seedHolder) {
    const playerInfo = nearestCombatPlayer(players, rocket);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = rocketAttackTarget(state, rocket, targetPlayer);
    const toTargetX = target.x - rocket.x;
    const toTargetY = target.y - rocket.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rocket.strafeSign;
    const tangentY = nx * rocket.strafeSign;
    const bossAltReady = tickBossAltAttackCooldown(rocket, dt, seedHolder);

    if (rocket.chargeTimer > 0) {
      rocket.chargeTimer = Math.max(0, rocket.chargeTimer - dt);
      const progress = 1 - clamp(rocket.chargeTimer / ROCKET_CHARGE_DURATION, 0, 1);
      rocket.chargePower = progress;
      rocket.vx += rocket.chargeDirX * (980 + progress * 2600) * dt;
      rocket.vy += rocket.chargeDirY * (980 + progress * 2600) * dt;
      rocket.vx *= Math.pow(0.985, dt);
      rocket.vy *= Math.pow(0.985, dt);
      if (rocket.chargeTimer <= 0) {
        rocket.recoverTimer = randomRange(seedHolder, 1.05, 1.42);
        rocket.chargeCooldown = randomRange(seedHolder, ROCKET_CHARGE_COOLDOWN_MIN, ROCKET_CHARGE_COOLDOWN_MAX);
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
    } else if (bossAltReady && rocket.isBoss && playerInfo.distance < 1280) {
      launchRocketBossSplitMinions(state, rocket, targetPlayer, seedHolder);
      rocket.vx += -nx * 120 * dt;
      rocket.vy += -ny * 120 * dt;
    } else {
      rocket.chargeCooldown = Math.max(0, finiteOr(rocket.chargeCooldown, 0) - dt);
      const rangeForce = bossChaseForce(rocket, dist > 820 ? 180 : dist < 540 ? -176 : 24);
      const strafeForce = bossStrafeForce(rocket, 92 + Math.sin(simTime(state) * 1.0 + rocket.wobble) * 16);
      rocket.vx += (nx * rangeForce + tangentX * strafeForce) * dt;
      rocket.vy += (ny * rangeForce + tangentY * strafeForce) * dt;
      rocket.vx *= Math.pow(0.72, dt);
      rocket.vy *= Math.pow(0.72, dt);
      const canCharge = dist > 360 && dist < 1220 && hasClearShotAtCombatTarget(state.world, rocket, target);
      if (rocket.chargeCooldown <= 0 && canCharge) {
        const leadTime = clamp(dist / ROCKET_CHARGE_MAX_SPEED, 0.15, 0.7);
        rocket.lockX = target.x + finiteOr(target.vx, 0) * leadTime * 0.72;
        rocket.lockY = target.y + finiteOr(target.vy, 0) * leadTime * 0.72;
        const aim = normalize(rocket.lockX - rocket.x, rocket.lockY - rocket.y);
        rocket.chargeDirX = aim.x;
        rocket.chargeDirY = aim.y;
        rocket.chargeTimer = ROCKET_CHARGE_DURATION * (rocket.isBoss ? 1.18 : 1);
        rocket.chargePower = 0;
        rocket.blastTimer = 0.46;
      }
    }

    rocket.blastTimer = Math.max(0, finiteOr(rocket.blastTimer, 0) - dt);
    const time = simTime(state);
    rocket.vx += Math.sin(time * 0.62 + rocket.wobble) * 5 * dt;
    rocket.vy += Math.cos(time * 0.58 + rocket.wobble) * 5 * dt;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const chargeProgress = clamp(rocket.chargePower || 0, 0, 1);
    const baseMaxSpeed = rocket.chargeTimer > 0 ? 330 + chargeProgress * (ROCKET_CHARGE_MAX_SPEED - 330) : rocket.recoverTimer > 0 ? 520 : 245;
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
    updateRocketPlayerImpact(state, rocket, targetPlayer, seedHolder);
    updateRocketStructureImpact(state, rocket, seedHolder);
    const facingX = rocket.chargeTimer > 0 ? rocket.chargeDirX : rocket.vx;
    const facingY = rocket.chargeTimer > 0 ? rocket.chargeDirY : rocket.vy;
    rocket.rotation = Math.atan2(facingY || targetPlayer.y - rocket.y, facingX || targetPlayer.x - rocket.x) + Math.PI / 2;
  }

  function updateSatellite(state, rocket, players, dt, seedHolder) {
    const playerInfo = nearestCombatPlayer(players, rocket);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = rocketAttackTarget(state, rocket, targetPlayer);
    const toTargetX = target.x - rocket.x;
    const toTargetY = target.y - rocket.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rocket.strafeSign;
    const tangentY = nx * rocket.strafeSign;
    const targetAngle = Math.atan2(ny, nx);
    const turn = shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle);
    rocket.scannerAngle = (rocket.scannerAngle || targetAngle) + clamp(turn, -2.35 * dt, 2.35 * dt);
    const bossAltReady = tickBossAltAttackCooldown(rocket, dt, seedHolder);

    if (bossAltReady && rocket.isBoss && playerInfo.distance < 1280) {
      fireSatelliteBossSeekingMissiles(state, rocket, targetPlayer, seedHolder);
    } else if (rocket.volleyShots > 0) {
      rocket.volleyTimer = Math.max(0, finiteOr(rocket.volleyTimer, 0) - dt);
      const volleyRetreatForce = bossChaseForce(rocket, 42);
      const volleyStrafeForce = bossStrafeForce(rocket, 24);
      rocket.vx += -nx * volleyRetreatForce * dt + tangentX * volleyStrafeForce * dt;
      rocket.vy += -ny * volleyRetreatForce * dt + tangentY * volleyStrafeForce * dt;
      if (rocket.volleyTimer <= 0) {
        fireRocketMissile(state, rocket, target, seedHolder);
        rocket.volleyShots -= 1;
        rocket.volleyTimer = rocket.volleyShots > 0 ? SATELLITE_VOLLEY_SPACING : 0;
        if (rocket.volleyShots <= 0) {
          rocket.recoverTimer = randomRange(seedHolder, 0.86, 1.18);
          rocket.scanProgress = 0;
        }
      }
    } else if (rocket.lockTimer > 0) {
      rocket.lockTimer = Math.max(0, finiteOr(rocket.lockTimer, 0) - dt);
      rocket.vx *= Math.pow(0.16, dt);
      rocket.vy *= Math.pow(0.16, dt);
      const lockStrafeForce = bossStrafeForce(rocket, 18);
      const lockRetreatForce = bossChaseForce(rocket, 18);
      rocket.vx += tangentX * lockStrafeForce * dt - nx * lockRetreatForce * dt;
      rocket.vy += tangentY * lockStrafeForce * dt - ny * lockRetreatForce * dt;
      if (rocket.lockTimer <= 0) {
        rocket.volleyShots = SATELLITE_VOLLEY_COUNT;
        rocket.volleyTimer = 0.01;
      }
    } else if (rocket.recoverTimer > 0) {
      rocket.recoverTimer = Math.max(0, finiteOr(rocket.recoverTimer, 0) - dt);
      rocket.scanProgress = Math.max(0, finiteOr(rocket.scanProgress, 0) - dt * 1.1);
      const recoverForce = bossChaseForce(rocket, 72);
      const recoverStrafeForce = bossStrafeForce(rocket, 28);
      rocket.vx += -nx * recoverForce * dt + tangentX * recoverStrafeForce * dt;
      rocket.vy += -ny * recoverForce * dt + tangentY * recoverStrafeForce * dt;
      rocket.vx *= Math.pow(0.52, dt);
      rocket.vy *= Math.pow(0.52, dt);
    } else {
      const scanTurn = Math.abs(shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle));
      const inRange = dist > 420 && dist < 1040;
      const scanning = inRange && scanTurn < 0.34 && hasClearShotAtCombatTarget(state.world, rocket, target);
      rocket.scanProgress = clamp(finiteOr(rocket.scanProgress, 0) + (scanning ? dt * 0.86 : -dt * 1.05), 0, 1);
      const rangeForce = bossChaseForce(rocket, dist > 760 ? 132 : dist < 540 ? -128 : 12);
      const strafeForce = bossStrafeForce(rocket, 76 + rocket.scanProgress * 36);
      rocket.vx += nx * rangeForce * dt + tangentX * strafeForce * dt;
      rocket.vy += ny * rangeForce * dt + tangentY * strafeForce * dt;
      if (rocket.scanProgress >= 1) {
        rocket.lockX = target.x + finiteOr(target.vx, 0) * 0.46;
        rocket.lockY = target.y + finiteOr(target.vy, 0) * 0.46;
        rocket.lockTimer = SATELLITE_LOCK_DURATION;
        rocket.scanProgress = 1;
      }
    }

    const time = simTime(state);
    rocket.vx += Math.sin(time * 0.48 + rocket.wobble) * 6 * dt;
    rocket.vy += Math.cos(time * 0.44 + rocket.wobble) * 6 * dt;
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
    updateRocketPlayerImpact(state, rocket, targetPlayer, seedHolder);
    updateRocketStructureImpact(state, rocket, seedHolder);
    const aimX = Number.isFinite(rocket.lockX) ? rocket.lockX : target.x;
    const aimY = Number.isFinite(rocket.lockY) ? rocket.lockY : target.y;
    const aimAngle = rocket.volleyShots > 0 || rocket.lockTimer > 0 ? Math.atan2(aimY - rocket.y, aimX - rocket.x) : rocket.scannerAngle || targetAngle;
    rocket.rotation = aimAngle + Math.PI / 2;
  }

  function updateRocketMob(state, rocket, players, dt, seedHolder) {
    rocket.impactCooldown = Math.max(0, finiteOr(rocket.impactCooldown, 0) - dt);
    rocket.blastTimer = Math.max(0, finiteOr(rocket.blastTimer, 0) - dt);
    if (rocket.kind === "satellite") {
      updateSatellite(state, rocket, players, dt, seedHolder);
    } else {
      updateRocketShip(state, rocket, players, dt, seedHolder);
    }
  }

  function fireFighterGuns(state, fighter, target, dist, seedHolder) {
    const leadTime = clamp(dist / RIVAL_PROJECTILE_SPEED, 0, 1.15);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.62;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.62;
    const aim = normalize(targetX - fighter.x, targetY - fighter.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const color = shadeColor(fighter.color, 46);
    for (const side of (fighter.isBoss ? [-1.45, 0, 1.45] : [-1, 1])) {
      const projectile = normalizeEntity({
        id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
        kind: "projectile",
        x: fighter.x + aim.x * (fighter.radius + 16) + normalX * side * 19,
        y: fighter.y + aim.y * (fighter.radius + 16) + normalY * side * 19,
        vx: aim.x * (RIVAL_PROJECTILE_SPEED + 60) + fighter.vx * 0.14,
        vy: aim.y * (RIVAL_PROJECTILE_SPEED + 60) + fighter.vy * 0.14,
        radius: 5,
        length: randomRange(seedHolder, 38, 50),
        color,
        life: 2.18,
        maxLife: 2.18,
        damage: bossScaledDamage(fighter, 9),
        toolDisable: 0,
        cause: fighter.isBoss ? "Fighter boss cannon" : "Fighter cannon",
        ...playerTeamMobProjectileFields(fighter),
        targetPlayerId: target.player ? target.player.id : ""
      }, state.world.nextRivalProjectileId || 1, "projectile");
      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      state.events.push({ type: "mob.shot", mobId: fighter.id, kind: "fighter", projectileId: projectile.id, tick: state.tick });
    }
    fighter.shootCooldown = randomRange(seedHolder, 2.2, 3.4) * (fighter.isBoss ? 0.68 : 1);
    fighter.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
  }

  function fireFighterBossMachineGunShot(state, fighter, target, dist, seedHolder) {
    const leadTime = clamp(dist / (RIVAL_PROJECTILE_SPEED + 180), 0, 0.9);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.58;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.58;
    const baseAngle = Math.atan2(targetY - fighter.y, targetX - fighter.x);
    const aimAngle = baseAngle + randomRange(seedHolder, -0.075, 0.075);
    const aimX = Math.cos(aimAngle);
    const aimY = Math.sin(aimAngle);
    const normalX = -aimY;
    const normalY = aimX;
    const side = Math.floor(finiteOr(fighter.machineGunShots, 0)) % 2 === 0 ? -1 : 1;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: fighter.x + aimX * (fighter.radius + 18) + normalX * side * 18,
      y: fighter.y + aimY * (fighter.radius + 18) + normalY * side * 18,
      vx: aimX * (RIVAL_PROJECTILE_SPEED + randomRange(seedHolder, 150, 235)) + fighter.vx * 0.12,
      vy: aimY * (RIVAL_PROJECTILE_SPEED + randomRange(seedHolder, 150, 235)) + fighter.vy * 0.12,
      radius: 4,
      length: randomRange(seedHolder, 30, 40),
      color: shadeColor(fighter.color, 64),
      life: 1.7,
      maxLife: 1.7,
      damage: bossScaledDamage(fighter, 5.5),
      toolDisable: 0,
      cause: "Fighter boss machine gun",
      ...playerTeamMobProjectileFields(fighter),
      targetPlayerId: target.player ? target.player.id : ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    state.events.push({ type: "mob.shot", mobId: fighter.id, kind: "fighter", projectileId: projectile.id, attack: "machine-gun", tick: state.tick });
    fighter.rotation = aimAngle + Math.PI / 2;
  }

  function updateFighter(state, fighter, players, dt, seedHolder) {
    fighter.shootCooldown = Math.max(0, finiteOr(fighter.shootCooldown, 0) - dt);
    fighter.machineGunTimer = Math.max(0, finiteOr(fighter.machineGunTimer, 0) - dt);
    if (fighter.shieldActive > 0) {
      const before = fighter.shieldActive;
      fighter.shieldActive = Math.max(0, fighter.shieldActive - dt);
      fighter.shieldCharge = Math.max(0, fighter.shieldCharge - Math.min(dt, before));
      fighter.shieldRecharge = FIGHTER_SHIELD_CYCLE;
    } else if (fighter.shieldCharge < FIGHTER_SHIELD_MAX_CHARGE) {
      fighter.shieldRecharge = Math.max(0, finiteOr(fighter.shieldRecharge, 0) - dt);
      if (fighter.shieldRecharge <= 0) {
        fighter.shieldCharge = FIGHTER_SHIELD_MAX_CHARGE;
      }
    }

    const targetInfo = nearestCombatPlayer(players, fighter);
    const targetPlayer = targetInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = playerTarget(targetPlayer);
    const toPlayerX = target.x - fighter.x;
    const toPlayerY = target.y - fighter.y;
    const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
    const nx = toPlayerX / dist;
    const ny = toPlayerY / dist;
    const tangentX = -ny * fighter.strafeSign;
    const tangentY = nx * fighter.strafeSign;
    const chaseForce = bossChaseForce(fighter, dist > 560 ? 110 : -62);
    const strafeForce = bossStrafeForce(fighter, dist < 1050 ? 78 : 24);
    fighter.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    fighter.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    const bossAltReady = tickBossAltAttackCooldown(fighter, dt, seedHolder);
    const clearShot = hasClearShotAtCombatTarget(state.world, fighter, target);
    if (fighter.isBoss && finiteOr(fighter.machineGunShots, 0) > 0) {
      if (fighter.machineGunTimer <= 0 && dist < FIGHTER_SHOOT_RANGE * 1.32 && clearShot) {
        fireFighterBossMachineGunShot(state, fighter, target, dist, seedHolder);
        fighter.machineGunShots = Math.max(0, Math.floor(finiteOr(fighter.machineGunShots, 0)) - 1);
        fighter.machineGunTimer = fighter.machineGunShots > 0 ? 0.065 : 0;
      } else if (!clearShot || dist >= FIGHTER_SHOOT_RANGE * 1.48) {
        fighter.machineGunShots = 0;
      }
    } else if (bossAltReady && fighter.isBoss && dist < FIGHTER_SHOOT_RANGE * 1.25 && clearShot) {
      fighter.machineGunShots = 16;
      fighter.machineGunTimer = 0;
      fighter.shootCooldown = Math.max(fighter.shootCooldown, 1.2);
      resetBossAltAttackCooldown(fighter, seedHolder);
    } else if (dist < FIGHTER_SHOOT_RANGE && fighter.shootCooldown <= 0 && clearShot) {
      fireFighterGuns(state, fighter, target, dist, seedHolder);
    }
    const time = simTime(state);
    fighter.vx += Math.sin(time * 0.52 + fighter.wobble) * 9 * dt;
    fighter.vy += Math.cos(time * 0.47 + fighter.wobble) * 9 * dt;
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
