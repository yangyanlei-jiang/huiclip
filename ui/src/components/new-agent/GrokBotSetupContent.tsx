import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useId } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { AGENT_ROLES, type CreateGrokInvitation, type DotPairing, type GrokConnection } from "@paperclipai/shared";
import { AdapterMark } from "../AdapterMark";
import { AgentSetupPrompt } from "../AgentSetupPrompt";
import { Button, buttonVariants } from "../ui/button";
import { CopyText } from "../CopyText";
import { Input } from "../ui/input";
import { NativeSelect } from "../ui/select";
import { DialogDescription, DialogTitle } from "../ui/dialog";
import { buildGrokAccessPrompt, buildGrokRoutinePrompt } from "@/lib/grok-bot-setup-prompt";
import { Link } from "@/lib/router";

export type GrokSetupStep = 0 | 1 | 2 | 3;
export interface GrokBotSetupContentProps {
  step: GrokSetupStep; companyName: string; details: CreateGrokInvitation;
  created: boolean; loading?: boolean; busy?: boolean; error?: string;
  managers: Array<{ id: string; name: string }>;
  connection?: GrokConnection; pairing: DotPairing | null; approvalHref?: string;
  webhookUrl: string; webhookKey: string; editingCredentials?: boolean;
  onEditCredentials?: () => void;
  onDetails: (details: CreateGrokInvitation) => void;
  onCredentials: (url: string, key: string) => void;
  onBack: () => void; onExit: () => void; onNext: () => void; onRetry: () => void;
}
const steps = ["Identify Bot", "Connect access", "Enable assignments", "Verify"];
export function GrokBotSetupContent(p: GrokBotSetupContentProps) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const pairingCodeId = useId();
  const binding = p.connection?.binding;
  const routine = binding?.routine;
  const exchange = routine?.lastExchange;
  const delivered = exchange?.status === "accepted" || exchange?.status === "acknowledged";
  const replied = !!routine?.verified && exchange?.status === "acknowledged";
  const ready = replied && p.connection?.agentLifecycleState === "ready" && !!p.connection.canConfigureConnection && !routine?.recoveryNeeded;
  const pending = exchange && ["prepared", "sending", "accepted"].includes(exchange.status) && Date.parse(exchange.expiresAt) > Date.now();
  const nextDisabled = p.busy || p.loading || !!p.approvalHref
    || p.step === 0 && (!p.details.name.trim() || !p.details.botName.trim())
    || p.step === 1 && !binding?.connected
    || p.step === 2 && ((!routine?.configured || p.editingCredentials) && (!p.webhookUrl || !p.webhookKey))
    || p.step === 3 && !ready && (!!pending || !!routine?.recoveryNeeded || !!replied);
  return <>
    <div className="min-h-0 space-y-6 overflow-y-auto px-6 pb-6 pt-8 sm:px-8">
      <div className="space-y-3 pr-5">
        <AdapterMark type="grok_bot" className="size-10" />
        <DialogTitle className="text-xl font-semibold tracking-tight">{ready ? pageText("yourGrokBotIsConnected_f11c82") : pageText("connectYourGrokBot_c5cbfe")}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed">{ready ? `${p.details.botName} can receive assignments and work with ${p.companyName}.` : `Bring an existing Bot into ${p.companyName}. It continues to run in Grok Bot.`}</DialogDescription>
      </div>
      <ol aria-label={pageText("grokBotSetup_9094d2")} className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        {steps.map((label, index) => <li key={label} aria-current={p.step === index ? "step" : undefined} className={p.step === index ? "font-medium text-foreground" : ""}>{index + 1}. {label}</li>)}
      </ol>
      {p.error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{p.error}</p><Button variant="outline" disabled={p.busy} onClick={p.onRetry}>{translateUi("interfaceCopy.tryAgain")}</Button></div>}
      {p.loading ? <p role="status" className="text-sm text-muted-foreground">{pageText("restoringSavedSetup_833329")}</p> : p.approvalHref ? <p className="text-sm text-muted-foreground">{pageText("anOrganizationAdminNeedsToApproveThisAgent_eea6d6")}</p> : <>
        {p.step === 0 && <div className="space-y-4">
          <label className="block space-y-2 text-sm"><span>{pageText("paperclipName_33d056")}</span><Input value={p.details.name} disabled={p.created} onChange={e => p.onDetails({ ...p.details, name: e.target.value })} autoComplete="off" maxLength={100} /></label>
          <label className="block space-y-2 text-sm"><span>{pageText("botNameInGrok_01c6f8")}</span><Input value={p.details.botName} disabled={p.created} onChange={e => p.onDetails({ ...p.details, botName: e.target.value })} autoComplete="off" maxLength={100} /></label>
          <p className="text-xs text-muted-foreground">{pageText("useTheNameShownInTheGrokBot_e6cade")}</p>
          <label className="block space-y-2 text-sm"><span>{translateUi("interfaceCopy.role")}</span><NativeSelect disabled={p.created} value={p.details.role ?? "general"} onChange={e => p.onDetails({ ...p.details, role: e.target.value as CreateGrokInvitation["role"] })}>{AGENT_ROLES.map(role => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</NativeSelect></label>
          <label className="block space-y-2 text-sm"><span>{pageText("manager_babe30")}</span><NativeSelect disabled={p.created} value={p.details.reportsTo ?? ""} onChange={e => p.onDetails({ ...p.details, reportsTo: e.target.value || null })}><option value="">{pageText("noManager_448906")}</option>{p.managers.map(manager => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</NativeSelect></label>
        </div>}
        {p.step === 1 && <div className="space-y-4 text-sm">
          <p>{pageText("copyTheConnectionInstructionsIntoYourBotS_cc927c")}</p>
          {p.connection?.resourceUrl && <AgentSetupPrompt prompt={buildGrokAccessPrompt(p.connection.resourceUrl, p.details.botName)} label={pageText("copyConnectionInstructions_8fd7e8")} title={pageText("connectPaperclipAccess_a6468f")} description={pageText("sendTheseInstructionsToYourBotThePairing_8f795a")} />}
          {!binding?.connected && p.pairing && <div className="space-y-2">
            <label htmlFor={pairingCodeId}>{pageText("oneUsePairingCode_5279ab")}</label>
            <div className="flex items-center gap-2">
              <Input id={pairingCodeId} value={p.pairing.pairingCode} readOnly type="password" autoComplete="off" />
              <CopyText text={p.pairing.pairingCode} ariaLabel={interfaceNotice("interface:copyPairingCode_d9898e")} className={buttonVariants({ variant: "outline", size: "sm" })}>{pageText("copyCode_6c1069")}</CopyText>
            </div>
            <p className="text-xs text-muted-foreground">{pageText("copyThisCodeIntoPaperclipSAuthorizationPage_d19f59") + " "}{new Date(p.pairing.expiresAt).toLocaleTimeString()}.</p>
          </div>}
          <p role="status" aria-live="polite" className="text-muted-foreground">{binding?.connected ? pageText("agentAccessConnected_d78552") : pageText("watchingForAuthorizationThisConnectionWorksAsThe_a024c9")}</p>
          <p className="text-xs text-muted-foreground">{pageText("grokPluginsAreAccountWideLinkingOneBot_aa6cb3")}</p>
        </div>}
        {p.step === 2 && <div className="space-y-4 text-sm">
          <p>{pageText("askYourBotToCreateAWebhookOnly_3c61a2")}</p>
          {binding && <AgentSetupPrompt prompt={buildGrokRoutinePrompt(binding.id, p.details.botName)} label={pageText("copyRoutineInstructions_1181be")} title={pageText("enableAssignments_45d660")} description={pageText("sendThisToTheConnectedBotTheRoutine_21975c")} />}
          <p className="text-xs text-muted-foreground">{pageText("ifClickingTheRoutineDoesNothingUseThe_44f0f9")}</p>
          {routine?.configured && !p.editingCredentials && !p.webhookUrl && !p.webhookKey ? <div className="space-y-2"><p role="status" className="text-muted-foreground">{pageText("routineCredentialsAreStoredContinueToVerifyBoth_5f3785")}</p>{p.onEditCredentials && <Button variant="outline" onClick={p.onEditCredentials} disabled={p.busy}>{pageText("replaceRoutineCredentials_8b8072")}</Button>}</div> : <>
            <label className="block space-y-2"><span>{pageText("webhookURL_fa7517")}</span><Input value={p.webhookUrl} onChange={e => p.onCredentials(e.target.value, p.webhookKey)} type="password" autoComplete="off" spellCheck={false} /></label>
            <label className="block space-y-2"><span>{pageText("webhookKey_4874a0")}</span><Input value={p.webhookKey} onChange={e => p.onCredentials(p.webhookUrl, e.target.value)} type="password" autoComplete="off" spellCheck={false} /></label>
          </>}
          <p className="text-xs text-muted-foreground">{pageText("copyTheseFieldsDirectlyFromGrokIntoPaperclip_c1e649")}</p>
        </div>}
        {p.step === 3 && <section aria-label={pageText("grokConnectionChecks_3e3954")} className="space-y-4 text-sm">
          {[{ label: "Assignment delivered", done: delivered }, { label: "Reply received", done: replied }].map(check => <p key={check.label} className="flex items-center gap-3">{check.done ? <Check className="size-4" /> : pending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Circle className="size-4 text-muted-foreground" />}{check.label}<span className="text-muted-foreground">{check.done ? pageText("complete_1f5a1a") : pageText("waiting_33d306")}</span></p>)}
          <p role="status" aria-live="polite" className="text-muted-foreground">{routine?.recoveryNeeded ? pageText("recoveryNeededInspectGrokSActivityInThis_0dde28") : ready ? pageText("bothDirectionsVerifiedYourBotIsReadyFor_499a91") : replied ? pageText("bothDirectionsVerifiedPaperclipIsFinishingAgentSetup_47708d") : exchange?.status === "rejected" ? pageText("theRoutineRejectedDeliveryCheckItsURLAnd_3824fd") : delivered ? pageText("theRoutineAcceptedDeliveryWaitingForAnAuthenticated_02ef88") : pageText("sendAHarmlessChallengeThisCreatesNoTask_7ddf6a")}</p>
          <p className="text-xs text-muted-foreground">{pageText("grokRunsExternallyUsageAndSpendingAreNot_2e5d77")}</p>
        </section>}
      </>}
    </div>
    <div className="flex items-center justify-between gap-3 border-t px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2"><Button variant="ghost" onClick={p.onBack} disabled={p.busy}>{translateUi("interfaceCopy.back")}</Button><Button variant="ghost" onClick={p.onExit} disabled={p.busy}>{pageText("saveExit_fc5599")}</Button></div>
      {p.approvalHref ? <Button asChild><Link to={p.approvalHref} onClick={p.onExit}>{pageText("reviewApproval_2ee792")}</Link></Button> : <Button onClick={p.onNext} disabled={nextDisabled}>{p.busy ? pageText("saving_56a228") : ready ? pageText("done_e9b450") : p.step === 3 ? pending ? pageText("waitingForReply_2d7568") : replied ? pageText("finishingSetup_0744df") : pageText("verifyConnection_a5073d") : pageText("continue_2e0262")}</Button>}
    </div>
  </>;
}
