import { useTranslation as usePageTranslation } from "@/i18n";
import { Loader2 } from "lucide-react";

export function InteractionPreparationNotice() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 aria-hidden className="h-4 w-4 animate-spin" />{pageText("preparingApproval_5f4257")}</div>
  );
}
