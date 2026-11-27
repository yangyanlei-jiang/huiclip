# HuiClip 界面复扫记录

2026-11-27，在独立的本机服务、数据库与 Codex 内置浏览器中，逐一加载 159 个组织内路由模板和 74 个顶层路由模板。每个入口各运行一次简体中文和英文，共 466 条最终观察。为智能体、任务、项目、审批、目标、例程建立了本地测试数据。

扫描读取已渲染文本、按钮文字、标题、替代文字、无障碍标签和输入提示，并同上轮 86 个候选逐项精确比对。每次记录页面语言、跳转落点及正文。无效认领和 CLI 授权页在主区域之外显示错误，也单独打开核实。

简中页面仍精确匹配 5 个不同候选，保留原因见下表。固定界面文案剩余命中 0 项。扫描范围是本实例的功能开关和测试数据所触发的页面状态；没有实际登录外部服务，未对所有弹窗操作的组合或远端插件内容作出覆盖结论。

## 86 个候选逐项核对

次数为包含完整原串的路由模板数。英文为 0 表示本次页面状态未复现该原串；复合动态提示、不同测试数据及未展开的操作均可能影响匹配。

| 原文 | 中文命中 | 英文命中 | 处理结果 |
|---|---:|---:|---|
| Activity | 0 | 32 | 中文界面已无此原串，英文模式仍显示 |
| Add environment | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Additional tool details (Claude Code) | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Admin | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Advanced | 0 | 10 | 中文界面已无此原串，英文模式仍显示 |
| Agent | 0 | 31 | 中文界面已无此原串，英文模式仍显示 |
| Agents | 0 | 53 | 中文界面已无此原串，英文模式仍显示 |
| Agents can never archive tasks from your inbox. | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| All routines | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| Always allow | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Any of my agents | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| App | 0 | 5 | 中文界面已无此原串，英文模式仍显示 |
| Archive | 0 | 5 | 中文界面已无此原串，英文模式仍显示 |
| Assignee | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Assistant connections need an authenticated instance with a public HTTPS URL. Ask your instance administrator to configure the public URL, then try again. | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Assistant responses | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Attachments | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| Audit | 0 | 27 | 中文界面已无此原串，英文模式仍显示 |
| Awaiting approval | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| Backlog | 0 | 181 | 中文界面已无此原串，英文模式仍显示 |
| Budgets | 0 | 27 | 中文界面已无此原串，英文模式仍显示 |
| Comments | 0 | 3 | 中文界面已无此原串，英文模式仍显示 |
| Costs | 0 | 28 | 中文界面已无此原串，英文模式仍显示 |
| Create Task | 0 | 8 | 中文界面已无此原串，英文模式仍显示 |
| Description | 0 | 18 | 中文界面已无此原串，英文模式仍显示 |
| Diff | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| Don't allow | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Edit environment | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Enable Demo Routine | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| Environments | 0 | 31 | 中文界面已无此原串，英文模式仍显示 |
| Files | 0 | 4 | 中文界面已无此原串，英文模式仍显示 |
| General | 0 | 50 | 中文界面已无此原串，英文模式仍显示 |
| Identity | 1 | 7 | 保留原文。设计指南列举的 React 组件名 |
| Interrupted | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| Keep voted AI outputs local only. | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Let any agent you manage archive tasks out of your inbox. | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Metric | 1 | 1 | 保留原文。长线程性能测试中固定 Markdown 评论的表头 |
| My secrets | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| New Skill | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| New Task | 0 | 30 | 中文界面已无此原串，英文模式仍显示 |
| New secret | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| None | 0 | 12 | 中文界面已无此原串，英文模式仍显示 |
| Off | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Only chosen agents | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Open | 0 | 28 | 中文界面已无此原串，英文模式仍显示 |
| Operator | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Overview | 0 | 14 | 中文界面已无此原串，英文模式仍显示 |
| Owner | 0 | 3 | 中文界面已无此原串，英文模式仍显示 |
| Permissions | 0 | 5 | 中文界面已无此原串，英文模式仍显示 |
| Preview | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| Priority | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Projects | 0 | 19 | 中文界面已无此原串，英文模式仍显示 |
| Provider vaults | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Ready | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Reports To | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| Restrict inbox tidying to the agents you pick below. | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Review | 1 | 35 | 保留原文。设计指南中的示例技能名 |
| Role | 0 | 3 | 中文界面已无此原串，英文模式仍显示 |
| Routines | 0 | 7 | 中文界面已无此原串，英文模式仍显示 |
| Running | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Runs | 0 | 31 | 中文界面已无此原串，英文模式仍显示 |
| Secrets | 0 | 34 | 中文界面已无此原串，英文模式仍显示 |
| Settings | 1 | 35 | 保留原文。设计指南列举的图标名 |
| Share voted AI outputs automatically. | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Skills | 0 | 18 | 中文界面已无此原串，英文模式仍显示 |
| Star Demo Project | 0 | 15 | 中文界面已无此原串，英文模式仍显示 |
| States | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Status | 0 | 22 | 中文界面已无此原串，英文模式仍显示 |
| Tasks | 0 | 183 | 中文界面已无此原串，英文模式仍显示 |
| Thinking | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| Tool output and content | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Unfiled | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| User prompts | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| Value | 1 | 1 | 保留原文。长线程性能测试中固定 Markdown 评论的表头 |
| Viewer | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| Working | 0 | 0 | 本轮中英文页面均未复现完整原串 |
| You cannot remove yourself. | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| active | 0 | 5 | 中文界面已无此原串，英文模式仍显示 |
| checked out the issue | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| high | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| in progress | 0 | 3 | 中文界面已无此原串，英文模式仍显示 |
| medium | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| none | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |
| pending | 0 | 11 | 中文界面已无此原串，英文模式仍显示 |
| todo | 0 | 2 | 中文界面已无此原串，英文模式仍显示 |
| updated the issue | 0 | 1 | 中文界面已无此原串，英文模式仍显示 |

