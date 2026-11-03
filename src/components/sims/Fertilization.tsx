import { useRef, useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

// 物种参数：配子 n / 受精卵 2n
const SPECIES = { human: { n: 23, label: "人类" }, drosophila: { n: 4, label: "果蝇" } } as const;
type Sp = keyof typeof SPECIES;

type Sperm = { x: number; y: number; v: number; phase: number; won: boolean; dead: boolean };

export function Fertilization() {
  const [sp, setSp] = useState<Sp>("human");
  const [running, setRunning] = useState(false);
  const [fused, setFused] = useState(false); // 精核已与卵核融合
  const [nucleusK, setNucleusK] = useState(0); // 融合动画进度 0–1
  const [, force] = useState(0);
  const sperms = useRef<Sperm[]>(
    Array.from({ length: 6 }, (_, i) => ({
      x: 20 + Math.random() * 50,
      y: 90 + i * 28 + Math.random() * 10,
      v: 26 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      won: false,
      dead: false,
    })),
  );
  const tRef = useRef(0);

  const egg = { x: 300, y: 160, r: 52 };
  const n = SPECIES[sp].n;

  useFrame((dt) => {
    tRef.current += dt;
    if (running) {
      const list = sperms.current;
      const winner = list.find((s) => s.won);
      if (!winner) {
        for (const s of list) {
          s.x += s.v * dt;
          s.y += Math.sin(tRef.current * 2 + s.phase) * 12 * dt;
          if (!s.dead && Math.hypot(s.x - (egg.x - egg.r - 8), s.y - egg.y) < 14) {
            if (list.some((w) => w.won)) s.dead = true; // 透明带反应：拒绝后来者
            else s.won = true;
          }
        }
        const first = list.find((s) => Math.hypot(s.x - egg.x, s.y - egg.y) < egg.r - 14);
        if (first) {
          first.won = true;
          list.forEach((s) => s !== first && (s.dead = true));
          setRunning(false);
        }
      } else if (!fused) {
        setFused(true);
      } else if (nucleusK < 1) {
        setNucleusK((v) => Math.min(1, v + dt * 1.2));
      }
    }
    force((v) => v + 1);
  });

  const reset = () => {
    sperms.current.forEach((s) => {
      s.x = 20 + Math.random() * 50;
      s.y = 90 + Math.random() * 140;
      s.won = false;
      s.dead = false;
    });
    setFused(false);
    setNucleusK(0);
    setRunning(false);
  };

  return (
    <>
      <Stage caption="受精作用：透明带反应保证单一精子入卵">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 卵细胞 + 透明带 */}
          <circle cx={egg.x} cy={egg.y} r={egg.r + 10} fill="none" stroke="var(--membrane)" strokeWidth="2" opacity={fused ? 1 : 0.45} strokeDasharray={fused ? undefined : "3 3"} />
          <circle cx={egg.x} cy={egg.y} r={egg.r} fill="oklch(0.7 0.06 160 / 0.1)" stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="1.5" />
          <circle cx={egg.x + 14} cy={egg.y - 12} r="26" fill="oklch(0.5 0.1 330 / 0.2)" opacity={nucleusK >= 1 ? 0 : 1} />
          {fused && nucleusK < 1 && (
            <circle cx={egg.x + 14 - 22 * nucleusK} cy={egg.y - 12 + 16 * nucleusK} r="10" fill="oklch(0.65 0.13 260 / 0.5)" />
          )}
          {nucleusK > 0 && (
            <circle cx={egg.x + 14 - 22 * nucleusK * 0.5} cy={egg.y - 4 + 8 * nucleusK} r={10 + 18 * nucleusK} fill="oklch(0.6 0.12 300 / 0.3)" stroke="var(--signal)" strokeWidth={nucleusK >= 1 ? 2 : 0.5} />
          )}
          <text x={egg.x} y={egg.y + egg.r + 24} fontSize="11" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            卵细胞 n = {n}
          </text>
          {/* 精子 */}
          {sperms.current.map((s, i) => {
            const tail = Array.from({ length: 5 }, (_, k) => `L${s.x - 8 - k * 5} ${s.y + Math.sin(tRef.current * 8 + s.phase + k) * 3}`).join(" ");
            return (
              <g key={i} opacity={s.dead ? 0.3 : 1}>
                <path d={`M${s.x - 8} ${s.y} ${tail}`} stroke="var(--stage-foreground)" strokeOpacity="0.6" strokeWidth="1.4" fill="none" />
                <ellipse cx={s.x} cy={s.y} rx="7" ry="4.5" fill={s.won ? "var(--signal)" : "oklch(0.65 0.13 260 / 0.7)"} />
              </g>
            );
          })}
          {sperms.current.some((s) => s.dead) && !fused && (
            <text x="70" y="60" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)">
              透明带反应 · 拒绝其余精子
            </text>
          )}
          {nucleusK >= 1 && (
            <text x="200" y="40" fontSize="12" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">
              受精卵 2n = {n * 2} · 生命由此开始
            </text>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={(Object.keys(SPECIES) as Sp[]).map((k) => ({ value: k, label: SPECIES[k].label }))}
          value={sp}
          onChange={(v) => {
            setSp(v);
            reset();
          }}
        />
        <div className="flex gap-2">
          <Button className="flex-1" disabled={fused} onClick={() => setRunning((r) => !r)}>
            {running ? "暂停" : fused ? "已受精" : "开始受精"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="精子染色体" value={`n = ${n}`} />
          <Readout label="卵细胞染色体" value={`n = ${n}`} />
          <Readout label="受精卵染色体" value={nucleusK >= 1 ? `2n = ${n * 2}` : "—"} tone={nucleusK >= 1 ? "good" : undefined} />
          <Readout label="入卵精子数" value={fused ? "1（唯一）" : running ? "竞争中…" : "0"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {fused
            ? nucleusK >= 1
              ? "精核与卵核融合，染色体数目恢复为 2n——减数分裂与受精作用相互依存，维持每种生物前后代染色体数目的恒定。"
              : "最先接触透明带的精子引发透明带反应，随后精核进入卵内与卵核融合。"
            : "精子游向卵细胞，最先到达者触发透明带反应，阻止多精入卵。点击“开始受精”观察全过程。"}
        </p>
      </div>
    </>
  );
}
