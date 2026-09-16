  function setClusternautsTestTechPickups(list) {
    techPickups.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const pickup = normalizeTechPickupSnapshot(entry);
      if (pickup) {
        techPickups.push(pickup);
      }
    }
    nextTechPickupId = Math.max(
      nextTechPickupId,
      techPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );
    return techPickups.map(serializeTechPickup);
  }

  function setClusternautsTestHealthPickups(list) {
    healthPickups.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const pickup = normalizeHealthPickupSnapshot(entry);
      if (pickup) {
        healthPickups.push(pickup);
      }
    }
    nextHealthPickupId = Math.max(
      nextHealthPickupId,
      healthPickups.reduce((largest, pickup) => Math.max(largest, finiteOr(pickup.id, 0) + 1), 1)
    );
    return healthPickups.map(serializeHealthPickup);
  }

  function setClusternautsTestTeslas(list) {
    teslas.length = 0;
    for (const entry of Array.isArray(list) ? list : []) {
      const tesla = normalizeTeslaSnapshot(entry);
      if (tesla) {
        teslas.push(tesla);
      }
    }
    nextTeslaId = Math.max(
      nextTeslaId,
      teslas.reduce((largest, tesla) => Math.max(largest, finiteOr(tesla.id, 0) + 1), 1)
    );
    return teslas.map(serializeTesla);
  }

  function createClusternautsTestPartyState(config) {
    const source = config || {};
    const actor = source.actor && typeof source.actor === "object"
      ? {
          id: String(source.playerId || source.actor.id || "remote-player"),
          x: finiteOr(source.actor.x, 0),
          y: finiteOr(source.actor.y, 0),
          vx: finiteOr(source.actor.vx, 0),
          vy: finiteOr(source.actor.vy, 0),
          radius: finiteOr(source.actor.radius, player.radius),
          equippedTool: defaultToolId,
          toolMode: source.mode || "pull",
          energy: finiteOr(source.actor.energy, 100),
          landed: normalizeLandingSnapshot(source.actor.landed),
          aimAngle: finiteOr(source.actor.aimAngle, 0)
        }
      : {
          id: String(source.playerId || "remote-player"),
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: player.radius,
          equippedTool: defaultToolId,
          toolMode: source.mode || "pull",
          energy: 100,
          landed: null,
          aimAngle: finiteOr(source.aimAngle, 0)
        };
    const aimWorld = normalize(Math.cos(finiteOr(source.aimAngle, actor.aimAngle)), Math.sin(finiteOr(source.aimAngle, actor.aimAngle)));
    return {
      playerId: actor.id,
      seq: Math.max(0, Math.floor(finiteOr(source.seq, 0))),
      sentAt: finiteOr(source.sentAt, performance.now()),
      receivedAt: performance.now() - Math.max(0, finiteOr(source.receivedAgoMs, 0)),
      actor,
      aimWorld,
      funnel: actorFunnel(actor, aimWorld),
      left: source.mode !== "push" && source.mode !== "hold",
      middle: source.mode === "hold",
      right: source.mode === "push",
      active: source.active !== false,
      suckFactor: finiteOr(source.suckFactor, 1),
      blowFactor: finiteOr(source.blowFactor, 1),
      bucketActive: source.bucketActive !== false,
      bucketPadding: finiteOr(source.bucketPadding, 0),
      landedBodyId: Math.max(0, Math.floor(finiteOr(source.landedBodyId, actor.landed ? actor.landed.bodyId : 0))),
      mode: source.mode || "pull"
    };
  }
