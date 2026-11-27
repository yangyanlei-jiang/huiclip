import { optionLabel } from "@/i18n/option-label";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useId } from "react";
import { AGENT_ROLES, AGENT_ROLE_LABELS } from "@paperclipai/shared";
import type { MuseInvitationDraft } from "@/lib/muse-invitation-draft";
import { Input } from "../ui/input";
import { Link } from "@/lib/router";
import { ArrowLeft, Bot, Check, Circle, CircleAlert, Loader2 } from "lucide-react";
import { AdapterMark } from "../AdapterMark";
import { AgentSetupPrompt } from "../AgentSetupPrompt";
import { Button } from "../ui/button";
import { DialogDescription, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";

export type ExternalAgentPreset = "dot" | "grok_bot" | "muse" | "hermes" | "other";
export type DotConnectionState = {
  phase: "waiting" | "connected" | "subscribed" | "testing" | "finishing" | "ready";
  problem?: "event_timeout" | "prompt_unavailable" | "offline" | "agent_unavailable";
};

const presets = [
  { id: "dot", name: "Dot", adapter: "openai_dot", description: "Your Dot in ChatGPT" },
  { id: "grok_bot", name: "Grok Bot", adapter: "grok_bot", description: "An existing Bot in Grok" },
  { id: "muse", name: "Muse — Personal agent", adapter: "muse", description: "Your personal Muse at muse.ai" },
  { id: "hermes", name: "Hermes", adapter: "hermes_gateway", description: "An existing Hermes agent" },
  { id: "other", name: "Other", adapter: "http", description: "Any agent that can connect to Paperclip" },
] as const;

export function ExternalAgentPresetPicker({ onSelect, dotDisabledReason, grokDisabledReason, museEnabled = false }: { onSelect: (preset: ExternalAgentPreset) => void; dotDisabledReason?: string; grokDisabledReason?: string; museEnabled?: boolean }) {
  return <div className={cn("grid grid-cols-2 gap-3", !museEnabled && "sm:grid-cols-4")}>
    {presets.filter(preset => preset.id !== "muse" || museEnabled).map(preset => <button
      key={preset.id}
      type="button"
      onClick={() => onSelect(preset.id)}
      disabled={preset.id === "dot" && !!dotDisabledReason || preset.id === "grok_bot" && !!grokDisabledReason}
      title={preset.id === "dot" ? dotDisabledReason : preset.id === "grok_bot" ? grokDisabledReason : undefined}
      className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-3 py-4 text-center transition-colors disabled:opacity-50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <AdapterMark type={preset.adapter} className="size-8" />
      <span className="text-sm font-medium">{preset.name}</span>
      <span className="sr-only">{preset.description}</span>
    </button>)}
  </div>;
}

const checks = [
  { title: "Connected to Paperclip", description: "Your Dot has connected to this agent." },
  { title: "Task updates enabled", description: "Your Dot is subscribed to new assignments and messages." },
  { title: "Test event confirmed", description: "Your Dot received our test and replied to Paperclip." },
];

/** Controlled by server evidence in the invite controller, never by copying a prompt. */
export function DotConnectionChecks({ state }: { state: DotConnectionState }) {
  const { t: pageText } = usePageTranslation("interface");
  const completed = { waiting: 0, connected: 1, subscribed: 2, testing: 2, finishing: 3, ready: 3 }[state.phase];
  const message = state.problem === "agent_unavailable" ? "Connection checks passed, but this agent cannot receive tasks. Resolve the agent’s setup blocker in Paperclip."
    : state.problem === "offline" ? "Connection updates paused. Reconnect to check the latest status."
    : state.problem === "prompt_unavailable" ? "This setup prompt was replaced in another window. Create a fresh prompt to continue."
    : state.problem === "event_timeout" ? "Your Dot connected, but hasn’t confirmed the test event. Ask it to check Paperclip, then retry."
    : state.phase === "finishing" ? "Your Dot confirmed the test event. Paperclip is finishing agent setup."
    : state.phase === "ready" ? "Your Dot is ready for tasks. Messages can travel both ways."
    : state.phase === "waiting" ? "Watching for your Dot. Updates will appear here automatically."
    : state.phase === "connected" ? "Your Dot connected. Waiting for it to enable task updates."
    : "Waiting for your Dot to confirm a test event. No task will be created.";
  return <section aria-label={pageText("dotConnectionChecks_f4c409")} className="space-y-4">
    <ol className="space-y-4">
      {checks.map((check, index) => {
        const done = index < completed;
        const failed = index === completed && state.problem === "event_timeout";
        const active = index === completed && !state.problem;
        const Icon = done ? Check : failed ? CircleAlert : active ? Loader2 : Circle;
        return <li key={check.title} className="flex items-start gap-3" aria-current={active ? "step" : undefined}>
          <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", done ? "bg-accent text-foreground" : failed ? "text-destructive" : "text-muted-foreground")}>
            <Icon className={cn("size-4", active && "animate-spin motion-reduce:animate-none")} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={cn("text-sm", done || active || failed ? "font-medium" : "text-muted-foreground")}>
              {check.title}<span className="sr-only">{done ? pageText("complete_6fbfa0") : failed ? pageText("needsAttention_964919") : active ? pageText("inProgress_2dbeb6") : pageText("waiting_86114e")}</span>
            </p>
            {done && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{check.description}</p>}
          </div>
        </li>;
      })}
    </ol>
    <p role={state.problem && state.problem !== "prompt_unavailable" ? "alert" : "status"} aria-live="polite" className={cn("text-sm leading-relaxed", state.problem && state.problem !== "prompt_unavailable" ? "text-destructive" : "text-muted-foreground")}>{message}</p>
  </section>;
}

export type MuseConnectionState = {
  paired: boolean;
  receiverDetected: boolean;
  backgroundReplyVerified: boolean;
  ready: boolean;
  finishing?: boolean;
  testing?: boolean;
  problem?: "no_recent_response" | "prompt_unavailable" | "offline" | "agent_unavailable" | "disconnected" | "disabled" | "connection_expired";
};

/** Receiver contact is separate from an authenticated, independent worker reply. */
export function MuseConnectionChecks({ state }: { state: MuseConnectionState }) {
  const { t: pageText } = usePageTranslation("interface");
  const milestones = [
    { title: "Paired with Paperclip", done: state.paired, description: "Paperclip authorized the scoped Muse agent connection." },
    { title: "Receiver detected", done: state.receiverDetected, description: "Paperclip observed a public receiver check. Only an authenticated reply confirms Muse can work." },
    { title: "Background reply verified", done: state.backgroundReplyVerified, description: "Muse replied to an independent background test." },
  ];
  const checksPassed = milestones.every(item => item.done);
  const message = state.problem === "offline" ? "Connection updates paused. Refresh to check the latest evidence."
    : state.problem === "disconnected" ? "Disconnected. These are the last observed connection checks. Detector cleanup and worker stop evidence remain separate."
    : state.problem === "connection_expired" ? "This Muse connection expired. Reconnect Muse with a fresh setup prompt. Previous checks do not restore access."
    : state.problem === "disabled" ? "Muse is disabled. These are the last observed connection checks; new work cannot start."
    : state.problem === "prompt_unavailable" ? "This setup prompt was replaced or expired. Create a fresh prompt to continue."
    : state.problem === "agent_unavailable" ? "Connection checks passed. Resolve this agent’s setup or approval blocker before assigning tasks."
    : state.problem === "no_recent_response" ? "No recent response. Open Muse to check the current conversation and hostname permission, then test again. Silence does not identify a permission problem."
    : state.testing ? "Waiting for Muse to reply to the current background test."
    : checksPassed && state.ready ? "Muse is ready for tasks. All connection checks and agent setup passed."
    : checksPassed ? "All connection checks passed. Paperclip is finishing agent setup."
    : !state.paired ? "Watching for Muse to pair. Copy the setup prompt into your current Muse conversation."
    : !state.receiverDetected ? "Muse is paired. Waiting for the first persisted receiver contact."
    : "Receiver detected. Waiting for Muse to reply to the background test.";
  return <section aria-label={pageText("museConnectionChecks_830be3")} className="space-y-4">
    <ol className="space-y-4">
      {milestones.map(item => <li key={item.title} className="flex items-start gap-3">
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", item.done ? "bg-accent text-foreground" : "text-muted-foreground")}>
          {item.done ? <Check className="size-4" /> : <Circle className="size-4" />}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className={cn("text-sm", item.done ? "font-medium" : "text-muted-foreground")}>
            {item.title}<span className="sr-only">{item.done ? pageText("complete_6fbfa0") : pageText("waiting_86114e")}</span>
          </p>
          {item.done && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>}
        </div>
      </li>)}
    </ol>
    <p role="status" aria-live="polite" className="text-sm leading-relaxed text-muted-foreground">{message}</p>
  </section>;
}

/** Shared presentation for the invitation flow. The caller owns invitations and watching. */
export function ExternalAgentInviteContent({
  preset, prompt, companyName, connection, onSelect, onBack, onClose, onCopied, onRetry, onNewPrompt,
  dotDisabledReason, grokDisabledReason, busy = false, error, approvalHref, museEnabled = false, museConnection, museDraft, onMuseDraftChange, onMuseContinue,
}: {
  museEnabled?: boolean;
  museConnection?: MuseConnectionState;
  museDraft?: MuseInvitationDraft;
  onMuseDraftChange?: (draft: MuseInvitationDraft) => void;
  onMuseContinue?: () => void;
  dotDisabledReason?: string;
  grokDisabledReason?: string;
  busy?: boolean;
  error?: string;
  approvalHref?: string;
  preset: ExternalAgentPreset | null;
  prompt: string;
  companyName: string;
  connection: DotConnectionState;
  onSelect: (preset: ExternalAgentPreset) => void;
  onBack: () => void;
  onClose: () => void;
  onCopied: () => void;
  onRetry: () => void;
  onNewPrompt: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const detailsId = useId();
  const muse = preset === "muse";
  const museDetails = muse && !!museDraft;
  const museAwaitingInvitation = muse && !museDetails && !museConnection && !approvalHref;
  const museReady = muse && !!museConnection?.ready && museConnection.paired && museConnection.receiverDetected && museConnection.backgroundReplyVerified && !museConnection.problem && !museConnection.testing;
  const provider = presets.find(item => item.id === preset);
  const dot = preset === "dot";
  const ready = museReady || (dot && connection.phase === "ready" && !connection.problem);
  const connecting = dot && connection.phase !== "waiting";
  const progressLabel = connection.problem === "agent_unavailable" ? "Agent unavailable"
    : connection.problem === "offline" ? "Updates paused"
    : connection.problem === "event_timeout" ? "Needs attention"
    : connection.phase === "finishing" ? "Finishing setup…"
    : connection.phase === "connected" ? "Connecting…" : "Confirming connection…";
  return <>
    <div className="min-h-0 space-y-6 overflow-y-auto px-6 pb-6 pt-8 sm:px-8">
      <div className="space-y-3 pr-5">
        {muse && <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="size-4" />{pageText("back_b52b36")}</Button>}
        {provider && <AdapterMark type={provider.adapter} className="size-10" />}
        <div className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {!provider ? pageText("inviteAnExternalAgent_a382ae") : muse ? ready ? pageText("museIsConnected_775ef8") : museDetails || museAwaitingInvitation ? pageText("inviteYourMuse_66cfde") : pageText("connectYourMuse_3b7583") : dot ? ready ? pageText("yourDotIsConnected_f7120a") : pageText("connectYourDot_d7cfc6") : preset === "hermes" ? pageText("inviteYourHermesAgent_39bcd8") : pageText("inviteYourAgent_b8cc88")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {!provider ? `Bring an agent you already use into ${companyName}.`
              : muse ? museDetails ? `Give your personal Muse a name and role in ${companyName}.`
              : museAwaitingInvitation ? pageText("museRequiresAnAuthenticatedPaperclipInstanceWithA_2fc539")
              : ready ? `Muse can receive assignments and work with ${companyName}.`
              : !prompt && !museConnection?.paired ? pageText("weReCheckingWhetherThisInstanceCanPrepare_437530")
              : pageText("pasteTheSetupPromptIntoYourCurrentMuse_4e4aeb")
              : ready ? `Your Dot can now receive assignments and work with ${companyName}.`
              : connection.problem === "agent_unavailable" ? pageText("yourDotIsConnectedThisAgentMustBe_7c8459")
              : connection.phase === "finishing" ? pageText("yourDotHasConnectedAndConfirmedTaskUpdates_38a423")
              : connecting ? pageText("yourDotHasConnectedWeReCheckingThat_9eb9b4")
              : dot ? pageText("copyTheSetupPromptAndSendItTo_3740a4")
              : `Copy the invitation prompt and send it to your ${preset === "hermes" ? "Hermes " : ""}agent. Approve its join request in Paperclip when it’s ready.`}
          </DialogDescription>
        </div>
      </div>
      {error && <div role="alert" className="space-y-3 text-sm text-destructive"><p>{error}</p>{!museAwaitingInvitation && <Button variant="outline" disabled={busy} onClick={onRetry}>{translateUi("interfaceCopy.tryAgain")}</Button>}</div>}
      {!provider ? <><ExternalAgentPresetPicker onSelect={onSelect} dotDisabledReason={dotDisabledReason} grokDisabledReason={grokDisabledReason} museEnabled={museEnabled} />
        {dotDisabledReason && <p className="text-sm text-muted-foreground">{dotDisabledReason}</p>}{grokDisabledReason && grokDisabledReason !== dotDisabledReason && <p className="text-sm text-muted-foreground">{grokDisabledReason}</p>}</>
        : approvalHref ? <p className="text-sm text-muted-foreground">{pageText("anOrganizationAdminNeedsToApproveThisAgent_a9d4d4") + " "}{muse ? "Muse" : "Dot"}{" " + pageText("canConnectThisPageWillUpdateAfterApproval_b44e4a")}</p>
        : museAwaitingInvitation ? busy ? <p role="status" className="text-sm text-muted-foreground">{pageText("loadingMuseInvitation_824307")}</p> : null
        : muse && busy && !museDetails && !prompt && !museConnection?.paired ? <p role="status" className="text-sm text-muted-foreground">{pageText("loadingMuseSetup_764f09")}</p>
        : museDetails ? <form id={detailsId} className="space-y-4" onSubmit={event => { event.preventDefault(); if (museDraft.name.trim() && !busy) onMuseContinue?.(); }}>
          <div className="space-y-2">
            <label htmlFor={`${detailsId}-name`} className="text-sm font-medium">{translateUi("interfaceCopy.agentName")}</label>
            <Input id={`${detailsId}-name`} disabled={busy} autoFocus maxLength={100} value={museDraft.name} placeholder="Muse" onChange={event => onMuseDraftChange?.({ ...museDraft, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${detailsId}-role`} className="text-sm font-medium">{translateUi("interfaceCopy.role")}</label>
            <select id={`${detailsId}-role`} disabled={busy} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={museDraft.role} onChange={event => {
              const role = AGENT_ROLES.find(value => value === event.target.value);
              if (role) onMuseDraftChange?.({ ...museDraft, role });
            }}>{AGENT_ROLES.map(role => <option key={role} value={role}>{optionLabel(AGENT_ROLE_LABELS[role])}</option>)}</select>
          </div>
          <p className="text-xs text-muted-foreground">{pageText("museUsesItsOwnApprovedToolsProviderUsage_b5c688")}</p>
        </form>
        : muse && museConnection ? <>
          <MuseConnectionChecks state={museConnection} />
          {museConnection.problem === "no_recent_response" && <Button variant="outline" disabled={busy} onClick={onRetry}>{pageText("testBackgroundReply_66e9f8")}</Button>}
          {museConnection.problem === "offline" && <Button variant="outline" disabled={busy} onClick={onRetry}>{pageText("refreshConnection_e26021")}</Button>}
          {!museConnection.paired && <a href="https://muse.ai" target="_blank" rel="noopener noreferrer" className="inline-flex text-sm text-foreground underline underline-offset-4">{pageText("openMuse_ddc100")}</a>}
          <p className="text-xs text-muted-foreground">{pageText("receiverContactIsPersistedInBatchesAndMay_bf9d61")}</p>
        </>
        : busy && !prompt && connection.phase === "waiting" ? <p role="status" className="text-sm text-muted-foreground">{pageText("preparingYourInvitation_8f9820")}</p> : dot ? <>
        <div className="border-t pt-6"><DotConnectionChecks state={connection} />
          {connection.phase === "waiting" && <p className="mt-4 text-xs text-muted-foreground">{pageText("dotUsesYourOpenAIAccountProviderUsageAnd_edf44b")}</p>}</div>
        {connection.problem === "event_timeout" && <Button variant="outline" disabled={busy} onClick={onRetry}>{pageText("retryTestEvent_1b1e79")}</Button>}
        {connection.problem === "offline" && <Button variant="outline" disabled={busy} onClick={onRetry}>{pageText("reconnectUpdates_1b08b5")}</Button>}
      </> : <p className="text-sm leading-relaxed text-muted-foreground">{pageText("theInvitationIncludesEverythingYourAgentNeedsTo_ef66b8") + " "}{companyName}{pageText("youCanReviewItsRequestBeforeGrantingAccess_8d846c")}</p>}
    </div>
    <div className="flex items-center justify-between gap-3 border-t px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={muse ? onClose : provider ? onBack : onClose}>
          {provider && !muse && <ArrowLeft className="size-4" />}{muse ? ready ? pageText("close_bbfa77") : pageText("saveExit_fc5599") : provider ? pageText("back_b52b36") : pageText("cancel_77dfd2")}
        </Button>
      </div>
      {provider && (approvalHref ? <Button asChild><Link to={approvalHref} onClick={onClose}>{pageText("reviewApproval_2ee792")}</Link></Button>
        : museDetails ? <Button type="submit" form={detailsId} disabled={busy || !museDraft.name.trim()}>{busy ? pageText("preparing_0b1d6c") : pageText("continue_2e0262")}</Button>
        : ready ? <Button onClick={onClose}>{translateUi("interfaceCopy.done")}</Button>
        : museAwaitingInvitation ? <Button disabled={busy} onClick={onRetry}>{busy ? pageText("loadingSetup_42e09d") : pageText("refreshSetup_f3964b")}</Button>
        : muse ? museConnection?.problem === "disconnected" || museConnection?.problem === "connection_expired" ? <Button disabled={busy} onClick={onNewPrompt}>{pageText("reconnectMuse_574943")}</Button>
          : museConnection?.problem === "prompt_unavailable" ? <Button disabled={busy} onClick={onNewPrompt}>{pageText("createANewPrompt_fe56a9")}</Button>
          : !museConnection?.paired && prompt ? <AgentSetupPrompt key={prompt} prompt={prompt} label={pageText("copySetupPrompt_c42e18")} title={pageText("connectYourMuse_3b7583")} agent={{ name: "Muse", icon: <Bot className="size-5" /> }} description={pageText("sendThisWholePromptToYourCurrentMuse_2a4160")} align="end" className="min-w-0 shrink" onCopied={onCopied} />
          : busy ? <Button disabled>{pageText("preparing_0b1d6c")}</Button>
          : <Button asChild><a href="https://muse.ai" target="_blank" rel="noopener noreferrer">{pageText("openMuse_ddc100")}</a></Button>
        : connecting ? <Button disabled aria-live="polite">
          {!connection.problem && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {progressLabel}
        </Button>
        : dot && connection.problem === "prompt_unavailable" ? <Button disabled={busy} onClick={onNewPrompt}>{pageText("createANewPrompt_fe56a9")}</Button>
        : !prompt || busy ? <Button disabled>{busy ? pageText("preparing_0b1d6c") : pageText("waitingForDot_e2fea6")}</Button>
        : <AgentSetupPrompt
          key={preset}
          prompt={prompt}
          label={dot ? pageText("copySetupPrompt_c42e18") : pageText("copyInvitationPrompt_6f0c7f")}
          title={dot ? pageText("connectYourDot_d7cfc6") : pageText("inviteYourAgent_b8cc88")}
          description={dot ? pageText("sendThisWholePromptToYourDotIn_477297") : pageText("sendThisWholePromptToYourAgent_8b84b7")}
          agent={dot ? { name: "Dot", src: "/brands/adapters/openai-dot.svg" } : undefined}
          align="end"
          className="min-w-0 shrink"
          onCopied={onCopied}
        />)}
    </div>
  </>;
}
