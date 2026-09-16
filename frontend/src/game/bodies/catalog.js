  const stellarEvolutionEndThreshold = 60000;
  const stellarGrowthAverageWindowSeconds = 8;
  const stellarGrowthRateNeutronThreshold = 80;
  const stellarGrowthRateBlackHoleThreshold = 220;
  const stellarOutcomeTierNames = ["white dwarf", "neutron star", "black hole"];
  const stellarBranchTiers = [
    { name: "white dwarf", threshold: stellarEvolutionEndThreshold, article: "a", solid: true },
    { name: "neutron star", threshold: stellarEvolutionEndThreshold, article: "a", solid: true },
    { name: "black hole", threshold: stellarEvolutionEndThreshold, article: "a", solid: true }
  ];
  const bodyTiers = [
    { name: "particle", threshold: 0, article: "a", solid: false },
    { name: "rock", threshold: 10, article: "a", solid: false },
    { name: "boulder", threshold: 50, article: "a", solid: true },
    { name: "asteroid", threshold: 150, article: "an", solid: true },
    { name: "moon", threshold: 1500, article: "a", solid: true },
    { name: "planet", threshold: 7500, article: "a", solid: true },
    { name: "star", threshold: 30000, article: "a", solid: true }
  ];
  const celestialBodyRadii = {
    particle: 11,
    rock: 22,
    boulder: 36,
    asteroid: 52,
    moon: 110,
    planet: 158,
    star: 224,
    "white dwarf": 188,
    "neutron star": 176,
    "black hole": 204
  };
  const bodyTierEvolutionSizeScale = 1.2;
  const celestialBodyBlueprints = bodyTiers.concat(stellarBranchTiers).reduce(function (blueprints, tier) {
    blueprints[tier.name] = {
      name: tier.name,
      threshold: tier.threshold,
      article: tier.article,
      solid: tier.solid,
      radius: celestialBodyRadii[tier.name] || 11
    };
    return blueprints;
  }, Object.create(null));
