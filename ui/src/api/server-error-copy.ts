import i18n from "i18next";
import messages from "../i18n/server-errors/zh-CN.json";

// These templates mirror first-party HttpError messages in server/src. Match just
// one identifier, never a provider diagnostic, user sentence or multiline log.
const identifierTemplates = [
  [403, "Missing permission: "],
  [404, "Plugin not found: "],
  [409, "Plugin already installed: "],
  [422, "Invalid environment variable name: "],
  [422, "Invalid environment binding for key: "],
  [422, "Unknown adapter type: "],
] as const;

export function serverErrorCopy(status: number, source: string): string {
  if (!i18n.isInitialized) return source;
  const exact = `${status} ${source}`;
  const options = { ns: "serverErrors", keySeparator: false, nsSeparator: false, defaultValue: source } as const;
  if (Object.hasOwn(messages, exact)) return i18n.t(exact, options);
  for (const [expectedStatus, prefix] of identifierTemplates) {
    if (expectedStatus !== status || !source.startsWith(prefix)) continue;
    const value = source.slice(prefix.length);
    if (/^[A-Za-z0-9_@][A-Za-z0-9_:@./-]{0,127}$/.test(value)) {
      return i18n.t(`${status} ${prefix}{{value}}`, { ...options, value });
    }
  }
  return source;
}
