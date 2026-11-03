import { useState } from "react";
import { Control, Readout, Stage } from "@/components/lab-ui";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/hooks/use-sim";

const INK = "oklch(0.98 0 0)";
const BASE_COLOR: Record<string, string> = {
  A: "oklch(0.65 0.13 25)",
  U: "oklch(0.7 0.13 320)",
  G: "oklch(0.62 0.13 150)",
  C: "oklch(0.7 0.12 200)",
};
const ANTICOMP: Record<string, string> = { A: "U", U: "A", G: "C", C: "G" };

// 迷你密码子表（含起始与三个终止密码子）
const CODON_AA: Record<string, string> = {
  AUG: "甲硫", GGU: "甘", GGC: "甘", UUU: "苯丙", AUU: "异亮", UAA: "终止", UAG: "终止", UGA: "终止",
};
const MRNA = "AUGGGUUUUGGCAUUUAA"; // 6 个密码子，末位 UAA 终止
const aaColor = (name: string) => `oklch(0.7 0.12 ${(name.charCodeAt(0) * 47) % 360})`;
const codonOf = (c: number) => MRNA.slice(3 * c, 3 * c + 3);
const codonCenter = (c: number) => 30 + 20 * (3 * c + 1);

/** 简化 tRNA：倒 L 形（反密码子臂 + 氨基酸臂） */
function TRNA({ x, anticodon, aa, opacity }: { x: number; anticodon: string; aa?: string; opacity: number }) {
  return (
    <g opacity={opacity}>
      <line x1={x - 16} x2={x + 16} y1="238" y2="238" stroke="var(--membrane)" strokeWidth="3" strokeLinecap="round" />
      <line x1={x} x2={x} y1="238" y2="268" stroke="var(--membrane)" strokeWidth="3" strokeLinecap="round" />
      {anticodon.split("").map((b, i) => (
        <text key={i} x={x - 12 + i * 12} y="232" fontSize="9" textAnchor="middle" fill={BASE_COLOR[b]} fontFamily="var(--font-mono)">{b}</text>
      ))}
      {aa && (
        <>
          <circle cx={x} cy="278" r="10" fill={aaColor(aa)} />
          <text x={x} y="281" fontSize="7.5" textAnchor="middle" fill={INK} fontFamily="var(--font-mono)">{aa}</text>
        </>
      )}
    </g>
  );
}

