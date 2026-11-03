import { useMemo, useState } from "react";
import type { SurveyConfig } from "@/data/remade/schema";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { seeded } from "./specimens";

// 野外调查框架：
// quadrat —— 随机布设样方，点样方数目标个体，估种群密度；
// markrecapture —— 捕获→标记→放回→再捕获，Lincoln 指数 N = M·n / m。
export function FieldSurvey({ config, title }: { config: SurveyConfig; title: string }) {
  const [round, setRound] = useState(0);
  return config.mode === "quadrat" ? (
    <QuadratMode key={round} config={config} title={title} onReset={() => setRound((r) => r + 1)} />
  ) : (
    <MarkRecapture key={round} config={config} title={title} onReset={() => setRound((r) => r + 1)} />
  );
}

function QuadratMode({ config, title, onReset }: { config: SurveyConfig; title: string; onReset: () => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [run, setRun] = useState(false);
  // 草地上 8×6 个样方格，每格随机 0-8 株（固定种子）
  const counts = useMemo(() => {
    const rand = seeded(2024);
    return Array.from({ length: 48 }, () => {
      const lo = config.params.min ?? 1;
      const hi = config.params.max ?? 8;
      return Math.floor(lo + rand() * (hi - lo + 1));
    });
  }, [config.params.min, config.params.max]);
  const plants = useMemo(() => {
    const rand = seeded(77);
    return counts.flatMap((c, qi) =>
      Array.from({ length: c }, (_, i) => {
        const col = qi % 8;
        const row = Math.floor(qi / 8);
        return { qi, x: 34 + col * 42 + 4 + rand() * 32, y: 44 + row * 42 + 4 + rand() * 32 };
      }),
    );
  }, [counts]);

  const pickedCounts = picked.map((i) => counts[i] ?? 0);
  const avg = picked.length ? pickedCounts.reduce((a, b) => a + b, 0) / picked.length : 0;
  const estTotal = Math.round(avg * 48);
  const trueTotal = counts.reduce((a, b) => a + b, 0);

  return (
    <>
      <Stage caption={`${title} · 8×6 样方格（每格 1 m²）`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <rect x="30" y="40" width="336" height="252" rx="6" fill="oklch(0.7 0.08 145 / 0.1)" stroke="var(--stage-foreground)" strokeOpacity="0.35" />
          {Array.from({ length: 48 }, (_, qi) => {
            const col = qi % 8;
            const row = Math.floor(qi / 8);
            const on = picked.includes(qi);
            return (
              <rect
                key={qi}
                x={34 + col * 42}
                y={44 + row * 42}
                width="36"
                height="36"
                rx="4"
                fill={on ? "var(--signal)" : "transparent"}
                fillOpacity={on ? 0.18 : 0}
                stroke={on ? "var(--signal)" : "var(--stage-foreground)"}
                strokeOpacity={on ? 0.9 : 0.15}
                onClick={() => {
                  if (picked.includes(qi)) setPicked((p) => p.filter((v) => v !== qi));
                  else if (picked.length < 10) setPicked((p) => [...p, qi]);
                }}
                className="cursor-pointer"
              />
            );
          })}
          {plants.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="oklch(0.55 0.13 145 / 0.9)" pointerEvents="none" />
          ))}
          <text x="200" y="312" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            {picked.length === 0 ? "点击样方取样（最多 10 格）" : `已取样方 ${picked.length} 格`}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" disabled={!picked.length || run} onClick={() => setRun(true)}>
            计算种群密度
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPicked([]);
              setRun(false);
            }}
          >
            重选样方
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="样方数" value={picked.length} />
          <Readout label="各样方计数" value={pickedCounts.join("、") || "—"} />
          <Readout label="平均密度（株/m²）" value={avg ? avg.toFixed(1) : "—"} tone={run && avg ? "good" : undefined} />
          <Readout label="估算总数量（48 m²）" value={run ? estTotal : "—"} tone={run ? "good" : undefined} />
        </div>
        {run && (
          <p className="rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground">
            估算 {estTotal} 株 · 实际 {trueTotal} 株（误差 {Math.abs(estTotal - trueTotal) / trueTotal < 0.15 ? "＜15%，符合调查要求" : "偏大——样方要随机布设、数量适当增多"}）。样方法的关键：随机取样、样方数量足够、调查对象是活动能力弱的个体。
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
        <Button variant="ghost" size="sm" className="w-full" onClick={onReset}>
          换一块草地重测
        </Button>
      </div>
    </>
  );
}

