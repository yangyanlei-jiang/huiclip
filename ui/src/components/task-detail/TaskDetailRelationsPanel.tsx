import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { isLockedIssueStub, LockedIssueChip } from "@/components/LockedIssueChip";
import type { Issue, IssueStatus, IssueLockedStub } from "@paperclipai/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueRow } from "@/components/IssueRow";
import { StatusIcon } from "@/components/StatusIcon";
import {
  createIssueDetailPath,
  rememberIssueDetailLocationState,
} from "@/lib/issueDetailBreadcrumb";
import { Link } from "@/lib/router";
import { taskStatusIconProps } from "@/lib/task-status-presentation";

export interface TaskDetailRelationItem {
  id: string;
  identifier?: string | null;
  title: string;
  status?: string | null;
  displayStatus?: string | null;
}

export function RelationNavigationList({
  items,
  emptyMessage,
  ariaLabel,
  issueLinkState,
}: {
  items: (TaskDetailRelationItem | IssueLockedStub)[];
  emptyMessage: string;
  ariaLabel: string;
  issueLinkState?: unknown;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-0.5" aria-label={ariaLabel}>
      {items.map((item) => {
        if (isLockedIssueStub(item)) {
          return <li key={item.id} className="px-2 py-2"><LockedIssueChip identifier={item.identifier} /></li>;
        }
        const pathId = item.identifier ?? item.id;
        return (
          <li key={item.id}>
            <Link
              to={createIssueDetailPath(pathId)}
              state={issueLinkState}
              onClickCapture={() => rememberIssueDetailLocationState(pathId, issueLinkState)}
              className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={`${item.identifier ? `${item.identifier} — ` : ""}${item.title}`}
            >
              {item.status ? (
                <StatusIcon {...taskStatusIconProps({ ...item, status: item.status })} className="h-3.5 w-3.5 shrink-0" />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.identifier ? (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {item.identifier}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const NEXT_SUBTASK_STATUS_ORDER: IssueStatus[] = [
  "in_progress",
  "in_review",
  "todo",
  "backlog",
  "blocked",
];

export function resolveTaskDetailSubtaskState(items: Issue[]) {
  const nextAction = NEXT_SUBTASK_STATUS_ORDER
    .map((status) => items.find((item) => item.status === status))
    .find((item): item is Issue => Boolean(item)) ?? null;
  const rootBlocker = nextAction?.status === "blocked"
    ? nextAction.blockerAttention?.terminalBlocker ?? null
    : null;

  return {
    nextAction,
    rootBlocker,
    remainingItems: nextAction
      ? items.filter((item) => item.id !== nextAction.id)
      : items,
  };
}

export function TaskDetailTaskList({
  items,
  ariaLabel,
  issueLinkState,
}: {
  items: Issue[];
  ariaLabel: string;
  issueLinkState?: unknown;
}) {
  return (
    <ul className="flex flex-col gap-0.5" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.id}>
          <IssueRow
            issue={item}
            issueLinkState={issueLinkState}
            presentation="task"
            className="rounded-md"
          />
        </li>
      ))}
    </ul>
  );
}

export function TaskDetailSubtasksPanel({
  items,
  onAddSubtask,
  issueLinkState,
}: {
  items: Issue[];
  onAddSubtask?: () => void;
  issueLinkState?: unknown;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const completed = items.filter((item) => item.status === "done").length;
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
  const { nextAction, rootBlocker, remainingItems } = resolveTaskDetailSubtaskState(items);
  const allCompleted = items.length > 0 && completed === items.length;

  return (
    <section className="flex flex-col gap-4" aria-label={pageText("subtasks_173312")}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{pageText("progress_1b9027")}</span>
          <span className="font-mono">{completed}{" " + pageText("of_de04fa") + " "}{items.length}{" " + pageText("complete_0737c2")}</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={pageText("subtaskCompletion_22aba8")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-(--status-task-icon-done) transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {rootBlocker ? (
        <section className="flex flex-col gap-1.5" aria-labelledby="task-root-blocker-heading">
          <h3 id="task-root-blocker-heading" className="text-xs font-medium text-muted-foreground">{pageText("rootBlocker_bab195")}</h3>
          <RelationNavigationList
            items={[rootBlocker]}
            emptyMessage=""
            ariaLabel={interfaceNotice("interface:rootBlocker_bab195")}
            issueLinkState={issueLinkState}
          />
        </section>
      ) : null}

      {nextAction ? (
        <section className="flex flex-col gap-1.5" aria-labelledby="task-next-action-heading">
          <h3 id="task-next-action-heading" className="text-xs font-medium text-muted-foreground">
            {nextAction.status === "blocked" ? pageText("blockedSubtask_85b07b") : pageText("nextAction_d816c3")}
          </h3>
          <TaskDetailTaskList
            items={[nextAction]}
            ariaLabel={interfaceNotice("interface:nextSubtaskAction_30a327")}
            issueLinkState={issueLinkState}
          />
        </section>
      ) : items.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {allCompleted ? pageText("allSubtasksAreComplete_406a3d") : pageText("noRemainingSubtaskActions_5a2606")}
        </p>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">{pageText("noSubtasksYet_41a9b8")}</p>
      )}

      {remainingItems.length > 0 ? (
        <section className="flex flex-col gap-1.5" aria-labelledby="task-other-subtasks-heading">
          <h3 id="task-other-subtasks-heading" className="text-xs font-medium text-muted-foreground">
            {nextAction ? pageText("otherSubtasks_c8caaa") : pageText("subtasks_173312")}
          </h3>
          <TaskDetailTaskList
            items={remainingItems}
            ariaLabel={nextAction ? interfaceNotice("interface:otherSubtasks_c8caaa") : interfaceNotice("interface:subtasks_173312")}
            issueLinkState={issueLinkState}
          />
        </section>
      ) : null}

      {onAddSubtask ? (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={onAddSubtask}>
          <Plus className="h-3.5 w-3.5" />{pageText("addSubtask_65b9d7")}</Button>
      ) : null}
    </section>
  );
}

export function TaskDetailReferencesPanel({
  referenced,
  mentionedIn,
  issueLinkState,
}: {
  referenced: TaskDetailRelationItem[];
  mentionedIn: TaskDetailRelationItem[];
  issueLinkState?: unknown;
}) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2" aria-labelledby="task-referenced-heading">
        <h3 id="task-referenced-heading" className="text-xs font-medium text-muted-foreground">{pageText("referenced_ec5531")}</h3>
        <RelationNavigationList
          items={referenced}
          emptyMessage={pageText("thisTaskDoesNotReferenceAnotherTask_05aa1c")}
          ariaLabel={interfaceNotice("interface:referencedTasks_6dfa20")}
          issueLinkState={issueLinkState}
        />
      </section>
      <section className="flex flex-col gap-2" aria-labelledby="task-mentioned-in-heading">
        <h3 id="task-mentioned-in-heading" className="text-xs font-medium text-muted-foreground">{pageText("mentionedIn_dc8ad4")}</h3>
        <RelationNavigationList
          items={mentionedIn}
          emptyMessage={pageText("noOtherTaskMentionsThisTask_031a3a")}
          ariaLabel={interfaceNotice("interface:tasksThatMentionThisTask_e3847a")}
          issueLinkState={issueLinkState}
        />
      </section>
    </div>
  );
}
