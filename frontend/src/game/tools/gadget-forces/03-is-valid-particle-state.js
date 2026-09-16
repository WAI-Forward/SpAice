  function isValidParticleState(particle) {
    return Boolean(
      particle &&
      particle.tier &&
      Number.isFinite(particle.x) &&
      Number.isFinite(particle.y) &&
      Number.isFinite(particle.vx) &&
      Number.isFinite(particle.vy) &&
      Number.isFinite(particle.mass) &&
      Number.isFinite(particle.radius)
    );
  }

  function activePartyGadgetStates() {
    if (!isPartyHost() || !multiplayer.partyPlayerSnapshots.size) {
      return [];
    }

    const now = performance.now();
    const states = [];
    for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
      if (!entry || now - finiteOr(entry.receivedAt, 0) > 1100) {
        multiplayer.partyPlayerSnapshots.delete(playerId);
        continue;
      }

      const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
      const gadget = source.gadget && typeof source.gadget === "object" ? source.gadget : null;
      const remotePlayer = predictPartyRemotePlayer(
        normalizeRemotePlayerSnapshot(source.player || source),
        entry.receivedAt,
        gadget && gadget.active
          ? { lead: partyRemoteGadgetPredictionLead, maxLead: partyRemoteGadgetPredictionMax }
          : null
      );
      const state = partyGadgetStateForPlayer(remotePlayer, gadget, entry.receivedAt);
      if (state) {
        states.push(state);
      }
    }
    return states;
  }
