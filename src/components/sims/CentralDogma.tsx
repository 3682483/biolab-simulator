import { useState } from "react";
import { Control, Readout, Segmented, Stage } from "@/components/lab-ui";
import { useFrame } from "@/hooks/use-sim";

type SceneId = "cell" | "rna" | "hiv";
const RED = "oklch(0.62 0.2 25)"; // 逆转录专用红

const SCENES: Record<SceneId, { label: string; paths: string[]; dna: boolean; dnaLoop: boolean; rnaLoop: boolean; reverse: boolean; note: string }> = {
  cell: {
    label: "普通生物",
    paths: ["DNA→DNA 复制", "DNA→RNA 转录", "RNA→蛋白质 翻译"],
    dna: true, dnaLoop: true, rnaLoop: false, reverse: false,
    note: "中心法则（克里克提出）指出：遗传信息沿 DNA→RNA→蛋白质 单向流动；DNA 还可通过半保留复制实现 DNA→DNA。此时 DNA 是绝大多数生物遗传信息的唯一载体。",
  },
  rna: {
    label: "RNA 病毒",
    paths: ["RNA→RNA 复制", "RNA→蛋白质 翻译"],
    dna: false, dnaLoop: false, rnaLoop: true, reverse: false,
    note: "RNA 病毒（如流感病毒、烟草花叶病毒）没有 DNA：RNA 本身就是遗传物质，可在 RNA 复制酶作用下自我复制（RNA→RNA），再翻译为蛋白质——这是对中心法则的第一类补充。",
  },
  hiv: {
    label: "HIV（逆转录）",
    paths: ["RNA→DNA 逆转录", "DNA→RNA 转录", "RNA→蛋白质 翻译"],
    dna: true, dnaLoop: false, rnaLoop: false, reverse: true,
    note: "逆转录病毒 HIV 以 RNA 为基因组，侵入细胞后在逆转录酶作用下合成 DNA 并整合到宿主基因组——发现了 RNA→DNA 的逆向信息流，打破了「信息只能从 DNA 流向 RNA」的经典表述，是中心法则最重要的补充发展。",
  },
};

/** 箭头（按角度旋转的小三角） */
const Arrow = ({ x, y, a, color }: { x: number; y: number; a: number; color: string }) => (
  <polygon points="7,0 -5.5,4 -5.5,-4" fill={color} transform={`translate(${x} ${y}) rotate(${a})`} />
);

export function CentralDogma() {
  const [scene, setScene] = useState<SceneId>("cell");
  const [speed, setSpeed] = useState(1);
  const [off, setOff] = useState(0);
  useFrame((dt) => setOff((o) => o + dt * 24 * speed));
  const s = SCENES[scene];
  const dash = { strokeDasharray: "9 7", strokeDashoffset: -off };
  const dim = { opacity: 0.22 };

  return (
    <>
      <Stage caption="中心法则及其补充发展：遗传信息的流动方向">
        <svg viewBox="0 0 400 320" className="aspect-[4/3] w-full">
          {/* 三大节点 */}
          <g style={s.dna ? undefined : dim}>
            <circle cx="80" cy="150" r="30" fill="oklch(0.6 0.12 260 / 0.35)" stroke="var(--specimen)" strokeWidth="2" />
            <text x="80" y="155" fontSize="13" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">DNA</text>
          </g>
          <circle cx="215" cy="150" r="26" fill="oklch(0.7 0.13 320 / 0.3)" stroke="var(--signal)" strokeWidth="2" />
          <text x="215" y="155" fontSize="12" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">RNA</text>
          <circle cx="335" cy="150" r="36" fill="oklch(0.7 0.12 150 / 0.3)" stroke="var(--membrane)" strokeWidth="2" />
          <text x="335" y="154" fontSize="11" textAnchor="middle" fill="var(--stage-foreground)" fontFamily="var(--font-mono)">蛋白质</text>

          {/* 主线：DNA→RNA 转录 */}
          {s.dna && (
            <g>
              <line x1="114" y1="150" x2="182" y2="150" stroke="var(--specimen)" strokeWidth="4.5" {...dash} />
              <Arrow x={189} y={150} a={0} color="var(--specimen)" />
              <text x="148" y="138" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">转录</text>
            </g>
          )}
          {/* 主线：RNA→蛋白质 翻译 */}
          <g>
            <line x1="245" y1="150" x2="294" y2="150" stroke="var(--membrane)" strokeWidth="4.5" {...dash} />
            <Arrow x={301} y={150} a={0} color="var(--membrane)" />
            <text x="270" y="138" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">翻译</text>
          </g>
          {/* DNA→DNA 复制（自环） */}
          {s.dnaLoop && (
            <g>
              <path d="M 58 128 C 30 84, 130 84, 102 128" fill="none" stroke="var(--specimen)" strokeWidth="3" {...dash} />
              <Arrow x={105} y={132} a={38} color="var(--specimen)" />
              <text x="80" y="76" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">复制</text>
            </g>
          )}
          {/* RNA→RNA 复制（自环） */}
          {s.rnaLoop && (
            <g>
              <path d="M 193 128 C 168 88, 262 88, 237 128" fill="none" stroke="var(--signal)" strokeWidth="3" {...dash} />
              <Arrow x={240} y={132} a={38} color="var(--signal)" />
              <text x="215" y="80" fontSize="10" textAnchor="middle" fill="var(--stage-foreground)" opacity="0.75" fontFamily="var(--font-mono)">复制</text>
            </g>
          )}
          {/* RNA→DNA 逆转录（红） */}
          {s.reverse && (
            <g>
              <path d="M 200 176 C 162 242, 128 242, 100 174" fill="none" stroke={RED} strokeWidth="4" {...dash} />
              <Arrow x={98} y={171} a={-114} color={RED} />
              <text x="150" y="248" fontSize="10" textAnchor="middle" fill={RED} fontFamily="var(--font-mono)">逆转录（逆转录酶）</text>
            </g>
          )}
          {/* 场景徽标 */}
          <text x="14" y="26" fontSize="10" fill="var(--stage-foreground)" opacity="0.6" fontFamily="var(--font-mono)">场景：{s.label}</text>
        </svg>
      </Stage>
      <div className="space-y-6">
        <Segmented
          options={(Object.keys(SCENES) as SceneId[]).map((k) => ({ value: k, label: SCENES[k]!.label }))}
          value={scene}
          onChange={setScene}
        />
        <Control label="信息流速度" value={speed} unit="×" min={0.2} max={3} step={0.1} onChange={setSpeed} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label="激活信息流" value={`${s.paths.length} 条`} tone="good" />
          <Readout label="路径列表" value={<span className="text-[11px] leading-snug">{s.paths.join("；")}</span>} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{s.note}</p>
      </div>
    </>
  );
}
