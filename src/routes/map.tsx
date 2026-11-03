import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { labs, modules, statusLabel, type Status } from "@/lib/labs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "知识地图 · 生命实验室" },
      { name: "description", content: "高中生物 10 大模块、200 个知识点的资源覆盖情况一览。" },
      { property: "og:title", content: "知识地图 · 生命实验室" },
      { property: "og:description", content: "高中生物 10 大模块的知识结构与互动资源覆盖。" },
    ],
  }),
  component: MapPage,
});

const statusClass: Record<Status, string> = {
  live: "bg-status-live",
  plan: "bg-status-plan",
  later: "bg-status-later",
  todo: "bg-status-todo",
};

function MapPage() {
  const [open, setOpen] = useState<string | null>("02");
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold">知识地图</h1>
      <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(statusLabel) as Status[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", statusClass[s])} />
            {statusLabel[s]}
          </span>
        ))}
      </div>
      <ul className="mt-8 divide-y border-y">
        {modules.map((m) => {
          const isOpen = open === m.id;
          const related = labs.filter((l) => l.module === m.id);
          return (
            <li key={m.id}>
              <button onClick={() => setOpen(isOpen ? null : m.id)} className="flex w-full items-center gap-5 py-5 text-left">
                <span className="font-mono text-sm text-muted-foreground">{m.id}</span>
                <span className="flex-1 font-serif text-lg font-semibold">{m.name}</span>
                <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:flex">
                  {(["live", "plan", "later", "todo"] as Status[]).map((s) => (
                    <div key={s} className={statusClass[s]} style={{ width: `${(m[s] / m.total) * 100}%` }} />
                  ))}
                </div>
                <span className="w-12 text-right font-mono text-sm tabular-nums text-muted-foreground">
                  {Math.round((m.live / m.total) * 100)}%
                </span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300 ease-smooth", isOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-300 ease-smooth", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <div className="space-y-4 pb-6 pl-10">
                    <div className="flex flex-wrap gap-2">
                      {m.sections.map((s) => (
                        <span key={s} className="rounded-md bg-muted px-2.5 py-1 text-sm">{s}</span>
                      ))}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      共 {m.total} 个知识点 · 已有 {m.live} · 规划 {m.plan + m.later} · 待开发 {m.todo}
                    </p>
                    {related.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {related.map((l) => (
                          <Link key={l.id} to="/labs/$id" params={{ id: l.id }} className="rounded-md border border-primary/30 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-accent">
                            ▸ {l.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
