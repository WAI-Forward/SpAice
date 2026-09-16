  const cameraZoomMin = 0.08;
  const cameraZoomDefault = 0.62;
  const cameraZoomMax = 1.75;
  const cameraZoomSliderMid = 100;
  const cameraZoomSliderMax = 200;
  const cameraZoomStep = 1.12;
  const cameraWheelZoomStep = 1.08;

  function sliderValueToCameraZoom(value) {
    const sliderValue = clamp(Number(value) || 0, 0, cameraZoomSliderMax);
    if (sliderValue <= cameraZoomSliderMid) {
      return cameraZoomMin + (cameraZoomDefault - cameraZoomMin) * (sliderValue / cameraZoomSliderMid);
    }
    return cameraZoomDefault + (cameraZoomMax - cameraZoomDefault) * ((sliderValue - cameraZoomSliderMid) / cameraZoomSliderMid);
  }

  function cameraZoomToSliderValue(zoom) {
    const clampedZoom = clamp(Number(zoom) || cameraZoomDefault, cameraZoomMin, cameraZoomMax);
    if (clampedZoom <= cameraZoomDefault) {
      return ((clampedZoom - cameraZoomMin) / (cameraZoomDefault - cameraZoomMin)) * cameraZoomSliderMid;
    }
    return cameraZoomSliderMid + ((clampedZoom - cameraZoomDefault) / (cameraZoomMax - cameraZoomDefault)) * cameraZoomSliderMid;
  }

  function setCameraZoom(nextZoom) {
    cameraZoom = clamp(nextZoom, cameraZoomMin, cameraZoomMax);
    gameSettings.zoom = cameraZoom;
    updateZoomUi();
    writeGameSettings();
  }

  function adjustCameraZoom(direction) {
    const multiplier = direction > 0 ? cameraZoomStep : 1 / cameraZoomStep;
    setCameraZoom(cameraZoom * multiplier);
  }

  function adjustCameraZoomFromWheel(deltaY) {
    if (!Number.isFinite(deltaY) || deltaY === 0) {
      return;
    }
    const direction = deltaY > 0 ? -1 : 1;
    const steps = Math.min(6, Math.max(1, Math.ceil(Math.abs(deltaY) / 100)));
    const multiplier = Math.pow(cameraWheelZoomStep, steps * direction);
    setCameraZoom(cameraZoom * multiplier);
  }

  function cameraRollForSurfaceAngle(angle) {
    return -angle - Math.PI / 2;
  }

  function shortestAngleDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function mixColor(a, b, aw, bw) {
    const total = aw + bw;
    return {
      r: Math.round((a.r * aw + b.r * bw) / total),
      g: Math.round((a.g * aw + b.g * bw) / total),
      b: Math.round((a.b * aw + b.b * bw) / total)
    };
  }

  function colorString(color, alpha) {
    return "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + alpha + ")";
  }

  function shadeColor(color, amount) {
    return {
      r: clamp(Math.round(color.r + amount), 0, 255),
      g: clamp(Math.round(color.g + amount), 0, 255),
      b: clamp(Math.round(color.b + amount), 0, 255)
    };
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (hp >= 0 && hp < 1) {
      r1 = c;
      g1 = x;
    } else if (hp < 2) {
      r1 = x;
      g1 = c;
    } else if (hp < 3) {
      g1 = c;
      b1 = x;
    } else if (hp < 4) {
      g1 = x;
      b1 = c;
    } else if (hp < 5) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }

    const m = l - c / 2;
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function randomParticleColor() {
    const hue = randomRange(0, 360);
    return hslToRgb(hue, randomRange(0.74, 0.94), randomRange(0.52, 0.68));
  }

  function ejectedParticleColor(body) {
    const base = body && body.color ? body.color : randomParticleColor();
    return mixColor(base, randomParticleColor(), 3, 1);
  }

  function readSoundPreference() {
    try {
      return readMigratedLocalStorage(soundPreferenceKey, legacySoundPreferenceKey) !== "off";
    } catch (error) {
      return true;
    }
  }

  function writeSoundPreference() {
    try {
      window.localStorage.setItem(soundPreferenceKey, soundState.enabled ? "on" : "off");
    } catch (error) {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  }

  function updateSoundToggle() {
    const audioAllowed = isGameAudioAllowed();
    for (const toggle of [soundToggle, menuSoundToggle]) {
      if (!toggle) {
        continue;
      }
      toggle.classList.toggle("is-active", audioAllowed);
      toggle.classList.toggle("is-muted", !audioAllowed);
      toggle.setAttribute("aria-pressed", soundState.enabled ? "true" : "false");
      toggle.setAttribute("aria-label", soundState.enabled ? "Mute sound effects" : "Unmute sound effects");
      toggle.textContent = audioAllowed ? "SFX On" : "SFX Off";
    }
  }

  function isPlatformAudioMuted() {
    return soundState.platformMuted === true;
  }

  function isEffectiveGameAudioMuted() {
    return isPlatformAudioMuted() || !soundState.enabled;
  }

  function isGameAudioAllowed() {
    return !isEffectiveGameAudioMuted();
  }

  function syncMasterGain() {
    if (soundState.masterGain) {
      soundState.masterGain.gain.value = isGameAudioAllowed() ? 0.72 : 0;
    }
  }

  function ensureAudioContext() {
    if (!soundState.enabled || soundState.unavailable) {
      return null;
    }

    if (!soundState.context) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) {
        return null;
      }

      try {
        const context = new AudioContextConstructor();
        const masterGain = context.createGain();
        masterGain.connect(context.destination);
        soundState.context = context;
        soundState.masterGain = masterGain;
        syncMasterGain();
      } catch (error) {
        soundState.unavailable = true;
        soundState.context = null;
        soundState.masterGain = null;
        soundState.unlocked = false;
        console.warn("Clusternauts audio unavailable.", error);
        return null;
      }
    }

    return soundState.context;
  }

  function unlockAudio() {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      soundState.resumePending = true;
      void Promise.resolve(context.resume()).then(function () {
        soundState.resumePending = false;
        soundState.unlocked = true;
        updateSoundToggle();
      }).catch(function () {
        soundState.resumePending = true;
      });
    } else {
      soundState.resumePending = false;
    }
    soundState.unlocked = true;
    updateSoundToggle();
  }

  function requestAudioResume() {
    if (!soundState.enabled || soundState.unavailable) {
      return;
    }
    const context = ensureAudioContext();
    if (context && context.state === "suspended") {
      soundState.resumePending = true;
    }
  }

  function resumeAudioFromUserGesture() {
    unlockAudio();
  }

  function setSoundEnabled(enabled) {
    soundState.enabled = Boolean(enabled);
    writeSoundPreference();
    syncMasterGain();
    updateSoundToggle();

    if (!isGameAudioAllowed()) {
      return;
    }

    unlockAudio();
    playSound("ui", { throttle: 0 });
  }

  function setPlatformAudioMuted(muted) {
    soundState.platformMuted = Boolean(muted);
    syncMasterGain();
    updateSoundToggle();
  }

  function setCrazyGamesAudioMuted(muted) {
    crazyGamesState.muteAudio = Boolean(muted);
    setPlatformAudioMuted(muted);
  }

  function canPlaySound(key, throttle) {
    if (!isGameAudioAllowed()) {
      return false;
    }

    const context = ensureAudioContext();
    if (!context || !soundState.unlocked) {
      return false;
    }

    const now = context.currentTime;
    const interval = Number.isFinite(throttle) ? throttle : 0.04;
    if (key && now - (soundState.lastPlayed[key] || -Infinity) < interval) {
      return false;
    }

    if (key) {
      soundState.lastPlayed[key] = now;
    }
    return true;
  }

  function connectSoundNode(node) {
    if (soundState.masterGain) {
      node.connect(soundState.masterGain);
    }
  }

  function playTone(options) {
    const context = ensureAudioContext();
    if (!context || !soundState.unlocked) {
      return;
    }

    try {
      const delay = Math.max(0, finiteOr(options.delay, 0));
      const duration = Math.max(0.02, finiteOr(options.duration, 0.16));
      const gainAmount = Math.max(0.0001, finiteOr(options.gain, 0.04));
      const frequency = Math.max(1, finiteOr(options.frequency, 440));
      const endFrequency = Math.max(1, finiteOr(options.endFrequency, frequency));
      const attack = Math.max(0.002, Math.min(duration * 0.45, finiteOr(options.attack, 0.01)));
      const start = context.currentTime + delay;
      const end = start + duration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = options.type || "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
      if (Number.isFinite(options.detune) && oscillator.detune) {
        oscillator.detune.setValueAtTime(options.detune, start);
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainAmount, start + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      connectSoundNode(gain);
      oscillator.start(start);
      oscillator.stop(end + 0.03);
    } catch (error) {
      soundState.unavailable = true;
      console.warn("Clusternauts tone skipped.", error);
    }
  }

  function playNoise(options) {
    const context = ensureAudioContext();
    if (!context || !soundState.unlocked) {
      return;
    }

    try {
      const delay = Math.max(0, finiteOr(options.delay, 0));
      const duration = Math.max(0.02, finiteOr(options.duration, 0.18));
      const gainAmount = Math.max(0.0001, finiteOr(options.gain, 0.04));
      const sampleRate = Math.max(1, finiteOr(context.sampleRate, 44100));
      const start = context.currentTime + delay;
      const end = start + duration;
      const buffer = context.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.65);
      }

      source.buffer = buffer;
      filter.type = options.filterType || "bandpass";
      filter.frequency.setValueAtTime(Math.max(40, finiteOr(options.frequency, 900)), start);
      filter.Q.setValueAtTime(Math.max(0.1, finiteOr(options.q, 1.4)), start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainAmount, start + Math.min(0.015, duration * 0.4));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      source.connect(filter);
      filter.connect(gain);
      connectSoundNode(gain);
      source.start(start);
      source.stop(end + 0.03);
    } catch (error) {
      soundState.unavailable = true;
      console.warn("Clusternauts noise skipped.", error);
    }
  }

  function soundThrottleFor(name) {
    const throttles = {
      select: 0.06,
      laser: 0.08,
      turret: 0.12,
      lock: 0.12,
      rambotCharge: 0.28,
      teslaWarmup: 0.28,
      ufoSiphon: 0.3,
      satelliteLock: 0.24,
      enemyLaser: 0.18,
      fighter: 0.12,
      hit: 0.18,
      mobHit: 0.08,
      merge: 0.09,
      trade: 0.08,
      pickupHealth: 0.08,
      pickupTech: 0.05,
      shield: 0.16,
      detach: 0.16,
      landing: 0.16
    };
    return throttles[name] || 0.04;
  }

