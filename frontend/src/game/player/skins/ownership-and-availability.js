  function storeFilterKeyForSkin(skin) {
    if (isTrailSkin(skin)) {
      return "trail";
    }
    return skin && skin.kind === "costume" ? "costume" : "suit";
  }

  function isDefaultSkinItem(skin) {
    return Boolean(skin && (skin.id === defaultSkinId || skin.id === defaultTrailId));
  }

  function defaultSkinIdForItem(skin) {
    return isTrailSkin(skin) ? defaultTrailId : defaultSkinId;
  }

  function normalizeSkinId(id) {
    const skin = skinById(String(id || ""));
    return skin ? skin.id : "";
  }

  function normalizeCharacterSkinId(id) {
    const skin = skinById(normalizeSkinId(id));
    return skin && !isTrailSkin(skin) ? skin.id : "";
  }

  function normalizeTrailId(id) {
    const skin = skinById(normalizeSkinId(id));
    return isTrailSkin(skin) ? skin.id : "";
  }

  function skinSwatchColors(skin) {
    const colors = skin && skin.colors ? skin.colors : defaultSuitSkinPalette;
    return {
      color: colors.swatch || colors.torso || "#f4f2ea",
      accent: colors.accent || "#64e3ff"
    };
  }

  function padMonthDayPart(value) {
    const number = Math.floor(Number(value));
    return number >= 1 && number <= 99 ? String(number).padStart(2, "0") : "";
  }

  function sanitizeMonthDay(value) {
    const raw = String(value || "").trim();
    let match = raw.match(/^(\d{1,2})-(\d{1,2})$/);
    if (!match) {
      match = raw.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
    }
    if (!match) {
      return "";
    }
    const month = padMonthDayPart(match[1]);
    const day = padMonthDayPart(match[2]);
    return month && day ? month + "-" + day : "";
  }

  function currentMonthDay() {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function paidSkinCount() {
    return skinCatalog.filter((skin) => skin && !isDefaultSkinItem(skin) && skin.priceId).length;
  }

  function ownedStoreItemCount() {
    return ownedSkinIds.length + ownedTrailIds.length;
  }

  function normalizeOwnedSkinIds(source) {
    const seen = new Set();
    const result = [];
    const list = Array.isArray(source) ? source : [];
    for (const id of list) {
      const cleanId = normalizeCharacterSkinId(id);
      if (!cleanId || cleanId === defaultSkinId || seen.has(cleanId)) {
        continue;
      }
      seen.add(cleanId);
      result.push(cleanId);
    }
    return result;
  }

  function normalizeOwnedTrailIds(source) {
    const seen = new Set();
    const result = [];
    const list = Array.isArray(source) ? source : [];
    for (const id of list) {
      const cleanId = normalizeTrailId(id);
      if (!cleanId || cleanId === defaultTrailId || seen.has(cleanId)) {
        continue;
      }
      seen.add(cleanId);
      result.push(cleanId);
    }
    return result;
  }

  function setOwnedSkinIds(source) {
    ownedSkinIds = normalizeOwnedSkinIds(source);
    if (equippedSkinId && !hasSkin(equippedSkinId)) {
      equippedSkinId = "";
    }
  }

  function setOwnedTrailIds(source) {
    ownedTrailIds = normalizeOwnedTrailIds(source);
    if (equippedTrailId && !hasSkin(equippedTrailId)) {
      equippedTrailId = "";
    }
  }

  function applySkinAccountState(account) {
    const source = account && typeof account === "object" ? account : {};
    setOwnedSkinIds(source.ownedSkinIds);
    setOwnedTrailIds(source.ownedTrailIds);
    equippedSkinId = normalizeCharacterSkinId(source.equippedSkinId);
    if (equippedSkinId === defaultSkinId || !hasSkin(equippedSkinId)) {
      equippedSkinId = "";
    }
    equippedTrailId = normalizeTrailId(source.equippedTrailId);
    if (equippedTrailId === defaultTrailId || !hasSkin(equippedTrailId)) {
      equippedTrailId = "";
    }
    renderBuildMenu();
    renderSkinStore();
  }

  function activeSkinId() {
    return normalizeCharacterSkinId(equippedSkinId) || defaultSkinId;
  }

  function activeTrailId() {
    return normalizeTrailId(equippedTrailId) || defaultTrailId;
  }

  function hasSkin(id) {
    const cleanId = normalizeSkinId(id);
    const skin = skinById(cleanId);
    if (!skin) {
      return false;
    }
    if (isTrailSkin(skin)) {
      return cleanId === defaultTrailId || ownedTrailIds.includes(cleanId);
    }
    return cleanId === defaultSkinId || ownedSkinIds.includes(cleanId);
  }

  function isSkinEquipped(id) {
    const cleanId = normalizeSkinId(id) || defaultSkinId;
    const skin = skinById(cleanId);
    return isTrailSkin(skin) ? cleanId === activeTrailId() : cleanId === activeSkinId();
  }

  function isSkinRecipe(recipe) {
    return Boolean(recipe && recipe.category === "skins" && skinById(recipe.id));
  }

  function skinPaletteForId(id) {
    const skin = skinById(normalizeCharacterSkinId(id) || defaultSkinId);
    return skin && skin.colors ? skin.colors : defaultSuitSkinPalette;
  }

  function skinModelForId(id) {
    const skin = skinById(normalizeCharacterSkinId(id) || defaultSkinId);
    return skin && skin.model ? skin.model : "astronaut";
  }

  function activeSkinPalette() {
    return skinPaletteForId(activeSkinId());
  }

  function activeSkinModel() {
    return skinModelForId(activeSkinId());
  }

  function skinAvailabilityStatus(skin) {
    const availability = skin && skin.availability;
    if (!availability || typeof availability !== "object") {
      return { available: true, message: "" };
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const today = currentMonthDay();
    if (availability.type === "month") {
      const available = month === Math.floor(Number(availability.month));
      return {
        available,
        message: available ? "" : availability.label || "Seasonal costume"
      };
    }
    if (availability.type === "dates") {
      const dates = Array.isArray(availability.dates) ? availability.dates.map(sanitizeMonthDay) : [];
      const available = dates.includes(today);
      return {
        available,
        message: available ? "" : availability.label || "Seasonal costume"
      };
    }
    if (availability.type === "birthday") {
      const birthday = sanitizeMonthDay(accountState.waiBirthdayMonthDay);
      const available = Boolean(birthday && birthday === today);
      return {
        available,
        message: available ? "" : birthday ? "Available on your birthday" : "Birthday required"
      };
    }
    return { available: true, message: "" };
  }

  function isSkinAvailableNow(skin) {
    return skinAvailabilityStatus(skin).available;
  }

  function shouldShowSkinInStore(skin) {
    return Boolean(skin && (hasSkin(skin.id) || isSkinAvailableNow(skin)));
  }

  function isSkinStoreRuntime() {
    // build:render:start
    return !isCrazyGamesRuntime() && !isGamePixRuntime();
    // build:render:end
    return false;
  }

  function skinLoginLabel() {
    // build:render:start
    return "Login";
    // build:render:end
    return "Account login";
  }

  function skinAccountRequiredLabel() {
    // build:render:start
    return "Login required";
    // build:render:end
    return "Account required";
  }

  function skinLoginPromptMessage() {
    // build:render:start
    return "You must be logged in to use the store";
    // build:render:end
    return "Log in to use the store.";
  }

  function availableBuildFilters() {
    return buildFilters.filter((filter) => filter.key !== "skins" || isSkinStoreRuntime());
  }

  function skinLockerRecipes() {
    if (!isSkinStoreRuntime()) {
      return [];
    }
    const recipes = [];
    const defaultSkin = skinById(defaultSkinId);
    if (defaultSkin) {
      recipes.push(defaultSkin);
    }
    const defaultTrail = skinById(defaultTrailId);
    if (defaultTrail) {
      recipes.push(defaultTrail);
    }
    for (const skinId of ownedSkinIds) {
      const skin = skinById(skinId);
      if (skin && skin.id !== defaultSkinId && !recipes.some((recipe) => recipe.id === skin.id)) {
        recipes.push(skin);
      }
    }
    for (const trailId of ownedTrailIds) {
      const trail = skinById(trailId);
      if (trail && trail.id !== defaultTrailId && !recipes.some((recipe) => recipe.id === trail.id)) {
        recipes.push(trail);
      }
    }
    return recipes;
  }

  function skinLockerRecipeById(id) {
    return skinLockerRecipes().find((skin) => skin.id === id) || null;
  }

  function allBuildMenuRecipes() {
    const recipes = buildRecipes.slice();
    recipes.push(...skinLockerRecipes());
    return recipes;
  }

  function skinRecipeActionText(recipe) {
    if (!isSkinStoreRuntime()) {
      return "Unavailable";
    }
    if (skinPurchasePendingId === recipe.id) {
      return "Opening...";
    }
    if (hasSkin(recipe.id)) {
      return isSkinEquipped(recipe.id) ? "Equipped" : "Equip";
    }
    if (!isAccountSignedIn() || accountState.waiLinked !== true) {
      return "Log in";
    }
    if (!isSkinAvailableNow(recipe)) {
      return skinAvailabilityStatus(recipe).message || "Unavailable";
    }
    if (recipe.freeClaim) {
      return "Claim";
    }
    return "Buy " + (recipe.priceLabel || "skin");
  }

  function skinLockerActionText(recipe) {
    if (!isSkinStoreRuntime()) {
      return "Unavailable";
    }
    const defaultItemId = defaultSkinIdForItem(recipe);
    if (skinPurchasePendingId === recipe.id || (recipe.id === defaultItemId && skinPurchasePendingId)) {
      return "Updating...";
    }
    if (isSkinEquipped(recipe.id)) {
      return recipe.id === defaultItemId ? "Equipped" : "Unequip";
    }
    return "Equip";
  }

  function isSkinRecipeActionAvailable(recipe) {
    if (!isSkinStoreRuntime()) {
      return false;
    }
    if (skinPurchasePendingId) {
      return false;
    }
    if (hasSkin(recipe.id)) {
      return !isSkinEquipped(recipe.id);
    }
    if (!isAccountSignedIn() || accountState.waiLinked !== true) {
      return true;
    }
    if (!isSkinAvailableNow(recipe)) {
      return false;
    }
    if (recipe.freeClaim) {
      return true;
    }
    return Boolean(recipe.priceId);
  }

  function isSkinLockerActionAvailable(recipe) {
    if (!isSkinStoreRuntime() || !hasSkin(recipe && recipe.id) || skinPurchasePendingId) {
      return false;
    }
    if (isSkinEquipped(recipe.id)) {
      return recipe.id !== defaultSkinIdForItem(recipe);
    }
    return true;
  }

