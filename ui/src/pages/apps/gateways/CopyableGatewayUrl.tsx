import { useTranslation as usePageTranslation } from "@/i18n";
import { t as interfaceNotice } from "@/i18n";
import { Copy } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { copyTextToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export function gatewayEndpointUrl(endpointPath: string): string {
  if (typeof window === "undefined") return endpointPath;
  try {
    return new URL(endpointPath, window.location.origin).toString();
  } catch {
    return endpointPath;
  }
}

export function CopyableGatewayUrl({
  endpointPath,
  className,
}: {
  endpointPath: string;
  className?: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { pushToast } = useToast();
  const url = gatewayEndpointUrl(endpointPath);

  async function copy() {
    try {
      await copyTextToClipboard(url);
      pushToast({ title: interfaceNotice("interface:gatewayURLCopied_a9f3e5"), tone: "success" });
    } catch {
      pushToast({
        title: interfaceNotice("interface:copyFailed_bd5acb"),
        body: interfaceNotice("interface:clipboardAccessIsUnavailable_0d01be"),
        tone: "error",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void copy();
      }}
      className={cn(
        "flex min-w-0 max-w-full items-center gap-1 text-left font-mono text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
      title={`${url} — click to copy`}
      aria-label={pageText("copyGatewayURL_063c4b")}
    >
      <span className="min-w-0 truncate">{url}</span>
      <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </button>
  );
}
