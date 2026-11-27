import { t as interfaceNotice } from "@/i18n";
import { t as translateDynamic } from "../../../i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { SpekoProviderSetup } from "@/components/voice/SpekoProviderSetup";
import { NativeVoiceConversation } from "@/components/voice/NativeVoiceConversation";
import { buildSlackAppManifest, defaultSlackAppConfiguration } from "@paperclipai/shared";
import { SlackAppDetails, SlackSetupAdvanced } from "./SlackAppDetails";
import { SlackSetup } from "./slack/SlackSetup";
import { isProvisionedSlackSetup, slackSetupState } from "./slack/setup-state";
import { slackConversationUrl } from "./slack/conversation-url";
import { useAccountIdentity } from "@/api/companies-query";
import { defaultSlackAppName } from "./slack-app-name";
import { GitHubChatSetup } from "./GitHubChatSetup";
import { GitHubAgentTrustWarning } from "@/components/GitHubAgentTrustWarning";
import { SetupWizardFooter } from "@/components/SetupWizard";
import { ChatSetupNavigation } from "@/components/chat/ChatSetupNavigation";
import { SlackIdentityStep } from "./SlackIdentityStep";
import { PhotonConnectStep } from "./PhotonConnectStep";
import { EmailEndpointSetup } from "./EmailEndpointSetup";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryView } from "@/components/QueryView";
import { AlertTriangle, CheckCircle2, Copy, CircleHelp, ExternalLink, Eye, EyeOff, Hammer, Loader2 } from "lucide-react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentCharacter } from "@/components/AgentCharacter";
import { AgentSelect } from "@/components/AgentMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { agentsApi } from "@/api/agents";
import { instanceSettingsApi } from "@/api/instanceSettings";
import {
  chatEndpointsApi,
  type ChatEndpoint,
  type ChatProvider,
  type ChatEndpointSetupAction,
} from "@/api/chatEndpoints";
import { useNavigate, useSearchParams } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useCopyAction } from "@/lib/use-copy-action";
import { isAgentStatusInvokable, slackAppConfigurationSchema, type SlackAppConfiguration } from "@paperclipai/shared";
import { sanitizedSetupErrorMessage } from "./chat-setup-error";
import {
  createGitHubPrivateKeyReadGuard,
  readGitHubPrivateKeyFile,
} from "./github-private-key-file";
import { describeError } from "@/api/errors";

const providerNames: Record<ChatProvider, string> = {
  speko: "Speko",
  agentmail: "AgentMail",
  slack: "Slack",
  github: "GitHub",
  discord: "Discord",
  "microsoft-teams": "Microsoft Teams",
  telegram: "Telegram",
  "imessage-photon": "iMessage Photon",
};

const knownProviders = new Set(Object.keys(providerNames));

function isProvider(value: string | null): value is ChatProvider {
  return value !== null && knownProviders.has(value);
}

function publicOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isChatEndpointRepairing(
  endpoint: Pick<
    ChatEndpoint,
    "provider" | "status" | "providerAccountId" | "botExternalId"
  > | null,
  resumeEndpointId: string | null,
  reconnectRequested: boolean,
): boolean {
  if (!resumeEndpointId || !endpoint) return false;
  const recoveringStatus =
    endpoint.status === "attention" || endpoint.status === "revoked";
  // A secret-only GitHub draft affected by setup trouble has no App identity
  // or reusable App credentials. It must remain first-time setup, where App ID
  // and private key are required, rather than offering a misleading reconnect.
  if (
    endpoint.provider === "github" &&
    recoveringStatus &&
    !endpoint.providerAccountId &&
    !endpoint.botExternalId
  ) {
    return false;
  }
  return (
    recoveringStatus ||
    (reconnectRequested &&
      (endpoint.status === "active" || endpoint.status === "paused"))
  );
}

