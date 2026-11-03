// 实验注册表：自研 React 仿真（labs）+ 本地参考实验库（legacyLabs）。
// 模块名从知识地图派生；册别分区用于参考库归档，二者不交叉挂载。
import { legacyLabs, type LegacyLab } from "@/data/legacy-labs";
import { knowledgeMap } from "@/data/knowledge-map";

export type Status = "live" | "plan" | "later" | "todo";

export const statusLabel: Record<Status, string> = {
  live: "已有资源",
  plan: "制作规划",
  later: "后续规划",
  todo: "待开发",
};

/** 教材册别分区：参考实验库按册归档 */
export interface BookInfo {
  id: string;
  name: string;
}

export const books: BookInfo[] = [
  { id: "BX1", name: "必修一 · 分子与细胞" },
  { id: "BX2", name: "必修二 · 遗传与进化" },
  { id: "XX1", name: "选择性必修一 · 稳态与调节" },
  { id: "XX2", name: "选择性必修二 · 生物与环境" },
  { id: "XX3", name: "选择性必修三 · 生物技术与工程" },
  { id: "J1", name: "初中 · 营养与调节" },
  { id: "J2", name: "初中 · 结构与植物生活" },
  { id: "J3", name: "初中 · 生殖与遗传" },
  { id: "J4", name: "初中 · 多样性与生态" },
];

// 知识地图模块 id（module-01）→ 目录模块号（"01"）→ 模块名
const moduleNames = new Map<string, string>();
knowledgeMap.forEach((m, i) => {
  moduleNames.set(String(i + 1).padStart(2, "0"), m.title.replace(/^模块[一二三四五六七八九十]+、\s*/, ""));
});
const bookNames = new Map(books.map((b) => [b.id, b.name]));

/** 兼容知识模块号（"02"）与册别分区 id（"BX1"） */
export const moduleName = (id: string) => moduleNames.get(id) ?? bookNames.get(id) ?? id;

export interface Lab {
  id: string;
  title: string;
  module: string; // 知识地图模块号 "01"–"10"
  summary: string;
  tags: string[];
  minutes: number;
  steps: string[];
  topics: string[]; // 覆盖的知识点 id（src/data/knowledge-map.ts）
}

