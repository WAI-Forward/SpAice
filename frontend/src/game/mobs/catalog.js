  const mobScoreValues = {
    alienoid: 100,
    ufo: 175,
    rambot: 240,
    tesla: 325,
    engineer: 400,
    satellite: 520,
    rocket: 560,
    fighter: 700
  };
  const mobEntityBlueprints = {
    alienoid: { label: "Alienoid", radius: 28, health: 100, speedJitter: 18, color: null },
    ufo: { label: "UFO", radius: 34, health: 130, speedJitter: 24, color: { r: 112, g: 226, b: 255 } },
    rambot: { label: "Rambot", radius: 38, health: 210, speedJitter: 10, color: { r: 184, g: 196, b: 204 } },
    engineer: { label: "Engineer", radius: 33, health: 140, speedJitter: 16, color: { r: 102, g: 224, b: 184 } },
    tesla: { label: "Tesla", radius: 32, health: 150, speedJitter: 18, color: { r: 157, g: 255, b: 122 } },
    satellite: { label: "Satellite", radius: 36, health: 180, speedJitter: 14, color: { r: 169, g: 133, b: 255 } },
    rocket: { label: "Rocket ship", radius: 34, health: 170, speedJitter: 44, color: { r: 169, g: 133, b: 255 } },
    fighter: { label: "Fighter ship", radius: 40, health: 230, speedJitter: 20, color: { r: 119, g: 167, b: 255 } }
  };
  const mobBeaconVisuals = {
    alienoid: { color: { r: 255, g: 115, b: 173 }, accent: { r: 255, g: 214, b: 238 }, shape: "eye" },
    ufo: { color: { r: 112, g: 226, b: 255 }, accent: { r: 224, g: 252, b: 255 }, shape: "saucer" },
    rambot: { color: { r: 184, g: 196, b: 204 }, accent: { r: 255, g: 209, b: 102 }, shape: "gear" },
    engineer: { color: { r: 102, g: 224, b: 184 }, accent: { r: 219, g: 255, b: 238 }, shape: "cross" },
    tesla: { color: { r: 157, g: 255, b: 122 }, accent: { r: 247, g: 255, b: 154 }, shape: "bolt" },
    satellite: { color: { r: 169, g: 133, b: 255 }, accent: { r: 232, g: 218, b: 255 }, shape: "dish" },
    rocket: { color: { r: 244, g: 150, b: 92 }, accent: { r: 255, g: 231, b: 126 }, shape: "flame" },
    fighter: { color: { r: 119, g: 167, b: 255 }, accent: { r: 222, g: 235, b: 255 }, shape: "chevron" }
  };
  const mobTierOrder = ["alienoid", "ufo", "rambot", "engineer", "tesla", "satellite", "rocket", "fighter"];
  const mobObjectivePluralLabels = {
    alienoid: "Alienoids",
    ufo: "UFOs",
    rambot: "Rambots",
    tesla: "Teslas",
    engineer: "Engineers",
    satellite: "Satellites",
    rocket: "Rocket ships",
    fighter: "Fighter ships"
  };
