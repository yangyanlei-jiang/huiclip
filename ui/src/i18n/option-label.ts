import { t } from "./index";

/** Localize a built-in display option without changing its stored value. */
export function optionLabel(label: string, values: Record<string, string | number> = {}): string {
  return t(label, { ...values, ns: "options", keySeparator: false, nsSeparator: false, defaultValue: label });
}
