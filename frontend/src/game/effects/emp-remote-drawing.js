  function drawEmpRemoteControl(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const active = !areToolsDisabled() && toolFireCooldown > empPulseCooldown * 0.82;
    const pulse = active ? clamp(toolFireCooldown / empPulseCooldown, 0, 1) : 0;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle - 0.06);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(6, 15);
    ctx.lineTo(37, 22);
    ctx.stroke();
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#20283d";
    roundRectPath(26, 10, 24, 29, 7);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.translate(56, -5);
    ctx.rotate(-0.12);

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(12, -31);
    ctx.lineTo(29, -57);
    ctx.stroke();
    ctx.strokeStyle = "#dffcff";
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.fillStyle = active ? "#7ee8ff" : "#8e9aae";
    ctx.beginPath();
    ctx.arc(31, -60, 3.5, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient = ctx.createLinearGradient(-24, -38, 25, 43);
    bodyGradient.addColorStop(0, "#f8fbff");
    bodyGradient.addColorStop(0.46, "#7ee8ff");
    bodyGradient.addColorStop(1, "#29324c");
    ctx.fillStyle = bodyGradient;
    roundRectPath(-25, -37, 50, 76, 10);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#101829";
    roundRectPath(-16, -25, 32, 18, 5);
    ctx.fill();
    ctx.strokeStyle = active ? "#9dff7a" : "rgba(223, 252, 255, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = active ? "#9dff7a" : "rgba(223, 252, 255, 0.58)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const y = -20 + i * 5;
      const wave = active ? Math.sin(time * 0.022 + i) * 2 : 0;
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.quadraticCurveTo(-2, y - 3 + wave, 6, y);
      ctx.stroke();
    }

    ctx.fillStyle = active ? "#9dff7a" : "#dffcff";
    ctx.beginPath();
    ctx.arc(0, 6, 10 + pulse * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#20283d";
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        ctx.beginPath();
        ctx.arc(-12 + col * 12, 23 + row * 10, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(126, 232, 255, 0.62)";
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(31, -60, 14 + i * 11 + Math.sin(time * 0.018 + i) * 2, -0.88, 0.88);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
    ctx.restore();
  }

  function drawGadget(aim, time) {
    if (!equippedToolId) {
      return;
    }

    if (isWeaponTool(equippedToolId)) {
      drawLaserPistol(aim, time, equippedToolId);
      return;
    }
    if (equippedToolId === guidedLauncherToolId) {
      drawLaserPistol(aim, time, "shotgun");
      return;
    }
    if (equippedToolId === "spanner") {
      drawSpanner(aim, time);
      return;
    }
    if (equippedToolId === familiarNetToolId) {
      drawFamiliarNet(aim, time);
      return;
    }
    if (equippedToolId === pistonPunchToolId) {
      drawPistonPunch(aim, time);
      return;
    }
    if (equippedToolId === empToolId) {
      drawEmpRemoteControl(aim, time);
      return;
    }
    if (equippedToolId === personalTetherToolId) {
      drawPersonalTetherEmitter(aim, time);
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const mode = localGadgetModeForRender();
    const active = mode === "pull" || mode === "push" || mode === "hold";
    const viscious = isVisciousVacuumEquipped();
    const energyColor = mode === "hold" ? "#8fffd0" : mode === "push" ? "#ffb35c" : viscious ? "#ff5f87" : "#67edff";

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(7, 14);
    ctx.lineTo(46, 19);
    ctx.stroke();

    ctx.strokeStyle = "#f4f2ea";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = viscious ? "#ffe6ee" : "#edf1f5";
    roundRectPath(8, -19, 60, 38, 14);
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.stroke();

    const barrelGradient = ctx.createLinearGradient(35, -13, 98, 13);
    barrelGradient.addColorStop(0, "#98a8c1");
    barrelGradient.addColorStop(0.42, "#f8fbff");
    barrelGradient.addColorStop(1, viscious ? "#ff5f87" : "#8ccfe8");
    ctx.fillStyle = barrelGradient;
    roundRectPath(42, -13, 54, 26, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#29324c";
    roundRectPath(20, 16, 28, 18, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#edf1f5";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(28, 18);
    ctx.quadraticCurveTo(36, 35, 51, 25);
    ctx.stroke();

    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(funnelShape.backX, -funnelShape.backHalf);
    ctx.lineTo(funnelShape.rimX, -funnelShape.rimHalf);
    ctx.lineTo(funnelShape.rimX, funnelShape.rimHalf);
    ctx.lineTo(funnelShape.backX, funnelShape.backHalf);
    ctx.closePath();
    ctx.stroke();

    const funnelGradient = ctx.createLinearGradient(
      funnelShape.backX,
      -funnelShape.rimHalf,
      funnelShape.rimX,
      funnelShape.rimHalf
    );
    funnelGradient.addColorStop(0, "#fff7da");
    funnelGradient.addColorStop(0.45, viscious ? "#ff8caf" : "#78ddf7");
    funnelGradient.addColorStop(1, viscious ? "#7139ff" : "#a46bff");
    ctx.fillStyle = funnelGradient;
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.moveTo(funnelShape.backX, -funnelShape.backHalf);
    ctx.lineTo(funnelShape.rimX, -funnelShape.rimHalf);
    ctx.lineTo(funnelShape.rimX, funnelShape.rimHalf);
    ctx.lineTo(funnelShape.backX, funnelShape.backHalf);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    ctx.stroke();

    const mouthGradient = ctx.createRadialGradient(funnelShape.rimX - 4, 0, 4, funnelShape.rimX, 0, funnelShape.rimHalf);
    mouthGradient.addColorStop(0, "rgba(4, 11, 26, 0.03)");
    mouthGradient.addColorStop(0.72, "rgba(4, 11, 26, 0.09)");
    mouthGradient.addColorStop(1, "rgba(255, 255, 255, 0.04)");
    ctx.fillStyle = mouthGradient;
    ctx.beginPath();
    ctx.ellipse(funnelShape.rimX - 2, 0, 13, funnelShape.rimHalf - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = active ? energyColor : "rgba(255, 255, 255, 0.48)";
    ctx.lineWidth = active ? 4 : 2;
    ctx.beginPath();
    ctx.arc(funnelShape.rimX, 0, funnelShape.rimHalf - 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    if (active) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = energyColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        const offset = Math.sin(time * 0.008 + i) * 4;
        ctx.beginPath();
        ctx.arc(funnelShape.rimX + offset, 0, 22 + i * 7, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawPersonalTetherEmitter(aim, time) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const attached = hasPersonalTether();
    const accent = attached ? "#a985ff" : "#dffcff";

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aim.angle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(7, 14);
    ctx.lineTo(43, 20);
    ctx.stroke();
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 4;
    ctx.stroke();

    const bodyGradient = ctx.createLinearGradient(14, -21, 78, 20);
    bodyGradient.addColorStop(0, "#f8fbff");
    bodyGradient.addColorStop(0.46, attached ? "#cbb8ff" : "#9aa4b8");
    bodyGradient.addColorStop(1, "#29324c");
    ctx.fillStyle = bodyGradient;
    roundRectPath(12, -20, 68, 40, 12);
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#20283d";
    roundRectPath(24, 15, 28, 18, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(70, 0);
    ctx.lineTo(112, 0);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = attached ? "#a985ff" : "#dffcff";
    ctx.beginPath();
    ctx.arc(116, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#151829";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (attached) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(169, 133, 255, 0.62)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(116, 0, 18 + i * 8 + Math.sin(time * 0.014 + i) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawPlayer(time) {
    const localVelocity = rotatePoint(player.vx, player.vy, cameraRoll);
    const bodyRotation = playerSurfaceRotation();
    const aim = getAim();

    if (deathState.active) {
      const progress = clamp(deathState.timer / deathAnimationDuration, 0, 1);
      const tumble = progress * progress * Math.PI * 1.7;
      const fade = clamp(1 - Math.max(0, progress - 0.45) / 0.55, 0, 1);
      const deathScale = cameraZoom * (1 - progress * 0.18);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(width / 2, height / 2);
      ctx.rotate(tumble);
      ctx.scale(deathScale, deathScale);
      ctx.translate(-width / 2, -height / 2);
      drawAstronautBody(time, localVelocity, bodyRotation + progress * 0.3);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-width / 2, -height / 2);
    drawGadgetField(aim);
    if (player.rocketSuitActive || finiteOr(player.rocketSuitCharge, 0) > 0.04) {
      drawRocketSuitBody(time, localVelocity, aim);
    } else {
      drawAstronautBody(time, localVelocity, bodyRotation);
      drawHeldArms(aim, time, "back");
      drawGadget(aim, time);
      drawHeldArms(aim, time, "front");
    }
    ctx.restore();
    drawPlayerHealthBar(time);
  }
