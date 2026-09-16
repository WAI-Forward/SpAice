  function drawPersonalTether(time) {
    const endpoint = personalTetherEndpoint();
    if (!endpoint) {
      return;
    }

    const x1 = player.x;
    const y1 = player.y;
    const x2 = endpoint.x;
    const y2 = endpoint.y;
    if (!isWorldCircleNearView((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1) * 0.5, 760)) {
      return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length <= 8) {
      return;
    }

    const accent = { r: 169, g: 133, b: 255 };
    const deploy = clamp(endpoint.deploy, 0, 1);
    const angle = Math.atan2(dy, dx);
    const wave = Math.sin(time * 0.007 + endpoint.wobble) * 4;
    const normalX = -dy / length;
    const normalY = dx / length;
    const midX = (x1 + x2) / 2 + normalX * wave;
    const midY = (y1 + y2) / 2 + normalY * wave;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(5, 8, 18, 0.86)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
    ctx.strokeStyle = colorString(accent, 0.62 + deploy * 0.22);
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 12]);
    ctx.lineDashOffset = -time * 0.035;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(248, 251, 255, 0.54)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
    ctx.restore();

    drawTetherAnchor({
      deploy,
      wobble: endpoint.wobble
    }, x2, y2, endpoint.angle, time, 0.82, true);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, 0.24 + deploy * 0.18);
    ctx.beginPath();
    ctx.arc(x1 - Math.cos(angle) * player.radius * 0.38, y1 - Math.sin(angle) * player.radius * 0.38, 18 + deploy * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.76);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x1 - Math.cos(angle) * player.radius * 0.38, y1 - Math.sin(angle) * player.radius * 0.38, 10 + deploy * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBridge(structure, time, alpha, valid) {
    const x2 = finiteOr(structure.x2, structure.x);
    const y2 = finiteOr(structure.y2, structure.y);
    const dx = x2 - structure.x;
    const dy = y2 - structure.y;
    const length = Math.hypot(dx, dy);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 209, b: 102 };

    if (length > 8) {
      const angle = Math.atan2(dy, dx);
      const deploy = clamp(structure.deploy || 0, 0, 1);
      const segmentCount = Math.max(3, Math.min(18, Math.ceil(length / 96)));
      const segmentLength = length / segmentCount;

      ctx.save();
      ctx.globalAlpha *= alpha * (valid === false ? 0.58 : 0.92);
      ctx.translate(structure.x, structure.y);
      ctx.rotate(angle);

      ctx.fillStyle = "rgba(5, 8, 18, 0.92)";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(10, -17, 24, -bridgeHalfWidth - 8, 42, -bridgeHalfWidth - 7);
      ctx.lineTo(42, bridgeHalfWidth + 7);
      ctx.bezierCurveTo(24, bridgeHalfWidth + 8, 10, 17, 0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(length, -8);
      ctx.bezierCurveTo(length - 10, -17, length - 24, -bridgeHalfWidth - 8, length - 42, -bridgeHalfWidth - 7);
      ctx.lineTo(length - 42, bridgeHalfWidth + 7);
      ctx.bezierCurveTo(length - 24, bridgeHalfWidth + 8, length - 10, 17, length, 8);
      ctx.closePath();
      ctx.fill();

      roundRectPath(10, -bridgeHalfWidth - 5, Math.max(1, length - 20), bridgeHalfWidth * 2 + 10, 8);
      ctx.fill();

      const deckGradient = ctx.createLinearGradient(0, -bridgeHalfWidth, 0, bridgeHalfWidth);
      deckGradient.addColorStop(0, "#f8fbff");
      deckGradient.addColorStop(0.5, "#9aa4b8");
      deckGradient.addColorStop(1, "#3a4258");
      ctx.fillStyle = deckGradient;
      roundRectPath(16, -bridgeHalfWidth, Math.max(1, length - 32), bridgeHalfWidth * 2, 6);
      ctx.fill();

      ctx.strokeStyle = "rgba(6, 10, 24, 0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(22, -bridgeHalfWidth + 4);
      ctx.lineTo(length - 22, -bridgeHalfWidth + 4);
      ctx.moveTo(22, bridgeHalfWidth - 4);
      ctx.lineTo(length - 22, bridgeHalfWidth - 4);
      ctx.stroke();

      for (let i = 0; i < segmentCount; i += 1) {
        const start = 18 + i * segmentLength;
        const end = Math.min(length - 18, start + segmentLength * 0.72);
        ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 209, 102, 0.76)" : "rgba(88, 226, 255, 0.58)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(start, -bridgeHalfWidth + 5);
        ctx.lineTo(end, bridgeHalfWidth - 5);
        ctx.moveTo(start, bridgeHalfWidth - 5);
        ctx.lineTo(end, -bridgeHalfWidth + 5);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.12 + deploy * 0.12);
      ctx.lineWidth = bridgeHalfWidth * 2 + 18;
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(length - 22, 0);
      ctx.stroke();
      ctx.restore();
    }

    drawTetherAnchor(structure, structure.x, structure.y, structure.angle, time, alpha, valid);
    drawTetherAnchor(structure, x2, y2, finiteOr(structure.linkedAngle, structure.angle + Math.PI), time, alpha, valid);
  }

