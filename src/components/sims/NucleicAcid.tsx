import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Readout, Segmented, Stage } from "@/components/lab-ui";

type Mode = "dna" | "rna" | "compare";
type Challenge = { seq: string[]; open: boolean };

const PAIRS = 8;
/** DNA 上链序列(下链自动互补) */
const TOP_SEQ = ["A", "G", "C", "T", "A", "T", "G", "C"];
/** RNA 单链序列(含 U) */
const RNA_SEQ = ["A", "G", "C", "U", "A", "U", "G", "C"];

const complement = (b: string) => (b === "A" ? "T" : b === "T" ? "A" : b === "G" ? "C" : "G");
/** 正五边形(五碳糖)顶点 */
const pentagon = (cx: number, cy: number, r = 6.5) =>
  Array.from({ length: 5 }, (_, k) => {
    const a = ((-90 + k * 72) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

export function NucleicAcid() {
  const [mode, setMode] = useState<Mode>("dna");
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  /** hiSugar: 高亮五碳糖;hiT: 高亮 T/U 差异 */
  const dnaLadder = (lx: number, rx: number, y0: number, hiSugar: boolean, hiT: boolean): ReactNode => (
    <g>
      {/* 糖-磷酸骨架 */}
      <line x1={lx} y1={y0 - 8} x2={lx} y2={y0 + (PAIRS - 1) * 27 + 8} stroke="var(--membrane)" strokeWidth={4} strokeLinecap="round" />
      <line x1={rx} y1={y0 - 8} x2={rx} y2={y0 + (PAIRS - 1) * 27 + 8} stroke="var(--membrane)" strokeWidth={4} strokeLinecap="round" />
      {TOP_SEQ.map((b, i) => {
        const y = y0 + i * 27;
        const nb = b === "A" || b === "T" ? 2 : 3;
        const pair = complement(b);
        const markT = hiT && (b === "T" || pair === "T");
        return (
          <g key={i}>
            {/* 五碳糖 + 磷酸 */}
            <polygon points={pentagon(lx, y)} fill={hiSugar ? "var(--signal)" : "var(--specimen)"} />
            <polygon points={pentagon(rx, y)} fill={hiSugar ? "var(--signal)" : "var(--specimen)"} />
            {i < PAIRS - 1 && <circle cx={lx} cy={y + 13.5} r={3.2} fill="var(--stage-foreground)" fillOpacity={0.55} />}
            {i < PAIRS - 1 && <circle cx={rx} cy={y + 13.5} r={3.2} fill="var(--stage-foreground)" fillOpacity={0.55} />}
            {/* 碱基(T 差异高亮) */}
            <text x={lx + 14} y={y + 3.5} fontSize={10} fill={markT && b === "T" ? "var(--signal)" : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
              {b}
            </text>
            <text x={rx - 14} y={y + 3.5} fontSize={10} textAnchor="end" fill={markT && pair === "T" ? "var(--signal)" : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
              {pair}
            </text>
            {/* 氢键横档:A=T 两横,G≡C 三横 */}
            {Array.from({ length: nb }, (_, k) => (
              <line
                key={k}
                x1={lx + 23}
                x2={rx - 23}
                y1={y - 4 + k * (nb === 2 ? 8 : 4)}
                y2={y - 4 + k * (nb === 2 ? 8 : 4)}
                stroke="var(--stage-foreground)"
                strokeOpacity={0.5}
                strokeWidth={1.1}
              />
            ))}
          </g>
        );
      })}
    </g>
  );

  const rnaStrand = (cx0: number, y0: number, hiSugar: boolean, hiU: boolean): ReactNode => (
    <g>
      <polyline
        points={Array.from({ length: PAIRS }, (_, i) => `${(cx0 + 40 * Math.sin(i * 0.85 + 0.6)).toFixed(1)},${y0 + i * 27}`).join(" ")}
        stroke="var(--membrane)"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {RNA_SEQ.map((b, i) => {
        const x = cx0 + 40 * Math.sin(i * 0.85 + 0.6);
        const y = y0 + i * 27;
        return (
          <g key={i}>
            <polygon points={pentagon(x, y)} fill={hiSugar ? "var(--signal)" : "var(--specimen)"} />
            <text x={x + 12} y={y + 3.5} fontSize={10} fill={hiU && b === "U" ? "var(--signal)" : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
              {b}
            </text>
          </g>
        );
      })}
    </g>
  );

  const newChallenge = () => {
    const bases = ["A", "T", "G", "C"];
    setChallenge({ seq: Array.from({ length: 5 }, () => bases[Math.floor(Math.random() * 4)] ?? "A"), open: false });
  };
  const challengeBtn = () => {
    if (challenge === null || challenge.open) newChallenge();
    else setChallenge({ ...challenge, open: true });
  };

  const y0 = 92;
  return (
    <>
      <Stage caption={mode === "dna" ? `DNA 双链 · ${PAIRS} 对碱基 · A=T / G≡C` : mode === "rna" ? `RNA 单链 · ${PAIRS} 个核苷酸 · 含 U` : "DNA 与 RNA 结构对比"}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 配对挑战区 */}
          <text x="200" y="16" textAnchor="middle" fontSize="9.5" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            {challenge ? "配对挑战:写出互补链" : "配对挑战:点击下方按钮开始"}
          </text>
          {challenge && (
            <g fontFamily="var(--font-mono)">
              <text x="200" y="32" textAnchor="middle" fontSize="12" fill="var(--stage-foreground)">
                {`5'-${challenge.seq.join(" ")}-3'`}
              </text>
              <text
                x="200"
                y="47"
                textAnchor="middle"
                fontSize="12"
                fill={challenge.open ? "var(--signal)" : "var(--stage-foreground)"}
                opacity={challenge.open ? 1 : 0.45}
              >
                {challenge.open ? `3'-${challenge.seq.map(complement).join(" ")}-5'` : "3'-? ? ? ? ?-5'"}
              </text>
            </g>
          )}
          {mode !== "rna" && <text x={mode === "compare" ? 78 : 200} y={y0 - 24} textAnchor="middle" fontSize="9.5" fill="var(--stage-foreground)" fillOpacity="0.7" fontFamily="var(--font-mono)">DNA(双链 · 脱氧核糖{mode === "compare" ? " · 含 T" : ""})</text>}
          {mode !== "dna" && <text x={mode === "compare" ? 300 : 200} y={y0 - 24} textAnchor="middle" fontSize="9.5" fill="var(--stage-foreground)" fillOpacity="0.7" fontFamily="var(--font-mono)">RNA(单链 · 核糖 · 含 U)</text>}
          {mode !== "rna" && dnaLadder(mode === "compare" ? 44 : 142, mode === "compare" ? 112 : 258, y0, mode === "compare", true)}
          {mode !== "dna" && rnaStrand(mode === "compare" ? 300 : 200, y0, mode === "compare", true)}
          <text x="200" y="308" textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            {mode === "dna" ? "A=T 两个氢键 · G≡C 三个氢键" : mode === "rna" ? "磷酸二酯键连接核糖核苷酸" : "差异:脱氧核糖/核糖 · T/U · 双链/单链"}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">观察模式</div>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "dna", label: "DNA 模式" },
              { value: "rna", label: "RNA 模式" },
              { value: "compare", label: "对比模式" },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={challengeBtn}>
            {challenge === null ? "配对挑战" : challenge.open ? "再来一题" : "显示互补链"}
          </Button>
          <Button variant="outline" onClick={() => setChallenge(null)}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="磷酸二酯键数" value={mode === "rna" ? PAIRS - 1 : (PAIRS - 1) * 2} />
          <Readout label="碱基配对数" value={mode === "rna" ? 0 : PAIRS} tone={mode === "dna" ? "good" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {mode === "dna"
            ? "DNA 反向平行双链:A=T 两个氢键、G≡C 三个氢键,GC 对越多双链越稳定;基本骨架是糖-磷酸交替连接。"
            : mode === "rna"
              ? "RNA 通常为单链,碱基含 U 不含 T,五碳糖为核糖;主要由 DNA 转录而来,可形成局部双链。"
              : "统一性:两者都是磷酸-五碳糖-碱基组成的核苷酸链;差异性:脱氧核糖 vs 核糖、T vs U、双链 vs 单链。"}
        </p>
      </div>
    </>
  );
}
