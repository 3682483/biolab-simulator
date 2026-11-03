import { useMemo, useState } from "react";
import type { InquiryConfig } from "@/data/remade/schema";
import { Control, Readout, Stage } from "@/components/lab-ui";

// 变量探究框架：拖动自变量滑杆，多条响应曲线实时联动，
// 舞台绘制坐标系 + 曲线族 + 当前工作点。
const PAD = { l: 46, r: 16, t: 24, b: 34 };
const CURVE_COLORS = ["oklch(0.62 0.14 260)", "oklch(0.68 0.14 25)", "oklch(0.6 0.14 145)", "oklch(0.65 0.13 310)"];

export function InquiryLab({ config, title }: { config: InquiryConfig; title: string }) {
  const [x, setX] = useState(Math.round((config.x.min + config.x.max) / 2));
  const ys = config.curves.map((c) => c.fn(x));
  const yMax = Math.max(
    1,
    ...useMemo(
      () =>
        config.curves.flatMap((c) => {
          const pts: number[] = [];
          for (let v = config.x.min; v <= config.x.max; v += config.x.step) pts.push(c.fn(v));
          return pts;
        }),
      [config],
    ),
  );
  const px = (v: number) => PAD.l + ((v - config.x.min) / (config.x.max - config.x.min)) * (400 - PAD.l - PAD.r);
  const py = (v: number) => 320 - PAD.b - (Math.max(0, v) / yMax) * (320 - PAD.t - PAD.b);

  const step = config.x.step >= 1 ? 1 : config.x.step;
  const xTicks = Math.min(9, Math.round((config.x.max - config.x.min) / Math.max(step, (config.x.max - config.x.min) / 9)));

  return (
    <>
      <Stage caption={`${title} · 自变量 → 因变量`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 网格 */}
          {Array.from({ length: xTicks + 1 }, (_, i) => {
            const v = config.x.min + ((config.x.max - config.x.min) * i) / xTicks;
            return (
              <g key={i}>
                <line x1={px(v)} y1={PAD.t} x2={px(v)} y2={320 - PAD.b} stroke="var(--stage-foreground)" strokeOpacity="0.08" />
                <text x={px(v)} y={312} fontSize="8.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
                  {Number.isInteger(v) ? v : v.toFixed(1)}
                </text>
              </g>
            );
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <text key={f} x={PAD.l - 6} y={py(yMax * f) + 3} fontSize="8.5" textAnchor="end" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
              {(yMax * f).toFixed(0)}
            </text>
          ))}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={320 - PAD.b} stroke="var(--stage-foreground)" strokeOpacity="0.4" />
          <line x1={PAD.l} y1={320 - PAD.b} x2={400 - PAD.r} y2={320 - PAD.b} stroke="var(--stage-foreground)" strokeOpacity="0.4" />
          {/* 曲线族 */}
          {config.curves.map((c, ci) => {
            const d: string[] = [];
            for (let v = config.x.min; v <= config.x.max + 1e-9; v += config.x.step) d.push(`${d.length === 0 ? "M" : "L"}${px(v).toFixed(1)} ${py(c.fn(v)).toFixed(1)}`);
            const col = CURVE_COLORS[ci % CURVE_COLORS.length]!;
            return (
              <g key={c.label}>
                <path d={d.join(" ")} fill="none" stroke={col} strokeWidth="2.2" />
                <circle cx={px(x)} cy={py(c.fn(x))} r="5" fill={col} />
                <text x={px(x) + 9} y={py(c.fn(x)) - 7} fontSize="9" fill={col} fontFamily="var(--font-mono)">
                  {c.fn(x).toFixed(1)}
                </text>
              </g>
            );
          })}
          {/* 工作点竖线 */}
          <line x1={px(x)} y1={PAD.t} x2={px(x)} y2={320 - PAD.b} stroke="var(--signal)" strokeWidth="1.4" strokeDasharray="4 3" />
          <text x={384} y={16} fontSize="9" textAnchor="end" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            {config.curves.length > 1 ? `${config.yLabel}（多组对比）` : config.yLabel}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label={config.x.label} value={x} min={config.x.min} max={config.x.max} step={config.x.step} unit={config.x.unit} onChange={setX} />
        {config.curves.length > 1 && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {config.curves.map((c, ci) => (
              <span key={c.label} className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full" style={{ background: CURVE_COLORS[ci % CURVE_COLORS.length] }} />
                {c.label}
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {config.curves.slice(0, 4).map((c) => (
            <Readout key={c.label} label={c.label} value={c.fn(x).toFixed(1)} tone={undefined} />
          ))}
        </div>
        {config.optimum && (
          <div className="rounded-md border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">最适点 · </span>
            {config.optimum}
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
      </div>
    </>
  );
}
