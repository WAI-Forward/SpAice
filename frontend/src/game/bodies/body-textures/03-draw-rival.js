  function drawRival(rival, time) {
    if (rival.health <= 0) {
      return;
    }

    const pulse = rival.flash > 0 ? 1 + Math.sin(time * 0.07) * 0.08 : 1;
    const bodyColor = rival.flash > 0 ? { r: 255, g: 236, b: 194 } : rival.color;

    ctx.save();
    ctx.translate(rival.x, rival.y);
    ctx.rotate(rival.rotation || 0);
    ctx.scale(pulse, pulse);
    if (rival.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(rival, time);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;

    const glow = ctx.createRadialGradient(0, -5, 4, 0, -5, 48);
    glow.addColorStop(0, colorString(bodyColor, 0.32));
    glow.addColorStop(1, colorString(bodyColor, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -3, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, -29);
    ctx.quadraticCurveTo(-24, -47, -34, -34);
    ctx.moveTo(8, -29);
    ctx.quadraticCurveTo(24, -47, 34, -34);
    ctx.stroke();

    ctx.fillStyle = "#ffe96d";
    for (const x of [-34, 34]) {
      ctx.beginPath();
      ctx.arc(x, -34, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const headGradient = ctx.createRadialGradient(-10, -20, 4, 0, -8, 34);
    headGradient.addColorStop(0, colorString(shadeColor(bodyColor, 74), 0.98));
    headGradient.addColorStop(0.62, colorString(bodyColor, 0.98));
    headGradient.addColorStop(1, colorString(shadeColor(bodyColor, -82), 0.96));
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.bezierCurveTo(27, -35, 34, -12, 21, 7);
    ctx.bezierCurveTo(14, 20, -14, 20, -21, 7);
    ctx.bezierCurveTo(-34, -12, -27, -35, 0, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.ellipse(-11, -25, 5, 3.5, -0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#07101c";
    for (const x of [-10, 10]) {
      ctx.beginPath();
      ctx.ellipse(x, -10, 8, 12, x < 0 ? -0.24 : 0.24, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(189, 255, 238, 0.8)";
    for (const x of [-13, 7]) {
      ctx.beginPath();
      ctx.arc(x, -15, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(21, 24, 41, 0.72)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(bodyColor, -42), 0.95);
    roundRectPath(-16, 13, 32, 31, 12);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(bodyColor, 58), 0.8);
    roundRectPath(-7, 20, 14, 10, 4);
    ctx.fill();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-17, 23);
    ctx.quadraticCurveTo(-31, 31, -27, 44);
    ctx.moveTo(17, 23);
    ctx.quadraticCurveTo(32, 26, 34, 11);
    ctx.stroke();

    ctx.strokeStyle = colorString(bodyColor, 0.95);
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.translate(35, 9);
    ctx.rotate(-0.12);
    ctx.fillStyle = "#6e7581";
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    roundRectPath(-2, -6, 24, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3f4650";
    ctx.beginPath();
    ctx.arc(24, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-8, 41);
    ctx.lineTo(-15, 53);
    ctx.moveTo(8, 41);
    ctx.lineTo(15, 53);
    ctx.stroke();

    ctx.strokeStyle = colorString(bodyColor, 0.92);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    if (!rival.landed || rival.isBoss) {
      const healthPct = clamp(rival.health / rival.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      roundRectPath(-24, -43, 48, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-24, -43, 48 * healthPct, 6, 3);
      ctx.fill();
    }

    ctx.restore();
    drawBossNameplate(rival, time);
  }

  function drawUfoTractorBeam(ufo, time) {
    if (!ufoHasActiveBeam(ufo)) {
      return;
    }

    const drainBeam = ufoHasPlayerDrainBeam(ufo);
    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;
    const endX = originX + dirX * ufoTractorRange;
    const endY = originY + dirY * ufoTractorRange;
    const pulse = 0.82 + Math.sin(time * 0.008 + ufo.beamPulse) * 0.18;
    const topHalf = 24;
    const bottomHalf = ufoTractorWidth * pulse;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const gradient = ctx.createLinearGradient(originX, originY, endX, endY);
    gradient.addColorStop(0, drainBeam ? "rgba(255, 60, 60, 0.62)" : "rgba(116, 244, 255, 0.48)");
    gradient.addColorStop(0.58, drainBeam ? "rgba(255, 88, 75, 0.27)" : "rgba(116, 244, 255, 0.22)");
    gradient.addColorStop(1, drainBeam ? "rgba(255, 60, 60, 0)" : "rgba(116, 244, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(originX + normalX * topHalf, originY + normalY * topHalf);
    ctx.lineTo(originX - normalX * topHalf, originY - normalY * topHalf);
    ctx.lineTo(endX - normalX * bottomHalf, endY - normalY * bottomHalf);
    ctx.lineTo(endX + normalX * bottomHalf, endY + normalY * bottomHalf);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drainBeam ? "rgba(255, 214, 214, 0.25)" : "rgba(205, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      const side = i * 24 * pulse;
      ctx.beginPath();
      ctx.moveTo(originX + normalX * side, originY + normalY * side);
      ctx.quadraticCurveTo(
        (originX + endX) / 2 + normalX * (side + Math.sin(time * 0.006 + i + ufo.beamPulse) * 18),
        (originY + endY) / 2 + normalY * (side + Math.sin(time * 0.006 + i + ufo.beamPulse) * 18),
        endX + normalX * side * 2,
        endY + normalY * side * 2
      );
      ctx.stroke();
    }

    ctx.restore();
    drawBossNameplate(ufo, time);
  }

  function drawUfo(ufo, time) {
    if (ufo.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hullColor = ufo.flash > 0 ? flashColor : ufo.color;
    const pulse = ufo.flash > 0 ? 1 + Math.sin(time * 0.08) * 0.07 : 1;

    ctx.save();
    ctx.translate(ufo.x, ufo.y);
    ctx.rotate(ufo.rotation || 0);
    ctx.scale(pulse, pulse);
    if (ufo.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(ufo, time);
    }

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 72);
    glow.addColorStop(0, colorString(hullColor, 0.3));
    glow.addColorStop(1, colorString(hullColor, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const dome = ctx.createRadialGradient(-10, -18, 4, 0, -12, 26);
    dome.addColorStop(0, "rgba(235, 255, 255, 0.95)");
    dome.addColorStop(0.5, colorString(hullColor, 0.82));
    dome.addColorStop(1, "rgba(30, 58, 84, 0.92)");
    ctx.fillStyle = dome;
    ctx.strokeStyle = "#14192a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -12, 28, 20, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const hull = ctx.createLinearGradient(0, -16, 0, 24);
    hull.addColorStop(0, colorString(shadeColor(hullColor, 70), 0.96));
    hull.addColorStop(0.48, colorString(hullColor, 0.98));
    hull.addColorStop(1, colorString(shadeColor(hullColor, -88), 0.96));
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.ellipse(0, 4, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe56f";
    for (const x of [-28, 0, 28]) {
      ctx.beginPath();
      ctx.arc(x, 8 + Math.sin(time * 0.01 + x) * 1.2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (gameSettings.hudEnabled !== false || ufo.isBoss) {
      const healthPct = clamp(ufo.health / ufo.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      roundRectPath(-28, -46, 56, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-28, -46, 56 * healthPct, 6, 3);
      ctx.fill();
    }

    ctx.restore();
  }
