  function hitCombatPlayerWithRambot(rambot, target, nx, ny) {
    const targetPlayer = target && target.player ? target.player : player;
    if ((target && target.local && player.hitCooldown > 0) || rambot.impactCooldown > 0) {
      return;
    }

    if (target && target.familiarEnemy) {
      const enemy = target.player;
      knockMob(enemy, nx, ny, 210);
      damageMob(enemy, difficultyMobDamage(bossScaledDamage(rambot, rambotImpactDamage)), rambot.color, mobName(enemy) + " rammed by your rambot familiar.", {
        sourcePlayerId: rambot.familiarOwnerPlayerId || player.id || ""
      });
    } else if (target && target.spacecraft && target.spacecraftComponent) {
      damageSpacecraftComponent(
        target.spacecraft,
        target.spacecraftComponent,
        difficultyMobDamage(bossScaledDamage(rambot, structureRambotDamage + rambotImpactDamage * 0.55)),
        rambot.color,
        target.spacecraft.name + " " + target.spacecraftComponent.label.toLowerCase() + " breached by a rambot."
      );
    } else if (target && target.familiar) {
      damageMob(target.player, difficultyMobDamage(bossScaledDamage(rambot, rambotImpactDamage)), rambot.color, "Your familiar was rammed by a rambot.");
    } else if (target && !target.local && target.remote) {
      sendRemoteEntityEffect(target.remote, {
        entityType: "player",
        sourceKind: "mob",
        cause: rambot.isBoss ? "Rambot boss charge" : "Rambot charge",
        damage: difficultyMobDamage(bossScaledDamage(rambot, rambotImpactDamage)),
        impulseX: nx * 360 + rambot.vx * 0.48,
        impulseY: ny * 360 + rambot.vy * 0.48,
        color: rambot.color
      });
    } else {
      if (player.landed) {
        detachFromBody(210);
      }

      player.vx += nx * 360 + rambot.vx * 0.48;
      player.vy += ny * 360 + rambot.vy * 0.48;
      damageLocalPlayer(difficultyMobDamage(bossScaledDamage(rambot, rambotImpactDamage)), {
        cause: rambot.isBoss ? "Rambot boss charge" : "Rambot charge",
        cooldown: 0.85,
        flash: 0.32
      });
    }

    rambot.impactCooldown = 0.9;
    rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.55);
    rambot.chargeTimer = 0;
    rambot.vx -= nx * 180;
    rambot.vy -= ny * 180;

    sparks.push({
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: 58,
      color: rambot.color,
      life: 0.34,
      maxLife: 0.34
    });
  }

  function updateRambotPlayerImpact(rambot, target) {
    const targetPlayer = target && target.player ? target.player : player;
    const dx = targetPlayer.x - rambot.x;
    const dy = targetPlayer.y - rambot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = (targetPlayer.radius || player.radius) * 0.74 + rambot.radius * 0.86;

    if (dist > hitDistance) {
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > rambotImpactSpeed;
    const overlap = hitDistance - dist;

    if (target && target.local) {
      player.x += nx * overlap * 0.72;
      player.y += ny * overlap * 0.72;
    } else if (target && target.familiarEnemy) {
      target.player.x += nx * overlap * 0.72;
      target.player.y += ny * overlap * 0.72;
    }
    rambot.x -= nx * overlap * 0.28;
    rambot.y -= ny * overlap * 0.28;

    if (charging) {
      hitCombatPlayerWithRambot(rambot, target || { local: true, remote: null, player }, nx, ny);
    }
  }

  function updateRambotStructureImpact(rambot) {
    if (isPlayerTeamMob(rambot)) {
      return;
    }
    if (rambot.impactCooldown > 0) {
      return;
    }

    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > rambotImpactSpeed;
    if (!charging) {
      return;
    }

    for (const structure of structures) {
      if (structure.health <= 0) {
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
      rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.58);
      rambot.chargeTimer = 0;
      damageStructure(structure, difficultyMobDamage(bossScaledDamage(rambot, structureRambotDamage + Math.max(0, speed - rambotImpactSpeed) * 0.045)), rambot.color);
      break;
    }
  }

  function rambotAttackTarget(playerTarget) {
    if (playerTarget && playerTarget.local && player.landed) {
      const body = bodyById(player.landed.bodyId);
      if (body && body.tier && body.tier.solid) {
        return {
          kind: "body",
          body,
          x: body.x,
          y: body.y,
          radius: body.radius
        };
      }
    }

    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: targetPlayer.radius || player.radius
    };
  }

  function rambotBossBaseForwardAngle(rambot) {
    return finiteOr(rambot.rotation, 0) - Math.PI / 2;
  }

  function clampedRambotBossHeadAngle(rambot, desiredAngle) {
    const baseAngle = rambotBossBaseForwardAngle(rambot);
    const offset = clamp(shortestAngleDelta(baseAngle, desiredAngle), -rambotBossHeadTurnLimit, rambotBossHeadTurnLimit);
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

  function tickRambotBossAltAttackCooldown(rambot, dt) {
    if (!rambot || !rambot.isBoss) {
      return false;
    }
    rambot.altAttackCooldown = finiteOr(rambot.altAttackCooldown, randomRange(rambotBossAltAttackCooldownMin, rambotBossAltAttackCooldownMax)) - dt;
    return rambot.altAttackCooldown <= 0;
  }

  function resetRambotBossAltAttackCooldown(rambot) {
    if (rambot && rambot.isBoss) {
      rambot.altAttackCooldown = randomRange(rambotBossAltAttackCooldownMin, rambotBossAltAttackCooldownMax);
    }
  }

  function rambotBossPistonExtension(rambot) {
    const duration = Math.max(0.1, finiteOr(rambot.pistonDuration, rambotBossPistonDuration));
    const elapsed = duration - Math.max(0, finiteOr(rambot.pistonTimer, 0));
    const t = clamp(elapsed / duration, 0, 1);
    if (t < 0.24) {
      return 0;
    }
    if (t < 0.58) {
      return (t - 0.24) / 0.34;
    }
    if (t < 0.78) {
      return 1;
    }
    return 1 - (t - 0.78) / 0.22;
  }

  function startRambotBossPistonAttack(rambot, targetPlayer) {
    rambot.pistonDuration = rambotBossPistonDuration;
    rambot.pistonTimer = rambotBossPistonDuration;
    rambot.pistonHit = false;
    rambot.chargeTimer = 0;
    rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.12);
    rambot.vx *= 0.74;
    rambot.vy *= 0.74;
    updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, 1 / 30, 18);
    resetRambotBossAltAttackCooldown(rambot);
    playSound("rambotCharge", { throttleKey: "rambotPiston:" + rambot.id, throttle: 0.65 });
  }

  function hitCombatPlayerWithRambotPiston(rambot, target, nx, ny, hitX, hitY) {
    const targetPlayer = target && target.player ? target.player : player;
    if (target && target.familiarEnemy) {
      knockMob(target.player, nx, ny, rambotBossPistonKnockback * 0.56);
      damageMob(target.player, difficultyMobDamage(bossScaledDamage(rambot, rambotBossPistonDamage)), rambot.color, mobName(target.player) + " punched by your rambot familiar.");
    } else if (target && target.spacecraft && target.spacecraftComponent) {
      damageSpacecraftComponent(
        target.spacecraft,
        target.spacecraftComponent,
        difficultyMobDamage(bossScaledDamage(rambot, structureRambotDamage + rambotImpactDamage * 0.75)),
        rambot.color,
        target.spacecraft.name + " " + target.spacecraftComponent.label.toLowerCase() + " punched by the rambot boss."
      );
    } else if (target && target.familiar) {
      knockMob(target.player, nx, ny, rambotBossPistonKnockback * 0.56);
      damageMob(target.player, difficultyMobDamage(bossScaledDamage(rambot, rambotBossPistonDamage)), rambot.color, "Your familiar was punched by the rambot boss.");
    } else if (target && !target.local && target.remote) {
      sendRemoteEntityEffect(target.remote, {
        entityType: "player",
        sourceKind: "mob",
        cause: "Rambot boss piston punch",
        damage: difficultyMobDamage(bossScaledDamage(rambot, rambotBossPistonDamage)),
        impulseX: nx * rambotBossPistonKnockback,
        impulseY: ny * rambotBossPistonKnockback,
        color: rambot.color
      });
    } else {
      if (player.landed) {
        detachFromBody(240);
      }
      player.vx += nx * rambotBossPistonKnockback;
      player.vy += ny * rambotBossPistonKnockback;
      damageLocalPlayer(difficultyMobDamage(bossScaledDamage(rambot, rambotBossPistonDamage)), {
        cause: "Rambot boss piston punch",
        cooldown: 0.82,
        flash: 0.34
      });
    }

    rambot.pistonHit = true;
    rambot.impactCooldown = Math.max(finiteOr(rambot.impactCooldown, 0), 0.7);
    rambot.vx -= nx * 140;
    rambot.vy -= ny * 140;
    sparks.push({
      x: Number.isFinite(Number(hitX)) ? hitX : targetPlayer.x,
      y: Number.isFinite(Number(hitY)) ? hitY : targetPlayer.y,
      radius: 72,
      color: rambot.color,
      life: 0.34,
      maxLife: 0.34
    });
  }

  function updateRambotBossPistonImpact(rambot, target) {
    if (!rambot || !rambot.isBoss || finiteOr(rambot.pistonTimer, 0) <= 0 || rambot.pistonHit) {
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
    const reach = rambot.radius * 0.42 + rambotBossPistonRange * extension;
    const endX = originX + dirX * reach;
    const endY = originY + dirY * reach;
    const targetPlayer = target && target.player ? target.player : player;

    if (targetPlayer && distanceToSegment(targetPlayer.x, targetPlayer.y, originX, originY, endX, endY) <= (targetPlayer.radius || player.radius) * 0.78 + 30) {
      hitCombatPlayerWithRambotPiston(rambot, target || { local: true, remote: null, player }, dirX, dirY, endX, endY);
      return;
    }

    if (isPlayerTeamMob(rambot)) {
      return;
    }

    for (const structure of structures) {
      if (structure.health <= 0) {
        continue;
      }
      if (distanceToSegment(structure.x, structure.y, originX, originY, endX, endY) > structureHitRadius(structure) + 28) {
        continue;
      }
      damageStructure(structure, difficultyMobDamage(bossScaledDamage(rambot, structureRambotDamage + rambotBossPistonDamage * 0.72)), rambot.color);
      rambot.pistonHit = true;
      rambot.impactCooldown = Math.max(finiteOr(rambot.impactCooldown, 0), 0.7);
      sparks.push({
        x: structure.x,
        y: structure.y,
        radius: structureHitRadius(structure) * 1.45,
        color: rambot.color,
        life: 0.32,
        maxLife: 0.32
      });
      break;
    }
  }

  function updateRambots(dt) {
    for (let i = rambots.length - 1; i >= 0; i -= 1) {
      const rambot = rambots[i];
      tickMobDamageTimers(rambot, dt);
      rambot.flash = Math.max(0, rambot.flash - dt);
      rambot.impactCooldown = Math.max(0, rambot.impactCooldown - dt);

      if (rambot.health <= 0) {
        rambots.splice(i, 1);
        continue;
      }
      if (isMobSummoning(rambot)) {
        continue;
      }
      updateBossSpawnPressure(rambot, dt);
      const bossAltReady = tickRambotBossAltAttackCooldown(rambot, dt);
      if (isMobDisabled(rambot)) {
        rambot.chargeTimer = 0;
        rambot.pistonTimer = 0;
        rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.18);
        updateDisabledMobDrift(rambot, dt);
        continue;
      }

      if (updateSurvivalCampMobHome(rambot, dt)) {
        continue;
      }

      const target = combatTargetForMob(rambot);
      if (!target) {
        updateFamiliarMob(rambot, dt);
        continue;
      }
      const targetPlayer = target.player;
      const toPlayerX = targetPlayer.x - rambot.x;
      const toPlayerY = targetPlayer.y - rambot.y;
      const playerDist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const attackTarget = rambotAttackTarget(target);
      const toTargetX = attackTarget.x - rambot.x;
      const toTargetY = attackTarget.y - rambot.y;
      const dist = Math.hypot(toTargetX, toTargetY) || 1;

      if (playerDist > Math.max(width, height) * 2.5 + 1800) {
        const spawn = relocatedMobOffscreenPoint(220, 640, targetPlayer);
        rambot.x = spawn.x;
        rambot.y = spawn.y;
        rambot.vx = randomRange(-10, 10);
        rambot.vy = randomRange(-10, 10);
        rambot.chargeCooldown = randomRange(1.2, 2.6);
        rambot.chargeTimer = 0;
        rambot.recoverTimer = 0;
        rambot.pistonTimer = 0;
        continue;
      }

      const nx = toTargetX / dist;
      const ny = toTargetY / dist;
      const tangentX = -ny * rambot.strafeSign;
      const tangentY = nx * rambot.strafeSign;

      if (rambot.isBoss && finiteOr(rambot.pistonTimer, 0) > 0) {
        rambot.pistonTimer = Math.max(0, finiteOr(rambot.pistonTimer, 0) - dt);
        updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, dt, 8.5);
        updateRambotBossPistonImpact(rambot, target);
        rambot.vx *= Math.pow(0.34, dt);
        rambot.vy *= Math.pow(0.34, dt);
        if (rambot.pistonTimer <= 0) {
          rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.38);
        }
      } else if (bossAltReady && rambot.isBoss && attackTarget.kind === "player" && playerDist < 760) {
        startRambotBossPistonAttack(rambot, targetPlayer);
      } else if (rambot.chargeTimer > 0) {
        rambot.chargeTimer -= dt;
        rambot.vx += rambot.chargeDirX * 900 * dt;
        rambot.vy += rambot.chargeDirY * 900 * dt;
        if (rambot.chargeTimer <= 0) {
          rambot.recoverTimer = randomRange(0.55, 0.9);
          rambot.chargeCooldown = randomRange(1.6, 3.1);
        }
      } else if (rambot.recoverTimer > 0) {
        rambot.recoverTimer -= dt;
        rambot.vx *= Math.pow(0.22, dt);
        rambot.vy *= Math.pow(0.22, dt);
      } else {
        rambot.chargeCooldown -= dt;
        const chaseForce = bossChaseForce(rambot, rambot.isBoss ? 154 : 118);
        const strafeForce = bossStrafeForce(rambot, rambot.isBoss ? 32 : 22);
        rambot.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
        rambot.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

        const chargeRange = attackTarget.kind === "body" ? attackTarget.radius + 860 : 1080;
        if (dist < chargeRange && rambot.chargeCooldown <= 0) {
          rambot.chargeDirX = nx;
          rambot.chargeDirY = ny;
          rambot.chargeTimer = attackTarget.kind === "player" ? randomRange(0.92, 1.14) : randomRange(0.62, 0.82);
          rambot.impactCooldown = 0;
          playSound("rambotCharge", { throttleKey: "rambotCharge:" + rambot.id, throttle: 0.55 });
          const launchImpulse = attackTarget.kind === "player" ? 220 : 170;
          rambot.vx += nx * launchImpulse;
          rambot.vy += ny * launchImpulse;
        }
      }

      rambot.vx += Math.sin(performance.now() * 0.0005 + rambot.wobble) * 5 * dt;
      rambot.vy += Math.cos(performance.now() * 0.00045 + rambot.wobble) * 5 * dt;
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
      updateRambotPlayerImpact(rambot, target);
      updateRambotStructureImpact(rambot);
      rambot.rotation = Math.atan2(rambot.vy || ny, rambot.vx || nx) + Math.PI / 2;
      updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, dt, rambot.chargeTimer > 0 ? 6.5 : 3.6);
    }
  }
