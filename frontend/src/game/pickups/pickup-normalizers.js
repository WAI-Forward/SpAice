  function normalizeTechPickupSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const tech = techTypes.find((candidate) => candidate.key === snapshot.key) || techTypes[0];
    const id = Math.max(1, Math.floor(finiteOr(snapshot.id, nextTechPickupId)));
    if (multiplayer.claimedTechPickupIds.has(String(id))) {
      return null;
    }

    return {
      id,
      key: tech.key,
      label: tech.label,
      color: tech.color,
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 15),
      life: clamp(finiteOr(snapshot.life, techPickupLifetime), 0, techPickupLifetime),
      maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, techPickupLifetime)),
      rotation: finiteOr(snapshot.rotation, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeHealthPickupSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextHealthPickupId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 14),
      heal: clamp(finiteOr(snapshot.heal, healthPickupHeal), 1, 100),
      life: clamp(finiteOr(snapshot.life, healthPickupLifetime), 0, healthPickupLifetime),
      maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, healthPickupLifetime)),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function normalizeStarSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      r: finiteOr(snapshot.r, 1),
      a: clamp(finiteOr(snapshot.a, 0.4), 0, 1)
    };
  }

  function normalizeColorSnapshot(snapshot, fallback) {
    if (!snapshot || typeof snapshot !== "object") {
      return fallback;
    }

    return {
      r: clamp(Math.round(finiteOr(snapshot.r, fallback.r)), 0, 255),
      g: clamp(Math.round(finiteOr(snapshot.g, fallback.g)), 0, 255),
      b: clamp(Math.round(finiteOr(snapshot.b, fallback.b)), 0, 255)
    };
  }

  function normalizeLandingSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      bridgeId: Math.max(0, Math.floor(finiteOr(snapshot.bridgeId, 0))),
      bridgeT: Math.max(0, finiteOr(snapshot.bridgeT, 0)),
      bridgeSide: finiteOr(snapshot.bridgeSide, 1) < 0 ? -1 : 1,
      bridgeInputSign: finiteOr(snapshot.bridgeInputSign, 1) < 0 ? -1 : 1,
      angle: finiteOr(snapshot.angle, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      walkCycle: finiteOr(snapshot.walkCycle, 0)
    };
  }
