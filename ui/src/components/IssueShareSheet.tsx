import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { AgentAvatar } from "./AgentAvatar";
import { Identity } from "./Identity";
import { renderAccessIdentity, type AccessSelectOption } from "./AccessSelectIdentity";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Folder,
  Lock,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import type { IssueAccessGrant, IssueAccessGrantSource } from "@paperclipai/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect, type SearchableSelectGroup } from "@/components/SearchableSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { agentsApi } from "@/api/agents";
import { accessApi } from "@/api/access";
import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import {
  agentVisibilityFromPermissions,
  grantIsRevocable,
  isSharedAgentVisibility,
} from "@/lib/issuePrivacy";

/**
 * A role-based principal that can read the task by virtue of *who they are*
 * (responsible user, creator, current assignee) rather than an explicit grant.
 * Implicit principals are shown with a muted role badge and have NO revoke —
 * you change their access by changing the role, not from the share sheet.
 * The caller derives these (it holds the agent/user directories); the sheet
 * only renders them.
 */
export interface ShareSheetImplicitPrincipal {
  id: string;
  displayName: string;
  roleLabel: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
}

interface SourceBadgeSpec {
  label: string;
  icon: typeof UserPlus;
  className: string;
}

// Source labels and icons distinguish access reasons; colors use semantic tokens.
const SOURCE_BADGES: Record<IssueAccessGrantSource, SourceBadgeSpec> = {
  owner: { label: "task owner", icon: Lock, className: "border-border bg-muted text-muted-foreground" },
  explicit: {
    label: "shared directly",
    icon: UserPlus,
    className:
      "border-primary/30 bg-primary/10 text-primary",
  },
  assignment: {
    label: "via assignment",
    icon: Check,
    className:
      "border-border bg-secondary text-secondary-foreground",
  },
  project: {
    label: "via project",
    icon: Folder,
    className:
      "border-border bg-accent text-accent-foreground",
  },
};

function SourceBadge({ source }: { source: IssueAccessGrantSource }) {
  const spec = SOURCE_BADGES[source];
  const Icon = spec.icon;
  return (
    <span
      data-testid={`grant-source-badge-${source}`}
      data-source={source}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-(length:--text-nano) font-medium leading-tight",
        spec.className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {spec.label}
    </span>
  );
}

