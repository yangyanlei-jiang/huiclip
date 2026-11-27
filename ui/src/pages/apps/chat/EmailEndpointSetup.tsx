import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { isUuidLike } from "@paperclipai/shared";
import { ApiError } from "@/api/client";
import { describeError } from "@/api/errors";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { AgentMailCredentialField } from "@/features/connections/AgentMailCredentialField";
import { AgentMailApiKeyField } from "@/features/connections/AgentMailApiKeyField";
import { useEmailAddressCheck } from "@/features/connections/useEmailAddressCheck";
import { ChatSetupNavigation } from "@/components/chat/ChatSetupNavigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Mail,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useNavigate, useSearchParams, Link } from "@/lib/router";
import { agentsApi } from "@/api/agents";
import { issuesApi } from "@/api/issues";
import { projectsApi } from "@/api/projects";
import { toolsApi } from "@/api/tools";
import { emailApi } from "@/api/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { CopyText } from "@/components/CopyText";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { AgentSelect } from "@/components/AgentMultiSelect";
import { TrustPresetSection } from "@/components/TrustPresetSection";
import { EmailSafetyNotice } from "@/components/EmailSafetyNotice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTrustPreset,
  getLowTrustBoundary,
  lowTrustBoundaryHasScope,
} from "@/lib/trust-policy-ui";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AgentPermissions,
  EmailEndpointSummary,
} from "@paperclipai/shared";
const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

interface EmailSetupDraft {
  connectionId: string; step: 0 | 1; agentId: string; requestId: string;
  addressMode: "new" | "existing"; inboxId: string; username: string; domain: string;
  mode: "websocket" | "webhook";
  domainSelected: boolean;
  takenAddresses: string[];
  allowInboxKey: boolean;
  selectedCredentialId: string | null;
}
function readEmailSetupDraft(key: string): Partial<EmailSetupDraft> {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "{}");
    if (!value || typeof value !== "object") return {};
    const draft: Partial<EmailSetupDraft> = {};
    for (const field of ["connectionId", "agentId", "inboxId", "username", "domain"] as const) {
      if (typeof value[field] === "string") draft[field] = value[field];
    }
    if (value.step === 0 || value.step === 1) draft.step = value.step;
    if (typeof value.requestId === "string" && isUuidLike(value.requestId)) draft.requestId = value.requestId;
    if (value.addressMode === "new" || value.addressMode === "existing") draft.addressMode = value.addressMode;
    if (value.mode === "websocket" || value.mode === "webhook") draft.mode = value.mode;
    if (value.selectedCredentialId === null || typeof value.selectedCredentialId === "string") draft.selectedCredentialId = value.selectedCredentialId;
    if (typeof value.allowInboxKey === "boolean") draft.allowInboxKey = value.allowInboxKey;
    if (typeof value.domainSelected === "boolean") draft.domainSelected = value.domainSelected;
    if (Array.isArray(value.takenAddresses)) draft.takenAddresses = value.takenAddresses
      .filter((address: unknown): address is string => typeof address === "string" && address.length <= 320).slice(-20);
    return draft;
  } catch { return {}; }
}

export function EmailEndpointSetup() {
  const { t: pageText } = usePageTranslation("interface");
  const { selectedCompanyId } = useCompany();
  const [params] = useSearchParams();
  if (!selectedCompanyId) return <p role="status" className="p-6 text-sm text-muted-foreground">{pageText("loadingEmailSetup_882396")}</p>;
  return <EmailEndpointSetupForm key={`${selectedCompanyId}:${params.get("resume") ?? params.get("setupId") ?? params.get("connectionId") ?? "new"}:${params.get("agentId") ?? "choose"}`} companyId={selectedCompanyId} />;
}

