import { useTranslation as usePageTranslation } from "@/i18n";
import type { VoiceTranscriptEntry } from "@/lib/voice-transcript";

export interface VoiceTranscriptProps {
  entries: readonly VoiceTranscriptEntry[];
  agentName: string;
  unavailable?: boolean;
}

/** Announcements belong to the session controller, once per final segment. */
export function VoiceTranscript({ entries, agentName, unavailable = false }: VoiceTranscriptProps) {
  const { t: pageText } = usePageTranslation("interface");
  if (unavailable) return <p className="text-sm text-muted-foreground">{pageText("theTranscriptIsUnavailableYourTaskHistoryIs_49108b")}</p>;
  if (!entries.length) return <p className="text-sm text-muted-foreground">{pageText("yourConversationWillAppearHere_06a663")}</p>;
  return (
    <ol aria-label={pageText("conversationTranscript_1682dd")} aria-live="off" className="flex min-w-0 flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground break-words">
            {entry.source === "user" ? pageText("you_905cb3") : entry.source === "application" ? pageText("paperclip_f504c7") : agentName}
            {!entry.final && !entry.interrupted && <span>{" " + pageText("speaking_3d83ba")}</span>}
            {entry.interrupted && <span>{" " + pageText("interrupted_d97b8e")}</span>}
          </span>
          <p className="whitespace-pre-wrap break-words text-sm">{entry.text}</p>
        </li>
      ))}
    </ol>
  );
}
