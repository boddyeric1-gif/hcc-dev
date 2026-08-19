import { useMemo } from "react";
import * as THREE from "three";

/**
 * Cheap volumetric light shafts: additive, depth-write-free cones that read as
 * dust-lit beams falling from the ceiling fixtures.
 */
export default function LightShafts({
  positions,
  color,
  height = 2.4,
  radius = 0.7,
  opacity = 0.055,
}: {
  positions: readonly [number, number, number][];
  color: string;
  height?: number;
  radius?: number;
  opacity?: number;
}) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [color, opacity],
  );

  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] - height / 2, p[2]]} material={material}>
          <coneGeometry args={[radius, height, 24, 1, true]} />
        </mesh>
      ))}
    </group>
  );
}
