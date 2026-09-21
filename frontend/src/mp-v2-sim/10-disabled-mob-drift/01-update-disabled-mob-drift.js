  function updateDisabledMobDrift(state, mob, dt) {
    mob.vx *= Math.pow(0.42, dt);
    mob.vy *= Math.pow(0.42, dt);
    mob.x += finiteOr(mob.vx, 0) * dt;
    mob.y += finiteOr(mob.vy, 0) * dt;
    mob.lightningWarmup = 0;
    mob.scanProgress = 0;
    mob.shieldActive = 0;
    mob.rotation = finiteOr(mob.rotation, 0) + Math.sin(simTime(state) * 3 + finiteOr(mob.wobble, 0)) * 0.08 * dt;
  }

  function applyEmpPulse(state, x, y, radius, duration, options) {
    const settings = options && typeof options === "object" ? options : {};
    const world = state && state.world;
    const color = cloneColor(settings.color || { r: 126, g: 232, b: 255 });
    const range = Math.max(1, finiteOr(radius, EMP_PULSE_RANGE));
    const disableDuration = Math.max(0, finiteOr(duration, EMP_PULSE_DISABLE_DURATION));
    let affected = 0;

    if (world && settings.affectMobs !== false) {
      for (const mob of allCombatMobs(world)) {
        if (!mob || mob === settings.sourceMob || finiteOr(mob.health, 0) <= 0 || isPlayerTeamMob(mob)) {
          continue;
        }
        const distance = Math.hypot(mob.x - x, mob.y - y);
        if (distance <= range + finiteOr(mob.radius, 0) * 0.75 && disableMob(mob, disableDuration)) {
          const away = normalize(mob.x - x, mob.y - y);
          knockMob(mob, away.x, away.y, 95);
          affected += 1;
        }
      }
    }

    if (world && settings.affectStructures) {
      for (const structure of world.structures || []) {
        if (
          !structure ||
          finiteOr(structure.health, 0) <= 0 ||
          settings.sourceMob && !isPlayerTeamMob(settings.sourceMob) && isMobOwnedStructure(structure)
        ) {
          continue;
        }
        const distance = Math.hypot(structure.x - x, structure.y - y);
        if (distance <= range + structureHitRadius(structure)) {
          disableStructure(state, structure, disableDuration, settings.cause || "EMP pulse");
          affected += 1;
        }
      }
    }

    if (settings.affectPlayers) {
      for (const target of Object.values(state.players || {})) {
        if (!target || finiteOr(target.health, 0) <= 0 || target.spacecraftInterior) {
          continue;
        }
        const distance = Math.hypot(target.x - x, target.y - y);
        if (distance <= range + finiteOr(target.radius, PLAYER_RADIUS)) {
          const away = normalize(target.x - x, target.y - y);
          applyPlayerStatusEffect(target, "disabled", disableDuration);
          target.vx += away.x * 180;
          target.vy += away.y * 180;
          affected += 1;
        }
      }
    }

    state.events.push({
      type: "emp.pulse",
      x,
      y,
      radius: range,
      duration: disableDuration,
      affected,
      sourcePlayerId: settings.sourcePlayerId || "",
      sourceMobId: settings.sourceMob ? settings.sourceMob.id : 0,
      sourceKind: settings.sourceKind || "",
      cause: settings.cause || "EMP pulse",
      color,
      tick: state.tick
    });
    return affected;
  }

  function findEngineerHealTarget(world, engineer) {
    let best = null;
    let bestScore = Infinity;
    const healPlayerTeam = isPlayerTeamMob(engineer);
    for (const mob of allCombatMobs(world)) {
      if (mob === engineer || mob.kind === "engineer" || mob.health <= 0 || mob.health >= mob.maxHealth || isPlayerTeamMob(mob) !== healPlayerTeam) {
        continue;
      }
      const distance = Math.hypot(mob.x - engineer.x, mob.y - engineer.y);
      const missing = Math.max(0, mob.maxHealth - mob.health);
      const score = distance - missing * 2.7;
      if (distance < ENGINEER_HEAL_RANGE * 1.45 && score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }
    return best;
  }

  function randomEngineerBossSummonKind(seedHolder) {
    const world = seedHolder && seedHolder.world;
    const options = MOB_TIER_ORDER.filter((kind) => kind !== "engineer" && (!world || isMobBeaconReady(world, kind)));
    if (!options.length) {
      return "";
    }
    return options[Math.floor(randomRange(seedHolder, 0, options.length))] || "";
  }

  function summonEngineerBossMob(state, engineer, targetPlayer, seedHolder) {
    if (!state || !state.world || !engineer || !engineer.isBoss) {
      return false;
    }
    const summonSeed = { seed: seedHolder.seed, world: state.world };
    const kind = randomEngineerBossSummonKind(summonSeed);
    seedHolder.seed = summonSeed.seed;
    if (!kind) {
      return false;
    }
    const angleToTarget = targetPlayer ? Math.atan2(targetPlayer.y - engineer.y, targetPlayer.x - engineer.x) : randomRange(seedHolder, 0, Math.PI * 2);
    const angle = angleToTarget + randomRange(seedHolder, -0.95, 0.95);
    const distance = randomRange(seedHolder, 185, 315);
    const x = engineer.x + Math.cos(angle) * distance + randomRange(seedHolder, -42, 42);
    const y = engineer.y + Math.sin(angle) * distance + randomRange(seedHolder, -42, 42);
    const mob = createMob(state.world, kind, x, y, seedHolder, {
      summonAge: 0,
      summonDuration: ENGINEER_BOSS_SUMMON_DURATION,
      summonSpinSpeed: randomRange(seedHolder, 7.5, 11.5) * (randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1)
    });
    mob.summonBaseRadius = Math.max(1, finiteOr(mob.radius, 28));
    mob.radius = 0;
    mob.vx += finiteOr(engineer.vx, 0) * 0.12;
    mob.vy += finiteOr(engineer.vy, 0) * 0.12;
    mobCollectionByKind(state.world, kind).push(mob);
    resetBossAltAttackCooldown(engineer, seedHolder);
    state.events.push({
      type: "engineerBoss.summon",
      mobId: mob.id,
      kind,
      x,
      y,
      radius: ENGINEER_BOSS_SUMMON_RADIUS,
      color: cloneColor(mob.color || engineer.color),
      tick: state.tick
    });
    return true;
  }

  function updateEngineer(state, engineer, players, dt, seedHolder) {
    engineer.healCooldown = Math.max(0, finiteOr(engineer.healCooldown, 0) - dt);
    engineer.healPulse = Math.max(0, finiteOr(engineer.healPulse, 0) - dt);
    const playerInfo = nearestCombatPlayer(players, engineer);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const bossAltReady = tickBossAltAttackCooldown(engineer, dt, seedHolder);
    if (bossAltReady && playerInfo.distance < 1180) {
      summonEngineerBossMob(state, engineer, targetPlayer, seedHolder);
    }
    const healTarget = findEngineerHealTarget(state.world, engineer);
    const focusX = healTarget ? healTarget.x : targetPlayer.x;
    const focusY = healTarget ? healTarget.y : targetPlayer.y;
    const toFocusX = focusX - engineer.x;
    const toFocusY = focusY - engineer.y;
    const focusDist = Math.hypot(toFocusX, toFocusY) || 1;
    const nx = toFocusX / focusDist;
    const ny = toFocusY / focusDist;
    const tangentX = -ny * engineer.strafeSign;
    const tangentY = nx * engineer.strafeSign;

    if (healTarget) {
      const desiredDistance = 260;
      const chaseForce = bossChaseForce(engineer, focusDist > desiredDistance ? 116 : -34);
      const strafeForce = bossStrafeForce(engineer, 34);
      engineer.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      engineer.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
      if (
        focusDist < ENGINEER_HEAL_RANGE &&
        engineer.healCooldown <= 0 &&
        !projectileBlockedBySolidBody(state.world, engineer.x, engineer.y, healTarget.x, healTarget.y, Math.max(4, healTarget.radius * 0.14))
      ) {
        const healed = Math.min(healTarget.maxHealth - healTarget.health, bossScaledDamage(engineer, ENGINEER_HEAL_RATE));
        if (healed > 0) {
          healTarget.health += healed;
          healTarget.flash = Math.max(finiteOr(healTarget.flash, 0), 0.12);
          engineer.healPulse = 0.38;
          engineer.repairBeamAngle = Math.atan2(healTarget.y - engineer.y, healTarget.x - engineer.x);
          engineer.targetKind = healTarget.kind;
          engineer.targetId = healTarget.id;
          state.events.push({ type: "mob.repaired", mobId: healTarget.id, kind: healTarget.kind, engineerId: engineer.id, tick: state.tick });
        }
        engineer.healCooldown = ENGINEER_HEAL_COOLDOWN;
      }
    } else {
      const awayX = engineer.x - targetPlayer.x;
      const awayY = engineer.y - targetPlayer.y;
      const awayDist = Math.hypot(awayX, awayY) || 1;
      const keepAway = playerInfo.distance < 520 ? 90 : -18;
      const evadeForce = bossChaseForce(engineer, keepAway);
      const strafeForce = bossStrafeForce(engineer, 22);
      engineer.vx += (awayX / awayDist) * evadeForce * dt + tangentX * strafeForce * dt;
      engineer.vy += (awayY / awayDist) * evadeForce * dt + tangentY * strafeForce * dt;
      engineer.targetKind = "";
      engineer.targetId = 0;
    }

    const time = simTime(state);
    engineer.vx += Math.sin(time * 0.58 + engineer.wobble) * 7 * dt;
    engineer.vy += Math.cos(time * 0.52 + engineer.wobble) * 7 * dt;
    engineer.vx *= Math.pow(0.72, dt);
    engineer.vy *= Math.pow(0.72, dt);
    const speed = Math.hypot(engineer.vx, engineer.vy);
    const maxSpeed = bossChaseMaxSpeed(engineer, healTarget && focusDist > 520 ? 170 : 132, nx, ny);
    if (speed > maxSpeed) {
      engineer.vx = (engineer.vx / speed) * maxSpeed;
      engineer.vy = (engineer.vy / speed) * maxSpeed;
    }
    engineer.x += engineer.vx * dt;
    engineer.y += engineer.vy * dt;
    engineer.rotation = Math.atan2(engineer.vy || ny, engineer.vx || nx) + Math.PI / 2;
  }

  function electricAttackTarget(state, tesla, player) {
    if (isCombatMobEntity(player)) {
      return playerTarget(player);
    }
    const playerDistance = Math.hypot(player.x - tesla.x, player.y - tesla.y);
    const structure = nearestStructureTarget(state.world, tesla.x, tesla.y, TESLA_LIGHTNING_RANGE * 0.95, (candidate) => (
      candidate.health > 0 && !isMobOwnedStructure(candidate)
    ));
    if (structure) {
      const structureDistance = Math.hypot(structure.x - tesla.x, structure.y - tesla.y);
      if (structureDistance < playerDistance * 1.12 && hasClearShotAtStructure(state.world, tesla.x, tesla.y, structure)) {
        return structureTarget(structure);
      }
    }
    return playerTarget(player);
  }

  function fireTeslaLightning(state, tesla, target, dist, seedHolder) {
    const leadTime = clamp(dist / 1120, 0, 0.65);
    const aim = normalize(
      target.x + finiteOr(target.vx, 0) * leadTime * 0.42 - tesla.x,
      target.y + finiteOr(target.vy, 0) * leadTime * 0.42 - tesla.y
    );
    const color = { r: 157, g: 255, b: 122 };
    const muzzleDistance = tesla.radius + 12;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      vx: aim.x * 1120 + tesla.vx * 0.08,
      vy: aim.y * 1120 + tesla.vy * 0.08,
      radius: 8,
      length: randomRange(seedHolder, 76, 104),
      color,
      life: 0.64,
      maxLife: 0.64,
      damage: tesla.isBoss ? bossScaledDamage(tesla, TESLA_LIGHTNING_DAMAGE) : 0,
      toolDisable: TESLA_TOOL_DISABLE_DURATION * (tesla.isBoss ? 1.45 : 1),
      cause: tesla.isBoss ? "Tesla boss lightning" : "Tesla lightning",
      ...playerTeamMobProjectileFields(tesla),
      lightning: true,
      targetStructureId: target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target.kind === "player" ? target.player.id : ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    tesla.shootCooldown = randomRange(seedHolder, 2.3, 3.8) * (tesla.isBoss ? 0.68 : 1);
    tesla.lightningFlash = 0.32;
    tesla.lightningWarmup = 0;
    tesla.lightningAngle = Math.atan2(aim.y, aim.x);
    tesla.rotation = tesla.lightningAngle + Math.PI / 2;
    state.events.push({ type: "mob.shot", mobId: tesla.id, kind: "tesla", projectileId: projectile.id, tick: state.tick });
  }

  function updateTesla(state, tesla, players, dt, seedHolder) {
    tesla.shootCooldown = Math.max(0, finiteOr(tesla.shootCooldown, 0) - dt);
    tesla.lightningFlash = Math.max(0, finiteOr(tesla.lightningFlash, 0) - dt);
    const bossAltReady = tickBossAltAttackCooldown(tesla, dt, seedHolder);
    const playerInfo = nearestCombatPlayer(players, tesla);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = electricAttackTarget(state, tesla, targetPlayer);
    const toTargetX = target.x - tesla.x;
    const toTargetY = target.y - tesla.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * tesla.strafeSign;
    const tangentY = nx * tesla.strafeSign;
    const desiredDistance = 520;
    const chaseForce = bossChaseForce(tesla, dist > desiredDistance ? 92 : -64);
    const strafeForce = bossStrafeForce(tesla, dist < 940 ? 72 : 20);
    if (bossAltReady && playerInfo.distance < TESLA_BOSS_EMP_PULSE_RANGE * 1.12) {
      applyEmpPulse(state, tesla.x, tesla.y, TESLA_BOSS_EMP_PULSE_RANGE, TESLA_BOSS_EMP_PULSE_DISABLE_DURATION, {
        affectMobs: true,
        affectPlayers: !isPlayerTeamMob(tesla),
        affectStructures: !isPlayerTeamMob(tesla),
        sourceMob: tesla,
        sourceKind: "mob",
        cause: "Tesla boss EMP",
        color: cloneColor(tesla.color)
      });
      resetBossAltAttackCooldown(tesla, seedHolder);
      tesla.lightningWarmup = 0;
      tesla.lightningFlash = Math.max(finiteOr(tesla.lightningFlash, 0), 0.48);
    }
    tesla.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    tesla.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    if (dist < TESLA_LIGHTNING_RANGE && hasClearShotAtCombatTarget(state.world, tesla, target)) {
      tesla.lightningWarmup = clamp(finiteOr(tesla.lightningWarmup, 0) + dt * 1.65, 0, 1);
      if (tesla.shootCooldown <= 0 && tesla.lightningWarmup >= 1) {
        fireTeslaLightning(state, tesla, target, dist, seedHolder);
      }
    } else {
      tesla.lightningWarmup = Math.max(0, finiteOr(tesla.lightningWarmup, 0) - dt * 1.8);
    }
    const time = simTime(state);
    tesla.vx += Math.sin(time * 0.82 + tesla.wobble) * 14 * dt;
    tesla.vy += Math.cos(time * 0.77 + tesla.wobble) * 14 * dt;
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

  function rocketAttackTarget(state, rocket, player) {
    if (isCombatMobEntity(player)) {
      return playerTarget(player);
    }
    const playerDistance = Math.hypot(player.x - rocket.x, player.y - rocket.y);
    const structure = nearestStructureTarget(state.world, rocket.x, rocket.y, 1180, (candidate) => candidate.health > 0);
    if (structure) {
      const structureDistance = Math.hypot(structure.x - rocket.x, structure.y - rocket.y);
      if (structureDistance < playerDistance * 1.18 && hasClearShotAtStructure(state.world, rocket.x, rocket.y, structure)) {
        return structureTarget(structure);
      }
    }
    return playerTarget(player);
  }

  function updateRocketPlayerImpact(state, rocket, target, seedHolder) {
    if (!target) {
      return;
    }
    const dx = target.x - rocket.x;
    const dy = target.y - rocket.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = finiteOr(target.radius, PLAYER_RADIUS) * 0.74 + rocket.radius * 0.88;
    if (dist > hitDistance) {
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const overlap = hitDistance - dist;
    target.x += nx * overlap * 0.68;
    target.y += ny * overlap * 0.68;
    rocket.x -= nx * overlap * 0.32;
    rocket.y -= ny * overlap * 0.32;
    if (speed > ROCKET_IMPACT_SPEED && hitPlayerWithMob(state, rocket, target, nx, ny, bossScaledDamage(rocket, ROCKET_IMPACT_DAMAGE), rocket.isBoss ? "Rocket boss ship" : "Rocket ship", 420)) {
      rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.7);
      rocket.chargeCooldown = randomRange(seedHolder, ROCKET_CHARGE_COOLDOWN_MIN, ROCKET_CHARGE_COOLDOWN_MAX);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.strafeSign *= -1;
      rocket.blastTimer = 0;
      rocket.lockTimer = 0;
      rocket.scanProgress = 0;
      rocket.volleyTimer = 0;
      rocket.volleyShots = 0;
      rocket.vx -= nx * 260;
      rocket.vy -= ny * 260;
    }
  }

  function updateRocketStructureImpact(state, rocket, seedHolder) {
    if (isPlayerTeamMob(rocket)) {
      return;
    }
    if (rocket.impactCooldown > 0) {
      return;
    }
    const speed = Math.hypot(rocket.vx, rocket.vy);
    if (speed <= ROCKET_IMPACT_SPEED * 0.82) {
      return;
    }
    for (const structure of state.world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0) {
        continue;
      }
      const dx = structure.x - rocket.x;
      const dy = structure.y - rocket.y;
      const dist = Math.hypot(dx, dy) || 1;
      const hitDistance = rocket.radius * 0.86 + structureHitRadius(structure);
      if (dist > hitDistance) {
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      rocket.x -= nx * (hitDistance - dist) * 0.3;
      rocket.y -= ny * (hitDistance - dist) * 0.3;
      rocket.impactCooldown = 0.95;
      rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.7);
      rocket.chargeCooldown = randomRange(seedHolder, ROCKET_CHARGE_COOLDOWN_MIN, ROCKET_CHARGE_COOLDOWN_MAX);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.strafeSign *= -1;
      rocket.blastTimer = 0;
      rocket.lockTimer = 0;
      rocket.scanProgress = 0;
      rocket.volleyTimer = 0;
      rocket.volleyShots = 0;
      rocket.vx -= nx * 240;
      rocket.vy -= ny * 240;
      damageStructure(state, structure, bossScaledDamage(rocket, STRUCTURE_ROCKET_DAMAGE + Math.max(0, speed - ROCKET_IMPACT_SPEED) * 0.035), rocket.isBoss ? "Rocket boss impact" : rocket.kind === "satellite" ? "Satellite impact" : "Rocket ship");
      break;
    }
  }

  function continueRocketFromDifferentSide(rocket) {
    rocket.strafeSign = rocket.strafeSign < 0 ? 1 : -1;
  }

  function fireRocketMissile(state, rocket, target, seedHolder) {
    const targetX = Number.isFinite(rocket.lockX) ? rocket.lockX : target.x;
    const targetY = Number.isFinite(rocket.lockY) ? rocket.lockY : target.y;
    const aim = normalize(targetX - rocket.x, targetY - rocket.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const side = rocket.volleyShots % 2 === 0 ? 1 : -1;
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 18;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: rocket.x + aim.x * muzzleDistance + normalX * side * 17,
      y: rocket.y + aim.y * muzzleDistance + normalY * side * 17,
      vx: aim.x * SATELLITE_MISSILE_SPEED + rocket.vx * 0.12,
      vy: aim.y * SATELLITE_MISSILE_SPEED + rocket.vy * 0.12,
      radius: 10,
      length: randomRange(seedHolder, 42, 54),
      color,
      life: 2.62,
      maxLife: 2.62,
      damage: bossScaledDamage(rocket, SATELLITE_MISSILE_DAMAGE),
      toolDisable: 0,
      cause: "Satellite missile",
      ...playerTeamMobProjectileFields(rocket),
      rocket: true,
      targetStructureId: target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target.kind === "player" ? target.player.id : ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    rocket.blastTimer = 0.18;
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
    state.events.push({ type: "mob.shot", mobId: rocket.id, kind: rocket.kind || "satellite", projectileId: projectile.id, tick: state.tick });
  }
