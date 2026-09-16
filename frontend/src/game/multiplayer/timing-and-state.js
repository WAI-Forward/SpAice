  const multiplayerSnapshotInterval = 0.25;
  const partyInputInterval = 0.05;
  const partyActiveInputInterval = 1 / 30;
  const partyWorldSnapshotInterval = 0.1;
  const partyActiveWorldSnapshotInterval = 0.05;
  const partyRemotePredictionLead = 0.12;
  const partyRemotePredictionMax = 0.28;
  const partyRemoteGadgetPredictionLead = 0.06;
  const partyRemoteGadgetPredictionMax = 0.18;
  const partyPhysicsSessionActiveHoldMs = 900;
  const partyPhysicsSessionLocalHoldMs = 860;
  const partyPhysicsSessionUpdateIntervalMs = 34;
  const partyGadgetIntentFreshMs = 1100;
  const partyFollowerPredictionHoldMs = 420;
  const remoteSnapshotRenderDelay = multiplayerSnapshotInterval * 0.8;
  const remoteSnapshotExtrapolateLimit = multiplayerSnapshotInterval * 1.35;
  const remoteSnapshotBufferLimit = 6;
  const multiplayerV2MaxFrameDt = 0.16;
  const multiplayerV2MaxCatchUpSteps = 6;
  const multiplayerV2MaxAccumulator = multiplayerV2MaxFrameDt;
  const multiplayerV2ReplayInputLimit = 24;
  const multiplayerV2QueuedSnapshotEventLimit = 120;
  const multiplayerV2StaleSnapshotTickTolerance = 2;
  const multiplayerV2RespawnAckGraceMs = 5000;
  const multiplayerV2LocalCorrectionBlendPerFrame = 0.42;
  const multiplayerV2RemoteSnapshotRenderDelay = 0.07;
  const multiplayerV2RemoteSnapshotExtrapolateLimit = 0.16;
  const multiplayerMaxClientMessageBytes = 460000;
  const multiplayerBackpressureWarnBytes = 1500000;
  const multiplayerLargeMessageWarnIntervalMs = 5000;
  let multiplayerLastLargeMessageWarnAt = 0;
  const remoteEffectInterval = 0.18;
  const remoteStaleMs = 16000;
  const remoteUniverseAlphaScale = 0.32;
  const playerInteractionRange = 250;
  const playerInteractionChoiceConfigs = {
    trade: { key: "trade", label: "Trade", icon: "$", speech: "Trade?", emote: "swap" },
    team: { key: "team", label: "Team Up", icon: "+", speech: "Team up?", emote: "team" },
    "leave-team": { key: "leave-team", label: "Leave Team", icon: "-", speech: "Leaving team", emote: "leave" },
    duel: { key: "duel", label: "Duel", icon: "!", speech: "Duel?", emote: "duel" },
    truce: { key: "truce", label: "Truce", icon: "=", speech: "Truce?", emote: "peace" }
  };
  const multiplayer = {
    enabled: Boolean(window.WebSocket),
    socket: null,
    connected: false,
    serverUnavailable: false,
    profile: null,
    universeId: "",
    bubbleRadius: 5000,
    roomId: "",
    roomMode: "world-overlap",
    roomPlayerCount: 0,
    roomMaxPlayers: crazyGamesRoomMaxPlayers,
    roomJoinable: false,
    roomCreatePending: false,
    pendingJoinRoomId: "",
    pendingJoinMode: "world-overlap",
    joinRequestedRoomId: "",
    lobby: null,
    lobbyLoadedSnapshot: null,
    lobbyLoadedSaveName: "",
    lobbyCreatePending: false,
    lobbyJoinPending: "",
    lobbyRequestStartedAt: 0,
    lobbyInviteLink: "",
    lobbyGameMode: "horde",
    sharedWorldJoinPending: false,
    sharedWorldStats: null,
    sharedWorldStatsLoading: false,
    sharedWorldStatsLoadedAt: 0,
    sharedTeamId: "",
    sharedTeamMemberIds: new Set(),
    partySession: null,
    partyJoinCode: "",
    partyMode: "solo",
    partyHostId: "",
    partyHostUniverseId: "",
    partyPlayerSnapshots: new Map(),
    partyPhysicsSessions: new Map(),
    partyInputSeqByPlayer: new Map(),
    localPartyPhysicsSessions: new Map(),
    partyPhysicsSeq: 0,
    partyInputTimer: 0,
    partyInputSeq: 0,
    partyLastInputSnapshot: null,
    partySnapshotTimer: 0,
    partyRespawnInvulnerableTimer: 0,
    anomaly: null,
    friendJoinsEnabled: false,
    onlineCount: 0,
    networkStats: {
      sentMessages: 0,
      sentBytes: 0,
      droppedMessages: 0,
      compactedMessages: 0,
      backpressureWarnings: 0,
      lastMessageType: "",
      lastMessageBytes: 0,
      largestMessageType: "",
      largestMessageBytes: 0,
      bufferedAmount: 0
    },
    players: [],
    panelOpen: false,
    socialMode: "online",
    pendingSignal: null,
    remoteUniverses: new Map(),
    snapshotTimer: 0,
    effectTimer: 0,
    reconnectTimer: 0,
    reconnectDelay: 1.5,
    commandOpen: false,
    commandUnlocked: false,
    commandCompletions: [],
    commandCompletionIndex: 0,
    interactionMenu: null,
    incomingInteractions: new Map(),
    remoteEmotes: new Map(),
    duels: new Set(),
    claimedTechPickupIds: new Set(),
    claimedHealthPickupIds: new Set(),
    trade: null,
    v2: {
      active: false,
      roomId: "",
      state: null,
      authoritativeState: null,
      inputSeq: 0,
      clientTick: 0,
      fixedAccumulator: 0,
      sendAccumulator: 0,
      lastSentInput: null,
      pendingInputs: [],
      pendingSnapshot: null,
      landRequested: "",
      familiarNetFireHeld: false,
      familiarNetReleaseHeld: false,
      lastServerTick: 0,
      lastAckInputSeq: 0,
      ignoreDeathEventsBeforeTick: 0,
      respawnAckPending: false,
      respawnRequestedAt: 0,
      respawnRequestTick: 0,
      visualBlend: null,
      pendingMergeVisuals: [],
      eventKeys: new Map(),
      perf: {
        clientStepMs: 0,
        reconcileMs: 0,
        syncMs: 0,
        pendingInputs: 0,
        replayInputs: 0,
        droppedReplayInputs: 0,
        queuedSnapshots: 0,
        droppedSnapshots: 0,
        skippedSnapshots: 0,
        pendingSnapshotEvents: 0,
        ackMissing: 0,
        entityCount: 0,
        snapshotBytes: 0,
        serverStepMs: 0,
        serverSnapshotBytes: 0,
        serverMaxInputQueue: 0
      }
    }
  };
