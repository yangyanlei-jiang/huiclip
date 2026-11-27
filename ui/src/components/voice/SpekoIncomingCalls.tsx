import { useTranslation as usePageTranslation } from "@/i18n";
import { useQueryView } from "@/components/QueryView";
import { describeError } from "@/api/errors";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { VoiceInboundCall } from "@paperclipai/shared";
import { voicePhoneApi } from "@/api/voicePhone";
import { issuesApi } from "@/api/issues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export interface SpekoIncomingCallCardProps { call: VoiceInboundCall; tasks?: {id: string; label: string}[]; busy?: boolean; error?: string; onDecide(input: {approve: boolean; approvalCode: string; issueId?: string}): void }
export function SpekoIncomingCallCard({call, tasks = [], busy, error, onDecide}: SpekoIncomingCallCardProps) {
  const { t: pageText } = usePageTranslation("interface");
  const [code, setCode] = useState(""), [issueId, setIssueId] = useState(""), [invalid, setInvalid] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = ["guest_intake", "awaiting_approval", "approving"].includes(call.state);
  useEffect(() => { if (!pending) heading.current?.focus(); }, [pending]);
  if (call.state === "guest_intake") return <section className="max-w-xl space-y-3 rounded-md border border-border p-3" aria-label={pageText("incomingConversation_800e30")}>
    <h3 className="text-sm font-semibold">{pageText("incomingConversation_800e30")}</h3>
    {call.intakeIssueId && <Link className="text-sm text-primary underline" to={`/issues/${call.intakeIssueId}`}>{pageText("openConversationTask_974d55")}</Link>}
    <p className="text-sm text-muted-foreground">{pageText("thisCallerIsTalkingToTheAgentIn_60f9ba")}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button variant="outline" disabled={busy} onClick={() => onDecide({approve: false, approvalCode: call.approvalCode})}>{pageText("endCall_c8de76")}</Button>
  </section>;
  return <section className="max-w-xl space-y-3 rounded-md border border-border p-3" aria-label={pageText("incomingCallApproval_427bb5")}>
    <h3 ref={heading} tabIndex={-1} className="text-sm font-semibold">{call.state === "approved" ? pageText("callApproved_8249c1") : call.state === "denied" ? pageText("callDenied_56c417") : call.state === "expired" ? pageText("callExpired_18436c") : call.state === "ended" ? pageText("callerHungUp_c698c7") : pageText("incomingCallAwaitingApproval_8057d0")}</h3>
    {call.intakeIssueId && <Link className="text-sm text-primary underline" to={`/issues/${encodeURIComponent(call.intakeIssueId)}`}>{pageText("reviewPhoneIntake_ea83c1")}</Link>}
    {pending ? <form className="space-y-3" onSubmit={event => {event.preventDefault(); if (code !== call.approvalCode) {setInvalid(true); return;} setInvalid(false); onDecide({approve: true, approvalCode: code, ...(issueId ? {issueId} : {})});}}>
      <p className="text-sm text-muted-foreground">{pageText("approveOnlyTheCallYouAreCurrentlyOn_7ad4e0")}</p>
      <label className="grid gap-2 text-sm font-medium">{pageText("codeSpokenOnYourCall_ac3047")}<Input inputMode="numeric" autoComplete="off" maxLength={6} value={code} disabled={busy} aria-invalid={invalid} onChange={event => {setCode(event.target.value); setInvalid(false);}} /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">{pageText("conversationTask_3204e3")}<select aria-label={pageText("conversationTask_3204e3")} className="w-full min-w-0 rounded-md border border-input bg-background p-2 text-sm" disabled={busy} value={issueId} onChange={event => setIssueId(event.target.value)}><option value="">{pageText("continueYourConversationOrCreateOne_011262")}</option>{tasks.map(task => <option key={task.id} value={task.id}>{task.label}</option>)}</select></label>
      {invalid && <p role="alert" className="text-sm text-destructive">{pageText("thatCodeDoesNotMatchThisLiveCall_32dcb5")}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" disabled={busy} onClick={() => onDecide({approve: false, approvalCode: call.approvalCode})}>{pageText("denyCall_3d69ae")}</Button><Button type="submit" disabled={busy}>{busy ? pageText("confirming_0c2708") : pageText("approveLiveCall_1c36a0")}</Button></div>
    </form> : <p className="text-sm text-muted-foreground">{call.state === "approved" ? pageText("approvalWasSentForThisCallEarlierInstructions_29e830") : pageText("thisCallCannotAccessYourPrivateTasks_c9e8d2")}</p>}
  </section>;
}
export function SpekoIncomingCalls({companyId, endpointId, agentId}: {companyId: string; endpointId: string; agentId: string}) {
  const { t: pageText } = usePageTranslation("interface");
  const [decision, setDecision] = useState<VoiceInboundCall>();
  const host = useRef<HTMLDivElement>(null), restoreTaskFocus = useRef(false);
  useEffect(() => {
    if (!decision) return;
    // The pending-call API omits approved calls; this is a brief confirmation,
    // not a live status indicator after the caller hangs up.
    const timeout = setTimeout(() => setDecision(undefined), 5000);
    return () => clearTimeout(timeout);
  }, [decision]);
  useEffect(() => { setDecision(undefined); restoreTaskFocus.current = false; }, [companyId, endpointId]);
  const query = useQuery({queryKey: ["speko-incoming", companyId, endpointId], queryFn: () => voicePhoneApi.incoming(companyId, endpointId), refetchInterval: 2000});
  const queryView = useQueryView(query);
  const needsTaskSelection = Boolean(query.data?.some(call => ["awaiting_approval", "approving"].includes(call.state)));
  const tasks = useQuery({queryKey: ["speko-approval-tasks", companyId, agentId], queryFn: () => issuesApi.list(companyId, {assigneeAgentId: agentId}), enabled: needsTaskSelection});
  const tasksView = useQueryView(tasks);
  useEffect(() => {
    if (restoreTaskFocus.current && !tasks.isFetching && !(tasksView.kind === "error")) {
      restoreTaskFocus.current = false;
      host.current?.querySelector<HTMLSelectElement>('select[aria-label="Conversation task"]')?.focus();
    }
  }, [tasks.data, tasks.isFetching, (tasksView.kind === "error")]);
  const mutation = useMutation({mutationFn: ({id, ...input}: {id: string; approve: boolean; approvalCode: string; issueId?: string}) => voicePhoneApi.decide(companyId, endpointId, id, input), onSuccess: result => { setDecision(result); return query.refetch(); }});
  return <div ref={host} className="space-y-3">{needsTaskSelection && (tasksView.kind === "error") && <div role="alert" className="space-y-2 text-sm"><p>{pageText("taskListCouldNotBeLoadedRetryTo_abc242")}</p><Button variant="outline" disabled={tasks.isFetching} onClick={() => { restoreTaskFocus.current = true; void tasks.refetch().then(result => { if (result.status === "error") restoreTaskFocus.current = false; }); }}>{pageText("retryTasks_70a15c")}</Button></div>}{queryView.kind === "error" && <p role="alert" className="text-sm text-destructive">{pageText("incomingCallApprovalIsUnavailable_234dd4") + " "}{describeError(query.error).body}</p>}{queryView.kind !== "error" && [...(query.data ?? []).filter(call => call.id !== decision?.id), ...(decision ? [decision] : [])].map(call => <SpekoIncomingCallCard key={call.id} call={call} tasks={tasks.data?.filter(task => !["done", "cancelled"].includes(task.status)).map(task => ({id: task.id, label: `${task.identifier ?? "Task"} · ${task.title}`}))} busy={mutation.isPending && mutation.variables?.id === call.id} error={mutation.variables?.id === call.id ? mutation.error?.message : undefined} onDecide={input => mutation.mutate({id: call.id, ...input})} />)}</div>;
}