export function ChatConnectionPurpose({ provider, onChat, onTools, slackLabels }: {
  provider: ChatProvider;
  onChat: () => void;
  onTools: () => void;
  slackLabels?: string[];
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([{ label: interfaceNotice("interface:connectors_4b1e95"), href: "/apps" }, { label: interfaceNotice("interface:chooseConnection_3bfec1") }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);
  return (
      <div className="max-w-2xl space-y-6">
        <ChatSetupNavigation labels={provider === "slack" ? slackLabels ?? ["Choose agent", "Connect"] : undefined} step={0} availableStep={0} onSelect={onChat} />
        <div>
          <h1 className="text-xl font-bold">{pageText("chooseHowToConnect_e00fc6")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageText("whatShouldThis_0579e2") + " "}{providerNames[provider]}{" " + pageText("connectionDo_370fcd")}</p>
        </div>
        <div className="grid gap-3">
          <button
            type="button"
            className="flex items-center gap-4 rounded-xl border border-border p-4 text-left hover:bg-accent/40"
            onClick={onChat}
          >
            <AgentAvatar size={48} />
            <span>
              <span className="block text-sm font-semibold">{pageText("chatWithAnAgent_b5e325")}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{pageText("peopleIn_2d7b98") + " "}{providerNames[provider]}{" " + pageText("canStartAndContinuePaperclipTasks_2c5378")}</span>
            </span>
          </button>
          <button
            type="button"
            className="flex items-center gap-4 rounded-xl border border-border p-4 text-left hover:bg-accent/40"
            onClick={onTools}
          >
            <span className="flex size-12 shrink-0 items-center justify-center text-muted-foreground" aria-hidden="true">
              <Hammer className="size-8" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{pageText("useThisConnectionAsAnAgentTool_02bbba")}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{pageText("letAgentsUse_b79056") + " "}{providerNames[provider]}{" " + pageText("actionsAndDataWhileTheyWork_f58fe8")}</span>
            </span>
          </button>
        </div>
      </div>
  );
}

export function ChatEndpointSetup() {
  const [params] = useSearchParams();
  if (params.get("provider") === "github") return <GitHubChatSetup />;
  return params.get("provider") === "agentmail" ? <EmailEndpointSetup /> : <ChatSdkEndpointSetup />;
}

function ChatSdkEndpointSetup() {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const { userId, settled: identitySettled } = useAccountIdentity();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const provider = isProvider(params.get("provider"))
    ? (params.get("provider") as ChatProvider)
    : null;
  const toolHref = params.get("toolHref") || "/apps";
  const preselectedAgent = params.get("agentId") ?? "";
  const resumeEndpointId = params.get("resume") ?? "";
  const reconnectRequested = params.get("reconnect") === "1";
  const [purpose, setPurpose] = useState<"choice" | "chat">(
    params.get("purpose") === "chat" ? "chat" : "choice",
  );
  const [agentId, setAgentId] = useState(preselectedAgent);
  const [slackCredentialsReady, setSlackCredentialsReady] = useState(params.get("stage") === "credentials");
  const [viewedStep, setViewedStep] = useState<number | null>(null);
  const [slackIdentityReady, setSlackIdentityReady] = useState(false);
  const [automaticBusy, setAutomaticBusy] = useState(false);
  const [managedAutoStart, setManagedAutoStart] = useState(Boolean(resumeEndpointId));
  const [slackDraft, setSlackDraft] = useState<{ agentId: string; app: SlackAppConfiguration } | null>(null);
  const [endpoint, setEndpoint] = useState<ChatEndpoint | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [generatedWebhookSecret, setGeneratedWebhookSecret] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: interfaceNotice("interface:connectors_4b1e95"), href: "/apps" },
      { label: interfaceNotice("interface:connectChat_fab2e5") },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const agentsQuery = useQuery({
    queryKey: ["chat-endpoint-setup-agents", selectedCompanyId],
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const resumeQuery = useQuery({
    queryKey: ["chat-endpoint-setup-resume", resumeEndpointId],
    queryFn: () => chatEndpointsApi.get(resumeEndpointId),
    enabled: Boolean(resumeEndpointId),
    refetchInterval: query => ["creating", "install", "credentials_saved"].includes(query.state.data?.setup?.slackRegistration?.status ?? "") ? 1_500 : false,
  });
  useEffect(() => {
    if (!resumeQuery.data) return;
    setEndpoint(current => {
      if (isProvisionedSlackSetup(current?.setup?.slackSetupMethod) && !current?.providerAccountId && resumeQuery.data.providerAccountId) setViewedStep(null);
      return resumeQuery.data;
    });
    setAgentId(resumeQuery.data.assignedAgentId);
    setPurpose("chat");
  }, [resumeQuery.data]);
  const githubVerificationQuery = useQuery({
    queryKey: ["chat-endpoint-github-webhook-verification", endpoint?.id],
    queryFn: () => chatEndpointsApi.get(endpoint!.id),
    enabled: Boolean(
      provider === "github" &&
      endpoint?.id &&
      endpoint.setup?.step === "provider_setup" &&
      endpoint.setup?.webhookSecretConfigured &&
      !endpoint.setup.webhookVerifiedAt,
    ),
    refetchInterval: 1_500,
  });
  useEffect(() => {
    if (
      !githubVerificationQuery.data ||
      provider !== "github" ||
      !endpoint ||
      endpoint.id !== githubVerificationQuery.data.id ||
      endpoint.setup?.step !== "provider_setup" ||
      !endpoint.setup?.webhookSecretConfigured ||
      endpoint.setup.webhookVerifiedAt
    )
      return;
    setEndpoint(githubVerificationQuery.data);
  }, [endpoint, githubVerificationQuery.data, provider]);
  const experimentalSettingsQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    enabled: endpoint?.setup?.step === "test",
  });
  const experimentalSettingsView = useQueryView(experimentalSettingsQuery);
  const activeAgents = useMemo(
    () =>
      (agentsQuery.data ?? []).filter((agent) =>
        isAgentStatusInvokable(agent.status),
      ),
    [agentsQuery.data],
  );
  const selectedAgent = agentsQuery.data?.find(agent => agent.id === agentId);
  const slackDetails = slackDraft?.agentId === agentId ? slackDraft.app
    : endpoint?.setup?.slackApp ?? defaultSlackAppConfiguration(selectedAgent?.name ?? endpoint?.assignedAgentName ?? "");
  const slackDetailsValidation = slackAppConfigurationSchema.safeParse(slackDetails);
  const slackDetailsEditable = !automaticBusy && (!endpoint || endpoint.status === "draft" && !endpoint.botExternalId
    && (!endpoint.setup?.slackRegistration || endpoint.setup.slackRegistration.status === "failed"));
  const syncEndpointSnapshot = (
    next: ChatEndpoint,
    onlyIfStillVisible = false,
  ) => {
    if (next.setup?.slackSetupMethod === "managed" && endpoint && endpoint.setup?.slackSetupMethod !== "managed") setManagedAutoStart(true);
    if (isProvisionedSlackSetup(next.setup?.slackSetupMethod) && next.setup?.slackRegistration?.status === "configured"
      && endpoint?.setup?.slackRegistration?.status !== "configured") setViewedStep(null);
    setEndpoint((visible) =>
      onlyIfStillVisible && visible?.id !== next.id ? visible : next,
    );
    queryClient.setQueryData(["chat-endpoint-setup-resume", next.id], next);
    queryClient.setQueryData(queryKeys.chatEndpoints.detail(next.id), next);
    if (next.provider === "github") {
      queryClient.setQueryData(
        ["chat-endpoint-github-webhook-verification", next.id],
        next,
      );
    }
  };
  const slackChoices = useQuery({
    queryKey: ["slack-setup-options", selectedCompanyId],
    queryFn: () => chatEndpointsApi.slackSetupOptions(selectedCompanyId!),
    enabled: provider === "slack" && Boolean(selectedCompanyId),
    });
  const slackChoicesView = useQueryView(slackChoices);
  const createEndpoint = useMutation({
    mutationFn: ({ ownApp = false }: { ownApp?: boolean; exit?: boolean }) => {
      if (provider === "slack" && !slackChoices.data) throw new Error("Slack setup is still loading. Try again.");
      return chatEndpointsApi.create(selectedCompanyId!, {
        provider: provider!,
        assignedAgentId: agentId,
        ...(provider === "slack" ? { slackSetupMethod: ownApp ? "automatic" : slackChoices.data!.defaultMethod, slackApp: slackDetailsValidation.success ? slackDetailsValidation.data : slackDetails } : {}),
      });
    },
    onSuccess: (next, { exit }) => {
      setManagedAutoStart(!exit);
      setViewedStep(exit ? 0 : null);
      syncEndpointSnapshot(next);
      if (next.provider === "imessage-photon" || next.provider === "slack" || next.provider === "speko") {
        const resumed = new URLSearchParams(params);
        resumed.set("resume", next.id);
        setParams(resumed, { replace: true });
      }
      if (exit) navigate("/apps");
    },
    onError: (error) =>
      pushToast({
        title: interfaceNotice("interface:couldnTStartSetup_d870c7"),
        body: describeError(error).body,
        tone: "error",
      }),
  });
  const saveSlackDetails = useMutation({
    scope: { id: `slack-app-details:${endpoint?.id}` },
    mutationFn: (details: SlackAppConfiguration) => chatEndpointsApi.update(endpoint!.id, { slackApp: details }),
    onSuccess: next => syncEndpointSnapshot(next),
  });
  const persistSlackDetails = async () => {
    if (endpoint && slackDetailsEditable && slackDetailsValidation.success
      && JSON.stringify(slackDetailsValidation.data) !== JSON.stringify(endpoint.setup?.slackApp))
      await saveSlackDetails.mutateAsync(slackDetailsValidation.data);
  };
  const continueFromAgent = async (exit: boolean) => {
    if (exit && provider !== "slack") { navigate("/apps"); return; }
    if (!endpoint) {
      if (!agentId) { if (exit) navigate("/apps"); return; }
      createEndpoint.mutate({ exit });
      return;
    }
    try { if (provider === "slack") await persistSlackDetails(); }
    catch { return; }
    if (exit) navigate("/apps"); else { setManagedAutoStart(true); setViewedStep(null); }
  };
  const useOwnSlackApp = useMutation({
    mutationFn: async () => {
      if (!endpoint) return createEndpoint.mutateAsync({ ownApp: true });
      await persistSlackDetails();
      return chatEndpointsApi.update(endpoint.id, { slackSetupMethod: "automatic" });
    },
    onSuccess: next => { setManagedAutoStart(false); syncEndpointSnapshot(next); setViewedStep(1); },
    onError: () => pushToast({ title: interfaceNotice("interface:couldnTSwitchSlackSetup_2d5dfe"), body: interfaceNotice("interface:tryAgain_624fb2"), tone: "error" }),
  });
  const setupAction = useMutation({
    mutationFn: async ({
      action,
      values,
    }: {
      action: ChatEndpointSetupAction;
      values?: Record<string, string>;
    }) => {
      const endpointId = endpoint!.id;
      try {
        return await chatEndpointsApi.setup(endpointId, provider === "imessage-photon" ? {
      action,
      ...(values?.projectSecret ? { credentials: { projectSecret: values.projectSecret } } : {}),
      ...(values?.projectId && values.allocation === "shared" ? { photon: { allocation: "shared" as const, projectId: values.projectId } } : values?.projectId && values?.lineId ? { photon: { allocation: "dedicated" as const, projectId: values.projectId, lineId: values.lineId } } : {}),
        } : { action, credentials: values });
      } catch (error) {
        // Another open tab may have completed verification, or the successful
        // response may have been lost. Read the canonical state before retrying.
        if (action === "verify") {
          const current = await chatEndpointsApi.get(endpointId).catch(() => null);
          if (current?.setup?.step === "test" || current?.setup?.step === "complete") return current;
        }
        throw error;
      }
    },
    onMutate: () => setSetupError(null),
    onSuccess: (next) => {
      setSetupError(null);
      setViewedStep(null);
      syncEndpointSnapshot(next);
      setCredentials({});
      if (next.setup?.step !== "test" && next.setup?.step !== "complete") setSlackIdentityReady(false);
    },
    onError: (error, variables) =>
      setSetupError(sanitizedSetupErrorMessage(error, variables.values)),
  });
  const generateSetupSecret = useMutation({
    mutationFn: () => chatEndpointsApi.generateSetupSecret(endpoint!.id),
    onMutate: async () => {
      const endpointId = endpoint!.id;
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: ["chat-endpoint-github-webhook-verification", endpointId],
          exact: true,
        }),
        queryClient.cancelQueries({
          queryKey: ["chat-endpoint-setup-resume", endpointId],
          exact: true,
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.chatEndpoints.detail(endpointId),
          exact: true,
        }),
      ]);
      return { endpointId };
    },
    onSuccess: async ({ webhookSecret }, _variables, context) => {
      const endpointId = context.endpointId;
      const markRotated = (current: ChatEndpoint) => ({
        ...current,
        setup: {
          ...current.setup,
          step: "provider_setup" as const,
          webhookSecretConfigured: true,
          webhookVerifiedAt: null,
        },
      });

      queryClient.removeQueries({
        queryKey: ["chat-endpoint-github-webhook-verification", endpointId],
        exact: true,
      });
      setGeneratedWebhookSecret(webhookSecret);
      setEndpoint((current) =>
        current && current.id === endpointId ? markRotated(current) : current,
      );
      queryClient.setQueryData<ChatEndpoint>(
        ["chat-endpoint-setup-resume", endpointId],
        (current) => (current ? markRotated(current) : current),
      );
      queryClient.setQueryData<ChatEndpoint>(
        queryKeys.chatEndpoints.detail(endpointId),
        (current) => (current ? markRotated(current) : current),
      );

      try {
        const current = await chatEndpointsApi.get(endpointId);
        syncEndpointSnapshot(current, true);
      } catch {
        // Keep the one-time secret copyable. Verification polling will retry the
        // canonical endpoint read without restoring a pre-rotation snapshot.
      }
    },
    onError: (error) =>
      pushToast({
        title: interfaceNotice("interface:couldnTGenerateWebhookSecret_1d1997"),
        body: describeError(error).body,
        tone: "error",
      }),
  });
  const testConnection = useMutation({
    mutationFn: () => provider === "slack" ? chatEndpointsApi.finishSlackSetup(endpoint!.id) : chatEndpointsApi.test(endpoint!.id),
    onSuccess: (next) => {
      syncEndpointSnapshot(next);
      if (next.status === "active") navigate(`/apps/chat/${next.id}/settings`);
    },
    onError: (error) =>
      pushToast({
        title: provider === "slack" ? interfaceNotice("interface:couldnTFinishSetup_3b5e82") : interfaceNotice("interface:testNotComplete_659dc7"),
        body: describeError(error).body,
        tone: "error",
      }),
  });
  const finishSetup = () => {
    if (provider === "slack" && endpoint?.setup?.step === "complete") {
      navigate(`/apps/chat/${endpoint.id}/settings`);
      return;
    }
    testConnection.mutate();
  };

  const repairing = isChatEndpointRepairing(
    endpoint,
    resumeEndpointId,
    reconnectRequested,
  );
  const isSlack = provider === "slack";
  const slackNavigation = slackSetupState({ endpoint, repairing, credentialsReady: slackCredentialsReady, identityReady: slackIdentityReady, defaultMethod: slackChoices.data?.defaultMethod });
  const automaticSlack = isSlack && slackNavigation.provisioned;
  const automaticSlackComplete = automaticSlack && slackNavigation.complete;
  const tryStep = isSlack ? slackNavigation.finalStage : 2;
  const availableStep = isSlack ? slackNavigation.availableStage : !endpoint ? 0
    : !repairing && (endpoint.setup?.step === "test" || endpoint.setup?.step === "complete") ? tryStep : 1;
  const step = Math.min(viewedStep ?? availableStep, availableStep);
  const agentStepBusy = automaticBusy || createEndpoint.isPending || saveSlackDetails.isPending || useOwnSlackApp.isPending;
  const slackVerificationQuery = useQuery({
    queryKey: ["chat-endpoint-slack-webhook-verification", endpoint?.id],
    queryFn: () => chatEndpointsApi.get(endpoint!.id),
    enabled: Boolean(isSlack && step === 3 && endpoint?.setup?.step === "provider_setup" &&
      !endpoint.setup.webhookVerifiedAt && !setupAction.isPending),
    refetchInterval: 1_500,
  });
  const slackVerificationView = useQueryView(slackVerificationQuery);
  useEffect(() => {
    const next = slackVerificationQuery.data;
    if (!next || !endpoint || next.id !== endpoint.id || setupAction.isPending ||
      endpoint.setup?.step !== "provider_setup" || endpoint.setup.webhookVerifiedAt ||
      !next.setup?.webhookVerifiedAt) return;
    setEndpoint(next);
  }, [slackVerificationQuery.data, endpoint, setupAction.isPending]);
  const autoVerificationAttempt = useRef<string | null>(null);
  useEffect(() => {
    if (!isSlack || step !== 3 || endpoint?.setup?.step !== "provider_setup" ||
      !endpoint.setup.webhookVerifiedAt || setupAction.isPending) return;
    const attempt = `${endpoint.id}:${endpoint.setup.webhookVerifiedAt}`;
    if (autoVerificationAttempt.current === attempt) return;
    autoVerificationAttempt.current = attempt;
    setupAction.mutate({ action: "verify" });
  }, [isSlack, step, endpoint, setupAction]);

  if (!provider)
    return (
      <p className="text-sm text-destructive">{pageText("thisChatProviderIsNotSupported_76c778")}</p>
    );
  if (!selectedCompanyId)
    return (
      <p className="text-sm text-muted-foreground">{pageText("selectAnOrganizationToConnectChat_c6677c")}</p>
    );

  if (purpose === "choice" && provider !== "speko") {
    return <ChatConnectionPurpose provider={provider} slackLabels={slackNavigation.labels} onChat={() => setPurpose("chat")} onTools={() => navigate(toolHref)} />;
  }

  return (
    <div className={automaticSlackComplete && step === tryStep ? "mx-auto w-full max-w-2xl space-y-6" : "max-w-2xl space-y-6"}>
      <ChatSetupNavigation
        labels={isSlack ? slackNavigation.labels : undefined}
        step={isSlack ? slackNavigation.toVisible(step) : step}
        availableStep={isSlack ? slackNavigation.toVisible(availableStep) : availableStep}
        disabled={agentStepBusy || setupAction.isPending || generateSetupSecret.isPending || testConnection.isPending}
        onSelect={value => setViewedStep(isSlack ? slackNavigation.toStage(value) : value)}
      />
      <div className="min-w-0 space-y-6">
        {step === 0 ? (
          <>
            <div>
              <h1 className="text-xl font-bold">{pageText("whichAgentDoYouWantToChatWith_05afb0")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{pageText("thisAgentIsPermanentForTheConnectionConnect_4ebdcc")}</p>
            </div>
            {endpoint ? (
              <Input aria-label={pageText("assignedAgent_ab5858")} value={endpoint.assignedAgentName ?? selectedAgent?.name ?? agentId} readOnly />
            ) : <AgentSelect
              agents={activeAgents}
              value={agentId}
              onChange={setAgentId}
              placeholder={pageText("chooseAnActiveAgent_47d10e")}
              emptyMessage={pageText("noActiveAgentsAreAvailable_ede5b3")}
            />}
            {isSlack && (selectedAgent || endpoint) && <SlackSetupAdvanced>
              <SlackAppDetails value={slackDetails} readOnly={!slackDetailsEditable || agentStepBusy}
                onChange={app => setSlackDraft({ agentId, app })}
                onBlur={() => void persistSlackDetails().catch(() => {})} />
              {saveSlackDetails.error && <p role="alert" className="text-sm text-destructive">{pageText("couldnTSaveTheSlackAppDetailsTry_da7936")}</p>}
              {slackChoices.data?.defaultMethod === "managed" && (!endpoint || endpoint.setup?.slackSetupMethod === "managed") && !endpoint?.setup?.slackRegistration && <Button
                variant="link" className="h-auto p-0 text-muted-foreground"
                disabled={agentStepBusy || !slackDetailsValidation.success}
                onClick={() => useOwnSlackApp.mutate()}
              >{pageText("useYourOwnApp_20b8b3")}</Button>}
            </SlackSetupAdvanced>}
            {isSlack && !endpoint && !slackChoices.data && ((slackChoicesView.kind === "error")
              ? <div role="alert" className="text-sm text-destructive">{pageText("couldnTLoadSlackSetup_73d4cc") + " "}<Button variant="link" disabled={slackChoices.isFetching} onClick={() => void slackChoices.refetch()}>{translateUi("interfaceCopy.retry")}</Button></div>
              : <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{pageText("loadingSlack_d9c128")}</p>)}
            {provider === "github" && <GitHubAgentTrustWarning agent={selectedAgent} />}
            <SetupWizardFooter disabled={agentStepBusy || isSlack && !endpoint && Boolean(agentId) && !slackChoices.data} onSaveExit={() => void continueFromAgent(true)}>
              <Button
                disabled={!agentId || agentStepBusy || isSlack && (!slackDetailsValidation.success || !endpoint && !slackChoices.data)}
                onClick={() => void continueFromAgent(false)}
              >
                {createEndpoint.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{pageText("continue_2e0262")}</Button>
            </SetupWizardFooter>
          </>
        ) : null}
        {endpoint && !(automaticSlackComplete && step === tryStep) && (
          <div hidden={step !== 1 && !(isSlack && (step === 2 || step === 3))} className="space-y-6">
            {setupError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                <p className="font-medium">{pageText("connectionFailed_202caa")}</p>
                <p className="mt-1">{setupError}</p>
              </div>
            ) : null}
            <ProviderConnectStep
              key={`${provider}:${endpoint.id}`}
              provider={provider}
              managedAutoStart={managedAutoStart && step !== 0}
              slackStage={step === 1 ? "app" : step === 3 ? "finish" : "credentials"}
              onSlackCredentialsContinue={() => setViewedStep(3)}
              onSlackVerificationContinue={() => setViewedStep(4)}
              slackVerificationError={slackVerificationView.kind === "error"}
              onSlackAppCreated={() => {
                setSlackCredentialsReady(true);
                setViewedStep(2);
                const resumed = new URLSearchParams(params);
                resumed.set("resume", endpoint.id);
                resumed.set("stage", "credentials");
                setParams(resumed, { replace: true });
              }}
              agentName={selectedAgent?.name ?? endpoint.assignedAgentName}
              endpoint={endpoint}
              onEndpointSaved={syncEndpointSnapshot}
              credentials={credentials}
              setCredentials={setCredentials}
              repairing={repairing}
              pending={setupAction.isPending}
              onAutomaticBusy={setAutomaticBusy}
              generatedWebhookSecret={generatedWebhookSecret}
              generatingSetupSecret={generateSetupSecret.isPending}
              onGenerateSetupSecret={() => generateSetupSecret.mutate()}
              onAction={(action, values) =>
                setupAction.mutate({ action, values })
              }
            />
          </div>
        )}
        {endpoint && isSlack && !automaticSlack && step === 4 && (
          <SlackIdentityStep
            endpointId={endpoint.id}
            command={endpoint.setup?.slackApp?.command ?? endpoint.setup?.command ?? "/paperclip"}
            testStartedAt={endpoint.setup?.testStartedAt}
            onSaveExit={() => navigate("/apps")}
            onConnected={() => {
              setSlackIdentityReady(true);
              setViewedStep(5);
            }}
          />
        )}
        {endpoint && step === tryStep && provider === "speko" && (
          <div className="space-y-5">
            <h1 className="text-xl font-bold">{pageText("testYourSpekoVoiceConnection_94f7d4")}</h1>
            <p className="text-sm text-muted-foreground">{pageText("askTheAgentToDoSomeWorkAdd_151cb3")}</p>
            <NativeVoiceConversation companyId={endpoint.companyId} endpointId={endpoint.id} agentName={selectedAgent?.name ?? endpoint.assignedAgentName} />
            <SetupWizardFooter onSaveExit={() => navigate("/apps")}><Button disabled={testConnection.isPending} onClick={() => testConnection.mutate()}>{pageText("verifyTestConversation_e2603d")}</Button></SetupWizardFooter>
          </div>
        )}
        {endpoint && step === tryStep && provider !== "speko" && (!automaticSlack || automaticSlackComplete) && (
          automaticSlack ? <div className="flex flex-col items-center gap-6 py-8 text-center">
            <AgentCharacter
              agent={selectedAgent ?? { id: endpoint.assignedAgentId, name: endpoint.assignedAgentName }}
              size={256} state="success" trackingScope="page"
              label={translateDynamic("dynamic:avatar", { value1: selectedAgent?.name ?? endpoint.assignedAgentName })}
            />
            <div className="flex flex-col items-center gap-3">
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <CheckCircle2 aria-hidden="true" className="size-6 text-(--status-task-done)" />{pageText("success_42a8f6")}</h1>
              <p className="flex flex-wrap items-center justify-center gap-2 text-base text-muted-foreground">
                <span>{pageText("youCanNowTalkTo_7a0db2") + " "}{selectedAgent?.name ?? endpoint.assignedAgentName}{" " + pageText("inSlack_02247f")}</span>
                <img src="/brands/apps/slack.svg" alt="" aria-hidden="true" className="size-6" />
              </p>
              <Button asChild variant="link"><a href={slackConversationUrl(endpoint, identitySettled ? userId : null)} target="_blank" rel="noopener noreferrer">{pageText("openSlack_eec851") + " "}<ExternalLink className="size-4" /></a></Button>
            </div>
            <Button disabled={testConnection.isPending} onClick={finishSetup}>
              {testConnection.isPending && <Loader2 className="size-4 animate-spin" />}{pageText("done_e9b450")}</Button>
          </div> : <TryStep
            endpointId={endpoint.id}
            provider={provider}
            agentName={selectedAgent?.name ?? endpoint.assignedAgentName}
            botLabel={endpoint.botLabel}
            botUsername={endpoint.botUsername}
            slackAccount={endpoint.setup?.slackAccount}
            photonAllocation={endpoint.photonAllocation}
            providerUrl={endpoint.setup?.slackAccount?.dmChannelId && endpoint.providerAccountId ? `https://app.slack.com/client/${encodeURIComponent(endpoint.providerAccountId)}/${encodeURIComponent(endpoint.setup.slackAccount.dmChannelId)}` : endpoint.setup?.providerUrl}
            guestIsolationState={
              experimentalSettingsQuery.isPending || experimentalSettingsView.kind === "reconnecting"
                ? "loading"
                : experimentalSettingsView.kind === "error"
                  ? "unknown"
                  : experimentalSettingsQuery.data?.enableIsolatedWorkspaces ===
                      true
                    ? "enabled"
                    : "disabled"
            }
            pending={testConnection.isPending}
            onOpenAccess={() => navigate(`/apps/chat/${endpoint.id}/access`)}
            onTest={finishSetup}
            onSaveExit={() => navigate("/apps")}
          />
        )}
        {step !== 0 && !isSlack && provider !== "speko" && <div className="flex justify-start">
          <Button className="text-muted-foreground" variant="ghost" onClick={() => navigate("/apps")}>{pageText("saveExit_fc5599")}</Button>
        </div>}
      </div>
    </div>
  );
}

