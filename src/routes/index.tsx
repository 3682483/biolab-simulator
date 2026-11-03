import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabCard } from "@/components/LabCard";
import { labs, modules } from "@/lib/labs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "生命实验室 · 高中生物虚拟仿真实验平台" },
      { name: "description", content: "专业极简的高中生物虚拟仿真实验：显微镜、渗透作用、光合作用、有丝分裂、PCR，可交互、可操作。" },
      { property: "og:title", content: "生命实验室 · 高中生物虚拟仿真实验平台" },
      { property: "og:description", content: "可交互的生物学科模型与实验操作可视化平台。" },
    ],
  }),
  component: Index,
});

function Index() {
  const total = modules.reduce((s, m) => s + m.total, 0);
  const live = modules.reduce((s, m) => s + m.live, 0);
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-28">
        <div className="grid items-center gap-12 md:grid-cols-[1.2fr_1fr]">
          <div className="animate-rise">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Virtual Biology Lab</p>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-6xl">
              在指尖上
              <br />
              做生物实验
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
              覆盖高中生物 10 大模块的互动模型。调节每一个变量，实时看见生命过程的变化。
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg">
                <Link to="/labs">
                  进入实验 <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/map">浏览知识地图</Link>
              </Button>
            </div>
          </div>
          <HeroCell />
        </div>
        <dl className="mt-20 grid grid-cols-3 border-y py-6">
          {[
            ["10", "知识模块"],
            [String(total), "知识点"],
            [String(live), "已有互动资源"],
          ].map(([n, l]) => (
            <div key={l} className="px-2">
              <dt className="font-mono text-3xl tabular-nums md:text-4xl">{n}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{l}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-semibold">精选实验</h2>
          <Link to="/labs" className="text-sm text-muted-foreground hover:text-foreground">全部 →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((l, i) => (
            <LabCard key={l.id} lab={l} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

function HeroCell() {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-stage">
      <div className="absolute inset-0 grid-bench opacity-40" />
      <svg viewBox="-100 -100 200 200" className="relative h-full w-full">
        <g className="origin-center animate-[spin_60s_linear_infinite]">
          <ellipse rx="78" ry="62" fill="oklch(0.7 0.06 160 / 0.08)" stroke="var(--specimen)" strokeWidth="1" />
          <ellipse rx="72" ry="56" fill="none" stroke="var(--specimen)" strokeOpacity="0.3" strokeDasharray="2 3" />
          <circle cx="-8" cy="-4" r="22" fill="oklch(0.5 0.1 330 / 0.25)" stroke="var(--signal)" strokeWidth="0.8" />
          <circle cx="-4" cy="-8" r="6" fill="var(--signal)" opacity="0.7" />
          {[[40, 20], [30, -30], [-40, 30], [45, -5], [-45, -20]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="9" ry="4.5" transform={`rotate(${i * 40} ${x} ${y})`} fill="oklch(0.6 0.13 150 / 0.4)" stroke="var(--specimen)" strokeWidth="0.6" />
          ))}
        </g>
      </svg>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-widest text-stage-foreground/60">CELL · 400×</div>
    </div>
  );
}
