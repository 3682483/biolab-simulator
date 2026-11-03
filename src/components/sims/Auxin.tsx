import { useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";

// 生长素两重性：钟形曲线（对数浓度轴 10^-6 ~ 10^-2），根最敏感、芽次之、茎最迟钝
const ORGANS = [
  { key: "root", label: "根", peak: -5.2, width: 1.1, color: "oklch(0.62 0.13 150)" },
  { key: "bud", label: "芽", peak: -4.0, width: 1.4, color: "oklch(0.68 0.13 260)" },
  { key: "stem", label: "茎", peak: -2.8, width: 1.7, color: "oklch(0.7 0.13 25)" },
] as const;

// 浓度 log10 映射：-6 → 0, -2 → 1
const u = (logC: number) => (logC + 6) / 4;
const bell = (logC: number, peak: number, width: number) => Math.exp(-((logC - peak) ** 2) / (2 * width * width));
const rateAt = (logC: number, organ: (typeof ORGANS)[number]) => {
  // 归一化到各器官自身峰值 = 100%
  return Math.min(1.15, bell(logC, organ.peak, organ.width) / bell(organ.peak, organ.peak, organ.width));
};

export function Auxin() {
  const [logC, setLogC] = useState(-4.6);
  const [scene, setScene] = useState<"free" | "apical" | "geo">("free");

  const rates = ORGANS.map((o) => ({ organ: o, rate: rateAt(logC, o) }));
  const fmt = (v: number) => `${Math.round(v * 100)}%`;

  // 曲线路径
  const curve = (o: (typeof ORGANS)[number]) =>
    Array.from({ length: 60 }, (_, i) => {
      const x = u(-6 + (i / 59) * 4) * 260 + 60;
      const y = 208 - rateAt(-6 + (i / 59) * 4, o) * 140;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");

  const applyScene = (s: typeof scene) => {
    setScene(s);
    if (s === "apical") setLogC(-3.4);
    else if (s === "geo") setLogC(-4.2);
  };

  return (
    <>
      <Stage caption="生长素生理作用的两重性：低浓度促进、高浓度抑制，敏感度 根 > 芽 > 茎">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 左：幼苗示意 */}
          <g>
            {/* 茎 */}
            <line x1="52" y1="240" x2="52" y2="120" stroke="oklch(0.55 0.12 130)" strokeWidth={4 + rates[2]!.rate * 4} strokeLinecap="round" opacity="0.85" />
            {/* 芽 */}
            <circle cx="52" cy="112" r={8 + rates[1]!.rate * 4} fill="oklch(0.7 0.13 260 / 0.5)" />
            {/* 根 */}
            <path d={`M52 244 q${scene === "geo" ? 14 : 0} 20 ${scene === "geo" ? 66 : 0} ${rates[0]!.rate > 0.5 ? 34 : 40}`} stroke="oklch(0.62 0.13 150 / 0.7)" strokeWidth={3.4 + rates[0]!.rate * 4} fill="none" strokeLinecap="round" />
            <text x="52" y="300" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
              幼苗（线宽=生长速率）
            </text>
            {scene === "apical" && (
              <g>
                <path d="M64 116 q10 -6 14 -14" stroke="var(--signal)" strokeWidth="1.4" fill="none" strokeDasharray="3 2" />
                <text x="104" y="98" fontSize="9" fill="var(--signal)" fontFamily="var(--font-mono)">
                  顶芽优先生长
                </text>
                <text x="104" y="112" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
                  侧芽受抑制（浓度过高）
                </text>
              </g>
            )}
            {scene === "geo" && (
              <text x="120" y="272" fontSize="9" fill="var(--signal)" fontFamily="var(--font-mono)">
                根向地性：近地侧浓度高 → 抑制
              </text>
            )}
          </g>
          {/* 右：三条曲线 */}
          <g>
            <line x1="60" y1="208" x2="330" y2="208" stroke="var(--stage-foreground)" strokeOpacity="0.35" />
            <line x1="60" y1="60" x2="60" y2="208" stroke="var(--stage-foreground)" strokeOpacity="0.25" strokeDasharray="3 3" />
            {ORGANS.map((o) => (
              <path key={o.key} d={curve(o)} stroke={o.color} strokeWidth="2.2" fill="none" opacity="0.9" />
            ))}
            {/* 当前浓度游标 */}
            <line x1={u(logC) * 260 + 60} y1="56" x2={u(logC) * 260 + 60} y2="208" stroke="var(--signal)" strokeWidth="1.4" strokeDasharray="4 3" />
            {rates.map((r) => (
              <circle key={r.organ.key} cx={u(logC) * 260 + 60} cy={208 - r.rate * 140} r="4.6" fill="white" stroke={r.organ.color} strokeWidth="2.4" />
            ))}
            <text x="60" y="226" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              10⁻⁶
            </text>
            <text x="195" y="226" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              10⁻⁴
            </text>
            <text x="318" y="226" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              10⁻² mol/L
            </text>
            <text x="330" y="52" fontSize="9.5" textAnchor="end" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              ●根 ●芽 ●茎 ▽当前
            </text>
            <text x="195" y="248" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              生长速率
            </text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="生长素浓度" value={Number(u(logC).toFixed(2))} min={0} max={1} step={0.02} onChange={(v) => { setLogC(v * 4 - 6); setScene("free"); }} />
        <div className="flex gap-2">
          <Button variant={scene === "apical" ? "default" : "outline"} className="flex-1" onClick={() => applyScene("apical")}>
            顶端优势
          </Button>
          <Button variant={scene === "geo" ? "default" : "outline"} className="flex-1" onClick={() => applyScene("geo")}>
            根的向地性
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {rates.map((r) => (
            <Readout key={r.organ.key} label={`${r.organ.label}生长速率`} value={fmt(r.rate)} tone={r.rate > 0.9 ? "good" : r.rate < 0.4 ? "warn" : undefined} />
          ))}
          <Readout label="当前浓度" value={`10^${logC.toFixed(1)} mol/L`} />
          <Readout label="两重性表现" value={rates.some((r) => r.rate < 0.4) && rates.some((r) => r.rate > 0.7) ? "同一浓度：促一方抑另一方" : "以促进为主"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {scene === "apical"
            ? "顶端优势：顶芽产生的生长素向下运输，在侧芽处积累成“高浓度”——顶芽生长、侧芽受抑。摘除顶芽（打顶）可解除抑制促进侧枝发育。"
            : scene === "geo"
              ? "根的向地性：重力使近地侧生长素分布多，根对高浓度敏感——近地侧生长被抑制，远地侧长得快，根弯向下生长。"
              : "生长素的作用具有两重性：低浓度促进生长，高浓度抑制生长。不同器官敏感度不同（根 > 芽 > 茎），同一浓度对根是“高浓度”、对茎却可能是“低浓度”。"}
        </p>
      </div>
    </>
  );
}
