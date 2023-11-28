import PresenceProvider from "./presence/presence-context";
import Room from "./Room";

export default function RoomContainer() {
  return (
  <PresenceProvider
  host="partykit-site.genmon.partykit.dev"
  //host="127.0.0.1:1999"
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