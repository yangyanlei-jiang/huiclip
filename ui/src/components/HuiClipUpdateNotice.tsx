import { useEffect } from "react";
import { useToastActions } from "@/context/ToastContext";
import { t } from "@/i18n";

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function newerHuiClipRelease(current: string, candidate: unknown): candidate is string {
  if (typeof candidate !== "string" || !stableVersion.test(current) || !stableVersion.test(candidate)) return false;
  const installed = current.split(".").map(BigInt);
  const latest = candidate.split(".").map(BigInt);
  const difference = latest.findIndex((part, index) => part !== installed[index]);
  return difference !== -1 && latest[difference] > installed[difference];
}

export function HuiClipUpdateNotice() {
  const { pushToast } = useToastActions();
  useEffect(() => {
    const current = import.meta.env.VITE_HUICLIP_VERSION;
    if (!current || !stableVersion.test(current)) return;
    const controller = new AbortController();
    let announced: string | undefined;
    async function check() {
      try {
        const response = await fetch("https://registry.npmjs.org/huiclip/latest", {
          credentials: "omit",
          referrerPolicy: "no-referrer",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (controller.signal.aborted || data?.name !== "huiclip" || !newerHuiClipRelease(current, data.version) || data.version === announced) return;
        announced = data.version;
        pushToast({
          dedupeKey: "huiclip-release",
          title: t("interface:huiClipReleaseAvailable", { version: data.version }),
          body: t("interface:huiClipReleaseInstructions"),
          tone: "info",
        });
      } catch {
        // An offline instance remains usable. Retry on the next scheduled check.
      }
    }
    void check();
    const timer = window.setInterval(check, 6 * 60 * 60 * 1000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [pushToast]);
  return null;
}
