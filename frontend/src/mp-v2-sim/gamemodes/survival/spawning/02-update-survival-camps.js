  function updateSurvivalAllowanceMobSpawns(state, world, players, dt, seedHolder) {
    void dt;
    void players;
    world.mobWaveTimer = difficultyMobWaveInterval(state);
    world.mobBeacons = [];
    const survivalPlayers = activeSurvivalSpawnPlayers(state);
    if (!survivalPlayers.length) {
      return;
    }
    updateSurvivalAllowanceCamps(state, survivalPlayers, seedHolder);
  }
