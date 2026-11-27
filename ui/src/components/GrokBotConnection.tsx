import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { describeError } from "@/api/errors";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DotPairing } from "@paperclipai/shared";
import { grokBotApi } from "@/api/grokBot";
import { buildGrokAccessPrompt, buildGrokRoutinePrompt } from "@/lib/grok-bot-setup-prompt";
import { AgentSetupPrompt } from "./AgentSetupPrompt";
import { CopyText } from "./CopyText";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { queryKeys } from "@/lib/queryKeys";

/** Configuration writes update the authoritative binding, never an unsaved agent form. */
export function GrokBotConnection({ companyId, agentId }: { companyId?: string; agentId?: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const pairingCodeId = useId();
  const cache = useQueryClient();
  const key = ["grok-binding", companyId, agentId];
  const state = useQuery({ queryKey: key, enabled: !!companyId && !!agentId,
    queryFn: ({ signal }) => grokBotApi.connection(companyId!, agentId!, signal), refetchInterval: 5000 });
  const [pairing, setPairing] = useState<DotPairing | null>(null);
  const [replace, setReplace] = useState(false);
  const [botName, setBotName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookKey, setWebhookKey] = useState("");
  const [inspected, setInspected] = useState(false);
  const verifyRequest = useRef<string | null>(null);
  const binding = state.data?.binding, routine = binding?.routine, exchange = routine?.lastExchange;
  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: key });
    if (companyId && agentId) await cache.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
  };
  const pair = useMutation({ mutationFn: async () => { setPairing(await grokBotApi.pair(companyId!, agentId!, binding?.status === "pairing" ? binding.id : undefined)); }, onSuccess: refresh, gcTime: 0 });
  const configure = useMutation({ mutationFn: async () => {
    await grokBotApi.configure(companyId!, agentId!, { bindingId: binding!.id, expectedRevision: routine?.revision ?? 0, botName, webhookUrl, webhookKey });
    setWebhookUrl(""); setWebhookKey(""); setReplace(false); verifyRequest.current = null;
  }, onSuccess: refresh, gcTime: 0 });
  const verify = useMutation({ mutationFn: async () => {
    if (["rejected", "cancelled"].includes(exchange?.status ?? "")) verifyRequest.current = null;
    verifyRequest.current ??= crypto.randomUUID();
    await grokBotApi.verify(companyId!, agentId!, binding!.id, verifyRequest.current);
  }, onSuccess: refresh, gcTime: 0 });
  const retryDelivery = useMutation({ mutationFn: (correlationId: string) => grokBotApi.retry(companyId!, agentId!, correlationId), onSuccess: refresh });
  const disconnect = useMutation({ mutationFn: () => grokBotApi.disconnect(companyId!, agentId!), onSuccess: async () => { setPairing(null); await refresh(); } });
  const recover = useMutation({ mutationFn: () => grokBotApi.recover(companyId!, agentId!), onSuccess: async () => { setInspected(false); verifyRequest.current = null; await refresh(); } });
  const stop = useMutation({ mutationFn: (runId: string) => grokBotApi.stop(companyId!, agentId!, runId), onSuccess: refresh });
  useEffect(() => { if (routine?.botName) setBotName(routine.botName); }, [routine?.botName]);
  useEffect(() => {
    if (!pairing) return;
    const timer = window.setTimeout(() => setPairing(null), Math.max(0, Date.parse(pairing.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [pairing]);
  if (!agentId) return <p className="text-sm text-muted-foreground">{pageText("saveTheGrokBotAgentBeforeConnectingIt_96df56")}</p>;
  const busy = pair.isPending || configure.isPending || verify.isPending || disconnect.isPending || recover.isPending || stop.isPending || retryDelivery.isPending;
  const error = state.error ?? pair.error ?? configure.error ?? verify.error ?? disconnect.error ?? recover.error ?? stop.error ?? retryDelivery.error;
  const recovering = state.data?.recoveryNeeded || routine?.recoveryNeeded;
  const pending = exchange && ["prepared", "sending", "accepted"].includes(exchange.status) && Date.parse(exchange.expiresAt) > Date.now();
  return <section aria-label={pageText("grokBotConnection_bc925f")} className="space-y-4 text-sm">
    <p className="text-muted-foreground">{pageText("runsInGrokBotTheBotRetainsIts_176f65")}</p>
    {state.isPending && <p role="status">{pageText("loadingConnection_f1e853")}</p>}
    {error && <p role="alert" className="text-destructive">{describeError(error).body}</p>}
    {state.data && !state.data.enabled && <p className="text-muted-foreground">{pageText("enableGrokBotAssistantConnectionsMCPAndPaperclip_691adf")}</p>}
    {binding?.connected ? <>
      <p>{pageText("agentAccessConnected_d78552") + " "}{routine?.verified && !recovering ? pageText("routineRoundTripVerified_0b115c") : pageText("assignmentsRequireAVerifiedRoutineRoundTrip_320553")}</p>
      <dl className="space-y-2 text-muted-foreground"><div><dt>{pageText("bot_3a3192")}</dt><dd>{routine?.botName ?? pageText("notConfigured_811931")}</dd></div><div><dt>{pageText("lastVerifiedExchange_fd4243")}</dt><dd>{routine?.verifiedAt ? new Date(routine.verifiedAt).toLocaleString() : pageText("notYetVerified_a9b0cd")}</dd></div><div><dt>{pageText("lastAuthenticatedContact_9e2c82")}</dt><dd>{routine?.lastContactAt ? new Date(routine.lastContactAt).toLocaleString() : pageText("notYetObserved_a11ecc")}</dd></div></dl>
      {exchange && <p>{pageText("assignmentDelivered_95c046") + " "}{["accepted", "acknowledged"].includes(exchange.status) ? pageText("yes_5397e0") : pageText("unconfirmed_74321f")}{pageText("replyReceived_0ab744") + " "}{exchange.acknowledgedAt ? pageText("yes_5397e0") : pageText("no_816c52")}.</p>}
      {exchange?.status === "rejected" && <div className="space-y-2"><p>{pageText("theRoutineRejectedThisDeliveryCheckTheRoutine_11f1ad")}</p><Button variant="outline" disabled={busy || recovering} onClick={() => retryDelivery.mutate(exchange.id)}>{pageText("retryRejectedDelivery_693664")}</Button></div>}
      {!routine?.configured || replace ? <div className="space-y-3">
        <label className="block space-y-2"><span>{pageText("botNameInGrok_01c6f8")}</span><Input value={botName} onChange={e => setBotName(e.target.value)} maxLength={100} /></label>
        <AgentSetupPrompt prompt={buildGrokRoutinePrompt(binding.id, botName || "your Bot")} label={pageText("copyRoutineInstructions_1181be")} title={pageText("enableAssignments_45d660")} description={pageText("askTheBotForAWebhookURLNavigation_fe6931")} />
        <label className="block space-y-2"><span>{pageText("webhookURL_fa7517")}</span><Input type="password" autoComplete="off" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} /></label>
        <label className="block space-y-2"><span>{pageText("webhookKey_4874a0")}</span><Input type="password" autoComplete="off" value={webhookKey} onChange={e => setWebhookKey(e.target.value)} /></label>
        <Button disabled={busy || recovering || !botName.trim() || !webhookUrl || !webhookKey} onClick={() => configure.mutate()}>{pageText("saveRoutine_9f773c")}</Button>
      </div> : <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !!pending || recovering || !!binding.assignment} onClick={() => verify.mutate()}>{pageText("verifyConnection_a5073d")}</Button>
        <Button variant="outline" disabled={busy || recovering || !!binding.assignment} onClick={() => setReplace(true)}>{pageText("replaceRoutineCredentials_8b8072")}</Button>
      </div>}
    </> : <>
      <Button disabled={busy || !state.data?.enabled || !state.data.canConfigureConnection} onClick={() => pair.mutate()}>{pageText("reconnectAgentAccess_638c51")}</Button>
      {pairing && state.data?.resourceUrl && <>
        <AgentSetupPrompt prompt={buildGrokAccessPrompt(state.data.resourceUrl, botName || "your Bot")} label={pageText("copyConnectionInstructions_8fd7e8")} title={pageText("reconnectGrokBot_1461e8")} description={pageText("completeOAuthInTheBrowserKeepThisCode_adf169")} />
        <div className="space-y-2">
          <label htmlFor={pairingCodeId}>{pageText("oneUsePairingCode_5279ab")}</label>
          <div className="flex items-center gap-2">
            <Input id={pairingCodeId} type="password" autoComplete="off" readOnly value={pairing.pairingCode} onFocus={e => e.target.select()} />
            <CopyText text={pairing.pairingCode} ariaLabel={interfaceNotice("interface:copyPairingCode_d9898e")} className={buttonVariants({ variant: "outline", size: "sm" })}>{pageText("copyCode_6c1069")}</CopyText>
          </div>
          <p className="text-xs text-muted-foreground">{pageText("copyThisCodeIntoPaperclipSAuthorizationPage_525809")}</p>
        </div>
      </>}
    </>}
    {binding?.assignment && <div className="space-y-2"><p>{binding.assignment.status === "offered" ? pageText("awaitingAcknowledgement_c351a0") : pageText("workingInAPaperclipWorkSession_de83c9")}</p><Button variant="outline" disabled={busy} onClick={() => stop.mutate(binding.assignment!.runId)}>{pageText("stopPaperclipWork_9132ce")}</Button><p className="text-xs text-muted-foreground">{pageText("revokesThisSessionSPaperclipAuthorityAndStops_be558c")}</p></div>}
    {recovering && <div className="space-y-3 rounded-md border border-border p-3">
      <p className="font-medium">{pageText("recoveryNeeded_7bdda4")}</p><p className="text-muted-foreground">{pageText("paperclipCannotDetermineWhetherGrokIsStillWorking_0114b3")}</p>
      <label className="flex items-start gap-2"><input type="checkbox" checked={inspected} onChange={e => setInspected(e.target.checked)} /><span>{pageText("iInspectedGrokAndResolvedTheOldWork_2b2cb2")}</span></label>
      <Button variant="outline" disabled={busy || !inspected || !!binding?.assignment} onClick={() => recover.mutate()}>{pageText("clearRecoveryHold_8001f7")}</Button>
      <p className="text-xs text-muted-foreground">{pageText("thisRecordsYourInspectionItDoesNotConfirm_911ed7")}</p>
    </div>}
    {binding?.connected && <Button variant="outline" disabled={busy} onClick={() => disconnect.mutate()}>{pageText("disconnectAgentAccess_8c30a1")}</Button>}
  </section>;
}
