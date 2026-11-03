import { useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

const P = "oklch(0.62 0.14 260)"; // 父方来源（蓝紫）
const O = "oklch(0.7 0.13 25)"; // 母方来源（橙）

const STAGES = [
  { name: "间期", note: "染色质呈丝状；DNA 复制、蛋白质合成。染色体/DNA/单体：4·4·0 → 复制后 4·8·8。" },
  { name: "减Ⅰ前期", note: "同源染色体两两配对（联会）形成四分体，非姐妹染色单体间可发生交叉互换。" },
  { name: "减Ⅰ中期", note: "四分体排列在赤道板两侧，两组四分体的朝向彼此独立——自由组合的基础。" },
  { name: "减Ⅰ后期", note: "同源染色体分离移向两极，非同源染色体自由组合；染色体数目减半的关键。" },
  { name: "减Ⅱ", note: "次级细胞进行类似有丝分裂的分裂：着丝粒分裂，姐妹染色单体分开。" },
  { name: "配子", note: "形成四个配子（2·2·0）；交叉互换让配子基因型更加多样。" },
] as const;

type ChromId = "PA" | "MA" | "PB" | "MB"; // 1 号(长)父/母 + 2 号(短)父/母
type Pos = { x: number; y: number };
type Layout = Record<ChromId, Pos>;

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const mixP = (a: Pos, b: Pos, k: number): Pos => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

/** X 形染色体：两条姐妹染色单体在着丝粒相连，四段臂可独立配色（交叉互换片段换色） */
function XChrom(props: { x: number; y: number; h: number; w: number; sw: number; arms: [string, string, string, string]; flash?: boolean }) {
  const { x, y, h, w, sw, arms, flash } = props;
  const paths = [
    `M${x - w} ${y - h} L${x} ${y}`,
    `M${x} ${y} L${x + w} ${y + h}`,
    `M${x + w} ${y - h} L${x} ${y}`,
    `M${x} ${y} L${x - w} ${y + h}`,
  ];
  return (
    <g>
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={arms[i]} strokeWidth={sw} strokeLinecap="round" fill="none" opacity={flash && i === 3 ? 0.35 + 0.65 * Math.abs(Math.sin(performance.now() / 280 + i)) : 1} />
      ))}
      <circle cx={x} cy={y} r={sw * 0.55} fill="var(--stage-foreground)" opacity="0.85" />
    </g>
  );
}

/** 单条染色单体（棒状）；c2 存在时下半段拼色（重组单体） */
function Rod(props: { x: number; y: number; h: number; sw: number; c: string; c2?: string }) {
  const { x, y, h, sw, c, c2 } = props;
  return (
    <g>
      <line x1={x} y1={y - h} x2={x} y2={y + h} stroke={c} strokeWidth={sw} strokeLinecap="round" />
      {c2 && <line x1={x} y1={y} x2={x} y2={y + h} stroke={c2} strokeWidth={sw} strokeLinecap="round" />}
      <circle cx={x} cy={y - h * 0.45} r={sw * 0.5} fill="var(--stage-foreground)" opacity="0.85" />
    </g>
  );
}

