import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { describeError } from "@/api/errors";
import { ShieldCheck, ShieldX, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export interface ProjectAccessNoticeProps {
  agentName?: string;
  projectName?: string;
  ready: boolean;
  canManage: boolean;
  canRetry: boolean;
  onManage: () => void;
  onRetry: () => void;
  error?: Error | null;
  className?: string;
}

export function ProjectAccessNotice({ agentName = "This agent", projectName, ready, canManage, canRetry, onManage, onRetry, error, className }: ProjectAccessNoticeProps) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  return <section role={ready ? "status" : "alert"} aria-label={pageText("projectAccess_5cfa55")} className={cn("space-y-4 rounded-lg border border-border p-4", className)}>
    <div className="flex items-start gap-3">
      {ready ? <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden /> : <ShieldX className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />}
      <div className="min-w-0 space-y-2">
        <h3 className="text-sm font-semibold">{ready ? pageText("projectAccessIsReady_7ba4ec") : `${agentName} can’t access this project`}</h3>
        <p className="text-sm text-muted-foreground">{ready
          ? pageText("theAgentCanNowAccessTheRequiredProject_efb10a")
          : `This task needs ${projectName ?? "a project"} outside the agent’s allowed projects. The agent hasn’t started. Your message is saved.`}</p>
        {!ready && !canManage && <p className="text-sm text-muted-foreground">{pageText("aPersonWithAgentManagementPermissionCanAdd_6927a1")}</p>}
      </div>
    </div>
    <div className="flex flex-wrap gap-2 pl-8">
      {ready ? canRetry && <Button size="sm" onClick={onRetry}>{pageText("retryTask_1c8f1b")}<ArrowRight className="size-4" aria-hidden /></Button>
        : <Button size="sm" variant="outline" onClick={onManage}>{canManage ? pageText("manageProjectAccess_cabc9f") : pageText("viewAgentAccess_3024c4")}<ArrowRight className="size-4" aria-hidden /></Button>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{describeError(error).body}</p>}
    {!ready && <details className="pl-8 text-xs text-muted-foreground"><summary className="cursor-pointer">{pageText("runDetails_e6487c")}</summary>
      <dl className="mt-3 grid grid-cols-2 gap-2"><dt>{pageText("stoppedDuring_81b770")}</dt><dd>{pageText("workspaceSetup_a806bb")}</dd><dt>{translateUi("interfaceCopy.reason")}</dt><dd>{pageText("projectOutsideAllowedScope_d5bfad")}</dd><dt>{pageText("providerStarted_34fee1")}</dt><dd>{pageText("no_816c52")}</dd></dl>
    </details>}
  </section>;
}
