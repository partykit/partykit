import * as TextLoopComponent from "react-text-loop-next-18";
import "./HeroLoop.css";

const TextLoop =
  // @ts-expect-error ignore
  TextLoopComponent.TextLoop || TextLoopComponent.default.TextLoop;

export default function HeroLoop() {
  return (
    <TextLoop className="TextLoop" interval={1000}>
      <span>collaboration</span>
      <span>realtime</span>
      <span>AI chatbots</span>
      <span>websockets</span>
      <span>multiplayer</span>
      <span>AI agents</span>
      <span>edge computing</span>
      <span>CRDTs</span>
      <span>local-first apps</span>
      <span>LLMs</span>
      <span>friends</span>
    </TextLoop>
  );
}
