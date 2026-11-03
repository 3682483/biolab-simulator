import { useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { cn } from "@/lib/utils";

// 能量金字塔：生产者固定 1000 kJ 起，逐级 ×效率
const LEVELS = [
  { label: "生产者", detail: "绿色植物固定太阳能" },
  { label: "初级消费者", detail: "植食性动物" },
  { label: "次级消费者", detail: "小型肉食动物" },
  { label: "三级消费者", detail: "大型肉食动物" },
];
// 各营养级能量去向比例（呼吸散失 / 流入下一级 / 流入分解者 / 未被利用）
const FATE = { resp: 0.42, next: 0.15, decom: 0.1, unused: 0.33 };

export function EnergyFlow() {
  const [eff, setEff] = useState(0.15);
  const [sel, setSel] = useState<number | null>(0);

  const energies = LEVELS.map((_, i) => 1000 * Math.pow(eff, i));
  const maxW = 316;

  return (
    <>
      <Stage caption="能量沿食物链单向流动、逐级递减——传递效率 10%–20%">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {LEVELS.map((lv, i) => {
            const w = maxW * Math.pow(eff, i);
            const x = 42 + (maxW - w) / 2;
            const y = 34 + i * 60;
            const on = sel === i;
            return (
              <g key={i} onClick={() => setSel(i)} className="cursor-pointer">
                <rect x={x} y={y} width={w} height="46" rx="6" fill={`oklch(${(0.62 + i * 0.05).toFixed(2)} ${0.12 + i * 0.01} ${150 - i * 40} / ${on ? 0.55 : 0.3})`} stroke={on ? "var(--signal)" : "var(--stage-foreground)"} strokeOpacity={on ? 1 : 0.4} strokeWidth={on ? 2 : 1} />
                <text x={x + w / 2} y={y + 22} fontSize="11.5" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {lv.label}
                </text>
                <text x={x + w / 2} y={y + 38} fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
                  {energies[i]!.toFixed(energies[i]! < 10 ? 1 : 0)} kJ
                </text>
                {i < 3 && (
                  <>
                    <path d={`M200 ${y + 46} v14`} stroke="var(--signal)" strokeWidth="1.6" markerEnd="url(#ef-arrow)" />
                    {/* 呼吸散失波浪 */}
                    <path d={`M${x + w - 30} ${y + 46} q6 -8 0 -16 q-6 -8 0 -14`} stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeWidth="1.2" fill="none" />
                  </>
                )}
              </g>
            );
          })}
          <defs>
            <marker id="ef-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="var(--signal)" />
            </marker>
          </defs>
          {/* 选中层明细 */}
          {sel !== null && (
            <g>
              <rect x="24" y="286" width="352" height="26" rx="6" fill="oklch(0.7 0.06 160 / 0.12)" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
              <text x="200" y="303" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.85" fontFamily="var(--font-mono)">
                {LEVELS[sel]!.label}（{LEVELS[sel]!.detail}）：呼吸散失 {(FATE.resp * 100).toFixed(0)}% · 流入下一级 {(FATE.next * 100).toFixed(0)}% · 分解者 {(FATE.decom * 100).toFixed(0)}% · 未利用 {(FATE.unused * 100).toFixed(0)}%
              </text>
            </g>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="营养级间传递效率" value={Number((eff * 100).toFixed(0))} unit="%" min={10} max={20} step={1} onChange={(v) => setEff(v / 100)} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="生产者固定能量" value="1000 kJ" />
          <Readout label="三级消费者获得" value={`${energies[3]!.toFixed(2)} kJ`} tone={eff >= 0.2 ? "good" : undefined} />
          <Readout label="总散失（呼吸热）" value={`${((1 - eff) * 100).toFixed(0)}% /级`} />
          <Readout label="能量流向" value="单向·不可循环" tone="warn" />
        </div>
        <div className="flex gap-1.5">
          {LEVELS.map((lv, i) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                sel === i ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {lv.label}
            </button>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {sel === 0
            ? "生产者（绿色植物）通过光合作用把太阳能固定为化学能，这是流入生态系统的总能量——一切消费者的能量都源于此。"
            : `每个营养级的能量只有 10%–20% 流入下一级，其余通过呼吸作用以热能散失、流入分解者或暂时未被利用。营养级越多能量损耗越大——“一山不容二虎”、食物链一般不超过 5 个营养级。`}
        </p>
      </div>
    </>
  );
}
