import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// three.js 体积大，仅在 /tools 路由按需加载（lazy + Suspense，SSR 走 fallback）
const OmniModel3D = lazy(() => import("@/components/biocell3d/components/OmniModel3D"));

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "仿真模型库 · 生命实验室" },
      {
        name: "description",
        content: "通用 GLB / GLTF 3D 模型交互查看、空间打标、独立网页导出，内置机械工程演示模型。",
      },
      { property: "og:title", content: "仿真模型库 · 生命实验室" },
      { property: "og:description", content: "通用 3D 模型交互与空间打标系统。" },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  // 查看器直接占满整个视口，无页面级说明；返回主页按钮在查看器 header 内
  return (
    <main className="w-full">
      <Suspense
        fallback={
          <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-slate-950">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            <p className="text-sm text-slate-400">正在加载 3D 引擎与模型库…</p>
          </div>
        }
      >
        <OmniModel3D />
      </Suspense>
    </main>
  );
}
