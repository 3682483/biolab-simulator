import { useRef, useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

type Kind = "nutrient" | "waste" | "protein";
const SUBS: Record<Kind, { label: string; color: string; size: number; desc: string }> = {
  nutrient: { label: "营养物质/氧气", color: "oklch(0.7 0.12 95 / 0.9)", size: 4, desc: "可自由穿过毛细血管壁进组织液，再进细胞" },
  waste: { label: "代谢废物（CO₂/尿素）", color: "oklch(0.65 0.13 25 / 0.9)", size: 4, desc: "从细胞进组织液，再回血浆被运走" },
  protein: { label: "血浆蛋白（大分子）", color: "oklch(0.65 0.13 310 / 0.9)", size: 5.5, desc: "正常不能出毛细血管壁——保血浆胶渗压" },
};

// 粒子阶段：血管内 → 组织液 → 细胞内（或反向）
type P = { x: number; y: number; stage: 0 | 1 | 2; v: number; dir: 1 | -1 };

export function InternalEnvironment() {
  const [kind, setKind] = useState<Kind>("nutrient");
  const [running, setRunning] = useState(true);
  const [, force] = useState(0);
  const parts = useRef<P[]>(
    Array.from({ length: 14 }, () => ({ x: 20 + Math.random() * 260, y: 40 + Math.random() * 24, stage: 0 as 0, v: 20 + Math.random() * 16, dir: 1 as 1 })),
  );
  const tRef = useRef(0);

  useFrame((dt) => {
    tRef.current += dt;
    if (running) {
      for (const p of parts.current) {
        p.x += p.v * dt * p.dir;
        if (p.stage === 0 && p.x > 285) {
          // 到达毛细血管右端：蛋白被挡回，其余穿壁进入组织液（沉到中层）
          if (kind === "protein") p.dir = -1;
          else {
            p.stage = 1;
            p.y = 160 + Math.random() * 8 - 4;
            p.dir = kind === "waste" ? 1 : -1;
            p.x = 270;
          }
        } else if (p.stage === 1 && (p.x < 195 || p.x > 300)) {
          if (kind === "waste") {
            p.stage = 0; // 废物回血管
            p.y = 40 + Math.random() * 24;
            p.dir = -1;
            p.x = 290;
          } else if (p.x <= 195) {
            p.stage = 2; // 进入细胞
            p.dir = -1;
          }
        } else if (p.stage === 2 && p.x < 120) {
          p.stage = 1;
          p.x = 122;
          p.dir = 1;
          if (kind !== "waste") p.dir = 1;
        } else if (p.stage === 0 && p.x < 20) {
          p.x = 20;
          p.dir = 1;
        }
      }
    }
    force((v) => v + 1);
  });

  const c = SUBS[kind];

  return (
    <>
      <Stage caption="内环境：血浆 ⇌ 组织液 ⇌ 淋巴，是细胞与外界交换物质的媒介">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 毛细血管（上） */}
          <path d="M20 30 h320 M20 78 h320" stroke="var(--signal)" strokeWidth="1.4" strokeOpacity="0.5" />
          <rect x="20" y="30" width="320" height="48" fill="oklch(0.55 0.13 25 / 0.1)" />
          <text x="180" y="24" fontSize="10" textAnchor="middle" fill="var(--signal)" opacity="0.85" fontFamily="var(--font-mono)">
            毛细血管 · 血浆
          </text>
          {/* 组织液（中） */}
          <rect x="20" y="78" width="320" height="164" fill="oklch(0.7 0.08 95 / 0.06)" />
          <text x="52" y="100" fontSize="10" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            组织液
          </text>
          {/* 组织细胞 */}
          <ellipse cx="150" cy="180" rx="46" ry="34" fill="oklch(0.7 0.06 160 / 0.12)" stroke="var(--membrane)" strokeWidth="1.5" />
          <circle cx="150" cy="176" r="12" fill="oklch(0.5 0.1 330 / 0.3)" />
          <text x="150" y="228" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
            组织细胞
          </text>
          {/* 毛细淋巴管（右下） */}
          <path d="M310 78 q30 40 30 100" stroke="var(--stage-foreground)" strokeOpacity="0.5" strokeWidth="1.4" fill="none" />
          <text x="364" y="140" fontSize="10" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)" transform="rotate(90 364 140)">
            毛细淋巴管 · 淋巴
          </text>
          {/* 物质流箭头 */}
          <path d="M180 78 v40 M150 118 v24" stroke="var(--stage-foreground)" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M200 242 h-40" stroke="var(--stage-foreground)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
          {/* 粒子 */}
          {parts.current.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={c.size} fill={c.color} opacity={0.9}>
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur={`${1.4 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* 占比条 */}
          <g>
            <rect x="30" y="292" width="114" height="9" rx="4" fill="oklch(0.55 0.13 25 / 0.65)" />
            <rect x="147" y="292" width="150" height="9" rx="4" fill="oklch(0.7 0.08 95 / 0.6)" />
            <rect x="300" y="292" width="60" height="9" rx="4" fill="oklch(0.7 0.06 160 / 0.6)" />
            <text x="87" y="285" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">血浆（1/5）</text>
            <text x="222" y="285" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">组织液（约 4/5）</text>
            <text x="330" y="285" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">淋巴（少）</text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={(Object.keys(SUBS) as Kind[]).map((k) => ({ value: k, label: SUBS[k].label }))}
          value={kind}
          onChange={(v) => {
            setKind(v);
            parts.current.forEach((p) => {
              p.stage = 0;
              p.y = 40 + Math.random() * 24;
              p.dir = 1;
              p.x = 20 + Math.random() * 250;
            });
          }}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setRunning((r) => !r)}>
            {running ? "暂停" : "开始循环"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="当前物质" value={c.label.split("（")[0] ?? ""} />
          <Readout label="血管壁通透" value={kind === "protein" ? "不可通过" : "可自由通过"} tone={kind === "protein" ? "warn" : "good"} />
          <Readout label="动力来源" value={kind === "nutrient" ? "浓度差·血压" : "浓度差"} />
          <Readout label="最终去向" value={kind === "nutrient" ? "进入细胞被利用" : kind === "waste" ? "回血浆运输排出" : "保留在血浆中"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {kind === "protein"
            ? "血浆蛋白是大分子，正常不能穿过毛细血管壁进入组织液——这正是血浆和组织液之间形成渗透压差、维持血容量的关键。"
            : `内环境三种成分相互联系：血浆和组织液可双向渗透，组织液单向渗入毛细淋巴管成为淋巴再回流血浆。${c.desc}。`}
        </p>
      </div>
    </>
  );
}
