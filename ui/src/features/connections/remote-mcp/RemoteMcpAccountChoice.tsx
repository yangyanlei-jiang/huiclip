import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/InlineBanner";
import { ConnectionChoiceList } from "../ConnectionChoiceList";

/** Shared presentation for account reuse, including the requested external app. */
export function RemoteMcpAccountChoice({
  providerName,
  upstreamServiceName,
  connections,
  pendingId,
  error,
  onSelect,
  onCancel,
  onConnectNew,
}: {
  providerName: string;
  upstreamServiceName?: string;
  connections: { id: string; name: string }[];
  pendingId?: string | null;
  error?: string | null;
  onSelect: (id: string) => void;
  onCancel?: () => void;
  onConnectNew: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">
          {upstreamServiceName
            ? `Connect ${upstreamServiceName} through ${providerName}`
            : `Connect ${providerName}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{pageText("useAnExistingConnectionOrConnectANew_2573a6")}</p>
      </div>
      {upstreamServiceName && (
        <InlineBanner compact>
          {providerName}{" " + pageText("isAnExternalServiceThatHandlesTheConnection_7ae124") + " "}{upstreamServiceName}{pageText("reusingThisAccountDoesNotYetVerifyApp_c0e335")}</InlineBanner>
      )}
      <ConnectionChoiceList
        choices={connections.map((connection) => ({
          ...connection,
          description: "Provider account available",
        }))}
        pendingId={pendingId}
        onSelect={onSelect}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={Boolean(pendingId)}
          onClick={onCancel}
        >{translateUi("interfaceCopy.cancel")}</Button>
        <Button disabled={Boolean(pendingId)} onClick={onConnectNew}>{pageText("connectNew_e6e8ab")}</Button>
      </div>
    </div>
  );
}
