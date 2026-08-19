import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

import type { Quality } from "@/lib/hcc/types";

type Props = {
  children: ReactNode;
  quality: Quality;
  camera?: [number, number, number];
  target?: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
};

const DPR: Record<Quality, [number, number]> = {
  ultra: [1, 2],
  balanced: [1, 1.5],
  performance: [0.75, 1],
};

export default function SceneFrame({
  children,
  quality,
  camera = [0, 1.35, 3.1],
  target = [0, 0.95, 0],
  minDistance = 1.6,
  maxDistance = 5.5,
}: Props) {
  return (
    <Canvas
      shadows={quality !== "performance"}
      dpr={DPR[quality]}
      gl={{ antialias: quality !== "performance", powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#05080d"]} />
      <fog attach="fog" args={["#05080d", 6, 16]} />
      <PerspectiveCamera makeDefault position={camera} fov={38} />
      <OrbitControls
        target={target}
        enablePan={false}
        minDistance={minDistance}
        maxDistance={maxDistance}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
      />
      <ambientLight intensity={0.3} color="#4a6a8a" />
      <Suspense fallback={null}>
        <Environment preset="night" environmentIntensity={0.5} />
        {children}
      </Suspense>
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.65}
        scale={14}
        blur={2.6}
        far={5}
        resolution={quality === "performance" ? 256 : 1024}
      />
      {quality !== "performance" && (
        <EffectComposer>
          <Bloom
            intensity={quality === "ultra" ? 1.25 : 0.85}
            luminanceThreshold={0.28}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.22} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
