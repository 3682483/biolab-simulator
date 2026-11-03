import { useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";

// 样液 × 试剂 → 检测目标
const SAMPLES = ["梨汁", "豆浆", "花生仁", "马铃薯"] as const;
const REAGENTS = ["斐林试剂", "双缩脲试剂", "苏丹Ⅲ染液", "碘液"] as const;
type Sample = (typeof SAMPLES)[number];
type Reagent = (typeof REAGENTS)[number];

// 每种样液的成分
const HAS: Record<Sample, { sugar: boolean; protein: boolean; fat: boolean; starch: boolean }> = {
  梨汁: { sugar: true, protein: false, fat: false, starch: false },
  豆浆: { sugar: false, protein: true, fat: true, starch: false },
  花生仁: { sugar: false, protein: false, fat: true, starch: false },
  马铃薯: { sugar: false, protein: false, fat: false, starch: true },
};

type Result = { color: string; label: string; needsHeat?: boolean };
const REACTION: Record<Reagent, { target: keyof (typeof HAS)[Sample]; positive: Result }> = {
  斐林试剂: {
    target: "sugar",
    positive: { color: "oklch(0.55 0.17 30 / 0.9)", label: "砖红色沉淀", needsHeat: true },
  },
  双缩脲试剂: {
    target: "protein",
    positive: { color: "oklch(0.5 0.15 300 / 0.85)", label: "紫色反应" },
  },
  苏丹Ⅲ染液: {
    target: "fat",
    positive: { color: "oklch(0.75 0.15 60 / 0.9)", label: "橘黄色颗粒" },
  },
  碘液: {
    target: "starch",
    positive: { color: "oklch(0.35 0.08 280 / 0.9)", label: "蓝紫色" },
  },
};

export function FoodTests() {
  const [sample, setSample] = useState<Sample>("梨汁");
  const [reagent, setReagent] = useState<Reagent>("斐林试剂");
  const [phase, setPhase] = useState<"idle" | "added" | "heating" | "done">("idle");
  const [score, setScore] = useState({ right: 0, wrong: 0 });

  const rx = REACTION[reagent];
  const positive = HAS[sample][rx.target];
  const willReact = positive;
  const needsHeat = rx.positive.needsHeat ?? false;

  const reset = () => setPhase("idle");

  const step = () => {
    if (phase === "idle") setPhase("added");
    else if (phase === "added") {
      if (needsHeat) setPhase("heating");
      else setPhase("done");
    } else if (phase === "heating") setPhase("done");
  };

  const tubeColor =
    phase === "done" && willReact
      ? rx.positive.color
      : phase === "idle"
        ? "oklch(0.6 0.06 95 / 0.25)"
        : "oklch(0.7 0.05 95 / 0.3)";
  const judged = phase === "done";
  // 判断用户配对是否有意义：样液确实含目标成分 = 阳性（正确检出）
  const correct = willReact;

  return (
    <>
      <Stage caption="生物组织中的有机物检测：选对样液 × 试剂的组合，观察特征显色反应">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 酒精灯（需要水浴加热时显示） */}
          {(needsHeat || phase === "heating") && (
            <g opacity={phase === "idle" ? 0.35 : 1}>
              <path d="M104 252 v-18 h-14 v18 Z" fill="oklch(0.4 0.1 25 / 0.4)" transform="translate(0 -6)" />
              <ellipse cx="97" cy="224" rx="7" ry="11" fill="oklch(0.75 0.16 75 / 0.85)">
                {phase === "heating" && <animate attributeName="ry" values="11;14;11" dur="0.6s" repeatCount="indefinite" />}
              </ellipse>
              <text x="97" y="272" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
                50–65℃ 水浴
              </text>
            </g>
          )}
          {/* 试管 */}
          <g transform="translate(160 0)">
            <path d="M-16 40 h32 v130 q0 22 -16 22 q-16 0 -16 -22 Z" fill="none" stroke="var(--stage-foreground)" strokeOpacity="0.55" strokeWidth="2" />
            {/* 液体 */}
            <path d="M-13 96 h26 v74 q0 20 -13 20 q-13 0 -13 -20 Z" fill={tubeColor} />
            {phase === "done" && willReact && rx.target === "fat" && (
              <g>
                {Array.from({ length: 6 }, (_, i) => (
                  <circle key={i} cx={-8 + (i % 3) * 8} cy={108 + Math.floor(i / 3) * 14} r="4" fill={rx.positive.color} />
                ))}
              </g>
            )}
            {phase === "done" && willReact && rx.target === "sugar" && (
              <g>
                {Array.from({ length: 5 }, (_, i) => (
                  <circle key={i} cx={-8 + (i % 3) * 8} cy={132 + Math.floor(i / 3) * 12} r="3.4" fill="oklch(0.5 0.17 28)" />
                ))}
              </g>
            )}
            {/* 滴管 */}
            {phase === "added" && (
              <g>
                <path d="M40 20 h10 v30 l-5 6 l-5 -6 Z" fill="oklch(0.7 0.12 220 / 0.6)" />
                <circle cx="45" cy="66" r="2.4" fill="oklch(0.7 0.12 220 / 0.9)">
                  <animate attributeName="cy" values="66;92;66" dur="1s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
            <text x="0" y="28" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
              {sample} + {reagent}
            </text>
          </g>
          {/* 结果卡 */}
          <g>
            <rect x="268" y="60" width="112" height="130" rx="8" fill="oklch(0.7 0.06 160 / 0.08)" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
            <text x="324" y="84" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              检测结果
            </text>
            {judged ? (
              <>
                <circle cx="324" cy="118" r="14" fill={correct ? rx.positive.color : "oklch(0.6 0.05 95 / 0.3)"} />
                <text x="324" y="156" fontSize="10" textAnchor="middle" fill={correct ? "var(--signal)" : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
                  {correct ? rx.positive.label : "无颜色变化"}
                </text>
                <text x="324" y="176" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
                  {correct ? `检出：${{ sugar: "还原糖", protein: "蛋白质", fat: "脂肪", starch: "淀粉" }[rx.target]}` : "该样液不含目标物"}
                </text>
              </>
            ) : (
              <text x="324" y="130" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.5" fontFamily="var(--font-mono)">
                {phase === "idle" ? "选择样液与试剂" : phase === "added" ? (needsHeat ? "需水浴加热" : "正在反应…") : "加热中…"}
              </text>
            )}
          </g>
          {/* 计分 */}
          <text x="324" y="226" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            有效检出 {score.right} · 无效组合 {score.wrong}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={SAMPLES.map((s) => ({ value: s, label: s }))}
          value={sample}
          onChange={(v) => {
            setSample(v as Sample);
            reset();
          }}
        />
        <Segmented
          options={REAGENTS.map((r) => ({ value: r, label: r }))}
          value={reagent}
          onChange={(v) => {
            setReagent(v as Reagent);
            reset();
          }}
        />
        <div className="flex gap-2">
          <Button className="flex-1" disabled={phase === "done"} onClick={step}>
            {phase === "idle" ? "加样 + 滴加试剂" : phase === "added" ? (needsHeat ? "水浴加热" : "观察结果") : "观察结果"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (judged) setScore((s) => ({ right: s.right + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
              reset();
            }}
          >
            下一组
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="检测目标" value={{ sugar: "还原糖", protein: "蛋白质", fat: "脂肪", starch: "淀粉" }[rx.target]} />
          <Readout label="反应条件" value={needsHeat ? "需 50–65℃ 水浴" : "常温"} tone={needsHeat ? "warn" : undefined} />
          <Readout label="斐林试剂" value="现配现用 · 甲液+乙液" />
          <Readout label="双缩脲试剂" value="先 A 液后 B 液" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {judged
            ? correct
              ? `${sample}含${{ sugar: "还原糖", protein: "蛋白质", fat: "脂肪", starch: "淀粉" }[rx.target]}——加入${reagent}${needsHeat ? "并水浴加热后" : "后"}呈现${rx.positive.label}，检测成功。`
              : `${sample}不含${{ sugar: "还原糖", protein: "蛋白质", fat: "脂肪", starch: "淀粉" }[rx.target]}，加入${reagent}无颜色变化。换一种试剂或样液再试。`
            : "选择样液与试剂后按步骤操作：斐林试剂检测还原糖需水浴加热才出现砖红色沉淀；双缩脲试剂检测蛋白质呈紫色；苏丹Ⅲ染液把脂肪染成橘黄色；碘液遇淀粉变蓝紫。"}
        </p>
      </div>
    </>
  );
}
