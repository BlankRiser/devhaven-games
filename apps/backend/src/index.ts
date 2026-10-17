import { Hono } from "hono";
import { cors } from "hono/cors";
import type { GameRoom } from "./room";
import type { GameType, HostLeaveAction } from "./types";

export { GameRoom } from "./room";

export interface CloudflareBindings {
  ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
}

interface CreateRoomRequest {
  gameType?: GameType;
  hostLeaveAction?: HostLeaveAction;
  roomId?: string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const ROOM_ID_PATTERN = /^[a-z0-9_-]{3,64}$/u;
const roomCreationRateLimits = new Map<string, RateLimitBucket>();

const isRateLimitAllowed = (
  store: Map<string, RateLimitBucket>,
  key: string,
  limit: number,
  windowMs: number
): boolean => {
  const now = Date.now();
  if (store.size > 2000) {
    for (const [storedKey, value] of store) {
      if (now > value.resetAt) {
        store.delete(storedKey);
      }
    }
  }

  const bucket = store.get(key);
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
};

const parseOriginHostname = (origin: string): string | null => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
};

const isAllowedOrigin = (
  originHeader: string | undefined,
  allowedConfig?: string
): boolean => {
  if (typeof originHeader !== "string" || originHeader.length === 0) {
    return true;
  }

  const hostname = parseOriginHostname(originHeader);
  if (typeof hostname !== "string") {
    return false;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (typeof allowedConfig === "string" && allowedConfig.length > 0) {
    const allowedSet = new Set(
      allowedConfig.split(",").map((item) => item.trim().toLowerCase())
    );
    if (allowedSet.has(originHeader.toLowerCase()) || allowedSet.has(hostname)) {
      return true;
    }
  }

  return hostname.endsWith(".vercel.app") || hostname.endsWith(".pages.dev");
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Enable CORS for frontend web client connections
app.use(
  "*",
  cors({
    allowHeaders: [
      "Content-Type",
      "Sec-WebSocket-Extensions",
      "Sec-WebSocket-Key",
      "Sec-WebSocket-Version",
      "Upgrade",
    ],
    allowMethods: ["DELETE", "GET", "OPTIONS", "POST", "PUT"],
    origin: "*",
  })
);

// Root informational endpoint
app.get("/", (c) => {
  return c.json({
    endpoints: {
      createRoom: "POST /rooms",
      getRoom: "GET /rooms/:roomId",
      health: "GET /health",
      websocket: "GET /rooms/:roomId/ws",
    },
    engine: "Cloudflare Workers + Hono + Durable Objects",
    service: "dev-games-multiplayer-backend",
    supportedGames: ["generic", "hangman", "minesweeper", "tic-tac-toe"],
    version: "0.1.0",
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    env: c.env.ENVIRONMENT ?? "development",
    status: "ok",
    timestamp: Date.now(),
  });
});

// Create room or generate a new room ID
app.post("/rooms", async (c) => {
  const clientIp =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    "unknown";

  if (!isRateLimitAllowed(roomCreationRateLimits, clientIp, 20, 60_000)) {
    return c.json(
      {
        error: "Too Many Requests",
        message: "Room creation rate limit exceeded. Please wait a minute.",
      },
      429
    );
  }

  let body: CreateRoomRequest;
  try {
    body = await c.req.json<CreateRoomRequest>();
  } catch {
    body = {};
  }

  const hostLeaveAction: HostLeaveAction =
    body.hostLeaveAction === "end_session" ? "end_session" : "keep_going";
  const gameType: GameType = body.gameType ?? "tic-tac-toe";
  const rawCustomId =
    typeof body.roomId === "string" && body.roomId.trim().length > 0
      ? body.roomId.trim().toLowerCase()
      : null;

  if (rawCustomId !== null && !ROOM_ID_PATTERN.test(rawCustomId)) {
    return c.json(
      {
        error: "Bad Request",
        message:
          "Invalid roomId. Must be between 3 and 64 characters (alphanumeric, dash, underscore).",
      },
      400
    );
  }

  const roomId = rawCustomId ?? `${gameType}-${crypto.randomUUID().slice(0, 6)}`;

  return c.json({
    gameType,
    hostLeaveAction,
    roomId,
    websocketUrl: `/rooms/${roomId}/ws?gameType=${gameType}&hostLeaveAction=${hostLeaveAction}`,
  });
});

// Get room status from the Durable Object
app.get("/rooms/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return c.json(
      {
        error: "Bad Request",
        message: "Invalid roomId format",
      },
      400
    );
  }

  const id = c.env.GAME_ROOM.idFromName(roomId);
  const stub = c.env.GAME_ROOM.get(id);

  const url = new URL(c.req.url);
  url.searchParams.set("roomId", roomId);

  return await stub.fetch(url.href, {
    headers: c.req.raw.headers,
    method: "GET",
  });
});

// WebSocket connection endpoint to join a multiplayer room
app.get("/rooms/:roomId/ws", async (c) => {
  const roomId = c.req.param("roomId");
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return c.text("Invalid roomId format", 400);
  }

  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader !== "websocket") {
    return c.text("Expected Upgrade: websocket", 426);
  }

  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, c.env.ALLOWED_ORIGINS)) {
    return c.text("Forbidden: Invalid Origin", 403);
  }

  // Get or create deterministic Durable Object instance for this room ID
  const id = c.env.GAME_ROOM.idFromName(roomId);
  const stub = c.env.GAME_ROOM.get(id);

  // Ensure roomId query parameter is present on the forwarded request
  const url = new URL(c.req.raw.url);
  if (!url.searchParams.has("roomId")) {
    url.searchParams.set("roomId", roomId);
  }

  const forwardRequest = new Request(url.href, c.req.raw);
  return await stub.fetch(forwardRequest);
});

// eslint-disable-next-line promise/prefer-await-to-callbacks
app.onError((error, c) => {
  console.error("Unhandled error in Hono app:", error);
  return c.json(
    {
      error: "Internal Server Error",
      message: error.message,
    },
    500
  );
});

export default app;
