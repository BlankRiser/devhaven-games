# DevHaven Games - Multiplayer Backend

Real-time authoritative multiplayer game engine powered by **Cloudflare Workers**, **Hono**, and **Cloudflare Durable Objects** using the high-performance **WebSocket Hibernation API**.

---

## Architecture Overview

```text
               +-------------------------------------------------+
               |             Next.js Frontend Client             |
               +-----------------------+-------------------------+
                                       |
                   HTTP / WebSocket    |  ws://localhost:8787
                                       v
               +-------------------------------------------------+
               |           Cloudflare Worker (Hono)              |
               |         apps/backend/src/index.ts               |
               +-----------------------+-------------------------+
                                       |
                       Deterministic   |  idFromName(roomId)
                                       v
               +-------------------------------------------------+
               |              GameRoom Durable Object            |
               |          apps/backend/src/room.ts               |
               |                                                 |
               |  * WebSocket Hibernation API                    |
               |  * Authoritative Game State Engine (Tic-Tac-Toe)|
               |  * Host Departure & Auto-Promotion Engine       |
               |  * State Lifecycle (Purged when room empties)   |
               +-------------------------------------------------+
```

### Core Features

1. **Cloudflare WebSocket Hibernation**: Clients stay connected with zero CPU cost while idle. Connections wake up only on incoming messages or heartbeats.
2. **Authoritative State**: Moves are validated server-side by game engines in `src/games/`.
3. **Room Host Departure Policies**:
   - `keep_going`: If the host leaves, the next connected player is automatically promoted to host and gameplay continues.
   - `end_session`: If the host leaves, the session dissolves, kicking all connected players with a notification.
4. **Zero Residual Storage**: When all players leave a room, `this.ctx.storage.deleteAll()` is executed, immediately purging all persistent state.

---

## 1. Local Development & Testing

### Prerequisites

