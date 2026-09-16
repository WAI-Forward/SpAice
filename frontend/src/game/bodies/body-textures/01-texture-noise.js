  function textureNoise(seed, index) {
    return Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453 % 1;
  }

  function drawGlow(particle, radius, strength) {
    const glow = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      radius * 2.8
    );
    glow.addColorStop(0, colorString(particle.color, 0.74 * strength));
    glow.addColorStop(0.35, colorString(particle.color, 0.26 * strength));
    glow.addColorStop(1, colorString(particle.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTinyParticle(particle, radius) {
    if (consumeTinyParticleGlowBudget()) {
      ctx.globalCompositeOperation = "lighter";
      drawGlow(particle, radius, 1);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = colorString(particle.color, 0.92);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
    ctx.beginPath();
    ctx.arc(particle.x - radius * 0.28, particle.y - radius * 0.34, Math.max(1.4, radius * 0.22), 0, Math.PI * 2);
    ctx.fill();
  }

  function bodyPromotionVisualProgress(particle) {
    if (!particle || !Number.isFinite(Number(particle.promotionStartedAt))) {
      return null;
    }

    const duration = Math.max(0.001, finiteOr(particle.promotionDuration, bodyPromotionEffectDuration));
    const age = Math.max(0, (performance.now() - particle.promotionStartedAt) / 1000);
    if (age >= duration) {
      return null;
    }

    const progress = clamp(age / duration, 0, 1);
    return {
      age,
      duration,
      progress,
      fade: 1 - progress,
      ease: 1 - Math.pow(1 - progress, 3)
    };
  }

  function drawBodyPromotionEffect(particle, radius, time) {
    const visual = bodyPromotionVisualProgress(particle);
    if (!visual) {
      return;
    }

    const color = particle.promotionColor || shadeColor(particle.color, 72);
    const flash = Math.sin((1 - visual.fade) * Math.PI);
    const ringRadius = radius * (1.18 + visual.ease * 1.05);
    const innerRing = radius * (0.82 + visual.ease * 0.28);
    const rayCount = particle.tier && particle.tier.threshold >= thresholdForTierName("moon") ? 18 : 12;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(finiteOr(particle.rotation, 0) * 0.24 + time * 0.0012);
    ctx.globalCompositeOperation = "lighter";

    const haloRadius = radius * (2.15 + visual.ease * 1.2);
    const halo = ctx.createRadialGradient(0, 0, radius * 0.42, 0, 0, haloRadius);
    halo.addColorStop(0, colorString(shadeColor(color, 92), 0.24 * visual.fade + 0.1 * flash));
    halo.addColorStop(0.38, colorString(color, 0.18 * visual.fade));
    halo.addColorStop(1, colorString(color, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorString(shadeColor(color, 96), 0.66 * visual.fade);
    ctx.lineWidth = Math.max(2.2, radius * 0.055 * visual.fade);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = colorString(color, 0.24 * visual.fade);
    ctx.lineWidth = Math.max(1.4, radius * 0.022);
    ctx.beginPath();
    ctx.arc(0, 0, innerRing, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineCap = "round";
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (Math.PI * 2 * i) / rayCount + Math.sin(time * 0.002 + particle.textureSeed + i) * 0.05;
      const inner = radius * (1.03 + visual.ease * 0.25);
      const outer = radius * (1.42 + visual.ease * (0.75 + Math.abs(textureNoise(particle.textureSeed, i + 51)) * 0.36));
      ctx.strokeStyle = colorString(i % 2 ? color : shadeColor(color, 96), 0.28 * visual.fade);
      ctx.lineWidth = Math.max(1.6, radius * 0.025);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }

  function particleSpawnVisualState(particle) {
    const age = finiteOr(particle && particle.spawnAge, particleSpawnTransitionDuration);
    const progress = clamp(age / Math.max(0.001, particleSpawnTransitionDuration), 0, 1);
    return {
      scale: 1 - Math.pow(1 - progress, 3),
      alpha: progress * progress * (3 - progress * 2)
    };
  }

  function drawRockShape(particle, radius, roughness, sides) {
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const angle = (Math.PI * 2 * i) / sides;
      const n = Math.sin(particle.textureSeed * 3.1 + i * 1.83) * 0.5 + Math.sin(particle.textureSeed * 1.7 + i * 4.31) * 0.5;
      const r = radius * (1 + n * roughness);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }

  function drawSimpleBody(particle, radius, alpha) {
    const light = shadeColor(particle.color, 48);
    const dark = shadeColor(particle.color, -52);
    const bodyAlpha = clamp(finiteOr(alpha, 0.94), 0, 1);
    const tierName = particle && particle.tier ? particle.tier.name : "";
    const rockyBody = tierName === "rock" || tierName === "boulder" || tierName === "asteroid";

    ctx.globalCompositeOperation = "source-over";
    if (rockyBody) {
      const roughness = tierName === "asteroid" ? 0.22 : 0.15;
      const sides = tierName === "asteroid" ? 19 : 15;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.textureSeed + finiteOr(particle.rotation, 0));

      const gradient = ctx.createRadialGradient(
        -radius * 0.32,
        -radius * 0.34,
        Math.max(1, radius * 0.08),
        0,
        0,
        radius
      );
      gradient.addColorStop(0, colorString(light, bodyAlpha));
      gradient.addColorStop(0.62, colorString(particle.color, bodyAlpha * 0.94));
      gradient.addColorStop(1, colorString(dark, bodyAlpha * 0.96));
      ctx.fillStyle = gradient;
      drawRockShape(particle, radius, roughness, sides);
      ctx.fill();

      ctx.strokeStyle = colorString(light, bodyAlpha * 0.24);
      ctx.lineWidth = Math.max(1, radius * 0.045);
      drawRockShape(particle, radius + Math.max(1.5, radius * 0.035), roughness * 0.82, sides);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const gradient = ctx.createRadialGradient(
      particle.x - radius * 0.32,
      particle.y - radius * 0.34,
      Math.max(1, radius * 0.08),
      particle.x,
      particle.y,
      radius
    );
    gradient.addColorStop(0, colorString(light, bodyAlpha));
    gradient.addColorStop(0.62, colorString(particle.color, bodyAlpha * 0.94));
    gradient.addColorStop(1, colorString(dark, bodyAlpha * 0.96));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorString(light, bodyAlpha * 0.24);
    ctx.lineWidth = Math.max(1, radius * 0.045);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius + Math.max(1.5, radius * 0.035), 0, Math.PI * 2);
    ctx.stroke();
  }

  function shouldDrawSimpleBody(particle, radius) {
    const screenRadius = Math.max(0, finiteOr(radius, 0)) * Math.max(0.001, finiteOr(cameraZoom, 1));
    if (renderQualityBelow(0.58)) {
      return true;
    }
    if (particle.tier.name === "rock") {
      return screenRadius < 22;
    }
    if (particle.tier.name === "boulder") {
      return screenRadius < 20;
    }
    if (particle.tier.name === "asteroid") {
      return screenRadius < 18;
    }
    if (particle.tier.name === "moon") {
      return screenRadius < 16;
    }
    return screenRadius < 12;
  }

  function drawCraters(radius, seed, count, color, alphaScale) {
    for (let i = 0; i < count; i += 1) {
      const angle = textureNoise(seed, i) * Math.PI * 2;
      const spread = Math.sqrt(Math.abs(textureNoise(seed + 4.7, i + 11))) * radius * 0.72;
      const craterRadius = radius * (0.08 + Math.abs(textureNoise(seed + 9.2, i + 23)) * 0.14);
      const x = Math.cos(angle) * spread;
      const y = Math.sin(angle) * spread;
      const light = shadeColor(color, 58);
      const dark = shadeColor(color, -74);

      ctx.fillStyle = colorString(dark, 0.24 * alphaScale);
      ctx.beginPath();
      ctx.arc(x, y, craterRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = colorString(light, 0.18 * alphaScale);
      ctx.lineWidth = Math.max(1.2, craterRadius * 0.16);
      ctx.beginPath();
      ctx.arc(x - craterRadius * 0.18, y - craterRadius * 0.2, craterRadius * 0.82, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawRockBody(particle, radius, tierName) {
    const isAsteroid = tierName === "asteroid";
    const base = isAsteroid ? shadeColor(particle.color, -28) : shadeColor(particle.color, -12);
    const light = shadeColor(particle.color, 66);
    const dark = shadeColor(particle.color, -82);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.textureSeed + finiteOr(particle.rotation, 0));

    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.4, radius * 0.08, 0, 0, radius);
    gradient.addColorStop(0, colorString(light, 0.95));
    gradient.addColorStop(0.46, colorString(base, 0.98));
    gradient.addColorStop(1, colorString(dark, 0.98));
    ctx.fillStyle = gradient;

    drawRockShape(particle, radius, isAsteroid ? 0.22 : 0.15, isAsteroid ? 19 : 15);
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = colorString(dark, isAsteroid ? 0.42 : 0.28);
    ctx.lineWidth = Math.max(1.2, radius * 0.045);
    for (let i = 0; i < (isAsteroid ? 7 : 4); i += 1) {
      const y = (textureNoise(particle.textureSeed, i) - 0.5) * radius * 1.25;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.72, y);
      ctx.quadraticCurveTo(
        -radius * 0.1,
        y + textureNoise(particle.textureSeed + 3, i) * radius * 0.5,
        radius * 0.72,
        y + textureNoise(particle.textureSeed + 6, i) * radius * 0.32
      );
      ctx.stroke();
    }

    drawCraters(radius, particle.textureSeed, isAsteroid ? 7 : 4, particle.color, isAsteroid ? 0.9 : 0.65);
    ctx.restore();
  }

  function drawMoonBody(particle, radius, tierName) {
    const baseShift = 18;
    const base = shadeColor(particle.color, baseShift);
    const light = shadeColor(particle.color, 80);
    const dark = shadeColor(particle.color, -70);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.textureSeed * 0.18 + finiteOr(particle.rotation, 0));

    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.04, 0, 0, radius);
    gradient.addColorStop(0, colorString(light, 0.96));
    gradient.addColorStop(0.52, colorString(base, 0.98));
    gradient.addColorStop(1, colorString(dark, 0.98));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = colorString(dark, 0.16);
    ctx.lineWidth = Math.max(1.4, radius * 0.045);
    for (let i = 0; i < 4; i += 1) {
      const y = -radius * 0.45 + i * radius * 0.3;
      ctx.beginPath();
      ctx.ellipse(0, y, radius * 0.9, radius * 0.12, textureNoise(particle.textureSeed, i) * 0.4 - 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawCraters(radius, particle.textureSeed, 11, particle.color, 0.92);
    ctx.restore();
  }

  function drawPlanetBody(particle, radius) {
    const light = shadeColor(particle.color, 84);
    const mid = shadeColor(particle.color, 8);
    const dark = shadeColor(particle.color, -76);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.textureSeed * 0.12 + finiteOr(particle.rotation, 0));

    const gradient = ctx.createRadialGradient(-radius * 0.4, -radius * 0.36, radius * 0.02, 0, 0, radius);
    gradient.addColorStop(0, colorString(light, 0.98));
    gradient.addColorStop(0.55, colorString(mid, 0.98));
    gradient.addColorStop(1, colorString(dark, 0.98));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();

    for (let i = 0; i < 7; i += 1) {
      const y = -radius * 0.62 + i * radius * 0.21;
      const bandColor = i % 2 === 0 ? shadeColor(particle.color, 46) : shadeColor(particle.color, -34);
      ctx.fillStyle = colorString(bandColor, 0.2);
      ctx.beginPath();
      ctx.ellipse(0, y, radius * 1.12, radius * (0.05 + Math.abs(textureNoise(particle.textureSeed, i)) * 0.035), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.strokeStyle = colorString(light, 0.32);
    ctx.lineWidth = Math.max(1.6, radius * 0.045);
    ctx.beginPath();
    ctx.arc(0, 0, radius + Math.max(4, radius * 0.07), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawStarBody(particle, radius, time) {
    const birthProgress = clamp(
      finiteOr(particle.starBirthAge, starBirthTransitionDuration) / Math.max(0.001, starBirthTransitionDuration),
      0,
      1
    );
    const birthEase = 1 - Math.pow(1 - birthProgress, 3);
    const coreRadius = radius * (0.68 + birthEase * 0.32);
    const coronaPulse = 1 + Math.sin(time * 0.006 + particle.textureSeed) * 0.055;
    const coronaRadius = radius * (2.05 + (1 - birthProgress) * 1.15) * coronaPulse;
    const coreColor = { r: 255, g: 242, b: 178 };
    const midColor = mixColor({ r: 255, g: 178, b: 70 }, particle.color, 4, 1);
    const rimColor = mixColor({ r: 255, g: 85, b: 58 }, particle.color, 3, 1);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(finiteOr(particle.rotation, 0) + particle.textureSeed * 0.013);
    ctx.globalCompositeOperation = "lighter";

    const corona = ctx.createRadialGradient(0, 0, radius * 0.18, 0, 0, coronaRadius);
    corona.addColorStop(0, colorString(coreColor, 0.5));
    corona.addColorStop(0.28, colorString(midColor, 0.24));
    corona.addColorStop(1, colorString(rimColor, 0));
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(0, 0, coronaRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = "round";
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18 + Math.sin(time * 0.0014 + particle.textureSeed + i) * 0.08;
      const inner = radius * randomStarRayInner(i, particle.textureSeed);
      const outer = radius * (1.18 + Math.abs(textureNoise(particle.textureSeed, i + 31)) * 0.72 + (1 - birthProgress) * 0.65);
      ctx.strokeStyle = colorString(i % 3 === 0 ? coreColor : midColor, 0.13 + (1 - birthProgress) * 0.12);
      ctx.lineWidth = Math.max(2, radius * (0.012 + Math.abs(textureNoise(particle.textureSeed, i + 11)) * 0.012));
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    const surface = ctx.createRadialGradient(-coreRadius * 0.28, -coreRadius * 0.33, coreRadius * 0.08, 0, 0, coreRadius);
    surface.addColorStop(0, colorString(coreColor, 1));
    surface.addColorStop(0.44, colorString(midColor, 0.98));
    surface.addColorStop(1, colorString(rimColor, 0.98));
    ctx.fillStyle = surface;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i += 1) {
      const y = -coreRadius * 0.58 + i * coreRadius * 0.2;
      const wave = Math.sin(time * 0.003 + particle.textureSeed + i) * coreRadius * 0.08;
      ctx.strokeStyle = colorString(i % 2 ? { r: 255, g: 116, b: 68 } : coreColor, 0.22);
      ctx.lineWidth = Math.max(2, coreRadius * 0.032);
      ctx.beginPath();
      ctx.ellipse(wave, y, coreRadius * 1.12, coreRadius * 0.08, textureNoise(particle.textureSeed, i) * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (birthProgress < 1) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 228, 138, " + (0.55 * (1 - birthProgress)) + ")";
      ctx.lineWidth = Math.max(4, radius * (0.08 - birthProgress * 0.035));
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.74 + birthProgress * 2.35), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function randomStarRayInner(index, seed) {
    return 0.72 + Math.abs(textureNoise(seed, index + 77)) * 0.22;
  }
