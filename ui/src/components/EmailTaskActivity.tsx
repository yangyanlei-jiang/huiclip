import { useTranslation as usePageTranslation } from "@/i18n";
import { EmailMessageCard } from "./EmailMessageCard";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emailApi } from "@/api/email";
import { useEmailThread } from "@/hooks/useEmailThread";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeError } from "@/api/errors";
import { QueryErrorState, useQueryView } from "./QueryView";
import type { EmailPublicationSummary } from "@paperclipai/shared";

// Email actions belong to the agent's task conversation. Only surface mail
// without a task comment yet and delivery outcomes that need attention here.
export function EmailTaskActivity({
  companyId,
  issueId,
}: {
  companyId: string;
  issueId: string;
}) {
  const cache = useQueryClient();
  const threadKey = ["email-thread", companyId, issueId];
  const queryEnabled = Boolean(companyId && issueId) && !issueId.startsWith("chat:");
  const thread = useEmailThread(companyId, issueId);
  const threadView = useQueryView(thread);
  if (!queryEnabled) return null;
  if (threadView.kind === "stale" || threadView.kind === "ready") {
    const data = threadView.data;
    const messages = data?.messages.filter((m) => !m.commentId) ?? [];
    const publications = data?.publications.filter(
      (p) => !p.providerMessageId || p.outcome === "uncertain",
    ) ?? [];
    if (!messages.length && !publications.length) return null;
    return (
      <div className="space-y-3">
        {messages.map((m) => (
          <EmailMessageCard
            contextNotice
            key={m.id}
            issueId={issueId}
            message={m}
            publication={data?.publications.find(
              (p) => p.providerMessageId === m.providerMessageId,
            )}
          />
        ))}
        {publications.map((p) => (
          <EmailDelivery
            key={p.id}
            companyId={companyId}
            publication={p}
            onResolved={() => {
              void cache.invalidateQueries({ queryKey: threadKey });
            }}
          />
        ))}
      </div>
    );
  }
  // A quiet section while the initial read is still settling;a no-data read
  // failure gets readable copy with Retry instead of a raw error line.
  if (threadView.kind === "error") {
    return (
      <QueryErrorState
        size="inline"
        error={threadView.error}
        action="load email activity"
        onRetry={threadView.retry}
        retrying={threadView.isFetching}
      />
    );
  }
  return null;
}

function EmailDelivery({
  companyId,
  publication: p,
  onResolved,
}: {
  companyId: string;
  publication: EmailPublicationSummary;
  onResolved: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const [messageId, setMessageId] = useState("");
  const resolve = useMutation({
    mutationFn: (outcome: "sent" | "failed") =>
      emailApi.resolve(companyId, p.id, outcome, messageId || undefined),
    onSuccess: onResolved,
  });
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      {p.request && !p.providerMessageId && (
        <article
          aria-label={pageText("emailSendIntent_4a00f4")}
          className="task-context-notice space-y-3"
        >
          <p className="font-semibold">{p.request.subject ?? pageText("emailReply_60d3b1")}</p>
          {p.request.to && <p>{pageText("to_7e7fbc") + " "}{p.request.to.join(", ")}</p>}
          <div className="whitespace-pre-wrap break-words text-sm text-foreground">
            {p.request.text}
          </div>
        </article>
      )}
      <p>{pageText("email_84add5") + " "}{p.outcome}
        {p.error ? ` — ${p.error}` : ""}
      </p>
      {p.outcome === "uncertain" && (
        <details>
          <summary className="cursor-pointer">{pageText("resolveDeliveryAfterCheckingAgentMail_ebbab4")}</summary>
          <div className="space-y-2 py-2">
            <p>{pageText("confirmTheOutcomeInAgentMailBeforeResolvingThis_bf3415")}</p>
            <Input
              aria-label={pageText("providerMessageID_89b99d")}
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              placeholder={pageText("providerMessageID_89b99d")}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!messageId || resolve.isPending}
                onClick={() => resolve.mutate("sent")}
              >{pageText("confirmSent_d36cf4")}</Button>
              <Button
                size="sm"
                variant="outline"
                disabled={resolve.isPending}
                onClick={() => resolve.mutate("failed")}
              >{pageText("confirmNotSent_b48cca")}</Button>
            </div>
            {resolve.isError && ( // query-error-ok: mutation result
              <p role="alert" className="text-destructive">
                {describeError(resolve.error).body}
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
