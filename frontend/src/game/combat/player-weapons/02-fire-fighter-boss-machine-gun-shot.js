  function fireFighterBossMachineGunShot(fighter, target, dist) {
    const targetPlayer = target && target.player ? target.player : player;
    const leadTime = clamp(dist / (rivalProjectileSpeed + 180), 0, 0.9);
    const targetX = targetPlayer.x + finiteOr(targetPlayer.vx, 0) * leadTime * 0.58;
    const targetY = targetPlayer.y + finiteOr(targetPlayer.vy, 0) * leadTime * 0.58;
    const baseAngle = Math.atan2(targetY - fighter.y, targetX - fighter.x);
    const aimAngle = baseAngle + randomRange(-0.075, 0.075);
    const aimX = Math.cos(aimAngle);
    const aimY = Math.sin(aimAngle);
    const normalX = -aimY;
    const normalY = aimX;
    const side = Math.floor(finiteOr(fighter.machineGunShots, 0)) % 2 === 0 ? -1 : 1;
    const color = shadeColor(fighter.color, 64);

    rivalProjectiles.push({
      id: nextRivalProjectileId++,
      x: fighter.x + aimX * (fighter.radius + 18) + normalX * side * 18,
      y: fighter.y + aimY * (fighter.radius + 18) + normalY * side * 18,
      vx: aimX * (rivalProjectileSpeed + randomRange(150, 235)) + fighter.vx * 0.12,
      vy: aimY * (rivalProjectileSpeed + randomRange(150, 235)) + fighter.vy * 0.12,
      radius: 4,
      length: randomRange(30, 40),
      color,
      life: 1.7,
      maxLife: 1.7,
      damage: difficultyMobDamage(bossScaledDamage(fighter, 5.5)),
      toolDisable: 0,
      cause: "Fighter boss machine gun",
      ...mobProjectileSourceFields(fighter),
      targetPlayerId: target && !target.local && target.remote ? target.remote.playerId : ""
    });

    sparks.push({
      x: fighter.x + aimX * (fighter.radius + 24),
      y: fighter.y + aimY * (fighter.radius + 24),
      radius: 18,
      color,
      life: 0.09,
      maxLife: 0.09
    });

    fighter.rotation = aimAngle + Math.PI / 2;
    playSound("fighter", { throttleKey: "fighterBossMachineGun:" + fighter.id, throttle: 0.06 });
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    return Math.hypot(px - closestX, py - closestY);
  }

  function pointToSegmentContact(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = closestX - px;
    const dy = closestY - py;
    const distance = Math.hypot(dx, dy);
    return {
      x: closestX,
      y: closestY,
      distance,
      nx: distance ? dx / distance : 1,
      ny: distance ? dy / distance : 0
    };
  }

  function playerHurtboxDownVector(targetPlayer) {
    if (targetPlayer && targetPlayer.landed && Number.isFinite(Number(targetPlayer.landed.angle))) {
      const angle = finiteOr(targetPlayer.landed.angle, 0) + Math.PI;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    }

    const angle = targetPlayer === player
      ? Math.PI / 2 - cameraRoll
      : finiteOr(targetPlayer && targetPlayer.cameraRoll, 0) - cameraRoll + Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  function playerHurtboxSegment(targetPlayer) {
    const down = playerHurtboxDownVector(targetPlayer);
    const x = finiteOr(targetPlayer && targetPlayer.x, player.x);
    const y = finiteOr(targetPlayer && targetPlayer.y, player.y);
    return {
      ax: x + down.x * playerHurtboxTopOffset,
      ay: y + down.y * playerHurtboxTopOffset,
      bx: x + down.x * playerHurtboxBottomOffset,
      by: y + down.y * playerHurtboxBottomOffset
    };
  }

  function distanceBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
    function orientation(px, py, qx, qy, rx, ry) {
      const value = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
      if (Math.abs(value) < 0.000001) {
        return 0;
      }
      return value > 0 ? 1 : 2;
    }

    function onSegment(px, py, qx, qy, rx, ry) {
      return qx <= Math.max(px, rx) + 0.000001 &&
        qx + 0.000001 >= Math.min(px, rx) &&
        qy <= Math.max(py, ry) + 0.000001 &&
        qy + 0.000001 >= Math.min(py, ry);
    }

    const o1 = orientation(ax, ay, bx, by, cx, cy);
    const o2 = orientation(ax, ay, bx, by, dx, dy);
    const o3 = orientation(cx, cy, dx, dy, ax, ay);
    const o4 = orientation(cx, cy, dx, dy, bx, by);

    if (
      (o1 !== o2 && o3 !== o4) ||
      (o1 === 0 && onSegment(ax, ay, cx, cy, bx, by)) ||
      (o2 === 0 && onSegment(ax, ay, dx, dy, bx, by)) ||
      (o3 === 0 && onSegment(cx, cy, ax, ay, dx, dy)) ||
      (o4 === 0 && onSegment(cx, cy, bx, by, dx, dy))
    ) {
      return 0;
    }

    return Math.min(
      distanceToSegment(ax, ay, cx, cy, dx, dy),
      distanceToSegment(bx, by, cx, cy, dx, dy),
      distanceToSegment(cx, cy, ax, ay, bx, by),
      distanceToSegment(dx, dy, ax, ay, bx, by)
    );
  }

  function distanceToPlayerHurtboxSegment(targetPlayer, ax, ay, bx, by) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    return distanceBetweenSegments(ax, ay, bx, by, hurtbox.ax, hurtbox.ay, hurtbox.bx, hurtbox.by);
  }

  function playerCircleHurtboxContact(targetPlayer, cx, cy, circleRadius, playerScale) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    const contact = pointToSegmentContact(cx, cy, hurtbox.ax, hurtbox.ay, hurtbox.bx, hurtbox.by);
    const playerRadius = Math.max(1, finiteOr(targetPlayer && targetPlayer.radius, player.radius)) * playerScale;
    const minDist = playerRadius + Math.max(0, finiteOr(circleRadius, 0));
    if (contact.distance >= minDist) {
      return null;
    }

    return Object.assign(contact, {
      overlap: minDist - contact.distance,
      minDist,
      playerRadius
    });
  }

  function segmentBodyIntersection(body, ax, ay, bx, by, padding) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((body.x - ax) * abx + (body.y - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = body.x - closestX;
    const dy = body.y - closestY;
    const blockRadius = (body.tier && (body.tier.name === "planet" || body.tier.name === "star") ? solidBodyContactRadius(body) : body.radius) + padding;

    if (dx * dx + dy * dy > blockRadius * blockRadius) {
      return null;
    }

    return {
      x: closestX,
      y: closestY,
      t
    };
  }

  function segmentCircleIntersection(cx, cy, radius, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const fx = ax - cx;
    const fy = ay - cy;
    const a = dx * dx + dy * dy;

    if (a <= 0.000001) {
      return fx * fx + fy * fy <= radius * radius ? { x: ax, y: ay, t: 0 } : null;
    }

    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null;
    }

    const root = Math.sqrt(discriminant);
    const t1 = (-b - root) / (2 * a);
    const t2 = (-b + root) / (2 * a);
    let t = Number.POSITIVE_INFINITY;

    if (t1 >= 0 && t1 <= 1) {
      t = t1;
    }
    if (t2 >= 0 && t2 <= 1 && t2 < t) {
      t = t2;
    }
    if (!Number.isFinite(t) && c <= 0) {
      t = 0;
    }
    if (!Number.isFinite(t)) {
      return null;
    }

    return {
      x: ax + dx * t,
      y: ay + dy * t,
      t
    };
  }

  function findBlockingLandableBody(ax, ay, bx, by, padding, ignoredBodyId) {
    let nearest = null;

    for (const particle of particles) {
      if (!isLandableBody(particle) || particle.id === ignoredBodyId) {
        continue;
      }

      const hit = segmentBodyIntersection(particle, ax, ay, bx, by, padding);
      if (!hit || (nearest && hit.t >= nearest.t)) {
        continue;
      }

      nearest = {
        body: particle,
        x: hit.x,
        y: hit.y,
        t: hit.t
      };
    }

    return nearest;
  }

  function shieldGeneratorRadius(body) {
    if (!body) {
      return 0;
    }

    return body.radius + shieldGeneratorFieldPadding + Math.min(240, body.radius * 0.18);
  }

  function projectileShieldCost(projectile) {
    if (projectile && projectile.rocket) {
      return shieldGeneratorRocketCost;
    }
    if (projectile && projectile.lightning) {
      return shieldGeneratorLightningCost;
    }
    return shieldGeneratorProjectileCost;
  }

  function powerOutShieldGenerator(structure, color) {
    if (!structure || structure.health <= 0) {
      return;
    }

    structure.disabledTimer = Math.max(structure.disabledTimer || 0, shieldGeneratorPowerOutDuration);
    structure.burstTimer = 0;
    structure.flash = Math.max(structure.flash || 0, 0.26);
    sparks.push({
      x: structure.x,
      y: structure.y,
      radius: structureHitRadius(structure) * 1.45,
      color: color || { r: 119, g: 167, b: 255 },
      life: 0.24,
      maxLife: 0.24
    });
    playSound("lightning", { throttleKey: "shieldPowerOut" });
  }

  function activateShieldGeneratorBlock(structure, body, cost, hitX, hitY, color, radiusScale) {
    if (!structure || !body || structure.health <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    if (!spendBodyEnergy(body, cost)) {
      powerOutShieldGenerator(structure, color);
      return false;
    }

    structure.deploy = 1;
    structure.burstTimer = shieldGeneratorActiveDuration;
    structure.flash = Math.max(structure.flash || 0, 0.16);
    sparks.push({
      x: Number.isFinite(hitX) ? hitX : structure.x,
      y: Number.isFinite(hitY) ? hitY : structure.y,
      radius: shieldGeneratorRadius(body) * (radiusScale || 0.16),
      color: color || { r: 119, g: 167, b: 255 },
      life: 0.24,
      maxLife: 0.24
    });
    playSound("shield", { throttleKey: "shieldGenerator" });
    if (finiteOr(body.energy, 0) <= 0.05) {
      powerOutShieldGenerator(structure, color);
    }
    return true;
  }

  function findProjectileShieldBlocker(ax, ay, bx, by, padding, projectile) {
    let nearest = null;
    const cost = projectileShieldCost(projectile);

    for (const structure of structures) {
      if (
        structure.type !== "shield-generator" ||
        structure.health <= 0 ||
        isStructureDisabled(structure) ||
        projectile && projectile.lightning && isMobOwnedStructure(structure)
      ) {
        continue;
      }

      const body = bodyById(structure.bodyId);
      if (!isStructureHostBody(body)) {
        continue;
      }

      const radius = shieldGeneratorRadius(body) + padding;
      const hit = segmentCircleIntersection(body.x, body.y, radius, ax, ay, bx, by);
      if (!hit || (nearest && hit.t >= nearest.t)) {
        continue;
      }

      nearest = {
        structure,
        body,
        cost,
        x: hit.x,
        y: hit.y,
        t: hit.t
      };
    }

    return nearest;
  }

  function tickMobShieldImpactCooldowns(mob, dt) {
    if (!mob.shieldImpactCooldowns) {
      return;
    }

    for (const structureId of Object.keys(mob.shieldImpactCooldowns)) {
      const remaining = finiteOr(mob.shieldImpactCooldowns[structureId], 0) - dt;
      if (remaining > 0) {
        mob.shieldImpactCooldowns[structureId] = remaining;
      } else {
        delete mob.shieldImpactCooldowns[structureId];
      }
    }
  }

  function shieldImpactCooldownFor(mob, structure) {
    return mob.shieldImpactCooldowns ? finiteOr(mob.shieldImpactCooldowns[structure.id], 0) : 0;
  }

  function markShieldImpact(mob, structure) {
    if (!mob.shieldImpactCooldowns) {
      mob.shieldImpactCooldowns = {};
    }
    mob.shieldImpactCooldowns[structure.id] = shieldGeneratorMobCooldown;
  }

  function resolveShieldGeneratorMobCollisions(dt) {
    for (const mob of allCombatMobs()) {
      tickMobShieldImpactCooldowns(mob, dt);
      if (mob.health <= 0 || isPlayerTeamMob(mob) || shouldSleepDistantSurvivalMob(mob)) {
        continue;
      }

      for (const structure of structures) {
        if (structure.type !== "shield-generator" || structure.health <= 0 || isStructureDisabled(structure)) {
          continue;
        }

        const body = bodyById(structure.bodyId);
        if (!isStructureHostBody(body)) {
          continue;
        }

        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const shieldRadius = shieldGeneratorRadius(body);
        const hitDistance = shieldRadius + mob.radius;
        if (dist >= hitDistance) {
          continue;
        }

        const cooldown = shieldImpactCooldownFor(mob, structure);
        const nx = rawDist ? dx / dist : Math.cos(structure.angle);
        const ny = rawDist ? dy / dist : Math.sin(structure.angle);
        const speed = Math.hypot(mob.vx, mob.vy);
        const cost = shieldGeneratorMobCost * clamp(0.65 + speed / 520, 0.65, 1.8);

        if (cooldown <= 0) {
          if (!activateShieldGeneratorBlock(structure, body, cost, body.x + nx * shieldRadius, body.y + ny * shieldRadius, { r: 119, g: 167, b: 255 }, 0.2)) {
            continue;
          }
          markShieldImpact(mob, structure);
        }

        if (mob.landed) {
          mob.landed = null;
          mob.residentTier = null;
        }

        const overlap = hitDistance - dist;
        mob.x += nx * overlap;
        mob.y += ny * overlap;

        const relVx = mob.vx - body.vx;
        const relVy = mob.vy - body.vy;
        const incoming = relVx * nx + relVy * ny;
        if (incoming < 0) {
          mob.vx -= incoming * 1.72 * nx;
          mob.vy -= incoming * 1.72 * ny;
        }

        const outwardSpeed = (mob.vx - body.vx) * nx + (mob.vy - body.vy) * ny;
        if (outwardSpeed < shieldGeneratorMobMinBounceSpeed) {
          const boost = shieldGeneratorMobMinBounceSpeed - outwardSpeed;
          mob.vx += nx * boost;
          mob.vy += ny * boost;
        }

        const bodyImpulse = clamp((speed + shieldGeneratorMobMinBounceSpeed) / Math.max(80, body.mass), 0.4, 10);
        const pointX = body.x + nx * bodyAngularInertiaRadius(body);
        const pointY = body.y + ny * bodyAngularInertiaRadius(body);
        applyBodyVelocityChangeAtPoint(body, -nx * bodyImpulse, -ny * bodyImpulse, pointX, pointY, bodyConstraintTorqueResponse);
        knockMob(mob, nx, ny, 70 + speed * 0.14);
        break;
      }
    }
  }

  function bossScaledDamage(mob, damage) {
    if (mob && mob.isBoss) {
      return damage * mobBossDamageMultiplier * bossStatScaleForStars(bossStarRank(mob), mobBossStarDamageMultiplier);
    }
    return damage * mobEliteStatScale(mob, mobEliteDamageMultiplier);
  }

  function bossCooldownScale(mob) {
    if (mob && mob.isBoss) {
      return 0.68 * bossCooldownScaleForStars(bossStarRank(mob));
    }
    return mobEliteCooldownScale(mob);
  }

  function bossChaseForce(mob, baseForce) {
    if (mob && mob.isBoss) {
      return baseForce * 1.18 * bossStatScaleForStars(bossStarRank(mob), mobBossStarForceMultiplier);
    }
    return baseForce * mobEliteStatScale(mob, mobEliteForceMultiplier);
  }
