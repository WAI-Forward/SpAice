  function updateHordeMobSpawns(state, world, players, dt, seedHolder) {
    updateMobBeacons(state, players, dt, seedHolder);
    updateMobBossWarnings(state, players, dt, seedHolder);
    if (updateMobSpawnRest(world, players, dt)) {
      return;
    }

    world.mobWaveTimer = finiteOr(world.mobWaveTimer, difficultyMobWaveInterval(state)) - dt;
    while (world.mobWaveTimer <= 0) {
      const slots = buildMobWaveSlots(state, world, rollMobWaveSize(state, world, players, seedHolder), players, seedHolder);
      if (slots.length) {
        const spawnedKinds = spawnMobWave(state, slots, players, seedHolder);
        for (const kind of spawnedKinds) {
          maybeScheduleMobBoss(state, kind, seedHolder);
        }
        world.mobWaveCount = Math.max(0, Math.floor(finiteOr(world.mobWaveCount, 0))) + 1;
      }
      world.mobWaveTimer += mobWaveIntervalWithBossPressure(state);
    }
  }
