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

## 上游发布与 HuiClip 用户通知

Paperclip 的 GitHub 稳定发行是维护端的输入。HuiClip 用户界面的更新来源是公共 npm 上 `huiclip` 包的 `latest` 标签。新安装包会把自己的版本写入构建后的界面。页面打开时及保持打开期间每六小时查询一次；只有包名匹配且稳定版本更高时才提示。网络不可用时仍可正常使用。旧版本需要先升级到包含此功能的 HuiClip 版本。

仓库带有 `.github/workflows/huiclip-upstream.yml`。启用后，每六小时查询上游稳定发行，跳过预发行和已集成版本；临时合并到社区代码后，检查中英文键和插值、编译界面、运行 UI 回归和隔离服务启动测试。发生冲突或验证失败时，维护者可从 Actions 运行记录查看原因。通过后，在本 Fork 建立 `community/upstream-<稳定标签>` 候选分支。

**启用定时跟踪**需要该工作流位于 Fork 的默认分支、该 Fork 已启用 Actions，并允许候选分支作业写入本 Fork。工作流只提交到社区分支时，GitHub 不会按这个分支上的定时配置调度。本地可先运行 `node community/check-locales.mjs`。

维护者应在候选分支核对上游功能变化、新增按钮与报错、模型连接、嵌入式数据库迁移以及原生运行器的版本和校验值。用隔离实例复扫中英文页面，并用旧版本的数据副本测试升级。需要补译或修复时，在候选分支完成并重新验证，再将验收后的变更集成到社区发布分支。

发布时从验收过的干净提交打包，指定新的 HuiClip 稳定版本；使用 npm 维护者账号发布经过验收的同一份 tarball。示例中的 VERSION 和路径由维护者设为实际版本和打包目录。

```sh
node community/huiclip/pack.mjs "$RELEASE_DIR" "$VERSION"
npm publish "$RELEASE_DIR/huiclip-$VERSION.tgz" --access public --tag latest
npm view huiclip@latest version --registry=https://registry.npmjs.org
```

上游发版、生成候选分支和推送普通提交均不会改变 HuiClip 的 npm 标签。
