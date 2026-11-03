// 自研重制实验注册表：key 为 legacy 实验 id。
// 配置齐一册，iframe 引用就少一册——最终目标是 347 个全部替换为自研框架渲染。
import type { RemadeLab } from "./schema";
import { bx1Remade } from "./bx1";
import { bx2Remade } from "./bx2";
import { xx1Remade } from "./xx1";
import { xx2Remade } from "./xx2";
import { xx3Remade } from "./xx3";
import { cz1Remade } from "./cz1";
import { cz2Remade } from "./cz2";
import { cz3Remade } from "./cz3";
import { cz4Remade } from "./cz4";

export const remadeLabs: Record<string, RemadeLab> = {
  ...bx1Remade,
  ...bx2Remade,
  ...xx1Remade,
  ...xx2Remade,
  ...xx3Remade,
  ...cz1Remade,
  ...cz2Remade,
  ...cz3Remade,
  ...cz4Remade,
};

export const remadeCount = Object.keys(remadeLabs).length;
