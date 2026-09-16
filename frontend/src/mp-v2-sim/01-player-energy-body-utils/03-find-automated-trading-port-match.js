  function findAutomatedTradingPortMatch(state, sourceStructure) {
    const world = state && state.world;
    normalizeTradingPortState(sourceStructure);
    if (!world || sourceStructure.tradeVessel && sourceStructure.tradeVessel.state !== "docked") {
      return null;
    }
    for (const sourceOffer of sourceStructure.tradeOffers) {
      if (!tradingPortOfferIsLive(sourceStructure, sourceOffer)) {
        continue;
      }
      let best = null;
      let bestDistance = Infinity;
      for (const targetStructure of world.structures || []) {
        if (
          !targetStructure ||
          targetStructure === sourceStructure ||
          targetStructure.type !== "trading-port" ||
          finiteOr(targetStructure.health, 0) <= 0 ||
          isStructureDisabled(targetStructure)
        ) {
          continue;
        }
        const distance = Math.hypot(targetStructure.x - sourceStructure.x, targetStructure.y - sourceStructure.y);
        if (distance > TRADING_PORT_RANGE || distance >= bestDistance) {
          continue;
        }
        normalizeTradingPortState(targetStructure);
        if (targetStructure.tradeVessel && targetStructure.tradeVessel.state !== "docked") {
          continue;
        }
        for (const targetOffer of targetStructure.tradeOffers) {
          if (tradingPortOfferIsLive(targetStructure, targetOffer) && tradingPortOffersCompatible(sourceOffer, targetOffer)) {
            best = { sourceOffer, targetStructure, targetOffer };
            bestDistance = distance;
          }
        }
      }
      if (best) {
        return best;
      }
    }
    return null;
  }

  function launchTradingPortVessel(structure, match) {
    structure.tech = subtractOfferFromTech(structure.tech, match.sourceOffer.pay);
    structure.tradeVessel = {
      state: "outbound",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: TRADING_PORT_VESSEL_MAX_HEALTH,
      cooldown: 0,
      sourceStructureId: structure.id,
      targetStructureId: match.targetStructure.id,
      sourceOfferId: match.sourceOffer.id,
      targetOfferId: match.targetOffer.id,
      cargo: normalizeTradeOffer(match.sourceOffer.pay)
    };
  }

  function steerTradingPortVessel(state, vessel, destination, dt) {
    const toDest = normalize(finiteOr(destination.x, 0) - vessel.x, finiteOr(destination.y, 0) - vessel.y);
    let steerX = toDest.x;
    let steerY = toDest.y;
    for (const actor of Object.values(state.players || {})) {
      if (!actor || finiteOr(actor.health, 0) <= 0 || actor.spacecraftInterior) {
        continue;
      }
      if (Math.hypot(finiteOr(actor.x, 0) - finiteOr(destination.x, 0), finiteOr(actor.y, 0) - finiteOr(destination.y, 0)) < 190) {
        continue;
      }
      const dx = vessel.x - finiteOr(actor.x, 0);
      const dy = vessel.y - finiteOr(actor.y, 0);
      const distance = Math.hypot(dx, dy) || 1;
      const avoidRadius = 280 + finiteOr(actor.radius, PLAYER_RADIUS);
      if (distance >= avoidRadius) {
        continue;
      }
      const force = Math.pow(1 - distance / avoidRadius, 1.8) * 2.6;
      steerX += dx / distance * force;
      steerY += dy / distance * force;
    }
    const desired = normalize(steerX, steerY);
    const destinationBody = bodyById(state.world, destination.bodyId);
    const baseVx = destinationBody ? finiteOr(destinationBody.vx, 0) : 0;
    const baseVy = destinationBody ? finiteOr(destinationBody.vy, 0) : 0;
    vessel.vx += (baseVx + desired.x * TRADING_PORT_VESSEL_SPEED - vessel.vx) * (1 - Math.pow(0.015, dt));
    vessel.vy += (baseVy + desired.y * TRADING_PORT_VESSEL_SPEED - vessel.vy) * (1 - Math.pow(0.015, dt));
    const relativeVx = vessel.vx - baseVx;
    const relativeVy = vessel.vy - baseVy;
    const speed = Math.hypot(relativeVx, relativeVy);
    if (speed > TRADING_PORT_VESSEL_SPEED) {
      vessel.vx = baseVx + relativeVx / speed * TRADING_PORT_VESSEL_SPEED;
      vessel.vy = baseVy + relativeVy / speed * TRADING_PORT_VESSEL_SPEED;
    }
    vessel.x += vessel.vx * dt;
    vessel.y += vessel.vy * dt;
    vessel.angle = Math.atan2(vessel.vy, vessel.vx);
  }

  function dropTradeVesselCargo(state, vessel) {
    const cargo = normalizeTradeOffer(vessel && vessel.cargo);
    for (const key of TECH_KEYS) {
      const amount = Math.min(12, cargo[key]);
      for (let i = 0; i < amount; i += 1) {
        createTechPickup(state, key, finiteOr(vessel.x, 0), finiteOr(vessel.y, 0), finiteOr(vessel.vx, 0), finiteOr(vessel.vy, 0));
      }
    }
  }

  function destroyTradingPortVessel(state, structure, cause) {
    const vessel = normalizeTradeVessel(structure && structure.tradeVessel, structure);
    if (!structure || vessel.state === "docked") {
      return false;
    }
    dropTradeVesselCargo(state, vessel);
    structure.tradeVessel = {
      state: "docked",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: TRADING_PORT_VESSEL_MAX_HEALTH,
      cooldown: TRADING_PORT_VESSEL_COOLDOWN * 1.6,
      cargo: normalizeTradeOffer(null)
    };
    if (!Array.isArray(state.events)) {
      state.events = [];
    }
    state.events.push({
      type: "tradingPort.vesselDestroyed",
      structureId: structure.id,
      x: vessel.x,
      y: vessel.y,
      cause: cause || "projectile",
      tick: state.tick
    });
    return true;
  }

  function damageTradingPortVessel(state, structure, damage, cause) {
    const vessel = normalizeTradeVessel(structure && structure.tradeVessel, structure);
    if (!structure || vessel.state === "docked") {
      return false;
    }
    vessel.health = Math.max(0, vessel.health - Math.max(0, finiteOr(damage, 0)));
    structure.tradeVessel = vessel;
    if (vessel.health <= 0) {
      return destroyTradingPortVessel(state, structure, cause);
    }
    return true;
  }

  function tradeVesselHitBySegment(state, tailX, tailY, headX, headY, radius, damage, cause) {
    for (const structure of state && state.world && state.world.structures || []) {
      if (!structure || structure.type !== "trading-port") {
        continue;
      }
      const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
      if (vessel.state === "docked") {
        continue;
      }
      if (distanceToSegment(vessel.x, vessel.y, tailX, tailY, headX, headY) <= TRADING_PORT_VESSEL_RADIUS + Math.max(0, finiteOr(radius, 0))) {
        return damageTradingPortVessel(state, structure, damage, cause);
      }
    }
    return false;
  }

  function completeTradingPortVesselArrival(state, structure, target) {
    const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
    if (!target || finiteOr(target.health, 0) <= 0 || isStructureDisabled(target)) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      structure.tradeVessel = vessel;
      return;
    }
    normalizeTradingPortState(target);
    const targetOffer = target.tradeOffers.find((offer) => offer.id === vessel.targetOfferId);
    const sourceOffer = structure.tradeOffers.find((offer) => offer.id === vessel.sourceOfferId);
    if (!tradingPortOfferIsLive(target, targetOffer) || !sourceOffer || !tradingPortOffersCompatible(sourceOffer, targetOffer)) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      structure.tradeVessel = vessel;
      return;
    }
    target.tech = addOfferToTech(subtractOfferFromTech(target.tech, targetOffer.pay), vessel.cargo);
    vessel.cargo = normalizeTradeOffer(targetOffer.pay);
    vessel.state = "returning";
    vessel.targetStructureId = structure.id;
    structure.tradeVessel = vessel;
    if (!Array.isArray(state.events)) {
      state.events = [];
    }
    state.events.push({
      type: "tradingPort.automatedTrade",
      sourceStructureId: structure.id,
      targetStructureId: target.id,
      tick: state.tick
    });
  }

  function updateTradingPort(state, structure, dt) {
    normalizeTradingPortState(structure);
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.7, 0, 1);
    const vessel = structure.tradeVessel;
    if (vessel.state === "docked") {
      vessel.x = structure.x;
      vessel.y = structure.y;
      vessel.health = TRADING_PORT_VESSEL_MAX_HEALTH;
      vessel.cooldown = Math.max(0, finiteOr(vessel.cooldown, 0) - dt);
      if (vessel.cooldown <= 0) {
        const match = findAutomatedTradingPortMatch(state, structure);
        if (match) {
          launchTradingPortVessel(structure, match);
        }
      }
      return;
    }

    const destination = vessel.state === "returning" ? structure : structureById(state.world, vessel.targetStructureId, "trading-port");
    if (!destination) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      steerTradingPortVessel(state, vessel, structure, dt);
      return;
    }
    steerTradingPortVessel(state, vessel, destination, dt);
    if (Math.hypot(vessel.x - destination.x, vessel.y - destination.y) > 42) {
      return;
    }
    if (vessel.state === "outbound") {
      completeTradingPortVesselArrival(state, structure, destination);
      return;
    }
    structure.tech = addOfferToTech(structure.tech, vessel.cargo);
    structure.tradeVessel = {
      state: "docked",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: TRADING_PORT_VESSEL_MAX_HEALTH,
      cooldown: TRADING_PORT_VESSEL_COOLDOWN,
      cargo: normalizeTradeOffer(null)
    };
  }

  function clonePlayer(player) {
    if (!player || typeof player !== "object") {
      return null;
    }
    return {
      id: player.id,
      name: player.name,
      teamId: String(player.teamId || ""),
      skinId: player.skinId || "",
      trailId: player.trailId || "",
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius,
      health: player.health,
      maxHealth: player.maxHealth,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
      score: Math.max(1, Math.round(finiteOr(player.score, 1))),
      hitCooldown: player.hitCooldown,
      respawnTimer: player.respawnTimer,
      invulnerableTimer: player.invulnerableTimer,
      statusEffects: normalizePlayerStatusEffects(player.statusEffects, player.toolDisabledTimer),
      toolDisabledTimer: player.toolDisabledTimer,
      toolFireCooldown: Math.max(0, finiteOr(player.toolFireCooldown, 0)),
      landed: player.landed ? clone(player.landed) : null,
      spacecraftInterior: player.spacecraftInterior ? clone(player.spacecraftInterior) : null,
      walkCycle: player.walkCycle,
      cameraRoll: player.cameraRoll,
      aimAngle: player.aimAngle,
      aimLocalAngle: player.aimLocalAngle,
      equippedTool: player.equippedTool,
      toolMode: player.toolMode,
      moving: Boolean(player.moving),
      boosting: Boolean(player.boosting),
      jetpackMoveX: finiteOr(player.jetpackMoveX, 0),
      jetpackMoveY: finiteOr(player.jetpackMoveY, -1),
      crouching: Boolean(player.crouching),
      rocketSuitCharge: clamp(finiteOr(player.rocketSuitCharge, 0), 0, 1),
      rocketSuitActive: Boolean(player.rocketSuitActive),
      tech: cloneTechInventory(player.tech),
      tools: Array.isArray(player.tools) ? player.tools.slice(0, 8) : [DEFAULT_TOOL_ID],
      equippedTools: Array.isArray(player.equippedTools) ? player.equippedTools.slice(0, 8) : [DEFAULT_TOOL_ID],
      toolUpgrades: player.toolUpgrades && typeof player.toolUpgrades === "object" ? clone(player.toolUpgrades) : {},
      familiarNetCapture: player.familiarNetCapture ? clone(player.familiarNetCapture) : null,
      familiarNetFireHeld: Boolean(player.familiarNetFireHeld),
      familiarNetReleaseHeld: Boolean(player.familiarNetReleaseHeld),
      personalTether: player.personalTether ? clone(player.personalTether) : null,
      personalTetherFireHeld: Boolean(player.personalTetherFireHeld),
      personalTetherReleaseHeld: Boolean(player.personalTetherReleaseHeld),
      lastInputSeq: Math.max(0, Math.floor(finiteOr(player.lastInputSeq, 0)))
    };
  }

  function serializeParticleState(body) {
    return body ? {
      id: body.id,
      x: body.x,
      y: body.y,
      vx: body.vx,
      vy: body.vy,
      mass: body.mass,
      radius: body.radius,
      energy: body.energy,
      maxEnergy: body.maxEnergy,
      rotation: body.rotation,
      angularVelocity: body.angularVelocity,
      color: cloneColor(body.color),
      textureSeed: body.textureSeed,
      wobble: body.wobble,
      pulse: body.pulse,
      spawnAge: body.spawnAge,
      spawnSizeScale: body.spawnSizeScale,
      orbitHostId: body.orbitHostId,
      orbitRingIndex: body.orbitRingIndex,
      orbitDirection: body.orbitDirection,
      orbitStrength: body.orbitStrength,
      orbitGrace: body.orbitGrace,
      starBirthAge: body.starBirthAge,
      starEmissionAccumulator: body.starEmissionAccumulator,
      stellarGrowthStarted: Boolean(body.stellarGrowthStarted),
      stellarGrowthRate: body.stellarGrowthRate,
      stellarGrowthLastSampleAt: body.stellarGrowthLastSampleAt,
      stellarOutcome: body.stellarOutcome || "",
      randomEventId: body.randomEventId || "",
      randomEventRegionX: body.randomEventRegionX,
      randomEventRegionY: body.randomEventRegionY,
      ufoSapTimer: body.ufoSapTimer,
      ufoSapSourceGraceTimer: body.ufoSapSourceGraceTimer,
      ufoExtractedById: body.ufoExtractedById,
      ufoExtractedFromId: body.ufoExtractedFromId,
      ufoSapParticleBuffer: body.ufoSapParticleBuffer,
      survivalCampId: body.survivalCampId || "",
      survivalCampX: body.survivalCampX,
      survivalCampY: body.survivalCampY,
      survivalCampHomeX: body.survivalCampHomeX,
      survivalCampHomeY: body.survivalCampHomeY,
      survivalCampMovedByPlayer: Boolean(body.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(body.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: body.survivalCampLastMoverPlayerId || "",
      survivalCampBody: Boolean(body.survivalCampBody),
      ambientSpawnRock: Boolean(body.ambientSpawnRock)
    } : null;
  }

  function serializePickupState(pickup, type) {
    if (!pickup) {
      return null;
    }
    const result = {
      id: pickup.id,
      x: pickup.x,
      y: pickup.y,
      vx: pickup.vx,
      vy: pickup.vy,
      radius: pickup.radius,
      life: pickup.life,
      maxLife: pickup.maxLife,
      wobble: pickup.wobble
    };
    if (type === "tech") {
      result.key = pickup.key;
      result.color = cloneColor(pickup.color);
      result.rotation = pickup.rotation;
    } else {
      result.heal = pickup.heal;
    }
    return result;
  }
