import { useMemo, useRef, useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { useSmoothed } from "@/hooks/use-sim";

const FOCUS_TARGET = 62;

export function Microscope() {
  const [obj, setObj] = useState<4 | 10 | 40>(4);
  const [coarse, setCoarse] = useState(30);
  const [fine, setFine] = useState(0);
  const [light, setLight] = useState(55);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [warn, setWarn] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const mag = obj * 10;
  const tolerance = obj === 40 ? 1.5 : obj === 10 ? 4 : 8;
  const err = Math.abs(coarse + fine - FOCUS_TARGET);
  const blurTarget = Math.max(0, (err - tolerance * 0.3) / tolerance) * 3;
  const blur = useSmoothed(blurTarget, 10);
  const scale = useSmoothed(obj / 4, 6);
  const sx = useSmoothed(pos.x, 14);
  const sy = useSmoothed(pos.y, 14);
  const bright = 0.25 + (light / 100) * 1.1 - (obj === 40 ? 0.25 : 0);
  const sharp = blurTarget < 0.4;

  const cells = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; nx: number; ny: number }[] = [];
    for (let r = -6; r < 6; r++)
      for (let c = -4; c < 4; c++) {
        const off = r % 2 ? 30 : 0;
        const w = 60 + ((r * 7 + c * 13) % 9);
        out.push({ x: c * 64 + off, y: r * 26, w, h: 24, nx: 18 + ((r * 5 + c * 3) % 20), ny: 8 + ((r + c) % 3) * 3 });
      }
    return out;
  }, []);

  const changeObj = (o: 4 | 10 | 40) => {
    setObj(o);
    if (o === 40 && !sharp) setWarn("请先在低倍镜下对焦清晰，再转换高倍物镜");
    else setWarn(null);
  };
  const changeCoarse = (v: number) => {
    if (obj === 40) {
      setWarn("高倍镜下禁止使用粗准焦螺旋，以免压碎装片");
      return;
    }
    setWarn(null);
    setCoarse(v);
  };

  return (
    <>
      <Stage caption={`物镜 ${obj}× · 目镜 10× · 总放大 ${mag}×`}>
        <div
          className="flex aspect-[4/3] cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            drag.current = { x: e.clientX - pos.x * scale, y: e.clientY - pos.y * scale };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setPos({
              // microscope image is inverted: moving slide right moves the image left
              x: Math.max(-140, Math.min(140, (e.clientX - drag.current.x) / scale)),
              y: Math.max(-110, Math.min(110, (e.clientY - drag.current.y) / scale)),
            });
          }}
          onPointerUp={() => (drag.current = null)}
        >
          <svg viewBox="-200 -200 400 400" className="h-[86%] select-none">
            <defs>
              <clipPath id="field">
                <circle r="180" />
              </clipPath>
              <radialGradient id="vign">
                <stop offset="70%" stopColor="black" stopOpacity="0" />
                <stop offset="100%" stopColor="black" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <g clipPath="url(#field)">
              <circle r="180" fill="oklch(0.93 0.03 90)" style={{ filter: `brightness(${bright})` }} />
              <g
                style={{ filter: `blur(${blur}px) brightness(${bright})` }}
                transform={`scale(${scale}) translate(${sx} ${sy})`}
              >
                {cells.map((c, i) => (
                  <g key={i}>
                    <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="3" fill="oklch(0.88 0.06 20 / 0.55)" stroke="oklch(0.55 0.1 20)" strokeWidth={1.2 / scale} />
                    <ellipse cx={c.x + c.nx} cy={c.y + c.ny + 4} rx="4" ry="3" fill="oklch(0.45 0.12 330)" />
                  </g>
                ))}
              </g>
              <circle r="180" fill="url(#vign)" />
            </g>
            <circle r="180" fill="none" stroke="var(--stage-line)" strokeWidth="2" />
            <line x1="-8" x2="8" stroke="var(--stage-foreground)" strokeOpacity="0.25" />
            <line y1="-8" y2="8" stroke="var(--stage-foreground)" strokeOpacity="0.25" />
          </svg>
        </div>
      </Stage>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">物镜转换器</div>
          <Segmented
            value={obj}
            onChange={changeObj}
            options={[
              { value: 4, label: "4×" },
              { value: 10, label: "10×" },
              { value: 40, label: "40×" },
            ]}
          />
        </div>
        <Control label="粗准焦螺旋" value={coarse} min={0} max={100} onChange={changeCoarse} />
        <Control label="细准焦螺旋" value={fine} min={-6} max={6} step={0.1} onChange={setFine} />
        <Control label="光圈 / 反光镜亮度" value={light} unit="%" min={0} max={100} onChange={setLight} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="放大倍数" value={`${mag}×`} />
          <Readout label="物像" value={sharp ? "清晰" : "模糊"} tone={sharp ? "good" : "warn"} />
        </div>
        <p className="min-h-10 text-sm leading-relaxed text-signal">{warn ?? <span className="text-muted-foreground">拖动视野可移动装片（物像与装片移动方向相反）。</span>}</p>
      </div>
    </>
  );
}
