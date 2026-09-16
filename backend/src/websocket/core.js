server.on("upgrade", (request, socket) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname !== "/ws") {
    logMultiplayer("ws upgrade rejected", { path: url.pathname });
    socket.destroy();
    return;
  }

  const key = request.headers["sec-websocket-key"];
  if (!key) {
    logMultiplayer("ws upgrade rejected", { reason: "missing sec-websocket-key" });
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      ""
    ].join("\r\n") + "\r\n"
  );

  const client = {
    socket,
    buffer: Buffer.alloc(0),
    playerId: "",
    universeId: "",
    profile: null,
    lastSnapshot: null,
    multiplayerOptIn: true,
    relayBypass: false,
    lobbyId: "",
    partySessionId: "",
    overlaps: new Set(),
    closed: false,
    fragmentedMessageParts: [],
    fragmentedMessageBytes: 0,
    lastOutboundPressureWarnAt: 0
  };

  sockets.add(client);
  logMultiplayer("ws connected", {
    remoteAddress: socket.remoteAddress,
    sockets: sockets.size
  });
  socket.on("data", (chunk) => handleSocketData(client, chunk));
  socket.on("close", () => handleSocketClose(client, "close"));
  socket.on("error", (error) => {
    const details = {
      playerId: client.playerId || null,
      code: error && error.code ? String(error.code) : "",
      message: error instanceof Error ? error.message : "unknown error"
    };
    if (isExpectedWsDisconnectError(error)) {
      logMultiplayer("ws socket disconnected", details);
    } else {
      logClusternautsError("ws socket error", details);
    }
    handleSocketClose(client, "error");
  });
});

function handleSocketData(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);
  const decoded = decodeWsFrames(client.buffer);
  client.buffer = decoded.remaining;

  for (const frame of decoded.frames) {
    if (frame.opcode === 8) {
      client.socket.end();
      return;
    }

    if (frame.opcode === 9) {
      client.socket.write(encodeWsFrame(frame.payload, 10));
      continue;
    }

    if (frame.opcode === 1) {
      client.fragmentedMessageParts = [frame.payload];
      client.fragmentedMessageBytes = frame.payload.length;
      if (client.fragmentedMessageBytes > maxJsonBodyBytes) {
        logClusternautsError("ws message too large", {
          playerId: client.playerId || null,
          bytes: client.fragmentedMessageBytes
        });
        sendWsJson(client, { type: "error", message: "WebSocket message too large." });
        client.socket.end();
        return;
      }

      if (frame.fin) {
        processWsTextMessage(client, frame.payload);
        client.fragmentedMessageParts = [];
        client.fragmentedMessageBytes = 0;
      }
      continue;
    }

    if (frame.opcode === 0) {
      if (!client.fragmentedMessageParts.length) {
        logMultiplayer("ws continuation ignored", {
          playerId: client.playerId || null,
          reason: "missing text frame"
        });
        continue;
      }

      client.fragmentedMessageParts.push(frame.payload);
      client.fragmentedMessageBytes += frame.payload.length;
      if (client.fragmentedMessageBytes > maxJsonBodyBytes) {
        logClusternautsError("ws message too large", {
          playerId: client.playerId || null,
          bytes: client.fragmentedMessageBytes
        });
        sendWsJson(client, { type: "error", message: "WebSocket message too large." });
        client.socket.end();
        return;
      }

      if (frame.fin) {
        processWsTextMessage(client, Buffer.concat(client.fragmentedMessageParts, client.fragmentedMessageBytes));
        client.fragmentedMessageParts = [];
        client.fragmentedMessageBytes = 0;
      }
      continue;
    }

    client.fragmentedMessageParts = [];
    client.fragmentedMessageBytes = 0;
  }
}

function processWsTextMessage(client, payload) {
  try {
    const message = JSON.parse(payload.toString("utf8"));
    void handleSocketMessage(client, message).catch((error) => {
      logClusternautsError("ws message handler failed", {
        playerId: client.playerId || null,
        messageType: message && typeof message === "object" ? message.type || null : null,
        message: error instanceof Error ? error.message : "handler failed",
        stack: error instanceof Error ? error.stack : ""
      });
      sendWsJson(client, { type: "error", message: "Server failed to process multiplayer message." });
    });
  } catch (error) {
    logClusternautsError("ws invalid json", {
      playerId: client.playerId || null,
      message: error instanceof Error ? error.message : "parse failed"
    });
    sendWsJson(client, { type: "error", message: "Invalid WebSocket JSON." });
  }
}

