import * as THREE from "three";

export function makeScreenTexture(kind: "terminal" | "graph" | "map", accent: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const g = c.getContext("2d");
  if (!g) return new THREE.CanvasTexture(c);
  g.fillStyle = "#04080e";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = accent;
  g.globalAlpha = 0.09;
  g.fillRect(0, 0, c.width, 26);
  g.globalAlpha = 1;

  if (kind === "terminal") {
    g.font = "13px monospace";
    for (let i = 0; i < 20; i++) {
      const w = 60 + Math.abs(Math.sin(i * 2.3)) * 330;
      g.fillStyle = i % 5 === 0 ? accent : "#7fe9c9";
      g.globalAlpha = i % 3 === 0 ? 0.95 : 0.55;
      g.fillRect(18, 40 + i * 13, w, 5);
    }
  } else if (kind === "graph") {
    g.strokeStyle = accent;
    g.globalAlpha = 0.35;
    for (let x = 0; x < c.width; x += 32) {
      g.beginPath();
      g.moveTo(x, 30);
      g.lineTo(x, c.height);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x < c.width; x += 8) {
      const y = 220 - Math.sin(x / 34) * 60 - Math.sin(x / 11) * 18;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  } else {
    g.globalAlpha = 0.5;
    g.strokeStyle = accent;
    for (let i = 0; i < 26; i++) {
      const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * c.width;
      const y = 40 + (Math.sin(i * 78.233) * 0.5 + 0.5) * (c.height - 60);
      g.beginPath();
      g.arc(x, y, 4 + (i % 3) * 2, 0, Math.PI * 2);
      g.stroke();
      if (i > 0) {
        const px = (Math.sin((i - 1) * 12.9898) * 0.5 + 0.5) * c.width;
        const py = 40 + (Math.sin((i - 1) * 78.233) * 0.5 + 0.5) * (c.height - 60);
        g.globalAlpha = 0.2;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(x, y);
        g.stroke();
        g.globalAlpha = 0.5;
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
