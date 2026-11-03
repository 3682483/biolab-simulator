import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { labs, legacyLabs, statusLabel, type Status } from "@/lib/labs";
import { knowledgeMap } from "@/data/knowledge-map";
import { remadeTopicLinks } from "@/data/remade/topic-links";
import { knowledgeSims } from "@/data/ksims";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "知识地图 · 生命实验室" },
      {
        name: "description",
        content: "高中生物 10 大模块、44 个分类、200 个知识点的三级知识地图与实验覆盖。",
      },
      { property: "og:title", content: "知识地图 · 生命实验室" },
      { property: "og:description", content: "模块 → 分类 → 知识点，附自研实验与参考资源覆盖情况。" },
    ],
  }),
  component: MapPage,
});

const planClass: Record<Status, string> = {
  live: "bg-status-live",
  plan: "bg-status-plan",
  later: "bg-status-later",
  todo: "bg-status-todo",
};

const planText: Record<Status, string> = {
  live: "text-status-live",
  plan: "text-status-plan",
  later: "text-status-later",
  todo: "text-status-todo",
};

function MapPage() {
  const [open, setOpen] = useState<string | null>("module-01");

  // 知识点 → 自研实验反查表
  const topicLabs = useMemo(() => {
    const map = new Map<string, typeof labs>();
    for (const lab of labs)
      for (const t of lab.topics) map.set(t, [...(map.get(t) ?? []), lab]);
    return map;
  }, []);
  // 知识点 → 自研重制实验反查表（来自参考库、已用自研框架重做）
  const topicRemade = useMemo(() => {
    const map = new Map<string, typeof legacyLabs>();
    for (const [id, topics] of Object.entries(remadeTopicLinks)) {
      const lab = legacyLabs.find((l) => l.id === id);
      if (!lab) continue;
      for (const t of topics) map.set(t, [...(map.get(t) ?? []), lab]);
    }
    return map;
  }, []);
  const coveredCount = useMemo(
    () => knowledgeMap.reduce((s, m) => s + m.sections.reduce((n, sec) => n + sec.topics.filter((t) => topicLabs.has(t.id) || topicRemade.has(t.id) || knowledgeSims[t.id]).length, 0), 0),
    [topicLabs, topicRemade],
  );
  const totalTopics = knowledgeMap.reduce((s, m) => s + m.sections.reduce((n, sec) => n + sec.topics.length, 0), 0);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 回到首页
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold">知识地图</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        10 个模块 · 44 个分类 · {totalTopics} 个知识点全部开发完成，每个知识点都挂接自研资源（
        <span className="text-primary">自研仿真</span> / <span className="text-status-live">自研重制</span> /{" "}
        <span className="text-foreground">知识点微实验</span>），覆盖 {coveredCount}/{totalTopics}。
      </p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          本平台 · 自研仿真
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-status-live" />
          本平台 · 自研重制
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-primary/60 bg-primary/10" />
          本平台 · 知识点微实验
        </span>
      </div>

      <ul className="mt-8 divide-y border-y">
        {knowledgeMap.map((m) => {
          const isOpen = open === m.id;
          const num = m.id.replace("module-", "");
          const moduleLabs = labs.filter((l) => l.module === num);
          return (
            <li key={m.id}>
              <button
                onClick={() => setOpen(isOpen ? null : m.id)}
                className="flex w-full items-center gap-5 py-5 text-left"
              >
                <span className="font-mono text-sm text-muted-foreground">{num}</span>
                <span className="flex-1 font-serif text-lg font-semibold">{m.title.replace(/^模块[一二三四五六七八九十]+、\s*/, "")}</span>
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  {m.sections.length} 分类 · {m.sections.reduce((n, s) => n + s.topics.length, 0)} 知识点 ·{" "}
                  {moduleLabs.length} 仿真
                </span>
                <ChevronDown
                  className={cn("size-4 text-muted-foreground transition-transform duration-300 ease-smooth", isOpen && "rotate-180")}
                />
              </button>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-smooth",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-6 pb-8 pl-2 md:pl-10">
                    {moduleLabs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {moduleLabs.map((l) => (
                          <Link
                            key={l.id}
                            to="/labs/$id"
                            params={{ id: l.id }}
                            search={{ from: "map" }}
                            className="rounded-md border border-primary/30 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-accent"
                          >
                            ▸ {l.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {m.sections.map((sec) => (
                      <div key={sec.id}>
                        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">{sec.title}</h3>
                        <ul className="mt-2 grid gap-1.5">
                          {sec.topics.map((t) => {
                            const related = topicLabs.get(t.id);
                            const remade = topicRemade.get(t.id);
                            const ksim = knowledgeSims[t.id];
                            const covered = !!(related?.length || remade?.length || ksim);
                            return (
                              <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                <span className={cn("size-1.5 shrink-0 rounded-full", covered ? "bg-primary" : planClass[t.plan])} />
                                <span className="text-foreground/90">{t.title.replace(/^\d+\.\s*/, "")}</span>
                                {related?.map((l) => (
                                  <Link
                                    key={l.id}
                                    to="/labs/$id"
                                    params={{ id: l.id }}
                                    search={{ from: "map" }}
                                    className="rounded bg-accent px-1.5 py-0.5 text-xs text-primary transition-colors hover:bg-accent/80"
                                  >
                                    {l.title} →
                                  </Link>
                                ))}
                                {remade?.map((l) => (
                                  <Link
                                    key={l.id}
                                    to="/labs/$id"
                                    params={{ id: l.id }}
                                    search={{ from: "map" }}
                                    className="rounded border border-status-live/40 bg-status-live/10 px-1.5 py-0.5 text-xs text-status-live transition-colors hover:bg-status-live/20"
                                  >
                                    {l.title} ↻
                                  </Link>
                                ))}
                                {!related?.length && !remade?.length && ksim && (
                                  <Link
                                    to="/labs/$id"
                                    params={{ id: t.id }}
                                    search={{ from: "map" }}
                                    className="rounded border border-dashed border-primary/60 bg-primary/5 px-1.5 py-0.5 text-xs text-primary transition-colors hover:bg-primary/10"
                                  >
                                    ◈ 微实验 · {ksim.title}
                                  </Link>
                                )}
                                {!covered && (
                                  <span className={cn("text-xs", planText[t.plan])}>{statusLabel[t.plan]}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
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
