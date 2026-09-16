  function findBridgeTransferFromBody(world, bodyId, angle, walkDirection) {
    if (!bodyId || !walkDirection) {
      return null;
    }
    let best = null;
    let bestDelta = Infinity;
    for (const structure of world.structures || []) {
      for (const side of [-1, 1]) {
        const endpoint = bridgeEndpointJoin(world, structure, bodyId, side);
        if (!endpoint || endpoint.entryWalkDirection !== Math.sign(walkDirection)) {
          continue;
        }
        const delta = Math.abs(shortestAngleDelta(angle, endpoint.angle));
        if (delta > BRIDGE_WALK_TRANSFER_ANGLE || delta >= bestDelta) {
          continue;
        }
        best = { structure, endpoint, inputSign: endpoint.inputSign };
        bestDelta = delta;
      }
    }
    return best;
  }

  function transferPlayerToBridge(world, player, transfer, walkDirection, walkSpeed) {
    if (!player || !transfer || !transfer.structure || !transfer.endpoint) {
      return false;
    }
    player.landed = {
      bodyId: transfer.endpoint.bodyId,
      bridgeId: transfer.structure.id,
      bridgeT: transfer.endpoint.t,
      bridgeSide: transfer.endpoint.side,
      bridgeInputSign: transfer.inputSign,
      angle: transfer.endpoint.angle,
      walkSpeed: finiteOr(walkSpeed, 0) * Math.sign(walkDirection || 1),
      walkCycle: finiteOr(player.walkCycle, 0)
    };
    applyLandedSurfaceConstraint(world, player);
    return true;
  }

  function transferPlayerFromBridgeToBody(world, player, structure, bodyId, side, pathSpeed) {
    const join = bridgeEndpointJoin(world, structure, bodyId, side);
    const body = bodyById(world, bodyId);
    if (!player || !join || !body || !isLandableBody(body)) {
      return false;
    }
    const bridgeMotionSign = Math.sign(finiteOr(pathSpeed, 0) || (join.atStart ? -1 : 1));
    const incomingDirX = join.geometry.ux * bridgeMotionSign;
    const incomingDirY = join.geometry.uy * bridgeMotionSign;
    const tangentX = -Math.sin(join.angle);
    const tangentY = Math.cos(join.angle);
    const bodyWalkDirection = tangentX * incomingDirX + tangentY * incomingDirY >= 0 ? 1 : -1;
    const continuationAngle = join.angle + bodyWalkDirection * (BRIDGE_WALK_TRANSFER_ANGLE + BRIDGE_WALK_EXIT_ANGLE_PADDING);
    player.landed = {
      bodyId: body.id,
      bridgeId: 0,
      bridgeT: 0,
      bridgeSide: 1,
      bridgeInputSign: 1,
      angle: continuationAngle,
      walkSpeed: Math.abs(finiteOr(pathSpeed, 0)) * bodyWalkDirection,
      walkCycle: finiteOr(player.walkCycle, 0)
    };
    applyLandedSurfaceConstraint(world, player);
    return true;
  }

  function normalizePlacement(world, type, placement) {
    const source = placement && typeof placement === "object" ? placement : {};
    const body = bodyById(world, source.bodyId);
    const angle = finiteOr(source.angle, 0);
    if (!isStructureHostBodyForType(body, type)) {
      return null;
    }
    const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
    const centerOffset = structureCenterOffset(type, surfaceOffset);
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    return {
      body,
      bodyId: body.id,
      angle,
      surfaceOffset,
      x: body.x + Math.cos(angle) * (radius + centerOffset),
      y: body.y + Math.sin(angle) * (radius + centerOffset)
    };
  }

  function randomStructureSeed(state, salt) {
    const seeded = seededRange((finiteOr(state.seed, 0) + finiteOr(state.tick, 0) * 2654435761 + salt * 1013904223) >>> 0, 0, 1);
    return seeded.value;
  }

  function createStructureFromPlacement(state, recipe, placement, linkedPlacement, ownerPlayerId) {
    const world = state.world;
    const nextId = Math.max(
      1,
      Math.floor(finiteOr(world.nextStructureId, 1)),
      Array.isArray(world.structures)
        ? world.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
        : 1
    );
    world.nextStructureId = nextId + 1;
    const type = recipe.structureType;
    const maxHealth = structureMaxHealth(type);
    const restCenterDx = linkedPlacement ? linkedPlacement.body.x - placement.body.x : 0;
    const restCenterDy = linkedPlacement ? linkedPlacement.body.y - placement.body.y : 0;
    const restCenterAngle = Math.atan2(restCenterDy, restCenterDx);
    return {
      id: nextId,
      type,
      ownerPlayerId: String(ownerPlayerId || "").replace(/[^\w.-]/g, "").slice(0, 80),
      bodyId: placement.bodyId,
      linkedBodyId: linkedPlacement ? linkedPlacement.bodyId : 0,
      angle: placement.angle,
      linkedAngle: linkedPlacement ? linkedPlacement.angle : 0,
      surfaceOffset: placement.surfaceOffset,
      linkedSurfaceOffset: linkedPlacement ? linkedPlacement.surfaceOffset : 0,
      x: placement.x,
      y: placement.y,
      x2: linkedPlacement ? linkedPlacement.x : placement.x,
      y2: linkedPlacement ? linkedPlacement.y : placement.y,
      restLength: linkedPlacement ? linkedStructureRestLength(type, placement, linkedPlacement) : 0,
      restCenterDx,
      restCenterDy,
      bridgeAngleOffset: type === "bridge" && linkedPlacement ? shortestAngleDelta(restCenterAngle, placement.angle) : 0,
      bridgeLinkedAngleOffset: type === "bridge" && linkedPlacement ? shortestAngleDelta(restCenterAngle, linkedPlacement.angle) : 0,
      aimAngle: placement.angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: 0.2 + randomStructureSeed(state, nextId) * 0.6,
      burstTimer: 0,
      burstCooldown: 0.4 + randomStructureSeed(state, nextId + 7) * ACCUMULATOR_BURST_INTERVAL,
      healPulse: 0,
      missileCharge: 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: placement.x,
      targetY: placement.y,
      targetCount: 0,
      health: maxHealth,
      maxHealth,
      disabledTimer: 0,
      flash: 0,
      tech: type === "container" || type === "trading-port" ? cloneTechInventory(null) : undefined,
      tradeOffers: type === "trading-port" ? [] : undefined,
      tradeOfferSeq: type === "trading-port" ? 1 : undefined,
      tradeVessel: type === "trading-port" ? normalizeTradeVessel(null, { x: placement.x, y: placement.y, angle: placement.angle }) : undefined,
      wobble: randomStructureSeed(state, nextId + 13) * Math.PI * 2
    };
  }

  function placeStructure(state, playerId, recipeId, placement, linkedPlacement) {
    const player = state && state.players && state.players[playerId];
    const recipe = recipeById(recipeId);
    const world = state && state.world;
    if (!player || !world || !recipe || recipe.category !== "structures" || !recipe.structureType || !canAffordCost(player, recipe.cost)) {
      return false;
    }

    if (!Array.isArray(world.structures)) {
      world.structures = [];
    }

    const first = normalizePlacement(world, recipe.structureType, placement);
    if (!first) {
      return false;
    }

    let second = null;
    if (isLinkedStructureType(recipe.structureType)) {
      second = normalizePlacement(world, recipe.structureType, linkedPlacement);
      if (!second || second.bodyId === first.bodyId) {
        return false;
      }
      if (recipe.structureType === "tether" && !isTetherPlacementLengthValid(first, second)) {
        return false;
      }
    }

    spendCost(player, recipe.cost);
    world.structures.push(createStructureFromPlacement(state, recipe, first, second, playerId));
    return true;
  }

  function transferContainerTech(state, playerId, structureId, techKey, mode, amount) {
    return transferStructureTech(state, playerId, structureId, techKey, mode, amount, "container");
  }

  function normalizeTradeOffer(offer) {
    return cloneTechInventory(offer);
  }

  function tradeOfferTotal(offer) {
    const normalized = normalizeTradeOffer(offer);
    return TECH_KEYS.reduce((total, key) => total + normalized[key], 0);
  }

  function tradeOffersEqual(first, second) {
    const a = normalizeTradeOffer(first);
    const b = normalizeTradeOffer(second);
    return TECH_KEYS.every((key) => a[key] === b[key]);
  }

  function normalizeTradingPortOffer(offer, index) {
    const source = offer && typeof offer === "object" ? offer : {};
    return {
      id: String(source.id || ("offer-" + Math.max(1, Math.floor(finiteOr(index, 0) + 1)))).replace(/[^\w.-]/g, "").slice(0, 48),
      receive: normalizeTradeOffer(source.receive),
      pay: normalizeTradeOffer(source.pay),
      enabled: source.enabled !== false
    };
  }

  function normalizeTradingPortOffers(offers) {
    return (Array.isArray(offers) ? offers : [])
      .slice(0, TRADING_PORT_MAX_OFFERS)
      .map(normalizeTradingPortOffer)
      .filter((offer) => offer.id);
  }

  function normalizeTradeVessel(vessel, structure) {
    const dock = structure || {};
    const source = vessel && typeof vessel === "object" ? vessel : {};
    const state = source.state === "outbound" || source.state === "returning" ? source.state : "docked";
    return {
      state,
      x: finiteOr(source.x, finiteOr(dock.x, 0)),
      y: finiteOr(source.y, finiteOr(dock.y, 0)),
      vx: finiteOr(source.vx, 0),
      vy: finiteOr(source.vy, 0),
      angle: finiteOr(source.angle, finiteOr(dock.angle, 0)),
      health: clamp(finiteOr(source.health, TRADING_PORT_VESSEL_MAX_HEALTH), 0, TRADING_PORT_VESSEL_MAX_HEALTH),
      cooldown: Math.max(0, finiteOr(source.cooldown, 0)),
      sourceStructureId: Math.max(0, Math.floor(finiteOr(source.sourceStructureId, 0))),
      targetStructureId: Math.max(0, Math.floor(finiteOr(source.targetStructureId, 0))),
      sourceOfferId: String(source.sourceOfferId || "").replace(/[^\w.-]/g, "").slice(0, 48),
      targetOfferId: String(source.targetOfferId || "").replace(/[^\w.-]/g, "").slice(0, 48),
      cargo: normalizeTradeOffer(source.cargo)
    };
  }

  function normalizeTradingPortState(structure) {
    if (!structure || structure.type !== "trading-port") {
      return null;
    }
    structure.tech = normalizeTradeOffer(structure.tech);
    structure.tradeOffers = normalizeTradingPortOffers(structure.tradeOffers);
    structure.tradeOfferSeq = Math.max(
      1,
      Math.floor(finiteOr(structure.tradeOfferSeq, structure.tradeOffers.length + 1)),
      structure.tradeOffers.reduce((largest, offer) => {
        const match = String(offer.id || "").match(/(\d+)$/);
        return match ? Math.max(largest, Number(match[1]) + 1) : largest;
      }, 1)
    );
    structure.tradeVessel = normalizeTradeVessel(structure.tradeVessel, structure);
    return structure;
  }

  function tradingPortOfferIsLive(structure, offer) {
    return Boolean(
      structure &&
      offer &&
      offer.enabled !== false &&
      tradeOfferTotal(offer.receive) > 0 &&
      tradeOfferTotal(offer.pay) > 0 &&
      TECH_KEYS.every((key) => normalizeTradeOffer(offer.pay)[key] <= normalizeTradeOffer(structure.tech)[key])
    );
  }

  function tradingPortOffersCompatible(sourceOffer, targetOffer) {
    return Boolean(
      sourceOffer &&
      targetOffer &&
      tradeOffersEqual(sourceOffer.pay, targetOffer.receive) &&
      tradeOffersEqual(sourceOffer.receive, targetOffer.pay)
    );
  }

  function subtractOfferFromTech(tech, offer) {
    const result = normalizeTradeOffer(tech);
    const cost = normalizeTradeOffer(offer);
    for (const key of TECH_KEYS) {
      result[key] = Math.max(0, result[key] - cost[key]);
    }
    return result;
  }

  function addOfferToTech(tech, offer) {
    const result = normalizeTradeOffer(tech);
    const gain = normalizeTradeOffer(offer);
    for (const key of TECH_KEYS) {
      result[key] = Math.max(0, result[key] + gain[key]);
    }
    return result;
  }

  function structureById(world, structureId, type) {
    const cleanStructureId = Math.max(1, Math.floor(finiteOr(structureId, 0)));
    return world && Array.isArray(world.structures)
      ? world.structures.find((candidate) => candidate && candidate.id === cleanStructureId && (!type || candidate.type === type)) || null
      : null;
  }

  function canPlayerAccessStructure(player, structure, padding) {
    if (!player || !structure || finiteOr(player.health, 0) <= 0 || player.spacecraftInterior || finiteOr(structure.health, 0) <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    return Math.hypot(finiteOr(structure.x, 0) - finiteOr(player.x, 0), finiteOr(structure.y, 0) - finiteOr(player.y, 0)) <=
      structureHitRadius(structure) + finiteOr(player.radius, PLAYER_RADIUS) + padding;
  }

  function isTradingPortOwner(structure, playerId) {
    const ownerId = String(structure && structure.ownerPlayerId || "");
    return ownerId && ownerId === String(playerId || "");
  }

  function transferStructureTech(state, playerId, structureId, techKey, mode, amount, requiredType) {
    const player = state && state.players && state.players[playerId];
    const world = state && state.world;
    const cleanKey = String(techKey || "");
    const cleanAmount = Math.max(1, Math.min(999, Math.floor(finiteOr(amount, 1))));
    const withdraw = mode === "withdraw";
    const cleanRequiredType = requiredType || "";
    if (
      !player ||
      !world ||
      !Array.isArray(world.structures) ||
      !TECH_KEYS.includes(cleanKey) ||
      finiteOr(player.health, 0) <= 0 ||
      player.spacecraftInterior
    ) {
      return false;
    }

    const structure = structureById(world, structureId);
    if (!structure || (cleanRequiredType && structure.type !== cleanRequiredType) || (structure.type !== "container" && structure.type !== "trading-port")) {
      return false;
    }

    if (structure.type === "trading-port" && !isTradingPortOwner(structure, playerId)) {
      return false;
    }
    if (!canPlayerAccessStructure(player, structure, structure.type === "trading-port" ? TRADING_PORT_ACCESS_PADDING : 96)) {
      return false;
    }

    if (!player.tech || typeof player.tech !== "object") {
      player.tech = cloneTechInventory(null);
    }
    structure.tech = cloneTechInventory(structure.tech);

    const playerAmount = Math.max(0, Math.floor(finiteOr(player.tech[cleanKey], 0)));
    const storedAmount = Math.max(0, Math.floor(finiteOr(structure.tech[cleanKey], 0)));
    const moved = withdraw ? Math.min(cleanAmount, storedAmount) : Math.min(cleanAmount, playerAmount);
    if (moved <= 0) {
      return false;
    }

    if (withdraw) {
      structure.tech[cleanKey] = storedAmount - moved;
      player.tech[cleanKey] = playerAmount + moved;
      if (structure.type === "container" && isSurvivalCampStructure(state, structure)) {
        wakeSurvivalCampFromStructure(state, structure, playerId);
      }
    } else {
      player.tech[cleanKey] = playerAmount - moved;
      structure.tech[cleanKey] = storedAmount + moved;
    }

    return true;
  }

  function setTradingPortOffer(state, playerId, structureId, offer) {
    const player = state && state.players && state.players[playerId];
    const structure = normalizeTradingPortState(structureById(state && state.world, structureId, "trading-port"));
    if (!structure || !isTradingPortOwner(structure, playerId) || !canPlayerAccessStructure(player, structure, TRADING_PORT_ACCESS_PADDING)) {
      return false;
    }
    const normalized = normalizeTradingPortOffer(offer, structure.tradeOffers.length);
    if (!normalized.id) {
      normalized.id = "offer-" + structure.tradeOfferSeq++;
    }
    const existingIndex = structure.tradeOffers.findIndex((candidate) => candidate.id === normalized.id);
    if (existingIndex >= 0) {
      structure.tradeOffers[existingIndex] = normalized;
    } else if (structure.tradeOffers.length < TRADING_PORT_MAX_OFFERS) {
      structure.tradeOffers.push(normalized);
    } else {
      return false;
    }
    const match = String(normalized.id).match(/(\d+)$/);
    if (match) {
      structure.tradeOfferSeq = Math.max(structure.tradeOfferSeq, Number(match[1]) + 1);
    }
    return true;
  }

  function removeTradingPortOffer(state, playerId, structureId, offerId) {
    const player = state && state.players && state.players[playerId];
    const structure = normalizeTradingPortState(structureById(state && state.world, structureId, "trading-port"));
    if (!structure || !isTradingPortOwner(structure, playerId) || !canPlayerAccessStructure(player, structure, TRADING_PORT_ACCESS_PADDING)) {
      return false;
    }
    const cleanOfferId = String(offerId || "");
    const nextOffers = structure.tradeOffers.filter((offer) => offer.id !== cleanOfferId);
    if (nextOffers.length === structure.tradeOffers.length) {
      return false;
    }
    structure.tradeOffers = nextOffers;
    return true;
  }

  function acceptTradingPortOffer(state, playerId, structureId, offerId) {
    const player = state && state.players && state.players[playerId];
    const structure = normalizeTradingPortState(structureById(state && state.world, structureId, "trading-port"));
    if (!structure || !player || isTradingPortOwner(structure, playerId) || !canPlayerAccessStructure(player, structure, TRADING_PORT_ACCESS_PADDING)) {
      return false;
    }
    player.tech = normalizeTradeOffer(player.tech);
    const offer = structure.tradeOffers.find((candidate) => candidate.id === String(offerId || ""));
    if (!tradingPortOfferIsLive(structure, offer)) {
      return false;
    }
    const canPay = TECH_KEYS.every((key) => normalizeTradeOffer(offer.receive)[key] <= player.tech[key]);
    if (!canPay) {
      return false;
    }
    player.tech = addOfferToTech(subtractOfferFromTech(player.tech, offer.receive), offer.pay);
    structure.tech = addOfferToTech(subtractOfferFromTech(structure.tech, offer.pay), offer.receive);
    if (!Array.isArray(state.events)) {
      state.events = [];
    }
    state.events.push({
      type: "tradingPort.directTrade",
      playerId,
      structureId: structure.id,
      offerId: offer.id,
      tick: state.tick
    });
    return true;
  }
