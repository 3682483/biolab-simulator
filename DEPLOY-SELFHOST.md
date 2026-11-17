# 部署到自有 Linux 服务器

目标形态：**Node 服务器**（Nitro `node-server` preset）。服务器只运行构建产物，不参与构建，因此无需上传源码、`node_modules` 或安装 Bun。

## 全流程一览

```text
本地（构建机）                          服务器（Linux）
─────────────────────────────         ─────────────────────────────
1. 切换 preset 为 node-server          1. 安装 Node.js 20+
2. bun install && bun run build        2. 上传并解压 .output 到 /var/www/biolab
3. （可选）放入 legacy 参考实验库       3. systemd 托管进程（自启动、崩溃重启）
4. 打包 .output 为 tar.gz              4. Nginx 反向代理 + 防火墙
5. 上传（scp / rsync）                 5. Certbot 签发 HTTPS
                                       6. 访问验证
```

## 一、本地要做的事

### 1. 安装依赖

```bash
bun install        # 或 npm install
```

### 2. 把构建目标切换为 Node 服务器

项目默认产出的 Cloudflare Workers 产物（`preset: cloudflare-module`）无法用 `node` 直接运行，必须先切换 preset。

在 `vite.config.ts` 中向 `defineConfig` 传入 Nitro 配置：

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
  vite: {
    // 保留原有的 server / plugins 等配置，此处只是示意
  },
});
```

若构建后 preset 未改变，改用等价的 Nitro 配置文件，在项目根新建 `nitro.config.ts`：

```ts
export default {
  preset: "node-server",
};
```

**每次改完都要验证**——以产物里的记录为准：

```bash
bun run build
cat .output/nitro.json
```

期望看到：

```json
{ "preset": "node-server", "serverEntry": "server/index.mjs", "publicDir": "public" }
```

只要这里仍是 `cloudflare-module`，产物就无法在 Linux 上用 node 启动。

### 3. 构建

```bash
bun run build
```

产物结构：

```text
.output/
├─ server/index.mjs      # Node 服务器入口（自包含，无需 node_modules）
├─ public/               # 静态资源（含 assets、draco、robots.txt）
└─ nitro.json            # 构建元信息
```

本地先跑一次确认可用：

```bash
PORT=3000 node .output/server/index.mjs
# 浏览器打开 http://localhost:3000
```

### 4.（可选）让参考实验库在线上可用

347 条参考实验的 HTML 位于本地 `legacy/` 目录，**不纳入版本控制**。线上环境默认缺失，目录页能列出条目但打开会提示资源不存在。若需要它们可用，把本地资源复制进产物：

```bash
cp -r legacy .output/public/legacy      # Linux / macOS
# Windows PowerShell：
# Copy-Item legacy .output\public\legacy -Recurse
```

自研仿真（41）、重制实验（190）、知识点微实验（81）不依赖该目录。

### 5. 打包

只打包 `.output`：

```bash
cd .output && tar -czf ../biolab-output.tgz . && cd ..
```

Windows 也可用系统自带 tar：

```powershell
tar -czf biolab-output.tgz -C .output .
```

`public/draco/`（Draco 解码器，约 1 MB）已在 `.output/public/draco/` 内，随包一起，无需单独处理。

## 二、要上传到服务器的文件

| 内容 | 是否上传 | 说明 |
| --- | --- | --- |
| `.output/server/` | 必须 | 应用入口与服务端代码 |
| `.output/public/` | 必须 | 静态资源（assets、favicon、robots.txt、draco） |
| `.output/nitro.json` | 必须 | 记录 preset，用于校验产物是否正确 |
| `.output/public/legacy/` | 可选 | 仅当需要参考实验库时 |
| `biolab-output.tgz`（上面的整体打包） | 推荐 | 一次上传上面三项，等价于整个 `.output` |

**不需要上传**：

- `src/`、`public/`、`scripts/` 等源码
- `node_modules/`（产物已自包含）
- `package.json`、`bun.lock`、`tsconfig.json` 等工程文件
- `legacy/`、`参考/`、`biolab_tags_tools/`（本地资料与独立工具）
- `.git/`、`.output.bak/`、`.tanstack/`、`dist/` 等中间产物

## 三、服务器要做的事

以下以 Ubuntu / Debian 为例，路径统一用 `/var/www/biolab`，端口用 `3000`。

### 1. 安装 Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v     # 期望 v20.x 或更高
```

### 2. 上传并解压

```bash
sudo mkdir -p /var/www/biolab
sudo chown -R $USER:$USER /var/www/biolab

# 本机执行（替换为你的服务器信息）
scp biolab-output.tgz user@your-server:/var/www/biolab/

# 服务器上解压
cd /var/www/biolab && tar -xzf biolab-output.tgz && rm biolab-output.tgz
ls /var/www/biolab     # 应看到 server/ public/ nitro.json
```

