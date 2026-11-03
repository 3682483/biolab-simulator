# 生命实验室 · BioLab Simulator

面向高中生物的虚拟仿真实验平台。所有实验均以原生 React 交互实现：调节参数、切换阶段、观察结构与生命过程变化，覆盖必修与选择性必修的 10 大知识模块。

线上入口：[biolab-simulator](https://github.com/3682483/biolab-simulator)

## 功能概览

| 能力 | 说明 |
| --- | --- |
| 自研仿真实验 | 41 个独立交互实验（光学显微镜、渗透作用、光合作用、有丝分裂、PCR、电泳等），每个实验含参数面板、阶段讲解与实时画布 |
| 自研重制实验 | 190 个实验配置，由 7 种通用交互框架渲染（显微观察、过程演示、装置条件、变量探究、结构拼装、分类挑战、野外调查） |
| 知识点微实验 | 81 个面向单一知识点的轻量交互，复用通用框架，补齐知识地图中的覆盖缺口 |
| 知识地图 | 10 个模块 / 44 个分类 / 200 个知识点，标注「已有资源 / 制作规划 / 后续规划 / 待开发」四态覆盖情况 |
| 参考实验库 | 347 个历史 HTML 实验的索引与本地托管（资源不入库，需自备 `legacy/` 目录） |
| 3D 模型工作台 | 任意 GLB / GLTF 导入、3D 空间打标、标注 JSON 备份、导出可离线打开的独立 HTML 与 GLB |

## 技术栈

- **框架**：React 19 + [TanStack Start](https://tanstack.com/start) / TanStack Router（文件式路由，SSR）
- **构建**：Vite 8 + `@lovable.dev/vite-tanstack-config`（内含 Nitro、Tailwind、路径别名等插件，勿重复注册）
- **样式**：Tailwind CSS 4 + Radix UI 原语 + shadcn 风格组件
- **三维**：Three.js（仅在 `/tools` 路由按需加载）
- **校验与测试**：Zod、Vitest + Testing Library
- **包管理**：Bun（`bun.lock` / `bunfig.toml`），npm 亦可

## 快速开始

```bash
# 安装依赖
bun install        # 或 npm install

# 开发：访问终端输出的本地地址
bun run dev        # 或 npm run dev

# 生产构建与预览
bun run build
bun run preview
```

推荐使用 Bun；改用 npm 时需 Node.js 20 及以上，并将命令替换为 `npm run <script>`。

## 常用脚本

| 脚本 | 作用 |
| --- | --- |
| `dev` | 启动开发服务器（HMR） |
| `build` | 生产构建 |
| `build:dev` | 以 development 模式构建（便于排查） |
| `preview` | 预览构建产物 |
| `lint` | ESLint 检查 |
| `format` | Prettier 格式化 |
| `test` | 运行 Vitest 单次 |
| `test:watch` | 监听模式运行测试 |

## 目录结构

```text
biolab-simulator/
├─ src/
│  ├─ routes/                 # 文件式路由（TanStack Start）
│  │  ├─ __root.tsx           # 应用外壳
│  │  ├─ index.tsx            # 首页
│  │  ├─ labs.index.tsx       # 实验目录
│  │  ├─ labs.$id.tsx         # 实验详情 / 运行页
│  │  ├─ map.tsx              # 知识地图
│  │  └─ tools.tsx            # 3D 仿真模型库
│  ├─ components/
│  │  ├─ sims/                # 41 个自研仿真组件
│  │  │  └─ frames/           # 7 种通用交互框架 + RemadeHost 分发器
│  │  ├─ biocell3d/           # Three.js 模型查看器、标注系统、导出工具
│  │  ├─ lab-ui.tsx           # 实验页通用布局与控件
│  │  └─ ui/                  # 基础 UI 组件
│  ├─ data/
│  │  ├─ knowledge-map.ts     # 10 / 44 / 200 知识地图
│  │  ├─ remade/              # 190 条重制实验配置（按册拆分）
│  │  ├─ ksims/              # 81 条知识点微实验配置
│  │  └─ legacy-labs.ts       # 347 条参考实验索引（脚本生成）
│  ├─ lib/labs.ts             # 实验注册表与统一目录
│  ├─ hooks/                  # use-sim 等仿真通用 Hook
│  └─ styles.css              # 主题与全局样式
├─ scripts/scan-legacy.ts.py  # 扫描 legacy 目录生成索引
└─ public/                    # 静态资源（参考实验库挂载于 legacy/）
```

### 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页：平台概览与精选实验 |
| `/labs` | 实验目录：按模块分组 + 搜索 |
| `/labs/$id` | 实验运行页：自研仿真 / 重制框架 / 知识点微实验 / 参考库 iframe |
| `/map` | 知识地图：模块 → 分类 → 知识点，附覆盖状态 |
| `/tools` | 3D 模型工作台：导入、打标、导出 |

## 数据组织

实验内容与渲染分离，新增实验通常只需追加配置，无需改动路由：

1. **独立交互实验**：在 `src/components/sims/` 实现组件，并在 `src/lib/labs.ts` 注册元信息、在 `src/routes/labs.$id.tsx` 的 `sims` 映射中挂载。
2. **框架化实验**：在 `src/data/remade/*.ts` 追加一条符合 `remade/schema.ts` 的配置，`RemadeHost` 按 `frame` 字段自动分发到对应框架。
3. **知识点微实验**：在 `src/data/ksims/*.ts` 以知识点 id 为 key 追加配置，直接复用同一套框架。

`schema.ts` 使用可辨识联合（discriminated union）描述 7 种框架配置，每种框架只取自己需要的字段。

## 未纳入版本控制的资源

以下目录体积大或属于独立工程，已在 `.gitignore` 中排除：

| 路径 | 原因 |
| --- | --- |
| `legacy/` | 参考实验库原始 HTML（数百万级静态文件），需本地自备；索引由 `scripts/scan-legacy.ts.py` 生成 |
| `参考/` | 参考资料原始素材 |
| `biolab_tags_tools/` | 独立的 3D 标注工具仓库，单独维护 |
| `.playwright-mcp/` | 浏览器自动化调试缓存 |

缺失 `legacy/` 时，参考实验库条目仍会出现在目录中，但打开页面会提示资源不存在；自研仿真、重制实验与知识点微实验不受影响。

## 测试

```bash
bun run test
```

测试位于 `src/test/`，覆盖路由渲染与关键交互路径。

## 与 Lovable 协同

本项目同时连接 [Lovable](https://lovable.dev) 编辑器：推送到 `main` 分支的提交会同步回 Lovable。请保持 `main` 始终可构建，避免强制推送或改写已推送的历史。
