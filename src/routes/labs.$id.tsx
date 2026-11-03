import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { findLab, findLegacy, moduleName } from "@/lib/labs";
import { Microscope } from "@/components/sims/Microscope";
import { Osmosis } from "@/components/sims/Osmosis";
import { Photosynthesis } from "@/components/sims/Photosynthesis";
import { Mitosis } from "@/components/sims/Mitosis";
import { PCR } from "@/components/sims/PCR";
import { CellElements } from "@/components/sims/CellElements";
import { ProteinStructure } from "@/components/sims/ProteinStructure";
import { NucleicAcid } from "@/components/sims/NucleicAcid";
import { CellMembrane } from "@/components/sims/CellMembrane";
import { CellStructure } from "@/components/sims/CellStructure";
import { Prokaryote } from "@/components/sims/Prokaryote";
import { MembraneTransport } from "@/components/sims/MembraneTransport";
import { EnzymeActivity } from "@/components/sims/EnzymeActivity";
import { AtpCycle } from "@/components/sims/AtpCycle";
import { CellularRespiration } from "@/components/sims/CellularRespiration";
import { PigmentChromatography } from "@/components/sims/PigmentChromatography";
import { CellCycle } from "@/components/sims/CellCycle";
import { Meiosis } from "@/components/sims/Meiosis";
import { Fertilization } from "@/components/sims/Fertilization";
import { Segregation } from "@/components/sims/Segregation";
import { IndependentAssortment } from "@/components/sims/IndependentAssortment";
import { SexLinked } from "@/components/sims/SexLinked";
import { HardyWeinberg } from "@/components/sims/HardyWeinberg";
import { DnaStructure } from "@/components/sims/DnaStructure";
import { DnaReplication } from "@/components/sims/DnaReplication";
import { Transcription } from "@/components/sims/Transcription";
import { Translation } from "@/components/sims/Translation";
import { CentralDogma } from "@/components/sims/CentralDogma";
import { GeneMutation } from "@/components/sims/GeneMutation";
import { ChromosomeVariation } from "@/components/sims/ChromosomeVariation";
import { NaturalSelection } from "@/components/sims/NaturalSelection";
import { InternalEnvironment } from "@/components/sims/InternalEnvironment";
import { ActionPotential } from "@/components/sims/ActionPotential";
import { BloodGlucose } from "@/components/sims/BloodGlucose";
import { Immunity } from "@/components/sims/Immunity";
import { Auxin } from "@/components/sims/Auxin";
import { PopulationGrowth } from "@/components/sims/PopulationGrowth";
import { EnergyFlow } from "@/components/sims/EnergyFlow";
import { CarbonCycle } from "@/components/sims/CarbonCycle";
import { GelElectrophoresis } from "@/components/sims/GelElectrophoresis";
import { FoodTests } from "@/components/sims/FoodTests";
import { RemadeHost } from "@/components/sims/frames/RemadeHost";
import { remadeLabs } from "@/data/remade";
import { findKnowledgeSim, knowledgeSims } from "@/data/ksims";
import { cn } from "@/lib/utils";

const sims: Record<string, ComponentType> = {
  microscope: Microscope,
  osmosis: Osmosis,
  photosynthesis: Photosynthesis,
  mitosis: Mitosis,
  pcr: PCR,
  "cell-elements": CellElements,
  "protein-structure": ProteinStructure,
  "nucleic-acid": NucleicAcid,
  "cell-membrane": CellMembrane,
  "cell-structure": CellStructure,
  prokaryote: Prokaryote,
  "membrane-transport": MembraneTransport,
  "enzyme-activity": EnzymeActivity,
  "atp-cycle": AtpCycle,
  "cellular-respiration": CellularRespiration,
  "pigment-chromatography": PigmentChromatography,
  "cell-cycle": CellCycle,
  meiosis: Meiosis,
  fertilization: Fertilization,
  segregation: Segregation,
  "independent-assortment": IndependentAssortment,
  "sex-linked": SexLinked,
  "hardy-weinberg": HardyWeinberg,
  "dna-structure": DnaStructure,
  "dna-replication": DnaReplication,
  transcription: Transcription,
  translation: Translation,
  "central-dogma": CentralDogma,
  "gene-mutation": GeneMutation,
  "chromosome-variation": ChromosomeVariation,
  "natural-selection": NaturalSelection,
  "internal-environment": InternalEnvironment,
  "action-potential": ActionPotential,
  "blood-glucose": BloodGlucose,
  immunity: Immunity,
  auxin: Auxin,
  "population-growth": PopulationGrowth,
  "energy-flow": EnergyFlow,
  "carbon-cycle": CarbonCycle,
  "gel-electrophoresis": GelElectrophoresis,
  "food-tests": FoodTests,
};

export const Route = createFileRoute("/labs/$id")({
  // 记录进入来源（?from=map），返回按钮据此回到知识地图而非目录
  validateSearch: (search: Record<string, unknown>): { from?: string } =>
    typeof search["from"] === "string" ? { from: search["from"] } : {},
  loader: ({ params }) => {
    // 三个来源：自研仿真 → 册别参考（已重制）→ 知识点微实验
    const lab = findLab(params.id) ?? findLegacy(params.id) ?? findKnowledgeSim(params.id);
    if (!lab) throw notFound();
    return { lab };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.lab.title} · 生命实验室` },
          {
            name: "description",
            content: "path" in loaderData.lab ? "本项目自研重制的交互仿真，原生 React 实现。" : loaderData.lab.summary,
          },
        ]
      : [{ title: "实验不可用 · 生命实验室" }, { name: "robots", content: "noindex" }],
  }),
  component: LabPage,
});

function LabPage() {
  const { lab } = Route.useLoaderData();
  const from = Route.useSearch()["from"];
  const fromMap = from === "map";
  const isLegacy = "path" in lab;
  const Sim = sims[lab.id];
  // 已重制的实验：用自研框架渲染，彻底摆脱 iframe 引用
  const remade = isLegacy ? remadeLabs[lab.id] : undefined;
  // 知识点微实验：知识地图上未挂实验的知识点，直接用同一套 7 框架渲染
  const ksim = !isLegacy ? knowledgeSims[lab.id] : undefined;
  const [done, setDone] = useState<number[]>([]);
  const steps = isLegacy ? null : lab.steps;
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link to={fromMap ? "/map" : "/labs"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {fromMap ? "知识地图" : "实验目录"}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            {moduleName(lab.module)}
            {isLegacy && " · 自研重制"}
            {ksim && " · 知识点微实验"}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">{lab.title}</h1>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          {isLegacy ? "本项目自研重制的交互仿真，原生 React 实现。" : lab.summary}
        </p>
      </div>

      <div key={lab.id} className="animate-rise mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {Sim ? (
          <Sim />
        ) : remade ? (
          <RemadeHost spec={remade} title={lab.title} />
        ) : ksim ? (
          <RemadeHost spec={ksim.spec} title={ksim.title} />
        ) : (
          <Microscope />
        )}
      </div>

      {steps?.length ? (
        <section className="mt-12 border-t pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-semibold">实验步骤</h2>
            <span className="font-mono text-sm text-muted-foreground">
              {done.length}/{steps.length}
            </span>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {steps.map((s, i) => (
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
      ) : null}
    </main>
  );
}
