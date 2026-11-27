import { useTranslation as usePageTranslation } from "@/i18n";
import type { FinanceByKind } from "@paperclipai/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financeEventKindDisplayName, formatCents } from "@/lib/utils";

interface FinanceKindCardProps {
  rows: FinanceByKind[];
}

export function FinanceKindCard({ rows }: FinanceKindCardProps) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-1">
        <CardTitle className="text-base">{pageText("financialEventMix_54da97")}</CardTitle>
        <CardDescription>{pageText("accountLevelChargesGroupedByEventKind_5d7097")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{pageText("noFinanceEventsInThisPeriod_cbfe86")}</p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.eventKind}:${row.currency}`}
              className="flex items-center justify-between gap-3 border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{financeEventKindDisplayName(row.eventKind)}</div>
                <div className="text-xs text-muted-foreground">
                  {row.eventCount}{" " + pageText("event_5006ed")}{row.eventCount === 1 ? "" : "s"} · {row.billerCount}{" " + pageText("biller_05c878")}{row.billerCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="text-sm font-medium">{formatCents(row.netCents, row.currency)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCents(row.debitCents, row.currency)}{" " + pageText("debits_7369c3")}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
