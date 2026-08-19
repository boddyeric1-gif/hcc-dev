import * as THREE from "three";

export const matte = (color: string, roughness = 0.72, metalness = 0.15) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export const metal = (color: string, roughness = 0.28) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.94 });

export const glass = (color = "#0b1420") =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.06,
    metalness: 0,
    transmission: 0.72,
    thickness: 0.4,
    ior: 1.45,
    transparent: true,
    opacity: 0.85,
  });

export const emissive = (color: string, intensity = 2.4) =>
  new THREE.MeshStandardMaterial({
    color: "#04070c",
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0.1,
  });
