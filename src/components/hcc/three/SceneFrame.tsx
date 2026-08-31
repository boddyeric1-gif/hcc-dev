import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { EffectComposer, Bloom, N8AO, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

import type { Quality } from "@/lib/hcc/types";

type Props = {
  children: ReactNode;
  quality: Quality;
  brightness?: number;
  camera?: [number, number, number];
  target?: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
  floor?: number;
};

const DPR: Record<Quality, [number, number]> = {
  ultra: [1, 1.75],
  balanced: [1, 1.35],
  performance: [0.7, 1.1],
};

export default function SceneFrame({
  children,
  quality,
  brightness = 1.25,
  camera = [0, 1.35, 3.1],
  target = [0, 0.95, 0],
  minDistance = 1.6,
  maxDistance = 5.5,
  floor = 26,
}: Props) {
  const b = Math.max(0.6, Math.min(2.4, brightness));
  const heavy = quality === "ultra";
  return (
    <Canvas
      shadows={quality !== "performance"}
      dpr={DPR[quality]}
      frameloop="always"
      gl={{
        antialias: quality === "ultra",
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95 * b,
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95 * b;
      }}
    >
      <color attach="background" args={["#080d14"]} />
      <fogExp2 attach="fog" args={["#0a121b", 0.055 / Math.max(0.7, b)]} />
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

      <ambientLight intensity={0.3 * b} color="#8fb8dc" />
      <hemisphereLight args={["#7fa8d8", "#0a0f16", 0.28 * b]} />
      <directionalLight position={[3.5, 5, 3]} intensity={0.32 * b} color="#cfe4ff" />
      <directionalLight position={[-4, 3, -2]} intensity={0.28 * b} color="#5f8dff" />

      <Suspense fallback={null}>
        {quality !== "performance" && (
          <Environment preset="night" environmentIntensity={(heavy ? 0.85 : 0.55) * b} />
        )}
        {floor > 0 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
            <planeGeometry args={[floor, floor]} />
            {quality === "performance" ? (
              <meshStandardMaterial color="#121821" roughness={0.55} metalness={0.5} />
            ) : (
              <MeshReflectorMaterial
                blur={heavy ? [300, 90] : [120, 40]}
                resolution={heavy ? 768 : 384}
                mixBlur={0.9}
                mixStrength={heavy ? 22 : 12}
                depthScale={1.1}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.35}
                roughness={0.72}
                metalness={0.65}
                color="#141b25"
                mirror={0}
              />
            )}
          </mesh>
        )}
        {children}
      </Suspense>

      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.45}
        scale={14}
        blur={2.2}
        far={5}
        resolution={quality === "performance" ? 128 : quality === "balanced" ? 384 : 768}
      />

      {quality !== "performance" && (
        <EffectComposer multisampling={heavy ? 2 : 0}>
          <N8AO
            aoRadius={0.85}
            intensity={heavy ? 1.8 : 1.2}
            distanceFalloff={1.1}
            quality={heavy ? "medium" : "low"}
            halfRes
            color="#050810"
          />
          <Bloom
            intensity={heavy ? 1.35 : 0.95}
            luminanceThreshold={0.24}
            luminanceSmoothing={0.42}
            mipmapBlur
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.3} darkness={0.48} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
