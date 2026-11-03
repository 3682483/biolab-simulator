import { useMemo, useState } from "react";
import type { ApparatusConfig } from "@/data/remade/schema";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";

// 装置条件实验框架：每个实验条件是一组分段开关，
// 当前组合查出对应结果与结论；舞台画出条件装置盒 + 结果指示。
export function ApparatusLab({ config, title }: { config: ApparatusConfig; title: string }) {
  const [picks, setPicks] = useState<number[]>(config.factors.map(() => 0));
  const [run, setRun] = useState(false);

  const key = picks.join("-");
  const outcome = (run && config.outcomes[key]) || config.fallback;
  const isDefault = useMemo(() => picks.every((p) => p === 0), [picks]);

  const w = 360 / config.factors.length;
  return (
    <>
      <Stage caption={`${title} · 装置示意`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 实验台 */}
          <line x1="20" y1="262" x2="380" y2="262" stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeWidth="2" />
          {/* 条件装置盒 */}
          {config.factors.map((f, fi) => {
            const x = 20 + fi * w + 8;
            const iw = w - 16;
            const opt = f.options[picks[fi] ?? 0] ?? f.options[0]!;
            return (
              <g key={f.id}>
                <rect x={x} y="40" width={iw} height="150" rx="10" fill="oklch(0.7 0.06 220 / 0.08)" stroke="var(--membrane)" />
                <text x={x + iw / 2} y="60" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
                  {f.label}
                </text>
                {/* 选项示意：几何图形随选项变化 */}
                <circle cx={x + iw / 2} cy="100" r="18" fill={fi === 0 ? "var(--specimen)" : "var(--signal)"} fillOpacity={opt.includes("无") || opt.includes("遮") ? 0.15 : 0.7} stroke="var(--stage-foreground)" strokeOpacity="0.5" />
                <text x={x + iw / 2} y="150" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {opt}
                </text>
              </g>
            );
          })}
          {/* 结果区 */}
          <rect x="20" y="208" width="360" height="42" rx="8" fill={run ? "var(--signal)" : "oklch(0.7 0.06 220 / 0.1)"} fillOpacity={run ? 0.14 : 1} stroke="var(--stage-foreground)" strokeOpacity="0.3" />
          <text x="200" y="234" fontSize="12" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
            {run ? `结果：${outcome.result}` : "调整条件后点击「进行实验」"}
          </text>
          <text x="200" y="290" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            {isDefault ? "当前为对照组（各条件取第一项）" : "实验组：与对照组的差异即自变量"}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        {config.factors.map((f, fi) => (
          <div key={f.id}>
            <div className="mb-1.5 text-sm text-muted-foreground">{f.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {f.options.map((o, oi) => (
                <Button
                  key={o}
                  size="sm"
                  variant={picks[fi] === oi ? "default" : "outline"}
                  onClick={() => {
                    setPicks((p) => p.map((v, i) => (i === fi ? oi : v)));
                    setRun(false);
                  }}
                >
                  {o}
                </Button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRun(true)}>
            进行实验
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPicks(config.factors.map(() => 0));
              setRun(false);
            }}
          >
            重置对照组
          </Button>
        </div>
        {run && (
          <div className="rounded-md border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">结论 · </span>
            {outcome.verdict}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Readout label="实验条件组合" value={`${picks.map((p, fi) => config.factors[fi]?.options[p]).filter(Boolean).join(" / ") || "—"}`} />
          <Readout label="自变量组数" value={config.factors.map((f) => f.options.length).join("×")} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
      </div>
    </>
  );
}
