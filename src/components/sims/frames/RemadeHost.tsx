// RemadeHost：自研重制实验的分发器——按配置的 frame 类型渲染对应通用框架。
import type { RemadeLab } from "@/data/remade/schema";
import { ApparatusLab } from "./ApparatusLab";
import { ClassifyGame } from "./ClassifyGame";
import { FieldSurvey } from "./FieldSurvey";
import { InquiryLab } from "./InquiryLab";
import { ModelBuilder } from "./ModelBuilder";
import { ObserveScope } from "./ObserveScope";
import { ProcessFlow } from "./ProcessFlow";

export function RemadeHost({ spec, title }: { spec: RemadeLab; title: string }) {
  switch (spec.frame) {
    case "observe":
      return <ObserveScope config={spec} title={title} />;
    case "process":
      return <ProcessFlow config={spec} title={title} />;
    case "apparatus":
      return <ApparatusLab config={spec} title={title} />;
    case "inquiry":
      return <InquiryLab config={spec} title={title} />;
    case "builder":
      return <ModelBuilder config={spec} title={title} />;
    case "classify":
      return <ClassifyGame config={spec} title={title} />;
    case "survey":
      return <FieldSurvey config={spec} title={title} />;
  }
}
