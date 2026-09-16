  const toolUpgradeDefinitions = {
    "laser-pistol": [
      { id: "damage", name: "Damage", techKey: "weapon", cost: 3, bonusScale: 0.9 },
      { id: "range", name: "Range", techKey: "target", cost: 3, bonusScale: 0.9 }
    ],
    "laser-rifle": [
      { id: "damage", name: "Damage", techKey: "weapon", cost: 5, bonusScale: 0.9 },
      { id: "range", name: "Range", techKey: "target", cost: 5, bonusScale: 0.9 }
    ],
    shotgun: [
      { id: "damage", name: "Damage", techKey: "weapon", cost: 5, bonusScale: 0.9 },
      { id: "range", name: "Range", techKey: "propulsion", cost: 4, bonusScale: 0.9 }
    ],
    [machineGunToolId]: [
      { id: "damage", name: "Damage", techKey: "weapon", cost: 6, bonusScale: 0.9 },
      { id: "range", name: "Range", techKey: "target", cost: 5, bonusScale: 0.9 }
    ],
    spanner: [
      { id: "repair-speed", name: "Repair speed", techKey: "repair", cost: 3, bonusScale: 1.15 },
      { id: "dismantle-speed", name: "Dismantle speed", techKey: "weapon", cost: 3, bonusScale: 1.15 }
    ],
    [defaultToolId]: [
      { id: "suck", name: "Suck strength", techKey: "suction", cost: 3, bonusScale: 1.2 },
      { id: "blow", name: "Blow strength", techKey: "propulsion", cost: 3, bonusScale: 1.2 }
    ],
    [visciousVacuumToolId]: [
      { id: "suck", name: "Suck strength", techKey: "suction", cost: 4, bonusScale: 1.2 },
      { id: "blow", name: "Blow strength", techKey: "propulsion", cost: 4, bonusScale: 1.2 }
    ],
    [empToolId]: [
      { id: "range", name: "Pulse range", techKey: "target", cost: 5, bonusScale: 0.8 },
      { id: "duration", name: "Disable duration", techKey: "energy", cost: 5, bonusScale: 0.65 }
    ]
  };
