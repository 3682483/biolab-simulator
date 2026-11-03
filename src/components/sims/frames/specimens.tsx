// 程序化显微标本绘制库：observe 框架的素材源。
// 每个标本是一个 draw(rand) 函数，在 400×320 圆形视野内作画；固定种子 PRNG 保证每次渲染一致。
import type { ReactNode } from "react";

export type SpecimenDraw = (rand: () => number) => ReactNode;

export interface Specimen {
  name: string;
  /** 视野背景色（oklch） */
  ground: string;
  draw: SpecimenDraw;
}

// mulberry32：固定种子伪随机，视野不闪烁
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const label = (x: number, y: number, text: string, anchor: "start" | "middle" | "end" = "middle") => (
  <text x={x} y={y} fontSize="10" textAnchor={anchor} fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">
    {text}
  </text>
);

/** 洋葱鳞叶内表皮：砖墙状排列，紫色大液泡，可见细胞核 */
const onionEpidermis: SpecimenDraw = (rand) => {
  const cells: ReactNode[] = [];
  let k = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const x = 30 + c * 46 + (r % 2) * 10;
      const y = 40 + r * 46;
      if (Math.hypot(x - 200, y - 165) > 150) continue;
      const nx = x + 14 + rand() * 8;
      const ny = y + 12 + rand() * 8;
      cells.push(
        <g key={k++}>
          <rect x={x} y={y} width="42" height="42" rx="4" fill="oklch(0.32 0.06 300 / 0.35)" stroke="oklch(0.6 0.1 300 / 0.9)" strokeWidth="1.6" />
          <rect x={x + 5} y={y + 5} width="32" height="32" rx="3" fill="oklch(0.42 0.12 310 / 0.5)" />
          <circle cx={nx} cy={ny} r="3.4" fill="oklch(0.68 0.1 25 / 0.95)" />
        </g>,
      );
    }
  }
  return (
    <>
      {cells}
      {label(200, 26, "细胞壁（加粗轮廓）· 液泡（紫色）· 细胞核（橙）")}
    </>
  );
};

/** 口腔上皮细胞：不规则扁平圆 + 深色核 */
const oralEpithelium: SpecimenDraw = (rand) => {
  const cells: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 70 + rand() * 260;
    const y = 60 + rand() * 210;
    if (Math.hypot(x - 200, y - 165) > 130) continue;
    const rx = 24 + rand() * 10;
    cells.push(
      <g key={i} opacity={0.55 + rand() * 0.4}>
        <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.72} fill="oklch(0.85 0.05 60 / 0.4)" stroke="oklch(0.6 0.08 60 / 0.95)" strokeWidth="1.8" />
        <circle cx={x + (rand() - 0.5) * 12} cy={y + (rand() - 0.5) * 8} r={5.5 + rand() * 2} fill="oklch(0.5 0.13 25 / 0.95)" />
      </g>,
    );
  }
  return (
    <>
      {cells}
      {label(200, 26, "扁平不规则 · 经亚甲基蓝染色后核呈深色")}
    </>
  );
};

/** 叶肉细胞（黑藻叶）：规则排列 + 密集叶绿体 */
const leafCells: SpecimenDraw = (rand) => {
  const cells: ReactNode[] = [];
  let k = 0;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const x = 60 + c * 46;
      const y = 45 + r * 40;
      if (Math.hypot(x - 200, y - 165) > 140) continue;
      const dots: ReactNode[] = [];
      for (let i = 0; i < 7; i++) {
        const a = rand() * Math.PI * 2;
        const d = 4 + rand() * 12;
        dots.push(<circle key={i} cx={x + 21 + Math.cos(a) * d} cy={y + 16 + Math.sin(a) * d * 0.8} r="2.6" fill="oklch(0.6 0.14 145 / 0.95)" />);
      }
      cells.push(
        <g key={k++}>
          <rect x={x} y={y} width="44" height="34" rx="5" fill="oklch(0.75 0.08 145 / 0.18)" stroke="oklch(0.62 0.1 145 / 0.9)" strokeWidth="1.4" />
          {dots}
        </g>,
      );
    }
  }
  return (
    <>
      {cells}
      {label(200, 26, "叶绿体（绿色颗粒）沿细胞边缘与内侧流动")}
    </>
  );
};

