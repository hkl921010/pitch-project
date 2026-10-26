export type Role = "founder" | "investor" | "talent" | "partner";

/** 意向类型：投资 / 合作 / 加入团队 / 帮忙（回应个人需求）/ 其他 */
export type IntentKind = "invest" | "partner" | "join" | "help" | "other";

export type PartnerSub = "渠道" | "流量" | "品牌" | "服务";

/** 项目寻求合作的宽类：上游、下游、融资。 */
export type CoopKind = "supply" | "channel" | "funding";

/** 自己花钱买的服务：朋友、新媒体、招人，或其他。 */
export type ServiceKind = "friend" | "media" | "hiring" | "other";

export interface Contact {
  wechat?: string;
  phone?: string;
  email?: string;
}

export interface InvestorStatus {
  tracks: string[];
  stages: string[];
  ticket: string;
  regions: string[];
}

export interface TalentStatus {
  openTo: string[];
  roles: string[];
  availability: string;
}

export interface PartnerOffer {
  id: string;
  title: string;
  desc: string;
}

export interface OpenStatus {
  active: boolean;
  headline: string;
  updatedAt: string;
  investor?: InvestorStatus;
  talent?: TalentStatus;
  offers?: PartnerOffer[];
}

/** 项目正在寻找的合作或服务。 */
export interface NeedItem {
  id: string;
  ownerType: "project" | "person";
  ownerId: string;
  kind: IntentKind;
  sub?: string;
  /** 项目合作宽类。和个人服务需求互斥。 */
  coop?: CoopKind;
  /** 项目要花钱买的服务。 */
  service?: ServiceKind;
  title: string;
  detail?: string;
  /** 卡片收起时的一句合作条件。 */
  summary?: string;
  /** 合作方式：分成、报价、估值，以及这笔合作对应的结果。 */
  terms?: string;
  /** 点开后的案例、测算或补充说明。 */
  story?: string;
  /** 点开后附的方案图或实拍。 */
  storyImages?: { src: string; caption: string }[];
  createdAt: string;
}

export interface Person {
  id: string;
  handle: string;
  name: string;
  avatarTone: number;
  role: Role | null;
  isOps?: boolean;
  title: string;
  org: string;
  city: string;
  bio: string;
  doingNow?: { oneLiner: string; info: string; highlights: string };
  openStatus: OpenStatus;
  contact: Contact;
  isMember: boolean;
  onboarded: boolean;
  joinedAt: string;
  /** 演示用的历史关注基数，避免为每个关注都造一条记录 */
  followerBase?: number;
}

export type TeamRole = "owner" | "manager" | "editor" | "member";

export interface TeamMember {
  personId: string;
  title: string;
  role: TeamRole;
  status: "confirmed" | "invited";
  invitedAt: string;
}

export interface Job {
  id: string;
  title: string;
  type: "全职" | "合伙人" | "兼职顾问";
  location: string;
  desc: string;
}

export type UpdateTemplate = "launch" | "funding" | "hiring" | "award" | "milestone" | "free";

export interface ProjectUpdate {
  id: string;
  template: UpdateTemplate;
  title: string;
  body: string;
  at: string;
  authorId: string;
  /** 点“鼓励”的人；只计数，不通知。 */
  cheers?: string[];
}

export interface GalleryItem {
  id: string;
  caption: string;
  tone: number;
  /** 项目介绍里的实拍或方案图。 */
  image?: string;
}

export type TrafficSource = "wechat" | "moments" | "poster" | "discover" | "demoday" | "article" | "direct";

export interface Project {
  id: string;
  slug: string;
  name: string;
  oneLiner: string;
  track: string;
  tags: string[];
  region: string;
  logoTone: number;
  logoText: string;
  /** 页头品牌图，通常是 logo 主视觉。 */
  coverImage?: string;
  coverTone: number;
  gallery: GalleryItem[];
  /** 页头上的短亮点，不写成长文。 */
  highlights?: string[];
  intro: string;
  product: string;
  edge: string;
  /** 寻找合作、寻找服务下面的详细介绍。页头只放短的三段。 */
  profile?: string;
  website?: string;
  lookingFor: NeedItem[];
  jobs: Job[];
  team: TeamMember[];
  ownerId: string;
  visibility: "public" | "link";
  wall: "none" | "pending" | "approved" | "rejected";
  wallNote?: string;
  updates: ProjectUpdate[];
  badges: string[];
  responseHours: number | null;
  /** 运营最近一次提醒项目方回应意向的时间。 */
  nudgedAt?: string;
  contact: Contact;
  createdAt: string;
  stats: { views: number[]; sources: Record<TrafficSource, number> };
  followerBase?: number;
}

export type IntentStatus = "pending" | "accepted" | "declined" | "withdrawn";

export interface Intent {
  id: string;
  fromId: string;
  toId: string;
  projectId?: string;
  needId?: string;
  jobId?: string;
  kind: IntentKind;
  sub?: string;
  message: string;
  anonymous: boolean;
  revealed: boolean;
  status: IntentStatus;
  createdAt: string;
  respondedAt?: string;
  conversationId?: string;
}

