  function drawCommunicationRelay(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.006 + (structure.wobble || 0)) * 0.06;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 184, b: 107 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.82)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-31, 9, 62, 17, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(235, 246, 255, 0.78)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -26 - deploy * 18);
    ctx.stroke();

    ctx.strokeStyle = colorString(accent, 0.84);
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -14 - deploy * 10);
      ctx.lineTo(side * (18 + deploy * 8), -28 - deploy * 14);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(accent, 0.28 + deploy * 0.42);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const radius = (13 + i * 9 + deploy * 7) * pulse;
      ctx.beginPath();
      ctx.arc(0, -35 - deploy * 14, radius, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.beginPath();
    ctx.arc(0, -35 - deploy * 14, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawJet(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const thrust = clamp(finiteOr(structure.thrustAmount, 0), 0, 1);
    const thrustDirection = finiteOr(structure.thrustDirection, 1) < 0 ? -1 : 1;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 169, g: 133, b: 255 };
    const flicker = 0.82 + Math.sin(time * 0.034 + (structure.wobble || 0)) * 0.18;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-30, 9, 60, 18, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-24, -24, 24, 18);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.5, "#8d98ad");
    shellGradient.addColorStop(1, "#252d42");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, 12);
    ctx.lineTo(-17, -17 - deploy * 5);
    ctx.quadraticCurveTo(0, -28 - deploy * 8, 17, -17 - deploy * 5);
    ctx.lineTo(24, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(accent, 0.28 + deploy * 0.36);
    ctx.beginPath();
    ctx.ellipse(0, -7, 13 + deploy * 3, 8 + deploy * 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(10, 14, 27, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 15, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.72);
    ctx.lineWidth = 2;
    ctx.stroke();

    if (thrust > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.scale(1, thrustDirection);
      const flameLength = (24 + thrust * 48) * flicker;
      const flameWidth = 13 + thrust * 10;
      const flame = ctx.createLinearGradient(0, 18, 0, 18 + flameLength);
      flame.addColorStop(0, "rgba(248, 251, 255, " + (0.78 * thrust) + ")");
      flame.addColorStop(0.28, colorString({ r: 88, g: 226, b: 255 }, 0.72 * thrust));
      flame.addColorStop(1, colorString(accent, 0));
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-flameWidth, 15);
      ctx.quadraticCurveTo(-flameWidth * 0.35, 24 + flameLength * 0.34, 0, 18 + flameLength);
      ctx.quadraticCurveTo(flameWidth * 0.35, 24 + flameLength * 0.34, flameWidth, 15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawTetherAnchor(structure, x, y, angle, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 169, g: 133, b: 255 };
    const pulse = 1 + Math.sin(time * 0.006 + (structure.wobble || 0)) * 0.04;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-27, 7, 54, 17, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-20, -18, 20, 16);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.5, "#9aa4b8");
    shellGradient.addColorStop(1, "#30384d");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.82)";
    roundRectPath(-21, -18, 42, 33, 9);
    ctx.fill();
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, (0.18 + deploy * 0.28) * alpha);
    ctx.beginPath();
    ctx.arc(0, -1, (12 + deploy * 5) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(accent, 0.92);
    ctx.beginPath();
    ctx.arc(0, -1, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawTether(structure, time, alpha, valid) {
    const x2 = finiteOr(structure.x2, structure.x);
    const y2 = finiteOr(structure.y2, structure.y);
    const dx = x2 - structure.x;
    const dy = y2 - structure.y;
    const length = Math.hypot(dx, dy);
    const poleAlpha = alpha * (valid === false ? 0.55 : 0.82);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 169, g: 133, b: 255 };

    if (length > 8) {
      const angle = Math.atan2(dy, dx);
      const deploy = clamp(structure.deploy || 0, 0, 1);
      const visibleLength = Math.max(0, length - 26);
      const segmentCount = Math.max(3, Math.min(12, Math.ceil(visibleLength / 105)));
      const segmentLength = visibleLength / segmentCount;

      ctx.save();
      ctx.globalAlpha *= poleAlpha;
      ctx.translate(structure.x, structure.y);
      ctx.rotate(angle);
      ctx.lineCap = "round";

      ctx.strokeStyle = "rgba(5, 8, 18, 0.9)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(length - 13, 0);
      ctx.stroke();

      ctx.strokeStyle = "rgba(235, 246, 255, 0.7)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(length - 16, 0);
      ctx.stroke();

      for (let i = 0; i < segmentCount; i += 1) {
        const start = 16 + i * segmentLength;
        const end = Math.min(length - 16, start + segmentLength * 0.72);
        const width = 7 - (i % 3) * 1.25;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(88, 226, 255, 0.58)" : colorString(accent, 0.58 + deploy * 0.22);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(start, 0);
        ctx.lineTo(end, 0);
        ctx.stroke();

        ctx.strokeStyle = "rgba(6, 10, 24, 0.62)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.min(length - 16, start + segmentLength * 0.78), -7);
        ctx.lineTo(Math.min(length - 16, start + segmentLength * 0.78), 7);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.14 + deploy * 0.12);
      ctx.lineWidth = 25;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(length - 18, 0);
      ctx.stroke();
      ctx.restore();
    }

    drawTetherAnchor(structure, structure.x, structure.y, structure.angle, time, alpha, valid);
    drawTetherAnchor(structure, x2, y2, finiteOr(structure.linkedAngle, structure.angle + Math.PI), time, alpha, valid);
  }

