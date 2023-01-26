import type { PartyKitServer } from "partykit/server";
import { onConnect } from "y-partykit";
export default {
  onConnect(ws, room) {
    onConnect(ws, room, {
      persist: true,
      onCommand(command, _doc) {
        switch (command) {
          case "do-the-thing": {
            console.log("we did the thing");
            break;
          }
          default: {
            console.warn("unrecognised message");
          }
        }
      },
    });
  },
} satisfies PartyKitServer;
