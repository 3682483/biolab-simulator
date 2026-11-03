import { useRef, useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 电泳：DNA 带负电，向正极（阳极）迁移；片段越小跑得越快
const MARKER = [10000, 5000, 3000, 2000, 1000, 500];
const SAMPLES: Record<string, number[]> = {
  A: [6000, 3000, 800],
  B: [9000, 1500, 500],
};
// 迁移距离模型：距离 ∝ 电压 × 时间 / log(大小)
const dist = (bp: number, kt: number) => Math.min(1, (kt * 2.2) / Math.log10(bp / 200)) * 116;

export function GelElectrophoresis() {
  const [voltage, setVoltage] = useState(100);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [, force] = useState(0);
  const kt = useRef(0); // 电压×时间累积

  useFrame((dt) => {
    if (!running) return;
    kt.current += dt * (voltage / 100);
    if (kt.current > 3.4) {
      setRunning(false);
      setDone(true);
    }
    force((v) => v + 1);
  });

  const lanes = [
    { label: "M", bands: MARKER },
    { label: "样品A", bands: SAMPLES["A"]! },
    { label: "样品B", bands: SAMPLES["B"]! },
  ];
  const k = kt.current;
  // 推算样品 A 条带大小（与最近 Marker 对齐）
  const readA = SAMPLES["A"]!.map((bp) => MARKER.reduce((best, m) => (Math.abs(m - bp) < Math.abs(best - bp) ? m : best), MARKER[0]!));

  const reset = () => {
    setRunning(false);
    setDone(false);
    kt.current = 0;
  };

  return (
    <>
      <Stage caption="琼脂糖凝胶电泳：DNA 带负电荷，从负极（阴极）跑向正极（阳极）">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 电极 */}
          <rect x="26" y="30" width="6" height="248" rx="3" fill="oklch(0.35 0.02 260 / 0.8)" />
          <rect x="368" y="30" width="6" height="248" rx="3" fill="oklch(0.6 0.16 25 / 0.85)" />
          <text x="29" y="22" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
            − 阴极
          </text>
          <text x="371" y="22" fontSize="9" textAnchor="middle" fill="oklch(0.65 0.16 25)" fontFamily="var(--font-mono)">
            + 阳极
          </text>
          {/* 凝胶 */}
          <rect x="38" y="30" width="324" height="248" rx="8" fill="oklch(0.7 0.08 220 / 0.08)" stroke="var(--membrane)" strokeOpacity="0.6" />
          {/* 三条泳道 */}
          {lanes.map((lane, li) => {
            const cx = 90 + li * 118;
            return (
              <g key={li}>
                <line x1={cx} y1="36" x2={cx} y2="272" stroke="var(--stage-foreground)" strokeOpacity="0.12" strokeDasharray="2 4" />
                {/* 加样孔 */}
                <rect x={cx - 14} y="36" width="28" height="8" rx="2" fill="oklch(0.3 0.02 260 / 0.6)" />
                {/* 条带 */}
                {lane.bands.map((bp, bi) => {
                  const d = dist(bp, k);
                  return (
                    <g key={bi}>
                      <rect
                        x={cx - 20}
                        y={44 + (1 - d / 116) * 200}
                        width="40"
                        height="6"
                        rx="3"
                        fill={li === 0 ? "oklch(0.7 0.03 260 / 0.5)" : li === 1 ? "oklch(0.62 0.14 260 / 0.75)" : "oklch(0.7 0.13 25 / 0.75)"}
                        opacity={k > 0.05 ? 1 : 0}
                      />
                      {li === 0 && k > 0.05 && (
                        <text x={cx + 24} y={50 + (1 - d / 116) * 200} fontSize="7.5" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
                          {bp >= 1000 ? `${bp / 1000}k` : bp}
                        </text>
                      )}
                    </g>
                  );
                })}
                <text x={cx} y="292" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
                  {lane.label}
                </text>
              </g>
            );
          })}
          {/* 电流粒子 */}
          {running &&
            Array.from({ length: 5 }, (_, i) => (
              <circle key={i} cx={40 + ((kt.current * 90 + i * 60) % 320)} cy={60 + i * 48} r="2.4" fill="oklch(0.65 0.1 220 / 0.8)" />
            ))}
          {done && (
            <text x="200" y="310" fontSize="10" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">
              电泳完成：A 样品 ≈ {readA.join(" / ")} bp
            </text>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="电压" value={voltage} unit="V" min={50} max={150} step={10} onChange={setVoltage} />
        <div className="flex gap-2">
          <Button className="flex-1" disabled={done} onClick={() => setRunning((r) => !r)}>
            {running ? "暂停电泳" : done ? "电泳完成" : "开始电泳"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重新加样
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="电泳进度" value={`${Math.min(100, Math.round((kt.current / 3.4) * 100))}%`} tone={done ? "good" : undefined} />
          <Readout label="迁移方向" value="负极 → 正极" />
          <Readout label="最快条带" value="最小的片段（500 bp）" tone="good" />
          <Readout label="样品 A 读数" value={done ? readA.join(" / ") + " bp" : "电泳中…"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          DNA 分子在 pH 8.0 的缓冲液中带负电荷，接通电源后向正极迁移。凝胶的分子筛效应使迁移速率与片段大小成反比——小片段跑在前（远处），大片段落后。与已知大小的 Marker（M 泳道）对照，即可估算样品片段的碱基对数。
        </p>
      </div>
    </>
  );
}
