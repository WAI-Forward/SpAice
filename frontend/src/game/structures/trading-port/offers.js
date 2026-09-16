  function setTradingPortOfferOnStructure(structure, offer) {
    normalizeTradingPortState(structure);
    const normalized = normalizeTradingPortOffer(offer, 0);
    const index = structure.tradeOffers.findIndex((candidate) => candidate.id === normalized.id);
    if (index >= 0) {
      structure.tradeOffers[index] = normalized;
    } else if (structure.tradeOffers.length < tradingPortMaxOffers) {
      structure.tradeOffers.push(normalized);
    }
  }

  function addTradePortOffer() {
    const structure = activeTradePortStructure();
    if (!structure || !isTradingPortOwner(structure)) {
      return false;
    }
    normalizeTradingPortState(structure);
    if (structure.tradeOffers.length >= tradingPortMaxOffers) {
      return false;
    }
    const offer = {
      id: "offer-" + structure.tradeOfferSeq++,
      receive: normalizeTradeOffer({ weapon: 1 }),
      pay: normalizeTradeOffer({ plating: 2 }),
      enabled: true
    };
    selectedTradePortOfferId = offer.id;

    if (isMultiplayerV2Active()) {
      if (!sendMultiplayerV2BuildAction({
        action: "setTradingPortOffer",
        structureId: structure.id,
        offer
      })) {
        maybeNotifyText("Reconnect before updating the trading port.");
        return false;
      }
      renderTradePortPanel();
      playSound("select");
      return true;
    }

    structure.tradeOffers.push(offer);
    renderTradePortPanel();
    void savePersistentState({ includeWorld: true });
    playSound("select");
    return true;
  }

  function removeSelectedTradePortOffer() {
    const structure = activeTradePortStructure();
    if (!structure || !isTradingPortOwner(structure) || !selectedTradePortOfferId) {
      return false;
    }

    if (isMultiplayerV2Active()) {
      if (!sendMultiplayerV2BuildAction({
        action: "removeTradingPortOffer",
        structureId: structure.id,
        offerId: selectedTradePortOfferId
      })) {
        maybeNotifyText("Reconnect before updating the trading port.");
        return false;
      }
      selectedTradePortOfferId = "";
      renderTradePortPanel();
      playSound("select");
      return true;
    }

    normalizeTradingPortState(structure);
    structure.tradeOffers = structure.tradeOffers.filter((offer) => offer.id !== selectedTradePortOfferId);
    selectedTradePortOfferId = structure.tradeOffers[0] ? structure.tradeOffers[0].id : "";
    renderTradePortPanel();
    void savePersistentState({ includeWorld: true });
    playSound("select");
    return true;
  }

  function adjustTradingPortOfferResource(techKey, side, delta) {
    const structure = activeTradePortStructure();
    const tech = techByKey(techKey);
    const offer = structure ? selectedTradingPortOffer(structure) : null;
    const cleanSide = side === "pay" ? "pay" : "receive";
    if (!structure || !tech || !offer || !isTradingPortOwner(structure)) {
      return false;
    }

    offer[cleanSide][tech.key] = clamp(Math.floor(finiteOr(offer[cleanSide][tech.key], 0)) + Math.floor(finiteOr(delta, 0)), 0, 99);

    if (isMultiplayerV2Active()) {
      if (!sendMultiplayerV2BuildAction({
        action: "setTradingPortOffer",
        structureId: structure.id,
        offer
      })) {
        maybeNotifyText("Reconnect before updating the trading port.");
        return false;
      }
      renderTradePortPanel();
      playSound("select");
      return true;
    }

    setTradingPortOfferOnStructure(structure, offer);
    renderTradePortPanel();
    void savePersistentState({ includeWorld: true });
    playSound("select");
    return true;
  }

  function transferTradePortTech(techKey, mode, amount) {
    const structure = activeTradePortStructure();
    const tech = techByKey(techKey);
    const cleanMode = mode === "withdraw" ? "withdraw" : "deposit";
    const cleanAmount = Math.max(1, Math.floor(finiteOr(amount, 1)));
    if (!structure || !tech || !isTradingPortOwner(structure)) {
      return false;
    }

    if (isMultiplayerV2Active()) {
      if (!sendMultiplayerV2BuildAction({
        action: "transferStructureTech",
        structureId: structure.id,
        techKey: tech.key,
        mode: cleanMode,
        amount: cleanAmount
      })) {
        maybeNotifyText("Reconnect before using the trading port.");
        return false;
      }
      renderTradePortPanel();
      playSound("trade");
      return true;
    }

    structure.tech = normalizeTradeOffer(structure.tech);
    const playerAmount = Math.max(0, Math.floor(techInventory[tech.key] || 0));
    const storedAmount = Math.max(0, Math.floor(structure.tech[tech.key] || 0));
    const moved = cleanMode === "withdraw" ? Math.min(cleanAmount, storedAmount) : Math.min(cleanAmount, playerAmount);
    if (moved <= 0) {
      return false;
    }
    if (cleanMode === "withdraw") {
      structure.tech[tech.key] = storedAmount - moved;
      techInventory[tech.key] = playerAmount + moved;
    } else {
      techInventory[tech.key] = playerAmount - moved;
      structure.tech[tech.key] = storedAmount + moved;
    }
    updateTechUi();
    renderTradePortPanel();
    void savePersistentState({ includeWorld: true });
    playSound("trade");
    return true;
  }

  function completeTradingPortDirectTrade(structure, offer) {
    if (!structure || !offer || !tradingPortOfferIsLive(structure, offer) || !canAffordTradeOffer(offer.receive)) {
      return false;
    }
    structure.tech = normalizeTradeOffer(structure.tech);
    for (const tech of techTypes) {
      const receiveAmount = Math.max(0, Math.floor(offer.receive[tech.key] || 0));
      const payAmount = Math.max(0, Math.floor(offer.pay[tech.key] || 0));
      techInventory[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0) - receiveAmount) + payAmount;
      structure.tech[tech.key] = Math.max(0, Math.floor(structure.tech[tech.key] || 0) - payAmount) + receiveAmount;
    }
    updateTechUi();
    renderTradePortPanel();
    void savePersistentState({ includeWorld: true });
    playSound("trade");
    maybeNotifyText("Trade complete at the port.");
    return true;
  }

  function acceptTradePortOffer(offerId) {
    const structure = activeTradePortStructure();
    const offer = structure ? normalizeTradingPortState(structure).tradeOffers.find((candidate) => candidate.id === offerId) : null;
    if (!structure || !offer || isTradingPortOwner(structure)) {
      selectedTradePortOfferId = offerId || "";
      renderTradePortPanel();
      return false;
    }

    if (isMultiplayerV2Active()) {
      if (!sendMultiplayerV2BuildAction({
        action: "acceptTradingPortOffer",
        structureId: structure.id,
        offerId
      })) {
        maybeNotifyText("Reconnect before trading at the port.");
        return false;
      }
      renderTradePortPanel();
      playSound("trade");
      return true;
    }
    return completeTradingPortDirectTrade(structure, offer);
  }

  function subtractOfferFromTech(stock, offer) {
    const tech = normalizeTradeOffer(stock);
    for (const type of techTypes) {
      tech[type.key] = Math.max(0, tech[type.key] - Math.max(0, Math.floor(offer && offer[type.key] || 0)));
    }
    return tech;
  }

  function addOfferToTech(stock, offer) {
    const tech = normalizeTradeOffer(stock);
    for (const type of techTypes) {
      tech[type.key] += Math.max(0, Math.floor(offer && offer[type.key] || 0));
    }
    return tech;
  }

