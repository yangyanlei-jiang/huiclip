import { useTranslation as usePageTranslation } from "@/i18n";
import {
  Clock3,
  LoaderCircle,
  Monitor,
  MoreHorizontal,
  RefreshCw,
  Square,
  X,
} from "lucide-react";
import {
  BROWSER_USE_IDLE_MS,
  BROWSER_USE_VIEWPORT_PRESETS,
  type BrowserUseViewportPreset,
  type BrowserUseControl,
  type TaskBrowser,
} from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Session controls stay below the viewport; the countdown appears only near expiry. */
export function TaskBrowserFooter({
  browser,
  now,
  disabled = false,
  onControl,
  onReconnect,
  viewport = "fit",
  controlledElsewhere = false,
  resizing = false,
  resizeAvailable = true,
  onResize,
}: {
  browser: TaskBrowser;
  now: number;
  disabled?: boolean;
  onControl: (action: BrowserUseControl) => void;
  onReconnect: () => void;
  viewport?: BrowserUseViewportPreset;
  controlledElsewhere?: boolean;
  resizing?: boolean;
  resizeAvailable?: boolean;
  onResize: (preset: BrowserUseViewportPreset) => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const live = browser.status === "running" || browser.status === "idle";
  const expiry = browser.expiresAt ? Date.parse(browser.expiresAt) : Infinity;
  const idleDeadline = browser.idleDeadline
    ? Date.parse(browser.idleDeadline)
    : Infinity;
  const deadline = Math.min(idleDeadline, expiry);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const closingSoon = browser.status === "idle" && seconds <= 5 * 60;
  const canExtend =
    browser.status === "idle" && expiry > idleDeadline && deadline > now;
  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const sizeLabel =
    viewport === "fit"
      ? "Fit to pane"
      : (BROWSER_USE_VIEWPORT_PRESETS.find((p) => p.id === viewport)?.label ??
        "Default");
  if (!live) return null;

  return (
    <footer
      aria-label={pageText("browserSession_cc021a")}
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground"
    >
      {closingSoon && (
        <span
          role="timer"
          aria-live="off"
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Clock3 className="size-3" aria-hidden="true" />
          {seconds > 0 ? (
            <>{pageText("closesIn_86f627")}{" "}
              <span className="font-mono tabular-nums">{countdown}</span>
            </>
          ) : (
            pageText("closing_0f0a55")
          )}
        </span>
      )}
      {controlledElsewhere && viewport === "fit" && (
        <span>{pageText("sizeFollowsAnotherViewer_dbc831")}</span>
      )}
      {resizing ? (
        <span role="status" className="flex items-center gap-1">
          <LoaderCircle
            className="size-3 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />{pageText("resizing_f76c48")}</span>
      ) : (
        browser.status === "running" && <span>{pageText("browsing_95ae28")}</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        {closingSoon && canExtend && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="xs"
                variant="ghost"
                disabled={disabled}
                onClick={() => onControl("keep_open")}
              >{pageText("keepBrowsing_07d18c")}</Button>
            </TooltipTrigger>
            <TooltipContent>{pageText("keepThisBrowserOpenForUpTo_bfc904") + " "}{BROWSER_USE_IDLE_MS / 60000}{" "}{pageText("moreMinutes_a04407")}</TooltipContent>
          </Tooltip>
        )}
        {browser.status === "running" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="xs"
                variant="ghost"
                disabled={disabled}
                onClick={() => onControl("cancel")}
              >
                <Square aria-hidden="true" />{" " + pageText("stopBrowsing_95b654")}</Button>
            </TooltipTrigger>
            <TooltipContent>{pageText("stopTheAgentSBrowserWorkAndLeave_350cd1")}</TooltipContent>
          </Tooltip>
        )}
        {live && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={pageText("browserOptions_a7851c")}
                disabled={disabled}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-64">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={resizing || !resizeAvailable}>
                  <Monitor aria-hidden="true" />
                  <span>{pageText("browserSize_be83dd")}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {sizeLabel}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64">
                  <DropdownMenuLabel>{pageText("browserSize_be83dd")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={viewport}
                    onValueChange={(value) =>
                      onResize(value as BrowserUseViewportPreset)
                    }
                  >
                    <DropdownMenuRadioItem
                      value="fit"
                      onSelect={() => {
                        if (viewport === "fit") onResize("fit");
                      }}
                    >{pageText("fitToPane_9ca8ae")}</DropdownMenuRadioItem>
                    {controlledElsewhere && (
                      <DropdownMenuItem onSelect={() => onResize("fit")}>{pageText("fitToThisPaneInstead_b33d71")}</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioItem
                      value="default"
                      onSelect={() => {
                        if (viewport === "default") onResize("default");
                      }}
                    >{pageText("browserDefault_709d49")}</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    {BROWSER_USE_VIEWPORT_PRESETS.map((preset) => (
                      <DropdownMenuRadioItem
                        key={preset.id}
                        value={preset.id}
                        onSelect={() => {
                          if (viewport === preset.id) onResize(preset.id);
                        }}
                      >
                        <span>{preset.label}</span>
                        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                          {preset.width} × {preset.height}
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onReconnect} className="items-start">
                <RefreshCw className="mt-0.5" aria-hidden="true" />
                <span className="flex flex-col gap-1">
                  <span>{pageText("reconnectView_19b7ce")}</span>
                  <span className="text-xs font-normal text-muted-foreground">{pageText("reloadTheLiveViewBrowserWorkKeepsRunning_6a5425")}</span>
                </span>
              </DropdownMenuItem>
              {canExtend && (
                <DropdownMenuItem
                  onSelect={() => onControl("keep_open")}
                  className="items-start"
                >
                  <Clock3 className="mt-0.5" aria-hidden="true" />
                  <span className="flex flex-col gap-1">
                    <span>{pageText("keepBrowserOpen_025450")}</span>
                    <span className="text-xs font-normal text-muted-foreground">{pageText("keepItOpenForUpTo10More_231ede")}</span>
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onControl("end")}
                className="items-start"
              >
                <X className="mt-0.5" aria-hidden="true" />
                <span className="flex flex-col gap-1">
                  <span>{pageText("closeBrowser_a943ce")}</span>
                  <span className="text-xs font-normal text-muted-foreground">{pageText("endThisBrowserAndStopAnyBrowsing_901c15")}</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </footer>
  );
}
