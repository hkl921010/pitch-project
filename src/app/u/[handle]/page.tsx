"use client";

import {
  ArrowRight,
  Award,
  CalendarClock,
  Handshake,
  LifeBuoy,
  Lock,
  MapPin,
  MessageCircle,
  PencilLine,
  Plus,
  Radio,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { EndorsementBlock } from "@/components/biz/endorse";
import { FollowButton } from "@/components/biz/follow-button";
import { CuratedBy, ListedIn } from "@/components/biz/list-card";
import { NEED_ICON, NEED_TONE, needLabel } from "@/components/biz/looking-for";
import { activeBookingWith, canHost, HostSlots, openSlotsOf } from "@/components/biz/office-hours";
import { roleTone, SoftVerify } from "@/components/biz/person-card";
import { AddNeedModal, OpenStatusDrawer, ProfileDrawer } from "@/components/biz/profile-editors";
import { KnownSignal, ProjectRow } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, Cover, EmptyState, Tag } from "@/components/ui/display";
import { ConfirmModal } from "@/components/ui/overlay";
import { daysSince, formatDate, relativeTime } from "@/data/time";
import type { Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import {
  badgeDefs,
  endorsementsFor,
  followerCount,
  getPersonByHandle,
  investorEndorsers,
  personBadges,
  projectsOf,
  roleText,
  useDB,
  useViewer,
} from "@/store/selectors";

/** 开放状态超过这个天数视为过期：标灰，并提醒本人刷新。 */
const STALE_DAYS = 30;

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}

