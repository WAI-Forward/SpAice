  function randomMeteorMass(seedHolder, meteorIndex) {
    if ((Math.max(0, Math.floor(finiteOr(meteorIndex, 0))) + 3) % 7 === 0) {
      return randomRange(seedHolder, 50, 96);
    }
    const roll = randomRange(seedHolder, 0, 1);
    if (roll < 0.7) {
      return randomRange(seedHolder, 10, 34);
    }
    if (roll < 0.9) {
      return randomRange(seedHolder, 34, 50);
    }
    return randomRange(seedHolder, 50, 96);
  }

  function ensureParticleStormState(state, active) {
    if (!state || !state.world || !active) {
      return false;
    }
    if (
      Number.isFinite(Number(active.x)) &&
      Number.isFinite(Number(active.y)) &&
      Number.isFinite(Number(active.radius)) &&
      Number.isFinite(Number(active.windAngle))
    ) {
      active.started = true;
      active.title = active.title || "Particle storm";
      active.maxParticles = Math.max(8, finiteOr(active.maxParticles, PARTICLE_STORM_SETTINGS.maxActiveParticles));
      active.spawnTimer = finiteOr(active.spawnTimer, 0);
      active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0));
      return true;
    }
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const region = chooseParticleStormRegion(state, seedHolder);
    Object.assign(active, {
      title: "Particle storm",
      x: region.x,
      y: region.y,
      radius: region.radius,
      windAngle: region.windAngle,
      phase: region.phase,
      maxParticles: region.maxParticles,
      spawnTimer: 0,
      particlesSpawned: 0,
      started: true
    });
    state.seed = seedHolder.seed >>> 0;
    return true;
  }

  function ensureMeteorShowerState(state, active) {
    if (!state || !state.world || !active) {
      return false;
    }
    if (
      Number.isFinite(Number(active.x)) &&
      Number.isFinite(Number(active.y)) &&
      Number.isFinite(Number(active.radius)) &&
      Number.isFinite(Number(active.windAngle))
    ) {
      active.started = true;
      active.title = active.title || "Meteor shower";
      active.maxParticles = Math.max(4, finiteOr(active.maxParticles, METEOR_SHOWER_SETTINGS.maxActiveParticles));
      active.spawnTimer = finiteOr(active.spawnTimer, 0);
      active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0));
      return true;
    }
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const region = chooseParticleStormRegion(state, seedHolder);
    Object.assign(active, {
      title: "Meteor shower",
      x: region.x,
      y: region.y,
      radius: randomRange(seedHolder, METEOR_SHOWER_SETTINGS.radiusMin, METEOR_SHOWER_SETTINGS.radiusMax),
      windAngle: region.windAngle,
      phase: region.phase,
      maxParticles: METEOR_SHOWER_SETTINGS.maxActiveParticles,
      spawnTimer: 0,
      particlesSpawned: 0,
      started: true
    });
    state.seed = seedHolder.seed >>> 0;
    return true;
  }

  function createParticleStormParticle(state, active, seedHolder) {
    const world = state && state.world;
    if (!world || !active) {
      return null;
    }
    const radius = Math.max(120, finiteOr(active.radius, PARTICLE_STORM_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const crossX = -windY;
    const crossY = windX;
    const edge = randomRange(seedHolder, radius * 0.72, radius * 1.08);
    const sweep = randomRange(seedHolder, -radius * 0.9, radius * 0.9);
    const jitter = randomRange(seedHolder, -radius * 0.12, radius * 0.2);
    const x = finiteOr(active.x, 0) - windX * edge + crossX * sweep + windX * jitter;
    const y = finiteOr(active.y, 0) - windY * edge + crossY * sweep + windY * jitter;
    const roll = randomRange(seedHolder, 0, 1);
    const mass = roll < 0.78 ? 1 : roll < 0.95 ? 2 : 3;
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const particle = normalizeParticle({
      id,
      x,
      y,
      mass,
      color: stormParticleColor(seedHolder),
      spawnAge: 0,
      pulse: randomRange(seedHolder, 0.8, 1.25),
      randomEventId: PARTICLE_STORM_EVENT_ID,
      randomEventRegionX: finiteOr(active.x, 0),
      randomEventRegionY: finiteOr(active.y, 0)
    }, id, seedHolder);
    const speed = randomRange(seedHolder, 96, 178);
    particle.vx = windX * speed + crossX * randomRange(seedHolder, -62, 62) + randomRange(seedHolder, -18, 18);
    particle.vy = windY * speed + crossY * randomRange(seedHolder, -62, 62) + randomRange(seedHolder, -18, 18);
    world.nextParticleId = Math.max(id + 1, Math.floor(finiteOr(world.nextParticleId, 1)) + 1);
    return particle;
  }

  function createMeteorShowerParticle(state, active, seedHolder, meteorIndex) {
    const world = state && state.world;
    if (!world || !active) {
      return null;
    }
    const radius = Math.max(120, finiteOr(active.radius, METEOR_SHOWER_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const crossX = -windY;
    const crossY = windX;
    const edge = randomRange(seedHolder, radius * 0.78, radius * 1.12);
    const sweep = randomRange(seedHolder, -radius * 0.95, radius * 0.95);
    const jitter = randomRange(seedHolder, -radius * 0.08, radius * 0.26);
    const x = finiteOr(active.x, 0) - windX * edge + crossX * sweep + windX * jitter;
    const y = finiteOr(active.y, 0) - windY * edge + crossY * sweep + windY * jitter;
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const particle = normalizeParticle({
      id,
      x,
      y,
      mass: randomMeteorMass(seedHolder, meteorIndex),
      color: meteorBodyColor(seedHolder),
      spawnAge: 0,
      pulse: randomRange(seedHolder, 0.82, 1.16),
      randomEventId: METEOR_SHOWER_EVENT_ID,
      randomEventRegionX: finiteOr(active.x, 0),
      randomEventRegionY: finiteOr(active.y, 0)
    }, id, seedHolder);
    const speed = particle.tier && particle.tier.name === "boulder" ? randomRange(seedHolder, 760, 980) : randomRange(seedHolder, 820, 1120);
    particle.vx = windX * speed + crossX * randomRange(seedHolder, -92, 92) + randomRange(seedHolder, -28, 28);
    particle.vy = windY * speed + crossY * randomRange(seedHolder, -92, 92) + randomRange(seedHolder, -28, 28);
    world.nextParticleId = Math.max(id + 1, Math.floor(finiteOr(world.nextParticleId, 1)) + 1);
    return particle;
  }

  function spawnParticleStormParticles(state, active, count) {
    const world = state && state.world;
    if (!world || !active) {
      return 0;
    }
    const maxParticles = Math.max(8, finiteOr(active.maxParticles, PARTICLE_STORM_SETTINGS.maxActiveParticles));
    const available = Math.max(0, maxParticles - activeParticleStormParticles(world).length);
    const spawnCount = Math.min(Math.max(0, Math.floor(finiteOr(count, 0))), available);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    for (let i = 0; i < spawnCount; i += 1) {
      const particle = createParticleStormParticle(state, active, seedHolder);
      if (particle) {
        world.particles.push(particle);
      }
    }
    state.seed = seedHolder.seed >>> 0;
    active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0)) + spawnCount;
    return spawnCount;
  }

  function spawnMeteorShowerParticles(state, active, count) {
    const world = state && state.world;
    if (!world || !active) {
      return 0;
    }
    const maxParticles = Math.max(4, finiteOr(active.maxParticles, METEOR_SHOWER_SETTINGS.maxActiveParticles));
    const available = Math.max(0, maxParticles - activeMeteorShowerParticles(world).length);
    const spawnCount = Math.min(Math.max(0, Math.floor(finiteOr(count, 0))), available);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const spawnedBefore = Math.max(0, Math.floor(finiteOr(active.particlesSpawned, 0)));
    for (let i = 0; i < spawnCount; i += 1) {
      const particle = createMeteorShowerParticle(state, active, seedHolder, spawnedBefore + i);
      if (particle) {
        world.particles.push(particle);
      }
    }
    state.seed = seedHolder.seed >>> 0;
    active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0)) + spawnCount;
    return spawnCount;
  }

  function startParticleStorm(state, active) {
    if (!ensureParticleStormState(state, active)) {
      return;
    }
    spawnParticleStormParticles(state, active, PARTICLE_STORM_SETTINGS.initialCount);
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.started", id: PARTICLE_STORM_EVENT_ID, title: "Particle storm", tick: state.tick });
    }
  }

  function startMeteorShower(state, active) {
    if (!ensureMeteorShowerState(state, active)) {
      return;
    }
    spawnMeteorShowerParticles(state, active, METEOR_SHOWER_SETTINGS.initialCount);
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.started", id: METEOR_SHOWER_EVENT_ID, title: "Meteor shower", tick: state.tick });
    }
  }

  function updateParticleStorm(state, active, dt) {
    const world = state && state.world;
    if (!world || !ensureParticleStormState(state, active)) {
      return;
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    active.spawnTimer = finiteOr(active.spawnTimer, 0) - seconds;
    while (active.spawnTimer <= 0) {
      const lateFade = clamp(1 - finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, PARTICLE_STORM_SETTINGS.duration)), 0, 1);
      const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
      const count = lateFade > 0.2 ? Math.floor(randomRange(seedHolder, 2, 5)) : 1;
      state.seed = seedHolder.seed >>> 0;
      spawnParticleStormParticles(state, active, count);
      active.spawnTimer += PARTICLE_STORM_SETTINGS.spawnInterval;
      if (activeParticleStormParticles(world).length >= finiteOr(active.maxParticles, PARTICLE_STORM_SETTINGS.maxActiveParticles)) {
        break;
      }
    }

    const cx = finiteOr(active.x, 0);
    const cy = finiteOr(active.y, 0);
    const radius = Math.max(120, finiteOr(active.radius, PARTICLE_STORM_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const now = finiteOr(state.tick, 0) * TICK_DT;
    const phase = finiteOr(active.phase, 0);

    for (const particle of world.particles || []) {
      if (!particle) {
        continue;
      }
      const dx = particle.x - cx;
      const dy = particle.y - cy;
      const distance = Math.hypot(dx, dy);
      const tagged = particle.randomEventId === PARTICLE_STORM_EVENT_ID;
      if (!tagged && distance > radius) {
        continue;
      }

      const influence = tagged ? 1 : clamp(1 - distance / radius, 0, 1);
      if (influence <= 0) {
        continue;
      }

      const invDistance = distance > 0.001 ? 1 / distance : 0;
      const radialX = distance > 0.001 ? dx * invDistance : windX;
      const radialY = distance > 0.001 ? dy * invDistance : windY;
      const swirlSign = Math.sin(phase + finiteOr(particle.wobble, 0) * 1.7 + now * 1.2) < 0 ? -1 : 1;
      const swirlX = -radialY * swirlSign;
      const swirlY = radialX * swirlSign;
      const gust = 42 + Math.sin(now * 2.1 + finiteOr(particle.wobble, 0) + phase) * 28;
      const flutter = Math.sin(now * 4.7 + finiteOr(particle.textureSeed, 0)) * 38;
      const massScale = particle.tier && particle.tier.solid
        ? 0.14 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)))
        : 1 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)));
      particle.vx += (windX * gust + swirlX * 70 * influence + radialX * flutter) * influence * massScale * seconds;
      particle.vy += (windY * gust + swirlY * 70 * influence + radialY * flutter) * influence * massScale * seconds;

      if (tagged && Math.hypot(particle.vx, particle.vy) < 54) {
        particle.vx += windX * 34 * seconds;
        particle.vy += windY * 34 * seconds;
      }
    }
  }

  function updateMeteorShower(state, active, dt) {
    const world = state && state.world;
    if (!world || !ensureMeteorShowerState(state, active)) {
      return;
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    active.spawnTimer = finiteOr(active.spawnTimer, 0) - seconds;
    while (active.spawnTimer <= 0) {
      const lateFade = clamp(1 - finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, METEOR_SHOWER_SETTINGS.duration)), 0, 1);
      const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
      const count = lateFade > 0.24 && randomRange(seedHolder, 0, 1) < 0.72 ? 2 : 1;
      state.seed = seedHolder.seed >>> 0;
      spawnMeteorShowerParticles(state, active, count);
      active.spawnTimer += METEOR_SHOWER_SETTINGS.spawnInterval;
      if (activeMeteorShowerParticles(world).length >= finiteOr(active.maxParticles, METEOR_SHOWER_SETTINGS.maxActiveParticles)) {
        break;
      }
    }

    const cx = finiteOr(active.x, 0);
    const cy = finiteOr(active.y, 0);
    const radius = Math.max(120, finiteOr(active.radius, METEOR_SHOWER_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const now = finiteOr(state.tick, 0) * TICK_DT;
    const phase = finiteOr(active.phase, 0);

    for (const particle of world.particles || []) {
      if (!particle) {
        continue;
      }
      const dx = particle.x - cx;
      const dy = particle.y - cy;
      const distance = Math.hypot(dx, dy);
      const tagged = particle.randomEventId === METEOR_SHOWER_EVENT_ID;
      if (!tagged && distance > radius) {
        continue;
      }

      const influence = tagged ? 1 : clamp(1 - distance / radius, 0, 1);
      if (influence <= 0) {
        continue;
      }

      const invDistance = distance > 0.001 ? 1 / distance : 0;
      const radialX = distance > 0.001 ? dx * invDistance : windX;
      const radialY = distance > 0.001 ? dy * invDistance : windY;
      const crossX = -radialY;
      const crossY = radialX;
      const gust = 68 + Math.sin(now * 1.8 + finiteOr(particle.wobble, 0) + phase) * 22;
      const tumble = Math.sin(now * 3.6 + finiteOr(particle.textureSeed, 0)) * 32;
      const massScale = particle.tier && particle.tier.solid
        ? 0.18 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)))
        : 0.56 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)));
      particle.vx += (windX * gust + crossX * tumble + radialX * 18) * influence * massScale * seconds;
      particle.vy += (windY * gust + crossY * tumble + radialY * 18) * influence * massScale * seconds;

      if (tagged && Math.hypot(particle.vx, particle.vy) < 700) {
        particle.vx += windX * 150 * seconds;
        particle.vy += windY * 150 * seconds;
      }
    }
  }

  function finishParticleStorm(state) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return;
    }
    for (const particle of world.particles) {
      if (particle && particle.randomEventId === PARTICLE_STORM_EVENT_ID) {
        delete particle.randomEventId;
        delete particle.randomEventRegionX;
        delete particle.randomEventRegionY;
      }
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.finished", id: PARTICLE_STORM_EVENT_ID, tick: state.tick });
    }
  }

  function finishMeteorShower(state) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return;
    }
    for (const particle of world.particles) {
      if (particle && particle.randomEventId === METEOR_SHOWER_EVENT_ID) {
        delete particle.randomEventId;
        delete particle.randomEventRegionX;
        delete particle.randomEventRegionY;
      }
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.finished", id: METEOR_SHOWER_EVENT_ID, title: "Meteor shower", tick: state.tick });
    }
  }

  registerRandomEventDefinition({
    id: PARTICLE_STORM_EVENT_ID,
    title: "Particle storm",
    duration: PARTICLE_STORM_SETTINGS.duration,
    weight: particleStormWeight,
    canStart: function (state) {
      return activeRandomEventPlayers(state).length > 0;
    },
    start: startParticleStorm,
    update: updateParticleStorm,
    finish: finishParticleStorm
  });

  registerRandomEventDefinition({
    id: METEOR_SHOWER_EVENT_ID,
    title: "Meteor shower",
    duration: METEOR_SHOWER_SETTINGS.duration,
    weight: meteorShowerWeight,
    canStart: function (state) {
      return activeRandomEventPlayers(state).length > 0 && meteorShowerCanStartAfterParticleStorms(state, state && state.world && state.world.randomEvents);
    },
    start: startMeteorShower,
    update: updateMeteorShower,
    finish: finishMeteorShower
  });

  registerRandomEventDefinition({
    id: ROGUE_TRADER_EVENT_ID,
    title: "Rogue Trader",
    duration: ROGUE_TRADER_EVENT_SETTINGS.duration,
    weight: rogueTraderWeight,
    canStart: function (state) {
      const elapsed = Math.max(0, finiteOr(state && state.tick, 0) * TICK_DT);
      return elapsed >= ROGUE_TRADER_EVENT_SETTINGS.earliestSpawnTime && activeRandomEventPlayers(state).length > 0;
    },
    start: startRogueTraderEvent,
    update: updateRogueTraderSpacecraft,
    finish: finishRogueTraderEvent
  });

