  function spendRecipeCost(recipe) {
    for (const [techKey, amount] of recipeCostEntries(recipe)) {
      techInventory[techKey] = Math.max(0, Math.floor(techInventory[techKey] || 0) - amount);
    }
  }

  function refundRecipeCost(recipe, factor) {
    let refunded = 0;
    for (const [techKey, amount] of recipeCostEntries(recipe)) {
      if (amount <= 0) {
        continue;
      }

      const refundAmount = Math.max(1, Math.floor(Math.max(0, amount) * factor));
      techInventory[techKey] = Math.max(0, Math.floor(techInventory[techKey] || 0)) + refundAmount;
      refunded += refundAmount;
    }
    return refunded;
  }

  function startStructurePlacement(recipeId) {
    const recipe = recipeById(recipeId);
    if (!isStructureRecipe(recipe) || !canAffordRecipe(recipe)) {
      return;
    }

    activePlacementRecipeId = recipe.id;
    pendingTetherAnchor = null;
    setBuildMenuOpen(false);
    resetMouseButtons();
    if (isLinkedStructureType(recipe.structureType)) {
      maybeNotifyText("Choose a non-star boulder-sized or larger body for the first " + recipe.name.toLowerCase() + " anchor.");
    } else {
      maybeNotifyText("Choose a moon, planet, or plate surface for the " + recipe.name.toLowerCase() + ".");
    }
  }

  function cancelStructurePlacement() {
    if (!activePlacementRecipeId) {
      return;
    }

    activePlacementRecipeId = null;
    pendingTetherAnchor = null;
    resetMouseButtons();
  }

  function craftRecipe(recipeId) {
    const recipe = recipeById(recipeId);
    if (!recipe) {
      return;
    }

    if (isSkinRecipe(recipe)) {
      activateSkinRecipe(recipe);
      return;
    }

    if (isRecipeUnlocked(recipe)) {
      if (recipe.unlockToolId) {
        toggleToolEquip(recipe.unlockToolId);
      }
      return;
    }

    if (!canAffordRecipe(recipe)) {
      return;
    }

    if (isStructureRecipe(recipe)) {
      startStructurePlacement(recipe.id);
      return;
    }

    if (isMultiplayerV2Active() && sendMultiplayerV2BuildAction({
      action: "craftTool",
      recipeId: recipe.id
    })) {
      playSound("craft");
      maybeNotifyText(recipe.name + " crafted.");
      return;
    }

    spendRecipeCost(recipe);

    if (recipe.unlockToolId) {
      unlockTool(recipe.unlockToolId);
    }

    updateTechUi();
    playSound("craft");
    maybeNotifyText(recipe.name + " crafted.");
  }
