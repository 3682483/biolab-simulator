import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LabCard } from "@/components/LabCard";
import { books, catalog, labs, legacyLabs, moduleName } from "@/lib/labs";
import { remadeCount } from "@/data/remade";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/labs/")({
  head: () => ({
    meta: [
      { title: "实验目录 · 生命实验室" },
      {
        name: "description",
        content: `按模块与教材册别检索 ${labs.length + legacyLabs.length} 个生物虚拟仿真实验。`,
      },
      { property: "og:title", content: "实验目录 · 生命实验室" },
      { property: "og:description", content: "高中生物虚拟仿真与参考实验统一目录。" },
    ],
  }),
  component: LabsPage,
});

const PAGE = 48;

function LabsPage() {
  const [q, setQ] = useState("");
  // 筛选维度：all=全部 / sim=自研仿真 / 模块号 / 册别分区 id
  const [group, setGroup] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(
    () =>
      catalog.filter(
        (l) =>
          (group === "all" || (group === "sim" ? l.kind === "sim" : l.module === group)) &&
          l.title.includes(q.trim()),
      ),
    [q, group],
  );

  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "全部", count: catalog.length },
    { key: "sim", label: "自研仿真", count: labs.length },
    ...books.map((b) => ({
      key: b.id,
      label: b.name,
      count: legacyLabs.filter((l) => l.module === b.id).length,
    })),
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 回到首页
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold">实验目录</h1>
        <p className="font-mono text-sm text-muted-foreground">
          自研仿真 {labs.length} + 自研重制 {remadeCount} = {catalog.length} 个 · 全部自研
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="搜索实验名称…"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground md:ml-auto">
          匹配 <span className="font-mono tabular-nums text-foreground">{list.length}</span> 个
          {group !== "sim" && group !== "all" && ` · ${moduleName(group)}`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setGroup(t.key);
              setShown(PAGE);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors duration-200",
              group === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-xs opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, shown).map((l, i) => (
          <LabCard key={l.id} entry={l} index={i} />
        ))}
      </div>
      {list.length > shown && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
            加载更多（剩余 {list.length - shown} 个）
          </Button>
        </div>
      )}
      {list.length === 0 && <p className="mt-16 text-center text-muted-foreground">没有匹配的实验</p>}
    </main>
  );
}
