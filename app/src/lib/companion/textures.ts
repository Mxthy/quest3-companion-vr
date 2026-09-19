import { useEffect, useMemo } from "react";
import * as THREE from "three";

function canvasTex(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat = 1,
) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.repeat.set(repeat, repeat);
  tex.needsUpdate = true;
  return tex;
}

export function useRoomTextures() {
  const tex = useMemo(() => {
    const wood = canvasTex(
      512,
      (ctx, s) => {
        ctx.fillStyle = "#4a3428";
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 28; i++) {
          const x = (i / 28) * s;
          ctx.fillStyle = i % 2 ? "#3d2b21" : "#52392c";
          ctx.fillRect(x, 0, s / 28 + 1, s);
        }
        for (let y = 0; y < s; y += 2) {
          ctx.strokeStyle = `rgba(20,12,8,${0.04 + Math.random() * 0.08})`;
          ctx.beginPath();
          ctx.moveTo(0, y + Math.sin(y * 0.2) * 2);
          ctx.lineTo(s, y + Math.cos(y * 0.13) * 3);
          ctx.stroke();
        }
      },
      6,
    );
    wood.rotation = Math.PI / 2;

    const plaster = canvasTex(
      256,
      (ctx, s) => {
        ctx.fillStyle = "#2a241f";
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 1200; i++) {
          ctx.fillStyle = `rgba(255,240,220,${Math.random() * 0.04})`;
          ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
        }
      },
      2,
    );

    const city = canvasTex(512, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#141822");
      g.addColorStop(0.45, "#1c2230");
      g.addColorStop(1, "#2a211c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) {
        const bx = Math.random() * s;
        const bw = 18 + Math.random() * 40;
        const bh = 80 + Math.random() * 220;
        ctx.fillStyle = `rgba(8,10,16,${0.45 + Math.random() * 0.4})`;
        ctx.fillRect(bx, s - bh, bw, bh);
        const cols = Math.floor(bw / 6);
        const rows = Math.floor(bh / 8);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.55) {
              const on = Math.random();
              ctx.fillStyle =
                on > 0.86 ? "rgba(255,210,150,0.85)" : "rgba(180,200,230,0.28)";
              ctx.fillRect(bx + 2 + c * 6, s - bh + 4 + r * 8, 3, 4);
            }
          }
        }
      }
    });
    city.wrapS = city.wrapT = THREE.ClampToEdgeWrapping;
    city.repeat.set(1, 1);

    const rug = canvasTex(256, (ctx, s) => {
      ctx.fillStyle = "#3a2a24";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(200,160,120,0.18)";
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, s - 32, s - 32);
      ctx.strokeRect(32, 32, s - 64, s - 64);
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(90,50,40,${Math.random() * 0.2})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 3, 8);
      }
    });

    return { wood, plaster, city, rug };
  }, []);

  useEffect(() => {
    return () => {
      tex.wood.dispose();
      tex.plaster.dispose();
      tex.city.dispose();
      tex.rug.dispose();
    };
  }, [tex]);

  return tex;
}
