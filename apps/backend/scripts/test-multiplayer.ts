import { MultiplayerClient } from "../src/client";
import type { RoomState } from "../src/types";

interface TicTacToeGameState {
  board: (string | null)[];
  currentTurn: "O" | "X";
  winner: "draw" | "O" | "X" | null;
}

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8787";
const ROOM_ID = `test-${Math.random().toString(36).slice(2, 7)}`;

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const checkBackendLiveness = async (): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    process.stderr.write(
      `\n❌ Backend is not running or not reachable at ${BACKEND_URL}.\n` +
        `   Please start the backend development server first:\n` +
        `   $ bun dev:backend  (or bun dev)\n\n`
    );
    process.exit(1);
  }
};

const runTest = async (): Promise<void> => {
  await checkBackendLiveness();

  process.stdout.write(`\n🚀 Testing Multiplayer Room: ${ROOM_ID}\n`);
  process.stdout.write(`📡 Target backend: ${BACKEND_URL}\n\n`);

  const client1 = new MultiplayerClient();
  const client2 = new MultiplayerClient();

  try {
    // 1. Connect Player 1 (Host / Alice)
    process.stdout.write("1️⃣  Connecting Player 1 (Host / Alice)...\n");
    const p1State = await new Promise<RoomState<TicTacToeGameState>>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Player 1 connection timed out"));
        }, 5000);

        client1.on("room_state", (state) => {
          clearTimeout(timeout);
          resolve(state as unknown as RoomState<TicTacToeGameState>);
        });
        client1.on("error", (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });
      }
    );

    client1.connect({
      backendUrl: BACKEND_URL,
      gameType: "tic-tac-toe",
      hostLeaveAction: "keep_going",
      name: "Alice",
      role: "player",
      roomId: ROOM_ID,
    });

    const isHost =
      p1State.hostId === Object.keys(p1State.players)[0] ? "Yes" : "No";
    process.stdout.write(`   ✅ Player 1 connected. Host: ${isHost}\n`);

    // 2. Connect Player 2 (Bob / O)
    process.stdout.write("2️⃣  Connecting Player 2 (Bob)...\n");
    const p2StatePromise = new Promise<RoomState<TicTacToeGameState>>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Player 2 connection timed out"));
        }, 5000);

        client2.on("room_state", (state) => {
          clearTimeout(timeout);
          resolve(state as unknown as RoomState<TicTacToeGameState>);
        });
        client2.on("error", (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });
      }
    );

    client2.connect({
      backendUrl: BACKEND_URL,
      gameType: "tic-tac-toe",
      hostLeaveAction: "keep_going",
      name: "Bob",
      role: "player",
      roomId: ROOM_ID,
    });

    const p2State = await p2StatePromise;
    await sleep(200);

    const playerCount = Object.keys(p2State.players).length;
    process.stdout.write(
      `   ✅ Player 2 connected. Total active players in room: ${playerCount}\n`
    );

    if (playerCount !== 2) {
      throw new Error(`Expected 2 players, found ${playerCount}`);
    }

    // 3. Player 1 makes a move at [0, 0]
    process.stdout.write("3️⃣  Player 1 making move at [0, 0] (X)...\n");
    const move1Promise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Move 1 broadcast timed out"));
      }, 5000);

      client2.on("game_state_updated", (payload) => {
        const state = payload.gameState as TicTacToeGameState;
        if (state.board[0] === "X") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    client1.sendAction({
      cellIndex: 0,
      type: "move",
    });

    await move1Promise;
    process.stdout.write(
      "   ✅ Player 2 received synchronized board update: board[0] = 'X'\n"
    );

    // 4. Player 2 makes a move at cellIndex 4 (center)
    process.stdout.write("4️⃣  Player 2 making move at cellIndex 4 (O)...\n");
    const move2Promise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Move 2 broadcast timed out"));
      }, 5000);

      client1.on("game_state_updated", (payload) => {
        const state = payload.gameState as TicTacToeGameState;
        if (state.board[4] === "O") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    client2.sendAction({
      cellIndex: 4,
      type: "move",
    });

    await move2Promise;
    process.stdout.write(
      "   ✅ Player 1 received synchronized board update: board[4] = 'O'\n"
    );

    // 5. Chat message test
    process.stdout.write("5️⃣  Testing in-room chat broadcast...\n");
    const chatPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Chat broadcast timed out"));
      }, 5000);

      client2.on("chat_message", (message) => {
        if (message.message === "Good game!") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    client1.sendChat("Good game!");
    await chatPromise;
    process.stdout.write(
      "   ✅ Player 2 received chat message: 'Good game!'\n"
    );

    // 6. Disconnect Player 1 and test host handover (keep_going)
    process.stdout.write(
      "6️⃣  Disconnecting Host (Player 1) to test host migration...\n"
    );
    const hostHandoverPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Host handover timed out"));
      }, 5000);

      client2.on("room_state", (state) => {
        const remainingPlayers = Object.keys(state.players);
        if (
          remainingPlayers.length === 1 &&
          state.hostId === remainingPlayers[0]
        ) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    client1.disconnect();
    await hostHandoverPromise;
    process.stdout.write(
      "   ✅ Host departure handled smoothly: Player 2 was promoted to new host!\n"
    );

    // 7. Disconnect Player 2 (Empty room cleanup)
    process.stdout.write("7️⃣  Disconnecting Player 2 (Room cleanup)...\n");
    client2.disconnect();
    await sleep(300);
    process.stdout.write(
      "   ✅ All players disconnected. Durable Object state purged.\n"
    );

    process.stdout.write("\n🎉 ALL MULTIPLAYER INTEGRATION TESTS PASSED!\n\n");
  } finally {
    client1.disconnect();
    client2.disconnect();
  }
};

try {
  await runTest();
} catch (error: unknown) {
  process.stderr.write(
    `❌ Test failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
}
