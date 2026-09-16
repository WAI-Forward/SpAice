  function drawMobBeaconGlyph(beacon, visual, accent, coreRadius, time) {
    const shape = visual.shape || "eye";
    if (shape === "saucer") {
      ctx.fillStyle = colorString(accent, 0.92);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, coreRadius * 0.82, coreRadius * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colorString(shadeColor(visual.color, -28), 0.95);
      ctx.beginPath();
      ctx.arc(0, -coreRadius * 0.16, coreRadius * 0.34, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (shape === "gear") {
      ctx.fillStyle = colorString(accent, 0.92);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i += 1) {
        ctx.save();
        ctx.rotate(i * Math.PI / 4);
        roundRectPath(-4, -coreRadius * 0.92, 8, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.18, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (shape === "cross") {
      ctx.fillStyle = colorString(accent, 0.94);
      ctx.strokeStyle = "#0f1b22";
      ctx.lineWidth = 4;
      roundRectPath(-7, -coreRadius * 0.72, 14, coreRadius * 1.44, 5);
      ctx.fill();
      ctx.stroke();
      roundRectPath(-coreRadius * 0.72, -7, coreRadius * 1.44, 14, 5);
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (shape === "bolt") {
      ctx.fillStyle = colorString(accent, 0.96);
      ctx.strokeStyle = "#102012";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(4, -coreRadius * 0.86);
      ctx.lineTo(-14, -2);
      ctx.lineTo(1, -2);
      ctx.lineTo(-5, coreRadius * 0.82);
      ctx.lineTo(18, -9);
      ctx.lineTo(4, -9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (shape === "dish") {
      ctx.strokeStyle = colorString(accent, 0.94);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(-4, 2, coreRadius * 0.62, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(coreRadius * 0.62, -coreRadius * 0.46);
      ctx.moveTo(4, 2);
      ctx.lineTo(coreRadius * 0.62, coreRadius * 0.46);
      ctx.stroke();
      ctx.fillStyle = colorString(accent, 0.9);
      ctx.beginPath();
      ctx.arc(-coreRadius * 0.42, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (shape === "flame") {
      const flare = Math.sin(time * 0.018 + beacon.wobble) * 3;
      ctx.fillStyle = colorString(accent, 0.95);
      ctx.strokeStyle = "#2b1508";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -coreRadius * 0.92);
      ctx.bezierCurveTo(coreRadius * 0.58, -coreRadius * 0.34, coreRadius * 0.34, coreRadius * 0.42, 0, coreRadius * 0.78 + flare);
      ctx.bezierCurveTo(-coreRadius * 0.4, coreRadius * 0.38, -coreRadius * 0.54, -coreRadius * 0.24, 0, -coreRadius * 0.92);
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (shape === "chevron") {
      ctx.strokeStyle = colorString(accent, 0.96);
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-coreRadius * 0.58, coreRadius * 0.48);
      ctx.lineTo(0, -coreRadius * 0.52);
      ctx.lineTo(coreRadius * 0.58, coreRadius * 0.48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-coreRadius * 0.36, coreRadius * 0.02);
      ctx.lineTo(0, -coreRadius * 0.58);
      ctx.lineTo(coreRadius * 0.36, coreRadius * 0.02);
      ctx.stroke();
      return;
    }

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.strokeStyle = "#241021";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, coreRadius * 0.74, coreRadius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#241021";
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMobBeacon(beacon, time) {
    if (!isMobBeaconRevealed(beacon)) {
      return;
    }

    const visual = mobBeaconVisual(beacon.beaconKind);
    const color = beacon.flash > 0 ? { r: 255, g: 246, b: 210 } : visual.color;
    const accent = visual.accent || shadeColor(color, 52);
    const radius = finiteOr(beacon.radius, 46);
    const pulse = 1 + Math.sin(time * 0.007 + finiteOr(beacon.wobble, 0)) * 0.045;
    const warmup = clamp(finiteOr(beacon.age, 0) / mobBeaconWarmupDuration, 0, 1);

    ctx.save();
    ctx.translate(beacon.x, beacon.y + Math.sin(time * 0.004 + beacon.wobble) * 8);
    ctx.rotate(finiteOr(beacon.rotation, 0));
    ctx.scale(pulse, pulse);

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, radius * 0.22, 0, 0, radius * (2.5 + warmup * 0.5));
    glow.addColorStop(0, colorString(color, 0.26 + warmup * 0.18));
    glow.addColorStop(1, colorString(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = colorString(color, 0.52);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * warmup);
    ctx.stroke();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 6;
    ctx.fillStyle = colorString(shadeColor(color, -46), 0.94);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 3;
      const pointRadius = radius * (i % 2 ? 0.78 : 1);
      const x = Math.cos(angle) * pointRadius;
      const y = Math.sin(angle) * pointRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(color, 0.86);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
    ctx.fill();
    drawMobBeaconGlyph(beacon, visual, accent, radius * 0.52, time);

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(beacon.health / beacon.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
      roundRectPath(-radius * 0.86, -radius * 1.48, radius * 1.72, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-radius * 0.86, -radius * 1.48, radius * 1.72 * healthPct, 7, 3.5);
      ctx.fill();
    }

    ctx.restore();
  }

