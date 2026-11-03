import { useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";

type Mode = "struct" | "num";
type StructKind = "del" | "dup" | "inv" | "trans";
type NumKind = "tri" | "mono" | "trip" | "hap";

// 各片段（基因区）颜色，易位后颜色跟随片段走
const SEG_COLOR: Record<string, string> = {
  A: "oklch(0.72 0.12 30)",
  B: "oklch(0.72 0.12 100)",
  C: "oklch(0.72 0.12 160)",
  D: "oklch(0.72 0.12 230)",
  E: "oklch(0.72 0.12 290)",
  F: "oklch(0.62 0.11 20)",
  G: "oklch(0.62 0.11 20 / 0.85)",
  H: "oklch(0.62 0.11 20 / 0.7)",
};
const structLabel: Record<StructKind, string> = { del: "缺失", dup: "重复", inv: "倒位", trans: "易位" };
const structDesc: Record<StructKind, string> = {
  del: "片段 B 丢失，该染色体上基因数目减少",
  dup: "片段 BC 重复一次，基因数目增多",
  inv: "片段 BCD 反向重接，基因顺序改变、数目不变",
  trans: "与非同源染色体交换片段，涉及两条染色体",
};
const numLabel: Record<NumKind, string> = { tri: "三体", mono: "单体", trip: "三倍体", hap: "单倍体" };
const numDesc: Record<NumKind, string> = {
  tri: "某对同源染色体多 1 条（2n+1=5），个别数目增减",
  mono: "某对同源染色体少 1 条（2n−1=3），个别数目增减",
  trip: "含 3 个染色体组（3n=6），染色体组成倍增加",
  hap: "含 1 个染色体组（n=2），染色体组成倍减少",
};

/** 画一条横条染色体：segs 为片段字母序列，hl 为需要高亮的片段序号 */
function Bar({ segs, x, y, pitch, h, hl }: { segs: string[]; x: number; y: number; pitch: number; h: number; hl?: number[] }) {
  return (
    <g>
      {segs.map((s, i) => (
        <g key={i}>
          <rect x={x + i * pitch} y={y} width={pitch - 3} height={h} rx={4}
            fill={SEG_COLOR[s] ?? "var(--stage-foreground)"} fillOpacity={hl?.includes(i) ? 0.85 : 0.45}
            stroke={hl?.includes(i) ? "var(--signal)" : "none"} strokeWidth={1.4} />
          <text x={x + i * pitch + (pitch - 3) / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="12" fontWeight={700}
            fill="var(--stage-foreground)" fontFamily="var(--font-mono)">{s}</text>
        </g>
      ))}
    </g>
  );
}

/** 画一条竖直染色体（数目变异用），color 按同源组着色 */
function Rod({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={15} height={58} rx={7} fill={color} fillOpacity={0.5} stroke={color} strokeWidth={1} />
      <circle cx={x + 7.5} cy={y + 29} r={2.6} fill="var(--stage-foreground)" />
    </g>
  );
}

const C1 = "oklch(0.7 0.12 230)";
const C2 = "oklch(0.7 0.12 130)";
const C3 = "oklch(0.7 0.12 20)";

export function ChromosomeVariation() {
  const [mode, setMode] = useState<Mode>("struct");
  const [sk, setSk] = useState<StructKind>("del");
  const [nk, setNk] = useState<NumKind>("tri");

  // 各数目变异的染色体序列（颜色代号 1/2/3 → 对应同源组）
  const numSets: Record<NumKind, { cols: string[]; label: string }> = {
    tri: { cols: [C1, C1, C1, C2, C2], label: "2n+1 = 5" },
    mono: { cols: [C1, C2, C2], label: "2n−1 = 3" },
    trip: { cols: [C1, C2, C3, C1, C2, C3], label: "3n = 6" },
    hap: { cols: [C1, C2], label: "n = 2" },
  };

  const arrow = "M200 118 v14 m-4 -5 l4 5 l4 -5";

  return (
    <>
      <Stage caption="上：正常染色体 · 下：变异后的染色体">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {mode === "struct" ? (
            <>
              <text x="200" y="30" textAnchor="middle" fontSize="11" fill="var(--stage-foreground)" opacity={0.7} fontFamily="var(--font-mono)">
                正常染色体（非同源 1 号）
              </text>
              <Bar segs={["A", "B", "C", "D", "E"]} x={95} y={42} pitch={42} h={26} />
              {sk === "trans" && (
                <>
                  <text x="200" y="92" textAnchor="middle" fontSize="10" fill="var(--stage-foreground)" opacity={0.6} fontFamily="var(--font-mono)">
                    非同源 2 号染色体
                  </text>
                  <Bar segs={["F", "G", "H"]} x={168} y={98} pitch={30} h={20} />
                </>
              )}
              <path d={arrow} stroke="var(--stage-foreground)" strokeOpacity={0.5} strokeWidth="1.2" fill="none" />
              <text x="216" y="128" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">{structLabel[sk]}</text>

              {sk === "del" && (
                <>
                  <Bar segs={["A", "C", "D", "E"]} x={95} y={150} pitch={42} h={26} />
                  <rect x={137} y={150} width={39} height={26} rx={4} fill="none" stroke="var(--signal)" strokeDasharray="3 3" />
                  <text x={156.5} y={167} textAnchor="middle" fontSize="12" fontWeight={700} fill="var(--signal)" fontFamily="var(--font-mono)" opacity={0.7}>B</text>
                  <path d="M160 186 l0 26 m-4 -6 l4 6 l4 -6" stroke="var(--signal)" strokeWidth="1.4" fill="none" />
                  <text x="172" y="218" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">片段 B 缺失</text>
                </>
              )}
              {sk === "dup" && (
                <>
                  <Bar segs={["A", "B", "C", "B", "C", "D", "E"]} x={68} y={150} pitch={38} h={26} hl={[1, 2, 3, 4]} />
                  <path d="M101 186 v20 h150 v-14 m-4 4 l4 -4 l4 4" stroke="var(--signal)" strokeWidth="1.2" fill="none" opacity={0.8} />
                  <text x="180" y="224" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">BC 重复</text>
                </>
              )}
              {sk === "inv" && (
                <>
                  <Bar segs={["A", "D", "C", "B", "E"]} x={95} y={150} pitch={42} h={26} hl={[1, 2, 3]} />
                  <path d="M132 186 v12 h132 v-12 m-4 4 l4 -4 l4 4" stroke="var(--signal)" strokeWidth="1.2" fill="none" opacity={0.8} />
                  <text x="196" y="216" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">B–C–D 倒位（顺序反转）</text>
                </>
              )}
              {sk === "trans" && (
                <>
                  <Bar segs={["A", "B", "C", "G", "H"]} x={52} y={150} pitch={38} h={24} hl={[3, 4]} />
                  <text x="160" y="166" fontSize="10" fill="var(--stage-foreground)" opacity={0.6} fontFamily="var(--font-mono)">1 号′</text>
                  <Bar segs={["F", "D", "E"]} x={250} y={150} pitch={38} h={24} hl={[1, 2]} />
                  <text x="368" y="166" fontSize="10" fill="var(--stage-foreground)" opacity={0.6} fontFamily="var(--font-mono)">2 号′</text>
                  <path d="M212 142 q30 -24 44 6" stroke="var(--signal)" strokeWidth="1.2" fill="none" strokeDasharray="3 2" markerEnd="url(#ah)" />
                  <path d="M288 184 q-30 24 -44 -6" stroke="var(--signal)" strokeWidth="1.2" fill="none" strokeDasharray="3 2" markerEnd="url(#ah)" />
                  <defs>
                    <marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M0 0 L6 3 L0 6 Z" fill="var(--signal)" />
                    </marker>
                  </defs>
                  <text x="200" y="230" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">D、E 与 G、H 互换</text>
                </>
              )}
              <text x="200" y="292" textAnchor="middle" fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">
                结构变异改变基因的数目或排列顺序
              </text>
            </>
          ) : (
            <>
              <text x="200" y="30" textAnchor="middle" fontSize="11" fill="var(--stage-foreground)" opacity={0.7} fontFamily="var(--font-mono)">
                正常体细胞 2n = 4（两对同源染色体）
              </text>
              {[C1, C1, C2, C2].map((c, i) => (
                <g key={i} transform={`translate(${148 + i * 28} 42) scale(0.72)`}>
                  <Rod x={0} y={0} color={c} />
                </g>
              ))}
              <path d={arrow} stroke="var(--stage-foreground)" strokeOpacity={0.5} strokeWidth="1.2" fill="none" />
              <text x="216" y="128" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">{numLabel[nk]}</text>
              {numSets[nk].cols.map((c, i) => (
                <Rod key={i} x={200 - (numSets[nk].cols.length * 26) / 2 + i * 26 + 5} y={152} color={c} />
              ))}
              <text x="200" y="240" textAnchor="middle" fontSize="12" fontWeight={700} fill="var(--signal)" fontFamily="var(--font-mono)">
                {numSets[nk].label}
              </text>
              <text x="200" y="266" textAnchor="middle" fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">
                {nk === "trip" || nk === "hap" ? "染色体组成倍增减（整倍体变异）" : "个别染色体增减（非整倍体变异）"}
              </text>
            </>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={[
            { value: "struct" as Mode, label: "结构变异" },
            { value: "num" as Mode, label: "数目变异" },
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === "struct" ? (
          <Segmented
            options={(Object.keys(structLabel) as StructKind[]).map((k) => ({ value: k, label: structLabel[k] }))}
            value={sk}
            onChange={setSk}
          />
        ) : (
          <Segmented
            options={(Object.keys(numLabel) as NumKind[]).map((k) => ({ value: k, label: numLabel[k] }))}
            value={nk}
            onChange={setNk}
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          <Readout label="变异类型" value={mode === "struct" ? `结构 · ${structLabel[sk]}` : `数目 · ${numLabel[nk]}`} />
          <Readout label="改变描述" value={<span className="text-sm leading-snug">{mode === "struct" ? structDesc[sk] : numDesc[nk]}</span>} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {mode === "struct"
            ? "染色体结构变异直接改变基因的数目或排列顺序；倒位虽不改变数目，但基因表达与减数分裂常受影响。可遗传变异的来源包括基因突变、基因重组和染色体变异，后者可用光学显微镜直接观察到。"
            : nk === "trip" || nk === "hap"
              ? "整倍体变异是染色体组成倍地增加或减少，如多倍体植株常由秋水仙素处理诱导，茎秆粗壮、器官大但结实率低。"
              : "非整倍体变异是个别染色体的增加或缺失，常由减数分裂时同源染色体不分离或丢失引起，如人类 21 三体综合征。自然选择、遗传漂变等在此基础上作用于可遗传变异。"}
        </p>
      </div>
    </>
  );
}
