  function drawTradingPort(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 184, b: 107 };
    const offers = Array.isArray(structure.tradeOffers) ? structure.tradeOffers.length : 0;
    const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
    const vesselAway = vessel && vessel.state !== "docked";
    const pulse = 0.78 + Math.sin(time * 0.008 + (structure.wobble || 0)) * 0.12;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.88)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-44, 8, 88, 22, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-36, -30, 36, 20);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.46, "#9fb1c4");
    shellGradient.addColorStop(1, "#273149");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.86)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-36, 16);
    ctx.lineTo(-25, -26 - deploy * 5);
    ctx.lineTo(25, -26 - deploy * 5);
    ctx.lineTo(36, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(8, 12, 23, 0.52)";
    ctx.lineWidth = 3;
    for (const x of [-17, 0, 17]) {
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x * 0.72, -20 - deploy * 4);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(accent, 0.18 + deploy * 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -5, (28 + offers * 3 + deploy * 12) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = colorString(accent, 0.18 + offers * 0.06 + deploy * 0.24);
    ctx.beginPath();
    ctx.arc(0, -6, 15 + Math.min(offers, 4) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = vesselAway ? "rgba(255, 184, 107, 0.46)" : colorString(accent, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -33 - deploy * 8);
    ctx.lineTo(13, -8);
    ctx.lineTo(-13, -8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawTradeVessel(vessel, time, alpha) {
    if (!vessel || vessel.state === "docked") {
      return;
    }

    const speed = Math.hypot(finiteOr(vessel.vx, 0), finiteOr(vessel.vy, 0));
    const angle = speed > 6 ? Math.atan2(vessel.vy, vessel.vx) : finiteOr(vessel.angle, 0);
    const healthPct = clamp(finiteOr(vessel.health, tradingPortVesselMaxHealth) / tradingPortVesselMaxHealth, 0, 1);
    const cargoGlow = tradeOfferTotal(vessel.cargo) > 0 ? 1 : 0.32;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(vessel.x, vessel.y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 184, 107, 0.16)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 32 + cargoGlow * 10, 18 + cargoGlow * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(6, 10, 24, 0.92)";
    ctx.strokeStyle = "rgba(248, 251, 255, 0.62)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(18, 15);
    ctx.lineTo(5, 10);
    ctx.lineTo(0, 25);
    ctx.lineTo(-5, 10);
    ctx.lineTo(-18, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = healthPct > 0.42 ? "#ffb86b" : "#ff6d6d";
    ctx.beginPath();
    ctx.arc(0, -3, 6 + Math.sin(time * 0.018) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawAccumulator(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.007 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 88, g: 226, b: 255 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    const burstProgress = clamp(finiteOr(structure.burstTimer, 0) / accumulatorBurstDuration, 0, 1);
    if (burstProgress > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.12 + burstProgress * 0.42);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -2, 24 + (1 - burstProgress) * 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(6, 10, 24, 0.82)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-30, 8, 60, 17, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-26, -22, 24, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.48, "#8e9aae");
    shellGradient.addColorStop(1, "#30384d");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    roundRectPath(-24, -22, 48, 40, 10);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, 0.2 + deploy * 0.36);
    ctx.beginPath();
    ctx.arc(0, -2, (15 + deploy * 9) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.64 + deploy * 0.3);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, -2, 8 + i * 7 + deploy * 3, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.beginPath();
    ctx.arc(0, -2, 6 + deploy * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawMedbay(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const healPulse = clamp(finiteOr(structure.healPulse, 0), 0, 1);
    const pulse = 1 + Math.sin(time * 0.008 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 123, g: 255, b: 173 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.86)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-38, 8, 76, 20, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-30, -26, 30, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.46, "#9fb1c4");
    shellGradient.addColorStop(1, "#283446");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    ctx.lineWidth = 3;
    roundRectPath(-31, -24 - deploy * 4, 62, 43 + deploy * 4, 11);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, 0.16 + deploy * 0.2 + healPulse * 0.28);
    ctx.beginPath();
    ctx.ellipse(0, -5, (22 + healPulse * 10) * pulse, (14 + healPulse * 5) * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.32 + deploy * 0.28 + healPulse * 0.34);
    ctx.lineWidth = 2 + healPulse * 2;
    ctx.beginPath();
    ctx.arc(0, -5, 20 + deploy * 9 + healPulse * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.94);
    roundRectPath(-6, -18, 12, 27, 4);
    ctx.fill();
    roundRectPath(-18, -7, 36, 12, 4);
    ctx.fill();

    ctx.restore();
  }

  function drawShieldGenerator(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const active = clamp(finiteOr(structure.burstTimer, 0) / shieldGeneratorActiveDuration, 0, 1);
    const pulse = 1 + Math.sin(time * 0.007 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 119, g: 167, b: 255 };
    const body = bodyById(structure.bodyId);

    if (body && valid !== false) {
      const radius = shieldGeneratorRadius(body);
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.08 + deploy * 0.1 + active * 0.38);
      ctx.lineWidth = 2 + active * 7;
      ctx.beginPath();
      ctx.arc(body.x, body.y, radius + active * 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = colorString({ r: 248, g: 251, b: 255 }, (0.04 + active * 0.18) * deploy);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.arc(body.x, body.y, radius - 8 - i * 13 + Math.sin(time * 0.003 + i) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-31, 8, 62, 18, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-24, -24, 24, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.48, "#93a4c0");
    shellGradient.addColorStop(1, "#273149");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-25, 8);
    ctx.quadraticCurveTo(-20, -25 - deploy * 5, 0, -30 - deploy * 8);
    ctx.quadraticCurveTo(20, -25 - deploy * 5, 25, 8);
    ctx.lineTo(16, 18);
    ctx.lineTo(-16, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(accent, 0.36 + deploy * 0.34 + active * 0.26);
    ctx.lineWidth = 3 + active * 2;
    for (let i = 0; i < 3; i += 1) {
      const radius = (10 + i * 8 + deploy * 6 + active * 5) * pulse;
      ctx.beginPath();
      ctx.arc(0, -4, radius, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    ctx.fillStyle = colorString(accent, 0.25 + deploy * 0.45 + active * 0.3);
    ctx.beginPath();
    ctx.arc(0, -4, (13 + deploy * 7 + active * 6) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.94);
    ctx.beginPath();
    ctx.arc(0, -4, 6 + active * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

