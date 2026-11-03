import { useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 四种色素：溶解度（Rf）越大扩散越快
const PIGMENTS = [
  { name: "胡萝卜素", color: "oklch(0.75 0.18 60)", tone: "橙黄", rf: 0.95 },
  { name: "叶黄素", color: "oklch(0.85 0.15 100)", tone: "黄色", rf: 0.74 },
  { name: "叶绿素a", color: "oklch(0.45 0.12 160)", tone: "蓝绿", rf: 0.55 },
  { name: "叶绿素b", color: "oklch(0.75 0.15 130)", tone: "黄绿", rf: 0.4 },
];

const ORIGIN_Y = 250; // 滤液细线（点样线）
const LIQUID_Y = 262; // 层析液液面
const FRONT_MAX = 212; // 溶剂前沿最大行程（px），对应约 10 cm
const CM = 10 / FRONT_MAX; // px → cm 换算

export function PigmentChromatography() {
  const [time, setTime] = useState(0);
  const [temp, setTemp] = useState(20);
  const [playing, setPlaying] = useState(false);

  useFrame((dt) => {
    if (!playing) return;
    // 温度越高分子运动越快，层析推进越迅速
    const n = time + dt * (1 + (temp - 20) * 0.03);
    if (n >= 12) {
      setTime(12);
      setPlaying(false);
    } else {
      setTime(n);
    }
  });

  const front = FRONT_MAX * (1 - Math.exp(-time / 4.2)); // 溶剂前沿离液面距离
  const bandDist = (rf: number) => Math.max(0, (front - 12) * rf); // 色素带离点样线距离
  const top = LIQUID_Y - front;

  const note =
    time < 0.3
      ? "层析液正沿滤纸毛细上升——注意滤液细线必须高于液面，否则色素溶入层析液。"
      : bandDist(0.95) < 26
        ? "色素带开始分离：溶解度最大的胡萝卜素走在最前面。"
        : time < 9
          ? "自上而下四条色素带依次是胡萝卜素、叶黄素、叶绿素a、叶绿素b——溶解度越大，随层析液扩散越快。"
          : "条带已充分分离，但随时间延长会逐渐加宽、边缘模糊；分离原理是色素在层析液中的溶解度差异。";

  return (
    <>
      <Stage caption="纸层析 · 滤液细线切勿没入层析液">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 烧杯 + 培养皿盖 */}
          <path d="M30 84 V302 Q30 310 38 310 H362 Q370 310 370 302 V84" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="2" />
          <line x1="26" y1="78" x2="374" y2="78" stroke="var(--stage-foreground)" strokeOpacity="0.4" />
          {/* 层析液 */}
          <rect x="32" y={LIQUID_Y} width="336" height="46" fill="oklch(0.6 0.08 230 / 0.16)" />
          <text x="42" y="286" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            层析液
          </text>
          {/* 滤纸条 */}
          <rect x="150" y="30" width="100" height="272" fill="oklch(0.88 0.02 90 / 0.08)" stroke="var(--stage-foreground)" strokeOpacity="0.5" />
          {/* 溶剂浸润区与前沿 */}
          <rect x="151" y={top} width="98" height={front} fill="oklch(0.72 0.06 220 / 0.08)" />
          <line x1="152" y1={top} x2="248" y2={top} stroke="var(--stage-foreground)" strokeOpacity="0.45" strokeDasharray="3 3" />
          {front > 14 && (
            <text x="256" y={top + 3} fontSize="7.5" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              溶剂前沿
            </text>
          )}
          {/* 滤液细线（点样线） */}
          <line x1="152" y1={ORIGIN_Y} x2="248" y2={ORIGIN_Y} stroke="var(--signal)" strokeOpacity="0.8" strokeDasharray="5 3" />
          <text x="256" y="253" fontSize="7.5" fill="var(--signal)" fontFamily="var(--font-mono)">
            滤液细线
          </text>
          {/* 四条色素带 */}
          {PIGMENTS.map((pg) => {
            const d = bandDist(pg.rf);
            const y = ORIGIN_Y - d;
            const h = 6 + Math.min(8, front * 0.03);
            return (
              <g key={pg.name}>
                <rect x="154" y={y - h / 2 - 2.5} width="92" height={h + 5} rx="3" fill={pg.color} opacity="0.2" />
                <rect x="154" y={y - h / 2} width="92" height={h} rx="2.5" fill={pg.color} opacity="0.85" />
                {d > 18 && (
                  <text x="256" y={y + 3} fontSize="7.5" fill={pg.color} fontFamily="var(--font-mono)">
                    {pg.name}（{pg.tone}）
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="层析时间" value={time} unit="分" min={0} max={12} step={0.1} onChange={(v) => { setPlaying(false); setTime(v); }} />
        <Control label="环境温度" value={temp} unit="°C" min={4} max={40} onChange={setTemp} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setPlaying((r) => !r)}>
            {playing ? "暂停" : "开始层析"}
          </Button>
          <Button variant="outline" onClick={() => { setPlaying(false); setTime(0); }}>
            重置
          </Button>
        </div>
        <div className="rounded-md border bg-card p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">自上而下四条色素带</div>
          <div className="space-y-1.5">
            {PIGMENTS.map((pg) => (
              <div key={pg.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: pg.color }} />
                <span className="text-foreground">{pg.name}</span>
                <span className="text-muted-foreground">
                  {pg.tone} · Rf ≈ {pg.rf.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="溶剂前沿" value={`${(front * CM).toFixed(1)} cm`} />
          <Readout label="胡萝卜素带距" value={`${(bandDist(0.95) * CM).toFixed(1)} cm`} tone="good" />
          <Readout label="叶绿素b带距" value={`${(bandDist(0.4) * CM).toFixed(1)} cm`} />
          <Readout label="最快:最慢" value={`1 : ${(0.4 / 0.95).toFixed(2)}`} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </>
  );
}
