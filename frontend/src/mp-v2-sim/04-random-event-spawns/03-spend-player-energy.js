  function spendPlayerEnergy(player, amount) {
    const cost = Math.max(0, finiteOr(amount, 0));
    if (!canSpendPlayerEnergy(player, cost)) {
      return false;
    }
    player.energy = Math.max(0, finiteOr(player.energy, 0) - cost);
    return true;
  }

  function gadgetEnergyCost(dt) {
    return SUCTION_ENERGY_DRAIN * Math.max(0, finiteOr(dt, TICK_DT));
  }

  function continuousEnergyActivationCost(cost) {
    return Math.max(PLAYER_CONTINUOUS_ENERGY_ACTIVATION_COST, Math.max(0, finiteOr(cost, 0)));
  }

  function boostEnergyCost(dt) {
    return JETPACK_BOOST_ENERGY_DRAIN * Math.max(0, finiteOr(dt, TICK_DT));
  }

  function normalizeDuelPairKey(a, b) {
    const first = String(a || "");
    const second = String(b || "");
    if (!first || !second || first === second) {
      return "";
    }
    return [first, second].sort().join("|");
  }
