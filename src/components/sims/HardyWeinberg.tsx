import { useRef, useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 遗传平衡 + 对 aa 不利的选择：q' = q(1 − s·q) / (1 − s·q²)
const N = 96;

const dotColor = (g: 0 | 1 | 2) =>
  g === 0 ? "oklch(0.62 0.14 260 / 0.85)" : g === 1 ? "oklch(0.65 0.13 310 / 0.8)" : "oklch(0.68 0.14 25 / 0.85)";

export function HardyWeinberg() {
  const [q0, setQ0] = useState(0.5);
  const [s, setS] = useState(0.2);
  const [running, setRunning] = useState(false);
  const [gens, setGens] = useState<{ p: number; q: number }[]>([{ p: 1 - q0, q: q0 }]);
  const [, force] = useState(0);
  const acc = useRef(0); // 演化计时累积
  const reset = () => setGens([{ p: 1 - q0, q: q0 }]);

  // 改参数时重置演化轨迹
  const lastParams = useRef(`${q0}|${s}`);
  if (lastParams.current !== `${q0}|${s}`) {
    lastParams.current = `${q0}|${s}`;
    setGens([{ p: 1 - q0, q: q0 }]);
  }

  useFrame((dt) => {
    if (!running) return;
    acc.current += dt;
    while (acc.current > 0.45) {
      acc.current -= 0.45;
      setGens((g) => {
        const q = g.at(-1)?.q ?? q0;
        if (s <= 0 || q <= 1e-4) return g;
        const nq = (q * (1 - s * q)) / (1 - s * q * q);
        return g.length >= 60 ? [...g.slice(1), { p: 1 - nq, q: nq }] : [...g, { p: 1 - nq, q: nq }];
      });
    }
    force((v) => v + 1);
  });

  const cur = gens.at(-1) ?? { p: 1 - q0, q: q0 };
  const p = cur.p;
  const q = cur.q;
  const genotypes = { AA: p * p, Aa: 2 * p * q, aa: q * q };
  const sum = genotypes.AA + genotypes.Aa + genotypes.aa;

  // 个体点阵：按当前基因型频率随机着色（固定 seed 画布不闪烁）
  const dots = useRef<(0 | 1 | 2)[]>(Array.from({ length: N }, () => Math.floor(Math.random() * 3) as 0 | 1 | 2));
  const dotAt = (i: number): 0 | 1 | 2 => {
    const r = dots.current[i] ?? 0.5;
    return r < genotypes.AA ? 0 : r < genotypes.AA + genotypes.Aa ? 1 : 2;
  };

  // 折线路径
  const path = (key: "p" | "q") => {
    const w = 150;
    const h = 96;
    return gens
      .map((g, i) => {
        const x = 236 + (i / Math.max(1, gens.length - 1)) * w;
        const y = 250 - g[key] * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <>
      <Stage caption="对 aa 个体不利的选择压力 → a 基因频率逐代下降">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 个体点阵 12×8 */}
          {Array.from({ length: N }, (_, i) => {
            const col = i % 12;
            const row = Math.floor(i / 12);
            return (
              <circle
                key={i}
                cx={26 + col * 13}
                cy={38 + row * 15}
                r="5"
                fill={dotAt(i) === 2 ? dotColor(2) : dotAt(i) === 1 ? dotColor(1) : dotColor(0)}
              />
            );
          })}
          <text x="26" y="24" fontSize="10" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            ●AA {(genotypes.AA * 100).toFixed(0)}% ●Aa {(genotypes.Aa * 100).toFixed(0)}% ●aa {(genotypes.aa * 100).toFixed(0)}%
          </text>
          {/* p/q 折线图 */}
          <g>
            <rect x="232" y="150" width="158" height="102" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
            <line x1="232" y1="250" x2="390" y2="250" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
            <path d={path("p")} stroke="oklch(0.62 0.14 260)" strokeWidth="2" fill="none" />
            <path d={path("q")} stroke="oklch(0.68 0.14 25)" strokeWidth="2" fill="none" />
            <text x="388" y="144" fontSize="10" textAnchor="end" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              p（蓝紫）/ q（橙）
            </text>
            <text x="236" y="264" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              0 → 第 {gens.length - 1} 代
            </text>
          </g>
          {/* 频率堆叠条 */}
          <g>
            <rect x="26" y="292" width={348 * genotypes.AA} height="10" fill="oklch(0.62 0.14 260 / 0.8)" />
            <rect x={26 + 348 * genotypes.AA} y="292" width={348 * genotypes.Aa} height="10" fill="oklch(0.65 0.13 310 / 0.75)" />
            <rect x={26 + 348 * (genotypes.AA + genotypes.Aa)} y="292" width={348 * genotypes.aa} height="10" fill="oklch(0.68 0.14 25 / 0.8)" />
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="初始 a 基因频率 q₀" value={Number(q0.toFixed(2))} min={0.02} max={0.98} step={0.02} onChange={setQ0} />
        <Control label="对 aa 的选择系数 s" value={s} min={0} max={0.5} step={0.05} onChange={setS} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRunning((r) => !r)}>
            {running ? "暂停演化" : "逐代演化"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="p（A 频率）" value={p.toFixed(3)} tone="good" />
          <Readout label="q（a 频率）" value={q.toFixed(3)} tone={q < 0.05 ? "good" : undefined} />
          <Readout label="p² + 2pq + q²" value={sum.toFixed(3)} />
          <Readout label="已演化代数" value={gens.length - 1} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {s === 0
            ? "选择系数为 0 时 p、q 保持不变——这就是遗传平衡定律（哈迪-温伯格定律）：理想种群中基因频率世代稳定。"
            : `选择压力下 q 每代按 q' = q(1 − s·q)/(1 − s·q²) 递减，但 a 可藏在杂合子 Aa 中“躲过”选择，所以下降越来越慢——隐性致病基因难以被自然选择完全清除。`}
        </p>
      </div>
    </>
  );
}
