import { useTranslation as usePageTranslation } from "@/i18n";
import { AlertTriangle } from "lucide-react";
export function EmailSafetyNotice() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div
      role="note"
      className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 shrink-0 text-(--status-agent-paused)" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{pageText("anyoneCanEmailAnUnrestrictedInbox_f0bfce")}</p>
          <p className="text-sm text-muted-foreground">{pageText("incomingEmailCanCreateTasksAndTriggerAgent_417353")}</p>
          <p className="text-xs text-muted-foreground">{pageText("paperclipDoesNotVerifySenderRestrictionsAgentMailControls_8c412c")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <a
          href="https://console.agentmail.to"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >{pageText("openAgentMail_262452")}</a>
        <a
          href="https://docs.agentmail.to/knowledge-base/allowlists-blocklists"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground underline underline-offset-4"
        >{pageText("setUpAllowlists_f00ce4")}</a>
      </div>
    </div>
  );
}
