  function drawRivals(time) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    for (const ufo of ufos) {
      if (!isWorldCircleNearView(ufo.x, ufo.y, 340, 520)) {
        continue;
      }
      drawUfoTractorBeam(ufo, time);
    }

    for (const projectile of rivalProjectiles) {
      if (!isWorldCircleNearView(projectile.x, projectile.y, finiteOr(projectile.length, 80), 420)) {
        continue;
      }
      drawRivalProjectile(projectile);
    }

    for (const laser of playerLasers) {
      if (!isWorldCircleNearView(laser.x, laser.y, finiteOr(laser.length, 80), 420)) {
        continue;
      }
      drawRivalProjectile(laser);
    }

    for (const missile of launcherMissiles) {
      drawGuidedLauncherPath(missile);
    }

    for (const missile of launcherMissiles) {
      if (!isWorldCircleNearView(missile.x, missile.y, finiteOr(missile.length, 90), 460)) {
        continue;
      }
      drawRivalProjectile(missile);
    }

    drawStructures(time);
    drawStructurePlacementPreview(time);

    for (const beacon of mobBeacons) {
      if (!isMobBeaconRevealed(beacon)) {
        continue;
      }
      if (!isWorldCircleNearView(beacon.x, beacon.y, beacon.radius || 48, 420)) {
        continue;
      }
      drawMobBeacon(beacon, time);
    }

    for (const ufo of ufos) {
      if (!isWorldCircleNearView(ufo.x, ufo.y, ufo.radius || 40, 360)) {
        continue;
      }
      drawUfo(ufo, time);
    }

    for (const rambot of rambots) {
      if (!isWorldCircleNearView(rambot.x, rambot.y, rambot.radius || 42, 320)) {
        continue;
      }
      drawRambot(rambot, time);
    }

    for (const engineer of engineers) {
      if (!isWorldCircleNearView(engineer.x, engineer.y, engineer.radius || 38, 320)) {
        continue;
      }
      drawEngineer(engineer, time);
    }

    for (const tesla of teslas) {
      if (!isWorldCircleNearView(tesla.x, tesla.y, tesla.radius || 38, 360)) {
        continue;
      }
      drawTesla(tesla, time);
    }

    for (const rocket of rockets) {
      if (!isWorldCircleNearView(rocket.x, rocket.y, rocket.radius || 40, 380)) {
        continue;
      }
      drawRocket(rocket, time);
    }

    for (const fighter of fighters) {
      if (!isWorldCircleNearView(fighter.x, fighter.y, fighter.radius || 44, 380)) {
        continue;
      }
      drawFighter(fighter, time);
    }

    for (const rival of rivals) {
      if (!isWorldCircleNearView(rival.x, rival.y, rival.radius || 32, 300)) {
        continue;
      }
      drawRival(rival, time);
    }

    ctx.restore();
  }

  function drawGuidedLauncherPath(missile) {
    if (!missile || !missile.guided || !Array.isArray(missile.guidedPath) || missile.guidedPath.length < 2) {
      return;
    }

    const startIndex = clamp(Math.floor(finiteOr(missile.guidedIndex, 1)) - 1, 0, missile.guidedPath.length - 2);
    const color = missile.color || { r: 255, g: 184, b: 88 };
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = colorString(color, missile.guidedReleased ? 0.28 : 0.48);
    ctx.lineWidth = missile.guidedReleased ? 2.5 : 4;
    ctx.setLineDash(missile.guidedReleased ? [12, 14] : [18, 12]);
    ctx.beginPath();
    ctx.moveTo(missile.x, missile.y);
    for (let i = startIndex + 1; i < missile.guidedPath.length; i += 1) {
      const point = missile.guidedPath[i];
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
  }
