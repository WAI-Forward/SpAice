  function activateSkinRecipe(recipe) {
    if (!isSkinRecipe(recipe) || !isSkinStoreRuntime()) {
      return;
    }

    if (hasSkin(recipe.id)) {
      const defaultItemId = defaultSkinIdForItem(recipe);
      const targetSkinId = isSkinEquipped(recipe.id) && recipe.id !== defaultItemId ? defaultItemId : recipe.id;
      if (!isAccountSignedIn() || accountState.waiLinked !== true) {
        if (targetSkinId === defaultSkinId) {
          equippedSkinId = "";
          renderBuildMenu();
          renderSkinStore();
        } else if (targetSkinId === defaultTrailId) {
          equippedTrailId = "";
          renderBuildMenu();
          renderSkinStore();
        } else {
          skinStatusMessage = skinLoginPromptMessage();
          renderBuildMenu();
          renderSkinStore();
          // build:render:start
          openWaiLogin();
          // build:render:end
        }
        return;
      }

      // build:render:start
      void equipSkin(targetSkinId);
      // build:render:end
      return;
    }

    if (!isAccountSignedIn() || accountState.waiLinked !== true) {
      skinStatusMessage = skinLoginPromptMessage();
      renderBuildMenu();
      renderSkinStore();
      // build:render:start
      openWaiLogin();
      // build:render:end
      return;
    }

    if (!isSkinAvailableNow(recipe)) {
      skinStatusMessage = skinAvailabilityStatus(recipe).message || "This costume is not available right now.";
      renderBuildMenu();
      renderSkinStore();
      return;
    }

    // build:render:start
    if (recipe.freeClaim) {
      void claimFreeSkin(recipe.id);
    } else {
      void beginSkinCheckout(recipe.id);
    }
    // build:render:end
  }

  function refreshSkinEntitlements() {
    // build:render:start
    return refreshSkinEntitlementsFromServer();
    // build:render:end
    return Promise.resolve(null);
  }

  // build:render:start
  async function refreshSkinEntitlementsFromServer() {
    if (!isSkinStoreRuntime() || !isAccountSignedIn() || skinRefreshInFlight) {
      return null;
    }

    skinRefreshInFlight = true;
    try {
      const data = await fetchPersistentJson("/api/skins", {
        headers: accountAuthHeaders(),
        timeoutMs: 8000
      });
      if (data && data.account) {
        applySkinAccountState(data.account);
      }
      return data;
    } catch (error) {
      console.warn("Clusternauts skin entitlements unavailable.", error);
      skinStatusMessage = backendErrorMessage(error, "Store unavailable.");
      renderBuildMenu();
      renderSkinStore();
      return null;
    } finally {
      skinRefreshInFlight = false;
    }
  }

  async function equipSkin(skinId) {
    const cleanSkinId = normalizeSkinId(skinId);
    const skin = skinById(cleanSkinId);
    if (!cleanSkinId || !hasSkin(cleanSkinId) || isSkinEquipped(cleanSkinId) || skinPurchasePendingId) {
      return;
    }

    skinPurchasePendingId = cleanSkinId;
    skinStatusMessage = isTrailSkin(skin) ? "Equipping trail..." : "Equipping skin...";
    renderBuildMenu();
    renderSkinStore();
    try {
      const data = await fetchPersistentJson("/api/skins/equip", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ skinId: cleanSkinId }),
        timeoutMs: 8000
      });
      if (data && data.account) {
        applySkinAccountState(data.account);
      }
      skinStatusMessage = isTrailSkin(skin) ? "Trail equipped." : "Skin equipped.";
      maybeNotifyText((skin && skin.name ? skin.name : isTrailSkin(skin) ? "Trail" : "Skin") + " equipped.");
    } catch (error) {
      console.warn("Clusternauts skin equip failed.", error);
      skinStatusMessage = backendErrorMessage(error, isTrailSkin(skin) ? "Could not equip this trail." : "Could not equip this skin.");
      renderBuildMenu();
      renderSkinStore();
    } finally {
      skinPurchasePendingId = "";
      renderBuildMenu();
      renderSkinStore();
    }
  }

  async function beginSkinCheckout(skinId) {
    const cleanSkinId = normalizeSkinId(skinId);
    const skin = skinById(cleanSkinId);
    if (!skin || !skin.priceId || skinPurchasePendingId) {
      return;
    }

    skinPurchasePendingId = cleanSkinId;
    skinStatusMessage = "Opening secure checkout...";
    renderBuildMenu();
    renderSkinStore();
    try {
      const data = await fetchPersistentJson("/api/skins/checkout", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ skinId: cleanSkinId }),
        timeoutMs: 12000
      });
      if (data && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Checkout URL missing.");
    } catch (error) {
      console.warn("Clusternauts skin checkout failed.", error);
      skinStatusMessage = backendErrorMessage(error, "Could not open checkout.");
      skinPurchasePendingId = "";
      renderBuildMenu();
      renderSkinStore();
    }
  }

  async function claimFreeSkin(skinId) {
    const cleanSkinId = normalizeSkinId(skinId);
    const skin = skinById(cleanSkinId);
    if (!skin || !skin.freeClaim || skinPurchasePendingId) {
      return;
    }

    skinPurchasePendingId = cleanSkinId;
    skinStatusMessage = "Claiming costume...";
    renderBuildMenu();
    renderSkinStore();
    try {
      const data = await fetchPersistentJson("/api/skins/claim", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ skinId: cleanSkinId }),
        timeoutMs: 8000
      });
      if (data && data.account) {
        applySkinAccountState(data.account);
      }
      skinStatusMessage = "Costume claimed.";
      maybeNotifyText((skin.name || "Costume") + " unlocked.");
    } catch (error) {
      console.warn("Clusternauts skin claim failed.", error);
      skinStatusMessage = backendErrorMessage(error, "Could not claim this costume.");
      renderBuildMenu();
      renderSkinStore();
    } finally {
      skinPurchasePendingId = "";
      renderBuildMenu();
      renderSkinStore();
    }
  }

  function clearSkinCheckoutReturnParams() {
    if (!window.history || typeof window.history.replaceState !== "function") {
      return;
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("skin_checkout");
      url.searchParams.delete("skin");
      url.searchParams.delete("session_id");
      window.history.replaceState(window.history.state, document.title, url.pathname + url.search + url.hash);
    } catch {
      // URL cleanup is cosmetic; keeping the query string is harmless.
    }
  }

  async function handleSkinCheckoutReturn() {
    if (!isSkinStoreRuntime()) {
      return;
    }

    const outcome = readSearchParam("skin_checkout");
    if (!outcome) {
      return;
    }

    const skinId = normalizeSkinId(readSearchParam("skin"));
    const sessionId = String(readSearchParam("session_id") || "").trim();
    clearSkinCheckoutReturnParams();
    setDifficultyScreenOpen(true);
    setStartMenuView("store", { push: false });

    if (outcome === "cancel") {
      skinStatusMessage = "Checkout cancelled.";
      maybeNotifyText("Checkout cancelled.");
      renderBuildMenu();
      renderSkinStore();
      return;
    }

    if (outcome !== "success" || !sessionId || !isAccountSignedIn()) {
      skinStatusMessage = "Refresh store items after logging in.";
      renderBuildMenu();
      renderSkinStore();
      return;
    }

    skinPurchasePendingId = skinId;
    skinStatusMessage = "Confirming purchase...";
    renderBuildMenu();
    renderSkinStore();
    try {
      const data = await fetchPersistentJson("/api/skins/checkout/confirm", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ sessionId }),
        timeoutMs: 12000
      });
      if (data && data.account) {
        applySkinAccountState(data.account);
      }
      const confirmedSkin = data && data.skin ? data.skin : skinById(skinId);
      skinStatusMessage = "Purchase confirmed.";
      maybeNotifyText((confirmedSkin && confirmedSkin.name ? confirmedSkin.name : "Item") + " unlocked.");
    } catch (error) {
      console.warn("Clusternauts skin purchase confirmation failed.", error);
      skinStatusMessage = backendErrorMessage(error, "Purchase confirmation pending.");
      void refreshSkinEntitlements();
    } finally {
      skinPurchasePendingId = "";
      renderBuildMenu();
      renderSkinStore();
    }
  }
  // build:render:end

