import { useTranslation as usePageTranslation } from "@/i18n";
import { useState, type ReactNode } from "react";
import { RefreshCw, Unplug } from "lucide-react";
import type { ConnectionGrant } from "@paperclipai/shared";
import { RevokeGrantDialog } from "@/pages/apps/app-detail/IdentitiesSection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AI_PROVIDERS, type AiConnectionSummary } from "./model";
import { describeError } from "@/api/errors";
import { AiDefaultCrown } from "./AiConnectionDefault";
import { isOwnAiAccount } from "./useAiConnectionDefaults";

/** AI-only account controls; identity, access and navigation belong to AppDetail. */
export function AiConnectionAccountControls({
  account, grant, currentUserId, readOnly, defaultPending, onMakeDefault, onReconnect, onRevoke, revocationDetails,
}: {
  account: AiConnectionSummary;
  grant: ConnectionGrant;
  currentUserId: string;
  readOnly?: boolean;
  defaultPending?: boolean;
  onMakeDefault: () => void;
  onReconnect: () => void;
  onRevoke: () => void | Promise<void>;
  revocationDetails?: ReactNode;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const [revoking, setRevoking] = useState(false);
  const [revokePending, setRevokePending] = useState(false);
  const [revokeError, setRevokeError] = useState<string>();
  const eligibleForDefault = isOwnAiAccount(account, currentUserId);
  const available = account.status === "connected";
  const activeDefault = account.isDefault && available;
  const providerName = AI_PROVIDERS[account.provider].name;
  return (
    <section className="space-y-4" aria-label={pageText("aiAccountSettings_483f1c")}>
      {eligibleForDefault && (
        <div className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3",
          activeDefault && "border-(--status-task-done)/30 bg-(--status-task-done)/5",
        )}>
          <div className="flex items-center gap-3">
            {account.isDefault && <AiDefaultCrown account={account} />}
            <h3 role={account.isDefault ? "status" : undefined} className={cn("text-sm font-semibold", account.isDefault && !available && "text-destructive")}>{account.isDefault ? available ? `Default for ${providerName}` : pageText("defaultUnavailable_fd8a93") : `Your ${providerName} default`}</h3>
          </div>
          {!account.isDefault && (!readOnly && account.canSetDefault ? (
            <Button variant="outline" size="sm" disabled={!available || Boolean(account.unavailableReason) || defaultPending} onClick={onMakeDefault}>{pageText("setAsDefaultFor_4ea143") + " "}{providerName}</Button>
          ) : <span className="text-xs text-muted-foreground">{pageText("notDefault_683d5a")}</span>)}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="break-words text-xs text-muted-foreground">{account.method === "subscription" ? pageText("subscription_8fde48") : pageText("apiKey_cf678c")}{account.accountLabel ? ` · ${account.accountLabel}` : ""}</p>
        </div>
        {!readOnly && grant.capabilities?.canRevoke && (
          <div className="flex flex-wrap items-center gap-2">
            {<Button variant="outline" size="sm" onClick={onReconnect}><RefreshCw className="size-4" aria-hidden />{pageText("reconnect_6988b1")}</Button>}
            {account.status !== "revoked" && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRevoking(true)}><Unplug className="size-4" aria-hidden />{pageText("revokeIdentity_38a6af")}</Button>}
          </div>
        )}
      </div>
      {revoking && <RevokeGrantDialog grant={grant} providerName={account.name} pending={revokePending} credentialPolicy={account.ownership === "shared" ? "shared" : "per_user"} isOwnIdentity={account.ownerUserId === currentUserId}
        description={pageText("newRunsUsingThisAccountWillBeBlocked_01677d")}
        onCancel={() => setRevoking(false)} onConfirm={async () => { setRevokePending(true); setRevokeError(undefined); try { await onRevoke(); setRevoking(false); } catch (error) { setRevokeError(describeError(error).body); } finally { setRevokePending(false); } }}>{revokeError && <p role="alert" className="text-sm text-destructive">{revokeError}</p>}{revocationDetails}</RevokeGrantDialog>}
    </section>
  );
}
