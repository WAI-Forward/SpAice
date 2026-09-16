  function drawRemoteAstronautSuit(remotePlayer, time, bob, bodyRotation) {
    const localVelocity = rotatePoint(remotePlayer.vx || 0, remotePlayer.vy || 0, -bodyRotation);
    const lean = remotePlayer.landed ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;
    const damaged = remotePlayer.health <= 0;
    const crouching = remotePlayer.landed && remotePlayer.crouching;
    const suit = skinPaletteForId(remotePlayer.skinId);
    const model = skinModelForId(remotePlayer.skinId);
    const remoteWalkCycle = finiteOr(remotePlayer.walkCycle, remotePlayer.landed ? remotePlayer.landed.walkCycle : time * 0.006);
    const remoteWalkSpeed = remotePlayer.landed ? remotePlayer.landed.walkSpeed || 0 : 0;
    const remoteSpeed = Math.hypot(remotePlayer.vx || 0, remotePlayer.vy || 0);
    const hasBoostingSnapshot = remotePlayer.boosting === true || remotePlayer.boosting === false;
    const remoteJetActive = !remotePlayer.landed && (
      hasBoostingSnapshot
        ? remotePlayer.boosting === true
        : remotePlayer.moving || remoteSpeed > 34
    );
    const remoteTrailOwnerKey = "remote:" + String(remotePlayer.id || remotePlayer.name || "remote");
    const remoteTrailLingering = !remoteJetActive &&
      isStatefulBoostTrailId(remotePlayer.trailId) &&
      smokeTrailHasLivePuffs(remoteTrailOwnerKey, time, remotePlayer.trailId);
    if (model !== "astronaut") {
      drawCharacterBodyOn(ctx, 0, 0, time, localVelocity, bodyRotation, {
        suit,
        model,
        centerX: 0,
        centerY: bob,
        onFoot: Boolean(remotePlayer.landed),
        crouching,
        walkCycle: remoteWalkCycle,
        walkSpeed: remoteWalkSpeed,
        drawJetFlames: remoteJetActive || remoteTrailLingering
          ? function () {
              drawRemoteJetFlames(remotePlayer, time, bodyRotation, remoteJetActive);
            }
          : null
      });
      return;
    }
    const walkBounce = remotePlayer.landed && !crouching && Math.abs(remoteWalkSpeed) > 1
      ? Math.max(0, Math.sin(remoteWalkCycle * 2)) * 3
      : 0;

    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(bodyRotation);
    ctx.translate(0, -walkBounce);
    ctx.rotate(lean);
    if (crouching) {
      ctx.translate(0, playerFootOffset);
      ctx.scale(1.08, 0.84);
      ctx.translate(0, -playerFootOffset);
    }

    if (remoteJetActive || remoteTrailLingering) {
      drawRemoteJetFlames(remotePlayer, time, bodyRotation, remoteJetActive);
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    ctx.lineWidth = 4;

    ctx.fillStyle = damaged ? "#ffd7d7" : suit.torso || "#f4f2ea";
    roundRectPath(-22, 18, 44, 58, 13);
    ctx.fill();
    ctx.stroke();

    drawAstronautLegs(remoteWalkCycle, remoteWalkSpeed, crouching, damaged ? "#e9b9c0" : suit.limb || "#d9dee8");

    ctx.fillStyle = damaged ? "#ffe3e3" : suit.arm || "#f8f5ec";
    roundRectPath(-35, 22, 13, 28, 7);
    ctx.fill();
    ctx.stroke();
    roundRectPath(22, 22, 13, 28, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = damaged ? "#fff1f1" : suit.helmet || "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, -23, 38, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = damaged ? "#fff1f1" : suit.helmet || "#ffffff";
    roundRectPath(-45, -29, 10, 25, 6);
    ctx.fill();
    ctx.stroke();
    roundRectPath(35, -29, 10, 25, 6);
    ctx.fill();
    ctx.stroke();

    const visorGradient = ctx.createLinearGradient(-27, -48, 29, 8);
    visorGradient.addColorStop(0, "#172847");
    visorGradient.addColorStop(0.45, "#050a18");
    visorGradient.addColorStop(1, damaged ? "#69213a" : "#0d3f6a");
    ctx.fillStyle = visorGradient;
    ctx.beginPath();
    ctx.ellipse(0, -24, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
    ctx.beginPath();
    ctx.ellipse(-15, -34, 7, 4, -0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(54, 184, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(12, -18, 11, 7, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = damaged ? "#f0c4cb" : suit.panel || "#cfd7e7";
    roundRectPath(-19, 27, 38, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#172033";
    roundRectPath(-11, 33, 9, 7, 3);
    ctx.fill();
    roundRectPath(2, 33, 9, 7, 3);
    ctx.fill();

    ctx.fillStyle = "#ef6262";
    ctx.beginPath();
    ctx.arc(-7, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = damaged ? "#64e3ff" : suit.accent || "#64e3ff";
    ctx.beginPath();
    ctx.arc(7, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function remoteBodyPoint(x, y, bob, bodyRotation) {
    const point = rotatePoint(x, y, bodyRotation);
    return {
      x: point.x,
      y: bob + point.y
    };
  }

  function remoteGadgetPoint(aimAngle, bob, x, y) {
    const point = rotatePoint(x, y, aimAngle);
    return {
      x: point.x,
      y: bob + point.y
    };
  }

  function drawRemoteHeldArm(startX, startY, hand, bendLift, handAngle, bob, bodyRotation) {
    const shoulder = remoteBodyPoint(startX, startY, bob, bodyRotation);
    const midX = (shoulder.x + hand.x) / 2;
    const midY = (shoulder.y + hand.y) / 2;
    const dx = hand.x - shoulder.x;
    const dy = hand.y - shoulder.y;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;

    drawGripArm(
      shoulder.x,
      shoulder.y,
      midX + normalX * bendLift,
      midY + normalY * bendLift,
      hand.x,
      hand.y,
      handAngle
    );
  }

  function drawRemoteHeldArms(aimAngle, bob, bodyRotation, layer) {
    const topHand = remoteGadgetPoint(aimAngle, bob, 29, -9);
    const lowerHand = remoteGadgetPoint(aimAngle, bob, 46, 17);

    if (layer === "back") {
      drawRemoteHeldArm(-24, 24, topHand, -18, aimAngle - 0.18, bob, bodyRotation);
      return;
    }

    drawRemoteHeldArm(24, 32, lowerHand, 18, aimAngle + 0.18, bob, bodyRotation);
  }

  function drawRemoteLaserPistol(active, weaponId) {
    const rifle = weaponId === "laser-rifle";
    const shotgun = weaponId === "shotgun";
    const machineGun = weaponId === machineGunToolId;
    const barrelLength = rifle ? 76 : machineGun ? 68 : shotgun ? 58 : 52;
    const muzzleX = 60 + barrelLength;
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
      flash.addColorStop(0, "rgba(255, 255, 255, 0.92)");
      flash.addColorStop(0.35, machineGun ? "rgba(119, 167, 255, 0.7)" : shotgun ? "rgba(255, 220, 122, 0.68)" : "rgba(255, 115, 173, 0.66)");
      flash.addColorStop(1, machineGun ? "rgba(119, 167, 255, 0)" : shotgun ? "rgba(255, 220, 122, 0)" : "rgba(255, 115, 173, 0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(muzzleX + 5, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawRemoteSuctionGadget(remotePlayer, time) {
    const active = remotePlayer.toolMode === "pull" || remotePlayer.toolMode === "push" || remotePlayer.toolMode === "hold";
    const energyColor = remotePlayer.toolMode === "hold" ? "#8fffd0" : remotePlayer.toolMode === "push" ? "#ffb35c" : "#67edff";

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

    ctx.fillStyle = "#edf1f5";
    roundRectPath(8, -19, 60, 38, 14);
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 4;
    ctx.stroke();

    const barrelGradient = ctx.createLinearGradient(35, -13, 98, 13);
    barrelGradient.addColorStop(0, "#98a8c1");
    barrelGradient.addColorStop(0.42, "#f8fbff");
    barrelGradient.addColorStop(1, "#8ccfe8");
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

    ctx.fillStyle = "rgba(120, 221, 247, 0.28)";
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
  }

  function drawRemotePistonPunch(remotePlayer) {
    const active = remotePlayer.toolMode === "fire";
    const reach = active ? 108 : 58;
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

    ctx.fillStyle = "#ffd166";
    roundRectPath(reach - 2, -18, 34, 36, 8);
    ctx.fill();
    ctx.stroke();
  }