- [Bun](https://bun.sh/) (v1.x or higher)

### Start the Servers

You can start both backend and frontend together from the monorepo root:

```bash
# Starts Next.js (port 3000) and Cloudflare Worker (port 8787)
bun dev
```

Or start the backend independently:

```bash
# From workspace root:
bun dev:backend

# Or from apps/backend:
cd apps/backend && bun dev
```

### Testing Multiplayer Locally

#### Method A: Browser Interactive Testing (Two Players)

1. Ensure both frontend (`http://localhost:3000`) and backend (`http://localhost:8787`) are running.
2. Open **Window 1**: Navigate to `http://localhost:3000/games/tic-tac-toe`.
3. Switch mode to **"Online Multiplayer"** and click **"Create Game Room"**.
4. Choose your host departure policy and click **"Create & Join Room"**.
5. Click **"Copy Link"** in the HUD (it copies `http://localhost:3000/games/tic-tac-toe?room=XXXXXX`).
6. Open **Window 2** (an incognito tab or another browser window) and paste the link.
7. Enter a second player name and join.
8. Make moves on either screen. Watch the turns alternate, the score update, and state synchronize seamlessly.
9. Close Window 1 to observe host migration or session termination depending on your policy.

#### Method B: Automated CLI Integration Test Suite

The repository includes an automated integration test script simulating two concurrent WebSocket clients connecting to the backend, exchanging moves, broadcasting chat, testing host migration, and verifying room teardown:

```bash
# Step 1: In Terminal 1, ensure backend is running:
bun dev:backend

# Step 2: In Terminal 2, run the automated multiplayer test:
bun run test:multiplayer
```

The script output verifies:

```text
🚀 Testing Multiplayer Room: test-a82k1
📡 Target backend: http://localhost:8787

1️⃣  Connecting Player 1 (Host / Alice)...
   ✅ Player 1 connected. Host: Yes
2️⃣  Connecting Player 2 (Bob)...
   ✅ Player 2 connected. Total active players in room: 2
3️⃣  Player 1 making move at [0, 0] (X)...
   ✅ Player 2 received synchronized board update: board[0][0] = 'X'
4️⃣  Player 2 making move at [1, 1] (O)...
   ✅ Player 1 received synchronized board update: board[1][1] = 'O'
5️⃣  Testing in-room chat broadcast...
   ✅ Player 2 received chat message: 'Good game!'
6️⃣  Disconnecting Host (Player 1) to test host migration...
   ✅ Host departure handled smoothly: Player 2 was promoted to new host!
7️⃣  Disconnecting Player 2 (Room cleanup)...
   ✅ All players disconnected. Durable Object state purged.

🎉 ALL MULTIPLAYER INTEGRATION TESTS PASSED!
```

#### Method C: Health Check via cURL

```bash
curl http://localhost:8787/health
```

Response:

```json
{
  "env": "development",
  "status": "ok",
  "timestamp": 1740000000000
}
```

---

## 2. Deploying to Cloudflare Workers

### Prerequisites

1. **Cloudflare Account**: [Sign up for Cloudflare](https://dash.cloudflare.com/sign-up). Works on both **Workers Free** (via SQLite-backed Durable Objects) and Workers Paid plans.
2. **Cloudflare Account ID**: Found on your Cloudflare dashboard overview page on the right sidebar.

---

### Option 1: Manual CLI Deployment

1. **Authenticate Wrangler**:

   ```bash
   bunx wrangler login
   ```

   _(Or set the `CLOUDFLARE_API_TOKEN` environment variable in your terminal)._

2. **Deploy from the Monorepo Root**:

   ```bash
   bun run build:backend
   bun --filter backend deploy
   ```

   _(Or from within `apps/backend`: `bun run deploy`)_.

3. **Verify Deployment**: Wrangler will output your live URL:
   ```text
   Uploaded backend (2.10 sec)
   Deployed backend triggers (0.50 sec)
     https://backend.<your-subdomain>.workers.dev
   ```

---

### Option 2: Automated Deployment via GitHub Actions

This repository includes a production-ready GitHub Actions workflow in [`.github/workflows/deploy-backend.yml`](file://../../.github/workflows/deploy-backend.yml).

#### Setup Instructions:

1. **Create a Cloudflare API Token**:
   - Go to Cloudflare Dashboard → **My Profile** → **API Tokens** → **Create Token**.
   - Use the **Edit Cloudflare Workers** template, or grant:
     - `Account` | `Worker Scripts` | `Edit`
     - `Account` | `Account Settings` | `Read`
     - `Account` | `Durable Objects` | `Edit`
   - Set Account Resources to **Include: All accounts** (or your specific account).

2. **Add GitHub Repository Secrets**:
   - In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions**.
   - Add two repository secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token created above.
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.

3. **Trigger the Deployment**:
   - **Automatic**: Every time you push changes affecting `apps/backend/**` to the `main` branch, GitHub Actions will automatically typecheck and deploy your Worker.
   - **Manual**: Go to the **Actions** tab in GitHub, select **Deploy Backend to Cloudflare Workers**, and click **Run workflow**.

---

## 3. Connecting the Frontend to the Deployed Backend

Once your backend is deployed (e.g. at `https://backend.<subdomain>.workers.dev`):

1. Set the environment variable in your frontend hosting provider (Vercel, Cloudflare Pages, etc.):
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://backend.<subdomain>.workers.dev
   ```
2. For local frontend testing against the production backend: Create `apps/frontend/.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://backend.<subdomain>.workers.dev
   ```

---

## 4. Configuration Reference (`wrangler.jsonc`)

- **`compatibility_date`**: Set to `"2025-02-14"`.
- **`compatibility_flags`**: Includes `["nodejs_compat"]`.
- **`durable_objects`**: Binds the `GameRoom` class to `env.GAME_ROOM`.
- **`migrations`**: Configures migration tag `v1` registering `GameRoom` via `new_sqlite_classes`.
- **`dev.port`**: Fixed to `8787` for consistent local frontend connection.
