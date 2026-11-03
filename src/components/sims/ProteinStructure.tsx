import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

type Side = "hydrophobic" | "hydrophilic";
type Phase = "free" | "forming" | "formed";
/** 肽键依次点亮的时间间隔(秒) */
const DELAY = 0.28;
/** 脱去的水分子 */
type Water = { x: number; delay: number; gone: number };

export function ProteinStructure() {
  const [n, setN] = useState(4);
  const [side, setSide] = useState<Side>("hydrophobic");
  const [phase, setPhase] = useState<Phase>("free");
  const [, force] = useState(0);
  const waters = useRef<Water[]>([]);
  const ft = useRef(0);

  // 氨基酸横向排布参数
  const step = Math.min(62, 344 / n);
  const halfW = Math.min(20, step / 2 - 9);
  const cx = (i: number) => 200 + (i - (n - 1) / 2) * step;

  const startBond = () => {
    const arr: Water[] = [];
    for (let i = 0; i < n - 1; i++) arr.push({ x: (cx(i) + cx(i + 1)) / 2, delay: i * DELAY, gone: 0 });
    waters.current = arr;
    ft.current = 0;
    setPhase("forming");
  };
  const reset = () => {
    waters.current = [];
    setPhase("free");
  };

  // 脱水缩合动画:相邻肽键逐个点亮,水分子依次飞出
  useFrame((dt) => {
    ft.current += dt;
    let all = true;
    for (const w of waters.current) {
      const local = ft.current - w.delay;
      if (local <= 0) {
        all = false;
        continue;
      }
      w.gone = Math.min(1, local / 1.1);
      if (w.gone < 1) all = false;
    }
    force((v) => v + 1);
    if (all) setPhase("formed");
  }, phase === "forming");

  const bondDone = (i: number) => phase === "formed" || (phase === "forming" && ft.current >= i * DELAY);
  const bonds = phase === "free" ? 0 : phase === "formed" ? n - 1 : Math.min(n - 1, Math.floor(ft.current / DELAY) + 1);
  const mass = 128 * n - 18 * bonds;

  return (
    <>
      <Stage caption="脱水缩合:一个氨基酸的羧基与另一个的氨基脱去一分子水,形成肽键">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <text x="14" y="112" fontSize="8.5" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            上:N 氨基 / C 羧基 · 下:R 基
          </text>
          {/* 氨基酸序列 */}
          {Array.from({ length: n }, (_, i) => {
            const x = cx(i);
            return (
              <g key={i}>
                {/* 中心碳 */}
                <rect
                  x={x - halfW}
                  y={136}
                  width={halfW * 2}
                  height={28}
                  rx={7}
                  fill="oklch(0.74 0.06 90 / 0.55)"
                  stroke="var(--stage-foreground)"
                  strokeOpacity={0.35}
                />
                <text x={x} y={155} textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  C
                </text>
                {/* 氨基(蓝)与羧基(红) */}
                <circle cx={x - halfW + 5} cy={127} r={5} fill="oklch(0.62 0.12 240)" />
                <text x={x - halfW + 5} y={130} textAnchor="middle" fontSize="7" fill="oklch(0.97 0.01 240)" fontFamily="var(--font-mono)">
                  N
                </text>
                <circle cx={x + halfW - 5} cy={127} r={5} fill="oklch(0.62 0.14 25)" />
                <text x={x + halfW - 5} y={130} textAnchor="middle" fontSize="7" fill="oklch(0.97 0.02 25)" fontFamily="var(--font-mono)">
                  C
                </text>
                {/* R 基:疏水为烃链尾,亲水为极性头部 */}
                {side === "hydrophobic" ? (
                  <path
                    d={i % 2 === 0 ? `M${x} 164 l0 8 l7 9` : `M${x} 164 l0 8 l-7 9`}
                    stroke="oklch(0.52 0.09 55)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : (
                  <g>
                    <line x1={x} y1={164} x2={x} y2={173} stroke="oklch(0.6 0.13 230)" strokeWidth={2.5} strokeLinecap="round" />
                    <circle cx={x} cy={179} r={5.5} fill="oklch(0.62 0.13 230)" />
                    <circle cx={x} cy={179} r={1.6} fill="oklch(0.95 0.02 230)" />
                  </g>
                )}
              </g>
            );
          })}
          {/* 肽键 */}
          {Array.from({ length: n - 1 }, (_, i) =>
            bondDone(i) ? (
              <line
                key={`b${i}`}
                x1={cx(i) + halfW}
                x2={cx(i + 1) - halfW}
                y1={150}
                y2={150}
                stroke="var(--signal)"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            ) : null,
          )}
          {phase === "formed" && n <= 6 && (
            <text x={(cx(0) + cx(1)) / 2} y={178} textAnchor="middle" fontSize="8.5" fill="var(--signal)" fontFamily="var(--font-mono)">
              肽键
            </text>
          )}
          {/* 脱去的水分子(飞出并淡出) */}
          {phase === "forming" &&
            waters.current.map((w, i) =>
              w.gone > 0 && w.gone < 1 ? (
                <g key={`w${i}`} opacity={1 - w.gone}>
                  <circle cx={w.x} cy={150 - w.gone * 64} r={4} fill="oklch(0.7 0.12 230)" />
                  <circle cx={w.x - 4.5} cy={150 - w.gone * 64 - 4} r={2.4} fill="oklch(0.8 0.06 230)" />
                  <circle cx={w.x + 4.5} cy={150 - w.gone * 64 - 4} r={2.4} fill="oklch(0.8 0.06 230)" />
                </g>
              ) : null,
            )}
          <text x="200" y="216" textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            {phase === "free" ? "游离氨基酸" : phase === "forming" ? "脱水缩合进行中…" : `${n} 肽(含 ${n - 1} 个肽键)`}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control
          label="氨基酸数目 n"
          value={n}
          min={2}
          max={10}
          onChange={(v) => {
            setN(v);
            reset();
          }}
        />
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">R 基组合</div>
          <Segmented
            value={side}
            onChange={setSide}
            options={[
              { value: "hydrophobic", label: "疏水侧链" },
              { value: "hydrophilic", label: "亲水侧链" },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={startBond} disabled={phase !== "free"}>
            {phase === "free" ? "形成肽键" : phase === "forming" ? "脱水缩合中…" : "肽链已形成"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Readout label="肽键数" value={bonds} tone={bonds > 0 ? "good" : undefined} />
          <Readout label="脱水数" value={bonds} />
          <Readout label="相对分子质量" value={mass} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {phase === "free"
            ? "每个氨基酸至少有一个氨基和一个羧基且连在同一个中心碳上;点击「形成肽键」观察脱水缩合。"
            : phase === "forming"
              ? "相邻氨基酸的 −COOH 与 −NH₂ 脱去一分子水,以肽键(−CO−NH−)相连。"
              : `${n} 个氨基酸缩合成 ${n} 肽,共 ${n - 1} 个肽键、脱去 ${n - 1} 分子水,相对分子质量 128×${n} − 18×${n - 1} = ${mass}。${
                  side === "hydrophobic" ? "疏水侧链避水,多折叠在肽链内部。" : "亲水侧链易与水结合,多暴露在肽链表面。"
                }`}
        </p>
      </div>
    </>
  );
}
