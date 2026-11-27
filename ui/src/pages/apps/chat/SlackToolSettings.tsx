import { useTranslation as usePageTranslation } from "@/i18n";
import { useAuthorizationWindow } from "@/hooks/useAuthorizationWindow";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  SlackSearchStatus,
  SlackToolCapabilities,
} from "@paperclipai/shared";
import { describeError } from "@/api/errors";
import { slackToolsApi } from "@/api/slackTools";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SlackCapabilitiesView({
  capabilities,
  error,
}: {
  capabilities?: SlackToolCapabilities;
  error?: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <section className="space-y-3">
      <p className="text-sm text-muted-foreground">{pageText("readSearchAndActInSlackSomeActions_969f16")}</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!capabilities && !error && (
        <p role="status" className="text-sm text-muted-foreground">{pageText("checkingSlackPermissions_df50f9")}</p>
      )}
      {capabilities && (
        <>
          {capabilities.missingScopes.length > 0 && (
            <div className="rounded-lg border border-border bg-muted p-3 space-y-2">
              <p className="text-sm font-medium">{pageText("addPermissionsToUnlockMoreTools_56fec3")}</p>
              <p className="text-sm">{pageText("yourExistingConnectionStillWorksIn_309485")}{" "}
                <a
                  className="underline underline-offset-4"
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noreferrer"
                >{pageText("slackAppSettings_2f0772")}</a>{pageText("chooseYourAppOpenOAuthPermissionsAddThese_2c9b12")}</p>
              <p className="text-xs font-mono break-words">
                {capabilities.missingScopes.join(", ")}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function SlackSearchView({
  status,
  onConnect,
  onDisconnect,
  onConfigure,
}: {
  status: SlackSearchStatus;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConfigure: (input: {
    clientId: string;
    clientSecret: string;
  }) => Promise<void>;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const [clientId, setClientId] = useState(status.clientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const perform = async (action: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        describeError(e).body,
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{pageText("yourSlackSearchAccess_af9c7e")}</h3>
      <p className="text-sm text-muted-foreground">{pageText("optionalPersonalAuthorizationEnablesPrivateSearchOnSupported_dc3e68")}</p>
      {!status.nativeSearchAvailable && (
        <p role="status" className="text-sm text-muted-foreground">
          {status.limitation}
        </p>
      )}
      {status.connected ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{pageText("slackSearchConnected_f94901")}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void perform(onDisconnect)}
          >{pageText("disconnectSearch_a49eb6")}</Button>
        </div>
      ) : (
        <Button
          variant="outline"
          disabled={pending || !status.configured}
          onClick={() => void perform(onConnect)}
        >{pageText("connectSlackSearch_821682")}</Button>
      )}
      {!status.configured && (
        <p className="text-sm text-muted-foreground">{pageText("aConnectionManagerNeedsToConfigureYourSlack_186c9e")}</p>
      )}
      {status.canConfigure && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{pageText("oauthAppConfigurationForConnectionManagers_a5f61c")}</summary>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void perform(async () => {
                await onConfigure({ clientId, clientSecret });
                setClientSecret("");
              });
            }}
          >
            <p className="text-sm">{pageText("inSlackAppSettingsAddThisRedirectURL_883db5") + " "}<code>search:read.public</code>,{" "}
              <code>search:read.private</code>{" " + pageText("and_cffa50")}{" "}
              <code>search:read.files</code>{pageText("findClientIDAndClientSecretUnderBasic_72f18d")}</p>
            <p className="text-xs font-mono break-all">
              {status.redirectUri ?? pageText("configureAPublicHTTPSURLFirst_7222ce")}
            </p>
            <div className="space-y-2">
              <label htmlFor={`${id}-client`}>{pageText("clientID_a766cd")}</label>
              <Input
                id={`${id}-client`}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`${id}-secret`}>{pageText("clientSecret_2c4e1b")}</label>
              <Input
                id={`${id}-secret`}
                type="password"
                autoComplete="new-password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                size="sm"
                disabled={pending || !clientId || !clientSecret}
              >{pageText("saveOAuthConfiguration_eaaad0")}</Button>
            </div>
          </form>
        </details>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
export function SlackToolsSettings({
  companyId,
  endpointId,
}: {
  companyId: string;
  endpointId: string;
}) {
  const query = useQuery({
    queryKey: ["slack-capabilities", companyId, endpointId],
    queryFn: () => slackToolsApi.capabilities(companyId, endpointId),
    staleTime: 60_000,
  });
  const view = useQueryView(query);
  return (
    <div className="space-y-3">
      <SlackCapabilitiesView
        capabilities={query.data}
        error={view.kind === "error" ? describeError(query.error).body : undefined}
      />

    </div>
  );
}
export function SlackSearchAccess({
  companyId,
  endpointId,
}: {
  companyId: string;
  endpointId: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const query = useQuery({
    queryKey: ["slack-search", companyId, endpointId],
    queryFn: () => slackToolsApi.search(companyId, endpointId),
  });
  const authorization = useAuthorizationWindow();
  const view = useQueryView(query);
  if (view.kind === "error")
    return (
      <QueryErrorState
        error={query.error}
        action="load Slack search access"
        onRetry={view.retry}
        retrying={view.isFetching}
      />
    );
  if (!query.data)
    return (
      <p role="status" className="text-sm text-muted-foreground">{pageText("loadingSearchAccess_7f8ee6")}</p>
    );
  return (<>
    {authorization.fallback}
    <SlackSearchView
      status={query.data}
      onConnect={async () => {
        authorization.reserve();
        try {
          const result = await slackToolsApi.connect(companyId, endpointId);
          await authorization.open(result.url);
        } catch (error) { authorization.cancel(); throw error; }
      }}
      onDisconnect={async () => {
        await slackToolsApi.disconnect(companyId, endpointId);
        await query.refetch();
      }}
      onConfigure={async (input) => {
        await slackToolsApi.configure(companyId, endpointId, input);
        await query.refetch();
      }}
    />
  </>);
}
