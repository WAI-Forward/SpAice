  function mapMarkerRadius(tierName) {
    const sizes = {
      rock: 6.5,
      boulder: 7,
      asteroid: 7.5,
      moon: 8.5,
      planet: 9.5,
      star: 11,
      "white dwarf": 10.5,
      "neutron star": 10.5,
      "black hole": 11.5
    };
    return sizes[tierName] || 6.5;
  }

  function mapMarkerLabel(tierName) {
    const labels = {
      rock: "R",
      boulder: "B",
      asteroid: "A",
      moon: "M",
      planet: "P",
      star: "S",
      "white dwarf": "W",
      "neutron star": "N",
      "black hole": "B"
    };
    return labels[tierName] || "";
  }

  function mapTitleLabel(value) {
    return String(value || "")
      .split(" ")
      .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : "")
      .join(" ");
  }

  function formatMapDistance(distance) {
    if (distance >= 10000) {
      return Math.round(distance / 1000) + "k";
    }
    if (distance >= 1000) {
      return (distance / 1000).toFixed(distance >= 5000 ? 0 : 1) + "k";
    }
    return Math.round(distance).toString();
  }

  function formatMapNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "n/a";
    }
    return Math.round(number).toLocaleString("en-US");
  }

  function projectMapPoint(worldX, worldY, centerX, centerY, mapRadius, range) {
    const local = rotatePoint(worldX - player.x, worldY - player.y, cameraRoll);
    const distance = Math.hypot(local.x, local.y);
    const markerLimit = mapRadius - 14;
    const markerScale = markerLimit / range;
    const clamped = distance > range;
    const direction = distance > 0 ? { x: local.x / distance, y: local.y / distance } : { x: 0, y: -1 };

    return {
      x: centerX + (clamped ? direction.x * markerLimit : local.x * markerScale),
      y: centerY + (clamped ? direction.y * markerLimit : local.y * markerScale),
      clamped,
      distance
    };
  }

  function collectRemoteMapContacts() {
    const contacts = {
      bodies: [],
      players: []
    };

    for (const remote of multiplayer.remoteUniverses.values()) {
      const transform = displayTransformFor(remote);
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || transform.alpha <= 0.02) {
        continue;
      }

      const alpha = clamp(transform.alpha, 0, 1);
      let remoteMapBodies = 0;
      for (const body of snapshot.world.particles) {
        if (!isBodyVisibleOnMap(body)) {
          continue;
        }
        contacts.bodies.push({
          body: transformedRemoteEntity(body, transform),
          alpha,
          publicName: remote.publicName
        });
        remoteMapBodies += 1;
        if (remoteMapBodies >= 18) {
          break;
        }
      }

      if (snapshot.player) {
        contacts.players.push({
          player: transformedRemoteEntity(snapshot.player, transform),
          alpha,
          publicName: remote.publicName,
          teamId: remote.teamId || snapshot.player.teamId || ""
        });
      }
    }

    return contacts;
  }

  function collectMapCampContacts() {
    const camps = [];
    for (const beacon of mobBeacons) {
      if (!beacon || beacon.health <= 0) {
        continue;
      }
      camps.push(beacon);
    }
    return camps;
  }

  function mapCampDifficultyScore(beacon) {
    const tier = mobTierOrder.indexOf(mobEntityKind(beacon));
    return clamp(tier + 1, 1, mobTierOrder.length);
  }

  function mapCampDifficultyLabel(score) {
    if (score <= 2) {
      return "Low";
    }
    if (score <= 4) {
      return "Medium";
    }
    if (score <= 6) {
      return "High";
    }
    return "Extreme";
  }

  function drawMapCampMarker(beacon, marker) {
    const kind = mobEntityKind(beacon);
    const visual = mobBeaconVisual(kind);
    const color = visual.color || beacon.color || { r: 255, g: 115, b: 173 };
    const score = mapCampDifficultyScore(beacon);
    const radius = 7.5 + score * 0.45;
    const pulse = 1 + Math.sin(performance.now() * 0.006 + finiteOr(beacon.wobble, 0)) * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, marker.clamped ? 0.18 : 0.24);
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, radius * 2.05 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.translate(marker.x, marker.y);
    ctx.rotate(Math.PI / 6 + finiteOr(beacon.rotation, 0) * 0.18);
    ctx.fillStyle = colorString(shadeColor(color, -36), 0.94);
    ctx.strokeStyle = marker.clamped ? "rgba(255, 255, 255, 0.9)" : colorString(color, 0.92);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = i * Math.PI / 3;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.rotate(-Math.PI / 6 - finiteOr(beacon.rotation, 0) * 0.18);
    ctx.fillStyle = colorString(visual.accent || shadeColor(color, 56), 0.96);
      ctx.font = "950 " + Math.max(10, Math.round(radius * 1.18)) + "px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(score), 0, 0.4);
    ctx.restore();
  }

  function drawMapBodyMarker(body, marker, options) {
    const markerRadius = mapMarkerRadius(body.tier.name);
    const label = mapMarkerLabel(body.tier.name);
    const alpha = clamp(options && Number.isFinite(options.alpha) ? options.alpha : 1, 0, 1);
    const remote = Boolean(options && options.remote);
    const haloAlpha = marker.clamped ? 0.12 : 0.15;

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = remote ? "rgba(88, 226, 255, " + 0.24 * alpha + ")" : colorString(body.color, haloAlpha * alpha);
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, markerRadius * (remote ? 1.85 : 1.55), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(body.color, remote ? 0.64 * alpha : 0.8 * alpha);
    ctx.strokeStyle = remote ? "rgba(88, 226, 255, " + 0.94 * alpha + ")" : marker.clamped ? "rgba(255, 255, 255, 0.86)" : "rgba(3, 8, 24, 0.86)";
    ctx.lineWidth = remote ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, markerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (label) {
      ctx.strokeStyle = "rgba(3, 8, 24, " + 0.82 * alpha + ")";
      ctx.lineWidth = 2.6;
      ctx.fillStyle = remote ? "rgba(223, 252, 255, " + alpha + ")" : "#f8fbff";
      ctx.font = "900 " + Math.max(15, Math.round(markerRadius * 1.92)) + "px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(label, marker.x, marker.y + 0.2);
      ctx.fillText(label, marker.x, marker.y + 0.2);
    }

    if (options && options.showDistance) {
      drawMapDistanceLabel(marker.x, marker.y + markerRadius + 8, marker.distance, remote ? alpha : 0.86, remote);
    }
  }

  function drawMapPlayerMarker(contact, marker) {
    const alpha = clamp(contact.alpha, 0, 1);
    const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.12;
    const teammate = Boolean(isSharedPublicWorldActive() && multiplayer.sharedTeamId && contact.teamId === multiplayer.sharedTeamId);
    const markerColor = teammate ? "157, 255, 122" : "255, 115, 173";

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(" + markerColor + ", " + 0.22 * alpha + ")";
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 15 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "rgba(255, 245, 251, " + 0.96 * alpha + ")";
    ctx.strokeStyle = "rgba(" + markerColor + ", " + 0.96 * alpha + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marker.x, marker.y - 8);
    ctx.lineTo(marker.x + 8, marker.y + 7);
    ctx.lineTo(marker.x, marker.y + 3);
    ctx.lineTo(marker.x - 8, marker.y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (marker.clamped) {
      ctx.fillStyle = "rgba(" + markerColor + ", " + 0.92 * alpha + ")";
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawMapDistanceLabel(marker.x, marker.y + 17, marker.distance, alpha, true);
  }

  function drawMapDistanceLabel(x, y, distance, alpha, remote) {
    const label = formatMapDistance(distance);

    ctx.save();
    ctx.font = "850 10px Inter, ui-sans-serif, system-ui, sans-serif";
    const labelWidth = Math.min(58, ctx.measureText(label).width + 12);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = remote ? "rgba(4, 18, 28, " + 0.58 * alpha + ")" : "rgba(3, 8, 24, " + 0.58 * alpha + ")";
    roundRectPath(x - labelWidth / 2, y - 8, labelWidth, 16, 6);
    ctx.fill();
    ctx.fillStyle = remote ? "rgba(223, 252, 255, " + alpha + ")" : "rgba(248, 251, 255, " + alpha + ")";
    ctx.fillText(label, x, y + 0.2, labelWidth - 6);
    ctx.restore();
  }

  function drawMapEventRegion(region, centerX, centerY, mapRadius, range) {
    if (!region) {
      return;
    }
    const marker = projectMapPoint(region.x, region.y, centerX, centerY, mapRadius, range);
    const color = region.color || particleStormMapColor;
    const progress = clamp(finiteOr(region.progress, 0), 0, 1);
    const pulse = 1 + Math.sin(performance.now() * 0.006 + progress * Math.PI * 2) * 0.08;
    const regionRadius = marker.clamped
      ? Math.max(10, mapRadius * 0.08)
      : clamp((finiteOr(region.radius, 0) / Math.max(1, range)) * (mapRadius - 14), 10, mapRadius * 0.82);
    const alpha = 0.78 - progress * 0.22;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, 0.08 * alpha);
    ctx.strokeStyle = colorString(color, 0.62 * alpha);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, regionRadius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colorString(color, 0.26 * alpha);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, regionRadius * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    ctx.font = "850 10px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelBase = String(region.label || "Storm").toUpperCase();
    const label = marker.clamped ? labelBase + " " + formatMapDistance(marker.distance) : labelBase;
    const labelWidth = Math.min(92, ctx.measureText(label).width + 14);
    ctx.fillStyle = "rgba(3, 8, 24, 0.72)";
    roundRectPath(marker.x - labelWidth / 2, marker.y - regionRadius - 20, labelWidth, 16, 6);
    ctx.fill();
    ctx.fillStyle = colorString(color, 0.95 * alpha);
    ctx.fillText(label, marker.x, marker.y - regionRadius - 12, labelWidth - 6);
    ctx.restore();
  }

  function collectSpacecraftMapContacts() {
    const contacts = [];
    for (const craft of spacecrafts) {
      if (!craft || craft.eventId !== rogueTraderEventId) {
        continue;
      }
      contacts.push({
        craft,
        label: "Trader",
        color: rogueTraderMapColor
      });
    }
    return contacts;
  }

  function drawMapSpacecraftMarker(contact, marker) {
    if (!contact || !contact.craft) {
      return;
    }
    const color = contact.color || rogueTraderMapColor;
    const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.08;
    const label = marker.clamped
      ? String(contact.label || "Craft").toUpperCase() + " " + formatMapDistance(marker.distance)
      : String(contact.label || "Craft").toUpperCase();
    ctx.font = "850 10px Inter, ui-sans-serif, system-ui, sans-serif";
    const labelWidth = Math.min(94, ctx.measureText(label).width + 14);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, 0.18);
    ctx.strokeStyle = colorString(color, 0.9);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 8.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(color, 0.96);
    ctx.beginPath();
    ctx.moveTo(marker.x, marker.y - 6);
    ctx.lineTo(marker.x + 6, marker.y + 5);
    ctx.lineTo(marker.x - 6, marker.y + 5);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(3, 8, 24, 0.74)";
    roundRectPath(marker.x - labelWidth / 2, marker.y + 11, labelWidth, 16, 6);
    ctx.fill();
    ctx.fillStyle = colorString(color, 0.95);
    ctx.fillText(label, marker.x, marker.y + 19, labelWidth - 6);
    ctx.restore();
  }
