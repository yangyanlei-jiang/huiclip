import { useTranslation as usePageTranslation } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DECISION_MODELS, type DecisionConnectionChoice, type DecisionModelSettings, type DecisionProvider, type DecisionResult, type UpdateDecisionModel } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { decisionModelsApi } from "@/api/decision-models";
import { describeError } from "@/api/errors";
import { QueryErrorState, QueryPlaceholder, useQueryView } from "@/components/QueryView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ToggleField } from "@/components/agent-config-primitives";
import { ConnectionChoiceList } from "@/features/connections/ConnectionChoiceList";
import { ConnectionSetupFlow } from "@/features/connections/ConnectionSetupFlow";
import { AppLogo } from "@/pages/apps/AppLogo";

const failureMessages: Record<string, string> = {
  not_configured: "Choose and save a connection first.", disabled: "Enable and save decisions before running a test.",
  connection_unavailable: "The connection is unavailable. Reconnect it and try again.",
  access_denied: "This connection is not shared with you. Review its permissions.",
  incompatible_connection: "Choose a supported OpenAI or OpenRouter API connection.",
  budget_blocked: "The company or task budget prevents this request. Review Costs and Budgets.",
  provider_auth_failed: "The provider rejected the connection. Reconnect it and try again.",
  provider_rate_limited: "The provider is rate limited. Try again later.",
  timeout: "The provider did not respond in time. Billing is unresolved; review Costs.",
  refused: "The model declined the test. Review the connection and try again.",
};
export function DecisionModelSettingsView({ settings, choices, saving, testing, error, result, newlyConnectedId, onSave, onTest, onAdd }: {
  settings: DecisionModelSettings; choices: DecisionConnectionChoice[]; saving?: boolean; testing?: boolean;
  error?: string | null; result?: DecisionResult | null; newlyConnectedId?: string | null;
  onSave: (value: UpdateDecisionModel) => void; onTest: () => void; onAdd: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const [draft, setDraft] = useState<Required<UpdateDecisionModel>>(settings);
  const appliedConnection = useRef<string | null>(null);
  useEffect(() => { setDraft(settings); }, [settings.companyId, settings.connectionId, settings.grantId, settings.enabled, settings.allowBackground]);
  useEffect(() => {
    if (!newlyConnectedId) { appliedConnection.current = null; return; }
    if (appliedConnection.current === newlyConnectedId) return;
    const connection = choices.find(row => row.id === newlyConnectedId);
    if (connection) {
      appliedConnection.current = newlyConnectedId;
      setDraft(value => ({ ...value, connectionId: connection.id, grantId: connection.grantId, enabled: value.connectionId ? value.enabled : true }));
    }
  }, [newlyConnectedId, choices]);
  const selected = choices.find(row => row.grantId === draft.grantId);
  const dirty = draft.enabled !== settings.enabled || draft.allowBackground !== settings.allowBackground || draft.grantId !== settings.grantId;
  const unavailable = result && result.status !== "succeeded" ? failureMessages[result.status === "unavailable" ? result.reason : result.errorCode] ?? "The decision could not be completed. Review its entry in Costs." : null;
  return <section aria-labelledby="decision-model-heading" className="max-w-2xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="decision-model-heading" className="text-lg font-semibold">{pageText("decisionModel_3999c3")}</h2>
      <Link to="/activity/costs?tab=decisions" className="text-sm underline underline-offset-4">{pageText("viewUsage_972c8f")}</Link>
    </div>
    <p className="text-sm text-muted-foreground">{pageText("chooseTheSharedConnectionPaperclipUsesForOptional_813184")}</p>
    <ConnectionChoiceList selectedId={draft.grantId ?? undefined} disabled={saving || testing}
      choices={choices.map(row => ({ id: row.grantId, name: row.name,
        description: `${row.decisionModel} · ${row.status === "connected" ? "Connected" : "Needs attention"}`,
        icon: <AppLogo name={row.provider === "openai" ? "OpenAI" : "OpenRouter"} brandKey={row.provider} size={24} />,
      }))}
      onSelect={grantId => { const row = choices.find(choice => choice.grantId === grantId)!; setDraft(value => ({ ...value, connectionId: row.id, grantId, enabled: value.connectionId ? value.enabled : true })); }} />
    {choices.length === 0 && <p className="text-sm text-muted-foreground">{pageText("addASharedOpenAIOrOpenRouterAPIConnection_433ce0")}</p>}
    {draft.connectionId && !selected && <p role="status" className="text-sm text-muted-foreground">{pageText("theSavedConnectionIsUnavailableToYouDisable_a9eca5")}</p>}
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" onClick={onAdd} disabled={saving || testing}>{pageText("addConnection_a9c253")}</Button>
      {selected && <Link to={`/apps/${selected.id}/permissions`} className="text-sm underline underline-offset-4">{selected.status === "connected" ? pageText("manageConnection_3ca479") : pageText("reconnectConnection_4c1ebb")}</Link>}
    </div>
    {draft.connectionId && <fieldset disabled={saving || testing} className="space-y-4">
      <ToggleField label={pageText("enableDecisions_65be0c")} checked={draft.enabled} onChange={enabled => setDraft(value => ({ ...value, enabled }))} />
      <div className="space-y-2">
        <ToggleField label={pageText("allowCompanySponsoredBackgroundDecisions_7f7c15")} checked={draft.allowBackground} onChange={allowBackground => setDraft(value => ({ ...value, allowBackground }))} />
        <p className="text-xs text-muted-foreground">{pageText("backgroundFeaturesCanChargeThisConnectionWithoutA_65d914")}</p>
      </div>
    </fieldset>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!dirty && unavailable && <p role="alert" className="text-sm text-destructive">{unavailable}</p>}
    {!dirty && result?.status === "succeeded" && <div role="status" className="space-y-2 text-sm">
      <p className="font-medium">{pageText("decisionModelIsWorking_c08229")}</p>
      <dl className="grid grid-cols-2 gap-2">{Object.entries(result.answers).map(([name, answer]) => <div key={name}>
        <dt className="text-muted-foreground">{name === "billing" ? pageText("billingProblem_c6c2e7") : name === "team" ? pageText("assignedTeam_9336cd") : pageText("disruptionScore_d7eef2")}</dt>
        <dd className="font-mono">{answer.type === "boolean" ? `${Math.round(answer.probability * 100)}%` : answer.type === "choice" ? answer.choice : `${answer.score.toFixed(2)} / 2`}</dd>
      </div>)}</dl>
      <p className="text-xs text-muted-foreground">{pageText("usageWasRecordedTestAnswersAreNotSaved_5bfc5a")}</p>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <Button variant="outline" size="sm" disabled={!settings.enabled || dirty || saving || testing || selected?.status !== "connected"} onClick={onTest}>{testing ? pageText("runningTest_e1424c") : pageText("runTest_6ecaed")}</Button>
        <p className="text-xs text-muted-foreground">{dirty ? pageText("saveChangesBeforeTesting_041f38") : pageText("runsASmallSampleWithAnAPICharge_10de05")}</p>
      </div>
      {dirty && <Button onClick={() => onSave(draft)} disabled={saving || testing || (draft.enabled && selected?.status !== "connected")}>{saving ? pageText("saving_56a228") : pageText("saveDecisionModel_47641f")}</Button>}
    </div>
  </section>;
}

export function DecisionModelSettingsSection({ companyId }: { companyId: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const client = useQueryClient();
  const key = ["decision-model", companyId];
  const query = useQuery({ queryKey: key, queryFn: () => decisionModelsApi.settings(companyId) });
  const view = useQueryView(query);
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState<DecisionProvider | null>(null);
  const [newlyConnectedId, setNewlyConnectedId] = useState<string | null>(null);
  const settingsRevision = JSON.stringify(query.data?.settings ?? { companyId });
  const test = useMutation({ mutationFn: (_revision: string) => decisionModelsApi.test(companyId), onSettled: () => { void client.invalidateQueries({ queryKey: ["decision-history", companyId] }); void client.invalidateQueries({ predicate: q => String(q.queryKey[0]).includes("cost") }); } });
  const resetTest = test.reset;
  useEffect(() => { resetTest(); }, [settingsRevision, resetTest]);
  const save = useMutation({ mutationFn: (settings: UpdateDecisionModel) => decisionModelsApi.update(companyId, settings), onSuccess: settings => {
    setNewlyConnectedId(null); test.reset(); client.setQueryData(key, { ...query.data, settings });
  } });
  // Loaded settings stay on screen through an outage (`stale`); only a real
  // failure with nothing cached shows the error.
  if (view.kind === "loading" || view.kind === "reconnecting") return <QueryPlaceholder size="inline" label={pageText("loadingDecisionModel_16a1f1")} />;
  if (view.kind === "error") return <QueryErrorState size="panel" error={query.error} action="load decision settings" onRetry={view.retry} retrying={view.isFetching} />;
  if (!query.data?.canManage || !query.data.settings) return null;
  const testError = test.variables === settingsRevision ? test.error : null;
  return <>
    <DecisionModelSettingsView settings={query.data.settings} choices={query.data.choices} saving={save.isPending} testing={test.isPending}
      error={save.error ? describeError(save.error).body : testError ? describeError(testError).body : undefined}
      result={test.variables === settingsRevision ? test.data : null} newlyConnectedId={newlyConnectedId}
      onSave={value => save.mutate(value)} onTest={() => test.mutate(settingsRevision)} onAdd={() => { setProvider(null); setAdding(true); }} />
    <Dialog open={adding} onOpenChange={setAdding}>
      <DialogContent className="sm:max-w-2xl max-h-(--sz-85vh) overflow-y-auto">
        <DialogHeader><DialogTitle>{pageText("addADecisionConnection_7c666a")}</DialogTitle><DialogDescription>{pageText("useASharedAPIConnectionForCompanyDecisions_b2c7bf")}</DialogDescription></DialogHeader>
        {provider ? <ConnectionSetupFlow host="dialog" serviceSlug={provider} forceNewConnection
          aiConnection={{ provider, method: "api_key", mode: "shared" }} requiredAiOwnership="shared"
          onCancel={() => setAdding(false)} onComplete={async result => {
            const refreshed = await query.refetch();
            if ("connectionId" in result && result.connectionId && refreshed.data?.choices.some(row => row.id === result.connectionId)) setNewlyConnectedId(result.connectionId);
            setAdding(false);
          }} /> : <ConnectionChoiceList choices={(Object.keys(DECISION_MODELS) as DecisionProvider[]).map(id => ({ id,
            name: id === "openai" ? "OpenAI" : "OpenRouter", description: DECISION_MODELS[id].name,
            icon: <AppLogo name={id === "openai" ? "OpenAI" : "OpenRouter"} brandKey={id} size={24} />,
          }))} onSelect={id => setProvider(id as DecisionProvider)} />}
      </DialogContent>
    </Dialog>
  </>;
}
