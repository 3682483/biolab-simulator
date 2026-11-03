import { useRef, useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";

type Moth = { x: number; y: number; geno: "BB" | "Bb" | "bb" };
const DARK = "oklch(0.3 0.02 260 / 0.9)";
const LIGHT = "oklch(0.82 0.03 95 / 0.95)";
const N0 = 24;

const randG = (): Moth["geno"] => {
  const r = Math.random();
  return r < 0.25 ? "BB" : r < 0.75 ? "Bb" : "bb";
};
const isDark = (g: Moth["geno"]) => g !== "bb";

export function NaturalSelection() {
  const [pollution, setPollution] = useState(50);
  const [gen, setGen] = useState(0);
  const [history, setHistory] = useState<number[]>([]); // 每代 b 基因频率
  const [, force] = useState(0);
  const moths = useRef<Moth[]>(
    Array.from({ length: N0 }, () => ({ x: 30 + Math.random() * 320, y: 40 + Math.random() * 190, geno: randG() })),
  );

  // 树皮颜色：污染越重越深
  const barkL = 0.85 - (pollution / 100) * 0.55;
  const barkColor = `oklch(${barkL.toFixed(2)} 0.02 260 / 0.9)`;

  const bFreq = () => {
    const total = moths.current.length * 2;
    const b = moths.current.reduce((s, m) => s + (m.geno === "bb" ? 2 : m.geno === "Bb" ? 1 : 0), 0);
    return total ? b / total : 0;
  };
  const darkRatio = () => moths.current.filter((m) => isDark(m.geno)).length / Math.max(1, moths.current.length);

  const nextGen = () => {
    // 可见度 = 被鸟发现捕食概率：深色蛾可见度随污染升高
    const vis = (dark: boolean) => (dark ? pollution / 100 : 1 - pollution / 100);
    const survivors = moths.current.filter((m) => Math.random() > vis(isDark(m.geno)) * 0.85);
    if (survivors.length < 2) return; // 团灭保护
    // 存活者繁殖：从亲本配子库随机组合回补到 N0
    const gametes: ("B" | "b")[] = [];
    for (const s of survivors) {
      if (s.geno === "BB") gametes.push("B", "B");
      else if (s.geno === "Bb") gametes.push(Math.random() < 0.5 ? "B" : "b", Math.random() < 0.5 ? "B" : "b");
      else gametes.push("b", "b");
    }
    const kids: Moth[] = [];
    while (kids.length < N0 && gametes.length >= 2) {
      const i = Math.floor(Math.random() * gametes.length);
      const g1 = gametes.splice(i, 1)[0] ?? "B";
      const j = Math.floor(Math.random() * gametes.length);
      const g2 = gametes.splice(j, 1)[0] ?? "B";
      const sorted = [g1, g2].sort().join("") as Moth["geno"];
      kids.push({ x: 30 + Math.random() * 320, y: 40 + Math.random() * 190, geno: sorted });
    }
    moths.current = kids;
    setGen((g) => g + 1);
    setHistory((h) => [...h.slice(-39), bFreq()]);
    force((v) => v + 1);
  };

  const reset = () => {
    moths.current = Array.from({ length: N0 }, () => ({ x: 30 + Math.random() * 320, y: 40 + Math.random() * 190, geno: randG() }));
    setGen(0);
    setHistory([]);
  };

  const q = bFreq();
  const path = history
    .map((v, i) => `${i === 0 ? "M" : "L"}${276 + (i / Math.max(1, history.length - 1)) * 100} ${268 - v * 80}`)
    .join(" ");

  return (
    <>
      <Stage caption="桦尺蛾的工业黑化：鸟的捕食是选择动力，变异是不定向的">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 树皮背景 */}
          <rect x="16" y="20" width="244" height="230" rx="8" fill={barkColor} />
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M${30 + i * 48} 20 q6 60 -4 115 q8 60 -2 115`} stroke="var(--stage-foreground)" strokeOpacity="0.12" strokeWidth="2" fill="none" />
          ))}
          <text x="138" y="38" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
            树皮 · 污染 {pollution}%
          </text>
          {/* 蛾 */}
          {moths.current.map((m, i) => (
            <g key={i}>
              <ellipse cx={m.x} cy={m.y} rx="7" ry="4.5" fill={isDark(m.geno) ? DARK : LIGHT} opacity="0.95" />
              <line x1={m.x - 5} y1={m.y - 3} x2={m.x - 9} y2={m.y - 7} stroke={isDark(m.geno) ? DARK : LIGHT} strokeWidth="1.6" />
              <line x1={m.x + 5} y1={m.y - 3} x2={m.x + 9} y2={m.y - 7} stroke={isDark(m.geno) ? DARK : LIGHT} strokeWidth="1.6" />
            </g>
          ))}
          {/* b 频率折线 */}
          <rect x="272" y="182" width="114" height="90" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.35" />
          {history.length > 1 && <path d={path} stroke="oklch(0.68 0.14 25)" strokeWidth="2" fill="none" />}
          <text x="329" y="174" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            b 基因频率
          </text>
          <text x="276" y="288" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            深色 {Math.round(darkRatio() * 100)}% · q = {q.toFixed(2)}
          </text>
          <text x="200" y="290" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            第 {gen} 代 · 存活 {moths.current.length} 只
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="工业污染程度（树皮颜色）" value={pollution} unit="%" min={0} max={100} step={5} onChange={setPollution} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={nextGen}>
            繁殖一代
          </Button>
          <Button variant="outline" onClick={reset}>
            重置种群
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="深色表型占比" value={`${Math.round(darkRatio() * 100)}%`} tone={darkRatio() > 0.8 ? "good" : undefined} />
          <Readout label="b 基因频率" value={q.toFixed(3)} />
          <Readout label="已演化代数" value={gen} />
          <Readout label="选择方向" value={pollution > 50 ? "深色（工业化）" : pollution < 50 ? "浅色（清洁环境）" : "中性"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {gen === 0
            ? "英国的桦尺蛾有深浅两种体色（变异原本就存在、不定向）。鸟靠视觉捕食——哪种体色与环境反差大，哪种就被优先淘汰。"
            : pollution > 50
              ? "污染重的地区树皮黑化，浅色蛾显眼被鸟捕食，深色个体存活繁殖——b 基因频率逐代下降，这就是自然选择的定向作用。"
              : "清洁环境下树皮长满地衣呈浅色，深色蛾反而显眼——自然选择的方向随环境改变而逆转。"}
        </p>
      </div>
    </>
  );
}