function MarkRecapture({ config, title, onReset }: { config: SurveyConfig; title: string; onReset: () => void }) {
  const [phase, setPhase] = useState(0); // 0 未开始 1 已标记放回 2 已再捕获
  const total = config.params.total ?? 120;
  const marked = config.params.marked ?? 30;
  const [again, setAgain] = useState(0);
  const [recap, setRecap] = useState<number[]>([]); // 再捕获中的个体 id，<marked 表示带标记
  const pond = useMemo(() => {
    const rand = seeded(9);
    return Array.from({ length: total }, (_, i) => ({ id: i, x: 30 + rand() * 340, y: 46 + rand() * 240, a: rand() * Math.PI * 2 }));
  }, [total]);

  const est = recap.length ? Math.round((marked * again) / Math.max(1, recap.filter((r) => r < marked).length)) : 0;
  const errPct = est ? Math.abs(est - total) / total : 0;

  return (
    <>
      <Stage caption={`${title} · 池塘 ${total} 尾${config.target}（未知）`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <rect x="16" y="32" width="368" height="262" rx="14" fill="oklch(0.6 0.1 230 / 0.12)" stroke="var(--membrane)" />
          {pond.map((f) => {
            const isMarked = f.id < marked;
            const captured = phase === 2 && recap.includes(f.id);
            return (
              <g key={f.id} transform={`translate(${f.x} ${f.y}) rotate(${(f.a * 180) / Math.PI})`} opacity={captured ? 1 : phase === 1 && isMarked ? 1 : 0.8}>
                <path d="M-9 0 q 9 -5, 16 0 q -7 5, -16 0 Z" fill={captured ? "var(--signal)" : isMarked && phase >= 1 ? "oklch(0.68 0.16 25)" : "oklch(0.6 0.1 230)"} />
                <circle cx="-10" cy="0" r="2.4" fill="var(--stage-foreground)" />
                {isMarked && phase >= 1 && <circle cx="0" cy="0" r="2.2" fill="oklch(0.15 0.02 240)" />}
              </g>
            );
          })}
          <text x="200" y="312" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            {phase === 0 ? "第一步：捕获并标记部分个体" : phase === 1 ? "第二步：充分混合后再次捕获" : `N ≈ M×n/m = ${marked}×${again}/${recap.filter((r) => r < marked).length}`}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          {phase === 0 && (
            <Button className="flex-1" onClick={() => setPhase(1)}>
              捕获 {marked} 尾并标记放回
            </Button>
          )}
          {phase === 1 && (
            <Button
              className="flex-1"
              onClick={() => {
                const rand = seeded(Date.now() % 100000);
                const n = 20 + Math.floor(rand() * 15);
                setAgain(n);
                setRecap(Array.from({ length: n }, () => Math.floor(rand() * total)));
                setPhase(2);
              }}
            >
              再捕一网
            </Button>
          )}
          {phase === 2 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPhase(0);
                setRecap([]);
                setAgain(0);
              }}
            >
              重新调查
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="标记数 M" value={phase >= 1 ? marked : "—"} />
          <Readout label="再捕获 n" value={phase === 2 ? again : "—"} />
          <Readout label="其中带标记 m" value={phase === 2 ? recap.filter((r) => r < marked).length : "—"} />
          <Readout label="估算种群 N" value={est || "—"} tone={est && errPct < 0.2 ? "good" : undefined} />
        </div>
        {phase === 2 && (
          <p className="rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground">
            估算 {est} 尾，真实 {total} 尾（误差 {(errPct * 100).toFixed(0)}%）。标志重捕法前提：标记不脱落、标记个体与未标记个体混合均匀、调查期间无大量迁入迁出 birthdeath——适用于活动能力强的动物。
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
        <Button variant="ghost" size="sm" className="w-full" onClick={onReset}>
          换一个种群重测
        </Button>
      </div>
    </>
  );
}
