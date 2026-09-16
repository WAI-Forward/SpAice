  function playSound(name, options) {
    const settings = options || {};
    const volume = Math.max(0, finiteOr(settings.volume, 1));
    const throttle = Number.isFinite(settings.throttle) ? settings.throttle : soundThrottleFor(name);
    if (!canPlaySound(settings.throttleKey || name, throttle)) {
      return;
    }

    if (name === "ui") {
      playTone({ frequency: 460, endFrequency: 620, duration: 0.08, gain: 0.018 * volume, type: "triangle" });
    } else if (name === "select") {
      playTone({ frequency: 520, endFrequency: 360, duration: 0.07, gain: 0.02 * volume, type: "square" });
    } else if (name === "gadgetSuck") {
      playNoise({ duration: 0.11, gain: 0.026 * volume, frequency: 720, filterType: "lowpass", q: 0.9 });
      playTone({ frequency: 260, endFrequency: 118, duration: 0.14, gain: 0.024 * volume, type: "triangle" });
    } else if (name === "gadgetBlow") {
      playNoise({ duration: 0.13, gain: 0.034 * volume, frequency: 520, filterType: "lowpass", q: 0.7 });
      playTone({ frequency: 128, endFrequency: 245, duration: 0.12, gain: 0.022 * volume, type: "sawtooth" });
    } else if (name === "craft") {
      playTone({ frequency: 420, endFrequency: 640, duration: 0.1, gain: 0.032 * volume, type: "triangle" });
      playTone({ frequency: 640, endFrequency: 920, duration: 0.12, gain: 0.026 * volume, delay: 0.06, type: "triangle" });
      playTone({ frequency: 920, endFrequency: 1180, duration: 0.14, gain: 0.02 * volume, delay: 0.13, type: "sine" });
    } else if (name === "place") {
      playNoise({ duration: 0.12, gain: 0.04 * volume, frequency: 240, filterType: "lowpass", q: 0.8 });
      playTone({ frequency: 160, endFrequency: 115, duration: 0.16, gain: 0.03 * volume, type: "triangle" });
    } else if (name === "landing") {
      playTone({ frequency: 220, endFrequency: 132, duration: 0.16, gain: 0.028 * volume, type: "triangle" });
      playNoise({ duration: 0.08, gain: 0.018 * volume, frequency: 520, filterType: "lowpass" });
    } else if (name === "detach") {
      playNoise({ duration: 0.14, gain: 0.026 * volume, frequency: 840, q: 0.7 });
      playTone({ frequency: 180, endFrequency: 320, duration: 0.13, gain: 0.018 * volume, type: "sine" });
    } else if (name === "laser") {
      playTone({ frequency: 980, endFrequency: 1480, duration: 0.08, gain: 0.034 * volume, type: "sawtooth" });
      playNoise({ duration: 0.06, gain: 0.014 * volume, frequency: 2300, q: 2.2 });
    } else if (name === "turret") {
      playTone({ frequency: 760, endFrequency: 1120, duration: 0.07, gain: 0.025 * volume, type: "sawtooth" });
    } else if (name === "lock") {
      playTone({ frequency: 1180, endFrequency: 1420, duration: 0.08, gain: 0.022 * volume, type: "square" });
      playTone({ frequency: 1620, endFrequency: 1320, duration: 0.08, gain: 0.018 * volume, delay: 0.075, type: "triangle" });
    } else if (name === "rambotCharge") {
      playTone({ frequency: 132, endFrequency: 72, duration: 0.28, gain: 0.038 * volume, type: "sawtooth" });
      playNoise({ duration: 0.18, gain: 0.028 * volume, frequency: 240, filterType: "lowpass", q: 0.7 });
    } else if (name === "teslaWarmup") {
      playTone({ frequency: 420, endFrequency: 1380, duration: 0.24, gain: 0.024 * volume, type: "triangle" });
      playTone({ frequency: 860, endFrequency: 1720, duration: 0.16, gain: 0.016 * volume, delay: 0.08, type: "square" });
    } else if (name === "ufoSiphon") {
      playTone({ frequency: 340, endFrequency: 116, duration: 0.22, gain: 0.022 * volume, type: "sine" });
      playNoise({ duration: 0.14, gain: 0.018 * volume, frequency: 620, filterType: "bandpass", q: 1.1 });
    } else if (name === "satelliteLock") {
      playTone({ frequency: 980, endFrequency: 980, duration: 0.055, gain: 0.018 * volume, type: "square" });
      playTone({ frequency: 1220, endFrequency: 1220, duration: 0.055, gain: 0.017 * volume, delay: 0.07, type: "square" });
      playTone({ frequency: 1500, endFrequency: 1500, duration: 0.07, gain: 0.016 * volume, delay: 0.14, type: "triangle" });
    } else if (name === "enemyLaser") {
      playTone({ frequency: 520, endFrequency: 360, duration: 0.11, gain: 0.024 * volume, type: "square" });
      playNoise({ duration: 0.08, gain: 0.012 * volume, frequency: 1600, q: 1.6 });
    } else if (name === "lightning") {
      playNoise({ duration: 0.18, gain: 0.05 * volume, frequency: 2600, q: 4.5 });
      playTone({ frequency: 1700, endFrequency: 520, duration: 0.16, gain: 0.024 * volume, type: "square" });
    } else if (name === "missile") {
      playNoise({ duration: 0.2, gain: 0.038 * volume, frequency: 340, filterType: "lowpass", q: 0.7 });
      playTone({ frequency: 130, endFrequency: 86, duration: 0.22, gain: 0.032 * volume, type: "sawtooth" });
    } else if (name === "fighter") {
      playTone({ frequency: 720, endFrequency: 520, duration: 0.05, gain: 0.022 * volume, type: "square" });
      playTone({ frequency: 760, endFrequency: 540, duration: 0.05, gain: 0.018 * volume, delay: 0.035, type: "square" });
    } else if (name === "hit") {
      playNoise({ duration: 0.15, gain: 0.045 * volume, frequency: 420, filterType: "lowpass", q: 0.9 });
      playTone({ frequency: 150, endFrequency: 86, duration: 0.18, gain: 0.035 * volume, type: "triangle" });
    } else if (name === "mobHit") {
      playNoise({ duration: 0.08, gain: 0.026 * volume, frequency: 1250, q: 1.9 });
      playTone({ frequency: 390, endFrequency: 260, duration: 0.08, gain: 0.018 * volume, type: "triangle" });
    } else if (name === "mobDestroyed") {
      playNoise({ duration: 0.2, gain: 0.045 * volume, frequency: 760, q: 1.2 });
      playTone({ frequency: 520, endFrequency: 190, duration: 0.22, gain: 0.032 * volume, type: "sawtooth" });
    } else if (name === "merge") {
      playTone({ frequency: 180, endFrequency: 260, duration: 0.16, gain: 0.026 * volume, type: "triangle" });
      playTone({ frequency: 360, endFrequency: 520, duration: 0.18, gain: 0.018 * volume, delay: 0.05, type: "sine" });
    } else if (name === "trade") {
      playTone({ frequency: 440, endFrequency: 660, duration: 0.09, gain: 0.024 * volume, type: "triangle" });
      playTone({ frequency: 880, endFrequency: 1320, duration: 0.12, gain: 0.018 * volume, delay: 0.055, type: "sine" });
      playNoise({ duration: 0.06, gain: 0.01 * volume, frequency: 1800, filterType: "bandpass", q: 2.4, delay: 0.04 });
    } else if (name === "milestone") {
      playTone({ frequency: 240, endFrequency: 360, duration: 0.18, gain: 0.034 * volume, type: "triangle" });
      playTone({ frequency: 480, endFrequency: 860, duration: 0.26, gain: 0.03 * volume, delay: 0.08, type: "sine" });
    } else if (name === "pickupHealth") {
      playTone({ frequency: 520, endFrequency: 760, duration: 0.1, gain: 0.024 * volume, type: "triangle" });
      playTone({ frequency: 760, endFrequency: 960, duration: 0.12, gain: 0.018 * volume, delay: 0.055, type: "sine" });
    } else if (name === "pickupTech") {
      playTone({ frequency: 740, endFrequency: 1160, duration: 0.08, gain: 0.022 * volume, type: "sine" });
      playTone({ frequency: 1240, endFrequency: 1820, duration: 0.1, gain: 0.016 * volume, delay: 0.045, type: "triangle" });
    } else if (name === "shield") {
      playTone({ frequency: 300, endFrequency: 920, duration: 0.16, gain: 0.03 * volume, type: "triangle" });
      playNoise({ duration: 0.1, gain: 0.018 * volume, frequency: 1800, q: 3.2 });
    } else if (name === "jam") {
      playTone({ frequency: 110, endFrequency: 98, duration: 0.26, gain: 0.035 * volume, type: "sawtooth" });
      playNoise({ duration: 0.22, gain: 0.028 * volume, frequency: 1900, q: 4.4 });
    } else if (name === "death") {
      playNoise({ duration: 0.44, gain: 0.07 * volume, frequency: 280, filterType: "lowpass", q: 0.8 });
      playTone({ frequency: 220, endFrequency: 42, duration: 0.72, gain: 0.058 * volume, type: "sawtooth" });
      playTone({ frequency: 650, endFrequency: 120, duration: 0.5, gain: 0.032 * volume, delay: 0.08, type: "triangle" });
    }
  }

  function randomAlienColor() {
    const palettes = [
      { r: 99, g: 245, b: 153 },
      { r: 72, g: 224, b: 221 },
      { r: 176, g: 115, b: 255 },
      { r: 236, g: 255, b: 93 }
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  function tierForMass(mass) {
    let tier = bodyTiers[0];
    for (const candidate of bodyTiers) {
      if (mass >= candidate.threshold) {
        tier = candidate;
      }
    }
    return tier;
  }

  function normalizedStellarOutcomeName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    return stellarOutcomeTierNames.includes(normalized) ? normalized : "";
  }

  function stellarOutcomeForGrowthRate(rate) {
    const growthRate = Math.max(0, finiteOr(rate, 0));
    if (growthRate >= stellarGrowthRateBlackHoleThreshold) {
      return "black hole";
    }
    if (growthRate >= stellarGrowthRateNeutronThreshold) {
      return "neutron star";
    }
    return "white dwarf";
  }

  function tierForStellarOutcome(outcome) {
    const normalized = normalizedStellarOutcomeName(outcome) || "white dwarf";
    return stellarBranchTiers.find((candidate) => candidate.name === normalized) || stellarBranchTiers[0];
  }

  function tierForMassAndStellarOutcome(mass, outcome) {
    if (mass >= stellarEvolutionEndThreshold) {
      return tierForStellarOutcome(outcome);
    }
    return tierForMass(mass);
  }

  function nextTierAfter(tier) {
    const index = bodyTiers.indexOf(tier);
    if (index < 0 && tier && tier.name) {
      const nameIndex = bodyTiers.findIndex((candidate) => candidate.name === tier.name);
      return bodyTiers[nameIndex + 1] || null;
    }
    return bodyTiers[index + 1] || null;
  }

  function thresholdForTierName(name) {
    const normalized = String(name || "").trim().toLowerCase();
    const tier = bodyTiers.find((candidate) => candidate.name === normalized) ||
      stellarBranchTiers.find((candidate) => candidate.name === normalized);
    return tier ? tier.threshold : 0;
  }

  function bodyTierForCommandToken(token) {
    const normalized = String(token || "")
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
    return bodyTiers.find((candidate) => candidate.name === normalized) ||
      stellarBranchTiers.find((candidate) => candidate.name === normalized) ||
      null;
  }

  function isAsteroidOrLarger(particle) {
    return particle && particle.tier && particle.tier.threshold >= thresholdForTierName("asteroid");
  }

  function isStarBody(body) {
    return Boolean(body && body.tier && (body.tier.name === "star" || stellarOutcomeTierNames.includes(body.tier.name)));
  }

  function orbitRingCountForBody(body) {
    if (!body || !body.tier) {
      return 0;
    }
    if (body.tier.name === "white dwarf") {
      return 5;
    }
    if (body.tier.name === "star") {
      return 3;
    }
    if (body.tier.name === orbitCaptureMinTierName) {
      return 1;
    }
    return 0;
  }

  function orbitRingRadius(body, ringIndex) {
    const radius = Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
    const contactRadius = solidBodyContactRadius(body);
    const baseGap = Math.max(orbitRingMinGap, radius * orbitRingBaseGapScale);
    return contactRadius + baseGap * (1 + Math.max(0, finiteOr(ringIndex, 0)) * orbitRingSpacingScale);
  }

  function orbitCaptureBandForRing(body, orbiter, ringRadius) {
    return Math.max(
      orbitCaptureMinBand,
      finiteOr(ringRadius, orbitRingRadius(body, 0)) * orbitCaptureBandScale +
        Math.max(0, finiteOr(orbiter && orbiter.radius, 0)) * 0.72
    );
  }

  function orbitRingsForBody(body) {
    const count = orbitRingCountForBody(body);
    const rings = [];
    for (let i = 0; i < count; i += 1) {
      rings.push(orbitRingRadius(body, i));
    }
    return rings;
  }

  function canBodyOrbitHost(orbiter, host) {
    if (!orbiter || !host || orbiter === host || !orbiter.tier || !host.tier) {
      return false;
    }
    if (orbitRingCountForBody(host) <= 0) {
      return false;
    }
    if (finiteOr(orbiter.mass, 0) >= finiteOr(host.mass, 0)) {
      return false;
    }
    return orbiter.tier.threshold < host.tier.threshold || finiteOr(orbiter.mass, 0) < finiteOr(host.mass, 0) * 0.72;
  }

  function bestOrbitRingForBody(orbiter, host) {
    if (!canBodyOrbitHost(orbiter, host)) {
      return null;
    }
    const dx = finiteOr(orbiter.x, 0) - finiteOr(host.x, 0);
    const dy = finiteOr(orbiter.y, 0) - finiteOr(host.y, 0);
    const distance = Math.hypot(dx, dy) || 1;
    let best = null;
    for (let i = 0; i < orbitRingCountForBody(host); i += 1) {
      const radius = orbitRingRadius(host, i);
      const band = orbitCaptureBandForRing(host, orbiter, radius);
      const delta = distance - radius;
      const score = Math.abs(delta) / band + i * 0.035;
      if (Math.abs(delta) <= band * 2.35 && (!best || score < best.score)) {
        best = { host, ringIndex: i, radius, band, distance, dx, dy, delta, score };
      }
    }
    return best;
  }

  function orbitDirectionForBody(orbiter, host, nx, ny, relVx, relVy) {
    const tangentVelocity = relVx * -ny + relVy * nx;
    if (Math.abs(tangentVelocity) > 8) {
      return tangentVelocity >= 0 ? 1 : -1;
    }
    const stored = finiteOr(orbiter && orbiter.orbitDirection, 0);
    if (stored < 0 || stored > 0) {
      return stored < 0 ? -1 : 1;
    }
    return ((Math.floor(finiteOr(orbiter && orbiter.id, 0)) + Math.floor(finiteOr(host && host.id, 0))) % 2) ? -1 : 1;
  }

  function orbitalSpeedForRing(host, ringIndex, radius) {
    const hostRadius = Math.max(1, finiteOr(host && host.radius, host ? radiusFromMass(host.mass) : 1));
    const tierBoost = isStarBody(host) ? 78 : 34;
    return clamp(122 + Math.sqrt(hostRadius) * 7.5 + tierBoost + Math.max(0, finiteOr(ringIndex, 0)) * 18 - Math.max(0, finiteOr(radius, 1) - hostRadius) * 0.055, 128, 345);
  }

  function findOrbitCapture(body, bodies) {
    if (!body || !Array.isArray(bodies)) {
      return null;
    }
    let best = null;
    const preferredHostId = Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0)));
    for (const host of bodies) {
      const candidate = bestOrbitRingForBody(body, host);
      if (!candidate) {
        continue;
      }
      const hostBias = preferredHostId && host.id === preferredHostId ? -0.24 : 0;
      const score = candidate.score + hostBias;
      if (!best || score < best.score) {
        best = Object.assign(candidate, { score });
      }
    }
    return best;
  }

  function clearOrbitState(body) {
    if (!body) {
      return;
    }
    body.orbitHostId = 0;
    body.orbitRingIndex = 0;
    body.orbitStrength = 0;
    body.orbitGrace = 0;
  }

  function applyOrbitCaptureForces(body, bodies, dt) {
    if (!body || !Array.isArray(bodies) || dt <= 0) {
      return false;
    }
    const capture = findOrbitCapture(body, bodies);
    if (!capture) {
      if (finiteOr(body.orbitGrace, 0) > 0) {
        body.orbitGrace = Math.max(0, finiteOr(body.orbitGrace, 0) - dt);
      } else if (finiteOr(body.orbitStrength, 0) > 0) {
        clearOrbitState(body);
      }
      return false;
    }

    const host = capture.host;
    const distance = capture.distance || 1;
    const nx = capture.dx / distance;
    const ny = capture.dy / distance;
    const tangentX = -ny;
    const tangentY = nx;
    const relVx = finiteOr(body.vx, 0) - finiteOr(host.vx, 0);
    const relVy = finiteOr(body.vy, 0) - finiteOr(host.vy, 0);
    const radialSpeed = relVx * nx + relVy * ny;
    const tangentVelocity = relVx * tangentX + relVy * tangentY;
    const relativeSpeed = Math.hypot(relVx, relVy);
    const inwardSpeed = Math.max(0, -radialSpeed);
    const retainedByHost = Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0))) === host.id;
    const breachSpeed = orbitCaptureStrongInwardSpeed + (retainedByHost ? 92 : 0);
    if (capture.delta < 0 && inwardSpeed > breachSpeed) {
      clearOrbitState(body);
      return false;
    }
    const radialCloseness = clamp(1 - Math.abs(capture.delta) / Math.max(1, capture.band * 2.35), 0, 1);
    const speedFactor = clamp(1 - Math.max(0, relativeSpeed - 90) / orbitCaptureMaxRelativeSpeed, 0.16, 1);
    const breachFactor = clamp(1 - Math.max(0, inwardSpeed - orbitCaptureStrongInwardSpeed) / 260, 0, 1);
    const massResponse = clamp(Math.pow(Math.max(1, finiteOr(host.mass, 1)) / Math.max(1, finiteOr(body.mass, 1)), 0.18), 0.28, 1.85);
    const strength = radialCloseness * speedFactor * (0.22 + breachFactor * 0.78);
    if (strength <= 0.012) {
      return false;
    }

    const direction = orbitDirectionForBody(body, host, nx, ny, relVx, relVy);
    const desiredTangential = orbitalSpeedForRing(host, capture.ringIndex, capture.radius) * direction;
    const radialAccel = clamp(
      -capture.delta * orbitRadialSpring - radialSpeed * orbitRadialDamping,
      -orbitMaxAcceleration,
      orbitMaxAcceleration
    );
    const tangentAccel = clamp(
      (desiredTangential - tangentVelocity) * orbitTangentialDamping,
      -orbitMaxAcceleration,
      orbitMaxAcceleration
    );
    const accelScale = strength * massResponse;
    body.vx += (nx * radialAccel + tangentX * tangentAccel) * accelScale * dt;
    body.vy += (ny * radialAccel + tangentY * tangentAccel) * accelScale * dt;
    body.gadgetStabilized = false;
    body.orbitHostId = host.id;
    body.orbitRingIndex = capture.ringIndex;
    body.orbitDirection = direction;
    body.orbitStrength = clamp(finiteOr(body.orbitStrength, 0) + strength * dt * 4.4, 0, 1);
    body.orbitGrace = orbitRetentionSeconds;
    return true;
  }

  function shouldOrbitPreventMerge(a, b) {
    const first = bestOrbitRingForBody(a, b);
    const second = bestOrbitRingForBody(b, a);
    const capture = first && (!second || first.score <= second.score) ? first : second;
    if (!capture) {
      return false;
    }
    const orbiter = capture.host === a ? b : a;
    const host = capture.host;
    const distance = capture.distance || 1;
    const nx = capture.dx / distance;
    const ny = capture.dy / distance;
    const relVx = finiteOr(orbiter.vx, 0) - finiteOr(host.vx, 0);
    const relVy = finiteOr(orbiter.vy, 0) - finiteOr(host.vy, 0);
    const inwardSpeed = Math.max(0, -(relVx * nx + relVy * ny));
    const orbitingHost = Math.max(0, Math.floor(finiteOr(orbiter.orbitHostId, 0))) === host.id;
    const threshold = orbitCaptureStrongInwardSpeed + (orbitingHost ? 92 : 0);
    return inwardSpeed < threshold;
  }

  function starParticleEmissionRate(body) {
    return starParticleEmissionBaseRate + Math.max(0, finiteOr(body && body.radius, 0)) * starParticleEmissionRadiusScale;
  }

  function formatTierName(name) {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function radiusAtTier(tier) {
    const blueprint = tier && celestialBodyBlueprints[tier.name];
    return blueprint ? blueprint.radius : 11;
  }

  function radiusFromMass(mass) {
    const tier = tierForMass(mass);
    return radiusFromMassForTier(mass, tier);
  }

  function radiusFromMassForTier(mass, tier) {
    const nextTier = nextTierAfter(tier);

    if (!nextTier) {
      return radiusAtTier(tier) + Math.log2(Math.max(1, mass / tier.threshold)) * 22;
    }

    const startRadius = radiusAtTier(tier);
    const endRadius = radiusAtTier(nextTier) - 3;
    const progress = clamp((mass - tier.threshold) / (nextTier.threshold - tier.threshold), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 1.8);
    return startRadius + (endRadius - startRadius) * eased;
  }

  function solidBodyContactRadius(body) {
    const radius = Math.max(0, finiteOr(body && body.radius, 0));
    if (!body || !body.tier || !body.tier.solid) {
      return radius;
    }

    if (body.tier.name === "star") {
      return radius * 1.06;
    }

    if (body.tier.name === "planet") {
      return radius * 1.02;
    }

    return radius * 0.92;
  }

  function pluralizeBodyName(name) {
    if (name === "particle") {
      return "particles";
    }
    return name + "s";
  }

  function pluralizeMobName(name) {
    if (name === "UFO") {
      return "UFOs";
    }
    if (name.endsWith("ship")) {
      return name + "s";
    }
    return name + "s";
  }
