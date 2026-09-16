  function drawRemoteEmpRemoteControl(remotePlayer, time) {
    const active = remotePlayer.toolMode === "fire" || finiteOr(remotePlayer.toolFireCooldown, 0) > 0;

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
    ctx.arc(0, 6, 10, 0, Math.PI * 2);
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
      ctx.strokeStyle = "rgba(126, 232, 255, 0.58)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.arc(31, -60, 14 + i * 12 + Math.sin(time * 0.018 + i) * 2, -0.88, 0.88);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawRemoteTool(remotePlayer, aimAngle, bob, time) {
    if (!remotePlayer.equippedTool) {
      return;
    }

    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(aimAngle);

    if (isWeaponTool(remotePlayer.equippedTool)) {
      drawRemoteLaserPistol(remotePlayer.toolMode === "fire", remotePlayer.equippedTool);
    } else if (remotePlayer.equippedTool === pistonPunchToolId) {
      drawRemotePistonPunch(remotePlayer);
    } else if (remotePlayer.equippedTool === empToolId) {
      drawRemoteEmpRemoteControl(remotePlayer, time);
    } else {
      drawRemoteSuctionGadget(remotePlayer, time);
    }

    ctx.restore();
  }
