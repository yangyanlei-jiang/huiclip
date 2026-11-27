import { ONBOARDING_FIRST_TASK_ORIGIN_KIND, type Goal, type Issue, type Project } from "@paperclipai/shared";

export const ONBOARDING_PROJECT_NAME = "Onboarding";
const CHINESE_ONBOARDING_PROJECT_NAME = "新手引导";
const DEFAULT_ONBOARDING_TITLE = "Paperclip onboarding";

export function onboardingTaskTitle(locale?: string) {
  return locale === "zh-CN" ? "Paperclip 新手引导" : DEFAULT_ONBOARDING_TITLE;
}

/** Display the legacy generated title in the chosen language without editing the task. */
export function displayOnboardingTaskTitle(
  issue: Pick<Issue, "title" | "originKind">,
  locale?: string,
) {
  if (issue.originKind === ONBOARDING_FIRST_TASK_ORIGIN_KIND
      && (issue.title === DEFAULT_ONBOARDING_TITLE || issue.title === onboardingTaskTitle("zh-CN"))) {
    return onboardingTaskTitle(locale);
  }
  return issue.title;
}

function goalCreatedAt(goal: Goal) {
  const createdAt = goal.createdAt instanceof Date ? goal.createdAt : new Date(goal.createdAt);
  return Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getTime();
}

function pickEarliestGoal(goals: Goal[]) {
  return [...goals].sort((a, b) => goalCreatedAt(a) - goalCreatedAt(b))[0] ?? null;
}

export function selectDefaultCompanyGoalId(goals: Goal[]): string | null {
  const companyGoals = goals.filter((goal) => goal.level === "company");
  const rootGoals = companyGoals.filter((goal) => !goal.parentId);
  const activeRootGoals = rootGoals.filter((goal) => goal.status === "active");

  return (
    pickEarliestGoal(activeRootGoals)?.id ??
    pickEarliestGoal(rootGoals)?.id ??
    pickEarliestGoal(companyGoals)?.id ??
    null
  );
}

export function buildOnboardingProjectPayload(goalId: string | null, locale?: string) {
  return {
    name: locale === "zh-CN" ? CHINESE_ONBOARDING_PROJECT_NAME : ONBOARDING_PROJECT_NAME,
    status: "in_progress" as const,
    ...(goalId ? { goalIds: [goalId] } : {}),
  };
}

export function selectReusableOnboardingProject<T extends Pick<Project, "name" | "status">>(
  projects: T[],
): T | null {
  return (
    projects.find(
      (project) =>
        project.status !== "cancelled" &&
        [ONBOARDING_PROJECT_NAME.toLowerCase(), CHINESE_ONBOARDING_PROJECT_NAME]
          .includes(project.name.trim().toLowerCase()),
    ) ?? null
  );
}

export function buildOnboardingIssuePayload(input: {
  title: string;
  assigneeAgentId: string;
  projectId: string;
  goalId: string | null;
}) {
  const title = input.title.trim();

  return {
    title,
    // No client description: the server assembles the first task's brief from
    // its own markdown and ignores any description sent here.
    assigneeAgentId: input.assigneeAgentId,
    projectId: input.projectId,
    ...(input.goalId ? { goalId: input.goalId } : {}),
    status: "todo" as const,
    // Marks the single onboarding first task so the server assembles + stores
    // the brief, seeds the agent greeting, and the task-detail view suppresses
    // the seeded-description bubble.
    onboardingFirstTask: true,
  };
}
