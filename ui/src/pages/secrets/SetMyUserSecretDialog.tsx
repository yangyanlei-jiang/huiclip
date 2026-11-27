import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanySecret, UserSecretDefinition } from "@paperclipai/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { secretsApi } from "../../api/secrets";
import { queryKeys } from "../../lib/queryKeys";
import { useToastActions } from "../../context/ToastContext";
import { UserSecretChip } from "./user-secret-presentation";
import { describeError } from "@/api/errors";

/**
 * Shared "set my value" dialog for a user-secret definition. Used both from the
 * Secrets → My secrets tab and from the missing-required-secret warning surfaces
 * (task run / issue failure), so a user can satisfy a required secret from either
 * place with identical behavior.
 */
export function SetMyUserSecretDialog({
  companyId,
  definition,
  existingSecret,
  open,
  onOpenChange,
  onSaved,
}: {
  companyId: string;
  definition: UserSecretDefinition | null;
  existingSecret?: CompanySecret | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (secret: CompanySecret) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [value, setValue] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isExternal = definition?.managedMode === "external_reference";

  useEffect(() => {
    if (open) {
      setValue("");
      setExternalRef("");
      setError(null);
    }
  }, [open, definition?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!definition) throw new Error("No definition selected");
      const payload = isExternal
        ? { externalRef: externalRef.trim() }
        : { value: value.trim() };
      if (existingSecret) {
        // A stored value already exists → rotate it in place.
        return secretsApi.rotateMyUserSecret(companyId, existingSecret.id, payload);
      }
      return secretsApi.createMyUserSecret(companyId, {
        definitionId: definition.id,
        definitionKey: definition.key,
        ...payload,
      });
    },
    onSuccess: (secret) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.myUserSecrets(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.userDefinitions(companyId) });
      pushToast({
        title: existingSecret ? interfaceNotice("interface:valueUpdated_2f7775") : interfaceNotice("interface:valueSaved_f0a0ca"),
        body: definition?.name,
        tone: "success",
      });
      onSaved?.(secret);
      onOpenChange(false);
    },
    onError: (err) => {
      setError(
        describeError(err).body,
      );
    },
  });

  const canSave = isExternal ? externalRef.trim().length > 0 : value.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {existingSecret ? pageText("updateYourValue_119edd") : pageText("setYourValue_97028f")}
            <UserSecretChip />
          </DialogTitle>
          <DialogDescription>
            {definition ? (
              <>{pageText("thisValueIsYoursOnlyItIsUsed_381321") + " "}<span className="font-mono">{definition.key}</span>.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {definition ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/20 p-3 text-xs">
              <div className="font-medium text-foreground">{definition.name}</div>
              {definition.description ? (
                <p className="mt-1 text-muted-foreground">{definition.description}</p>
              ) : null}
              {definition.usageGuidance ? (
                <p className="mt-1 text-muted-foreground">{definition.usageGuidance}</p>
              ) : null}
            </div>

            {isExternal ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">{translateUi("interfaceCopy.externalReference")}</label>
                <Input
                  value={externalRef}
                  onChange={(event) => setExternalRef(event.target.value)}
                  placeholder={pageText("providerReferenceOrARN_8fdd1c")}
                  className="font-mono text-sm"
                  autoFocus
                />
                <p className="text-(length:--text-micro) text-muted-foreground">{pageText("pointsAtYourOwnCredentialInTheConfigured_8821fd")}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">{pageText("yourValue_990b78")}</label>
                <Textarea
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={pageText("pasteYourTokenOrCredential_df993f")}
                  className="font-mono text-sm min-h-(--sz-80px)"
                  autoFocus
                />
                <p className="text-(length:--text-micro) text-muted-foreground">{pageText("storedEncryptedNeverShownBackToAnyoneIncluding_cd050c")}</p>
              </div>
            )}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>{translateUi("interfaceCopy.cancel")}</Button>
          <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending}>
            {save.isPending ? pageText("saving_56a228") : existingSecret ? pageText("updateValue_af2072") : pageText("saveValue_f63b76")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
