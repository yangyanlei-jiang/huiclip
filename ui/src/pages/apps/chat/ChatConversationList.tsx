import { useTranslation as usePageTranslation } from "@/i18n";
import { MessageSquare } from "lucide-react";
import type { ChatConversation, ChatProvider } from "@/api/chatEndpoints";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "@/lib/router";
import { formatDateTime } from "@/lib/utils";
import { AppLogo } from "../AppLogo";

export function conversationDestination(
  row: ChatConversation,
  provider: ChatProvider,
) {
  if (provider === "github" && row.externalUrl) {
    try {
      const url = new URL(row.externalUrl);
      const parts = url.pathname.split("/");
      if (
        url.hostname === "github.com" &&
        ["issues", "pull"].includes(parts[3]) &&
        /^\d+$/.test(parts[4])
      )
        return `${parts[1]}/${parts[2]} #${parts[4]}`;
    } catch {
      /* Preserve the provider label when no thread URL is available. */
    }
  }
  return row.externalLabel;
}

export function ChatConversationList({
  rows,
  provider,
}: {
  rows: ChatConversation[];
  provider: ChatProvider;
}) {
  const { t: pageText } = usePageTranslation("interface");
  if (!rows.length)
    return (
      <EmptyState
        icon={MessageSquare}
        message={pageText("noConversationsYet_f58811")}
        description={
          provider === "speko"
            ? pageText("openAnAssignedTaskAndChooseTalkTo_e3dc1a")
            : provider === "agentmail"
            ? pageText("sendAnEmailToThisAgentSAddress_3caedd")
            : pageText("mentionTheAgentInAnEnabledDestinationTo_cc798e")
        }
      />
    );
  return (
    <ul
      aria-label={pageText("conversations_07c59b")}
      className="divide-y divide-border border-y border-border"
    >
      {rows.map((row) => (
        <li key={row.id} className="flex items-start gap-3 py-4 text-sm">
          <AppLogo
            name={provider}
            brandKey={provider}
            compact
            className="mt-0.5 size-5! shrink-0 rounded-sm bg-transparent"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="break-words">
              {row.issueIdentifier && (
                <span className="mr-2 text-xs text-muted-foreground">
                  {row.issueIdentifier}
                </span>
              )}
              {row.issueId ? (
                <Link
                  className="break-words font-medium hover:underline"
                  to={`/issues/${row.issueId}`}
                >
                  {row.issueTitle ?? row.issueIdentifier ?? pageText("paperclipTask_678b33")}
                </Link>
              ) : (
                <span className="font-medium">
                  {row.issueTitle ?? pageText("waitingForTask_a9e024")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {row.externalUrl ? (
                <a
                  href={row.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-words hover:text-foreground hover:underline"
                >
                  {conversationDestination(row, provider)}
                </a>
              ) : (
                <span className="break-all">{row.externalLabel}</span>
              )}
              {row.updatedAt && (
                <time dateTime={row.updatedAt}>
                  {formatDateTime(row.updatedAt)}
                </time>
              )}
              {row.state === "completed" && <span>{pageText("completed_1798b3")}</span>}
            </div>
          </div>
          {row.state !== "active" && row.state !== "completed" && (
            <StatusBadge status={row.state} />
          )}
        </li>
      ))}
    </ul>
  );
}
