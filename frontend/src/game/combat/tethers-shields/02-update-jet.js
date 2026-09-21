  function updateJet(structure, dt) {
    const body = bodyById(structure.bodyId);
    const landedHere = player.landed && body && player.landed.bodyId === body.id;
    const forward = landedHere && isMovementKeyPressed("up");
    const reverse = landedHere && isMovementKeyPressed("down");
    const direction = forward === reverse ? 0 : (forward ? -1 : 1);

    structure.deploy = clamp((structure.deploy || 0) + dt * 3.6, 0, 1);

    if (!body || !isStructureHostBody(body) || !direction || buildMenuOpen) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      return;
    }

    const energyCost = jetEnergyDrain * dt;
    if (!spendBodyEnergy(body, energyCost)) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      notifyEnergyDepleted();
      return;
    }

    const nx = Math.cos(structure.angle);
    const ny = Math.sin(structure.angle);
    const massDamping = clamp(1 / Math.pow(Math.max(1, body.mass / 150), 0.42), 0.08, 1.1);
    const thrust = jetThrust * massDamping * clamp(structure.deploy || 0, 0.2, 1);

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

    if (Math.random() < dt * 2.8) {
      sparks.push({
        x: structure.x - nx * direction * 28 + randomRange(-8, 8),
        y: structure.y - ny * direction * 28 + randomRange(-8, 8),
        radius: 18 + randomRange(0, 18),
        color: { r: 169, g: 133, b: 255 },
        life: 0.14,
        maxLife: 0.14
      });
    }
  }

  function medbayHalfAngle(body, structure) {
    const centerRadius = Math.max(24, body.radius + structureBaseSurfaceOffset(structure) + medbayInteriorWidth * 0.18);
    return Math.min(Math.PI, medbayInteriorWidth / centerRadius / 2);
  }

  function playerInsideMedbay(body, structure) {
    return Boolean(
      player.landed &&
      !player.landed.bridgeId &&
      body &&
      player.landed.bodyId === body.id &&
      Math.abs(shortestAngleDelta(finiteOr(structure.angle, 0), finiteOr(player.landed.angle, 0))) <= medbayHalfAngle(body, structure)
    );
  }

  function updateMedbay(structure, dt) {
    const body = bodyById(structure.bodyId);
    const missingHealth = Math.max(0, finiteOr(player.maxHealth, 100) - finiteOr(player.health, 0));
    const canHeal = missingHealth > 0 && playerInsideMedbay(body, structure);
    const maxHeal = Math.min(missingHealth, medbayHealRate * dt);
    const energyCost = medbayHealRate > 0 ? medbayEnergyDrain * (maxHeal / medbayHealRate) : 0;
    const healing = canHeal && maxHeal > 0 && spendBodyEnergy(body, energyCost);

    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.2, 0, 1);
    structure.healPulse = clamp(finiteOr(structure.healPulse, 0) - dt * 2.6, 0, 1);

    if (!healing) {
      return;
    }

    player.health = Math.min(player.maxHealth, player.health + maxHeal);
    structure.healPulse = 1;
    if (Math.random() < dt * 2.4) {
      sparks.push({
        x: player.x + randomRange(-10, 10),
        y: player.y + randomRange(-16, 10),
        radius: 14 + randomRange(0, 14),
        color: { r: 123, g: 255, b: 173 },
        life: 0.16,
        maxLife: 0.16
      });
    }
  }

  function updateStructures(dt) {
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (!applyStructureSurfaceConstraint(structure)) {
        sparks.push({
          x: structure.x,
          y: structure.y,
          radius: 46,
          color: { r: 255, g: 209, b: 102 },
          life: 0.28,
          maxLife: 0.28
        });
        structures.splice(i, 1);
        continue;
      }
      if (shouldSleepDistantSurvivalStructure(structure)) {
        continue;
      }

      const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
      structure.maxHealth = maxHealth;
      structure.health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
      structure.disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0) - dt);
      structure.flash = Math.max(0, finiteOr(structure.flash, 0) - dt);
      if (isSurvivalCampStructure(structure)) {
        structure.survivalCampAggroTimer = Math.max(0, finiteOr(structure.survivalCampAggroTimer, 0) - dt);
        structure.survivalAggroAlertTimer = Math.max(0, finiteOr(structure.survivalAggroAlertTimer, 0) - dt);
        if (structure.survivalCampAggroTimer <= 0) {
          structure.survivalTargetPlayerId = "";
        }
      }

      if (structure.health <= 0 || isStructureDisabled(structure)) {
        structure.deploy = clamp((structure.deploy || 0) - dt * 2.1, 0, 1);
        structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
        continue;
      }

      if (structure.type === "plating-block") {
        structure.deploy = clamp((structure.deploy || 0) + dt * 4.2, 0, 1);
        continue;
      }

      if (structure.type === "battery") {
        structure.deploy = clamp((structure.deploy || 0) + dt * 3.4, 0, 1);
        if (Math.random() < dt * 0.7) {
          sparks.push({
            x: structure.x + randomRange(-10, 10),
            y: structure.y + randomRange(-10, 10),
            radius: 16,
            color: { r: 157, g: 255, b: 122 },
            life: 0.16,
            maxLife: 0.16
          });
        }
        continue;
      }

      if (structure.type === "medbay") {
        updateMedbay(structure, dt);
        continue;
      }

      if (structure.type === "accumulator") {
        updateAccumulator(structure, dt);
        continue;
      }

      if (structure.type === "shield-generator") {
        updateShieldGenerator(structure, dt);
        continue;
      }

      if (structure.type === "missile-launcher") {
        updateMissileLauncher(structure, dt);
        continue;
      }

      if (structure.type === "trading-port") {
        updateTradingPort(structure, dt);
        continue;
      }

      if (structure.type === "communication-relay") {
        structure.deploy = clamp((structure.deploy || 0) + dt * 2.4, 0, 1);
        if (Math.random() < dt * 0.65) {
          sparks.push({
            x: structure.x + randomRange(-10, 10),
            y: structure.y + randomRange(-34, 4),
            radius: 18,
            color: { r: 255, g: 184, b: 107 },
            life: 0.18,
            maxLife: 0.18
          });
        }
        continue;
      }

      if (structure.type === "jet") {
        updateJet(structure, dt);
        continue;
      }

      if (structure.type === "tether") {
        updateTether(structure, dt);
        continue;
      }

      if (structure.type === "bridge") {
        updateBridge(structure, dt);
        continue;
      }

      structure.shootCooldown = Math.max(0, structure.shootCooldown - dt);
      const target = structure.type === "turret" ? findTurretTarget(structure) : null;
      const normalAngle = structure.angle;

      if (target) {
        const targetAngle = Math.atan2(target.y - structure.y, target.x - structure.x);
        structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, targetAngle), -4.2 * dt, 4.2 * dt);
        structure.deploy = clamp(structure.deploy + dt * 2.8, 0, 1);

        const dist = Math.hypot(target.x - structure.x, target.y - structure.y);
        const hostBody = bodyById(structure.bodyId);
        if (structure.deploy > 0.72 && structure.shootCooldown <= 0 && spendBodyEnergy(hostBody, turretEnergyCost)) {
          fireTurretLaser(structure, target, dist);
        }
      } else {
        structure.aimAngle += clamp(shortestAngleDelta(structure.aimAngle, normalAngle), -2.2 * dt, 2.2 * dt);
        structure.deploy = clamp(structure.deploy - dt * 1.6, 0, 1);
      }
    }

    solveBridgeConstraints(dt);
    solveTetherConstraints(dt);
  }
