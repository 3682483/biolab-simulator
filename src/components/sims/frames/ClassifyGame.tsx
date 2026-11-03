import { useMemo, useState } from "react";
import type { ClassifyConfig } from "@/data/remade/schema";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 分类挑战框架：卡片依次登场，点选正确的分类桶；
// 归对亮出知识点，归错提示重来，全部归完显示成绩。
export function ClassifyGame({ config, title }: { config: ClassifyConfig; title: string }) {
  const order = useMemo(() => [...config.cards].sort(() => Math.random() - 0.5), [config.cards]);
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [miss, setMiss] = useState(0);
  const [feedback, setFeedback] = useState<{ bucket: string; ok: boolean; fact?: string } | null>(null);
  const card = order[idx];
  const total = order.length;
  const finished = idx >= total;

  const drop = (bucket: string) => {
    if (!card) return;
    const ok = card.bucket === bucket;
    if (ok) {
      setHits((h) => h + 1);
      setFeedback({ bucket, ok: true, fact: card.fact });
      setIdx((i) => i + 1);
    } else {
      setMiss((m) => m + 1);
      setFeedback({ bucket, ok: false });
    }
  };

  return (
    <>
      <Stage caption={`${title} · 分类 ${Math.min(idx + 1, total)}/${total}`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 当前卡片 */}
          {card ? (
            <g>
              <rect x="140" y="40" width="120" height="90" rx="12" fill="oklch(0.7 0.1 260 / 0.12)" stroke="var(--stage-foreground)" strokeOpacity="0.7" strokeWidth="1.6" />
              <text x="200" y="76" fontSize="13" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                {card.name.length > 8 ? `${card.name.slice(0, 8)}…` : card.name}
              </text>
              <text x="200" y="98" fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.55" fontFamily="var(--font-mono)">
                该归入哪个桶？
              </text>
            </g>
          ) : (
            <text x="200" y="80" fontSize="14" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">
              全部分类完成！正确率 {Math.round((hits / Math.max(1, hits + miss)) * 100)}%
            </text>
          )}
          {/* 分类桶 */}
          {config.buckets.map((b, i) => {
            const bw = 360 / config.buckets.length;
            const x = 20 + i * bw + 6;
            const active = feedback?.bucket === b;
            return (
              <g key={b} onClick={() => drop(b)} className="cursor-pointer">
                <rect x={x} y="170" width={bw - 12} height="86" rx="10" fill={active ? (feedback?.ok ? "oklch(0.7 0.14 145 / 0.35)" : "oklch(0.65 0.19 25 / 0.35)") : "oklch(0.7 0.06 220 / 0.1)"} stroke={active ? "var(--signal)" : "var(--stage-foreground)"} strokeOpacity={active ? 1 : 0.35} strokeWidth={active ? 2 : 1.2} />
                <text x={x + (bw - 12) / 2} y="218" fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {b}
                </text>
              </g>
            );
          })}
          <text x="200" y="292" fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">
            点桶归类 · 归错可再选
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
          <Readout label="进度" value={`${Math.min(idx, total)}/${total}`} />
          <Readout label="归对" value={hits} tone="good" />
          <Readout label="归错" value={miss} tone={miss > hits ? "warn" : undefined} />
        </div>
        {feedback?.ok && feedback.fact && (
          <p className="rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground">✓ {feedback.fact}</p>
        )}
        {feedback && !feedback.ok && (
          <p className="rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground">✗ 再想想，它不属于「{feedback.bucket}」。</p>
        )}
        {finished && (
          <div className="space-y-2">
            <p className={cn("rounded-md border bg-card px-3 py-2 text-sm leading-relaxed", hits / Math.max(1, hits + miss) > 0.8 ? "text-status-live" : "text-card-foreground")}>
              {hits / Math.max(1, hits + miss) > 0.8 ? "分类判断扎实，概念边界清楚！" : "仍有概念混淆，回看错项对应的知识点。"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIdx(0);
                setHits(0);
                setMiss(0);
                setFeedback(null);
                order.sort(() => Math.random() - 0.5);
              }}
            >
              重洗一轮
            </Button>
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
      </div>
    </>
  );
}
