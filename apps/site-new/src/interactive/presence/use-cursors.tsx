// Can be used only inside PresenceContext and handles cursor updates

import { create } from "zustand";
import { useState, useEffect } from "react";
import type { Cursor, User } from "./presence-schema";
import { usePresence } from "./presence-context";

export type PresenceWithCursorsStore = {
  myId: string | null;
  myself: User | null;
  otherUsers: Map<string, User>;
  within: "window" | "document";
};

export const usePresenceWithCursors = create<PresenceWithCursorsStore>(() => ({
  myId: null,
  myself: null,
  otherUsers: new Map(),
  within: "window",
}));

/*
We can track and display cursors relative to one of three reference frames:

- window: the browser window
- document: the entire document
- @TODO a div: a specific div element
*/
export default function useCursorTracking(
  within: "window" | "document" = "window",
) {
  const { myId, myself, otherUsers, updatePresence } = usePresence((state) => {
    return {
      myId: state.myId,
      myself: state.myself,
      otherUsers: state.otherUsers,
      updatePresence: state.updatePresence,
    };
  });

  // Always track window dimensions, and update scroll dimensions if required
  const [windowDimensions, setWindowDimensions] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [scrollDimensions, setScrollDimensions] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const updateScrollDimensions = () => {
    setScrollDimensions({
      x: document.documentElement.scrollWidth,
      y: document.documentElement.scrollHeight,
    });
  };
  useEffect(() => {
    const onResize = () => {
      setWindowDimensions({
        x: window.innerWidth,
        y: window.innerHeight,
      });
      if (within === "document") updateScrollDimensions();
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [within]);

  // Track the absolute cursor position relative to both the window (client) and the document
  const [windowCursor, setWindowCursor] = useState<Cursor | null>(null);
  const [documentCursor, setDocumentCursor] = useState<Cursor | null>(null);
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setWindowCursor({
        x: e.clientX,
        y: e.clientY,
        pointer: "mouse",
      });
      if (within === "document") {
        setDocumentCursor({
          x: e.pageX,
          y: e.pageY,
          pointer: "mouse",
        });
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const onTouchMove = (e: TouchEvent) => {
      setWindowCursor({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        pointer: "touch",
      });
      if (within === "document") {
        setDocumentCursor({
          x: e.touches[0].pageX,
          y: e.touches[0].pageY,
          pointer: "touch",
        });
      }
    };
    window.addEventListener("touchmove", onTouchMove);

    const onTouchEnd = () => {
      setWindowCursor(null);
      if (within === "document") {
        setDocumentCursor(null);
      }
    };
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [within]);

  // If there's a scroll, we can update the document cursor by knowing the window cursor
  // and the scroll position (we have to do this because scrolling doesn't send an onMouseMouve event)
  useEffect(() => {
    if (within !== "document") return;
    const onScroll = () => {
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setDocumentCursor(() => {
        if (!windowCursor) return null;
        return {
          ...windowCursor,
          x: windowCursor.x + scrollX,
          y: windowCursor.y + scrollY,
        };
      });
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [within, windowCursor]);

  // Send cursor updates
  useEffect(() => {
    const bounds = within === "window" ? windowDimensions : scrollDimensions;
    const localCursor = within === "window" ? windowCursor : documentCursor;

    if (localCursor === null) {
      updatePresence({ cursor: null });
      return;
    }

    if (!windowDimensions.x || !windowDimensions.y) {
      updatePresence({ cursor: null });
      return;
    }

    const cursor = {
      x: localCursor.x / bounds.x,
      y: localCursor.y / bounds.y,
      pointer: localCursor.pointer,
    } as Cursor;

    updatePresence({ cursor });
  }, [
    windowCursor,
    documentCursor,
    windowDimensions,
    scrollDimensions,
    updatePresence,
    within,
  ]);

  const transformCursor = (user: User) => {
    const bounds = within === "window" ? windowDimensions : scrollDimensions;
    const cursor = user.presence?.cursor
      ? {
          ...user.presence.cursor,
          x: user.presence.cursor.x * bounds.x,
          y: user.presence.cursor.y * bounds.y,
        }
      : null;
    return { ...user, presence: { ...user.presence, cursor } };
  };

  useEffect(() => {
    const myselfTransformed = myself ? transformCursor(myself) : null;
    const otherUsersTransformed = new Map<string, User>();
    otherUsers.forEach((user, id) => {
      otherUsersTransformed.set(id, transformCursor(user));
    });
    usePresenceWithCursors.setState({
      myId,
      myself: myselfTransformed,
      otherUsers: otherUsersTransformed,
      within,
    });
  });

  return;
}
