import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useQueryView } from "@/components/QueryView";
import { useMemo, useState } from "react";
import { useCoordinatorChatTaskHandoffs } from "./CoordinatorChatTaskHandoffs";
import { CoordinatorCreatedTaskLink } from "./CoordinatorTaskCommitment";
import { ToolbarSearch } from "@/components/ToolbarSearch";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/** The task list is source-conversation scoped, independent of reassignment. */
export function CoordinatorConversationTasksPanel({ conversationIssueId }: { conversationIssueId: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const tasks = useCoordinatorChatTaskHandoffs(conversationIssueId);
  const tasksView = useQueryView(tasks);
  const waiting = ["loading", "reconnecting"].includes(tasksView.kind);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return tasks.handoffs.filter(task => (!status || task.status === status) && (!needle || `${task.identifier ?? ""} ${task.title}`.toLocaleLowerCase().includes(needle)))
      .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : (sort === "oldest" ? 1 : -1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, [tasks.handoffs, query, status, sort]);
  return <section className="space-y-4" aria-label={pageText("tasksFromThisConversation_f7e524")}>
    <div className="space-y-1"><h2 className="text-lg font-medium">{translateUi("interfaceCopy.tasks")}</h2><p className="text-sm text-muted-foreground">{pageText("createdFromThisConversation_6e8794")}</p></div>
    <ToolbarSearch query={query} onQueryChange={setQuery} label={pageText("searchConversationTasks_a686bf")} placeholder={pageText("searchTasksOrIDs_bac384")} />
    <div className="flex flex-wrap gap-2">
      <NativeSelect value={status} onChange={event => setStatus(event.target.value)} aria-label={pageText("filterConversationTasksByStatus_e111c0")} className="w-auto"><option value="">{pageText("allStatuses_640517")}</option><option value="todo">{pageText("readyToStart_7196e3")}</option><option value="in_progress">{pageText("inProgress_b6bd42")}</option><option value="in_review">{pageText("needsReview_33a506")}</option><option value="blocked">{pageText("blocked_99613c")}</option><option value="done">{pageText("done_e9b450")}</option><option value="cancelled">{pageText("cancelled_a1bf92")}</option></NativeSelect>
      <NativeSelect value={sort} onChange={event => setSort(event.target.value)} aria-label={pageText("sortConversationTasks_1071a6")} className="w-auto"><option value="newest">{pageText("newestFirst_f5ec77")}</option><option value="oldest">{pageText("oldestFirst_6a99c6")}</option><option value="title">{pageText("title_768e0c")}</option></NativeSelect>
    </div>
    {waiting && <p role="status" className="text-sm text-muted-foreground">{pageText("loadingTasks_a3495d")}</p>}
    {(tasksView.kind === "error") && <div role="alert" className="space-y-2"><p className="text-sm">{pageText("tasksCouldnTLoad_ed168d")}</p><Button variant="outline" onClick={() => void tasks.refetch()}>{translateUi("interfaceCopy.retry")}</Button></div>}
    <div className="space-y-3">{visible.map(task => <div key={task.id} className="overflow-hidden rounded-xl border border-border bg-card"><CoordinatorCreatedTaskLink task={task} /></div>)}</div>
    {!waiting && !(tasksView.kind === "error") && !visible.length && <p className="py-4 text-sm text-muted-foreground">{query || status ? pageText("noLoadedTasksMatchTheseFilters_83c57b") : pageText("tasksCreatedFromThisConversationWillAppearHere_8515a1")}</p>}
    {tasks.hasNextPage && <Button variant="outline" disabled={tasks.isFetchingNextPage} onClick={() => void tasks.fetchNextPage()}>{tasks.isFetchingNextPage ? pageText("loading_33ce41") : pageText("loadMoreTasks_219af2")}</Button>}
  </section>;
}
