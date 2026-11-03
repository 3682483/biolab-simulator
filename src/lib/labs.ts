export type Status = "live" | "plan" | "later" | "todo";

export const statusLabel: Record<Status, string> = {
  live: "已有资源",
  plan: "制作规划",
  later: "后续规划",
  todo: "待开发",
};

export interface ModuleInfo {
  id: string;
  name: string;
  total: number;
  live: number;
  plan: number;
  later: number;
  todo: number;
  sections: string[];
}

export const modules: ModuleInfo[] = [
  { id: "01", name: "细胞的结构基础", total: 16, live: 4, plan: 2, later: 5, todo: 5, sections: ["组成细胞的分子", "细胞的基本结构", "细胞学说及其拓展"] },
  { id: "02", name: "细胞代谢", total: 27, live: 10, plan: 2, later: 9, todo: 6, sections: ["物质运输", "酶与 ATP", "细胞呼吸", "光合作用"] },
  { id: "03", name: "细胞的生命历程", total: 19, live: 2, plan: 3, later: 6, todo: 8, sections: ["细胞增殖", "减数分裂", "分化、衰老与凋亡"] },
  { id: "04", name: "古典遗传学", total: 20, live: 2, plan: 0, later: 2, todo: 16, sections: ["分离定律", "自由组合定律", "伴性遗传"] },
  { id: "05", name: "分子遗传学", total: 11, live: 4, plan: 0, later: 0, todo: 7, sections: ["DNA 是遗传物质", "DNA 的结构与复制", "基因表达"] },
  { id: "06", name: "生物的变异与进化", total: 12, live: 2, plan: 4, later: 0, todo: 6, sections: ["基因突变与重组", "染色体变异", "生物进化"] },
  { id: "07", name: "稳态与调节", total: 24, live: 2, plan: 9, later: 4, todo: 9, sections: ["内环境", "神经调节", "体液调节", "免疫调节", "植物激素"] },
  { id: "08", name: "生物与环境", total: 19, live: 4, plan: 0, later: 5, todo: 10, sections: ["种群", "群落", "生态系统", "环境保护"] },
  { id: "09", name: "生物技术与工程", total: 16, live: 0, plan: 0, later: 2, todo: 14, sections: ["发酵工程", "细胞工程", "基因工程"] },
  { id: "10", name: "实验与探究", total: 36, live: 7, plan: 3, later: 3, todo: 23, sections: ["鉴定类实验", "显微观察类实验", "探究类实验", "模型构建"] },
];

export interface Lab {
  id: string;
  title: string;
  module: string;
  summary: string;
  tags: string[];
  minutes: number;
  steps: string[];
}

export const labs: Lab[] = [
  {
    id: "microscope",
    title: "光学显微镜的使用",
    module: "10",
    summary: "调节物镜倍数、粗细准焦螺旋与光圈，观察洋葱表皮细胞。",
    tags: ["显微观察", "操作规范"],
    minutes: 8,
    steps: ["低倍镜下调节粗准焦螺旋找到物像", "调节光圈与亮度获得均匀视野", "转换高倍物镜，仅使用细准焦螺旋", "记录放大倍数与观察结果"],
  },
  {
    id: "osmosis",
    title: "渗透作用与质壁分离",
    module: "02",
    summary: "改变外界溶液浓度，观察水分子跨半透膜流动与液面变化。",
    tags: ["物质运输", "半透膜"],
    minutes: 6,
    steps: ["设定漏斗内蔗糖溶液浓度", "设定烧杯外界溶液浓度", "开始实验，观察液面高度 Δh", "比较浓度差与 Δh 的关系"],
  },
  {
    id: "photosynthesis",
    title: "环境因素对光合速率的影响",
    module: "02",
    summary: "调节光照强度、CO₂ 浓度与温度，实时观察氧气释放与速率曲线。",
    tags: ["光合作用", "探究实验"],
    minutes: 10,
    steps: ["固定 CO₂ 与温度，逐步增加光照", "记录光饱和点附近的速率", "改变温度，观察酶活性的影响", "归纳限制因子"],
  },
  {
    id: "mitosis",
    title: "有丝分裂过程",
    module: "03",
    summary: "拖动时间轴，逐期观察染色体形态、数目与纺锤体变化。",
    tags: ["细胞增殖", "染色体"],
    minutes: 7,
    steps: ["观察间期 DNA 复制", "识别前期与中期的特征", "观察后期着丝粒分裂", "对比末期与亲代细胞的染色体数"],
  },
  {
    id: "pcr",
    title: "PCR 扩增 DNA 片段",
    module: "09",
    summary: "控制变性、退火、延伸三步温度循环，观察目标片段指数扩增。",
    tags: ["基因工程", "分子技术"],
    minutes: 8,
    steps: ["95 °C 变性解开双链", "55 °C 引物退火结合", "72 °C Taq 酶延伸", "重复循环，观察产物数量变化"],
  },
];

export const moduleName = (id: string) => modules.find((m) => m.id === id)?.name ?? "";