function Profile() {
  const { handle } = useParams<{ handle: string }>();
  const db = useDB();
  const viewer = useViewer();
  const openIntent = useApp((s) => s.openIntent);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const removeNeed = useApp((s) => s.removePersonNeed);
  const [edit, setEdit] = useQueryParam<"" | "status" | "profile">("edit", "");
  const [addNeed, setAddNeed] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  useHashScroll([handle]);
  const person = getPersonByHandle(db, decodeURIComponent(handle).replace(/^@/, ""));

  if (!person) {
    return (
      <Page narrow>
        <EmptyState icon={UserRound} title="找不到这个人" desc="可能改了主页地址，或者链接有误" action={<Button href="/discover?tab=people">去发现页找人</Button>} />
      </Page>
    );
  }

  const self = viewer?.id === person.id;
  const projects = projectsOf(db, person.id);
  const endorsers = new Set(endorsementsFor(db, "person", person.id).map((e) => e.fromId)).size;
  const investors = investorEndorsers(db, person.id);
  const badges = badgeDefs(personBadges(db, person));
  const followers = followerCount(db, "person", person.id);
  const openSlots = openSlotsOf(db, person.id).length;
  const st = person.openStatus;
  const stale = daysSince(st.updatedAt) > STALE_DAYS;
  const act = (fn: () => void) => (viewer ? fn() : requireLogin("登录后可以和 TA 联系"));

  const primary: ReactNode = self ? (
    <>
      <Button iconLeft={PencilLine} onClick={() => setEdit("profile")} className="flex-1 sm:flex-none">
        编辑资料
      </Button>
      <Button variant="primary" iconLeft={Radio} onClick={() => setEdit("status")} className="flex-1 sm:flex-none">
        {stale ? "刷新开放状态" : "编辑开放状态"}
      </Button>
    </>
  ) : person.isOps ? null : (
    <>
      <FollowButton quiet targetType="person" targetId={person.id} size="md" className="flex-1 sm:flex-none" />
      {canHost(person) && openSlots ? (
        <Button variant="primary" iconLeft={CalendarClock} href="#office-hours" className="flex-1 sm:flex-none">
          预约答疑
        </Button>
      ) : person.role === "talent" ? (
        <Button variant="primary" iconLeft={UserPlus} onClick={() => act(() => openIntent({ type: "person", personId: person.id, presetKind: "join" }))} className="flex-1 sm:flex-none">
          邀请 TA 聊聊
        </Button>
      ) : (
        <Button
          variant="primary"
          iconLeft={person.role === "partner" ? Handshake : MessageCircle}
          onClick={() => act(() => openIntent({ type: "person", personId: person.id, presetKind: person.role === "partner" ? "partner" : "other" }))}
          className="flex-1 sm:flex-none"
        >
          {person.role === "partner" ? "想合作" : "表达意向"}
        </Button>
      )}
    </>
  );

  return (
    <Page>
      {self && !person.onboarded ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-25 p-4 sm:flex-row sm:items-center">
          <Sparkles size={20} className="shrink-0 text-brand-600" />
          <p className="flex-1 text-sm text-gray-700">你的主页还是空的。花 1 分钟选身份、写一句话，大家才知道怎么和你合作。</p>
          <Button variant="primary" size="sm" href="/welcome">
            完成设置
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <Cover tone={person.avatarTone} className="h-24 sm:h-36" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <Avatar name={person.name} tone={person.avatarTone} size="3xl" verified={investors > 0} className="self-start rounded-full ring-4 ring-white" />
            <div className="min-w-0 sm:hidden">
              <ProfileName person={person} />
            </div>
            <div className="flex gap-2">
              {primary}
              <Button
                iconOnly={Share2}
                aria-label="复制主页链接"
                onClick={() => {
                  void navigator.clipboard?.writeText(`https://pitch.cn/u/${person.handle}`).catch(() => {});
                  toast({ tone: "success", title: "主页链接已复制" });
                }}
              />
            </div>
          </div>
          <div className="mt-4 hidden sm:block">
            <ProfileName person={person} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <SoftVerify personId={person.id} className="text-sm" />
            <span>
              <b className="text-gray-900">{followers}</b> 关注者
            </span>
            <span>
              <b className="text-gray-900">{endorsers}</b> 人背书
            </span>
            {projects.length ? (
              <span>
                <b className="text-gray-900">{projects.length}</b> 个项目
              </span>
            ) : null}
            <span className="text-gray-400">{formatDate(person.joinedAt)} 加入</span>
          </div>
          {person.bio ? <p className="mt-3 max-w-3xl text-[15px] leading-7 text-gray-700">{person.bio}</p> : null}
          {!self ? <KnownSignal targetType="person" targetId={person.id} className="mt-3" /> : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {st.active || self ? (
            <Section
              title="开放状态"
              action={
                self ? (
                  <Button size="sm" variant="secondary" iconLeft={PencilLine} onClick={() => setEdit("status")}>
                    编辑
                  </Button>
                ) : null
              }
            >
              <OpenStatusBody person={person} stale={stale} self={self} onOffer={(offerId) => act(() => openIntent({ type: "person", personId: person.id, presetKind: "partner", offerId }))} />
            </Section>
          ) : null}

          {person.lookingFor.length || self ? (
            <Section
              title="正在寻找"
              desc={self ? "会同步到发现页“需求”，能帮上忙的人可以直接回应" : "能帮上忙的话，直接回应 TA"}
              action={
                self && person.lookingFor.length < 3 ? (
                  <Button size="sm" variant="secondary" iconLeft={Plus} onClick={() => setAddNeed(true)}>
                    添加
                  </Button>
                ) : null
              }
            >
              {person.lookingFor.length ? (
                <ul className="flex flex-col gap-3">
                  {person.lookingFor.map((n) => {
                    const Icon = NEED_ICON[n.kind];
                    const mine = viewer && db.intents.some((i) => i.fromId === viewer.id && i.needId === n.id && i.status !== "withdrawn");
                    return (
                      <li key={n.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", NEED_TONE[n.kind])}>
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500">
                            {needLabel(n)} · {relativeTime(n.createdAt)}
                          </p>
                          <p className="font-semibold text-gray-900">{n.title}</p>
                          {n.detail ? <p className="text-sm text-gray-600">{n.detail}</p> : null}
                        </div>
                        {self ? (
                          <Button size="sm" variant="tertiary" iconOnly={Trash2} aria-label="删除" onClick={() => setRemoving(n.id)} />
                        ) : mine ? (
                          <Badge tone="brand">已回应</Badge>
                        ) : (
                          <Button size="sm" variant="secondary" iconLeft={LifeBuoy} onClick={() => act(() => openIntent({ type: "need", needId: n.id, personId: person.id }))}>
                            我能帮上忙
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState compact icon={LifeBuoy} title="写下你正在寻找的" desc="想认识什么样的人、在找什么工具——能帮上忙的人会直接回应你" action={<Button size="sm" variant="primary" onClick={() => setAddNeed(true)}>添加一条</Button>} />
              )}
            </Section>
          ) : null}

          {person.doingNow?.oneLiner || self ? (
            <Section title="我在做的事">
              {person.doingNow?.oneLiner ? (
                <div className="flex flex-col gap-3">
                  <p className="text-lg font-semibold text-gray-900">{person.doingNow.oneLiner}</p>
                  {person.doingNow.info ? <p className="text-[15px] leading-7 text-gray-700">{person.doingNow.info}</p> : null}
                  {person.doingNow.highlights ? (
                    <div className="flex flex-wrap gap-2">
                      {person.doingNow.highlights
                        .split("·")
                        .map((h) => h.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((h) => (
                          <span key={h} className="rounded-md bg-highlight-soft px-2 py-1 text-sm font-medium text-highlight-ink">
                            {h}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState compact icon={Sparkles} title="还没写" desc="一句话 + 项目信息 + 亮点，和名片上的一样" action={<Button size="sm" onClick={() => setEdit("profile")}>去填写</Button>} />
              )}
            </Section>
          ) : null}

          {projects.length || (self && person.role === "founder") ? (
            <Section title="关联项目" desc="成员确认后，项目会出现在这里">
              {projects.length ? (
                <ul className="flex flex-col divide-y divide-gray-100">
                  {projects.map(({ project, title, isOwner }) => (
                    <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                      <ProjectRow
                        project={project}
                        meta={`${title} · ${project.oneLiner}`}
                        right={isOwner ? <Badge tone="dark" size="xs">创建者</Badge> : <Badge size="xs">成员</Badge>}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={Plus} title="还没有项目" action={<Button size="sm" variant="primary" onClick={() => useApp.getState().openCreate()}>创建项目</Button>} />
              )}
            </Section>
          ) : null}

          <Section id="endorse" title="背书" desc="署名、按维度计数，只有正向信号">
            <EndorsementBlock targetType="person" targetId={person.id} targetName={person.name} canEndorse={!self && !person.isOps} />
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {canHost(person) || openSlots ? (
            <Card className="scroll-mt-24" padded>
              <div id="office-hours" className="scroll-mt-24" />
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900">答疑时段</h2>
                <Link href={self ? "/office-hours?tab=hosting" : `/office-hours?host=${person.id}`} className="text-sm font-semibold text-brand-700">
                  {self ? "管理" : "全部"}
                </Link>
              </div>
              {openSlots || activeBookingWith(db, viewer?.id ?? null, person.id) ? (
                <>
                  <p className="mb-3 text-xs text-gray-500">20–60 分钟的轻量交流，不消耗意向次数。</p>
                  <HostSlots hostId={person.id} />
                </>
              ) : self ? (
                <EmptyState compact icon={CalendarClock} title="还没开放时段" desc="开放 1–2 个时段，是认识早期项目最轻的方式" action={<Button size="sm" variant="primary" href="/office-hours?tab=hosting&create=1">开放时段</Button>} />
              ) : (
                <p className="text-sm text-gray-500">暂时没有开放的时段。关注 TA，开放时会通知你。</p>
              )}
            </Card>
          ) : null}

          <Card>
            <h2 className="mb-3 text-base font-semibold text-gray-900">徽章</h2>
            {badges.length ? (
              <ul className="flex flex-col gap-2.5">
                {badges.map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <Badge tone={b.tone}>{b.label}</Badge>
                    <span className="text-xs text-gray-500">{b.desc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Award size={16} className="text-gray-400" />
                {self ? "完成贡献任务、获得背书都会解锁徽章" : "还没有徽章"}
              </p>
            )}
            {self ? (
              <Button size="sm" variant="link" iconRight={ArrowRight} href="/rewards" className="mt-3">
                去任务中心
              </Button>
            ) : null}
          </Card>

          <ListedIn targetId={person.id} />
          <CuratedBy personId={person.id} self={self} />

          <Card>
            <h2 className="mb-2 text-base font-semibold text-gray-900">联系方式</h2>
            {self ? (
              <>
                <ul className="flex flex-col gap-1 text-sm text-gray-700">
                  <li>微信：{person.contact.wechat || <span className="text-gray-400">未填写</span>}</li>
                  <li>手机：{person.contact.phone || <span className="text-gray-400">未填写</span>}</li>
                  <li>邮箱：{person.contact.email || <span className="text-gray-400">未填写</span>}</li>
                </ul>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                  <Lock size={12} className="mt-0.5 shrink-0" />
                  只有你能看到。在对话里点“分享联系方式”时才会发给对方。
                </p>
              </>
            ) : (
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <Lock size={16} className="mt-0.5 shrink-0 text-gray-400" />
                不公开。表达意向被接受后，在站内对话里双方自愿交换。
              </p>
            )}
          </Card>
        </div>
      </div>

      {self ? (
        <>
          <OpenStatusDrawer person={person} open={edit === "status"} onClose={() => setEdit("")} />
          <ProfileDrawer person={person} open={edit === "profile"} onClose={() => setEdit("")} />
          <AddNeedModal open={addNeed} onClose={() => setAddNeed(false)} />
          <ConfirmModal
            open={!!removing}
            onClose={() => setRemoving(null)}
            danger
            title="删除这条需求？"
            desc="已经收到的回应不受影响。"
            confirmText="删除"
            onConfirm={() => {
              if (removing) removeNeed(removing);
              toast({ tone: "info", title: "已删除" });
            }}
          />
        </>
      ) : null}
    </Page>
  );
}

function ProfileName({ person }: { person: Person }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-[28px]">{person.name}</h1>
        <Badge tone={roleTone(person)}>{roleText(person)}</Badge>
      </div>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[15px] text-gray-600">
        {[person.title, person.org].filter(Boolean).join(" · ")}
        {person.city ? (
          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={14} />
            {person.city}
          </span>
        ) : null}
      </p>
    </>
  );
}

function Section({ id, title, desc, action, children }: { id?: string; title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card id={id} className={id ? "scroll-mt-24" : undefined}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {desc ? <p className="text-sm text-gray-500">{desc}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function OpenStatusBody({ person, stale, self, onOffer }: { person: Person; stale: boolean; self: boolean; onOffer: (offerId: string) => void }) {
  const st = person.openStatus;
  const inv = person.role === "investor" ? st.investor : undefined;
  const tal = person.role === "talent" ? st.talent : undefined;
  const offers = person.role === "partner" ? st.offers ?? [] : [];

  if (!st.active) {
    return <p className="text-sm text-gray-500">{self ? "已关闭。打开后主页和卡片上会显示你正在找什么。" : "暂未开放"}</p>;
  }

  const Row = ({ label, items }: { label: string; items: string[] }) =>
    items.length ? (
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
        <span className="w-20 shrink-0 text-sm text-gray-500">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("flex items-start gap-2.5 rounded-lg p-3", stale ? "bg-gray-50" : "bg-success-50")}>
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4", stale ? "bg-gray-400 ring-gray-100" : "bg-success-500 ring-success-500/20")} />
        <div className="min-w-0">
          <p className={cn("font-semibold", stale ? "text-gray-600" : "text-gray-900")}>{st.headline}</p>
          <p className="text-xs text-gray-500">
            {relativeTime(st.updatedAt)}更新
            {stale ? (self ? " · 已超过 30 天，刷新一下会重新出现在推荐里" : " · 可能已过期") : ""}
          </p>
        </div>
      </div>
      {inv ? (
        <div className="flex flex-col gap-3">
          <Row label="关注赛道" items={inv.tracks} />
          <Row label="投资阶段" items={inv.stages} />
          <Row label="单笔金额" items={inv.ticket ? [inv.ticket] : []} />
          <Row label="关注地区" items={inv.regions} />
        </div>
      ) : null}
      {tal ? (
        <div className="flex flex-col gap-3">
          <Row label="开放机会" items={tal.openTo} />
          <Row label="擅长方向" items={tal.roles} />
          <Row label="到岗时间" items={tal.availability ? [tal.availability] : []} />
        </div>
      ) : null}
      {offers.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">能提供</p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {offers.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">{o.title}</p>
                {o.desc ? <p className="text-sm text-gray-600">{o.desc}</p> : null}
                {!self ? (
                  <Button size="sm" variant="secondary" iconLeft={Handshake} className="mt-auto self-start" onClick={() => onOffer(o.id)}>
                    我想要这个
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
