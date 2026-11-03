import { useRef, useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";
import { Button } from "@/components/ui/button";

type P = { x: number; y: number; vx: number; vy: number; sugar: boolean };
const N = 70;

export function Osmosis() {
  const [inner, setInner] = useState(20);
  const [outer, setOuter] = useState(0);
  const [running, setRunning] = useState(false);
  const [h, setH] = useState(0);
  const [, force] = useState(0);
  const parts = useRef<P[]>(
    Array.from({ length: N }, (_, i) => ({
      x: 40 + Math.random() * 320,
      y: 200 + Math.random() * 90,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      sugar: i % 5 === 0,
    })),
  );

  const target = Math.max(-60, Math.min(110, (inner - outer) * 4));
  useFrame((dt) => {
    if (running) setH((v) => v + (target - v) * (1 - Math.exp(-0.6 * dt)));
    for (const p of parts.current) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 30 || p.x > 370) p.vx *= -1;
      if (p.y < 190 || p.y > 300) p.vy *= -1;
      p.x = Math.max(30, Math.min(370, p.x));
      p.y = Math.max(190, Math.min(300, p.y));
    }
    force((n) => n + 1);
  });

  const level = 190 - h;
  const flux = running ? Math.sign(target - h) * Math.min(1, Math.abs(target - h) / 20) : 0;

  return (
    <>
      <Stage caption="半透膜：水分子可通过，蔗糖分子不能通过">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* beaker */}
          <path d="M20 120 V305 Q20 312 28 312 H372 Q380 312 380 305 V120" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="2" />
          <rect x="22" y="180" width="356" height="130" fill="oklch(0.6 0.08 230 / ${0.15 + outer / 100})" />
          {/* funnel */}
          <path d="M140 250 L180 160 V40 H220 V160 L260 250 Z" fill="none" stroke="var(--membrane)" strokeOpacity="0.7" strokeWidth="1.5" />
          <clipPath id="funnel">
            <path d="M140 250 L180 160 V40 H220 V160 L260 250 Z" />
          </clipPath>
          <rect x="130" y={level} width="140" height={260 - level} clipPath="url(#funnel)" fill={`oklch(0.72 0.12 75 / ${0.2 + inner / 80})`} />
          <line x1="140" x2="260" y1="250" y2="250" stroke="var(--membrane)" strokeWidth="3" strokeDasharray="4 3" />
          <line x1="225" x2="250" y1={level} y2={level} stroke="var(--signal)" />
          <line x1="225" x2="250" y1="190" y2="190" stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeDasharray="2 2" />
          <text x="254" y={(level + 190) / 2 + 4} fontSize="11" fill="var(--signal)" fontFamily="var(--font-mono)">
            Δh {h.toFixed(0)}
          </text>
          {parts.current.map((p, i) =>
            p.sugar ? (
              <rect key={i} x={p.x - 2.5} y={p.y - 2.5} width="5" height="5" fill="var(--membrane)" opacity="0.6" />
            ) : (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill="oklch(0.75 0.1 220)" opacity="0.7" />
            ),
          )}
          {flux !== 0 &&
            [170, 200, 230].map((x, i) => (
              <path
                key={x}
                d={flux > 0 ? `M${x} 272 l0 -16 m-4 4 l4 -4 l4 4` : `M${x} 256 l0 16 m-4 -4 l4 4 l4 -4`}
                stroke="oklch(0.8 0.1 220)"
                strokeWidth="1.5"
                fill="none"
                opacity={Math.abs(flux) * (0.5 + 0.5 * Math.sin(performance.now() / 200 + i))}
              />
            ))}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="漏斗内蔗糖浓度" value={inner} unit="%" min={0} max={30} onChange={setInner} />
        <Control label="烧杯外溶液浓度" value={outer} unit="%" min={0} max={30} onChange={setOuter} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRunning((r) => !r)}>
            {running ? "暂停" : "开始实验"}
          </Button>
          <Button variant="outline" onClick={() => { setRunning(false); setH(0); }}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="浓度差" value={`${inner - outer}%`} />
          <Readout label="液面高度差" value={h.toFixed(1)} tone={Math.abs(h) > 2 ? "good" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {inner > outer ? "漏斗内浓度高，水分子净流入，液面上升。" : inner < outer ? "外界浓度高，水分子净流出，液面下降。" : "浓度相等，水分子进出平衡。"}
        </p>
      </div>
    </>
  );
}
