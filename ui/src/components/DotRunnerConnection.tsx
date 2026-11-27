import { useTranslation as usePageTranslation } from "@/i18n";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { describeError } from "../api/errors";
import { Button } from "./ui/button";
import { buildDotSetupPrompt } from "../lib/dot-setup-prompt";
import { AgentSetupPrompt } from "./AgentSetupPrompt";
import { QueryErrorState, useQueryView } from "./QueryView";

interface Connection {
  enabled: boolean;
  resourceUrl: string | null;
  binding: { id: string; status: string; connected: boolean; subscriptionVerified: boolean; hasPendingChallenge: boolean;
    assignment?: { status: string; attentionRequired: boolean } | null } | null;
}

/** Pairing codes stay in component memory and expire; never save them in config. */
export function DotRunnerConnection({ companyId, agentId, bindingId, onBinding }: {
  companyId?: string; agentId?: string; bindingId?: string; onBinding: (id: string) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const client = useQueryClient();
  const [pairing, setPairing] = useState<{ pairingCode: string; expiresAt: string } | null>(null);
  const path = `/companies/${companyId}/agents/${agentId}/dot-binding`;
  const key = ["dot-binding", companyId, agentId];
  const state = useQuery({ queryKey: key, enabled: !!companyId && !!agentId,
    queryFn: () => api.get<Connection>(path),
    refetchInterval: query => query.state.data?.binding?.status === "pairing" ||
      (query.state.data?.binding?.connected && !query.state.data.binding.subscriptionVerified) ||
      query.state.data?.binding?.hasPendingChallenge || query.state.data?.binding?.assignment ? 5000 : false });
  // Read the connection state through the shared view: cached data stays
  // visible while a transient refetch fails,and a no-data failure shows
  // readable copy with Retry.
  const stateView = useQueryView(state);
  const pair = useMutation({ mutationFn: () => api.post<{ bindingId: string; pairingCode: string; expiresAt: string }>(path, {}),
    onSuccess: result => { setPairing(result); onBinding(result.bindingId); void client.invalidateQueries({ queryKey: key }); } });
  const test = useMutation({ mutationFn: () => api.post(path + "/event-test", {}),
    onSuccess: () => { void client.invalidateQueries({ queryKey: key }); } });
  const revoke = useMutation({ mutationFn: () => api.delete(path),
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<Connection>(key, previous => previous ? { ...previous, binding: null } : previous);
      setPairing(null); onBinding("");
      await client.invalidateQueries({ queryKey: key });
    } });
  useEffect(() => {
    if (!pairing) return;
    const timer = window.setTimeout(() => setPairing(null), Math.max(0, Date.parse(pairing.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [pairing]);
  const existingBindingId = state.data?.binding?.id;
  useEffect(() => {
    if (existingBindingId && existingBindingId !== bindingId && !revoke.isPending) onBinding(existingBindingId);
  }, [existingBindingId, bindingId, onBinding, revoke.isPending]);
  if (!agentId) return <p className="text-sm text-muted-foreground">{pageText("saveTheAgentThenReturnHereToPair_34c9a5")}</p>;
  const mutationError = pair.error ?? test.error ?? revoke.error;
  const b = state.data?.binding;
  const setupPrompt = pairing && state.data?.resourceUrl && companyId && agentId
    ? buildDotSetupPrompt({ companyId, agentId, resourceUrl: state.data.resourceUrl, ...pairing })
    : "";
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">{pageText("dotManagesItsModelAndExternalToolsPaperclip_64ed9e")}</p>
    {state.data && !state.data.enabled && <p className="text-sm text-muted-foreground">{pageText("enableOpenAIDotAndAssistantConnectionsMCPIn_b4d6bb")}</p>}
    {state.data?.resourceUrl && <p className="text-sm break-all">{pageText("privatePluginMCPURL_3c4081") + " "}<code>{state.data.resourceUrl}</code></p>}
    {b && <p className="text-sm">{pageText("connection_eeb478") + " "}{b.status}{pageText("eventSubscription_bd0d85") + " "}{b.subscriptionVerified ? pageText("verified_ec734b") : pageText("required_1a77d4")}.</p>}
    {b?.assignment && <p className="text-sm">{pageText("assignment_fb694c") + " "}{b.assignment.status === "offered" ? pageText("waitingForDotToAccept_f750c4") : pageText("acceptedByDot_6290c2")}.</p>}
    {b?.assignment?.attentionRequired && <p className="text-sm text-destructive" role="alert">{pageText("dotHasNotReportedUsefulActivityFor15_f658ae")}</p>}
    {pairing && setupPrompt && b?.status === "pairing" && <div className="space-y-2">
      <AgentSetupPrompt
        prompt={setupPrompt}
        label={pageText("setUpWithDot_e6ac09")}
        agent={{ name: "Dot", src: "/brands/adapters/openai-dot.svg" }}
        title={pageText("connectYourDot_d7cfc6")}
        description={pageText("pasteIntoYourDotToConnectThisAgent_858acd")}
        side="bottom"
      />
      <p className="text-xs text-muted-foreground">{pageText("setupPromptExpires_348a0f") + " "}{new Date(pairing.expiresAt).toLocaleTimeString()}.</p>
    </div>}
    {!pairing && b?.status === "pairing" && <p className="text-sm text-muted-foreground">{pageText("revokeThePendingConnectionAndPairAgainTo_5b9e17")}</p>}
    <div className="flex flex-wrap items-center gap-2">
      {!b && <Button type="button" variant="outline" disabled={!state.data?.enabled || !state.data?.resourceUrl || pair.isPending} onClick={() => pair.mutate()}>{pageText("pairDot_294790")}</Button>}
      {b?.subscriptionVerified && <Button type="button" variant="outline" disabled={test.isPending || b.hasPendingChallenge} onClick={() => test.mutate()}>{pageText("testEventDelivery_823e32")}</Button>}
      <Button type="button" variant="outline" onClick={() => { void state.refetch(); }}>{pageText("refreshConnection_e26021")}</Button>
      {b && <Button type="button" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate()}>{pageText("revokeConnection_d6f480")}</Button>}
    </div>
    {b?.hasPendingChallenge && <p className="text-sm text-muted-foreground">{pageText("waitingForDotToReadAndConfirmThe_edb996")}</p>}
    {stateView.kind === "error" && (
      <QueryErrorState
        size="inline"
        error={stateView.error}
        action="load the Dot connection"
        onRetry={stateView.retry}
        retrying={stateView.isFetching}
      />
    )}
    {mutationError && <p role="alert" className="text-sm text-destructive">{describeError(mutationError).body}</p>}
  </div>;
}
