import PresenceProvider from "./presence/presence-context";
import Room from "./Room";

export default function RoomContainer() {
  return (
  <PresenceProvider
  host="sketch-presence.genmon.partykit.dev"
  room="default"
  presence={{
    cursor: null,
    message: null,
    name: "Anonymous User",
    color: "#0000f0",
  }}
>
  <Room />
</PresenceProvider>);

}