export interface Message {
  id: string;
  from: string;
  text: string;
  at: string;
  attachment?: { name: string; size: string };
  system?: boolean;
}

export type ConversationStatus = "active" | "match_requested" | "pitch_following" | "closed";

/** 撮合即 CRM 商机：跟进中 → 已约见 → 成交 / 未成交。 */
export type MatchStage = "following" | "met" | "won" | "lost";

export interface Conversation {
  id: string;
  intentId: string;
  projectId?: string;
  members: [string, string];
  messages: Message[];
  contactShared: Record<string, boolean>;
  status: ConversationStatus;
  match?: {
    requestedBy: string;
    note: string;
    at: string;
    opsOwnerId?: string;
    opsNote?: string;
    byOps?: boolean;
    /** 运营接手后的推进阶段；未接手时为空。 */
    stage?: MatchStage;
    log?: { at: string; by: string; text: string }[];
  };
  closedReason?: string;
  createdAt: string;
  readAt: Record<string, string>;
}

export interface Follow {
  userId: string;
  targetType: "project" | "person";
  targetId: string;
  at: string;
}

/** all：每条动态都提醒；key：只提醒上线、融资、获奖、里程碑；off：不提醒，只在清单里标“有更新”。 */
export type WatchRemind = "all" | "key" | "off";

export interface WatchItem {
  userId: string;
  projectId: string;
  note: string;
  noteAt?: string;
  remind?: WatchRemind;
  addedAt: string;
  seenAt: string;
}

export interface PitchEvent {
  id: string;
  title: string;
  kind: "online" | "offline";
  start: string;
  end: string;
  city?: string;
  venue?: string;
  coverTone: number;
  host: string;
  desc: string;
  speakerIds: string[];
  projectIds: string[];
  attendeeIds: string[];
  presentIds: string[];
  /** 线下活动的名额；线上不限。 */
  capacity?: number;
  demoDayId?: string;
  agenda: { time: string; title: string }[];
  /** 活动结束后的回顾：回放时长或纪要，以及关联的报道。 */
  recap?: { summary: string; replayMins?: number; articleId?: string };
}

export interface Article {
  id: string;
  title: string;
  column: string;
  author: string;
  summary: string;
  coverTone: number;
  at: string;
  projectIds: string[];
  readMins: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  tag: string;
  at: string;
  projectId?: string;
}

export interface DemoDayEntry {
  projectId: string;
  status: "applied" | "shortlisted" | "rejected";
  appliedAt: string;
  pitchNote: string;
  opsNote?: string;
}

export interface DemoDay {
  id: string;
  month: string;
  title: string;
  theme: string;
  status: "open" | "ended";
  applyDeadline: string;
  randomUntil: string;
  eventId: string;
  entries: DemoDayEntry[];
  votes: Record<string, string[]>;
  results?: string[];
  recap?: { viewers: number; intents: number; matches: number; quote: string };
}

export type NotificationType = "intent" | "conversation" | "update" | "demoday" | "member" | "officehours" | "system" | "reward";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  at: string;
  read: boolean;
  /** 发出时是否同时推送到了服务号（按当时的提醒设置）。 */
  pushed?: boolean;
}

/** weekly：每周一 09:00；important：只在有待处理的事时发；off：不发周报，站内通知照常。 */
export type DigestFrequency = "weekly" | "important" | "off";

export interface NotifyPrefs {
  userId: string;
  /** 关注了 Pitch 服务号才能收到服务号消息。 */
  wechatBound: boolean;
  wechatOn: boolean;
  email?: string;
  emailOn: boolean;
  frequency: DigestFrequency;
  /** 推送到服务号的即时提醒；其余类型只进站内通知中心，并汇总进周报。 */
  instant: NotificationType[];
  lastTestAt?: string;
}

export type ContributionAction = "vote" | "update" | "status_refresh";

export interface Contribution {
  id: string;
  userId: string;
  action: ContributionAction;
  at: string;
  label: string;
}

export interface OfficeHourSlot {
  id: string;
  hostId: string;
  start: string;
  mins: number;
  topic: string;
  mode: "online" | "offline";
  status: "open" | "requested" | "confirmed" | "declined";
  bookedBy?: string;
  note?: string;
  requestedAt?: string;
  /** 确认时主持人填写的会议链接或见面地点，只有预约人能看到。 */
  meeting?: string;
}

export interface ProductFeedback {
  id: string;
  userId: string;
  text: string;
  at: string;
}

export interface DB {
  people: Person[];
  projects: Project[];
  intents: Intent[];
  conversations: Conversation[];
  follows: Follow[];
  watch: WatchItem[];
  events: PitchEvent[];
  articles: Article[];
  news: NewsItem[];
  demoDays: DemoDay[];
  notifications: Notification[];
  notifyPrefs: NotifyPrefs[];
  contributions: Contribution[];
  officeHours: OfficeHourSlot[];
  productFeedback: ProductFeedback[];
}
