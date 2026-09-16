  function drawRambotBoss(rambot, time, metal, chargeGlow) {
    const extension = rambotBossPistonExtension(rambot);
    const headAngle = Number.isFinite(Number(rambot.headAngle)) ? rambot.headAngle : (finiteOr(rambot.rotation, 0) - Math.PI / 2);
    const relativeHeadAngle = shortestAngleDelta(finiteOr(rambot.rotation, 0) - Math.PI / 2, headAngle);
    const pistonReach = 28 + extension * 90;
    const flash = extension > 0.5 ? 0.16 + Math.sin(time * 0.028) * 0.06 : 0;

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, -2, 8, 0, -2, 88 + extension * 52);
    glow.addColorStop(0, "rgba(255, 209, 102, " + (chargeGlow + flash) + ")");
    glow.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -2, 88 + extension * 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 5;
    ctx.fillStyle = colorString(shadeColor(metal, -66), 0.98);
    roundRectPath(-43, -3, 86, 53, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, -92), 0.95);
    roundRectPath(-52, 4, 17, 48, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(35, 4, 17, 48, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, 28), 0.98);
    roundRectPath(-32, -34, 64, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, -18), 0.96);
    roundRectPath(-24, -19, 48, 22, 7);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -26);
    ctx.rotate(relativeHeadAngle);

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, -pistonReach);
    ctx.stroke();

    const pistonGradient = ctx.createLinearGradient(-10, 4, 10, -pistonReach);
    pistonGradient.addColorStop(0, "#5f6879");
    pistonGradient.addColorStop(0.48, "#f8fbff");
    pistonGradient.addColorStop(1, "#ffd166");
    ctx.strokeStyle = pistonGradient;
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = "#d9e3e8";
    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.translate(0, -pistonReach);
    const headGradient = ctx.createLinearGradient(0, -36, 0, 18);
    headGradient.addColorStop(0, colorString(shadeColor(metal, 74), 0.98));
    headGradient.addColorStop(0.55, colorString(metal, 0.98));
    headGradient.addColorStop(1, colorString(shadeColor(metal, -82), 0.96));
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.moveTo(-25, -20);
    ctx.lineTo(0, -43);
    ctx.lineTo(25, -20);
    ctx.lineTo(20, 15);
    ctx.lineTo(-20, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(-9, -12, 4.8, 0, Math.PI * 2);
    ctx.arc(9, -12, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, 74), 0.42);
    roundRectPath(-13, 1, 26, 7, 3);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(-16, -20, 4.5, 0, Math.PI * 2);
    ctx.arc(16, -20, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#ff7766";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-29, -40);
    ctx.lineTo(-43, -55);
    ctx.moveTo(29, -40);
    ctx.lineTo(43, -55);
    ctx.stroke();

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-24, 45);
    ctx.lineTo(-33, 66);
    ctx.moveTo(24, 45);
    ctx.lineTo(33, 66);
    ctx.stroke();

    ctx.strokeStyle = colorString(shadeColor(metal, -16), 0.96);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const healthPct = clamp(rambot.health / rambot.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRectPath(-40, -98, 80, 8, 4);
    ctx.fill();
    ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
    roundRectPath(-40, -98, 80 * healthPct, 8, 4);
    ctx.fill();
  }

  function drawRambot(rambot, time) {
    if (rambot.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const metal = rambot.flash > 0 ? flashColor : rambot.color;
    const pulse = rambot.flash > 0 ? 1 + Math.sin(time * 0.08) * 0.06 : 1;
    const chargeGlow = rambot.chargeTimer > 0 ? 0.58 + Math.sin(time * 0.024) * 0.22 : 0.18;

    ctx.save();
    ctx.translate(rambot.x, rambot.y);
    ctx.rotate(rambot.rotation || 0);
    ctx.scale(pulse, pulse);
    if (rambot.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(rambot, time);
      drawRambotBoss(rambot, time, metal, chargeGlow);
      ctx.restore();
      drawBossNameplate(rambot, time);
      return;
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 3, 8, 0, 3, 76);
    glow.addColorStop(0, "rgba(255, 209, 102, " + chargeGlow + ")");
    glow.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 3, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 5;
    ctx.fillStyle = colorString(shadeColor(metal, -58), 0.98);
    roundRectPath(-33, -11, 66, 49, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, 34), 0.98);
    roundRectPath(-25, -34, 50, 40, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, -92), 0.95);
    roundRectPath(-40, -1, 13, 45, 5);
    ctx.fill();
    ctx.stroke();
    roundRectPath(27, -1, 13, 45, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(-12, -16, 5, 0, Math.PI * 2);
    ctx.arc(12, -16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#ff7766";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -42);
    ctx.lineTo(-32, -55);
    ctx.moveTo(20, -42);
    ctx.lineTo(32, -55);
    ctx.stroke();

    ctx.fillStyle = "#d9e3e8";
    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, -49);
    ctx.lineTo(0, -68);
    ctx.lineTo(18, -49);
    ctx.lineTo(8, -42);
    ctx.lineTo(0, -52);
    ctx.lineTo(-8, -42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(metal, 74), 0.42);
    roundRectPath(-17, 13, 34, 9, 4);
    ctx.fill();

    ctx.strokeStyle = "#121722";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-18, 35);
    ctx.lineTo(-25, 54);
    ctx.moveTo(18, 35);
    ctx.lineTo(25, 54);
    ctx.stroke();

    ctx.strokeStyle = colorString(shadeColor(metal, -16), 0.96);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    if (gameSettings.hudEnabled !== false || rambot.isBoss) {
      const healthPct = clamp(rambot.health / rambot.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-32, -76, 64, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-32, -76, 64 * healthPct, 7, 3.5);
      ctx.fill();
    }

    ctx.restore();
    drawBossNameplate(rambot, time);
  }

