  function resetMobBossWarnings() {
    for (const kind of mobTierOrder) {
      mobBossWarnings[kind].active = false;
      mobBossWarnings[kind].timer = 0;
      mobBossWarnings[kind].lastNoticeSecond = -1;
    }
  }

  function normalizeProjectileSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextRivalProjectileId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 5),
      length: finiteOr(snapshot.length, 40),
      color: normalizeColorSnapshot(snapshot.color, { r: 114, g: 244, b: 255 }),
      life: finiteOr(snapshot.life, 1),
      maxLife: finiteOr(snapshot.maxLife, 2.2),
      damage: finiteOr(snapshot.damage, rivalProjectileDamage),
      ownerPlayerId: String(snapshot.ownerPlayerId || ""),
      knockback: finiteOr(snapshot.knockback, 0),
      toolDisable: finiteOr(snapshot.toolDisable, 0),
      cause: typeof snapshot.cause === "string" ? snapshot.cause : "",
      team: snapshot.team === "player" ? "player" : "",
      sourcePlayerId: typeof snapshot.sourcePlayerId === "string" ? snapshot.sourcePlayerId : "",
      sourceStructureId: typeof snapshot.sourceStructureId === "string" ? snapshot.sourceStructureId : "",
      sourceMobId: Math.max(0, Math.floor(finiteOr(snapshot.sourceMobId, 0))),
      weaponLabel: typeof snapshot.weaponLabel === "string" ? snapshot.weaponLabel : "",
      piercesMobs: Boolean(snapshot.piercesMobs),
      hitMobIds: Array.isArray(snapshot.hitMobIds) ? snapshot.hitMobIds.map(String) : [],
      ignoredBodyId: Number.isFinite(Number(snapshot.ignoredBodyId)) ? Number(snapshot.ignoredBodyId) : null,
      lightning: Boolean(snapshot.lightning),
      rocket: Boolean(snapshot.rocket),
      heatSeeking: Boolean(snapshot.heatSeeking),
      targetSpeed: finiteOr(snapshot.targetSpeed, 0),
      turnRate: finiteOr(snapshot.turnRate, 0)
    };
  }
