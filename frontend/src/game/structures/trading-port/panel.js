  function createTradePortResourceRow(tech, amount, options) {
    const settings = options || {};
    const row = document.createElement("div");
    const dot = document.createElement("span");
    const name = document.createElement("span");
    const controls = document.createElement("span");
    const value = document.createElement("strong");
    const minus = document.createElement("button");
    const plus = document.createElement("button");

    row.className = "trade-row";
    row.style.setProperty("--tech-color", tech.color);
    dot.className = "trade-row__dot";
    name.className = "trade-row__name";
    name.textContent = settings.label || tech.label;
    controls.className = "trade-row__controls";
    value.className = "trade-row__amount";
    value.textContent = Math.max(0, Math.floor(amount || 0)).toString();
    minus.type = "button";
    plus.type = "button";
    minus.textContent = "-";
    plus.textContent = "+";
    minus.disabled = amount <= 0 || settings.disabled;
    plus.disabled = Boolean(settings.disabled);

    if (settings.storageMode) {
      minus.textContent = settings.storageMode === "withdraw" ? "<" : ">";
      plus.textContent = settings.storageMode === "withdraw" ? "<<" : ">>";
      minus.dataset.tradePortStorageKey = tech.key;
      minus.dataset.tradePortStorageMode = settings.storageMode;
      minus.dataset.tradePortStorageAmount = "1";
      plus.dataset.tradePortStorageKey = tech.key;
      plus.dataset.tradePortStorageMode = settings.storageMode;
      plus.dataset.tradePortStorageAmount = "5";
      minus.disabled = amount <= 0 || settings.disabled;
      plus.disabled = amount <= 0 || settings.disabled;
    } else {
      minus.dataset.tradePortKey = tech.key;
      minus.dataset.tradePortSide = settings.side || "receive";
      minus.dataset.tradePortDelta = "-1";
      plus.dataset.tradePortKey = tech.key;
      plus.dataset.tradePortSide = settings.side || "receive";
      plus.dataset.tradePortDelta = "1";
    }

    controls.append(minus, value, plus);
    row.append(dot, name, controls);
    return row;
  }

  function renderTradePortOfferRow(structure, offer, selected, owner) {
    const row = document.createElement("div");
    const dot = document.createElement("span");
    const stack = document.createElement("span");
    const name = document.createElement("span");
    const sub = document.createElement("span");
    const button = document.createElement("button");
    row.className = "trade-row";
    if (selected) {
      row.classList.add("is-selected");
    }
    row.style.setProperty("--tech-color", offer.enabled === false ? "#7f8ea3" : "#ffb86b");
    dot.className = "trade-row__dot";
    stack.className = "trade-row__stack";
    name.className = "trade-row__name";
    sub.className = "trade-row__sub";
    name.textContent = describeTradeOffer(offer);
    sub.textContent = owner
      ? (offer.enabled === false ? "Paused" : tradingPortOfferIsLive(structure, offer) ? "Ready" : "Needs stock")
      : (tradingPortOfferIsLive(structure, offer) && canAffordTradeOffer(offer.receive) ? "Available" : "Unavailable");
    button.type = "button";
    button.dataset.tradePortOffer = offer.id;
    button.textContent = owner ? (selected ? "Open" : "Edit") : "Trade";
    button.disabled = !owner && (!tradingPortOfferIsLive(structure, offer) || !canAffordTradeOffer(offer.receive));
    stack.append(name, sub);
    row.append(dot, stack, button);
    return row;
  }

  function renderTradePortPanel() {
    const structure = activeTradePortStructure();
    if (!tradePortPanel || !tradePortOfferList || !tradePortBuyList || !tradePortPayList || !structure) {
      closeTradePortSession();
      return;
    }

    normalizeTradingPortState(structure);
    const owner = isTradingPortOwner(structure);
    const offers = structure.tradeOffers;
    const selected = selectedTradingPortOffer(structure);
    const storedTotal = tradeOfferTotal(structure.tech);
    const vessel = normalizeTradeVessel(structure.tradeVessel, structure);

    if (tradePortName) {
      tradePortName.textContent = "Trading Port" + (storedTotal > 0 ? " (" + storedTotal + ")" : "");
    }
    if (tradePortAddOffer) {
      tradePortAddOffer.hidden = !owner;
      tradePortAddOffer.disabled = offers.length >= tradingPortMaxOffers;
    }
    if (tradePortRemoveOffer) {
      tradePortRemoveOffer.hidden = !owner;
      tradePortRemoveOffer.disabled = !selected;
    }

    tradePortOfferList.textContent = "";
    if (offers.length) {
      for (const offer of offers) {
        tradePortOfferList.append(renderTradePortOfferRow(structure, offer, selected && offer.id === selected.id, owner));
      }
    } else {
      const empty = document.createElement("div");
      empty.className = "trade-row";
      empty.style.setProperty("--tech-color", "#7f8ea3");
      empty.textContent = owner ? "No posted trades." : "No trades available.";
      tradePortOfferList.append(empty);
    }

    tradePortBuyList.textContent = "";
    tradePortPayList.textContent = "";
    if (owner && selected) {
      for (const tech of techTypes) {
        tradePortBuyList.append(createTradePortResourceRow(tech, selected.receive[tech.key], { side: "receive" }));
        tradePortPayList.append(createTradePortResourceRow(tech, selected.pay[tech.key], { side: "pay" }));
      }
    } else if (!owner && selected) {
      for (const tech of techTypes) {
        tradePortBuyList.append(createTradePortResourceRow(tech, selected.receive[tech.key], { disabled: true, label: tech.label }));
        tradePortPayList.append(createTradePortResourceRow(tech, selected.pay[tech.key], { disabled: true, label: tech.label }));
      }
    }

    if (tradePortPlayerList && tradePortStoredList) {
      tradePortPlayerList.textContent = "";
      tradePortStoredList.textContent = "";
      for (const tech of techTypes) {
        tradePortPlayerList.append(createTradePortResourceRow(tech, Math.floor(techInventory[tech.key] || 0), {
          storageMode: "deposit",
          disabled: !owner
        }));
        tradePortStoredList.append(createTradePortResourceRow(tech, Math.floor(structure.tech[tech.key] || 0), {
          storageMode: "withdraw",
          disabled: !owner
        }));
      }
    }

    if (tradePortStatus) {
      const vesselText = vessel.state === "outbound" ? "Courier outbound." : vessel.state === "returning" ? "Courier returning." : "Courier docked.";
      tradePortStatus.textContent = owner
        ? vesselText + " Stock pay offers to make them active."
        : "Sell matching tech directly to this port.";
    }

    tradePortPanel.classList.add("is-open");
    tradePortPanel.setAttribute("aria-hidden", "false");
    syncCompactHudControls();
    updateTouchScreenUi();
  }

