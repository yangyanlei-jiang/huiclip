import { t as interfaceNotice } from "@/i18n";
import { t as translateDynamic } from "../../../i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import {
  GITHUB_REVIEW_EVENTS,
  type GitHubChatConfiguration,
  type GitHubReviewPolicy,
  type GitHubAllowedPerson,
} from "@paperclipai/shared";
import { accessApi } from "@/api/access";
import { chatEndpointsApi } from "@/api/chatEndpoints";
import { githubChatApi } from "@/api/githubChat";
import { useOptionalCompany } from "@/context/CompanyContext";
import { Button } from "@/components/ui/button";
import {
  AtSign,
  Check,
  Copy,
  HelpCircle,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitHubSettingsDisclosure } from "./GitHubSettingsDisclosure";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Link } from "@/lib/router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { describeError } from "@/api/errors";

export const githubSelectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const eventLabels = {
  opened: "New pull request",
  synchronize: "Updated commits",
  reopened: "Reopened",
  ready_for_review: "Ready for review",
  mention: "Mention",
  comment: "Follow-up comment",
};
function GitHubHelp({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={translateDynamic("dynamic:about", { value1: label })}
          className="inline-flex shrink-0 items-center text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          <HelpCircle className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{children}</TooltipContent>
    </Tooltip>
  );
}

export function GitHubToggle({
  label,
  description,
  help,
  checked,
  onChange,
  ariaLabel,
  disabled,
}: {
  label: string;
  description?: string;
  help?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="break-words text-sm font-medium">{label}</p>
          {help && <GitHubHelp label={label}>{help}</GitHubHelp>}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <ToggleSwitch
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
/** Keep separators while typing; the saved policy still contains normalized lists. */
function GitHubListInput({
  id,
  values,
  separator = "\n",
  onChange,
}: {
  id: string;
  values: string[];
  separator?: "\n" | ",";
  onChange: (values: string[]) => void;
}) {
  const joiner = separator === "," ? ", " : "\n";
  const [text, setText] = useState(values.join(joiner));
  const parse = (value: string) =>
    value
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);
  useEffect(() => {
    setText((current) =>
      JSON.stringify(parse(current)) === JSON.stringify(values)
        ? current
        : values.join(joiner),
    );
  }, [values, separator]);
  const props = {
    id,
    value: text,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setText(event.target.value);
      onChange(parse(event.target.value));
    },
  };
  return separator === "\n" ? <Textarea {...props} /> : <Input {...props} />;
}

