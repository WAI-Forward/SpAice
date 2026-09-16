  function drawStructure(structure, time, alpha, valid) {
    if (structure.type === "plating-block") {
      drawPlatingBlock(structure, time, alpha, valid);
    } else if (structure.type === "battery") {
      drawBattery(structure, time, alpha, valid);
    } else if (structure.type === "container") {
      drawContainer(structure, time, alpha, valid);
    } else if (structure.type === "trading-port") {
      drawTradingPort(structure, time, alpha, valid);
    } else if (structure.type === "medbay") {
      drawMedbay(structure, time, alpha, valid);
    } else if (structure.type === "accumulator") {
      drawAccumulator(structure, time, alpha, valid);
    } else if (structure.type === "shield-generator") {
      drawShieldGenerator(structure, time, alpha, valid);
    } else if (structure.type === "communication-relay") {
      drawCommunicationRelay(structure, time, alpha, valid);
    } else if (structure.type === "jet") {
      drawJet(structure, time, alpha, valid);
    } else if (structure.type === "tether") {
      drawTether(structure, time, alpha, valid);
    } else if (structure.type === "bridge") {
      drawBridge(structure, time, alpha, valid);
    } else if (structure.type === "missile-launcher") {
      drawMissileLauncher(structure, time, alpha, valid);
    } else {
      drawTurret(structure, time, alpha, valid);
    }

    drawStructureStatus(structure, alpha, valid);
  }

  function drawStructureStatus(structure, alpha, valid) {
    if (gameSettings.hudEnabled === false) {
      return;
    }

    if (valid === false || !Number.isFinite(Number(structure.health))) {
      return;
    }

    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    const damaged = health < maxHealth;
    const disabled = isStructureDisabled(structure) || health <= 0;
    if (!damaged && !disabled && !(structure.flash > 0)) {
      return;
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    if (disabled) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(157, 255, 122, 0.58)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(structure.x, structure.y, structureHitRadius(structure) * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    if (damaged) {
      const barWidth = 54;
      const barY = structure.y - structureHitRadius(structure) - 14;
      const pct = clamp(health / maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      roundRectPath(structure.x - barWidth / 2, barY, barWidth, 6, 3);
      ctx.fill();
      ctx.fillStyle = pct > 0.45 ? "#ffd166" : "#ff6d6d";
      roundRectPath(structure.x - barWidth / 2, barY, barWidth * pct, 6, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStructures(time) {
    for (const structure of structures) {
      if (!isWorldCircleNearView(structure.x, structure.y, 170, 760)) {
        continue;
      }
      drawStructure(structure, time, 1, true);
    }
    for (const structure of structures) {
      if (structure.type !== "trading-port") {
        continue;
      }
      const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
      if (!vessel || vessel.state === "docked" || !isWorldCircleNearView(vessel.x, vessel.y, 80, 760)) {
        continue;
      }
      drawTradeVessel(vessel, time, 1);
    }
    drawPersonalTether(time);
  }

  function drawStructurePlacementPreview(time) {
    if (!activePlacementRecipeId) {
      return;
    }

    const recipe = recipeById(activePlacementRecipeId);
    if (!isStructureRecipe(recipe)) {
      return;
    }

    const placement = currentStructurePlacement();
    const firstTetherPlacement = isLinkedStructureType(recipe.structureType) && pendingTetherAnchor
      ? refreshPlacementAnchor(pendingTetherAnchor)
      : null;
    const tetherPlacementInRange = Boolean(
      !firstTetherPlacement ||
      recipe.structureType !== "tether" ||
      isTetherPlacementLengthValid(firstTetherPlacement, placement)
    );
    const tetherSecondValid = Boolean(
      !isLinkedStructureType(recipe.structureType) ||
      !firstTetherPlacement ||
      (firstTetherPlacement.valid && placement.valid && firstTetherPlacement.bodyId !== placement.bodyId && tetherPlacementInRange)
    );
    const preview = {
      type: recipe.structureType,
      bodyId: firstTetherPlacement ? firstTetherPlacement.bodyId : placement.bodyId,
      linkedBodyId: firstTetherPlacement ? placement.bodyId : 0,
      angle: firstTetherPlacement ? firstTetherPlacement.angle : placement.angle,
      linkedAngle: firstTetherPlacement ? placement.angle : 0,
      surfaceOffset: firstTetherPlacement ? firstTetherPlacement.surfaceOffset : placement.surfaceOffset,
      linkedSurfaceOffset: firstTetherPlacement ? placement.surfaceOffset : 0,
      x: firstTetherPlacement ? firstTetherPlacement.x : placement.x,
      y: firstTetherPlacement ? firstTetherPlacement.y : placement.y,
      x2: firstTetherPlacement ? placement.x : placement.x,
      y2: firstTetherPlacement ? placement.y : placement.y,
      restLength: firstTetherPlacement ? linkedStructureRestLength(recipe.structureType, firstTetherPlacement, placement) : 0,
      aimAngle: firstTetherPlacement ? firstTetherPlacement.angle : placement.angle,
      deploy: placement.valid && tetherSecondValid ? 0.72 : 0.2,
      wobble: 0
    };
    const valid = placement.valid && tetherSecondValid && (!firstTetherPlacement || firstTetherPlacement.valid);

    drawStructure(preview, time, valid ? 0.48 : 0.34, valid);

    ctx.save();
    ctx.globalAlpha = valid ? 0.34 : 0.42;
    ctx.strokeStyle = valid ? "rgba(88, 226, 255, 0.85)" : "rgba(255, 100, 100, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(placement.x, placement.y, 44, 0, Math.PI * 2);
    ctx.stroke();
    if (firstTetherPlacement) {
      ctx.beginPath();
      ctx.arc(firstTetherPlacement.x, firstTetherPlacement.y, 44, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

