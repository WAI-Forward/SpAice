  function drawSatellite(rocket, time) {
    if (rocket.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = rocket.flash > 0 ? flashColor : rocket.color;
    const scanPct = clamp(rocket.scanProgress || 0, 0, 1);
    const locking = rocket.lockTimer > 0 || rocket.volleyShots > 0;
    const scanAngle = Number.isFinite(rocket.scannerAngle) ? rocket.scannerAngle : (rocket.rotation || 0) - Math.PI / 2;
    const lockX = Number.isFinite(rocket.lockX) ? rocket.lockX : rocket.x;
    const lockY = Number.isFinite(rocket.lockY) ? rocket.lockY : rocket.y;
    const thrust = rocket.recoverTimer > 0 ? 0.42 : locking ? 0.16 : 0.28;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (!locking) {
      const coneLength = 190 + scanPct * 150;
      ctx.fillStyle = colorString(hull, 0.05 + scanPct * 0.15);
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      ctx.arc(rocket.x, rocket.y, coneLength, scanAngle - 0.28, scanAngle + 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = colorString(hull, 0.22 + scanPct * 0.38);
      ctx.lineWidth = 2 + scanPct * 2;
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, 68 + scanPct * 34, scanAngle - 0.38, scanAngle + 0.38);
      ctx.stroke();
    } else {
      const lockPulse = 0.65 + Math.sin(time * 0.024) * 0.35;
      const reticleRadius = 26 + lockPulse * 8;
      ctx.strokeStyle = "rgba(255, 184, 88, 0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lockX, lockY, reticleRadius, 0, Math.PI * 2);
      ctx.moveTo(lockX - reticleRadius - 14, lockY);
      ctx.lineTo(lockX - 9, lockY);
      ctx.moveTo(lockX + 9, lockY);
      ctx.lineTo(lockX + reticleRadius + 14, lockY);
      ctx.moveTo(lockX, lockY - reticleRadius - 14);
      ctx.lineTo(lockX, lockY - 9);
      ctx.moveTo(lockX, lockY + 9);
      ctx.lineTo(lockX, lockY + reticleRadius + 14);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 184, 88, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      ctx.lineTo(lockX, lockY);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.rotation || 0);
    if (rocket.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(rocket, time);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = colorString(shadeColor(hull, -104), 0.96);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    roundRectPath(-23, -23, 46, 46, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(69, 126, 255, 0.78)";
    ctx.strokeStyle = "rgba(214, 235, 255, 0.72)";
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      roundRectPath(side * 35 - (side < 0 ? 58 : 0), -17, 58, 34, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(side * 35, -14);
      ctx.lineTo(side * 35, 14);
      ctx.moveTo(side * 55, -16);
      ctx.lineTo(side * 55, 16);
      ctx.moveTo(side * 75, -16);
      ctx.lineTo(side * 75, 16);
      ctx.stroke();
    }

    ctx.strokeStyle = colorString(shadeColor(hull, 74), 0.92);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, -58);
    ctx.moveTo(-12, -58);
    ctx.lineTo(12, -58);
    ctx.moveTo(0, 25);
    ctx.lineTo(0, 55);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 42), 0.96);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = locking ? "rgba(255, 184, 88, 0.95)" : colorString(hull, 0.62);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 25 + scanPct * 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.08, scanPct));
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    if (gameSettings.hudEnabled !== false || rocket.isBoss) {
      const satelliteHealthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-30, -74, 60, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = satelliteHealthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-30, -74, 60 * satelliteHealthPct, 7, 3.5);
      ctx.fill();
    }

    ctx.restore();
    drawBossNameplate(rocket, time);
    return;

    ctx.globalCompositeOperation = "lighter";
    const flame = ctx.createRadialGradient(0, 42, 4, 0, 54, 58 * thrust);
    flame.addColorStop(0, "rgba(255, 255, 255, " + (0.76 * thrust) + ")");
    flame.addColorStop(0.32, "rgba(255, 184, 88, " + (0.58 * thrust) + ")");
    flame.addColorStop(1, "rgba(169, 133, 255, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.ellipse(0, 50, 16, 48 * thrust, 0, 0, Math.PI * 2);
    ctx.fill();

    if (rocket.blastTimer > 0) {
      const muzzle = clamp(rocket.blastTimer / 0.18, 0, 1);
      ctx.fillStyle = "rgba(255, 184, 88, " + (0.7 * muzzle) + ")";
      ctx.beginPath();
      ctx.arc(0, -58, 22 + muzzle * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = colorString(hull, 0.54);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -26);
    ctx.lineTo(-43, -42);
    ctx.moveTo(18, -26);
    ctx.lineTo(43, -42);
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 74), 0.92);
    ctx.beginPath();
    ctx.arc(-45, -43, 8 + scanPct * 3, 0, Math.PI * 2);
    ctx.arc(45, -43, 8 + scanPct * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorString(shadeColor(hull, -88), 0.98);
    ctx.strokeStyle = "#121827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.bezierCurveTo(28, -31, 27, 22, 13, 44);
    ctx.lineTo(-13, 44);
    ctx.bezierCurveTo(-27, 22, -28, -31, 0, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, -40), 0.98);
    roundRectPath(-37, -7, 13, 50, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(24, -7, 13, 50, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 64), 0.88);
    ctx.beginPath();
    ctx.ellipse(0, -18, 12, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = locking ? "rgba(255, 184, 88, 0.95)" : "rgba(255, 255, 255, 0.76)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -59, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * scanPct);
    ctx.stroke();

    if (gameSettings.hudEnabled !== false) {
      const healthPct = clamp(rocket.health / rocket.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-30, -76, 60, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-30, -76, 60 * healthPct, 7, 3.5);
      ctx.fill();
    }

    ctx.restore();
    drawBossNameplate(fighter, time);
  }

  function drawFighter(fighter, time) {
    if (fighter.health <= 0) {
      return;
    }

    const flashColor = { r: 255, g: 236, b: 194 };
    const hull = fighter.flash > 0 ? flashColor : fighter.color;
    const shieldPct = clamp((fighter.shieldActive || 0) / 0.55, 0, 1);

    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate(fighter.rotation || 0);
    if (fighter.isBoss) {
      ctx.scale(1.32, 1.32);
      drawBossMobEmbellishments(fighter, time);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (shieldPct > 0 || fighter.shieldCharge > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = colorString(fighter.color, 0.18 + shieldPct * 0.58);
      ctx.lineWidth = 4 + shieldPct * 4;
      ctx.beginPath();
      ctx.arc(0, 0, 58 + Math.sin(time * 0.012) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.fillStyle = colorString(shadeColor(hull, -72), 0.98);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(19, -10);
    ctx.lineTo(53, 22);
    ctx.lineTo(19, 19);
    ctx.lineTo(12, 43);
    ctx.lineTo(0, 30);
    ctx.lineTo(-12, 43);
    ctx.lineTo(-19, 19);
    ctx.lineTo(-53, 22);
    ctx.lineTo(-19, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorString(shadeColor(hull, 54), 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -12, 14, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colorString(shadeColor(hull, 68), 0.92);
    ctx.lineWidth = 6;
    for (const x of [-20, 20]) {
      ctx.beginPath();
      ctx.moveTo(x, -2);
      ctx.lineTo(x, -39);
      ctx.stroke();
    }

    if (gameSettings.hudEnabled !== false || fighter.isBoss) {
      const shieldChargePct = clamp((fighter.shieldCharge || 0) / fighterShieldMaxCharge, 0, 1);
      const healthPct = clamp(fighter.health / fighter.maxHealth, 0, 1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      roundRectPath(-34, -78, 68, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = healthPct > 0.45 ? "#72ff94" : "#ff6d6d";
      roundRectPath(-34, -78, 68 * healthPct, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      roundRectPath(-34, -68, 68, 5, 2.5);
      ctx.fill();
      ctx.fillStyle = colorString(fighter.color, 0.92);
      roundRectPath(-34, -68, 68 * shieldChargePct, 5, 2.5);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawRivalProjectile(projectile) {
    ctx.save();
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const dirX = projectile.vx / speed;
    const dirY = projectile.vy / speed;
    const tailX = projectile.x - dirX * projectile.length;
    const tailY = projectile.y - dirY * projectile.length;
    const fade = clamp(projectile.life / projectile.maxLife, 0, 1);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    if (projectile.lightning) {
      ctx.strokeStyle = colorString(projectile.color, 0.7 * fade);
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      for (let i = 1; i <= 5; i += 1) {
        const t = i / 5;
        const jitter = Math.sin((projectile.x + projectile.y) * 0.03 + i * 2.4 + performance.now() * 0.026) * 16;
        ctx.lineTo(
          tailX + (projectile.x - tailX) * t - dirY * jitter,
          tailY + (projectile.y - tailY) * t + dirX * jitter
        );
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, " + (0.9 * fade) + ")";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (projectile.rocket) {
      const angle = Math.atan2(dirY, dirX);
      const targetCount = Math.max(1, finiteOr(projectile.targetCount, 1));
      const rocketScale = projectile.launchedByStructure ? 1.18 : 1;
      const flameLength = clamp(projectile.length * 0.8, 48, 96) * rocketScale;
      const plumeX = projectile.x - dirX * 16;
      const plumeY = projectile.y - dirY * 16;
      const trail = ctx.createLinearGradient(tailX, tailY, projectile.x, projectile.y);
      trail.addColorStop(0, "rgba(169, 133, 255, 0)");
      trail.addColorStop(0.28, "rgba(255, 115, 173, " + (0.16 * fade) + ")");
      trail.addColorStop(0.64, colorString(projectile.color, 0.36 * fade));
      trail.addColorStop(1, "rgba(255, 245, 220, " + (0.9 * fade) + ")");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 18 * rocketScale;
      ctx.beginPath();
      ctx.moveTo(projectile.x - dirX * flameLength, projectile.y - dirY * flameLength);
      ctx.lineTo(plumeX, plumeY);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, " + (0.54 * fade) + ")";
      ctx.lineWidth = 5 * rocketScale;
      ctx.beginPath();
      ctx.moveTo(projectile.x - dirX * flameLength * 0.58, projectile.y - dirY * flameLength * 0.58);
      ctx.lineTo(plumeX, plumeY);
      ctx.stroke();

      if (projectile.targetX !== undefined && projectile.targetY !== undefined) {
        ctx.strokeStyle = colorString(projectile.color, clamp(0.12 + targetCount * 0.025, 0.14, 0.32) * fade);
        ctx.lineWidth = clamp(1.5 + targetCount * 0.12, 1.5, 3.6);
        ctx.setLineDash([10, 15]);
        ctx.beginPath();
        ctx.moveTo(projectile.x, projectile.y);
        ctx.lineTo(projectile.targetX, projectile.targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalCompositeOperation = "source-over";
      ctx.scale(rocketScale, rocketScale);
      ctx.fillStyle = "#1b2130";
      ctx.strokeStyle = colorString(projectile.color, 0.9 * fade);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(10, 4);
      ctx.lineTo(6, 17);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 17);
      ctx.lineTo(-10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colorString(projectile.color, 0.72 * fade);
      ctx.beginPath();
      ctx.moveTo(-10, 5);
      ctx.lineTo(-18, 13);
      ctx.lineTo(-7, 12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 5);
      ctx.lineTo(18, 13);
      ctx.lineTo(7, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, " + (0.82 * fade) + ")";
      ctx.beginPath();
      ctx.arc(0, -7, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const glow = ctx.createLinearGradient(tailX, tailY, projectile.x, projectile.y);
    glow.addColorStop(0, colorString(projectile.color, 0));
    glow.addColorStop(0.35, colorString(projectile.color, 0.32 * fade));
    glow.addColorStop(1, colorString(projectile.color, 0.86 * fade));
    ctx.strokeStyle = glow;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.88 * fade) + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
    ctx.restore();
  }
