  function updateToolHotbar() {
    if (!toolHotbar) {
      return;
    }

    toolHotbar.textContent = "";
    toolHotbar.classList.toggle("is-visible", gameSettings.hudEnabled !== false && hotbarToolIds.length > 0 && (unlockedToolIds.length > 1 || buildMenuOpen));

    hotbarToolIds.forEach((toolId, index) => {
      const tool = toolById(toolId);
      const slot = document.createElement("button");
      const key = document.createElement("span");
      const name = document.createElement("strong");

      slot.type = "button";
      slot.className = "tool-slot";
      slot.dataset.toolId = tool.id;
      slot.classList.toggle("is-equipped", tool.id === equippedToolId);
      slot.style.setProperty("--tool-color", tool.color);
      key.className = "tool-slot__key";
      name.className = "tool-slot__name";
      key.textContent = (index + 1).toString();
      name.textContent = tool.shortName;

      slot.append(key, name);
      toolHotbar.append(slot);
    });
  }

  function selectTool(toolId) {
    if (!isToolEquipped(toolId)) {
      return;
    }

    if (isMultiplayerV2Active() && sendMultiplayerV2BuildAction({
      action: "setEquippedTools",
      equippedTool: toolId,
      equippedTools: serializeEquippedToolInventory()
    })) {
      playSound("select");
      return;
    }

    equippedToolId = toolId;
    toolFireCooldown = Math.min(toolFireCooldown, (equippedWeapon() || playerWeaponDefaults).cooldown);
    updateToolHotbar();
    renderBuildMenu();
    playSound("select");
  }

  function cycleTool(direction) {
    if (hotbarToolIds.length < 2) {
      return;
    }

    const currentIndex = Math.max(0, hotbarToolIds.indexOf(equippedToolId));
    const nextIndex = (currentIndex + direction + hotbarToolIds.length) % hotbarToolIds.length;
    selectTool(hotbarToolIds[nextIndex]);
  }

  function equipTool(toolId) {
    if (!hasTool(toolId)) {
      return;
    }

    if (isMultiplayerV2Active()) {
      const nextHotbarToolIds = isToolEquipped(toolId) ? hotbarToolIds.slice() : hotbarToolIds.concat(toolId);
      if (sendMultiplayerV2BuildAction({
        action: "setEquippedTools",
        equippedTool: toolId,
        equippedTools: nextHotbarToolIds
      })) {
        playSound("select");
        return;
      }
    }

    if (!isToolEquipped(toolId)) {
      hotbarToolIds.push(toolId);
    }
    selectTool(toolId);
  }

  function unequipTool(toolId) {
    if (!isToolEquipped(toolId)) {
      return;
    }

    if (isMultiplayerV2Active()) {
      const nextHotbarToolIds = hotbarToolIds.filter((equippedId) => equippedId !== toolId);
      const nextEquippedToolId = equippedToolId === toolId ? nextHotbarToolIds[0] || defaultToolId : equippedToolId;
      if (sendMultiplayerV2BuildAction({
        action: "setEquippedTools",
        equippedTool: nextEquippedToolId,
        equippedTools: nextHotbarToolIds
      })) {
        playSound("select");
        return;
      }
    }

    hotbarToolIds = hotbarToolIds.filter((equippedId) => equippedId !== toolId);
    if (equippedToolId === toolId) {
      equippedToolId = hotbarToolIds[0] || null;
      toolFireCooldown = Math.min(toolFireCooldown, (equippedWeapon() || playerWeaponDefaults).cooldown);
    }

    updateToolHotbar();
    renderBuildMenu();
    playSound("select");
  }

  function toggleToolEquip(toolId) {
    if (!hasTool(toolId)) {
      return;
    }

    if (isToolEquipped(toolId)) {
      unequipTool(toolId);
    } else {
      equipTool(toolId);
    }
  }

  function unlockTool(toolId) {
    if (!hasTool(toolId)) {
      unlockedToolIds.push(toolId);
    }
    equipTool(toolId);
  }

