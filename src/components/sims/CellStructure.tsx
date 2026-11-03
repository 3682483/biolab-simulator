import { useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";

type View = "animal" | "plant";
type OrgId = "nucleus" | "nucleolus" | "er" | "golgi" | "mito" | "ribo" | "lyso" | "centriole" | "vacuole" | "chloroplast";

/** 细胞器信息:名称 / 功能 / 膜结构 */
const INFO: Record<OrgId, { name: string; func: string; membrane: string }> = {
  nucleus: { name: "细胞核", func: "遗传信息库,细胞代谢和遗传的控制中心", membrane: "双层膜(具核孔)" },
  nucleolus: { name: "核仁", func: "与 rRNA 的合成及核糖体的装配有关", membrane: "无膜" },
  er: { name: "内质网", func: "蛋白质的加工运输,以及脂质合成的车间", membrane: "单层膜" },
  golgi: { name: "高尔基体", func: "对蛋白质进行加工、分类、包装和发送", membrane: "单层膜" },
  mito: { name: "线粒体", func: "有氧呼吸的主要场所,细胞的动力车间", membrane: "双层膜" },
  ribo: { name: "核糖体", func: "把氨基酸脱水缩合成肽链的装配机器", membrane: "无膜" },
  lyso: { name: "溶酶体", func: "消化车间,分解衰老细胞器和吞噬的病毒", membrane: "单层膜" },
  centriole: { name: "中心体", func: "与细胞有丝分裂时纺锤体的形成有关", membrane: "无膜" },
  vacuole: { name: "液泡", func: "调节细胞内环境,维持细胞渗透压", membrane: "单层膜" },
  chloroplast: { name: "叶绿体", func: "光合作用的场所,养料制造车间", membrane: "双层膜" },
};

const ANIMAL_IDS: OrgId[] = ["nucleus", "nucleolus", "er", "golgi", "mito", "ribo", "lyso", "centriole"];
const PLANT_IDS: OrgId[] = ["nucleus", "nucleolus", "er", "golgi", "mito", "ribo", "lyso", "vacuole", "chloroplast"];

const Label = ({ x, y, children }: { x: number; y: number; children: string }) => (
  <text x={x} y={y} textAnchor="middle" fontSize="8.5" fill="var(--stage-foreground)" fillOpacity="0.65" fontFamily="var(--font-mono)">
    {children}
  </text>
);

export function CellStructure() {
  const [view, setView] = useState<View>("animal");
  const [selected, setSelected] = useState<OrgId | null>(null);
  const [explored, setExplored] = useState<ReadonlySet<OrgId>>(new Set());

  const click = (id: OrgId) => () => {
    setSelected(id);
    setExplored((s) => {
      if (s.has(id)) return s;
      const next = new Set(s);
      next.add(id);
      return next;
    });
  };
  const ids = view === "animal" ? ANIMAL_IDS : PLANT_IDS;
  const done = ids.filter((id) => explored.has(id)).length;
  const on = (id: OrgId, base: string) => (selected === id ? "var(--signal)" : base);
  const lw = (id: OrgId, base = 1.6) => (selected === id ? 2.6 : base);

  return (
    <>
      <Stage caption={view === "animal" ? "动物细胞剖面 · 点击细胞器查看功能" : "植物细胞剖面 · 点击细胞器查看功能"}>
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {view === "animal" ? (
            <g>
              {/* 细胞膜与细胞质 */}
              <ellipse cx="200" cy="162" rx="180" ry="142" fill="oklch(0.72 0.07 130 / 0.10)" stroke="var(--specimen)" strokeWidth="2" />
              {/* 细胞核(双层膜 + 核孔) */}
              <g onClick={click("nucleus")} className="cursor-pointer">
                <circle cx="142" cy="132" r="54" fill="oklch(0.6 0.1 300 / 0.22)" stroke={on("nucleus", "var(--stage-foreground)")} strokeWidth={lw("nucleus", 2)} />
                <circle cx="142" cy="132" r="48" fill="none" stroke={on("nucleus", "var(--stage-foreground)")} strokeOpacity="0.35" strokeWidth="1.5" />
                <circle cx="142" cy="78" r="2.6" fill="var(--stage-foreground)" />
                <circle cx="188" cy="110" r="2.6" fill="var(--stage-foreground)" />
                <circle cx="172" cy="180" r="2.6" fill="var(--stage-foreground)" />
                <Label x={142} y={206}>细胞核</Label>
              </g>
              {/* 核仁 */}
              <g onClick={click("nucleolus")} className="cursor-pointer">
                <circle cx="155" cy="120" r="15" fill="oklch(0.48 0.13 300)" stroke={on("nucleolus", "none")} strokeWidth="1.5" />
                <Label x={155} y={96}>核仁</Label>
              </g>
              {/* 内质网(粗面,附核糖体颗粒) */}
              <g onClick={click("er")} className="cursor-pointer">
                <path d="M192 100 C230 84 262 116 240 140 S252 176 218 190" fill="none" stroke={on("er", "var(--stage-foreground)")} strokeWidth={lw("er")} />
                <path d="M192 108 C230 92 262 124 240 148 S252 184 218 198" fill="none" stroke={on("er", "var(--stage-foreground)")} strokeWidth={lw("er")} />
                <circle cx="228" cy="96" r="1.8" fill="var(--stage-foreground)" />
                <circle cx="252" cy="130" r="1.8" fill="var(--stage-foreground)" />
                <circle cx="238" cy="168" r="1.8" fill="var(--stage-foreground)" />
                <Label x={238} y={80}>内质网</Label>
              </g>
              {/* 高尔基体(叠层 + 囊泡) */}
              <g onClick={click("golgi")} className="cursor-pointer">
                <path d="M290 106 q18 -14 44 -2" fill="none" stroke={on("golgi", "var(--membrane)")} strokeWidth="4" strokeLinecap="round" />
                <path d="M290 114 q18 -14 44 -2" fill="none" stroke={on("golgi", "var(--membrane)")} strokeWidth="4" strokeLinecap="round" />
                <path d="M290 122 q18 -14 44 -2" fill="none" stroke={on("golgi", "var(--membrane)")} strokeWidth="4" strokeLinecap="round" />
                <circle cx="344" cy="130" r="3" fill={on("golgi", "var(--membrane)")} />
                <Label x={312} y={86}>高尔基体</Label>
              </g>
              {/* 线粒体(双层膜 + 内脊) */}
              <g onClick={click("mito")} className="cursor-pointer">
                <ellipse cx="98" cy="246" rx="36" ry="17" fill="oklch(0.66 0.11 60 / 0.8)" stroke={on("mito", "var(--stage-foreground)")} strokeWidth={lw("mito", 1)} />
                <path d="M88 238 q5 8 0 16 M98 236 q5 10 0 20 M108 238 q5 8 0 16" fill="none" stroke="oklch(0.45 0.1 60)" strokeWidth="1.5" />
                <Label x={98} y={278}>线粒体</Label>
              </g>
              {/* 核糖体(游离颗粒簇) */}
              <g onClick={click("ribo")} className="cursor-pointer">
                <rect x="236" y="222" width="36" height="42" fill="transparent" />
                <circle cx="252" cy="238" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="262" cy="230" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="244" cy="228" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="268" cy="244" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="256" cy="252" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <Label x={254} y={266}>核糖体</Label>
              </g>
              {/* 溶酶体 */}
              <g onClick={click("lyso")} className="cursor-pointer">
                <circle cx="76" cy="192" r="13" fill="oklch(0.62 0.14 25 / 0.85)" stroke={on("lyso", "var(--stage-foreground)")} strokeWidth={lw("lyso", 1)} />
                <circle cx="72" cy="190" r="1.6" fill="oklch(0.4 0.12 25)" />
                <circle cx="80" cy="194" r="1.6" fill="oklch(0.4 0.12 25)" />
                <Label x={76} y={172}>溶酶体</Label>
              </g>
              {/* 中心体(两个互相垂直的中心粒) */}
              <g onClick={click("centriole")} className="cursor-pointer">
                <rect x="310" y="219" width="24" height="9" rx="2" fill={on("centriole", "var(--membrane)")} />
                <rect x="317.5" y="211.5" width="9" height="24" rx="2" fill={on("centriole", "var(--membrane)")} />
                <Label x={322} y={248}>中心体</Label>
              </g>
            </g>
          ) : (
            <g>
              {/* 细胞壁 + 细胞膜 */}
              <rect x="10" y="16" width="380" height="288" rx="30" fill="none" stroke="var(--specimen)" strokeWidth="5" />
              <rect x="21" y="27" width="358" height="266" rx="23" fill="oklch(0.72 0.07 130 / 0.08)" stroke="var(--specimen)" strokeWidth="1.5" />
              <text x="52" y="14" fontSize="8" fill="var(--stage-foreground)" fillOpacity="0.6" fontFamily="var(--font-mono)">细胞壁</text>
              {/* 细胞核 */}
              <g onClick={click("nucleus")} className="cursor-pointer">
                <circle cx="98" cy="88" r="42" fill="oklch(0.6 0.1 300 / 0.22)" stroke={on("nucleus", "var(--stage-foreground)")} strokeWidth={lw("nucleus", 2)} />
                <circle cx="98" cy="88" r="37" fill="none" stroke={on("nucleus", "var(--stage-foreground)")} strokeOpacity="0.35" strokeWidth="1.5" />
                <circle cx="98" cy="46" r="2.4" fill="var(--stage-foreground)" />
                <circle cx="132" cy="72" r="2.4" fill="var(--stage-foreground)" />
                <Label x={98} y={146}>细胞核</Label>
              </g>
              {/* 核仁 */}
              <g onClick={click("nucleolus")} className="cursor-pointer">
                <circle cx="110" cy="80" r="12" fill="oklch(0.48 0.13 300)" stroke={on("nucleolus", "none")} strokeWidth="1.5" />
                <Label x={110} y={58}>核仁</Label>
              </g>
              {/* 内质网 */}
              <g onClick={click("er")} className="cursor-pointer">
                <path d="M66 158 C92 144 122 174 98 194 S130 212 144 200" fill="none" stroke={on("er", "var(--stage-foreground)")} strokeWidth={lw("er")} />
                <path d="M66 165 C92 151 122 181 98 201 S130 219 144 207" fill="none" stroke={on("er", "var(--stage-foreground)")} strokeWidth={lw("er")} />
                <Label x={104} y={226}>内质网</Label>
              </g>
              {/* 高尔基体 */}
              <g onClick={click("golgi")} className="cursor-pointer">
                <path d="M168 72 q16 -12 40 -2" fill="none" stroke={on("golgi", "var(--membrane)")} strokeWidth="4" strokeLinecap="round" />
                <path d="M168 80 q16 -12 40 -2" fill="none" stroke={on("golgi", "var(--membrane)")} strokeWidth="4" strokeLinecap="round" />
                <path d="M168 88 q16 -12 40 -2" fill="none" stroke={on("golgi", "var(--membrane)")} strokeWidth="4" strokeLinecap="round" />
                <circle cx="216" cy="94" r="3" fill={on("golgi", "var(--membrane)")} />
                <Label x={188} y={54}>高尔基体</Label>
              </g>
              {/* 线粒体 */}
              <g onClick={click("mito")} className="cursor-pointer">
                <ellipse cx="320" cy="262" rx="24" ry="13" fill="oklch(0.66 0.11 60 / 0.8)" stroke={on("mito", "var(--stage-foreground)")} strokeWidth={lw("mito", 1)} />
                <path d="M313 256 q4 6 0 12 M321 254 q4 8 0 16 M329 256 q4 6 0 12" fill="none" stroke="oklch(0.45 0.1 60)" strokeWidth="1.4" />
                <Label x={320} y={290}>线粒体</Label>
              </g>
              {/* 叶绿体(三处,含片层) */}
              <g onClick={click("chloroplast")} className="cursor-pointer">
                <ellipse cx="78" cy="222" rx="24" ry="13" fill="oklch(0.62 0.15 145 / 0.9)" stroke={on("chloroplast", "var(--stage-foreground)")} strokeWidth={lw("chloroplast", 1)} />
                <path d="M68 218 h8 M80 218 h8 M70 226 h8 M82 226 h8" stroke="oklch(0.4 0.12 145)" strokeWidth="1.4" />
                <ellipse cx="334" cy="64" rx="24" ry="13" fill="oklch(0.62 0.15 145 / 0.9)" stroke={on("chloroplast", "var(--stage-foreground)")} strokeWidth={lw("chloroplast", 1)} />
                <path d="M324 60 h8 M336 60 h8 M326 68 h8 M338 68 h8" stroke="oklch(0.4 0.12 145)" strokeWidth="1.4" />
                <ellipse cx="348" cy="150" rx="21" ry="12" fill="oklch(0.62 0.15 145 / 0.9)" stroke={on("chloroplast", "var(--stage-foreground)")} strokeWidth={lw("chloroplast", 1)} />
                <Label x={334} y={42}>叶绿体</Label>
              </g>
              {/* 液泡 */}
              <g onClick={click("vacuole")} className="cursor-pointer">
                <ellipse cx="222" cy="208" rx="96" ry="56" fill="oklch(0.85 0.09 110 / 0.35)" stroke={on("vacuole", "oklch(0.7 0.1 110)")} strokeWidth={lw("vacuole", 1.4)} />
                <Label x={222} y={212}>液泡</Label>
              </g>
              {/* 核糖体 */}
              <g onClick={click("ribo")} className="cursor-pointer">
                <rect x="142" y="100" width="36" height="36" fill="transparent" />
                <circle cx="158" cy="116" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="168" cy="110" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="150" cy="108" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <circle cx="166" cy="124" r="2.2" fill={on("ribo", "var(--stage-foreground)")} />
                <Label x={158} y={136}>核糖体</Label>
              </g>
              {/* 溶酶体 */}
              <g onClick={click("lyso")} className="cursor-pointer">
                <circle cx="52" cy="180" r="11" fill="oklch(0.62 0.14 25 / 0.85)" stroke={on("lyso", "var(--stage-foreground)")} strokeWidth={lw("lyso", 1)} />
                <Label x={52} y={160}>溶酶体</Label>
              </g>
            </g>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">细胞类型</div>
          <Segmented
            value={view}
            onChange={(v) => {
              setView(v);
              setSelected(null);
            }}
            options={[
              { value: "animal", label: "动物细胞" },
              { value: "plant", label: "植物细胞" },
            ]}
          />
        </div>
        {/* 选中细胞器的信息卡 */}
        {selected ? (
          <div className="rounded-md border border-signal bg-card px-3 py-2.5">
            <div className="text-sm font-medium">
              {INFO[selected].name}
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">{INFO[selected].membrane}</span>
            </div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{INFO[selected].func}</div>
          </div>
        ) : (
          <div className="rounded-md border bg-card px-3 py-2.5 text-xs text-muted-foreground">点击画布中的细胞器,查看它的功能与膜结构。</div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Readout label="已探索细胞器" value={`${done}/${ids.length}`} tone={done === ids.length ? "good" : undefined} />
          <Readout label="选中膜结构" value={selected ? INFO[selected].membrane : "—"} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {selected
            ? `${INFO[selected].name}:${INFO[selected].func}。`
            : view === "plant"
              ? "植物细胞特有:细胞壁、叶绿体、成熟的大液泡,且无中心体。分泌蛋白路径:核糖体→内质网→高尔基体→细胞膜。"
              : "分泌蛋白的合成与运输:核糖体(合成肽链)→内质网(加工运输)→高尔基体(分类包装)→细胞膜(胞吐分泌)。"}
        </p>
      </div>
    </>
  );
}
