import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import type { CostByUserReport } from "@paperclipai/shared";
import { CostAmount } from "./CostAmount";
import { Identity } from "./Identity";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatTokens } from "../lib/utils";

export function CostByUserTable({ report }: { report: CostByUserReport }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-0 px-5">
        <CardTitle className="text-base">{pageText("byUser_77cfc4")}</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        <div className="overflow-x-auto">
          <table aria-label={pageText("costsByUser_dd07d4")} className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 text-left font-medium">{pageText("user_9f8a23")}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{translateUi("interfaceCopy.runs")}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{translateUi("interfaceCopy.input")}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{translateUi("interfaceCopy.output")}</th>
                <th scope="col" className="py-2 pl-4 text-right font-medium">{translateUi("interfaceCopy.cost")}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 && (
                <tr><td colSpan={5} className="py-3 text-muted-foreground">{pageText("noUserAttributedCostsYet_f9886d")}</td></tr>
              )}
              {report.rows.map(row => (
                <tr key={row.userId ?? "unattributed"} className="border-b border-border last:border-0">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    {row.userId ? <Identity name={row.userName ?? "Unknown user"} avatarUrl={row.userImage} /> : pageText("unattributed_610472")}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">{row.runCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatTokens(row.inputTokens + row.cachedInputTokens)}
                    {row.cachedInputTokens > 0 && <div className="whitespace-nowrap text-xs text-muted-foreground">{formatTokens(row.cachedInputTokens)}{" " + pageText("cached_0c9371")}</div>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTokens(row.outputTokens)}</td>
                  <td className="py-3 pl-4 text-right tabular-nums">
                    <CostAmount costCents={row.costCents} eventCount={row.eventCount} estimatedEventCount={row.estimatedEventCount} unpricedEventCount={row.unpricedEventCount} />
                    {row.unpricedEventCount > 0 && <div className="whitespace-nowrap text-xs text-muted-foreground">{row.unpricedEventCount}{" " + pageText("unpriced_020448") + " "}{row.unpricedEventCount === 1 ? pageText("charge_5ea9c3") : pageText("charges_c758ce")}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.rows.some(row => row.userId === null) && (
          <p className="mt-3 text-xs text-muted-foreground">{pageText("unattributedCostsHaveNoRecordedUserInThis_2e66b5")}</p>
        )}
      </CardContent>
    </Card>
  );
}
