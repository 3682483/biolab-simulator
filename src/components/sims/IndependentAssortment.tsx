import { useState } from "react";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";

// YyRr × YyRr：非同源染色体上非等位基因自由组合
const GAMETES = ["YR", "Yr", "yR", "yr"] as const;
type Phenotype = "黄圆" | "黄皱" | "绿圆" | "绿皱";
const PHENO: Record<string, Phenotype> = {
  "Y_R_": "黄圆",
  "Y_rr": "黄皱",
  "yyR_": "绿圆",
  "yyrr": "绿皱",
};

const phenoOf = (g1: string, g2: string): Phenotype => {
  const y = [g1[0], g2[0]].join(""); // Y/y 位
  const r = [g1[1], g2[1]].join(""); // R/r 位
  return PHENO[`${y.includes("Y") ? "Y_" : "yy"}${r.includes("R") ? "R_" : "rr"}`] ?? "黄圆";
};

const COLOR: Record<Phenotype, string> = {
  黄圆: "oklch(0.8 0.14 95 / 0.9)",
  黄皱: "oklch(0.72 0.12 75 / 0.8)",
  绿圆: "oklch(0.62 0.12 145 / 0.85)",
  绿皱: "oklch(0.5 0.1 150 / 0.8)",
};

export function IndependentAssortment() {
  const [kids, setKids] = useState<{ g1: string; g2: string }[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);

  const breed = (n: number) => {
    const next = Array.from({ length: n }, () => ({
      g1: GAMETES[Math.floor(Math.random() * 4)] ?? "YR",
      g2: GAMETES[Math.floor(Math.random() * 4)] ?? "YR",
    }));
    setHighlight(next[0]?.g1 ?? null);
    setTimeout(() => setHighlight(null), 450);
    setKids((prev) => [...prev, ...next]);
  };

  const counts = (["黄圆", "黄皱", "绿圆", "绿皱"] as Phenotype[]).map(
    (p) => kids.filter((k) => phenoOf(k.g1, k.g2) === p).length,
  );
  const total = kids.length;
  const ratio = total ? counts.map((c) => (c / total) * 16).map((v) => v.toFixed(1)).join(" : ") : "—";

  // 4×4 棋盘
  const grid = GAMETES.map((g1) => GAMETES.map((g2) => ({ g1, g2, ph: phenoOf(g1, g2) })));

  return (
    <>
      <Stage caption="非同源染色体上的非等位基因自由组合 → 4 种等比例配子">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 配子发生：两对同源染色体分离 */
          [0, 1].map((pair) => {
            const cx = 52 + pair * 76;
            return (
              <g key={pair}>
                <text x={cx} y="26" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
                  {pair === 0 ? "1 号（Y/y）" : "2 号（R/r）"}
                </text>
                <line x1={cx} y1="36" x2={cx - 18} y2="66" stroke="oklch(0.62 0.14 260)" strokeWidth="3" strokeLinecap="round" />
                <line x1={cx} y1="36" x2={cx + 18} y2="66" stroke="oklch(0.7 0.13 25)" strokeWidth="3" strokeLinecap="round" />
                <text x={cx - 22} y="82" fontSize="11" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {pair === 0 ? "Y" : "R"}
                </text>
                <text x={cx + 22} y="82" fontSize="11" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {pair === 0 ? "y" : "r"}
                </text>
              </g>
            );
          })}
          <path d="M128 60 q46 24 92 0" stroke="var(--signal)" strokeWidth="1.4" fill="none" opacity="0.8" />
          <text x="174" y="52" fontSize="9.5" fill="var(--signal)" fontFamily="var(--font-mono)">
            组合随机
          </text>

          {/* 4×4 棋盘 */}
          {GAMETES.map((g, i) => (
            <text key={`c${i}`} x={196 + i * 46} y="106" fontSize="12" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
              {g}
            </text>
          ))}
          {GAMETES.map((g, i) => (
            <text key={`r${i}`} x="184" y={130 + i * 44} fontSize="12" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
              {g}
            </text>
          ))}
          {grid.map((row, i) =>
            row.map((cell, j) => {
              const on = highlight === cell.g1 || (kids.at(-1)?.g2 ?? "") === cell.g2;
              return (
                <rect
                  key={`${i}-${j}`}
                  x={200 + j * 46 - 19}
                  y={116 + i * 44}
                  width="38"
                  height="38"
                  rx="6"
                  fill={COLOR[cell.ph]}
                  opacity={0.28}
                  stroke={on ? "var(--signal)" : "var(--stage-foreground)"}
                  strokeOpacity={on ? 1 : 0.35}
                  strokeWidth={on ? 2 : 0.8}
                />
              );
            }),
          )}
          {/* 表型统计（最近 80 个后代圆点） */}
          <text x="296" y="66" fontSize="11" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            F₂ 群体（{total}）
          </text>
          {kids.slice(-80).map((k, i) => {
            const ph = phenoOf(k.g1, k.g2);
            const col = i % 16;
            const row = Math.floor(i / 16);
            return <circle key={`${total - Math.min(80, total) + i}`} cx={292 + col * 5.6} cy={76 + row * 13} r="4" fill={COLOR[ph]} />;
          })}
          <text x="228" y="300" fontSize="10" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            黄圆 {counts[0]} · 黄皱 {counts[1]} · 绿圆 {counts[2]} · 绿皱 {counts[3]}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => breed(1)}>
            杂交一次
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => breed(160)}>
            批量 ×160
          </Button>
          <Button variant="outline" onClick={() => setKids([])}>
            清空
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="样本数" value={total} />
          <Readout label="换算为 16 的比" value={ratio} />
          <Readout label="黄圆 : 黄皱 : 绿圆 : 绿皱" value={total ? counts.join(" : ") : "—"} />
          <Readout label="重组类型占比" value={total ? `${(((counts[1]! + counts[2]!) / total) * 100).toFixed(1)}%` : "—"} tone={total >= 160 ? "good" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {total >= 160
            ? "样本量足够大时，表型比趋近 9:3:3:1——其中黄皱、绿圆是亲本没有的重组类型，证明控制两对性状的基因独立分配。"
            : "YyRr 个体减数分裂时，1 号与 2 号非同源染色体的组合随机，产生 YR、Yr、yR、yr 四种等比例配子，雌雄配子 16 种组合。"}
        </p>
      </div>
    </>
  );
}