function ProviderConnectStep({
  provider,
  slackStage,
  onSlackCredentialsContinue,
  onSlackVerificationContinue,
  slackVerificationError,
  onSlackAppCreated,
  agentName,
  endpoint,
  credentials,
  setCredentials,
  repairing,
  pending,
  onAutomaticBusy,
  managedAutoStart = false,
  onEndpointSaved,
  generatedWebhookSecret,
  generatingSetupSecret,
  onGenerateSetupSecret,
  onAction,
}: {
  provider: ChatProvider;
  slackStage: "app" | "credentials" | "finish";
  onSlackCredentialsContinue: () => void;
  onSlackVerificationContinue: () => void;
  slackVerificationError: boolean;
  onSlackAppCreated: () => void;
  agentName: string;
  endpoint: ChatEndpoint;
  credentials: Record<string, string>;
  setCredentials: Dispatch<SetStateAction<Record<string, string>>>;
  repairing: boolean;
  pending: boolean;
  managedAutoStart?: boolean;
  onAutomaticBusy: (busy: boolean) => void;
  onEndpointSaved: (endpoint: ChatEndpoint) => void;
  generatedWebhookSecret: string;
  generatingSetupSecret: boolean;
  onGenerateSetupSecret: () => void;
  onAction: (
    action: ChatEndpointSetupAction,
    values?: Record<string, string>,
  ) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const { userId, settled: identitySettled } = useAccountIdentity();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const slackBotToken = (credentials.botToken ?? "").trim();
  const slackBotTokenInvalid = provider === "slack" && slackBotToken.length > 0 &&
    !slackBotToken.startsWith("xoxb-");
  const slackSigningSecretHasTokenPrefix = provider === "slack" &&
    /^x[a-z0-9]*-/i.test((credentials.signingSecret ?? "").trim());
  const slackCredentialsSaved = provider === "slack" && Boolean(endpoint.providerAccountId);
  const continueWithSavedSlackCredentials = slackCredentialsSaved && !repairing &&
    !slackBotToken && !credentials.signingSecret?.trim();
  const reportCopyFailure = () =>
    pushToast({
      title: interfaceNotice("interface:couldnTCopyToClipboard_ffaeca"),
      body: interfaceNotice("interface:selectAndCopyTheValueManually_07ec3c"),
      tone: "error",
    });
  const field = (key: string, label: string, type = "password") => (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input
        type={type}
        value={credentials[key] ?? ""}
        onChange={(event) =>
          setCredentials({ ...credentials, [key]: event.target.value })
        }
      />
    </label>
  );
  const openProviderSetup = (fallback: string) =>
    window.open(
      endpoint.setup?.authorizationUrl ??
        endpoint.setup?.providerUrl ??
        fallback,
      "_blank",
      "noopener,noreferrer",
    );
  const endpointValue = (label: string, value: string | null | undefined) => (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="rounded-lg border border-border bg-muted p-3 font-mono text-xs break-all">
        {value ??
          pageText("thisEndpointIsUnavailableCheckTheServerS_b6962e")}
      </div>
    </div>
  );
  const [manifestCopied, setManifestCopied] = useState(false);
  // A hook rather than a sticky boolean: this step stays mounted when the
  // secret is regenerated, so a latched "copied" would keep vouching for a
  // value the reader never copied. The status resets itself, and a refused
  // clipboard reads as a failure instead of a success.
  const webhookSecretCopy = useCopyAction();
  const [openingSlackApp, setOpeningSlackApp] = useState(false);
  const slackAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setOpeningSlackApp(false);
    return () => {
      if (slackAdvanceTimer.current !== null) {
        clearTimeout(slackAdvanceTimer.current);
        slackAdvanceTimer.current = null;
      }
    };
  }, [slackStage]);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [privateKeyFileError, setPrivateKeyFileError] = useState<string | null>(
    null,
  );
  const [privateKeyFileLoaded, setPrivateKeyFileLoaded] = useState(false);
  const [privateKeyFileLoading, setPrivateKeyFileLoading] = useState(false);
  const privateKeyFileInputRef = useRef<HTMLInputElement>(null);
  const privateKeyReadGuard = useRef(createGitHubPrivateKeyReadGuard()).current;
  useEffect(
    () => () => {
      privateKeyReadGuard.invalidate();
    },
    [privateKeyReadGuard],
  );
  const loadPrivateKeyFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const readRevision = privateKeyReadGuard.start();
    setPrivateKeyFileError(null);
    setPrivateKeyFileLoaded(false);
    setPrivateKeyFileLoading(true);
    try {
      const privateKey = await readGitHubPrivateKeyFile(file);
      if (!privateKeyReadGuard.isCurrent(readRevision)) return;
      setCredentials((current) => ({ ...current, privateKey }));
      setPrivateKeyVisible(false);
      setPrivateKeyFileLoaded(true);
    } catch (error) {
      if (!privateKeyReadGuard.isCurrent(readRevision)) return;
      setPrivateKeyFileError(
        describeError(error).body,
      );
    } finally {
      if (privateKeyReadGuard.isCurrent(readRevision)) {
        setPrivateKeyFileLoading(false);
      }
    }
  };
  const replacePrivateKey = (privateKey: string) => {
    privateKeyReadGuard.invalidate();
    setPrivateKeyFileError(null);
    setPrivateKeyFileLoaded(false);
    setPrivateKeyFileLoading(false);
    setCredentials((current) => ({ ...current, privateKey }));
  };
  const slackApp = endpoint.setup?.slackApp ?? {
    ...defaultSlackAppConfiguration(agentName),
    ...(endpoint.setup?.command ? { command: endpoint.setup.command } : {}),
  };
  const automaticSlack = isProvisionedSlackSetup(endpoint.setup?.slackSetupMethod);
  const slackValidation = slackAppConfigurationSchema.safeParse(slackApp);
  const saveSlackAndExit = () => navigate("/apps");
  const slackAppName = slackApp.appName.trim();
  const slackBotName = slackApp.botName.trim();
  const slackCommand = slackApp.command.trim();
  const slackWebhookUrl =
    endpoint.setup?.webhookUrl ?? "<paperclip-webhook-url>";
  const slackManifest = JSON.stringify(buildSlackAppManifest({
    app: { appName: slackAppName, botName: slackBotName, command: slackCommand }, agentName,
    webhookUrl: slackWebhookUrl,
    ...(automaticSlack && endpoint.setup?.slackOAuthCallbackUri ? { redirectUri: endpoint.setup.slackOAuthCallbackUri } : {}),
  }), null, 2);
  const slackCreateUrl = `https://api.slack.com/apps?new_app=1&manifest_json=${encodeURIComponent(slackManifest)}`;
  useEffect(() => setManifestCopied(false), [slackManifest]);
  const teamsClientId =
    credentials.clientId?.trim() || "<application-client-id>";
  const teamsManifestSettings = JSON.stringify(
    {
      bots: [
        {
          botId: teamsClientId,
          scopes: ["personal", "team", "groupChat"],
          supportsFiles: true,
          isNotificationOnly: false,
          commandLists: [
            {
              scopes: ["personal", "groupChat"],
              commands: [
                {
                  title: "/status",
                  description: "Show the active Paperclip task status",
                },
                {
                  title: "/new",
                  description: "Start a new Paperclip task in this chat",
                },
                {
                  title: "/close",
                  description: "Close the active chat conversation",
                },
              ],
            },
          ],
        },
      ],
      webApplicationInfo: {
        id: teamsClientId,
        resource: "https://paperclip.ing",
      },
      authorization: {
        permissions: {
          resourceSpecific: [
            { name: "ChannelMessage.Read.Group", type: "Application" },
            { name: "ChatMessage.Read.Chat", type: "Application" },
          ],
        },
      },
    },
    null,
    2,
  );
  if (provider === "speko") return <SpekoProviderSetup onSaveExit={() => navigate("/apps")} agentName={agentName} credentials={credentials} onChange={setCredentials} onConnect={(values) => onAction(repairing ? "reconnect" : "configure", values)} callbackUrl={endpoint.setup?.webhookUrl} pending={pending} repairing={repairing} signingSecretConfigured={endpoint.setup?.webhookSecretConfigured} />;
  if (provider === "imessage-photon") return <PhotonConnectStep endpoint={endpoint} agentName={agentName} repairing={repairing} pending={pending} onAction={onAction} />;
  if (provider === "discord") {
    const applicationId = credentials.applicationId?.trim() ?? "";
    const guildId = credentials.guildId?.trim() ?? "";
    const installUrl = applicationId
      ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(applicationId)}&permissions=309237763136&scope=bot${guildId ? `&guild_id=${encodeURIComponent(guildId)}&disable_guild_select=true` : ""}`
      : null;
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">{pageText("connect_b65463") + " "}{agentName}{" " + pageText("toDiscord_87d1c4")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {repairing
              ? pageText("reconnectVerifiesThisSameDiscordApplicationAndServer_9c9e49")
              : pageText("createOneDedicatedDiscordApplicationAndBotFor_d4e6c3")}
          </p>
        </div>
      <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>{pageText("inDiscordDeveloperPortalCreateAnApplicationCopy_590118")}</li>
          <li>{pageText("openBotCreateTheBotEnableMessageContent_0069f0")}</li>
          <li>{pageText("enableDeveloperModeInDiscordRightClickThe_314b37")}</li>
          <li>{pageText("enterThoseValuesBelowThenUseTheGenerated_713f25")}</li>
        </ol>
        <Button
          variant="outline"
          onClick={() =>
            openProviderSetup("https://discord.com/developers/applications")
          }
        >{pageText("openDiscordDeveloperPortal_eda048") + " "}<ExternalLink />
        </Button>
        {field("applicationId", "Application ID", "text")}
        {field("guildId", "Server ID", "text")}
        {field("botToken", "Bot token")}
        {installUrl && (
          <Button asChild variant="outline">
            <a href={installUrl} target="_blank" rel="noreferrer">{pageText("installBotInThisServer_d398ef") + " "}<ExternalLink />
            </a>
          </Button>
        )}
        <p className="text-sm text-muted-foreground">{pageText("theInstallLinkGrantsOnlyViewChannelsSend_458fa0")}</p>
        <Button
          disabled={
            (!repairing &&
              (!credentials.applicationId ||
                !credentials.guildId ||
                !credentials.botToken)) ||
            pending
          }
          onClick={() =>
            onAction(repairing ? "reconnect" : "configure", credentials)
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {repairing ? pageText("reconnectDiscordBot_cc9fb4") : pageText("connectDiscordBot_e0e3db")}
        </Button>
      </div>
    );
  }
  if (provider === "telegram")
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">{pageText("create_6e157c") + " "}{agentName}{" " + pageText("inTelegram_fcf0d5")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {repairing
              ? pageText("reconnectVerifiesThisSameBotFatherBotAndAutomatically_4ebb5b")
              : pageText("createABotWithBotFatherThenPasteThe_b83115")}
          </p>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>{pageText("openBotFatherAndSend_35beb8") + " "}<code>/newbot</code>.
          </li>
          <li>{pageText("enterTheBotDisplayName_22c13f")}</li>
          <li>{pageText("chooseAnAvailableUsernameEndingIn_0bde75") + " "}<code>bot</code>.
          </li>
        </ol>
        <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{pageText("paperclipWorksWithTelegramSDefaultBotPrivacy_66e1ad")}{" "}
          <code>/task@bot_username &lt;request&gt;</code>{pageText("orReplyDirectlyToAMessageFromThe_46da33")}</p>
        <Button
          variant="outline"
          onClick={() => openProviderSetup("https://t.me/BotFather")}
        >{pageText("openBotFather_1f77c9") + " "}<ExternalLink />
        </Button>
        {field("botToken", "Bot token")}
        {(!endpoint.setup?.webhookUrl || automaticSlack && !endpoint.setup?.slackOAuthCallbackUri?.startsWith("https://")) && (
          <p className="text-sm text-destructive">{pageText("configureAPublicHTTPSURLForThisPaperclip_487a12")}</p>
        )}
        <Button
          disabled={
            (!repairing && !credentials.botToken) ||
            !endpoint.setup?.webhookUrl ||
            pending
          }
          onClick={() =>
            onAction(repairing ? "reconnect" : "configure", credentials)
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {repairing ? pageText("reconnectBot_46f1b5") : pageText("connectBot_27663b")}
        </Button>
      </div>
    );
  if (provider === "microsoft-teams")
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">{pageText("connect_b65463") + " "}{agentName}{" " + pageText("toMicrosoftTeams_015fd9")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {repairing
              ? pageText("reconnectVerifiesThisSameMicrosoftAppTenantAnd_681c3b")
              : pageText("useYourOwnMicrosoftAppCredentialsForThis_026917")}
          </p>
        </div>
        <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{pageText("thisSetupRequiresAMicrosoft365WorkOr_92e47b")}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>{pageText("inMicrosoftEntraCreateASingleTenantApp_07187a")}</li>
          <li>{pageText("inAzureCreateAnAzureBotChooseSingle_d41fb6")}</li>
          <li>{pageText("inTeamsDeveloperPortalCreateAnAppAdd_3c42d5")}</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a
              href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
              target="_blank"
              rel="noreferrer"
            >{pageText("openMicrosoftEntra_b7e9d4") + " "}<ExternalLink />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://portal.azure.com/#create/Microsoft.AzureBot"
              target="_blank"
              rel="noreferrer"
            >{pageText("createAzureBot_543c85") + " "}<ExternalLink />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://dev.teams.microsoft.com/apps"
              target="_blank"
              rel="noreferrer"
            >{pageText("openTeamsDeveloperPortal_faae75") + " "}<ExternalLink />
            </a>
          </Button>
        </div>
        {endpointValue(
          "Paperclip messaging endpoint",
          endpoint.setup?.messagingEndpoint,
        )}
        {field("clientId", "Application / Client ID", "text")}
        {field("tenantId", "Directory / Tenant ID", "text")}
        {field("clientSecret", "Client secret value")}
        <section className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <h2 className="text-sm font-semibold">{pageText("microsoftPortalFieldMap_cb1f0f")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{pageText("useTheseExactPortalSectionsAndReuseThe_8ede84")}</p>
          </div>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            <li>
              <strong>{pageText("microsoftEntraAdminCenterAppRegistrations_58a014")}</strong>{pageText("select_ec59e1") + " "}<strong>{pageText("newRegistration_8658a5")}</strong>{pageText("choose_1b24a7")}{" "}
              <strong>{pageText("accountsInThisOrganizationalDirectoryOnlySingleTenant_fa5e03")}</strong>{pageText("thenSelect_aff221") + " "}<strong>{pageText("register_d67299")}</strong>{pageText("copy_1d4ca6")}{" "}
              <strong>{pageText("applicationClientID_fe8590")}</strong>{" " + pageText("and_cffa50")}{" "}
              <strong>{pageText("directoryTenantID_d2f573")}</strong>{pageText("under_433f34")}{" "}
              <strong>{pageText("certificatesSecretsClientSecrets_432e72")}</strong>{pageText("select_51396c") + " "}<strong>{pageText("newClientSecret_1b75c1")}</strong>{" " + pageText("andCopyIts_235b93")}{" "}
              <strong>{translateUi("interfaceCopy.value")}</strong>{pageText("notItsSecretID_f48831")}</li>
            <li>
              <strong>{pageText("azureCreateAzureBot_bad3ee")}</strong>{pageText("set_8409f6")}{" "}
              <strong>{pageText("microsoftAppID_61ed98")}</strong>{" " + pageText("to_4374aa")}{" "}
              <strong>{pageText("singleTenant_130642")}</strong>{pageText("set_da3b8d") + " "}<strong>{pageText("creationType_85d105")}</strong>{" "}{pageText("to_4374aa") + " "}<strong>{pageText("useExistingAppRegistration_6b36ea")}</strong>{pageText("andEnterTheApplicationIDAndTenantID_cddc95")}{" "}
              <strong>{pageText("settingsConfiguration_1b76a2")}</strong>{" " + pageText("andPasteThePaperclip_cba5fd")}{" "}
              <strong>{pageText("messagingEndpoint_976c73")}</strong>{pageText("thenOpen_e96eb3")}{" "}
              <strong>{pageText("settingsChannels_976f82")}</strong>{" " + pageText("andEnable_dc252a")}{" "}
              <strong>Microsoft Teams</strong>.
            </li>
            <li>
              <strong>{pageText("teamsDeveloperPortalApps_7ab94d")}</strong>{pageText("select_ec59e1")}{" "}
              <strong>{pageText("newApp_df29c0")}</strong>{pageText("under_433f34")}{" "}
              <strong>{pageText("configureAppFeaturesBot_82332d")}</strong>{pageText("addAnExistingBotUsingTheSameApplication_1bffcb")}{" "}
              <strong>{pageText("personal_40f073")}</strong>, <strong>{pageText("team_218887")}</strong>{pageText("and_8278d2")}{" "}
              <strong>{pageText("groupChat_323d21")}</strong>{" " + pageText("scopesPlusFileSupportUnder_719d65")}{" "}
              <strong>{pageText("configurePermissions_d4f411")}</strong>{pageText("addTheTwoRSC_2095fa")}{" "}
              <strong>{translateUi("interfaceCopy.application")}</strong>{" " + pageText("permissionsShownBelowCompleteTheRequiredAppDetails_65478d")}</li>
            <li>
              <strong>{pageText("microsoftTeamsAppsManageYourApps_a4b77c")}</strong>{pageText("select_ec59e1")}{" "}
              <strong>{pageText("uploadAnAppUploadACustomApp_9b7170")}</strong>{pageText("chooseTheDownloadedPackageAndInstallItIn_bbd636")}</li>
          </ol>
        </section>
        <label className="grid gap-2 text-sm font-medium">{pageText("requiredTeamsAppManifestBlock_613881")}<Textarea
            className="min-h-80 font-mono text-xs"
            readOnly
            value={teamsManifestSettings}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!credentials.clientId?.trim()}
            onClick={() => {
              void copyTextToClipboard(teamsManifestSettings).then(
                () => setManifestCopied(true),
                reportCopyFailure,
              );
            }}
          >
            {manifestCopied
              ? pageText("manifestSettingsCopied_d97d57")
              : pageText("copyManifestSettings_3a7547")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{pageText("enterTheApplicationClientIDAboveBeforeCopying_cfbc4c")}</p>
        <p className="text-sm text-muted-foreground">{pageText("paperclipDoesNotUseTeamsSingleSignOn_5db627") + " "}<code>webApplicationInfo</code>{" " + pageText("entryOnlyAssociatesTheRSCPermissionsWithThe_56e0a0")}</p>
        <p className="text-sm text-muted-foreground">{pageText("theTwoApplicationRSCPermissionsLetTheBot_b44b7e")}</p>
        <p className="text-sm text-muted-foreground">{pageText("thisReleaseSupportsPersonalChatsGroupChatsAnd_3057c5") + " "}<code>supportsFiles: true</code>{" "}{pageText("enablesNativeFileReceiptAndConsentBasedSending_cd8cb2")}</p>
        {!endpoint.setup?.messagingEndpoint && (
          <p className="text-sm text-destructive">{pageText("configureAPublicHTTPSURLForThisPaperclip_a5d1fa")}</p>
        )}
        <Button
          disabled={
            (!repairing &&
              (!credentials.clientId ||
                !credentials.tenantId ||
                !credentials.clientSecret)) ||
            !endpoint.setup?.messagingEndpoint ||
            pending
          }
          onClick={() =>
            onAction(repairing ? "reconnect" : "configure", credentials)
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {repairing
            ? pageText("reconnectMicrosoftApp_f3e474")
            : pageText("verifyMicrosoftCredentials_e2cde2")}
        </Button>
      </div>
    );
  if (provider === "github")
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">
            {repairing
              ? pageText("reconnectGitHubApp_ae8203")
              : pageText("createOrConnectAGitHubApp_8793ca")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {repairing
              ? pageText("reconnectVerifiesThisSameAppAndInstallationThen_cbf939")
              : pageText("configureItsWebhookAndPermissionsThenVerifyThe_dc89f2")}
          </p>
        </div>
        {!repairing && (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>{pageText("underTheTargetUserOrOrganizationCreateA_34fe09")}</li>
            <li>{pageText("keep_466fc4") + " "}<strong>{pageText("webhooksActive_d07b06")}</strong>{" " + pageText("onEnterThePaperclipWebhookURLAndThe_fbbcb7") + " "}<strong>{pageText("enableSSLVerification_b1de2c")}</strong>{" " + pageText("selected_07b3d7")}</li>
            <li>{pageText("underRepositoryPermissionsSet_52ac67") + " "}<strong>{pageText("issues_30ce4c")}</strong>{" " + pageText("and_cffa50")}{" "}
              <strong>{pageText("pullRequests_80302e")}</strong>{" " + pageText("to_4374aa")}{" "}
              <strong>{pageText("readWrite_4bf56d")}</strong>{pageText("leaveEveryOtherPermissionAtItsDefaultMetadata_5e489d")}</li>
            <li>{pageText("subscribeTo_a7ab5b") + " "}<strong>{pageText("issueComment_89b67c")}</strong> (
              <code>issue_comment</code>),{" "}
              <strong>{pageText("pullRequestReviewComment_a0a3da")}</strong> (
              <code>pull_request_review_comment</code>{pageText("githubSends_2ef6b7")}{" "}
              <code>installation</code>{" " + pageText("and_cffa50")}{" "}
              <code>installation_repositories</code>{" " + pageText("toEveryGitHubAppAutomaticallyTheyAreNot_1355cd")}</li>
            <li>{pageText("choose_78b7c9") + " "}<strong>{pageText("onlyOnThisAccount_53b11b")}</strong>{pageText("createTheAppCopyItsAppIDGenerate_801153")}</li>
          </ol>
        )}
        {endpointValue(
          "Paperclip homepage URL",
          publicOrigin(endpoint.setup?.webhookUrl),
        )}
        {endpointValue("Paperclip webhook URL", endpoint.setup?.webhookUrl)}
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              repairing
                ? "https://github.com/settings/apps"
                : (endpoint.setup?.authorizationUrl ??
                    "https://github.com/settings/apps/new"),
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          {repairing ? pageText("openGitHubAppSettings_fe0cef") : pageText("openNewGitHubAppForm_35af27")}{" "}
          <ExternalLink />
        </Button>
        {field("appId", "GitHub App ID", "text")}
        <div className="grid gap-2 text-sm font-medium">
          <label htmlFor="github-private-key">{pageText("privateKeyPEM_9fa9e6")}</label>
          <div className="relative">
            {privateKeyVisible ? (
              <Textarea
                id="github-private-key"
                className="min-h-24 pr-11 font-mono text-xs"
                value={credentials.privateKey ?? ""}
                onChange={(event) => replacePrivateKey(event.target.value)}
              />
            ) : (
              <Input
                id="github-private-key"
                type="password"
                className="pr-11 font-mono text-xs"
                value={credentials.privateKey ?? ""}
                onChange={(event) => replacePrivateKey(event.target.value)}
                onPaste={(event) => {
                  event.preventDefault();
                  replacePrivateKey(event.clipboardData.getData("text"));
                }}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1"
              aria-label={
                privateKeyVisible ? pageText("hidePrivateKey_cd85f9") : pageText("showPrivateKey_5c0f22")
              }
              onClick={() => setPrivateKeyVisible((visible) => !visible)}
            >
              {privateKeyVisible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          <input
            ref={privateKeyFileInputRef}
            type="file"
            accept=".pem,.key,application/x-pem-file,application/pkcs8,text/plain"
            className="hidden"
            aria-label={pageText("chooseGitHubAppPrivateKeyFile_0e2673")}
            onChange={loadPrivateKeyFile}
          />
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => privateKeyFileInputRef.current?.click()}
            >{pageText("choosePemFile_d20cff")}</Button>
          </div>
          {privateKeyFileError ? (
            <p role="alert" className="text-sm text-destructive">
              {privateKeyFileError}
            </p>
          ) : null}
          {privateKeyFileLoading ? (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >{pageText("readingPrivateKeyFile_94a8a1")}</p>
          ) : privateKeyFileLoaded ? (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >{pageText("privateKeyLoadedItStaysInThisForm_a39b38")}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">{pageText("webhookSecret_ba261e")}</p>
          {generatedWebhookSecret ? (
            <>
              <Input
                aria-label={pageText("generatedWebhookSecret_43d318")}
                className="font-mono text-xs"
                readOnly
                value={generatedWebhookSecret}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Both signals, and each covers the other's blind spot.
                    // The toast is the loud one, the way this step's other two
                    // copy buttons report failure — but the provider dedupes an
                    // identical toast inside 3.5s, so a reader who clicks twice
                    // on a blocked clipboard would see nothing the second time.
                    // The inline state answers every click.
                    void webhookSecretCopy
                      .copy(generatedWebhookSecret)
                      .then((status) => {
                        if (status === "failed") reportCopyFailure();
                      });
                  }}
                >
                  {webhookSecretCopy.copied
                    ? pageText("webhookSecretCopied_54bbce")
                    : webhookSecretCopy.failed
                      ? pageText("couldnTCopySelectItManually_e71d3a")
                      : pageText("copyWebhookSecret_b011af")}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{pageText("copyThisValueNowPaperclipWillNotShow_83e84e")}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {endpoint.setup?.webhookSecretConfigured
                ? pageText("aWebhookSecretIsConfiguredAndCannotBe_6feb89")
                : pageText("generateTheSecretInPaperclipThenPasteIt_22f550")}
            </p>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={generatingSetupSecret}
              onClick={onGenerateSetupSecret}
            >
              {generatingSetupSecret && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {endpoint.setup?.webhookSecretConfigured
                ? pageText("regenerateWebhookSecret_afc592")
                : pageText("generateWebhookSecret_3bd179")}
            </Button>
          </div>
          {endpoint.setup?.webhookSecretConfigured && (
            <p className="text-sm text-muted-foreground">
              {endpoint.providerAccountId || endpoint.botExternalId
                ? pageText("regeneratingImmediatelyInvalidatesGitHubWebhookSignaturesUntilYou_68d203")
                : pageText("generatingAnotherSecretReplacesThePreviousValuePaste_cab440")}
            </p>
          )}
          {endpoint.setup?.webhookSecretConfigured && (
            <p
              className={`text-sm ${endpoint.setup.webhookVerifiedAt ? "text-foreground" : "text-muted-foreground"}`}
            >
              {endpoint.setup.webhookVerifiedAt
                ? pageText("githubHasVerifiedThisWebhook_56fe10")
                : pageText("waitingForGitHubToDeliverItsSignedWebhook_d563bc")}
            </p>
          )}
        </div>
        {(!endpoint.setup?.webhookUrl || automaticSlack && !endpoint.setup?.slackOAuthCallbackUri?.startsWith("https://")) && (
          <p className="text-sm text-destructive">{pageText("configureAPublicHTTPSURLForThisPaperclip_56571c")}</p>
        )}
        <Button
          disabled={
            (!repairing && (!credentials.appId || !credentials.privateKey)) ||
            !endpoint.setup?.webhookSecretConfigured ||
            !endpoint.setup?.webhookVerifiedAt ||
            !endpoint.setup?.webhookUrl ||
            privateKeyFileLoading ||
            generatingSetupSecret ||
            pending
          }
          onClick={() =>
            onAction(repairing ? "reconnect" : "configure", credentials)
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {repairing ? pageText("reconnectAndVerify_2c066c") : pageText("connectAndVerify_8885f3")}
        </Button>
      </div>
    );
  const slackRequestUrlInstructions = <ol className="list-decimal space-y-2 pl-5 text-sm">
      <li><a className="underline underline-offset-4" href={endpoint.setup?.slackRegistration?.appId ? `https://api.slack.com/apps/${encodeURIComponent(endpoint.setup.slackRegistration.appId)}/event-subscriptions` : "https://api.slack.com/apps"} target="_blank" rel="noopener noreferrer">{pageText("openSlackAppSettings_33e079") + " "}<ExternalLink className="inline size-3" /></a>{" " + pageText("andChoose_08e049") + " "}<strong>{slackApp.appName}</strong>.</li>
      <li>{pageText("choose_78b7c9") + " "}<strong>{pageText("eventSubscriptions_3b2988")}</strong>.</li>
      <li>{pageText("besideThePrefilled_399d97") + " "}<strong>{pageText("requestURL_befd91")}</strong>{pageText("click_0dff61") + " "}<strong>{translateUi("interfaceCopy.retry")}</strong>{" " + pageText("ifItIsnTVerifiedSaveChangesIf_dad1eb")}</li>
    </ol>;
  if (slackStage === "finish")
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">{automaticSlack ? pageText("sendAMessageToYourAgent_29aab2") : pageText("verifySlackConnection_cfb702")}</h1>
          {!automaticSlack && <p className="mt-1 text-sm text-muted-foreground">{pageText("slackNeedsToConfirmThatItCanReach_6e2294")}</p>}
        </div>
        {automaticSlack ? <Button asChild variant="outline"><a href={slackConversationUrl(endpoint, identitySettled ? userId : null)} target="_blank" rel="noopener noreferrer">{pageText("openSlack_eec851") + " "}<ExternalLink className="size-4" /></a></Button> : slackRequestUrlInstructions}
        {endpoint.setup?.webhookVerifiedAt ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-(--status-task-done)" />{pageText("yourSlackConnectionIsWorking_176b18")}{pending ? automaticSlack ? " " + pageText("finishingSetup_0744df") : " " + pageText("openingTheMessageTest_371adb") : ""}
          </p>
        ) : slackVerificationError ? (
          <p role="alert" className="text-sm text-destructive">{pageText("couldnTCheckVerificationWeLlKeepTrying_f46018")}</p>
        ) : (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {automaticSlack ? pageText("waitingForYourMessage_d33c49") : pageText("waitingForSlackWeLlContinueAutomatically_ed79b8")}
          </p>
        )}
        <SlackSetupAdvanced label={automaticSlack ? pageText("didnTWork_b0b097") : pageText("troubleshooting_285ec8")}>
          {automaticSlack && slackRequestUrlInstructions}
          <p className="text-muted-foreground">{pageText("ifTheRequestURLIsMissingOrDifferent_399531")}</p>
          {endpointValue("Paperclip webhook URL", endpoint.setup?.webhookUrl)}
        </SlackSetupAdvanced>
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate("/apps")}>{pageText("saveExit_fc5599")}</Button>
          {(!automaticSlack || endpoint.setup?.webhookVerifiedAt) && <Button disabled={pending || !endpoint.setup?.webhookVerifiedAt} onClick={() =>
            endpoint.setup?.step === "provider_setup" ? onAction("verify") : onSlackVerificationContinue()
          }>
            {pending && <Loader2 className="size-4 animate-spin" />}{pageText("continue_2e0262")}</Button>}
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      {(!endpoint.setup?.webhookUrl || automaticSlack && !endpoint.setup?.slackOAuthCallbackUri?.startsWith("https://")) && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{pageText("publicHTTPSURLRequired_05b327")}</p>
            <p className="text-sm">{pageText("slackNeedsAPublicHTTPSURLToSend_7edf74")}</p>
            <a
              href="https://docs.paperclip.ing/reference/deploy/https/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4"
            >{pageText("learnHowToSetUpHTTPS_27cab8")}</a>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold">{endpoint.setup?.slackSetupMethod === "managed" ? pageText("connectToSlack_2860f4") : slackStage === "app" ? automaticSlack ? pageText("appConfigurationAccessToken_4c31df") : pageText("createASlackApp_07c102") : automaticSlack ? pageText("installSlackApp_84ec17") : pageText("addSlackCredentials_666248")}</h1>
        {repairing && !automaticSlack && (
          <p className="mt-1 text-sm text-muted-foreground">{pageText("reconnectVerifiesOrReplacesCredentialsForThisSame_b92c0e")}</p>
        )}
      </div>
      <div hidden={slackStage !== "app" || automaticSlack} className="space-y-5">
        <div className="space-y-3 text-sm">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground underline underline-offset-4">{pageText("viewSlackAppManifest_6646f0")}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{pageText("slackAppManifest_341846")}</DialogTitle>
                  <DialogDescription>{pageText("generatedFromYourAppNameBotNameAnd_dd1c8c")}</DialogDescription>
                </DialogHeader>
                <Textarea
                  aria-label={pageText("slackAppManifest_341846")}
                  className="h-80 font-mono text-xs"
                  readOnly
                  value={slackManifest}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={!slackValidation.success}
                    onClick={() => {
                      void copyTextToClipboard(slackManifest).then(
                        () => setManifestCopied(true),
                        reportCopyFailure,
                      );
                    }}
                  >
                    {manifestCopied ? pageText("manifestCopied_ac3a93") : pageText("copyManifest_787420")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {!automaticSlack && <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => void saveSlackAndExit()}>{pageText("saveExit_fc5599")}</Button>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" disabled={openingSlackApp || !endpoint.setup?.webhookUrl || !slackValidation.success} onClick={onSlackAppCreated}>{pageText("iAlreadyCreatedTheApp_4413a5")}</Button>
            {!repairing && (
              <Button
                disabled={openingSlackApp || !endpoint.setup?.webhookUrl || !slackValidation.success}
                onClick={() => {
                  window.open(slackCreateUrl, "_blank", "noopener,noreferrer");
                  setOpeningSlackApp(true);
                  // Let Slack open before changing the step behind its new tab.
                  slackAdvanceTimer.current = setTimeout(() => {
                    slackAdvanceTimer.current = null;
                    setOpeningSlackApp(false);
                    onSlackAppCreated();
                  }, 1000);
                }}
              >{pageText("createSlackApp_ecbbce") + " "}<ExternalLink />
              </Button>
            )}
          </div>
        </div>}
      </div>
      {automaticSlack && <SlackSetup
        key={endpoint.id}
        autoStart={managedAutoStart}
        reconnect={repairing}
        endpoint={endpoint} stage={slackStage} disabled={!endpoint.setup?.webhookUrl || !endpoint.setup?.slackOAuthCallbackUri?.startsWith("https://") || !slackValidation.success}
        saveDetails={async () => {}}
        onBusy={onAutomaticBusy} onSaved={onEndpointSaved} onContinue={onSlackAppCreated}
        onManual={async existing => {
          onEndpointSaved(await chatEndpointsApi.update(endpoint.id, { slackSetupMethod: existing ? "existing" : "manual" }));
          if (existing) onSlackAppCreated();
        }}
        onSaveExit={() => void saveSlackAndExit()}
      />}
      {!automaticSlack && <div hidden={slackStage !== "credentials"} className="space-y-5">
        <p className="text-sm">{pageText("nowYouNeedToFindTwoSecretsThey_c26ae0")}</p>
        {slackCredentialsSaved && !repairing && (
          <p className="text-sm text-muted-foreground">{pageText("yourCredentialsAreSavedLeaveTheFieldsBlank_d53284")}</p>
        )}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold"><label htmlFor="slack-bot-token">{pageText("botUserOAuthToken_e20222")}</label></h2>
          <ul id="slack-bot-token-help" className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{pageText("openSlackAppSettings_33e079") + " "}<ExternalLink className="inline size-3" />
              </a>{" " + pageText("andChoose_08e049") + " "}<strong>{slackApp.appName}</strong>.
            </li>
            <li>{pageText("choose_78b7c9") + " "}<strong>{pageText("oauthPermissions_efd480")}</strong></li>
            <li>{pageText("copyAndPasteYour_b89dc8") + " "}<strong>{pageText("botOAuthToken_de4f25")}</strong></li>
          </ul>
          <Input
            id="slack-bot-token"
            type="password"
            placeholder={slackCredentialsSaved ? pageText("savedLeaveBlankToKeep_c4a627") : undefined}
            value={credentials.botToken ?? ""}
            aria-invalid={slackBotTokenInvalid || undefined}
            aria-describedby={`slack-bot-token-help${slackBotTokenInvalid ? " slack-bot-token-warning" : ""}`}
            onChange={(event) => setCredentials({ ...credentials, botToken: event.target.value })}
          />
          {slackBotTokenInvalid && (
            <p id="slack-bot-token-warning" role="alert" className="text-sm text-destructive">{pageText("yourBotUserOAuthTokenMustStartWith_1d5b14") + " "}<code>xoxb-</code>{pageText("copyItFrom_38f89c") + " "}<strong>{pageText("oauthPermissions_efd480")}</strong>.
            </p>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold"><label htmlFor="slack-signing-secret">{pageText("signingSecret_7898d0")}</label></h2>
          <ul id="slack-signing-secret-help" className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{pageText("openSlackAppSettings_33e079") + " "}<ExternalLink className="inline size-3" />
              </a>{" " + pageText("andChoose_08e049") + " "}<strong>{slackApp.appName}</strong>.
            </li>
            <li>{pageText("choose_78b7c9") + " "}<strong>{pageText("basicInformation_b0d5be")}</strong></li>
            <li>{pageText("copyAndPasteYour_b89dc8") + " "}<strong>{pageText("signingSecret_7898d0")}</strong></li>
          </ul>
          <Input
            id="slack-signing-secret"
            type="password"
            placeholder={slackCredentialsSaved ? pageText("savedLeaveBlankToKeep_c4a627") : undefined}
            value={credentials.signingSecret ?? ""}
            aria-invalid={slackSigningSecretHasTokenPrefix || undefined}
            aria-describedby={`slack-signing-secret-help${slackSigningSecretHasTokenPrefix ? " slack-signing-secret-warning" : ""}`}
            onChange={(event) => setCredentials({ ...credentials, signingSecret: event.target.value })}
          />
          {slackSigningSecretHasTokenPrefix && (
            <p id="slack-signing-secret-warning" role="alert" className="text-sm text-destructive">{pageText("useThe_340d33") + " "}<strong>{pageText("signingSecret_7898d0")}</strong>{pageText("notAnAppOrBotTokenTheSigning_476ed3")}</p>
          )}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate("/apps")}>{pageText("saveExit_fc5599")}</Button>
          <Button
            className="ml-auto"
            disabled={
              (!repairing && !slackCredentialsSaved && (!slackBotToken || !credentials.signingSecret?.trim())) ||
              !endpoint.setup?.webhookUrl || !slackValidation.success ||
              pending || slackSigningSecretHasTokenPrefix || slackBotTokenInvalid
            }
            onClick={() => continueWithSavedSlackCredentials
              ? onSlackCredentialsContinue()
              : onAction(repairing || slackCredentialsSaved ? "reconnect" : "configure", credentials)}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {continueWithSavedSlackCredentials ? pageText("continue_2e0262") : repairing || slackCredentialsSaved ? pageText("reconnectSlackApp_bcef80") : pageText("connectSlackApp_a0ceff")}
          </Button>
        </div>
      </div>}
    </div>
  );
}

