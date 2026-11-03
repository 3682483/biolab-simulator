import { useRef, useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

const KJ = 30.5; // 每水解 1 mol ATP 释放的能量

// 正多边形顶点（腺嘌呤六元环 / 核糖五元环）
const poly = (cx: number, cy: number, r: number, n: number, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

// 两点之间的波浪线（高能磷酸键）
const wavy = (x1: number, y1: number, x2: number, y2: number, amp = 3, n = 6) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const off = i === 0 || i === n ? 0 : amp * (i % 2 === 0 ? -1 : 1);
    return `${(x1 + dx * t + nx * off).toFixed(1)},${(y1 + dy * t + ny * off).toFixed(1)}`;
  });
  return `M${pts.join(" L")}`;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

// 分子各部分位置
const AX = 150, AY = 110; // 腺嘌呤
const RX = 176, RY = 142; // 核糖
const P1: [number, number] = [205, 172]; // 磷酸基团 α
const P2: [number, number] = [237, 195]; // 磷酸基团 β
const P3: [number, number] = [269, 216]; // 磷酸基团 γ（可解离为 Pi）
const PI_FREE: [number, number] = [330, 262]; // 解离后 Pi 的位置
const BOND: [number, number] = [(P2[0] + P3[0]) / 2, (P2[1] + P3[1]) / 2];

