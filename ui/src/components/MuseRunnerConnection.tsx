import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { describeError } from "@/api/errors";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { museDetectorCleanupAttestationSchema } from "@paperclipai/shared";
import type { MuseConnection, MusePairing, MuseAttestStopInput, MuseDetectorCleanupAttestationInput } from "@paperclipai/shared";
import { agentsApi } from "@/api/agents";
import { useMuseConnection, useMuseConnectionState } from "@/hooks/useMuseConnection";
import { queryKeys } from "@/lib/queryKeys";
import { formatDateTime } from "@/lib/utils";
import { AgentSetupPrompt } from "./AgentSetupPrompt";
import { MuseConnectionChecks } from "./new-agent/ExternalAgentInviteContent";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export interface MuseConnectionDetailsProps {
  connection: MuseConnection;
  pairing?: MusePairing | null;
  busy?: boolean;
  error?: string;
  offline?: boolean;
  onTest: () => void;
  onRepair: () => void;
  onPause: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onAttest: (input: MuseAttestStopInput) => void;
  onAttestDetectorCleanup?: (input: MuseDetectorCleanupAttestationInput) => void;
}

/** The settings view uses the same connection evidence as the invitation. */
export function MuseConnectionDetails({ connection, pairing, busy, error, offline = false, onTest, onRepair, onPause, onDisconnect, onRefresh, onAttest, onAttestDetectorCleanup }: MuseConnectionDetailsProps) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const b = connection.binding;
  const [attestation, setAttestation] = useState<MuseAttestStopInput | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [detectorSnapshot, setDetectorSnapshot] = useState<Omit<MuseDetectorCleanupAttestationInput, "observation" | "detectorRemoved"> | null>(null);
  const [detectorHookId, setDetectorHookId] = useState("");
  const [observationDigest, setObservationDigest] = useState("");
  const [detectorObservedAt, setDetectorObservedAt] = useState("");
  const detectorObservedAtValid = museDetectorCleanupAttestationSchema.shape.observation.shape.observedAt.safeParse(detectorObservedAt).success;
  const [detectorConfirmed, setDetectorConfirmed] = useState(false);
  const detectorIdentity = JSON.stringify([b?.id, b?.generation, b?.revision, b?.qualification?.id, b?.cleanup.hookScript, b?.cleanup.attestationEligible, offline]);
  useEffect(() => { setDetectorSnapshot(null); setObservationDigest(""); setDetectorObservedAt(""); setDetectorHookId(""); setDetectorConfirmed(false); }, [detectorIdentity]);
  const boundaryIdentity = JSON.stringify(b?.stop.boundary);
  const stopBindingRevision = b?.stop.bindingRevision;
  useEffect(() => { setAttestation(null); setConfirmed(false); }, [boundaryIdentity, stopBindingRevision]);
  const live = !!b && b.status !== "revoked";
  const state = useMuseConnectionState(connection, { offline });
  const testing = state.testing;
  const configure = !offline && connection.enabled && connection.canConfigureConnection && !!connection.publicOrigin;
  const timestamp = (value: string | null) => value ? formatDateTime(value, { includeSeconds: true }) : "Not observed";
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{pageText("museUsesItsOwnToolsAndPermissionsPaperclip_6e200c")}</p>
    {!connection.enabled && <p className="text-sm text-muted-foreground">{pageText("museIsDisabledInExperimentalSettingsConnectionCleanup_390239")}</p>}
    {!connection.publicOrigin && <p className="text-sm text-muted-foreground">{pageText("anAuthenticatedInstanceWithAPublicHTTPSURL_af62e1")}</p>}
    {b && <>
      <MuseConnectionChecks state={state} />
      <dl className="space-y-2 text-xs">
        {[
          ["Last persisted public receiver contact", timestamp(b.lastReceiverContactAt)],
          ["Authenticated worker activity", timestamp(b.lastWorkerActivityAt)],
          ["Last verified reply", timestamp(b.lastVerifiedReplyAt)],
          ["Credential status", b.credentialState],
          ["Refresh credential expires", timestamp(b.refreshExpiresAt)],
          ["Client version", b.clientVersion ?? "Not reported"],
          ["Live assignments", String(b.liveAssignments)],
          ["Uncertain native operations", String(b.uncertainOperations)],
          ["Pending answers", String(b.pendingInputs)],
          ["Usage and cost", "Unavailable"],
        ].map(([label, value]) => <div key={label} className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono">{value}</dd></div>)}
      </dl>
      <p className="text-xs text-muted-foreground">{pageText("receiverContactIsPersistedInBatchesAndMay_a70dd0") + " "}{Math.ceil(b.contactPersistenceLagMs / 1000)}{" " + pageText("secondsPublicReceiverChecksAreUnverifiedOnlyAn_8c2d54")}</p>
      {b.status === "revoked" && <p role="status" className="text-sm text-muted-foreground">{pageText("disconnectedPaperclipCredentialsAndExecutionAuthorityWereRevoked_2321dc")}</p>}
      {(b.cleanup.pending || b.status === "revoked") && <div className="space-y-2 text-sm text-muted-foreground">
        {"detectorRemovalRequested" in b.cleanup && b.cleanup.detectorRemovalRequested === true && !b.cleanup.detectorRemoved && <p>{pageText("detectorRemovalRequestedCompletionIsNotConfirmed_55fe15")}</p>}
        <p>{pageText("detectorRemoval_642566") + " "}{b.cleanup.detectorEvidence?.source === "operator_runtime_attestation" ? pageText("operatorAttested_6234cf") : b.cleanup.detectorRemoved ? pageText("acknowledged_d35cfe") : pageText("notConfirmed_70a41d")}{pageText("workerQuiescence_08bb3c") + " "}{b.cleanup.workerQuiescenceReported ? pageText("reported_6d3551") : pageText("notConfirmed_70a41d")}.</p>
        {b.cleanup.authenticatedAfterRevocation === false && <p>{pageText("afterDisconnectTheReceiverDisablesItselfWhenIt_2bf2de")}</p>}
        {b.cleanup.expiresAt && <p className="text-xs">{pageText("cleanupCapabilityExpires_5bb150") + " "}{formatDateTime(b.cleanup.expiresAt)}.</p>}
        {b.cleanup.detectorEvidence && <p>{pageText("recorded_d5383e") + " "}{timestamp(b.cleanup.detectorEvidence.recordedAt)}: {b.cleanup.detectorEvidence.source === "operator_runtime_attestation" ? pageText("operatorAttestationFromASupportedRuntimeHookListing_bde9e0") : pageText("authenticatedWorkerReport_a407ab")}{pageText("thisIsNotIndependentProviderConfirmation_7f68c5")}</p>}
        {b.cleanup.attestationEligible && onAttestDetectorCleanup && !detectorSnapshot && <Button type="button" variant="outline" disabled={busy || offline} onClick={() => {
          if (!b.cleanup.hookScript) return;
          setDetectorSnapshot({ bindingId: b.id, generation: b.generation, expectedRevision: b.revision, qualificationId: b.qualification?.id ?? null, hookScript: b.cleanup.hookScript });
        }}>{pageText("recordDetectorRemovalObservation_6d2319")}</Button>}
        <p>{pageText("detectorRemovalWorkerStoppingAndSandboxCleanupAre_82eb3c")}</p>
      </div>}
      {b.stop.status !== "none" && <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">{b.stop.status === "operator_attested" ? pageText("youAttestedThatThisAssignmentSMuseWorker_8d0339")
          : b.stop.status === "worker_reported" ? pageText("museReportedThatThisAssignmentSWorkerIs_368436")
          : pageText("paperclipFencedThisAssignmentSAuthorityItsExternal_4f7331")}</p>
        {b.stop.nativeEffectsUnknown && <p role="status" className="text-muted-foreground">{pageText("nativeEffectOutcomesRemainUnknownAndBlockReplacement_6cde08")}</p>}
        {b.stop.boundary && stopBindingRevision == null && b.stop.status !== "operator_attested" && <p role="status" className="text-muted-foreground">{pageText("stopBindingRevisionIsUnavailableRefreshToInspect_7244c3")}</p>}
        {b.stop.boundary && b.stop.status !== "operator_attested" && !attestation && <Button type="button" variant="outline" disabled={busy || stopBindingRevision == null} onClick={() => {
          if (!b.stop.boundary || stopBindingRevision == null) return;
          setAttestation({ boundary: { ...b.stop.boundary }, expectedRevision: stopBindingRevision, workerStopped: true }); setConfirmed(false);
        }}>{pageText("attestThisWorkerStopped_598fcc")}</Button>}
      </div>}
    </>}
    {detectorSnapshot && <section aria-label={pageText("recordExactMuseDetectorRemoval_001605")} className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">{pageText("recordAnObservationOfThisExactDetector_d550d5")}</p>
      <p className="break-all font-mono text-xs">{detectorSnapshot.hookScript}</p>
      <p className="text-sm text-muted-foreground">{pageText("useMuseSSupported_97f247") + " "}<code>{"hooks.list({ include_disabled: true })"}</code>{" " + pageText("afterRevocationToVerifyThisExactRegisteredScript_d0dbe7")}</p>
      <label className="block space-y-2 text-sm">{pageText("registeredHookID_90c1ba")}<Input aria-label={pageText("registeredMuseHookID_a6eea3")} value={detectorHookId} onChange={event => { setDetectorHookId(event.target.value); setDetectorConfirmed(false); }} autoComplete="off" /></label>
      <label className="block space-y-2 text-sm">{pageText("observationSHA256_8630a0")}<Input aria-label={pageText("detectorRemovalObservationSHA256_6f80f9")} value={observationDigest} onChange={event => { setObservationDigest(event.target.value); setDetectorConfirmed(false); }} autoComplete="off" /></label>
      <p className="text-xs text-muted-foreground">{pageText("useTheDigestOfTheSecretFreeRuntime_451853")}</p>
      <label className="block space-y-2 text-sm">{pageText("observedAtUTC_141398")}<Input aria-label={pageText("detectorRemovalObservedAtUTC_069711")} value={detectorObservedAt} onChange={event => { setDetectorObservedAt(event.target.value); setDetectorConfirmed(false); }} placeholder="YYYY-MM-DDTHH:mm:ss.sssZ" autoComplete="off" /></label>
      <p className="text-xs text-muted-foreground">{pageText("enterTheActualRuntimeListingTimeNotThe_2a26df")}</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={detectorConfirmed} onChange={event => setDetectorConfirmed(event.target.checked)} className="mt-1 accent-primary" /><span>{pageText("iObservedThisExactHookAbsentInThe_8db0fc")}</span></label>
      <div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={() => setDetectorSnapshot(null)}>{translateUi("interfaceCopy.cancel")}</Button><Button type="button" disabled={!detectorConfirmed || !detectorObservedAtValid || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(detectorHookId) || !/^[a-f0-9]{64}$/.test(observationDigest) || busy || offline} onClick={() => onAttestDetectorCleanup?.({ ...detectorSnapshot, detectorRemoved: true, observation: { method: "hooks.list", includeDisabled: true, hookId: detectorHookId, outcome: "exact_hook_absent", observedAt: detectorObservedAt, sha256: observationDigest } })}>{pageText("confirmDetectorObservation_0fd231")}</Button></div>
    </section>}
    {attestation && <section aria-label={pageText("attestThisMuseWorkerStopped_b720e0")} className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">{pageText("confirmTheWorkerForThisExactAssignmentStopped_14f112")}</p>
      <dl className="space-y-2 text-xs">
        {Object.entries(attestation.boundary).map(([key, value]) => <div key={key} className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-muted-foreground">{key}</dt><dd className="break-all font-mono">{value === null ? pageText("none_6eef66") : String(value)}</dd></div>)}
      </dl>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 accent-primary" /><span>{pageText("iHaveStoppedThisMuseWorkerForThe_968fb4")}</span></label>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setAttestation(null)}>{translateUi("interfaceCopy.cancel")}</Button>
        <Button type="button" disabled={!confirmed || busy} onClick={() => onAttest(attestation)}>{pageText("confirmWorkerStopped_1776e4")}</Button>
      </div>
    </section>}
    {pairing && !b?.paired && <div className="space-y-2">
      <AgentSetupPrompt key={pairing.bindingId + pairing.revision} prompt={pairing.setupInstruction} label={pageText("copySetupPrompt_c42e18")} title={pageText("connectYourMuse_3b7583")} agent={{ name: "Muse", icon: <Bot className="size-5" /> }} description={pageText("pasteIntoYourCurrentMuseConversationCompleteConnect_6944e8")} />
      <p className="text-xs text-muted-foreground">{pageText("oneUseSetupExpires_a250cb") + " "}{formatDateTime(pairing.expiresAt)}{pageText("museKeepsTheConnectionCredentialInItsSecure_7183d4")}</p>
    </div>}
    <div className="flex flex-wrap items-center gap-2">
      {live && <Button type="button" variant="outline" disabled={!configure || b.credentialState !== "active" || !b.paired || busy || testing} onClick={onTest}>{testing ? pageText("testingBackgroundReply_671722") : pageText("testBackgroundReply_66e9f8")}</Button>}
      <Button type="button" variant="outline" disabled={!configure || busy} onClick={onRepair}>{b?.credentialState === "expired" ? pageText("reconnectMuse_574943") : live ? pageText("repairConnection_3de121") : pageText("connectMuse_589e84")}</Button>
      {connection.agentStatus !== "paused" && connection.agentStatus !== "terminated" && <Button type="button" variant="outline" disabled={busy} onClick={onPause}>{pageText("pauseAgent_896172")}</Button>}
      {live && <Button type="button" variant="outline" disabled={busy} onClick={onDisconnect}>{pageText("disconnect_ed28e0")}</Button>}
      <Button type="button" variant="ghost" disabled={busy} onClick={onRefresh}>{translateUi("interfaceCopy.refresh")}</Button>
      <Button type="button" asChild variant="ghost"><a href="https://muse.ai" target="_blank" rel="noopener noreferrer">{pageText("openMuse_ddc100")}</a></Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}

export function MuseRunnerConnection({ companyId, agentId }: { companyId?: string; agentId?: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const cache = useQueryClient();
  const muse = useMuseConnection(companyId, agentId);
  const pause = useMutation({ mutationFn: () => agentsApi.pause(agentId!, companyId), onSuccess: () => {
    void muse.refresh(); void cache.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId!) });
    if (companyId) void cache.invalidateQueries({ queryKey: queryKeys.agents.list(companyId) });
  } });
  if (!agentId) return <p className="text-sm text-muted-foreground">{pageText("saveTheAgentThenConnectYourPersonalMuse_a94b0a")}</p>;
  const error = muse.state.error ?? muse.pair.error ?? muse.verify.error ?? muse.revoke.error ?? muse.attest.error ?? muse.attestDetector.error ?? pause.error;
  if (muse.identity.failed) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">{pageText("unableToConfirmYourAccountRefreshToInspect_772270")}</p><Button type="button" variant="outline" onClick={() => { void cache.invalidateQueries({ queryKey: queryKeys.auth.session }); }}>{translateUi("interfaceCopy.refresh")}</Button></div>;
  if (!muse.state.data) return <div className="space-y-3"><p role="status" className="text-sm text-muted-foreground">{muse.state.error ? pageText("unableToLoadTheMuseConnection_38a57b") : pageText("loadingMuseConnection_a4c99a")}</p>{error && <p role="alert" className="text-sm text-destructive">{describeError(error).body}</p>}<Button type="button" variant="outline" onClick={() => { void muse.state.refetch(); }}>{translateUi("interfaceCopy.refresh")}</Button></div>;
  return <MuseConnectionDetails key={muse.identity.userId} connection={muse.state.data} pairing={muse.pairing} offline={muse.state.isError}
    busy={muse.pair.isPending || muse.verify.isPending || muse.revoke.isPending || muse.attest.isPending || muse.attestDetector.isPending || pause.isPending}
    error={error ? describeError(error).body : undefined} onTest={() => { if (muse.binding) muse.verify.mutate(muse.binding); }} onRepair={muse.repair}
    onPause={() => pause.mutate()} onDisconnect={() => { if (muse.binding) muse.revoke.mutate(muse.binding); }}
    onRefresh={() => { void muse.state.refetch(); }} onAttest={input => muse.attest.mutate(input)} onAttestDetectorCleanup={input => muse.attestDetector.mutate(input)} />;
}