function TryStep({
  endpointId,
  provider,
  agentName,
  botLabel,
  botUsername,
  slackAccount,
  photonAllocation,
  providerUrl,
  guestIsolationState,
  pending,
  onOpenAccess,
  onTest,
  onSaveExit,
}: {
  endpointId: string;
  provider: ChatProvider;
  agentName: string;
  botLabel?: string | null;
  botUsername?: string | null;
  slackAccount?: import("@paperclipai/shared").SlackAccountState;
  photonAllocation?: "dedicated" | "shared";
  providerUrl?: string | null;
  guestIsolationState: "loading" | "enabled" | "disabled" | "unknown";
  pending: boolean;
  onOpenAccess: () => void;
  onTest: () => void;
  onSaveExit: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const [commandCopied, setCommandCopied] = useState(false);
  const [commandCopyError, setCommandCopyError] = useState(false);
  const principalsQuery = useQuery({
    queryKey: queryKeys.chatEndpoints.principals(endpointId),
    queryFn: () => chatEndpointsApi.listPrincipals(endpointId),
    enabled: provider !== "slack",
    refetchInterval: 1_500,
  });
  const principalsView = useQueryView(principalsQuery);
  const principalsLoaded = principalsView.kind === "ready" || principalsView.kind === "stale";
  const principalsFailed = principalsView.kind === "error";
  const [numberCopied, setNumberCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const identities = principalsQuery.data ?? [];
  const unlinkedIdentities = identities.filter(
    (identity) => identity.status !== "linked",
  );
  const freshConversationInstruction =
    provider === "imessage-photon" ? "send a fresh message to your Photon number" : provider === "telegram"
      ? "start a fresh conversation with /new and send the test message again"
      : provider === "github"
        ? "start a new issue or pull request conversation and mention the agent again"
        : provider === "microsoft-teams"
          ? "start a new channel post and mention the agent again"
          : "send a new root mention to the agent";
  const identityGuidance = provider === "slack" ? null : provider === "imessage-photon" && principalsLoaded && (identities.length === 0 || unlinkedIdentities.length > 0)
    ? { tone: "info" as const, title: "Link your Messages identity", body: "Send one message to discover your phone number or Apple account address, then link that exact identity in Access. Send a fresh request after linking; earlier messages do not start work." }
    : principalsFailed
    ? {
        tone: "warning" as const,
        title: "Identity readiness could not be checked",
        body: `Review Access before expecting an agent reply. After linking the account you are testing, ${freshConversationInstruction}.`,
      }
    : !principalsLoaded || guestIsolationState === "loading"
      ? null
      : identities.length === 0
        ? guestIsolationState === "disabled"
          ? {
              tone: "warning" as const,
              title: "Link the account you’re testing",
              body:
                provider === "telegram"
                  ? "Tap Start in Telegram to discover your account; the welcome does not start an agent run. Link the account privately in Access, then return and send the test message."
                  : `Your first ${providerNames[provider]} message discovers the external account, but isolated guest work is off, so it cannot safely start ${agentName}. Send it once, link that account privately in Access, then ${freshConversationInstruction}.`,
            }
          : {
              tone: "info" as const,
              title: "Your first message identifies your account",
              body:
                provider === "telegram"
                  ? "Tap Start in Telegram to discover your account. Until linked, it is a restricted guest and still needs a sandbox-backed isolated run; test that path intentionally, or link it in Access and then send the test message."
                  : `Until linked, the account is a restricted guest and still needs a sandbox-backed isolated run. Test that guest path intentionally, or link the account in Access and then ${freshConversationInstruction}.`,
            }
        : unlinkedIdentities.length > 0
          ? guestIsolationState === "disabled"
            ? {
                tone: "warning" as const,
                title: "Link the account you’re testing",
                body: `An observed external account is unlinked, and isolated guest work is off, so it cannot safely start ${agentName}. Link the account in Access, then ${freshConversationInstruction}; Paperclip does not replay the refused request.`,
              }
            : {
                tone: "info" as const,
                title: "Unlinked identity detected",
                body: `An unlinked account is a restricted guest and still needs a sandbox-backed isolated run. Test guest access intentionally, or link the account in Access and then ${freshConversationInstruction}.`,
              }
          : null;
  const providerBotUsername = botUsername?.replace(/^@/, "");
  const normalizedBotUsername =
    provider === "github"
      ? providerBotUsername?.replace(/\[bot\]$/i, "")
      : providerBotUsername;
  const botMention = normalizedBotUsername
    ? `@${normalizedBotUsername}`
    : (botLabel ?? agentName);
  const slackTestMessage = slackAccount?.status === "linked" ? "you there?" : `${botMention.startsWith("@") ? botMention : `@${botMention}`} you there?`;
  const instructions =
    provider === "imessage-photon" ? [
      photonAllocation === "shared" ? "In your Photon project, enroll your sender in Users and find its assigned number in Get started. Send a fresh message to that number from Apple Messages." : `Open Apple Messages and send a fresh message to ${botUsername ?? botLabel ?? "the dedicated number"}.`,
      "Link the discovered sender to a Paperclip person in Access, then send a fresh request.",
      "Wait for the agent’s actual reply. Setup completes after that reply is delivered.",
      ...(photonAllocation === "shared" ? ["This Pro-compatible channel supports DMs only. Group messages cannot start work."] : ["For a group: add the number in Messages, send a message, enable the discovered group in Settings, then send a fresh request."]),
    ] : provider === "discord"
      ? [
          "Open a text channel where the bot is installed.",
          `Mention ${botMention} in a new root message.`,
          `Reply once inside ${agentName}'s new Discord thread.`,
        ]
      : provider === "telegram"
        ? [
            "Open the bot's private chat.",
            "Tap Start.",
            "Send “Help me test this”.",
          ]
        : provider === "github"
          ? [
              "Open an installed issue or pull request.",
              `Mention ${botMention} in a comment.`,
              "Add another comment to continue the same task.",
            ]
          : provider === "microsoft-teams"
            ? [
                "Open an installed channel and start a new post.",
                `Mention ${botMention} in the post.`,
                "Reply once beneath the post.",
              ]
            : [
                `Open a channel and invite ${botMention} if needed.`,
                `Mention ${botMention} in a new channel message.`,
                `Reply once in ${agentName}'s thread.`,
              ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{pageText("try_726770") + " "}{agentName}{" " + pageText("in_af10ef") + " "}{providerNames[provider]}
        </h1>
        {provider !== "slack" && <p className="mt-1 text-sm text-muted-foreground">{pageText("completeThisRealConversationToFinishSetup_e8d300")}</p>}
      </div>
      {provider !== "slack" && (!principalsLoaded || guestIsolationState === "loading") &&
      !principalsFailed ? (
        <p role="status" className="text-sm text-muted-foreground">{pageText("checkingIdentityAndGuestReadiness_2cdb98")}</p>
      ) : null}
      {identityGuidance ? (
        <div
          role={identityGuidance.tone === "warning" ? "alert" : "status"}
          className={
            identityGuidance.tone === "warning"
              ? "rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
              : "rounded-lg border border-border bg-muted/30 p-4 text-sm"
          }
        >
          <h2 className="font-medium">{identityGuidance.title}</h2>
          <p className="mt-1 text-muted-foreground">{identityGuidance.body}</p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={onOpenAccess}
          >{pageText("reviewIdentityAccess_f56cc3")}</Button>
        </div>
      ) : null}
      {provider === "imessage-photon" && botUsername && <div className="space-y-2"><Button variant="outline" onClick={() => { void copyTextToClipboard(botUsername).then(() => { setNumberCopied(true); setCopyError(null); }, () => setCopyError(interfaceNotice("interface:couldNotCopyTheNumberSelectItIn_15a31d"))); }}>{numberCopied ? pageText("numberCopied_11116c") : `Copy ${botUsername}`}</Button>{copyError && <p role="alert" className="text-sm text-destructive">{copyError}</p>}</div>}
      {provider === "slack" ? (
        <>
          <ol className="list-decimal space-y-4 pl-5 text-sm">
            <li>{slackAccount?.status === "linked" ? <Button asChild variant="outline"><a href={providerUrl ?? "https://app.slack.com"} target="_blank" rel="noopener noreferrer">{slackAccount.dmChannelId ? pageText("openYourSlackDM_067478") : pageText("openSlack_eec851")}<ExternalLink /></a></Button> : <>{pageText("openAChannelAndInvite_b0c235") + " "}{botMention}{" " + pageText("ifNeeded_317164")}</>}</li>
            <li>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <code>{slackTestMessage}</code>
                <Button size="sm" variant="ghost" onClick={() => {
                  void copyTextToClipboard(slackTestMessage).then(() => { setCommandCopied(true); setCommandCopyError(false); }, () => setCommandCopyError(true));
                }}><Copy className="size-4" />{commandCopied ? pageText("copied_8e3df4") : pageText("copyMessage_26902e")}</Button>
              </div>
              {slackAccount?.status !== "linked" && <p className="mt-2 text-muted-foreground">{pageText("selectTheBotFromSlackSMentionSuggestions_49b464")}</p>}
            </li>
            <li>{pageText("continueTheConversationInTheThread_12b377")}</li>
          </ol>
          {commandCopyError && <p role="alert" className="text-sm text-destructive">{pageText("couldnTCopySelectAndCopyTheCommand_3a1a0a")}</p>}
          <SetupWizardFooter onSaveExit={onSaveExit} disabled={pending}>
            <Button disabled={pending} onClick={onTest}>{pending && <Loader2 className="size-4 animate-spin" />}{pageText("done_e9b450")}</Button>
          </SetupWizardFooter>
        </>
      ) : <>
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        {instructions.map((item) => <li key={item}>{item}</li>)}
      </ol>
      <div className="flex flex-wrap gap-2">
        {providerUrl && (
          <Button asChild variant="outline">
            <a href={providerUrl} target="_blank" rel="noopener noreferrer">{pageText("open_cf9b77") + " "}{providerNames[provider]} <ExternalLink />
            </a>
          </Button>
        )}
        <Button disabled={pending} onClick={onTest}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}{pageText("iVeSentTheTestMessage_ed6d60")}</Button>
      </div>
      </>}
    </div>
  );
}
