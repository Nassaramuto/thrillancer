import { useEffect, useRef } from "react";
import type { Game } from "../world/game";

/** The design's circular minimap (zg-app.js `mm()`), plus dots for the other real people and the bot. */
export function Minimap({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    const PI = Math.PI;
    const draw = () => {
      const d = game.minimapData();
      const S0 = 100, sc = 0.5;
      const X = (x: number) => S0 + x * sc, Y = (z: number) => S0 + z * sc;
      g.clearRect(0, 0, 200, 200);
      g.save();
      g.beginPath();
      g.arc(S0, S0, 98, 0, PI * 2);
      g.clip();
      g.fillStyle = "rgba(20,12,56,.92)";
      g.fillRect(0, 0, 200, 200);
      g.strokeStyle = "rgba(154,140,255,.2)";
      for (const r of [30, 60, 90]) { g.beginPath(); g.arc(S0, S0, r, 0, PI * 2); g.stroke(); }
      g.fillStyle = "rgba(224,196,160,.9)";
      g.beginPath();
      g.arc(S0, S0, 22 * sc, 0, PI * 2);
      g.fill();
      g.strokeStyle = "rgba(227,195,160,.55)";
      g.lineWidth = 3;
      for (const p of [[0, -52], [40, -10], [-57, -10], [40, 62], [0, 66], [-38, 48], [-112, -116]]) {
        g.beginPath(); g.moveTo(S0, S0); g.lineTo(X(p[0]!), Y(p[1]!)); g.stroke();
      }
      g.fillStyle = "#6a5a90";
      g.beginPath();
      g.arc(X(-135), Y(-150), 28, 0, PI * 2);
      g.fill();
      if (d.route) {
        g.strokeStyle = "#3dffa0"; g.lineWidth = 3; g.setLineDash([5, 4]);
        g.beginPath(); g.moveTo(X(d.pos.x), Y(d.pos.z)); g.lineTo(X(d.route.x), Y(d.route.z)); g.stroke();
        g.setLineDash([]);
      }
      for (const v of d.dest) {
        if (v.minor) continue;
        const hl = d.route && d.route.label === v.n;
        g.fillStyle = v.c;
        g.beginPath(); g.arc(X(v.x), Y(v.z), hl ? 10 : 8, 0, PI * 2); g.fill();
        if (hl) { g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke(); }
        g.fillStyle = "#0b0828"; g.font = "700 10px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(v.k, X(v.x), Y(v.z) + 0.5);
      }
      g.fillStyle = "#ffc24a";
      for (const b of d.bikes) g.fillRect(X(b.x) - 1.5, Y(b.z) - 1.5, 3, 3);
      if (d.penguin) { g.fillStyle = "#fff"; g.beginPath(); g.arc(X(d.penguin.x), Y(d.penguin.z), 3.2, 0, PI * 2); g.fill(); }
      for (const p of d.players) {
        g.globalAlpha = p.connected ? 1 : 0.4;
        g.fillStyle = p.kind === "npc" ? "#b9b2ff" : "#ff4fd8";
        g.beginPath();
        if (p.kind === "npc") g.rect(X(p.x) - 3, Y(p.z) - 3, 6, 6);
        else g.arc(X(p.x), Y(p.z), 3.4, 0, PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
      const px = X(d.pos.x), py = Y(d.pos.z), cy = d.camYaw;
      g.fillStyle = "rgba(255,255,255,.14)";
      g.beginPath(); g.moveTo(px, py);
      g.arc(px, py, 34, Math.atan2(Math.cos(cy), Math.sin(cy)) - 0.6, Math.atan2(Math.cos(cy), Math.sin(cy)) + 0.6);
      g.closePath(); g.fill();
      g.translate(px, py);
      g.rotate(-d.yaw);
      g.fillStyle = "#3dffa0"; g.strokeStyle = "#0b0828"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, 7); g.lineTo(5, -5); g.lineTo(0, -2); g.lineTo(-5, -5); g.closePath(); g.fill(); g.stroke();
      g.restore();
      g.fillStyle = "#cfc8ff"; g.font = "700 10px sans-serif"; g.textAlign = "center"; g.fillText("N", S0, 10);
    };
    draw();
    const t = setInterval(draw, 60);
    return () => clearInterval(t);
  }, [game]);
  return <canvas ref={ref} width={200} height={200} className="minimap" aria-label="Minimap" />;
}
