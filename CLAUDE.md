# 剪辑台·纯剪辑版

本仓库由 31501eb 独立复制。它是无 AI 的浏览器剪辑器：Next.js、React、Bun/Turborepo，项目与媒体保存在 IndexedDB / OPFS。

遵循 AGENTS.md 的 EditorCore / action / undo command 约定。禁止重新接入 AI 状态轮询、模型下载、推理服务、自动识别字幕或生成接口。

保留 effects[] 与现有项目格式。字幕由 lib/captions 本地解析和创建文字轨道；特效就地列表在 timeline-effects-badge.tsx。

本地运行：启动剪辑台.ps1，默认 127.0.0.1:3002；生产启动使用 standalone。测试：bun test，bun run i18n:check，bun run build:web。新增界面文字必须同时提供简中、繁中和英文。
