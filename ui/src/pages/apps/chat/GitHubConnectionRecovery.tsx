import { t as interfaceNotice } from "@/i18n";
import { t as translateDynamic } from "../../../i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useState } from "react";
import { AlertTriangle, CircleHelp, ExternalLink, Loader2 } from "lucide-react";
import type { ChatEndpoint } from "@/api/chatEndpoints";
import { chatEndpointsApi } from "@/api/chatEndpoints";
import { CopyText } from "@/components/CopyText";
import { SetupWizardFooter } from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/lib/router";
import { gitHubAppSettingsUrl } from "./GitHubAppIdentity";

export function GitHubConnectionRecoveryNotice({ endpoint }: { endpoint: ChatEndpoint }) {
  const { t: pageText } = usePageTranslation("interface");
  if (!["attention", "revoked"].includes(endpoint.status)) return null;
  return (
    <section aria-label={pageText("githubConnectionNeedsRepair_a475ce")} className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0 space-y-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{endpoint.status === "revoked" ? pageText("githubBotIsDisconnected_52177a") : pageText("githubConnectionNeedsRepair_a475ce")}</h2>
          <p className="text-sm">{pageText("reconnectThisBotToRestoreGitHubReviewsAnd_b7e382")}</p>
        </div>
        <Button asChild><Link to={`/apps/chat/connect?provider=github&resume=${endpoint.id}&reconnect=1`}>{pageText("reconnectGitHub_4b320d")}</Link></Button>
        {(endpoint.lastError || endpoint.healthMessage) && <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{pageText("connectionDetails_ab30a5")}</summary>
          <p className="mt-2 break-words">{endpoint.lastError ?? endpoint.healthMessage}</p>
        </details>}
      </div>
    </section>
  );
}

export const GITHUB_APP_CREDENTIAL_FIELDS = ["privateKey", "webhookSecret", "clientSecret"] as const;
export type GitHubAppCredentialField = typeof GITHUB_APP_CREDENTIAL_FIELDS[number];
export type GitHubAppCredentials = { appId: string; privateKey: string; webhookSecret: string; clientSecret?: string };

function CredentialLabel({ id, label, help }: { id: string; label: string; help: string }) {
  return <div className="flex items-center gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Tooltip><TooltipTrigger asChild><button type="button" aria-label={translateDynamic("dynamic:helpWith", { value1: label })} className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
      <CircleHelp className="size-3.5" aria-hidden="true" />
    </button></TooltipTrigger><TooltipContent className="max-w-xs">{help}</TooltipContent></Tooltip>
  </div>;
}

