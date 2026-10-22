"use client";

import { useShallow } from "zustand/react/shallow";

import { BADGES, INTENT_KIND_LABEL, ROLE_LABEL, TOP_CONTRIBUTOR_TASKS } from "@/data/constants";
import { monthOf, nowMs } from "@/data/time";
import type { Conversation, ConversationStatus, DB, DemoDay, Endorsement, Intent, NeedItem, Person, PitchEvent, Project, ProjectUpdate, WatchItem } from "@/data/types";
import { computeQuota, useApp } from "./app-store";

export function useDB(): DB {
  return useApp((s) => s.db);
}

export function useViewer(): Person | null {
  return useApp(useShallow((s) => s.db.people.find((p) => p.id === s.viewerId) ?? null));
}

export function useQuota() {
  const db = useDB();
  const viewer = useViewer();
  return viewer ? computeQuota(db, viewer) : null;
}

export const getPerson = (db: DB, id: string | undefined | null) => db.people.find((p) => p.id === id);
export const getProject = (db: DB, id: string | undefined | null) => db.projects.find((p) => p.id === id);
export const getProjectBySlug = (db: DB, slug: string) => db.projects.find((p) => p.slug === slug);
export const getPersonByHandle = (db: DB, handle: string) => db.people.find((p) => p.handle === handle);

export function roleText(p: Person | undefined | null): string {
  if (!p) return "";
  if (p.isOps) return "Pitch 运营";
  return p.role ? ROLE_LABEL[p.role] : "新用户";
}

export function followerCount(db: DB, targetType: "project" | "person", id: string): number {
  const base = targetType === "project" ? getProject(db, id)?.followerBase ?? 0 : getPerson(db, id)?.followerBase ?? 0;
  return base + db.follows.filter((f) => f.targetType === targetType && f.targetId === id).length;
}

export function isFollowing(db: DB, viewerId: string | null, targetType: "project" | "person", id: string): boolean {
  return !!viewerId && db.follows.some((f) => f.userId === viewerId && f.targetType === targetType && f.targetId === id);
}

/** “你认识的人”：和你有过对话、或你关注的人。 */
export function acquaintances(db: DB, viewerId: string | null): Set<string> {
  const set = new Set<string>();
  if (!viewerId) return set;
  db.conversations.forEach((c) => {
    if (c.members.includes(viewerId)) c.members.forEach((m) => m !== viewerId && set.add(m));
  });
  db.follows.forEach((f) => f.userId === viewerId && f.targetType === "person" && set.add(f.targetId));
  return set;
}

export function knownFollowers(db: DB, viewerId: string | null, targetType: "project" | "person", id: string): Person[] {
  const known = acquaintances(db, viewerId);
  const ids = new Set<string>();
  db.follows.forEach((f) => f.targetType === targetType && f.targetId === id && known.has(f.userId) && ids.add(f.userId));
  db.endorsements.forEach((e) => e.targetType === targetType && e.targetId === id && known.has(e.fromId) && ids.add(e.fromId));
  return [...ids].map((x) => getPerson(db, x)).filter(Boolean) as Person[];
}

export function endorsementsFor(db: DB, targetType: "project" | "person", id: string): Endorsement[] {
  return db.endorsements.filter((e) => e.targetType === targetType && e.targetId === id);
}

export function endorsementDimensions(list: Endorsement[]): { dimension: string; count: number; items: Endorsement[] }[] {
  const map = new Map<string, Endorsement[]>();
  list.forEach((e) => map.set(e.dimension, [...(map.get(e.dimension) ?? []), e]));
  return [...map.entries()].map(([dimension, items]) => ({ dimension, count: items.length, items })).sort((a, b) => b.count - a.count);
}

/** 软认证：有多少位投资人为 TA 背书。 */
export function investorEndorsers(db: DB, personId: string): number {
  const ids = new Set(
    db.endorsements
      .filter((e) => e.targetType === "person" && e.targetId === personId && getPerson(db, e.fromId)?.role === "investor")
      .map((e) => e.fromId),
  );
  return ids.size;
}

export function projectsOf(db: DB, personId: string): { project: Project; title: string; isOwner: boolean }[] {
  return db.projects
    .flatMap((p) => {
      const m = p.team.find((t) => t.personId === personId && t.status === "confirmed");
      return m ? [{ project: p, title: m.title, isOwner: m.role === "owner" }] : [];
    })
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner));
}

export function manageableProjects(db: DB, personId: string): Project[] {
  return db.projects.filter((p) => p.team.some((t) => t.personId === personId && t.status === "confirmed" && (t.role === "owner" || t.role === "manager")));
}

export function canEditProject(project: Project, viewerId: string | null): boolean {
  return !!viewerId && project.team.some((t) => t.personId === viewerId && t.status === "confirmed" && t.role !== "member");
}

