  function initializeTechUi() {
    if (!techLedgerList || !buildMenuList) {
      return;
    }

    techLedgerList.textContent = "";
    if (buildMenuTech) {
      buildMenuTech.textContent = "";
    }

    for (const tech of techTypes) {
      techLedgerList.append(createTechRow(tech, "tech-row"));
    }

    createBuildFilterTabs();
    renderBuildMenuResources();
    updateTechUi();
    updateToolHotbar();
  }

  function updateTechUi() {
    if (!techLedgerList) {
      return;
    }

    for (const tech of techTypes) {
      const value = Math.floor(techInventory[tech.key] || 0).toString();
      const ledgerCount = techLedgerList.querySelector('[data-tech-key="' + tech.key + '"] .' + "tech-row__count");

      if (ledgerCount) {
        ledgerCount.textContent = value;
      }

      if (buildMenuTech) {
        const buildCount = buildMenuTech.querySelector('[data-tech-key="' + tech.key + '"] .' + "build-row__count");
        if (buildCount) {
          buildCount.textContent = value;
        }
      }
    }

    renderBuildMenu();
  }
