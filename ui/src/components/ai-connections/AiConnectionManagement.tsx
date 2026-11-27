import { useTranslation as usePageTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";

export function AiConnectionLegacyNotice({
  onAdopt,
  readOnly = false,
}: {
  onAdopt: () => void;
  readOnly?: boolean;
}) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">{pageText("existingAuthenticationNotManagedByConnections_2c1af4")}</h3>
      <p className="text-sm text-muted-foreground">{pageText("thisAgentKeepsItsCurrentAuthenticationUntilYou_ae66ae")}</p>
      {!readOnly && (
        <Button variant="outline" className="self-start" onClick={onAdopt}>{pageText("chooseAManagedConnection_586d7c")}</Button>
      )}
    </div>
  );
}
