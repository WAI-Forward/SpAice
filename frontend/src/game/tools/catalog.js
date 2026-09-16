  const defaultToolId = "suction-gadget";
  const visciousVacuumToolId = "viscious-vacuum";
  const visciousVacuumMobDrainRate = 16;
  const visciousVacuumMobDrainTickInterval = 0.18;
  const visciousVacuumBodyDrainRate = 2.15;
  const visciousVacuumBodyDrainMinStrength = 0.1;
  const techTypes = [
    { key: "suction", label: "Suction Tech", color: "#58e2ff" },
    { key: "weapon", label: "Weapon Tech", color: "#ff73ad" },
    { key: "plating", label: "Plating Tech", color: "#ffd166" },
    { key: "energy", label: "Energy Tech", color: "#9dff7a" },
    { key: "repair", label: "Repair Tech", color: "#66e0b8" },
    { key: "target", label: "Target Tech", color: "#ffb858" },
    { key: "propulsion", label: "Propulsion Tech", color: "#a985ff" },
    { key: "shield", label: "Shield Tech", color: "#77a7ff" },
    { key: "communication", label: "Communication Tech", color: "#ffb86b" }
  ];
  const buildFilters = [
    { key: "all", label: "All" },
    { key: "tools", label: "Tools" },
    { key: "structures", label: "Structures" },
    // build:render:start
    { key: "skins", label: "Cosmetics" }
    // build:render:end
  ];
  const toolCatalog = [
    { id: defaultToolId, name: "Vacuum gadget", shortName: "Vacuum", color: "#58e2ff" },
    { id: visciousVacuumToolId, name: "Viscious Vacuum", shortName: "Viscious", color: "#ff5f87" },
    { id: "laser-pistol", name: "Laser pistol", shortName: "Pistol", color: "#ff73ad" },
    { id: "laser-rifle", name: "Laser rifle", shortName: "Rifle", color: "#ff73ad" },
    { id: "shotgun", name: "Shotgun", shortName: "Shotgun", color: "#ffdc7a" },
    { id: machineGunToolId, name: "Machine Gun", shortName: "MG", color: "#77a7ff" },
    { id: "spanner", name: "Spanner", shortName: "Spanner", color: "#66e0b8" },
    { id: empToolId, name: "EMP tool", shortName: "EMP", color: "#7ee8ff" },
    { id: familiarNetToolId, name: "Familiar Net", shortName: "Net", color: "#66e0b8" },
    { id: pistonPunchToolId, name: "Piston Punch", shortName: "Punch", color: "#ffd166" },
    { id: guidedLauncherToolId, name: "Guided Launcher", shortName: "Guided", color: "#ffb858" },
    { id: rocketSuitToolId, name: "Rocket Suit", shortName: "Rocket", color: "#a985ff" },
    { id: personalTetherToolId, name: "Personal Tether", shortName: "Tether", color: "#a985ff" }
  ];
