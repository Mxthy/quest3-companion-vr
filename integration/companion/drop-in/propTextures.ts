/**
 * Cozy atelier textures – canvas procedural (no external assets required).
 * Palette: warm plaster, amber wood, soft ceramic, vinyl black, lantern paper.
 * KB notes: procedural noise for micro-variation; later optional KTX2 for Quest.
 */
import { useMemo } from "react";
import * as THREE from "three";

function canvasTex(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  opts?: { repeat?: number; anisotropy?: number },
) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = opts?.anisotropy ?? 8;
  const r = opts?.repeat ?? 1;
  tex.repeat.set(r, r);
  tex.needsUpdate = true;
  return tex;
}

function noiseDots(ctx: CanvasRenderingContext2D, s: number, n: number, a: number) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(255,240,220,${Math.random() * a})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

export function usePropTextures() {
  return useMemo(() => {
    const ceramic = canvasTex(256, (ctx, s) => {
      const g = ctx.createRadialGradient(s * 0.4, s * 0.35, 10, s * 0.5, s * 0.5, s * 0.7);
      g.addColorStop(0, "#f3ebe3");
      g.addColorStop(0.6, "#e4d5c6");
      g.addColorStop(1, "#cbb8a4");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      noiseDots(ctx, s, 400, 0.06);
      ctx.strokeStyle = "rgba(140,110,90,0.08)";
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.5, 20 + i * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    const vinyl = canvasTex(512, (ctx, s) => {
      ctx.fillStyle = "#12110f";
      ctx.fillRect(0, 0, s, s);
      const cx = s / 2,
        cy = s / 2;
      for (let r = 20; r < s * 0.48; r += 3) {
        ctx.strokeStyle = `rgba(60,55,50,${0.15 + (r % 7) * 0.02})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#c8b09a";
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a221c";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a7060";
      ctx.font = "bold 14px serif";
      ctx.textAlign = "center";
      ctx.fillText("ATELIER", cx, cy + 4);
    });

    const paper = canvasTex(256, (ctx, s) => {
      ctx.fillStyle = "#e8dcc8";
      ctx.fillRect(0, 0, s, s);
      noiseDots(ctx, s, 800, 0.07);
      for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = `rgba(120,90,60,${0.03 + Math.random() * 0.04})`;
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * s);
        ctx.lineTo(s, Math.random() * s);
        ctx.stroke();
      }
    });

    const metalDark = canvasTex(128, (ctx, s) => {
      ctx.fillStyle = "#2a2420";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(200,180,150,${0.04 + Math.random() * 0.06})`;
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * s);
        ctx.lineTo(s, Math.random() * s);
        ctx.stroke();
      }
    });

    const silicone = canvasTex(256, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, "#e8b4c8");
      g.addColorStop(0.5, "#d494b0");
      g.addColorStop(1, "#c47a9a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      noiseDots(ctx, s, 200, 0.05);
    });

    const siliconeAlt = canvasTex(256, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#c8b8e0");
      g.addColorStop(1, "#9a88c4");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      noiseDots(ctx, s, 180, 0.05);
    });

    const fabric = canvasTex(
      256,
      (ctx, s) => {
        ctx.fillStyle = "#d4c4b0";
        ctx.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 4) {
          for (let x = 0; x < s; x += 4) {
            ctx.fillStyle =
              (x + y) % 8 === 0 ? "rgba(180,160,140,0.35)" : "rgba(255,245,230,0.12)";
            ctx.fillRect(x, y, 3, 3);
          }
        }
      },
      { repeat: 2 },
    );

    const glass = canvasTex(128, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, "#e8f0f4");
      g.addColorStop(0.5, "#c5d8e0");
      g.addColorStop(1, "#a8c0cc");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(s * 0.2, 0, s * 0.15, s);
    });

    return { ceramic, vinyl, paper, metalDark, silicone, siliconeAlt, fabric, glass };
  }, []);
}

export type PropTextures = ReturnType<typeof usePropTextures>;
