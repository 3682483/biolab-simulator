import { useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

const steps = [
  { name: "变性", temp: 95 },
  { name: "退火", temp: 55 },
  { name: "延伸", temp: 72 },
];
/** Number of target-length (short) products after n cycles from one template. */
export const targetCopies = (n: number) => Math.max(0, 2 ** n - 2 * n);

export function PCR() {
  const [p, setP] = useState(0); // progress in cycles (float)
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [maxCycles, setMax] = useState(30);
  useFrame((dt) => setP((v) => {
    const n = v + dt * 0.35 * speed;
    if (n >= maxCycles) { setPlay(false); return maxCycles; }
    return n;
  }), play);

  const cycle = Math.floor(p);
  const f = p - cycle;
  const si = f < 0.33 ? 0 : f < 0.6 ? 1 : 2;
  const local = si === 0 ? f / 0.33 : si === 1 ? (f - 0.33) / 0.27 : (f - 0.6) / 0.4;
  const st = steps[si]!;
  const temp = st.temp;

  const open = si === 0 ? Math.min(1, local * 1.5) : 1;
  const primer = si === 1 ? Math.min(1, local * 1.4) : si === 2 ? 1 : 0;
  const ext = si === 2 ? local : 0;
  const gap = 18 + open * 34;

  const bars = Array.from({ length: maxCycles }, (_, i) => i + 1);
  const maxLog = Math.log2(targetCopies(maxCycles) + 1);

  return (
    <>
      <Stage caption={`第 ${Math.min(cycle + 1, maxCycles)} 轮 · ${st.name} · ${temp}°C`}>
        <svg viewBox="0 0 400 300" className="aspect-[4/3] w-full">
          <g transform="translate(60 110)">
            <line x1="0" x2="280" y1={-gap / 2} y2={-gap / 2} stroke="var(--specimen)" strokeWidth="4" strokeLinecap="round" />
            <line x1="0" x2="280" y1={gap / 2} y2={gap / 2} stroke="var(--membrane)" strokeWidth="4" strokeLinecap="round" />
            {open < 0.3 && Array.from({ length: 28 }, (_, i) => (
              <line key={i} x1={i * 10 + 5} x2={i * 10 + 5} y1={-gap / 2} y2={gap / 2} stroke="var(--stage-foreground)" strokeOpacity={0.3 * (1 - open / 0.3)} />
            ))}
            {/* primers bind at 3' ends, extension grows */}
            <g opacity={primer}>
              <line x1="240" x2={240 - ext * 240} y1={-gap / 2 + 9} y2={-gap / 2 + 9} stroke="var(--membrane)" strokeWidth="3" strokeOpacity="0.55" strokeLinecap="round" />
              <line x1="250" x2="280" y1={-gap / 2 + 9 - (1 - primer) * 20} y2={-gap / 2 + 9 - (1 - primer) * 20} stroke="var(--signal)" strokeWidth="4" strokeLinecap="round" />
              <line x1="40" x2={40 + ext * 240} y1={gap / 2 - 9} y2={gap / 2 - 9} stroke="var(--specimen)" strokeWidth="3" strokeOpacity="0.55" strokeLinecap="round" />
              <line x1="0" x2="30" y1={gap / 2 - 9 + (1 - primer) * 20} y2={gap / 2 - 9 + (1 - primer) * 20} stroke="var(--signal)" strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>
          {/* temp profile */}
          <g transform="translate(30 200)">
            {[0, 1, 2].map((i) => {
              const y = 70 - ((steps[i]!.temp - 40) / 60) * 70;
              return (
                <g key={i}>
                  <rect x={i * 115} y={y} width="110" height="2" fill={i === si ? "var(--signal)" : "var(--stage-line)"} />
                  <text x={i * 115} y={y - 6} fontSize="10" fontFamily="var(--font-mono)" fill="var(--stage-foreground)" opacity={i === si ? 1 : 0.5}>
                    {steps[i]!.name} {steps[i]!.temp}°C
                  </text>
                </g>
              );
            })}
            <rect x={f * 345} y="0" width="1.5" height="74" fill="var(--signal)" opacity="0.7" />
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => { if (p >= maxCycles) setP(0); setPlay((v) => !v); }}>
            {play ? <Pause /> : <Play />}
            {play ? "暂停" : "运行热循环"}
          </Button>
          <Button variant="outline" size="icon" aria-label="重置" onClick={() => { setPlay(false); setP(0); }}>
            <RotateCcw />
          </Button>
        </div>
        <Control label="循环次数" value={maxCycles} min={5} max={35} onChange={(v) => { setMax(v); setP((x) => Math.min(x, v)); }} />
        <Control label="播放速度" value={speed} unit="×" min={0.5} max={8} step={0.5} onChange={setSpeed} />
        <div className="rounded-md border bg-card p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">目标片段数（log₂）</div>
          <div className="flex h-20 items-end gap-px">
            {bars.map((n) => (
              <div
                key={n}
                className="flex-1 rounded-t-sm bg-primary transition-all duration-500 ease-smooth"
                style={{ height: `${n <= cycle ? (Math.log2(targetCopies(n) + 1) / maxLog) * 100 : 0}%`, opacity: n <= cycle ? 1 : 0.15 }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="已完成循环" value={cycle} />
          <Readout label="目标 DNA" value={targetCopies(cycle).toLocaleString()} tone="good" />
        </div>
      </div>
    </>
  );
}
