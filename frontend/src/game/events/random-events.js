  function particleStormWeight(state) {
    const history = Array.isArray(state && state.history) ? state.history : [];
    if (!history.length) {
      return 18;
    }
    const stormCount = randomEventHistoryCount(particleStormEventId);
    return stormCount <= 0 ? 6 : 1.35;
  }

  function meteorShowerWeight(state) {
    if (!meteorShowerCanStartAfterParticleStorms()) {
      return 0;
    }
    const showerCount = randomEventHistoryCount(meteorShowerEventId);
    return showerCount <= 0 ? 5 : 1.1;
  }

  function meteorShowerCanStartWithUfoBoss() {
    return Math.max(0, Math.floor(finiteOr(mobDefeatsByKind.ufo, 0))) >= mobBossDefeatsToUnlock;
  }

  function meteorShowerCanStartAfterParticleStorms() {
    return randomEventHistoryCount(particleStormEventId) >= 3 && meteorShowerCanStartWithUfoBoss();
  }

  function currentRunElapsedSeconds() {
    return Math.max(0, (performance.now() - lifeStats.startedAt) / 1000);
  }

  function chooseParticleStormRegion() {
    const anchors = activePartyPlayerAnchors();
    const source = anchors[Math.floor(Math.random() * anchors.length)] || player;
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const travelAngle = speed > 60 ? Math.atan2(source.vy, source.vx) : randomRange(0, Math.PI * 2);
    const sideAngle = travelAngle + randomRange(-0.85, 0.85);
    const distance = randomRange(920, 1520);
    const radius = randomRange(particleStormSettings.radiusMin, particleStormSettings.radiusMax);
    return {
      x: finiteOr(source.x, player.x) + Math.cos(sideAngle) * distance,
      y: finiteOr(source.y, player.y) + Math.sin(sideAngle) * distance,
      radius,
      windAngle: sideAngle + Math.PI + randomRange(-0.55, 0.55),
      phase: randomRange(0, Math.PI * 2),
      maxParticles: particleStormSettings.maxActiveParticles
    };
  }

  function activeParticleStormParticles() {
    return particles.filter(function (particle) {
      return particle && particle.randomEventId === particleStormEventId;
    });
  }

  function stormParticleColor() {
    const hue = Math.random() < 0.65 ? randomRange(182, 215) : randomRange(294, 334);
    return hslToRgb(hue, randomRange(0.72, 0.94), randomRange(0.54, 0.72));
  }

  function meteorBodyColor() {
    const palettes = [
      { r: 124, g: 118, b: 110 },
      { r: 164, g: 143, b: 116 },
      { r: 94, g: 104, b: 112 },
      { r: 142, g: 114, b: 91 },
      { r: 186, g: 154, b: 111 }
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  function activeMeteorShowerParticles() {
    return particles.filter(function (particle) {
      return particle && particle.randomEventId === meteorShowerEventId;
    });
  }

  function randomMeteorMass(meteorIndex) {
    if ((Math.max(0, Math.floor(finiteOr(meteorIndex, 0))) + 3) % 7 === 0) {
      return randomRange(50, 96);
    }
    const roll = Math.random();
    if (roll < 0.7) {
      return randomRange(10, 34);
    }
    if (roll < 0.9) {
      return randomRange(34, 50);
    }
    return randomRange(50, 96);
  }

  function createParticleStormParticle(active) {
    const radius = Math.max(120, finiteOr(active.radius, particleStormSettings.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const crossX = -windY;
    const crossY = windX;
    const edge = randomRange(radius * 0.72, radius * 1.08);
    const sweep = randomRange(-radius * 0.9, radius * 0.9);
    const jitter = randomRange(-radius * 0.12, radius * 0.2);
    const x = finiteOr(active.x, player.x) - windX * edge + crossX * sweep + windX * jitter;
    const y = finiteOr(active.y, player.y) - windY * edge + crossY * sweep + windY * jitter;
    const roll = Math.random();
    const mass = roll < 0.78 ? 1 : roll < 0.95 ? 2 : 3;
    const particle = createParticle(x, y, mass, stormParticleColor());
    const speed = randomRange(96, 178);
    particle.vx = windX * speed + crossX * randomRange(-62, 62) + randomRange(-18, 18);
    particle.vy = windY * speed + crossY * randomRange(-62, 62) + randomRange(-18, 18);
    particle.randomEventId = particleStormEventId;
    particle.randomEventRegionX = finiteOr(active.x, player.x);
    particle.randomEventRegionY = finiteOr(active.y, player.y);
    return particle;
  }

  function createMeteorShowerParticle(active, meteorIndex) {
    const radius = Math.max(120, finiteOr(active.radius, meteorShowerSettings.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const crossX = -windY;
    const crossY = windX;
    const edge = randomRange(radius * 0.78, radius * 1.12);
    const sweep = randomRange(-radius * 0.95, radius * 0.95);
    const jitter = randomRange(-radius * 0.08, radius * 0.26);
    const x = finiteOr(active.x, player.x) - windX * edge + crossX * sweep + windX * jitter;
    const y = finiteOr(active.y, player.y) - windY * edge + crossY * sweep + windY * jitter;
    const particle = createParticle(x, y, randomMeteorMass(meteorIndex), meteorBodyColor());
    const speed = particle.tier && particle.tier.name === "boulder" ? randomRange(760, 980) : randomRange(820, 1120);
    particle.vx = windX * speed + crossX * randomRange(-92, 92) + randomRange(-28, 28);
    particle.vy = windY * speed + crossY * randomRange(-92, 92) + randomRange(-28, 28);
    particle.randomEventId = meteorShowerEventId;
    particle.randomEventRegionX = finiteOr(active.x, player.x);
    particle.randomEventRegionY = finiteOr(active.y, player.y);
    particle.spawnAge = 0;
    return particle;
  }

  function spawnParticleStormParticles(active, count) {
    if (!active) {
      return 0;
    }
    const stormParticles = activeParticleStormParticles();
    const maxParticles = Math.max(8, finiteOr(active.maxParticles, particleStormSettings.maxActiveParticles));
    const available = Math.max(0, maxParticles - stormParticles.length);
    const spawnCount = Math.min(Math.max(0, Math.floor(finiteOr(count, 0))), available);
    for (let i = 0; i < spawnCount; i += 1) {
      particles.push(createParticleStormParticle(active));
    }
    active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0)) + spawnCount;
    return spawnCount;
  }

  function spawnMeteorShowerParticles(active, count) {
    if (!active) {
      return 0;
    }
    const meteorParticles = activeMeteorShowerParticles();
    const maxParticles = Math.max(4, finiteOr(active.maxParticles, meteorShowerSettings.maxActiveParticles));
    const available = Math.max(0, maxParticles - meteorParticles.length);
    const spawnCount = Math.min(Math.max(0, Math.floor(finiteOr(count, 0))), available);
    const spawnedBefore = Math.max(0, Math.floor(finiteOr(active.particlesSpawned, 0)));
    for (let i = 0; i < spawnCount; i += 1) {
      particles.push(createMeteorShowerParticle(active, spawnedBefore + i));
    }
    active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0)) + spawnCount;
    return spawnCount;
  }

  function startParticleStorm(active) {
    const region = chooseParticleStormRegion();
    Object.assign(active, {
      title: "Particle storm",
      x: region.x,
      y: region.y,
      radius: region.radius,
      windAngle: region.windAngle,
      phase: region.phase,
      maxParticles: region.maxParticles,
      spawnTimer: 0,
      particlesSpawned: 0
    });
    spawnParticleStormParticles(active, particleStormSettings.initialCount);
    maybeNotifyText("Particle storm detected.", { groupKey: "random-event-particle-storm" });
    playSound("ui", { throttle: 0.5 });
  }

  function startMeteorShower(active) {
    const region = chooseParticleStormRegion();
    Object.assign(active, {
      title: "Meteor shower",
      x: region.x,
      y: region.y,
      radius: randomRange(meteorShowerSettings.radiusMin, meteorShowerSettings.radiusMax),
      windAngle: region.windAngle,
      phase: region.phase,
      maxParticles: meteorShowerSettings.maxActiveParticles,
      spawnTimer: 0,
      particlesSpawned: 0
    });
    spawnMeteorShowerParticles(active, meteorShowerSettings.initialCount);
    maybeNotifyText("Meteor shower detected.", { groupKey: "random-event-meteor-shower" });
    playSound("ui", { throttle: 0.5 });
  }

  function updateParticleStorm(active, dt) {
    if (!active) {
      return;
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    active.spawnTimer = finiteOr(active.spawnTimer, 0) - seconds;
    while (active.spawnTimer <= 0) {
      const lateFade = clamp(1 - finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, particleStormSettings.duration)), 0, 1);
      const count = lateFade > 0.2 ? Math.floor(randomRange(2, 5)) : 1;
      spawnParticleStormParticles(active, count);
      active.spawnTimer += particleStormSettings.spawnInterval;
      if (activeParticleStormParticles().length >= finiteOr(active.maxParticles, particleStormSettings.maxActiveParticles)) {
        break;
      }
    }

    const cx = finiteOr(active.x, player.x);
    const cy = finiteOr(active.y, player.y);
    const radius = Math.max(120, finiteOr(active.radius, particleStormSettings.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const now = performance.now() * 0.001;
    const phase = finiteOr(active.phase, 0);

    for (const particle of particles) {
      if (!particle || particle.id === (player.landed && player.landed.bodyId)) {
        continue;
      }
      const dx = particle.x - cx;
      const dy = particle.y - cy;
      const distance = Math.hypot(dx, dy);
      const tagged = particle.randomEventId === particleStormEventId;
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
      const swirlSign = Math.sin(phase + particle.wobble * 1.7 + now * 1.2) < 0 ? -1 : 1;
      const swirlX = -radialY * swirlSign;
      const swirlY = radialX * swirlSign;
      const gust = 42 + Math.sin(now * 2.1 + particle.wobble + phase) * 28;
      const flutter = Math.sin(now * 4.7 + particle.textureSeed) * 38;
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

  function updateMeteorShower(active, dt) {
    if (!active) {
      return;
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    active.spawnTimer = finiteOr(active.spawnTimer, 0) - seconds;
    while (active.spawnTimer <= 0) {
      const lateFade = clamp(1 - finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, meteorShowerSettings.duration)), 0, 1);
      const count = lateFade > 0.24 && Math.random() < 0.72 ? 2 : 1;
      spawnMeteorShowerParticles(active, count);
      active.spawnTimer += meteorShowerSettings.spawnInterval;
      if (activeMeteorShowerParticles().length >= finiteOr(active.maxParticles, meteorShowerSettings.maxActiveParticles)) {
        break;
      }
    }

    const cx = finiteOr(active.x, player.x);
    const cy = finiteOr(active.y, player.y);
    const radius = Math.max(120, finiteOr(active.radius, meteorShowerSettings.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const now = performance.now() * 0.001;
    const phase = finiteOr(active.phase, 0);

    for (const particle of particles) {
      if (!particle || particle.id === (player.landed && player.landed.bodyId)) {
        continue;
      }
      const dx = particle.x - cx;
      const dy = particle.y - cy;
      const distance = Math.hypot(dx, dy);
      const tagged = particle.randomEventId === meteorShowerEventId;
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

  function finishParticleStorm() {
    for (const particle of particles) {
      if (particle && particle.randomEventId === particleStormEventId) {
        delete particle.randomEventId;
        delete particle.randomEventRegionX;
        delete particle.randomEventRegionY;
      }
    }
    maybeNotifyText("Particle storm clearing.", { groupKey: "random-event-particle-storm" });
  }

  function finishMeteorShower() {
    for (const particle of particles) {
      if (particle && particle.randomEventId === meteorShowerEventId) {
        delete particle.randomEventId;
        delete particle.randomEventRegionX;
        delete particle.randomEventRegionY;
      }
    }
    maybeNotifyText("Meteor shower clearing.", { groupKey: "random-event-meteor-shower" });
  }

  function activeRandomEventRegions() {
    const active = randomEventState.active;
    const regions = [];
    if (active && active.id === particleStormEventId) {
      regions.push({
        id: particleStormEventId,
        label: "Storm",
        x: finiteOr(active.x, player.x),
        y: finiteOr(active.y, player.y),
        radius: Math.max(120, finiteOr(active.radius, particleStormSettings.radiusMin)),
        color: particleStormMapColor,
        progress: clamp(finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, particleStormSettings.duration)), 0, 1)
      });
    }
    if (active && active.id === meteorShowerEventId) {
      regions.push({
        id: meteorShowerEventId,
        label: "Meteors",
        x: finiteOr(active.x, player.x),
        y: finiteOr(active.y, player.y),
        radius: Math.max(120, finiteOr(active.radius, meteorShowerSettings.radiusMin)),
        color: meteorShowerMapColor,
        progress: clamp(finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, meteorShowerSettings.duration)), 0, 1)
      });
    }
    if (typeof activeSpacecraftEventRegions === "function") {
      regions.push(...activeSpacecraftEventRegions(active));
    }
    return regions;
  }

  registerRandomEvent({
    id: particleStormEventId,
    title: "Particle storm",
    duration: particleStormSettings.duration,
    weight: particleStormWeight,
    canStart: function () {
      return !deathState.active && player.health > 0;
    },
    start: startParticleStorm,
    update: updateParticleStorm,
    finish: finishParticleStorm
  });

  registerRandomEvent({
    id: meteorShowerEventId,
    title: "Meteor shower",
    duration: meteorShowerSettings.duration,
    weight: meteorShowerWeight,
    canStart: function () {
      return !deathState.active && player.health > 0 && meteorShowerCanStartAfterParticleStorms();
    },
    start: startMeteorShower,
    update: updateMeteorShower,
    finish: finishMeteorShower
  });

  function startRandomEvent(definition) {
    if (!definition) {
      return false;
    }
    const eventState = {
      id: definition.id,
      elapsed: 0,
      duration: Math.max(1, finiteOr(definition.duration, 30))
    };
    randomEventState.active = eventState;
    randomEventState.history.push(definition.id);
    randomEventState.history = randomEventState.history.slice(-12);
    if (typeof definition.start === "function") {
      definition.start(eventState);
    }
    return true;
  }

  function finishRandomEvent(reason) {
    const active = randomEventState.active;
    if (!active) {
      return;
    }
    const definition = randomEventDefinitions.find((candidate) => candidate.id === active.id);
    if (definition && typeof definition.finish === "function") {
      definition.finish(active, reason || "complete");
    }
    randomEventState.active = null;
    randomEventState.timer = Math.max(randomEventMinimumCooldown, finiteOr(randomEventState.cooldown, randomEventDefaultCooldown));
  }

  function updateRandomEvents(dt) {
    if (randomEventState.enabled === false || randomEventDefinitions.length === 0) {
      if (randomEventState.active) {
        finishRandomEvent("disabled");
      } else {
        randomEventState.active = null;
      }
      return;
    }

    const seconds = Math.max(0, finiteOr(dt, 0));
    if (randomEventState.active) {
      const active = randomEventState.active;
      const definition = randomEventDefinitions.find((candidate) => candidate.id === active.id);
      active.elapsed = Math.max(0, finiteOr(active.elapsed, 0) + seconds);
      if (definition && typeof definition.update === "function") {
        definition.update(active, seconds);
      }
      if (!definition || active.elapsed >= Math.max(1, finiteOr(active.duration, 30))) {
        finishRandomEvent("duration");
      }
      return;
    }

    randomEventState.timer = Math.max(0, finiteOr(randomEventState.timer, randomEventState.cooldown) - seconds);
    if (randomEventState.timer > 0) {
      return;
    }

    if (!startRandomEvent(chooseRandomEventDefinition())) {
      randomEventState.timer = Math.max(randomEventMinimumCooldown, finiteOr(randomEventState.cooldown, randomEventDefaultCooldown));
    }
  }
