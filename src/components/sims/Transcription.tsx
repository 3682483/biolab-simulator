import { useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

const INK = "oklch(0.98 0 0)"; // 碱基圆内字母
const BASE_COLOR: Record<string, string> = {
  A: "oklch(0.65 0.13 25)",
  T: "oklch(0.65 0.13 260)",
  G: "oklch(0.62 0.13 150)",
  C: "oklch(0.7 0.12 200)",
  U: "oklch(0.7 0.13 320)",
};
const DNA_COMP: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const RNA_COMP: Record<string, string> = { T: "A", A: "U", G: "C", C: "G" };

// 三组基因片段（模板链 3'→5'，9 个碱基 = 3 个密码子）
const FRAGS = [
  { label: "片段一", tpl: "TACGGATTG" },
  { label: "片段二", tpl: "ATGCCTACA" },
  { label: "片段三", tpl: "GGCTTACAG" },
] as const;

const X0 = 64;
const GAP = 34;
const codons = (s: string) => (s.match(/.{1,3}/g) ?? []).join("·");

/** 单排碱基圆 */
function BaseRow({ y, letters, dim }: { y: number; letters: string[]; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.45 : 1}>
      {letters.map((b, i) => (
        <g key={i}>
          <circle cx={X0 + i * GAP} cy={y} r="11" fill={BASE_COLOR[b]} />
          <text x={X0 + i * GAP} y={y + 3.5} fontSize="11" textAnchor="middle" fill={INK} fontFamily="var(--font-mono)">{b}</text>
        </g>
      ))}
    </g>
  );
}

export function Transcription() {
  const [frag, setFrag] = useState(0);
  const [prog, setProg] = useState(0); // 已转录碱基数（浮点）
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(1);
  useFrame((dt) => setProg((v) => {
    const n = v + dt * 1.5 * speed;
    if (n >= 9) { setPlay(false); return 9; }
    return n;
  }), play);

  const f = FRAGS[frag]!;
  const tpl = Array.from({ length: 9 }, (_, i) => f.tpl.charAt(i));
  const non = tpl.map((b) => DNA_COMP[b]!);
  const rna = tpl.map((b) => RNA_COMP[b]!);
  const n = Math.floor(prog);
  const done = n >= 9;
  const polX = X0 + Math.min(prog, 8) * GAP;

  return (
    <>
      <Stage caption="转录：模板链 3'→5' 移动，mRNA 5'→3' 延伸">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 模板链（上）与非模板链（下） */}
          <BaseRow y={130} letters={tpl} />
          <BaseRow y={196} letters={non} dim />
          <text x="24" y="134" fontSize="11" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">3'</text>
          <text x="376" y="134" fontSize="11" textAnchor="end" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">5'</text>
          <text x="24" y="200" fontSize="11" fill="var(--stage-foreground)" opacity="0.5" fontFamily="var(--font-mono)">5'</text>
          <text x="376" y="200" fontSize="11" textAnchor="end" fill="var(--stage-foreground)" opacity="0.5" fontFamily="var(--font-mono)">3'</text>
          {/* mRNA：已转录部分 + 氢键虚线 */}
          {n > 0 && <line x1={X0 - 16} x2={polX} y1="64" y2="64" stroke="var(--signal)" strokeWidth="2" />}
          {tpl.map((_, i) => i < n && (
            <line key={i} x1={X0 + i * GAP} x2={X0 + i * GAP} y1="76" y2="118" stroke="var(--stage-foreground)" strokeOpacity="0.35" strokeDasharray="3 3" />
          ))}
          <BaseRow y={64} letters={rna.slice(0, n)} />
          {n > 0 && <text x={X0 - 16} y="68" fontSize="11" textAnchor="end" fill="var(--signal)" fontFamily="var(--font-mono)">5'</text>}
          {n > 0 && (
            <text x={X0 + Math.min(n - 1, 8) * GAP + 16} y="68" fontSize="11" fill="var(--signal)" fontFamily="var(--font-mono)">
              {done ? "3'" : ""}
            </text>
          )}
          {/* RNA 聚合酶 */}
          <ellipse cx={polX} cy={130} rx="24" ry="36" fill="oklch(0.6 0.15 200 / 0.16)" stroke="var(--signal)" strokeWidth="2" />
          <text x={polX} y="88" fontSize="10" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">RNA 聚合酶</text>
          {/* 方向箭头 */}
          <path d={`M ${polX + 30} 130 h 26 m-7 -4 l7 4 l-7 4`} stroke="var(--stage-foreground)" strokeOpacity="0.5" fill="none" />
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={FRAGS.map((x, i) => ({ value: i, label: x.label }))}
          value={frag}
          onChange={(v) => { setFrag(v); setProg(0); setPlay(false); }}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => { if (done) { setProg(0); setPlay(true); } else setPlay((p) => !p); }}>
            {play ? "暂停" : done ? "重新转录" : "开始转录"}
          </Button>
          <Button variant="outline" onClick={() => { setPlay(false); setProg(0); }}>重置</Button>
        </div>
        <Control label="转录速度" value={speed} unit="×" min={0.5} max={4} step={0.5} onChange={setSpeed} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="已转录碱基数" value={`${n} / 9`} />
          <Readout label="mRNA 密码子" value={n === 0 ? "—" : codons(rna.slice(0, n).join(""))} tone={done ? "good" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {n === 0
            ? `RNA 聚合酶结合启动子后，将沿模板链 3'-${f.tpl}-5' 的方向（3'→5'）移动并解开场双链，点击「开始转录」观察 mRNA 的合成。`
            : done
              ? `转录完成：mRNA 为 5'-${codons(rna.join(""))}-3'。对比复制——模板：复制用两条母链、转录只用一条模板链；原料：脱氧核苷酸 vs 核糖核苷酸；酶：DNA 聚合酶 vs RNA 聚合酶；产物：双链 DNA vs mRNA。`
              : `正在配对合成第 ${n + 1} 个碱基：T→A、A→U、G→C、C→G，模板链的碱基序列决定 mRNA 的序列，mRNA 按 5'→3' 方向延伸。`}
        </p>
      </div>
    </>
  );
}
