"use client";

import {
  Bell,
  BellOff,
  CalendarClock,
  Check,
  CheckCheck,
  Gift,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Send,
  Settings2,
  Shield,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import { buildDigest, DIGEST_ROLE_LABEL, digestPeriod, digestRoleOf } from "@/components/biz/digest";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";
import { NOTIFICATION_GROUPS, NOTIFICATION_TYPES, type NotificationGroup } from "@/data/constants";
import { daysSince, formatDateTime, relativeTime } from "@/data/time";
import type { Notification, NotificationType } from "@/data/types";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { notifyPrefsOf, useApp } from "@/store/app-store";
import { useDB, useViewer } from "@/store/selectors";

type Tab = "all" | "unread" | NotificationGroup;

const ICON: Record<NotificationType, { icon: LucideIcon; cls: string }> = {
  intent: { icon: Send, cls: "bg-brand-50 text-brand-600" },
  conversation: { icon: MessageSquare, cls: "bg-brand-50 text-brand-600" },
  member: { icon: UserPlus, cls: "bg-success-50 text-success-600" },
  officehours: { icon: CalendarClock, cls: "bg-success-50 text-success-600" },
  update: { icon: Megaphone, cls: "bg-gray-100 text-gray-600" },
  reward: { icon: Gift, cls: "bg-highlight-soft text-highlight-ink" },
  system: { icon: Shield, cls: "bg-gray-100 text-gray-600" },
};

export default function NotificationsPage() {
  return (
    <Suspense>
      <Notifications />
    </Suspense>
  );
}

function bucket(n: Notification) {
  const d = daysSince(n.at);
  return d < 1 ? "今天" : d < 7 ? "近 7 天" : "更早";
}

function Notifications() {
  const db = useDB();
  const viewer = useViewer();
  const router = useRouter();
  const markRead = useApp((s) => s.markNotificationRead);
  const markAll = useApp((s) => s.markAllNotificationsRead);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const [tab, setTab] = useQueryParam<Tab>("tab", "all");

  if (!viewer) {
    return (
      <Page narrow>
        <Card className="mt-10">
          <EmptyState
            icon={Bell}
            title="登录后查看通知"
            desc="意向、对话和项目进展都会出现在这里。"
            action={
              <Button variant="primary" onClick={() => requireLogin("登录后查看通知")}>
                登录
              </Button>
            }
          />
        </Card>
      </Page>
    );
  }

  const mine = db.notifications.filter((n) => n.userId === viewer.id).sort((a, b) => b.at.localeCompare(a.at));
  const unread = mine.filter((n) => !n.read).length;
  const groupOf = (n: Notification) => NOTIFICATION_TYPES[n.type].group;
  const list = tab === "all" ? mine : tab === "unread" ? mine.filter((n) => !n.read) : mine.filter((n) => groupOf(n) === tab);
  const groups = ["今天", "近 7 天", "更早"].map((label) => ({ label, items: list.filter((n) => bucket(n) === label) })).filter((g) => g.items.length);

  const prefs = notifyPrefsOf(db, viewer.id);
  const role = digestRoleOf(db, viewer);
  const digest = buildDigest(db, viewer, role);
  const period = digestPeriod();
  const wechatLive = prefs.wechatBound && prefs.wechatOn;

  const open = (n: Notification) => {
    markRead(n.id);
    router.push(n.link);
  };

  return (
    <Page>
      <PageHeader
        title="通知"
        desc="站内保留全部通知。需要你回应的事同时推送到服务号，其余汇总进每周一的周报。"
        actions={
          <>
            <Button
              iconLeft={CheckCheck}
              disabled={!unread}
              onClick={() => {
                markAll();
                toast({ tone: "success", title: `${unread} 条通知已标为已读` });
              }}
            >
              全部标为已读
            </Button>
            <Button iconLeft={Settings2} href="/digest#instant">
              提醒设置
            </Button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "all", label: "全部" },
              { value: "unread", label: "未读", count: unread },
              ...(Object.keys(NOTIFICATION_GROUPS) as NotificationGroup[]).map((g) => ({ value: g, label: NOTIFICATION_GROUPS[g], dot: mine.some((n) => !n.read && groupOf(n) === g) })),
            ]}
          />

          {groups.length ? (
            <div className="mt-5 flex flex-col gap-6">
              {groups.map((g) => (
                <section key={g.label}>
                  <h2 className="mb-2 text-xs font-semibold text-gray-500">{g.label}</h2>
                  <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                    {g.items.map((n) => {
                      const ic = ICON[n.type];
                      return (
                        <li key={n.id} className={cn("group relative flex items-start gap-3 border-b border-gray-100 p-4 last:border-b-0", !n.read && "bg-brand-25/60")}>
                          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", ic.cls)}>
                            <ic.icon size={18} />
                          </span>
                          <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-['']">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className={cn("text-sm text-gray-900", !n.read ? "font-semibold" : "font-medium")}>{n.title}</span>
                              {!n.read ? <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="未读" /> : null}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-sm text-gray-600">{n.body}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                              <span title={formatDateTime(n.at)}>{relativeTime(n.at)}</span>
                              <span>· {NOTIFICATION_TYPES[n.type].label}</span>
                              {n.pushed ? (
                                <span className="inline-flex items-center gap-1 text-success-700">
                                  · <MessageCircle size={12} /> 已推送到服务号
                                </span>
                              ) : null}
                            </span>
                          </button>
                          {!n.read ? (
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className="relative z-10 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                              aria-label="标为已读"
                              title="标为已读"
                            >
                              <Check size={16} />
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <Card className="mt-5">
              {mine.length === 0 ? (
                <EmptyState icon={Bell} title="还没有通知" desc="关注项目、表达意向之后，进展会出现在这里。" action={<Button href="/discover">去发现页</Button>} />
              ) : tab === "unread" ? (
                <EmptyState icon={CheckCheck} tone="success" title="全部看完了" desc="新的通知会出现在这里。" />
              ) : (
                <EmptyState icon={BellOff} title={`没有${NOTIFICATION_GROUPS[tab as NotificationGroup]}类的通知`} action={<Button onClick={() => setTab("all")}>看全部</Button>} />
              )}
            </Card>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">每周一的周报</h2>
              <Badge tone="brand">{DIGEST_ROLE_LABEL[role]}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {prefs.frequency === "off"
                ? "你已关闭周报。"
                : digest?.kind === "founder"
                  ? `${digest.project.name}本周浏览 ${digest.views}，${digest.pending.length ? `${digest.pending.length} 条意向待回应` : "意向都已处理"}。`
                  : digest?.kind === "investor"
                    ? `观察清单 ${digest.fresh.length} 个项目有新动态，${digest.matches.length} 个符合偏好的新项目。`
                    : "本周值得看的项目和需求。"}
            </p>
            <p className="mt-2 text-xs text-gray-400">下一期 {formatDateTime(period.send)}</p>
            <Button size="sm" variant="secondary" iconLeft={Mail} href="/digest/preview" className="mt-3">
              预览周报
            </Button>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className={wechatLive ? "text-success-600" : "text-gray-400"} />
              <h2 className="text-base font-semibold text-gray-900">服务号即时推送</h2>
            </div>
            {wechatLive ? (
              <>
                <p className="mt-1 text-sm text-gray-500">这些类型发生时会推送到微信：</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {prefs.instant.length ? prefs.instant.map((t) => <Badge key={t}>{NOTIFICATION_TYPES[t].label}</Badge>) : <span className="text-sm text-gray-500">没有勾选任何类型</span>}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">{prefs.wechatBound ? "已关闭服务号推送，所有通知只在站内。" : "还没关注服务号，所有通知只在站内。"}</p>
            )}
            <Button size="sm" variant="link" href="/digest#instant" className="mt-3">
              修改
            </Button>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
