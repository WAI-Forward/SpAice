  function drawClassicJetpackFlamePlumesOn(targetCtx, time, exhaust, boost) {
    const boostAmount = clamp(finiteOr(boost, 0), 0, 1);
    const boostScale = 1 + boostAmount * 0.38;
    const exhaustAngle = Math.atan2(finiteOr(exhaust.y, 1), finiteOr(exhaust.x, 0)) - Math.PI / 2;
    const flicker = clamp(
      0.9 + Math.sin(time * 0.031) * 0.14 + Math.sin(time * 0.087 + finiteOr(exhaust.x, 0) * 2.7) * 0.09,
      0.68,
      1.18
    );

    targetCtx.save();
    targetCtx.globalCompositeOperation = "lighter";

    for (const x of [-16, 16]) {
      const splay = x < 0 ? -0.08 : 0.08;
      const plumeLength = (34 + boostAmount * 20) * boostScale * flicker;
      const widthSize = (8.5 + boostAmount * 3.2) * (0.92 + Math.sin(time * 0.052 + x) * 0.08);
      const outerLength = plumeLength * (1.18 + Math.sin(time * 0.066 + x * 0.4) * 0.08);

      targetCtx.save();
      targetCtx.translate(x, 43);
      targetCtx.rotate(exhaustAngle + splay);

      const glow = targetCtx.createRadialGradient(0, outerLength * 0.42, 0, 0, outerLength * 0.5, outerLength * 0.72);
      glow.addColorStop(0, "rgba(255, 207, 64, " + (0.36 + boostAmount * 0.18) + ")");
      glow.addColorStop(0.46, "rgba(255, 151, 38, " + (0.2 + boostAmount * 0.14) + ")");
      glow.addColorStop(1, "rgba(255, 101, 24, 0)");
      targetCtx.fillStyle = glow;
      targetCtx.beginPath();
      targetCtx.ellipse(0, outerLength * 0.5, widthSize * 2.3, outerLength * 0.58, 0, 0, Math.PI * 2);
      targetCtx.fill();

      const plume = targetCtx.createLinearGradient(0, 2, 0, plumeLength);
      plume.addColorStop(0, "rgba(255, 244, 106, " + (0.95 + boostAmount * 0.05) + ")");
      plume.addColorStop(0.24, "rgba(255, 205, 58, " + (0.78 + boostAmount * 0.16) + ")");
      plume.addColorStop(0.58, "rgba(255, 137, 45, " + (0.5 + boostAmount * 0.18) + ")");
      plume.addColorStop(1, "rgba(255, 82, 24, 0)");
      targetCtx.fillStyle = plume;
      targetCtx.beginPath();
      targetCtx.moveTo(-widthSize, 3);
      targetCtx.quadraticCurveTo(-widthSize * 0.42, plumeLength * 0.42, -widthSize * 0.16, plumeLength * 0.72);
      targetCtx.quadraticCurveTo(0, plumeLength * (0.92 + boostAmount * 0.08), widthSize * 0.18, plumeLength * 0.7);
      targetCtx.quadraticCurveTo(widthSize * 0.5, plumeLength * 0.36, widthSize, 3);
      targetCtx.closePath();
      targetCtx.fill();

      targetCtx.strokeStyle = "rgba(255, 238, 84, " + (0.34 + boostAmount * 0.2) + ")";
      targetCtx.lineWidth = 1.5 + boostAmount * 0.5;
      targetCtx.beginPath();
      targetCtx.moveTo(-widthSize * 0.34, 9);
      targetCtx.quadraticCurveTo(-widthSize * 0.16, plumeLength * 0.36, -widthSize * 0.05, plumeLength * 0.72);
      targetCtx.stroke();
      targetCtx.beginPath();
      targetCtx.moveTo(widthSize * 0.34, 8);
      targetCtx.quadraticCurveTo(widthSize * 0.16, plumeLength * 0.34, widthSize * 0.04, plumeLength * 0.66);
      targetCtx.stroke();
      targetCtx.restore();
    }

    targetCtx.restore();
  }

  const decorativeBoostTrailStyles = Object.freeze({
    "trail-water": {
      type: "water",
      emitInterval: 24,
      life: 640,
      speed: 138,
      sideSpeed: 4,
      radius: 3.6,
      growth: 0.38,
      scaleMin: 0.42,
      scaleMax: 0.9,
      alpha: 0.78,
      flameBase: 0.06,
      flameScale: 0.04
    },
    "trail-magic": {
      type: "magic",
      emitInterval: 50,
      life: 880,
      speed: 84,
      sideSpeed: 34,
      radius: 6.2,
      growth: 0.22,
      scaleMin: 0.45,
      scaleMax: 1.62,
      alpha: 0.86,
      flameBase: 0.16,
      flameScale: 0.1
    },
    "trail-rainbow": {
      type: "rainbow",
      emitInterval: 42,
      life: 820,
      speed: 96,
      sideSpeed: 30,
      radius: 7.3,
      growth: 0.28,
      scaleMin: 0.46,
      scaleMax: 1.82,
      alpha: 0.82,
      flameBase: 0.18,
      flameScale: 0.1
    },
    "trail-plasma": {
      type: "plasma",
      emitInterval: 40,
      life: 720,
      speed: 118,
      sideSpeed: 22,
      radius: 6.8,
      growth: 0.32,
      scaleMin: 0.48,
      scaleMax: 1.74,
      alpha: 0.9,
      flameBase: 0.16,
      flameScale: 0.12
    },
    "trail-snow": {
      type: "snow",
      emitInterval: 58,
      life: 1060,
      speed: 78,
      sideSpeed: 32,
      radius: 6,
      growth: 0.18,
      scaleMin: 0.38,
      scaleMax: 1.48,
      alpha: 0.84,
      flameBase: 0.1,
      flameScale: 0.08
    },
    "trail-bats": {
      type: "bats",
      emitInterval: 88,
      life: 980,
      speed: 82,
      sideSpeed: 48,
      radius: 8.4,
      growth: 0.1,
      scaleMin: 0.55,
      scaleMax: 1.95,
      alpha: 0.88,
      flameBase: 0.13,
      flameScale: 0.08
    },
    "trail-hearts": {
      type: "hearts",
      emitInterval: 62,
      life: 960,
      speed: 76,
      sideSpeed: 36,
      radius: 7.2,
      growth: 0.18,
      scaleMin: 0.45,
      scaleMax: 1.58,
      alpha: 0.86,
      flameBase: 0.12,
      flameScale: 0.08
    },
    "trail-flowers": {
      type: "flowers",
      emitInterval: 68,
      life: 1040,
      speed: 74,
      sideSpeed: 38,
      radius: 7,
      growth: 0.18,
      scaleMin: 0.42,
      scaleMax: 1.68,
      alpha: 0.86,
      flameBase: 0.11,
      flameScale: 0.08
    }
  });

  function normalizedBoostTrailId(trailId) {
    const rawId = String(trailId || "");
    const normalizedId = typeof normalizeTrailId === "function" ? normalizeTrailId(rawId) : rawId;
    return normalizedId || rawId;
  }

  function boostTrailStateKey(ownerKey, trailId) {
    const cleanTrailId = normalizedBoostTrailId(trailId) || "trail-classic-flame";
    return (ownerKey ? String(ownerKey) : "trail-default") + ":" + cleanTrailId;
  }

  function decorativeBoostTrailStyleForId(trailId) {
    return decorativeBoostTrailStyles[normalizedBoostTrailId(trailId)] || null;
  }

  function isStatefulBoostTrailId(trailId) {
    const cleanTrailId = normalizedBoostTrailId(trailId);
    return cleanTrailId === "trail-smoke" || Boolean(decorativeBoostTrailStyleForId(cleanTrailId));
  }

