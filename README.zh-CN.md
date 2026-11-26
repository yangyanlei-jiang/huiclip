# 回形夹 · HuiClip

回形夹是基于 [Paperclip](https://github.com/paperclipai/paperclip) 的独立中文社区版。社区负责本分支的中文界面、HuiClip 本地安装包、原创指南和维护工作。应用沿用 [MIT 许可与 Paperclip AI 版权](LICENSE)。参阅[上游 README](README.md)了解原版。

项目第一规则是保留 Paperclip 原有功能。社区版在这个基础上提供简体中文界面和中文使用文档。

首版基于上游稳定标签 [`v2026.1117.0`](https://github.com/paperclipai/paperclip/releases/tag/v2026.1117.0)。简体中文是界面默认语言，可从账号菜单或首次设置切回 English。接入 Codex 的真实模型调用依赖自己的授权和运行环境。

## 本机试用

需要 macOS 或 Linux、Git、Node.js 24.11+、pnpm 9.15.4、npm 和 tar。

```sh
git clone --branch community/zh-cn-v1 --single-branch https://github.com/yangyanlei-jiang/huiclip.git
cd huiclip
node community/huiclip/pack.mjs ../huiclip-packages
npm install --global --prefix ../huiclip-cli ../huiclip-packages/huiclip-0.1.2.tgz
../huiclip-cli/bin/huiclip setup
../huiclip-cli/bin/huiclip run
```

打开 [http://127.0.0.1:3310](http://127.0.0.1:3310)。默认数据目录为 `~/.huiclip`。可用 `../huiclip-cli/bin/huiclip info` 查看配置、CLI 凭据文件位置、数据库端口和系统服务名。包从当前分支提交生成，npm 注册表暂未提供发行包。

- [安装与启动](community/site/docs/install.md)
- [团队私有部署](community/site/docs/private.md)
- [连接 Codex](community/site/docs/codex.md)
- [派任务、审批与验收](community/site/docs/tasks.md)
- [费用与预算](community/site/docs/budgets.md)
- [反馈、审核和评论](community/site/docs/community.md)
- [贡献指南](community/CONTRIBUTING.zh-CN.md) · [同步上游](community/UPSTREAM.md) · [覆盖清单](community/COVERAGE.md) · [验收记录](community/VERIFICATION.md)
