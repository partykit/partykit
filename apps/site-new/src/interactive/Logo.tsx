// How to load models
// https://docs.pmnd.rs/react-three-fiber/tutorials/loading-models

//import { useGLTF } from "@react-three/drei";
import { Html, useProgress } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}

export default function Logo() {
  const gltf = useLoader(GLTFLoader, "/assets/PK_Balloon.gltf");
  //const gltf = useLoader(GLTFLoader, "/PK-Balloon_logo.gltf");
  gltf.scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });

  return (
    <primitive
      object={gltf.scene}
      scale={[45, 45, 45]}
      position={[0, 0.3, 0]}
    />
  );
}
/*const groupRef = useRef();
  const { nodes, materials } = useGLTF("/partykit_logo.gltf");
  return (
    <group ref={groupRef} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Curve007_1.geometry}
        material={materials["Material.001"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Curve007_2.geometry}
        material={materials["Material.002"]}
      />
    </group>
  );
}*/

//useGLTF.preload("/partykit_logo.gltf");
