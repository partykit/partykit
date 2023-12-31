// The basic demo is needs adjusting (light intensity) to work
// https://github.com/pmndrs/react-three-fiber/issues/2963

// import type * as THREE from "three";
import { useRef, useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
//import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Logo, { Loader } from "./Logo";
import { usePresenceWithCursors } from "./presence/use-cursors";
import { usePresence } from "./presence/presence-context";

/*
function Box(props: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  useFrame((state, delta) => (meshRef.current.rotation.x += delta));
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "white"} />
    </mesh>
  );
}

function CameraComponent(props) {
  const ref = useThree((state) => state.camera);
  useFrame(() => ref.current.updateProjectionMatrix());

  return <perspectiveCamera ref={ref} {...props} />;
}
*/

function Light(props: { x: number; y: number; z: number; color: string }) {
  // const rLight = useRef<THREE.SpotLight>(null!);
  //useHelper(rLight, THREE.SpotLightHelper, "red");

  return (
    <>
      <spotLight
        // ref={rLight}
        position={[props.x, props.y, 5]}
        angle={0.9}
        penumbra={1}
        intensity={300}
        color={props.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
    </>
  );
}

function BackgroundPlane() {
  //const loader = new THREE.TextureLoader();
  return (
    <mesh rotation={[0, 0, 0]} position={[0, 0, -0.8]} receiveShadow>
      <planeGeometry attach="geometry" args={[20, 20]} />
      <shadowMaterial attach="material" opacity={0.1} />
      {/*<meshPhongMaterial
        //map={loader.load("/assets/PK_Logo_Layers_Flat.png")}
        attach="material"
        color="white"
        opacity={0}
        transparent
      />*/}
    </mesh>
  );
}

function CurrentUserLight(props: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const presence = usePresenceWithCursors((state) => state.myself?.presence);
  const [offset, setOffset] = useState({ left: 0, top: 0 });
  const { canvasRef } = props;
  const color = presence?.spotlightColor;

  useEffect(() => {
    if (!canvasRef.current) return;
    const { left, top } = canvasRef.current.getBoundingClientRect();
    setOffset({ left, top });
  }, [canvasRef]);

  if (!presence?.cursor) return null;
  if (!canvasRef.current) return null;
  if (!color) return null;

  const lightPosition = (x: number, y: number) => {
    const { left, top } = offset;
    const posX = x || 0 - left;
    const posY = y || 0 - top;
    return { x: -5 + posX / 70, y: 5 - posY / 70, z: 10 };
  };

  const myLightPosition = lightPosition(presence.cursor.x, presence.cursor.y);

  return (
    <Light
      key="currentUser"
      x={myLightPosition.x}
      y={myLightPosition.y}
      z={myLightPosition.z}
      color={color}
    />
  );
}

export default function Scene() {
  const rCanvas = useRef<HTMLCanvasElement>(null!);
  //const [mouseInCanvas, setMouseInCanvas] = useState(false);
  //const [offset, setOffset] = useState({ left: 0, top: 0 });
  const { otherPresence } = usePresenceWithCursors((state) => ({
    otherPresence: Object.fromEntries(
      Array.from(state.otherUsers.entries()).map(([id, user]) => [
        id,
        user.presence,
      ]),
    ),
  }));
  const { synced, updatePresence } = usePresence((state) => ({
    synced: state.synced,
    updatePresence: state.updatePresence,
  }));

  useEffect(() => {
    if (!synced) return;

    const colors = ["#ff0f0f"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    updatePresence({ spotlightColor: color });
  }, [synced, updatePresence]);

  /*useEffect(() => {
    if (!rCanvas.current) return;
    const { left, top } = rCanvas.current.getBoundingClientRect();
    setOffset({ left, top });
  }, [rCanvas.current]);*/

  /*const lightPosition = (x: number, y: number) => {
    const { left, top } = offset;
    const posX = x || 0 - left;
    const posY = y || 0 - top;
    return { x: -5 + posX / 70, y: 5 - posY / 70, z: 10 };
  };*/

  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
        zIndex: "15",
      }}
      ref={rCanvas}
      //onMouseEnter={() => setMouseInCanvas(true)}
      //onMouseLeave={() => setMouseInCanvas(false)}
      shadows
    >
      <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={10} />
      <ambientLight intensity={1.2} />
      <CurrentUserLight canvasRef={rCanvas} />
      <Suspense fallback={<Loader />}>
        <Logo />
      </Suspense>
      {Object.entries(otherPresence).map(([id, presence]) => {
        return (
          presence?.cursor && (
            <Light
              key={id}
              x={-5 + presence.cursor.x / 50}
              y={5 - presence.cursor.y / 50}
              z={10}
              color={presence.spotlightColor ?? "white"}
            />
          )
        );
      })}
      <pointLight position={[-10, -10, -10]} intensity={400} />
      {/*<Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />*/}
      <BackgroundPlane />
    </Canvas>
  );
}
