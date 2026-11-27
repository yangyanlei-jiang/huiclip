import { useTranslation as usePageTranslation } from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { brandChipBadge } from "@/lib/status-colors";
import type { BuiltInAgentStatus } from "@/api/builtInAgents";

/**
 * Derived lifecycle chip. Rendered for the amber attention states
 * (`needs_setup`, `pending_approval`). Kept separate from the real agent status
 * (`idle/active/…`) per ux-spec D1.
 */
export function BuiltInLifecycleChip({
  status,
  compact = false,
  className,
}: {
  status: BuiltInAgentStatus;
  compact?: boolean;
  className?: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  if (status !== "needs_setup" && status !== "pending_approval") return null;
  const isPendingApproval = status === "pending_approval";
  return (
    <Badge
      variant="outline"
      className={cn(
        brandChipBadge.amber,
        compact && "px-1.5 py-0 text-(length:--text-nano)",
        className,
      )}
      title={
        isPendingApproval
          ? pageText("waitingOnBoardHireApprovalBeforeTheFeature_2181b6")
          : pageText("needsAdapterModelSetupBeforeTheFeatureCan_19070f")
      }
    >
      {isPendingApproval ? (compact ? pageText("approval_8cc047") : pageText("pendingApproval_25d1b4")) : compact ? pageText("setup_cdd7bb") : pageText("needsSetup_522eba")}
    </Badge>
  );
}
