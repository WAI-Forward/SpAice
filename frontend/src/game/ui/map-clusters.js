  function mapClusterBodyRadius(body) {
    return Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
  }

  function mapClusterBodyMass(body) {
    return Math.max(1, finiteOr(body && body.mass, 1));
  }

  function mapBodiesShareCamp(a, b) {
    return Boolean(
      a &&
      b &&
      a.survivalCampId &&
      b.survivalCampId &&
      a.survivalCampId === b.survivalCampId
    );
  }

  function mapBodiesShareOrbit(a, b) {
    if (!a || !b) {
      return false;
    }
    const aHostId = Math.max(0, Math.floor(finiteOr(a.orbitHostId, 0)));
    const bHostId = Math.max(0, Math.floor(finiteOr(b.orbitHostId, 0)));
    const aOrbitingB = aHostId > 0 && aHostId === b.id && finiteOr(a.orbitStrength, 0) > 0.02;
    const bOrbitingA = bHostId > 0 && bHostId === a.id && finiteOr(b.orbitStrength, 0) > 0.02;
    return aOrbitingB || bOrbitingA;
  }

  function mapBodyClusterReach(a, b) {
    if (mapBodiesShareOrbit(a, b)) {
      return Infinity;
    }
    const campReach = Math.max(720, finiteOr(survivalCampIdleRadius, 780) * 1.3);
    if (mapBodiesShareCamp(a, b)) {
      return campReach;
    }
    if ((a && a.survivalCampBody) || (b && b.survivalCampBody)) {
      return campReach * 0.82;
    }
    return Math.max(
      finiteOr(localBodyGravityRadius, 260) * 1.75,
      (mapClusterBodyRadius(a) + mapClusterBodyRadius(b)) * 2.2
    );
  }

  function mapBodiesShouldCluster(a, b) {
    if (!a || !b || !a.tier || !b.tier) {
      return false;
    }
    if (mapBodiesShareOrbit(a, b)) {
      return true;
    }
    const reach = mapBodyClusterReach(a, b);
    return Math.hypot(finiteOr(a.x, 0) - finiteOr(b.x, 0), finiteOr(a.y, 0) - finiteOr(b.y, 0)) <= reach;
  }

  function mapClusterKindForBodies(bodies) {
    if (bodies.some((body) => body && body.survivalCampBody)) {
      return "camp";
    }
    if (bodies.some((body) => body && Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0))) > 0 && finiteOr(body.orbitStrength, 0) > 0.02)) {
      return "orbit";
    }
    return "cluster";
  }

  function createMapBodyCluster(bodies) {
    let totalMass = 0;
    let weightedX = 0;
    let weightedY = 0;
    let largestBody = bodies[0] || null;
    for (const body of bodies) {
      const mass = mapClusterBodyMass(body);
      totalMass += mass;
      weightedX += finiteOr(body.x, 0) * mass;
      weightedY += finiteOr(body.y, 0) * mass;
      if (!largestBody || mapClusterBodyMass(body) > mapClusterBodyMass(largestBody)) {
        largestBody = body;
      }
    }

    const x = totalMass > 0 ? weightedX / totalMass : finiteOr(largestBody && largestBody.x, 0);
    const y = totalMass > 0 ? weightedY / totalMass : finiteOr(largestBody && largestBody.y, 0);
    let radius = 0;
    for (const body of bodies) {
      radius = Math.max(radius, Math.hypot(finiteOr(body.x, 0) - x, finiteOr(body.y, 0) - y) + mapClusterBodyRadius(body));
    }

    return {
      bodies,
      count: bodies.length,
      kind: mapClusterKindForBodies(bodies),
      x,
      y,
      radius,
      totalMass,
      largestBody,
      color: largestBody && largestBody.color ? largestBody.color : { r: 88, g: 226, b: 255 }
    };
  }

  function collectMapBodyClusters(bodies) {
    if (!Array.isArray(bodies) || bodies.length < 2) {
      return {
        singles: Array.isArray(bodies) ? bodies : [],
        clusters: []
      };
    }

    const parent = bodies.map((_, index) => index);
    function find(index) {
      let cursor = index;
      while (parent[cursor] !== cursor) {
        parent[cursor] = parent[parent[cursor]];
        cursor = parent[cursor];
      }
      return cursor;
    }
    function union(a, b) {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA !== rootB) {
        parent[rootB] = rootA;
      }
    }

    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        if (mapBodiesShouldCluster(bodies[i], bodies[j])) {
          union(i, j);
        }
      }
    }

    const groups = new Map();
    for (let i = 0; i < bodies.length; i += 1) {
      const root = find(i);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root).push(bodies[i]);
    }

    const singles = [];
    const clusters = [];
    for (const group of groups.values()) {
      if (group.length >= 2) {
        clusters.push(createMapBodyCluster(group));
      } else {
        singles.push(group[0]);
      }
    }

    clusters.sort((a, b) => a.totalMass - b.totalMass);
    singles.sort((a, b) => a.mass - b.mass);
    return { singles, clusters };
  }

  function mapClusterScreenRadius(cluster, mapRadius, range) {
    const worldRadius = Math.max(0, finiteOr(cluster && cluster.radius, 0));
    const worldScreenRadius = (worldRadius / Math.max(1, range)) * Math.max(1, mapRadius - 14);
    const countRadius = 8.5 + Math.sqrt(Math.max(1, finiteOr(cluster && cluster.count, 1))) * 2.8;
    const massRadius = clamp(Math.log10(Math.max(1, finiteOr(cluster && cluster.totalMass, 1))) * 1.35, 0, 5.5);
    return clamp(Math.max(worldScreenRadius, countRadius + massRadius), 11, 28);
  }

  function drawMapClusterMarker(cluster, marker, mapRadius, range) {
    const radius = mapClusterScreenRadius(cluster, mapRadius, range);
    const color = cluster.color || { r: 88, g: 226, b: 255 };
    const pulse = 1 + Math.sin(performance.now() * 0.006 + finiteOr(cluster.totalMass, 0) * 0.001) * 0.07;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorString(color, marker.clamped ? 0.14 : 0.2);
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, radius * 1.75 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorString(color, marker.clamped ? 0.58 : 0.74);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3.5, 3.5]);
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, radius * 1.15 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = colorString(shadeColor(color, -30), 0.9);
    ctx.strokeStyle = marker.clamped ? "rgba(255, 255, 255, 0.92)" : colorString(color, 0.94);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const dotCount = Math.min(5, Math.max(2, Math.floor(finiteOr(cluster.count, 2))));
    ctx.fillStyle = colorString(shadeColor(color, 58), 0.94);
    for (let i = 0; i < dotCount; i += 1) {
      const angle = performance.now() * 0.00035 + i * Math.PI * 2 / dotCount;
      const dotRadius = i === 0 ? radius * 0.18 : radius * 0.13;
      const orbit = radius * (i === 0 ? 0 : 0.46);
      ctx.beginPath();
      ctx.arc(marker.x + Math.cos(angle) * orbit, marker.y + Math.sin(angle) * orbit, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(3, 8, 24, 0.8)";
    ctx.lineWidth = 2.2;
    ctx.fillStyle = "#f8fbff";
    ctx.font = "950 " + Math.max(12, Math.round(radius * 0.92)) + "px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("C", marker.x, marker.y + 0.3);
    ctx.fillText("C", marker.x, marker.y + 0.3);

    if (marker.clamped) {
      drawMapDistanceLabel(marker.x, marker.y + radius + 8, marker.distance, 0.88, false);
    }
    ctx.restore();
  }
