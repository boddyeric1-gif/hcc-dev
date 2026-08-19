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
  /** Reflective floor plane size; 0 disables it. */
  floor?: number;
};

const DPR: Record<Quality, [number, number]> = {
  ultra: [1, 2],
  balanced: [1, 1.75],
  performance: [0.75, 1.25],
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
  return (
    <Canvas
      shadows={quality !== "performance"}
      dpr={DPR[quality]}
      gl={{
        antialias: quality !== "performance",
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95 * b,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95 * b;
      }}
    >
      <color attach="background" args={["#080d14"]} />
      {/* layered atmospheric depth rather than a flat wall of fog */}
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

      {/* base illumination — lifted so hardware reads clearly on any display */}
      <ambientLight intensity={0.3 * b} color="#8fb8dc" />
      <hemisphereLight args={["#9ec9ff", "#0d131b", 0.4 * b]} />
      <directionalLight position={[3.5, 5, 3]} intensity={0.5 * b} color="#cfe4ff" />
      <directionalLight position={[-4, 3, -2]} intensity={0.28 * b} color="#5f8dff" />

      <Suspense fallback={null}>
        <Environment preset="night" environmentIntensity={0.85 * b} />
        {floor > 0 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
            <planeGeometry args={[floor, floor]} />
            {quality === "performance" ? (
              <meshStandardMaterial color="#121821" roughness={0.55} metalness={0.5} />
            ) : (
              <MeshReflectorMaterial
                blur={[300, 90]}
                resolution={quality === "ultra" ? 1024 : 512}
                mixBlur={0.9}
                mixStrength={22}
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
        opacity={0.5}
        scale={14}
        blur={2.4}
        far={5}
        resolution={quality === "performance" ? 256 : 1024}
      />

      {quality !== "performance" && (
        <EffectComposer multisampling={quality === "ultra" ? 4 : 0}>
          <N8AO
            aoRadius={0.9}
            intensity={quality === "ultra" ? 2.1 : 1.5}
            distanceFalloff={1.1}
            quality={quality === "ultra" ? "high" : "medium"}
            halfRes={quality !== "ultra"}
            color="#050810"
          />
          <Bloom
            intensity={quality === "ultra" ? 1.5 : 1.1}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.42}
            mipmapBlur
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.3} darkness={0.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
