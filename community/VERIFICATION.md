# 首版验收记录

日期为 2026-11-26。应用基线为 Paperclip `v2026.1117.0`。应用使用 macOS arm64、Node 24.22.3、pnpm 9.15.4。Waline 使用 Node 26.13.1。

## 应用与安装

- 根依赖安装、UI 类型检查、设计令牌规则和生产 UI 构建均通过。相关的 10 个现有测试文件通过，共 325 项。逐项检查了 225 个英语与简中键的相同结构、非空值和变量占位符。
- 用全新本地浏览器状态看到简中首次设置，切到 English 后刷新仍保持，再切回简中。创建了测试组织和任务，打开 Agent 名录，在审批页面批准样例请求，并查看了 15 美元的测试 Agent 预算。
- 使用 npm 将本地 0.1.0 包装到一次性前缀。独立运行测试实例采用应用端口 3312 和嵌入式 PostgreSQL 端口 54341，上游代码对照实例使用 3311 和 54340。默认应用和数据库端口 3310、54339 另在源码实例启动验证。
- 在认证私有回环模式验证了匿名访问保护、测试管理员的引导与浏览器 Cookie 名称、CLI 登录挑战和 `auth whoami`。HuiClip 与对照实例各有自己的配置、CLI 凭据与上下文。更新到本地包 0.1.1 后重新启动并复查两个 CLI 的登录，HuiClip 的凭据和上下文内容保持一致。用 npm 卸载 HuiClip 后，其数据与配置仍在，对照实例继续提供健康响应，配置和凭据的校验值一致。
- macOS 服务定义通过 `plutil -lint`，独立标签为 `io.github.yangyanlei-jiang.huiclip`。本次未在系统服务管理器注册守护服务。Linux 服务定义尚未在 Linux 主机运行。

```sh
pnpm --filter @paperclipai/ui typecheck
pnpm check:token-gates
pnpm --filter @paperclipai/ui build
cd ui
pnpm exec vitest run src/i18n/locale-validation.test.ts src/pages/CoordinatorTasks.test.tsx src/components/OnboardingWizard.step.test.tsx src/components/NewIssueDialog.test.tsx src/components/Sidebar.test.tsx src/components/CoordinatorSidebar.test.tsx src/pages/Agents.test.tsx src/pages/Costs.test.tsx src/context/BreadcrumbContext.test.tsx src/components/onboarding/Stepper.test.ts
```

## 文档与评论

- Docusaurus 简中站以 Markdown 源目录与 `0.1` 版本快照构建，通过内部链接检查。浏览器以匿名访客打开安装文章，可阅读正文和已审核的评论、回复。
- Waline 使用独立 SQLite 和本地管理端资源。用两个虚构测试账号验证注册、登录、匿名发言被拒、普通用户无法越权批准、自身评论和回复进入待审、管理员批准、以及重启后账号和公开内容仍能读取。注册界面与预算页面的截图来自上述本地环境。
- 官方 sitemap 的 318 个地址全部登记，22 个已关联本批原创指南，296 个待写待验。部分原页的专题只覆盖相关本地流程，详见[覆盖清单](COVERAGE.md)。

```sh
cd community/site
npm ci
HUICLIP_WALINE_URL=http://127.0.0.1:8360 npm run build
npm run serve
```

在另一终端用 Node.js 26 启动 `community/comments` 下的 `npm ci && npm start`。可到 `http://127.0.0.1:8360/ui/register` 注册本机测试用户，到 `http://127.0.0.1:4174/install` 验证评论行为。

## 待实地验证

真实 Codex 授权及执行、Linux 运行、远程私网接入、外置 PostgreSQL、备份恢复、正式邮箱与找回密码均未实测。首版保留一些英文文案，尤其是录入表单的次要控件、详情子页和第三方内容。测试数据、生成包和临时脚本不包含在提交中。

GitHub Fork 的 Issues 与 Discussions 默认关闭；评论使用本地 Waline。试查 giscus 分类返回 HTTP 403，OAuth 和评论未配置。公开站点、npm 注册表、GitHub Releases 与上游 PR 均未发布。

## 界面补译与原版兼容

本地包 0.1.2 将登录、注册、组织设置、任务、智能体、审批和其他页面中 1,098 处固定文案接入语言目录，另补译主题切换。浏览器通过隔离的模拟健康状态和会话响应打开生产构建，实际查看了中文登录页、中文注册页，以及在注册表单内切换英文的结果。此次浏览器验证未提交账号数据。

UI 类型检查和生产构建通过。既有测试分两组执行，登录、语言目录、新建任务、智能体和费用一组通过 216 项；主题切换、侧栏、智能体配置、登录和语言目录一组通过 252 项，两组有重叠。并存测试范围见上方「应用与安装」。部分长提示、状态说明与高级配置仍含英文，全量功能尚未逐项对照验收。
