import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { ArrowLeft, Box, Boxes, Tags, Globe, Download, ShieldCheck, Sparkles } from "lucide-react";

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

const features = [
  {
    icon: Boxes,
    title: "内置演示模型",
    desc: "航发透平机械工程演示模型一键载入即用，配套完整工程标注示例，快速上手 3D 打标流程。",
    accent: "text-cyan-500",
  },
  {
    icon: Box,
    title: "任意 GLB / GLTF 导入",
    desc: "拖拽或点选导入本地模型文件，自动等比缩放至 40% 视口比例，纯前端本地解析，数据不出浏览器。",
    accent: "text-cyan-500",
  },
  {
    icon: Tags,
    title: "3D 空间打标",
    desc: "在模型表面点击即可添加锚点标注，引线、标签卡全程跟随视角，支持批量管理与显隐控制。",
    accent: "text-amber-500",
  },
  {
    icon: Globe,
    title: "独立网页导出",
    desc: "将模型与全部标注打包成一个可离线打开的 HTML 网页，直接发给学生或同事，无需任何环境。",
    accent: "text-emerald-500",
  },
  {
    icon: Download,
    title: "GLB 打包与备份",
    desc: "标注数据可导出 JSON 备份、随时恢复；模型连同 3D 引线标签可重新打包为 GLB 下载复用。",
    accent: "text-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "本地私有安全",
    desc: "所有解析、渲染、导出全部在浏览器本地完成，不上传服务器，课件模型知识产权无忧。",
    accent: "text-rose-500",
  },
];

function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* 页头 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-500 text-primary-foreground">
              <Box className="h-5 w-5" />
            </span>
            仿真模型库
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            3D 交互模型查看与空间打标系统：内置机械工程演示模型，亦支持导入任意生物 / 工程
            GLB 模型，标注后可导出独立网页用于课堂教学。
          </p>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-600 sm:flex dark:text-cyan-400">
          <Sparkles className="h-3.5 w-3.5" />
          3D 模型交互 · 空间打标
        </div>
      </div>

      {/* 3D 查看器（按需加载 three.js） */}
      <Suspense
        fallback={
          <div className="flex h-[calc(100dvh-11rem)] min-h-[560px] w-full flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/40">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-violet-500" />
            <p className="text-sm text-muted-foreground">正在加载 3D 引擎与模型库…</p>
          </div>
        }
      >
        <OmniModel3D />
      </Suspense>

      {/* 功能说明 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">这个库能干什么</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <f.icon className={`mb-2 h-5 w-5 ${f.accent}`} />
              <h3 className="mb-1 text-sm font-semibold">{f.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 使用提示 */}
      <section className="mt-8 rounded-xl border border-dashed bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">上手提示</p>
        <p>
          进入查看器后点击「载入：航发透平机械演示模型」体验内置工程标注示例；开启「打标」模式后可在模型表面点击添加自己的标注点；
          顶部支持导出独立 HTML 网页、打包 GLB 与标注 JSON 备份。鼠标左键旋转、右键平移、滚轮缩放。
        </p>
      </section>
    </main>
  );
}
