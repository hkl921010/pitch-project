import type { CoopKind, DigestFrequency, IntentKind, MatchStage, NotificationType, Role, ServiceKind, TrafficSource, UpdateTemplate, WatchRemind } from "./types";

/** 原型的“当前时间”，所有相对时间、额度周期、活动状态都以它为准。 */
export const NOW = "2026-10-21T18:00:00+08:00";
export const CURRENT_MONTH = "2026-10";

export const ROLE_LABEL: Record<Role, string> = {
  founder: "创始人",
  investor: "投资人",
  talent: "人才",
  partner: "产业合作方",
};

export const ROLE_DESC: Record<Role, string> = {
  founder: "我在做一个项目，想被看见、找到钱、人和渠道",
  investor: "我在找值得投的项目，想更早看到好团队",
  talent: "我想加入一个靠谱的创业项目，或做合伙人",
  partner: "我能提供渠道、流量、服务，想找到合适的项目",
};

export const TRACKS = [
  "新茶饮",
  "消费品牌",
  "AI 应用",
  "智能硬件",
  "医疗健康",
  "新能源",
  "企业服务",
  "美妆个护",
  "食品",
  "教育",
  "家居",
  "户外运动",
] as const;

export const REGIONS = ["东南亚", "北美", "欧洲", "中东", "日韩", "拉美", "全球"] as const;

export const STAGES = ["种子", "天使", "Pre-A", "A 轮", "B 轮及以后"] as const;

export const INTENT_KIND_LABEL: Record<IntentKind, string> = {
  invest: "想投资",
  partner: "想合作",
  join: "想加入团队",
  help: "我能帮上忙",
  other: "其他",
};

export const NEED_KIND_LABEL: Record<IntentKind, string> = {
  invest: "融资",
  partner: "合作",
  join: "招人",
  help: "求助",
  other: "其他",
};

export const PARTNER_SUBS = ["渠道", "流量", "品牌", "服务"] as const;

export const COOP_LABEL: Record<CoopKind, string> = {
  supply: "供应链",
  channel: "渠道",
  funding: "融资",
};

export const COOP_ORDER: CoopKind[] = ["supply", "channel", "funding"];

export const SERVICE_LABEL: Record<ServiceKind, string> = {
  friend: "朋友",
  media: "新媒体",
  hiring: "招人",
  other: "其他",
};

export const SERVICE_ORDER: ServiceKind[] = ["friend", "media", "hiring", "other"];

export const UPDATE_TEMPLATES: Record<UpdateTemplate, { label: string; title: string; placeholder: string }> = {
  launch: { label: "上线", title: "我们上线了：", placeholder: "上线了什么？用户可以在哪里体验？" },
  funding: { label: "完成融资", title: "完成新一轮融资", placeholder: "可以写投资方、资金用途，金额可不写" },
  hiring: { label: "招人", title: "我们在招：", placeholder: "招什么人？为什么现在是加入的好时机？" },
  award: { label: "获奖/入选", title: "入选：", placeholder: "获得了什么认可？" },
  milestone: { label: "数据里程碑", title: "里程碑：", placeholder: "达成了什么数据？对比上个月如何？" },
  free: { label: "自由发布", title: "", placeholder: "最近有什么进展？" },
};

export const KEY_UPDATE_TEMPLATES: UpdateTemplate[] = ["launch", "funding", "award", "milestone"];

export const WATCH_REMIND: Record<WatchRemind, { label: string; desc: string }> = {
  all: { label: "所有动态", desc: "项目发布任何动态都提醒" },
  key: { label: "仅关键动态", desc: "上线、融资、获奖、里程碑" },
  off: { label: "不提醒", desc: "只在清单里标“有更新”" },
};

export type NotificationGroup = "deal" | "project" | "me" | "system";

export const NOTIFICATION_GROUPS: Record<NotificationGroup, string> = {
  deal: "意向与对话",
  project: "项目",
  me: "与我有关",
  system: "系统",
};

export const NOTIFICATION_TYPES: Record<NotificationType, { label: string; group: NotificationGroup; desc: string }> = {
  intent: { label: "意向", group: "deal", desc: "收到新意向、对方回应了你的意向" },
  conversation: { label: "对话", group: "deal", desc: "对话里的新消息、撮合进展" },
  member: { label: "成员邀请", group: "deal", desc: "邀请你加入项目，或对方确认了邀请" },
  officehours: { label: "答疑预约", group: "deal", desc: "预约、确认和开始前提醒" },
  update: { label: "项目动态", group: "project", desc: "关注和观察的项目发布了动态" },
  demoday: { label: "月度路演", group: "project", desc: "入围、投票开放和结果" },
  reward: { label: "奖励", group: "me", desc: "贡献任务完成、获得徽章" },
  system: { label: "系统", group: "system", desc: "审核结果和账号相关的通知" },
};

