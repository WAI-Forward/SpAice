  function normalizeTradeOffer(offer) {
    const source = offer && typeof offer === "object" ? offer : {};
    const normalized = {};
    for (const tech of techTypes) {
      normalized[tech.key] = Math.max(0, Math.floor(finiteOr(source[tech.key], 0)));
    }
    return normalized;
  }

  const tradingPortMaxOffers = 4;
  const tradingPortRange = 1900;
  const tradingPortVesselSpeed = 860;
  const tradingPortVesselMaxHealth = 48;
  const tradingPortVesselRadius = 18;
  const tradingPortVesselCooldown = 4.2;
  const tradingPortAccessPadding = 118;
  let activeTradePortStructureId = 0;
  let selectedTradePortOfferId = "";

  function normalizeTradingPortOffer(offer, index) {
    const source = offer && typeof offer === "object" ? offer : {};
    return {
      id: String(source.id || ("offer-" + Math.max(1, Math.floor(finiteOr(index, 0) + 1)))),
      receive: normalizeTradeOffer(source.receive),
      pay: normalizeTradeOffer(source.pay),
      enabled: source.enabled !== false
    };
  }

  function normalizeTradingPortOffers(offers) {
    return (Array.isArray(offers) ? offers : [])
      .slice(0, tradingPortMaxOffers)
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
      health: clamp(finiteOr(source.health, tradingPortVesselMaxHealth), 0, tradingPortVesselMaxHealth),
      cooldown: Math.max(0, finiteOr(source.cooldown, 0)),
      sourceStructureId: Math.max(0, Math.floor(finiteOr(source.sourceStructureId, 0))),
      targetStructureId: Math.max(0, Math.floor(finiteOr(source.targetStructureId, 0))),
      sourceOfferId: String(source.sourceOfferId || ""),
      targetOfferId: String(source.targetOfferId || ""),
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

  function isTradingPortOwner(structure) {
    const ownerId = String(structure && structure.ownerPlayerId || "");
    return !ownerId || ownerId === player.id || !isMultiplayerV2Active();
  }

  function describeTradeOffer(offer) {
    return "Buy " + describeTradeSide(offer && offer.receive) + " for " + describeTradeSide(offer && offer.pay);
  }

  function tradeOffersEqual(first, second) {
    return techTypes.every((tech) => {
      return Math.max(0, Math.floor(first && first[tech.key] || 0)) === Math.max(0, Math.floor(second && second[tech.key] || 0));
    });
  }

  function tradingPortOfferIsLive(structure, offer) {
    return Boolean(
      structure &&
      offer &&
      offer.enabled !== false &&
      tradeOfferTotal(offer.receive) > 0 &&
      tradeOfferTotal(offer.pay) > 0 &&
      techTypes.every((tech) => Math.max(0, Math.floor(offer.pay[tech.key] || 0)) <= Math.max(0, Math.floor(structure.tech && structure.tech[tech.key] || 0)))
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

  function findTradingPortStructureById(id) {
    const cleanId = Math.max(1, Math.floor(finiteOr(id, 0)));
    for (const structure of structures) {
      if (structure && structure.id === cleanId && structure.type === "trading-port") {
        return structure;
      }
    }
    return null;
  }

  function canAccessTradingPortStructure(structure) {
    if (!structure || structure.type !== "trading-port" || structure.health <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    return Math.hypot(structure.x - player.x, structure.y - player.y) <= structureHitRadius(structure) + player.radius + tradingPortAccessPadding;
  }

  function tradingPortAtCursor() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestDistance = Infinity;
    for (const structure of structures) {
      if (!canAccessTradingPortStructure(structure)) {
        continue;
      }
      const distance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      if (distance > structureHitRadius(structure) + 22 || distance >= bestDistance) {
        continue;
      }
      best = structure;
      bestDistance = distance;
    }
    return best;
  }

  function activeTradePortStructure() {
    const structure = findTradingPortStructureById(activeTradePortStructureId);
    return canAccessTradingPortStructure(structure) ? structure : null;
  }

  function closeTradePortSession() {
    activeTradePortStructureId = 0;
    selectedTradePortOfferId = "";
    if (tradePortPanel) {
      tradePortPanel.classList.remove("is-open");
      tradePortPanel.setAttribute("aria-hidden", "true");
    }
    syncCompactHudControls();
    updateTouchScreenUi();
  }

  function openTradePortSession(structure) {
    if (!canAccessTradingPortStructure(structure)) {
      return false;
    }
    normalizeTradingPortState(structure);
    activeTradePortStructureId = structure.id;
    const offers = structure.tradeOffers || [];
    if (!offers.some((offer) => offer.id === selectedTradePortOfferId)) {
      selectedTradePortOfferId = offers[0] ? offers[0].id : "";
    }
    setPlayerInteractionMenu(false);
    closeTradeSession();
    closeContainerSession();
    setBuildMenuOpen(false);
    renderTradePortPanel();
    playSound("select");
    return true;
  }

  function handleTradePortClick() {
    const structure = tradingPortAtCursor();
    return structure ? openTradePortSession(structure) : false;
  }

  function selectedTradingPortOffer(structure) {
    const offers = normalizeTradingPortState(structure).tradeOffers;
    return offers.find((offer) => offer.id === selectedTradePortOfferId) || offers[0] || null;
  }

