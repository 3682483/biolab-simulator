// 由 参考/lilinbio/data 知识地图自动生成 —— 高中生物 10 模块 / 44 分类 / 200 知识点
// status 为原站资源规划视角；本平台实验覆盖情况在 map.tsx 中由 labs 注册表实时计算

export type PlanStatus = "live" | "plan" | "later" | "todo";

export interface TopicNode {
  id: string;
  title: string;
  plan: PlanStatus; // 资源规划参考：原站已发布 / 制作规划 / 后续规划 / 待开发
}

export interface SectionNode {
  id: string;
  title: string;
  topics: TopicNode[];
}

export interface ModuleNode {
  id: string;
  title: string;
  sections: SectionNode[];
}

export const knowledgeMap: ModuleNode[] = [
  {
    id: "module-01",
    title: "模块一、细胞的结构基础",
    sections: [
      {
        id: "module-01-section-01",
        title: "一、组成细胞的分子",
        topics: [
          { id: "module-01-section-01-topic-01", title: "1. 细胞中的元素", plan: "live" },
          { id: "module-01-section-01-topic-02", title: "2. 细胞中的水", plan: "later" },
          { id: "module-01-section-01-topic-03", title: "3. 细胞中的无机盐", plan: "later" },
          { id: "module-01-section-01-topic-04", title: "4. 细胞中的糖类", plan: "later" },
          { id: "module-01-section-01-topic-05", title: "5. 细胞中的脂质", plan: "plan" },
          { id: "module-01-section-01-topic-06", title: "6. 蛋白质是生命活动的主要承担者", plan: "live" },
          { id: "module-01-section-01-topic-07", title: "7. 核酸是遗传信息的携带者", plan: "todo" },
          { id: "module-01-section-01-topic-08", title: "8. 生物大分子", plan: "todo" },
        ],
      },
      {
        id: "module-01-section-02",
        title: "二、细胞的基本结构",
        topics: [
          { id: "module-01-section-02-topic-01", title: "1. 细胞膜的结构与功能", plan: "live" },
          { id: "module-01-section-02-topic-02", title: "2. 细胞器之间的分工合作", plan: "todo" },
          { id: "module-01-section-02-topic-03", title: "3. 细胞核的结构与功能", plan: "todo" },
          { id: "module-01-section-02-topic-04", title: "4. 生物膜系统", plan: "live" },
        ],
      },
      {
        id: "module-01-section-03",
        title: "三、细胞学说及其拓展",
        topics: [
          { id: "module-01-section-03-topic-01", title: "1. 细胞学说及其建立过程", plan: "todo" },
          { id: "module-01-section-03-topic-02", title: "2. 生命系统的结构层次", plan: "later" },
          { id: "module-01-section-03-topic-03", title: "3. 原核细胞和真核细胞", plan: "plan" },
          { id: "module-01-section-03-topic-04", title: "4. 病毒的结构和特点", plan: "later" },
        ],
      },
    ],
  },
  {
    id: "module-02",
    title: "模块二、细胞代谢",
    sections: [
      {
        id: "module-02-section-01",
        title: "一、细胞的物质输入和输出",
        topics: [
          { id: "module-02-section-01-topic-01", title: "1. 渗透作用", plan: "live" },
          { id: "module-02-section-01-topic-02", title: "2. 细胞的吸水与失水", plan: "later" },
          { id: "module-02-section-01-topic-03", title: "3. 被动运输与主动运输", plan: "todo" },
          { id: "module-02-section-01-topic-04", title: "4. 胞吞、胞吐与核孔运输", plan: "later" },
          { id: "module-02-section-01-topic-05", title: "5. 物质跨膜运输的判断", plan: "live" },
        ],
      },
      {
        id: "module-02-section-02",
        title: "二、降低化学反应活化能的酶",
        topics: [
          { id: "module-02-section-02-topic-01", title: "1. 酶的作用与本质", plan: "later" },
          { id: "module-02-section-02-topic-02", title: "2. 酶的特性", plan: "later" },
          { id: "module-02-section-02-topic-03", title: "3. 酶促反应的影响因素和曲线分析", plan: "later" },
          { id: "module-02-section-02-topic-04", title: "4. 酶的类型和命名", plan: "later" },
          { id: "module-02-section-02-topic-05", title: "5. 酶的研究历程及应用", plan: "todo" },
        ],
      },
      {
        id: "module-02-section-03",
        title: "三、ATP与辅酶",
        topics: [
          { id: "module-02-section-03-topic-01", title: "1. 细胞的能量“货币”ATP", plan: "later" },
          { id: "module-02-section-03-topic-02", title: "2. 辅酶的种类、结构与功能", plan: "later" },
        ],
      },
      {
        id: "module-02-section-04",
        title: "四、细胞呼吸的原理和应用",
        topics: [
          { id: "module-02-section-04-topic-01", title: "1. 细胞呼吸的概念与种类", plan: "live" },
          { id: "module-02-section-04-topic-02", title: "2. 细胞呼吸的过程", plan: "live" },
          { id: "module-02-section-04-topic-03", title: "3. 细胞呼吸的影响因素与应用", plan: "live" },
          { id: "module-02-section-04-topic-04", title: "4. 呼吸商与细胞呼吸计算", plan: "live" },
        ],
      },
      {
        id: "module-02-section-05",
        title: "五、光合作用与能量转化",
        topics: [
          { id: "module-02-section-05-topic-01", title: "1. 光合作用的概念和原理", plan: "live" },
          { id: "module-02-section-05-topic-02", title: "2. 捕获光能的色素", plan: "later" },
          { id: "module-02-section-05-topic-03", title: "3. 光合作用的过程", plan: "live" },
          { id: "module-02-section-05-topic-04", title: "4. 光合作用的探究历程", plan: "live" },
          { id: "module-02-section-05-topic-05", title: "5. 光合作用的影响因素与应用", plan: "live" },
        ],
      },
      {
        id: "module-02-section-06",
        title: "六、光合呼吸综合分析",
        topics: [
          { id: "module-02-section-06-topic-01", title: "1. 细胞代谢过程拓展", plan: "todo" },
          { id: "module-02-section-06-topic-02", title: "2. 生物代谢类型总结", plan: "todo" },
          { id: "module-02-section-06-topic-03", title: "3. 光合呼吸综合计算类问题", plan: "plan" },
          { id: "module-02-section-06-topic-04", title: "4. 光合呼吸综合图像类问题", plan: "plan" },
          { id: "module-02-section-06-topic-05", title: "5. 光合呼吸综合实验类问题", plan: "todo" },
          { id: "module-02-section-06-topic-06", title: "6. 日变化类问题", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-03",
    title: "模块三、细胞的生命历程",
    sections: [
      {
        id: "module-03-section-01",
        title: "一、细胞增殖与细胞周期",
        topics: [
          { id: "module-03-section-01-topic-01", title: "1. 细胞增殖", plan: "todo" },
          { id: "module-03-section-01-topic-02", title: "2. 细胞周期", plan: "later" },
        ],
      },
      {
        id: "module-03-section-02",
        title: "二、有丝分裂",
        topics: [
          { id: "module-03-section-02-topic-01", title: "1. 有丝分裂模型", plan: "plan" },
          { id: "module-03-section-02-topic-02", title: "2. 高等植物细胞的有丝分裂", plan: "live" },
          { id: "module-03-section-02-topic-03", title: "3. 动物细胞的有丝分裂", plan: "live" },
          { id: "module-03-section-02-topic-04", title: "4. 无丝分裂", plan: "plan" },
        ],
      },
      {
        id: "module-03-section-03",
        title: "三、减数分裂和受精作用",
        topics: [
          { id: "module-03-section-03-topic-01", title: "1. 减数分裂的模型", plan: "plan" },
          { id: "module-03-section-03-topic-02", title: "2. 精子的形成过程", plan: "todo" },
          { id: "module-03-section-03-topic-03", title: "3. 卵细胞的形成过程", plan: "later" },
          { id: "module-03-section-03-topic-04", title: "4. 受精作用", plan: "later" },
        ],
      },
      {
        id: "module-03-section-04",
        title: "四、细胞分裂题型归纳",
        topics: [
          { id: "module-03-section-04-topic-01", title: "1. 细胞分裂时期判断", plan: "todo" },
          { id: "module-03-section-04-topic-02", title: "2. 细胞分裂数量判断", plan: "todo" },
          { id: "module-03-section-04-topic-03", title: "3. 配子种类判断", plan: "todo" },
          { id: "module-03-section-04-topic-04", title: "4. 分裂异常判断", plan: "todo" },
          { id: "module-03-section-04-topic-05", title: "5. 复制标记判断", plan: "later" },
        ],
      },
      {
        id: "module-03-section-05",
        title: "五、细胞的分化、衰老和死亡",
        topics: [
          { id: "module-03-section-05-topic-01", title: "1. 细胞的分化与全能性", plan: "later" },
          { id: "module-03-section-05-topic-02", title: "2. 细胞的衰老", plan: "later" },
          { id: "module-03-section-05-topic-03", title: "3. 细胞的死亡", plan: "todo" },
          { id: "module-03-section-05-topic-04", title: "4. 细胞的癌变", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-04",
    title: "模块四、古典遗传学",
    sections: [
      {
        id: "module-04-section-01",
        title: "一、遗传学基本概念",
        topics: [
          { id: "module-04-section-01-topic-01", title: "1. 常用符号", plan: "todo" },
          { id: "module-04-section-01-topic-02", title: "2. 常用概念", plan: "todo" },
          { id: "module-04-section-01-topic-03", title: "3. 实验材料的选择", plan: "todo" },
          { id: "module-04-section-01-topic-04", title: "4. 遗传的图像分析", plan: "live" },
          { id: "module-04-section-01-topic-05", title: "5. 研究方法", plan: "todo" },
          { id: "module-04-section-01-topic-06", title: "6. 概率计算的基本原理", plan: "todo" },
        ],
      },
      {
        id: "module-04-section-02",
        title: "二、遗传学三大定律",
        topics: [
          { id: "module-04-section-02-topic-01", title: "1. 分离定律", plan: "live" },
          { id: "module-04-section-02-topic-02", title: "2. 自由组合定律", plan: "todo" },
          { id: "module-04-section-02-topic-03", title: "3. 连锁互换定律", plan: "todo" },
        ],
      },
      {
        id: "module-04-section-03",
        title: "三、伴性遗传",
        topics: [
          { id: "module-04-section-03-topic-01", title: "1. 生物的性别决定", plan: "todo" },
          { id: "module-04-section-03-topic-02", title: "2. 摩尔根果蝇眼色实验", plan: "todo" },
          { id: "module-04-section-03-topic-03", title: "3. 伴性遗传的类型和特点", plan: "later" },
        ],
      },
      {
        id: "module-04-section-04",
        title: "四、遗传的解题方法",
        topics: [
          { id: "module-04-section-04-topic-01", title: "1. 配子法", plan: "todo" },
          { id: "module-04-section-04-topic-02", title: "2. 分解组合法", plan: "todo" },
        ],
      },
      {
        id: "module-04-section-05",
        title: "五、遗传学综合题型归纳",
        topics: [
          { id: "module-04-section-05-topic-01", title: "1. 遗传平衡分析", plan: "later" },
          { id: "module-04-section-05-topic-02", title: "2. 连续自交和连续自由交配", plan: "todo" },
          { id: "module-04-section-05-topic-03", title: "3. 基因互作推导", plan: "todo" },
          { id: "module-04-section-05-topic-04", title: "4. 系谱图的经典分析和创新", plan: "todo" },
          { id: "module-04-section-05-topic-05", title: "5. 遗传学实验设计", plan: "todo" },
          { id: "module-04-section-05-topic-06", title: "6. 创新类综合遗传分析", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-05",
    title: "模块五、分子遗传学",
    sections: [
      {
        id: "module-05-section-01",
        title: "一、基因的本质",
        topics: [
          { id: "module-05-section-01-topic-01", title: "1. DNA是主要的遗传物质", plan: "live" },
          { id: "module-05-section-01-topic-02", title: "2. DNA的结构", plan: "live" },
          { id: "module-05-section-01-topic-03", title: "3. DNA的复制", plan: "live" },
          { id: "module-05-section-01-topic-04", title: "4. DNA半保留复制的实验证据", plan: "todo" },
        ],
      },
      {
        id: "module-05-section-02",
        title: "二、基因的表达",
        topics: [
          { id: "module-05-section-02-topic-01", title: "1. 基因的转录", plan: "todo" },
          { id: "module-05-section-02-topic-02", title: "2. 基因的翻译", plan: "live" },
          { id: "module-05-section-02-topic-03", title: "3. 基因表达与性状的关系", plan: "todo" },
          { id: "module-05-section-02-topic-04", title: "4. 基因的选择性表达", plan: "todo" },
        ],
      },
      {
        id: "module-05-section-03",
        title: "三、中心法则",
        topics: [
          { id: "module-05-section-03-topic-01", title: "1. 本质", plan: "todo" },
          { id: "module-05-section-03-topic-02", title: "2. 内容", plan: "todo" },
          { id: "module-05-section-03-topic-03", title: "3. 意义", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-06",
    title: "模块六、生物的变异与进化",
    sections: [
      {
        id: "module-06-section-01",
        title: "一、可遗传变异",
        topics: [
          { id: "module-06-section-01-topic-01", title: "1. 可遗传变异的概念和类型", plan: "todo" },
          { id: "module-06-section-01-topic-02", title: "2. 基因突变", plan: "plan" },
          { id: "module-06-section-01-topic-03", title: "3. 基因重组", plan: "plan" },
          { id: "module-06-section-01-topic-04", title: "4. 染色体结构的变异", plan: "plan" },
          { id: "module-06-section-01-topic-05", title: "5. 染色体数目的变异", plan: "plan" },
          { id: "module-06-section-01-topic-06", title: "6. 人类遗传病", plan: "live" },
        ],
      },
      {
        id: "module-06-section-02",
        title: "二、生物的进化",
        topics: [
          { id: "module-06-section-02-topic-01", title: "1. 生物有共同的祖先", plan: "todo" },
          { id: "module-06-section-02-topic-02", title: "2. 自然选择与适应的形成", plan: "todo" },
          { id: "module-06-section-02-topic-03", title: "3. 种群的进化", plan: "live" },
          { id: "module-06-section-02-topic-04", title: "4. 物种的形成", plan: "todo" },
          { id: "module-06-section-02-topic-05", title: "5. 协同进化与生物多样性", plan: "todo" },
          { id: "module-06-section-02-topic-06", title: "6. 新的进化理论在不断地发展", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-07",
    title: "模块七、稳态与调节",
    sections: [
      {
        id: "module-07-section-01",
        title: "一、内环境与稳态",
        topics: [
          { id: "module-07-section-01-topic-01", title: "1. 内环境的概念及组成", plan: "later" },
          { id: "module-07-section-01-topic-02", title: "2. 内环境的稳态与调节", plan: "plan" },
        ],
      },
      {
        id: "module-07-section-02",
        title: "二、神经调节",
        topics: [
          { id: "module-07-section-02-topic-01", title: "1. 神经调节的结构基础", plan: "todo" },
          { id: "module-07-section-02-topic-02", title: "2. 神经冲动的产生和传导", plan: "live" },
          { id: "module-07-section-02-topic-03", title: "3. 神经系统的分级调节", plan: "todo" },
          { id: "module-07-section-02-topic-04", title: "4. 人脑的高级功能", plan: "todo" },
        ],
      },
      {
        id: "module-07-section-03",
        title: "三、体液调节",
        topics: [
          { id: "module-07-section-03-topic-01", title: "1. 激素调节的发现和研究激素的方法", plan: "later" },
          { id: "module-07-section-03-topic-02", title: "2. 内分泌系统的组成和功能", plan: "later" },
          { id: "module-07-section-03-topic-03", title: "3. 体液调节", plan: "todo" },
          { id: "module-07-section-03-topic-04", title: "4. 激素的应用", plan: "later" },
        ],
      },
      {
        id: "module-07-section-04",
        title: "四、神经调节与体液调节的关系",
        topics: [
          { id: "module-07-section-04-topic-01", title: "1. 神经调节与体液调节的比较", plan: "todo" },
          { id: "module-07-section-04-topic-02", title: "2. 血糖平衡的调节", plan: "plan" },
          { id: "module-07-section-04-topic-03", title: "3. 体温的调节", plan: "plan" },
          { id: "module-07-section-04-topic-04", title: "4. 水盐平衡的调节", plan: "plan" },
        ],
      },
      {
        id: "module-07-section-05",
        title: "五、免疫调节",
        topics: [
          { id: "module-07-section-05-topic-01", title: "1. 免疫系统的组成", plan: "plan" },
          { id: "module-07-section-05-topic-02", title: "2. 免疫系统的功能", plan: "plan" },
          { id: "module-07-section-05-topic-03", title: "3. 免疫调节的过程", plan: "plan" },
          { id: "module-07-section-05-topic-04", title: "4. 免疫失调", plan: "plan" },
          { id: "module-07-section-05-topic-05", title: "5. 免疫应用", plan: "plan" },
          { id: "module-07-section-05-topic-06", title: "6. 神经—体液—免疫调节的协调配合", plan: "todo" },
        ],
      },
      {
        id: "module-07-section-06",
        title: "六、植物生命活动的调节",
        topics: [
          { id: "module-07-section-06-topic-01", title: "1. 生长素的发现历程", plan: "todo" },
          { id: "module-07-section-06-topic-02", title: "2. 植物激素的概念、种类和功能", plan: "todo" },
          { id: "module-07-section-06-topic-03", title: "3. 植物生长调节剂的应用", plan: "live" },
          { id: "module-07-section-06-topic-04", title: "4. 环境因素参与调节植物的生命活动", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-08",
    title: "模块八、生物与环境",
    sections: [
      {
        id: "module-08-section-01",
        title: "一、种群及其动态",
        topics: [
          { id: "module-08-section-01-topic-01", title: "1. 种群的概念和特征", plan: "todo" },
          { id: "module-08-section-01-topic-02", title: "2. 种群的数量特征", plan: "todo" },
          { id: "module-08-section-01-topic-03", title: "3. 种群密度的调查", plan: "todo" },
          { id: "module-08-section-01-topic-04", title: "4. 种群的空间特征", plan: "todo" },
          { id: "module-08-section-01-topic-05", title: "5. 种群数量的变化", plan: "todo" },
          { id: "module-08-section-01-topic-06", title: "6. 影响种群数量变化的因素", plan: "todo" },
        ],
      },
      {
        id: "module-08-section-02",
        title: "二、群落及其演替",
        topics: [
          { id: "module-08-section-02-topic-01", title: "1. 群落的概念和基本特征", plan: "live" },
          { id: "module-08-section-02-topic-02", title: "2. 群落的结构", plan: "live" },
          { id: "module-08-section-02-topic-03", title: "3. 群落的主要类型", plan: "live" },
          { id: "module-08-section-02-topic-04", title: "4. 群落的演替", plan: "live" },
        ],
      },
      {
        id: "module-08-section-03",
        title: "三、生态系统及其稳定性",
        topics: [
          { id: "module-08-section-03-topic-01", title: "1. 生态系统的概念和结构", plan: "later" },
          { id: "module-08-section-03-topic-02", title: "2. 生态系统的能量流动", plan: "later" },
          { id: "module-08-section-03-topic-03", title: "3. 生态系统的物质循环", plan: "later" },
          { id: "module-08-section-03-topic-04", title: "4. 生态系统的信息传递", plan: "later" },
          { id: "module-08-section-03-topic-05", title: "5. 生态系统的稳定性", plan: "later" },
        ],
      },
      {
        id: "module-08-section-04",
        title: "四、人与环境",
        topics: [
          { id: "module-08-section-04-topic-01", title: "1. 人口增长与生态足迹", plan: "todo" },
          { id: "module-08-section-04-topic-02", title: "2. 全球性生态环境问题", plan: "todo" },
          { id: "module-08-section-04-topic-03", title: "3. 生物多样性及其保护", plan: "todo" },
          { id: "module-08-section-04-topic-04", title: "4. 生态工程", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-09",
    title: "模块九、生物技术与工程",
    sections: [
      {
        id: "module-09-section-01",
        title: "一、发酵工程",
        topics: [
          { id: "module-09-section-01-topic-01", title: "1. 传统发酵技术", plan: "todo" },
          { id: "module-09-section-01-topic-02", title: "2. 微生物的基本培养技术", plan: "later" },
          { id: "module-09-section-01-topic-03", title: "3. 发酵工程及其应用", plan: "todo" },
        ],
      },
      {
        id: "module-09-section-02",
        title: "二、细胞工程",
        topics: [
          { id: "module-09-section-02-topic-01", title: "1. 细胞工程的概念和分类", plan: "todo" },
          { id: "module-09-section-02-topic-02", title: "2. 植物细胞工程", plan: "todo" },
          { id: "module-09-section-02-topic-03", title: "3. 动物细胞工程", plan: "todo" },
          { id: "module-09-section-02-topic-04", title: "4. 胚胎工程", plan: "later" },
        ],
      },
      {
        id: "module-09-section-03",
        title: "三、基因工程",
        topics: [
          { id: "module-09-section-03-topic-01", title: "1. 基因工程的原理", plan: "todo" },
          { id: "module-09-section-03-topic-02", title: "2. 基因工程的工具", plan: "todo" },
          { id: "module-09-section-03-topic-03", title: "3. 基因工程的技术", plan: "todo" },
          { id: "module-09-section-03-topic-04", title: "4. 基因工程的步骤", plan: "todo" },
          { id: "module-09-section-03-topic-05", title: "5. 基因工程的应用", plan: "todo" },
          { id: "module-09-section-03-topic-06", title: "6. 蛋白质工程的原理和应用", plan: "todo" },
        ],
      },
      {
        id: "module-09-section-04",
        title: "四、生物技术的安全性和伦理问题",
        topics: [
          { id: "module-09-section-04-topic-01", title: "1. 转基因产品的安全性", plan: "todo" },
          { id: "module-09-section-04-topic-02", title: "2. 关注生殖性克隆人", plan: "todo" },
          { id: "module-09-section-04-topic-03", title: "3. 禁止生物武器", plan: "todo" },
        ],
      },
    ],
  },
  {
    id: "module-10",
    title: "模块十、实验与探究",
    sections: [
      {
        id: "module-10-section-01",
        title: "一、分离鉴定类实验",
        topics: [
          { id: "module-10-section-01-topic-01", title: "1. 检测生物组织中的糖类、脂肪和蛋白质", plan: "live" },
          { id: "module-10-section-01-topic-02", title: "2. 绿叶中色素的提取和分离", plan: "later" },
          { id: "module-10-section-01-topic-03", title: "3. 土壤中分解尿素的细菌的分离和计数", plan: "todo" },
          { id: "module-10-section-01-topic-04", title: "4. DNA的粗提取与鉴定", plan: "live" },
          { id: "module-10-section-01-topic-05", title: "5. DNA片段的扩增及电泳鉴定", plan: "todo" },
        ],
      },
      {
        id: "module-10-section-02",
        title: "二、显微观察类实验",
        topics: [
          { id: "module-10-section-02-topic-01", title: "1. 用高倍显微镜观察几种细胞", plan: "live" },
          { id: "module-10-section-02-topic-02", title: "2. 用高倍显微镜观察叶绿体和细胞质的流动", plan: "live" },
          { id: "module-10-section-02-topic-03", title: "3. 观察根尖分生区组织细胞的有丝分裂", plan: "plan" },
          { id: "module-10-section-02-topic-04", title: "4. 观察蝗虫精母细胞减数分裂固定装片", plan: "plan" },
          { id: "module-10-section-02-topic-05", title: "5. 低温诱导染色体数目的变化", plan: "later" },
        ],
      },
      {
        id: "module-10-section-03",
        title: "三、培养反应类实验",
        topics: [
          { id: "module-10-section-03-topic-01", title: "1. 比较过氧化氢在不同条件下的分解", plan: "todo" },
          { id: "module-10-section-03-topic-02", title: "2. 淀粉酶对淀粉和蔗糖的水解作用", plan: "todo" },
          { id: "module-10-section-03-topic-03", title: "3. 模拟生物体维持pH的稳定", plan: "todo" },
          { id: "module-10-section-03-topic-04", title: "4. 设计并制作生态缸，观察其稳定性", plan: "todo" },
          { id: "module-10-section-03-topic-05", title: "5. 制作传统发酵食品", plan: "todo" },
          { id: "module-10-section-03-topic-06", title: "6. 酵母菌的纯培养", plan: "todo" },
          { id: "module-10-section-03-topic-07", title: "7. 菊花的组织培养", plan: "todo" },
        ],
      },
      {
        id: "module-10-section-04",
        title: "四、调查统计类实验",
        topics: [
          { id: "module-10-section-04-topic-01", title: "1. 性状分离比的模拟", plan: "todo" },
          { id: "module-10-section-04-topic-02", title: "2. 调查人群中的遗传病", plan: "todo" },
          { id: "module-10-section-04-topic-03", title: "3. 用样方法调查草地中某种双子叶植物的种群密度", plan: "todo" },
          { id: "module-10-section-04-topic-04", title: "4. 调查当地某生态系统中的能量流动情况", plan: "later" },
          { id: "module-10-section-04-topic-05", title: "5. 调查当地的环境状况，提出保护环境的建议或行动计划", plan: "todo" },
          { id: "module-10-section-04-topic-06", title: "6. 搜集保护生物多样性的实例", plan: "todo" },
        ],
      },
      {
        id: "module-10-section-05",
        title: "五、模型构建类实验",
        topics: [
          { id: "module-10-section-05-topic-01", title: "1. 尝试制作真核细胞的三维结构模型", plan: "todo" },
          { id: "module-10-section-05-topic-02", title: "2. 建立减数分裂中染色体变化的模型", plan: "plan" },
          { id: "module-10-section-05-topic-03", title: "3. 制作DNA双螺旋结构模型", plan: "live" },
        ],
      },
      {
        id: "module-10-section-06",
        title: "六、探究类实验",
        topics: [
          { id: "module-10-section-06-topic-01", title: "1. 探究植物细胞的吸水与失水", plan: "live" },
          { id: "module-10-section-06-topic-02", title: "2. 探究影响酶活性的条件", plan: "todo" },
          { id: "module-10-section-06-topic-03", title: "3. 探究酵母菌细胞呼吸的方式", plan: "todo" },
          { id: "module-10-section-06-topic-04", title: "4. 探究环境因素对光合作用强度的影响", plan: "live" },
          { id: "module-10-section-06-topic-05", title: "5. 探究自然选择对种群基因频率变化的影响", plan: "todo" },
          { id: "module-10-section-06-topic-06", title: "6. 探究抗生素对细菌的选择作用", plan: "todo" },
          { id: "module-10-section-06-topic-07", title: "7. 探索植物生长调节剂的应用", plan: "todo" },
          { id: "module-10-section-06-topic-08", title: "8. 探究培养液中酵母菌种群数量的变化", plan: "todo" },
          { id: "module-10-section-06-topic-09", title: "9. 研究土壤中小动物类群的丰富度", plan: "todo" },
          { id: "module-10-section-06-topic-10", title: "10. 探究土壤微生物的分解作用", plan: "todo" },
        ],
      },
    ],
  },
];
