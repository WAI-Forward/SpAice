  function electricAttackTarget(tesla, playerTarget) {
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

    const playerDistance = Math.hypot(targetPlayer.x - tesla.x, targetPlayer.y - tesla.y);
    const structure = nearestStructureTarget(tesla.x, tesla.y, teslaLightningRange * 0.95, (candidate) => candidate.health > 0);

    if (structure) {
      const structureDistance = Math.hypot(structure.x - tesla.x, structure.y - tesla.y);
      if (structureDistance < playerDistance * 1.12 && hasClearShotAtStructure(tesla.x, tesla.y, structure, null)) {
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

  function hasClearShotAtElectricTarget(tesla, target) {
    if (target.kind === "structure") {
      return hasClearShotAtStructure(tesla.x, tesla.y, target.structure, null);
    }
    return hasClearShotAtCombatTarget(tesla, target.target);
  }

  function findEngineerHealTarget(engineer) {
    let best = null;
    let bestScore = Infinity;
    const healPlayerTeam = isPlayerTeamMob(engineer);

    for (const mob of allCombatMobs()) {
      if (mob === engineer || mob.kind === "engineer" || mob.health <= 0 || mob.health >= mob.maxHealth || isPlayerTeamMob(mob) !== healPlayerTeam) {
        continue;
      }

      const distance = Math.hypot(mob.x - engineer.x, mob.y - engineer.y);
      const missing = Math.max(0, mob.maxHealth - mob.health);
      const score = distance - missing * 2.7;
      if (distance < engineerHealRange * 1.45 && score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }

    return best;
  }

  function updateEngineers(dt) {
    for (let i = engineers.length - 1; i >= 0; i -= 1) {
      const engineer = engineers[i];
      tickMobDamageTimers(engineer, dt);
      engineer.flash = Math.max(0, engineer.flash - dt);
      engineer.healCooldown = Math.max(0, engineer.healCooldown - dt);
      engineer.healPulse = Math.max(0, (engineer.healPulse || 0) - dt);

      if (engineer.health <= 0) {
        engineers.splice(i, 1);
        continue;
      }
      if (isMobSummoning(engineer)) {
        continue;
      }
      updateBossSpawnPressure(engineer, dt);
      if (isMobDisabled(engineer)) {
        engineer.healPulse = 0;
        engineer.targetKind = "";
        engineer.targetId = 0;
        updateDisabledMobDrift(engineer, dt);
        continue;
      }

      if (updateSurvivalCampMobHome(engineer, dt)) {
        continue;
      }

      const playerTarget = combatTargetForMob(engineer);
      if (!playerTarget) {
        updateFamiliarMob(engineer, dt);
        continue;
      }
      const targetPlayer = playerTarget.player;
      const playerDist = Math.hypot(targetPlayer.x - engineer.x, targetPlayer.y - engineer.y) || 1;
      const bossAltReady = tickBossAltAttackCooldown(engineer, dt);

      if (playerDist > Math.max(width, height) * 2.55 + 1800) {
        const spawn = relocatedMobOffscreenPoint(210, 600, targetPlayer);
        engineer.x = spawn.x;
        engineer.y = spawn.y;
        engineer.vx = randomRange(-16, 16);
        engineer.vy = randomRange(-16, 16);
        engineer.healCooldown = randomRange(0.35, 0.9);
        continue;
      }

      if (bossAltReady && playerDist < 1180) {
        summonEngineerBossMob(engineer, targetPlayer);
      }

      const healTarget = findEngineerHealTarget(engineer);
      const focusX = healTarget ? healTarget.x : targetPlayer.x;
      const focusY = healTarget ? healTarget.y : targetPlayer.y;
      const toFocusX = focusX - engineer.x;
      const toFocusY = focusY - engineer.y;
      const focusDist = Math.hypot(toFocusX, toFocusY) || 1;
      const nx = toFocusX / focusDist;
      const ny = toFocusY / focusDist;
      const tangentX = -ny * engineer.strafeSign;
      const tangentY = nx * engineer.strafeSign;

      if (healTarget) {
        const desiredDistance = 260;
        const chaseForce = bossChaseForce(engineer, focusDist > desiredDistance ? 116 : -34);
        const strafeForce = bossStrafeForce(engineer, 34);
        engineer.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
        engineer.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;

        if (focusDist < engineerHealRange && engineer.healCooldown <= 0 && hasClearShotAtMob(engineer.x, engineer.y, healTarget, null)) {
          const healed = Math.min(healTarget.maxHealth - healTarget.health, bossScaledDamage(engineer, engineerHealRate));
          if (healed > 0) {
            healTarget.health += healed;
            healTarget.flash = Math.max(healTarget.flash || 0, 0.12);
            engineer.healPulse = 0.38;
            engineer.repairBeamAngle = Math.atan2(healTarget.y - engineer.y, healTarget.x - engineer.x);
            engineer.targetKind = healTarget.kind;
            engineer.targetId = healTarget.id;
            sparks.push({
              x: healTarget.x,
              y: healTarget.y,
              radius: healTarget.radius * 1.4,
              color: engineer.color,
              life: 0.24,
              maxLife: 0.24
            });
            playSound("pickupHealth", { throttleKey: "engineerHeal", throttle: 0.22 });
          }
          engineer.healCooldown = engineerHealCooldown * bossCooldownScale(engineer);
        }
      } else {
        const awayX = engineer.x - targetPlayer.x;
        const awayY = engineer.y - targetPlayer.y;
        const awayDist = Math.hypot(awayX, awayY) || 1;
        const keepAway = playerDist < 520 ? 90 : -18;
        const evadeForce = bossChaseForce(engineer, keepAway);
        const strafeForce = bossStrafeForce(engineer, 22);
        engineer.vx += (awayX / awayDist) * evadeForce * dt + tangentX * strafeForce * dt;
        engineer.vy += (awayY / awayDist) * evadeForce * dt + tangentY * strafeForce * dt;
        engineer.targetKind = "";
        engineer.targetId = 0;
      }

      engineer.vx += Math.sin(performance.now() * 0.00058 + engineer.wobble) * 7 * dt;
      engineer.vy += Math.cos(performance.now() * 0.00052 + engineer.wobble) * 7 * dt;
      engineer.vx *= Math.pow(0.72, dt);
      engineer.vy *= Math.pow(0.72, dt);

      const speed = Math.hypot(engineer.vx, engineer.vy);
      const maxSpeed = bossChaseMaxSpeed(engineer, healTarget && focusDist > 520 ? 170 : 132, nx, ny);
      if (speed > maxSpeed) {
        engineer.vx = (engineer.vx / speed) * maxSpeed;
        engineer.vy = (engineer.vy / speed) * maxSpeed;
      }

      engineer.x += engineer.vx * dt;
      engineer.y += engineer.vy * dt;
      engineer.rotation = Math.atan2(engineer.vy || ny, engineer.vx || nx) + Math.PI / 2;
    }
  }
