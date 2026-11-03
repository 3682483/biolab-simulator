import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { labs, moduleName } from "@/lib/labs";
import { Microscope } from "@/components/sims/Microscope";
import { Osmosis } from "@/components/sims/Osmosis";
import { Photosynthesis } from "@/components/sims/Photosynthesis";
import { Mitosis } from "@/components/sims/Mitosis";
import { PCR } from "@/components/sims/PCR";
import { cn } from "@/lib/utils";

const sims: Record<string, ComponentType> = {
  microscope: Microscope,
  osmosis: Osmosis,
  photosynthesis: Photosynthesis,
  mitosis: Mitosis,
  pcr: PCR,
};

export const Route = createFileRoute("/labs/$id")({
  loader: ({ params }) => {
    const lab = labs.find((l) => l.id === params.id);
    if (!lab) throw notFound();
    return { lab };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.lab.title} · 生命实验室` },
          { name: "description", content: loaderData.lab.summary },
          { property: "og:title", content: `${loaderData.lab.title} · 生命实验室` },
          { property: "og:description", content: loaderData.lab.summary },
        ]
      : [{ title: "实验不可用 · 生命实验室" }, { name: "robots", content: "noindex" }],
  }),
  component: LabPage,
});

function LabPage() {
  const { lab } = Route.useLoaderData();
  const Sim = sims[lab.id] ?? Microscope;
  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link to="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 实验目录
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{moduleName(lab.module)}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">{lab.title}</h1>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{lab.summary}</p>
      </div>

      <div key={lab.id} className="animate-rise mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Sim />
      </div>

      <section className="mt-12 border-t pt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold">实验步骤</h2>
          <span className="font-mono text-sm text-muted-foreground">
            {done.length}/{lab.steps.length}
          </span>
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {lab.steps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition-all duration-300 ease-smooth",
                  done.includes(i) && "border-primary/40 bg-accent",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors",
                    done.includes(i) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {done.includes(i) ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn("text-sm", done.includes(i) && "text-accent-foreground")}>{s}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
