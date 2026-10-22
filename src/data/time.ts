import { NOW } from "./constants";

const NOW_MS = new Date(NOW).getTime();
const DAY = 86_400_000;

/** 相对“原型当前时间”往前推若干天/小时，返回 ISO 字符串。 */
export function ago(days: number, hours = 0): string {
  return new Date(NOW_MS - days * DAY - hours * 3_600_000).toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nowMs(): number {
  return NOW_MS;
}

/** 原型里“现在”固定为 NOW，但用户新产生的数据使用真实时间，两者取较晚值来比较。 */
export function effectiveNow(): number {
  return Math.max(NOW_MS, Date.now());
}

export function relativeTime(iso: string): string {
  const diff = effectiveNow() - new Date(iso).getTime();
  if (diff < 0) {
    const ahead = -diff;
    if (ahead < 3_600_000) return `${Math.max(1, Math.round(ahead / 60_000))} 分钟后`;
    if (ahead < DAY) return `${Math.round(ahead / 3_600_000)} 小时后`;
    return `${Math.round(ahead / DAY)} 天后`;
  }
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} 分钟前`;
  if (diff < DAY) return `${Math.round(diff / 3_600_000)} 小时前`;
  if (diff < 30 * DAY) return `${Math.round(diff / DAY)} 天前`;
  if (diff < 365 * DAY) return `${Math.round(diff / (30 * DAY))} 个月前`;
  return `${Math.round(diff / (365 * DAY))} 年前`;
}

const fmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
});
const fmtTime = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const fmtWeek = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", weekday: "short" });

export function formatDate(iso: string): string {
  return fmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return fmtTime.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${fmtWeek.format(new Date(iso))} ${formatTime(iso)}`;
}

export function daysSince(iso: string): number {
  return Math.floor((effectiveNow() - new Date(iso).getTime()) / DAY);
}

/** 北京时间所在月份，形如 "2026-10"。 */
export function monthOf(iso: string): string {
  const local = new Date(new Date(iso).getTime() + 8 * 3_600_000);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isSameMonth(iso: string, month: string): boolean {
  return monthOf(iso) === month;
}
