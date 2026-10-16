"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FrontendMultiplayerClient } from "./multiplayer-client";
import type {
  ConnectionStatus,
  GameType,
  HostLeaveAction,
  Player,
  PlayerRole,
  RoomState,
} from "./types";

const defaultBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";
const storageKey = "devhaven_multiplayer_profile";

interface PlayerProfile {
  id: string;
  name: string;
}

const parseStoredProfile = (raw: string): PlayerProfile | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    if (typeof parsed.id === "string" && typeof parsed.name === "string") {
      return { id: parsed.id, name: parsed.name };
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
};

const getStoredProfile = (): PlayerProfile => {
  if (typeof window === "undefined") {
    return { id: "", name: "" };
  }

  const raw = localStorage.getItem(storageKey);
  if (typeof raw === "string" && raw.length > 0) {
    const parsed = parseStoredProfile(raw);
    if (parsed) {
      return parsed;
    }
  }

  const generatedId = `p_${crypto.randomUUID().slice(0, 8)}`;
  const defaultName = `Player ${crypto.randomUUID().slice(0, 4)}`;
  const initial = { id: generatedId, name: defaultName };
  try {
    localStorage.setItem(storageKey, JSON.stringify(initial));
  } catch {
    // Ignore storage write errors
  }
  return initial;
};

const saveProfile = (profile: PlayerProfile): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(profile));
  } catch {
    // Ignore storage write errors
  }
};

export interface UseMultiplayerProperties {
  readonly backendUrl?: string;
  readonly gameType: GameType;
}

export const useMultiplayer = <TGameState = unknown>({
  backendUrl = defaultBackendUrl,
  gameType,
}: UseMultiplayerProperties) => {
  const [profile, setProfile] = useState<PlayerProfile>(getStoredProfile);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [roomState, setRoomState] =
    useState<RoomState<TGameState> | null>(null);
  const [hostLeftNotice, setHostLeftNotice] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialRoomId = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const parameters = new URLSearchParams(window.location.search);
    const room = parameters.get("room");
    return typeof room === "string" && room.trim().length > 0
      ? room.trim()
      : null;
  }, []);

  const client = useMemo(() => new FrontendMultiplayerClient(), []);

  // Synchronize URL with room ID
  const updateUrlRoomId = useCallback((roomId: string | null) => {
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    if (typeof roomId === "string" && roomId.length > 0) {
      url.searchParams.set("room", roomId);
    } else {
      url.searchParams.delete("room");
    }
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  const connectToRoom = useCallback(
    (
      roomId: string,
      playerName: string,
      hostLeaveAction: HostLeaveAction = "keep_going"
    ) => {
      setConnectionStatus("connecting");
      setErrorMessage(null);
      setHostLeftNotice(null);

      const activeProfile = {
        id:
          profile.id.length > 0
            ? profile.id
            : `p_${crypto.randomUUID().slice(0, 8)}`,
        name: playerName.trim().length > 0 ? playerName.trim() : profile.name,
      };

      setProfile(activeProfile);
      saveProfile(activeProfile);
      updateUrlRoomId(roomId);

      try {
        sessionStorage.setItem("devhaven_active_room", roomId);
      } catch {
        // Ignore session storage write errors
      }

      client.connect({
        backendUrl,
        gameType,
        hostLeaveAction,
        name: activeProfile.name,
        onClose: () => {
          setConnectionStatus("disconnected");
        },
        onError: () => {
          setConnectionStatus("error");
          setErrorMessage("Failed to connect to multiplayer server.");
        },
        onOpen: () => {
          setConnectionStatus("connected");
        },
        playerId: activeProfile.id,
        roomId,
      });
    },
    [backendUrl, client, gameType, profile.id, profile.name, updateUrlRoomId]
  );

  const leaveRoom = useCallback(() => {
    try {
      sessionStorage.removeItem("devhaven_active_room");
    } catch {
      // Ignore session storage write errors
    }
    client.disconnect();
    setConnectionStatus("disconnected");
    setRoomState(null);
    setHostLeftNotice(null);
    setErrorMessage(null);
    updateUrlRoomId(null);
  }, [client, updateUrlRoomId]);

  // Wire up incoming messages
  useEffect(() => {
    const unbindRoomState = client.on("room_state", (state) => {
      setRoomState(state as RoomState<TGameState>);
    });

    const unbindStateUpdated = client.on("game_state_updated", (payload) => {
      setRoomState((previous) => {
        if (!previous) {
          return null;
        }
        return {
          ...previous,
          gameState: payload.gameState as TGameState,
          status: payload.status as RoomState["status"],
          updatedAt: Date.now(),
        };
      });
    });

    const unbindHostLeft = client.on("host_left", (payload) => {
      setHostLeftNotice(payload.message);
      setConnectionStatus("disconnected");
      setRoomState(null);
      updateUrlRoomId(null);
    });

    const unbindError = client.on("error", (payload) => {
      setErrorMessage(payload.message);
    });

    return () => {
      unbindRoomState();
      unbindStateUpdated();
      unbindHostLeft();
      unbindError();
    };
  }, [client, updateUrlRoomId]);

  const hasAutoConnected = useRef(false);
  const connectReference = useRef(connectToRoom);

  useEffect(() => {
    connectReference.current = connectToRoom;
  }, [connectToRoom]);

  // Auto-reconnect ONLY if this tab was already actively playing in this room
  useEffect(() => {
    const hasNoInitialRoom =
      typeof initialRoomId !== "string" || initialRoomId.length === 0;
    if (hasNoInitialRoom || hasAutoConnected.current) {
      return;
    }

    let activeSessionRoom: string | null = null;
    try {
      activeSessionRoom = sessionStorage.getItem("devhaven_active_room");
    } catch {
      // Ignore session storage read errors
    }

    if (activeSessionRoom !== initialRoomId) {
      return;
    }

    hasAutoConnected.current = true;
    connectReference.current(initialRoomId, profile.name);
  }, [initialRoomId, profile.name]);

  // Clean up socket on unmount
  useEffect(() => {
    const cleanup = () => {
      client.disconnect();
    };
    return cleanup;
  }, [client]);

  const sendAction = useCallback((action: unknown) => {
    client.sendAction(action);
  }, [client]);

  const resetGame = useCallback(() => {
    client.resetGame();
  }, [client]);

  const sendChat = useCallback((message: string) => {
    client.sendChat(message);
  }, [client]);

  const setReady = useCallback((isReady: boolean) => {
    client.setReady(isReady);
  }, [client]);

  const isHost = roomState?.hostId === profile.id;

  const myPlayer: Player | null = useMemo(() => {
    if (!roomState) {
      return null;
    }
    const playersMap = roomState.players as Record<string, Player | undefined>;
    const spectatorsMap = roomState.spectators as Record<
      string,
      Player | undefined
    >;
    return playersMap[profile.id] ?? spectatorsMap[profile.id] ?? null;
  }, [profile.id, roomState]);

  const myRole: PlayerRole | null = myPlayer?.role ?? null;

  return {
    connectToRoom,
    connectionStatus,
    errorMessage,
    hostLeftNotice,
    initialRoomId,
    isHost,
    leaveRoom,
    myPlayer,
    myRole,
    playerId: profile.id,
    playerName: profile.name,
    resetGame,
    roomState,
    sendAction,
    sendChat,
    setPlayerName: (name: string) => {
      const updated = { ...profile, name: name.trim() };
      setProfile(updated);
      saveProfile(updated);
    },
    setReady,
  };
};
