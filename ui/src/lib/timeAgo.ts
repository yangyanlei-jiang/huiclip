import { t as timeText } from "@/i18n";
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.round((now - then) / 1000);

  if (seconds < MINUTE) return timeText("interface:relativeNow");
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return timeText("interface:relativeAgo_m", { value: m });
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return timeText("interface:relativeAgo_h", { value: h });
  }
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return timeText("interface:relativeAgo_d", { value: d });
  }
  if (seconds < MONTH) {
    const w = Math.floor(seconds / WEEK);
    return timeText("interface:relativeAgo_w", { value: w });
  }
  const mo = Math.floor(seconds / MONTH);
  return timeText("interface:relativeAgo_mo", { value: mo });
}