export function canManageProject(project: Project, viewerId: string | null): boolean {
  return !!viewerId && project.team.some((t) => t.personId === viewerId && t.status === "confirmed" && (t.role === "owner" || t.role === "manager"));
}

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

export function projectCompletion(p: Project): { items: CompletionItem[]; percent: number; remaining: number } {
  const items: CompletionItem[] = [
    { key: "basic", label: "名称、一句话与赛道", done: !!(p.name.trim() && p.oneLiner.trim() && p.track), hint: "发现页卡片上最先被看到的三样" },
    { key: "logo", label: "Logo 与封面", done: p.gallery.length > 0, hint: "第一眼的印象，至少一张图" },
    { key: "intro", label: "项目介绍", done: p.intro.trim().length >= 30, hint: "讲清楚在做什么、做到哪了" },
    { key: "product", label: "在卖什么", done: p.product.trim().length > 0, hint: "产品、价格、谁在买" },
    { key: "edge", label: "凭什么", done: p.edge.trim().length > 0, hint: "团队或数据上的优势" },
    { key: "looking", label: "正在寻找", done: p.lookingFor.length > 0, hint: "融资、合作、招人，让对的人找到你" },
    { key: "team", label: "团队成员", done: p.team.filter((t) => t.status === "confirmed").length >= 2, hint: "邀请合伙人，项目会出现在他们主页上" },
    { key: "contact", label: "联系方式", done: !!(p.contact.wechat || p.contact.phone || p.contact.email), hint: "只在对话中按需分享" },
    { key: "update", label: "第一条动态", done: p.updates.length > 0, hint: "让关注者知道你在前进" },
  ];
  const doneCount = items.filter((i) => i.done).length;
  return { items, percent: Math.round((doneCount / items.length) * 100), remaining: items.length - doneCount };
}

export interface NeedWithOwner {
  need: NeedItem;
  project?: Project;
  person?: Person;
}

export function allNeeds(db: DB): NeedWithOwner[] {
  const fromProjects = db.projects
    .filter((p) => p.visibility === "public" && p.wall === "approved")
    .flatMap((p) => p.lookingFor.map((need) => ({ need, project: p, person: getPerson(db, p.ownerId) })));
  const fromPeople = db.people.flatMap((person) => person.lookingFor.map((need) => ({ need, person })));
  return [...fromProjects, ...fromPeople].sort((a, b) => b.need.createdAt.localeCompare(a.need.createdAt));
}

export function intentsReceived(db: DB, viewerId: string | null): Intent[] {
  if (!viewerId) return [];
  const projectIds = new Set(manageableProjects(db, viewerId).map((p) => p.id));
  return db.intents.filter((i) => i.toId === viewerId || (i.projectId && projectIds.has(i.projectId)));
}

export function intentsSent(db: DB, viewerId: string | null): Intent[] {
  if (!viewerId) return [];
  return db.intents.filter((i) => i.fromId === viewerId);
}

/** 直接找人（不指向项目或需求）时，“加入团队”的方向反过来：是邀请对方加入。 */
export function intentKindLabel(i: Pick<Intent, "kind" | "projectId" | "needId">): string {
  if (!i.projectId && !i.needId && i.kind === "join") return "邀请加入团队";
  return INTENT_KIND_LABEL[i.kind];
}

export const INTENT_WAIT_DAYS = 7;

/**
 * 发起方视角。“暂不考虑”对发起方不可见：7 天内与待回应一样显示“等待回应”，
 * 7 天后两者统一为“暂未回应”，此时可以再次表达意向。
 */
export function requesterView(i: Intent): "waiting" | "no_response" | "accepted" | "withdrawn" {
  if (i.status === "accepted") return "accepted";
  if (i.status === "withdrawn") return "withdrawn";
  const days = (nowMs() - new Date(i.createdAt).getTime()) / 86_400_000;
  return days < INTENT_WAIT_DAYS ? "waiting" : "no_response";
}

export function requesterStatusLabel(i: Intent): { label: string; tone: "gray" | "brand" | "success" | "warning" } {
  switch (requesterView(i)) {
    case "waiting":
      return { label: i.anonymous ? "匿名等待中" : "等待回应", tone: "brand" };
    case "accepted":
      return { label: "已开始对话", tone: "success" };
    case "no_response":
      return { label: "暂未回应", tone: "gray" };
    case "withdrawn":
      return { label: "已撤回", tone: "gray" };
  }
}

export function isConversationUnread(c: Conversation, viewerId: string): boolean {
  const last = c.messages[c.messages.length - 1];
  if (!last || last.from === viewerId) return false;
  return !c.readAt[viewerId] || c.readAt[viewerId] < last.at;
}

