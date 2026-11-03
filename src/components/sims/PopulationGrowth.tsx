import { useRef, useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// N(t)：J 型 N₀·e^(rt)；S 型 K / (1 + e^(-r(t-t₀)))，t₀ = ln((K-N₀)/N₀)/r
export function PopulationGrowth() {
  const [model, setModel] = useState<"j" | "s" | "both">("both");
  const [K, setK] = useState(200);
  const [r, setR] = useState(0.4);
  const [running, setRunning] = useState(false);
  const [, force] = useState(0);
  const tRef = useRef(0);

  const N0 = 4;
  const t0 = Math.log((K - N0) / N0) / r;
  const Nj = (t: number) => Math.min(520, N0 * Math.exp(r * t));
  const Ns = (t: number) => K / (1 + Math.exp(-r * (t - t0)));

  useFrame((dt) => {
    if (!running) return;
    tRef.current = Math.min(26, tRef.current + dt * 2.4);
    force((v) => v + 1);
  });

  const t = tRef.current;
  const curve = (f: (t: number) => number) =>
    Array.from({ length: 66 }, (_, i) => {
      const x = 176 + (i / 65) * 200;
      const y = 244 - (f(i / 65 * 26) / 520) * 184;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");

  // 酵母菌点阵（S 型当前值）
  const nCur = Math.round(Ns(t));
  const dots = Array.from({ length: 120 }, (_, i) => i < (nCur / 520) * 120);
  const slope = Ns(t + 0.1) - Ns(t); // dN/dt 近似
  const atK2 = t > t0 - 0.4 && t < t0 + 0.4;

  return (
    <>
      <Stage caption="种群增长：理想条件 J 型 vs 有限环境 S 型（逻辑斯蒂）">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 左：培养液点阵 */}
          <rect x="20" y="30" width="132" height="216" rx="10" fill="oklch(0.7 0.08 95 / 0.06)" stroke="var(--stage-foreground)" strokeOpacity="0.35" />
          <text x="86" y="22" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            培养液中的酵母菌
          </text>
          {dots.map((on, i) => {
            const col = i % 8;
            const row = Math.floor(i / 8);
            return (
              <circle
                key={i}
                cx={34 + col * 14}
                cy={48 + row * 24}
                r="5"
                fill={on ? "oklch(0.75 0.12 95 / 0.85)" : "oklch(0.5 0.02 95 / 0.15)"}
              />
            );
          })}
          <text x="86" y="270" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            N ≈ {nCur}
          </text>
          {/* 右：曲线 */}
          <g>
            <rect x="172" y="56" width="208" height="190" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
            <line x1="172" y1={244 - (K / 520) * 184} x2="380" y2={244 - (K / 520) * 184} stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeDasharray="4 3" />
            <text x="376" y={240 - (K / 520) * 184} fontSize="9" textAnchor="end" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
              K = {K}（环境容纳量）
            </text>
            {(model === "j" || model === "both") && <path d={curve(Nj)} stroke="oklch(0.7 0.13 25)" strokeWidth="2.2" fill="none" />}
            {(model === "s" || model === "both") && <path d={curve(Ns)} stroke="oklch(0.62 0.14 260)" strokeWidth="2.2" fill="none" />}
            {/* 当前点 */}
            <circle cx={176 + (t / 26) * 200} cy={244 - (Ns(t) / 520) * 184} r="4.6" fill="white" stroke="oklch(0.62 0.14 260)" strokeWidth="2.4" />
            <circle cx={176 + (t / 26) * 200} cy={244 - (Nj(t) / 520) * 184} r="4.6" fill="white" stroke="oklch(0.7 0.13 25)" strokeWidth="2.4" />
            {atK2 && (
              <text x="290" y="140" fontSize="9" fill="var(--signal)" fontFamily="var(--font-mono)">
                ← K/2：增长最快（渔业捕捞点）
              </text>
            )}
            <text x="276" y="270" fontSize="9" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
              ● S 型（蓝紫） ● J 型（橙） · t = {t.toFixed(1)}
            </text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={[
            { value: "both", label: "对比" },
            { value: "j", label: "仅 J 型" },
            { value: "s", label: "仅 S 型" },
          ]}
          value={model}
          onChange={(v) => setModel(v as typeof model)}
        />
        <Control label="环境容纳量 K" value={K} min={50} max={400} step={10} onChange={setK} />
        <Control label="增长率 r" value={Number(r.toFixed(2))} min={0.1} max={0.8} step={0.05} onChange={setR} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRunning((v) => !v)}>
            {running ? "暂停" : t >= 26 ? "已结束" : "逐代增长"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false);
              tRef.current = 0;
            }}
          >
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="当前数量 N" value={nCur} />
          <Readout label="增长速率 dN/dt" value={slope.toFixed(1)} tone={atK2 ? "good" : undefined} />
          <Readout label="阶段" value={t < t0 * 0.7 ? "加速期" : atK2 ? "K/2 增长最快" : "减速→稳定"} />
          <Readout label="J 型是否受限" value={model === "j" ? "否（理想条件）" : "是（资源有限）"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {model === "j"
            ? "J 型增长（如种群迁入新环境的初期）：食物空间充裕、无敌害，λ 固定，种群数量每年以一定倍数增长——但自然界不可能长期维持。"
            : "S 型增长：随种群密度上升，食物、空间、天敌等环境阻力增大，增长速率在 K/2 处最大，随后下降，最终稳定在 K 值附近。有害生物防治要早、渔业捕捞留 K/2。"}
        </p>
      </div>
    </>
  );
}
