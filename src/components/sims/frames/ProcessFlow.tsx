import { useEffect, useRef, useState } from "react";
import type { ProcessConfig } from "@/data/remade/schema";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 过程演示框架：把阶段序列画成流程舞台——节点沿蛇形排布，
// 信号粒子沿路径流动，支持单步/自动播放，当前阶段高亮展开解读。
export function ProcessFlow({ config, title }: { config: ProcessConfig; title: string }) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [, force] = useState(0);
  const t = useRef(0);
  const n = config.stages.length;

  useFrame((dt) => {
    if (!playing) return;
    t.current += dt;
    if (t.current > 2.4) {
      t.current = 0;
      setStage((s) => (s + 1) % n);
    }
    force((v) => v + 1);
  });

  // 蛇形节点坐标
  const perRow = n <= 6 ? 3 : 4;
  const pos = (i: number) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rev = row % 2 === 1;
    return { x: 66 + (rev ? perRow - 1 - col : col) * ((280 - 22) / Math.max(1, perRow - 1)), y: 70 + row * 92 };
  };
  const cur = config.stages[stage] ?? config.stages[0]!;
  useEffect(() => {
    t.current = 0;
  }, [stage]);

  return (
    <>
      <Stage caption={`${title} · 共 ${n} 个阶段`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 节点间连线（蛇形） */}
          {config.stages.slice(0, -1).map((_, i) => {
            const a = pos(i);
            const b = pos(i + 1);
            const mx = (a.x + b.x) / 2;
            const arc = Math.floor(i / perRow) === Math.floor((i + 1) / perRow) ? `L` : `Q`;
            const d =
              arc === "L"
                ? `M${a.x + 26} ${a.y} L${b.x - 26} ${b.y}`
                : `M${a.x} ${a.y + 26} Q${mx} ${a.y + 56}, ${b.x} ${b.y - 26}`;
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="var(--stage-foreground)" strokeOpacity={i < stage ? 0.7 : 0.2} strokeWidth="2" markerEnd="url(#arw)" />
              </g>
            );
          })}
          <defs>
            <marker id="arw" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="var(--stage-foreground)" />
            </marker>
          </defs>
          {/* 阶段节点 */}
          {config.stages.map((s, i) => {
            const p = pos(i);
            const on = i === stage;
            const done = i < stage;
            return (
              <g key={i} onClick={() => setStage(i)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={on ? 26 : 22} fill={on ? "var(--signal)" : done ? "var(--stage-foreground)" : "transparent"} fillOpacity={on ? 0.9 : done ? 0.25 : 0.06} stroke="var(--stage-foreground)" strokeOpacity={on ? 1 : 0.5} strokeWidth="2" />
                <text x={p.x} y={p.y + 5} fontSize="15" textAnchor="middle" fill={on ? "oklch(0.15 0.02 240)" : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
                  {i + 1}
                </text>
                <text x={p.x} y={p.y + 44} fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" opacity={on ? 1 : 0.6} fontFamily="var(--font-mono)">
                  {s.name}
                </text>
              </g>
            );
          })}
          {/* 流动信号粒子（播放时） */}
          {playing &&
            [0, 0.33, 0.66].map((off, i) => {
              const prog = ((t.current / 2.4 + off) % 1) * (n - 1);
              const i0 = Math.min(n - 2, Math.floor(prog));
              const f = prog - i0;
              const a = pos(i0);
              const b = pos(i0 + 1);
              return <circle key={i} cx={a.x + (b.x - a.x) * f} cy={a.y + (b.y - a.y) * f} r="5" fill="var(--signal)" opacity="0.85" />;
            })}
          <text x="200" y="305" fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
            第 {stage + 1} 阶段：{cur.name}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setStage((s) => (s - 1 + n) % n)}>
            ← 上一阶段
          </Button>
          <Button className="flex-1" onClick={() => setPlaying((p) => !p)}>
            {playing ? "暂停演示" : "自动演示"}
          </Button>
          <Button variant="outline" onClick={() => setStage((s) => (s + 1) % n)}>
            下一阶段 →
          </Button>
        </div>
        <div className="rounded-md border bg-card px-4 py-3">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            阶段 {stage + 1}/{n} · {cur.name}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-card-foreground">{cur.desc}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="当前阶段" value={cur.name} tone="good" />
          <Readout label="演示状态" value={playing ? "播放中" : "手动单步"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
      </div>
    </>
  );
}
