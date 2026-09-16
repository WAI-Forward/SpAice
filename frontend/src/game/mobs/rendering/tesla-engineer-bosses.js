  function drawTesla(tesla, time) {
    if (tesla.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 255, b: 214 };
    const energy = tesla.flash > 0 ? flashColor : tesla.color;
    const pulse = 1 + Math.sin(time * 0.012 + tesla.wobble) * 0.08 + (tesla.lightningWarmup || 0) * 0.08;

    ctx.save();
    ctx.translate(tesla.x, tesla.y);
    ctx.rotate(tesla.rotation || 0);
    ctx.scale(pulse, pulse);
    if (tesla.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(tesla, time);
    }

    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 78);
    glow.addColorStop(0, colorString(energy, 0.46));
    glow.addColorStop(1, colorString(energy, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorString(energy, 0.72);
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      const angle = time * 0.002 + tesla.wobble + i * (Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 7, Math.sin(angle) * 7, 26 + Math.sin(time * 0.009 + i) * 4, angle, angle + 1.2);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    const core = ctx.createRadialGradient(-8, -9, 3, 0, 0, 29);
    core.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    core.addColorStop(0.45, colorString(energy, 0.98));
    core.addColorStop(1, colorString(shadeColor(energy, -96), 0.94));
    ctx.fillStyle = core;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(energy, 0.24 + (tesla.lightningWarmup || 0) * 0.34);
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();

    if (gameSettings.hudEnabled !== false || tesla.isBoss) {
      const healthPct = clamp(tesla.health / tesla.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-28, -48, 56, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-28, -48, 56 * healthPct, 6, 3);
      ctx.fill();
    }

    ctx.restore();
    drawBossNameplate(tesla, time);
  }

  function drawEngineer(engineer, time) {
    if (engineer.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = engineer.flash > 0 ? flashColor : engineer.color;
    const pulse = 1 + Math.sin(time * 0.008 + engineer.wobble) * 0.06;

    ctx.save();
    ctx.translate(engineer.x, engineer.y);
    ctx.rotate(engineer.rotation || 0);
    if (engineer.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(engineer, time);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = colorString(hull, 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, engineer.radius * 1.28 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(12, 18, 30, 0.92)";
    ctx.strokeStyle = colorString(shadeColor(hull, 50), 0.76);
    ctx.lineWidth = 3;
    roundRectPath(-25, -28, 50, 56, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(hull, 0.86);
    roundRectPath(-17, -19, 34, 18, 7);
    ctx.fill();

    ctx.strokeStyle = colorString(hull, 0.82);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-26, -4);
    ctx.lineTo(-42, 12);
    ctx.moveTo(26, -4);
    ctx.lineTo(42, 12);
    ctx.stroke();

    ctx.strokeStyle = "rgba(248, 251, 255, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 18);
    ctx.stroke();

    if (engineer.healPulse > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(hull, clamp(engineer.healPulse / 0.38, 0, 1) * 0.72);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, engineer.radius * (1.6 + (0.38 - engineer.healPulse) * 2.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();

    if (gameSettings.hudEnabled !== false || engineer.isBoss) {
      const healthPct = clamp(engineer.health / engineer.maxHealth, 0, 1);
      ctx.save();
      ctx.translate(engineer.x, engineer.y);
      ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
      roundRectPath(-28, -50, 56, 6, 3);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-28, -50, 56 * healthPct, 6, 3);
      ctx.fill();
      ctx.restore();
    }
    drawBossNameplate(engineer, time);
  }

  function drawRocket(rocket, time) {
    if (rocket.health <= 0) {
      return;
    }

    if (rocket.kind === "satellite") {
      drawSatellite(rocket, time);
      return;
    }

    drawRocketShip(rocket, time);
  }

  function drawRocketShip(rocket, time) {
    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = rocket.flash > 0 ? flashColor : rocket.color;
    const chargePct = clamp(rocket.chargePower || 0, 0, 1);
    const charging = rocket.chargeTimer > 0;
    const lockX = Number.isFinite(rocket.lockX) ? rocket.lockX : rocket.x;
    const lockY = Number.isFinite(rocket.lockY) ? rocket.lockY : rocket.y;

    if (charging || rocket.blastTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const dirX = Math.cos((rocket.rotation || 0) - Math.PI / 2);
      const dirY = Math.sin((rocket.rotation || 0) - Math.PI / 2);
      const trailLength = 130 + chargePct * 240;
      const trail = ctx.createLinearGradient(
        rocket.x - dirX * trailLength,
        rocket.y - dirY * trailLength,
        rocket.x,
        rocket.y
      );
      trail.addColorStop(0, "rgba(169, 133, 255, 0)");
      trail.addColorStop(0.48, "rgba(255, 184, 88, " + (0.18 + chargePct * 0.3) + ")");
      trail.addColorStop(1, "rgba(255, 255, 255, " + (0.38 + chargePct * 0.34) + ")");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 18 + chargePct * 22;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rocket.x - dirX * trailLength, rocket.y - dirY * trailLength);
      ctx.lineTo(rocket.x - dirX * 20, rocket.y - dirY * 20);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 184, 88, 0.64)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lockX, lockY, 18 + Math.sin(time * 0.028) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.rotation || 0);
    if (rocket.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(rocket, time);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.globalCompositeOperation = "lighter";
    const flame = ctx.createRadialGradient(0, 38, 4, 0, 58, 68 + chargePct * 64);
    flame.addColorStop(0, "rgba(255, 255, 255, " + (0.42 + chargePct * 0.46) + ")");
    flame.addColorStop(0.32, "rgba(255, 184, 88, " + (0.42 + chargePct * 0.42) + ")");
    flame.addColorStop(1, "rgba(169, 133, 255, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.ellipse(0, 52, 13 + chargePct * 10, 44 + chargePct * 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(shadeColor(hull, -86), 0.98);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.bezierCurveTo(25, -30, 24, 22, 10, 48);
    ctx.lineTo(-10, 48);
    ctx.bezierCurveTo(-24, 22, -25, -30, 0, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, -34), 0.96);
    ctx.beginPath();
    ctx.moveTo(-16, 14);
    ctx.lineTo(-44, 44);
    ctx.lineTo(-13, 39);
    ctx.closePath();
    ctx.moveTo(16, 14);
    ctx.lineTo(44, 44);
    ctx.lineTo(13, 39);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 245, 220, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, -24, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (gameSettings.hudEnabled !== false || rocket.isBoss) {
      const healthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-30, -76, 60, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-30, -76, 60 * healthPct, 7, 3.5);
      ctx.fill();
    }

    ctx.restore();
    drawBossNameplate(rocket, time);
  }

