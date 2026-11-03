import { useRef, useState } from "react";
import { Readout, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

// 碳库：大气 CO₂ / 生产者 / 消费者 / 分解者+化石燃料
type Node = { id: string; x: number; y: number; label: string; sub: string };
const NODES: Node[] = [
  { id: "air", x: 200, y: 52, label: "大气 CO₂ 库", sub: "碳循环枢纽" },
  { id: "prod", x: 76, y: 160, label: "生产者", sub: "植物·光合作用" },
  { id: "cons", x: 324, y: 160, label: "消费者", sub: "动物·捕食" },
  { id: "decomp", x: 200, y: 262, label: "分解者", sub: "分解有机物" },
];
type Flow = { from: string; to: string; label: string; on: boolean; bend?: number };
const FLOWS = (burn: boolean, deforest: boolean): Flow[] => [
  { from: "air", to: "prod", label: "光合吸收", on: !deforest },
  { from: "prod", to: "air", label: "呼吸释放", on: true },
  { from: "prod", to: "cons", label: "捕食", on: true },
  { from: "cons", to: "air", label: "呼吸", on: true },
  { from: "cons", to: "decomp", label: "遗体/排出物", on: true },
  { from: "prod", to: "decomp", label: "落叶枯枝", on: true },
  { from: "decomp", to: "air", label: "分解归还", on: true },
  { from: "decomp", to: "air", label: "化石燃料燃烧", on: burn, bend: 60 },
];

type P = { flowIdx: number; k: number; speed: number };
const pos = (n: string) => NODES.find((x) => x.id === n)!;

export function CarbonCycle() {
  const [burn, setBurn] = useState(false);
  const [deforest, setDeforest] = useState(false);
  const [, force] = useState(0);
  const parts = useRef<P[]>([]);
  const co2Ref = useRef(100); // 相对 CO₂ 浓度
  useFrame((dt) => {
    // 粒子沿激活的流生成
    const flows = FLOWS(burn, deforest);
    if (Math.random() < dt * 2.2) {
      const on = flows.map((f, i) => ({ f, i })).filter(({ f }) => f.on);
      if (on.length) {
        const pick = on[Math.floor(Math.random() * on.length)]!;
        parts.current.push({ flowIdx: pick.i, k: 0, speed: 0.34 + Math.random() * 0.2 });
      }
    }
    for (const p of parts.current) p.k += dt * p.speed;
    parts.current = parts.current.filter((p) => p.k <= 1);
    // CO₂ 动态：燃烧净增，砍伐减少吸收
    const drift = (burn ? 5.5 : 0) - (deforest ? -3.5 : 0) + (100 - co2Ref.current) * 0.18;
    co2Ref.current = Math.max(60, Math.min(280, co2Ref.current + drift * dt));
    force((v) => v + 1);
  });

  const flows = FLOWS(burn, deforest);
  const point = (f: Flow, k: number) => {
    const a = pos(f.from);
    const b = pos(f.to);
    const bend = f.bend ?? 0;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + bend;
    // 二次贝塞尔
    const t = k;
    return {
      x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mx + t * t * b.x,
      y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * my + t * t * b.y,
    };
  };
  const pathOf = (f: Flow) => {
    const a = pos(f.from);
    const b = pos(f.to);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + (f.bend ?? 0);
    return `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
  };

  const co2 = co2Ref.current;
  const temp = ((co2 - 100) / 180) * 3.5;

  return (
    <>
      <Stage caption="碳循环：CO₂ 在无机环境与生物群落之间反复循环">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 库节点 */}
          {NODES.map((n) => (
            <g key={n.id}>
              <ellipse cx={n.x} cy={n.y} rx="52" ry="26" fill="oklch(0.7 0.06 160 / 0.14)" stroke={n.id === "air" ? "var(--signal)" : "var(--membrane)"} strokeWidth="1.5" opacity={n.id === "prod" && deforest ? 0.5 : 1} />
              <text x={n.x} y={n.y - 2} fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                {n.label}
              </text>
              <text x={n.x} y={n.y + 12} fontSize="8" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
                {n.sub}
              </text>
            </g>
          ))}
          {/* 流箭头 */}
          {flows.map((f, i) => (
            <path key={i} d={pathOf(f)} stroke={f.label === "化石燃料燃烧" ? "var(--signal)" : "var(--stage-foreground)"} strokeOpacity={f.on ? 0.45 : 0.1} strokeWidth="1.4" fill="none" strokeDasharray="5 4" markerEnd="url(#cc-arrow)" />
          ))}
          <defs>
            <marker id="cc-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0 0 L7 3.5 L0 7 Z" fill="var(--stage-foreground)" fillOpacity="0.6" />
            </marker>
          </defs>
          {/* 流动粒子（CO₂ 小球） */}
          {parts.current.map((p, i) => {
            const f = flows[p.flowIdx];
            if (!f || !f.on) return null;
            const pt = point(f, Math.min(1, p.k));
            return <circle key={i} cx={pt.x} cy={pt.y} r="3.6" fill={f.label === "化石燃料燃烧" ? "var(--signal)" : "oklch(0.65 0.1 220 / 0.9)"} />;
          })}
          {/* 温度计 */}
          <g>
            <rect x="372" y="24" width="12" height="120" rx="6" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.4" />
            <rect x="374" y={24 + 120 - (temp / 4) * 116} width="8" rx="4" height={Math.max(4, (temp / 4) * 116)} fill="oklch(0.6 0.18 25)" />
            <text x="378" y="158" fontSize="8" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
              ΔT {temp >= 0 ? "+" : ""}
              {temp.toFixed(1)}°C
            </text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setBurn((v) => !v)}
            className={`rounded-lg border p-3 text-left text-sm transition-colors ${burn ? "border-primary bg-accent text-accent-foreground" : "hover:bg-accent"}`}
          >
            化石燃料大量燃烧
            <span className="mt-1 block text-xs text-muted-foreground">{burn ? "开启：额外 CO₂ 涌入大气" : "关闭"}</span>
          </button>
          <button
            onClick={() => setDeforest((v) => !v)}
            className={`rounded-lg border p-3 text-left text-sm transition-colors ${deforest ? "border-primary bg-accent text-accent-foreground" : "hover:bg-accent"}`}
          >
            过度砍伐森林
            <span className="mt-1 block text-xs text-muted-foreground">{deforest ? "开启：生产者固碳受阻" : "关闭"}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="大气 CO₂ 相对浓度" value={co2.toFixed(0)} tone={co2 > 130 ? "warn" : "good"} />
          <Readout label="碳收支状态" value={burn || deforest ? "失衡：释放 > 吸收" : "动态平衡"} tone={burn || deforest ? "warn" : "good"} />
          <Readout label="温室效应" value={temp > 0.5 ? `升温 +${temp.toFixed(1)}°C` : "轻微"} tone={temp > 1 ? "warn" : undefined} />
          <Readout label="循环形式" value="CO₂（气体）为主" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {burn
            ? "工业革命以来化石燃料的开采使地质时期封存的碳短期内释放回大气——碳循环平衡被打破，CO₂ 浓度上升加剧温室效应。"
            : deforest
              ? "森林是重要的碳汇：过度砍伐削弱了生产者对 CO₂ 的固定吸收，大气 CO₂ 难以回归平衡。"
              : "碳在无机环境与生物群落之间以 CO₂ 形式循环：光合作用使之进入生物群落，呼吸与分解又使之返回大气——分解者是循环畅通的关键环节。"}
        </p>
      </div>
    </>
  );
}
