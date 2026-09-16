function safeReturnPath(value) {
  const pathValue = String(value || "").trim();
  if (!pathValue || !pathValue.startsWith("/") || pathValue.startsWith("//")) {
    return "/";
  }
  if (pathValue.startsWith("/auth/launch/callback")) {
    return "/";
  }
  return pathValue;
}

function stripeSecretKey() {
  const explicitKey = sanitizeDebugText(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY, 300);
  if (explicitKey) {
    return explicitKey;
  }

  const keyMode = sanitizeDebugText(process.env.STRIPE_KEY_MODE || process.env.STRIPE_MODE, 30).toLowerCase();
  const preferTestKey = keyMode === "test" || (keyMode !== "live" && process.env.NODE_ENV !== "production");
  const configKey = preferTestKey
    ? stripeLocalConfigValue("test-key", "testKey", "secret-key", "secretKey", "api-key", "apiKey")
    : stripeLocalConfigValue("secret-key", "secretKey", "api-key", "apiKey");
  return sanitizeDebugText(
    configKey,
    300
  );
}

function stripeWebhookSecret() {
  return sanitizeDebugText(
    process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.STRIPE_ENDPOINT_SECRET ||
      stripeLocalConfigValue("webhook-secret", "webhookSecret", "endpoint-secret", "endpointSecret"),
    300
  );
}

function stripeKeyMode(key) {
  const value = String(key || stripeSecretKey() || "");
  if (value.startsWith("sk_test_") || value.startsWith("rk_test_")) {
    return "test";
  }
  if (value.startsWith("sk_live_") || value.startsWith("rk_live_")) {
    return "live";
  }
  return value ? "unknown" : "not-configured";
}

function stripeTestSkinPriceId() {
  return sanitizeDebugText(
    process.env.STRIPE_TEST_SKIN_PRICE_ID ||
      stripeLocalConfigValue("test-skin-price-id", "testSkinPriceId", "skin-test-price-id", "test-price", "testPrice") ||
      defaultStripeTestSkinPriceId,
    120
  );
}

function stripeTestSkinProductId() {
  return sanitizeDebugText(
    process.env.STRIPE_TEST_SKIN_PRODUCT_ID ||
      stripeLocalConfigValue("test-skin-product-id", "testSkinProductId", "skin-test-product-id", "test-product", "testProduct") ||
      defaultStripeTestSkinProductId,
    120
  );
}

function stripePaymentIdsForSkin(skin) {
  const kind = skin && skin.kind || "suit";
  if (stripeKeyMode() === "test" && stripeTestSkinPriceId() && kind === "suit") {
    return {
      priceId: stripeTestSkinPriceId(),
      productId: stripeTestSkinProductId()
    };
  }
  return {
    priceId: skin && skin.priceId || "",
    productId: skin && skin.productId || ""
  };
}

function requireStripeSecretKey() {
  const key = stripeSecretKey();
  if (!key) {
    throwHttpError(503, "Stripe is not configured.");
  }
  return key;
}

function skinCheckoutReturnUrl(request, outcome, skinId) {
  const baseUrl = serviceBaseUrl(request).replace(/\/+$/, "") + "/";
  const params = new URLSearchParams({
    skin_checkout: outcome,
    skin: skinId
  });
  const url = `${baseUrl}?${params.toString()}`;
  return outcome === "success" ? `${url}&session_id={CHECKOUT_SESSION_ID}` : url;
}

async function createSkinCheckoutSession(request, account, skin) {
  const paymentIds = stripePaymentIdsForSkin(skin);
  if (!paymentIds.priceId) {
    throwHttpError(503, "Stripe price is not configured.");
  }

  const form = {
    mode: "payment",
    allow_promotion_codes: "true",
    client_reference_id: account.username,
    success_url: skinCheckoutReturnUrl(request, "success", skin.id),
    cancel_url: skinCheckoutReturnUrl(request, "cancel", skin.id),
    "line_items[0][price]": paymentIds.priceId,
    "line_items[0][quantity]": "1",
    "metadata[username]": account.username,
    "metadata[skin_id]": skin.id,
    "metadata[price_id]": paymentIds.priceId,
    "metadata[product_id]": paymentIds.productId || ""
  };

  return stripeApiRequest("/checkout/sessions", {
    method: "POST",
    form
  });
}

