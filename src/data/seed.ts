import type { DB } from "./types";
import { casePeople } from "./seed-cases";
import { seedPeople } from "./seed-people";
import { seedProjects } from "./seed-projects";
import {
  FOLLOWER_BASE,
  seedContributions,
  seedConversations,
  seedFollows,
  seedIntents,
  seedNotifications,
  seedNotifyPrefs,
  seedOfficeHours,
  seedWatch,
} from "./seed-activity";

export function createSeed(): DB {
  const clone = <T,>(v: T): T => structuredClone(v);
  return {
    people: clone([...casePeople, ...seedPeople]).map((p) => ({ ...p, followerBase: FOLLOWER_BASE[p.id] ?? 0 })),
    projects: clone(seedProjects).map((p) => ({ ...p, followerBase: FOLLOWER_BASE[p.id] ?? 0 })),
    intents: clone(seedIntents),
    conversations: clone(seedConversations),
    follows: clone(seedFollows),
    watch: clone(seedWatch),
    notifications: clone(seedNotifications).map((n) => {
      const prefs = seedNotifyPrefs.find((p) => p.userId === n.userId);
      return { ...n, pushed: !!prefs && prefs.wechatBound && prefs.wechatOn && prefs.instant.includes(n.type) };
    }),
    notifyPrefs: clone(seedNotifyPrefs),
    contributions: clone(seedContributions),
    officeHours: clone(seedOfficeHours),
    productFeedback: [],
  };
}

/** 演示身份：右上角切换器里的选项。 */
export const DEMO_PERSONAS = [
  { key: "u-linchuan", label: "林川", desc: "创始人 · 拾光茶事" },
  { key: "u-zhoumin", label: "周敏", desc: "投资人 · 持光资本" },
  { key: "u-chenyi", label: "陈一", desc: "人才 · 前 SHEIN 增长" },
  { key: "u-wanglan", label: "王岚", desc: "合作方 · 东南亚渠道" },
  { key: "u-ake", label: "阿珂", desc: "Pitch 运营" },
  { key: "u-newbie", label: "张三", desc: "新注册用户（看引导）" },
  { key: "guest", label: "游客", desc: "未登录" },
] as const;
