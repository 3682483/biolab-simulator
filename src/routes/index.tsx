import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabCard } from "@/components/LabCard";
import { useFrame } from "@/hooks/use-sim";
import { catalog, labs, legacyLabs } from "@/lib/labs";
import { remadeCount } from "@/data/remade";
import { knowledgeMap } from "@/data/knowledge-map";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "生命实验室 · 高中生物虚拟仿真实验平台" },
      {
        name: "description",
        content: `覆盖高中生物 10 大模块的 ${labs.length} 个自研互动仿真与 ${remadeCount} 个自研重制实验，共 ${catalog.length} 个，全部原生 React 实现。`,
      },
      { property: "og:title", content: "生命实验室 · 高中生物虚拟仿真实验平台" },
      { property: "og:description", content: "可交互的生物学科模型与实验操作可视化平台。" },
    ],
  }),
  component: Index,
});

function Index() {
  const topicCount = knowledgeMap.reduce((s, m) => s + m.sections.reduce((n, sec) => n + sec.topics.length, 0), 0);
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
              覆盖高中生物 10 大模块的自研互动模型，参考实验逐步重制为自研交互框架。调节每一个变量，实时看见生命过程的变化。
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
              <Button asChild size="lg" variant="outline">
                <Link to="/tools">
                  仿真模型库 <Boxes className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <HeroCell />
        </div>
        <dl className="mt-20 grid grid-cols-3 border-y py-6">
          {[
            [String(catalog.length), "互动实验"],
            [String(topicCount), "知识点"],
            [String(labs.length), "自研仿真"],
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
          <Link to="/labs" className="text-sm text-muted-foreground hover:text-foreground">
            全部 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.slice(0, 6).map((l, i) => (
            <LabCard key={l.id} entry={l} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

function HeroCell() {
  // 小细胞在视野内自由游动，碰到边缘反弹
  const pos = useRef({ x: -18, y: 12 });
  const vel = useRef({ x: 13, y: 9 });
  const rot = useRef(0);
  const [, force] = useState(0);

  useFrame((dt) => {
    const p = pos.current;
    const v = vel.current;
    p.x += v.x * dt;
    p.y += v.y * dt;
    rot.current += dt * 8;
    const R = 15; // 细胞半径
    const B = 84 - R; // 视野边界（留出外圈装饰）
    if (p.x > B) { p.x = B; v.x = -Math.abs(v.x); }
    else if (p.x < -B) { p.x = -B; v.x = Math.abs(v.x); }
    if (p.y > B) { p.y = B; v.y = -Math.abs(v.y); }
    else if (p.y < -B) { p.y = -B; v.y = Math.abs(v.y); }
    force((n) => n + 1);
  });

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-stage">
      <div className="absolute inset-0 grid-bench opacity-40" />
      <svg viewBox="-100 -100 200 200" className="relative h-full w-full">
        <g transform={`translate(${pos.current.x.toFixed(1)} ${pos.current.y.toFixed(1)})`}>
          <g transform={`rotate(${(rot.current % 360).toFixed(1)})`}>
            <circle r="15" fill="oklch(0.5 0.1 330 / 0.25)" stroke="var(--signal)" strokeWidth="0.8" />
            <circle cx="-3" cy="-5" r="4" fill="var(--signal)" opacity="0.7" />
            {[[9, 4], [-8, 6], [2, -9], [-9, -4], [7, -7]].map(([x, y], i) => (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="3.2"
                ry="1.7"
                transform={`rotate(${i * 40} ${x} ${y})`}
                fill="oklch(0.6 0.13 150 / 0.4)"
                stroke="var(--specimen)"
                strokeWidth="0.6"
              />
            ))}
          </g>
        </g>
      </svg>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-widest text-stage-foreground/60">
        CELL · 400×
      </div>
    </div>
  );
}
