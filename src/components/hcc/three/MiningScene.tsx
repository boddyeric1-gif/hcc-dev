import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import SceneFrame from "./SceneFrame";
import LightShafts from "./Volumetrics";
import type { Quality } from "@/lib/hcc/types";

export type MiningVisual = {
  gpuRigs: number;
  asics: number;
  shelves: number;
  fans: number;
  heatRatio: number;
  online: boolean;
  accent: string;
};

function Fan({ position, speed, size = 0.22 }: { position: [number, number, number]; speed: number; size?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.z += dt * speed;
  });
  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[size, 0.018, 8, 24]} />
        <meshStandardMaterial color="#151a21" roughness={0.4} metalness={0.85} />
      </mesh>
      <group ref={g}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[size * 0.45, 0, 0]}>
            <boxGeometry args={[size * 0.8, 0.03, 0.02]} />
            <meshStandardMaterial color="#1d232b" roughness={0.5} metalness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GpuRig({ position, accent, hot, online }: { position: [number, number, number]; accent: string; hot: boolean; online: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.94, 0.06, 0.42]} radius={0.01} smoothness={3} castShadow>
        <meshStandardMaterial color="#0e1218" roughness={0.35} metalness={0.9} />
      </RoundedBox>
      {[-0.36, -0.18, 0, 0.18, 0.36].map((x) => (
        <group key={x} position={[x, 0.11, 0]}>
          <RoundedBox args={[0.13, 0.16, 0.4]} radius={0.01} smoothness={3} castShadow>
            <meshStandardMaterial color="#0b0f14" roughness={0.3} metalness={0.85} />
          </RoundedBox>
          <mesh position={[0, 0.085, 0]}>
            <boxGeometry args={[0.1, 0.005, 0.34]} />
            <meshStandardMaterial
              color="#04070a"
              emissive={online ? (hot ? "#ff3355" : accent) : "#0a0f14"}
              emissiveIntensity={online ? 2.4 : 0}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Asic({ position, accent, hot, online }: { position: [number, number, number]; accent: string; hot: boolean; online: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.88, 0.26, 0.34]} radius={0.02} smoothness={4} castShadow>
        <meshStandardMaterial color="#171b21" roughness={0.28} metalness={0.95} />
      </RoundedBox>
      <Fan position={[-0.28, 0, 0.18]} speed={online ? 16 : 0} size={0.1} />
      <Fan position={[0.02, 0, 0.18]} speed={online ? 16 : 0} size={0.1} />
      <mesh position={[0.36, 0.02, 0.175]}>
        <planeGeometry args={[0.1, 0.03]} />
        <meshStandardMaterial
          color="#04070a"
          emissive={online ? (hot ? "#ff3355" : accent) : "#0a0f14"}
          emissiveIntensity={online ? 3 : 0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Shelf({ x, levels, accent }: { x: number; levels: number; accent: string }) {
  return (
    <group position={[x, 0, -1.1]}>
      {[-0.45, 0.45].map((z) => (
        <mesh key={z} position={[-0.5, 0.62, z]} castShadow>
          <boxGeometry args={[0.05, 1.24, 0.05]} />
          <meshStandardMaterial color="#12171d" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
      {[-0.45, 0.45].map((z) => (
        <mesh key={`r${z}`} position={[0.5, 0.62, z]} castShadow>
          <boxGeometry args={[0.05, 1.24, 0.05]} />
          <meshStandardMaterial color="#12171d" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: levels }).map((_, i) => (
        <mesh key={i} position={[0, 0.28 + i * 0.42, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.06, 0.03, 1]} />
          <meshStandardMaterial color="#0f141a" roughness={0.4} metalness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 1.26, 0]}>
        <boxGeometry args={[1.02, 0.01, 0.02]} />
        <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function MiningScene({
  v,
  quality,
  brightness = 1.25,
}: {
  v: MiningVisual;
  quality: Quality;
  brightness?: number;
}) {
  const hot = v.heatRatio > 0.75;
  const shelves = Math.max(1, Math.min(3, v.shelves || 1));
  const positions: { p: [number, number, number]; asic: boolean }[] = [];
  let placed = 0;
  const total = v.gpuRigs + v.asics;
  for (let s = 0; s < shelves && placed < total; s++) {
    for (let lvl = 0; lvl < 3 && placed < total; lvl++) {
      const x = (s - (shelves - 1) / 2) * 1.25;
      positions.push({
        p: [x, 0.33 + lvl * 0.42, -1.1],
        asic: placed >= v.gpuRigs,
      });
      placed++;
    }
  }

  return (
    <SceneFrame
      quality={quality}
      brightness={brightness}
      camera={[0.4, 1.6, 3.3]}
      target={[0, 0.85, -0.8]}
      maxDistance={7}
    >
      <mesh position={[0, 2.2, -2.4]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color={hot ? "#1c1014" : "#101821"} roughness={0.9} />
      </mesh>

      <LightShafts
        positions={[
          [-1.5, 3.1, -1.1],
          [0, 3.1, -1.1],
          [1.5, 3.1, -1.1],
        ]}
        color={hot ? "#ff7a8c" : "#bcd9ff"}
        height={3.0}
        radius={0.5}
        opacity={quality === "performance" ? 0.008 : 0.014}
      />

      {Array.from({ length: shelves }).map((_, i) => (
        <Shelf key={i} x={(i - (shelves - 1) / 2) * 1.25} levels={3} accent={v.accent} />
      ))}

      {positions.map((u, i) =>
        u.asic ? (
          <Asic key={i} position={u.p} accent={v.accent} hot={hot} online={v.online} />
        ) : (
          <GpuRig key={i} position={u.p} accent={v.accent} hot={hot} online={v.online} />
        ),
      )}

      {Array.from({ length: Math.min(4, v.fans) }).map((_, i) => (
        <Fan
          key={i}
          position={[-1.9 + i * 1.25, 2.05, -2.32]}
          speed={v.online ? 9 + i : 0}
          size={0.3}
        />
      ))}

      <pointLight position={[0, 2.2, -0.6]} intensity={16} distance={11} color={hot ? "#ff5470" : v.accent} />
      <pointLight position={[-2.4, 1.6, 1.2]} intensity={8} distance={9} color="#4f86ff" />
      <pointLight position={[2.2, 1.4, 0.8]} intensity={6} distance={9} color="#a9d6ff" />
      <spotLight
        position={[0, 3.4, 1.6]}
        angle={0.9}
        penumbra={1}
        intensity={22}
        color="#cfe6ff"
        castShadow={quality !== "performance"}
      />
    </SceneFrame>
  );
}