export function GitHubAppRecovery({ endpoint, reconnect, credentialFields, requireAllCredentialFields = false, rotateWebhookSecret = false, rotationAlreadyCommitted = false, onConnect, onExit }: {
  endpoint: ChatEndpoint;
  reconnect: boolean;
  credentialFields?: readonly GitHubAppCredentialField[];
  requireAllCredentialFields?: boolean;
  rotateWebhookSecret?: boolean;
  rotationAlreadyCommitted?: boolean;
  onConnect: (credentials?: GitHubAppCredentials) => Promise<void>;
  onExit: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const [replace, setReplace] = useState(!!credentialFields || !reconnect);
  const [credentials, setCredentials] = useState<GitHubAppCredentials>({ appId: endpoint.botExternalId ?? "", privateKey: "", webhookSecret: "" });
  const [privateKeyDraft, setPrivateKeyDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [rotationSecret, setRotationSecret] = useState("");
  const [rotationGeneration, setRotationGeneration] = useState<string | null>(null);
  const [rotationUncertain, setRotationUncertain] = useState(false);
  const needsPrivateKey = !credentialFields || credentialFields.includes("privateKey");
  const needsWebhookSecret = credentialFields ? credentialFields.includes("webhookSecret") : !reconnect && !["active", "paused", "revoked"].includes(endpoint.status);
  const appName = endpoint.botLabel ?? endpoint.setup?.github?.appName ?? "your existing App";
  const appIdInvalid = !!credentials.appId.trim() && !/^\d+$/.test(credentials.appId.trim());
  const keyInvalid = !!credentials.privateKey.trim() && !/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(credentials.privateKey);
  const keyLoaded = !!credentials.privateKey.trim() && !keyInvalid && !privateKeyDraft;
  const incomplete = credentialFields
    ? !credentialFields.length || appIdInvalid || keyInvalid || (requireAllCredentialFields
      ? credentialFields.some(field => !credentials[field]?.trim())
      : credentialFields.every(field => !credentials[field]?.trim()))
    : replace && (!credentials.appId.trim() || !credentials.privateKey.trim() || appIdInvalid || keyInvalid || (needsWebhookSecret && !credentials.webhookSecret.trim()));
  const actionLabel = pending ? "Checking GitHub…" : replace ? (reconnect ? "Verify and reconnect" : "Connect existing App") : "Reconnect saved App";
  async function connect() {
    setPending(true);
    setError("");
    try { await onConnect(replace ? credentials : undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : interfaceNotice("interface:couldNotReconnectGitHubTryAgain_fb2241")); }
    finally { setPending(false); }
  }
  async function checkSavedRotation(expected: string | null | undefined) {
    try {
      const saved = await chatEndpointsApi.get(endpoint.id);
      if (expected !== undefined && (saved.setup?.credentialRotationId ?? null) === expected) {
        setRotationUncertain(false);
        return true;
      }
      setRotationSecret("");
      setRotationGeneration(null);
      setError(interfaceNotice("interface:theWebhookSecretChangedButThisPageDid_74d50b"));
    } catch {
      // A failed status read cannot establish that the earlier secret is current.
    }
    setRotationUncertain(true);
    return false;
  }
  async function generateSecret() {
    const previousGeneration = rotationGeneration ?? (rotationSecret ? undefined : endpoint.setup?.credentialRotationId ?? null);
    setPending(true);
    setError("");
    try {
      const result = await chatEndpointsApi.generateSetupSecret(endpoint.id);
      setRotationSecret(result.webhookSecret);
      setRotationGeneration(result.credentialRotationId ?? null);
      setRotationUncertain(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : interfaceNotice("interface:couldNotGenerateTheWebhookSecretTryAgain_a68dd6"));
      setRotationUncertain(true);
      await checkSavedRotation(previousGeneration);
    }
    finally { setPending(false); }
  }
  return <div className="space-y-6">
    {reconnect && <div className="space-y-3">
      <p className="text-sm">{pageText("restore_3cbe6d") + " "}<strong>{appName}</strong>{" " + pageText("usingItsSavedCredentialsPaperclipWillCheckThe_ceb159")}</p>
      <p className="text-sm text-muted-foreground">{pageText("yourAgentRepositoryChoicesReviewSettingsAndTask_99dfb4")}</p>
    </div>}
    {rotateWebhookSecret && <section aria-label={pageText("rotateWebhookSecret_c271b8")} className="space-y-3">
      <h2 className="text-base font-semibold">{pageText("rotateTheWebhookSecret_45a653")}</h2>
      <p className="text-sm">{rotationAlreadyCommitted ? pageText("theRotatedSecretIsSavedReconnectUsingThat_544c83") : <>{pageText("generateANewSecretThenReplaceTheWebhook_72a86e") + " "}<a href={gitHubAppSettingsUrl(endpoint)} target="_blank" rel="noreferrer" className="underline">{pageText("githubAppSettings_08c2e6")}</a>{pageText("githubMustVerifyTheNewSecretBeforeYou_c9f9e5")}</>}</p>
      <p className="text-sm text-muted-foreground">{pageText("generatingImmediatelyInvalidatesThePreviousSecretThisValue_6a9844")}</p>
      <Button type="button" variant="outline" disabled={pending} onClick={() => void generateSecret()}>{rotationSecret || rotationAlreadyCommitted ? pageText("generateAnotherSecret_4f4a84") : pageText("generateWebhookSecret_3bd179")}</Button>
      {rotationUncertain && <p role="status" className="text-sm">{pageText("theActiveSecretIsNotConfirmedCheckIts_e19b3e")}</p>}
      {rotationUncertain && rotationSecret && <Button type="button" variant="outline" disabled={pending} onClick={async () => {
        setPending(true);
        try { if (await checkSavedRotation(rotationGeneration ?? undefined)) setError(""); }
        finally { setPending(false); }
      }}>{pageText("checkSavedSecretStatus_a3d925")}</Button>}
      {rotationSecret && !rotationUncertain && <div className="space-y-2">
        <Label htmlFor="github-rotation-secret">{pageText("newWebhookSecret_9a9a6b")}</Label>
        <Input id="github-rotation-secret" type="password" autoComplete="off" disabled={pending} readOnly value={rotationSecret} />
        {!pending && <CopyText text={rotationSecret} ariaLabel={interfaceNotice("interface:copyWebhookSecret_b011af")} className="text-sm underline">{pageText("copyWebhookSecret_b011af")}</CopyText>}
      </div>}
    </section>}
    {error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p className="font-medium">{rotateWebhookSecret ? pageText("couldNotFinishSecretRotation_dd62e1") : replace ? pageText("couldNotReconnectThisApp_03559b") : pageText("couldNotReconnectTheSavedApp_bc977d")}</p>
      <p className="break-words">{error}</p>
      <p>{rotateWebhookSecret ? pageText("useTheNewestSecretInGitHubAppSettings_8aa5bd") : pageText("tryAgainIfTheServiceIsTemporarilyUnavailable_bbf07e")}</p>
    </div>}
    {reconnect && !rotateWebhookSecret && !credentialFields && <Button variant="link" className="h-auto p-0" disabled={pending} onClick={() => { setReplace(!replace); setError(""); }}>
      {replace ? pageText("useSavedCredentialsInstead_38276b") : pageText("replaceAppCredentials_6cf07a")}
    </Button>}
    {replace && <div className="space-y-6">
      <div className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">{reconnect ? pageText("replaceCredentialsForTheSameApp_f1c8b5") : pageText("connectYourExistingGitHubApp_8f89b2")}</h2>
        <p><a href={gitHubAppSettingsUrl(endpoint)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">{pageText("openGitHubAppSettings_fe0cef")}<ExternalLink className="size-3.5" /></a>{" " + pageText("andChoose_08e049") + " "}<strong>{appName}</strong>.</p>
        <p className="text-muted-foreground">{pageText("ifItSOwnedByAnOrganizationOpen_303ab4")}</p>
        {credentialFields && <p className="text-muted-foreground">{pageText("enterTheRequestedCredentialsBelowOtherSavedCredentials_31937d")}</p>}
      </div>
      {needsPrivateKey && <div className="space-y-2">
        <CredentialLabel id="github-app-id" label={pageText("appID_c88134")} help="The numeric App ID on the GitHub App’s settings page. This is different from its Client ID or installation ID." />
        <p id="github-app-id-help" className="text-sm text-muted-foreground">{pageText("copy_af74f7") + " "}<strong>{pageText("appID_c88134")}</strong>{" " + pageText("fromTheAppSSettingsPage_c81149") + " "}{reconnect && pageText("theSavedIDIsFilledInWhenAvailable_d64b38")}</p>
        <Input id="github-app-id" aria-describedby="github-app-id-help" inputMode="numeric" value={credentials.appId} disabled={pending} aria-invalid={appIdInvalid} onChange={event => setCredentials({ ...credentials, appId: event.target.value })} />
        {appIdInvalid && <p role="alert" className="text-sm text-destructive">{pageText("useTheNumericAppIDNotTheClient_015684")}</p>}
      </div>}
      {needsPrivateKey && <div className="space-y-2">
        <CredentialLabel id="github-private-key" label={pageText("privateKey_7b1acb")} help="Upload the .pem file downloaded from this GitHub App, or paste its entire contents, including the BEGIN and END lines." />
        <ol id="github-private-key-help" className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>{pageText("inTheSameAppSSettingsOpen_1400a0") + " "}<strong>Credentials → Key pairs → New key</strong>{pageText("onTheOlderSettingsPageUse_1725b0") + " "}<strong>Private keys → Generate a private key</strong>.</li>
          <li>{pageText("uploadTheDownloaded_ea2b5c") + " "}<strong>.pem</strong>{" " + pageText("fileBelowOrPasteItsEntireContents_b65a6a")}</li>
        </ol>
        <p className="text-sm text-muted-foreground">{pageText("youCanReuseAPemFileYouAlready_1adec0")}</p>
        <Input type="file" accept=".pem" aria-label={pageText("uploadPrivateKeyPEMFile_17554e")} disabled={pending} onChange={async event => {
          const file = event.target.files?.[0];
          if (!file) return;
          setFileError("");
          try {
            const privateKey = await file.text();
            setCredentials(current => ({ ...current, privateKey }));
            setPrivateKeyDraft("");
          } catch { setFileError(interfaceNotice("interface:couldNotReadThisFileTryAgainOr_31984b")); }
        }} />
        <Input id="github-private-key" type="password" autoComplete="off" placeholder={keyLoaded ? pageText("pasteAReplacementPEMKey_d7d032") : pageText("orPasteTheCompletePEMKey_e741fe")} aria-describedby="github-private-key-help" disabled={pending} value={privateKeyDraft} aria-invalid={keyInvalid}
          onPaste={event => { event.preventDefault(); setCredentials({ ...credentials, privateKey: event.clipboardData.getData("text") }); setPrivateKeyDraft(""); setFileError(""); }}
          onChange={event => { setPrivateKeyDraft(event.target.value); setCredentials({ ...credentials, privateKey: event.target.value }); }} />
        {keyLoaded && <p role="status" className="text-sm">{pageText("privateKeyLoadedPasteOrUploadAnotherKey_aeaf42")}</p>}
        {keyInvalid && <p role="alert" className="text-sm text-destructive">{pageText("useAPEMPrivateKeyIncludingItsBEGIN_5d5be5")}</p>}
        {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
        <a className="inline-flex items-center gap-1 text-sm underline" href="https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps" target="_blank" rel="noreferrer">{pageText("githubSPrivateKeyInstructions_71ff2c")}<ExternalLink className="size-3.5" /></a>
      </div>}
      {needsWebhookSecret && <div className="space-y-2">
        <CredentialLabel id="github-webhook-secret" label={pageText("webhookSecret_ba261e")} help="The secret configured for this App’s webhook. It must match GitHub exactly." />
        <p className="text-sm text-muted-foreground">{pageText("useTheSecretSavedWhenYouConfiguredThis_e8fc7b")}</p>
        <Input id="github-webhook-secret" type="password" autoComplete="off" disabled={pending} value={credentials.webhookSecret} onChange={event => setCredentials({ ...credentials, webhookSecret: event.target.value })} />
      </div>}
      {credentialFields?.includes("clientSecret") && <div className="space-y-2">
        <CredentialLabel id="github-client-secret" label={pageText("clientSecret_4b468e")} help="The client secret for this GitHub App’s user authentication. Leave the saved private key in place." />
        <Input id="github-client-secret" type="password" autoComplete="off" disabled={pending} value={credentials.clientSecret ?? ""} onChange={event => setCredentials({ ...credentials, clientSecret: event.target.value })} />
      </div>}
    </div>}
    <SetupWizardFooter onSaveExit={onExit} disabled={pending}>
      <Button aria-label={actionLabel} disabled={pending || incomplete || rotationUncertain || (rotateWebhookSecret && !rotationSecret && !rotationAlreadyCommitted)} onClick={() => void connect()}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        <span className="sm:hidden" aria-hidden="true">{pending ? pageText("checking_820d60") : reconnect ? pageText("reconnect_6988b1") : pageText("connect_b65463")}</span>
        <span className="hidden sm:inline" aria-hidden="true">{actionLabel}</span>
      </Button>
    </SetupWizardFooter>
  </div>;
}
