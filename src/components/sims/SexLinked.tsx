import { useState } from "react";
import { Readout, Segmented, Stage } from "@/components/lab-ui";

// 血友病：X^H 正常（显性） X^h 患病（隐性）
const MOTHERS = [
  { key: "XHXH", label: "XᴴXᴴ 正常", gametes: ["Xᴴ", "Xᴴ"] },
  { key: "XHXh", label: "XᴴXʰ 携带", gametes: ["Xᴴ", "Xʰ"] },
  { key: "XhXh", label: "XʰXʰ 患者", gametes: ["Xʰ", "Xʰ"] },
] as const;
const FATHERS = [
  { key: "XHY", label: "XᴴY 正常", gametes: ["Xᴴ", "Y"] },
  { key: "XhY", label: "XʰY 患者", gametes: ["Xʰ", "Y"] },
] as const;

type Child = { geno: string; sex: "女" | "男"; ill: boolean; carrier: boolean; note: string };

const mk = (x: string, y: string): Child => {
  if (y === "Y") {
    const ill = x === "Xʰ";
    return { geno: `${x}Y`, sex: "男", ill, carrier: false, note: ill ? "男患者" : "正常男性" };
  }
  const h = x === "Xʰ" || y === "Xʰ";
  const both = x === "Xʰ" && y === "Xʰ";
  return { geno: `${x}${y}`, sex: "女", ill: both, carrier: h && !both, note: both ? "女患者" : h ? "正常（纯合）" : "携带者" };
};

const C_ILL = "var(--signal)";
const C_OK = "var(--stage-foreground)";

export function SexLinked() {
  const [mKey, setMKey] = useState<(typeof MOTHERS)[number]["key"]>("XHXh");
  const [fKey, setFKey] = useState<(typeof FATHERS)[number]["key"]>("XHY");
  const mother = MOTHERS.find((m) => m.key === mKey) ?? MOTHERS[0];
  const father = FATHERS.find((f) => f.key === fKey) ?? FATHERS[0];

  const grid: Child[][] = mother.gametes.map((g1) => father.gametes.map((g2) => mk(g1, g2)));
  const all = grid.flat();
  const ill = all.filter((c) => c.ill);
  const illM = all.filter((c) => c.ill && c.sex === "男").length;
  const illF = all.filter((c) => c.ill && c.sex === "女").length;

  const drawX = (x: number, y: number, label: string, color: string) => (
    <g>
      <line x1={x - 7} y1={y - 11} x2={x + 7} y2={y + 11} stroke={color} strokeWidth="3.4" strokeLinecap="round" />
      <line x1={x + 7} y1={y - 11} x2={x - 7} y2={y + 11} stroke={color} strokeWidth="3.4" strokeLinecap="round" />
      <text x={x} y={y + 26} fontSize="10" textAnchor="middle" fill={color} fontFamily="var(--font-mono)">
        {label}
      </text>
    </g>
  );

  return (
    <>
      <Stage caption="血友病：致病基因 h 位于 X 染色体上（隐性）">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 亲本性染色体 */}
          <g>
            {drawX(72, 76, mother.gametes.join("/"), "var(--stage-foreground)")}
            {drawX(152, 76, "X", "var(--stage-foreground)")}
            <line x1="152" y1="65" x2="152" y2="87" stroke={C_ILL} strokeWidth="3.4" strokeLinecap="round" opacity={father.key === "XhY" ? 1 : 0.25} />
            <line x1="166" y1="76" x2="186" y2="76" stroke="var(--stage-foreground)" strokeWidth="3.4" strokeLinecap="round" />
            <text x="172" y="102" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">Y</text>
            <text x="110" y="36" fontSize="11" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              母亲 {mother.label}
            </text>
            <text x="186" y="36" fontSize="11" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.7" fontFamily="var(--font-mono)">
              父亲 {father.label}
            </text>
          </g>
          {/* 棋盘 */}
          {father.gametes.map((g, j) => (
            <text key={`h${j}`} x={252 + j * 64} y="56" fontSize="13" textAnchor="middle" fill={g === "Xʰ" ? C_ILL : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
              精子 {g}
            </text>
          ))}
          {mother.gametes.map((g, i) => (
            <text key={`v${i}`} x="192" y={84 + i * 70 + 26} fontSize="13" textAnchor="end" fill={g === "Xʰ" ? C_ILL : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
              卵 {g}
            </text>
          ))}
          {grid.map((row, i) =>
            row.map((child, j) => (
              <g key={`${i}-${j}`}>
                <rect
                  x={228 + j * 64}
                  y={70 + i * 70}
                  width="56"
                  height="56"
                  rx="8"
                  fill={child.ill ? "oklch(0.55 0.18 25 / 0.18)" : child.carrier ? "oklch(0.7 0.1 260 / 0.14)" : "oklch(0.7 0.06 160 / 0.1)"}
                  stroke={child.ill ? C_ILL : "var(--stage-foreground)"}
                  strokeOpacity={child.ill ? 0.9 : 0.35}
                />
                <text x={256 + j * 64} y={94 + i * 70} fontSize="12" textAnchor="middle" fill={child.ill ? C_ILL : "var(--stage-foreground)"} fontFamily="var(--font-mono)">
                  {child.geno}
                </text>
                <text x={256 + j * 64} y={112 + i * 70} fontSize="9" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
                  {child.note}
                </text>
              </g>
            )),
          )}
          <text x="200" y="248" fontSize="10.5" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.65" fontFamily="var(--font-mono)">
            每格 25% 概率 · 患者 {ill.length}/4（男 {illM} · 女 {illF}）
          </text>
          <text x="200" y="272" fontSize="10.5" textAnchor="middle" fill="var(--signal)" opacity="0.9" fontFamily="var(--font-mono)">
            {mother.key === "XHXh" && father.key === "XhY" ? "携带者母亲 × 患病父亲 → 女儿 50% 患病" : "Xʰ 只随 X 染色体传递，男性只要一个 Xʰ 即患病"}
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={MOTHERS.map((m) => ({ value: m.key as string, label: m.label }))}
          value={mKey as string}
          onChange={(v) => setMKey(v as (typeof MOTHERS)[number]["key"])}
        />
        <Segmented
          options={FATHERS.map((f) => ({ value: f.key as string, label: f.label }))}
          value={fKey as string}
          onChange={(v) => setFKey(v as (typeof FATHERS)[number]["key"])}
        />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="后代患病概率" value={`${(ill.length * 25)}%`} tone={ill.length > 0 ? "warn" : undefined} />
          <Readout label="患者男女比" value={ill.length ? `${illM} : ${illF}` : "—"} />
          <Readout label="女儿携带概率" value={`${all.filter((c) => c.carrier).length * 25}%`} />
          <Readout label="儿子患病概率" value={`${all.filter((c) => c.sex === "男" && c.ill).length * 25}%`} tone={all.some((c) => c.sex === "男" && c.ill) ? "warn" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {illF > 0
            ? "女患者出现需要两个 Xʰ——父亲必须患病且母亲至少携带。这解释了 X 染色体隐性遗传“患者中男性远多于女性”。"
            : illM > 0
              ? "儿子的 X 染色体只能来自母亲——致病基因随母亲的 X 传给儿子即患病，表现为隔代交叉遗传。"
              : "正常组合后代全部正常。换一个亲本基因型，观察患者出现的规律。"}
        </p>
      </div>
    </>
  );
}
