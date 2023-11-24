import { TextLoop } from "react-text-loop-next-18";

// use like:
// import HeroLoop from "./HeroLoop";
// <HeroLoop client:load />

export default function HeroLoop() {
  return (
    <TextLoop interval={1000}>
      <span>Collaboration</span>
      <span>Realtime</span>
      <span>AI Chatbots</span>
      <span>WebSockets</span>
      <span>Multiplayer</span>
      <span>AI Agents</span>
      <span>Edge Computing</span>
      <span>CRDTs</span>
      <span>Local-First Apps</span>
      <span>LLMs</span>
      <span>Friends</span>
    </TextLoop>
  );
}
