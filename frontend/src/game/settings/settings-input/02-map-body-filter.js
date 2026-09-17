  function normalizeMapBodyTierFilterName(name, fallback) {
    const raw = String(name || "").trim().toLowerCase();
    if (raw === "auto") {
      return fallback;
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
    return normalizeMapBodyTierFilterName(name, "rock");
  }

  function normalizeMapMaximumBodyTierName(name) {
    return normalizeMapBodyTierFilterName(name, "star");
  }

  function mapMinimumBodyThreshold() {
    const tierName = normalizeMapMinimumBodyTierName(gameSettings.mapMinimumBodyTier);
    const tier = bodyTiers.find((candidate) => candidate.name === tierName);
    return tier ? tier.threshold : mappedBodyThreshold;
  }

  function mapMaximumBodyThreshold() {
    const tierName = normalizeMapMaximumBodyTierName(gameSettings.mapMaximumBodyTier);
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
