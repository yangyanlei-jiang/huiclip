import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Agent } from "@paperclipai/shared";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

export interface AgentChatPickerProps {
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (agent: Agent, signal?: AbortSignal) => void | Promise<void>;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  existingChatAgentIds?: readonly string[];
  unreadMessageCounts?: ReadonlyMap<string, number>;
  renderAgentIcon?: (agent: Agent) => ReactNode;
  trigger?: ReactNode;
}

export function AgentChatPicker({ open, onOpenChange, trigger, ...props }: AgentChatPickerProps) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent aria-describedby={undefined} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="px-4 pt-4 pb-3">
          <DialogTitle>{pageText("chatWithAnAgent_b5e325")}</DialogTitle>
          {props.existingChatAgentIds && <p className="mt-2 text-sm text-muted-foreground">{pageText("oneConversationPerAgentPickUpWhereYou_a56854")}</p>}
        </div>
        {/* The dialog unmounts its content on close, so each search starts empty. */}
        <AgentChatPickerResults key={String(open)} {...props} onComplete={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AgentChatPickerResults({ agents, onSelect, onComplete, loading, error, onRetry, existingChatAgentIds, unreadMessageCounts, renderAgentIcon }: Omit<AgentChatPickerProps, "open" | "onOpenChange"> & { onComplete: () => void }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const existingIds = useMemo(() => new Set(existingChatAgentIds), [existingChatAgentIds]);
  const mounted = useRef(false);
  const selection = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; selection.current?.abort(); };
  }, []);
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  async function selectAgent(agent: Agent) {
    if (openingId) return;
    setOpeningId(agent.id);
    setSelectionError(null);
    const request = new AbortController();
    selection.current = request;
    try {
      await onSelect(agent, request.signal);
      if (mounted.current) onComplete();
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : interfaceNotice("interface:couldnTOpenChatTryAgain_711aa6"));
    } finally {
      setOpeningId(null);
    }
  }
  return (
    <Command>
      <CommandInput
        aria-label={pageText("searchAgentsByNameOrRole_7e401b")}
        placeholder={pageText("searchByNameOrRole_cb15a8")}
        value={search}
        onValueChange={setSearch}
      />
      {selectionError && <p role="alert" className="px-4 py-3 text-sm text-destructive">{selectionError}</p>}
      {openingId && <p role="status" className="sr-only">{pageText("openingConversation_abb3d7")}</p>}
      {error ? (
        <div role="alert" className="flex flex-col items-start gap-2 p-4 text-sm">
          <p>{pageText("couldnTLoadAgentsTryAgain_87845a")}</p>
          {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>{translateUi("interfaceCopy.retry")}</Button>}
        </div>
      ) : loading ? (
        <p role="status" className="p-4 text-sm text-muted-foreground">{pageText("loadingAgents_aa8e27")}</p>
      ) : (
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 px-4">
              <span>{agents.length ? `No agents match “${search}”` : pageText("noAgentsYet_62561f")}</span>
              {agents.length ? <>
                <span className="text-xs text-muted-foreground">{pageText("tryAnotherNameOrRole_bb064a")}</span>
                <Button variant="ghost" size="sm" onClick={() => setSearch("")}>{translateUi("interfaceCopy.clearSearch")}</Button>
              </> : <span className="text-xs text-muted-foreground">{pageText("createAnAgentFromTheAgentsPageTo_be2599")}</span>}
            </div>
          </CommandEmpty>
          <CommandGroup>
            {agents.map((agent) => {
              const unreadCount = unreadMessageCounts?.get(agent.id) ?? 0;
              return (
                <CommandItem
                  key={agent.id}
                  value={agent.id}
                  keywords={[agent.name, agent.title ?? "", agent.role]}
                  onSelect={() => { void selectAgent(agent); }}
                  disabled={openingId !== null}
                  className="gap-3 px-3 py-3"
                >
                  {renderAgentIcon ? renderAgentIcon(agent) : <AgentAvatar agent={agent} size={32} />}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{agent.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{agent.title ?? agent.role}</span>
                  </span>
                  {unreadCount > 0 && <Badge variant="ghost" aria-label={`${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"} from ${agent.name}`} className="shrink-0 bg-primary font-mono tabular-nums text-primary-foreground">{unreadCount}</Badge>}
                  {existingChatAgentIds && <span className="shrink-0 text-xs text-muted-foreground">{existingIds.has(agent.id) ? pageText("openChat_d2104c") : pageText("newChat_009bf6")}</span>}
                  {agent.status === "paused" && <span className="text-xs text-(--status-agent-paused)">{pageText("paused_c7dfb6")}</span>}
                  {agent.status === "terminated" && <span className="text-xs text-muted-foreground">{pageText("terminated_a1848f")}</span>}
                  {agent.status === "pending_approval" && <span className="text-xs text-muted-foreground">{pageText("awaitingApproval_d0a0d8")}</span>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
