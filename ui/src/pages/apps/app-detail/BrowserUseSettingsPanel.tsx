import { useTranslation as usePageTranslation } from "@/i18n";
import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ConnectionGrantsResponse,
  ToolConnection,
} from "@paperclipai/shared";
import { browserUseApi } from "@/api/browser-use";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

function CredentialSettings({
  companyId,
  grantId,
}: {
  companyId: string;
  grantId: string;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const id = useId();
  const saved = useQuery({
    queryKey: ["browser-use-cloud-settings", grantId],
    queryFn: () => browserUseApi.settings(companyId, grantId),
  });
  const profiles = useQuery({
    queryKey: ["browser-use-cloud-profiles", grantId],
    queryFn: () => browserUseApi.profiles(companyId, grantId),
  });
  const savedView = useQueryView(saved);
  const profilesView = useQueryView(profiles);
  const [allowed, setAllowed] = useState<string[]>([]);
  const [limit, setLimit] = useState("");
  useEffect(() => {
    if (saved.data) {
      setAllowed(saved.data.allowedProfileIds);
      setLimit(saved.data.maxCostUsd?.toString() ?? "");
    }
  }, [saved.data]);
  const save = useMutation({
    mutationFn: () =>
      browserUseApi.saveSettings(companyId, grantId, {
        allowedProfileIds: allowed,
        maxCostUsd: limit ? Number(limit) : null,
      }),
    onSuccess: () => {
      void saved.refetch();
    },
  });
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${id}-limit`}>{pageText("maximumCostPerBrowserRunUSD_e24647")}</Label>
        <Input
          id={`${id}-limit`}
          type="number"
          min="0"
          step="0.01"
          value={limit}
          placeholder={pageText("useTheRemainingPaperclipBudget_eca499")}
          onChange={(e) => setLimit(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">{pageText("theAgentCanChooseALowerLimitPaperclip_6c4ba6")}</p>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{pageText("allowedSavedProfiles_5f7341")}</legend>
        <p className="text-sm text-muted-foreground">{pageText("freshBrowsersAreTheDefaultSelectedProfilesLet_66c575")}{" "}
          <a
            href="https://cloud.browser-use.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Browser Use Cloud
          </a>
          .
        </p>
        {profiles.data?.map((p) => (
          <Label key={p.id} className="flex items-center gap-2">
            <Checkbox
              checked={allowed.includes(p.id)}
              onCheckedChange={(checked) =>
                setAllowed((previous) =>
                  checked
                    ? [...previous, p.id]
                    : previous.filter((id) => id !== p.id),
                )
              }
            />
            {p.name ?? p.id}
          </Label>
        ))}
        {profiles.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{pageText("noSavedProfiles_c56c16")}</p>
        )}
        {(profiles.isLoading || profilesView.kind === "reconnecting") && (
          <p className="text-sm text-muted-foreground">{pageText("loadingProfiles_b8f34c")}</p>
        )}
        {profilesView.kind === "error" && (
          <QueryErrorState
            size="inline"
            error={profiles.error}
            action="load profiles"
            onRetry={profilesView.retry}
            retrying={profilesView.isFetching}
          />
        )}
      </fieldset>
      {savedView.kind === "error" ? (
        <QueryErrorState
          error={saved.error}
          action="load browser settings"
          onRetry={savedView.retry}
          retrying={savedView.isFetching}
        />
      ) : null}
      {save.error ? (
        <p role="alert" className="text-sm text-destructive">{pageText("couldNotSaveBrowserSettingsCheckYourCredential_e61057")}</p>
      ) : null}
      {save.isSuccess && (
        <p role="status" className="text-sm text-muted-foreground">{pageText("browserSettingsSaved_b20e44")}</p>
      )}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={
            !saved.data ||
            save.isPending ||
            Boolean(
              limit && (!Number.isFinite(Number(limit)) || Number(limit) <= 0),
            )
          }
          onClick={() => save.mutate()}
        >{pageText("saveBrowserSettings_883c4e")}</Button>
      </div>
    </div>
  );
}
export function BrowserUseSettingsPanel({
  connection,
  grants,
}: {
  connection: ToolConnection;
  grants?: ConnectionGrantsResponse;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const eligible =
    grants?.grants.filter(
      (g) =>
        g.status === "active" &&
        ((g.kind === "organization" && g.capabilities?.canEditAudience) ||
          g.subjectUserId === grants.currentUserId ||
          g.createdByUserId === grants.currentUserId),
    ) ?? [];
  const [selected, setSelected] = useState("");
  const grantId = selected || eligible[0]?.id;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{pageText("browserSettings_27e3c5")}</h2>
      {eligible.length > 1 && (
        <Label className="flex flex-col gap-2">{pageText("credential_8bede3")}<select
            value={grantId}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-md border bg-background p-2"
          >
            {eligible.map((g, i) => (
              <option key={g.id} value={g.id}>
                {g.kind === "user" ? pageText("personal_40f073") : pageText("shared_50d0d8")}{" " + pageText("credential_bdfa1c") + " "}{i + 1}
              </option>
            ))}
          </select>
        </Label>
      )}
      {grantId ? (
        <CredentialSettings
          key={grantId}
          companyId={connection.companyId}
          grantId={grantId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{pageText("theCredentialOwnerOrASharedConnectionManager_612454")}</p>
      )}
    </section>
  );
}
