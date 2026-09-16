  let activeContainerStructureId = 0;

  function findContainerStructureById(id) {
    const cleanId = Math.max(1, Math.floor(finiteOr(id, 0)));
    for (const structure of structures) {
      if (structure && structure.id === cleanId && structure.type === "container") {
        return structure;
      }
    }
    return null;
  }

  function canAccessContainerStructure(structure) {
    if (!structure || structure.type !== "container" || structure.health <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    return Math.hypot(structure.x - player.x, structure.y - player.y) <= structureHitRadius(structure) + player.radius + 96;
  }

  function containerAtCursor() {
    const cursor = screenToWorld(mouse.x, mouse.y);
    let best = null;
    let bestDistance = Infinity;
    for (const structure of structures) {
      if (!canAccessContainerStructure(structure)) {
        continue;
      }

      const distance = Math.hypot(structure.x - cursor.x, structure.y - cursor.y);
      if (distance > structureHitRadius(structure) + 18 || distance >= bestDistance) {
        continue;
      }
      best = structure;
      bestDistance = distance;
    }
    return best;
  }

  function activeContainerStructure() {
    const structure = findContainerStructureById(activeContainerStructureId);
    return canAccessContainerStructure(structure) ? structure : null;
  }

  function closeContainerSession() {
    activeContainerStructureId = 0;
    if (containerPanel) {
      containerPanel.classList.remove("is-open");
      containerPanel.setAttribute("aria-hidden", "true");
    }
    syncCompactHudControls();
    updateTouchScreenUi();
  }

  function openContainerSession(structure) {
    if (!canAccessContainerStructure(structure)) {
      return false;
    }
    structure.tech = normalizeTradeOffer(structure.tech);
    activeContainerStructureId = structure.id;
    setPlayerInteractionMenu(false);
    closeTradeSession();
    closeTradePortSession();
    setBuildMenuOpen(false);
    renderContainerPanel();
    playSound("select");
    return true;
  }

  function handleContainerClick() {
    const structure = containerAtCursor();
    if (!structure) {
      return false;
    }
    return openContainerSession(structure);
  }

  function createContainerResourceRow(tech, amount, mode) {
    const row = document.createElement("div");
    const dot = document.createElement("span");
    const name = document.createElement("span");
    const controls = document.createElement("span");
    const value = document.createElement("strong");
    const one = document.createElement("button");
    const five = document.createElement("button");
    const withdraw = mode === "withdraw";

    row.className = "trade-row";
    row.style.setProperty("--tech-color", tech.color);
    dot.className = "trade-row__dot";
    name.className = "trade-row__name";
    name.textContent = tech.label;
    controls.className = "trade-row__controls";
    value.className = "trade-row__amount";
    value.textContent = Math.max(0, Math.floor(amount || 0)).toString();
    one.type = "button";
    one.dataset.containerKey = tech.key;
    one.dataset.containerMode = mode;
    one.dataset.containerAmount = "1";
    one.textContent = withdraw ? "<" : ">";
    five.type = "button";
    five.dataset.containerKey = tech.key;
    five.dataset.containerMode = mode;
    five.dataset.containerAmount = "5";
    five.textContent = withdraw ? "<<" : ">>";
    one.disabled = amount <= 0;
    five.disabled = amount <= 0;
    controls.append(value, one, five);
    row.append(dot, name, controls);
    return row;
  }

  function renderContainerPanel() {
    const structure = activeContainerStructure();
    if (!containerPanel || !containerPlayerList || !containerStoredList || !structure) {
      closeContainerSession();
      return;
    }

    structure.tech = normalizeTradeOffer(structure.tech);
    if (containerName) {
      const storedTotal = tradeOfferTotal(structure.tech);
      containerName.textContent = storedTotal > 0 ? "Container (" + storedTotal + ")" : "Container";
    }

    containerPlayerList.textContent = "";
    containerStoredList.textContent = "";
    for (const tech of techTypes) {
      containerPlayerList.append(createContainerResourceRow(tech, Math.floor(techInventory[tech.key] || 0), "deposit"));
      containerStoredList.append(createContainerResourceRow(tech, Math.floor(structure.tech[tech.key] || 0), "withdraw"));
    }

    if (containerStatus) {
      containerStatus.textContent = "Anyone close enough can take from this container.";
    }
    containerPanel.classList.add("is-open");
    containerPanel.setAttribute("aria-hidden", "false");
    syncCompactHudControls();
    updateTouchScreenUi();
  }

  function transferContainerTech(techKey, mode, amount) {
    const structure = activeContainerStructure();
    const tech = techByKey(techKey);
    const cleanAmount = Math.max(1, Math.floor(finiteOr(amount, 1)));
    const cleanMode = mode === "withdraw" ? "withdraw" : "deposit";
    if (!structure || !tech) {
      closeContainerSession();
      return false;
    }

    if (isMultiplayerV2Active()) {
      if (!sendMultiplayerV2BuildAction({
        action: "transferContainerTech",
        structureId: structure.id,
        techKey: tech.key,
        mode: cleanMode,
        amount: cleanAmount
      })) {
        maybeNotifyText("Reconnect before using the container.");
        return false;
      }
      renderContainerPanel();
      playSound("trade");
      return true;
    }

    structure.tech = normalizeTradeOffer(structure.tech);
    const playerAmount = Math.max(0, Math.floor(techInventory[tech.key] || 0));
    const storedAmount = Math.max(0, Math.floor(structure.tech[tech.key] || 0));
    const moved = cleanMode === "withdraw"
      ? Math.min(cleanAmount, storedAmount)
      : Math.min(cleanAmount, playerAmount);
    if (moved <= 0) {
      return false;
    }

    if (cleanMode === "withdraw") {
      structure.tech[tech.key] = storedAmount - moved;
      techInventory[tech.key] = playerAmount + moved;
      if (isSurvivalCampStructure(structure)) {
        wakeSurvivalCampFromStructure(structure, player.id || "");
      }
    } else {
      techInventory[tech.key] = playerAmount - moved;
      structure.tech[tech.key] = storedAmount + moved;
    }

    updateTechUi();
    renderContainerPanel();
    void savePersistentState({ includeWorld: true });
    playSound("trade");
    return true;
  }
