import { controlText } from "@/i18n/controls";
import { t as interfaceNotice } from "@/i18n";
import { t as interfaceMessage } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { accessApi } from "@/api/access";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { Link } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";
import { copyTextToClipboard } from "@/lib/clipboard";
import { Badge } from "@/components/ui/badge";
import { describeError } from "@/api/errors";

const inviteRoleOptions = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view organization work and follow along.",
    gets: "View-only organization membership.",
  },
  {
    value: "operator",
    label: "Operator",
    description: "Can edit organization work and invite people.",
    gets: "Full editing and audit access. Cannot approve join requests or manage member permissions.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Recommended for operators who need to invite people, create agents, and approve joins.",
    gets: "Can create agents, invite users, assign tasks, and approve join requests.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Full organization access, including membership management.",
    gets: "Everything in Admin, plus managing members.",
  },
] as const;

const INVITE_HISTORY_PAGE_SIZE = 5;

function isInviteHistoryRow(value: unknown): value is Awaited<ReturnType<typeof accessApi.listInvites>>["invites"][number] {
  if (!value || typeof value !== "object") return false;
  return "id" in value && "state" in value && "createdAt" in value;
}

/** The Invites tab of the Members page (extracted from the former standalone Invites page). */
export function InvitesSection() {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const { selectedCompanyId } = useCompany();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [humanRole, setHumanRole] = useState<"owner" | "admin" | "operator" | "viewer">("operator");
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [latestInviteCopied, setLatestInviteCopied] = useState(false);
  const latestInviteInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!latestInviteCopied) return;
    const timeout = window.setTimeout(() => {
      setLatestInviteCopied(false);
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [latestInviteCopied]);

  function selectLatestInviteUrl() {
    latestInviteInputRef.current?.focus();
    latestInviteInputRef.current?.select();
  }

  async function copyText(text: string, unavailableBody: string, afterFallback?: () => void) {
    try {
      await copyTextToClipboard(text);
      return true;
    } catch {
      afterFallback?.();
    }
    pushToast({
      title: interfaceNotice("interface:clipboardUnavailable_bec46a"),
      body: unavailableBody,
      tone: "warn",
    });
    return false;
  }

  async function copyInviteUrl(url: string) {
    return copyText(url, "The invite URL is selected. Copy it manually from the field.", selectLatestInviteUrl);
  }

  const inviteHistoryQueryKey = queryKeys.access.invites(selectedCompanyId ?? "", "all", INVITE_HISTORY_PAGE_SIZE);
  const invitesQuery = useInfiniteQuery({
    queryKey: inviteHistoryQueryKey,
    queryFn: ({ pageParam }) =>
      accessApi.listInvites(selectedCompanyId!, {
        limit: INVITE_HISTORY_PAGE_SIZE,
        offset: pageParam,
      }),
    enabled: !!selectedCompanyId,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
  const invitesView = useQueryView(invitesQuery);
  const inviteHistory = useMemo(
    () =>
      invitesQuery.data?.pages.flatMap((page) =>
        Array.isArray(page?.invites) ? page.invites.filter(isInviteHistoryRow) : [],
      ) ?? [],
    [invitesQuery.data?.pages],
  );

  const createInviteMutation = useMutation({
    mutationFn: () =>
      accessApi.createCompanyInvite(selectedCompanyId!, {
        allowedJoinTypes: "human",
        humanRole,
        agentMessage: null,
      }),
    onSuccess: async (invite) => {
      setLatestInviteUrl(invite.inviteUrl);
      setLatestInviteCopied(false);
      const copied = await copyText(invite.inviteUrl, "Copy the invite URL manually from the field below.");

      await queryClient.invalidateQueries({ queryKey: inviteHistoryQueryKey });
      pushToast({
        title: interfaceNotice("interface:inviteCreated_043e58"),
        body: copied ? interfaceNotice("interface:inviteReadyBelowAndCopiedToClipboard_5733cb") : interfaceNotice("interface:inviteReadyBelow_a9e6eb"),
        tone: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: interfaceMessage("interface:errorFailedToCreateInvite"),
        body: describeError(error).body,
        tone: "error",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => accessApi.revokeInvite(inviteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inviteHistoryQueryKey });
      pushToast({ title: interfaceNotice("interface:inviteRevoked_4e6cdd"), tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: interfaceMessage("interface:errorFailedToRevokeInvite"),
        body: describeError(error).body,
        tone: "error",
      });
    },
  });

  if (!selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">{pageText("selectAnOrganizationToManageInvites_b2e7b0")}</div>;
  }

  if (invitesQuery.isLoading || invitesView.kind === "reconnecting") {
    return <div className="text-sm text-muted-foreground">{pageText("loadingInvites_ef01ab")}</div>;
  }

  if (invitesView.kind === "error") {
    if (invitesView.errorKind === "forbidden") {
      return <div className="text-sm text-destructive">{pageText("youDoNotHavePermissionToManageOrganization_ca4d8d")}</div>;
    }
    return (
      <QueryErrorState
        size="page"
        error={invitesQuery.error}
        action="load invites"
        onRetry={invitesView.retry}
        retrying={invitesView.isFetching}
      />
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <p className="max-w-3xl text-sm text-muted-foreground">{pageText("invitePeopleToRequestAccessToThisOrganization_b0ebe2")}</p>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{pageText("inviteAPerson_62d12c")}</h2>
          <p className="text-sm text-muted-foreground">{pageText("generateAHumanInviteLinkAndChooseThe_9b3ad4")}</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{pageText("chooseARole_215ccf")}</legend>
          <div className="rounded-xl border border-border">
            {inviteRoleOptions.map((option, index) => {
              const checked = humanRole === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 px-4 py-4 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <input
                    type="radio"
                    name="invite-role"
                    value={option.value}
                    checked={checked}
                    onChange={() => setHumanRole(option.value)}
                    className="mt-1 h-4 w-4 border-border text-foreground"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{controlText(option.label)}</span>
                      {option.value === "operator" ? (
                        <Badge variant="outline" className="border-border text-muted-foreground">{translateUi("interfaceCopy.default")}</Badge>
                      ) : null}
                    </span>
                    <span className="block max-w-2xl text-sm text-muted-foreground">{controlText(option.description)}</span>
                    <span className="block text-sm text-foreground">{controlText(option.gets)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">{pageText("eachInviteLinkIsSingleUseHumanInvitees_ab5c70")}</div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending}>
            {createInviteMutation.isPending ? pageText("creating_94d7d8") : pageText("createInvite_a84046")}
          </Button>
          <span className="text-sm text-muted-foreground">{pageText("inviteHistoryBelowKeepsTheAuditTrail_aaf0a3")}</span>
        </div>

        {latestInviteUrl ? (
          <div className="space-y-3 rounded-lg border border-border px-4 py-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{pageText("latestInviteLink_ee61f2")}</div>
                {latestInviteCopied ? (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                    <Check className="h-3.5 w-3.5" />{pageText("copied_8e3df4")}</div>
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground">{pageText("thisURLIncludesTheCurrentPaperclipDomainReturned_1639d6")}</div>
            </div>
            <label className="block space-y-1">
              <span className="sr-only">{pageText("latestInviteURL_fca799")}</span>
              <input
                ref={latestInviteInputRef}
                readOnly
                value={latestInviteUrl}
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
                className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors selection:bg-primary selection:text-primary-foreground focus:border-ring"
                aria-label={pageText("latestInviteURL_fca799")}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  const copied = await copyInviteUrl(latestInviteUrl);
                  setLatestInviteCopied(copied);
                }}
              >
                <Copy className="h-4 w-4" />{pageText("copyLink_2f84ee")}</Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">{pageText("inviteHistory_cbc505")}</h2>
            <p className="text-sm text-muted-foreground">{pageText("reviewInviteStatusAudienceInviterAndAnyLinked_e0c2fd")}</p>
          </div>
          <Link to="/inbox/requests" className="text-sm underline underline-offset-4">{pageText("openJoinRequestQueue_33d927")}</Link>
        </div>

        {inviteHistory.length === 0 ? (
          <div className="border-t border-border px-5 py-8 text-sm text-muted-foreground">{pageText("noInvitesHaveBeenCreatedForThisOrganization_5f60f3")}</div>
        ) : (
          <div className="border-t border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 font-medium text-muted-foreground">{translateUi("interfaceCopy.state")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{pageText("for_f78806")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{translateUi("interfaceCopy.invitedBy")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{translateUi("interfaceCopy.created")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{pageText("joinRequest_83934b")}</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">{translateUi("interfaceCopy.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteHistory.map((invite) => (
                    <tr key={invite.id} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-3 align-top">
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {formatInviteState(invite.state)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 align-top">{formatInviteAudience(invite)}</td>
                      <td className="px-5 py-3 align-top">
                        <div>{invite.invitedByUser?.name || invite.invitedByUser?.email || pageText("unknownInviter_d7fa44")}</div>
                        {invite.invitedByUser?.email && invite.invitedByUser.name ? (
                          <div className="text-xs text-muted-foreground">{invite.invitedByUser.email}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 align-top text-muted-foreground">
                        {new Date(invite.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 align-top">
                        {invite.relatedJoinRequestId ? (
                          <Link to="/inbox/requests" className="underline underline-offset-4">{pageText("reviewRequest_525f17")}</Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right align-top">
                        {invite.state === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeMutation.mutate(invite.id)}
                            disabled={revokeMutation.isPending}
                          >{pageText("revoke_0be720")}</Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{translateUi("interfaceCopy.inactive")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invitesQuery.hasNextPage ? (
              <div className="flex justify-center border-t border-border px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => invitesQuery.fetchNextPage()}
                  disabled={invitesQuery.isFetchingNextPage}
                >
                  {invitesQuery.isFetchingNextPage ? pageText("loadingMore_713bdc") : pageText("viewMore_e3c5fa")}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function formatInviteState(state: "active" | "accepted" | "expired" | "revoked") {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function formatInviteAudience(invite: Awaited<ReturnType<typeof accessApi.listInvites>>["invites"][number]) {
  if (invite.allowedJoinTypes === "agent") return "Agent";
  if (invite.allowedJoinTypes === "both") return invite.humanRole ? `Human or agent · ${invite.humanRole}` : "Human or agent";
  return invite.humanRole ?? "Human";
}