export function unreadConversations(db: DB, viewerId: string | null): number {
  if (!viewerId) return 0;
  return db.conversations.filter((c) => c.members.includes(viewerId) && isConversationUnread(c, viewerId)).length;
}

export function lastActivity(c: Conversation): string {
  return c.messages[c.messages.length - 1]?.at ?? c.createdAt;
}

export function conversationsOf(db: DB, viewerId: string | null): Conversation[] {
  if (!viewerId) return [];
  return db.conversations.filter((c) => c.members.includes(viewerId)).sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
}

export function otherMember(db: DB, c: Conversation, viewerId: string | null): Person | undefined {
  return getPerson(db, c.members.find((m) => m !== viewerId) ?? c.members[0]);
}

export const CONVERSATION_STATUS: Record<ConversationStatus, { label: string; tone: "success" | "brand" | "warning" | "gray"; desc: string }> = {
  active: { label: "进行中", tone: "success", desc: "双方可以自由沟通" },
  match_requested: { label: "已申请撮合", tone: "warning", desc: "运营会在 1 个工作日内联系双方" },
  pitch_following: { label: "Pitch 跟进中", tone: "brand", desc: "运营正在协助推进" },
  closed: { label: "已结束", tone: "gray", desc: "重新开启后可继续沟通" },
};

/** 撮合结案后，“Pitch 跟进中”换成结果。 */
export function conversationStatus(c: Conversation) {
  if (c.status === "pitch_following" && c.match?.stage === "won") return { label: "撮合成交", tone: "success" as const, desc: "运营已结案，双方可继续沟通" };
  if (c.status === "pitch_following" && c.match?.stage === "lost") return { label: "撮合未成交", tone: "gray" as const, desc: "运营已结案，双方可继续沟通" };
  return CONVERSATION_STATUS[c.status];
}

export function pendingIntentCount(db: DB, viewerId: string | null): number {
  return intentsReceived(db, viewerId).filter((i) => i.status === "pending").length;
}

export function unreadNotifications(db: DB, viewerId: string | null): number {
  if (!viewerId) return 0;
  return db.notifications.filter((n) => n.userId === viewerId && !n.read).length;
}

export function badgeDefs(ids: string[]) {
  return ids.map((id) => BADGES[id]).filter(Boolean);
}

/** 每月完成的贡献任务种类数，取最多的那个月。 */
export function bestContributionMonth(db: DB, userId: string): { month: string | null; count: number } {
  const byMonth = new Map<string, Set<string>>();
  db.contributions
    .filter((c) => c.userId === userId)
    .forEach((c) => {
      const m = monthOf(c.at);
      byMonth.set(m, (byMonth.get(m) ?? new Set()).add(c.action));
    });
  let best: { month: string | null; count: number } = { month: null, count: 0 };
  byMonth.forEach((set, month) => {
    if (set.size > best.count) best = { month, count: set.size };
  });
  return best;
}

/** 个人徽章：由背书、贡献、早期成员等派生。 */
export function personBadges(db: DB, person: Person): string[] {
  const out: string[] = [];
  if (endorsementsFor(db, "person", person.id).length >= 10) out.push("endorsed_10");
  if (followerCount(db, "person", person.id) >= 100) out.push("followers_100");
  if (bestContributionMonth(db, person.id).count >= TOP_CONTRIBUTOR_TASKS) out.push("top_contributor");
  if (person.joinedAt < "2026-01-01") out.push("early_member");
  return out;
}

export function responseLabel(hours: number | null): { label: string; tone: "success" | "brand" | "gray" } {
  if (hours === null) return { label: "暂无回复记录", tone: "gray" };
  if (hours <= 12) return { label: "通常半天内回复", tone: "success" };
  if (hours <= 24) return { label: "通常 1 天内回复", tone: "success" };
  if (hours <= 48) return { label: "通常 2 天内回复", tone: "brand" };
  return { label: "回复较慢", tone: "gray" };
}

/** 活动状态以原型固定时间为准，保证“正在直播”稳定可演示。 */
export function eventStatus(ev: PitchEvent): "live" | "upcoming" | "ended" {
  const now = nowMs();
  const s = new Date(ev.start).getTime();
  const e = new Date(ev.end).getTime();
  if (now >= s && now <= e) return "live";
  return now < s ? "upcoming" : "ended";
}

/** 观察清单里，自上次查看后有新动态的项目。 */
export function watchUpdates(db: DB, viewerId: string | null): { item: WatchItem; project: Project; fresh: ProjectUpdate[] }[] {
  if (!viewerId) return [];
  return db.watch
    .filter((w) => w.userId === viewerId)
    .map((item) => {
      const project = getProject(db, item.projectId)!;
      const fresh = project ? project.updates.filter((u) => u.at > item.seenAt) : [];
      return { item, project, fresh };
    })
    .filter((x) => x.project);
}

