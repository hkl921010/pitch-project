"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { CONTRIBUTION_TASKS, CURRENT_MONTH, DEFAULT_INSTANT, DEMO_VOTES, KEY_UPDATE_TEMPLATES, MATCH_STAGE, MONTHLY_FREE_INTENTS, TOP_CONTRIBUTOR_TASKS } from "@/data/constants";
import { createSeed } from "@/data/seed";
import { formatDateTime, isSameMonth, monthOf, nowIso, nowMs } from "@/data/time";
import type {
  Contact,
  ContributionAction,
  Conversation,
  DB,
  IntentKind,
  MatchStage,
  NeedItem,
  Notification,
  NotifyPrefs,
  OpenStatus,
  Person,
  Project,
  Role,
  TeamRole,
  TrafficSource,
  UpdateTemplate,
  WatchRemind,
} from "@/data/types";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: "success" | "error" | "info";
}

export type IntentDraftTarget = (
  | { type: "project"; projectId: string; presetKind?: IntentKind; jobId?: string; needId?: string }
  /** 直接找人：回应合作方“能提供”的资源、邀请开放合伙的人才、或交个朋友。 */
  | { type: "person"; personId: string; presetKind?: IntentKind; offerId?: string }
) & { /** 预填的说明开头，比如活动后跟进时带上“在某某活动上认识”。 */ prefill?: string };

interface UIState {
  createOpen: boolean;
  intentTarget: IntentDraftTarget | null;
  loginPromptOpen: boolean;
  loginReason: string;
}

interface AppState {
  db: DB;
  viewerId: string | null;
  hydrated: boolean;
  toasts: Toast[];
  ui: UIState;

  setHydrated: () => void;
  setViewer: (id: string | null) => void;
  resetDemo: () => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  openCreate: () => void;
  closeCreate: () => void;
  openIntent: (target: IntentDraftTarget) => void;
  closeIntent: () => void;
  requireLogin: (reason: string) => void;
  closeLoginPrompt: () => void;

  completeOnboarding: (input: { role: Role; title: string; org: string; city: string; headline: string }) => void;
  updatePerson: (patch: Partial<Person>) => void;
  updateOpenStatus: (patch: Partial<OpenStatus>) => void;

  toggleFollow: (targetType: "project" | "person", targetId: string) => void;

  sendIntent: (input: {
    target: IntentDraftTarget;
    kind: IntentKind;
    sub?: string;
    message: string;
    anonymous: boolean;
  }) => { ok: true; intentId: string } | { ok: false; reason: string };
  withdrawIntent: (intentId: string) => void;
  respondIntent: (intentId: string, decision: "accept" | "decline") => string | null;

  sendMessage: (convId: string, text: string, attachment?: { name: string; size: string }) => void;
  shareContact: (convId: string, contact?: Contact) => void;
  requestMatch: (convId: string, note: string) => void;
  closeConversation: (convId: string, reason: string) => void;
  reopenConversation: (convId: string) => void;
  markConversationRead: (convId: string) => void;

  createProject: (input: { name: string; oneLiner: string; track: string; visibility: Project["visibility"]; prefill?: Partial<Project> }) => string;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  recordView: (projectId: string, source: TrafficSource) => void;
  setNeeds: (projectId: string, needs: NeedItem[]) => void;
  inviteMember: (projectId: string, personId: string, title: string, role: TeamRole) => void;
  respondInvite: (projectId: string, accept: boolean) => void;
  removeMember: (projectId: string, personId: string) => void;
  changeMemberRole: (projectId: string, personId: string, role: TeamRole) => void;
  postUpdate: (projectId: string, template: UpdateTemplate, title: string, body: string) => void;
  deleteUpdate: (projectId: string, updateId: string) => void;
  applyWall: (projectId: string) => void;

  toggleWatch: (projectId: string) => void;
  setWatchNote: (projectId: string, note: string) => void;
  setWatchRemind: (projectId: string, remind: WatchRemind) => void;
  markWatchSeen: (projectId: string) => void;
  markAllWatchSeen: () => void;

  rsvpEvent: (eventId: string) => void;
  cheerUpdate: (projectId: string, updateId: string) => void;
  enterEvent: (eventId: string) => void;

