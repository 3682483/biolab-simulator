import { useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 周期时钟：间期合计 75%（G₁/S/G₂ 深浅递进），分裂期 25%（前中后末），总时长按 22 h 折算
const SEGS = [
  { key: "g1", name: "G₁", full: "G₁ 期", frac: 0.3, color: "oklch(0.72 0.07 160 / 0.4)", note: "合成 RNA 和蛋白质，细胞体积增大，为染色体复制做准备。" },
  { key: "s", name: "S", full: "S 期", frac: 0.28, color: "oklch(0.62 0.09 160 / 0.56)", note: "DNA 复制，数目加倍；每条染色体含两条姐妹染色单体。" },
  { key: "g2", name: "G₂", full: "G₂ 期", frac: 0.17, color: "oklch(0.5 0.1 160 / 0.66)", note: "合成纺锤体微管蛋白等，为进入分裂期做最后准备。" },
  { key: "p", name: "前", full: "M 期 · 前期", frac: 0.09, color: "oklch(0.75 0.1 25 / 0.5)", note: "染色质螺旋化为染色体，核膜核仁解体，纺锤体出现。" },
  { key: "m", name: "中", full: "M 期 · 中期", frac: 0.07, color: "oklch(0.65 0.11 25 / 0.64)", note: "着丝粒排列在赤道板上，染色体形态最清晰。" },
  { key: "a", name: "后", full: "M 期 · 后期", frac: 0.05, color: "oklch(0.55 0.12 25 / 0.76)", note: "着丝粒分裂，姐妹染色单体分开移向细胞两极。" },
  { key: "t", name: "末", full: "M 期 · 末期", frac: 0.04, color: "oklch(0.45 0.1 25 / 0.62)", note: "核膜核仁重建，细胞板或缢裂形成两个子细胞。" },
] as const;

const CX = 200;
const CY = 150;
const R = 95;
// 极坐标：frac 0 起于正上方，顺时针
const pol = (r: number, f: number): [number, number] => {
  const a = f * 2 * Math.PI - Math.PI / 2;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const arc = (r: number, f0: number, f1: number) => {
  const [x0, y0] = pol(r, f0);
  const [x1, y1] = pol(r, f1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${f1 - f0 > 0.5 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};
// 中文按固定字数折行
const wrap = (s: string, n = 14): string[] => {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out.slice(0, 4);
};

export function CellCycle() {
  const [t, setT] = useState(0.02); // 周期进度 0–1
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(1);
  useFrame((dt) => setT((v) => (v + dt * 0.02 * speed) % 1), play);

  // 当前弧段
  let acc = 0;
  let idx = SEGS.length - 1;
  for (let i = 0; i < SEGS.length; i++) {
    acc += SEGS[i]!.frac;
    if (t < acc) {
      idx = i;
      break;
    }
  }
  const seg = SEGS[idx]!;
  const noteLines = wrap(seg.note);
  const [px, py] = pol(R, t);

  return (
    <>
      <Stage caption="分裂间期 ≈ 75% · 分裂期(M) ≈ 25% · 一个周期 22 h">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <circle cx={CX} cy={CY} r={R + 14} fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.15" />
          {/* 弧段累计绘制 */}
          {(() => {
            let f0 = 0;
            return SEGS.map((s) => {
              const d = arc(R, f0, f0 + s.frac);
              f0 += s.frac;
              return <path key={s.key} d={d} fill="none" stroke={s.color} strokeWidth="22" />;
            });
          })()}
          {/* 弧段分界刻度 */}
          {(() => {
            let f0 = 0;
            return SEGS.slice(1).map((s) => {
              f0 += SEGS[SEGS.indexOf(s) - 1]!.frac;
              const [tx, ty] = pol(R - 13, f0);
              const [ux, uy] = pol(R + 13, f0);
              return <line key={`tick-${s.key}`} x1={tx} y1={ty} x2={ux} y2={uy} stroke="var(--stage-foreground)" strokeOpacity="0.35" strokeWidth="1" />;
            });
          })()}
          {/* 弧段外标签 */}
          {(() => {
            let f0 = 0;
            return SEGS.map((s) => {
              const mid = f0 + s.frac / 2;
              f0 += s.frac;
              const [lx, ly] = pol(R + 26, mid);
              return (
                <text key={`lab-${s.key}`} x={lx} y={ly + 3.5} fontSize={s.frac > 0.1 ? 11 : 9} textAnchor="middle" fill="var(--stage-foreground)" fillOpacity="0.75" fontFamily="var(--font-mono)">
                  {s.name}
                </text>
              );
            });
          })()}
          {/* 指针 */}
          <line x1={CX} y1={CY} x2={px} y2={py} stroke="var(--signal)" strokeWidth="2" />
          <circle cx={px} cy={py} r="5" fill="var(--signal)" />
          <circle cx={CX} cy={CY} r="3" fill="var(--stage-foreground)" />
          {/* 中央：当前期名称与事件 */}
          <text x={CX} y="112" fontSize="16" fontWeight="600" textAnchor="middle" fill="var(--stage-foreground)">
            {seg.full}
          </text>
          {noteLines.map((l, i) => (
            <text key={i} x={CX} y={132 + i * 14} fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" fillOpacity="0.75">
              {l}
            </text>
          ))}
          <text x={CX} y={200} fontSize="12" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">
            {(t * 22).toFixed(1)} h / 22 h
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setPlay((p) => !p)}>
            {play ? "暂停" : "播放"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPlay(false);
              setT(0.02);
            }}
          >
            重置
          </Button>
        </div>
        <Control label="指针转速" value={speed} unit="×" min={0.5} max={4} step={0.5} onChange={setSpeed} />
        <Segmented
          options={[
            { value: "g1", label: "G₁" },
            { value: "s", label: "S" },
            { value: "g2", label: "G₂" },
            { value: "m", label: "M 期" },
          ]}
          value={t < 0.3 ? "g1" : t < 0.58 ? "s" : t < 0.75 ? "g2" : "m"}
          onChange={(v) => {
            setPlay(false);
            const start = v === "g1" ? 0.001 : v === "s" ? 0.301 : v === "g2" ? 0.581 : 0.751;
            setT(start);
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          <Readout label="已进行时间" value={`${(t * 22).toFixed(1)} h`} />
          <Readout label="当前期时长" value={`${(seg.frac * 22).toFixed(1)} h`} />
          <Readout label="间期 : 分裂期" value="75 : 25" tone="good" />
        </div>
        <p className="min-h-12 text-sm leading-relaxed text-muted-foreground">
          {idx < 3
            ? `当前处于间期（${seg.full}，约占周期 ${(seg.frac * 100).toFixed(0)}%）。间期长，是为分裂期储备物质：S 期完成 DNA 复制，G₁/G₂ 期合成蛋白质，"分裂期短、表面变化剧烈"只是整个周期的尾声。`
            : `当前处于分裂期（${seg.full}）。M 期仅占周期约 25%，却完成染色体均分和胞质分裂；没有间期储备的 DNA 和蛋白质，分裂期无法正常进行。`}
        </p>
      </div>
    </>
  );
}