function PrincipalAvatar({
  displayName,
  avatarUrl,
  initials,
}: {
  displayName: string;
  avatarUrl?: string | null;
  initials?: string | null;
}) {
  return (
    <Avatar size="sm" className="mt-0.5" aria-hidden="true">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback>{initials ?? displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

// The named type ladder in index.css explicitly prefers Tailwind text-xs and
// text-sm for its 12px and 14px tiers; these are the shared scale tokens.
function RowShell({
  avatar,
  title,
  subtitle,
  badge,
  action,
}: {
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{title}</span>
          {badge}
        </div>
        {subtitle ? <div className="truncate text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

export function IssueShareSheet({
  issueId,
  companyId,
  canManage,
  open,
  onOpenChange,
  aclDescription = "Sharing grants access to this task and its descendants, including comments, documents, and run history. Parents and siblings need separate access.",
  implicitPrincipals = [],
  initialView = "list",
  initialAddSelection = "",
}: {
  issueId: string;
  companyId: string;
  canManage: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aclDescription?: string;
  implicitPrincipals?: ShareSheetImplicitPrincipal[];
  /** Initial panel — `add` opens straight into the add flow (stories/tests). */
  initialView?: "list" | "add";
  /** Pre-selected add subject (`type:id`), used by stories/tests to show the caution. */
  initialAddSelection?: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [view, setView] = useState<"list" | "add">(initialView);
  const [addSelection, setAddSelection] = useState<string>(initialAddSelection);
  const [revokeTarget, setRevokeTarget] = useState<IssueAccessGrant | null>(null);

  const grantsQuery = useQuery({
    queryKey: queryKeys.issues.accessGrants(issueId),
    queryFn: () => issuesApi.listAccessGrants(issueId),
    enabled: open,
  });
  const directoryQuery = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(companyId),
    queryFn: () => accessApi.listUserDirectory(companyId),
    enabled: open && view === "add" && canManage,
  });
  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId),
    enabled: open && view === "add" && canManage,
  });

  const activeGrants = useMemo(
    () => (grantsQuery.data ?? []).filter((grant) => grant.revokedAt === null),
    [grantsQuery.data],
  );
  const grantedSubjectKeys = useMemo(
    () => new Set(activeGrants.filter((grant) => !grant.inherited && grant.source !== "project")
      .map((grant) => `${grant.subjectType}:${grant.subjectId}`)),
    [activeGrants],
  );

  const addMutation = useMutation({
    mutationFn: (payload: { subjectType: "user" | "agent"; subjectId: string }) =>
      issuesApi.createAccessGrant(issueId, payload),
    onSuccess: () => {
      // A task grant also changes descendant access and cached task discovery.
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setAddSelection("");
      setView("list");
      pushToast({ title: interfaceNotice("interface:accessGranted_2c5e9c"), tone: "success" });
    },
    onError: (error) => {
      pushToast({ title: interfaceNotice("interface:couldnTAddAccess_d87d6f"), body: (error as Error).message, tone: "error" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (grant: IssueAccessGrant) => issuesApi.revokeAccessGrant(issueId, grant.id),
    onSuccess: () => {
      // A task grant also changes descendant access and cached task discovery.
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setRevokeTarget(null);
      pushToast({ title: interfaceNotice("interface:accessRevoked_7d420e"), tone: "success" });
    },
    onError: (error) => {
      pushToast({ title: interfaceNotice("interface:couldnTRevokeAccess_eb9ce9"), body: (error as Error).message, tone: "error" });
    },
  });

  // Candidate subjects for the "Add someone" combobox, minus anyone who already
  // holds a direct grant on this task. Inherited/project access can be supplemented
  // with an independent child grant before broader access is removed. Value encodes both type and id: `type:id`.
  const addGroups = useMemo<SearchableSelectGroup<string, AccessSelectOption>[]>(() => {
    const users = (directoryQuery.data?.users ?? [])
      .filter((entry) => entry.user && !grantedSubjectKeys.has(`user:${entry.user.id}`))
      .map((entry) => ({
        key: `user:${entry.user!.id}`,
        value: `user:${entry.user!.id}`,
        label: entry.user!.name ?? entry.user!.email ?? "Unknown user",
        searchText: [entry.user!.name, entry.user!.email].filter(Boolean).join(" "),
        identity: <Identity name={entry.user!.name ?? entry.user!.email ?? "Unknown user"} avatarUrl={entry.user!.image} size="sm" />,
      }));
    const agents = (agentsQuery.data ?? [])
      .filter((agent) => !grantedSubjectKeys.has(`agent:${agent.id}`))
      .map((agent) => ({
        key: `agent:${agent.id}`,
        value: `agent:${agent.id}`,
        label: agent.name,
        searchText: agent.name,
        identity: <><AgentAvatar agent={agent} size={24} /><span className="truncate">{agent.name}</span></>,
      }));
    const groups: SearchableSelectGroup<string, AccessSelectOption>[] = [];
    if (users.length > 0) groups.push({ id: "people", label: "People", options: users });
    if (agents.length > 0) groups.push({ id: "agents", label: "Agents", options: agents });
    return groups;
  }, [directoryQuery.data, agentsQuery.data, grantedSubjectKeys]);

  // Is the currently-selected add subject a *shared* agent? Drives the caution.
  const selectedSharedAgentName = useMemo(() => {
    if (!addSelection.startsWith("agent:")) return null;
    const agentId = addSelection.slice("agent:".length);
    const agent = (agentsQuery.data ?? []).find((candidate) => candidate.id === agentId);
    if (!agent) return null;
    return isSharedAgentVisibility(agentVisibilityFromPermissions(agent.permissions))
      ? agent.name
      : null;
  }, [addSelection, agentsQuery.data]);

  function resetAndClose(next: boolean) {
    if (!next) {
      setView("list");
      setAddSelection("");
      setRevokeTarget(null);
    }
    onOpenChange(next);
  }

  function submitAdd() {
    if (!addSelection) return;
    const [subjectType, subjectId] = addSelection.split(/:(.+)/) as ["user" | "agent", string];
    if (!subjectId) return;
    addMutation.mutate({ subjectType, subjectId });
  }

  const grantsView = useQueryView(grantsQuery);
  const isLoading = grantsQuery.isLoading || grantsView.kind === "reconnecting";
  const loadFailed = grantsView.kind === "error";
  const isEmpty = !isLoading && !loadFailed && activeGrants.length === 0 && implicitPrincipals.length === 0;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{pageText("whoCanAccessThisTask_9d41f6")}</DialogTitle>
          <DialogDescription>{aclDescription}</DialogDescription>
        </DialogHeader>

        {view === "list" ? (
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 py-1" data-testid="share-sheet-loading">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-2.5 py-1">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadFailed ? (
              <div data-testid="share-sheet-error">
                <QueryErrorState
                  error={grantsQuery.error}
                  action="load access"
                  onRetry={grantsView.retry}
                  retrying={grantsView.isFetching}
                />
              </div>
            ) : isEmpty ? (
              <p className="py-3 text-sm text-muted-foreground" data-testid="share-sheet-empty">{pageText("onlyYouCanSeeThisTask_d3e211")}</p>
            ) : (
              <div className="divide-y divide-border/60">
                {implicitPrincipals.filter(principal => !activeGrants.some(grant => grant.subjectId === principal.id || `${grant.subjectType}:${grant.subjectId}` === principal.id)).map((principal) => (
                  <RowShell
                    key={`implicit:${principal.id}`}
                    avatar={
                      <PrincipalAvatar
                        displayName={principal.displayName}
                        avatarUrl={principal.avatarUrl}
                        initials={principal.initials}
                      />
                    }
                    title={principal.displayName}
                    subtitle={principal.subtitle ?? undefined}
                    badge={
                      <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-(length:--text-nano) font-medium text-muted-foreground">
                        {principal.roleLabel}
                      </span>
                    }
                  />
                ))}
                {activeGrants.map((grant) => {
                  const displayName = grant.subjectDisplayName ?? "Unknown";
                  const implicitPrincipal = implicitPrincipals.find(principal =>
                    principal.id === `${grant.subjectType}:${grant.subjectId}`);
                  const revocable = canManage && !grant.inherited && grantIsRevocable(grant.source);
                  const granter = grant.source === "explicit" ? "Shared" : "Granted";
                  return (
                    <RowShell
                      key={grant.id}
                      avatar={
                        <PrincipalAvatar
                          displayName={displayName}
                          avatarUrl={grant.subjectAvatarUrl}
                          initials={grant.subjectInitials}
                        />
                      }
                      title={displayName}
                      subtitle={implicitPrincipal ? `${implicitPrincipal.roleLabel} — access remains while this role applies` : grant.inherited ? "Inherited access — managed at its source" : `${granter} ${timeAgo(grant.createdAt)}`}
                      badge={<SourceBadge source={grant.source} />}
                      action={
                        revocable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setRevokeTarget(grant)}
                          >
                            {implicitPrincipal ? pageText("removeSavedGrant_4ea1cd") : pageText("revoke_0be720")}
                          </Button>
                        ) : grant.source === "project" ? (
                          <span className="text-(length:--text-nano) text-muted-foreground">{pageText("projectManaged_df1bec")}</span>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            )}

            {canManage ? (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setView("add")}
                  disabled={isLoading}
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />{" " + pageText("addSomeone_36d111")}</Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <SearchableSelect
              value={addSelection}
              groups={addGroups}
              renderValue={(option) => option ? renderAccessIdentity(option) : "Choose a person or agent…"}
              renderOption={renderAccessIdentity}
              onValueChange={(value) => setAddSelection(value)}
              placeholder={pageText("chooseAPersonOrAgent_9058ce")}
              searchPlaceholder={pageText("searchPeopleAndAgents_6fbb6e")}
              loading={directoryQuery.isLoading || agentsQuery.isLoading}
              loadingMessage="Loading directory…"
              emptyMessage={pageText("noOneLeftToAdd_0fa3e5")}
              triggerClassName="w-full"
            />

            {selectedSharedAgentName ? (
              <div
                role="note"
                aria-label={pageText("sharedAgentCaution_948dda")}
                data-testid="shared-agent-caution"
                className="flex items-start gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-foreground"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold">{pageText("sharedAgent_50c43e")}</span> {selectedSharedAgentName}{pageText("sMemoryWorkspaceMayCarryResidualPrivateContext_efe8ee")}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView("list");
                  setAddSelection("");
                }}
              >{translateUi("interfaceCopy.back")}</Button>
              <Button size="sm" onClick={submitAdd} disabled={!addSelection || addMutation.isPending}>
                {addMutation.isPending ? pageText("adding_ffb2e6") : pageText("add_61cc55")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pageText("remove_e96390") + " "}{revokeTarget?.subjectDisplayName ?? pageText("thisSubject_01a31c")}{pageText("sSavedGrant_acd7db")}</AlertDialogTitle>
            <AlertDialogDescription>{pageText("thisRemovesThisGrantAndTheAccessIt_05f65f") + " "}<span className="font-semibold">{pageText("not_557f25")}</span>{" " + pageText("eraseContentAlreadySeenOrRetainedInAn_fc757c")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translateUi("interfaceCopy.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (revokeTarget) revokeMutation.mutate(revokeTarget);
              }}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? pageText("removing_579d7e") : pageText("removeGrant_af3be1")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
