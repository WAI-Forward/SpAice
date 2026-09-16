  function filteredBuildRecipes() {
    const visibleRecipes = allBuildMenuRecipes().filter(isBuildRecipeVisible);
    if (activeBuildFilter === "all") {
      return visibleRecipes;
    }
    return visibleRecipes.filter((recipe) => recipe.category === activeBuildFilter);
  }

  function isBuildRecipeVisible(recipe) {
    if (!recipe || !recipe.blueprintObjectiveId) {
      return true;
    }
    return Boolean(objectiveState.completed[recipe.blueprintObjectiveId] && objectiveState.claimed[recipe.blueprintObjectiveId]);
  }

  function recipeCostEntries(recipe) {
    return recipe && recipe.cost && typeof recipe.cost === "object" ? Object.entries(recipe.cost) : [];
  }

  function canAffordRecipe(recipe) {
    const costEntries = recipeCostEntries(recipe);
    return costEntries.length > 0 && costEntries.every(([techKey, amount]) => Math.floor(techInventory[techKey] || 0) >= amount);
  }

  function isRecipeUnlocked(recipe) {
    return recipe.unlockToolId ? hasTool(recipe.unlockToolId) : false;
  }

  function isStructureRecipe(recipe) {
    return recipe && recipe.category === "structures" && Boolean(recipe.structureType);
  }

  function buildRecipeActionText(recipe) {
    if (isSkinRecipe(recipe)) {
      return skinLockerActionText(recipe);
    }

    if (isRecipeUnlocked(recipe)) {
      return isToolEquipped(recipe.unlockToolId) ? "Unequip" : "Equip";
    }

    if (isStructureRecipe(recipe)) {
      return canAffordRecipe(recipe) ? "Place" : "Needs tech";
    }

    return canAffordRecipe(recipe) ? "Craft" : "Needs tech";
  }

  function isBuildRecipeActionAvailable(recipe) {
    if (isSkinRecipe(recipe)) {
      return isSkinLockerActionAvailable(recipe);
    }
    return isRecipeUnlocked(recipe) || canAffordRecipe(recipe);
  }

  function upgradeActionText(toolId, upgrade) {
    if (!hasTool(toolId)) {
      return "Craft tool first";
    }
    return canAffordUpgrade(upgrade) ? "Upgrade" : "Needs tech";
  }

