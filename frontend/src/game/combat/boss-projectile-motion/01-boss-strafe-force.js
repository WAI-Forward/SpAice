  function bossStrafeForce(mob, baseForce) {
    if (mob && mob.isBoss) {
      return baseForce * 1.35 * bossStatScaleForStars(bossStarRank(mob), mobBossStarForceMultiplier);
    }
    return baseForce * mobEliteStatScale(mob, mobEliteForceMultiplier);
  }

  function isMobDisabled(mob) {
    return Boolean(mob && finiteOr(mob.disabledTimer, 0) > 0);
  }

  function disableMob(mob, duration, color) {
    if (!mob || mob.health <= 0) {
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

    if (color) {
      sparks.push({
        x: mob.x,
        y: mob.y,
        radius: mob.radius * 1.55,
        color,
        life: 0.24,
        maxLife: 0.24
      });
    }
    return true;
  }

  function updateDisabledMobDrift(mob, dt) {
    mob.vx *= Math.pow(0.42, dt);
    mob.vy *= Math.pow(0.42, dt);
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.lightningWarmup = 0;
    mob.scanProgress = 0;
    mob.shieldActive = 0;
    mob.rotation += Math.sin(performance.now() * 0.003 + finiteOr(mob.wobble, 0)) * 0.08 * dt;
  }

  function emitEmpPulseEffect(x, y, radius, color, life) {
    sparks.push({
      x,
      y,
      radius,
      color,
      life,
      maxLife: life,
      empPulse: true
    });
  }

  function applyEmpPulse(x, y, radius, duration, options) {
    const settings = options && typeof options === "object" ? options : {};
    const color = settings.color || { r: 126, g: 232, b: 255 };
    const range = Math.max(1, finiteOr(radius, empPulseRange));
    const disableDuration = Math.max(0, finiteOr(duration, empPulseDisableDuration));
    let affected = 0;

    emitEmpPulseEffect(x, y, range, color, 0.72);

    if (settings.affectMobs !== false) {
      for (const mob of allCombatMobs()) {
        if (!mob || mob === settings.sourceMob || mob.health <= 0 || isPlayerTeamMob(mob)) {
          continue;
        }
        const distance = Math.hypot(mob.x - x, mob.y - y);
        if (distance <= range + finiteOr(mob.radius, 0) * 0.75 && disableMob(mob, disableDuration, color)) {
          affected += 1;
          const away = normalize(mob.x - x, mob.y - y);
          knockMob(mob, away.x, away.y, 95);
        }
      }
    }

    if (settings.affectStructures) {
      for (const structure of structures) {
        if (!structure || structure.health <= 0) {
          continue;
        }
        const distance = Math.hypot(structure.x - x, structure.y - y);
        if (distance <= range + structureHitRadius(structure)) {
          disableStructure(structure, disableDuration, color);
          affected += 1;
        }
      }
    }

    if (settings.affectPlayers) {
      if (!deathState.active && player.health > 0 && !isPlayerInsideSpacecraft()) {
        const distance = Math.hypot(player.x - x, player.y - y);
        if (distance <= range + player.radius) {
          jamLocalPlayerTools(disableDuration);
          const away = normalize(player.x - x, player.y - y);
          player.vx += away.x * 180;
          player.vy += away.y * 180;
          affected += 1;
        }
      }
      for (const target of collectRemoteCombatPlayers()) {
        const remotePlayer = target && target.player;
        if (!remotePlayer || !target.remote || !canDamageRemotePlayerFromPve(target.remote)) {
          continue;
        }
        const distance = Math.hypot(remotePlayer.x - x, remotePlayer.y - y);
        if (distance <= range + (remotePlayer.radius || player.radius)) {
          const away = normalize(remotePlayer.x - x, remotePlayer.y - y);
          sendRemoteEntityEffect(target.remote, {
            entityType: "player",
            sourceKind: "mob",
            cause: settings.cause || "EMP pulse",
            damage: 0,
            impulseX: away.x * 180,
            impulseY: away.y * 180,
            toolDisable: disableDuration,
            color
          });
          affected += 1;
        }
      }
    }

    playSound("lightning", { throttleKey: "empPulse", throttle: 0.35, volume: 0.82 });
    return affected;
  }

  function tickBossAltAttackCooldown(mob, dt) {
    if (!mob || !mob.isBoss) {
      return false;
    }
    mob.altAttackCooldown = finiteOr(
      mob.altAttackCooldown,
      randomRange(mobBossAltAttackCooldownMin, mobBossAltAttackCooldownMax) * bossCooldownScale(mob)
    ) - dt;
    return mob.altAttackCooldown <= 0;
  }

  function resetBossAltAttackCooldown(mob) {
    if (mob && mob.isBoss) {
      mob.altAttackCooldown = randomRange(mobBossAltAttackCooldownMin, mobBossAltAttackCooldownMax) * bossCooldownScale(mob);
    }
  }

  function bossChaseMaxSpeed(mob, baseMaxSpeed, desiredX, desiredY) {
    if (!mob) {
      return baseMaxSpeed;
    }
    let chaseMaxSpeed = baseMaxSpeed;
    if (mob.isBoss) {
      const speed = Math.hypot(finiteOr(mob.vx, 0), finiteOr(mob.vy, 0));
      const desiredLength = Math.hypot(finiteOr(desiredX, 0), finiteOr(desiredY, 0));
      const alignment = speed > 8 && desiredLength > 0.001
        ? clamp((mob.vx / speed) * (desiredX / desiredLength) + (mob.vy / speed) * (desiredY / desiredLength), 0, 1)
        : 0;
      const sustainedMotion = clamp((speed - baseMaxSpeed * 0.45) / Math.max(1, baseMaxSpeed * 0.9), 0, 1);
      chaseMaxSpeed = baseMaxSpeed *
        (mobBossMaxSpeedMultiplier + mobBossDirectionalSpeedBonus * alignment * sustainedMotion) *
        bossStatScaleForStars(bossStarRank(mob), mobBossStarSpeedMultiplier);
    } else {
      chaseMaxSpeed = baseMaxSpeed * mobEliteStatScale(mob, mobEliteSpeedMultiplier);
    }
    if (finiteOr(mob.bossBodyEvadeTimer, 0) > 0) {
      return Math.max(chaseMaxSpeed, clamp(finiteOr(mob.bossBodyEvadeSpeedCap, 0), chaseMaxSpeed, bossBodyEvadeMaxSpeed));
    }
    return chaseMaxSpeed;
  }

  function isMobSpawnRestActive() {
    return mobSpawnRestTimer > 0 || mobSpawnRestDrainTimer > 0;
  }

  function updateBossSpawnPressure(mob, dt) {
    if (!mob || !mob.isBoss || mob.health <= 0) {
      return;
    }
    if (isMobSpawnRestActive()) {
      return;
    }
    const interval = difficultyMobWaveInterval();
    mobWaveTimer = Math.min(finiteOr(mobWaveTimer, interval), interval * mobBossSpawnTimerCeilingScale);
  }

  function hasClearShotAtCombatTarget(rival, target) {
    const ignoredBodyId = rival.landed ? rival.landed.bodyId : null;
    const targetPlayer = target && target.player ? target.player : player;
    return !findBlockingLandableBody(
      rival.x,
      rival.y,
      targetPlayer.x,
      targetPlayer.y,
      (targetPlayer.radius || player.radius) * 0.18,
      ignoredBodyId
    );
  }

  function hasClearShotAtMob(x, y, mob, ignoredBodyId) {
    return !findBlockingLandableBody(x, y, mob.x, mob.y, mob.radius * 0.2, ignoredBodyId);
  }

  function fireAlienoidBossShotgunBlast(rival, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / rivalProjectileSpeed, 0, 1.2);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.6;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.6;
    const aim = normalize(targetX - rival.x, targetY - rival.y);
    const aimAngle = Math.atan2(aim.y, aim.x);
    const muzzleDistance = rival.radius + 20;
    const pelletCount = 9;
    const spread = 0.28;
    const laserColor = shadeColor(rival.color, 82);
    const targetPlayerId = target && !target.local && target.remote ? target.remote.playerId : "";

    for (let i = 0; i < pelletCount; i += 1) {
      const lineT = pelletCount <= 1 ? 0 : i / (pelletCount - 1) * 2 - 1;
      const clusteredT = Math.sign(lineT) * Math.pow(Math.abs(lineT), 1.35);
      const angleOffset = clusteredT * spread + randomRange(-0.04, 0.04);
      const dirX = Math.cos(aimAngle + angleOffset);
      const dirY = Math.sin(aimAngle + angleOffset);
      const sideX = -dirY;
      const sideY = dirX;
      const muzzleScatter = randomRange(-12, 12);
      const forwardScatter = randomRange(-5, 9);
      const pelletSpeed = rivalProjectileSpeed + randomRange(45, 175);
      const pelletLife = randomRange(1.28, 1.82);
      rivalProjectiles.push({
        id: nextRivalProjectileId++,
        x: rival.x + dirX * (muzzleDistance + forwardScatter) + sideX * muzzleScatter,
        y: rival.y + dirY * (muzzleDistance + forwardScatter) + sideY * muzzleScatter,
        vx: dirX * pelletSpeed + rival.vx * 0.12,
        vy: dirY * pelletSpeed + rival.vy * 0.12,
        radius: randomRange(4.4, 6.2),
        length: randomRange(32, 54),
        color: laserColor,
        life: pelletLife,
        maxLife: pelletLife,
        damage: difficultyMobDamage(bossScaledDamage(rival, rivalProjectileDamage * 0.42)),
        toolDisable: 0,
        cause: "Alienoid boss shotgun blast",
        ...mobProjectileSourceFields(rival),
        targetPlayerId
      });
    }

    sparks.push({
      x: rival.x + aim.x * muzzleDistance,
      y: rival.y + aim.y * muzzleDistance,
      radius: 42,
      color: rival.color,
      life: 0.22,
      maxLife: 0.22
    });
    playSound("enemyLaser", { throttleKey: "alienoidBossShotgun:" + rival.id, throttle: 0.35 });
    rival.rotation = aimAngle + Math.PI / 2;
    resetBossAltAttackCooldown(rival);
  }

  function findTurretTarget(turret) {
    if (isSurvivalCampStructure(turret)) {
      return findCampStructurePlayerTarget(turret, turretRange);
    }

    let best = null;
    let bestDistance = Infinity;

    for (const mob of allCombatMobs()) {
      if (mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }

      const distance = Math.hypot(mob.x - turret.x, mob.y - turret.y);
      if (distance > turretRange || distance >= bestDistance) {
        continue;
      }

      const normalX = Math.cos(turret.angle);
      const normalY = Math.sin(turret.angle);
      const aboveSurface = (mob.x - turret.x) * normalX + (mob.y - turret.y) * normalY;
      if (aboveSurface < -mob.radius * 0.2) {
        continue;
      }

      if (!hasClearShotAtMob(turret.x, turret.y, mob, turret.bodyId)) {
        continue;
      }

      best = mob;
      bestDistance = distance;
    }

    return best;
  }

  function survivalCampStructureIsAggro(structure) {
    return Boolean(structure && isSurvivalCampStructure(structure) && finiteOr(structure.survivalCampAggroTimer, 0) > 0);
  }

  function campStructureCanSeePlayer(structure, target) {
    const targetPlayer = target && target.player;
    if (!structure || !targetPlayer) {
      return false;
    }
    const normalX = Math.cos(structure.angle);
    const normalY = Math.sin(structure.angle);
    const aboveSurface = (targetPlayer.x - structure.x) * normalX + (targetPlayer.y - structure.y) * normalY;
    if (aboveSurface < -Math.max(player.radius, finiteOr(targetPlayer.radius, player.radius)) * 0.2) {
      return false;
    }
    return !findBlockingLandableBody(
      structure.x,
      structure.y,
      targetPlayer.x,
      targetPlayer.y,
      Math.max(4, finiteOr(targetPlayer.radius, player.radius) * 0.18),
      structure.bodyId
    );
  }

  function findCampStructurePlayerTarget(structure, maxRange) {
    if (!survivalCampStructureIsAggro(structure)) {
      return null;
    }

    const preferredTargetId = String(structure.survivalTargetPlayerId || "");
    if (!preferredTargetId) {
      return null;
    }
    let best = null;
    let bestDistance = Infinity;
    for (const target of collectCombatPlayerTargets()) {
      const targetPlayer = target && target.player;
      if (!targetPlayer || targetPlayer.health <= 0 || target.familiarEnemy) {
        continue;
      }
      const targetId = target.local ? String(player.id || "") : String(target.remote && target.remote.playerId || targetPlayer.id || "");
      const distance = Math.hypot(targetPlayer.x - structure.x, targetPlayer.y - structure.y);
      const preferredBonus = preferredTargetId && targetId === preferredTargetId ? 0.72 : 1;
      const scoreDistance = distance * preferredBonus;
      if (distance > maxRange || scoreDistance >= bestDistance || !campStructureCanSeePlayer(structure, target)) {
        continue;
      }
      best = {
        ...targetPlayer,
        player: targetPlayer,
        combatTarget: target,
        local: Boolean(target.local),
        remote: target.remote || null
      };
      bestDistance = scoreDistance;
    }
    return best;
  }

  function fireTurretLaser(turret, target, dist) {
    if (isSurvivalCampStructure(turret)) {
      fireCampTurretLaser(turret, target, dist);
      return;
    }

    const leadTime = clamp(dist / turretLaserSpeed, 0, 1.1);
    const targetX = target.x + target.vx * leadTime * 0.52;
    const targetY = target.y + target.vy * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;

    playerLasers.push({
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * turretLaserSpeed,
      vy: aim.y * turretLaserSpeed,
      radius: 4,
      length: 38,
      color,
      life: 1.15,
      maxLife: 1.15,
      damage: turretLaserDamage,
      knockback: turretLaserKnockback,
      hitMessage: mobName(target) + " dropped by a turret.",
      sourceX: turret.x,
      sourceY: turret.y,
      ignoredBodyId: turret.bodyId
    });

    sparks.push({
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      radius: 28,
      color,
      life: 0.16,
      maxLife: 0.16
    });

    playSound("turret");
    turret.shootCooldown = turretShootCooldown;
  }

  function fireCampTurretLaser(turret, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / turretLaserSpeed, 0, 1.1);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.52;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;

    rivalProjectiles.push({
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * turretLaserSpeed,
      vy: aim.y * turretLaserSpeed,
      radius: 4,
      length: 38,
      color,
      life: 1.15,
      maxLife: 1.15,
      damage: turretLaserDamage,
      knockback: turretLaserKnockback,
      cause: "Camp turret",
      sourceStructureId: turret.id,
      targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : "",
      ignoredBodyId: turret.bodyId
    });

    sparks.push({
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      radius: 28,
      color,
      life: 0.16,
      maxLife: 0.16
    });

    playSound("turret");
    turret.shootCooldown = turretShootCooldown;
  }

  function launcherCanSeeMob(structure, mob) {
    const normalX = Math.cos(structure.angle);
    const normalY = Math.sin(structure.angle);
    const aboveSurface = (mob.x - structure.x) * normalX + (mob.y - structure.y) * normalY;
    return aboveSurface > -mob.radius * 0.25;
  }

  function findMobCluster(originX, originY, maxRange, options) {
    const settings = options || {};
    const sourceStructure = settings.structure || null;
    const preferredX = Number.isFinite(settings.preferredX) ? settings.preferredX : Number.NaN;
    const preferredY = Number.isFinite(settings.preferredY) ? settings.preferredY : Number.NaN;
    const minCount = Math.max(1, Math.floor(finiteOr(settings.minCount, missileLauncherMinClusterSize)));
    const clusterRadius = Math.max(40, finiteOr(settings.clusterRadius, missileLauncherClusterRadius));
    const mobs = allCombatMobs().filter((mob) => {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        return false;
      }
      if (sourceStructure && !launcherCanSeeMob(sourceStructure, mob)) {
        return false;
      }
      return Math.hypot(mob.x - originX, mob.y - originY) <= maxRange + clusterRadius;
    });
    let best = null;
    let bestScore = -Infinity;

    for (const anchor of mobs) {
      const members = [];
      for (const mob of mobs) {
        if (Math.hypot(mob.x - anchor.x, mob.y - anchor.y) <= clusterRadius) {
          members.push(mob);
        }
      }
      if (members.length < minCount) {
        continue;
      }

      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      let healthWeight = 0;
      for (const mob of members) {
        const weight = clamp(finiteOr(mob.health, 1) / Math.max(1, finiteOr(mob.maxHealth, mob.health || 1)), 0.35, 1.25);
        x += mob.x * weight;
        y += mob.y * weight;
        vx += finiteOr(mob.vx, 0) * weight;
        vy += finiteOr(mob.vy, 0) * weight;
        healthWeight += weight;
      }
      x /= Math.max(0.001, healthWeight);
      y /= Math.max(0.001, healthWeight);
      vx /= Math.max(0.001, healthWeight);
      vy /= Math.max(0.001, healthWeight);

      const distance = Math.hypot(x - originX, y - originY);
      if (distance > maxRange + clusterRadius * 0.35) {
        continue;
      }
      if (sourceStructure && !hasClearShotAtMob(sourceStructure.x, sourceStructure.y, { x, y, radius: 22 }, sourceStructure.bodyId)) {
        continue;
      }

      let spread = 0;
      for (const mob of members) {
        spread += Math.hypot(mob.x - x, mob.y - y);
      }
      spread /= members.length;

      const preferredDistance = Number.isFinite(preferredX) && Number.isFinite(preferredY)
        ? Math.hypot(x - preferredX, y - preferredY)
        : 0;
      const score = members.length * 1000 - spread * 1.35 - distance * 0.18 - preferredDistance * 0.48;
      if (score > bestScore) {
        bestScore = score;
        best = {
          x,
          y,
          vx,
          vy,
          count: members.length,
          radius: clusterRadius,
          members
        };
      }
    }

    return best;
  }
