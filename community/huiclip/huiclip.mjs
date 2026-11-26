#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const source = join(packageRoot, "source.tar.gz");
const instance = "huiclip";
const home = resolve(process.env.HUICLIP_HOME || join(homedir(), ".huiclip"));
const instanceRoot = join(home, "instances", instance);
const configPath = join(instanceRoot, "config.json");
const serviceName = process.platform === "darwin" ? "io.github.yangyanlei-jiang.huiclip" : "huiclip.service";

function portFrom(value, fallback, label) {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${label} 必须是 1–65535 的端口号。`);
  return port;
}

function realpathIfPresent(file) {
  if (existsSync(file)) return realpathSync(file);
  return join(realpathIfPresent(dirname(file)), basename(file));
}

function initializeHome() {
  const actualHome = realpathIfPresent(home);
  const upstreamHomes = [join(homedir(), ".paperclip"), process.env.PAPERCLIP_HOME].filter(Boolean);
  for (const upstreamHome of upstreamHomes) {
    const other = realpathIfPresent(resolve(upstreamHome));
    if (actualHome === other || actualHome.startsWith(other + sep)) {
      throw new Error("HUICLIP_HOME 必须使用独立目录。");
    }
  }

  mkdirSync(home, { recursive: true, mode: 0o700 });
  const marker = join(home, ".huiclip-home");
  if (!existsSync(marker)) {
    if (readdirSync(home).length) throw new Error("请为 HUICLIP_HOME 指定一个新的空目录。");
    try {
      writeFileSync(marker, "huiclip-v1\n", { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  if (readFileSync(marker, "utf8") !== "huiclip-v1\n") throw new Error("无法识别 HuiClip 数据目录。");

  mkdirSync(instanceRoot, { recursive: true, mode: 0o700 });
  if (!existsSync(configPath)) {
    const port = portFrom(process.env.HUICLIP_PORT, 3310, "HUICLIP_PORT");
    const dbPort = portFrom(process.env.HUICLIP_DB_PORT, 54339, "HUICLIP_DB_PORT");
    if (port === dbPort) throw new Error("应用端口与内嵌数据库端口必须不同。");
    const config = {
      $meta: { version: 1, updatedAt: new Date().toISOString(), source: "configure" },
      database: {
        mode: "embedded-postgres",
        embeddedPostgresDataDir: join(instanceRoot, "db"),
        embeddedPostgresPort: dbPort,
        backup: { dir: join(instanceRoot, "data", "backups") },
      },
      logging: { mode: "file", logDir: join(instanceRoot, "logs") },
      server: { deploymentMode: "local_trusted", exposure: "private", bind: "loopback", port, serveUi: true },
      auth: { baseUrlMode: "auto" },
      storage: { provider: "local_disk", localDisk: { baseDir: join(instanceRoot, "data", "storage") } },
      secrets: { localEncrypted: { keyFilePath: join(instanceRoot, "secrets", "master.key") } },
      telemetry: { enabled: false },
      updates: { checkEnabled: false },
    };
    try {
      writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }

  const envPath = join(instanceRoot, ".env");
  if (!existsSync(envPath)) {
    try {
      writeFileSync(envPath, `PAPERCLIP_AGENT_JWT_SECRET=${randomBytes(32).toString("hex")}\n`, { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function environment(config) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(PAPERCLIP_|BETTER_AUTH_|PG|npm_config_bind)/.test(name) &&
    !["PORT", "DATABASE_URL", "DATABASE_MIGRATION_URL"].includes(name),
  ));
  return {
    ...env,
    PORT: String(config.server.port),
    CODEX_HOME: join(home, "codex"),
    PAPERCLIP_API_URL: `http://127.0.0.1:${config.server.port}`,
    PAPERCLIP_HOME: home,
    PAPERCLIP_INSTANCE_ID: instance,
    PAPERCLIP_CONFIG: configPath,
    PAPERCLIP_CONTEXT: join(home, "context.json"),
    PAPERCLIP_TELEMETRY_DISABLED: "1",
    PAPERCLIP_ANNOUNCEMENTS_ENABLED: "false",
    PAPERCLIP_MIGRATION_AUTO_APPLY: "true",
    PAPERCLIP_UI_DEV_MIDDLEWARE: "false",
  };
}

function execute(command, args, options) {
  return new Promise((complete, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    const forward = (signal) => child.kill(signal);
    process.on("SIGINT", forward);
    process.on("SIGTERM", forward);
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) complete();
      else reject(new Error(`${command} ${args.join(" ")} 结束（${signal ?? code}）。`));
    });
    child.once("close", () => {
      process.off("SIGINT", forward);
      process.off("SIGTERM", forward);
    });
  });
}

async function sourceDigest() {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(source)) hash.update(chunk);
  return hash.digest("hex");
}

