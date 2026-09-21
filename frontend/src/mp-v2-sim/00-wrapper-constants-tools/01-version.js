(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ClusternautsMpV2Sim = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = 3;
  const TICK_RATE = 60;
  const TICK_DT = 1 / TICK_RATE;
  const SNAPSHOT_RATE = 20;
  const SNAPSHOT_INTERVAL_TICKS = Math.max(1, Math.round(TICK_RATE / SNAPSHOT_RATE));
  const MAX_PLAYERS = 4;
  function normalizeGameMode(mode) {
    return String(mode || "").toLowerCase() === "survival" ? "survival" : "horde";
  }

  function isHordeGameMode(mode) {
    return normalizeGameMode(mode) === "horde";
  }

  const DEFAULT_TOOL_ID = "suction-gadget";
  const VICIOUS_VACUUM_TOOL_ID = "viscious-vacuum";
  const EMP_TOOL_ID = "emp-tool";
  const FAMILIAR_NET_TOOL_ID = "familiar-net";
  const PISTON_PUNCH_TOOL_ID = "piston-punch";
  const GUIDED_LAUNCHER_TOOL_ID = "guided-launcher";
  const MACHINE_GUN_TOOL_ID = "machine-gun";
  const ROCKET_SUIT_TOOL_ID = "rocket-suit";
  const PERSONAL_TETHER_TOOL_ID = "personal-tether";
  const PLAYER_RADIUS = 34;
  const PLAYER_MAX_HEALTH = 100;
  const PLAYER_MAX_ENERGY = 100;
  const PLAYER_ENERGY_REGEN = 6.5;
  const SUCTION_ENERGY_DRAIN = 12;
  const JETPACK_BOOST_ENERGY_DRAIN = 20;
  const PLAYER_CONTINUOUS_ENERGY_ACTIVATION_COST = 2;
  const TRADING_PORT_MAX_OFFERS = 4;
  const TRADING_PORT_RANGE = 1900;
  const TRADING_PORT_VESSEL_SPEED = 860;
  const TRADING_PORT_VESSEL_MAX_HEALTH = 48;
  const TRADING_PORT_VESSEL_RADIUS = 18;
  const TRADING_PORT_VESSEL_COOLDOWN = 4.2;
  const TRADING_PORT_ACCESS_PADDING = 118;
  const JETPACK_BOOST_THRUST_MULTIPLIER = 1.42;
  const JETPACK_BOOST_SPEED_MULTIPLIER = 1.38;
  const PLAYER_FOOT_OFFSET = 101;
  const PLAYER_HURTBOX_TOP_OFFSET = -38;
  const PLAYER_HURTBOX_BOTTOM_OFFSET = 112;
  const PLAYER_PROJECTILE_HURTBOX_SCALE = 0.72;
  const PLAYER_PICKUP_TOP_OFFSET = -48;
  const PLAYER_PICKUP_BOTTOM_OFFSET = 88;
  const PLAYER_PICKUP_CONTACT_RADIUS = 43;
  const LANDING_RANGE_PADDING = 90;
  const GADGET_FORCE_REACH = 560;
  const GADGET_HOLD_REACH = GADGET_FORCE_REACH * 0.5;
  const GADGET_PUSH_REACH = 470;
  const VICIOUS_VACUUM_MOB_DRAIN_RATE = 16;
  const VICIOUS_VACUUM_MOB_DRAIN_TICK_INTERVAL = 0.18;
  const VICIOUS_VACUUM_BODY_DRAIN_RATE = 2.15;
  const FUNNEL = {
    backX: 88,
    backHalf: 22,
    rimX: 134,
    rimHalf: 40,
    captureX: 111,
    wallThickness: 5
  };
  const BODY_TIERS = [
    { name: "particle", threshold: 0, article: "a", solid: false },
    { name: "rock", threshold: 10, article: "a", solid: false },
    { name: "boulder", threshold: 50, article: "a", solid: true },
    { name: "asteroid", threshold: 150, article: "an", solid: true },
    { name: "moon", threshold: 1500, article: "a", solid: true },
    { name: "planet", threshold: 7500, article: "a", solid: true },
    { name: "star", threshold: 30000, article: "a", solid: true }
  ];
  const BODY_TIER_EVOLUTION_SIZE_SCALE = 1.2;
  const STELLAR_EVOLUTION_END_THRESHOLD = 60000;
  const STELLAR_GROWTH_AVERAGE_WINDOW_SECONDS = 20;
  const STELLAR_GROWTH_RATE_NEUTRON_THRESHOLD = 80;
  const STELLAR_GROWTH_RATE_BLACK_HOLE_THRESHOLD = 220;
  const STELLAR_OUTCOME_TIER_NAMES = ["white dwarf", "neutron star", "black hole"];
  const STELLAR_BRANCH_TIERS = [
    { name: "white dwarf", threshold: STELLAR_EVOLUTION_END_THRESHOLD, article: "a", solid: true },
    { name: "neutron star", threshold: STELLAR_EVOLUTION_END_THRESHOLD, article: "a", solid: true },
    { name: "black hole", threshold: STELLAR_EVOLUTION_END_THRESHOLD, article: "a", solid: true }
  ];
  const TECH_KEYS = ["suction", "weapon", "plating", "energy", "repair", "target", "propulsion", "shield", "communication"];
  const MOB_COLLECTIONS = ["alienoids", "ufos", "rambots", "engineers", "teslas", "rockets", "fighters"];
  const RANDOM_EVENT_DEFINITIONS = [];
  const PARTICLE_STORM_EVENT_ID = "particle-storm";
  const METEOR_SHOWER_EVENT_ID = "meteor-shower";
  const ROGUE_TRADER_EVENT_ID = "rogue-trader";
  const RANDOM_EVENT_DEFAULT_COOLDOWN = 300;
  const RANDOM_EVENT_MIN_COOLDOWN = 240;
  const PARTICLE_STORM_SETTINGS = {
    duration: 52,
    radiusMin: 1350,
    radiusMax: 1900,
    initialCount: 12,
    maxActiveParticles: 32,
    spawnInterval: 0.58
  };
  const METEOR_SHOWER_SETTINGS = {
    duration: 46,
    radiusMin: 2000,
    radiusMax: 2800,
    initialCount: 4,
    maxActiveParticles: 12,
    spawnInterval: 0.95
  };
  const ROGUE_TRADER_EVENT_SETTINGS = {
    duration: 62,
    approachDuration: 8.5,
    leaveDuration: 10,
    radius: 900,
    targetDistanceMin: 1800,
    targetDistanceMax: 2600,
    spawnDistance: 3300,
    earliestSpawnTime: 10 * 60
  };
  const ROGUE_TRADER_SPACECRAFT = {
    blueprintId: "rogue-trader",
    name: "Rogue Trader",
    width: 1120,
    height: 420
  };
  const ROGUE_TRADER_SPACECRAFT_DOOR = {
    x: -560,
    y: -38,
    width: 142,
    height: 278,
    depth: 148,
    threshold: 56
  };
  const ROGUE_TRADER_SPACECRAFT_ROOMS = [
    { id: "airlock", kind: "room", x: -440, y: -35, w: 210, h: 250, floorInset: 26 },
    { id: "cargo-room", kind: "room", x: -245, y: -35, w: 300, h: 250, floorInset: 26 },
    { id: "market-room", kind: "room", x: 75, y: -35, w: 380, h: 250, floorInset: 26 },
    { id: "engine-room", kind: "room", x: 415, y: -35, w: 300, h: 250, floorInset: 26 }
  ];
  const ROGUE_TRADER_SPACECRAFT_COMPONENTS = [
    { id: "airlock", kind: "room", label: "Airlock", x: -440, y: -35, w: 210, h: 250, floorInset: 26, maxHealth: 240 },
    { id: "cargo-room", kind: "room", label: "Cargo Hold", x: -245, y: -35, w: 300, h: 250, floorInset: 26, maxHealth: 320 },
    { id: "market-room", kind: "room", label: "Trading Bay", x: 75, y: -35, w: 380, h: 250, floorInset: 26, maxHealth: 390 },
    { id: "engine-room", kind: "room", label: "Engine Room", x: 415, y: -35, w: 300, h: 250, floorInset: 26, maxHealth: 340 },
    { id: "port-turret", kind: "turret", label: "Port Turret", x: -95, y: -224, radius: 32, maxHealth: 155, angle: -Math.PI / 2 },
    { id: "generator", kind: "generator", label: "Generator", x: 80, y: 80, w: 102, h: 64, maxHealth: 180 },
    { id: "battery", kind: "battery", label: "Battery", x: -155, y: 82, w: 96, h: 62, maxHealth: 155 },
    { id: "life-support", kind: "life-support", label: "Life Support", x: -210, y: -126, w: 116, h: 68, maxHealth: 155 },
    { id: "shield-core", kind: "shields", label: "Shield Core", x: 220, y: -126, w: 104, h: 66, maxHealth: 170 },
    { id: "main-engine", kind: "engine", label: "Main Engine", x: 545, y: 8, w: 110, h: 190, maxHealth: 220 }
  ];
  const MOB_SPAWN_INTERVALS = {
    alienoid: 2 * 60,
    ufo: 3 * 60,
    rambot: 5 * 60,
    engineer: 7 * 60,
    tesla: 11 * 60,
    satellite: 13 * 60,
    rocket: 14 * 60,
    fighter: 16 * 60
  };
  const MOB_WAVE_INTERVAL = MOB_SPAWN_INTERVALS.alienoid;
  const MOB_WAVE_STARTING_MOBS_PER_PLAYER = 3;
  const MOB_WAVE_GROWTH_WAVES = 4;
  const MOB_WAVE_CLUMP_MIN_RADIUS = 38;
  const MOB_WAVE_CLUMP_MAX_RADIUS = 175;
  const MOB_BEACON_WARMUP_DURATION = 60;
  const MOB_BEACON_RESPAWN_DURATION = 5 * 60;
  const MOB_BEACON_MIN_PLAYER_DISTANCE = 2800;
  const MOB_BEACON_MAX_PLAYER_DISTANCE = 6200;
  const MOB_BEACON_PREFERRED_SEPARATION = 1450;
  const MOB_BEACON_MAX_SPEED = 108;
  const MOB_BEACON_DROP_COUNT = 4;
  const MOB_TIER_ORDER = ["alienoid", "ufo", "rambot", "engineer", "tesla", "satellite", "rocket", "fighter"];
  const DIFFICULTY_MOB_SETTINGS = {
    easy: { intervalScale: 0.82, firstWaveDelay: 28, batchScale: 1.12, bonusChanceScale: 1.1, startingBatchBonusChances: [0, 0], damageMultiplier: 0.62, speedMultiplier: 1.08, healthDropMultiplier: 1.1, survivalBudgetScale: 0.88, survivalCampScale: 0.9 },
    medium: { intervalScale: 0.72, firstWaveDelay: 18, batchScale: 1.24, bonusChanceScale: 1.22, startingBatchBonusChances: [0.75, 0.2, 0.09], damageMultiplier: 0.82, speedMultiplier: 1.18, healthDropMultiplier: 0.9, survivalBudgetScale: 1, survivalCampScale: 1 },
    hard: { intervalScale: 0.62, firstWaveDelay: 9, batchScale: 1.38, bonusChanceScale: 1.35, startingBatchBonusChances: [0.9, 0.75, 0.34], damageMultiplier: 1, speedMultiplier: 1.3, healthDropMultiplier: 0.7, survivalBudgetScale: 1.18, survivalCampScale: 1.15 }
  };
  const MOB_TIER_UNLOCK_BASE_DEFEATS = 3;
  const MOB_BOSS_DEFEATS_TO_UNLOCK = 30;
  const MOB_BOSS_WARNING_DURATION = 60;
  const MOB_BOSS_HEALTH_MULTIPLIER = 6;
  const MOB_BOSS_RADIUS_MULTIPLIER = 1.78;
  const MOB_BOSS_DAMAGE_MULTIPLIER = 1.65;
  const MOB_BOSS_STAR_HEALTH_MULTIPLIER = 0.32;
  const MOB_BOSS_STAR_DAMAGE_MULTIPLIER = 0.12;
  const MOB_BOSS_STAR_FORCE_MULTIPLIER = 0.08;
  const MOB_BOSS_STAR_SPEED_MULTIPLIER = 0.07;
  const MOB_BOSS_STAR_COOLDOWN_REDUCTION = 0.05;
  const MOB_BOSS_DROP_COUNT = 10;
  const MOB_ELITE_COMPRESSION_SIZE = 4;
  const MOB_ELITE_MAX_STARS = 3;
  const MOB_ELITE_HEALTH_MULTIPLIER = 2.85;
  const MOB_ELITE_RADIUS_MULTIPLIER = 0.16;
  const MOB_ELITE_DAMAGE_MULTIPLIER = 0.16;
  const MOB_ELITE_FORCE_MULTIPLIER = 0.08;
  const MOB_ELITE_SPEED_MULTIPLIER = 0.05;
  const MOB_ELITE_COOLDOWN_REDUCTION = 0.04;
  const MOB_BOSS_MINION_COOLDOWN_MIN = 8;
  const MOB_BOSS_MINION_COOLDOWN_MAX = 14;
  const MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN = 6;
  const MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX = 10;
  const MOB_BOSS_ESCORT_SPAWN_MIN = 3;
  const MOB_BOSS_ESCORT_SPAWN_MAX = 5;
  const MOB_BOSS_SPAWN_INTERVAL_SCALE = 0.46;
  const MOB_BOSS_SPAWN_TIMER_CEILING_SCALE = 0.32;
  const MOB_BOSS_SPAWN_BATCH_BONUS = 1;
  const MOB_BOSS_LIVE_CAP_BONUS = 3;
  const MOB_BOSS_MAX_SPEED_MULTIPLIER = 1.42;
  const MOB_BOSS_DIRECTIONAL_SPEED_BONUS = 0.62;
  const BASE_MAX_MOB_SPAWN_BATCH_SIZE = 3;
  const MOB_SPAWN_CAP_GROWTH_INTERVAL_MULTIPLIER = 10;
  const THIRD_MOB_SPAWN_CHANCE_SCALE = 0.45;
  const MOB_SPAWN_REST_DURATION = 45;
  const MOB_SPAWN_REST_COOLDOWN = 150;
  const MOB_SPAWN_REST_DRAIN_MAX_DURATION = 90;
  const MOB_SPAWN_REST_MANAGEABLE_MOBS_PER_PLAYER = 3;
  const SURVIVAL_CAMP_LEASH_RADIUS = 2600;
  const SURVIVAL_CAMP_RETURN_RADIUS = 1700;
  const SURVIVAL_CAMP_WAKE_RADIUS = 2100;
  const SURVIVAL_CAMP_AGGRO_DURATION = 90;
  const SURVIVAL_CAMP_BODY_WAKE_DISTANCE = 320;
  const SURVIVAL_CAMP_IDLE_RADIUS = 780;
  const SURVIVAL_CAMP_PATROL_RADIUS = 520;
  const SURVIVAL_CAMP_CHECK_INTERVAL = 12;
  const SURVIVAL_CAMP_RADAR_BODY_MIN_MASS = 150;
  const SURVIVAL_CAMP_SPAWN_MIN_DISTANCE = 9000;
  const SURVIVAL_CAMP_SPAWN_DISTANCE_PADDING = 1200;
  const SURVIVAL_CAMP_SPAWN_DISTANCE_SPREAD = 9000;
  const SURVIVAL_CAMP_ALLOWANCE_PREFERRED_SEPARATION = 4200;
  const SURVIVAL_CAMP_ACTIVE_RADIUS = 42000;
  // This deliberately exceeds the server's 24k survival encounter interest
  // radius. Idle camps are fully awake before a client can receive them.
  const SURVIVAL_CAMP_FULL_SIMULATION_RADIUS = 28000;
  const SURVIVAL_CAMP_EXPANSION_DISTANCE = 32000;
  const SURVIVAL_CAMP_MAX_EXPANSION = 8;
  const SURVIVAL_MIGRATION_AGGRO_RADIUS = 1450;
  const SURVIVAL_AGGRO_DISENGAGE_RADIUS = 6500;
  const SURVIVAL_MIGRATION_MAX_SPEED = 760;
  const SURVIVAL_AGGRO_ALERT_DURATION = 1.4;
  const SURVIVAL_TARGET_LOCK_DURATION = 2;
  const SURVIVAL_TARGET_SWITCH_THREAT_RATIO = 1.35;
  const SURVIVAL_BODY_PROVENANCE_TIMEOUT = 2;
  const SURVIVAL_SALVAGE_ARRIVAL_RADIUS = 620;
  const SURVIVAL_RAMBOT_DEFENSE_SCAN_RADIUS = 6200;
  const SURVIVAL_RAMBOT_DEFENSE_LOOKAHEAD = 18;
  const SURVIVAL_RAMBOT_DEFENSE_PATH_PADDING = 260;
  const SURVIVAL_RAMBOT_DEFENSE_MIN_CLOSING_SPEED = 18;
  const SURVIVAL_RAMBOT_DEFENSE_BODY_IMPULSE = 105;
  const MOB_SPAWN_FULLY_ZOOMED_OUT_VIEW_RADIUS = Math.hypot(1280, 720) / (2 * 0.08);
  const MOB_SPAWN_DISTANCE_BONUS = 320;
  const MOB_SPAWN_SPREAD_MULTIPLIER = 1.25;
  const PROJECTILE_DAMAGE_SPEED = 155;
  const SOLID_BODY_DAMAGE_SPEED = 92;
  const SOLID_BODY_PLAYER_DAMAGE_SPEED = 520;
  const STAR_CONTACT_DAMAGE_PER_SECOND = 34;
  const STAR_CONTACT_DAMAGE_COOLDOWN = 0.55;
  const STAR_CONTACT_KNOCKBACK = 260;
  const BODY_IMPACT_REPEAT_DAMAGE_COOLDOWN = 1.15;
  const BODY_IMPACT_BASE_KNOCKBACK = 145;
  const BODY_IMPACT_MAX_KNOCKBACK = 320;
  const BOSS_BODY_EVADE_DURATION = 1.05;
  const BOSS_BODY_EVADE_MIN_SPEED = 520;
  const BOSS_BODY_EVADE_MAX_SPEED = 960;
  const TECH_PICKUP_LIFETIME = 28;
  const HEALTH_PICKUP_HEAL = 8;
  const HEALTH_PICKUP_LIFETIME = 18;
  const HEALTH_DROP_BASE_CHANCES = {
    default: 0.28,
    ufo: 0.32
  };
  const UFO_TRACTOR_RANGE = 520;
  const UFO_TRACTOR_WIDTH = 118;
  const UFO_TRACTOR_FORCE = 2350;
  const UFO_BEAM_MAX_TURN = 1.15;
  const UFO_BODY_DRAIN_RATE = 1.8;
  const UFO_SAP_FRAGMENT_MASS = 1;
  const UFO_SAP_MAX_FRAGMENTS_PER_BURST = 3;
  const UFO_SAP_SOURCE_GRACE_DURATION = 0.45;
  const UFO_SAP_CARGO_DURATION = 3.25;
  const UFO_UNDERSIDE_DAMAGE = 14;
  const UFO_BOSS_TRACTOR_IMPACT_DISABLE_DURATION = 1.6;
  const UFO_BOSS_NORMAL_BEAM_DURATION = 10;
  const UFO_BOSS_NO_BEAM_DURATION = 2.5;
  const UFO_BOSS_DRAIN_BEAM_DURATION = 10;
  const UFO_BOSS_PLAYER_DRAIN_RATE = 4.6;
  const UFO_BOSS_PLAYER_DRAIN_TICK_INTERVAL = 0.72;
  const RIVAL_PROJECTILE_SPEED = 430;
  const RIVAL_SHOOT_RANGE = 1080;
  const RIVAL_PROJECTILE_DAMAGE = 10;
  const RAMBOT_IMPACT_DAMAGE = 18;
  const RAMBOT_IMPACT_SPEED = 260;
  const RAMBOT_BOSS_PISTON_RANGE = 330;
  const RAMBOT_BOSS_PISTON_DURATION = 0.95;
  const RAMBOT_BOSS_PISTON_DAMAGE = 21;
  const RAMBOT_BOSS_PISTON_KNOCKBACK = 560;
  const RAMBOT_BOSS_HEAD_TURN_LIMIT = Math.PI / 4;
  const RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MIN = 4.2;
  const RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MAX = 6.8;
  const ENGINEER_HEAL_RANGE = 620;
  const ENGINEER_HEAL_RATE = 18;
  const ENGINEER_HEAL_COOLDOWN = 0.55;
  const TESLA_LIGHTNING_RANGE = 830;
  const TESLA_LIGHTNING_DAMAGE = 8;
  const TESLA_TOOL_DISABLE_DURATION = 3.2;
  const EMP_PULSE_RANGE = 900;
  const EMP_PULSE_DISABLE_DURATION = 4.8;
  const EMP_PULSE_ENERGY_COST = 28;
  const EMP_PULSE_COOLDOWN = 7.5;
  const PISTON_PUNCH_RANGE = 235;
  const PISTON_PUNCH_DAMAGE = 32;
  const PISTON_PUNCH_KNOCKBACK = 520;
  const PISTON_PUNCH_ENERGY_COST = 12;
  const PISTON_PUNCH_COOLDOWN = 0.72;
  const FAMILIAR_NET_RANGE = 210;
  const FAMILIAR_NET_CATCH_HALF_ANGLE = 0.74;
  const FAMILIAR_NET_CATCH_LINE_PADDING = 38;
  const FAMILIAR_NET_COOLDOWN = 0.62;
  const FAMILIAR_NET_RELEASE_COOLDOWN = 0.42;
  const FAMILIAR_DAMAGE_PER_SECOND = 28;
  const HOSTILE_FAMILIAR_DAMAGE_PER_SECOND = 18;
  const ENGINEER_BOSS_SUMMON_DURATION = 1.35;
  const ENGINEER_BOSS_SUMMON_RADIUS = 118;
  const TESLA_BOSS_EMP_PULSE_RANGE = 620;
  const TESLA_BOSS_EMP_PULSE_DISABLE_DURATION = 4.8;
  const ROCKET_IMPACT_DAMAGE = 24;
  const ROCKET_IMPACT_SPEED = 320;
  const ROCKET_SUIT_ENERGY_DRAIN = 18;
  const ROCKET_SUIT_BASE_THRUST = 760;
  const ROCKET_SUIT_CHARGE_THRUST = 1680;
  const ROCKET_SUIT_CHARGE_RATE = 0.82;
  const ROCKET_SUIT_CHARGE_DECAY = 1.9;
  const ROCKET_SUIT_BASE_MAX_SPEED = 520;
  const ROCKET_SUIT_CHARGE_MAX_SPEED = 780;
  const ROCKET_SUIT_MOB_DAMAGE = 24;
  const ROCKET_SUIT_MOB_DAMAGE_SPEED_SCALE = 0.036;
  const ROCKET_SUIT_MOB_KNOCKBACK = 330;
  const PERSONAL_TETHER_MAX_ATTACH_DISTANCE = 1600;
  const PERSONAL_TETHER_MAX_REST_LENGTH = 1320;
  const PERSONAL_TETHER_GIVE = 24;
  const PERSONAL_TETHER_SPRING = 7.4;
  const PERSONAL_TETHER_DAMPING = 3.1;
  const PERSONAL_TETHER_BODY_MAX_ACCELERATION = 980;
  const PERSONAL_TETHER_PLAYER_MAX_ACCELERATION = 1550;
  const PERSONAL_TETHER_AIM_PADDING = 84;
  const SPANNER_REPAIR_RATE = 26;
  const SPANNER_DISMANTLE_RATE = 32;
  const SPANNER_REPAIR_RANGE = 125;
  const SPANNER_REPAIR_ENERGY_DRAIN = 8.5;
  const SPANNER_DISMANTLE_ENERGY_DRAIN = 10;
  const SATELLITE_MISSILE_SPEED = 730;
  const SATELLITE_MISSILE_DAMAGE = 15;
  const SATELLITE_LOCK_DURATION = 0.82;
  const SATELLITE_VOLLEY_SPACING = 0.24;
  const SATELLITE_VOLLEY_COUNT = 3;
  const SATELLITE_BOSS_SEEKING_MISSILE_COUNT = 3;
  const SATELLITE_BOSS_SEEKING_MISSILE_SPEED = 500;
  const SATELLITE_BOSS_SEEKING_MISSILE_TURN_RATE = 3.45;
  const SATELLITE_BOSS_SEEKING_MISSILE_LIFE = 5.0;
  const ROCKET_CHARGE_DURATION = 1.18;
  const ROCKET_CHARGE_COOLDOWN_MIN = 1.25;
  const ROCKET_CHARGE_COOLDOWN_MAX = 2.15;
  const ROCKET_CHARGE_MAX_SPEED = 860;
  const FIGHTER_SHOOT_RANGE = 1080;
  const FIGHTER_SHIELD_CYCLE = 10;
  const FIGHTER_SHIELD_MAX_CHARGE = 3;
  const STRUCTURE_RAMBOT_DAMAGE = 34;
  const STRUCTURE_ROCKET_DAMAGE = 30;
  const STRUCTURE_TESLA_DISABLE_DURATION = 4.5;
  const TARGET_AMBIENT_PARTICLES = 94;
  const MOB_DAMAGE_PARTICLE_MIN = 1;
  const MOB_DAMAGE_PARTICLE_MAX = 8;
  const MOB_DAMAGE_PER_PARTICLE = 10;
  const MOB_DAMAGE_PARTICLE_MASS = 1;
  const AMBIENT_PARTICLE_SPAWN_TICK_INTERVAL = 4;
  const AMBIENT_PARTICLE_MIN_PLAYER_DISTANCE = 760;
  const AMBIENT_PARTICLE_MAX_PLAYER_DISTANCE = 1760;
  const AMBIENT_PARTICLE_DENSITY_RADIUS = 1040;
  const AMBIENT_PARTICLE_PLAYFIELD_RADIUS = 1720;
  const AMBIENT_PARTICLE_PLAYFIELD_TARGET = 24;
  const AMBIENT_PARTICLE_CATCHUP_SPAWNS = 8;
  const PICKUP_CLAIM_HISTORY_LIMIT = 512;
  const AMBIENT_PARTICLE_PREFERRED_SPACING = 230;
  const PARTICLE_SPAWN_TRANSITION_DURATION = 0.52;
  const STAR_BIRTH_TRANSITION_DURATION = 1.35;
  const STAR_PARTICLE_EMISSION_BASE_RATE = 0.65;
  const STAR_PARTICLE_EMISSION_RADIUS_SCALE = 0.012;
  const STAR_PARTICLE_EMISSION_MAX_PER_FRAME = 4;
  const ENABLE_MOBS_BY_DEFAULT = false;
  const TOOL_IDS = [DEFAULT_TOOL_ID, VICIOUS_VACUUM_TOOL_ID, "laser-pistol", "laser-rifle", "shotgun", MACHINE_GUN_TOOL_ID, "spanner", EMP_TOOL_ID, FAMILIAR_NET_TOOL_ID, PISTON_PUNCH_TOOL_ID, GUIDED_LAUNCHER_TOOL_ID, ROCKET_SUIT_TOOL_ID, PERSONAL_TETHER_TOOL_ID];
  const STRUCTURE_PLACEMENT_TIER_THRESHOLD = 1500;
  const PLATING_BLOCK_WIDTH = 74;
  const PLATING_BLOCK_HEIGHT = 28;
  const STRUCTURE_SURFACE_OFFSET = 18;
  const MEDBAY_INTERIOR_WIDTH = 118;
  const MEDBAY_HEAL_RATE = 4.5;
  const MEDBAY_ENERGY_DRAIN = 10;
  const ACCUMULATOR_BURST_INTERVAL = 8.5;
  const BATTERY_ENERGY_REGEN_BONUS = 4.2;
  const TURRET_ENERGY_COST = 8;
  const TURRET_LASER_SPEED = 880;
  const TURRET_LASER_DAMAGE = 24;
  const TURRET_LASER_KNOCKBACK = 210;
  const TURRET_SHOOT_COOLDOWN = 2.2;
  const TURRET_RANGE = 625;
  const MISSILE_LAUNCHER_RANGE = 1320;
  const MISSILE_LAUNCHER_PRODUCTION_TIME = 6.4;
  const MISSILE_LAUNCHER_LOCK_DURATION = 0.38;
  const MISSILE_LAUNCHER_ENERGY_COST = 20;
  const LAUNCHER_MISSILE_SPEED = 720;
  const LAUNCHER_MISSILE_DAMAGE = 82;
  const LAUNCHER_MISSILE_KNOCKBACK = 390;
  const ACCUMULATOR_BURST_COST = 6;
  const ACCUMULATOR_BURST_DURATION = 0.62;
  const ACCUMULATOR_RANGE = 680;
  const ACCUMULATOR_FORCE = 620;
  const SHIELD_GENERATOR_PROJECTILE_COST = 10;
  const SHIELD_GENERATOR_ROCKET_COST = 16;
  const SHIELD_GENERATOR_LIGHTNING_COST = 14;
  const SHIELD_GENERATOR_POWER_OUT_DURATION = 1.4;
  const SHIELD_GENERATOR_FIELD_PADDING = 148;
  const SHIELD_GENERATOR_ACTOR_COST = 8;
  const SHIELD_GENERATOR_ACTOR_MIN_BOUNCE_SPEED = 155;
  const TETHER_GIVE_RADIUS_SCALE = 0.45;
  const TETHER_MIN_GIVE = 18;
  const TETHER_MAX_GIVE = 96;
  const TETHER_REST_LENGTH_RADIUS_SCALE = 2.75;
  const TETHER_MIN_REST_LENGTH = 340;
  const TETHER_MAX_REST_LENGTH = 920;
  const TETHER_CONSTRAINT_ITERATIONS = 6;
  const TETHER_POSITION_SLOP = 0.25;
  const TETHER_SPRING = 34;
  const TETHER_DAMPING = 9.5;
  const TETHER_MAX_ACCELERATION = 1800;
  const BRIDGE_HALF_WIDTH = 18;
  const BRIDGE_WALK_TRANSFER_ANGLE = 0.11;
  const BRIDGE_WALK_EXIT_ANGLE_PADDING = 0.045;
  const BRIDGE_MIN_ANCHOR_LENGTH = 80;
  const BRIDGE_MIN_CURVE_LENGTH = 54;
  const BRIDGE_MAX_CURVE_LENGTH = 138;
  const BRIDGE_MAX_ANGULAR_SPEED = 2.7;
  const BRIDGE_ANGULAR_DAMPING = 0.74;
  const BODY_MAX_ANGULAR_SPEED = 3.2;
  const BODY_ANGULAR_VELOCITY_DAMPING = 0.82;
  const BODY_TORQUE_RESPONSE = 0.34;
  const BODY_CONSTRAINT_TORQUE_RESPONSE = 0.18;
  const ORBIT_CAPTURE_MIN_TIER_NAME = "planet";
  const ORBIT_RING_BASE_GAP_SCALE = 0.88;
  const ORBIT_RING_SPACING_SCALE = 0.92;
  const ORBIT_RING_CLEARANCE_MARGIN = 56;
  const ORBIT_RING_MIN_GAP = PLAYER_FOOT_OFFSET + FUNNEL.rimX + ORBIT_RING_CLEARANCE_MARGIN;
  const ORBIT_CAPTURE_BAND_SCALE = 0.15;
  const ORBIT_CAPTURE_MIN_BAND = 54;
  const ORBIT_CAPTURE_MAX_RELATIVE_SPEED = 360;
  const ORBIT_CAPTURE_STRONG_INWARD_SPEED = 230;
  const ORBIT_RADIAL_SPRING = 5.8;
  const ORBIT_RADIAL_DAMPING = 2.7;
  const ORBIT_TANGENTIAL_DAMPING = 2.2;
  const ORBIT_MAX_ACCELERATION = 1380;
  const ORBIT_RETENTION_SECONDS = 0.7;
  const LOCAL_BODY_GRAVITY_RADIUS = 260;
  const LOCAL_BODY_GRAVITY_FORCE = 42;
  const LOCAL_BODY_GRAVITY_MAX_ACCELERATION = 115;
  const JET_ENERGY_DRAIN = 9;
  const JET_THRUST = 620;
  const PLAYER_WEAPON_DEFAULTS = {
    speed: 720,
    damage: 28,
    cooldown: 0.9,
    knockback: 260,
    movementSlow: 0.15,
    life: 0.68,
    length: 50,
    radius: 6,
    energyCost: 8,
    color: { r: 255, g: 115, b: 173 },
    label: "laser pistol"
  };
