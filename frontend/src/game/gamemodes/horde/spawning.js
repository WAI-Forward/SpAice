  function updateHordeMobSpawns(dt, anchors) {
    updateMobBeacons(dt, anchors);
    updateMobBossWarnings(dt, anchors);
    if (updateMobSpawnRest(dt, anchors)) {
      return;
    }

    mobWaveTimer -= dt;
    while (mobWaveTimer <= 0) {
      const slots = buildMobWaveSlots(rollMobWaveSize(anchors), anchors);
      if (slots.length) {
        const spawnedKinds = spawnMobWave(slots, anchors);
        for (const kind of spawnedKinds) {
          maybeScheduleMobBoss(kind);
        }
        mobWaveCount += 1;
      }
      mobWaveTimer += mobWaveIntervalWithBossPressure();
    }
  }
