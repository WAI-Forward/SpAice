  function skinStoreStatusText() {
    if (!isSkinStoreRuntime()) {
      return "Store purchases are not available on this build.";
    }
    if (skinStatusMessage) {
      return skinStatusMessage;
    }
    if (!isAccountSignedIn() || accountState.waiLinked !== true) {
      return skinLoginPromptMessage();
    }
    return (accountState.displayName || accountState.username || skinLoginLabel()) + " - " + ownedStoreItemCount() + "/" + paidSkinCount() + " store items owned";
  }

  function skinStoreMetaText(skin) {
    if (isTrailSkin(skin)) {
      return skin && skin.id === defaultTrailId ? "Default boost trail" : "Boost trail effect";
    }
    if (skin && skin.kind === "costume") {
      return "Full character costume";
    }
    return ((skin && skin.plainColor) || "Custom") + " suit recolour";
  }

  function skinStoreTypeText(skin) {
    if (isTrailSkin(skin)) {
      return "Trail";
    }
    return skin && skin.kind === "costume" ? "Costume" : "Suit skin";
  }

  function storePreviewSkin() {
    return skinById(storePreviewSkinId) || skinById(activeSkinId()) || skinById(defaultSkinId);
  }

  function stopStorePreviewAnimation() {
    if (!storePreviewAnimationFrameId || typeof window === "undefined" || typeof window.cancelAnimationFrame !== "function") {
      storePreviewAnimationFrameId = 0;
      return;
    }
    window.cancelAnimationFrame(storePreviewAnimationFrameId);
    storePreviewAnimationFrameId = 0;
  }

  function shouldAnimateStorePreview() {
    const skin = storePreviewSkin();
    return Boolean(startMenu.view === "store" && startStorePreviewCanvas && isTrailSkin(skin));
  }

  function scheduleStorePreviewAnimation() {
    if (!shouldAnimateStorePreview()) {
      stopStorePreviewAnimation();
      return;
    }
    if (storePreviewAnimationFrameId || typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      return;
    }
    storePreviewAnimationFrameId = window.requestAnimationFrame(function animateStorePreview() {
      storePreviewAnimationFrameId = 0;
      if (!shouldAnimateStorePreview()) {
        return;
      }
      drawStorePreviewCharacter(storePreviewSkin());
      scheduleStorePreviewAnimation();
    });
  }

  function drawStorePreviewCharacter(skin) {
    if (!startStorePreviewCanvas) {
      return;
    }

    const previewCtx = startStorePreviewCanvas.getContext("2d");
    if (!previewCtx) {
      return;
    }

    const width = startStorePreviewCanvas.width || 180;
    const height = startStorePreviewCanvas.height || 220;
    const isTrailPreview = isTrailSkin(skin);
    const renderWidth = isTrailPreview ? Math.round(width * 2) : width;
    const renderHeight = isTrailPreview ? Math.round(height * 1.55) : height;
    const renderCanvas = isTrailPreview && typeof document !== "undefined" && typeof document.createElement === "function"
      ? document.createElement("canvas")
      : startStorePreviewCanvas;
    const renderCtx = renderCanvas === startStorePreviewCanvas ? previewCtx : renderCanvas.getContext("2d");
    if (!renderCtx) {
      return;
    }
    renderCanvas.width = renderWidth;
    renderCanvas.height = renderHeight;
    const centerX = renderWidth * 0.5;
    const swatchColors = skinSwatchColors(skin);

    renderCtx.clearRect(0, 0, renderWidth, renderHeight);

    const glow = renderCtx.createRadialGradient(centerX, renderHeight * 0.5, 8, centerX, renderHeight * 0.5, isTrailPreview ? 122 : 88);
    glow.addColorStop(0, previewColorWithAlpha(swatchColors.accent, 0.22));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    renderCtx.fillStyle = glow;
    renderCtx.fillRect(0, 0, renderWidth, renderHeight);

    renderCtx.save();
    if (isTrailPreview) {
      drawSkinPreviewAstronaut(renderCtx, renderWidth, renderHeight, activeSkinId(), {
        trailId: skin.id,
        onFoot: false,
        bodyRotation: 0,
        exhaust: { x: -0.48, y: 0.88 },
        centerX: centerX + renderWidth * 0.14,
        centerY: renderHeight * 0.35
      });
    } else {
      drawSkinPreviewAstronaut(renderCtx, width, height, skin && skin.id);
    }
    renderCtx.restore();

    if (renderCanvas !== startStorePreviewCanvas) {
      previewCtx.clearRect(0, 0, width, height);
      const sourceX = Math.round(renderWidth * 0.05);
      const sourceY = Math.round(renderHeight * 0.01);
      const sourceWidth = Math.round(renderWidth * 0.82);
      const sourceHeight = Math.round(renderHeight * 0.94);
      previewCtx.drawImage(renderCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
    }
  }

  function previewColorWithAlpha(color, alpha) {
    if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) {
      return "rgba(100, 227, 255, " + alpha + ")";
    }
    const value = parseInt(color.slice(1), 16);
    return "rgba(" + ((value >> 16) & 255) + ", " + ((value >> 8) & 255) + ", " + (value & 255) + ", " + alpha + ")";
  }

  function renderSkinStorePreview() {
    const skin = storePreviewSkin();
    if (!skin) {
      return;
    }
    drawStorePreviewCharacter(skin);
    scheduleStorePreviewAnimation();
    if (startStorePreviewName) {
      startStorePreviewName.textContent = skin.name || "Classic Suit";
    }
    if (startStorePreviewMeta) {
      startStorePreviewMeta.textContent = skinStoreMetaText(skin);
    }
  }

  function setStorePreviewSkin(id) {
    const skin = skinById(id);
    if (!skin) {
      return;
    }
    storePreviewSkinId = skin.id;
    renderSkinStorePreview();
    if (startStoreList) {
      startStoreList.querySelectorAll("[data-store-skin-id]").forEach((card) => {
        card.classList.toggle("is-previewed", card.dataset.storeSkinId === storePreviewSkinId);
      });
    }
  }

  function isValidStoreFilterKey(filterKey) {
    return storeFilterDefinitions.some((filter) => filter.key === filterKey);
  }

  function isStoreFilterActive(filterKey) {
    return activeStoreFilters.has(filterKey);
  }

  function toggleStoreFilter(filterKey) {
    if (!isValidStoreFilterKey(filterKey)) {
      return;
    }
    if (activeStoreFilters.has(filterKey)) {
      activeStoreFilters.delete(filterKey);
    } else {
      activeStoreFilters.add(filterKey);
    }
    renderSkinStore();
  }

  function shouldShowSkinForActiveStoreFilters(skin) {
    return isStoreFilterActive(storeFilterKeyForSkin(skin));
  }

  function visibleStoreSkins() {
    return skinCatalog.filter((skin) => (
      skin &&
      (!isDefaultSkinItem(skin) && !skin.priceId ? false : shouldShowSkinInStore(skin)) &&
      shouldShowSkinForActiveStoreFilters(skin)
    ));
  }

  function renderStoreFilterControls() {
    if (!startStoreFilters) {
      return;
    }

    startStoreFilters.querySelectorAll("[data-store-filter]").forEach((button) => {
      const filterKey = button.dataset.storeFilter || "";
      const active = isStoreFilterActive(filterKey);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function createSkinStoreCard(skin) {
    const card = document.createElement("article");
    const swatch = document.createElement("span");
    const summary = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("span");
    const status = document.createElement("span");
    const action = document.createElement("button");
    const swatchColors = skinSwatchColors(skin);
    const owned = hasSkin(skin.id);
    const equipped = isSkinEquipped(skin.id);

    card.className = "start-store__card";
    card.tabIndex = 0;
    card.dataset.storeSkinId = skin.id;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Preview " + skin.name);
    card.classList.toggle("is-owned", owned);
    card.classList.toggle("is-equipped", equipped);
    card.classList.toggle("is-locked", !owned);
    card.classList.toggle("is-previewed", skin.id === (storePreviewSkin() && storePreviewSkin().id));

    swatch.className = "start-store__swatch";
    swatch.style.setProperty("--skin-color", swatchColors.color);
    swatch.style.setProperty("--skin-accent", swatchColors.accent);
    swatch.setAttribute("aria-hidden", "true");

    summary.className = "start-store__summary";
    name.className = "start-store__name";
    meta.className = "start-store__meta";
    status.className = "start-store__status-pill";
    action.className = "settings-panel__save-action start-store__action";

    name.textContent = skin.name;
    meta.textContent = skinStoreMetaText(skin);
    status.textContent = equipped ? "Equipped" : owned ? "Owned" : skin.priceLabel || "Included";

    action.type = "button";
    action.dataset.menuAction = owned ? "equip-skin" : "buy-skin";
    action.dataset.skinId = skin.id;
    action.textContent = skinRecipeActionText(skin);
    action.disabled = !isSkinRecipeActionAvailable(skin);

    summary.append(name, meta, status);
    card.append(swatch, summary, action);
    return card;
  }

  function renderSkinStore() {
    if (!startStoreList || !startStoreStatus) {
      return;
    }

    startStoreStatus.textContent = skinStoreStatusText();
    startStoreStatus.classList.toggle("is-error", !isSkinStoreRuntime());
    startStoreList.textContent = "";
    renderStoreFilterControls();

    if (!isSkinStoreRuntime()) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = "Store purchases are not available on this build.";
      startStoreList.append(empty);
      return;
    }

    if (!skinById(storePreviewSkinId)) {
      storePreviewSkinId = activeSkinId();
    }
    renderSkinStorePreview();

    const storeSkins = visibleStoreSkins();
    if (!storeSkins.length) {
      const empty = document.createElement("p");
      empty.className = "start-menu__empty";
      empty.textContent = activeStoreFilters.size ? "No store items match these filters." : "Choose a category to show store items.";
      startStoreList.append(empty);
      return;
    }

    for (const skin of storeSkins) {
      startStoreList.append(createSkinStoreCard(skin));
    }
  }

