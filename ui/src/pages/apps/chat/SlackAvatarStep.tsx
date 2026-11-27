import { useTranslation as usePageTranslation } from "@/i18n";
import { useId, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SlackAvatarProps {
  agentName: string;
  appName: string;
  avatarUrl: string;
}

/** Manual fallback shared by Slack onboarding and its Settings page. */
export function SlackAvatarContent({
  agentName,
  appName,
  avatarUrl,
  compact = false,
}: SlackAvatarProps & { compact?: boolean }) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const filename = `${appName.replace(/[^a-zA-Z0-9_-]+/g, "-") || "agent"}-avatar.png`;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await fetch(avatarUrl);
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/png")
      )
        throw new Error("Avatar unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="space-y-8">
      <section
        aria-labelledby={`${id}-download`}
        className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"
      >
        <img
          src={avatarUrl}
          width={512}
          height={512}
          alt={`${agentName}’s Cliptoon avatar`}
          className="size-40 shrink-0 rounded-lg bg-muted object-contain"
        />
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 id={`${id}-download`} className="text-sm font-semibold">
              {compact
                ? pageText("downloadYourAgentSAvatar_574864")
                : pageText("1DownloadYourAgentSAvatar_af2561")}
            </h2>
            <p className="text-xs text-muted-foreground">{pageText("png512512ReadyForSlack_c3e834")}</p>
          </div>
          <Button variant="outline" asChild>
            <a
              href={avatarUrl}
              download={filename}
              aria-disabled={downloading}
              onClick={(event) => {
                event.preventDefault();
                void download();
              }}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}{pageText("downloadAvatar_31115e")}</a>
          </Button>
          {downloadError && (
            <p role="alert" className="text-sm text-destructive">{pageText("couldnTDownloadTheAvatarTryDownloadingIt_d137aa")}</p>
          )}
        </div>
      </section>

      <details open={compact ? undefined : true} className="space-y-4">
        <summary
          className={
            compact
              ? "cursor-pointer text-sm underline underline-offset-4"
              : "hidden"
          }
        >{pageText("howToUploadInSlack_a4a3fa")}</summary>
        <section aria-labelledby={`${id}-upload`} className="space-y-4">
          <div className="space-y-1">
            <h2 id={`${id}-upload`} className="text-sm font-semibold">
              {compact ? pageText("uploadItInSlack_9d128e") : pageText("2UploadItInSlack_b98f46")}
            </h2>
            <p className="text-sm text-muted-foreground">{pageText("youLlUploadTheDownloadedImageDirectlyIn_86e996")}</p>
          </div>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            <li>
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >{pageText("openSlackAppSettings_33e079")}{" "}
                <ExternalLink className="inline size-3" />
              </a>{" "}{pageText("andChoose_08e049") + " "}<strong>{appName}</strong>.
            </li>
            <li>{pageText("choose_78b7c9") + " "}<strong>{pageText("basicInformation_b0d5be")}</strong>{pageText("thenScrollTo_004102")}{" "}
              <strong>{pageText("displayInformation_ca0b29")}</strong>.
            </li>
            <li>{pageText("under_2a268b") + " "}<strong>{pageText("appIconPreview_ff1cc7")}</strong>{pageText("clickTheAppIconAndUpload_b805fe")}{" "}
              <span className="break-all font-mono text-xs">{filename}</span>.
            </li>
            <li>{pageText("confirmTheCropThenClick_e7eb45") + " "}<strong>{pageText("saveChanges_fa2984")}</strong>{" " + pageText("inSlack_f172cc")}</li>
          </ol>
        </section>
      </details>
    </div>
  );
}


export function SlackAvatarSettings(props: SlackAvatarProps) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <section className="space-y-4" aria-label={pageText("slackAvatar_b0c9b7")}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{pageText("agentAvatar_a3fe01")}</h2>
        <p className="text-sm text-muted-foreground">{pageText("use_1d4d43") + " "}{props.agentName}{pageText("sAvatarSoYourTeamRecognizesTheAgent_24472f")}</p>
      </div>
      <SlackAvatarContent {...props} compact />
    </section>
  );
}
