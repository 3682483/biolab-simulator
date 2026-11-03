import { useEffect, useRef, useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

type Substance = "o2" | "glucose" | "k" | "pump";
type Mode = "simple" | "facilitated" | "active";
type Side = "out" | "in";
type Via = "lipid" | "carrier" | "pump";

interface SubstanceMeta {
  label: string;
  out: number; // 胞外浓度（示意）
  in: number; // 胞内浓度（示意）
  gradient: string;
  rates: Record<Mode, number>; // 三种方式的相对速率（0 = 不能进行）
  notes: Record<Mode, string>;
}

const SUBSTANCES: Record<Substance, SubstanceMeta> = {
  o2: {
    label: "O₂",
    out: 44,
    in: 10,
    gradient: "胞外 → 胞内（顺）",
    rates: { simple: 8, facilitated: 3, active: 1 },
    notes: {
      simple: "O₂ 是脂溶性小分子，顺浓度梯度自由穿过磷脂双分子层，不消耗能量。",
      facilitated: "O₂ 分子足够小，自由扩散已足够快，一般无需载体蛋白协助。",
      active: "O₂ 顺浓度梯度本可自由扩散，再动用 ATP 主动运输毫无必要。",
    },
  },
  glucose: {
    label: "葡萄糖",
    out: 30,
    in: 8,
    gradient: "胞外 → 胞内（顺）",
    rates: { simple: 0, facilitated: 8, active: 5 },
    notes: {
      simple: "葡萄糖亲水性强，无法直接穿过磷脂双分子层，自由扩散速率几乎为零。",
      facilitated: "葡萄糖与载体蛋白结合后顺浓度梯度高速进入红细胞（协助扩散），不耗能。",
      active: "小肠上皮细胞可逆浓度吸收葡萄糖——需要载体蛋白并消耗 ATP。",
    },
  },
  k: {
    label: "K⁺",
    out: 6,
    in: 120,
    gradient: "胞外 → 胞内（逆）",
    rates: { simple: 0, facilitated: 0, active: 7 },
    notes: {
      simple: "K⁺ 是带电离子，被磷脂双分子层的疏水核心阻挡，自由扩散速率为零。",
      facilitated: "通道蛋白只能顺浓度梯度运输离子；K⁺ 胞内浓度已远高于胞外，协助扩散无能为力。",
      active: "K⁺ 逆浓度进入细胞只能靠主动运输——泵蛋白消耗 ATP，切断能量立即停转。",
    },
  },
  pump: {
    label: "Na⁺/K⁺泵",
    out: 150,
    in: 150,
    gradient: "3Na⁺ 出 / 2K⁺ 入（逆）",
    rates: { simple: 0, facilitated: 0, active: 9 },
    notes: {
      simple: "Na⁺ 与 K⁺ 均为带电离子且都要逆浓度运输，磷脂双分子层对它们完全不透。",
      facilitated: "即使有通道，离子也只能顺浓度梯度流动——逆浓度任务协助扩散无法完成。",
      active: "每消耗 1 个 ATP，泵出 3 个 Na⁺、泵入 2 个 K⁺，维持细胞内高 K⁺ 低 Na⁺ 的离子梯度。",
    },
  },
};

const SUB_OPTIONS: { value: Substance; label: string }[] = [
  { value: "o2", label: "O₂" },
  { value: "glucose", label: "葡萄糖" },
  { value: "k", label: "K⁺" },
  { value: "pump", label: "Na⁺/K⁺泵" },
];
const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "simple", label: "自由扩散" },
  { value: "facilitated", label: "协助扩散" },
  { value: "active", label: "主动运输" },
];

const MEM = 200; // 双分子层所在竖直线
const CARRIER_Y = 104; // 载体蛋白中心
const PUMP_Y = 216; // 泵蛋白中心

type Drift = { x: number; y: number; vx: number; vy: number; side: Side };
type Cross = { p: number; y: number; dir: 1 | -1; ion: Side; via: Via };
type AtpBall = { p: number };

const buildDrift = (sub: Substance): Drift[] => {
  const meta = SUBSTANCES[sub];
  const n = (c: number) => Math.max(2, Math.min(24, Math.round(c / 6)));
  const mk = (side: Side, count: number): Drift[] =>
    Array.from({ length: count }, () => ({
      x: side === "out" ? 28 + Math.random() * 150 : 222 + Math.random() * 150,
      y: 40 + Math.random() * 258,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      side,
    }));
  return [...mk("out", n(meta.out)), ...mk("in", n(meta.in))];
};

