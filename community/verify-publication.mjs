import { execFileSync } from 'node:child_process';

const baseline = 'c0f132898d2a2677312d8c72096187b27a3d9a38';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
git('merge-base', '--is-ancestor', baseline, 'HEAD');

const changed = git('diff', '--name-only', '-z', baseline, 'HEAD').split('\0').filter(Boolean);
const outsideScope = changed.filter((path) =>
  !/^(README(?:\.zh-CN)?\.md$|\.github\/ISSUE_TEMPLATE\/huiclip-feedback\.yml$|\.github\/workflows\/huiclip-upstream\.yml$|ui\/|community\/)/.test(path) ||
  /(^|\/)(\.env[^/]*|node_modules|\.docusaurus|\.waline-data|build|dist|\.huiclip-home|auth\.json|context\.json)(\/|$)|\.(sqlite(?:-wal|-shm)?|tgz|tar\.gz|log)$/.test(path),
);
if (outsideScope.length) throw new Error(`超出首版发布范围：\n${outsideScope.join('\n')}`);
if (git('show', `${baseline}:LICENSE`) !== git('show', 'HEAD:LICENSE')) {
  throw new Error('上游许可证与版权声明发生变化。');
}
console.log(`发布范围核验通过，共 ${changed.length} 个社区增量文件。`);