export function Meiosis() {
  const [prog, setProg] = useState(0); // 0–6：整数位为阶段序号，小数位为阶段内进度
  const [playing, setPlaying] = useState(false);
  const [xover, setXover] = useState(true);
  const [time, setTime] = useState(0);
  // 自由组合的随机朝向：1 = 1/2 号父方同源染色体移向左极
  const [assort, setAssort] = useState<[1 | -1, 1 | -1]>(() => [
    (Math.random() < 0.5 ? 1 : -1) as 1 | -1,
    (Math.random() < 0.5 ? 1 : -1) as 1 | -1,
  ]);

  useFrame((dt) => setTime((v) => v + dt));
  useFrame((dt) => {
    setProg((v) => {
      const n = v + dt * 0.35;
      if (n >= 6) {
        setPlaying(false);
        return 6;
      }
      return n;
    });
  }, playing);

  const stage = Math.min(5, Math.floor(prog));
  const p = stage === 5 ? Math.min(1, prog - 5) : prog - stage;
  const st = STAGES[stage]!;
  const [aA, aB] = assort;

  // 阶段 0–3 的 X 染色体布局
  const LAYOUTS: Layout[] = [
    { PA: { x: 165, y: 122 }, MA: { x: 238, y: 138 }, PB: { x: 176, y: 206 }, MB: { x: 248, y: 196 } }, // 分散
    { PA: { x: 172, y: 110 }, MA: { x: 202, y: 110 }, PB: { x: 172, y: 208 }, MB: { x: 202, y: 208 } }, // 联会
    { PA: { x: aA === 1 ? 186 : 214, y: 105 }, MA: { x: aA === 1 ? 214 : 186, y: 105 }, PB: { x: aB === 1 ? 186 : 214, y: 215 }, MB: { x: aB === 1 ? 214 : 186, y: 215 } }, // 赤道板
    { PA: { x: aA === 1 ? 122 : 278, y: 105 }, MA: { x: aA === 1 ? 278 : 122, y: 105 }, PB: { x: aB === 1 ? 122 : 278, y: 215 }, MB: { x: aB === 1 ? 278 : 122, y: 215 } }, // 同源分离
  ];
  const cur: Layout = stage === 0 ? LAYOUTS[0]! : { PA: mixP(LAYOUTS[stage - 1]!.PA, LAYOUTS[stage]!.PA, ease(Math.min(1, p * 1.5))), MA: mixP(LAYOUTS[stage - 1]!.MA, LAYOUTS[stage]!.MA, ease(Math.min(1, p * 1.5))), PB: mixP(LAYOUTS[stage - 1]!.PB, LAYOUTS[stage]!.PB, ease(Math.min(1, p * 1.5))), MB: mixP(LAYOUTS[stage - 1]!.MB, LAYOUTS[stage]!.MB, ease(Math.min(1, p * 1.5))) };

  // 减Ⅱ两细胞内容物（每细胞 1 条 1 号 + 1 条 2 号）
  const cells = [
    { cx: 110, A: (aA === 1 ? "PA" : "MA") as ChromId, B: (aB === 1 ? "PB" : "MB") as ChromId },
    { cx: 290, A: (aA === 1 ? "MA" : "PA") as ChromId, B: (aB === 1 ? "MB" : "PB") as ChromId },
  ];

  // 四段臂颜色：交叉互换开启时，1 号染色体的 2 号单体（下臂）换为对方颜色
  const armsFor = (id: ChromId): [string, string, string, string] => {
    const base = id.startsWith("P") ? P : O;
    if (!xover || (id !== "PA" && id !== "MA")) return [base, base, base, base];
    return id === "PA" ? [P, P, P, O] : [O, O, O, P];
  };

  // 配子：上排来自两条染色单体中的 1 号，下排来自 2 号（2 号单体为重组产物）
  const alleleA = (side: 0 | 1, chrom: 1 | 2) => {
    const paternal = side === 0 ? aA === 1 : aA === -1;
    const base = paternal ? "A" : "a";
    return chrom === 2 && xover ? (base === "A" ? "a" : "A") : base;
  };
  const alleleB = (side: 0 | 1) => (side === 0 ? aB === 1 : aB === -1 ? true : false) ? "B" : "b";
  const gametes = [
    { cx: 105, cy: 85, side: 0 as const, chrom: 1 as const },
    { cx: 295, cy: 85, side: 1 as const, chrom: 1 as const },
    { cx: 105, cy: 235, side: 0 as const, chrom: 2 as const },
    { cx: 295, cy: 235, side: 1 as const, chrom: 2 as const },
  ];
  const gameteOf = (g: (typeof gametes)[number]) => {
    const label = `${alleleA(g.side, g.chrom)}${alleleB(g.side)}`;
    const recomb = xover && g.chrom === 2;
    return { ...g, label, recomb };
  };
  const gameteList = gametes.map(gameteOf);
  const gameteK = stage === 5 ? ease(Math.min(1, p * 1.4)) : 0;

  const splitK = stage >= 4 ? seg(p, 0.45, 0.95) : 0;
  const k4 = ease(Math.min(1, p * 2));
  const counts = [
    [4, 4, 0],
    [4, 8, 8],
    [4, 8, 8],
    [4, 8, 8],
    [2, 4, 4],
    [2, 2, 0],
  ][stage]!;

  return (
    <>
      <Stage caption={`2n = 4 · ${st.name} · 父方蓝紫 / 母方橙`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 细胞（一个 → 两个 → 四个） */}
          {(stage <= 3 || (stage === 4 && p < 0.35)) && (
            <ellipse cx="200" cy="160" rx="100" ry="108" fill="oklch(0.7 0.06 160 / 0.07)" stroke="var(--stage-foreground)" strokeOpacity={0.5 * (stage === 4 ? 1 - p / 0.35 : 1)} strokeWidth="1.5" />
          )}
          {(stage === 4 || (stage === 5 && p < 0.4)) && (
            <g opacity={stage === 5 ? 1 - p / 0.4 : 1}>
              {[110, 290].map((cx) => (
                <circle key={cx} cx={cx} cy="160" r="62" fill="oklch(0.7 0.06 160 / 0.07)" stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="1.5" />
              ))}
            </g>
          )}
          {stage === 5 && (
            <g opacity={Math.min(1, p / 0.3)}>
              {gameteList.map((g, i) => (
                <circle key={i} cx={g.cx} cy={g.cy} r="42" fill="oklch(0.7 0.06 160 / 0.07)" stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="1.5" />
              ))}
            </g>
          )}
          {/* 核膜（间期–前期渐隐） */}
          {stage <= 1 && <circle cx="200" cy="160" r="54" fill="none" stroke="var(--stage-foreground)" strokeOpacity={0.4 * (stage === 0 ? 1 : 1 - p)} strokeDasharray="4 3" />}
          {/* 纺锤丝（细虚线） */}
          {stage >= 2 && stage <= 3 && (
            <g stroke="var(--stage-foreground)" strokeOpacity="0.3" strokeWidth="0.8" strokeDasharray="3 3">
              {(["PA", "MA", "PB", "MB"] as ChromId[]).map((id) => {
                const q = LAYOUTS[stage]![id];
                return (
                  <g key={id}>
                    <line x1="100" y1="160" x2={q.x} y2={q.y} />
                    <line x1="300" y1="160" x2={q.x} y2={q.y} />
                  </g>
                );
              })}
            </g>
          )}
          {stage === 4 && (
            <g stroke="var(--stage-foreground)" strokeOpacity="0.3" strokeWidth="0.8" strokeDasharray="3 3">
              {[110, 290].map((cx) => (
                <g key={cx}>
                  <line x1={cx - 56} y1="160" x2={cx - 26} y2="132" />
                  <line x1={cx - 56} y1="160" x2={cx - 26} y2="188" />
                  <line x1={cx + 56} y1="160" x2={cx + 26} y2="132" />
                  <line x1={cx + 56} y1="160" x2={cx + 26} y2="188" />
                </g>
              ))}
            </g>
          )}
          {/* 赤道板 */}
          {stage === 2 && <line x1="200" y1="60" x2="200" y2="260" stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeDasharray="4 4" />}
          {stage === 4 && [110, 290].map((cx) => <line key={cx} x1={cx} y1="105" x2={cx} y2="215" stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeDasharray="4 4" />)}

          {/* 间期染色质丝 */}
          {stage === 0 && (
            <g opacity={1 - seg(p, 0.75, 1)} fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M147 122 q9 -11 18 0 t18 0" stroke={P} />
              <path d="M220 138 q9 -11 18 0 t18 0" stroke={O} />
              <path d="M158 206 q9 -11 18 0 t18 0" stroke={P} />
              <path d="M230 196 q9 -11 18 0 t18 0" stroke={O} />
            </g>
          )}
          {/* X 形染色体（阶段 0–3） */}
          {stage <= 3 &&
            (["PA", "MA", "PB", "MB"] as ChromId[]).map((id) => {
              const q = cur[id];
              const big = id.endsWith("A");
              return (
                <g key={id} opacity={stage === 0 ? seg(p, 0.75, 1) : 1}>
                  <XChrom x={q.x} y={q.y} h={big ? 27 : 18} w={big ? 8.5 : 6.5} sw={big ? 5.2 : 4.4} arms={armsFor(id)} flash={xover && stage === 1 && (id === "PA" || id === "MA")} />
                </g>
              );
            })}
          {/* 减Ⅱ：染色体先移入两细胞，着丝粒再分裂 */}
          {stage === 4 && (
            <g>
              <g opacity={1 - seg(p, 0.4, 0.6)}>
                {cells.map((cell) => (
                  <g key={`mv-${cell.cx}`}>
                    {([["A", 132], ["B", 188]] as const).map(([k, ty]) => {
                      const id = cell[k];
                      const pos = mixP(LAYOUTS[3]![id], { x: cell.cx, y: ty }, k4);
                      const big = k === "A";
                      return <XChrom key={k} x={pos.x} y={pos.y} h={big ? 26 : 17} w={big ? 8 : 6} sw={big ? 5 : 4.4} arms={armsFor(id)} />;
                    })}
                  </g>
                ))}
              </g>
              <g opacity={seg(p, 0.4, 0.6)}>
                {cells.map((cell) => (
                  <g key={`rod-${cell.cx}`}>
                    <Rod x={cell.cx - 12 - splitK * 22} y={132} h={26} sw={5} c={armsFor(cell.A)[0]} />
                    <Rod x={cell.cx + 12 + splitK * 22} y={132} h={26} sw={5} c={armsFor(cell.A)[0]} />
                    <Rod x={cell.cx - 12 - splitK * 22} y={188} h={17} sw={4.4} c={armsFor(cell.B)[0]} />
                    <Rod x={cell.cx + 12 + splitK * 22} y={188} h={17} sw={4.4} c={armsFor(cell.B)[0]} />
                  </g>
                ))}
              </g>
            </g>
          )}
          {/* 四个配子 */}
          {stage === 5 && (
            <g>
              {gameteList.map((g, i) => {
                const cellCx = g.cx < 200 ? 110 : 290;
                const fromY = g.cy < 160 ? 132 : 188;
                const x = cellCx + (g.cx - cellCx) * gameteK;
                const y = fromY + (g.cy - fromY) * gameteK;
                const longP = g.side === 0 ? aA === 1 : aA === -1; // 该细胞 1 号染色体是否父方
                const shortP = g.side === 0 ? aB === 1 : aB === -1;
                return (
                  <g key={`gam-${i}`} opacity={Math.min(1, p / 0.3)}>
                    <Rod x={x - 9} y={y} h={17} sw={4.6} c={longP ? P : O} {...(g.recomb ? { c2: longP ? O : P } : {})} />
                    <Rod x={x + 9} y={y} h={11} sw={4} c={shortP ? P : O} />
                  </g>
                );
              })}
              {gameteList.map((g, i) => (
                <text key={`lab-${i}`} x={g.cx} y={g.cy + 58} fontSize="12" textAnchor="middle" fill={g.recomb ? "var(--signal)" : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
                  {g.label}
                  {g.recomb ? " 重组" : ""}
                </text>
              ))}
            </g>
          )}
          {/* 交叉互换标记（减Ⅰ前期） */}
          {stage === 1 && xover && (
            <g opacity={0.55 + 0.45 * Math.sin(time * 6)}>
              <path d="M180 100 L194 122 M194 100 L180 122" stroke="var(--signal)" strokeWidth="1.4" fill="none" />
              <text x="212" y="114" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">
                交叉互换
              </text>
            </g>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setPlaying((v) => !v)}>
            {playing ? "暂停" : "自动推进"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPlaying(false);
              setProg(0);
              setAssort([(Math.random() < 0.5 ? 1 : -1) as 1 | -1, (Math.random() < 0.5 ? 1 : -1) as 1 | -1]);
            }}
          >
            重置 · 重掷组合
          </Button>
        </div>
        <Control label="阶段推进（拖动）" value={Math.min(5.99, prog)} min={0} max={5.99} step={0.01} onChange={(v) => { setPlaying(false); setProg(v); }} />
        <Segmented
          options={[
            { value: "on", label: "发生交叉互换" },
            { value: "off", label: "不发生" },
          ]}
          value={xover ? "on" : "off"}
          onChange={(v) => setXover(v === "on")}
        />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="染色体数 / 细胞" value={counts[0]} />
          <Readout label="DNA 数 / 细胞" value={counts[1]} />
          <Readout label="染色单体数 / 细胞" value={counts[2]} />
          <Readout label="重组配子" value={`${gameteList.filter((g) => g.recomb).length} / 4`} tone={xover ? "good" : undefined} />
        </div>
        <p className="min-h-12 text-sm leading-relaxed text-muted-foreground">
          {st.note}
          {stage === 3 && ` 本次 1 号父方移向${aA === 1 ? "左" : "右"}极、2 号父方移向${aB === 1 ? "左" : "右"}极（${aA === aB ? "同侧" : "分侧"}组合），重置可重掷自由组合方式。`}
          {stage === 5 && xover && " 交叉互换使 4 个配子基因型各不相同，亲组合:重组合 = 1:1。"}
        </p>
      </div>
    </>
  );
}