function GitHubPassingScore({
  value,
  onChange,
  onValidityChange,
  text: controlledText,
  onTextChange,
}: {
  text?: string;
  onTextChange?: (text: string) => void;
  value: GitHubReviewPolicy["ratingThreshold"];
  onChange: (value: GitHubReviewPolicy["ratingThreshold"]) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const [localText, setLocalText] = useState(String(value ?? 5));
  const text = controlledText ?? localText;
  const setText = onTextChange ?? setLocalText;
  const number = Number(text);
  const valid = value === null || (text.trim() !== "" && Number.isInteger(number) && number >= 1 && number <= 5);
  useEffect(() => setLocalText(String(value ?? 5)), [value]);
  useEffect(() => { onValidityChange?.(valid); }, [valid, onValidityChange]);
  return (
    <div className="space-y-3 py-3">
      <Label htmlFor={id}>{pageText("passingScore_e5cdc3")}</Label>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Input id={id} type="number" min={1} max={5} step={1} required
            className="w-20" value={text} disabled={value === null}
            aria-invalid={!valid} aria-describedby={`${id}-help${valid ? "" : ` ${id}-error`}`}
            onChange={(event) => {
              const next = event.target.value;
              setText(next);
              const score = Number(next);
              if (next.trim() && Number.isInteger(score) && score >= 1 && score <= 5)
                onChange(score as 1 | 2 | 3 | 4 | 5);
            }} />
          <span className="text-sm text-muted-foreground">{pageText("outOf5_02113f")}</span>
        </div>
        <Label className="flex items-center gap-2 text-sm font-normal">
          <Checkbox aria-label={pageText("reportOnly_f08b1e")} checked={value === null}
            onCheckedChange={(checked) => { setText("5"); onChange(checked === true ? null : 5); }} />{pageText("reportOnly_f08b1e")}</Label>
      </div>
      {!valid && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{pageText("enterAWholeNumberFrom1To5_60798e")}</p>}
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        {value === null
          ? pageText("publishesANeutralCheckWithoutAScoreRequirement_d2a777")
          : pageText("paperclipPassesTheCheckWhenACompleteReview_472758")}
      </p>
      <p className="text-xs text-muted-foreground">{pageText("toBlockMergingRequireThe_9cf267") + " "}<strong>Paperclip Review</strong>{" " + pageText("checkFromThisAppInYourGitHubBranch_240808")}{" "}
        <a className="underline hover:text-foreground"
          href="https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository"
          target="_blank" rel="noreferrer">{pageText("configureOnGitHub_ce5a61")}</a>
      </p>
    </div>
  );
}

export function GitHubPolicyEditor({
  policy,
  onChange,
  accessHref,
  onValidityChange,
  scoreText,
  onScoreTextChange,
  rememberedAutomaticMode,
  readOnly = false,
}: {
  accessHref?: string;
  readOnly?: boolean;
  scoreText?: string;
  onScoreTextChange?: (text: string) => void;
  rememberedAutomaticMode?: "linked_authors" | "allowed_authors";
  policy: GitHubReviewPolicy;
  onChange: (policy: GitHubReviewPolicy) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const automaticMode = useRef<"linked_authors" | "allowed_authors">(
    "linked_authors",
  );
  if (policy.invocation !== "mentions_only")
    automaticMode.current = policy.invocation;
  const filterField = (
    key:
      | "includeAuthors"
      | "excludeAuthors"
      | "targetBranches"
      | "excludedBranches"
      | "requiredLabels"
      | "excludedLabels"
      | "ignoredPaths",
    label: string,
    help: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`${id}-github-${key}`}>{label}</Label>
      <GitHubListInput
        id={`${id}-github-${key}`}
        values={policy[key]}
        onChange={(values) => set(key, values)}
      />
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  );
  const [prompt, setPrompt] = useState<
    (typeof GITHUB_REVIEW_EVENTS)[number] | "issue_opened"
  >("opened");
  const set = <K extends keyof GitHubReviewPolicy>(
    key: K,
    value: GitHubReviewPolicy[K],
  ) => onChange({ ...policy, [key]: value });
  return (
    <div className="space-y-8">
      <section
        className="space-y-3"
        aria-labelledby={`${id}-github-instructions-heading`}
      >
        <h2
          id={`${id}-github-instructions-heading`}
          className="text-base font-semibold"
        >{pageText("instructions_ed58f2")}</h2>
        <MarkdownEditor
          readOnly={readOnly}
          ariaLabel={interfaceNotice("interface:agentInstructions_07101b")}
          contentClassName="min-h-32"
          value={policy.instructions}
          placeholder={pageText("whatShouldThisAgentDoOnGitHub_4ec56e")}
          onChange={(value) => set("instructions", value)}
        />
        <p className="text-xs text-muted-foreground">{pageText("includedInEveryGitHubTaskTypeToSelect_44efa3")}</p>
        <GitHubSettingsDisclosure title={pageText("eventSpecificInstructions_be77d8")}>
          <div className="grid gap-3 pt-3">
            <Label htmlFor={`${id}-github-prompt-event`} className="sr-only">{pageText("event_ad8919")}</Label>
            <select
              id={`${id}-github-prompt-event`}
              className={githubSelectClass}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value as typeof prompt)}
            >
              {GITHUB_REVIEW_EVENTS.map((event) => (
                <option key={event} value={event}>
                  {eventLabels[event]}
                </option>
              ))}
              <option value="issue_opened">{pageText("newIssue_051fba")}</option>
            </select>
            <MarkdownEditor
              key={prompt}
              readOnly={readOnly}
              ariaLabel={`${prompt === "issue_opened" ? "New issue" : eventLabels[prompt]} instructions`}
              contentClassName="min-h-32"
              value={
                prompt === "issue_opened"
                  ? (policy.issueOpenedInstructions ?? "")
                  : policy.prompts[prompt]
              }
              onChange={(value) =>
                prompt === "issue_opened"
                  ? set("issueOpenedInstructions", value)
                  : set("prompts", {
                      ...policy.prompts,
                      [prompt]: value,
                    })
              }
            />
            <p className="text-xs text-muted-foreground">{pageText("addedToTheMainInstructionsForThisEvent_1276ff")}</p>
          </div>
        </GitHubSettingsDisclosure>
      </section>
      <section
        className="space-y-3"
        aria-labelledby={`${id}-github-triggers-heading`}
      >
        <h2
          id={`${id}-github-triggers-heading`}
          className="text-base font-semibold"
        >{pageText("whenToRun_0926f6")}</h2>
        <div className="flex items-start gap-3 py-2">
          <AtSign className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{pageText("whenMentioned_e04822")}</p>
            <p className="text-xs text-muted-foreground">{pageText("authorizedPeopleCanAlwaysMentionThisBot_d9b481")}{" "}
              {accessHref && (
                <Link className="underline underline-offset-4" to={accessHref}>{pageText("managePeopleInAccess_9635aa")}</Link>
              )}
            </p>
          </div>
        </div>
        <GitHubToggle
          label={pageText("runAutomatically_c808aa")}
          description={pageText("startWorkWithoutAMentionWhenAnAllowed_b8abfc")}
          checked={policy.invocation !== "mentions_only"}
          onChange={(enabled) =>
            set("invocation", enabled ? (rememberedAutomaticMode ?? automaticMode.current) : "mentions_only")
          }
        />
        {policy.invocation !== "mentions_only" && (
          <div className="space-y-4">
            <div
              className="grid gap-x-6 gap-y-3 sm:grid-cols-2"
              aria-label={pageText("automaticEvents_db4e0b")}
            >
              {GITHUB_REVIEW_EVENTS.slice(0, 4).map((event) => (
                <Label
                  key={event}
                  className="flex cursor-pointer items-center gap-3 text-sm font-normal"
                >
                  <Checkbox
                    checked={policy.events.includes(event)}
                    onCheckedChange={(enabled) =>
                      set(
                        "events",
                        enabled === true
                          ? [...new Set([...policy.events, event])]
                          : policy.events.filter((value) => value !== event),
                      )
                    }
                  />
                  {eventLabels[event]}
                </Label>
              ))}
              <Label className="flex cursor-pointer items-center gap-3 text-sm font-normal">
                <Checkbox
                  checked={policy.issueOpened === true}
                  onCheckedChange={(enabled) =>
                    set("issueOpened", enabled === true)
                  }
                />{pageText("newIssues_79760f")}</Label>
            </div>
            <p className="text-xs text-muted-foreground">{pageText("runsForAuthorizedAuthorsInAccessUseThe_0e8f2b")}</p>
            <GitHubSettingsDisclosure title={pageText("automaticReviewFilters_a75be1")}>
              <div>
                <GitHubToggle
                  label={pageText("includeDraftPRs_1d89ae")}
                  checked={policy.reviewDrafts}
                  onChange={(value) => set("reviewDrafts", value)}
                />
                <GitHubToggle
                  label={pageText("includeBotAuthors_50e84f")}
                  description={pageText("theAccountAlsoNeedsASponsorAndExternal_8764a8")}
                  checked={policy.reviewBotAuthors}
                  onChange={(value) => set("reviewBotAuthors", value)}
                />
              </div>
              <GitHubSettingsDisclosure title={pageText("authors_d2a525")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filterField(
                    "includeAuthors",
                    "Included authors",
                    "Leave empty for all authorized authors. One username or glob per line.",
                  )}
                  {filterField(
                    "excludeAuthors",
                    "Excluded authors",
                    "One username or glob per line.",
                  )}
                </div>
              </GitHubSettingsDisclosure>
              <GitHubSettingsDisclosure title={pageText("branches_f57822")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filterField(
                    "targetBranches",
                    "Target branches",
                    "Leave empty for all branches. Supports * and **.",
                  )}
                  {filterField(
                    "excludedBranches",
                    "Excluded branches",
                    "Supports * and **.",
                  )}
                </div>
              </GitHubSettingsDisclosure>
              <GitHubSettingsDisclosure title={pageText("labels_222898")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filterField(
                    "requiredLabels",
                    "Required labels",
                    "All listed labels must be present.",
                  )}
                  {filterField(
                    "excludedLabels",
                    "Excluded labels",
                    "Any listed label prevents automatic review.",
                  )}
                </div>
              </GitHubSettingsDisclosure>
              <p className="text-xs text-muted-foreground">{pageText("reviewsRequestedByMentionBypassTheseSchedulingFilters_51ebb2")}</p>
            </GitHubSettingsDisclosure>
          </div>
        )}
      </section>
      <section
        className="space-y-3"
        aria-labelledby={`${id}-github-results-heading`}
      >
        <h2
          id={`${id}-github-results-heading`}
          className="text-base font-semibold"
        >{pageText("reviewResults_0a1f1c")}</h2>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <GitHubToggle
            label={pageText("postAReviewSummary_79aa28")}
            checked={policy.publishSummary}
            onChange={(value) => set("publishSummary", value)}
          />
          <GitHubToggle
            label={pageText("postInlineFindings_8e99c0")}
            checked={policy.publishInline}
            onChange={(value) => set("publishInline", value)}
          />
        </div>
        <GitHubPassingScore value={policy.ratingThreshold} text={scoreText} onTextChange={onScoreTextChange}
          onChange={(value) => set("ratingThreshold", value)} onValidityChange={onValidityChange} />
      </section>
      <div className="divide-y divide-border">
        <GitHubSettingsDisclosure title={pageText("ignoredFiles_14c879")}>
          {filterField(
            "ignoredPaths",
            "File patterns",
            "Excluded from all reviews, including @mentions. One pattern per line; supports * and **.",
          )}
        </GitHubSettingsDisclosure>
        <GitHubSettingsDisclosure title={pageText("inlineCommentOptions_beab8c")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${id}-github-categories`}>{pageText("findingCategories_6dfb83")}</Label>
              <GitHubListInput
                id={`${id}-github-categories`}
                values={policy.findingCategories}
                separator=","
                onChange={(values) => set("findingCategories", values)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-github-severity`}>{pageText("minimumInlineSeverity_fe7159")}</Label>
              <select
                id={`${id}-github-severity`}
                className={githubSelectClass}
                value={policy.minimumCommentSeverity}
                onChange={(e) =>
                  set(
                    "minimumCommentSeverity",
                    e.target
                      .value as GitHubReviewPolicy["minimumCommentSeverity"],
                  )
                }
              >
                <option value="info">{pageText("info_4b631f")}</option>
                <option value="warning">{pageText("warning_e9c455")}</option>
                <option value="error">{pageText("error_7f2f6a")}</option>
              </select>
              <p className="text-xs text-muted-foreground">{pageText("hiddenFindingsStillCountInTheAssessment_174603")}</p>
            </div>
          </div>
        </GitHubSettingsDisclosure>
        <GitHubSettingsDisclosure title={pageText("approvalsAndChangeRequests_a61b33")}>
          <p className="text-xs text-muted-foreground">{pageText("optionalFormalDecisionsOnGitHubScoresCommentsAnd_47141d")}</p>
          <div>
            <GitHubToggle
              label={pageText("allowApprovals_75f8a1")}
              help="Lets the agent submit an Approve review on GitHub after a complete assessment. The agent must explicitly choose it; a 5/5 score or passing check does not approve the PR. Off still allows scores, comments, and checks."
              checked={policy.allowApprove}
              onChange={(value) => set("allowApprove", value)}
            />
            <GitHubToggle
              label={pageText("allowRequestChanges_4fe5f2")}
              help="Lets the agent submit a Request changes review on GitHub after a complete assessment. This is a formal review decision and may prevent merging under your repository rules. Off still allows findings, comments, and a failing check."
              checked={policy.allowRequestChanges}
              onChange={(value) => set("allowRequestChanges", value)}
            />
          </div>
        </GitHubSettingsDisclosure>
      </div>
    </div>
  );
}

