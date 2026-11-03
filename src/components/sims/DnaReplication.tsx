import { useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

const HEAVY = "oklch(0.58 0.14 285)"; // 15N 母链：蓝紫
const LIGHT = "oklch(0.72 0.14 60)"; // 14N 新链：橙

// 各代分子构成：数字 = 该分子中母链(15N)条数
const GEN_MOLS: number[][] = [[2], [1, 1], [1, 1, 0, 0]];
// 离心带位置（y）：重带 / 中带 / 轻带
const BANDS: number[][] = [[262], [178], [178, 96]];

function layout(count: number) {
  if (count === 1) return [{ x: 14, y: 120, w: 326, h: 56 }];
  if (count === 2) return [{ x: 14, y: 130, w: 158, h: 56 }, { x: 186, y: 130, w: 158, h: 56 }];
  return [
    { x: 14, y: 66, w: 158, h: 56 }, { x: 186, y: 66, w: 158, h: 56 },
    { x: 14, y: 190, w: 158, h: 56 }, { x: 186, y: 190, w: 158, h: 56 },
  ];
}

/** 静止双链：两条链 + 氢键横档，颜色按母链数 */
function Duplex({ x, y, w, h, m }: { x: number; y: number; w: number; h: number; m: number }) {
  const yc = y + h / 2;
  const top = m >= 1 ? HEAVY : LIGHT;
  const bot = m === 2 ? HEAVY : LIGHT;
  return (
    <g>
      <line x1={x} x2={x + w} y1={yc - 7} y2={yc - 7} stroke={top} strokeWidth="4" strokeLinecap="round" />
      <line x1={x} x2={x + w} y1={yc + 7} y2={yc + 7} stroke={bot} strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: Math.floor(w / 14) }, (_, i) => (
        <line key={i} x1={x + 7 + i * 14} x2={x + 7 + i * 14} y1={yc - 5} y2={yc + 5} stroke="var(--stage-foreground)" strokeOpacity="0.3" />
      ))}
      <text x={x + w / 2} y={y + h + 10} fontSize="8" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
        {m === 2 ? "重 15N/15N" : m === 1 ? "杂合 15N/14N" : "轻 14N/14N"}
      </text>
    </g>
  );
}

