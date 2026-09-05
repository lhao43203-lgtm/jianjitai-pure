# 剪辑台 · 纯剪辑版：服务器交接说明

交接日期：2026-09-05。源码版本：`2c129c2e231e6da822f2b7f59656785f97f9cb11`。

## 交付范围与状态

- 本私有仓库以该 Git 提交的源码快照为基线，不包含旧 Git 历史；保留锁文件、测试、许可证和原项目声明，排除 TypeScript 构建缓存，并补充交接文档及忽略规则。
- 本包供工程师在目标 Linux 环境安装依赖、构建和部署，不是预构建 Linux 镜像，也不是 Windows 绿色版。
- 没有包含真实 `.env.local`、密钥、node_modules、.next、浏览器项目及用户素材。`.env.example` 里的密码/地址只是示例，不可直接用于公网。
- 本次仅打包，不修改应用代码，不部署网站，不停止当前本地服务。

## 当前产品行为

- 首页 `/` 返回 307 到 `/projects`，不再显示独立宣传首页，也不自动新建项目。
- 项目编辑地址 `/editor/<project_id>`，支持简中、繁中、英文。
- 无 AI 模型与推理服务；保留基础剪辑、手动字幕/SRT/VTT、特效、转场、本地音频、保存及导出。
- 片段特效徽标和转场标记支持查看/删除及撤销；菜单有键盘焦点时，关闭菜单回到时间线再执行快捷键。
- 浏览器翻译防护和三语言恢复页已加入；不要移除根节点 notranslate/translate=no，同时要保留内置 i18n 对根节点的特殊处理。
- 原有“小屏提示”仍存在：初次进入时页面宽度小于 1024px 会提示，用户可以继续；本包没有实现完整移动端布局。

## 特别重要：不是云渲染工具

视频预览、合成及导出运行在访问者的浏览器中。服务器主要提供网页和静态资源，增加服务器 GPU 不会自动提高用户导出速度。

项目和素材主要在浏览器 IndexedDB / OPFS。换域名、协议、端口或浏览器，存储空间都可能不同；localhost 项目不会自动出现在正式网站。不要以清除网站数据作为常规故障处理。用户应保留原始素材与导出文件。

云端渲染、云同步、平台单点登录、收费权限与平台用户隔离，需要独立设计和验收；现有可选账户/版本接口不等于已经集成到客户平台。

## 推荐部署路径

优先作为独立子域名部署，例如 `https://edit.example.com`，主平台链接进入。当前大量路径以 `/` 开头，不能只加 Nginx 子路径转发就认定支持 `/tools/editor/`；如需子路径或 iframe，另行检查 Next basePath、静态资源、跳转、存储和浏览器权限。

小规模初始资源可按 4 vCPU、8GB 内存、40–60GB SSD 预估，不需要 GPU。这不是并发压测结论，不含 AIGC 平台自身负载或云端素材容量。

### Linux 源码构建（首选交接路径）

准备受维护的 Linux 系统、Node.js 24 LTS 和 Bun 1.2.18（与 packageManager 一致）。Node 版本保持在受支持的安全补丁版本；不直接复制 Windows node_modules 或 .next 到 Linux。

在准备好的工作目录执行：

```sh
git clone https://github.com/lhao43203-lgtm/jianjitai-pure.git
cd jianjitai-pure
bun install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
```

由工程师编辑 `.env.local`，并限制文件权限：

- `NEXT_PUBLIC_SITE_URL=https://edit.example.com`：换成最终 HTTPS 域名，必须在构建前设置，修改后重新构建。
- `NEXT_PUBLIC_COMMERCIAL_MODE=true`：保持开启。
- `BETTER_AUTH_SECRET`：生成随机值，不使用示例，不加入版本控制。
- `DATABASE_URL`：环境校验要求存在合法 PostgreSQL URL。若不开账户/云端接口，仅本地剪辑不需要数据库，但必须隔离未启用接口，不要把一个占位地址当成已经配置数据库。若启用账户/版本服务，部署实际数据库、执行项目对应迁移并单独验证权限和备份。
- Freesound、R2、Marble、Redis、统计等均是可选集成；本轮本地音频不需要在线音效密钥，不要为缺省值创建无用服务。公网暴露前检查哪些接口会依赖这些服务。

```sh
chmod 600 apps/web/.env.local
bun test
bun run i18n:check
cd apps/web
bun run build
mkdir -p .next/standalone/apps/web/.next
cp -a public .next/standalone/apps/web/
cp -a .next/static .next/standalone/apps/web/.next/
NODE_ENV=production PORT=3002 HOSTNAME=127.0.0.1 node --env-file=.env.local .next/standalone/apps/web/server.js
```

最后一条先以前台方式检查启动；长期运行请交给 systemd 或容器编排，固定工作目录为构建时的 `jianjitai-pure/apps/web`，配置自动重启、日志轮转、权限和资源限制。用专门非 root 用户运行。

上述命令按当前 standalone 目录组织提供，尚未在目标 Linux 服务器执行验收；如构建失败，保留错误并修复，不要去掉锁文件或忽略失败继续上线。

