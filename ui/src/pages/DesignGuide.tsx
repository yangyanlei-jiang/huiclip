import { controlText } from "@/i18n/controls";
import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { SpekoPhoneLineForm } from "@/components/voice/SpekoPhoneLine";
import { SpekoIncomingCallCard } from "@/components/voice/SpekoIncomingCalls";
import { SpekoCallHistoryView, SpekoCallActivityItem, SpekoUnapprovedCallActivityItem } from "@/components/voice/SpekoCallHistory";
import { SpekoPhoneCallbackForm } from "@/components/voice/SpekoPhoneCallback";
import { SpekoProviderSetup } from "@/components/voice/SpekoProviderSetup";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { VoiceTranscript } from "@/components/voice/VoiceTranscript";
import { AnimatedDialogContent } from "@/components/AnimatedDialogContent";
import { MuseConnectionDetails } from "@/components/MuseRunnerConnection";
import { ExternalAgentPresetPicker, DotConnectionChecks, MuseConnectionChecks } from "@/components/new-agent/ExternalAgentInviteContent";
import { AgentMailApiKeyField } from "@/features/connections/AgentMailApiKeyField";
import { TaskBrowserFooter } from "@/components/task-side-panel/TaskBrowserFooter";
import { TaskBrowserActivity } from "@/components/task-side-panel/TaskBrowserActivity";
import type { TaskBrowser } from "@paperclipai/shared";
import { DispositionRecoveryNotice } from "../components/DispositionRecoveryNotice";
import { CloudSignIn } from "../components/CloudSignIn";
import { CloudAccessError } from "../components/CloudAccessGate";
import { SetupPrompt } from "./apps/chat/SetupPrompt";
import { MediaArtifactCard } from "@/components/artifacts/MediaArtifactCard";

import { SkillSourceTree } from "./skills/SkillSourceTree";
import { SkillBinaryFile } from "../components/SkillBinaryFile";
import { WebhookUrlWarning } from "@/components/routine-triggers/WebhookUrlWarning";
import { SetupWizardNavigation, SetupWizardFooter } from "../components/SetupWizard";
import { RemoteMcpDesignExample } from "@/features/connections/remote-mcp/RemoteMcpDesignExample";
import { AgentConversationSidebar } from "@/components/AgentConversationSidebar";
import { AgentChatPicker } from "@/components/AgentChatPicker";
import { TaskChatProjectCreatedCard } from "@/components/task-chat/TaskChatProjectCreatedCard";
import { TextAttachmentPreview } from "@/components/task-side-panel/TaskAttachmentPanel";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { announcementPreview, announcementAnimationPreview, announcementAnimationPreviewSrc } from "@/lib/announcement-preview";
import { TaskDetailTasksPanel } from "@/components/task-detail/TaskDetailTasksPanel";
import { AiConnectionDesignExamples } from "@/components/ai-connections/AiConnectionDesignExamples";
import { SavedProviderKeySelect } from "../components/onboarding/SavedProviderKeySelect";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentCharacter } from "@/components/AgentCharacter";
import { AGENT_PALETTE_IDS, appearanceForPalette } from "@paperclipai/shared";
import { RepositoryEditor } from "@/components/RepositoryEditor";
import { TaskChatRunnerActivityGroup } from "@/components/task-chat/TaskChatRunnerActivityGroup";
import { TaskChatMarker } from "@/components/task-chat/TaskChatMarker";
import { TaskChatComposer } from "@/components/task-chat/TaskChatComposer";
import { ComposerAddMenu, ComposerModeChip } from "@/components/task-chat/ComposerAddMenu";
import type { IssueWorkMode } from "@paperclipai/shared";
import { TaskTreeControlDialog, TaskTreeControlMenuItems } from "@/components/TaskTreeControls";
import { useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  Command as CommandIcon,
  DollarSign,
  Hexagon,
  History,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Mail,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { InlineBanner } from "@/components/InlineBanner";
import { BuiltInLifecycleChip } from "@/components/BuiltInAgentBadges";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable-panels";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { AgentCapsule, AGENT_GRADIENT_COUNT } from "@/components/AgentCapsule";
import { AgentRunCard } from "@/components/ActiveAgentsPanel";
import { StatusBadge, IssueStatusBadge } from "@/components/StatusBadge";
import { StatusIcon } from "@/components/StatusIcon";
import { EnforcementBanner } from "@/components/EnforcementBanner";
import { ActionCard, ActionCardMobile, BindingsTable } from "@/components/actions/ActionCard";
import { PriorityIcon } from "@/components/PriorityIcon";
import { SHOW_TASK_PRIORITY_UI } from "@/lib/ui-flags";
import { agentStatusDot, agentStatusDotDefault } from "@/lib/status-colors";
import { EntityRow } from "@/components/EntityRow";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { FilterBar, type FilterValue } from "@/components/FilterBar";
import { InlineEditor } from "@/components/InlineEditor";
import { PageSkeleton } from "@/components/PageSkeleton";
import { TaskChatLoadingShell } from "@/components/task-chat/TaskChatLoadingShell";
import { Identity } from "@/components/Identity";
import { AppLogo } from "@/pages/apps/AppLogo";
import { IssueReferencePill } from "@/components/IssueReferencePill";
import { LockedIssueChip } from "@/components/LockedIssueChip";
import { MembershipAction } from "@/components/MembershipAction";
import { IssueOutputSection } from "@/components/issue-output/IssueOutputSection";
import { EnvironmentVariablesEditor } from "@/components/environment-variables-editor";
import { IssueThreadInteractionCard } from "@/components/IssueThreadInteractionCard";
import {
  connectedConnectionIntentInteraction,
  issueThreadInteractionFixtureMeta,
  pendingConnectionIntentInteraction,
  retryConnectionIntentInteraction,
} from "@/fixtures/issueThreadInteractionFixtures";
import type { CompanySecret, EnvBinding, Issue } from "@paperclipai/shared";
import { CollectionToolbar } from "@/components/CollectionToolbar";
import { IssueRow } from "@/components/IssueRow";
import {
  EnvInputsList,
  ExternalSourcesList,
  RequiredSkillsList,
  StepSkillPlan,
  StepSourcePolicy,
  TeamCard,
  TeamHierarchyPreview,
  TeamRow,
} from "@/pages/TeamCatalog";
import {
  currentInstalledState,
  onboardingTeams,
  optionalTeam,
  outOfDateInstalledState,
  sampleSkillPreparations,
  sampleTeam,
  warnTeam,
} from "@/pages/TeamCatalog.fixtures";
import type { IssueWorkProduct } from "@paperclipai/shared";

/* ------------------------------------------------------------------ */
/*  Sample data for the Issue Output surface showcase                  */
/* ------------------------------------------------------------------ */

function sampleOutput(
  id: string,
  attachmentId: string,
  contentType: string,
  filename: string,
  opts: { byteSize: number; isPrimary?: boolean; createdAt: string },
): IssueWorkProduct {
  const contentPath = `/api/attachments/${attachmentId}/content`;
  return {
    id,
    companyId: "demo-company",
    projectId: null,
    issueId: "demo-issue",
    executionWorkspaceId: null,
    runtimeServiceId: null,
    type: "artifact",
    provider: "paperclip",
    externalId: null,
    title: filename,
    url: null,
    status: "active",
    reviewState: "none",
    isPrimary: Boolean(opts.isPrimary),
    healthStatus: "unknown",
    summary: null,
    createdByRunId: null,
    createdAt: new Date(opts.createdAt),
    updatedAt: new Date(opts.createdAt),
    metadata: {
      attachmentId,
      contentType,
      byteSize: opts.byteSize,
      contentPath,
      openPath: contentPath,
      downloadPath: `${contentPath}?download=1`,
      originalFilename: filename,
    },
  } as IssueWorkProduct;
}

const DESIGN_GUIDE_OUTPUTS: IssueWorkProduct[] = [
  sampleOutput("wp-vid", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "video/mp4", "q3-summary.mp4", {
    byteSize: 19_293_798,
    isPrimary: true,
    createdAt: "2026-05-30T12:00:00Z",
  }),
  sampleOutput("wp-pdf", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "application/pdf", "talking-points.pdf", {
    byteSize: 421_888,
    createdAt: "2026-05-30T11:52:00Z",
  }),
];

const DESIGN_GUIDE_DEGRADED_OUTPUTS: IssueWorkProduct[] = [
  {
    ...sampleOutput("wp-broken", "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "video/mp4", "corrupt-output.mp4", {
      byteSize: 0,
      isPrimary: true,
      createdAt: "2026-05-30T12:01:00Z",
    }),
    // Strip the path metadata so it fails the shared artifact schema.
    metadata: { attachmentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", contentType: "video/mp4" },
  } as IssueWorkProduct,
];

const DESIGN_GUIDE_TASK = {
  id: "design-guide-task",
  identifier: "PAP-427",
  title: "Reconcile the navigation model across operator surfaces",
  status: "in_progress",
  priority: "medium",
  blockerAttention: false,
} as unknown as Issue;

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <Separator />
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

// Onboarding seam (design §6 + §12.5): the TeamCard tile in its "Pick a starter
// team" 3-col grid, with the first defaultInstall tile selected.
function TeamCardShowcase() {
  const [selectedId, setSelectedId] = useState(onboardingTeams[0]?.id ?? null);
  return (
    <div className="grid max-w-2xl gap-4 md:grid-cols-2 lg:grid-cols-3">
      {onboardingTeams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          selected={team.id === selectedId}
          onSelect={() => setSelectedId(team.id)}
        />
      ))}
    </div>
  );
}

// Reusable environment-variables editor: one shared grid, in-field source
// switch, fuzzy secret picker, sensitive-value detection, inline health.
const DESIGN_GUIDE_SECRETS: CompanySecret[] = [
  {
    id: "dg-github",
    companyId: "dg",
    scope: "company",
    ownerUserId: null,
    userSecretDefinitionId: null,
    key: "github_token",
    name: "GITHUB_TOKEN",
    provider: "local_encrypted",
    status: "active",
    managedMode: "paperclip_managed",
    externalRef: null,
    providerConfigId: null,
    providerMetadata: null,
    latestVersion: 3,
    description: null,
    lastResolvedAt: null,
    lastRotatedAt: null,
    deletedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  },
  {
    id: "dg-db",
    companyId: "dg",
    scope: "company",
    ownerUserId: null,
    userSecretDefinitionId: null,
    key: "db_connection",
    name: "DB_CONNECTION",
    provider: "local_encrypted",
    status: "active",
    managedMode: "paperclip_managed",
    externalRef: null,
    providerConfigId: null,
    providerMetadata: null,
    latestVersion: 3,
    description: null,
    lastResolvedAt: null,
    lastRotatedAt: null,
    deletedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  },
];