async function confirmSkinCheckoutSession(checkoutSessionId, account) {
  const checkoutSession = await stripeApiRequest(`/checkout/sessions/${encodeURIComponent(checkoutSessionId)}`, {
    method: "GET"
  });
  const skin = skinFromStripeSession(checkoutSession);
  const username = sanitizeAccountUsername(checkoutSession.client_reference_id || checkoutSession.metadata && checkoutSession.metadata.username);
  if (username !== account.username) {
    throwHttpError(403, "Checkout session belongs to another account.");
  }
  if (!isStripeCheckoutPaid(checkoutSession)) {
    throwHttpError(409, "Payment has not completed yet.");
  }

  const saved = await grantAccountSkin(account, skin.id, { equip: true });
  return { account: saved, skin };
}

async function grantSkinFromStripeSession(checkoutSession) {
  if (!isStripeCheckoutPaid(checkoutSession)) {
    return null;
  }

  const username = sanitizeAccountUsername(checkoutSession.client_reference_id || checkoutSession.metadata && checkoutSession.metadata.username);
  const account = username ? await getAccount(username) : null;
  if (!account || !account.waiUserId) {
    logClusternautsError("stripe skin grant skipped", { reason: "account missing or not wai linked", username });
    return null;
  }

  const skin = skinFromStripeSession(checkoutSession);
  return grantAccountSkin(account, skin.id, { equip: true });
}

function skinFromStripeSession(checkoutSession) {
  const metadata = checkoutSession && checkoutSession.metadata && typeof checkoutSession.metadata === "object"
    ? checkoutSession.metadata
    : {};
  const skinId = normalizeSkinId(metadata.skin_id);
  const skin = skinById(skinId);
  if (!skin || !skin.priceId) {
    throwHttpError(400, "Checkout session does not reference a known skin.");
  }
  const paymentIds = stripePaymentIdsForSkin(skin);
  if (metadata.price_id && metadata.price_id !== paymentIds.priceId) {
    throwHttpError(400, "Checkout session price does not match the skin.");
  }
  return skin;
}

function isStripeCheckoutPaid(checkoutSession) {
  return Boolean(
    checkoutSession &&
    checkoutSession.object === "checkout.session" &&
    checkoutSession.status === "complete" &&
    checkoutSession.payment_status === "paid"
  );
}

async function stripeApiRequest(apiPath, options) {
  const key = requireStripeSecretKey();
  const method = options && options.method ? options.method : "GET";
  const headers = {
    Authorization: `Bearer ${key}`
  };
  let body;
  if (options && options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(options.form).toString();
  }

  let result;
  try {
    result = await fetch(`https://api.stripe.com/v1${apiPath}`, {
      method,
      headers,
      body
    });
  } catch (error) {
    throwHttpError(503, "Could not reach Stripe.");
  }

  const text = await result.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!result.ok) {
    const message = payload && payload.error && payload.error.message ? payload.error.message : `Stripe request failed with status ${result.status}.`;
    throwHttpError(502, message);
  }
  return payload;
}

function verifyStripeWebhookEvent(rawBody, signatureHeader) {
  const secret = stripeWebhookSecret();
  if (!secret) {
    throwHttpError(503, "Stripe webhook is not configured.");
  }

  const signatureParts = parseStripeSignatureHeader(signatureHeader);
  const timestamp = signatureParts.t;
  const signatures = signatureParts.v1;
  if (!timestamp || !signatures.length) {
    throwHttpError(400, "Stripe signature is missing.");
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    throwHttpError(400, "Stripe signature timestamp is outside tolerance.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const matched = signatures.some((signature) => {
    const actualBuffer = Buffer.from(signature, "hex");
    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  });
  if (!matched) {
    throwHttpError(400, "Stripe signature verification failed.");
  }

  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    throwHttpError(400, "Stripe webhook JSON was invalid.");
  }
}

function parseStripeSignatureHeader(signatureHeader) {
  const result = { t: "", v1: [] };
  for (const part of String(signatureHeader || "").split(",")) {
    const index = part.indexOf("=");
    if (index < 0) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t") {
      result.t = value;
    } else if (key === "v1" && /^[a-f0-9]+$/i.test(value)) {
      result.v1.push(value);
    }
  }
  return result;
}

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  }
  return cookies;
}

function buildAccountSessionCookie(request, token) {
  const secureRequest = requestOrigin(request).startsWith("https://");
  const secure = secureRequest ? "; Secure" : "";
  const sameSite = secureRequest ? "None" : "Lax";
  return `${accountSessionCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${Math.floor(sessionLifetimeMs / 1000)}${secure}`;
}

function clearAccountSessionCookie(request) {
  const secureRequest = requestOrigin(request).startsWith("https://");
  const secure = secureRequest ? "; Secure" : "";
  const sameSite = secureRequest ? "None" : "Lax";
  return `${accountSessionCookie}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`;
}

function throwHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

