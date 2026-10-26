"use client";

import { CalendarCheck, CalendarClock, CalendarPlus, Check, Clock, Link2, MapPin, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

import {
  activeBookingWith,
  canHost,
  CreateSlotModal,
  HostSlots,
  MAX_OPEN_SLOTS,
  openSlotsOf,
  PHASE_LABEL,
  RespondModal,
  SlotMeta,
  slotPhase,
} from "@/components/biz/office-hours";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState, PageHeader, Tag } from "@/components/ui/display";
import { Textarea } from "@/components/ui/form";
import { ConfirmModal } from "@/components/ui/overlay";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { relativeTime } from "@/data/time";
import type { OfficeHourSlot, Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { getPerson, projectsOf, roleText, useDB, useViewer } from "@/store/selectors";

type Tab = "browse" | "booked" | "hosting";

export default function OfficeHoursPage() {
  return (
    <Suspense>
      <OfficeHoursView />
    </Suspense>
  );
}

function OfficeHoursView() {
  const db = useDB();
  const viewer = useViewer();
  const [tab, setTab] = useQueryParam<Tab>("tab", "browse");
  const [createParam, setCreateParam] = useQueryParam<"0" | "1">("create", "0");
  const [creatingLocal, setCreating] = useState(false);
  const creating = creatingLocal || createParam === "1";
  const host = canHost(viewer);

  const booked = viewer ? db.officeHours.filter((s) => s.bookedBy === viewer.id) : [];
  const activeBooked = booked.filter((s) => slotPhase(s) === "requested" || slotPhase(s) === "confirmed").length;
  const hosting = viewer ? db.officeHours.filter((s) => s.hostId === viewer.id) : [];
  const pending = hosting.filter((s) => slotPhase(s) === "requested").length;

  return (
    <Page>
      <PageHeader
        title="答疑"
        desc="投资人和合作方开放 20–60 分钟的时段，创始人写清楚想聊什么再预约。答疑不消耗意向次数。"
        actions={
          host ? (
            <Button variant="primary" iconLeft={CalendarPlus} onClick={() => setCreating(true)}>
              开放时段
            </Button>
          ) : null
        }
      />
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "browse", label: "找人答疑" },
          { value: "booked", label: "我的预约", count: activeBooked || undefined },
          ...(host || hosting.length ? [{ value: "hosting" as const, label: "我的时段", count: pending || undefined, dot: pending > 0 }] : []),
        ]}
      />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {tab === "booked" ? <Booked list={booked} onBrowse={() => setTab("browse")} /> : tab === "hosting" ? <Hosting list={hosting} onCreate={() => setCreating(true)} /> : <Browse />}
        </div>
        <Rules host={host} />
      </div>
      {host ? (
        <CreateSlotModal
          open={creating}
          onClose={() => {
            setCreating(false);
            if (createParam === "1") setCreateParam("0");
          }}
        />
      ) : null}
    </Page>
  );
}

function Rules({ host }: { host: boolean }) {
  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <Card>
        <p className="text-sm font-semibold text-gray-900">答疑怎么约</p>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
          <li>· 投资人和合作方可以开放时段，所有登录用户都可以预约。</li>
          <li>· 预约时写清楚想聊什么（至少 10 个字），对方确认后才算约定，并会发来会议链接或见面地点。</li>
          <li>· 同一位答疑人同时只能约 1 个时段，结束或取消后可以再约。</li>
          <li>· 答疑不消耗意向次数。想继续深聊，可以在答疑后发意向。</li>
          <li>· 时段开始前没确认的预约会自动过期。</li>
        </ul>
      </Card>
      {host ? (
        <Card className="bg-gray-25">
          <p className="text-sm font-semibold text-gray-900">给答疑人的建议</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
            <li>· 每周开 1–2 个时段就够了，最多同时开放 {MAX_OPEN_SLOTS} 个。</li>
            <li>· 尽量 24 小时内确认或婉拒，回复速度会影响别人约你的意愿。</li>
            <li>· 时段会出现在你的主页和这里，有人预约时通知你。</li>
          </ul>
        </Card>
      ) : null}
    </aside>
  );
}

