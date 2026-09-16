  function drawStellarRemnantBody(particle, radius, time) {
    const tierName = particle && particle.tier ? particle.tier.name : "";
    const isBlackHole = tierName === "black hole";
    const isNeutron = tierName === "neutron star";
    const coreColor = isBlackHole
      ? { r: 4, g: 6, b: 15 }
      : isNeutron
        ? { r: 172, g: 238, b: 255 }
        : { r: 244, g: 250, b: 255 };
    const rimColor = isBlackHole
      ? { r: 122, g: 80, b: 255 }
      : isNeutron
        ? { r: 98, g: 226, b: 255 }
        : { r: 180, g: 224, b: 255 };
    const pulse = 1 + Math.sin(time * (isNeutron ? 0.014 : 0.006) + particle.textureSeed) * (isNeutron ? 0.08 : 0.035);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(finiteOr(particle.rotation, 0) + time * (isBlackHole ? 0.00018 : 0.00008));

    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * (isBlackHole ? 2.4 : 1.9));
    halo.addColorStop(0, colorString(rimColor, isBlackHole ? 0.22 : 0.5));
    halo.addColorStop(0.42, colorString(rimColor, isBlackHole ? 0.12 : 0.18));
    halo.addColorStop(1, colorString(rimColor, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (isBlackHole ? 2.4 : 1.9), 0, Math.PI * 2);
    ctx.fill();

    if (isBlackHole) {
      ctx.strokeStyle = "rgba(255, 210, 122, 0.72)";
      ctx.lineWidth = Math.max(4, radius * 0.09);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.45, radius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isNeutron) {
      ctx.strokeStyle = colorString(rimColor, 0.72);
      ctx.lineWidth = Math.max(3, radius * 0.055);
      ctx.beginPath();
      ctx.moveTo(-radius * 1.45, 0);
      ctx.lineTo(radius * 1.45, 0);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    const surface = ctx.createRadialGradient(-radius * 0.24, -radius * 0.28, radius * 0.04, 0, 0, radius * pulse);
    surface.addColorStop(0, colorString(isBlackHole ? { r: 60, g: 66, b: 98 } : { r: 255, g: 255, b: 255 }, 1));
    surface.addColorStop(0.48, colorString(coreColor, isBlackHole ? 0.98 : 0.96));
    surface.addColorStop(1, colorString(isBlackHole ? { r: 0, g: 0, b: 0 } : rimColor, 0.98));
    ctx.fillStyle = surface;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (isBlackHole ? 0.72 : 0.88) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOrbitRings(particle, time) {
    const rings = orbitRingsForBody(particle);
    if (!rings.length) {
      return;
    }

    const zoom = Math.max(0.001, finiteOr(cameraZoom, 1));
    const lineWidth = clamp(1.2 / zoom, 1.6, 3.8);
    const light = shadeColor(particle.color, 84);
    const rim = isStarBody(particle)
      ? { r: 255, g: 214, b: 118 }
      : mixColor(light, { r: 116, g: 244, b: 255 }, 2, 1);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(finiteOr(particle.rotation, 0) * 0.18);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (let i = rings.length - 1; i >= 0; i -= 1) {
      const radius = rings[i];
      const pulse = 0.72 + Math.sin(time * 0.0028 + finiteOr(particle.textureSeed, 0) + i * 1.7) * 0.16;
      const alpha = (isStarBody(particle) ? 0.13 : 0.16) + pulse * 0.045;
      ctx.strokeStyle = colorString(rim, alpha);
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([Math.max(16, radius * 0.11), Math.max(12, radius * 0.055)]);
      ctx.lineDashOffset = -time * (0.018 + i * 0.006) * (i % 2 ? -1 : 1);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = colorString(rim, alpha * 0.18);
      ctx.lineWidth = lineWidth * 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBody(particle, time) {
    const pulse = 1 + Math.sin(time * 0.004 * particle.pulse + particle.id) * 0.035;
    const spawnSizeScale = particle.tier.name === "particle" ? clamp(finiteOr(particle.spawnSizeScale, 1), 1, 1.18) : 1;
    const spawnVisual = particleSpawnVisualState(particle);
    const radius = particle.radius * pulse * spawnSizeScale * spawnVisual.scale;
    const lodRadius = particle.radius * spawnSizeScale * spawnVisual.scale;

    if (radius <= 0.05 || spawnVisual.alpha <= 0.005) {
      return;
    }

    ctx.save();
    ctx.globalAlpha *= spawnVisual.alpha;
    drawBodyPromotionEffect(particle, Math.max(particle.radius * spawnSizeScale * spawnVisual.scale, radius), time);
    drawOrbitRings(particle, time);

    if (particle.tier.name === "particle") {
      drawTinyParticle(particle, radius);
      ctx.restore();
      return;
    }

    if (particle.tier.name === "star") {
      drawStarBody(particle, radius, time);
      ctx.restore();
      return;
    }

    if (stellarOutcomeTierNames.includes(particle.tier.name)) {
      drawStellarRemnantBody(particle, radius, time);
      ctx.restore();
      return;
    }

    ctx.globalCompositeOperation = "source-over";

    if (shouldDrawSimpleBody(particle, lodRadius)) {
      drawSimpleBody(particle, radius, 0.96);
      drawBodyEnergyMeter(particle, radius);
      ctx.restore();
      return;
    }

    if (particle.tier.name === "rock" || particle.tier.name === "boulder" || particle.tier.name === "asteroid") {
      drawRockBody(particle, radius, particle.tier.name);
    } else if (particle.tier.name === "moon") {
      drawMoonBody(particle, radius, particle.tier.name);
    } else {
      drawPlanetBody(particle, radius);
    }

    drawBodyEnergyMeter(particle, radius);
    ctx.restore();
  }

  function drawBodyEnergyMeter(particle, radius) {
    if (!isStructureHostBody(particle)) {
      return;
    }

    normalizeBodyEnergy(particle);
    const maxEnergy = Math.max(1, finiteOr(particle.maxEnergy, maxEnergyForBody(particle)));
    const pct = clamp(finiteOr(particle.energy, maxEnergy) / maxEnergy, 0, 1);
    const meterRadius = clamp(radius * 0.24, 20, 44);
    const ringWidth = Math.max(5, meterRadius * 0.24);

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(0, 0, meterRadius * 0.2, 0, 0, meterRadius + 14);
    halo.addColorStop(0, pct > 0.35 ? "rgba(157, 255, 122, 0.36)" : "rgba(245, 214, 91, 0.34)");
    halo.addColorStop(0.55, pct > 0.35 ? "rgba(88, 226, 255, 0.16)" : "rgba(255, 115, 173, 0.14)");
    halo.addColorStop(1, "rgba(88, 226, 255, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(3, 8, 24, 0.68)";
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius + 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = ringWidth;
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = pct > 0.35 ? "#9dff7a" : "#f5d65b";
    ctx.shadowColor = pct > 0.35 ? "rgba(157, 255, 122, 0.72)" : "rgba(245, 214, 91, 0.68)";
    ctx.shadowBlur = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, meterRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(248, 251, 255, 0.92)";
    ctx.font = "900 " + Math.max(16, meterRadius * 0.7) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", 0, 1);
    ctx.restore();
  }

  function drawHealthPickup(pickup, time) {
    const fade = clamp(Math.min(pickup.life, 1.6) / 1.6, 0, 1);
    const bob = Math.sin(time * 0.006 + pickup.wobble) * 2.5;
    const pulse = 1 + Math.sin(time * 0.012 + pickup.wobble) * 0.08;

    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 34);
    glow.addColorStop(0, "rgba(123, 255, 173, 0.68)");
    glow.addColorStop(0.52, "rgba(85, 246, 151, 0.24)");
    glow.addColorStop(1, "rgba(85, 246, 151, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(14, 42, 34, 0.88)";
    ctx.strokeStyle = "rgba(198, 255, 219, 0.94)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#75ff9e";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawTechPickup(pickup, time) {
    const fade = clamp(Math.min(pickup.life, 1.8) / 1.8, 0, 1);
    const bob = Math.sin(time * 0.0065 + pickup.wobble) * 3;
    const size = pickup.radius;

    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    ctx.rotate(pickup.rotation);
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 38);
    glow.addColorStop(0, "rgba(255, 115, 173, 0.58)");
    glow.addColorStop(0.5, "rgba(88, 226, 255, 0.22)");
    glow.addColorStop(1, "rgba(88, 226, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(11, 18, 38, 0.92)";
    ctx.strokeStyle = pickup.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-1, 4);
    ctx.lineTo(7, -6);
    ctx.moveTo(-7, 7);
    ctx.lineTo(7, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawBossMobEmbellishments(mob, time) {
    if (!mob || !mob.isBoss) {
      return;
    }

    const color = mob.color || { r: 255, g: 115, b: 173 };
    const pulse = 0.76 + Math.sin(time * 0.012 + finiteOr(mob.wobble, 0)) * 0.18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(color, 0.46 + pulse * 0.18);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 62 + Math.sin(time * 0.008) * 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(color, 80), 0.62);
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4 + time * 0.0015;
      const inner = 54;
      const outer = 72 + (i % 2) * 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle - 0.08) * inner, Math.sin(angle - 0.08) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.lineTo(Math.cos(angle + 0.08) * inner, Math.sin(angle + 0.08) * inner);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBossNameplateStar(x, y, radius, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const pointRadius = i % 2 === 0 ? radius : radius * 0.46;
      const px = x + Math.cos(angle) * pointRadius;
      const py = y + Math.sin(angle) * pointRadius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = colorString(shadeColor(color, 82), 0.96);
    ctx.strokeStyle = "rgba(7, 12, 26, 0.82)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  function drawBossNameplate(mob, time) {
    if (!mob || mob.health <= 0) {
      return;
    }

    const stars = mob.isBoss ? bossStarRank(mob) : mobEliteStarRank(mob);
    if (!mob.isBoss && stars <= 0) {
      return;
    }
    const visibleStars = Math.min(5, stars);
    const extraStars = Math.max(0, stars - visibleStars);
    const color = mob.color || { r: 255, g: 115, b: 173 };
    const label = mob.isBoss ? mobBossLabel(mob.kind) : mobName(mob);
    const baseY = mob.y - Math.max(82, finiteOr(mob.radius, 34) * 1.65);

    ctx.save();
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelWidth = ctx.measureText(label).width;
    const starWidth = visibleStars > 0 ? visibleStars * 14 + Math.max(0, visibleStars - 1) * 3 + (extraStars > 0 ? 26 : 0) : 0;
    const boxWidth = Math.max(labelWidth, starWidth) + 20;
    const boxHeight = visibleStars > 0 ? 36 : 22;
    const boxX = mob.x - boxWidth / 2;
    const boxY = baseY - boxHeight / 2 + Math.sin(time * 0.004 + finiteOr(mob.wobble, 0)) * 1.5;

    ctx.fillStyle = "rgba(4, 9, 22, 0.72)";
    ctx.strokeStyle = colorString(shadeColor(color, 70), 0.76);
    ctx.lineWidth = 2;
    roundRectPath(boxX, boxY, boxWidth, boxHeight, 7);
    ctx.fill();
    ctx.stroke();

    if (visibleStars > 0) {
      const totalStarWidth = visibleStars * 14 + Math.max(0, visibleStars - 1) * 3;
      let starX = mob.x - totalStarWidth / 2 + 7;
      if (extraStars > 0) {
        starX -= 13;
      }
      for (let i = 0; i < visibleStars; i += 1) {
        drawBossNameplateStar(starX + i * 17, boxY + 11, 6, color);
      }
      if (extraStars > 0) {
        ctx.fillStyle = "rgba(248, 251, 255, 0.94)";
        ctx.font = "900 10px sans-serif";
        ctx.fillText("+" + extraStars, starX + totalStarWidth + 11, boxY + 11);
        ctx.font = "900 13px sans-serif";
      }
    }

    ctx.fillStyle = "rgba(248, 251, 255, 0.94)";
    ctx.fillText(label, mob.x, boxY + boxHeight - 10);
    ctx.restore();
  }