### 现有 Docker 文件的已知风险

源码中的 `apps/web/Dockerfile` 和 `docker-compose.yml` 是历史配置，不是已验证的生产部署承诺。工程师采用容器前至少修正并验证：

1. runner 仍使用 Node 20，需迁移到受维护的 LTS 并复测。
2. Bun 镜像是浮动标签；应固定版本，安装依赖使用锁文件。当前 Dockerfile 存在删除 canvas 依赖后重新安装的步骤，不能宣称与锁文件完全一致。
3. Compose 数据库使用示例口令；不能公开复用。web/accounts 分属两个 profile，启用数据库相关功能时必须正确启动并配置数据库。
4. 明确区分构建参数和运行密钥；真实密钥不得作为构建 ARG 传入镜像层。
5. `.dockerignore` 的 Markdown 排除规则可能影响文档/内容与第三方声明的复制；应明确保留构建所需内容及法定声明。

本次没有替工程师修改这些历史容器配置，避免把未经 Linux 验证的新配置冒充可直接上线版本。

## 对接公网

- 配置域名和有效 HTTPS，浏览器编码与存储能力需要安全上下文；用当前稳定桌面 Chrome/Edge 实测目标视频格式。
- 使用 Nginx 等反向代理转发到本机 `127.0.0.1:3002`，仅公开 80/443，不直接开放 Node 端口或数据库端口。转发 Host / X-Forwarded-Proto / X-Forwarded-For。
- 未启用账户与云版本服务时，在网关禁用 `/api/auth/` 和 `/api/version-control/` 前缀。它们仍在源码中，不要因为“纯剪辑版”就默认所有 API 都可以匿名暴露。
- 如作为付费工具，平台鉴权应覆盖网页及接口，不能只隐藏入口按钮。
- 配置静态资源缓存，但不要长期缓存 HTML/RSC 和私人接口；整套构建产物原子发布，避免 HTML 与 chunk 版本混用导致白屏。
- 第三方字体、贴纸、在线素材可能访问外部服务；根据平台隐私政策和网络环境确认可用性。
- 发布前做依赖漏洞、接口权限、隐私和第三方许可复核；本包不是完整安全审计或法律意见。

## 验证记录与待验收

该提交在 Windows 本地生产模式已通过：159 项 Bun 测试、简繁文案覆盖 1796/1796、首页改动文件 Biome、Next 生产构建；真实浏览器确认首页进入项目列表。之前已验证转场/特效撤销、手动字幕、本地音频及短视频导出。

未完成：Linux/Docker 构建验证、真实域名 HTTPS 验收、并发压测、完整依赖漏洞审计、平台登录/收费权限集成。不得将上述本地通过等同于这些项目通过。

2026-09-05 尝试执行 `bun audit --json`，审计请求返回 HTTP 404，未获得审计结果，不能视为通过。工程师上线前必须重新完成依赖安全审计。

新仓库 GitHub Actions 默认关闭。由于当前登录没有 workflow 上传权限，历史工作流作为 `docs/bun-ci.reference.yml` 保留，不自动执行；工程师须先复核环境配置与构建步骤，再通过有相应权限的账号配置 CI。上传源码不代表 CI 或服务器验收通过。

工程师上线前的最低验收：

1. `/api/health` 返回 200/OK；这只证明网页进程存活，不代表数据库、导出和第三方服务正常。
2. `/` 跳转到 `/projects`，三语言正常，条款和隐私页可用。
3. 在测试项目完成“导入视频和音频 → 剪切 → 字幕/特效/转场 → 删除 → Ctrl+Z → 保存重开 → 有声 MP4 导出”。
4. 确认控制台无新的未捕获错误，无 AI 请求或模型下载；刷新不会破坏已保存项目。
5. 确认未启用接口不能访问、启用接口权限正确；不要用正式用户项目执行破坏性测试。
6. 保存上一版完整部署产物和环境配置；先测试环境，再小范围上线。监测进程、HTTP 错误和客户端错误。

回滚：切回上一版完整构建及其配置，重新验证上述链路；不要删除浏览器数据。若后续增加数据库迁移，必须另行设计数据库回滚与备份方案。禁止在运行中的构建目录直接覆盖一部分资源。

## 许可证与参考

保留 `LICENSE` 与 `THIRD_PARTY_NOTICES.md`。MIT 代码许可不自动覆盖用户素材、字体、贴纸、在线素材和第三方品牌的权利。

- Next.js 自托管：https://nextjs.org/docs/app/guides/self-hosting
- Node.js 受支持版本：https://nodejs.org/en/about/previous-releases
- 浏览器视频编码安全上下文：https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder

仓库所有者须先邀请工程师的 GitHub 账号为协作者，工程师接受邀请并使用自己的 GitHub 凭据拉取；不要共享账号或把访问令牌写入文档。后续修改建议新建分支并通过 Pull Request 合并，保留交接提交作为回滚基线；生产密钥始终由工程师在服务器单独配置。
