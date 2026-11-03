import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { type Lab, moduleName } from "@/lib/labs";

export function LabCard({ lab, index }: { lab: Lab; index: number }) {
  return (
    <Link
      to="/labs/$id"
      params={{ id: lab.id }}
      className="group animate-rise flex flex-col rounded-xl border bg-card p-6 transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>LAB-{String(index + 1).padStart(2, "0")}</span>
        <ArrowUpRight className="size-4 transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-8 font-serif text-xl font-semibold">{lab.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{lab.summary}</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-accent px-2 py-0.5 text-accent-foreground">{moduleName(lab.module)}</span>
        <span className="font-mono">≈ {lab.minutes} min</span>
      </div>
    </Link>
  );
}
