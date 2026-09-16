  function createTechRow(tech, className) {
    const row = document.createElement("div");
    const dot = document.createElement("span");
    const name = document.createElement("span");
    const count = document.createElement("strong");

    row.className = className;
    row.dataset.techKey = tech.key;
    row.style.setProperty("--tech-color", tech.color);
    dot.className = "tech-row__dot";
    name.className = className + "__name";
    count.className = className + "__count";
    name.textContent = tech.label;
    count.textContent = "0";

    row.append(dot, name, count);
    return row;
  }

  function closestEventTarget(event, selector) {
    return event.target instanceof Element ? event.target.closest(selector) : null;
  }

  function isEditableEventTarget(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName;
    return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function isBrowserScrollKey(event) {
    return event.code === "ArrowUp" || event.code === "ArrowDown" || event.code === "Space";
  }

  function isScrollableWheelEventTarget(event) {
    let node = event.target instanceof Element ? event.target : null;
    while (node && node !== document.body) {
      if (node instanceof HTMLElement) {
        const style = window.getComputedStyle(node);
        const scrollsY = (style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1;
        const scrollsX = (style.overflowX === "auto" || style.overflowX === "scroll") && node.scrollWidth > node.clientWidth + 1;
        if (scrollsY || scrollsX) {
          return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  function isKeyboardControlEventTarget(event) {
    const target = event.target;
    return target instanceof HTMLElement && Boolean(target.closest("button, a[href], [role='button'], [role='link'], [role='menuitem'], [role='tab']"));
  }

  function techByKey(key) {
    return techTypes.find((tech) => tech.key === key) || null;
  }

  function toolById(id) {
    return toolCatalog.find((tool) => tool.id === id) || toolCatalog[0];
  }

  function recipeById(id) {
    return buildRecipes.find((recipe) => recipe.id === id) || skinLockerRecipeById(id);
  }

  function recipeByStructureType(type) {
    return buildRecipes.find((recipe) => recipe.structureType === type) || null;
  }

  function skinById(id) {
    return skinCatalog.find((skin) => skin.id === id) || null;
  }

  function isTrailSkin(skin) {
    return Boolean(skin && skin.kind === "trail");
  }

