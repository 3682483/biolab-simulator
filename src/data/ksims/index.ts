// 知识点微实验注册表：81 个未覆盖知识点的自研交互微实验
// key = knowledge-map.ts 的 topic id；配置渲染复用 RemadeHost 七框架（DRY，不新写组件）
import type { Lab } from "@/lib/labs";
import type { KnowledgeSim } from "./types";
import { m0102Sims } from "./m0102";
import { m0304Sims } from "./m0304";
import { m0507Sims } from "./m0507";
import { m0809Sims } from "./m0809";
import { m10Sims } from "./m10";

export type { KnowledgeSim } from "./types";

export const knowledgeSims: Record<string, KnowledgeSim> = {
  ...m0102Sims,
  ...m0304Sims,
  ...m0507Sims,
  ...m0809Sims,
  ...m10Sims,
};

export const knowledgeSimCount = Object.keys(knowledgeSims).length;

/** 知识点 id → 目录/路由可用的 Lab 形条目（module 号取 topic id 的模块段） */
export const findKnowledgeSim = (id: string): Lab | undefined => {
  const ks = knowledgeSims[id];
  if (!ks) return undefined;
  const moduleNum = id.split("-")[1] ?? "01";
  return {
    id,
    title: ks.title,
    module: moduleNum,
    summary: `「${ks.title}」知识点配套微实验：调节条件、观察现象、归纳要点。`,
    tags: ["知识点微实验"],
    minutes: 5,
    steps: [],
    topics: [id],
  };
};
