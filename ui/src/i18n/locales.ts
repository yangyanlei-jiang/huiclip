import englishActivity from "./activity/en.json";
import chineseActivity from "./activity/zh-CN.json";
import chineseServerErrors from "./server-errors/zh-CN.json";
import englishAdapter from "./adapter/en.json";
import chineseAdapter from "./adapter/zh-CN.json";
import englishControls from "./controls/en.json";
import chineseControls from "./controls/zh-CN.json";
import englishOptions from "./options/en.json";
import chineseOptions from "./options/zh-CN.json";
import englishApps from "./apps/en.json";
import chineseApps from "./apps/zh-CN.json";
import englishErrors from "./errors/en.json";
import chineseErrors from "./errors/zh-CN.json";
import englishDynamic from "./dynamic/en.json";
import chineseDynamic from "./dynamic/zh-CN.json";
import englishInterface from "./interface/en.json";
import chineseInterface from "./interface/zh-CN.json";
import type { Resource } from "i18next";

import { assertValidLocaleMessages, withEnglishFallback } from "./locale-validation";

export const DEFAULT_LOCALE = "zh-CN" as const;

const localeModules = import.meta.glob("./locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const localeMessages = Object.fromEntries(
  Object.entries(localeModules).map(([path, messages]) => {
    const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
    if (!locale) {
      throw new Error(`Invalid locale file path: ${path}`);
    }
    return [locale, locale === "en" || locale === DEFAULT_LOCALE ? messages : withEnglishFallback(messages)];
  }),
);

if (!(DEFAULT_LOCALE in localeMessages)) {
  throw new Error(`Missing default locale messages for ${DEFAULT_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  try {
    assertValidLocaleMessages(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale messages: ${message}`);
  }
}

export const supportedLocales = Object.keys(localeMessages);

const supplementalNamespaces: Resource = {
  en: { activity: englishActivity, adapter: englishAdapter, controls: englishControls, interface: englishInterface, errors: englishErrors, dynamic: englishDynamic, apps: englishApps, options: englishOptions },
  "zh-CN": { activity: chineseActivity, serverErrors: chineseServerErrors, adapter: chineseAdapter, controls: chineseControls, interface: chineseInterface, errors: chineseErrors, dynamic: chineseDynamic, apps: chineseApps, options: chineseOptions },
};

export const i18nextResources: Resource = Object.fromEntries(
  Object.entries(localeMessages).map(([locale, messages]) => [locale, { translation: messages, ...supplementalNamespaces[locale] }]),
) as Resource;

export type SupportedLocale = keyof typeof localeMessages;
