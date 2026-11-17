import fs from "node:fs";
import { labs, legacyLabs } from "@/lib/labs";
import { remadeLabs } from "@/data/remade";
import { knowledgeSims } from "@/data/ksims";
import { remadeTopicLinks } from "@/data/remade/topic-links";
import { knowledgeMap } from "@/data/knowledge-map";

const OUT = "docs/spec";
fs.mkdirSync(`${OUT}/01-自研仿真`, { recursive: true });
fs.mkdirSync(`${OUT}/02-重制实验`, { recursive: true });
fs.mkdirSync(`${OUT}/03-知识点微实验`, { recursive: true });

const moduleNames = new Map<string, string>();
knowledgeMap.forEach((m, i) => {
  moduleNames.set(String(i + 1).padStart(2, "0"), m.title);
});

const bookCode: Record<string, string> = {
  BX1: "BX1",
  BX2: "BX2",
  XX1: "XX1",
  XX2: "XX2",
  XX3: "XX3",
  J1: "CZ1",
  J2: "CZ2",
  J3: "CZ3",
  J4: "CZ4",
};

const bookName: Record<string, string> = {
  BX1: "必修一 · 分子与细胞",
  BX2: "必修二 · 遗传与进化",
  XX1: "选择性必修一 · 稳态与调节",
  XX2: "选择性必修二 · 生物与环境",
  XX3: "选择性必修三 · 生物技术与工程",
  CZ1: "初中 · 营养与调节",
  CZ2: "初中 · 结构与植物生活",
  CZ3: "初中 · 生殖与遗传",
  CZ4: "初中 · 多样性与生态",
};

function vizLevel(title: string, frame?: string): { level: "L3" | "L2" | "L1"; ann: "A3" | "A2" | "A1" } {
  // 先判数据类：数值比较/曲线/分类/统计不宜三维
  if (frame === "inquiry" || frame === "classify" || frame === "survey") return { level: "L1", ann: "A1" };
  if (/元素组成|曲线|计算|比例|频率|增长|呼吸商|图谱|条带|统计|计数|元素|分类/.test(title)) {
    return { level: "L1", ann: "A1" };
  }
  // 再判空间结构类（"蛋白"过宽，脱水缩合等化学过程应为 L2）
  if (/结构|模型|双螺旋|细胞|蛋白质结构|四级结构|染色体|病毒|器官|显微镜|生物膜|跨膜|DNA|RNA|纺锤体|突触/.test(title)) {
    return { level: "L3", ann: "A3" };
  }
  return { level: "L2", ann: "A2" };
}

type Row = {
  code: string;
  kind: string;
  title: string;
  group: string;
  topics: string;
  impl: string;
  level: string;
  ann: string;
  file: string;
};

const rows: Row[] = [];

// 1) 自研仿真
const simSeq = new Map<string, number>();
for (const l of labs) {
  const n = (simSeq.get(l.module) ?? 0) + 1;
  simSeq.set(l.module, n);
  const code = `BL-SIM-${l.module}-${String(n).padStart(2, "0")}`;
  const { level, ann } = vizLevel(l.title);
  rows.push({
    code,
    kind: "自研仿真",
    title: l.title,
    group: `模块${l.module} ${moduleNames.get(l.module) ?? ""}`,
    topics: String(l.topics.length),
    impl: "React 组件",
    level,
    ann,
    file: `01-自研仿真/${code}.md`,
  });
}

// 2) 重制实验
for (const l of legacyLabs) {
  const book = bookCode[l.module] ?? l.module;
  const seq = (l.id.match(/(\d+)$/)?.[1] ?? "0").padStart(3, "0");
  const code = `BL-RMD-${book}-${seq}`;
  const cfg = (remadeLabs as Record<string, { frame?: string }>)[l.id];
  const { level, ann } = vizLevel(l.title, cfg?.frame);
  rows.push({
    code,
    kind: "重制实验",
    title: l.title,
    group: bookName[book] ?? book,
    topics: String((remadeTopicLinks[l.id] ?? []).length || 0),
    impl: cfg ? `frame=${cfg.frame}` : "无配置",
    level,
    ann,
    file: `02-重制实验/${code}.md`,
  });
}

// 3) 知识点微实验
for (const [topicId, sim] of Object.entries(knowledgeSims)) {
  const m = topicId.match(/^module-(\d{2})-section-(\d{2})-topic-(\d{2})$/);
  if (!m) continue;
  const code = `BL-KS-${m[1]}-${m[2]}${m[3]}`;
  const { level, ann } = vizLevel(sim.title, (sim.spec as any).frame);
  rows.push({
    code,
    kind: "知识点微实验",
    title: sim.title,
    group: `模块${m[1]} ${moduleNames.get(m[1]) ?? ""}`,
    topics: "1",
    impl: `frame=${(sim.spec as any).frame}`,
    level,
    ann,
    file: `03-知识点微实验/${code}.md`,
  });
}

const stat = (key: (r: Row) => string) => {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + 1);
  return [...map.entries()].sort().map(([k, v]) => `${k}: ${v}`).join(" · ");
};

const lines: string[] = [];
lines.push("# BioLab 仿真实验 Spec 全量索引");
lines.push("");
lines.push(`> 共 **${rows.length}** 条：自研仿真 ${rows.filter((r) => r.kind === "自研仿真").length} · 重制实验 ${rows.filter((r) => r.kind === "重制实验").length} · 知识点微实验 ${rows.filter((r) => r.kind === "知识点微实验").length}`);
lines.push(">");
lines.push(`> 三维等级：${stat((r) => r.level)}`);
lines.push(">");
lines.push(`> 标注等级：${stat((r) => r.ann)}`);
lines.push("");
lines.push("编码规则与文档模板见 [00-编码规范与模板.md](./00-编码规范与模板.md)。");
lines.push("");
lines.push("| 编码 | 类型 | 标题 | 归属 | 覆盖知识点 | 现实现 | 三维 | 标注 | Spec |");
lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const r of rows) {
  const file = fs.existsSync(`${OUT}/${r.file}`) ? `[${r.code}](${encodeURI(r.file)})` : "待写";
  lines.push(
    `| ${r.code} | ${r.kind} | ${r.title} | ${r.group} | ${r.topics} | ${r.impl} | ${r.level} | ${r.ann} | ${file} |`,
  );
}
lines.push("");
fs.writeFileSync(`${OUT}/index.md`, lines.join("\n"), "utf8");

console.log("总计", rows.length);
console.log("三维", stat((r) => r.level));
console.log("标注", stat((r) => r.ann));
console.log("类型", stat((r) => r.kind));