校验产物是否正确：

```bash
grep preset /var/www/biolab/nitro.json    # 期望 node-server
```

### 3. 用 systemd 托管进程

新建 `/etc/systemd/system/biolab.service`：

```ini
[Unit]
Description=BioLab Simulator (TanStack Start / Nitro)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/biolab
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /var/www/biolab/server/index.mjs
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

启动并设置开机自启：

```bash
sudo chown -R www-data:www-data /var/www/biolab
sudo systemctl daemon-reload
sudo systemctl enable --now biolab
sudo systemctl status biolab
curl -I http://127.0.0.1:3000     # 期望 200
```

常用运维命令：

```bash
sudo systemctl restart biolab     # 更新后重启
sudo journalctl -u biolab -f      # 实时查看日志
sudo journalctl -u biolab -n 100  # 查看最近日志
```

### 4. Nginx 反向代理

新建 `/etc/nginx/sites-available/biolab`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用并生效：

```bash
sudo ln -s /etc/nginx/sites-available/biolab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`/assets/` 与 `/draco/` 也可直接由 Nginx 静态托管，但交由应用统一处理更简单，上面的配置已带长缓存头。

### 5. 防火墙与 HTTPS

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 四、更新与回滚

**更新**（每次都在本地重新构建后执行）：

```bash
# 服务器：备份当前版本
sudo mv /var/www/biolab /var/www/biolab.bak
sudo mkdir -p /var/www/biolab

# 本机：上传新包
scp biolab-output.tgz user@your-server:/var/www/biolab/

# 服务器：解压并重启
cd /var/www/biolab && tar -xzf biolab-output.tgz && rm biolab-output.tgz
sudo chown -R www-data:www-data /var/www/biolab
sudo systemctl restart biolab
curl -I http://127.0.0.1:3000
```

确认无误后再删除备份：`sudo rm -rf /var/www/biolab.bak`。

**回滚**：把备份目录换回即可。

```bash
sudo systemctl stop biolab
sudo mv /var/www/biolab /var/www/biolab.failed
sudo mv /var/www/biolab.bak /var/www/biolab
sudo chown -R www-data:www-data /var/www/biolab
sudo systemctl start biolab
```

## 五、验证清单

- [ ] `nitro.json` 中 `preset` 为 `node-server`
- [ ] `curl -I http://127.0.0.1:3000` 返回 200
- [ ] 域名可访问首页，`/labs` 能搜索与筛选
- [ ] 打开 `/labs/osmosis` 等自研实验交互正常，浏览器控制台无报错
- [ ] `/map` 知识地图可逐级展开
- [ ] `/tools` 能载入 3D 模型，Draco 压缩模型可解析
- [ ] `https://your-domain.com/draco/draco_decoder.wasm` 可下载（说明 Draco 已随产物上传）
- [ ] 若需要参考实验库，抽查一条 legacy 实验能打开

## 六、排错

| 现象 | 原因与处理 |
| --- | --- |
| `node .output/server/index.mjs` 报语法/导出错误，或提示 Worker 相关 API | 产物 preset 仍是 `cloudflare-module`；回到第二节第 2 步切换 preset 后重新构建 |
| 端口被占用 | 改 `Environment=PORT=3001`，并同步修改 Nginx 的 `proxy_pass` |
| 502 Bad Gateway | 应用未启动或端口不一致：`sudo systemctl status biolab`、`journalctl -u biolab -n 50` |
| 页面 500 | `journalctl -u biolab -f` 查看服务端异常；`src/server.ts` 内的错误包装会渲染内置错误页 |
| 权限错误 | `sudo chown -R www-data:www-data /var/www/biolab` |
| 本地构建卡在清理 `.output` | 部分集成终端的删除钩子会拦截该操作；先手动删除 `.output` 再构建，或改用系统自带终端执行 |
| 参考实验库提示资源不存在 | 缺少 `.output/public/legacy/`；按第一节第 4 步补入 |
| 3D 模型载入失败 | 检查 `.output/public/draco/` 是否存在 |

## 七、与 Lovable 的关系

本仓库同时连接 Lovable：推送到 `main` 的提交会同步回 Lovable。把 preset 改为 `node-server` 后，Lovable 侧若仍按 Cloudflare 目标发布，两边构建目标会不一致。建议：

- 以自有服务器为主时，明确该 preset 变更就是当前项目的构建配置；
- 若需要两边共存，可在部署前临时切换 preset，部署完成后还原（不推荐长期如此）。
