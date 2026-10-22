"use client";

import {
  Bell,
  Bookmark,
  CalendarClock,
  Compass,
  Gift,
  Home,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  Mail,
  MessageSquareHeart,
  Plus,
  Send,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/display";
import { Textarea } from "@/components/ui/form";
import { Dropdown, MenuItem, Modal, Toaster } from "@/components/ui/overlay";
import { DEMO_PERSONAS } from "@/data/seed";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { manageableProjects, pendingIntentCount, roleText, unreadConversations, unreadNotifications, useDB, useViewer } from "@/store/selectors";
import { GlobalHosts } from "./global-hosts";
import { PersonaSwitcher } from "./persona-switcher";

const NAV = [
  { href: "/", label: "首页", match: (p: string) => p === "/" },
  { href: "/discover", label: "发现", match: (p: string) => p.startsWith("/discover") },
  { href: "/feed", label: "信息流", match: (p: string) => p.startsWith("/feed") },
  { href: "/events", label: "活动", match: (p: string) => p.startsWith("/events") },
  { href: "/demo-day", label: "月度路演", match: (p: string) => p.startsWith("/demo-day") },
  { href: "/lists", label: "榜单", match: (p: string) => p.startsWith("/lists") },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/welcome") || pathname.startsWith("/digest/preview");
  const chat = /^\/inbox\/[^/]+/.test(pathname);
  return (
    <div className="flex min-h-screen flex-col">
      {bare ? null : <TopNav />}
      <main className={cn("flex-1", !bare && !chat && "pb-20 md:pb-0")}>{children}</main>
      {bare || chat ? null : <MobileTabBar />}
      <Toaster />
      <LoginPrompt />
      <GlobalHosts />
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Pitch 首页">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[15px] font-black text-highlight">P</span>
      <span className="text-lg font-bold tracking-tight text-gray-900">Pitch</span>
      <span className="hidden rounded border border-gray-200 px-1 text-[10px] font-semibold text-gray-500 sm:inline">原型</span>
    </Link>
  );
}

function CountDot({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function TopNav() {
  const pathname = usePathname();
  const db = useDB();
  const viewer = useViewer();
  const openCreate = useApp((s) => s.openCreate);
  const requireLogin = useApp((s) => s.requireLogin);
  const inboxCount = viewer ? unreadConversations(db, viewer.id) + pendingIntentCount(db, viewer.id) : 0;
  const notiCount = viewer ? unreadNotifications(db, viewer.id) : 0;

  return (
    <header className="sticky top-0 z-[60] border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-8">
        <Logo />
        <nav className="ml-4 hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-2 text-[15px] font-semibold transition-colors",
                n.match(pathname) ? "bg-gray-50 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <PersonaSwitcher />
          {viewer ? (
            <>
              <Button variant="primary" size="sm" iconLeft={Plus} onClick={openCreate} className="hidden md:inline-flex">
                创建项目
              </Button>
              <Link href="/inbox" className="relative hidden rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 md:inline-flex" aria-label="收件箱">
                <Inbox size={20} />
                <CountDot n={inboxCount} />
              </Link>
              <Link href="/notifications" className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700" aria-label="通知">
                <Bell size={20} />
                <CountDot n={notiCount} />
              </Link>
              <UserMenu />
            </>
          ) : (
            <Button variant="primary" size="sm" iconLeft={LogIn} onClick={() => requireLogin("登录后可以关注项目、表达意向、写背书")}>
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const db = useDB();
  const viewer = useViewer();
  const router = useRouter();
  const setViewer = useApp((s) => s.setViewer);
  const [fbOpen, setFbOpen] = useState(false);
  if (!viewer) return null;
  const projects = manageableProjects(db, viewer.id);
  const go = (href: string, close: () => void) => {
    close();
    router.push(href);
  };
  return (
    <>
      <Dropdown
        width={272}
        trigger={() => (
          <button className="rounded-full focus-visible:focus-ring" aria-label="我的">
            <Avatar name={viewer.name} tone={viewer.avatarTone} size="md" />
          </button>
        )}
      >
        {(close) => (
          <div>
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 pt-2 pb-3">
              <Avatar name={viewer.name} tone={viewer.avatarTone} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{viewer.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {roleText(viewer)}
                  {viewer.org ? ` · ${viewer.org}` : ""}
                </p>
              </div>
            </div>
            <div className="py-1">
              <MenuItem icon={UserRound} onClick={() => go(`/u/${viewer.handle}`, close)}>
                我的主页
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} icon={LayoutDashboard} onClick={() => go(`/dashboard/${p.slug}`, close)} desc="项目工作台">
                  {p.name}
                </MenuItem>
              ))}
              <MenuItem icon={Send} onClick={() => go("/me/intents", close)}>
                我的意向
              </MenuItem>
              {viewer.role === "investor" ? (
                <MenuItem icon={Bookmark} onClick={() => go("/watchlist", close)}>
                  观察清单
                </MenuItem>
              ) : null}
              <MenuItem icon={CalendarClock} onClick={() => go("/office-hours", close)}>
                答疑时段
              </MenuItem>
              <MenuItem icon={Gift} onClick={() => go("/rewards", close)}>
                任务中心
              </MenuItem>
              <MenuItem icon={Mail} onClick={() => go("/digest", close)}>
                周报预览
              </MenuItem>
            </div>
            {viewer.isOps ? (
              <div className="border-t border-gray-100 py-1">
                <MenuItem icon={Shield} onClick={() => go("/ops", close)}>
                  运营撮合看板
                </MenuItem>
              </div>
            ) : null}
            <div className="border-t border-gray-100 py-1">
              <MenuItem
                icon={MessageSquareHeart}
                onClick={() => {
                  close();
                  setFbOpen(true);
                }}
              >
                给 Pitch 提产品建议
              </MenuItem>
              <MenuItem
                icon={LogIn}
                onClick={() => {
                  close();
                  setViewer(null);
                }}
              >
                退出登录
              </MenuItem>
            </div>
          </div>
        )}
      </Dropdown>
      <ProductFeedbackModal open={fbOpen} onClose={() => setFbOpen(false)} />
    </>
  );
}

/** 原心愿墙里“产品建议”类心愿，单独保留为反馈入口。 */
function ProductFeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const submit = useApp((s) => s.submitProductFeedback);
  const toast = useApp((s) => s.toast);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="给 Pitch 提产品建议"
      desc="原心愿墙里的“产品建议”统一收到这里，运营每周汇总回复。"
      icon={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-8 ring-brand-50"><LifeBuoy size={22} /></span>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="sm:w-auto">
            取消
          </Button>
          <Button
            variant="primary"
            disabled={text.trim().length < 5}
            onClick={() => {
              submit(text.trim());
              setText("");
              onClose();
              toast({ tone: "success", title: "已收到你的建议", body: "我们会在周报里同步处理进展" });
            }}
          >
            提交建议
          </Button>
        </>
      }
    >
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="比如：希望项目页可以挂视频 Demo" maxCount={300} rows={5} hint="至少 5 个字" />
    </Modal>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  const db = useDB();
  const viewer = useViewer();
  const openCreate = useApp((s) => s.openCreate);
  const inboxCount = viewer ? unreadConversations(db, viewer.id) + pendingIntentCount(db, viewer.id) : 0;
  const items = [
    { href: "/", label: "首页", icon: Home, active: pathname === "/" },
    { href: "/discover", label: "发现", icon: Compass, active: pathname.startsWith("/discover") },
    { href: "#create", label: "创建", icon: Plus, active: false },
    { href: "/inbox", label: "收件箱", icon: Inbox, active: pathname.startsWith("/inbox"), count: inboxCount },
    { href: viewer ? `/u/${viewer.handle}` : "#login", label: "我的", icon: UserRound, active: pathname.startsWith("/u/") },
  ];
  const requireLogin = useApp((s) => s.requireLogin);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          if (it.href === "#create") {
            return (
              <button key={it.label} onClick={openCreate} className="flex flex-col items-center justify-center py-2" aria-label="创建项目">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-highlight shadow-sm">
                  <Plus size={20} strokeWidth={2.5} />
                </span>
              </button>
            );
          }
          if (it.href === "#login") {
            return (
              <button key={it.label} onClick={() => requireLogin("登录后查看你的主页")} className="flex flex-col items-center gap-0.5 py-2 text-gray-500">
                <Icon size={22} />
                <span className="text-[11px] font-medium">{it.label}</span>
              </button>
            );
          }
          return (
            <Link key={it.label} href={it.href} className={cn("relative flex flex-col items-center gap-0.5 py-2", it.active ? "text-gray-900" : "text-gray-500")}>
              <span className="relative">
                <Icon size={22} strokeWidth={it.active ? 2.4 : 2} />
                <CountDot n={it.count ?? 0} />
              </span>
              <span className="text-[11px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** 游客点击需要登录的操作时弹出；原型里用演示身份代替真实登录。 */
function LoginPrompt() {
  const open = useApp((s) => s.ui.loginPromptOpen);
  const reason = useApp((s) => s.ui.loginReason);
  const close = useApp((s) => s.closeLoginPrompt);
  const setViewer = useApp((s) => s.setViewer);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  return (
    <Modal open={open} onClose={close} size="sm" title={reason || "登录 Pitch"} desc="浏览不需要登录；关注、表达意向、背书和创建项目需要一个身份。">
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setViewer("u-newbie");
            close();
            router.push("/welcome");
          }}
        >
          微信一键登录（新用户）
        </Button>
        <p className="mt-3 mb-1 text-xs font-medium text-gray-500">或以演示身份登录</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_PERSONAS.filter((p) => p.key !== "guest" && p.key !== "u-newbie").map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setViewer(p.key);
                close();
                toast({ tone: "success", title: `已登录为「${p.label}」` });
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-gray-300 hover:bg-gray-50"
            >
              <span className="block text-sm font-semibold text-gray-800">{p.label}</span>
              <span className="block truncate text-xs text-gray-500">{p.desc}</span>
            </button>
          ))}
        </div>
        <Badge tone="brand" className="mt-3 self-start">
          原型说明：正式产品沿用 Pitch 现有登录
        </Badge>
      </div>
    </Modal>
  );
}
