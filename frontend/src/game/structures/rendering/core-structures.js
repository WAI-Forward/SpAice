  function drawTurret(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.006 + (structure.wobble || 0)) * 0.04;
    const baseRotation = structure.angle + Math.PI / 2;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 115, b: 173 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(baseRotation);

    ctx.fillStyle = "rgba(6, 10, 24, 0.78)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-31, 6, 62, 19, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(207, 215, 231, 0.9)";
    ctx.strokeStyle = "rgba(10, 14, 27, 0.82)";
    roundRectPath(-23, -12 - deploy * 8, 46, 26 + deploy * 7, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(accent, 0.22 + deploy * 0.32);
    ctx.beginPath();
    ctx.arc(0, -2 - deploy * 7, 13 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const barrelAngle = structure.aimAngle || structure.angle;
    const barrelLength = 30 + deploy * 34;
    const barrelBaseX = structure.x + Math.cos(structure.angle) * (10 + deploy * 7);
    const barrelBaseY = structure.y + Math.sin(structure.angle) * (10 + deploy * 7);

    ctx.save();
    ctx.globalAlpha *= alpha * (0.72 + deploy * 0.28);
    ctx.translate(barrelBaseX, barrelBaseY);
    ctx.rotate(barrelAngle);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(11, 15, 28, 0.92)";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(barrelLength, 0);
    ctx.stroke();
    ctx.strokeStyle = colorString(accent, 0.84);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = colorString(accent, 0.88);
    ctx.beginPath();
    ctx.arc(barrelLength + 2, 0, 5 + deploy * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMissileLauncher(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const charge = clamp(finiteOr(structure.missileCharge, valid === false ? 0.35 : 1), 0, 1);
    const locking = finiteOr(structure.targetCount, 0) >= missileLauncherMinClusterSize && charge >= 1;
    const baseRotation = structure.angle + Math.PI / 2;
    const barrelAngle = Number.isFinite(Number(structure.aimAngle)) ? structure.aimAngle : structure.angle;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 184, b: 88 };
    const pulse = 0.72 + Math.sin(time * 0.011 + (structure.wobble || 0)) * 0.18;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(baseRotation);

    ctx.fillStyle = "rgba(7, 11, 24, 0.84)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.32)";
    ctx.lineWidth = 3;
    roundRectPath(-34, 8, 68, 20, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(198, 207, 224, 0.92)";
    ctx.strokeStyle = "rgba(10, 14, 27, 0.82)";
    roundRectPath(-26, -12 - deploy * 7, 52, 28 + deploy * 8, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(accent, 0.16 + charge * 0.36);
    ctx.beginPath();
    ctx.arc(0, -2 - deploy * 6, 12 + charge * 8 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const railBaseX = structure.x + Math.cos(structure.angle) * (12 + deploy * 8);
    const railBaseY = structure.y + Math.sin(structure.angle) * (12 + deploy * 8);
    const railLength = 36 + deploy * 32;

    ctx.save();
    ctx.globalAlpha *= alpha * (0.72 + deploy * 0.28);
    ctx.translate(railBaseX, railBaseY);
    ctx.rotate(barrelAngle);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(10, 14, 27, 0.94)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(railLength, -5);
    ctx.moveTo(0, 5);
    ctx.lineTo(railLength, 5);
    ctx.stroke();
    ctx.strokeStyle = colorString(accent, 0.68 + charge * 0.24);
    ctx.lineWidth = 4;
    ctx.stroke();

    if (charge > 0.08) {
      ctx.fillStyle = "rgba(19, 25, 39, 0.96)";
      ctx.strokeStyle = colorString(accent, 0.6 + charge * 0.32);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(railLength * charge - 10, -12);
      ctx.lineTo(railLength * charge + 12, 0);
      ctx.lineTo(railLength * charge - 10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    if (locking) {
      ctx.save();
      ctx.globalAlpha *= alpha * (0.28 + pulse * 0.16);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(accent, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(structure.x, structure.y, 58 + Math.sin(time * 0.018) * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlatingBlock(structure, time, alpha, valid) {
    const deploy = Number.isFinite(Number(structure.deploy)) ? clamp(Number(structure.deploy), 0, 1) : 0.72;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 255, g: 209, b: 102 };
    const shine = 0.42 + Math.sin(time * 0.004 + (structure.wobble || 0)) * 0.08;

    ctx.save();
    ctx.globalAlpha *= alpha * (0.62 + deploy * 0.38);
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    const gradient = ctx.createLinearGradient(0, -platingBlockHeight / 2, 0, platingBlockHeight / 2);
    gradient.addColorStop(0, colorString(shadeColor(accent, 46), 0.98));
    gradient.addColorStop(0.58, "rgba(72, 78, 94, 0.96)");
    gradient.addColorStop(1, "rgba(18, 23, 34, 0.98)");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = valid === false ? "rgba(255, 100, 100, 0.86)" : "rgba(248, 251, 255, 0.32)";
    ctx.lineWidth = 3;
    roundRectPath(-platingBlockWidth / 2, -platingBlockHeight / 2, platingBlockWidth, platingBlockHeight, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colorString(accent, 0.35 + shine * 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-platingBlockWidth / 2 + 8, -platingBlockHeight / 2 + 5);
    ctx.lineTo(platingBlockWidth / 2 - 8, -platingBlockHeight / 2 + 5);
    ctx.stroke();

    ctx.strokeStyle = "rgba(6, 10, 24, 0.42)";
    ctx.lineWidth = 1.5;
    for (const x of [-18, 0, 18]) {
      ctx.beginPath();
      ctx.moveTo(x, -platingBlockHeight / 2 + 4);
      ctx.lineTo(x, platingBlockHeight / 2 - 4);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(248, 251, 255, 0.68)";
    for (const x of [-28, 28]) {
      for (const y of [-7, 7]) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawBattery(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const pulse = 1 + Math.sin(time * 0.008 + (structure.wobble || 0)) * 0.05;
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 157, g: 255, b: 122 };

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.86)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.32)";
    ctx.lineWidth = 3;
    roundRectPath(-28, -19, 56, 38, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(235, 246, 255, 0.88)";
    roundRectPath(-10, -25, 20, 7, 3);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fillHeight = 24 * deploy;
    const fill = ctx.createLinearGradient(0, 13, 0, -13);
    fill.addColorStop(0, colorString(accent, 0.42));
    fill.addColorStop(1, colorString(accent, 0.94));
    ctx.fillStyle = fill;
    roundRectPath(-18, 13 - fillHeight, 36, fillHeight, 5);
    ctx.fill();

    ctx.strokeStyle = colorString(accent, 0.5 + deploy * 0.32);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, (24 + deploy * 10) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f8fbff";
    ctx.beginPath();
    ctx.moveTo(4, -13);
    ctx.lineTo(-6, 1);
    ctx.lineTo(2, 1);
    ctx.lineTo(-4, 14);
    ctx.lineTo(12, -4);
    ctx.lineTo(3, -4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawContainer(structure, time, alpha, valid) {
    const deploy = clamp(structure.deploy || 0, 0, 1);
    const accent = valid === false ? { r: 255, g: 100, b: 100 } : { r: 88, g: 226, b: 255 };
    const total = tradeOfferTotal(structure.tech);
    const fill = clamp(total / 30, 0, 1);
    const pulse = 0.78 + Math.sin(time * 0.007 + (structure.wobble || 0)) * 0.12;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle + Math.PI / 2);

    ctx.fillStyle = "rgba(6, 10, 24, 0.86)";
    ctx.strokeStyle = "rgba(235, 246, 255, 0.34)";
    ctx.lineWidth = 3;
    roundRectPath(-35, 9, 70, 19, 7);
    ctx.fill();
    ctx.stroke();

    const shellGradient = ctx.createLinearGradient(-30, -25, 30, 20);
    shellGradient.addColorStop(0, "#f8fbff");
    shellGradient.addColorStop(0.45, "#8fa0b8");
    shellGradient.addColorStop(1, "#273149");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "rgba(8, 12, 23, 0.84)";
    ctx.lineWidth = 3;
    roundRectPath(-30, -23 - deploy * 3, 60, 45 + deploy * 3, 10);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(8, 12, 23, 0.64)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-27, -8);
    ctx.lineTo(27, -8);
    ctx.stroke();

    ctx.fillStyle = "rgba(8, 12, 23, 0.72)";
    roundRectPath(-18, -2, 36, 17, 5);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(accent, 0.2 + fill * 0.45);
    roundRectPath(-16, 0, 32 * Math.max(0.08, fill), 13, 4);
    ctx.fill();
    ctx.strokeStyle = colorString(accent, 0.16 + deploy * 0.22 + fill * 0.34);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, (24 + fill * 16) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(248, 251, 255, 0.72)";
    for (const x of [-21, 21]) {
      ctx.beginPath();
      ctx.arc(x, 19, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

