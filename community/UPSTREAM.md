# 上游同步

当前基线是 Paperclip 稳定标签 `v2026.1117.0`，完整提交 `c0f132898d2a2677312d8c72096187b27a3d9a38`。GitHub Fork 的源仓库是 [paperclipai/paperclip](https://github.com/paperclipai/paperclip)。

1. 在社区检出中确认 `origin` 指向个人 Fork，把 `https://github.com/paperclipai/paperclip.git` 设为 `upstream`。
2. 从上游 [稳定发行](https://github.com/paperclipai/paperclip/releases)核对标签和变更说明，读取对应的许可和迁移要求。
3. 从新标签创建新社区分支。对照 `git log --reverse v2026.1117.0..community/zh-cn-v1`，按顺序拣选需要带过去的社区提交。前两项 i18n 通用改动可以独立审阅，之后的默认语言、词库、品牌、安装包与文档属于社区维护。
4. 重新核对语言键、构建、浏览器简中和英文切换。在全新实例检查安装，再用备份副本验收更新。文档的新版本以实测结果为准。
5. 确认发布范围后，将新分支正常推到自己的 Fork。默认分支和已有公开引用保持原样。

```sh
git remote -v
git remote add upstream https://github.com/paperclipai/paperclip.git
git fetch upstream tag <稳定标签>
git switch -c community/zh-cn-<下一版> <稳定标签>
git cherry-pick <社区提交>
```

已经使用 `upstream` 的检出可以跳过添加远端。源码根目录保留 MIT 和上游版权。

## 许可与发布范围

- 稳定标签 [主仓库许可证](https://github.com/paperclipai/paperclip/blob/v2026.1117.0/LICENSE)为 MIT。社区增量限原创新增或修改，依赖及上游文件内单独的许可和出处继续有效。
- [独立官方文档许可证](https://github.com/paperclipai/paperclip-docs/blob/main/LICENSE)为 CC BY-NC-ND 4.0。社区的逐页登记使用公开 URL。中文指南独立编写，参考处链接回源，不纳入官方文章、翻译、版式复制或截图。
- [Docusaurus](https://github.com/facebook/docusaurus)和 [Waline](https://github.com/walinejs/waline)从公开 npm 依赖安装。Waline 空库模板按固定地址和哈希初始化，评论库、账号、密钥和生成结果都在 Git 之外。
- `node community/verify-publication.mjs` 检查当前分支的社区文件范围和上游许可证文件。提交前还需人工审核 diff 与作者公开身份。
