import { useTranslation as usePageTranslation } from "@/i18n";
import type { FinanceByBiller } from "@paperclipai/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, providerDisplayName } from "@/lib/utils";

interface FinanceBillerCardProps {
  row: FinanceByBiller;
}

export function FinanceBillerCard({ row }: FinanceBillerCardProps) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{providerDisplayName(row.biller)}</CardTitle>
            <CardDescription className="mt-1 text-xs">
              {row.eventCount}{" " + pageText("event_5006ed")}{row.eventCount === 1 ? "" : "s"}{" " + pageText("across_9a82bf") + " "}{row.kindCount}{" " + pageText("kind_0ef25a")}{row.kindCount === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">{formatCents(row.netCents, row.currency)}</div>
            <div className="text-(length:--text-micro) uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{pageText("net_391b66")}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-3">
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="border border-border p-3">
            <div className="text-(length:--text-micro) uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{pageText("debits_7369c3")}</div>
            <div className="mt-1 font-medium tabular-nums">{formatCents(row.debitCents, row.currency)}</div>
          </div>
          <div className="border border-border p-3">
            <div className="text-(length:--text-micro) uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{pageText("credits_66c22f")}</div>
            <div className="mt-1 font-medium tabular-nums">{formatCents(row.creditCents, row.currency)}</div>
          </div>
          <div className="border border-border p-3">
            <div className="text-(length:--text-micro) uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{pageText("estimated_781012")}</div>
            <div className="mt-1 font-medium tabular-nums">{formatCents(row.estimatedDebitCents, row.currency)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
