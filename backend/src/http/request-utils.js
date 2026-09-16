function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > maxJsonBodyBytes) {
        request.destroy();
        rejectBody(new Error("Request body too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolveBody(null);
        return;
      }

      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error("Invalid JSON."));
      }
    });

    request.on("error", rejectBody);
  });
}

function readRawBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let byteLength = 0;

    request.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      byteLength += buffer.length;
      if (byteLength > maxJsonBodyBytes) {
        request.destroy();
        rejectBody(new Error("Request body too large."));
        return;
      }
      chunks.push(buffer);
    });

    request.on("end", () => {
      resolveBody(Buffer.concat(chunks, byteLength));
    });

    request.on("error", rejectBody);
  });
}

function writeJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, number));
}

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^\w .:'-]/g, "").trim().slice(0, maxLength);
}

function sanitizeAccountUsername(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.toLowerCase().replace(/[^\w.-]/g, "").slice(0, 24);
}

function sanitizeManualSaveName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^\w .:'-]/g, "").trim().replace(/\s+/g, " ").slice(0, 32);
}

function sanitizeDebugText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function sanitizeClientErrorReport(body) {
  const report = body && typeof body === "object" ? body : {};
  return {
    kind: sanitizeDebugText(report.kind, 40) || "error",
    message: sanitizeDebugText(report.message, 500) || "Unknown client error",
    source: sanitizeDebugText(report.source, 500),
    line: Math.max(0, Math.floor(clampNumber(report.line, 0, 1000000))),
    column: Math.max(0, Math.floor(clampNumber(report.column, 0, 1000000))),
    stack: sanitizeDebugText(report.stack, 4000),
    userAgent: sanitizeDebugText(report.userAgent, 500),
    href: sanitizeDebugText(report.href, 500),
    timestamp: sanitizeDebugText(report.timestamp, 40)
  };
}

async function verifyCrazyGamesUserToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throwHttpError(401, "Invalid CrazyGames user token.");
  }

  let header = null;
  let payload = null;
  try {
    header = decodeJwtJson(parts[0]);
    payload = decodeJwtJson(parts[1]);
  } catch {
    throwHttpError(401, "Invalid CrazyGames user token.");
  }

  if (!header || header.alg !== "RS256") {
    throwHttpError(401, "Unsupported CrazyGames token signature.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Number.isFinite(Number(payload.exp)) && Number(payload.exp) <= nowSeconds) {
    throwHttpError(401, "CrazyGames user token expired.");
  }

  const signingInput = Buffer.from(parts[0] + "." + parts[1]);
  const signature = base64UrlToBuffer(parts[2]);
  let publicKey = await getCrazyGamesPublicKey(false);
  let verified = verifyRs256Signature(signingInput, signature, publicKey);

  if (!verified) {
    publicKey = await getCrazyGamesPublicKey(true);
    verified = verifyRs256Signature(signingInput, signature, publicKey);
  }

  if (!verified) {
    throwHttpError(401, "CrazyGames user token signature is invalid.");
  }

  const userId = sanitizeDebugText(payload.userId, 128);
  if (!userId) {
    throwHttpError(401, "CrazyGames user token is missing a user id.");
  }

  return {
    userId,
    gameId: sanitizeDebugText(payload.gameId, 80),
    username: sanitizeDebugText(payload.username, 80),
    profilePictureUrl: sanitizeDebugText(payload.profilePictureUrl, 300)
  };
}

function verifyRs256Signature(signingInput, signature, publicKey) {
  try {
    return crypto.verify("RSA-SHA256", signingInput, publicKey, signature);
  } catch {
    return false;
  }
}

function decodeJwtJson(segment) {
  return JSON.parse(base64UrlToBuffer(segment).toString("utf8"));
}

function base64UrlToBuffer(segment) {
  const value = String(segment || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

async function getCrazyGamesPublicKey(forceRefresh) {
  if (!forceRefresh && crazyGamesPublicKeyCache.publicKey && crazyGamesPublicKeyCache.expiresAt > Date.now()) {
    return crazyGamesPublicKeyCache.publicKey;
  }

  const data = await fetchJsonOverHttps(crazyGamesPublicKeyUrl, 3500);
  const publicKey = data && typeof data.publicKey === "string" ? data.publicKey : "";
  if (!publicKey) {
    throwHttpError(503, "Could not load CrazyGames public key.");
  }

  crazyGamesPublicKeyCache.publicKey = publicKey;
  crazyGamesPublicKeyCache.expiresAt = Date.now() + 5 * 60 * 1000;
  return publicKey;
}

function fetchJsonOverHttps(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: timeoutMs }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
        if (body.length > 100000) {
          request.destroy(new Error("CrazyGames public key response too large."));
        }
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error("CrazyGames public key request failed with status " + response.statusCode + "."));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("timeout", () => request.destroy(new Error("CrazyGames public key request timed out.")));
    request.on("error", reject);
  });
}

function applyCorsHeaders(request, response) {
  const allowedOrigin = allowedCorsOrigin(request.headers.origin);
  if (!allowedOrigin) {
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Ngrok-Skip-Browser-Warning");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Max-Age", "600");
  response.setHeader("Vary", "Origin");
}

function allowedCorsOrigin(origin) {
  if (!origin) {
    return "";
  }

  try {
    const parsedOrigin = new URL(origin);
    const hostName = parsedOrigin.hostname.toLowerCase();
    if (parsedOrigin.protocol !== "https:") {
      return "";
    }
    return isCrazyGamesHostName(hostName) || isItchHostName(hostName) || isGamePixHostName(hostName) ? origin : "";
  } catch {
    return "";
  }
}

function isCrazyGamesHostName(hostName) {
  const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
  const parts = host.split(".").filter(Boolean);
  const crazyGamesIndex = parts.indexOf("crazygames");
  if (crazyGamesIndex !== -1 && crazyGamesIndex >= parts.length - 3) {
    return true;
  }

  return (
    host === "crazygamesgame.com" ||
    host.endsWith(".crazygamesgame.com")
  );
}

function isItchHostName(hostName) {
  const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
  return (
    host === "itch.io" ||
    host.endsWith(".itch.io") ||
    host === "itch.zone" ||
    host.endsWith(".itch.zone")
  );
}

function isGamePixHostName(hostName) {
  const host = String(hostName || "").toLowerCase().replace(/\.$/, "");
  return host === "gamepix.com" || host.endsWith(".gamepix.com");
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function requestOrigin(request) {
  const proto = request.headers["x-forwarded-proto"] || "http";
  const hostName = request.headers["x-forwarded-host"] || request.headers.host || `127.0.0.1:${port}`;
  return `${proto}://${hostName}`;
}

function serviceBaseUrl(request) {
  return configuredPublicUrl || requestOrigin(request);
}

