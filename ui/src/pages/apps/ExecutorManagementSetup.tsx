import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ToolConnection } from "@paperclipai/shared";
import { aggregatorManagementUrl } from "@paperclipai/shared/aggregator-apps";
import { describeError } from "@/api/errors";
import { toolsApi } from "@/api/tools";
import { useAccountIdentity } from "@/api/companies-query";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ExecutorManagementSetup({ connection, onClose }: { connection: ToolConnection; onClose: () => void }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const [url, setUrl] = useState(typeof connection.config?.managementUrl === "string" ? connection.config?.managementUrl : "");
  const queries = useQueryClient();
  const { userId, settled } = useAccountIdentity();
  const save = useMutation({ mutationFn: async () => {
    const managementUrl = aggregatorManagementUrl("executor", url.trim());
    if (!managementUrl) throw new Error("Enter an HTTPS console URL without credentials.");
    await toolsApi.updateConnection(connection.id, { config: { ...connection.config, managementUrl } });
    await queries.invalidateQueries({ queryKey: queryKeys.tools.aggregatorApps(connection.id, userId) });
    const result = await toolsApi.syncAggregatorApps(connection.id, true);
    queries.setQueryData(queryKeys.tools.aggregatorApps(connection.id, userId), result);
  }, onSuccess: async () => { await queries.invalidateQueries({ queryKey: queryKeys.tools.connections(connection.companyId) }); onClose(); } });
  return <Dialog open onOpenChange={open => { if (!open && !save.isPending) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>{pageText("executorConsole_44d467")}</DialogTitle><DialogDescription>{pageText("chooseWhereToManageAccountsFor_b214d6")}{connection.name}{pageText("includeYourWorkspacePath_e87ade")}</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
      <div className="space-y-2"><Label htmlFor="executor-console-url">{pageText("consoleURL_7a8721")}</Label><Input id="executor-console-url" type="url" required value={url} onChange={event => setUrl(event.target.value)} /></div>
      {save.error ? <p role="alert" className="text-sm text-destructive">{describeError(save.error).body}</p> : null}
      <DialogFooter className="sm:justify-between"><Button type="button" variant="ghost" onClick={onClose} disabled={save.isPending}>{translateUi("interfaceCopy.cancel")}</Button><Button type="submit" disabled={!settled || save.isPending || !url.trim()}>{save.isPending ? pageText("saving_56a228") : pageText("save_efc007")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
