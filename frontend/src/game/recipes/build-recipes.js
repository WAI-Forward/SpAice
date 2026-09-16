  const buildRecipes = [
    {
      id: defaultToolId,
      name: "Vacuum gadget",
      category: "tools",
      description: "Your default matter-moving gadget. Left click sucks objects inward, right click blows them away, and middle click steadies objects at reach while anchoring you in place.",
      cost: {},
      unlockToolId: defaultToolId,
      icon: "assets/vacuum-gadget.svg"
    },
    {
      id: "laser-pistol",
      name: "Laser pistol",
      category: "tools",
      description: "A compact sidearm that fires focused weapon-tech bolts.",
      cost: { weapon: 10, plating: 1 },
      unlockToolId: "laser-pistol",
      icon: "assets/laser-pistol.svg"
    },
    {
      id: "laser-rifle",
      name: "Laser rifle",
      category: "tools",
      description: "A long-barreled weapon that fires slower bolts through enemy lines.",
      cost: { weapon: 13, plating: 2, target: 3 },
      unlockToolId: "laser-rifle",
      icon: "assets/laser-rifle.svg"
    },
    {
      id: "spanner",
      name: "Spanner",
      category: "tools",
      description: "A repair tool that patches structures and dismantles mechanical mobs up close.",
      cost: { repair: 3, weapon: 10 },
      unlockToolId: "spanner",
      icon: "assets/spanner.svg"
    },
    {
      id: "shotgun",
      name: "Shotgun",
      category: "tools",
      description: "A recovered alienoid scattergun that fires a tight cluster of propulsion-charged weapon pellets.",
      cost: { weapon: 16, propulsion: 6, plating: 3 },
      unlockToolId: "shotgun",
      blueprintObjectiveId: "kill_alienoid_boss",
      icon: "assets/shotgun.svg"
    },
    {
      id: machineGunToolId,
      name: "Machine Gun",
      category: "tools",
      description: "A fighter boss blueprint for a rapid-fire weapon that pours out a steady stream of shield-blue rounds.",
      cost: { weapon: 22, target: 8, shield: 6 },
      unlockToolId: machineGunToolId,
      blueprintObjectiveId: "kill_fighter_boss",
      icon: "assets/machine-gun.svg"
    },
    {
      id: visciousVacuumToolId,
      name: "Viscious Vacuum",
      category: "tools",
      description: "A UFO-tuned vacuum that siphons mob health, strips matter from larger bodies, and blasts mobs back.",
      cost: { suction: 16, weapon: 6, energy: 3 },
      unlockToolId: visciousVacuumToolId,
      blueprintObjectiveId: "kill_ufo_boss",
      icon: "assets/vacuum-gadget.svg"
    },
    {
      id: empToolId,
      name: "EMP tool",
      category: "tools",
      description: "A Tesla-derived pulse emitter that disables nearby mobs and shuts down UFO beams.",
      cost: { energy: 16, target: 5, weapon: 6 },
      unlockToolId: empToolId,
      blueprintObjectiveId: "kill_tesla_boss",
      icon: "assets/emp-tool.svg"
    },
    {
      id: familiarNetToolId,
      name: "Familiar Net",
      category: "tools",
      description: "An engineer blueprint for catching one mob at a time. Left click swipes the net; right click releases the captured mob as a familiar.",
      cost: { repair: 16, target: 5, weapon: 6 },
      unlockToolId: familiarNetToolId,
      blueprintObjectiveId: "kill_engineer_boss",
      icon: "assets/familiar-net.svg"
    },
    {
      id: pistonPunchToolId,
      name: "Piston Punch",
      category: "tools",
      description: "A rambot blueprint that snaps a heavy head forward on a piston, damaging mobs and punching them away.",
      cost: { plating: 16, weapon: 8, propulsion: 4 },
      unlockToolId: pistonPunchToolId,
      blueprintObjectiveId: "kill_rambot_boss",
      icon: "assets/piston-punch.svg"
    },
    {
      id: guidedLauncherToolId,
      name: "Guided Launcher",
      category: "tools",
      description: "A satellite blueprint that launches a missile while you hold fire, then guides it along the path you drag with the mouse.",
      cost: { target: 16, propulsion: 8, weapon: 6 },
      unlockToolId: guidedLauncherToolId,
      blueprintObjectiveId: "kill_satellite_boss",
      icon: "assets/missile-launcher.svg"
    },
    {
      id: rocketSuitToolId,
      name: "Rocket Suit",
      category: "tools",
      description: "A rocket boss blueprint that reshapes your suit into a pointed rocket and accelerates you toward the cursor while left click is held.",
      cost: { propulsion: 18, plating: 7, energy: 5 },
      unlockToolId: rocketSuitToolId,
      blueprintObjectiveId: "kill_rocket_boss",
      icon: "assets/missile-launcher.svg"
    },
    {
      id: personalTetherToolId,
      name: "Personal Tether",
      category: "tools",
      description: "A suit-mounted tether. Left click anchors it to a non-star body, then jetpack to tug the body around. Right click with this tool selected detaches it.",
      cost: { suction: 6, plating: 3, propulsion: 2 },
      unlockToolId: personalTetherToolId,
      icon: "assets/tether.svg"
    },
    {
      id: "plating-block",
      name: "Plating block",
      category: "structures",
      description: "A plated body segment that extends walkable surface and supports more plates.",
      cost: { plating: 4 },
      structureType: "plating-block",
      icon: "assets/plating-block.svg"
    },
    {
      id: "battery",
      name: "Battery",
      category: "structures",
      description: "A charged surface cell that increases its host body's energy recovery.",
      cost: { energy: 5, plating: 3 },
      structureType: "battery",
      icon: "assets/battery.svg"
    },
    {
      id: "container",
      name: "Container",
      category: "structures",
      description: "A shared surface locker for storing tech resources. Anyone who can reach it can open it and move tech in or out.",
      cost: { plating: 6, repair: 2 },
      structureType: "container",
      icon: "assets/container.svg"
    },
    {
      id: "trading-port",
      name: "Trading Port",
      category: "structures",
      description: "A dock for an automated courier vessel. Stock it with tech and post buy offers for nearby ports and passing players.",
      cost: { plating: 8, propulsion: 5, communication: 3, repair: 2 },
      structureType: "trading-port",
      icon: "assets/trading-port.svg"
    },
    {
      id: "medbay",
      name: "Medbay",
      category: "structures",
      description: "A surface clinic that spends its host body's energy to slowly regenerate your health while you stand inside.",
      cost: { repair: 5, energy: 4, plating: 3 },
      structureType: "medbay",
      icon: "assets/medbay.svg"
    },
    {
      id: "accumulator",
      name: "Accumulator",
      category: "structures",
      description: "A suction-plated collector that pulls loose particles into its host body.",
      cost: { plating: 3, suction: 5, energy: 1 },
      structureType: "accumulator",
      icon: "assets/accumulator.svg"
    },
    {
      id: "turret",
      name: "Turret",
      category: "structures",
      description: "A folding surface turret that guards its host body from nearby mobs.",
      cost: { plating: 3, weapon: 5, energy: 1 },
      structureType: "turret",
      icon: "assets/turret.svg"
    },
    {
      id: "missile-launcher",
      name: "Missile launcher",
      category: "structures",
      description: "A plated launcher that fabricates guided missiles and fires them at clustered mobs.",
      cost: { plating: 5, weapon: 7, propulsion: 5, target: 4 },
      structureType: "missile-launcher",
      icon: "assets/missile-launcher.svg"
    },
    {
      id: "shield-generator",
      name: "Shield generator",
      category: "structures",
      description: "A shield-tech dome that blocks hostile fire and bounces mobs away from its host body while spending body energy.",
      cost: { plating: 4, shield: 5, energy: 3 },
      structureType: "shield-generator",
      icon: "assets/shield-generator.svg"
    },
    {
      id: "jet",
      name: "Jet",
      category: "structures",
      description: "A surface thruster that pushes its host body forward with W or reverses with S while you are landed there.",
      cost: { plating: 4, propulsion: 5, energy: 2 },
      structureType: "jet",
      icon: "assets/jet.svg"
    },
    {
      id: "tether",
      name: "Tether",
      category: "structures",
      description: "A telescoping pole that links two bodies with a little springy give.",
      cost: { suction: 2, plating: 1 },
      structureType: "tether",
      icon: "assets/tether.svg"
    },
    {
      id: "bridge",
      name: "Bridge",
      category: "structures",
      description: "A rigid plated span that welds two bodies together and lets you walk between them.",
      cost: { plating: 12, propulsion: 2 },
      structureType: "bridge",
      icon: "assets/bridge.svg"
    }
  ];
