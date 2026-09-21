  function steerHeatSeekingProjectile(state, projectile, players, dt) {
    if (!projectile || !projectile.heatSeeking || !players || !players.length) {
      return;
    }
    const targetInfo = nearestCombatPlayer(players, projectile);
    const target = targetInfo.player;
    if (!target) {
      return;
    }
    const currentSpeed = Math.max(80, Math.hypot(projectile.vx, projectile.vy) || finiteOr(projectile.targetSpeed, SATELLITE_MISSILE_SPEED));
    const targetSpeed = Math.max(120, finiteOr(projectile.targetSpeed, SATELLITE_MISSILE_SPEED));
    const leadTime = clamp(Math.hypot(target.x - projectile.x, target.y - projectile.y) / targetSpeed, 0, 0.58);
    const desiredAngle = Math.atan2(
      target.y + finiteOr(target.vy, 0) * leadTime * 0.48 - projectile.y,
      target.x + finiteOr(target.vx, 0) * leadTime * 0.48 - projectile.x
    );
    const currentAngle = Math.atan2(projectile.vy, projectile.vx);
    const turnRate = Math.max(0.4, finiteOr(projectile.turnRate, SATELLITE_BOSS_SEEKING_MISSILE_TURN_RATE));
    const angle = currentAngle + clamp(shortestAngleDelta(currentAngle, desiredAngle), -turnRate * dt, turnRate * dt);
    const nextSpeed = currentSpeed + (targetSpeed - currentSpeed) * (1 - Math.pow(0.04, dt));
    projectile.vx = Math.cos(angle) * nextSpeed;
    projectile.vy = Math.sin(angle) * nextSpeed;
  }

  function updateRivalProjectiles(state, dt, options) {
    const world = state.world;
    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    for (let i = world.rivalProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = world.rivalProjectiles[i];
      const sourcePlayerId = String(projectile.sourcePlayerId || "");
      const sourceStructureId = String(projectile.sourceStructureId || "");
      const sourceMobId = Math.max(0, Math.floor(finiteOr(projectile.sourceMobId, 0)));
      const playerTeamMobProjectile = projectile.team === "player" && sourceMobId > 0;
      const sourceStructure = sourceStructureId
        ? (world.structures || []).find((structure) => String(structure && structure.id || "") === sourceStructureId)
        : null;
      const structureIsMobOwned = Boolean(sourceStructure && isMobOwnedStructure(sourceStructure));
      const ownerPlayerId = structureIsMobOwned ? "" : String(projectile.ownerPlayerId || sourcePlayerId || "");
      const playerOwnedProjectile = Boolean(sourcePlayerId || ownerPlayerId || playerTeamMobProjectile);
      const nonMobStructureProjectile = Boolean(sourceStructureId && !structureIsMobOwned);
      const friendlyProjectile = playerOwnedProjectile || nonMobStructureProjectile;
      const previousX = projectile.x;
      const previousY = projectile.y;
      projectile.life = finiteOr(projectile.life, 0) - dt;
      steerHeatSeekingProjectile(state, projectile, playerTeamMobProjectile ? familiarHostileTargets(world, null) : players, dt);
      projectile.x += finiteOr(projectile.vx, 0) * dt;
      projectile.y += finiteOr(projectile.vy, 0) * dt;

      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const dirX = projectile.vx / speed;
      const dirY = projectile.vy / speed;
      const travel = Math.hypot(projectile.x - previousX, projectile.y - previousY);
      const sweptLength = Math.max(finiteOr(projectile.length, 40), travel + projectile.radius);
      const tailX = projectile.x - dirX * sweptLength;
      const tailY = projectile.y - dirY * sweptLength;
      const hitRadius = projectile.radius * (projectile.rocket ? 1.65 : 1);
      const blocker = projectileBlockedBySolidBody(world, tailX, tailY, projectile.x, projectile.y, projectile.radius, projectile.ignoredBodyId);
      if (blocker) {
        world.rivalProjectiles.splice(i, 1);
        state.events.push({
          type: "projectile.blocked",
          projectileId: projectile.id,
          bodyId: blocker.id,
          x: projectile.x,
          y: projectile.y,
          color: cloneColor(projectile.color),
          tick: state.tick
        });
        continue;
      }

      if (tradeVesselHitBySegment(state, tailX, tailY, projectile.x, projectile.y, hitRadius, finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE), projectile.cause || "projectile")) {
        world.rivalProjectiles.splice(i, 1);
        continue;
      }

      if (!friendlyProjectile) {
        const shieldBlocker = findProjectileShieldBlocker(world, tailX, tailY, projectile.x, projectile.y, projectile.radius, projectile);
        if (shieldBlocker && activateShieldGeneratorBlock(state, shieldBlocker.structure, shieldBlocker.body, shieldBlocker.cost, shieldBlocker.x, shieldBlocker.y, projectile)) {
          world.rivalProjectiles.splice(i, 1);
          continue;
        }
        const spacecraftHit = nearestSpacecraftComponentOnSegment(world, tailX, tailY, projectile.x, projectile.y, hitRadius);
        if (spacecraftHit) {
          const damage = projectile.lightning
            ? TESLA_LIGHTNING_DAMAGE
            : projectile.rocket ? STRUCTURE_ROCKET_DAMAGE : finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE) * 0.82;
          if (projectile.lightning) {
            spacecraftHit.component.disabledTimer = Math.max(finiteOr(spacecraftHit.component.disabledTimer, 0), finiteOr(projectile.toolDisable, TESLA_TOOL_DISABLE_DURATION));
          }
          damageSpacecraftComponent(state, spacecraftHit.craft, spacecraftHit.component, damage, projectile.cause || "mob projectile");
          world.rivalProjectiles.splice(i, 1);
          continue;
        }
      }

      if (friendlyProjectile) {
        const hitMobIds = Array.isArray(projectile.hitMobIds) ? projectile.hitMobIds : (projectile.hitMobIds = []);
        let hitMob = false;
        for (const mob of allCombatMobs(world)) {
          if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
            continue;
          }
          if (playerTeamMobProjectile && mob.id === sourceMobId) {
            continue;
          }
          const hitMobId = (mob.kind || "mob") + ":" + mob.id;
          if (hitMobIds.includes(hitMobId)) {
            continue;
          }
          const mobDist = distanceToSegment(mob.x, mob.y, tailX, tailY, projectile.x, projectile.y);
          if (mobDist >= mob.radius + hitRadius) {
            continue;
          }

          if (ownerPlayerId) aggroNearbyMobsFromPlayerDamage(state, mob, ownerPlayerId);
          if (mob.hitCooldown > 0) {
            if (!projectile.piercesMobs) {
              world.rivalProjectiles.splice(i, 1);
              hitMob = true;
            }
            break;
          }

          const knockback = finiteOr(projectile.knockback, playerTeamMobProjectile ? 125 : PLAYER_WEAPON_DEFAULTS.knockback);
          const damage = Math.max(0, finiteOr(projectile.damage, playerTeamMobProjectile ? RIVAL_PROJECTILE_DAMAGE : PLAYER_WEAPON_DEFAULTS.damage));
          const toolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));
          knockMob(mob, dirX, dirY, knockback);
          if (damage > 0) {
            damageMob(state, mob, damage, projectile.cause || "player-laser", {
              playerId: ownerPlayerId,
              projectileId: projectile.id,
              cause: projectile.cause || "player-laser",
              hostileActionType: "projectile-impact"
            });
          }
          if (toolDisable > 0) {
            disableMob(mob, toolDisable);
          }
          hitMobIds.push(hitMobId);
          state.events.push({
            type: sourcePlayerId ? "player.projectileHitMob" : sourceStructureId ? "structure.projectileHitMob" : "mob.projectileHitMob",
            playerId: sourcePlayerId,
            structureId: sourceStructureId,
            sourceMobId,
            mobId: mob.id,
            kind: mob.kind || "mob",
            projectileId: projectile.id,
            x: projectile.x,
            y: projectile.y,
            color: cloneColor(projectile.color),
            tick: state.tick
          });
          if (!projectile.piercesMobs) {
            world.rivalProjectiles.splice(i, 1);
            hitMob = true;
          }
          break;
        }
        if (hitMob) {
          continue;
        }
      }

      if (!friendlyProjectile) {
        let hitFamiliar = false;
        for (const mob of allCombatMobs(world)) {
          if (!mob || mob.health <= 0 || !isPlayerTeamMob(mob)) {
            continue;
          }
          const mobDist = distanceToSegment(mob.x, mob.y, tailX, tailY, projectile.x, projectile.y);
          if (mobDist >= finiteOr(mob.radius, 28) + hitRadius) {
            continue;
          }
          knockMob(mob, dirX, dirY, 125);
          damageMob(state, mob, finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE), projectile.cause || "mob projectile");
          world.rivalProjectiles.splice(i, 1);
          hitFamiliar = true;
          break;
        }
        if (hitFamiliar) {
          continue;
        }
      }

      let hitStructure = false;
      if (!sourceStructureId && !playerTeamMobProjectile && (projectile.rocket || projectile.lightning)) {
        for (const structure of world.structures || []) {
          if (
            !structure ||
            finiteOr(structure.health, 0) <= 0 ||
            projectile.lightning && isMobOwnedStructure(structure)
          ) {
            continue;
          }
          const structureDist = distanceToSegment(structure.x, structure.y, tailX, tailY, projectile.x, projectile.y);
          if (structureDist >= structureHitRadius(structure) + hitRadius * 0.72) {
            continue;
          }
          if (projectile.lightning) {
            const lightningDamage = Math.max(0, finiteOr(projectile.damage, 0));
            if (lightningDamage > 0) {
              damageStructure(state, structure, lightningDamage, projectile.cause || "Tesla lightning");
            }
            disableStructure(state, structure, STRUCTURE_TESLA_DISABLE_DURATION, projectile.cause || "Tesla lightning");
          } else {
            damageStructure(state, structure, STRUCTURE_ROCKET_DAMAGE, projectile.cause || "Satellite missile");
          }
          world.rivalProjectiles.splice(i, 1);
          hitStructure = true;
          break;
        }
      }
      if (hitStructure) {
        continue;
      }

      let hitPlayer = false;
      for (const target of players) {
        if (playerOwnedProjectile || nonMobStructureProjectile) {
          if (!canPlayerOwnedDamagePlayer(state, options, ownerPlayerId, target.id)) {
            continue;
          }
        }
        const dist = distanceToPlayerHurtboxSegment(target, tailX, tailY, projectile.x, projectile.y);
        if (dist >= target.radius * PLAYER_PROJECTILE_HURTBOX_SCALE + projectile.radius) {
          continue;
        }
        const rawProjectileDamage = Math.max(0, finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE));
        const projectileDamage = ownerPlayerId || playerTeamMobProjectile
          ? rawProjectileDamage
          : difficultyMobDamage(state, rawProjectileDamage);
        const projectileToolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));
        const canDamageTarget = target.hitCooldown <= 0 && projectileDamage > 0;
        const damagedTarget = canDamageTarget && damagePlayer(state, target, projectileDamage, projectile.cause || "Alienoid laser");
        const disabledTarget = projectileToolDisable > 0;
        if (damagedTarget || disabledTarget) {
          const impulse = ownerPlayerId ? finiteOr(projectile.knockback, PLAYER_WEAPON_DEFAULTS.knockback) : 190;
          target.vx += dirX * impulse + finiteOr(projectile.vx, 0) * 0.34;
          target.vy += dirY * impulse + finiteOr(projectile.vy, 0) * 0.34;
          if (damagedTarget) {
            target.hitCooldown = Math.max(finiteOr(target.hitCooldown, 0), 0.72);
          }
          if (disabledTarget) {
            applyPlayerStatusEffect(target, "disabled", projectileToolDisable);
          }
          state.events.push({
            type: ownerPlayerId ? "player.hitByPlayerProjectile" : "player.hitByMobProjectile",
            playerId: target.id,
            sourcePlayerId: ownerPlayerId,
            projectileId: projectile.id,
            x: projectile.x,
            y: projectile.y,
            color: cloneColor(projectile.color),
            tick: state.tick
          });
        }
        world.rivalProjectiles.splice(i, 1);
        hitPlayer = true;
        break;
      }
      if (!hitPlayer && projectile.life <= 0) {
        world.rivalProjectiles.splice(i, 1);
      }
    }
  }

  function hasClearShotAtMob(world, x, y, mob, ignoredBodyId) {
    return !projectileBlockedBySolidBody(world, x, y, mob.x, mob.y, Math.max(4, mob.radius * 0.2), ignoredBodyId);
  }

  function findTurretTarget(stateOrWorld, turret) {
    const state = stateOrWorld && stateOrWorld.world ? stateOrWorld : null;
    const world = state ? state.world : stateOrWorld;
    if (isSurvivalCampStructure(state || { world, gameMode: world && world.gameMode }, turret)) {
      return findCampTurretPlayerTarget(state, world, turret, TURRET_RANGE);
    }

    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      const distance = Math.hypot(mob.x - turret.x, mob.y - turret.y);
      if (distance > TURRET_RANGE || distance >= bestDistance) {
        continue;
      }
      const normalX = Math.cos(turret.angle);
      const normalY = Math.sin(turret.angle);
      const aboveSurface = (mob.x - turret.x) * normalX + (mob.y - turret.y) * normalY;
      if (aboveSurface < -mob.radius * 0.2 || !hasClearShotAtMob(world, turret.x, turret.y, mob, turret.bodyId)) {
        continue;
      }
      best = mob;
      bestDistance = distance;
    }
    return best;
  }

  function survivalCampStructureIsAggro(state, structure) {
    if (!structure || !isSurvivalCampStructure(state, structure)) {
      return false;
    }
    const controller = survivalCampControllerForStructure(state, structure);
    return controller
      ? ["engage", "revenge"].includes(controller.phase)
      : finiteOr(structure.survivalCampAggroTimer, 0) > 0;
  }

  function campStructureCanSeePlayer(world, structure, player) {
    if (!structure || !player) {
      return false;
    }
    const normalX = Math.cos(finiteOr(structure.angle, 0));
    const normalY = Math.sin(finiteOr(structure.angle, 0));
    const playerRadius = finiteOr(player.radius, PLAYER_RADIUS);
    const aboveSurface = (player.x - structure.x) * normalX + (player.y - structure.y) * normalY;
    if (aboveSurface < -playerRadius * 0.2) {
      return false;
    }
    return !projectileBlockedBySolidBody(world, structure.x, structure.y, player.x, player.y, Math.max(4, playerRadius * 0.18), structure.bodyId);
  }

  function findCampStructurePlayerTarget(state, world, structure, maxRange) {
    if (!state || !survivalCampStructureIsAggro(state, structure)) {
      return null;
    }
    const controller = survivalCampControllerForStructure(state, structure);
    const preferredTargetId = String(controller && controller.primaryAggressorId || structure.survivalTargetPlayerId || "");
    if (!preferredTargetId) {
      return null;
    }
    let best = null;
    let bestDistance = Infinity;
    const candidates = controller && ["engage", "revenge"].includes(controller.phase)
      ? survivalTargetsForController(state, controller)
      : Object.values(state.players || {});
    for (const target of candidates) {
      if (!target || finiteOr(target.health, 0) <= 0 || target.spacecraftInterior) {
        continue;
      }
      const targetId = String(target.id || "");
      const distance = Math.hypot(target.x - structure.x, target.y - structure.y);
      const scoreDistance = distance * (preferredTargetId && targetId === preferredTargetId ? 0.72 : 1);
      if (distance > maxRange || scoreDistance >= bestDistance || !campStructureCanSeePlayer(world, structure, target)) {
        continue;
      }
      best = target;
      bestDistance = scoreDistance;
    }
    return best;
  }

  function findCampTurretPlayerTarget(state, world, structure, maxRange) {
    if (!state || !world) {
      return null;
    }
    let best = null;
    let bestDistance = Infinity;
    for (const target of Object.values(state.players || {})) {
      if (!target || finiteOr(target.health, 0) <= 0 || target.spacecraftInterior) {
        continue;
      }
      const distance = Math.hypot(target.x - structure.x, target.y - structure.y);
      if (distance > maxRange || distance >= bestDistance || !campStructureCanSeePlayer(world, structure, target)) {
        continue;
      }
      best = target;
      bestDistance = distance;
    }
    if (best) {
      const targetId = String(best.id || "");
      if (targetId && structure.survivalProximityTargetPlayerId !== targetId) {
        structure.survivalAggroAlertTimer = SURVIVAL_AGGRO_ALERT_DURATION;
      }
      structure.survivalProximityTargetPlayerId = targetId;
      structure.survivalTargetPlayerId = targetId;
    } else {
      structure.survivalProximityTargetPlayerId = "";
    }
    return best;
  }

  function fireTurretLaser(state, turret, target, dist) {
    if (isSurvivalCampStructure(state, turret)) {
      fireCampTurretLaser(state, turret, target, dist);
      return;
    }

    const leadTime = clamp(dist / TURRET_LASER_SPEED, 0, 1.1);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.52;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * TURRET_LASER_SPEED,
      vy: aim.y * TURRET_LASER_SPEED,
      radius: 4,
      length: 38,
      color,
      life: 1.15,
      maxLife: 1.15,
      damage: TURRET_LASER_DAMAGE,
      knockback: TURRET_LASER_KNOCKBACK,
      cause: "Turret laser",
      sourceStructureId: String(turret.id || ""),
      ownerPlayerId: String(turret.ownerPlayerId || ""),
      ignoredBodyId: turret.bodyId,
      hitMobIds: []
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    turret.shootCooldown = TURRET_SHOOT_COOLDOWN;
    state.events.push({ type: "structure.shot", structureId: turret.id, projectileId: projectile.id, tick: state.tick });
  }

  function fireCampTurretLaser(state, turret, target, dist) {
    const leadTime = clamp(dist / TURRET_LASER_SPEED, 0, 1.1);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.52;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * TURRET_LASER_SPEED,
      vy: aim.y * TURRET_LASER_SPEED,
      radius: 4,
      length: 38,
      color,
      life: 1.15,
      maxLife: 1.15,
      damage: TURRET_LASER_DAMAGE,
      knockback: TURRET_LASER_KNOCKBACK,
      cause: "Camp turret",
      sourceStructureId: String(turret.id || ""),
      ownerPlayerId: "",
      ignoredBodyId: turret.bodyId,
      targetPlayerId: String(target.id || ""),
      hitMobIds: []
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    turret.shootCooldown = TURRET_SHOOT_COOLDOWN;
    state.events.push({ type: "structure.shot", structureId: turret.id, projectileId: projectile.id, tick: state.tick });
  }

  function landedJetDirectionForBody(state, inputs, bodyId, dt) {
    let forward = false;
    let reverse = false;
    for (const [playerId, player] of Object.entries(state.players || {})) {
      if (!player || player.health <= 0 || !player.landed || player.landed.bridgeId || player.landed.bodyId !== bodyId) {
        continue;
      }
      const input = sanitizeInput(inputs[playerId], player, { dt, requireEnergy: true, allowCommittedToolMode: true });
      forward = forward || input.buttons.up;
      reverse = reverse || input.buttons.down;
    }
    return forward === reverse ? 0 : (forward ? -1 : 1);
  }

  function updateJet(state, structure, inputs, dt) {
    const world = state.world;
    const body = bodyById(world, structure.bodyId);
    const direction = body ? landedJetDirectionForBody(state, inputs, body.id, dt) : 0;
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.6, 0, 1);

    if (!body || !isStructureHostBody(body) || !direction) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      return;
    }

    if (!spendBodyEnergy(world, body, JET_ENERGY_DRAIN * dt)) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      return;
    }

    const nx = Math.cos(structure.angle);
    const ny = Math.sin(structure.angle);
    const massDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(body.mass, 1) / 150), 0.42), 0.08, 1.1);
    const thrust = JET_THRUST * massDamping * clamp(structure.deploy, 0.2, 1);
    applyBodyVelocityChangeAtPoint(
      body,
      nx * direction * thrust * dt,
      ny * direction * thrust * dt,
      structure.x,
      structure.y,
      1
    );
    structure.thrustAmount += (1 - finiteOr(structure.thrustAmount, 0)) * (1 - Math.pow(0.02, dt));
    structure.thrustDirection = direction;
  }

  function canAccumulatorPullParticle(particle) {
    return Boolean(particle && particle.tier && particle.tier.name === "particle");
  }

  function updateAccumulator(state, structure, dt) {
    const world = state.world;
    const body = bodyById(world, structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }

    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    structure.burstCooldown = Math.max(0, finiteOr(structure.burstCooldown, ACCUMULATOR_BURST_INTERVAL) - dt);
    if (structure.burstTimer <= 0 && structure.burstCooldown <= 0) {
      if (spendBodyEnergy(world, body, ACCUMULATOR_BURST_COST)) {
        structure.burstTimer = ACCUMULATOR_BURST_DURATION;
        structure.burstCooldown = ACCUMULATOR_BURST_INTERVAL;
      } else {
        structure.burstCooldown = 0.6;
      }
    }

    let strongestPull = 0;
    const range = ACCUMULATOR_RANGE + Math.min(260, finiteOr(body.radius, radiusFromMass(body.mass)) * 0.9);
    const burstProgress = clamp(structure.burstTimer / ACCUMULATOR_BURST_DURATION, 0, 1);
    const wave = Math.sin((1 - burstProgress) * Math.PI);
    if (structure.burstTimer > 0) {
      for (const particle of world.particles || []) {
        if (particle.id === body.id || !canAccumulatorPullParticle(particle)) {
          continue;
        }
        const toBodyX = body.x - particle.x;
        const toBodyY = body.y - particle.y;
        const dist = Math.hypot(toBodyX, toBodyY) || 1;
        if (dist > range + finiteOr(particle.radius, 1)) {
          continue;
        }
        const rawPull = clamp(1 - Math.max(0, dist - finiteOr(body.radius, radiusFromMass(body.mass))) / range, 0.02, 1);
        const pull = Math.pow(rawPull, 1.32) * (0.55 + wave * 0.9);
        const deployPull = 0.34 + clamp(structure.deploy, 0, 1) * 0.66;
        const massResistance = clamp(1 / Math.pow(Math.max(1, finiteOr(particle.mass, 1)), 0.18), 0.26, 1);
        const force = ACCUMULATOR_FORCE * 2.15 * pull * deployPull * massResistance;
        particle.vx += (toBodyX / dist) * force * dt;
        particle.vy += (toBodyY / dist) * force * dt;
        strongestPull = Math.max(strongestPull, pull);
      }
    }
    const targetDeploy = strongestPull > 0 ? 0.36 + strongestPull * 0.64 : 0;
    structure.deploy += (targetDeploy - finiteOr(structure.deploy, 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);
  }

  function shieldGeneratorRadius(body) {
    if (!body) {
      return 0;
    }
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    return radius + SHIELD_GENERATOR_FIELD_PADDING + Math.min(240, radius * 0.18);
  }

  function projectileShieldCost(projectile) {
    if (projectile && projectile.rocket) {
      return SHIELD_GENERATOR_ROCKET_COST;
    }
    if (projectile && projectile.lightning) {
      return SHIELD_GENERATOR_LIGHTNING_COST;
    }
    return SHIELD_GENERATOR_PROJECTILE_COST;
  }

  function powerOutShieldGenerator(state, structure, cause) {
    if (!structure || finiteOr(structure.health, 0) <= 0) {
      return;
    }
    structure.disabledTimer = Math.max(finiteOr(structure.disabledTimer, 0), SHIELD_GENERATOR_POWER_OUT_DURATION);
    structure.burstTimer = 0;
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.26);
    state.events.push({ type: "structure.shieldPowerOut", structureId: structure.id, cause: cause || "projectile", tick: state.tick });
  }

  function activateShieldGeneratorBlock(state, structure, body, cost, hitX, hitY, projectile) {
    if (!structure || !body || finiteOr(structure.health, 0) <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    if (!spendBodyEnergy(state.world, body, cost)) {
      powerOutShieldGenerator(state, structure, projectile && projectile.cause);
      return false;
    }
    structure.deploy = 1;
    structure.burstTimer = 0.34;
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.16);
    state.events.push({
      type: "structure.shieldBlockedProjectile",
      structureId: structure.id,
      projectileId: projectile && projectile.id,
      x: hitX,
      y: hitY,
      color: projectile && projectile.color ? cloneColor(projectile.color) : { r: 119, g: 167, b: 255 },
      tick: state.tick
    });
    if (finiteOr(body.energy, 0) <= 0.05) {
      powerOutShieldGenerator(state, structure, projectile && projectile.cause);
    }
    return true;
  }

  function findProjectileShieldBlocker(world, ax, ay, bx, by, padding, projectile) {
    let nearest = null;
    const cost = projectileShieldCost(projectile);
    for (const structure of world.structures || []) {
      if (
        structure.type !== "shield-generator" ||
        finiteOr(structure.health, 0) <= 0 ||
        isStructureDisabled(structure) ||
        projectile && projectile.lightning && isMobOwnedStructure(structure)
      ) {
        continue;
      }
      const body = bodyById(world, structure.bodyId);
      if (!isStructureHostBody(body)) {
        continue;
      }
      const radius = shieldGeneratorRadius(body) + padding;
      const hit = segmentCircleIntersection(body.x, body.y, radius, ax, ay, bx, by);
      if (!hit || (nearest && hit.t >= nearest.t)) {
        continue;
      }
      nearest = { structure, body, cost, x: hit.x, y: hit.y, t: hit.t };
    }
    return nearest;
  }
