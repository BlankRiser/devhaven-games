"use client";

import {
  ArrowClockwiseIcon,
  CrownIcon,
  DoorOpenIcon,
  GameControllerIcon,
  LinkSimpleIcon,
  PlusCircleIcon,
  SignInIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GameType, HostLeaveAction } from "./types";
import type { SyntheticEvent } from "react";

export interface MultiplayerLobbyProperties {
  readonly defaultPlayerName: string;
  readonly gameTitle: string;
  readonly gameType: GameType;
  readonly initialRoomId?: string | null;
  readonly isLoading?: boolean;
  readonly onConnect: (
    roomId: string,
    playerName: string,
    hostLeaveAction: HostLeaveAction
  ) => void;
  readonly onPlayerNameChange: (name: string) => void;
}

const generateRandomRoomId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 5)}`;

const extractRoomIdFromInput = (rawInput: string): string => {
  const isHttp =
    rawInput.startsWith("http://") || rawInput.startsWith("https://");
  if (isHttp) {
    try {
      const parsed = new URL(rawInput);
      const queryRoom = parsed.searchParams.get("room");
      if (typeof queryRoom === "string" && queryRoom.length > 0) {
        return queryRoom;
      }
    } catch {
      return rawInput;
    }
  }
  return rawInput;
};

export const MultiplayerLobby = ({
  defaultPlayerName,
  gameTitle,
  gameType,
  initialRoomId = null,
  isLoading = false,
  onConnect,
  onPlayerNameChange,
}: MultiplayerLobbyProperties) => {
  const [createdRoomId, setCreatedRoomId] = useState(() =>
    generateRandomRoomId(gameType)
  );
  const [joinInput, setJoinInput] = useState(() => initialRoomId ?? "");
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [hostLeaveAction, setHostLeaveAction] =
    useState<HostLeaveAction>("keep_going");

  const rerollRoomId = () => {
    setCreatedRoomId(generateRandomRoomId(gameType));
  };

  const handleNameBlur = () => {
    if (playerName.trim().length > 0) {
      onPlayerNameChange(playerName.trim());
    }
  };

  const handleCreateRoom = (event: SyntheticEvent) => {
    event.preventDefault();
    const finalRoom = createdRoomId.trim();
    if (finalRoom.length === 0) {
      return;
    }
    const finalName =
      playerName.trim().length > 0 ? playerName.trim() : defaultPlayerName;
    onConnect(finalRoom, finalName, hostLeaveAction);
  };

  const handleJoinRoom = (event: SyntheticEvent) => {
    event.preventDefault();
    const raw = joinInput.trim();
    if (raw.length === 0) {
      return;
    }

    const resolvedRoom = extractRoomIdFromInput(raw);
    const finalName =
      playerName.trim().length > 0 ? playerName.trim() : defaultPlayerName;
    onConnect(resolvedRoom, finalName, "keep_going");
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="border-border bg-card inline-flex items-center gap-2 border px-3 py-1 font-mono text-xs tracking-wider uppercase">
            <UsersIcon className="size-4 text-emerald-500" weight="bold" />
            <span>Cross-Device Multiplayer Network</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight uppercase sm:text-3xl">
            {gameTitle} · Online Arena
          </h2>
          <p className="text-muted-foreground max-w-lg text-xs sm:text-sm">
            Host a private game room with custom exit policies or join a
            friend&apos;s match via room code or shareable invite link.
          </p>
        </div>

        <div className="border-border bg-card/60 mx-auto flex max-w-md items-center gap-3 border p-3">
          <GameControllerIcon className="text-muted-foreground size-5 shrink-0" />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="player-name"
              className="text-muted-foreground font-mono text-xs tracking-wider uppercase"
            >
              Your Player Nickname
            </Label>
            <Input
              id="player-name"
              value={playerName}
              onChange={(event) => {
                setPlayerName(event.target.value);
              }}
              onBlur={handleNameBlur}
              placeholder="Enter your nickname..."
              className="h-8 font-mono text-xs"
              maxLength={20}
            />
          </div>
        </div>

        {typeof initialRoomId === "string" && initialRoomId.length > 0 ? (
          <div className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 mx-auto flex max-w-md items-center gap-2.5 border p-3 font-mono text-xs">
            <LinkSimpleIcon className="size-4 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <span className="font-bold">Room Invite Detected:</span>{" "}
              Room code <span className="font-bold underline">{initialRoomId}</span> has been pre-filled below. Confirm your nickname and click &quot;Join Game Room&quot;!
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-border bg-card/80 flex flex-col justify-between backdrop-blur-xs">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <PlusCircleIcon
                  className="size-5 text-emerald-500"
                  weight="fill"
                />
                <CardTitle className="font-heading text-lg font-bold uppercase">
                  Create Game Room
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                You will become the room host. Set your departure policy below.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="create-room-id"
                    className="text-muted-foreground font-mono text-xs"
                  >
                    Room Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="create-room-id"
                      value={createdRoomId}
                      onChange={(event) => {
                        setCreatedRoomId(event.target.value);
                      }}
                      placeholder="e.g. ttt-alpha"
                      className="h-9 font-mono text-xs uppercase"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={rerollRoomId}
                      aria-label="Generate new Room Code"
                      className="size-9 shrink-0"
                    >
                      <ArrowClockwiseIcon className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-muted-foreground font-mono text-xs">
                    When Host Leaves the Room:
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHostLeaveAction("keep_going");
                      }}
                      className={cn(
                        "flex flex-col items-start gap-1 border p-2.5 text-left transition-all",
                        hostLeaveAction === "keep_going"
                          ? "text-foreground border-emerald-500 bg-emerald-500/10"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        <CrownIcon
                          className="size-3.5 text-amber-500"
                          weight="fill"
                        />
                        <span>Pass Host</span>
                      </div>
                      <span className="text-xs leading-tight opacity-80">
                        Next player becomes host and the match continues.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHostLeaveAction("end_session");
                      }}
                      className={cn(
                        "flex flex-col items-start gap-1 border p-2.5 text-left transition-all",
                        hostLeaveAction === "end_session"
                          ? "border-destructive bg-destructive/10 text-foreground"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        <DoorOpenIcon
                          className="text-destructive size-3.5"
                          weight="fill"
                        />
                        <span>End Session</span>
                      </div>
                      <span className="text-xs leading-tight opacity-80">
                        Room dissolves for all players if you leave.
                      </span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || createdRoomId.trim().length === 0}
                  className="w-full gap-2 text-xs font-bold tracking-wider uppercase"
                >
                  <PlusCircleIcon className="size-4" weight="bold" />
                  <span>
                    {isLoading ? "Connecting..." : "Create & Enter Room"}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "bg-card/80 flex flex-col justify-between backdrop-blur-xs transition-colors",
              typeof initialRoomId === "string" && initialRoomId.length > 0
                ? "border-emerald-500/60 shadow-sm"
                : "border-border"
            )}
          >
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <LinkSimpleIcon className="size-5 text-sky-500" weight="bold" />
                <CardTitle className="font-heading text-lg font-bold uppercase">
                  Join Game Room
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Paste an invite link or room code from the room host.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="join-room-id"
                    className="text-muted-foreground font-mono text-xs"
                  >
                    Room Code or Share Link
                  </Label>
                  <Input
                    id="join-room-id"
                    value={joinInput}
                    onChange={(event) => {
                      setJoinInput(event.target.value);
                    }}
                    placeholder="e.g. ttt-alpha or http://.../?room=ttt-alpha"
                    className="h-9 font-mono text-xs"
                    required
                  />
                </div>

                <div className="border-border bg-secondary/20 text-muted-foreground space-y-1.5 border p-3 text-xs">
                  <p className="text-foreground font-semibold">
                    Cross-Device Ready:
                  </p>
                  <p>
                    Open this game on your phone, tablet, or another computer
                    and join the same room to compete in real time!
                  </p>
                </div>

                <Button
                  type="submit"
                  variant={
                    typeof initialRoomId === "string" &&
                    initialRoomId.length > 0
                      ? "default"
                      : "secondary"
                  }
                  disabled={isLoading || joinInput.trim().length === 0}
                  className="w-full gap-2 text-xs font-bold tracking-wider uppercase"
                >
                  <SignInIcon className="size-4" weight="bold" />
                  <span>{isLoading ? "Connecting..." : "Join Game Room"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
