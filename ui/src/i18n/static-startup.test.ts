// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const shell = new DOMParser().parseFromString(html, "text/html");
const script = Array.from(shell.scripts).find((node) => node.textContent.includes("const onFailure"))!;
afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("boot fallback before the app loads", () => {
  it.each([
    [undefined, "zh-CN", "Paperclip 无法启动", "Paperclip 加载时间比预期更长", "重新加载页面"],
    ["en", "en", "Paperclip couldn’t start", "Paperclip is taking longer to load", "Reload page"],
    ["fr", "fr", "Paperclip couldn’t start", "Paperclip is taking longer to load", "Reload page"],
    ["invalid-locale", "zh-CN", "Paperclip 无法启动", "Paperclip 加载时间比预期更长", "重新加载页面"],
  ])("uses the configured language: %s", (saved, lang, failure, slow, reload) => {
    vi.useFakeTimers();
    localStorage.removeItem("paperclip.ui.locale");
    if (saved) localStorage.setItem("paperclip.ui.locale", saved);
    expect(shell.title).toBe("Paperclip");
    expect(shell.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute("content")).toBe("Paperclip");
    document.body.innerHTML = shell.body.innerHTML;
    document.documentElement.lang = "zh-CN";
    const root = document.getElementById("root")!;
    const title = document.getElementById("paperclip-startup-title")!;
    const notice = document.getElementById("paperclip-startup")!;
    try {
      new Function(script.textContent)();
      expect(document.documentElement.lang).toBe(lang);
      expect(notice.hidden).toBe(true);
      vi.advanceTimersByTime(30_000);
      expect(notice.hidden).toBe(false);
      expect(title.textContent).toBe(slow);
      expect(document.getElementById("paperclip-startup-reload")?.textContent?.trim()).toBe(reload);
      window.dispatchEvent(new ErrorEvent("error", { message: "internal detail" }));
      expect(title.textContent).toBe(failure);
      expect(notice.textContent).not.toContain("internal detail");
    } finally {
      root.append(document.createElement("div"));
      window.dispatchEvent(new ErrorEvent("error"));
    }
  });
});
