import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

type HL = "nucleus" | "organelle" | "wall" | "dna" | "unity";
const ORDER: HL[] = ["nucleus", "organelle", "wall", "dna", "unity"];
/** 各对比项的说明标签(左原核 / 右真核) */
const HL_INFO: Record<HL, { left: string; right: string }> = {
  nucleus: { left: "拟核:DNA 集中,无核膜", right: "细胞核:双膜包被" },
  organelle: { left: "无膜性细胞器(仅核糖体)", right: "多种膜性细胞器分工" },
  wall: { left: "有细胞壁(肽聚糖)", right: "动物细胞无细胞壁" },
  dna: { left: "环状 DNA,无组蛋白", right: "线状 DNA + 蛋白质" },
  unity: { left: "共有:细胞膜·核糖体", right: "共有:细胞膜·核糖体" },
};

export function Prokaryote() {
  const [hl, setHl] = useState<HL>("nucleus");
  const [auto, setAuto] = useState(false);
  const [, force] = useState(0);
  const tRef = useRef(0);
  const cycle = useRef(0);

  // 闪烁驱动 + 自动巡览轮换 + 鞭毛摆动
  useFrame((dt, t) => {
    tRef.current = t;
    if (auto) {
      cycle.current += dt;
      if (cycle.current > 2.6) {
        cycle.current = 0;
        setHl((cur) => {
          const idx = ORDER.indexOf(cur);
          return ORDER[(idx + 1) % ORDER.length] ?? "nucleus";
        });
      }
    }
    force((v) => v + 1);
  });

  const glow = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(tRef.current * 5));
  const on = (id: HL) => hl === id;
  const strokeOn = (id: HL, base: string) => (on(id) ? "var(--signal)" : base);
  const w1 = 7 * Math.sin(tRef.current * 6);
  const w2 = 7 * Math.sin(tRef.current * 6 + 2);
  // 原核核糖体 / 真核核糖体位置
  const leftRibos = [[70, 112], [122, 104], [140, 148], [62, 166], [118, 190], [86, 194], [148, 176], [58, 130]] as const;
  const rightRibos = [[256, 158], [266, 168], [344, 148], [354, 168], [276, 196], [330, 226]] as const;

  return (
    <>
      <Stage caption="左:原核细胞(细菌) · 右:真核细胞(动物)">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* ===== 原核细胞 ===== */}
          <g>
            {/* 鞭毛(摆动) */}
            <path d={`M28 150 q-7 ${w1.toFixed(1)} -13 -1 q-6 ${w2.toFixed(1)} -12 0`} fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" />
            {/* 细胞壁(外)与细胞膜(内) */}
            <ellipse cx="100" cy="150" rx="72" ry="64" fill="oklch(0.75 0.08 220 / 0.10)" stroke={strokeOn("wall", "var(--specimen)")} strokeWidth="4" opacity={on("wall") ? glow : 1} />
            <ellipse cx="100" cy="150" rx="66" ry="58" fill="none" stroke={strokeOn("unity", "var(--stage-foreground)")} strokeOpacity={on("unity") ? glow : 0.6} strokeWidth={on("unity") ? 2.4 : 1.2} />
            {/* 拟核(虚线圈) */}
            <ellipse cx="100" cy="150" rx="36" ry="28" fill="oklch(0.6 0.1 300 / 0.08)" stroke={strokeOn("nucleus", "var(--stage-foreground)")} strokeOpacity={on("nucleus") ? glow : 0.5} strokeWidth={on("nucleus") ? 2.2 : 1.2} strokeDasharray="5 4" />
            {/* 环状 DNA(扭结丝) */}
            <path
              d="M80 140 q10 -14 24 -7 q13 7 3 19 q-12 12 -22 3 q-9 -8 -5 -15 Z"
              fill="none"
              stroke={strokeOn("dna", "oklch(0.55 0.13 300)")}
              strokeWidth={on("dna") ? 2.6 : 2}
              opacity={on("dna") ? glow : 1}
            />
            {/* 质粒(小环) */}
            <circle cx="128" cy="122" r="5" fill="none" stroke="oklch(0.55 0.13 300)" strokeWidth="1.5" />
            <circle cx="74" cy="178" r="4" fill="none" stroke="oklch(0.55 0.13 300)" strokeWidth="1.5" />
            {/* 核糖体散点 */}
            {leftRibos.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.8" fill={on("unity") || on("organelle") ? "var(--signal)" : "var(--stage-foreground)"} opacity={on("unity") || on("organelle") ? glow : 0.7} />
            ))}
            <text x="100" y="230" textAnchor="middle" fontSize="10" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">原核细胞</text>
            <text x="100" y="252" textAnchor="middle" fontSize="9.5" fill="var(--signal)" opacity={0.55 + glow * 0.45} fontFamily="var(--font-mono)">
              {HL_INFO[hl].left}
            </text>
          </g>

          {/* ===== 真核细胞 ===== */}
          <g>
            <ellipse cx="298" cy="150" rx="90" ry="110" fill="oklch(0.72 0.07 130 / 0.10)" stroke={strokeOn("unity", "var(--specimen)")} strokeWidth={on("unity") ? 2.4 : 2} opacity={on("unity") ? glow : 1} />
            {/* 细胞核(双膜 + 核仁 + 染色质) */}
            <circle cx="282" cy="106" r="40" fill="oklch(0.6 0.1 300 / 0.20)" stroke={strokeOn("nucleus", "var(--stage-foreground)")} strokeWidth={on("nucleus") ? 2.4 : 1.8} opacity={on("nucleus") ? glow : 1} />
            <circle cx="282" cy="106" r="35" fill="none" stroke={strokeOn("nucleus", "var(--stage-foreground)")} strokeOpacity="0.4" strokeWidth="1.4" />
            <circle cx="292" cy="98" r="11" fill="oklch(0.48 0.13 300)" />
            <path d="M266 112 q10 6 22 -2 M270 124 q12 5 24 -4" fill="none" stroke={strokeOn("dna", "oklch(0.55 0.13 300)")} strokeWidth={on("dna") ? 2.4 : 1.6} opacity={on("dna") ? glow : 1} />
            {/* 内质网 */}
            <path d="M258 152 C286 142 310 172 296 186 S318 204 330 196" fill="none" stroke={strokeOn("organelle", "var(--stage-foreground)")} strokeOpacity={on("organelle") ? glow : 0.7} strokeWidth="1.8" />
            <path d="M258 159 C286 149 310 179 296 193 S318 211 330 203" fill="none" stroke={strokeOn("organelle", "var(--stage-foreground)")} strokeOpacity={on("organelle") ? glow : 0.7} strokeWidth="1.8" />
            {/* 高尔基体 */}
            <path d="M342 76 q14 -10 32 -2 M342 84 q14 -10 32 -2 M342 92 q14 -10 32 -2" fill="none" stroke={strokeOn("organelle", "var(--membrane)")} strokeOpacity={on("organelle") ? glow : 1} strokeWidth="3.5" strokeLinecap="round" />
            {/* 线粒体 */}
            <ellipse cx="326" cy="232" rx="24" ry="13" fill="oklch(0.66 0.11 60 / 0.8)" stroke={strokeOn("organelle", "var(--stage-foreground)")} strokeWidth="1" opacity={on("organelle") ? glow : 1} />
            <path d="M319 226 q4 6 0 12 M327 224 q4 8 0 16 M335 226 q4 6 0 12" fill="none" stroke="oklch(0.45 0.1 60)" strokeWidth="1.4" />
            {/* 溶酶体 */}
            <circle cx="250" cy="214" r="8" fill="oklch(0.62 0.14 25 / 0.85)" stroke={strokeOn("organelle", "var(--stage-foreground)")} strokeWidth="1" opacity={on("organelle") ? glow : 1} />
            {/* 核糖体 */}
            {rightRibos.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.8" fill={on("unity") ? "var(--signal)" : "var(--stage-foreground)"} opacity={on("unity") ? glow : 0.7} />
            ))}
            <text x="298" y="278" textAnchor="middle" fontSize="10" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">真核细胞</text>
            <text x="298" y="296" textAnchor="middle" fontSize="9.5" fill="var(--signal)" opacity={0.55 + glow * 0.45} fontFamily="var(--font-mono)">
              {HL_INFO[hl].right}
            </text>
          </g>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">对比项(闪烁高亮)</div>
          <Segmented
            value={hl}
            onChange={setHl}
            options={[
              { value: "nucleus", label: "细胞核" },
              { value: "organelle", label: "细胞器" },
              { value: "wall", label: "细胞壁" },
              { value: "dna", label: "DNA 形态" },
              { value: "unity", label: "统一性" },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setAuto((a) => !a)}>
            {auto ? "暂停巡览" : "自动巡览"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAuto(false);
              setHl("nucleus");
            }}
          >
            重置
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="原核细胞直径" value="1–10 μm" />
          <Readout label="真核细胞直径" value="10–100 μm" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {hl === "nucleus"
            ? "原核细胞没有以核膜为界限的细胞核,DNA 集中在拟核区;真核细胞有成形细胞核,核内还有核仁与染色质。"
            : hl === "organelle"
              ? "原核细胞除核糖体外没有其他细胞器;真核细胞靠内质网、高尔基体、线粒体等膜性细胞器实现功能分区。"
              : hl === "wall"
                ? "原核细胞(细菌)有肽聚糖细胞壁;动物细胞无细胞壁,植物的细胞壁成分为纤维素。"
                : hl === "dna"
                  ? "原核 DNA 为环状、不与蛋白质结合;真核 DNA 为线状,与蛋白质结合成染色质(染色体)。"
                  : "统一性:两者都有细胞膜、细胞质、核糖体与 DNA/RNA——原核与真核同源,差异之中蕴含统一。"}
        </p>
      </div>
    </>
  );
}
