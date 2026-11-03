import { ModelAnnotation } from '../types/annotation';

export const MECHANICAL_ANNOTATIONS: ModelAnnotation[] = [
  {
    id: 'mech-turbine',
    title: '主轴高速透平叶轮 (Turbine Impeller)',
    category: '旋转动力核心',
    description: '钛合金数控五轴整体精雕叶盘，耐受超高转速与流体冲击动力学负荷。',
    anchorPoint: [0.0, 0.35, 0.0],
    labelPoint: [0.20, 0.65, 0.12],
    normal: [0.5, 0.8, 0.3],
    color: '#06b6d4',
    createdAt: 101,
    specs: [
      { key: '材料牌号', value: 'TC4-ELI 航空级钛合金' },
      { key: '额定转速', value: '28,000 RPM' },
      { key: '动平衡精度', value: 'ISO G1.0' }
    ]
  },
  {
    id: 'mech-bearing',
    title: '双列圆锥精密滚子轴承 (Dual Bearing)',
    category: '传动支撑总成',
    description: '承受重载径向与轴向双向联合载荷，配备微米级预紧调节螺母。',
    anchorPoint: [0.0, 0.0, 0.38],
    labelPoint: [0.10, 0.05, 0.72],
    normal: [0.2, 0.1, 0.9],
    color: '#f59e0b',
    createdAt: 102,
    specs: [
      { key: '精度等级', value: 'P4 (ABEC-7)' },
      { key: '润滑方式', value: '微量油气润滑' }
    ]
  },
  {
    id: 'mech-housing',
    title: '对开式轻量化承载机匣 (Main Casing)',
    category: '外部结构框架',
    description: '拓扑优化网状加强筋壳体，具备优良的抗震阻尼与散热对流风道。',
    anchorPoint: [-0.65, -0.2, 0.0],
    labelPoint: [-0.98, -0.05, 0.05],
    normal: [-0.9, 0.4, 0.1],
    color: '#8b5cf6',
    createdAt: 103,
    specs: [
      { key: '成型工艺', value: '激光粉末床熔融 (SLM 3D打印)' },
      { key: '冷却通道', value: '内置共形异形流道' }
    ]
  }
];
