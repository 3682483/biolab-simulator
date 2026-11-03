import { useRef, useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 神经纤维电位：静息 -70mV，峰值 +30mV，刺激后双向传导
const X0 = 30, X1 = 370, BASE_Y = 120, SCALE = 0.6; // -70mV → y=162, +30 → y=120-30*...
const yOf = (mv: number) => 162 - (mv + 70) * SCALE; // -70→162, +30→102
const V_REST = -70;
const V_PEAK = 30;

// 波形：距刺激点距离决定相位
const waveAt = (x: number, stimX: number, t: number) => {
  const dist = Math.abs(x - stimX);
  const phase = t * 90 - dist; // 波前向外传播
  if (phase < 0 || phase > 70) return V_REST;
  if (phase < 18) return V_REST + (V_PEAK - V_REST) * (phase / 18); // 去极化（Na⁺ 内流）
  if (phase < 40) return V_PEAK - (V_PEAK - V_REST) * ((phase - 18) / 22); // 复极化（K⁺ 外流）
  return V_REST - 12 * Math.max(0, 1 - (phase - 40) / 30); // 轻微超极化后回落
};

export function ActionPotential() {
  const [phase, setPhase] = useState<"rest" | "depol" | "repol" | "full">("full");
  const [stimX, setStimX] = useState(200);
  const [, force] = useState(0);
  const tRef = useRef(-10); // 负值 = 未刺激
  const firing = useRef(false);

  useFrame((dt) => {
    if (firing.current) tRef.current += dt;
    force((v) => v + 1);
  });

  const fire = (x: number) => {
    setStimX(x);
    tRef.current = 0;
    firing.current = true;
  };

  // 波形序列（full 模式画传导曲线；其余画单个阶段示意）
  const t = tRef.current;
  const pts = Array.from({ length: 68 }, (_, i) => {
    const x = X0 + (i / 67) * (X1 - X0);
    const mv = phase === "full" ? waveAt(x, stimX, t) : phase === "rest" ? V_REST : phase === "depol" ? (Math.sin(t * 3) + 1) / 2 * (V_PEAK - V_REST) + V_REST : V_PEAK - (Math.sin(t * 3) + 1) / 2 * (V_PEAK - V_REST);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${yOf(mv).toFixed(1)}`;
  }).join(" ");

  const naFlow = phase === "full" && t > 0 && t < 1.6;
  const kFlow = phase === "full" && t >= 0.3 && t < 2.2;

  return (
    <>
      <Stage caption="神经纤维上的动作电位：静息外正内负 → 兴奋外负内正，双向传导">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 纤维截面示意（上） */}
          <g>
            <rect x={X0} y="18" width={X1 - X0} height="46" rx="10" fill="oklch(0.7 0.06 160 / 0.1)" stroke="var(--membrane)" strokeWidth="1.5" />
            <text x="40" y="14" fontSize="9.5" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              膜外
            </text>
            {/* Na⁺（膜外橙）K⁺（膜内蓝紫）粒子示意 */}
            {Array.from({ length: 14 }, (_, i) => (
              <circle key={`na${i}`} cx={X0 + 8 + i * 24 + (t * 60) % 24} cy="30" r="3" fill="oklch(0.7 0.13 25 / 0.8)" />
            ))}
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={`k${i}`} cx={X0 + 14 + i * 28} cy="54" r="3" fill="oklch(0.62 0.14 260 / 0.8)" />
            ))}
            {naFlow &&
              [stimX - 30, stimX, stimX + 30].map((x, i) => (
                <path key={i} d={`M${Math.max(X0, x)} 34 v14 m-3 -4 l3 4 l3 -4`} stroke="var(--signal)" strokeWidth="1.6" fill="none" opacity={0.9 - i * 0.25} />
              ))}
            {kFlow &&
              [stimX - 20, stimX + 20].map((x, i) => (
                <path key={`k${i}`} d={`M${Math.max(X0, x)} 52 v-12 m-3 4 l3 -4 l3 4`} stroke="oklch(0.62 0.14 260)" strokeWidth="1.6" fill="none" opacity="0.8" />
              ))}
          </g>
          {/* 电位曲线（下） */}
          <g>
            <line x1={X0} y1={yOf(0)} x2={X1} y2={yOf(0)} stroke="var(--stage-foreground)" strokeOpacity="0.25" strokeDasharray="3 3" />
            <line x1={X0} y1="162" x2={X1} y2="162" stroke="var(--stage-foreground)" strokeOpacity="0.35" />
            <path d={pts} stroke="var(--signal)" strokeWidth="2.4" fill="none" />
            <text x={X0} y="158" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              0 mV
            </text>
            <text x={X0} y="176" fontSize="9" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              静息 −70 mV
            </text>
            <text x={X1 - 4} y="98" fontSize="9" textAnchor="end" fill="var(--signal)" fontFamily="var(--font-mono)">
              峰值 +30 mV
            </text>
            <text x={stimX} y="200" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
              ↑ 刺激点
            </text>
          </g>
          <text x="200" y="300" fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            {phase === "full"
              ? t < 0
                ? "点击纤维任意位置施加刺激"
                : t < 1.6
                  ? "Na⁺ 通道开放内流 → 去极化，兴奋区向两侧传导"
                  : t < 2.2
                    ? "K⁺ 通道开放外流 → 复极化恢复静息电位"
                    : "电位已恢复静息状态，可再次刺激"
              : phase === "rest"
                ? "静息状态：K⁺ 外流维持外正内负的极化状态"
                : phase === "depol"
                  ? "去极化：刺激达阈值，Na⁺ 通道开放大量内流"
                  : "复极化：K⁺ 通道开放外流，膜电位恢复"}
          </text>
          {/* 点击刺激热区 */}
          <rect x={X0} y="14" width={X1 - X0} height="54" fill="transparent" className="cursor-pointer" onClick={(e) => {
            const rect = (e.target as SVGRectElement).getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            fire(X0 + ratio * (X1 - X0));
          }} />
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={[
            { value: "full", label: "完整传导" },
            { value: "rest", label: "静息电位" },
            { value: "depol", label: "去极化" },
            { value: "repol", label: "复极化" },
          ]}
          value={phase}
          onChange={(v) => setPhase(v as typeof phase)}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => fire(stimX)}>
            施加阈上刺激
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              firing.current = false;
              tRef.current = -10;
            }}
          >
            复位
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="静息电位" value="−70 mV" />
          <Readout label="峰值电位" value="+30 mV" tone="warn" />
          <Readout label="Na⁺ 内流" value={naFlow ? "进行中" : "—"} tone={naFlow ? "warn" : undefined} />
          <Readout label="传导特点" value="双向·不衰减" tone="good" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          静息时 K⁺ 外流形成“外正内负”；刺激达到阈值后 Na⁺ 通道开放大量内流，膜电位反转兴奋；随后 K⁺ 外流复极化。兴奋部位与邻近未兴奋部位形成局部电流，使动作电位沿纤维双向传导且幅度不衰减——“全或无”。
        </p>
      </div>
    </>
  );
}
