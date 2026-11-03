import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { type CatalogEntry, moduleName } from "@/lib/labs";
import { remadeLabs } from "@/data/remade";

export function LabCard({ entry, index }: { entry: CatalogEntry; index: number }) {
  // 已重制的原参考实验：本项目自研框架渲染，不再挂「参考库」标识
  const remade = entry.kind === "legacy" ? remadeLabs[entry.id] : undefined;
  const tag = entry.kind === "sim" || remade ? `LAB-${String(index + 1).padStart(2, "0")}` : "参考";
  return (
    <Link
      to="/labs/$id"
      params={{ id: entry.id }}
      className="group animate-rise flex flex-col rounded-xl border bg-card p-6 transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
      style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
    >
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>{tag}</span>
        <ArrowUpRight className="size-4 transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-4 line-clamp-2 font-serif text-lg font-semibold leading-snug">{entry.title}</h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {remade ? "自研重制的交互仿真 · 原生 React 实现" : (entry.summary ?? "本地参考实验库 · 可交互生物模型")}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-accent px-2 py-0.5 text-accent-foreground">{moduleName(entry.module)}</span>
        {entry.minutes && <span className="font-mono">≈ {entry.minutes} min</span>}
        {entry.kind === "legacy" &&
          (remade ? (
            <span className="rounded border border-primary/40 px-2 py-0.5 text-primary">自研重制</span>
          ) : (
            <span className="rounded border px-2 py-0.5 text-muted-foreground">参考库</span>
          ))}
      </div>
    </Link>
  );
}
