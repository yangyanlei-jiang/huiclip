import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FlaskConical, Lock, Play } from "lucide-react";
import type {
  InstanceExperimentalSettings,
  InstanceExperimentalSettingsWithManaged,
  InstanceFeatureKey,
  ManagedSettingMetadata,
  PatchInstanceExperimentalSettings,
} from "@paperclipai/shared";
import { experimentalSettingKey } from "@paperclipai/shared";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { useHiddenSettings } from "@/hooks/useHiddenSettings";
import { getWorktreeInstanceId, isWorktreeRuntime } from "../lib/worktree-branding";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/lib/router";
import { ClassicWorkspaceSetting } from "@/components/ClassicWorkspaceSetting";
import { describeError } from "@/api/errors";

type WorktreeRunExecutionDisplayState =
  | { kind: "off" }
  | { kind: "armed"; activatedAt: string }
  | { kind: "fail_closed"; reason: "missing_cutoff" | "missing_instance_id" | "instance_mismatch" };

/**
 * Mirror of the server's `resolveWorktreeRunExecutionActivation` fail-closed
 * ladder (server/src/services/instance-settings.ts) so the card never claims a
 * copied/legacy row is arming execution. The derived fields are display-only —
 * the PATCH the toggle sends still writes just the boolean.
 */
function resolveWorktreeRunExecutionDisplayState(
  settings:
    | Pick<
        InstanceExperimentalSettings,
        | "enableWorktreeRunExecution"
        | "worktreeRunExecutionActivatedAt"
        | "worktreeRunExecutionActivationInstanceId"
      >
    | undefined,
  currentInstanceId: string | null,
): WorktreeRunExecutionDisplayState {
  if (settings?.enableWorktreeRunExecution !== true) return { kind: "off" };
  if (!settings.worktreeRunExecutionActivatedAt) return { kind: "fail_closed", reason: "missing_cutoff" };
  if (!currentInstanceId) return { kind: "fail_closed", reason: "missing_instance_id" };
  if (settings.worktreeRunExecutionActivationInstanceId !== currentInstanceId) {
    return { kind: "fail_closed", reason: "instance_mismatch" };
  }
  return { kind: "armed", activatedAt: settings.worktreeRunExecutionActivatedAt };
}

function formatActivationTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// PAP-11233: keep Conference Room code intact, but hide the user-facing opt-in for now.
const SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING = false;

function ManagedByCloudBadge() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Lock aria-hidden="true" />{pageText("managedByPaperclipCloud_a36ee0")}</Badge>
  );
}

function ExperimentalToggleCard({
  title,
  description,
  footnote,
  checked,
  onCheckedChange,
  disabled,
  settingKey,
  managed,
  ariaLabel,
}: {
  title: string;
  description: string;
  footnote?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
  /** Flag key backing this card; operator-hidden keys render nothing. */
  settingKey: InstanceFeatureKey;
  managed?: ManagedSettingMetadata;
  ariaLabel: string;
}) {
  const { hidden: hiddenSettings } = useHiddenSettings();
  const isManaged = managed?.managed === true;
  if (hiddenSettings.has(experimentalSettingKey(settingKey))) return null;
  return (
    <Card id={`experimental-${settingKey}`} className="block scroll-mt-4 bg-transparent p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {isManaged ? <ManagedByCloudBadge /> : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          {footnote ? <p className="max-w-2xl text-xs text-muted-foreground">{footnote}</p> : null}
        </div>
        <ToggleSwitch
          checked={checked}
          onCheckedChange={(next) => {
            if (isManaged) return;
            onCheckedChange(next);
          }}
          disabled={disabled || isManaged}
          aria-label={ariaLabel}
        />
      </div>
    </Card>
  );
}

