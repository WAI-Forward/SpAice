  function hslaColor(hue, saturation, lightness, alpha) {
    const wrappedHue = ((finiteOr(hue, 0) % 360) + 360) % 360;
    return "hsla(" + Math.round(wrappedHue) + ", " + saturation + "%, " + lightness + "%, " + alpha + ")";
  }

  function rgbaColor(red, green, blue, alpha) {
    return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
  }

  function trailSeedNoise(seed, salt) {
    return 0.5 + Math.sin(finiteOr(seed, 0) * 12.9898 + finiteOr(salt, 0) * 78.233) * 0.5;
  }

  function trailParticleProgress(puff) {
    return clamp(finiteOr(puff && puff.renderT, 0), 0, 1);
  }

  function drawHeartPathOn(targetCtx, size) {
    targetCtx.beginPath();
    targetCtx.moveTo(0, size * 0.54);
    targetCtx.bezierCurveTo(-size * 0.82, -size * 0.04, -size * 0.74, -size * 0.74, -size * 0.22, -size * 0.58);
    targetCtx.bezierCurveTo(-size * 0.04, -size * 0.52, 0, -size * 0.32, 0, -size * 0.22);
    targetCtx.bezierCurveTo(0, -size * 0.32, size * 0.04, -size * 0.52, size * 0.22, -size * 0.58);
    targetCtx.bezierCurveTo(size * 0.74, -size * 0.74, size * 0.82, -size * 0.04, 0, size * 0.54);
    targetCtx.closePath();
  }

  function drawBatShapeOn(targetCtx, size, alpha) {
    targetCtx.fillStyle = "rgba(25, 23, 42, " + alpha + ")";
    targetCtx.strokeStyle = rgbaColor(169, 133, 255, alpha * 0.42);
    targetCtx.lineWidth = Math.max(0.8, size * 0.07);
    targetCtx.beginPath();
    targetCtx.moveTo(0, -size * 0.18);
    targetCtx.bezierCurveTo(-size * 0.18, -size * 0.48, -size * 0.46, -size * 0.46, -size * 0.64, -size * 0.16);
    targetCtx.quadraticCurveTo(-size * 0.48, -size * 0.08, -size * 0.42, size * 0.16);
    targetCtx.quadraticCurveTo(-size * 0.22, size * 0.04, -size * 0.08, size * 0.32);
    targetCtx.quadraticCurveTo(0, size * 0.16, size * 0.08, size * 0.32);
    targetCtx.quadraticCurveTo(size * 0.22, size * 0.04, size * 0.42, size * 0.16);
    targetCtx.quadraticCurveTo(size * 0.48, -size * 0.08, size * 0.64, -size * 0.16);
    targetCtx.bezierCurveTo(size * 0.46, -size * 0.46, size * 0.18, -size * 0.48, 0, -size * 0.18);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
  }

  function drawWaterTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const t = trailParticleProgress(puff);
    const fade = clamp((1 - t) * 1.28, 0, 1);
    const drift = time * 0.0048 + seed;
    targetCtx.globalCompositeOperation = "lighter";

    for (let bubble = 0; bubble < 2; bubble += 1) {
      const bubbleSeed = seed + bubble * 1.91;
      const angle = bubbleSeed + drift * (0.9 + bubble * 0.22);
      const distance = size * (0.44 + bubble * 0.48 + trailSeedNoise(seed, bubble) * 0.34);
      const bubbleSize = size * (0.13 + trailSeedNoise(seed, bubble + 4) * 0.14) * (0.85 + fade * 0.15);
      const bubbleAlpha = alpha * fade * (0.24 + bubble * 0.08);
      targetCtx.fillStyle = rgbaColor(184, 241, 255, bubbleAlpha * 0.28);
      targetCtx.beginPath();
      targetCtx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance * 0.62, Math.max(0.75, bubbleSize), 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.strokeStyle = rgbaColor(235, 255, 255, bubbleAlpha * 0.82);
      targetCtx.lineWidth = Math.max(0.65, bubbleSize * 0.16);
      targetCtx.stroke();
    }

    if (trailSeedNoise(seed, 8.2) > 0.42) {
      const dropletLength = Math.max(2.2, size * (0.56 + trailSeedNoise(seed, 9.4) * 0.34));
      const dropletWidth = Math.max(0.8, size * (0.12 + trailSeedNoise(seed, 3.8) * 0.08));
      targetCtx.fillStyle = rgbaColor(164, 235, 255, alpha * fade * 0.3);
      targetCtx.beginPath();
      targetCtx.ellipse(
        Math.sin(drift * 1.2) * size * 0.28,
        Math.cos(drift) * size * 0.2,
        dropletWidth,
        dropletLength,
        seed + time * 0.003,
        0,
        Math.PI * 2
      );
      targetCtx.fill();

      targetCtx.strokeStyle = rgbaColor(245, 255, 255, alpha * fade * 0.28);
      targetCtx.lineWidth = Math.max(0.7, dropletWidth * 0.42);
      targetCtx.lineCap = "round";
      targetCtx.beginPath();
      targetCtx.arc(0, 0, dropletLength * 0.72, seed + t, seed + t + Math.PI * 0.7);
      targetCtx.stroke();
    }
  }

  function drawMagicTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const hue = 268 + Math.sin(seed * 2.11 + time * 0.003) * 34;
    const t = trailParticleProgress(puff);
    targetCtx.globalCompositeOperation = "lighter";
    targetCtx.fillStyle = hslaColor(hue, 96, 77, alpha * 0.9);
    targetCtx.strokeStyle = hslaColor(hue + 42, 96, 88, alpha * 0.72);
    targetCtx.lineWidth = Math.max(0.8, size * 0.11);
    targetCtx.beginPath();
    targetCtx.moveTo(0, -size);
    targetCtx.lineTo(size * 0.22, -size * 0.22);
    targetCtx.lineTo(size, 0);
    targetCtx.lineTo(size * 0.22, size * 0.22);
    targetCtx.lineTo(0, size);
    targetCtx.lineTo(-size * 0.22, size * 0.22);
    targetCtx.lineTo(-size, 0);
    targetCtx.lineTo(-size * 0.22, -size * 0.22);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
    targetCtx.fillStyle = hslaColor(hue + 84, 92, 92, alpha * 0.88);
    targetCtx.beginPath();
    targetCtx.arc(size * 0.7, -size * 0.56, Math.max(1.1, size * 0.16), 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.strokeStyle = hslaColor(hue + 120, 88, 84, alpha * 0.34 * (1 - t * 0.3));
    targetCtx.lineWidth = Math.max(0.75, size * 0.07);
    targetCtx.beginPath();
    targetCtx.arc(0, 0, size * (1.08 + t * 0.28), seed, seed + Math.PI * 1.55);
    targetCtx.stroke();
    for (let mote = 0; mote < 3; mote += 1) {
      const angle = time * 0.006 + seed + mote * Math.PI * 2 / 3;
      const distance = size * (0.8 + mote * 0.18);
      const moteSize = Math.max(0.9, size * (0.1 + trailSeedNoise(seed, mote + 7) * 0.12));
      targetCtx.fillStyle = hslaColor(hue + mote * 38, 94, 88, alpha * (0.42 + mote * 0.09));
      targetCtx.beginPath();
      targetCtx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, moteSize, 0, Math.PI * 2);
      targetCtx.fill();
    }
  }

  function drawRainbowTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const hue = seed * 49 + time * 0.045;
    const t = trailParticleProgress(puff);
    targetCtx.globalCompositeOperation = "lighter";
    targetCtx.lineCap = "round";
    const sparkleAlpha = alpha * (0.18 + (1 - t) * 0.42);
    const pixel = Math.max(1.4, size * 0.24);
    targetCtx.fillStyle = hslaColor(hue, 98, 74, sparkleAlpha);
    targetCtx.fillRect(-pixel * 0.5, -pixel * 0.5, pixel, pixel);
    if (trailSeedNoise(seed, 3.4) > 0.42) {
      drawPixelSparkOn(targetCtx, Math.sin(time * 0.003 + seed) * size * 0.72, Math.cos(time * 0.004 + seed) * size * 0.72, Math.max(1, pixel * 0.72), sparkleAlpha * 0.76);
    }
  }

  function drawPlasmaTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const flicker = 0.84 + Math.sin(time * 0.017 + seed) * 0.16;
    const t = trailParticleProgress(puff);
    targetCtx.globalCompositeOperation = "lighter";
    const glow = targetCtx.createRadialGradient(0, 0, 0, 0, 0, size * 1.54);
    glow.addColorStop(0, rgbaColor(250, 255, 255, alpha * flicker));
    glow.addColorStop(0.34, rgbaColor(100, 227, 255, alpha * 0.82));
    glow.addColorStop(0.72, rgbaColor(255, 115, 255, alpha * 0.44));
    glow.addColorStop(1, rgbaColor(65, 29, 160, 0));
    targetCtx.fillStyle = glow;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, size, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.strokeStyle = rgbaColor(236, 255, 255, alpha * 0.82);
    targetCtx.lineWidth = Math.max(0.9, size * 0.16);
    targetCtx.beginPath();
    targetCtx.moveTo(-size * 0.62, -size * 0.18);
    targetCtx.lineTo(-size * 0.1, size * 0.08 + Math.sin(seed) * size * 0.16);
    targetCtx.lineTo(size * 0.28, -size * 0.06);
    targetCtx.lineTo(size * 0.64, size * 0.18);
    targetCtx.stroke();

    targetCtx.strokeStyle = rgbaColor(255, 115, 255, alpha * 0.48 * flicker * (1 - t * 0.2));
    targetCtx.lineWidth = Math.max(0.75, size * 0.1);
    for (let fork = 0; fork < 3; fork += 1) {
      const angle = seed + fork * Math.PI * 2 / 3 + time * 0.006;
      const mid = size * (0.42 + trailSeedNoise(seed, fork) * 0.28);
      const outer = size * (1.1 + trailSeedNoise(seed, fork + 4) * 0.5);
      targetCtx.beginPath();
      targetCtx.moveTo(Math.cos(angle) * mid * 0.35, Math.sin(angle) * mid * 0.35);
      targetCtx.lineTo(Math.cos(angle + 0.22) * mid, Math.sin(angle + 0.22) * mid);
      targetCtx.lineTo(Math.cos(angle - 0.18) * outer, Math.sin(angle - 0.18) * outer);
      targetCtx.stroke();
    }
  }

  function drawSnowTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const armCount = 6;
    const t = trailParticleProgress(puff);
    targetCtx.globalCompositeOperation = "lighter";
    const haze = targetCtx.createRadialGradient(0, 0, 0, 0, 0, size * 1.8);
    haze.addColorStop(0, rgbaColor(255, 255, 255, alpha * 0.16));
    haze.addColorStop(0.68, rgbaColor(185, 245, 255, alpha * 0.12));
    haze.addColorStop(1, rgbaColor(185, 245, 255, 0));
    targetCtx.fillStyle = haze;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.strokeStyle = rgbaColor(232, 255, 255, alpha * 0.86);
    targetCtx.lineWidth = Math.max(0.85, size * 0.12);
    targetCtx.lineCap = "round";
    for (let arm = 0; arm < armCount; arm += 1) {
      const angle = arm * Math.PI * 2 / armCount + Math.sin(time * 0.002 + seed) * 0.08;
      const outerX = Math.cos(angle) * size;
      const outerY = Math.sin(angle) * size;
      targetCtx.beginPath();
      targetCtx.moveTo(0, 0);
      targetCtx.lineTo(outerX, outerY);
      targetCtx.stroke();
      const branchAngle = angle + 0.58;
      const branchBaseX = Math.cos(angle) * size * 0.55;
      const branchBaseY = Math.sin(angle) * size * 0.55;
      targetCtx.beginPath();
      targetCtx.moveTo(branchBaseX, branchBaseY);
      targetCtx.lineTo(branchBaseX + Math.cos(branchAngle) * size * 0.22, branchBaseY + Math.sin(branchAngle) * size * 0.22);
      targetCtx.stroke();
    }
    targetCtx.fillStyle = rgbaColor(255, 255, 255, alpha * 0.9);
    targetCtx.beginPath();
    targetCtx.arc(0, 0, Math.max(1.1, size * 0.18), 0, Math.PI * 2);
    targetCtx.fill();

    for (let flurry = 0; flurry < 4; flurry += 1) {
      const angle = seed * 0.7 + flurry * Math.PI * 0.5 + time * 0.0018;
      const distance = size * (0.88 + flurry * 0.22 + t * 0.8);
      targetCtx.fillStyle = rgbaColor(255, 255, 255, alpha * (0.18 + flurry * 0.04) * (1 - t * 0.38));
      targetCtx.beginPath();
      targetCtx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, Math.max(0.7, size * 0.08), 0, Math.PI * 2);
      targetCtx.fill();
    }
  }

  function drawBatTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const flap = 0.88 + Math.sin(time * 0.018 + seed * 2.4) * 0.18;
    const t = trailParticleProgress(puff);
    const moon = targetCtx.createRadialGradient(-size * 0.34, -size * 0.2, 0, -size * 0.34, -size * 0.2, size * 1.6);
    moon.addColorStop(0, rgbaColor(169, 133, 255, alpha * 0.24));
    moon.addColorStop(1, rgbaColor(64, 45, 118, 0));
    targetCtx.fillStyle = moon;
    targetCtx.beginPath();
    targetCtx.arc(-size * 0.34, -size * 0.2, size * 1.6, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.globalAlpha = finiteOr(targetCtx.globalAlpha, 1) * alpha;
    targetCtx.scale(1, flap);
    drawBatShapeOn(targetCtx, size, 1);
    for (let mini = 0; mini < 2; mini += 1) {
      const angle = seed + mini * Math.PI * 1.4 + time * 0.004;
      const miniScale = 0.34 + trailSeedNoise(seed, mini + 5) * 0.2;
      targetCtx.save();
      targetCtx.translate(Math.cos(angle) * size * (1.1 + t * 0.4), Math.sin(angle) * size * (0.72 + t * 0.2));
      targetCtx.rotate(Math.sin(angle) * 0.5);
      targetCtx.scale(miniScale, miniScale * (0.92 + Math.sin(time * 0.02 + seed + mini) * 0.14));
      drawBatShapeOn(targetCtx, size, 0.58 * (1 - t * 0.35));
      targetCtx.restore();
    }
  }

  function drawHeartTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const hue = 338 + Math.sin(seed * 1.8 + time * 0.004) * 16;
    const t = trailParticleProgress(puff);
    targetCtx.globalCompositeOperation = "lighter";
    targetCtx.fillStyle = hslaColor(hue, 96, 66, alpha * 0.9);
    targetCtx.strokeStyle = hslaColor(hue + 18, 96, 86, alpha * 0.5);
    targetCtx.lineWidth = Math.max(0.8, size * 0.09);
    drawHeartPathOn(targetCtx, size);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.strokeStyle = hslaColor(hue + 38, 88, 86, alpha * 0.28 * (1 - t));
    targetCtx.lineWidth = Math.max(0.8, size * 0.08);
    targetCtx.beginPath();
    targetCtx.arc(0, -size * 0.04, size * (0.96 + t * 0.8), 0, Math.PI * 2);
    targetCtx.stroke();
    for (let small = 0; small < 2; small += 1) {
      const angle = seed + small * Math.PI + time * 0.003;
      const smallSize = size * (0.26 + trailSeedNoise(seed, small + 9) * 0.16);
      targetCtx.save();
      targetCtx.translate(Math.cos(angle) * size * (0.9 + t * 0.35), Math.sin(angle) * size * 0.7 - size * t * 0.35);
      targetCtx.rotate(Math.sin(angle) * 0.5);
      targetCtx.fillStyle = hslaColor(hue + small * 22, 96, 72, alpha * 0.52 * (1 - t * 0.28));
      drawHeartPathOn(targetCtx, smallSize);
      targetCtx.fill();
      targetCtx.restore();
    }
  }

  function drawFlowerTrailParticleOn(targetCtx, size, alpha, seed, time, puff) {
    const hue = seed % 3 === 0 ? 326 : seed % 3 === 1 ? 42 : 158;
    const t = trailParticleProgress(puff);
    targetCtx.globalCompositeOperation = "source-over";
    targetCtx.strokeStyle = rgbaColor(102, 224, 184, alpha * 0.45 * (1 - t * 0.25));
    targetCtx.lineWidth = Math.max(0.85, size * 0.08);
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(-size * 0.95, size * 0.22);
    targetCtx.quadraticCurveTo(-size * 0.26, -size * (0.34 + t * 0.22), size * 0.74, -size * 0.08);
    targetCtx.stroke();

    for (let petal = 0; petal < 5; petal += 1) {
      const angle = petal * Math.PI * 2 / 5 + Math.sin(time * 0.0025 + seed) * 0.08;
      targetCtx.save();
      targetCtx.rotate(angle);
      targetCtx.fillStyle = hslaColor(hue + petal * 8, 84, 72, alpha * 0.76);
      targetCtx.beginPath();
      targetCtx.ellipse(size * 0.38, 0, size * (0.24 + trailSeedNoise(seed, petal) * 0.18), size * (0.12 + trailSeedNoise(seed, petal + 8) * 0.09), 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
    targetCtx.fillStyle = rgbaColor(255, 216, 77, alpha * 0.92);
    targetCtx.beginPath();
    targetCtx.arc(0, 0, Math.max(1.2, size * 0.23), 0, Math.PI * 2);
    targetCtx.fill();

    for (let loose = 0; loose < 3; loose += 1) {
      const angle = seed * 0.8 + loose * Math.PI * 0.72 + time * 0.002;
      const distance = size * (0.88 + loose * 0.3 + t * 0.65);
      targetCtx.save();
      targetCtx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance * 0.74);
      targetCtx.rotate(angle + time * 0.003);
      targetCtx.fillStyle = hslaColor(hue + loose * 24, 84, 74, alpha * 0.42 * (1 - t * 0.35));
      targetCtx.beginPath();
      targetCtx.ellipse(0, 0, Math.max(1, size * 0.18), Math.max(0.8, size * 0.08), 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
  }

