import { useTranslation as usePageTranslation } from "@/i18n";
import { describeError } from "@/api/errors";
import { useQuery } from "@tanstack/react-query";
import { grokBotApi } from "@/api/grokBot";
import { Link } from "@/lib/router";
/** Reports observed Paperclip activity; this is not a provider availability indicator. */
export function GrokBotWorkSummary({ companyId, agentId }: { companyId: string; agentId: string }) {
  const { t: pageText } = usePageTranslation("interface");
  const state = useQuery({ queryKey: ["grok-binding", companyId, agentId], queryFn: ({ signal }) => grokBotApi.connection(companyId, agentId, signal), refetchInterval: 10000 });
  const data = state.data, binding = data?.binding, routine = binding?.routine;
  return <div className="space-y-2 text-sm">
    {state.error && <p role="alert" className="text-destructive">{pageText("connectionStatusCouldNotBeRefreshed_1f0178") + " "}{describeError(state.error).body}</p>}
    <p>{data?.recoveryNeeded ? pageText("recoveryNeeded_7bdda4") : binding?.assignment?.status === "offered" ? pageText("awaitingAcknowledgement_c351a0") : binding?.assignment ? pageText("workingInGrokBot_7bcc2c") : routine?.verified ? pageText("noActivePaperclipWorkSession_456c0a") : pageText("connectionSetupIncomplete_e15885")}</p>
    {data?.currentTask && <Link className="underline" to={`/issues/${data.currentTask.id}`}>{data.currentTask.identifier}: {data.currentTask.title}</Link>}
    <p className="text-muted-foreground">{pageText("queuedTasks_af08a7") + " "}{data?.queuedTaskCount ?? pageText("checking_820d60")}</p>
    <p className="text-muted-foreground">{pageText("lastContact_d26908") + " "}{routine?.lastContactAt ? new Date(routine.lastContactAt).toLocaleString() : pageText("notObserved_60ac63")}</p>
    <p className="text-xs text-muted-foreground">{pageText("showsPaperclipReportedActivityOpenTheGrokBot_125480")}</p>
  </div>;
}
