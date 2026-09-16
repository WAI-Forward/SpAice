  function mappedBodiesForFrame() {
    const frameId = currentRenderFrameId();
    if (
      mapBodyCache.frameId >= 0 &&
      frameId - mapBodyCache.frameId < 6 &&
      mapBodyCache.sourceCount === particles.length
    ) {
      return mapBodyCache.bodies;
    }

    mapBodyCache.frameId = frameId;
    mapBodyCache.sourceCount = particles.length;
    mapBodyCache.bodies = particles.filter(isBodyVisibleOnMap).sort((a, b) => a.mass - b.mass);
    return mapBodyCache.bodies;
  }

  function setTextIfChanged(element, value) {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  }

  function setStyleWidthIfChanged(element, value) {
    if (element && element.style.width !== value) {
      element.style.width = value;
    }
  }

  function setStylePropertyIfChanged(element, property, value) {
    if (!element) {
      return;
    }
    const current = typeof element.style.getPropertyValue === "function"
      ? element.style.getPropertyValue(property)
      : element.style[property];
    if (current !== value) {
      element.style.setProperty(property, value);
    }
  }

  function activePlayerStatusEffectEntries() {
    const disabled = normalizeStatusEffectDuration(playerStatusEffects.disabled);
    if (disabled <= 0) {
      return [];
    }
    const maxDuration = Math.max(disabled, normalizeStatusEffectDuration(playerStatusEffectMaxDurations.disabled));
    return [{
      id: "disabled",
      label: "Disabled",
      icon: "\u26a1",
      remaining: disabled,
      maxDuration,
      seconds: Math.max(0, Math.ceil(disabled))
    }];
  }

  function updatePlayerStatusEffectsHud() {
    if (!playerStatusEffectsHud) {
      return;
    }

    const effects = activePlayerStatusEffectEntries();
    playerStatusEffectsHud.classList.toggle("is-visible", effects.length > 0);
    playerStatusEffectsHud.setAttribute("aria-hidden", effects.length ? "false" : "true");

    while (playerStatusEffectsHud.children.length > effects.length) {
      if (typeof playerStatusEffectsHud.removeChild === "function") {
        const lastChild = playerStatusEffectsHud.lastElementChild || playerStatusEffectsHud.children[playerStatusEffectsHud.children.length - 1];
        playerStatusEffectsHud.removeChild(lastChild);
      } else {
        playerStatusEffectsHud.children.pop();
      }
    }

    effects.forEach((effect, index) => {
      let item = playerStatusEffectsHud.children[index];
      if (!item) {
        item = document.createElement("div");
        item.className = "hud-status-effect";
        item.innerHTML = '<span class="hud-status-effect__icon"></span><span class="hud-status-effect__hand" aria-hidden="true"></span><span class="hud-status-effect__wipe" aria-hidden="true"></span><span class="hud-status-effect__time"></span>';
        playerStatusEffectsHud.appendChild(item);
      }

      item.dataset.status = effect.id;
      item.title = effect.label + " " + effect.seconds + "s";
      item.setAttribute("aria-label", item.title);
      setTextIfChanged(item.querySelector(".hud-status-effect__icon"), effect.icon);
      setTextIfChanged(item.querySelector(".hud-status-effect__time"), effect.seconds + "s");
      const progress = clamp(effect.remaining / Math.max(0.001, effect.maxDuration), 0, 1);
      setStylePropertyIfChanged(item, "--status-progress", progress.toFixed(4));
      setStylePropertyIfChanged(item, "--status-angle", ((1 - progress) * 360).toFixed(1) + "deg");
    });
  }

  function currentTravelVelocitySource() {
    if (player.landed && player.landed.bodyId) {
      const body = bodyById(player.landed.bodyId);
      if (body) {
        return body;
      }
    }
    if (player.spacecraftInterior) {
      const craft = typeof activePlayerSpacecraft === "function" ? activePlayerSpacecraft() : null;
      if (craft) {
        return craft;
      }
    }
    return player;
  }

  function formatTravelSpeed(speed) {
    const normalized = Math.max(0, finiteOr(speed, 0));
    if (normalized < 0.05) {
      return "0";
    }
    if (normalized < 10) {
      return normalized.toFixed(1);
    }
    return String(Math.round(normalized));
  }

  function updateMapSpeedometerHud() {
    if (!mapSpeedValue) {
      return;
    }
    const source = currentTravelVelocitySource();
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    setTextIfChanged(mapSpeedValue, formatTravelSpeed(speed));
  }