function EmailEndpointSetupForm({ companyId }: { companyId: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const resumeId = params.get("resume");
  const setupId = params.get("setupId");
  const draftKey = `paperclip.agentmail-setup:${companyId}:${resumeId ?? setupId ?? params.get("connectionId") ?? "new"}:${params.get("agentId") ?? "choose"}`;
  const [draft] = useState(() => {
    const saved = readEmailSetupDraft(draftKey);
    // A Finish setup link always names its original inbox, including when an
    // older client accidentally stored a replacement under that resume key.
    return resumeId && saved.requestId && saved.requestId !== resumeId ? {} : saved;
  });
  const [connectionId, setConnectionId] = useState(draft.connectionId ?? params.get("connectionId") ?? "");
  const [step, setStep] = useState<0 | 1 | 2>(draft.step ?? (resumeId ? 1 : 0));
  const [agentId, setAgentId] = useState(draft.agentId ?? params.get("agentId") ?? "");
  const [apiKey, setApiKey] = useState("");
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(draft.selectedCredentialId !== undefined ? draft.selectedCredentialId : connectionId || null);
  const [restrictedInbox, setRestrictedInbox] = useState("");
  const [allowInboxKey, setAllowInboxKey] = useState(draft.allowInboxKey ?? false);
  const [requestId] = useState(() => draft.requestId ?? resumeId ?? (setupId && isUuidLike(setupId) ? setupId : crypto.randomUUID()));
  const [addressMode, setAddressMode] = useState<"new" | "existing">(draft.addressMode ?? "new");
  const [inboxId, setInboxId] = useState(draft.inboxId ?? "");
  const [username, setUsername] = useState(draft.username ?? "");
  const [domain, setDomain] = useState(draft.domain ?? "agentmail.to");
  const [domainSelected, setDomainSelected] = useState(draft.domainSelected ?? (!!draft.domain && draft.domain !== "agentmail.to"));
  const [takenAddresses, setTakenAddresses] = useState<string[]>(draft.takenAddresses ?? []);
  const [mode, setMode] = useState<"websocket" | "webhook">(draft.mode ?? "websocket");
  const [trustOpen, setTrustOpen] = useState(false);
  const [permissions, setPermissions] = useState<Partial<AgentPermissions>>({});
  const suggestedUsername = useRef(false);
  useEffect(() => {
    if (!companyId) return;
    // Save progress, never the API key. The same request ID resumes partial setup.
    try {
      if (step === 2) sessionStorage.removeItem(draftKey);
      else sessionStorage.setItem(draftKey, JSON.stringify({ connectionId, step, agentId,
        requestId, addressMode, inboxId, username, domain, domainSelected, takenAddresses, mode, allowInboxKey, selectedCredentialId }));
    } catch { /* Setup remains usable when browser storage is unavailable. */ }
  }, [companyId, draftKey, connectionId, step, agentId, requestId, addressMode, inboxId, username, domain, domainSelected, takenAddresses, mode, allowInboxKey, selectedCredentialId]);
  const agents = useQuery({ queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId), enabled: !!companyId });
  const agentsView = useQueryView(agents);
  const projects = useQuery({ queryKey: queryKeys.projects.list(companyId),
    queryFn: () => projectsApi.list(companyId), enabled: !!companyId && trustOpen });
  const projectsView = useQueryView(projects);
  const boundaryIssues = useQuery({ queryKey: ["email-boundary-issues", companyId],
    queryFn: () => issuesApi.list(companyId), enabled: !!companyId && trustOpen });
  const boundaryIssuesView = useQueryView(boundaryIssues);
  const chosen = agents.data?.find(a => a.id === agentId);
  const lowTrust = getTrustPreset(chosen?.permissions) === "low_trust_review";
  const scoped = lowTrustBoundaryHasScope(getLowTrustBoundary(chosen?.permissions));
  const inspected = useQuery({ queryKey: ["email-credential-inspect", companyId, connectionId],
    queryFn: () => emailApi.inspectSaved(companyId, connectionId),
    enabled: !!companyId && !!connectionId });
  const inspectedView = useQueryView(inspected);
  const inboxes = useQuery({ queryKey: ["email-inboxes", companyId],
    queryFn: () => emailApi.list(companyId), enabled: !!companyId });
  const inboxesView = useQueryView(inboxes);
  const inboxesLoaded = inboxesView.kind === "ready" || inboxesView.kind === "stale";
  // A provider failure can leave an inbox allocated under this request. Resume
  // that exact endpoint; its agent and address are already fixed server-side.
  const pendingEndpoint = inboxes.data?.find(i => i.id === requestId && i.status !== "archived");
  const pendingAddress = pendingEndpoint?.address;
  const resumeAccount = useQuery({
    queryKey: ["email-resume-account", companyId, pendingEndpoint?.connectionId],
    queryFn: () => toolsApi.getConnection(pendingEndpoint!.connectionId),
    enabled: !!resumeId && requestId === resumeId && !!pendingEndpoint && !connectionId,
  });
  const resumeAccountView = useQueryView(resumeAccount);
  useEffect(() => {
    if (!resumeId || !pendingEndpoint || connectionId || !resumeAccount.isSuccess) return;
    const savedAccount = resumeAccount.data?.config?.credentialConnectionId;
    if (typeof savedAccount === "string") setConnectionId(savedAccount);
    else setStep(0);
    setMode(pendingEndpoint.receiveMode);
  }, [resumeId, pendingEndpoint, connectionId, resumeAccount.isSuccess, resumeAccount.data]);
  useEffect(() => {
    if (pendingEndpoint) setAgentId(pendingEndpoint.assignedAgentId);
  }, [pendingEndpoint]);
  const scopedKey = inspected.data?.scope.scope_type === "inbox";
  const customDomains = [...new Set(inspected.data?.domains
    .filter(d => d.status === "VERIFIED" && d.domain.toLowerCase() !== "agentmail.to")
    .map(d => d.domain.toLowerCase()) ?? [])];
  const defaultDomain = customDomains[0] ?? "agentmail.to";
  useEffect(() => {
    if (inspected.isSuccess && !domainSelected && !pendingAddress) setDomain(defaultDomain);
  }, [inspected.isSuccess, domainSelected, pendingAddress, defaultDomain]);
  useEffect(() => {
    if (!scopedKey || !inboxesLoaded) return;
    if (pendingAddress || allowInboxKey) {
      setAddressMode("existing");
      setInboxId(inspected.data?.inboxes[0]?.inbox_id ?? "");
    } else if (step === 1) {
      // Old drafts must recover at the key choice, not return to a locked form.
      setRestrictedInbox(inspected.data?.inboxes[0]?.inbox_id ?? "this inbox");
      setSelectedCredentialId(null);
      setStep(0);
    }
  }, [scopedKey, inspected.data, inboxesLoaded, pendingAddress, allowInboxKey, step]);
  useEffect(() => {
    if (chosen && !suggestedUsername.current) {
      suggestedUsername.current = true;
      if (!username) setUsername(chosen.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 64));
    }
  }, [chosen, username]);
  const connect = useMutation({
    mutationFn: async () => {
      if (pendingAddress) return true;
      const details = selectedCredentialId
        ? await emailApi.inspectSaved(companyId, selectedCredentialId)
        : await emailApi.inspect(companyId, apiKey.trim());
      if (details.scope.scope_type === "inbox" && !allowInboxKey) {
        setRestrictedInbox(details.inboxes[0]?.inbox_id ?? "this inbox");
        return false;
      }
      const changingAccount = !!connectionId && selectedCredentialId !== connectionId;
      const nextRequestId = changingAccount ? crypto.randomUUID() : requestId;
      let id = selectedCredentialId;
      if (!id) {
        const result = await emailApi.connect(companyId, {
          apiKey: apiKey.trim(), grantKind: "organization", allAgents: false,
          agentIds: [agentId], idempotencyKey: nextRequestId,
        });
        id = result.id;
      }
      cache.setQueryData(["email-credential-inspect", companyId, id], details);
      setSelectedCredentialId(id);
      setApiKey("");
      void cache.invalidateQueries({ queryKey: ["email-credentials", companyId] });
      void cache.invalidateQueries({ queryKey: queryKeys.tools.connections(companyId) });
      if (changingAccount) {
        // Save the replacement credential before retiring the original draft.
        // A failed save/cleanup leaves the original URL recoverable; a completed
        // switch gets its own URL so refreshing cannot revive an archived draft.
        if (pendingEndpoint) {
          await emailApi.control(pendingEndpoint.id, "remove");
          await cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
        }
        openDraft({
          connectionId: id, selectedCredentialId: id, agentId, step: 1,
          requestId: nextRequestId, addressMode: details.scope.scope_type === "inbox" ? "existing" : "new",
          inboxId: details.scope.scope_type === "inbox" ? details.inboxes[0]?.inbox_id ?? "" : "",
          username, domain: "agentmail.to", domainSelected: false, takenAddresses: [], mode, allowInboxKey,
        });
        return false;
      }
      setConnectionId(id);
      setRestrictedInbox("");
      setAddressMode(details.scope.scope_type === "inbox" ? "existing" : "new");
      if (details.scope.scope_type === "inbox") setInboxId(details.inboxes[0]?.inbox_id ?? "");
      return true;
    },
    onSuccess: ready => { if (ready) setStep(1); },
  });
  function selectCredential(id: string) {
    setSelectedCredentialId(id);
    setApiKey("");
    setRestrictedInbox("");
    setAllowInboxKey(false);
    setDomainSelected(false);
    setTakenAddresses([]);
    connect.reset();
  }
  const agentDetail = useQuery({ queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => agentsApi.get(agentId), enabled: !!agentId && trustOpen });
  const agentDetailView = useQueryView(agentDetail);
  const trust = useMutation({
    mutationFn: () => agentsApi.updatePermissions(agentId, {
      ...permissions,
      canCreateAgents: permissions.canCreateAgents ?? false,
      canCreateSkills: permissions.canCreateSkills ?? true,
      canAssignTasks: agentDetail.data?.access?.canAssignTasks ?? false,
    }, companyId),
    onSuccess: () => {
      setTrustOpen(false);
      void cache.invalidateQueries({ queryKey: queryKeys.agents.list(companyId) });
    },
  });
  const setup = useMutation({
    mutationFn: () => emailApi.setup(companyId, {
      assignedAgentId: agentId, credentialConnectionId: connectionId,
      ...(pendingAddress ? { inboxId: pendingAddress } : addressMode === "existing" ? { inboxId } : { username, domain }),
      receiveMode: mode, idempotencyKey: requestId,
    }),
    onError: async (error) => {
      if (error instanceof ApiError && (error.body as { code?: string } | null)?.code === "agentmail_address_taken") {
        setTakenAddresses(previous => [...new Set([...previous, `${username}@${domain}`.toLowerCase()])].slice(-20));
      }
      await cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
      void cache.invalidateQueries({ queryKey: queryKeys.chatEndpoints.list(companyId) });
      void cache.invalidateQueries({ queryKey: queryKeys.tools.connections(companyId) });
      void cache.invalidateQueries({ queryKey: queryKeys.tools.connectionInstalls(connectionId) });
      setStep(2);
    },
  });
  const address = pendingAddress ?? (addressMode === "existing" ? inboxId : `${username}@${domain}`);
  const knownAddresses = new Set([...takenAddresses, ...(inspected.data?.inboxes.map(i => i.inbox_id.toLowerCase()) ?? [])]);
  const checkingNewAddress = step === 1 && addressMode === "new" && !pendingAddress && !scopedKey;
  const knownAddress = checkingNewAddress && knownAddresses.has(address.toLowerCase());
  const validUsername = /^[a-z0-9][a-z0-9._-]*$/.test(username) && username.length <= 64;
  const addressCheck = useEmailAddressCheck(companyId, connectionId, username, domain,
    checkingNewAddress && validUsername && !!inspected.data && !knownAddress);
  const addressTaken = knownAddress || addressCheck.result?.status === "taken";
  const suggestions = checkingNewAddress && validUsername && (addressTaken || addressCheck.result?.status === "unknown")
    ? ["-agent", "-team", `-${requestId.slice(0, 6)}`]
      .map(suffix => `${username.slice(0, 64 - suffix.length)}${suffix}`)
      .filter(name => !knownAddresses.has(`${name}@${domain}`)) : [];
  const assignedInbox = addressMode === "existing" && inboxes.data?.some(i => i.id !== requestId && i.address === address && i.status !== "archived");
  const addressError = addressTaken ? "This email address is already in use. Choose a different address."
    : assignedInbox ? "This inbox is already assigned to an agent." : null;
  const writeError = connect.error ?? (!addressTaken ? setup.error : null);
  const readFailure = resumeAccountView.kind === "error" ? resumeAccountView
    : inspectedView.kind === "error" ? inspectedView
    : agentsView.kind === "error" ? agentsView : null;
  const setupError = writeError ? <p role="alert" className="text-sm text-destructive">{describeError(writeError).body}</p>
    : readFailure ? <QueryErrorState size="inline" error={readFailure.error} action="load email setup" onRetry={readFailure.retry} retrying={readFailure.isFetching} />
    : null;
  const busy = connect.isPending || setup.isPending;
  const identityReady = inboxesLoaded && (!resumeId || requestId !== resumeId || !!pendingEndpoint) && (!pendingEndpoint || pendingEndpoint.assignedAgentId === agentId);
  const canContinue = identityReady && !!chosen && !busy && !(lowTrust && !scoped) && (!!pendingAddress || !!selectedCredentialId || !!apiKey.trim());
  const canCreate = identityReady && !!chosen && !busy && !!inspected.data && !(lowTrust && !scoped) && !addressError && !addressCheck.checking
    && (!!pendingAddress || (addressMode === "existing" ? !!inboxId : validUsername));
  const openTrust = () => { if (chosen) { setPermissions(chosen.permissions); setTrustOpen(true); } };
  const leave = () => navigate(`/apps/chat/${setup.data?.id ?? pendingEndpoint?.id}/settings`);
  const cancel = () => { try { sessionStorage.removeItem(draftKey); } catch {} navigate("/apps"); };
  function openDraft(nextDraft: EmailSetupDraft & { requestId: string; connectionId: string }) {
    try {
      sessionStorage.setItem(`paperclip.agentmail-setup:${companyId}:${nextDraft.requestId}:${agentId}`, JSON.stringify(nextDraft));
    } catch { /* The new link still restores the agent and saved account. */ }
    navigate(`/apps/chat/connect?${new URLSearchParams({ provider: "agentmail", purpose: "chat", setupId: nextDraft.requestId, agentId, connectionId: nextDraft.connectionId })}`);
  }
  const chooseAnotherAddress = () => {
    // Preserve the allocated inbox and its resumable setup. A different address
    // must use a new provider client_id, never silently rename a retry.
    const nextRequestId = crypto.randomUUID();
    openDraft({
      connectionId, selectedCredentialId: connectionId, agentId, step: 1,
      requestId: nextRequestId, addressMode: "new", username: "", inboxId: "",
      domain: pendingAddress?.slice(pendingAddress.lastIndexOf("@") + 1) ?? domain,
      domainSelected: true, takenAddresses, mode, allowInboxKey: false,
    });
  };
  return <div className="mx-auto max-w-xl space-y-6 p-6">
    <header className="space-y-2">
      <h1 className="text-xl font-bold">{step === 2 ? pageText("yourAgentSEmailIsReady_5d4c54") : pageText("giveAnAgentAnEmailAddress_af7aec")}</h1>
    </header>
    {step < 2 && inboxesView.kind === "error" && <QueryErrorState error={inboxes.error} action="load email setup progress"
      onRetry={inboxesView.retry} retrying={inboxesView.isFetching} />}
    {step < 2 && resumeId === requestId && inboxesLoaded && !pendingEndpoint && <p role="alert" className="text-sm text-destructive">{pageText("thisEmailSetupCouldNotBeFoundReturn_545907")}</p>}
    {step < 2 && <ChatSetupNavigation labels={["Agent", "Email address"]} step={step}
      availableStep={step} disabled={busy} onSelect={index => { setup.reset(); setStep(index as 0 | 1); }} />}
    {step === 0 && <form className="space-y-6" onSubmit={event => { event.preventDefault(); if (canContinue) connect.mutate(); }}>
      <div className="space-y-2">
        <Label htmlFor="email-agent">{translateUi("interfaceCopy.agent")}</Label>
        <AgentSelect id="email-agent" value={agentId} disabled={busy || agents.isPending || !inboxesLoaded || !!pendingEndpoint}
          placeholder={pageText("chooseAnAgent_faaaf2")} emptyMessage={pageText("noAgentsFound_6893bf")} triggerClassName="h-10"
          agents={(agents.data ?? []).filter(a => !["terminated", "pending_approval"].includes(a.status))}
          onChange={id => { setAgentId(id); setUsername((agents.data?.find(a => a.id === id)?.name ?? "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 64)); }} />
      </div>
      {!pendingAddress && <AgentMailCredentialField companyId={companyId} connectionId={selectedCredentialId}
        onConnectionChange={selectCredential} value={apiKey} onChange={value => { setApiKey(value); connect.reset(); }} disabled={busy} />}
      {restrictedInbox && <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{pageText("thatKeyOnlyConnects_51cbe7") + " "}{restrictedInbox}{pageText("chooseASavedAccountKeyOrEnterOne_c2383f")}</p>
        <Button type="button" variant="link" size="sm" className="h-auto p-0" disabled={busy || !(selectedCredentialId || apiKey.trim())}
          onClick={() => { setAllowInboxKey(true); setRestrictedInbox(""); connect.reset(); }}>{pageText("useTheExistingInboxInstead_eb64c1")}</Button>
      </div>}
      {lowTrust && !scoped && <div role="alert" className="space-y-2 text-sm">
        <p>{pageText("thisAgentNeedsAWorkBoundaryBeforeIt_78583a")}</p>
        <Button type="button" variant="outline" size="sm" onClick={openTrust}>{pageText("configureWorkBoundary_4f6f01")}</Button>
      </div>}
      {setupError}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button type="button" variant="ghost" disabled={busy} onClick={cancel}>{translateUi("interfaceCopy.cancel")}</Button>
        <Button disabled={!canContinue}>{connect.isPending ? pageText("connecting_fd3e79") : pageText("continue_2e0262")}<ArrowRight className="size-4" /></Button>
      </div>
    </form>}
    {step === 1 && <form className="space-y-6" onSubmit={event => { event.preventDefault(); if (canCreate) setup.mutate(); }}>
      <div className="space-y-2">
        <Label htmlFor={addressMode === "new" ? "email-name" : "email-existing"}>{chosen?.name}{pageText("sEmailAddress_191837")}</Label>
        {pendingAddress ? <>
          <p className="text-sm font-medium">{pendingAddress}</p>
          <p className="text-sm text-muted-foreground">{pageText("thisAddressWasCreatedInAgentMailFinishConnecting_cb0869") + " "}{chosen?.name}{scopedKey ? "." : pageText("orChooseADifferentAddressTheOriginalInbox_fe72f3")}</p>
          {!scopedKey && <Button type="button" variant="link" size="sm" className="h-auto p-0" disabled={busy} onClick={chooseAnotherAddress}>{pageText("chooseADifferentAddress_2d6e7b")}</Button>}
        </> : addressMode === "new" ? <>
          <div className="flex items-center gap-2">
            <Input id="email-name" className="min-w-0" value={username} maxLength={64} autoComplete="off" spellCheck={false} disabled={busy}
              aria-invalid={!!addressError} aria-describedby={addressError ? "email-address-error" : "email-address-status"}
              onChange={event => { setUsername(event.target.value.toLowerCase()); setup.reset(); }} />
            <select id="email-domain" aria-label={pageText("emailDomain_ae7886")} className={`${selectClass} max-w-1/2 shrink-0`} value={domain}
              disabled={busy || !inspected.data} onChange={event => { setDomainSelected(true); setDomain(event.target.value); setup.reset(); }}>
              {[...new Set([...customDomains, "agentmail.to", domain])]
                .map(value => <option key={value} value={value}>@{value}</option>)}
            </select>
          </div>
        </> : <select id="email-existing" className={selectClass} value={pendingAddress ?? inboxId} disabled={busy || scopedKey || !!pendingAddress}
          aria-invalid={!!addressError} aria-describedby={addressError ? "email-address-error" : undefined}
          onChange={event => { setInboxId(event.target.value); setup.reset(); }}>
          <option value="">{pageText("chooseAnInbox_da24ac")}</option>
          {inspected.data?.inboxes.map(i => {
            const assigned = inboxes.data?.some(e => e.id !== requestId && e.address === i.inbox_id && e.status !== "archived");
            return <option key={i.inbox_id} value={i.inbox_id} disabled={assigned}>{i.inbox_id}{assigned ? " " + pageText("alreadyAssigned_4ee3ff") : ""}</option>;
          })}
        </select>}
        {scopedKey && !pendingAddress && <Button type="button" variant="link" size="sm" className="h-auto p-0" disabled={busy}
          onClick={() => { setAllowInboxKey(false); setStep(0); }}>{pageText("chooseAKeyForANewAddress_badc6d")}</Button>}
        {addressError && <p id="email-address-error" role="alert" className="text-sm text-destructive">{addressError}</p>}
        {checkingNewAddress && !addressError && <p id="email-address-status" role="status" className="text-sm text-muted-foreground">
          {addressCheck.checking ? pageText("checkingAddress_9b8bb9") : addressCheck.error ? `Could not check this address. ${addressCheck.error}`
            : addressCheck.result?.status === "unknown" ? pageText("agentmailConfirmsAvailabilityWhenYouCreateTheAddress_eac1d5") : null}
        </p>}
        {suggestions.length > 0 && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-label={pageText("suggestedEmailAddresses_db8ff6")}>
          <span className="text-muted-foreground">{pageText("try_102acb")}</span>
          {suggestions.map(name => <Button key={name} type="button" variant="link" size="sm" className="h-auto p-0" disabled={busy}
            onClick={() => { setUsername(name); setup.reset(); }}>{name}@{domain}</Button>)}
        </div>}
        {!scopedKey && !pendingAddress && <Button type="button" variant="link" size="sm" className="h-auto p-0" disabled={busy}
          onClick={() => { setAddressMode(addressMode === "new" ? "existing" : "new"); setup.reset(); }}>
          {addressMode === "new" ? pageText("useAnExistingInbox_cb1d86") : pageText("createANewAddress_6af5b5")}
        </Button>}
      </div>
      <Card className="py-4">
        <CardHeader className="px-4">
          <h2 className="text-sm font-medium">{pageText("howItWorks_100cb0")}</h2>
          <CardDescription>{pageText("incomingEmailCreatesTasksFor_0dbd66") + " "}{chosen?.name}{pageText("repliesStayInTheSameTask_4b4ad5")}</CardDescription>
        </CardHeader>
      </Card>
      <details className="space-y-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">{pageText("advancedOptions_63c9e0")}</summary>
        <div className="space-y-4">
          {addressMode === "new" && <div className="space-y-2">
            <a className="text-sm underline" href="https://docs.agentmail.to/custom-domains" target="_blank" rel="noreferrer">{pageText("setUpACustomDomain_a84784")}</a>
          </div>}
          <div className="space-y-2">
            <Label htmlFor="email-mode">{pageText("receiving_2f8f37")}</Label>
            <select id="email-mode" value={mode} disabled={busy} className={selectClass} onChange={event => setMode(event.target.value as typeof mode)}>
              <option value="websocket">{pageText("liveConnection_f904a5")}</option><option value="webhook">Webhook</option>
            </select>
          </div>
          <EmailSafetyNotice />
          <div className="space-y-2 text-sm">
            <p>{lowTrust && scoped ? pageText("lowTrustReviewConfigured_0e1380") : pageText("manageWhichTasksAndToolsThisAgentCan_249462")}</p>
            <Button type="button" variant="outline" size="sm" onClick={openTrust}>{pageText("reviewTrustSettings_389134")}</Button>
          </div>
        </div>
      </details>
      {setupError}
      {inspected.isPending && <p role="status" className="text-sm text-muted-foreground">{pageText("loadingEmailOptions_9a9b07")}</p>}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button type="button" variant="ghost" disabled={busy} onClick={() => { setup.reset(); setStep(0); }}><ArrowLeft className="size-4" />{pageText("back_b52b36")}</Button>
        <Button disabled={!canCreate}>
          {setup.isPending ? pageText("connecting_fd3e79") : pendingAddress ? pageText("finishConnecting_1899b2") : addressMode === "new" ? pageText("createEmailAddress_208f8e") : pageText("connectEmailAddress_60ad06")}<ArrowRight className="size-4" />
        </Button>
      </div>
    </form>}
    {step === 2 && <div className="space-y-6">
      <div className="space-y-2"><p className="flex items-center gap-2 font-medium"><Check className="size-4" />{setup.data?.address}</p>
        <p className="text-sm text-muted-foreground">{chosen?.name}{" " + pageText("canNowReceiveEmailAtThisAddress_7d91fc")}</p></div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button variant="ghost" onClick={leave}>{pageText("emailSettings_180dd6")}</Button><Button onClick={() => navigate("/apps")}>{translateUi("interfaceCopy.done")}</Button>
      </div>
    </div>}
      <Dialog open={trustOpen} onOpenChange={setTrustOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{pageText("trustSettings_9709ba") + " "}{chosen?.name}</DialogTitle>
            <DialogDescription>{pageText("changesApplyToAllOfThisAgentS_bef9d1")}</DialogDescription>
          </DialogHeader>
          <TrustPresetSection
            permissions={permissions}
            onChange={setPermissions}
            companyId={companyId}
            projectCandidates={(projects.data ?? []).map((p) => ({
              id: p.id,
              label: p.name,
            }))}
            issueCandidates={(boundaryIssues.data ?? []).map((issue) => ({
              id: issue.id,
              label: `${issue.identifier} · ${issue.title}`,
            }))}
            allowSingleIssue={false}
            candidatesLoading={projects.isPending || boundaryIssues.isPending
              || projectsView.kind === "reconnecting" || boundaryIssuesView.kind === "reconnecting"}
          />
          <p className="text-xs text-muted-foreground">{pageText("lowTrustLimitsPaperclipAccessItDoesNot_9a108d")}</p>
          {trust.error ? (
            <p role="alert" className="text-sm text-destructive">
              {describeError(trust.error).body}
            </p>
          ) : projectsView.kind === "error" || boundaryIssuesView.kind === "error" ? (
            <QueryErrorState
              size="inline"
              error={projectsView.kind === "error" ? projects.error : boundaryIssues.error}
              action="load work boundary options"
              onRetry={() => { projectsView.retry(); boundaryIssuesView.retry(); }}
              retrying={projects.isFetching || boundaryIssues.isFetching}
            />
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrustOpen(false)}>{translateUi("interfaceCopy.cancel")}</Button>
            <Button
              disabled={
                trust.isPending ||
                (agentDetailView.kind !== "ready" && agentDetailView.kind !== "stale") ||
                (getTrustPreset(permissions) === "low_trust_review" &&
                  !lowTrustBoundaryHasScope(getLowTrustBoundary(permissions)))
              }
              onClick={() => trust.mutate()}
            >{pageText("saveTrustSettings_89870b")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  </div>;
}

export function EmailConnectionInboxes({
  companyId,
  connectionId,
  canConfigure,
}: {
  companyId: string;
  connectionId: string;
  canConfigure: boolean;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const query = useQuery({
    queryKey: ["email-inboxes", companyId],
    queryFn: () => emailApi.list(companyId),
    refetchInterval: 10_000,
  });
  const view = useQueryView(query);
  const connections = useQuery({
    queryKey: queryKeys.tools.connections(companyId),
    queryFn: () => toolsApi.listConnections(companyId),
  });
  const children = new Set(
    connections.data?.connections
      .filter((c) => c.config?.credentialConnectionId === connectionId)
      .map((c) => c.id),
  );
  const inboxes =
    query.data?.filter(
      (i) => i.connectionId === connectionId || children.has(i.connectionId),
    ) ?? [];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{pageText("giveAnAgentAnEmailAddress_af7aec")}</h2>
          <p className="text-sm text-muted-foreground">{pageText("eachEmailConversationBecomesATask_189684")}</p>
        </div>
        {canConfigure && (
          <Button asChild size="lg">
            <Link
              to={`/apps/chat/connect?provider=agentmail&connectionId=${connectionId}`}
            >{pageText("giveAnAgentAnEmailAddress_af7aec")}</Link>
          </Button>
        )}
      </div>
      {inboxes.map((i) => (
        <div
          key={i.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
        >
          <Link
            className="text-sm underline"
            to={`/apps/chat/${i.id}/settings`}
          >
            {i.address}
          </Link>
          <span className="text-xs text-muted-foreground">
            {i.lastError ??
              (i.status === "active" ? pageText("receivingEmail_93eb5a") : i.status)}
          </span>
        </div>
      ))}
      {!!inboxes.length && <EmailSafetyNotice />}
      {view.kind === "error" && (
        <QueryErrorState error={query.error} action="load the inboxes" onRetry={view.retry} retrying={view.isFetching} />
      )}
    </section>
  );
}
export function EmailEndpointSettings({
  endpointId,
  companyId,
  assignedAgentName,
}: {
  endpointId: string;
  companyId: string;
  assignedAgentName: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["email-inboxes", companyId],
    queryFn: () => emailApi.list(companyId),
    refetchInterval: 10_000,
  });
  const view = useQueryView(query);
  const inbox = query.data?.find(
    (row: EmailEndpointSummary) => row.id === endpointId,
  );
  const [removed, setRemoved] = useState(false);
  const [replacementKey, setReplacementKey] = useState("");
  const [reconnectOpen, setReconnectOpen] = useState(false);
  useEffect(() => {
    if (inbox?.lastError) setReconnectOpen(true);
  }, [inbox?.lastError]);
  const [receiveMode, setReceiveMode] = useState<"websocket" | "webhook" | "">(
    "",
  );
  const reconnect = useMutation({
    mutationFn: () =>
      emailApi.reconnect(
        endpointId,
        replacementKey,
        receiveMode || inbox!.receiveMode,
      ),
    onSuccess: () => {
      setReplacementKey("");
    },
    onSettled: () => {
      void cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
    },
  });
  const control = useMutation({
    mutationFn: (action: "pause" | "resume" | "remove") =>
      emailApi.control(endpointId, action),
    onSuccess: (result) => {
      setRemoved(result.status === "archived");
      void cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
    },
  });
  if (removed)
    return <p>{pageText("inboxDisconnectedEmailHistoryRemainsInItsTasks_8a7345")}</p>;
  if (!inbox) {
    if (view.kind === "error")
      return <QueryErrorState error={query.error} action="load the email inbox" onRetry={view.retry} retrying={view.isFetching} />;
    return <p role="status">{pageText("loadingEmailInbox_55452c")}</p>;
  }
  return (
    <div className="max-w-2xl space-y-8 pb-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{assignedAgentName}{pageText("sEmailAddress_191837")}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 aria-label={inbox.address ?? undefined} className="min-w-0 break-all text-xl font-bold">
            {inbox.address ? (
              <CopyText text={inbox.address} ariaLabel={interfaceNotice("interface:copyEmailAddress_02b840")} title={pageText("copyEmailAddress_02b840")}
                containerClassName="max-w-full" className="flex min-w-0 items-center gap-2 rounded-md text-left">
                <span className="min-w-0 break-all">{inbox.address}</span>
                <Copy aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </CopyText>
            ) : pageText("emailInbox_6dccef")}
          </h1>
          {inbox.address && (
            <a href={`https://console.agentmail.to/dashboard/inboxes/${encodeURIComponent(inbox.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">{pageText("viewInbox_b1c629") + " "}<ExternalLink aria-hidden="true" className="size-3" />
            </a>
          )}
        </div>
        {inbox.status === "active" && inbox.address && (
          <p className="text-sm text-muted-foreground">{pageText("sendAnEmailToThisAddressToStart_d94edf") + " "}{assignedAgentName}.
          </p>
        )}
      </header>

      <Card className="gap-2 p-4">
        <h2 className="text-sm font-semibold">{pageText("howItWorks_100cb0")}</h2>
        <p className="text-sm text-muted-foreground">{pageText("incomingEmailCreatesTasksFor_0dbd66") + " "}{assignedAgentName}{pageText("repliesStayInTheSameTaskTaskComments_b0ce13")}</p>
      </Card>

      <section aria-labelledby="email-receiving-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 id="email-receiving-heading" className="text-sm font-semibold">{pageText("receivingEmail_93eb5a")}</h2>
            {(inbox.status !== "active" || inbox.lastError) && (
              <StatusBadge status={inbox.status === "active" ? "attention" : inbox.status}
                label={inbox.status === "active" ? pageText("needsAttention_a12672") : inbox.status === "revoked" ? pageText("accessRevoked_7d420e") : undefined} />
            )}
          </div>
          {["active", "paused"].includes(inbox.status) && (
            <Button variant="outline" size="sm" disabled={control.isPending}
              onClick={() => control.mutate(inbox.status === "active" ? "pause" : "resume")}>
              {inbox.status === "active" ? pageText("pause_781961") : pageText("resume_b3bd0b")}
            </Button>
          )}
        </div>
        {inbox.status === "paused" && (
          <p className="text-sm text-muted-foreground">{pageText("receivingIsPausedResumeToReceiveNewEmail_8b8172")}</p>
        )}
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">{pageText("receivingMode_5614c3")}</dt>
            <dd className="text-sm">{inbox.receiveMode === "websocket" ? pageText("liveConnection_f904a5") : "Webhook"}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">{pageText("lastMailCheck_40a937")}</dt>
            <dd className="font-mono text-xs">{inbox.lastSyncAt ? formatDateTime(inbox.lastSyncAt) : pageText("notCheckedYet_82bd72")}</dd>
          </div>
        </dl>
        {inbox.lastError && <p role="alert" className="text-sm text-destructive">{inbox.lastError}</p>}
        {control.error && control.variables !== "remove" && (
          <p role="alert" className="text-sm text-destructive">{describeError(control.error).body}</p>
        )}
      </section>

      <details open={reconnectOpen} onToggle={(event) => setReconnectOpen(event.currentTarget.open)} className="border-t border-border pt-5">
        <summary className="cursor-pointer text-sm font-medium">{pageText("reconnectInbox_ebd4d9")}</summary>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">{pageText("replaceTheAPIKeyOrChangeHowThis_dd47fe")}</p>
          <AgentMailApiKeyField label={pageText("newAPIKey_bbc653")} value={replacementKey} onChange={setReplacementKey} disabled={reconnect.isPending} />
          <div className="space-y-2">
            <Label htmlFor="email-reconnect-mode">{pageText("receivingMode_5614c3")}</Label>
            <select id="email-reconnect-mode" className={selectClass}
              disabled={reconnect.isPending} value={receiveMode || inbox.receiveMode}
              onChange={(e) => setReceiveMode(e.target.value as "websocket" | "webhook")}>
              <option value="websocket">{pageText("liveConnection_f904a5")}</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          {reconnect.error && <p role="alert" className="text-sm text-destructive">{describeError(reconnect.error).body}</p>}
          {reconnect.isSuccess && <p role="status" className="text-sm">{pageText("inboxReconnected_c18a43")}</p>}
          <div className="flex justify-end">
            <Button variant="outline" disabled={!replacementKey || reconnect.isPending} onClick={() => reconnect.mutate()}>
              {reconnect.isPending ? pageText("reconnecting_8a8b95") : pageText("reconnectInbox_ebd4d9")}
            </Button>
          </div>
        </div>
      </details>

      <section aria-labelledby="email-disconnect-heading" className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 id="email-disconnect-heading" className="text-sm font-semibold">{pageText("disconnectInbox_29aecd")}</h2>
            <p className="text-sm text-muted-foreground">{pageText("stopReceivingEmailInPaperclipTheInboxStays_895d3c")}</p>
          </div>
          <Button variant="outline" size="sm" disabled={control.isPending}
            onClick={() => control.mutate("remove")}>{pageText("disconnectInbox_29aecd")}</Button>
        </div>
        {control.error && control.variables === "remove" && (
          <p role="alert" className="text-sm text-destructive">{describeError(control.error).body}</p>
        )}
      </section>
    </div>
  );
}
