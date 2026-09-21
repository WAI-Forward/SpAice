  function updateRivalProjectiles(dt) {
    player.hitCooldown = Math.max(0, player.hitCooldown - dt);
    player.hitFlash = Math.max(0, player.hitFlash - dt);

    for (let i = rivalProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = rivalProjectiles[i];
      const previousX = projectile.x;
      const previousY = projectile.y;
      projectile.life -= dt;
      steerHeatSeekingProjectile(projectile, dt);
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const dirX = projectile.vx / speed;
      const dirY = projectile.vy / speed;
      const travel = Math.hypot(projectile.x - previousX, projectile.y - previousY);
      const sweptLength = Math.max(projectile.length, travel + projectile.radius);
      const tailX = projectile.x - dirX * sweptLength;
      const tailY = projectile.y - dirY * sweptLength;
      const hitRadius = projectile.radius * (projectile.rocket ? 1.65 : 1);

      if (isPlayerTeamProjectile(projectile)) {
        const blocker = findBlockingLandableBody(tailX, tailY, projectile.x, projectile.y, projectile.radius);
        if (blocker) {
          sparks.push({
            x: blocker.x,
            y: blocker.y,
            radius: 34,
            color: projectile.color,
            life: 0.22,
            maxLife: 0.22
          });
          playSound("mobHit", { throttleKey: "familiarProjectileImpact" });
          rivalProjectiles.splice(i, 1);
          continue;
        }

        if (tradeVesselHitBySegment(tailX, tailY, projectile.x, projectile.y, hitRadius, projectile.damage || rivalProjectileDamage, projectile.color)) {
          rivalProjectiles.splice(i, 1);
          continue;
        }

        let hitHostile = false;
        for (const mob of hostileCombatMobs()) {
          if (!mob || mob.health <= 0 || mob.hitCooldown > 0) {
            continue;
          }
          const mobDist = distanceToSegment(mob.x, mob.y, tailX, tailY, projectile.x, projectile.y);
          if (mobDist >= mob.radius + hitRadius) {
            continue;
          }
          const damage = Math.max(0, finiteOr(projectile.damage, rivalProjectileDamage));
          const toolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));
          knockMob(mob, dirX, dirY, projectile.rocket ? 170 : 125);
          if (damage > 0) {
            damageMob(mob, damage, projectile.color, mobName(mob) + " hit by your familiar.", {
              sourcePlayerId: projectile.sourcePlayerId || player.id || ""
            });
          }
          if (toolDisable > 0) {
            disableMob(mob, toolDisable, projectile.color);
          }
          sparks.push({
            x: projectile.x,
            y: projectile.y,
            radius: projectile.rocket ? 58 : 38,
            color: projectile.color,
            life: 0.28,
            maxLife: 0.28
          });
          rivalProjectiles.splice(i, 1);
          hitHostile = true;
          break;
        }
        if (hitHostile) {
          continue;
        }
        if (projectile.life <= 0) {
          rivalProjectiles.splice(i, 1);
        }
        continue;
      }

      const shieldBlocker = findProjectileShieldBlocker(tailX, tailY, projectile.x, projectile.y, hitRadius, projectile);
      if (shieldBlocker && activateShieldGeneratorBlock(shieldBlocker.structure, shieldBlocker.body, shieldBlocker.cost, shieldBlocker.x, shieldBlocker.y, projectile.color, projectile.rocket ? 0.24 : 0.16)) {
        rivalProjectiles.splice(i, 1);
        continue;
      }

      let hitStructure = false;
      if (projectile.rocket || projectile.lightning) {
        for (const structure of structures) {
          if (structure.health <= 0 || projectile.lightning && isMobOwnedStructure(structure)) {
            continue;
          }

          const structureDist = distanceToSegment(structure.x, structure.y, tailX, tailY, projectile.x, projectile.y);
          if (structureDist >= structureHitRadius(structure) + hitRadius * 0.72) {
            continue;
          }

          if (projectile.lightning) {
            if (projectile.damage > 0) {
              damageStructure(structure, projectile.damage, projectile.color);
            }
            disableStructure(structure, structureTeslaDisableDuration, projectile.color);
          } else {
            damageStructure(structure, difficultyMobDamage(structureRocketDamage), projectile.color);
          }
          rivalProjectiles.splice(i, 1);
          hitStructure = true;
          break;
        }
      }

      if (hitStructure) {
        continue;
      }

      if (damageSpacecraftComponentFromProjectile(projectile, tailX, tailY, hitRadius)) {
        rivalProjectiles.splice(i, 1);
        continue;
      }

      const blocker = findBlockingLandableBody(tailX, tailY, projectile.x, projectile.y, projectile.radius);

      if (blocker) {
        sparks.push({
          x: blocker.x,
          y: blocker.y,
          radius: 34,
          color: projectile.color,
          life: 0.22,
          maxLife: 0.22
        });
        playSound("mobHit", { throttleKey: "projectileImpact" });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      if (tradeVesselHitBySegment(tailX, tailY, projectile.x, projectile.y, hitRadius, projectile.damage || rivalProjectileDamage, projectile.color)) {
        rivalProjectiles.splice(i, 1);
        continue;
      }

      let hitFamiliar = false;
      for (const familiar of familiarCombatMobs()) {
        if (!familiar || familiar.health <= 0) {
          continue;
        }
        const familiarDist = distanceToSegment(familiar.x, familiar.y, tailX, tailY, projectile.x, projectile.y);
        if (familiarDist >= familiar.radius + hitRadius) {
          continue;
        }
        knockMob(familiar, dirX, dirY, 125);
        damageMob(familiar, Math.max(0, finiteOr(projectile.damage, rivalProjectileDamage)), projectile.color, "Your familiar was hit.");
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 38,
          color: projectile.color,
          life: 0.28,
          maxLife: 0.28
        });
        rivalProjectiles.splice(i, 1);
        hitFamiliar = true;
        break;
      }

      if (hitFamiliar) {
        continue;
      }

      const playerHitScale = projectile.rocket ? 0.86 : 0.72;
      const dist = distanceToPlayerHurtboxSegment(player, tailX, tailY, projectile.x, projectile.y);
      const hitDistance = player.radius * playerHitScale + hitRadius;
      const overlapsPlayer = !isPlayerInsideSpacecraft() && dist < hitDistance;
      const canDamagePlayer = player.hitCooldown <= 0 || (projectile.rocket && player.hitCooldown <= 0.16);
      const damage = Math.max(0, finiteOr(projectile.damage, rivalProjectileDamage));
      const toolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));

      if (overlapsPlayer && (canDamagePlayer || toolDisable > 0)) {
        const nx = dirX;
        const ny = dirY;
        if (player.landed) {
          detachFromBody(160);
        }
        player.vx += nx * 190 + projectile.vx * 0.34;
        player.vy += ny * 190 + projectile.vy * 0.34;
        if (canDamagePlayer && damage > 0) {
          damageLocalPlayer(damage, {
            cause: projectile.cause || "Alienoid laser",
            cooldown: projectile.rocket ? 0.54 : 0.7,
            flash: 0.28
          });
        }
        if (toolDisable > 0) {
          jamLocalPlayerTools(toolDisable);
        }
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 44,
          color: projectile.color,
          life: 0.34,
          maxLife: 0.34
        });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      if (overlapsPlayer && projectile.rocket) {
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 38,
          color: projectile.color,
          life: 0.24,
          maxLife: 0.24
        });
        playSound("mobHit", { throttleKey: "rocketMissileGraze" });
        rivalProjectiles.splice(i, 1);
        continue;
      }

      let hitRemotePlayer = false;
      for (const target of collectRemoteCombatPlayers()) {
        if (!canDamageRemotePlayerFromPve(target.remote)) {
          continue;
        }
        const remotePlayer = target.player;
        const remoteDist = distanceToPlayerHurtboxSegment(remotePlayer, tailX, tailY, projectile.x, projectile.y);
        const remoteHitDistance = (remotePlayer.radius || player.radius) * playerHitScale + hitRadius;

        if (remoteDist >= remoteHitDistance) {
          continue;
        }

        sendRemoteEntityEffect(target.remote, {
          entityType: "player",
          sourceKind: "mob",
          cause: projectile.cause || "Alienoid laser",
          damage: Math.max(0, finiteOr(projectile.damage, rivalProjectileDamage)),
          impulseX: dirX * 190 + projectile.vx * 0.34,
          impulseY: dirY * 190 + projectile.vy * 0.34,
          color: projectile.color,
          toolDisable: Math.max(0, finiteOr(projectile.toolDisable, 0))
        });
        sparks.push({
          x: projectile.x,
          y: projectile.y,
          radius: 44,
          color: projectile.color,
          life: 0.34,
          maxLife: 0.34
        });
        rivalProjectiles.splice(i, 1);
        hitRemotePlayer = true;
        break;
      }

      if (hitRemotePlayer) {
        continue;
      }

      const fromPlayer = Math.hypot(projectile.x - player.x, projectile.y - player.y);
      const cullDistance = Math.max(width, height) * 1.65 + 900;
      if (projectile.life <= 0 || fromPlayer > cullDistance) {
        if (projectile.heatSeeking && projectile.life <= 0) {
          sparks.push({
            x: projectile.x,
            y: projectile.y,
            radius: 86,
            color: projectile.color,
            life: 0.32,
            maxLife: 0.32
          });
          playSound("hit", { throttleKey: "seekingMissileExpire" });
        }
        rivalProjectiles.splice(i, 1);
      }
    }
  }

  function steerHeatSeekingProjectile(projectile, dt) {
    if (!projectile || !projectile.heatSeeking) {
      return;
    }
    const familiarTarget = isPlayerTeamProjectile(projectile)
      ? nearestHostileMobTarget({ x: projectile.x, y: projectile.y })
      : null;
    const target = familiarTarget ? familiarEnemyCombatTarget(familiarTarget.mob) : nearestCombatPlayerTarget(projectile.x, projectile.y);
    const targetPlayer = target && target.player ? target.player : player;
    const currentSpeed = Math.max(80, Math.hypot(projectile.vx, projectile.vy) || finiteOr(projectile.targetSpeed, satelliteMissileSpeed));
    const targetSpeed = Math.max(120, finiteOr(projectile.targetSpeed, satelliteMissileSpeed));
    const leadTime = clamp(Math.hypot(targetPlayer.x - projectile.x, targetPlayer.y - projectile.y) / targetSpeed, 0, 0.58);
    const desiredAngle = Math.atan2(
      targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.48 - projectile.y,
      targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.48 - projectile.x
    );
    const currentAngle = Math.atan2(projectile.vy, projectile.vx);
    const turnRate = Math.max(0.4, finiteOr(projectile.turnRate, satelliteBossSeekingMissileTurnRate));
    const angle = currentAngle + clamp(shortestAngleDelta(currentAngle, desiredAngle), -turnRate * dt, turnRate * dt);
    const nextSpeed = currentSpeed + (targetSpeed - currentSpeed) * (1 - Math.pow(0.04, dt));
    projectile.vx = Math.cos(angle) * nextSpeed;
    projectile.vy = Math.sin(angle) * nextSpeed;
  }