function decodeWsFrames(buffer) {
  const frames = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const start = offset;
    const first = buffer[offset++];
    const second = buffer[offset++];
    const fin = Boolean(first & 0x80);
    const opcode = first & 0x0f;
    const masked = Boolean(second & 0x80);
    let length = second & 0x7f;

    if (length === 126) {
      if (offset + 2 > buffer.length) {
        offset = start;
        break;
      }
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (offset + 8 > buffer.length) {
        offset = start;
        break;
      }
      const bigLength = buffer.readBigUInt64BE(offset);
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) {
        offset = start;
        break;
      }
      length = Number(bigLength);
      offset += 8;
    }

    const maskLength = masked ? 4 : 0;
    if (offset + maskLength + length > buffer.length) {
      offset = start;
      break;
    }

    let mask = null;
    if (masked) {
      mask = buffer.subarray(offset, offset + 4);
      offset += 4;
    }

    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    offset += length;

    if (mask) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= mask[i % 4];
      }
    }

    frames.push({ fin, opcode, payload });
  }

  return {
    frames,
    remaining: buffer.subarray(offset)
  };
}

function encodeWsFrame(payload, opcode) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
  const headerLength = data.length < 126 ? 2 : data.length <= 65535 ? 4 : 10;
  const header = Buffer.alloc(headerLength);
  header[0] = 0x80 | (opcode || 1);

  if (data.length < 126) {
    header[1] = data.length;
  } else if (data.length <= 65535) {
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
  } else {
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }

  return Buffer.concat([header, data]);
}

function isExpectedWsDisconnectError(error) {
  const code = error && error.code ? String(error.code) : "";
  return ["ECONNABORTED", "ECONNRESET", "EPIPE", "ETIMEDOUT", "ERR_STREAM_DESTROYED"].includes(code);
}

function isWsClientWritable(client) {
  return (
    client &&
    client.socket &&
    !client.closed &&
    !client.socket.destroyed &&
    !client.socket.writableEnded &&
    !client.socket.writableDestroyed
  );
}

function sendWsJson(client, payload) {
  if (!isWsClientWritable(client)) {
    logMultiplayer("ws send skipped", {
      playerId: client && client.playerId ? client.playerId : null,
      type: payload && payload.type,
      reason: "socket unavailable"
    });
    if (client && !client.closed) {
      handleSocketClose(client, "socket unavailable");
    }
    return;
  }

  try {
    const encoded = JSON.stringify(payload);
    const now = Date.now();
    if (
      (encoded.length > wsLargeOutboundWarnBytes || client.socket.writableLength > wsBackpressureWarnBytes) &&
      now - (client.lastOutboundPressureWarnAt || 0) >= wsOutboundPressureWarnIntervalMs
    ) {
      client.lastOutboundPressureWarnAt = now;
      logMultiplayer("ws outbound pressure", {
        playerId: client.playerId || null,
        type: payload && payload.type,
        bytes: Buffer.byteLength(encoded),
        writableLength: client.socket.writableLength
      });
    }
    client.socket.write(encodeWsFrame(encoded, 1), (error) => {
      if (!error) {
        return;
      }

      const details = {
        playerId: client.playerId || null,
        type: payload && payload.type,
        code: error && error.code ? String(error.code) : "",
        message: error instanceof Error ? error.message : "send failed"
      };
      if (isExpectedWsDisconnectError(error)) {
        logMultiplayer("ws send disconnected", details);
      } else {
        logClusternautsError("ws send failed", details);
      }
      handleSocketClose(client, "send failed");
    });
  } catch (error) {
    const details = {
      playerId: client.playerId || null,
      type: payload && payload.type,
      code: error && error.code ? String(error.code) : "",
      message: error instanceof Error ? error.message : "send failed"
    };
    if (isExpectedWsDisconnectError(error)) {
      logMultiplayer("ws send disconnected", details);
    } else {
      logClusternautsError("ws send failed", details);
    }
    handleSocketClose(client, "send failed");
  }
}

