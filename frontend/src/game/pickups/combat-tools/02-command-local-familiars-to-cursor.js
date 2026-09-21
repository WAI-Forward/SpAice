  function commandLocalFamiliarsToCursor() {
    if (!isFamiliarNetEquipped() || !mouse.right || buildMenuOpen || toolFireCooldown > 0) {
      return false;
    }
    const familiars = localPlayerFamiliars();
    if (!familiars.length) {
      return false;
    }
    const cursor = screenToWorld(mouse.x, mouse.y);
    for (const familiar of familiars) {
      const dx = cursor.x - finiteOr(familiar.x, 0);
      const dy = cursor.y - finiteOr(familiar.y, 0);
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const towardSpeed = finiteOr(familiar.vx, 0) * nx + finiteOr(familiar.vy, 0) * ny;
      if (towardSpeed < 0) {
        familiar.vx -= nx * towardSpeed;
        familiar.vy -= ny * towardSpeed;
      }
      familiar.familiarCommandX = cursor.x;
      familiar.familiarCommandY = cursor.y;
      familiar.familiarCommandTimer = 8;
    }
    toolFireCooldown = familiarNetReleaseCooldown;
    startFamiliarNetSwing(1);
    sparks.push({
      x: cursor.x,
      y: cursor.y,
      radius: 42,
      color: { r: 102, g: 224, b: 184 },
      life: 0.24,
      maxLife: 0.24
    });
    playSound("pickupTech", { throttleKey: "familiarNetCommand", throttle: 0.16, volume: 0.55 });
    resetMouseButtons();
    return true;
  }

  function familiarCombatTargets() {
    return familiarCombatMobs().map((mob) => ({
      local: false,
      remote: null,
      familiar: true,
      player: mob,
      publicName: "Familiar " + mobName(mob)
    }));
  }

  function reflectEntityVelocity(entity, nx, ny, damping, minSpeed) {
    const dot = entity.vx * nx + entity.vy * ny;
    entity.vx = (entity.vx - 2 * dot * nx) * damping;
    entity.vy = (entity.vy - 2 * dot * ny) * damping;

    const speed = Math.hypot(entity.vx, entity.vy);
    if (speed < minSpeed) {
      entity.vx -= nx * minSpeed;
      entity.vy -= ny * minSpeed;
    }
  }

  function tryFighterShieldBlock(fighter, projectile, nx, ny, options) {
    if (!fighter || fighter.kind !== "fighter" || fighter.health <= 0 || isMobDisabled(fighter) || fighter.shieldCharge <= 0) {
      return false;
    }

    fighter.shieldActive = Math.max(fighter.shieldActive || 0, 0.55);
    fighter.shieldRecharge = fighterShieldCycle;
    fighter.flash = Math.max(fighter.flash || 0, 0.08);

    const damping = options && Number.isFinite(options.damping) ? options.damping : 0.42;
    const minSpeed = options && Number.isFinite(options.minSpeed) ? options.minSpeed : 80;
    reflectEntityVelocity(projectile, nx, ny, damping, minSpeed);

    if (options && options.pushBack) {
      projectile.x -= nx * options.pushBack;
      projectile.y -= ny * options.pushBack;
    }

    sparks.push({
      x: fighter.x - nx * fighter.radius * 0.55,
      y: fighter.y - ny * fighter.radius * 0.55,
      radius: fighter.radius * 2.4,
      color: fighter.color,
      life: 0.32,
      maxLife: 0.32
    });

    playSound("shield");
    return true;
  }

  function damageMobsWithProjectiles() {
    for (const particle of particles) {
      if (particle.tier.threshold < 10 || particle.tier.solid) {
        continue;
      }

      const speed = Math.hypot(particle.vx, particle.vy);
      if (speed < projectileDamageSpeed) {
        continue;
      }

      for (const mob of allCombatMobs()) {
        if (mob.health <= 0 || isPlayerTeamMob(mob) || shouldSleepDistantSurvivalMob(mob) || !canDamageMobWithBody(mob, particle)) {
          continue;
        }

        const dx = mob.x - particle.x;
        const dy = mob.y - particle.y;
        const dist = Math.hypot(dx, dy) || 1;
        const hitDistance = mob.radius + particle.radius * 1.12;
        if (dist > hitDistance) {
          continue;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const controllerPlayerId = controllingPlayerIdForBody(particle);
        if (controllerPlayerId) aggroNearbyMobsFromPlayerDamage(mob, controllerPlayerId);
        if (mob.hitCooldown > 0) continue;
        if (tryFighterShieldBlock(mob, particle, nx, ny, { damping: 0.36, minSpeed: 110, pushBack: particle.radius * 0.8 })) {
          continue;
        }
        const damage = Math.min(85, 18 + (speed - projectileDamageSpeed) * 0.16 + Math.sqrt(particle.mass) * 0.75);
        markMobDamagedByBody(mob, particle);
        knockMob(mob, nx, ny, 170 + speed * 0.38);
        triggerBossBodyEvade(mob, particle, nx, ny, speed);
        particle.vx *= 0.92;
        particle.vy *= 0.92;

        damageMob(mob, damage, particle.color, mobName(mob) + " knocked out by " + particle.tier.article + " " + particle.tier.name + ".", {
          source: { playerId: controllerPlayerId, bodyId: particle.id, cause: "projectile-impact", hostileActionType: "player-controlled-body-impact" }
        });
      }
    }
  }

  function sharedBodyImpactDamage(body, impactSpeed, baseDamage) {
    return body && body.tier && body.tier.solid
      ? solidBodyImpactDamage(body, impactSpeed, baseDamage)
      : Math.min(90, baseDamage + Math.max(0, impactSpeed - rivalBodyImpactSpeed) * 0.16 + Math.sqrt(body.mass) * 0.62);
  }

  function sharedBodyPlayerImpactDamage(body, impactSpeed, baseDamage) {
    return body && body.tier && body.tier.solid
      ? solidBodyPlayerImpactDamage(body, impactSpeed, baseDamage)
      : Math.min(90, baseDamage + Math.max(0, impactSpeed - rivalBodyImpactSpeed) * 0.16 + Math.sqrt(body.mass) * 0.62);
  }

  function sendSharedBodyImpactEffect(contact, keyPrefix, nx, ny, impactSpeed) {
    const impulse = 70 + impactSpeed * 0.28;
    sendThrottledRemoteEntityEffect(contact.remote, keyPrefix + ":" + contact.source.id, 0.18, {
      entityType: "particle",
      entityId: contact.source.id,
      sourceKind: "environment",
      cause: "Shared body impact",
      impulseX: -nx * impulse,
      impulseY: -ny * impulse
    });
  }

  function resolveRemoteBodyPlayerCollisions() {
    for (const contact of collectRemoteSharedBodies()) {
      const body = contact.body;
      const bodyContact = playerCircleHurtboxContact(
        player,
        body.x,
        body.y,
        finiteOr(body.remoteContactRadius, body.tier.solid ? solidBodyContactRadius(body) : body.radius * 1.08),
        playerBodyHurtboxScale
      );
      if (!bodyContact) {
        continue;
      }

      const nx = bodyContact.nx;
      const ny = bodyContact.ny;
      const relativeVelocity = (player.vx - body.vx) * nx + (player.vy - body.vy) * ny;
      const incomingSpeed = Math.max(0, -relativeVelocity);
      const bodySpeed = Math.hypot(body.vx, body.vy);
      const impactSpeed = Math.max(incomingSpeed, bodySpeed);

      if (body.tier.solid) {
        const overlap = bodyContact.overlap;
        player.x += nx * overlap * 0.82;
        player.y += ny * overlap * 0.82;

        if (incomingSpeed > 0) {
          const impulse = incomingSpeed * 0.74;
          player.vx += nx * impulse;
          player.vy += ny * impulse;
          sendSharedBodyImpactEffect(contact, "player-body-bounce", nx, ny, incomingSpeed);
        }
      }

      if (isPermanentRemoteOverlap(contact.remote)) {
        continue;
      }

      const damageThreshold = body.tier.solid ? solidBodyPlayerDamageSpeed : projectileDamageSpeed;
      if (impactSpeed < damageThreshold || player.hitCooldown > 0) {
        continue;
      }

      if (player.landed) {
        detachFromBody(170);
      }

      const damage = sharedBodyPlayerImpactDamage(body, impactSpeed, 10);
      player.vx += nx * (120 + impactSpeed * 0.32);
      player.vy += ny * (120 + impactSpeed * 0.32);
      damageLocalPlayer(damage, {
        cause: body.tier.article + " " + body.tier.name,
        cooldown: 0.78,
        flash: 0.32
      });
      sendSharedBodyImpactEffect(contact, "player-body-hit", nx, ny, impactSpeed);
      sparks.push({
        x: player.x,
        y: player.y,
        radius: 48,
        color: body.color,
        life: 0.3,
        maxLife: 0.3
      });
      maybeNotifyText("Hull clipped by " + body.tier.article + " " + body.tier.name + ".");
    }
  }

  function resolveRemoteBodyMobCollisions() {
    const remoteBodies = collectRemoteSharedBodies();
    if (!remoteBodies.length) {
      return;
    }

    for (const mob of allCombatMobs()) {
      if (mob.health <= 0) {
        continue;
      }

      for (const contact of remoteBodies) {
        const body = contact.body;
        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const bodyContactRadius = finiteOr(body.remoteContactRadius, body.tier.solid ? solidBodyContactRadius(body) : body.radius * 1.08);
        const minDist = mob.radius + bodyContactRadius;
        const distSq = dx * dx + dy * dy;

        if (distSq >= minDist * minDist) {
          continue;
        }

        const rawDist = Math.sqrt(distSq);
        const dist = rawDist || 1;
        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const relativeVelocity = (mob.vx - body.vx) * nx + (mob.vy - body.vy) * ny;
        const incomingSpeed = Math.max(0, -relativeVelocity);
        const bodySpeed = Math.hypot(body.vx, body.vy);
        const impactSpeed = Math.max(incomingSpeed, bodySpeed);

        if (mob.landed) {
          mob.landed = null;
          mob.residentTier = null;
        }

        const damageThreshold = body.tier.solid ? solidBodyDamageSpeed : rivalBodyImpactSpeed;
        const canTriggerBodyDamage = impactSpeed >= damageThreshold && mob.hitCooldown <= 0 && canDamageMobWithBody(mob, body);
        const controllerPlayerId = controllingPlayerIdForBody(body);
        if (controllerPlayerId) aggroNearbyMobsFromPlayerDamage(mob, controllerPlayerId);
        const bodyDashActive = finiteOr(mob.bossBodyEvadeTimer, 0) > 0 && finiteOr(mob.hitCooldown, 0) > 0;

        if (body.tier.solid) {
          const overlap = minDist - dist;
          const correctionDistance = canTriggerBodyDamage
            ? Math.min(overlap, 18)
            : bodyDashActive
              ? Math.min(overlap, 12)
              : overlap;
          mob.x += nx * correctionDistance * 0.78;
          mob.y += ny * correctionDistance * 0.78;

          if (incomingSpeed > 0) {
            const impulse = incomingSpeed * 0.82;
            mob.vx += nx * impulse;
            mob.vy += ny * impulse;
            sendSharedBodyImpactEffect(contact, "mob-body-bounce", nx, ny, incomingSpeed);
          }
        }

        if (!canTriggerBodyDamage) {
          continue;
        }

        knockMob(mob, nx, ny, 145 + impactSpeed * 0.35);
        sendSharedBodyImpactEffect(contact, "mob-body-hit", nx, ny, impactSpeed);
        const damage = sharedBodyImpactDamage(body, impactSpeed, 12);
        markMobDamagedByBody(mob, body);
        triggerBossBodyEvade(mob, body, nx, ny, impactSpeed);
        if (damageMob(mob, damage, body.color, mobName(mob) + " crushed by " + body.tier.article + " " + body.tier.name + ".", {
          source: { playerId: controllingPlayerIdForBody(body), bodyId: body.id, cause: "body-impact", hostileActionType: "player-controlled-body-impact" },
          notification: bodyDefeatNotificationOptions(mob, body, "crushed")
        })) {
          break;
        }
      }
    }
  }

  function firePlayerLaser(weapon) {
    const spec = weapon || playerWeaponDefaults;
    const aim = getAim();
    const muzzleDistance = 80;
    const color = spec.color || playerWeaponDefaults.color;
    const pelletCount = Math.max(1, Math.floor(finiteOr(spec.pelletCount, 1)));
    const aimAngle = Math.atan2(aim.world.y, aim.world.x);
    const spread = Math.max(0, finiteOr(spec.spread, 0));

    for (let i = 0; i < pelletCount; i += 1) {
      const lineT = pelletCount <= 1 ? 0 : i / (pelletCount - 1) * 2 - 1;
      const clusteredT = Math.sign(lineT) * Math.pow(Math.abs(lineT), 1.35);
      const angleJitter = pelletCount > 1 ? randomRange(-0.04, 0.04) : (spread > 0 ? randomRange(-spread, spread) * 0.55 : 0);
      const angleOffset = clusteredT * spread + angleJitter;
      const dirX = Math.cos(aimAngle + angleOffset);
      const dirY = Math.sin(aimAngle + angleOffset);
      const sideX = -dirY;
      const sideY = dirX;
      const muzzleScatter = pelletCount > 1 ? randomRange(-9, 9) : 0;
      const forwardScatter = pelletCount > 1 ? randomRange(-4, 8) : 0;
      const speed = finiteOr(spec.speed, playerWeaponDefaults.speed) + (pelletCount > 1 ? randomRange(10, 120) : 0);
      const life = finiteOr(spec.life, playerWeaponDefaults.life) * (pelletCount > 1 ? randomRange(0.9, 1.22) : 1);

      playerLasers.push({
        x: player.x + dirX * (muzzleDistance + forwardScatter) + sideX * muzzleScatter,
        y: player.y + dirY * (muzzleDistance + forwardScatter) + sideY * muzzleScatter,
        vx: dirX * speed + player.vx * 0.18,
        vy: dirY * speed + player.vy * 0.18,
        radius: finiteOr(spec.radius, playerWeaponDefaults.radius),
        length: finiteOr(spec.length, playerWeaponDefaults.length),
        color,
        life,
        maxLife: life,
        damage: finiteOr(spec.damage, playerWeaponDefaults.damage),
        knockback: finiteOr(spec.knockback, playerWeaponDefaults.knockback),
        piercesMobs: Boolean(spec.piercesMobs),
        hitMessage: null,
        weaponLabel: spec.label,
        sourceX: player.x,
        sourceY: player.y
      });
    }

    sparks.push({
      x: player.x + aim.world.x * muzzleDistance,
      y: player.y + aim.world.y * muzzleDistance,
      radius: pelletCount > 1 ? 38 : 24,
      color,
      life: pelletCount > 1 ? 0.2 : 0.14,
      maxLife: pelletCount > 1 ? 0.2 : 0.14
    });

    if (!player.landed) {
      const slow = clamp(finiteOr(spec.movementSlow, playerWeaponDefaults.movementSlow), 0, 0.35);
      const immediateDrag = 1 - slow * 0.42;
      player.weaponSlow = clamp(finiteOr(player.weaponSlow, 0) + slow, 0, weaponSlowMax);
      player.vx = player.vx * immediateDrag - aim.world.x * (24 + slow * 120);
      player.vy = player.vy * immediateDrag - aim.world.y * (24 + slow * 120);
    } else {
      player.weaponSlow = clamp(
        finiteOr(player.weaponSlow, 0) + clamp(finiteOr(spec.movementSlow, playerWeaponDefaults.movementSlow), 0, 0.35),
        0,
        weaponSlowMax
      );
    }
    playSound(pelletCount > 1 ? "enemyLaser" : "laser", { throttleKey: pelletCount > 1 ? "playerShotgun" : "laser" });
  }

  function fireEmpTool() {
    if (!isEmpToolEquipped() || buildMenuOpen || !mouse.left || toolFireCooldown > 0 || isMultiplayerV2Active()) {
      return false;
    }
    if (!canSpendPlayerEnergy(empPulseEnergyCost)) {
      notifyEnergyDepleted();
      return false;
    }

    spendPlayerEnergy(empPulseEnergyCost);
    toolFireCooldown = empPulseCooldown;
    const affected = applyEmpPulse(player.x, player.y, currentEmpPulseRange(), currentEmpPulseDisableDuration(), {
      affectMobs: true,
      affectPlayers: false,
      affectStructures: false,
      color: { r: 126, g: 232, b: 255 },
      cause: "EMP tool"
    });
    maybeNotifyText(affected > 0 ? "EMP disabled " + affected + " mob" + (affected === 1 ? "." : "s.") : "EMP pulse discharged.");
    resetMouseButtons();
    return true;
  }

  function structureNeedsSpannerRepair(structure) {
    if (!structure) {
      return false;
    }
    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    return health < maxHealth || finiteOr(structure.disabledTimer, 0) > 0;
  }

  function findSpannerRepairTarget() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    const aim = getAim();
    const ax = player.x + aim.world.x * 18;
    const ay = player.y + aim.world.y * 18;
    const bx = player.x + aim.world.x * (spannerRepairRange + 86);
    const by = player.y + aim.world.y * (spannerRepairRange + 86);
    let best = null;
    let bestScore = Infinity;

    for (const structure of structures) {
      if (!structureNeedsSpannerRepair(structure)) {
        continue;
      }

      const targetPoint = structureTargetPoint(structure, cursor);
      const playerDistance = Math.hypot(targetPoint.x - player.x, targetPoint.y - player.y);
      const hitRadius = structureHitRadius(structure);
      if (playerDistance > spannerRepairRange + hitRadius) {
        continue;
      }

      const cursorDistance = targetPoint.distance;
      const segmentDistance = distanceToSegment(targetPoint.x, targetPoint.y, ax, ay, bx, by);
      if (cursorDistance > hitRadius + 44 && segmentDistance > hitRadius + 44) {
        continue;
      }

      const score = Math.min(cursorDistance, segmentDistance) + playerDistance * 0.18;
      if (score < bestScore) {
        best = structure;
        bestScore = score;
      }
    }

    return best;
  }
