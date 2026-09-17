  const FAST_AMBIENT_BODY_ANCHOR_BASE_MASS = 150;
  const FAST_AMBIENT_BODY_ANCHOR_BASE_SPEED = 700;
  const FAST_AMBIENT_BODY_ANCHOR_MIN_SPEED_FLOOR = 420;
  const FAST_AMBIENT_BODY_ANCHOR_FULL_SPEED_WINDOW = 420;
  const FAST_AMBIENT_BODY_ANCHOR_MAX_COUNT = 5;

  function ambientParticleAnchorWeight(anchor) {
    if (anchor && Object.prototype.hasOwnProperty.call(anchor, "ambientAnchorWeight")) {
      return clamp(finiteOr(anchor.ambientAnchorWeight, 0), 0.02, 1);
    }
    return 1;
  }

  function fastAmbientBodyAnchorWeight(body) {
    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    if (mass < FAST_AMBIENT_BODY_ANCHOR_BASE_MASS) {
      return 0;
    }
    const speed = Math.hypot(finiteOr(body && body.vx, 0), finiteOr(body && body.vy, 0));
    const minSpeed = clamp(
      FAST_AMBIENT_BODY_ANCHOR_BASE_SPEED - Math.log2(Math.max(1, mass / FAST_AMBIENT_BODY_ANCHOR_BASE_MASS)) * 50,
      FAST_AMBIENT_BODY_ANCHOR_MIN_SPEED_FLOOR,
      FAST_AMBIENT_BODY_ANCHOR_BASE_SPEED
    );
    if (speed < minSpeed) {
      return 0;
    }
    return clamp(
      (speed - minSpeed) / FAST_AMBIENT_BODY_ANCHOR_FULL_SPEED_WINDOW,
      0,
      1
    );
  }

  function isFastAmbientBodyAnchor(body) {
    return Boolean(
      body &&
      body.tier &&
      body.tier.solid &&
      !body.randomEventId &&
      !body.survivalCampBody &&
      finiteOr(body.ufoSapTimer, 0) <= 0 &&
      fastAmbientBodyAnchorWeight(body) > 0
    );
  }

  function activeAmbientParticleSpawnAnchors(world, players) {
    const anchors = Array.isArray(players) ? players.slice() : [];
    const candidates = [];
    for (const body of world.particles) {
      if (!isFastAmbientBodyAnchor(body)) {
        continue;
      }
      const speed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
      const weight = fastAmbientBodyAnchorWeight(body);
      candidates.push({ body, speed, weight });
    }

    candidates.sort((a, b) => b.weight - a.weight || b.speed - a.speed || b.body.mass - a.body.mass);

    const nearPlayerRadius = AMBIENT_PARTICLE_DENSITY_RADIUS * 0.5;
    for (const candidate of candidates) {
      const body = candidate.body;
      const nearPlayer = players.length ? nearestPlayerDistance(body.x, body.y, players) <= nearPlayerRadius : false;
      const weight = nearPlayer ? candidate.weight * 0.42 : candidate.weight;
      if (weight < 0.12) {
        continue;
      }
      anchors.push({
        x: body.x,
        y: body.y,
        vx: finiteOr(body.vx, 0),
        vy: finiteOr(body.vy, 0),
        radius: Math.max(0, finiteOr(body.radius, 0)),
        bodyId: body.id,
        ambientAnchorWeight: weight,
        ambientAnchorTargetScale: 0.08 + weight * 0.72,
        ambientAnchorType: "fast-body",
        ambientAnchorBowWave: true
      });
      if (anchors.length - players.length >= FAST_AMBIENT_BODY_ANCHOR_MAX_COUNT) {
        break;
      }
    }
    return anchors;
  }

  function countAmbientParticlesNearPlayer(world, player, radius) {
    const radiusSq = radius * radius;
    const bowWave = Boolean(player && player.ambientAnchorBowWave);
    const speed = Math.hypot(finiteOr(player && player.vx, 0), finiteOr(player && player.vy, 0));
    const travel = bowWave && speed > 0.001 ? normalize(player.vx, player.vy) : { x: 0, y: 0 };
    const anchorRadius = Math.max(0, finiteOr(player && player.radius, 0));
    const bowLateralLimit = Math.max(150, anchorRadius + 170);
    let count = 0;
    for (const body of world.particles) {
      if (!isAmbientParticle(body)) {
        continue;
      }
      const dx = body.x - player.x;
      const dy = body.y - player.y;
      if (dx * dx + dy * dy <= radiusSq) {
        if (bowWave) {
          const forward = dx * travel.x + dy * travel.y;
          const lateral = Math.abs(dx * -travel.y + dy * travel.x);
          if (forward < -anchorRadius * 0.35 || lateral > bowLateralLimit) {
            continue;
          }
        }
        count += 1;
      }
    }
    return count;
  }

  function mostUnderdenseAmbientPlayer(world, players, localTarget, densityRadius) {
    let best = null;
    for (const candidate of players) {
      const localCount = countAmbientParticlesNearPlayer(world, candidate, densityRadius);
      const speed = Math.hypot(finiteOr(candidate.vx, 0), finiteOr(candidate.vy, 0));
      const bowWave = Boolean(candidate.ambientAnchorBowWave);
      const targetScale = clamp(finiteOr(candidate.ambientAnchorTargetScale, ambientParticleAnchorWeight(candidate)), 0.02, 1.1);
      const anchorLocalTarget = Math.max(bowWave ? 1 : 6, Math.round(localTarget * targetScale));
      const score = anchorLocalTarget - localCount + clamp(speed / 480, 0, 1.15) * (bowWave ? ambientParticleAnchorWeight(candidate) : 1) + ambientParticleAnchorWeight(candidate) * 0.35;
      if (!best || score > best.score) {
        best = { player: candidate, anchor: candidate, localCount, localTarget: anchorLocalTarget, score };
      }
    }
    return best || { player: players[0], anchor: players[0], localCount: 0, localTarget, score: 0 };
  }

  function farthestRecyclableAmbientParticle(world, players, keepRadius) {
    let best = null;
    let bestDistance = -Infinity;
    for (const body of world.particles) {
      if (
        !body ||
        !body.tier ||
        body.tier.solid ||
        body.randomEventId ||
        body.survivalCampBody ||
        finiteOr(body.ufoSapTimer, 0) > 0
      ) {
        continue;
      }
      const distance = nearestPlayerDistance(body.x, body.y, players);
      if (distance <= keepRadius || distance <= bestDistance) {
        continue;
      }
      best = body;
      bestDistance = distance;
    }
    return best;
  }

  function effectiveParticleAnchorCount(players) {
    const clusters = [];
    const clusterRadius = 900;
    for (const player of players) {
      const weight = ambientParticleAnchorWeight(player);
      let cluster = null;
      for (const candidate of clusters) {
        if (Math.hypot(player.x - candidate.x, player.y - candidate.y) <= clusterRadius) {
          cluster = candidate;
          break;
        }
      }
      if (!cluster) {
        clusters.push({ x: player.x, y: player.y, count: weight });
        continue;
      }
      cluster.x = (cluster.x * cluster.count + player.x * weight) / (cluster.count + weight);
      cluster.y = (cluster.y * cluster.count + player.y * weight) / (cluster.count + weight);
      cluster.count += weight;
    }
    return clusters.reduce((total, cluster) => total + Math.min(1, cluster.count) + Math.max(0, cluster.count - 1) * 0.28, 0) || 1;
  }

  function effectiveParticlePlayerCount(players) {
    return effectiveParticleAnchorCount(players);
  }

  function randomAmbientParticleSpawnAnchor(anchors, seedHolder) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : [];
    const totalWeight = source.reduce((total, anchor) => total + ambientParticleAnchorWeight(anchor), 0);
    let roll = nextRandom(seedHolder) * Math.max(0.001, totalWeight);
    for (const anchor of source) {
      roll -= ambientParticleAnchorWeight(anchor);
      if (roll <= 0) {
        return anchor;
      }
    }
    return source[0] || null;
  }

  function updateAmbientParticleSpawning(state) {
    const world = state.world;
    if (!world.ambientParticleSpawning || state.tick % AMBIENT_PARTICLE_SPAWN_TICK_INTERVAL !== 0) {
      return;
    }

    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0);
    if (!players.length) {
      return;
    }

    const anchors = activeAmbientParticleSpawnAnchors(world, players);
    const effectiveAnchorCount = effectiveParticleAnchorCount(anchors);
    const targetCount = Math.round(TARGET_AMBIENT_PARTICLES * (0.96 + Math.max(0, effectiveAnchorCount - 1) * 0.62));
    const maxAmbientBudget = targetCount;
    const localTarget = AMBIENT_PARTICLE_PLAYFIELD_TARGET;
    const densityRadius = AMBIENT_PARTICLE_PLAYFIELD_RADIUS;
    let ambientCount = countAmbientParticles(world);
    const seedHolder = { seed: state.seed >>> 0 };
    for (let spawned = 0; spawned < AMBIENT_PARTICLE_CATCHUP_SPAWNS; spawned += 1) {
      const underdense = mostUnderdenseAmbientPlayer(world, anchors, localTarget, densityRadius);
      const needsLocalFill = underdense.score > 0.5 && underdense.localCount < underdense.localTarget;
      if (ambientCount >= targetCount && (!needsLocalFill || ambientCount >= maxAmbientBudget)) {
        const recycled = needsLocalFill ? farthestRecyclableAmbientParticle(world, anchors, densityRadius * 1.18) : null;
        if (!recycled) {
          break;
        }
        createAmbientParticle(world, underdense.anchor, anchors, seedHolder, { localFill: true, recycledBody: recycled });
        continue;
      }
      world.particles.push(createAmbientParticle(
        world,
        needsLocalFill ? underdense.anchor : randomAmbientParticleSpawnAnchor(anchors, seedHolder),
        anchors,
        seedHolder,
        { localFill: needsLocalFill }
      ));
      ambientCount += 1;
      if (!needsLocalFill) {
        break;
      }
    }
    state.seed = seedHolder.seed >>> 0;
  }

  function updatePickups(state, dt) {
    const players = Object.values(state.players || {}).filter((entry) => entry.health > 0 && !entry.spacecraftInterior);
    const claimedTech = new Set(state.world.claimedTechPickupIds || []);
    const claimedHealth = new Set(state.world.claimedHealthPickupIds || []);

    function updatePickupList(list, type) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const pickup = list[i];
        pickup.life = Math.max(0, finiteOr(pickup.life, 0) - dt);
        pickup.vx *= Math.pow(0.32, dt);
        pickup.vy *= Math.pow(0.32, dt);
        pickup.x += pickup.vx * dt;
        pickup.y += pickup.vy * dt;
        for (const player of players) {
          if (!playerCanCollectPickup(player, pickup)) {
            continue;
          }
          if (type === "tech") {
            const key = TECH_KEYS.includes(pickup.key) ? pickup.key : "suction";
            if (!claimedTech.has(String(pickup.id))) {
              claimedTech.add(String(pickup.id));
              player.tech[key] = Math.max(0, Math.floor(player.tech[key] || 0)) + 1;
              state.events.push({
                type: "pickup.tech",
                pickupId: pickup.id,
                key,
                playerId: player.id,
                x: pickup.x,
                y: pickup.y,
                color: cloneColor(pickup.color),
                tick: state.tick
              });
            }
          } else if (player.health < player.maxHealth && !claimedHealth.has(String(pickup.id))) {
            claimedHealth.add(String(pickup.id));
            player.health = Math.min(player.maxHealth, player.health + finiteOr(pickup.heal, 8));
            state.events.push({
              type: "pickup.health",
              pickupId: pickup.id,
              playerId: player.id,
              x: pickup.x,
              y: pickup.y,
              color: { r: 101, g: 245, b: 154 },
              tick: state.tick
            });
          }
          list.splice(i, 1);
          return;
        }
        if (pickup.life <= 0) {
          list.splice(i, 1);
        }
      }
    }

    updatePickupList(state.world.techPickups, "tech");
    updatePickupList(state.world.healthPickups, "health");
    state.world.claimedTechPickupIds = compactClaimedPickupIds(claimedTech);
    state.world.claimedHealthPickupIds = compactClaimedPickupIds(claimedHealth);
  }

  function compactClaimedPickupIds(ids) {
    const values = Array.from(ids || []).map(String).filter(Boolean);
    if (values.length <= PICKUP_CLAIM_HISTORY_LIMIT) {
      return values;
    }
    return values.slice(values.length - PICKUP_CLAIM_HISTORY_LIMIT);
  }

  function mobBodyImpactCooldown(mob, body) {
    return mob && mob.bodyImpactCooldowns ? finiteOr(mob.bodyImpactCooldowns[body.id], 0) : 0;
  }

  function tickMobBodyImpactCooldowns(mob, dt) {
    if (!mob || !mob.bodyImpactCooldowns) {
      return;
    }
    for (const bodyId of Object.keys(mob.bodyImpactCooldowns)) {
      const next = finiteOr(mob.bodyImpactCooldowns[bodyId], 0) - dt;
      if (next > 0) {
        mob.bodyImpactCooldowns[bodyId] = next;
      } else {
        delete mob.bodyImpactCooldowns[bodyId];
      }
    }
  }

  function markMobDamagedByBody(mob, body) {
    if (!mob.bodyImpactCooldowns) {
      mob.bodyImpactCooldowns = {};
    }
    mob.bodyImpactCooldowns[body.id] = BODY_IMPACT_REPEAT_DAMAGE_COOLDOWN;
  }

  function triggerBossBodyEvade(mob, body, nx, ny, impactSpeed) {
    if (!mob || !body || !mob.isBoss) {
      return;
    }

    const bodySpeed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
    const travelX = bodySpeed > 1 ? body.vx / bodySpeed : -nx;
    const travelY = bodySpeed > 1 ? body.vy / bodySpeed : -ny;
    const cross = travelX * ny - travelY * nx;
    const side = Math.abs(cross) > 0.02 ? Math.sign(cross) : (mob.strafeSign < 0 ? -1 : 1);
    const tangentX = -travelY * side;
    const tangentY = travelX * side;
    const evade = normalize(tangentX * 0.82 + nx * 0.38, tangentY * 0.82 + ny * 0.38);
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const boostSpeed = clamp(
      340 + Math.max(bodySpeed, finiteOr(impactSpeed, 0)) * 0.5 + Math.sqrt(mass) * 1.8,
      BOSS_BODY_EVADE_MIN_SPEED,
      BOSS_BODY_EVADE_MAX_SPEED
    );
    const currentAlongEvade = finiteOr(mob.vx, 0) * evade.x + finiteOr(mob.vy, 0) * evade.y;
    const extraSpeed = Math.max(0, boostSpeed - currentAlongEvade);

    mob.vx += evade.x * extraSpeed;
    mob.vy += evade.y * extraSpeed;
    mob.strafeSign = side;
    mob.hitCooldown = Math.max(finiteOr(mob.hitCooldown, 0), 0.68);
    mob.bossBodyEvadeTimer = Math.max(finiteOr(mob.bossBodyEvadeTimer, 0), BOSS_BODY_EVADE_DURATION);
    mob.bossBodyEvadeSpeedCap = Math.max(finiteOr(mob.bossBodyEvadeSpeedCap, 0), boostSpeed * 1.08);
  }

  function bodyImpactKnockbackForce(body, bodySpeed) {
    const speedBonus = Math.max(0, bodySpeed - SOLID_BODY_DAMAGE_SPEED) * 0.34;
    const massBonus = Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 2.45;
    return clamp(BODY_IMPACT_BASE_KNOCKBACK + speedBonus + massBonus, BODY_IMPACT_BASE_KNOCKBACK, BODY_IMPACT_MAX_KNOCKBACK);
  }

  function solidBodyImpactDamage(body, impactSpeed, baseDamage) {
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const speedDamage = Math.max(0, impactSpeed - SOLID_BODY_DAMAGE_SPEED) * 0.26;
    const massDamage = Math.pow(mass, 0.42) * 1.45;
    const damageCap = clamp(105 + Math.sqrt(mass) * 2.2, 120, 320);
    return Math.min(damageCap, baseDamage + speedDamage + massDamage);
  }

  function projectileBodyImpactDamage(body, bodySpeed) {
    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    return Math.min(85, 18 + Math.max(0, bodySpeed - PROJECTILE_DAMAGE_SPEED) * 0.16 + Math.sqrt(mass) * 0.75);
  }

  function ejectedMobParticleColor(seedHolder, mob) {
    const base = normalizeColor(mob && mob.color, randomParticleColor(seedHolder));
    return mixColor(base, randomParticleColor(seedHolder), 3, 1);
  }

  function emitMobDamageParticles(state, mob, damage) {
    const world = state && state.world;
    if (
      (state && state._emitMobDamageParticles === false) ||
      !world ||
      !mob ||
      finiteOr(damage, 0) <= 0 ||
      !Array.isArray(world.particles)
    ) {
      return 0;
    }

    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0);
    const effectivePlayerCount = effectiveParticlePlayerCount(players);
    const particleBudget = Math.round(TARGET_AMBIENT_PARTICLES * (1.2 + Math.max(0, effectivePlayerCount - 1) * 0.62));
    const queue = Array.isArray(state._mobDamageParticles) ? state._mobDamageParticles : world.particles;
    if (countAmbientParticles(world) + queue.length > particleBudget) {
      return 0;
    }

    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const scaledCount = Math.round(finiteOr(damage, 0) / MOB_DAMAGE_PER_PARTICLE + randomRange(seedHolder, -0.35, 0.35));
    const count = clamp(scaledCount, MOB_DAMAGE_PARTICLE_MIN, MOB_DAMAGE_PARTICLE_MAX);
    const baseColor = ejectedMobParticleColor(seedHolder, mob);
    const spawnRadius = Math.max(4, finiteOr(mob.radius, 28));

    for (let i = 0; i < count; i += 1) {
      const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const speed = randomRange(seedHolder, 82, 176);
      const spawnDistance = Math.max(4, spawnRadius * randomRange(seedHolder, 0.25, 0.75));
      const particle = normalizeParticle({
        id,
        x: finiteOr(mob.x, 0) + Math.cos(angle) * spawnDistance,
        y: finiteOr(mob.y, 0) + Math.sin(angle) * spawnDistance,
        vx: finiteOr(mob.vx, 0) * 0.32 + Math.cos(angle) * speed + randomRange(seedHolder, -22, 22),
        vy: finiteOr(mob.vy, 0) * 0.32 + Math.sin(angle) * speed + randomRange(seedHolder, -22, 22),
        mass: MOB_DAMAGE_PARTICLE_MASS,
        color: ejectedMobParticleColor(seedHolder, { color: baseColor }),
        textureSeed: randomRange(seedHolder, 0, 1000),
        wobble: randomRange(seedHolder, 0, Math.PI * 2),
        pulse: randomRange(seedHolder, 0.8, 1.25),
        spawnAge: 0,
        spawnSizeScale: 1
      }, id, seedHolder);
      queue.push(particle);
      world.nextParticleId = id + 1;
    }
    return count;
  }

  function flushMobDamageParticles(state) {
    const world = state && state.world;
    const queued = state && state._mobDamageParticles;
    if (!world || !Array.isArray(world.particles) || !Array.isArray(queued) || !queued.length) {
      return;
    }
    world.particles.push(...queued);
    queued.length = 0;
  }

  function damageMob(state, mob, damage, cause, sourcePlayerId) {
    if (!mob || mob.health <= 0) {
      return false;
    }
    wakeSurvivalCampFromMob(state, mob, sourcePlayerId);
    if (mob.kind === "fighter" && !isMobDisabled(mob) && finiteOr(mob.shieldCharge, 0) > 0) {
      mob.shieldActive = Math.max(finiteOr(mob.shieldActive, 0), 0.55);
      mob.shieldRecharge = FIGHTER_SHIELD_CYCLE;
      mob.flash = Math.max(finiteOr(mob.flash, 0), 0.08);
      state.events.push({
        type: "mob.shielded",
        mobId: mob.id,
        kind: "fighter",
        cause: cause || "impact",
        x: mob.x,
        y: mob.y,
        color: cloneColor(mob.color),
        tick: state.tick
      });
      return false;
    }
    const dealtDamage = Math.max(0, finiteOr(damage, 0));
    mob.health = Math.max(0, mob.health - dealtDamage);
    mob.hitCooldown = Math.max(finiteOr(mob.hitCooldown, 0), 0.42);
    mob.flash = Math.max(finiteOr(mob.flash, 0), 0.28);
    emitMobDamageParticles(state, mob, dealtDamage);
    if (mob.health <= 0) {
      const kind = mobEntityKind(mob);
      if (isMobBeacon(mob)) {
        mob.respawnTimer = MOB_BEACON_RESPAWN_DURATION;
        mob.age = 0;
        for (let i = 0; i < MOB_BEACON_DROP_COUNT; i += 1) {
          createTechPickup(state, techKeyForMob(kind), mob.x, mob.y, mob.vx, mob.vy);
        }
        state.events.push({
          type: "mob.beacon.destroyed",
          mobId: mob.id,
          kind,
          isBeacon: true,
          cause: cause || "impact",
          suspendedSeconds: MOB_BEACON_RESPAWN_DURATION,
          x: mob.x,
          y: mob.y,
          color: cloneColor(mob.color),
          tick: state.tick
        });
        return true;
      }
      if (mob.team !== "player") {
        const rewardValue = mobEliteRewardValue(mob);
        if (state.world.mobDefeatsByKind && Object.prototype.hasOwnProperty.call(state.world.mobDefeatsByKind, kind)) {
          state.world.mobDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(state.world.mobDefeatsByKind[kind], 0))) + rewardValue;
        }
        if (mob.isBoss) {
          if (state.world.mobBossDefeatsByKind && Object.prototype.hasOwnProperty.call(state.world.mobBossDefeatsByKind, kind)) {
            state.world.mobBossDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(state.world.mobBossDefeatsByKind[kind], 0))) + 1;
          }
          if (state.world.mobBossProgressByKind && Object.prototype.hasOwnProperty.call(state.world.mobBossProgressByKind, kind)) {
            state.world.mobBossProgressByKind[kind] = 0;
          }
        } else if (state.world.mobBossProgressByKind && Object.prototype.hasOwnProperty.call(state.world.mobBossProgressByKind, kind)) {
          state.world.mobBossProgressByKind[kind] = Math.min(
            MOB_BOSS_DEFEATS_TO_UNLOCK,
            Math.max(0, Math.floor(finiteOr(state.world.mobBossProgressByKind[kind], 0))) + rewardValue
          );
          if (state.world.mobBossProgressByKind[kind] >= MOB_BOSS_DEFEATS_TO_UNLOCK) {
            maybeScheduleMobBoss(state, kind, { seed: state.seed >>> 0 });
          }
        }
        if (shouldDropHealthPickup(state, mob)) {
          createHealthPickup(state, mob.x, mob.y, mob.vx, mob.vy);
        }
        const techDrops = mob.isBoss ? MOB_BOSS_DROP_COUNT : rewardValue;
        for (let i = 0; i < techDrops; i += 1) {
          createTechPickup(state, techKeyForMob(kind), mob.x, mob.y, mob.vx, mob.vy);
        }
      }
      state.events.push({
        type: "mob.defeated",
        mobId: mob.id,
        kind,
        isBoss: Boolean(mob.isBoss),
        bossStars: bossStarRank(mob),
        eliteStars: mobEliteStarRank(mob),
        representedCount: mobEliteRewardValue(mob),
        cause: cause || "impact",
        x: mob.x,
        y: mob.y,
        color: cloneColor(mob.color),
        tick: state.tick
      });
      return true;
    }
    state.events.push({
      type: "mob.hit",
      mobId: mob.id,
      kind: mobEntityKind(mob),
      isBeacon: isMobBeacon(mob),
      cause: cause || "impact",
      damage: Math.max(0, finiteOr(damage, 0)),
      x: mob.x,
      y: mob.y,
      color: cloneColor(mob.color),
      tick: state.tick
    });
    return false;
  }

  function killAllMobs(state) {
    const world = state && state.world;
    if (!world) {
      return 0;
    }
    let killed = 0;
    for (const mob of allCombatMobs(world).slice()) {
      if (!mob || mob.health <= 0 || mob.team === "player") {
        continue;
      }
      if (mob.kind === "fighter") {
        mob.shieldActive = 0;
        mob.shieldCharge = 0;
      }
      if (damageMob(state, mob, Math.max(1, finiteOr(mob.health, 0)), "command")) {
        killed += 1;
      }
    }
    return killed;
  }

  function bossScaledDamage(mob, damage) {
    if (mob && mob.isBoss) {
      return damage * MOB_BOSS_DAMAGE_MULTIPLIER * bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_DAMAGE_MULTIPLIER);
    }
    return damage * mobEliteStatScale(mob, MOB_ELITE_DAMAGE_MULTIPLIER);
  }

  function bossChaseForce(mob, baseForce) {
    if (mob && mob.isBoss) {
      return baseForce * 1.18 * bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_FORCE_MULTIPLIER);
    }
    return baseForce * mobEliteStatScale(mob, MOB_ELITE_FORCE_MULTIPLIER);
  }

  function bossStrafeForce(mob, baseForce) {
    if (mob && mob.isBoss) {
      return baseForce * 1.35 * bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_FORCE_MULTIPLIER);
    }
    return baseForce * mobEliteStatScale(mob, MOB_ELITE_FORCE_MULTIPLIER);
  }
