import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import type { DecisionHistoryEntry } from "@paperclipai/shared";
import { decisionModelsApi } from "@/api/decision-models";
import { Link } from "@/lib/router";
import { formatDateTime, formatTokens, formatDetailedCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DecisionHistoryTable({ entries, fastResponse = false, fastResponsesEnabled = true }: { entries: (DecisionHistoryEntry & { publicationStatus?: string; connectionName?: string | null })[]; fastResponse?: boolean; fastResponsesEnabled?: boolean }) {
  const { t: pageText } = usePageTranslation("interface");
  if (!entries.length) return <p className="text-sm text-muted-foreground">{fastResponse ? pageText("noFastResponsesInThisPeriod_9daaa4") : pageText("noDecisionRequestsInThisPeriod_cf9704")} <Link to={fastResponse && !fastResponsesEnabled ? "/company/settings/instance/experimental" : "/company/settings/connections"} className="underline underline-offset-4">{fastResponse ? fastResponsesEnabled ? pageText("configureFastResponse_ace284") : pageText("enableExperimentalFastResponses_a00490") : pageText("configureADecisionModel_885719")}</Link>{" " + pageText("toRunATest_fbf275")}</p>;
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">{pageText("recentRequestsInputsAreNotRetained_85a51b")}</p>
    <div className="overflow-x-auto"><table className="w-full text-sm" aria-label={fastResponse ? pageText("fastResponses_9fa5be") : pageText("decisionRequests_1a0854")}>
      <thead><tr className="border-b border-border text-muted-foreground">{["When / feature", "Responsible", "Task", ...(fastResponse ? ["Connection"] : []), "Model", "Status", "Duration", "Tokens in / out", "Cost"].map(label => <th key={label} className="px-3 py-2 text-left font-medium">{label}</th>)}</tr></thead>
      <tbody>{entries.map(row => <tr key={row.id} className="border-b border-border last:border-0">
        <td className="px-3 py-3"><div className="whitespace-nowrap">{formatDateTime(row.startedAt)}</div><div className="text-xs text-muted-foreground">{row.feature === "settings.test" ? pageText("setupTest_624ea1") : row.feature}</div></td>
        <td className="px-3 py-3">{row.actorType === "system" ? pageText("paperclipServices_f8fc3b") : row.userName ?? (row.responsibleUserId === "local-board" ? pageText("board_e879b0") : pageText("formerUser_10e4f4"))}</td>
        <td className="px-3 py-3">{row.issueId ? <Link className="underline underline-offset-4" to={`/issues/${row.issueIdentifier ?? row.issueId}`}>{row.issueIdentifier ?? pageText("viewTask_39e023")}</Link> : "—"}</td>
        {fastResponse && <td className="px-3 py-3">{row.connectionName ?? (row.connectionId ? pageText("removedConnection_505176") : "—")}</td>}
        <td className="px-3 py-3 font-mono text-xs">{row.model}</td>
        <td className="px-3 py-3"><div>{row.status === "succeeded" ? pageText("succeeded_c8fbda") : row.status === "running" ? pageText("running_73989d") : row.status === "unknown" ? pageText("unresolved_eeccd8") : row.status === "skipped" ? pageText("skipped_5a000a") : row.status === "pending" ? pageText("pending_96f608") : pageText("failed_09fef5")}</div>{row.publicationStatus && <div className="text-xs text-muted-foreground">{row.publicationStatus}</div>}{row.errorCode && <div className="text-xs text-muted-foreground">{row.errorCode.replaceAll("_", " ")}</div>}</td>
        <td className="px-3 py-3 font-mono">{row.durationMs === null ? "—" : `${(row.durationMs / 1000).toFixed(1)}s`}</td>
        <td className="whitespace-nowrap px-3 py-3 font-mono">{row.inputTokens === null ? "—" : formatTokens(row.inputTokens)} / {row.outputTokens === null ? "—" : formatTokens(row.outputTokens)}</td>
        <td className="px-3 py-3 font-mono"><div>{row.costCents === null ? pageText("unknown_bc7819") : formatDetailedCents(row.costCents)}</div>{row.costStatus !== "unpriced" && row.costStatus && <span className="text-xs text-muted-foreground">{row.costStatus === "estimated" ? pageText("estimated_ae64c7") : pageText("reported_73c20d")}</span>}</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}
export function DecisionHistory({ companyId, from, to }: { companyId: string; from?: string | null; to?: string | null }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const query = useQuery({ queryKey: ["decision-history", companyId, from, to], queryFn: () => decisionModelsApi.history(companyId, from, to), refetchInterval: q => q.state.data?.some(row => row.status === "running") ? 5000 : false });
  if (query.isPending) return <p className="text-sm text-muted-foreground">{pageText("loadingDecisionRequests_c1e74e")}</p>;
  if (query.error) return <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{pageText("couldNotLoadDecisionRequests_6247d8")}</p><Button variant="outline" onClick={() => void query.refetch()}>{translateUi("interfaceCopy.tryAgain")}</Button></div>;
  return <DecisionHistoryTable entries={query.data ?? []} />;
}
