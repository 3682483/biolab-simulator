import { useMemo, useRef, useState } from "react";
import type { ObserveConfig } from "@/data/remade/schema";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { SPECIMENS, seeded } from "./specimens";

// 观察台：模拟显微镜操作——放大倍数切换、细准焦螺旋调焦、载物台移动视野。
// 倍率越高视野越暗（真实显微镜规律），标注列表点击高亮对应结构。
export function ObserveScope({ config, title }: { config: ObserveConfig; title: string }) {
  const [zoom, setZoom] = useState(1); // 0.6 / 1 / 1.8 相对基准
  const [focus, setFocus] = useState(50); // 0-100，50 为准焦面
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const spec = SPECIMENS[config.specimen] ?? SPECIMENS["onion-epidermis"]!;
  const sharp = 1 - Math.min(1, Math.abs(focus - 50) / 50); // 离焦 → 0
  const dim = 1 - (zoom - 0.6) * 0.22; // 高倍视野更暗
  const content = useMemo(() => spec.draw(seeded(42)), [spec]);

  const blur = (1 - sharp) * 6;

  return (
    <>
      <Stage caption={`${spec.name} · ${title}`}>
        <div
          className="relative aspect-[4/3] w-full cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setPan({
              x: Math.max(-80, Math.min(80, e.clientX - drag.current.x)),
              y: Math.max(-60, Math.min(60, e.clientY - drag.current.y)),
            });
          }}
          onPointerUp={() => (drag.current = null)}
        >
          <svg viewBox="0 0 400 320" className="h-full w-full">
            {/* 视野底色 */}
            <rect width="400" height="320" fill="oklch(0.22 0.02 240 / 0.95)" />
            <circle cx="200" cy="160" r="150" fill={spec.ground} opacity={dim} />
            <g style={{ filter: `blur(${blur}px)` }} transform={`translate(${200 + pan.x * zoom} ${160 + pan.y * zoom}) scale(${zoom}) translate(-200 -160)`} opacity={dim}>
              {content}
            </g>
            {/* 十字准线 */}
            <path d="M200 140 v40 M180 160 h40" stroke="oklch(0.9 0.02 240 / 0.35)" strokeWidth="1" />
          </svg>
          {blur > 2.5 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-md bg-black/50 px-3 py-1 text-xs text-white/85" style={{ fontFamily: "var(--font-mono)" }}>
                像模糊——转动细准焦螺旋
              </span>
            </div>
          )}
        </div>
      </Stage>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant={zoom === 0.6 ? "default" : "outline"} onClick={() => setZoom(0.6)}>
            10×
          </Button>
          <Button variant={zoom === 1 ? "default" : "outline"} onClick={() => setZoom(1)}>
            40×
          </Button>
          <Button variant={zoom === 1.8 ? "default" : "outline"} onClick={() => setZoom(1.8)}>
            100×（油镜）
          </Button>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => {
              setPan({ x: 0, y: 0 });
              setFocus(50);
            }}
          >
            载物台复位
          </Button>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">细准焦螺旋</span>
            <span className="font-mono tabular-nums text-foreground">{sharp > 0.92 ? "准焦" : `${Math.round(sharp * 100)}% 清晰`}</span>
          </div>
          <input type="range" min={0} max={100} step={1} value={focus} onChange={(e) => setFocus(Number(e.target.value))} className="w-full accent-current" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="总放大倍数" value={`${Math.round(zoom * 400)}×`} tone={sharp > 0.92 ? "good" : undefined} />
          <Readout label="视野亮度" value={`${Math.round(dim * 100)}%`} tone={dim < 0.7 ? "warn" : undefined} />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">结构识别（点击核对观察要点）</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {config.labels.map((l) => (
              <button
                key={l.name}
                onClick={() => setActive(active === l.name ? null : l.name)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${active === l.name ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:border-foreground/40"}`}
              >
                {l.name}
              </button>
            ))}
          </div>
          {active && (
            <p className="mt-2 rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground">
              {config.labels.find((l) => l.name === active)?.desc}
            </p>
          )}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
      </div>
    </>
  );
}
