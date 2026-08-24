import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import SceneFrame from "./SceneFrame";
import { makeScreenTexture } from "./screenTexture";
import { DEFAULT_RIG_THEME, type RigTheme } from "@/lib/hcc/themes";
import type { Quality } from "@/lib/hcc/types";

export type RigVisual = {
  desk: number;
  chair: number;
  monitors: number;
  gpu: number;
  cooling: number;
  storage: number;
  router: number;
  accent: string;
  deskmat: number;
  poster: number;
  load: number;
  /** cosmetic palette; purely visual */
  theme?: RigTheme;
};

function Room({ accent, theme }: { accent: string; theme: RigTheme }) {
  return (
    <group>
      <mesh position={[0, 2.2, -2.1]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color={theme.wall} roughness={0.88} metalness={0.08} />
      </mesh>
      {[-3.4, 3.4].map((x) => (
        <mesh key={x} position={[x, 2.2, -2.08]}>
          <planeGeometry args={[0.04, 3.2]} />
          <meshStandardMaterial color="#000" emissive={theme.glow} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[-2.6, 2.4, -1.4]} intensity={13} distance={9} color={accent} />
      <pointLight position={[2.6, 2.4, -1.4]} intensity={9} distance={9} color={theme.glow} />
      <pointLight position={[0, 1.7, 1.4]} intensity={4} distance={6} color={theme.key} />
    </group>
  );
}


function Desk({ tier, accent, mat }: { tier: number; accent: string; mat: number }) {
  const topColor = tier >= 3 ? "#3a2517" : tier === 2 ? "#171b21" : "#20242a";
  return (
    <group>
      <RoundedBox args={[2.9, 0.06, 1.15]} radius={0.02} smoothness={4} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={topColor} roughness={tier >= 3 ? 0.42 : 0.6} metalness={tier >= 3 ? 0.1 : 0.35} />
      </RoundedBox>
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, 0.37, 0]} castShadow>
          <boxGeometry args={[0.08, 0.72, 0.9]} />
          <meshStandardMaterial color="#12161c" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
      {tier >= 2 && (
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[2.86, 0.012, 1.1]} />
          <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, 0.775, 0.16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, 0.6]} />
        <meshStandardMaterial color={mat >= 2 ? "#0d2430" : "#0e1116"} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Monitor({
  position,
  rotation,
  size,
  tex,
  accent,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  tex: THREE.Texture;
  accent: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[size[0], size[1], 0.035]} radius={0.012} smoothness={4} castShadow>
        <meshStandardMaterial color="#0b0e13" roughness={0.35} metalness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[size[0] - 0.03, size[1] - 0.03]} />
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={1.35} toneMapped={false} />
      </mesh>
      <mesh position={[0, -size[1] / 2 - 0.11, -0.02]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.22, 12]} />
        <meshStandardMaterial color="#161a20" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, -size[1] / 2 - 0.21, 0.02]} castShadow>
        <boxGeometry args={[0.34, 0.02, 0.18]} />
        <meshStandardMaterial color="#161a20" roughness={0.3} metalness={0.9} />
      </mesh>
      <pointLight position={[0, 0, 0.4]} intensity={1.6} distance={2.4} color={accent} />
    </group>
  );
}

function Tower({ gpu, cooling, accent, load }: { gpu: number; cooling: number; accent: string; load: number }) {
  const fan = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (fan.current) fan.current.rotation.z += dt * (3 + load * 14);
  });
  return (
    <group position={[1.15, 0.74, -0.15]}>
      <RoundedBox args={[0.4, 0.78, 0.72]} radius={0.02} smoothness={4} position={[0, 0.39, 0]} castShadow>
        <meshStandardMaterial color="#0c1015" roughness={0.32} metalness={0.85} />
      </RoundedBox>
      <mesh position={[-0.201, 0.39, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.68, 0.72]} />
        <meshPhysicalMaterial color="#0a1119" transmission={0.75} thickness={0.3} roughness={0.05} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.05, 0.42, 0]}>
        <boxGeometry args={[0.22, 0.06, 0.5]} />
        <meshStandardMaterial color="#0a0d12" emissive={accent} emissiveIntensity={gpu >= 3 ? 3.2 : 1.6} toneMapped={false} />
      </mesh>
      {gpu >= 3 && (
        <mesh position={[-0.05, 0.28, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.5]} />
          <meshStandardMaterial color="#0a0d12" emissive={accent} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      )}
      <group ref={fan} position={[0, 0.69, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[0.06, 0, 0]}>
            <boxGeometry args={[0.11, 0.02, 0.02]} />
            <meshStandardMaterial color="#1b2028" roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
      </group>
      {cooling >= 3 && (
        <mesh position={[0.202, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.5, 0.1]} />
          <meshStandardMaterial color="#050709" emissive="#39d9ff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
      <pointLight position={[-0.35, 0.4, 0]} intensity={2.2} distance={1.6} color={accent} />
    </group>
  );
}

function Peripherals({ accent }: { accent: string }) {
  return (
    <group>
      <group position={[-0.1, 0.79, 0.28]}>
        <RoundedBox args={[0.62, 0.02, 0.2]} radius={0.008} smoothness={3} castShadow>
          <meshStandardMaterial color="#101419" roughness={0.5} metalness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.013, 0]}>
          <planeGeometry args={[0.58, 0.17]} />
          <meshStandardMaterial color="#05080b" emissive={accent} emissiveIntensity={0.85} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0.42, 0.795, 0.28]} castShadow>
        <capsuleGeometry args={[0.035, 0.05, 4, 12]} />
        <meshStandardMaterial color="#12161c" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-0.95, 0.82, 0.2]} castShadow>
        <cylinderGeometry args={[0.05, 0.045, 0.1, 20]} />
        <meshStandardMaterial color="#1b2229" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Chair({ tier }: { tier: number }) {
  const color = tier >= 3 ? "#171a1f" : "#141821";
  return (
    <group position={[0, 0, 1.45]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.05, 24]} />
        <meshStandardMaterial color="#0d1015" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
        <meshStandardMaterial color="#22272e" roughness={0.3} metalness={0.9} />
      </mesh>
      <RoundedBox args={[0.52, 0.08, 0.5]} radius={0.03} smoothness={4} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.85} />
      </RoundedBox>
      <RoundedBox
        args={[0.5, 0.72, 0.08]}
        radius={0.03}
        smoothness={4}
        position={[0, 0.86, 0.22]}
        rotation={[0.14, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color={color} roughness={0.85} />
      </RoundedBox>
    </group>
  );
}