function EnvironmentVariablesEditorShowcase() {
  const [env, setEnv] = useState<Record<string, EnvBinding>>({
    NODE_ENV: { type: "plain", value: "production" },
    GH_TOKEN: { type: "secret_ref", secretId: "dg-github", version: "latest" },
    DB_URL: { type: "secret_ref", secretId: "dg-db", version: 3 },
    STRIPE_API_KEY: { type: "plain", value: "demo-value-not-a-credential" },
  });
  return (
    <div className="max-w-(--sz-640px) rounded-md border border-border p-4">
      <EnvironmentVariablesEditor
        value={env}
        secrets={DESIGN_GUIDE_SECRETS}
        onChange={(next) => setEnv(next ?? {})}
        onCreateSecret={async (name) => ({
          ...DESIGN_GUIDE_SECRETS[0]!,
          id: `dg-${name}`,
          key: name,
          name: name.toUpperCase(),
          latestVersion: 1,
        })}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Color swatch                                                       */
/* ------------------------------------------------------------------ */

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-md border border-border shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <p className="text-xs font-mono">{cssVar}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function TaskExecutionControlsExample() {
  const { t: pageText } = usePageTranslation("interface");
  const [running, setRunning] = useState(true);
  const [dialogMode, setDialogMode] = useState<"resume" | "cancel" | "restore" | null>(null);
  const [wake, setWake] = useState(true);
  return <div className="max-w-xl space-y-4">
    <div className="w-52 rounded-md border border-border p-1">
      <TaskTreeControlMenuItems scope="subtree" canPause={running} canResume={!running} canCancel canRestore={!running}
        onPause={() => setRunning(false)} onResume={() => setDialogMode("resume")}
        onCancel={() => setDialogMode("cancel")} onRestore={() => setDialogMode("restore")} />
    </div>
    <p className="text-sm text-muted-foreground">{running ? pageText("runningTypeToSwitchStopToSend_43a0a0") : pageText("pausedResumeFromTheMenu_83f191")}</p>
    <TaskChatProjectCreatedCard item={{ id: "design-project", kind: "project_created", projectId: "example-project", name: "Onboarding improvements", description: "Help new teams reach their first useful result.", timestamp: "2026-09-11T00:00:00Z", repositories: [{ id: "1", name: "paperclipai/paperclip", url: "https://github.com/paperclipai/paperclip" }] }} />
    {!running ? <TaskChatMarker item={{ id: "design-cancelled", kind: "marker", variant: "interrupted", tone: "neutral", label: "Run cancelled", detail: "The run was cancelled before returning an answer.", collapsible: true }} /> : null}
    <TaskChatComposer pause={!running ? { scope: "subtree", onResume: () => setDialogMode("resume") } : null} onAdd={async () => {}} workMode="standard" stopScope="subtree" onStop={running ? async () => setRunning(false) : undefined} />
    <TaskTreeControlDialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) setDialogMode(null); }}
      mode={dialogMode ?? "cancel"} scope="subtree" affectedCount={3} affectedAgentCount={2} loading={false} pending={false} valid
      wakeAgents={wake} onWakeAgentsChange={setWake} onRetry={() => {}}
      onApply={() => { setRunning(dialogMode !== "cancel" && wake); setDialogMode(null); }} />
  </div>;
}

function TaskPendingInputExample() {
  const { t: pageText } = usePageTranslation("interface");
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(true);
  return <div className="max-w-xl">
    <TaskChatComposer
      onAdd={async () => {}}
      workMode="standard"
      takeover={pending && open ? {
        id: "design-question",
        label: "Question",
        pendingCount: 1,
        content: <div className="space-y-3 text-sm">
          <p>{pageText("shouldTheAgentUseTheExistingDraft_04da32")}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setPending(false)}>{pageText("useDraft_a98d81")}</Button>
            <Button size="sm" variant="outline" onClick={() => setPending(false)}>{pageText("startFresh_e321d4")}</Button>
          </div>
        </div>,
        onDismiss: () => setOpen(false),
        onSkip: () => setPending(false),
      } : null}
      pendingTakeover={pending ? { count: 1, label: "Question", onOpen: () => setOpen(true) } : null}
    />
  </div>;
}

function AgentChatPickerExample() {
  const { t: pageText } = usePageTranslation("interface");
  const [state, setState] = useState<"closed" | "empty" | "loading" | "error">("closed");
  return <div className="flex flex-wrap gap-2">
    <Button variant="outline" onClick={() => setState("empty")}>{pageText("emptyPicker_c7a87c")}</Button>
    <Button variant="outline" onClick={() => setState("loading")}>{pageText("loadingPicker_3095b7")}</Button>
    <Button variant="outline" onClick={() => setState("error")}>{pageText("failedPicker_fb76fd")}</Button>
    <AgentChatPicker agents={[]} open={state !== "closed"} onOpenChange={(open) => { if (!open) setState("closed"); }} onSelect={() => {}}
      loading={state === "loading"} error={state === "error" ? new Error("Unavailable") : null} onRetry={() => setState("empty")} />
  </div>;
}

function ComposerActionsExample() {
  const { t: pageText } = usePageTranslation("interface");
  const [mode, setMode] = useState<IssueWorkMode>("standard");
  return <div className="flex max-w-xl items-center gap-2 rounded-xl border border-border bg-card p-3">
    <ComposerAddMenu mode={mode} onModeChange={setMode} onAttachFile={() => {}} onGoal={() => {}} />
    <ComposerModeChip mode={mode} onRemove={() => setMode("standard")} />
    <span className="ml-auto text-xs text-muted-foreground">{pageText("plusMenuRemovableModeChip_762e95")}</span>
  </div>;
}

