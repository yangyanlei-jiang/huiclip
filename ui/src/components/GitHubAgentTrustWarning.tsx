import { useTranslation as usePageTranslation } from "@/i18n";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { AgentPermissions } from "@paperclipai/shared";
import { getTrustPreset } from "@/lib/trust-policy-ui";
import { Button } from "@/components/ui/button";

export const LOW_TRUST_AGENT_GUIDE =
  "https://docs.paperclip.ing/administration/trust-and-low-trust-review/";

export function GitHubAgentTrustWarning({
  agent,
  onChangeToLowTrust,
  disabled,
}: {
  agent:
    { name: string; permissions: Partial<AgentPermissions> } | null | undefined;
  onChangeToLowTrust?: () => void;
  disabled?: boolean;
}) {
  const { t: pageText } = usePageTranslation("interface");
  if (!agent || getTrustPreset(agent.permissions) === "low_trust_review")
    return null;
  return (
    <div
      role="alert"
      className="space-y-2 rounded-lg border border-(--status-task-todo)/30 bg-(--status-task-todo)/10 p-4 text-sm"
    >
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="size-4 shrink-0" />
        {agent.name}{" " + pageText("isNotConfiguredForLowTrustReview_658b15")}</p>
      <p>{pageText("githubCommentsAndPullRequestsCanContainMalicious_2889b2")}</p>
      <p className="text-xs text-muted-foreground">{pageText("continuingKeepsThisAgentSCurrentPermissionsA_c9e0eb")}</p>
      {onChangeToLowTrust && (
        <Button variant="outline" className="h-auto whitespace-normal" disabled={disabled} onClick={onChangeToLowTrust}>{pageText("change_64fbd9") + " "}{agent.name}{" " + pageText("toALowTrustAgent_7e37fe")}</Button>
      )}
      <a
        className="inline-flex items-center gap-1 underline underline-offset-4"
        href={LOW_TRUST_AGENT_GUIDE}
        target="_blank"
        rel="noreferrer"
      >{pageText("learnAboutLowTrustAgents_a702af")}<ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
