  function tradeOfferTotal(offer) {
    return techTypes.reduce((total, tech) => total + Math.max(0, Math.floor(offer && offer[tech.key] || 0)), 0);
  }

  function canAffordTradeOffer(offer) {
    return techTypes.every((tech) => Math.max(0, Math.floor(offer && offer[tech.key] || 0)) <= Math.floor(techInventory[tech.key] || 0));
  }

  function describeTradeCostWithInventory(offer) {
    const parts = [];
    for (const tech of techTypes) {
      const amount = Math.max(0, Math.floor(offer && offer[tech.key] || 0));
      if (amount > 0) {
        const owned = Math.max(0, Math.floor(techInventory[tech.key] || 0));
        parts.push(owned + "/" + amount + " " + tech.label);
      }
    }
    return parts.length ? parts.join(", ") : "nothing";
  }

  function openTradeSession(peerId, peerName) {
    if (!peerId) {
      return;
    }

    multiplayer.trade = {
      peerId,
      peerName: peerName || "Contact",
      localOffer: normalizeTradeOffer(null),
      remoteOffer: normalizeTradeOffer(null),
      localSent: false,
      remoteSent: false,
      localAccepted: false,
      remoteAccepted: false,
      completed: false
    };
    setPlayerInteractionMenu(false);
    renderTradePanel();
  }

  function closeTradeSession() {
    multiplayer.trade = null;
    if (tradePanel) {
      tradePanel.classList.remove("is-open");
      tradePanel.setAttribute("aria-hidden", "true");
    }
    updateTouchScreenUi();
  }

  function renderTradePanel() {
    const trade = multiplayer.trade;
    if (!tradePanel || !trade) {
      return;
    }

    if (tradePeerName) {
      tradePeerName.textContent = "Trade with " + trade.peerName;
    }

    renderTradeOfferList();
    renderTradeReceiveList();
    updateTradeStatus();
    tradePanel.classList.add("is-open");
    tradePanel.setAttribute("aria-hidden", "false");
    updateTouchScreenUi();
  }

  function renderTradeOfferList() {
    if (!tradeOfferList || !multiplayer.trade) {
      return;
    }

    tradeOfferList.textContent = "";
    if (multiplayer.trade.kind === "npc") {
      const trade = multiplayer.trade;
      trade.npcOffers.forEach((offer, index) => {
        const row = document.createElement("div");
        const dot = document.createElement("span");
        const name = document.createElement("span");
        const button = document.createElement("button");
        const selected = index === trade.selectedOfferIndex;
        row.className = "trade-row";
        row.style.setProperty("--tech-color", selected ? "#ffd166" : "#ffb858");
        dot.className = "trade-row__dot";
        name.className = "trade-row__name";
        name.textContent = describeTradeCostWithInventory(offer.pay);
        button.type = "button";
        button.dataset.npcOffer = String(index);
        button.textContent = selected ? "Selected" : "Select";
        button.disabled = selected;
        row.append(dot, name, button);
        tradeOfferList.append(row);
      });
      return;
    }

    for (const tech of techTypes) {
      const amount = Math.max(0, Math.floor(multiplayer.trade.localOffer[tech.key] || 0));
      const owned = Math.floor(techInventory[tech.key] || 0);
      const row = document.createElement("div");
      const dot = document.createElement("span");
      const name = document.createElement("span");
      const controls = document.createElement("span");
      const minus = document.createElement("button");
      const value = document.createElement("strong");
      const plus = document.createElement("button");

      row.className = "trade-row";
      row.style.setProperty("--tech-color", tech.color);
      dot.className = "trade-row__dot";
      name.className = "trade-row__name";
      name.textContent = tech.label + " (" + owned + ")";
      controls.className = "trade-row__controls";
      minus.type = "button";
      minus.dataset.tradeKey = tech.key;
      minus.dataset.tradeDelta = "-1";
      minus.textContent = "-";
      value.className = "trade-row__amount";
      value.textContent = amount.toString();
      plus.type = "button";
      plus.dataset.tradeKey = tech.key;
      plus.dataset.tradeDelta = "1";
      plus.textContent = "+";
      plus.disabled = amount >= owned;
      minus.disabled = amount <= 0;
      controls.append(minus, value, plus);
      row.append(dot, name, controls);
      tradeOfferList.append(row);
    }
  }

  function renderTradeReceiveList() {
    if (!tradeReceiveList || !multiplayer.trade) {
      return;
    }

    tradeReceiveList.textContent = "";
    if (multiplayer.trade.kind === "npc") {
      const offer = selectedNpcTradeOffer(multiplayer.trade);
      const receive = offer ? offer.receive : multiplayer.trade.remoteOffer;
      for (const tech of techTypes) {
        const amount = Math.max(0, Math.floor(receive && receive[tech.key] || 0));
        if (amount <= 0) {
          continue;
        }
        const row = document.createElement("div");
        const dot = document.createElement("span");
        const name = document.createElement("span");
        const value = document.createElement("strong");
        row.className = "trade-row";
        row.style.setProperty("--tech-color", tech.color);
        dot.className = "trade-row__dot";
        name.className = "trade-row__name";
        name.textContent = tech.label;
        value.className = "trade-row__amount";
        value.textContent = amount.toString();
        row.append(dot, name, value);
        tradeReceiveList.append(row);
      }
      return;
    }

    for (const tech of techTypes) {
      const amount = Math.max(0, Math.floor(multiplayer.trade.remoteOffer[tech.key] || 0));
      const row = document.createElement("div");
      const dot = document.createElement("span");
      const name = document.createElement("span");
      const value = document.createElement("strong");
      row.className = "trade-row";
      row.style.setProperty("--tech-color", tech.color);
      dot.className = "trade-row__dot";
      name.className = "trade-row__name";
      name.textContent = tech.label;
      value.className = "trade-row__amount";
      value.textContent = amount.toString();
      row.append(dot, name, value);
      tradeReceiveList.append(row);
    }
  }

  function updateTradeStatus() {
    const trade = multiplayer.trade;
    if (!trade) {
      return;
    }

    if (trade.kind === "npc") {
      const offer = selectedNpcTradeOffer(trade);
      trade.localOffer = normalizeTradeOffer(offer && offer.pay);
      trade.remoteOffer = normalizeTradeOffer(offer && offer.receive);
      if (tradeSendOffer) {
        tradeSendOffer.disabled = true;
        tradeSendOffer.textContent = "Fixed Offer";
      }
      if (tradeAccept) {
        tradeAccept.disabled = !offer || !canAffordTradeOffer(trade.localOffer);
        tradeAccept.textContent = "Trade";
      }
      if (tradeStatus) {
        if (!offer) {
          tradeStatus.textContent = "No offers available.";
        } else {
          const cost = describeTradeCostWithInventory(trade.localOffer);
          tradeStatus.textContent = canAffordTradeOffer(trade.localOffer)
            ? "Trader asks for " + cost + "."
            : "You need " + cost + ".";
        }
      }
      return;
    }

    if (tradeSendOffer) {
      tradeSendOffer.disabled = !canAffordTradeOffer(trade.localOffer) || trade.completed;
      tradeSendOffer.textContent = "Send Offer";
    }
    if (tradeAccept) {
      tradeAccept.disabled =
        trade.completed ||
        !trade.localSent ||
        !trade.remoteSent ||
        !canAffordTradeOffer(trade.localOffer) ||
        (tradeOfferTotal(trade.localOffer) <= 0 && tradeOfferTotal(trade.remoteOffer) <= 0);
      tradeAccept.textContent = "Accept";
    }
    if (!tradeStatus) {
      return;
    }

    if (!canAffordTradeOffer(trade.localOffer)) {
      tradeStatus.textContent = "You do not have enough tech for that offer.";
    } else if (trade.completed) {
      tradeStatus.textContent = "Trade complete.";
    } else if (trade.localAccepted && !trade.remoteAccepted) {
      tradeStatus.textContent = "Waiting for " + trade.peerName + " to accept.";
    } else if (!trade.remoteSent) {
      tradeStatus.textContent = trade.localSent ? "Offer sent. Waiting for their offer." : "Choose resources to trade.";
    } else if (!trade.localSent) {
      tradeStatus.textContent = trade.peerName + " sent an offer. Send yours to continue.";
    } else if (trade.remoteAccepted) {
      tradeStatus.textContent = trade.peerName + " accepted. Accept to complete.";
    } else {
      tradeStatus.textContent = "Both offers are ready.";
    }
  }

  function adjustTradeOffer(techKey, delta) {
    const trade = multiplayer.trade;
    const tech = techByKey(techKey);
    if (!trade || trade.kind === "npc" || !tech || trade.completed) {
      return;
    }

    const current = Math.max(0, Math.floor(trade.localOffer[tech.key] || 0));
    const owned = Math.floor(techInventory[tech.key] || 0);
    trade.localOffer[tech.key] = clamp(current + delta, 0, owned);
    trade.localSent = false;
    trade.localAccepted = false;
    renderTradePanel();
  }

  function sendTradeOffer() {
    const trade = multiplayer.trade;
    if (!trade || !canAffordTradeOffer(trade.localOffer)) {
      return;
    }
    if (trade.kind === "npc") {
      return;
    }

    trade.localSent = true;
    trade.localAccepted = false;
    sendMultiplayer({
      type: "trade.offer",
      targetPlayerId: trade.peerId,
      offer: trade.localOffer
    });
    updateTradeStatus();
  }

  function acceptTradeOffer() {
    const trade = multiplayer.trade;
    if (trade && trade.kind === "npc") {
      completeNpcTradeOffer();
      return;
    }
    if (!trade || trade.completed || !trade.localSent || !trade.remoteSent || !canAffordTradeOffer(trade.localOffer)) {
      return;
    }

    trade.localAccepted = true;
    sendMultiplayer({
      type: "trade.accept",
      targetPlayerId: trade.peerId,
      offer: trade.localOffer
    });

    if (trade.remoteAccepted) {
      completeTrade();
    } else {
      updateTradeStatus();
    }
  }

  function handleTradeOffer(message) {
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    if (!fromPlayerId) {
      return;
    }

    if (!multiplayer.trade || multiplayer.trade.peerId !== fromPlayerId) {
      openTradeSession(fromPlayerId, message.fromName || "Contact");
    }

    multiplayer.trade.remoteOffer = normalizeTradeOffer(message.offer);
    multiplayer.trade.remoteSent = true;
    multiplayer.trade.remoteAccepted = false;
    renderTradePanel();
    maybeNotifyText((message.fromName || "Contact") + " updated their trade offer.");
  }

  function handleTradeAccept(message) {
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    if (!fromPlayerId) {
      return;
    }

    if (!multiplayer.trade || multiplayer.trade.peerId !== fromPlayerId) {
      openTradeSession(fromPlayerId, message.fromName || "Contact");
    }

    multiplayer.trade.remoteOffer = normalizeTradeOffer(message.offer);
    multiplayer.trade.remoteSent = true;
    multiplayer.trade.remoteAccepted = true;
    if (multiplayer.trade.localAccepted) {
      completeTrade();
    } else {
      renderTradePanel();
      maybeNotifyText((message.fromName || "Contact") + " accepted the trade.");
    }
  }

  function completeTrade() {
    const trade = multiplayer.trade;
    if (!trade || trade.completed || !canAffordTradeOffer(trade.localOffer)) {
      updateTradeStatus();
      return;
    }

    for (const tech of techTypes) {
      techInventory[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0) - Math.max(0, Math.floor(trade.localOffer[tech.key] || 0)));
      techInventory[tech.key] += Math.max(0, Math.floor(trade.remoteOffer[tech.key] || 0));
    }

    trade.completed = true;
    updateTechUi();
    void savePersistentState({ includeWorld: false });
    renderTradePanel();
    playSound("trade");
    maybeNotifyText("Trade complete with " + trade.peerName + ".");
  }

  function partyPlayerIds() {
    return new Set(
      multiplayer.partySession && Array.isArray(multiplayer.partySession.players)
        ? multiplayer.partySession.players.map((entry) => entry.playerId).filter(Boolean)
        : []
    );
  }
