import { useRef, useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

type Focus = "all" | "gly" | "krebs" | "ox";
type Zone = "cyto" | "matrix" | "im";
type BallKind = "atp" | "h" | "co2" | "h2o";
type Ball = { x: number; y: number; vx: number; vy: number; life: number; kind: BallKind; zone: Zone };

const WINDOWS: Record<Exclude<Focus, "all">, [number, number]> = {
  gly: [0, 0.28],
  krebs: [0.28, 0.64],
  ox: [0.64, 1],
};
const FOCUS_OPTIONS: { value: Focus; label: string }[] = [
  { value: "all", label: "全程" },
  { value: "gly", label: "糖酵解" },
  { value: "krebs", label: "柠檬酸循环" },
  { value: "ox", label: "氧化磷酸化" },
];
const NOTES: Record<Focus, string> = {
  all: "一分子葡萄糖经糖酵解（细胞质基质）、柠檬酸循环（线粒体基质）与氧化磷酸化（线粒体内膜）逐步氧化，共净得约 28 个 ATP。",
  gly: "糖酵解在细胞质基质中进行：葡萄糖分解为 2 分子丙酮酸，净生成 2 ATP 与 2 NADH，此阶段不需要氧。",
  krebs: "柠檬酸循环在线粒体基质中进行：丙酮酸脱羧为乙酰 CoA 进入循环，共释放 6 CO₂，生成 2 ATP 与 10 个 [H]（8 NADH + 2 FADH₂）。",
  ox: "氧化磷酸化在线粒体内膜上进行：[H] 交给氧气生成水，释放的能量由 ATP 合成酶合成约 24 个 ATP——产能最主要的阶段。",
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => {
  const u = clamp01((t - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const stageName = (t: number) => (t < 0.28 ? "糖酵解" : t < 0.64 ? "柠檬酸循环" : "氧化磷酸化");
// 正六边形顶点（葡萄糖）
const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => `${(cx + r * Math.cos(Math.PI / 6 + (i * Math.PI) / 3)).toFixed(1)},${(cy + r * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)).toFixed(1)}`).join(" ");

const mk = (x: number, y: number, vx: number, vy: number, kind: BallKind, zone: Zone): Ball => ({
  x,
  y,
  vx,
  vy,
  life: 1.5,
  kind,
  zone,
});

export function CellularRespiration() {
  const [focus, setFocus] = useState<Focus>("all");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [, force] = useState(0);

  const balls = useRef<Ball[]>([]);
  const acc = useRef(0);

  useFrame((dt) => {
    if (playing) {
      let n = t + (dt * speed) / 26;
      if (focus === "all") {
        if (n >= 1) {
          n = 1;
          setPlaying(false);
        }
      } else {
        const [a, b] = WINDOWS[focus];
        if (n >= b) n = a + (n - b);
      }
      setT(n);
      // 按当前阶段随机生成产物小球
      if (n < 0.28) {
        acc.current += dt * speed * 1.6;
        while (acc.current >= 1) {
          acc.current -= 1;
          balls.current.push(
            Math.random() < 0.5
              ? mk(84, 156, -35 - Math.random() * 20, -55 - Math.random() * 20, "atp", "cyto")
              : mk(80, 150, 70 + Math.random() * 30, -15 - Math.random() * 20, "h", "cyto"),
          );
        }
      } else if (n < 0.64) {
        acc.current += dt * speed * 2.2;
        while (acc.current >= 1) {
          acc.current -= 1;
          const r = Math.random();
          balls.current.push(
            r < 0.4
              ? mk(262, 148, -10 - Math.random() * 12, -55 - Math.random() * 15, "co2", "matrix")
              : r < 0.85
                ? mk(284, 158, 60 + Math.random() * 25, -20 - Math.random() * 15, "h", "matrix")
                : mk(286, 180, -40 - Math.random() * 15, -65 - Math.random() * 15, "atp", "matrix"),
          );
        }
      } else {
        acc.current += dt * speed * 5;
        while (acc.current >= 1) {
          acc.current -= 1;
          balls.current.push(
            Math.random() < 0.8
              ? mk(272, 72, -30 - Math.random() * 55, 45 + Math.random() * 55, "atp", "im")
              : mk(348, 260, 25 + Math.random() * 10, 30 + Math.random() * 12, "h2o", "im"),
          );
        }
      }
      if (balls.current.length > 90) balls.current.splice(0, balls.current.length - 90);
    }
    balls.current = balls.current.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      return b.life > 0;
    });
    force((n) => n + 1);
  });

  const g = clamp01(t / 0.28);
  const k = clamp01((t - 0.28) / 0.36);
  const o = clamp01((t - 0.64) / 0.36);
  const atpTotal = 2 * g + 2 * k + 24 * o;
  const co2 = 6 * k;
  const hyd = 2 * g + 10 * k;
  const h2o = 6 * o;

  // 阶段聚焦：目标区域全显，其余半透明
  const dim = (zone: Zone) => {
    if (focus === "all") return 1;
    if (focus === "gly") return zone === "cyto" ? 1 : 0.2;
    if (focus === "krebs") return zone === "matrix" ? 1 : 0.2;
    return zone === "im" ? 1 : 0.2;
  };

  // 丙酮酸：从葡萄糖移向线粒体
  const py = seg(g, 0.25, 1);
  const pyOp = 1 - seg(py, 0.85, 1);
  // 乙酰 CoA：从膜侧进入循环
  const ac = seg(k, 0.05, 0.3);

  const now = performance.now();
  // 呼吸链三个复合体位置（内膜右侧）
  const CH1: [number, number] = [341, 87];
  const CH2: [number, number] = [380, 170];
  const CH3: [number, number] = [341, 253];
  const chain = [CH1, CH2, CH3];

  const reset = () => {
    setPlaying(false);
    setFocus("all");
    setSpeed(1);
    setT(0);
    balls.current = [];
  };

  return (
    <>
      <Stage caption={`${stageName(t)} · ${(t * 100).toFixed(0)}%`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 细胞质基质区 */}
          <rect x="8" y="30" width="140" height="278" rx="8" fill="oklch(0.7 0.06 160 / 0.05)" stroke="var(--stage-foreground)" strokeOpacity="0.25" strokeDasharray="5 4" />
          <text x="16" y="44" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            细胞质基质
          </text>
          {/* 线粒体：外膜 + 内膜 */}
          <ellipse cx="272" cy="170" rx="118" ry="118" fill="oklch(0.72 0.08 60 / 0.07)" stroke="var(--stage-foreground)" strokeOpacity="0.55" />
          <ellipse cx="272" cy="170" rx="108" ry="108" fill="none" stroke="var(--membrane)" strokeOpacity="0.8" />
          <path d="M196 100 q14 12 0 24 q-14 12 0 24" stroke="var(--membrane)" strokeOpacity="0.4" fill="none" />
          <path d="M196 192 q14 12 0 24 q-14 12 0 24" stroke="var(--membrane)" strokeOpacity="0.4" fill="none" />
          <g opacity={dim("matrix")}>
            <text x="222" y="216" fontSize="8" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)" textAnchor="middle">
              线粒体基质
            </text>
          </g>
          <g opacity={dim("im")}>
            <text x="398" y="46" fontSize="8.5" fill="var(--membrane)" fontFamily="var(--font-mono)" textAnchor="end">
              ③ 氧化磷酸化
            </text>
            <text x="398" y="60" fontSize="7" fill="var(--membrane)" opacity="0.7" fontFamily="var(--font-mono)" textAnchor="end">
              线粒体内膜 · 呼吸链
            </text>
            {/* O₂ 进、H₂O 出 */}
            <circle cx="350" cy="56" r="4.5" fill="none" stroke="oklch(0.7 0.05 220 / 0.8)" />
            <text x="358" y="59" fontSize="7.5" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              O₂
            </text>
            <path d="M350 62 L344 76" stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeDasharray="2 2" />
            <text x="346" y="284" fontSize="7.5" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              H₂O
            </text>
            <path d="M344 266 L350 277" stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeDasharray="2 2" />
            {/* 呼吸链三个复合体 */}
            {chain.map(([cx, cy], i) => (
              <rect key={i} x={cx - 7} y={cy - 10} width="14" height="20" rx="4" fill="var(--membrane)" fillOpacity="0.3" stroke="var(--membrane)" />
            ))}
            {/* 沿链传递的电子 */}
            {o > 0.02 &&
              [0, 1, 2].map((i) => {
                const u = (((now / 1400 + i / 3) % 1) + 1) % 1;
                const x = u < 0.5 ? lerp(CH1[0], CH2[0], u * 2) : lerp(CH2[0], CH3[0], (u - 0.5) * 2);
                const y = u < 0.5 ? lerp(CH1[1], CH2[1], u * 2) : lerp(CH2[1], CH3[1], (u - 0.5) * 2);
                return <circle key={`e${i}`} cx={x} cy={y} r="2.5" fill="var(--signal)" opacity={Math.min(1, o * 3)} />;
              })}
            {/* ATP 合成酶 */}
            <rect x="265" y="52" width="14" height="16" rx="3" fill="var(--membrane)" fillOpacity="0.4" stroke="var(--membrane)" />
            <text x="272" y="46" fontSize="7" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="middle">
              ATP 合成酶
            </text>
          </g>
          {/* 糖酵解场景 */}
          <g opacity={dim("cyto")}>
            <text x="105" y="56" fontSize="10" fill="var(--specimen)" fontFamily="var(--font-mono)" textAnchor="middle">
              ① 糖酵解
            </text>
            <text x="105" y="70" fontSize="7" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)" textAnchor="middle">
              C₆ → 2 C₃ + 2ATP + 2[H]
            </text>
            <polygon points={hex(62, 128, 12)} fill="var(--membrane)" fillOpacity="0.4" stroke="var(--membrane)" />
            <text x="62" y="131" fontSize="7" fill="var(--stage-foreground)" fontFamily="var(--font-mono)" textAnchor="middle">
              C₆
            </text>
            <text x="62" y="154" fontSize="7.5" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)" textAnchor="middle">
              葡萄糖
            </text>
            <polygon points={`${lerp(70, 158, py)},${lerp(138, 148, py) - 7} ${lerp(70, 158, py) - 6},${lerp(138, 148, py) + 5} ${lerp(70, 158, py) + 6},${lerp(138, 148, py) + 5}`} fill="oklch(0.8 0.12 90 / 0.85)" opacity={pyOp} />
            <polygon points={`${lerp(70, 158, py)},${lerp(146, 190, py) - 7} ${lerp(70, 158, py) - 6},${lerp(146, 190, py) + 5} ${lerp(70, 158, py) + 6},${lerp(146, 190, py) + 5}`} fill="oklch(0.8 0.12 90 / 0.85)" opacity={pyOp} />
          </g>
          {/* 柠檬酸循环场景 */}
          <g opacity={dim("matrix")}>
            <text x="300" y="96" fontSize="7" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)" textAnchor="middle">
              丙酮酸 → 乙酰 CoA
            </text>
            <circle cx={lerp(185, 244, ac)} cy={lerp(150, 168, ac)} r="5" fill="var(--specimen)" opacity={0.4 + 0.6 * (1 - ac)} />
            <circle cx={lerp(185, 244, ac)} cy={lerp(190, 168, ac)} r="5" fill="var(--specimen)" opacity={0.4 + 0.6 * (1 - ac)} />
            <text x={lerp(185, 244, ac)} y={lerp(150, 168, ac) + 2} fontSize="6" fill="var(--stage-foreground)" fontFamily="var(--font-mono)" textAnchor="middle">
              C₂
            </text>
            <text x={lerp(185, 244, ac)} y={lerp(190, 168, ac) + 2} fontSize="6" fill="var(--stage-foreground)" fontFamily="var(--font-mono)" textAnchor="middle">
              C₂
            </text>
            <circle cx="272" cy="168" r="30" fill="none" stroke="var(--specimen)" strokeOpacity="0.7" strokeDasharray="4 3" />
            <circle
              cx={272 + 30 * Math.cos(-Math.PI / 2 + k * 4 * Math.PI)}
              cy={168 + 30 * Math.sin(-Math.PI / 2 + k * 4 * Math.PI)}
              r="3"
              fill="var(--specimen)"
            />
            <text x="272" y="171" fontSize="6.5" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)" textAnchor="middle">
              ② 柠檬酸循环
            </text>
          </g>
          {/* 产物小球 */}
          {balls.current.map((b, i) => {
            const op = clamp01(b.life / 1.5) * dim(b.zone);
            if (b.kind === "co2") return <circle key={`b${i}`} cx={b.x} cy={b.y} r="4" fill="none" stroke="oklch(0.7 0.05 220 / 0.8)" strokeWidth="1" opacity={op} />;
            if (b.kind === "atp") return <circle key={`b${i}`} cx={b.x} cy={b.y} r="3.5" fill="oklch(0.82 0.15 95 / 0.95)" opacity={op} />;
            if (b.kind === "h2o") return <circle key={`b${i}`} cx={b.x} cy={b.y} r="3.5" fill="oklch(0.72 0.1 230 / 0.85)" opacity={op} />;
            return <circle key={`b${i}`} cx={b.x} cy={b.y} r="3" fill="oklch(0.75 0.1 220 / 0.9)" opacity={op} />;
          })}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={FOCUS_OPTIONS}
          value={focus}
          onChange={(f) => {
            setFocus(f);
            setT(f === "all" ? 0 : WINDOWS[f][0] + 0.02);
          }}
        />
        <Control label="播放速度" value={speed} unit="×" min={0.5} max={3} step={0.5} onChange={setSpeed} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setPlaying((r) => !r)}>
            {playing ? "暂停" : focus === "all" ? "播放全程" : "播放本阶段"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="累计 ATP（≈28）" value={atpTotal.toFixed(1)} tone={t >= 0.999 ? "good" : undefined} />
          <Readout label="CO₂" value={co2.toFixed(1)} />
          <Readout label="[H]（NADH+FADH₂）" value={hyd.toFixed(1)} />
          <Readout label="H₂O" value={h2o.toFixed(1)} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{NOTES[focus]}</p>
      </div>
    </>
  );
}
