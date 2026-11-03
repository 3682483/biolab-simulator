import { useState } from "react";
import type { BuilderConfig } from "@/data/remade/schema";
import { Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 结构拼装框架：选中目标结构的槽位 → 从部件库点选部件入位。
// 放对锁定并亮出知识点；放错不锁，可反复尝试直到拼完整。
export function ModelBuilder({ config, title }: { config: BuilderConfig; title: string }) {
  const [filled, setFilled] = useState<Record<string, string>>({}); // slotId → partId
  const [selSlot, setSelSlot] = useState<string | null>(config.slots[0]?.id ?? null);
  const [flash, setFlash] = useState<{ part: string; ok: boolean } | null>(null);
  const [facts, setFacts] = useState<string[]>([]);

  const tryPlace = (partId: string) => {
    const part = config.parts.find((p) => p.id === partId);
    if (!part || !selSlot) return;
    if (part.slot === selSlot) {
      setFilled((f) => ({ ...f, [selSlot]: partId }));
      setFacts((fs) => [...fs, part.fact]);
      setFlash({ part: part.name, ok: true });
      const next = config.slots.find((s) => s.id !== selSlot && !filled[s.id]);
      setSelSlot(next?.id ?? null);
    } else {
      setFlash({ part: part.name, ok: false });
    }
    setTimeout(() => setFlash(null), 1400);
  };

  const done = Object.keys(filled).length;
  const complete = done === config.slots.length;

  return (
    <>
      <Stage caption={`${title} · 拼装 ${done}/${config.slots.length}`}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 目标结构轮廓 */}
          <rect x="24" y="30" width="200" height="270" rx="16" fill="oklch(0.7 0.06 220 / 0.06)" stroke="var(--membrane)" strokeDasharray="6 4" />
          <text x="124" y="20" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            目标结构
          </text>
          {/* 槽位 */}
          {config.slots.map((s, i) => {
            const y = 52 + i * (240 / config.slots.length);
            const h = 240 / config.slots.length - 10;
            const part = filled[s.id] ? config.parts.find((p) => p.id === filled[s.id]) : null;
            const on = selSlot === s.id;
            return (
              <g key={s.id} onClick={() => !filled[s.id] && setSelSlot(s.id)} className="cursor-pointer">
                <rect x="38" y={y} width="172" height={h} rx="9" fill={part ? "var(--specimen)" : on ? "var(--signal)" : "oklch(0.7 0.06 220 / 0.1)"} fillOpacity={part ? 0.3 : on ? 0.2 : 1} stroke={on ? "var(--signal)" : part ? "var(--specimen)" : "var(--stage-foreground)"} strokeOpacity={on || part ? 1 : 0.35} strokeWidth={on ? 2 : 1.2} />
                <text x="124" y={y + h / 2 + 4} fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {part ? `${s.name}：${part.name}` : `${s.name}（待放入）`}
                </text>
              </g>
            );
          })}
          {/* 部件库 */}
          <rect x="238" y="30" width="140" height="270" rx="12" fill="oklch(0.7 0.06 260 / 0.06)" stroke="var(--stage-foreground)" strokeOpacity="0.3" />
          <text x="308" y="20" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            部件库
          </text>
          {config.parts.map((p, i) => {
            const used = Object.values(filled).includes(p.id);
            const y = 44 + i * (252 / config.parts.length);
            return (
              <g key={p.id} onClick={() => !used && tryPlace(p.id)} className={used ? "" : "cursor-pointer"} opacity={used ? 0.25 : 1}>
                <rect x="248" y={y} width="120" height={252 / config.parts.length - 6} rx="7" fill={flash?.part === p.name ? (flash.ok ? "oklch(0.7 0.14 145 / 0.5)" : "oklch(0.65 0.2 25 / 0.5)") : "oklch(0.7 0.06 220 / 0.12)"} stroke="var(--stage-foreground)" strokeOpacity="0.4" />
                <text x="308" y={y + (252 / config.parts.length - 6) / 2 + 3.5} fontSize="9.5" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {p.name}
                </text>
              </g>
            );
          })}
          {complete && (
            <text x="200" y="312" fontSize="11" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">
              拼装完成！
            </text>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFilled({});
              setSelSlot(config.slots[0]?.id ?? null);
              setFacts([]);
            }}
          >
            重新拼装
          </Button>
          {flash && (
            <span className={cn("self-center text-sm", flash.ok ? "text-status-live" : "text-signal")}>
              {flash.ok ? `✓ ${flash.part} 放置正确` : `✗ ${flash.part} 不属于该结构`}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="已放入" value={`${done}/${config.slots.length}`} tone={complete ? "good" : undefined} />
          <Readout label="干扰部件" value={config.parts.filter((p) => !p.slot).length} />
        </div>
        {facts.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">已解锁的结构知识</div>
            {facts.map((f, i) => (
              <p key={i} className="rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground">
                {f}
              </p>
            ))}
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{config.note}</p>
      </div>
    </>
  );
}