async function prepareRuntime(env) {
  const cache = join(home, "runtime");
  const destination = join(cache, `${manifest.version}-${(await sourceDigest()).slice(0, 16)}`);
  const ready = join(destination, ".huiclip-ready");
  if (existsSync(ready)) return destination;
  mkdirSync(cache, { recursive: true, mode: 0o700 });

  const lock = destination + ".lock";
  try {
    mkdirSync(lock, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST") throw new Error("此版本正在准备，请稍后重试。");
    throw error;
  }
  try {
    if (existsSync(ready)) return destination;
    if (existsSync(destination)) throw new Error(`运行目录未完成初始化：${destination}`);
    mkdirSync(destination, { mode: 0o700 });
    try {
      await execute("tar", ["-xzf", source, "-C", destination], {});
      const installArgs = ["install", "--frozen-lockfile"];
      if (process.env.HUICLIP_PNPM_STORE) installArgs.push("--store-dir", resolve(process.env.HUICLIP_PNPM_STORE));
      const options = { cwd: destination, env };
      await execute("pnpm", installArgs, options);
      await execute("pnpm", ["--filter", "@paperclipai/paperclip-runner", "build:typescript"], options);
      await execute("pnpm", ["--filter", "@paperclipai/plugin-sdk", "build"], options);
      await execute("pnpm", ["--filter", "@paperclipai/ui", "build"], options);
      writeFileSync(ready, "", { flag: "wx" });
    } catch (error) {
      rmSync(destination, { recursive: true, force: true });
      throw error;
    }
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
  return destination;
}

function renderService() {
  const args = [process.execPath, join(packageRoot, "huiclip.mjs"), "run"];
  if (process.platform === "darwin") {
    const xml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${serviceName}</string>
  <key>ProgramArguments</key>
  <array>${args.map((arg) => `<string>${xml(arg)}</string>`).join("")}</array>
  <key>EnvironmentVariables</key>
  <dict><key>HUICLIP_HOME</key><string>${xml(home)}</string></dict>
  <key>RunAtLoad</key><true/>
</dict>
</plist>`;
  }

  const unitQuote = (value) => {
    if (/[\r\n]/.test(value)) throw new Error("服务路径不能包含换行。");
    return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("%", "%%").replaceAll("$", () => "$$")}"`;
  };
  return `[Unit]
Description=HuiClip

[Service]
Environment=${unitQuote(`HUICLIP_HOME=${home}`)}
ExecStart=${args.map(unitQuote).join(" ")}
Restart=on-failure

[Install]
WantedBy=default.target`;
}

function help() {
  console.log(`回形夹 · HuiClip ${manifest.version}
huiclip setup                安装依赖并构建本地运行环境
huiclip run                  启动本机应用
huiclip info                 查看 HuiClip 路径与服务名称
huiclip service-file         输出当前平台的独立服务定义
huiclip auth <命令>          登录、退出、身份查询或引导管理员
huiclip context <命令>       管理 HuiClip 的 CLI 上下文
huiclip --version            查看已安装版本`);
}

async function main(args) {
  const [command, ...rest] = args;
  if (!command || command === "--help" || command === "-h") return help();
  if (command === "--version" || command === "-v") {
    console.log(manifest.version);
    return;
  }
  if (!["setup", "run", "info", "service-file", "auth", "context"].includes(command)) {
    throw new Error("请运行 huiclip --help 查看可用命令。包的更新和卸载由 npm 完成。");
  }
  if (["setup", "run", "info", "service-file"].includes(command) && rest.length) throw new Error("此命令不接收位置参数。");
  if (command === "auth" && !["login", "logout", "whoami", "bootstrap-ceo", "--help"].includes(rest[0])) {
    throw new Error("可用的认证命令为 login、logout、whoami 和 bootstrap-ceo。");
  }
  if (rest.some((arg) => /^(?:--(?:data-dir|config|context|api-base|instance|api-key|api-key-env|base-url)(?:=|$)|-[cdi])/.test(arg))) {
    throw new Error("请通过 HuiClip 的配置目录设置实例参数。");
  }
  const config = initializeHome();
  if (command === "info") {
    console.log(JSON.stringify({
      version: manifest.version,
      home,
      config: configPath,
      context: join(home, "context.json"),
      cliAuth: join(home, "auth.json"),
      codexHome: join(home, "codex"),
      port: config.server.port,
      embeddedPostgresPort: config.database.embeddedPostgresPort,
      serviceName,
    }, null, 2));
    return;
  }
  if (command === "service-file") {
    console.log(renderService());
    return;
  }
  const env = environment(config);
  const cwd = await prepareRuntime(env);
  if (command === "setup") {
    console.log("HuiClip 已准备好。运行 huiclip run 启动。");
  } else if (command === "run") {
    const loader = join(cwd, "server", "node_modules", "tsx", "dist", "loader.mjs");
    await execute(process.execPath, ["--import", loader, join(cwd, "server", "src", "index.ts")], { cwd, env });
  } else {
    const loader = join(cwd, "cli", "node_modules", "tsx", "dist", "loader.mjs");
    await execute(process.execPath, ["--import", loader, join(cwd, "cli", "src", "index.ts"), command, ...rest], { cwd, env });
  }
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