export function DnaReplication() {
  const [gen, setGen] = useState(0);
  const [prog, setProg] = useState(0);
  const [rep, setRep] = useState(false);
  const [speed, setSpeed] = useState(1);
  useFrame((dt) => {
    if (!rep) return;
    setProg((p) => {
      const n = p + dt * 0.32 * speed;
      if (n >= 1) { setRep(false); setGen((g) => g + 1); return 0; }
      return n;
    });
  }, rep);

  const mols = GEN_MOLS[gen]!;
  const boxes = layout(mols.length);
  const nextBands = BANDS[Math.min(gen + 1, 2)]!;

  return (
    <>
      <Stage caption="Meselson-Stahl：蓝紫=15N 母链，橙=14N 新链">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {mols.map((m, i) => {
            const b = boxes[i]!;
            if (!rep) return <Duplex key={i} x={b.x} y={b.y} w={b.w} h={b.h} m={m} />;
            // 复制中：解旋酶推进，右侧保留、左侧打开并合成两条新链
            const yc = b.y + b.h / 2;
            const openX = b.x + 10 + prog * (b.w - 20);
            const tTop = m >= 1 ? HEAVY : LIGHT;
            const tBot = m === 2 ? HEAVY : LIGHT;
            return (
              <g key={i}>
                <line x1={openX} x2={b.x + b.w} y1={yc - 7} y2={yc - 7} stroke={tTop} strokeWidth="4" strokeLinecap="round" />
                <line x1={openX} x2={b.x + b.w} y1={yc + 7} y2={yc + 7} stroke={tBot} strokeWidth="4" strokeLinecap="round" />
                {Array.from({ length: Math.max(0, Math.floor((b.x + b.w - openX) / 12)) }, (_, k) => (
                  <line key={k} x1={openX + 6 + k * 12} x2={openX + 6 + k * 12} y1={yc - 5} y2={yc + 5} stroke="var(--stage-foreground)" strokeOpacity="0.3" />
                ))}
                <line x1={b.x} x2={openX} y1={yc - 20} y2={yc - 20} stroke={tTop} strokeWidth="3.5" strokeLinecap="round" />
                <line x1={b.x} x2={openX} y1={yc + 20} y2={yc + 20} stroke={tBot} strokeWidth="3.5" strokeLinecap="round" />
                <line x1={b.x} x2={openX} y1={yc - 9} y2={yc - 9} stroke={LIGHT} strokeWidth="3" strokeLinecap="round" />
                <line x1={b.x} x2={openX} y1={yc + 9} y2={yc + 9} stroke={LIGHT} strokeWidth="3" strokeLinecap="round" />
                {Array.from({ length: Math.max(0, Math.floor((openX - b.x) / 12)) }, (_, k) => (
                  <g key={k} stroke="var(--stage-foreground)" strokeOpacity="0.25">
                    <line x1={b.x + 6 + k * 12} x2={b.x + 6 + k * 12} y1={yc - 18} y2={yc - 11} />
                    <line x1={b.x + 6 + k * 12} x2={b.x + 6 + k * 12} y1={yc + 11} y2={yc + 18} />
                  </g>
                ))}
                <circle cx={openX} cy={yc} r="7" fill="var(--signal)" />
                {i === 0 && (
                  <text x={openX} y={yc - 14} fontSize="9" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">解旋酶</text>
                )}
              </g>
            );
          })}
          {/* 离心管 */}
          <rect x="352" y="30" width="36" height="266" rx="14" fill="oklch(0.7 0.06 240 / 0.12)" stroke="var(--stage-foreground)" strokeOpacity="0.4" />
          {BANDS[gen]!.map((by, i) => (
            <ellipse key={i} cx="370" cy={by} rx="13" ry="5" fill="var(--specimen)" opacity="0.85" />
          ))}
          {rep && nextBands.map((by, i) => (
            <ellipse key={`g${i}`} cx="370" cy={by} rx="13" ry="5" fill="var(--specimen)" opacity={prog * 0.85} />
          ))}
          <text x="346" y="98" fontSize="8" textAnchor="end" fill="var(--stage-foreground)" opacity="0.5" fontFamily="var(--font-mono)">轻</text>
          <text x="346" y="181" fontSize="8" textAnchor="end" fill="var(--stage-foreground)" opacity="0.5" fontFamily="var(--font-mono)">中</text>
          <text x="346" y="265" fontSize="8" textAnchor="end" fill="var(--stage-foreground)" opacity="0.5" fontFamily="var(--font-mono)">重</text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" disabled={gen >= 2 || rep} onClick={() => { setProg(0); setRep(true); }}>
            {gen >= 2 ? "已完成第 2 代" : rep ? "复制中…" : "开始复制（转入 14N）"}
          </Button>
          <Button variant="outline" onClick={() => { setRep(false); setGen(0); setProg(0); }}>重置</Button>
        </div>
        <Control label="复制速度" value={speed} unit="×" min={0.5} max={4} step={0.5} onChange={setSpeed} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="当前代数" value={gen === 0 ? "0（亲代）" : `第 ${gen} 代`} />
          <Readout label="DNA 总数" value={2 ** gen} />
          <Readout label="含母链 DNA" value={[1, 2, 2][gen]!} tone="good" />
          <Readout label="全新 DNA" value={[0, 0, 2][gen]!} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {rep
            ? "解旋酶打开氢键，以每条母链为模板合成互补新链（橙）——新链与母链即时配对，这正是半保留复制的动态过程。"
            : gen === 0
              ? "亲代 DNA 两条链均为 15N（蓝紫），离心只有一条重带。点击「开始复制」转入 14N 培养基观察子代。"
              : gen === 1
                ? "第 1 代全部为「一重一轻」的杂合 DNA，离心只有一条中带——若是全保留复制应出现重、轻两条带，据此排除；与半保留复制预期一致。"
                : "第 2 代中带:轻带 = 1:1，含母链的 DNA 恒为 2 条——与半保留复制预期完全吻合，Meselson-Stahl 由此证明 DNA 半保留复制。"}
        </p>
      </div>
    </>
  );
}
