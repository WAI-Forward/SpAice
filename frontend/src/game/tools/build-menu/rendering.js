  function renderBuildMenuResources() {
    if (!buildMenuTech) {
      return;
    }

    const title = buildMenu ? buildMenu.querySelector(".build-menu__resources-title") : null;
    if (activeBuildFilter === "skins" && isSkinStoreRuntime()) {
      if (title) {
        title.textContent = "Cosmetic Locker";
      }
      renderSkinLockerResources();
      return;
    }

    if (title) {
      title.textContent = "Tech Stores";
    }
    renderBuildMenuTechResources();
  }

  function createToolUpgradeSection(recipe) {
    const toolId = recipe && recipe.unlockToolId;
    const upgrades = toolId ? toolUpgradeOptions(toolId) : [];
    if (!upgrades.length) {
      return null;
    }

    const section = document.createElement("div");
    const title = document.createElement("span");

    section.className = "build-detail__upgrades";
    title.className = "build-detail__section-title";
    title.textContent = "Upgrades";
    section.append(title);

    for (const upgrade of upgrades) {
      const level = toolUpgradeLevel(toolId, upgrade.id);
      const currentBonus = upgradeBonus(level, upgrade.bonusScale);
      const nextBonus = upgradeBonus(level + 1, upgrade.bonusScale);
      const row = document.createElement("div");
      const summary = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      const cost = document.createElement("dl");
      const action = document.createElement("button");

      row.className = "build-upgrade";
      row.classList.toggle("is-disabled", !hasTool(toolId));
      summary.className = "build-upgrade__summary";
      name.className = "build-upgrade__name";
      meta.className = "build-upgrade__meta";
      cost.className = "build-upgrade__cost";
      action.className = "build-upgrade__action build-detail__upgrade-action";
      action.type = "button";
      action.dataset.toolId = toolId;
      action.dataset.upgradeId = upgrade.id;
      action.textContent = upgradeActionText(toolId, upgrade);
      action.disabled = !hasTool(toolId) || !canAffordUpgrade(upgrade);

      name.textContent = upgrade.name;
      meta.textContent =
        "Level " +
        formatUpgradeLevel(level) +
        "  " +
        formatUpgradeBonus(currentBonus) +
        " now, " +
        formatUpgradeBonus(nextBonus - currentBonus) +
        " next";

      cost.append(createCostRow(upgrade.techKey, upgrade.cost));
      summary.append(name, meta);
      row.append(summary, cost, action);
      section.append(row);
    }

    return section;
  }

  function ensureSelectedBuildRecipe(recipes) {
    if (!recipes.length) {
      selectedBuildRecipeId = null;
      return null;
    }

    if (!recipes.some((recipe) => recipe.id === selectedBuildRecipeId)) {
      selectedBuildRecipeId = recipes[0].id;
    }

    return recipeById(selectedBuildRecipeId);
  }

  function renderSkinBuildDetail(recipe) {
    const category = document.createElement("span");
    const swatch = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const costTitle = document.createElement("span");
    const costList = document.createElement("dl");
    const action = document.createElement("button");
    const swatchColors = skinSwatchColors(recipe);
    const owned = hasSkin(recipe.id);
    const equipped = isSkinEquipped(recipe.id);

    category.className = "build-detail__category";
    swatch.className = "build-detail__skin-swatch";
    title.className = "build-detail__title";
    description.className = "build-detail__description";
    costTitle.className = "build-detail__section-title";
    costList.className = "build-detail__cost";
    action.className = "build-detail__action";

    swatch.style.setProperty("--skin-color", swatchColors.color);
    swatch.style.setProperty("--skin-accent", swatchColors.accent);
    category.textContent = skinStoreTypeText(recipe);
    title.textContent = recipe.name;
    description.textContent = recipe.description;
    costTitle.textContent = "Locker";
    action.type = "button";
    action.dataset.recipeId = recipe.id;
    action.textContent = skinLockerActionText(recipe);
    action.disabled = !isSkinLockerActionAvailable(recipe);

    costList.append(createBuildInfoRow(isTrailSkin(recipe) ? "Effect" : recipe.kind === "costume" ? "Style" : "Colour", recipe.plainColor || "Custom", swatchColors.color));
    costList.append(createBuildInfoRow("Price", owned ? "Owned" : recipe.priceLabel || "Included", owned ? "#66e0b8" : "#ffd166"));
    if (!isAccountSignedIn() || accountState.waiLinked !== true) {
      costList.append(createBuildInfoRow("Account", skinAccountRequiredLabel(), "#ff73ad"));
    } else if (equipped) {
      costList.append(createBuildInfoRow("Status", "Equipped", "#66e0b8"));
    } else if (owned) {
      costList.append(createBuildInfoRow("Status", "Ready to equip", "#66e0b8"));
    } else if (!isSkinAvailableNow(recipe)) {
      costList.append(createBuildInfoRow("Status", skinAvailabilityStatus(recipe).message || "Unavailable", "#ff73ad"));
    } else {
      costList.append(createBuildInfoRow("Status", "Buy from Store", "#58e2ff"));
    }

    buildMenuDetail.append(category, swatch, title, description, costTitle, costList, action);
  }

  function renderBuildDetail(recipe) {
    if (!buildMenuDetail) {
      return;
    }

    buildMenuDetail.textContent = "";

    if (!recipe) {
      const empty = document.createElement("div");
      empty.className = "build-detail__empty";
      empty.textContent = "Select a blueprint";
      buildMenuDetail.append(empty);
      return;
    }

    if (isSkinRecipe(recipe)) {
      renderSkinBuildDetail(recipe);
      return;
    }

    const category = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const costTitle = document.createElement("span");
    const costList = document.createElement("dl");
    const action = document.createElement("button");
    const upgradeSection = createToolUpgradeSection(recipe);

    category.className = "build-detail__category";
    title.className = "build-detail__title";
    description.className = "build-detail__description";
    costTitle.className = "build-detail__section-title";
    costList.className = "build-detail__cost";
    action.className = "build-detail__action";

    category.textContent = recipe.category === "tools" ? "Tool" : "Structure";
    title.textContent = recipe.name;
    description.textContent = recipe.description;
    const costEntries = Object.entries(recipe.cost);
    costTitle.textContent = costEntries.length ? "Cost" : "Status";
    action.type = "button";
    action.dataset.recipeId = recipe.id;
    action.textContent = buildRecipeActionText(recipe);
    action.disabled = !isBuildRecipeActionAvailable(recipe);

    if (!costEntries.length) {
      const status = document.createElement("div");
      status.className = "build-detail__status";
      status.textContent = hasTool(recipe.unlockToolId) ? "Available by default" : "No tech required";
      costList.append(status);
    }

    for (const [techKey, amount] of costEntries) {
      costList.append(createCostRow(techKey, amount));
    }

    buildMenuDetail.append(category, title, description, costTitle, costList, action);
    if (upgradeSection) {
      buildMenuDetail.append(upgradeSection);
    }
  }

  function createBuildFilterTabs() {
    if (!buildMenuTabs) {
      return;
    }

    buildMenuTabs.textContent = "";
    for (const filter of availableBuildFilters()) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "build-menu__tab";
      tab.dataset.filter = filter.key;
      tab.setAttribute("role", "tab");
      tab.textContent = filter.label;
      buildMenuTabs.append(tab);
    }
  }

  function updateBuildFilterTabs() {
    if (!buildMenuTabs) {
      return;
    }

    for (const tab of buildMenuTabs.querySelectorAll(".build-menu__tab")) {
      const selected = tab.dataset.filter === activeBuildFilter;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    }
  }

  function renderBuildMenu() {
    if (!buildMenuList) {
      return;
    }

    clusternautsTestCounters.buildMenuRenders += 1;
    if (!availableBuildFilters().some((filter) => filter.key === activeBuildFilter)) {
      activeBuildFilter = "all";
    }
    updateBuildFilterTabs();
    renderBuildMenuResources();
    buildMenuList.textContent = "";

    const recipes = filteredBuildRecipes();
    const selectedRecipe = ensureSelectedBuildRecipe(recipes);
    if (!recipes.length) {
      const empty = document.createElement("div");
      empty.className = "build-menu__empty";
      empty.textContent = activeBuildFilter === "skins" ? "No purchased cosmetics yet." : activeBuildFilter === "structures" ? "No structures available yet." : "No blueprints available yet.";
      buildMenuList.append(empty);
    }

    for (const recipe of recipes) {
      const card = document.createElement("button");
      const iconFrame = document.createElement("span");
      const title = document.createElement("strong");
      const skinRecipe = isSkinRecipe(recipe);
      const unlocked = isRecipeUnlocked(recipe);
      const ownedTool = Boolean(recipe.unlockToolId && hasTool(recipe.unlockToolId));
      const ownedSkin = skinRecipe && hasSkin(recipe.id);
      const equippedSkin = skinRecipe && isSkinEquipped(recipe.id);
      const affordable = skinRecipe ? false : canAffordRecipe(recipe);

      card.type = "button";
      card.className = "build-card";
      card.dataset.recipeId = recipe.id;
      card.setAttribute("aria-pressed", recipe.id === selectedBuildRecipeId ? "true" : "false");
      card.setAttribute("aria-label", recipe.name + " " + (skinRecipe ? skinStoreTypeText(recipe).toLowerCase() : recipe.category === "tools" ? "tool" : "structure"));
      card.title = recipe.name;
      card.classList.toggle("is-unlocked", unlocked);
      card.classList.toggle("is-owned-tool", ownedTool);
      card.classList.toggle("is-owned-skin", ownedSkin);
      card.classList.toggle("is-equipped-skin", equippedSkin);
      card.classList.toggle("is-locked", skinRecipe ? !ownedSkin && !isSkinRecipeActionAvailable(recipe) : !ownedTool && !affordable);
      card.classList.toggle("is-selected", recipe.id === selectedBuildRecipeId);

      iconFrame.className = "build-card__icon";
      title.className = "build-card__title";

      if (skinRecipe) {
        const swatch = document.createElement("span");
        const swatchColors = skinSwatchColors(recipe);
        swatch.className = "build-card__skin-swatch";
        swatch.style.setProperty("--skin-color", swatchColors.color);
        swatch.style.setProperty("--skin-accent", swatchColors.accent);
        swatch.setAttribute("aria-hidden", "true");
        iconFrame.append(swatch);
      } else {
        const icon = document.createElement("img");
        icon.src = recipe.icon || "";
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        iconFrame.append(icon);
      }
      title.textContent = recipe.name;

      card.append(iconFrame, title);
      buildMenuList.append(card);
    }

    renderBuildDetail(selectedRecipe);

    if (buildMenuStatus) {
      const shown = recipes.length;
      const visibleRecipes = allBuildMenuRecipes().filter(isBuildRecipeVisible);
      const visibleTotal = activeBuildFilter === "skins"
        ? visibleRecipes.filter(isSkinRecipe).length
        : visibleRecipes.filter((recipe) => !isSkinRecipe(recipe)).length;
      buildMenuStatus.textContent = shown + "/" + visibleTotal + (activeBuildFilter === "skins" ? " Cosmetics" : " Blueprints");
    }
  }

