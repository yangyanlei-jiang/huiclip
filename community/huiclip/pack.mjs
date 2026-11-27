import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
const repo = resolve(packageDir, "../..");
const [, , output, releaseVersion] = process.argv;
if (!output) throw new Error("用法：node community/huiclip/pack.mjs <输出目录> [版本号]");
const destination = resolve(output);
const packageJson = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
if (releaseVersion) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(releaseVersion)) throw new Error("版本号无效。");
  packageJson.version = releaseVersion;
}
mkdirSync(destination, { recursive: true });

const stage = mkdtempSync(join(tmpdir(), "huiclip-pack-"));
try {
  copyFileSync(join(packageDir, "huiclip.mjs"), join(stage, "huiclip.mjs"));
  writeFileSync(join(stage, "package.json"), JSON.stringify(packageJson, null, 2) + "\n");
  copyFileSync(join(repo, "LICENSE"), join(stage, "LICENSE"));
  copyFileSync(join(packageDir, "README.md"), join(stage, "README.md"));
  const runtimePaths = [
    "LICENSE", "package.json", ".npmrc", "pnpm-lock.yaml", "pnpm-workspace.yaml",
    "tsconfig.base.json", "tsconfig.json", "turbo.json", "cli", "server", "ui",
    "packages", "patches", "scripts", "skills", "tools", "integrations", "announcements", "skills-releases",
  ];
  execFileSync("git", ["archive", "--format=tar.gz", "--output=" + join(stage, "source.tar.gz"), "HEAD", ...runtimePaths], {
    cwd: repo,
    stdio: "inherit",
  });
  execFileSync("npm", ["pack", stage, "--pack-destination", destination, "--ignore-scripts"], {
    cwd: repo,
    stdio: "inherit",
  });
} finally {
  rmSync(stage, { recursive: true, force: true });
}
