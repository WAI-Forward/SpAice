  function mapHoverCandidate(type, entity, marker, options) {
    const markerRadius = options && Number.isFinite(options.radius) ? options.radius : 12;
    return {
      type,
      entity,
      marker,
      label: options && options.label ? options.label : "",
      owner: options && options.owner ? options.owner : "",
      color: options && options.color ? options.color : null,
      hitRadius: Math.max(12, markerRadius + 7),
      priority: options && Number.isFinite(options.priority) ? options.priority : 0
    };
  }

  function selectMapHoverTarget(candidates, mapX, mapY, size) {
    if (!mouse.seen || mouse.x < mapX || mouse.y < mapY || mouse.x > mapX + size || mouse.y > mapY + size) {
      return null;
    }

    let best = null;
    for (const candidate of candidates) {
      if (!candidate || !candidate.marker) {
        continue;
      }
      const screenDistance = Math.hypot(mouse.x - candidate.marker.x, mouse.y - candidate.marker.y);
      if (screenDistance > candidate.hitRadius) {
        continue;
      }
      if (
        !best ||
        screenDistance < best.screenDistance - 0.001 ||
        (Math.abs(screenDistance - best.screenDistance) <= 0.001 && candidate.priority > best.priority)
      ) {
        best = {
          ...candidate,
          screenDistance
        };
      }
    }
    return best;
  }

  function drawMapHoverHighlight(target) {
    if (!target || !target.marker) {
      return;
    }
    const color = target.color || (target.entity && target.entity.color) || { r: 88, g: 226, b: 255 };
    const pulse = 1 + Math.sin(performance.now() * 0.011) * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorString(color, 0.94);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(target.marker.x, target.marker.y, Math.max(target.hitRadius - 2, 12) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(target.marker.x, target.marker.y, Math.max(target.hitRadius + 3, 15) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMapBodyPreview(body, x, y, radius, time) {
    if (!body || !body.tier) {
      return;
    }
    const preview = {
      ...body,
      x,
      y,
      radius,
      spawnAge: particleSpawnTransitionDuration,
      promotionStartedAt: null,
      starBirthAge: starBirthTransitionDuration,
      pulse: finiteOr(body.pulse, 1),
      textureSeed: finiteOr(body.textureSeed, body.id || 1)
    };
    const tierName = preview.tier.name;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.65, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(preview, radius, 0.45);
    ctx.globalCompositeOperation = "source-over";
    if (tierName === "star") {
      drawStarBody(preview, radius * 0.72, time);
    } else if (stellarOutcomeTierNames.includes(tierName)) {
      drawStellarRemnantBody(preview, radius * 0.82, time);
    } else if (tierName === "rock" || tierName === "boulder" || tierName === "asteroid") {
      drawRockBody(preview, radius, tierName);
    } else if (tierName === "moon") {
      drawMoonBody(preview, radius, tierName);
    } else {
      drawPlanetBody(preview, radius);
    }
    ctx.restore();
  }

  function drawMapCampPreview(beacon, x, y, radius, time) {
    const kind = mobEntityKind(beacon);
    const visual = mobBeaconVisual(kind);
    const color = visual.color || beacon.color || { r: 255, g: 115, b: 173 };
    const accent = visual.accent || shadeColor(color, 52);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(finiteOr(beacon && beacon.rotation, 0) + time * 0.0004);
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, 0, radius * 0.16, 0, 0, radius * 2.2);
    glow.addColorStop(0, colorString(color, 0.34));
    glow.addColorStop(1, colorString(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.fillStyle = colorString(shadeColor(color, -42), 0.95);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 3;
      const pointRadius = radius * (i % 2 ? 0.78 : 1);
      const px = Math.cos(angle) * pointRadius;
      const py = Math.sin(angle) * pointRadius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colorString(color, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
    ctx.fill();
    drawMobBeaconGlyph(beacon || { wobble: 0 }, visual, accent, radius * 0.52, time);
    ctx.restore();
  }

  function drawMapClusterPreview(cluster, x, y, radius, time) {
    const color = cluster && cluster.color ? cluster.color : { r: 88, g: 226, b: 255 };
    const count = Math.min(7, Math.max(2, Math.floor(finiteOr(cluster && cluster.count, 2))));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(color, 0.72);
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "source-over";

    for (let i = 0; i < count; i += 1) {
      const angle = time * 0.00045 + i * Math.PI * 2 / count;
      const orbit = i === 0 ? 0 : radius * (0.32 + (i % 3) * 0.16);
      const dotRadius = radius * (i === 0 ? 0.36 : 0.18);
      ctx.fillStyle = colorString(i === 0 ? shadeColor(color, -24) : shadeColor(color, 42), 0.96);
      ctx.strokeStyle = "rgba(248, 251, 255, 0.72)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * orbit, y + Math.sin(angle) * orbit, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function mapHoverRows(target) {
    if (!target) {
      return [];
    }
    if (target.type === "body" || target.type === "remote-body") {
      const body = target.entity;
      return [
        ["Distance", formatMapDistance(target.marker.distance) + " u"],
        ["Mass", formatMapNumber(body && body.mass)],
        ["Radius", formatMapNumber(body && body.radius) + " u"]
      ];
    }
    if (target.type === "camp") {
      const beacon = target.entity;
      const score = mapCampDifficultyScore(beacon);
      const healthPct = beacon && beacon.maxHealth > 0 ? Math.round(clamp(beacon.health / beacon.maxHealth, 0, 1) * 100) : 0;
      const warmupPct = Math.round(clamp(finiteOr(beacon && beacon.age, 0) / mobBeaconWarmupDuration, 0, 1) * 100);
      return [
        ["Difficulty", mapCampDifficultyLabel(score) + " " + score + "/" + mobTierOrder.length],
        ["Distance", formatMapDistance(target.marker.distance) + " u"],
        ["Integrity", healthPct + "%"],
        ["Activity", warmupPct >= 100 ? "Active" : warmupPct + "%"]
      ];
    }
    if (target.type === "cluster") {
      const cluster = target.entity || {};
      const span = Math.max(0, finiteOr(cluster.radius, 0)) * 2;
      return [
        ["Distance", formatMapDistance(target.marker.distance) + " u"],
        ["Bodies", formatMapNumber(cluster.count)],
        ["Span", formatMapDistance(span) + " u"],
        ["Mass", formatMapNumber(cluster.totalMass)]
      ];
    }
    return [
      ["Distance", formatMapDistance(target.marker.distance) + " u"]
    ];
  }

  function mapClusterSurvivalCampIds(cluster) {
    const ids = new Set();
    const bodies = Array.isArray(cluster && cluster.bodies) ? cluster.bodies : [];
    for (const body of bodies) {
      if (body && body.survivalCampId) {
        ids.add(String(body.survivalCampId));
      }
    }
    return ids;
  }

  function isMapCampClusterAggro(cluster) {
    const campIds = mapClusterSurvivalCampIds(cluster);
    if (!campIds.size) {
      return false;
    }

    for (const mob of hostileCombatMobs()) {
      if (
        mob &&
        campIds.has(String(mob.survivalCampId || "")) &&
        finiteOr(mob.health, 0) > 0 &&
        finiteOr(mob.survivalCampAggroTimer, 0) > 0
      ) {
        return true;
      }
    }

    for (const structure of structures) {
      if (
        structure &&
        campIds.has(String(structure.survivalCampId || "")) &&
        finiteOr(structure.health, 0) > 0 &&
        finiteOr(structure.survivalCampAggroTimer, 0) > 0
      ) {
        return true;
      }
    }
    return false;
  }

  function mapHoverTitle(target) {
    if (!target) {
      return "";
    }
    if (target.type === "body" || target.type === "remote-body") {
      const body = target.entity;
      const prefix = target.owner ? target.owner + "'s " : "";
      return prefix + mapTitleLabel(body && body.tier && body.tier.name || "Body");
    }
    if (target.type === "camp") {
      return mobName(target.entity);
    }
    if (target.type === "cluster") {
      const cluster = target.entity || {};
      if (cluster.kind === "camp") {
        return isMapCampClusterAggro(cluster) ? "Enemy Cluster" : "Neutral Cluster";
      }
      if (cluster.kind === "orbit") {
        return "Orbit Cluster";
      }
      return "Cluster";
    }
    return target.label || "Map contact";
  }

  function drawMapHoverPreview(target, x, y, radius, time) {
    if (!target) {
      return;
    }
    if (target.type === "body" || target.type === "remote-body") {
      drawMapBodyPreview(target.entity, x, y, radius, time);
      return;
    }
    if (target.type === "camp") {
      drawMapCampPreview(target.entity, x, y, radius, time);
      return;
    }
    if (target.type === "cluster") {
      drawMapClusterPreview(target.entity, x, y, radius, time);
      return;
    }
    const color = target.color || (target.entity && target.entity.color) || { r: 88, g: 226, b: 255 };
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = colorString(color, 0.94);
    ctx.strokeStyle = "rgba(248, 251, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (target.type === "player" || target.type === "spacecraft") {
      ctx.moveTo(x, y - radius * 0.72);
      ctx.lineTo(x + radius * 0.72, y + radius * 0.64);
      ctx.lineTo(x, y + radius * 0.24);
      ctx.lineTo(x - radius * 0.72, y + radius * 0.64);
      ctx.closePath();
    } else {
      ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawMapHoverPanel(target, time) {
    if (!target) {
      return;
    }

    const rows = mapHoverRows(target);
    const panelWidth = 258;
    const panelHeight = 72 + rows.length * 20;
    let panelX = mouse.x + 16;
    let panelY = mouse.y + 16;
    if (panelX + panelWidth > width - 8) {
      panelX = mouse.x - panelWidth - 16;
    }
    if (panelY + panelHeight > height - 8) {
      panelY = mouse.y - panelHeight - 16;
    }
    panelX = clamp(panelX, 8, Math.max(8, width - panelWidth - 8));
    panelY = clamp(panelY, 8, Math.max(8, height - panelHeight - 8));

    const previewX = panelX + 38;
    const previewY = panelY + 42;
    const textX = panelX + 78;
    const title = mapHoverTitle(target);

    ctx.save();
    ctx.fillStyle = "rgba(3, 8, 24, 0.9)";
    ctx.strokeStyle = "rgba(88, 226, 255, 0.34)";
    ctx.lineWidth = 1;
    roundRectPath(panelX, panelY, panelWidth, panelHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
    roundRectPath(panelX + 10, panelY + 14, 56, 56, 7);
    ctx.fill();
    drawMapHoverPreview(target, previewX, previewY, 21, time);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "950 15px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "#f8fbff";
    ctx.fillText(title, textX, panelY + 27, panelWidth - 90);

    ctx.font = "850 12px Inter, ui-sans-serif, system-ui, sans-serif";
    for (let i = 0; i < rows.length; i += 1) {
      const rowY = panelY + 51 + i * 20;
      ctx.fillStyle = "rgba(232, 241, 255, 0.62)";
      ctx.fillText(rows[i][0], textX, rowY, 82);
      ctx.fillStyle = rows[i][0] === "Difficulty" ? "#ffe56f" : "rgba(223, 252, 255, 0.95)";
      ctx.fillText(rows[i][1], panelX + panelWidth - 100, rowY, 90);
    }
    ctx.restore();
  }

  function drawMapRangeLabel(centerX, centerY, radius, label) {
    const x = centerX + radius * 0.72;
    const y = centerY - radius * 0.72;

    ctx.save();
    ctx.font = "850 10px Inter, ui-sans-serif, system-ui, sans-serif";
    const labelWidth = Math.min(66, ctx.measureText(label).width + 12);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(3, 8, 24, 0.68)";
    roundRectPath(x - labelWidth / 2, y - 8, labelWidth, 16, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(223, 252, 255, 0.82)";
    ctx.fillText(label, x, y + 0.2, labelWidth - 6);
    ctx.restore();
  }