/** 默认推送到服务号的类型：都是需要对方等你回应的事。 */
export const DEFAULT_INSTANT: NotificationType[] = ["intent", "conversation", "member", "officehours"];

export const DIGEST_FREQUENCY: Record<DigestFrequency, { label: string; desc: string }> = {
  weekly: { label: "每周一份", desc: "每周一 09:00 发送上一周的汇总" },
  important: { label: "有待办时才发", desc: "有待回应的意向、待确认的预约时才发，其余周跳过" },
  off: { label: "不接收周报", desc: "站内通知和服务号即时提醒照常" },
};

export const SOURCE_LABEL: Record<TrafficSource, string> = {
  wechat: "微信好友",
  moments: "朋友圈",
  poster: "海报扫码",
  discover: "发现页",
  demoday: "月度路演",
  article: "Pitch 报道",
  direct: "直接访问",
};

export interface BadgeDef {
  id: string;
  label: string;
  desc: string;
  tone: "brand" | "highlight" | "success" | "blue" | "gray";
}

export const BADGES: Record<string, BadgeDef> = {
  demoday_top3: { id: "demoday_top3", label: "月度路演前三", desc: "在月度路演中投票排名前三", tone: "highlight" },
  demoday_shortlist: { id: "demoday_shortlist", label: "路演入围", desc: "入围 Pitch 月度路演", tone: "brand" },
  pitch_featured: { id: "pitch_featured", label: "Pitch 报道", desc: "被 Pitch 专栏报道过", tone: "brand" },
  followers_100: { id: "followers_100", label: "100 关注", desc: "获得 100 位用户关注", tone: "success" },
  fast_responder: { id: "fast_responder", label: "回复迅速", desc: "近 30 天意向平均 24 小时内回复", tone: "blue" },
  top_contributor: { id: "top_contributor", label: "社区贡献者", desc: "单月完成至少 3 项贡献任务", tone: "highlight" },
  early_member: { id: "early_member", label: "早期成员", desc: "Pitch 社区早期成员", tone: "gray" },
};

export const MATCH_STAGE: Record<MatchStage, { label: string; tone: "brand" | "blue" | "success" | "gray" }> = {
  following: { label: "跟进中", tone: "brand" },
  met: { label: "已约见", tone: "blue" },
  won: { label: "成交", tone: "success" },
  lost: { label: "未成交", tone: "gray" },
};

/** 每期路演每人最多投的票数；可以撤回改投，路演结束后锁定。 */
export const DEMO_VOTES = 3;

/** 非会员每月免费意向次数；贡献任务每完成一项额外 +1。 */
export const MONTHLY_FREE_INTENTS = 5;

export const CONTRIBUTION_TASKS = [
  { action: "vote", label: "在本月路演为项目投票", desc: "不能投自己参与的项目，撤回不会扣回奖励", reward: 1 },
  { action: "update", label: "为你的项目发布一条动态", desc: "关注者和观察这个项目的投资人会收到提醒", reward: 1 },
  { action: "status_refresh", label: "刷新本月的开放状态", desc: "让别人知道你现在在找什么、能提供什么", reward: 1 },
] as const;

/** 单月完成这么多项贡献任务，获得“社区贡献者”徽章，之后一直保留。 */
export const TOP_CONTRIBUTOR_TASKS = 3;

/** 头像、Logo、封面用的色调，用渐变代替真实图片，保证离线可用。 */
export const TONES = [
  { from: "#7c5cdb", to: "#b39cf0", ink: "#ffffff" },
  { from: "#0e9384", to: "#5fe9d0", ink: "#ffffff" },
  { from: "#f79009", to: "#fec84b", ink: "#3b2300" },
  { from: "#1570ef", to: "#84caff", ink: "#ffffff" },
  { from: "#18181b", to: "#52525b", ink: "#ffffff" },
  { from: "#dd2590", to: "#faa7e0", ink: "#ffffff" },
  { from: "#079455", to: "#75e0a7", ink: "#ffffff" },
  { from: "#e04f16", to: "#fdb022", ink: "#ffffff" },
  { from: "#4e5ba6", to: "#9ea5d1", ink: "#ffffff" },
  { from: "#c4c400", to: "#ffff52", ink: "#2b2b00" },
] as const;
