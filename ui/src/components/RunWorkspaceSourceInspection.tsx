import { useTranslation as usePageTranslation } from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { ENVIRONMENT_LEASE_POLICIES, WORKSPACE_SOURCE_VERIFICATION_REASONS } from "@paperclipai/shared";
import { issuesApi } from "../api/issues";
import { Button } from "./ui/button";
import { formatDateTime } from "../lib/utils";
import { WorkspaceExportRecovery } from "./WorkspaceExportRecovery";

function recordedFailure(evidence: Record<string, unknown>): string {
  const recovery = evidence.systemRecovery;
  if (!recovery || typeof recovery !== "object" || !("failure" in recovery)) return "No recorded system recovery failure.";
  const failure = recovery.failure;
  if (!failure || typeof failure !== "object" || !("code" in failure) || typeof failure.code !== "string")
    return "No recorded system recovery failure.";
  const detail = "sourceVerification" in failure ? failure.sourceVerification : null;
  if (!detail || typeof detail !== "object" || !("reason" in detail) || typeof detail.reason !== "string" ||
    !(WORKSPACE_SOURCE_VERIFICATION_REASONS as readonly string[]).includes(detail.reason)) return failure.code;
  const policy = "observedLeasePolicy" in detail ? detail.observedLeasePolicy : null;
  const allowedPolicy = typeof policy === "string" &&
    (policy === "unrecognized" || (ENVIRONMENT_LEASE_POLICIES as readonly string[]).includes(policy));
  return [failure.code, detail.reason, ...(allowedPolicy ? [`lease policy ${policy}`] : [])].join(" · ");
}

export function RunWorkspaceSourceInspection({ issueId, runId, companyId }: { issueId: string; runId: string; companyId: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const listing = useMutation({ mutationFn: () => issuesApi.recoveryActions(issueId, { runId }) });
  const inspection = useMutation({ mutationFn: (actionId: string) => issuesApi.recoveryActions(issueId, { runId, actionId }) });
  const pending = listing.isPending || inspection.isPending;
  const error = listing.error ?? inspection.error;
  const current = inspection.data?.sourceInspection;
  return (
    <div className="space-y-2" data-testid="run-workspace-source-inspection">
      <Button variant="outline" size="sm" disabled={pending} onClick={() => { inspection.reset(); listing.mutate(); }}>
        {pending ? pageText("inspectingRecovery_beca40") : pageText("inspectRecovery_02f9f7")}
      </Button>
      {error ? <p role="alert" className="text-xs text-destructive">
        {error instanceof Error ? error.message : pageText("recoveryInspectionFailedTryInspectingAgain_d72ee4")}
      </p> : null}
      {listing.data?.actions.length === 0 ? <p className="text-xs text-muted-foreground">{pageText("noRecordedRecoveryActionForThisRun_894b39")}</p> : null}
      {listing.data?.actions.map(action => (
        <div key={action.id} className="space-y-2 text-xs">
          <p>{pageText("recordedFailure_402896") + " "}<code className="font-mono">{recordedFailure(action.evidence)}</code></p>
          <p className="font-mono text-muted-foreground">{action.id} · {action.status}</p>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => inspection.mutate(action.id)}>{pageText("inspectCurrentSource_24b582")}</Button>
          {action.evidence.runId === runId ? <WorkspaceExportRecovery action={action}
            issueId={issueId} companyId={companyId} showStatus={false} /> : null}
        </div>
      ))}
      {current ? <div className="space-y-2 text-xs" role="status">
        <p className="font-medium">{pageText("currentRecordedSourceIdentity_5a2973")}</p>
        <p className="font-mono text-muted-foreground">{pageText("action_97c89a") + " "}{current.actionId}</p>
        <p className="text-muted-foreground">{pageText("thisReadOnlyObservationChecksRecordedIdentityIt_3d04a0")}</p>
        {current.status === "verified" ? <p>{pageText("recordedSourceIdentityVerified_230b55")}</p>
          : current.status === "not_inspected" ? <p>{pageText("sourceNotInspectedThisRecordExceedsTheInspection_d6dba2")}</p>
          : <p>{pageText("blocked_3111b3") + " "}<code className="font-mono">{current.sourceVerification?.reason ?? current.failureCode}</code>
            {current.sourceVerification?.observedLeasePolicy ? <>{" " + pageText("leasePolicy_67bf7a") + " "}<code className="font-mono">{current.sourceVerification.observedLeasePolicy}</code></> : null}</p>}
        <p className="font-mono text-muted-foreground">{pageText("observed_2e159b") + " "}{formatDateTime(current.observedAt)}</p>
      </div> : null}
    </div>
  );
}