/** 根尖纵切：根冠→分生区→伸长区→成熟区 */
const rootTip: SpecimenDraw = (rand) => {
  const zones = [
    { name: "根冠", y: 250, c: "oklch(0.7 0.05 60 / 0.5)" },
    { name: "分生区", y: 195, c: "oklch(0.6 0.12 25 / 0.45)" },
    { name: "伸长区", y: 140, c: "oklch(0.72 0.08 145 / 0.4)" },
    { name: "成熟区（根毛）", y: 75, c: "oklch(0.68 0.1 145 / 0.5)" },
  ];
  const cells: ReactNode[] = [];
  let k = 0;
  zones.forEach((z, zi) => {
    for (let i = 0; i < 26; i++) {
      const x = 120 + (i % 7) * 24 + rand() * 6;
      const y = z.y + Math.floor(i / 7) * 16 + rand() * 4;
      const h = zi === 0 ? 14 : zi === 2 ? 30 : zi === 3 ? 34 : 12;
      cells.push(
        <rect key={k++} x={x} y={y} width={zi === 2 || zi === 3 ? 18 : 20} height={h} rx={zi === 0 ? 7 : 3} fill="oklch(0.8 0.06 90 / 0.35)" stroke="oklch(0.6 0.08 90 / 0.85)" strokeWidth="1" />,
      );
    }
  });
  const hairs: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const x = 124 + i * 16;
    hairs.push(<line key={i} x1={x} y1="70" x2={x - 14} y2="52" stroke="oklch(0.65 0.1 90 / 0.8)" strokeWidth="2" strokeLinecap="round" />);
  }
  return (
    <>
      {cells}
      {hairs}
      {zones.map((z) => (
        <g key={z.name}>
          <line x1="300" y1={z.y + 18} x2="330" y2={z.y + 18} stroke="var(--stage-foreground)" strokeOpacity="0.5" />
          {label(334, z.y + 21, z.name, "start")}
        </g>
      ))}
    </>
  );
};

/** 草履虫：鞋底形 + 纤毛 + 口沟 + 大小核 + 食物泡 */
const paramecium: SpecimenDraw = (rand) => {
  const cilia: ReactNode[] = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    const cx = 200 + 120 * Math.cos(t) * 0.92;
    const cy = 165 + 62 * Math.sin(t) * 0.98;
    cilia.push(
      <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(t) * 14} y2={cy + Math.sin(t) * 14} stroke="oklch(0.6 0.05 220 / 0.7)" strokeWidth="1.6" strokeLinecap="round" />,
    );
  }
  const vacuoles: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    vacuoles.push(<circle key={i} cx={165 + rand() * 70} cy={145 + rand() * 45} r={4 + rand() * 3} fill="oklch(0.7 0.12 95 / 0.6)" stroke="oklch(0.6 0.1 95 / 0.8)" />);
  }
  return (
    <>
      <path d="M80 165 C 80 105, 320 105, 320 165 C 320 225, 80 225, 80 165 Z" fill="oklch(0.78 0.06 100 / 0.3)" stroke="oklch(0.58 0.1 100 / 0.95)" strokeWidth="2" />
      <path d="M92 150 C 130 132, 175 130, 200 142" fill="none" stroke="oklch(0.6 0.1 100 / 0.8)" strokeWidth="3" strokeLinecap="round" />
      {cilia}
      {vacuoles}
      <circle cx="222" cy="158" r="9" fill="oklch(0.55 0.13 260 / 0.9)" />
      <circle cx="238" cy="172" r="5" fill="oklch(0.6 0.12 260 / 0.75)" />
      <circle cx="150" cy="118" r="11" fill="none" stroke="oklch(0.6 0.06 220 / 0.9)" strokeWidth="1.6" strokeDasharray="3 2" />
      <circle cx="256" cy="212" r="11" fill="none" stroke="oklch(0.6 0.06 220 / 0.9)" strokeWidth="1.6" strokeDasharray="3 2" />
      {label(258, 122, "收集管/伸缩泡", "start")}
      {label(238, 148, "大核 / 小核", "start")}
      {label(132, 142, "口沟", "end")}
      {label(200, 244, "表膜纤毛（运动）· 食物泡（消化）")}
    </>
  );
};

/** 水绵：丝状藻，螺旋带状叶绿体 */
const spirogyra: SpecimenDraw = (rand) => {
  const rows: ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    const y = 55 + r * 48;
    let d = `M70 ${y}`;
    for (let i = 0; i < 7; i++) d += ` q 20 ${rand() > 0.5 ? 8 : -8}, 38 0`;
    rows.push(
      <g key={r}>
        <path d={d} fill="none" stroke="oklch(0.55 0.08 145 / 0.5)" strokeWidth="2" />
        {[...Array(6)].map((_, i) => {
          const cx = 105 + i * 32;
          return (
            <g key={i}>
              <rect x={cx - 13} y={y - 14} width="26" height="28" rx="9" fill="oklch(0.78 0.08 100 / 0.15)" stroke="oklch(0.6 0.1 145 / 0.9)" strokeWidth="1.6" />
              <path d={`M ${cx - 9} ${y - 8} q 9 ${i % 2 ? 10 : -10}, 18 0 q -9 ${i % 2 ? -6 : 6}, -18 0`} fill="oklch(0.6 0.15 145 / 0.85)" />
            </g>
          );
        })}
      </g>,
    );
  }
  return (
    <>
      {rows}
      {label(200, 26, "单列细胞连成丝 · 螺旋带状叶绿体")}
    </>
  );
};

