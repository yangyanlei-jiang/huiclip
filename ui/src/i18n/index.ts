import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";

const localeStorageKey = "paperclip.ui.locale";

function storedLocale(): string {
  try {
    const locale = globalThis.localStorage?.getItem(localeStorageKey);
    if (locale && supportedLocales.includes(locale)) return locale;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
  return DEFAULT_LOCALE;
}

function updateDocumentLanguage(locale: string) {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: storedLocale(),
  fallbackLng: "en",
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

i18n.on("languageChanged", updateDocumentLanguage);

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export async function setUiLocale(locale: string): Promise<void> {
  if (!supportedLocales.includes(locale)) return;
  await i18n.changeLanguage(locale);
  try {
    globalThis.localStorage?.setItem(localeStorageKey, locale);
  } catch {
    // The active language still works without persistence.
  }
}

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
