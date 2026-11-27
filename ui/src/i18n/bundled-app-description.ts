import english from "./apps/en.json";
import { t } from "./index";

/** Match both fields so new upstream text and organization-authored descriptions stay intact. */
export function bundledAppDescription(slug: string | null, description: string): string {
  const descriptions: Record<string, string> = english.descriptions;
  if (!slug || !Object.hasOwn(descriptions, slug) || descriptions[slug] !== description) return description;
  return t(`apps:descriptions.${slug}`, { defaultValue: description });
}