/** 酵母菌：卵形 + 出芽生殖 */
const yeast: SpecimenDraw = (rand) => {
  const cells: ReactNode[] = [];
  for (let i = 0; i < 22; i++) {
    const x = 80 + rand() * 240;
    const y = 60 + rand() * 210;
    if (Math.hypot(x - 200, y - 165) > 125) continue;
    const budding = rand() > 0.55;
    cells.push(
      <g key={i}>
        <ellipse cx={x} cy={y} rx="13" ry="16" fill="oklch(0.82 0.07 85 / 0.4)" stroke="oklch(0.6 0.1 85 / 0.95)" strokeWidth="1.6" />
        {budding && <circle cx={x + 12} cy={y - 12} r="6.5" fill="oklch(0.82 0.07 85 / 0.4)" stroke="oklch(0.6 0.1 85 / 0.95)" strokeWidth="1.4" />}
        <circle cx={x - 3} cy={y + 2} r="3" fill="oklch(0.65 0.1 260 / 0.9)" />
      </g>,
    );
  }
  return (
    <>
      {cells}
      {label(200, 26, "卵形细胞 · 出芽生殖（子细胞连在母体上）")}
    </>
  );
};

/** 青霉：直立的直立菌丝 + 扫帚状分生孢子梗 */
const penicillium: SpecimenDraw = (rand) => {
  const hyphae: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 100 + i * 48;
    const top = 70 + rand() * 25;
    hyphae.push(
      <g key={i}>
        <path d={`M ${x - 26} 285 q ${x - 40} 180, ${x} ${top + 40}`} fill="none" stroke="oklch(0.72 0.06 95 / 0.6)" strokeWidth="2" />
        <line x1={x} y1={top + 40} x2={x} y2={top} stroke="oklch(0.72 0.06 95 / 0.8)" strokeWidth="2.2" />
        {[-1, 1].map((s) => (
          <line key={s} x1={x} y1={top + 8} x2={x + s * 14} y2={top} stroke="oklch(0.72 0.06 95 / 0.8)" strokeWidth="1.8" />
        ))}
        {[...Array(9)].map((_, j) => {
          const bx = x - 20 + Math.floor(j / 3) * 18;
          const by = top - 4 - (j % 3) * 8;
          return <circle key={j} cx={bx} cy={by} r="4" fill="oklch(0.72 0.06 260 / 0.9)" />;
        })}
      </g>,
    );
  }
  return (
    <>
      {hyphae}
      {label(200, 300, "菌丝（无隔）· 扫帚状孢子梗 · 青绿色分生孢子")}
    </>
  );
};

/** 血涂片：中央凹陷的红细胞 + 少量白细胞 */
const bloodSmear: SpecimenDraw = (rand) => {
  const cells: ReactNode[] = [];
  for (let i = 0; i < 42; i++) {
    const x = 65 + rand() * 270;
    const y = 55 + rand() * 220;
    if (Math.hypot(x - 200, y - 165) > 135) continue;
    cells.push(
      <g key={i}>
        <circle cx={x} cy={y} r="10" fill="oklch(0.62 0.17 25 / 0.55)" stroke="oklch(0.55 0.16 25 / 0.9)" strokeWidth="1.2" />
        <circle cx={x} cy={y} r="4" fill="oklch(0.9 0.04 25 / 0.5)" />
      </g>,
    );
  }
  for (let i = 0; i < 3; i++) {
    const x = 110 + rand() * 180;
    const y = 90 + rand() * 150;
    const lobes: ReactNode[] = [];
    for (let j = 0; j < 3; j++) lobes.push(<circle key={j} cx={x + (j - 1) * 7} cy={y - 3 + (j % 2) * 5} r="7" fill="oklch(0.75 0.1 265 / 0.95)" />);
    cells.push(
      <g key={`w${i}`}>
        {lobes}
        <circle cx={x} cy={y + 10} r="9" fill="oklch(0.72 0.04 0 / 0.85)" opacity="0.85" />
      </g>,
    );
  }
  return (
    <>
      {cells}
      {label(200, 26, "红细胞（双凹圆饼、无核）· 白细胞（多形核，紫色）")}
    </>
  );
};

