import { useTranslation as usePageTranslation } from "@/i18n";
import { useQueryView } from "@/components/QueryView";
import { describeError } from "@/api/errors";
import { useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ExecutionBlocker } from "@paperclipai/shared";
import { issuesApi } from "../api/issues";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { NativeSelect } from "./ui/select";

export function WorkspaceReconstructionRecovery({ issueId, blocker, canManage, onRecorded }: {
  issueId: string; blocker: ExecutionBlocker; canManage: boolean; onRecorded: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const [selected, setSelected] = useState<string[]>([]);
  const [missingWork, setMissingWork] = useState("");
  const [outcomeEvidence, setOutcomeEvidence] = useState("");
  const [actionOutcome, setActionOutcome] = useState<"completed" | "not_performed" | "mixed">("mixed");
  const [acknowledged, setAcknowledged] = useState(false);
  const files = useQuery({ queryKey: queryKeys.issues.attachments(issueId),
    queryFn: () => issuesApi.listAttachments(issueId), enabled: canManage });
  const filesView = useQueryView(files);
  const currentSelection = selected.filter(id => files.data?.some(file => file.id === id));
  const submit = useMutation({
    mutationFn: () => issuesApi.reconstructWorkspace(issueId, {
      actionId: blocker.recoveryActionId!, runId: blocker.runId!, expectedStatusVersion: blocker.workspaceRecoveryStatusVersion!,
      attachmentIds: currentSelection, missingWork: missingWork.trim(), actionOutcome, outcomeEvidence: outcomeEvidence.trim(), acknowledgeLostWork: true,
    }), onSuccess: onRecorded,
  });
  return <details className="w-full">
    <summary className="cursor-pointer">{pageText("continueFromSavedSources_34c4a7")}</summary>
    <p>{pageText("theOriginalWorkspaceWasDestroyedBeforeItsEdits_98540b")}</p>
    {canManage ? <div className="flex flex-col gap-2">
      <p>{pageText("selectTaskAttachmentsToRebuildFromAndRecord_04cd13")}</p>
      <fieldset disabled={submit.isPending} className="flex flex-col gap-2">
        <legend>{pageText("savedSourceAttachments_c8afb6")}</legend>
        {files.data?.map(file => <div key={file.id} className="flex items-center gap-2">
          <Checkbox id={`${id}-${file.id}`} checked={selected.includes(file.id)} onCheckedChange={checked =>
            setSelected(current => checked === true ? [...current, file.id] : current.filter(value => value !== file.id))} />
          <Label htmlFor={`${id}-${file.id}`}>{file.originalFilename ?? pageText("attachment_83a562")} ({file.byteSize}{" " + pageText("bytes_771a73")}</Label>
        </div>)}
        {files.isPending && <p>{pageText("loadingSavedAttachments_0d343d")}</p>}
        {files.data?.length === 0 && <p>{pageText("attachTheSurvivingSourceFilesToThisTask_eaf330")}</p>}
        <Label htmlFor={`${id}-missing`}>{pageText("missingWorkAndReconstructionPlan_ccd92b")}</Label>
        <Textarea id={`${id}-missing`} maxLength={12000} value={missingWork} onChange={event => setMissingWork(event.target.value)} />
        <Label htmlFor={`${id}-outcome`}>{pageText("previouslyCompletedExternalActions_ce0715")}</Label>
        <NativeSelect id={`${id}-outcome`} value={actionOutcome} onChange={event => setActionOutcome(event.target.value as typeof actionOutcome)}>
          <option value="mixed">{pageText("someCompletedSomeNotPerformed_069bec")}</option>
          <option value="not_performed">{pageText("nonePerformed_d187b0")}</option>
          <option value="completed">{pageText("allCompleted_733d36")}</option>
        </NativeSelect>
        <Label htmlFor={`${id}-evidence`}>{pageText("evidenceAndActionsThatMustNotBeRepeated_12a0a2")}</Label>
        <Textarea id={`${id}-evidence`} maxLength={12000} value={outcomeEvidence} onChange={event => setOutcomeEvidence(event.target.value)} />
        <div className="flex items-center gap-2">
          <Checkbox id={`${id}-ack`} checked={acknowledged} onCheckedChange={checked => setAcknowledged(checked === true)} />
          <Label htmlFor={`${id}-ack`}>{pageText("continueFromTheseSourcesTheMissingEditsHave_b9b940")}</Label>
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button disabled={submit.isPending || !acknowledged || currentSelection.length === 0 || missingWork.trim().length < 20 || outcomeEvidence.trim().length < 20}
          onClick={() => submit.mutate()}>{submit.isPending ? pageText("queuing_90d650") : pageText("rebuildAndContinue_edc56c")}</Button>
      </div>
      {(filesView.kind === "error") && <p role="alert" className="text-destructive">{describeError(files.error).body}</p>}
      {submit.error && <p role="alert" className="text-destructive">{describeError(submit.error).body}</p>}
    </div> : <p>{pageText("aBoardMemberWithRuntimeAccessCanContinue_8db29f")}</p>}
  </details>;
}
