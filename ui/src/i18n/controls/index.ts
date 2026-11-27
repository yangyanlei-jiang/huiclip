import { t } from "..";
import type { TOptions } from "i18next";

export function controlText(key: string, options: TOptions = {}) {
  return t(key, { keySeparator: false, nsSeparator: false, defaultValue: key, ...options, ns: "controls" });
}
