# 参与 HuiClip 社区

**第一规则：保留 Paperclip 的全部原有功能。** 汉化只替换用户看到的文案，保留操作入口、权限、快捷键、表单值和接口行为，并保留英文切换。涉及功能的改动须在隔离实例与对应上游稳定版对照验证。发现回归时，优先恢复原有行为。

从 HuiClip 社区分支创建自己的工作分支。译文在 `ui/src/i18n/locales/`，提交时同步补齐英文和简中键，变量名和数量保持一致。服务返回字段、模型 ID、用户输入及日志原文按原样显示。只涉及上游通用机制的补丁可以独立提交，方便之后由维护者决定如何回馈。

撰写指南时使用本分支源码和自己的本地复现，操作截图须来自测试实例并去除账号、路径或任务里的私有内容。把官方参考链接与验证状态登记在 [覆盖清单](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/COVERAGE.md)。更新文档源目录后按 [Docusaurus 版本说明](https://docusaurus.io/docs/versioning)维护版本。

可以用 [反馈模板](FEEDBACK.md) 记录问题。GitHub Discussions 启用后，使用问答和设计讨论可以在那里进行。提交前搜索已有问题，仅分享公开或脱敏数据。依次用版本、路径、步骤、预期和实际结果说明现象。

社区讨论请尊重他人，避免垃圾内容和人身攻击。审核联系与数据处理见[评论指南](https://github.com/yangyanlei-jiang/huiclip-docs/blob/main/docs/community.md)。