export function InstanceExperimentalSettings() {
  const { t: pageText } = usePageTranslation("interface");
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { hidden: hiddenSettings } = useHiddenSettings();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: interfaceNotice("interface:settings_c7f73b"), href: "/company/settings" },
      { label: interfaceNotice("interface:experimental_b718f8") },
    ]);
  }, [setBreadcrumbs]);

  const experimentalQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });
  const experimentalView = useQueryView(experimentalQuery);

  const toggleMutation = useMutation<
    InstanceExperimentalSettingsWithManaged,
    Error,
    PatchInstanceExperimentalSettings,
    { previousSettings?: InstanceExperimentalSettingsWithManaged }
  >({
    mutationFn: async (patch: PatchInstanceExperimentalSettings) =>
      instanceSettingsApi.updateExperimental(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.instance.experimentalSettings });
      const previousSettings = queryClient.getQueryData<InstanceExperimentalSettingsWithManaged>(
        queryKeys.instance.experimentalSettings,
      );
      if (previousSettings) {
        queryClient.setQueryData<InstanceExperimentalSettingsWithManaged>(
          queryKeys.instance.experimentalSettings,
          { ...previousSettings, ...patch },
        );
      }
      return { previousSettings };
    },
    onSuccess: async (updatedSettings) => {
      setActionError(null);
      queryClient.setQueryData(queryKeys.instance.experimentalSettings, updatedSettings);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adapters.all }),
        queryClient.invalidateQueries({ queryKey: ["built-in-agents"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
        queryClient.invalidateQueries({ queryKey: ["apps"] }),
      ]);
    },
    onError: (error, _patch, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.instance.experimentalSettings, context.previousSettings);
      }
      setActionError(describeError(error).body);
    },
  });

  if (experimentalQuery.isLoading || experimentalView.kind === "reconnecting") {
    return (
      <div className="max-w-6xl space-y-6">
        <ClassicWorkspaceSetting key="personal-workspace" />
        <div className="text-sm text-muted-foreground">{pageText("loadingExperimentalSettings_d0a6cb")}</div>
      </div>
    );
  }

  if (experimentalView.kind === "error") {
    return (
<div className="max-w-6xl space-y-6"><ClassicWorkspaceSetting key="personal-workspace" />      <QueryErrorState
        size="page"
        error={experimentalQuery.error}
        action="load experimental settings"
        onRetry={experimentalView.retry}
        retrying={experimentalView.isFetching}
      />
</div>
    );
  }

  const inWorktree = isWorktreeRuntime();
  // Present only on cloud-managed instances: keys the managed overlay controls
  // render locked with the "Managed by Paperclip Cloud" badge. Self-hosted
  // responses carry no `managedKeys`, so every card stays editable.
  const managedKeys = experimentalQuery.data?.managedKeys ?? {};
  const enableWorktreeRunExecution = experimentalQuery.data?.enableWorktreeRunExecution === true;
  const worktreeRunExecutionManaged = managedKeys.enableWorktreeRunExecution?.managed === true;
  const worktreeRunExecutionState = resolveWorktreeRunExecutionDisplayState(
    experimentalQuery.data,
    getWorktreeInstanceId(),
  );
  const enableEnvironments = experimentalQuery.data?.enableEnvironments === true;
  const enableNativeRunner = experimentalQuery.data?.enableNativeRunner === true;
  const enableChatConnectors = experimentalQuery.data?.enableChatConnectors === true;
  const enableManagedSandboxOnly = experimentalQuery.data?.enableManagedSandboxOnly === true;
  const enableIsolatedWorkspaces = experimentalQuery.data?.enableIsolatedWorkspaces === true;
  const enableIsolatedWorkspacesByDefault =
    experimentalQuery.data?.enableIsolatedWorkspacesByDefault === true;
  // Streamlined left navigation is now the standard sidebar (PAP-12472); the
  // experimental opt-out was retired, so it no longer surfaces a toggle here.
  const enableStreamlinedUi = experimentalQuery.data?.enableStreamlinedUi !== false;
  const enableConferenceRoomChat = experimentalQuery.data?.enableConferenceRoomChat === true;
  const enableClassicTaskInterface = experimentalQuery.data?.enableClassicTaskInterface === true;
  const enableIssuePlanDecompositions =
    experimentalQuery.data?.enableIssuePlanDecompositions === true;
  const enableExperimentalFileViewer =
    experimentalQuery.data?.enableExperimentalFileViewer === true;
  const enableExternalObjects = experimentalQuery.data?.enableExternalObjects === true;
  const enableBuiltInAgents = experimentalQuery.data?.enableBuiltInAgents === true;
  const enableBetaSkills = experimentalQuery.data?.enableBetaSkills === true;
  const enableSummaries = experimentalQuery.data?.enableSummaries === true;
  const enableStatusCards = experimentalQuery.data?.enableStatusCards === true;
  const summariesManaged = managedKeys.enableSummaries?.managed === true;
  const statusCardsManaged = managedKeys.enableStatusCards?.managed === true;
  const statusCardsBlockedByManagedSummaries = summariesManaged && !enableSummaries;
  const summariesRequiredByManagedStatusCards = statusCardsManaged && enableStatusCards;
  const enableDecisions = experimentalQuery.data?.enableDecisions === true;
  const enableGoalsSidebarLink = experimentalQuery.data?.enableGoalsSidebarLink === true;
  const enableCases = experimentalQuery.data?.enableCases === true;
  const enableServerInfoDebugView = experimentalQuery.data?.enableServerInfoDebugView === true;
  const enablePaperclipDeveloperMode =
    experimentalQuery.data?.enablePaperclipDeveloperMode === true;
  const enableSimplifiedEnglishInteractions =
    experimentalQuery.data?.enableSimplifiedEnglishInteractions === true;
  const enableFirstTaskPlanProposal =
    experimentalQuery.data?.enableFirstTaskPlanProposal === true;
  const enableSmokeLab = experimentalQuery.data?.enableSmokeLab === true;
  const autoRestartDevServerWhenIdle = experimentalQuery.data?.autoRestartDevServerWhenIdle === true;
  const isVisible = (key: InstanceFeatureKey) => !hiddenSettings.has(experimentalSettingKey(key));
  const showWorktreeRunExecution = inWorktree && isVisible("enableWorktreeRunExecution");
  const showDeveloperSection = showWorktreeRunExecution || ([
    "autoRestartDevServerWhenIdle",
    "enableManagedSandboxOnly",
    "enablePaperclipDeveloperMode",
    "enableServerInfoDebugView",
    "enableSmokeLab",
    "enableIssuePlanDecompositions",
  ] satisfies InstanceFeatureKey[]).some(isVisible);
  const showLegacySection = isVisible("enableClassicTaskInterface") || isVisible("enableGoalsSidebarLink");
  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{pageText("experimental_b718f8")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{pageText("optIntoFeaturesThatAreStillBeingEvaluated_4ce359")}</p>
      </div>

      <ClassicWorkspaceSetting key="personal-workspace" />

      <div
        role="alert"
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{pageText("experimentalFeaturesMayBreakAtAnyTime_882f3b")}</p>
            <p className="text-muted-foreground">{pageText("theseFeaturesAreOptInAndComeWith_40298b")}</p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <section className="space-y-3" aria-labelledby="experimental-features-heading">
        <div className="space-y-1">
          <h2 id="experimental-features-heading" className="text-sm font-semibold">{pageText("experimentalFeatures_0d95a6")}</h2>
          <p className="text-sm text-muted-foreground">{pageText("optionalProductFeaturesThatAreStillBeingEvaluated_865b17")}</p>
        </div>

        <ExperimentalToggleCard
          title={pageText("assistantConnectionsMCP_b55df0")}
          description={pageText("connectCodexClaudeAndOtherAssistantsToYour_16c946")}
          footnote={<>{pageText("requiresAnAuthenticatedInstanceWithAConfiguredPublic_40e806")}{experimentalQuery.data?.enablePublicMcp && <> <Link className="underline" to="/apps/assistant-connection">{pageText("setUpAnAssistantConnection_931862")}</Link></>}</>}
          checked={experimentalQuery.data?.enablePublicMcp === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enablePublicMcp: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enablePublicMcp"
          managed={managedKeys.enablePublicMcp}
          ariaLabel={interfaceNotice("interface:toggleAssistantConnectionsExperimentalSetting_9ca227")}
        />

        <ExperimentalToggleCard
          title={pageText("betaSkills_0824ba")}
          description={pageText("allowAgentsToPinBetaReleasesOfThe_22aabd")}
          checked={enableBetaSkills}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableBetaSkills: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableBetaSkills"
          managed={managedKeys.enableBetaSkills}
          ariaLabel={interfaceNotice("interface:toggleBetaSkillsExperimentalSetting_d01e47")}
        />

        <ExperimentalToggleCard
          title={pageText("builtInAgents_4a5c12")}
          description={pageText("showPaperclipManagedBuiltInAgentSurfacesIncluding_044785")}
          checked={enableBuiltInAgents}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableBuiltInAgents: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableBuiltInAgents"
          managed={managedKeys.enableBuiltInAgents}
          ariaLabel={interfaceNotice("interface:toggleBuiltInAgentsExperimentalSetting_c74dec")}
        />

        <ExperimentalToggleCard
          title={pageText("cases_eccd8c")}
          description={pageText("durableWorkProductsBlogPostsTweetStormsThat_d5dcb9")}
          footnote="Turning Cases off hides the tab and blocks the case API; existing case data is kept."
          checked={enableCases}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableCases: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableCases"
          managed={managedKeys.enableCases}
          ariaLabel={interfaceNotice("interface:toggleCasesExperimentalSetting_d54213")}
        />

        <ExperimentalToggleCard
          title={pageText("chatConnectors_8d5102")}
          description={pageText("connectAgentsToSlackDiscordMicrosoftTeamsAnd_8e79f9")}
          footnote="Turning this off hides experimental chat setup and connected-task controls. Existing chat connections keep running. AgentMail, GitHub review bots, and tool connectors are controlled separately."
          checked={enableChatConnectors}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableChatConnectors: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableChatConnectors"
          managed={managedKeys.enableChatConnectors}
          ariaLabel={interfaceNotice("interface:toggleChatConnectorsExperimentalSetting_254f18")}
        />

        <ExperimentalToggleCard
          title={pageText("combinedInboxTaskList_1d4c2a")}
          description={pageText("inTheClassicWorkspaceFoldInboxIntoTasks_ae83c2")}
          footnote="Coordinator always includes personal views in Tasks. For Classic, turning this off restores its separate Inbox. No data changes."
          checked={experimentalQuery.data?.enableCombinedInboxTasks ?? false}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableCombinedInboxTasks: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableCombinedInboxTasks"
          managed={managedKeys.enableCombinedInboxTasks}
          ariaLabel={interfaceNotice("interface:toggleCombinedInboxAndTaskListExperimentalSetting_0357cc")}
        />

        {SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING ? (
          <ExperimentalToggleCard
            title={pageText("conferenceRoomChat_061c7b")}
            description={pageText("addsAConferenceRoomOneChatWhereYou_c49a18")}
            checked={enableConferenceRoomChat}
            onCheckedChange={(checked) => toggleMutation.mutate({ enableConferenceRoomChat: checked })}
            disabled={toggleMutation.isPending}
            settingKey="enableConferenceRoomChat"
            managed={managedKeys.enableConferenceRoomChat}
            ariaLabel={interfaceNotice("interface:toggleConferenceRoomChatExperimentalSetting_77f8a3")}
          />
        ) : null}

        <ExperimentalToggleCard
          title={pageText("commandCtrlEnterToSubmit_e740f0")}
          description={pageText("restoreThePreviousKeyboardShortcutForTaskReplies_e9bb62")}
          footnote="Off by default: Enter submits, and Shift+Enter adds a new line."
          checked={experimentalQuery.data?.enableLegacyComposerSubmit === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableLegacyComposerSubmit: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableLegacyComposerSubmit"
          managed={managedKeys.enableLegacyComposerSubmit}
          ariaLabel={interfaceNotice("interface:toggleCommandCtrlEnterToSubmit_068066")}
        />

        <ExperimentalToggleCard
          title={pageText("decisions_af2f32")}
          description={pageText("showTheDecisionsItemInTheMainSidebar_41198f")}
          checked={enableDecisions}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableDecisions: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableDecisions"
          managed={managedKeys.enableDecisions}
          ariaLabel={interfaceNotice("interface:toggleDecisionsExperimentalSetting_f91f76")}
        />

        <ExperimentalToggleCard
          title={pageText("enableEnvironments_edcab8")}
          description={pageText("showEnvironmentManagementInCompanySettingsAndAllow_d6c8e3")}
          checked={enableEnvironments}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableEnvironments: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableEnvironments"
          managed={managedKeys.enableEnvironments}
          ariaLabel={interfaceNotice("interface:toggleEnvironmentsExperimentalSetting_fb690b")}
        />

        <ExperimentalToggleCard
          title={pageText("enableExternalObjects_30bd4d")}
          description={pageText("detectExternalURLsInIssuesAndShowResolved_3b2b6f")}
          checked={enableExternalObjects}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableExternalObjects: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableExternalObjects"
          managed={managedKeys.enableExternalObjects}
          ariaLabel={interfaceNotice("interface:toggleExternalObjectsExperimentalSetting_cad630")}
        />

        <ExperimentalToggleCard
          title={pageText("enableIsolatedWorkspaces_978c67")}
          description={pageText("showExecutionWorkspaceControlsInProjectConfigurationAnd_129549")}
          checked={enableIsolatedWorkspaces}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableIsolatedWorkspaces: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableIsolatedWorkspaces"
          managed={managedKeys.enableIsolatedWorkspaces}
          ariaLabel={interfaceNotice("interface:toggleIsolatedWorkspacesExperimentalSetting_f724a6")}
        />

        <ExperimentalToggleCard
          title={pageText("experimentalFastResponses_d82d8f")}
          description={pageText("allowShortAcknowledgementsWhileAgentsBeginWorkConfigure_924925")}
          checked={experimentalQuery.data?.enableFastResponses ?? false}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableFastResponses: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableFastResponses"
          managed={managedKeys.enableFastResponses}
          ariaLabel={interfaceNotice("interface:toggleFastResponsesExperimentalSetting_7eab03")}
        />

        <ExperimentalToggleCard
          title={pageText("experimentalFileViewer_db9b1c")}
          description={pageText("showTaskDetailControlsForBrowsingAndPreviewing_cf1d51")}
          checked={enableExperimentalFileViewer}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableExperimentalFileViewer: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableExperimentalFileViewer"
          managed={managedKeys.enableExperimentalFileViewer}
          ariaLabel={interfaceNotice("interface:toggleExperimentalFileViewerSetting_23020e")}
        />

        <ExperimentalToggleCard
          title={pageText("firstTaskProposeWithAPlanDocument_527f82")}
          description={pageText("whenTheUserSFirstRequestIsA_c0a247")}
          checked={enableFirstTaskPlanProposal}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ enableFirstTaskPlanProposal: checked })
          }
          disabled={toggleMutation.isPending}
          settingKey="enableFirstTaskPlanProposal"
          managed={managedKeys.enableFirstTaskPlanProposal}
          ariaLabel={interfaceNotice("interface:toggleFirstTaskPlanProposalExperimentalSetting_703d78")}
        />

        <ExperimentalToggleCard
          title={pageText("githubReviewBots_b9d549")}
          description={pageText("connectAgentsToGitHubWithTheirOwnApp_bb6405")}
          footnote="Independent of Chat connectors. Turning this off hides setup and management; existing bots keep running. GitHub tool connections stay available."
          checked={experimentalQuery.data?.enableGitHubReviewBots === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableGitHubReviewBots: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableGitHubReviewBots"
          managed={managedKeys.enableGitHubReviewBots}
          ariaLabel={interfaceNotice("interface:toggleGitHubReviewBotsExperimentalSetting_e88ead")}
        />

        <ExperimentalToggleCard
          title={pageText("googleWorkspaceConnectorPaperclip_af03ef")}
          description={pageText("showTheBuiltInGoogleWorkspaceConnectorFor_57c7ce")}
          footnote="Off by default. While off, Google apps are offered through Composio and Arcade instead, and the built-in connector cannot be set up or run."
          checked={experimentalQuery.data?.enableGoogleWorkspaceConnector === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableGoogleWorkspaceConnector: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableGoogleWorkspaceConnector"
          managed={managedKeys.enableGoogleWorkspaceConnector}
          ariaLabel={interfaceNotice("interface:togglePaperclipGoogleWorkspaceConnectorExperimentalSetting_ddb891")}
        />

        <ExperimentalToggleCard
          title="Grok Bot"
          description={pageText("connectAnExistingGrokBotAsAnAgent_415cbf")}
          footnote="Requires Assistant connections (MCP), Paperclip Runner, and authenticated public HTTPS. Usage is not reported. Turning this off blocks Grok calls and new dispatch."
          checked={experimentalQuery.data?.enableGrokBot === true}
          onCheckedChange={checked => toggleMutation.mutate({ enableGrokBot: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableGrokBot" managed={managedKeys.enableGrokBot}
          ariaLabel={interfaceNotice("interface:toggleGrokBotExperimentalSetting_cd4ba3")}
        />


        <ExperimentalToggleCard
          title={pageText("memoryConnectors_292e22")}
          description={pageText("connectMem0ZepSupermemoryCogneeAndHonchoFor_d35064")}
          footnote="Turning this off hides setup for these connectors. Existing connections keep running."
          checked={experimentalQuery.data?.enableMemoryConnectors === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableMemoryConnectors: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableMemoryConnectors"
          managed={managedKeys.enableMemoryConnectors}
          ariaLabel={interfaceNotice("interface:toggleMemoryConnectorsExperimentalSetting_f90acd")}
        />

        <ExperimentalToggleCard
          title={pageText("musePersonalAgent_9c8bd1")}
          description={pageText("connectYourPersonalMetaMusePairItDetect_f321d0")}
          footnote="Requires Paperclip Runner and an authenticated instance with a public HTTPS URL. Turning this off blocks new work; cleanup and stop evidence remain available. Provider usage and cost are unavailable."
          checked={experimentalQuery.data?.enableMuse === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableMuse: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableMuse"
          managed={managedKeys.enableMuse}
          ariaLabel={interfaceNotice("interface:toggleMuseExperimentalSetting_25119e")}
        />

        <ExperimentalToggleCard
          title="OpenAI Dot"
          description={pageText("addOpenAIDotAsAStandaloneAgentChoice_e0af2f")}
          footnote="Requires Assistant connections (MCP) and an authenticated instance with a public HTTPS URL. Turning this off blocks Dot calls and new work; saved connections are kept."
          checked={experimentalQuery.data?.enableOpenAiDot === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableOpenAiDot: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableOpenAiDot"
          managed={managedKeys.enableOpenAiDot}
          ariaLabel={interfaceNotice("interface:toggleOpenAIDotExperimentalSetting_496848")}
        />


        <ExperimentalToggleCard
          title="Paperclip Runner"
          description={pageText("allowAgentsToSelectPaperclipRunnerIncludingAuthenticated_67afce")}
          checked={enableNativeRunner}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ enableNativeRunner: checked })
          }
          disabled={toggleMutation.isPending}
          settingKey="enableNativeRunner"
          managed={managedKeys.enableNativeRunner}
          ariaLabel={interfaceNotice("interface:togglePaperclipRunnerExperimentalSetting_546d9a")}
        />

        <ExperimentalToggleCard
          title={pageText("simplifiedEnglishInteractions_428008")}
          description={pageText("instructAgentsToWriteUserInteractionsPlanConfirmations_e82a80")}
          checked={enableSimplifiedEnglishInteractions}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ enableSimplifiedEnglishInteractions: checked })
          }
          disabled={toggleMutation.isPending}
          settingKey="enableSimplifiedEnglishInteractions"
          managed={managedKeys.enableSimplifiedEnglishInteractions}
          ariaLabel={interfaceNotice("interface:toggleSimplifiedEnglishInteractionsExperimentalSetting_4cd3b9")}
        />

        <ExperimentalToggleCard
          title={pageText("statusCards_c5a054")}
          description={pageText("enableTheExperimentalSharedStatusCardBoardAnd_8a2607")}
          footnote="Enabling Status Cards also enables Summaries."
          checked={enableStatusCards}
          onCheckedChange={(checked) =>
            toggleMutation.mutate(
              checked
                ? { enableSummaries: true, enableStatusCards: true }
                : { enableStatusCards: false },
            )
          }
          disabled={toggleMutation.isPending || statusCardsBlockedByManagedSummaries}
          settingKey="enableStatusCards"
          managed={managedKeys.enableStatusCards}
          ariaLabel={interfaceNotice("interface:toggleStatusCardsExperimentalSetting_0937b7")}
        />

        <ExperimentalToggleCard
          title={pageText("streamlinedUI_12b987")}
          description={pageText("useTheSimplifiedMainSidebarSharedTasksAnd_33c455")}
          footnote="Turning this off restores the legacy shell and navigation. Task and page data are unchanged."
          checked={enableStreamlinedUi}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableStreamlinedUi: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableStreamlinedUi"
          managed={managedKeys.enableStreamlinedUi}
          ariaLabel={interfaceNotice("interface:toggleStreamlinedUIExperimentalSetting_2149de")}
        />

        <ExperimentalToggleCard
          title={pageText("summaries_e065a8")}
          description={pageText("showSummarizerGeneratedStatusSlotsOnProjectAnd_f27635")}
          footnote="Status Cards requires Summaries. Disabling Summaries also disables Status Cards."
          checked={enableSummaries}
          onCheckedChange={(checked) =>
            toggleMutation.mutate(
              checked || !enableStatusCards
                ? { enableSummaries: checked }
                : { enableSummaries: false, enableStatusCards: false },
            )
          }
          disabled={toggleMutation.isPending || summariesRequiredByManagedStatusCards}
          settingKey="enableSummaries"
          managed={managedKeys.enableSummaries}
          ariaLabel={interfaceNotice("interface:toggleSummariesExperimentalSetting_18fc08")}
        />

        {enableIsolatedWorkspaces && (
          <ExperimentalToggleCard
            title={pageText("useIsolatedWorkspacesByDefault_23d593")}
            description={pageText("treatAProjectThatHasNoExecutionWorkspace_bd446e")}
            checked={enableIsolatedWorkspacesByDefault}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableIsolatedWorkspacesByDefault: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableIsolatedWorkspacesByDefault"
            managed={managedKeys.enableIsolatedWorkspacesByDefault}
            ariaLabel={interfaceNotice("interface:toggleIsolatedWorkspacesByDefaultExperimentalSetting_3e570e")}
          />
        )}
      </section>

      {showDeveloperSection ? (
        <section className="space-y-3" aria-labelledby="developer-mode-heading">
          <div className="space-y-1">
            <h2 id="developer-mode-heading" className="text-sm font-semibold">{pageText("paperclipDeveloperMode_f02911")}</h2>
            <p className="text-sm text-muted-foreground">{pageText("internalToolsForDevelopingTestingAndDebuggingPaperclip_6694e4")}</p>
          </div>

          <ExperimentalToggleCard
            title={pageText("autoRestartDevServerWhenIdle_4c0bc8")}
            description={pageText("inPnpmDevOnceWaitForAllQueued_718d7c")}
            checked={autoRestartDevServerWhenIdle}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ autoRestartDevServerWhenIdle: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="autoRestartDevServerWhenIdle"
            managed={managedKeys.autoRestartDevServerWhenIdle}
            ariaLabel={interfaceNotice("interface:toggleGuardedDevServerAutoRestart_d2999c")}
          />

          <ExperimentalToggleCard
            title={pageText("managedEnvironmentOnly_565e97")}
            description={pageText("hideTheLocalEnvironmentAndRunAllAgents_3dd9f9")}
            checked={enableManagedSandboxOnly}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableManagedSandboxOnly: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableManagedSandboxOnly"
            managed={managedKeys.enableManagedSandboxOnly}
            ariaLabel={interfaceNotice("interface:toggleManagedEnvironmentOnlyExperimentalSetting_6d6692")}
          />

          <ExperimentalToggleCard
            title={pageText("paperclipDeveloperMode_f02911")}
            description={pageText("showInternalPaperclipMaintainerToolsAndObservabilityLinks_0be479")}
            checked={enablePaperclipDeveloperMode}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enablePaperclipDeveloperMode: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enablePaperclipDeveloperMode"
            managed={managedKeys.enablePaperclipDeveloperMode}
            ariaLabel={interfaceNotice("interface:togglePaperclipDeveloperModeExperimentalSetting_86aea3")}
          />

          {showWorktreeRunExecution ? (
            <Card className="block bg-transparent p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{pageText("runTasksInThisWorktree_be8b3b")}</h3>
                      {worktreeRunExecutionManaged ? <ManagedByCloudBadge /> : null}
                    </div>
                    <p className="max-w-2xl text-sm text-muted-foreground">{pageText("thisIsAnIsolatedGitWorktreePreviewInstance_d9db94")}</p>
                  </div>
                  <ToggleSwitch
                    checked={enableWorktreeRunExecution}
                    onCheckedChange={(checked) => {
                      if (worktreeRunExecutionManaged) return;
                      toggleMutation.mutate({ enableWorktreeRunExecution: checked });
                    }}
                    disabled={toggleMutation.isPending || worktreeRunExecutionManaged}
                    aria-label={pageText("toggleWorktreeRunExecutionSetting_bbb468")}
                  />
                </div>

                {worktreeRunExecutionState.kind === "armed" ? (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-foreground">
                    <Play className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{pageText("runningTasksCreatedAfter_6cd490")}{" "}
                      <span className="font-medium">
                        {formatActivationTimestamp(worktreeRunExecutionState.activatedAt)}
                      </span>
                      .
                    </span>
                  </div>
                ) : null}

                {worktreeRunExecutionState.kind === "fail_closed" ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{pageText("executionIsSuppressedEffectivelyOff_f5cafa")}</p>
                      <p className="text-muted-foreground">
                        {worktreeRunExecutionState.reason === "instance_mismatch"
                          ? pageText("thisSettingWasArmedInADifferentInstance_354b17")
                          : pageText("thisSettingIsMissingItsActivationCutoffSo_cc0198")}{" "}{pageText("toggleItOffAndBackOnToArm_f787ec")}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          <ExperimentalToggleCard
            title={pageText("serverInfoDebugView_d7c3fb")}
            description={pageText("showAServerSectionInTheAccountDrawer_f3f8e0")}
            checked={enableServerInfoDebugView}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableServerInfoDebugView: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableServerInfoDebugView"
            managed={managedKeys.enableServerInfoDebugView}
            ariaLabel={interfaceNotice("interface:toggleServerInfoDebugViewExperimentalSetting_b8cca5")}
          />

          <ExperimentalToggleCard
            title={pageText("smokeLab_0f614d")}
            description={pageText("addASmokeLabTabUnderAppsDeveloper_5faee6")}
            checked={enableSmokeLab}
            onCheckedChange={(checked) => toggleMutation.mutate({ enableSmokeLab: checked })}
            disabled={toggleMutation.isPending}
            settingKey="enableSmokeLab"
            managed={managedKeys.enableSmokeLab}
            ariaLabel={interfaceNotice("interface:toggleSmokeLabExperimentalSetting_9cfbf3")}
          />

          <ExperimentalToggleCard
            title={pageText("taskPlanDecomposition_b2239c")}
            description={pageText("showAcceptedPlanDecompositionHistoryOnTaskDetail_fc2b78")}
            checked={enableIssuePlanDecompositions}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableIssuePlanDecompositions: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableIssuePlanDecompositions"
            managed={managedKeys.enableIssuePlanDecompositions}
            ariaLabel={interfaceNotice("interface:toggleTaskPlanDecompositionPanelExperimentalSetting_cce5b4")}
          />
        </section>
      ) : null}

      {showLegacySection ? (
        <section className="space-y-3" aria-labelledby="legacy-heading">
          <div className="space-y-1">
            <h2 id="legacy-heading" className="text-sm font-semibold">{pageText("legacy_fb74bc")}</h2>
            <p className="text-sm text-muted-foreground">{pageText("theseFeaturesAreGoingToBeRemoved_abf1da")}</p>
          </div>

          <ExperimentalToggleCard
            title={pageText("classicTaskInterface_8c9d4b")}
            description={pageText("restoresThePreviousTaskDetailPageThePage_51b5c0")}
            footnote="Switching takes effect immediately. No task data is affected."
            checked={enableClassicTaskInterface}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableClassicTaskInterface: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableClassicTaskInterface"
            managed={managedKeys.enableClassicTaskInterface}
            ariaLabel={interfaceNotice("interface:toggleClassicTaskInterfaceExperimentalSetting_022ead")}
          />

          <ExperimentalToggleCard
            title={pageText("goalsSidebarLink_6332b3")}
            description={pageText("restoreTheGoalsItemInTheMainSidebar_20e5e7")}
            checked={enableGoalsSidebarLink}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableGoalsSidebarLink: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableGoalsSidebarLink"
            managed={managedKeys.enableGoalsSidebarLink}
            ariaLabel={interfaceNotice("interface:toggleGoalsSidebarLinkExperimentalSetting_dd3351")}
          />
        </section>
      ) : null}
    </div>
  );
}
