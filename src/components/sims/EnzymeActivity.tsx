import { useRef, useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

type Enz = "saliva" | "pepsin";

const ENZYMES: Record<Enz, { label: string; sub: string; optT: number; optPh: number }> = {
  saliva: { label: "唾液淀粉酶", sub: "淀粉", optT: 37, optPh: 6.8 },
  pepsin: { label: "胃蛋白酶", sub: "蛋白质", optT: 37, optPh: 1.5 },
};
const ENZ_OPTIONS: { value: Enz; label: string }[] = [
  { value: "saliva", label: "唾液淀粉酶" },
  { value: "pepsin", label: "胃蛋白酶" },
];
const DENATURE_T = 60; // 超过此温度不可逆变性

// 温度 / pH 双因子钟形模型（最适 37°C）
const tFactor = (t: number) => Math.exp(-(((t - 37) / 11) ** 2));
const phFactor = (ph: number, opt: number) => Math.exp(-(((ph - opt) / 0.9) ** 2));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Sub = { x: number; y: number; vx: number; vy: number };
type Prod = { x: number; y: number; vx: number; vy: number; life: number };

const EX = 105; // 酶圆心
const EY = 178;

const spawnSub = (): Sub => ({
  x: 32 + Math.random() * 182,
  y: 62 + Math.random() * 232,
  vx: (Math.random() - 0.5) * 90,
  vy: (Math.random() - 0.5) * 90,
});

export function EnzymeActivity() {
  const [enz, setEnz] = useState<Enz>("saliva");
  const [temp, setTemp] = useState(37);
  const [ph, setPh] = useState(6.8);
  const [denatured, setDenatured] = useState(false);
  const [running, setRunning] = useState(false);
  const [, force] = useState(0);

  const subs = useRef<Sub[]>(Array.from({ length: 9 }, spawnSub));
  const prods = useRef<Prod[]>([]);
  const done = useRef(0);

  const meta = ENZYMES[enz];
  const tf = tFactor(temp);
  const pf = phFactor(ph, meta.optPh);
  const rate = denatured ? 0 : 100 * tf * pf;

  useFrame((dt) => {
    const heat = 1 + rate / 60; // 速率越高分子运动越快
    for (const s of subs.current) {
      s.x += s.vx * dt * heat;
      s.y += s.vy * dt * heat;
      if (s.x < 30 || s.x > 226) s.vx *= -1;
      if (s.y < 60 || s.y > 300) s.vy *= -1;
      s.x = Math.max(30, Math.min(226, s.x));
      s.y = Math.max(60, Math.min(300, s.y));
      const near = Math.hypot(s.x - EX, s.y - EY) < 22;
      if (near && running && rate > 0 && Math.random() < rate / 100) {
        // 催化成功：底物分裂为两个产物
        done.current += 1;
        const a = Math.random() * Math.PI;
        prods.current.push({ x: s.x, y: s.y, vx: Math.cos(a) * 75, vy: Math.sin(a) * 75, life: 1.2 });
        prods.current.push({ x: s.x, y: s.y, vx: -Math.cos(a) * 75, vy: -Math.sin(a) * 75, life: 1.2 });
        Object.assign(s, spawnSub());
      }
    }
    prods.current = prods.current.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      return p.life > 0;
    });
    force((n) => n + 1);
  });

  const changeTemp = (v: number) => {
    setTemp(v);
    if (v >= DENATURE_T) setDenatured(true);
  };
  const changeEnz = (v: Enz) => {
    setEnz(v);
    setDenatured(false);
    done.current = 0;
    prods.current = [];
  };
  const reset = () => {
    setRunning(false);
    setDenatured(false);
    setTemp(37);
    setPh(ENZYMES[enz].optPh);
    done.current = 0;
    prods.current = [];
  };

  // 右侧两条钟形曲线：随另一因子取当前值
  const curveT = (t: number) => (denatured ? 0 : 100 * tFactor(t) * pf);
  const curvePh = (p: number) => (denatured ? 0 : 100 * tf * phFactor(p, meta.optPh));
  const ptsT = Array.from({ length: 41 }, (_, i) => `${252 + ((i * 2) / 80) * 140},${128 - (curveT(i * 2) / 100) * 86}`);
  const ptsPh = Array.from({ length: 41 }, (_, i) => `${252 + ((1 + i * 0.3 - 1) / 12) * 140},${272 - (curvePh(1 + i * 0.3) / 100) * 86}`);
  const dotT = [252 + (temp / 80) * 140, 128 - (rate / 100) * 86];
  const dotPh = [252 + ((ph - 1) / 12) * 140, 272 - (rate / 100) * 86];

  // 酶（缺口圆）路径：开口朝右
  const R = 18;
  const mouth = 0.55;
  const arc = `M${EX + R * Math.cos(mouth)} ${EY - R * Math.sin(mouth)} A${R} ${R} 0 1 0 ${EX + R * Math.cos(mouth)} ${EY + R * Math.sin(mouth)} Z`;

  const status = denatured
    ? "变性失活（不可逆）"
    : rate >= 85
      ? "最适条件"
      : tf < pf
        ? temp < meta.optT
          ? "低温抑制（可恢复）"
          : "温度偏高（可恢复）"
        : ph < meta.optPh
          ? "pH 偏低抑制"
          : "pH 偏高抑制";

  const note = denatured
    ? `${meta.label}曾超过 ${DENATURE_T}°C，空间结构被不可逆破坏——降温也无法恢复活性，只能重置换新酶。`
    : rate >= 85
      ? `处于最适条件（${meta.optT}°C / pH ${meta.optPh}）附近，酶活性最高，${meta.sub}被迅速分解。`
      : tf < pf
        ? temp < meta.optT
          ? "低温使酶活性明显降低，但分子结构未破坏——属于可恢复的抑制，升温即可恢复。"
          : `温度超过最适值，酶活性骤降；继续升到 ${DENATURE_T}°C 以上将不可逆变性。`
        : `pH 偏离最适值（pH ${meta.optPh}），酶活性受抑制；过酸过碱同样会使酶变性失活。`;

  return (
    <>
      <Stage caption={`${meta.label} · 最适 ${meta.optT}°C / pH ${meta.optPh}${denatured ? " · 已变性" : ""}`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 左：反应区 */}
          <line x1="242" y1="30" x2="242" y2="306" stroke="var(--stage-foreground)" strokeOpacity="0.2" />
          <polygon points="34,42 39,51 29,51" fill="var(--membrane)" opacity="0.8" />
          <text x="45" y="50" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            底物（{meta.sub}）
          </text>
          <circle cx="120" cy="47" r="3" fill="oklch(0.8 0.1 150 / 0.9)" />
          <circle cx="128" cy="47" r="3" fill="oklch(0.8 0.1 150 / 0.9)" />
          <text x="136" y="50" fontSize="8" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            产物
          </text>
          {prods.current.map((p, i) => (
            <circle key={`pr${i}`} cx={p.x} cy={p.y} r="3" fill="oklch(0.8 0.1 150 / 0.9)" opacity={clamp01(p.life / 1.2)} />
          ))}
          <path
            d={arc}
            fill={denatured ? "var(--signal)" : "var(--specimen)"}
            fillOpacity="0.3"
            stroke={denatured ? "var(--signal)" : "var(--specimen)"}
            strokeWidth="1.5"
          />
          <text
            x={EX - 3}
            y={EY + 32}
            fontSize="9"
            fill={denatured ? "var(--signal)" : "var(--specimen)"}
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            {denatured ? "酶（已变性）" : "酶"}
          </text>
          {!denatured && (
            <text x={EX + 26} y={EY - 20} fontSize="8" fill="var(--specimen)" opacity="0.8" fontFamily="var(--font-mono)">
              活性位点
            </text>
          )}
          {denatured && (
            <>
              <line x1={EX - 8} y1={EY - 8} x2={EX + 8} y2={EY + 8} stroke="var(--signal)" strokeWidth="1.5" />
              <line x1={EX + 8} y1={EY - 8} x2={EX - 8} y2={EY + 8} stroke="var(--signal)" strokeWidth="1.5" />
            </>
          )}
          {subs.current.map((s, i) => (
            <polygon
              key={`s${i}`}
              points={`${s.x},${s.y - 6} ${s.x - 5.5},${s.y + 4} ${s.x + 5.5},${s.y + 4}`}
              fill="var(--membrane)"
              opacity="0.8"
            />
          ))}
          {/* 右上：速率-温度曲线 */}
          <text x="252" y="38" fontSize="8" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
            速率 – 温度
          </text>
          <line x1="252" y1="128" x2="392" y2="128" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
          <line x1="252" y1="42" x2="252" y2="128" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
          <line x1={252 + (37 / 80) * 140} y1="128" x2={252 + (37 / 80) * 140} y2="134" stroke="var(--stage-foreground)" strokeOpacity="0.5" />
          <polyline points={ptsT.join(" ")} fill="none" stroke="var(--specimen)" strokeWidth="1.5" />
          <circle cx={dotT[0]} cy={dotT[1]} r="4" fill="var(--signal)" />
          <text x="392" y="140" fontSize="8" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)" textAnchor="end">
            °C
          </text>
          {/* 右下：速率-pH 曲线 */}
          <text x="252" y="182" fontSize="8" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
            速率 – pH
          </text>
          <line x1="252" y1="272" x2="392" y2="272" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
          <line x1="252" y1="186" x2="252" y2="272" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
          <line x1={252 + ((meta.optPh - 1) / 12) * 140} y1="272" x2={252 + ((meta.optPh - 1) / 12) * 140} y2="278" stroke="var(--stage-foreground)" strokeOpacity="0.5" />
          <polyline points={ptsPh.join(" ")} fill="none" stroke="var(--specimen)" strokeWidth="1.5" />
          <circle cx={dotPh[0]} cy={dotPh[1]} r="4" fill="var(--signal)" />
          <text x="392" y="284" fontSize="8" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)" textAnchor="end">
            pH
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented options={ENZ_OPTIONS} value={enz} onChange={changeEnz} />
        <Control label="温度" value={temp} unit="°C" min={0} max={80} onChange={changeTemp} />
        <Control label="pH" value={ph} min={1} max={13} step={0.1} onChange={setPh} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRunning((r) => !r)}>
            {running ? "暂停反应" : "开始反应"}
          </Button>
          <Button variant="outline" onClick={reset}>
            重置
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Readout label="相对速率" value={`${rate.toFixed(0)}%`} tone={rate >= 85 ? "good" : denatured ? "warn" : undefined} />
          <Readout label="酶的状态" value={status} tone={denatured ? "warn" : rate >= 85 ? "good" : undefined} />
          <Readout label="已催化次数" value={done.current} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </>
  );
}
