# HuiClip

[简体中文](README.md) · [English（Paperclip 原版 README）](https://github.com/paperclipai/paperclip/blob/v2026.1117.0/README.md)

HuiClip 是基于 Paperclip 的独立中文社区版。你可以在同一个工作区给智能体派任务、处理审批、查看运行记录和跟踪预算。项目的第一规则是保留 Paperclip 原有功能，在此基础上汉化界面、编写中文使用文档。

## 界面语言

**首次打开默认使用简体中文，可随时切换到 English（原版英文界面）。** 在登录页、首次设置页或登录后的账号菜单中，找到「界面语言」并选择 **English**。要切回中文，在 **Language** 中选择「简体中文」。浏览器会记住选择，刷新后仍然生效。

语言切换作用于界面文案。任务正文、模型标识和日志保留原文；部分高级设置和长提示仍在补译。



## 本机试用

需要 macOS 或 Linux、Node.js 24.11+、pnpm 9.15.4、npm 和 tar。仅从源码打包时需要 Git。

从 npm 启动（推荐）：

```sh
npx --yes huiclip@latest run
```

升级时先停止旧实例，保留原 `HUICLIP_HOME`（默认 `~/.huiclip`），再运行新版；不需要重新初始化。

也可以从源码打包：

```sh
git clone --branch community/zh-cn-v1 --single-branch https://github.com/yangyanlei-jiang/huiclip.git
cd huiclip
node community/huiclip/pack.mjs ../huiclip-packages
npm install --global --prefix ../huiclip-cli ../huiclip-packages/huiclip-0.1.5.tgz
../huiclip-cli/bin/huiclip setup
../huiclip-cli/bin/huiclip run
```

打开 [http://127.0.0.1:1549](http://127.0.0.1:1549)。默认数据目录为 `~/.huiclip`。可用 `npx --yes huiclip@latest info` 查看配置、数据库端口和系统服务名。

## 中文指南

完整指南与版本快照在独立的 [huiclip-docs 文档仓库](https://github.com/yangyanlei-jiang/huiclip-docs) 维护。

- [安装与启动](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/install.md)
- [团队私有部署](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/private.md)
- [连接 Codex](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/codex.md)
- [派任务、审批与验收](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/tasks.md)
- [费用与预算](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/budgets.md)
- [反馈、审核和评论](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/community.md)
- [贡献指南](community/CONTRIBUTING.zh-CN.md) · [同步上游](community/UPSTREAM.md) · [覆盖清单](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/COVERAGE.md) · [验收记录](community/VERIFICATION.md)

## 上游与许可

本版基于 Paperclip 稳定标签 `v2026.1117.0`，由 HuiClip 社区独立维护，沿用 MIT 许可并保留 Paperclip AI 的版权声明。[上游稳定版](https://github.com/paperclipai/paperclip/tree/v2026.1117.0) · [许可证](LICENSE)
