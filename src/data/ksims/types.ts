// 知识点微实验类型：key 为 knowledge-map 的 topic id，配置复用自研 7 框架 schema
import type { RemadeLab } from "../remade/schema";

export interface KnowledgeSim {
  title: string;
  spec: RemadeLab;
}
