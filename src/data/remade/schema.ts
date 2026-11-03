// 自研重制实验配置 schema：一个 legacy 实验对应一条配置，由 RemadeHost 分发到 7 种通用框架渲染。
// discriminated union 而非上帝接口——每种框架只取自己需要的字段（ISP）。

/** 显微观察台：标本 key 见 frames/specimens.tsx */
export interface ObserveConfig {
  frame: "observe";
  specimen: string;
  /** 视野内可点击的结构标注 */
  labels: { name: string; desc: string }[];
  note: string;
}

/** 过程演示：阶段步进 + 要点解读 */
export interface ProcessConfig {
  frame: "process";
  stages: { name: string; desc: string }[];
  note: string;
}

/** 装置条件实验：开关条件组合 → 对应实验结果与结论 */
export interface ApparatusConfig {
  frame: "apparatus";
  /** 装置示意里各条件的可选项；第一项为对照组默认值 */
  factors: { id: string; label: string; options: string[] }[];
  /** 条件组合（按 factors 选项下标 join("-")）→ 结果；缺省组合回退 default */
  outcomes: Record<string, { result: string; verdict: string }>;
  fallback: { result: string; verdict: string };
  note: string;
}

/** 变量探究：自变量滑杆 → 因变量曲线 */
export interface InquiryConfig {
  frame: "inquiry";
  x: { label: string; min: number; max: number; step: number; unit: string };
  /** 多条曲线共用自变量（如不同温度组）；fn 返回因变量 */
  curves: { label: string; fn: (x: number) => number }[];
  /** 曲线纵轴量纲与展示格式 */
  yLabel: string;
  optimum?: string;
  note: string;
}

/** 结构拼装：从部件库点选正确的部件放入目标结构槽位 */
export interface BuilderConfig {
  frame: "builder";
  /** 目标结构的槽位（从上到下） */
  slots: { id: string; name: string }[];
  /** 部件库（可含干扰项：slot 为 null） */
  parts: { id: string; name: string; slot: string | null; fact: string }[];
  note: string;
}

/** 分类挑战：把卡片归入正确的桶 */
export interface ClassifyConfig {
  frame: "classify";
  buckets: string[];
  cards: { name: string; bucket: string; fact: string }[];
  note: string;
}

/** 野外调查：样方法计数 / 标志重捕法估算 */
export interface SurveyConfig {
  frame: "survey";
  mode: "quadrat" | "markrecapture";
  /** quadrat：每个样方内目标个体数生成范围；markrecapture：总数与标记数 */
  params: { min?: number; max?: number; total?: number; marked?: number };
  target: string;
  note: string;
}

export type RemadeLab =
  | ObserveConfig
  | ProcessConfig
  | ApparatusConfig
  | InquiryConfig
  | BuilderConfig
  | ClassifyConfig
  | SurveyConfig;

export type FrameKind = RemadeLab["frame"];
