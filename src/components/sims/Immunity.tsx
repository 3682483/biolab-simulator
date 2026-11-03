import { useRef, useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

type Path = "humoral" | "cell";
const STAGES: Record<Path, { label: string; note: string }[]> = {
  humoral: [
    { label: "病原体入侵", note: "病原体表面抗原被免疫系统识别。" },
    { label: "吞噬细胞摄取", note: "吞噬细胞吞噬处理病原体，暴露其抗原。" },
    { label: "T 细胞传递抗原", note: "辅助性 T 细胞识别抗原，传递给 B 细胞。" },
    { label: "B 细胞活化分化", note: "B 细胞增殖分化为浆细胞与记忆 B 细胞。" },
    { label: "浆细胞分泌抗体", note: "浆细胞产生特异性抗体，与抗原结合使其凝集沉淀。" },
    { label: "清除病原体", note: "抗体标记的病原体被吞噬细胞消灭。" },
  ],
  cell: [
    { label: "靶细胞出现", note: "病原体侵入宿主细胞，细胞表面出现抗原-MHC 复合体。" },
    { label: "T 细胞识别活化", note: "细胞毒性 T 细胞识别靶细胞表面抗原，增殖分化。" },
    { label: "效应 T 细胞接触", note: "效应 T 细胞与靶细胞密切接触，分泌穿孔素。" },
    { label: "靶细胞裂解", note: "靶细胞裂解死亡，释放的病原体再被体液免疫清除。" },
    { label: "记忆 T 细胞留存", note: "记忆 T 细胞长期存活，再次感染时迅速应答。" },
  ],
};

export function Immunity() {
  const [path, setPath] = useState<Path>("humoral");
  const [step, setStep] = useState(0);
  const [second, setSecond] = useState(false); // 二次感染演示
  const [, force] = useState(0);
  const abs = useRef<{ x: number; y: number; born: number }[]>([]);
  const tRef = useRef(0);

  const stages = STAGES[path];
  const stepInfo = stages[Math.min(step, stages.length - 1)]!;

  useFrame((dt) => {
    tRef.current += dt;
    // 浆细胞阶段持续释放抗体
    if (path === "humoral" && step >= 4 && abs.current.length < 26) {
      abs.current.push({ x: 208, y: 116, born: tRef.current });
    }
    abs.current = abs.current.filter((a) => {
      a.x += dt * 70;
      return a.x < 352;
    });
    force((v) => v + 1);
  });

  const reset = (p: Path) => {
    setPath(p);
    setStep(0);
    setSecond(false);
    abs.current = [];
  };

  const progress = (p: Path) => (second ? 1.6 : 0.8); // 二次免疫应答速度加倍
  const k = Math.min(step, stages.length - 1) / Math.max(1, stages.length - 1);

  return (
    <>
      <Stage caption="特异性免疫：体液免疫（抗体作战）与细胞免疫（效应 T 细胞作战）">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 阶段进度条 */}
          <g>
            {stages.map((s, i) => (
              <g key={i}>
                <rect x={24 + i * 62} y="16" width={i === stages.length - 1 ? 46 : 56} height="6" rx="3" fill={i <= k * (stages.length - 1) ? "var(--signal)" : "var(--stage-foreground)"} opacity={i <= k * (stages.length - 1) ? 0.9 : 0.2} />
                <text x={24 + i * 62} y="34" fontSize="7.5" fill="var(--stage-foreground)" opacity={i === Math.min(step, stages.length - 1) ? 0.9 : 0.4} fontFamily="var(--font-mono)">
                  {s.label}
                </text>
              </g>
            ))}
          </g>

          {path === "humoral" ? (
            <>
              {/* 病原体 */}
              <g transform={`translate(${step >= 5 ? 330 : 88} ${step >= 1 ? 110 : 150})`} opacity={step >= 5 ? 0.3 : 1}>
                <circle r="20" fill="oklch(0.55 0.18 25 / 0.35)" stroke="var(--signal)" strokeWidth="1.4" />
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  return <line key={i} x1={Math.cos(a) * 20} y1={Math.sin(a) * 20} x2={Math.cos(a) * 27} y2={Math.sin(a) * 27} stroke="var(--signal)" strokeWidth="1.6" />;
                })}
                <text y="-30" fontSize="9" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">
                  病原体（抗原）
                </text>
              </g>
              {/* 吞噬细胞 */}
              <g opacity={step >= 1 && step <= 2 ? 1 : step > 2 ? 0.45 : 0.2}>
                <path d="M136 96 q-16 -20 6 -26 q22 -8 30 10 q10 22 -8 30 q-22 8 -28 -14 Z" fill="oklch(0.7 0.06 160 / 0.2)" stroke="var(--membrane)" strokeWidth="1.4" />
                <text x="152" y="70" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
                  吞噬细胞
                </text>
              </g>
              {/* B 细胞 → 浆细胞 */}
              <g>
                <circle cx="208" cy="116" r="17" fill={step >= 4 ? "oklch(0.6 0.1 300 / 0.3)" : "oklch(0.7 0.06 160 / 0.16)"} stroke="var(--membrane)" strokeWidth="1.4" opacity={step >= 3 ? 1 : 0.35} />
                <text x="208" y="150" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
                  {step >= 4 ? "浆细胞（分泌抗体）" : "B 细胞"}
                </text>
                {step >= 4 && <circle cx="208" cy="116" r="4" fill="oklch(0.6 0.1 300 / 0.8)" />}
              </g>
              {/* 记忆 B 细胞 */}
              {step >= 4 && (
                <g>
                  <circle cx="208" cy="216" r="11" fill="oklch(0.65 0.13 260 / 0.3)" stroke="var(--membrane)" />
                  <text x="208" y="242" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
                    记忆 B 细胞{second ? "（迅速应答）" : ""}
                  </text>
                </g>
              )}
              {/* 抗体 */}
              {abs.current.map((a, i) => (
                <g key={i} opacity={0.9}>
                  <circle cx={a.x} cy={a.y} r="3.4" fill="oklch(0.6 0.1 300 / 0.85)" />
                  <path d={`M${a.x} ${a.y} l-4 -6 M${a.x} ${a.y} l4 -6`} stroke="oklch(0.6 0.1 300 / 0.85)" strokeWidth="1.6" />
                </g>
              ))}
              {/* 二次免疫曲线 */}
              <g>
                <rect x="286" y="236" width="94" height="66" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
                <path d="M290 296 q14 -8 22 -34 t14 -12" stroke="oklch(0.6 0.1 300 / 0.5)" strokeWidth="1.6" fill="none" />
                <path d="M290 296 q10 -18 16 -50 t16 -20" stroke="var(--signal)" strokeWidth="1.6" fill="none" opacity={second ? 1 : 0.25} />
                <text x="333" y="230" fontSize="8" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
                  抗体浓度（紫=初次 红=二次）
                </text>
              </g>
            </>
          ) : (
            <>
              {/* 靶细胞 */}
              <g>
                <rect x="80" y="96" width="72" height="58" rx="9" fill={step >= 3 ? "oklch(0.5 0.16 25 / 0.18)" : "oklch(0.7 0.06 160 / 0.12)"} stroke={step >= 3 ? "var(--signal)" : "var(--membrane)"} strokeWidth="1.5" strokeDasharray={step >= 3 ? "3 2" : undefined} />
                <circle cx="116" cy="125" r="10" fill="oklch(0.5 0.1 330 / 0.3)" />
                <path d="M104 92 l6 -8 m2 8 l6 -8" stroke="var(--signal)" strokeWidth="1.8" opacity={step >= 0 ? 1 : 0.3} />
                <text x="116" y="176" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
                  靶细胞（表面抗原↑）
                </text>
              </g>
              {/* T 细胞 → 效应 T */}
              <g opacity={step >= 1 ? 1 : 0.3}>
                <circle cx="216" cy="125" r="19" fill={step >= 2 ? "oklch(0.62 0.13 260 / 0.3)" : "oklch(0.7 0.06 160 / 0.16)"} stroke="var(--membrane)" strokeWidth="1.5" />
                <text x="216" y="160" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
                  {step >= 2 ? "效应 T 细胞" : "细胞毒性 T 细胞"}
                </text>
                {step >= 2 && (
                  <path d="M197 125 h-40 m0 0 l6 -4 m-6 4 l6 4" stroke="var(--signal)" strokeWidth="2" fill="none">
                    <animate attributeName="stroke-opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                  </path>
                )}
                {step >= 3 && (
                  <text x="176" y="112" fontSize="8.5" fill="var(--signal)" fontFamily="var(--font-mono)">
                    穿孔素
                  </text>
                )}
              </g>
              {/* 记忆 T */}
              {step >= 4 && (
                <g>
                  <circle cx="216" cy="228" r="11" fill="oklch(0.65 0.13 260 / 0.3)" stroke="var(--membrane)" />
                  <text x="216" y="254" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.8" fontFamily="var(--font-mono)">
                    记忆 T 细胞
                  </text>
                </g>
              )}
              <text x="200" y="292" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
                裂解释放的病原体 → 由体液免疫产生的抗体最终清除
              </text>
            </>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={[
            { value: "humoral", label: "体液免疫" },
            { value: "cell", label: "细胞免疫" },
          ]}
          value={path}
          onChange={(v) => reset(v as Path)}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setStep((s) => Math.min(s + 1, stages.length))}>
            下一步
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSecond((v) => !v);
              setStep(0);
              abs.current = [];
            }}
          >
            {second ? "二次感染：开" : "二次感染：关"}
          </Button>
          <Button variant="outline" onClick={() => reset(path)}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="当前阶段" value={stepInfo.label} />
          <Readout label="阶段进度" value={`${Math.min(step, stages.length - 1) + 1} / ${stages.length}`} />
          <Readout label="应答速度" value={second ? "×2（记忆细胞）" : "×1（初次免疫）"} tone={second ? "good" : undefined} />
          <Readout label="作用对象" value={path === "humoral" ? "细胞外液中的抗原" : "被感染的靶细胞"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {stepInfo.note}
          {second
            ? " 二次感染时记忆细胞迅速增殖分化，抗体产生更快、更强、更持久——这就是疫苗保护力的原理。"
            : " 点击“下一步”推进免疫过程。"}
        </p>
      </div>
    </>
  );
}
