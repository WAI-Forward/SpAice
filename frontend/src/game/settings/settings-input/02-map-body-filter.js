  function normalizeMapBodyTierFilterName(name, fallback) {
    const raw = String(name || "").trim().toLowerCase();
    if (raw === "auto") {
      return "auto";
    }
    const normalized = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
    const tier = bodyTiers.find((candidate) => candidate.name === normalized);
    return tier && tier.threshold >= mappedBodyThreshold ? tier.name : fallback;
  }

  function normalizeMapMinimumBodyTierName(name) {
    return normalizeMapBodyTierFilterName(name, "auto");
  }

  function normalizeMapMaximumBodyTierName(name) {
    return normalizeMapBodyTierFilterName(name, "auto");
  }

  function mapMinimumBodyThreshold() {
    const tierName = normalizeMapMinimumBodyTierName(gameSettings.mapMinimumBodyTier);
    if (tierName === "auto") {
      return mappedBodyThreshold;
    }
    const tier = bodyTiers.find((candidate) => candidate.name === tierName);
    return tier ? tier.threshold : mappedBodyThreshold;
  }

  function currentPlayerBodyTierIndex() {
    if (!player.landed || !player.landed.bodyId) {
      return -1;
    }
    const body = bodyById(player.landed.bodyId);
    const tierName = body && body.tier && body.tier.name;
    return bodyTiers.findIndex((candidate) => candidate.name === tierName);
  }

  function mapMaximumBodyThreshold() {
    const tierName = normalizeMapMaximumBodyTierName(gameSettings.mapMaximumBodyTier);
    if (tierName === "auto") {
      const bodyTierIndex = currentPlayerBodyTierIndex();
      const previousTier = bodyTierIndex > 0 ? bodyTiers[bodyTierIndex - 1] : null;
      return previousTier ? previousTier.threshold : Number.POSITIVE_INFINITY;
    }
    const tier = bodyTiers.find((candidate) => candidate.name === tierName);
    return tier ? tier.threshold : Number.POSITIVE_INFINITY;
  }

  function isBodyVisibleOnMap(body) {
    if (!body || !body.tier) {
      return false;
    }
    const threshold = body.tier.threshold;
    return threshold >= mapMinimumBodyThreshold() && threshold <= mapMaximumBodyThreshold();
  }

  function syncMapMinimumBodyFilter() {
    gameSettings.mapMinimumBodyTier = normalizeMapMinimumBodyTierName(gameSettings.mapMinimumBodyTier);
    gameSettings.mapMaximumBodyTier = normalizeMapMaximumBodyTierName(gameSettings.mapMaximumBodyTier);
    if (mapMinimumBodyFilter) {
      mapMinimumBodyFilter.value = gameSettings.mapMinimumBodyTier;
    }
    if (mapMaximumBodyFilter) {
      mapMaximumBodyFilter.value = gameSettings.mapMaximumBodyTier;
    }
    invalidateRenderCaches();
  }

  function setMapMinimumBodyTier(name) {
    const nextTier = normalizeMapMinimumBodyTierName(name);
    if (gameSettings.mapMinimumBodyTier !== nextTier) {
      gameSettings.mapMinimumBodyTier = nextTier;
      writeGameSettings();
    }
    syncMapMinimumBodyFilter();
  }

  function setMapMaximumBodyTier(name) {
    const nextTier = normalizeMapMaximumBodyTierName(name);
    if (gameSettings.mapMaximumBodyTier !== nextTier) {
      gameSettings.mapMaximumBodyTier = nextTier;
      writeGameSettings();
    }
    syncMapMinimumBodyFilter();
  }
