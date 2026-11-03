import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LabCard } from "@/components/LabCard";
import { labs, moduleName } from "@/lib/labs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/labs/")({
  head: () => ({
    meta: [
      { title: "实验目录 · 生命实验室" },
      { name: "description", content: "按模块与关键词检索高中生物虚拟仿真实验。" },
      { property: "og:title", content: "实验目录 · 生命实验室" },
      { property: "og:description", content: "按模块与关键词检索高中生物虚拟仿真实验。" },
    ],
  }),
  component: LabsPage,
});

function LabsPage() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState<string | null>(null);
  const mods = Array.from(new Set(labs.map((l) => l.module)));
  const list = useMemo(
    () =>
      labs.filter(
        (l) => (!mod || l.module === mod) && (l.title + l.summary + l.tags.join("")).includes(q.trim()),
      ),
    [q, mod],
  );
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold">实验目录</h1>
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索实验、知识点…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[null, ...mods].map((m) => (
            <button
              key={m ?? "all"}
              onClick={() => setMod(m)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors duration-200",
                mod === m ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m ? moduleName(m) : "全部"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((l, i) => (
          <LabCard key={l.id} lab={l} index={i} />
        ))}
      </div>
      {list.length === 0 && <p className="mt-16 text-center text-muted-foreground">没有匹配的实验</p>}
    </main>
  );
}
