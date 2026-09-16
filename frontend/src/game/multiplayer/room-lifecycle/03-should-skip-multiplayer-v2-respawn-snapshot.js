  function shouldSkipMultiplayerV2RespawnSnapshot(message) {
    if (!multiplayer.v2.respawnAckPending) {
      return false;
    }

    const local = multiplayerV2LocalPlayerFromState(message && message.state);
    if (!local) {
      return false;
    }

    if (finiteOr(local.health, 0) > 0) {
      clearMultiplayerV2RespawnAckPending();
      return false;
    }

    const requestedAt = finiteOr(multiplayer.v2.respawnRequestedAt, 0);
    if (performance.now() - requestedAt <= multiplayerV2RespawnAckGraceMs) {
      return true;
    }

    clearMultiplayerV2RespawnAckPending();
    return false;
  }

  function queueMultiplayerV2Snapshot(message) {
    if (!mpV2Sim || !message || !message.state) {
      return;
    }
    if (!multiplayer.v2.active) {
      applyMultiplayerV2Snapshot(message);
      return;
    }

    const previous = multiplayer.v2.pendingSnapshot;
    const queuedEvents = [];
    if (previous && Array.isArray(previous.events)) {
      queuedEvents.push(...previous.events);
    }
    if (Array.isArray(message.events)) {
      queuedEvents.push(...message.events);
    }
    if (queuedEvents.length > multiplayerV2QueuedSnapshotEventLimit) {
      queuedEvents.splice(0, queuedEvents.length - multiplayerV2QueuedSnapshotEventLimit);
    }

    multiplayer.v2.pendingSnapshot = {
      ...message,
      events: queuedEvents
    };
    updateMultiplayerV2Perf({
      queuedSnapshots: finiteOr(multiplayer.v2.perf && multiplayer.v2.perf.queuedSnapshots, 0) + 1,
      droppedSnapshots: finiteOr(multiplayer.v2.perf && multiplayer.v2.perf.droppedSnapshots, 0) + (previous ? 1 : 0),
      pendingSnapshotEvents: queuedEvents.length
    });
  }

  function flushQueuedMultiplayerV2Snapshot() {
    const snapshot = multiplayer.v2.pendingSnapshot;
    if (!snapshot) {
      return;
    }
    multiplayer.v2.pendingSnapshot = null;
    updateMultiplayerV2Perf({
      pendingSnapshotEvents: 0
    });
    applyMultiplayerV2Snapshot(snapshot);
  }