export function AtpCycle() {
  const [pool, setPool] = useState({ atp: 5, adp: 2 });
  const [target, setTarget] = useState<0 | 1>(0); // 0 = ATP 完整，1 = ADP + Pi
  const [auto, setAuto] = useState(false);
  const [, force] = useState(0);

  const p = useRef(0); // 分离进度：0 = ATP，1 = ADP+Pi
  const busy = useRef(false);
  const hydro = useRef(0);
  const synth = useRef(0);
  const join = useRef(0); // 肽键形成动画
  const timer = useRef(1);
  const peptides = useRef<{ age: number }[]>([]);

  const doHydro = () => {
    if (busy.current || pool.atp === 0) return;
    busy.current = true;
    setTarget(1);
  };
  const doSynth = () => {
    if (busy.current || pool.adp === 0) return;
    busy.current = true;
    setTarget(0);
  };

  useFrame((dt) => {
    if (busy.current) {
      const before = p.current;
      p.current = target > before ? Math.min(target, before + dt * 0.8) : Math.max(target, before - dt * 0.8);
      if (p.current === before) {
        // 动画到位，提交库存变化
        busy.current = false;
        if (target === 1) {
          hydro.current += 1;
          setPool((s) => ({ atp: s.atp - 1, adp: s.adp + 1 }));
          join.current = 1;
          peptides.current.push({ age: 0 });
        } else {
          synth.current += 1;
          setPool((s) => ({ atp: s.atp + 1, adp: s.adp - 1 }));
        }
      }
    } else if (auto) {
      timer.current -= dt;
      if (timer.current <= 0) {
        timer.current = 0.9 + Math.random() * 0.6;
        // 动态平衡：优先水解供能，ATP 不足先合成
        if (pool.atp > 0) doHydro();
        else if (pool.adp > 0) doSynth();
      }
    }
    join.current = Math.max(0, join.current - dt * 0.7);
    for (const pep of peptides.current) pep.age += dt;
    if (peptides.current.length > 7) peptides.current.shift();
    force((n) => n + 1);
  });

  const reset = () => {
    setAuto(false);
    setTarget(0);
    setPool({ atp: 5, adp: 2 });
    p.current = 0;
    busy.current = false;
    hydro.current = 0;
    synth.current = 0;
    join.current = 0;
    peptides.current = [];
  };

  const e = ease(p.current);
  const px = lerp(P3[0], PI_FREE[0], e);
  const py = lerp(P3[1], PI_FREE[1], e);
  const breaking = busy.current && target === 1;
  const building = busy.current && target === 0;
  const now = performance.now();

  const note = breaking
    ? "末端高能磷酸键断裂，释放约 30.5 kJ/mol 能量，驱动右侧氨基酸脱水缩合——能量随水解放出，不可逆。"
    : building
      ? "细胞呼吸（线粒体）释放的能量把 ADP 与 Pi 重新连成 ATP：物质可以循环使用，能量必须持续输入。"
      : "ATP 与 ADP 的转化时刻不停、速度极快，而细胞内含量很少——靠动态平衡持续供能，故称细胞的“能量货币”。";

  return (
    <>
      <Stage caption="ATP ⇌ ADP + Pi · 物质可逆，能量不可逆">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 左：线粒体（细胞呼吸放能） */}
          <g>
            <ellipse cx="60" cy="235" rx="42" ry="26" fill="oklch(0.7 0.1 160 / 0.12)" stroke="var(--membrane)" />
            <path d="M42 228 q7 7 14 0 q7 -7 14 0" stroke="var(--membrane)" strokeOpacity="0.55" fill="none" />
            <path d="M50 244 q7 7 14 0 q7 -7 14 0" stroke="var(--membrane)" strokeOpacity="0.55" fill="none" />
            <text x="60" y="272" fontSize="8" fill="var(--membrane)" fontFamily="var(--font-mono)" textAnchor="middle">
              线粒体
            </text>
            <text x="60" y="283" fontSize="7" fill="var(--membrane)" opacity="0.7" fontFamily="var(--font-mono)" textAnchor="middle">
              细胞呼吸放能
            </text>
            {building &&
              [0, 1, 2].map((i) => {
                const ph = ((now / 500 + i / 3) % 1 + 1) % 1;
                return (
                  <circle key={i} cx="60" cy="235" r={12 + ph * 38} fill="none" stroke="var(--membrane)" strokeOpacity={(1 - ph) * 0.6} />
                );
              })}
            {building && (
              <path
                d="M104 218 Q140 190 168 162"
                stroke="var(--membrane)"
                strokeWidth="1.8"
                fill="none"
                strokeDasharray="6 5"
                strokeDashoffset={-now / 25}
              />
            )}
          </g>
          {/* 中：ATP / ADP 分子 */}
          <g>
            <line x1={AX} y1={AY} x2={RX} y2={RY} stroke="var(--stage-foreground)" strokeOpacity="0.5" />
            <line x1={RX} y1={RY} x2={P1[0]} y2={P1[1]} stroke="var(--stage-foreground)" strokeOpacity="0.5" />
            <path d={wavy(P1[0], P1[1], P2[0], P2[1], 2.6)} stroke="var(--signal)" strokeWidth="1.6" fill="none" strokeOpacity="0.85" />
            <path d={wavy(P2[0], P2[1], P3[0], P3[1], 3)} stroke="var(--signal)" strokeWidth="2.4" fill="none" strokeOpacity={1 - e} />
            <polygon points={poly(AX, AY, 13, 6, Math.PI / 6)} fill="var(--specimen)" fillOpacity="0.35" stroke="var(--specimen)" />
            <polygon points={poly(RX, RY, 10, 5)} fill="oklch(0.7 0.1 160 / 0.4)" stroke="var(--specimen)" />
            <text x={AX} y={AY + 3} fontSize="9" fill="var(--stage-foreground)" fontFamily="var(--font-mono)" textAnchor="middle">
              A
            </text>
            <text x={AX} y="88" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="middle">
              腺嘌呤
            </text>
            <text x={RX} y="164" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="middle">
              核糖
            </text>
            {[P1, P2].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="9" fill="var(--membrane)" fillOpacity="0.3" stroke="var(--stage-foreground)" strokeOpacity="0.6" />
                <text x={cx} y={cy + 3} fontSize="8" fill="var(--stage-foreground)" fontFamily="var(--font-mono)" textAnchor="middle">
                  P
                </text>
              </g>
            ))}
            <g>
              <circle cx={px} cy={py} r="9" fill="var(--membrane)" fillOpacity="0.3" stroke="var(--stage-foreground)" strokeOpacity="0.6" />
              <text x={px} y={py + 3} fontSize="8" fill="var(--stage-foreground)" fontFamily="var(--font-mono)" textAnchor="middle">
                P
              </text>
            </g>
            {e > 0.4 && (
              <text x={px + 14} y={py + 3} fontSize="8" fill="var(--signal)" fontFamily="var(--font-mono)">
                Pi
              </text>
            )}
            <text x={BOND[0] + 14} y={BOND[1] + 26} fontSize="7.5" fill="var(--signal)" opacity="0.85" fontFamily="var(--font-mono)">
              高能磷酸键
            </text>
            {/* 断键闪光 */}
            {breaking &&
              p.current > 0.02 &&
              p.current < 0.9 &&
              Array.from({ length: 6 }, (_, i) => {
                const a = (i * Math.PI) / 3 + 0.4;
                const l = 7 + 5 * Math.sin(Math.PI * p.current);
                return (
                  <line
                    key={`fl${i}`}
                    x1={BOND[0] + Math.cos(a) * 5}
                    y1={BOND[1] + Math.sin(a) * 5}
                    x2={BOND[0] + Math.cos(a) * l}
                    y2={BOND[1] + Math.sin(a) * l}
                    stroke="var(--signal)"
                    strokeOpacity={Math.sin(Math.PI * p.current) * 0.9}
                  />
                );
              })}
            <text x="205" y="266" fontSize="10" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)" textAnchor="middle">
              {e > 0.5 ? "ADP + Pi" : "A – P ~ P ~ P"}
            </text>
          </g>
          {/* 右：吸能反应（氨基酸合成肽键） */}
          <g>
            {breaking && p.current > 0.05 && p.current < 0.95 && (
              <>
                <path
                  d="M258 206 Q300 165 322 142"
                  stroke="var(--signal)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="7 5"
                  strokeDashoffset={-now / 22}
                />
                <polygon points="322,140 313,144 319,150" fill="var(--signal)" />
              </>
            )}
            {(() => {
              const gap = 7 + 19 * (1 - join.current);
              return (
                <>
                  <circle cx={335 - gap} cy="126" r="7" fill="oklch(0.72 0.13 200 / 0.5)" stroke="var(--specimen)" />
                  <circle cx={335 + gap} cy="126" r="7" fill="oklch(0.72 0.13 200 / 0.5)" stroke="var(--specimen)" />
                  {join.current > 0.05 && (
                    <line x1={335 - gap + 7} y1="126" x2={335 + gap - 7} y2="126" stroke="var(--signal)" strokeWidth="2" strokeOpacity={join.current} />
                  )}
                </>
              );
            })()}
            <text x="335" y="152" fontSize="7.5" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="middle">
              氨基酸 → 二肽（吸能）
            </text>
            {peptides.current.map((pep, i) => (
              <g key={`pep${i}`} opacity={Math.max(0.35, 1 - pep.age / 10)}>
                <circle cx={306 + i * 15} cy="296" r="3.5" fill="oklch(0.72 0.13 200 / 0.8)" />
                <circle cx={313 + i * 15} cy="296" r="3.5" fill="oklch(0.72 0.13 200 / 0.8)" />
                <line x1={309 + i * 15} y1="296" x2={310 + i * 15} y2="296" stroke="var(--signal)" strokeWidth="1.5" />
              </g>
            ))}
            <text x="306" y="286" fontSize="7" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              已合成二肽 × {peptides.current.length}
            </text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={[
            { value: "manual", label: "手动操作" },
            { value: "auto", label: "自动 · 动态平衡" },
          ]}
          value={auto ? "auto" : "manual"}
          onChange={(v) => setAuto(v === "auto")}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={doHydro} disabled={busy.current || pool.atp === 0}>
            供能 · 断键水解
          </Button>
          <Button className="flex-1" variant="outline" onClick={doSynth} disabled={busy.current || pool.adp === 0}>
            合成 · 呼吸供能
          </Button>
        </div>
        <Button variant="outline" className="w-full" onClick={reset}>
          重置
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="ATP 库存" value={pool.atp} tone="good" />
          <Readout label="ADP 库存" value={pool.adp} />
          <Readout label="累计能量流 kJ/mol" value={`${(hydro.current * KJ).toFixed(1)}`} />
          <Readout label="呼吸合成次数" value={synth.current} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </>
  );
}
