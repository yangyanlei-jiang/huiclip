import { useTranslation as usePageTranslation } from "@/i18n";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Providers supply only credentials the current user is authorized to use.
 * Values are opaque connection references, never secret values. */
export function ApiKeyCredentialField({ options, connectionId, onConnectionChange, value, onChange,
  disabled, loading, error, providerName, keysUrl, label = "API key" }: {
  options: { id: string; label: string; disabled?: boolean }[];
  connectionId: string | null;
  onConnectionChange(id: string): void;
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  providerName: string;
  keysUrl: string;
  label?: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const choices = connectionId && !options.some(option => option.id === connectionId)
    ? [{ id: connectionId, label: loading ? "Checking saved API key…" : "Previously selected key · unavailable", disabled: true }, ...options] : options;
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {choices.length > 0 && <select id={id} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={connectionId ?? ""} disabled={disabled} onChange={event => onConnectionChange(event.target.value)}>
      {choices.map(option => <option key={option.id} value={option.id} disabled={option.disabled}>{option.label}</option>)}
      <option value="">{pageText("enterANewAPIKey_a3e4ec")}</option>
    </select>}
    {!connectionId && <Input id={choices.length ? `${id}-new` : id} aria-label={choices.length ? pageText("newAPIKey_bbc653") : undefined}
      type="password" autoComplete="off" value={value} disabled={disabled}
      onChange={event => { onConnectionChange(""); onChange(event.target.value); }} placeholder={`Paste your ${providerName} API key`} />}
    {loading && <p role="status" className="text-sm text-muted-foreground">{pageText("checkingSavedAPIKeys_8e681d")}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{pageText("couldNotLoadSavedAPIKeys_5ae8fd") + " "}{error}</p>}
    <a href={keysUrl} target="_blank" rel="noreferrer" className="text-sm underline">{pageText("getAn_f61053") + " "}{providerName}{" " + pageText("apiKey_3334f4")}</a>
  </div>;
}