export const labs: Lab[] = [
  // ---------- 模块一 细胞的结构基础 ----------
  {
    id: "cell-elements",
    title: "细胞中的元素组成",
    module: "01",
    summary: "对比组成细胞的元素与地壳元素，理解大量元素与微量元素的分层关系。",
    tags: ["组成细胞的分子", "元素"],
    minutes: 5,
    steps: ["切换生物种类，观察元素种类变化", "调节含量滑块，理解大量/微量元素的分界", "对比细胞与地壳的元素谱差异", "归纳 C 为骨架元素的意义"],
    topics: ["module-01-section-01-topic-01"],
  },
  {
    id: "protein-structure",
    title: "蛋白质的脱水缩合",
    module: "01",
    summary: "调节氨基酸数目与 R 基种类，观察肽键形成、脱水数与多肽空间结构。",
    tags: ["蛋白质", "脱水缩合"],
    minutes: 7,
    steps: ["设定氨基酸数目 n", "逐个形成肽键，统计脱去水分子数", "改变 R 基种类观察侧链互补", "推算肽键数 = n − 1 与相对分子质量"],
    topics: ["module-01-section-01-topic-06"],
  },
  {
    id: "nucleic-acid",
    title: "DNA 与 RNA 的结构对比",
    module: "01",
    summary: "并排搭建 DNA 双链与 RNA 单链，对比五碳糖、碱基与结构差异。",
    tags: ["核酸", "核苷酸"],
    minutes: 6,
    steps: ["观察脱氧核苷酸与核糖核苷酸的差异", "按碱基互补配对搭建 DNA 双链", "切换 RNA 单链观察 U 替代 T", "归纳两类核酸的功能分工"],
    topics: ["module-01-section-01-topic-07", "module-05-section-01-topic-02"],
  },
  {
    id: "cell-membrane",
    title: "细胞膜的流动镶嵌模型",
    module: "01",
    summary: "升温、改变胆固醇含量，观察磷脂双分子层流动性与膜蛋白侧向漂移。",
    tags: ["细胞膜", "磷脂双分子层"],
    minutes: 6,
    steps: ["观察磷脂分子亲水头/疏水尾的排布", "升温观察膜流动性增强", "追踪跨膜蛋白的侧向移动", "归纳流动性与镶嵌性两大特点"],
    topics: ["module-01-section-02-topic-01"],
  },
  {
    id: "cell-structure",
    title: "真核细胞的结构巡览",
    module: "01",
    summary: "点击各细胞器查看结构与功能，对比动植物细胞的差异结构。",
    tags: ["细胞器", "结构与功能"],
    minutes: 8,
    steps: ["逐个点击细胞器查看功能卡片", "切换动物/植物细胞视图", "找出植物细胞特有的细胞器", "梳理分泌蛋白合成途经的细胞器"],
    topics: ["module-01-section-02-topic-02", "module-01-section-02-topic-03"],
  },
  {
    id: "prokaryote",
    title: "原核细胞与真核细胞",
    module: "01",
    summary: "并排对比原核、真核细胞结构，理解“无成形细胞核”的核心差异。",
    tags: ["原核生物", "细胞类型"],
    minutes: 5,
    steps: ["观察原核细胞的拟核与核糖体", "对比真核细胞的成形细胞核", "勾选结构判断两类细胞归属", "归纳细胞统一性与多样性"],
    topics: ["module-01-section-03-topic-03"],
  },
  // ---------- 模块二 细胞代谢 ----------
  {
    id: "osmosis",
    title: "渗透作用与质壁分离",
    module: "02",
    summary: "改变外界溶液浓度，观察水分子跨半透膜流动与液面变化。",
    tags: ["物质运输", "半透膜"],
    minutes: 6,
    steps: ["设定漏斗内蔗糖溶液浓度", "设定烧杯外界溶液浓度", "开始实验，观察液面高度 Δh", "比较浓度差与 Δh 的关系"],
    topics: ["module-02-section-01-topic-01", "module-02-section-01-topic-02"],
  },
  {
    id: "membrane-transport",
    title: "物质跨膜运输的方式",
    module: "02",
    summary: "选择物质与运输方式，观察自由扩散、协助扩散与主动运输的差异。",
    tags: ["被动运输", "主动运输"],
    minutes: 7,
    steps: ["选择运输物质（O₂/葡萄糖/K⁺）", "切换运输方式观察逆浓度梯度行为", "关闭能量供应观察主动运输停止", "归纳三种方式的判断依据"],
    topics: ["module-02-section-01-topic-03", "module-02-section-01-topic-05"],
  },
  {
    id: "enzyme-activity",
    title: "酶活性的影响因素",
    module: "02",
    summary: "调节温度与 pH，实时观察酶促反应速率钟形曲线与最适条件。",
    tags: ["酶", "探究实验"],
    minutes: 8,
    steps: ["固定 pH，逐步升高温度记录速率", "找到最适温度并观察两侧下降", "改变 pH 重复实验", "对比低温失活与高温变性的区别"],
    topics: ["module-02-section-02-topic-03", "module-10-section-06-topic-02"],
  },
  {
    id: "atp-cycle",
    title: "ATP 与 ADP 的相互转化",
    module: "02",
    summary: "驱动吸能反应与放能反应，观察 ATP—ADP 循环的动态平衡。",
    tags: ["ATP", "能量货币"],
    minutes: 5,
    steps: ["观察 ATP 的三个磷酸基团", "断开末端高能磷酸键释放能量", "用细胞呼吸能量驱动 ADP + Pi 合成", "归纳不可逆的双向反应特点"],
    topics: ["module-02-section-03-topic-01"],
  },
  {
    id: "cellular-respiration",
    title: "有氧呼吸的三个阶段",
    module: "02",
    summary: "追踪一分子葡萄糖经糖酵解、柠檬酸循环、氧化磷酸化的去路与产能。",
    tags: ["细胞呼吸", "线粒体"],
    minutes: 9,
    steps: ["观察细胞质基质中的糖酵解", "进入线粒体基质观察柠檬酸循环", "追踪内膜上 NADH 释放的电子", "统计三阶段 [H]、CO₂ 与 ATP 产量"],
    topics: ["module-02-section-04-topic-01", "module-02-section-04-topic-02"],
  },
  {
    id: "photosynthesis",
    title: "环境因素对光合速率的影响",
    module: "02",
    summary: "调节光照强度、CO₂ 浓度与温度，实时观察氧气释放与速率曲线。",
    tags: ["光合作用", "探究实验"],
    minutes: 10,
    steps: ["固定 CO₂ 与温度，逐步增加光照", "记录光饱和点附近的速率", "改变温度，观察酶活性的影响", "归纳限制因子"],
    topics: ["module-02-section-05-topic-03", "module-02-section-05-topic-05"],
  },
  {
    id: "pigment-chromatography",
    title: "绿叶中色素的提取和分离",
    module: "02",
    summary: "纸层析法分离四种色素，观察扩散速度与色素带颜色。",
    tags: ["色素", "纸层析"],
    minutes: 7,
    steps: ["划滤液细线并放入层析液", "观察四种色素在滤纸上的分离", "对比各色素带的扩散速度", "将色素带与吸收光谱对应"],
    topics: ["module-02-section-05-topic-02", "module-10-section-01-topic-02"],
  },
  // ---------- 模块三 细胞的生命历程 ----------
  {
    id: "cell-cycle",
    title: "细胞周期的分裂间期与分裂期",
    module: "03",
    summary: "拖动周期时钟，观察间期 G₁/S/G₂ 与分裂期各时相的时间占比。",
    tags: ["细胞增殖", "细胞周期"],
    minutes: 5,
    steps: ["观察间期占整个周期的时间比例", "进入 S 期看 DNA 复制", "对比 G₁ 与 G₂ 的物质准备", "归纳分裂期“短表面变化大”的特点"],
    topics: ["module-03-section-01-topic-01", "module-03-section-01-topic-02"],
  },
  {
    id: "mitosis",
    title: "有丝分裂过程",
    module: "03",
    summary: "拖动时间轴，逐期观察染色体形态、数目与纺锤体变化。",
    tags: ["细胞增殖", "染色体"],
    minutes: 7,
    steps: ["观察间期 DNA 复制", "识别前期与中期的特征", "观察后期着丝粒分裂", "对比末期与亲代细胞的染色体数"],
    topics: ["module-03-section-02-topic-01", "module-03-section-02-topic-02"],
  },
  {
    id: "meiosis",
    title: "减数分裂与配子形成",
    module: "03",
    summary: "拖动阶段推进减数分裂，追踪同源染色体配对、交叉互换与减半。",
    tags: ["减数分裂", "同源染色体"],
    minutes: 9,
    steps: ["观察联会时期的同源染色体配对", "识别四分体与交叉互换", "追踪减Ⅰ后期同源染色体分离", "对比减Ⅱ与有丝分裂的异同"],
    topics: ["module-03-section-03-topic-01", "module-03-section-03-topic-02"],
  },
  {
    id: "fertilization",
    title: "受精作用与染色体数目恢复",
    module: "03",
    summary: "观察精卵结合前后染色体与 DNA 数目变化，理解减半的意义。",
    tags: ["受精作用", "染色体数目"],
    minutes: 5,
    steps: ["记录配子中的染色体数目", "观察精卵识别与融合过程", "统计受精卵染色体恢复为 2n", "归纳减数分裂+受精作用的互补意义"],
    topics: ["module-03-section-03-topic-04"],
  },
  // ---------- 模块四 古典遗传学 ----------
  {
    id: "segregation",
    title: "分离定律的配子模拟",
    module: "04",
    summary: "设置亲本基因型，用配子棋盘模拟 F₂ 分离比，支持大样本统计。",
    tags: ["孟德尔", "分离定律"],
    minutes: 8,
    steps: ["选择亲本基因型（如 Aa × Aa）", "掷配子生成 F₂ 个体的表型", "增大样本量观察比例趋近 3:1", "用配子法验证测交实验"],
    topics: ["module-04-section-02-topic-01", "module-10-section-04-topic-01"],
  },
  {
    id: "independent-assortment",
    title: "自由组合定律的配子模拟",
    module: "04",
    summary: "两对相对性状杂交，统计 F₂ 表型 9:3:3:1 的模拟结果。",
    tags: ["孟德尔", "自由组合"],
    minutes: 9,
    steps: ["设置 YyRr × YyRr 杂交", "生成 4 种等比例雌雄配子", "统计 F₂ 表型的组合比例", "增大样本量验证 9:3:3:1"],
    topics: ["module-04-section-02-topic-02"],
  },
  {
    id: "sex-linked",
    title: "伴性遗传的血友病系谱",
    module: "04",
    summary: "设置双亲基因型，预测后代患病概率，理解 X 染色体隐性遗传特点。",
    tags: ["伴性遗传", "系谱分析"],
    minutes: 8,
    steps: ["观察血友病在 X 染色体上的隐性基因", "设置携带者母亲与正常父亲的婚配", "统计子女的患病概率分布", "归纳“男多女少、交叉遗传”特点"],
    topics: ["module-04-section-03-topic-01", "module-04-section-03-topic-03"],
  },
  {
    id: "hardy-weinberg",
    title: "遗传平衡与基因频率变化",
    module: "04",
    summary: "调节选择系数或迁移率，观察种群基因频率逐代演化至平衡。",
    tags: ["基因频率", "遗传平衡"],
    minutes: 7,
    steps: ["设置初始 A/a 基因频率", "对某基因型施加选择压力", "逐代观察 p、q 的变化曲线", "验证平衡时 p² + 2pq + q² = 1"],
    topics: ["module-04-section-05-topic-01"],
  },
  // ---------- 模块五 分子遗传学 ----------
  {
    id: "dna-structure",
    title: "DNA 双螺旋结构模型",
    module: "05",
    summary: "旋转双螺旋模型，查看反向平行、碱基配对与大沟小沟结构。",
    tags: ["DNA", "碱基互补配对"],
    minutes: 6,
    steps: ["旋转观察双螺旋整体形态", "放大查看 A-T、G-C 碱基对", "核对两条链的反向平行方向", "统计不同物种 DNA 的 (A+G)/(T+C) 比值"],
    topics: ["module-05-section-01-topic-02"],
  },
  {
    id: "dna-replication",
    title: "DNA 的半保留复制",
    module: "05",
    summary: "观察解旋、引物结合与聚合酶延伸，追踪母链与新链的去向。",
    tags: ["DNA 复制", "半保留"],
    minutes: 8,
    steps: ["观察解旋酶打开双链", "以母链为模板合成互补新链", "追踪复制两代后标记链的分布", "归纳半保留复制的实验证据"],
    topics: ["module-05-section-01-topic-03", "module-05-section-01-topic-04"],
  },
  {
    id: "transcription",
    title: "遗传信息的转录",
    module: "05",
    summary: "以 DNA 模板链合成 mRNA，观察 RNA 聚合酶与碱基配对规则。",
    tags: ["转录", "mRNA"],
    minutes: 6,
    steps: ["区分模板链与编码链", "观察 RNA 聚合酶移动合成 mRNA", "按 A-U、T-A 配对读出密码子序列", "对比转录与复制的异同"],
    topics: ["module-05-section-02-topic-01"],
  },
  {
    id: "translation",
    title: "遗传信息的翻译",
    module: "05",
    summary: "核糖体沿 mRNA 移动，tRNA 反密码子配对，逐个连接氨基酸。",
    tags: ["翻译", "中心法则"],
    minutes: 8,
    steps: ["观察核糖体与 mRNA 的结合", "按密码子表匹配 tRNA 携带的氨基酸", "追踪肽链延伸与 tRNA 离场", "终止密码子出现时释放多肽"],
    topics: ["module-05-section-02-topic-02"],
  },
  {
    id: "central-dogma",
    title: "中心法则的信息流",
    module: "05",
    summary: "在 DNA、RNA、蛋白质与逆转录之间切换信息流，理解完整中心法则。",
    tags: ["中心法则", "信息流"],
    minutes: 6,
    steps: ["沿 DNA→RNA→蛋白质主线传递信息", "加入 RNA 复制（RNA 病毒）", "加入逆转录（HIV）路径", "归纳中心法则的补充与发展"],
    topics: ["module-05-section-03-topic-02"],
  },
  // ---------- 模块六 变异与进化 ----------
  {
    id: "gene-mutation",
    title: "基因突变与密码子改变",
    module: "06",
    summary: "对 DNA 序列做替换、增添、缺失，观察 mRNA 与肽链的连锁后果。",
    tags: ["基因突变", "碱基对"],
    minutes: 7,
    steps: ["对正常基因做单个碱基替换", "观察密码子改变与氨基酸替换", "尝试增添/缺失单个碱基看移码", "对比三种突变对肽链的影响程度"],
    topics: ["module-06-section-01-topic-02", "module-06-section-01-topic-01"],
  },
  {
    id: "chromosome-variation",
    title: "染色体结构与数目变异",
    module: "06",
    summary: "对染色体做缺失、重复、倒位、易位，并整倍体化观察变异结果。",
    tags: ["染色体变异", "染色体组"],
    minutes: 8,
    steps: ["对正常染色体做四种结构变异", "对比各变异区段基因的变化", "切换三体/单体观察数目变异", "构建单倍体、多倍体的染色体组"],
    topics: ["module-06-section-01-topic-04", "module-06-section-01-topic-05"],
  },
  {
    id: "natural-selection",
    title: "自然选择对基因频率的影响",
    module: "06",
    summary: "桦尺蛾场景：设定环境选择压力，观察体色基因频率逐代偏移。",
    tags: ["自然选择", "进化"],
    minutes: 8,
    steps: ["设定工厂污染程度（树皮颜色）", "观察浅色/深色蛾的存活差异", "逐代统计体色基因频率变化", "归纳自然选择的方向性作用"],
    topics: ["module-06-section-02-topic-02", "module-06-section-02-topic-03"],
  },
  // ---------- 模块七 稳态与调节 ----------
  {
    id: "internal-environment",
    title: "内环境的组成与稳态",
    module: "07",
    summary: "在血浆、组织液、淋巴细胞之间移动物质，理解内环境物质交换。",
    tags: ["内环境", "稳态"],
    minutes: 7,
    steps: ["观察血浆/组织液/淋巴的三者关系", "追踪物质在毛细血管壁的双向交换", "注入代谢废物观察稳态调节", "归纳内环境是细胞与外界交换的媒介"],
    topics: ["module-07-section-01-topic-01", "module-07-section-01-topic-02"],
  },
  {
    id: "action-potential",
    title: "神经冲动的产生与传导",
    module: "07",
    summary: "刺激神经纤维，观察静息电位、动作电位峰值与不应期传导。",
    tags: ["神经调节", "动作电位"],
    minutes: 8,
    steps: ["观察静息时外正内负的极化状态", "施加阈上刺激引发 Na⁺ 内流", "追踪动作电位沿膜传导", "绘制电位变化曲线并标注各期"],
    topics: ["module-07-section-02-topic-01", "module-07-section-02-topic-02"],
  },
  {
    id: "blood-glucose",
    title: "血糖平衡的调节",
    module: "07",
    summary: "进食或注射激素，观察胰岛素与胰高血糖素对抗调节血糖回落。",
    tags: ["血糖", "激素调节"],
    minutes: 7,
    steps: ["进餐升高血糖观察激素分泌", "观察胰岛素促进糖原合成", "注射胰岛素观察低血糖风险", "归纳激素间的拮抗与反馈"],
    topics: ["module-07-section-04-topic-02", "module-07-section-03-topic-03"],
  },
  {
    id: "immunity",
    title: "特异性免疫的过程",
    module: "07",
    summary: "病原体入侵后追踪体液免疫与细胞免疫两条应答路径。",
    tags: ["免疫调节", "抗体"],
    minutes: 9,
    steps: ["观察吞噬细胞摄取暴露抗原", "追踪 B 细胞活化分化为浆细胞", "对比 T 细胞杀伤靶细胞路径", "区分二次免疫的快速应答"],
    topics: ["module-07-section-05-topic-02", "module-07-section-05-topic-03"],
  },
  {
    id: "auxin",
    title: "生长素作用的两重性",
    module: "07",
    summary: "调节生长素浓度与器官类型，观察促进/抑制曲线与最适浓度。",
    tags: ["植物激素", "两重性"],
    minutes: 6,
    steps: ["设定器官（根/芽/茎）", "调节生长素浓度观察生长速率", "对比三个器官的敏感顺序", "解释顶端优势与根的向地性"],
    topics: ["module-07-section-06-topic-02"],
  },
  // ---------- 模块八 生物与环境 ----------
  {
    id: "population-growth",
    title: "种群增长的 J 型与 S 型曲线",
    module: "08",
    summary: "调节环境阻力（K 值），观察理想条件下 J 型转向 S 型的增长。",
    tags: ["种群", "环境容纳量"],
    minutes: 7,
    steps: ["理想条件下观察 J 型指数增长", "引入 K 值观察增长速率变化", "对比两种曲线的增长率差异", "调节 K 值预测渔业捕捞量"],
    topics: ["module-08-section-01-topic-05", "module-08-section-01-topic-06"],
  },
  {
    id: "energy-flow",
    title: "生态系统的能量流动",
    module: "08",
    summary: "调节营养级能量传递效率，观察能量金字塔逐级递减。",
    tags: ["能量流动", "营养级"],
    minutes: 7,
    steps: ["观察生产者固定的总能量", "调节传递效率（10%–20%）", "逐级追踪呼吸散失与流入分解者", "解释“一山不容二虎”的能量原因"],
    topics: ["module-08-section-03-topic-01", "module-08-section-03-topic-02"],
  },
  {
    id: "carbon-cycle",
    title: "生态系统的碳循环",
    module: "08",
    summary: "切换光合、呼吸、燃烧与分解路径，追踪碳元素的全局流动。",
    tags: ["物质循环", "碳循环"],
    minutes: 7,
    steps: ["观察大气 CO₂ 库的输入输出", "开启化石燃料燃烧看库失衡", "关闭分解者观察有机物堆积", "归纳碳循环的形式与温室效应成因"],
    topics: ["module-08-section-03-topic-03"],
  },
  // ---------- 模块九 生物技术与工程 ----------
  {
    id: "pcr",
    title: "PCR 扩增 DNA 片段",
    module: "09",
    summary: "控制变性、退火、延伸三步温度循环，观察目标片段指数扩增。",
    tags: ["基因工程", "分子技术"],
    minutes: 8,
    steps: ["95 °C 变性解开双链", "55 °C 引物退火结合", "72 °C Taq 酶延伸", "重复循环，观察产物数量变化"],
    topics: ["module-09-section-03-topic-03", "module-10-section-01-topic-05"],
  },
  {
    id: "gel-electrophoresis",
    title: "琼脂糖凝胶电泳鉴定 DNA",
    module: "09",
    summary: "加样、电泳、染色，按片段大小分离并比对 DNA 条带图谱。",
    tags: ["电泳", "基因工程"],
    minutes: 8,
    steps: ["制备琼脂糖凝胶并点样", "接通电源观察 DNA 向阳极迁移", "小片段跑在前、大片段在后", "与 Marker 比对估算片段大小"],
    topics: ["module-09-section-03-topic-03", "module-10-section-01-topic-05"],
  },
  // ---------- 模块十 实验与探究 ----------
  {
    id: "microscope",
    title: "光学显微镜的使用",
    module: "10",
    summary: "调节物镜倍数、粗细准焦螺旋与光圈，观察洋葱表皮细胞。",
    tags: ["显微观察", "操作规范"],
    minutes: 8,
    steps: ["低倍镜下调节粗准焦螺旋找到物像", "调节光圈与亮度获得均匀视野", "转换高倍物镜，仅使用细准焦螺旋", "记录放大倍数与观察结果"],
    topics: ["module-10-section-02-topic-01"],
  },
  {
    id: "food-tests",
    title: "生物组织中的有机物鉴定",
    module: "10",
    summary: "选样液加试剂，观察还原糖、脂肪、蛋白质的显色反应。",
    tags: ["鉴定实验", "显色反应"],
    minutes: 7,
    steps: ["选待测样液滴加斐林试剂", "水浴加热观察砖红色沉淀", "用双缩脲试剂检测蛋白质", "对比苏丹Ⅲ染色的脂肪颗粒"],
    topics: ["module-10-section-01-topic-01"],
  },
];

/** 统一目录条目：自研仿真与参考实验合并 */
export interface CatalogEntry {
  id: string;
  title: string;
  kind: "sim" | "legacy";
  module: string; // sim 为知识模块号；legacy 为册别分区 id
  summary?: string;
  minutes?: number;
  path?: string; // legacy 的入口 HTML（相对 public）
}

export const catalog: CatalogEntry[] = [
  ...labs.map((l) => ({ id: l.id, title: l.title, kind: "sim" as const, module: l.module, summary: l.summary, minutes: l.minutes })),
  ...legacyLabs.map((l) => ({ id: l.id, title: l.title, kind: "legacy" as const, module: l.module, path: l.path })),
];

export const findLab = (id: string): Lab | undefined => labs.find((l) => l.id === id);
export const findLegacy = (id: string): LegacyLab | undefined => legacyLabs.find((l) => l.id === id);
export { legacyLabs };
