import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, Stage } from "@/components/lab-ui";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";
import { cn } from "@/lib/utils";

const phases = [
  { name: "间期", end: 0.2, note: "DNA 复制，蛋白质合成，染色质呈丝状。" },
  { name: "前期", end: 0.4, note: "染色质螺旋化为染色体，核膜核仁消失，纺锤体形成。" },
  { name: "中期", end: 0.55, note: "着丝粒排列在赤道板上，染色体形态最清晰。" },
  { name: "后期", end: 0.75, note: "着丝粒分裂，姐妹染色单体分开移向两极，染色体数加倍。" },
  { name: "末期", end: 1, note: "核膜核仁重现，细胞板（植物）或缢裂（动物）形成两个子细胞。" },
];
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const colors = ["var(--signal)", "var(--specimen)", "var(--membrane)", "oklch(0.7 0.12 230)"];
const home = [[-30, -20], [25, -28], [-20, 25], [28, 18]];

export function Mitosis() {
  const [t, setT] = useState(0.1);
  const [play, setPlay] = useState(false);
  useFrame((dt) => setT((v) => (v + dt * 0.06) % 1), play);

  const pi = Math.max(0, phases.findIndex((p) => t <= p.end));
  const ph = phases[pi]!;
  const condense = seg(t, 0.2, 0.38);
  const align = seg(t, 0.4, 0.52);
  const split = seg(t, 0.56, 0.74);
  const cleave = seg(t, 0.78, 0.98);
  const nucleus = 1 - seg(t, 0.25, 0.38) + seg(t, 0.82, 0.95);
  const chromCount = t > 0.56 ? 8 : 4;

  return (
    <>
      <Stage caption={`${ph.name} · ${(t * 100).toFixed(0)}%`}>
        <svg viewBox="-200 -150 400 300" className="aspect-[4/3] w-full">
          {/* cell membrane, pinches during telophase */}
          <path
            d={`M-${110 + cleave * 40} 0 C-${110 + cleave * 40} -95 -40 -95 0 -${95 - cleave * 85} C40 -95 ${110 + cleave * 40} -95 ${110 + cleave * 40} 0 C${110 + cleave * 40} 95 40 95 0 ${95 - cleave * 85} C-40 95 -${110 + cleave * 40} 95 -${110 + cleave * 40} 0Z`}
            fill="oklch(0.7 0.06 160 / 0.08)"
            stroke="var(--stage-foreground)"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
          {/* spindle */}
          <g opacity={seg(t, 0.28, 0.4) * (1 - seg(t, 0.8, 0.9))} stroke="var(--stage-foreground)" strokeOpacity="0.25" strokeWidth="0.8">
            {[-60, -35, -12, 12, 35, 60].map((y) => (
              <path key={y} d={`M-${95 + cleave * 30} 0 Q0 ${y} ${95 + cleave * 30} 0`} fill="none" />
            ))}
          </g>
          {/* nuclei */}
          {nucleus > 0.01 && (t < 0.5 ? [0] : [-1, 1]).map((s) => (
            <circle key={s} cx={s * (90 + cleave * 10)} cy="0" r={t < 0.5 ? 60 : 45} fill="none" stroke="var(--stage-foreground)" strokeDasharray="3 3" strokeOpacity={0.4 * Math.min(1, nucleus)} />
          ))}
          {/* chromosomes */}
          {home.map(([hx = 0, hy = 0], i) => {
            const ax = 0, ay = -45 + i * 30;
            const x = hx + (ax - hx) * align;
            const y = hy + (ay - hy) * align;
            const len = 6 + condense * 10;
            const w = 1.2 + condense * 3.3;
            const sep = split * (95 + cleave * 25);
            return (
              <g key={i} stroke={colors[i]} strokeWidth={w} strokeLinecap="round" fill="none" opacity={0.5 + condense * 0.5}>
                {t < 0.2 ? (
                  <path d={`M${hx - 12} ${hy} q6 -10 12 0 t12 0`} strokeWidth="1.2" />
                ) : (
                  <>
                    <path d={`M${x - 3 - sep} ${y - len} L${x - 1 - sep} ${y} L${x - 3 - sep} ${y + len}`} transform={`rotate(${align * 90} ${x - sep} ${y})`} />
                    <path d={`M${x + 3 + sep} ${y - len} L${x + 1 + sep} ${y} L${x + 3 + sep} ${y + len}`} transform={`rotate(${align * 90} ${x + sep} ${y})`} />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" onClick={() => setPlay((p) => !p)} aria-label={play ? "暂停" : "播放"}>
            {play ? <Pause /> : <Play />}
          </Button>
          <Slider className="flex-1" value={[t]} min={0} max={0.999} step={0.001} onValueChange={(v) => { setPlay(false); setT(v[0] ?? 0); }} />
        </div>
        <div className="grid grid-cols-5 gap-1">
          {phases.map((p, i) => (
            <button
              key={p.name}
              onClick={() => { setPlay(false); setT((i ? phases[i - 1]!.end : 0) + 0.08); }}
              className={cn("rounded py-1.5 text-xs transition-colors", i === pi ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="min-h-12 text-sm leading-relaxed text-muted-foreground">{ph.note}</p>
        <div className="grid grid-cols-3 gap-2">
          <Readout label="染色体" value={chromCount} />
          <Readout label="单体" value={t > 0.2 && t <= 0.56 ? 8 : 0} />
          <Readout label="DNA" value={t < 0.15 ? 4 + Math.round((t / 0.15) * 4) : 8} />
        </div>
      </div>
    </>
  );
}
