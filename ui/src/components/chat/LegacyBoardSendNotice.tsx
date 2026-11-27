import { useTranslation as usePageTranslation } from "@/i18n";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function LegacyBoardSendNotice({ onDiscard }: { onDiscard: () => void }) {
  const { t: pageText } = usePageTranslation("interface");
  return <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button size="sm" variant="outline">{pageText("discardSavedDeliveryRecord_c6f4e1")}</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{pageText("discardSavedDeliveryRecord_d72883")}</AlertDialogTitle>
        <AlertDialogDescription>{pageText("firstCheckActivityDiscardingThisBrowserRecordDoes_496ab5")}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{pageText("keepRecord_0f65a5")}</AlertDialogCancel>
        <AlertDialogAction onClick={onDiscard}>{pageText("discardRecord_42414b")}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
