import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SUBSCRIPTION_CURRENCIES, centsToUsd, usdToCents, type SubscriptionAccountReport, type SubscriptionCostReport, type SubscriptionUsage } from "@paperclipai/shared";
import { subscriptionsApi } from "../api/subscriptions";
import { formatCents, formatDateTime, formatTokens, providerDisplayName } from "../lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function subscriptionMoney(cents: string, currency: string) {
  return currency === "USD" ? formatCents(Number(cents))
    : new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "code" }).format(Number(cents) / 100);
}

export function SubscriptionTokenUsage({ usage }: { usage: SubscriptionUsage }) {
  const { t: pageText } = usePageTranslation("interface");
  return <span className="font-mono text-xs text-muted-foreground">
    {formatTokens(usage.inputTokens + usage.cachedInputTokens)}{" " + pageText("in_1571e1") + " "}{formatTokens(usage.outputTokens)}{" " + pageText("out_f4800d")}{usage.cachedInputTokens > 0 && <span className="block">{formatTokens(usage.cachedInputTokens)}{" " + pageText("inputCached_daa348")}</span>}
  </span>;
}

function SubscriptionEditor({ account, accounts, companyId, onDone }: {
  account: SubscriptionAccountReport; accounts: SubscriptionAccountReport[]; companyId: string; onDone: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const [plan, setPlan] = useState(account.price.plan);
  const [amount, setAmount] = useState(account.price.amountCents == null ? "" : centsToUsd(account.price.amountCents).replace(/\.?0+$/, ""));
  const [currency, setCurrency] = useState(account.price.currency);
  const [cadence, setCadence] = useState(account.price.cadence);
  const [status, setStatus] = useState(account.price.status);
  const [targetId, setTargetId] = useState("");
  const save = useMutation({ mutationFn: () => subscriptionsApi.update(companyId, account.id, {
    expectedRevision: account.price.revision, plan, amountCents: amount.trim() ? usdToCents(amount.trim()) : null,
    currency: currency as typeof SUBSCRIPTION_CURRENCIES[number], cadence, status,
  }), onSuccess: onDone });
  const link = useMutation({ mutationFn: () => subscriptionsApi.link(companyId, account.id, targetId, account.price.revision,
    accounts.find(row => row.id === targetId)!.price.revision), onSuccess: onDone });
  const targets = accounts.filter(row => row.id !== account.id && row.provider === account.provider && row.canEdit);
  const busy = save.isPending || link.isPending;
  const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm";
  return <div className="space-y-5">
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
      <div className="space-y-2"><Label htmlFor="subscription-plan">{pageText("plan_ae2f98")}</Label><Input id="subscription-plan" value={plan} onChange={event => setPlan(event.target.value)} required maxLength={100} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="subscription-price">{pageText("pricePerBillingPeriod_85f00d")}</Label><Input id="subscription-price" type="number" min="0" step="any" value={amount} placeholder={pageText("unknown_bc7819")} onChange={event => setAmount(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="subscription-currency">{pageText("currency_e070de")}</Label><select id="subscription-currency" className={selectClass} value={currency} onChange={event => setCurrency(event.target.value)}>{SUBSCRIPTION_CURRENCIES.map(code => <option key={code}>{code}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="subscription-cadence">{pageText("billed_763fe5")}</Label><select id="subscription-cadence" className={selectClass} value={cadence} onChange={event => setCadence(event.target.value as typeof cadence)}><option value="month">{pageText("monthly_d31edb")}</option><option value="year">{pageText("annually_60000f")}</option></select></div>
        <div className="space-y-2"><Label htmlFor="subscription-status">{pageText("tracking_e81a15")}</Label><select id="subscription-status" className={selectClass} value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="active">{pageText("active_a733b8")}</option><option value="ended">{pageText("subscriptionEnded_233f17")}</option><option value="excluded">{pageText("excludeFromThisOrganization_8a33ba")}</option></select></div>
      </div>
      <p className="text-xs text-muted-foreground">{pageText("enterTheFullAmountForOneAccountOr_5a725c")}</p>
      {save.error && <p role="alert" className="text-sm text-destructive">{pageText("couldNotSaveThisPriceCheckTheAmount_b67039")}</p>}
      <div className="flex items-center justify-between"><Button type="button" variant="ghost" disabled={busy} onClick={onDone}>{translateUi("interfaceCopy.cancel")}</Button><Button type="submit" disabled={busy}>{save.isPending ? pageText("saving_56a228") : pageText("savePrice_6a897d")}</Button></div>
    </form>
    {targets.length > 0 && <div className="space-y-2 border-t border-border pt-4">
      <Label htmlFor="subscription-link">{pageText("sameSubscriptionAsAnotherAccount_91ab1f")}</Label>
      <select id="subscription-link" className={selectClass} value={targetId} onChange={event => setTargetId(event.target.value)}><option value="">{pageText("chooseAnAccount_dc4922")}</option>{targets.map(row => <option key={row.id} value={row.id}>{row.name} · {row.price.plan}</option>)}</select>
      <p className="text-xs text-muted-foreground">{pageText("linkingCountsTheseAccountsOnceCombinesTheirPaperclip_c22c7d")}</p>
      {link.error && <p role="alert" className="text-sm text-destructive">{pageText("couldNotLinkTheseAccountsReopenTheirDetails_62e1fc")}</p>}
      <Button type="button" variant="outline" disabled={!targetId || busy} onClick={() => link.mutate()}>{pageText("linkAccounts_e90bf0")}</Button>
    </div>}
  </div>;
}

export function SubscriptionCostCard({ companyId, report, error, onChanged }: {
  companyId: string; report?: SubscriptionCostReport; error?: unknown; onChanged: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionAccountReport | null>(null);
  const closeEditor = () => { setEditing(null); onChanged(); };
  const known = report?.monthlyTotals.length;
  const estimatedCount = report?.monthlyTotals.reduce((sum, total) => sum + total.estimatedCount, 0) ?? 0;
  return <>
    <Card className="block p-4">
      <div className="text-(length:--text-micro) uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{pageText("subscriptions_5697fd")}</div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
        {known ? report!.monthlyTotals.map(total => <div key={total.currency}>{subscriptionMoney(total.amountCents, total.currency)}<span className="text-sm font-normal">/month</span></div>) : report && report.activeCount === 0 && report.accounts.length > 0 ? pageText("000Month_72fb6c") : "—"}
      </div>
      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
        {report ? <>
          {estimatedCount > 0 && <div><Badge variant="outline" className="font-normal text-muted-foreground">{estimatedCount < report.activeCount - report.unknownPriceCount ? pageText("partiallyEstimated_24affb") : pageText("estimated_ae64c7")}</Badge></div>}
          {report.unknownPriceCount > 0 && !!known && <div>{pageText("knownMonthlySubtotal_fe1cb6")}</div>}
          <div>{report.accounts.length === 0 ? pageText("noVisibleSubscriptions_a9aae0") : <>{report.activeCount}{" " + pageText("active_2bb6b9") + " "}{report.activeCount === 1 ? pageText("subscription_dc917a") : pageText("subscriptions_9bbb0d")}{report.unknownPriceCount > 0 && ` · ${report.unknownPriceCount} ${report.unknownPriceCount === 1 ? "price" : "prices"} unknown`}</>}</div>
          {report.accounts.length > 0 && <div>{pageText("monthlyFeesForAccountsVisibleToYou_84f8d5")}</div>}
          {report.unidentifiedAccountCount > 0 && <div>{report.unidentifiedAccountCount}{" " + pageText("unconfirmed_8a1d05") + " "}{report.unidentifiedAccountCount === 1 ? pageText("accountIdentity_428e20") : pageText("accountIdentities_ff223c")}</div>}
          <SubscriptionTokenUsage usage={report.subscription} />
        </> : error ? <div>{pageText("subscriptionDataIsUnavailable_9a4c10")}</div> : <div>{pageText("loadingSubscriptions_efb3c8")}</div>}
        {report && error ? <div>{pageText("showingLastLoadedSubscriptionData_cf46f4")}</div> : null}
      </div>
      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOpen(true)} disabled={!report}>{pageText("viewDetails_badd38")}</Button>
    </Card>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setEditing(null); }}>
      <DialogContent className="max-h-(--sz-80vh) overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{editing ? pageText("subscriptionPrice_2944f8") : pageText("subscriptions_5697fd")}</DialogTitle><DialogDescription>{pageText("currentMonthlyCostsForAccountsVisibleToYou_18e760")}</DialogDescription></DialogHeader>
        {editing ? <SubscriptionEditor key={editing.id} companyId={companyId} account={editing} accounts={report?.accounts ?? []} onDone={closeEditor} /> : <div className="space-y-4">
          {report?.accounts.length === 0 && <p className="text-sm text-muted-foreground">{pageText("noSubscriptionsAreVisibleToYouYetConnect_71fde4")}</p>}
          {report?.accounts.map(account => <div key={account.id} className="space-y-2 border-b border-border pb-4 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-medium">{account.name}</div><div className="text-xs text-muted-foreground">{account.shared ? pageText("shared_50d0d8") : account.ownerName ?? (account.ownerUserId ? pageText("accountOwner_75b770") : pageText("personalAccounts_de611d"))} · {providerDisplayName(account.provider)} · {account.price.plan}</div></div>
              <div className="text-right"><div className="font-mono">{account.price.status !== "active" ? account.price.status === "ended" ? pageText("ended_90303d") : pageText("excluded_980495") : account.price.monthlyCents == null ? pageText("priceUnknown_7a6356") : `${subscriptionMoney(account.price.monthlyCents, account.price.currency)}/month`}</div><div className="text-xs text-muted-foreground">{account.price.source === "catalog" ? pageText("estimatedBeforeTax_0ca8e4") : account.price.source === "user" ? pageText("userSupplied_276725") : ""}{account.price.cadence === "year" ? " " + pageText("annualPayment12_45ada2") : ""}</div></div>
            </div>
            <SubscriptionTokenUsage usage={account.usage} />
            {Number(account.usage.costCents) > 0 && <div className="text-xs text-muted-foreground">{formatCents(Number(account.usage.costCents))}{" " + pageText("recordedUsageChargesInSelectedPeriodSeparateFrom_611bff")}</div>}
            {account.agents.length > 0 && <div className="text-xs text-muted-foreground">{pageText("usedBy_f5060a") + " "}{account.agents.map(agent => agent.name).join(", ")}</div>}
            {!account.identityVerified && <p className="text-xs text-muted-foreground">{pageText("accountIdentityIsUnconfirmedLinkDuplicatesIfThese_b1c208")}</p>}
            {account.observedAt && <div className="text-xs text-muted-foreground">{pageText("planChecked_86f8c5") + " "}{formatDateTime(account.observedAt)}{account.refreshStatus === "unavailable" ? " " + pageText("latestCheckUnavailable_a82eba") : ""}</div>}
            {account.refreshStatus === "unavailable" && !account.observedAt && <p className="text-xs text-muted-foreground">{pageText("theProviderDidNotMakePlanDetailsAvailable_56f6fb")}</p>}
            {account.canEdit && <div><Button variant="outline" size="sm" onClick={() => setEditing(account)}>{pageText("editPrice_9a2ebf")}</Button></div>}
          </div>)}
          {!!report?.unattributedSubscription.eventCount && <p className="text-xs text-muted-foreground">{pageText("someSubscriptionUsageHasNoRecordedAccountIt_595fbd")}</p>}
          <p className="text-xs text-muted-foreground">{pageText("monthlyFeesCoverTheWholeAccountIncludingUse_a3e082")}</p>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
