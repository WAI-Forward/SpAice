async function handleAccountRequest(request, response) {
  try {
    if (request.method !== "GET") {
      writeJson(response, 405, { ok: false, message: "Account endpoint requires GET." });
      return;
    }
    const session = await requireAccountSession(request);
    writeJson(response, 200, {
      ok: true,
      serverTime: Date.now(),
      sessionToken: extractSessionToken(request),
      account: publicAccount(session.account)
    });
  } catch (error) {
    writeJson(response, error && Number.isFinite(error.status) ? error.status : 401, {
      ok: false,
      message: error instanceof Error ? error.message : "Log in to use saved games."
    });
  }
}

function padMonthDayPart(value) {
  const number = Math.floor(Number(value));
  return number >= 1 && number <= 99 ? String(number).padStart(2, "0") : "";
}

function sanitizeMonthDay(value) {
  const raw = String(value || "").trim();
  let match = raw.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    match = raw.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
  }
  if (!match) {
    return "";
  }
  const month = padMonthDayPart(match[1]);
  const day = padMonthDayPart(match[2]);
  return month && day ? `${month}-${day}` : "";
}

function extractWaiBirthdayMonthDay(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const keys = [
    "birthday",
    "birthdate",
    "birth_date",
    "birthDate",
    "date_of_birth",
    "dateOfBirth",
    "dob",
    "birthday_month_day",
    "birth_month_day"
  ];
  for (const key of keys) {
    const value = sanitizeMonthDay(payload[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

async function handleSkinRequest(request, response, url) {
  try {
    const session = await requireWaiAccountSession(request);

    if (request.method === "GET" && url.pathname === "/api/skins") {
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        skins: skinCatalog.map(publicSkin),
        account: publicAccount(session.account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/skins/equip") {
      const body = await readJsonBody(request);
      const skinId = normalizeSkinId(body && body.skinId);
      const skin = skinById(skinId);
      if (!skin) {
        writeJson(response, 400, { ok: false, message: "Unknown store item." });
        return;
      }
      if (!accountOwnsSkin(session.account, skin)) {
        writeJson(response, 403, { ok: false, message: "Purchase this item before equipping it." });
        return;
      }

      const account = await setAccountEquippedSkin(session.account, skinId);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        skin: publicSkin(skin),
        account: publicAccount(account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/skins/checkout") {
      const body = await readJsonBody(request);
      const skinId = normalizeSkinId(body && body.skinId);
      const skin = skinById(skinId);
      if (!skin || !skin.priceId || skin.freeClaim === true || isDefaultSkinItem(skin)) {
        writeJson(response, 400, { ok: false, message: "Unknown paid store item." });
        return;
      }
      if (accountOwnsSkin(session.account, skin)) {
        writeJson(response, 409, { ok: false, message: "You already own this item." });
        return;
      }
      requireSkinAvailableForAccount(skin, session.account);

      const checkoutSession = await createSkinCheckoutSession(request, session.account, skin);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        id: checkoutSession.id,
        url: checkoutSession.url
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/skins/claim") {
      const body = await readJsonBody(request);
      const skinId = normalizeSkinId(body && body.skinId);
      const skin = skinById(skinId);
      if (!skin || skin.freeClaim !== true || isDefaultSkinItem(skin)) {
        writeJson(response, 400, { ok: false, message: "Unknown claimable store item." });
        return;
      }
      if (accountOwnsSkin(session.account, skin)) {
        writeJson(response, 409, { ok: false, message: "You already own this item." });
        return;
      }
      requireSkinAvailableForAccount(skin, session.account);

      const account = await grantAccountSkin(session.account, skin.id, { equip: true });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        skin: publicSkin(skin),
        account: publicAccount(account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/skins/checkout/confirm") {
      const body = await readJsonBody(request);
      const checkoutSessionId = sanitizeDebugText(body && body.sessionId, 200);
      if (!checkoutSessionId) {
        writeJson(response, 400, { ok: false, message: "Missing checkout session." });
        return;
      }

      const result = await confirmSkinCheckoutSession(checkoutSessionId, session.account);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        skin: publicSkin(result.skin),
        account: publicAccount(result.account)
      });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Skin endpoint not found." });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    logClusternautsError("skin request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "Skin request failed."
    });
  }
}

async function handleStripeWebhookRequest(request, response) {
  try {
    if (request.method !== "POST") {
      writeJson(response, 405, { ok: false, message: "Stripe webhook requires POST." });
      return;
    }

    const rawBody = await readRawBody(request);
    const event = verifyStripeWebhookEvent(rawBody, request.headers["stripe-signature"]);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await grantSkinFromStripeSession(event.data && event.data.object);
    }

    writeJson(response, 200, { received: true });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 400;
    logClusternautsError("stripe webhook error", {
      status,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "Stripe webhook failed."
    });
  }
}

async function handleStripeStatusRequest(request, response) {
  if (request.method !== "GET") {
    writeJson(response, 405, { ok: false, message: "Stripe status requires GET." });
    return;
  }

  const key = stripeSecretKey();
  const mode = stripeKeyMode(key);
  writeJson(response, 200, {
    ok: true,
    configured: Boolean(key),
    webhookConfigured: Boolean(stripeWebhookSecret()),
    mode,
    localConfigLoaded: Boolean(stripeLocalConfig && stripeLocalConfig.loaded),
    configSource: stripeLocalConfig && stripeLocalConfig.source || "",
    skinCheckoutPriceSource: mode === "test" && stripeTestSkinPriceId() ? "test-override" : "catalog",
    testSkinPriceConfigured: Boolean(stripeTestSkinPriceId())
  });
}

async function handleAuthRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/auth/debug") {
      const attemptId = authAttemptIdFromUrl(url);
      logClusternautsAuth("auth debug requested", {
        attemptId,
        request: authRequestDetails(request)
      });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        attemptId,
        events: attemptId ? authDebugEventsByAttempt.get(attemptId) || [] : []
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      logClusternautsAuth("session bootstrap requested", { request: authRequestDetails(request) });
      const session = await requireAccountSession(request);
      logClusternautsAuth("session bootstrap accepted", { username: session.account.username, request: authRequestDetails(request) });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        sessionToken: extractSessionToken(request),
        account: publicAccount(session.account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/portal-session") {
      const body = await readJsonBody(request);
      const attemptId = sanitizeAuthAttemptId(body && body.authDebugId) || authAttemptIdFromUrl(url);
      logClusternautsAuth("portal session redeem requested", {
        attemptId,
        hasTransfer: Boolean(body && body.transfer),
        transferLength: body && body.transfer ? String(body.transfer).length : 0,
        request: authRequestDetails(request)
      });
      const sessionToken = verifyPortalAuthTransfer(body && body.transfer, attemptId);
      const session = await requireAccountSession({ method: "POST", headers: { authorization: `Bearer ${sessionToken}` } });
      logClusternautsAuth("portal session redeem accepted", {
        attemptId,
        username: session.account.username,
        waiLinked: Boolean(session.account.waiUserId),
        request: authRequestDetails(request)
      });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        sessionToken,
        account: publicAccount(session.account)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readJsonBody(request);
      const result = await createAccountSession(body, true);
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJsonBody(request);
      const result = await createAccountSession(body, false);
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/crazygames") {
      const body = await readJsonBody(request);
      const result = await createCrazyGamesAccountSession(request, body);
      writeJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const token = extractSessionToken(request) || sanitizeDebugText((await readJsonBody(request))?.sessionToken, 200);
      if (token) {
        await deleteAccountSession(token);
      }
      response.setHeader("Set-Cookie", clearAccountSessionCookie(request));
      writeJson(response, 200, { ok: true, serverTime: Date.now() });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Auth endpoint not found." });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const attemptId = authAttemptIdFromUrl(url);
    logClusternautsAuth("auth request failed", {
      attemptId,
      method: request.method,
      path: url.pathname,
      status,
      message: error instanceof Error ? error.message : "unknown error",
      request: authRequestDetails(request)
    });
    logClusternautsError("auth request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error"
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "Account request failed."
    });
  }
}

