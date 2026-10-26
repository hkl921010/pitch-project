"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Handshake,
  Inbox as InboxIcon,
  Info,
  Lock,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, ProjectLogo } from "@/components/ui/display";
import { ChipSelect, Field, Input, Textarea } from "@/components/ui/form";
import { Drawer, Dropdown, MenuItem, Modal } from "@/components/ui/overlay";
import { Segmented } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatTime, relativeTime } from "@/data/time";
import type { Contact, Conversation, Message, Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import {
  conversationStatus,
  conversationsOf,
  getPerson,
  getProject,
  intentKindLabel,
  isConversationUnread,
  lastActivity,
  otherMember,
  pendingIntentCount,
  roleText,
  useDB,
  useViewer,
} from "@/store/selectors";

type Filter = "all" | "unread" | "match" | "closed";

function preview(m: Message | undefined, viewerId: string): string {
  if (!m) return "";
  if (m.system) return m.text;
  const body = m.attachment ? `[附件] ${m.attachment.name}` : m.text;
  return m.from === viewerId ? `你：${body}` : body;
}

/* ------------------------------------------------------------------ */
/* 会话列表                                                              */
/* ------------------------------------------------------------------ */

export function ConversationList({ activeId }: { activeId?: string }) {
  const db = useDB();
  const viewer = useViewer();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  if (!viewer) return null;
  const all = conversationsOf(db, viewer.id);
  const pending = pendingIntentCount(db, viewer.id);
  const counts = {
    unread: all.filter((c) => isConversationUnread(c, viewer.id)).length,
    match: all.filter((c) => c.status === "match_requested" || c.status === "pitch_following").length,
    closed: all.filter((c) => c.status === "closed").length,
  };
  const keyword = q.trim();
  const list = all.filter((c) => {
    if (filter === "unread" && !isConversationUnread(c, viewer.id)) return false;
    if (filter === "match" && c.status !== "match_requested" && c.status !== "pitch_following") return false;
    if (filter === "closed" && c.status !== "closed") return false;
    if (!keyword) return true;
    const other = otherMember(db, c, viewer.id);
    const project = getProject(db, c.projectId);
    return [other?.name, other?.org, project?.name].some((s) => s?.includes(keyword));
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">收件箱</h1>
          <span className="text-xs text-gray-500">{all.length} 个对话</span>
        </div>
        <Input inputSize="sm" icon={Search} placeholder="搜索人名、机构或项目" value={q} onChange={(e) => setQ(e.target.value)} />
        <Segmented<Filter>
          size="sm"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "全部" },
            { value: "unread", label: "未读", count: counts.unread },
            { value: "match", label: "撮合", count: counts.match },
            { value: "closed", label: "已结束", count: counts.closed },
          ]}
        />
      </div>
      {pending ? (
        <Link
          href="/me/intents?tab=received"
          className="mx-3 mt-3 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-25 px-3 py-2.5 text-sm hover:border-brand-300"
        >
          <Send size={16} className="text-brand-600" />
          <span className="flex-1 text-gray-700">
            <b className="text-gray-900">{pending}</b> 条意向等你回应，接受后会出现在这里
          </span>
          <span className="h-2 w-2 rounded-full bg-error-500" />
        </Link>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {list.length === 0 ? (
          <div className="px-4 py-8">
            {all.length === 0 ? (
              <EmptyState
                compact
                icon={InboxIcon}
                title="还没有对话"
                desc="你发出的意向被接受、或你接受了别人的意向后，对话会出现在这里"
                action={
                  <Button size="sm" variant="primary" href="/discover">
                    去发现页看看
                  </Button>
                }
              />
            ) : (
              <EmptyState
                compact
                icon={Search}
                title="没有符合条件的对话"
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setFilter("all");
                      setQ("");
                    }}
                  >
                    清空筛选
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          list.map((c) => <ConversationItem key={c.id} c={c} viewer={viewer} active={c.id === activeId} />)
        )}
      </div>
    </div>
  );
}

function ConversationItem({ c, viewer, active }: { c: Conversation; viewer: Person; active: boolean }) {
  const db = useDB();
  const other = otherMember(db, c, viewer.id);
  const project = getProject(db, c.projectId);
  const intent = db.intents.find((i) => i.id === c.intentId);
  const unread = isConversationUnread(c, viewer.id);
  const st = conversationStatus(c);
  return (
    <Link
      href={`/inbox/${c.id}`}
      className={cn("mx-2 flex gap-3 rounded-lg px-3 py-3 transition-colors", active ? "bg-gray-100" : "hover:bg-gray-50")}
    >
      <Avatar name={other?.name ?? "?"} tone={other?.avatarTone ?? 0} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm", unread ? "font-bold text-gray-900" : "font-semibold text-gray-800")}>{other?.name}</span>
          {c.status !== "active" ? (
            <Badge size="xs" tone={st.tone}>
              {st.label}
            </Badge>
          ) : null}
          <span className="ml-auto shrink-0 text-xs text-gray-400">{relativeTime(lastActivity(c))}</span>
        </div>
        <p className="truncate text-xs text-gray-500">
          {project ? project.name : roleText(other)}
          {intent ? ` · ${intentKindLabel(intent)}${intent.sub ? `（${intent.sub}）` : ""}` : ""}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={cn("truncate text-sm", unread ? "font-medium text-gray-900" : "text-gray-500")}>{preview(c.messages[c.messages.length - 1], viewer.id)}</p>
          {unread ? <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-brand-600" /> : null}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* 对话详情                                                              */
/* ------------------------------------------------------------------ */

export function ConversationView({ id }: { id: string }) {
  const db = useDB();
  const viewer = useViewer();
  const markRead = useApp((s) => s.markConversationRead);
  const reopen = useApp((s) => s.reopenConversation);
  const toast = useApp((s) => s.toast);
  const [sideOpen, setSideOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const cv = db.conversations.find((c) => c.id === id);
  const isMember = !!viewer && !!cv?.members.includes(viewer.id);
  const opsView = !!viewer?.isOps && !!cv?.match && !isMember;
  const msgCount = cv?.messages.length ?? 0;
  const unread = !!cv && !!viewer && isMember && isConversationUnread(cv, viewer.id);

  useEffect(() => {
    if (unread) markRead(id);
  }, [unread, id, markRead, msgCount]);

  if (!viewer) return null;
  if (!cv || (!isMember && !opsView)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState
          icon={Lock}
          title="对话不存在或你无权查看"
          desc="只有对话双方能看到内容；切换演示身份试试"
          action={
            <Button variant="secondary" href="/inbox" iconLeft={ArrowLeft}>
              回到收件箱
            </Button>
          }
        />
      </div>
    );
  }

  const other = opsView ? getPerson(db, cv.members[1]) : otherMember(db, cv, viewer.id);
  const st = conversationStatus(cv);
  const closed = cv.status === "closed";
  const actions = {
    openMatch: () => setMatchOpen(true),
    openClose: () => setCloseOpen(true),
    openShare: () => setShareOpen(true),
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 头部 */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 sm:px-5">
          <Button size="sm" variant="tertiary" iconOnly={ArrowLeft} href="/inbox" className="md:hidden" aria-label="返回收件箱" />
          <Link href={`/u/${other?.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={other?.name ?? "?"} tone={other?.avatarTone ?? 0} size="md" />
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold text-gray-900">{opsView ? `${getPerson(db, cv.members[0])?.name} × ${other?.name}` : other?.name}</span>
                <Badge size="xs" tone={st.tone} dot>
                  {st.label}
                </Badge>
              </span>
              <span className="block truncate text-xs text-gray-500">{[roleText(other), other?.title, other?.org].filter((s, i, a) => s && a.indexOf(s) === i).join(" · ")}</span>
            </span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button size="sm" variant="secondary" iconLeft={Info} onClick={() => setSideOpen(true)} className="xl:hidden">
              <span className="hidden sm:inline">联系方式与撮合</span>
              <span className="sm:hidden">详情</span>
            </Button>
            {isMember ? (
              <Dropdown width={232} trigger={() => <Button size="sm" variant="tertiary" iconOnly={MoreHorizontal} aria-label="更多" />}>
                {(close) => (
                  <div className="py-1">
                    <MenuItem
                      icon={Handshake}
                      onClick={() => {
                        close();
                        if (cv.match) toast({ tone: "info", title: "已经申请过撮合", body: st.desc });
                        else actions.openMatch();
                      }}
                      desc={cv.match ? st.label : "运营协助会面、引荐与资料"}
                    >
                      申请 Pitch 撮合
                    </MenuItem>
                    <MenuItem
                      icon={Phone}
                      onClick={() => {
                        close();
                        actions.openShare();
                      }}
                      desc={cv.contactShared[viewer.id] ? "你已分享" : "对方分享后即完成互换"}
                    >
                      分享联系方式
                    </MenuItem>
                    {closed ? (
                      <MenuItem
                        icon={RotateCcw}
                        onClick={() => {
                          close();
                          reopen(cv.id);
                          toast({ tone: "success", title: "对话已重新开启" });
                        }}
                      >
                        重新开启对话
                      </MenuItem>
                    ) : (
                      <MenuItem
                        icon={XCircle}
                        danger
                        onClick={() => {
                          close();
                          actions.openClose();
                        }}
                      >
                        结束对话
                      </MenuItem>
                    )}
                  </div>
                )}
              </Dropdown>
            ) : null}
          </div>
        </div>

        <StatusBanner cv={cv} opsView={opsView} />

        <MessageList cv={cv} viewer={viewer} opsView={opsView} />

        {opsView ? (
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
            <ShieldCheck size={16} className="mr-1.5 inline text-brand-600" />
            运营视角只读。撮合进展请在
            <Link href="/ops?tab=match" className="mx-1 font-semibold text-brand-700 hover:underline">
              撮合看板
            </Link>
            里更新，双方会在对话中看到。
          </div>
        ) : closed ? (
          <div className="flex flex-col items-start gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-gray-600">
              对话已结束{cv.closedReason ? `：${cv.closedReason}` : ""}。重新开启后双方可以继续发消息。
            </p>
            <Button
              size="sm"
              variant="secondary"
              iconLeft={RotateCcw}
              onClick={() => {
                reopen(cv.id);
                toast({ tone: "success", title: "对话已重新开启" });
              }}
            >
              重新开启
            </Button>
          </div>
        ) : (
          <Composer cv={cv} viewer={viewer} />
        )}
      </div>

      <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white xl:block">
        <ConversationSide cv={cv} viewer={viewer} opsView={opsView} {...actions} />
      </aside>

      <Drawer open={sideOpen} onClose={() => setSideOpen(false)} title="联系方式与撮合" width={400}>
        <ConversationSide
          cv={cv}
          viewer={viewer}
          opsView={opsView}
          openMatch={() => {
            setSideOpen(false);
            actions.openMatch();
          }}
          openClose={() => {
            setSideOpen(false);
            actions.openClose();
          }}
          openShare={() => {
            setSideOpen(false);
            actions.openShare();
          }}
          inDrawer
        />
      </Drawer>

      <RequestMatchModal open={matchOpen} onClose={() => setMatchOpen(false)} cv={cv} />
      <CloseConversationModal open={closeOpen} onClose={() => setCloseOpen(false)} cv={cv} />
      <ShareContactModal open={shareOpen} onClose={() => setShareOpen(false)} cv={cv} viewer={viewer} />
    </div>
  );
}

function StatusBanner({ cv, opsView }: { cv: Conversation; opsView: boolean }) {
  const db = useDB();
  if (cv.status === "active" || cv.status === "closed") return null;
  const requester = getPerson(db, cv.match?.requestedBy);
  const ops = getPerson(db, cv.match?.opsOwnerId);
  if (cv.status === "match_requested") {
    return (
      <div className="flex items-start gap-3 border-b border-warning-200 bg-warning-25 px-5 py-3 text-sm">
        <Handshake size={18} className="mt-0.5 shrink-0 text-warning-600" />
        <p className="text-gray-700">
          <b className="text-gray-900">{requester?.name} 申请了 Pitch 撮合</b>
          {opsView ? "，等待你接手。" : "，运营会在 1 个工作日内联系双方。"}
          {cv.match?.note ? <span className="mt-0.5 block text-gray-500">“{cv.match.note}”</span> : null}
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 border-b border-brand-200 bg-brand-25 px-5 py-3 text-sm">
      <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-600" />
      <p className="text-gray-700">
        <b className="text-gray-900">
          {cv.match?.stage === "won" ? `Pitch 撮合已成交 · ${ops?.name ?? ""}` : cv.match?.stage === "lost" ? `Pitch 撮合已结案 · ${ops?.name ?? ""}` : `Pitch 运营 ${ops?.name ?? ""} 正在跟进`}
        </b>
        {cv.match?.opsNote ? <span className="mt-0.5 block text-gray-600">{cv.match.opsNote}</span> : null}
      </p>
    </div>
  );
}

function MessageList({ cv, viewer, opsView }: { cv: Conversation; viewer: Person; opsView: boolean }) {
  const db = useDB();
  const toast = useApp((s) => s.toast);
  const endRef = useRef<HTMLDivElement>(null);
  const intent = db.intents.find((i) => i.id === cv.intentId);
  const from = getPerson(db, intent?.fromId);
  const project = getProject(db, cv.projectId);
  const perspective = opsView ? cv.members[0] : viewer.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [cv.messages.length, cv.id]);

  let lastDay = "";
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-gray-25 px-3 py-6 sm:px-6">
      {intent ? (
        <div className="mx-auto mb-6 max-w-[520px] rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <Badge size="xs" tone="brand" icon={Sparkles}>
              对话起点
            </Badge>
            <span>
              {from?.name} 表达了「{intentKindLabel(intent)}
              {intent.sub ? ` · ${intent.sub}` : ""}」意向
            </span>
            {intent.anonymous ? (
              <Badge size="xs" tone="gray">
                匿名发出 · 已揭晓
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-800">{intent.message}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            {project ? (
              <Link href={`/p/${project.slug}`} className="flex items-center gap-1.5 font-medium text-gray-600 hover:text-brand-700">
                <ProjectLogo text={project.logoText} tone={project.logoTone} size="xs" />
                {project.name}
              </Link>
            ) : null}
            <span className="ml-auto">{formatDateTime(intent.createdAt)}</span>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[760px] flex-col gap-3">
        {cv.messages.map((m) => {
          const day = formatDate(m.at);
          const sep = day !== lastDay;
          lastDay = day;
          const mine = m.from === perspective;
          const author = getPerson(db, m.from);
          return (
            <div key={m.id} className="flex flex-col gap-3">
              {sep ? (
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="h-px flex-1 bg-gray-200" />
                  {formatDateTime(m.at).replace(/\s\d{2}:\d{2}$/, "")}
                  <span className="h-px flex-1 bg-gray-200" />
                </div>
              ) : null}
              {m.system ? (
                <p className="mx-auto max-w-[90%] rounded-full bg-gray-100 px-3 py-1 text-center text-xs text-gray-600">{m.text}</p>
              ) : (
                <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                  {mine ? null : <Avatar name={author?.name ?? "?"} tone={author?.avatarTone ?? 0} size="sm" />}
                  <div className={cn("flex max-w-[78%] flex-col gap-1 sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
                    {m.text ? (
                      <p
                        className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm leading-6 whitespace-pre-wrap",
                          mine ? "rounded-br-md bg-gray-900 text-white" : "rounded-bl-md border border-gray-200 bg-white text-gray-800",
                        )}
                      >
                        {m.text}
                      </p>
                    ) : null}
                    {m.attachment ? (
                      <div className="flex w-[260px] max-w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <FileText size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-800">{m.attachment.name}</span>
                          <span className="block text-xs text-gray-500">{m.attachment.size}</span>
                        </span>
                        <Button
                          size="xs"
                          variant="tertiary"
                          iconOnly={Download}
                          aria-label="下载"
                          onClick={() => toast({ tone: "info", title: "原型不提供下载", body: m.attachment!.name })}
                        />
                      </div>
                    ) : null}
                    <span className="px-1 text-[11px] text-gray-400">{formatTime(m.at)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

const QUICK_REPLIES = ["你好！方便约个 30 分钟电话吗？", "可以先发一份资料给我看看吗？", "下周有空当面聊聊吗？"];

function Composer({ cv, viewer }: { cv: Conversation; viewer: Person }) {
  const send = useApp((s) => s.sendMessage);
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const spoken = cv.messages.some((m) => m.from === viewer.id);
  const canSend = text.trim().length > 0 || !!file;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    send(cv.id, text.trim(), file ?? undefined);
    setText("");
    setFile(null);
  };

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
      {!spoken ? (
        <div className="scrollbar-none mb-2 flex gap-2 overflow-x-auto">
          {QUICK_REPLIES.map((r) => (
            <button
              key={r}
              onClick={() => setText(r)}
              className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-white"
            >
              {r}
            </button>
          ))}
        </div>
      ) : null}
      {file ? (
        <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-1.5 pl-3 text-sm">
          <FileText size={16} className="shrink-0 text-brand-600" />
          <span className="truncate text-gray-700">{file.name}</span>
          <span className="shrink-0 text-xs text-gray-400">{file.size}</span>
          <button onClick={() => setFile(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="移除附件">
            <X size={14} />
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile({ name: f.name, size: f.size > 1_048_576 ? `${(f.size / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` });
            e.target.value = "";
          }}
        />
        <Button variant="tertiary" iconOnly={Paperclip} onClick={() => fileRef.current?.click()} aria-label="添加附件" />
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="写点什么…"
          className="min-h-10 flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm leading-6 text-gray-900 shadow-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
        />
        <Button variant="primary" iconOnly={Send} disabled={!canSend} onClick={submit} aria-label="发送" />
      </div>
      <p className="mt-1.5 hidden text-[11px] text-gray-400 sm:block">Enter 发送 · Shift + Enter 换行 · 支持 BP、产品手册等附件</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 右栏：联系方式、撮合、项目                                               */
/* ------------------------------------------------------------------ */

const CONTACT_FIELDS: { key: keyof Contact; label: string; icon: typeof Phone }[] = [
  { key: "wechat", label: "微信", icon: MessageCircle },
  { key: "phone", label: "手机", icon: Phone },
  { key: "email", label: "邮箱", icon: Mail },
];

function ContactLines({ contact }: { contact: Contact }) {
  const toast = useApp((s) => s.toast);
  const rows = CONTACT_FIELDS.filter((f) => contact[f.key]);
  if (!rows.length) return <p className="text-sm text-gray-500">TA 的资料里没有填写联系方式</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.key} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <Icon size={16} className="shrink-0 text-gray-500" />
            <span className="w-8 shrink-0 text-xs text-gray-500">{f.label}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{contact[f.key]}</span>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(contact[f.key] ?? "");
                toast({ tone: "success", title: `已复制${f.label}` });
              }}
              className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600"
              aria-label={`复制${f.label}`}
            >
              <Copy size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SideSection({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 last:border-b-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function ConversationSide({
  cv,
  viewer,
  opsView,
  openMatch,
  openClose,
  openShare,
  inDrawer,
}: {
  cv: Conversation;
  viewer: Person;
  opsView: boolean;
  openMatch: () => void;
  openClose: () => void;
  openShare: () => void;
  inDrawer?: boolean;
}) {
  const db = useDB();
  const other = opsView ? getPerson(db, cv.members[1]) : otherMember(db, cv, viewer.id);
  const project = getProject(db, cv.projectId);
  const iShared = !!cv.contactShared[viewer.id];
  const theyShared = !!other && !!cv.contactShared[other.id];
  const requester = getPerson(db, cv.match?.requestedBy);
  const ops = getPerson(db, cv.match?.opsOwnerId);
  const isOwner = !!project && project.ownerId === viewer.id;

  return (
    <div className={cn(inDrawer && "-mx-6 -mt-2")}>
      {opsView ? null : (
        <SideSection
          title="联系方式"
          extra={
            iShared && theyShared ? (
              <Badge size="xs" tone="success" icon={CheckCircle2}>
                已互换
              </Badge>
            ) : null
          }
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500">{other?.name} 的联系方式</p>
            {theyShared && other ? (
              <ContactLines contact={other.contact} />
            ) : (
              <p className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-500">
                <Lock size={14} />
                {iShared ? "等待 TA 交换" : "TA 还没有分享"}
              </p>
            )}
          </div>
          {iShared ? (
            <p className="flex items-center gap-1.5 text-xs text-success-700">
              <CheckCircle2 size={14} />
              你已分享联系方式
            </p>
          ) : (
            <Button variant={theyShared ? "primary" : "secondary"} size="sm" iconLeft={Phone} onClick={openShare} disabled={cv.status === "closed"}>
              {theyShared ? "交换联系方式" : "分享我的联系方式"}
            </Button>
          )}
          <p className="text-xs leading-5 text-gray-400">联系方式只在你主动分享后对 TA 可见；双方都分享即完成互换。</p>
        </SideSection>
      )}

      <SideSection title="Pitch 撮合">
        {!cv.match ? (
          <>
            <p className="text-sm leading-6 text-gray-600">需要线下会面、引荐跟投人或准备尽调资料？申请后 Pitch 运营会介入，帮你们把事情往前推。</p>
            <Button size="sm" variant="secondary" iconLeft={Handshake} onClick={openMatch} disabled={cv.status === "closed"}>
              申请撮合
            </Button>
          </>
        ) : (
          <ol className="flex flex-col gap-3">
            <Step done title={`${requester?.name} 申请撮合`} desc={cv.match.note} at={cv.match.at} />
            <Step
              done={!!cv.match.opsOwnerId}
              title={cv.match.opsOwnerId ? `运营 ${ops?.name ?? ""} 已接手` : "等待运营接手"}
              desc={cv.match.opsOwnerId ? (cv.match.log?.[0]?.text.replace(/^[^：]+：/, "") ?? cv.match.opsNote) : "通常 1 个工作日内"}
            />
            {cv.match.stage === "met" ? <Step done title="已约见" desc={cv.match.opsNote} /> : null}
            <Step
              done={cv.match.stage === "won" || cv.match.stage === "lost"}
              title={cv.match.stage === "won" ? "成交" : cv.match.stage === "lost" ? "未成交" : "推进结果"}
              desc={cv.match.stage === "won" || cv.match.stage === "lost" ? cv.match.opsNote : "会面、引荐、资料准备完成后在此同步"}
              last
            />
          </ol>
        )}
      </SideSection>

      {project ? (
        <SideSection title="关联项目">
          <Link href={`/p/${project.slug}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-gray-300">
            <ProjectLogo text={project.logoText} tone={project.logoTone} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-900">{project.name}</span>
              <span className="block truncate text-xs text-gray-500">{project.oneLiner}</span>
            </span>
          </Link>
          {isOwner ? (
            <Button size="sm" variant="link" href={`/dashboard/${project.slug}?tab=intents`} className="self-start">
              在工作台查看全部意向
            </Button>
          ) : null}
        </SideSection>
      ) : null}

      {opsView ? null : (
        <SideSection title="对话">
          <p className="text-xs text-gray-500">开始于 {formatDateTime(cv.createdAt)}</p>
          {cv.status !== "closed" ? (
            <Button size="sm" variant="tertiary" iconLeft={XCircle} onClick={openClose} className="self-start text-error-700 hover:bg-error-50 hover:text-error-700">
              结束对话
            </Button>
          ) : null}
        </SideSection>
      )}
    </div>
  );
}

function Step({ done, title, desc, at, last }: { done: boolean; title: string; desc?: string; at?: string; last?: boolean }) {
  return (
    <li className="relative flex gap-3">
      {last ? null : <span className={cn("absolute top-6 bottom-[-12px] left-[11px] w-px", done ? "bg-brand-300" : "bg-gray-200")} />}
      <span
        className={cn(
          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white",
          done ? "border-brand-600 text-brand-600" : "border-gray-300 text-gray-300",
        )}
      >
        {done ? <CheckCircle2 size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
      </span>
      <div className="min-w-0 pb-1">
        <p className={cn("text-sm font-semibold", done ? "text-gray-900" : "text-gray-500")}>{title}</p>
        {desc ? <p className="text-xs leading-5 text-gray-500">{desc}</p> : null}
        {at ? <p className="text-[11px] text-gray-400">{relativeTime(at)}</p> : null}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* 弹层                                                                 */
/* ------------------------------------------------------------------ */

function ShareContactModal({ open, onClose, cv, viewer }: { open: boolean; onClose: () => void; cv: Conversation; viewer: Person }) {
  const db = useDB();
  const share = useApp((s) => s.shareContact);
  const toast = useApp((s) => s.toast);
  const [c, setC] = useState<Contact>(viewer.contact);
  const other = otherMember(db, cv, viewer.id);
  const theyShared = !!other && !!cv.contactShared[other.id];
  const filled = CONTACT_FIELDS.some((f) => (c[f.key] ?? "").trim());
  const already = !!cv.contactShared[viewer.id];

  useEffect(() => {
    if (open) setC(viewer.contact);
  }, [open, viewer.contact]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={theyShared ? `和 ${other?.name} 交换联系方式` : "分享我的联系方式"}
      desc={theyShared ? `${other?.name} 已分享，你分享后双方即可看到彼此的联系方式。` : `${other?.name} 会立刻看到你的联系方式；TA 也分享后即完成互换。`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            disabled={!filled || already}
            onClick={() => {
              share(cv.id, { wechat: c.wechat?.trim() || undefined, phone: c.phone?.trim() || undefined, email: c.email?.trim() || undefined });
              toast({ tone: "success", title: theyShared ? "已完成互换" : "已分享联系方式", body: theyShared ? "可以在右侧查看对方的联系方式" : "对方分享后即完成互换" });
              onClose();
            }}
          >
            {already ? "已分享" : theyShared ? "交换" : "分享"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="微信" icon={MessageCircle} value={c.wechat ?? ""} onChange={(e) => setC({ ...c, wechat: e.target.value })} placeholder="微信号" />
        <Input label="手机" icon={Phone} value={c.phone ?? ""} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="选填" />
        <Input label="邮箱" icon={Mail} value={c.email ?? ""} onChange={(e) => setC({ ...c, email: e.target.value })} placeholder="选填" />
        <p className="text-xs text-gray-500">至少填一项。会同时保存到你的资料，下次分享自动带出；资料里的联系方式不会公开展示。</p>
      </div>
    </Modal>
  );
}

const MATCH_HELP = ["安排线下会面", "引荐跟投人", "准备尽调资料", "条款与估值建议", "渠道/资源对接"];

function RequestMatchModal({ open, onClose, cv }: { open: boolean; onClose: () => void; cv: Conversation }) {
  const db = useDB();
  const viewer = useViewer();
  const request = useApp((s) => s.requestMatch);
  const toast = useApp((s) => s.toast);
  const [help, setHelp] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const other = otherMember(db, cv, viewer?.id ?? null);
  const ok = help.length > 0 && note.trim().length >= 10;
  const error = useMemo(() => (note && note.trim().length < 10 ? "至少 10 个字，说清楚希望 Pitch 帮什么" : undefined), [note]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="申请 Pitch 撮合"
      desc={`运营会在 1 个工作日内联系你和 ${other?.name}，协助把合作往前推。`}
      icon={
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-8 ring-brand-50">
          <Handshake size={22} />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            disabled={!ok}
            onClick={() => {
              request(cv.id, `${help.join("、")}：${note.trim()}`);
              toast({ tone: "success", title: "已申请撮合", body: "运营会在 1 个工作日内联系双方" });
              setHelp([]);
              setNote("");
              onClose();
            }}
          >
            提交申请
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="希望 Pitch 帮什么" required>
          <ChipSelect multiple options={MATCH_HELP} value={help} onChange={setHelp} size="sm" />
        </Field>
        <Textarea
          label="补充说明"
          required
          rows={4}
          maxCount={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={error}
          placeholder="比如：高总有意领投，希望 Pitch 帮忙组织一次线下会面，并引荐 1–2 位跟投人"
        />
        <div className="rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
          提交后：对话状态变为“已申请撮合”，{other?.name} 会收到通知；运营接手后状态变为“Pitch 跟进中”，进展同步在对话里。
        </div>
      </div>
    </Modal>
  );
}

const CLOSE_REASONS = ["已达成合作", "已转到线下沟通", "暂时不合适", "其他"];

function CloseConversationModal({ open, onClose, cv }: { open: boolean; onClose: () => void; cv: Conversation }) {
  const close = useApp((s) => s.closeConversation);
  const toast = useApp((s) => s.toast);
  const [reason, setReason] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const text = reason[0] === "其他" ? other.trim() || "其他" : reason[0];
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="结束这段对话？"
      desc="对方会在对话里看到结束原因。之后任何一方都可以重新开启。"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="destructive"
            disabled={!text}
            onClick={() => {
              close(cv.id, text!);
              toast({ tone: "info", title: "对话已结束", body: text });
              setReason([]);
              setOther("");
              onClose();
            }}
          >
            结束对话
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <ChipSelect options={CLOSE_REASONS} value={reason} onChange={setReason} size="sm" />
        {reason[0] === "其他" ? <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="简单说明一下" maxCount={40} /> : null}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 页面外壳                                                              */
/* ------------------------------------------------------------------ */

export function InboxShell({ activeId }: { activeId?: string }) {
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  if (!viewer) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16">
        <EmptyState
          icon={InboxIcon}
          title="登录后查看你的对话"
          desc="意向被接受后会自动开启站内对话"
          action={
            <Button variant="primary" onClick={() => requireLogin("登录后查看你的对话")}>
              登录
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1440px] md:px-6 md:py-6">
      <div
        className={cn(
          "flex overflow-hidden bg-white md:h-[calc(100dvh-64px-48px)] md:rounded-2xl md:border md:border-gray-200 md:shadow-xs",
          activeId ? "h-[calc(100dvh-64px)]" : "min-h-[calc(100dvh-64px-80px)]",
        )}
      >
        <aside className={cn("w-full shrink-0 border-gray-200 md:w-[340px] md:border-r", activeId ? "hidden md:block" : "block")}>
          <ConversationList activeId={activeId} />
        </aside>
        <section className={cn("min-w-0 flex-1", activeId ? "flex" : "hidden md:flex")}>
          {activeId ? (
            <ConversationView id={activeId} />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-gray-25 p-8">
              <EmptyState icon={MessageCircle} title="选择一个对话" desc="接受意向后会自动开启对话；联系方式由双方自愿交换，需要帮助时可以申请 Pitch 撮合。" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
