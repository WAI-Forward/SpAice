  function drawRemoteUniverses(time) {
    if (!multiplayer.remoteUniverses.size) {
      return;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    for (const remote of multiplayer.remoteUniverses.values()) {
      const transform = displayTransformFor(remote);
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || transform.alpha <= 0.02) {
        continue;
      }

      const transformAlpha = clamp(transform.alpha, 0, 1);
      const alpha = transformAlpha * remoteUniverseAlphaScale;
      const sharedEntityAlpha = transformAlpha * (transform.phase === "overlap" ? 0.56 : 0.3);
      const sharedBodyAlpha = transform.phase === "overlap" ? sharedEntityAlpha : alpha;
      const remotePlayerAlpha = transformAlpha * (transform.phase === "overlap" ? 0.9 : 0.48);
      const world = snapshot.world;
      const renderRadius = remoteUniverseRenderRadius();
      const renderRadiusSq = renderRadius * renderRadius;
      const quality = renderQuality();
      const lowQuality = quality < 0.7;
      const remoteBodyLimit = Math.round((lowQuality ? 6 : 10) + quality * 13);
      const remoteStructureLimit = Math.round((lowQuality ? 5 : 8) + quality * 11);
      const projectileLimit = Math.round((lowQuality ? 5 : 8) + quality * 11);
      const heavyMobLimit = Math.round((lowQuality ? 3 : 4) + quality * 5);
      const alienoidLimit = Math.round((lowQuality ? 4 : 6) + quality * 6);
      ctx.save();
      ctx.globalAlpha = sharedBodyAlpha;
      ctx.globalCompositeOperation = "lighter";

      let remoteBodiesDrawn = 0;
      for (const particle of world.particles) {
        if (!isMappedBody(particle)) {
          continue;
        }
        const transformed = transformedRemoteEntity(particle, transform);
        if (distanceSqToPlayer(transformed) > renderRadiusSq) {
          continue;
        }
        drawRemoteBodyEcho(transformed, time);
        remoteBodiesDrawn += 1;
        if (remoteBodiesDrawn >= remoteBodyLimit) {
          break;
        }
      }

      ctx.globalCompositeOperation = "source-over";
      let remoteStructuresDrawn = 0;
      for (const structure of world.structures || []) {
        const transformed = transformedRemoteEntity(structure, transform);
        if (distanceSqToPlayer(transformed) > renderRadiusSq) {
          continue;
        }
        drawRemoteStructure(transformed, time);
        remoteStructuresDrawn += 1;
        if (remoteStructuresDrawn >= remoteStructureLimit) {
          break;
        }
      }

      ctx.globalAlpha = sharedEntityAlpha;
      drawRemoteEntityCollection(world.rivalProjectiles, transform, drawRemoteProjectileEcho, time, projectileLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.ufos, transform, drawRemoteMobEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.rambots, transform, drawRemoteMobEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.engineers, transform, drawRemoteMobEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.teslas, transform, drawRemoteMobEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.rockets, transform, drawRemoteMobEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.fighters, transform, drawRemoteMobEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.mobBeacons, transform, drawRemoteMobBeaconEcho, time, heavyMobLimit, renderRadiusSq);
      drawRemoteEntityCollection(world.alienoids, transform, drawRemoteMobEcho, time, alienoidLimit, renderRadiusSq);

      if (snapshot.player) {
        ctx.globalAlpha = remotePlayerAlpha;
        drawRemotePlayer(transformedRemoteEntity({ ...snapshot.player, teamId: remote.teamId || snapshot.player.teamId || "" }, transform), remote.publicName, time);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  function distanceSqToPlayer(entity) {
    const dx = finiteOr(entity && entity.x, player.x) - player.x;
    const dy = finiteOr(entity && entity.y, player.y) - player.y;
    return dx * dx + dy * dy;
  }

  function remoteUniverseRenderRadius() {
    const zoom = Math.max(cameraZoomMin, finiteOr(cameraZoom, 1));
    return Math.hypot(width, height) / zoom * 0.68 + (renderQualityBelow(0.7) ? 980 : 1280);
  }

  function drawRemoteBodyEcho(particle, time) {
    if (!particle || !particle.tier || !particle.color) {
      return;
    }
    const pulse = 1 + Math.sin(time * 0.004 * finiteOr(particle.pulse, 1) + finiteOr(particle.id, 0)) * 0.025;
    drawSimpleBody(particle, Math.max(1, finiteOr(particle.radius, 1)) * pulse, 0.78);
  }

  function drawRemoteProjectileEcho(projectile) {
    if (!projectile) {
      return;
    }
    const length = Math.max(18, finiteOr(projectile.length, 46));
    const speed = Math.hypot(finiteOr(projectile.vx, 0), finiteOr(projectile.vy, 0)) || 1;
    const dirX = finiteOr(projectile.vx, 0) / speed;
    const dirY = finiteOr(projectile.vy, 0) / speed;
    const color = projectile.color || { r: 255, g: 115, b: 173 };

    ctx.save();
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(color, 0.54);
    ctx.lineWidth = projectile.rocket ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(projectile.x - dirX * length, projectile.y - dirY * length);
    ctx.stroke();
    ctx.restore();
  }

  function drawRemoteMobEcho(mob, time) {
    if (!mob) {
      return;
    }
    const radius = Math.max(12, finiteOr(mob.radius, 30) * 0.78);
    const color = mob.color || { r: 120, g: 210, b: 255 };
    const rotation = finiteOr(mob.rotation, 0) + Math.sin(time * 0.004 + finiteOr(mob.wobble, 0)) * 0.08;

    ctx.save();
    ctx.translate(mob.x, mob.y);
    ctx.rotate(rotation);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, 0.28);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = colorString(color, 0.68);
    ctx.strokeStyle = "rgba(3, 8, 24, 0.42)";
    ctx.lineWidth = Math.max(2, radius * 0.11);
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.86, radius * 0.56);
    ctx.lineTo(0, radius * 0.28);
    ctx.lineTo(-radius * 0.86, radius * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawRemoteMobBeaconEcho(beacon, time) {
    drawMobBeacon(beacon, time);
  }

  function drawRemoteEntityCollection(collection, transform, drawFn, time, limit, radiusSq) {
    if (!Array.isArray(collection) || !collection.length) {
      return;
    }
    let drawn = 0;
    for (const entity of collection) {
      const transformed = transformedRemoteEntity(entity, transform);
      if (distanceSqToPlayer(transformed) > radiusSq) {
        continue;
      }
      drawFn(transformed, time);
      drawn += 1;
      if (drawn >= limit) {
        return;
      }
    }
  }

  function drawRemoteStructure(structure, time) {
    if (isKnownStructureType(structure.type)) {
      drawStructure(structure, time, 0.75, true);
      return;
    }

    ctx.save();
    ctx.translate(structure.x, structure.y);
    ctx.rotate(structure.angle || 0);
    ctx.fillStyle = "rgba(88, 226, 255, 0.42)";
    roundRectPath(-10, -10, 20, 20, 5);
    ctx.fill();
    ctx.restore();
  }

  function remoteBodyRotation(remotePlayer) {
    if (remotePlayer.landed) {
      return remotePlayer.landed.angle + Math.PI / 2;
    }

    return finiteOr(remotePlayer.cameraRoll, 0) - cameraRoll;
  }

  function remotePlayerBob(remotePlayer, time) {
    if (remotePlayer.landed) {
      return 0;
    }

    const seed = String(remotePlayer.id || remotePlayer.name || "").length * 0.37;
    return Math.sin(time * 0.004 + seed) * 2.4;
  }

  function traceGadgetFieldCurve(startX, startY, controlX, controlY, endX, endY) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  }

  function strokeSoftGadgetCurve(startX, startY, controlX, controlY, endX, endY, gradient, lineWidth, blur) {
    ctx.save();
    ctx.filter = "blur(" + blur + "px)";
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth * 2.8;
    traceGadgetFieldCurve(startX, startY, controlX, controlY, endX, endY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    traceGadgetFieldCurve(startX, startY, controlX, controlY, endX, endY);
    ctx.stroke();
    ctx.restore();
  }

  function drawGadgetHoldField(originX, originY, dirX, dirY, normalX, normalY, time, compact, holdFactor, reachFactor) {
    const mouthX = originX + dirX * funnelShape.rimX;
    const mouthY = originY + dirY * funnelShape.rimX;
    const holdReach = gadgetHoldReachFromFactors(holdFactor, reachFactor);
    const pointX = originX + dirX * holdReach;
    const pointY = originY + dirY * holdReach;
    const innerWidth = compact ? 106 : 124;
    const outerWidth = compact ? 88 : 106;
    const farReach = gadgetHoldFarReach(reachFactor);
    const farX = originX + dirX * farReach;
    const farY = originY + dirY * farReach;

    ctx.save();
    ctx.filter = "blur(5px)";
    const glow = ctx.createRadialGradient(pointX, pointY, 2, pointX, pointY, compact ? 26 : 32);
    glow.addColorStop(0, "rgba(255, 246, 139, 0.42)");
    glow.addColorStop(0.45, "rgba(126, 255, 191, 0.22)");
    glow.addColorStop(1, "rgba(126, 255, 191, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pointX, pointY, compact ? 28 : 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 9; i += 1) {
      const t = i / 8;
      const side = (t - 0.5) * innerWidth;
      const wave = Math.sin(time + i * 1.45) * (compact ? 4 : 5);
      const startX = mouthX + dirX * 5 + normalX * (side * 0.48 + wave);
      const startY = mouthY + dirY * 5 + normalY * (side * 0.48 + wave);
      const endX = pointX + normalX * side * 0.025;
      const endY = pointY + normalY * side * 0.025;
      const controlX = (startX + endX) / 2 + normalX * (side * 0.18 + Math.sin(time * 0.8 + i) * 8);
      const controlY = (startY + endY) / 2 + normalY * (side * 0.18 + Math.sin(time * 0.8 + i) * 8);
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, "rgba(86, 245, 210, 0.03)");
      gradient.addColorStop(0.48, "rgba(126, 255, 191, 0.2)");
      gradient.addColorStop(1, "rgba(255, 246, 139, 0.42)");
      strokeSoftGadgetCurve(startX, startY, controlX, controlY, endX, endY, gradient, compact ? 1.35 : 1.55, 2.5);
    }

    for (let i = 0; i < 8; i += 1) {
      const t = i / 7;
      const side = (t - 0.5) * outerWidth;
      const wave = Math.sin(time * 1.1 + i * 1.7) * (compact ? 5 : 6);
      const startX = farX + normalX * (side + wave);
      const startY = farY + normalY * (side + wave);
      const endX = pointX + normalX * side * 0.03;
      const endY = pointY + normalY * side * 0.03;
      const controlX = pointX + dirX * (farReach - holdReach) * 0.52 + normalX * (side * 0.44 + wave * 0.35);
      const controlY = pointY + dirY * (farReach - holdReach) * 0.52 + normalY * (side * 0.44 + wave * 0.35);
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, "rgba(172, 255, 164, 0.28)");
      gradient.addColorStop(0.58, "rgba(126, 255, 191, 0.18)");
      gradient.addColorStop(1, "rgba(255, 246, 139, 0.4)");
      strokeSoftGadgetCurve(startX, startY, controlX, controlY, endX, endY, gradient, compact ? 1.45 : 1.7, 2.8);
    }
  }

  function drawRemoteGadgetField(remotePlayer, aimAngle, time) {
    if (isWeaponTool(remotePlayer.equippedTool) || !remotePlayer.toolActive) {
      return;
    }

    const pulling = remotePlayer.toolMode === "pull";
    const pushing = remotePlayer.toolMode === "push";
    const holding = remotePlayer.toolMode === "hold";
    if (!pulling && !pushing && !holding) {
      return;
    }

    const dirX = Math.cos(aimAngle);
    const dirY = Math.sin(aimAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const mouthX = remotePlayer.x + dirX * funnelShape.rimX;
    const mouthY = remotePlayer.y + dirY * funnelShape.rimX;
    const fieldLength = holding ? gadgetHoldReach - funnelShape.rimX : pulling ? 270 : 220;
    const fieldWidth = holding ? 108 : pulling ? 118 : 96;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    if (holding) {
      drawGadgetHoldField(remotePlayer.x, remotePlayer.y, dirX, dirY, normalX, normalY, time * 0.004, true, remotePlayer.holdFactor, remotePlayer.holdRangeFactor);
      ctx.restore();
      return;
    }

    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const side = (t - 0.5) * fieldWidth;
      const wave = Math.sin(time * 0.006 + i * 1.5) * 6;
      const startScale = pulling ? fieldLength : 16;
      const endScale = pulling ? 18 : fieldLength;
      const startX = mouthX + dirX * startScale + normalX * (side + wave);
      const startY = mouthY + dirY * startScale + normalY * (side + wave);
      const endX = mouthX + dirX * endScale + normalX * side * 0.18;
      const endY = mouthY + dirY * endScale + normalY * side * 0.18;
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);

      if (pulling) {
        gradient.addColorStop(0, "rgba(114, 244, 255, 0)");
        gradient.addColorStop(0.58, "rgba(114, 244, 255, 0.18)");
        gradient.addColorStop(1, "rgba(229, 109, 255, 0.4)");
      } else {
        gradient.addColorStop(0, "rgba(255, 229, 120, 0.42)");
        gradient.addColorStop(0.62, "rgba(255, 117, 79, 0.18)");
        gradient.addColorStop(1, "rgba(255, 117, 79, 0)");
      }

      strokeSoftGadgetCurve(
        startX,
        startY,
        (startX + endX) / 2 + normalX * Math.sin(time * 0.004 + i) * 12,
        (startY + endY) / 2 + normalY * Math.sin(time * 0.004 + i) * 12,
        endX,
        endY,
        gradient,
        pulling ? 1.5 : 2.1,
        pulling ? 2.2 : 2.7
      );
    }

    ctx.restore();
  }

  function smoothedRemoteJetpackExhaust(remotePlayer, bodyRotation, time) {
    const remoteId = String(remotePlayer.id || remotePlayer.name || "remote");
    const localVelocity = rotatePoint(remotePlayer.vx || 0, remotePlayer.vy || 0, -bodyRotation);
    const speed = Math.hypot(localVelocity.x, localVelocity.y);
    let target = null;
    const hasJetpackMove = Number.isFinite(Number(remotePlayer.jetpackMoveX)) && Number.isFinite(Number(remotePlayer.jetpackMoveY));
    if (hasJetpackMove) {
      const moveX = finiteOr(remotePlayer.jetpackMoveX, 0);
      const moveY = finiteOr(remotePlayer.jetpackMoveY, -1);
      const moveLength = Math.hypot(moveX, moveY);
      if (moveLength > 0.001) {
        target = {
          x: -moveX / moveLength,
          y: -moveY / moveLength
        };
      }
    }
    if (!target && speed > 8) {
      target = {
        x: -localVelocity.x / speed,
        y: -localVelocity.y / speed
      };
    }

    let state = remoteJetpackExhausts.get(remoteId);
    if (!state) {
      state = {
        x: target ? target.x : 0,
        y: target ? target.y : 1,
        angle: target ? Math.atan2(target.y, target.x) : Math.PI / 2,
        time
      };
      remoteJetpackExhausts.set(remoteId, state);
      return { x: state.x, y: state.y };
    }

    if (!target) {
      target = { x: state.x, y: state.y };
    }

    const dt = state.time > 0 ? clamp((time - state.time) / 1000, 0, 0.08) : 1 / 60;
    const smoothed = easeJetpackExhaustAngle(state, target, dt, jetpackDirectionSmoothing * 0.82);
    state.x = smoothed.x;
    state.y = smoothed.y;
    state.angle = smoothed.angle;
    state.time = time;

    if (remoteJetpackExhausts.size > 64) {
      const oldestAllowed = time - 8000;
      for (const [id, entry] of remoteJetpackExhausts) {
        if (finiteOr(entry.time, 0) < oldestAllowed) {
          remoteJetpackExhausts.delete(id);
        }
      }
    }

    return smoothed;
  }

  function drawRemoteJetFlames(remotePlayer, time, bodyRotation, active) {
    const remoteId = String(remotePlayer.id || remotePlayer.name || "remote");
    const ownerKey = "remote:" + remoteId;
    const shouldEmit = active !== false;
    const boostAmount = shouldEmit ? 1 : 0;
    const cachedExhaust = remoteJetpackExhausts.get(remoteId);
    const exhaust = shouldEmit
      ? smoothedRemoteJetpackExhaust(remotePlayer, bodyRotation, time)
      : cachedExhaust
        ? { x: cachedExhaust.x, y: cachedExhaust.y }
        : { x: 0, y: 1 };
    drawJetpackFlamePlumes(
      time,
      exhaust,
      boostAmount,
      remotePlayer.trailId,
      ownerKey,
      shouldEmit ? null : { emit: false, drawFlame: false }
    );
  }