## 路由复扫结果

顶层兼容入口会跳转到组织内页面。缺少有效外部资源时，记录未找到、拒绝访问或未启用时的落点。示例参数不能证明已授权资源的成功状态。


### 组织内入口

| 路由模板 | 中文落点 | 英文落点 | 观察 |
|---|---|---|---|
| `*` | `/ROU/audit-missing` | `/ROU/audit-missing` | 双语均已渲染 |
| `:pluginRoutePath/*` | `/ROU/local-missing-plugin/audit-missing` | `/ROU/local-missing-plugin/audit-missing` | 双语均已渲染 |
| `activity` | `/ROU/activity` | `/ROU/activity` | 双语均已渲染 |
| `activity/budgets` | `/ROU/activity/budgets` | `/ROU/activity/budgets` | 双语均已渲染 |
| `activity/commentary` | `/ROU/activity/commentary` | `/ROU/activity/commentary` | 双语均已渲染 |
| `activity/costs` | `/ROU/activity/costs` | `/ROU/activity/costs` | 双语均已渲染 |
| `activity/runs` | `/ROU/activity/runs` | `/ROU/activity/runs` | 双语均已渲染 |
| `activity/timeline` | `/ROU/activity/timeline` | `/ROU/activity/timeline` | 双语均已渲染 |
| `agents` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/:agentId` | `/ROU/agents/demo-agent/overview` | `/ROU/agents/demo-agent/overview` | 双语均已渲染 |
| `agents/:agentId/:tab` | `/ROU/agents/demo-agent/overview` | `/ROU/agents/demo-agent/overview` | 双语均已渲染 |
| `agents/:agentId/runs/:runId` | `/ROU/agents/demo-agent/runs/:示例参数` | `/ROU/agents/demo-agent/runs/:示例参数` | 双语均已渲染 |
| `agents/active` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/all` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/builtin` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/error` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/new` | `/ROU/agents/new` | `/ROU/agents/new` | 双语均已渲染 |
| `agents/paused` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `approvals` | `/ROU/approvals/pending` | `/ROU/approvals/pending` | 双语均已渲染 |
| `approvals/:approvalId` | `/ROU/approvals/:approvalId` | `/ROU/approvals/:approvalId` | 双语均已渲染 |
| `approvals/all` | `/ROU/approvals/all` | `/ROU/approvals/all` | 双语均已渲染 |
| `approvals/pending` | `/ROU/approvals/pending` | `/ROU/approvals/pending` | 双语均已渲染 |
| `apps` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/:connectionId` | `/ROU/apps/:示例参数/permissions` | `/ROU/apps/:示例参数/permissions` | 双语均已渲染 |
| `apps/:connectionId/:tab` | `/ROU/apps/:示例参数/permissions` | `/ROU/apps/:示例参数/permissions` | 双语均已渲染 |
| `apps/advanced` | `/ROU/apps/advanced` | `/ROU/apps/advanced` | 双语均已渲染 |
| `apps/advanced/:tab` | `/ROU/apps/advanced/permissions` | `/ROU/apps/advanced/permissions` | 双语均已渲染 |
| `apps/advanced/audit` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/advanced/gateways` | `/ROU/apps/advanced/gateways` | `/ROU/apps/advanced/gateways` | 双语均已渲染 |
| `apps/advanced/profiles/:profileId` | `/ROU/apps/advanced/profiles/:示例参数` | `/ROU/apps/advanced/profiles/:示例参数` | 双语均已渲染 |
| `apps/advanced/profiles/:profileId/edit` | `/ROU/apps/advanced/profiles/:示例参数/edit` | `/ROU/apps/advanced/profiles/:示例参数/edit` | 双语均已渲染 |
| `apps/advanced/profiles/new` | `/ROU/apps/advanced/profiles/new` | `/ROU/apps/advanced/profiles/new` | 双语均已渲染 |
| `apps/advanced/run-your-own` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/app/:applicationId` | `/ROU/apps/app/:示例参数/permissions` | `/ROU/apps/app/:示例参数/permissions` | 双语均已渲染 |
| `apps/app/:applicationId/:tab` | `/ROU/apps/app/:示例参数/permissions` | `/ROU/apps/app/:示例参数/permissions` | 双语均已渲染 |
| `apps/assistant-connection` | `/ROU/apps/assistant-connection` | `/ROU/apps/assistant-connection` | 双语均已渲染 |
| `apps/attention` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/browse` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/byo` | `/ROU/apps/byo` | `/ROU/apps/byo` | 双语均已渲染 |
| `apps/chat/:endpointId` | `/ROU/apps/chat/:示例参数` | `/ROU/apps/chat/:示例参数` | 双语均已渲染 |
| `apps/chat/:endpointId/:tab` | `/ROU/apps/chat/:示例参数/permissions` | `/ROU/apps/chat/:示例参数/permissions` | 双语均已渲染 |
| `apps/chat/:endpointId/reviews/:reviewId` | `/ROU/apps/chat/:示例参数/reviews/:示例参数` | `/ROU/apps/chat/:示例参数/reviews/:示例参数` | 双语均已渲染 |
| `apps/chat/connect` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/connect` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/connect/:appKey` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/connect/:appKey/:stage` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/connections` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `apps/gateways` | `/ROU/apps/gateways` | `/ROU/apps/gateways` | 双语均已渲染 |
| `apps/gateways/:gatewayId` | `/ROU/apps/gateways/:示例参数/overview` | `/ROU/apps/gateways/:示例参数/overview` | 双语均已渲染 |
| `apps/gateways/:gatewayId/:tab` | `/ROU/apps/gateways/:示例参数/overview` | `/ROU/apps/gateways/:示例参数/overview` | 双语均已渲染 |
| `apps/review` | `/ROU/apps/review` | `/ROU/apps/review` | 双语均已渲染 |
| `apps/vercel-connect` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `artifacts` | `/ROU/artifacts` | `/ROU/artifacts` | 双语均已渲染 |
| `audit` | `/ROU/activity` | `/ROU/activity` | 双语均已渲染 |
| `audit/activity` | `/ROU/activity` | `/ROU/activity` | 双语均已渲染 |
| `audit/budgets` | `/ROU/activity/budgets` | `/ROU/activity/budgets` | 双语均已渲染 |
| `audit/costs` | `/ROU/activity/costs` | `/ROU/activity/costs` | 双语均已渲染 |
| `audit/runs` | `/ROU/activity/runs` | `/ROU/activity/runs` | 双语均已渲染 |
| `audit/timeline` | `/ROU/activity/timeline` | `/ROU/activity/timeline` | 双语均已渲染 |
| `board-chat` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `budgets` | `/ROU/activity/budgets` | `/ROU/activity/budgets` | 双语均已渲染 |
| `cases` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `cases/:caseIdentifier` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `chats` | `/ROU/chats/demo-agent` | `/ROU/chats/demo-agent` | 双语均已渲染 |
| `chats/:agentRef` | `/ROU/chats/:agentId` | `/ROU/chats/:agentId` | 双语均已渲染 |
| `companies` | `/ROU/companies` | `/ROU/companies` | 双语均已渲染 |
| `company/export/*` | `/ROU/company/export/files/README.md` | `/ROU/company/export/files/README.md` | 双语均已渲染 |
| `company/import` | `/ROU/company/import` | `/ROU/company/import` | 双语均已渲染 |
| `company/settings` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `company/settings/:settingsRoutePath/*` | `/ROU/company/settings/general/audit-missing` | `/ROU/company/settings/general/audit-missing` | 双语均已渲染 |
| `company/settings/access` | `/ROU/company/settings/access` | `/ROU/company/settings/access` | 双语均已渲染 |
| `company/settings/cloud-upstream` | `/ROU/company/export/files/README.md` | `/ROU/company/export/files/README.md` | 双语均已渲染 |
| `company/settings/connections` | `/ROU/company/settings/connections` | `/ROU/company/settings/connections` | 双语均已渲染 |
| `company/settings/environments` | `/ROU/company/settings/instance/environments` | `/ROU/company/settings/instance/environments` | 双语均已渲染 |
| `company/settings/instance` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `company/settings/instance/access` | `/ROU/company/settings/instance/access` | `/ROU/company/settings/instance/access` | 双语均已渲染 |
| `company/settings/instance/adapters` | `/ROU/company/settings/instance/adapters` | `/ROU/company/settings/instance/adapters` | 双语均已渲染 |
| `company/settings/instance/environments` | `/ROU/company/settings/instance/environments` | `/ROU/company/settings/instance/environments` | 双语均已渲染 |
| `company/settings/instance/environments/:environmentId/edit` | `/ROU/company/settings/instance/environments/:示例参数/edit` | `/ROU/company/settings/instance/environments/:示例参数/edit` | 双语均已渲染 |
| `company/settings/instance/environments/new` | `/ROU/company/settings/instance/environments/new` | `/ROU/company/settings/instance/environments/new` | 双语均已渲染 |
| `company/settings/instance/experimental` | `/ROU/company/settings/instance/experimental` | `/ROU/company/settings/instance/experimental` | 双语均已渲染 |
| `company/settings/instance/general` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `company/settings/instance/heartbeats` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `company/settings/instance/plugins` | `/ROU/company/settings/instance/plugins` | `/ROU/company/settings/instance/plugins` | 双语均已渲染 |
| `company/settings/instance/plugins/:pluginId` | `/ROU/company/settings/instance/plugins/:示例参数` | `/ROU/company/settings/instance/plugins/:示例参数` | 双语均已渲染 |
| `company/settings/instance/profile` | `/ROU/company/settings/instance/profile` | `/ROU/company/settings/instance/profile` | 双语均已渲染 |
| `company/settings/invites` | `/ROU/company/settings/members` | `/ROU/company/settings/members` | 双语均已渲染 |
| `company/settings/members` | `/ROU/company/settings/members` | `/ROU/company/settings/members` | 双语均已渲染 |
| `company/settings/secrets` | `/ROU/company/settings/secrets` | `/ROU/company/settings/secrets` | 双语均已渲染 |
| `company/settings/tools` | `/ROU/apps/advanced/profiles` | `/ROU/apps/advanced/profiles` | 双语均已渲染 |
| `company/settings/tools/:tab` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `costs` | `/ROU/activity/costs` | `/ROU/activity/costs` | 双语均已渲染 |
| `dashboard` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `dashboard/live` | `/ROU/dashboard/live` | `/ROU/dashboard/live` | 双语均已渲染 |
| `decisions` | `/ROU/decisions` | `/ROU/decisions` | 双语均已渲染 |
| `decisions/queues/:key` | `/ROU/decisions/queues/:示例参数` | `/ROU/decisions/queues/:示例参数` | 双语均已渲染 |
| `design-guide` | `/ROU/design-guide` | `/ROU/design-guide` | 匹配 Identity、Settings、Review |
| `dev/task-chat-lab` | `/ROU/dev/task-chat-lab` | `/ROU/dev/task-chat-lab` | 双语均已渲染 |
| `execution-workspaces/:workspaceId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/configuration` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/issues` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/routines` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/runtime-logs` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/services` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `goals` | `/ROU/goals` | `/ROU/goals` | 双语均已渲染 |
| `goals/:goalId` | `/ROU/goals/:goalId` | `/ROU/goals/:goalId` | 双语均已渲染 |
| `inbox` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `inbox/all` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `inbox/blocked` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `inbox/mine` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `inbox/new` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `inbox/recent` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `inbox/requests` | `/ROU/inbox/requests` | `/ROU/inbox/requests` | 双语均已渲染 |
| `inbox/unread` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `instance/settings/adapters` | `/ROU/instance/settings/adapters` | `/ROU/instance/settings/adapters` | 双语均已渲染 |
| `issues` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `issues/:issueId` | `/ROU/issues/ROU-1` | `/ROU/issues/ROU-1` | 双语均已渲染 |
| `issues/active` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `issues/all` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `issues/backlog` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `issues/done` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `issues/recent` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `onboarding` | `/ROU/onboarding` | `/ROU/onboarding` | 双语均已渲染 |
| `org` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `plugins/:pluginId` | `/ROU/company/settings/instance/plugins/:示例参数` | `/ROU/company/settings/instance/plugins/:示例参数` | 双语均已渲染 |
| `projects` | `/ROU/projects` | `/ROU/projects` | 双语均已渲染 |
| `projects/:projectId` | `/ROU/projects/demo-project/issues` | `/ROU/projects/demo-project/issues` | 双语均已渲染 |
| `projects/:projectId/budget` | `/ROU/projects/demo-project/budget` | `/ROU/projects/demo-project/budget` | 双语均已渲染 |
| `projects/:projectId/configuration` | `/ROU/projects/demo-project/configuration` | `/ROU/projects/demo-project/configuration` | 双语均已渲染 |
| `projects/:projectId/issues` | `/ROU/projects/demo-project/issues` | `/ROU/projects/demo-project/issues` | 双语均已渲染 |
| `projects/:projectId/issues/:filter` | `/ROU/projects/demo-project/issues/all` | `/ROU/projects/demo-project/issues/all` | 双语均已渲染 |
| `projects/:projectId/overview` | `/ROU/projects/demo-project/configuration` | `/ROU/projects/demo-project/configuration` | 双语均已渲染 |
| `projects/:projectId/workspaces` | `/ROU/projects/demo-project/issues` | `/ROU/projects/demo-project/issues` | 双语均已渲染 |
| `projects/:projectId/workspaces/:workspaceId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `routines` | `/ROU/routines` | `/ROU/routines` | 双语均已渲染 |
| `routines/:routineId` | `/ROU/routines/:routineId/overview` | `/ROU/routines/:routineId/overview` | 双语均已渲染 |
| `routines/:routineId/:section` | `/ROU/routines/:routineId/activity` | `/ROU/routines/:routineId/activity` | 双语均已渲染 |
| `runs` | `/ROU/activity/runs` | `/ROU/activity/runs` | 双语均已渲染 |
| `search` | `/ROU/search` | `/ROU/search` | 双语均已渲染 |
| `settings` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `settings/*` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `skills/*` | `/ROU/skills/audit-missing` | `/ROU/skills/audit-missing` | 双语均已渲染 |
| `skills/:skillId/studio` | `/ROU/skills/studio/:示例参数` | `/ROU/skills/studio/:示例参数` | 双语均已渲染 |
| `skills/sources` | `/ROU/skills/sources` | `/ROU/skills/sources` | 双语均已渲染 |
| `skills/sources/:sourceId` | `/ROU/skills/sources/:示例参数` | `/ROU/skills/sources/:示例参数` | 双语均已渲染 |
| `skills/studio` | `/ROU/skills/studio` | `/ROU/skills/studio` | 双语均已渲染 |
| `skills/studio/:skillId` | `/ROU/skills/studio/:示例参数` | `/ROU/skills/studio/:示例参数` | 双语均已渲染 |
| `skills/studio/new` | `/ROU/skills/studio/new` | `/ROU/skills/studio/new` | 双语均已渲染 |
| `status` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `status-cards` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `status-cards/:cardId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `status/:cardId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `tasks` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `tests/perf/long-thread` | `/ROU/tests/perf/long-thread` | `/ROU/tests/perf/long-thread` | 双语均已渲染 |
| `timeline` | `/ROU/activity/timeline` | `/ROU/activity/timeline` | 双语均已渲染 |
| `tools` | `/ROU/apps/advanced/profiles` | `/ROU/apps/advanced/profiles` | 双语均已渲染 |
| `tools/:tab` | `/ROU/apps` | `/ROU/apps` | 双语均已渲染 |
| `u/:userSlug` | `/ROU/u/demo` | `/ROU/u/demo` | 双语均已渲染 |
| `workspaces` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |

### 顶层入口

| 路由模板 | 中文落点 | 英文落点 | 观察 |
|---|---|---|---|
| `*` | `/audit-missing` | `/audit-missing` | 双语均已渲染 |
| `:companyPrefix` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `activity` | `/ROU/activity` | `/ROU/activity` | 双语均已渲染 |
| `activity/*` | `/ROU/activity/audit-missing` | `/ROU/activity/audit-missing` | 双语均已渲染 |
| `agents` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/:agentId` | `/ROU/agents/demo-agent/overview` | `/ROU/agents/demo-agent/overview` | 双语均已渲染 |
| `agents/:agentId/:tab` | `/ROU/agents/demo-agent/overview` | `/ROU/agents/demo-agent/overview` | 双语均已渲染 |
| `agents/:agentId/runs/:runId` | `/ROU/agents/demo-agent/runs/:示例参数` | `/ROU/agents/demo-agent/runs/:示例参数` | 双语均已渲染 |
| `agents/active` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/all` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/builtin` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/error` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `agents/new` | `/ROU/agents/new` | `/ROU/agents/new` | 双语均已渲染 |
| `agents/paused` | `/ROU/agents/all` | `/ROU/agents/all` | 双语均已渲染 |
| `artifacts` | `/ROU/artifacts` | `/ROU/artifacts` | 双语均已渲染 |
| `assistant-connections` | `/assistant-connections` | `/assistant-connections` | 双语均已渲染 |
| `audit` | `/ROU/activity` | `/ROU/activity` | 双语均已渲染 |
| `audit/*` | `/ROU/audit/audit-missing` | `/ROU/audit/audit-missing` | 双语均已渲染 |
| `auth` | `/invite/:无效令牌` | `/invite/:无效令牌` | 双语均已渲染 |
| `board-claim/:token` | `/board-claim/:无效令牌` | `/board-claim/:无效令牌` | 错误页：董事会所有权认领 URL 无效。 / Invalid board claim URL. |
| `budgets` | `/ROU/activity/budgets` | `/ROU/activity/budgets` | 双语均已渲染 |
| `cases` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `cases/:caseIdentifier` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `chat-identity/confirm` | `/chat-identity/confirm` | `/chat-identity/confirm` | 双语均已渲染 |
| `cli-auth/:id` | `/cli-auth/:示例参数` | `/cli-auth/:示例参数` | 错误页：CLI 授权 URL 无效。 / Invalid CLI auth URL. |
| `companies` | `/ROU/companies` | `/ROU/companies` | 双语均已渲染 |
| `costs` | `/ROU/activity/costs` | `/ROU/activity/costs` | 双语均已渲染 |
| `decisions` | `/ROU/decisions` | `/ROU/decisions` | 双语均已渲染 |
| `dot-connect/:id` | `/dot-connect/:示例参数` | `/dot-connect/:示例参数` | 双语均已渲染 |
| `execution-workspaces/:workspaceId` | `/execution-workspaces/:示例参数` | `/execution-workspaces/:示例参数` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/configuration` | `/execution-workspaces/:示例参数/configuration` | `/execution-workspaces/:示例参数/configuration` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/issues` | `/execution-workspaces/:示例参数/issues` | `/execution-workspaces/:示例参数/issues` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/routines` | `/execution-workspaces/:示例参数/routines` | `/execution-workspaces/:示例参数/routines` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/runtime-logs` | `/execution-workspaces/:示例参数/runtime-logs` | `/execution-workspaces/:示例参数/runtime-logs` | 双语均已渲染 |
| `execution-workspaces/:workspaceId/services` | `/execution-workspaces/:示例参数/services` | `/execution-workspaces/:示例参数/services` | 双语均已渲染 |
| `instance` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `instance/settings` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `instance/settings/*` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `invite/:token` | `/invite/:无效令牌` | `/invite/:无效令牌` | 双语均已渲染 |
| `issues` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `issues/:issueId` | `/ROU/issues/ROU-1` | `/ROU/issues/ROU-1` | 双语均已渲染 |
| `mcp-connect/:id` | `/mcp-connect/:示例参数` | `/mcp-connect/:示例参数` | 双语均已渲染 |
| `mcp-device` | `/mcp-device` | `/mcp-device` | 双语均已渲染 |
| `oauth-handoff` | `/oauth-handoff` | `/oauth-handoff` | 双语均已渲染 |
| `onboarding` | `/onboarding` | `/onboarding` | 双语均已渲染 |
| `projects` | `/ROU/projects` | `/ROU/projects` | 双语均已渲染 |
| `projects/:projectId` | `/ROU/projects/demo-project/issues` | `/ROU/projects/demo-project/issues` | 双语均已渲染 |
| `projects/:projectId/configuration` | `/ROU/projects/demo-project/configuration` | `/ROU/projects/demo-project/configuration` | 双语均已渲染 |
| `projects/:projectId/issues` | `/ROU/projects/demo-project/issues` | `/ROU/projects/demo-project/issues` | 双语均已渲染 |
| `projects/:projectId/issues/:filter` | `/ROU/projects/demo-project/issues/all` | `/ROU/projects/demo-project/issues/all` | 双语均已渲染 |
| `projects/:projectId/overview` | `/ROU/projects/demo-project/configuration` | `/ROU/projects/demo-project/configuration` | 双语均已渲染 |
| `projects/:projectId/workspaces` | `/ROU/projects/demo-project/issues` | `/ROU/projects/demo-project/issues` | 双语均已渲染 |
| `projects/:projectId/workspaces/:workspaceId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `routines` | `/ROU/routines` | `/ROU/routines` | 双语均已渲染 |
| `routines/:routineId` | `/ROU/routines/:routineId/overview` | `/ROU/routines/:routineId/overview` | 双语均已渲染 |
| `runs` | `/ROU/activity/runs` | `/ROU/activity/runs` | 双语均已渲染 |
| `settings` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `settings/*` | `/ROU/company/settings` | `/ROU/company/settings` | 双语均已渲染 |
| `skills/*` | `/ROU/skills/audit-missing` | `/ROU/skills/audit-missing` | 双语均已渲染 |
| `skills/:skillId/studio` | `/ROU/skills/studio/:示例参数` | `/ROU/skills/studio/:示例参数` | 双语均已渲染 |
| `skills/studio` | `/ROU/skills/studio` | `/ROU/skills/studio` | 双语均已渲染 |
| `skills/studio/:skillId` | `/ROU/skills/studio/:示例参数` | `/ROU/skills/studio/:示例参数` | 双语均已渲染 |
| `skills/studio/new` | `/ROU/skills/studio/new` | `/ROU/skills/studio/new` | 双语均已渲染 |
| `status` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `status-cards` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `status-cards/:cardId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `status/:cardId` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |
| `tasks` | `/ROU/issues` | `/ROU/issues` | 双语均已渲染 |
| `tests/perf/long-thread` | `/tests/perf/long-thread` | `/tests/perf/long-thread` | 匹配 Metric、Value |
| `u/:userSlug` | `/ROU/u/demo` | `/ROU/u/demo` | 双语均已渲染 |
| `ux-lab/bootstrap-setup` | `/ux-lab/bootstrap-setup` | `/ux-lab/bootstrap-setup` | 双语均已渲染 |
| `ux-lab/cross-issue-collaboration` | `/ux-lab/cross-issue-collaboration` | `/ux-lab/cross-issue-collaboration` | 双语均已渲染 |
| `ux-lab/responsible-user-denial` | `/ux-lab/responsible-user-denial` | `/ux-lab/responsible-user-denial` | 双语均已渲染 |
| `workspaces` | `/ROU/dashboard` | `/ROU/dashboard` | 双语均已渲染 |

## 交互与回归

- 首次设置页面通过语言下拉框切换至 English，再切回简体中文，标题、按钮、输入框和占位符同步切换。
- 在任务详情打开侧栏确认「打开」「属性」「产物」，在预算卡片核对「无上限」，在无效认领和 CLI 授权页查看中文错误。
- 11,847 对词条的键名、非空译文和插值占位符通过校验，TypeScript 和生产构建通过。
- 分三批运行相关界面回归，分别通过 229、302 和 91 项，部分文件重复。任务侧栏另通过 98 项回归。另有 173 项错误处理验证、8 项软件更新来源及版本判断验证通过。更新通知采用模拟 npm 响应进行测试。
- 上一次全量界面测试覆盖 915 个文件；当时修正后单独重跑失败的 14 个文件，293 项通过。以上分批结果与上次全量记录分别统计。
