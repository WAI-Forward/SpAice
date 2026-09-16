function skinById(id) {
  return skinCatalog.find((skin) => skin.id === id) || null;
}

function isTrailSkin(skin) {
  return Boolean(skin && skin.kind === "trail");
}

function isDefaultSkinItem(skin) {
  return Boolean(skin && (skin.id === defaultSkinId || skin.id === defaultTrailId));
}

function normalizeSkinId(id) {
  const cleanId = sanitizeText(id, 64);
  return skinById(cleanId) ? cleanId : "";
}

function normalizeCharacterSkinId(id) {
  const skin = skinById(normalizeSkinId(id));
  return skin && !isTrailSkin(skin) ? skin.id : "";
}

function normalizeTrailId(id) {
  const skin = skinById(normalizeSkinId(id));
  return isTrailSkin(skin) ? skin.id : "";
}

function normalizeOwnedSkinIds(source) {
  const sourceList = Array.isArray(source) ? source : [];
  const seen = new Set();
  const result = [];
  for (const id of sourceList) {
    const skinId = normalizeCharacterSkinId(id);
    if (!skinId || skinId === defaultSkinId || seen.has(skinId)) {
      continue;
    }
    seen.add(skinId);
    result.push(skinId);
  }
  return result;
}

function normalizeOwnedTrailIds(source) {
  const sourceList = Array.isArray(source) ? source : [];
  const seen = new Set();
  const result = [];
  for (const id of sourceList) {
    const trailId = normalizeTrailId(id);
    if (!trailId || trailId === defaultTrailId || seen.has(trailId)) {
      continue;
    }
    seen.add(trailId);
    result.push(trailId);
  }
  return result;
}

function normalizeEquippedSkinId(source, ownedSkinIds) {
  const skinId = normalizeCharacterSkinId(source);
  if (!skinId || skinId === defaultSkinId) {
    return "";
  }
  return normalizeOwnedSkinIds(ownedSkinIds).includes(skinId) ? skinId : "";
}

function normalizeEquippedTrailId(source, ownedTrailIds) {
  const trailId = normalizeTrailId(source);
  if (!trailId || trailId === defaultTrailId) {
    return "";
  }
  return normalizeOwnedTrailIds(ownedTrailIds).includes(trailId) ? trailId : "";
}

function accountOwnsSkin(account, skin) {
  if (!skin) {
    return false;
  }
  if (skin.id === defaultSkinId || skin.id === defaultTrailId) {
    return true;
  }
  return isTrailSkin(skin)
    ? normalizeOwnedTrailIds(account && account.ownedTrailIds).includes(skin.id)
    : normalizeOwnedSkinIds(account && account.ownedSkinIds).includes(skin.id);
}

function publicSkin(skin) {
  const normalized = skinById(skin && skin.id);
  return normalized
    ? {
        id: normalized.id,
        name: normalized.name,
        kind: normalized.kind || "suit",
        plainColor: normalized.plainColor,
        priceLabel: normalized.priceId ? normalized.priceLabel || "GBP 2.00" : "Included",
        availability: normalized.availability || null,
        freeClaim: normalized.freeClaim === true
      }
    : null;
}

function currentMonthDay() {
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

function skinAvailabilityStatus(skin, account) {
  const availability = skin && skin.availability;
  if (!availability || typeof availability !== "object") {
    return { available: true, message: "" };
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const today = currentMonthDay();
  if (availability.type === "month") {
    return {
      available: month === Math.floor(Number(availability.month)),
      message: "This costume is not available right now."
    };
  }
  if (availability.type === "dates") {
    const dates = Array.isArray(availability.dates) ? availability.dates.map(sanitizeMonthDay) : [];
    return {
      available: dates.includes(today),
      message: "This costume is not available right now."
    };
  }
  if (availability.type === "birthday") {
    const birthday = sanitizeMonthDay(account && account.waiBirthdayMonthDay);
    return {
      available: Boolean(birthday && birthday === today),
      message: birthday ? "This costume is only available on your birthday." : "Add your birthday to your login account to claim this costume."
    };
  }
  return { available: true, message: "" };
}

function requireSkinAvailableForAccount(skin, account) {
  const status = skinAvailabilityStatus(skin, account);
  if (!status.available) {
    throwHttpError(403, status.message || "This costume is not available right now.");
  }
}

async function requireWaiAccountSession(request) {
  const session = await requireAccountSession(request);
  if (!session.account || !session.account.waiUserId) {
    throwHttpError(403, "Log in with WAi Forward to use skins.");
  }
  return session;
}

async function setAccountEquippedSkin(account, skinId) {
  const normalized = normalizeAccount(account);
  if (!normalized) {
    throwHttpError(401, "Account no longer exists.");
  }
  const cleanSkinId = normalizeSkinId(skinId);
  const skin = skinById(cleanSkinId);
  if (isTrailSkin(skin)) {
    normalized.equippedTrailId = cleanSkinId === defaultTrailId ? "" : normalizeEquippedTrailId(cleanSkinId, normalized.ownedTrailIds);
  } else {
    normalized.equippedSkinId = cleanSkinId === defaultSkinId ? "" : normalizeEquippedSkinId(cleanSkinId, normalized.ownedSkinIds);
  }
  return saveAccount(normalized);
}

async function grantAccountSkin(account, skinId, options) {
  const normalized = normalizeAccount(account);
  const cleanSkinId = normalizeSkinId(skinId);
  const skin = skinById(cleanSkinId);
  if (!normalized || !skin || isDefaultSkinItem(skin)) {
    return normalized;
  }

  if (isTrailSkin(skin)) {
    const owned = normalizeOwnedTrailIds(normalized.ownedTrailIds);
    if (!owned.includes(skin.id)) {
      owned.push(skin.id);
    }
    normalized.ownedTrailIds = owned;
    if (!options || options.equip !== false) {
      normalized.equippedTrailId = skin.id;
    } else {
      normalized.equippedTrailId = normalizeEquippedTrailId(normalized.equippedTrailId, owned);
    }
  } else {
    const owned = normalizeOwnedSkinIds(normalized.ownedSkinIds);
    if (!owned.includes(skin.id)) {
      owned.push(skin.id);
    }
    normalized.ownedSkinIds = owned;
    if (!options || options.equip !== false) {
      normalized.equippedSkinId = skin.id;
    } else {
      normalized.equippedSkinId = normalizeEquippedSkinId(normalized.equippedSkinId, owned);
    }
  }
  return saveAccount(normalized);
}

function publicAccount(account) {
  const normalized = normalizeAccount(account);
  return normalized
    ? {
        username: normalized.username,
        linkedPlayerId: normalized.linkedPlayerId,
        waiDisplayName: normalized.waiDisplayName,
        waiEmail: normalized.waiEmail,
        waiBirthdayMonthDay: normalized.waiBirthdayMonthDay,
        waiLinked: Boolean(normalized.waiUserId),
        crazyGamesUsername: normalized.crazyGamesUsername,
        crazyGamesProfilePictureUrl: normalized.crazyGamesProfilePictureUrl,
        crazyGamesLinked: Boolean(normalized.crazyGamesId),
        ownedSkinIds: normalizeOwnedSkinIds(normalized.ownedSkinIds),
        equippedSkinId: normalizeEquippedSkinId(normalized.equippedSkinId, normalized.ownedSkinIds),
        ownedTrailIds: normalizeOwnedTrailIds(normalized.ownedTrailIds),
        equippedTrailId: normalizeEquippedTrailId(normalized.equippedTrailId, normalized.ownedTrailIds),
        createdAt: normalized.createdAt
      }
    : null;
}

