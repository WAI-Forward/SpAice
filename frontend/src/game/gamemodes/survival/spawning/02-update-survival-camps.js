  function updateSurvivalAllowanceMobSpawns(dt, anchors) {
    void dt;
    void anchors;
    mobWaveTimer = difficultyMobWaveInterval();
    mobBeacons.length = 0;
    const players = activeSurvivalSpawnPlayers();
    if (!players.length) {
      return;
    }
    const nowSeconds = Math.max(0, (performance.now() - lifeStats.startedAt) / 1000);
    updateSurvivalAllowanceCamps(nowSeconds, players);
  }
