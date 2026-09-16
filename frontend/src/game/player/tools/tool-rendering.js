  function drawCharacterBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options) {
    const model = options && options.model ? options.model : "astronaut";
    if (model === "medieval-knight") {
      drawMedievalKnightBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options);
      return;
    }
    if (model !== "astronaut") {
      drawThemedCostumeBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options);
      return;
    }
    drawAstronautBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options);
  }

  function drawAstronautBody(time, localVelocity, bodyRotation) {
    const walkSpeed = player.landed
      ? player.landed.walkSpeed || 0
      : (player.spacecraftInterior ? player.spacecraftInterior.walkSpeed || 0 : 0);
    drawCharacterBodyOn(ctx, width, height, time, localVelocity, bodyRotation, {
      suit: activeSkinPalette(),
      model: activeSkinModel(),
      onFoot: playerIsOnFoot(),
      crouching: player.landed && isMovementKeyPressed("down"),
      walkCycle: player.walkCycle,
      walkSpeed,
      drawJetFlames
    });
  }

  function drawSkinPreviewAstronaut(targetCtx, targetWidth, targetHeight, skinId, options) {
    const config = options && typeof options === "object" ? options : {};
    const trailId = normalizeTrailId(config.trailId);
    const bodyRotation = Number.isFinite(Number(config.bodyRotation)) ? Number(config.bodyRotation) : 0;
    const centerX = Number.isFinite(Number(config.centerX)) ? Number(config.centerX) : targetWidth / 2;
    const centerY = Number.isFinite(Number(config.centerY)) ? Number(config.centerY) : targetHeight / 2;
    const onFoot = config.onFoot !== undefined ? Boolean(config.onFoot) : true;
    const exhaust = config.exhaust && typeof config.exhaust === "object" ? config.exhaust : { x: -0.24, y: 0.97 };
    drawCharacterBodyOn(targetCtx, targetWidth, targetHeight, performance.now(), { x: 0, y: 0 }, bodyRotation, {
      suit: skinPaletteForId(skinId),
      model: skinModelForId(skinId),
      onFoot,
      crouching: false,
      walkCycle: 0,
      walkSpeed: 0,
      centerX,
      centerY,
      drawJetFlames: trailId
        ? function (time) {
            drawJetpackFlamePlumesOn(targetCtx, time, exhaust, 1, trailId, "preview:" + trailId);
          }
        : null
    });
  }

  function drawRocketSuitBody(time, localVelocity, aim) {
    const suit = activeSkinPalette();
    const charge = clamp(finiteOr(player.rocketSuitCharge, 0), 0, 1);
    const speed = Math.hypot(finiteOr(player.vx, 0), finiteOr(player.vy, 0));
    const flameScale = clamp(speed / 760 + charge * 0.65, 0.35, 1.65);
    const bob = Math.sin(time * 0.006) * 1.4;

    ctx.save();
    ctx.translate(width / 2, height / 2 + bob);
    ctx.rotate(aim.angle + Math.PI / 2);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.globalCompositeOperation = "lighter";
    const flameLength = 54 * flameScale;
    const flame = ctx.createLinearGradient(0, 64, 0, 64 + flameLength);
    flame.addColorStop(0, "rgba(255, 246, 138, 0.95)");
    flame.addColorStop(0.38, "rgba(255, 167, 56, 0.7)");
    flame.addColorStop(1, "rgba(255, 86, 34, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-20, 58);
    ctx.quadraticCurveTo(-7, 76 + flameLength * 0.25, 0, 64 + flameLength);
    ctx.quadraticCurveTo(9, 76 + flameLength * 0.25, 20, 58);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    ctx.lineWidth = 5;
    const hull = ctx.createLinearGradient(-34, -74, 34, 70);
    hull.addColorStop(0, suit.helmet || "#ffffff");
    hull.addColorStop(0.48, suit.panel || "#dfe6f1");
    hull.addColorStop(1, suit.torso || "#a985ff");
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(0, -86);
    ctx.quadraticCurveTo(35, -44, 29, 42);
    ctx.quadraticCurveTo(18, 72, 0, 78);
    ctx.quadraticCurveTo(-18, 72, -29, 42);
    ctx.quadraticCurveTo(-35, -44, 0, -86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = suit.arm || "#f8f5ec";
    ctx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-29, 22);
    ctx.lineTo(-54, 58);
    ctx.lineTo(-18, 51);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(29, 22);
    ctx.lineTo(54, 58);
    ctx.lineTo(18, 51);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const visorGradient = ctx.createLinearGradient(-23, -50, 23, -14);
    visorGradient.addColorStop(0, "#172847");
    visorGradient.addColorStop(0.5, "#050a18");
    visorGradient.addColorStop(1, "#0d3f6a");
    ctx.fillStyle = visorGradient;
    ctx.beginPath();
    ctx.ellipse(0, -34, 23, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.beginPath();
    ctx.ellipse(-10, -42, 6, 3, -0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = suit.panel || "#cfd7e7";
    roundRectPath(-17, 17, 34, 25, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = suit.accent || "#64e3ff";
    ctx.beginPath();
    ctx.arc(-6, 32, 2.6 + charge * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef6262";
    ctx.beginPath();
    ctx.arc(7, 32, 2.6 + charge * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawLaserPistol(aim, time, weaponId) {
    const rifle = weaponId === "laser-rifle";
    const shotgun = weaponId === "shotgun";
    const machineGun = weaponId === machineGunToolId;
    const weapon = weaponByToolId(weaponId) || playerWeaponDefaults;
    const barrelLength = rifle ? 76 : machineGun ? 68 : shotgun ? 58 : 52;
    const muzzleX = 60 + barrelLength;
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && mouse.left && toolFireCooldown > weapon.cooldown * 0.45;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(5, 13);
    ctx.lineTo(40, 18);
    ctx.stroke();

    ctx.strokeStyle = "#f4f2ea";
    ctx.lineWidth = 4;
    ctx.stroke();

    const bodyGradient = ctx.createLinearGradient(8, -18, 70, 18);
    bodyGradient.addColorStop(0, "#f8fbff");
    bodyGradient.addColorStop(0.5, "#cfd7e7");
    bodyGradient.addColorStop(1, "#8e9aae");
    ctx.fillStyle = bodyGradient;
    roundRectPath(10, -17, 55, 34, 10);
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.stroke();

    const barrelGradient = ctx.createLinearGradient(55, -8, muzzleX, 8);
    barrelGradient.addColorStop(0, "#5f6879");
    barrelGradient.addColorStop(0.42, "#fbf7ff");
    barrelGradient.addColorStop(1, machineGun ? "#77a7ff" : shotgun ? "#ffdc7a" : "#ff73ad");
    ctx.fillStyle = barrelGradient;
    roundRectPath(55, -9, barrelLength, 18, 7);
    ctx.fill();
    ctx.stroke();

    if (shotgun) {
      ctx.fillStyle = "#34394d";
      roundRectPath(55, 7, barrelLength - 6, 12, 5);
      ctx.fill();
      ctx.stroke();
    }

    if (rifle) {
      ctx.fillStyle = "#252b3e";
      roundRectPath(72, 9, 42, 8, 4);
      ctx.fill();
      ctx.stroke();
    }

    if (machineGun) {
      ctx.fillStyle = "#252b3e";
      for (let i = 0; i < 3; i += 1) {
        roundRectPath(74 + i * 14, -18, 8, 9, 3);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.fillStyle = "#2a3047";
    roundRectPath(24, 14, 22, 28, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = machineGun ? "#77a7ff" : shotgun ? "#ffdc7a" : "#ff73ad";
    ctx.beginPath();
    ctx.arc(51, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      const flash = ctx.createRadialGradient(muzzleX + 5, 0, 2, muzzleX + 5, 0, 42);
      flash.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      flash.addColorStop(0.35, machineGun ? "rgba(119, 167, 255, 0.72)" : shotgun ? "rgba(255, 220, 122, 0.7)" : "rgba(255, 115, 173, 0.68)");
      flash.addColorStop(1, machineGun ? "rgba(119, 167, 255, 0)" : shotgun ? "rgba(255, 220, 122, 0)" : "rgba(255, 115, 173, 0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(muzzleX + 5, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawSpanner(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && (mouse.left || mouse.right);
    const swing = mouse.right && toolFireCooldown > currentSpannerStrikeCooldown() * 0.55 ? -0.28 : 0;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle + swing);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(8, 14);
    ctx.lineTo(94, -4);
    ctx.stroke();

    const metal = ctx.createLinearGradient(12, -10, 96, 14);
    metal.addColorStop(0, "#8e9aae");
    metal.addColorStop(0.45, "#f8fbff");
    metal.addColorStop(1, "#66e0b8");
    ctx.strokeStyle = metal;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(102, -6, 17, Math.PI * 0.2, Math.PI * 1.42);
    ctx.stroke();
    ctx.strokeStyle = active ? "#66e0b8" : "#f8fbff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#29324c";
    roundRectPath(16, 7, 31, 19, 7);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(102, 224, 184, 0.62)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(100, -6, 28 + Math.sin(time * 0.02) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawFamiliarNet(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const swingProgress = familiarNetSwingDuration > 0 ? clamp(1 - familiarNetSwingTimer / familiarNetSwingDuration, 0, 1) : 0;
    const swingEase = Math.sin(swingProgress * Math.PI);
    const swingDirection = familiarNetSwingDirection < 0 ? -1 : 1;
    const active = !areToolsDisabled() && (familiarNetSwingTimer > 0 || mouse.left || mouse.right);
    const swing = swingEase * 0.82 * swingDirection + (mouse.right && familiarNetSwingTimer <= 0 ? 0.22 : 0);
    const held = familiarNetCapture ? 1 : 0;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle + swing);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (familiarNetSwingTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(102, 224, 184, " + (0.22 + swingEase * 0.5).toFixed(3) + ")";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(96, -8, 78 + swingEase * 16, -0.78, 0.78);
      ctx.stroke();
      ctx.strokeStyle = "rgba(248, 251, 255, " + (0.18 + swingEase * 0.34).toFixed(3) + ")";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(96, -8, 92 + swingEase * 20, -0.64, 0.64);
      ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(10, 15);
    ctx.lineTo(95, -10);
    ctx.stroke();
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.translate(112, -15);
    ctx.rotate(-0.18);
    ctx.fillStyle = "rgba(102, 224, 184, " + (held ? 0.24 : 0.12) + ")";
    ctx.strokeStyle = active || held ? "#66e0b8" : "rgba(248, 251, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 33, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(223, 252, 255, 0.72)";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-26, i * 8);
      ctx.quadraticCurveTo(0, i * 4 + Math.sin(time * 0.008 + i) * 2, 26, i * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 10, -20);
      ctx.quadraticCurveTo(i * 5, 0, i * 10, 20);
      ctx.stroke();
    }

    if (held) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(102, 224, 184, 0.72)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 40 + Math.sin(time * 0.018) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawPistonPunch(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && toolFireCooldown > pistonPunchCooldown * 0.45;
    const extension = active ? clamp((toolFireCooldown - pistonPunchCooldown * 0.45) / (pistonPunchCooldown * 0.55), 0, 1) : 0;
    const reach = 54 + extension * 58;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(8, 14);
    ctx.lineTo(50, 18);
    ctx.stroke();
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#29324c";
    roundRectPath(13, -18, 48, 36, 10);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(52, 0);
    ctx.lineTo(reach, 0);
    ctx.stroke();

    const pistonGradient = ctx.createLinearGradient(52, -7, reach, 7);
    pistonGradient.addColorStop(0, "#6f7785");
    pistonGradient.addColorStop(0.45, "#f8fbff");
    pistonGradient.addColorStop(1, "#ffd166");
    ctx.strokeStyle = pistonGradient;
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = "#d9e3e8";
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(52, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const headGradient = ctx.createLinearGradient(reach - 4, -20, reach + 34, 20);
    headGradient.addColorStop(0, "#f8fbff");
    headGradient.addColorStop(0.52, "#ffd166");
    headGradient.addColorStop(1, "#8e9aae");
    ctx.fillStyle = headGradient;
    roundRectPath(reach - 2, -20, 38, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#151829";
    roundRectPath(reach + 6, -11, 20, 6, 3);
    ctx.fill();
    roundRectPath(reach + 6, 5, 20, 6, 3);
    ctx.fill();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      const flash = ctx.createRadialGradient(reach + 32, 0, 3, reach + 32, 0, 46);
      flash.addColorStop(0, "rgba(255, 255, 255, 0.86)");
      flash.addColorStop(0.38, "rgba(255, 209, 102, 0.58)");
      flash.addColorStop(1, "rgba(255, 209, 102, 0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(reach + 32, 0, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }
