  function hitCombatPlayerWithRocket(rocket, target, nx, ny) {
    const targetPlayer = target && target.player ? target.player : player;
    if ((target && target.local && player.hitCooldown > 0) || rocket.impactCooldown > 0) {
      return;
    }

    if (target && target.familiarEnemy) {
      const enemy = target.player;
      knockMob(enemy, nx, ny, 245);
      damageMob(enemy, difficultyMobDamage(bossScaledDamage(rocket, rocketImpactDamage)), rocket.color, mobName(enemy) + " struck by your rocket familiar.");
    } else if (target && target.spacecraft && target.spacecraftComponent) {
      damageSpacecraftComponent(
        target.spacecraft,
        target.spacecraftComponent,
        difficultyMobDamage(bossScaledDamage(rocket, structureRocketDamage + rocketImpactDamage * 0.65)),
        rocket.color,
        target.spacecraft.name + " " + target.spacecraftComponent.label.toLowerCase() + " cracked by a rocket ship."
      );
    } else if (target && target.familiar) {
      damageMob(target.player, difficultyMobDamage(bossScaledDamage(rocket, rocketImpactDamage)), rocket.color, "Your familiar was struck by a rocket ship.");
    } else if (target && !target.local && target.remote) {
      sendRemoteEntityEffect(target.remote, {
        entityType: "player",
        sourceKind: "mob",
        cause: rocket.isBoss ? "Rocket boss ship" : "Rocket ship",
        damage: difficultyMobDamage(bossScaledDamage(rocket, rocketImpactDamage)),
        impulseX: nx * 420 + rocket.vx * 0.52,
        impulseY: ny * 420 + rocket.vy * 0.52,
        color: rocket.color
      });
    } else {
      if (player.landed) {
        detachFromBody(240);
      }

      player.vx += nx * 420 + rocket.vx * 0.52;
      player.vy += ny * 420 + rocket.vy * 0.52;
      damageLocalPlayer(difficultyMobDamage(bossScaledDamage(rocket, rocketImpactDamage)), {
        cause: rocket.isBoss ? "Rocket boss ship" : "Rocket ship",
        cooldown: 0.9,
        flash: 0.34
      });
    }

    rocket.impactCooldown = 0.95;
    rocket.recoverTimer = Math.max(rocket.recoverTimer, 0.7);
    rocket.chargeCooldown = randomRange(rocketChargeCooldownMin, rocketChargeCooldownMax);
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

    sparks.push({
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: 68,
      color: rocket.color,
      life: 0.36,
      maxLife: 0.36
    });
  }

  function rocketAttackTarget(rocket, playerTarget) {
    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    if (playerTarget && playerTarget.familiarEnemy) {
      return {
        kind: "player",
        target: playerTarget,
        x: targetPlayer.x,
        y: targetPlayer.y,
        vx: finiteOr(targetPlayer.vx, 0),
        vy: finiteOr(targetPlayer.vy, 0),
        radius: targetPlayer.radius || player.radius
      };
    }

    const playerDistance = Math.hypot(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const structure = nearestStructureTarget(rocket.x, rocket.y, 1180, (candidate) => candidate.health > 0);

    if (structure) {
      const structureDistance = Math.hypot(structure.x - rocket.x, structure.y - rocket.y);
      if (structureDistance < playerDistance * 1.18 && hasClearShotAtStructure(rocket.x, rocket.y, structure, null)) {
        return {
          kind: "structure",
          structure,
          x: structure.x,
          y: structure.y,
          vx: 0,
          vy: 0,
          radius: structureHitRadius(structure)
        };
      }
    }

    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      vx: finiteOr(targetPlayer.vx, 0),
      vy: finiteOr(targetPlayer.vy, 0),
      radius: targetPlayer.radius || player.radius
    };
  }

  function hasClearShotAtRocketTarget(rocket, target) {
    if (target.kind === "structure") {
      return hasClearShotAtStructure(rocket.x, rocket.y, target.structure, null);
    }
    return hasClearShotAtCombatTarget(rocket, target.target);
  }

  function updateRocketPlayerImpact(rocket, target) {
    const targetPlayer = target && target.player ? target.player : player;
    const dx = targetPlayer.x - rocket.x;
    const dy = targetPlayer.y - rocket.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = (targetPlayer.radius || player.radius) * 0.74 + rocket.radius * 0.88;

    if (dist > hitDistance) {
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const overlap = hitDistance - dist;

    if (target && target.local) {
      player.x += nx * overlap * 0.68;
      player.y += ny * overlap * 0.68;
    } else if (target && target.familiarEnemy) {
      target.player.x += nx * overlap * 0.68;
      target.player.y += ny * overlap * 0.68;
    }
    rocket.x -= nx * overlap * 0.32;
    rocket.y -= ny * overlap * 0.32;

    if (speed > rocketImpactSpeed) {
      hitCombatPlayerWithRocket(rocket, target || { local: true, remote: null, player }, nx, ny);
    }
  }

  function updateRocketStructureImpact(rocket) {
    if (isPlayerTeamMob(rocket)) {
      return;
    }
    if (rocket.impactCooldown > 0) {
      return;
    }

    const speed = Math.hypot(rocket.vx, rocket.vy);
    if (speed <= rocketImpactSpeed * 0.82) {
      return;
    }

    for (const structure of structures) {
      if (structure.health <= 0) {
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
      rocket.recoverTimer = Math.max(rocket.recoverTimer, 0.7);
      rocket.chargeCooldown = randomRange(rocketChargeCooldownMin, rocketChargeCooldownMax);
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
      damageStructure(structure, difficultyMobDamage(bossScaledDamage(rocket, structureRocketDamage + Math.max(0, speed - rocketImpactSpeed) * 0.035)), rocket.color);
      break;
    }
  }

