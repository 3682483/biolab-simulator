import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

// 野生型模板链（3'→5'），编码 Met–Leu–Met 三肽
const WILD = "TACGATAAC";
// 标准遗传密码表（NCBI 顺序串，碱基次序 T C A G）
const CODE = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
const BASE_IDX: Record<string, number> = { T: 0, C: 1, A: 2, G: 3 };
const NEXT: Record<string, string> = { A: "T", T: "C", C: "G", G: "A" }; // 替换时确定性换成的碱基
const COMP: Record<string, string> = { T: "A", A: "U", C: "G", G: "C" };

type MutKind = "sub" | "ins" | "del";

const kindLabel: Record<MutKind, string> = { sub: "碱基替换", ins: "碱基增添", del: "碱基缺失" };

function mrnaOf(dna: string): string {
  let out = "";
  for (const b of dna) out += COMP[b] ?? "U";
  return out;
}

function aaOf(codon: string): string {
  const t = codon.replace(/U/g, "T");
  const i = (BASE_IDX[t.charAt(0)] ?? 0) * 16 + (BASE_IDX[t.charAt(1)] ?? 0) * 4 + (BASE_IDX[t.charAt(2)] ?? 0);
  return CODE.charAt(i);
}

function translate(m: string): string[] {
  const out: string[] = [];
  for (let i = 0; i + 3 <= m.length; i += 3) {
    const a = aaOf(m.slice(i, i + 3));
    if (a === "*") break; // 终止密码子，肽链提前结束
    out.push(a);
  }
  return out;
}

function mutate(kind: MutKind, pos: number): string {
  const i = Math.min(WILD.length - 1, Math.max(0, pos - 1));
  const b = WILD.charAt(i);
  if (kind === "sub") return WILD.slice(0, i) + (NEXT[b] ?? "A") + WILD.slice(i + 1);
  if (kind === "del") return WILD.slice(0, i) + WILD.slice(i + 1);
  return WILD.slice(0, i + 1) + b + WILD.slice(i + 1); // 增添：在该位后复制一个碱基
}

const wildAA = translate(mrnaOf(WILD));

