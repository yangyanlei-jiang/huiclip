import { useTranslation as usePageTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { SetupWizardFooter } from "@/components/SetupWizard";
import { Input } from "@/components/ui/input";

export interface SpekoProviderSetupProps {
  agentName: string;
  onSaveExit?(): void;
  credentials: Record<string, string>;
  onChange(values: Record<string, string>): void;
  onConnect(values: Record<string, string>): void;
  callbackUrl?: string | null;
  pending?: boolean;
  repairing?: boolean;
  /** Presence only; existing callback secrets never reach the browser. */
  signingSecretConfigured?: boolean;
}
export function SpekoProviderSetup({ agentName, onSaveExit, credentials, onChange, onConnect, callbackUrl, pending = false, repairing = false, signingSecretConfigured }: SpekoProviderSetupProps) {
  const { t: pageText } = usePageTranslation("interface");
  const hasSavedSecret = signingSecretConfigured ?? repairing;
  const ready = repairing && hasSavedSecret || Boolean(credentials.apiKey?.trim() && credentials.agentId?.trim());
  const reachable = callbackUrl?.startsWith("https://") === true;
  function connect() {
    if (!ready || !reachable || pending) return;
    const values = Object.fromEntries(Object.entries(credentials).filter(([, value]) => value.trim()));
    if (!hasSavedSecret && !values.signingSecret) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      values.signingSecret = `whsec_${btoa(String.fromCharCode(...bytes))}`;
      onChange(values);
    }
    onConnect(values);
  }
  return <div className="space-y-5">
    <div>
      <h1 className="text-xl font-bold">{pageText("connect_b65463") + " "}{agentName}{" " + pageText("toSpeko_2573f8")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{pageText("chooseADedicatedSpekoVoicePersonaPaperclipUses_8bc785") + " "}{agentName}{" " + pageText("keepsItsExistingRuntimeToolsAndTaskContext_06b45c")}</p>
    </div>
    <ol className="list-decimal space-y-2 pl-5 text-sm">
      <li>{pageText("createADedicatedAgentInSpekoAndChoose_e97007")}</li>
      <li>{pageText("copyItsAgentIDAndASpekoAPI_b4ab32")}</li>
      <li>{pageText("reviewRecordingAndRetentionSettingsInYourSpeko_e7bc62")}</li>
    </ol>
    <Button asChild variant="outline"><a href="https://platform.speko.ai/agents" target="_blank" rel="noreferrer">{pageText("openSpekoAgents_679043")}</a></Button>
    <label className="grid gap-2 text-sm font-medium">{pageText("spekoAgentID_3cb789")}<Input autoComplete="off" value={credentials.agentId ?? ""} placeholder={repairing ? pageText("leaveBlankToKeepTheCurrentPersona_834287") : "agent_…"} onChange={(event) => onChange({ ...credentials, agentId: event.target.value })} /></label>
    <label className="grid gap-2 text-sm font-medium">{pageText("spekoAPIKey_43c319")}<Input type="password" autoComplete="new-password" value={credentials.apiKey ?? ""} placeholder={repairing ? pageText("leaveBlankToKeepTheSavedKey_a13048") : pageText("pasteYourSpekoAPIKey_f37926")} onChange={(event) => onChange({ ...credentials, apiKey: event.target.value })} /></label>
    {!reachable && <p role="alert" className="text-sm text-destructive">{pageText("configureAPublicHTTPSCallbackOriginForPaperclip_5e995b")}</p>}
    {reachable && <p className="break-all text-xs text-muted-foreground">{pageText("callback_0563ae") + " "}{callbackUrl}</p>}
    <p className="text-sm text-muted-foreground">{pageText("credentialsAndAGeneratedCallbackSigningSecretAre_3923fe")}</p>
    {onSaveExit ? <SetupWizardFooter onSaveExit={onSaveExit} disabled={pending}><Button disabled={!ready || !reachable || pending} onClick={connect}>{pending ? pageText("verifyingSpeko_c814c6") : repairing ? pageText("reconnectSpeko_635d6f") : pageText("connectSpeko_c42bcc")}</Button></SetupWizardFooter> : <div className="flex justify-end"><Button disabled={!ready || !reachable || pending} onClick={connect}>{pending ? pageText("verifyingSpeko_c814c6") : repairing ? pageText("reconnectSpeko_635d6f") : pageText("connectSpeko_c42bcc")}</Button></div>}
  </div>;
}
