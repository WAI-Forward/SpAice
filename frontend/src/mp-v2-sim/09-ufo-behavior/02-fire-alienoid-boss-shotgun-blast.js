  function fireAlienoidBossShotgunBlast(state, mob, target, distance, seedHolder) {
    if (!target) {
      return;
    }
    const leadTime = clamp(distance / RIVAL_PROJECTILE_SPEED, 0, 1.2);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.6;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.6;
    const aim = normalize(targetX - mob.x, targetY - mob.y);
    const aimAngle = Math.atan2(aim.y, aim.x);
    const muzzleDistance = mob.radius + 20;
    const pelletCount = 9;
    const spread = 0.28;
    const laserColor = shadeColor(mob.color, 82);

    for (let i = 0; i < pelletCount; i += 1) {
      const lineT = pelletCount <= 1 ? 0 : i / (pelletCount - 1) * 2 - 1;
      const clusteredT = Math.sign(lineT) * Math.pow(Math.abs(lineT), 1.35);
      const angleOffset = clusteredT * spread + randomRange(seedHolder, -0.04, 0.04);
      const dirX = Math.cos(aimAngle + angleOffset);
      const dirY = Math.sin(aimAngle + angleOffset);
      const sideX = -dirY;
      const sideY = dirX;
      const muzzleScatter = randomRange(seedHolder, -12, 12);
      const forwardScatter = randomRange(seedHolder, -5, 9);
      const pelletSpeed = RIVAL_PROJECTILE_SPEED + randomRange(seedHolder, 45, 175);
      const pelletLife = randomRange(seedHolder, 1.28, 1.82);
      const projectile = normalizeEntity({
        id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
        kind: "projectile",
        x: mob.x + dirX * (muzzleDistance + forwardScatter) + sideX * muzzleScatter,
        y: mob.y + dirY * (muzzleDistance + forwardScatter) + sideY * muzzleScatter,
        vx: dirX * pelletSpeed + finiteOr(mob.vx, 0) * 0.12,
        vy: dirY * pelletSpeed + finiteOr(mob.vy, 0) * 0.12,
        radius: randomRange(seedHolder, 4.4, 6.2),
        length: randomRange(seedHolder, 32, 54),
        color: laserColor,
        life: pelletLife,
        maxLife: pelletLife,
        damage: bossScaledDamage(mob, RIVAL_PROJECTILE_DAMAGE * 0.42),
        toolDisable: 0,
        cause: "Alienoid boss shotgun blast",
        ...playerTeamMobProjectileFields(mob),
        targetPlayerId: target.id || ""
      }, state.world.nextRivalProjectileId || 1, "projectile");
      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      state.events.push({ type: "mob.shot", mobId: mob.id, kind: mob.kind || "alienoid", projectileId: projectile.id, attack: "alt", tick: state.tick });
    }

    mob.rotation = aimAngle + Math.PI / 2;
    resetBossAltAttackCooldown(mob, seedHolder);
  }

  function updateAlienoid(state, mob, players, dt, seedHolder) {
    const targetInfo = nearestCombatPlayer(players, mob);
    const target = targetInfo.player;
    const dist = targetInfo.distance || 1;
    if (!target) {
      return;
    }

    mob.shootCooldown = Math.max(0, finiteOr(mob.shootCooldown, 1) - dt);
    const bossAltReady = tickBossAltAttackCooldown(mob, dt, seedHolder);
    const nx = (target.x - mob.x) / dist;
    const ny = (target.y - mob.y) / dist;
    const tangentX = -ny * (Number(mob.strafeSign) < 0 ? -1 : 1);
    const tangentY = nx * (Number(mob.strafeSign) < 0 ? -1 : 1);
    const desiredDistance = 300;
    const chaseForce = bossChaseForce(mob, dist > desiredDistance ? 136 : -62);
    const strafeForce = bossStrafeForce(mob, dist < RIVAL_SHOOT_RANGE ? 46 : 12);

    mob.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    mob.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    if (dist < RIVAL_SHOOT_RANGE && mob.shootCooldown <= 0 && hasClearShotAtPlayer(state.world, mob, target)) {
      fireAlienoidLaser(state, mob, target, dist, seedHolder);
    }
    if (bossAltReady && dist < RIVAL_SHOOT_RANGE * 1.16 && hasClearShotAtPlayer(state.world, mob, target)) {
      fireAlienoidBossShotgunBlast(state, mob, target, dist, seedHolder);
    }

    mob.vx += Math.sin(state.tick * 0.036 + finiteOr(mob.wobble, 0)) * 8 * dt;
    mob.vy += Math.cos(state.tick * 0.03 + finiteOr(mob.wobble, 0)) * 8 * dt;
    mob.vx *= Math.pow(0.72, dt);
    mob.vy *= Math.pow(0.72, dt);

    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = bossChaseMaxSpeed(mob, dist > 620 ? 275 : 190, nx, ny);
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.rotation = Math.atan2(ny, nx) + Math.PI / 2 + Math.sin(state.tick * 0.12 + finiteOr(mob.wobble, 0)) * 0.08;
  }

  function bodyById(world, bodyId) {
    const id = Math.max(0, Math.floor(finiteOr(bodyId, 0)));
    if (!id) {
      return null;
    }
    return (world.particles || []).find((body) => body && body.id === id) || null;
  }

  function rambotAttackTarget(state, player) {
    if (player && player.survivalDefenseBody && player.body) {
      return {
        kind: "defense-body",
        body: player.body,
        protectedBody: player.protectedBody,
        x: player.body.x,
        y: player.body.y,
        vx: finiteOr(player.body.vx, 0),
        vy: finiteOr(player.body.vy, 0),
        radius: solidContactRadius(player.body)
      };
    }
    if (isCombatMobEntity(player)) {
      return playerTarget(player);
    }
    if (player && player.landed) {
      const body = bodyById(state.world, player.landed.bodyId);
      if (body && body.tier && body.tier.solid) {
        return {
          kind: "body",
          body,
          x: body.x,
          y: body.y,
          vx: finiteOr(body.vx, 0),
          vy: finiteOr(body.vy, 0),
          radius: finiteOr(body.radius, 0)
        };
      }
    }
    return playerTarget(player);
  }

  function updateRambotDefenseBodyImpact(state, rambot, attackTarget) {
    if (!attackTarget || attackTarget.kind !== "defense-body" || !attackTarget.body || !attackTarget.protectedBody) {
      return;
    }
    const body = attackTarget.body;
    const protectedBody = attackTarget.protectedBody;
    const dx = finiteOr(body.x, 0) - rambot.x;
    const dy = finiteOr(body.y, 0) - rambot.y;
    const distance = Math.hypot(dx, dy) || 1;
    const hitDistance = solidContactRadius(body) + rambot.radius;
    if (distance > hitDistance) {
      return;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = hitDistance - distance;
    rambot.x -= nx * overlap * 0.82;
    rambot.y -= ny * overlap * 0.82;
    body.x += nx * overlap * 0.18;
    body.y += ny * overlap * 0.18;
    const speed = Math.hypot(rambot.vx, rambot.vy);
    if (rambot.impactCooldown > 0 || !(rambot.chargeTimer > 0 || speed > RAMBOT_IMPACT_SPEED)) {
      return;
    }

    const awayDx = finiteOr(body.x, 0) - finiteOr(protectedBody.x, 0);
    const awayDy = finiteOr(body.y, 0) - finiteOr(protectedBody.y, 0);
    const awayDistance = Math.hypot(awayDx, awayDy) || 1;
    const awayX = awayDx / awayDistance;
    const awayY = awayDy / awayDistance;
    const relativeOutwardSpeed = (finiteOr(body.vx, 0) - finiteOr(protectedBody.vx, 0)) * awayX +
      (finiteOr(body.vy, 0) - finiteOr(protectedBody.vy, 0)) * awayY;
    const push = SURVIVAL_RAMBOT_DEFENSE_BODY_IMPULSE * (rambot.isBoss ? 1.28 : 1) + Math.max(0, -relativeOutwardSpeed) * 0.72;
    const contactX = body.x - awayX * solidContactRadius(body);
    const contactY = body.y - awayY * solidContactRadius(body);
    applyBodyVelocityChangeAtPoint(body, awayX * push, awayY * push, contactX, contactY, BODY_CONSTRAINT_TORQUE_RESPONSE);
    markMobDamagedByBody(rambot, body);
    rambot.vx -= awayX * 245;
    rambot.vy -= awayY * 245;
    rambot.impactCooldown = 0.95;
    rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.62);
    rambot.chargeTimer = 0;
    state.events.push({
      type: "mob.camp.rambotDefendedBody",
      mobId: rambot.id,
      bodyId: body.id,
      campBodyId: protectedBody.id,
      tick: state.tick
    });
  }

  function hitPlayerWithMob(state, mob, target, nx, ny, damage, cause, impulse) {
    if (target && target.spacecraftTarget) {
      if (mob.impactCooldown > 0) {
        return false;
      }
      if (damageSpacecraftTarget(state, target, damage, cause)) {
        state.events.push({ type: "spacecraft.hitByMob", spacecraftId: target.spacecraftId, componentId: target.spacecraftComponentId, mobId: mob.id, kind: mob.kind || cause || "mob", tick: state.tick });
      }
      mob.impactCooldown = 0.95;
      return true;
    }
    if (!target || target.health <= 0 || target.hitCooldown > 0 || target.invulnerableTimer > 0 || mob.impactCooldown > 0) {
      return false;
    }
    if (isPlayerTeamMob(target)) {
      knockMob(target, nx, ny, impulse * 0.55);
      damageMob(state, target, damage, cause || "mob");
      mob.impactCooldown = 0.95;
      return true;
    }
    if (isCombatMobEntity(target)) {
      knockMob(target, nx, ny, impulse * 0.55);
      damageMob(state, target, damage, cause || "mob");
      mob.impactCooldown = 0.95;
      return true;
    }
    target.vx += nx * impulse + finiteOr(mob.vx, 0) * 0.52;
    target.vy += ny * impulse + finiteOr(mob.vy, 0) * 0.52;
    if (damagePlayer(state, target, difficultyMobDamage(state, damage), cause)) {
      state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: mob.id, kind: mob.kind || cause || "mob", tick: state.tick });
    }
    mob.impactCooldown = 0.95;
    return true;
  }

  function updateRambotPlayerImpact(state, rambot, target) {
    if (!target) {
      return;
    }
    const dx = target.x - rambot.x;
    const dy = target.y - rambot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = finiteOr(target.radius, PLAYER_RADIUS) * 0.74 + rambot.radius * 0.86;
    if (dist > hitDistance) {
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > RAMBOT_IMPACT_SPEED;
    const overlap = hitDistance - dist;
    target.x += nx * overlap * 0.72;
    target.y += ny * overlap * 0.72;
    rambot.x -= nx * overlap * 0.28;
    rambot.y -= ny * overlap * 0.28;
    if (charging && hitPlayerWithMob(state, rambot, target, nx, ny, bossScaledDamage(rambot, RAMBOT_IMPACT_DAMAGE), rambot.isBoss ? "Rambot boss charge" : "Rambot charge", 360)) {
      rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.58);
      rambot.chargeTimer = 0;
      rambot.vx -= nx * 230;
      rambot.vy -= ny * 230;
    }
  }

  function updateRambotStructureImpact(state, rambot) {
    if (isPlayerTeamMob(rambot)) {
      return;
    }
    if (rambot.impactCooldown > 0) {
      return;
    }
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > RAMBOT_IMPACT_SPEED;
    if (!charging) {
      return;
    }
    for (const structure of state.world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0) {
        continue;
      }
      const dx = structure.x - rambot.x;
      const dy = structure.y - rambot.y;
      const dist = Math.hypot(dx, dy) || 1;
      const hitDistance = rambot.radius * 0.82 + structureHitRadius(structure);
      if (dist > hitDistance) {
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = hitDistance - dist;
      rambot.x -= nx * overlap * 0.34;
      rambot.y -= ny * overlap * 0.34;
      rambot.vx -= nx * 210;
      rambot.vy -= ny * 210;
      rambot.impactCooldown = 0.95;
      rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.58);
      rambot.chargeTimer = 0;
      damageStructure(state, structure, bossScaledDamage(rambot, STRUCTURE_RAMBOT_DAMAGE + Math.max(0, speed - RAMBOT_IMPACT_SPEED) * 0.045), rambot.isBoss ? "Rambot boss charge" : "Rambot charge");
      break;
    }
  }

  function rambotBossBaseForwardAngle(rambot) {
    return finiteOr(rambot.rotation, 0) - Math.PI / 2;
  }

  function clampedRambotBossHeadAngle(rambot, desiredAngle) {
    const baseAngle = rambotBossBaseForwardAngle(rambot);
    const offset = clamp(shortestAngleDelta(baseAngle, desiredAngle), -RAMBOT_BOSS_HEAD_TURN_LIMIT, RAMBOT_BOSS_HEAD_TURN_LIMIT);
    return baseAngle + offset;
  }

  function updateRambotBossHeadTracking(rambot, x, y, dt, turnRate) {
    if (!rambot || !rambot.isBoss) {
      return;
    }
    const desiredAngle = Math.atan2(y - rambot.y, x - rambot.x);
    const targetAngle = clampedRambotBossHeadAngle(rambot, desiredAngle);
    const currentAngle = Number.isFinite(Number(rambot.headAngle)) ? rambot.headAngle : targetAngle;
    rambot.headAngle = currentAngle + clamp(shortestAngleDelta(currentAngle, targetAngle), -turnRate * dt, turnRate * dt);
  }

  function tickRambotBossAltAttackCooldown(rambot, dt, seedHolder) {
    if (!rambot || !rambot.isBoss) {
      return false;
    }
    rambot.altAttackCooldown = finiteOr(
      rambot.altAttackCooldown,
      randomRange(seedHolder, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MIN, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MAX)
    ) - dt;
    return rambot.altAttackCooldown <= 0;
  }

  function resetRambotBossAltAttackCooldown(rambot, seedHolder) {
    if (rambot && rambot.isBoss) {
      rambot.altAttackCooldown = randomRange(seedHolder, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MIN, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MAX);
    }
  }

  function rambotBossPistonExtension(rambot) {
    const duration = Math.max(0.1, finiteOr(rambot.pistonDuration, RAMBOT_BOSS_PISTON_DURATION));
    const elapsed = duration - Math.max(0, finiteOr(rambot.pistonTimer, 0));
    const t = clamp(elapsed / duration, 0, 1);
    if (t < 0.24) return 0;
    if (t < 0.58) return (t - 0.24) / 0.34;
    if (t < 0.78) return 1;
    return 1 - (t - 0.78) / 0.22;
  }

  function startRambotBossPistonAttack(rambot, target, seedHolder) {
    rambot.pistonDuration = RAMBOT_BOSS_PISTON_DURATION;
    rambot.pistonTimer = RAMBOT_BOSS_PISTON_DURATION;
    rambot.pistonHit = false;
    rambot.chargeTimer = 0;
    rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.12);
    rambot.vx *= 0.74;
    rambot.vy *= 0.74;
    updateRambotBossHeadTracking(rambot, target.x, target.y, TICK_DT, 18);
    resetRambotBossAltAttackCooldown(rambot, seedHolder);
  }

  function updateRambotBossPistonImpact(state, rambot, target) {
    if (!rambot || !rambot.isBoss || finiteOr(rambot.pistonTimer, 0) <= 0 || rambot.pistonHit || !target) {
      return;
    }
    const extension = rambotBossPistonExtension(rambot);
    if (extension < 0.54) {
      return;
    }
    const headAngle = Number.isFinite(Number(rambot.headAngle)) ? rambot.headAngle : rambotBossBaseForwardAngle(rambot);
    const dirX = Math.cos(headAngle);
    const dirY = Math.sin(headAngle);
    const originX = rambot.x + dirX * (rambot.radius * 0.24);
    const originY = rambot.y + dirY * (rambot.radius * 0.24);
    const reach = rambot.radius * 0.42 + RAMBOT_BOSS_PISTON_RANGE * extension;
    const endX = originX + dirX * reach;
    const endY = originY + dirY * reach;

    if (distanceToSegment(target.x, target.y, originX, originY, endX, endY) <= finiteOr(target.radius, PLAYER_RADIUS) * 0.78 + 30) {
      target.vx += dirX * RAMBOT_BOSS_PISTON_KNOCKBACK;
      target.vy += dirY * RAMBOT_BOSS_PISTON_KNOCKBACK;
      if (isCombatMobEntity(target)) {
        damageMob(state, target, bossScaledDamage(rambot, RAMBOT_BOSS_PISTON_DAMAGE), "Rambot boss piston punch");
      } else if (damagePlayer(state, target, difficultyMobDamage(state, bossScaledDamage(rambot, RAMBOT_BOSS_PISTON_DAMAGE)), "Rambot boss piston punch")) {
        state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: rambot.id, kind: "rambot", cause: "piston-punch", tick: state.tick });
      }
      rambot.pistonHit = true;
      rambot.impactCooldown = Math.max(finiteOr(rambot.impactCooldown, 0), 0.7);
      rambot.vx -= dirX * 140;
      rambot.vy -= dirY * 140;
      return;
    }

    if (isPlayerTeamMob(rambot)) {
      return;
    }

    for (const structure of state.world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0) {
        continue;
      }
      if (distanceToSegment(structure.x, structure.y, originX, originY, endX, endY) > structureHitRadius(structure) + 28) {
        continue;
      }
      damageStructure(state, structure, bossScaledDamage(rambot, STRUCTURE_RAMBOT_DAMAGE + RAMBOT_BOSS_PISTON_DAMAGE * 0.72), "Rambot boss piston punch");
      rambot.pistonHit = true;
      rambot.impactCooldown = Math.max(finiteOr(rambot.impactCooldown, 0), 0.7);
      break;
    }
  }

  function updateRambot(state, rambot, players, dt, seedHolder) {
    rambot.impactCooldown = Math.max(0, finiteOr(rambot.impactCooldown, 0) - dt);
    const bossAltReady = tickRambotBossAltAttackCooldown(rambot, dt, seedHolder);
    const targetInfo = nearestCombatPlayer(players, rambot);
    const targetPlayer = targetInfo.player;
    if (!targetPlayer) {
      return;
    }
    const attackTarget = rambotAttackTarget(state, targetPlayer);
    const toTargetX = attackTarget.x - rambot.x;
    const toTargetY = attackTarget.y - rambot.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rambot.strafeSign;
    const tangentY = nx * rambot.strafeSign;

    const defenseTarget = Boolean(targetPlayer.survivalDefenseBody && targetPlayer.body);
    if (defenseTarget && finiteOr(rambot.pistonTimer, 0) > 0) {
      rambot.pistonTimer = 0;
      rambot.pistonHit = false;
    }

    if (!defenseTarget && rambot.isBoss && finiteOr(rambot.pistonTimer, 0) > 0) {
      rambot.pistonTimer = Math.max(0, finiteOr(rambot.pistonTimer, 0) - dt);
      updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, dt, 8.5);
      updateRambotBossPistonImpact(state, rambot, targetPlayer);
      rambot.vx *= Math.pow(0.34, dt);
      rambot.vy *= Math.pow(0.34, dt);
      if (rambot.pistonTimer <= 0) {
        rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.38);
      }
    } else if (bossAltReady && rambot.isBoss && attackTarget.kind === "player" && targetInfo.distance < 760) {
      startRambotBossPistonAttack(rambot, targetPlayer, seedHolder);
    } else if (rambot.chargeTimer > 0) {
      rambot.chargeTimer = Math.max(0, rambot.chargeTimer - dt);
      rambot.vx += rambot.chargeDirX * 900 * dt;
      rambot.vy += rambot.chargeDirY * 900 * dt;
      if (rambot.chargeTimer <= 0) {
        rambot.recoverTimer = randomRange(seedHolder, 0.55, 0.9);
        rambot.chargeCooldown = randomRange(seedHolder, 1.6, 3.1);
      }
    } else if (rambot.recoverTimer > 0) {
      rambot.recoverTimer = Math.max(0, rambot.recoverTimer - dt);
      rambot.vx *= Math.pow(0.22, dt);
      rambot.vy *= Math.pow(0.22, dt);
    } else {
      rambot.chargeCooldown = Math.max(0, finiteOr(rambot.chargeCooldown, 0) - dt);
      const chaseForce = bossChaseForce(rambot, rambot.isBoss ? 154 : 118);
      const strafeForce = bossStrafeForce(rambot, rambot.isBoss ? 32 : 22);
      rambot.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      rambot.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
      const chargeRange = attackTarget.kind === "player" ? 1080 : attackTarget.radius + 860;
      if (dist < chargeRange && rambot.chargeCooldown <= 0) {
        rambot.chargeDirX = nx;
        rambot.chargeDirY = ny;
        rambot.chargeTimer = attackTarget.kind === "player" ? randomRange(seedHolder, 0.92, 1.14) : randomRange(seedHolder, 0.62, 0.82);
        rambot.impactCooldown = 0;
        const launchImpulse = attackTarget.kind === "player" ? 220 : 170;
        rambot.vx += nx * launchImpulse;
        rambot.vy += ny * launchImpulse;
      }
    }

    const time = simTime(state);
    rambot.vx += Math.sin(time * 0.5 + rambot.wobble) * 5 * dt;
    rambot.vy += Math.cos(time * 0.45 + rambot.wobble) * 5 * dt;
    rambot.vx *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);
    rambot.vy *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const maxSpeed = bossChaseMaxSpeed(
      rambot,
      rambot.chargeTimer > 0 ? (rambot.isBoss ? 570 : 475) : (rambot.isBoss ? 215 : 150),
      rambot.chargeTimer > 0 ? rambot.chargeDirX : nx,
      rambot.chargeTimer > 0 ? rambot.chargeDirY : ny
    );
    if (speed > maxSpeed) {
      rambot.vx = (rambot.vx / speed) * maxSpeed;
      rambot.vy = (rambot.vy / speed) * maxSpeed;
    }
    rambot.x += rambot.vx * dt;
    rambot.y += rambot.vy * dt;
    if (defenseTarget) {
      updateRambotDefenseBodyImpact(state, rambot, attackTarget);
    } else {
      updateRambotPlayerImpact(state, rambot, targetPlayer);
    }
    updateRambotStructureImpact(state, rambot);
    rambot.rotation = Math.atan2(rambot.vy || ny, rambot.vx || nx) + Math.PI / 2;
    updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, dt, rambot.chargeTimer > 0 ? 6.5 : 3.6);
  }

  function allCombatMobs(world) {
    const mobs = [];
    for (const collectionName of MOB_COLLECTIONS) {
      for (const mob of world[collectionName] || []) {
        if (mob && mob.health > 0) {
          mobs.push(mob);
        }
      }
    }
    for (const beacon of world.mobBeacons || []) {
      if (beacon && beacon.health > 0) {
        mobs.push(beacon);
      }
    }
    return mobs;
  }

  function isMobDisabled(mob) {
    return Boolean(mob && finiteOr(mob.disabledTimer, 0) > 0);
  }

  function disableMob(mob, duration) {
    if (!mob || finiteOr(mob.health, 0) <= 0) {
      return false;
    }
    const disableDuration = Math.max(0, finiteOr(duration, 0));
    if (disableDuration <= 0) {
      return false;
    }
    mob.disabledTimer = Math.max(finiteOr(mob.disabledTimer, 0), disableDuration);
    mob.flash = Math.max(finiteOr(mob.flash, 0), 0.16);
    mob.lightningWarmup = 0;
    mob.lockTimer = 0;
    mob.volleyTimer = 0;
    mob.volleyShots = 0;
    mob.chargeTimer = 0;
    mob.chargePower = 0;
    mob.shieldActive = 0;
    if (mob.kind === "ufo") {
      mob.tractorDisabledTimer = Math.max(finiteOr(mob.tractorDisabledTimer, 0), disableDuration);
    }
    if (mob.kind === "rambot" || mob.kind === "rocket" || mob.kind === "satellite") {
      mob.recoverTimer = Math.max(finiteOr(mob.recoverTimer, 0), Math.min(0.85, disableDuration));
    }
    return true;
  }
