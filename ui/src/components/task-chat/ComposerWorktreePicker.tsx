import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useMemo, type CSSProperties } from "react";
import { Folder, GitBranch, GitBranchPlus, Monitor } from "lucide-react";
import type { ExecutionWorkspaceSummary } from "@paperclipai/shared";
import { SearchableSelect, type SearchableSelectOption } from "@/components/SearchableSelect";
import { orderReusableExecutionWorkspaces } from "@/lib/reusable-execution-workspaces";

interface WorktreeOption extends SearchableSelectOption {
  mode: string;
  workspaceId?: string;
  description: string;
}

interface ComposerWorktreePickerProps {
  mode: string;
  workspaceId: string;
  workspaces: readonly ExecutionWorkspaceSummary[];
  onChange: (mode: string, workspaceId: string) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  disabled?: boolean;
  mobile?: boolean;
  contentStyle?: CSSProperties;
  selectedWorkspaceLabel?: string;
}

const MODE_OPTIONS: WorktreeOption[] = [
  { key: "isolated_workspace", value: "isolated_workspace", mode: "isolated_workspace", label: "New worktree", description: "Start in an isolated checkout." },
  { key: "shared_workspace", value: "shared_workspace", mode: "shared_workspace", label: "Project workspace", description: "Use the project's shared checkout." },
  { key: "operator_branch", value: "operator_branch", mode: "operator_branch", label: "New branch", description: "Create a branch in the project workspace." },
  { key: "agent_default", value: "agent_default", mode: "agent_default", label: "Agent default", description: "Let the agent choose its workspace." },
  { key: "inherit", value: "inherit", mode: "inherit", label: "Project default", description: "Use the project's worktree settings." },
];

/** Reuses the searchable selector and the existing workspace recency ordering. */
export function ComposerWorktreePicker({
  mode, workspaceId, workspaces, onChange, loading, error, onRetry,
  disabled, mobile, contentStyle, selectedWorkspaceLabel,
}: ComposerWorktreePickerProps) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const groups = useMemo(() => [
    { id: "new", options: [MODE_OPTIONS[0]!] },
    {
      id: "reuse", label: "Reuse a worktree",
      options: orderReusableExecutionWorkspaces(workspaces).map((workspace): WorktreeOption => ({
        key: `reuse:${workspace.id}`, value: `reuse:${workspace.id}`,
        workspaceId: workspace.id, mode: "reuse_existing", label: workspace.name,
        description: workspace.branchName ?? "Existing workspace",
        searchText: `${workspace.branchName ?? ""} ${workspace.id}`,
      })),
    },
    {
      id: "other", label: "Other options",
      options: MODE_OPTIONS.filter((option) => option.mode === "shared_workspace"
        || (option.mode !== "isolated_workspace" && option.mode === mode)),
    },
  ], [mode, workspaces]);

  const value = mode === "reuse_existing" ? `reuse:${workspaceId}` : mode;
  return (
    <SearchableSelect<string, WorktreeOption>
      value={value}
      groups={groups}
      onValueChange={(_, option) => onChange(option.mode, option.workspaceId ?? "")}
      placeholder={pageText("worktrees_70a2c1")}
      triggerAriaLabel="Worktrees"
      mobileTitle="Worktrees"
      searchPlaceholder={pageText("searchWorktrees_7ed97a")}
      emptyMessage={pageText("noMatchingWorktrees_e59a09")}
      disabled={disabled}
      modal={mobile}
      contentStyle={contentStyle}
      contentWidth="auto"
      className="min-w-0 flex-1 sm:flex-none sm:max-w-72"
      triggerClassName="h-8 gap-1.5 border-0 bg-transparent px-2 text-xs font-medium shadow-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-0"
      renderValue={(option) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <GitBranch className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            <span className="hidden text-muted-foreground sm:inline">{pageText("worktrees_b4daff") + " "}</span>
            {option?.label ?? selectedWorkspaceLabel ?? pageText("selectWorktree_eb130a")}
          </span>
        </span>
      )}
      renderOption={(option) => {
        const Icon = option.workspaceId ? GitBranch : option.mode === "isolated_workspace" ? GitBranchPlus
          : option.mode === "agent_default" ? Monitor : option.mode === "operator_branch" ? GitBranch : Folder;
        return (
          <>
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{option.label}</span>
              <span className="truncate text-xs text-muted-foreground">{option.description}</span>
            </span>
          </>
        );
      }}
      listFooter={loading || error || workspaces.length === 0 ? (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground" role="status">
          {loading ? pageText("loadingExistingWorktrees_79f122") : error ? (
            <span className="flex items-center justify-between gap-2">{pageText("couldnTLoadWorktrees_0c3db8")}<button type="button" className="rounded px-2 py-1 text-foreground hover:bg-accent" onClick={onRetry}>{translateUi("interfaceCopy.retry")}</button>
            </span>
          ) : pageText("noExistingWorktreesYetChooseNewWorktreeTo_54cceb")}
        </div>
      ) : undefined}
    />
  );
}
