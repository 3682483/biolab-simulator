import { useRef, useState } from "react";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 血糖动力学：目标 3.9–6.1 mmol/L
const NORMAL = { lo: 3.9, hi: 6.1 };
const glucoseY = (g: number) => 236 - ((g - 1) / 10) * 168; // 1–11 映射到画布

type Hormone = { x: number; y: number; kind: "ins" | "glu"; target: number };

export function BloodGlucose() {
  const [glucose, setGlucose] = useState(5);
  const [ins, setIns] = useState(0.3); // 胰岛素分泌水平 0–1
  const [glu, setGlu] = useState(0.3); // 胰高血糖素
  const [trace, setTrace] = useState<number[]>([5]);
  const [, force] = useState(0);
  const hormones = useRef<Hormone[]>([]);
  const tRef = useRef(0);

  useFrame((dt) => {
    tRef.current += dt;
    // 激素分泌由血糖偏离驱动
    setIns((v) => v + ((glucose > NORMAL.hi ? 1 : glucose > 5.2 ? 0.55 : 0.15) - v) * dt * 1.6);
    setGlu((v) => v + ((glucose < NORMAL.lo ? 1 : glucose < 4.4 ? 0.55 : 0.12) - v) * dt * 1.6);
    // 血糖动力学：食物摄取（若刚进餐残余）+肝糖原分解(glu) - 细胞摄取(ins)
    setGlucose((g) => {
      let d = 0;
      d += glu * 0.9 - ins * 1.05;
      d += (5 - g) * 0.55; // 基础回归
      return Math.max(1.2, Math.min(11, g + d * dt));
    });
    // 激素粒子飞向靶细胞
    if (Math.random() < dt * 3) {
      const hi = glucose > NORMAL.hi;
      hormones.current.push({ x: 88, y: hi ? 92 : 148, kind: hi ? "ins" : "glu", target: 300 });
    }
    hormones.current = hormones.current.filter((h) => {
      h.x += dt * 95;
      return h.x < h.target;
    });
    setTrace((tr) => (tRef.current % 0.2 < dt ? [...tr.slice(-79), glucose] : tr));
    force((v) => v + 1);
  });

  const state = glucose > NORMAL.hi ? "偏高" : glucose < NORMAL.lo ? "偏低" : "正常";
  const path = trace.map((g, i) => `${i === 0 ? "M" : "L"}${296 + (i / Math.max(1, trace.length - 1)) * 88} ${glucoseY(g).toFixed(1)}`).join(" ");

  return (
    <>
      <Stage caption="血糖稳态：胰岛素（降）与胰高血糖素（升）的拮抗调节">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 仪表盘 */}
          <g>
            <path d="M40 236 A 88 88 0 0 1 216 236" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.3" strokeWidth="14" />
            {/* 正常带 */}
            <path d="M40 236 A 88 88 0 0 1 216 236" fill="none" stroke="oklch(0.7 0.12 145 / 0.5)" strokeWidth="14" strokeDasharray={`${Math.PI * 88 * 0.42} ${Math.PI * 88}`} strokeDashoffset={-Math.PI * 88 * 0.55} />
            <line
              x1="128"
              y1="236"
              x2={128 + 70 * Math.cos(Math.PI - ((glucose - 1) / 10) * Math.PI)}
              y2={236 - 70 * Math.sin(Math.PI - ((glucose - 1) / 10) * Math.PI)}
              stroke="var(--signal)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="128" cy="236" r="6" fill="var(--stage-foreground)" />
            <text x="128" y="262" fontSize="16" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
              {glucose.toFixed(2)}
            </text>
            <text x="128" y="280" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              mmol/L · {state}
            </text>
            <text x="52" y="256" fontSize="9" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              低血糖
            </text>
            <text x="176" y="256" fontSize="9" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              高血糖
            </text>
          </g>
          {/* 胰岛 */}
          <g>
            <ellipse cx="88" cy="92" rx="26" ry="18" fill="oklch(0.7 0.06 160 / 0.14)" stroke="var(--membrane)" />
            <circle cx="80" cy="88" r="7" fill="oklch(0.62 0.13 260 / 0.7)" />
            <circle cx="98" cy="96" r="7" fill="oklch(0.7 0.13 25 / 0.7)" />
            <text x="88" y="70" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              B 细胞·胰岛素
            </text>
            <ellipse cx="88" cy="150" rx="26" ry="16" fill="oklch(0.7 0.06 160 / 0.14)" stroke="var(--membrane)" />
            <circle cx="88" cy="150" r="7" fill="oklch(0.65 0.13 310 / 0.7)" />
            <text x="88" y="178" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              A 细胞·胰高血糖素
            </text>
          </g>
          {/* 靶细胞 */}
          <g>
            <rect x="296" y="60" width="84" height="60" rx="10" fill="oklch(0.7 0.06 160 / 0.1)" stroke="var(--membrane)" />
            <text x="338" y="94" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
              组织细胞
            </text>
            <rect x="296" y="132" width="84" height="60" rx="10" fill="oklch(0.7 0.06 160 / 0.1)" stroke="var(--membrane)" />
            <text x="338" y="158" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
              肝细胞
            </text>
            <text x="338" y="176" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              糖原 ⇄ 葡萄糖
            </text>
          </g>
          {/* 激素粒子 */}
          {hormones.current.map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r="4" fill={h.kind === "ins" ? "oklch(0.62 0.13 260 / 0.85)" : "oklch(0.65 0.13 310 / 0.85)"} />
          ))}
          {/* 血糖轨迹 */}
          <g>
            <rect x="294" y="56" width="92" height="0" />
            <path d={`M296 ${glucoseY(trace[0] ?? 5)} ${path.slice(1)}`} stroke="var(--signal)" strokeWidth="1.8" fill="none" opacity="0.8" transform="translate(-56 112)" />
            <text x="352" y="166" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              近 80 帧
            </text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setGlucose((g) => Math.min(11, g + 3.4))}>
            进餐（大量糖类）
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => setGlucose((g) => Math.max(1.2, g - 2.6))}>
            剧烈运动
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="血糖浓度" value={`${glucose.toFixed(2)} mmol/L`} tone={state === "正常" ? "good" : "warn"} />
          <Readout label="当前状态" value={state} tone={state === "正常" ? "good" : "warn"} />
          <Readout label="胰岛素分泌" value={`${Math.round(ins * 100)}%`} tone={ins > 0.7 ? "good" : undefined} />
          <Readout label="胰高血糖素分泌" value={`${Math.round(glu * 100)}%`} tone={glu > 0.7 ? "good" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {state === "偏高"
            ? "血糖升高 → 胰岛 B 细胞分泌胰岛素：促进组织细胞摄取葡萄糖、促进肝糖原合成——血糖回落。这是唯一降血糖的激素。"
            : state === "偏低"
              ? "血糖降低 → 胰岛 A 细胞分泌胰高血糖素：促进肝糖原分解、促进非糖物质转化——血糖回升。"
              : "两种激素作用相反、相互拮抗，通过反馈调节将血糖稳定在 3.9–6.1 mmol/L 的窄幅区间——稳态是生命活动正常进行的基础。"}
        </p>
      </div>
    </>
  );
}
