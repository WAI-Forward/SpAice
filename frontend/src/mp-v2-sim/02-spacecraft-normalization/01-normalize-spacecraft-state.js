  function normalizeSpacecraftState(source, fallbackId) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const id = Math.max(1, Math.floor(finiteOr(source.id, fallbackId || 1)));
    const npcs = Array.isArray(source.npcs) && source.npcs.length
      ? source.npcs.map(normalizeSpacecraftNpcState).filter(Boolean)
      : [normalizeSpacecraftNpcState(null)];
    return {
      id,
      kind: "spacecraft",
      blueprintId: String(source.blueprintId || ROGUE_TRADER_SPACECRAFT.blueprintId),
      name: String(source.name || ROGUE_TRADER_SPACECRAFT.name),
      x: finiteOr(source.x, 0),
      y: finiteOr(source.y, 0),
      vx: finiteOr(source.vx, 0),
      vy: finiteOr(source.vy, 0),
      eventId: String(source.eventId || ""),
      rotation: finiteOr(source.rotation, 0),
      width: Math.max(1, finiteOr(source.width, ROGUE_TRADER_SPACECRAFT.width)),
      height: Math.max(1, finiteOr(source.height, ROGUE_TRADER_SPACECRAFT.height)),
      door: source.door && typeof source.door === "object" ? { ...ROGUE_TRADER_SPACECRAFT_DOOR, ...clone(source.door) } : { ...ROGUE_TRADER_SPACECRAFT_DOOR },
      components: Array.isArray(source.components) && source.components.length
        ? source.components.map(normalizeSpacecraftComponentState).filter(Boolean)
        : ROGUE_TRADER_SPACECRAFT_COMPONENTS.map(normalizeSpacecraftComponentState),
      npcs
    };
  }

  function serializeSpacecraftState(craft) {
    const normalized = normalizeSpacecraftState(craft, craft && craft.id);
    return normalized ? {
      id: normalized.id,
      blueprintId: normalized.blueprintId,
      name: normalized.name,
      x: normalized.x,
      y: normalized.y,
      vx: normalized.vx,
      vy: normalized.vy,
      eventId: normalized.eventId,
      rotation: normalized.rotation,
      width: normalized.width,
      height: normalized.height,
      door: clone(normalized.door),
      components: Array.isArray(normalized.components) ? clone(normalized.components) : [],
      npcs: normalized.npcs.map((npc) => ({ ...npc }))
    } : null;
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function hashSeed(value) {
    const text = String(value || "clusternauts-v2");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function nextRandom(seedHolder) {
    let seed = seedHolder.seed >>> 0;
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
    seedHolder.seed = seed >>> 0;
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  }

  function randomRange(seedHolder, min, max) {
    return min + (max - min) * nextRandom(seedHolder);
  }

  function seededRange(seed, min, max) {
    const seedHolder = { seed: seed >>> 0 };
    return {
      value: randomRange(seedHolder, min, max),
      seed: seedHolder.seed >>> 0
    };
  }

  function tierForMass(mass) {
    let tier = BODY_TIERS[0];
    for (const candidate of BODY_TIERS) {
      if (mass >= candidate.threshold) {
        tier = candidate;
      }
    }
    return tier;
  }

  function normalizedStellarOutcomeName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    return STELLAR_OUTCOME_TIER_NAMES.includes(normalized) ? normalized : "";
  }

  function stellarOutcomeForGrowthRate(rate) {
    const growthRate = Math.max(0, finiteOr(rate, 0));
    if (growthRate >= STELLAR_GROWTH_RATE_BLACK_HOLE_THRESHOLD) {
      return "black hole";
    }
    if (growthRate >= STELLAR_GROWTH_RATE_NEUTRON_THRESHOLD) {
      return "neutron star";
    }
    return "white dwarf";
  }

  function tierForStellarOutcome(outcome) {
    const normalized = normalizedStellarOutcomeName(outcome) || "white dwarf";
    return STELLAR_BRANCH_TIERS.find((candidate) => candidate.name === normalized) || STELLAR_BRANCH_TIERS[0];
  }

  function tierForMassAndStellarOutcome(mass, outcome) {
    if (mass >= STELLAR_EVOLUTION_END_THRESHOLD) {
      return tierForStellarOutcome(outcome);
    }
    return tierForMass(mass);
  }

  function radiusAtTier(tier) {
    const radii = {
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
    return radii[tier.name] || 11;
  }

  function radiusFromMass(mass) {
    const tier = tierForMass(mass);
    return radiusFromMassForTier(mass, tier);
  }

  function radiusFromMassForTier(mass, tier) {
    const tierIndex = BODY_TIERS.indexOf(tier);
    const nameIndex = tierIndex < 0 && tier && tier.name
      ? BODY_TIERS.findIndex((candidate) => candidate.name === tier.name)
      : tierIndex;
    const nextTier = nameIndex >= 0 ? BODY_TIERS[nameIndex + 1] || null : null;

    if (!nextTier) {
      return radiusAtTier(tier) + Math.log2(Math.max(1, mass / tier.threshold)) * 22;
    }

    const startRadius = radiusAtTier(tier);
    const endRadius = radiusAtTier(nextTier) - 3;
    const progress = clamp((mass - tier.threshold) / (nextTier.threshold - tier.threshold), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 1.8);
    return startRadius + (endRadius - startRadius) * eased;
  }

  function normalizeColor(source, fallback) {
    const color = source && typeof source === "object" ? source : fallback || {};
    return {
      r: Math.round(clamp(color.r, 0, 255)),
      g: Math.round(clamp(color.g, 0, 255)),
      b: Math.round(clamp(color.b, 0, 255))
    };
  }

  function mixColor(a, b, aw, bw) {
    const first = normalizeColor(a, { r: 255, g: 255, b: 255 });
    const second = normalizeColor(b, first);
    const firstWeight = Math.max(0, finiteOr(aw, 0));
    const secondWeight = Math.max(0, finiteOr(bw, 0));
    const total = Math.max(0.000001, firstWeight + secondWeight);
    return {
      r: Math.round((first.r * firstWeight + second.r * secondWeight) / total),
      g: Math.round((first.g * firstWeight + second.g * secondWeight) / total),
      b: Math.round((first.b * firstWeight + second.b * secondWeight) / total)
    };
  }

  function shadeColor(color, amount) {
    const source = normalizeColor(color, { r: 255, g: 255, b: 255 });
    return {
      r: clamp(source.r + amount, 0, 255),
      g: clamp(source.g + amount, 0, 255),
      b: clamp(source.b + amount, 0, 255)
    };
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lenSq = abx * abx + aby * aby;
    if (lenSq <= 0.000001) {
      return Math.hypot(px - ax, py - ay);
    }
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }

  function distanceBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
    function orientation(px, py, qx, qy, rx, ry) {
      const value = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
      if (Math.abs(value) < 0.000001) {
        return 0;
      }
      return value > 0 ? 1 : 2;
    }

    function onSegment(px, py, qx, qy, rx, ry) {
      return qx <= Math.max(px, rx) + 0.000001 &&
        qx + 0.000001 >= Math.min(px, rx) &&
        qy <= Math.max(py, ry) + 0.000001 &&
        qy + 0.000001 >= Math.min(py, ry);
    }

    const o1 = orientation(ax, ay, bx, by, cx, cy);
    const o2 = orientation(ax, ay, bx, by, dx, dy);
    const o3 = orientation(cx, cy, dx, dy, ax, ay);
    const o4 = orientation(cx, cy, dx, dy, bx, by);

    if (
      (o1 !== o2 && o3 !== o4) ||
      (o1 === 0 && onSegment(ax, ay, cx, cy, bx, by)) ||
      (o2 === 0 && onSegment(ax, ay, dx, dy, bx, by)) ||
      (o3 === 0 && onSegment(cx, cy, ax, ay, dx, dy)) ||
      (o4 === 0 && onSegment(cx, cy, bx, by, dx, dy))
    ) {
      return 0;
    }

    return Math.min(
      distanceToSegment(ax, ay, cx, cy, dx, dy),
      distanceToSegment(bx, by, cx, cy, dx, dy),
      distanceToSegment(cx, cy, ax, ay, bx, by),
      distanceToSegment(dx, dy, ax, ay, bx, by)
    );
  }

  function playerHurtboxSegment(targetPlayer) {
    const x = finiteOr(targetPlayer && targetPlayer.x, 0);
    const y = finiteOr(targetPlayer && targetPlayer.y, 0);
    let downX = 0;
    let downY = 1;

    if (targetPlayer && targetPlayer.landed && Number.isFinite(Number(targetPlayer.landed.angle))) {
      const angle = finiteOr(targetPlayer.landed.angle, 0) + Math.PI;
      downX = Math.cos(angle);
      downY = Math.sin(angle);
    } else if (targetPlayer && Number.isFinite(Number(targetPlayer.cameraRoll))) {
      const angle = finiteOr(targetPlayer.cameraRoll, 0) + Math.PI / 2;
      downX = Math.cos(angle);
      downY = Math.sin(angle);
    }

    return {
      ax: x + downX * PLAYER_HURTBOX_TOP_OFFSET,
      ay: y + downY * PLAYER_HURTBOX_TOP_OFFSET,
      bx: x + downX * PLAYER_HURTBOX_BOTTOM_OFFSET,
      by: y + downY * PLAYER_HURTBOX_BOTTOM_OFFSET
    };
  }

  function playerPickupSegment(targetPlayer) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    const x = finiteOr(targetPlayer && targetPlayer.x, 0);
    const y = finiteOr(targetPlayer && targetPlayer.y, 0);
    const segmentX = hurtbox.bx - hurtbox.ax;
    const segmentY = hurtbox.by - hurtbox.ay;
    const length = Math.hypot(segmentX, segmentY) || 1;
    const downX = segmentX / length;
    const downY = segmentY / length;

    return {
      ax: x + downX * PLAYER_PICKUP_TOP_OFFSET,
      ay: y + downY * PLAYER_PICKUP_TOP_OFFSET,
      bx: x + downX * PLAYER_PICKUP_BOTTOM_OFFSET,
      by: y + downY * PLAYER_PICKUP_BOTTOM_OFFSET
    };
  }

  function playerCanCollectPickup(targetPlayer, pickup) {
    if (!targetPlayer || !pickup) {
      return false;
    }
    const segment = playerPickupSegment(targetPlayer);
    const distance = distanceToSegment(
      finiteOr(pickup.x, 0),
      finiteOr(pickup.y, 0),
      segment.ax,
      segment.ay,
      segment.bx,
      segment.by
    );
    return distance <= Math.max(0, finiteOr(pickup.radius, 0)) + PLAYER_PICKUP_CONTACT_RADIUS;
  }

  function distanceToPlayerHurtboxSegment(targetPlayer, ax, ay, bx, by) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    return distanceBetweenSegments(ax, ay, bx, by, hurtbox.ax, hurtbox.ay, hurtbox.bx, hurtbox.by);
  }

  function segmentCircleIntersection(cx, cy, radius, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const fx = ax - cx;
    const fy = ay - cy;
    const a = dx * dx + dy * dy;
    if (a <= 0.000001) {
      return fx * fx + fy * fy <= radius * radius ? { x: ax, y: ay, t: 0 } : null;
    }
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return null;
    }
    const root = Math.sqrt(discriminant);
    const t1 = (-b - root) / (2 * a);
    const t2 = (-b + root) / (2 * a);
    let t = Number.POSITIVE_INFINITY;
    if (t1 >= 0 && t1 <= 1) {
      t = t1;
    }
    if (t2 >= 0 && t2 <= 1 && t2 < t) {
      t = t2;
    }
    if (!Number.isFinite(t)) {
      return null;
    }
    return {
      x: ax + dx * t,
      y: ay + dy * t,
      t
    };
  }

  function shortestAngleDelta(from, to) {
    let delta = (to - from) % (Math.PI * 2);
    if (delta > Math.PI) {
      delta -= Math.PI * 2;
    } else if (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return delta;
  }

  function defaultTechInventory(source) {
    const tech = {};
    const snapshot = source && typeof source === "object" ? source : {};
    for (const key of TECH_KEYS) {
      tech[key] = Math.max(0, Math.floor(finiteOr(snapshot[key], 0)));
    }
    return tech;
  }

  function normalizePlayerStatusEffects(source, legacyDisabledTimer) {
    const effects = source && typeof source === "object" ? source : {};
    const disabled = Math.max(0, finiteOr(effects.disabled, legacyDisabledTimer));
    return {
      disabled,
      disabledMax: Math.max(disabled, finiteOr(effects.disabledMax, disabled))
    };
  }

  function hasPlayerStatusEffect(player, status) {
    if (status === "disabled") {
      return Math.max(
        finiteOr(player && player.statusEffects && player.statusEffects.disabled, 0),
        finiteOr(player && player.toolDisabledTimer, 0)
      ) > 0;
    }
    return Math.max(0, finiteOr(player && player.statusEffects && player.statusEffects[status], 0)) > 0;
  }

  function applyPlayerStatusEffect(player, status, duration) {
    if (!player || status !== "disabled") {
      return false;
    }
    if (!player.statusEffects || typeof player.statusEffects !== "object") {
      player.statusEffects = normalizePlayerStatusEffects(null, player.toolDisabledTimer);
    }
    const amount = Math.max(0, finiteOr(duration, 0));
    if (amount <= 0) {
      player.statusEffects.disabled = 0;
      player.statusEffects.disabledMax = 0;
      player.toolDisabledTimer = 0;
      return true;
    }
    player.statusEffects.disabled = Math.max(finiteOr(player.statusEffects.disabled, 0), amount);
    player.statusEffects.disabledMax = amount >= finiteOr(player.statusEffects.disabled, 0)
      ? amount
      : Math.max(finiteOr(player.statusEffects.disabledMax, 0), player.statusEffects.disabled);
    player.toolDisabledTimer = Math.max(finiteOr(player.toolDisabledTimer, 0), player.statusEffects.disabled);
    if (amount > 0) {
      player.toolFireCooldown = Math.max(finiteOr(player.toolFireCooldown, 0), Math.min(amount, 1.2));
    }
    return true;
  }

  function updatePlayerStatusEffects(player, dt) {
    if (!player) {
      return;
    }
    player.statusEffects = normalizePlayerStatusEffects(player.statusEffects, player.toolDisabledTimer);
    for (const key of Object.keys(player.statusEffects)) {
      if (key === "disabledMax") {
        continue;
      }
      player.statusEffects[key] = Math.max(0, finiteOr(player.statusEffects[key], 0) - dt);
    }
    if (finiteOr(player.statusEffects.disabled, 0) <= 0) {
      player.statusEffects.disabledMax = 0;
    }
    player.toolDisabledTimer = Math.max(0, finiteOr(player.statusEffects.disabled, 0));
  }
