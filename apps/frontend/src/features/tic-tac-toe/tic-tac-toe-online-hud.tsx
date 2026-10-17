"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  CopyIcon,
  CrownIcon,
  DoorOpenIcon,
  TrophyIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FullscreenToggleButton } from "@/features/common/use-game-fullscreen";
import type { HostLeaveAction } from "@/features/common/multiplayer/types";
import type {
  OnlineGameOutcome,
  OnlinePlayerSymbol,
  OnlineScores,
} from "./tic-tac-toe-types";

export interface TicTacToeOnlineHudProperties {
  readonly copiedLink: boolean;
  readonly currentTurn: OnlinePlayerSymbol;
  readonly hostLeaveAction: HostLeaveAction;
  readonly isFullscreen: boolean;
  readonly isHost: boolean;
  readonly isOnlineTurn: boolean;
  readonly myRole: string | null;
  readonly mySymbol: OnlinePlayerSymbol | null;
  readonly onCopyInviteLink: () => void;
  readonly onLeaveRoom: () => void;
  readonly onNextRound: () => void;
  readonly onSwitchMode: (mode: "local" | "online") => void;
  readonly onToggleFullscreen: () => void;
  readonly playerCount: number;
  readonly playerId: string;
  readonly playerO: { readonly id: string; readonly name: string } | null;
  readonly playerX: { readonly id: string; readonly name: string } | null;
  readonly roomId: string;
  readonly scores: OnlineScores;
  readonly winner: OnlineGameOutcome;
}

const OnlineStatusBadge = ({
  currentTurn,
  isOnlineTurn,
  myRole,
  mySymbol,
  playerCount,
  winner,
}: {
  readonly currentTurn: OnlinePlayerSymbol;
  readonly isOnlineTurn: boolean;
  readonly myRole: string | null;
  readonly mySymbol: OnlinePlayerSymbol | null;
  readonly playerCount: number;
  readonly winner: OnlineGameOutcome;
}) => {
  if (playerCount < 2) {
    return (
      <span className="border-border bg-secondary/50 text-foreground flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold tracking-wider">
        Waiting for Opponent...
      </span>
    );
  }

  if (winner === "draw") {
    return (
      <span className="border-foreground bg-accent text-accent-foreground flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold tracking-wider">
        Outcome // Draw
      </span>
    );
  }

  if (winner === "O" || winner === "X") {
    return (
      <span className="border-foreground bg-accent text-accent-foreground flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold tracking-wider">
        <TrophyIcon className="text-chart-3 size-3.5" weight="fill" />
        Winner // Player {winner}
      </span>
    );
  }

  if (isOnlineTurn) {
    return (
      <span className="flex items-center gap-1.5 border border-emerald-500 bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-emerald-400">
        Your Turn (Player {mySymbol})
      </span>
    );
  }

  if (myRole === "player") {
    return (
      <span className="border-border bg-secondary/50 text-foreground flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold tracking-wider">
        Opponent&apos;s Turn ({currentTurn})
      </span>
    );
  }

  return (
    <span className="border-border bg-secondary/50 text-foreground flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold tracking-wider">
      Turn // Player {currentTurn}
    </span>
  );
};

export const TicTacToeOnlineHud = ({
  copiedLink,
  currentTurn,
  hostLeaveAction,
  isFullscreen,
  isHost,
  isOnlineTurn,
  myRole,
  mySymbol,
  onCopyInviteLink,
  onLeaveRoom,
  onNextRound,
  onSwitchMode,
  onToggleFullscreen,
  playerCount,
  playerId,
  playerO,
  playerX,
  roomId,
  scores,
  winner,
}: TicTacToeOnlineHudProperties) => {
  const hostLabel =
    hostLeaveAction === "keep_going"
      ? "Host Migration: On"
      : "Host Exit: Closes Room";

  const playerXName = playerX ? playerX.name : "Player X";
  const playerOName = playerO ? playerO.name : "Player O";

  return (
    <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="border-border bg-secondary/40 flex items-center gap-1 border px-2 py-0.5 font-mono text-xs">
            <span className="text-muted-foreground">Room:</span>
            <span className="text-foreground font-mono font-bold">
              #{roomId}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopyInviteLink}
              aria-label="Copy room invite link"
              className="h-5 w-5 p-0 text-xs"
            >
              {copiedLink ? (
                <CheckIcon className="size-3 text-emerald-500" />
              ) : (
                <CopyIcon className="size-3" />
              )}
            </Button>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            {isHost ? (
              <span className="border-border inline-flex items-center gap-1 border bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-500">
                <CrownIcon className="size-3" weight="fill" />
                Host
              </span>
            ) : null}

            <span className="border-border bg-secondary/30 text-muted-foreground inline-flex items-center border px-1.5 py-0.5 font-mono text-xs">
              {hostLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs leading-none">
                {playerXName}
                {playerX?.id === playerId ? " (You)" : ""}
              </span>
              <span className="text-foreground font-mono text-sm font-bold">
                <NumberFlow value={scores.X} />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs leading-none">
                Draws
              </span>
              <span className="text-muted-foreground font-mono text-sm font-bold">
                <NumberFlow value={scores.draws} />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs leading-none">
                {playerOName}
                {playerO?.id === playerId ? " (You)" : ""}
              </span>
              <span className="text-chart-2 font-mono text-sm font-bold">
                <NumberFlow value={scores.O} />
              </span>
            </div>
          </div>

          <OnlineStatusBadge
            currentTurn={currentTurn}
            isOnlineTurn={isOnlineTurn}
            myRole={myRole}
            mySymbol={mySymbol}
            playerCount={playerCount}
            winner={winner}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onNextRound();
          }}
          aria-label="Restart round on server"
          className="h-7 gap-1.5 px-2.5 text-xs"
        >
          <ArrowCounterClockwiseIcon className="size-3.5" />
          <span>{winner === null ? "Reset Round" : "Next Round"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onLeaveRoom();
          }}
          aria-label="Leave multiplayer room"
          className="text-destructive hover:bg-destructive/10 h-7 gap-1.5 px-2.5 text-xs"
        >
          <DoorOpenIcon className="size-3.5" />
          <span>Leave Room</span>
        </Button>

        <FullscreenToggleButton
          isFullscreen={isFullscreen}
          onToggle={onToggleFullscreen}
        />
      </div>
    </div>
  );
};
