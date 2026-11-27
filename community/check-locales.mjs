import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const root = new URL("../ui/src/i18n/", import.meta.url);
const tokens = (value) => [...value.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]).sort();
function compare(en, zh, path) {
  if (typeof en === "string") {
    assert.equal(typeof zh, "string", path);
    assert.ok(zh.trim() || !en.trim(), path);
    assert.deepEqual(tokens(en), tokens(zh), path);
    return 1;
  }
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort(), path);
  return Object.keys(en).reduce((count, key) => count + compare(en[key], zh[key], path + "." + key), 0);
}
let count = 0;
for (const dir of readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory())) {
  const en = new URL(dir.name + "/en.json", root);
  if (!existsSync(en)) continue;
  count += compare(JSON.parse(readFileSync(en)), JSON.parse(readFileSync(new URL("zh-CN.json", en))), dir.name);
}
assert.ok(count > 0);
console.log(`已核对 ${count} 对词条和占位符。`);