export function GeneMutation() {
  const [kind, setKind] = useState<MutKind>("sub");
  const [pos, setPos] = useState(2);
  const [, tick] = useState(0);
  useFrame(() => tick((n) => n + 1)); // 驱动碱基闪烁

  const dna = mutate(kind, pos);
  const mrna = mrnaOf(dna);
  const aas = translate(mrna);
  const frameshift = kind === "ins" || kind === "del";
  const mutIdx = Math.min(WILD.length, Math.max(1, pos)) - 1;

  // 氨基酸改变数：逐位比较 + 长度差
  let changed = 0;
  let firstAA = -1;
  for (let i = 0; i < Math.max(aas.length, wildAA.length); i++) {
    if ((wildAA[i] ?? "") !== (aas[i] ?? "")) {
      changed++;
      if (firstAA < 0) firstAA = i;
    }
  }

  const now = performance.now();
  const blink = 0.55 + 0.45 * Math.sin(now / 170);

  // 某位置碱基是否相对野生型发生改变（移码时突变点之后全部高亮）
  const dnaChanged = (j: number) => {
    if (kind === "sub") return j === mutIdx;
    if (frameshift) return j >= mutIdx;
    return false;
  };

  const row = (seq: string, y: number, changedFn: (j: number) => boolean, isRNA: boolean) => {
    const pitch = 30;
    const x0 = 200 - (seq.length * pitch) / 2 + 2;
    return (
      <g>
        {seq.split("").map((b, j) => {
          const x = x0 + j * pitch;
          const ch = changedFn(j);
          return (
            <g key={j}>
              {j % 3 === 0 && (
                <rect x={x - 3} y={y - 4} width={Math.min(3, seq.length - j) * pitch - 4} height={32} rx={4}
                  fill="none" stroke="var(--stage-foreground)" strokeOpacity={frameshift && j >= mutIdx ? 0.35 : 0.14}
                  strokeDasharray={frameshift && j >= mutIdx ? "3 2" : undefined} />
              )}
              <rect x={x} y={y} width={24} height={24} rx={4}
                fill={ch ? "var(--signal)" : "var(--stage-foreground)"} fillOpacity={ch ? 0.28 * blink : 0.08}
                stroke={ch ? "var(--signal)" : "var(--stage-foreground)"} strokeOpacity={ch ? blink : 0.35} />
              <text x={x + 12} y={y + 16.5} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)"
                fill={isRNA && ch ? "var(--signal)" : "var(--stage-foreground)"} fontWeight={ch ? 700 : 400}>
                {b}
              </text>
            </g>
          );
        })}
        <text x={x0 - 10} y={y + 17} textAnchor="end" fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">
          3′
        </text>
        <text x={x0 + seq.length * pitch - 4} y={y + 17} fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">
          5′
        </text>
      </g>
    );
  };

  const aaX = (i: number) => 200 - ((aas.length - 1) * 30) / 2 + i * 30;

  return (
    <>
      <Stage caption="中心法则：DNA → mRNA → 肽链 · 信号色为突变波及范围">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <text x="14" y="52" fontSize="11" fill="var(--stage-foreground)" opacity={0.7} fontFamily="var(--font-mono)">
            DNA 模板链
          </text>
          {/* 突变位置标记 */}
          <path d={`M${200 - ((dna.length - 1) * 30) / 2 + mutIdx * 30 + 12} 30 l-5 9 h10 Z`} fill="var(--signal)" opacity={blink} />
          <text x={200} y="22" textAnchor="middle" fontSize="10" fill="var(--signal)" fontFamily="var(--font-mono)" opacity={blink}>
            第 {pos} 位{kindLabel[kind]}
          </text>
          {row(dna, 40, dnaChanged, false)}
          <path d="M200 78 v14 m-4 -5 l4 5 l4 -5" stroke="var(--stage-foreground)" strokeOpacity={0.6} strokeWidth="1.2" fill="none" />
          <text x="216" y="90" fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">转录</text>
          <text x="14" y="128" fontSize="11" fill="var(--stage-foreground)" opacity={0.7} fontFamily="var(--font-mono)">mRNA</text>
          {row(mrna, 116, (j) => frameshift ? j >= mutIdx : false, true)}
          <path d="M200 156 v14 m-4 -5 l4 5 l4 -5" stroke="var(--stage-foreground)" strokeOpacity={0.6} strokeWidth="1.2" fill="none" />
          <text x="216" y="168" fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">翻译</text>
          <text x="14" y="210" fontSize="11" fill="var(--stage-foreground)" opacity={0.7} fontFamily="var(--font-mono)">肽链（氨基酸）</text>
          {/* 肽链圆珠 */}
          {aas.length > 1 && <line x1={aaX(0)} y1={236} x2={aaX(aas.length - 1)} y2={236} stroke="var(--stage-foreground)" strokeOpacity={0.4} strokeWidth={2} />}
          {aas.map((a, i) => {
            const hit = frameshift ? i >= (firstAA < 0 ? aas.length : firstAA) : i === firstAA;
            return (
              <g key={i}>
                <circle cx={aaX(i)} cy={236} r={14}
                  fill={hit ? "var(--signal)" : "var(--specimen)"} fillOpacity={hit ? 0.3 * blink : 0.18}
                  stroke={hit ? "var(--signal)" : "var(--specimen)"} strokeOpacity={hit ? blink : 0.8} strokeWidth={1.4} />
                <text x={aaX(i)} y={240} textAnchor="middle" fontSize="11" fontWeight={700} fontFamily="var(--font-mono)"
                  fill={hit ? "var(--signal)" : "var(--stage-foreground)"}>{a}</text>
                <text x={aaX(i) + 13} y={224} fontSize="8.5" fill="var(--stage-foreground)" opacity={0.6} fontFamily="var(--font-mono)">{i + 1}</text>
              </g>
            );
          })}
          {aas.length === 0 && (
            <text x={200} y={240} textAnchor="middle" fontSize="11" fill="var(--signal)" fontFamily="var(--font-mono)">
              肽链合成提前终止
            </text>
          )}
          <text x={200} y={290} textAnchor="middle" fontSize="10" fill="var(--stage-foreground)" opacity={0.55} fontFamily="var(--font-mono)">
            野生型肽链：M₁ – L₂ – M₃
          </text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={[
            { value: "sub" as MutKind, label: "碱基替换" },
            { value: "ins" as MutKind, label: "碱基增添" },
            { value: "del" as MutKind, label: "碱基缺失" },
          ]}
          value={kind}
          onChange={setKind}
        />
        <Control label="作用位置（第几位碱基）" value={pos} unit="位" min={1} max={9} onChange={(v) => setPos(Math.round(v))} />
        <Button variant="outline" className="w-full" onClick={() => { setKind("sub"); setPos(2); }}>
          恢复正常基因
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Readout label="突变类型" value={kindLabel[kind]} />
          <Readout label="氨基酸改变数" value={`${changed} 个`} tone={changed === 0 ? "good" : changed >= 2 ? "warn" : undefined} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {kind === "sub" && changed === 0
            ? "本次替换后密码子虽变但编码的氨基酸不变（同义突变），肽链完全相同——替换的影响通常最小。"
            : kind === "sub"
              ? `碱基替换只改变一个密码子，仅第 ${firstAA + 1} 号氨基酸被替换，对肽链结构影响较小。`
              : `碱基${kind === "ins" ? "增添" : "缺失"}导致突变点之后阅读框架整体偏移（移码），从第 ${(firstAA < 0 ? 0 : firstAA) + 1} 号氨基酸起全部改变甚至提前终止，影响远大于替换。`}基因突变只是基因内部碱基对的增添、替换或缺失，不改变染色体上基因的数目和位置。
        </p>
      </div>
    </>
  );
}