export function Translation() {
  const [prog, setProg] = useState(0); // 密码子单位（0–6）
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(1);
  useFrame((dt) => setProg((v) => {
    const n = v + dt * 0.5 * speed;
    if (n >= 6) { setPlay(false); return 6; }
    return n;
  }), play);

  const c = Math.min(Math.floor(prog), 5);
  const sub = Math.min(prog, 6) - c;
  const isStop = c === 5;
  const codon = codonOf(c);
  const aa = CODON_AA[codon]!;
  const anticodon = codon.split("").map((b) => ANTICOMP[b]!).join("");
  const released = isStop && sub >= 0.55;
  const chainLen = released ? 5 : c + (!isStop && sub >= 0.75 ? 1 : 0);
  const chain = Array.from({ length: chainLen }, (_, i) => CODON_AA[codonOf(i)]!);

  // 核糖体横跨 P 位（前一密码子）与 A 位（当前密码子），转位时右移
  const mid = (c === 0 ? codonCenter(0) - 30 : (codonCenter(c - 1) + codonCenter(c)) / 2) + (sub > 0.75 ? ((sub - 0.75) / 0.25) * 60 : 0);
  const xA = codonCenter(c);
  const enter = Math.min(sub / 0.3, 1); // 进位进度
  const done = prog >= 6;

  return (
    <>
      <Stage caption="翻译：核糖体沿 mRNA 5'→3' 逐个读取密码子">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          <text x="14" y="214" fontSize="10" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">5'</text>
          <text x="384" y="214" fontSize="10" textAnchor="end" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">3'</text>
          {/* mRNA 与密码子框 */}
          {MRNA.split("").map((b, i) => (
            <g key={i}>
              <circle cx={30 + 20 * i} cy="210" r="8" fill={BASE_COLOR[b]} />
              <text x={30 + 20 * i} y="213" fontSize="8.5" textAnchor="middle" fill={INK} fontFamily="var(--font-mono)">{b}</text>
            </g>
          ))}
          {Array.from({ length: 6 }, (_, k) => (
            <rect
              key={k}
              x={30 + 60 * k - 11}
              y="196"
              width="72"
              height="28"
              rx="4"
              fill="none"
              stroke={k === c && !done ? "var(--signal)" : "var(--stage-foreground)"}
              strokeOpacity={k === c && !done ? 0.9 : 0.25}
              strokeDasharray={codonOf(k) === "UAA" ? "4 3" : undefined}
            />
          ))}
          {/* 增长中的肽链（顶部） */}
          {chain.map((name, i) => {
            const x = released ? 104 + i * 24 : 56 + i * 24;
            const y = released ? 56 : 70;
            return (
              <g key={i}>
                {i > 0 && <line x1={x - 24} x2={x} y1={y} y2={y} stroke="var(--stage-foreground)" strokeOpacity="0.4" strokeWidth="1.5" />}
                <circle cx={x} cy={y} r="9" fill={aaColor(name)} />
                <text x={x} y={y + 2.5} fontSize="7" textAnchor="middle" fill={INK} fontFamily="var(--font-mono)">{name}</text>
              </g>
            );
          })}
          {released && (
            <>
              <circle cx="152" cy="56" r="86" fill="none" stroke="var(--signal)" strokeOpacity="0.35" strokeDasharray="5 5" />
              <text x="152" y="26" fontSize="10" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">肽链释放</text>
            </>
          )}
          {!released && chainLen > 0 && (
            <line x1={56 + 24 * (chainLen - 1)} x2={mid} y1="80" y2="166" stroke="var(--signal)" strokeOpacity="0.4" strokeDasharray="3 3" />
          )}
          {/* 核糖体（大小亚基） */}
          <ellipse cx={mid} cy="207" rx="52" ry="13" fill="oklch(0.6 0.1 200 / 0.18)" stroke="var(--stage-foreground)" strokeOpacity="0.55" />
          <ellipse cx={mid} cy="190" rx="46" ry="22" fill="oklch(0.6 0.1 200 / 0.18)" stroke="var(--stage-foreground)" strokeOpacity="0.55" />
          <text x={mid} y="158" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">核糖体</text>
          <text x={xA} y="192" fontSize="8" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">A 位</text>
          {c > 0 && <text x={xA - 60} y="192" fontSize="8" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">P 位</text>}
          {/* A 位进位 / 配对 / 转肽 / 转位 */}
          {isStop ? (
            <g opacity={enter}>
              <rect x={xA - 13 + (1 - enter) * 44} y="240" width="26" height="20" rx="4" fill="none" stroke="var(--signal)" strokeWidth="2" />
              <text x={xA + (1 - enter) * 44} y="253" fontSize="7" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">释放因子</text>
              {released && <text x={xA} y="290" fontSize="9" textAnchor="middle" fill="var(--signal)" fontFamily="var(--font-mono)">终止！肽链水解释放</text>}
            </g>
          ) : (
            <>
              <TRNA x={xA + (1 - enter) * 44} anticodon={anticodon} aa={aa} opacity={0.25 + 0.75 * enter} />
              {sub > 0.3 && sub < 0.55 && [xA - 10, xA, xA + 10].map((x, i) => (
                <line key={i} x1={x} x2={x} y1="224" y2="233" stroke="var(--signal)" strokeWidth="2" opacity={0.3 + 0.7 * Math.abs(Math.sin(prog * 40))} />
              ))}
              {sub >= 0.55 && sub < 0.75 && (() => {
                const u = (sub - 0.55) / 0.2;
                const x = xA + u * (56 + 24 * chainLen - xA);
                const y = 278 + u * (70 - 278);
                return (
                  <g>
                    <circle cx={x} cy={y} r="9" fill={aaColor(aa)} />
                    <text x={x} y={y + 2.5} fontSize="7" textAnchor="middle" fill={INK} fontFamily="var(--font-mono)">{aa}</text>
                  </g>
                );
              })()}
              {sub >= 0.75 && sub < 1 && c > 0 && (
                <TRNA x={xA - 60 - (sub - 0.75) * 40} anticodon={codonOf(c - 1).split("").map((b) => ANTICOMP[b]!).join("")} opacity={1 - (sub - 0.75) / 0.25} />
              )}
              {sub >= 0.75 && c === 0 && (
                <TRNA x={xA - 60} anticodon="UAC" opacity={1 - (sub - 0.75) / 0.25} />
              )}
            </>
          )}
        </svg>
      </Stage>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => { if (done) { setProg(0); setPlay(true); } else setPlay((p) => !p); }}>
            {play ? "暂停" : done ? "重新翻译" : "开始翻译"}
          </Button>
          <Button variant="outline" onClick={() => { setPlay(false); setProg(0); }}>重置</Button>
        </div>
        <Control label="翻译速度" value={speed} unit="×" min={0.5} max={4} step={0.5} onChange={setSpeed} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="肽链长度（氨基酸）" value={chainLen} tone={released ? "good" : undefined} />
          <Readout label="当前密码子" value={done ? "翻译完成" : `${codon}（${aa}）`} />
        </div>
        <Readout label="肽链序列" value={chain.length ? chain.join("–") : "—"} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {done || released
            ? "终止密码子（UAA/UAG/UGA）不编码氨基酸：释放因子进入 A 位，肽链与 tRNA 解离，核糖体大、小亚基分离——最终肽链为 5 个氨基酸：甲硫–甘–苯丙–甘–异亮。"
            : prog < 0.05
              ? "核糖体在起始密码子 AUG 处组装，首个 tRNA 携带甲硫氨酸进入 P 位。点击「开始翻译」观察进位→配对→转肽→转位的循环。"
              : `第 ${c + 1} 个密码子 ${codon} 编码${aa}，反密码子 ${anticodon} 按碱基互补配对进入 A 位；肽酰转移后肽链延长至 ${chainLen} 个氨基酸，空 tRNA 从 E 位离开。`}
        </p>
      </div>
    </>
  );
}
