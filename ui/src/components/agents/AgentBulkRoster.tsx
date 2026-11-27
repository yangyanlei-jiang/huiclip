import { t as interfaceNotice } from "@/i18n";
import { t as translateDynamic } from "../../i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Filter, Pencil, X } from "lucide-react";
import type { Agent } from "@paperclipai/shared";
import { agentsApi } from "@/api/agents";
import { describeError } from "@/api/errors";
import { bindAccount } from "@/lib/account-scope";
import { aiConnectionsApi } from "@/api/ai-connections";
import { getAdapterLabel } from "@/adapters/adapter-display-registry";
import { agentConnection, agentDefaultModel, bulkAgentDisabledReason, bulkAgentHarness, bulkConnectionName } from "@/lib/bulk-agent-settings";
import { pendingAgentSetupDisplayAdapter } from "@/lib/agent-setup-choice";
import { AgentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const AgentBulkSettingsSheet = lazy(() => import("./AgentBulkSettingsSheet").then(m => ({ default: m.AgentBulkSettingsSheet })));

/** Shared by both roster layouts. Mount with a company key to isolate selection. */
export function AgentBulkRoster({ companyId, agents, visibleAgents, renderAgent, renderChat, renderStatus }: {
  companyId: string; agents: Agent[]; visibleAgents: Agent[]; renderAgent: (agent: Agent) => ReactNode;
  renderChat?: (agent: Agent) => ReactNode;
  renderStatus?: (agent: Agent) => ReactNode;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const client = useQueryClient();
  const openingRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const selectionRevision = useRef(0);
  const changeSelection = (next: SetStateAction<string[]>) => {
    selectionRevision.current += 1;
    setSelected(next);
  };
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Agent[] | null>(null);
  const [notice, setNotice] = useState("");
  const accounts = useQuery({ queryKey: ["ai-connections", companyId], queryFn: () => aiConnectionsApi.list(companyId) });
  const visible = visibleAgents.filter(a => filter === "all" || bulkAgentHarness(a) === filter);
  const selectable = visible.filter(a => !bulkAgentDisabledReason(a));
  const selectedAgents = useMemo(() => agents.filter(a => selected.includes(a.id) && !bulkAgentDisabledReason(a)), [agents, selected]);
  const [lastSelection, setLastSelection] = useState<Agent[]>([]);
  useEffect(() => { if (selectedAgents.length) setLastSelection(selectedAgents); }, [selectedAgents]);
  // Retain the card contents while it drops out, so its width does not collapse mid-animation.
  const actionAgents = selectedAgents.length ? selectedAgents : lastSelection;
  const harnesses = [...new Set(agents.map(bulkAgentHarness))].sort((a, b) => getAdapterLabel(a).localeCompare(getAdapterLabel(b)));
  const groups = [...new Set(actionAgents.map(bulkAgentHarness))];
  const all = selectable.length > 0 && selectable.every(a => selected.includes(a.id));
  const some = selectable.some(a => selected.includes(a.id));
  const hidden = actionAgents.filter(a => !visible.includes(a)).length;
  const toggleAll = () => changeSelection(all ? selected.filter(id => !selectable.some(a => a.id === id)) : [...new Set([...selected, ...selectable.map(a => a.id)])]);

  async function openEditor(harness: string) {
    if (openingRef.current) return;
    openingRef.current = true; setOpening(true); setOpenError("");
    const account = bindAccount(client);
    const revision = selectionRevision.current;
    try {
      await account.whenAccountReady();
      if (!account.isCurrentAccount() || revision !== selectionRevision.current) return;
      const complete = await Promise.all(selectedAgents.filter(a => bulkAgentHarness(a) === harness)
        .map(a => agentsApi.get(a.id, companyId, { cache: "no-store", fresh: true })));
      if (!account.isCurrentAccount() || revision !== selectionRevision.current) return;
      // The display cache excludes private runtime fields. Only complete,
      // freshly authorized agents can become the editor's optimistic base.
      if (complete.some(a => a.companyId !== companyId || bulkAgentHarness(a) !== harness || bulkAgentDisabledReason(a))) {
        setOpenError(interfaceNotice("interface:theSelectedAgentsChangedRefreshTheRosterAnd_2aa474"));
        return;
      }
      setEditing(complete);
    } catch (error) {
      if (account.isCurrentScope() && revision === selectionRevision.current) setOpenError(describeError(error).body);
    } finally { openingRef.current = false; setOpening(false); }
  }

  return <div className="space-y-4">
    <div data-canonical-toolbar="agent-filters" role="toolbar" aria-label={pageText("agentFilters_e6daec")} className="flex flex-wrap items-center justify-between gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={pageText("filterAgents_9b26f6")} title={filter === "all" ? pageText("filter_d7decf") : `Filter: ${getAdapterLabel(filter)}`}
            className={cn("relative h-8 w-8 shrink-0", filter !== "all" && "text-blue-600 dark:text-blue-400")}>
            <Filter className="h-3.5 w-3.5" aria-hidden />
            {filter !== "all" && <span aria-hidden className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-(length:--text-nano) font-bold text-white">1</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label={pageText("agentFilters_e6daec")} align="start" className="w-64 space-y-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{translateUi("interfaceCopy.filters")}</span>
            {filter !== "all" && <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setFilter("all")}>{translateUi("interfaceCopy.clear")}</button>}
          </div>
          <div role="group" aria-label={pageText("harness_2b7cfd")} className="space-y-1">
            <div className="px-2 text-xs font-medium text-muted-foreground">{pageText("harness_2b7cfd")}</div>
            {["all", ...harnesses].map(h => <button key={h} type="button" aria-pressed={filter === h} onClick={() => setFilter(h)}
              className={cn("flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-sm", filter === h ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
              {h === "all" ? pageText("allHarnesses_ee34f8") : getAdapterLabel(h)}{filter === h && <Check className="size-3.5" aria-hidden />}
            </button>)}
          </div>
        </PopoverContent>
      </Popover>
      <span className="text-xs text-muted-foreground">{visible.length} {visible.length === 1 ? pageText("agent_0608c4") : pageText("agents_e7052a")}</span>
    </div>
    {createPortal(<div role="region" aria-label={pageText("bulkActions_3268f9")} aria-hidden={selectedAgents.length === 0} inert={selectedAgents.length === 0}
      data-state={selectedAgents.length > 0 ? "open" : "closed"} className="agent-selection-bar flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
      <span className="text-sm font-medium">{actionAgents.length}{" " + pageText("selected_835f3b")}</span>
      {hidden > 0 && <span className="text-xs text-muted-foreground">{hidden}{" " + pageText("hiddenByFilters_950d6c")}</span>}
      {groups.length > 1 && <span className="text-xs text-muted-foreground">{pageText("chooseAHarnessToEdit_f8e0d0")}</span>}
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{groups.map(h => <Button key={h} size="sm" variant="outline" disabled={opening} onClick={() => void openEditor(h)}>
        <Pencil className="size-3.5" aria-hidden />{groups.length === 1 ? pageText("editConnectionModel_bb37d2") : `Edit ${actionAgents.filter(a => bulkAgentHarness(a) === h).length} ${getAdapterLabel(h)}`}
      </Button>)}<Button size="icon-sm" variant="ghost" aria-label={pageText("clearSelection_247fd6")} onClick={() => changeSelection([])}><X className="size-4" /></Button></div>
    </div>, document.body)}
    {opening && <p role="status" className="text-sm text-muted-foreground">{pageText("loadingCurrentAgentSettings_343812")}</p>}
    {openError && <p role="alert" className="text-sm text-destructive">{openError}</p>}
    {notice && <p role="status" className="flex items-center gap-2 text-sm"><Check className="size-4" aria-hidden />{notice}</p>}
    {accounts.error && <p className="text-xs text-destructive">{pageText("connectionNamesCouldnTBeLoaded_0a22b6") + " "}<Button variant="link" size="sm" onClick={() => void accounts.refetch()}>{translateUi("interfaceCopy.retry")}</Button></p>}
    <div className="overflow-x-auto"><table aria-label={pageText("agentRoster_dec33b")} className="agent-roster w-full text-left text-sm">
      <thead className="text-xs text-muted-foreground [&_th]:px-3 [&_th]:py-3 [&_th]:font-normal"><tr>
        <th className="w-10"><Checkbox aria-label={pageText("selectAllVisibleEditableAgents_342b6c")} checked={all ? true : some ? "indeterminate" : false} disabled={!selectable.length} onCheckedChange={toggleAll} /></th>
        <th scope="col">{translateUi("interfaceCopy.agent")}</th>{renderChat && <th scope="col"><span className="sr-only">{pageText("chat_2ced57")}</span></th>}<th scope="col">{translateUi("interfaceCopy.status")}</th><th scope="col">{pageText("harness_2b7cfd")}</th><th scope="col">{translateUi("interfaceCopy.connection")}</th><th scope="col">{pageText("defaultModel_5fbae1")}</th>
      </tr></thead>
      <tbody>{visible.map(agent => {
        const pendingSetup = pendingAgentSetupDisplayAdapter(agent);
        return <tr key={agent.id} data-state={selected.includes(agent.id) ? "selected" : undefined} className="group/agent-row border-t border-border data-[state=selected]:bg-accent/30 hover:bg-accent/50 focus-within:bg-accent/50 [&_td]:px-3 [&_td]:align-middle">
        <td title={bulkAgentDisabledReason(agent)}><Checkbox aria-label={translateDynamic("dynamic:select", { value1: agent.name })} checked={selectedAgents.some(a => a.id === agent.id)} disabled={!!bulkAgentDisabledReason(agent)} onCheckedChange={value => changeSelection(value ? [...new Set([...selected, agent.id])] : selected.filter(id => id !== agent.id))} /></td>
        <td className="min-w-64 p-0">{renderAgent(agent)}</td>
        {renderChat && <td>{renderChat(agent)}</td>}
        <td>{renderStatus ? renderStatus(agent) : <AgentStatusBadge status={agent.status} />}</td>
        <td className="whitespace-nowrap text-xs">{getAdapterLabel(pendingSetup ?? bulkAgentHarness(agent))}</td>
        <td className="text-xs">{pendingSetup ? pageText("notConfigured_811931") : ["http", "process"].includes(agent.adapterType) ? pageText("managedExternally_c44f15") : bulkConnectionName(agentConnection(agent), accounts.data)}</td>
        <td className="font-mono text-xs">{pendingSetup ? pageText("notAvailableYet_a1db9d") : agentDefaultModel(agent) ?? pageText("harnessDefault_6dd2a2")}</td>
      </tr>;
      })}</tbody>
    </table></div>
    {!visible.length && <p className="py-8 text-center text-sm text-muted-foreground">{pageText("noAgentsMatchTheseFilters_9fe773")}</p>}
    {editing && <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">{pageText("loadingEditor_a31c11")}</p>}><AgentBulkSettingsSheet companyId={companyId} agents={editing} totalSelected={selectedAgents.length} onClose={(updatedIds, complete) => {
      setEditing(null);
      if (updatedIds.length) {
        changeSelection(ids => ids.filter(id => !(complete ? editing.map(a => a.id) : updatedIds).includes(id)));
        setNotice(`Updated ${updatedIds.length} ${getAdapterLabel(bulkAgentHarness(editing[0]))} ${updatedIds.length === 1 ? "agent" : "agents"}.`);
      }
    }} /></Suspense>}
  </div>;
}
