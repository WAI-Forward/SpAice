  function createCostRow(techKey, amount) {
    const tech = techByKey(techKey);
    const row = document.createElement("div");
    const label = document.createElement("dt");
    const value = document.createElement("dd");
    const owned = Math.floor(techInventory[techKey] || 0);

    row.className = "build-detail__cost-row";
    row.style.setProperty("--tech-color", tech ? tech.color : "#dffcff");
    label.textContent = tech ? tech.label : techKey;
    value.textContent = owned + "/" + amount;
    value.classList.toggle("is-short", owned < amount);

    row.append(label, value);
    return row;
  }

  function createBuildInfoRow(labelText, valueText, color) {
    const row = document.createElement("div");
    const label = document.createElement("dt");
    const value = document.createElement("dd");

    row.className = "build-detail__cost-row build-detail__cost-row--info";
    row.style.setProperty("--tech-color", color || "#58e2ff");
    label.textContent = labelText;
    value.textContent = valueText;
    row.append(label, value);
    return row;
  }

  function renderBuildMenuTechResources() {
    if (!buildMenuTech) {
      return;
    }
    buildMenuTech.textContent = "";
    for (const tech of techTypes) {
      const row = createTechRow(tech, "build-row");
      const count = row.querySelector(".build-row__count");
      if (count) {
        count.textContent = Math.floor(techInventory[tech.key] || 0).toString();
      }
      buildMenuTech.append(row);
    }
  }

  function renderSkinLockerResources() {
    if (!buildMenuTech) {
      return;
    }
    buildMenuTech.textContent = "";
    buildMenuTech.append(
      createBuildInfoRow(
        "Account",
        isAccountSignedIn() && accountState.waiLinked === true ? accountState.displayName || accountState.username : skinLoginLabel(),
        "#58e2ff"
      ),
      createBuildInfoRow("Owned", ownedStoreItemCount() + "/" + paidSkinCount(), "#66e0b8")
    );

    if (skinStatusMessage) {
      const status = document.createElement("div");
      status.className = "build-detail__status build-detail__status--skin";
      status.textContent = skinStatusMessage;
      buildMenuTech.append(status);
    }
  }