export function DesignGuide() {
  const { t: pageText } = usePageTranslation("interface");
  const preview = {
    ...announcementPreview,
    eyebrow: pageText("demoAnnouncementEyebrow"),
    title: pageText("demoAnnouncementTitle"),
    description: pageText("demoAnnouncementDescription"),
    image: announcementPreview.image && { ...announcementPreview.image, alt: pageText("demoAnnouncementHero") },
    secondaryLink: announcementPreview.secondaryLink && { ...announcementPreview.secondaryLink, label: pageText("demoAnnouncementLearn") },
    primaryAction: announcementPreview.primaryAction && { ...announcementPreview.primaryAction, label: pageText("demoAnnouncementProjects") },
  };
  const [agentmailDemoKey, setAgentmailDemoKey] = useState("");
  const [wizardStep, setWizardStep] = useState(0);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [selectValue, setSelectValue] = useState("in_progress");
  const [menuChecked, setMenuChecked] = useState(true);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [inlineText, setInlineText] = useState("Click to edit this text");
  const [inlineTitle, setInlineTitle] = useState("Editable Title");
  const [inlineDesc, setInlineDesc] = useState(
    "This is an editable description. Click to edit it — the textarea auto-sizes to fit the content without layout shift."
  );
  const [filters, setFilters] = useState<FilterValue[]>([
    { key: "status", label: controlText("Status"), value: controlText("Active") },
    // PAP-411: priority filter demo row suppressed while SHOW_TASK_PRIORITY_UI is off.
    ...(SHOW_TASK_PRIORITY_UI
      ? [{ key: "priority", label: "Priority", value: "High" } as FilterValue]
      : []),
  ]);
  const [allowExternal, setAllowExternal] = useState(false);
  const [allowUnpinned, setAllowUnpinned] = useState(false);
  const [allowLocalPath, setAllowLocalPath] = useState(false);

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold">{pageText("designGuide_cb3ab8")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{pageText("everyComponentStyleAndPatternUsedAcrossPaperclip_c91451")}</p>
      </div>

      {/* ============================================================ */}
      {/*  COVERAGE                                                     */}
      {/* ============================================================ */}
      <Section title={pageText("componentCoverage_87527f")}>
        <p className="text-sm text-muted-foreground">{pageText("thisPageShouldBeUpdatedWhenNewUI_9ebbb9")}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={pageText("uiPrimitives_88cf68")}>
            <div className="flex flex-wrap gap-2">
              {[
                "avatar", "badge", "breadcrumb", "button", "card", "checkbox", "collapsible",
                "command", "dialog", "dropdown-menu", "input", "label", "popover", "resizable-panels",
                "scroll-area", "select", "separator", "sheet", "skeleton", "tabs", "textarea", "tooltip",
              ].map((name) => (
                <Badge key={name} variant="outline" className="font-mono text-(length:--text-nano)">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
          <SubSection title={pageText("appComponents_ddd90c")}>
            <div className="flex flex-wrap gap-2">
              {[
                "StatusBadge", "StatusIcon", "PriorityIcon", "EntityRow", "EmptyState", "MetricCard",
                "FilterBar", "InlineEditor", "PageSkeleton", "Identity", "CommentThread", "MarkdownEditor",
                "PropertiesPanel", "Sidebar", "CommandPalette", "EnvironmentVariablesEditor",
                "InlineBanner", "BuiltInAgentGate", "BuiltInLifecycleChip", "CollectionToolbar",
                "IssueRow", "ContextualSidebarFrame",
              ].map((name) => (
                <Badge key={name} variant="ghost" className="font-mono text-(length:--text-nano)">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
        </div>
      </Section>

      <Section title={pageText("announcements_06b01c")}>
        <div className="grid gap-4 md:grid-cols-2">
          <AnnouncementCard announcement={{ ...announcementAnimationPreview, ...preview, animation: announcementAnimationPreview.animation && { ...announcementAnimationPreview.animation, alt: pageText("demoAnnouncementAnimation") } }} imageSrc="/announcement-preview.svg" animationSrc={announcementAnimationPreviewSrc} onDismiss={() => {}} />
          <AnnouncementCard announcement={preview} imageSrc="/announcement-preview.svg" onDismiss={() => {}} />
          <AnnouncementCard announcement={{ ...preview, image: undefined, secondaryLink: undefined }} onDismiss={() => {}} />
        </div>
      </Section>

      <Section title={pageText("taskExecutionControls_4e0919")}>
        <TaskExecutionControlsExample />
      </Section>

      <Section title={pageText("composerActions_4432df")}>
        <ComposerActionsExample />
      </Section>

      <Section title={pageText("taskCollection_458dad")}>
        <p className="max-w-prose text-sm text-muted-foreground">{pageText("collectiontoolbarOwnsSharedGeometryWhileEachPageOwns_20b149")}</p>
        <CollectionToolbar
          context={<span className="text-sm font-medium">{pageText("recentTasks_21bcad")}</span>}
          search={<Input aria-label={pageText("searchTaskCollectionExample_2dbf22")} placeholder={pageText("searchTasks_927df1")} />}
          controls={<Button variant="outline" size="sm">{pageText("filter_d7decf")}</Button>}
          actions={<Button size="sm">{pageText("newTask_17b2b8")}</Button>}
          feedback={<span className="text-xs text-muted-foreground">{pageText("1TaskUpdatedNewestFirst_05294e")}</span>}
        />
        <div className="overflow-hidden rounded-lg border border-border">
          <IssueRow
            issue={DESIGN_GUIDE_TASK}
            presentation="task"
            unreadState="visible"
            metadata={<span className="text-xs text-muted-foreground">{pageText("updated12mAgo_b85323")}</span>}
            actions={<Button variant="ghost" size="xs">{pageText("more_4bab2d")}</Button>}
          />
        </div>
      </Section>

      <Section title={pageText("themeToggle_0dbc86")}>
        <SubSection title={pageText("variants_1bc3d3")}>
          <div className="flex max-w-sm flex-col items-start gap-3">
            <ThemeToggle />
            <ThemeToggle variant="menu-action" />
            <ThemeToggle variant="compact-menu-action" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  COLORS                                                       */}
      {/* ============================================================ */}
      <Section title={pageText("colors_88d5e4")}>
        <SubSection title={pageText("core_68836c")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name="Background" cssVar="--background" />
            <Swatch name="Foreground" cssVar="--foreground" />
            <Swatch name="Card" cssVar="--card" />
            <Swatch name="Primary" cssVar="--primary" />
            <Swatch name="Primary foreground" cssVar="--primary-foreground" />
            <Swatch name="Secondary" cssVar="--secondary" />
            <Swatch name="Muted" cssVar="--muted" />
            <Swatch name="Muted foreground" cssVar="--muted-foreground" />
            <Swatch name="Accent" cssVar="--accent" />
            <Swatch name="Destructive" cssVar="--destructive" />
            <Swatch name="Border" cssVar="--border" />
            <Swatch name="Ring" cssVar="--ring" />
          </div>
        </SubSection>

        <SubSection title={pageText("sidebar_f5171c")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name="Sidebar" cssVar="--sidebar" />
            <Swatch name="Sidebar border" cssVar="--sidebar-border" />
          </div>
        </SubSection>

        <SubSection title={pageText("chart_66c773")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name="Chart 1" cssVar="--chart-1" />
            <Swatch name="Chart 2" cssVar="--chart-2" />
            <Swatch name="Chart 3" cssVar="--chart-3" />
            <Swatch name="Chart 4" cssVar="--chart-4" />
            <Swatch name="Chart 5" cssVar="--chart-5" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TYPOGRAPHY                                                   */}
      {/* ============================================================ */}
      <Section title={pageText("runnerActivity_a4496d")}>
        <TaskChatRunnerActivityGroup item={{ id: "design-runner-activity", kind: "activity_phase", active: true, summary: "", interstitial: { id: "design-runner-commentary", kind: "message", author: "agent", text: "I’ll inspect the activity feed and check the layout.", interstitial: true }, items: [
          { id: "design-runner-read", kind: "tool", name: "read", target: "TaskChatRunnerTurn.tsx", status: "completed", detail: "Found the activity groups." },
          { id: "design-runner-check", kind: "tool", name: "exec_command", target: "pnpm check:token-gates", status: "in_progress" },
        ] }} />
        <TaskChatRunnerActivityGroup item={{ id: "design-runner-completed", kind: "activity_phase", active: false, summary: "", items: [
          { id: "design-completed-read", kind: "tool", name: "read", target: "TaskChatRunnerTurn.tsx", status: "completed", detail: "Read the activity groups." },
          { id: "design-completed-check", kind: "tool", name: "exec_command", target: "pnpm check:token-gates", status: "failed", detail: "A token check needs another pass." },
        ] }} />
      </Section>

      <Section title={pageText("typography_f4beb9")}>
        <div className="space-y-3">
          <h2 className="text-xl font-bold">{pageText("pageTitleTextXlFontBold_d661f1")}</h2>
          <h2 className="text-lg font-semibold">{pageText("sectionTitleTextLgFontSemibold_a06b26")}</h2>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{pageText("sectionHeadingTextSmFontSemiboldUppercaseTracking_3cbb18")}</h3>
          <p className="text-sm font-medium">{pageText("cardTitleTextSmFontMedium_974411")}</p>
          <p className="text-sm font-semibold">{pageText("cardTitleAltTextSmFontSemibold_f0b066")}</p>
          <p className="text-sm">{pageText("bodyTextTextSm_bb6828")}</p>
          <p className="text-sm text-muted-foreground">{pageText("mutedDescriptionTextSmTextMutedForeground_9c5567")}</p>
          <p className="text-xs text-muted-foreground">{pageText("tinyLabelTextXsTextMutedForeground_8f51c0")}</p>
          <p className="text-sm font-mono text-muted-foreground">{pageText("monoIdentifierTextSmFontMonoTextMuted_bd3bf5")}</p>
          <p className="text-2xl font-bold">{pageText("largeStatText2xlFontBold_86e0d1")}</p>
          <p className="font-mono text-xs">{pageText("logCodeTextFontMonoTextXs_936ef6")}</p>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SPACING & RADIUS                                             */}
      {/* ============================================================ */}
      <Section title={pageText("radius_e5aaea")}>
        <div className="flex items-end gap-4 flex-wrap">
          {[
            ["sm", "var(--radius-sm)"],
            ["md", "var(--radius-md)"],
            ["lg", "var(--radius-lg)"],
            ["xl", "var(--radius-xl)"],
            ["full", "9999px"],
          ].map(([label, radius]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="h-12 w-12 bg-primary"
                style={{ borderRadius: radius }}
              />
              <span className="text-xs text-muted-foreground">{controlText(label)}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BUTTONS                                                      */}
      {/* ============================================================ */}
      <Section title={pageText("buttons_503d46")}>
        <SubSection title={pageText("variants_1bc3d3")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="default">{pageText("default_808d7d")}</Button>
            <Button variant="secondary">{pageText("secondary_025de5")}</Button>
            <Button variant="outline">{pageText("outline_cdd629")}</Button>
            <Button variant="ghost">{pageText("ghost_bf44c9")}</Button>
            <Button variant="destructive">{pageText("destructive_f58c83")}</Button>
            <Button variant="link">{pageText("link_d05170")}</Button>
          </div>
        </SubSection>

        <SubSection title={pageText("sizes_96de48")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="xs">{pageText("extraSmall_4e149d")}</Button>
            <Button size="sm">{pageText("small_c74fd9")}</Button>
            <Button size="default">{pageText("default_808d7d")}</Button>
            <Button size="lg">{pageText("large_738fd1")}</Button>
          </div>
        </SubSection>

        <SubSection title={pageText("iconButtons_19e3d4")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon-xs"><Search /></Button>
            <Button variant="ghost" size="icon-sm"><Search /></Button>
            <Button variant="outline" size="icon"><Search /></Button>
            <Button variant="outline" size="icon-lg"><Search /></Button>
          </div>
        </SubSection>

        <SubSection title={pageText("withIcons_b3dc01")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button><Plus />{" " + pageText("newIssue_d1e1f6")}</Button>
            <Button variant="outline"><Upload />{" " + pageText("upload_8bdf05")}</Button>
            <Button variant="destructive"><Trash2 />{" " + pageText("delete_f6fdbe")}</Button>
            <Button size="sm"><Plus />{" " + pageText("add_61cc55")}</Button>
          </div>
        </SubSection>

        <SubSection title={pageText("states_6e6975")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button disabled>{pageText("disabled_f4f447")}</Button>
            <Button variant="outline" disabled>{pageText("disabledOutline_71399b")}</Button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  BADGES                                                       */}
      {/* ============================================================ */}
      <Section title={pageText("badges_2c578d")}>
        <SubSection title={pageText("variants_1bc3d3")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">{pageText("default_808d7d")}</Badge>
            <Badge variant="secondary">{pageText("secondary_025de5")}</Badge>
            <Badge variant="outline">{pageText("outline_cdd629")}</Badge>
            <Badge variant="destructive">{pageText("destructive_f58c83")}</Badge>
            <Badge variant="ghost">{pageText("ghost_bf44c9")}</Badge>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  STATUS BADGES & ICONS                                        */}
      {/* ============================================================ */}
      <Section title={pageText("statusSystem_9ed1f3")}>
        <SubSection title={pageText("statusbadgeAllStatuses_edbef4")}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              "active", "running", "paused", "idle", "archived", "planned",
              "achieved", "completed", "failed", "timed_out", "succeeded", "error",
              "pending_approval", "backlog", "todo", "in_progress", "in_review", "blocked",
              "done", "terminated", "cancelled", "pending", "revision_requested",
              "approved", "rejected",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </SubSection>

        <SubSection title={pageText("issuestatusbadgeBrandChipGlyphPAP75_0086a7")}>
          <div className="flex items-center gap-2 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"].map(
              (s) => (
                <IssueStatusBadge key={s} status={s} />
              )
            )}
          </div>
        </SubSection>

        <SubSection title={pageText("monitoringTask_9bfb2c")}>
          <StatusIcon status="in_progress" displayStatus="monitoring" showLabel />
          <IssueStatusBadge status="in_progress" displayStatus="monitoring" />
        </SubSection>
        <SubSection title={pageText("idleSlackConversation_308613")}>
          <StatusIcon status="in_review" externalConversationState="waiting" showLabel />
          <IssueStatusBadge status="in_review" externalConversationState="waiting" />
        </SubSection>
        <SubSection title={pageText("statusiconInteractive_f9eba8")}>
          <div className="flex items-center gap-3 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "cancelled", "blocked"].map(
              (s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusIcon status={s} />
                  <span className="text-xs text-muted-foreground">{controlText(s.replaceAll("_", " "))}</span>
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon status={status} onChange={setStatus} />
            <span className="text-sm">{pageText("clickTheIconToChangeStatusCurrent_00c9d7") + " "}{controlText(status.replaceAll("_", " "))})</span>
          </div>
        </SubSection>

        {/* PAP-411: PriorityIcon showcase gated behind SHOW_TASK_PRIORITY_UI per board decision. */}
        {SHOW_TASK_PRIORITY_UI && (
        <SubSection title={pageText("priorityiconInteractive_28430e")}>
          <div className="flex items-center gap-3 flex-wrap">
            {["critical", "high", "medium", "low"].map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <PriorityIcon priority={p} />
                <span className="text-xs text-muted-foreground">{controlText(p)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <PriorityIcon priority={priority} onChange={setPriority} />
            <span className="text-sm">{pageText("clickTheIconToChangeCurrent_223e21") + " "}{controlText(priority)})</span>
          </div>
        </SubSection>
        )}

        <SubSection title={pageText("agentStatusDots_aa0952")}>
          <div className="flex items-center gap-4 flex-wrap">
            {(["running", "active", "paused", "error", "archived"] as const).map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`inline-flex h-full w-full rounded-full ${agentStatusDot[label] ?? agentStatusDotDefault}`} />
                </span>
                <span className="text-xs text-muted-foreground">{controlText(label)}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title={pageText("runInvocationBadges_a71720")}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              ["timer", "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"],
              ["assignment", "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"],
              ["on_demand", "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"],
              ["automation", "bg-muted text-muted-foreground"],
            ].map(([label, cls]) => (
              <Badge variant="ghost" key={label} className={`px-1.5 text-(length:--text-nano) ${cls}`}>
                {label}
              </Badge>
            ))}
          </div>
        </SubSection>

        <SubSection title="IssueReferencePill">
          <p className="text-xs text-muted-foreground">{pageText("usedWhereverATaskIsReferencedInMarkdown_2b9955") + " "}<code className="font-mono">status</code>{" " + pageText("toShowTheTargetIssueSStateAt_43e3ad") + " "}<code className="font-mono">variant="property"</code>{" " + pageText("forCompactBadgesWithDirectNavigationPass_0e116d") + " "}<code className="font-mono">onRemove</code>{" " + pageText("forASeparateBlockerRemovalControlWithReserved_15cd3a") + " "}<code className="font-mono">strikethrough</code>{" " + pageText("forRemovedContexts_ac8bf4")}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <IssueReferencePill issue={{ id: "demo-1", identifier: "PAP-123", title: "Identifier only — no status yet" }} />
            <IssueReferencePill issue={{ id: "demo-2", identifier: "PAP-456", title: "With in_progress status", status: "in_progress" }} />
            <IssueReferencePill issue={{ id: "demo-3", identifier: "PAP-789", title: "Done status", status: "done" }} />
            <IssueReferencePill issue={{ id: "demo-4", identifier: "PAP-101", title: "Blocked status", status: "blocked" }} />
            <IssueReferencePill onRemove={() => window.alert(interfaceNotice("interface:blockerRemoved_c23e95"))} issue={{ id: "demo-blocker", identifier: "PAP-303", title: "Hover or focus to remove blocker", status: "in_review" }} />
            <IssueReferencePill strikethrough issue={{ id: "demo-5", identifier: "PAP-202", title: "Removed (strikethrough)", status: "todo" }} />
          </div>
        </SubSection>

        <SubSection title="LockedIssueChip">
          <p className="text-xs text-muted-foreground">{pageText("existenceOnlyReferenceToAPrivateTaskShown_b733f7")}{" "}
            <strong>{pageText("noTitleNeverALink_e0d7ef")}</strong>{pageText("fallsBackToPrivateWhenEvenTheIdentifier_0f8172")}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <LockedIssueChip identifier="PAP-1234" />
            <LockedIssueChip identifier={null} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  AGENT CAPSULE                                                */}
      {/* ============================================================ */}
      <Section title={pageText("agentCapsule_514324")}>
        <p className="text-sm text-muted-foreground max-w-prose">{pageText("theBrandCapsuleIsTheAgentMotifA_3a97ca")}<code className="font-mono">--agent-Na</code> →{" "}
          <code className="font-mono">--agent-Nb</code>); <code className="font-mono">prefers-reduced-motion</code>{" "}{pageText("skipsTheLiquidRiseAndPulsesAndRenders_0512fe")}</p>
        <SubSection title={pageText("states_6e6975")}>
          <div className="flex items-end gap-10">
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="slot" />
              <span className="text-xs text-muted-foreground">{pageText("slot_462854")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="configured" />
              <span className="text-xs text-muted-foreground">{pageText("configured_3be9f9")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" gradient={5} />
              <span className="text-xs text-muted-foreground">{pageText("online_2dbc2f")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" gradient={5} glow="blue" />
              <span className="text-xs text-muted-foreground">{pageText("onlineBlueGlow_434a4f")}</span>
            </div>
          </div>
        </SubSection>
        <SubSection title={pageText("sizes_96de48")}>
          <div className="flex items-end gap-8">
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="sm" gradient={1} />
              <span className="text-xs text-muted-foreground">sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="md" gradient={4} />
              <span className="text-xs text-muted-foreground">md</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="lg" gradient={8} />
              <span className="text-xs text-muted-foreground">lg</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size={{ width: 28, height: 96 }} gradient={6} />
              <span className="text-xs text-muted-foreground">{pageText("customPx_f9b311")}</span>
            </div>
          </div>
        </SubSection>
        <SubSection title={pageText("gradients_80401d")}>
          <div className="flex items-end gap-3 flex-wrap">
            {Array.from({ length: AGENT_GRADIENT_COUNT }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <AgentCapsule state="online" size="sm" gradient={i + 1} />
                <span className="text-(length:--text-nano) font-mono text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FORM ELEMENTS                                                */}
      {/* ============================================================ */}
      <Section title={pageText("formElements_73c76e")}>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={pageText("input_b568d4")}>
            <Input placeholder={pageText("defaultInput_5fd94a")} />
            <Input placeholder={pageText("disabledInput_d43d1b")} disabled className="mt-2" />
          </SubSection>

          <SubSection title={pageText("textarea_181339")}>
            <Textarea placeholder={pageText("writeSomething_705621")} />
          </SubSection>

          <SubSection title={pageText("checkboxLabel_61823f")}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="check1" defaultChecked />
                <Label htmlFor="check1">{pageText("checkedItem_5b67ec")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check2" />
                <Label htmlFor="check2">{pageText("uncheckedItem_d9c765")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check3" disabled />
                <Label htmlFor="check3">{pageText("disabledItem_f3e166")}</Label>
              </div>
            </div>
          </SubSection>

          <SubSection title={pageText("inlineEditor_851fc3")}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{pageText("titleSingleLine_ab2426")}</p>
                <InlineEditor
                  value={inlineTitle}
                  onSave={setInlineTitle}
                  as="h2"
                  className="text-xl font-bold"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{pageText("bodyTextSingleLine_65e16a")}</p>
                <InlineEditor
                  value={inlineText}
                  onSave={setInlineText}
                  as="p"
                  className="text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{pageText("descriptionMultilineAutoSizing_a10044")}</p>
                <InlineEditor
                  value={inlineDesc}
                  onSave={setInlineDesc}
                  as="p"
                  className="text-sm text-muted-foreground"
                  placeholder={pageText("addADescription_8c1d83")}
                  multiline
                />
              </div>
            </div>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SELECT                                                       */}
      {/* ============================================================ */}
      <Section title={pageText("select_859822")}>
        <p className="mb-4 text-sm text-muted-foreground">{pageText("nativeSingleValueDropdownsShareAnInsetTheme_eb27aa")}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={pageText("defaultSize_ebe275")}>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={pageText("selectStatus_033201")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">{pageText("backlog_1fe3af")}</SelectItem>
                <SelectItem value="todo">{pageText("todo_fdebf6")}</SelectItem>
                <SelectItem value="in_progress">{pageText("inProgress_f61ead")}</SelectItem>
                <SelectItem value="in_review">{pageText("inReview_fc4be1")}</SelectItem>
                <SelectItem value="done">{pageText("done_e9b450")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{pageText("currentValue_1bc58c") + " "}{selectValue}</p>
          </SubSection>
          <SubSection title={pageText("smallTrigger_8f106a")}>
            <Select defaultValue="high">
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">{pageText("critical_04b7b2")}</SelectItem>
                <SelectItem value="high">{pageText("high_b1a595")}</SelectItem>
                <SelectItem value="medium">{pageText("medium_d40496")}</SelectItem>
                <SelectItem value="low">{pageText("low_a12494")}</SelectItem>
              </SelectContent>
            </Select>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DROPDOWN MENU                                                */}
      {/* ============================================================ */}
      <Section title={pageText("dropdownMenu_c1e68d")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">{pageText("quickActions_c40810")}<ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Check className="h-4 w-4" />{pageText("markAsDone_bdf91e")}<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BookOpen className="h-4 w-4" />{pageText("openDocs_ed19bc")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={menuChecked}
              onCheckedChange={(value) => setMenuChecked(value === true)}
            >{pageText("watchIssue_b78529")}</DropdownMenuCheckboxItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 className="h-4 w-4" />{pageText("deleteIssue_91e845")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      {/* ============================================================ */}
      {/*  POPOVER                                                      */}
      {/* ============================================================ */}
      <Section title={pageText("popover_6c858e")}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">{pageText("openPopover_3979cd")}</Button>
          </PopoverTrigger>
          <PopoverContent className="space-y-2">
            <p className="text-sm font-medium">{pageText("agentHeartbeat_2bd5d6")}</p>
            <p className="text-xs text-muted-foreground">{pageText("lastRunSucceeded24sAgoNextTimerRun_87704d")}</p>
            <Button size="xs">{pageText("wakeNow_6de4dd")}</Button>
          </PopoverContent>
        </Popover>
      </Section>

      {/* ============================================================ */}
      {/*  COLLAPSIBLE                                                  */}
      {/* ============================================================ */}
      <Section title={pageText("collapsible_c932fa")}>
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {collapsibleOpen ? pageText("hide_34d8b6") : pageText("show_d97d1e")}{" " + pageText("advancedFilters_4b31bb")}</Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-md border border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="owner-filter">{pageText("owner_89ff31")}</Label>
              <Input id="owner-filter" placeholder={pageText("filterByAgentName_76810e")} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      {/* ============================================================ */}
      {/*  SHEET                                                        */}
      {/* ============================================================ */}
      <Section title={pageText("sheet_53bc47")}>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">{pageText("openSidePanel_bafcb0")}</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{pageText("issueProperties_99500c")}</SheetTitle>
              <SheetDescription>{pageText("editMetadataWithoutLeavingTheCurrentPage_6664e3")}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4">
              <div className="space-y-1">
                <Label htmlFor="sheet-title">{pageText("title_768e0c")}</Label>
                <Input id="sheet-title" defaultValue="Improve onboarding docs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sheet-description">{pageText("description_55f8eb")}</Label>
                <Textarea id="sheet-description" defaultValue="Capture setup pitfalls and screenshots." />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline">{pageText("cancel_77dfd2")}</Button>
              <Button>{pageText("save_efc007")}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Section>

      {/* ============================================================ */}
      {/*  SCROLL AREA                                                  */}
      {/* ============================================================ */}
      <Section title={pageText("scrollArea_994b90")}>
        <ScrollArea className="h-36 rounded-md border border-border">
          <div className="space-y-2 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border p-2 text-sm">{pageText("heartbeatRun_0e2443")}{i + 1}{pageText("completedSuccessfully_8a6ecc")}</div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      {/* ============================================================ */}
      {/*  COMMAND                                                      */}
      {/* ============================================================ */}
      <Section title={pageText("commandCMDK_facb38")}>
        <div className="rounded-md border border-border">
          <Command>
            <CommandInput placeholder={pageText("typeACommandOrSearch_af3814")} />
            <CommandList>
              <CommandEmpty>{pageText("noResultsFound_e9cc6d")}</CommandEmpty>
              <CommandGroup heading="Pages">
                <CommandItem>
                  <LayoutDashboard className="h-4 w-4" />{pageText("dashboard_d87f47")}</CommandItem>
                <CommandItem>
                  <CircleDot className="h-4 w-4" />{pageText("issues_30ce4c")}</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem>
                  <CommandIcon className="h-4 w-4" />{pageText("openCommandPalette_33c642")}</CommandItem>
                <CommandItem>
                  <Plus className="h-4 w-4" />{pageText("createNewIssue_74cf30")}</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BREADCRUMB                                                   */}
      {/* ============================================================ */}
      <Section title={pageText("breadcrumb_c766e6")}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{pageText("projects_53e890")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{pageText("paperclipApp_cfeeac")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageText("issueList_75e99b")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      {/* ============================================================ */}
      {/*  CARDS                                                        */}
      {/* ============================================================ */}
      <Section title={pageText("cards_0f830b")}>
        <SubSection title={pageText("dashboardAgentRuns_63a178")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {["running", "queued", "succeeded", "failed", "timed_out", "cancelled", "interrupted"].map((status) => (
              <AgentRunCard
                key={status}
                companyId="design-guide"
                run={{
                  id: `design-guide-${status}`, agentId: "design-guide-agent", agentName: "CodexCoder",
                  status, adapterType: "codex_local", invocationSource: "on_demand", triggerDetail: "manual",
                  startedAt: null, finishedAt: null, createdAt: "2026-09-11T12:00:00Z", issueId: "design-guide-task",
                }}
                issue={{ identifier: "PAP-559", title: "Recreate this wireframe on pages Paperclip", status: status === "succeeded" ? "done" : "in_progress" }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{pageText("theDashboardAndLiveRunsPageUseThe_858ef0")}</p>
        </SubSection>
        <SubSection title={pageText("standardCard_a043d5")}>
          <Card>
            <CardHeader>
              <CardTitle>{pageText("cardTitle_92f090")}</CardTitle>
              <CardDescription>{pageText("cardDescriptionWithSupportingText_e11b67")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{pageText("cardContentGoesHereThisIsTheMain_f79ab1")}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">{pageText("action_97c89a")}</Button>
              <Button variant="outline" size="sm">{pageText("cancel_77dfd2")}</Button>
            </CardFooter>
          </Card>
        </SubSection>

        <SubSection title={pageText("metricCards_4adf46")}>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard icon={Bot} value={12} label={pageText("activeAgents_390652")} description={pageText("3ThisWeek_075673")} />
            <MetricCard icon={CircleDot} value={48} label={pageText("openIssues_6c604c")} />
            <MetricCard icon={DollarSign} value="$1,234" label={pageText("monthlyCost_ddfb9c")} description={pageText("underBudget_79ab4d")} />
            <MetricCard icon={Zap} value="99.9%" label={pageText("uptime_6aafa8")} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TABS                                                         */}
      {/* ============================================================ */}
      <Section title={pageText("tabs_2a4d56")}>
        <SubSection title={pageText("defaultPillVariant_9b6e2f")}>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{pageText("overview_0efc2e")}</TabsTrigger>
              <TabsTrigger value="runs">{pageText("runs_fcde5c")}</TabsTrigger>
              <TabsTrigger value="config">{pageText("config_885114")}</TabsTrigger>
              <TabsTrigger value="costs">{pageText("costs_799b3e")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground py-4">{pageText("overviewTabContent_2c0453")}</p>
            </TabsContent>
            <TabsContent value="runs">
              <p className="text-sm text-muted-foreground py-4">{pageText("runsTabContent_f04ab4")}</p>
            </TabsContent>
            <TabsContent value="config">
              <p className="text-sm text-muted-foreground py-4">{pageText("configTabContent_9773b0")}</p>
            </TabsContent>
            <TabsContent value="costs">
              <p className="text-sm text-muted-foreground py-4">{pageText("costsTabContent_90c7b2")}</p>
            </TabsContent>
          </Tabs>
        </SubSection>

        <SubSection title={pageText("lineVariant_55c110")}>
          <Tabs defaultValue="summary">
            <TabsList variant="line">
              <TabsTrigger value="summary">{pageText("summary_12b71c")}</TabsTrigger>
              <TabsTrigger value="details">{pageText("details_dc3dec")}</TabsTrigger>
              <TabsTrigger value="comments">{pageText("comments_fce06e")}</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <p className="text-sm text-muted-foreground py-4">{pageText("summaryContentWithUnderlineTabs_3c1fb0")}</p>
            </TabsContent>
            <TabsContent value="details">
              <p className="text-sm text-muted-foreground py-4">{pageText("detailsContent_1be352")}</p>
            </TabsContent>
            <TabsContent value="comments">
              <p className="text-sm text-muted-foreground py-4">{pageText("commentsContent_1ee88b")}</p>
            </TabsContent>
          </Tabs>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  ENTITY ROWS                                                  */}
      {/* ============================================================ */}
      <Section title={pageText("entityRows_fecc81")}>
        <div className="border border-border rounded-md">
          <EntityRow
            leading={
              <>
                <StatusIcon status="in_progress" />
                {/* PAP-411: PriorityIcon hidden behind SHOW_TASK_PRIORITY_UI. */}
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="high" />}
              </>
            }
            identifier="PAP-001"
            title={pageText("implementAuthenticationFlow_6c52a2")}
            subtitle="Responsible: Agent Alpha"
            trailing={<IssueStatusBadge status="in_progress" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="done" />
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="medium" />}
              </>
            }
            identifier="PAP-002"
            title={pageText("setUpCICDPipeline_2988de")}
            subtitle="Completed 2 days ago"
            trailing={<IssueStatusBadge status="done" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="todo" />
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="low" />}
              </>
            }
            identifier="PAP-003"
            title={pageText("writeAPIDocumentation_0fb190")}
            trailing={<IssueStatusBadge status="todo" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="blocked" />
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="critical" />}
              </>
            }
            identifier="PAP-004"
            title={pageText("deployToProduction_4281af")}
            subtitle="Blocked by PAP-001"
            trailing={<IssueStatusBadge status="blocked" />}
            selected
          />
        </div>
        <SubSection title={pageText("membershipAction_68133b")}>
          <div className="border border-border rounded-md">
            <EntityRow
              title={pageText("joinedResource_69c117")}
              subtitle="Hover or focus the row to reveal the reserved action slot."
              className="group"
              trailing={
                <MembershipAction
                  state="joined"
                  resourceName="Joined resource"
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={pageText("leftResource_26353e")}
              subtitle="Persistent action with dimmed row content."
              className="group text-foreground/55"
              trailing={
                <MembershipAction
                  state="left"
                  resourceName="Left resource"
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={pageText("leavingResource_665a60")}
              subtitle="Disabled while the optimistic mutation is pending."
              className="group text-foreground/55"
              trailing={
                <MembershipAction
                  state="left"
                  pending
                  pendingState="left"
                  resourceName="Leaving resource"
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={pageText("joiningResource_70a4df")}
              subtitle="The target state is visible immediately while the server confirms."
              className="group"
              trailing={
                <MembershipAction
                  state="joined"
                  pending
                  pendingState="joined"
                  resourceName="Joining resource"
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FILTER BAR                                                   */}
      {/* ============================================================ */}
      <Section title={pageText("filterBar_14b83b")}>
        <FilterBar
          filters={filters}
          onRemove={(key) => setFilters((f) => f.filter((x) => x.key !== key))}
          onClear={() => setFilters([])}
        />
        {filters.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters([
                { key: "status", label: controlText("Status"), value: controlText("Active") },
                // PAP-411: priority filter demo row suppressed while SHOW_TASK_PRIORITY_UI is off.
                ...(SHOW_TASK_PRIORITY_UI
                  ? [{ key: "priority", label: "Priority", value: "High" } as FilterValue]
                  : []),
              ])
            }
          >{pageText("resetFilters_565531")}</Button>
        )}
      </Section>

      {/* ============================================================ */}
      {/*  AVATARS                                                      */}
      {/* ============================================================ */}
      <Section title={pageText("avatars_fc022e")}>
        <SubSection title={pageText("sizes_96de48")}>
          <div className="flex items-center gap-3">
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>DF</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </div>
        </SubSection>

        <SubSection title={pageText("group_171a06")}>
          <AvatarGroup>
            <Avatar><AvatarFallback>A1</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A2</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A3</AvatarFallback></Avatar>
            <AvatarGroupCount>+5</AvatarGroupCount>
          </AvatarGroup>
        </SubSection>
      </Section>

      <Section title={pageText("appLogos_e9ab5b")}>
        <SubSection title={pageText("officialMarksAndRuntimeFallback_544171")}>
          <div className="flex items-center gap-3">
            <AppLogo
              name="Notion"
              logoUrl="/brands/apps/notion.svg"
              darkLogoUrl="/brands/apps/notion-dark.svg"
              size={36}
            />
            <AppLogo name="Jira" logoUrl="/brands/apps/jira.svg" darkLogoUrl="/brands/apps/jira-dark.svg" size={44} />
            <AppLogo name="Fallback" logoUrl="/brands/apps/does-not-exist.svg" size={36} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  IDENTITY                                                     */}
      {/* ============================================================ */}
      <Section title={pageText("agentPersonas_91969d")}>
        <SubSection title={pageText("stablePaletteIdentities_e6c11d")}>
          <div className="flex flex-wrap gap-3">{AGENT_PALETTE_IDS.map(palette => <AgentAvatar key={palette} appearance={appearanceForPalette(palette)} size={48} label={palette} />)}</div>
        </SubSection>
        <SubSection title={pageText("onboardingAndLiveCharacter_f97be5")}>
          <p className="text-sm text-muted-foreground">{pageText("placeOneLiveCharacterBesideTheAgentName_c7754b")}</p>
          <div className="flex gap-4"><AgentCharacter muted state="sleepy" motion="still" size={128} /><AgentCharacter size={128} /></div>
        </SubSection>
      </Section>
      <Section title={pageText("humanIdentity_7e98d1")}>
        <SubSection title={pageText("sizes_96de48")}>
          <div className="flex items-center gap-6">
            <Identity name="Alex Morgan" size="sm" />
            <Identity name="Alex Morgan" />
            <Identity name="Alex Morgan" size="lg" />
          </div>
        </SubSection>

        <SubSection title={pageText("initialsDerivation_68d8d0")}>
          <div className="flex flex-col gap-2">
            <Identity name="Casey Jordan" size="sm" />
            <Identity name="Alpha" size="sm" />
            <Identity name="Quinn Lee" size="sm" />
          </div>
        </SubSection>

        <SubSection title={pageText("customInitials_07f632")}>
          <Identity name="Backend Service" initials="BS" size="sm" />
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLTIPS                                                     */}
      {/* ============================================================ */}
      <Section title={pageText("tooltips_45a025")}>
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">{pageText("hoverMe_dba6d2")}</Button>
            </TooltipTrigger>
            <TooltipContent>{pageText("thisIsATooltip_a5577f")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm"><Settings /></Button>
            </TooltipTrigger>
            <TooltipContent>{pageText("settings_c7f73b")}</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DIALOG                                                       */}
      {/* ============================================================ */}
      <Section title={pageText("dialog_a31bda")}>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{pageText("openDialog_09b693")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pageText("dialogTitle_d4b533")}</DialogTitle>
              <DialogDescription>{pageText("thisIsASampleDialogShowingTheStandard_636c11")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{pageText("name_709a23")}</Label>
                <Input placeholder={pageText("enterAName_7e5fe9")} className="mt-1.5" />
              </div>
              <div>
                <Label>{pageText("description_55f8eb")}</Label>
                <Textarea placeholder={pageText("describe_0b86b1")} className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">{pageText("cancel_77dfd2")}</Button>
              <Button>{pageText("save_efc007")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      {/* ============================================================ */}
      {/*  EMPTY STATE                                                  */}
      {/* ============================================================ */}
      <Section title={pageText("emptyState_0a8009")}>
        <div className="border border-border rounded-md">
          <EmptyState
            icon={Inbox}
            message={pageText("noItemsToShowCreateYourFirstOne_c71ad6")}
            action="Create Item"
            onAction={() => {}}
          />
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROGRESS BARS                                                */}
      {/* ============================================================ */}
      <Section title={pageText("progressBarsBudget_6c2b32")}>
        <div className="space-y-3">
          {[
            { label: "Under budget (40%)", pct: 40, color: "bg-green-400" },
            { label: "Warning (75%)", pct: 75, color: "bg-yellow-400" },
            { label: "Over budget (95%)", pct: 95, color: "bg-red-400" },
          ].map(({ label, pct, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{controlText(label)}</span>
                <span className="text-xs font-mono">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-(--tp-width-background-color) duration-150 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  LOG VIEWER                                                   */}
      {/* ============================================================ */}
      <Section title={pageText("logViewer_05a3ad")}>
        <div className="bg-neutral-950 rounded-lg p-3 font-mono text-xs max-h-80 overflow-y-auto">
          <div className="text-foreground">[12:00:01] INFO  Agent started successfully</div>
          <div className="text-foreground">[12:00:02] INFO  Processing task PAP-001</div>
          <div className="text-yellow-400">[12:00:05] WARN  Rate limit approaching (80%)</div>
          <div className="text-foreground">[12:00:08] INFO  Task PAP-001 completed</div>
          <div className="text-red-400">[12:00:12] ERROR Connection timeout to upstream service</div>
          <div className="text-blue-300">[12:00:12] SYS   Retrying connection in 5s...</div>
          <div className="text-foreground">[12:00:17] INFO  Reconnected successfully</div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 animate-pulse" />
              <span className="inline-flex h-full w-full rounded-full bg-blue-500" />
            </span>
            <span className="text-blue-600 dark:text-blue-400">{pageText("live_65c821")}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROPERTY ROW PATTERN                                         */}
      {/* ============================================================ */}
      <Section title={pageText("propertyRowPattern_6d60de")}>
        <div className="border border-border rounded-md p-4 space-y-1 max-w-sm">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{pageText("status_bae7d5")}</span>
            <StatusBadge status="active" />
          </div>
          {/* PAP-411: priority metadata row hidden behind SHOW_TASK_PRIORITY_UI. */}
          {SHOW_TASK_PRIORITY_UI && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">{pageText("priority_886cbf")}</span>
              <PriorityIcon priority="high" />
            </div>
          )}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{pageText("responsible_96cd62")}</span>
            <div className="flex items-center gap-1.5">
              <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
              <span className="text-xs">{pageText("agentAlpha_23fc1b")}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{pageText("created_accf40")}</span>
            <span className="text-xs">{pageText("jan152025_3949cb")}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  NAVIGATION PATTERNS                                          */}
      {/* ============================================================ */}
      <Section title={pageText("navigationPatterns_3c5708")}>
        <SubSection title={pageText("independentMCPConnections_349bdd")}>
          <p className="text-sm text-muted-foreground">{pageText("zapierArcadeComposioAndExecutorEachOwnA_a1d550")}</p>
          <RemoteMcpDesignExample />
        </SubSection>
        <SubSection title={pageText("setupWizard_739a95")}>
          <p className="text-sm text-muted-foreground">{pageText("sharedByConnectionSetupAndTriggerPreviewsSetup_610777")}</p>
          <div className="max-w-sm space-y-6">
            <SetupWizardNavigation inline labels={[controlText("Choose trigger"), controlText("Configure"), controlText("Review")]} step={wizardStep} availableStep={2} onSelect={setWizardStep} />
            <SetupWizardFooter onSaveExit={() => setWizardStep(0)}><Button onClick={() => setWizardStep((wizardStep + 1) % 3)}>{pageText("continue_2e0262")}</Button></SetupWizardFooter>
          </div>
        </SubSection>
        <SubSection title={pageText("agentChatPicker_8a787c")}>
          <AgentChatPickerExample />
          <SubSection title={pageText("agentConversationSidebar_4e1207")}>
            <div className="flex flex-wrap gap-4">
              <div className="h-96 w-60"><AgentConversationSidebar agents={[]} onSelect={() => {}} onBrowse={() => {}} /></div>
              <div className="h-96 w-60"><AgentConversationSidebar agents={[]} loading /></div>
              <div className="h-96 w-60"><AgentConversationSidebar agents={[]} error={new Error("Unavailable")} onRetry={() => {}} /></div>
            </div>
          </SubSection>
        </SubSection>
        <SubSection title={pageText("sidebarNavItems_934f1a")}>
          <p className="text-sm text-muted-foreground">{pageText("layoutAcceptsSidebarSectionsToComposeAdditionalSidebarSectionGroups_908241")}</p>
          <Card className="block w-60 p-3 space-y-0.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />{pageText("dashboard_d87f47")}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <CircleDot className="h-4 w-4" />{pageText("issues_30ce4c")}<Badge variant="ghost" className="ml-auto bg-primary text-primary-foreground px-1.5">
                12
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Bot className="h-4 w-4" />{pageText("agents_64acf7")}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Hexagon className="h-4 w-4" />{pageText("projects_53e890")}</div>
          </Card>
        </SubSection>

        <SubSection title={pageText("viewToggle_dadf1f")}>
          <div className="flex items-center border border-border rounded-md w-fit">
            <button className="px-3 py-1.5 text-xs font-medium bg-accent text-foreground rounded-l-md">
              <ListTodo className="h-3.5 w-3.5 inline mr-1" />{pageText("list_a1fffa")}</button>
            <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 rounded-r-md">
              <Target className="h-3.5 w-3.5 inline mr-1" />{pageText("org_972f71")}</button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  GROUPED LIST (Issues pattern)                                */}
      {/* ============================================================ */}
      <Section title={pageText("groupedListIssuesPattern_fb6781")}>
        <div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-t-md">
            <StatusIcon status="in_progress" />
            <span className="text-sm font-medium">{pageText("inProgress_f61ead")}</span>
            <span className="text-xs text-muted-foreground ml-1">2</span>
          </div>
          <div className="border border-border rounded-b-md">
            {/* PAP-411: leading PriorityIcon hidden behind SHOW_TASK_PRIORITY_UI. */}
            <EntityRow
              leading={SHOW_TASK_PRIORITY_UI ? <PriorityIcon priority="high" /> : undefined}
              identifier="PAP-101"
              title={pageText("buildAgentHeartbeatSystem_ea3616")}
              onClick={() => {}}
            />
            <EntityRow
              leading={SHOW_TASK_PRIORITY_UI ? <PriorityIcon priority="medium" /> : undefined}
              identifier="PAP-102"
              title={pageText("addCostTrackingDashboard_86e402")}
              onClick={() => {}}
            />
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COMMENT THREAD PATTERN                                       */}
      {/* ============================================================ */}
      <Section title={pageText("commentThreadPattern_733e30")}>
        <div className="space-y-3 max-w-2xl">
          <h3 className="text-sm font-semibold">{pageText("comments2_3c1f32")}</h3>
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{pageText("agent_5ce2e6")}</span>
                <span className="text-xs text-muted-foreground">{pageText("jan152025_3949cb")}</span>
              </div>
              <p className="text-sm">{pageText("startedWorkingOnTheAuthenticationModuleWillNeed_cace74")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{pageText("human_e31663")}</span>
                <span className="text-xs text-muted-foreground">{pageText("jan162025_01eedd")}</span>
              </div>
              <p className="text-sm">{pageText("apiKeysHaveBeenAddedToTheVault_c4d3c7")}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Textarea placeholder={pageText("leaveAComment_5b96fd")} rows={3} />
            <Button size="sm">{pageText("comment_153d7a")}</Button>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COST TABLE PATTERN                                           */}
      {/* ============================================================ */}
      <Section title={pageText("costTablePattern_ddb191")}>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-accent/20">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{pageText("model_68c2cc")}</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{pageText("tokens_c38c6c")}</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{pageText("cost_64ae43")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-sonnet-4-20250514</td>
                <td className="px-3 py-2 font-mono">1.2M</td>
                <td className="px-3 py-2 font-mono">$18.00</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-haiku-4-20250506</td>
                <td className="px-3 py-2 font-mono">500k</td>
                <td className="px-3 py-2 font-mono">$1.25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">{pageText("total_b25928")}</td>
                <td className="px-3 py-2 font-mono">1.7M</td>
                <td className="px-3 py-2 font-mono font-medium">$19.25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SKELETONS                                                    */}
      {/* ============================================================ */}
      <Section title={pageText("skeletons_0bed18")}>
        <SubSection title={pageText("individual_a7abed")}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-20 w-full" />
          </div>
        </SubSection>

        <SubSection title={pageText("pageSkeletonList_c1a5b6")}>
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="list" />
          </div>
        </SubSection>

        <SubSection title={pageText("pageSkeletonDetail_c1d754")}>
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="detail" />
          </div>
        </SubSection>
        <SubSection title={pageText("taskConversationLoading_f32d5c")}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative h-96 overflow-hidden rounded-md border border-border">
              <TaskChatLoadingShell mobile={false} streamlined coordinator={false} />
            </div>
            <div className="coordinator-workspace relative h-96 overflow-hidden rounded-md border border-border">
              <TaskChatLoadingShell mobile streamlined coordinator />
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  SEPARATOR                                                    */}
      {/* ============================================================ */}
      <Section title={pageText("separator_b4b289")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{pageText("horizontal_4f57a1")}</p>
          <Separator />
          <div className="flex items-center gap-4 h-8">
            <span className="text-sm">{pageText("left_8ae1c3")}</span>
            <Separator orientation="vertical" />
            <span className="text-sm">{pageText("right_954daa")}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  ICON REFERENCE                                               */}
      {/* ============================================================ */}
      {/*  TEAM CATALOG                                                 */}
      {/* ============================================================ */}
      <Section title={pageText("teamCatalog_d49763")}>
        <p className="text-sm text-muted-foreground">{pageText("componentsFromTheTeamCatalogBrowseInstallSurface_7cccfb")}<code className="font-mono text-xs">/teams-catalog</code>{pageText("fixturesAreSharedWithTheStorybookStories_d6c0cc")}</p>

        <SubSection title={pageText("teamrowBrowseList_ab8a29")}>
          <div className="w-(--sz-28rem) rounded-md border border-border">
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">{pageText("bundled1_94d593")}</div>
            <TeamRow team={sampleTeam} selected onSelect={() => {}} />
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">{pageText("optional2_3e6c38")}</div>
            <TeamRow team={optionalTeam} selected={false} onSelect={() => {}} />
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">{pageText("installed2_5d4165")}</div>
            <TeamRow team={sampleTeam} selected={false} onSelect={() => {}} installed={outOfDateInstalledState} />
            <TeamRow team={warnTeam} selected={false} onSelect={() => {}} installed={currentInstalledState} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pageText("installedTeamsCollapseUnder_f0d44f") + " "}<code className="font-mono">INSTALLED · N</code>{pageText("anOutOfDateInstallServer_c6f84a") + " "}<code className="font-mono">originHash</code>{" " + pageText("catalog_5502fc") + " "}<code className="font-mono">contentHash</code>{pageText("showsTheAmber_ce9946") + " "}<code className="font-mono">↑</code>{" " + pageText("badgePAP10256_df417d")}</p>
        </SubSection>

        <SubSection title={pageText("teamcardOnboardingGrid_8ca5d0")}>
          <p className="text-xs text-muted-foreground">{pageText("squareTileForTheOnboardingPickAStarter_8b9d58")}{" "}
            <code className="font-mono">ring-2 ring-ring</code>{pageText("drivesThe_719792")}{" "}
            <code className="font-mono">useInstallTeamCatalogEntry</code>{" " + pageText("simplifiedFlow_485eed")}</p>
          <TeamCardShowcase />
        </SubSection>

        <SubSection title="TeamHierarchyPreview">
          <div className="max-w-md">
            <TeamHierarchyPreview team={sampleTeam} />
          </div>
        </SubSection>

        <SubSection title="RequiredSkillsList">
          <div className="max-w-xl">
            <RequiredSkillsList skills={sampleTeam.requiredSkills} />
          </div>
        </SubSection>

        <SubSection title="EnvInputsList">
          <div className="max-w-xl">
            <EnvInputsList inputs={sampleTeam.envInputs} />
          </div>
        </SubSection>

        <SubSection title="ExternalSourcesList">
          <div className="max-w-xl">
            <ExternalSourcesList sources={sampleTeam.sourceRefs} />
          </div>
        </SubSection>

        <SubSection title={pageText("sourcePolicyStepStepSourcePolicy_24e19e")}>
          <div className="max-w-xl rounded-md border border-border p-4">
            <StepSourcePolicy
              team={warnTeam}
              allowExternalSources={allowExternal}
              allowUnpinnedOptionalSources={allowUnpinned}
              allowLocalPathSources={allowLocalPath}
              onChange={(key, value) => {
                if (key === "external") setAllowExternal(value);
                if (key === "unpinned") setAllowUnpinned(value);
                if (key === "localPath") setAllowLocalPath(value);
              }}
            />
          </div>
        </SubSection>

        <SubSection title={pageText("skillPlanStepStepSkillPlan_1aab3c")}>
          <div className="max-w-xl rounded-md border border-border p-4">
            <StepSkillPlan team={sampleTeam} preparations={sampleSkillPreparations} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      <Section title={pageText("commonIconsLucide_5e4020")}>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {[
            ["Inbox", Inbox],
            ["ListTodo", ListTodo],
            ["CircleDot", CircleDot],
            ["Hexagon", Hexagon],
            ["Target", Target],
            ["LayoutDashboard", LayoutDashboard],
            ["Bot", Bot],
            ["DollarSign", DollarSign],
            ["History", History],
            ["Search", Search],
            ["Plus", Plus],
            ["Trash2", Trash2],
            ["Settings", Settings],
            ["User", User],
            ["Mail", Mail],
            ["Upload", Upload],
            ["Zap", Zap],
          ].map(([name, Icon]) => {
            const LucideIcon = Icon as React.FC<{ className?: string }>;
            return (
              <div key={name as string} className="flex flex-col items-center gap-1.5 p-2">
                <LucideIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-(length:--text-nano) text-muted-foreground font-mono">{name as string}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  KEYBOARD SHORTCUTS                                           */}
      {/* ============================================================ */}
      <Section title={pageText("keyboardShortcuts_b46575")}>
        <div className="border border-border rounded-md divide-y divide-border text-sm">
          {[
            ["Cmd+K / Ctrl+K", "Open Command Palette"],
            ["C", "New Issue (outside inputs)"],
            ["[", "Toggle Sidebar"],
            ["]", "Toggle Properties Panel"],

            ["Enter / Shift+Enter", "Submit task message / add a new line (Command/Ctrl+Enter is available in Experimental settings)"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded border border-border">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </Section>

      <Section title={pageText("issueOutputSurface_139a6d")}>
        <SubSection title={pageText("multipleOutputsPrimaryVideoAlsoProduced_8f3a52")}>
          <IssueOutputSection workProducts={DESIGN_GUIDE_OUTPUTS} />
        </SubSection>
        <SubSection title={pageText("degradedOutputInvalidFailedAttachmentMetadata_ccc8a7")}>
          <IssueOutputSection workProducts={DESIGN_GUIDE_DEGRADED_OUTPUTS} />
        </SubSection>
        <SubSection title={pageText("emptyState_41dac3")}>
          <p className="text-xs text-muted-foreground">{pageText("whenAnIssueHasProducedNoArtifactWork_47d298")}</p>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLS & ACCESS (PAP-10389)                                   */}
      {/* ============================================================ */}
      <Section title={pageText("toolsAccess_76c359")}>
        <SubSection title={pageText("enforcementbannerDefaultDeniedDetected_483445")}>
          <div className="space-y-3">
            <EnforcementBanner companyId="" forceVariant="default" recentDenialCount={0} />
            <EnforcementBanner companyId="" forceVariant="denied-detected" recentDenialCount={3} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pageText("persistentAtTheTopOfTheToolsAccess_edab42") + " "}<code>denied-detected</code>{" " + pageText("whenGovernedToolCallsWereDeniedOrFailed_256b10")}</p>
        </SubSection>

        <SubSection title={pageText("enforcementbannerPresentationalTonesInfoWarningError_823bf0")}>
          <div className="space-y-3">
            <EnforcementBanner
              tone="info"
              title={pageText("effectiveAccessServerResolved_9e6466")}
              body="This is exactly what the tool gateway will accept. Profile and policy edits reflect within ~5s; the prompt cannot expand it."
            />
            <EnforcementBanner
              tone="warning"
              title={pageText("localStdioIsLocalCodeExecutionNotA_55c6d5")}
              body="A local-stdio slot runs with the orchestrator's privileges. Only bind trusted commands; quarantine anything you would not run yourself."
            />
            <EnforcementBanner
              tone="error"
              title={pageText("runtimeFailedClosed_5842c4")}
              body="The supervisor is restarting (attempt 2/3). The gateway returns runtime-error and the agent does not see partial output."
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pageText("staticGovernanceCopyWithAToneUsedFor_8f8e89") + " "}<code>title</code>/<code>body</code>{" " + pageText("andAnOptional_c0178b")}{" "}
            <code>icon</code>.
          </p>
        </SubSection>

        <SubSection title={pageText("actionApprovalCardPendingStaleSurfaces1112_5b65f3")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <ActionCard
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉", unfurl_links: false }}
              reason="This tool can write to your workspace, so a human signs off before the agent posts."
              policyNumber={7}
              expiresInLabel="expires in 23h 51m"
            />
            <ActionCard
              variant="stale"
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:7d793037a0760186574b0282f2f435e7a4b1b2b0b822cd15d6c15b0f00a0e3f1",
                previousCatalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉", unfurl_links: false }}
              reason="This tool can write to your workspace, so a human signs off before the agent posts."
              policyNumber={7}
              expiresInLabel="expires in 18h 02m"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pageText("signedPayloadSha256ExpirySurfaceOnEveryVariant_c7c996")}{" "}
            <code>stale</code>{" " + pageText("variantTintsTheBorderAmberBannersTheCatalog_0221db") + " "}<code>Approve</code>{" " + pageText("disabledUntilTheRequestIsReIssued_d8595a")}</p>
        </SubSection>

        <SubSection title={pageText("actionApprovalCardMobile390844Surface99_2cdd72")}>
          <div className="w-(--sz-390px) max-w-full rounded-xl border border-border bg-background p-3">
            <ActionCardMobile
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉" }}
              reason="This tool can write to your workspace, so a human signs off before the agent posts."
              policyNumber={7}
              expiresInLabel="expires in 23h 51m"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pageText("identicalContentTheThreeButtonsStackFullWidth_071c98")}</p>
        </SubSection>

        <SubSection title={pageText("bindingstableReusedInTheAuditRowDrilldown_c8fbeb")}>
          <BindingsTable
            rows={[
              { label: "Application", value: "Slack · manifest v2.4.1" },
              { label: "Connection", value: "https://slack.com/api · acme-workspace", mono: true },
              { label: "Catalog", value: "sha256:9f86d081…f00a08", mono: true },
              { label: "Payload", value: "sha256:2c26b46b…66e7ae", mono: true },
            ]}
          />
          <p className="mt-2 text-xs text-muted-foreground">{pageText("twoColumnKeyValueBlockWithMonoValues_94b92b") + " "}<code>ActionCard</code>{" " + pageText("andIsReusedStandaloneInTheAuditRow_959b28")}</p>
        </SubSection>

        <SubSection title={pageText("toolAccessStatusKeysStatusBadge_39a1f7")}>
          <div className="flex flex-wrap items-center gap-2">
            {[
              "allowed", "denied", "block", "require-approval", "redacted", "rate-limit",
              "deferred", "hidden", "quarantined", "healthy", "degraded", "runtime-error", "unchecked",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pageText("policyDecisionsConnectionRuntimeHealthAndCatalogQuarantine_225594")}{" "}
            <code>StatusBadge</code>{" " + pageText("keysDefinedIn_f0abca") + " "}<code>lib/status-colors</code>.
          </p>
        </SubSection>

        <SubSection title={pageText("emptystateCanonicalWithDescriptionAction_6b00cb")}>
          <EmptyState
            icon={Inbox}
            message={pageText("noConnectionsYet_5bb01e")}
            description={pageText("addAConnectionToAnApplicationToConfigure_009707")}
            action="New connection"
            onAction={() => {}}
          />
        </SubSection>
      </Section>

      <Section title={pageText("githubSkillSources_ac41b0")}>
        <p className="text-sm text-muted-foreground">{pageText("theSharedFileTreeExplorerLayoutPutsDisclosureControls_16083c")}</p>
        <SkillSourceTreeShowcase />
        <SkillBinaryFile file={{ skillId: "example", path: "assets/example.bin", kind: "asset", content: "AAECAw==", encoding: "base64", language: null, markdown: false, editable: false }} />
      </Section>

      <Section title={pageText("sourceRepositories_ae8ba8")}>
        <SubSection title={pageText("emptyAndDisconnected_5cfc47")}>
          <RepositoryEditor selected={[]} onChange={() => {}} state="disconnected" onConnect={() => {}} onRetry={() => {}} />
        </SubSection>
        <SubSection title={pageText("selectedAndSearchable_ee3812")}>
          <RepositoryEditor selected={[{ id: "1", fullName: "paperclipai/paperclip", url: "https://github.com/paperclipai/paperclip", connections: ["Your GitHub"] }]}
            available={[{ id: "2", fullName: "paperclipai/docs", url: "https://github.com/paperclipai/docs", connections: ["Company GitHub"] }]}
            onChange={() => {}} onConnect={() => {}} onRetry={() => {}} />
        </SubSection>
        <p className="text-sm text-muted-foreground">{pageText("loadingErrorsEmptySearchMobileAndShortViewports_720e7c")}</p>
      </Section>

      <Section title={pageText("environmentVariablesEditor_1fae4a")}>
        <p className="text-sm text-muted-foreground">{pageText("reusableEnvVarEditorAgentsProjectsEnvironmentsRoutines_741a4d") + " "}<span className="font-mono">{pageText("productEnvironmentVariablesEditor_0ca941")}</span>{" " + pageText("storiesForAll10States_cede2e")}</p>
        <EnvironmentVariablesEditorShowcase />
      </Section>

      <Section title={pageText("tasksCreatedFromATask_337f7e")}>
        <SubSection title={pageText("subtasksAndCreatedWorkAreIndependent_40aebd")}>
          <div className="max-w-xl">
            <TaskDetailTasksPanel
              subtasks={[DESIGN_GUIDE_TASK]}
              createdTasks={[
                { ...DESIGN_GUIDE_TASK, projectId: "design-board", project: { id: "design-board", name: "Board UI" } as Issue["project"] },
                { ...DESIGN_GUIDE_TASK, id: "design-followup", identifier: "PAP-428", title: "Write release notes", status: "todo", projectId: null },
              ]}
              projects={[]}
            />
          </div>
        </SubSection>
        <SubSection title={pageText("emptyLoadingAndFailed_7c862c")}>
          <TaskDetailTasksPanel subtasks={[]} createdTasks={[]} projects={[]} />
          <TaskDetailTasksPanel subtasks={[]} createdTasks={[]} projects={[]} isLoading />
          <TaskDetailTasksPanel subtasks={[]} createdTasks={[]} projects={[]} hasError onRetry={() => {}} />
        </SubSection>
      </Section>

      <Section title={pageText("dispositionRecoveryNotice_03d4e1")}>
        <SubSection title={pageText("needsAttentionWithInspectableDetails_ad8e8d")}>
          <DispositionRecoveryNotice snapshot={{ kind: "disposition_repair_escalated", actionId: "design-recovery", attemptCount: 2, maxAttempts: 2, reason: "unchanged_source_state_exhausted", assigneeAgentId: null }} defaultExpanded />
        </SubSection>
        <p className="text-sm text-muted-foreground">{pageText("storybookSRecoveryNoticeStoriesShowTheActionable_701343")}</p>
      </Section>

      <Section title={pageText("pendingTaskInputAboveComposer_ddb925")}>
        <p className="mb-3 text-sm text-muted-foreground">{pageText("aDecisionCardSitsAboveTheOrdinaryMessage_fb7636")}</p>
        <TaskPendingInputExample />
      </Section>

      <Section title={pageText("executionRecovery_07ee13")}>
        <p className="text-sm text-muted-foreground">{pageText("recoveryRunsInTheBackgroundTaskListsKeep_44b69b")}</p>
        <p className="text-sm text-muted-foreground">{pageText("whenRetainedFileRecoveryNeedsAnotherAuthorizedRequest_3df03a")}</p>
      </Section>

      <Section title={pageText("cloudSignInUnavailable_2ce8e8")}>
        <CloudSignIn cloud={{ managed: true, managedBy: "paperclip-cloud", cloudBaseUrl: null, stackSlug: null }} returnTo="/" />
      </Section>

      <Section title={pageText("savedProviderAPIKeys_3c952b")}>
        <SavedProviderKeySelect options={[{ id: "example", label: "Claude API key (Your key)", binding: { type: "user_secret_ref", key: "ANTHROPIC_API_KEY", version: "latest" } }]} value="example" onChange={() => {}} loading={false} error={false} />
        <SavedProviderKeySelect options={[]} value="" onChange={() => {}} loading error={false} />
        <SavedProviderKeySelect options={[]} value="" onChange={() => {}} loading={false} error />
      </Section>

      <Section title={pageText("voiceConversations_d32a78")}>
        <div className="flex flex-col gap-6">
          <VoiceControls state="working" agentName="Company Phone Agent" onStart={() => {}} onMute={() => {}} onEnd={() => {}} onResumeAudio={() => {}} />
          <VoiceControls state="failed" agentName="Company Phone Agent" error={controlText("Microphone access was denied")} onStart={() => {}} onMute={() => {}} onEnd={() => {}} onResumeAudio={() => {}} />
          <VoiceTranscript agentName="Company Phone Agent" entries={[
            { id: "ack", source: "agent", text: "I’m checking that now.", final: true },
            { id: "followup", source: "user", text: "Include the revised delivery address too.", final: true },
          ]} />
        </div>
      </Section>

      <Section title={pageText("spekoProviderSetup_e88071")}>
        <SpekoPhoneCallbackForm onSave={() => {}} />
        <SpekoCallHistoryView onRetry={() => {}} />
        <div className="divide-y divide-border border-y border-border">
          <SpekoCallActivityItem presentation="activity" entry={{session: {id: "demo-call", companyId: "demo", endpointId: "demo", issueId: "demo-task", assignedAgentId: "demo-agent", state: "ended", mode: "browser", generation: 1, callerAuthority: "member", replyCursor: 0, createdAt: "2026-10-07T17:00:00Z", expiresAt: "2026-10-07T17:10:00Z", endedAt: "2026-10-07T17:02:00Z", errorCode: null}, report: {status: "pending", costMicroUsd: null, durationSeconds: null, updatedAt: null, transcript: []}}} />
          <SpekoUnapprovedCallActivityItem presentation="activity" call={{id: "demo-missed", state: "expired", createdAt: "2026-10-07T17:00:00Z", updatedAt: "2026-10-07T17:02:00Z"}} />
        </div>
        <SpekoPhoneLineForm onRefresh={() => {}} onSave={() => {}} />
        <SpekoIncomingCallCard call={{id: "demo", state: "awaiting_approval", approvalCode: "123456", createdAt: "2026-10-07T17:00:00Z", expiresAt: "2026-10-07T17:02:00Z", sessionId: null}} onDecide={() => {}} />
        <SpekoProviderSetup agentName="Company Phone Agent" callbackUrl="https://paperclip.example/api/voice-webhooks/example/tools" credentials={{}} onChange={() => {}} onConnect={() => {}} />
      </Section>

      <Section title={pageText("externalAgentInvitation_2aad8d")}>
        <p className="text-sm text-muted-foreground">{pageText("matchTheHarnessPickerWithProviderCardsConnection_774ab2")}</p>
        <ExternalAgentPresetPicker onSelect={() => {}} />
        <DotConnectionChecks state={{ phase: "testing" }} />
        <ExternalAgentPresetPicker museEnabled onSelect={() => {}} />
        <MuseConnectionChecks state={{ paired: true, receiverDetected: true, backgroundReplyVerified: false, ready: false }} />
        <MuseConnectionChecks state={{ paired: true, receiverDetected: true, backgroundReplyVerified: true, ready: false, problem: "agent_unavailable" }} />
        <MuseConnectionChecks state={{ paired: true, receiverDetected: true, backgroundReplyVerified: true, ready: true }} />
        <MuseConnectionDetails connection={{ enabled: false, publicOrigin: null, agentStatus: "idle", agentLifecycleState: "ready", canConfigureConnection: true, binding: null, usage: null, cost: null }} onTest={() => {}} onRepair={() => {}} onPause={() => {}} onDisconnect={() => {}} onRefresh={() => {}} onAttest={() => {}} />
        <Dialog><DialogTrigger asChild><Button variant="outline">{pageText("previewInvitationModal_61c18c")}</Button></DialogTrigger>
          <AnimatedDialogContent><div className="space-y-4 p-6"><DialogTitle>{pageText("inviteAnExternalAgent_a382ae")}</DialogTitle><DialogDescription>{pageText("chooseAnAgentYouAlreadyUse_801a4b")}</DialogDescription><ExternalAgentPresetPicker onSelect={() => {}} /></div></AnimatedDialogContent>
        </Dialog>
      </Section>

      <Section title={pageText("browserSetupPrompt_677b94")}>
        <p className="text-sm text-muted-foreground">{pageText("useAgentSetupPromptForPromptsHandedToAnExternal_67d0d4")}</p>
        <SetupPrompt prompt="Design guide example. This is a preview, not a real provider setup request." />
        <p className="text-sm text-muted-foreground">{pageText("forANamedRecipientPassTheOptionalAgent_b41d91")}</p>
        <SetupPrompt prompt="Design guide example for Dot. No live pairing code." label={pageText("copySetupPrompt_c42e18")} title={pageText("connectYourDot_d7cfc6")} agent={{ name: "Dot", src: "/brands/adapters/openai-dot.svg" }} />
      </Section>

      <Section title={pageText("connectionIntent_e69322")}>
        <p className="text-sm text-muted-foreground">{pageText("theTaskCardIsTheDialogHostFor_afbc04")}</p>
        <div className="grid gap-4 xl:grid-cols-3">
          <IssueThreadInteractionCard
            interaction={pendingConnectionIntentInteraction}
            currentUserId={issueThreadInteractionFixtureMeta.currentUserId}
          />
          <IssueThreadInteractionCard
            interaction={retryConnectionIntentInteraction}
            currentUserId={issueThreadInteractionFixtureMeta.currentUserId}
          />
          <IssueThreadInteractionCard
            interaction={connectedConnectionIntentInteraction}
            currentUserId={issueThreadInteractionFixtureMeta.currentUserId}
          />
        </div>
      </Section>

      <Section title={pageText("agentmailAPIKey_dbd487")}>
        <p className="text-sm text-muted-foreground">{pageText("agentmailSetupHasTwoStepsPickAnAgent_621f41")}</p>
        <p className="text-sm text-muted-foreground">{pageText("previewOnlyThisFieldDoesNotSaveOr_18b467")}</p>
        <div className="max-w-md">
          <AgentMailApiKeyField value={agentmailDemoKey} onChange={setAgentmailDemoKey} />
        </div>
      </Section>

      <Section title={pageText("resizablePanels_2368bc")}>
        <p className="text-sm text-muted-foreground">{pageText("designSystemWrapperOver_90f81a") + " "}<span className="font-mono">react-resizable-panels</span>{" "}{pageText("skillStudioD2DragAHandleToResize_b9a334")}<span className="font-mono">minSize="240px"</span>{pageText("constraintsAndTheMiddlePanelIsCollapsibleUse_9413e1")}</p>
        <div className="h-48 max-w-2xl overflow-hidden rounded-md border border-border">
          <ResizablePanelGroup>
            <ResizablePanel id="a" minSize="120px" className="bg-muted/30">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{pageText("panelA_919115")}</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="b" minSize="120px" collapsible collapsedSize="40px" className="bg-muted/10">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{pageText("panelBCollapsible_e79a2c")}</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="c" minSize="120px" className="bg-muted/30">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{pageText("panelC_c839f1")}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  INLINE BANNER + BUILT-IN AGENTS                              */}
      {/* ============================================================ */}
      <Section title={pageText("webhookURLWarnings_3f6f51")}>
        <div className="space-y-3">
          {["http://localhost:3100", "https://paperclip.internal", "https://paperclip.example-tailnet.ts.net", "http://paperclip.example.com", "not-a-url"].map((url) => <WebhookUrlWarning key={url} url={url} />)}
        </div>
      </Section>

      <Section title={pageText("inlineBanner_f9a122")}>
        <p className="text-sm text-muted-foreground">{pageText("tokenBackedFullWidthNotice_837774")}<span className="font-mono">brandBanner</span>{" " + pageText("tonesUse_5bd993")}{" "}
          <span className="font-mono">{pageText("info_59bd0a")}</span>{" " + pageText("forProvenanceContextAnd_8e14c3")}{" "}
          <span className="font-mono">{pageText("warning_383fd7")}</span>{" " + pageText("forPausedAttentionSupportsAnOptionalBoldTitle_0deb8a")}{" "}
          <span className="font-mono">bg-yellow-*</span>/<span className="font-mono">bg-blue-*</span>{" "}{pageText("banners_5fbe00")}</p>
        <div className="space-y-3">
          <InlineBanner
            tone="info"
            title={pageText("builtInAgent_0941ba")}
            actions={<Button variant="outline" size="sm">{pageText("resetToDefaults_ddefe4")}</Button>}
          >{pageText("shipsWithPaperclipAndPowers_ddc880") + " "}<strong>{pageText("briefs_6a8639")}</strong>{pageText("itCanBePausedButNotDeleted_f7b913")}</InlineBanner>
          <InlineBanner
            tone="warning"
            title={pageText("briefsIsPaused_408692")}
            actions={
              <>
                <Button variant="ghost" size="sm">{pageText("viewAgent_98f8d9")}</Button>
                <Button size="sm">{pageText("resumeAgent_4bfc7e")}</Button>
              </>
            }
          >{pageText("itsBuiltInAgentWasPaused2Days_d78316")}</InlineBanner>
          <InlineBanner
            tone="danger"
            title={pageText("summaryGenerationFailed_80317a")}
            actions={<Button size="sm">{pageText("retry_9f5cd8")}</Button>}
          >{pageText("theLinkedIssueReachedATerminalStateBefore_5bbcb7")}</InlineBanner>
          <InlineBanner tone="info" compact>{pageText("compactVariantForEmbeddingInsideDialogsAndModals_225b44")}</InlineBanner>
        </div>
      </Section>

      <Section title={pageText("textAttachmentTabs_5cef8d")}>
        <p className="text-sm text-muted-foreground">{pageText("uploadedTextOpensInANamedTaskTab_e0ac96")}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextAttachmentPreview title="README.md" text={"# Project notes\n\nReview the **original** file."} markdown downloadUrl="data:text/markdown,%23%20Project%20notes" />
          <TextAttachmentPreview title="notes.txt" text="Plain text stays literal: <example>" markdown={false} downloadUrl="data:text/plain,Plain%20text" />
        </div>
      </Section>

      <Section title={pageText("connectionRecovery_99eb58")}>
        <SubSection title={pageText("waitingForServer_3eb8fc")}>
          <CloudAccessError temporary retrying={false} onRetry={() => undefined} />
        </SubSection>
        <SubSection title={pageText("checkingConnection_b54edd")}>
          <CloudAccessError temporary retrying onRetry={() => undefined} />
        </SubSection>
        <SubSection title={pageText("accessCheckFailed_127827")}>
          <CloudAccessError temporary={false} retrying={false} onRetry={() => undefined} />
        </SubSection>
      </Section>

      <Section title={pageText("browserSessionFooter_a02a21")}>
        <p className="text-sm text-muted-foreground">{pageText("fitToPaneFollowsTheVisiblePanelFixed_f7abd0")}</p>
        {(["running", "idle", "closing-soon", "closed"] as const).map((state) => (
          <SubSection key={state} title={state === "closing-soon" ? pageText("closingSoon_7ad45d") : state}>
            <TaskBrowserFooter
              browser={{
                id: "design-browser", sessionId: "design-session", issueId: "design-task",
                status: state === "closing-soon" ? "idle" : state,
                runStatus: "completed", progress: null, error: null, costCents: 15,
                idleDeadline: new Date(state === "closing-soon" ? 282000 : 600000).toISOString(),
                expiresAt: null, createdAt: new Date(0).toISOString(),
              } satisfies TaskBrowser}
              now={0}
              onControl={() => {}}
              onReconnect={() => {}}
              onResize={() => {}}
            />
          </SubSection>
        ))}
      </Section>

      <Section title={pageText("browserActivityInTheTaskFeed_e77666")}>
        <p className="text-sm text-muted-foreground">{pageText("eachBrowserAppearsOnceAtItsOpeningTime_6bc5da")}</p>
        {(["starting", "running", "idle", "closed", "failed"] as const).map((status) => (
          <SubSection key={status} title={status}>
            <TaskBrowserActivity browser={{
              id: `design-${status}`, sessionId: `design-${status}`, issueId: "design-task", status,
              runStatus: "completed", progress: null, error: null, costCents: 0,
              idleDeadline: null, expiresAt: null, createdAt: new Date(0).toISOString(),
            }} onOpen={() => {}} />
          </SubSection>
        ))}
      </Section>

      <Section title={pageText("mediaArtifacts_28b92f")}>
        <p className="text-sm text-muted-foreground">{pageText("imagesAndVideosUseGalleryTilesTheWhole_5ed675")}</p>
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <MediaArtifactCard id="design-image" title={pageText("launchArtwork_c7be23")} contentPath="/announcement-preview.svg" contentType="image/svg+xml" originalFilename="launch.svg" detail="Image" />
          <MediaArtifactCard id="design-video" title={pageText("videoPreviewUnavailable_08a54b")} contentPath="" contentType="video/mp4" originalFilename="preview.mp4" detail="Video" />
        </div>
      </Section>

      <Section title={pageText("aiConnections_c6ba99")}>
        <AiConnectionDesignExamples />
      </Section>

      <Section title={pageText("builtInAgentLifecycleChips_ed59c5")}>
        <p className="text-sm text-muted-foreground">{pageText("aDerivedLifecycleChipAmberForAttentionStates_9c4dc2")}{" "}
          <span className="font-mono">needs_setup</span> / <span className="font-mono">pending_approval</span>.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <BuiltInLifecycleChip status="needs_setup" />
          <BuiltInLifecycleChip status="pending_approval" />
          <BuiltInLifecycleChip status="needs_setup" compact />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-mono">&lt;BuiltInAgentGate agentKey&gt;</span>{" " + pageText("composes_c68a18")}{" "}
          <span className="font-mono">PageSkeleton</span> + <span className="font-mono">EmptyState</span>{" "}
          + <span className="font-mono">InlineBanner</span>{" " + pageText("toRenderTheLoadingSetupPendingApprovalPaused_cd3912")}</p>
      </Section>
    </div>
  );
}

function SkillSourceTreeShowcase() {
  const candidates = [
    { path: ".agents/review/SKILL.md", name: "Review", description: "Review changes before release.", error: null, inspection: { requirements: null, references: [], warnings: [], files: [
      { path: "SKILL.md", kind: "skill", sizeBytes: 120, encoding: "utf8" as const, executable: false },
      { path: "scripts/check.sh", kind: "script", sizeBytes: 45, encoding: "utf8" as const, executable: true },
    ] } },
    { path: ".agents/review/nested/SKILL.md", name: "Nested skill", description: "An independently selected package.", error: null, note: "New skill" },
    { path: "broken/SKILL.md", name: "Needs attention", description: null, error: "Missing required description." },
  ];
  const [selected, setSelected] = useState(new Set(candidates.map(skill => skill.path)));
  const [excluded, setExcluded] = useState<string[]>([]);
  return <SkillSourceTree candidates={candidates} selected={selected} excludedFolders={excluded} onChange={(paths, folders) => { setSelected(paths); setExcluded(folders); }} />;
}