function Browse() {
  const db = useDB();
  const [hostParam, setHostParam] = useQueryParam<string>("host", "");
  const [role, setRole] = useState<"all" | "investor" | "partner">("all");
  const [mode, setMode] = useState<"all" | "online" | "offline">("all");
  const focus = hostParam ? db.people.find((p) => p.id === hostParam || p.handle === hostParam) : undefined;

  const hosts = db.people
    .filter((p) => canHost(p))
    .map((p) => ({ p, slots: openSlotsOf(db, p.id) }))
    .filter(({ p, slots }) => slots.length && (!focus || p.id === focus.id))
    .filter(({ p }) => role === "all" || p.role === role)
    .filter(({ slots }) => mode === "all" || slots.some((s) => s.mode === mode))
    .sort((a, b) => a.slots[0].start.localeCompare(b.slots[0].start));

  return (
    <div className="flex flex-col gap-4">
      {focus ? (
        <div className="flex flex-col gap-2 rounded-xl border border-brand-200 bg-brand-25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-800">只看{focus.name}的时段</p>
          <Button size="sm" variant="secondary" onClick={() => setHostParam("")}>
            看全部答疑人
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Segmented
            size="sm"
            value={role}
            onChange={setRole}
            items={[
              { value: "all", label: "全部" },
              { value: "investor", label: "投资人" },
              { value: "partner", label: "合作方" },
            ]}
          />
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            items={[
              { value: "all", label: "线上线下" },
              { value: "online", label: "线上" },
              { value: "offline", label: "线下" },
            ]}
          />
        </div>
      )}

      {hosts.length ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {hosts.map(({ p, slots }) => (
            <HostCard key={p.id} person={p} count={slots.length} />
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState
            icon={Search}
            title={focus ? `${focus.name}暂时没有可约的时段` : "没有符合条件的时段"}
            desc={focus ? "关注 TA，开放新时段时会通知你。" : "换个筛选条件试试，新时段开放时也会出现在这里。"}
            action={
              focus ? (
                <Button variant="primary" href={`/u/${focus.handle}`}>
                  去 TA 的主页
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setRole("all");
                    setMode("all");
                  }}
                >
                  清除筛选
                </Button>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}

function HostCard({ person, count }: { person: Person; count: number }) {
  const focus = person.openStatus.investor?.tracks ?? person.openStatus.offers?.map((o) => o.title) ?? [];
  return (
    <Card className="flex flex-col gap-4">
      <Link href={`/u/${person.handle}#office-hours`} className="group flex items-start gap-3">
        <Avatar name={person.name} tone={person.avatarTone} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-gray-900 group-hover:text-brand-700">{person.name}</span>
          <span className="block truncate text-sm text-gray-500">{[roleText(person), person.title, person.org].filter(Boolean).join(" · ")}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {person.city}
            </span>
            <span>{count} 个可约时段</span>
          </span>
        </span>
      </Link>
      {focus.length ? (
        <div className="flex flex-wrap gap-1.5">
          {focus.slice(0, 4).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      ) : null}
      <HostSlots hostId={person.id} limit={3} compact />
    </Card>
  );
}

function Booked({ list, onBrowse }: { list: OfficeHourSlot[]; onBrowse: () => void }) {
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  if (!viewer) {
    return (
      <Card padded={false}>
        <EmptyState
          icon={CalendarClock}
          title="登录后查看你的预约"
          action={
            <Button variant="primary" onClick={() => requireLogin("登录后可以预约答疑")}>
              登录
            </Button>
          }
        />
      </Card>
    );
  }
  const upcoming = list.filter((s) => slotPhase(s) === "requested" || slotPhase(s) === "confirmed").sort((a, b) => a.start.localeCompare(b.start));
  const past = list.filter((s) => slotPhase(s) === "ended" || slotPhase(s) === "expired").sort((a, b) => b.start.localeCompare(a.start));
  if (!upcoming.length && !past.length) {
    return (
      <Card padded={false}>
        <EmptyState
          icon={CalendarClock}
          title="还没有预约"
          desc="找一位投资人或合作方聊 30 分钟，是最轻的请教方式，不消耗意向次数。"
          action={
            <Button variant="primary" onClick={onBrowse}>
              找人答疑
            </Button>
          }
        />
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">即将进行</h2>
        {upcoming.length ? (
          <div className="flex flex-col gap-3">
            {upcoming.map((s) => (
              <BookedRow key={s.id} slot={s} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
            没有即将进行的答疑。
            <button onClick={onBrowse} className="ml-1 font-semibold text-brand-700">
              找人答疑
            </button>
          </p>
        )}
      </section>
      {past.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">过往</h2>
          <div className="flex flex-col gap-3">
            {past.map((s) => (
              <BookedRow key={s.id} slot={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BookedRow({ slot }: { slot: OfficeHourSlot }) {
  const db = useDB();
  const cancel = useApp((s) => s.cancelBooking);
  const openIntent = useApp((s) => s.openIntent);
  const toast = useApp((s) => s.toast);
  const [confirming, setConfirming] = useState(false);
  const host = getPerson(db, slot.hostId);
  const phase = slotPhase(slot);
  const live = phase === "requested" || phase === "confirmed";

  return (
    <Card className={cn(!live && "bg-gray-25")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {host ? <Avatar name={host.name} tone={host.avatarTone} size="md" /> : null}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {slot.topic}
              <span className="ml-2 font-normal text-gray-500">· {host?.name}</span>
            </p>
            <SlotMeta slot={slot} city={host?.city} className="mt-1" />
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">你写的：{slot.note}</p>
          </div>
        </div>
        <Badge tone={PHASE_LABEL[phase].tone} size="sm" className="self-start">
          {phase === "requested" ? `等${host?.name}确认` : PHASE_LABEL[phase].label}
        </Badge>
      </div>
      {phase === "confirmed" && slot.meeting ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-25 px-3 py-2 text-sm text-brand-800">
          {slot.mode === "online" ? <Link2 size={16} className="shrink-0" /> : <MapPin size={16} className="shrink-0" />}
          <span className="min-w-0 break-all">{slot.meeting}</span>
        </p>
      ) : null}
      {phase === "expired" ? <p className="mt-3 text-xs text-gray-500">对方在时段开始前没有确认，预约已自动过期。可以约 TA 的其他时段。</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {live ? (
          <Button size="sm" variant="secondary" iconLeft={X} onClick={() => setConfirming(true)}>
            取消预约
          </Button>
        ) : null}
        {phase === "ended" && host ? (
          <Button size="sm" variant="primary" onClick={() => openIntent({ type: "person", personId: host.id, prefill: `谢谢上次答疑（${slot.topic}），` })}>
            继续聊聊
          </Button>
        ) : null}
        {host ? (
          <Button size="sm" variant="tertiary" href={`/u/${host.handle}`}>
            看 TA 的主页
          </Button>
        ) : null}
      </div>
      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        danger
        title="取消这次预约？"
        desc={`${host?.name}会收到通知，时段会重新开放给其他人。`}
        confirmText="取消预约"
        onConfirm={() => {
          cancel(slot.id);
          setConfirming(false);
          toast({ tone: "info", title: "预约已取消" });
        }}
      />
    </Card>
  );
}

function Hosting({ list, onCreate }: { list: OfficeHourSlot[]; onCreate: () => void }) {
  const viewer = useViewer();
  const [responding, setResponding] = useState<{ slot: OfficeHourSlot; accept: boolean } | null>(null);
  if (!viewer || !canHost(viewer)) {
    return (
      <Card padded={false}>
        <EmptyState icon={CalendarClock} title="只有投资人和合作方可以开放时段" desc="你可以在“找人答疑”里预约他们。" />
      </Card>
    );
  }
  const by = (p: string) => list.filter((s) => slotPhase(s) === p).sort((a, b) => a.start.localeCompare(b.start));
  const requested = by("requested");
  const confirmed = by("confirmed");
  const open = by("open");
  const past = list.filter((s) => slotPhase(s) === "ended" || slotPhase(s) === "expired").sort((a, b) => b.start.localeCompare(a.start));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "待你确认", value: requested.length, icon: Clock, tone: requested.length ? "text-warning-600" : "text-gray-400" },
          { label: "即将进行", value: confirmed.length, icon: CalendarCheck, tone: "text-brand-600" },
          { label: "开放中", value: open.length, icon: CalendarClock, tone: "text-success-600" },
          { label: "已完成", value: past.filter((s) => slotPhase(s) === "ended").length, icon: Check, tone: "text-gray-500" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <k.icon size={14} className={k.tone} />
              {k.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">{k.value}</p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">待你确认</h2>
        {requested.length ? (
          <div className="flex flex-col gap-3">
            {requested.map((s) => (
              <RequestRow key={s.id} slot={s} onRespond={(accept) => setResponding({ slot: s, accept })} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">没有待确认的预约。</p>
        )}
      </section>

      {confirmed.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">即将进行</h2>
          <div className="flex flex-col gap-3">
            {confirmed.map((s) => (
              <HostSlotRow key={s.id} slot={s} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">开放中</h2>
          <Button size="sm" variant="link" iconLeft={CalendarPlus} onClick={onCreate}>
            开放新时段
          </Button>
        </div>
        {open.length ? (
          <div className="flex flex-col gap-3">
            {open.map((s) => (
              <HostSlotRow key={s.id} slot={s} />
            ))}
          </div>
        ) : (
          <Card padded={false}>
            <EmptyState
              compact
              icon={CalendarPlus}
              title="没有开放中的时段"
              desc="开放 1–2 个时段，是认识早期项目最轻的方式。"
              action={
                <Button size="sm" variant="primary" onClick={onCreate}>
                  开放时段
                </Button>
              }
            />
          </Card>
        )}
      </section>

      {past.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">过往</h2>
          <div className="flex flex-col gap-3">
            {past.map((s) => (
              <HostSlotRow key={s.id} slot={s} />
            ))}
          </div>
        </section>
      ) : null}

      <RespondModal slot={responding?.slot ?? null} accept={responding?.accept ?? true} onClose={() => setResponding(null)} />
    </div>
  );
}

function RequestRow({ slot, onRespond }: { slot: OfficeHourSlot; onRespond: (accept: boolean) => void }) {
  const db = useDB();
  const booker = getPerson(db, slot.bookedBy);
  const project = booker ? projectsOf(db, booker.id)[0]?.project : undefined;
  return (
    <Card className="border-warning-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Link href={booker ? `/u/${booker.handle}` : "#"} className="group flex min-w-0 items-start gap-3">
          {booker ? <Avatar name={booker.name} tone={booker.avatarTone} size="md" /> : null}
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-gray-900 group-hover:text-brand-700">{booker?.name}</span>
            <span className="block truncate text-xs text-gray-500">{[roleText(booker), project?.name].filter(Boolean).join(" · ")}</span>
          </span>
        </Link>
        <span className="shrink-0 text-xs text-gray-400">{slot.requestedAt ? `${relativeTime(slot.requestedAt)}申请` : null}</span>
      </div>
      <div className="mt-3 rounded-lg bg-gray-50 p-3">
        <p className="text-sm font-semibold text-gray-900">{slot.topic}</p>
        <SlotMeta slot={slot} city={getPerson(db, slot.hostId)?.city} className="mt-1" />
        <p className="mt-2 text-sm text-gray-700">{slot.note}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" iconLeft={Check} onClick={() => onRespond(true)}>
          确认
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onRespond(false)}>
          婉拒
        </Button>
        {project ? (
          <Button size="sm" variant="tertiary" href={`/p/${project.slug}`}>
            看项目
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function HostSlotRow({ slot }: { slot: OfficeHourSlot }) {
  const db = useDB();
  const cancel = useApp((s) => s.cancelSlot);
  const toast = useApp((s) => s.toast);
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");
  const booker = getPerson(db, slot.bookedBy);
  const phase = slotPhase(slot);
  const removable = phase === "open" || phase === "confirmed";

  return (
    <Card className={cn("p-4", (phase === "ended" || phase === "expired") && "bg-gray-25")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{slot.topic}</p>
          <SlotMeta slot={slot} city={getPerson(db, slot.hostId)?.city} className="mt-1" />
          {booker ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <Avatar name={booker.name} tone={booker.avatarTone} size="xs" />
              <Link href={`/u/${booker.handle}`} className="shrink-0 font-medium text-gray-800 hover:text-brand-700">
                {booker.name}
              </Link>
              <span className="min-w-0 truncate text-gray-500">{slot.meeting}</span>
            </p>
          ) : null}
        </div>
        <Badge tone={PHASE_LABEL[phase].tone} size="sm">
          {phase === "expired" && slot.status === "open" ? "无人预约" : PHASE_LABEL[phase].label}
        </Badge>
        {removable ? (
          <Button size="xs" variant="tertiary" iconOnly={Trash2} aria-label={phase === "open" ? "删除时段" : "取消答疑"} className="text-gray-400 hover:text-error-600" onClick={() => setRemoving(true)} />
        ) : null}
      </div>
      <ConfirmModal
        open={removing}
        onClose={() => setRemoving(false)}
        danger
        title={phase === "confirmed" ? `取消和${booker?.name}的答疑？` : "删除这个时段？"}
        desc={phase === "confirmed" ? "对方会收到通知。临时取消会影响别人约你的意愿，尽量提前说。" : "还没有人预约，删除后不会通知任何人。"}
        confirmText={phase === "confirmed" ? "取消答疑" : "删除"}
        onConfirm={() => {
          cancel(slot.id, reason.trim() || undefined);
          setRemoving(false);
          toast({ tone: "info", title: phase === "confirmed" ? "已取消，已通知对方" : "时段已删除" });
        }}
      >
        {phase === "confirmed" ? <Textarea label="说一句原因（选填）" rows={2} maxCount={60} value={reason} onChange={(e) => setReason(e.target.value)} /> : null}
      </ConfirmModal>
    </Card>
  );
}