export function GitHubAccessEditor({
  endpointId,
  companyId,
  configuration,
  onChange,
}: {
  endpointId: string;
  companyId: string;
  configuration: GitHubChatConfiguration;
  onChange: (configuration: GitHubChatConfiguration) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const company = useOptionalCompany()?.companies.find((item) => item.id === companyId);
  const accountLink = useRef<HTMLAnchorElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [dialog, setDialog] = useState<"member" | "guest" | null>(null);
  const members = useQuery({
    queryKey: ["github-members", companyId],
    queryFn: () => accessApi.listMembers(companyId),
  });
  const links = useQuery({
    queryKey: ["github-linked-members", endpointId],
    queryFn: () => chatEndpointsApi.listPrincipals(endpointId),
  });
  const membersView = useQueryView(members);
  const linksView = useQueryView(links);
  const linksLoaded = linksView.kind === "ready" || linksView.kind === "stale";
  const [login, setLogin] = useState("");
  const [sponsor, setSponsor] = useState(configuration.responsibleUserId);
  const [candidate, setCandidate] = useState<{
    githubUserId: string;
    login: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [busy, setBusy] = useState(false);
  const activeMembers = (members.data?.members ?? []).filter(
    (member) =>
      member.status === "active" && member.membershipRole !== "viewer",
  );
  const linkedAccounts = (links.data ?? []).filter(
    (link) => link.status === "linked",
  );
  const responsible = activeMembers.find(
    (member) => member.principalId === configuration.responsibleUserId,
  );
  const memberName = (userId: string) =>
    activeMembers.find((member) => member.principalId === userId)?.user?.name ??
    userId;
  const automatic = configuration.defaults.invocation !== "mentions_only";
  const guestsAutomatic =
    configuration.defaults.invocation === "allowed_authors";
  const guests = configuration.people.filter(
    (person) => person.kind === "guest",
  );
  // Preserve configured members whose identity link was revoked; show why they cannot run.
  const memberRows = [
    ...configuration.people.filter((person) => person.kind === "member"),
    ...linkedAccounts
      .filter(
        (link) =>
          link.githubUserId &&
          link.paperclipUserId &&
          !configuration.people.some(
            (person) => person.githubUserId === link.githubUserId,
          ),
      )
      .map((link): GitHubAllowedPerson => ({
        kind: "member",
        userId: link.paperclipUserId!,
        githubUserId: link.githubUserId!,
        login: link.githubLogin ?? link.externalLabel,
      })),
  ];
  const updatePerson = (person: GitHubAllowedPerson) =>
    onChange({
      ...configuration,
      people: configuration.people.some(
        (p) => p.githubUserId === person.githubUserId,
      )
        ? configuration.people.map((p) =>
            p.githubUserId === person.githubUserId ? person : p,
          )
        : [...configuration.people, person],
    });
  const removePerson = (person: GitHubAllowedPerson) =>
    onChange({
      ...configuration,
      people: configuration.people.filter(
        (p) => p.githubUserId !== person.githubUserId,
      ),
    });
  const unlink = async (principalId: string) => {
    setBusy(true);
    setError("");
    try {
      await chatEndpointsApi.revokeLink(endpointId, principalId);
      await links.refetch();
    } catch (e) {
      setError(
        describeError(e).body,
      );
    } finally {
      setBusy(false);
    }
  };
  const peopleRows = (people: GitHubAllowedPerson[]) => (
    <div className="divide-y divide-border">
      {people.map((person) => {
        const identity = linkedAccounts.find(
          (link) => link.githubUserId === person.githubUserId,
        );
        const linked = person.kind === "guest" || Boolean(identity);
        const explicit = configuration.people.some(
          (p) => p.githubUserId === person.githubUserId,
        );
        const mentions =
          person.kind === "guest" ||
          configuration.memberAccess === "all_linked" ||
          explicit;
        const removable = explicit && (person.kind === "guest" || configuration.memberAccess === "selected");
        return (
          <div
            key={person.githubUserId}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4"
          >
            <div className="min-w-0 flex-1 basis-32">
              <p className="break-words text-sm font-medium">@{person.login}</p>
              <p className="text-xs text-muted-foreground">
                {person.kind === "guest"
                  ? `Sponsored by ${memberName(person.sponsorUserId)}`
                  : (identity?.paperclipUserLabel ?? pageText("companyMember_069970"))}
              </p>
              {!linked && (
                <p className="mt-1 text-xs text-destructive">{pageText("githubAccountNeedsLinking_e93212")}</p>
              )}
            </div>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">{pageText("mentions_85e12b")}</span>
                {person.kind === "guest" ||
                configuration.memberAccess === "all_linked" ? (
                  <span
                    className="flex h-5 items-center gap-1 text-xs"
                    aria-label={`Mentions ${linked ? "allowed" : "unavailable"} for @${person.login}`}
                  >
                    {linked && (
                      <Check className="size-3.5 text-muted-foreground" />
                    )}
                    {linked ? pageText("allowed_77c7b4") : pageText("unlinked_86998a")}
                  </span>
                ) : (
                  <ToggleSwitch
                    aria-label={`Allow mentions from @${person.login}`}
                    checked={mentions}
                    disabled={!linked}
                    onCheckedChange={(enabled) =>
                      enabled ? updatePerson(person) : removePerson(person)
                    }
                  />
                )}
              </div>
              {(identity || removable) && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Manage @${person.login}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {removable && (
                    <DropdownMenuItem onClick={() => removePerson(person)}>{pageText("removeAccess_a13a95")}</DropdownMenuItem>
                  )}
                  {identity && (
                    <DropdownMenuItem
                      disabled={busy}
                      onClick={() => void unlink(identity.principalId)}
                    >{pageText("unlinkGitHubAccount_4c064e")}</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>}
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <section className="space-y-6" aria-label={pageText("people_b37554")}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{pageText("people_b37554")}</h2>
        <p className="text-sm text-muted-foreground">{pageText("chooseWhoCanMentionThisBotAndWhose_6f5045")}</p>
      </div>
      <section className="space-y-2" aria-label={pageText("companyMembers_f47cd5")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{pageText("companyMembers_f47cd5")}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDialog("member");
              setLinkCopied(false);
              setError("");
            }}
          >
            <Plus className="size-4" />{pageText("linkAMember_b5a2c4")}</Button>
        </div>
        <GitHubToggle
          label={pageText("allowMentionsFromAllLinkedMembers_954e7f")}
          description={
            configuration.memberAccess === "all_linked"
              ? `Includes members from ${company?.name ?? "this company"} who link their GitHub account later.`
              : pageText("onlyMembersYouEnableBelowCanMentionThis_bdc34b")
          }
          checked={configuration.memberAccess === "all_linked"}
          onChange={(enabled) =>
            onChange({
              ...configuration,
              memberAccess: enabled ? "all_linked" : "selected",
            })
          }
        />
        {peopleRows(memberRows)}
        {(links.isPending || linksView.kind === "reconnecting") && (
          <p role="status" className="py-4 text-sm text-muted-foreground">{pageText("loadingLinkedAccounts_ca37ce")}</p>
        )}
        {linksLoaded && memberRows.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">{pageText("noMembersLinkedYetLinkAnAccountTo_1a5f90")}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {automatic ? (
            <>{pageText("automaticRunsUseTheEventsAndAuthorFilters_de1b43")}{" "}
              <Link
                className="underline underline-offset-4"
                to={`/apps/chat/${endpointId}/settings`}
              >{translateUi("interfaceCopy.settings")}</Link>
              .
            </>
          ) : (
            <>{pageText("automaticRunsAreOffIn_8ca91f")}{" "}
              <Link
                className="underline underline-offset-4"
                to={`/apps/chat/${endpointId}/settings`}
              >{translateUi("interfaceCopy.settings")}</Link>{pageText("authorizedMentionsStillWork_32cc2f")}</>
          )}
        </p>
      </section>
      <section
        className="space-y-2 border-t border-border pt-6"
        aria-label={pageText("externalContributors_6fe128")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{pageText("externalContributors_6fe128")}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDialog("guest");
              setLookupError("");
            }}
          >
            <Plus className="size-4" />{pageText("addExternalContributor_b3a010")}</Button>
        </div>
        <p className="text-xs text-muted-foreground">{pageText("allowSpecificGitHubUsersWithAMemberAs_c5df5d")}</p>
        {peopleRows(guests)}
        {guests.length > 0 && (
          <GitHubToggle
            label={pageText("allowAutomaticRunsForExternalContributors_082a70")}
            description={
              automatic
                ? pageText("authorizedContributorsCanTriggerTheEventsAndAuthor_d03a08")
                : pageText("turnOnAutomaticRunsInSettingsFirstMentions_23ce80")
            }
            checked={guestsAutomatic}
            disabled={!automatic}
            onChange={(enabled) =>
              onChange({
                ...configuration,
                defaults: {
                  ...configuration.defaults,
                  invocation: enabled ? "allowed_authors" : "linked_authors",
                },
              })
            }
          />
        )}
      </section>
      <GitHubSettingsDisclosure title={pageText("automaticTaskResponsibility_743c44")}>
        <div className="space-y-2">
          {activeMembers.length === 1 && responsible ? (
            <p className="text-sm">{pageText("responsibleMember_5815de") + " "}{memberName(configuration.responsibleUserId)}
            </p>
          ) : (
            <>
              <Label htmlFor="github-responsible">{pageText("responsibleMember_1c73f2")}</Label>
              <select
                id="github-responsible"
                className={githubSelectClass}
                value={configuration.responsibleUserId}
                onChange={(e) =>
                  onChange({
                    ...configuration,
                    responsibleUserId: e.target.value,
                  })
                }
              >
                {!responsible && (
                  <option value={configuration.responsibleUserId}>
                    {configuration.responsibleUserId || pageText("selectAMember_6d5936")}
                  </option>
                )}
                {activeMembers.map((member) => (
                  <option key={member.principalId} value={member.principalId}>
                    {member.user?.name ??
                      member.user?.email ??
                      member.principalId}
                  </option>
                ))}
              </select>
            </>
          )}
          <p className="text-xs text-muted-foreground">{pageText("theMemberAccountableForAutomaticallyCreatedPaperclipTasks_39a84c")}</p>
        </div>
      </GitHubSettingsDisclosure>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {(membersView.kind === "error" || linksView.kind === "error") && (
        <QueryErrorState
          error={membersView.kind === "error" ? members.error : links.error}
          action="load members and linked accounts"
          onRetry={() => {
            membersView.retry();
            linksView.retry();
          }}
          retrying={members.isFetching || links.isFetching}
        />
      )}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "member"
                ? pageText("linkACompanyMember_2427af")
                : pageText("addExternalContributor_b3a010")}
            </DialogTitle>
            <DialogDescription>
              {dialog === "member"
                ? pageText("eachMemberConfirmsTheirOwnGitHubIdentityShare_fc9945")
                : pageText("allowAGitHubUserToMentionThisBot_5b4102")}
            </DialogDescription>
          </DialogHeader>
          {dialog === "member" ? (
            <>
              <Button
                variant="outline"
                aria-label={pageText("copyAccountLinkingURL_6f748a")}
                onClick={() => {
                  if (accountLink.current)
                    void copyTextToClipboard(accountLink.current.href).then(
                      () => setLinkCopied(true),
                      () =>
                        setError(
                          interfaceNotice("interface:couldNotCopyTheLinkOpenAccountLinking_7d723c"),
                        ),
                    );
                }}
              >
                <Copy className="size-4" />
                {linkCopied ? pageText("copied_8e3df4") : pageText("copyInvitationLink_ef359b")}
              </Button>
              <Link
                ref={accountLink}
                to={`/apps/chat/connect?provider=github&resume=${endpointId}&stage=identity`}
                className="text-sm underline underline-offset-4"
              >{pageText("linkYourAccount_761fce")}</Link>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="github-guest-login">{pageText("githubUsername_7658eb")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="github-guest-login"
                    value={login}
                    placeholder="octocat"
                    disabled={busy}
                    onChange={(e) => {
                      setLogin(e.target.value);
                      setCandidate(null);
                      setLookupError("");
                    }}
                  />
                  <Button
                    variant="outline"
                    disabled={busy || !login.trim()}
                    onClick={async () => {
                      setBusy(true);
                      setLookupError("");
                      setCandidate(null);
                      try {
                        setCandidate(
                          await githubChatApi.lookup(endpointId, login),
                        );
                      } catch (e) {
                        setLookupError(
                          describeError(e).body,
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? pageText("lookingUp_27d9ea") : pageText("lookUp_6d7049")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-guest-sponsor">{pageText("sponsor_fd0b74")}</Label>
                <select
                  id="github-guest-sponsor"
                  className={githubSelectClass}
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                >
                  {!activeMembers.some(
                    (member) => member.principalId === sponsor,
                  ) && <option value={sponsor}>{pageText("selectAMember_6d5936")}</option>}
                  {activeMembers.map((member) => (
                    <option key={member.principalId} value={member.principalId}>
                      {member.user?.name ?? member.principalId}
                    </option>
                  ))}
                </select>
              </div>
              {candidate && (
                <p role="status" className="text-sm">
                  {configuration.people.some(
                    (p) => p.githubUserId === candidate.githubUserId,
                  ) ||
                  linkedAccounts.some(
                    (link) => link.githubUserId === candidate.githubUserId,
                  )
                    ? `@${candidate.login} is already listed in People.`
                    : `Found @${candidate.login}. They will be able to mention the bot after you save.`}
                </p>
              )}
              {lookupError && (
                <p role="alert" className="text-sm text-destructive">
                  {lookupError}
                </p>
              )}
              <DialogFooter className="flex-row justify-between sm:justify-between">
                <Button variant="ghost" onClick={() => setDialog(null)}>{translateUi("interfaceCopy.cancel")}</Button>
                <Button
                  disabled={
                    !candidate ||
                    !activeMembers.some(
                      (member) => member.principalId === sponsor,
                    ) ||
                    configuration.people.some(
                      (p) => p.githubUserId === candidate.githubUserId,
                    ) ||
                    linkedAccounts.some(
                      (link) => link.githubUserId === candidate.githubUserId,
                    )
                  }
                  onClick={() => {
                    if (candidate) {
                      updatePerson({
                        ...candidate,
                        kind: "guest",
                        sponsorUserId: sponsor,
                        permissionProfile: "restricted",
                      });
                      setDialog(null);
                      setCandidate(null);
                      setLogin("");
                    }
                  }}
                >{pageText("addContributor_6b3fac")}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
