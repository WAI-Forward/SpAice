  function updatePlayerLasers(dt, options) {
    const relaySharedWorldHits = Boolean(options && options.relaySharedWorldHits);
    for (let i = playerLasers.length - 1; i >= 0; i -= 1) {
      const laser = playerLasers[i];
      laser.life -= dt;
      laser.x += laser.vx * dt;
      laser.y += laser.vy * dt;

      const speed = Math.hypot(laser.vx, laser.vy) || 1;
      const dirX = laser.vx / speed;
      const dirY = laser.vy / speed;
      const tailX = laser.x - dirX * laser.length;
      const tailY = laser.y - dirY * laser.length;
      const ignoredBodyId = Number.isFinite(laser.ignoredBodyId) ? laser.ignoredBodyId : null;
      const blocker = findBlockingLandableBody(tailX, tailY, laser.x, laser.y, laser.radius, ignoredBodyId);
      const piercesMobs = Boolean(laser.piercesMobs);
      const hitMobIds = Array.isArray(laser.hitMobIds) ? laser.hitMobIds : (laser.hitMobIds = []);

      if (blocker) {
        sparks.push({
          x: blocker.x,
          y: blocker.y,
          radius: 30,
          color: laser.color,
          life: 0.2,
          maxLife: 0.2
        });
        playSound("mobHit", { throttleKey: "laserImpact" });
        playerLasers.splice(i, 1);
        continue;
      }

      if (tradeVesselHitBySegment(tailX, tailY, laser.x, laser.y, laser.radius, laser.damage || playerWeaponDefaults.damage, laser.color)) {
        playerLasers.splice(i, 1);
        continue;
      }

      let stoppedByHit = false;
      for (const mob of allCombatMobs()) {
        if (mob.health <= 0 || mob.hitCooldown > 0 || isPlayerTeamMob(mob)) {
          continue;
        }
        const hitMobId = mob.kind + ":" + mob.id;
        if (hitMobIds.includes(hitMobId)) {
          continue;
        }

        const dist = distanceToSegment(mob.x, mob.y, tailX, tailY, laser.x, laser.y);
        if (dist >= mob.radius + laser.radius) {
          continue;
        }

        if (tryFighterShieldBlock(mob, laser, dirX, dirY, { damping: 0.44, minSpeed: 260, pushBack: laser.radius * 3 })) {
          laser.color = shadeColor(mob.color, 36);
          laser.damage = Math.max(8, (laser.damage || playerWeaponDefaults.damage) * 0.45);
          laser.life = Math.min(laser.life, 0.55);
          stoppedByHit = true;
          break;
        }

        const knockback = laser.knockback || 170;
        if (relaySharedWorldHits) {
          sendPartyHostEntityEffect({
            entityType: mob.kind,
            entityId: mob.id,
            sourceKind: "player",
            damage: laser.damage || playerWeaponDefaults.damage,
            impulseX: dirX * knockback,
            impulseY: dirY * knockback,
            color: laser.color
          });
        }
        knockMob(mob, dirX, dirY, knockback);
        damageMob(mob, laser.damage || playerWeaponDefaults.damage, laser.color, laser.hitMessage || mobName(mob) + " dropped by the " + (laser.weaponLabel || playerWeaponDefaults.label) + ".", {
          sourcePlayerId: player.id || ""
        });
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 38,
          color: laser.color,
          life: 0.24,
          maxLife: 0.24
        });
        hitMobIds.push(hitMobId);
        if (!piercesMobs) {
          playerLasers.splice(i, 1);
          stoppedByHit = true;
          break;
        }
      }

      if (stoppedByHit) {
        continue;
      }

      const originX = Number.isFinite(laser.sourceX) ? laser.sourceX : player.x;
      const originY = Number.isFinite(laser.sourceY) ? laser.sourceY : player.y;
      const fromSource = Math.hypot(laser.x - originX, laser.y - originY);
      const cullDistance = Math.max(width, height) * 1.5 + 900;
      if (laser.life <= 0 || fromSource > cullDistance) {
        playerLasers.splice(i, 1);
      }
    }
  }

  function resolveMobBodyCollisions() {
    for (const mob of allCombatMobs()) {
      if (mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }

      for (const particle of particles) {
        if (!particle.tier.solid) {
          continue;
        }
        if (mob.landed && mob.landed.bodyId === particle.id) {
          continue;
        }

        const dx = mob.x - particle.x;
        const dy = mob.y - particle.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = mob.radius + solidBodyContactRadius(particle);

        if (dist >= minDist) {
          continue;
        }

        if (mob.landed) {
          mob.landed = null;
          mob.residentTier = null;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        const bodyShare = clamp(2.6 / (particle.mass + 2.6), 0.006, 0.18);
        const mobShare = 1 - bodyShare;
        const bodySpeed = Math.hypot(particle.vx, particle.vy);
        const mobSpeed = Math.hypot(mob.vx, mob.vy);

        if (
          mob.kind === "fighter" &&
          (bodySpeed > rivalBodyImpactSpeed || (particle.vx * nx + particle.vy * ny) > 40) &&
          tryFighterShieldBlock(mob, particle, nx, ny, { damping: 0.32, minSpeed: 95, pushBack: particle.radius * 0.18 })
        ) {
          mob.x += nx * Math.min(overlap, 18) * 0.5;
          mob.y += ny * Math.min(overlap, 18) * 0.5;
          continue;
        }

        const relativeVelocity = (mob.vx - particle.vx) * nx + (mob.vy - particle.vy) * ny;
        const impactSpeed = Math.max(0, -relativeVelocity);
        const canTriggerBodyDamage = bodySpeed > solidBodyDamageSpeed && mob.hitCooldown <= 0 && canDamageMobWithBody(mob, particle);
        const bodyDashActive = finiteOr(mob.bossBodyEvadeTimer, 0) > 0 && finiteOr(mob.hitCooldown, 0) > 0;
        const correctionDistance = canTriggerBodyDamage
          ? Math.min(overlap, 18)
          : bodyDashActive
            ? Math.min(overlap, 12)
            : overlap;
        mob.x += nx * correctionDistance * mobShare;
        mob.y += ny * correctionDistance * mobShare;
        particle.x -= nx * correctionDistance * bodyShare;
        particle.y -= ny * correctionDistance * bodyShare;

        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.96;
          const pointX = particle.x + nx * bodyAngularInertiaRadius(particle);
          const pointY = particle.y + ny * bodyAngularInertiaRadius(particle);
          mob.vx += nx * impulse * 0.86;
          mob.vy += ny * impulse * 0.86;
          applyBodyVelocityChangeAtPoint(particle, -nx * impulse * bodyShare, -ny * impulse * bodyShare, pointX, pointY, bodyConstraintTorqueResponse);
        }

        if (
          mob.kind === "rambot" &&
          mob.impactCooldown <= 0 &&
          (mob.chargeTimer > 0 || mobSpeed > rambotBodyImpactSpeed) &&
          impactSpeed > rambotBodyImpactSpeed * 0.45
        ) {
          damageBodyWithRambot(mob, particle, nx, ny, Math.max(mobSpeed, impactSpeed));
        }

        if (canTriggerBodyDamage) {
          const impactSpeedForDamage = Math.max(bodySpeed, impactSpeed);
          const damage = solidBodyImpactDamage(particle, impactSpeedForDamage, 18);
          markMobDamagedByBody(mob, particle);
          knockMob(mob, nx, ny, bodyImpactKnockbackForce(particle, impactSpeedForDamage));
          triggerBossBodyEvade(mob, particle, nx, ny, impactSpeedForDamage);
          if (damageMob(mob, damage, particle.color, mobName(mob) + " crushed by " + particle.tier.article + " " + particle.tier.name + ".", {
            sourcePlayerId: particle.survivalCampLastMoverPlayerId || "",
            notification: bodyDefeatNotificationOptions(mob, particle, "crushed")
          })) {
            break;
          }
        }
      }
    }
  }

  function mobProjectileSourceFields(mob) {
    return {
      team: isPlayerTeamMob(mob) ? "player" : "",
      sourceMobId: mob && mob.id ? mob.id : 0
    };
  }

  function isPlayerTeamProjectile(projectile) {
    return Boolean(projectile && projectile.team === "player");
  }

  function fireRivalLaser(rival, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / rivalProjectileSpeed, 0, 1.35);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.72;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.72;
    const aim = normalize(targetX - rival.x, targetY - rival.y);
    const muzzleDistance = rival.radius + 18;
    const laserColor = shadeColor(rival.color, 64);

    const bossShotOffsets = rival.isBoss ? [-13, 13] : [0];
    for (const offset of bossShotOffsets) {
      const normalX = -aim.y;
      const normalY = aim.x;
      rivalProjectiles.push({
        id: nextRivalProjectileId++,
        x: rival.x + aim.x * muzzleDistance + normalX * offset,
        y: rival.y + aim.y * muzzleDistance + normalY * offset,
        vx: aim.x * (rivalProjectileSpeed + (rival.isBoss ? 60 : 0)) + rival.vx * 0.18,
        vy: aim.y * (rivalProjectileSpeed + (rival.isBoss ? 60 : 0)) + rival.vy * 0.18,
        radius: rival.isBoss ? 7 : 5,
        length: randomRange(rival.isBoss ? 48 : 34, rival.isBoss ? 64 : 46),
        color: laserColor,
      life: rival.isBoss ? 2.75 : 2.38,
      maxLife: rival.isBoss ? 2.75 : 2.38,
        damage: difficultyMobDamage(bossScaledDamage(rival, rivalProjectileDamage)),
        toolDisable: 0,
        cause: rival.isBoss ? "Alienoid boss laser" : "Alienoid laser",
        ...mobProjectileSourceFields(rival),
        targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : ""
      });
    }

    sparks.push({
      x: rival.x + aim.x * muzzleDistance,
      y: rival.y + aim.y * muzzleDistance,
      radius: 28,
      color: rival.color,
      life: 0.18,
      maxLife: 0.18
    });

    playSound("enemyLaser");
    rival.shootCooldown = randomRange(4.5, 7.25) * bossCooldownScale(rival);
    rival.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
  }

  function fireTeslaLightning(tesla, target, dist) {
    const targetEntity = target && target.kind === "structure" ? target : (target && target.player ? target.player : target && target.target && target.target.player ? target.target.player : player);
    const leadTime = clamp(dist / 1120, 0, 0.65);
    const aim = normalize(
      targetEntity.x + finiteOr(targetEntity.vx, 0) * leadTime * 0.42 - tesla.x,
      targetEntity.y + finiteOr(targetEntity.vy, 0) * leadTime * 0.42 - tesla.y
    );
    const color = { r: 157, g: 255, b: 122 };
    const muzzleDistance = tesla.radius + 12;

    rivalProjectiles.push({
      id: nextRivalProjectileId++,
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      vx: aim.x * 1120 + tesla.vx * 0.08,
      vy: aim.y * 1120 + tesla.vy * 0.08,
      radius: 8,
      length: randomRange(tesla.isBoss ? 108 : 76, tesla.isBoss ? 142 : 104),
      color,
      life: 0.64,
      maxLife: 0.64,
      damage: tesla.isBoss ? difficultyMobDamage(bossScaledDamage(tesla, teslaLightningDamage)) : 0,
      toolDisable: teslaToolDisableDuration * (tesla.isBoss ? 1.45 : 1),
      cause: tesla.isBoss ? "Tesla boss lightning" : "Tesla lightning",
      ...mobProjectileSourceFields(tesla),
      lightning: true,
      targetStructureId: target && target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target && target.target && !target.target.local && target.target.remote ? target.target.remote.playerId : ""
    });

    tesla.shootCooldown = randomRange(2.3, 3.8) * bossCooldownScale(tesla);
    tesla.lightningFlash = 0.32;
    tesla.lightningWarmup = 0;
    tesla.lightningAngle = Math.atan2(aim.y, aim.x);
    tesla.rotation = tesla.lightningAngle + Math.PI / 2;

    sparks.push({
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      radius: 42,
      color,
      life: 0.24,
      maxLife: 0.24
    });
    playSound("lightning");
  }

  function fireRocketMissile(rocket, target) {
    const targetEntity = target && target.kind === "structure" ? target : (target && target.player ? target.player : target && target.target && target.target.player ? target.target.player : player);
    const targetX = Number.isFinite(rocket.lockX) ? rocket.lockX : targetEntity.x;
    const targetY = Number.isFinite(rocket.lockY) ? rocket.lockY : targetEntity.y;
    const aim = normalize(targetX - rocket.x, targetY - rocket.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const side = rocket.volleyShots % 2 === 0 ? 1 : -1;
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 18;

    rivalProjectiles.push({
      id: nextRivalProjectileId++,
      x: rocket.x + aim.x * muzzleDistance + normalX * side * 17,
      y: rocket.y + aim.y * muzzleDistance + normalY * side * 17,
      vx: aim.x * satelliteMissileSpeed + rocket.vx * 0.12,
      vy: aim.y * satelliteMissileSpeed + rocket.vy * 0.12,
      radius: rocket.isBoss ? 13 : 10,
      length: randomRange(rocket.isBoss ? 58 : 42, rocket.isBoss ? 72 : 54),
      color,
      life: 2.62,
      maxLife: 2.62,
      damage: difficultyMobDamage(bossScaledDamage(rocket, satelliteMissileDamage)),
      toolDisable: 0,
      cause: rocket.isBoss ? "Satellite boss missile" : "Satellite missile",
      ...mobProjectileSourceFields(rocket),
      rocket: true,
      targetStructureId: target && target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target && target.target && !target.target.local && target.target.remote ? target.target.remote.playerId : ""
    });

    rocket.blastTimer = 0.18;
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;

    sparks.push({
      x: rocket.x + aim.x * muzzleDistance,
      y: rocket.y + aim.y * muzzleDistance,
      radius: 34,
      color,
      life: 0.2,
      maxLife: 0.2
    });
    playSound("missile");
  }

  function fireSatelliteBossSeekingMissiles(rocket, playerTarget) {
    if (!rocket || !rocket.isBoss) {
      return;
    }
    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    const toTarget = normalize(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const baseAngle = Math.atan2(toTarget.y, toTarget.x);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 22;

    for (let i = 0; i < satelliteBossSeekingMissileCount; i += 1) {
      const lineT = satelliteBossSeekingMissileCount <= 1 ? 0 : i / (satelliteBossSeekingMissileCount - 1) * 2 - 1;
      const angle = baseAngle + lineT * 0.46;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const sideX = -toTarget.y;
      const sideY = toTarget.x;
      rivalProjectiles.push({
        id: nextRivalProjectileId++,
        x: rocket.x + toTarget.x * muzzleDistance + sideX * lineT * 28,
        y: rocket.y + toTarget.y * muzzleDistance + sideY * lineT * 28,
        vx: dirX * satelliteBossSeekingMissileSpeed + rocket.vx * 0.1,
        vy: dirY * satelliteBossSeekingMissileSpeed + rocket.vy * 0.1,
        radius: 12,
        length: randomRange(62, 80),
        color,
        life: satelliteBossSeekingMissileLife,
        maxLife: satelliteBossSeekingMissileLife,
        damage: difficultyMobDamage(bossScaledDamage(rocket, satelliteMissileDamage * 0.82)),
        toolDisable: 0,
        cause: "Satellite boss heat-seeking missile",
        ...mobProjectileSourceFields(rocket),
        rocket: true,
        heatSeeking: true,
        targetSpeed: satelliteMissileSpeed * 0.94,
        turnRate: satelliteBossSeekingMissileTurnRate,
        targetPlayerId: playerTarget && !playerTarget.local && playerTarget.remote ? playerTarget.remote.playerId : ""
      });
    }

    rocket.blastTimer = 0.28;
    rocket.blastDirX = toTarget.x;
    rocket.blastDirY = toTarget.y;
    rocket.rotation = baseAngle + Math.PI / 2;
    rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.48);
    rocket.scanProgress = Math.max(0, finiteOr(rocket.scanProgress, 0) - 0.35);
    resetBossAltAttackCooldown(rocket);

    sparks.push({
      x: rocket.x + toTarget.x * muzzleDistance,
      y: rocket.y + toTarget.y * muzzleDistance,
      radius: 58,
      color,
      life: 0.28,
      maxLife: 0.28
    });
    playSound("missile");
  }

  function fireFighterGuns(fighter, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / rivalProjectileSpeed, 0, 1.15);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.62;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.62;
    const aim = normalize(targetX - fighter.x, targetY - fighter.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const color = shadeColor(fighter.color, 46);

    for (const side of (fighter.isBoss ? [-1.45, 0, 1.45] : [-1, 1])) {
      rivalProjectiles.push({
        id: nextRivalProjectileId++,
        x: fighter.x + aim.x * (fighter.radius + 16) + normalX * side * 19,
        y: fighter.y + aim.y * (fighter.radius + 16) + normalY * side * 19,
        vx: aim.x * (rivalProjectileSpeed + 60) + fighter.vx * 0.14,
        vy: aim.y * (rivalProjectileSpeed + 60) + fighter.vy * 0.14,
        radius: 5,
        length: randomRange(38, 50),
        color,
        life: 2.18,
        maxLife: 2.18,
        damage: difficultyMobDamage(bossScaledDamage(fighter, 9)),
        toolDisable: 0,
        cause: fighter.isBoss ? "Fighter boss cannon" : "Fighter cannon",
        ...mobProjectileSourceFields(fighter),
        targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : ""
      });
    }

    fighter.shootCooldown = randomRange(2.2, 3.4) * bossCooldownScale(fighter);
    fighter.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
    playSound("fighter");
  }
