import { useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";

type Species = "human" | "corn" | "seawater";
type Domain = "cell" | "crust";

/** 大量元素(约占细胞干重 ≥ 0.01%) */
const MACRO_ELS = ["C", "H", "O", "N", "P", "S", "K", "Ca", "Mg"] as const;
/** 微量元素 */
const MICRO_ELS = ["Fe", "Mn", "Zn", "Cu", "B", "Mo"] as const;

/** 各样本元素质量分数(%) */
const SPECIES_DATA: Record<Species, readonly { el: string; pct: number }[]> = {
  human: [
    { el: "O", pct: 65 }, { el: "C", pct: 18 }, { el: "H", pct: 10 },
    { el: "N", pct: 3 }, { el: "Ca", pct: 1.5 }, { el: "P", pct: 1.1 },
    { el: "K", pct: 0.35 }, { el: "S", pct: 0.25 }, { el: "Mg", pct: 0.05 },
  ],
  corn: [
    { el: "O", pct: 44.4 }, { el: "C", pct: 43.6 }, { el: "H", pct: 6.2 },
    { el: "N", pct: 1.5 }, { el: "K", pct: 0.9 }, { el: "Ca", pct: 0.23 },
    { el: "P", pct: 0.2 }, { el: "Mg", pct: 0.18 }, { el: "S", pct: 0.17 },
  ],
  seawater: [
    { el: "O", pct: 85.7 }, { el: "H", pct: 10.8 }, { el: "Cl", pct: 1.9 },
    { el: "Na", pct: 1.05 }, { el: "Mg", pct: 0.14 }, { el: "S", pct: 0.09 },
    { el: "Ca", pct: 0.04 }, { el: "K", pct: 0.04 }, { el: "C", pct: 0.003 },
  ],
};

/** 地壳元素丰度(质量分数 %) */
const CRUST_DATA = [
  { el: "O", pct: 48.6 }, { el: "Si", pct: 26.3 }, { el: "Al", pct: 7.7 },
  { el: "Fe", pct: 4.8 }, { el: "Ca", pct: 3.5 }, { el: "Na", pct: 2.7 },
];

const SPECIES_LABEL: Record<Species, string> = { human: "人体", corn: "玉米", seawater: "海水" };

const fmt = (v: number) => (v >= 1 ? v.toFixed(1) : v.toFixed(3));

export function CellElements() {
  const [species, setSpecies] = useState<Species>("human");
  const [domain, setDomain] = useState<Domain>("cell");

  const bars = domain === "cell" ? SPECIES_DATA[species].slice(0, 6) : CRUST_DATA;
  const maxPct = Math.max(...bars.map((b) => b.pct));
  const pctOf = (el: string) => SPECIES_DATA[species].find((e) => e.el === el)?.pct ?? 0;
  const hot = (el: string) => bars.some((b) => b.el === el);

  return (
    <>
      <Stage caption="元素周期表局部 · 描边 = 当前含量居前的元素">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 左:大量元素分层(周期表样式) */}
          <text x="14" y="24" fontSize="10.5" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
            大量元素(≥ 0.01%)
          </text>
          {MACRO_ELS.map((el, i) => (
            <g key={el}>
              <rect
                x={14 + (i % 3) * 47}
                y={34 + Math.floor(i / 3) * 37}
                width="42"
                height="32"
                rx="5"
                fill="oklch(0.45 0.09 150)"
                stroke={hot(el) ? "var(--signal)" : "none"}
                strokeWidth="2"
              />
              <text
                x={35 + (i % 3) * 47}
                y={55 + Math.floor(i / 3) * 37}
                textAnchor="middle"
                fontSize="13"
                fill="oklch(0.97 0.01 150)"
                fontFamily="var(--font-mono)"
              >
                {el}
              </text>
            </g>
          ))}
          {/* 微量元素小格 */}
          <text x="14" y="160" fontSize="10.5" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
            微量元素(&lt; 0.01%)
          </text>
          {MICRO_ELS.map((el, i) => (
            <g key={el}>
              <rect
                x={14 + i * 24}
                y="168"
                width="21"
                height="17"
                rx="3"
                fill="oklch(0.45 0.09 150 / 0.35)"
                stroke={hot(el) ? "var(--signal)" : "none"}
                strokeWidth="1.5"
              />
              <text x={24.5 + i * 24} y="180.5" textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                {el}
              </text>
            </g>
          ))}
          <text x="14" y="212" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            组成细胞的元素在无机自然界
          </text>
          <text x="14" y="225" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            都能找到,且以化合物形式存在
          </text>

          {/* 右:含量条形图 */}
          <text x="280" y="24" textAnchor="middle" fontSize="10.5" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
            {domain === "cell" ? `${SPECIES_LABEL[species]}含量前六` : "地壳丰度前六"}
          </text>
          {bars.map((b, i) => {
            const w = (b.pct / maxPct) * 150;
            const y = 44 + i * 30;
            const isC = domain === "cell" && b.el === "C";
            return (
              <g key={b.el}>
                <text x="174" y={y + 12} fontSize="11" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">
                  {b.el}
                </text>
                <rect
                  x="196"
                  y={y}
                  width={Math.max(2, w)}
                  height="15"
                  rx="3"
                  fill={domain === "cell" ? "var(--specimen)" : "var(--membrane)"}
                  stroke={isC ? "var(--signal)" : "none"}
                  strokeWidth="1.5"
                />
                <text x={198 + Math.max(2, w)} y={y + 11.5} fontSize="9.5" fill="var(--stage-foreground)" fillOpacity="0.8" fontFamily="var(--font-mono)">
                  {fmt(b.pct)}%
                </text>
                {isC && (
                  <text x="196" y={y - 3} fontSize="8" fill="var(--signal)" fontFamily="var(--font-mono)">
                    骨架元素
                  </text>
                )}
              </g>
            );
          })}
          <text x="280" y="240" textAnchor="middle" fontSize="9" fill="var(--stage-foreground)" fillOpacity="0.55" fontFamily="var(--font-mono)">
            {domain === "cell" ? "细胞最多:O、C、H" : "地壳最多:O、Si、Al"}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">样本来源</div>
          <Segmented
            value={species}
            onChange={setSpecies}
            options={[
              { value: "human", label: "人体" },
              { value: "corn", label: "玉米" },
              { value: "seawater", label: "海水" },
            ]}
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">含量对比对象</div>
          <Segmented
            value={domain}
            onChange={setDomain}
            options={[
              { value: "cell", label: "细胞组成" },
              { value: "crust", label: "地壳组成" },
            ]}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Readout label="C 占比" value={`${fmt(pctOf("C"))}%`} />
          <Readout label="O 占比" value={`${fmt(pctOf("O"))}%`} />
          <Readout label="H 占比" value={`${fmt(pctOf("H"))}%`} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {domain === "crust"
            ? "地壳中最多的是 O、Si、Al,而细胞中最多的是 O、C、H——生物界与非生物界元素含量差异巨大。"
            : species === "seawater"
              ? "海水以 O、H 为主(来自水),碳含量极低;细胞中 C 却稳居前二——C 是构成细胞的骨架元素。"
              : "细胞鲜重前三是 O、C、H;无论人体还是玉米,C 都是骨架元素,这与地壳(O、Si 最多)截然不同。"}
        </p>
      </div>
    </>
  );
}
