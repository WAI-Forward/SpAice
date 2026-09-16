  const playerWeaponDefaults = {
    speed: 720,
    damage: 28,
    cooldown: 0.9,
    knockback: 260,
    movementSlow: 0.15,
    life: 0.68,
    length: 50,
    radius: 6,
    color: { r: 255, g: 115, b: 173 },
    label: "laser pistol"
  };
  const weaponDefinitions = {
    "laser-pistol": playerWeaponDefaults,
    "laser-rifle": {
      speed: 860,
      damage: 30,
      cooldown: 1.25,
      knockback: 260,
      movementSlow: 0.22,
      life: 0.78,
      length: 76,
      radius: 5,
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
      pelletCount: 9,
      spread: 0.28,
      color: { r: 255, g: 220, b: 122 },
      label: "shotgun"
    },
    [machineGunToolId]: {
      speed: 960,
      damage: 10,
      cooldown: 0.14,
      knockback: 95,
      movementSlow: 0.06,
      life: 0.72,
      length: 36,
      radius: 4.2,
      spread: 0.055,
      color: { r: 119, g: 167, b: 255 },
      label: "machine gun"
    }
  };
  playerWeaponDefaults.energyCost = 8;
  weaponDefinitions["laser-rifle"].energyCost = 12;
  weaponDefinitions.shotgun.energyCost = 16;
  weaponDefinitions[machineGunToolId].energyCost = 3;