/** 当月开放中的路演。 */
export function currentDemoDay(db: DB): DemoDay | undefined {
  return db.demoDays.find((d) => d.status === "open");
}

export interface FirstStep {
  key: string;
  title: string;
  desc: string;
  done: boolean;
  href?: string;
  action?: "create";
  cta: string;
}

/** 首次引导：按身份给 3 个第一步动作，完成与否全部由真实数据推导。 */
export function firstSteps(db: DB, viewer: Person): FirstStep[] {
  const follows = db.follows.filter((f) => f.userId === viewer.id && f.targetType === "project").length;
  const sent = db.intents.filter((i) => i.fromId === viewer.id);
  switch (viewer.role) {
    case "founder": {
      const mine = manageableProjects(db, viewer.id);
      const first = mine[0];
      return [
        { key: "create", title: "用 1 分钟创建项目", desc: "只填名称、一句话、赛道，立刻拥有公开主页", done: mine.length > 0, action: "create", cta: "创建项目" },
        {
          key: "looking",
          title: "写下你正在寻找什么",
          desc: "融资、渠道、合伙人……写清楚，对的人才会来找你",
          done: mine.some((p) => p.lookingFor.length > 0),
          href: first ? `/p/${first.slug}/edit#looking` : undefined,
          action: first ? undefined : "create",
          cta: "去填写",
        },
        {
          key: "share",
          title: "把项目页转发给 3 个朋友",
          desc: "第一批关注通常来自熟人，转发后能在工作台看到来源",
          done: mine.some((p) => p.stats.sources.wechat + p.stats.sources.moments > 0),
          href: first ? `/dashboard/${first.slug}?tab=share` : undefined,
          action: first ? undefined : "create",
          cta: "生成分享物料",
        },
      ];
    }
    case "investor":
      return [
        { key: "pref", title: "设置投资偏好", desc: "赛道、阶段、单笔金额，匹配的项目会优先出现在首页和周报", done: !!viewer.openStatus.investor?.tracks.length, href: `/u/${viewer.handle}?edit=status`, cta: "去设置" },
        { key: "watch", title: "收藏 3 个项目到观察清单", desc: "项目更新时会提醒你，备注只有你自己能看到", done: db.watch.filter((w) => w.userId === viewer.id).length >= 3, href: "/discover", cta: "去发现页" },
        { key: "oh", title: "开放一个答疑时段", desc: "创始人可以预约 20 分钟，是最轻的看项目方式", done: db.officeHours.some((s) => s.hostId === viewer.id), href: "/office-hours?tab=hosting&create=1", cta: "开放时段" },
      ];
    case "talent":
      return [
        { key: "status", title: "设置开放状态", desc: "开放合伙、全职还是顾问？项目方会按这个来找你", done: !!viewer.openStatus.talent?.openTo.length, href: `/u/${viewer.handle}?edit=status`, cta: "去设置" },
        { key: "follow", title: "关注 3 个感兴趣的项目", desc: "项目招人、发动态时你会第一个知道", done: follows >= 3, href: "/discover", cta: "去发现页" },
        { key: "join", title: "向一个在招的项目表达意向", desc: "可以选择具体岗位，对方接受后直接对话", done: sent.some((i) => i.kind === "join"), href: "/discover?tab=needs&kind=join", cta: "看在招岗位" },
      ];
    case "partner":
      return [
        { key: "offers", title: "写下你能提供的资源", desc: "渠道、流量、服务……项目方会在你主页上看到", done: !!viewer.openStatus.offers?.length, href: `/u/${viewer.handle}?edit=status`, cta: "去填写" },
        { key: "needs", title: "回应一条合作需求", desc: "发现页“需求”里汇总了项目和个人正在寻找的合作", done: sent.some((i) => i.kind === "partner" || i.kind === "help"), href: "/discover?tab=needs&kind=partner", cta: "看合作需求" },
        { key: "follow", title: "关注 3 个项目", desc: "项目有新进展时，你会收到通知和周报", done: follows >= 3, href: "/discover", cta: "去发现页" },
      ];
    default:
      return [];
  }
}

/** 匿名意向里给项目方看的身份概要：只透露身份类型与偏好，不透露姓名机构。 */
export function anonymousProfile(db: DB, person: Person | undefined): string {
  if (!person) return "一位用户";
  const role = person.role ? ROLE_LABEL[person.role] : "用户";
  const pref = person.openStatus.investor?.tracks.slice(0, 2).join(" · ");
  const endorsed = investorEndorsers(db, person.id);
  return [`一位${person.openStatus.investor?.stages[0] ? "早期" : ""}${role}`, pref ? `关注 ${pref}` : "", endorsed ? `被 ${endorsed} 位投资人背书` : ""]
    .filter(Boolean)
    .join("，");
}
