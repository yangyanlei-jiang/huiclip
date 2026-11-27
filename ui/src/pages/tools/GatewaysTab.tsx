import { t as interfaceNotice } from "@/i18n";
import { t as translateDynamic } from "../../i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ToolMcpGatewayContextScopeType,
  ToolMcpGatewayTokenAction,
  ToolMcpGatewayTokenCreated,
  ToolMcpGatewayWithTokens,
  ToolProfileWithDetails,
} from "@paperclipai/shared";
import { Check, ChevronDown, Copy, KeyRound, Link as LinkIcon, Plus, RotateCcw, X } from "lucide-react";
import { agentsApi } from "@/api/agents";
import { projectsApi } from "@/api/projects";
import { toolsApi } from "@/api/tools";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import { copyTextToClipboard } from "@/lib/clipboard";
import { LoadingState, RelativeTime, ToolsPageHeader } from "./shared";
import { describeError } from "@/api/errors";

type CreateGatewayDraft = {
  name: string;
  description: string;
  profileId: string;
};

type TokenDraft = {
  name: string;
  clientLabel: string;
  ownerNote: string;
  expiresAt: string;
  allowedActions: ToolMcpGatewayTokenAction[];
};

const defaultTokenDraft = (): TokenDraft => ({
  name: "",
  clientLabel: "",
  ownerNote: "",
  expiresAt: toDateInputValue(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
  allowedActions: ["tools/list", "tools/call"],
});

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function shortId(value: string | null | undefined) {
  if (!value) return null;
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function dateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function latestTokenActivity(gateway: ToolMcpGatewayWithTokens) {
  return gateway.tokens.reduce<Date | null>((latest, token) => {
    const candidate = dateValue(token.lastUsedAt);
    if (!candidate) return latest;
    return !latest || candidate.getTime() > latest.getTime() ? candidate : latest;
  }, null);
}

function formatOwner(gateway: ToolMcpGatewayWithTokens, agentNames: Map<string, string>) {
  if (gateway.agentId) return agentNames.get(gateway.agentId) ?? `Agent ${shortId(gateway.agentId)}`;
  if (gateway.createdByAgentId) {
    return agentNames.get(gateway.createdByAgentId) ?? `Agent ${shortId(gateway.createdByAgentId)}`;
  }
  if (gateway.createdByUserId) return `Board user ${shortId(gateway.createdByUserId)}`;
  return "Board";
}

function formatScope(
  gateway: ToolMcpGatewayWithTokens,
  projectNames: Map<string, string>,
  agentNames: Map<string, string>,
) {
  if (gateway.contextScopeType !== "none" && gateway.contextScopeId) {
    if (gateway.contextScopeType === "project") {
      return `Project ${projectNames.get(gateway.contextScopeId) ?? shortId(gateway.contextScopeId)}`;
    }
    if (gateway.contextScopeType === "agent") {
      return `Agent ${agentNames.get(gateway.contextScopeId) ?? shortId(gateway.contextScopeId)}`;
    }
    return `${gateway.contextScopeType} ${shortId(gateway.contextScopeId)}`;
  }
  if (gateway.projectId) return `Project ${projectNames.get(gateway.projectId) ?? shortId(gateway.projectId)}`;
  if (gateway.issueId) return `Issue ${shortId(gateway.issueId)}`;
  if (gateway.agentId) return `Agent ${agentNames.get(gateway.agentId) ?? shortId(gateway.agentId)}`;
  return "Company";
}

function formatAllowedTools(profile: ToolProfileWithDetails | undefined) {
  if (!profile) return "Profile unavailable";
  const allowed = profile.summary.allowedToolCount;
  if (profile.summary.accessMode === "all_except") {
    return `${pluralize(Math.max(profile.summary.totalToolCount - profile.summary.excludedToolCount, 0), "tool")} allowed`;
  }
  return allowed === 0 ? "No tools allowed" : `${pluralize(allowed, "tool")} allowed`;
}

function formatSnippetConfig(config: Record<string, unknown>) {
  return JSON.stringify(config, null, 2);
}

function buildTokenExpiresAt(value: string) {
  return value ? `${value}T23:59:59.000Z` : null;
}

export function GatewaysTab({ companyId }: { companyId: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateGatewayDraft>({
    name: "",
    description: "",
    profileId: "",
  });
  const [tokenDrafts, setTokenDrafts] = useState<Record<string, TokenDraft>>({});
  const [issuingGatewayId, setIssuingGatewayId] = useState<string | null>(null);
  const [createdTokens, setCreatedTokens] = useState<Record<string, ToolMcpGatewayTokenCreated>>({});
  const [confirmingRevokeTokenId, setConfirmingRevokeTokenId] = useState<string | null>(null);

  const gatewaysQuery = useQuery({
    queryKey: queryKeys.tools.gateways(companyId),
    queryFn: () => toolsApi.listGateways(companyId),
  });
  const profilesQuery = useQuery({
    queryKey: queryKeys.tools.profiles(companyId),
    queryFn: () => toolsApi.listProfiles(companyId),
  });
  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId),
  });
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(companyId, { includeArchived: true }),
    queryFn: () => projectsApi.list(companyId, { includeArchived: true }),
  });
  const gatewaysView = useQueryView(gatewaysQuery);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const profiles = profilesQuery.data?.profiles ?? [];
  const activeProfiles = profiles.filter((profile) => profile.status !== "archived");
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const agentNames = useMemo(() => new Map((agentsQuery.data ?? []).map((agent) => [agent.id, agent.name])), [agentsQuery.data]);
  const projectNames = useMemo(
    () => new Map((projectsQuery.data ?? []).map((project) => [project.id, project.name])),
    [projectsQuery.data],
  );

  const invalidateGateways = () => queryClient.invalidateQueries({ queryKey: queryKeys.tools.gateways(companyId) });

  const createGatewayMutation = useMutation({
    mutationFn: () =>
      toolsApi.createGateway(companyId, {
        name: createDraft.name.trim(),
        description: createDraft.description.trim() || null,
        profileId: createDraft.profileId,
        defaultProfileMode: "gateway_only",
        contextScopeType: "company" satisfies ToolMcpGatewayContextScopeType,
      }),
    onSuccess: async (gateway) => {
      setCreateDraft({ name: "", description: "", profileId: activeProfiles[0]?.id ?? "" });
      setCreating(false);
      pushToast({ title: interfaceNotice("interface:gatewayCreated_c68536"), body: gateway.name, tone: "success" });
      await invalidateGateways();
    },
    onError: (error) => {
      pushToast({ title: interfaceNotice("interface:gatewayWasNotCreated_5f046d"), body: describeError(error).body, tone: "error" });
    },
  });

  const createTokenMutation = useMutation({
    mutationFn: async (gatewayId: string) => {
      const draft = tokenDrafts[gatewayId] ?? defaultTokenDraft();
      return toolsApi.createGatewayToken(companyId, gatewayId, {
        name: draft.name.trim(),
        clientLabel: draft.clientLabel.trim(),
        ownerNote: draft.ownerNote.trim(),
        allowedActions: draft.allowedActions,
        expiresAt: buildTokenExpiresAt(draft.expiresAt),
      });
    },
    onSuccess: async (token) => {
      setCreatedTokens((current) => ({ ...current, [token.gatewayId]: token }));
      setIssuingGatewayId(null);
      setTokenDrafts((current) => ({ ...current, [token.gatewayId]: defaultTokenDraft() }));
      pushToast({ title: interfaceNotice("interface:tokenIssued_7007ea"), body: `${token.name} was created. Copy it now; it will not be shown again.`, tone: "success" });
      await invalidateGateways();
    },
    onError: (error) => {
      pushToast({ title: interfaceNotice("interface:tokenWasNotIssued_7a7caf"), body: describeError(error).body, tone: "error" });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: (tokenId: string) => toolsApi.revokeGatewayToken(companyId, tokenId),
    onSuccess: async (token) => {
      setConfirmingRevokeTokenId(null);
      pushToast({ title: interfaceNotice("interface:tokenRevoked_602c0d"), body: token.name, tone: "success" });
      await invalidateGateways();
    },
    onError: (error) => {
      pushToast({ title: interfaceNotice("interface:tokenWasNotRevoked_7e4125"), body: describeError(error).body, tone: "error" });
    },
  });

  async function copyText(value: string, label: string) {
    try {
      await copyTextToClipboard(value);
      pushToast({ title: interfaceNotice("interface:copiedToClipboard_0e7383"), body: label, tone: "success" });
    } catch (error) {
      pushToast({ title: interfaceNotice("interface:copyFailed_bd5acb"), body: describeError(error).body, tone: "error" });
    }
  }

  function startIssuing(gatewayId: string) {
    setCreatedTokens((current) => {
      const next = { ...current };
      delete next[gatewayId];
      return next;
    });
    setTokenDrafts((current) => ({ ...current, [gatewayId]: current[gatewayId] ?? defaultTokenDraft() }));
    setIssuingGatewayId(gatewayId);
  }

  function submitCreateGateway(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createDraft.profileId) {
      pushToast({ title: interfaceNotice("interface:pickAProfile_5a1058"), body: interfaceNotice("interface:aGatewayNeedsAnAccessProfileBeforeIt_66b147"), tone: "warn" });
      return;
    }
    createGatewayMutation.mutate();
  }

  function submitCreateToken(event: FormEvent<HTMLFormElement>, gatewayId: string) {
    event.preventDefault();
    const draft = tokenDrafts[gatewayId] ?? defaultTokenDraft();
    if (draft.allowedActions.length === 0) {
      pushToast({ title: interfaceNotice("interface:pickTokenActions_5fc26e"), body: interfaceNotice("interface:gatewayTokensNeedAtLeastOneAllowedMCP_ef6da5"), tone: "warn" });
      return;
    }
    createTokenMutation.mutate(gatewayId);
  }

  if (gatewaysQuery.isLoading || gatewaysView.kind === "reconnecting") return <LoadingState label={pageText("loadingGateways_01428d")} />;
  if (gatewaysView.kind === "error") {
    return (
      <QueryErrorState
        error={gatewaysQuery.error}
        action="load gateways"
        onRetry={gatewaysView.retry}
        retrying={gatewaysView.isFetching}
      />
    );
  }

  const gateways = gatewaysQuery.data?.gateways ?? [];
  const profileLoading = profilesQuery.isLoading;
  const createDisabled = profileLoading || activeProfiles.length === 0 || createGatewayMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ToolsPageHeader
          title={pageText("namedMCPGateways_a2460c")}
          description={pageText("stableEndpointsForExternalClientsThatUseThe_9af505")}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCreateDraft((current) => ({ ...current, profileId: current.profileId || activeProfiles[0]?.id || "" }));
            setCreating((value) => !value);
          }}
          disabled={profileLoading}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />{pageText("createGateway_857f02")}</Button>
      </div>

      {creating ? (
        <form className="space-y-3 rounded-md border border-border p-4" onSubmit={submitCreateGateway}>
          <div className="grid gap-3 md:grid-cols-(--gtc-60)">
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-medium text-muted-foreground">{pageText("gatewayName_b7652d")}</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createDraft.name}
                onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder={pageText("engineeringLaptops_0dbac0")}
                required
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-medium text-muted-foreground">{pageText("accessProfile_e59e8b")}</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createDraft.profileId}
                onChange={(event) => setCreateDraft((current) => ({ ...current, profileId: event.target.value }))}
                required
                disabled={activeProfiles.length === 0}
              >
                <option value="" disabled>
                  {profileLoading ? pageText("loadingProfiles_7b1f2b") : pageText("chooseAProfile_f47537")}
                </option>
                {activeProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} - {formatAllowedTools(profile)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">{translateUi("interfaceCopy.description")}</span>
            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={createDraft.description}
              onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder={pageText("whoThisEndpointIsForAndWhenIt_7a01fc")}
            />
          </label>
          {activeProfiles.length === 0 && !profileLoading ? (
            <p className="text-xs text-muted-foreground">{pageText("createAnAccessProfileBeforeAddingAGateway_efe6a9")}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>{translateUi("interfaceCopy.cancel")}</Button>
            <Button type="submit" size="sm" disabled={createDisabled || !createDraft.name.trim() || !createDraft.profileId}>
              {createGatewayMutation.isPending ? pageText("creating_28ea76") : pageText("createGateway_857f02")}
            </Button>
          </div>
        </form>
      ) : null}

      {gateways.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">{pageText("noNamedGatewaysYetCreateOneHereThen_aa645e")}</div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {gateways.map((gateway) => {
            const endpoint = `${origin}${gateway.endpointPath}`;
            const snippets = gateway.clientSnippets ?? [];
            const profile = profileById.get(gateway.profileId);
            const lastActivity = latestTokenActivity(gateway);
            const tokenDraft = tokenDrafts[gateway.id] ?? defaultTokenDraft();
            const createdToken = createdTokens[gateway.id];
            return (
              <section key={gateway.id} className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="truncate text-sm font-semibold text-foreground">{gateway.name}</h3>
                      <span className="text-xs text-muted-foreground">{gateway.status}</span>
                    </div>
                    {gateway.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{gateway.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void copyText(endpoint, "Gateway endpoint")}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />{pageText("copyEndpoint_fc35e5")}</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => startIssuing(gateway.id)}>
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" />{pageText("issueToken_9f0343")}</Button>
                  </div>
                </div>

                <div className="break-all rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                  {endpoint}
                </div>

                <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{translateUi("interfaceCopy.owner")}</dt>
                    <dd className="mt-0.5 text-foreground">{formatOwner(gateway, agentNames)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{translateUi("interfaceCopy.scope")}</dt>
                    <dd className="mt-0.5 text-foreground">{formatScope(gateway, projectNames, agentNames)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{pageText("allowedTools_36b466")}</dt>
                    <dd className="mt-0.5 text-foreground">
                      {profile ? `${formatAllowedTools(profile)} via ${profile.name}` : `Profile ${shortId(gateway.profileId)}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{pageText("lastActivity_1c73b8")}</dt>
                    <dd className="mt-0.5 text-foreground">
                      {lastActivity ? <RelativeTime value={lastActivity} /> : pageText("neverUsed_984ec5")}
                    </dd>
                  </div>
                </dl>

                {issuingGatewayId === gateway.id ? (
                  <form className="space-y-3 rounded-md border border-border p-3" onSubmit={(event) => submitCreateToken(event, gateway.id)}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        <span className="text-xs font-medium text-muted-foreground">{pageText("tokenName_b031b8")}</span>
                        <input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tokenDraft.name}
                          onChange={(event) =>
                            setTokenDrafts((current) => ({
                              ...current,
                              [gateway.id]: { ...tokenDraft, name: event.target.value },
                            }))
                          }
                          placeholder={pageText("dottaSMacBook_904c3f")}
                          required
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="text-xs font-medium text-muted-foreground">{pageText("clientLabel_f696bb")}</span>
                        <input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tokenDraft.clientLabel}
                          onChange={(event) =>
                            setTokenDrafts((current) => ({
                              ...current,
                              [gateway.id]: { ...tokenDraft, clientLabel: event.target.value },
                            }))
                          }
                          placeholder={pageText("cursorOnWorkLaptop_524ff8")}
                          required
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <label className="space-y-1.5 text-sm">
                        <span className="text-xs font-medium text-muted-foreground">{pageText("ownerNote_d94186")}</span>
                        <input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tokenDraft.ownerNote}
                          onChange={(event) =>
                            setTokenDrafts((current) => ({
                              ...current,
                              [gateway.id]: { ...tokenDraft, ownerNote: event.target.value },
                            }))
                          }
                          placeholder={pageText("whoOwnsThisTokenAndWhyItExists_f2f085")}
                          required
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="text-xs font-medium text-muted-foreground">{translateUi("interfaceCopy.expires")}</span>
                        <input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          type="date"
                          value={tokenDraft.expiresAt}
                          onChange={(event) =>
                            setTokenDrafts((current) => ({
                              ...current,
                              [gateway.id]: { ...tokenDraft, expiresAt: event.target.value },
                            }))
                          }
                          required
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {(["tools/list", "tools/call"] as ToolMcpGatewayTokenAction[]).map((action) => (
                        <label key={action} className="flex items-center gap-2 text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={tokenDraft.allowedActions.includes(action)}
                            onChange={(event) => {
                              const next = event.target.checked
                                ? Array.from(new Set([...tokenDraft.allowedActions, action]))
                                : tokenDraft.allowedActions.filter((item) => item !== action);
                              setTokenDrafts((current) => ({ ...current, [gateway.id]: { ...tokenDraft, allowedActions: next } }));
                            }}
                          />
                          {action}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIssuingGatewayId(null)}>{translateUi("interfaceCopy.cancel")}</Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={
                          createTokenMutation.isPending ||
                          !tokenDraft.name.trim() ||
                          !tokenDraft.clientLabel.trim() ||
                          !tokenDraft.ownerNote.trim() ||
                          !tokenDraft.expiresAt
                        }
                      >
                        {createTokenMutation.isPending ? pageText("issuing_034779") : pageText("issueToken_9f0343")}
                      </Button>
                    </div>
                  </form>
                ) : null}

                {createdToken ? (
                  <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-foreground">{pageText("newTokenFor_100d4a") + " "}{createdToken.name}</div>
                      <Button type="button" variant="outline" size="sm" onClick={() => void copyText(createdToken.token, "Gateway bearer token")}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />{pageText("copyToken_b3db22")}</Button>
                    </div>
                    <div className="break-all rounded bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                      {createdToken.token}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <KeyRound className="h-3.5 w-3.5" />{pageText("tokens_c38c6c")}</div>
                    <div className="space-y-1 text-sm">
                      {gateway.tokens.length === 0 ? (
                        <p className="text-muted-foreground">{pageText("noTokensIssued_254e2f")}</p>
                      ) : (
                        gateway.tokens.map((token) => {
                          const revoked = Boolean(token.revokedAt);
                          const confirming = confirmingRevokeTokenId === token.id;
                          return (
                            <div key={token.id} className="space-y-1 py-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-foreground">{token.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {token.clientLabel || token.tokenPrefix} · {token.allowedActions.join(", ")}
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {token.revokedAt ? (
                                      <>{pageText("revoked_8375cd") + " "}<RelativeTime value={token.revokedAt} />
                                      </>
                                    ) : token.expiresAt ? (
                                      <>{pageText("expires_ac3c39") + " "}<RelativeTime value={token.expiresAt} />
                                      </>
                                    ) : (
                                      pageText("noExpiry_784626")
                                    )}
                                  </span>
                                  {!revoked ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                      onClick={() => setConfirmingRevokeTokenId(token.id)}
                                      aria-label={translateDynamic("dynamic:revoke", { value1: token.name })}
                                    >
                                      <RotateCcw className="mr-1 h-3.5 w-3.5" />{pageText("revoke_0be720")}</Button>
                                  ) : null}
                                </div>
                              </div>
                              {confirming ? (
                                <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
                                  <span>{pageText("revokeThisTokenNow_6342b1")}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => setConfirmingRevokeTokenId(null)}
                                  >
                                    <X className="mr-1 h-3.5 w-3.5" />{pageText("cancel_77dfd2")}</Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => revokeTokenMutation.mutate(token.id)}
                                    disabled={revokeTokenMutation.isPending}
                                  >
                                    <Check className="mr-1 h-3.5 w-3.5" />{pageText("confirm_04a212")}</Button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">{pageText("clientSnippets_088b2b")}</div>
                    <div className="space-y-1 text-sm">
                      {snippets.length === 0 ? (
                        <p className="text-muted-foreground">{pageText("noSnippetsAvailable_4c5acf")}</p>
                      ) : (
                        snippets.map((snippet) => (
                          <details key={snippet.client} className="rounded px-2 py-1 open:bg-muted/40">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                              <span className="flex min-w-0 items-center gap-2 text-foreground">
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{snippet.label}</span>
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={(event) => {
                                  event.preventDefault();
                                  void copyText(formatSnippetConfig(snippet.config), `${snippet.label} snippet`);
                                }}
                              >
                                <Copy className="mr-1 h-3.5 w-3.5" />{pageText("copy_af74f7")}</Button>
                            </summary>
                            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 text-xs text-muted-foreground">
                              {formatSnippetConfig(snippet.config)}
                            </pre>
                            {snippet.notes.length > 0 ? (
                              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {snippet.notes.map((note) => (
                                  <div key={note}>{note}</div>
                                ))}
                              </div>
                            ) : null}
                          </details>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
