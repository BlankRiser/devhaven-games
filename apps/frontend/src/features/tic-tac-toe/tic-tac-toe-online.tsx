"use client";

import { UsersIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { MultiplayerLobby } from "@/features/common/multiplayer/multiplayer-lobby";
import { useMultiplayer } from "@/features/common/multiplayer/use-multiplayer";
import { FullscreenToggleButton } from "@/features/common/use-game-fullscreen";
import { TicTacToeOnlineBoard } from "./tic-tac-toe-online-board";
import { TicTacToeOnlineHud } from "./tic-tac-toe-online-hud";
import type { HostLeaveAction } from "@/features/common/multiplayer/types";
import type { OnlineTicTacToeState } from "./tic-tac-toe-types";

export interface TicTacToeOnlineProperties {
  readonly boardSize: number;
  readonly isFullscreen: boolean;
  readonly onSwitchMode: (mode: "local" | "online") => void;
  readonly onToggleFullscreen: () => void;
}

export const TicTacToeOnline = ({
  boardSize,
  isFullscreen,
  onSwitchMode,
  onToggleFullscreen,
}: TicTacToeOnlineProperties) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const {
    connectToRoom,
    connectionStatus,
    errorMessage,
    hostLeftNotice,
    initialRoomId,
    isHost,
    leaveRoom,
    myRole,
    playerId,
    playerName,
    resetGame: resetOnlineGame,
    roomState,
    sendAction,
    setPlayerName,
  } = useMultiplayer<OnlineTicTacToeState>({
    gameType: "tic-tac-toe",
  });

  const mySymbol = roomState?.gameState.playerSymbols[playerId] ?? null;
  const hasBothPlayers =
    roomState !== null && Object.keys(roomState.players).length >= 2;
  const isGameActive = roomState?.gameState.winner === null;
  const isMyTurnSymbol =
    mySymbol !== null && roomState?.gameState.currentTurn === mySymbol;
  const isOnlineTurn = hasBothPlayers && isGameActive && isMyTurnSymbol;

  const handleCopyInviteLink = useCallback(async () => {
    if (!roomState || typeof window === "undefined") {
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomState.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    } catch {
      // Ignore clipboard write errors
    }
  }, [roomState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;
      const hasModifierKey = event.metaKey || event.ctrlKey || event.altKey;

      if (isInput || hasModifierKey || event.key.toLowerCase() !== "r") {
        return;
      }

      event.preventDefault();
      if (roomState) {
        resetOnlineGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resetOnlineGame, roomState]);

  const handleOnlineCellClick = (cellIndex: number) => {
    if (roomState?.gameState.winner !== null) {
      return;
    }
    const isCellEmpty = roomState.gameState.board[cellIndex] === null;
    if (!isOnlineTurn || !isCellEmpty) {
      return;
    }

    sendAction({ cellIndex, type: "move" });
  };

  const handleConnectRoom = (
    roomId: string,
    chosenPlayerName: string,
    hostLeaveAction: HostLeaveAction
  ) => {
    connectToRoom(roomId, chosenPlayerName, hostLeaveAction);
  };

  const playerX = roomState
    ? (Object.values(roomState.players).find(
        (p) => roomState.gameState.playerSymbols[p.id] === "X"
      ) ?? null)
    : null;

  const playerO = roomState
    ? (Object.values(roomState.players).find(
        (p) => roomState.gameState.playerSymbols[p.id] === "O"
      ) ?? null)
    : null;

  if (!roomState) {
    return (
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
        <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
          <div className="border-border bg-secondary/50 flex items-center border p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                onSwitchMode("local");
              }}
              className="text-muted-foreground hover:text-foreground px-2.5 py-1 font-semibold tracking-wider transition-colors"
            >
              Local Play
            </button>
            <button
              type="button"
              onClick={() => {
                onSwitchMode("online");
              }}
              className="bg-foreground text-background flex items-center gap-1.5 px-2.5 py-1 font-semibold tracking-wider shadow-xs"
            >
              <UsersIcon className="size-3.5" />
              <span>Multiplayer</span>
            </button>
          </div>

          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            onToggle={onToggleFullscreen}
          />
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          {typeof hostLeftNotice === "string" && hostLeftNotice.length > 0 ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive-foreground mx-auto mt-4 flex w-full max-w-xl items-center gap-2.5 border p-3 font-mono text-xs">
              <WarningCircleIcon className="size-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <span className="font-bold">Session Ended:</span>{" "}
                <span>{hostLeftNotice}</span>
              </div>
            </div>
          ) : null}

          {typeof errorMessage === "string" && errorMessage.length > 0 ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive-foreground mx-auto mt-4 flex w-full max-w-xl items-center gap-2.5 border p-3 font-mono text-xs">
              <WarningCircleIcon className="size-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <span className="font-bold">Error:</span>{" "}
                <span>{errorMessage}</span>
              </div>
            </div>
          ) : null}

          <MultiplayerLobby
            gameTitle="Tic-Tac-Toe"
            gameType="tic-tac-toe"
            defaultPlayerName={playerName}
            initialRoomId={initialRoomId}
            isLoading={connectionStatus === "connecting"}
            onConnect={handleConnectRoom}
            onPlayerNameChange={setPlayerName}
          />
        </div>
      </div>
    );
  }

  const playerCount = Object.keys(roomState.players).length;

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <TicTacToeOnlineHud
        copiedLink={copiedLink}
        currentTurn={roomState.gameState.currentTurn}
        hostLeaveAction={roomState.hostLeaveAction}
        isFullscreen={isFullscreen}
        isHost={isHost}
        isOnlineTurn={isOnlineTurn}
        myRole={myRole}
        mySymbol={mySymbol}
        onCopyInviteLink={() => {
          void handleCopyInviteLink();
        }}
        onLeaveRoom={leaveRoom}
        onNextRound={resetOnlineGame}
        onSwitchMode={onSwitchMode}
        onToggleFullscreen={onToggleFullscreen}
        playerCount={playerCount}
        playerId={playerId}
        playerO={playerO}
        playerX={playerX}
        roomId={roomState.id}
        scores={roomState.gameState.scores}
        winner={roomState.gameState.winner}
      />

      <TicTacToeOnlineBoard
        board={roomState.gameState.board}
        boardSize={boardSize}
        copiedLink={copiedLink}
        isOnlineTurn={isOnlineTurn}
        myRole={myRole}
        onCellClick={handleOnlineCellClick}
        onCopyInviteLink={() => {
          void handleCopyInviteLink();
        }}
        onNextRound={resetOnlineGame}
        playerCount={playerCount}
        winner={roomState.gameState.winner}
        winningLine={roomState.gameState.winningLine}
      />
    </div>
  );
};
