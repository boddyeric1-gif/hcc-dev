import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import SceneFrame from "./SceneFrame";
import LightShafts from "./Volumetrics";
import { DEFAULT_MINER_THEME, type MinerTheme } from "@/lib/hcc/themes";
import type { Quality } from "@/lib/hcc/types";

export type MiningVisual = {
  gpuRigs: number;
  asics: number;
  shelves: number;
  fans: number;
  heatRatio: number;
  online: boolean;
  accent: string;
  /** cosmetic palette; purely visual */
  theme?: MinerTheme;
};

/** Shared materials — one instance per visual state, not per mesh. */
function useFarmMaterials(theme: MinerTheme, hot: boolean, online: boolean, accent: string) {
  return useMemo(() => {
    const chassis = new THREE.MeshStandardMaterial({
      color: theme.chassis,
      roughness: theme.roughness,
      metalness: theme.metalness,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: theme.trim,
      roughness: theme.roughness,
      metalness: theme.metalness,
    });
    const shelf = new THREE.MeshStandardMaterial({
      color: "#12171d",
      roughness: 0.35,
      metalness: 0.9,
    });
    const shelfDeck = new THREE.MeshStandardMaterial({
      color: "#0f141a",
      roughness: 0.4,
      metalness: 0.85,
    });
    const fanRing = new THREE.MeshStandardMaterial({
      color: "#151a21",
      roughness: 0.4,
      metalness: 0.85,
    });
    const fanBlade = new THREE.MeshStandardMaterial({
      color: "#1d232b",
      roughness: 0.5,
      metalness: 0.6,
    });
    const led = new THREE.MeshStandardMaterial({
      color: "#04070a",
      emissive: online ? (hot ? "#ff3355" : theme.led) : "#0a0f14",
      emissiveIntensity: online ? (hot ? 3.4 : 2.4) : 0,
      toneMapped: false,
    });
    const shelfLight = new THREE.MeshStandardMaterial({
      color: "#000",
      emissive: hot ? "#ff4d6a" : accent,
      emissiveIntensity: hot ? 2.4 : 1.6,
      toneMapped: false,
    });
    return { chassis, trim, shelf, shelfDeck, fanRing, fanBlade, led, shelfLight };
  }, [theme, hot, online, accent]);
}

