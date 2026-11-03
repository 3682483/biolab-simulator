import { useRef, useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { useFrame, useSmoothed } from "@/hooks/use-sim";

export function rate(light: number, co2: number, temp: number) {
  const tf = Math.exp(-(((temp - 25) / 11) ** 2));
  const lf = light / (light + 25);
  const cf = co2 / (co2 + 0.04);
  return Math.max(0, 100 * tf * lf * cf * 1.4 - 6); // net rate (minus respiration)
}

type B = { x: number; y: number; r: number; v: number };

export function Photosynthesis() {
  const [light, setLight] = useState(40);
  const [co2, setCo2] = useState(0.06);
  const [temp, setTemp] = useState(25);
  const r = rate(light, co2, temp);
  const shown = useSmoothed(r, 4);
  const bubbles = useRef<B[]>([]);
  const acc = useRef(0);
  const [, tick] = useState(0);

  useFrame((dt) => {
    acc.current += (shown / 12) * dt;
    while (acc.current > 1) {
      acc.current -= 1;
      bubbles.current.push({ x: 180 + Math.random() * 40, y: 200, r: 2 + Math.random() * 2.5, v: 50 + Math.random() * 30 });
    }
    bubbles.current = bubbles.current.filter((b) => {
      b.y -= b.v * dt;
      b.x += Math.sin(b.y / 12) * 0.3;
      return b.y > 70;
    });
    tick((n) => n + 1);
  });

  const W = 260, H = 140;
  const pts = Array.from({ length: 41 }, (_, i) => {
    const L = i * 2.5;
    return [(L / 100) * W, H - (rate(L, co2, temp) / 90) * H];
  });
  const cur = [(light / 100) * W, H - (shown / 90) * H];

  return (
    <>
      <Stage caption="黑藻 · NaHCO₃ 溶液 · 单位时间气泡数表示净光合速率">
        <svg viewBox="0 0 400 300" className="aspect-[4/3] w-full">
          {/* lamp light */}
          <defs>
            <linearGradient id="beam" x1="0" x2="1">
              <stop offset="0" stopColor="oklch(0.95 0.12 95)" stopOpacity={light / 140} />
              <stop offset="1" stopColor="oklch(0.95 0.12 95)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="160" r="14" fill="oklch(0.95 0.12 95)" opacity={0.2 + light / 120} />
          <path d="M40 140 L160 90 V250 L40 180 Z" fill="url(#beam)" />
          {/* tube */}
          <rect x="160" y="60" width="80" height="210" rx="6" fill="oklch(0.6 0.08 210 / 0.15)" stroke="var(--stage-foreground)" strokeOpacity="0.4" />
          {/* elodea */}
          <g stroke="var(--specimen)" strokeWidth="2" fill="none" opacity={0.6 + r / 200}>
            <path d="M200 265 C195 240 205 220 200 195" />
            {[255, 240, 225, 210, 200].map((y, i) => (
              <g key={y}>
                <path d={`M200 ${y} q-12 -4 -16 -12`} />
                <path d={`M200 ${y - 4} q12 -4 16 -12`} opacity={0.8 - i * 0.05} />
              </g>
            ))}
          </g>
          {bubbles.current.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="none" stroke="oklch(0.9 0.04 210)" strokeWidth="1" />
          ))}
          <text x="250" y="80" fontSize="11" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            T = {temp}°C
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="光照强度" value={light} unit="klx" min={0} max={100} onChange={setLight} />
        <Control label="CO₂ 浓度" value={co2} unit="%" min={0.01} max={0.2} step={0.01} onChange={setCo2} />
        <Control label="温度" value={temp} unit="°C" min={0} max={50} onChange={setTemp} />
        <div className="rounded-md border bg-card p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">净光合速率 – 光照强度</div>
          <svg viewBox={`-6 -6 ${W + 12} ${H + 18}`} className="w-full">
            <line x1="0" y1={H} x2={W} y2={H} stroke="var(--border)" />
            <line x1="0" y1="0" x2="0" y2={H} stroke="var(--border)" />
            <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="1.6" />
            <line x1={cur[0]} x2={cur[0]} y1={cur[1]} y2={H} stroke="var(--primary)" strokeDasharray="2 2" opacity="0.5" />
            <circle cx={cur[0]} cy={cur[1]} r="4" fill="var(--signal)" />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="净速率" value={shown.toFixed(1)} tone="good" />
          <Readout label="限制因子" value={temp < 15 || temp > 35 ? "温度" : light < 40 ? "光照" : "CO₂"} />
        </div>
      </div>
    </>
  );
}