function Rack({ tier, accent }: { tier: number; accent: string }) {
  if (tier < 2) return null;
  return (
    <group position={[-1.75, 0, -1.3]}>
      <RoundedBox args={[0.55, 1.1, 0.5]} radius={0.02} smoothness={4} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#0b0f14" roughness={0.35} metalness={0.9} />
      </RoundedBox>
      {[0.2, 0.42, 0.64, 0.86].slice(0, tier + 1).map((y) => (
        <mesh key={y} position={[0, y, 0.255]}>
          <planeGeometry args={[0.46, 0.06]} />
          <meshStandardMaterial color="#05080b" emissive={accent} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Poster({ tier, accent }: { tier: number; accent: string }) {
  if (tier < 1) return null;
  return (
    <group position={[-1.5, 1.9, -2.05]}>
      <mesh>
        <planeGeometry args={[0.9, 1.2]} />
        <meshStandardMaterial color="#080b11" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.8, 1.1]} />
        <meshStandardMaterial color="#050709" emissive={tier >= 2 ? "#39ff9e" : accent} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function RigScene({
  v,
  quality,
  brightness = 1.25,
}: {
  v: RigVisual;
  quality: Quality;
  brightness?: number;
}) {
  const texA = useMemo(() => makeScreenTexture("terminal", v.accent), [v.accent]);
  const texB = useMemo(() => makeScreenTexture("graph", v.accent), [v.accent]);
  const texC = useMemo(() => makeScreenTexture("map", v.accent), [v.accent]);

  const monitors = useMemo(() => {
    const h = v.monitors >= 4 ? 0.46 : v.monitors >= 3 ? 0.4 : 0.36;
    const w = v.monitors >= 4 ? 1.6 : v.monitors >= 3 ? 0.72 : 0.66;
    if (v.monitors <= 1) return [{ p: [0, 1.06, -0.32] as [number, number, number], r: [0, 0, 0] as [number, number, number], s: [0.7, 0.42] as [number, number], t: texA }];
    if (v.monitors === 2)
      return [
        { p: [-0.4, 1.05, -0.3], r: [0, 0.22, 0], s: [w, h], t: texA },
        { p: [0.4, 1.05, -0.3], r: [0, -0.22, 0], s: [w, h], t: texB },
      ] as { p: [number, number, number]; r: [number, number, number]; s: [number, number]; t: THREE.Texture }[];
    if (v.monitors === 3)
      return [
        { p: [-0.82, 1.06, -0.18], r: [0, 0.42, 0], s: [w, h], t: texC },
        { p: [0, 1.08, -0.36], r: [0, 0, 0], s: [w, h], t: texA },
        { p: [0.82, 1.06, -0.18], r: [0, -0.42, 0], s: [w, h], t: texB },
      ] as { p: [number, number, number]; r: [number, number, number]; s: [number, number]; t: THREE.Texture }[];
    return [
      { p: [0, 1.05, -0.34], r: [0, 0, 0], s: [w, h], t: texA },
      { p: [0, 1.5, -0.4], r: [-0.12, 0, 0], s: [0.9, 0.32], t: texB },
    ] as { p: [number, number, number]; r: [number, number, number]; s: [number, number]; t: THREE.Texture }[];
  }, [v.monitors, texA, texB, texC]);

  return (
    <SceneFrame
      quality={quality}
      brightness={brightness}
      camera={[0.25, 1.95, 3.5]}
      target={[0, 1.0, -0.35]}
      floor={24}
    >
      <Room accent={v.accent} />
      <Desk tier={v.desk} accent={v.accent} mat={v.deskmat} />
      {monitors.map((m, i) => (
        <Monitor key={i} position={m.p} rotation={m.r} size={m.s} tex={m.t} accent={v.accent} />
      ))}
      <Tower gpu={v.gpu} cooling={v.cooling} accent={v.accent} load={v.load} />
      <Peripherals accent={v.accent} />
      <Chair tier={v.chair} />
      <Rack tier={v.storage} accent={v.accent} />
      <Poster tier={v.poster} accent={v.accent} />
      <spotLight
        position={[0, 3.2, 1.2]}
        angle={0.55}
        penumbra={1}
        intensity={12}
        color="#9fd8ff"
        castShadow={quality !== "performance"}
        shadow-mapSize={[1024, 1024]}
      />
    </SceneFrame>
  );
}
