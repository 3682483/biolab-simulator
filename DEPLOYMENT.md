# 部署指南

本平台是 **SSR 应用**（TanStack Start + Nitro），需要能运行 Node/Worker 运行时的托管环境，不能像纯静态站点那样直接丢到任意空间。

当前构建配置默认产出 **Cloudflare Workers** 产物（`preset: cloudflare-module`），已在本机构建验证。

## 1. 部署前准备

| 项 | 要求 |
| --- | --- |
| 运行环境 | Bun 1.2+（推荐）或 Node.js 20+ |
| 依赖安装 | `bun install` 或 `npm install` |
| 环境变量 | 应用代码不依赖任何环境变量，无需配置（托管平台凭据除外） |
| 忽略产物 | 构建前确保 `.output/`、`dist/` 为最新；两者均已在 `.gitignore` 中 |

构建一次并确认产物：

```bash
bun run build
```

产物位于 `.output/`：

```text
.output/
├─ server/
│  ├─ index.mjs          # Worker / 服务器入口
│  ├─ wrangler.json      # Nitro 生成的 Worker 配置
│  └─ _chunks/ _libs/ _ssr/
├─ public/               # 静态资源（含 _headers 缓存规则）
└─ nitro.json            # 构建元信息（preset、commands）
```

确认目标平台：

```bash
cat .output/nitro.json   # 查看 "preset": "cloudflare-module"
```

## 2. 方式一：Lovable 一键发布（最省事）

本项目已连接 [Lovable](https://lovable.dev)，在编辑器中点击发布即可上线，无需本地构建与命令行操作。

注意：推送到 `main` 的提交会同步回 Lovable，因此保持 `main` 始终可构建。

## 3. 方式二：Cloudflare Workers（默认，推荐）

Nitro 已在 `.output/server/wrangler.json` 中生成好 Worker 配置（worker 名取自仓库名，静态资源绑定 `ASSETS` 指向 `../public`，启用 `nodejs_compat`）。

### 3.1 首次登录

```bash
npx wrangler login
```

### 3.2 本地以 Workers 运行时预览

```bash
npx wrangler --cwd ./.output/server dev
```

预览地址由 Wrangler 输出，用于验证 SSR、路由与静态资源是否正常。

### 3.3 部署

```bash
bun run build
npx wrangler --cwd ./.output/server deploy
```

首次部署会按 `wrangler.json` 中的 `name` 创建 Worker；之后重复执行即为更新。

### 3.4 自定义域名

在 Cloudflare 控制台 → Workers & Pages → 对应 Worker → Settings → Domains & Routes 绑定域名即可，无需改动仓库文件。

### 3.5 GitHub Actions 自动部署

在仓库 Settings → Secrets and variables → Actions 添加：

- `CLOUDFLARE_API_TOKEN`（具备 Workers 编辑权限）
- `CLOUDFLARE_ACCOUNT_ID`

新增 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - run: bun install --frozen-lockfile

      - run: bun run build

      - name: Deploy
        run: npx wrangler --cwd ./.output/server deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## 4. 方式三：Node 服务器（自建主机 / 容器）

默认 preset 是 Cloudflare，若要在普通 Node 环境运行，需要把 Nitro preset 切换为 `node-server`。

切换方式通过 `vite.config.ts` 向 `tanstackStart` 传入 Nitro 配置；本项目经由 `@lovable.dev/vite-tanstack-config` 的 `defineConfig` 封装，具体透传键名以该封装的文档为准。修改后重新构建，并用下面的命令验证 preset 是否已切换：

```bash
bun run build
cat .output/nitro.json   # 期望 "preset": "node-server"
```

确认后启动：

```bash
node .output/server/index.mjs      # 默认 3000 端口，可用 PORT 环境变量覆盖
PORT=8080 node .output/server/index.mjs
```

容器化示例（`Dockerfile`）：

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN npm i -g bun && bun install --frozen-lockfile && bun run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## 5. 方式四：静态托管

不适用默认配置：应用依赖 SSR 渲染路由与页面元信息，纯静态空间（GitHub Pages 等的静态模式）无法运行 `.output/server/index.mjs`。

若有纯静态需求，需改用 Nitro 的静态/预渲染 preset 并为所有路由生成 HTML，属于另一套构建配置，不在本文档范围内。

## 6. 部署后检查清单

- [ ] 首页可访问，实验目录 `/labs` 能正常筛选与搜索
- [ ] 打开任一自研实验（如 `/labs/osmosis`）交互正常，无控制台报错
- [ ] 知识地图 `/map` 的模块 → 分类 → 知识点展开正常
- [ ] `/tools` 的 3D 模型可载入，Draco 压缩模型能解析（`public/draco/` 必须随构建产物一并上传）
- [ ] 静态资源命中长缓存（`.output/public/_headers` 中 `/assets/*` 为一年强缓存）
- [ ] 移动端窗口下控制栏、实验画布不溢出

## 7. 已知差异与注意事项

| 事项 | 说明 |
| --- | --- |
| 参考实验库线上不可用 | 347 条参考实验的 HTML 位于 `public/legacy/`，该目录不纳入版本控制。线上环境缺少该目录时，目录页仍能列出条目，但打开页面会提示资源不存在。自研仿真（41）、重制实验（190）、知识点微实验（81）不受影响 |
| Draco 解码器 | `public/draco/` 已随仓库提交（约 1 MB），构建后位于 `.output/public/draco/`，缺失会导致压缩 GLB 载入失败 |
| 首次构建可能失败 | 若构建报 `safe-delete` / `trash` 相关错误（清理 `.output` 被系统或占用进程拦截），删除 `.output` 目录后重新执行 `bun run build` |
| 提交产物目录 | `.output/`、`.tanstack/`、`.nitro/` 均为构建产物且已忽略，不要提交 |

## 8. 回滚

Wrangler 保留历史部署版本，在 Cloudflare 控制台 Workers → Deployments 中选择历史版本点 Rollback 即可；也可在本地切回旧提交重新构建并 `deploy`。