  applyDemoDay: (demoDayId: string, projectId: string, pitchNote: string) => void;
  voteDemoDay: (demoDayId: string, projectId: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateNotifyPrefs: (patch: Partial<Omit<NotifyPrefs, "userId">>) => void;
  sendTestDigest: (channel: "wechat" | "email") => void;

  createSlot: (input: { start: string; mins: number; topic: string; mode: "online" | "offline" }) => void;
  bookSlot: (slotId: string, note: string) => void;
  respondBooking: (slotId: string, accept: boolean, extra?: { meeting?: string; reason?: string }) => void;
  cancelBooking: (slotId: string) => void;
  cancelSlot: (slotId: string, reason?: string) => void;

  reviewWall: (projectId: string, approve: boolean, note?: string) => void;
  reviewDemoDayEntry: (demoDayId: string, projectId: string, status: "shortlisted" | "rejected", note?: string) => void;
  takeMatch: (convId: string, opsNote: string) => void;
  opsInitiateMatch: (convId: string, note: string) => void;
  updateMatch: (convId: string, stage: MatchStage, note: string) => void;
  nudgeProject: (projectId: string, pending: number) => void;

  submitProductFeedback: (text: string) => void;
}

/** 假数据结构或内容变化时递增，旧的本地数据会被替换为新种子。 */
const SEED_VERSION = 26;

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 没设置过的用户：微信登录即关注服务号，周报每周一份，只推需要回应的事。 */
export function notifyPrefsOf(db: DB, userId: string): NotifyPrefs {
  return db.notifyPrefs.find((p) => p.userId === userId) ?? { userId, wechatBound: true, wechatOn: true, emailOn: false, frequency: "weekly", instant: DEFAULT_INSTANT };
}

function pushNotification(db: DB, n: Omit<Notification, "id" | "at" | "read" | "pushed">) {
  const prefs = notifyPrefsOf(db, n.userId);
  const pushed = prefs.wechatBound && prefs.wechatOn && prefs.instant.includes(n.type);
  db.notifications.unshift({ ...n, id: uid("nt"), at: nowIso(), read: false, pushed });
}

function personName(db: DB, id: string | null | undefined) {
  return db.people.find((p) => p.id === id)?.name ?? "有人";
}

/** 贡献任务：每类动作每月只计一次，用于兑换额外意向次数。 */
function recordContribution(db: DB, userId: string, action: ContributionAction, label: string) {
  const mine = db.contributions.filter((c) => c.userId === userId);
  const done = mine.some((c) => c.action === action && isSameMonth(c.at, CURRENT_MONTH));
  db.contributions.unshift({ id: uid("ct"), userId, action, at: nowIso(), label });
  if (done) return;
  const task = CONTRIBUTION_TASKS.find((t) => t.action === action);
  if (task) {
    pushNotification(db, {
      userId,
      type: "reward",
      title: "贡献任务完成，意向次数 +1",
      body: task.label,
      link: "/rewards",
    });
  }
  const byMonth = new Map<string, Set<string>>();
  mine.forEach((c) => byMonth.set(monthOf(c.at), (byMonth.get(monthOf(c.at)) ?? new Set()).add(c.action)));
  const before = Math.max(0, ...[...byMonth.values()].map((s) => s.size));
  const thisMonth = (byMonth.get(CURRENT_MONTH)?.size ?? 0) + 1;
  if (before < TOP_CONTRIBUTOR_TASKS && thisMonth >= TOP_CONTRIBUTOR_TASKS) {
    pushNotification(db, {
      userId,
      type: "reward",
      title: "获得徽章：社区贡献者",
      body: `本月完成了 ${thisMonth} 项贡献任务，徽章会一直显示在你的主页上`,
      link: "/rewards#badges",
    });
  }
}

/** 由某人操作触发的系统消息：操作者自己不算未读。 */
function systemMessage(cv: Conversation, actorId: string, text: string) {
  const at = nowIso();
  cv.messages.push({ id: uid("m"), from: "system", system: true, text, at });
  cv.readAt[actorId] = at;
}

function slugify(name: string, taken: Set<string>) {
  const base = `p-${Date.now().toString(36).slice(-5)}`;
  let slug = base;
  let i = 1;
  while (taken.has(slug)) slug = `${base}-${i++}`;
  return name ? slug : base;
}

export const useApp = create<AppState>()(
  persist(
    immer((set, get) => ({
      db: createSeed(),
      viewerId: "u-linchuan",
      hydrated: false,
      toasts: [],
      ui: { createOpen: false, intentTarget: null, loginPromptOpen: false, loginReason: "" },

      setHydrated: () => set({ hydrated: true }),
      setViewer: (id) =>
        set((s) => {
          s.viewerId = id;
          s.ui = { createOpen: false, intentTarget: null, loginPromptOpen: false, loginReason: "" };
        }),
      resetDemo: () =>
        set((s) => {
          s.db = createSeed();
          s.toasts = [];
        }),
      toast: (t) => {
        const id = uid("t");
        set((s) => {
          s.toasts.push({ ...t, id });
        });
        setTimeout(() => get().dismissToast(id), 3200);
      },
      dismissToast: (id) =>
        set((s) => {
          s.toasts = s.toasts.filter((t) => t.id !== id);
        }),
      openCreate: () =>
        set((s) => {
          if (!s.viewerId) {
            s.ui.loginPromptOpen = true;
            s.ui.loginReason = "登录后即可创建项目";
            return;
          }
          s.ui.createOpen = true;
        }),
      closeCreate: () =>
        set((s) => {
          s.ui.createOpen = false;
        }),
      openIntent: (target) =>
        set((s) => {
          if (!s.viewerId) {
            s.ui.loginPromptOpen = true;
            s.ui.loginReason = "登录后即可表达意向";
            return;
          }
          s.ui.intentTarget = target;
        }),
      closeIntent: () =>
        set((s) => {
          s.ui.intentTarget = null;
        }),
      requireLogin: (reason) =>
        set((s) => {
          s.ui.loginPromptOpen = true;
          s.ui.loginReason = reason;
        }),
      closeLoginPrompt: () =>
        set((s) => {
          s.ui.loginPromptOpen = false;
        }),

      completeOnboarding: (input) =>
        set((s) => {
          const me = s.db.people.find((p) => p.id === s.viewerId);
          if (!me) return;
          me.role = input.role;
          me.title = input.title;
          me.org = input.org;
          me.city = input.city;
          me.onboarded = true;
          me.openStatus = { ...me.openStatus, active: !!input.headline, headline: input.headline, updatedAt: nowIso() };
        }),
      updatePerson: (patch) =>
        set((s) => {
          const me = s.db.people.find((p) => p.id === s.viewerId);
          if (me) Object.assign(me, patch);
        }),
      updateOpenStatus: (patch) =>
        set((s) => {
          const me = s.db.people.find((p) => p.id === s.viewerId);
          if (!me) return;
          me.openStatus = { ...me.openStatus, ...patch, updatedAt: nowIso() };
          recordContribution(s.db, me.id, "status_refresh", "刷新了开放状态");
        }),
      toggleFollow: (targetType, targetId) =>
        set((s) => {
          if (!s.viewerId) {
            s.ui.loginPromptOpen = true;
            s.ui.loginReason = "登录后即可关注";
            return;
          }
          const idx = s.db.follows.findIndex((f) => f.userId === s.viewerId && f.targetType === targetType && f.targetId === targetId);
          if (idx >= 0) s.db.follows.splice(idx, 1);
          else s.db.follows.push({ userId: s.viewerId, targetType, targetId, at: nowIso() });
        }),

      sendIntent: (input) => {
        const s = get();
        const viewer = s.db.people.find((p) => p.id === s.viewerId);
        if (!viewer) return { ok: false, reason: "请先登录" };
        const quota = computeQuota(s.db, viewer);
        if (quota.remaining <= 0) return { ok: false, reason: "本月意向次数已用完" };

        let toId = "";
        let projectId: string | undefined;
        let needId: string | undefined;
        let jobId: string | undefined;
        if (input.target.type === "project") {
          const project = s.db.projects.find((p) => p.id === (input.target as { projectId: string }).projectId);
          if (!project) return { ok: false, reason: "项目不存在" };
          toId = project.ownerId;
          projectId = project.id;
          jobId = input.target.jobId;
          needId = input.target.needId;
          const existing = s.db.intents.find(
            (i) =>
              i.fromId === viewer.id &&
              i.projectId === project.id &&
              (i.status === "pending" || i.status === "declined") &&
              nowMs() - new Date(i.createdAt).getTime() < 7 * 86_400_000,
          );
          if (existing) return { ok: false, reason: "你已经对这个项目表达过意向，等待对方回应中" };
        } else {
          toId = input.target.personId;
          if (toId === viewer.id) return { ok: false, reason: "不能给自己发意向" };
          const existing = s.db.intents.find(
            (i) =>
              i.fromId === viewer.id &&
              i.toId === toId &&
              !i.projectId &&
              i.needId === needId &&
              (i.status === "pending" || i.status === "declined") &&
              nowMs() - new Date(i.createdAt).getTime() < 7 * 86_400_000,
          );
          if (existing) return { ok: false, reason: "你已经向 TA 表达过意向，等待对方回应中" };
        }
        const id = uid("it");
        set((st) => {
          st.db.intents.unshift({
            id,
            fromId: viewer.id,
            toId,
            projectId,
            needId,
            jobId,
            kind: input.kind,
            sub: input.sub,
            message: input.message,
            anonymous: input.anonymous,
            revealed: !input.anonymous,
            status: "pending",
            createdAt: nowIso(),
          });
          const projectName = st.db.projects.find((p) => p.id === projectId)?.name;
          pushNotification(st.db, {
            userId: toId,
            type: "intent",
            title: input.anonymous
              ? `一位匿名${viewer.role === "investor" ? "投资人" : "用户"}对${projectName ?? (needId ? "你的需求" : "你")}感兴趣`
              : `${viewer.name} ${projectName ? `对${projectName}表达了意向` : needId ? "说可以帮你" : "想和你聊聊"}`,
            body: input.message.slice(0, 60),
            link: projectId ? `/dashboard/${st.db.projects.find((p) => p.id === projectId)?.slug}?tab=intents` : "/me/intents?tab=received",
          });
        });
        return { ok: true, intentId: id };
      },
      withdrawIntent: (intentId) =>
        set((s) => {
          const it = s.db.intents.find((i) => i.id === intentId);
          if (it && (it.status === "pending" || it.status === "declined")) it.status = "withdrawn";
        }),
      respondIntent: (intentId, decision) => {
        let convId: string | null = null;
        set((s) => {
          const it = s.db.intents.find((i) => i.id === intentId);
          if (!it || it.status !== "pending") return;
          it.respondedAt = nowIso();
          if (decision === "decline") {
            it.status = "declined";
            return;
          }
          it.status = "accepted";
          it.revealed = true;
          convId = uid("cv");
          it.conversationId = convId;
          const owner = personName(s.db, it.toId);
          const from = personName(s.db, it.fromId);
          const kindText = { invest: "投资", partner: "合作", join: "加入", help: "帮忙", other: "" }[it.kind];
          s.db.conversations.unshift({
            id: convId,
            intentId: it.id,
            projectId: it.projectId,
            members: [it.toId, it.fromId],
            status: "active",
            contactShared: {},
            createdAt: nowIso(),
            readAt: { [it.toId]: nowIso() },
            messages: [
              {
                id: uid("m"),
                from: "system",
                system: true,
                text: it.anonymous
                  ? `${owner} 点了「我也想聊」，双方身份已揭晓，对话已开启`
                  : `${owner} 接受了 ${from} 的${kindText}意向${it.sub ? `（${it.sub}）` : ""}，对话已开启`,
                at: nowIso(),
              },
            ],
          });
          pushNotification(s.db, {
            userId: it.fromId,
            type: "conversation",
            title: it.anonymous ? `${owner} 也想和你聊，身份已揭晓` : `${owner} 接受了你的意向`,
            body: "对话已开启，去打个招呼吧",
            link: `/inbox/${convId}`,
          });
        });
        return convId;
      },

      sendMessage: (convId, text, attachment) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || !s.viewerId || cv.status === "closed") return;
          cv.messages.push({ id: uid("m"), from: s.viewerId, text, at: nowIso(), attachment });
          cv.readAt[s.viewerId] = nowIso();
          const other = cv.members.find((m) => m !== s.viewerId)!;
          pushNotification(s.db, {
            userId: other,
            type: "conversation",
            title: `${personName(s.db, s.viewerId)} 发来新消息`,
            body: attachment ? `[附件] ${attachment.name}` : text.slice(0, 60),
            link: `/inbox/${convId}`,
          });
        }),
      shareContact: (convId, contact) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          const me = s.db.people.find((p) => p.id === s.viewerId);
          if (!cv || !me || cv.contactShared[me.id]) return;
          if (contact) me.contact = contact;
          cv.contactShared[me.id] = true;
          const bothShared = cv.members.every((m) => cv.contactShared[m]);
          systemMessage(cv, me.id, bothShared ? "双方已互换联系方式" : `${me.name} 分享了联系方式，等待对方交换`);
          pushNotification(s.db, {
            userId: cv.members.find((m) => m !== me.id)!,
            type: "conversation",
            title: bothShared ? `你和 ${me.name} 已互换联系方式` : `${me.name} 向你分享了联系方式`,
            body: bothShared ? "可以在对话右侧查看" : "交换后双方都能看到彼此的联系方式",
            link: `/inbox/${convId}`,
          });
        }),
      requestMatch: (convId, note) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || !s.viewerId || cv.match) return;
          cv.status = "match_requested";
          cv.match = { requestedBy: s.viewerId, note, at: nowIso() };
          systemMessage(cv, s.viewerId, `${personName(s.db, s.viewerId)} 申请了 Pitch 撮合，运营会在 1 个工作日内联系双方`);
          pushNotification(s.db, {
            userId: cv.members.find((m) => m !== s.viewerId)!,
            type: "conversation",
            title: `${personName(s.db, s.viewerId)} 申请了 Pitch 撮合`,
            body: note.slice(0, 60),
            link: `/inbox/${convId}`,
          });
          pushNotification(s.db, { userId: "u-ake", type: "system", title: "新的撮合申请", body: note.slice(0, 60), link: "/ops?tab=match" });
        }),
      closeConversation: (convId, reason) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || !s.viewerId) return;
          cv.status = "closed";
          cv.closedReason = reason;
          systemMessage(cv, s.viewerId, `${personName(s.db, s.viewerId)} 结束了对话：${reason}`);
        }),
      reopenConversation: (convId) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || !s.viewerId) return;
          cv.status = cv.match ? (cv.match.opsOwnerId ? "pitch_following" : "match_requested") : "active";
          cv.closedReason = undefined;
          systemMessage(cv, s.viewerId, `${personName(s.db, s.viewerId)} 重新开启了对话`);
        }),
      markConversationRead: (convId) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (cv && s.viewerId) cv.readAt[s.viewerId] = nowIso();
          s.db.notifications.forEach((n) => {
            if (n.userId === s.viewerId && n.link === `/inbox/${convId}`) n.read = true;
          });
        }),

      createProject: (input) => {
        const id = uid("pj");
        const taken = new Set(get().db.projects.map((p) => p.slug));
        const slug = slugify(input.name, taken);
        set((s) => {
          const me = s.db.people.find((p) => p.id === s.viewerId);
          if (!me) return;
          s.db.projects.unshift({
            id,
            slug,
            name: input.name,
            oneLiner: input.oneLiner,
            track: input.track,
            tags: [],
            region: me.city || "",
            logoTone: Math.floor(Math.random() * 10),
            logoText: input.name.trim().slice(0, 1) || "P",
            coverTone: Math.floor(Math.random() * 10),
            gallery: [],
            intro: "",
            product: "",
            edge: "",
            lookingFor: [],
            jobs: [],
            team: [{ personId: me.id, title: me.title || "创始人", role: "owner", status: "confirmed", invitedAt: nowIso() }],
            ownerId: me.id,
            visibility: input.visibility,
            wall: "none",
            updates: [],
            badges: [],
            responseHours: null,
            contact: { ...me.contact },
            createdAt: nowIso(),
            stats: { views: Array(14).fill(0), sources: { wechat: 0, moments: 0, poster: 0, discover: 0, demoday: 0, article: 0, direct: 0 } },
            followerBase: 0,
            ...input.prefill,
          });
          const created = s.db.projects[0];
          created.lookingFor = created.lookingFor.map((n) => ({ ...n, id: uid("n"), ownerType: "project", ownerId: id, createdAt: nowIso() }));
        });
        return slug;
      },
      updateProject: (projectId, patch) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (p) Object.assign(p, patch);
        }),
      recordView: (projectId, source) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p) return;
          p.stats.views[p.stats.views.length - 1] += 1;
          p.stats.sources[source] = (p.stats.sources[source] ?? 0) + 1;
        }),
      setNeeds: (projectId, needs) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (p) p.lookingFor = needs;
        }),
      inviteMember: (projectId, personId, title, role) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p || p.team.some((m) => m.personId === personId)) return;
          p.team.push({ personId, title, role, status: "invited", invitedAt: nowIso() });
          pushNotification(s.db, {
            userId: personId,
            type: "member",
            title: `${personName(s.db, s.viewerId)}邀请你成为${p.name}的成员`,
            body: `职位：${title}。确认后项目会出现在你的主页上`,
            link: "/me/intents?tab=invites",
          });
        }),
      respondInvite: (projectId, accept) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p || !s.viewerId) return;
          const m = p.team.find((t) => t.personId === s.viewerId && t.status === "invited");
          if (!m) return;
          if (accept) {
            m.status = "confirmed";
            pushNotification(s.db, { userId: p.ownerId, type: "member", title: `${personName(s.db, s.viewerId)} 确认加入了${p.name}`, body: m.title, link: `/dashboard/${p.slug}?tab=team` });
          } else {
            p.team = p.team.filter((t) => t !== m);
          }
        }),
      removeMember: (projectId, personId) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (p) p.team = p.team.filter((t) => t.personId !== personId || t.role === "owner");
        }),
      changeMemberRole: (projectId, personId, role) =>
        set((s) => {
          const m = s.db.projects.find((x) => x.id === projectId)?.team.find((t) => t.personId === personId);
          if (m && m.role !== "owner") m.role = role;
        }),
      postUpdate: (projectId, template, title, body) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p || !s.viewerId) return;
          p.updates.unshift({ id: uid("up"), template, title, body, at: nowIso(), authorId: s.viewerId });
          recordContribution(s.db, s.viewerId, "update", `${p.name}发布了一条动态`);
          const watchers = s.db.watch.filter((w) => w.projectId === p.id);
          watchers.forEach((w) => {
            const remind = w.remind ?? "all";
            if (remind === "off" || (remind === "key" && !KEY_UPDATE_TEMPLATES.includes(template))) return;
            pushNotification(s.db, { userId: w.userId, type: "update", title: `观察清单里的${p.name}有新动态`, body: title, link: `/watchlist#w-${p.id}` });
          });
          const skip = new Set([...watchers.map((w) => w.userId), ...p.team.map((m) => m.personId)]);
          s.db.follows
            .filter((f) => f.targetType === "project" && f.targetId === p.id && !skip.has(f.userId))
            .forEach((f) => pushNotification(s.db, { userId: f.userId, type: "update", title: `${p.name}发布了新动态`, body: title, link: `/p/${p.slug}#updates` }));
        }),
      deleteUpdate: (projectId, updateId) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (p) p.updates = p.updates.filter((u) => u.id !== updateId);
        }),
      applyWall: (projectId) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p) return;
          p.wall = "pending";
          p.visibility = "public";
          pushNotification(s.db, { userId: "u-ake", type: "system", title: `${p.name}申请上发现页`, body: p.oneLiner, link: "/ops?tab=review" });
        }),

      toggleWatch: (projectId) =>
        set((s) => {
          if (!s.viewerId) return;
          const idx = s.db.watch.findIndex((w) => w.userId === s.viewerId && w.projectId === projectId);
          if (idx >= 0) s.db.watch.splice(idx, 1);
          else s.db.watch.unshift({ userId: s.viewerId, projectId, note: "", remind: "all", addedAt: nowIso(), seenAt: nowIso() });
        }),
      setWatchNote: (projectId, note) =>
        set((s) => {
          const w = s.db.watch.find((x) => x.userId === s.viewerId && x.projectId === projectId);
          if (w) {
            w.note = note;
            w.noteAt = nowIso();
          }
        }),
      setWatchRemind: (projectId, remind) =>
        set((s) => {
          const w = s.db.watch.find((x) => x.userId === s.viewerId && x.projectId === projectId);
          if (w) w.remind = remind;
        }),
      markWatchSeen: (projectId) =>
        set((s) => {
          const w = s.db.watch.find((x) => x.userId === s.viewerId && x.projectId === projectId);
          if (w) w.seenAt = nowIso();
        }),
      markAllWatchSeen: () =>
        set((s) => {
          s.db.watch.forEach((w) => {
            if (w.userId === s.viewerId) w.seenAt = nowIso();
          });
        }),

      cheerUpdate: (projectId, updateId) =>
        set((s) => {
          const u = s.db.projects.find((p) => p.id === projectId)?.updates.find((x) => x.id === updateId);
          if (!u || !s.viewerId) return;
          const list = u.cheers ?? [];
          u.cheers = list.includes(s.viewerId) ? list.filter((x) => x !== s.viewerId) : [...list, s.viewerId];
        }),
      rsvpEvent: (eventId) =>
        set((s) => {
          const e = s.db.events.find((x) => x.id === eventId);
          if (!e || !s.viewerId) return;
          if (e.attendeeIds.includes(s.viewerId)) e.attendeeIds = e.attendeeIds.filter((x) => x !== s.viewerId);
          else e.attendeeIds.push(s.viewerId);
        }),
      enterEvent: (eventId) =>
        set((s) => {
          const e = s.db.events.find((x) => x.id === eventId);
          if (!e || !s.viewerId) return;
          if (!e.attendeeIds.includes(s.viewerId)) e.attendeeIds.push(s.viewerId);
          if (!e.presentIds.includes(s.viewerId)) e.presentIds.push(s.viewerId);
        }),

      applyDemoDay: (demoDayId, projectId, pitchNote) =>
        set((s) => {
          const dd = s.db.demoDays.find((d) => d.id === demoDayId);
          if (!dd || dd.entries.some((e) => e.projectId === projectId)) return;
          dd.entries.push({ projectId, status: "applied", appliedAt: nowIso(), pitchNote });
          const p = s.db.projects.find((x) => x.id === projectId);
          pushNotification(s.db, { userId: "u-ake", type: "demoday", title: `${p?.name}报名了${dd.title}`, body: pitchNote, link: "/ops?tab=review" });
        }),
      voteDemoDay: (demoDayId, projectId) =>
        set((s) => {
          const dd = s.db.demoDays.find((d) => d.id === demoDayId);
          const viewerId = s.viewerId;
          if (!dd || !viewerId || dd.status !== "open") return;
          const ev = s.db.events.find((e) => e.id === dd.eventId);
          if (ev && nowMs() > new Date(ev.end).getTime()) return;
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p || p.team.some((m) => m.personId === viewerId)) return;
          if (!dd.entries.some((e) => e.projectId === projectId && e.status === "shortlisted")) return;
          const list = (dd.votes[projectId] ??= []);
          if (list.includes(viewerId)) {
            dd.votes[projectId] = list.filter((x) => x !== viewerId);
          } else {
            const used = Object.values(dd.votes).filter((v) => v.includes(viewerId)).length;
            if (used >= DEMO_VOTES) return;
            list.push(viewerId);
            recordContribution(s.db, viewerId, "vote", `在${dd.title}为${p.name}投票`);
          }
        }),

      markNotificationRead: (id) =>
        set((s) => {
          const n = s.db.notifications.find((x) => x.id === id);
          if (n) n.read = true;
        }),
      markAllNotificationsRead: () =>
        set((s) => {
          s.db.notifications.forEach((n) => {
            if (n.userId === s.viewerId) n.read = true;
          });
        }),
      updateNotifyPrefs: (patch) =>
        set((s) => {
          if (!s.viewerId) return;
          const cur = notifyPrefsOf(s.db, s.viewerId);
          const next = { ...cur, ...patch, instant: [...(patch.instant ?? cur.instant)] };
          s.db.notifyPrefs = [...s.db.notifyPrefs.filter((p) => p.userId !== s.viewerId), next];
        }),
      sendTestDigest: (channel) =>
        set((s) => {
          if (!s.viewerId) return;
          const cur = notifyPrefsOf(s.db, s.viewerId);
          s.db.notifyPrefs = [...s.db.notifyPrefs.filter((p) => p.userId !== s.viewerId), { ...cur, instant: [...cur.instant], lastTestAt: nowIso() }];
          s.db.notifications.unshift({
            id: uid("nt"),
            userId: s.viewerId,
            type: "system",
            title: channel === "wechat" ? "测试周报已发送到服务号" : `测试周报已发送到 ${cur.email}`,
            body: "内容和周一正式发送的一致，数据截至现在",
            link: `/digest/preview?channel=${channel}`,
            at: nowIso(),
            read: false,
            pushed: channel === "wechat",
          });
        }),

      createSlot: (input) =>
        set((s) => {
          if (!s.viewerId || new Date(input.start).getTime() <= nowMs()) return;
          s.db.officeHours.push({ id: uid("oh"), hostId: s.viewerId, status: "open", ...input });
        }),
      bookSlot: (slotId, note) =>
        set((s) => {
          const slot = s.db.officeHours.find((x) => x.id === slotId);
          if (!slot || slot.status !== "open" || !s.viewerId || slot.hostId === s.viewerId) return;
          if (new Date(slot.start).getTime() <= nowMs()) return;
          const active = s.db.officeHours.some((x) => x.hostId === slot.hostId && x.bookedBy === s.viewerId && (x.status === "requested" || x.status === "confirmed") && new Date(x.start).getTime() > nowMs());
          if (active) return;
          slot.status = "requested";
          slot.bookedBy = s.viewerId;
          slot.note = note;
          slot.requestedAt = nowIso();
          pushNotification(s.db, { userId: slot.hostId, type: "officehours", title: `${personName(s.db, s.viewerId)} 预约了你的答疑时段`, body: `${slot.topic} · ${note.slice(0, 40)}`, link: "/office-hours?tab=hosting" });
        }),
      respondBooking: (slotId, accept, extra) =>
        set((s) => {
          const slot = s.db.officeHours.find((x) => x.id === slotId);
          if (!slot || slot.status !== "requested" || !slot.bookedBy) return;
          pushNotification(s.db, {
            userId: slot.bookedBy,
            type: "officehours",
            title: accept ? `${personName(s.db, slot.hostId)} 确认了你的答疑预约` : `${personName(s.db, slot.hostId)} 这个时段无法安排`,
            body: accept ? `${slot.topic}${extra?.meeting ? ` · ${extra.meeting}` : ""}` : extra?.reason || "可以换一个时段再试试",
            link: "/office-hours?tab=booked",
          });
          if (accept) {
            slot.status = "confirmed";
            slot.meeting = extra?.meeting;
          } else {
            slot.status = "open";
            slot.bookedBy = undefined;
            slot.note = undefined;
            slot.requestedAt = undefined;
          }
        }),
      cancelBooking: (slotId) =>
        set((s) => {
          const slot = s.db.officeHours.find((x) => x.id === slotId);
          if (!slot || slot.bookedBy !== s.viewerId || (slot.status !== "requested" && slot.status !== "confirmed")) return;
          pushNotification(s.db, {
            userId: slot.hostId,
            type: "officehours",
            title: `${personName(s.db, s.viewerId)} 取消了答疑预约`,
            body: `${formatDateTime(slot.start)} · ${slot.topic}，时段已重新开放`,
            link: "/office-hours?tab=hosting",
          });
          slot.status = "open";
          slot.bookedBy = undefined;
          slot.note = undefined;
          slot.requestedAt = undefined;
          slot.meeting = undefined;
        }),
      cancelSlot: (slotId, reason) =>
        set((s) => {
          const slot = s.db.officeHours.find((x) => x.id === slotId);
          if (!slot || slot.hostId !== s.viewerId) return;
          if (slot.bookedBy && (slot.status === "requested" || slot.status === "confirmed")) {
            pushNotification(s.db, {
              userId: slot.bookedBy,
              type: "officehours",
              title: `${personName(s.db, slot.hostId)} 取消了 ${formatDateTime(slot.start)} 的答疑`,
              body: reason || "可以看看 TA 的其他时段",
              link: "/office-hours?tab=booked",
            });
          }
          s.db.officeHours = s.db.officeHours.filter((x) => x.id !== slotId);
        }),

      reviewWall: (projectId, approve, note) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p) return;
          p.wall = approve ? "approved" : "rejected";
          p.wallNote = note;
          pushNotification(s.db, {
            userId: p.ownerId,
            type: "system",
            title: approve ? `${p.name}已上发现页` : `${p.name}暂未通过上墙审核`,
            body: approve ? "现在所有人都能在发现页看到你的项目" : note || "完善资料后可以重新申请；公开页不受影响",
            link: `/dashboard/${p.slug}?tab=exposure`,
          });
        }),
      reviewDemoDayEntry: (demoDayId, projectId, status, note) =>
        set((s) => {
          const dd = s.db.demoDays.find((d) => d.id === demoDayId);
          const e = dd?.entries.find((x) => x.projectId === projectId);
          if (!dd || !e) return;
          e.status = status;
          e.opsNote = note;
          const p = s.db.projects.find((x) => x.id === projectId);
          if (p && status === "shortlisted" && !p.badges.includes("demoday_shortlist")) p.badges.push("demoday_shortlist");
          if (p)
            pushNotification(s.db, {
              userId: p.ownerId,
              type: "demoday",
              title: status === "shortlisted" ? `${p.name}入围${dd.title}` : `${p.name}本月未入围`,
              body: status === "shortlisted" ? "投票已开放，分享给朋友为你投票吧" : note || "下个月可以再报名",
              link: "/demo-day",
            });
        }),
      takeMatch: (convId, opsNote) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || !cv.match || cv.match.opsOwnerId) return;
          const by = s.viewerId ?? "u-ake";
          cv.status = "pitch_following";
          cv.match.opsOwnerId = by;
          cv.match.opsNote = opsNote;
          cv.match.stage = "following";
          cv.match.log = [...(cv.match.log ?? []), { at: nowIso(), by, text: `接手：${opsNote}` }];
          cv.messages.push({ id: uid("m"), from: "system", system: true, text: `Pitch 运营 ${personName(s.db, s.viewerId)} 已接手跟进：${opsNote}`, at: nowIso() });
          cv.members.forEach((m) =>
            pushNotification(s.db, { userId: m, type: "conversation", title: "Pitch 运营已接手撮合", body: opsNote, link: `/inbox/${convId}` }),
          );
        }),
      opsInitiateMatch: (convId, note) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || cv.match || cv.status === "closed") return;
          const by = s.viewerId ?? "u-ake";
          cv.status = "pitch_following";
          cv.match = { requestedBy: by, note, at: nowIso(), opsOwnerId: by, opsNote: note, byOps: true, stage: "following", log: [{ at: nowIso(), by, text: `主动介入：${note}` }] };
          cv.messages.push({ id: uid("m"), from: "system", system: true, text: `Pitch 运营 ${personName(s.db, s.viewerId)} 主动加入撮合：${note}`, at: nowIso() });
          cv.members.forEach((m) =>
            pushNotification(s.db, { userId: m, type: "conversation", title: "Pitch 运营主动加入了你们的对话", body: note, link: `/inbox/${convId}` }),
          );
        }),

      updateMatch: (convId, stage, note) =>
        set((s) => {
          const cv = s.db.conversations.find((c) => c.id === convId);
          if (!cv || !cv.match?.opsOwnerId) return;
          const by = s.viewerId ?? "u-ake";
          const label = MATCH_STAGE[stage].label;
          cv.match.stage = stage;
          cv.match.opsNote = note;
          cv.match.log = [...(cv.match.log ?? []), { at: nowIso(), by, text: `${label}：${note}` }];
          cv.messages.push({ id: uid("m"), from: "system", system: true, text: `Pitch 运营更新了撮合进展：${label} · ${note}`, at: nowIso() });
          cv.members.forEach((m) => pushNotification(s.db, { userId: m, type: "conversation", title: `撮合进展：${label}`, body: note, link: `/inbox/${convId}` }));
        }),
      nudgeProject: (projectId, pending) =>
        set((s) => {
          const p = s.db.projects.find((x) => x.id === projectId);
          if (!p) return;
          p.nudgedAt = nowIso();
          pushNotification(s.db, {
            userId: p.ownerId,
            type: "intent",
            title: `${p.name}有 ${pending} 条意向超过 2 天没回应`,
            body: "回复速度会显示在项目页上，接受或暂不考虑都可以",
            link: `/dashboard/${p.slug}?tab=intents`,
          });
        }),

      submitProductFeedback: (text) =>
        set((s) => {
          if (!s.viewerId) return;
          s.db.productFeedback.unshift({ id: uid("pf"), userId: s.viewerId, text, at: nowIso() });
        }),
    })),
    {
      name: "pitch-proto-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ db: s.db, viewerId: s.viewerId }),
      skipHydration: true,
      version: SEED_VERSION,
      migrate: (persisted) => ({ db: createSeed(), viewerId: (persisted as { viewerId?: string | null })?.viewerId ?? "u-linchuan" }) as never,
    },
  ),
);

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as unknown as { __pitch?: typeof useApp };
  // 热更新会重建 store：必须先从 localStorage 恢复，否则下一次写入会用种子数据覆盖演示进度。
  if (w.__pitch) void Promise.resolve(useApp.persist.rehydrate()).then(() => useApp.getState().setHydrated());
  w.__pitch = useApp;
}

/** 本月意向额度：会员不限；非会员 5 次 + 贡献任务奖励（每类每月一次）。 */
export function computeQuota(db: DB, viewer: Person) {
  if (viewer.isMember) return { unlimited: true, limit: Infinity, used: 0, bonus: 0, remaining: Infinity };
  const used = db.intents.filter((i) => i.fromId === viewer.id && isSameMonth(i.createdAt, CURRENT_MONTH)).length;
  const bonus = new Set(db.contributions.filter((c) => c.userId === viewer.id && isSameMonth(c.at, CURRENT_MONTH)).map((c) => c.action)).size;
  const limit = MONTHLY_FREE_INTENTS + bonus;
  return { unlimited: false, limit, used, bonus, remaining: Math.max(0, limit - used) };
}
