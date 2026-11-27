import { useTranslation as usePageTranslation } from "@/i18n";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VoicePhoneConfiguration } from "@paperclipai/shared";
import { voicePhoneApi } from "@/api/voicePhone";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
export interface SpekoPhoneLineFormProps { configuration?: VoicePhoneConfiguration; loading?: boolean; saving?: boolean; saved?: boolean; error?: string; onRefresh(): void; onSave(input: {numberId: string; enabled: boolean; guestIntake?: boolean; lowTrustEnvironmentId?: string | null}): void }
export function SpekoPhoneLineForm({configuration, loading, saving, saved, error, onRefresh, onSave}: SpekoPhoneLineFormProps) {
  const { t: pageText } = usePageTranslation("interface");
  const [numberId, setNumberId] = useState(configuration?.number?.id ?? ""), [enabled, setEnabled] = useState(configuration?.number?.enabled ?? false), [guestIntake, setGuestIntake] = useState(configuration?.number?.guestIntake ?? false), [invalid, setInvalid] = useState(false), [environmentId, setEnvironmentId] = useState(configuration?.number?.lowTrustEnvironmentId ?? "");
  useEffect(() => {setNumberId(configuration?.number?.id ?? ""); setEnabled(configuration?.number?.enabled ?? false); setGuestIntake(configuration?.number?.guestIntake ?? false); setEnvironmentId(configuration?.number?.lowTrustEnvironmentId ?? "");}, [configuration]);
  const selected = configuration?.inventory.find(n => n.id === numberId);
  return <section className="max-w-xl space-y-3">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{pageText("incomingCalls_63f0c2")}</h2><Button size="sm" variant="ghost" disabled={loading || saving} onClick={onRefresh}>{pageText("refreshNumbers_b6d4aa")}</Button></div>
    <p className="text-sm text-muted-foreground">{pageText("letCallersStartAConversationInANew_0cf948")}</p>
    {loading && <p role="status" className="text-sm text-muted-foreground">{pageText("loadingSpekoNumbers_3afaa8")}</p>}
    {!loading && !configuration?.inventory.length && <p className="text-sm text-muted-foreground">{pageText("noNumbersAreAvailable_6f079e") + " "}<a className="text-primary underline" href="https://platform.speko.ai" target="_blank" rel="noreferrer">{pageText("buyOrImportANumberInSpeko_8a8b0e")}</a>{pageText("completeVerificationAndAddCreditsThenRefresh_2ffc88")}</p>}
    <form className="space-y-3" onSubmit={event => {event.preventDefault(); if (!numberId || !selected?.available) {setInvalid(true); return;} setInvalid(false); onSave({numberId, enabled, guestIntake, lowTrustEnvironmentId: environmentId || null});}}>
      <label className="grid min-w-0 gap-2 text-sm font-medium">{pageText("companyPhoneNumber_55e198")}<select aria-label={pageText("companyPhoneNumber_55e198")} disabled={loading || saving} className="min-w-0 w-full rounded-md border border-input bg-background p-2 text-sm" value={numberId} onChange={event => {setNumberId(event.target.value); setInvalid(false);}}><option value="">{pageText("selectANumber_d6b066")}</option>{configuration?.inventory.map(n => <option key={n.id} value={n.id} disabled={!n.available}>{n.phoneNumber}{n.label ? ` · ${n.label}` : ""}{!n.available ? " " + pageText("unavailable_8ed18c") : ""}</option>)}</select></label>
      {selected && !selected.inboundReady && <p className="text-sm text-muted-foreground">{pageText("completeNumberSetupInSpekoBeforeEnablingIncoming_f55ed1")}{selected.issues.length ? ` ${selected.issues.join(". ")}` : ""}</p>}
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={enabled} disabled={loading || saving} onCheckedChange={value => setEnabled(value === true)} />{pageText("enableIncomingCallsOnThisNumber_272e5d")}</label>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={guestIntake} disabled={loading || saving} onCheckedChange={value => setGuestIntake(value === true)} />{pageText("letCallersStartNewLowTrustTasksWithout_c2118a")}</label>
      {guestIntake && <p className="text-sm text-muted-foreground">{pageText("eachCallGetsItsOwnTaskTheAssigned_6e8986")}</p>}
      {guestIntake && <label className="grid min-w-0 gap-2 text-sm font-medium">{pageText("executionSandbox_d1955d")}<select aria-label={pageText("executionSandbox_d1955d")} disabled={loading || saving} className="min-w-0 w-full rounded-md border border-input bg-background p-2 text-sm" value={environmentId} onChange={event => setEnvironmentId(event.target.value)}><option value="">{pageText("useThisAgentSSandbox_eb5098")}</option>{configuration?.sandboxEnvironments?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><span className="text-sm font-normal text-muted-foreground">{pageText("onlyNewIncomingTasksUseThisSettingLow_bdcb25")}</span></label>}
      {invalid && <p role="alert" className="text-sm text-destructive">{pageText("chooseAnAvailableCompanyPhoneNumber_2965a6")}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">{saved ? pageText("incomingCallSettingSaved_14b789") : ""}</p><Button type="submit" disabled={loading || saving}>{saving ? pageText("saving_56a228") : pageText("saveIncomingCallSetting_5f2c91")}</Button></div>
    </form>
  </section>;
}
export function SpekoPhoneLine({companyId, endpointId}: {companyId: string; endpointId: string}) {
  const queryClient = useQueryClient(), key = ["speko-phone-line", companyId, endpointId];
  const query = useQuery({queryKey: key, queryFn: () => voicePhoneApi.configuration(companyId, endpointId)});
  const mutation = useMutation({mutationFn: (input: {numberId: string; enabled: boolean; guestIntake?: boolean; lowTrustEnvironmentId?: string | null}) => voicePhoneApi.save(companyId, endpointId, input), onSuccess: data => queryClient.setQueryData(key, data)});
  return <SpekoPhoneLineForm configuration={query.data} loading={query.isLoading} saving={mutation.isPending} saved={mutation.isSuccess} error={(mutation.error ?? query.error)?.message} onRefresh={() => void query.refetch()} onSave={input => mutation.mutate(input)} />;
}
