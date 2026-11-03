import { useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";

// 亲本组合 → 配子池 → 棋盘
const CROSSES = [
  { key: "Aa-Aa", label: "Aa × Aa", p1: ["A", "a"], p2: ["A", "a"], theory: "表型 3:1 · 基因型 1:2:1" },
  { key: "AA-aa", label: "AA × aa", p1: ["A", "A"], p2: ["a", "a"], theory: "F₁ 全显（Aa）" },
  { key: "Aa-AA", label: "Aa × AA", p1: ["A", "a"], p2: ["A", "A"], theory: "无隐性个体" },
  { key: "Aa-aa", label: "Aa × aa（测交）", p1: ["A", "a"], p2: ["a", "a"], theory: "表型 1:1 验证杂合" },
] as const;

type Cell = { geno: string; dom: boolean };

export function Segregation() {
  const [crossKey, setCrossKey] = useState<(typeof CROSSES)[number]["key"]>("Aa-Aa");
  const cross = CROSSES.find((c) => c.key === crossKey) ?? CROSSES[0];
  const [kids, setKids] = useState<Cell[]>([]); // 已生成的后代
  const [flash, setFlash] = useState<string | null>(null); // 动画：正在分离的等位基因

  const grid: (Cell | null)[][] = cross.p1.map((g1) =>
    cross.p2.map((g2) => {
      const pair = [g1, g2].sort().join("");
      return { geno: pair, dom: pair.includes("A") };
    }),
  );

  const breed = (n: number) => {
    const next: Cell[] = [];
    for (let i = 0; i < n; i++) {
      const g1 = cross.p1[Math.floor(Math.random() * cross.p1.length)] ?? "A";
      const g2 = cross.p2[Math.floor(Math.random() * cross.p2.length)] ?? "a";
      next.push({ geno: [g1, g2].sort().join(""), dom: g1 === "A" || g2 === "A" });
    }
    setFlash(`${next[0]?.geno ?? ""}`);
    setTimeout(() => setFlash(null), 500);
    setKids((prev) => [...prev, ...next]);
  };

  const dom = kids.filter((k) => k.dom).length;
  const rec = kids.length - dom;
  const genos = ["AA", "Aa", "aa"].map((g) => kids.filter((k) => k.geno === g).length);

  return (
    <>
      <Stage caption="等位基因随同源染色体分开而分离 → F₁ 产生两种配子">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 亲本 */}
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={i === 0 ? 24 : 96} y="24" width="64" height="34" rx="8" fill="oklch(0.7 0.06 160 / 0.12)" stroke="var(--stage-foreground)" strokeOpacity="0.4" />
              <text x={i === 0 ? 56 : 128} y="46" fontSize="14" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                {cross.key.split("-")[i === 0 ? 0 : 1]}
              </text>
            </g>
          ))}
          {/* 配子分离箭头 */}
          {[0, 1].map((i) =>
            [0, 1].map((j) => (
              <path
                key={`${i}${j}`}
                d={`M${56 + i * 72} 62 Q${110 + j * 60} 96 ${150 + j * 34} ${118 + (i === j ? 0 : 96)}`}
                stroke="var(--stage-foreground)"
                strokeOpacity="0.25"
                strokeWidth="1"
                fill="none"
                strokeDasharray="3 3"
              />
            )),
          )}
          {/* 棋盘 2×2 */}
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <g key={`${i}-${j}`}>
                <rect
                  x={136 + i * 68}
                  y={104 + j * 68}
                  width="64"
                  height="64"
                  rx="8"
                  fill={cell?.dom ? "oklch(0.7 0.06 160 / 0.18)" : "oklch(0.2 0.02 160 / 0.3)"}
                  stroke={flash === cell?.geno ? "var(--signal)" : "var(--stage-foreground)"}
                  strokeOpacity={flash === cell?.geno ? 1 : 0.4}
                  strokeWidth={flash === cell?.geno ? 2.4 : 1}
                />
                <text
                  x={168 + i * 68}
                  y={142 + j * 68}
                  fontSize="17"
                  textAnchor="middle"
                  fill="var(--stage-foreground)"
                  fontFamily="var(--font-mono)"
                  opacity={cell?.dom ? 1 : 0.75}
                >
                  {cell?.geno}
                </text>
              </g>
            )),
          )}
          {/* 后代群体（最近 60 个） */}
          <text x="296" y="92" fontSize="11" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            F₂ 群体（{kids.length}）
          </text>
          {kids.slice(-60).map((k, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            return (
              <circle
                key={`${kids.length - Math.min(60, kids.length) + i}`}
                cx={292 + col * 9}
                cy={104 + row * 14}
                r="4.4"
                fill={k.dom ? "oklch(0.72 0.12 130 / 0.85)" : "oklch(0.4 0.02 130 / 0.8)"}
                stroke={k.dom ? "var(--specimen)" : "var(--stage-foreground)"}
                strokeWidth="0.6"
              />
            );
          })}
          <text x="296" y="286" fontSize="10" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            ● 显性 {dom} ○ 隐性 {rec}
          </text>
          <text x="150" y="256" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            理论比：{cross.theory}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={CROSSES.map((c) => ({ value: c.key as string, label: c.label }))}
          value={crossKey as string}
          onChange={(v) => {
            setCrossKey(v as (typeof CROSSES)[number]["key"]);
            setKids([]);
          }}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => breed(1)}>
            杂交一次
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => breed(100)}>
            批量 ×100
          </Button>
          <Button variant="outline" onClick={() => setKids([])}>
            清空
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="样本数" value={kids.length} />
          <Readout label="显性 : 隐性" value={kids.length ? `${dom} : ${rec}` : "—"} tone={kids.length >= 100 ? "good" : undefined} />
          <Readout label="AA : Aa : aa" value={kids.length ? genos.join(" : ") : "—"} />
          <Readout
            label="表型比"
            value={kids.length ? `${(dom / Math.max(1, rec)).toFixed(2)} : 1` : "—"}
            tone={kids.length >= 200 && dom / Math.max(1, rec) > 2.7 && dom / Math.max(1, rec) < 3.3 ? "good" : undefined}
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {kids.length >= 100
            ? `样本量增大后，${cross.key === "Aa-Aa" ? "显隐比逐渐逼近 3:1" : cross.key === "Aa-aa" ? "显隐比逐渐逼近 1:1（测交验证亲本产生两种等比例配子）" : "比例稳定于理论值"}——这正是孟德尔分离定律的统计学基础。`
            : "在 F₁ 形成配子时，等位基因随同源染色体的分开而分离，独立地随配子遗传给后代。多杂交几次观察比例趋近。"}
        </p>
      </div>
    </>
  );
}