/** 叶表皮气孔：肾形保卫细胞成对围成气孔 */
const stomaSlide: SpecimenDraw = (rand) => {
  const items: ReactNode[] = [];
  const jag: ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const x = 60 + rand() * 280;
    const y = 50 + rand() * 230;
    if (Math.hypot(x - 200, y - 165) > 135) continue;
    jag.push(<path key={`j${i}`} d={`M ${x} ${y} l ${rand() * 10 - 5} ${rand() * 14 - 7}`} stroke="oklch(0.6 0.05 145 / 0.4)" strokeWidth="1" />);
  }
  for (let i = 0; i < 9; i++) {
    const x = 90 + rand() * 220;
    const y = 70 + rand() * 190;
    if (Math.hypot(x - 200, y - 165) > 115) continue;
    const open = 2 + rand() * 6;
    items.push(
      <g key={i}>
        <path d={`M ${x} ${y - 9} q ${-open - 6} 9, 0 18 q ${open + 6} -9, 0 -18`} fill="oklch(0.58 0.13 145 / 0.85)" />
        <path d={`M ${x + 3} ${y - 9} q ${open + 6} 9, 0 18 q ${-open - 6} -9, 0 -18`} fill="oklch(0.58 0.13 145 / 0.85)" />
        <ellipse cx={x + 1.5} cy={y} rx={open * 0.55} ry="7" fill="oklch(0.25 0.03 220 / 0.8)" />
        <circle cx={x - 7} cy={y - 4} r="2.4" fill="oklch(0.5 0.1 25 / 0.9)" />
      </g>,
    );
  }
  return (
    <>
      {jag}
      {items}
      {label(200, 26, "成对肾形保卫细胞 · 中间围成气孔 · 内含叶绿体")}
    </>
  );
};

/** 变形虫：不规则形 + 伪足 + 食物泡 */
const amoeba: SpecimenDraw = (rand) => {
  const bumps: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = 65 + rand() * 35;
    bumps.push(`${200 + Math.cos(a) * r},${165 + Math.sin(a) * r * 0.8}`);
  }
  return (
    <>
      <polygon points={bumps.join(" ")} fill="oklch(0.78 0.06 200 / 0.28)" stroke="oklch(0.58 0.1 200 / 0.9)" strokeWidth="2" />
      <path d="M262 118 q 44 -34, 66 -22 q -30 8, -46 34 Z" fill="oklch(0.72 0.08 200 / 0.3)" stroke="oklch(0.58 0.1 200 / 0.85)" strokeWidth="1.6" />
      <circle cx="186" cy="152" r="13" fill="oklch(0.5 0.12 260 / 0.9)" />
      <circle cx="228" cy="188" r="7" fill="oklch(0.68 0.12 95 / 0.7)" />
      <circle cx="168" cy="196" r="6" fill="oklch(0.68 0.12 95 / 0.7)" />
      {label(296, 92, "伪足", "start")}
      {label(184, 130, "细胞核", "middle")}
      {label(200, 250, "伪足运动 + 包裹摄食形成食物泡")}
    </>
  );
};

export const SPECIMENS: Record<string, Specimen> = {
  "onion-epidermis": { name: "洋葱鳞叶内表皮细胞", ground: "oklch(0.94 0.03 310 / 0.5)", draw: onionEpidermis },
  "oral-epithelium": { name: "口腔上皮细胞", ground: "oklch(0.94 0.03 60 / 0.5)", draw: oralEpithelium },
  "leaf-cells": { name: "黑藻叶肉细胞", ground: "oklch(0.94 0.04 145 / 0.4)", draw: leafCells },
  "root-tip": { name: "根尖纵切", ground: "oklch(0.95 0.03 90 / 0.4)", draw: rootTip },
  paramecium: { name: "草履虫", ground: "oklch(0.94 0.03 100 / 0.4)", draw: paramecium },
  spirogyra: { name: "水绵", ground: "oklch(0.94 0.04 145 / 0.4)", draw: spirogyra },
  yeast: { name: "酵母菌", ground: "oklch(0.94 0.03 85 / 0.4)", draw: yeast },
  penicillium: { name: "青霉", ground: "oklch(0.95 0.02 260 / 0.35)", draw: penicillium },
  "blood-smear": { name: "人血涂片", ground: "oklch(0.94 0.03 25 / 0.45)", draw: bloodSmear },
  stoma: { name: "叶下表皮（气孔）", ground: "oklch(0.94 0.04 145 / 0.35)", draw: stomaSlide },
  amoeba: { name: "变形虫", ground: "oklch(0.94 0.03 200 / 0.4)", draw: amoeba },
};
