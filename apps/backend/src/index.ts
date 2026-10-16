import { Hono } from "hono";
import { cors } from "hono/cors";
import type { GameRoom } from "./room";
import type { GameType } from "./types";

export { GameRoom } from "./room";

export interface CloudflareBindings {
  ENVIRONMENT?: string;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
}

interface CreateRoomRequest {
  gameType?: GameType;
  roomId?: string;
}

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
  let body: CreateRoomRequest;
  try {
    body = await c.req.json<CreateRoomRequest>();
  } catch {
    body = {};
  }

  const gameType: GameType = body.gameType ?? "tic-tac-toe";
  const customId =
    typeof body.roomId === "string" && body.roomId.trim().length > 0
      ? body.roomId.trim().toLowerCase()
      : null;
  const roomId = customId ?? `${gameType}-${crypto.randomUUID().slice(0, 6)}`;

  return c.json({
    gameType,
    roomId,
    websocketUrl: `/rooms/${roomId}/ws?gameType=${gameType}`,
  });
});

// Get room status from the Durable Object
app.get("/rooms/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
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
  const upgradeHeader = c.req.header("Upgrade");

  if (upgradeHeader !== "websocket") {
    return c.text("Expected Upgrade: websocket", 426);
  }

  // Get or create deterministic Durable Object instance for this room ID
  const id = c.env.GAME_ROOM.idFromName(roomId);
  const stub = c.env.GAME_ROOM.get(id);

  // Forward the WebSocket handshake request to the Durable Object
  return await stub.fetch(c.req.raw);
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
