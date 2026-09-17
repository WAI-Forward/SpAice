(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ClusternautsMpV2Sim = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = 2;
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
    easy: { intervalScale: 0.82, firstWaveDelay: 28, batchScale: 1.12, bonusChanceScale: 1.1, startingBatchBonusChances: [0, 0], damageMultiplier: 0.62, healthDropMultiplier: 1.1, survivalBudgetScale: 0.88, survivalCampScale: 0.9 },
    medium: { intervalScale: 0.72, firstWaveDelay: 18, batchScale: 1.24, bonusChanceScale: 1.22, startingBatchBonusChances: [0.75, 0.2, 0.09], damageMultiplier: 0.82, healthDropMultiplier: 0.9, survivalBudgetScale: 1, survivalCampScale: 1 },
    hard: { intervalScale: 0.62, firstWaveDelay: 9, batchScale: 1.38, bonusChanceScale: 1.35, startingBatchBonusChances: [0.9, 0.75, 0.34], damageMultiplier: 1, healthDropMultiplier: 0.7, survivalBudgetScale: 1.18, survivalCampScale: 1.15 }
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
  const SURVIVAL_CAMP_CHECK_INTERVAL = 8;
  const SURVIVAL_CAMP_RADAR_BODY_MIN_MASS = 150;
  const SURVIVAL_CAMP_SPAWN_MIN_DISTANCE = 9000;
  const SURVIVAL_CAMP_SPAWN_DISTANCE_PADDING = 1200;
  const SURVIVAL_CAMP_SPAWN_DISTANCE_SPREAD = 9000;
  const SURVIVAL_CAMP_ALLOWANCE_PREFERRED_SEPARATION = 4200;
  const SURVIVAL_CAMP_ACTIVE_RADIUS = 42000;
  const SURVIVAL_CAMP_EXPANSION_DISTANCE = 32000;
  const SURVIVAL_CAMP_MAX_EXPANSION = 8;
  const SURVIVAL_MIGRATION_AGGRO_RADIUS = 1450;
  const SURVIVAL_MIGRATION_AGGRO_DURATION = 14;
  const SURVIVAL_MIGRATION_MAX_SPEED = 760;
  const SURVIVAL_SALVAGE_MAX_UFOS = 3;
  const SURVIVAL_SALVAGE_ARRIVAL_RADIUS = 620;
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
  const MISSILE_LAUNCHER_RANGE = 1120;
  const MISSILE_LAUNCHER_PRODUCTION_TIME = 9.5;
  const MISSILE_LAUNCHER_LOCK_DURATION = 0.62;
  const MISSILE_LAUNCHER_ENERGY_COST = 22;
  const LAUNCHER_MISSILE_SPEED = 610;
  const LAUNCHER_MISSILE_DAMAGE = 68;
  const LAUNCHER_MISSILE_KNOCKBACK = 320;
  const ACCUMULATOR_BURST_COST = 6;
  const ACCUMULATOR_BURST_DURATION = 0.62;
  const ACCUMULATOR_RANGE = 680;
  const ACCUMULATOR_FORCE = 620;
  const SHIELD_GENERATOR_PROJECTILE_COST = 10;
  const SHIELD_GENERATOR_ROCKET_COST = 16;
  const SHIELD_GENERATOR_LIGHTNING_COST = 14;
  const SHIELD_GENERATOR_POWER_OUT_DURATION = 1.4;
  const SHIELD_GENERATOR_FIELD_PADDING = 84;
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

  const PLAYER_WEAPON_DEFINITIONS = {
    "laser-pistol": PLAYER_WEAPON_DEFAULTS,
    "laser-rifle": {
      speed: 860,
      damage: 30,
      cooldown: 1.25,
      knockback: 260,
      movementSlow: 0.22,
      life: 0.78,
      length: 76,
      radius: 5,
      energyCost: 12,
      color: { r: 255, g: 115, b: 173 },
      piercesMobs: true,
      label: "laser rifle"
    },
    shotgun: {
      speed: 820,
      damage: 12,
      cooldown: 1.35,
      knockback: 180,
      movementSlow: 0.28,
      life: 0.62,
      length: 38,
      radius: 5.4,
      energyCost: 16,
      pelletCount: 9,
      spread: 0.28,
      color: { r: 255, g: 220, b: 122 },
      label: "shotgun"
    },
    [MACHINE_GUN_TOOL_ID]: {
      speed: 960,
      damage: 10,
      cooldown: 0.14,
      knockback: 95,
      movementSlow: 0.06,
      life: 0.72,
      length: 36,
      radius: 4.2,
      energyCost: 3,
      spread: 0.055,
      color: { r: 119, g: 167, b: 255 },
      label: "machine gun"
    }
  };
  const TOOL_UPGRADE_BONUS_SCALES = {
    "laser-pistol": { damage: 0.9, range: 0.9 },
    "laser-rifle": { damage: 0.9, range: 0.9 },
    shotgun: { damage: 0.9, range: 0.9 },
    [MACHINE_GUN_TOOL_ID]: { damage: 0.9, range: 0.9 },
    spanner: { "repair-speed": 1.15, "dismantle-speed": 1.15 },
    [DEFAULT_TOOL_ID]: { suck: 1.2, blow: 1.2 },
    [VICIOUS_VACUUM_TOOL_ID]: { suck: 1.2, blow: 1.2 },
    [EMP_TOOL_ID]: { range: 0.8, duration: 0.65 }
  };
  const TOOL_UPGRADES = {
    "laser-pistol": [
      { id: "damage", techKey: "weapon", cost: 3 },
      { id: "range", techKey: "target", cost: 3 }
    ],
    "laser-rifle": [
      { id: "damage", techKey: "weapon", cost: 5 },
      { id: "range", techKey: "target", cost: 5 }
    ],
    shotgun: [
      { id: "damage", techKey: "weapon", cost: 5 },
      { id: "range", techKey: "propulsion", cost: 4 }
    ],
    [MACHINE_GUN_TOOL_ID]: [
      { id: "damage", techKey: "weapon", cost: 6 },
      { id: "range", techKey: "target", cost: 5 }
    ],
    spanner: [
      { id: "repair-speed", techKey: "repair", cost: 3 },
      { id: "dismantle-speed", techKey: "weapon", cost: 3 }
    ],
    [DEFAULT_TOOL_ID]: [
      { id: "suck", techKey: "suction", cost: 3 },
      { id: "blow", techKey: "propulsion", cost: 3 }
    ],
    [VICIOUS_VACUUM_TOOL_ID]: [
      { id: "suck", techKey: "suction", cost: 4 },
      { id: "blow", techKey: "propulsion", cost: 4 }
    ],
    [EMP_TOOL_ID]: [
      { id: "range", techKey: "target", cost: 5 },
      { id: "duration", techKey: "energy", cost: 5 }
    ]
  };
  const BUILD_RECIPES = [
    { id: DEFAULT_TOOL_ID, category: "tools", cost: {}, unlockToolId: DEFAULT_TOOL_ID },
    { id: "laser-pistol", category: "tools", cost: { weapon: 10, plating: 1 }, unlockToolId: "laser-pistol" },
    { id: "laser-rifle", category: "tools", cost: { weapon: 13, plating: 2, target: 3 }, unlockToolId: "laser-rifle" },
    { id: "shotgun", category: "tools", cost: { weapon: 16, propulsion: 6, plating: 3 }, unlockToolId: "shotgun", blueprintObjectiveId: "kill_alienoid_boss" },
    { id: MACHINE_GUN_TOOL_ID, category: "tools", cost: { weapon: 22, target: 8, shield: 6 }, unlockToolId: MACHINE_GUN_TOOL_ID, blueprintObjectiveId: "kill_fighter_boss" },
    { id: VICIOUS_VACUUM_TOOL_ID, category: "tools", cost: { suction: 16, weapon: 6, energy: 3 }, unlockToolId: VICIOUS_VACUUM_TOOL_ID, blueprintObjectiveId: "kill_ufo_boss" },
    { id: EMP_TOOL_ID, category: "tools", cost: { energy: 16, target: 5, weapon: 6 }, unlockToolId: EMP_TOOL_ID, blueprintObjectiveId: "kill_tesla_boss" },
    { id: FAMILIAR_NET_TOOL_ID, category: "tools", cost: { repair: 16, target: 5, weapon: 6 }, unlockToolId: FAMILIAR_NET_TOOL_ID, blueprintObjectiveId: "kill_engineer_boss" },
    { id: PISTON_PUNCH_TOOL_ID, category: "tools", cost: { plating: 16, weapon: 8, propulsion: 4 }, unlockToolId: PISTON_PUNCH_TOOL_ID, blueprintObjectiveId: "kill_rambot_boss" },
    { id: GUIDED_LAUNCHER_TOOL_ID, category: "tools", cost: { target: 16, propulsion: 8, weapon: 6 }, unlockToolId: GUIDED_LAUNCHER_TOOL_ID, blueprintObjectiveId: "kill_satellite_boss" },
    { id: ROCKET_SUIT_TOOL_ID, category: "tools", cost: { propulsion: 18, plating: 7, energy: 5 }, unlockToolId: ROCKET_SUIT_TOOL_ID, blueprintObjectiveId: "kill_rocket_boss" },
    { id: PERSONAL_TETHER_TOOL_ID, category: "tools", cost: { suction: 6, plating: 3, propulsion: 2 }, unlockToolId: PERSONAL_TETHER_TOOL_ID },
    { id: "spanner", category: "tools", cost: { repair: 3, weapon: 10 }, unlockToolId: "spanner" },
    { id: "plating-block", category: "structures", cost: { plating: 4 }, structureType: "plating-block" },
    { id: "battery", category: "structures", cost: { energy: 5, plating: 3 }, structureType: "battery" },
    { id: "container", category: "structures", cost: { plating: 6, repair: 2 }, structureType: "container" },
    { id: "trading-port", category: "structures", cost: { plating: 8, propulsion: 5, communication: 3, repair: 2 }, structureType: "trading-port" },
    { id: "medbay", category: "structures", cost: { repair: 5, energy: 4, plating: 3 }, structureType: "medbay" },
    { id: "accumulator", category: "structures", cost: { plating: 3, suction: 5, energy: 1 }, structureType: "accumulator" },
    { id: "turret", category: "structures", cost: { plating: 3, weapon: 5, energy: 1 }, structureType: "turret" },
    { id: "missile-launcher", category: "structures", cost: { plating: 5, weapon: 7, propulsion: 5, target: 4 }, structureType: "missile-launcher" },
    { id: "shield-generator", category: "structures", cost: { plating: 4, shield: 5, energy: 3 }, structureType: "shield-generator" },
    { id: "jet", category: "structures", cost: { plating: 4, propulsion: 5, energy: 2 }, structureType: "jet" },
    { id: "tether", category: "structures", cost: { suction: 2, plating: 1 }, structureType: "tether" },
    { id: "bridge", category: "structures", cost: { plating: 12, propulsion: 2 }, structureType: "bridge" }
  ];
  const STRUCTURE_MAX_HEALTH = {
    "plating-block": 150,
    container: 140,
    "trading-port": 160,
    bridge: 170,
    tether: 130,
    "shield-generator": 130,
    "missile-launcher": 125,
    accumulator: 120,
    battery: 120,
    medbay: 135,
    "communication-relay": 120,
    jet: 120
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, finiteOr(value, min)));
  }

  function finiteOr(value, fallback) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function cloneColor(color) {
    return color && typeof color === "object" ? { r: color.r, g: color.g, b: color.b } : color;
  }

  function cloneTechInventory(tech) {
    const result = {};
    const source = tech && typeof tech === "object" ? tech : {};
    for (const key of TECH_KEYS) {
      result[key] = Math.max(0, Math.floor(finiteOr(source[key], 0)));
    }
    return result;
  }

  function spacecraftHashUnit(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function spacecraftStringSeed(value) {
    const text = String(value || "");
    let seed = 0;
    for (let i = 0; i < text.length; i += 1) {
      seed += text.charCodeAt(i) * (i + 1);
    }
    return seed || 1;
  }

  function recipeById(id) {
    return BUILD_RECIPES.find((recipe) => recipe.id === id) || null;
  }

  function isSuctionToolId(toolId) {
    return toolId === DEFAULT_TOOL_ID || toolId === VICIOUS_VACUUM_TOOL_ID;
  }

  function isViciousVacuumToolId(toolId) {
    return toolId === VICIOUS_VACUUM_TOOL_ID;
  }

  function isEmpToolId(toolId) {
    return toolId === EMP_TOOL_ID;
  }

  function isFamiliarNetToolId(toolId) {
    return toolId === FAMILIAR_NET_TOOL_ID;
  }

  function isPersonalTetherToolId(toolId) {
    return toolId === PERSONAL_TETHER_TOOL_ID;
  }

  function isPistonPunchToolId(toolId) {
    return toolId === PISTON_PUNCH_TOOL_ID;
  }

  function isRocketSuitToolId(toolId) {
    return toolId === ROCKET_SUIT_TOOL_ID;
  }

  function isSpannerToolId(toolId) {
    return toolId === "spanner";
  }

  function upgradeById(toolId, upgradeId) {
    const upgrades = TOOL_UPGRADES[toolId] || [];
    return upgrades.find((upgrade) => upgrade.id === upgradeId) || null;
  }

  function normalizeToolList(source, fallback) {
    const items = Array.isArray(source) ? source.map(String) : [];
    const valid = items.filter((toolId, index) => TOOL_IDS.includes(toolId) && items.indexOf(toolId) === index);
    if (!valid.includes(DEFAULT_TOOL_ID)) {
      valid.unshift(DEFAULT_TOOL_ID);
    }
    return valid.length ? valid.slice(0, 8) : (fallback || [DEFAULT_TOOL_ID]).slice(0, 8);
  }

  function canAffordCost(player, cost) {
    const tech = player && player.tech ? player.tech : {};
    return Object.entries(cost || {}).every(([key, amount]) => {
      return Math.floor(finiteOr(tech[key], 0)) >= Math.max(0, Math.floor(finiteOr(amount, 0)));
    });
  }

  function spendCost(player, cost) {
    if (!player.tech) {
      player.tech = defaultTechInventory();
    }
    for (const [key, amount] of Object.entries(cost || {})) {
      if (!TECH_KEYS.includes(key)) {
        continue;
      }
      player.tech[key] = Math.max(0, Math.floor(finiteOr(player.tech[key], 0)) - Math.max(0, Math.floor(finiteOr(amount, 0))));
    }
  }

  function recipeByStructureType(type) {
    return BUILD_RECIPES.find((recipe) => recipe.category === "structures" && recipe.structureType === type) || null;
  }

  function refundRecipeCost(player, recipe, factor) {
    if (!player || !recipe || !recipe.cost) {
      return 0;
    }
    if (!player.tech) {
      player.tech = defaultTechInventory();
    }
    let refunded = 0;
    for (const [techKey, amount] of Object.entries(recipe.cost)) {
      if (!TECH_KEYS.includes(techKey)) {
        continue;
      }
      const refundAmount = Math.max(1, Math.floor(Math.max(0, finiteOr(amount, 0)) * Math.max(0, finiteOr(factor, 0))));
      player.tech[techKey] = Math.max(0, Math.floor(finiteOr(player.tech[techKey], 0))) + refundAmount;
      refunded += refundAmount;
    }
    return refunded;
  }

  function playerHasTool(player, toolId) {
    return Boolean(player && Array.isArray(player.tools) && player.tools.includes(toolId));
  }

  function setEquippedTools(state, playerId, equippedTool, equippedTools) {
    const player = state && state.players && state.players[playerId];
    if (!player) {
      return false;
    }

    player.tools = normalizeToolList(player.tools);
    const requested = normalizeToolList(equippedTools, player.equippedTools).filter((toolId) => player.tools.includes(toolId));
    player.equippedTools = requested.length ? requested : [DEFAULT_TOOL_ID];
    player.equippedTool = player.equippedTools.includes(equippedTool) ? equippedTool : player.equippedTools[0];
    if (!player.equippedTool) {
      player.equippedTool = DEFAULT_TOOL_ID;
      player.equippedTools = [DEFAULT_TOOL_ID];
    }
    return true;
  }

  function craftTool(state, playerId, recipeId) {
    const player = state && state.players && state.players[playerId];
    const recipe = recipeById(recipeId);
    if (!player || !recipe || recipe.category !== "tools" || !recipe.unlockToolId) {
      return false;
    }

    player.tools = normalizeToolList(player.tools);
    if (!playerHasTool(player, recipe.unlockToolId)) {
      if (!canAffordCost(player, recipe.cost)) {
        return false;
      }
      spendCost(player, recipe.cost);
      player.tools.push(recipe.unlockToolId);
    }

    const equipped = normalizeToolList(player.equippedTools, player.tools).filter((toolId) => player.tools.includes(toolId));
    if (!equipped.includes(recipe.unlockToolId)) {
      equipped.push(recipe.unlockToolId);
    }
    player.equippedTools = equipped.slice(0, 8);
    player.equippedTool = recipe.unlockToolId;
    return true;
  }

  function upgradeTool(state, playerId, toolId, upgradeId) {
    const player = state && state.players && state.players[playerId];
    const upgrade = upgradeById(String(toolId || ""), String(upgradeId || ""));
    if (!player || !upgrade || !playerHasTool(player, toolId) || !canAffordCost(player, { [upgrade.techKey]: upgrade.cost })) {
      return false;
    }

    spendCost(player, { [upgrade.techKey]: upgrade.cost });
    if (!player.toolUpgrades || typeof player.toolUpgrades !== "object") {
      player.toolUpgrades = {};
    }
    if (!player.toolUpgrades[toolId] || typeof player.toolUpgrades[toolId] !== "object") {
      player.toolUpgrades[toolId] = {};
    }
    player.toolUpgrades[toolId][upgrade.id] = Math.max(0, finiteOr(player.toolUpgrades[toolId][upgrade.id], 0)) + 1;
    return true;
  }

  function thresholdForTierName(name) {
    const normalized = String(name || "").trim().toLowerCase();
    const tier = BODY_TIERS.find((candidate) => candidate.name === normalized) ||
      STELLAR_BRANCH_TIERS.find((candidate) => candidate.name === normalized);
    return tier ? tier.threshold : 0;
  }

  function isStarBody(body) {
    return Boolean(body && body.tier && (body.tier.name === "star" || STELLAR_OUTCOME_TIER_NAMES.includes(body.tier.name)));
  }

  function orbitRingCountForBody(body) {
    if (!body || !body.tier) {
      return 0;
    }
    if (body.tier.name === "white dwarf") {
      return 5;
    }
    if (body.tier.name === "star") {
      return 3;
    }
    if (body.tier.name === ORBIT_CAPTURE_MIN_TIER_NAME) {
      return 1;
    }
    return 0;
  }

  function orbitRingRadius(body, ringIndex) {
    const radius = Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
    const contactRadius = solidContactRadius(body);
    const baseGap = Math.max(ORBIT_RING_MIN_GAP, radius * ORBIT_RING_BASE_GAP_SCALE);
    return contactRadius + baseGap * (1 + Math.max(0, finiteOr(ringIndex, 0)) * ORBIT_RING_SPACING_SCALE);
  }

  function orbitCaptureBandForRing(body, orbiter, ringRadius) {
    return Math.max(
      ORBIT_CAPTURE_MIN_BAND,
      finiteOr(ringRadius, orbitRingRadius(body, 0)) * ORBIT_CAPTURE_BAND_SCALE +
        Math.max(0, finiteOr(orbiter && orbiter.radius, 0)) * 0.72
    );
  }

  function canBodyOrbitHost(orbiter, host) {
    if (!orbiter || !host || orbiter === host || !orbiter.tier || !host.tier) {
      return false;
    }
    if (orbitRingCountForBody(host) <= 0) {
      return false;
    }
    if (finiteOr(orbiter.mass, 0) >= finiteOr(host.mass, 0)) {
      return false;
    }
    return orbiter.tier.threshold < host.tier.threshold || finiteOr(orbiter.mass, 0) < finiteOr(host.mass, 0) * 0.72;
  }

  function bestOrbitRingForBody(orbiter, host) {
    if (!canBodyOrbitHost(orbiter, host)) {
      return null;
    }
    const dx = finiteOr(orbiter.x, 0) - finiteOr(host.x, 0);
    const dy = finiteOr(orbiter.y, 0) - finiteOr(host.y, 0);
    const distance = Math.hypot(dx, dy) || 1;
    let best = null;
    for (let i = 0; i < orbitRingCountForBody(host); i += 1) {
      const radius = orbitRingRadius(host, i);
      const band = orbitCaptureBandForRing(host, orbiter, radius);
      const delta = distance - radius;
      const score = Math.abs(delta) / band + i * 0.035;
      if (Math.abs(delta) <= band * 2.35 && (!best || score < best.score)) {
        best = { host, ringIndex: i, radius, band, distance, dx, dy, delta, score };
      }
    }
    return best;
  }

  function orbitDirectionForBody(orbiter, host, nx, ny, relVx, relVy) {
    const tangentVelocity = relVx * -ny + relVy * nx;
    if (Math.abs(tangentVelocity) > 8) {
      return tangentVelocity >= 0 ? 1 : -1;
    }
    const stored = finiteOr(orbiter && orbiter.orbitDirection, 0);
    if (stored < 0 || stored > 0) {
      return stored < 0 ? -1 : 1;
    }
    return ((Math.floor(finiteOr(orbiter && orbiter.id, 0)) + Math.floor(finiteOr(host && host.id, 0))) % 2) ? -1 : 1;
  }

  function orbitalSpeedForRing(host, ringIndex, radius) {
    const hostRadius = Math.max(1, finiteOr(host && host.radius, host ? radiusFromMass(host.mass) : 1));
    const tierBoost = isStarBody(host) ? 78 : 34;
    return clamp(122 + Math.sqrt(hostRadius) * 7.5 + tierBoost + Math.max(0, finiteOr(ringIndex, 0)) * 18 - Math.max(0, finiteOr(radius, 1) - hostRadius) * 0.055, 128, 345);
  }

  function findOrbitCapture(body, bodies) {
    if (!body || !Array.isArray(bodies)) {
      return null;
    }
    let best = null;
    const preferredHostId = Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0)));
    for (const host of bodies) {
      const candidate = bestOrbitRingForBody(body, host);
      if (!candidate) {
        continue;
      }
      const hostBias = preferredHostId && host.id === preferredHostId ? -0.24 : 0;
      const score = candidate.score + hostBias;
      if (!best || score < best.score) {
        best = Object.assign(candidate, { score });
      }
    }
    return best;
  }

  function clearOrbitState(body) {
    if (!body) {
      return;
    }
    body.orbitHostId = 0;
    body.orbitRingIndex = 0;
    body.orbitStrength = 0;
    body.orbitGrace = 0;
  }

  function applyOrbitCaptureForces(body, bodies, dt) {
    if (!body || !Array.isArray(bodies) || dt <= 0) {
      return false;
    }
    const capture = findOrbitCapture(body, bodies);
    if (!capture) {
      if (finiteOr(body.orbitGrace, 0) > 0) {
        body.orbitGrace = Math.max(0, finiteOr(body.orbitGrace, 0) - dt);
      } else if (finiteOr(body.orbitStrength, 0) > 0) {
        clearOrbitState(body);
      }
      return false;
    }

    const host = capture.host;
    const distance = capture.distance || 1;
    const nx = capture.dx / distance;
    const ny = capture.dy / distance;
    const tangentX = -ny;
    const tangentY = nx;
    const relVx = finiteOr(body.vx, 0) - finiteOr(host.vx, 0);
    const relVy = finiteOr(body.vy, 0) - finiteOr(host.vy, 0);
    const radialSpeed = relVx * nx + relVy * ny;
    const tangentVelocity = relVx * tangentX + relVy * tangentY;
    const relativeSpeed = Math.hypot(relVx, relVy);
    const inwardSpeed = Math.max(0, -radialSpeed);
    const retainedByHost = Math.max(0, Math.floor(finiteOr(body.orbitHostId, 0))) === host.id;
    const breachSpeed = ORBIT_CAPTURE_STRONG_INWARD_SPEED + (retainedByHost ? 92 : 0);
    if (capture.delta < 0 && inwardSpeed > breachSpeed) {
      clearOrbitState(body);
      return false;
    }
    const radialCloseness = clamp(1 - Math.abs(capture.delta) / Math.max(1, capture.band * 2.35), 0, 1);
    const speedFactor = clamp(1 - Math.max(0, relativeSpeed - 90) / ORBIT_CAPTURE_MAX_RELATIVE_SPEED, 0.16, 1);
    const breachFactor = clamp(1 - Math.max(0, inwardSpeed - ORBIT_CAPTURE_STRONG_INWARD_SPEED) / 260, 0, 1);
    const massResponse = clamp(Math.pow(Math.max(1, finiteOr(host.mass, 1)) / Math.max(1, finiteOr(body.mass, 1)), 0.18), 0.28, 1.85);
    const strength = radialCloseness * speedFactor * (0.22 + breachFactor * 0.78);
    if (strength <= 0.012) {
      return false;
    }

    const direction = orbitDirectionForBody(body, host, nx, ny, relVx, relVy);
    const desiredTangential = orbitalSpeedForRing(host, capture.ringIndex, capture.radius) * direction;
    const radialAccel = clamp(
      -capture.delta * ORBIT_RADIAL_SPRING - radialSpeed * ORBIT_RADIAL_DAMPING,
      -ORBIT_MAX_ACCELERATION,
      ORBIT_MAX_ACCELERATION
    );
    const tangentAccel = clamp(
      (desiredTangential - tangentVelocity) * ORBIT_TANGENTIAL_DAMPING,
      -ORBIT_MAX_ACCELERATION,
      ORBIT_MAX_ACCELERATION
    );
    const accelScale = strength * massResponse;
    body.vx += (nx * radialAccel + tangentX * tangentAccel) * accelScale * dt;
    body.vy += (ny * radialAccel + tangentY * tangentAccel) * accelScale * dt;
    body.orbitHostId = host.id;
    body.orbitRingIndex = capture.ringIndex;
    body.orbitDirection = direction;
    body.orbitStrength = clamp(finiteOr(body.orbitStrength, 0) + strength * dt * 4.4, 0, 1);
    body.orbitGrace = ORBIT_RETENTION_SECONDS;
    return true;
  }

  function shouldOrbitPreventMerge(a, b) {
    const first = bestOrbitRingForBody(a, b);
    const second = bestOrbitRingForBody(b, a);
    const capture = first && (!second || first.score <= second.score) ? first : second;
    if (!capture) {
      return false;
    }
    const orbiter = capture.host === a ? b : a;
    const host = capture.host;
    const distance = capture.distance || 1;
    const nx = capture.dx / distance;
    const ny = capture.dy / distance;
    const relVx = finiteOr(orbiter.vx, 0) - finiteOr(host.vx, 0);
    const relVy = finiteOr(orbiter.vy, 0) - finiteOr(host.vy, 0);
    const inwardSpeed = Math.max(0, -(relVx * nx + relVy * ny));
    const orbitingHost = Math.max(0, Math.floor(finiteOr(orbiter.orbitHostId, 0))) === host.id;
    const threshold = ORBIT_CAPTURE_STRONG_INWARD_SPEED + (orbitingHost ? 92 : 0);
    return inwardSpeed < threshold;
  }

  function resolveOrbitPreventedMerge(a, b) {
    const first = bestOrbitRingForBody(a, b);
    const second = bestOrbitRingForBody(b, a);
    const capture = first && (!second || first.score <= second.score) ? first : second;
    if (!capture) {
      return false;
    }
    const host = capture.host;
    const orbiter = host === a ? b : a;
    const dx = finiteOr(orbiter.x, 0) - finiteOr(host.x, 0);
    const dy = finiteOr(orbiter.y, 0) - finiteOr(host.y, 0);
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const minDistance = solidContactRadius(host) + Math.max(1, finiteOr(orbiter.radius, radiusFromMass(orbiter.mass))) + 3;
    if (distance < minDistance) {
      orbiter.x = finiteOr(host.x, 0) + nx * minDistance;
      orbiter.y = finiteOr(host.y, 0) + ny * minDistance;
    }
    const radialSpeed = (finiteOr(orbiter.vx, 0) - finiteOr(host.vx, 0)) * nx + (finiteOr(orbiter.vy, 0) - finiteOr(host.vy, 0)) * ny;
    if (radialSpeed < 0) {
      orbiter.vx -= nx * radialSpeed * 1.08;
      orbiter.vy -= ny * radialSpeed * 1.08;
    }
    return true;
  }

  function starParticleEmissionRate(body) {
    return STAR_PARTICLE_EMISSION_BASE_RATE + Math.max(0, finiteOr(body && body.radius, 0)) * STAR_PARTICLE_EMISSION_RADIUS_SCALE;
  }

  function isLinkedStructureType(type) {
    return type === "tether" || type === "bridge";
  }

  function isActiveLinkedBodyStructure(structure) {
    return Boolean(
      structure &&
      isLinkedStructureType(structure.type) &&
      finiteOr(structure.health, 0) > 0 &&
      !isStructureDisabled(structure) &&
      structure.bodyId &&
      structure.linkedBodyId
    );
  }

  function isBodyAttachedToBodyByLinkedStructures(world, targetBody, rootBodyId) {
    const targetBodyId = targetBody && targetBody.id;
    const cleanRootBodyId = Math.max(0, Math.floor(finiteOr(rootBodyId, 0)));
    if (!world || !targetBodyId || !cleanRootBodyId || targetBodyId === cleanRootBodyId) {
      return false;
    }

    const structures = Array.isArray(world.structures) ? world.structures : [];
    const visited = new Set([cleanRootBodyId]);
    const queue = [cleanRootBodyId];
    for (let i = 0; i < queue.length; i += 1) {
      const bodyId = queue[i];
      for (const structure of structures) {
        if (!isActiveLinkedBodyStructure(structure)) {
          continue;
        }

        let nextBodyId = 0;
        if (structure.bodyId === bodyId) {
          nextBodyId = structure.linkedBodyId;
        } else if (structure.linkedBodyId === bodyId) {
          nextBodyId = structure.bodyId;
        }

        if (!nextBodyId || visited.has(nextBodyId)) {
          continue;
        }
        if (nextBodyId === targetBodyId) {
          return true;
        }
        visited.add(nextBodyId);
        queue.push(nextBodyId);
      }
    }

    return false;
  }

  function canPlayerGadgetAffectBody(world, player, body) {
    return Boolean(
      body &&
      (!player || !player.landed || (
        player.landed.bodyId !== body.id &&
        !isBodyAttachedToBodyByLinkedStructures(world, body, player.landed.bodyId)
      ))
    );
  }

  function structurePlacementThresholdForType(type) {
    return isLinkedStructureType(type) ? thresholdForTierName("boulder") : STRUCTURE_PLACEMENT_TIER_THRESHOLD;
  }

  function isStructureHostBodyForType(body, type) {
    return Boolean(body && body.tier && body.tier.name !== "star" && body.tier.threshold >= structurePlacementThresholdForType(type));
  }

  function structureBaseSurfaceOffset(structure) {
    return Math.max(0, finiteOr(structure && structure.surfaceOffset, 0));
  }

  function platingBlockTopOffset(structure) {
    return structureBaseSurfaceOffset(structure) + PLATING_BLOCK_HEIGHT;
  }

  function platingBlockHalfAngle(body, structure) {
    const centerRadius = Math.max(24, finiteOr(body.radius, radiusFromMass(body.mass)) + structureBaseSurfaceOffset(structure) + PLATING_BLOCK_HEIGHT * 0.5);
    return Math.min(Math.PI, PLATING_BLOCK_WIDTH / centerRadius / 2);
  }

  function platingBlockCoversAngle(body, structure, angle) {
    return Boolean(
      body &&
      structure &&
      structure.type === "plating-block" &&
      structure.bodyId === body.id &&
      finiteOr(structure.health, 1) > 0 &&
      Math.abs(shortestAngleDelta(finiteOr(structure.angle, 0), angle)) <= platingBlockHalfAngle(body, structure)
    );
  }

  function surfaceExtensionAtAngle(world, body, angle) {
    let extension = 0;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    for (const structure of structures) {
      if (platingBlockCoversAngle(body, structure, angle)) {
        extension = Math.max(extension, platingBlockTopOffset(structure));
      }
    }
    return extension;
  }

  function structureCenterOffset(type, surfaceOffset) {
    if (type === "plating-block") return surfaceOffset + PLATING_BLOCK_HEIGHT * 0.5;
    if (type === "battery") return surfaceOffset + 15;
    if (type === "container") return surfaceOffset + 19;
    if (type === "trading-port") return surfaceOffset + 24;
    if (type === "medbay") return surfaceOffset + 20;
    if (type === "shield-generator") return surfaceOffset + 20;
    if (type === "missile-launcher") return surfaceOffset + 22;
    if (type === "jet") return surfaceOffset + 18;
    if (type === "tether") return surfaceOffset + 14;
    if (type === "bridge") return surfaceOffset + 16;
    return surfaceOffset + STRUCTURE_SURFACE_OFFSET;
  }

  function tetherBodyRadius(body) {
    return Math.max(1, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 1));
  }

  function tetherGiveForBodies(firstBody, secondBody) {
    const averageRadius = (tetherBodyRadius(firstBody) + tetherBodyRadius(secondBody)) * 0.5;
    return clamp(averageRadius * TETHER_GIVE_RADIUS_SCALE, TETHER_MIN_GIVE, TETHER_MAX_GIVE);
  }

  function tetherMaxRestLengthForBodies(firstBody, secondBody) {
    const combinedRadius = tetherBodyRadius(firstBody) + tetherBodyRadius(secondBody);
    return clamp(combinedRadius * TETHER_REST_LENGTH_RADIUS_SCALE, TETHER_MIN_REST_LENGTH, TETHER_MAX_REST_LENGTH);
  }

  function normalizedTetherRestLength(structure, firstBody, secondBody, fallbackLength) {
    const savedRestLength = finiteOr(structure && structure.restLength, 0);
    const requestedLength = savedRestLength > 0 ? savedRestLength : fallbackLength;
    return clamp(requestedLength, 80, tetherMaxRestLengthForBodies(firstBody, secondBody));
  }

  function tetherPlacementLength(firstPlacement, secondPlacement) {
    return Math.hypot(
      finiteOr(secondPlacement && secondPlacement.x, 0) - finiteOr(firstPlacement && firstPlacement.x, 0),
      finiteOr(secondPlacement && secondPlacement.y, 0) - finiteOr(firstPlacement && firstPlacement.y, 0)
    );
  }

  function isTetherPlacementLengthValid(firstPlacement, secondPlacement) {
    return Boolean(
      firstPlacement &&
      secondPlacement &&
      firstPlacement.body &&
      secondPlacement.body &&
      tetherPlacementLength(firstPlacement, secondPlacement) <=
        tetherMaxRestLengthForBodies(firstPlacement.body, secondPlacement.body) + TETHER_POSITION_SLOP
    );
  }

  function linkedStructureRestLength(type, placement, linkedPlacement) {
    const length = tetherPlacementLength(placement, linkedPlacement);
    if (type === "tether") {
      return Math.min(length, tetherMaxRestLengthForBodies(placement.body, linkedPlacement.body));
    }
    return length;
  }

  function structureMaxHealth(type) {
    return STRUCTURE_MAX_HEALTH[type] || 100;
  }

  function structureHitRadius(structure) {
    if (!structure) return 48;
    if (structure.type === "battery") return 42;
    if (structure.type === "container") return 48;
    if (structure.type === "trading-port") return 58;
    if (structure.type === "medbay") return 52;
    if (structure.type === "accumulator") return 44;
    if (structure.type === "shield-generator") return 50;
    if (structure.type === "missile-launcher") return 52;
    if (structure.type === "communication-relay") return 52;
    if (structure.type === "jet") return 46;
    if (structure.type === "tether") return 42;
    if (structure.type === "bridge") return 46;
    return 48;
  }

  function bodyById(world, bodyId) {
    const cleanId = Math.max(1, Math.floor(finiteOr(bodyId, 0)));
    return world && Array.isArray(world.particles)
      ? world.particles.find((body) => body && body.id === cleanId) || null
      : null;
  }

  function isStructureHostBody(body) {
    return isStructureHostBodyForType(body, "");
  }

  function isStructureDisabled(structure) {
    return Boolean(structure && finiteOr(structure.disabledTimer, 0) > 0);
  }

  function isActiveBridge(structure) {
    return Boolean(structure && structure.type === "bridge" && finiteOr(structure.health, 0) > 0 && !isStructureDisabled(structure));
  }

  function batteryCountForBody(world, bodyId) {
    let count = 0;
    for (const structure of world && world.structures || []) {
      if (
        structure &&
        structure.type === "battery" &&
        structure.bodyId === bodyId &&
        finiteOr(structure.health, 0) > 0 &&
        !isStructureDisabled(structure)
      ) {
        count += 1;
      }
    }
    return count;
  }

  function maxEnergyForBody(body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }
    return Math.round(80 + Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 4.2);
  }

  function energyRegenForBody(world, body) {
    if (!isStructureHostBody(body)) {
      return 0;
    }
    return 2.2 + Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 0.075 + batteryCountForBody(world, body.id) * BATTERY_ENERGY_REGEN_BONUS;
  }

  function normalizeBodyEnergy(world, body) {
    if (!body) {
      return;
    }
    const maxEnergy = maxEnergyForBody(body);
    if (maxEnergy <= 0) {
      body.maxEnergy = 0;
      body.energy = 0;
      return;
    }
    const previousMax = Math.max(0, finiteOr(body.maxEnergy, 0));
    const previousEnergy = Number.isFinite(Number(body.energy)) ? finiteOr(body.energy, maxEnergy) : maxEnergy;
    body.maxEnergy = maxEnergy;
    body.energy = previousMax > 0 ? clamp(previousEnergy, 0, maxEnergy) : maxEnergy;
  }

  function spendBodyEnergy(world, body, amount) {
    normalizeBodyEnergy(world, body);
    const cost = Math.max(0, finiteOr(amount, 0));
    if (!body || cost <= 0) {
      return true;
    }
    if (finiteOr(body.energy, 0) < cost) {
      return false;
    }
    body.energy = Math.max(0, finiteOr(body.energy, 0) - cost);
    return true;
  }

  function canSpendBodyEnergy(world, body, amount) {
    normalizeBodyEnergy(world, body);
    return Boolean(body) && finiteOr(body.energy, 0) >= Math.max(0, finiteOr(amount, 0));
  }

  function updateBodyEnergySystems(state, dt) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return;
    }
    for (const body of world.particles) {
      normalizeBodyEnergy(world, body);
      if (body && finiteOr(body.maxEnergy, 0) > 0 && finiteOr(body.energy, 0) < finiteOr(body.maxEnergy, 0)) {
        body.energy = Math.min(body.maxEnergy, finiteOr(body.energy, 0) + energyRegenForBody(world, body) * dt);
      }
    }
  }

  function applyLinkedStructureSurfaceConstraint(world, structure) {
    const firstBody = bodyById(world, structure && structure.bodyId);
    const secondBody = bodyById(world, structure && structure.linkedBodyId);
    if (!isStructureHostBodyForType(firstBody, structure && structure.type) || !isStructureHostBodyForType(secondBody, structure && structure.type) || firstBody.id === secondBody.id) {
      return false;
    }

    const firstOffset = structureCenterOffset(structure.type, structureBaseSurfaceOffset(structure));
    const secondSurfaceOffset = Math.max(0, finiteOr(structure.linkedSurfaceOffset, 0));
    const secondOffset = structureCenterOffset(structure.type, secondSurfaceOffset);
    const firstRadius = finiteOr(firstBody.radius, radiusFromMass(firstBody.mass));
    const secondRadius = finiteOr(secondBody.radius, radiusFromMass(secondBody.mass));
    structure.x = firstBody.x + Math.cos(structure.angle) * (firstRadius + firstOffset);
    structure.y = firstBody.y + Math.sin(structure.angle) * (firstRadius + firstOffset);
    structure.x2 = secondBody.x + Math.cos(structure.linkedAngle) * (secondRadius + secondOffset);
    structure.y2 = secondBody.y + Math.sin(structure.linkedAngle) * (secondRadius + secondOffset);
    const currentLength = Math.hypot(structure.x2 - structure.x, structure.y2 - structure.y);
    structure.restLength = structure.type === "tether"
      ? normalizedTetherRestLength(structure, firstBody, secondBody, currentLength)
      : Math.max(80, finiteOr(structure.restLength, currentLength));
    if (structure.type === "bridge") {
      structure.restCenterDx = finiteOr(structure.restCenterDx, secondBody.x - firstBody.x);
      structure.restCenterDy = finiteOr(structure.restCenterDy, secondBody.y - firstBody.y);
    }
    return true;
  }

  function applyStructureSurfaceConstraint(world, structure) {
    if (!structure || typeof structure !== "object") {
      return false;
    }
    if (isLinkedStructureType(structure.type)) {
      return applyLinkedStructureSurfaceConstraint(world, structure);
    }

    const body = bodyById(world, structure.bodyId);
    if (!isStructureHostBodyForType(body, structure.type)) {
      return false;
    }

    const surfaceOffset = structureBaseSurfaceOffset(structure);
    const centerOffset = structureCenterOffset(structure.type, surfaceOffset);
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    structure.x = body.x + Math.cos(structure.angle) * (radius + centerOffset);
    structure.y = body.y + Math.sin(structure.angle) * (radius + centerOffset);
    return true;
  }

  function syncStructuresToSurfaces(state, removeInvalid) {
    const structures = state && state.world && Array.isArray(state.world.structures) ? state.world.structures : [];
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      if (!applyStructureSurfaceConstraint(state.world, structures[i]) && removeInvalid) {
        structures.splice(i, 1);
      }
    }
  }

  function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  function rotateBodyMountedFrame(state, bodyId, angleStep) {
    if (!bodyId || Math.abs(angleStep) <= 0.000001) {
      return;
    }

    for (const mounted of state.world.structures || []) {
      if (mounted.bodyId === bodyId) {
        mounted.angle = finiteOr(mounted.angle, 0) + angleStep;
      }
      if (isLinkedStructureType(mounted.type) && mounted.linkedBodyId === bodyId) {
        mounted.linkedAngle = finiteOr(mounted.linkedAngle, 0) + angleStep;
      }
    }

    for (const player of Object.values(state.players || {})) {
      if (player && player.landed && !player.landed.bridgeId && player.landed.bodyId === bodyId) {
        player.landed.angle = finiteOr(player.landed.angle, 0) + angleStep;
      }
    }
  }

  function bodyAngularInertiaRadius(body) {
    return Math.max(8, finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 8));
  }

  function bodySurfaceVelocityAtPoint(body, pointX, pointY) {
    const angularVelocity = finiteOr(body && body.angularVelocity, 0);
    const rx = finiteOr(pointX, finiteOr(body && body.x, 0)) - finiteOr(body && body.x, 0);
    const ry = finiteOr(pointY, finiteOr(body && body.y, 0)) - finiteOr(body && body.y, 0);
    return {
      x: finiteOr(body && body.vx, 0) - angularVelocity * ry,
      y: finiteOr(body && body.vy, 0) + angularVelocity * rx
    };
  }

  function bodySurfaceVelocityAtAngle(body, angle, offset) {
    const radius = bodyAngularInertiaRadius(body) + Math.max(0, finiteOr(offset, 0));
    const pointX = finiteOr(body && body.x, 0) + Math.cos(angle) * radius;
    const pointY = finiteOr(body && body.y, 0) + Math.sin(angle) * radius;
    return bodySurfaceVelocityAtPoint(body, pointX, pointY);
  }

  function bodySurfacePointForForce(body, sourceX, sourceY) {
    const dx = finiteOr(sourceX, body && body.x) - finiteOr(body && body.x, 0);
    const dy = finiteOr(sourceY, body && body.y) - finiteOr(body && body.y, 0);
    const dist = Math.hypot(dx, dy) || 1;
    const radius = bodyAngularInertiaRadius(body);
    return {
      x: finiteOr(body && body.x, 0) + (dx / dist) * radius,
      y: finiteOr(body && body.y, 0) + (dy / dist) * radius
    };
  }

  function applyBodyTorqueFromVelocityChange(body, deltaVx, deltaVy, pointX, pointY, response) {
    if (!body || !body.tier || !Number.isFinite(Number(deltaVx)) || !Number.isFinite(Number(deltaVy))) {
      return;
    }

    const rx = finiteOr(pointX, body.x) - finiteOr(body.x, 0);
    const ry = finiteOr(pointY, body.y) - finiteOr(body.y, 0);
    const radius = bodyAngularInertiaRadius(body);
    const torque = rx * deltaVy - ry * deltaVx;
    if (Math.abs(torque) <= 0.000001) {
      return;
    }

    const torqueScale = body.tier.solid ? BODY_TORQUE_RESPONSE : BODY_TORQUE_RESPONSE * 0.42;
    body.angularVelocity = clamp(
      finiteOr(body.angularVelocity, 0) + (torque / Math.max(64, radius * radius)) * 2 * torqueScale * Math.max(0, finiteOr(response, 1)),
      -BODY_MAX_ANGULAR_SPEED,
      BODY_MAX_ANGULAR_SPEED
    );
  }

  function applyBodyVelocityChangeAtPoint(body, deltaVx, deltaVy, pointX, pointY, response) {
    if (!body || !Number.isFinite(Number(deltaVx)) || !Number.isFinite(Number(deltaVy))) {
      return;
    }
    body.vx = finiteOr(body.vx, 0) + deltaVx;
    body.vy = finiteOr(body.vy, 0) + deltaVy;
    applyBodyTorqueFromVelocityChange(body, deltaVx, deltaVy, pointX, pointY, response);
  }

  function activeBridgeById(world, id) {
    const cleanId = Math.max(1, Math.floor(finiteOr(id, 0)));
    for (const structure of world && world.structures || []) {
      if (structure && structure.id === cleanId && isActiveBridge(structure)) {
        return structure;
      }
    }
    return null;
  }

  function bridgeGeometry(structure) {
    if (!structure) {
      return null;
    }
    const x1 = finiteOr(structure.x, 0);
    const y1 = finiteOr(structure.y, 0);
    const x2 = finiteOr(structure.x2, x1);
    const y2 = finiteOr(structure.y2, y1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < BRIDGE_MIN_ANCHOR_LENGTH) {
      return null;
    }
    const ux = dx / length;
    const uy = dy / length;
    return {
      x1,
      y1,
      x2,
      y2,
      dx,
      dy,
      length,
      ux,
      uy,
      nx: -uy,
      ny: ux
    };
  }

  function bridgeCurveLengthForGeometry(geometry) {
    if (!geometry) {
      return 0;
    }
    return Math.min(
      geometry.length * 0.46,
      clamp(geometry.length * 0.18, BRIDGE_MIN_CURVE_LENGTH, BRIDGE_MAX_CURVE_LENGTH)
    );
  }

  function cubicBezierPoint(p0, p1, p2, p3, t) {
    const s = clamp(t, 0, 1);
    const inv = 1 - s;
    const inv2 = inv * inv;
    const s2 = s * s;
    return {
      x: p0.x * inv2 * inv + p1.x * 3 * inv2 * s + p2.x * 3 * inv * s2 + p3.x * s2 * s,
      y: p0.y * inv2 * inv + p1.y * 3 * inv2 * s + p2.y * 3 * inv * s2 + p3.y * s2 * s
    };
  }

  function cubicBezierDerivative(p0, p1, p2, p3, t) {
    const s = clamp(t, 0, 1);
    const inv = 1 - s;
    return {
      x: 3 * inv * inv * (p1.x - p0.x) + 6 * inv * s * (p2.x - p1.x) + 3 * s * s * (p3.x - p2.x),
      y: 3 * inv * inv * (p1.y - p0.y) + 6 * inv * s * (p2.y - p1.y) + 3 * s * s * (p3.y - p2.y)
    };
  }

  function bridgeBodySurfacePoint(world, body, angle) {
    const distanceFromCenter = finiteOr(body.radius, radiusFromMass(body.mass)) + surfaceExtensionAtAngle(world, body, angle) + PLAYER_FOOT_OFFSET;
    return {
      x: body.x + Math.cos(angle) * distanceFromCenter,
      y: body.y + Math.sin(angle) * distanceFromCenter
    };
  }

  function bridgeEndpointJoin(world, structure, bodyId, side) {
    if (!isActiveBridge(structure)) {
      return null;
    }
    const geometry = bridgeGeometry(structure);
    const body = bodyById(world, bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }
    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const atStart = structure.bodyId === bodyId;
    const atEnd = structure.linkedBodyId === bodyId;
    if (!atStart && !atEnd) {
      return null;
    }
    const endpointX = atStart ? geometry.x1 : geometry.x2;
    const endpointY = atStart ? geometry.y1 : geometry.y2;
    const playerBridgeOffset = BRIDGE_HALF_WIDTH + PLAYER_FOOT_OFFSET;
    const joinX = endpointX + geometry.nx * cleanSide * playerBridgeOffset;
    const joinY = endpointY + geometry.ny * cleanSide * playerBridgeOffset;
    const angle = Math.atan2(joinY - body.y, joinX - body.x);
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    const bridgeDirX = atStart ? geometry.ux : -geometry.ux;
    const bridgeDirY = atStart ? geometry.uy : -geometry.uy;
    const entryWalkDirection = tangentX * bridgeDirX + tangentY * bridgeDirY >= 0 ? 1 : -1;
    const desiredPathSign = atStart ? 1 : -1;
    return {
      t: atStart ? 0 : geometry.length,
      angle,
      bodyId,
      otherBodyId: atStart ? structure.linkedBodyId : structure.bodyId,
      side: cleanSide,
      atStart,
      geometry,
      entryWalkDirection,
      inputSign: desiredPathSign * entryWalkDirection
    };
  }

  function bridgeEndpointCurve(world, structure, bodyId, side) {
    const geometry = bridgeGeometry(structure);
    const body = bodyById(world, bodyId);
    if (!geometry || !body || !isLandableBody(body)) {
      return null;
    }
    const join = bridgeEndpointJoin(world, structure, bodyId, side);
    if (!join) {
      return null;
    }
    const cleanSide = join.side;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = BRIDGE_HALF_WIDTH + PLAYER_FOOT_OFFSET;
    const curveLength = bridgeCurveLengthForGeometry(geometry);
    if (curveLength <= 0) {
      return null;
    }
    const bodyPoint = bridgeBodySurfacePoint(world, body, join.angle);
    const straightT = join.atStart ? curveLength : geometry.length - curveLength;
    const straightPoint = {
      x: geometry.x1 + geometry.ux * straightT + normalX * offset,
      y: geometry.y1 + geometry.uy * straightT + normalY * offset
    };
    const bodyTangent = {
      x: -Math.sin(join.angle),
      y: Math.cos(join.angle)
    };
    const startBodyDirection = join.entryWalkDirection;
    const endBodyDirection = -join.entryWalkDirection;
    const handle = curveLength * 0.42;
    const bodyNormalAngle = join.angle;
    const bridgeNormalAngle = Math.atan2(normalY, normalX);
    if (join.atStart) {
      const p0 = bodyPoint;
      const p3 = straightPoint;
      const d0 = {
        x: bodyTangent.x * startBodyDirection,
        y: bodyTangent.y * startBodyDirection
      };
      const d1 = { x: geometry.ux, y: geometry.uy };
      return {
        p0,
        p1: { x: p0.x + d0.x * handle, y: p0.y + d0.y * handle },
        p2: { x: p3.x - d1.x * handle, y: p3.y - d1.y * handle },
        p3,
        curveLength,
        normalStartAngle: bodyNormalAngle,
        normalEndAngle: bridgeNormalAngle,
        geometry,
        join
      };
    }
    const p0 = straightPoint;
    const p3 = bodyPoint;
    const d0 = { x: geometry.ux, y: geometry.uy };
    const d1 = {
      x: bodyTangent.x * endBodyDirection,
      y: bodyTangent.y * endBodyDirection
    };
    return {
      p0,
      p1: { x: p0.x + d0.x * handle, y: p0.y + d0.y * handle },
      p2: { x: p3.x - d1.x * handle, y: p3.y - d1.y * handle },
      p3,
      curveLength,
      normalStartAngle: bridgeNormalAngle,
      normalEndAngle: bodyNormalAngle,
      geometry,
      join
    };
  }

  function bridgeCurveSurfacePose(curve, progress, walkSpeed, baseVx, baseVy) {
    if (!curve) {
      return null;
    }
    const s = clamp(progress, 0, 1);
    const point = cubicBezierPoint(curve.p0, curve.p1, curve.p2, curve.p3, s);
    const derivative = cubicBezierDerivative(curve.p0, curve.p1, curve.p2, curve.p3, s);
    const tangent = normalize(derivative.x, derivative.y);
    const normalBlend = s * s * (3 - 2 * s);
    const normalAngle = curve.normalStartAngle + shortestAngleDelta(curve.normalStartAngle, curve.normalEndAngle) * normalBlend;
    return {
      x: point.x,
      y: point.y,
      vx: baseVx + tangent.x * walkSpeed,
      vy: baseVy + tangent.y * walkSpeed,
      angle: normalAngle
    };
  }

  function bridgeSurfacePose(world, structure, t, side, walkSpeedOverride) {
    const geometry = bridgeGeometry(structure);
    if (!geometry) {
      return null;
    }
    const clampedT = clamp(finiteOr(t, 0), 0, geometry.length);
    const cleanSide = finiteOr(side, 1) < 0 ? -1 : 1;
    const normalX = geometry.nx * cleanSide;
    const normalY = geometry.ny * cleanSide;
    const offset = BRIDGE_HALF_WIDTH + PLAYER_FOOT_OFFSET;
    const walkSpeed = Number.isFinite(Number(walkSpeedOverride)) ? finiteOr(walkSpeedOverride, 0) : 0;
    const firstBody = bodyById(world, structure.bodyId);
    const secondBody = bodyById(world, structure.linkedBodyId);
    const blend = geometry.length > 0 ? clampedT / geometry.length : 0;
    const baseVx = firstBody && secondBody
      ? finiteOr(firstBody.vx, 0) * (1 - blend) + finiteOr(secondBody.vx, 0) * blend
      : 0;
    const baseVy = firstBody && secondBody
      ? finiteOr(firstBody.vy, 0) * (1 - blend) + finiteOr(secondBody.vy, 0) * blend
      : 0;
    const curveLength = bridgeCurveLengthForGeometry(geometry);

    if (curveLength > 0 && clampedT < curveLength) {
      const startCurve = bridgeEndpointCurve(world, structure, structure.bodyId, cleanSide);
      const curvePose = bridgeCurveSurfacePose(startCurve, clampedT / curveLength, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return { ...curvePose, t: clampedT, side: cleanSide, geometry };
      }
    }
    if (curveLength > 0 && clampedT > geometry.length - curveLength) {
      const endCurve = bridgeEndpointCurve(world, structure, structure.linkedBodyId, cleanSide);
      const denominator = Math.max(1, curveLength);
      const curvePose = bridgeCurveSurfacePose(endCurve, (clampedT - (geometry.length - curveLength)) / denominator, walkSpeed, baseVx, baseVy);
      if (curvePose) {
        return { ...curvePose, t: clampedT, side: cleanSide, geometry };
      }
    }
    return {
      x: geometry.x1 + geometry.ux * clampedT + normalX * offset,
      y: geometry.y1 + geometry.uy * clampedT + normalY * offset,
      vx: baseVx + geometry.ux * walkSpeed,
      vy: baseVy + geometry.uy * walkSpeed,
      angle: Math.atan2(normalY, normalX),
      t: clampedT,
      side: cleanSide,
      geometry
    };
  }

  function findBridgeTransferFromBody(world, bodyId, angle, walkDirection) {
    if (!bodyId || !walkDirection) {
      return null;
    }
    let best = null;
    let bestDelta = Infinity;
    for (const structure of world.structures || []) {
      for (const side of [-1, 1]) {
        const endpoint = bridgeEndpointJoin(world, structure, bodyId, side);
        if (!endpoint || endpoint.entryWalkDirection !== Math.sign(walkDirection)) {
          continue;
        }
        const delta = Math.abs(shortestAngleDelta(angle, endpoint.angle));
        if (delta > BRIDGE_WALK_TRANSFER_ANGLE || delta >= bestDelta) {
          continue;
        }
        best = { structure, endpoint, inputSign: endpoint.inputSign };
        bestDelta = delta;
      }
    }
    return best;
  }

  function transferPlayerToBridge(world, player, transfer, walkDirection, walkSpeed) {
    if (!player || !transfer || !transfer.structure || !transfer.endpoint) {
      return false;
    }
    player.landed = {
      bodyId: transfer.endpoint.bodyId,
      bridgeId: transfer.structure.id,
      bridgeT: transfer.endpoint.t,
      bridgeSide: transfer.endpoint.side,
      bridgeInputSign: transfer.inputSign,
      angle: transfer.endpoint.angle,
      walkSpeed: finiteOr(walkSpeed, 0) * Math.sign(walkDirection || 1),
      walkCycle: finiteOr(player.walkCycle, 0)
    };
    applyLandedSurfaceConstraint(world, player);
    return true;
  }

  function transferPlayerFromBridgeToBody(world, player, structure, bodyId, side, pathSpeed) {
    const join = bridgeEndpointJoin(world, structure, bodyId, side);
    const body = bodyById(world, bodyId);
    if (!player || !join || !body || !isLandableBody(body)) {
      return false;
    }
    const bridgeMotionSign = Math.sign(finiteOr(pathSpeed, 0) || (join.atStart ? -1 : 1));
    const incomingDirX = join.geometry.ux * bridgeMotionSign;
    const incomingDirY = join.geometry.uy * bridgeMotionSign;
    const tangentX = -Math.sin(join.angle);
    const tangentY = Math.cos(join.angle);
    const bodyWalkDirection = tangentX * incomingDirX + tangentY * incomingDirY >= 0 ? 1 : -1;
    const continuationAngle = join.angle + bodyWalkDirection * (BRIDGE_WALK_TRANSFER_ANGLE + BRIDGE_WALK_EXIT_ANGLE_PADDING);
    player.landed = {
      bodyId: body.id,
      bridgeId: 0,
      bridgeT: 0,
      bridgeSide: 1,
      bridgeInputSign: 1,
      angle: continuationAngle,
      walkSpeed: Math.abs(finiteOr(pathSpeed, 0)) * bodyWalkDirection,
      walkCycle: finiteOr(player.walkCycle, 0)
    };
    applyLandedSurfaceConstraint(world, player);
    return true;
  }

  function normalizePlacement(world, type, placement) {
    const source = placement && typeof placement === "object" ? placement : {};
    const body = bodyById(world, source.bodyId);
    const angle = finiteOr(source.angle, 0);
    if (!isStructureHostBodyForType(body, type)) {
      return null;
    }
    const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
    const centerOffset = structureCenterOffset(type, surfaceOffset);
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    return {
      body,
      bodyId: body.id,
      angle,
      surfaceOffset,
      x: body.x + Math.cos(angle) * (radius + centerOffset),
      y: body.y + Math.sin(angle) * (radius + centerOffset)
    };
  }

  function randomStructureSeed(state, salt) {
    const seeded = seededRange((finiteOr(state.seed, 0) + finiteOr(state.tick, 0) * 2654435761 + salt * 1013904223) >>> 0, 0, 1);
    return seeded.value;
  }

  function createStructureFromPlacement(state, recipe, placement, linkedPlacement, ownerPlayerId) {
    const world = state.world;
    const nextId = Math.max(
      1,
      Math.floor(finiteOr(world.nextStructureId, 1)),
      Array.isArray(world.structures)
        ? world.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
        : 1
    );
    world.nextStructureId = nextId + 1;
    const type = recipe.structureType;
    const maxHealth = structureMaxHealth(type);
    const restCenterDx = linkedPlacement ? linkedPlacement.body.x - placement.body.x : 0;
    const restCenterDy = linkedPlacement ? linkedPlacement.body.y - placement.body.y : 0;
    const restCenterAngle = Math.atan2(restCenterDy, restCenterDx);
    return {
      id: nextId,
      type,
      ownerPlayerId: String(ownerPlayerId || "").replace(/[^\w.-]/g, "").slice(0, 80),
      bodyId: placement.bodyId,
      linkedBodyId: linkedPlacement ? linkedPlacement.bodyId : 0,
      angle: placement.angle,
      linkedAngle: linkedPlacement ? linkedPlacement.angle : 0,
      surfaceOffset: placement.surfaceOffset,
      linkedSurfaceOffset: linkedPlacement ? linkedPlacement.surfaceOffset : 0,
      x: placement.x,
      y: placement.y,
      x2: linkedPlacement ? linkedPlacement.x : placement.x,
      y2: linkedPlacement ? linkedPlacement.y : placement.y,
      restLength: linkedPlacement ? linkedStructureRestLength(type, placement, linkedPlacement) : 0,
      restCenterDx,
      restCenterDy,
      bridgeAngleOffset: type === "bridge" && linkedPlacement ? shortestAngleDelta(restCenterAngle, placement.angle) : 0,
      bridgeLinkedAngleOffset: type === "bridge" && linkedPlacement ? shortestAngleDelta(restCenterAngle, linkedPlacement.angle) : 0,
      aimAngle: placement.angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: 0.2 + randomStructureSeed(state, nextId) * 0.6,
      burstTimer: 0,
      burstCooldown: 0.4 + randomStructureSeed(state, nextId + 7) * ACCUMULATOR_BURST_INTERVAL,
      healPulse: 0,
      missileCharge: 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: placement.x,
      targetY: placement.y,
      targetCount: 0,
      health: maxHealth,
      maxHealth,
      disabledTimer: 0,
      flash: 0,
      tech: type === "container" || type === "trading-port" ? cloneTechInventory(null) : undefined,
      tradeOffers: type === "trading-port" ? [] : undefined,
      tradeOfferSeq: type === "trading-port" ? 1 : undefined,
      tradeVessel: type === "trading-port" ? normalizeTradeVessel(null, { x: placement.x, y: placement.y, angle: placement.angle }) : undefined,
      wobble: randomStructureSeed(state, nextId + 13) * Math.PI * 2
    };
  }

  function placeStructure(state, playerId, recipeId, placement, linkedPlacement) {
    const player = state && state.players && state.players[playerId];
    const recipe = recipeById(recipeId);
    const world = state && state.world;
    if (!player || !world || !recipe || recipe.category !== "structures" || !recipe.structureType || !canAffordCost(player, recipe.cost)) {
      return false;
    }

    if (!Array.isArray(world.structures)) {
      world.structures = [];
    }

    const first = normalizePlacement(world, recipe.structureType, placement);
    if (!first) {
      return false;
    }

    let second = null;
    if (isLinkedStructureType(recipe.structureType)) {
      second = normalizePlacement(world, recipe.structureType, linkedPlacement);
      if (!second || second.bodyId === first.bodyId) {
        return false;
      }
      if (recipe.structureType === "tether" && !isTetherPlacementLengthValid(first, second)) {
        return false;
      }
    }

    spendCost(player, recipe.cost);
    world.structures.push(createStructureFromPlacement(state, recipe, first, second, playerId));
    return true;
  }

  function transferContainerTech(state, playerId, structureId, techKey, mode, amount) {
    return transferStructureTech(state, playerId, structureId, techKey, mode, amount, "container");
  }

  function normalizeTradeOffer(offer) {
    return cloneTechInventory(offer);
  }

  function tradeOfferTotal(offer) {
    const normalized = normalizeTradeOffer(offer);
    return TECH_KEYS.reduce((total, key) => total + normalized[key], 0);
  }

  function tradeOffersEqual(first, second) {
    const a = normalizeTradeOffer(first);
    const b = normalizeTradeOffer(second);
    return TECH_KEYS.every((key) => a[key] === b[key]);
  }

  function normalizeTradingPortOffer(offer, index) {
    const source = offer && typeof offer === "object" ? offer : {};
    return {
      id: String(source.id || ("offer-" + Math.max(1, Math.floor(finiteOr(index, 0) + 1)))).replace(/[^\w.-]/g, "").slice(0, 48),
      receive: normalizeTradeOffer(source.receive),
      pay: normalizeTradeOffer(source.pay),
      enabled: source.enabled !== false
    };
  }

  function normalizeTradingPortOffers(offers) {
    return (Array.isArray(offers) ? offers : [])
      .slice(0, TRADING_PORT_MAX_OFFERS)
      .map(normalizeTradingPortOffer)
      .filter((offer) => offer.id);
  }

  function normalizeTradeVessel(vessel, structure) {
    const dock = structure || {};
    const source = vessel && typeof vessel === "object" ? vessel : {};
    const state = source.state === "outbound" || source.state === "returning" ? source.state : "docked";
    return {
      state,
      x: finiteOr(source.x, finiteOr(dock.x, 0)),
      y: finiteOr(source.y, finiteOr(dock.y, 0)),
      vx: finiteOr(source.vx, 0),
      vy: finiteOr(source.vy, 0),
      angle: finiteOr(source.angle, finiteOr(dock.angle, 0)),
      health: clamp(finiteOr(source.health, TRADING_PORT_VESSEL_MAX_HEALTH), 0, TRADING_PORT_VESSEL_MAX_HEALTH),
      cooldown: Math.max(0, finiteOr(source.cooldown, 0)),
      sourceStructureId: Math.max(0, Math.floor(finiteOr(source.sourceStructureId, 0))),
      targetStructureId: Math.max(0, Math.floor(finiteOr(source.targetStructureId, 0))),
      sourceOfferId: String(source.sourceOfferId || "").replace(/[^\w.-]/g, "").slice(0, 48),
      targetOfferId: String(source.targetOfferId || "").replace(/[^\w.-]/g, "").slice(0, 48),
      cargo: normalizeTradeOffer(source.cargo)
    };
  }

  function normalizeTradingPortState(structure) {
    if (!structure || structure.type !== "trading-port") {
      return null;
    }
    structure.tech = normalizeTradeOffer(structure.tech);
    structure.tradeOffers = normalizeTradingPortOffers(structure.tradeOffers);
    structure.tradeOfferSeq = Math.max(
      1,
      Math.floor(finiteOr(structure.tradeOfferSeq, structure.tradeOffers.length + 1)),
      structure.tradeOffers.reduce((largest, offer) => {
        const match = String(offer.id || "").match(/(\d+)$/);
        return match ? Math.max(largest, Number(match[1]) + 1) : largest;
      }, 1)
    );
    structure.tradeVessel = normalizeTradeVessel(structure.tradeVessel, structure);
    return structure;
  }

  function tradingPortOfferIsLive(structure, offer) {
    return Boolean(
      structure &&
      offer &&
      offer.enabled !== false &&
      tradeOfferTotal(offer.receive) > 0 &&
      tradeOfferTotal(offer.pay) > 0 &&
      TECH_KEYS.every((key) => normalizeTradeOffer(offer.pay)[key] <= normalizeTradeOffer(structure.tech)[key])
    );
  }

  function tradingPortOffersCompatible(sourceOffer, targetOffer) {
    return Boolean(
      sourceOffer &&
      targetOffer &&
      tradeOffersEqual(sourceOffer.pay, targetOffer.receive) &&
      tradeOffersEqual(sourceOffer.receive, targetOffer.pay)
    );
  }

  function subtractOfferFromTech(tech, offer) {
    const result = normalizeTradeOffer(tech);
    const cost = normalizeTradeOffer(offer);
    for (const key of TECH_KEYS) {
      result[key] = Math.max(0, result[key] - cost[key]);
    }
    return result;
  }

  function addOfferToTech(tech, offer) {
    const result = normalizeTradeOffer(tech);
    const gain = normalizeTradeOffer(offer);
    for (const key of TECH_KEYS) {
      result[key] = Math.max(0, result[key] + gain[key]);
    }
    return result;
  }

  function structureById(world, structureId, type) {
    const cleanStructureId = Math.max(1, Math.floor(finiteOr(structureId, 0)));
    return world && Array.isArray(world.structures)
      ? world.structures.find((candidate) => candidate && candidate.id === cleanStructureId && (!type || candidate.type === type)) || null
      : null;
  }

  function canPlayerAccessStructure(player, structure, padding) {
    if (!player || !structure || finiteOr(player.health, 0) <= 0 || player.spacecraftInterior || finiteOr(structure.health, 0) <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    return Math.hypot(finiteOr(structure.x, 0) - finiteOr(player.x, 0), finiteOr(structure.y, 0) - finiteOr(player.y, 0)) <=
      structureHitRadius(structure) + finiteOr(player.radius, PLAYER_RADIUS) + padding;
  }

  function isTradingPortOwner(structure, playerId) {
    const ownerId = String(structure && structure.ownerPlayerId || "");
    return ownerId && ownerId === String(playerId || "");
  }

  function transferStructureTech(state, playerId, structureId, techKey, mode, amount, requiredType) {
    const player = state && state.players && state.players[playerId];
    const world = state && state.world;
    const cleanKey = String(techKey || "");
    const cleanAmount = Math.max(1, Math.min(999, Math.floor(finiteOr(amount, 1))));
    const withdraw = mode === "withdraw";
    const cleanRequiredType = requiredType || "";
    if (
      !player ||
      !world ||
      !Array.isArray(world.structures) ||
      !TECH_KEYS.includes(cleanKey) ||
      finiteOr(player.health, 0) <= 0 ||
      player.spacecraftInterior
    ) {
      return false;
    }

    const structure = structureById(world, structureId);
    if (!structure || (cleanRequiredType && structure.type !== cleanRequiredType) || (structure.type !== "container" && structure.type !== "trading-port")) {
      return false;
    }

    if (structure.type === "trading-port" && !isTradingPortOwner(structure, playerId)) {
      return false;
    }
    if (!canPlayerAccessStructure(player, structure, structure.type === "trading-port" ? TRADING_PORT_ACCESS_PADDING : 96)) {
      return false;
    }

    if (!player.tech || typeof player.tech !== "object") {
      player.tech = cloneTechInventory(null);
    }
    structure.tech = cloneTechInventory(structure.tech);

    const playerAmount = Math.max(0, Math.floor(finiteOr(player.tech[cleanKey], 0)));
    const storedAmount = Math.max(0, Math.floor(finiteOr(structure.tech[cleanKey], 0)));
    const moved = withdraw ? Math.min(cleanAmount, storedAmount) : Math.min(cleanAmount, playerAmount);
    if (moved <= 0) {
      return false;
    }

    if (withdraw) {
      structure.tech[cleanKey] = storedAmount - moved;
      player.tech[cleanKey] = playerAmount + moved;
      if (structure.type === "container" && isSurvivalCampStructure(state, structure)) {
        wakeSurvivalCampFromStructure(state, structure, playerId);
      }
    } else {
      player.tech[cleanKey] = playerAmount - moved;
      structure.tech[cleanKey] = storedAmount + moved;
    }

    return true;
  }

  function setTradingPortOffer(state, playerId, structureId, offer) {
    const player = state && state.players && state.players[playerId];
    const structure = normalizeTradingPortState(structureById(state && state.world, structureId, "trading-port"));
    if (!structure || !isTradingPortOwner(structure, playerId) || !canPlayerAccessStructure(player, structure, TRADING_PORT_ACCESS_PADDING)) {
      return false;
    }
    const normalized = normalizeTradingPortOffer(offer, structure.tradeOffers.length);
    if (!normalized.id) {
      normalized.id = "offer-" + structure.tradeOfferSeq++;
    }
    const existingIndex = structure.tradeOffers.findIndex((candidate) => candidate.id === normalized.id);
    if (existingIndex >= 0) {
      structure.tradeOffers[existingIndex] = normalized;
    } else if (structure.tradeOffers.length < TRADING_PORT_MAX_OFFERS) {
      structure.tradeOffers.push(normalized);
    } else {
      return false;
    }
    const match = String(normalized.id).match(/(\d+)$/);
    if (match) {
      structure.tradeOfferSeq = Math.max(structure.tradeOfferSeq, Number(match[1]) + 1);
    }
    return true;
  }

  function removeTradingPortOffer(state, playerId, structureId, offerId) {
    const player = state && state.players && state.players[playerId];
    const structure = normalizeTradingPortState(structureById(state && state.world, structureId, "trading-port"));
    if (!structure || !isTradingPortOwner(structure, playerId) || !canPlayerAccessStructure(player, structure, TRADING_PORT_ACCESS_PADDING)) {
      return false;
    }
    const cleanOfferId = String(offerId || "");
    const nextOffers = structure.tradeOffers.filter((offer) => offer.id !== cleanOfferId);
    if (nextOffers.length === structure.tradeOffers.length) {
      return false;
    }
    structure.tradeOffers = nextOffers;
    return true;
  }

  function acceptTradingPortOffer(state, playerId, structureId, offerId) {
    const player = state && state.players && state.players[playerId];
    const structure = normalizeTradingPortState(structureById(state && state.world, structureId, "trading-port"));
    if (!structure || !player || isTradingPortOwner(structure, playerId) || !canPlayerAccessStructure(player, structure, TRADING_PORT_ACCESS_PADDING)) {
      return false;
    }
    player.tech = normalizeTradeOffer(player.tech);
    const offer = structure.tradeOffers.find((candidate) => candidate.id === String(offerId || ""));
    if (!tradingPortOfferIsLive(structure, offer)) {
      return false;
    }
    const canPay = TECH_KEYS.every((key) => normalizeTradeOffer(offer.receive)[key] <= player.tech[key]);
    if (!canPay) {
      return false;
    }
    player.tech = addOfferToTech(subtractOfferFromTech(player.tech, offer.receive), offer.pay);
    structure.tech = addOfferToTech(subtractOfferFromTech(structure.tech, offer.pay), offer.receive);
    if (!Array.isArray(state.events)) {
      state.events = [];
    }
    state.events.push({
      type: "tradingPort.directTrade",
      playerId,
      structureId: structure.id,
      offerId: offer.id,
      tick: state.tick
    });
    return true;
  }

  function findAutomatedTradingPortMatch(state, sourceStructure) {
    const world = state && state.world;
    normalizeTradingPortState(sourceStructure);
    if (!world || sourceStructure.tradeVessel && sourceStructure.tradeVessel.state !== "docked") {
      return null;
    }
    for (const sourceOffer of sourceStructure.tradeOffers) {
      if (!tradingPortOfferIsLive(sourceStructure, sourceOffer)) {
        continue;
      }
      let best = null;
      let bestDistance = Infinity;
      for (const targetStructure of world.structures || []) {
        if (
          !targetStructure ||
          targetStructure === sourceStructure ||
          targetStructure.type !== "trading-port" ||
          finiteOr(targetStructure.health, 0) <= 0 ||
          isStructureDisabled(targetStructure)
        ) {
          continue;
        }
        const distance = Math.hypot(targetStructure.x - sourceStructure.x, targetStructure.y - sourceStructure.y);
        if (distance > TRADING_PORT_RANGE || distance >= bestDistance) {
          continue;
        }
        normalizeTradingPortState(targetStructure);
        if (targetStructure.tradeVessel && targetStructure.tradeVessel.state !== "docked") {
          continue;
        }
        for (const targetOffer of targetStructure.tradeOffers) {
          if (tradingPortOfferIsLive(targetStructure, targetOffer) && tradingPortOffersCompatible(sourceOffer, targetOffer)) {
            best = { sourceOffer, targetStructure, targetOffer };
            bestDistance = distance;
          }
        }
      }
      if (best) {
        return best;
      }
    }
    return null;
  }

  function launchTradingPortVessel(structure, match) {
    structure.tech = subtractOfferFromTech(structure.tech, match.sourceOffer.pay);
    structure.tradeVessel = {
      state: "outbound",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: TRADING_PORT_VESSEL_MAX_HEALTH,
      cooldown: 0,
      sourceStructureId: structure.id,
      targetStructureId: match.targetStructure.id,
      sourceOfferId: match.sourceOffer.id,
      targetOfferId: match.targetOffer.id,
      cargo: normalizeTradeOffer(match.sourceOffer.pay)
    };
  }

  function steerTradingPortVessel(state, vessel, destination, dt) {
    const toDest = normalize(finiteOr(destination.x, 0) - vessel.x, finiteOr(destination.y, 0) - vessel.y);
    let steerX = toDest.x;
    let steerY = toDest.y;
    for (const actor of Object.values(state.players || {})) {
      if (!actor || finiteOr(actor.health, 0) <= 0 || actor.spacecraftInterior) {
        continue;
      }
      if (Math.hypot(finiteOr(actor.x, 0) - finiteOr(destination.x, 0), finiteOr(actor.y, 0) - finiteOr(destination.y, 0)) < 190) {
        continue;
      }
      const dx = vessel.x - finiteOr(actor.x, 0);
      const dy = vessel.y - finiteOr(actor.y, 0);
      const distance = Math.hypot(dx, dy) || 1;
      const avoidRadius = 280 + finiteOr(actor.radius, PLAYER_RADIUS);
      if (distance >= avoidRadius) {
        continue;
      }
      const force = Math.pow(1 - distance / avoidRadius, 1.8) * 2.6;
      steerX += dx / distance * force;
      steerY += dy / distance * force;
    }
    const desired = normalize(steerX, steerY);
    const destinationBody = bodyById(state.world, destination.bodyId);
    const baseVx = destinationBody ? finiteOr(destinationBody.vx, 0) : 0;
    const baseVy = destinationBody ? finiteOr(destinationBody.vy, 0) : 0;
    vessel.vx += (baseVx + desired.x * TRADING_PORT_VESSEL_SPEED - vessel.vx) * (1 - Math.pow(0.015, dt));
    vessel.vy += (baseVy + desired.y * TRADING_PORT_VESSEL_SPEED - vessel.vy) * (1 - Math.pow(0.015, dt));
    const relativeVx = vessel.vx - baseVx;
    const relativeVy = vessel.vy - baseVy;
    const speed = Math.hypot(relativeVx, relativeVy);
    if (speed > TRADING_PORT_VESSEL_SPEED) {
      vessel.vx = baseVx + relativeVx / speed * TRADING_PORT_VESSEL_SPEED;
      vessel.vy = baseVy + relativeVy / speed * TRADING_PORT_VESSEL_SPEED;
    }
    vessel.x += vessel.vx * dt;
    vessel.y += vessel.vy * dt;
    vessel.angle = Math.atan2(vessel.vy, vessel.vx);
  }

  function dropTradeVesselCargo(state, vessel) {
    const cargo = normalizeTradeOffer(vessel && vessel.cargo);
    for (const key of TECH_KEYS) {
      const amount = Math.min(12, cargo[key]);
      for (let i = 0; i < amount; i += 1) {
        createTechPickup(state, key, finiteOr(vessel.x, 0), finiteOr(vessel.y, 0), finiteOr(vessel.vx, 0), finiteOr(vessel.vy, 0));
      }
    }
  }

  function destroyTradingPortVessel(state, structure, cause) {
    const vessel = normalizeTradeVessel(structure && structure.tradeVessel, structure);
    if (!structure || vessel.state === "docked") {
      return false;
    }
    dropTradeVesselCargo(state, vessel);
    structure.tradeVessel = {
      state: "docked",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: TRADING_PORT_VESSEL_MAX_HEALTH,
      cooldown: TRADING_PORT_VESSEL_COOLDOWN * 1.6,
      cargo: normalizeTradeOffer(null)
    };
    if (!Array.isArray(state.events)) {
      state.events = [];
    }
    state.events.push({
      type: "tradingPort.vesselDestroyed",
      structureId: structure.id,
      x: vessel.x,
      y: vessel.y,
      cause: cause || "projectile",
      tick: state.tick
    });
    return true;
  }

  function damageTradingPortVessel(state, structure, damage, cause) {
    const vessel = normalizeTradeVessel(structure && structure.tradeVessel, structure);
    if (!structure || vessel.state === "docked") {
      return false;
    }
    vessel.health = Math.max(0, vessel.health - Math.max(0, finiteOr(damage, 0)));
    structure.tradeVessel = vessel;
    if (vessel.health <= 0) {
      return destroyTradingPortVessel(state, structure, cause);
    }
    return true;
  }

  function tradeVesselHitBySegment(state, tailX, tailY, headX, headY, radius, damage, cause) {
    for (const structure of state && state.world && state.world.structures || []) {
      if (!structure || structure.type !== "trading-port") {
        continue;
      }
      const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
      if (vessel.state === "docked") {
        continue;
      }
      if (distanceToSegment(vessel.x, vessel.y, tailX, tailY, headX, headY) <= TRADING_PORT_VESSEL_RADIUS + Math.max(0, finiteOr(radius, 0))) {
        return damageTradingPortVessel(state, structure, damage, cause);
      }
    }
    return false;
  }

  function completeTradingPortVesselArrival(state, structure, target) {
    const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
    if (!target || finiteOr(target.health, 0) <= 0 || isStructureDisabled(target)) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      structure.tradeVessel = vessel;
      return;
    }
    normalizeTradingPortState(target);
    const targetOffer = target.tradeOffers.find((offer) => offer.id === vessel.targetOfferId);
    const sourceOffer = structure.tradeOffers.find((offer) => offer.id === vessel.sourceOfferId);
    if (!tradingPortOfferIsLive(target, targetOffer) || !sourceOffer || !tradingPortOffersCompatible(sourceOffer, targetOffer)) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      structure.tradeVessel = vessel;
      return;
    }
    target.tech = addOfferToTech(subtractOfferFromTech(target.tech, targetOffer.pay), vessel.cargo);
    vessel.cargo = normalizeTradeOffer(targetOffer.pay);
    vessel.state = "returning";
    vessel.targetStructureId = structure.id;
    structure.tradeVessel = vessel;
    if (!Array.isArray(state.events)) {
      state.events = [];
    }
    state.events.push({
      type: "tradingPort.automatedTrade",
      sourceStructureId: structure.id,
      targetStructureId: target.id,
      tick: state.tick
    });
  }

  function updateTradingPort(state, structure, dt) {
    normalizeTradingPortState(structure);
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.7, 0, 1);
    const vessel = structure.tradeVessel;
    if (vessel.state === "docked") {
      vessel.x = structure.x;
      vessel.y = structure.y;
      vessel.health = TRADING_PORT_VESSEL_MAX_HEALTH;
      vessel.cooldown = Math.max(0, finiteOr(vessel.cooldown, 0) - dt);
      if (vessel.cooldown <= 0) {
        const match = findAutomatedTradingPortMatch(state, structure);
        if (match) {
          launchTradingPortVessel(structure, match);
        }
      }
      return;
    }

    const destination = vessel.state === "returning" ? structure : structureById(state.world, vessel.targetStructureId, "trading-port");
    if (!destination) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      steerTradingPortVessel(state, vessel, structure, dt);
      return;
    }
    steerTradingPortVessel(state, vessel, destination, dt);
    if (Math.hypot(vessel.x - destination.x, vessel.y - destination.y) > 42) {
      return;
    }
    if (vessel.state === "outbound") {
      completeTradingPortVesselArrival(state, structure, destination);
      return;
    }
    structure.tech = addOfferToTech(structure.tech, vessel.cargo);
    structure.tradeVessel = {
      state: "docked",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: TRADING_PORT_VESSEL_MAX_HEALTH,
      cooldown: TRADING_PORT_VESSEL_COOLDOWN,
      cargo: normalizeTradeOffer(null)
    };
  }

  function clonePlayer(player) {
    if (!player || typeof player !== "object") {
      return null;
    }
    return {
      id: player.id,
      name: player.name,
      teamId: String(player.teamId || ""),
      skinId: player.skinId || "",
      trailId: player.trailId || "",
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius,
      health: player.health,
      maxHealth: player.maxHealth,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
      score: Math.max(1, Math.round(finiteOr(player.score, 1))),
      hitCooldown: player.hitCooldown,
      respawnTimer: player.respawnTimer,
      invulnerableTimer: player.invulnerableTimer,
      statusEffects: normalizePlayerStatusEffects(player.statusEffects, player.toolDisabledTimer),
      toolDisabledTimer: player.toolDisabledTimer,
      toolFireCooldown: Math.max(0, finiteOr(player.toolFireCooldown, 0)),
      landed: player.landed ? clone(player.landed) : null,
      spacecraftInterior: player.spacecraftInterior ? clone(player.spacecraftInterior) : null,
      walkCycle: player.walkCycle,
      cameraRoll: player.cameraRoll,
      aimAngle: player.aimAngle,
      aimLocalAngle: player.aimLocalAngle,
      equippedTool: player.equippedTool,
      toolMode: player.toolMode,
      moving: Boolean(player.moving),
      boosting: Boolean(player.boosting),
      jetpackMoveX: finiteOr(player.jetpackMoveX, 0),
      jetpackMoveY: finiteOr(player.jetpackMoveY, -1),
      crouching: Boolean(player.crouching),
      rocketSuitCharge: clamp(finiteOr(player.rocketSuitCharge, 0), 0, 1),
      rocketSuitActive: Boolean(player.rocketSuitActive),
      tech: cloneTechInventory(player.tech),
      tools: Array.isArray(player.tools) ? player.tools.slice(0, 8) : [DEFAULT_TOOL_ID],
      equippedTools: Array.isArray(player.equippedTools) ? player.equippedTools.slice(0, 8) : [DEFAULT_TOOL_ID],
      toolUpgrades: player.toolUpgrades && typeof player.toolUpgrades === "object" ? clone(player.toolUpgrades) : {},
      familiarNetCapture: player.familiarNetCapture ? clone(player.familiarNetCapture) : null,
      familiarNetFireHeld: Boolean(player.familiarNetFireHeld),
      familiarNetReleaseHeld: Boolean(player.familiarNetReleaseHeld),
      personalTether: player.personalTether ? clone(player.personalTether) : null,
      personalTetherFireHeld: Boolean(player.personalTetherFireHeld),
      personalTetherReleaseHeld: Boolean(player.personalTetherReleaseHeld),
      lastInputSeq: Math.max(0, Math.floor(finiteOr(player.lastInputSeq, 0)))
    };
  }

  function serializeParticleState(body) {
    return body ? {
      id: body.id,
      x: body.x,
      y: body.y,
      vx: body.vx,
      vy: body.vy,
      mass: body.mass,
      radius: body.radius,
      energy: body.energy,
      maxEnergy: body.maxEnergy,
      rotation: body.rotation,
      angularVelocity: body.angularVelocity,
      color: cloneColor(body.color),
      textureSeed: body.textureSeed,
      wobble: body.wobble,
      pulse: body.pulse,
      spawnAge: body.spawnAge,
      spawnSizeScale: body.spawnSizeScale,
      orbitHostId: body.orbitHostId,
      orbitRingIndex: body.orbitRingIndex,
      orbitDirection: body.orbitDirection,
      orbitStrength: body.orbitStrength,
      orbitGrace: body.orbitGrace,
      starBirthAge: body.starBirthAge,
      starEmissionAccumulator: body.starEmissionAccumulator,
      stellarGrowthStarted: Boolean(body.stellarGrowthStarted),
      stellarGrowthRate: body.stellarGrowthRate,
      stellarGrowthLastSampleAt: body.stellarGrowthLastSampleAt,
      stellarOutcome: body.stellarOutcome || "",
      randomEventId: body.randomEventId || "",
      randomEventRegionX: body.randomEventRegionX,
      randomEventRegionY: body.randomEventRegionY,
      ufoSapTimer: body.ufoSapTimer,
      ufoSapSourceGraceTimer: body.ufoSapSourceGraceTimer,
      ufoExtractedById: body.ufoExtractedById,
      ufoExtractedFromId: body.ufoExtractedFromId,
      ufoSapParticleBuffer: body.ufoSapParticleBuffer,
      survivalCampId: body.survivalCampId || "",
      survivalCampX: body.survivalCampX,
      survivalCampY: body.survivalCampY,
      survivalCampHomeX: body.survivalCampHomeX,
      survivalCampHomeY: body.survivalCampHomeY,
      survivalCampMovedByPlayer: Boolean(body.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(body.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: body.survivalCampLastMoverPlayerId || "",
      survivalCampBody: Boolean(body.survivalCampBody),
      ambientSpawnRock: Boolean(body.ambientSpawnRock)
    } : null;
  }

  function serializePickupState(pickup, type) {
    if (!pickup) {
      return null;
    }
    const result = {
      id: pickup.id,
      x: pickup.x,
      y: pickup.y,
      vx: pickup.vx,
      vy: pickup.vy,
      radius: pickup.radius,
      life: pickup.life,
      maxLife: pickup.maxLife,
      wobble: pickup.wobble
    };
    if (type === "tech") {
      result.key = pickup.key;
      result.color = cloneColor(pickup.color);
      result.rotation = pickup.rotation;
    } else {
      result.heal = pickup.heal;
    }
    return result;
  }

  function serializeEntityState(entity) {
    if (!entity) {
      return null;
    }
    const result = {
      kind: entity.kind,
      id: entity.id,
      x: entity.x,
      y: entity.y,
      vx: entity.vx,
      vy: entity.vy,
      radius: entity.radius,
      health: entity.health,
      maxHealth: entity.maxHealth,
      hitCooldown: entity.hitCooldown,
      disabledTimer: entity.disabledTimer,
      flash: entity.flash,
      color: cloneColor(entity.color),
      shootCooldown: entity.shootCooldown,
      strafeSign: entity.strafeSign,
      rotation: entity.rotation,
      wobble: entity.wobble
    };
    for (const key of [
      "beamAngle",
      "beamPulse",
      "tractorDisabledTimer",
      "bossBeamMode",
      "bossBeamTimer",
      "chargeCooldown",
      "chargeTimer",
      "recoverTimer",
      "chargeDirX",
      "chargeDirY",
      "chargePower",
      "impactCooldown",
      "headAngle",
      "pistonTimer",
      "pistonDuration",
      "pistonHit",
      "healCooldown",
      "healPulse",
      "repairBeamAngle",
      "targetKind",
      "targetId",
      "lightningWarmup",
      "lightningFlash",
      "lightningAngle",
      "scannerAngle",
      "scanProgress",
      "lockTimer",
      "blastTimer",
      "lockX",
      "lockY",
      "blastDirX",
      "blastDirY",
      "volleyTimer",
      "volleyShots",
      "machineGunShots",
      "machineGunTimer",
      "shieldCharge",
      "shieldRecharge",
      "shieldActive",
      "isBoss",
      "bossBaseKind",
      "bossStars",
      "eliteStars",
      "eliteGroupSize",
      "minionCooldown",
      "altAttackCooldown",
      "bossBodyEvadeTimer",
      "bossBodyEvadeSpeedCap",
      "team",
      "familiarOwnerPlayerId",
      "familiarCommandX",
      "familiarCommandY",
      "familiarCommandTimer",
      "summonAge",
      "summonDuration",
      "summonBaseRadius",
      "summonSpinSpeed",
      "survivalCampId",
      "survivalCampX",
      "survivalCampY",
      "survivalCampHomeX",
      "survivalCampHomeY",
      "survivalCampMovedByPlayer",
      "survivalCampBodyMovedWakeSent",
      "survivalCampLastMoverPlayerId",
      "survivalCampLeashRadius",
      "survivalCampAggroTimer",
      "survivalCampReturning",
      "survivalCampSlotAngle",
      "survivalCampSlotRadius",
      "survivalMigrationCampId",
      "survivalMigrationCampX",
      "survivalMigrationCampY",
      "survivalMigrationStraightTime",
      "survivalMigrationDirX",
      "survivalMigrationDirY",
      "survivalEncounterType",
      "survivalEncounterId",
      "survivalTargetPlayerId",
      "survivalSalvageBodyId",
      "survivalSalvageSourceCampId",
      "survivalSalvageTargetCampId",
      "survivalSalvageAge",
      "survivalCampBudget",
      "survivalCampBand",
      "length",
      "life",
      "maxLife",
      "damage",
      "toolDisable",
      "cause",
      "sourcePlayerId",
      "sourceStructureId",
      "sourceMobId",
      "weaponLabel",
      "knockback",
      "piercesMobs",
      "hitMobIds",
      "ignoredBodyId",
      "targetPlayerId",
      "targetStructureId",
      "lightning",
      "rocket",
      "heatSeeking",
      "targetSpeed",
      "turnRate",
      "isBeacon",
      "beaconKind",
      "age",
      "respawnTimer",
      "driftAngle",
      "gadgetForceTimer"
    ]) {
      if (entity[key] !== undefined) {
        result[key] = entity[key];
      }
    }
    return result;
  }

  function serializeLiveMobState(mob) {
    if (!mob || finiteOr(mob.health, 0) <= 0) {
      return null;
    }
    return serializeEntityState(mob);
  }

  function normalizeSpacecraftNpcState(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    return {
      id: String(snapshot.id || "rogue-trader"),
      name: String(snapshot.name || "Rogue Trader"),
      x: finiteOr(snapshot.x, 24),
      y: finiteOr(snapshot.y, 22),
      targetX: finiteOr(snapshot.targetX, finiteOr(snapshot.x, 24)),
      targetY: finiteOr(snapshot.targetY, finiteOr(snapshot.y, 22)),
      speed: Math.max(20, finiteOr(snapshot.speed, 70)),
      walkCycle: finiteOr(snapshot.walkCycle, 0),
      wanderIndex: Math.max(0, Math.floor(finiteOr(snapshot.wanderIndex, 0))),
      aimAngle: finiteOr(snapshot.aimAngle, 0),
      crouching: Boolean(snapshot.crouching),
      combatTarget: Boolean(snapshot.combatTarget),
      sniperCooldown: Math.max(0, finiteOr(snapshot.sniperCooldown, 1.2)),
      sniperShotIndex: Math.max(0, Math.floor(finiteOr(snapshot.sniperShotIndex, 0)))
    };
  }

  function normalizeSpacecraftComponentState(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    const maxHealth = Math.max(1, finiteOr(snapshot.maxHealth, 100));
    const radius = Math.max(1, finiteOr(snapshot.radius, Math.max(finiteOr(snapshot.w, 40), finiteOr(snapshot.h, 40)) * 0.5));
    return {
      id: String(snapshot.id || "component"),
      kind: String(snapshot.kind || "room"),
      label: String(snapshot.label || snapshot.kind || "Component"),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      w: Math.max(1, finiteOr(snapshot.w, radius * 2)),
      h: Math.max(1, finiteOr(snapshot.h, radius * 2)),
      floorInset: Math.max(0, finiteOr(snapshot.floorInset, 24)),
      radius,
      angle: finiteOr(snapshot.angle, 0),
      aimAngle: finiteOr(snapshot.aimAngle, finiteOr(snapshot.angle, 0)),
      shootCooldown: Math.max(0, finiteOr(snapshot.shootCooldown, 0.4)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      maxHealth,
      health: clamp(Number.isFinite(Number(snapshot.health)) ? snapshot.health : maxHealth, 0, maxHealth)
    };
  }

  function normalizeSpacecraftState(source, fallbackId) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const id = Math.max(1, Math.floor(finiteOr(source.id, fallbackId || 1)));
    const npcs = Array.isArray(source.npcs) && source.npcs.length
      ? source.npcs.map(normalizeSpacecraftNpcState).filter(Boolean)
      : [normalizeSpacecraftNpcState(null)];
    return {
      id,
      kind: "spacecraft",
      blueprintId: String(source.blueprintId || ROGUE_TRADER_SPACECRAFT.blueprintId),
      name: String(source.name || ROGUE_TRADER_SPACECRAFT.name),
      x: finiteOr(source.x, 0),
      y: finiteOr(source.y, 0),
      vx: finiteOr(source.vx, 0),
      vy: finiteOr(source.vy, 0),
      eventId: String(source.eventId || ""),
      rotation: finiteOr(source.rotation, 0),
      width: Math.max(1, finiteOr(source.width, ROGUE_TRADER_SPACECRAFT.width)),
      height: Math.max(1, finiteOr(source.height, ROGUE_TRADER_SPACECRAFT.height)),
      door: source.door && typeof source.door === "object" ? { ...ROGUE_TRADER_SPACECRAFT_DOOR, ...clone(source.door) } : { ...ROGUE_TRADER_SPACECRAFT_DOOR },
      components: Array.isArray(source.components) && source.components.length
        ? source.components.map(normalizeSpacecraftComponentState).filter(Boolean)
        : ROGUE_TRADER_SPACECRAFT_COMPONENTS.map(normalizeSpacecraftComponentState),
      npcs
    };
  }

  function serializeSpacecraftState(craft) {
    const normalized = normalizeSpacecraftState(craft, craft && craft.id);
    return normalized ? {
      id: normalized.id,
      blueprintId: normalized.blueprintId,
      name: normalized.name,
      x: normalized.x,
      y: normalized.y,
      vx: normalized.vx,
      vy: normalized.vy,
      eventId: normalized.eventId,
      rotation: normalized.rotation,
      width: normalized.width,
      height: normalized.height,
      door: clone(normalized.door),
      components: Array.isArray(normalized.components) ? clone(normalized.components) : [],
      npcs: normalized.npcs.map((npc) => ({ ...npc }))
    } : null;
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function hashSeed(value) {
    const text = String(value || "clusternauts-v2");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function nextRandom(seedHolder) {
    let seed = seedHolder.seed >>> 0;
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
    seedHolder.seed = seed >>> 0;
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  }

  function randomRange(seedHolder, min, max) {
    return min + (max - min) * nextRandom(seedHolder);
  }

  function seededRange(seed, min, max) {
    const seedHolder = { seed: seed >>> 0 };
    return {
      value: randomRange(seedHolder, min, max),
      seed: seedHolder.seed >>> 0
    };
  }

  function tierForMass(mass) {
    let tier = BODY_TIERS[0];
    for (const candidate of BODY_TIERS) {
      if (mass >= candidate.threshold) {
        tier = candidate;
      }
    }
    return tier;
  }

  function normalizedStellarOutcomeName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    return STELLAR_OUTCOME_TIER_NAMES.includes(normalized) ? normalized : "";
  }

  function stellarOutcomeForGrowthRate(rate) {
    const growthRate = Math.max(0, finiteOr(rate, 0));
    if (growthRate >= STELLAR_GROWTH_RATE_BLACK_HOLE_THRESHOLD) {
      return "black hole";
    }
    if (growthRate >= STELLAR_GROWTH_RATE_NEUTRON_THRESHOLD) {
      return "neutron star";
    }
    return "white dwarf";
  }

  function tierForStellarOutcome(outcome) {
    const normalized = normalizedStellarOutcomeName(outcome) || "white dwarf";
    return STELLAR_BRANCH_TIERS.find((candidate) => candidate.name === normalized) || STELLAR_BRANCH_TIERS[0];
  }

  function tierForMassAndStellarOutcome(mass, outcome) {
    if (mass >= STELLAR_EVOLUTION_END_THRESHOLD) {
      return tierForStellarOutcome(outcome);
    }
    return tierForMass(mass);
  }

  function radiusAtTier(tier) {
    const radii = {
      particle: 11,
      rock: 22,
      boulder: 36,
      asteroid: 52,
      moon: 110,
      planet: 158,
      star: 224,
      "white dwarf": 188,
      "neutron star": 176,
      "black hole": 204
    };
    return radii[tier.name] || 11;
  }

  function radiusFromMass(mass) {
    const tier = tierForMass(mass);
    return radiusFromMassForTier(mass, tier);
  }

  function radiusFromMassForTier(mass, tier) {
    const tierIndex = BODY_TIERS.indexOf(tier);
    const nameIndex = tierIndex < 0 && tier && tier.name
      ? BODY_TIERS.findIndex((candidate) => candidate.name === tier.name)
      : tierIndex;
    const nextTier = nameIndex >= 0 ? BODY_TIERS[nameIndex + 1] || null : null;

    if (!nextTier) {
      return radiusAtTier(tier) + Math.log2(Math.max(1, mass / tier.threshold)) * 22;
    }

    const startRadius = radiusAtTier(tier);
    const endRadius = radiusAtTier(nextTier) - 3;
    const progress = clamp((mass - tier.threshold) / (nextTier.threshold - tier.threshold), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 1.8);
    return startRadius + (endRadius - startRadius) * eased;
  }

  function normalizeColor(source, fallback) {
    const color = source && typeof source === "object" ? source : fallback || {};
    return {
      r: Math.round(clamp(color.r, 0, 255)),
      g: Math.round(clamp(color.g, 0, 255)),
      b: Math.round(clamp(color.b, 0, 255))
    };
  }

  function mixColor(a, b, aw, bw) {
    const first = normalizeColor(a, { r: 255, g: 255, b: 255 });
    const second = normalizeColor(b, first);
    const firstWeight = Math.max(0, finiteOr(aw, 0));
    const secondWeight = Math.max(0, finiteOr(bw, 0));
    const total = Math.max(0.000001, firstWeight + secondWeight);
    return {
      r: Math.round((first.r * firstWeight + second.r * secondWeight) / total),
      g: Math.round((first.g * firstWeight + second.g * secondWeight) / total),
      b: Math.round((first.b * firstWeight + second.b * secondWeight) / total)
    };
  }

  function shadeColor(color, amount) {
    const source = normalizeColor(color, { r: 255, g: 255, b: 255 });
    return {
      r: clamp(source.r + amount, 0, 255),
      g: clamp(source.g + amount, 0, 255),
      b: clamp(source.b + amount, 0, 255)
    };
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lenSq = abx * abx + aby * aby;
    if (lenSq <= 0.000001) {
      return Math.hypot(px - ax, py - ay);
    }
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }

  function distanceBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
    function orientation(px, py, qx, qy, rx, ry) {
      const value = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
      if (Math.abs(value) < 0.000001) {
        return 0;
      }
      return value > 0 ? 1 : 2;
    }

    function onSegment(px, py, qx, qy, rx, ry) {
      return qx <= Math.max(px, rx) + 0.000001 &&
        qx + 0.000001 >= Math.min(px, rx) &&
        qy <= Math.max(py, ry) + 0.000001 &&
        qy + 0.000001 >= Math.min(py, ry);
    }

    const o1 = orientation(ax, ay, bx, by, cx, cy);
    const o2 = orientation(ax, ay, bx, by, dx, dy);
    const o3 = orientation(cx, cy, dx, dy, ax, ay);
    const o4 = orientation(cx, cy, dx, dy, bx, by);

    if (
      (o1 !== o2 && o3 !== o4) ||
      (o1 === 0 && onSegment(ax, ay, cx, cy, bx, by)) ||
      (o2 === 0 && onSegment(ax, ay, dx, dy, bx, by)) ||
      (o3 === 0 && onSegment(cx, cy, ax, ay, dx, dy)) ||
      (o4 === 0 && onSegment(cx, cy, bx, by, dx, dy))
    ) {
      return 0;
    }

    return Math.min(
      distanceToSegment(ax, ay, cx, cy, dx, dy),
      distanceToSegment(bx, by, cx, cy, dx, dy),
      distanceToSegment(cx, cy, ax, ay, bx, by),
      distanceToSegment(dx, dy, ax, ay, bx, by)
    );
  }

  function playerHurtboxSegment(targetPlayer) {
    const x = finiteOr(targetPlayer && targetPlayer.x, 0);
    const y = finiteOr(targetPlayer && targetPlayer.y, 0);
    let downX = 0;
    let downY = 1;

    if (targetPlayer && targetPlayer.landed && Number.isFinite(Number(targetPlayer.landed.angle))) {
      const angle = finiteOr(targetPlayer.landed.angle, 0) + Math.PI;
      downX = Math.cos(angle);
      downY = Math.sin(angle);
    } else if (targetPlayer && Number.isFinite(Number(targetPlayer.cameraRoll))) {
      const angle = finiteOr(targetPlayer.cameraRoll, 0) + Math.PI / 2;
      downX = Math.cos(angle);
      downY = Math.sin(angle);
    }

    return {
      ax: x + downX * PLAYER_HURTBOX_TOP_OFFSET,
      ay: y + downY * PLAYER_HURTBOX_TOP_OFFSET,
      bx: x + downX * PLAYER_HURTBOX_BOTTOM_OFFSET,
      by: y + downY * PLAYER_HURTBOX_BOTTOM_OFFSET
    };
  }

  function playerPickupSegment(targetPlayer) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    const x = finiteOr(targetPlayer && targetPlayer.x, 0);
    const y = finiteOr(targetPlayer && targetPlayer.y, 0);
    const segmentX = hurtbox.bx - hurtbox.ax;
    const segmentY = hurtbox.by - hurtbox.ay;
    const length = Math.hypot(segmentX, segmentY) || 1;
    const downX = segmentX / length;
    const downY = segmentY / length;

    return {
      ax: x + downX * PLAYER_PICKUP_TOP_OFFSET,
      ay: y + downY * PLAYER_PICKUP_TOP_OFFSET,
      bx: x + downX * PLAYER_PICKUP_BOTTOM_OFFSET,
      by: y + downY * PLAYER_PICKUP_BOTTOM_OFFSET
    };
  }

  function playerCanCollectPickup(targetPlayer, pickup) {
    if (!targetPlayer || !pickup) {
      return false;
    }
    const segment = playerPickupSegment(targetPlayer);
    const distance = distanceToSegment(
      finiteOr(pickup.x, 0),
      finiteOr(pickup.y, 0),
      segment.ax,
      segment.ay,
      segment.bx,
      segment.by
    );
    return distance <= Math.max(0, finiteOr(pickup.radius, 0)) + PLAYER_PICKUP_CONTACT_RADIUS;
  }

  function distanceToPlayerHurtboxSegment(targetPlayer, ax, ay, bx, by) {
    const hurtbox = playerHurtboxSegment(targetPlayer);
    return distanceBetweenSegments(ax, ay, bx, by, hurtbox.ax, hurtbox.ay, hurtbox.bx, hurtbox.by);
  }

  function segmentCircleIntersection(cx, cy, radius, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const fx = ax - cx;
    const fy = ay - cy;
    const a = dx * dx + dy * dy;
    if (a <= 0.000001) {
      return fx * fx + fy * fy <= radius * radius ? { x: ax, y: ay, t: 0 } : null;
    }
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return null;
    }
    const root = Math.sqrt(discriminant);
    const t1 = (-b - root) / (2 * a);
    const t2 = (-b + root) / (2 * a);
    let t = Number.POSITIVE_INFINITY;
    if (t1 >= 0 && t1 <= 1) {
      t = t1;
    }
    if (t2 >= 0 && t2 <= 1 && t2 < t) {
      t = t2;
    }
    if (!Number.isFinite(t)) {
      return null;
    }
    return {
      x: ax + dx * t,
      y: ay + dy * t,
      t
    };
  }

  function shortestAngleDelta(from, to) {
    let delta = (to - from) % (Math.PI * 2);
    if (delta > Math.PI) {
      delta -= Math.PI * 2;
    } else if (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return delta;
  }

  function defaultTechInventory(source) {
    const tech = {};
    const snapshot = source && typeof source === "object" ? source : {};
    for (const key of TECH_KEYS) {
      tech[key] = Math.max(0, Math.floor(finiteOr(snapshot[key], 0)));
    }
    return tech;
  }

  function normalizePlayerStatusEffects(source, legacyDisabledTimer) {
    const effects = source && typeof source === "object" ? source : {};
    const disabled = Math.max(0, finiteOr(effects.disabled, legacyDisabledTimer));
    return {
      disabled,
      disabledMax: Math.max(disabled, finiteOr(effects.disabledMax, disabled))
    };
  }

  function hasPlayerStatusEffect(player, status) {
    if (status === "disabled") {
      return Math.max(
        finiteOr(player && player.statusEffects && player.statusEffects.disabled, 0),
        finiteOr(player && player.toolDisabledTimer, 0)
      ) > 0;
    }
    return Math.max(0, finiteOr(player && player.statusEffects && player.statusEffects[status], 0)) > 0;
  }

  function applyPlayerStatusEffect(player, status, duration) {
    if (!player || status !== "disabled") {
      return false;
    }
    if (!player.statusEffects || typeof player.statusEffects !== "object") {
      player.statusEffects = normalizePlayerStatusEffects(null, player.toolDisabledTimer);
    }
    const amount = Math.max(0, finiteOr(duration, 0));
    if (amount <= 0) {
      player.statusEffects.disabled = 0;
      player.statusEffects.disabledMax = 0;
      player.toolDisabledTimer = 0;
      return true;
    }
    player.statusEffects.disabled = Math.max(finiteOr(player.statusEffects.disabled, 0), amount);
    player.statusEffects.disabledMax = amount >= finiteOr(player.statusEffects.disabled, 0)
      ? amount
      : Math.max(finiteOr(player.statusEffects.disabledMax, 0), player.statusEffects.disabled);
    player.toolDisabledTimer = Math.max(finiteOr(player.toolDisabledTimer, 0), player.statusEffects.disabled);
    if (amount > 0) {
      player.toolFireCooldown = Math.max(finiteOr(player.toolFireCooldown, 0), Math.min(amount, 1.2));
    }
    return true;
  }

  function updatePlayerStatusEffects(player, dt) {
    if (!player) {
      return;
    }
    player.statusEffects = normalizePlayerStatusEffects(player.statusEffects, player.toolDisabledTimer);
    for (const key of Object.keys(player.statusEffects)) {
      if (key === "disabledMax") {
        continue;
      }
      player.statusEffects[key] = Math.max(0, finiteOr(player.statusEffects[key], 0) - dt);
    }
    if (finiteOr(player.statusEffects.disabled, 0) <= 0) {
      player.statusEffects.disabledMax = 0;
    }
    player.toolDisabledTimer = Math.max(0, finiteOr(player.statusEffects.disabled, 0));
  }

  function normalizePlayer(source, fallbackId, index) {
    const snapshot = source && typeof source === "object" ? source : {};
    const playerId = String(snapshot.id || snapshot.playerId || fallbackId || "");
    const angle = index ? (Math.PI * 2 * index) / MAX_PLAYERS : 0;
    const spawnRadius = index ? 120 + index * 22 : 0;
    const maxHealth = clamp(Number.isFinite(Number(snapshot.maxHealth)) ? snapshot.maxHealth : PLAYER_MAX_HEALTH, 1, PLAYER_MAX_HEALTH);
    const maxEnergy = clamp(Number.isFinite(Number(snapshot.maxEnergy)) ? snapshot.maxEnergy : PLAYER_MAX_ENERGY, PLAYER_MAX_ENERGY, 260);
    const statusEffects = normalizePlayerStatusEffects(snapshot.statusEffects, snapshot.toolDisabledTimer);
    return {
      id: playerId,
      name: String(snapshot.name || (playerId ? "Player " + playerId.slice(-4).toUpperCase() : "Player")),
      teamId: String(snapshot.teamId || "").replace(/[^\w.-]/g, "").slice(0, 80),
      skinId: String(snapshot.skinId || "").replace(/[^\w.-]/g, "").slice(0, 64),
      trailId: String(snapshot.trailId || "").replace(/[^\w.-]/g, "").slice(0, 64),
      x: finiteOr(snapshot.x, Math.cos(angle) * spawnRadius),
      y: finiteOr(snapshot.y, Math.sin(angle) * spawnRadius),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, PLAYER_RADIUS),
      health: clamp(Number.isFinite(Number(snapshot.health)) ? snapshot.health : maxHealth, 0, maxHealth),
      maxHealth,
      energy: clamp(Number.isFinite(Number(snapshot.energy)) ? snapshot.energy : maxEnergy, 0, maxEnergy),
      maxEnergy,
      score: Math.max(1, Math.round(finiteOr(snapshot.score, 1))),
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      respawnTimer: Math.max(0, finiteOr(snapshot.respawnTimer, 0)),
      invulnerableTimer: Math.max(0, finiteOr(snapshot.invulnerableTimer, 0)),
      statusEffects,
      toolDisabledTimer: statusEffects.disabled,
      toolFireCooldown: Math.max(0, finiteOr(snapshot.toolFireCooldown, 0)),
      landed: normalizeLandingSnapshot(snapshot.landed),
      spacecraftInterior: normalizeSpacecraftInteriorSnapshot(snapshot.spacecraftInterior),
      walkCycle: finiteOr(snapshot.walkCycle, 0),
      cameraRoll: finiteOr(snapshot.cameraRoll, 0),
      aimAngle: finiteOr(snapshot.aimAngle, 0),
      aimLocalAngle: Number.isFinite(Number(snapshot.aimLocalAngle))
        ? finiteOr(snapshot.aimLocalAngle, 0)
        : finiteOr(snapshot.aimAngle, 0) + finiteOr(snapshot.cameraRoll, 0),
      equippedTool: String(snapshot.equippedTool || DEFAULT_TOOL_ID),
      toolMode: String(snapshot.toolMode || "idle"),
      moving: Boolean(snapshot.moving),
      boosting: Boolean(snapshot.boosting),
      jetpackMoveX: finiteOr(snapshot.jetpackMoveX, 0),
      jetpackMoveY: finiteOr(snapshot.jetpackMoveY, -1),
      crouching: Boolean(snapshot.crouching),
      rocketSuitCharge: clamp(finiteOr(snapshot.rocketSuitCharge, 0), 0, 1),
      rocketSuitActive: Boolean(snapshot.rocketSuitActive),
      tech: defaultTechInventory(snapshot.tech),
      tools: Array.isArray(snapshot.tools) && snapshot.tools.length ? snapshot.tools.slice(0, 8).map(String) : [DEFAULT_TOOL_ID],
      equippedTools: Array.isArray(snapshot.equippedTools) && snapshot.equippedTools.length ? snapshot.equippedTools.slice(0, 8).map(String) : [DEFAULT_TOOL_ID],
      toolUpgrades: snapshot.toolUpgrades && typeof snapshot.toolUpgrades === "object" ? clone(snapshot.toolUpgrades) : {},
      familiarNetCapture: normalizeFamiliarNetCapture(snapshot.familiarNetCapture),
      familiarNetFireHeld: Boolean(snapshot.familiarNetFireHeld),
      familiarNetReleaseHeld: Boolean(snapshot.familiarNetReleaseHeld),
      personalTether: normalizePersonalTetherSnapshot(snapshot.personalTether),
      personalTetherFireHeld: Boolean(snapshot.personalTetherFireHeld),
      personalTetherReleaseHeld: Boolean(snapshot.personalTetherReleaseHeld),
      lastInputSeq: Math.max(0, Math.floor(finiteOr(snapshot.lastInputSeq, 0)))
    };
  }

  function normalizePersonalTetherSnapshot(source) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const bodyId = Math.max(0, Math.floor(finiteOr(source.bodyId, 0)));
    if (!bodyId) {
      return null;
    }
    return {
      bodyId,
      angle: finiteOr(source.angle, 0),
      surfaceOffset: Math.max(0, finiteOr(source.surfaceOffset, 0)),
      restLength: clamp(finiteOr(source.restLength, 0), 80, PERSONAL_TETHER_MAX_REST_LENGTH),
      deploy: clamp(finiteOr(source.deploy, 1), 0, 1),
      wobble: finiteOr(source.wobble, 0)
    };
  }

  function normalizeFamiliarNetCapture(source) {
    if (!source || typeof source !== "object") {
      return null;
    }
    const kind = MOB_TIER_ORDER.includes(source.kind) ? source.kind : "";
    if (!kind || source.isBoss) {
      return null;
    }
    return {
      kind,
      health: Math.max(1, finiteOr(source.health, 1)),
      maxHealth: Math.max(1, finiteOr(source.maxHealth, source.health || 1)),
      color: cloneColor(source.color)
    };
  }

  function normalizeLandingSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      bridgeId: Math.max(0, Math.floor(finiteOr(snapshot.bridgeId, 0))),
      bridgeT: Math.max(0, finiteOr(snapshot.bridgeT, 0)),
      bridgeSide: finiteOr(snapshot.bridgeSide, 1) < 0 ? -1 : 1,
      bridgeInputSign: finiteOr(snapshot.bridgeInputSign, 1) < 0 ? -1 : 1,
      angle: finiteOr(snapshot.angle, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      walkCycle: finiteOr(snapshot.walkCycle, 0)
    };
  }

  function normalizeSpacecraftInteriorSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      spacecraftId: Math.max(1, Math.floor(finiteOr(snapshot.spacecraftId, 0))),
      localX: finiteOr(snapshot.localX, 0),
      localY: finiteOr(snapshot.localY, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      forceExit: Boolean(snapshot.forceExit),
      forceExitSpeed: Math.max(0, finiteOr(snapshot.forceExitSpeed, 0)),
      onFloor: snapshot.onFloor !== false
    };
  }

  function normalizeParticle(source, fallbackId, seedHolder) {
    const snapshot = source && typeof source === "object" ? source : {};
    const mass = Math.max(1, finiteOr(snapshot.mass, 1));
    const stellarOutcome = normalizedStellarOutcomeName(snapshot.stellarOutcome);
    const tier = tierForMassAndStellarOutcome(mass, stellarOutcome);
    const colorFallback = !snapshot.color && seedHolder ? randomParticleColor(seedHolder) : { r: 110, g: 190, b: 255 };
    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      mass,
      radius: radiusFromMassForTier(mass, tier),
      tier: clone(tier),
      energy: finiteOr(snapshot.energy, 0),
      maxEnergy: finiteOr(snapshot.maxEnergy, 0),
      rotation: finiteOr(snapshot.rotation, 0),
      angularVelocity: clamp(finiteOr(snapshot.angularVelocity, 0), -BODY_MAX_ANGULAR_SPEED, BODY_MAX_ANGULAR_SPEED),
      color: normalizeColor(snapshot.color, colorFallback),
      textureSeed: finiteOr(snapshot.textureSeed, seedHolder ? randomRange(seedHolder, 0, 1000) : 0),
      wobble: finiteOr(snapshot.wobble, seedHolder ? randomRange(seedHolder, 0, Math.PI * 2) : 0),
      pulse: finiteOr(snapshot.pulse, 1),
      spawnAge: clamp(finiteOr(snapshot.spawnAge, PARTICLE_SPAWN_TRANSITION_DURATION), 0, PARTICLE_SPAWN_TRANSITION_DURATION),
      spawnSizeScale: finiteOr(snapshot.spawnSizeScale, 1),
      orbitHostId: Math.max(0, Math.floor(finiteOr(snapshot.orbitHostId, 0))),
      orbitRingIndex: Math.max(0, Math.floor(finiteOr(snapshot.orbitRingIndex, 0))),
      orbitDirection: finiteOr(snapshot.orbitDirection, 1) < 0 ? -1 : 1,
      orbitStrength: clamp(finiteOr(snapshot.orbitStrength, 0), 0, 1),
      orbitGrace: Math.max(0, finiteOr(snapshot.orbitGrace, 0)),
      starBirthAge: clamp(finiteOr(snapshot.starBirthAge, tier.name === "star" ? STAR_BIRTH_TRANSITION_DURATION : 0), 0, STAR_BIRTH_TRANSITION_DURATION),
      starEmissionAccumulator: Math.max(0, finiteOr(snapshot.starEmissionAccumulator, 0)),
      stellarGrowthStarted: Boolean(snapshot.stellarGrowthStarted),
      stellarGrowthRate: Math.max(0, finiteOr(snapshot.stellarGrowthRate, 0)),
      stellarGrowthLastSampleAt: Math.max(0, finiteOr(snapshot.stellarGrowthLastSampleAt, 0)),
      stellarOutcome,
      randomEventId: typeof snapshot.randomEventId === "string" ? snapshot.randomEventId : "",
      randomEventRegionX: finiteOr(snapshot.randomEventRegionX, Number.NaN),
      randomEventRegionY: finiteOr(snapshot.randomEventRegionY, Number.NaN),
      ufoSapTimer: Math.max(0, finiteOr(snapshot.ufoSapTimer, 0)),
      ufoSapSourceGraceTimer: Math.max(0, finiteOr(snapshot.ufoSapSourceGraceTimer, 0)),
      ufoExtractedById: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedById, 0))),
      ufoExtractedFromId: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedFromId, 0))),
      ufoSapParticleBuffer: Math.max(0, finiteOr(snapshot.ufoSapParticleBuffer, 0)),
      survivalCampId: typeof snapshot.survivalCampId === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot.survivalCampY, 0),
      survivalCampHomeX: finiteOr(snapshot.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(snapshot.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(snapshot.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(snapshot.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof snapshot.survivalCampLastMoverPlayerId === "string" ? snapshot.survivalCampLastMoverPlayerId : "",
      survivalCampBody: Boolean(snapshot.survivalCampBody),
      ambientSpawnRock: Boolean(snapshot.ambientSpawnRock)
    };
  }

  function randomParticleColor(seedHolder) {
    const hue = randomRange(seedHolder, 0, 360);
    return hslToRgb(hue, randomRange(seedHolder, 0.74, 0.94), randomRange(seedHolder, 0.52, 0.68));
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

  function nearestPlayerDistance(x, y, players) {
    let nearest = Infinity;
    for (const player of players) {
      const distance = Math.hypot(x - player.x, y - player.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function ambientDensityAt(world, x, y) {
    const crowdRadius = 480;
    const crowdRadiusSq = crowdRadius * crowdRadius;
    let nearest = Infinity;
    let crowdCount = 0;
    for (const body of world.particles) {
      if (!body || body.tier && body.tier.solid) {
        continue;
      }
      const dx = x - body.x;
      const dy = y - body.y;
      const distanceSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSq);
      if (distance < nearest) {
        nearest = distance;
      }
      if (distanceSq <= crowdRadiusSq) {
        crowdCount += 1;
      }
    }
    return { nearest: Number.isFinite(nearest) ? nearest : crowdRadius, crowdCount };
  }

  function particlePatchNoise(cellX, cellY, salt) {
    const wave = Math.sin(cellX * 127.1 + cellY * 311.7 + salt * 74.3) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function particlePatchAffinityAt(x, y) {
    const cellSize = 1850;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    let affinity = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        const patchX = cellX + xOffset;
        const patchY = cellY + yOffset;
        const roll = particlePatchNoise(patchX, patchY, 0);
        if (roll < 0.58) {
          continue;
        }

        const centerX = (patchX + particlePatchNoise(patchX, patchY, 1)) * cellSize;
        const centerY = (patchY + particlePatchNoise(patchX, patchY, 2)) * cellSize;
        const radius = 720 + particlePatchNoise(patchX, patchY, 3) * 620;
        const distance = Math.hypot(x - centerX, y - centerY);
        const falloff = clamp(1 - distance / radius, 0, 1);
        const strength = 0.68 + particlePatchNoise(patchX, patchY, 4) * 0.52;
        affinity += falloff * falloff * strength;
      }
    }

    return clamp(affinity, 0, 1);
  }

  function particleVoidAffinityAt(x, y) {
    const cellSize = 2350;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    let affinity = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        const patchX = cellX + xOffset;
        const patchY = cellY + yOffset;
        const roll = particlePatchNoise(patchX, patchY, 9);
        if (roll < 0.64) {
          continue;
        }

        const centerX = (patchX + particlePatchNoise(patchX, patchY, 10)) * cellSize;
        const centerY = (patchY + particlePatchNoise(patchX, patchY, 11)) * cellSize;
        const radius = 780 + particlePatchNoise(patchX, patchY, 12) * 760;
        const distance = Math.hypot(x - centerX, y - centerY);
        const falloff = clamp(1 - distance / radius, 0, 1);
        const strength = 0.54 + particlePatchNoise(patchX, patchY, 13) * 0.5;
        affinity += falloff * falloff * strength;
      }
    }

    return clamp(affinity, 0, 1);
  }

  function chooseAmbientParticleSpawnPoint(world, anchor, players, seedHolder, options) {
    const localFill = Boolean(options && options.localFill);
    const localFillRadius = AMBIENT_PARTICLE_PLAYFIELD_RADIUS;
    const speed = Math.hypot(finiteOr(anchor.vx, 0), finiteOr(anchor.vy, 0));
    const moving = speed > 45;
    const travel = moving ? normalize(anchor.vx, anchor.vy) : { x: 0, y: 0 };
    const bowWave = Boolean(anchor.ambientAnchorBowWave && moving);
    const bowStrength = bowWave
      ? clamp(Object.prototype.hasOwnProperty.call(anchor, "ambientAnchorWeight") ? finiteOr(anchor.ambientAnchorWeight, 0) : 1, 0.02, 1)
      : 0;
    const bodyRadius = Math.max(0, finiteOr(anchor.radius, 0));
    let best = null;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const bowRoll = nextRandom(seedHolder);
      const wakeBias = bowWave && bowRoll < 0.26 + bowStrength * 0.1;
      const noseBias = bowWave && !wakeBias && bowRoll > 0.9 - bowStrength * 0.22;
      const bowSpread = randomRange(seedHolder, 0.18, 1.22 - bowStrength * 0.32);
      const bowSide = nextRandom(seedHolder) < 0.5 ? -1 : 1;
      const aheadBias = moving && nextRandom(seedHolder) < (bowWave ? 0.48 + bowStrength * 0.32 : 0.58);
      const angle = bowWave
        ? Math.atan2(travel.y, travel.x) + (wakeBias ? Math.PI + randomRange(seedHolder, -0.72, 0.72) : noseBias ? randomRange(seedHolder, -0.22, 0.22) : bowSide * bowSpread)
        : aheadBias
          ? Math.atan2(travel.y, travel.x) + randomRange(seedHolder, -1.05, 1.05)
          : randomRange(seedHolder, 0, Math.PI * 2);
      const baseMinDist = bowWave
        ? Math.max(bodyRadius + 46, 122)
        : AMBIENT_PARTICLE_MIN_PLAYER_DISTANCE * randomRange(seedHolder, 1, 1.12);
      const minDist = bowWave
        ? baseMinDist
        : localFill
        ? Math.min(baseMinDist, Math.max(120, AMBIENT_PARTICLE_DENSITY_RADIUS * 0.74))
        : baseMinDist;
      const broadMaxDist = bowWave
        ? Math.min(Math.max(minDist + 100, bodyRadius + 210 + speed * (0.03 + bowStrength * 0.045)), 520)
        : AMBIENT_PARTICLE_MAX_PLAYER_DISTANCE + clamp(speed * 0.82, 0, 620);
      const maxDist = bowWave
        ? broadMaxDist
        : localFill
        ? Math.max(minDist + 60, Math.min(broadMaxDist, localFillRadius * 0.92))
        : broadMaxDist;
      const dist = randomRange(seedHolder, minDist, maxDist);
      const ahead = bowWave
        ? wakeBias
          ? -randomRange(seedHolder, bodyRadius * 0.25, bodyRadius * (0.95 + bowStrength * 0.7) + speed * 0.1)
          : clamp(speed * randomRange(seedHolder, 0.005, 0.05 + bowStrength * 0.05), 0, 96)
        : moving ? clamp(speed * randomRange(seedHolder, 0.18, 1.2), 0, 820) : 0;
      const driftRange = bowWave ? Math.max(12, Math.min(58, bodyRadius * (0.09 + bowStrength * 0.08))) : localFill ? 110 : 220;
      const drift = rotatePoint(
        randomRange(seedHolder, -driftRange, driftRange),
        randomRange(seedHolder, -driftRange, driftRange),
        angle + Math.PI / 2
      );
      let x = anchor.x + travel.x * ahead + Math.cos(angle) * dist + drift.x;
      let y = anchor.y + travel.y * ahead + Math.sin(angle) * dist + drift.y;
      if (localFill) {
        const localDx = x - anchor.x;
        const localDy = y - anchor.y;
        const localDistance = Math.hypot(localDx, localDy);
        const maxLocalDistance = Math.max(120, localFillRadius * 0.96);
        if (localDistance > maxLocalDistance) {
          const scale = (maxLocalDistance * randomRange(seedHolder, 0.9, 0.99)) / localDistance;
          x = anchor.x + localDx * scale;
          y = anchor.y + localDy * scale;
        }
      }
      const nearest = nearestPlayerDistance(x, y, players);
      const density = ambientDensityAt(world, x, y);
      const patchAffinity = particlePatchAffinityAt(x, y);
      const voidAffinity = particleVoidAffinityAt(x, y) * (1 - patchAffinity * 0.55);
      const minAnchorDistance = bowWave ? Math.max(70, bodyRadius + 52) : AMBIENT_PARTICLE_MIN_PLAYER_DISTANCE;
      const tooCloseToPlayer = Math.max(0, minAnchorDistance - nearest);
      const patchWeight = localFill ? 0.24 : 1;
      const preferredSpacing = AMBIENT_PARTICLE_PREFERRED_SPACING * (1 - patchAffinity * 0.16 + voidAffinity * 0.55);
      const spacingPenalty = Math.max(0, preferredSpacing - density.nearest);
      const score =
        nearest * (bowWave ? 0.015 : 0.16) +
        density.nearest * (1.08 - patchAffinity * 0.2 + voidAffinity * 0.22) +
        patchAffinity * 860 * patchWeight -
        voidAffinity * 560 * (localFill ? 0.48 : 1) -
        density.crowdCount * (135 - patchAffinity * 45 + voidAffinity * 72) -
        (1 - patchAffinity) * 105 * patchWeight -
        tooCloseToPlayer * (bowWave ? 3.8 : 7.5) -
        spacingPenalty * (3.2 - patchAffinity * 1.25 + voidAffinity * 1.2);
      if (!best || score > best.score) {
        best = { x, y, angle, score, patchAffinity, voidAffinity, densityNearest: density.nearest, crowdCount: density.crowdCount, bowWave };
      }
    }
    return best || {
      x: anchor.x,
      y: anchor.y,
      angle: randomRange(seedHolder, 0, Math.PI * 2),
      patchAffinity: particlePatchAffinityAt(anchor.x, anchor.y),
      voidAffinity: particleVoidAffinityAt(anchor.x, anchor.y),
      densityNearest: 480,
      crowdCount: 0,
      score: 0,
      bowWave
    };
  }

  function ambientMassDetail(spawnPoint, roll, salt) {
    const x = finiteOr(spawnPoint && spawnPoint.x, 0);
    const y = finiteOr(spawnPoint && spawnPoint.y, 0);
    const wave = Math.sin(x * 0.017 + y * 0.023 + roll * 977.3 + salt * 43.7) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function randomAmbientParticleMass(seedHolder, spawnPoint) {
    const patchAffinity = clamp(finiteOr(spawnPoint && spawnPoint.patchAffinity, 0), 0, 1);
    const voidAffinity = clamp(finiteOr(spawnPoint && spawnPoint.voidAffinity, 0), 0, 1);
    const richness = clamp(patchAffinity - voidAffinity * 0.55, 0, 1);
    const spacingRoom = clamp((finiteOr(spawnPoint && spawnPoint.densityNearest, 260) - 185) / 260, 0.12, 1);
    const crowdRoom = clamp(1 - finiteOr(spawnPoint && spawnPoint.crowdCount, 0) * 0.12, 0.38, 1);
    const resourceRoom = spacingRoom * crowdRoom;
    const roll = nextRandom(seedHolder);
    const detail = ambientMassDetail(spawnPoint, roll, 1);
    const rockChance = Math.max(0, (richness - 0.28) / 0.72) * (0.04 + richness * 0.065) * resourceRoom;

    if (roll < rockChance) {
      return 10;
    }

    const particleRoll = (roll - rockChance) / Math.max(0.0001, 1 - rockChance);
    const tinyCutoff = clamp(0.58 - richness * 0.2 + voidAffinity * 0.22, 0.38, 0.78);
    const smallCutoff = clamp(0.84 - richness * 0.14 + voidAffinity * 0.08, tinyCutoff + 0.08, 0.94);
    const mediumCutoff = clamp(0.96 - richness * 0.06, smallCutoff + 0.03, 0.985);

    if (particleRoll < tinyCutoff) {
      return 1;
    }
    if (particleRoll < smallCutoff) {
      return richness > 0.62 && detail < 0.34 ? 3 : 2;
    }
    if (particleRoll < mediumCutoff) {
      return 3;
    }
    return 4;
  }

  function randomBowWaveParticleColor(seedHolder) {
    return hslToRgb(
      randomRange(seedHolder, 24, 56),
      randomRange(seedHolder, 0.84, 0.98),
      randomRange(seedHolder, 0.56, 0.72)
    );
  }

  function createAmbientParticle(world, anchor, players, seedHolder, options) {
    const recycled = options && options.recycledBody;
    const spawnPoint = chooseAmbientParticleSpawnPoint(world, anchor, players, seedHolder, options);
    const bowWave = Boolean(spawnPoint.bowWave);
    const mass = randomAmbientParticleMass(seedHolder, spawnPoint);
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const speed = randomRange(seedHolder, 5, 36);
    const particleId = recycled ? recycled.id : world.nextParticleId++;
    const textureSeed = randomRange(seedHolder, 0, 1000);
    const bowStrength = bowWave
      ? clamp(Object.prototype.hasOwnProperty.call(anchor, "ambientAnchorWeight") ? finiteOr(anchor.ambientAnchorWeight, 0) : 1, 0.02, 1)
      : 0;
    const inheritScale = bowWave ? 0.01 + bowStrength * 0.018 : 0.08;
    const inwardSpeed = bowWave ? randomRange(seedHolder, 14 + bowStrength * 18, 36 + bowStrength * 48) : randomRange(seedHolder, 6, 26);
    const particle = normalizeParticle(
      {
        id: particleId,
        x: spawnPoint.x,
        y: spawnPoint.y,
        vx: Math.cos(angle) * speed + finiteOr(anchor.vx, 0) * inheritScale - Math.cos(spawnPoint.angle) * inwardSpeed,
        vy: Math.sin(angle) * speed + finiteOr(anchor.vy, 0) * inheritScale - Math.sin(spawnPoint.angle) * inwardSpeed,
        mass,
        color: bowWave ? randomBowWaveParticleColor(seedHolder) : randomParticleColor(seedHolder),
        textureSeed,
        wobble: randomRange(seedHolder, 0, Math.PI * 2),
        pulse: randomRange(seedHolder, 0.8, 1.25),
        spawnAge: 0,
        spawnSizeScale: ambientSpawnSizeScale(particleId, textureSeed)
      },
      particleId,
      seedHolder
    );
    particle.ambientSpawnRock = particle.tier && particle.tier.name === "rock";
    if (recycled) {
      Object.keys(recycled).forEach((key) => {
        delete recycled[key];
      });
      Object.assign(recycled, particle);
      return recycled;
    }
    return particle;
  }

  function ambientSpawnSizeScale(id, textureSeed) {
    const wave = Math.sin(id * 12.9898 + textureSeed * 78.233) * 43758.5453;
    const unit = wave - Math.floor(wave);
    if (unit < 0.74) {
      return 1;
    }
    if (unit < 0.94) {
      return 1.08;
    }
    return 1.16;
  }

  function normalizePickup(source, fallbackId, type) {
    const snapshot = source && typeof source === "object" ? source : {};
    const id = Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1)));
    if (type === "tech") {
      const key = TECH_KEYS.includes(snapshot.key) ? snapshot.key : "suction";
      return {
        id,
        key,
        label: key,
        color: normalizeColor(snapshot.color, { r: 255, g: 115, b: 173 }),
        x: finiteOr(snapshot.x, 0),
        y: finiteOr(snapshot.y, 0),
        vx: clamp(snapshot.vx, -2200, 2200),
        vy: clamp(snapshot.vy, -2200, 2200),
        radius: finiteOr(snapshot.radius, 15),
        life: clamp(snapshot.life, 0, 28),
        maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, 28)),
        rotation: finiteOr(snapshot.rotation, 0),
        wobble: finiteOr(snapshot.wobble, 0)
      };
    }
    return {
      id,
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      radius: finiteOr(snapshot.radius, 14),
      heal: clamp(snapshot.heal, 1, 100),
      life: clamp(snapshot.life, 0, HEALTH_PICKUP_LIFETIME),
      maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, HEALTH_PICKUP_LIFETIME)),
      wobble: finiteOr(snapshot.wobble, 0)
    };
  }

  function bossStarRankValue(value) {
    return Math.max(0, Math.floor(finiteOr(value, 0)));
  }

  function bossStarRank(mob) {
    return mob && mob.isBoss ? bossStarRankValue(mob.bossStars) : 0;
  }

  function bossHealthScaleForStars(stars) {
    return 1 + bossStarRankValue(stars) * MOB_BOSS_STAR_HEALTH_MULTIPLIER;
  }

  function bossStatScaleForStars(stars, perStar) {
    return 1 + bossStarRankValue(stars) * Math.max(0, finiteOr(perStar, 0));
  }

  function bossCooldownScaleForStars(stars) {
    return clamp(1 - bossStarRankValue(stars) * MOB_BOSS_STAR_COOLDOWN_REDUCTION, 0.42, 1);
  }

  function mobEliteStarRankValue(value) {
    return clamp(Math.floor(finiteOr(value, 0)), 0, MOB_ELITE_MAX_STARS);
  }

  function mobEliteStarRank(mob) {
    return mob && !mob.isBoss ? mobEliteStarRankValue(mob.eliteStars) : 0;
  }

  function mobEliteRewardValue(mob) {
    const stars = mobEliteStarRank(mob);
    return stars > 0
      ? Math.max(1, Math.floor(finiteOr(mob && mob.eliteGroupSize, stars * MOB_ELITE_COMPRESSION_SIZE)))
      : 1;
  }

  function mobEliteHealthScale(stars) {
    return 1 + mobEliteStarRankValue(stars) * MOB_ELITE_HEALTH_MULTIPLIER;
  }

  function mobEliteRadiusScale(stars) {
    return 1 + mobEliteStarRankValue(stars) * MOB_ELITE_RADIUS_MULTIPLIER;
  }

  function mobEliteStatScale(mob, perStar) {
    const stars = mobEliteStarRank(mob);
    return stars > 0 ? 1 + stars * Math.max(0, finiteOr(perStar, 0)) : 1;
  }

  function mobEliteCooldownScale(mob) {
    const stars = mobEliteStarRank(mob);
    return stars > 0 ? clamp(1 - stars * MOB_ELITE_COOLDOWN_REDUCTION, 0.7, 1) : 1;
  }

  function normalizeEntity(source, fallbackId, kind) {
    const snapshot = source && typeof source === "object" ? source : {};
    const defaultMaxHealthByKind = {
      alienoid: 100,
      ufo: 130,
      rambot: 210,
      engineer: 140,
      tesla: 150,
      satellite: 180,
      rocket: 170,
      fighter: 230
    };
    const isBoss = Boolean(snapshot.isBoss);
    const bossStars = isBoss ? bossStarRankValue(snapshot.bossStars) : 0;
    const eliteStars = isBoss ? 0 : mobEliteStarRankValue(snapshot.eliteStars);
    const eliteGroupSize = eliteStars > 0
      ? Math.max(MOB_ELITE_COMPRESSION_SIZE, Math.floor(finiteOr(snapshot.eliteGroupSize, eliteStars * MOB_ELITE_COMPRESSION_SIZE)))
      : 1;
    const baseMaxHealth = defaultMaxHealthByKind[kind] || 130;
    const maxHealthCap = isBoss
      ? baseMaxHealth * MOB_BOSS_HEALTH_MULTIPLIER * bossHealthScaleForStars(bossStars)
      : baseMaxHealth * mobEliteHealthScale(eliteStars);
    const maxHealth = clamp(finiteOr(snapshot.maxHealth, maxHealthCap), 1, maxHealthCap);
    const baseRadius = finiteOr(snapshot.radius, 28);
    return {
      ...clone(snapshot),
      kind: snapshot.kind || kind,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      radius: Math.max(1, isBoss && !Number.isFinite(Number(snapshot.radius)) ? baseRadius * MOB_BOSS_RADIUS_MULTIPLIER : baseRadius),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      tractorDisabledTimer: kind === "ufo" ? Math.max(0, finiteOr(snapshot.tractorDisabledTimer, 0)) : undefined,
      bossBeamMode: kind === "ufo" ? normalizeUfoBossBeamModeValue(snapshot.bossBeamMode) : undefined,
      bossBeamTimer: kind === "ufo" ? Math.max(0, finiteOr(snapshot.bossBeamTimer, UFO_BOSS_NORMAL_BEAM_DURATION)) : undefined,
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      shootCooldown: Math.max(0, finiteOr(snapshot.shootCooldown, kind === "alienoid" ? 1.2 : 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      color: normalizeColor(snapshot.color, { r: 112, g: 226, b: 255 }),
      team: snapshot.team === "player" ? "player" : "",
      familiarOwnerPlayerId: typeof snapshot.familiarOwnerPlayerId === "string" ? snapshot.familiarOwnerPlayerId : "",
      familiarCommandX: finiteOr(snapshot.familiarCommandX, 0),
      familiarCommandY: finiteOr(snapshot.familiarCommandY, 0),
      familiarCommandTimer: Math.max(0, finiteOr(snapshot.familiarCommandTimer, 0)),
      summonAge: Math.max(0, finiteOr(snapshot.summonAge, 0)),
      summonDuration: Math.max(0, finiteOr(snapshot.summonDuration, 0)),
      summonBaseRadius: Math.max(0, finiteOr(snapshot.summonBaseRadius, baseRadius)),
      summonSpinSpeed: finiteOr(snapshot.summonSpinSpeed, 0),
      survivalCampId: typeof snapshot.survivalCampId === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot.survivalCampY, 0),
      survivalCampHomeX: finiteOr(snapshot.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(snapshot.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(snapshot.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(snapshot.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof snapshot.survivalCampLastMoverPlayerId === "string" ? snapshot.survivalCampLastMoverPlayerId : "",
      survivalCampLeashRadius: Math.max(0, finiteOr(snapshot.survivalCampLeashRadius, 0)),
      survivalCampAggroTimer: Math.max(0, finiteOr(snapshot.survivalCampAggroTimer, 0)),
      survivalCampReturning: Boolean(snapshot.survivalCampReturning),
      survivalCampSlotAngle: finiteOr(snapshot.survivalCampSlotAngle, 0),
      survivalCampSlotRadius: Math.max(0, finiteOr(snapshot.survivalCampSlotRadius, 0)),
      survivalMigrationCampId: typeof snapshot.survivalMigrationCampId === "string" ? snapshot.survivalMigrationCampId : "",
      survivalMigrationCampX: finiteOr(snapshot.survivalMigrationCampX, Number.NaN),
      survivalMigrationCampY: finiteOr(snapshot.survivalMigrationCampY, Number.NaN),
      survivalMigrationStraightTime: Math.max(0, finiteOr(snapshot.survivalMigrationStraightTime, 0)),
      survivalMigrationDirX: finiteOr(snapshot.survivalMigrationDirX, 0),
      survivalMigrationDirY: finiteOr(snapshot.survivalMigrationDirY, 0),
      survivalEncounterType: ["camp", "migration", "salvage"].includes(snapshot.survivalEncounterType) ? snapshot.survivalEncounterType : "",
      survivalEncounterId: typeof snapshot.survivalEncounterId === "string" ? snapshot.survivalEncounterId : "",
      survivalTargetPlayerId: typeof snapshot.survivalTargetPlayerId === "string" ? snapshot.survivalTargetPlayerId : "",
      survivalSalvageBodyId: Math.max(0, Math.floor(finiteOr(snapshot.survivalSalvageBodyId, 0))),
      survivalSalvageSourceCampId: typeof snapshot.survivalSalvageSourceCampId === "string" ? snapshot.survivalSalvageSourceCampId : "",
      survivalSalvageTargetCampId: typeof snapshot.survivalSalvageTargetCampId === "string" ? snapshot.survivalSalvageTargetCampId : "",
      survivalSalvageAge: Math.max(0, finiteOr(snapshot.survivalSalvageAge, 0)),
      survivalCampBudget: Math.max(0, finiteOr(snapshot.survivalCampBudget, 0)),
      survivalCampBand: typeof snapshot.survivalCampBand === "string" ? snapshot.survivalCampBand : "",
      eliteStars,
      eliteGroupSize,
      isBoss,
      bossBaseKind: isBoss ? String(snapshot.bossBaseKind || kind) : "",
      bossStars,
      minionCooldown: isBoss ? clamp(finiteOr(snapshot.minionCooldown, MOB_BOSS_MINION_COOLDOWN_MIN), 0, MOB_BOSS_MINION_COOLDOWN_MAX) : 0,
      altAttackCooldown: isBoss ? clamp(finiteOr(snapshot.altAttackCooldown, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN), 0, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) : 0,
      bossBodyEvadeTimer: clamp(finiteOr(snapshot.bossBodyEvadeTimer, 0), 0, BOSS_BODY_EVADE_DURATION),
      bossBodyEvadeSpeedCap: clamp(finiteOr(snapshot.bossBodyEvadeSpeedCap, 0), 0, BOSS_BODY_EVADE_MAX_SPEED)
    };
  }

  function mobBeaconColor(kind) {
    if (kind === "ufo") return { r: 112, g: 226, b: 255 };
    if (kind === "rambot") return { r: 184, g: 196, b: 204 };
    if (kind === "engineer") return { r: 102, g: 224, b: 184 };
    if (kind === "tesla") return { r: 157, g: 255, b: 122 };
    if (kind === "satellite") return { r: 169, g: 133, b: 255 };
    if (kind === "rocket") return { r: 244, g: 150, b: 92 };
    if (kind === "fighter") return { r: 119, g: 167, b: 255 };
    return { r: 255, g: 115, b: 173 };
  }

  function mobBeaconMaxHealth(kind) {
    const tier = Math.max(0, MOB_TIER_ORDER.indexOf(kind));
    return 260 + tier * 34;
  }

  function isMobBeacon(entity) {
    return Boolean(entity && entity.isBeacon);
  }

  function mobEntityKind(entity) {
    const kind = isMobBeacon(entity) ? entity.beaconKind : entity && entity.kind;
    return MOB_TIER_ORDER.includes(kind) ? kind : "alienoid";
  }

  function normalizeMobBeacon(source, fallbackId) {
    const snapshot = source && typeof source === "object" ? source : {};
    const kind = MOB_TIER_ORDER.includes(snapshot.beaconKind)
      ? snapshot.beaconKind
      : MOB_TIER_ORDER.includes(snapshot.kind)
      ? snapshot.kind
      : "alienoid";
    const maxHealth = Math.max(1, finiteOr(snapshot.maxHealth, mobBeaconMaxHealth(kind)));
    return {
      kind: "beacon",
      beaconKind: kind,
      isBeacon: true,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      radius: Math.max(12, finiteOr(snapshot.radius, 46)),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      color: normalizeColor(snapshot.color, mobBeaconColor(kind)),
      rotation: finiteOr(snapshot.rotation, 0),
      wobble: finiteOr(snapshot.wobble, 0),
      age: Math.max(0, finiteOr(snapshot.age, 0)),
      respawnTimer: clamp(finiteOr(snapshot.respawnTimer, 0), 0, MOB_BEACON_RESPAWN_DURATION),
      driftAngle: finiteOr(snapshot.driftAngle, 0),
      gadgetForceTimer: Math.max(0, finiteOr(snapshot.gadgetForceTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1
    };
  }

  function normalizeRandomEventState(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    const activeSource = snapshot.active && typeof snapshot.active === "object" ? snapshot.active : null;
    let active = null;
    if (activeSource) {
      const duration = Math.max(1, finiteOr(activeSource.duration, 30));
      const elapsed = Math.max(0, finiteOr(activeSource.elapsed, 0));
      if (elapsed < duration) {
        active = {
          ...activeSource,
          duration,
          elapsed,
          timer: Math.max(0, finiteOr(activeSource.timer, duration - elapsed))
        };
      }
    }
    return {
      enabled: snapshot.enabled !== false,
      cooldown: Math.max(RANDOM_EVENT_MIN_COOLDOWN, finiteOr(snapshot.cooldown, RANDOM_EVENT_DEFAULT_COOLDOWN)),
      timer: Math.max(0, finiteOr(snapshot.timer, snapshot.cooldown || RANDOM_EVENT_DEFAULT_COOLDOWN)),
      active,
      history: Array.isArray(snapshot.history) ? snapshot.history.slice(-12).map((entry) => String(entry || "")).filter(Boolean) : []
    };
  }

  function serializeRandomEventState(source) {
    return normalizeRandomEventState(source);
  }

  function registerRandomEventDefinition(definition) {
    if (!definition || typeof definition !== "object" || !definition.id) {
      return false;
    }
    const id = String(definition.id);
    const index = RANDOM_EVENT_DEFINITIONS.findIndex((candidate) => candidate.id === id);
    const cleanDefinition = { ...definition, id };
    if (index >= 0) {
      RANDOM_EVENT_DEFINITIONS[index] = cleanDefinition;
    } else {
      RANDOM_EVENT_DEFINITIONS.push(cleanDefinition);
    }
    return true;
  }

  function randomEventHistoryCount(randomEvents, id) {
    const eventId = String(id || "");
    const history = Array.isArray(randomEvents && randomEvents.history) ? randomEvents.history : [];
    return history.reduce((count, entry) => count + (String(entry || "") === eventId ? 1 : 0), 0);
  }

  function activeRandomEventPlayers(state) {
    const players = Object.values(state && state.players || {}).filter((entry) => entry && finiteOr(entry.health, 0) > 0);
    if (players.length) {
      return players;
    }
    return Object.values(state && state.players || {}).filter(Boolean);
  }

  function chooseRandomEventDefinition(state, randomEvents) {
    const candidates = RANDOM_EVENT_DEFINITIONS.map((definition) => {
      if (definition.canStart && definition.canStart(state, randomEvents) === false) {
        return null;
      }
      const weight = Math.max(0, finiteOr(
        typeof definition.weight === "function" ? definition.weight(state, randomEvents) : definition.weight,
        1
      ));
      return weight > 0 ? { definition, weight } : null;
    }).filter(Boolean);
    const totalWeight = candidates.reduce((total, candidate) => total + candidate.weight, 0);
    if (totalWeight <= 0) {
      return null;
    }
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state && state.seed, 1))) >>> 0 };
    let roll = randomRange(seedHolder, 0, totalWeight);
    state.seed = seedHolder.seed >>> 0;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) {
        return candidate.definition;
      }
    }
    return candidates[candidates.length - 1].definition;
  }

  function finishRandomEvent(state, reason) {
    const randomEvents = state && state.world ? state.world.randomEvents : null;
    const active = randomEvents && randomEvents.active;
    if (!active) {
      return;
    }
    const definition = RANDOM_EVENT_DEFINITIONS.find((candidate) => candidate.id === active.id);
    if (definition && typeof definition.finish === "function") {
      definition.finish(state, active, reason || "complete");
    }
    randomEvents.active = null;
    randomEvents.timer = Math.max(RANDOM_EVENT_MIN_COOLDOWN, finiteOr(randomEvents.cooldown, RANDOM_EVENT_DEFAULT_COOLDOWN));
  }

  function startRandomEvent(state, randomEvents, definition) {
    if (!state || !randomEvents || !definition) {
      return false;
    }
    const eventState = {
      id: definition.id,
      elapsed: 0,
      duration: Math.max(1, finiteOr(definition.duration, 30))
    };
    randomEvents.active = eventState;
    randomEvents.history = Array.isArray(randomEvents.history) ? randomEvents.history : [];
    randomEvents.history.push(definition.id);
    randomEvents.history = randomEvents.history.slice(-12);
    if (typeof definition.start === "function") {
      definition.start(state, eventState);
    }
    return true;
  }

  function forceRandomEvent(state, eventId) {
    const randomEvents = state && state.world ? state.world.randomEvents : null;
    const id = String(eventId || "");
    const definition = RANDOM_EVENT_DEFINITIONS.find((candidate) => candidate.id === id);
    if (!randomEvents || !definition) {
      return false;
    }
    if (id === METEOR_SHOWER_EVENT_ID && !meteorShowerCanStartAfterParticleStorms(state, randomEvents)) {
      return false;
    }
    if (randomEvents.active) {
      finishRandomEvent(state, "command");
    }
    randomEvents.enabled = true;
    return startRandomEvent(state, randomEvents, definition);
  }

  function updateRandomEvents(state, dt) {
    const randomEvents = state && state.world ? state.world.randomEvents : null;
    if (!randomEvents || randomEvents.enabled === false || RANDOM_EVENT_DEFINITIONS.length === 0) {
      if (randomEvents && randomEvents.active) {
        finishRandomEvent(state, "disabled");
      }
      return;
    }

    if (randomEvents.active) {
      randomEvents.active.elapsed = Math.max(0, finiteOr(randomEvents.active.elapsed, 0) + dt);
      const definition = RANDOM_EVENT_DEFINITIONS.find((candidate) => candidate.id === randomEvents.active.id);
      if (definition && typeof definition.update === "function") {
        definition.update(state, randomEvents.active, dt);
      }
      if (!definition || randomEvents.active.elapsed >= Math.max(1, finiteOr(randomEvents.active.duration, 30))) {
        finishRandomEvent(state, "duration");
      }
      return;
    }

    randomEvents.timer = Math.max(0, finiteOr(randomEvents.timer, randomEvents.cooldown) - dt);
    if (randomEvents.timer <= 0) {
      if (!startRandomEvent(state, randomEvents, chooseRandomEventDefinition(state, randomEvents))) {
        randomEvents.timer = Math.max(RANDOM_EVENT_MIN_COOLDOWN, finiteOr(randomEvents.cooldown, RANDOM_EVENT_DEFAULT_COOLDOWN));
      }
    }
  }

  function particleStormWeight(state, randomEvents) {
    const history = Array.isArray(randomEvents && randomEvents.history) ? randomEvents.history : [];
    if (!history.length) {
      return 18;
    }
    return randomEventHistoryCount(randomEvents, PARTICLE_STORM_EVENT_ID) <= 0 ? 6 : 1.35;
  }

  function meteorShowerWeight(state, randomEvents) {
    if (!meteorShowerCanStartAfterParticleStorms(state, randomEvents)) {
      return 0;
    }
    return randomEventHistoryCount(randomEvents, METEOR_SHOWER_EVENT_ID) <= 0 ? 5 : 1.1;
  }

  function meteorShowerCanStartWithUfoBoss(state) {
    const world = state && state.world ? state.world : {};
    return Math.max(0, Math.floor(finiteOr(world.mobDefeatsByKind && world.mobDefeatsByKind.ufo, 0))) >= MOB_BOSS_DEFEATS_TO_UNLOCK;
  }

  function meteorShowerCanStartAfterParticleStorms(state, randomEvents) {
    return randomEventHistoryCount(randomEvents, PARTICLE_STORM_EVENT_ID) >= 3 && meteorShowerCanStartWithUfoBoss(state);
  }

  function chooseParticleStormRegion(state, seedHolder) {
    const anchors = activeRandomEventPlayers(state);
    const source = anchors.length ? anchors[Math.floor(randomRange(seedHolder, 0, anchors.length))] : { x: 0, y: 0, vx: 0, vy: 0 };
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const travelAngle = speed > 60 ? Math.atan2(source.vy, source.vx) : randomRange(seedHolder, 0, Math.PI * 2);
    const sideAngle = travelAngle + randomRange(seedHolder, -0.85, 0.85);
    const distance = randomRange(seedHolder, 920, 1520);
    return {
      x: finiteOr(source.x, 0) + Math.cos(sideAngle) * distance,
      y: finiteOr(source.y, 0) + Math.sin(sideAngle) * distance,
      radius: randomRange(seedHolder, PARTICLE_STORM_SETTINGS.radiusMin, PARTICLE_STORM_SETTINGS.radiusMax),
      windAngle: sideAngle + Math.PI + randomRange(seedHolder, -0.55, 0.55),
      phase: randomRange(seedHolder, 0, Math.PI * 2),
      maxParticles: PARTICLE_STORM_SETTINGS.maxActiveParticles
    };
  }

  function rogueTraderWeight(state, randomEvents) {
    const elapsed = Math.max(0, finiteOr(state && state.tick, 0) * TICK_DT);
    if (elapsed < ROGUE_TRADER_EVENT_SETTINGS.earliestSpawnTime) {
      return 0;
    }
    return randomEventHistoryCount(randomEvents, ROGUE_TRADER_EVENT_ID) <= 0 ? 0.65 : 0.14;
  }

  function chooseRogueTraderRegion(state, seedHolder) {
    const anchors = activeRandomEventPlayers(state);
    const source = anchors.length ? anchors[Math.floor(randomRange(seedHolder, 0, anchors.length))] : null;
    const sourceX = finiteOr(source && source.x, 0);
    const sourceY = finiteOr(source && source.y, 0);
    const targetDistance = randomRange(seedHolder, ROGUE_TRADER_EVENT_SETTINGS.targetDistanceMin, ROGUE_TRADER_EVENT_SETTINGS.targetDistanceMax);
    const verticalOffset = randomRange(seedHolder, -260, 140);
    const side = randomRange(seedHolder, 0, 1) < 0.84 ? 1 : -1;
    const targetX = sourceX + side * targetDistance;
    const targetY = sourceY + verticalOffset;
    return {
      title: "Rogue Trader",
      targetX,
      targetY,
      startX: targetX + side * ROGUE_TRADER_EVENT_SETTINGS.spawnDistance,
      startY: targetY + randomRange(seedHolder, -120, 120),
      exitX: targetX - side * ROGUE_TRADER_EVENT_SETTINGS.spawnDistance * 1.25,
      exitY: targetY + randomRange(seedHolder, -180, 160),
      radius: ROGUE_TRADER_EVENT_SETTINGS.radius
    };
  }

  function startRogueTraderEvent(state, active) {
    if (!state || !active) {
      return;
    }
    const world = state.world || {};
    const seedHolder = {
      seed: Math.max(
        1,
        Math.floor(
          finiteOr(state.seed, 1) +
          finiteOr(state.tick, 0) * 1103515245 +
          finiteOr(world.nextSpacecraftId, 1) * 2654435761 +
          finiteOr(world.nextParticleId, 1) * 1013904223
        )
      ) >>> 0
    };
    Object.assign(active, chooseRogueTraderRegion(state, seedHolder));
    state.seed = seedHolder.seed >>> 0;
    updateRogueTraderSpacecraft(state, active, 0);
    if (Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.started", id: ROGUE_TRADER_EVENT_ID, title: "Rogue Trader", tick: state.tick });
    }
  }

  function finishRogueTraderEvent(state) {
    const world = state && state.world;
    if (world && Array.isArray(world.spacecrafts)) {
      for (const craft of world.spacecrafts) {
        if (craft && craft.eventId === ROGUE_TRADER_EVENT_ID) {
          for (const player of Object.values(state.players || {})) {
            if (player && player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
              leavePlayerSpacecraftInterior(player, craft, { speed: 260 });
            }
          }
        }
      }
      world.spacecrafts = world.spacecrafts.filter((craft) => !(craft && craft.eventId === ROGUE_TRADER_EVENT_ID));
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.finished", id: ROGUE_TRADER_EVENT_ID, title: "Rogue Trader", tick: state.tick });
    }
  }

  function rogueTraderEventPosition(active) {
    const elapsed = Math.max(0, finiteOr(active && active.elapsed, 0));
    const duration = Math.max(1, finiteOr(active && active.duration, ROGUE_TRADER_EVENT_SETTINGS.duration));
    const approachDuration = Math.max(0.5, ROGUE_TRADER_EVENT_SETTINGS.approachDuration);
    const leaveDuration = Math.max(0.5, ROGUE_TRADER_EVENT_SETTINGS.leaveDuration);
    const serviceDuration = Math.max(0.5, duration - approachDuration - leaveDuration);
    const startX = finiteOr(active && active.startX, 0);
    const startY = finiteOr(active && active.startY, 0);
    const targetX = finiteOr(active && active.targetX, startX);
    const targetY = finiteOr(active && active.targetY, startY);
    const exitX = finiteOr(active && active.exitX, targetX);
    const exitY = finiteOr(active && active.exitY, targetY);

    if (elapsed < approachDuration) {
      const t = smoothEventStep(elapsed / approachDuration);
      return {
        x: startX + (targetX - startX) * t,
        y: startY + (targetY - startY) * t,
        departing: false
      };
    }
    if (elapsed < approachDuration + serviceDuration) {
      const t = smoothEventStep((elapsed - approachDuration) / serviceDuration);
      return {
        x: targetX + (exitX - targetX) * t * 0.08,
        y: targetY + (exitY - targetY) * t * 0.08,
        departing: false
      };
    }

    const t = smoothEventStep((elapsed - approachDuration - serviceDuration) / leaveDuration);
    return {
      x: targetX + (exitX - targetX) * t,
      y: targetY + (exitY - targetY) * t,
      departing: true
    };
  }

  function smoothEventStep(value) {
    const t = clamp(finiteOr(value, 0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function findRogueTraderSpacecraft(world, active) {
    const craftId = Math.max(0, Math.floor(finiteOr(active && active.spacecraftId, 0)));
    const spacecrafts = world && Array.isArray(world.spacecrafts) ? world.spacecrafts : [];
    if (craftId > 0) {
      const byId = spacecrafts.find((craft) => craft && Math.floor(finiteOr(craft.id, 0)) === craftId);
      if (byId) {
        return byId;
      }
    }
    return spacecrafts.find((craft) => craft && craft.eventId === ROGUE_TRADER_EVENT_ID) || null;
  }

  function createRogueTraderSpacecraft(world, active, position) {
    const id = Math.max(1, Math.floor(finiteOr(world.nextSpacecraftId, 1)));
    world.nextSpacecraftId = id + 1;
    const craft = normalizeSpacecraftState({
      id,
      blueprintId: ROGUE_TRADER_SPACECRAFT.blueprintId,
      name: ROGUE_TRADER_SPACECRAFT.name,
      x: position.x,
      y: position.y,
      eventId: ROGUE_TRADER_EVENT_ID,
      width: ROGUE_TRADER_SPACECRAFT.width,
      height: ROGUE_TRADER_SPACECRAFT.height
    }, id);
    active.spacecraftId = craft.id;
    world.spacecrafts.push(craft);
    return craft;
  }

  function updateRogueTraderSpacecraft(state, active, dt) {
    const world = state && state.world;
    if (!world || !active) {
      return null;
    }
    world.spacecrafts = Array.isArray(world.spacecrafts) ? world.spacecrafts : [];
    const position = rogueTraderEventPosition(active);
    let craft = findRogueTraderSpacecraft(world, active);
    if (!craft) {
      craft = createRogueTraderSpacecraft(world, active, position);
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    const previousX = finiteOr(craft.x, position.x);
    const previousY = finiteOr(craft.y, position.y);
    craft.x = position.x;
    craft.y = position.y;
    craft.vx = seconds > 0 ? (craft.x - previousX) / seconds : finiteOr(craft.vx, 0);
    craft.vy = seconds > 0 ? (craft.y - previousY) / seconds : finiteOr(craft.vy, 0);
    craft.eventId = ROGUE_TRADER_EVENT_ID;
    craft.blueprintId = ROGUE_TRADER_SPACECRAFT.blueprintId;
    craft.name = ROGUE_TRADER_SPACECRAFT.name;
    active.spacecraftId = craft.id;
    if (position.departing) {
      forcePlayersOutOfSpacecraft(state, craft, { speed: 260 });
    }
    return craft;
  }

  function spacecraftLocalToWorld(craft, localX, localY) {
    const angle = finiteOr(craft && craft.rotation, 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: finiteOr(craft && craft.x, 0) + localX * cos - localY * sin,
      y: finiteOr(craft && craft.y, 0) + localX * sin + localY * cos
    };
  }

  function spacecraftWorldToLocal(craft, worldX, worldY) {
    const angle = -finiteOr(craft && craft.rotation, 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = finiteOr(worldX, 0) - finiteOr(craft && craft.x, 0);
    const dy = finiteOr(worldY, 0) - finiteOr(craft && craft.y, 0);
    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos
    };
  }

  function spacecraftDoor(craft) {
    return craft && craft.door && typeof craft.door === "object"
      ? { ...ROGUE_TRADER_SPACECRAFT_DOOR, ...craft.door }
      : { ...ROGUE_TRADER_SPACECRAFT_DOOR };
  }

  function spacecraftRooms(craft) {
    return craft && Array.isArray(craft.components) && craft.components.some((component) => component && component.kind === "room")
      ? craft.components.filter((component) => component && component.kind === "room" && finiteOr(component.health, 1) > 0)
      : ROGUE_TRADER_SPACECRAFT_ROOMS;
  }

  function findSpacecraftByIdInWorld(world, id) {
    const numericId = Math.max(1, Math.floor(finiteOr(id, 0)));
    const spacecrafts = world && Array.isArray(world.spacecrafts) ? world.spacecrafts : [];
    return spacecrafts.find((craft) => craft && Math.floor(finiteOr(craft.id, 0)) === numericId) || null;
  }

  function spacecraftDoorContainsLocal(craft, localX, localY, padding) {
    const door = spacecraftDoor(craft);
    const pad = Math.max(0, finiteOr(padding, 0));
    const halfHeight = finiteOr(door.height, 120) * 0.5 + pad;
    const doorX = finiteOr(door.x, -finiteOr(craft && craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
    const depth = Math.max(60, finiteOr(door.depth, 100));
    return (
      Math.abs(localY - finiteOr(door.y, 0)) <= halfHeight &&
      localX >= doorX - 74 - pad &&
      localX <= doorX + depth + pad
    );
  }

  function spacecraftFloorForX(craft, localX, preferredY) {
    let best = null;
    let bestDelta = Infinity;
    for (const room of spacecraftRooms(craft)) {
      const inset = Math.max(10, PLAYER_RADIUS * 0.24);
      const minX = finiteOr(room.x, 0) - finiteOr(room.w, 40) * 0.5 + inset;
      const maxX = finiteOr(room.x, 0) + finiteOr(room.w, 40) * 0.5 - inset;
      if (localX < minX || localX > maxX) {
        continue;
      }
      const floorY = finiteOr(room.y, 0) + finiteOr(room.h, 40) * 0.5 - Math.max(8, finiteOr(room.floorInset, 24));
      const centerY = floorY - PLAYER_FOOT_OFFSET;
      const delta = Math.abs(centerY - finiteOr(preferredY, centerY));
      if (delta < bestDelta) {
        best = { room, floorY, centerY, minX, maxX };
        bestDelta = delta;
      }
    }
    if (!best) {
      const airlock = spacecraftRooms(craft).find((room) => room.id === "airlock");
      const door = spacecraftDoor(craft);
      if (airlock) {
        const doorX = finiteOr(door.x, -finiteOr(craft && craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
        const minX = doorX - 82;
        const maxX = finiteOr(airlock.x, 0) + finiteOr(airlock.w, 40) * 0.5 - Math.max(10, PLAYER_RADIUS * 0.24);
        const floorY = finiteOr(airlock.y, 0) + finiteOr(airlock.h, 40) * 0.5 - Math.max(8, finiteOr(airlock.floorInset, 24));
        const centerY = floorY - PLAYER_FOOT_OFFSET;
        if (
          localX >= minX &&
          localX <= maxX &&
          Math.abs(finiteOr(preferredY, centerY) - finiteOr(door.y, centerY)) <= finiteOr(door.height, 180) * 0.58
        ) {
          return { room: airlock, floorY, centerY, minX, maxX };
        }
      }
    }
    return best;
  }

  function enterPlayerSpacecraftInterior(player, craft, local) {
    const door = spacecraftDoor(craft);
    const entryX = finiteOr(local && local.x, finiteOr(door.x, -ROGUE_TRADER_SPACECRAFT.width * 0.5) + finiteOr(door.depth, 148) * 0.5);
    const floor = spacecraftFloorForX(craft, entryX, finiteOr(local && local.y, door.y));
    player.landed = null;
    player.spacecraftInterior = {
      spacecraftId: craft.id,
      localX: entryX,
      localY: floor ? floor.centerY : finiteOr(door.y, 0),
      walkSpeed: 0,
      forceExit: false,
      forceExitSpeed: 0,
      onFloor: true
    };
    player.vx = 0;
    player.vy = 0;
    player.cameraRoll = 0;
    return true;
  }

  function leavePlayerSpacecraftInterior(player, craft, options) {
    const settings = options || {};
    const local = player.spacecraftInterior || { localX: 0, localY: 0 };
    const door = spacecraftDoor(craft);
    const exitLocalX = finiteOr(settings.localX, finiteOr(door.x, -ROGUE_TRADER_SPACECRAFT.width * 0.5) - 74);
    const exitLocalY = finiteOr(settings.localY, local.localY);
    const world = spacecraftLocalToWorld(craft, exitLocalX, exitLocalY);
    const outward = spacecraftLocalToWorld(craft, exitLocalX - 1, exitLocalY);
    const dir = normalize(outward.x - world.x, outward.y - world.y);
    player.spacecraftInterior = null;
    player.x = world.x;
    player.y = world.y;
    player.vx = dir.x * finiteOr(settings.speed, 190) + finiteOr(craft.vx, 0);
    player.vy = dir.y * finiteOr(settings.speed, 190) + finiteOr(craft.vy, 0);
    player.cameraRoll = 0;
    return true;
  }

  function requestPlayerSpacecraftExit(player, craft, options) {
    if (!player || !craft || !player.spacecraftInterior || player.spacecraftInterior.spacecraftId !== craft.id) {
      return false;
    }
    const settings = options || {};
    player.spacecraftInterior.forceExit = true;
    player.spacecraftInterior.forceExitSpeed = Math.max(156, finiteOr(settings.speed, 210));
    return true;
  }

  function forcePlayersOutOfSpacecraft(state, craft, options) {
    if (!state || !state.players || !craft) {
      return 0;
    }
    let forced = 0;
    for (const player of Object.values(state.players)) {
      if (requestPlayerSpacecraftExit(player, craft, options)) {
        forced += 1;
      }
    }
    return forced;
  }

  function updatePlayerSpacecraftEntry(state, player) {
    const world = state && state.world;
    if (!world || !player || player.spacecraftInterior || player.landed || player.health <= 0) {
      return false;
    }
    for (const craft of world.spacecrafts || []) {
      const local = spacecraftWorldToLocal(craft, player.x, player.y);
      const door = spacecraftDoor(craft);
      const doorX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
      const thresholdX = doorX + finiteOr(door.threshold, 40);
      const floor = spacecraftFloorForX(craft, local.x, local.y);
      if (
        local.x >= thresholdX - 30 &&
        local.x <= thresholdX + 74 &&
        spacecraftDoorContainsLocal(craft, local.x, local.y, 0) &&
        floor
      ) {
        return enterPlayerSpacecraftInterior(player, craft, local);
      }
    }
    return false;
  }

  function updateSpacecraftInteriorPlayer(state, player, input, dt) {
    const world = state && state.world;
    const craft = findSpacecraftByIdInWorld(world, player && player.spacecraftInterior && player.spacecraftInterior.spacecraftId);
    if (!world || !player || !craft) {
      if (player) {
        player.spacecraftInterior = null;
      }
      return false;
    }

    const interior = player.spacecraftInterior;
    let localX = finiteOr(interior.localX, 0);
    let localY = finiteOr(interior.localY, 0);
    let inputX = 0;
    const forcedExit = Boolean(interior.forceExit);
    if (forcedExit) {
      inputX = -1;
    } else if (!(input.buttons.hold || input.toolMode === "hold")) {
      if (input.buttons.left) inputX -= 1;
      if (input.buttons.right) inputX += 1;
    }
    const floor = spacecraftFloorForX(craft, localX, localY);
    if (!floor) {
      leavePlayerSpacecraftInterior(player, craft, { localX, localY, speed: 230 });
      return true;
    }

    localY = floor.centerY;
    const walkDirection = inputX < 0 ? -1 : inputX > 0 ? 1 : 0;
    const forcedExitSpeed = Math.max(156, finiteOr(interior.forceExitSpeed, 210));
    const walkSpeed = walkDirection ? (forcedExit ? forcedExitSpeed : 156) : 0;
    if (walkDirection) {
      const nextX = localX + walkDirection * walkSpeed * dt;
      const nextFloor = spacecraftFloorForX(craft, nextX, localY);
      if (nextFloor) {
        localX = clamp(nextX, nextFloor.minX, nextFloor.maxX);
        localY = nextFloor.centerY;
        player.walkCycle = finiteOr(player.walkCycle, 0) + (2.2 + walkSpeed * 0.038) * dt;
      } else {
        localX = clamp(localX, floor.minX, floor.maxX);
      }
    }

    const door = spacecraftDoor(craft);
    const doorX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
    if (spacecraftDoorContainsLocal(craft, localX, localY, -8) && localX < doorX - 48) {
      leavePlayerSpacecraftInterior(player, craft, { localX, localY, speed: forcedExit ? forcedExitSpeed : 210 });
      return true;
    }

    interior.localX = localX;
    interior.localY = localY;
    interior.walkSpeed = walkSpeed;
    interior.forceExit = forcedExit;
    interior.forceExitSpeed = forcedExit ? forcedExitSpeed : 0;
    interior.onFloor = true;
    const worldPosition = spacecraftLocalToWorld(craft, localX, localY);
    player.x = worldPosition.x;
    player.y = worldPosition.y;
    player.vx = finiteOr(craft.vx, 0) + walkDirection * walkSpeed;
    player.vy = finiteOr(craft.vy, 0);
    player.landed = null;
    player.cameraRoll = 0;
    player.moving = Boolean(walkDirection);
    player.crouching = false;
    return true;
  }

  function spacecraftComponentHitRadius(component) {
    if (!component) {
      return 32;
    }
    if (component.kind === "turret") {
      return Math.max(16, finiteOr(component.radius, 28));
    }
    return Math.max(22, Math.hypot(finiteOr(component.w, 40), finiteOr(component.h, 40)) * 0.34);
  }

  function updateSpacecraftWorldFields(craft) {
    if (!craft) {
      return;
    }
    for (const component of craft.components || []) {
      const world = spacecraftLocalToWorld(craft, component.x, component.y);
      component.worldX = world.x;
      component.worldY = world.y;
      component.hitRadius = spacecraftComponentHitRadius(component);
    }
    for (const npc of craft.npcs || []) {
      const world = spacecraftLocalToWorld(craft, npc.x, npc.y);
      npc.worldX = world.x;
      npc.worldY = world.y;
    }
  }

  function liveSpacecraftComponents(craft) {
    return (craft && Array.isArray(craft.components) ? craft.components : []).filter((component) => component && finiteOr(component.health, 0) > 0);
  }

  function spacecraftHasLiveKind(craft, kind) {
    return liveSpacecraftComponents(craft).some((component) => component.kind === kind);
  }

  function nearestSpacecraftComponentTarget(world, x, y, maxRange) {
    let best = null;
    let bestScore = Infinity;
    const range = Math.max(1, finiteOr(maxRange, 1800));
    for (const craft of world && world.spacecrafts || []) {
      updateSpacecraftWorldFields(craft);
      for (const component of liveSpacecraftComponents(craft)) {
        if (component.kind === "room" && component.id !== "airlock") {
          continue;
        }
        const distance = Math.hypot(component.worldX - x, component.worldY - y);
        if (distance > range + component.hitRadius) {
          continue;
        }
        const score = distance - (component.kind === "generator" || component.kind === "turret" ? 90 : 0);
        if (score < bestScore) {
          best = { craft, component };
          bestScore = score;
        }
      }
    }
    if (!best) {
      return null;
    }
    return {
      id: "spacecraft:" + best.craft.id + ":" + best.component.id,
      spacecraftTarget: true,
      spacecraftId: best.craft.id,
      spacecraftComponentId: best.component.id,
      x: best.component.worldX,
      y: best.component.worldY,
      vx: finiteOr(best.craft.vx, 0),
      vy: finiteOr(best.craft.vy, 0),
      radius: best.component.hitRadius,
      health: best.component.health,
      maxHealth: best.component.maxHealth
    };
  }

  function spacecraftComponentTargets(world) {
    const targets = [];
    for (const craft of world && world.spacecrafts || []) {
      updateSpacecraftWorldFields(craft);
      for (const component of liveSpacecraftComponents(craft)) {
        if (component.kind === "room" && component.id !== "airlock") {
          continue;
        }
        targets.push({
          id: "spacecraft:" + craft.id + ":" + component.id,
          spacecraftTarget: true,
          spacecraftId: craft.id,
          spacecraftComponentId: component.id,
          x: component.worldX,
          y: component.worldY,
          vx: finiteOr(craft.vx, 0),
          vy: finiteOr(craft.vy, 0),
          radius: component.hitRadius,
          health: component.health,
          maxHealth: component.maxHealth
        });
      }
    }
    return targets;
  }

  function damageSpacecraftComponent(state, craft, component, damage, cause) {
    if (!state || !craft || !component || finiteOr(component.health, 0) <= 0) {
      return false;
    }
    component.health = clamp(finiteOr(component.health, component.maxHealth) - Math.max(0, finiteOr(damage, 0)), 0, finiteOr(component.maxHealth, 1));
    component.flash = Math.max(finiteOr(component.flash, 0), 0.34);
    if (component.health <= 0) {
      component.disabledTimer = Math.max(finiteOr(component.disabledTimer, 0), 1.2);
    }
    state.events.push({
      type: "spacecraft.componentHit",
      spacecraftId: craft.id,
      componentId: component.id,
      damage: Math.max(0, finiteOr(damage, 0)),
      cause: cause || "mob",
      x: finiteOr(component.worldX, craft.x),
      y: finiteOr(component.worldY, craft.y),
      tick: state.tick
    });
    return component.health <= 0;
  }

  function damageSpacecraftTarget(state, target, damage, cause) {
    if (!target || !target.spacecraftTarget) {
      return false;
    }
    const craft = findSpacecraftByIdInWorld(state && state.world, target.spacecraftId);
    const component = craft && (craft.components || []).find((candidate) => candidate && candidate.id === target.spacecraftComponentId);
    return damageSpacecraftComponent(state, craft, component, damage, cause);
  }

  function nearestSpacecraftComponentOnSegment(world, ax, ay, bx, by, radius) {
    let best = null;
    let bestDistance = Infinity;
    for (const craft of world && world.spacecrafts || []) {
      updateSpacecraftWorldFields(craft);
      for (const component of liveSpacecraftComponents(craft)) {
        if (component.kind === "room" && component.id !== "airlock") {
          continue;
        }
        const hitRadius = spacecraftComponentHitRadius(component) + Math.max(0, finiteOr(radius, 0));
        const distance = distanceToSegment(component.worldX, component.worldY, ax, ay, bx, by);
        if (distance > hitRadius) {
          continue;
        }
        const fromStart = Math.hypot(component.worldX - ax, component.worldY - ay);
        if (fromStart < bestDistance) {
          best = { craft, component };
          bestDistance = fromStart;
        }
      }
    }
    return best;
  }

  function fireSpacecraftDefenseProjectile(state, craft, originX, originY, target, options) {
    if (!state || !state.world || !target) {
      return 0;
    }
    const settings = options || {};
    const speed = finiteOr(settings.speed, TURRET_LASER_SPEED);
    const leadTime = clamp(Math.hypot(target.x - originX, target.y - originY) / speed, 0, 0.9);
    const aim = normalize(
      target.x + finiteOr(target.vx, 0) * leadTime * 0.45 - originX,
      target.y + finiteOr(target.vy, 0) * leadTime * 0.45 - originY
    );
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: originX + aim.x * finiteOr(settings.muzzleDistance, 36),
      y: originY + aim.y * finiteOr(settings.muzzleDistance, 36),
      vx: aim.x * speed + finiteOr(craft.vx, 0) * 0.12,
      vy: aim.y * speed + finiteOr(craft.vy, 0) * 0.12,
      radius: finiteOr(settings.radius, 4),
      length: finiteOr(settings.length, 42),
      color: settings.color || { r: 255, g: 115, b: 173 },
      life: finiteOr(settings.life, 1.15),
      maxLife: finiteOr(settings.life, 1.15),
      damage: finiteOr(settings.damage, TURRET_LASER_DAMAGE),
      knockback: finiteOr(settings.knockback, TURRET_LASER_KNOCKBACK),
      cause: settings.weaponLabel || "ship turret",
      sourceStructureId: "spacecraft:" + craft.id + ":" + String(settings.sourceId || "weapon"),
      piercesMobs: Boolean(settings.piercesMobs)
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = id + 1;
    state.events.push({ type: "spacecraft.shot", spacecraftId: craft.id, projectileId: projectile.id, weapon: settings.weaponLabel || "ship turret", tick: state.tick });
    return Math.atan2(aim.y, aim.x);
  }

  function findSpacecraftDefenseTarget(world, originX, originY, range) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || finiteOr(mob.health, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - originX, mob.y - originY);
      if (distance > range || distance >= bestDistance) {
        continue;
      }
      best = mob;
      bestDistance = distance;
    }
    return best;
  }

  function findTraderSniperTarget(world, craft, originX, originY, range) {
    const door = spacecraftDoor(craft);
    const doorX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
    const doorSideLimit = doorX + finiteOr(door.depth, 140) + 240;
    let best = null;
    let bestScore = Infinity;
    let fallback = null;
    let fallbackDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || finiteOr(mob.health, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - originX, mob.y - originY);
      if (distance > range) {
        continue;
      }
      if (distance < fallbackDistance) {
        fallback = mob;
        fallbackDistance = distance;
      }
      const local = spacecraftWorldToLocal(craft, mob.x, mob.y);
      if (local.x > doorSideLimit) {
        continue;
      }
      const score = distance + Math.max(0, local.x - doorX) * 1.4;
      if (score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }
    return best || fallback;
  }

  function updateSpacecraftTurrets(state, craft, dt) {
    const powered = spacecraftHasLiveKind(craft, "generator") || spacecraftHasLiveKind(craft, "battery");
    for (const component of craft.components || []) {
      component.flash = Math.max(0, finiteOr(component.flash, 0) - dt);
      component.disabledTimer = Math.max(0, finiteOr(component.disabledTimer, 0) - dt);
      if (component.kind !== "turret") {
        continue;
      }
      component.shootCooldown = Math.max(0, finiteOr(component.shootCooldown, 0) - dt);
      if (finiteOr(component.health, 0) <= 0 || component.disabledTimer > 0 || !powered) {
        continue;
      }
      const target = findSpacecraftDefenseTarget(state.world, component.worldX, component.worldY, 760);
      if (target) {
        const targetAngle = Math.atan2(target.y - component.worldY, target.x - component.worldX);
        component.aimAngle = finiteOr(component.aimAngle, component.angle) + clamp(shortestAngleDelta(finiteOr(component.aimAngle, component.angle), targetAngle), -4.4 * dt, 4.4 * dt);
        if (component.shootCooldown <= 0) {
          fireSpacecraftDefenseProjectile(state, craft, component.worldX, component.worldY, target, {
            damage: 26,
            length: 46,
            sourceId: component.id,
            weaponLabel: "ship turret"
          });
          component.shootCooldown = 1.9;
          component.flash = 0.2;
        }
      } else {
        component.aimAngle = finiteOr(component.aimAngle, component.angle) + clamp(shortestAngleDelta(finiteOr(component.aimAngle, component.angle), finiteOr(component.angle, 0) + finiteOr(craft.rotation, 0)), -2.2 * dt, 2.2 * dt);
      }
    }
  }

  function updateSpacecraftNpc(state, craft, npc, dt) {
    const door = spacecraftDoor(craft);
    const perchX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5) - 28;
    const perchFloor = spacecraftFloorForX(craft, perchX, finiteOr(door.y, npc.y));
    const perchY = perchFloor ? perchFloor.floorY - 48 : finiteOr(door.y, npc.y);
    const perchWorld = spacecraftLocalToWorld(craft, perchX, perchY);
    const nearbyTarget = findTraderSniperTarget(state.world, craft, perchWorld.x, perchWorld.y, 1780);

    npc.combatTarget = Boolean(nearbyTarget);
    npc.crouching = Boolean(nearbyTarget);
    if (nearbyTarget) {
      npc.targetX = perchX;
      npc.targetY = perchY;
    } else if (Math.hypot(npc.x - npc.targetX, npc.y - npc.targetY) < 12) {
      const rooms = spacecraftRooms(craft);
      const room = rooms.length ? rooms[npc.wanderIndex % rooms.length] : null;
      if (room) {
        const seed = spacecraftStringSeed(npc.id) + craft.id * 17 + npc.wanderIndex * 31;
        npc.targetX = finiteOr(room.x, 0) + (spacecraftHashUnit(seed) - 0.5) * finiteOr(room.w, 80) * 0.62;
        const floor = spacecraftFloorForX(craft, npc.targetX, npc.y);
        npc.targetY = floor ? floor.floorY - 42 : finiteOr(room.y, 0) + finiteOr(room.h, 80) * 0.32;
        npc.wanderIndex += 1;
      }
    }

    const dx = npc.targetX - npc.x;
    const dy = npc.targetY - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const stepDistance = Math.min(dist, Math.max(20, finiteOr(npc.speed, 70)) * dt);
      npc.x += dx / dist * stepDistance;
      npc.y += dy / dist * stepDistance;
      npc.walkCycle += (2.3 + Math.max(20, finiteOr(npc.speed, 70)) * 0.035) * dt;
      npc.aimAngle = Math.atan2(dy, dx);
    }

    const worldPosition = spacecraftLocalToWorld(craft, npc.x, npc.y);
    npc.worldX = worldPosition.x;
    npc.worldY = worldPosition.y;
    npc.sniperCooldown = Math.max(0, finiteOr(npc.sniperCooldown, 0) - dt);
    if (nearbyTarget) {
      npc.aimAngle = Math.atan2(nearbyTarget.y - npc.worldY, nearbyTarget.x - npc.worldX) - finiteOr(craft.rotation, 0);
    }
    if (nearbyTarget && npc.sniperCooldown <= 0) {
      const shotAngle = fireSpacecraftDefenseProjectile(state, craft, npc.worldX, npc.worldY, nearbyTarget, {
        speed: 1340,
        damage: 42,
        length: 96,
        radius: 4,
        life: 2.35,
        knockback: 320,
        color: { r: 255, g: 213, b: 122 },
        weaponLabel: "trader sniper",
        sourceId: npc.id,
        sparkRadius: 20,
        piercesMobs: true
      });
      npc.aimAngle = shotAngle - finiteOr(craft.rotation, 0);
      npc.sniperShotIndex += 1;
      npc.sniperCooldown = 2.1 + spacecraftHashUnit(spacecraftStringSeed(npc.id) + npc.sniperShotIndex * 13) * 1.1;
    }
  }

  function updateSpacecrafts(state, dt) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.spacecrafts)) {
      return;
    }
    for (const craft of world.spacecrafts) {
      updateSpacecraftWorldFields(craft);
      for (const npc of craft.npcs || []) {
        updateSpacecraftNpc(state, craft, npc, dt);
      }
      updateSpacecraftWorldFields(craft);
      updateSpacecraftTurrets(state, craft, dt);
      updateSpacecraftWorldFields(craft);
    }
  }

  function activeParticleStormParticles(world) {
    return (world && Array.isArray(world.particles) ? world.particles : []).filter((particle) => {
      return particle && particle.randomEventId === PARTICLE_STORM_EVENT_ID;
    });
  }

  function stormParticleColor(seedHolder) {
    const hue = randomRange(seedHolder, 0, 1) < 0.65 ? randomRange(seedHolder, 182, 215) : randomRange(seedHolder, 294, 334);
    return hslToRgb(hue, randomRange(seedHolder, 0.72, 0.94), randomRange(seedHolder, 0.54, 0.72));
  }

  function activeMeteorShowerParticles(world) {
    return (world && Array.isArray(world.particles) ? world.particles : []).filter((particle) => {
      return particle && particle.randomEventId === METEOR_SHOWER_EVENT_ID;
    });
  }

  function meteorBodyColor(seedHolder) {
    const palettes = [
      { r: 124, g: 118, b: 110 },
      { r: 164, g: 143, b: 116 },
      { r: 94, g: 104, b: 112 },
      { r: 142, g: 114, b: 91 },
      { r: 186, g: 154, b: 111 }
    ];
    return cloneColor(palettes[Math.floor(randomRange(seedHolder, 0, palettes.length))] || palettes[0]);
  }

  function randomMeteorMass(seedHolder, meteorIndex) {
    if ((Math.max(0, Math.floor(finiteOr(meteorIndex, 0))) + 3) % 7 === 0) {
      return randomRange(seedHolder, 50, 96);
    }
    const roll = randomRange(seedHolder, 0, 1);
    if (roll < 0.7) {
      return randomRange(seedHolder, 10, 34);
    }
    if (roll < 0.9) {
      return randomRange(seedHolder, 34, 50);
    }
    return randomRange(seedHolder, 50, 96);
  }

  function ensureParticleStormState(state, active) {
    if (!state || !state.world || !active) {
      return false;
    }
    if (
      Number.isFinite(Number(active.x)) &&
      Number.isFinite(Number(active.y)) &&
      Number.isFinite(Number(active.radius)) &&
      Number.isFinite(Number(active.windAngle))
    ) {
      active.started = true;
      active.title = active.title || "Particle storm";
      active.maxParticles = Math.max(8, finiteOr(active.maxParticles, PARTICLE_STORM_SETTINGS.maxActiveParticles));
      active.spawnTimer = finiteOr(active.spawnTimer, 0);
      active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0));
      return true;
    }
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const region = chooseParticleStormRegion(state, seedHolder);
    Object.assign(active, {
      title: "Particle storm",
      x: region.x,
      y: region.y,
      radius: region.radius,
      windAngle: region.windAngle,
      phase: region.phase,
      maxParticles: region.maxParticles,
      spawnTimer: 0,
      particlesSpawned: 0,
      started: true
    });
    state.seed = seedHolder.seed >>> 0;
    return true;
  }

  function ensureMeteorShowerState(state, active) {
    if (!state || !state.world || !active) {
      return false;
    }
    if (
      Number.isFinite(Number(active.x)) &&
      Number.isFinite(Number(active.y)) &&
      Number.isFinite(Number(active.radius)) &&
      Number.isFinite(Number(active.windAngle))
    ) {
      active.started = true;
      active.title = active.title || "Meteor shower";
      active.maxParticles = Math.max(4, finiteOr(active.maxParticles, METEOR_SHOWER_SETTINGS.maxActiveParticles));
      active.spawnTimer = finiteOr(active.spawnTimer, 0);
      active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0));
      return true;
    }
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const region = chooseParticleStormRegion(state, seedHolder);
    Object.assign(active, {
      title: "Meteor shower",
      x: region.x,
      y: region.y,
      radius: randomRange(seedHolder, METEOR_SHOWER_SETTINGS.radiusMin, METEOR_SHOWER_SETTINGS.radiusMax),
      windAngle: region.windAngle,
      phase: region.phase,
      maxParticles: METEOR_SHOWER_SETTINGS.maxActiveParticles,
      spawnTimer: 0,
      particlesSpawned: 0,
      started: true
    });
    state.seed = seedHolder.seed >>> 0;
    return true;
  }

  function createParticleStormParticle(state, active, seedHolder) {
    const world = state && state.world;
    if (!world || !active) {
      return null;
    }
    const radius = Math.max(120, finiteOr(active.radius, PARTICLE_STORM_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const crossX = -windY;
    const crossY = windX;
    const edge = randomRange(seedHolder, radius * 0.72, radius * 1.08);
    const sweep = randomRange(seedHolder, -radius * 0.9, radius * 0.9);
    const jitter = randomRange(seedHolder, -radius * 0.12, radius * 0.2);
    const x = finiteOr(active.x, 0) - windX * edge + crossX * sweep + windX * jitter;
    const y = finiteOr(active.y, 0) - windY * edge + crossY * sweep + windY * jitter;
    const roll = randomRange(seedHolder, 0, 1);
    const mass = roll < 0.78 ? 1 : roll < 0.95 ? 2 : 3;
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const particle = normalizeParticle({
      id,
      x,
      y,
      mass,
      color: stormParticleColor(seedHolder),
      spawnAge: 0,
      pulse: randomRange(seedHolder, 0.8, 1.25),
      randomEventId: PARTICLE_STORM_EVENT_ID,
      randomEventRegionX: finiteOr(active.x, 0),
      randomEventRegionY: finiteOr(active.y, 0)
    }, id, seedHolder);
    const speed = randomRange(seedHolder, 96, 178);
    particle.vx = windX * speed + crossX * randomRange(seedHolder, -62, 62) + randomRange(seedHolder, -18, 18);
    particle.vy = windY * speed + crossY * randomRange(seedHolder, -62, 62) + randomRange(seedHolder, -18, 18);
    world.nextParticleId = Math.max(id + 1, Math.floor(finiteOr(world.nextParticleId, 1)) + 1);
    return particle;
  }

  function createMeteorShowerParticle(state, active, seedHolder, meteorIndex) {
    const world = state && state.world;
    if (!world || !active) {
      return null;
    }
    const radius = Math.max(120, finiteOr(active.radius, METEOR_SHOWER_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const crossX = -windY;
    const crossY = windX;
    const edge = randomRange(seedHolder, radius * 0.78, radius * 1.12);
    const sweep = randomRange(seedHolder, -radius * 0.95, radius * 0.95);
    const jitter = randomRange(seedHolder, -radius * 0.08, radius * 0.26);
    const x = finiteOr(active.x, 0) - windX * edge + crossX * sweep + windX * jitter;
    const y = finiteOr(active.y, 0) - windY * edge + crossY * sweep + windY * jitter;
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const particle = normalizeParticle({
      id,
      x,
      y,
      mass: randomMeteorMass(seedHolder, meteorIndex),
      color: meteorBodyColor(seedHolder),
      spawnAge: 0,
      pulse: randomRange(seedHolder, 0.82, 1.16),
      randomEventId: METEOR_SHOWER_EVENT_ID,
      randomEventRegionX: finiteOr(active.x, 0),
      randomEventRegionY: finiteOr(active.y, 0)
    }, id, seedHolder);
    const speed = particle.tier && particle.tier.name === "boulder" ? randomRange(seedHolder, 760, 980) : randomRange(seedHolder, 820, 1120);
    particle.vx = windX * speed + crossX * randomRange(seedHolder, -92, 92) + randomRange(seedHolder, -28, 28);
    particle.vy = windY * speed + crossY * randomRange(seedHolder, -92, 92) + randomRange(seedHolder, -28, 28);
    world.nextParticleId = Math.max(id + 1, Math.floor(finiteOr(world.nextParticleId, 1)) + 1);
    return particle;
  }

  function spawnParticleStormParticles(state, active, count) {
    const world = state && state.world;
    if (!world || !active) {
      return 0;
    }
    const maxParticles = Math.max(8, finiteOr(active.maxParticles, PARTICLE_STORM_SETTINGS.maxActiveParticles));
    const available = Math.max(0, maxParticles - activeParticleStormParticles(world).length);
    const spawnCount = Math.min(Math.max(0, Math.floor(finiteOr(count, 0))), available);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    for (let i = 0; i < spawnCount; i += 1) {
      const particle = createParticleStormParticle(state, active, seedHolder);
      if (particle) {
        world.particles.push(particle);
      }
    }
    state.seed = seedHolder.seed >>> 0;
    active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0)) + spawnCount;
    return spawnCount;
  }

  function spawnMeteorShowerParticles(state, active, count) {
    const world = state && state.world;
    if (!world || !active) {
      return 0;
    }
    const maxParticles = Math.max(4, finiteOr(active.maxParticles, METEOR_SHOWER_SETTINGS.maxActiveParticles));
    const available = Math.max(0, maxParticles - activeMeteorShowerParticles(world).length);
    const spawnCount = Math.min(Math.max(0, Math.floor(finiteOr(count, 0))), available);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const spawnedBefore = Math.max(0, Math.floor(finiteOr(active.particlesSpawned, 0)));
    for (let i = 0; i < spawnCount; i += 1) {
      const particle = createMeteorShowerParticle(state, active, seedHolder, spawnedBefore + i);
      if (particle) {
        world.particles.push(particle);
      }
    }
    state.seed = seedHolder.seed >>> 0;
    active.particlesSpawned = Math.max(0, finiteOr(active.particlesSpawned, 0)) + spawnCount;
    return spawnCount;
  }

  function startParticleStorm(state, active) {
    if (!ensureParticleStormState(state, active)) {
      return;
    }
    spawnParticleStormParticles(state, active, PARTICLE_STORM_SETTINGS.initialCount);
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.started", id: PARTICLE_STORM_EVENT_ID, title: "Particle storm", tick: state.tick });
    }
  }

  function startMeteorShower(state, active) {
    if (!ensureMeteorShowerState(state, active)) {
      return;
    }
    spawnMeteorShowerParticles(state, active, METEOR_SHOWER_SETTINGS.initialCount);
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.started", id: METEOR_SHOWER_EVENT_ID, title: "Meteor shower", tick: state.tick });
    }
  }

  function updateParticleStorm(state, active, dt) {
    const world = state && state.world;
    if (!world || !ensureParticleStormState(state, active)) {
      return;
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    active.spawnTimer = finiteOr(active.spawnTimer, 0) - seconds;
    while (active.spawnTimer <= 0) {
      const lateFade = clamp(1 - finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, PARTICLE_STORM_SETTINGS.duration)), 0, 1);
      const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
      const count = lateFade > 0.2 ? Math.floor(randomRange(seedHolder, 2, 5)) : 1;
      state.seed = seedHolder.seed >>> 0;
      spawnParticleStormParticles(state, active, count);
      active.spawnTimer += PARTICLE_STORM_SETTINGS.spawnInterval;
      if (activeParticleStormParticles(world).length >= finiteOr(active.maxParticles, PARTICLE_STORM_SETTINGS.maxActiveParticles)) {
        break;
      }
    }

    const cx = finiteOr(active.x, 0);
    const cy = finiteOr(active.y, 0);
    const radius = Math.max(120, finiteOr(active.radius, PARTICLE_STORM_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const now = finiteOr(state.tick, 0) * TICK_DT;
    const phase = finiteOr(active.phase, 0);

    for (const particle of world.particles || []) {
      if (!particle) {
        continue;
      }
      const dx = particle.x - cx;
      const dy = particle.y - cy;
      const distance = Math.hypot(dx, dy);
      const tagged = particle.randomEventId === PARTICLE_STORM_EVENT_ID;
      if (!tagged && distance > radius) {
        continue;
      }

      const influence = tagged ? 1 : clamp(1 - distance / radius, 0, 1);
      if (influence <= 0) {
        continue;
      }

      const invDistance = distance > 0.001 ? 1 / distance : 0;
      const radialX = distance > 0.001 ? dx * invDistance : windX;
      const radialY = distance > 0.001 ? dy * invDistance : windY;
      const swirlSign = Math.sin(phase + finiteOr(particle.wobble, 0) * 1.7 + now * 1.2) < 0 ? -1 : 1;
      const swirlX = -radialY * swirlSign;
      const swirlY = radialX * swirlSign;
      const gust = 42 + Math.sin(now * 2.1 + finiteOr(particle.wobble, 0) + phase) * 28;
      const flutter = Math.sin(now * 4.7 + finiteOr(particle.textureSeed, 0)) * 38;
      const massScale = particle.tier && particle.tier.solid
        ? 0.14 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)))
        : 1 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)));
      particle.vx += (windX * gust + swirlX * 70 * influence + radialX * flutter) * influence * massScale * seconds;
      particle.vy += (windY * gust + swirlY * 70 * influence + radialY * flutter) * influence * massScale * seconds;

      if (tagged && Math.hypot(particle.vx, particle.vy) < 54) {
        particle.vx += windX * 34 * seconds;
        particle.vy += windY * 34 * seconds;
      }
    }
  }

  function updateMeteorShower(state, active, dt) {
    const world = state && state.world;
    if (!world || !ensureMeteorShowerState(state, active)) {
      return;
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    active.spawnTimer = finiteOr(active.spawnTimer, 0) - seconds;
    while (active.spawnTimer <= 0) {
      const lateFade = clamp(1 - finiteOr(active.elapsed, 0) / Math.max(1, finiteOr(active.duration, METEOR_SHOWER_SETTINGS.duration)), 0, 1);
      const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
      const count = lateFade > 0.24 && randomRange(seedHolder, 0, 1) < 0.72 ? 2 : 1;
      state.seed = seedHolder.seed >>> 0;
      spawnMeteorShowerParticles(state, active, count);
      active.spawnTimer += METEOR_SHOWER_SETTINGS.spawnInterval;
      if (activeMeteorShowerParticles(world).length >= finiteOr(active.maxParticles, METEOR_SHOWER_SETTINGS.maxActiveParticles)) {
        break;
      }
    }

    const cx = finiteOr(active.x, 0);
    const cy = finiteOr(active.y, 0);
    const radius = Math.max(120, finiteOr(active.radius, METEOR_SHOWER_SETTINGS.radiusMin));
    const windAngle = finiteOr(active.windAngle, 0);
    const windX = Math.cos(windAngle);
    const windY = Math.sin(windAngle);
    const now = finiteOr(state.tick, 0) * TICK_DT;
    const phase = finiteOr(active.phase, 0);

    for (const particle of world.particles || []) {
      if (!particle) {
        continue;
      }
      const dx = particle.x - cx;
      const dy = particle.y - cy;
      const distance = Math.hypot(dx, dy);
      const tagged = particle.randomEventId === METEOR_SHOWER_EVENT_ID;
      if (!tagged && distance > radius) {
        continue;
      }

      const influence = tagged ? 1 : clamp(1 - distance / radius, 0, 1);
      if (influence <= 0) {
        continue;
      }

      const invDistance = distance > 0.001 ? 1 / distance : 0;
      const radialX = distance > 0.001 ? dx * invDistance : windX;
      const radialY = distance > 0.001 ? dy * invDistance : windY;
      const crossX = -radialY;
      const crossY = radialX;
      const gust = 68 + Math.sin(now * 1.8 + finiteOr(particle.wobble, 0) + phase) * 22;
      const tumble = Math.sin(now * 3.6 + finiteOr(particle.textureSeed, 0)) * 32;
      const massScale = particle.tier && particle.tier.solid
        ? 0.18 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)))
        : 0.56 / Math.sqrt(Math.max(1, finiteOr(particle.mass, 1)));
      particle.vx += (windX * gust + crossX * tumble + radialX * 18) * influence * massScale * seconds;
      particle.vy += (windY * gust + crossY * tumble + radialY * 18) * influence * massScale * seconds;

      if (tagged && Math.hypot(particle.vx, particle.vy) < 700) {
        particle.vx += windX * 150 * seconds;
        particle.vy += windY * 150 * seconds;
      }
    }
  }

  function finishParticleStorm(state) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return;
    }
    for (const particle of world.particles) {
      if (particle && particle.randomEventId === PARTICLE_STORM_EVENT_ID) {
        delete particle.randomEventId;
        delete particle.randomEventRegionX;
        delete particle.randomEventRegionY;
      }
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.finished", id: PARTICLE_STORM_EVENT_ID, tick: state.tick });
    }
  }

  function finishMeteorShower(state) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return;
    }
    for (const particle of world.particles) {
      if (particle && particle.randomEventId === METEOR_SHOWER_EVENT_ID) {
        delete particle.randomEventId;
        delete particle.randomEventRegionX;
        delete particle.randomEventRegionY;
      }
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.finished", id: METEOR_SHOWER_EVENT_ID, title: "Meteor shower", tick: state.tick });
    }
  }

  registerRandomEventDefinition({
    id: PARTICLE_STORM_EVENT_ID,
    title: "Particle storm",
    duration: PARTICLE_STORM_SETTINGS.duration,
    weight: particleStormWeight,
    canStart: function (state) {
      return activeRandomEventPlayers(state).length > 0;
    },
    start: startParticleStorm,
    update: updateParticleStorm,
    finish: finishParticleStorm
  });

  registerRandomEventDefinition({
    id: METEOR_SHOWER_EVENT_ID,
    title: "Meteor shower",
    duration: METEOR_SHOWER_SETTINGS.duration,
    weight: meteorShowerWeight,
    canStart: function (state) {
      return activeRandomEventPlayers(state).length > 0 && meteorShowerCanStartAfterParticleStorms(state, state && state.world && state.world.randomEvents);
    },
    start: startMeteorShower,
    update: updateMeteorShower,
    finish: finishMeteorShower
  });

  registerRandomEventDefinition({
    id: ROGUE_TRADER_EVENT_ID,
    title: "Rogue Trader",
    duration: ROGUE_TRADER_EVENT_SETTINGS.duration,
    weight: rogueTraderWeight,
    canStart: function (state) {
      const elapsed = Math.max(0, finiteOr(state && state.tick, 0) * TICK_DT);
      return elapsed >= ROGUE_TRADER_EVENT_SETTINGS.earliestSpawnTime && activeRandomEventPlayers(state).length > 0;
    },
    start: startRogueTraderEvent,
    update: updateRogueTraderSpacecraft,
    finish: finishRogueTraderEvent
  });

  function normalizeWorld(source, seedHolder) {
    const world = source && typeof source === "object" ? source : {};
    const gameMode = normalizeGameMode(world.gameMode);
    const sourceTimers = world.mobSpawnTimers && typeof world.mobSpawnTimers === "object" ? world.mobSpawnTimers : {};
    const sourceDefeats = world.mobDefeatsByKind && typeof world.mobDefeatsByKind === "object" ? world.mobDefeatsByKind : {};
    const sourceBossDefeats = world.mobBossDefeatsByKind && typeof world.mobBossDefeatsByKind === "object" ? world.mobBossDefeatsByKind : {};
    const sourceBossProgress = world.mobBossProgressByKind && typeof world.mobBossProgressByKind === "object" ? world.mobBossProgressByKind : {};
    const sourceBossWarnings = world.mobBossWarnings && typeof world.mobBossWarnings === "object" ? world.mobBossWarnings : {};
    const sourceMobIds = world.nextMobIds && typeof world.nextMobIds === "object" ? world.nextMobIds : {};
    const mobSpawnTimers = {};
    const mobDefeatsByKind = {};
    const mobBossDefeatsByKind = {};
    const mobBossProgressByKind = {};
    const mobBossWarnings = {};
    const nextMobIds = {};
    for (const kind of MOB_TIER_ORDER) {
      const warning = sourceBossWarnings[kind] && typeof sourceBossWarnings[kind] === "object" ? sourceBossWarnings[kind] : {};
      mobSpawnTimers[kind] = Math.max(0, finiteOr(sourceTimers[kind], MOB_SPAWN_INTERVALS[kind]));
      mobDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(sourceDefeats[kind], 0)));
      mobBossDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(sourceBossDefeats[kind], 0)));
      if (Object.prototype.hasOwnProperty.call(sourceBossProgress, kind)) {
        mobBossProgressByKind[kind] = clamp(Math.floor(finiteOr(sourceBossProgress[kind], 0)), 0, MOB_BOSS_DEFEATS_TO_UNLOCK);
      } else {
        const regularDefeats = Math.max(0, mobDefeatsByKind[kind] - mobBossDefeatsByKind[kind]);
        mobBossProgressByKind[kind] = clamp(
          regularDefeats - mobBossDefeatsByKind[kind] * MOB_BOSS_DEFEATS_TO_UNLOCK,
          0,
          MOB_BOSS_DEFEATS_TO_UNLOCK
        );
      }
      mobBossWarnings[kind] = {
        active: Boolean(warning.active),
        timer: clamp(finiteOr(warning.timer, 0), 0, MOB_BOSS_WARNING_DURATION),
        lastNoticeSecond: Math.floor(finiteOr(warning.lastNoticeSecond, -1))
      };
      nextMobIds[kind] = Math.max(1, Math.floor(finiteOr(sourceMobIds[kind], 1)));
    }

    const normalized = {
      particles: [],
      techPickups: [],
      healthPickups: [],
      alienoids: [],
      ufos: [],
      rambots: [],
      engineers: [],
      teslas: [],
      rockets: [],
      fighters: [],
      mobBeacons: [],
      rivalProjectiles: Array.isArray(world.rivalProjectiles) ? world.rivalProjectiles.map((entry, index) => normalizeEntity(entry, index + 1, "projectile")) : [],
      structures: Array.isArray(world.structures) ? clone(world.structures) : [],
      spacecrafts: Array.isArray(world.spacecrafts) ? world.spacecrafts.map((entry, index) => normalizeSpacecraftState(entry, index + 1)).filter(Boolean) : [],
      starDust: Array.isArray(world.starDust) ? clone(world.starDust) : [],
      claimedTechPickupIds: [],
      claimedHealthPickupIds: [],
      nextParticleId: Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1))),
      nextTechPickupId: Math.max(1, Math.floor(finiteOr(world.nextTechPickupId, 1))),
      nextHealthPickupId: Math.max(1, Math.floor(finiteOr(world.nextHealthPickupId, 1))),
      nextMobBeaconId: Math.max(1, Math.floor(finiteOr(world.nextMobBeaconId, 1))),
      nextSurvivalCampId: Math.max(1, Math.floor(finiteOr(world.nextSurvivalCampId, 1))),
      nextRivalProjectileId: Math.max(1, Math.floor(finiteOr(world.nextRivalProjectileId, 1))),
      nextStructureId: Math.max(
        1,
        Math.floor(finiteOr(world.nextStructureId, 1)),
        Array.isArray(world.structures)
          ? world.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
          : 1
      ),
      nextSpacecraftId: Math.max(
        1,
        Math.floor(finiteOr(world.nextSpacecraftId, 1)),
        Array.isArray(world.spacecrafts)
          ? world.spacecrafts.reduce((largest, craft) => Math.max(largest, Math.floor(finiteOr(craft && craft.id, 0)) + 1), 1)
          : 1
      ),
      nextMobIds,
      mobSpawnTimers,
      mobWaveTimer: clamp(finiteOr(world.mobWaveTimer, difficultyMobFirstWaveDelay(world)), 0, difficultyMobWaveInterval(world)),
      mobWaveCount: Math.max(0, Math.floor(finiteOr(world.mobWaveCount, 0))),
      mobDefeatsByKind,
      mobBossDefeatsByKind,
      mobBossProgressByKind,
      mobBossWarnings,
      mobSpawnRestTimer: clamp(finiteOr(world.mobSpawnRestTimer, 0), 0, MOB_SPAWN_REST_DURATION),
      mobSpawnRestDrainTimer: clamp(finiteOr(world.mobSpawnRestDrainTimer, 0), 0, MOB_SPAWN_REST_DRAIN_MAX_DURATION),
      mobSpawnRestCooldownTimer: clamp(finiteOr(world.mobSpawnRestCooldownTimer, MOB_SPAWN_REST_COOLDOWN), 0, MOB_SPAWN_REST_COOLDOWN),
      survivalSpawnState: normalizeSurvivalSpawnState(world.survivalSpawnState),
      difficulty: String(world.difficulty || "medium"),
      gameMode,
      randomEvents: normalizeRandomEventState(world.randomEvents)
    };

    normalized.particles = Array.isArray(world.particles)
      ? world.particles.map((entry, index) => normalizeParticle(entry, index + 1, seedHolder))
      : [];
    normalized.ambientParticleSpawning = world.ambientParticleSpawning === true || normalized.particles.length >= 24;
    normalized.techPickups = Array.isArray(world.techPickups)
      ? world.techPickups.map((entry, index) => normalizePickup(entry, index + 1, "tech"))
      : [];
    normalized.healthPickups = Array.isArray(world.healthPickups)
      ? world.healthPickups.map((entry, index) => normalizePickup(entry, index + 1, "health"))
      : [];

    const rivals = Array.isArray(world.alienoids) ? world.alienoids : Array.isArray(world.rivals) ? world.rivals : [];
    normalized.alienoids = rivals.map((entry, index) => normalizeEntity(entry, index + 1, "alienoid"));
    normalized.ufos = Array.isArray(world.ufos) ? world.ufos.map((entry, index) => normalizeEntity(entry, index + 1, "ufo")) : [];
    normalized.rambots = Array.isArray(world.rambots) ? world.rambots.map((entry, index) => normalizeEntity(entry, index + 1, "rambot")) : [];
    normalized.engineers = Array.isArray(world.engineers) ? world.engineers.map((entry, index) => normalizeEntity(entry, index + 1, "engineer")) : [];
    normalized.teslas = Array.isArray(world.teslas) ? world.teslas.map((entry, index) => normalizeEntity(entry, index + 1, "tesla")) : [];
    normalized.rockets = Array.isArray(world.rockets) ? world.rockets.map((entry, index) => normalizeEntity(entry, index + 1, "rocket")) : [];
    normalized.fighters = Array.isArray(world.fighters) ? world.fighters.map((entry, index) => normalizeEntity(entry, index + 1, "fighter")) : [];
    normalized.mobBeacons = Array.isArray(world.mobBeacons)
      ? world.mobBeacons.map((entry, index) => normalizeMobBeacon(entry, index + 1))
      : [];
    if (gameMode === "survival") {
      normalized.mobBeacons = [];
    }

    for (const kind of MOB_TIER_ORDER) {
      const collection = mobCollectionByKind(normalized, kind);
      nextMobIds[kind] = Math.max(
        nextMobIds[kind],
        collection.reduce((largest, mob) => Math.max(largest, mob && mob.kind === kind ? mob.id + 1 : largest), 1)
      );
    }

    normalized.nextParticleId = Math.max(
      normalized.nextParticleId,
      normalized.particles.reduce((largest, body) => Math.max(largest, body.id + 1), 1)
    );
    normalized.nextTechPickupId = Math.max(
      normalized.nextTechPickupId,
      normalized.techPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1)
    );
    normalized.nextHealthPickupId = Math.max(
      normalized.nextHealthPickupId,
      normalized.healthPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1)
    );
    normalized.nextMobBeaconId = Math.max(
      normalized.nextMobBeaconId,
      normalized.mobBeacons.reduce((largest, beacon) => Math.max(largest, finiteOr(beacon && beacon.id, 0) + 1), 1)
    );
    normalized.nextRivalProjectileId = Math.max(
      normalized.nextRivalProjectileId,
      normalized.rivalProjectiles.reduce((largest, projectile) => Math.max(largest, finiteOr(projectile.id, 0) + 1), 1)
    );
    return normalized;
  }

  function createInitialState(snapshot, partyPlayers, options) {
    const payload = snapshot && typeof snapshot === "object" ? snapshot : {};
    const seedText = options && options.seed ? options.seed : payload.playerId || payload.run && payload.run.id || "clusternauts-v2-room";
    const seedHolder = { seed: hashSeed(seedText) };
    const maxPlayers = Math.max(1, Math.floor(finiteOr(options && options.maxPlayers, MAX_PLAYERS)));
    const sourcePlayers = Array.isArray(partyPlayers) ? partyPlayers.slice(0, maxPlayers) : [];
    const players = {};
    const basePlayer = payload.player && typeof payload.player === "object" ? payload.player : null;

    if (!sourcePlayers.length && basePlayer) {
      sourcePlayers.push({ playerId: basePlayer.id || payload.playerId || "host", publicName: basePlayer.name || "Host" });
    }

    sourcePlayers.forEach((entry, index) => {
      const playerId = String(entry && (entry.playerId || entry.id || entry) || "");
      const playerSnapshot = index === 0 && basePlayer
        ? { ...basePlayer, teamId: entry && entry.teamId || basePlayer.teamId || "" }
        : { id: playerId, name: entry && entry.publicName, teamId: entry && entry.teamId || "" };
      if (playerId) {
        players[playerId] = normalizePlayer({ ...playerSnapshot, id: playerId }, playerId, index);
      }
    });

    const gameMode = normalizeGameMode(payload.run && payload.run.gameMode || payload.world && payload.world.gameMode || options && options.gameMode);
    const difficulty = payload.run && payload.run.difficulty || payload.world && payload.world.difficulty || "medium";
    const world = normalizeWorld(payload.world, seedHolder);
    world.difficulty = difficulty;
    world.gameMode = gameMode;
    if (gameMode === "survival") {
      world.mobBeacons = [];
      world.survivalSpawnState = normalizeSurvivalSpawnState(world.survivalSpawnState);
    }
    if (!payload.world || !Number.isFinite(Number(payload.world.mobWaveTimer))) {
      world.mobWaveTimer = difficultyMobFirstWaveDelay({ difficulty });
    }

    return {
      version: VERSION,
      tick: 0,
      seed: seedHolder.seed >>> 0,
      difficulty,
      gameMode,
      players,
      world,
      events: []
    };
  }

  function addPlayer(state, playerInfo, snapshot) {
    if (!state || !playerInfo) {
      return null;
    }
    const playerId = String(playerInfo.playerId || playerInfo.id || "");
    if (!playerId) {
      return null;
    }
    if (!state.players) {
      state.players = {};
    }
    if (!state.players[playerId]) {
      state.players[playerId] = normalizePlayer({ ...(snapshot || {}), id: playerId, name: playerInfo.publicName || playerInfo.name }, playerId, Object.keys(state.players).length);
    }
    if (Object.prototype.hasOwnProperty.call(playerInfo, "teamId")) {
      state.players[playerId].teamId = String(playerInfo.teamId || "").replace(/[^\w.-]/g, "").slice(0, 80);
    }
    return state.players[playerId];
  }

  function setPlayerTeam(state, playerId, teamId) {
    const player = state && state.players && state.players[String(playerId || "")];
    if (!player) {
      return false;
    }
    player.teamId = String(teamId || "").replace(/[^\w.-]/g, "").slice(0, 80);
    return true;
  }

  function bodyTierForName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    return BODY_TIERS.find((tier) => tier.name === normalized) ||
      STELLAR_BRANCH_TIERS.find((tier) => tier.name === normalized) ||
      null;
  }

  function mobKindForName(name) {
    const normalized = String(name || "").trim().toLowerCase().replace(/[-_\s]+/g, "");
    if (normalized === "alien" || normalized === "alienoid") return "alienoid";
    if (normalized === "ufo") return "ufo";
    if (normalized === "rambot") return "rambot";
    if (normalized === "tesla") return "tesla";
    if (normalized === "engineer") return "engineer";
    if (normalized === "satellite") return "satellite";
    if (normalized === "rocket" || normalized === "rocketship") return "rocket";
    if (normalized === "fighter" || normalized === "fightership") return "fighter";
    return "";
  }

  function addTechToPlayer(state, playerId, techKey, amount) {
    const player = state && state.players ? state.players[String(playerId || "")] : null;
    const cleanAmount = Math.max(1, Math.floor(finiteOr(amount, 0)));
    const key = String(techKey || "").trim().toLowerCase();
    if (!player || !cleanAmount || (key !== "all" && !TECH_KEYS.includes(key))) {
      return false;
    }
    if (!player.tech) {
      player.tech = defaultTechInventory();
    }
    if (key === "all") {
      for (const candidate of TECH_KEYS) {
        player.tech[candidate] = Math.max(0, Math.floor(finiteOr(player.tech[candidate], 0))) + cleanAmount;
      }
    } else {
      player.tech[key] = Math.max(0, Math.floor(finiteOr(player.tech[key], 0))) + cleanAmount;
    }
    return true;
  }

  function techKeyForMob(kind) {
    if (kind === "ufo") return "suction";
    if (kind === "rambot") return "plating";
    if (kind === "engineer") return "repair";
    if (kind === "tesla") return "energy";
    if (kind === "satellite") return "target";
    if (kind === "rocket") return "propulsion";
    if (kind === "fighter") return "shield";
    return "weapon";
  }

  function createTechPickup(state, techKey, x, y, vx, vy) {
    const world = state && state.world;
    if (!world) {
      return null;
    }
    const id = Math.max(1, Math.floor(finiteOr(world.nextTechPickupId, 1)));
    const seedBase = (
      finiteOr(state.seed, 1) ^
      Math.imul(id, 2654435761) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(state.tick, 0)) + 1), 2246822519)
    ) >>> 0;
    const angleRoll = seededRange(seedBase, 0, Math.PI * 2);
    const burstRoll = seededRange(angleRoll.seed, 60, 132);
    const angle = angleRoll.value;
    const burst = burstRoll.value;
    const pickup = normalizePickup({
      id,
      key: TECH_KEYS.includes(techKey) ? techKey : "weapon",
      x,
      y,
      vx: finiteOr(vx, 0) * 0.14 + Math.cos(angle) * burst,
      vy: finiteOr(vy, 0) * 0.14 + Math.sin(angle) * burst,
      radius: 15,
      life: TECH_PICKUP_LIFETIME,
      maxLife: TECH_PICKUP_LIFETIME,
      rotation: seededRange(burstRoll.seed, 0, Math.PI * 2).value,
      wobble: seededRange(burstRoll.seed ^ 0x9e3779b9, 0, Math.PI * 2).value
    }, id, "tech");
    world.techPickups.push(pickup);
    world.nextTechPickupId = id + 1;
    return pickup;
  }

  function createHealthPickup(state, x, y, vx, vy) {
    const world = state && state.world;
    if (!world) {
      return null;
    }
    const id = Math.max(1, Math.floor(finiteOr(world.nextHealthPickupId, 1)));
    const seedBase = (
      finiteOr(state.seed, 1) ^
      Math.imul(id, 1597334677) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(state.tick, 0)) + 1), 3812015801)
    ) >>> 0;
    const angleRoll = seededRange(seedBase, 0, Math.PI * 2);
    const burstRoll = seededRange(angleRoll.seed, 70, 145);
    const pickup = normalizePickup({
      id,
      x,
      y,
      vx: finiteOr(vx, 0) * 0.18 + Math.cos(angleRoll.value) * burstRoll.value,
      vy: finiteOr(vy, 0) * 0.18 + Math.sin(angleRoll.value) * burstRoll.value,
      radius: 14,
      heal: HEALTH_PICKUP_HEAL,
      life: HEALTH_PICKUP_LIFETIME,
      maxLife: HEALTH_PICKUP_LIFETIME,
      wobble: seededRange(burstRoll.seed, 0, Math.PI * 2).value
    }, id, "health");
    world.healthPickups.push(pickup);
    world.nextHealthPickupId = id + 1;
    return pickup;
  }

  function spawnBody(state, bodyName, source) {
    const world = state && state.world;
    const tier = bodyTierForName(bodyName);
    if (!world || !tier) {
      return null;
    }
    const sourceState = source && typeof source === "object" ? source : {};
    const mass = Math.max(1, finiteOr(tier.threshold, 1));
    const radius = radiusFromMassForTier(mass, tier);
    const direction = normalize(finiteOr(sourceState.directionX, 1), finiteOr(sourceState.directionY, 0));
    const originRadius = Math.max(1, finiteOr(sourceState.radius, PLAYER_RADIUS));
    const distance = Math.max(180, originRadius + radius + 120);
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const sideOffset = (((id - 1) % 7) - 3) * Math.min(radius * 0.9 + 18, 160);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1) + finiteOr(world.nextParticleId, 1) * 2654435761)) >>> 0 };
    const particle = normalizeParticle({
      id,
      x: finiteOr(sourceState.x, 0) + direction.x * distance - direction.y * sideOffset,
      y: finiteOr(sourceState.y, 0) + direction.y * distance + direction.x * sideOffset,
      vx: 0,
      vy: 0,
      mass,
      radius,
      stellarOutcome: STELLAR_OUTCOME_TIER_NAMES.includes(tier.name) ? tier.name : "",
      stellarGrowthStarted: STELLAR_OUTCOME_TIER_NAMES.includes(tier.name),
      stellarGrowthRate: tier.name === "black hole"
        ? STELLAR_GROWTH_RATE_BLACK_HOLE_THRESHOLD
        : tier.name === "neutron star"
          ? STELLAR_GROWTH_RATE_NEUTRON_THRESHOLD
          : 0,
      color: randomParticleColor(seedHolder),
      spawnAge: 0
    }, world.nextParticleId || 1, seedHolder);
    particle.vx = 0;
    particle.vy = 0;
    world.particles.push(particle);
    world.nextParticleId = Math.max(finiteOr(world.nextParticleId, 1), particle.id + 1);
    return particle;
  }

  function spawnMob(state, mobName, amount, source) {
    const world = state && state.world;
    const kind = mobKindForName(mobName);
    const count = Math.max(1, Math.floor(finiteOr(amount, 1)));
    if (!world || !kind || !world.nextMobIds || !Array.isArray(mobCollectionByKind(world, kind))) {
      return 0;
    }
    const sourceState = source && typeof source === "object" ? source : {};
    const sourceAnchor = {
      x: finiteOr(sourceState.x, 0),
      y: finiteOr(sourceState.y, 0),
      vx: 0,
      vy: 0,
      radius: Math.max(1, finiteOr(sourceState.radius, PLAYER_RADIUS)),
      health: 1
    };
    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    const anchors = players.length ? players : [sourceAnchor];
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1) + finiteOr(state.tick, 0) * 1103515245)) >>> 0 };
    for (let i = 0; i < count; i += 1) {
      spawnMobByKind(world, kind, sourceAnchor, anchors, seedHolder);
    }
    state.seed = seedHolder.seed >>> 0;
    return count;
  }

  function spawnBoss(state, mobName, amount, source) {
    const world = state && state.world;
    const kind = mobKindForName(mobName);
    const count = Math.max(1, Math.floor(finiteOr(amount, 1)));
    if (!world || !kind || !world.nextMobIds || !Array.isArray(mobCollectionByKind(world, kind))) {
      return 0;
    }
    const sourceState = source && typeof source === "object" ? source : {};
    const sourceAnchor = {
      x: finiteOr(sourceState.x, 0),
      y: finiteOr(sourceState.y, 0),
      vx: 0,
      vy: 0,
      radius: Math.max(1, finiteOr(sourceState.radius, PLAYER_RADIUS)),
      health: 1
    };
    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0);
    const anchors = players.length ? players : [sourceAnchor];
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1) + finiteOr(state.tick, 0) * 1103515245)) >>> 0 };
    for (let i = 0; i < count; i += 1) {
      spawnBossByKind(state, kind, sourceAnchor, anchors, seedHolder);
    }
    state.seed = seedHolder.seed >>> 0;
    return count;
  }

  function removePlayer(state, playerId) {
    if (state && state.players) {
      delete state.players[String(playerId || "")];
    }
  }

  function respawnPlayer(state, playerId, snapshot) {
    if (!state || !state.players) {
      return null;
    }
    const id = String(playerId || snapshot && (snapshot.id || snapshot.playerId) || "");
    if (!id) {
      return null;
    }
    const existing = state.players[id] || normalizePlayer(null, id, Object.keys(state.players).length);
    const source = Object.assign({}, existing, snapshot || {}, {
      id,
      playerId: id,
      health: finiteOr(snapshot && snapshot.health, finiteOr(snapshot && snapshot.maxHealth, existing.maxHealth || PLAYER_MAX_HEALTH)),
      energy: finiteOr(snapshot && snapshot.energy, finiteOr(snapshot && snapshot.maxEnergy, existing.maxEnergy || PLAYER_MAX_ENERGY)),
      respawnTimer: 0,
      invulnerableTimer: Math.max(2.2, finiteOr(snapshot && snapshot.invulnerableTimer, 0)),
      hitCooldown: 0,
      toolFireCooldown: 0,
      landed: null,
      toolMode: "idle",
      familiarNetFireHeld: false,
      familiarNetReleaseHeld: false,
      moving: false,
      crouching: false,
      rocketSuitCharge: 0,
      rocketSuitActive: false
    });
    const next = normalizePlayer(source, id, Object.keys(state.players).length);
    next.lastInputSeq = Math.max(existing.lastInputSeq || 0, next.lastInputSeq || 0);
    state.players[id] = next;
    return next;
  }

  function canSpendPlayerEnergy(player, amount) {
    if (hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    return finiteOr(player && player.energy, 0) >= Math.max(0, finiteOr(amount, 0));
  }

  function spendPlayerEnergy(player, amount) {
    const cost = Math.max(0, finiteOr(amount, 0));
    if (!canSpendPlayerEnergy(player, cost)) {
      return false;
    }
    player.energy = Math.max(0, finiteOr(player.energy, 0) - cost);
    return true;
  }

  function gadgetEnergyCost(dt) {
    return SUCTION_ENERGY_DRAIN * Math.max(0, finiteOr(dt, TICK_DT));
  }

  function continuousEnergyActivationCost(cost) {
    return Math.max(PLAYER_CONTINUOUS_ENERGY_ACTIVATION_COST, Math.max(0, finiteOr(cost, 0)));
  }

  function boostEnergyCost(dt) {
    return JETPACK_BOOST_ENERGY_DRAIN * Math.max(0, finiteOr(dt, TICK_DT));
  }

  function normalizeDuelPairKey(a, b) {
    const first = String(a || "");
    const second = String(b || "");
    if (!first || !second || first === second) {
      return "";
    }
    return [first, second].sort().join("|");
  }

  function duelPairSet(options) {
    const source = options && (options.duels || options.activeDuels || options.duelPairs);
    if (source instanceof Set) {
      return source;
    }
    const pairs = new Set();
    if (Array.isArray(source)) {
      for (const entry of source) {
        if (Array.isArray(entry)) {
          const key = normalizeDuelPairKey(entry[0], entry[1]);
          if (key) {
            pairs.add(key);
          }
        } else {
          const text = String(entry || "");
          if (text) {
            pairs.add(text);
          }
        }
      }
    } else if (source && typeof source === "object") {
      for (const [key, active] of Object.entries(source)) {
        if (active) {
          pairs.add(String(key));
        }
      }
    }
    return pairs;
  }

  function playersAreDueling(options, a, b) {
    const key = normalizeDuelPairKey(a, b);
    return Boolean(key && duelPairSet(options).has(key));
  }

  function sharedPublicPvpEnabled(options) {
    return Boolean(options && (options.pvpMode === "shared-public" || options.worldMode === "shared-public"));
  }

  function playerTeamId(state, options, playerId) {
    const id = String(playerId || "");
    if (!id) {
      return "";
    }
    const teamsByPlayerId = options && options.teamsByPlayerId;
    if (teamsByPlayerId instanceof Map) {
      return String(teamsByPlayerId.get(id) || "");
    }
    if (teamsByPlayerId && typeof teamsByPlayerId === "object" && Object.prototype.hasOwnProperty.call(teamsByPlayerId, id)) {
      return String(teamsByPlayerId[id] || "");
    }
    const player = state && state.players && state.players[id];
    return String(player && player.teamId || "");
  }

  function canPlayerOwnedDamagePlayer(state, options, sourcePlayerId, targetPlayerId) {
    const sourceId = String(sourcePlayerId || "");
    const targetId = String(targetPlayerId || "");
    if (!sourceId || !targetId || sourceId === targetId) {
      return false;
    }
    if (sharedPublicPvpEnabled(options)) {
      const sourceTeamId = playerTeamId(state, options, sourceId);
      const targetTeamId = playerTeamId(state, options, targetId);
      return !sourceTeamId || !targetTeamId || sourceTeamId !== targetTeamId;
    }
    return playersAreDueling(options, sourceId, targetId);
  }

  function isGadgetToolMode(mode) {
    return mode === "pull" || mode === "push" || mode === "hold";
  }

  function toolUpgradeLevel(player, toolId, upgradeId) {
    const toolLevels = player && player.toolUpgrades && player.toolUpgrades[toolId] && typeof player.toolUpgrades[toolId] === "object"
      ? player.toolUpgrades[toolId]
      : {};
    return Math.max(0, finiteOr(toolLevels[upgradeId], 0));
  }

  function upgradeBonus(level, bonusScale) {
    const cleanLevel = Math.max(0, finiteOr(level, 0));
    const cleanScale = Math.max(0, finiteOr(bonusScale, 0));
    return cleanScale * (0.28 / Math.log1p(0.5)) * Math.log1p(cleanLevel * 0.5);
  }

  function toolUpgradeFactor(player, toolId, upgradeId) {
    const bonuses = TOOL_UPGRADE_BONUS_SCALES[toolId] || {};
    return 1 + upgradeBonus(toolUpgradeLevel(player, toolId, upgradeId), bonuses[upgradeId] || 0);
  }

  function gadgetSuckFactor(player, input) {
    return toolUpgradeFactor(player, isSuctionToolId(input && input.equippedTool) ? input.equippedTool : DEFAULT_TOOL_ID, "suck");
  }

  function gadgetBlowFactor(player, input) {
    return toolUpgradeFactor(player, isSuctionToolId(input && input.equippedTool) ? input.equippedTool : DEFAULT_TOOL_ID, "blow");
  }

  function gadgetRangeFactor(player, input) {
    return gadgetSuckFactor(player, input);
  }

  function gadgetForceReachForInput(player, input) {
    return GADGET_FORCE_REACH * Math.max(0.1, finiteOr(gadgetRangeFactor(player, input), 1));
  }

  function gadgetHoldReachForInput(player, input) {
    return GADGET_HOLD_REACH * Math.max(0.1, finiteOr(gadgetRangeFactor(player, input), 1));
  }

  function weaponByToolId(player, toolId) {
    const id = String(toolId || "");
    const base = PLAYER_WEAPON_DEFINITIONS[id] || null;
    if (!base || !playerHasTool(player, id)) {
      return null;
    }
    const rangeFactor = toolUpgradeFactor(player, id, "range");
    return {
      ...base,
      damage: base.damage * toolUpgradeFactor(player, id, "damage"),
      life: base.life * rangeFactor
    };
  }

  function sanitizeInput(source, fallbackPlayer, options) {
    const input = source && typeof source === "object" ? source : {};
    const buttons = input.buttons && typeof input.buttons === "object" ? input.buttons : {};
    const fallback = fallbackPlayer && typeof fallbackPlayer === "object" ? fallbackPlayer : {};
    const fallbackAimAngle = finiteOr(fallback.aimAngle, 0);
    const aimAngle = Number.isFinite(Number(input.aimAngle)) ? finiteOr(input.aimAngle, 0) : fallbackAimAngle;
    const fallbackAimLocalAngle = Number.isFinite(Number(fallback.aimLocalAngle))
      ? finiteOr(fallback.aimLocalAngle, 0)
      : aimAngle;
    const validToolModes = ["pull", "push", "hold", "fire", "release", "dismantle", "idle"];
    const fallbackToolMode = validToolModes.includes(fallback.toolMode) ? fallback.toolMode : "idle";
    const toolsDisabled = hasPlayerStatusEffect(fallback, "disabled");
    const equippedTool = String(input.equippedTool || fallback.equippedTool || DEFAULT_TOOL_ID);
    let toolMode = toolsDisabled ? "idle" : (validToolModes.includes(input.toolMode) ? input.toolMode : fallbackToolMode);
    if (isFamiliarNetToolId(equippedTool) && (toolMode === "push" || buttons.push === true)) {
      toolMode = "release";
    }
    if (toolMode === "idle" && isSuctionToolId(equippedTool)) {
      toolMode = buttons.hold === true ? "hold" : buttons.pull === true ? "pull" : buttons.push === true ? "push" : "idle";
    }
    if (!isSuctionToolId(equippedTool) && isGadgetToolMode(toolMode)) {
      toolMode = "idle";
    }
    if (!isSpannerToolId(equippedTool) && toolMode === "dismantle") {
      toolMode = "idle";
    }
    if (!isFamiliarNetToolId(equippedTool) && !isPersonalTetherToolId(equippedTool) && toolMode === "release") {
      toolMode = "idle";
    }
    const requireEnergy = Boolean(options && options.requireEnergy);
    const dt = options && Number.isFinite(Number(options.dt)) ? Math.max(0, finiteOr(options.dt, TICK_DT)) : TICK_DT;
    const committedToolMode = Boolean(
      options &&
      options.allowCommittedToolMode &&
      isSuctionToolId(equippedTool) &&
      isGadgetToolMode(toolMode) &&
      isSuctionToolId(fallback.equippedTool) &&
      fallbackToolMode === toolMode
    );
    if (
      requireEnergy &&
      isSuctionToolId(equippedTool) &&
      isGadgetToolMode(toolMode) &&
      !committedToolMode &&
      !canSpendPlayerEnergy(fallback, continuousEnergyActivationCost(gadgetEnergyCost(dt)))
    ) {
      toolMode = "idle";
    }
    const gadgetButtonsAllowed = !toolsDisabled && isSuctionToolId(equippedTool) && isGadgetToolMode(toolMode);
    const rawLandAction = input.landAction || buttons.landAction || "";
    const familiarCommandSource = input.familiarCommand && typeof input.familiarCommand === "object" ? input.familiarCommand : null;
    const familiarCommand = familiarCommandSource ? {
      x: finiteOr(familiarCommandSource.x, finiteOr(fallback.x, 0)),
      y: finiteOr(familiarCommandSource.y, finiteOr(fallback.y, 0))
    } : null;
    return {
      seq: Math.max(0, Math.floor(finiteOr(input.seq, 0))),
      clientTick: Math.max(0, Math.floor(finiteOr(input.clientTick, 0))),
      aimAngle,
      aimLocalAngle: Number.isFinite(Number(input.aimLocalAngle))
        ? finiteOr(input.aimLocalAngle, 0)
        : fallbackAimLocalAngle,
      equippedTool,
      toolMode,
      familiarCommand,
      landAction: rawLandAction === "takeoff" ? "takeoff" : rawLandAction === "land" ? "land" : "",
      buttons: {
        up: buttons.up === true,
        down: buttons.down === true,
        left: buttons.left === true,
        right: buttons.right === true,
        land: buttons.land === true,
        boost: !toolsDisabled && buttons.boost === true && (!requireEnergy || canSpendPlayerEnergy(fallback, continuousEnergyActivationCost(boostEnergyCost(dt)))),
        pull: gadgetButtonsAllowed && toolMode === "pull",
        push: gadgetButtonsAllowed && toolMode === "push",
        hold: gadgetButtonsAllowed && toolMode === "hold",
        fire: !toolsDisabled && (buttons.fire === true || toolMode === "fire"),
        release: !toolsDisabled && (isFamiliarNetToolId(equippedTool) || isPersonalTetherToolId(equippedTool)) && (buttons.release === true || toolMode === "release"),
        dismantle: !toolsDisabled && isSpannerToolId(equippedTool) && (buttons.dismantle === true || toolMode === "dismantle")
      }
    };
  }

  function aimVector(input) {
    const angle = finiteOr(input && input.aimAngle, 0);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  function bodyPushResponse(body) {
    if (isStarBody(body)) {
      return 0.22;
    }

    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    if (mass < 150) {
      return 1;
    }
    return clamp(Math.pow(150 / mass, 0.48), 0.18, 1);
  }

  function decayGadgetPullContactIntent(body, dt) {
    if (!body) {
      return;
    }
    if (body.gadgetPullContactTimer !== undefined) {
      body.gadgetPullContactTimer = Math.max(0, finiteOr(body.gadgetPullContactTimer, 0) - dt);
    }
    if (body.directGadgetForceTimer !== undefined) {
      body.directGadgetForceTimer = Math.max(0, finiteOr(body.directGadgetForceTimer, 0) - dt);
    }
  }

  function markGadgetPullContactIntent(body, actor, aim, pullTowardActor) {
    if (!body || !body.tier || !body.tier.solid || !actor || !aim) {
      return;
    }
    body.gadgetPullContactTimer = 0.09;
    body.gadgetPullActorId = actor.id || "";
    body.gadgetPullAimX = finiteOr(aim.x, 1);
    body.gadgetPullAimY = finiteOr(aim.y, 0);
    body.gadgetPullTowardActor = pullTowardActor === true;
  }

  function markDirectGadgetBodyForceIntent(body, actor) {
    if (!body || !body.tier || !body.tier.solid || !actor || !actor.landed || actor.landed.bridgeId) {
      return;
    }
    const landedBodyId = Math.max(0, Math.floor(finiteOr(actor.landed.bodyId, 0)));
    if (!landedBodyId || landedBodyId === body.id) {
      return;
    }
    body.directGadgetForceTimer = 0.12;
    body.directGadgetForceActorId = actor.id || "";
    body.directGadgetForceLandedBodyId = landedBodyId;
  }

  function isDirectGadgetForcedFromLandedBody(body, landedBody) {
    return Boolean(
      body &&
      landedBody &&
      body.tier &&
      body.tier.solid &&
      finiteOr(body.directGadgetForceTimer, 0) > 0 &&
      Math.max(0, Math.floor(finiteOr(body.directGadgetForceLandedBodyId, 0))) === landedBody.id
    );
  }

  function isSelfVacuumPulledBodyContact(player, body, nx, ny) {
    if (!player || !body || !body.tier || !body.tier.solid || finiteOr(body.gadgetPullContactTimer, 0) <= 0) {
      return false;
    }

    const actorId = body.gadgetPullActorId || "";
    if (actorId && player.id && actorId !== player.id) {
      return false;
    }

    const aimX = finiteOr(body.gadgetPullAimX, 1);
    const aimY = finiteOr(body.gadgetPullAimY, 0);
    const toBodyX = finiteOr(body.x, 0) - finiteOr(player.x, 0);
    const toBodyY = finiteOr(body.y, 0) - finiteOr(player.y, 0);
    const bodyForward = toBodyX * aimX + toBodyY * aimY;
    const sideX = toBodyX - aimX * bodyForward;
    const sideY = toBodyY - aimY * bodyForward;
    const side = Math.hypot(sideX, sideY);
    const contactRadius = solidContactRadius(body);
    const playerRadius = Math.max(1, finiteOr(player.radius, PLAYER_RADIUS));
    const closeSuctionCorridor = bodyForward > -contactRadius * 0.65 && side < contactRadius + playerRadius * 0.9;
    const contactFacesAim = nx * aimX + ny * aimY < -0.16;
    const bodyClosingSpeed = (finiteOr(body.vx, 0) - finiteOr(player.vx, 0)) * nx +
      (finiteOr(body.vy, 0) - finiteOr(player.vy, 0)) * ny;

    return closeSuctionCorridor && (contactFacesAim || bodyClosingSpeed > 8);
  }

  function resolveSelfVacuumPulledBodyContact(player, body, nx, ny, overlap, damping) {
    body.x -= nx * overlap;
    body.y -= ny * overlap;

    const closingSpeed = (finiteOr(body.vx, 0) - finiteOr(player.vx, 0)) * nx +
      (finiteOr(body.vy, 0) - finiteOr(player.vy, 0)) * ny;
    if (closingSpeed > 0) {
      const impulse = closingSpeed * finiteOr(damping, 0.86);
      const pointX = finiteOr(body.x, 0) + nx * bodyAngularInertiaRadius(body);
      const pointY = finiteOr(body.y, 0) + ny * bodyAngularInertiaRadius(body);
      applyBodyVelocityChangeAtPoint(body, -nx * impulse, -ny * impulse, pointX, pointY, BODY_CONSTRAINT_TORQUE_RESPONSE);
    }
  }

  function actorFunnel(actor, aim) {
    return {
      x: actor.x + aim.x * FUNNEL.captureX,
      y: actor.y + aim.y * FUNNEL.captureX,
      radius: FUNNEL.rimHalf
    };
  }

  function funnelHalfAt(localX) {
    const t = clamp((localX - FUNNEL.backX) / (FUNNEL.rimX - FUNNEL.backX), 0, 1);
    return FUNNEL.backHalf + (FUNNEL.rimHalf - FUNNEL.backHalf) * t;
  }

  function collideFunnelSegment(state, ax, ay, bx, by, radius) {
    const abx = bx - ax;
    const aby = by - ay;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = clamp(((state.x - ax) * abx + (state.y - ay) * aby) / abLenSq, 0, 1);
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;
    const dx = state.x - closestX;
    const dy = state.y - closestY;
    const dist = Math.hypot(dx, dy);
    const minDist = radius + FUNNEL.wallThickness;

    if (dist >= minDist) {
      return false;
    }

    let nx = dx / (dist || 1);
    let ny = dy / (dist || 1);
    if (dist < 0.001) {
      nx = -aby / Math.sqrt(abLenSq);
      ny = abx / Math.sqrt(abLenSq);
    }

    const overlap = minDist - dist;
    state.x += nx * overlap;
    state.y += ny * overlap;

    const incoming = state.vx * nx + state.vy * ny;
    if (incoming < 0) {
      state.vx -= incoming * 1.26 * nx;
      state.vy -= incoming * 1.26 * ny;

      const tx = -ny;
      const ty = nx;
      const tangent = state.vx * tx + state.vy * ty;
      state.vx -= tangent * 0.1 * tx;
      state.vy -= tangent * 0.1 * ty;
    }

    return true;
  }

  function resolveFunnelBucket(target, actor, input, dt) {
    if (!target || !actor || actor.health <= 0 || !isSuctionToolId(actor.equippedTool)) {
      return false;
    }

    const safeInput = sanitizeInput(input, actor, { dt, requireEnergy: true, allowCommittedToolMode: true });
    const leftActive = safeInput.buttons.pull || safeInput.toolMode === "pull";
    const rightActive = safeInput.buttons.push || safeInput.toolMode === "push";
    const aim = { x: Math.cos(actor.aimAngle), y: Math.sin(actor.aimAngle) };
    const normal = { x: -aim.y, y: aim.x };
    const relX = target.x - actor.x;
    const relY = target.y - actor.y;
    const velocityX = target.vx - finiteOr(actor.vx, 0);
    const velocityY = target.vy - finiteOr(actor.vy, 0);
    const originalState = {
      x: relX * aim.x + relY * aim.y,
      y: relX * normal.x + relY * normal.y,
      vx: velocityX * aim.x + velocityY * aim.y,
      vy: velocityX * normal.x + velocityY * normal.y
    };
    const bucketState = { ...originalState };
    const pushResponse = bodyPushResponse(target);
    const radius = finiteOr(target.radius, 1);

    let touchedBucket = false;
    touchedBucket = collideFunnelSegment(bucketState, FUNNEL.backX, -FUNNEL.backHalf, FUNNEL.rimX, -FUNNEL.rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, FUNNEL.backX, FUNNEL.backHalf, FUNNEL.rimX, FUNNEL.rimHalf, radius) || touchedBucket;
    touchedBucket = collideFunnelSegment(bucketState, FUNNEL.backX, -FUNNEL.backHalf, FUNNEL.backX, FUNNEL.backHalf, radius) || touchedBucket;

    if (bucketState.x >= FUNNEL.backX && bucketState.x <= FUNNEL.rimX) {
      const half = funnelHalfAt(bucketState.x);
      const availableHalf = Math.max(7, half - radius * 0.42);
      if (Math.abs(bucketState.y) > availableHalf && Math.abs(bucketState.y) < half) {
        const side = Math.sign(bucketState.y) || 1;
        bucketState.y = side * availableHalf;
        if (bucketState.vy * side > 0) {
          bucketState.vy *= -0.22;
        }
        touchedBucket = true;
      }
    }

    if (
      bucketState.x < FUNNEL.backX + radius &&
      bucketState.x > FUNNEL.backX - radius * 1.35 &&
      Math.abs(bucketState.y) < FUNNEL.backHalf + radius * 0.8 &&
      (bucketState.x >= FUNNEL.backX || bucketState.vx < 0)
    ) {
      bucketState.x = FUNNEL.backX + radius;
      if (bucketState.vx < 0) {
        bucketState.vx *= -0.24;
      }
      touchedBucket = true;
    }

    const cupHalf = funnelHalfAt(bucketState.x);
    const insideCup =
      bucketState.x > FUNNEL.backX - radius * 0.35 &&
      bucketState.x < FUNNEL.rimX + radius * 0.55 &&
      Math.abs(bucketState.y) < cupHalf + radius * 0.25;

    if (insideCup || touchedBucket) {
      const damping = Math.pow(rightActive ? 0.72 : 0.18, dt);
      bucketState.vx *= damping;
      bucketState.vy *= damping;

      if (!rightActive) {
        bucketState.vx += (FUNNEL.captureX - bucketState.x) * 7.5 * dt;
        bucketState.vy += -bucketState.y * 8.5 * dt;
      }

      if (leftActive) {
        bucketState.vx += (FUNNEL.captureX - bucketState.x) * 6.5 * dt;
        bucketState.vy += -bucketState.y * 6.5 * dt;
      }
    }

    const resolvedState = {
      x: originalState.x + (bucketState.x - originalState.x) * pushResponse,
      y: originalState.y + (bucketState.y - originalState.y) * pushResponse,
      vx: originalState.vx + (bucketState.vx - originalState.vx) * pushResponse,
      vy: originalState.vy + (bucketState.vy - originalState.vy) * pushResponse
    };

    target.x = actor.x + aim.x * resolvedState.x + normal.x * resolvedState.y;
    target.y = actor.y + aim.y * resolvedState.x + normal.y * resolvedState.y;
    target.vx = finiteOr(actor.vx, 0) + aim.x * resolvedState.vx + normal.x * resolvedState.vy;
    target.vy = finiteOr(actor.vy, 0) + aim.y * resolvedState.vx + normal.y * resolvedState.vy;
    if (insideCup || touchedBucket) {
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
    }
    return insideCup || touchedBucket;
  }

  function gadgetMiddleGatherRange(forward, side, targetRadius, holdReach) {
    const radius = Math.max(0, finiteOr(targetRadius, 0));
    return (
      forward > FUNNEL.backX - 130 &&
      forward < Math.max(1, finiteOr(holdReach, GADGET_HOLD_REACH)) + radius + 90 &&
      side < 188 + radius
    );
  }

  function applyGadgetForces(target, actor, input, dt, options) {
    if (!target || !actor || !input || !isSuctionToolId(input.equippedTool)) {
      return false;
    }
    const pulling = input.buttons.pull || input.toolMode === "pull";
    const pushing = input.buttons.push || input.toolMode === "push";
    const holding = input.buttons.hold || input.toolMode === "hold";
    if (!pulling && !pushing && !holding) {
      return false;
    }

    const aim = aimVector(input);
    const funnel = actorFunnel(actor, aim);
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aim.x + toTargetY * aim.y;
    const sideX = toTargetX - aim.x * forward;
    const sideY = toTargetY - aim.y * forward;
    const side = Math.hypot(sideX, sideY);
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const targetRadius = finiteOr(target.radius, 1);
    const forceReach = gadgetForceReachForInput(actor, input);
    const holdReach = gadgetHoldReachForInput(actor, input);
    const inCone = forward > -70 && forward < forceReach && side < coneWidth + targetRadius * 0.2;
    const middleGatherRange = holding && gadgetMiddleGatherRange(forward, side, targetRadius, holdReach);
    if (!inCone && !middleGatherRange) {
      return false;
    }

    const response = bodyPushResponse(target);
    const pullTowardActor = Boolean(options && options.pullTowardActor === true);
    const torquePoint = target.tier ? bodySurfacePointForForce(target, actor.x, actor.y) : null;
    if (holding) {
      const holdX = actor.x + aim.x * holdReach;
      const holdY = actor.y + aim.y * holdReach;
      const toHoldX = holdX - target.x;
      const toHoldY = holdY - target.y;
      const holdDistance = Math.hypot(toHoldX, toHoldY);
      const hold = normalize(toHoldX, toHoldY);
      const desiredSpeed = clamp(holdDistance * 5.4, 0, 520);
      const gatherWidth = middleGatherRange ? 188 + targetRadius : coneWidth;
      const coneStrength = inCone
        ? clamp(1 - side / Math.max(1, coneWidth), 0, 1)
        : clamp(1 - side / Math.max(1, gatherWidth), 0.16, 0.78);
      const steer = clamp((4.8 + Math.max(0.22, response) * 8.6) * coneStrength * dt, 0, 1);
      const deltaVx = (hold.x * desiredSpeed - target.vx) * steer;
      const deltaVy = (hold.y * desiredSpeed - target.vy) * steer;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, Math.max(0.22, response));
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
      target.vx *= Math.pow(0.18 + (1 - response) * 0.42, dt);
      target.vy *= Math.pow(0.18 + (1 - response) * 0.42, dt);
      return true;
    }

    if (pulling) {
      markGadgetPullContactIntent(target, actor, aim, pullTowardActor);
      const pullTargetX = pullTowardActor ? actor.x : funnel.x;
      const pullTargetY = pullTowardActor ? actor.y : funnel.y;
      const toPullTarget = normalize(pullTargetX - target.x, pullTargetY - target.y);
      const pullDistance = Math.hypot(pullTargetX - target.x, pullTargetY - target.y);
      const coneStrength = clamp(1 - side / Math.max(1, coneWidth), 0, 1);
      const distanceStrength = clamp(1 - pullDistance / 620, pullTowardActor ? 0.28 : 0.16, 1);
      const force = (pullTowardActor ? 1660 : 1180) * gadgetSuckFactor(actor, input) * coneStrength * distanceStrength * response;
      const deltaVx = toPullTarget.x * force * dt;
      const deltaVy = toPullTarget.y * force * dt;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, response);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
    }

    if (pushing && forward > -20 - targetRadius * 0.15 && forward < 470 + targetRadius && side < coneWidth * 0.95 + targetRadius * 0.32) {
      const blastFalloff = clamp(1 - Math.max(0, forward) / 520, 0.22, 1);
      const sidePush = normalize(sideX, sideY);
      const force = 1450 * gadgetBlowFactor(actor, input) * blastFalloff * response;
      const deltaVx = (aim.x * force + sidePush.x * 120 * response) * dt;
      const deltaVy = (aim.y * force + sidePush.y * 120 * response) * dt;
      if (torquePoint) {
        applyBodyVelocityChangeAtPoint(target, deltaVx, deltaVy, torquePoint.x, torquePoint.y, response);
      } else {
        target.vx += deltaVx;
        target.vy += deltaVy;
      }
      markSurvivalCampBodyMovedByPlayer(target, actor.id || "");
      markDirectGadgetBodyForceIntent(target, actor);
    }

    return true;
  }

  function viciousVacuumTargetInfluence(actor, input, target, mode) {
    if (!actor || !input || !target || !isViciousVacuumToolId(input.equippedTool)) {
      return null;
    }
    if (mode === "pull" && !(input.buttons.pull || input.toolMode === "pull")) {
      return null;
    }
    if (mode === "push" && !(input.buttons.push || input.toolMode === "push")) {
      return null;
    }

    const aim = aimVector(input);
    const toTargetX = target.x - actor.x;
    const toTargetY = target.y - actor.y;
    const forward = toTargetX * aim.x + toTargetY * aim.y;
    const sideX = toTargetX - aim.x * forward;
    const sideY = toTargetY - aim.y * forward;
    const side = Math.hypot(sideX, sideY);
    const targetRadius = Math.max(0, finiteOr(target.radius, 0));
    const coneWidth = 64 + Math.max(0, forward) * 0.42;
    const pullRange = forward > -70 && forward < gadgetForceReachForInput(actor, input) + targetRadius && side < coneWidth + targetRadius * 0.28;
    const pushRange = forward > -20 && forward < 470 + targetRadius && side < coneWidth * 0.95 + targetRadius * 0.28;
    const activeRange = mode === "push" ? pushRange : pullRange;
    if (!activeRange) {
      return null;
    }

    return {
      aim,
      sideX,
      sideY,
      forward,
      side,
      coneWidth,
      pullStrength: clamp(1 - Math.max(0, forward) / (mode === "push" ? 520 : 620), mode === "push" ? 0.18 : 0.1, 1),
      centerStrength: clamp(1 - side / Math.max(1, coneWidth + targetRadius * 0.35), 0, 1)
    };
  }

  function drainBodyWithViciousVacuum(state, seedHolder, actor, input, body, dt) {
    if (!body || !isAsteroidOrLarger(body) || body.mass <= 1) {
      return false;
    }
    const influence = viciousVacuumTargetInfluence(actor, input, body, "pull");
    if (!influence) {
      return false;
    }

    const drain = Math.min(
      body.mass - 1,
      (VICIOUS_VACUUM_BODY_DRAIN_RATE + Math.sqrt(body.mass) * 0.05) *
        gadgetSuckFactor(actor, input) *
        influence.pullStrength *
        (0.35 + influence.centerStrength * 0.65) *
        dt
    );
    if (drain <= 0) {
      return false;
    }

    const source = {
      id: -1,
      x: actor.x + influence.aim.x * 44,
      y: actor.y + influence.aim.y * 44,
      beamAngle: Math.atan2(influence.aim.y, influence.aim.x),
      color: { r: 255, g: 95, b: 135 },
      wobble: finiteOr(actor.walkCycle, 0)
    };
    body.mass -= drain;
    updateBodyAfterMassChange(body);
    body.textureSeed = finiteOr(body.textureSeed, 0) + drain * 0.013;
    body.ufoSapParticleBuffer = Math.max(0, finiteOr(body.ufoSapParticleBuffer, 0)) + drain;
    if (body.ufoSapParticleBuffer >= UFO_SAP_FRAGMENT_MASS) {
      const fragments = Math.min(
        UFO_SAP_MAX_FRAGMENTS_PER_BURST,
        Math.max(1, Math.floor(body.ufoSapParticleBuffer / UFO_SAP_FRAGMENT_MASS))
      );
      let remaining = body.ufoSapParticleBuffer;
      for (let i = 0; i < fragments; i += 1) {
        const fragmentMass = remaining / (fragments - i);
        remaining -= fragmentMass;
        emitUfoSapParticle(state, seedHolder, source, body, fragmentMass, influence.pullStrength, influence.centerStrength);
      }
      body.ufoSapParticleBuffer = Math.max(0, remaining);
    }
    state.events.push({ type: "viciousVacuum.bodyDrained", playerId: actor.id, bodyId: body.id, tick: state.tick });
    return true;
  }

  function applyViciousVacuumToMob(state, actor, input, mob, dt) {
    if (!state || !actor || !input || !mob || mob.health <= 0 || !isViciousVacuumToolId(input.equippedTool)) {
      return false;
    }

    let affected = false;
    if (viciousVacuumTargetInfluence(actor, input, mob, "push")) {
      applyGadgetForces(mob, actor, {
        ...input,
        toolMode: "push",
        buttons: { ...input.buttons, pull: false, hold: false, push: true }
      }, dt, { captureInFunnel: false });
      if (mob.landed) {
        mob.landed = null;
        mob.residentTier = null;
      }
      affected = true;
    }

    const influence = viciousVacuumTargetInfluence(actor, input, mob, "pull");
    if (!influence) {
      return affected;
    }

    mob.visciousVacuumDrainTimer = Math.max(0, finiteOr(mob.visciousVacuumDrainTimer, 0) - dt);
    if (mob.visciousVacuumDrainTimer > 0) {
      return true;
    }

    mob.visciousVacuumDrainTimer += VICIOUS_VACUUM_MOB_DRAIN_TICK_INTERVAL;
    const strength = influence.pullStrength * (0.4 + influence.centerStrength * 0.6) * gadgetSuckFactor(actor, input);
    const before = Math.max(0, finiteOr(mob.health, 0));
    const damage = VICIOUS_VACUUM_MOB_DRAIN_RATE * VICIOUS_VACUUM_MOB_DRAIN_TICK_INTERVAL * strength;
    damageMob(state, mob, damage, "vicious-vacuum", actor.id || "");
    const drained = Math.max(0, before - Math.max(0, finiteOr(mob.health, 0)));
    if (drained > 0 && actor.health > 0) {
      actor.health = Math.min(finiteOr(actor.maxHealth, PLAYER_MAX_HEALTH), finiteOr(actor.health, 0) + drained);
      state.events.push({ type: "viciousVacuum.mobDrained", playerId: actor.id, mobId: mob.id, kind: mob.kind, amount: drained, tick: state.tick });
    }
    return true;
  }

  function isLandableBody(body) {
    const tier = body && body.tier ? body.tier : body ? tierForMass(body.mass) : null;
    return Boolean(tier && tier.name !== "star" && finiteOr(tier.threshold, 0) >= 150);
  }

  function findNearestLandableBody(world, player) {
    if (!world || !player) {
      return null;
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (const body of world.particles || []) {
      if (!isLandableBody(body)) {
        continue;
      }

      const dx = finiteOr(player.x, 0) - finiteOr(body.x, 0);
      const dy = finiteOr(player.y, 0) - finiteOr(body.y, 0);
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const landingRange = finiteOr(body.radius, radiusFromMass(body.mass)) +
        surfaceExtensionAtAngle(world, body, angle) +
        PLAYER_FOOT_OFFSET +
        LANDING_RANGE_PADDING;

      if (distance < landingRange && distance < nearestDistance) {
        nearest = body;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function detachPlayerFromBody(world, player, jumpStrength) {
    if (!player || !player.landed) {
      return;
    }

    const angle = finiteOr(player.landed.angle, 0);
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const bridge = player.landed.bridgeId ? activeBridgeById(world, player.landed.bridgeId) : null;
    const pose = bridge ? bridgeSurfacePose(world, bridge, player.landed.bridgeT, player.landed.bridgeSide, player.landed.walkSpeed) : null;
    const body = bodyById(world, player.landed.bodyId);
    const baseVx = pose ? pose.vx : finiteOr(body && body.vx, player.vx);
    const baseVy = pose ? pose.vy : finiteOr(body && body.vy, player.vy);
    player.vx = baseVx + normalX * finiteOr(jumpStrength, 0);
    player.vy = baseVy + normalY * finiteOr(jumpStrength, 0);
    player.landed = null;
  }

  function applyLandedSurfaceConstraint(world, player) {
    if (!player || !player.landed) {
      return false;
    }

    if (player.landed.bridgeId) {
      const bridge = activeBridgeById(world, player.landed.bridgeId);
      const pose = bridge ? bridgeSurfacePose(world, bridge, player.landed.bridgeT, player.landed.bridgeSide, player.landed.walkSpeed) : null;
      if (!pose) {
        detachPlayerFromBody(world, player, 130);
        return false;
      }
      player.landed.bridgeT = pose.t;
      player.landed.bridgeSide = pose.side;
      player.landed.angle = pose.angle;
      player.x = pose.x;
      player.y = pose.y;
      player.vx = pose.vx;
      player.vy = pose.vy;
      player.cameraRoll = 0;
      return true;
    }

    const body = bodyById(world, player.landed.bodyId);
    if (!body || !isLandableBody(body)) {
      detachPlayerFromBody(world, player, 130);
      return false;
    }

    const angle = finiteOr(player.landed.angle, 0);
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const tangentX = -normalY;
    const tangentY = normalX;
    const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
    const distanceFromCenter = finiteOr(body.radius, radiusFromMass(body.mass)) + surfaceOffset + PLAYER_FOOT_OFFSET;
    const walkSpeed = finiteOr(player.landed.walkSpeed, 0);
    const surfaceVelocity = bodySurfaceVelocityAtAngle(body, angle, surfaceOffset);

    player.x = finiteOr(body.x, 0) + normalX * distanceFromCenter;
    player.y = finiteOr(body.y, 0) + normalY * distanceFromCenter;
    player.vx = surfaceVelocity.x + tangentX * walkSpeed;
    player.vy = surfaceVelocity.y + tangentY * walkSpeed;
    player.cameraRoll = 0;
    return true;
  }

  function applyGadgetThrustToBody(body, aim, direction, dt, strengthFactor, forcePoint) {
    if (!body || !isLandableBody(body)) {
      return false;
    }

    const upgradeFactor = Math.max(0.1, finiteOr(strengthFactor, 1));
    const massDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(body.mass, 1) / 100), 0.38), 0.18, 1);
    const thrust = 155 * massDamping * upgradeFactor;
    const speedFactor = clamp(Math.sqrt(upgradeFactor), 0.6, 1.75);
    const baseMaxSpeed = (220 * massDamping + 60) * speedFactor;
    const aimWorld = aim || { x: 1, y: 0 };
    const previousVx = finiteOr(body.vx, 0);
    const previousVy = finiteOr(body.vy, 0);
    const previousSpeed = Math.hypot(previousVx, previousVy);
    const accelerationX = aimWorld.x * direction * thrust * dt;
    const accelerationY = aimWorld.y * direction * thrust * dt;
    const progradeGain = previousSpeed > 0
      ? Math.max(0, (previousVx * accelerationX + previousVy * accelerationY) / previousSpeed)
      : 0;
    const maxSpeed = Math.max(baseMaxSpeed, previousSpeed + progradeGain);

    const point = forcePoint
      ? bodySurfacePointForForce(body, forcePoint.x, forcePoint.y)
      : bodySurfacePointForForce(body, body.x - aimWorld.x, body.y - aimWorld.y);
    applyBodyVelocityChangeAtPoint(body, accelerationX, accelerationY, point.x, point.y, 1);

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }
    return true;
  }

  function togglePlayerLanding(state, player) {
    const world = state && state.world;
    if (!world || !player || player.health <= 0) {
      return false;
    }

    if (player.landed) {
      detachPlayerFromBody(world, player, 190);
      return true;
    }

    const body = findNearestLandableBody(world, player);
    if (!body) {
      return false;
    }

    const angle = Math.atan2(finiteOr(player.y, 0) - finiteOr(body.y, 0), finiteOr(player.x, 0) - finiteOr(body.x, 0));
    player.landed = {
      bodyId: body.id,
      bridgeId: 0,
      bridgeT: 0,
      bridgeSide: 1,
      bridgeInputSign: 1,
      angle,
      walkSpeed: 0,
      walkCycle: finiteOr(player.walkCycle, 0)
    };
    applyLandedSurfaceConstraint(world, player);
    return true;
  }

  function updateBridgeLandedPlayer(state, player, input, dt) {
    const world = state && state.world;
    const bridge = world && player && player.landed ? activeBridgeById(world, player.landed.bridgeId) : null;
    const geometry = bridge ? bridgeGeometry(bridge) : null;
    if (!world || !player || !bridge || !geometry) {
      detachPlayerFromBody(world, player, 120);
      return;
    }

    if (input.buttons.land && input.landAction !== "land") {
      detachPlayerFromBody(world, player, 190);
      player.moving = false;
      player.crouching = false;
      return;
    }

    const walkSpeed = input.buttons.down ? 68 : 128;
    const holdActive = input.buttons.hold || input.toolMode === "hold";
    let walkDirection = 0;
    if (!holdActive && input.buttons.left) {
      walkDirection -= 1;
    }
    if (!holdActive && input.buttons.right) {
      walkDirection += 1;
    }
    walkDirection = clamp(walkDirection, -1, 1);

    const inputSign = finiteOr(player.landed.bridgeInputSign, 1) < 0 ? -1 : 1;
    const pathSpeed = walkDirection * inputSign * walkSpeed;
    player.landed.walkSpeed = pathSpeed;
    if (walkDirection) {
      player.walkCycle = finiteOr(player.walkCycle, 0) + (2.3 + Math.abs(pathSpeed) * 0.052) * dt;
    }
    player.landed.walkCycle = finiteOr(player.walkCycle, 0);
    player.landed.bridgeT = finiteOr(player.landed.bridgeT, 0) + pathSpeed * dt;

    const startJoin = bridgeEndpointJoin(world, bridge, bridge.bodyId, player.landed.bridgeSide);
    const endJoin = bridgeEndpointJoin(world, bridge, bridge.linkedBodyId, player.landed.bridgeSide);
    const startExitT = startJoin ? startJoin.t : 0;
    const endExitT = endJoin ? endJoin.t : geometry.length;

    if (pathSpeed < 0 && player.landed.bridgeT <= startExitT) {
      transferPlayerFromBridgeToBody(world, player, bridge, bridge.bodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    if (pathSpeed > 0 && player.landed.bridgeT >= endExitT) {
      transferPlayerFromBridgeToBody(world, player, bridge, bridge.linkedBodyId, player.landed.bridgeSide, pathSpeed);
      return;
    }
    player.landed.bridgeT = clamp(player.landed.bridgeT, startExitT, endExitT);
    player.moving = Boolean(walkDirection);
    player.crouching = Boolean(input.buttons.down);
    applyLandedSurfaceConstraint(world, player);
  }

  function updateLandedPlayer(state, player, input, dt) {
    const world = state && state.world;
    if (player && player.landed && player.landed.bridgeId) {
      updateBridgeLandedPlayer(state, player, input, dt);
      return;
    }

    const body = bodyById(world, player && player.landed && player.landed.bodyId);
    if (!world || !player || !body || !isLandableBody(body)) {
      detachPlayerFromBody(world, player, 120);
      return;
    }

    if (input.buttons.land && input.landAction !== "land") {
      detachPlayerFromBody(world, player, 190);
      player.moving = false;
      player.crouching = false;
      return;
    }

    const surfaceRadius = Math.max(
      24,
      finiteOr(body.radius, radiusFromMass(body.mass)) + surfaceExtensionAtAngle(world, body, player.landed.angle)
    );
    const tier = body.tier || tierForMass(body.mass);
    const asteroidWalkMultiplier = tier && tier.name === "asteroid" ? 0.78 : 1;
    const walkSpeed = (input.buttons.down ? 68 : 128) * asteroidWalkMultiplier;
    const holdActive = input.buttons.hold || input.toolMode === "hold";
    let walkDirection = 0;
    if (!holdActive && input.buttons.left) {
      walkDirection -= 1;
    }
    if (!holdActive && input.buttons.right) {
      walkDirection += 1;
    }
    walkDirection = clamp(walkDirection, -1, 1);

    player.landed.walkSpeed = walkDirection * walkSpeed;
    if (walkDirection) {
      player.walkCycle = finiteOr(player.walkCycle, 0) + (2.3 + Math.abs(player.landed.walkSpeed) * 0.052) * dt;
    }
    player.landed.walkCycle = finiteOr(player.walkCycle, 0);
    const previousAngle = finiteOr(player.landed.angle, 0);
    player.landed.angle = finiteOr(player.landed.angle, 0) + (player.landed.walkSpeed / surfaceRadius) * dt;
    const bridgeTransfer = findBridgeTransferFromBody(world, body.id, player.landed.angle, walkDirection);
    if (
      bridgeTransfer &&
      Math.abs(shortestAngleDelta(previousAngle, bridgeTransfer.endpoint.angle)) >= Math.abs(shortestAngleDelta(player.landed.angle, bridgeTransfer.endpoint.angle)) &&
      transferPlayerToBridge(world, player, bridgeTransfer, walkDirection, walkSpeed)
    ) {
      player.moving = Boolean(walkDirection);
      player.crouching = Boolean(input.buttons.down);
      return;
    }
    player.moving = Boolean(walkDirection);
    player.crouching = Boolean(input.buttons.down);
    applyLandedSurfaceConstraint(world, player);

    const suctionActive = isSuctionToolId(input.equippedTool) && (input.buttons.pull || input.buttons.push || input.buttons.hold);
    if (suctionActive) {
      player.energy = Math.max(0, finiteOr(player.energy, 0) - SUCTION_ENERGY_DRAIN * dt);
    }
    if (isSuctionToolId(input.equippedTool) && (input.buttons.pull || input.buttons.push)) {
      if (applyGadgetThrustToBody(body, aimVector(input), input.buttons.pull ? 1 : -1, dt, 1, { x: player.x, y: player.y })) {
        markSurvivalCampBodyMovedByPlayer(body, player.id || "");
      }
    }
  }

  function firePlayerWeapon(state, player, input) {
    const weapon = weaponByToolId(player, input && input.equippedTool);
    if (!state || !state.world || !player || !weapon || !input || !input.buttons.fire) {
      return false;
    }
    if (hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    if (finiteOr(player.toolFireCooldown, 0) > 0 || finiteOr(player.energy, 0) < finiteOr(weapon.energyCost, PLAYER_WEAPON_DEFAULTS.energyCost)) {
      return false;
    }

    const aim = aimVector(input);
    const muzzleDistance = 80;
    const pelletCount = Math.max(1, Math.floor(finiteOr(weapon.pelletCount, 1)));
    const aimAngle = Math.atan2(aim.y, aim.x);
    const spread = Math.max(0, finiteOr(weapon.spread, 0));
    const seedHolder = {
      seed: (
        finiteOr(state.seed, 1) ^
        Math.imul(Math.max(1, Math.floor(finiteOr(state.tick, 0)) + 1), 2246822519) ^
        hashSeed(String(player.id || "player") + ":" + String(input.equippedTool || "weapon"))
      ) >>> 0
    };
    let firstProjectileId = 0;

    for (let i = 0; i < pelletCount; i += 1) {
      const lineT = pelletCount <= 1 ? 0 : i / (pelletCount - 1) * 2 - 1;
      const clusteredT = Math.sign(lineT) * Math.pow(Math.abs(lineT), 1.35);
      const angleJitter = pelletCount > 1 ? randomRange(seedHolder, -0.04, 0.04) : (spread > 0 ? randomRange(seedHolder, -spread, spread) * 0.55 : 0);
      const angleOffset = clusteredT * spread + angleJitter;
      const dirX = Math.cos(aimAngle + angleOffset);
      const dirY = Math.sin(aimAngle + angleOffset);
      const sideX = -dirY;
      const sideY = dirX;
      const muzzleScatter = pelletCount > 1 ? randomRange(seedHolder, -9, 9) : 0;
      const forwardScatter = pelletCount > 1 ? randomRange(seedHolder, -4, 8) : 0;
      const speed = finiteOr(weapon.speed, PLAYER_WEAPON_DEFAULTS.speed) + (pelletCount > 1 ? randomRange(seedHolder, 10, 120) : 0);
      const life = finiteOr(weapon.life, PLAYER_WEAPON_DEFAULTS.life) * (pelletCount > 1 ? randomRange(seedHolder, 0.9, 1.22) : 1);
      const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
      const projectile = normalizeEntity({
        id,
        kind: "player-projectile",
        x: player.x + dirX * (muzzleDistance + forwardScatter) + sideX * muzzleScatter,
        y: player.y + dirY * (muzzleDistance + forwardScatter) + sideY * muzzleScatter,
        vx: dirX * speed + finiteOr(player.vx, 0) * 0.18,
        vy: dirY * speed + finiteOr(player.vy, 0) * 0.18,
        radius: finiteOr(weapon.radius, PLAYER_WEAPON_DEFAULTS.radius),
        length: finiteOr(weapon.length, PLAYER_WEAPON_DEFAULTS.length),
        color: cloneColor(weapon.color || PLAYER_WEAPON_DEFAULTS.color),
        life,
        maxLife: life,
        damage: finiteOr(weapon.damage, PLAYER_WEAPON_DEFAULTS.damage),
        knockback: finiteOr(weapon.knockback, PLAYER_WEAPON_DEFAULTS.knockback),
        toolDisable: 0,
        cause: weapon.label || PLAYER_WEAPON_DEFAULTS.label,
        weaponLabel: weapon.label || PLAYER_WEAPON_DEFAULTS.label,
        sourcePlayerId: player.id || "",
        ownerPlayerId: player.id || "",
        piercesMobs: Boolean(weapon.piercesMobs),
        hitMobIds: []
      }, id, "projectile");

      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      if (!firstProjectileId) {
        firstProjectileId = projectile.id;
      }
    }
    state.seed = seedHolder.seed >>> 0;
    player.energy = Math.max(0, finiteOr(player.energy, 0) - finiteOr(weapon.energyCost, PLAYER_WEAPON_DEFAULTS.energyCost));
    player.toolFireCooldown = finiteOr(weapon.cooldown, PLAYER_WEAPON_DEFAULTS.cooldown);
    if (!player.landed) {
      const slow = clamp(finiteOr(weapon.movementSlow, PLAYER_WEAPON_DEFAULTS.movementSlow), 0, 0.35);
      const immediateDrag = 1 - slow * 0.42;
      player.vx = player.vx * immediateDrag - aim.x * (24 + slow * 120);
      player.vy = player.vy * immediateDrag - aim.y * (24 + slow * 120);
    }
    state.events.push({
      type: "player.shot",
      playerId: player.id || "",
      projectileId: firstProjectileId,
      weapon: input.equippedTool,
      tick: state.tick
    });
    return true;
  }

  function firePlayerEmpTool(state, player, input) {
    if (!state || !state.world || !player || !input || !input.buttons.fire || !isEmpToolId(input.equippedTool)) {
      return false;
    }
    if (!playerHasTool(player, EMP_TOOL_ID) || hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    if (finiteOr(player.toolFireCooldown, 0) > 0 || finiteOr(player.energy, 0) < EMP_PULSE_ENERGY_COST) {
      return false;
    }

    player.energy = Math.max(0, finiteOr(player.energy, 0) - EMP_PULSE_ENERGY_COST);
    player.toolFireCooldown = EMP_PULSE_COOLDOWN;
    const range = EMP_PULSE_RANGE * toolUpgradeFactor(player, EMP_TOOL_ID, "range");
    const duration = EMP_PULSE_DISABLE_DURATION * toolUpgradeFactor(player, EMP_TOOL_ID, "duration");
    applyEmpPulse(state, player.x, player.y, range, duration, {
      affectMobs: true,
      affectPlayers: false,
      affectStructures: false,
      sourcePlayerId: player.id || "",
      sourceKind: "player",
      cause: "EMP tool",
      color: { r: 126, g: 232, b: 255 }
    });
    return true;
  }

  function pistonPunchSegment(player, input) {
    const aim = aimVector(input);
    return {
      ax: player.x + aim.x * 34,
      ay: player.y + aim.y * 34,
      bx: player.x + aim.x * PISTON_PUNCH_RANGE,
      by: player.y + aim.y * PISTON_PUNCH_RANGE,
      aim
    };
  }

  function findPistonPunchTarget(world, player, input) {
    const punch = pistonPunchSegment(player, input);
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      const radius = finiteOr(mob.radius, 28);
      const segmentDistance = distanceToSegment(mob.x, mob.y, punch.ax, punch.ay, punch.bx, punch.by);
      const playerDistance = Math.hypot(mob.x - player.x, mob.y - player.y);
      if (segmentDistance > radius + 24 || playerDistance > PISTON_PUNCH_RANGE + radius || playerDistance >= bestDistance) {
        continue;
      }
      best = mob;
      bestDistance = playerDistance;
    }
    return best;
  }

  function firePlayerPistonPunch(state, player, input) {
    if (!state || !state.world || !player || !input || !input.buttons.fire || !isPistonPunchToolId(input.equippedTool)) {
      return false;
    }
    if (!playerHasTool(player, PISTON_PUNCH_TOOL_ID) || hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    if (finiteOr(player.toolFireCooldown, 0) > 0 || finiteOr(player.energy, 0) < PISTON_PUNCH_ENERGY_COST) {
      return false;
    }

    const punch = pistonPunchSegment(player, input);
    const target = findPistonPunchTarget(state.world, player, input);
    player.energy = Math.max(0, finiteOr(player.energy, 0) - PISTON_PUNCH_ENERGY_COST);
    player.toolFireCooldown = PISTON_PUNCH_COOLDOWN;
    if (target) {
      target.vx += punch.aim.x * PISTON_PUNCH_KNOCKBACK;
      target.vy += punch.aim.y * PISTON_PUNCH_KNOCKBACK;
      damageMob(state, target, PISTON_PUNCH_DAMAGE, "Piston Punch", player.id || "");
    }
    state.events.push({
      type: "player.pistonPunch",
      playerId: player.id || "",
      targetMobId: target ? target.id : 0,
      x: target ? target.x : punch.bx,
      y: target ? target.y : punch.by,
      tick: state.tick
    });
    return true;
  }

  function isPlayerTeamMob(mob) {
    return Boolean(mob && mob.team === "player");
  }

  function familiarOwnerIdForPlayer(player) {
    return String(player && player.id || "");
  }

  function isFamiliarOwnedByPlayer(mob, player) {
    const ownerId = familiarOwnerIdForPlayer(player);
    return Boolean(isPlayerTeamMob(mob) && ownerId && mob.familiarOwnerPlayerId === ownerId);
  }

  function hasLiveFamiliarForPlayer(world, player) {
    return allCombatMobs(world).some((mob) => mob && mob.health > 0 && isFamiliarOwnedByPlayer(mob, player));
  }

  function liveFamiliarsForPlayer(world, player) {
    return allCombatMobs(world).filter((mob) => mob && mob.health > 0 && isFamiliarOwnedByPlayer(mob, player));
  }

  function commandFamiliarsForPlayer(state, player, input) {
    const familiars = liveFamiliarsForPlayer(state.world, player);
    if (!familiars.length) {
      return false;
    }
    const aim = aimVector(input);
    const command = input && input.familiarCommand ? input.familiarCommand : {
      x: player.x + aim.x * FAMILIAR_NET_RANGE,
      y: player.y + aim.y * FAMILIAR_NET_RANGE
    };
    const x = finiteOr(command.x, player.x + aim.x * FAMILIAR_NET_RANGE);
    const y = finiteOr(command.y, player.y + aim.y * FAMILIAR_NET_RANGE);
    for (const familiar of familiars) {
      const dx = x - finiteOr(familiar.x, 0);
      const dy = y - finiteOr(familiar.y, 0);
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const towardSpeed = finiteOr(familiar.vx, 0) * nx + finiteOr(familiar.vy, 0) * ny;
      if (towardSpeed < 0) {
        familiar.vx -= nx * towardSpeed;
        familiar.vy -= ny * towardSpeed;
      }
      familiar.familiarCommandX = x;
      familiar.familiarCommandY = y;
      familiar.familiarCommandTimer = 8;
    }
    player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
    player.toolMode = "idle";
    state.events.push({ type: "familiarNet.command", playerId: player.id || "", x, y, tick: state.tick });
    return true;
  }

  function isCombatMobEntity(entity) {
    return Boolean(entity && MOB_TIER_ORDER.includes(entity.kind));
  }

  function playerTeamMobProjectileFields(mob) {
    return {
      team: isPlayerTeamMob(mob) ? "player" : "",
      ownerPlayerId: isPlayerTeamMob(mob) ? String(mob && mob.familiarOwnerPlayerId || "") : "",
      sourceMobId: mob && mob.id ? mob.id : 0
    };
  }

  function familiarHostileTargets(world, source) {
    return allCombatMobs(world).filter((mob) => mob && mob !== source && mob.health > 0 && !isPlayerTeamMob(mob));
  }

  function isMobSummoning(mob) {
    return Boolean(mob && finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0));
  }

  function familiarNetSwipeSegment(player, input) {
    const aim = aimVector(input);
    return {
      ax: player.x + aim.x * 24,
      ay: player.y + aim.y * 24,
      bx: player.x + aim.x * FAMILIAR_NET_RANGE,
      by: player.y + aim.y * FAMILIAR_NET_RANGE,
      aim
    };
  }

  function findFamiliarNetTarget(world, player, input) {
    const swipe = familiarNetSwipeSegment(player, input);
    let best = null;
    let bestScore = Infinity;
    const aimAngle = Math.atan2(swipe.aim.y, swipe.aim.x);
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || mob.isBoss || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
        continue;
      }
      const mobDx = mob.x - player.x;
      const mobDy = mob.y - player.y;
      const segmentDistance = distanceToSegment(mob.x, mob.y, swipe.ax, swipe.ay, swipe.bx, swipe.by);
      const playerDistance = Math.hypot(mobDx, mobDy);
      const mobAngle = Math.atan2(mobDy, mobDx);
      const angleDelta = Math.abs(shortestAngleDelta(aimAngle, mobAngle));
      const mobRadius = finiteOr(mob.radius, 28);
      const inSwipeLine = segmentDistance <= mobRadius + FAMILIAR_NET_CATCH_LINE_PADDING;
      const inSwipeArc = angleDelta <= FAMILIAR_NET_CATCH_HALF_ANGLE;
      if (playerDistance > FAMILIAR_NET_RANGE + mobRadius || (!inSwipeLine && !inSwipeArc)) {
        continue;
      }
      const score = playerDistance + angleDelta * 55 + segmentDistance * 0.3;
      if (score >= bestScore) {
        continue;
      }
      best = mob;
      bestScore = score;
    }
    return best;
  }

  function removeMobFromWorld(world, mob) {
    const collection = mob && mobCollectionByKind(world, mob.kind);
    if (!Array.isArray(collection)) {
      return false;
    }
    const index = collection.indexOf(mob);
    if (index < 0) {
      return false;
    }
    collection.splice(index, 1);
    return true;
  }

  function useFamiliarNet(state, player, input) {
    if (!state || !state.world || !player || !input || !isFamiliarNetToolId(input.equippedTool) || !playerHasTool(player, FAMILIAR_NET_TOOL_ID)) {
      return false;
    }
    const fireRequested = input.buttons.fire || input.toolMode === "fire";
    const releaseRequested = input.buttons.release || input.toolMode === "release" || input.buttons.push || input.toolMode === "push";
    const fireStarted = fireRequested && !player.familiarNetFireHeld;
    const releaseStarted = releaseRequested && !player.familiarNetReleaseHeld;
    player.familiarNetFireHeld = fireRequested;
    player.familiarNetReleaseHeld = releaseRequested;

    if (hasPlayerStatusEffect(player, "disabled") || finiteOr(player.toolFireCooldown, 0) > 0) {
      return false;
    }

    if (releaseStarted) {
      const seedHolder = { seed: hashSeed(String(state.tick || 0) + ":familiar-net-release:" + String(player.id || "")) };
      const capture = normalizeFamiliarNetCapture(player.familiarNetCapture);
      if (!capture) {
        if (commandFamiliarsForPlayer(state, player, input)) {
          player.familiarNetCapture = null;
          return true;
        }
        player.familiarNetCapture = null;
        player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
        player.toolMode = "idle";
        state.events.push({ type: "familiarNet.empty", playerId: player.id || "", tick: state.tick });
        return true;
      }
      if (hasLiveFamiliarForPlayer(state.world, player)) {
        player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
        player.toolMode = "idle";
        state.events.push({ type: "familiarNet.active", playerId: player.id || "", action: "release", tick: state.tick });
        return true;
      }
      const aim = aimVector(input);
      const mob = createMob(state.world, capture.kind, player.x + aim.x * 118, player.y + aim.y * 118, seedHolder, {
        team: "player",
        familiarOwnerPlayerId: familiarOwnerIdForPlayer(player),
        health: capture.health,
        maxHealth: capture.maxHealth,
        color: capture.color || undefined,
        summonAge: 0,
        summonDuration: 0.42,
        summonSpinSpeed: 8
      });
      mob.team = "player";
      mob.familiarOwnerPlayerId = familiarOwnerIdForPlayer(player);
      mob.summonBaseRadius = Math.max(1, finiteOr(mob.radius, 28));
      mob.radius = 0;
      mob.vx += aim.x * 140 + finiteOr(player.vx, 0) * 0.2;
      mob.vy += aim.y * 140 + finiteOr(player.vy, 0) * 0.2;
      mobCollectionByKind(state.world, mob.kind).push(mob);
      player.familiarNetCapture = null;
      player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.released", playerId: player.id || "", mobId: mob.id, kind: mob.kind, x: mob.x, y: mob.y, tick: state.tick });
      return true;
    }

    if (!fireStarted) {
      return false;
    }

    player.toolFireCooldown = FAMILIAR_NET_COOLDOWN;
    if (player.familiarNetCapture) {
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.full", playerId: player.id || "", tick: state.tick });
      return true;
    }
    if (hasLiveFamiliarForPlayer(state.world, player)) {
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.active", playerId: player.id || "", action: "catch", tick: state.tick });
      return true;
    }

    const target = findFamiliarNetTarget(state.world, player, input);
    if (!target) {
      const swipe = familiarNetSwipeSegment(player, input);
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.swung", playerId: player.id || "", x: swipe.bx, y: swipe.by, tick: state.tick });
      return true;
    }
    player.familiarNetCapture = {
      kind: target.kind,
      health: clamp(finiteOr(target.health, target.maxHealth), 1, finiteOr(target.maxHealth, target.health || 1)),
      maxHealth: Math.max(1, finiteOr(target.maxHealth, target.health || 1)),
      color: cloneColor(target.color)
    };
    removeMobFromWorld(state.world, target);
    player.toolMode = "idle";
    state.events.push({ type: "familiarNet.caught", playerId: player.id || "", mobId: target.id, kind: target.kind, x: target.x, y: target.y, tick: state.tick });
    return true;
  }

  function isRocketSuitInputActive(player, input) {
    return Boolean(
      player &&
      input &&
      isRocketSuitToolId(input.equippedTool) &&
      playerHasTool(player, ROCKET_SUIT_TOOL_ID) &&
      input.buttons.fire &&
      !hasPlayerStatusEffect(player, "disabled")
    );
  }

  function updateRocketSuitPlayer(state, player, input, dt) {
    player.rocketSuitActive = false;
    if (!isRocketSuitInputActive(player, input)) {
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - ROCKET_SUIT_CHARGE_DECAY * dt);
      return false;
    }

    if (!canSpendPlayerEnergy(player, ROCKET_SUIT_ENERGY_DRAIN * dt)) {
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - ROCKET_SUIT_CHARGE_DECAY * dt);
      return false;
    }

    if (player.landed) {
      detachPlayerFromBody(state.world, player, 95);
    }

    player.energy = Math.max(0, finiteOr(player.energy, 0) - ROCKET_SUIT_ENERGY_DRAIN * dt);
    const aim = aimVector(input);
    const charge = clamp(finiteOr(player.rocketSuitCharge, 0) + ROCKET_SUIT_CHARGE_RATE * dt, 0, 1);
    const thrust = ROCKET_SUIT_BASE_THRUST + ROCKET_SUIT_CHARGE_THRUST * charge;
    player.rocketSuitCharge = charge;
    player.rocketSuitActive = true;
    player.vx += aim.x * thrust * dt;
    player.vy += aim.y * thrust * dt;

    const speed = Math.hypot(player.vx, player.vy);
    const minHitSpeed = ROCKET_IMPACT_SPEED * 0.7;
    if (speed > minHitSpeed) {
      for (const mob of allCombatMobs(state.world)) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0 || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
          continue;
        }
        const dx = mob.x - player.x;
        const dy = mob.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > finiteOr(mob.radius, 28) + finiteOr(player.radius, PLAYER_RADIUS) * 0.72) {
          continue;
        }
        const nx = dx / dist;
        const ny = dy / dist;
        knockMob(mob, nx, ny, ROCKET_SUIT_MOB_KNOCKBACK + speed * 0.22);
        damageMob(state, mob, ROCKET_SUIT_MOB_DAMAGE + Math.max(0, speed - minHitSpeed) * ROCKET_SUIT_MOB_DAMAGE_SPEED_SCALE, "Rocket Suit", player.id || "");
        player.vx -= nx * 120;
        player.vy -= ny * 120;
        break;
      }
    }

    return true;
  }

  function clearPersonalTetherForPlayer(player) {
    if (!player || !player.personalTether) {
      return false;
    }
    player.personalTether = null;
    return true;
  }

  function personalTetherAnchorForPlayer(world, tether) {
    const body = bodyById(world, tether && tether.bodyId);
    if (!body || !isLandableBody(body)) {
      return null;
    }
    const angle = finiteOr(tether.angle, 0);
    const surfaceOffset = Math.max(0, finiteOr(tether.surfaceOffset, 0));
    const radius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + surfaceOffset;
    return {
      body,
      x: finiteOr(body.x, 0) + Math.cos(angle) * radius,
      y: finiteOr(body.y, 0) + Math.sin(angle) * radius
    };
  }

  function findPersonalTetherTargetForPlayer(world, player, input) {
    if (!world || !Array.isArray(world.particles) || !player) {
      return null;
    }
    const aim = aimVector(input);
    const aimAngle = Math.atan2(aim.y, aim.x);
    let best = null;
    let bestScore = Infinity;
    for (const body of world.particles) {
      if (!isLandableBody(body)) {
        continue;
      }
      const dx = finiteOr(body.x, 0) - finiteOr(player.x, 0);
      const dy = finiteOr(body.y, 0) - finiteOr(player.y, 0);
      const projected = dx * aim.x + dy * aim.y;
      const perpendicular = Math.abs(dx * aim.y - dy * aim.x);
      const angle = Math.atan2(finiteOr(player.y, 0) - finiteOr(body.y, 0), finiteOr(player.x, 0) - finiteOr(body.x, 0));
      const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
      const contactRadius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + surfaceOffset;
      const playerDistance = Math.max(0, Math.hypot(dx, dy) - contactRadius);
      if (
        projected < -contactRadius ||
        playerDistance > PERSONAL_TETHER_MAX_ATTACH_DISTANCE ||
        perpendicular > contactRadius + PERSONAL_TETHER_AIM_PADDING
      ) {
        continue;
      }
      const angleDelta = Math.abs(shortestAngleDelta(aimAngle, Math.atan2(dy, dx)));
      const score = Math.max(0, perpendicular - contactRadius) + playerDistance * 0.08 + angleDelta * 18;
      if (score < bestScore) {
        bestScore = score;
        best = { body, angle, surfaceOffset };
      }
    }
    return best;
  }

  function attachPersonalTetherForPlayer(state, player, input) {
    if (!state || !state.world || !player || !playerHasTool(player, PERSONAL_TETHER_TOOL_ID)) {
      return false;
    }
    const target = findPersonalTetherTargetForPlayer(state.world, player, input);
    if (!target || !target.body) {
      state.events.push({ type: "personalTether.empty", playerId: player.id || "", tick: state.tick });
      return false;
    }
    const body = target.body;
    const surfaceRadius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + Math.max(0, finiteOr(target.surfaceOffset, 0));
    const anchorX = finiteOr(body.x, 0) + Math.cos(target.angle) * surfaceRadius;
    const anchorY = finiteOr(body.y, 0) + Math.sin(target.angle) * surfaceRadius;
    const length = Math.hypot(finiteOr(player.x, 0) - anchorX, finiteOr(player.y, 0) - anchorY);
    if (length > PERSONAL_TETHER_MAX_ATTACH_DISTANCE) {
      state.events.push({ type: "personalTether.empty", playerId: player.id || "", tick: state.tick });
      return false;
    }
    player.personalTether = {
      bodyId: body.id,
      angle: target.angle,
      surfaceOffset: Math.max(0, finiteOr(target.surfaceOffset, 0)),
      restLength: clamp(length, 80, PERSONAL_TETHER_MAX_REST_LENGTH),
      deploy: 0.15,
      wobble: seededRange(hashSeed(String(state.tick || 0) + ":personal-tether:" + String(player.id || "")), 0, Math.PI * 2).value
    };
    state.events.push({ type: "personalTether.attached", playerId: player.id || "", bodyId: body.id, tick: state.tick });
    return true;
  }

  function updatePersonalTetherPlayer(state, player, input, dt) {
    if (!state || !state.world || !player || !input) {
      return false;
    }
    const activeTool = isPersonalTetherToolId(input.equippedTool) && playerHasTool(player, PERSONAL_TETHER_TOOL_ID) && !hasPlayerStatusEffect(player, "disabled");
    const fireRequested = activeTool && (input.buttons.fire || input.toolMode === "fire");
    const releaseRequested = activeTool && (input.buttons.release || input.toolMode === "release");
    const fireStarted = fireRequested && !player.personalTetherFireHeld;
    const releaseStarted = releaseRequested && !player.personalTetherReleaseHeld;
    player.personalTetherFireHeld = fireRequested;
    player.personalTetherReleaseHeld = releaseRequested;

    if (releaseStarted) {
      if (clearPersonalTetherForPlayer(player)) {
        state.events.push({ type: "personalTether.detached", playerId: player.id || "", tick: state.tick });
      }
      player.toolMode = "idle";
    } else if (fireStarted) {
      attachPersonalTetherForPlayer(state, player, input);
      player.toolMode = "idle";
    }

    const tether = player.personalTether;
    if (!tether) {
      return false;
    }
    tether.deploy = clamp(finiteOr(tether.deploy, 0) + dt * 5.2, 0, 1);
    const anchor = personalTetherAnchorForPlayer(state.world, tether);
    if (!anchor) {
      clearPersonalTetherForPlayer(player);
      return false;
    }

    const dx = finiteOr(player.x, 0) - anchor.x;
    const dy = finiteOr(player.y, 0) - anchor.y;
    const distance = Math.hypot(dx, dy) || 1;
    const restLength = clamp(finiteOr(tether.restLength, distance), 80, PERSONAL_TETHER_MAX_REST_LENGTH);
    tether.restLength = restLength;
    const tautLength = restLength + PERSONAL_TETHER_GIVE;
    if (distance <= tautLength) {
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const extension = distance - tautLength;
    const relativeSpeed = (finiteOr(player.vx, 0) - finiteOr(anchor.body.vx, 0)) * nx +
      (finiteOr(player.vy, 0) - finiteOr(anchor.body.vy, 0)) * ny;
    const pullSpeed = Math.max(0, relativeSpeed);
    const bodyMassDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(anchor.body.mass, 1)) / 420, 0.32), 0.09, 1.12);
    const bodyAcceleration = clamp(
      (extension * PERSONAL_TETHER_SPRING + pullSpeed * PERSONAL_TETHER_DAMPING) * bodyMassDamping,
      0,
      PERSONAL_TETHER_BODY_MAX_ACCELERATION
    );
    const playerAcceleration = clamp(
      extension * (PERSONAL_TETHER_SPRING + 1.4) + pullSpeed * (PERSONAL_TETHER_DAMPING + 1.2),
      0,
      PERSONAL_TETHER_PLAYER_MAX_ACCELERATION
    );
    applyBodyVelocityChangeAtPoint(anchor.body, nx * bodyAcceleration * dt, ny * bodyAcceleration * dt, anchor.x, anchor.y, BODY_CONSTRAINT_TORQUE_RESPONSE);
    markSurvivalCampBodyMovedByPlayer(anchor.body, player.id || "");
    player.vx -= nx * playerAcceleration * dt;
    player.vy -= ny * playerAcceleration * dt;

    if (extension > 180) {
      const correction = (extension - 180) * 0.08;
      anchor.body.x += nx * correction * bodyMassDamping;
      anchor.body.y += ny * correction * bodyMassDamping;
      player.x -= nx * correction * 0.42;
      player.y -= ny * correction * 0.42;
    }
    return true;
  }

  function stepPlayer(state, player, input, dt) {
    if (!player) {
      return;
    }
    player.energy = Math.min(
      finiteOr(player.maxEnergy, PLAYER_MAX_ENERGY),
      clamp(finiteOr(player.energy, finiteOr(player.maxEnergy, PLAYER_MAX_ENERGY)), 0, finiteOr(player.maxEnergy, PLAYER_MAX_ENERGY)) + PLAYER_ENERGY_REGEN * dt
    );
    const safeInput = sanitizeInput(input, player, { dt, requireEnergy: true });
    player.lastInputSeq = Math.max(player.lastInputSeq || 0, safeInput.seq);
    player.aimAngle = safeInput.aimAngle;
    player.aimLocalAngle = safeInput.aimLocalAngle;
    player.equippedTool = safeInput.equippedTool;
    player.toolMode = safeInput.toolMode;
    player.boosting = false;
    player.jetpackMoveX = 0;
    player.jetpackMoveY = -1;
    player.hitCooldown = Math.max(0, finiteOr(player.hitCooldown, 0) - dt);
    player.invulnerableTimer = Math.max(0, finiteOr(player.invulnerableTimer, 0) - dt);
    updatePlayerStatusEffects(player, dt);
    player.toolFireCooldown = Math.max(0, finiteOr(player.toolFireCooldown, 0) - dt);

    if (player.health <= 0) {
      player.respawnTimer = Math.max(0, finiteOr(player.respawnTimer, 0));
      player.moving = false;
      player.crouching = false;
      player.rocketSuitActive = false;
      player.rocketSuitCharge = 0;
      player.toolMode = "idle";
      player.landed = null;
      player.spacecraftInterior = null;
      clearPersonalTetherForPlayer(player);
      return;
    }

    if (player.spacecraftInterior) {
      updateSpacecraftInteriorPlayer(state, player, safeInput, dt);
      player.toolMode = "idle";
      player.rocketSuitActive = false;
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - ROCKET_SUIT_CHARGE_DECAY * dt);
      return;
    }

    // Preserve speed carried away from a moving surface. The normal jetpack
    // limit should cap new acceleration, not erase momentum on the next frame.
    const carriedSpeed = Math.hypot(finiteOr(player.vx, 0), finiteOr(player.vy, 0));
    const rocketSuitActive = updateRocketSuitPlayer(state, player, safeInput, dt);
    let landedThisFrame = false;
    if (safeInput.buttons.land && !player.landed && safeInput.landAction !== "takeoff") {
      landedThisFrame = togglePlayerLanding(state, player);
    }
    if (player.landed) {
      const landedInput = landedThisFrame
        ? { ...safeInput, buttons: { ...safeInput.buttons, land: false } }
        : safeInput;
      updateLandedPlayer(state, player, landedInput, dt);
      useSpannerOnStructure(state, player, landedInput, dt);
      firePlayerEmpTool(state, player, landedInput);
      useFamiliarNet(state, player, landedInput);
      updatePersonalTetherPlayer(state, player, landedInput, dt);
      firePlayerPistonPunch(state, player, landedInput);
      firePlayerWeapon(state, player, landedInput);
      return;
    }

    let localX = 0;
    let localY = 0;
    if (safeInput.buttons.left) localX -= 1;
    if (safeInput.buttons.right) localX += 1;
    if (safeInput.buttons.up) localY -= 1;
    if (safeInput.buttons.down) localY += 1;

    const vacuumHoldActive = isSuctionToolId(safeInput.equippedTool) && (safeInput.buttons.hold || safeInput.toolMode === "hold");
    const suctionActive = isSuctionToolId(safeInput.equippedTool) && (safeInput.buttons.pull || safeInput.buttons.push || safeInput.buttons.hold);
    const canBoost = safeInput.buttons.boost && !suctionActive;
    if (canBoost) {
      player.energy = Math.max(0, player.energy - JETPACK_BOOST_ENERGY_DRAIN * dt);
    }
    if (suctionActive) {
      player.energy = Math.max(0, player.energy - SUCTION_ENERGY_DRAIN * dt);
    }

    const move = localX || localY ? normalize(localX, localY) : null;
    if (!vacuumHoldActive && move) {
      const thrust = 640 * (suctionActive ? 0.56 : 1) * (canBoost ? JETPACK_BOOST_THRUST_MULTIPLIER : 1);
      player.vx += move.x * thrust * dt;
      player.vy += move.y * thrust * dt;
    }

    const speed = Math.hypot(player.vx, player.vy);
    const rocketSuitMaxSpeed = ROCKET_SUIT_BASE_MAX_SPEED + clamp(finiteOr(player.rocketSuitCharge, 0), 0, 1) * ROCKET_SUIT_CHARGE_MAX_SPEED;
    const controlledMaxSpeed = vacuumHoldActive ? 0 : (rocketSuitActive ? rocketSuitMaxSpeed : (suctionActive ? 275 : 430 * (canBoost ? JETPACK_BOOST_SPEED_MULTIPLIER : 1)));
    const maxSpeed = vacuumHoldActive ? 0 : Math.max(controlledMaxSpeed, carriedSpeed);
    if (speed > maxSpeed) {
      player.vx = (player.vx / speed) * maxSpeed;
      player.vy = (player.vy / speed) * maxSpeed;
    }

    const drag = Math.pow(0.58, dt);
    player.vx *= drag;
    player.vy *= drag;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    if (updatePlayerSpacecraftEntry(state, player)) {
      player.toolMode = "idle";
      return;
    }
    useSpannerOnStructure(state, player, safeInput, dt);
    firePlayerEmpTool(state, player, safeInput);
    useFamiliarNet(state, player, safeInput);
    updatePersonalTetherPlayer(state, player, safeInput, dt);
    firePlayerPistonPunch(state, player, safeInput);
    firePlayerWeapon(state, player, safeInput);
    player.moving = Boolean(move);
    player.boosting = Boolean(canBoost && move);
    if (move) {
      player.jetpackMoveX = move.x;
      player.jetpackMoveY = move.y;
    }
    player.crouching = false;
  }

  function solidContactRadius(body) {
    if (isStarBody(body)) {
      return Math.max(1, finiteOr(body.radius, 1)) * 1.06;
    }
    return body && body.tier && body.tier.solid ? Math.max(body.radius * 0.78, body.radius - 14) : finiteOr(body && body.radius, 1);
  }

  function starParticleColor(star) {
    return mixColor({ r: 255, g: 210, b: 92 }, normalizeColor(star && star.color, { r: 255, g: 140, b: 70 }), 3, 2);
  }

  function emitStarParticle(state, seedHolder, star) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return false;
    }
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    const tangent = randomRange(seedHolder, -62, 62);
    const spawnDistance = solidContactRadius(star) + randomRange(seedHolder, 58, 108);
    const mass = randomRange(seedHolder, 0, 1) < 0.78 ? 1 : 2;
    const id = world.nextParticleId++;
    const textureSeed = randomRange(seedHolder, 0, 1000);
    const particle = normalizeParticle({
      id,
      x: star.x + nx * spawnDistance,
      y: star.y + ny * spawnDistance,
      vx: finiteOr(star.vx, 0) * 0.35 + nx * randomRange(seedHolder, 78, 178) - ny * tangent,
      vy: finiteOr(star.vy, 0) * 0.35 + ny * randomRange(seedHolder, 78, 178) + nx * tangent,
      mass,
      color: starParticleColor(star),
      textureSeed,
      wobble: randomRange(seedHolder, 0, Math.PI * 2),
      pulse: randomRange(seedHolder, 0.8, 1.25),
      spawnAge: 0,
      spawnSizeScale: ambientSpawnSizeScale(id, textureSeed)
    }, id, seedHolder);
    world.particles.push(particle);
    return true;
  }

  function recycleAmbientParticleForStarEmission(world, star) {
    if (!world || !Array.isArray(world.particles)) {
      return false;
    }
    let removeIndex = -1;
    let removeScore = -Infinity;
    const protectedRadius = solidContactRadius(star) + 420;

    for (let i = 0; i < world.particles.length; i += 1) {
      const body = world.particles[i];
      if (
        !body ||
        body === star ||
        !body.tier ||
        body.tier.name !== "particle" ||
        body.randomEventId ||
        finiteOr(body.ufoSapTimer, 0) > 0
      ) {
        continue;
      }

      const distanceFromStar = Math.hypot(finiteOr(body.x, 0) - finiteOr(star.x, 0), finiteOr(body.y, 0) - finiteOr(star.y, 0));
      if (distanceFromStar < protectedRadius) {
        continue;
      }
      const score = distanceFromStar + Math.max(0, finiteOr(body.mass, 1) - 1) * 70;
      if (score > removeScore) {
        removeScore = score;
        removeIndex = i;
      }
    }

    if (removeIndex < 0) {
      return false;
    }
    world.particles.splice(removeIndex, 1);
    return true;
  }

  function updateStarParticleEmission(state, body, dt) {
    if (!isStarBody(body)) {
      return;
    }
    body.starBirthAge = Math.min(
      STAR_BIRTH_TRANSITION_DURATION,
      Math.max(0, finiteOr(body.starBirthAge, STAR_BIRTH_TRANSITION_DURATION)) + dt
    );
    body.starEmissionAccumulator = finiteOr(body.starEmissionAccumulator, 0) + starParticleEmissionRate(body) * dt;
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state && state.seed, 1))) >>> 0 };
    const playerCount = Math.max(1, Object.keys(state && state.players || {}).length);
    const particleBudget = AMBIENT_PARTICLE_PLAYFIELD_TARGET * playerCount * 4 + 56;
    let emitted = 0;
    while (
      body.starEmissionAccumulator >= 1 &&
      emitted < STAR_PARTICLE_EMISSION_MAX_PER_FRAME
    ) {
      if (state.world.particles.length >= particleBudget && !recycleAmbientParticleForStarEmission(state.world, body)) {
        break;
      }
      body.starEmissionAccumulator -= 1;
      if (!emitStarParticle(state, seedHolder, body)) {
        break;
      }
      emitted += 1;
    }
    state.seed = seedHolder.seed >>> 0;
  }

  function syncLandedPlayersToSurfaces(state) {
    if (!state || !state.players) {
      return;
    }
    for (const player of Object.values(state.players)) {
      if (player && player.landed && player.health > 0) {
        applyLandedSurfaceConstraint(state.world, player);
      }
    }
  }

  const SOLID_BODY_BACKGROUND_DAMPING = 0.992;

  function applySolidBodyBackgroundDamping(body, dt) {
    if (!body || !body.tier || !body.tier.solid || body.gadgetStabilized) {
      return;
    }
    body.vx *= Math.pow(SOLID_BODY_BACKGROUND_DAMPING, dt);
    body.vy *= Math.pow(SOLID_BODY_BACKGROUND_DAMPING, dt);
    if (Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0)) < 0.08) {
      body.vx = 0;
      body.vy = 0;
    }
  }

  function integrateBody(state, body, dt, tick) {
    if (!body) {
      return;
    }
    const tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
    body.tier = clone(tier);
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    decayGadgetPullContactIntent(body, dt);
    if (!tier.solid) {
      body.vx += Math.sin(body.wobble + tick * 0.011) * 4 * dt;
      body.vy += Math.cos(body.wobble * 1.7 + tick * 0.009) * 4 * dt;
      body.vx *= Math.pow(0.82, dt);
      body.vy *= Math.pow(0.82, dt);
    } else {
      applySolidBodyBackgroundDamping(body, dt);
    }
    body.ufoSapTimer = Math.max(0, finiteOr(body.ufoSapTimer, 0) - dt);
    body.ufoSapSourceGraceTimer = Math.max(0, finiteOr(body.ufoSapSourceGraceTimer, 0) - dt);
    body.spawnAge = Math.min(
      PARTICLE_SPAWN_TRANSITION_DURATION,
      Math.max(0, finiteOr(body.spawnAge, PARTICLE_SPAWN_TRANSITION_DURATION)) + dt
    );
    updateStarParticleEmission(state, body, dt);
    applyOrbitCaptureForces(body, state.world.particles, dt);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    maybeWakeSurvivalCampFromMovedBody(state, body);
    body.rotation = finiteOr(body.rotation, 0);
    body.angularVelocity = clamp(finiteOr(body.angularVelocity, 0), -BODY_MAX_ANGULAR_SPEED, BODY_MAX_ANGULAR_SPEED);
    if (Math.abs(body.angularVelocity) > 0.000001) {
      body.angularVelocity *= Math.pow(BODY_ANGULAR_VELOCITY_DAMPING, dt);
      const angleStep = body.angularVelocity * dt;
      if (Math.abs(angleStep) > 0.000001) {
        body.rotation += angleStep;
        rotateBodyMountedFrame(state, body.id, angleStep);
      }
    } else {
      body.angularVelocity = 0;
    }
  }

  function resolvePlayerBodyCollisions(state) {
    const players = Object.values(state.players || {});
    for (const body of state.world.particles) {
      if (!body.tier) {
        continue;
      }
      const solid = Boolean(body.tier.solid);
      for (const player of players) {
        if (player.health <= 0) {
          continue;
        }
        if (player.spacecraftInterior) {
          continue;
        }
        if (player.landed && player.landed.bodyId === body.id && !isStarBody(body)) {
          continue;
        }
        const dx = player.x - body.x;
        const dy = player.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = player.radius + (solid ? solidContactRadius(body) : body.radius * 0.96);
        if (dist >= minDist) {
          continue;
        }
        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        const bodyShare = solid ? clamp(4 / (body.mass + 4), 0.03, 0.28) : clamp(18 / (body.mass + 18), 0.48, 0.92);
        const playerShare = solid ? 1 - bodyShare : 1 - bodyShare;
        if (isSelfVacuumPulledBodyContact(player, body, nx, ny)) {
          markSurvivalCampBodyMovedByPlayer(body, player.id || "");
          resolveSelfVacuumPulledBodyContact(player, body, nx, ny, overlap, 0.88);
          continue;
        }
        player.x += nx * overlap * playerShare;
        player.y += ny * overlap * playerShare;
        body.x -= nx * overlap * bodyShare;
        body.y -= ny * overlap * bodyShare;
        markSurvivalCampBodyMovedByPlayer(body, player.id || "");
        const relativeVelocity = (player.vx - body.vx) * nx + (player.vy - body.vy) * ny;
        const incomingSpeed = Math.max(0, -relativeVelocity);
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * (solid ? 0.92 : 0.72);
          const playerImpulseShare = solid ? 0.72 : 0.18;
          const bodyImpulseShare = solid ? bodyShare : clamp(18 / (body.mass + 4), 0.35, 1.4);
          const pointX = finiteOr(body.x, 0) + nx * bodyAngularInertiaRadius(body);
          const pointY = finiteOr(body.y, 0) + ny * bodyAngularInertiaRadius(body);
          player.vx += nx * impulse * playerImpulseShare;
          player.vy += ny * impulse * playerImpulseShare;
          applyBodyVelocityChangeAtPoint(body, -nx * impulse * bodyImpulseShare, -ny * impulse * bodyImpulseShare, pointX, pointY, BODY_CONSTRAINT_TORQUE_RESPONSE);
        }
        const damageSpeed = SOLID_BODY_PLAYER_DAMAGE_SPEED;
        if (solid && incomingSpeed > damageSpeed && player.hitCooldown <= 0 && player.invulnerableTimer <= 0) {
          damagePlayer(state, player, Math.min(80, 10 + (incomingSpeed - damageSpeed) * 0.16 + Math.sqrt(body.mass) * 0.55), "body-impact");
        }
        if (isStarBody(body) && player.hitCooldown <= 0 && player.invulnerableTimer <= 0) {
          player.vx += nx * STAR_CONTACT_KNOCKBACK;
          player.vy += ny * STAR_CONTACT_KNOCKBACK;
          damagePlayer(state, player, STAR_CONTACT_DAMAGE_PER_SECOND * STAR_CONTACT_DAMAGE_COOLDOWN, "star-contact");
          state.events.push({
            type: "player.hitByStar",
            playerId: player.id,
            x: player.x,
            y: player.y,
            color: cloneColor(body.color),
            tick: state.tick
          });
        }
      }
    }
  }

  function isMergeBlockingTether(structure) {
    return Boolean(
      structure &&
      structure.type === "tether" &&
      finiteOr(structure.health, structureMaxHealth(structure.type)) > 0 &&
      !isStructureDisabled(structure) &&
      structure.bodyId &&
      structure.linkedBodyId &&
      structure.bodyId !== structure.linkedBodyId
    );
  }

  function areBodiesTetherConnected(world, a, b) {
    if (!world || !a || !b || a.id === b.id || !Array.isArray(world.structures)) {
      return false;
    }

    const targetId = b.id;
    const pending = [a.id];
    const visited = new Set(pending);

    while (pending.length) {
      const bodyId = pending.pop();

      for (const structure of world.structures) {
        if (!isMergeBlockingTether(structure)) {
          continue;
        }

        let nextBodyId = 0;
        if (structure.bodyId === bodyId) {
          nextBodyId = structure.linkedBodyId;
        } else if (structure.linkedBodyId === bodyId) {
          nextBodyId = structure.bodyId;
        }

        if (!nextBodyId || visited.has(nextBodyId)) {
          continue;
        }
        if (nextBodyId === targetId) {
          return true;
        }

        visited.add(nextBodyId);
        pending.push(nextBodyId);
      }
    }

    return false;
  }

  function resolveBodyBounce(a, b, dx, dy, minDist) {
    const rawDist = Math.hypot(dx, dy);
    const dist = rawDist || 1;
    const nx = rawDist ? dx / dist : 1;
    const ny = rawDist ? dy / dist : 0;
    const overlap = Math.max(0, minDist - dist);
    const firstMass = Math.max(1, finiteOr(a && a.mass, 1));
    const secondMass = Math.max(1, finiteOr(b && b.mass, 1));
    const totalMass = firstMass + secondMass;
    const firstShare = clamp(secondMass / totalMass, 0.08, 0.92);
    const secondShare = clamp(firstMass / totalMass, 0.08, 0.92);

    a.x -= nx * overlap * firstShare;
    a.y -= ny * overlap * firstShare;
    b.x += nx * overlap * secondShare;
    b.y += ny * overlap * secondShare;

    const relativeVelocity = (finiteOr(b.vx, 0) - finiteOr(a.vx, 0)) * nx +
      (finiteOr(b.vy, 0) - finiteOr(a.vy, 0)) * ny;
    if (relativeVelocity < 0) {
      const impulse = -relativeVelocity * 0.86;
      const contactX = (finiteOr(a.x, 0) + finiteOr(b.x, 0)) * 0.5;
      const contactY = (finiteOr(a.y, 0) + finiteOr(b.y, 0)) * 0.5;
      applyBodyVelocityChangeAtPoint(a, -nx * impulse * firstShare, -ny * impulse * firstShare, contactX, contactY, BODY_CONSTRAINT_TORQUE_RESPONSE);
      applyBodyVelocityChangeAtPoint(b, nx * impulse * secondShare, ny * impulse * secondShare, contactX, contactY, BODY_CONSTRAINT_TORQUE_RESPONSE);
    }
  }

  function damagePlayer(state, player, damage, cause) {
    if (player && player.spacecraftTarget) {
      return damageSpacecraftTarget(state, player, damage, cause);
    }
    if (!player || player.health <= 0 || player.invulnerableTimer > 0) {
      return false;
    }
    player.health = Math.max(0, player.health - Math.max(0, finiteOr(damage, 0)));
    player.hitCooldown = Math.max(player.hitCooldown || 0, 0.72);
    if (player.health <= 0) {
      player.respawnTimer = 2.4;
      state.events.push({
        type: "player.died",
        playerId: player.id,
        cause: cause || "unknown",
        tick: state.tick
      });
    }
    return true;
  }

  function destroyStructuresForStarMerge(state, keep, absorb) {
    const world = state && state.world;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    const ids = new Set([keep && keep.id, absorb && absorb.id]);
    let destroyed = 0;
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (structure && (ids.has(structure.bodyId) || ids.has(structure.linkedBodyId))) {
        dropStructureTechPickupsForMerge(state, structure);
        structures.splice(i, 1);
        destroyed += 1;
      }
    }
    return destroyed;
  }

  function droppedStructureTechCount(amount) {
    return Math.max(1, Math.floor(Math.max(0, finiteOr(amount, 0)) * 0.75));
  }

  function dropStructureTechPickupsForMerge(state, structure) {
    const world = state && state.world;
    if (!state || !world || !structure) {
      return 0;
    }
    let dropped = 0;
    const recipe = recipeByStructureType(structure.type);
    const x = finiteOr(structure.x, 0);
    const y = finiteOr(structure.y, 0);
    const vx = finiteOr(structure.vx, 0);
    const vy = finiteOr(structure.vy, 0);
    if (recipe && recipe.cost) {
      for (const [techKey, amount] of Object.entries(recipe.cost)) {
        if (!TECH_KEYS.includes(techKey)) {
          continue;
        }
        const count = droppedStructureTechCount(amount);
        for (let i = 0; i < count; i += 1) {
          createTechPickup(state, techKey, x, y, vx, vy);
          dropped += 1;
        }
      }
    }

    const storedTech = cloneTechInventory(structure.tech);
    for (const key of TECH_KEYS) {
      const count = Math.max(0, Math.floor(finiteOr(storedTech[key], 0)));
      for (let i = 0; i < count; i += 1) {
        createTechPickup(state, key, x, y, vx, vy);
        dropped += 1;
      }
    }
    return dropped;
  }

  function ejectPlayerFromStarBirth(player, star) {
    if (!player || !player.landed || !star) {
      return;
    }
    const angle = Math.atan2(finiteOr(player.y, star.y) - star.y, finiteOr(player.x, star.x) - star.x);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    player.x = star.x + nx * (star.radius * 1.06 + finiteOr(player.radius, PLAYER_RADIUS) + 36);
    player.y = star.y + ny * (star.radius * 1.06 + finiteOr(player.radius, PLAYER_RADIUS) + 36);
    player.vx = finiteOr(star.vx, 0) + nx * STAR_CONTACT_KNOCKBACK;
    player.vy = finiteOr(star.vy, 0) + ny * STAR_CONTACT_KNOCKBACK;
    player.landed = null;
  }

  function stellarGrowthSourceForMerge(a, b, fallback) {
    if (a && (a.stellarGrowthStarted || normalizedStellarOutcomeName(a.stellarOutcome) || a.tier && a.tier.name === "star")) {
      return a;
    }
    if (b && (b.stellarGrowthStarted || normalizedStellarOutcomeName(b.stellarOutcome) || b.tier && b.tier.name === "star")) {
      return b;
    }
    return fallback || a || b || null;
  }

  function copyStellarGrowthState(target, source) {
    target.stellarGrowthStarted = Boolean(source && source.stellarGrowthStarted);
    target.stellarGrowthRate = Math.max(0, finiteOr(source && source.stellarGrowthRate, 0));
    target.stellarGrowthLastSampleAt = Math.max(0, finiteOr(source && source.stellarGrowthLastSampleAt, 0));
    target.stellarOutcome = normalizedStellarOutcomeName(source && source.stellarOutcome);
  }

  function survivalCampMergeSource(sources) {
    for (const source of sources) {
      if (source && source.survivalCampBody && source.survivalCampId) {
        return source;
      }
    }
    return null;
  }

  function clearSurvivalCampMergeState(body) {
    if (!body) {
      return;
    }
    body.survivalCampId = "";
    body.survivalCampX = finiteOr(body.x, 0);
    body.survivalCampY = finiteOr(body.y, 0);
    body.survivalCampHomeX = Number.NaN;
    body.survivalCampHomeY = Number.NaN;
    body.survivalCampMovedByPlayer = false;
    body.survivalCampBodyMovedWakeSent = false;
    body.survivalCampLastMoverPlayerId = "";
    body.survivalCampBody = false;
  }

  function applySurvivalCampMergeState(merged, sources, options) {
    if (options && options.clearCampState) {
      clearSurvivalCampMergeState(merged);
      return;
    }
    const source = survivalCampMergeSource(sources);
    if (!merged || !source) {
      return;
    }
    merged.survivalCampId = source.survivalCampId;
    merged.survivalCampX = finiteOr(source.survivalCampX, merged.x);
    merged.survivalCampY = finiteOr(source.survivalCampY, merged.y);
    merged.survivalCampHomeX = finiteOr(merged.x, source.survivalCampHomeX);
    merged.survivalCampHomeY = finiteOr(merged.y, source.survivalCampHomeY);
    merged.survivalCampMovedByPlayer = false;
    merged.survivalCampBodyMovedWakeSent = false;
    merged.survivalCampLastMoverPlayerId = "";
    merged.survivalCampBody = true;
  }

  function updateStellarGrowthForMerge(body, previousMass, gainedMass, nowSeconds) {
    if (!body || finiteOr(body.mass, 0) < thresholdForTierName("star")) {
      return;
    }
    const now = Math.max(0, finiteOr(nowSeconds, 0));
    if (previousMass < thresholdForTierName("star")) {
      body.stellarGrowthStarted = true;
      body.stellarGrowthLastSampleAt = now;
      if (finiteOr(body.mass, 0) >= STELLAR_EVOLUTION_END_THRESHOLD) {
        body.stellarGrowthRate = Math.max(finiteOr(body.stellarGrowthRate, 0), Math.max(0, finiteOr(body.mass, 0) - thresholdForTierName("star")));
      }
      return;
    }
    const elapsed = Math.max(1 / 30, now - finiteOr(body.stellarGrowthLastSampleAt, now));
    const instantRate = Math.max(0, finiteOr(gainedMass, 0)) / elapsed;
    const previousRate = Math.max(0, finiteOr(body.stellarGrowthRate, 0));
    const alpha = clamp(elapsed / Math.max(0.001, STELLAR_GROWTH_AVERAGE_WINDOW_SECONDS), 0.08, 0.55);
    body.stellarGrowthRate = previousRate > 0 ? previousRate + (instantRate - previousRate) * alpha : instantRate;
    body.stellarGrowthStarted = true;
    body.stellarGrowthLastSampleAt = now;
  }

  function finalizeStellarOutcomeTier(body) {
    if (!body) {
      return;
    }
    if (finiteOr(body.mass, 0) >= STELLAR_EVOLUTION_END_THRESHOLD) {
      body.stellarOutcome = normalizedStellarOutcomeName(body.stellarOutcome) || stellarOutcomeForGrowthRate(body.stellarGrowthRate);
    }
    body.tier = clone(tierForMassAndStellarOutcome(body.mass, body.stellarOutcome));
    body.radius = radiusFromMassForTier(body.mass, body.tier);
  }

  function playerScoredBodyIds(state, player) {
    const world = state && state.world;
    const bodyIds = new Set();
    if (!world || !player) {
      return bodyIds;
    }

    if (player.landed && bodyById(world, player.landed.bodyId)) {
      bodyIds.add(Math.floor(finiteOr(player.landed.bodyId, 0)));
    }

    const playerId = String(player.id || "");
    for (const structure of world.structures || []) {
      if (!structure || String(structure.ownerPlayerId || "") !== playerId) {
        continue;
      }
      if (structure.bodyId && bodyById(world, structure.bodyId)) {
        bodyIds.add(Math.floor(finiteOr(structure.bodyId, 0)));
      }
      if (structure.linkedBodyId && bodyById(world, structure.linkedBodyId)) {
        bodyIds.add(Math.floor(finiteOr(structure.linkedBodyId, 0)));
      }
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const structure of world.structures || []) {
        if (!structure || !structure.linkedBodyId) {
          continue;
        }
        const firstId = Math.floor(finiteOr(structure.bodyId, 0));
        const secondId = Math.floor(finiteOr(structure.linkedBodyId, 0));
        const firstKnown = bodyIds.has(firstId);
        const secondKnown = bodyIds.has(secondId);
        if (firstKnown && !secondKnown && bodyById(world, secondId)) {
          bodyIds.add(secondId);
          changed = true;
        } else if (secondKnown && !firstKnown && bodyById(world, firstId)) {
          bodyIds.add(firstId);
          changed = true;
        }
      }
    }

    return bodyIds;
  }

  function playerIdForScoredBody(state, body) {
    if (!state || !body) {
      return "";
    }
    for (const player of Object.values(state.players || {})) {
      if (playerScoredBodyIds(state, player).has(body.id)) {
        return String(player.id || "");
      }
    }
    return "";
  }

  function wakeSurvivalCampFromPlayerBodyMerge(state, absorber, absorbed) {
    const absorberPlayerId = playerIdForScoredBody(state, absorber);
    const absorbedPlayerId = playerIdForScoredBody(state, absorbed);
    let campBody = null;
    let playerId = "";
    if (absorbed && absorbed.survivalCampBody && absorberPlayerId) {
      campBody = absorbed;
      playerId = absorberPlayerId;
    } else if (absorber && absorber.survivalCampBody && absorbedPlayerId) {
      campBody = absorber;
      playerId = absorbedPlayerId;
    }
    if (!campBody || !playerId) {
      return false;
    }
    if (typeof wakeSurvivalCampFromBody === "function") {
      return wakeSurvivalCampFromBody(state, campBody, playerId, { allowScoredBody: true });
    }
    return false;
  }

  function bodyAbsorptionTierRank(body) {
    if (!body || !body.tier) {
      return -1;
    }
    const tierName = String(body.tier.name || "");
    const bodyTierIndex = BODY_TIERS.findIndex((candidate) => candidate.name === tierName);
    if (bodyTierIndex >= 0) {
      return bodyTierIndex;
    }
    const stellarIndex = STELLAR_BRANCH_TIERS.findIndex((candidate) => candidate.name === tierName);
    return stellarIndex >= 0 ? BODY_TIERS.length + stellarIndex : -1;
  }

  function canAbsorbBody(absorber, absorbed) {
    const absorberRank = bodyAbsorptionTierRank(absorber);
    const absorbedRank = bodyAbsorptionTierRank(absorbed);
    if (absorberRank < 0 || absorbedRank < 0) {
      return false;
    }
    if (absorberRank === absorbedRank) {
      return absorberRank === 0 && absorbedRank === 0;
    }
    return absorberRank > absorbedRank;
  }

  function absorbingCollisionPair(a, b) {
    const aCanAbsorb = canAbsorbBody(a, b);
    const bCanAbsorb = canAbsorbBody(b, a);
    if (aCanAbsorb && bCanAbsorb) {
      return finiteOr(a.mass, 0) >= finiteOr(b.mass, 0)
        ? { absorber: a, absorbed: b }
        : { absorber: b, absorbed: a };
    }
    if (aCanAbsorb) {
      return { absorber: a, absorbed: b };
    }
    if (bCanAbsorb) {
      return { absorber: b, absorbed: a };
    }
    return null;
  }

  function emitBodyCrashDebris(state, a, b, dx, dy) {
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const relVx = finiteOr(b.vx, 0) - finiteOr(a.vx, 0);
    const relVy = finiteOr(b.vy, 0) - finiteOr(a.vy, 0);
    const impactSpeed = Math.hypot(relVx, relVy);
    if (impactSpeed < 320) {
      return 0;
    }
    const lossCount = clamp(Math.floor((impactSpeed - 260) / 130), 1, 6);
    let emitted = 0;
    emitted += shedCrashParticlesFromBody(state, a, -nx, -ny, lossCount);
    emitted += shedCrashParticlesFromBody(state, b, nx, ny, lossCount);
    return emitted;
  }

  function shedCrashParticlesFromBody(state, body, nx, ny, requestedLoss) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles) || !body || body.tier && body.tier.name === "particle") {
      return 0;
    }
    const availableLoss = Math.max(0, Math.floor(finiteOr(body.mass, 1) - 1));
    const count = Math.min(Math.max(0, Math.floor(finiteOr(requestedLoss, 0))), availableLoss);
    if (count <= 0) {
      return 0;
    }

    const sideX = -ny;
    const sideY = nx;
    const contactRadius = Math.max(8, finiteOr(body.radius, radiusFromMass(body.mass)) + 28);
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const color = ejectedParticleColor(body);
    for (let i = 0; i < count; i += 1) {
      const id = world.nextParticleId++;
      const spread = count > 1 ? (i / (count - 1) - 0.5) : 0;
      const burst = randomRange(seedHolder, 70, 170);
      const textureSeed = randomRange(seedHolder, 0, 1000);
      world.particles.push(normalizeParticle({
        id,
        x: finiteOr(body.x, 0) + nx * contactRadius + sideX * spread * 22,
        y: finiteOr(body.y, 0) + ny * contactRadius + sideY * spread * 22,
        vx: finiteOr(body.vx, 0) * 0.35 + nx * burst + sideX * randomRange(seedHolder, -58, 58),
        vy: finiteOr(body.vy, 0) * 0.35 + ny * burst + sideY * randomRange(seedHolder, -58, 58),
        mass: 1,
        color,
        textureSeed,
        wobble: randomRange(seedHolder, 0, Math.PI * 2),
        pulse: randomRange(seedHolder, 0.8, 1.25),
        spawnAge: 0,
        spawnSizeScale: ambientSpawnSizeScale(id, textureSeed),
        ufoSapSourceGraceTimer: 0.45,
        ufoExtractedFromId: body.id
      }, id, seedHolder));
    }
    state.seed = seedHolder.seed >>> 0;
    body.mass = Math.max(1, finiteOr(body.mass, 1) - count);
    body.tier = clone(tierForMassAndStellarOutcome(body.mass, body.stellarOutcome));
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    normalizeBodyEnergy(world, body);
    return count;
  }

  function structureTouchesBody(structure, bodyId) {
    return Boolean(structure && (structure.bodyId === bodyId || structure.linkedBodyId === bodyId));
  }

  function ejectedParticleColor(body) {
    return mixColor(normalizeColor(body && body.color, { r: 110, g: 190, b: 255 }), { r: 255, g: 255, b: 255 }, 4, 1);
  }

  function destroyAbsorbedBodyStructuresForMerge(state, absorbed) {
    const world = state && state.world;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    let destroyed = 0;
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (!structureTouchesBody(structure, absorbed && absorbed.id)) {
        continue;
      }
      dropStructureTechPickupsForMerge(state, structure);
      structures.splice(i, 1);
      destroyed += 1;
    }
    return destroyed;
  }

  function mergeParticlePair(state, a, b, removed) {
    if (!a || !b || removed.has(a.id) || removed.has(b.id)) {
      return false;
    }
    if (
      (finiteOr(a.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(a.ufoExtractedFromId, 0))) === b.id) ||
      (finiteOr(b.ufoSapSourceGraceTimer, 0) > 0 && Math.max(0, Math.floor(finiteOr(b.ufoExtractedFromId, 0))) === a.id)
    ) {
      return false;
    }
    if (areBodiesTetherConnected(state.world, a, b)) {
      return false;
    }
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const mergeDistance = a.radius + b.radius;
    if (dx * dx + dy * dy > mergeDistance * mergeDistance) {
      return false;
    }
    if (shouldOrbitPreventMerge(a, b)) {
      resolveOrbitPreventedMerge(a, b);
      return false;
    }
    const absorbingPair = absorbingCollisionPair(a, b);
    if (!absorbingPair) {
      emitBodyCrashDebris(state, a, b, dx, dy);
      resolveBodyBounce(a, b, dx, dy, mergeDistance);
      return false;
    }

    const totalMass = a.mass + b.mass;
    const keep = absorbingPair.absorber;
    const absorb = absorbingPair.absorbed;
    const keepIsScoredBody = Boolean(playerIdForScoredBody(state, keep));
    wakeSurvivalCampFromPlayerBodyMerge(state, keep, absorb);
    const previousTier = a.tier.threshold >= b.tier.threshold ? a.tier : b.tier;
    const stellarSource = stellarGrowthSourceForMerge(a, b, keep);
    const previousStellarMass = Math.max(0, finiteOr(stellarSource && stellarSource.mass, 0));
    const gainedStellarMass = Math.max(0, totalMass - previousStellarMass);
    let nextTier = tierForMass(totalMass);
    const graduated = nextTier.threshold > previousTier.threshold || (totalMass >= STELLAR_EVOLUTION_END_THRESHOLD && !STELLAR_OUTCOME_TIER_NAMES.includes(previousTier.name));
    const becameStar = nextTier.name === "star" && previousTier.name !== "star";
    const color = graduated ? mixColor(a.color, b.color, a.mass, b.mass) : keep.color;
    const previousMergeRadius = Math.max(finiteOr(a.radius, 0), finiteOr(b.radius, 0));
    const keptStarBirthAge = finiteOr(keep.starBirthAge, STAR_BIRTH_TRANSITION_DURATION);
    const keptStarEmissionAccumulator = finiteOr(keep.starEmissionAccumulator, 0);
    keep.x = (a.x * a.mass + b.x * b.mass) / totalMass;
    keep.y = (a.y * a.mass + b.y * b.mass) / totalMass;
    keep.vx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
    keep.vy = (a.vy * a.mass + b.vy * b.mass) / totalMass;
    keep.mass = totalMass;
    keep.radius = radiusFromMass(totalMass);
    keep.tier = clone(nextTier);
    keep.rotation = keep === a ? finiteOr(a.rotation, 0) : finiteOr(b.rotation, 0);
    keep.angularVelocity = clamp(
      (finiteOr(a.angularVelocity, 0) * a.mass + finiteOr(b.angularVelocity, 0) * b.mass) / totalMass,
      -BODY_MAX_ANGULAR_SPEED,
      BODY_MAX_ANGULAR_SPEED
    );
    keep.color = color;
    keep.starBirthAge = becameStar ? 0 : nextTier.name === "star" ? keptStarBirthAge : 0;
    keep.starEmissionAccumulator = nextTier.name === "star" ? keptStarEmissionAccumulator : 0;
    applySurvivalCampMergeState(keep, [keep, absorb, a, b], {
      clearCampState: keepIsScoredBody
    });
    copyStellarGrowthState(keep, stellarSource);
    updateStellarGrowthForMerge(keep, previousStellarMass, gainedStellarMass, Math.max(0, finiteOr(state && state.tick, 0)) * TICK_DT);
    finalizeStellarOutcomeTier(keep);
    nextTier = keep.tier;
    if (nextTier.threshold > previousTier.threshold) {
      keep.radius = Math.max(keep.radius, previousMergeRadius * BODY_TIER_EVOLUTION_SIZE_SCALE);
    }
    removed.add(absorb.id);
    const destroyedStructureCount = isStarBody(keep)
      ? destroyStructuresForStarMerge(state, keep, absorb)
      : destroyAbsorbedBodyStructuresForMerge(state, absorb);
    state.events.push({
      type: "body.merged",
      keptId: keep.id,
      removedId: absorb.id,
      x: keep.x,
      y: keep.y,
      radius: keep.radius,
      color: cloneColor(keep.color),
      absorbedX: absorb.x,
      absorbedY: absorb.y,
      absorbedRadius: absorb.radius,
      absorbedColor: cloneColor(absorb.color),
      mass: totalMass,
      tier: clone(keep.tier),
      previousTier: clone(previousTier),
      graduated,
      becameStar,
      promotedFromTier: previousTier.name,
      promotedToTier: nextTier.name,
      stellarOutcome: keep.stellarOutcome || "",
      destroyedStructures: destroyedStructureCount,
      tick: state.tick
    });
    for (const player of Object.values(state.players || {})) {
      if (!player || !player.landed || (player.landed.bodyId !== keep.id && player.landed.bodyId !== absorb.id)) {
        continue;
      }
      if (isStarBody(keep)) {
        ejectPlayerFromStarBirth(player, keep);
      } else {
        player.landed.bodyId = keep.id;
        player.landed.angle = Math.atan2(finiteOr(player.y, keep.y) - keep.y, finiteOr(player.x, keep.x) - keep.x);
        applyLandedSurfaceConstraint(state.world, player);
      }
    }
    return true;
  }

  function mergeParticlesPairwise(state, bodies) {
    const removed = new Set();
    for (let i = 0; i < bodies.length; i += 1) {
      const a = bodies[i];
      if (!a || removed.has(a.id)) {
        continue;
      }
      for (let j = i + 1; j < bodies.length; j += 1) {
        mergeParticlePair(state, a, bodies[j], removed);
      }
    }
    return removed;
  }

  function particleBucketKey(x, y, cellSize) {
    return Math.floor(x / cellSize) + "," + Math.floor(y / cellSize);
  }

  function buildParticleBuckets(bodies, cellSize) {
    const buckets = new Map();
    let maxRadius = 1;
    for (const body of bodies) {
      if (!body) {
        continue;
      }
      maxRadius = Math.max(maxRadius, finiteOr(body.radius, 1));
      const key = particleBucketKey(body.x, body.y, cellSize);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(body);
      } else {
        buckets.set(key, [body]);
      }
    }
    return { buckets, maxRadius };
  }

  function mergeParticlesSpatial(state, bodies) {
    const cellSize = 320;
    const grid = buildParticleBuckets(bodies, cellSize);
    const removed = new Set();
    const checked = new Set();
    for (const a of bodies) {
      if (!a || removed.has(a.id)) {
        continue;
      }
      const cx = Math.floor(a.x / cellSize);
      const cy = Math.floor(a.y / cellSize);
      const range = Math.max(1, Math.ceil((finiteOr(a.radius, 1) + grid.maxRadius) / cellSize));
      for (let gx = cx - range; gx <= cx + range; gx += 1) {
        for (let gy = cy - range; gy <= cy + range; gy += 1) {
          const bucket = grid.buckets.get(gx + "," + gy);
          if (!bucket) {
            continue;
          }
          for (const b of bucket) {
            if (!b || a === b || removed.has(b.id)) {
              continue;
            }
            const low = Math.min(a.id, b.id);
            const high = Math.max(a.id, b.id);
            const key = low + ":" + high;
            if (checked.has(key)) {
              continue;
            }
            checked.add(key);
            mergeParticlePair(state, a, b, removed);
          }
        }
      }
    }
    return removed;
  }

  function canLocalGravityClusterBody(body) {
    return Boolean(body && body.tier && finiteOr(body.tier.threshold, 0) <= thresholdForTierName("asteroid"));
  }

  function applyLocalBodyGravity(state, dt) {
    const bodies = state && state.world && Array.isArray(state.world.particles) ? state.world.particles : [];
    if (bodies.length < 2 || dt <= 0) {
      return;
    }

    const cellSize = LOCAL_BODY_GRAVITY_RADIUS;
    const buckets = new Map();
    for (const body of bodies) {
      if (!canLocalGravityClusterBody(body)) {
        continue;
      }
      const key = particleBucketKey(body.x, body.y, cellSize);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(body);
      } else {
        buckets.set(key, [body]);
      }
    }

    const checked = new Set();
    for (const a of bodies) {
      if (!canLocalGravityClusterBody(a)) {
        continue;
      }
      const cellX = Math.floor(a.x / cellSize);
      const cellY = Math.floor(a.y / cellSize);
      for (let gx = cellX - 1; gx <= cellX + 1; gx += 1) {
        for (let gy = cellY - 1; gy <= cellY + 1; gy += 1) {
          const bucket = buckets.get(gx + "," + gy);
          if (!bucket) {
            continue;
          }
          for (const b of bucket) {
            if (!b || a === b || !canLocalGravityClusterBody(b)) {
              continue;
            }
            const low = Math.min(a.id, b.id);
            const high = Math.max(a.id, b.id);
            const key = low + ":" + high;
            if (checked.has(key)) {
              continue;
            }
            checked.add(key);
            if (areBodiesTetherConnected(state.world, a, b)) {
              continue;
            }
            const dx = finiteOr(b.x, 0) - finiteOr(a.x, 0);
            const dy = finiteOr(b.y, 0) - finiteOr(a.y, 0);
            const distance = Math.hypot(dx, dy);
            const reach = LOCAL_BODY_GRAVITY_RADIUS + Math.max(0, finiteOr(a.radius, 0) + finiteOr(b.radius, 0)) * 0.45;
            if (distance <= 0.001 || distance > reach) {
              continue;
            }
            const closeness = 1 - distance / reach;
            const totalMass = Math.max(1, finiteOr(a.mass, 1) + finiteOr(b.mass, 1));
            const force = Math.min(LOCAL_BODY_GRAVITY_MAX_ACCELERATION, LOCAL_BODY_GRAVITY_FORCE * closeness * closeness);
            const nx = dx / distance;
            const ny = dy / distance;
            const aShare = clamp(finiteOr(b.mass, 1) / totalMass, 0.12, 0.88);
            const bShare = clamp(finiteOr(a.mass, 1) / totalMass, 0.12, 0.88);
            a.vx += nx * force * aShare * dt;
            a.vy += ny * force * aShare * dt;
            b.vx -= nx * force * bShare * dt;
            b.vy -= ny * force * bShare * dt;
          }
        }
      }
    }
  }

  function mergeParticles(state) {
    const bodies = state.world.particles;
    const removed = bodies.length < 36 ? mergeParticlesPairwise(state, bodies) : mergeParticlesSpatial(state, bodies);
    if (removed.size) {
      state.world.particles = bodies.filter((body) => body && !removed.has(body.id));
    }
  }

  function mobCollectionByKind(world, kind) {
    if (kind === "ufo") {
      return world.ufos;
    }
    if (kind === "rambot") {
      return world.rambots;
    }
    if (kind === "engineer") {
      return world.engineers;
    }
    if (kind === "tesla") {
      return world.teslas;
    }
    if (kind === "satellite" || kind === "rocket") {
      return world.rockets;
    }
    if (kind === "fighter") {
      return world.fighters;
    }
    return world.alienoids;
  }

  function difficultyMobSettings(state) {
    return DIFFICULTY_MOB_SETTINGS[state && state.difficulty] || DIFFICULTY_MOB_SETTINGS.medium;
  }

  function difficultyHealthDropChance(state, kind) {
    const baseChance = kind === "ufo" ? HEALTH_DROP_BASE_CHANCES.ufo : HEALTH_DROP_BASE_CHANCES.default;
    return clamp(baseChance * finiteOr(difficultyMobSettings(state).healthDropMultiplier, 1), 0, 0.96);
  }

  function difficultyMobDamage(state, damage) {
    return Math.max(0, finiteOr(damage, 0) * finiteOr(difficultyMobSettings(state).damageMultiplier, 1));
  }

  function difficultyMobSpawnInterval(state, kind) {
    const interval = MOB_SPAWN_INTERVALS[kind] || 120;
    return interval * difficultyMobSettings(state).intervalScale;
  }

  function difficultyMobWaveInterval(state) {
    return MOB_WAVE_INTERVAL * difficultyMobSettings(state).intervalScale;
  }

  function difficultyMobFirstWaveDelay(state) {
    return Math.max(0.5, finiteOr(difficultyMobSettings(state).firstWaveDelay, difficultyMobWaveInterval(state)));
  }

  function anyPlayerNeedsHealth(state) {
    const players = state && state.players && typeof state.players === "object" ? state.players : {};
    return Object.values(players).some((player) => {
      return player && finiteOr(player.health, 0) > 0 && finiteOr(player.health, 0) < finiteOr(player.maxHealth, PLAYER_MAX_HEALTH);
    });
  }

  function shouldDropHealthPickup(state, mob) {
    if (!anyPlayerNeedsHealth(state)) {
      return false;
    }
    const kind = mob && mob.kind || "alienoid";
    const kindIndex = Math.max(0, MOB_TIER_ORDER.indexOf(kind));
    const seed = (
      finiteOr(state && state.seed, 1) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(state && state.tick, 0)) + 1), 2246822519) ^
      Math.imul(Math.max(1, Math.floor(finiteOr(mob && mob.id, 1))), 3266489917) ^
      Math.imul(kindIndex + 1, 668265263)
    ) >>> 0;
    return seededRange(seed, 0, 1).value < difficultyHealthDropChance(state, kind);
  }

  function mobTierDefeatsToUnlockNextTier(kind) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    return MOB_TIER_UNLOCK_BASE_DEFEATS + Math.max(0, index);
  }

  function mobTierUnlockDefeatTarget(kind, playerCount) {
    const count = Math.max(1, Math.min(MAX_PLAYERS, Math.floor(finiteOr(playerCount, 1))));
    return mobTierDefeatsToUnlockNextTier(kind) * count;
  }

  function mobTierUnlockPlayerCount(state) {
    const players = state && state.players && typeof state.players === "object" ? Object.values(state.players) : [];
    return Math.max(1, players.filter(Boolean).length);
  }

  function isMobTierUnlocked(state, world, kind) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    if (index <= 0) {
      return true;
    }
    const previousKind = MOB_TIER_ORDER[index - 1];
    return finiteOr(world.mobDefeatsByKind && world.mobDefeatsByKind[previousKind], 0) >= mobTierUnlockDefeatTarget(previousKind, mobTierUnlockPlayerCount(state));
  }

  function baseLiveMobCap(kind) {
    if (kind === "alienoid") return 5;
    if (kind === "ufo") return 4;
    if (kind === "rambot" || kind === "engineer" || kind === "tesla") return 3;
    return 2;
  }

  function liveMobCount(world, kind) {
    let count = 0;
    for (const mob of mobCollectionByKind(world, kind)) {
      if (mob && mob.health > 0 && (kind !== "satellite" && kind !== "rocket" || mob.kind === kind)) {
        count += 1;
      }
    }
    return count;
  }

  function liveMobBossCount(world, kind) {
    return mobCollectionByKind(world, kind).filter((mob) => mob && mob.kind === kind && mob.isBoss && mob.health > 0).length;
  }

  function mobBossSpawnPressure(world, kind) {
    return Math.min(3, liveMobBossCount(world, kind));
  }

  function totalLiveMobCount(world) {
    let count = 0;
    for (const collectionName of MOB_COLLECTIONS) {
      for (const mob of world[collectionName] || []) {
        if (mob && mob.health > 0) {
          count += 1;
        }
      }
    }
    return count;
  }

  function manageableMobRestThreshold(players) {
    const playerCount = Math.min(MAX_PLAYERS, Array.isArray(players) && players.length ? players.length : 1);
    return Math.max(1, Math.ceil(MOB_SPAWN_REST_MANAGEABLE_MOBS_PER_PLAYER * playerCount));
  }

  function maxLiveMobCount(state, kind, players) {
    const elapsed = Math.max(0, finiteOr(state.tick, 0) * TICK_DT);
    const interval = difficultyMobSpawnInterval(state, kind);
    const growth = Math.min(5, Math.floor(elapsed / Math.max(45, interval * 3.5)));
    const playerCount = Math.min(MAX_PLAYERS, Array.isArray(players) && players.length ? players.length : 1);
    const playerScale = 1 + Math.max(0, playerCount - 1) * 0.35;
    const bossPressureCap = mobBossSpawnPressure(state.world, kind) * MOB_BOSS_LIVE_CAP_BONUS;
    return Math.max(1, Math.round((baseLiveMobCap(kind) + growth) * playerScale * difficultyMobSettings(state).batchScale) + bossPressureCap);
  }

  function baseMobSpawnBatchLimit(state, kind) {
    const elapsed = Math.max(0, finiteOr(state.tick, 0) * TICK_DT);
    const interval = difficultyMobSpawnInterval(state, kind);
    if (!interval) {
      return BASE_MAX_MOB_SPAWN_BATCH_SIZE;
    }
    const growthInterval = interval * MOB_SPAWN_CAP_GROWTH_INTERVAL_MULTIPLIER;
    const rawLimit = BASE_MAX_MOB_SPAWN_BATCH_SIZE + Math.floor(elapsed / growthInterval);
    return Math.max(1, Math.round(rawLimit * difficultyMobSettings(state).batchScale) + mobBossSpawnPressure(state.world, kind) * MOB_BOSS_SPAWN_BATCH_BONUS);
  }

  function startingMobSpawnBonusChance(state, bonusSlot) {
    const chances = difficultyMobSettings(state).startingBatchBonusChances;
    if (!Array.isArray(chances)) {
      return 0;
    }
    return clamp(finiteOr(chances[bonusSlot - 1], 0), 0, 0.92);
  }

  function mobSpawnBonusSlotChance(state, world, kind, bonusSlot) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    const nextKind = MOB_TIER_ORDER[index + 1];
    const defeats = Math.max(0, finiteOr(world.mobDefeatsByKind && world.mobDefeatsByKind[nextKind || kind], 0));
    const settings = difficultyMobSettings(state);
    const bonusChanceScale = finiteOr(settings.bonusChanceScale, 1);
    const progressScale = bonusSlot < 2
      ? bonusChanceScale
      : Math.pow(THIRD_MOB_SPAWN_CHANCE_SCALE, bonusSlot - 1) * bonusChanceScale;
    const progressChance = clamp(defeats / (mobTierUnlockDefeatTarget(nextKind || kind, mobTierUnlockPlayerCount(state)) * bonusSlot), 0, 0.92) * progressScale;
    return clamp(Math.max(startingMobSpawnBonusChance(state, bonusSlot), progressChance), 0, 0.92);
  }

  function rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder) {
    let batchSize = 1;
    for (let bonusSlot = 1; bonusSlot < batchLimit; bonusSlot += 1) {
      if (randomRange(seedHolder, 0, 1) < mobSpawnBonusSlotChance(state, world, kind, bonusSlot)) {
        batchSize += 1;
      }
    }
    return batchSize;
  }

  function maxMobSpawnBatchSize(state, kind, players) {
    const effectiveCount = Math.min(MAX_PLAYERS, effectiveWorldPlayerCount(players));
    return Math.max(1, Math.round(baseMobSpawnBatchLimit(state, kind) * (1 + Math.max(0, effectiveCount - 1) * 0.55)));
  }

  function mobSpawnBatchSize(state, world, kind, players, seedHolder) {
    const effectiveCount = Math.min(MAX_PLAYERS, effectiveWorldPlayerCount(players));
    const batchLimit = baseMobSpawnBatchLimit(state, kind);
    let batchSize = rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder);
    const bonusRolls = Math.floor(Math.max(0, effectiveCount - 1));
    for (let i = 0; i < bonusRolls; i += 1) {
      batchSize += randomRange(seedHolder, 0, 1) < 0.55
        ? rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder)
        : 0;
    }
    const fractionalBonus = Math.max(0, effectiveCount - 1) - bonusRolls;
    if (fractionalBonus > 0 && randomRange(seedHolder, 0, 1) < fractionalBonus * 0.55) {
      batchSize += rollMobSpawnBatchSize(state, world, kind, batchLimit, seedHolder);
    }
    batchSize += mobBossSpawnPressure(world, kind) * MOB_BOSS_SPAWN_BATCH_BONUS;
    return Math.min(maxMobSpawnBatchSize(state, kind, players), Math.max(1, batchSize));
  }

  function mobSpawnIntervalWithBossPressure(state, kind) {
    const interval = difficultyMobSpawnInterval(state, kind);
    return interval * (mobBossSpawnPressure(state.world, kind) > 0 ? MOB_BOSS_SPAWN_INTERVAL_SCALE : 1);
  }

  function unlockedMobKinds(state, world) {
    return MOB_TIER_ORDER.filter((kind) => isMobTierUnlocked(state, world, kind));
  }

  function mobWaveBossPressure(world) {
    let count = 0;
    for (const kind of MOB_TIER_ORDER) {
      count += liveMobBossCount(world, kind);
    }
    return Math.min(3, count);
  }

  function mobWaveIntervalWithBossPressure(state) {
    const interval = difficultyMobWaveInterval(state);
    return interval * (mobWaveBossPressure(state.world) > 0 ? MOB_BOSS_SPAWN_INTERVAL_SCALE : 1);
  }

  function mobWaveSizeDifficultyScale(state) {
    const mediumScale = finiteOr(DIFFICULTY_MOB_SETTINGS.medium && DIFFICULTY_MOB_SETTINGS.medium.batchScale, 1.24);
    return clamp(finiteOr(difficultyMobSettings(state).batchScale, mediumScale) / mediumScale, 0.8, 1.2);
  }

  function rollMobWaveSize(state, world, players, seedHolder) {
    const playerCount = Math.max(1, Math.min(MAX_PLAYERS, Array.isArray(players) && players.length ? players.length : 1));
    const wavesCompleted = Math.max(0, finiteOr(world.mobWaveCount, 0));
    const mobsPerPlayer = MOB_WAVE_STARTING_MOBS_PER_PLAYER + wavesCompleted / Math.max(1, MOB_WAVE_GROWTH_WAVES);
    const ideal = mobsPerPlayer * playerCount * mobWaveSizeDifficultyScale(state) + mobWaveBossPressure(world) * MOB_BOSS_SPAWN_BATCH_BONUS;
    const whole = Math.floor(ideal);
    const rounded = whole + (randomRange(seedHolder, 0, 1) < ideal - whole ? 1 : 0);
    return Math.max(playerCount, rounded);
  }

  function chooseMobWaveKind(state, world, eligibleKinds, players, reservedCounts, seedHolder) {
    let leastReserved = Infinity;
    const candidates = [];

    for (const kind of eligibleKinds) {
      const reserved = Math.max(0, finiteOr(reservedCounts[kind], 0));
      const remainingSlots = maxLiveMobCount(state, kind, players) - liveMobCount(world, kind) - reserved;
      if (remainingSlots <= 0) {
        continue;
      }
      if (reserved < leastReserved) {
        candidates.length = 0;
        leastReserved = reserved;
      }
      if (reserved === leastReserved) {
        candidates.push(kind);
      }
    }

    if (!candidates.length) {
      return "";
    }
    return candidates[Math.floor(randomRange(seedHolder, 0, candidates.length))] || "";
  }

  function buildMobWaveSlots(state, world, targetCount, players, seedHolder) {
    const eligibleKinds = unlockedMobKinds(state, world).filter((kind) => isMobBeaconReady(world, kind));
    const reservedCounts = {};
    const slots = [];

    for (let i = 0; i < targetCount; i += 1) {
      const kind = chooseMobWaveKind(state, world, eligibleKinds, players, reservedCounts, seedHolder);
      if (!kind) {
        break;
      }
      reservedCounts[kind] = Math.max(0, finiteOr(reservedCounts[kind], 0)) + 1;
      slots.push(kind);
    }

    return slots;
  }

  function compressMobSpawnSlots(slots) {
    const remainingByKind = {};
    const order = [];
    for (const kind of slots) {
      if (!remainingByKind[kind]) {
        remainingByKind[kind] = 0;
        order.push(kind);
      }
      remainingByKind[kind] += 1;
    }

    const entries = [];
    for (const kind of order) {
      let remaining = remainingByKind[kind];
      while (remaining >= MOB_ELITE_COMPRESSION_SIZE) {
        const groupSize = Math.min(remaining, MOB_ELITE_COMPRESSION_SIZE * MOB_ELITE_MAX_STARS);
        const stars = clamp(Math.floor(groupSize / MOB_ELITE_COMPRESSION_SIZE), 1, MOB_ELITE_MAX_STARS);
        const represented = stars * MOB_ELITE_COMPRESSION_SIZE;
        entries.push({ kind, eliteStars: stars, eliteGroupSize: represented });
        remaining -= represented;
      }
      for (let i = 0; i < remaining; i += 1) {
        entries.push({ kind, eliteStars: 0, eliteGroupSize: 1 });
      }
    }
    return entries;
  }

  function chooseMobWaveClumpCenter(world, anchor, players, seedHolder) {
    return chooseMobSpawnPoint(world, "alienoid", anchor, players, seedHolder);
  }

  function clumpOffset(index, count, seedHolder) {
    const angle = randomRange(seedHolder, 0, Math.PI * 2) + index * 2.399963229728653;
    const progress = count > 1 ? index / Math.max(1, count - 1) : 0;
    const radius = randomRange(seedHolder, MOB_WAVE_CLUMP_MIN_RADIUS, MOB_WAVE_CLUMP_MAX_RADIUS) * (0.72 + progress * 0.34);
    return {
      x: Math.cos(angle) * radius + randomRange(seedHolder, -22, 22),
      y: Math.sin(angle) * radius + randomRange(seedHolder, -22, 22)
    };
  }

  function splitMobWaveSlotsByAnchor(slots, players, seedHolder) {
    const groups = players.map(() => []);
    if (!groups.length) {
      return groups;
    }

    for (const kind of slots) {
      let leastCount = Infinity;
      const candidates = [];
      for (let i = 0; i < groups.length; i += 1) {
        if (groups[i].length < leastCount) {
          candidates.length = 0;
          leastCount = groups[i].length;
        }
        if (groups[i].length === leastCount) {
          candidates.push(i);
        }
      }
      const groupIndex = candidates[Math.floor(randomRange(seedHolder, 0, candidates.length))] || 0;
      groups[groupIndex].push(kind);
    }

    return groups;
  }

  function spawnMobWave(state, slots, players, seedHolder) {
    const world = state.world;
    const sourcePlayers = players.slice(0, MAX_PLAYERS);
    const groups = splitMobWaveSlotsByAnchor(slots, sourcePlayers, seedHolder);
    const spawnedKinds = new Set();

    for (let playerIndex = 0; playerIndex < groups.length; playerIndex += 1) {
      const kinds = groups[playerIndex];
      if (!kinds.length) {
        continue;
      }
      const center = chooseMobWaveClumpCenter(world, sourcePlayers[playerIndex], sourcePlayers, seedHolder);
      const entries = compressMobSpawnSlots(kinds);
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const offset = clumpOffset(i, entries.length, seedHolder);
        const mob = createMob(world, entry.kind, center.x + offset.x, center.y + offset.y, seedHolder, {
          eliteStars: entry.eliteStars,
          eliteGroupSize: entry.eliteGroupSize
        });
        mobCollectionByKind(world, entry.kind).push(mob);
        spawnedKinds.add(entry.kind);
      }
    }

    return spawnedKinds;
  }

  function nearestMobDistance(world, x, y, kind) {
    let nearest = Infinity;
    for (const collectionName of MOB_COLLECTIONS) {
      for (const mob of world[collectionName] || []) {
        if (!mob || mob.health <= 0) {
          continue;
        }
        const sameKind = mob.kind === kind;
        const weight = sameKind ? 1 : 0.55;
        const distance = Math.hypot(x - mob.x, y - mob.y) / weight;
        if (distance < nearest) {
          nearest = distance;
        }
      }
    }
    return nearest;
  }

  function leastPopulatedMobAnchor(world, players) {
    let best = players[0];
    let bestCount = Infinity;
    for (const player of players) {
      let count = 0;
      for (const collectionName of MOB_COLLECTIONS) {
        for (const mob of world[collectionName] || []) {
          if (mob && mob.health > 0 && Math.hypot(mob.x - player.x, mob.y - player.y) < 1300) {
            count += 1;
          }
        }
      }
      if (count < bestCount) {
        best = player;
        bestCount = count;
      }
    }
    return best;
  }

  function chooseMobSpawnPoint(world, kind, anchor, players, seedHolder) {
    const baseMinPlayerDistance = kind === "alienoid" ? 820 : kind === "ufo" || kind === "tesla" ? 900 : 980;
    const spawnSpread = (kind === "rocket" || kind === "fighter" ? 980 : 720) * MOB_SPAWN_SPREAD_MULTIPLIER;
    const minPlayerDistance = MOB_SPAWN_FULLY_ZOOMED_OUT_VIEW_RADIUS + baseMinPlayerDistance + MOB_SPAWN_DISTANCE_BONUS;
    const maxDistance = minPlayerDistance + spawnSpread;
    let best = null;
    let bestValid = null;
    for (let attempt = 0; attempt < 36; attempt += 1) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const dist = randomRange(seedHolder, minPlayerDistance, maxDistance);
      const x = anchor.x + Math.cos(angle) * dist + randomRange(seedHolder, -220, 220);
      const y = anchor.y + Math.sin(angle) * dist + randomRange(seedHolder, -220, 220);
      const nearestPlayer = nearestPlayerDistance(x, y, players);
      const nearestMob = nearestMobDistance(world, x, y, kind);
      const tooCloseToPlayer = Math.max(0, minPlayerDistance - nearestPlayer);
      const score = nearestPlayer * 0.18 + nearestMob * 0.62 - tooCloseToPlayer * 10;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (nearestPlayer >= minPlayerDistance && (!bestValid || score > bestValid.score)) {
        bestValid = { x, y, score };
      }
    }
    return bestValid || best || { x: anchor.x + minPlayerDistance, y: anchor.y };
  }

  function mobBeaconForKind(world, kind) {
    const beacons = Array.isArray(world && world.mobBeacons) ? world.mobBeacons : [];
    return beacons.find((beacon) => beacon && beacon.beaconKind === kind) || null;
  }

  function nearestMobBeaconDistance(world, x, y, ignoreBeacon) {
    let nearest = Infinity;
    for (const beacon of world.mobBeacons || []) {
      if (!beacon || beacon === ignoreBeacon || finiteOr(beacon.health, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(x - beacon.x, y - beacon.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function nearestMobBeaconAnchor(beacon, players) {
    const source = Array.isArray(players) && players.length ? players : [{ x: 0, y: 0, vx: 0, vy: 0 }];
    let nearest = source[0];
    let nearestDistance = Infinity;
    for (const player of source) {
      const distance = Math.hypot(beacon.x - player.x, beacon.y - player.y);
      if (distance < nearestDistance) {
        nearest = player;
        nearestDistance = distance;
      }
    }
    return {
      anchor: nearest,
      distance: Number.isFinite(nearestDistance) ? nearestDistance : 0
    };
  }

  function chooseMobBeaconSpawnPoint(world, kind, players, seedHolder) {
    const sourcePlayers = Array.isArray(players) && players.length ? players : [{ x: 0, y: 0, vx: 0, vy: 0 }];
    const source = leastPopulatedMobAnchor(world, sourcePlayers);
    let best = null;
    let bestValid = null;
    const tierIndex = Math.max(0, MOB_TIER_ORDER.indexOf(kind));
    const baseAngle = tierIndex * 2.399963229728653 + randomRange(seedHolder, -0.55, 0.55);

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const angle = attempt < 8
        ? baseAngle + attempt * (Math.PI * 2 / 8) + randomRange(seedHolder, -0.18, 0.18)
        : randomRange(seedHolder, 0, Math.PI * 2);
      const distance = randomRange(seedHolder, MOB_BEACON_MIN_PLAYER_DISTANCE, MOB_BEACON_MAX_PLAYER_DISTANCE);
      const side = angle + Math.PI / 2;
      const x = source.x + Math.cos(angle) * distance + Math.cos(side) * randomRange(seedHolder, -320, 320);
      const y = source.y + Math.sin(angle) * distance + Math.sin(side) * randomRange(seedHolder, -320, 320);
      const nearestPlayer = nearestPlayerDistance(x, y, sourcePlayers);
      const nearestBeacon = nearestMobBeaconDistance(world, x, y, null);
      const beaconSpacing = Number.isFinite(nearestBeacon) ? Math.min(nearestBeacon, MOB_BEACON_PREFERRED_SEPARATION * 2.4) : MOB_BEACON_PREFERRED_SEPARATION * 1.8;
      const tooCloseToPlayer = Math.max(0, MOB_BEACON_MIN_PLAYER_DISTANCE - nearestPlayer);
      const tooFarFromPlayer = Math.max(0, nearestPlayer - MOB_BEACON_MAX_PLAYER_DISTANCE);
      const tooCloseToBeacon = Math.max(0, MOB_BEACON_PREFERRED_SEPARATION - beaconSpacing);
      const score = beaconSpacing * 0.9 + nearestPlayer * 0.12 - tooCloseToPlayer * 8 - tooFarFromPlayer * 2.5 - tooCloseToBeacon * 7;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (
        nearestPlayer >= MOB_BEACON_MIN_PLAYER_DISTANCE &&
        nearestPlayer <= MOB_BEACON_MAX_PLAYER_DISTANCE &&
        beaconSpacing >= MOB_BEACON_PREFERRED_SEPARATION &&
        (!bestValid || score > bestValid.score)
      ) {
        bestValid = { x, y, score };
      }
    }

    return bestValid || best || { x: source.x + MOB_BEACON_MIN_PLAYER_DISTANCE, y: source.y };
  }

  function createMobBeacon(world, kind, x, y, seedHolder, options) {
    const beaconKind = MOB_TIER_ORDER.includes(kind) ? kind : "alienoid";
    const id = Math.max(1, Math.floor(finiteOr(world.nextMobBeaconId, 1)));
    const maxHealth = mobBeaconMaxHealth(beaconKind);
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const beacon = normalizeMobBeacon({
      ...(options && typeof options === "object" ? options : {}),
      id,
      kind: "beacon",
      beaconKind,
      isBeacon: true,
      x,
      y,
      vx: Math.cos(angle) * randomRange(seedHolder, 8, 24),
      vy: Math.sin(angle) * randomRange(seedHolder, 8, 24),
      radius: 46,
      health: maxHealth,
      maxHealth,
      color: mobBeaconColor(beaconKind),
      rotation: randomRange(seedHolder, 0, Math.PI * 2),
      wobble: randomRange(seedHolder, 0, Math.PI * 2),
      age: 0,
      respawnTimer: 0,
      driftAngle: randomRange(seedHolder, 0, Math.PI * 2),
      strafeSign: randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1
    }, id);
    world.nextMobBeaconId = id + 1;
    return beacon;
  }

  function replaceMobBeaconState(world, beacon, kind, spawn, seedHolder) {
    Object.assign(beacon, createMobBeacon(world, kind, spawn.x, spawn.y, seedHolder));
    return beacon;
  }

  function ensureMobBeacon(world, kind, players, seedHolder) {
    if (!Array.isArray(world.mobBeacons)) {
      world.mobBeacons = [];
    }
    let beacon = mobBeaconForKind(world, kind);
    if (beacon) {
      return beacon;
    }
    const spawn = chooseMobBeaconSpawnPoint(world, kind, players, seedHolder);
    beacon = createMobBeacon(world, kind, spawn.x, spawn.y, seedHolder);
    world.mobBeacons.push(beacon);
    return beacon;
  }

  function isMobBeaconReady(world, kind) {
    const beacon = mobBeaconForKind(world, kind);
    return Boolean(beacon && finiteOr(beacon.health, 0) > 0 && finiteOr(beacon.age, 0) >= MOB_BEACON_WARMUP_DURATION);
  }

  function updateMobBeaconMotion(world, beacon, players, dt) {
    const nearest = nearestMobBeaconAnchor(beacon, players);
    const anchor = nearest.anchor || { x: 0, y: 0 };
    const distance = Math.max(1, nearest.distance);
    const fromAnchorX = (beacon.x - anchor.x) / distance;
    const fromAnchorY = (beacon.y - anchor.y) / distance;
    const wave = finiteOr(beacon.wobble, 0) + finiteOr(beacon.age, 0) * 0.55;
    let ax = Math.cos(finiteOr(beacon.driftAngle, 0) + Math.sin(wave) * 0.4) * 16;
    let ay = Math.sin(finiteOr(beacon.driftAngle, 0) + Math.cos(wave * 0.73) * 0.4) * 16;

    const gadgetControlled = finiteOr(beacon.gadgetForceTimer, 0) > 0;
    if (!gadgetControlled && distance < MOB_BEACON_MIN_PLAYER_DISTANCE) {
      const strength = clamp((MOB_BEACON_MIN_PLAYER_DISTANCE - distance) / 900, 0.25, 2.2) * 54;
      ax += fromAnchorX * strength;
      ay += fromAnchorY * strength;
    } else if (!gadgetControlled && distance > MOB_BEACON_MAX_PLAYER_DISTANCE) {
      const strength = clamp((distance - MOB_BEACON_MAX_PLAYER_DISTANCE) / 1200, 0.35, 2.5) * 68;
      ax -= fromAnchorX * strength;
      ay -= fromAnchorY * strength;
    }

    for (const other of world.mobBeacons || []) {
      if (!other || other === beacon || finiteOr(other.health, 0) <= 0) {
        continue;
      }
      const dx = beacon.x - other.x;
      const dy = beacon.y - other.y;
      const spacing = Math.hypot(dx, dy) || 1;
      if (spacing >= MOB_BEACON_PREFERRED_SEPARATION) {
        continue;
      }
      const strength = (MOB_BEACON_PREFERRED_SEPARATION - spacing) / MOB_BEACON_PREFERRED_SEPARATION * 46;
      ax += dx / spacing * strength;
      ay += dy / spacing * strength;
    }

    beacon.vx += ax * dt;
    beacon.vy += ay * dt;
    beacon.vx *= Math.pow(0.9, dt);
    beacon.vy *= Math.pow(0.9, dt);
    const speed = Math.hypot(beacon.vx, beacon.vy);
    if (speed > MOB_BEACON_MAX_SPEED) {
      beacon.vx = (beacon.vx / speed) * MOB_BEACON_MAX_SPEED;
      beacon.vy = (beacon.vy / speed) * MOB_BEACON_MAX_SPEED;
    }
    beacon.x += beacon.vx * dt;
    beacon.y += beacon.vy * dt;
    beacon.rotation = finiteOr(beacon.rotation, 0) + (0.24 + Math.max(0, MOB_TIER_ORDER.indexOf(beacon.beaconKind)) * 0.015) * dt * finiteOr(beacon.strafeSign, 1);
    beacon.driftAngle = finiteOr(beacon.driftAngle, 0) + 0.18 * dt * finiteOr(beacon.strafeSign, 1);
  }

  function updateMobBeacons(state, players, dt, seedHolder) {
    const world = state.world;
    if (!Array.isArray(world.mobBeacons)) {
      world.mobBeacons = [];
    }
    for (const kind of MOB_TIER_ORDER) {
      if (!isMobTierUnlocked(state, world, kind)) {
        continue;
      }
      const beacon = ensureMobBeacon(world, kind, players, seedHolder);
      beacon.hitCooldown = Math.max(0, finiteOr(beacon.hitCooldown, 0) - dt);
      beacon.disabledTimer = Math.max(0, finiteOr(beacon.disabledTimer, 0) - dt);
      beacon.flash = Math.max(0, finiteOr(beacon.flash, 0) - dt);
      beacon.gadgetForceTimer = Math.max(0, finiteOr(beacon.gadgetForceTimer, 0) - dt);
      tickMobBodyImpactCooldowns(beacon, dt);

      if (finiteOr(beacon.health, 0) <= 0) {
        beacon.respawnTimer = Math.max(0, finiteOr(beacon.respawnTimer, MOB_BEACON_RESPAWN_DURATION) - dt);
        if (beacon.respawnTimer <= 0) {
          replaceMobBeaconState(world, beacon, kind, chooseMobBeaconSpawnPoint(world, kind, players, seedHolder), seedHolder);
        }
        continue;
      }

      beacon.age = Math.max(0, finiteOr(beacon.age, 0) + dt);
      beacon.respawnTimer = 0;
      updateMobBeaconMotion(world, beacon, players, dt);
    }
  }

  function createMob(world, kind, x, y, seedHolder, options) {
    const settings = options && typeof options === "object" ? options : {};
    const id = world.nextMobIds[kind]++;
    const healthByKind = {
      alienoid: 100,
      ufo: 130,
      rambot: 210,
      engineer: 140,
      tesla: 150,
      satellite: 180,
      rocket: 170,
      fighter: 230
    };
    const radiusByKind = {
      alienoid: 28,
      ufo: 34,
      rambot: 38,
      engineer: 33,
      tesla: 32,
      satellite: 36,
      rocket: 34,
      fighter: 40
    };
    const colorByKind = {
      alienoid: { r: 255, g: 115, b: 173 },
      ufo: { r: 112, g: 226, b: 255 },
      rambot: { r: 184, g: 196, b: 204 },
      engineer: { r: 102, g: 224, b: 184 },
      tesla: { r: 157, g: 255, b: 122 },
      satellite: { r: 169, g: 133, b: 255 },
      rocket: { r: 169, g: 133, b: 255 },
      fighter: { r: 119, g: 167, b: 255 }
    };
    const isBoss = Boolean(settings.isBoss);
    const bossStars = isBoss ? bossStarRankValue(settings.bossStars) : 0;
    const eliteStars = isBoss ? 0 : mobEliteStarRankValue(settings.eliteStars);
    const eliteGroupSize = eliteStars > 0
      ? Math.max(MOB_ELITE_COMPRESSION_SIZE, Math.floor(finiteOr(settings.eliteGroupSize, eliteStars * MOB_ELITE_COMPRESSION_SIZE)))
      : 1;
    const baseMaxHealth = healthByKind[kind] || 100;
    const maxHealth = isBoss
      ? baseMaxHealth * MOB_BOSS_HEALTH_MULTIPLIER * bossHealthScaleForStars(bossStars)
      : baseMaxHealth * mobEliteHealthScale(eliteStars);
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const mob = {
      id,
      kind,
      x,
      y,
      vx: Math.cos(angle) * randomRange(seedHolder, 10, 44),
      vy: Math.sin(angle) * randomRange(seedHolder, 10, 44),
      radius: (radiusByKind[kind] || 28) * (isBoss ? MOB_BOSS_RADIUS_MULTIPLIER : mobEliteRadiusScale(eliteStars)),
      health: maxHealth,
      maxHealth,
      disabledTimer: 0,
      color: colorByKind[kind] || colorByKind.alienoid,
      shootCooldown: kind === "alienoid" ? randomRange(seedHolder, 0.8, 2.1) : 0,
      strafeSign: randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1,
      rotation: kind === "rocket" ? angle + Math.PI / 2 : 0,
      beamAngle: kind === "ufo" ? Math.PI / 2 : 0,
      beamPulse: kind === "ufo" ? randomRange(seedHolder, 0, Math.PI * 2) : 0,
      tractorDisabledTimer: kind === "ufo" ? 0 : undefined,
      bossBeamMode: kind === "ufo" ? "tractor" : undefined,
      bossBeamTimer: kind === "ufo" ? UFO_BOSS_NORMAL_BEAM_DURATION : undefined,
      wobble: randomRange(seedHolder, 0, Math.PI * 2),
      eliteStars,
      eliteGroupSize,
      isBoss,
      bossBaseKind: isBoss ? kind : "",
      bossStars,
      minionCooldown: isBoss ? randomRange(seedHolder, MOB_BOSS_MINION_COOLDOWN_MIN, MOB_BOSS_MINION_COOLDOWN_MAX) : 0,
      altAttackCooldown: isBoss ? randomRange(seedHolder, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) * bossCooldownScaleForStars(bossStars) : 0,
      bossBodyEvadeTimer: 0,
      bossBodyEvadeSpeedCap: 0,
      team: settings.team === "player" ? "player" : ""
    };

    if (kind === "rambot") {
      Object.assign(mob, {
        chargeCooldown: randomRange(seedHolder, 1.2, 2.6),
        chargeTimer: 0,
        recoverTimer: 0,
        chargeDirX: 1,
        chargeDirY: 0,
        impactCooldown: 0,
        headAngle: angle,
        pistonTimer: 0,
        pistonDuration: RAMBOT_BOSS_PISTON_DURATION,
        pistonHit: false
      });
    } else if (kind === "engineer") {
      Object.assign(mob, {
        healCooldown: randomRange(seedHolder, 0.35, 0.9),
        healPulse: 0,
        repairBeamAngle: 0,
        targetKind: "",
        targetId: 0
      });
    } else if (kind === "tesla") {
      Object.assign(mob, {
        shootCooldown: randomRange(seedHolder, 1.2, 2.5),
        lightningWarmup: 0,
        lightningFlash: 0,
        lightningAngle: 0
      });
    } else if (kind === "satellite") {
      Object.assign(mob, {
        scannerAngle: 0,
        scanProgress: 0,
        lockTimer: 0,
        blastTimer: 0,
        recoverTimer: 0,
        lockX: x,
        lockY: y,
        blastDirX: 1,
        blastDirY: 0,
        volleyTimer: 0,
        volleyShots: 0,
        impactCooldown: 0
      });
    } else if (kind === "rocket") {
      Object.assign(mob, {
        chargeCooldown: randomRange(seedHolder, 0.6, 1.6),
        chargeTimer: 0,
        chargeDirX: Math.cos(angle),
        chargeDirY: Math.sin(angle),
        chargePower: 0,
        recoverTimer: 0,
        lockX: x,
        lockY: y,
        impactCooldown: 0,
        blastTimer: 0
      });
    } else if (kind === "fighter") {
      Object.assign(mob, {
        shootCooldown: randomRange(seedHolder, 1.0, 2.4),
        machineGunShots: 0,
        machineGunTimer: 0,
        shieldCharge: FIGHTER_SHIELD_MAX_CHARGE,
        shieldRecharge: 0,
        shieldActive: 0
      });
    }

    return normalizeEntity(Object.assign(mob, settings, { eliteStars, eliteGroupSize }), id, kind);
  }

  function spawnMobByKind(world, kind, anchor, players, seedHolder) {
    const spawn = chooseMobSpawnPoint(world, kind, anchor, players, seedHolder);
    mobCollectionByKind(world, kind).push(createMob(world, kind, spawn.x, spawn.y, seedHolder));
  }

  function spawnMobByKindAt(world, kind, x, y, seedHolder) {
    mobCollectionByKind(world, kind).push(createMob(world, kind, x, y, seedHolder));
  }

  function mobBossProgressReady(world, kind) {
    return Math.max(0, finiteOr(world.mobBossProgressByKind && world.mobBossProgressByKind[kind], 0)) >= MOB_BOSS_DEFEATS_TO_UNLOCK;
  }

  function previousMobBossDefeated(world, kind) {
    const index = MOB_TIER_ORDER.indexOf(kind);
    if (index <= 0) {
      return true;
    }
    const previousKind = MOB_TIER_ORDER[index - 1];
    return Math.max(0, Math.floor(finiteOr(world.mobBossDefeatsByKind && world.mobBossDefeatsByKind[previousKind], 0))) > 0;
  }

  function isMobBossUnlocked(world, kind) {
    return mobBossProgressReady(world, kind) && previousMobBossDefeated(world, kind);
  }

  function hasLiveMobBoss(world, kind) {
    return mobCollectionByKind(world, kind).some((mob) => mob && mob.kind === kind && mob.isBoss && mob.health > 0);
  }

  function maybeScheduleMobBoss(state, kind, seedHolder) {
    const world = state.world;
    if (!world.mobBossWarnings || !world.mobBossWarnings[kind]) {
      return;
    }
    const warning = world.mobBossWarnings[kind];
    if (warning.active || !isMobBossUnlocked(world, kind) || hasLiveMobBoss(world, kind)) {
      return;
    }
    warning.active = true;
    warning.timer = MOB_BOSS_WARNING_DURATION;
    warning.lastNoticeSecond = -1;
    state.events.push({ type: "mob.boss.warning", kind, seconds: MOB_BOSS_WARNING_DURATION, tick: state.tick });
  }

  function spawnBossByKind(state, kind, anchor, players, seedHolder) {
    const spawn = chooseMobSpawnPoint(state.world, kind, anchor, players, seedHolder);
    const bossStars = Math.max(0, Math.floor(finiteOr(state.world.mobBossDefeatsByKind && state.world.mobBossDefeatsByKind[kind], 0)));
    const boss = createMob(state.world, kind, spawn.x, spawn.y, seedHolder, { isBoss: true, bossStars });
    mobCollectionByKind(state.world, kind).push(boss);
    spawnBossEscortMobs(state, kind, boss, seedHolder);
    state.events.push({ type: "mob.boss.spawned", mobId: boss.id, kind, bossStars, x: boss.x, y: boss.y, color: cloneColor(boss.color), tick: state.tick });
  }

  function spawnBossEscortMobs(state, kind, boss, seedHolder) {
    const collection = mobCollectionByKind(state.world, kind);
    const escortCount = Math.floor(randomRange(seedHolder, MOB_BOSS_ESCORT_SPAWN_MIN, MOB_BOSS_ESCORT_SPAWN_MAX + 1));
    const startAngle = randomRange(seedHolder, 0, Math.PI * 2);

    for (let i = 0; i < escortCount; i += 1) {
      const angle = startAngle + (Math.PI * 2 * i) / escortCount + randomRange(seedHolder, -0.28, 0.28);
      const distance = Math.max(boss.radius * 1.35, randomRange(seedHolder, 115, 210));
      const escort = createMob(
        state.world,
        kind,
        boss.x + Math.cos(angle) * distance,
        boss.y + Math.sin(angle) * distance,
        seedHolder
      );
      escort.vx += Math.cos(angle) * randomRange(seedHolder, 38, 96) + finiteOr(boss.vx, 0) * 0.12;
      escort.vy += Math.sin(angle) * randomRange(seedHolder, 38, 96) + finiteOr(boss.vy, 0) * 0.12;
      collection.push(escort);
    }
  }

  function updateMobBossWarnings(state, players, dt, seedHolder) {
    const world = state.world;
    if (!world.mobBossWarnings) {
      return;
    }
    for (const kind of MOB_TIER_ORDER) {
      const warning = world.mobBossWarnings[kind];
      if (!warning || !warning.active) {
        continue;
      }
      if (!isMobBeaconReady(world, kind)) {
        warning.timer = Math.max(1, finiteOr(warning.timer, 1));
        warning.lastNoticeSecond = -1;
        continue;
      }
      warning.timer = Math.max(0, finiteOr(warning.timer, 0) - dt);
      const seconds = Math.ceil(warning.timer);
      if (warning.lastNoticeSecond !== seconds) {
        warning.lastNoticeSecond = seconds;
        state.events.push({ type: "mob.boss.warning", kind, seconds, tick: state.tick });
      }
      if (warning.timer > 0) {
        continue;
      }
      warning.active = false;
      warning.lastNoticeSecond = -1;
      if (!hasLiveMobBoss(world, kind)) {
        spawnBossByKind(state, kind, leastPopulatedMobAnchor(world, players), players, seedHolder);
      }
    }
  }

  function activeWorldPlayers(state) {
    return Object.values(state.players || {}).filter((entry) => (
      entry &&
      entry.health > 0 &&
      Number.isFinite(Number(entry.x)) &&
      Number.isFinite(Number(entry.y))
    ));
  }

  function effectiveWorldPlayerCount(players) {
    const source = Array.isArray(players) && players.length ? players : [];
    return effectiveParticlePlayerCount(source);
  }

  function startMobSpawnGracePeriod(world) {
    world.mobSpawnRestTimer = MOB_SPAWN_REST_DURATION;
    world.mobSpawnRestDrainTimer = 0;
    world.mobSpawnRestCooldownTimer = MOB_SPAWN_REST_COOLDOWN;
  }

  function updateMobSpawnRest(world, players, dt) {
    world.mobSpawnRestTimer = Math.max(0, finiteOr(world.mobSpawnRestTimer, 0));
    world.mobSpawnRestDrainTimer = Math.max(0, finiteOr(world.mobSpawnRestDrainTimer, 0));
    world.mobSpawnRestCooldownTimer = Math.max(0, finiteOr(world.mobSpawnRestCooldownTimer, MOB_SPAWN_REST_COOLDOWN));
    const manageableThreshold = manageableMobRestThreshold(players);

    if (world.mobSpawnRestDrainTimer > 0) {
      world.mobSpawnRestDrainTimer = Math.max(0, world.mobSpawnRestDrainTimer - dt);
      if (totalLiveMobCount(world) <= manageableThreshold || world.mobSpawnRestDrainTimer <= 0) {
        startMobSpawnGracePeriod(world);
      }
      return true;
    }

    if (world.mobSpawnRestTimer > 0) {
      world.mobSpawnRestTimer = Math.max(0, world.mobSpawnRestTimer - dt);
      return true;
    }

    world.mobSpawnRestCooldownTimer = Math.max(0, world.mobSpawnRestCooldownTimer - dt);
    if (world.mobSpawnRestCooldownTimer > 0) {
      return false;
    }

    world.mobSpawnRestDrainTimer = MOB_SPAWN_REST_DRAIN_MAX_DURATION;
    world.mobSpawnRestCooldownTimer = MOB_SPAWN_REST_COOLDOWN;
    if (totalLiveMobCount(world) <= manageableThreshold) {
      startMobSpawnGracePeriod(world);
    }
    return true;
  }

  function updateMobSpawns(state, dt) {
    const world = state.world;
    const players = activeWorldPlayers(state);
    if (!players.length) {
      if (!isHordeGameMode(state.gameMode || world.gameMode)) {
        world.mobBeacons = [];
        ensureSurvivalSpawnState(world);
      }
      return;
    }
    const seedHolder = { seed: state.seed >>> 0 };
    if (!isHordeGameMode(state.gameMode || world.gameMode)) {
      updateSurvivalAllowanceMobSpawns(state, world, players, dt, seedHolder);
      state.seed = seedHolder.seed >>> 0;
      return;
    }

    updateHordeMobSpawns(state, world, players, dt, seedHolder);
    state.seed = seedHolder.seed >>> 0;
  }

  function isAmbientParticle(body) {
    return Boolean(body && body.tier && !body.tier.solid);
  }

  function countAmbientParticles(world) {
    let count = 0;
    for (const body of world.particles) {
      if (isAmbientParticle(body)) {
        count += 1;
      }
    }
    return count;
  }

  function updateHordeMobSpawns(state, world, players, dt, seedHolder) {
    updateMobBeacons(state, players, dt, seedHolder);
    updateMobBossWarnings(state, players, dt, seedHolder);
    if (updateMobSpawnRest(world, players, dt)) {
      return;
    }

    world.mobWaveTimer = finiteOr(world.mobWaveTimer, difficultyMobWaveInterval(state)) - dt;
    while (world.mobWaveTimer <= 0) {
      const slots = buildMobWaveSlots(state, world, rollMobWaveSize(state, world, players, seedHolder), players, seedHolder);
      if (slots.length) {
        const spawnedKinds = spawnMobWave(state, slots, players, seedHolder);
        for (const kind of spawnedKinds) {
          maybeScheduleMobBoss(state, kind, seedHolder);
        }
        world.mobWaveCount = Math.max(0, Math.floor(finiteOr(world.mobWaveCount, 0))) + 1;
      }
      world.mobWaveTimer += mobWaveIntervalWithBossPressure(state);
    }
  }

  const SURVIVAL_ALLOWANCE_MOB_COSTS = {
    alienoid: 50,
    ufo: 150,
    rambot: 240,
    engineer: 300,
    tesla: 360,
    satellite: 480,
    rocket: 520,
    fighter: 700
  };

  function normalizeSurvivalSpawnState(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    return {
      nextCampCheckTick: Math.max(0, Math.floor(finiteOr(snapshot.nextCampCheckTick, snapshot.nextCampCheckAt || 0))),
      exploredInitialized: Boolean(snapshot.exploredInitialized),
      exploredMinX: finiteOr(snapshot.exploredMinX, 0),
      exploredMaxX: finiteOr(snapshot.exploredMaxX, 0),
      exploredMinY: finiteOr(snapshot.exploredMinY, 0),
      exploredMaxY: finiteOr(snapshot.exploredMaxY, 0)
    };
  }

  function ensureSurvivalSpawnState(world) {
    if (!world.survivalSpawnState || typeof world.survivalSpawnState !== "object") {
      world.survivalSpawnState = normalizeSurvivalSpawnState(null);
    }
    world.survivalSpawnState = normalizeSurvivalSpawnState(world.survivalSpawnState);
    return world.survivalSpawnState;
  }

  function serializeSurvivalSpawnState(source) {
    return normalizeSurvivalSpawnState(source);
  }

  function survivalMobAllowanceCost(kind, options) {
    const baseCost = SURVIVAL_ALLOWANCE_MOB_COSTS[kind] || SURVIVAL_ALLOWANCE_MOB_COSTS.alienoid;
    const settings = options && typeof options === "object" ? options : {};
    if (settings.isBoss) {
      return Math.round(baseCost * (12 + Math.max(0, Math.floor(finiteOr(settings.bossStars, 0))) * 4));
    }
    const stars = mobEliteStarRankValue(settings.eliteStars);
    if (stars > 0) {
      return Math.round(baseCost * stars * MOB_ELITE_COMPRESSION_SIZE * 1.15);
    }
    return baseCost;
  }

  function survivalAllowanceCandidateList(budget, options) {
    const settings = options && typeof options === "object" ? options : {};
    const allowBosses = settings.allowBosses !== false;
    const threat = Math.max(0, finiteOr(settings.scoreThreat, 0));
    const preferredCost = Math.max(
      SURVIVAL_ALLOWANCE_MOB_COSTS.alienoid,
      budget * clamp(0.24 + threat * 0.035, 0.24, 0.62)
    );
    const candidates = [];
    for (let kindIndex = 0; kindIndex < MOB_TIER_ORDER.length; kindIndex += 1) {
      const kind = MOB_TIER_ORDER[kindIndex];
      const baseCost = survivalMobAllowanceCost(kind);
      const tierLift = Math.pow(kindIndex + 1, clamp(threat * 0.09, 0, 1));
      if (baseCost <= budget) {
        const fit = Math.exp(-Math.abs(Math.log(baseCost / preferredCost)) * 1.25);
        candidates.push({ kind, cost: baseCost, eliteStars: 0, eliteGroupSize: 1, isBoss: false, weight: fit * tierLift });
      }
      for (let stars = 1; stars <= MOB_ELITE_MAX_STARS; stars += 1) {
        const cost = survivalMobAllowanceCost(kind, { eliteStars: stars });
        if (cost <= budget) {
          const fit = Math.exp(-Math.abs(Math.log(cost / preferredCost)) * 1.12);
          candidates.push({
            kind,
            cost,
            eliteStars: stars,
            eliteGroupSize: stars * MOB_ELITE_COMPRESSION_SIZE,
            isBoss: false,
            weight: (0.32 + Math.min(0.5, threat * 0.055)) * fit * tierLift
          });
        }
      }
      if (allowBosses) {
        for (let bossStars = 0; bossStars <= 2; bossStars += 1) {
          const cost = survivalMobAllowanceCost(kind, { isBoss: true, bossStars });
          if (cost <= budget) {
            const fit = Math.exp(-Math.abs(Math.log(cost / preferredCost)) * 0.95);
            candidates.push({
              kind,
              cost,
              eliteStars: 0,
              eliteGroupSize: 1,
              isBoss: true,
              bossStars,
              weight: (0.08 + Math.min(0.72, threat * 0.075)) * fit * tierLift
            });
          }
        }
      }
    }
    return candidates;
  }

  function chooseWeightedSurvivalCandidate(candidates, seedHolder) {
    const totalWeight = candidates.reduce((sum, candidate) => sum + Math.max(0, finiteOr(candidate.weight, 0)), 0);
    if (totalWeight <= 0) {
      return candidates[0] || null;
    }
    let roll = randomRange(seedHolder, 0, totalWeight);
    for (const candidate of candidates) {
      roll -= Math.max(0, finiteOr(candidate.weight, 0));
      if (roll <= 0) {
        return candidate;
      }
    }
    return candidates[candidates.length - 1] || null;
  }

  function planSurvivalAllowanceMobs(budget, options) {
    const settings = options && typeof options === "object" ? options : {};
    const seedHolder = settings.seedHolder || { seed: 1 };
    let remaining = Math.max(0, finiteOr(budget, 0));
    const entries = [];
    if (settings.forceBoss) {
      const bossCandidates = survivalAllowanceCandidateList(remaining, settings)
        .filter((candidate) => candidate.isBoss)
        .sort((a, b) => (
          MOB_TIER_ORDER.indexOf(b.kind) - MOB_TIER_ORDER.indexOf(a.kind) ||
          finiteOr(a.bossStars, 0) - finiteOr(b.bossStars, 0)
        ));
      const boss = bossCandidates[0];
      if (boss) {
        entries.push({
          kind: boss.kind,
          cost: boss.cost,
          eliteStars: 0,
          eliteGroupSize: 1,
          isBoss: true,
          bossStars: Math.max(0, Math.floor(finiteOr(boss.bossStars, 0)))
        });
        remaining -= boss.cost;
      }
    }
    while (remaining >= SURVIVAL_ALLOWANCE_MOB_COSTS.alienoid && entries.length < 18) {
      const candidates = survivalAllowanceCandidateList(remaining, settings);
      if (!candidates.length) {
        break;
      }
      const choice = chooseWeightedSurvivalCandidate(candidates, seedHolder);
      if (!choice || choice.cost > remaining) {
        break;
      }
      entries.push({
        kind: choice.kind,
        cost: choice.cost,
        eliteStars: choice.eliteStars || 0,
        eliteGroupSize: choice.eliteGroupSize || 1,
        isBoss: Boolean(choice.isBoss),
        bossStars: Math.max(0, Math.floor(finiteOr(choice.bossStars, 0)))
      });
      remaining -= choice.cost;
    }
    return entries;
  }

  function activeSurvivalSpawnPlayers(state) {
    return Object.values(state.players || {}).filter((entry) => (
      entry &&
      finiteOr(entry.health, 0) > 0 &&
      !entry.spacecraftInterior &&
      Number.isFinite(Number(entry.x)) &&
      Number.isFinite(Number(entry.y))
    )).slice(0, MAX_PLAYERS).map((player) => ({
      ...player,
      id: String(player.id || ""),
      score: Math.max(1, Math.round(finiteOr(player.score, 1)))
    }));
  }

  function activeSurvivalEncounterCounts(world, players) {
    const seen = new Set();
    const counts = { starter: 0, standard: 0, dangerous: 0, boss: 0, total: 0 };
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob) || mob.survivalEncounterType !== "camp") {
        continue;
      }
      const encounterId = mob.survivalEncounterId || mob.survivalCampId || "";
      if (!encounterId || seen.has(encounterId)) {
        continue;
      }
      if (Array.isArray(players) && players.length && nearestPlayerDistance(
        finiteOr(mob.survivalCampX, mob.x),
        finiteOr(mob.survivalCampY, mob.y),
        players
      ) > SURVIVAL_CAMP_ACTIVE_RADIUS) {
        continue;
      }
      seen.add(encounterId);
      const band = mob.survivalCampBand || "starter";
      counts[band] = Math.max(0, counts[band] || 0) + 1;
      counts.total += 1;
    }
    return counts;
  }

  function survivalCampCombatProgress(world) {
    const defeats = world && world.mobDefeatsByKind && typeof world.mobDefeatsByKind === "object" ? world.mobDefeatsByKind : {};
    return MOB_TIER_ORDER.reduce((total, kind) => (
      total + Math.max(0, Math.floor(finiteOr(defeats[kind], 0))) * survivalMobAllowanceCost(kind)
    ), 0);
  }

  function survivalCampBossProgressReady(world) {
    const bossDefeats = world && world.mobBossDefeatsByKind && typeof world.mobBossDefeatsByKind === "object" ? world.mobBossDefeatsByKind : {};
    const bossProgress = world && world.mobBossProgressByKind && typeof world.mobBossProgressByKind === "object" ? world.mobBossProgressByKind : {};
    return MOB_TIER_ORDER.some((kind) => (
      Math.max(0, Math.floor(finiteOr(bossDefeats[kind], 0))) > 0 ||
      Math.max(0, Math.floor(finiteOr(bossProgress[kind], 0))) >= MOB_BOSS_DEFEATS_TO_UNLOCK
    ));
  }

  function updateSurvivalExploration(spawnState, players) {
    if (!spawnState || !Array.isArray(players) || !players.length) {
      return;
    }
    for (const player of players) {
      const x = finiteOr(player && player.x, 0);
      const y = finiteOr(player && player.y, 0);
      if (!spawnState.exploredInitialized) {
        Object.assign(spawnState, { exploredInitialized: true, exploredMinX: x, exploredMaxX: x, exploredMinY: y, exploredMaxY: y });
        continue;
      }
      spawnState.exploredMinX = Math.min(spawnState.exploredMinX, x);
      spawnState.exploredMaxX = Math.max(spawnState.exploredMaxX, x);
      spawnState.exploredMinY = Math.min(spawnState.exploredMinY, y);
      spawnState.exploredMaxY = Math.max(spawnState.exploredMaxY, y);
    }
  }

  function survivalExploredSpan(spawnState) {
    if (!spawnState || !spawnState.exploredInitialized) {
      return 0;
    }
    return Math.hypot(
      Math.max(0, finiteOr(spawnState.exploredMaxX, 0) - finiteOr(spawnState.exploredMinX, 0)),
      Math.max(0, finiteOr(spawnState.exploredMaxY, 0) - finiteOr(spawnState.exploredMinY, 0))
    );
  }

  function survivalScoreThreat(players) {
    const totalScore = (players || []).reduce((total, player) => total + Math.max(0, finiteOr(player && player.score, 0)), 0);
    return Math.max(0, Math.log2(1 + totalScore / 6000));
  }

  function survivalScoreBudgetScale(state, scoreThreat) {
    const difficultyScale = finiteOr(difficultyMobSettings(state).survivalBudgetScale, 1);
    return difficultyScale * (1 + 0.075 * Math.pow(Math.max(0, scoreThreat), 1.35));
  }

  function survivalCampBands(state, world, combatProgress, playerCount, scoreThreat, spawnState) {
    const playerBonus = Math.max(0, Math.min(MAX_PLAYERS - 1, Math.floor(finiteOr(playerCount, 1)) - 1));
    const effectiveProgress = combatProgress + Math.max(0, scoreThreat) * 300;
    const standardUnlocked = effectiveProgress >= survivalMobAllowanceCost("alienoid") * 3;
    const dangerousUnlocked = effectiveProgress >= survivalMobAllowanceCost("ufo") * 4;
    const bossUnlocked = effectiveProgress >= survivalMobAllowanceCost("rambot") * 8 || survivalCampBossProgressReady(world);
    const difficultySettings = difficultyMobSettings(state);
    const difficultyExpansion = finiteOr(difficultySettings.survivalCampScale, 1) >= 1.1 ? 1 : 0;
    const expansion = clamp(
      Math.floor(survivalExploredSpan(spawnState) / SURVIVAL_CAMP_EXPANSION_DISTANCE) + difficultyExpansion,
      0,
      SURVIVAL_CAMP_MAX_EXPANSION
    );
    const extra = (index) => Math.floor((expansion + 3 - index) / 4);
    const budgetScale = survivalScoreBudgetScale(state, scoreThreat);
    const band = (id, target, minBudget, maxBudget, allowBosses, index) => ({
      id,
      target: target > 0 ? target + extra(index) : 0,
      minBudget: Math.round(minBudget * budgetScale),
      maxBudget: Math.round(maxBudget * budgetScale),
      allowBosses,
      scoreThreat,
      forceBoss: id === "boss" && scoreThreat >= 3.2
    });
    return [
      band("starter", 2 + playerBonus, 50, 180, false, 0),
      band("standard", standardUnlocked ? 1 + playerBonus : 0, 150, 380, false, 1),
      band("dangerous", dangerousUnlocked ? 1 + Math.floor(playerBonus / 2) : 0, 340, 900, false, 2),
      band("boss", bossUnlocked ? 1 : 0, 850, 3000, true, 3)
    ];
  }

  function chooseSurvivalCampBand(state, world, players, seedHolder, spawnState) {
    const combatProgress = survivalCampCombatProgress(world);
    const scoreThreat = survivalScoreThreat(players);
    const counts = activeSurvivalEncounterCounts(world, players);
    for (const band of survivalCampBands(state, world, combatProgress, players.length || 1, scoreThreat, spawnState)) {
      if (band.target > 0 && (counts[band.id] || 0) < band.target) {
        const budget = clamp(randomRange(seedHolder, band.minBudget, band.maxBudget), 50, Math.max(50, band.maxBudget));
        return { ...band, budget: Math.max(50, Math.round(budget)), combatProgress, scoreThreat };
      }
    }
    return null;
  }

  function nearestSurvivalAllowanceCampDistance(world, x, y) {
    let nearest = Infinity;
    const seen = new Set();
    for (const mob of allCombatMobs(world)) {
      const encounterId = mob && (mob.survivalEncounterId || mob.survivalCampId);
      if (!mob || mob.survivalEncounterType !== "camp" || !encounterId || seen.has(encounterId)) {
        continue;
      }
      seen.add(encounterId);
      const distance = Math.hypot(x - finiteOr(mob.survivalCampX, mob.x), y - finiteOr(mob.survivalCampY, mob.y));
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function collectSurvivalCampGroups(state) {
    const world = state.world;
    const groups = new Map();
    const ensure = (campId) => {
      const id = String(campId || "");
      if (!id) {
        return null;
      }
      if (!groups.has(id)) {
        groups.set(id, { id, mobs: [], bodies: [], structures: [], x: 0, y: 0, weight: 0, band: "starter", budget: 0 });
      }
      return groups.get(id);
    };
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob) || mob.survivalEncounterType !== "camp") {
        continue;
      }
      const group = ensure(mob.survivalCampId || mob.survivalEncounterId);
      if (!group) continue;
      group.mobs.push(mob);
      group.band = mob.survivalCampBand || group.band;
      group.budget = Math.max(group.budget, finiteOr(mob.survivalCampBudget, 0));
      group.x += finiteOr(mob.survivalCampX, mob.x) * 2;
      group.y += finiteOr(mob.survivalCampY, mob.y) * 2;
      group.weight += 2;
    }
    const scoredBodyIds = playerScoredSurvivalCampBodyIds(state);
    for (const body of world.particles || []) {
      if (!body || !body.survivalCampBody || !body.survivalCampId || isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds)) {
        continue;
      }
      const group = ensure(body.survivalCampId);
      const weight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      group.bodies.push(body);
      group.x += finiteOr(body.x, 0) * weight;
      group.y += finiteOr(body.y, 0) * weight;
      group.weight += weight;
    }
    for (const structure of world.structures || []) {
      if (!structure || !structure.survivalCampId || finiteOr(structure.health, 0) <= 0) continue;
      const group = ensure(structure.survivalCampId);
      group.structures.push(structure);
    }
    for (const group of groups.values()) {
      if (group.weight > 0) {
        group.x /= group.weight;
        group.y /= group.weight;
      }
    }
    return groups;
  }

  function setMobSurvivalMigration(mob, targetCamp) {
    if (!mob) return;
    mob.survivalCampId = "";
    mob.survivalCampReturning = true;
    mob.survivalCampAggroTimer = 0;
    mob.survivalTargetPlayerId = "";
    mob.survivalEncounterType = "migration";
    mob.survivalEncounterId = "";
    mob.survivalMigrationCampId = targetCamp && targetCamp.id || "";
    mob.survivalMigrationCampX = targetCamp ? targetCamp.x : Number.NaN;
    mob.survivalMigrationCampY = targetCamp ? targetCamp.y : Number.NaN;
    mob.survivalMigrationStraightTime = 0;
  }

  function retireDistantSurvivalCamps(state, players) {
    const groups = Array.from(collectSurvivalCampGroups(state).values()).filter((group) => group.mobs.length);
    if (!groups.length || !players.length) return;
    const active = groups.filter((group) => nearestPlayerDistance(group.x, group.y, players) <= SURVIVAL_CAMP_ACTIVE_RADIUS);
    const keeper = active.length ? null : groups.slice().sort((a, b) => nearestPlayerDistance(a.x, a.y, players) - nearestPlayerDistance(b.x, b.y, players))[0];
    for (const group of groups) {
      if (active.includes(group) || group === keeper) continue;
      const destinations = (active.length ? active : groups).filter((candidate) => candidate !== group && candidate.bodies.length);
      let target = null;
      let bestDistance = Infinity;
      for (const candidate of destinations) {
        const distance = Math.hypot(candidate.x - group.x, candidate.y - group.y);
        if (distance < bestDistance) {
          target = candidate;
          bestDistance = distance;
        }
      }
      for (const mob of group.mobs) {
        if (mob.survivalSalvageBodyId) continue;
        setMobSurvivalMigration(mob, target);
      }
    }
  }

  function beginSurvivalSalvageAssignment(ufo, body, sourceCamp, targetCamp) {
    if (!ufo || !body || !targetCamp) return false;
    setMobSurvivalMigration(ufo, targetCamp);
    ufo.survivalEncounterType = "salvage";
    ufo.survivalEncounterId = "salvage-body-" + body.id;
    ufo.survivalSalvageBodyId = body.id;
    ufo.survivalSalvageSourceCampId = sourceCamp && sourceCamp.id || body.survivalCampId || "";
    ufo.survivalSalvageTargetCampId = targetCamp.id;
    ufo.survivalSalvageAge = 0;
    return true;
  }

  function spawnSurvivalSalvageUfo(state, players, seedHolder, body, sourceCamp, targetCamp) {
    const world = state.world;
    const offscreenDistance = MOB_SPAWN_FULLY_ZOOMED_OUT_VIEW_RADIUS + 720;
    let x;
    let y;
    if (nearestPlayerDistance(body.x, body.y, players) > offscreenDistance) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const distance = randomRange(seedHolder, 900, 1500);
      x = body.x + Math.cos(angle) * distance;
      y = body.y + Math.sin(angle) * distance;
    } else {
      const anchor = leastPopulatedMobAnchor(world, players);
      const spawn = chooseMobSpawnPoint(world, "ufo", anchor, players, seedHolder);
      x = spawn.x;
      y = spawn.y;
    }
    const ufo = createMob(world, "ufo", x, y, seedHolder);
    beginSurvivalSalvageAssignment(ufo, body, sourceCamp, targetCamp);
    world.ufos.push(ufo);
    state.events.push({ type: "mob.camp.salvagerSpawned", mobId: ufo.id, bodyId: body.id, targetCampId: targetCamp.id, tick: state.tick });
    return ufo;
  }

  function manageSurvivalCampSalvage(state, players, seedHolder) {
    const groups = collectSurvivalCampGroups(state);
    const populated = Array.from(groups.values()).filter((group) => group.mobs.length && group.bodies.length);
    if (!populated.length) return;
    const assignedBodyIds = new Set((state.world.ufos || [])
      .filter((ufo) => ufo && ufo.health > 0 && ufo.survivalSalvageBodyId)
      .map((ufo) => Math.floor(finiteOr(ufo.survivalSalvageBodyId, 0))));
    const orphaned = Array.from(groups.values()).filter((group) => !group.mobs.length && group.bodies.length);
    let activeSalvagers = assignedBodyIds.size;
    for (const source of orphaned) {
      const bodies = source.bodies.slice().sort((a, b) => finiteOr(b.mass, 0) - finiteOr(a.mass, 0));
      for (const body of bodies) {
        if (assignedBodyIds.has(body.id) || activeSalvagers >= SURVIVAL_SALVAGE_MAX_UFOS) continue;
        const target = populated.slice().sort((a, b) => Math.hypot(a.x - body.x, a.y - body.y) - Math.hypot(b.x - body.x, b.y - body.y))[0];
        if (!target || target.id === source.id) continue;
        const idleCampUfo = (state.world.ufos || []).find((ufo) => (
          ufo &&
          ufo.health > 0 &&
          !ufo.survivalSalvageBodyId &&
          ufo.survivalCampId &&
          groups.has(ufo.survivalCampId) &&
          groups.get(ufo.survivalCampId).mobs.length > 1
        ));
        if (idleCampUfo) {
          beginSurvivalSalvageAssignment(idleCampUfo, body, source, target);
          state.events.push({ type: "mob.camp.salvagerAssigned", mobId: idleCampUfo.id, bodyId: body.id, targetCampId: target.id, tick: state.tick });
        } else {
          spawnSurvivalSalvageUfo(state, players, seedHolder, body, source, target);
        }
        assignedBodyIds.add(body.id);
        activeSalvagers += 1;
      }
    }
  }

  function survivalSalvageBody(world, ufo) {
    const bodyId = Math.floor(finiteOr(ufo && ufo.survivalSalvageBodyId, 0));
    return bodyId > 0 ? (world.particles || []).find((body) => body && body.id === bodyId) || null : null;
  }

  function clearSurvivalSalvageAssignment(ufo) {
    if (!ufo) return;
    ufo.survivalSalvageBodyId = 0;
    ufo.survivalSalvageSourceCampId = "";
    ufo.survivalSalvageTargetCampId = "";
    ufo.survivalSalvageAge = 0;
  }

  function finishSurvivalSalvage(state, ufo, body, destination) {
    const targetCampId = String(destination && destination.campId || ufo.survivalSalvageTargetCampId || "");
    if (!targetCampId) return false;
    const sourceCampId = String(body.survivalCampId || ufo.survivalSalvageSourceCampId || "");
    body.survivalCampId = targetCampId;
    body.survivalCampX = destination.x;
    body.survivalCampY = destination.y;
    body.survivalCampHomeX = finiteOr(body.x, destination.x);
    body.survivalCampHomeY = finiteOr(body.y, destination.y);
    body.survivalCampMovedByPlayer = false;
    body.survivalCampBodyMovedWakeSent = false;
    const pull = normalize(destination.x - body.x, destination.y - body.y);
    body.vx += pull.x * 120;
    body.vy += pull.y * 120;
    for (const structure of state.world.structures || []) {
      if (!structure || structure.bodyId !== body.id || structure.survivalCampId !== sourceCampId) continue;
      structure.survivalCampId = targetCampId;
      structure.survivalEncounterId = targetCampId;
      structure.survivalCampX = destination.x;
      structure.survivalCampY = destination.y;
    }
    ufo.survivalCampId = targetCampId;
    ufo.survivalCampX = destination.x;
    ufo.survivalCampY = destination.y;
    ufo.survivalCampReturning = true;
    ufo.survivalEncounterType = "camp";
    ufo.survivalEncounterId = targetCampId;
    ufo.survivalTargetPlayerId = "";
    clearSurvivalCampMigrationState(ufo);
    clearSurvivalSalvageAssignment(ufo);
    state.events.push({ type: "mob.camp.salvageDelivered", mobId: ufo.id, bodyId: body.id, targetCampId, tick: state.tick });
    return true;
  }

  function survivalSalvageTowTarget(state, ufo, dt) {
    if (!ufo || !ufo.survivalSalvageBodyId) return null;
    const body = survivalSalvageBody(state.world, ufo);
    if (!body) {
      clearSurvivalSalvageAssignment(ufo);
      ufo.survivalEncounterType = "migration";
      return null;
    }
    let destination = survivalCampAnchorPoint(
      state,
      ufo.survivalSalvageTargetCampId,
      finiteOr(ufo.survivalMigrationCampX, body.x),
      finiteOr(ufo.survivalMigrationCampY, body.y)
    );
    if (!destination.hasCampBody) {
      const nearest = nearestSurvivalCampAnchor(state, body.survivalCampId, body.x, body.y);
      if (!nearest) return null;
      ufo.survivalSalvageTargetCampId = nearest.campId;
      destination = { ...nearest, hasCampBody: true };
    } else {
      destination.campId = String(ufo.survivalSalvageTargetCampId || "");
    }
    const dx = destination.x - body.x;
    const dy = destination.y - body.y;
    const distance = Math.hypot(dx, dy) || 1;
    ufo.survivalSalvageAge = Math.max(0, finiteOr(ufo.survivalSalvageAge, 0) + dt);
    if (distance <= SURVIVAL_SALVAGE_ARRIVAL_RADIUS + finiteOr(body.radius, 0)) {
      finishSurvivalSalvage(state, ufo, body, destination);
      return null;
    }
    const nx = dx / distance;
    const ny = dy / distance;
    const towOffset = clamp(finiteOr(body.radius, 0) + 310, 380, 620);
    return {
      kind: "salvage",
      body,
      x: body.x + nx * towOffset,
      y: body.y + ny * towOffset,
      radius: 0,
      destinationX: destination.x,
      destinationY: destination.y
    };
  }

  function chooseSurvivalAllowanceSpawnPoint(world, players, seedHolder, options) {
    const sourcePlayers = Array.isArray(players) && players.length ? players : [{ x: 0, y: 0, vx: 0, vy: 0 }];
    const source = leastPopulatedMobAnchor(world, sourcePlayers);
    const settings = options && typeof options === "object" ? options : {};
    const minDistance = Math.max(
      finiteOr(settings.minDistance, SURVIVAL_CAMP_SPAWN_MIN_DISTANCE),
      MOB_SPAWN_FULLY_ZOOMED_OUT_VIEW_RADIUS + finiteOr(settings.zoomPadding, SURVIVAL_CAMP_SPAWN_DISTANCE_PADDING)
    );
    const spread = Math.max(1, finiteOr(settings.spread, SURVIVAL_CAMP_SPAWN_DISTANCE_SPREAD));
    const preferredSeparation = Math.max(0, finiteOr(settings.preferredSeparation, SURVIVAL_CAMP_ALLOWANCE_PREFERRED_SEPARATION));
    let best = null;
    let bestValid = null;

    for (let attempt = 0; attempt < 72; attempt += 1) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const distance = randomRange(seedHolder, minDistance, minDistance + spread);
      const side = angle + Math.PI / 2;
      const x = source.x + Math.cos(angle) * distance + Math.cos(side) * randomRange(seedHolder, -720, 720);
      const y = source.y + Math.sin(angle) * distance + Math.sin(side) * randomRange(seedHolder, -720, 720);
      const nearestPlayer = nearestPlayerDistance(x, y, sourcePlayers);
      const nearestCamp = nearestSurvivalAllowanceCampDistance(world, x, y);
      const spacing = Number.isFinite(nearestCamp) ? Math.min(nearestCamp, preferredSeparation * 2.4) : preferredSeparation * 1.8;
      const tooCloseToPlayer = Math.max(0, minDistance - nearestPlayer);
      const tooCloseToCamp = Math.max(0, preferredSeparation - spacing);
      const score = nearestPlayer * 0.24 + spacing * 0.82 - tooCloseToPlayer * 9 - tooCloseToCamp * 6;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (nearestPlayer >= minDistance && spacing >= preferredSeparation && (!bestValid || score > bestValid.score)) {
        bestValid = { x, y, score };
      }
    }

    return bestValid || best || { x: source.x + minDistance, y: source.y };
  }

  const SURVIVAL_CAMP_STRUCTURE_WEIGHTS = [
    { type: "turret", weight: 5 },
    { type: "container", weight: 4 },
    { type: "battery", weight: 4 },
    { type: "shield-generator", weight: 3 },
    { type: "missile-launcher", weight: 3 },
    { type: "accumulator", weight: 2 },
    { type: "plating-block", weight: 1 }
  ];

  function survivalCampMobPressure(entries) {
    return (entries || []).reduce((total, entry) => (
      total +
      Math.max(1, Math.floor(finiteOr(entry && entry.eliteGroupSize, 1))) +
      (entry && entry.isBoss ? 3 + Math.max(0, Math.floor(finiteOr(entry.bossStars, 0))) : 0)
    ), 0);
  }

  function survivalCampStructureTargetCount(entries, budget) {
    const pressure = survivalCampMobPressure(entries);
    if (pressure < 3 && finiteOr(budget, 0) < 180) {
      return 0;
    }
    return clamp(Math.floor((pressure + 1) / 3), 1, 6);
  }

  function survivalCampBodyMasses(budget, structureTargetCount, seedHolder) {
    const targetStructures = Math.max(0, Math.floor(finiteOr(structureTargetCount, 0)));
    const bodyBudget = clamp(
      Math.max(finiteOr(budget, 50) * 0.45, targetStructures * randomRange(seedHolder, 560, 760)),
      25,
      4200
    );
    const bodyCount = clamp(Math.floor(2 + Math.log2(Math.max(1, finiteOr(budget, 50)) / 150) + targetStructures * 0.55), 2, 8);
    const masses = [];
    let remaining = bodyBudget;
    for (let i = 0; i < bodyCount; i += 1) {
      const slotsLeft = bodyCount - i;
      const average = remaining / Math.max(1, slotsLeft);
      const mass = i === bodyCount - 1
        ? remaining
        : clamp(randomRange(seedHolder, average * 0.55, average * 1.55), 1, remaining - (slotsLeft - 1));
      masses.push(Math.max(1, mass));
      remaining = Math.max(0, remaining - mass);
    }
    if (!masses.some((mass) => mass >= SURVIVAL_CAMP_RADAR_BODY_MIN_MASS)) {
      masses[0] = SURVIVAL_CAMP_RADAR_BODY_MIN_MASS;
    }
    for (let i = 0; i < Math.min(targetStructures, masses.length); i += 1) {
      masses[i] = Math.max(masses[i], randomRange(seedHolder, STRUCTURE_PLACEMENT_TIER_THRESHOLD * 1.04, STRUCTURE_PLACEMENT_TIER_THRESHOLD * 1.95));
    }
    return masses;
  }

  function spawnSurvivalAllowanceCampBodies(state, campId, campX, campY, budget, structureTargetCount, seedHolder) {
    const world = state.world;
    const masses = survivalCampBodyMasses(budget, structureTargetCount, seedHolder);
    const bodies = [];
    for (let i = 0; i < masses.length; i += 1) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2) + i * 2.399963229728653;
      const distance = i === 0 ? randomRange(seedHolder, 0, 140) : randomRange(seedHolder, 260, SURVIVAL_CAMP_IDLE_RADIUS * 1.16);
      const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
      const body = normalizeParticle({
        id,
        x: campX + Math.cos(angle) * distance,
        y: campY + Math.sin(angle) * distance,
        mass: masses[i],
        color: randomParticleColor(seedHolder),
        survivalCampId: campId,
        survivalCampX: campX,
        survivalCampY: campY,
        survivalCampHomeX: campX + Math.cos(angle) * distance,
        survivalCampHomeY: campY + Math.sin(angle) * distance,
        survivalCampBody: true
      }, id, seedHolder);
      const tangent = angle + Math.PI / 2;
      const driftSpeed = clamp(Math.sqrt(Math.max(1, masses[i])) * 2.4, 18, 82);
      body.vx = Math.cos(tangent) * driftSpeed + randomRange(seedHolder, -12, 12);
      body.vy = Math.sin(tangent) * driftSpeed + randomRange(seedHolder, -12, 12);
      if (bodies.length && body.tier && body.tier.name !== "star") {
        body.orbitHostId = bodies[0].id;
        body.orbitDirection = randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1;
        body.orbitStrength = 0.35;
      }
      world.particles.push(body);
      bodies.push(body);
      world.nextParticleId = Math.max(world.nextParticleId, body.id + 1);
    }
    return bodies;
  }

  function chooseSurvivalCampStructureType(index, band, seedHolder) {
    if (index === 0) {
      return randomRange(seedHolder, 0, 1) < 0.58 ? "turret" : "container";
    }
    if (index === 1) {
      return randomRange(seedHolder, 0, 1) < 0.5 ? "battery" : "shield-generator";
    }
    if (band && (band.id === "dangerous" || band.id === "boss") && randomRange(seedHolder, 0, 1) < 0.34) {
      return "missile-launcher";
    }
    const totalWeight = SURVIVAL_CAMP_STRUCTURE_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = randomRange(seedHolder, 0, totalWeight);
    for (const entry of SURVIVAL_CAMP_STRUCTURE_WEIGHTS) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.type;
      }
    }
    return "turret";
  }

  function survivalCampContainerLoot(band, budget, seedHolder) {
    const loot = cloneTechInventory(null);
    const bandScale = band && band.id === "boss" ? 2.2 : band && band.id === "dangerous" ? 1.6 : band && band.id === "standard" ? 1.2 : 0.85;
    const rolls = clamp(Math.floor(randomRange(seedHolder, 2, 5) + Math.log2(Math.max(2, finiteOr(budget, 50))) * 0.45), 2, 7);
    for (let i = 0; i < rolls; i += 1) {
      const key = TECH_KEYS[Math.floor(randomRange(seedHolder, 0, TECH_KEYS.length))];
      if (key) {
        loot[key] += Math.max(1, Math.floor(randomRange(seedHolder, 1, 4 + bandScale * 3)));
      }
    }
    return loot;
  }

  function nextCampStructureId(world) {
    const nextId = Math.max(
      1,
      Math.floor(finiteOr(world.nextStructureId, 1)),
      Array.isArray(world.structures)
        ? world.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
        : 1
    );
    world.nextStructureId = nextId + 1;
    return nextId;
  }

  function createSurvivalCampStructure(state, type, body, angle, campId, campX, campY, band, budget, seedHolder) {
    const world = state.world;
    const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
    const centerOffset = structureCenterOffset(type, surfaceOffset);
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    const maxHealth = structureMaxHealth(type);
    const x = body.x + Math.cos(angle) * (radius + centerOffset);
    const y = body.y + Math.sin(angle) * (radius + centerOffset);
    return {
      id: nextCampStructureId(world),
      type,
      ownerPlayerId: "survival-camp:" + campId,
      bodyId: body.id,
      linkedBodyId: 0,
      angle,
      linkedAngle: 0,
      surfaceOffset,
      linkedSurfaceOffset: 0,
      x,
      y,
      x2: x,
      y2: y,
      restLength: 0,
      restCenterDx: 0,
      restCenterDy: 0,
      aimAngle: angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: randomRange(seedHolder, 0.2, 1.2),
      burstTimer: 0,
      burstCooldown: randomRange(seedHolder, 0.4, ACCUMULATOR_BURST_INTERVAL),
      healPulse: 0,
      missileCharge: type === "missile-launcher" ? randomRange(seedHolder, 0.25, 0.85) : 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: x,
      targetY: y,
      targetCount: 0,
      health: maxHealth,
      maxHealth,
      disabledTimer: 0,
      flash: 0,
      tech: type === "container" ? survivalCampContainerLoot(band, budget, seedHolder) : cloneTechInventory(null),
      tradeOffers: [],
      tradeOfferSeq: 1,
      tradeVessel: null,
      survivalCampId: campId,
      survivalCampX: campX,
      survivalCampY: campY,
      survivalCampAggroTimer: 0,
      survivalEncounterType: "camp",
      survivalEncounterId: campId,
      survivalCampBudget: budget,
      survivalCampBand: band && band.id || "",
      survivalTargetPlayerId: "",
      wobble: randomRange(seedHolder, 0, Math.PI * 2)
    };
  }

  function spawnSurvivalCampStructures(state, campId, campX, campY, band, entries, bodies, seedHolder) {
    const world = state.world;
    if (!Array.isArray(world.structures)) {
      world.structures = [];
    }
    const targetCount = survivalCampStructureTargetCount(entries, band && band.budget);
    if (targetCount <= 0 || !Array.isArray(bodies) || !bodies.length) {
      return 0;
    }
    const hostBodies = bodies.filter((body) => isStructureHostBodyForType(body, "turret"));
    if (!hostBodies.length) {
      return 0;
    }
    let placed = 0;
    for (let i = 0; i < targetCount; i += 1) {
      const type = chooseSurvivalCampStructureType(i, band, seedHolder);
      const body = hostBodies[i % hostBodies.length];
      if (!isStructureHostBodyForType(body, type)) {
        continue;
      }
      const angle = randomRange(seedHolder, 0, Math.PI * 2) + i * 2.399963229728653;
      world.structures.push(createSurvivalCampStructure(state, type, body, angle, campId, campX, campY, band, band && band.budget, seedHolder));
      placed += 1;
    }
    return placed;
  }

  function spawnSurvivalAllowanceMob(state, entry, x, y, seedHolder, overrides) {
    const settings = {
      ...(overrides && typeof overrides === "object" ? overrides : {}),
      isBoss: Boolean(entry.isBoss),
      bossBaseKind: entry.isBoss ? entry.kind : "",
      bossStars: Math.max(0, Math.floor(finiteOr(entry.bossStars, 0))),
      eliteStars: entry.isBoss ? 0 : entry.eliteStars,
      eliteGroupSize: entry.isBoss ? 1 : entry.eliteGroupSize
    };
    const mob = createMob(state.world, entry.kind, x, y, seedHolder, settings);
    mobCollectionByKind(state.world, entry.kind).push(mob);
    return mob;
  }

  function spawnSurvivalAllowanceCamp(state, band, players, seedHolder) {
    const entries = planSurvivalAllowanceMobs(band.budget, {
      allowBosses: band.allowBosses,
      forceBoss: band.forceBoss,
      scoreThreat: band.scoreThreat,
      seedHolder
    });
    if (!entries.length) {
      return false;
    }
    const center = chooseSurvivalAllowanceSpawnPoint(state.world, players, seedHolder, {
      minDistance: SURVIVAL_CAMP_SPAWN_MIN_DISTANCE,
      zoomPadding: SURVIVAL_CAMP_SPAWN_DISTANCE_PADDING,
      spread: SURVIVAL_CAMP_SPAWN_DISTANCE_SPREAD,
      preferredSeparation: SURVIVAL_CAMP_ALLOWANCE_PREFERRED_SEPARATION
    });
    const campIdNumber = Math.max(1, Math.floor(finiteOr(state.world.nextSurvivalCampId, 1)));
    const campId = "survival-camp-" + campIdNumber;
    state.world.nextSurvivalCampId = campIdNumber + 1;
    const structureTargetCount = survivalCampStructureTargetCount(entries, band.budget);
    const campBodies = spawnSurvivalAllowanceCampBodies(state, campId, center.x, center.y, band.budget, structureTargetCount, seedHolder);
    spawnSurvivalCampStructures(state, campId, center.x, center.y, band, entries, campBodies, seedHolder);

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const angle = randomRange(seedHolder, 0, Math.PI * 2) + i * 2.399963229728653;
      const radius = randomRange(seedHolder, 180, SURVIVAL_CAMP_IDLE_RADIUS);
      const mob = spawnSurvivalAllowanceMob(
        state,
        entry,
        center.x + Math.cos(angle) * radius + randomRange(seedHolder, -80, 80),
        center.y + Math.sin(angle) * radius + randomRange(seedHolder, -80, 80),
        seedHolder,
        {
          survivalCampId: campId,
          survivalCampX: center.x,
          survivalCampY: center.y,
          survivalCampLeashRadius: SURVIVAL_CAMP_LEASH_RADIUS,
          survivalCampAggroTimer: 0,
          survivalCampReturning: false,
          survivalCampSlotAngle: angle,
          survivalCampSlotRadius: radius,
          survivalEncounterType: "camp",
          survivalEncounterId: campId,
          survivalCampBudget: band.budget,
          survivalCampBand: band.id
        }
      );
      mob.vx += Math.cos(angle + Math.PI / 2) * randomRange(seedHolder, 10, 34);
      mob.vy += Math.sin(angle + Math.PI / 2) * randomRange(seedHolder, 10, 34);
    }
    state.events.push({ type: "mob.camp.spawned", campId, band: band.id, budget: band.budget, count: entries.length, tick: state.tick });
    return true;
  }

  function updateSurvivalAllowanceCamps(state, players, seedHolder) {
    const world = state.world;
    const spawnState = ensureSurvivalSpawnState(world);
    const nowTick = Math.max(0, Math.floor(finiteOr(state.tick, 0)));
    if (nowTick < finiteOr(spawnState.nextCampCheckTick, 0)) {
      return;
    }
    spawnState.nextCampCheckTick = nowTick + Math.round(SURVIVAL_CAMP_CHECK_INTERVAL * TICK_RATE);
    updateSurvivalExploration(spawnState, players);
    retireDistantSurvivalCamps(state, players);
    manageSurvivalCampSalvage(state, players, seedHolder);
    const band = chooseSurvivalCampBand(state, world, players, seedHolder, spawnState);
    if (band) {
      spawnSurvivalAllowanceCamp(state, band, players, seedHolder);
    }
  }

  function updateSurvivalAllowanceMobSpawns(state, world, players, dt, seedHolder) {
    void dt;
    void players;
    world.mobWaveTimer = difficultyMobWaveInterval(state);
    world.mobBeacons = [];
    const survivalPlayers = activeSurvivalSpawnPlayers(state);
    if (!survivalPlayers.length) {
      return;
    }
    updateSurvivalAllowanceCamps(state, survivalPlayers, seedHolder);
  }

  const FAST_AMBIENT_BODY_ANCHOR_BASE_MASS = 150;
  const FAST_AMBIENT_BODY_ANCHOR_BASE_SPEED = 700;
  const FAST_AMBIENT_BODY_ANCHOR_MIN_SPEED_FLOOR = 420;
  const FAST_AMBIENT_BODY_ANCHOR_FULL_SPEED_WINDOW = 420;
  const FAST_AMBIENT_BODY_ANCHOR_MAX_COUNT = 5;

  function ambientParticleAnchorWeight(anchor) {
    if (anchor && Object.prototype.hasOwnProperty.call(anchor, "ambientAnchorWeight")) {
      return clamp(finiteOr(anchor.ambientAnchorWeight, 0), 0.02, 1);
    }
    return 1;
  }

  function fastAmbientBodyAnchorWeight(body) {
    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    if (mass < FAST_AMBIENT_BODY_ANCHOR_BASE_MASS) {
      return 0;
    }
    const speed = Math.hypot(finiteOr(body && body.vx, 0), finiteOr(body && body.vy, 0));
    const minSpeed = clamp(
      FAST_AMBIENT_BODY_ANCHOR_BASE_SPEED - Math.log2(Math.max(1, mass / FAST_AMBIENT_BODY_ANCHOR_BASE_MASS)) * 50,
      FAST_AMBIENT_BODY_ANCHOR_MIN_SPEED_FLOOR,
      FAST_AMBIENT_BODY_ANCHOR_BASE_SPEED
    );
    if (speed < minSpeed) {
      return 0;
    }
    return clamp(
      (speed - minSpeed) / FAST_AMBIENT_BODY_ANCHOR_FULL_SPEED_WINDOW,
      0,
      1
    );
  }

  function isFastAmbientBodyAnchor(body) {
    return Boolean(
      body &&
      body.tier &&
      body.tier.solid &&
      !body.randomEventId &&
      !body.survivalCampBody &&
      finiteOr(body.ufoSapTimer, 0) <= 0 &&
      fastAmbientBodyAnchorWeight(body) > 0
    );
  }

  function activeAmbientParticleSpawnAnchors(world, players) {
    const anchors = Array.isArray(players) ? players.slice() : [];
    const candidates = [];
    for (const body of world.particles) {
      if (!isFastAmbientBodyAnchor(body)) {
        continue;
      }
      const speed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
      const weight = fastAmbientBodyAnchorWeight(body);
      candidates.push({ body, speed, weight });
    }

    candidates.sort((a, b) => b.weight - a.weight || b.speed - a.speed || b.body.mass - a.body.mass);

    const nearPlayerRadius = AMBIENT_PARTICLE_DENSITY_RADIUS * 0.5;
    for (const candidate of candidates) {
      const body = candidate.body;
      const nearPlayer = players.length ? nearestPlayerDistance(body.x, body.y, players) <= nearPlayerRadius : false;
      const weight = nearPlayer ? candidate.weight * 0.42 : candidate.weight;
      if (weight < 0.12) {
        continue;
      }
      anchors.push({
        x: body.x,
        y: body.y,
        vx: finiteOr(body.vx, 0),
        vy: finiteOr(body.vy, 0),
        radius: Math.max(0, finiteOr(body.radius, 0)),
        bodyId: body.id,
        ambientAnchorWeight: weight,
        ambientAnchorTargetScale: 0.08 + weight * 0.72,
        ambientAnchorType: "fast-body",
        ambientAnchorBowWave: true
      });
      if (anchors.length - players.length >= FAST_AMBIENT_BODY_ANCHOR_MAX_COUNT) {
        break;
      }
    }
    return anchors;
  }

  function countAmbientParticlesNearPlayer(world, player, radius) {
    const radiusSq = radius * radius;
    const bowWave = Boolean(player && player.ambientAnchorBowWave);
    const speed = Math.hypot(finiteOr(player && player.vx, 0), finiteOr(player && player.vy, 0));
    const travel = bowWave && speed > 0.001 ? normalize(player.vx, player.vy) : { x: 0, y: 0 };
    const anchorRadius = Math.max(0, finiteOr(player && player.radius, 0));
    const bowLateralLimit = Math.max(150, anchorRadius + 170);
    let count = 0;
    for (const body of world.particles) {
      if (!isAmbientParticle(body)) {
        continue;
      }
      const dx = body.x - player.x;
      const dy = body.y - player.y;
      if (dx * dx + dy * dy <= radiusSq) {
        if (bowWave) {
          const forward = dx * travel.x + dy * travel.y;
          const lateral = Math.abs(dx * -travel.y + dy * travel.x);
          if (forward < -anchorRadius * 0.35 || lateral > bowLateralLimit) {
            continue;
          }
        }
        count += 1;
      }
    }
    return count;
  }

  function mostUnderdenseAmbientPlayer(world, players, localTarget, densityRadius) {
    let best = null;
    for (const candidate of players) {
      const localCount = countAmbientParticlesNearPlayer(world, candidate, densityRadius);
      const speed = Math.hypot(finiteOr(candidate.vx, 0), finiteOr(candidate.vy, 0));
      const bowWave = Boolean(candidate.ambientAnchorBowWave);
      const targetScale = clamp(finiteOr(candidate.ambientAnchorTargetScale, ambientParticleAnchorWeight(candidate)), 0.02, 1.1);
      const anchorLocalTarget = Math.max(bowWave ? 1 : 6, Math.round(localTarget * targetScale));
      const score = anchorLocalTarget - localCount + clamp(speed / 480, 0, 1.15) * (bowWave ? ambientParticleAnchorWeight(candidate) : 1) + ambientParticleAnchorWeight(candidate) * 0.35;
      if (!best || score > best.score) {
        best = { player: candidate, anchor: candidate, localCount, localTarget: anchorLocalTarget, score };
      }
    }
    return best || { player: players[0], anchor: players[0], localCount: 0, localTarget, score: 0 };
  }

  function farthestRecyclableAmbientParticle(world, players, keepRadius) {
    let best = null;
    let bestDistance = -Infinity;
    for (const body of world.particles) {
      if (
        !body ||
        !body.tier ||
        body.tier.solid ||
        body.randomEventId ||
        body.survivalCampBody ||
        finiteOr(body.ufoSapTimer, 0) > 0
      ) {
        continue;
      }
      const distance = nearestPlayerDistance(body.x, body.y, players);
      if (distance <= keepRadius || distance <= bestDistance) {
        continue;
      }
      best = body;
      bestDistance = distance;
    }
    return best;
  }

  function effectiveParticleAnchorCount(players) {
    const clusters = [];
    const clusterRadius = 900;
    for (const player of players) {
      const weight = ambientParticleAnchorWeight(player);
      let cluster = null;
      for (const candidate of clusters) {
        if (Math.hypot(player.x - candidate.x, player.y - candidate.y) <= clusterRadius) {
          cluster = candidate;
          break;
        }
      }
      if (!cluster) {
        clusters.push({ x: player.x, y: player.y, count: weight });
        continue;
      }
      cluster.x = (cluster.x * cluster.count + player.x * weight) / (cluster.count + weight);
      cluster.y = (cluster.y * cluster.count + player.y * weight) / (cluster.count + weight);
      cluster.count += weight;
    }
    return clusters.reduce((total, cluster) => total + Math.min(1, cluster.count) + Math.max(0, cluster.count - 1) * 0.28, 0) || 1;
  }

  function effectiveParticlePlayerCount(players) {
    return effectiveParticleAnchorCount(players);
  }

  function randomAmbientParticleSpawnAnchor(anchors, seedHolder) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : [];
    const totalWeight = source.reduce((total, anchor) => total + ambientParticleAnchorWeight(anchor), 0);
    let roll = nextRandom(seedHolder) * Math.max(0.001, totalWeight);
    for (const anchor of source) {
      roll -= ambientParticleAnchorWeight(anchor);
      if (roll <= 0) {
        return anchor;
      }
    }
    return source[0] || null;
  }

  function updateAmbientParticleSpawning(state) {
    const world = state.world;
    if (!world.ambientParticleSpawning || state.tick % AMBIENT_PARTICLE_SPAWN_TICK_INTERVAL !== 0) {
      return;
    }

    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0);
    if (!players.length) {
      return;
    }

    const anchors = activeAmbientParticleSpawnAnchors(world, players);
    const effectiveAnchorCount = effectiveParticleAnchorCount(anchors);
    const targetCount = Math.round(TARGET_AMBIENT_PARTICLES * (0.96 + Math.max(0, effectiveAnchorCount - 1) * 0.62));
    const maxAmbientBudget = targetCount;
    const localTarget = AMBIENT_PARTICLE_PLAYFIELD_TARGET;
    const densityRadius = AMBIENT_PARTICLE_PLAYFIELD_RADIUS;
    let ambientCount = countAmbientParticles(world);
    const seedHolder = { seed: state.seed >>> 0 };
    for (let spawned = 0; spawned < AMBIENT_PARTICLE_CATCHUP_SPAWNS; spawned += 1) {
      const underdense = mostUnderdenseAmbientPlayer(world, anchors, localTarget, densityRadius);
      const needsLocalFill = underdense.score > 0.5 && underdense.localCount < underdense.localTarget;
      if (ambientCount >= targetCount && (!needsLocalFill || ambientCount >= maxAmbientBudget)) {
        const recycled = needsLocalFill ? farthestRecyclableAmbientParticle(world, anchors, densityRadius * 1.18) : null;
        if (!recycled) {
          break;
        }
        createAmbientParticle(world, underdense.anchor, anchors, seedHolder, { localFill: true, recycledBody: recycled });
        continue;
      }
      world.particles.push(createAmbientParticle(
        world,
        needsLocalFill ? underdense.anchor : randomAmbientParticleSpawnAnchor(anchors, seedHolder),
        anchors,
        seedHolder,
        { localFill: needsLocalFill }
      ));
      ambientCount += 1;
      if (!needsLocalFill) {
        break;
      }
    }
    state.seed = seedHolder.seed >>> 0;
  }

  function updatePickups(state, dt) {
    const players = Object.values(state.players || {}).filter((entry) => entry.health > 0 && !entry.spacecraftInterior);
    const claimedTech = new Set(state.world.claimedTechPickupIds || []);
    const claimedHealth = new Set(state.world.claimedHealthPickupIds || []);

    function updatePickupList(list, type) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const pickup = list[i];
        pickup.life = Math.max(0, finiteOr(pickup.life, 0) - dt);
        pickup.vx *= Math.pow(0.32, dt);
        pickup.vy *= Math.pow(0.32, dt);
        pickup.x += pickup.vx * dt;
        pickup.y += pickup.vy * dt;
        for (const player of players) {
          if (!playerCanCollectPickup(player, pickup)) {
            continue;
          }
          if (type === "tech") {
            const key = TECH_KEYS.includes(pickup.key) ? pickup.key : "suction";
            if (!claimedTech.has(String(pickup.id))) {
              claimedTech.add(String(pickup.id));
              player.tech[key] = Math.max(0, Math.floor(player.tech[key] || 0)) + 1;
              state.events.push({
                type: "pickup.tech",
                pickupId: pickup.id,
                key,
                playerId: player.id,
                x: pickup.x,
                y: pickup.y,
                color: cloneColor(pickup.color),
                tick: state.tick
              });
            }
          } else if (player.health < player.maxHealth && !claimedHealth.has(String(pickup.id))) {
            claimedHealth.add(String(pickup.id));
            player.health = Math.min(player.maxHealth, player.health + finiteOr(pickup.heal, 8));
            state.events.push({
              type: "pickup.health",
              pickupId: pickup.id,
              playerId: player.id,
              x: pickup.x,
              y: pickup.y,
              color: { r: 101, g: 245, b: 154 },
              tick: state.tick
            });
          }
          list.splice(i, 1);
          return;
        }
        if (pickup.life <= 0) {
          list.splice(i, 1);
        }
      }
    }

    updatePickupList(state.world.techPickups, "tech");
    updatePickupList(state.world.healthPickups, "health");
    state.world.claimedTechPickupIds = compactClaimedPickupIds(claimedTech);
    state.world.claimedHealthPickupIds = compactClaimedPickupIds(claimedHealth);
  }

  function compactClaimedPickupIds(ids) {
    const values = Array.from(ids || []).map(String).filter(Boolean);
    if (values.length <= PICKUP_CLAIM_HISTORY_LIMIT) {
      return values;
    }
    return values.slice(values.length - PICKUP_CLAIM_HISTORY_LIMIT);
  }

  function mobBodyImpactCooldown(mob, body) {
    return mob && mob.bodyImpactCooldowns ? finiteOr(mob.bodyImpactCooldowns[body.id], 0) : 0;
  }

  function tickMobBodyImpactCooldowns(mob, dt) {
    if (!mob || !mob.bodyImpactCooldowns) {
      return;
    }
    for (const bodyId of Object.keys(mob.bodyImpactCooldowns)) {
      const next = finiteOr(mob.bodyImpactCooldowns[bodyId], 0) - dt;
      if (next > 0) {
        mob.bodyImpactCooldowns[bodyId] = next;
      } else {
        delete mob.bodyImpactCooldowns[bodyId];
      }
    }
  }

  function markMobDamagedByBody(mob, body) {
    if (!mob.bodyImpactCooldowns) {
      mob.bodyImpactCooldowns = {};
    }
    mob.bodyImpactCooldowns[body.id] = BODY_IMPACT_REPEAT_DAMAGE_COOLDOWN;
  }

  function triggerBossBodyEvade(mob, body, nx, ny, impactSpeed) {
    if (!mob || !body || !mob.isBoss) {
      return;
    }

    const bodySpeed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
    const travelX = bodySpeed > 1 ? body.vx / bodySpeed : -nx;
    const travelY = bodySpeed > 1 ? body.vy / bodySpeed : -ny;
    const cross = travelX * ny - travelY * nx;
    const side = Math.abs(cross) > 0.02 ? Math.sign(cross) : (mob.strafeSign < 0 ? -1 : 1);
    const tangentX = -travelY * side;
    const tangentY = travelX * side;
    const evade = normalize(tangentX * 0.82 + nx * 0.38, tangentY * 0.82 + ny * 0.38);
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const boostSpeed = clamp(
      340 + Math.max(bodySpeed, finiteOr(impactSpeed, 0)) * 0.5 + Math.sqrt(mass) * 1.8,
      BOSS_BODY_EVADE_MIN_SPEED,
      BOSS_BODY_EVADE_MAX_SPEED
    );
    const currentAlongEvade = finiteOr(mob.vx, 0) * evade.x + finiteOr(mob.vy, 0) * evade.y;
    const extraSpeed = Math.max(0, boostSpeed - currentAlongEvade);

    mob.vx += evade.x * extraSpeed;
    mob.vy += evade.y * extraSpeed;
    mob.strafeSign = side;
    mob.hitCooldown = Math.max(finiteOr(mob.hitCooldown, 0), 0.68);
    mob.bossBodyEvadeTimer = Math.max(finiteOr(mob.bossBodyEvadeTimer, 0), BOSS_BODY_EVADE_DURATION);
    mob.bossBodyEvadeSpeedCap = Math.max(finiteOr(mob.bossBodyEvadeSpeedCap, 0), boostSpeed * 1.08);
  }

  function bodyImpactKnockbackForce(body, bodySpeed) {
    const speedBonus = Math.max(0, bodySpeed - SOLID_BODY_DAMAGE_SPEED) * 0.34;
    const massBonus = Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 2.45;
    return clamp(BODY_IMPACT_BASE_KNOCKBACK + speedBonus + massBonus, BODY_IMPACT_BASE_KNOCKBACK, BODY_IMPACT_MAX_KNOCKBACK);
  }

  function solidBodyImpactDamage(body, impactSpeed, baseDamage) {
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const speedDamage = Math.max(0, impactSpeed - SOLID_BODY_DAMAGE_SPEED) * 0.26;
    const massDamage = Math.pow(mass, 0.42) * 1.45;
    const damageCap = clamp(105 + Math.sqrt(mass) * 2.2, 120, 320);
    return Math.min(damageCap, baseDamage + speedDamage + massDamage);
  }

  function projectileBodyImpactDamage(body, bodySpeed) {
    const mass = Math.max(1, finiteOr(body && body.mass, 1));
    return Math.min(85, 18 + Math.max(0, bodySpeed - PROJECTILE_DAMAGE_SPEED) * 0.16 + Math.sqrt(mass) * 0.75);
  }

  function ejectedMobParticleColor(seedHolder, mob) {
    const base = normalizeColor(mob && mob.color, randomParticleColor(seedHolder));
    return mixColor(base, randomParticleColor(seedHolder), 3, 1);
  }

  function emitMobDamageParticles(state, mob, damage) {
    const world = state && state.world;
    if (
      (state && state._emitMobDamageParticles === false) ||
      !world ||
      !mob ||
      finiteOr(damage, 0) <= 0 ||
      !Array.isArray(world.particles)
    ) {
      return 0;
    }

    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0);
    const effectivePlayerCount = effectiveParticlePlayerCount(players);
    const particleBudget = Math.round(TARGET_AMBIENT_PARTICLES * (1.2 + Math.max(0, effectivePlayerCount - 1) * 0.62));
    const queue = Array.isArray(state._mobDamageParticles) ? state._mobDamageParticles : world.particles;
    if (countAmbientParticles(world) + queue.length > particleBudget) {
      return 0;
    }

    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    const scaledCount = Math.round(finiteOr(damage, 0) / MOB_DAMAGE_PER_PARTICLE + randomRange(seedHolder, -0.35, 0.35));
    const count = clamp(scaledCount, MOB_DAMAGE_PARTICLE_MIN, MOB_DAMAGE_PARTICLE_MAX);
    const baseColor = ejectedMobParticleColor(seedHolder, mob);
    const spawnRadius = Math.max(4, finiteOr(mob.radius, 28));

    for (let i = 0; i < count; i += 1) {
      const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const speed = randomRange(seedHolder, 82, 176);
      const spawnDistance = Math.max(4, spawnRadius * randomRange(seedHolder, 0.25, 0.75));
      const particle = normalizeParticle({
        id,
        x: finiteOr(mob.x, 0) + Math.cos(angle) * spawnDistance,
        y: finiteOr(mob.y, 0) + Math.sin(angle) * spawnDistance,
        vx: finiteOr(mob.vx, 0) * 0.32 + Math.cos(angle) * speed + randomRange(seedHolder, -22, 22),
        vy: finiteOr(mob.vy, 0) * 0.32 + Math.sin(angle) * speed + randomRange(seedHolder, -22, 22),
        mass: MOB_DAMAGE_PARTICLE_MASS,
        color: ejectedMobParticleColor(seedHolder, { color: baseColor }),
        textureSeed: randomRange(seedHolder, 0, 1000),
        wobble: randomRange(seedHolder, 0, Math.PI * 2),
        pulse: randomRange(seedHolder, 0.8, 1.25),
        spawnAge: 0,
        spawnSizeScale: 1
      }, id, seedHolder);
      queue.push(particle);
      world.nextParticleId = id + 1;
    }
    return count;
  }

  function flushMobDamageParticles(state) {
    const world = state && state.world;
    const queued = state && state._mobDamageParticles;
    if (!world || !Array.isArray(world.particles) || !Array.isArray(queued) || !queued.length) {
      return;
    }
    world.particles.push(...queued);
    queued.length = 0;
  }

  function damageMob(state, mob, damage, cause, sourcePlayerId) {
    if (!mob || mob.health <= 0) {
      return false;
    }
    wakeSurvivalCampFromMob(state, mob, sourcePlayerId);
    if (mob.kind === "fighter" && !isMobDisabled(mob) && finiteOr(mob.shieldCharge, 0) > 0) {
      mob.shieldActive = Math.max(finiteOr(mob.shieldActive, 0), 0.55);
      mob.shieldRecharge = FIGHTER_SHIELD_CYCLE;
      mob.flash = Math.max(finiteOr(mob.flash, 0), 0.08);
      state.events.push({
        type: "mob.shielded",
        mobId: mob.id,
        kind: "fighter",
        cause: cause || "impact",
        x: mob.x,
        y: mob.y,
        color: cloneColor(mob.color),
        tick: state.tick
      });
      return false;
    }
    const dealtDamage = Math.max(0, finiteOr(damage, 0));
    mob.health = Math.max(0, mob.health - dealtDamage);
    mob.hitCooldown = Math.max(finiteOr(mob.hitCooldown, 0), 0.42);
    mob.flash = Math.max(finiteOr(mob.flash, 0), 0.28);
    emitMobDamageParticles(state, mob, dealtDamage);
    if (mob.health <= 0) {
      const kind = mobEntityKind(mob);
      if (isMobBeacon(mob)) {
        mob.respawnTimer = MOB_BEACON_RESPAWN_DURATION;
        mob.age = 0;
        for (let i = 0; i < MOB_BEACON_DROP_COUNT; i += 1) {
          createTechPickup(state, techKeyForMob(kind), mob.x, mob.y, mob.vx, mob.vy);
        }
        state.events.push({
          type: "mob.beacon.destroyed",
          mobId: mob.id,
          kind,
          isBeacon: true,
          cause: cause || "impact",
          suspendedSeconds: MOB_BEACON_RESPAWN_DURATION,
          x: mob.x,
          y: mob.y,
          color: cloneColor(mob.color),
          tick: state.tick
        });
        return true;
      }
      if (mob.team !== "player") {
        const rewardValue = mobEliteRewardValue(mob);
        if (state.world.mobDefeatsByKind && Object.prototype.hasOwnProperty.call(state.world.mobDefeatsByKind, kind)) {
          state.world.mobDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(state.world.mobDefeatsByKind[kind], 0))) + rewardValue;
        }
        if (mob.isBoss) {
          if (state.world.mobBossDefeatsByKind && Object.prototype.hasOwnProperty.call(state.world.mobBossDefeatsByKind, kind)) {
            state.world.mobBossDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(state.world.mobBossDefeatsByKind[kind], 0))) + 1;
          }
          if (state.world.mobBossProgressByKind && Object.prototype.hasOwnProperty.call(state.world.mobBossProgressByKind, kind)) {
            state.world.mobBossProgressByKind[kind] = 0;
          }
        } else if (state.world.mobBossProgressByKind && Object.prototype.hasOwnProperty.call(state.world.mobBossProgressByKind, kind)) {
          state.world.mobBossProgressByKind[kind] = Math.min(
            MOB_BOSS_DEFEATS_TO_UNLOCK,
            Math.max(0, Math.floor(finiteOr(state.world.mobBossProgressByKind[kind], 0))) + rewardValue
          );
          if (state.world.mobBossProgressByKind[kind] >= MOB_BOSS_DEFEATS_TO_UNLOCK) {
            maybeScheduleMobBoss(state, kind, { seed: state.seed >>> 0 });
          }
        }
        if (shouldDropHealthPickup(state, mob)) {
          createHealthPickup(state, mob.x, mob.y, mob.vx, mob.vy);
        }
        const techDrops = mob.isBoss ? MOB_BOSS_DROP_COUNT : rewardValue;
        for (let i = 0; i < techDrops; i += 1) {
          createTechPickup(state, techKeyForMob(kind), mob.x, mob.y, mob.vx, mob.vy);
        }
      }
      state.events.push({
        type: "mob.defeated",
        mobId: mob.id,
        kind,
        isBoss: Boolean(mob.isBoss),
        bossStars: bossStarRank(mob),
        eliteStars: mobEliteStarRank(mob),
        representedCount: mobEliteRewardValue(mob),
        cause: cause || "impact",
        x: mob.x,
        y: mob.y,
        color: cloneColor(mob.color),
        tick: state.tick
      });
      return true;
    }
    state.events.push({
      type: "mob.hit",
      mobId: mob.id,
      kind: mobEntityKind(mob),
      isBeacon: isMobBeacon(mob),
      cause: cause || "impact",
      damage: Math.max(0, finiteOr(damage, 0)),
      x: mob.x,
      y: mob.y,
      color: cloneColor(mob.color),
      tick: state.tick
    });
    return false;
  }

  function killAllMobs(state) {
    const world = state && state.world;
    if (!world) {
      return 0;
    }
    let killed = 0;
    for (const mob of allCombatMobs(world).slice()) {
      if (!mob || mob.health <= 0 || mob.team === "player") {
        continue;
      }
      if (mob.kind === "fighter") {
        mob.shieldActive = 0;
        mob.shieldCharge = 0;
      }
      if (damageMob(state, mob, Math.max(1, finiteOr(mob.health, 0)), "command")) {
        killed += 1;
      }
    }
    return killed;
  }

  function bossScaledDamage(mob, damage) {
    if (mob && mob.isBoss) {
      return damage * MOB_BOSS_DAMAGE_MULTIPLIER * bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_DAMAGE_MULTIPLIER);
    }
    return damage * mobEliteStatScale(mob, MOB_ELITE_DAMAGE_MULTIPLIER);
  }

  function bossChaseForce(mob, baseForce) {
    if (mob && mob.isBoss) {
      return baseForce * 1.18 * bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_FORCE_MULTIPLIER);
    }
    return baseForce * mobEliteStatScale(mob, MOB_ELITE_FORCE_MULTIPLIER);
  }

  function bossStrafeForce(mob, baseForce) {
    if (mob && mob.isBoss) {
      return baseForce * 1.35 * bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_FORCE_MULTIPLIER);
    }
    return baseForce * mobEliteStatScale(mob, MOB_ELITE_FORCE_MULTIPLIER);
  }

  function bossChaseMaxSpeed(mob, baseMaxSpeed, desiredX, desiredY) {
    if (!mob) {
      return baseMaxSpeed;
    }
    let chaseMaxSpeed = baseMaxSpeed;
    if (mob.isBoss) {
      const speed = Math.hypot(finiteOr(mob.vx, 0), finiteOr(mob.vy, 0));
      const desiredLength = Math.hypot(finiteOr(desiredX, 0), finiteOr(desiredY, 0));
      const alignment = speed > 8 && desiredLength > 0.001
        ? clamp((mob.vx / speed) * (desiredX / desiredLength) + (mob.vy / speed) * (desiredY / desiredLength), 0, 1)
        : 0;
      const sustainedMotion = clamp((speed - baseMaxSpeed * 0.45) / Math.max(1, baseMaxSpeed * 0.9), 0, 1);
      chaseMaxSpeed = baseMaxSpeed *
        (MOB_BOSS_MAX_SPEED_MULTIPLIER + MOB_BOSS_DIRECTIONAL_SPEED_BONUS * alignment * sustainedMotion) *
        bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_SPEED_MULTIPLIER);
    } else {
      chaseMaxSpeed = baseMaxSpeed * mobEliteStatScale(mob, MOB_ELITE_SPEED_MULTIPLIER);
    }
    if (finiteOr(mob.bossBodyEvadeTimer, 0) > 0) {
      return Math.max(chaseMaxSpeed, clamp(finiteOr(mob.bossBodyEvadeSpeedCap, 0), chaseMaxSpeed, BOSS_BODY_EVADE_MAX_SPEED));
    }
    return chaseMaxSpeed;
  }

  function normalizeUfoBossBeamModeValue(mode) {
    return mode === "cooldown" || mode === "drain" ? mode : "tractor";
  }

  function ufoBossBeamDuration(mode) {
    if (mode === "cooldown") return UFO_BOSS_NO_BEAM_DURATION;
    if (mode === "drain") return UFO_BOSS_DRAIN_BEAM_DURATION;
    return UFO_BOSS_NORMAL_BEAM_DURATION;
  }

  function nextUfoBossBeamMode(mode) {
    if (mode === "tractor") return "cooldown";
    if (mode === "cooldown") return "drain";
    return "tractor";
  }

  function updateUfoBossBeamState(ufo, dt) {
    if (!ufo || !ufo.isBoss) {
      return "tractor";
    }
    let mode = normalizeUfoBossBeamModeValue(ufo.bossBeamMode);
    let timer = finiteOr(ufo.bossBeamTimer, ufoBossBeamDuration(mode)) - dt;
    while (timer <= 0) {
      mode = nextUfoBossBeamMode(mode);
      timer += ufoBossBeamDuration(mode);
    }
    ufo.bossBeamMode = mode;
    ufo.bossBeamTimer = timer;
    return mode;
  }

  function ufoBossBeamMode(ufo) {
    return ufo && ufo.isBoss ? normalizeUfoBossBeamModeValue(ufo.bossBeamMode) : "tractor";
  }

  function ufoHasActiveBeam(ufo) {
    return Boolean(ufo && finiteOr(ufo.health, 0) > 0 && !isMobDisabled(ufo) && finiteOr(ufo.tractorDisabledTimer, 0) <= 0 && ufoBossBeamMode(ufo) !== "cooldown");
  }

  function ufoHasTractorBeam(ufo) {
    return ufoHasActiveBeam(ufo) && (!ufo.isBoss || ufoBossBeamMode(ufo) === "tractor");
  }

  function ufoHasPlayerDrainBeam(ufo) {
    return ufoHasActiveBeam(ufo) && ufo.isBoss && ufoBossBeamMode(ufo) === "drain";
  }

  function steerUfoBeamToward(ufo, targetX, targetY, dt, turnScale) {
    if (!Number.isFinite(ufo.beamAngle)) {
      ufo.beamAngle = Math.PI / 2;
    }
    const targetAngle = Math.atan2(targetY - ufo.y, targetX - ufo.x);
    const turn = shortestAngleDelta(ufo.beamAngle, targetAngle);
    ufo.beamAngle += clamp(turn, -UFO_BEAM_MAX_TURN * finiteOr(turnScale, 1) * dt, UFO_BEAM_MAX_TURN * finiteOr(turnScale, 1) * dt);
  }

  function ufoBeamHitStrength(ufo, target) {
    if (!ufo || !target) {
      return 0;
    }
    const dirX = Math.cos(finiteOr(ufo.beamAngle, Math.PI / 2));
    const dirY = Math.sin(finiteOr(ufo.beamAngle, Math.PI / 2));
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;
    const relX = target.x - originX;
    const relY = target.y - originY;
    const forward = relX * dirX + relY * dirY;
    const side = relX * normalX + relY * normalY;
    const targetReach = Math.max(0, finiteOr(target.radius, PLAYER_RADIUS) * 0.5);
    const surfaceForward = clamp(forward - targetReach, 0, UFO_TRACTOR_RANGE);
    const beamHalf = UFO_TRACTOR_WIDTH * (1 - clamp(surfaceForward / UFO_TRACTOR_RANGE, 0, 1) * 0.55) + targetReach;
    if (forward < -targetReach || forward - targetReach > UFO_TRACTOR_RANGE || Math.abs(side) > beamHalf) {
      return 0;
    }
    return clamp(1 - surfaceForward / UFO_TRACTOR_RANGE, 0.28, 1) * clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0.2, 1);
  }

  function tickBossAltAttackCooldown(mob, dt, seedHolder) {
    if (!mob || !mob.isBoss) {
      return false;
    }
    mob.altAttackCooldown = finiteOr(
      mob.altAttackCooldown,
      randomRange(seedHolder, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) * bossCooldownScaleForStars(bossStarRank(mob))
    ) - dt;
    return mob.altAttackCooldown <= 0;
  }

  function resetBossAltAttackCooldown(mob, seedHolder) {
    if (mob && mob.isBoss) {
      mob.altAttackCooldown = randomRange(seedHolder, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) * bossCooldownScaleForStars(bossStarRank(mob));
    }
  }

  function knockMob(mob, nx, ny, force) {
    if (!mob) {
      return;
    }
    mob.vx += nx * force;
    mob.vy += ny * force;
    if (mob.kind === "rambot") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.28);
      mob.chargeTimer = Math.max(0, (mob.chargeTimer || 0) - 0.22);
    } else if (mob.kind === "rocket") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.32);
      mob.lockTimer = 0;
      mob.volleyTimer = 0;
      mob.volleyShots = 0;
      mob.blastTimer = Math.max(0, (mob.blastTimer || 0) - 0.18);
    }
  }

  function isAsteroidOrLarger(body) {
    return Boolean(body && body.tier && finiteOr(body.tier.threshold, 0) >= 150);
  }

  function isBoulderBody(body) {
    return Boolean(body && body.tier && body.tier.name === "boulder");
  }

  function isAsteroidBody(body) {
    return Boolean(body && body.tier && body.tier.name === "asteroid");
  }

  function canUfoTractorAffectParticle(body) {
    return Boolean(
      body &&
      body.tier &&
      (body.tier.name === "particle" || body.tier.name === "rock" || isBoulderBody(body) || isAsteroidOrLarger(body))
    );
  }

  function canUfoAbsorbParticle(ufo, body) {
    return Boolean(
      body &&
      body.tier &&
      !body.survivalCampBody &&
      (
        body.tier.name === "particle" ||
        body.tier.name === "rock" ||
        (ufo && ufo.isBoss && isBoulderBody(body))
      )
    );
  }

  function shouldUfoImpactBody(ufo, body) {
    return ufo && ufo.isBoss ? isAsteroidBody(body) : isBoulderBody(body);
  }

  function shouldUfoSiphonBody(ufo, body) {
    if (ufo && ufo.isBoss) {
      return isAsteroidOrLarger(body) && !isAsteroidBody(body);
    }
    return isAsteroidOrLarger(body);
  }

  function canUfoPreferTractorTarget(ufo, body) {
    if (!body || !body.tier) {
      return false;
    }
    if (ufo && ufo.isBoss) {
      return body.tier.name === "boulder" || body.tier.name === "rock" || body.tier.name === "particle" || isAsteroidOrLarger(body);
    }
    return body.tier.name === "rock" || body.tier.name === "particle" || isAsteroidOrLarger(body);
  }

  function ufoTractorTargetPriority(ufo, body) {
    if (!body || !body.tier) {
      return 99;
    }
    if (ufo && ufo.isBoss) {
      if (body.tier.name === "boulder") return 0;
      if (body.tier.name === "rock") return 1;
      if (isAsteroidOrLarger(body)) return 2;
      if (body.tier.name === "particle") return 4;
      return 8;
    }
    if (body.tier.name === "rock") return 0;
    if (isAsteroidOrLarger(body)) return 2;
    if (body.tier.name === "particle") return 4;
    return 8;
  }

  function updateBodyAfterMassChange(body) {
    body.tier = clone(tierForMassAndStellarOutcome(body.mass, body.stellarOutcome));
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    body.textureSeed = finiteOr(body.textureSeed, 0) + 0.09;
  }

  function emitUfoSapParticle(state, seedHolder, ufo, body, fragmentMass, pullStrength, centerStrength) {
    const world = state.world;
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const originX = ufo.x + Math.cos(ufo.beamAngle) * 26;
    const originY = ufo.y + Math.sin(ufo.beamAngle) * 26;
    const toUfo = normalize(originX - body.x, originY - body.y);
    const tangentX = -toUfo.y;
    const tangentY = toUfo.x;
    const fragmentRadius = radiusFromMass(fragmentMass);
    const surfaceX = body.x + toUfo.x * Math.max(1, finiteOr(body.radius, 1) + fragmentRadius + 5);
    const surfaceY = body.y + toUfo.y * Math.max(1, finiteOr(body.radius, 1) + fragmentRadius + 5);
    const pullSpeed = 170 + pullStrength * 170 + centerStrength * 120;
    const side = randomRange(seedHolder, -body.radius * 0.1, body.radius * 0.1);
    const jitter = randomRange(seedHolder, -34, 34);
    const speed = randomRange(seedHolder, pullSpeed * 0.75, pullSpeed * 1.2);
    const particle = normalizeParticle({
      id,
      x: surfaceX + tangentX * side,
      y: surfaceY + tangentY * side,
      vx: body.vx + toUfo.x * speed + tangentX * jitter,
      vy: body.vy + toUfo.y * speed + tangentY * jitter,
      mass: fragmentMass,
      color: body.color,
      textureSeed: finiteOr(body.textureSeed, 0) + randomRange(seedHolder, -0.5, 0.5),
      wobble: finiteOr(ufo.wobble, 0) + randomRange(seedHolder, -0.45, 0.45),
      spawnAge: 0,
      ufoSapTimer: UFO_SAP_CARGO_DURATION,
      ufoSapSourceGraceTimer: UFO_SAP_SOURCE_GRACE_DURATION,
      ufoExtractedById: ufo.id,
      ufoExtractedFromId: body.id
    }, id, seedHolder);
    world.particles.push(particle);
    world.nextParticleId = id + 1;
  }

  function drainBodyWithUfoTractor(state, seedHolder, ufo, body, pullStrength, centerStrength, dt) {
    if (!body || body.mass <= 1) {
      return;
    }
    const drain = Math.min(
      body.mass - 1,
      (UFO_BODY_DRAIN_RATE + Math.sqrt(body.mass) * 0.045) * pullStrength * (0.35 + centerStrength * 0.65) * dt
    );
    if (drain <= 0) {
      return;
    }

    body.mass -= drain;
    updateBodyAfterMassChange(body);
    body.textureSeed += drain * 0.013;
    body.ufoSapParticleBuffer = Math.max(0, finiteOr(body.ufoSapParticleBuffer, 0)) + drain;

    if (body.ufoSapParticleBuffer >= UFO_SAP_FRAGMENT_MASS) {
      const fragments = Math.min(
        UFO_SAP_MAX_FRAGMENTS_PER_BURST,
        Math.max(1, Math.floor(body.ufoSapParticleBuffer / UFO_SAP_FRAGMENT_MASS))
      );
      let remaining = body.ufoSapParticleBuffer;
      for (let i = 0; i < fragments; i += 1) {
        const fragmentMass = remaining / (fragments - i);
        remaining -= fragmentMass;
        emitUfoSapParticle(state, seedHolder, ufo, body, fragmentMass, pullStrength, centerStrength);
      }
      body.ufoSapParticleBuffer = Math.max(0, remaining);
    }
  }

  function applyUfoTractorBeam(state, seedHolder, ufo, dt) {
    if (!ufoHasTractorBeam(ufo)) {
      return;
    }

    const world = state.world;
    const assignedSalvageBody = survivalSalvageBody(world, ufo);
    let bestBody = assignedSalvageBody;
    let bestScore = Infinity;
    for (const body of assignedSalvageBody ? [] : world.particles || []) {
      if (!canUfoTractorAffectParticle(body) || !canUfoPreferTractorTarget(ufo, body)) {
        continue;
      }
      const distance = Math.hypot(body.x - ufo.x, body.y - ufo.y);
      const surfaceDistance = Math.max(0, distance - Math.max(0, finiteOr(body.radius, 0)));
      let score = surfaceDistance + ufoTractorTargetPriority(ufo, body) * 10000;
      if (body.tier.solid) {
        score = surfaceDistance * 0.55 - finiteOr(body.radius, 0) + ufoTractorTargetPriority(ufo, body) * 10000;
      } else if (body.tier.name === "particle") {
        score += 80;
      }
      if (surfaceDistance < UFO_TRACTOR_RANGE && score < bestScore) {
        bestBody = body;
        bestScore = score;
      }
    }

    if (!Number.isFinite(ufo.beamAngle)) {
      ufo.beamAngle = Math.PI / 2;
    }
    if (bestBody) {
      steerUfoBeamToward(ufo, bestBody.x, bestBody.y, dt, 1);
    } else {
      const turn = shortestAngleDelta(ufo.beamAngle, finiteOr(ufo.rotation, 0) + Math.PI / 2);
      ufo.beamAngle += clamp(turn, -UFO_BEAM_MAX_TURN * 0.65 * dt, UFO_BEAM_MAX_TURN * 0.65 * dt);
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;

    for (let i = world.particles.length - 1; i >= 0; i -= 1) {
      const body = world.particles[i];
      if (!canUfoTractorAffectParticle(body)) {
        continue;
      }

      const relX = body.x - originX;
      const relY = body.y - originY;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const bodyReach = body.tier.solid ? Math.max(0, finiteOr(body.radius, 0)) : 0;
      const surfaceForward = clamp(forward - bodyReach, 0, UFO_TRACTOR_RANGE);
      const beamHalf = UFO_TRACTOR_WIDTH * (1 - clamp(surfaceForward / UFO_TRACTOR_RANGE, 0, 1) * 0.55) + body.radius * 0.45;
      if (forward < -bodyReach || forward - bodyReach > UFO_TRACTOR_RANGE || Math.abs(side) > beamHalf) {
        continue;
      }

      const pullStrength = clamp(1 - surfaceForward / UFO_TRACTOR_RANGE, 0.12, 1);
      const centerStrength = clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0, 1);
      const toOriginX = originX - body.x;
      const toOriginY = originY - body.y;
      const isAssignedSalvageBody = body === assignedSalvageBody;

      if (!isAssignedSalvageBody && shouldUfoSiphonBody(ufo, body)) {
        drainBodyWithUfoTractor(state, seedHolder, ufo, body, pullStrength, centerStrength, dt);
        continue;
      }

      const toOrigin = normalize(toOriginX, toOriginY);
      const cargoBoost = body.ufoExtractedById === ufo.id ? 1.35 : 1;
      const solidDragScale = body.tier.solid ? 0.62 : 1;
      const force = UFO_TRACTOR_FORCE * pullStrength * (0.45 + centerStrength * 0.75) * cargoBoost * solidDragScale;
      body.vx += (toOrigin.x * force - normalX * side * 7.5) * dt;
      body.vy += (toOrigin.y * force - normalY * side * 7.5) * dt;

      if (Math.hypot(toOriginX, toOriginY) >= ufo.radius + body.radius * 1.05) {
        continue;
      }

      if (isAssignedSalvageBody) {
        continue;
      }

      const bodySpeed = Math.hypot(body.vx, body.vy);
      if (shouldUfoImpactBody(ufo, body)) {
        if (bodySpeed >= 110 && ufo.hitCooldown <= 0) {
          const damage = Math.min(90, 20 + Math.max(0, bodySpeed - 110) * 0.18 + Math.sqrt(body.mass) * 0.8);
          knockMob(ufo, toOrigin.x, toOrigin.y, 150 + bodySpeed * 0.34);
          triggerBossBodyEvade(ufo, body, toOrigin.x, toOrigin.y, bodySpeed);
          damageMob(state, ufo, damage, "ufo-tractor-impact");
          if (ufo.isBoss) {
            ufo.tractorDisabledTimer = Math.max(finiteOr(ufo.tractorDisabledTimer, 0), UFO_BOSS_TRACTOR_IMPACT_DISABLE_DURATION);
          }
        }
        body.vx -= toOrigin.x * (210 + bodySpeed * 0.18);
        body.vy -= toOrigin.y * (210 + bodySpeed * 0.18);
      } else if (canUfoAbsorbParticle(ufo, body)) {
        world.particles.splice(i, 1);
        state.events.push({ type: "ufo.absorbedParticle", mobId: ufo.id, bodyId: body.id, tick: state.tick });
      }
    }
  }

  function ufoCleanupTarget(state, ufo) {
    const world = state && state.world ? state.world : null;
    if (!world || !Array.isArray(world.particles)) {
      return null;
    }

    let bestBody = null;
    let bestScore = Infinity;
    const maxDistance = ufo && ufo.isBoss ? 3600 : 3000;
    for (const body of world.particles) {
      if (!canUfoPreferTractorTarget(ufo, body)) {
        continue;
      }
      const distance = Math.hypot(body.x - ufo.x, body.y - ufo.y);
      if (distance > maxDistance + finiteOr(body.radius, 0)) {
        continue;
      }

      const priority = ufoTractorTargetPriority(ufo, body);
      if (priority > 2) {
        continue;
      }
      const eventBias = body.randomEventId === METEOR_SHOWER_EVENT_ID || body.randomEventId === PARTICLE_STORM_EVENT_ID ? -520 : 0;
      const sizeBias = ufo && ufo.isBoss && body.tier && body.tier.name === "boulder" ? -finiteOr(body.mass, 0) * 3.2 : -finiteOr(body.mass, 0) * 0.7;
      const score = priority * 10000 + distance + eventBias + sizeBias;
      if (score < bestScore) {
        bestBody = body;
        bestScore = score;
      }
    }

    return bestBody;
  }

  function updateUfoUndersideImpact(state, ufo, players) {
    if (!ufoHasTractorBeam(ufo)) {
      return;
    }

    const dirX = Math.cos(finiteOr(ufo.beamAngle, Math.PI / 2));
    const dirY = Math.sin(finiteOr(ufo.beamAngle, Math.PI / 2));
    const normalX = -dirY;
    const normalY = dirX;
    for (const target of players) {
      if (!target || target.health <= 0 || target.hitCooldown > 0 || target.invulnerableTimer > 0) {
        continue;
      }
      const relX = target.x - ufo.x;
      const relY = target.y - ufo.y;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const distance = Math.hypot(relX, relY);
      if (forward < 6 || forward > ufo.radius + target.radius * 0.85 || Math.abs(side) > 52 || distance > ufo.radius + target.radius * 0.72) {
        continue;
      }
      target.vx += dirX * 210 + finiteOr(ufo.vx, 0) * 0.38;
      target.vy += dirY * 210 + finiteOr(ufo.vy, 0) * 0.38;
      if (isCombatMobEntity(target)) {
        damageMob(state, target, bossScaledDamage(ufo, UFO_UNDERSIDE_DAMAGE), ufo.isBoss ? "UFO boss underside" : "UFO underside");
      } else if (damagePlayer(state, target, difficultyMobDamage(state, bossScaledDamage(ufo, UFO_UNDERSIDE_DAMAGE)), ufo.isBoss ? "UFO boss underside" : "UFO underside")) {
        state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: ufo.id, kind: "ufo", tick: state.tick });
      }
    }
  }

  function applyUfoBossPlayerDrainBeam(state, ufo, target, dt) {
    if (!ufoHasPlayerDrainBeam(ufo) || !target || finiteOr(target.health, 0) <= 0) {
      return;
    }
    steerUfoBeamToward(ufo, target.x, target.y, dt, 1.35);
    const hitStrength = ufoBeamHitStrength(ufo, target);
    if (hitStrength <= 0) {
      ufo.playerDrainTickTimer = Math.max(0, finiteOr(ufo.playerDrainTickTimer, 0) - dt);
      return;
    }

    ufo.playerDrainTickTimer = finiteOr(ufo.playerDrainTickTimer, 0) - dt;
    if (ufo.playerDrainTickTimer > 0) {
      return;
    }
    ufo.playerDrainTickTimer += UFO_BOSS_PLAYER_DRAIN_TICK_INTERVAL;

    const dirX = Math.cos(finiteOr(ufo.beamAngle, Math.PI / 2));
    const dirY = Math.sin(finiteOr(ufo.beamAngle, Math.PI / 2));
    const damage = difficultyMobDamage(state, bossScaledDamage(ufo, UFO_BOSS_PLAYER_DRAIN_RATE) * UFO_BOSS_PLAYER_DRAIN_TICK_INTERVAL * hitStrength);
    target.vx += -dirX * 105 * hitStrength + finiteOr(ufo.vx, 0) * 0.12;
    target.vy += -dirY * 105 * hitStrength + finiteOr(ufo.vy, 0) * 0.12;
    if (isCombatMobEntity(target)) {
      damageMob(state, target, damage, "UFO boss drain beam");
    } else if (damagePlayer(state, target, damage, "UFO boss drain beam")) {
      state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: ufo.id, kind: "ufo", cause: "drain-beam", tick: state.tick });
    }
  }

  function updateUfo(state, ufo, players, dt, seedHolder) {
    const targetInfo = nearestCombatPlayer(players, ufo);
    const target = targetInfo.player;
    const salvageTarget = survivalSalvageTowTarget(state, ufo, dt);
    const hostileSurvivalEncounter = ufo &&
      !isPlayerTeamMob(ufo) &&
      (ufo.survivalEncounterType === "camp" || isSurvivalCampMob(state, ufo));
    const cleanupBody = salvageTarget || isPlayerTeamMob(ufo) || hostileSurvivalEncounter ? null : ufoCleanupTarget(state, ufo);
    const beamMode = updateUfoBossBeamState(ufo, dt);
    const moveTarget = salvageTarget || (cleanupBody && !(ufo.isBoss && beamMode === "drain") ? cleanupBody : target);
    if (!moveTarget) {
      return;
    }
    const toTargetX = moveTarget.x - ufo.x;
    const toTargetY = moveTarget.y - ufo.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * (Number(ufo.strafeSign) < 0 ? -1 : 1);
    const tangentY = nx * (Number(ufo.strafeSign) < 0 ? -1 : 1);
    const desiredDistance = salvageTarget ? 0 : cleanupBody && moveTarget === cleanupBody ? clamp(finiteOr(cleanupBody.radius, 0) + 350, 430, 660) : 430;
    const noBeamBoost = ufo.isBoss && beamMode === "cooldown" ? 1.34 : 1;
    const chaseForce = bossChaseForce(ufo, (dist > desiredDistance ? 92 : -44) * noBeamBoost);
    const strafeForce = bossStrafeForce(ufo, (dist < 880 ? 56 : 18) * noBeamBoost);

    ufo.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    ufo.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    ufo.vx += Math.sin(state.tick * 0.0348 + finiteOr(ufo.wobble, 0)) * 10 * dt;
    ufo.vy += Math.cos(state.tick * 0.0312 + finiteOr(ufo.wobble, 0)) * 10 * dt;
    ufo.vx *= Math.pow(0.75, dt);
    ufo.vy *= Math.pow(0.75, dt);

    const speed = Math.hypot(ufo.vx, ufo.vy);
    const maxSpeed = bossChaseMaxSpeed(ufo, (dist > 760 ? 170 : 132) * noBeamBoost, nx, ny);
    if (speed > maxSpeed) {
      ufo.vx = (ufo.vx / speed) * maxSpeed;
      ufo.vy = (ufo.vy / speed) * maxSpeed;
    }

    ufo.x += ufo.vx * dt;
    ufo.y += ufo.vy * dt;
    applyUfoTractorBeam(state, seedHolder, ufo, dt);
    if (target) {
      applyUfoBossPlayerDrainBeam(state, ufo, target, dt);
    }
    updateUfoUndersideImpact(state, ufo, players);
    ufo.rotation = finiteOr(ufo.beamAngle, Math.PI / 2) - Math.PI / 2;
  }

  function nearestCombatPlayer(players, mob) {
    let target = players[0] || null;
    let targetDistance = Infinity;
    for (const candidate of players) {
      const distance = Math.hypot(candidate.x - mob.x, candidate.y - mob.y);
      if (distance < targetDistance) {
        target = candidate;
        targetDistance = distance;
      }
    }
    return { player: target, distance: targetDistance };
  }

  function combatTargetsForMobs(state) {
    const targets = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    for (const mob of allCombatMobs(state.world)) {
      if (mob && mob.health > 0 && isPlayerTeamMob(mob)) {
        targets.push(mob);
      }
    }
    const hasInsidePlayer = Object.values(state.players || {}).some((entry) => entry && entry.health > 0 && entry.spacecraftInterior);
    if (targets.length || !hasInsidePlayer) {
      return targets;
    }
    return spacecraftComponentTargets(state.world);
  }

  function simTime(state) {
    return finiteOr(state && state.tick, 0) * TICK_DT;
  }

  function ensureMobMechanics(mob, seedHolder) {
    if (!mob || !mob.kind) {
      return;
    }
    mob.strafeSign = Number(mob.strafeSign) < 0 ? -1 : 1;
    mob.wobble = finiteOr(mob.wobble, randomRange(seedHolder, 0, Math.PI * 2));
    if (mob.kind === "rambot") {
      mob.chargeCooldown = Math.max(0, finiteOr(mob.chargeCooldown, randomRange(seedHolder, 1.2, 2.6)));
      mob.chargeTimer = Math.max(0, finiteOr(mob.chargeTimer, 0));
      mob.recoverTimer = Math.max(0, finiteOr(mob.recoverTimer, 0));
      mob.chargeDirX = finiteOr(mob.chargeDirX, 1);
      mob.chargeDirY = finiteOr(mob.chargeDirY, 0);
      mob.impactCooldown = Math.max(0, finiteOr(mob.impactCooldown, 0));
    } else if (mob.kind === "ufo") {
      mob.beamAngle = finiteOr(mob.beamAngle, Math.PI / 2);
      mob.beamPulse = finiteOr(mob.beamPulse, randomRange(seedHolder, 0, Math.PI * 2));
      mob.tractorDisabledTimer = Math.max(0, finiteOr(mob.tractorDisabledTimer, 0));
      mob.bossBeamMode = normalizeUfoBossBeamModeValue(mob.bossBeamMode);
      mob.bossBeamTimer = Math.max(0, finiteOr(mob.bossBeamTimer, UFO_BOSS_NORMAL_BEAM_DURATION));
      mob.playerDrainTickTimer = Math.max(0, finiteOr(mob.playerDrainTickTimer, 0));
    } else if (mob.kind === "engineer") {
      mob.healCooldown = Math.max(0, finiteOr(mob.healCooldown, randomRange(seedHolder, 0.35, 0.9)));
      mob.healPulse = Math.max(0, finiteOr(mob.healPulse, 0));
      mob.repairBeamAngle = finiteOr(mob.repairBeamAngle, 0);
      mob.targetKind = typeof mob.targetKind === "string" ? mob.targetKind : "";
      mob.targetId = Math.max(0, Math.floor(finiteOr(mob.targetId, 0)));
    } else if (mob.kind === "tesla") {
      mob.shootCooldown = Math.max(0, finiteOr(mob.shootCooldown, randomRange(seedHolder, 1.2, 2.5)));
      mob.lightningWarmup = clamp(finiteOr(mob.lightningWarmup, 0), 0, 1);
      mob.lightningFlash = Math.max(0, finiteOr(mob.lightningFlash, 0));
      mob.lightningAngle = finiteOr(mob.lightningAngle, 0);
    } else if (mob.kind === "satellite") {
      mob.scannerAngle = finiteOr(mob.scannerAngle, finiteOr(mob.rotation, 0) - Math.PI / 2);
      mob.scanProgress = clamp(finiteOr(mob.scanProgress, 0), 0, 1);
      mob.lockTimer = Math.max(0, finiteOr(mob.lockTimer, 0));
      mob.blastTimer = Math.max(0, finiteOr(mob.blastTimer, 0));
      mob.recoverTimer = Math.max(0, finiteOr(mob.recoverTimer, 0));
      mob.lockX = finiteOr(mob.lockX, mob.x);
      mob.lockY = finiteOr(mob.lockY, mob.y);
      mob.blastDirX = finiteOr(mob.blastDirX, 1);
      mob.blastDirY = finiteOr(mob.blastDirY, 0);
      mob.volleyTimer = Math.max(0, finiteOr(mob.volleyTimer, 0));
      mob.volleyShots = Math.max(0, Math.floor(finiteOr(mob.volleyShots, 0)));
      mob.impactCooldown = Math.max(0, finiteOr(mob.impactCooldown, 0));
    } else if (mob.kind === "rocket") {
      mob.chargeCooldown = Math.max(0, finiteOr(mob.chargeCooldown, randomRange(seedHolder, 0.6, 1.6)));
      mob.chargeTimer = Math.max(0, finiteOr(mob.chargeTimer, 0));
      mob.chargeDirX = finiteOr(mob.chargeDirX, Math.cos(finiteOr(mob.rotation, 0) - Math.PI / 2));
      mob.chargeDirY = finiteOr(mob.chargeDirY, Math.sin(finiteOr(mob.rotation, 0) - Math.PI / 2));
      mob.chargePower = clamp(finiteOr(mob.chargePower, 0), 0, 1);
      mob.recoverTimer = Math.max(0, finiteOr(mob.recoverTimer, 0));
      mob.lockX = finiteOr(mob.lockX, mob.x);
      mob.lockY = finiteOr(mob.lockY, mob.y);
      mob.impactCooldown = Math.max(0, finiteOr(mob.impactCooldown, 0));
      mob.blastTimer = Math.max(0, finiteOr(mob.blastTimer, 0));
    } else if (mob.kind === "fighter") {
      mob.shootCooldown = Math.max(0, finiteOr(mob.shootCooldown, randomRange(seedHolder, 1.0, 2.4)));
      mob.shieldCharge = clamp(finiteOr(mob.shieldCharge, FIGHTER_SHIELD_MAX_CHARGE), 0, FIGHTER_SHIELD_MAX_CHARGE);
      mob.shieldRecharge = clamp(finiteOr(mob.shieldRecharge, 0), 0, FIGHTER_SHIELD_CYCLE);
      mob.shieldActive = Math.max(0, finiteOr(mob.shieldActive, 0));
    }
  }

  function structureHitRadius(structure) {
    if (!structure || typeof structure !== "object") return 48;
    if (structure.type === "battery" || structure.type === "tether") return 42;
    if (structure.type === "container") return 48;
    if (structure.type === "trading-port") return 58;
    if (structure.type === "medbay") return 52;
    if (structure.type === "accumulator") return 44;
    if (structure.type === "jet" || structure.type === "bridge") return 46;
    if (structure.type === "shield-generator" || structure.type === "missile-launcher" || structure.type === "communication-relay") return 52;
    return structure.type === "plating-block" ? 48 : 48;
  }

  function nearestStructureTarget(world, x, y, maxRange, predicate) {
    let best = null;
    let bestDistance = Infinity;
    for (const structure of world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0 || predicate && !predicate(structure)) {
        continue;
      }
      const distance = Math.hypot(finiteOr(structure.x, 0) - x, finiteOr(structure.y, 0) - y);
      if (distance > maxRange + structureHitRadius(structure) || distance >= bestDistance) {
        continue;
      }
      best = structure;
      bestDistance = distance;
    }
    return best;
  }

  function hasClearShotAtStructure(world, x, y, structure) {
    return !projectileBlockedBySolidBody(world, x, y, structure.x, structure.y, structureHitRadius(structure) * 0.14);
  }

  function damageStructure(state, structure, damage, cause) {
    if (!structure || finiteOr(structure.health, 0) <= 0) {
      return false;
    }
    if (structure.type === "tether") {
      return false;
    }
    if (isSurvivalCampStructure(state, structure)) {
      wakeSurvivalCampFromStructure(state, structure, "");
    }
    structure.health = Math.max(0, finiteOr(structure.health, 0) - Math.max(0, finiteOr(damage, 0)));
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.22);
    if (structure.health <= 0) {
      structure.disabledTimer = Math.max(finiteOr(structure.disabledTimer, 0), 1.2);
    }
    state.events.push({ type: "structure.hitByMob", structureId: structure.id, cause: cause || "mob", tick: state.tick });
    return structure.health <= 0;
  }

  function disableStructure(state, structure, duration, cause) {
    if (!structure || finiteOr(structure.health, 0) <= 0) {
      return false;
    }
    structure.disabledTimer = Math.max(finiteOr(structure.disabledTimer, 0), Math.max(0, finiteOr(duration, 0)));
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.18);
    state.events.push({ type: "structure.disabledByMob", structureId: structure.id, cause: cause || "mob", tick: state.tick });
    return true;
  }

  function repairStructure(state, structure, amount, cause) {
    if (!structure) {
      return false;
    }
    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const current = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    const disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0));
    if (current >= maxHealth && disabledTimer <= 0) {
      return false;
    }
    const repairAmount = Math.max(0, finiteOr(amount, 0));
    structure.maxHealth = maxHealth;
    structure.health = Math.min(maxHealth, current + repairAmount);
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.12);
    if (structure.health > 0 && disabledTimer > 0) {
      structure.disabledTimer = 0;
    } else if (structure.health > 0) {
      structure.disabledTimer = Math.min(finiteOr(structure.disabledTimer, 0), 0.4);
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "structure.repairedByPlayer", structureId: structure.id, cause: cause || "spanner", tick: state.tick });
    }
    return true;
  }

  function structureTargetPointForPlayer(structure, player) {
    if (structure && isLinkedStructureType(structure.type)) {
      const firstDistance = Math.hypot(finiteOr(structure.x, 0) - player.x, finiteOr(structure.y, 0) - player.y);
      const x2 = finiteOr(structure.x2, structure.x);
      const y2 = finiteOr(structure.y2, structure.y);
      const secondDistance = Math.hypot(x2 - player.x, y2 - player.y);
      if (secondDistance < firstDistance) {
        return { x: x2, y: y2, playerDistance: secondDistance };
      }
    }
    return {
      x: finiteOr(structure && structure.x, 0),
      y: finiteOr(structure && structure.y, 0),
      playerDistance: Math.hypot(finiteOr(structure && structure.x, 0) - player.x, finiteOr(structure && structure.y, 0) - player.y)
    };
  }

  function findSpannerStructureTarget(world, player, input, options) {
    if (!world || !player || !input) {
      return null;
    }
    const damagedOnly = Boolean(options && options.damagedOnly);
    const aim = aimVector(input);
    const ax = player.x + aim.x * 18;
    const ay = player.y + aim.y * 18;
    const bx = player.x + aim.x * (SPANNER_REPAIR_RANGE + 86);
    const by = player.y + aim.y * (SPANNER_REPAIR_RANGE + 86);
    let best = null;
    let bestScore = Infinity;

    for (const structure of world.structures || []) {
      const maxHealth = Math.max(1, finiteOr(structure && structure.maxHealth, structureMaxHealth(structure && structure.type)));
      const health = clamp(finiteOr(structure && structure.health, maxHealth), 0, maxHealth);
      const disabledTimer = Math.max(0, finiteOr(structure && structure.disabledTimer, 0));
      if (!structure || (!damagedOnly && health <= 0) || (damagedOnly && health >= maxHealth && disabledTimer <= 0)) {
        continue;
      }
      const target = structureTargetPointForPlayer(structure, player);
      const hitRadius = structureHitRadius(structure);
      if (target.playerDistance > SPANNER_REPAIR_RANGE + hitRadius) {
        continue;
      }
      const segmentDistance = distanceToSegment(target.x, target.y, ax, ay, bx, by);
      if (segmentDistance > hitRadius + 42) {
        continue;
      }
      const score = segmentDistance + target.playerDistance * 0.18;
      if (score < bestScore) {
        best = structure;
        bestScore = score;
      }
    }

    return best;
  }

  function useSpannerOnStructure(state, player, input, dt) {
    if (!state || !state.world || !player || !input || !isSpannerToolId(input.equippedTool) || !playerHasTool(player, "spanner")) {
      return false;
    }
    if (hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }

    if (input.buttons.fire) {
      const target = findSpannerStructureTarget(state.world, player, input, { damagedOnly: true });
      if (!target || !spendPlayerEnergy(player, SPANNER_REPAIR_ENERGY_DRAIN * dt)) {
        return false;
      }
      const amount = SPANNER_REPAIR_RATE * toolUpgradeFactor(player, "spanner", "repair-speed") * dt;
      return repairStructure(state, target, amount, "spanner");
    }

    if (input.buttons.dismantle || input.toolMode === "dismantle") {
      const target = findSpannerStructureTarget(state.world, player, input, { damagedOnly: false });
      if (!target || !spendPlayerEnergy(player, SPANNER_DISMANTLE_ENERGY_DRAIN * dt)) {
        return false;
      }
      const maxHealth = Math.max(1, finiteOr(target.maxHealth, structureMaxHealth(target.type)));
      const health = clamp(finiteOr(target.health, maxHealth), 0, maxHealth);
      target.maxHealth = maxHealth;
      target.health = Math.max(0, health - SPANNER_DISMANTLE_RATE * toolUpgradeFactor(player, "spanner", "dismantle-speed") * dt);
      target.flash = Math.max(finiteOr(target.flash, 0), 0.16);
      state.events.push({ type: "structure.dismantledByPlayer", structureId: target.id, playerId: player.id || "", tick: state.tick });
      if (target.health <= 0) {
        const index = state.world.structures.indexOf(target);
        if (index !== -1) {
          state.world.structures.splice(index, 1);
        }
        const refunded = refundRecipeCost(player, recipeByStructureType(target.type), 0.8);
        state.events.push({ type: "structure.removedBySpanner", structureId: target.id, playerId: player.id || "", refunded, tick: state.tick });
      }
      return true;
    }

    return false;
  }

  function playerTarget(player) {
    if (isCombatMobEntity(player)) {
      return {
        kind: "mob",
        mobTarget: true,
        targetMob: player,
        x: player.x,
        y: player.y,
        vx: finiteOr(player.vx, 0),
        vy: finiteOr(player.vy, 0),
        radius: finiteOr(player.radius, 28)
      };
    }
    if (player && player.spacecraftTarget) {
      return {
        kind: "spacecraft",
        player,
        spacecraftTarget: true,
        x: player.x,
        y: player.y,
        vx: finiteOr(player.vx, 0),
        vy: finiteOr(player.vy, 0),
        radius: finiteOr(player.radius, 32)
      };
    }
    return {
      kind: "player",
      player,
      x: player.x,
      y: player.y,
      vx: finiteOr(player.vx, 0),
      vy: finiteOr(player.vy, 0),
      radius: finiteOr(player.radius, PLAYER_RADIUS)
    };
  }

  function structureTarget(structure) {
    return {
      kind: "structure",
      structure,
      x: finiteOr(structure.x, 0),
      y: finiteOr(structure.y, 0),
      vx: 0,
      vy: 0,
      radius: structureHitRadius(structure)
    };
  }

  function hasClearShotAtCombatTarget(world, mob, target) {
    if (target && target.kind === "structure") {
      return hasClearShotAtStructure(world, mob.x, mob.y, target.structure);
    }
    if (target && target.kind === "spacecraft") {
      return !projectileBlockedBySolidBody(world, mob.x, mob.y, target.x, target.y, Math.max(4, target.radius * 0.18));
    }
    if (target && target.kind === "mob") {
      return !projectileBlockedBySolidBody(world, mob.x, mob.y, target.x, target.y, Math.max(4, target.radius * 0.2));
    }
    return target && target.player ? hasClearShotAtPlayer(world, mob, target.player) : false;
  }

  function projectileBlockedBySolidBody(world, ax, ay, bx, by, radius, ignoredBodyId) {
    for (const body of world.particles || []) {
      if (!body || !body.tier || !body.tier.solid) {
        continue;
      }
      if (ignoredBodyId && body.id === ignoredBodyId) {
        continue;
      }
      const hitDistance = solidContactRadius(body) + radius;
      if (distanceToSegment(body.x, body.y, ax, ay, bx, by) < hitDistance) {
        return body;
      }
    }
    return null;
  }

  function hasClearShotAtPlayer(world, mob, target) {
    return !projectileBlockedBySolidBody(world, mob.x, mob.y, target.x, target.y, Math.max(4, target.radius * 0.18));
  }

  function fireAlienoidLaser(state, mob, target, distance, seedHolder) {
    if (!target) {
      return;
    }
    const leadTime = clamp(distance / RIVAL_PROJECTILE_SPEED, 0, 1.35);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.72;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.72;
    const aim = normalize(targetX - mob.x, targetY - mob.y);
    const muzzleDistance = mob.radius + 18;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: mob.x + aim.x * muzzleDistance,
      y: mob.y + aim.y * muzzleDistance,
      vx: aim.x * RIVAL_PROJECTILE_SPEED + finiteOr(mob.vx, 0) * 0.18,
      vy: aim.y * RIVAL_PROJECTILE_SPEED + finiteOr(mob.vy, 0) * 0.18,
      radius: 5,
      length: randomRange(seedHolder, 34, 46),
      color: shadeColor(mob.color, 64),
      life: 2.38,
      maxLife: 2.38,
      damage: bossScaledDamage(mob, RIVAL_PROJECTILE_DAMAGE),
      toolDisable: 0,
      cause: mob.isBoss ? "Alienoid boss laser" : "Alienoid laser",
      ...playerTeamMobProjectileFields(mob),
      targetPlayerId: target.id || ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    mob.shootCooldown = randomRange(seedHolder, 4.5, 7.25) * (mob.isBoss ? 0.68 : 1);
    mob.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
    state.events.push({ type: "mob.shot", mobId: mob.id, kind: mob.kind || "alienoid", projectileId: projectile.id, tick: state.tick });
  }

  function fireAlienoidBossShotgunBlast(state, mob, target, distance, seedHolder) {
    if (!target) {
      return;
    }
    const leadTime = clamp(distance / RIVAL_PROJECTILE_SPEED, 0, 1.2);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.6;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.6;
    const aim = normalize(targetX - mob.x, targetY - mob.y);
    const aimAngle = Math.atan2(aim.y, aim.x);
    const muzzleDistance = mob.radius + 20;
    const pelletCount = 9;
    const spread = 0.28;
    const laserColor = shadeColor(mob.color, 82);

    for (let i = 0; i < pelletCount; i += 1) {
      const lineT = pelletCount <= 1 ? 0 : i / (pelletCount - 1) * 2 - 1;
      const clusteredT = Math.sign(lineT) * Math.pow(Math.abs(lineT), 1.35);
      const angleOffset = clusteredT * spread + randomRange(seedHolder, -0.04, 0.04);
      const dirX = Math.cos(aimAngle + angleOffset);
      const dirY = Math.sin(aimAngle + angleOffset);
      const sideX = -dirY;
      const sideY = dirX;
      const muzzleScatter = randomRange(seedHolder, -12, 12);
      const forwardScatter = randomRange(seedHolder, -5, 9);
      const pelletSpeed = RIVAL_PROJECTILE_SPEED + randomRange(seedHolder, 45, 175);
      const pelletLife = randomRange(seedHolder, 1.28, 1.82);
      const projectile = normalizeEntity({
        id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
        kind: "projectile",
        x: mob.x + dirX * (muzzleDistance + forwardScatter) + sideX * muzzleScatter,
        y: mob.y + dirY * (muzzleDistance + forwardScatter) + sideY * muzzleScatter,
        vx: dirX * pelletSpeed + finiteOr(mob.vx, 0) * 0.12,
        vy: dirY * pelletSpeed + finiteOr(mob.vy, 0) * 0.12,
        radius: randomRange(seedHolder, 4.4, 6.2),
        length: randomRange(seedHolder, 32, 54),
        color: laserColor,
        life: pelletLife,
        maxLife: pelletLife,
        damage: bossScaledDamage(mob, RIVAL_PROJECTILE_DAMAGE * 0.42),
        toolDisable: 0,
        cause: "Alienoid boss shotgun blast",
        ...playerTeamMobProjectileFields(mob),
        targetPlayerId: target.id || ""
      }, state.world.nextRivalProjectileId || 1, "projectile");
      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      state.events.push({ type: "mob.shot", mobId: mob.id, kind: mob.kind || "alienoid", projectileId: projectile.id, attack: "alt", tick: state.tick });
    }

    mob.rotation = aimAngle + Math.PI / 2;
    resetBossAltAttackCooldown(mob, seedHolder);
  }

  function updateAlienoid(state, mob, players, dt, seedHolder) {
    const targetInfo = nearestCombatPlayer(players, mob);
    const target = targetInfo.player;
    const dist = targetInfo.distance || 1;
    if (!target) {
      return;
    }

    mob.shootCooldown = Math.max(0, finiteOr(mob.shootCooldown, 1) - dt);
    const bossAltReady = tickBossAltAttackCooldown(mob, dt, seedHolder);
    const nx = (target.x - mob.x) / dist;
    const ny = (target.y - mob.y) / dist;
    const tangentX = -ny * (Number(mob.strafeSign) < 0 ? -1 : 1);
    const tangentY = nx * (Number(mob.strafeSign) < 0 ? -1 : 1);
    const desiredDistance = 300;
    const chaseForce = bossChaseForce(mob, dist > desiredDistance ? 136 : -62);
    const strafeForce = bossStrafeForce(mob, dist < RIVAL_SHOOT_RANGE ? 46 : 12);

    mob.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    mob.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    if (dist < RIVAL_SHOOT_RANGE && mob.shootCooldown <= 0 && hasClearShotAtPlayer(state.world, mob, target)) {
      fireAlienoidLaser(state, mob, target, dist, seedHolder);
    }
    if (bossAltReady && dist < RIVAL_SHOOT_RANGE * 1.16 && hasClearShotAtPlayer(state.world, mob, target)) {
      fireAlienoidBossShotgunBlast(state, mob, target, dist, seedHolder);
    }

    mob.vx += Math.sin(state.tick * 0.036 + finiteOr(mob.wobble, 0)) * 8 * dt;
    mob.vy += Math.cos(state.tick * 0.03 + finiteOr(mob.wobble, 0)) * 8 * dt;
    mob.vx *= Math.pow(0.72, dt);
    mob.vy *= Math.pow(0.72, dt);

    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = bossChaseMaxSpeed(mob, dist > 620 ? 275 : 190, nx, ny);
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.rotation = Math.atan2(ny, nx) + Math.PI / 2 + Math.sin(state.tick * 0.12 + finiteOr(mob.wobble, 0)) * 0.08;
  }

  function bodyById(world, bodyId) {
    const id = Math.max(0, Math.floor(finiteOr(bodyId, 0)));
    if (!id) {
      return null;
    }
    return (world.particles || []).find((body) => body && body.id === id) || null;
  }

  function rambotAttackTarget(state, player) {
    if (isCombatMobEntity(player)) {
      return playerTarget(player);
    }
    if (player && player.landed) {
      const body = bodyById(state.world, player.landed.bodyId);
      if (body && body.tier && body.tier.solid) {
        return {
          kind: "body",
          body,
          x: body.x,
          y: body.y,
          vx: finiteOr(body.vx, 0),
          vy: finiteOr(body.vy, 0),
          radius: finiteOr(body.radius, 0)
        };
      }
    }
    return playerTarget(player);
  }

  function hitPlayerWithMob(state, mob, target, nx, ny, damage, cause, impulse) {
    if (target && target.spacecraftTarget) {
      if (mob.impactCooldown > 0) {
        return false;
      }
      if (damageSpacecraftTarget(state, target, damage, cause)) {
        state.events.push({ type: "spacecraft.hitByMob", spacecraftId: target.spacecraftId, componentId: target.spacecraftComponentId, mobId: mob.id, kind: mob.kind || cause || "mob", tick: state.tick });
      }
      mob.impactCooldown = 0.95;
      return true;
    }
    if (!target || target.health <= 0 || target.hitCooldown > 0 || target.invulnerableTimer > 0 || mob.impactCooldown > 0) {
      return false;
    }
    if (isPlayerTeamMob(target)) {
      knockMob(target, nx, ny, impulse * 0.55);
      damageMob(state, target, damage, cause || "mob");
      mob.impactCooldown = 0.95;
      return true;
    }
    if (isCombatMobEntity(target)) {
      knockMob(target, nx, ny, impulse * 0.55);
      damageMob(state, target, damage, cause || "mob");
      mob.impactCooldown = 0.95;
      return true;
    }
    target.vx += nx * impulse + finiteOr(mob.vx, 0) * 0.52;
    target.vy += ny * impulse + finiteOr(mob.vy, 0) * 0.52;
    if (damagePlayer(state, target, difficultyMobDamage(state, damage), cause)) {
      state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: mob.id, kind: mob.kind || cause || "mob", tick: state.tick });
    }
    mob.impactCooldown = 0.95;
    return true;
  }

  function updateRambotPlayerImpact(state, rambot, target) {
    if (!target) {
      return;
    }
    const dx = target.x - rambot.x;
    const dy = target.y - rambot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = finiteOr(target.radius, PLAYER_RADIUS) * 0.74 + rambot.radius * 0.86;
    if (dist > hitDistance) {
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > RAMBOT_IMPACT_SPEED;
    const overlap = hitDistance - dist;
    target.x += nx * overlap * 0.72;
    target.y += ny * overlap * 0.72;
    rambot.x -= nx * overlap * 0.28;
    rambot.y -= ny * overlap * 0.28;
    if (charging && hitPlayerWithMob(state, rambot, target, nx, ny, bossScaledDamage(rambot, RAMBOT_IMPACT_DAMAGE), rambot.isBoss ? "Rambot boss charge" : "Rambot charge", 360)) {
      rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.58);
      rambot.chargeTimer = 0;
      rambot.vx -= nx * 230;
      rambot.vy -= ny * 230;
    }
  }

  function updateRambotStructureImpact(state, rambot) {
    if (isPlayerTeamMob(rambot)) {
      return;
    }
    if (rambot.impactCooldown > 0) {
      return;
    }
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const charging = rambot.chargeTimer > 0 || speed > RAMBOT_IMPACT_SPEED;
    if (!charging) {
      return;
    }
    for (const structure of state.world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0) {
        continue;
      }
      const dx = structure.x - rambot.x;
      const dy = structure.y - rambot.y;
      const dist = Math.hypot(dx, dy) || 1;
      const hitDistance = rambot.radius * 0.82 + structureHitRadius(structure);
      if (dist > hitDistance) {
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = hitDistance - dist;
      rambot.x -= nx * overlap * 0.34;
      rambot.y -= ny * overlap * 0.34;
      rambot.vx -= nx * 210;
      rambot.vy -= ny * 210;
      rambot.impactCooldown = 0.95;
      rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.58);
      rambot.chargeTimer = 0;
      damageStructure(state, structure, bossScaledDamage(rambot, STRUCTURE_RAMBOT_DAMAGE + Math.max(0, speed - RAMBOT_IMPACT_SPEED) * 0.045), rambot.isBoss ? "Rambot boss charge" : "Rambot charge");
      break;
    }
  }

  function rambotBossBaseForwardAngle(rambot) {
    return finiteOr(rambot.rotation, 0) - Math.PI / 2;
  }

  function clampedRambotBossHeadAngle(rambot, desiredAngle) {
    const baseAngle = rambotBossBaseForwardAngle(rambot);
    const offset = clamp(shortestAngleDelta(baseAngle, desiredAngle), -RAMBOT_BOSS_HEAD_TURN_LIMIT, RAMBOT_BOSS_HEAD_TURN_LIMIT);
    return baseAngle + offset;
  }

  function updateRambotBossHeadTracking(rambot, x, y, dt, turnRate) {
    if (!rambot || !rambot.isBoss) {
      return;
    }
    const desiredAngle = Math.atan2(y - rambot.y, x - rambot.x);
    const targetAngle = clampedRambotBossHeadAngle(rambot, desiredAngle);
    const currentAngle = Number.isFinite(Number(rambot.headAngle)) ? rambot.headAngle : targetAngle;
    rambot.headAngle = currentAngle + clamp(shortestAngleDelta(currentAngle, targetAngle), -turnRate * dt, turnRate * dt);
  }

  function tickRambotBossAltAttackCooldown(rambot, dt, seedHolder) {
    if (!rambot || !rambot.isBoss) {
      return false;
    }
    rambot.altAttackCooldown = finiteOr(
      rambot.altAttackCooldown,
      randomRange(seedHolder, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MIN, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MAX)
    ) - dt;
    return rambot.altAttackCooldown <= 0;
  }

  function resetRambotBossAltAttackCooldown(rambot, seedHolder) {
    if (rambot && rambot.isBoss) {
      rambot.altAttackCooldown = randomRange(seedHolder, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MIN, RAMBOT_BOSS_ALT_ATTACK_COOLDOWN_MAX);
    }
  }

  function rambotBossPistonExtension(rambot) {
    const duration = Math.max(0.1, finiteOr(rambot.pistonDuration, RAMBOT_BOSS_PISTON_DURATION));
    const elapsed = duration - Math.max(0, finiteOr(rambot.pistonTimer, 0));
    const t = clamp(elapsed / duration, 0, 1);
    if (t < 0.24) return 0;
    if (t < 0.58) return (t - 0.24) / 0.34;
    if (t < 0.78) return 1;
    return 1 - (t - 0.78) / 0.22;
  }

  function startRambotBossPistonAttack(rambot, target, seedHolder) {
    rambot.pistonDuration = RAMBOT_BOSS_PISTON_DURATION;
    rambot.pistonTimer = RAMBOT_BOSS_PISTON_DURATION;
    rambot.pistonHit = false;
    rambot.chargeTimer = 0;
    rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.12);
    rambot.vx *= 0.74;
    rambot.vy *= 0.74;
    updateRambotBossHeadTracking(rambot, target.x, target.y, TICK_DT, 18);
    resetRambotBossAltAttackCooldown(rambot, seedHolder);
  }

  function updateRambotBossPistonImpact(state, rambot, target) {
    if (!rambot || !rambot.isBoss || finiteOr(rambot.pistonTimer, 0) <= 0 || rambot.pistonHit || !target) {
      return;
    }
    const extension = rambotBossPistonExtension(rambot);
    if (extension < 0.54) {
      return;
    }
    const headAngle = Number.isFinite(Number(rambot.headAngle)) ? rambot.headAngle : rambotBossBaseForwardAngle(rambot);
    const dirX = Math.cos(headAngle);
    const dirY = Math.sin(headAngle);
    const originX = rambot.x + dirX * (rambot.radius * 0.24);
    const originY = rambot.y + dirY * (rambot.radius * 0.24);
    const reach = rambot.radius * 0.42 + RAMBOT_BOSS_PISTON_RANGE * extension;
    const endX = originX + dirX * reach;
    const endY = originY + dirY * reach;

    if (distanceToSegment(target.x, target.y, originX, originY, endX, endY) <= finiteOr(target.radius, PLAYER_RADIUS) * 0.78 + 30) {
      target.vx += dirX * RAMBOT_BOSS_PISTON_KNOCKBACK;
      target.vy += dirY * RAMBOT_BOSS_PISTON_KNOCKBACK;
      if (isCombatMobEntity(target)) {
        damageMob(state, target, bossScaledDamage(rambot, RAMBOT_BOSS_PISTON_DAMAGE), "Rambot boss piston punch");
      } else if (damagePlayer(state, target, difficultyMobDamage(state, bossScaledDamage(rambot, RAMBOT_BOSS_PISTON_DAMAGE)), "Rambot boss piston punch")) {
        state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: rambot.id, kind: "rambot", cause: "piston-punch", tick: state.tick });
      }
      rambot.pistonHit = true;
      rambot.impactCooldown = Math.max(finiteOr(rambot.impactCooldown, 0), 0.7);
      rambot.vx -= dirX * 140;
      rambot.vy -= dirY * 140;
      return;
    }

    if (isPlayerTeamMob(rambot)) {
      return;
    }

    for (const structure of state.world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0) {
        continue;
      }
      if (distanceToSegment(structure.x, structure.y, originX, originY, endX, endY) > structureHitRadius(structure) + 28) {
        continue;
      }
      damageStructure(state, structure, bossScaledDamage(rambot, STRUCTURE_RAMBOT_DAMAGE + RAMBOT_BOSS_PISTON_DAMAGE * 0.72), "Rambot boss piston punch");
      rambot.pistonHit = true;
      rambot.impactCooldown = Math.max(finiteOr(rambot.impactCooldown, 0), 0.7);
      break;
    }
  }

  function updateRambot(state, rambot, players, dt, seedHolder) {
    rambot.impactCooldown = Math.max(0, finiteOr(rambot.impactCooldown, 0) - dt);
    const bossAltReady = tickRambotBossAltAttackCooldown(rambot, dt, seedHolder);
    const targetInfo = nearestCombatPlayer(players, rambot);
    const targetPlayer = targetInfo.player;
    if (!targetPlayer) {
      return;
    }
    const attackTarget = rambotAttackTarget(state, targetPlayer);
    const toTargetX = attackTarget.x - rambot.x;
    const toTargetY = attackTarget.y - rambot.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rambot.strafeSign;
    const tangentY = nx * rambot.strafeSign;

    if (rambot.isBoss && finiteOr(rambot.pistonTimer, 0) > 0) {
      rambot.pistonTimer = Math.max(0, finiteOr(rambot.pistonTimer, 0) - dt);
      updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, dt, 8.5);
      updateRambotBossPistonImpact(state, rambot, targetPlayer);
      rambot.vx *= Math.pow(0.34, dt);
      rambot.vy *= Math.pow(0.34, dt);
      if (rambot.pistonTimer <= 0) {
        rambot.recoverTimer = Math.max(finiteOr(rambot.recoverTimer, 0), 0.38);
      }
    } else if (bossAltReady && rambot.isBoss && attackTarget.kind === "player" && targetInfo.distance < 760) {
      startRambotBossPistonAttack(rambot, targetPlayer, seedHolder);
    } else if (rambot.chargeTimer > 0) {
      rambot.chargeTimer = Math.max(0, rambot.chargeTimer - dt);
      rambot.vx += rambot.chargeDirX * 900 * dt;
      rambot.vy += rambot.chargeDirY * 900 * dt;
      if (rambot.chargeTimer <= 0) {
        rambot.recoverTimer = randomRange(seedHolder, 0.55, 0.9);
        rambot.chargeCooldown = randomRange(seedHolder, 1.6, 3.1);
      }
    } else if (rambot.recoverTimer > 0) {
      rambot.recoverTimer = Math.max(0, rambot.recoverTimer - dt);
      rambot.vx *= Math.pow(0.22, dt);
      rambot.vy *= Math.pow(0.22, dt);
    } else {
      rambot.chargeCooldown = Math.max(0, finiteOr(rambot.chargeCooldown, 0) - dt);
      const chaseForce = bossChaseForce(rambot, rambot.isBoss ? 154 : 118);
      const strafeForce = bossStrafeForce(rambot, rambot.isBoss ? 32 : 22);
      rambot.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      rambot.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
      const chargeRange = attackTarget.kind === "body" ? attackTarget.radius + 860 : 1080;
      if (dist < chargeRange && rambot.chargeCooldown <= 0) {
        rambot.chargeDirX = nx;
        rambot.chargeDirY = ny;
        rambot.chargeTimer = attackTarget.kind === "player" ? randomRange(seedHolder, 0.92, 1.14) : randomRange(seedHolder, 0.62, 0.82);
        rambot.impactCooldown = 0;
        const launchImpulse = attackTarget.kind === "player" ? 220 : 170;
        rambot.vx += nx * launchImpulse;
        rambot.vy += ny * launchImpulse;
      }
    }

    const time = simTime(state);
    rambot.vx += Math.sin(time * 0.5 + rambot.wobble) * 5 * dt;
    rambot.vy += Math.cos(time * 0.45 + rambot.wobble) * 5 * dt;
    rambot.vx *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);
    rambot.vy *= Math.pow(rambot.chargeTimer > 0 ? 0.88 : 0.68, dt);
    const speed = Math.hypot(rambot.vx, rambot.vy);
    const maxSpeed = bossChaseMaxSpeed(
      rambot,
      rambot.chargeTimer > 0 ? (rambot.isBoss ? 570 : 475) : (rambot.isBoss ? 215 : 150),
      rambot.chargeTimer > 0 ? rambot.chargeDirX : nx,
      rambot.chargeTimer > 0 ? rambot.chargeDirY : ny
    );
    if (speed > maxSpeed) {
      rambot.vx = (rambot.vx / speed) * maxSpeed;
      rambot.vy = (rambot.vy / speed) * maxSpeed;
    }
    rambot.x += rambot.vx * dt;
    rambot.y += rambot.vy * dt;
    updateRambotPlayerImpact(state, rambot, targetPlayer);
    updateRambotStructureImpact(state, rambot);
    rambot.rotation = Math.atan2(rambot.vy || ny, rambot.vx || nx) + Math.PI / 2;
    updateRambotBossHeadTracking(rambot, targetPlayer.x, targetPlayer.y, dt, rambot.chargeTimer > 0 ? 6.5 : 3.6);
  }

  function allCombatMobs(world) {
    const mobs = [];
    for (const collectionName of MOB_COLLECTIONS) {
      for (const mob of world[collectionName] || []) {
        if (mob && mob.health > 0) {
          mobs.push(mob);
        }
      }
    }
    for (const beacon of world.mobBeacons || []) {
      if (beacon && beacon.health > 0) {
        mobs.push(beacon);
      }
    }
    return mobs;
  }

  function isMobDisabled(mob) {
    return Boolean(mob && finiteOr(mob.disabledTimer, 0) > 0);
  }

  function disableMob(mob, duration) {
    if (!mob || finiteOr(mob.health, 0) <= 0) {
      return false;
    }
    const disableDuration = Math.max(0, finiteOr(duration, 0));
    if (disableDuration <= 0) {
      return false;
    }
    mob.disabledTimer = Math.max(finiteOr(mob.disabledTimer, 0), disableDuration);
    mob.flash = Math.max(finiteOr(mob.flash, 0), 0.16);
    mob.lightningWarmup = 0;
    mob.lockTimer = 0;
    mob.volleyTimer = 0;
    mob.volleyShots = 0;
    mob.chargeTimer = 0;
    mob.chargePower = 0;
    mob.shieldActive = 0;
    if (mob.kind === "ufo") {
      mob.tractorDisabledTimer = Math.max(finiteOr(mob.tractorDisabledTimer, 0), disableDuration);
    }
    if (mob.kind === "rambot" || mob.kind === "rocket" || mob.kind === "satellite") {
      mob.recoverTimer = Math.max(finiteOr(mob.recoverTimer, 0), Math.min(0.85, disableDuration));
    }
    return true;
  }

  function updateDisabledMobDrift(state, mob, dt) {
    mob.vx *= Math.pow(0.42, dt);
    mob.vy *= Math.pow(0.42, dt);
    mob.x += finiteOr(mob.vx, 0) * dt;
    mob.y += finiteOr(mob.vy, 0) * dt;
    mob.lightningWarmup = 0;
    mob.scanProgress = 0;
    mob.shieldActive = 0;
    mob.rotation = finiteOr(mob.rotation, 0) + Math.sin(simTime(state) * 3 + finiteOr(mob.wobble, 0)) * 0.08 * dt;
  }

  function applyEmpPulse(state, x, y, radius, duration, options) {
    const settings = options && typeof options === "object" ? options : {};
    const world = state && state.world;
    const color = cloneColor(settings.color || { r: 126, g: 232, b: 255 });
    const range = Math.max(1, finiteOr(radius, EMP_PULSE_RANGE));
    const disableDuration = Math.max(0, finiteOr(duration, EMP_PULSE_DISABLE_DURATION));
    let affected = 0;

    if (world && settings.affectMobs !== false) {
      for (const mob of allCombatMobs(world)) {
        if (!mob || mob === settings.sourceMob || finiteOr(mob.health, 0) <= 0 || isPlayerTeamMob(mob)) {
          continue;
        }
        const distance = Math.hypot(mob.x - x, mob.y - y);
        if (distance <= range + finiteOr(mob.radius, 0) * 0.75 && disableMob(mob, disableDuration)) {
          const away = normalize(mob.x - x, mob.y - y);
          knockMob(mob, away.x, away.y, 95);
          affected += 1;
        }
      }
    }

    if (world && settings.affectStructures) {
      for (const structure of world.structures || []) {
        if (!structure || finiteOr(structure.health, 0) <= 0) {
          continue;
        }
        const distance = Math.hypot(structure.x - x, structure.y - y);
        if (distance <= range + structureHitRadius(structure)) {
          disableStructure(state, structure, disableDuration, settings.cause || "EMP pulse");
          affected += 1;
        }
      }
    }

    if (settings.affectPlayers) {
      for (const target of Object.values(state.players || {})) {
        if (!target || finiteOr(target.health, 0) <= 0 || target.spacecraftInterior) {
          continue;
        }
        const distance = Math.hypot(target.x - x, target.y - y);
        if (distance <= range + finiteOr(target.radius, PLAYER_RADIUS)) {
          const away = normalize(target.x - x, target.y - y);
          applyPlayerStatusEffect(target, "disabled", disableDuration);
          target.vx += away.x * 180;
          target.vy += away.y * 180;
          affected += 1;
        }
      }
    }

    state.events.push({
      type: "emp.pulse",
      x,
      y,
      radius: range,
      duration: disableDuration,
      affected,
      sourcePlayerId: settings.sourcePlayerId || "",
      sourceMobId: settings.sourceMob ? settings.sourceMob.id : 0,
      sourceKind: settings.sourceKind || "",
      cause: settings.cause || "EMP pulse",
      color,
      tick: state.tick
    });
    return affected;
  }

  function findEngineerHealTarget(world, engineer) {
    let best = null;
    let bestScore = Infinity;
    const healPlayerTeam = isPlayerTeamMob(engineer);
    for (const mob of allCombatMobs(world)) {
      if (mob === engineer || mob.kind === "engineer" || mob.health <= 0 || mob.health >= mob.maxHealth || isPlayerTeamMob(mob) !== healPlayerTeam) {
        continue;
      }
      const distance = Math.hypot(mob.x - engineer.x, mob.y - engineer.y);
      const missing = Math.max(0, mob.maxHealth - mob.health);
      const score = distance - missing * 2.7;
      if (distance < ENGINEER_HEAL_RANGE * 1.45 && score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }
    return best;
  }

  function randomEngineerBossSummonKind(seedHolder) {
    const world = seedHolder && seedHolder.world;
    const options = MOB_TIER_ORDER.filter((kind) => kind !== "engineer" && (!world || isMobBeaconReady(world, kind)));
    if (!options.length) {
      return "";
    }
    return options[Math.floor(randomRange(seedHolder, 0, options.length))] || "";
  }

  function summonEngineerBossMob(state, engineer, targetPlayer, seedHolder) {
    if (!state || !state.world || !engineer || !engineer.isBoss) {
      return false;
    }
    const summonSeed = { seed: seedHolder.seed, world: state.world };
    const kind = randomEngineerBossSummonKind(summonSeed);
    seedHolder.seed = summonSeed.seed;
    if (!kind) {
      return false;
    }
    const angleToTarget = targetPlayer ? Math.atan2(targetPlayer.y - engineer.y, targetPlayer.x - engineer.x) : randomRange(seedHolder, 0, Math.PI * 2);
    const angle = angleToTarget + randomRange(seedHolder, -0.95, 0.95);
    const distance = randomRange(seedHolder, 185, 315);
    const x = engineer.x + Math.cos(angle) * distance + randomRange(seedHolder, -42, 42);
    const y = engineer.y + Math.sin(angle) * distance + randomRange(seedHolder, -42, 42);
    const mob = createMob(state.world, kind, x, y, seedHolder, {
      summonAge: 0,
      summonDuration: ENGINEER_BOSS_SUMMON_DURATION,
      summonSpinSpeed: randomRange(seedHolder, 7.5, 11.5) * (randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1)
    });
    mob.summonBaseRadius = Math.max(1, finiteOr(mob.radius, 28));
    mob.radius = 0;
    mob.vx += finiteOr(engineer.vx, 0) * 0.12;
    mob.vy += finiteOr(engineer.vy, 0) * 0.12;
    mobCollectionByKind(state.world, kind).push(mob);
    resetBossAltAttackCooldown(engineer, seedHolder);
    state.events.push({
      type: "engineerBoss.summon",
      mobId: mob.id,
      kind,
      x,
      y,
      radius: ENGINEER_BOSS_SUMMON_RADIUS,
      color: cloneColor(mob.color || engineer.color),
      tick: state.tick
    });
    return true;
  }

  function updateEngineer(state, engineer, players, dt, seedHolder) {
    engineer.healCooldown = Math.max(0, finiteOr(engineer.healCooldown, 0) - dt);
    engineer.healPulse = Math.max(0, finiteOr(engineer.healPulse, 0) - dt);
    const playerInfo = nearestCombatPlayer(players, engineer);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const bossAltReady = tickBossAltAttackCooldown(engineer, dt, seedHolder);
    if (bossAltReady && playerInfo.distance < 1180) {
      summonEngineerBossMob(state, engineer, targetPlayer, seedHolder);
    }
    const healTarget = findEngineerHealTarget(state.world, engineer);
    const focusX = healTarget ? healTarget.x : targetPlayer.x;
    const focusY = healTarget ? healTarget.y : targetPlayer.y;
    const toFocusX = focusX - engineer.x;
    const toFocusY = focusY - engineer.y;
    const focusDist = Math.hypot(toFocusX, toFocusY) || 1;
    const nx = toFocusX / focusDist;
    const ny = toFocusY / focusDist;
    const tangentX = -ny * engineer.strafeSign;
    const tangentY = nx * engineer.strafeSign;

    if (healTarget) {
      const desiredDistance = 260;
      const chaseForce = bossChaseForce(engineer, focusDist > desiredDistance ? 116 : -34);
      const strafeForce = bossStrafeForce(engineer, 34);
      engineer.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
      engineer.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
      if (
        focusDist < ENGINEER_HEAL_RANGE &&
        engineer.healCooldown <= 0 &&
        !projectileBlockedBySolidBody(state.world, engineer.x, engineer.y, healTarget.x, healTarget.y, Math.max(4, healTarget.radius * 0.14))
      ) {
        const healed = Math.min(healTarget.maxHealth - healTarget.health, bossScaledDamage(engineer, ENGINEER_HEAL_RATE));
        if (healed > 0) {
          healTarget.health += healed;
          healTarget.flash = Math.max(finiteOr(healTarget.flash, 0), 0.12);
          engineer.healPulse = 0.38;
          engineer.repairBeamAngle = Math.atan2(healTarget.y - engineer.y, healTarget.x - engineer.x);
          engineer.targetKind = healTarget.kind;
          engineer.targetId = healTarget.id;
          state.events.push({ type: "mob.repaired", mobId: healTarget.id, kind: healTarget.kind, engineerId: engineer.id, tick: state.tick });
        }
        engineer.healCooldown = ENGINEER_HEAL_COOLDOWN;
      }
    } else {
      const awayX = engineer.x - targetPlayer.x;
      const awayY = engineer.y - targetPlayer.y;
      const awayDist = Math.hypot(awayX, awayY) || 1;
      const keepAway = playerInfo.distance < 520 ? 90 : -18;
      const evadeForce = bossChaseForce(engineer, keepAway);
      const strafeForce = bossStrafeForce(engineer, 22);
      engineer.vx += (awayX / awayDist) * evadeForce * dt + tangentX * strafeForce * dt;
      engineer.vy += (awayY / awayDist) * evadeForce * dt + tangentY * strafeForce * dt;
      engineer.targetKind = "";
      engineer.targetId = 0;
    }

    const time = simTime(state);
    engineer.vx += Math.sin(time * 0.58 + engineer.wobble) * 7 * dt;
    engineer.vy += Math.cos(time * 0.52 + engineer.wobble) * 7 * dt;
    engineer.vx *= Math.pow(0.72, dt);
    engineer.vy *= Math.pow(0.72, dt);
    const speed = Math.hypot(engineer.vx, engineer.vy);
    const maxSpeed = bossChaseMaxSpeed(engineer, healTarget && focusDist > 520 ? 170 : 132, nx, ny);
    if (speed > maxSpeed) {
      engineer.vx = (engineer.vx / speed) * maxSpeed;
      engineer.vy = (engineer.vy / speed) * maxSpeed;
    }
    engineer.x += engineer.vx * dt;
    engineer.y += engineer.vy * dt;
    engineer.rotation = Math.atan2(engineer.vy || ny, engineer.vx || nx) + Math.PI / 2;
  }

  function electricAttackTarget(state, tesla, player) {
    if (isCombatMobEntity(player)) {
      return playerTarget(player);
    }
    const playerDistance = Math.hypot(player.x - tesla.x, player.y - tesla.y);
    const structure = nearestStructureTarget(state.world, tesla.x, tesla.y, TESLA_LIGHTNING_RANGE * 0.95, (candidate) => candidate.health > 0);
    if (structure) {
      const structureDistance = Math.hypot(structure.x - tesla.x, structure.y - tesla.y);
      if (structureDistance < playerDistance * 1.12 && hasClearShotAtStructure(state.world, tesla.x, tesla.y, structure)) {
        return structureTarget(structure);
      }
    }
    return playerTarget(player);
  }

  function fireTeslaLightning(state, tesla, target, dist, seedHolder) {
    const leadTime = clamp(dist / 1120, 0, 0.65);
    const aim = normalize(
      target.x + finiteOr(target.vx, 0) * leadTime * 0.42 - tesla.x,
      target.y + finiteOr(target.vy, 0) * leadTime * 0.42 - tesla.y
    );
    const color = { r: 157, g: 255, b: 122 };
    const muzzleDistance = tesla.radius + 12;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: tesla.x + aim.x * muzzleDistance,
      y: tesla.y + aim.y * muzzleDistance,
      vx: aim.x * 1120 + tesla.vx * 0.08,
      vy: aim.y * 1120 + tesla.vy * 0.08,
      radius: 8,
      length: randomRange(seedHolder, 76, 104),
      color,
      life: 0.64,
      maxLife: 0.64,
      damage: tesla.isBoss ? bossScaledDamage(tesla, TESLA_LIGHTNING_DAMAGE) : 0,
      toolDisable: TESLA_TOOL_DISABLE_DURATION * (tesla.isBoss ? 1.45 : 1),
      cause: tesla.isBoss ? "Tesla boss lightning" : "Tesla lightning",
      ...playerTeamMobProjectileFields(tesla),
      lightning: true,
      targetStructureId: target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target.kind === "player" ? target.player.id : ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    tesla.shootCooldown = randomRange(seedHolder, 2.3, 3.8) * (tesla.isBoss ? 0.68 : 1);
    tesla.lightningFlash = 0.32;
    tesla.lightningWarmup = 0;
    tesla.lightningAngle = Math.atan2(aim.y, aim.x);
    tesla.rotation = tesla.lightningAngle + Math.PI / 2;
    state.events.push({ type: "mob.shot", mobId: tesla.id, kind: "tesla", projectileId: projectile.id, tick: state.tick });
  }

  function updateTesla(state, tesla, players, dt, seedHolder) {
    tesla.shootCooldown = Math.max(0, finiteOr(tesla.shootCooldown, 0) - dt);
    tesla.lightningFlash = Math.max(0, finiteOr(tesla.lightningFlash, 0) - dt);
    const bossAltReady = tickBossAltAttackCooldown(tesla, dt, seedHolder);
    const playerInfo = nearestCombatPlayer(players, tesla);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = electricAttackTarget(state, tesla, targetPlayer);
    const toTargetX = target.x - tesla.x;
    const toTargetY = target.y - tesla.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * tesla.strafeSign;
    const tangentY = nx * tesla.strafeSign;
    const desiredDistance = 520;
    const chaseForce = bossChaseForce(tesla, dist > desiredDistance ? 92 : -64);
    const strafeForce = bossStrafeForce(tesla, dist < 940 ? 72 : 20);
    if (bossAltReady && playerInfo.distance < TESLA_BOSS_EMP_PULSE_RANGE * 1.12) {
      applyEmpPulse(state, tesla.x, tesla.y, TESLA_BOSS_EMP_PULSE_RANGE, TESLA_BOSS_EMP_PULSE_DISABLE_DURATION, {
        affectMobs: true,
        affectPlayers: !isPlayerTeamMob(tesla),
        affectStructures: !isPlayerTeamMob(tesla),
        sourceMob: tesla,
        sourceKind: "mob",
        cause: "Tesla boss EMP",
        color: cloneColor(tesla.color)
      });
      resetBossAltAttackCooldown(tesla, seedHolder);
      tesla.lightningWarmup = 0;
      tesla.lightningFlash = Math.max(finiteOr(tesla.lightningFlash, 0), 0.48);
    }
    tesla.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    tesla.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    if (dist < TESLA_LIGHTNING_RANGE && hasClearShotAtCombatTarget(state.world, tesla, target)) {
      tesla.lightningWarmup = clamp(finiteOr(tesla.lightningWarmup, 0) + dt * 1.65, 0, 1);
      if (tesla.shootCooldown <= 0 && tesla.lightningWarmup >= 1) {
        fireTeslaLightning(state, tesla, target, dist, seedHolder);
      }
    } else {
      tesla.lightningWarmup = Math.max(0, finiteOr(tesla.lightningWarmup, 0) - dt * 1.8);
    }
    const time = simTime(state);
    tesla.vx += Math.sin(time * 0.82 + tesla.wobble) * 14 * dt;
    tesla.vy += Math.cos(time * 0.77 + tesla.wobble) * 14 * dt;
    tesla.vx *= Math.pow(0.7, dt);
    tesla.vy *= Math.pow(0.7, dt);
    const speed = Math.hypot(tesla.vx, tesla.vy);
    const maxSpeed = bossChaseMaxSpeed(tesla, dist > 760 ? 176 : 138, nx, ny);
    if (speed > maxSpeed) {
      tesla.vx = (tesla.vx / speed) * maxSpeed;
      tesla.vy = (tesla.vy / speed) * maxSpeed;
    }
    tesla.x += tesla.vx * dt;
    tesla.y += tesla.vy * dt;
    tesla.lightningAngle = Math.atan2(ny, nx);
    tesla.rotation = tesla.lightningAngle + Math.PI / 2;
  }

  function rocketAttackTarget(state, rocket, player) {
    if (isCombatMobEntity(player)) {
      return playerTarget(player);
    }
    const playerDistance = Math.hypot(player.x - rocket.x, player.y - rocket.y);
    const structure = nearestStructureTarget(state.world, rocket.x, rocket.y, 1180, (candidate) => candidate.health > 0);
    if (structure) {
      const structureDistance = Math.hypot(structure.x - rocket.x, structure.y - rocket.y);
      if (structureDistance < playerDistance * 1.18 && hasClearShotAtStructure(state.world, rocket.x, rocket.y, structure)) {
        return structureTarget(structure);
      }
    }
    return playerTarget(player);
  }

  function updateRocketPlayerImpact(state, rocket, target, seedHolder) {
    if (!target) {
      return;
    }
    const dx = target.x - rocket.x;
    const dy = target.y - rocket.y;
    const dist = Math.hypot(dx, dy) || 1;
    const hitDistance = finiteOr(target.radius, PLAYER_RADIUS) * 0.74 + rocket.radius * 0.88;
    if (dist > hitDistance) {
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const overlap = hitDistance - dist;
    target.x += nx * overlap * 0.68;
    target.y += ny * overlap * 0.68;
    rocket.x -= nx * overlap * 0.32;
    rocket.y -= ny * overlap * 0.32;
    if (speed > ROCKET_IMPACT_SPEED && hitPlayerWithMob(state, rocket, target, nx, ny, bossScaledDamage(rocket, ROCKET_IMPACT_DAMAGE), rocket.isBoss ? "Rocket boss ship" : "Rocket ship", 420)) {
      rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.7);
      rocket.chargeCooldown = randomRange(seedHolder, ROCKET_CHARGE_COOLDOWN_MIN, ROCKET_CHARGE_COOLDOWN_MAX);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.strafeSign *= -1;
      rocket.blastTimer = 0;
      rocket.lockTimer = 0;
      rocket.scanProgress = 0;
      rocket.volleyTimer = 0;
      rocket.volleyShots = 0;
      rocket.vx -= nx * 260;
      rocket.vy -= ny * 260;
    }
  }

  function updateRocketStructureImpact(state, rocket, seedHolder) {
    if (isPlayerTeamMob(rocket)) {
      return;
    }
    if (rocket.impactCooldown > 0) {
      return;
    }
    const speed = Math.hypot(rocket.vx, rocket.vy);
    if (speed <= ROCKET_IMPACT_SPEED * 0.82) {
      return;
    }
    for (const structure of state.world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0) {
        continue;
      }
      const dx = structure.x - rocket.x;
      const dy = structure.y - rocket.y;
      const dist = Math.hypot(dx, dy) || 1;
      const hitDistance = rocket.radius * 0.86 + structureHitRadius(structure);
      if (dist > hitDistance) {
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      rocket.x -= nx * (hitDistance - dist) * 0.3;
      rocket.y -= ny * (hitDistance - dist) * 0.3;
      rocket.impactCooldown = 0.95;
      rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.7);
      rocket.chargeCooldown = randomRange(seedHolder, ROCKET_CHARGE_COOLDOWN_MIN, ROCKET_CHARGE_COOLDOWN_MAX);
      rocket.chargeTimer = 0;
      rocket.chargePower = 0;
      rocket.strafeSign *= -1;
      rocket.blastTimer = 0;
      rocket.lockTimer = 0;
      rocket.scanProgress = 0;
      rocket.volleyTimer = 0;
      rocket.volleyShots = 0;
      rocket.vx -= nx * 240;
      rocket.vy -= ny * 240;
      damageStructure(state, structure, bossScaledDamage(rocket, STRUCTURE_ROCKET_DAMAGE + Math.max(0, speed - ROCKET_IMPACT_SPEED) * 0.035), rocket.isBoss ? "Rocket boss impact" : rocket.kind === "satellite" ? "Satellite impact" : "Rocket ship");
      break;
    }
  }

  function continueRocketFromDifferentSide(rocket) {
    rocket.strafeSign = rocket.strafeSign < 0 ? 1 : -1;
  }

  function fireRocketMissile(state, rocket, target, seedHolder) {
    const targetX = Number.isFinite(rocket.lockX) ? rocket.lockX : target.x;
    const targetY = Number.isFinite(rocket.lockY) ? rocket.lockY : target.y;
    const aim = normalize(targetX - rocket.x, targetY - rocket.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const side = rocket.volleyShots % 2 === 0 ? 1 : -1;
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 18;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: rocket.x + aim.x * muzzleDistance + normalX * side * 17,
      y: rocket.y + aim.y * muzzleDistance + normalY * side * 17,
      vx: aim.x * SATELLITE_MISSILE_SPEED + rocket.vx * 0.12,
      vy: aim.y * SATELLITE_MISSILE_SPEED + rocket.vy * 0.12,
      radius: 10,
      length: randomRange(seedHolder, 42, 54),
      color,
      life: 2.62,
      maxLife: 2.62,
      damage: bossScaledDamage(rocket, SATELLITE_MISSILE_DAMAGE),
      toolDisable: 0,
      cause: "Satellite missile",
      ...playerTeamMobProjectileFields(rocket),
      rocket: true,
      targetStructureId: target.kind === "structure" ? target.structure.id : 0,
      targetPlayerId: target.kind === "player" ? target.player.id : ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    rocket.blastTimer = 0.18;
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
    state.events.push({ type: "mob.shot", mobId: rocket.id, kind: rocket.kind || "satellite", projectileId: projectile.id, tick: state.tick });
  }

  function fireSatelliteBossSeekingMissiles(state, rocket, targetPlayer, seedHolder) {
    if (!rocket || !rocket.isBoss || !targetPlayer) {
      return;
    }
    const toTarget = normalize(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const baseAngle = Math.atan2(toTarget.y, toTarget.x);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = rocket.radius + 22;
    let firstProjectileId = 0;
    for (let i = 0; i < SATELLITE_BOSS_SEEKING_MISSILE_COUNT; i += 1) {
      const lineT = SATELLITE_BOSS_SEEKING_MISSILE_COUNT <= 1 ? 0 : i / (SATELLITE_BOSS_SEEKING_MISSILE_COUNT - 1) * 2 - 1;
      const angle = baseAngle + lineT * 0.46;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const sideX = -toTarget.y;
      const sideY = toTarget.x;
      const projectile = normalizeEntity({
        id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
        kind: "projectile",
        x: rocket.x + toTarget.x * muzzleDistance + sideX * lineT * 28,
        y: rocket.y + toTarget.y * muzzleDistance + sideY * lineT * 28,
        vx: dirX * SATELLITE_BOSS_SEEKING_MISSILE_SPEED + rocket.vx * 0.1,
        vy: dirY * SATELLITE_BOSS_SEEKING_MISSILE_SPEED + rocket.vy * 0.1,
        radius: 12,
        length: randomRange(seedHolder, 62, 80),
        color,
        life: SATELLITE_BOSS_SEEKING_MISSILE_LIFE,
        maxLife: SATELLITE_BOSS_SEEKING_MISSILE_LIFE,
        damage: bossScaledDamage(rocket, SATELLITE_MISSILE_DAMAGE * 0.82),
        toolDisable: 0,
        cause: "Satellite boss heat-seeking missile",
        ...playerTeamMobProjectileFields(rocket),
        rocket: true,
        heatSeeking: true,
        targetSpeed: SATELLITE_MISSILE_SPEED * 0.94,
        turnRate: SATELLITE_BOSS_SEEKING_MISSILE_TURN_RATE,
        targetPlayerId: targetPlayer.id || ""
      }, state.world.nextRivalProjectileId || 1, "projectile");
      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      if (!firstProjectileId) {
        firstProjectileId = projectile.id;
      }
    }
    rocket.blastTimer = 0.28;
    rocket.blastDirX = toTarget.x;
    rocket.blastDirY = toTarget.y;
    rocket.rotation = baseAngle + Math.PI / 2;
    rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.48);
    rocket.scanProgress = Math.max(0, finiteOr(rocket.scanProgress, 0) - 0.35);
    resetBossAltAttackCooldown(rocket, seedHolder);
    state.events.push({ type: "mob.shot", mobId: rocket.id, kind: "satellite", projectileId: firstProjectileId, attack: "alt", tick: state.tick });
  }

  function launchRocketBossSplitMinions(state, rocket, targetPlayer, seedHolder) {
    if (!state || !state.world || !rocket || !rocket.isBoss || !targetPlayer || !isMobBeaconReady(state.world, "rocket")) {
      return;
    }

    const aim = normalize(targetPlayer.x - rocket.x, targetPlayer.y - rocket.y);
    const sideX = -aim.y;
    const sideY = aim.x;
    const collection = mobCollectionByKind(state.world, "rocket");
    let firstMobId = 0;

    for (const side of [-1, 1]) {
      const minion = createMob(
        state.world,
        "rocket",
        rocket.x + sideX * side * rocket.radius * 0.34,
        rocket.y + sideY * side * rocket.radius * 0.34,
        seedHolder,
        {}
      );
      minion.vx = finiteOr(rocket.vx, 0) * 0.18 + sideX * side * 280 + aim.x * 105;
      minion.vy = finiteOr(rocket.vy, 0) * 0.18 + sideY * side * 280 + aim.y * 105;
      minion.rotation = Math.atan2(sideY * side + aim.y * 0.28, sideX * side + aim.x * 0.28) + Math.PI / 2;
      minion.chargeCooldown = randomRange(seedHolder, 0.42, 0.72);
      minion.recoverTimer = randomRange(seedHolder, 0.18, 0.32);
      minion.chargeTimer = 0;
      minion.chargePower = 0;
      minion.chargeDirX = aim.x;
      minion.chargeDirY = aim.y;
      minion.blastTimer = 0.24;
      minion.summonAge = 0;
      minion.summonDuration = 0.22;
      minion.summonBaseRadius = 34;
      minion.summonSpinSpeed = side * 4.8;
      minion.radius = Math.max(1, 34 * 0.2);
      collection.push(minion);
      if (!firstMobId) {
        firstMobId = minion.id;
      }
    }

    rocket.blastTimer = Math.max(finiteOr(rocket.blastTimer, 0), 0.44);
    rocket.blastDirX = aim.x;
    rocket.blastDirY = aim.y;
    rocket.recoverTimer = Math.max(finiteOr(rocket.recoverTimer, 0), 0.56);
    resetBossAltAttackCooldown(rocket, seedHolder);
    state.events.push({ type: "mob.spawned", mobId: firstMobId, kind: "rocket", sourceMobId: rocket.id, attack: "rocketBossSplit", tick: state.tick });
  }

  function updateRocketShip(state, rocket, players, dt, seedHolder) {
    const playerInfo = nearestCombatPlayer(players, rocket);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = rocketAttackTarget(state, rocket, targetPlayer);
    const toTargetX = target.x - rocket.x;
    const toTargetY = target.y - rocket.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rocket.strafeSign;
    const tangentY = nx * rocket.strafeSign;
    const bossAltReady = tickBossAltAttackCooldown(rocket, dt, seedHolder);

    if (rocket.chargeTimer > 0) {
      rocket.chargeTimer = Math.max(0, rocket.chargeTimer - dt);
      const progress = 1 - clamp(rocket.chargeTimer / ROCKET_CHARGE_DURATION, 0, 1);
      rocket.chargePower = progress;
      rocket.vx += rocket.chargeDirX * (980 + progress * 2600) * dt;
      rocket.vy += rocket.chargeDirY * (980 + progress * 2600) * dt;
      rocket.vx *= Math.pow(0.985, dt);
      rocket.vy *= Math.pow(0.985, dt);
      if (rocket.chargeTimer <= 0) {
        rocket.recoverTimer = randomRange(seedHolder, 1.05, 1.42);
        rocket.chargeCooldown = randomRange(seedHolder, ROCKET_CHARGE_COOLDOWN_MIN, ROCKET_CHARGE_COOLDOWN_MAX);
        rocket.chargePower = 0;
        continueRocketFromDifferentSide(rocket);
      }
    } else if (rocket.recoverTimer > 0) {
      rocket.recoverTimer = Math.max(0, rocket.recoverTimer - dt);
      const recoverForce = bossChaseForce(rocket, 88);
      const recoverStrafeForce = bossStrafeForce(rocket, 64);
      rocket.vx += (-nx * recoverForce + tangentX * recoverStrafeForce) * dt;
      rocket.vy += (-ny * recoverForce + tangentY * recoverStrafeForce) * dt;
      rocket.vx *= Math.pow(0.76, dt);
      rocket.vy *= Math.pow(0.76, dt);
    } else if (bossAltReady && rocket.isBoss && playerInfo.distance < 1280) {
      launchRocketBossSplitMinions(state, rocket, targetPlayer, seedHolder);
      rocket.vx += -nx * 120 * dt;
      rocket.vy += -ny * 120 * dt;
    } else {
      rocket.chargeCooldown = Math.max(0, finiteOr(rocket.chargeCooldown, 0) - dt);
      const rangeForce = bossChaseForce(rocket, dist > 820 ? 180 : dist < 540 ? -176 : 24);
      const strafeForce = bossStrafeForce(rocket, 92 + Math.sin(simTime(state) * 1.0 + rocket.wobble) * 16);
      rocket.vx += (nx * rangeForce + tangentX * strafeForce) * dt;
      rocket.vy += (ny * rangeForce + tangentY * strafeForce) * dt;
      rocket.vx *= Math.pow(0.72, dt);
      rocket.vy *= Math.pow(0.72, dt);
      const canCharge = dist > 360 && dist < 1220 && hasClearShotAtCombatTarget(state.world, rocket, target);
      if (rocket.chargeCooldown <= 0 && canCharge) {
        const leadTime = clamp(dist / ROCKET_CHARGE_MAX_SPEED, 0.15, 0.7);
        rocket.lockX = target.x + finiteOr(target.vx, 0) * leadTime * 0.72;
        rocket.lockY = target.y + finiteOr(target.vy, 0) * leadTime * 0.72;
        const aim = normalize(rocket.lockX - rocket.x, rocket.lockY - rocket.y);
        rocket.chargeDirX = aim.x;
        rocket.chargeDirY = aim.y;
        rocket.chargeTimer = ROCKET_CHARGE_DURATION * (rocket.isBoss ? 1.18 : 1);
        rocket.chargePower = 0;
        rocket.blastTimer = 0.46;
      }
    }

    rocket.blastTimer = Math.max(0, finiteOr(rocket.blastTimer, 0) - dt);
    const time = simTime(state);
    rocket.vx += Math.sin(time * 0.62 + rocket.wobble) * 5 * dt;
    rocket.vy += Math.cos(time * 0.58 + rocket.wobble) * 5 * dt;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const chargeProgress = clamp(rocket.chargePower || 0, 0, 1);
    const baseMaxSpeed = rocket.chargeTimer > 0 ? 330 + chargeProgress * (ROCKET_CHARGE_MAX_SPEED - 330) : rocket.recoverTimer > 0 ? 520 : 245;
    const maxSpeed = bossChaseMaxSpeed(
      rocket,
      baseMaxSpeed,
      rocket.chargeTimer > 0 ? rocket.chargeDirX : nx,
      rocket.chargeTimer > 0 ? rocket.chargeDirY : ny
    );
    if (speed > maxSpeed) {
      rocket.vx = (rocket.vx / speed) * maxSpeed;
      rocket.vy = (rocket.vy / speed) * maxSpeed;
    }
    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;
    updateRocketPlayerImpact(state, rocket, targetPlayer, seedHolder);
    updateRocketStructureImpact(state, rocket, seedHolder);
    const facingX = rocket.chargeTimer > 0 ? rocket.chargeDirX : rocket.vx;
    const facingY = rocket.chargeTimer > 0 ? rocket.chargeDirY : rocket.vy;
    rocket.rotation = Math.atan2(facingY || targetPlayer.y - rocket.y, facingX || targetPlayer.x - rocket.x) + Math.PI / 2;
  }

  function updateSatellite(state, rocket, players, dt, seedHolder) {
    const playerInfo = nearestCombatPlayer(players, rocket);
    const targetPlayer = playerInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = rocketAttackTarget(state, rocket, targetPlayer);
    const toTargetX = target.x - rocket.x;
    const toTargetY = target.y - rocket.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * rocket.strafeSign;
    const tangentY = nx * rocket.strafeSign;
    const targetAngle = Math.atan2(ny, nx);
    const turn = shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle);
    rocket.scannerAngle = (rocket.scannerAngle || targetAngle) + clamp(turn, -2.35 * dt, 2.35 * dt);
    const bossAltReady = tickBossAltAttackCooldown(rocket, dt, seedHolder);

    if (bossAltReady && rocket.isBoss && playerInfo.distance < 1280) {
      fireSatelliteBossSeekingMissiles(state, rocket, targetPlayer, seedHolder);
    } else if (rocket.volleyShots > 0) {
      rocket.volleyTimer = Math.max(0, finiteOr(rocket.volleyTimer, 0) - dt);
      const volleyRetreatForce = bossChaseForce(rocket, 42);
      const volleyStrafeForce = bossStrafeForce(rocket, 24);
      rocket.vx += -nx * volleyRetreatForce * dt + tangentX * volleyStrafeForce * dt;
      rocket.vy += -ny * volleyRetreatForce * dt + tangentY * volleyStrafeForce * dt;
      if (rocket.volleyTimer <= 0) {
        fireRocketMissile(state, rocket, target, seedHolder);
        rocket.volleyShots -= 1;
        rocket.volleyTimer = rocket.volleyShots > 0 ? SATELLITE_VOLLEY_SPACING : 0;
        if (rocket.volleyShots <= 0) {
          rocket.recoverTimer = randomRange(seedHolder, 0.86, 1.18);
          rocket.scanProgress = 0;
        }
      }
    } else if (rocket.lockTimer > 0) {
      rocket.lockTimer = Math.max(0, finiteOr(rocket.lockTimer, 0) - dt);
      rocket.vx *= Math.pow(0.16, dt);
      rocket.vy *= Math.pow(0.16, dt);
      const lockStrafeForce = bossStrafeForce(rocket, 18);
      const lockRetreatForce = bossChaseForce(rocket, 18);
      rocket.vx += tangentX * lockStrafeForce * dt - nx * lockRetreatForce * dt;
      rocket.vy += tangentY * lockStrafeForce * dt - ny * lockRetreatForce * dt;
      if (rocket.lockTimer <= 0) {
        rocket.volleyShots = SATELLITE_VOLLEY_COUNT;
        rocket.volleyTimer = 0.01;
      }
    } else if (rocket.recoverTimer > 0) {
      rocket.recoverTimer = Math.max(0, finiteOr(rocket.recoverTimer, 0) - dt);
      rocket.scanProgress = Math.max(0, finiteOr(rocket.scanProgress, 0) - dt * 1.1);
      const recoverForce = bossChaseForce(rocket, 72);
      const recoverStrafeForce = bossStrafeForce(rocket, 28);
      rocket.vx += -nx * recoverForce * dt + tangentX * recoverStrafeForce * dt;
      rocket.vy += -ny * recoverForce * dt + tangentY * recoverStrafeForce * dt;
      rocket.vx *= Math.pow(0.52, dt);
      rocket.vy *= Math.pow(0.52, dt);
    } else {
      const scanTurn = Math.abs(shortestAngleDelta(rocket.scannerAngle || targetAngle, targetAngle));
      const inRange = dist > 420 && dist < 1040;
      const scanning = inRange && scanTurn < 0.34 && hasClearShotAtCombatTarget(state.world, rocket, target);
      rocket.scanProgress = clamp(finiteOr(rocket.scanProgress, 0) + (scanning ? dt * 0.86 : -dt * 1.05), 0, 1);
      const rangeForce = bossChaseForce(rocket, dist > 760 ? 132 : dist < 540 ? -128 : 12);
      const strafeForce = bossStrafeForce(rocket, 76 + rocket.scanProgress * 36);
      rocket.vx += nx * rangeForce * dt + tangentX * strafeForce * dt;
      rocket.vy += ny * rangeForce * dt + tangentY * strafeForce * dt;
      if (rocket.scanProgress >= 1) {
        rocket.lockX = target.x + finiteOr(target.vx, 0) * 0.46;
        rocket.lockY = target.y + finiteOr(target.vy, 0) * 0.46;
        rocket.lockTimer = SATELLITE_LOCK_DURATION;
        rocket.scanProgress = 1;
      }
    }

    const time = simTime(state);
    rocket.vx += Math.sin(time * 0.48 + rocket.wobble) * 6 * dt;
    rocket.vy += Math.cos(time * 0.44 + rocket.wobble) * 6 * dt;
    rocket.vx *= Math.pow(0.7, dt);
    rocket.vy *= Math.pow(0.7, dt);
    const speed = Math.hypot(rocket.vx, rocket.vy);
    const maxSpeed = bossChaseMaxSpeed(rocket, rocket.volleyShots > 0 || rocket.lockTimer > 0 ? 118 : rocket.recoverTimer > 0 ? 152 : 194, nx, ny);
    if (speed > maxSpeed) {
      rocket.vx = (rocket.vx / speed) * maxSpeed;
      rocket.vy = (rocket.vy / speed) * maxSpeed;
    }
    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;
    updateRocketPlayerImpact(state, rocket, targetPlayer, seedHolder);
    updateRocketStructureImpact(state, rocket, seedHolder);
    const aimX = Number.isFinite(rocket.lockX) ? rocket.lockX : target.x;
    const aimY = Number.isFinite(rocket.lockY) ? rocket.lockY : target.y;
    const aimAngle = rocket.volleyShots > 0 || rocket.lockTimer > 0 ? Math.atan2(aimY - rocket.y, aimX - rocket.x) : rocket.scannerAngle || targetAngle;
    rocket.rotation = aimAngle + Math.PI / 2;
  }

  function updateRocketMob(state, rocket, players, dt, seedHolder) {
    rocket.impactCooldown = Math.max(0, finiteOr(rocket.impactCooldown, 0) - dt);
    rocket.blastTimer = Math.max(0, finiteOr(rocket.blastTimer, 0) - dt);
    if (rocket.kind === "satellite") {
      updateSatellite(state, rocket, players, dt, seedHolder);
    } else {
      updateRocketShip(state, rocket, players, dt, seedHolder);
    }
  }

  function fireFighterGuns(state, fighter, target, dist, seedHolder) {
    const leadTime = clamp(dist / RIVAL_PROJECTILE_SPEED, 0, 1.15);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.62;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.62;
    const aim = normalize(targetX - fighter.x, targetY - fighter.y);
    const normalX = -aim.y;
    const normalY = aim.x;
    const color = shadeColor(fighter.color, 46);
    for (const side of (fighter.isBoss ? [-1.45, 0, 1.45] : [-1, 1])) {
      const projectile = normalizeEntity({
        id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
        kind: "projectile",
        x: fighter.x + aim.x * (fighter.radius + 16) + normalX * side * 19,
        y: fighter.y + aim.y * (fighter.radius + 16) + normalY * side * 19,
        vx: aim.x * (RIVAL_PROJECTILE_SPEED + 60) + fighter.vx * 0.14,
        vy: aim.y * (RIVAL_PROJECTILE_SPEED + 60) + fighter.vy * 0.14,
        radius: 5,
        length: randomRange(seedHolder, 38, 50),
        color,
        life: 2.18,
        maxLife: 2.18,
        damage: bossScaledDamage(fighter, 9),
        toolDisable: 0,
        cause: fighter.isBoss ? "Fighter boss cannon" : "Fighter cannon",
        ...playerTeamMobProjectileFields(fighter),
        targetPlayerId: target.player ? target.player.id : ""
      }, state.world.nextRivalProjectileId || 1, "projectile");
      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      state.events.push({ type: "mob.shot", mobId: fighter.id, kind: "fighter", projectileId: projectile.id, tick: state.tick });
    }
    fighter.shootCooldown = randomRange(seedHolder, 2.2, 3.4) * (fighter.isBoss ? 0.68 : 1);
    fighter.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
  }

  function fireFighterBossMachineGunShot(state, fighter, target, dist, seedHolder) {
    const leadTime = clamp(dist / (RIVAL_PROJECTILE_SPEED + 180), 0, 0.9);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.58;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.58;
    const baseAngle = Math.atan2(targetY - fighter.y, targetX - fighter.x);
    const aimAngle = baseAngle + randomRange(seedHolder, -0.075, 0.075);
    const aimX = Math.cos(aimAngle);
    const aimY = Math.sin(aimAngle);
    const normalX = -aimY;
    const normalY = aimX;
    const side = Math.floor(finiteOr(fighter.machineGunShots, 0)) % 2 === 0 ? -1 : 1;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: fighter.x + aimX * (fighter.radius + 18) + normalX * side * 18,
      y: fighter.y + aimY * (fighter.radius + 18) + normalY * side * 18,
      vx: aimX * (RIVAL_PROJECTILE_SPEED + randomRange(seedHolder, 150, 235)) + fighter.vx * 0.12,
      vy: aimY * (RIVAL_PROJECTILE_SPEED + randomRange(seedHolder, 150, 235)) + fighter.vy * 0.12,
      radius: 4,
      length: randomRange(seedHolder, 30, 40),
      color: shadeColor(fighter.color, 64),
      life: 1.7,
      maxLife: 1.7,
      damage: bossScaledDamage(fighter, 5.5),
      toolDisable: 0,
      cause: "Fighter boss machine gun",
      ...playerTeamMobProjectileFields(fighter),
      targetPlayerId: target.player ? target.player.id : ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    state.events.push({ type: "mob.shot", mobId: fighter.id, kind: "fighter", projectileId: projectile.id, attack: "machine-gun", tick: state.tick });
    fighter.rotation = aimAngle + Math.PI / 2;
  }

  function updateFighter(state, fighter, players, dt, seedHolder) {
    fighter.shootCooldown = Math.max(0, finiteOr(fighter.shootCooldown, 0) - dt);
    fighter.machineGunTimer = Math.max(0, finiteOr(fighter.machineGunTimer, 0) - dt);
    if (fighter.shieldActive > 0) {
      const before = fighter.shieldActive;
      fighter.shieldActive = Math.max(0, fighter.shieldActive - dt);
      fighter.shieldCharge = Math.max(0, fighter.shieldCharge - Math.min(dt, before));
      fighter.shieldRecharge = FIGHTER_SHIELD_CYCLE;
    } else if (fighter.shieldCharge < FIGHTER_SHIELD_MAX_CHARGE) {
      fighter.shieldRecharge = Math.max(0, finiteOr(fighter.shieldRecharge, 0) - dt);
      if (fighter.shieldRecharge <= 0) {
        fighter.shieldCharge = FIGHTER_SHIELD_MAX_CHARGE;
      }
    }

    const targetInfo = nearestCombatPlayer(players, fighter);
    const targetPlayer = targetInfo.player;
    if (!targetPlayer) {
      return;
    }
    const target = playerTarget(targetPlayer);
    const toPlayerX = target.x - fighter.x;
    const toPlayerY = target.y - fighter.y;
    const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
    const nx = toPlayerX / dist;
    const ny = toPlayerY / dist;
    const tangentX = -ny * fighter.strafeSign;
    const tangentY = nx * fighter.strafeSign;
    const chaseForce = bossChaseForce(fighter, dist > 560 ? 110 : -62);
    const strafeForce = bossStrafeForce(fighter, dist < 1050 ? 78 : 24);
    fighter.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    fighter.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    const bossAltReady = tickBossAltAttackCooldown(fighter, dt, seedHolder);
    const clearShot = hasClearShotAtCombatTarget(state.world, fighter, target);
    if (fighter.isBoss && finiteOr(fighter.machineGunShots, 0) > 0) {
      if (fighter.machineGunTimer <= 0 && dist < FIGHTER_SHOOT_RANGE * 1.32 && clearShot) {
        fireFighterBossMachineGunShot(state, fighter, target, dist, seedHolder);
        fighter.machineGunShots = Math.max(0, Math.floor(finiteOr(fighter.machineGunShots, 0)) - 1);
        fighter.machineGunTimer = fighter.machineGunShots > 0 ? 0.065 : 0;
      } else if (!clearShot || dist >= FIGHTER_SHOOT_RANGE * 1.48) {
        fighter.machineGunShots = 0;
      }
    } else if (bossAltReady && fighter.isBoss && dist < FIGHTER_SHOOT_RANGE * 1.25 && clearShot) {
      fighter.machineGunShots = 16;
      fighter.machineGunTimer = 0;
      fighter.shootCooldown = Math.max(fighter.shootCooldown, 1.2);
      resetBossAltAttackCooldown(fighter, seedHolder);
    } else if (dist < FIGHTER_SHOOT_RANGE && fighter.shootCooldown <= 0 && clearShot) {
      fireFighterGuns(state, fighter, target, dist, seedHolder);
    }
    const time = simTime(state);
    fighter.vx += Math.sin(time * 0.52 + fighter.wobble) * 9 * dt;
    fighter.vy += Math.cos(time * 0.47 + fighter.wobble) * 9 * dt;
    fighter.vx *= Math.pow(0.72, dt);
    fighter.vy *= Math.pow(0.72, dt);
    const speed = Math.hypot(fighter.vx, fighter.vy);
    const maxSpeed = bossChaseMaxSpeed(fighter, dist > 820 ? 210 : 162, nx, ny);
    if (speed > maxSpeed) {
      fighter.vx = (fighter.vx / speed) * maxSpeed;
      fighter.vy = (fighter.vy / speed) * maxSpeed;
    }
    fighter.x += fighter.vx * dt;
    fighter.y += fighter.vy * dt;
    fighter.rotation = Math.atan2(ny, nx) + Math.PI / 2;
  }

  function steerHeatSeekingProjectile(state, projectile, players, dt) {
    if (!projectile || !projectile.heatSeeking || !players || !players.length) {
      return;
    }
    const targetInfo = nearestCombatPlayer(players, projectile);
    const target = targetInfo.player;
    if (!target) {
      return;
    }
    const currentSpeed = Math.max(80, Math.hypot(projectile.vx, projectile.vy) || finiteOr(projectile.targetSpeed, SATELLITE_MISSILE_SPEED));
    const targetSpeed = Math.max(120, finiteOr(projectile.targetSpeed, SATELLITE_MISSILE_SPEED));
    const leadTime = clamp(Math.hypot(target.x - projectile.x, target.y - projectile.y) / targetSpeed, 0, 0.58);
    const desiredAngle = Math.atan2(
      target.y + finiteOr(target.vy, 0) * leadTime * 0.48 - projectile.y,
      target.x + finiteOr(target.vx, 0) * leadTime * 0.48 - projectile.x
    );
    const currentAngle = Math.atan2(projectile.vy, projectile.vx);
    const turnRate = Math.max(0.4, finiteOr(projectile.turnRate, SATELLITE_BOSS_SEEKING_MISSILE_TURN_RATE));
    const angle = currentAngle + clamp(shortestAngleDelta(currentAngle, desiredAngle), -turnRate * dt, turnRate * dt);
    const nextSpeed = currentSpeed + (targetSpeed - currentSpeed) * (1 - Math.pow(0.04, dt));
    projectile.vx = Math.cos(angle) * nextSpeed;
    projectile.vy = Math.sin(angle) * nextSpeed;
  }

  function updateRivalProjectiles(state, dt, options) {
    const world = state.world;
    const players = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    for (let i = world.rivalProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = world.rivalProjectiles[i];
      const sourcePlayerId = String(projectile.sourcePlayerId || "");
      const sourceStructureId = String(projectile.sourceStructureId || "");
      const sourceMobId = Math.max(0, Math.floor(finiteOr(projectile.sourceMobId, 0)));
      const playerTeamMobProjectile = projectile.team === "player" && sourceMobId > 0;
      const ownerPlayerId = String(projectile.ownerPlayerId || sourcePlayerId || "");
      const friendlyProjectile = Boolean(sourcePlayerId || sourceStructureId || playerTeamMobProjectile);
      const previousX = projectile.x;
      const previousY = projectile.y;
      projectile.life = finiteOr(projectile.life, 0) - dt;
      steerHeatSeekingProjectile(state, projectile, playerTeamMobProjectile ? familiarHostileTargets(world, null) : players, dt);
      projectile.x += finiteOr(projectile.vx, 0) * dt;
      projectile.y += finiteOr(projectile.vy, 0) * dt;

      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const dirX = projectile.vx / speed;
      const dirY = projectile.vy / speed;
      const travel = Math.hypot(projectile.x - previousX, projectile.y - previousY);
      const sweptLength = Math.max(finiteOr(projectile.length, 40), travel + projectile.radius);
      const tailX = projectile.x - dirX * sweptLength;
      const tailY = projectile.y - dirY * sweptLength;
      const hitRadius = projectile.radius * (projectile.rocket ? 1.65 : 1);
      const blocker = projectileBlockedBySolidBody(world, tailX, tailY, projectile.x, projectile.y, projectile.radius, projectile.ignoredBodyId);
      if (blocker) {
        world.rivalProjectiles.splice(i, 1);
        state.events.push({
          type: "projectile.blocked",
          projectileId: projectile.id,
          bodyId: blocker.id,
          x: projectile.x,
          y: projectile.y,
          color: cloneColor(projectile.color),
          tick: state.tick
        });
        continue;
      }

      if (tradeVesselHitBySegment(state, tailX, tailY, projectile.x, projectile.y, hitRadius, finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE), projectile.cause || "projectile")) {
        world.rivalProjectiles.splice(i, 1);
        continue;
      }

      if (!friendlyProjectile) {
        const shieldBlocker = findProjectileShieldBlocker(world, tailX, tailY, projectile.x, projectile.y, projectile.radius, projectile);
        if (shieldBlocker && activateShieldGeneratorBlock(state, shieldBlocker.structure, shieldBlocker.body, shieldBlocker.cost, shieldBlocker.x, shieldBlocker.y, projectile)) {
          world.rivalProjectiles.splice(i, 1);
          continue;
        }
        const spacecraftHit = nearestSpacecraftComponentOnSegment(world, tailX, tailY, projectile.x, projectile.y, hitRadius);
        if (spacecraftHit) {
          const damage = projectile.lightning
            ? TESLA_LIGHTNING_DAMAGE
            : projectile.rocket ? STRUCTURE_ROCKET_DAMAGE : finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE) * 0.82;
          if (projectile.lightning) {
            spacecraftHit.component.disabledTimer = Math.max(finiteOr(spacecraftHit.component.disabledTimer, 0), finiteOr(projectile.toolDisable, TESLA_TOOL_DISABLE_DURATION));
          }
          damageSpacecraftComponent(state, spacecraftHit.craft, spacecraftHit.component, damage, projectile.cause || "mob projectile");
          world.rivalProjectiles.splice(i, 1);
          continue;
        }
      }

      if (friendlyProjectile) {
        const hitMobIds = Array.isArray(projectile.hitMobIds) ? projectile.hitMobIds : (projectile.hitMobIds = []);
        let hitMob = false;
        for (const mob of allCombatMobs(world)) {
          if (!mob || mob.health <= 0 || mob.hitCooldown > 0 || isPlayerTeamMob(mob)) {
            continue;
          }
          if (playerTeamMobProjectile && mob.id === sourceMobId) {
            continue;
          }
          const hitMobId = (mob.kind || "mob") + ":" + mob.id;
          if (hitMobIds.includes(hitMobId)) {
            continue;
          }
          const mobDist = distanceToSegment(mob.x, mob.y, tailX, tailY, projectile.x, projectile.y);
          if (mobDist >= mob.radius + hitRadius) {
            continue;
          }

          const knockback = finiteOr(projectile.knockback, playerTeamMobProjectile ? 125 : PLAYER_WEAPON_DEFAULTS.knockback);
          const damage = Math.max(0, finiteOr(projectile.damage, playerTeamMobProjectile ? RIVAL_PROJECTILE_DAMAGE : PLAYER_WEAPON_DEFAULTS.damage));
          const toolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));
          knockMob(mob, dirX, dirY, knockback);
          if (damage > 0) {
            damageMob(state, mob, damage, projectile.cause || "player-laser", ownerPlayerId);
          }
          if (toolDisable > 0) {
            disableMob(mob, toolDisable);
          }
          hitMobIds.push(hitMobId);
          state.events.push({
            type: sourcePlayerId ? "player.projectileHitMob" : sourceStructureId ? "structure.projectileHitMob" : "mob.projectileHitMob",
            playerId: sourcePlayerId,
            structureId: sourceStructureId,
            sourceMobId,
            mobId: mob.id,
            kind: mob.kind || "mob",
            projectileId: projectile.id,
            x: projectile.x,
            y: projectile.y,
            color: cloneColor(projectile.color),
            tick: state.tick
          });
          if (!projectile.piercesMobs) {
            world.rivalProjectiles.splice(i, 1);
            hitMob = true;
          }
          break;
        }
        if (hitMob) {
          continue;
        }
      }

      if (!friendlyProjectile) {
        let hitFamiliar = false;
        for (const mob of allCombatMobs(world)) {
          if (!mob || mob.health <= 0 || !isPlayerTeamMob(mob)) {
            continue;
          }
          const mobDist = distanceToSegment(mob.x, mob.y, tailX, tailY, projectile.x, projectile.y);
          if (mobDist >= finiteOr(mob.radius, 28) + hitRadius) {
            continue;
          }
          knockMob(mob, dirX, dirY, 125);
          damageMob(state, mob, finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE), projectile.cause || "mob projectile");
          world.rivalProjectiles.splice(i, 1);
          hitFamiliar = true;
          break;
        }
        if (hitFamiliar) {
          continue;
        }
      }

      let hitStructure = false;
      if (!sourceStructureId && !playerTeamMobProjectile && (projectile.rocket || projectile.lightning)) {
        for (const structure of world.structures || []) {
          if (!structure || finiteOr(structure.health, 0) <= 0) {
            continue;
          }
          const structureDist = distanceToSegment(structure.x, structure.y, tailX, tailY, projectile.x, projectile.y);
          if (structureDist >= structureHitRadius(structure) + hitRadius * 0.72) {
            continue;
          }
          if (projectile.lightning) {
            const lightningDamage = Math.max(0, finiteOr(projectile.damage, 0));
            if (lightningDamage > 0) {
              damageStructure(state, structure, lightningDamage, projectile.cause || "Tesla lightning");
            }
            disableStructure(state, structure, STRUCTURE_TESLA_DISABLE_DURATION, projectile.cause || "Tesla lightning");
          } else {
            damageStructure(state, structure, STRUCTURE_ROCKET_DAMAGE, projectile.cause || "Satellite missile");
          }
          world.rivalProjectiles.splice(i, 1);
          hitStructure = true;
          break;
        }
      }
      if (hitStructure) {
        continue;
      }

      let hitPlayer = false;
      for (const target of players) {
        if (sourcePlayerId || sourceStructureId || playerTeamMobProjectile) {
          if (!canPlayerOwnedDamagePlayer(state, options, ownerPlayerId, target.id)) {
            continue;
          }
        }
        const dist = distanceToPlayerHurtboxSegment(target, tailX, tailY, projectile.x, projectile.y);
        if (dist >= target.radius * PLAYER_PROJECTILE_HURTBOX_SCALE + projectile.radius) {
          continue;
        }
        const rawProjectileDamage = Math.max(0, finiteOr(projectile.damage, RIVAL_PROJECTILE_DAMAGE));
        const projectileDamage = ownerPlayerId || playerTeamMobProjectile
          ? rawProjectileDamage
          : difficultyMobDamage(state, rawProjectileDamage);
        const projectileToolDisable = Math.max(0, finiteOr(projectile.toolDisable, 0));
        const canDamageTarget = target.hitCooldown <= 0 && projectileDamage > 0;
        const damagedTarget = canDamageTarget && damagePlayer(state, target, projectileDamage, projectile.cause || "Alienoid laser");
        const disabledTarget = projectileToolDisable > 0;
        if (damagedTarget || disabledTarget) {
          const impulse = ownerPlayerId ? finiteOr(projectile.knockback, PLAYER_WEAPON_DEFAULTS.knockback) : 190;
          target.vx += dirX * impulse + finiteOr(projectile.vx, 0) * 0.34;
          target.vy += dirY * impulse + finiteOr(projectile.vy, 0) * 0.34;
          if (damagedTarget) {
            target.hitCooldown = Math.max(finiteOr(target.hitCooldown, 0), 0.72);
          }
          if (disabledTarget) {
            applyPlayerStatusEffect(target, "disabled", projectileToolDisable);
          }
          state.events.push({
            type: ownerPlayerId ? "player.hitByPlayerProjectile" : "player.hitByMobProjectile",
            playerId: target.id,
            sourcePlayerId: ownerPlayerId,
            projectileId: projectile.id,
            x: projectile.x,
            y: projectile.y,
            color: cloneColor(projectile.color),
            tick: state.tick
          });
        }
        world.rivalProjectiles.splice(i, 1);
        hitPlayer = true;
        break;
      }
      if (!hitPlayer && projectile.life <= 0) {
        world.rivalProjectiles.splice(i, 1);
      }
    }
  }

  function hasClearShotAtMob(world, x, y, mob, ignoredBodyId) {
    return !projectileBlockedBySolidBody(world, x, y, mob.x, mob.y, Math.max(4, mob.radius * 0.2), ignoredBodyId);
  }

  function findTurretTarget(stateOrWorld, turret) {
    const state = stateOrWorld && stateOrWorld.world ? stateOrWorld : null;
    const world = state ? state.world : stateOrWorld;
    if (isSurvivalCampStructure(state || { world, gameMode: world && world.gameMode }, turret)) {
      return findCampStructurePlayerTarget(state, world, turret, TURRET_RANGE);
    }

    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      const distance = Math.hypot(mob.x - turret.x, mob.y - turret.y);
      if (distance > TURRET_RANGE || distance >= bestDistance) {
        continue;
      }
      const normalX = Math.cos(turret.angle);
      const normalY = Math.sin(turret.angle);
      const aboveSurface = (mob.x - turret.x) * normalX + (mob.y - turret.y) * normalY;
      if (aboveSurface < -mob.radius * 0.2 || !hasClearShotAtMob(world, turret.x, turret.y, mob, turret.bodyId)) {
        continue;
      }
      best = mob;
      bestDistance = distance;
    }
    return best;
  }

  function survivalCampStructureIsAggro(structure) {
    return Boolean(structure && finiteOr(structure.survivalCampAggroTimer, 0) > 0);
  }

  function campStructureCanSeePlayer(world, structure, player) {
    if (!structure || !player) {
      return false;
    }
    const normalX = Math.cos(finiteOr(structure.angle, 0));
    const normalY = Math.sin(finiteOr(structure.angle, 0));
    const playerRadius = finiteOr(player.radius, PLAYER_RADIUS);
    const aboveSurface = (player.x - structure.x) * normalX + (player.y - structure.y) * normalY;
    if (aboveSurface < -playerRadius * 0.2) {
      return false;
    }
    return !projectileBlockedBySolidBody(world, structure.x, structure.y, player.x, player.y, Math.max(4, playerRadius * 0.18), structure.bodyId);
  }

  function findCampStructurePlayerTarget(state, world, structure, maxRange) {
    if (!state || !survivalCampStructureIsAggro(structure)) {
      return null;
    }
    const preferredTargetId = String(structure.survivalTargetPlayerId || "");
    if (!preferredTargetId) {
      return null;
    }
    let best = null;
    let bestDistance = Infinity;
    for (const target of Object.values(state.players || {})) {
      if (!target || finiteOr(target.health, 0) <= 0 || target.spacecraftInterior) {
        continue;
      }
      const targetId = String(target.id || "");
      const distance = Math.hypot(target.x - structure.x, target.y - structure.y);
      const scoreDistance = distance * (preferredTargetId && targetId === preferredTargetId ? 0.72 : 1);
      if (distance > maxRange || scoreDistance >= bestDistance || !campStructureCanSeePlayer(world, structure, target)) {
        continue;
      }
      best = target;
      bestDistance = scoreDistance;
    }
    return best;
  }

  function fireTurretLaser(state, turret, target, dist) {
    if (isSurvivalCampStructure(state, turret)) {
      fireCampTurretLaser(state, turret, target, dist);
      return;
    }

    const leadTime = clamp(dist / TURRET_LASER_SPEED, 0, 1.1);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.52;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * TURRET_LASER_SPEED,
      vy: aim.y * TURRET_LASER_SPEED,
      radius: 4,
      length: 38,
      color,
      life: 1.15,
      maxLife: 1.15,
      damage: TURRET_LASER_DAMAGE,
      knockback: TURRET_LASER_KNOCKBACK,
      cause: "Turret laser",
      sourceStructureId: String(turret.id || ""),
      ownerPlayerId: String(turret.ownerPlayerId || ""),
      ignoredBodyId: turret.bodyId,
      hitMobIds: []
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    turret.shootCooldown = TURRET_SHOOT_COOLDOWN;
    state.events.push({ type: "structure.shot", structureId: turret.id, projectileId: projectile.id, tick: state.tick });
  }

  function fireCampTurretLaser(state, turret, target, dist) {
    const leadTime = clamp(dist / TURRET_LASER_SPEED, 0, 1.1);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.52;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.52;
    const aim = normalize(targetX - turret.x, targetY - turret.y);
    const color = { r: 255, g: 115, b: 173 };
    const muzzleDistance = 42;
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: turret.x + aim.x * muzzleDistance,
      y: turret.y + aim.y * muzzleDistance,
      vx: aim.x * TURRET_LASER_SPEED,
      vy: aim.y * TURRET_LASER_SPEED,
      radius: 4,
      length: 38,
      color,
      life: 1.15,
      maxLife: 1.15,
      damage: TURRET_LASER_DAMAGE,
      knockback: TURRET_LASER_KNOCKBACK,
      cause: "Camp turret",
      sourceStructureId: String(turret.id || ""),
      ownerPlayerId: "",
      ignoredBodyId: turret.bodyId,
      targetPlayerId: String(target.id || ""),
      hitMobIds: []
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    turret.shootCooldown = TURRET_SHOOT_COOLDOWN;
    state.events.push({ type: "structure.shot", structureId: turret.id, projectileId: projectile.id, tick: state.tick });
  }

  function landedJetDirectionForBody(state, inputs, bodyId, dt) {
    let forward = false;
    let reverse = false;
    for (const [playerId, player] of Object.entries(state.players || {})) {
      if (!player || player.health <= 0 || !player.landed || player.landed.bridgeId || player.landed.bodyId !== bodyId) {
        continue;
      }
      const input = sanitizeInput(inputs[playerId], player, { dt, requireEnergy: true, allowCommittedToolMode: true });
      forward = forward || input.buttons.up;
      reverse = reverse || input.buttons.down;
    }
    return forward === reverse ? 0 : (forward ? -1 : 1);
  }

  function updateJet(state, structure, inputs, dt) {
    const world = state.world;
    const body = bodyById(world, structure.bodyId);
    const direction = body ? landedJetDirectionForBody(state, inputs, body.id, dt) : 0;
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.6, 0, 1);

    if (!body || !isStructureHostBody(body) || !direction) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      return;
    }

    if (!spendBodyEnergy(world, body, JET_ENERGY_DRAIN * dt)) {
      structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
      return;
    }

    const nx = Math.cos(structure.angle);
    const ny = Math.sin(structure.angle);
    const massDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(body.mass, 1) / 150), 0.42), 0.08, 1.1);
    const thrust = JET_THRUST * massDamping * clamp(structure.deploy, 0.2, 1);
    applyBodyVelocityChangeAtPoint(
      body,
      nx * direction * thrust * dt,
      ny * direction * thrust * dt,
      structure.x,
      structure.y,
      1
    );
    structure.thrustAmount += (1 - finiteOr(structure.thrustAmount, 0)) * (1 - Math.pow(0.02, dt));
    structure.thrustDirection = direction;
  }

  function canAccumulatorPullParticle(particle) {
    return Boolean(particle && particle.tier && particle.tier.name === "particle");
  }

  function updateAccumulator(state, structure, dt) {
    const world = state.world;
    const body = bodyById(world, structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }

    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    structure.burstCooldown = Math.max(0, finiteOr(structure.burstCooldown, ACCUMULATOR_BURST_INTERVAL) - dt);
    if (structure.burstTimer <= 0 && structure.burstCooldown <= 0) {
      if (spendBodyEnergy(world, body, ACCUMULATOR_BURST_COST)) {
        structure.burstTimer = ACCUMULATOR_BURST_DURATION;
        structure.burstCooldown = ACCUMULATOR_BURST_INTERVAL;
      } else {
        structure.burstCooldown = 0.6;
      }
    }

    let strongestPull = 0;
    const range = ACCUMULATOR_RANGE + Math.min(260, finiteOr(body.radius, radiusFromMass(body.mass)) * 0.9);
    const burstProgress = clamp(structure.burstTimer / ACCUMULATOR_BURST_DURATION, 0, 1);
    const wave = Math.sin((1 - burstProgress) * Math.PI);
    if (structure.burstTimer > 0) {
      for (const particle of world.particles || []) {
        if (particle.id === body.id || !canAccumulatorPullParticle(particle)) {
          continue;
        }
        const toBodyX = body.x - particle.x;
        const toBodyY = body.y - particle.y;
        const dist = Math.hypot(toBodyX, toBodyY) || 1;
        if (dist > range + finiteOr(particle.radius, 1)) {
          continue;
        }
        const rawPull = clamp(1 - Math.max(0, dist - finiteOr(body.radius, radiusFromMass(body.mass))) / range, 0.02, 1);
        const pull = Math.pow(rawPull, 1.32) * (0.55 + wave * 0.9);
        const deployPull = 0.34 + clamp(structure.deploy, 0, 1) * 0.66;
        const massResistance = clamp(1 / Math.pow(Math.max(1, finiteOr(particle.mass, 1)), 0.18), 0.26, 1);
        const force = ACCUMULATOR_FORCE * 2.15 * pull * deployPull * massResistance;
        particle.vx += (toBodyX / dist) * force * dt;
        particle.vy += (toBodyY / dist) * force * dt;
        strongestPull = Math.max(strongestPull, pull);
      }
    }
    const targetDeploy = strongestPull > 0 ? 0.36 + strongestPull * 0.64 : 0;
    structure.deploy += (targetDeploy - finiteOr(structure.deploy, 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);
  }

  function shieldGeneratorRadius(body) {
    if (!body) {
      return 0;
    }
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    return radius + SHIELD_GENERATOR_FIELD_PADDING + Math.min(240, radius * 0.18);
  }

  function projectileShieldCost(projectile) {
    if (projectile && projectile.rocket) {
      return SHIELD_GENERATOR_ROCKET_COST;
    }
    if (projectile && projectile.lightning) {
      return SHIELD_GENERATOR_LIGHTNING_COST;
    }
    return SHIELD_GENERATOR_PROJECTILE_COST;
  }

  function powerOutShieldGenerator(state, structure, cause) {
    if (!structure || finiteOr(structure.health, 0) <= 0) {
      return;
    }
    structure.disabledTimer = Math.max(finiteOr(structure.disabledTimer, 0), SHIELD_GENERATOR_POWER_OUT_DURATION);
    structure.burstTimer = 0;
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.26);
    state.events.push({ type: "structure.shieldPowerOut", structureId: structure.id, cause: cause || "projectile", tick: state.tick });
  }

  function activateShieldGeneratorBlock(state, structure, body, cost, hitX, hitY, projectile) {
    if (!structure || !body || finiteOr(structure.health, 0) <= 0 || isStructureDisabled(structure)) {
      return false;
    }
    if (!spendBodyEnergy(state.world, body, cost)) {
      powerOutShieldGenerator(state, structure, projectile && projectile.cause);
      return false;
    }
    structure.deploy = 1;
    structure.burstTimer = 0.34;
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.16);
    state.events.push({
      type: "structure.shieldBlockedProjectile",
      structureId: structure.id,
      projectileId: projectile && projectile.id,
      x: hitX,
      y: hitY,
      color: projectile && projectile.color ? cloneColor(projectile.color) : { r: 119, g: 167, b: 255 },
      tick: state.tick
    });
    if (finiteOr(body.energy, 0) <= 0.05) {
      powerOutShieldGenerator(state, structure, projectile && projectile.cause);
    }
    return true;
  }

  function findProjectileShieldBlocker(world, ax, ay, bx, by, padding, projectile) {
    let nearest = null;
    const cost = projectileShieldCost(projectile);
    for (const structure of world.structures || []) {
      if (structure.type !== "shield-generator" || finiteOr(structure.health, 0) <= 0 || isStructureDisabled(structure)) {
        continue;
      }
      const body = bodyById(world, structure.bodyId);
      if (!isStructureHostBody(body)) {
        continue;
      }
      const radius = shieldGeneratorRadius(body) + padding;
      const hit = segmentCircleIntersection(body.x, body.y, radius, ax, ay, bx, by);
      if (!hit || (nearest && hit.t >= nearest.t)) {
        continue;
      }
      nearest = { structure, body, cost, x: hit.x, y: hit.y, t: hit.t };
    }
    return nearest;
  }

  function updateShieldGenerator(state, structure, dt) {
    const body = bodyById(state.world, structure.bodyId);
    if (!body || !isStructureHostBody(body)) {
      return;
    }
    structure.burstTimer = Math.max(0, finiteOr(structure.burstTimer, 0) - dt);
    const hasPower = canSpendBodyEnergy(state.world, body, SHIELD_GENERATOR_PROJECTILE_COST);
    const targetDeploy = hasPower ? 0.72 : 0.16;
    structure.deploy += (targetDeploy - finiteOr(structure.deploy, 0)) * (1 - Math.pow(0.04, dt));
    structure.deploy = clamp(structure.deploy, 0, 1);
  }

  function updateTether(state, structure, dt) {
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.2, 0, 1);
  }

  function isActiveTetherStructure(structure) {
    return Boolean(
      structure &&
      structure.type === "tether" &&
      finiteOr(structure.health, 0) > 0 &&
      !isStructureDisabled(structure)
    );
  }

  function applyTetherDistanceConstraint(state, structure, dt) {
    const firstBody = bodyById(state.world, structure.bodyId);
    const secondBody = bodyById(state.world, structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id || !applyLinkedStructureSurfaceConstraint(state.world, structure)) {
      return false;
    }

    const dx = structure.x2 - structure.x;
    const dy = structure.y2 - structure.y;
    const currentLength = Math.hypot(dx, dy) || 1;
    const nx = dx / currentLength;
    const ny = dy / currentLength;
    const restLength = normalizedTetherRestLength(structure, firstBody, secondBody, currentLength);
    structure.restLength = restLength;
    const give = tetherGiveForBodies(firstBody, secondBody);
    const minLength = Math.max(40, restLength - give);
    const maxLength = restLength + give;
    let lengthError = 0;
    if (currentLength > maxLength) {
      lengthError = currentLength - maxLength;
    } else if (currentLength < minLength) {
      lengthError = currentLength - minLength;
    }

    if (Math.abs(lengthError) <= TETHER_POSITION_SLOP) {
      return false;
    }

    const firstMass = Math.max(1, finiteOr(firstBody.mass, 1));
    const secondMass = Math.max(1, finiteOr(secondBody.mass, 1));
    const totalMass = firstMass + secondMass;
    const anchorFirstAgainstDirectGadget = isDirectGadgetForcedFromLandedBody(secondBody, firstBody);
    const anchorSecondAgainstDirectGadget = isDirectGadgetForcedFromLandedBody(firstBody, secondBody);
    let firstShare = clamp(secondMass / totalMass, 0.08, 0.92);
    let secondShare = clamp(firstMass / totalMass, 0.08, 0.92);
    if (anchorFirstAgainstDirectGadget && !anchorSecondAgainstDirectGadget) {
      firstShare = 0;
      secondShare = 1;
    } else if (anchorSecondAgainstDirectGadget && !anchorFirstAgainstDirectGadget) {
      firstShare = 1;
      secondShare = 0;
    }
    const correction = lengthError - Math.sign(lengthError) * TETHER_POSITION_SLOP;

    firstBody.x += nx * correction * firstShare;
    firstBody.y += ny * correction * firstShare;
    secondBody.x -= nx * correction * secondShare;
    secondBody.y -= ny * correction * secondShare;

    const relativeVelocity = (finiteOr(secondBody.vx, 0) - finiteOr(firstBody.vx, 0)) * nx +
      (finiteOr(secondBody.vy, 0) - finiteOr(firstBody.vy, 0)) * ny;
    const signedRelativeVelocity = relativeVelocity * Math.sign(correction);
    const velocityCorrection = clamp(
      (Math.abs(correction) * TETHER_SPRING + Math.max(0, signedRelativeVelocity) * TETHER_DAMPING) * dt * Math.sign(correction),
      -TETHER_MAX_ACCELERATION * dt,
      TETHER_MAX_ACCELERATION * dt
    );

    applyBodyVelocityChangeAtPoint(
      firstBody,
      nx * velocityCorrection * firstShare,
      ny * velocityCorrection * firstShare,
      structure.x,
      structure.y,
      BODY_CONSTRAINT_TORQUE_RESPONSE
    );
    applyBodyVelocityChangeAtPoint(
      secondBody,
      -nx * velocityCorrection * secondShare,
      -ny * velocityCorrection * secondShare,
      structure.x2,
      structure.y2,
      BODY_CONSTRAINT_TORQUE_RESPONSE
    );

    applyLinkedStructureSurfaceConstraint(state.world, structure);
    return true;
  }

  function resolveTetheredBodyCollision(state, structure) {
    const firstBody = bodyById(state.world, structure.bodyId);
    const secondBody = bodyById(state.world, structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return false;
    }

    const dx = secondBody.x - firstBody.x;
    const dy = secondBody.y - firstBody.y;
    const minDist = Math.max(1, finiteOr(firstBody.radius, radiusFromMass(firstBody.mass))) +
      Math.max(1, finiteOr(secondBody.radius, radiusFromMass(secondBody.mass)));
    if (dx * dx + dy * dy >= minDist * minDist) {
      return false;
    }

    resolveBodyBounce(firstBody, secondBody, dx, dy, minDist);
    applyLinkedStructureSurfaceConstraint(state.world, structure);
    return true;
  }

  function solveTetherConstraints(state, dt) {
    const structures = state && state.world && Array.isArray(state.world.structures) ? state.world.structures : [];
    let movedAny = false;
    for (let iteration = 0; iteration < TETHER_CONSTRAINT_ITERATIONS; iteration += 1) {
      let movedThisPass = false;
      for (const structure of structures) {
        if (isActiveTetherStructure(structure) && applyTetherDistanceConstraint(state, structure, dt)) {
          movedThisPass = true;
        }
        if (isActiveTetherStructure(structure) && resolveTetheredBodyCollision(state, structure)) {
          movedThisPass = true;
        }
      }
      movedAny = movedAny || movedThisPass;
      if (!movedThisPass) {
        break;
      }
    }

    if (movedAny) {
      syncStructuresToSurfaces(state, false);
    }
  }

  function addBridgeComponentRecord(adjacency, bodyId, record) {
    if (!adjacency.has(bodyId)) {
      adjacency.set(bodyId, []);
    }
    adjacency.get(bodyId).push(record);
  }

  function bridgeRigidRestAngle(structure, firstBody, secondBody) {
    return Math.atan2(
      finiteOr(structure.restCenterDy, secondBody.y - firstBody.y),
      finiteOr(structure.restCenterDx, secondBody.x - firstBody.x)
    );
  }

  function ensureBridgeRigidAnchorOffsets(structure, firstBody, secondBody) {
    const restAngle = bridgeRigidRestAngle(structure, firstBody, secondBody);
    if (!Number.isFinite(Number(structure.bridgeAngleOffset))) {
      structure.bridgeAngleOffset = shortestAngleDelta(restAngle, finiteOr(structure.angle, restAngle));
    }
    if (!Number.isFinite(Number(structure.bridgeLinkedAngleOffset))) {
      structure.bridgeLinkedAngleOffset = shortestAngleDelta(restAngle, finiteOr(structure.linkedAngle, restAngle + Math.PI));
    }
  }

  function addBridgeFrameCorrection(corrections, bodyId, currentAngle, desiredAngle) {
    if (!corrections.has(bodyId)) {
      corrections.set(bodyId, { sin: 0, cos: 0, count: 0 });
    }
    const delta = shortestAngleDelta(currentAngle, desiredAngle);
    const correction = corrections.get(bodyId);
    correction.sin += Math.sin(delta);
    correction.cos += Math.cos(delta);
    correction.count += 1;
  }

  function applyBridgeComponentAnchorCorrections(state, component) {
    const corrections = new Map();
    const desiredAngles = [];
    for (const record of component.records) {
      const structure = record.structure;
      const restAngle = bridgeRigidRestAngle(structure, record.firstBody, record.secondBody);
      const firstDesired = restAngle + finiteOr(structure.bridgeAngleOffset, 0);
      const secondDesired = restAngle + finiteOr(structure.bridgeLinkedAngleOffset, Math.PI);
      desiredAngles.push({ structure, firstDesired, secondDesired });
      addBridgeFrameCorrection(corrections, record.firstBody.id, finiteOr(structure.angle, firstDesired), firstDesired);
      addBridgeFrameCorrection(corrections, record.secondBody.id, finiteOr(structure.linkedAngle, secondDesired), secondDesired);
    }

    for (const bodyId of component.bodyIds) {
      const correction = corrections.get(bodyId);
      if (!correction || !correction.count) {
        continue;
      }
      const angleStep = Math.atan2(correction.sin, correction.cos);
      rotateBodyMountedFrame(state, bodyId, angleStep);
    }

    for (const desired of desiredAngles) {
      desired.structure.angle = desired.firstDesired;
      desired.structure.linkedAngle = desired.secondDesired;
    }
  }

  function bridgeConstraintRecords(state) {
    const world = state && state.world;
    const structures = world && Array.isArray(world.structures) ? world.structures : [];
    const records = [];
    const adjacency = new Map();
    for (const structure of structures) {
      if (!isActiveBridge(structure)) {
        continue;
      }

      const firstBody = bodyById(world, structure.bodyId);
      const secondBody = bodyById(world, structure.linkedBodyId);
      if (!firstBody || !secondBody || firstBody.id === secondBody.id || !applyLinkedStructureSurfaceConstraint(world, structure)) {
        continue;
      }

      let restDx = finiteOr(structure.restCenterDx, secondBody.x - firstBody.x);
      let restDy = finiteOr(structure.restCenterDy, secondBody.y - firstBody.y);
      if (Math.hypot(restDx, restDy) < 1) {
        restDx = secondBody.x - firstBody.x;
        restDy = secondBody.y - firstBody.y;
      }
      structure.restCenterDx = restDx;
      structure.restCenterDy = restDy;
      ensureBridgeRigidAnchorOffsets(structure, firstBody, secondBody);

      const record = { structure, firstBody, secondBody };
      records.push(record);
      addBridgeComponentRecord(adjacency, firstBody.id, record);
      addBridgeComponentRecord(adjacency, secondBody.id, record);
    }
    return { records, adjacency };
  }

  function bridgeConstraintComponents(records, adjacency) {
    const components = [];
    const visitedBodies = new Set();
    const visitedStructures = new Set();
    for (const record of records) {
      if (visitedStructures.has(record.structure.id)) {
        continue;
      }

      const bodyIds = [];
      const componentRecords = [];
      const queue = [record.firstBody.id];
      visitedBodies.add(record.firstBody.id);
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const bodyId = queue[cursor];
        bodyIds.push(bodyId);
        for (const linkedRecord of adjacency.get(bodyId) || []) {
          if (!visitedStructures.has(linkedRecord.structure.id)) {
            visitedStructures.add(linkedRecord.structure.id);
            componentRecords.push(linkedRecord);
          }
          const otherBodyId = linkedRecord.firstBody.id === bodyId
            ? linkedRecord.secondBody.id
            : linkedRecord.firstBody.id;
          if (!visitedBodies.has(otherBodyId)) {
            visitedBodies.add(otherBodyId);
            queue.push(otherBodyId);
          }
        }
      }

      if (bodyIds.length > 1 && componentRecords.length) {
        components.push({ bodyIds, records: componentRecords });
      }
    }
    return components;
  }

  function solveBridgeConstraintComponent(state, component, dt) {
    const world = state && state.world;
    const bodies = component.bodyIds.map((bodyId) => bodyById(world, bodyId)).filter(Boolean);
    if (bodies.length < 2) {
      return false;
    }

    const bodyMap = new Map();
    const adjacency = new Map();
    let totalMass = 0;
    let centerX = 0;
    let centerY = 0;
    let averageVx = 0;
    let averageVy = 0;
    for (const body of bodies) {
      const mass = Math.max(1, finiteOr(body.mass, 1));
      bodyMap.set(body.id, { body, mass });
      totalMass += mass;
      centerX += finiteOr(body.x, 0) * mass;
      centerY += finiteOr(body.y, 0) * mass;
      averageVx += finiteOr(body.vx, 0) * mass;
      averageVy += finiteOr(body.vy, 0) * mass;
      adjacency.set(body.id, []);
    }
    if (totalMass <= 0) {
      return false;
    }
    centerX /= totalMass;
    centerY /= totalMass;
    averageVx /= totalMass;
    averageVy /= totalMass;

    for (const record of component.records) {
      addBridgeComponentRecord(adjacency, record.firstBody.id, record);
      addBridgeComponentRecord(adjacency, record.secondBody.id, record);
    }

    const rootId = bodies[0].id;
    const localOffsets = new Map([[rootId, { x: 0, y: 0 }]]);
    const queue = [rootId];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const bodyId = queue[cursor];
      const baseOffset = localOffsets.get(bodyId) || { x: 0, y: 0 };
      for (const record of adjacency.get(bodyId) || []) {
        const fromFirst = record.firstBody.id === bodyId;
        const otherBodyId = fromFirst ? record.secondBody.id : record.firstBody.id;
        if (!bodyMap.has(otherBodyId) || localOffsets.has(otherBodyId)) {
          continue;
        }
        const restDx = finiteOr(record.structure.restCenterDx, record.secondBody.x - record.firstBody.x);
        const restDy = finiteOr(record.structure.restCenterDy, record.secondBody.y - record.firstBody.y);
        localOffsets.set(otherBodyId, {
          x: baseOffset.x + (fromFirst ? restDx : -restDx),
          y: baseOffset.y + (fromFirst ? restDy : -restDy)
        });
        queue.push(otherBodyId);
      }
    }

    if (localOffsets.size !== bodies.length) {
      return false;
    }

    let restCenterX = 0;
    let restCenterY = 0;
    for (const body of bodies) {
      const entry = bodyMap.get(body.id);
      const offset = localOffsets.get(body.id);
      restCenterX += offset.x * entry.mass;
      restCenterY += offset.y * entry.mass;
    }
    restCenterX /= totalMass;
    restCenterY /= totalMass;

    let angularNumerator = 0;
    let angularDenominator = 0;
    for (const body of bodies) {
      const entry = bodyMap.get(body.id);
      const offset = localOffsets.get(body.id);
      offset.x -= restCenterX;
      offset.y -= restCenterY;
      const relativeVx = finiteOr(body.vx, 0) - averageVx;
      const relativeVy = finiteOr(body.vy, 0) - averageVy;
      angularNumerator += entry.mass * (offset.x * relativeVy - offset.y * relativeVx);
      angularDenominator += entry.mass * (offset.x * offset.x + offset.y * offset.y);
    }

    const angularVelocity = angularDenominator > 1
      ? clamp(
          (angularNumerator / angularDenominator) * Math.pow(BRIDGE_ANGULAR_DAMPING, dt),
          -BRIDGE_MAX_ANGULAR_SPEED,
          BRIDGE_MAX_ANGULAR_SPEED
        )
      : 0;
    const angleStep = angularVelocity * dt;
    if (Math.abs(angleStep) > 0.000001) {
      for (const record of component.records) {
        const rotatedRest = rotatePoint(
          finiteOr(record.structure.restCenterDx, record.secondBody.x - record.firstBody.x),
          finiteOr(record.structure.restCenterDy, record.secondBody.y - record.firstBody.y),
          angleStep
        );
        record.structure.restCenterDx = rotatedRest.x;
        record.structure.restCenterDy = rotatedRest.y;
      }
      for (const body of bodies) {
        rotateBodyMountedFrame(state, body.id, angleStep);
        const offset = localOffsets.get(body.id);
        const rotatedOffset = rotatePoint(offset.x, offset.y, angleStep);
        offset.x = rotatedOffset.x;
        offset.y = rotatedOffset.y;
      }
    }
    applyBridgeComponentAnchorCorrections(state, component);

    const velocityBlend = 1 - Math.pow(0.0001, dt);
    for (const body of bodies) {
      const offset = localOffsets.get(body.id);
      body.x = centerX + offset.x;
      body.y = centerY + offset.y;
      const targetVx = averageVx - angularVelocity * offset.y;
      const targetVy = averageVy + angularVelocity * offset.x;
      body.vx = finiteOr(body.vx, 0) + (targetVx - finiteOr(body.vx, 0)) * velocityBlend;
      body.vy = finiteOr(body.vy, 0) + (targetVy - finiteOr(body.vy, 0)) * velocityBlend;
      body.angularVelocity = clamp(
        finiteOr(body.angularVelocity, 0) + (angularVelocity - finiteOr(body.angularVelocity, 0)) * velocityBlend * 0.35,
        -BODY_MAX_ANGULAR_SPEED,
        BODY_MAX_ANGULAR_SPEED
      );
    }

    for (const record of component.records) {
      applyLinkedStructureSurfaceConstraint(world, record.structure);
    }
    return true;
  }

  function solveBridgeConstraints(state, dt) {
    const graph = bridgeConstraintRecords(state);
    if (!graph.records.length) {
      return;
    }

    let movedAny = false;
    for (const component of bridgeConstraintComponents(graph.records, graph.adjacency)) {
      if (solveBridgeConstraintComponent(state, component, dt)) {
        movedAny = true;
      }
    }
    if (movedAny) {
      syncStructuresToSurfaces(state, false);
    }
  }

  function updateBridge(state, structure, dt) {
    const firstBody = bodyById(state.world, structure.bodyId);
    const secondBody = bodyById(state.world, structure.linkedBodyId);
    if (!firstBody || !secondBody || firstBody.id === secondBody.id) {
      return;
    }
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.8, 0, 1);
  }

  function medbayHalfAngle(body, structure) {
    const centerRadius = Math.max(
      24,
      finiteOr(body && body.radius, body ? radiusFromMass(body.mass) : 24) +
        structureBaseSurfaceOffset(structure) +
        MEDBAY_INTERIOR_WIDTH * 0.18
    );
    return Math.min(Math.PI, MEDBAY_INTERIOR_WIDTH / centerRadius / 2);
  }

  function playerInsideMedbay(player, body, structure) {
    return Boolean(
      player &&
      player.landed &&
      !player.landed.bridgeId &&
      body &&
      player.landed.bodyId === body.id &&
      Math.abs(shortestAngleDelta(finiteOr(structure.angle, 0), finiteOr(player.landed.angle, 0))) <= medbayHalfAngle(body, structure)
    );
  }

  function updateMedbay(state, structure, dt) {
    const body = bodyById(state.world, structure.bodyId);
    const players = state && state.players && typeof state.players === "object" ? Object.values(state.players) : [];
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.2, 0, 1);
    structure.healPulse = clamp(finiteOr(structure.healPulse, 0) - dt * 2.6, 0, 1);

    for (const player of players) {
      if (!player || finiteOr(player.health, 0) <= 0 || !playerInsideMedbay(player, body, structure)) {
        continue;
      }

      const maxHealth = Math.max(1, finiteOr(player.maxHealth, PLAYER_MAX_HEALTH));
      const missingHealth = Math.max(0, maxHealth - finiteOr(player.health, maxHealth));
      const maxHeal = Math.min(missingHealth, MEDBAY_HEAL_RATE * dt);
      const energyCost = MEDBAY_HEAL_RATE > 0 ? MEDBAY_ENERGY_DRAIN * (maxHeal / MEDBAY_HEAL_RATE) : 0;
      if (maxHeal <= 0 || !spendBodyEnergy(state.world, body, energyCost)) {
        continue;
      }

      player.health = Math.min(maxHealth, finiteOr(player.health, maxHealth) + maxHeal);
      structure.healPulse = 1;
    }
  }

  function fireCampLauncherMissile(state, structure, target) {
    const dist = Math.hypot(target.x - structure.x, target.y - structure.y);
    const leadTime = clamp(dist / LAUNCHER_MISSILE_SPEED, 0, 1.2);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.34;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.34;
    const aim = normalize(targetX - structure.x, targetY - structure.y);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = 48;
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      vx: aim.x * LAUNCHER_MISSILE_SPEED,
      vy: aim.y * LAUNCHER_MISSILE_SPEED,
      radius: 10,
      length: 54,
      color,
      life: 2.85,
      maxLife: 2.85,
      damage: LAUNCHER_MISSILE_DAMAGE,
      knockback: LAUNCHER_MISSILE_KNOCKBACK,
      cause: "Camp missile launcher",
      rocket: true,
      targetX,
      targetY,
      targetPlayerId: String(target.id || ""),
      targetStructureId: 0,
      sourceStructureId: String(structure.id || ""),
      ignoredBodyId: structure.bodyId,
      hitMobIds: []
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    structure.missileCharge = 0;
    structure.lockTimer = 0;
    structure.beepTimer = 0;
    structure.targetX = targetX;
    structure.targetY = targetY;
    structure.targetCount = 1;
    structure.deploy = 1;
    structure.aimAngle = Math.atan2(aim.y, aim.x);
    state.events.push({ type: "structure.shot", structureId: structure.id, projectileId: projectile.id, tick: state.tick });
  }

  function updateCampMissileLauncher(state, structure, dt) {
    const body = bodyById(state.world, structure.bodyId);
    structure.missileCharge = clamp(finiteOr(structure.missileCharge, 0) + dt / MISSILE_LAUNCHER_PRODUCTION_TIME, 0, 1);
    structure.lockTimer = Math.max(0, finiteOr(structure.lockTimer, 0) - dt);
    structure.beepTimer = Math.max(0, finiteOr(structure.beepTimer, 0) - dt);

    if (structure.missileCharge < 1) {
      structure.targetCount = 0;
      structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 1.2, 0, 0.58 + structure.missileCharge * 0.28);
      structure.aimAngle = finiteOr(structure.aimAngle, structure.angle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, structure.angle), structure.angle), -1.7 * dt, 1.7 * dt);
      return;
    }

    const target = findCampStructurePlayerTarget(state, state.world, structure, MISSILE_LAUNCHER_RANGE);
    if (!target) {
      structure.targetCount = 0;
      structure.lockTimer = 0;
      structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 1.6, 0, 0.9);
      structure.aimAngle = finiteOr(structure.aimAngle, structure.angle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, structure.angle), structure.angle), -1.9 * dt, 1.9 * dt);
      return;
    }

    structure.targetX = target.x;
    structure.targetY = target.y;
    structure.targetCount = 1;
    const targetAngle = Math.atan2(target.y - structure.y, target.x - structure.x);
    structure.aimAngle = finiteOr(structure.aimAngle, structure.angle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, structure.angle), targetAngle), -3.4 * dt, 3.4 * dt);
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.4, 0, 1);

    if (structure.lockTimer <= 0) {
      structure.lockTimer = MISSILE_LAUNCHER_LOCK_DURATION;
      structure.beepTimer = 0;
      return;
    }
    if (structure.beepTimer <= 0) {
      structure.beepTimer = 0.2;
    }
    if (structure.lockTimer <= dt * 1.05 && spendBodyEnergy(state.world, body, MISSILE_LAUNCHER_ENERGY_COST)) {
      fireCampLauncherMissile(state, structure, target);
    }
  }

  function updateStructures(state, inputs, dt) {
    const structures = state && state.world && Array.isArray(state.world.structures) ? state.world.structures : [];
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (!applyStructureSurfaceConstraint(state.world, structure)) {
        structures.splice(i, 1);
        continue;
      }

      const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
      structure.maxHealth = maxHealth;
      structure.health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
      structure.disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0) - dt);
      structure.flash = Math.max(0, finiteOr(structure.flash, 0) - dt);
      structure.shootCooldown = Math.max(0, finiteOr(structure.shootCooldown, 0) - dt);
      if (isSurvivalCampStructure(state, structure)) {
        structure.survivalCampAggroTimer = Math.max(0, finiteOr(structure.survivalCampAggroTimer, 0) - dt);
        if (structure.survivalCampAggroTimer <= 0) {
          structure.survivalTargetPlayerId = "";
        }
      }

      if (structure.health <= 0 || isStructureDisabled(structure)) {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) - dt * 2.1, 0, 1);
        structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
        continue;
      }

      if (structure.type === "plating-block") {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 4.2, 0, 1);
        continue;
      }
      if (structure.type === "battery") {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.4, 0, 1);
        continue;
      }
      if (structure.type === "medbay") {
        updateMedbay(state, structure, dt);
        continue;
      }
      if (structure.type === "accumulator") {
        updateAccumulator(state, structure, dt);
        continue;
      }
      if (structure.type === "shield-generator") {
        updateShieldGenerator(state, structure, dt);
        continue;
      }
      if (structure.type === "missile-launcher") {
        if (isSurvivalCampStructure(state, structure)) {
          updateCampMissileLauncher(state, structure, dt);
        }
        continue;
      }
      if (structure.type === "trading-port") {
        updateTradingPort(state, structure, dt);
        continue;
      }
      if (structure.type === "communication-relay") {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.4, 0, 1);
        continue;
      }
      if (structure.type === "jet") {
        updateJet(state, structure, inputs || {}, dt);
        continue;
      }
      if (structure.type === "tether") {
        updateTether(state, structure, dt);
        continue;
      }
      if (structure.type === "bridge") {
        updateBridge(state, structure, dt);
        continue;
      }

      const target = structure.type === "turret" ? findTurretTarget(state, structure) : null;
      const normalAngle = finiteOr(structure.angle, 0);
      if (target) {
        const targetAngle = Math.atan2(target.y - structure.y, target.x - structure.x);
        structure.aimAngle = finiteOr(structure.aimAngle, normalAngle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, normalAngle), targetAngle), -4.2 * dt, 4.2 * dt);
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.8, 0, 1);
        const dist = Math.hypot(target.x - structure.x, target.y - structure.y);
        const hostBody = bodyById(state.world, structure.bodyId);
        if (structure.deploy > 0.72 && structure.shootCooldown <= 0 && spendBodyEnergy(state.world, hostBody, TURRET_ENERGY_COST)) {
          fireTurretLaser(state, structure, target, dist);
        }
      } else {
        structure.aimAngle = finiteOr(structure.aimAngle, normalAngle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, normalAngle), normalAngle), -2.2 * dt, 2.2 * dt);
        structure.deploy = clamp(finiteOr(structure.deploy, 0) - dt * 1.6, 0, 1);
      }
    }

    solveBridgeConstraints(state, dt);
    solveTetherConstraints(state, dt);
  }

  function resolveMobBodyCollisions(state) {
    const world = state.world;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0) {
        continue;
      }
      for (const body of world.particles || []) {
        if (!body || !body.tier || !body.tier.solid) {
          continue;
        }
        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = mob.radius + solidContactRadius(body);
        if (dist >= minDist) {
          continue;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        const bodyShare = clamp(2.6 / (body.mass + 2.6), 0.006, 0.18);
        const mobShare = 1 - bodyShare;
        const bodySpeed = Math.hypot(body.vx, body.vy);
        const relativeVelocity = (mob.vx - body.vx) * nx + (mob.vy - body.vy) * ny;
        const impactSpeed = Math.max(0, -relativeVelocity);
        const canTriggerBodyDamage = bodySpeed > SOLID_BODY_DAMAGE_SPEED && mob.hitCooldown <= 0 && mobBodyImpactCooldown(mob, body) <= 0;
        const bodyDashActive = finiteOr(mob.bossBodyEvadeTimer, 0) > 0 && finiteOr(mob.hitCooldown, 0) > 0;
        const correctionDistance = canTriggerBodyDamage
          ? Math.min(overlap, 18)
          : bodyDashActive
            ? Math.min(overlap, 12)
            : overlap;
        mob.x += nx * correctionDistance * mobShare;
        mob.y += ny * correctionDistance * mobShare;
        body.x -= nx * correctionDistance * bodyShare;
        body.y -= ny * correctionDistance * bodyShare;

        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.96;
          const pointX = body.x + nx * bodyAngularInertiaRadius(body);
          const pointY = body.y + ny * bodyAngularInertiaRadius(body);
          mob.vx += nx * impulse * 0.86;
          mob.vy += ny * impulse * 0.86;
          applyBodyVelocityChangeAtPoint(body, -nx * impulse * bodyShare, -ny * impulse * bodyShare, pointX, pointY, BODY_CONSTRAINT_TORQUE_RESPONSE);
        }

        if (canTriggerBodyDamage) {
          const impactSpeedForDamage = Math.max(bodySpeed, impactSpeed);
          const damage = solidBodyImpactDamage(body, impactSpeedForDamage, 18);
          markMobDamagedByBody(mob, body);
          const force = bodyImpactKnockbackForce(body, impactSpeedForDamage);
          knockMob(mob, nx, ny, force);
          triggerBossBodyEvade(mob, body, nx, ny, impactSpeedForDamage);
          if (damageMob(state, mob, damage, "body-impact")) {
            break;
          }
        }
      }
    }
  }

  function resolveMobProjectileCollisions(state) {
    const world = state.world;
    for (const body of world.particles || []) {
      if (!body || !body.tier || body.tier.solid || body.tier.threshold < 10) {
        continue;
      }
      const bodySpeed = Math.hypot(body.vx, body.vy);
      if (bodySpeed < PROJECTILE_DAMAGE_SPEED) {
        continue;
      }

      let hit = false;
      for (const mob of allCombatMobs(world)) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0 || mobBodyImpactCooldown(mob, body) > 0) {
          continue;
        }
        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const dist = Math.hypot(dx, dy) || 1;
        const hitDistance = mob.radius + body.radius * 1.12;
        if (dist > hitDistance) {
          continue;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const damage = projectileBodyImpactDamage(body, bodySpeed);
        markMobDamagedByBody(mob, body);
        knockMob(mob, nx, ny, 170 + bodySpeed * 0.38);
        triggerBossBodyEvade(mob, body, nx, ny, bodySpeed);
        body.vx *= 0.92;
        body.vy *= 0.92;
        damageMob(state, mob, damage, "projectile-impact");
        hit = true;
        break;
      }
      if (hit) {
        continue;
      }
    }
  }

  function updateBossSpawnPressure(state, mob) {
    if (!mob || !mob.isBoss || mob.health <= 0) {
      return;
    }
    if (state.world && (finiteOr(state.world.mobSpawnRestTimer, 0) > 0 || finiteOr(state.world.mobSpawnRestDrainTimer, 0) > 0)) {
      return;
    }
    if (!state.world) {
      return;
    }
    const interval = difficultyMobWaveInterval(state);
    state.world.mobWaveTimer = Math.min(
      finiteOr(state.world.mobWaveTimer, interval),
      interval * MOB_BOSS_SPAWN_TIMER_CEILING_SCALE
    );
  }

  function nearestHostileMobTarget(world, source) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob === source || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      if (isSurvivalCampMob({ world, gameMode: world && world.gameMode }, mob) && finiteOr(mob.survivalCampAggroTimer, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - source.x, mob.y - source.y);
      if (distance < bestDistance) {
        best = mob;
        bestDistance = distance;
      }
    }
    return best ? { mob: best, distance: bestDistance } : null;
  }

  function activeFamiliarCommand(mob) {
    if (!isPlayerTeamMob(mob) || finiteOr(mob.familiarCommandTimer, 0) <= 0) {
      return null;
    }
    if (!Number.isFinite(Number(mob.familiarCommandX)) || !Number.isFinite(Number(mob.familiarCommandY))) {
      mob.familiarCommandTimer = 0;
      return null;
    }
    return {
      x: finiteOr(mob.familiarCommandX, mob.x),
      y: finiteOr(mob.familiarCommandY, mob.y)
    };
  }

  function clearFamiliarCommand(mob) {
    mob.familiarCommandTimer = 0;
    mob.familiarCommandX = finiteOr(mob.x, 0);
    mob.familiarCommandY = finiteOr(mob.y, 0);
  }

  function updateFamiliarMob(state, mob, dt) {
    if (!isPlayerTeamMob(mob)) {
      mob.vx *= Math.pow(0.34, dt);
      mob.vy *= Math.pow(0.34, dt);
      return true;
    }

    const command = activeFamiliarCommand(mob);
    if (command) {
      mob.familiarCommandTimer = Math.max(0, finiteOr(mob.familiarCommandTimer, 0) - dt);
      const dx = command.x - mob.x;
      const dy = command.y - mob.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist <= Math.max(34, finiteOr(mob.radius, 28) + 12) || mob.familiarCommandTimer <= 0) {
        clearFamiliarCommand(mob);
        mob.vx *= Math.pow(0.48, dt);
        mob.vy *= Math.pow(0.48, dt);
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        const slowRadius = Math.max(90, finiteOr(mob.radius, 28) * 3.2);
        const force = dist > slowRadius ? 260 : 128;
        mob.vx += nx * force * dt;
        mob.vy += ny * force * dt;
        mob.vx *= Math.pow(0.7, dt);
        mob.vy *= Math.pow(0.7, dt);
        const speed = Math.hypot(mob.vx, mob.vy);
        const maxSpeed = mob.kind === "rocket" || mob.kind === "fighter" ? 280 : mob.kind === "rambot" ? 245 : 220;
        if (speed > maxSpeed) {
          mob.vx = (mob.vx / speed) * maxSpeed;
          mob.vy = (mob.vy / speed) * maxSpeed;
        }
        mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
      }
      mob.x += finiteOr(mob.vx, 0) * dt;
      mob.y += finiteOr(mob.vy, 0) * dt;
      return true;
    }

    const target = nearestHostileMobTarget(state.world, mob);
    if (!target) {
      mob.vx *= Math.pow(0.7, dt);
      mob.vy *= Math.pow(0.7, dt);
      mob.x += mob.vx * dt;
      mob.y += mob.vy * dt;
      return true;
    }
    const enemy = target.mob;
    const dx = enemy.x - mob.x;
    const dy = enemy.y - mob.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const desiredDistance = Math.max(60, finiteOr(mob.radius, 28) + finiteOr(enemy.radius, 28) + 10);
    mob.vx += nx * (dist > desiredDistance ? 165 : -48) * dt + tangentX * 32 * dt;
    mob.vy += ny * (dist > desiredDistance ? 165 : -48) * dt + tangentY * 32 * dt;
    mob.vx *= Math.pow(0.74, dt);
    mob.vy *= Math.pow(0.74, dt);
    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = mob.kind === "rocket" || mob.kind === "fighter" ? 230 : mob.kind === "rambot" ? 210 : 175;
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
    if (dist < finiteOr(mob.radius, 28) + finiteOr(enemy.radius, 28) + 14 && finiteOr(enemy.hitCooldown, 0) <= 0) {
      knockMob(enemy, nx, ny, 125);
      damageMob(state, enemy, FAMILIAR_DAMAGE_PER_SECOND * dt * 6.5, "familiar");
      mob.health = Math.max(0, finiteOr(mob.health, mob.maxHealth) - HOSTILE_FAMILIAR_DAMAGE_PER_SECOND * dt * 3.5);
      mob.flash = Math.max(finiteOr(mob.flash, 0), 0.1);
    }
    return true;
  }

  function isSurvivalCampMob(state, mob) {
    return Boolean(
      state &&
      mob &&
      mob.survivalCampId &&
      !isPlayerTeamMob(mob) &&
      !isHordeGameMode(state.gameMode || state.world && state.world.gameMode)
    );
  }

  function clearSurvivalCampAttackState(mob) {
    if (!mob) {
      return;
    }
    mob.lightningWarmup = 0;
    mob.lockTimer = 0;
    mob.volleyTimer = 0;
    mob.volleyShots = 0;
    mob.scanProgress = 0;
    mob.chargeTimer = 0;
    mob.chargePower = 0;
    mob.machineGunShots = 0;
    mob.pistonTimer = 0;
    mob.pistonHit = false;
    mob.recoverTimer = Math.max(0.16, finiteOr(mob.recoverTimer, 0));
  }

  function isSurvivalCampStructure(state, structure) {
    return Boolean(
      structure &&
      structure.survivalCampId &&
      !isHordeGameMode(state && (state.gameMode || state.world && state.world.gameMode))
    );
  }

  function playerScoredSurvivalCampBodyIds(state) {
    const ids = new Set();
    if (!state || !state.players || typeof playerScoredBodyIds !== "function") {
      return ids;
    }
    for (const player of Object.values(state.players)) {
      for (const bodyId of playerScoredBodyIds(state, player)) {
        ids.add(Math.floor(finiteOr(bodyId, 0)));
      }
    }
    return ids;
  }

  function isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds) {
    const ids = scoredBodyIds || playerScoredSurvivalCampBodyIds(state);
    return Boolean(body && ids.has(Math.floor(finiteOr(body.id, 0))));
  }

  function wakeSurvivalCampStructures(state, campId, wakeX, wakeY, targetPlayerId) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!world || !cleanCampId || !Array.isArray(world.structures)) {
      return 0;
    }

    let woken = 0;
    for (const structure of world.structures) {
      if (
        !structure ||
        structure.survivalCampId !== cleanCampId ||
        finiteOr(structure.health, 0) <= 0 ||
        Math.hypot(finiteOr(structure.x, wakeX) - wakeX, finiteOr(structure.y, wakeY) - wakeY) > SURVIVAL_CAMP_WAKE_RADIUS
      ) {
        continue;
      }
      structure.survivalCampAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
      structure.survivalTargetPlayerId = cleanTargetPlayerId;
      woken += 1;
    }
    return woken;
  }

  function wakeSurvivalCamp(state, campId, targetPlayerId, reason, originX, originY) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!state || !world || !cleanCampId || !cleanTargetPlayerId || isHordeGameMode(state.gameMode || world.gameMode)) {
      return false;
    }
    const wakeX = finiteOr(originX, 0);
    const wakeY = finiteOr(originY, 0);
    let woken = wakeSurvivalCampStructures(state, cleanCampId, wakeX, wakeY, cleanTargetPlayerId);
    for (const campMob of allCombatMobs(world)) {
      if (
        !campMob ||
        campMob.survivalCampId !== cleanCampId ||
        campMob.health <= 0 ||
        isPlayerTeamMob(campMob) ||
        Math.hypot(campMob.x - wakeX, campMob.y - wakeY) > SURVIVAL_CAMP_WAKE_RADIUS
      ) {
        continue;
      }
      campMob.survivalCampAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
      campMob.survivalCampReturning = false;
      campMob.survivalCampOrphanedByAggro = false;
      clearSurvivalCampMigrationState(campMob);
      campMob.survivalTargetPlayerId = cleanTargetPlayerId;
      campMob.survivalCampWakeReason = String(reason || "aggression");
      woken += 1;
    }
    if (woken > 0) {
      state.events.push({
        type: "mob.camp.woken",
        campId: cleanCampId,
        count: woken,
        targetPlayerId: cleanTargetPlayerId,
        reason: String(reason || "aggression"),
        tick: state.tick
      });
    }
    return woken > 0;
  }

  function wakeSurvivalCampFromMob(state, mob, targetPlayerId) {
    if (!isSurvivalCampMob(state, mob)) {
      return false;
    }
    return wakeSurvivalCamp(
      state,
      mob.survivalCampId,
      targetPlayerId,
      "mob-damaged",
      finiteOr(mob.survivalCampX, mob.x),
      finiteOr(mob.survivalCampY, mob.y)
    );
  }

  function wakeSurvivalCampFromStructure(state, structure, targetPlayerId) {
    if (!isSurvivalCampStructure(state, structure)) {
      return false;
    }
    return wakeSurvivalCamp(
      state,
      structure.survivalCampId,
      targetPlayerId,
      structure.type === "container" ? "camp-theft" : "structure-damaged",
      finiteOr(structure.survivalCampX, structure.x),
      finiteOr(structure.survivalCampY, structure.y)
    );
  }

  function wakeSurvivalCampFromBody(state, body, targetPlayerId, options) {
    const allowScoredBody = Boolean(options && options.allowScoredBody);
    if (
      !state ||
      !body ||
      !body.survivalCampBody ||
      !body.survivalCampId ||
      (!allowScoredBody && isPlayerScoredSurvivalCampBody(state, body)) ||
      isHordeGameMode(state.gameMode || state.world && state.world.gameMode)
    ) {
      return false;
    }

    return wakeSurvivalCamp(
      state,
      body.survivalCampId,
      targetPlayerId,
      "camp-body-interfered",
      finiteOr(body.survivalCampX, body.x),
      finiteOr(body.survivalCampY, body.y)
    );
  }

  function ensureSurvivalCampBodyHome(body) {
    if (!body || !body.survivalCampBody) {
      return null;
    }
    if (!Number.isFinite(Number(body.survivalCampHomeX)) || !Number.isFinite(Number(body.survivalCampHomeY))) {
      body.survivalCampHomeX = finiteOr(body.x, 0);
      body.survivalCampHomeY = finiteOr(body.y, 0);
    }
    return {
      x: finiteOr(body.survivalCampHomeX, body.x),
      y: finiteOr(body.survivalCampHomeY, body.y)
    };
  }

  function markSurvivalCampBodyMovedByPlayer(body, playerId) {
    if (!body || !body.survivalCampBody) {
      return;
    }
    ensureSurvivalCampBodyHome(body);
    body.survivalCampMovedByPlayer = true;
    body.survivalCampLastMoverPlayerId = String(playerId || "");
  }

  function maybeWakeSurvivalCampFromMovedBody(state, body) {
    if (!body || !body.survivalCampBody || !body.survivalCampMovedByPlayer || body.survivalCampBodyMovedWakeSent || isPlayerScoredSurvivalCampBody(state, body)) {
      return false;
    }
    const home = ensureSurvivalCampBodyHome(body);
    if (!home || Math.hypot(finiteOr(body.x, home.x) - home.x, finiteOr(body.y, home.y) - home.y) < SURVIVAL_CAMP_BODY_WAKE_DISTANCE) {
      return false;
    }
    body.survivalCampBodyMovedWakeSent = true;
    return wakeSurvivalCampFromBody(state, body, body.survivalCampLastMoverPlayerId || "");
  }

  function survivalCampAnchorPoint(state, campId, fallbackX, fallbackY) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    if (!world || !Array.isArray(world.particles) || !cleanCampId) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }

    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    const scoredBodyIds = playerScoredSurvivalCampBodyIds(state);
    for (const body of world.particles) {
      if (!body || !body.survivalCampBody || body.survivalCampId !== cleanCampId || isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds)) {
        continue;
      }
      const weight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      weightedX += finiteOr(body.x, fallbackX) * weight;
      weightedY += finiteOr(body.y, fallbackY) * weight;
      totalWeight += weight;
    }

    if (totalWeight <= 0) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }
    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      hasCampBody: true
    };
  }

  function nearestSurvivalCampAnchor(state, campId, x, y) {
    const world = state && state.world;
    const ignoredCampId = String(campId || "");
    if (!world || !Array.isArray(world.particles)) {
      return null;
    }

    const camps = new Map();
    const scoredBodyIds = playerScoredSurvivalCampBodyIds(state);
    for (const body of world.particles) {
      if (!body || !body.survivalCampBody || !body.survivalCampId || body.survivalCampId === ignoredCampId || isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds)) {
        continue;
      }
      const id = String(body.survivalCampId);
      const weight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      const current = camps.get(id) || { campId: id, weightedX: 0, weightedY: 0, totalWeight: 0 };
      current.weightedX += finiteOr(body.x, x) * weight;
      current.weightedY += finiteOr(body.y, y) * weight;
      current.totalWeight += weight;
      camps.set(id, current);
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (const camp of camps.values()) {
      if (camp.totalWeight <= 0) {
        continue;
      }
      const campX = camp.weightedX / camp.totalWeight;
      const campY = camp.weightedY / camp.totalWeight;
      const distance = Math.hypot(finiteOr(x, 0) - campX, finiteOr(y, 0) - campY);
      if (distance < nearestDistance) {
        nearest = { campId: camp.campId, x: campX, y: campY };
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function clearSurvivalCampMigrationState(mob) {
    mob.survivalMigrationCampId = "";
    mob.survivalMigrationCampX = Number.NaN;
    mob.survivalMigrationCampY = Number.NaN;
    mob.survivalMigrationStraightTime = 0;
    mob.survivalMigrationDirX = 0;
    mob.survivalMigrationDirY = 0;
  }

  function isSurvivalMigratingMob(state, mob) {
    return Boolean(
      mob &&
      !isPlayerTeamMob(mob) &&
      !isHordeGameMode(state && state.gameMode) &&
      (mob.survivalEncounterType === "migration" || mob.survivalEncounterType === "salvage" || (!mob.survivalCampId && mob.survivalMigrationCampId))
    );
  }

  function nearbySurvivalMigrationPlayer(state, mob) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const player of Object.values(state && state.players || {})) {
      if (!player || finiteOr(player.health, 0) <= 0 || player.spacecraftInterior) continue;
      const distance = Math.hypot(player.x - mob.x, player.y - mob.y);
      if (distance <= SURVIVAL_MIGRATION_AGGRO_RADIUS && distance < nearestDistance) {
        nearest = player;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function clearSurvivalCampMobIdentity(mob) {
    mob.survivalCampId = "";
    mob.survivalCampX = finiteOr(mob.x, 0);
    mob.survivalCampY = finiteOr(mob.y, 0);
    mob.survivalCampAggroTimer = 0;
    mob.survivalCampReturning = false;
    mob.survivalTargetPlayerId = "";
    mob.survivalCampOrphanedByAggro = false;
    clearSurvivalCampMigrationState(mob);
    if (mob.survivalEncounterType === "camp") {
      mob.survivalEncounterType = "";
      mob.survivalEncounterId = "";
      mob.survivalCampBudget = 0;
      mob.survivalCampBand = "";
    }
  }

  function survivalCampMigrationTarget(state, mob) {
    const migrationCampId = String(mob && mob.survivalMigrationCampId || "");
    if (migrationCampId) {
      const anchor = survivalCampAnchorPoint(
        state,
        migrationCampId,
        finiteOr(mob.survivalMigrationCampX, mob.x),
        finiteOr(mob.survivalMigrationCampY, mob.y)
      );
      if (anchor.hasCampBody) {
        return {
          campId: migrationCampId,
          x: anchor.x,
          y: anchor.y
        };
      }
    }
    return nearestSurvivalCampAnchor(state, mob.survivalCampId, mob.x, mob.y);
  }

  function updateOrphanedSurvivalCampMobMigration(state, mob, dt) {
    const targetCamp = survivalCampMigrationTarget(state, mob);
    if (!targetCamp) {
      mob.survivalCampId = "";
      mob.survivalEncounterType = "migration";
      mob.survivalEncounterId = "";
      clearSurvivalCampMigrationState(mob);
      return true;
    }

    mob.survivalMigrationCampId = targetCamp.campId;
    mob.survivalMigrationCampX = targetCamp.x;
    mob.survivalMigrationCampY = targetCamp.y;
    mob.survivalCampReturning = true;
    mob.survivalCampAggroTimer = 0;
    mob.survivalTargetPlayerId = "";
    mob.survivalCampOrphanedByAggro = false;

    const dx = targetCamp.x - mob.x;
    const dy = targetCamp.y - mob.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = Math.hypot(finiteOr(mob.vx, 0), finiteOr(mob.vy, 0));
    if (distance <= SURVIVAL_CAMP_IDLE_RADIUS * 0.58 && speed < 130) {
      mob.survivalCampId = targetCamp.campId;
      mob.survivalCampX = targetCamp.x;
      mob.survivalCampY = targetCamp.y;
      mob.survivalCampReturning = false;
      mob.survivalCampSlotAngle = Math.atan2(finiteOr(mob.y, targetCamp.y) - targetCamp.y, finiteOr(mob.x, targetCamp.x) - targetCamp.x);
      mob.survivalCampSlotRadius = clamp(distance, 120, SURVIVAL_CAMP_IDLE_RADIUS);
      mob.survivalEncounterType = "camp";
      mob.survivalEncounterId = targetCamp.campId;
      const resident = allCombatMobs(state.world).find((candidate) => candidate && candidate !== mob && candidate.health > 0 && candidate.survivalCampId === targetCamp.campId);
      if (resident) {
        mob.survivalCampBand = resident.survivalCampBand || mob.survivalCampBand || "starter";
        mob.survivalCampBudget = Math.max(finiteOr(mob.survivalCampBudget, 0), finiteOr(resident.survivalCampBudget, 0));
      }
      clearSurvivalCampMigrationState(mob);
      clearSurvivalCampAttackState(mob);
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const previousDirX = finiteOr(mob.survivalMigrationDirX, nx);
    const previousDirY = finiteOr(mob.survivalMigrationDirY, ny);
    const alignment = previousDirX * nx + previousDirY * ny;
    mob.survivalMigrationStraightTime = alignment > 0.96
      ? Math.min(8, finiteOr(mob.survivalMigrationStraightTime, 0) + dt)
      : Math.max(0, finiteOr(mob.survivalMigrationStraightTime, 0) - dt * 2.5);
    mob.survivalMigrationDirX = nx;
    mob.survivalMigrationDirY = ny;
    const momentum = clamp(mob.survivalMigrationStraightTime / 7, 0, 1);
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const travelForce = 190 + momentum * 240;
    mob.vx += nx * travelForce * dt + tangentX * 12 * (1 - momentum) * dt;
    mob.vy += ny * travelForce * dt + tangentY * 12 * (1 - momentum) * dt;
    mob.vx *= Math.pow(0.88, dt);
    mob.vy *= Math.pow(0.88, dt);
    const nextSpeed = Math.hypot(mob.vx, mob.vy);
    const cruiseSpeed = 250 + (SURVIVAL_MIGRATION_MAX_SPEED - 250) * momentum;
    const maxSpeed = distance < 2400 ? clamp(120 + distance * 0.2, 150, cruiseSpeed) : cruiseSpeed;
    if (nextSpeed > maxSpeed) {
      mob.vx = (mob.vx / nextSpeed) * maxSpeed;
      mob.vy = (mob.vy / nextSpeed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
    return true;
  }

  function updateSurvivalCampMobHome(state, mob, dt) {
    if (mob && mob.survivalEncounterType === "salvage" && mob.survivalSalvageBodyId) {
      return false;
    }

    const campMob = isSurvivalCampMob(state, mob);
    const migratingMob = isSurvivalMigratingMob(state, mob) || Boolean(mob && !isPlayerTeamMob(mob) && !isHordeGameMode(state && state.gameMode) && !mob.survivalCampId && mob.survivalEncounterType !== "hit-squad");
    if (!campMob && !migratingMob) return false;

    mob.survivalCampAggroTimer = Math.max(0, finiteOr(mob.survivalCampAggroTimer, 0) - dt);
    if (!campMob) {
      mob.survivalEncounterType = "migration";
      const nearbyPlayer = nearbySurvivalMigrationPlayer(state, mob);
      if (nearbyPlayer) {
        mob.survivalCampAggroTimer = SURVIVAL_MIGRATION_AGGRO_DURATION;
        mob.survivalTargetPlayerId = String(nearbyPlayer.id || "");
      }
      if (mob.survivalCampAggroTimer > 0 && mob.survivalTargetPlayerId) {
        return false;
      }
      mob.survivalTargetPlayerId = "";
      return updateOrphanedSurvivalCampMobMigration(state, mob, dt);
    }
    let campAnchor = survivalCampAnchorPoint(state, mob.survivalCampId, finiteOr(mob.survivalCampX, mob.x), finiteOr(mob.survivalCampY, mob.y));
    if (!campAnchor.hasCampBody) {
      if (mob.survivalCampAggroTimer > 0) {
        mob.survivalCampOrphanedByAggro = true;
        clearSurvivalCampMigrationState(mob);
        return false;
      }
      mob.survivalTargetPlayerId = "";
      if (mob.survivalCampOrphanedByAggro) {
        mob.survivalCampOrphanedByAggro = false;
      }
      if (updateOrphanedSurvivalCampMobMigration(state, mob, dt)) {
        return true;
      }
      return false;
    }
    const campX = campAnchor.x;
    const campY = campAnchor.y;
    mob.survivalCampX = campX;
    mob.survivalCampY = campY;
    const leashRadius = Math.max(600, finiteOr(mob.survivalCampLeashRadius, SURVIVAL_CAMP_LEASH_RADIUS));
    const homeDx = campX - mob.x;
    const homeDy = campY - mob.y;
    const homeDistance = Math.hypot(homeDx, homeDy);

    if (mob.survivalCampAggroTimer > 0) {
      return false;
    }

    if (homeDistance > leashRadius || mob.survivalCampAggroTimer <= 0) {
      mob.survivalCampAggroTimer = 0;
      mob.survivalCampReturning = homeDistance > SURVIVAL_CAMP_RETURN_RADIUS;
      if (mob.survivalEncounterType === "camp") {
        mob.survivalTargetPlayerId = "";
      }
      clearSurvivalCampAttackState(mob);
    }

    const time = simTime(state);
    const slotAngle = finiteOr(mob.survivalCampSlotAngle, finiteOr(mob.wobble, 0)) + Math.sin(time * 0.16 + finiteOr(mob.wobble, 0)) * 0.18;
    const slotRadius = clamp(finiteOr(mob.survivalCampSlotRadius, SURVIVAL_CAMP_IDLE_RADIUS * 0.65), 120, SURVIVAL_CAMP_IDLE_RADIUS);
    const targetX = campX + Math.cos(slotAngle) * slotRadius;
    const targetY = campY + Math.sin(slotAngle) * slotRadius;
    const toTargetX = targetX - mob.x;
    const toTargetY = targetY - mob.y;
    const targetDistance = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / targetDistance;
    const ny = toTargetY / targetDistance;
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const returnForce = homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 176 : targetDistance > 120 ? 92 : 22;
    const strafeForce = targetDistance < 240 ? 48 : 18;

    mob.vx += nx * returnForce * dt + tangentX * strafeForce * dt;
    mob.vy += ny * returnForce * dt + tangentY * strafeForce * dt;
    mob.vx += Math.sin(time * 0.7 + finiteOr(mob.wobble, 0)) * 9 * dt;
    mob.vy += Math.cos(time * 0.63 + finiteOr(mob.wobble, 0)) * 9 * dt;
    mob.vx *= Math.pow(homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 0.76 : 0.62, dt);
    mob.vy *= Math.pow(homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 0.76 : 0.62, dt);

    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 250 : 118;
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    if (homeDistance <= SURVIVAL_CAMP_RETURN_RADIUS * 0.72) {
      mob.survivalCampReturning = false;
    }
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
    return true;
  }

  function updateMobs(state, dt, options) {
    const players = combatTargetsForMobs(state);
    if (!players.length) {
      updateRivalProjectiles(state, dt, options);
      return;
    }
    const seedHolder = { seed: state.seed >>> 0 };
    for (const collectionName of MOB_COLLECTIONS) {
      const list = state.world[collectionName] || [];
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const mob = list[i];
        ensureMobMechanics(mob, seedHolder);
        mob.hitCooldown = Math.max(0, finiteOr(mob.hitCooldown, 0) - dt);
        mob.disabledTimer = Math.max(0, finiteOr(mob.disabledTimer, 0) - dt);
        if (finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0)) {
          mob.summonAge = Math.min(mob.summonDuration, finiteOr(mob.summonAge, 0) + dt);
          const progress = clamp(mob.summonAge / Math.max(0.001, mob.summonDuration), 0, 1);
          const eased = progress * progress * (3 - progress * 2);
          mob.radius = Math.max(0.1, finiteOr(mob.summonBaseRadius, mob.radius) * eased);
          mob.rotation = finiteOr(mob.rotation, 0) + finiteOr(mob.summonSpinSpeed, 0) * (1 - progress * 0.65) * dt;
        } else if (finiteOr(mob.summonDuration, 0) > 0) {
          mob.radius = Math.max(1, finiteOr(mob.summonBaseRadius, mob.radius));
          mob.summonDuration = 0;
          mob.summonAge = 0;
          mob.summonSpinSpeed = 0;
        }
        mob.bossBodyEvadeTimer = Math.max(0, finiteOr(mob.bossBodyEvadeTimer, 0) - dt);
        if (mob.bossBodyEvadeTimer <= 0) {
          mob.bossBodyEvadeSpeedCap = 0;
        }
        if (mob.kind === "ufo" || mob.tractorDisabledTimer !== undefined) {
          mob.tractorDisabledTimer = Math.max(0, finiteOr(mob.tractorDisabledTimer, 0) - dt);
        }
        mob.flash = Math.max(0, finiteOr(mob.flash, 0) - dt);
        tickMobBodyImpactCooldowns(mob, dt);
        if (mob.health <= 0) {
          list.splice(i, 1);
          continue;
        }
        if (finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0)) {
          continue;
        }
        if (!isPlayerTeamMob(mob) && mob.survivalEncounterType === "hit-squad") {
          list.splice(i, 1);
          continue;
        }
        let mobTargets = isPlayerTeamMob(mob) && activeFamiliarCommand(mob)
          ? []
          : isPlayerTeamMob(mob) ? familiarHostileTargets(state.world, mob) : players;
        if (!isPlayerTeamMob(mob) && (isSurvivalCampMob(state, mob) || isSurvivalMigratingMob(state, mob))) {
          const targetId = String(mob.survivalTargetPlayerId || "");
          const target = targetId ? state.players && state.players[targetId] : null;
          mobTargets = target && finiteOr(target.health, 0) > 0 && !target.spacecraftInterior ? [target] : [];
        }
        if (updateSurvivalCampMobHome(state, mob, dt)) {
          continue;
        }
        if (!mobTargets.length && !(mob.kind === "ufo" && mob.survivalSalvageBodyId)) {
          if (isPlayerTeamMob(mob)) {
            updateFamiliarMob(state, mob, dt);
          }
          continue;
        }
        updateBossSpawnPressure(state, mob);
        if (isMobDisabled(mob)) {
          updateDisabledMobDrift(state, mob, dt);
          continue;
        }
        if (collectionName === "alienoids" || mob.kind === "alienoid") {
          updateAlienoid(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "ufos" || mob.kind === "ufo") {
          updateUfo(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "rambots" || mob.kind === "rambot") {
          updateRambot(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "engineers" || mob.kind === "engineer") {
          updateEngineer(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "teslas" || mob.kind === "tesla") {
          updateTesla(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "rockets" || mob.kind === "rocket" || mob.kind === "satellite") {
          updateRocketMob(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "fighters" || mob.kind === "fighter") {
          updateFighter(state, mob, mobTargets, dt, seedHolder);
        }
      }
    }
    updateRivalProjectiles(state, dt, options);
    resolveMobBodyCollisions(state);
    resolveMobProjectileCollisions(state);
    state.seed = seedHolder.seed >>> 0;
  }

  function applyGadgets(state, inputs, dt) {
    const players = state.players || {};
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    for (const [playerId, player] of Object.entries(players)) {
      const input = sanitizeInput(inputs[playerId], player, { dt, requireEnergy: true, allowCommittedToolMode: true });
      if (!input || player.health <= 0 || player.spacecraftInterior) {
        continue;
      }
      for (const body of state.world.particles) {
        if (!canPlayerGadgetAffectBody(state.world, player, body)) {
          continue;
        }
        applyGadgetForces(body, player, input, dt);
        drainBodyWithViciousVacuum(state, seedHolder, player, input, body, dt);
      }
      for (const pickup of state.world.techPickups) {
        applyGadgetForces(pickup, player, input, dt, { pickup: true, pullTowardActor: true });
      }
      for (const pickup of state.world.healthPickups) {
        applyGadgetForces(pickup, player, input, dt, { pickup: true });
      }
      for (const beacon of state.world.mobBeacons || []) {
        if (beacon && finiteOr(beacon.health, 0) > 0) {
          if (applyGadgetForces(beacon, player, input, dt, { captureInFunnel: false })) {
            beacon.gadgetForceTimer = 0.18;
          }
        }
      }
      if (isViciousVacuumToolId(input.equippedTool)) {
        for (const mob of allCombatMobs(state.world)) {
          applyViciousVacuumToMob(state, player, input, mob, dt);
        }
      }
    }
    state.seed = seedHolder.seed >>> 0;
  }

  function resolveGadgetBuckets(state, inputs, dt) {
    const players = state.players || {};
    for (const [playerId, player] of Object.entries(players)) {
      if (!player || player.health <= 0 || player.spacecraftInterior || !isSuctionToolId(player.equippedTool)) {
        continue;
      }
      const input = sanitizeInput(inputs[playerId], player, { dt, requireEnergy: true, allowCommittedToolMode: true });
      for (const body of state.world.particles) {
        if (!canPlayerGadgetAffectBody(state.world, player, body)) {
          continue;
        }
        resolveFunnelBucket(body, player, input, dt);
      }
    }
  }

  function step(state, inputsByPlayerId, options) {
    if (!state || !state.world || !state.players) {
      return state;
    }
    const dt = clamp(options && options.dt, 0.001, 0.05) || TICK_DT;
    const enableMobs = Boolean(options && options.enableMobs === true);
    const inputs = inputsByPlayerId && typeof inputsByPlayerId === "object" ? inputsByPlayerId : {};
    state.gameMode = normalizeGameMode(options && options.gameMode || state.gameMode || state.world && state.world.gameMode);
    state.world.gameMode = state.gameMode;
    state.events = [];
    state._mobDamageParticles = [];
    state._emitMobDamageParticles = !options || options.emitMobDamageParticles !== false;
    for (const [playerId, player] of Object.entries(state.players)) {
      stepPlayer(state, player, inputs[playerId] || {}, dt);
    }
    applyGadgets(state, inputs, dt);
    applyLocalBodyGravity(state, dt);
    for (const body of state.world.particles) {
      integrateBody(state, body, dt, state.tick);
    }
    updateBodyEnergySystems(state, dt);
    updateStructures(state, inputs, dt);
    syncLandedPlayersToSurfaces(state);
    updateAmbientParticleSpawning(state);
    updateRandomEvents(state, dt);
    updateSpacecrafts(state, dt);
    resolveGadgetBuckets(state, inputs, dt);
    resolvePlayerBodyCollisions(state);
    mergeParticles(state);
    syncStructuresToSurfaces(state, true);
    syncLandedPlayersToSurfaces(state);
    updatePickups(state, dt);
    if (enableMobs) {
      updateMobSpawns(state, dt);
      updateMobs(state, dt, options);
    } else {
      updateRivalProjectiles(state, dt, options);
    }
    flushMobDamageParticles(state);
    delete state._mobDamageParticles;
    delete state._emitMobDamageParticles;
    state.tick = Math.max(0, Math.floor(finiteOr(state.tick, 0))) + 1;
    return state;
  }

  function serializePlayers(players) {
    const result = {};
    const source = players && typeof players === "object" ? players : {};
    for (const [playerId, player] of Object.entries(source)) {
      const cloned = clonePlayer(player);
      if (cloned) {
        result[playerId] = cloned;
      }
    }
    return result;
  }

  function serializeMobSpawnTimers(world) {
    const result = {};
    const source = world && world.mobSpawnTimers && typeof world.mobSpawnTimers === "object" ? world.mobSpawnTimers : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = finiteOr(source[kind], MOB_SPAWN_INTERVALS[kind]);
    }
    return result;
  }

  function serializeMobDefeats(world) {
    const result = {};
    const source = world && world.mobDefeatsByKind && typeof world.mobDefeatsByKind === "object" ? world.mobDefeatsByKind : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = Math.max(0, Math.floor(finiteOr(source[kind], 0)));
    }
    return result;
  }

  function serializeMobBossDefeats(world) {
    const result = {};
    const source = world && world.mobBossDefeatsByKind && typeof world.mobBossDefeatsByKind === "object" ? world.mobBossDefeatsByKind : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = Math.max(0, Math.floor(finiteOr(source[kind], 0)));
    }
    return result;
  }

  function serializeMobBossProgress(world) {
    const result = {};
    const source = world && world.mobBossProgressByKind && typeof world.mobBossProgressByKind === "object" ? world.mobBossProgressByKind : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = clamp(Math.floor(finiteOr(source[kind], 0)), 0, MOB_BOSS_DEFEATS_TO_UNLOCK);
    }
    return result;
  }

  function serializeMobBossWarnings(world) {
    const result = {};
    const source = world && world.mobBossWarnings && typeof world.mobBossWarnings === "object" ? world.mobBossWarnings : {};
    for (const kind of MOB_TIER_ORDER) {
      const warning = source[kind] && typeof source[kind] === "object" ? source[kind] : {};
      result[kind] = {
        active: Boolean(warning.active),
        timer: clamp(finiteOr(warning.timer, 0), 0, MOB_BOSS_WARNING_DURATION),
        lastNoticeSecond: Math.floor(finiteOr(warning.lastNoticeSecond, -1))
      };
    }
    return result;
  }

  function serializeNextMobIds(world) {
    const result = {};
    const source = world && world.nextMobIds && typeof world.nextMobIds === "object" ? world.nextMobIds : {};
    for (const kind of MOB_TIER_ORDER) {
      result[kind] = Math.max(1, Math.floor(finiteOr(source[kind], 1)));
    }
    return result;
  }

  function serializeWorld(world, options) {
    const source = world && typeof world === "object" ? world : {};
    const includeCosmetic = !(options && options.compact === true);
    const result = {
      particles: Array.isArray(source.particles) ? source.particles.map(serializeParticleState).filter(Boolean) : [],
      techPickups: Array.isArray(source.techPickups) ? source.techPickups.map((pickup) => serializePickupState(pickup, "tech")).filter(Boolean) : [],
      healthPickups: Array.isArray(source.healthPickups) ? source.healthPickups.map((pickup) => serializePickupState(pickup, "health")).filter(Boolean) : [],
      alienoids: Array.isArray(source.alienoids) ? source.alienoids.map(serializeLiveMobState).filter(Boolean) : [],
      ufos: Array.isArray(source.ufos) ? source.ufos.map(serializeLiveMobState).filter(Boolean) : [],
      rambots: Array.isArray(source.rambots) ? source.rambots.map(serializeLiveMobState).filter(Boolean) : [],
      engineers: Array.isArray(source.engineers) ? source.engineers.map(serializeLiveMobState).filter(Boolean) : [],
      teslas: Array.isArray(source.teslas) ? source.teslas.map(serializeLiveMobState).filter(Boolean) : [],
      rockets: Array.isArray(source.rockets) ? source.rockets.map(serializeLiveMobState).filter(Boolean) : [],
      fighters: Array.isArray(source.fighters) ? source.fighters.map(serializeLiveMobState).filter(Boolean) : [],
      mobBeacons: isHordeGameMode(source.gameMode) && Array.isArray(source.mobBeacons) ? source.mobBeacons.map(serializeEntityState).filter(Boolean) : [],
      rivalProjectiles: Array.isArray(source.rivalProjectiles) ? source.rivalProjectiles.map(serializeEntityState).filter(Boolean) : [],
      structures: Array.isArray(source.structures) ? clone(source.structures) : [],
      spacecrafts: Array.isArray(source.spacecrafts) ? source.spacecrafts.map(serializeSpacecraftState).filter(Boolean) : [],
      claimedTechPickupIds: serializeClaimedPickupIds(source.claimedTechPickupIds),
      claimedHealthPickupIds: serializeClaimedPickupIds(source.claimedHealthPickupIds),
      nextParticleId: Math.max(1, Math.floor(finiteOr(source.nextParticleId, 1))),
      nextTechPickupId: Math.max(1, Math.floor(finiteOr(source.nextTechPickupId, 1))),
      nextHealthPickupId: Math.max(1, Math.floor(finiteOr(source.nextHealthPickupId, 1))),
      nextMobBeaconId: Math.max(1, Math.floor(finiteOr(source.nextMobBeaconId, 1))),
      nextSurvivalCampId: Math.max(1, Math.floor(finiteOr(source.nextSurvivalCampId, 1))),
      nextRivalProjectileId: Math.max(1, Math.floor(finiteOr(source.nextRivalProjectileId, 1))),
      nextStructureId: Math.max(
        1,
        Math.floor(finiteOr(source.nextStructureId, 1)),
        Array.isArray(source.structures)
          ? source.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
          : 1
      ),
      nextSpacecraftId: Math.max(
        1,
        Math.floor(finiteOr(source.nextSpacecraftId, 1)),
        Array.isArray(source.spacecrafts)
          ? source.spacecrafts.reduce((largest, craft) => Math.max(largest, Math.floor(finiteOr(craft && craft.id, 0)) + 1), 1)
          : 1
      ),
      nextMobIds: serializeNextMobIds(source),
      mobSpawnTimers: serializeMobSpawnTimers(source),
      mobWaveTimer: clamp(finiteOr(source.mobWaveTimer, difficultyMobWaveInterval(source)), 0, difficultyMobWaveInterval(source)),
      mobWaveCount: Math.max(0, Math.floor(finiteOr(source.mobWaveCount, 0))),
      mobDefeatsByKind: serializeMobDefeats(source),
      mobBossDefeatsByKind: serializeMobBossDefeats(source),
      mobBossProgressByKind: serializeMobBossProgress(source),
      mobBossWarnings: serializeMobBossWarnings(source),
      mobSpawnRestTimer: clamp(finiteOr(source.mobSpawnRestTimer, 0), 0, MOB_SPAWN_REST_DURATION),
      mobSpawnRestDrainTimer: clamp(finiteOr(source.mobSpawnRestDrainTimer, 0), 0, MOB_SPAWN_REST_DRAIN_MAX_DURATION),
      mobSpawnRestCooldownTimer: clamp(finiteOr(source.mobSpawnRestCooldownTimer, MOB_SPAWN_REST_COOLDOWN), 0, MOB_SPAWN_REST_COOLDOWN),
      survivalSpawnState: serializeSurvivalSpawnState(source.survivalSpawnState),
      difficulty: String(source.difficulty || "medium"),
      gameMode: normalizeGameMode(source.gameMode),
      ambientParticleSpawning: source.ambientParticleSpawning === true,
      randomEvents: serializeRandomEventState(source.randomEvents)
    };
    if (includeCosmetic) {
      result.starDust = Array.isArray(source.starDust) ? clone(source.starDust) : [];
    }
    return result;
  }

  function serializeClaimedPickupIds(source) {
    const values = Array.isArray(source) ? source.map(String).filter(Boolean) : [];
    if (values.length <= PICKUP_CLAIM_HISTORY_LIMIT) {
      return values;
    }
    return values.slice(values.length - PICKUP_CLAIM_HISTORY_LIMIT);
  }

  function serializeState(state) {
    const source = state && typeof state === "object" ? state : {};
    const gameMode = normalizeGameMode(source.gameMode || source.world && source.world.gameMode);
    const world = serializeWorld(source.world, { compact: true });
    world.gameMode = gameMode;
    if (gameMode === "survival") {
      world.mobBeacons = [];
    }
    return {
      version: VERSION,
      tick: Math.max(0, Math.floor(finiteOr(source.tick, 0))),
      seed: finiteOr(source.seed, 0) >>> 0,
      difficulty: String(source.difficulty || "medium"),
      gameMode,
      players: serializePlayers(source.players),
      world,
      events: Array.isArray(source.events) ? source.events.map((event) => event && typeof event === "object" ? { ...event } : event).filter(Boolean) : []
    };
  }

  function replayFromSnapshot(snapshotState, inputs, options) {
    const state = serializeState(snapshotState);
    const pending = Array.isArray(inputs) ? inputs : [];
    const replayOptions = {
      dt: options && options.dt || TICK_DT,
      enableMobs: Boolean(options && options.enableMobs === true),
      emitMobDamageParticles: !options || options.emitMobDamageParticles !== false
    };
    for (const input of pending) {
      step(state, { [String(input.playerId || "")]: input }, replayOptions);
    }
    return state;
  }

  function replayLocalPlayerFromSnapshot(snapshotState, inputs, options) {
    const state = serializeState(snapshotState);
    const pending = Array.isArray(inputs) ? inputs : [];
    const dt = options && options.dt || TICK_DT;
    for (const input of pending) {
      const playerId = String(input && input.playerId || "");
      const local = state.players && state.players[playerId];
      if (!local) {
        continue;
      }
      state._mobDamageParticles = [];
      state._emitMobDamageParticles = false;
      stepPlayer(state, local, input, dt);
      applyGadgets(state, { [playerId]: input }, dt);
      syncLandedPlayersToSurfaces(state);
      updatePickups(state, dt);
      delete state._mobDamageParticles;
      delete state._emitMobDamageParticles;
      state.tick = Math.max(0, Math.floor(finiteOr(state.tick, 0))) + 1;
    }
    return state;
  }

  return {
    VERSION,
    TICK_RATE,
    TICK_DT,
    SNAPSHOT_RATE,
    SNAPSHOT_INTERVAL_TICKS,
    MAX_PLAYERS,
    DEFAULT_TOOL_ID,
    ENABLE_MOBS_BY_DEFAULT,
    createInitialState,
    addPlayer,
    setPlayerTeam,
    addTechToPlayer,
    craftTool,
    setEquippedTools,
    upgradeTool,
    placeStructure,
    transferContainerTech,
    transferStructureTech,
    setTradingPortOffer,
    removeTradingPortOffer,
    acceptTradingPortOffer,
    applyPlayerStatusEffect,
    spawnBody,
    spawnMob,
    spawnBoss,
    killAllMobs,
    forceRandomEvent,
    removePlayer,
    respawnPlayer,
    registerRandomEventDefinition,
    sanitizeInput,
    step,
    serializeState,
    replayFromSnapshot,
    replayLocalPlayerFromSnapshot,
    normalizePlayer,
    normalizeWorld,
    radiusFromMass,
    tierForMass,
    constants: {
      PLAYER_RADIUS,
      PLAYER_MAX_HEALTH,
      PLAYER_MAX_ENERGY,
      GADGET_FORCE_REACH,
      BODY_TIERS,
      TECH_KEYS,
      MOB_TIER_ORDER,
      HEALTH_DROP_BASE_CHANCES,
      DIFFICULTY_MOB_SETTINGS,
      SOLID_BODY_PLAYER_DAMAGE_SPEED
    },
    survival: {
      allowanceCosts: { ...SURVIVAL_ALLOWANCE_MOB_COSTS },
      mobAllowanceCost: survivalMobAllowanceCost,
      allowanceCandidateList: survivalAllowanceCandidateList,
      planAllowanceMobs: planSurvivalAllowanceMobs
    }
  };
});
