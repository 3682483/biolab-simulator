import { useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

// 碱基互补配对与平台统一配色
const COMPLEMENT: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const BASE_COLOR: Record<string, string> = {
  A: "oklch(0.65 0.13 25)",
  T: "oklch(0.65 0.13 260)",
  G: "oklch(0.62 0.13 150)",
  C: "oklch(0.7 0.12 200)",
};

// 三组物种序列（一条链 5'→3'，长度一致便于换算）
const SPECIES = [
  { id: "human", label: "人", seq: "ATGCCGATATCGATCCATGGCTAAT" },
  { id: "ecoli", label: "大肠杆菌", seq: "GATCGCATCGTACCGTACGATCGA" },
  { id: "rand", label: "任意序列", seq: "TTAGGCATGCCATCGGATCCTAGA" },
] as const;

const N = 24; // 碱基对数
const CX = 200;
const R = 70; // 螺旋半径（半宽）

export function DnaStructure() {
  const [rot, setRot] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [turns, setTurns] = useState(3);
  const [spIdx, setSpIdx] = useState(0);
  useFrame((dt) => setRot((r) => (r + dt * speed * 1.2) % (Math.PI * 2)));

  const sp = SPECIES[spIdx]!;
  const bases = Array.from({ length: N }, (_, i) => sp.seq.charAt(i));
  const comp = bases.map((b) => COMPLEMENT[b]!);

  // 相位：i 从上到下，旋转角随时间推进；横档长度按 |sin| 压缩模拟 3D 旋转
  const angle = (i: number) => rot + (i / (N - 1)) * turns * Math.PI * 2;
  const rungs = bases.map((b, i) => {
    const s = Math.sin(angle(i));
    const c = Math.cos(angle(i));
    return { i, b, cb: comp[i]!, half: R * Math.abs(s), left: CX - R * s, right: CX + R * s, depth: (c + 1) / 2 };
  });
  const visible = rungs.filter((r) => r.half > 26).length;

  // 查加夫法则：A+G 与 T+C 必然相等
  const purine = bases.filter((b) => b === "A" || b === "G").length + comp.filter((b) => b === "A" || b === "G").length;
  const pyrimidine = 2 * N - purine;
  const gc = Math.round(((bases.filter((b) => b === "G" || b === "C").length) / N) * 100);

  // 骨架：连续采样的两条糖-磷酸正弦带
  const strand = (sign: number) =>
    Array.from({ length: 97 }, (_, k) => {
      const f = k / 96;
      return `${CX + sign * R * Math.sin(rot + f * turns * Math.PI * 2)},${40 + f * 240}`;
    }).join(" ");

  return (
    <>
      <Stage caption="DNA 双螺旋 · 反向平行 · 直径恒定 2 nm">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 直径标注 */}
          <line x1={CX - R} x2={CX + R} y1="18" y2="18" stroke="var(--stage-foreground)" strokeOpacity="0.45" />
          <line x1={CX - R} x2={CX - R} y1="13" y2="23" stroke="var(--stage-foreground)" strokeOpacity="0.45" />
          <line x1={CX + R} x2={CX + R} y1="13" y2="23" stroke="var(--stage-foreground)" strokeOpacity="0.45" />
          <text x={CX} y="12" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">2 nm</text>
          {/* 反向平行端部标记 */}
          <text x="14" y="44" fontSize="11" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">5'</text>
          <text x="14" y="288" fontSize="11" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">3'</text>
          <text x="378" y="44" fontSize="11" textAnchor="end" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">3'</text>
          <text x="378" y="288" fontSize="11" textAnchor="end" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">5'</text>
          {/* 碱基对横档：A=T 两线 / G≡C 三线，左右半段按碱基着色 */}
          {rungs.map(({ i, b, cb, half, left, right, depth }) => {
            if (half < 6) return null;
            const y = 40 + (i / (N - 1)) * 240;
            const o = 0.3 + 0.55 * depth;
            const ys = b === "A" || b === "T" ? [y - 1.8, y + 1.8] : [y - 3, y, y + 3];
            return (
              <g key={i} opacity={o}>
                {ys.map((yy, j) => (
                  <g key={j}>
                    <line x1={left} x2={CX} y1={yy} y2={yy} stroke={BASE_COLOR[b]} strokeWidth="2" strokeLinecap="round" />
                    <line x1={CX} x2={right} y1={yy} y2={yy} stroke={BASE_COLOR[cb]} strokeWidth="2" strokeLinecap="round" />
                  </g>
                ))}
                {half > 34 && (
                  <>
                    <text x={left - 7} y={y + 3} fontSize="8" textAnchor="end" fill={BASE_COLOR[b]} fontFamily="var(--font-mono)">{b}</text>
                    <text x={right + 7} y={y + 3} fontSize="8" fill={BASE_COLOR[cb]} fontFamily="var(--font-mono)">{cb}</text>
                  </>
                )}
              </g>
            );
          })}
          {/* 两条糖-磷酸骨架 */}
          <polyline points={strand(1)} fill="none" stroke="var(--specimen)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={strand(-1)} fill="none" stroke="var(--membrane)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="旋转速度" value={speed} unit="×" min={0.2} max={3} step={0.1} onChange={setSpeed} />
        <Control label="螺旋圈数" value={turns} unit="圈" min={2} max={4} onChange={setTurns} />
        <Segmented options={SPECIES.map((s, i) => ({ value: i, label: s.label }))} value={spIdx} onChange={setSpIdx} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="可见碱基对" value={visible} />
          <Readout label="(A+G)/(T+C)" value={(purine / pyrimidine).toFixed(2)} tone="good" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {sp.label}的 DNA 中 GC 占约 {gc}%：两条链反向平行，A 与 T 通过双键配对（双横线）、G 与 C 通过三键配对（三横线），因此嘌呤总数恒等于嘧啶总数，(A+G)/(T+C)＝{Math.round((purine / pyrimidine) * 100) / 100}；无论碱基序列如何，双螺旋直径恒为 2 nm，每圈约 10 个碱基对。
        </p>
      </div>
    </>
  );
}