function Fan({
  position,
  speed,
  size = 0.22,
  animate,
  materials,
}: {
  position: [number, number, number];
  speed: number;
  size?: number;
  animate: boolean;
  materials: ReturnType<typeof useFarmMaterials>;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (animate && g.current && speed > 0) g.current.rotation.z += dt * speed;
  });
  return (
    <group position={position}>
      <mesh material={materials.fanRing}>
        <torusGeometry args={[size, 0.018, 6, 16]} />
      </mesh>
      <group ref={g}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            rotation={[0, 0, (i / 6) * Math.PI * 2]}
            position={[size * 0.45, 0, 0]}
            material={materials.fanBlade}
          >
            <boxGeometry args={[size * 0.8, 0.03, 0.02]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GpuRig({
  position,
  hot,
  online,
  materials,
  detail,
}: {
  position: [number, number, number];
  hot: boolean;
  online: boolean;
  materials: ReturnType<typeof useFarmMaterials>;
  detail: "full" | "simple";
}) {
  const cards = detail === "full" ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.28, 0, 0.28];
  return (
    <group position={position}>
      <RoundedBox args={[0.94, 0.06, 0.42]} radius={0.01} smoothness={detail === "full" ? 3 : 1} castShadow>
        <primitive object={materials.chassis} attach="material" />
      </RoundedBox>
      {cards.map((x) => (
        <group key={x} position={[x, 0.11, 0]}>
          <RoundedBox args={[0.13, 0.16, 0.4]} radius={0.01} smoothness={detail === "full" ? 3 : 1} castShadow>
            <primitive object={materials.trim} attach="material" />
          </RoundedBox>
          <mesh position={[0, 0.085, 0]} material={materials.led}>
            <boxGeometry args={[0.1, 0.005, 0.34]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Asic({
  position,
  online,
  materials,
  animateFans,
  detail,
}: {
  position: [number, number, number];
  online: boolean;
  materials: ReturnType<typeof useFarmMaterials>;
  animateFans: boolean;
  detail: "full" | "simple";
}) {
  return (
    <group position={position}>
      <RoundedBox args={[0.88, 0.26, 0.34]} radius={0.02} smoothness={detail === "full" ? 4 : 1} castShadow>
        <primitive object={materials.chassis} attach="material" />
      </RoundedBox>
      <Fan
        position={[-0.28, 0, 0.18]}
        speed={online ? 16 : 0}
        size={0.1}
        animate={animateFans}
        materials={materials}
      />
      <Fan
        position={[0.02, 0, 0.18]}
        speed={online ? 16 : 0}
        size={0.1}
        animate={animateFans}
        materials={materials}
      />
      <mesh position={[0.36, 0.02, 0.175]} material={materials.led}>
        <planeGeometry args={[0.1, 0.03]} />
      </mesh>
    </group>
  );
}

function Shelf({
  x,
  z,
  levels,
  materials,
}: {
  x: number;
  z: number;
  levels: number;
  materials: ReturnType<typeof useFarmMaterials>;
}) {
  const height = 0.28 + levels * 0.42;
  return (
    <group position={[x, 0, z]}>
      {[-0.45, 0.45].flatMap((zo) =>
        [-0.5, 0.5].map((xo) => (
          <mesh key={`${xo}:${zo}`} position={[xo, height / 2, zo]} castShadow material={materials.shelf}>
            <boxGeometry args={[0.05, height, 0.05]} />
          </mesh>
        )),
      )}
      {Array.from({ length: levels }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.28 + i * 0.42, 0]}
          receiveShadow
          castShadow
          material={materials.shelfDeck}
        >
          <boxGeometry args={[1.06, 0.03, 1]} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} material={materials.shelfLight}>
        <boxGeometry args={[1.02, 0.01, 0.02]} />
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
  const heatRatio = Math.max(0, Math.min(1.5, v.heatRatio));
  const hot = heatRatio > 0.75;
  const theme = v.theme ?? DEFAULT_MINER_THEME;
  const materials = useFarmMaterials(theme, hot, v.online, v.accent);

  // Full farm stays visible — detail + animation budget scale with quality/size.
  const LEVELS = 3;
  const PER_ROW = 5;
  const total = v.gpuRigs + v.asics;
  const shelves = Math.max(1, v.shelves || 1, Math.ceil(total / LEVELS));
  const shelfSlots = useMemo(
    () =>
      Array.from({ length: shelves }, (_, i) => {
        const row = Math.floor(i / PER_ROW);
        const col = i % PER_ROW;
        const inRow = Math.min(PER_ROW, shelves - row * PER_ROW);
        return { x: (col - (inRow - 1) / 2) * 1.25, z: -1.1 - row * 1.35, row };
      }),
    [shelves],
  );

  const positions = useMemo(() => {
    const out: { p: [number, number, number]; asic: boolean; row: number }[] = [];
    let placed = 0;
    for (const slot of shelfSlots) {
      for (let lvl = 0; lvl < LEVELS && placed < total; lvl++) {
        out.push({
          p: [slot.x, 0.33 + lvl * 0.42, slot.z],
          asic: placed >= v.gpuRigs,
          row: slot.row,
        });
        placed++;
      }
      if (placed >= total) break;
    }
    return out;
  }, [shelfSlots, total, v.gpuRigs]);

  // Animation budget: always show fans, only animate a limited set on huge farms.
  const maxAnimatedFans =
    quality === "performance" ? 6 : quality === "balanced" ? 14 : 28;
  let fanAnimBudget = maxAnimatedFans;

  // Geometry detail: front rows stay full; deep rows can simplify on lower quality.
  const detailForRow = (row: number): "full" | "simple" => {
    if (quality === "ultra") return "full";
    if (quality === "balanced") return row > 2 ? "simple" : "full";
    return row > 0 ? "simple" : "full";
  };

  // Heat-driven lighting — stronger as thermal load rises.
  const heatMix = Math.min(1, heatRatio);
  const accentIntensity = (v.online ? 14 : 4) + heatMix * 10;
  const wallColor = hot ? "#1c1014" : heatMix > 0.4 ? "#16141c" : "#101821";
  const shaftColor = hot ? "#ff7a8c" : heatMix > 0.45 ? "#d4a8ff" : "#bcd9ff";

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
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      <LightShafts
        positions={[
          [-1.5, 3.1, -1.1],
          [0, 3.1, -1.1],
          [1.5, 3.1, -1.1],
        ]}
        color={shaftColor}
        height={3.0}
        radius={0.5}
        opacity={quality === "performance" ? 0.01 : hot ? 0.022 : 0.014}
      />

      {shelfSlots.map((s, i) => (
        <Shelf key={i} x={s.x} z={s.z} levels={LEVELS} materials={materials} />
      ))}

      {positions.map((u, i) => {
        const detail = detailForRow(u.row);
        if (u.asic) {
          const animateFans = fanAnimBudget > 0;
          if (animateFans) fanAnimBudget -= 2;
          return (
            <Asic
              key={i}
              position={u.p}
              online={v.online}
              materials={materials}
              animateFans={animateFans && v.online}
              detail={detail}
            />
          );
        }
        return (
          <GpuRig
            key={i}
            position={u.p}
            hot={hot}
            online={v.online}
            materials={materials}
            detail={detail}
          />
        );
      })}

      {/* Ceiling fans — always present, animation budget applied */}
      {Array.from({ length: Math.min(4, Math.max(1, v.fans)) }).map((_, i) => {
        const animate = fanAnimBudget > 0;
        if (animate) fanAnimBudget -= 1;
        return (
          <Fan
            key={`ceil-${i}`}
            position={[-1.9 + i * 1.25, 2.05, -2.32]}
            speed={v.online ? 9 + i : 0}
            size={0.3}
            animate={animate && v.online}
            materials={materials}
          />
        );
      })}

      {/* Shared lighting replaces hundreds of per-unit lights */}
      <pointLight
        position={[0, 2.2, -0.6]}
        intensity={accentIntensity}
        distance={12}
        color={hot ? "#ff5470" : v.accent}
      />
      <pointLight position={[-2.4, 1.6, 1.2]} intensity={8 + heatMix * 3} distance={9} color="#4f86ff" />
      <pointLight position={[2.2, 1.4, 0.8]} intensity={6 + heatMix * 2} distance={9} color="#a9d6ff" />
      <spotLight
        position={[0, 3.4, 1.6]}
        angle={0.9}
        penumbra={1}
        intensity={20 + heatMix * 6}
        color={hot ? "#ffc8d0" : "#cfe6ff"}
        castShadow={quality !== "performance"}
      />
    </SceneFrame>
  );
}
