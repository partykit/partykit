/*
TODO:

- track cursor position only within a provided element
- use msgpack
- provide a default room name from the href
*/

import { useEffect, createContext } from "react";
import usePartySocket from "partysocket/react";
import { create } from "zustand";
import {
  type Presence,
  type User,
  type ClientMessage,
  type PartyMessage,
  decodeMessage,
  encodeClientMessage,
  partyMessageSchema,
} from "./presence-schema";

type UserMap = Map<string, User>;

type PresenceStoreType = {
  // The current user. The ID is the socket connection ID.
  // myself if set initially in a "sync" PartyMessage, and then
  // updated locally, optimistically. It is not updated remotely.
  myId: string | null;
  myself: User | null;
  setMyId: (myId: string) => void;

  // Flag to indicate whether a "sync" message has been received
  synced: boolean;
  setSynced: (synced: boolean) => void;

  // A local update to the presence of the current user,
  // ready to the sent to the server as an "update" ClientMessage
  pendingUpdate: Presence | null;
  clearPendingUpdate: () => void;

  // Makes an optimistic local update of the presence of the current user,
  // and also queues an update to be sent to the server
  updatePresence: (partial: Partial<Presence>) => void;

  // Other users in the room. Set by an initial "sync" PartyMessage
  // and updated in "changes" messages.
  otherUsers: UserMap;

  // Used by the initial "sync" PartyMessage. Will replace both myself and otherUsers.
  setUsers: (users: UserMap) => void;

  // Used by the "changes" PartyMessage. Will update otherUsers but *not* myself.
  addUser: (id: string, user: User) => void;
  removeUser: (id: string) => void;
  updateUser: (id: string, presence: Presence) => void;
};

export const usePresence = create<PresenceStoreType>((set) => ({
  myId: null,
  myself: null,
  setMyId: (myId: string) => set({ myId }),

  synced: false,
  setSynced: (synced: boolean) => set({ synced }),

  pendingUpdate: null,
  clearPendingUpdate: () => set({ pendingUpdate: null }),
  updatePresence: (partial: Partial<Presence>) =>
    set((state) => {
      // Optimistically update myself, and also set a pending update
      // Can only be used once myself has been set
      if (!state.myself) return {};
      const presence = {
        ...state.myself.presence,
        ...partial,
      } as Presence;
      const myself = {
        ...state.myself,
        presence,
      };
      return { myself, pendingUpdate: presence };
    }),

  otherUsers: new Map() as UserMap,

  setUsers: (users: UserMap) =>
    set((state) => {
      const otherUsers = new Map<string, User>();
      users.forEach((user, id) => {
        if (id === state.myId) return;
        otherUsers.set(id, user);
      });
      const myself = state.myId ? users.get(state.myId) : null;
      return { myself, otherUsers };
    }),

  addUser: (id: string, user: User) => {
    set((state) => {
      if (id === state.myId) {
        return {};
      }
      const otherUsers = new Map(state.otherUsers);
      otherUsers.set(id, user);
      return { otherUsers };
    });
  },
  removeUser: (id: string) => {
    set((state) => {
      if (id === state.myId) {
        return {};
      }
      const otherUsers = new Map(state.otherUsers);
      otherUsers.delete(id);
      return { otherUsers };
    });
  },
  updateUser: (id: string, presence: Presence) => {
    set((state) => {
      if (id === state.myId) {
        return {};
      }
      const otherUsers = new Map(state.otherUsers);
      const user = otherUsers.get(id);
      if (!user) return { otherUsers };
      otherUsers.set(id, { ...user, presence });
      return { otherUsers };
    });
  },
}));

export const PresenceContext = createContext({});

export default function PresenceProvider(props: {
  host: string;
  room: string;
  presence: Presence; // current user's initial presence, only name and color
  children: React.ReactNode;
}) {
  const {
    setMyId,
    setUsers,
    addUser,
    updateUser,
    removeUser,
    pendingUpdate,
    clearPendingUpdate,
    synced,
    setSynced,
  } = usePresence();

  const updateUsers = (message: PartyMessage) => {
    if (message.type !== "changes") return;
    if (message.add) {
      for (const [id, user] of Object.entries(message.add)) {
        addUser(id, user);
      }
    }
    if (message.presence) {
      for (const [id, presence] of Object.entries(message.presence)) {
        updateUser(id, presence);
      }
    }
    if (message.remove) {
      for (const id of message.remove) {
        removeUser(id);
      }
    }
  };

  const handleMessage = async (event: MessageEvent) => {
    //const message = JSON.parse(event.data) as PartyMessage;
    const data =
      event.data instanceof Blob
        ? // byte array -> msgpack
          decodeMessage(await event.data.arrayBuffer())
        : // string -> json
          JSON.parse(event.data);

    const result = partyMessageSchema.safeParse(data);
    if (!result.success) return;
    const message = result.data;

    switch (message.type) {
      case "sync":
        setMyId(socket.id);
        // create Map from message.users (which is id -> User)
        setUsers(new Map<string, User>(Object.entries(message.users)));
        setSynced(true);
        break;
      case "changes":
        updateUsers(message);
        break;
    }
  };

  const socket = usePartySocket({
    host: props.host,
    party: "presence",
    room: props.room,
    // Initial presence is sent in the query string
    query: { name: props.presence.name, color: props.presence.color },
    onMessage: (event) => handleMessage(event),
  });

  // Send initial presence when syncing
  useEffect(() => {
    if (socket) {
      setMyId(socket.id);
      if (!synced) {
        const message: ClientMessage = {
          type: "update",
          presence: props.presence,
        };
        socket.send(encodeClientMessage(message));
      }
    }
  }, [props.presence, setMyId, synced, socket]);

  useEffect(() => {
    if (!pendingUpdate) return;
    if (!socket) return;
    const message: ClientMessage = { type: "update", presence: pendingUpdate };
    socket.send(encodeClientMessage(message));
    clearPendingUpdate();
  }, [socket, pendingUpdate, clearPendingUpdate]);

  return (
    <PresenceContext.Provider value={{}}>
      {props.children}
    </PresenceContext.Provider>
  );
}
