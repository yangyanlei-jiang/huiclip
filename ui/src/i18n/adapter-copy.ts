import i18n from "i18next";
import english from "./adapter/en.json";

const sourceKeys = new Map(Object.entries(english).map(([key, source]) => [source, key]));

/** Only authored UI metadata is eligible. Unknown adapter/plugin copy passes through. */
export function adapterCopy(source: string): string {
  const key = sourceKeys.get(source);
  if (!key || !i18n.isInitialized) return source;
  // Template examples in help text must display their literal {{variable}} syntax.
  return i18n.t(key, { ns: "adapter", defaultValue: source, skipInterpolation: true });
}
