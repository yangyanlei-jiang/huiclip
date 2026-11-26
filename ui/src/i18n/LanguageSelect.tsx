import { useId } from "react";
import { setUiLocale, useTranslation } from ".";

export function LanguageSelect() {
  const id = useId();
  const { i18n, t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm">
      <label htmlFor={id}>{t("language.label")}</label>
      <select
        id={id}
        className="min-w-0 rounded-md border border-input bg-background px-2 py-1 text-foreground"
        value={i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en"}
        onChange={(event) => void setUiLocale(event.target.value)}
      >
        <option value="zh-CN" lang="zh-CN">简体中文</option>
        <option value="en" lang="en">English</option>
      </select>
    </div>
  );
}