export function MembraneTransport() {
  const [substance, setSubstance] = useState<Substance>("o2");
  const [mode, setMode] = useState<Mode>("simple");
  const [running, setRunning] = useState(false);
  const [energy, setEnergy] = useState(true);
  const [, force] = useState(0);

  const drift = useRef<Drift[]>(buildDrift("o2"));
  const crosses = useRef<Cross[]>([]);
  const atps = useRef<AtpBall[]>([]);
  const acc = useRef(0);
  const atpAcc = useRef(0);
  const flash = useRef(0);
  const carried = useRef(0);
  const atpUsed = useRef(0);

  const meta = SUBSTANCES[substance];
  const rate = mode === "active" && !energy ? 0 : meta.rates[mode];

  const clearMotion = () => {
    crosses.current = [];
    atps.current = [];
    acc.current = 0;
    atpAcc.current = 0;
    flash.current = 0;
    carried.current = 0;
    atpUsed.current = 0;
  };

  useEffect(() => {
    drift.current = buildDrift(substance);
    clearMotion();
  }, [substance]);

  useFrame((dt) => {
    for (const p of drift.current) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const lo = p.side === "out" ? 26 : 222;
      const hi = p.side === "out" ? 180 : 372;
      if (p.x < lo || p.x > hi) p.vx *= -1;
      if (p.y < 38 || p.y > 302) p.vy *= -1;
      p.x = Math.max(lo, Math.min(hi, p.x));
      p.y = Math.max(38, Math.min(302, p.y));
    }
    if (running && rate > 0) {
      acc.current += rate * 0.5 * dt;
      while (acc.current >= 1) {
        acc.current -= 1;
        // 钠钾泵双向泵运；自由扩散双向但净通量顺梯度；其余单向
        const dir: 1 | -1 =
          substance === "pump"
            ? Math.random() < 0.5
              ? 1
              : -1
            : mode === "simple" && Math.random() < 0.2
              ? -1
              : 1;
        const y =
          mode === "simple"
            ? 52 + Math.random() * 248
            : (mode === "facilitated" ? CARRIER_Y : PUMP_Y) + (Math.random() - 0.5) * 14;
        crosses.current.push({
          p: 0,
          y,
          dir,
          ion: substance === "pump" ? (dir === 1 ? "in" : "out") : "in",
          via: mode === "simple" ? "lipid" : mode === "facilitated" ? "carrier" : "pump",
        });
      }
    }
    crosses.current = crosses.current.filter((c) => {
      c.p += dt * (c.via === "lipid" ? 0.55 : 0.9);
      if (c.p >= 1) {
        carried.current += 1;
        return false;
      }
      return true;
    });
    if (running && mode === "active" && energy && rate > 0) {
      atpAcc.current += rate * 0.3 * dt;
      while (atpAcc.current >= 1) {
        atpAcc.current -= 1;
        atps.current.push({ p: 0 });
      }
    }
    atps.current = atps.current.filter((a) => {
      a.p += dt * 1.1;
      if (a.p >= 1) {
        atpUsed.current += 1;
        flash.current = 1;
        return false;
      }
      return true;
    });
    flash.current = Math.max(0, flash.current - dt * 2.5);
    force((n) => n + 1);
  });

  const reset = () => {
    setRunning(false);
    setEnergy(true);
    drift.current = buildDrift(substance);
    clearMotion();
  };

  // 粒子外观：泵场景左 Na⁺（暖）/右 K⁺（冷），其余物质单色
  const dot = (x: number, y: number, ion: Side) => {
    if (substance === "o2") return <circle cx={x} cy={y} r="2.4" fill="oklch(0.78 0.09 220 / 0.85)" />;
    if (substance === "glucose")
      return (
        <polygon
          points={`${x - 4.5},${y - 3} ${x + 4.5},${y - 3} ${x + 5.5},${y + 2} ${x},${y + 6} ${x - 5.5},${y + 2}`}
          fill="var(--membrane)"
          opacity="0.7"
        />
      );
    const fill =
      substance === "k" ? "oklch(0.68 0.12 230 / 0.9)" : ion === "out" ? "oklch(0.75 0.13 60 / 0.9)" : "oklch(0.68 0.12 230 / 0.9)";
    return <circle cx={x} cy={y} r="3.3" fill={fill} />;
  };

  const crossX = (c: Cross) => {
    if (c.via === "lipid") return c.dir === 1 ? 166 + 68 * c.p : 234 - 68 * c.p;
    if (c.via === "carrier") return c.dir === 1 ? 148 + 104 * c.p : 252 - 104 * c.p;
    return c.dir === 1 ? 208 + 44 * c.p : 192 - 44 * c.p;
  };

  const modeLabel = MODE_OPTIONS.find((o) => o.value === mode)?.label ?? "";

  return (
    <>
      <Stage caption={`磷脂双分子层 · ${meta.label} · ${modeLabel}${mode === "active" ? (energy ? "（耗 ATP）" : "（能量已切断）") : ""}`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <text x="26" y="22" fontSize="11" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            胞外
          </text>
          <text x="374" y="22" fontSize="11" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="end">
            胞内
          </text>
          {/* 磷脂双分子层：两列头部 + 疏水尾巴 */}
          {Array.from({ length: 15 }, (_, i) => {
            const y = 34 + i * 19;
            return (
              <g key={i}>
                <circle cx="189" cy={y} r="4.5" fill="var(--membrane)" opacity="0.75" />
                <circle cx="211" cy={y} r="4.5" fill="var(--membrane)" opacity="0.75" />
                <path d={`M193.5 ${y - 2} Q199 ${y + 3} 203 ${y - 1}`} stroke="var(--stage-foreground)" strokeOpacity="0.3" strokeWidth="1" fill="none" />
                <path d={`M206.5 ${y - 2} Q201 ${y + 3} 197 ${y - 1}`} stroke="var(--stage-foreground)" strokeOpacity="0.3" strokeWidth="1" fill="none" />
              </g>
            );
          })}
          {/* 协助扩散：载体蛋白通道 */}
          <g opacity={mode === "facilitated" ? 1 : 0.15}>
            <rect
              x={MEM - 11}
              y={CARRIER_Y - 22}
              width="22"
              height="44"
              rx="10"
              fill="var(--specimen)"
              fillOpacity="0.25"
              stroke="var(--specimen)"
            />
            <text x={MEM + 16} y={CARRIER_Y - 26} fontSize="9" fill="var(--specimen)" fontFamily="var(--font-mono)">
              载体蛋白
            </text>
          </g>
          {/* 主动运输：泵蛋白 + ATP 供能闪光 */}
          <g opacity={mode === "active" ? 1 : 0.15}>
            <rect x={MEM - 11} y={PUMP_Y - 22} width="22" height="44" rx="10" fill="var(--signal)" fillOpacity="0.22" stroke="var(--signal)" />
            <text x={MEM + 16} y={PUMP_Y - 26} fontSize="9" fill="var(--signal)" fontFamily="var(--font-mono)">
              泵蛋白
            </text>
            {flash.current > 0 && (
              <>
                <circle cx={MEM} cy={PUMP_Y} r={8 + (1 - flash.current) * 14} fill="none" stroke="var(--signal)" strokeOpacity={flash.current} strokeWidth="1.5" />
                <circle cx={MEM} cy={PUMP_Y} r={4 + (1 - flash.current) * 7} fill="none" stroke="var(--signal)" strokeOpacity={flash.current * 0.7} strokeWidth="1" />
              </>
            )}
          </g>
          {mode === "active" && energy && (
            <text x="374" y="310" fontSize="8" fill="var(--membrane)" opacity="0.7" fontFamily="var(--font-mono)" textAnchor="end">
              ATP 由细胞呼吸提供
            </text>
          )}
          {/* 溶液中的粒子 */}
          {drift.current.map((p, i) => (
            <g key={i}>{dot(p.x, p.y, p.side)}</g>
          ))}
          {/* 跨膜运输中的粒子 */}
          {crosses.current.map((c, i) => (
            <g key={`cr${i}`}>{dot(crossX(c), c.y, c.ion)}</g>
          ))}
          {/* ATP 小球飞向泵 */}
          {atps.current.map((a, i) => (
            <g key={`atp${i}`}>
              <circle cx={300 - 92 * a.p} cy={294 - 68 * a.p} r="4" fill="oklch(0.85 0.13 90 / 0.95)" />
              <line
                x1={300 - 92 * a.p + 7}
                y1={294 - 68 * a.p + 5}
                x2={300 - 92 * a.p + 12}
                y2={294 - 68 * a.p + 9}
                stroke="oklch(0.85 0.13 90 / 0.5)"
                strokeWidth="1.5"
              />
            </g>
          ))}
          {substance === "pump" && (
            <>
              <circle cx="30" cy="34" r="3.3" fill="oklch(0.75 0.13 60 / 0.9)" />
              <text x="38" y="37" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
                Na⁺ 多
              </text>
              <circle cx="370" cy="34" r="3.3" fill="oklch(0.68 0.12 230 / 0.9)" />
              <text x="362" y="37" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="end">
                K⁺ 多
              </text>
            </>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">运输物质</div>
          <Segmented options={SUB_OPTIONS} value={substance} onChange={setSubstance} />
        </div>
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">运输方式</div>
          <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRunning((r) => !r)}>
            {running ? "暂停" : "开始运输"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重置
          </Button>
        </div>
        <Button variant="outline" className="w-full" disabled={mode !== "active"} onClick={() => setEnergy((e) => !e)}>
          {energy ? "切断能量（ATP）供应" : "恢复能量（ATP）供应"}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Readout
            label="相对运输速率"
            value={rate === 0 ? "0%" : `${Math.round((rate / 9) * 100)}%`}
            tone={rate === 0 ? "warn" : rate >= 6 ? "good" : undefined}
          />
          <Readout label="浓度梯度方向" value={meta.gradient} />
          <Readout label="累计转运粒子" value={carried.current} />
          <Readout label="ATP 消耗" value={atpUsed.current} tone={mode === "active" && atpUsed.current > 0 ? "good" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {mode === "active" && !energy
            ? "能量已切断——主动运输依赖 ATP 供能，供能停止则运输立即停止。"
            : meta.notes[mode]}
        </p>
      </div>
    </>
  );
}
