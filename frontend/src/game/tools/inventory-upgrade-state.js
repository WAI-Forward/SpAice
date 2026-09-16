  function createDefaultToolUpgradeLevels() {
    const levels = {};
    for (const [toolId, upgrades] of Object.entries(toolUpgradeDefinitions)) {
      levels[toolId] = {};
      for (const upgrade of upgrades) {
        levels[toolId][upgrade.id] = 0;
      }
    }
    return levels;
  }

  function normalizeToolUpgrades(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    const levels = createDefaultToolUpgradeLevels();

    for (const [toolId, upgrades] of Object.entries(toolUpgradeDefinitions)) {
      const toolLevels = snapshot[toolId] && typeof snapshot[toolId] === "object" ? snapshot[toolId] : {};
      for (const upgrade of upgrades) {
        levels[toolId][upgrade.id] = Math.max(0, finiteOr(toolLevels[upgrade.id], 0));
      }
    }

    return levels;
  }

  function toolIdListsEqual(first, second) {
    if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length) {
      return false;
    }

    for (let index = 0; index < first.length; index += 1) {
      if (first[index] !== second[index]) {
        return false;
      }
    }

    return true;
  }

  function toolUpgradeLevelsEqual(first, second) {
    const left = first && typeof first === "object" ? first : {};
    const right = second && typeof second === "object" ? second : {};

    for (const [toolId, upgrades] of Object.entries(toolUpgradeDefinitions)) {
      const leftToolLevels = left[toolId] && typeof left[toolId] === "object" ? left[toolId] : {};
      const rightToolLevels = right[toolId] && typeof right[toolId] === "object" ? right[toolId] : {};
      for (const upgrade of upgrades) {
        if (Math.max(0, finiteOr(leftToolLevels[upgrade.id], 0)) !== Math.max(0, finiteOr(rightToolLevels[upgrade.id], 0))) {
          return false;
        }
      }
    }

    return true;
  }

  function toolUpgradeOptions(toolId) {
    return toolUpgradeDefinitions[toolId] || [];
  }

  function toolUpgradeById(toolId, upgradeId) {
    return toolUpgradeOptions(toolId).find((upgrade) => upgrade.id === upgradeId) || null;
  }

  function toolUpgradeLevel(toolId, upgradeId) {
    const toolLevels = toolUpgradeLevels[toolId] || {};
    return Math.max(0, finiteOr(toolLevels[upgradeId], 0));
  }

  function upgradeBonus(level, bonusScale) {
    const cleanLevel = Math.max(0, finiteOr(level, 0));
    const cleanScale = Math.max(0, finiteOr(bonusScale, 0));
    return cleanScale * (0.28 / Math.log1p(0.5)) * Math.log1p(cleanLevel * 0.5);
  }

  function toolUpgradeBonus(toolId, upgradeId) {
    const upgrade = toolUpgradeById(toolId, upgradeId);
    return upgrade ? upgradeBonus(toolUpgradeLevel(toolId, upgrade.id), upgrade.bonusScale) : 0;
  }

  function toolUpgradeFactor(toolId, upgradeId) {
    return 1 + toolUpgradeBonus(toolId, upgradeId);
  }

  function formatUpgradeBonus(value) {
    const percent = Math.max(0, value) * 100;

    if (percent > 0 && percent < 0.1) {
      return "+<0.1%";
    }

    const decimals = percent < 1 ? 2 : 1;
    return "+" + percent.toFixed(decimals).replace(/\.0$/, "") + "%";
  }

  function formatUpgradeLevel(value) {
    const level = Math.max(0, value);
    return Number.isInteger(level) ? String(level) : level.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function canAffordUpgrade(upgrade) {
    return upgrade && Math.floor(techInventory[upgrade.techKey] || 0) >= upgrade.cost;
  }

  function spendUpgradeCost(upgrade) {
    techInventory[upgrade.techKey] = Math.max(0, Math.floor(techInventory[upgrade.techKey] || 0) - upgrade.cost);
  }

  function upgradeTool(toolId, upgradeId) {
    const upgrade = toolUpgradeById(toolId, upgradeId);
    if (!upgrade || !hasTool(toolId) || !canAffordUpgrade(upgrade)) {
      return;
    }

    if (isMultiplayerV2Active() && sendMultiplayerV2BuildAction({
      action: "upgradeTool",
      toolId,
      upgradeId
    })) {
      playSound("craft");
      maybeNotifyText(toolById(toolId).shortName + " " + upgrade.name.toLowerCase() + " upgraded.");
      return;
    }

    spendUpgradeCost(upgrade);
    if (!toolUpgradeLevels[toolId]) {
      toolUpgradeLevels[toolId] = {};
    }
    toolUpgradeLevels[toolId][upgrade.id] = toolUpgradeLevel(toolId, upgrade.id) + 1;
    updateTechUi();
    playSound("craft");
    maybeNotifyText(toolById(toolId).shortName + " " + upgrade.name.toLowerCase() + " upgraded.");
  }

  function equippedTool() {
    return toolById(equippedToolId);
  }

  function normalizeStatusEffectDuration(value) {
    return Math.max(0, finiteOr(value, 0));
  }

  function syncLegacyToolDisabledTimer() {
    toolDisabledTimer = normalizeStatusEffectDuration(playerStatusEffects.disabled);
  }

  function hasPlayerStatusEffect(status) {
    if (status === "disabled") {
      return Math.max(
        normalizeStatusEffectDuration(playerStatusEffects.disabled),
        normalizeStatusEffectDuration(toolDisabledTimer)
      ) > 0;
    }
    return normalizeStatusEffectDuration(playerStatusEffects[status]) > 0;
  }

  function applyPlayerStatusEffect(status, duration) {
    const effect = String(status || "").trim().toLowerCase();
    const amount = normalizeStatusEffectDuration(duration);
    if (effect !== "disabled") {
      return false;
    }

    if (amount <= 0) {
      playerStatusEffects.disabled = 0;
      playerStatusEffectMaxDurations.disabled = 0;
      syncLegacyToolDisabledTimer();
      return true;
    }

    const current = normalizeStatusEffectDuration(playerStatusEffects.disabled);
    if (amount >= current) {
      playerStatusEffectMaxDurations.disabled = amount;
    }
    playerStatusEffects.disabled = Math.max(current, amount);
    syncLegacyToolDisabledTimer();
    if (amount > 0) {
      toolFireCooldown = Math.max(toolFireCooldown, Math.min(amount, 1.2));
      resetMouseButtons();
    }
    return true;
  }

  function clearPlayerStatusEffects() {
    for (const key of Object.keys(playerStatusEffects)) {
      playerStatusEffects[key] = 0;
      playerStatusEffectMaxDurations[key] = 0;
    }
    syncLegacyToolDisabledTimer();
  }

  function updatePlayerStatusEffects(dt) {
    const elapsed = Math.max(0, finiteOr(dt, 0));
    for (const key of Object.keys(playerStatusEffects)) {
      playerStatusEffects[key] = Math.max(0, normalizeStatusEffectDuration(playerStatusEffects[key]) - elapsed);
      if (playerStatusEffects[key] <= 0) {
        playerStatusEffectMaxDurations[key] = 0;
      }
    }
    syncLegacyToolDisabledTimer();
  }

  function serializePlayerStatusEffects() {
    return {
      disabled: normalizeStatusEffectDuration(playerStatusEffects.disabled),
      disabledMax: normalizeStatusEffectDuration(playerStatusEffectMaxDurations.disabled)
    };
  }

  function applySerializedPlayerStatusEffects(source) {
    const effects = source && typeof source === "object" ? source : {};
    const disabled = Math.max(
      normalizeStatusEffectDuration(effects.disabled),
      normalizeStatusEffectDuration(effects.toolDisabledTimer)
    );
    playerStatusEffects.disabled = disabled;
    playerStatusEffectMaxDurations.disabled = disabled > 0
      ? Math.max(
        disabled,
        normalizeStatusEffectDuration(effects.disabledMax),
        normalizeStatusEffectDuration(playerStatusEffectMaxDurations.disabled)
      )
      : 0;
    syncLegacyToolDisabledTimer();
  }

  function areToolsDisabled() {
    return hasPlayerStatusEffect("disabled");
  }

  function isSuctionEquipped() {
    return isSuctionTool(equippedToolId);
  }

  function isSuctionTool(toolId) {
    return toolId === defaultToolId || toolId === visciousVacuumToolId;
  }

  function isVisciousVacuumEquipped() {
    return equippedToolId === visciousVacuumToolId;
  }

  function canUseSuctionControls() {
    return isSuctionEquipped() && !areToolsDisabled() && canUseContinuousPlayerEnergy(suctionEnergyDrain);
  }

  function hasVacuumBucketCollider() {
    return isSuctionEquipped();
  }

  function isSpannerEquipped() {
    return equippedToolId === "spanner" && !areToolsDisabled();
  }

  function weaponByToolId(toolId) {
    const base = weaponDefinitions[toolId] || null;
    if (!base) {
      return null;
    }

    const rangeFactor = toolUpgradeFactor(toolId, "range");
    return {
      ...base,
      damage: base.damage * toolUpgradeFactor(toolId, "damage"),
      life: base.life * rangeFactor
    };
  }

  function equippedWeapon() {
    return weaponByToolId(equippedToolId);
  }

  function isWeaponTool(toolId) {
    return Boolean(weaponDefinitions[toolId]);
  }

  function isEmpTool(toolId) {
    return toolId === empToolId;
  }

  function isEmpToolEquipped() {
    return isEmpTool(equippedToolId) && !areToolsDisabled();
  }

  function isFamiliarNetEquipped() {
    return equippedToolId === familiarNetToolId && !areToolsDisabled();
  }

  function isPistonPunchTool(toolId) {
    return toolId === pistonPunchToolId;
  }

  function isPistonPunchEquipped() {
    return isPistonPunchTool(equippedToolId) && !areToolsDisabled();
  }

  function isRocketSuitEquipped() {
    return equippedToolId === rocketSuitToolId && !areToolsDisabled();
  }

  function currentEmpPulseRange() {
    return empPulseRange * toolUpgradeFactor(empToolId, "range");
  }

  function currentEmpPulseDisableDuration() {
    return empPulseDisableDuration * toolUpgradeFactor(empToolId, "duration");
  }

  function isMechanicalMob(mob) {
    return mob && ["ufo", "rambot", "satellite", "rocket", "fighter"].includes(mob.kind);
  }

  function hasTool(toolId) {
    return unlockedToolIds.includes(toolId);
  }

  function isToolEquipped(toolId) {
    return hotbarToolIds.includes(toolId);
  }

  function currentSpannerRepairRate() {
    return spannerRepairRate * toolUpgradeFactor("spanner", "repair-speed");
  }

  function currentSpannerDismantleRate() {
    return spannerDismantleRate * toolUpgradeFactor("spanner", "dismantle-speed");
  }

  function currentSpannerStrikeCooldown() {
    return spannerStrikeCooldown / toolUpgradeFactor("spanner", "dismantle-speed");
  }

  function currentGadgetSuckFactor() {
    return toolUpgradeFactor(isSuctionTool(equippedToolId) ? equippedToolId : defaultToolId, "suck");
  }

  function currentGadgetRangeFactor() {
    return currentGadgetSuckFactor();
  }

  function currentGadgetBlowFactor() {
    return toolUpgradeFactor(isSuctionTool(equippedToolId) ? equippedToolId : defaultToolId, "blow");
  }

