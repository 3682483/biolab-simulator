import { useRef, useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

/** 磷脂分子:上排头朝上,下排头朝下,各自独立漂移 */
type Phospho = { x: number; dir: 1 | -1; mul: number; phase: number };
/** 胆固醇固定位点(取前 k 个显示) */
const CHOL_SPOTS = [
  { x: 62, y: 152 }, { x: 118, y: 170 }, { x: 205, y: 150 }, { x: 262, y: 172 },
  { x: 352, y: 154 }, { x: 92, y: 146 }, { x: 240, y: 166 }, { x: 374, y: 168 },
];

export function CellMembrane() {
  const [temp, setTemp] = useState(25);
  const [chol, setChol] = useState(20);
  const [, force] = useState(0);
  const tRef = useRef(0);
  const phosphos = useRef<Phospho[]>(
    Array.from({ length: 24 }, (_, i) => ({
      x: (i % 12) * 33.3 + 16,
      dir: i < 12 ? 1 : -1,
      mul: 0.7 + (((i * 7) % 5) / 4) * 0.3,
      phase: Math.random() * Math.PI * 2,
    })),
  );

  // 温度驱动磷脂侧向漂移与尾摆,胆固醇抑制流动
  useFrame((dt, t) => {
    tRef.current = t;
    const base = (temp / 60) * 24 * (1 - (chol / 100) * 0.45);
    for (const p of phosphos.current) {
      p.x += base * p.mul * p.dir * dt;
      if (p.x > 404) p.x -= 408;
      if (p.x < -4) p.x += 408;
    }
    force((v) => v + 1);
  });

  const topY = 103 - (chol / 100) * 5;
  const botY = 217 + (chol / 100) * 5;
  const amp = 3 + (temp / 60) * 3;
  const freq = 2 + (temp / 60) * 5;
  const sway = (phase: number) => Math.sin(tRef.current * freq + phase) * amp;
  const cholCount = Math.round((chol / 100) * CHOL_SPOTS.length);
  const fluid = Math.round((temp / 60) * 100 * (1 - (chol / 100) * 0.45));
  const thickness = 7 + (chol / 100) * 1.4;

  return (
    <>
      <Stage caption="流动镶嵌模型:磷脂双分子层 + 跨膜蛋白 + 糖蛋白 + 胆固醇">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <text x="390" y="60" textAnchor="end" fontSize="10" fill="var(--stage-foreground)" fillOpacity="0.6" fontFamily="var(--font-mono)">
            细胞外(外侧)
          </text>
          <text x="390" y="306" textAnchor="end" fontSize="10" fill="var(--stage-foreground)" fillOpacity="0.6" fontFamily="var(--font-mono)">
            细胞质基质(内侧)
          </text>
          {/* 上排磷脂:亲水头朝外,疏水尾向内摆动 */}
          {phosphos.current.map((p, i) =>
            i < 12 ? (
              <g key={i}>
                <line x1={p.x - 3.2} y1={topY + 6} x2={p.x - 3.2 + sway(p.phase)} y2={topY + 46} stroke="var(--stage-foreground)" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
                <line x1={p.x + 3.2} y1={topY + 6} x2={p.x + 3.2 + sway(p.phase + 0.9)} y2={topY + 46} stroke="var(--stage-foreground)" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
                <circle cx={p.x} cy={topY} r={6.5} fill="var(--specimen)" />
              </g>
            ) : null,
          )}
          {/* 下排磷脂:头朝内,尾朝外 */}
          {phosphos.current.map((p, i) =>
            i >= 12 ? (
              <g key={i}>
                <line x1={p.x - 3.2} y1={botY - 6} x2={p.x - 3.2 + sway(p.phase)} y2={botY - 46} stroke="var(--stage-foreground)" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
                <line x1={p.x + 3.2} y1={botY - 6} x2={p.x + 3.2 + sway(p.phase + 0.9)} y2={botY - 46} stroke="var(--stage-foreground)" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
                <circle cx={p.x} cy={botY} r={6.5} fill="var(--specimen)" />
              </g>
            ) : null,
          )}
          {/* 胆固醇:夹在两层之间,数量随滑杆 */}
          {CHOL_SPOTS.slice(0, cholCount).map((c, i) => (
            <g key={i}>
              <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - 12} stroke="var(--membrane)" strokeWidth={2} strokeLinecap="round" />
              <circle cx={c.x} cy={c.y} r={3.4} fill="var(--membrane)" />
            </g>
          ))}
          {/* 跨膜蛋白(通道)与糖蛋白 */}
          <rect x="128" y="84" width="10" height="152" rx="4" fill="oklch(0.7 0.11 30 / 0.9)" />
          <rect x="148" y="84" width="10" height="152" rx="4" fill="oklch(0.7 0.11 30 / 0.9)" />
          <rect x="290" y="86" width="24" height="148" rx="9" fill="oklch(0.7 0.11 30 / 0.9)" />
          <path d="M296 86 l-5 -9 M302 86 l0 -11 M308 86 l5 -9" stroke="var(--signal)" strokeWidth={2} strokeLinecap="round" fill="none" />
          <text x="143" y="76" textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.7" fontFamily="var(--font-mono)">
            通道蛋白
          </text>
          <text x="302" y="66" textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.7" fontFamily="var(--font-mono)">
            糖蛋白
          </text>
          {/* 膜厚标注 */}
          <line x1="34" y1={topY} x2="34" y2={botY} stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="1" />
          <path d={`M30 ${topY + 3} l4 -6 M30 ${botY - 3} l4 6`} stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="1" fill="none" />
          <text x="40" y="164" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.7" fontFamily="var(--font-mono)">
            ≈{thickness.toFixed(1)} nm
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Control label="温度" value={temp} unit="°C" min={0} max={60} onChange={setTemp} />
        <Control label="胆固醇含量" value={chol} unit="%" min={0} max={100} onChange={setChol} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="流动性指数" value={fluid} tone={fluid > 55 ? "good" : fluid < 15 ? "warn" : undefined} />
          <Readout label="膜厚度" value={`${thickness.toFixed(1)} nm`} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {temp >= 50
            ? "温度很高:磷脂侧向漂移与尾摆剧烈,膜流动性过强,选择透过性将受损。"
            : chol >= 60
              ? "胆固醇较多:对流动性双向调节——高温下降低流动性,低温下防止膜过于僵直。"
              : temp <= 10
                ? "温度较低:磷脂运动缓慢,膜趋于刚性;适量胆固醇可防止其完全固化。"
                : "温度越高,磷脂侧向漂移越快、尾部摆动越剧烈,膜流动性越强;胆固醇对流动性起双向调节作用。"}
        </p>
      </div>
    </>
  );
}
