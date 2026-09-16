  function fireLauncherMissile(structure, cluster) {
    const leadTime = clamp(Math.hypot(cluster.x - structure.x, cluster.y - structure.y) / launcherMissileSpeed, 0, 1.2);
    const targetX = cluster.x + finiteOr(cluster.vx, 0) * leadTime * 0.36;
    const targetY = cluster.y + finiteOr(cluster.vy, 0) * leadTime * 0.36;
    const aim = normalize(targetX - structure.x, targetY - structure.y);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = 48;

    launcherMissiles.push({
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      vx: aim.x * launcherMissileSpeed,
      vy: aim.y * launcherMissileSpeed,
      radius: 11,
      length: 58,
      color,
      life: launcherMissileLife,
      maxLife: launcherMissileLife,
      damage: launcherMissileDamage,
      rocket: true,
      targetX,
      targetY,
      targetCount: cluster.count,
      ignoredBodyId: structure.bodyId
    });

    structure.missileCharge = 0;
    structure.lockTimer = 0;
    structure.beepTimer = 0;
    structure.targetX = targetX;
    structure.targetY = targetY;
    structure.targetCount = cluster.count;
    structure.deploy = 1;
    structure.aimAngle = Math.atan2(aim.y, aim.x);

    sparks.push({
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      radius: 42,
      color,
      life: 0.24,
      maxLife: 0.24
    });
    playSound("missile");
  }

  function updateMissileLauncher(structure, dt) {
    const body = bodyById(structure.bodyId);
    structure.missileCharge = clamp(finiteOr(structure.missileCharge, 0) + dt / missileLauncherProductionTime, 0, 1);
    structure.lockTimer = Math.max(0, finiteOr(structure.lockTimer, 0) - dt);
    structure.beepTimer = Math.max(0, finiteOr(structure.beepTimer, 0) - dt);

    const ready = structure.missileCharge >= 1;
    if (!ready) {
      structure.targetCount = 0;
      structure.deploy = clamp((structure.deploy || 0) + dt * 1.2, 0, 0.58 + structure.missileCharge * 0.28);
      structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, structure.angle), -1.7 * dt, 1.7 * dt);
      return;
    }

    if (isSurvivalCampStructure(structure)) {
      updateCampMissileLauncher(structure, body, dt);
      return;
    }

    const cluster = findMobCluster(structure.x, structure.y, missileLauncherRange, { structure });
    if (!cluster) {
      structure.targetCount = 0;
      structure.lockTimer = 0;
      structure.deploy = clamp((structure.deploy || 0) + dt * 1.6, 0, 0.9);
      structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, structure.angle), -1.9 * dt, 1.9 * dt);
      return;
    }

    structure.targetX = cluster.x;
    structure.targetY = cluster.y;
    structure.targetCount = cluster.count;
    const targetAngle = Math.atan2(cluster.y - structure.y, cluster.x - structure.x);
    structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, targetAngle), -3.4 * dt, 3.4 * dt);
    structure.deploy = clamp((structure.deploy || 0) + dt * 3.4, 0, 1);

    if (structure.lockTimer <= 0) {
      structure.lockTimer = missileLauncherLockDuration;
      structure.beepTimer = 0;
      playSound("lock", { throttleKey: "launcherLock:" + structure.id, throttle: 0.08 });
      return;
    }

    if (structure.beepTimer <= 0) {
      structure.beepTimer = 0.2;
      playSound("lock", { throttleKey: "launcherBeep:" + structure.id, throttle: 0.08, volume: 0.82 });
    }

    if (structure.lockTimer <= dt * 1.05 && canSpendBodyEnergy(body, missileLauncherEnergyCost)) {
      spendBodyEnergy(body, missileLauncherEnergyCost);
      fireLauncherMissile(structure, cluster);
    }
  }

  function fireCampLauncherMissile(structure, target) {
    const targetPlayer = target && target.player ? target.player : player;
    const dist = Math.hypot(targetPlayer.x - structure.x, targetPlayer.y - structure.y);
    const leadTime = clamp(dist / launcherMissileSpeed, 0, 1.2);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.34;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.34;
    const aim = normalize(targetX - structure.x, targetY - structure.y);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = 48;

    rivalProjectiles.push({
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      vx: aim.x * launcherMissileSpeed,
      vy: aim.y * launcherMissileSpeed,
      radius: 10,
      length: 54,
      color,
      life: 2.85,
      maxLife: 2.85,
      damage: launcherMissileDamage,
      knockback: launcherMissileKnockback,
      cause: "Camp missile launcher",
      rocket: true,
      targetX,
      targetY,
      targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : "",
      targetStructureId: 0,
      sourceStructureId: structure.id,
      ignoredBodyId: structure.bodyId
    });

    structure.missileCharge = 0;
    structure.lockTimer = 0;
    structure.beepTimer = 0;
    structure.targetX = targetX;
    structure.targetY = targetY;
    structure.targetCount = 1;
    structure.deploy = 1;
    structure.aimAngle = Math.atan2(aim.y, aim.x);
    sparks.push({
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      radius: 42,
      color,
      life: 0.24,
      maxLife: 0.24
    });
    playSound("missile");
  }

  function updateCampMissileLauncher(structure, body, dt) {
    const target = findCampStructurePlayerTarget(structure, missileLauncherRange);
    if (!target) {
      structure.targetCount = 0;
      structure.lockTimer = 0;
      structure.deploy = clamp((structure.deploy || 0) + dt * 1.6, 0, 0.9);
      structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, structure.angle), -1.9 * dt, 1.9 * dt);
      return;
    }

    const targetPlayer = target.player;
    structure.targetX = targetPlayer.x;
    structure.targetY = targetPlayer.y;
    structure.targetCount = 1;
    const targetAngle = Math.atan2(targetPlayer.y - structure.y, targetPlayer.x - structure.x);
    structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, targetAngle), -3.4 * dt, 3.4 * dt);
    structure.deploy = clamp((structure.deploy || 0) + dt * 3.4, 0, 1);

    if (structure.lockTimer <= 0) {
      structure.lockTimer = missileLauncherLockDuration;
      structure.beepTimer = 0;
      playSound("lock", { throttleKey: "campLauncherLock:" + structure.id, throttle: 0.08 });
      return;
    }

    if (structure.beepTimer <= 0) {
      structure.beepTimer = 0.2;
      playSound("lock", { throttleKey: "campLauncherBeep:" + structure.id, throttle: 0.08, volume: 0.82 });
    }

    if (structure.lockTimer <= dt * 1.05 && canSpendBodyEnergy(body, missileLauncherEnergyCost)) {
      spendBodyEnergy(body, missileLauncherEnergyCost);
      fireCampLauncherMissile(structure, target);
    }
  }

  function explodeLauncherMissile(missile, x, y) {
    const color = missile.color || { r: 255, g: 184, b: 88 };
    let hits = 0;

    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      const dist = Math.hypot(mob.x - x, mob.y - y);
      const edgeDistance = Math.max(0, dist - mob.radius * 0.45);
      if (edgeDistance > launcherMissileAoERadius) {
        continue;
      }

      const falloff = 1 - edgeDistance / launcherMissileAoERadius;
      const nx = dist > 0 ? (mob.x - x) / dist : randomRange(-1, 1);
      const ny = dist > 0 ? (mob.y - y) / dist : randomRange(-1, 1);
      knockMob(mob, nx, ny, launcherMissileKnockback * (0.32 + falloff * 0.68));
      damageMob(mob, launcherMissileDamage * (0.42 + falloff * 0.58), color, mobName(mob) + " caught in a missile blast.", {
        sourcePlayerId: player.id || ""
      });
      hits += 1;
    }

    sparks.push({
      x,
      y,
      radius: launcherMissileAoERadius * 0.68,
      color,
      life: 0.38,
      maxLife: 0.38
    });
    sparks.push({
      x,
      y,
      radius: launcherMissileAoERadius * 1.08,
      color: { r: 255, g: 115, b: 173 },
      life: 0.28,
      maxLife: 0.28
    });
    playSound(hits > 0 ? "mobDestroyed" : "hit", { throttleKey: "launcherExplosion" });
  }

  function updateLauncherMissiles(dt) {
    for (let i = launcherMissiles.length - 1; i >= 0; i -= 1) {
      const missile = launcherMissiles[i];
      const previousX = missile.x;
      const previousY = missile.y;
      missile.life = Math.max(0, finiteOr(missile.life, launcherMissileLife) - dt);

      if (missile.guided) {
        const path = Array.isArray(missile.guidedPath) ? missile.guidedPath : [];
        let targetIndex = clamp(Math.floor(finiteOr(missile.guidedIndex, 1)), 1, Math.max(1, path.length - 1));
        while (path[targetIndex] && targetIndex < path.length - 1 && Math.hypot(path[targetIndex].x - missile.x, path[targetIndex].y - missile.y) < 46) {
          targetIndex += 1;
        }
        missile.guidedIndex = targetIndex;
        const pathTarget = path[targetIndex] || path[path.length - 1];
        if (pathTarget) {
          missile.targetX = pathTarget.x;
          missile.targetY = pathTarget.y;
        }
      } else {
        const cluster = findMobCluster(missile.x, missile.y, 760, {
          minCount: 1,
          clusterRadius: missileLauncherClusterRadius,
          preferredX: missile.targetX,
          preferredY: missile.targetY
        });
        if (cluster) {
          const leadTime = clamp(Math.hypot(cluster.x - missile.x, cluster.y - missile.y) / launcherMissileSpeed, 0, 0.8);
          missile.targetX = cluster.x + finiteOr(cluster.vx, 0) * leadTime * 0.4;
          missile.targetY = cluster.y + finiteOr(cluster.vy, 0) * leadTime * 0.4;
          missile.targetCount = cluster.count;
        }
      }

      const desiredAngle = Math.atan2(missile.targetY - missile.y, missile.targetX - missile.x);
      const speed = Math.max(launcherMissileSpeed * 0.45, Math.hypot(missile.vx, missile.vy) || launcherMissileSpeed);
      const currentAngle = Math.atan2(missile.vy, missile.vx);
      const turnRate = missile.guided ? launcherMissileTurnRate * 1.2 : launcherMissileTurnRate;
      const angle = currentAngle + clamp(shortestAngleDelta(currentAngle, desiredAngle), -turnRate * dt, turnRate * dt);
      const maxLife = finiteOr(missile.maxLife, launcherMissileLife);
      const targetSpeed = launcherMissileSpeed * (missile.life > maxLife - 0.24 ? 0.74 : missile.guided ? 0.92 : 1);
      const nextSpeed = speed + (targetSpeed - speed) * (1 - Math.pow(0.05, dt));
      missile.vx = Math.cos(angle) * nextSpeed;
      missile.vy = Math.sin(angle) * nextSpeed;
      missile.x += missile.vx * dt;
      missile.y += missile.vy * dt;

      const travel = Math.hypot(missile.x - previousX, missile.y - previousY);
      const sweptLength = Math.max(missile.radius, travel + missile.radius);
      const dir = normalize(missile.vx, missile.vy);
      const tailX = missile.x - dir.x * sweptLength;
      const tailY = missile.y - dir.y * sweptLength;
      const guidedAtFinalPoint = missile.guided && missile.guidedReleased && (
        !Array.isArray(missile.guidedPath) ||
        finiteOr(missile.guidedIndex, 1) >= missile.guidedPath.length - 1
      );
      let shouldExplode = missile.guided && !missile.guidedReleased
        ? false
        : Math.hypot(missile.x - missile.targetX, missile.y - missile.targetY) < (guidedAtFinalPoint ? 42 : 34);

      for (const mob of allCombatMobs()) {
        if (!mob || mob.health <= 0) {
          continue;
        }
        const dist = distanceToSegment(mob.x, mob.y, tailX, tailY, missile.x, missile.y);
        if (dist < mob.radius + missile.radius) {
          shouldExplode = true;
          break;
        }
      }

      const blocker = findBlockingLandableBody(tailX, tailY, missile.x, missile.y, missile.radius * 0.85, missile.ignoredBodyId);
      if (blocker) {
        missile.x = blocker.x;
        missile.y = blocker.y;
        shouldExplode = true;
      }

      if (shouldExplode || missile.life <= 0) {
        explodeLauncherMissile(missile, missile.x, missile.y);
        launcherMissiles.splice(i, 1);
      } else if (Math.random() < dt * 16) {
        sparks.push({
          x: missile.x - dir.x * randomRange(8, 22),
          y: missile.y - dir.y * randomRange(8, 22),
          radius: randomRange(10, 22),
          color: missile.color,
          life: 0.14,
          maxLife: 0.14
        });
      }
    }
  }

  function damageStructure(structure, damage, color) {
    if (!structure || structure.health <= 0) {
      return false;
    }
    if (structure.type === "tether") {
      return false;
    }
    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    structure.maxHealth = maxHealth;
    structure.health = clamp(finiteOr(structure.health, maxHealth) - Math.max(0, damage), 0, maxHealth);
    structure.flash = 0.34;
    structure.disabledTimer = Math.max(structure.disabledTimer || 0, structure.health <= 0 ? 1.2 : 0);
    sparks.push({
      x: structure.x,
      y: structure.y,
      radius: structureHitRadius(structure) * 1.35,
      color: color || { r: 255, g: 184, b: 88 },
      life: 0.28,
      maxLife: 0.28
    });
    playSound("mobHit", { throttleKey: "structureDamage" });
    return structure.health <= 0;
  }

  function disableStructure(structure, duration, color) {
    if (!structure || structure.health <= 0) {
      return;
    }

    structure.disabledTimer = Math.max(structure.disabledTimer || 0, duration);
    structure.flash = Math.max(structure.flash || 0, 0.22);
    sparks.push({
      x: structure.x,
      y: structure.y,
      radius: structureHitRadius(structure) * 1.55,
      color: color || { r: 157, g: 255, b: 122 },
      life: 0.26,
      maxLife: 0.26
    });
    playSound("lightning", { throttleKey: "structureDisable" });
  }

  function repairStructure(structure, amount) {
    if (!structure) {
      return false;
    }

    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const current = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    const disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0));
    if (current >= maxHealth && disabledTimer <= 0) {
      return false;
    }

    const repairAmount = Math.max(0, amount);
    structure.maxHealth = maxHealth;
    structure.health = Math.min(maxHealth, current + repairAmount);
    structure.flash = Math.max(structure.flash || 0, 0.12);
    if (structure.health > 0 && disabledTimer > 0) {
      structure.disabledTimer = 0;
    } else if (structure.health > 0) {
      structure.disabledTimer = Math.min(structure.disabledTimer || 0, 0.4);
    }
    return true;
  }

  function nearestStructureTarget(x, y, maxRange, predicate) {
    let best = null;
    let bestDistance = Infinity;

    for (const structure of structures) {
      if (predicate && !predicate(structure)) {
        continue;
      }

      const distance = Math.hypot(structure.x - x, structure.y - y);
      if (distance > maxRange + structureHitRadius(structure) || distance >= bestDistance) {
        continue;
      }

      best = structure;
      bestDistance = distance;
    }

    return best;
  }

  function hasClearShotAtStructure(x, y, structure, ignoredBodyId) {
    return !findBlockingLandableBody(x, y, structure.x, structure.y, structureHitRadius(structure) * 0.14, ignoredBodyId);
  }

  function canAccumulatorPullParticle(particle) {
    return particle && particle.tier && particle.tier.name === "particle";
  }

  function updateAccumulator(structure, dt) {
    const body = bodyById(structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }

    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    structure.burstCooldown = Math.max(0, finiteOr(structure.burstCooldown, accumulatorBurstInterval) - dt);

    if (structure.burstTimer <= 0 && structure.burstCooldown <= 0) {
      if (spendBodyEnergy(body, accumulatorBurstCost)) {
        structure.burstTimer = accumulatorBurstDuration;
        structure.burstCooldown = accumulatorBurstInterval;
        sparks.push({
          x: structure.x,
          y: structure.y,
          radius: 62,
          color: { r: 88, g: 226, b: 255 },
          life: 0.24,
          maxLife: 0.24
        });
      } else {
        structure.burstCooldown = 0.6;
      }
    }

    let strongestPull = 0;
    const range = accumulatorRange + Math.min(260, body.radius * 0.9);
    const burstProgress = clamp(structure.burstTimer / accumulatorBurstDuration, 0, 1);
    const wave = Math.sin((1 - burstProgress) * Math.PI);

    if (structure.burstTimer > 0) {
      for (const particle of particles) {
        if (particle.id === body.id || !canAccumulatorPullParticle(particle) || !canAbsorbBody(body, particle)) {
          continue;
        }

        const toBodyX = body.x - particle.x;
        const toBodyY = body.y - particle.y;
        const dist = Math.hypot(toBodyX, toBodyY) || 1;
        if (dist > range + particle.radius) {
          continue;
        }

        const rawPull = clamp(1 - Math.max(0, dist - body.radius) / range, 0.02, 1);
        const pull = Math.pow(rawPull, 1.32) * (0.55 + wave * 0.9);
        const deployPull = 0.34 + clamp(structure.deploy || 0, 0, 1) * 0.66;
        const massResistance = clamp(1 / Math.pow(Math.max(1, particle.mass), 0.18), 0.26, 1);
        const force = accumulatorForce * 2.15 * pull * deployPull * massResistance;

        particle.vx += (toBodyX / dist) * force * dt;
        particle.vy += (toBodyY / dist) * force * dt;
        strongestPull = Math.max(strongestPull, pull);
      }
    }

    const targetDeploy = strongestPull > 0 ? 0.36 + strongestPull * 0.64 : 0;
    structure.deploy += (targetDeploy - (structure.deploy || 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);

    if (structure.burstTimer > 0 && Math.random() < dt * (1.2 + strongestPull * 3.2)) {
      sparks.push({
        x: structure.x + randomRange(-12, 12),
        y: structure.y + randomRange(-12, 12),
        radius: 24 + strongestPull * 34,
        color: { r: 88, g: 226, b: 255 },
        life: 0.18,
        maxLife: 0.18
      });
    }
  }

  function updateShieldGenerator(structure, dt) {
    const body = bodyById(structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }

    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    const hasPower = canSpendBodyEnergy(body, shieldGeneratorProjectileCost);
    const targetDeploy = hasPower ? 0.72 : 0.16;
    structure.deploy += (targetDeploy - (structure.deploy || 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);

    if (hasPower && structure.burstTimer > 0 && Math.random() < dt * 4.2) {
      const radius = shieldGeneratorRadius(body);
      const angle = randomRange(0, Math.PI * 2);
      sparks.push({
        x: body.x + Math.cos(angle) * radius,
        y: body.y + Math.sin(angle) * radius,
        radius: 28,
        color: { r: 119, g: 167, b: 255 },
        life: 0.18,
        maxLife: 0.18
      });
    }
  }

  function updateTether(structure, dt) {
    structure.deploy = clamp((structure.deploy || 0) + dt * 2.2, 0, 1);
  }

  function isActiveTetherStructure(structure) {
    return Boolean(
      structure &&
      structure.type === "tether" &&
      structure.health > 0 &&
      !isStructureDisabled(structure)
    );
  }
