"use client";

import { CalendarClock, MapPin, Video } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/display";
import { Input, RadioCards, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { Segmented } from "@/components/ui/tabs";
import { formatDateTime, nowMs } from "@/data/time";
import type { DB, OfficeHourSlot, Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { getPerson, roleText, useDB, useViewer } from "@/store/selectors";

/** 每位答疑人同时开放的未来时段上限，避免挂一堆空时段。 */
export const MAX_OPEN_SLOTS = 6;
export const SLOT_MINUTES = [20, 30, 45, 60] as const;
const NOTE_MIN = 10;
const NOTE_MAX = 120;
const TOPIC_MAX = 20;

export type SlotPhase = "open" | "requested" | "confirmed" | "ended" | "expired";

export const PHASE_LABEL: Record<SlotPhase, { label: string; tone: "success" | "warning" | "brand" | "gray" }> = {
  open: { label: "可预约", tone: "success" },
  requested: { label: "待确认", tone: "warning" },
  confirmed: { label: "已确认", tone: "brand" },
  ended: { label: "已结束", tone: "gray" },
  expired: { label: "已过期", tone: "gray" },
};

/** 投资人和合作方是被找的一方，可以开放答疑时段；所有登录用户都可以预约。 */
export function canHost(p: Person | null | undefined): boolean {
  return !!p && (p.role === "investor" || p.role === "partner");
}

export function slotPhase(slot: OfficeHourSlot): SlotPhase {
  const start = new Date(slot.start).getTime();
  const now = nowMs();
  if (slot.status === "confirmed") return start + slot.mins * 60_000 < now ? "ended" : "confirmed";
  if (start <= now) return "expired";
  return slot.status === "requested" ? "requested" : "open";
}

/** 预约人和同一位答疑人之间未结束的预约：同时只能有 1 个。 */
export function activeBookingWith(db: DB, viewerId: string | null, hostId: string) {
  if (!viewerId) return undefined;
  return db.officeHours.find((s) => s.hostId === hostId && s.bookedBy === viewerId && (slotPhase(s) === "requested" || slotPhase(s) === "confirmed"));
}

export function openSlotsOf(db: DB, hostId: string) {
  return db.officeHours.filter((s) => s.hostId === hostId && slotPhase(s) === "open").sort((a, b) => a.start.localeCompare(b.start));
}

export function SlotMeta({ slot, city, className }: { slot: OfficeHourSlot; city?: string; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500", className)}>
      <span className="inline-flex items-center gap-1">
        <CalendarClock size={13} />
        {formatDateTime(slot.start)} · {slot.mins} 分钟
      </span>
      <span className="inline-flex items-center gap-1">
        {slot.mode === "online" ? <Video size={13} /> : <MapPin size={13} />}
        {slot.mode === "online" ? "线上" : `线下${city ? ` · ${city}` : ""}`}
      </span>
    </span>
  );
}

/** 某人开放的时段（个人主页、答疑页共用）：自己的时段不能约；已经约过这位的，其他时段不能再约。 */
export function HostSlots({ hostId, limit = 3, compact }: { hostId: string; limit?: number; compact?: boolean }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const requireLogin = useApp((s) => s.requireLogin);
  const [booking, setBooking] = useState<OfficeHourSlot | null>(null);
  const host = getPerson(db, hostId);
  const active = activeBookingWith(db, viewerId, hostId);
  const slots = db.officeHours
    .filter((s) => s.hostId === hostId && (slotPhase(s) === "open" || (s.bookedBy === viewerId && s.id === active?.id)))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, limit);
  if (!slots.length) return null;
  return (
    <>
      <ul className="flex flex-col gap-2">
        {slots.map((s) => {
          const mine = s.bookedBy === viewerId && !!viewerId;
          return (
            <li key={s.id} className={cn("flex items-center gap-3 rounded-lg border", mine ? "border-brand-200 bg-brand-25" : "border-gray-200", compact ? "p-2.5" : "p-3")}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{s.topic}</p>
                <SlotMeta slot={s} city={host?.city} className="mt-0.5" />
              </div>
              {mine ? (
                <Badge tone={PHASE_LABEL[slotPhase(s)].tone} size="xs">
                  {s.status === "requested" ? "已申请" : "已确认"}
                </Badge>
              ) : hostId === viewerId ? (
                <Badge tone="success" size="xs">
                  可预约
                </Badge>
              ) : active ? (
                <Badge tone="gray" size="xs">
                  已约过 TA
                </Badge>
              ) : (
                <Button size="xs" variant="secondary" onClick={() => (viewerId ? setBooking(s) : requireLogin("登录后可以预约答疑"))}>
                  预约
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <BookSlotModal slot={booking} onClose={() => setBooking(null)} />
    </>
  );
}

export function BookSlotModal({ slot, onClose }: { slot: OfficeHourSlot | null; onClose: () => void }) {
  const db = useDB();
  const book = useApp((s) => s.bookSlot);
  const toast = useApp((s) => s.toast);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const host = getPerson(db, slot?.hostId);
  const err = note.trim().length < NOTE_MIN ? `至少 ${NOTE_MIN} 个字` : note.length > NOTE_MAX ? `最多 ${NOTE_MAX} 字` : undefined;
  const close = () => {
    setNote("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={!!slot}
      onClose={close}
      size="sm"
      title={`预约${host?.name ?? ""}的答疑`}
      desc="对方确认后会通知你，并发来会议链接或见面地点。答疑不消耗意向次数。"
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (!slot || err) return;
              book(slot.id, note.trim());
              toast({ tone: "success", title: "预约已提交", body: `${host?.name} 确认后会通知你` });
              close();
            }}
          >
            提交预约
          </Button>
        </>
      }
    >
      {slot ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-25 p-3">
            {host ? (
              <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <Avatar name={host.name} tone={host.avatarTone} size="xs" />
                {host.name} · {roleText(host)}
                {host.org ? ` · ${host.org}` : ""}
              </p>
            ) : null}
            <p className="text-sm font-semibold text-gray-900">{slot.topic}</p>
            <SlotMeta slot={slot} city={host?.city} className="mt-1" />
          </div>
          <Textarea
            label="想聊什么"
            required
            rows={3}
            maxCount={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="说清楚你的项目阶段和最想问的 1–2 个问题，对方更容易确认"
            error={tried ? err : undefined}
          />
          <p className="text-xs text-gray-500">同一位答疑人同时只能约 1 个时段，结束或取消后可以再约。</p>
        </div>
      ) : null}
    </Modal>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 未来 14 天的日期（北京时间），从明天开始。 */
function dateOptions() {
  const out: { value: string; label: string }[] = [];
  const base = new Date(nowMs() + 8 * 3_600_000);
  for (let i = 1; i <= 14; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i));
    const value = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const week = "日一二三四五六"[d.getUTCDay()];
    out.push({ value, label: `${d.getUTCMonth() + 1}/${d.getUTCDate()} 周${week}` });
  }
  return out;
}

const TIME_OPTIONS = Array.from({ length: 26 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 ? "30" : "00";
  return { value: `${pad(h)}:${m}`, label: `${pad(h)}:${m}` };
});

export function CreateSlotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDB();
  const viewer = useViewer();
  const create = useApp((s) => s.createSlot);
  const toast = useApp((s) => s.toast);
  const dates = dateOptions();
  const [date, setDate] = useState(dates[1].value);
  const [time, setTime] = useState("15:00");
  const [mins, setMins] = useState<string>("30");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [tried, setTried] = useState(false);
  if (!viewer) return null;

  const start = `${date}T${time}:00+08:00`;
  const startMs = new Date(start).getTime();
  const endMs = startMs + Number(mins) * 60_000;
  const mine = db.officeHours.filter((s) => s.hostId === viewer.id && slotPhase(s) !== "ended" && slotPhase(s) !== "expired");
  const overlap = mine.find((s) => {
    const a = new Date(s.start).getTime();
    return startMs < a + s.mins * 60_000 && a < endMs;
  });
  const openCount = mine.filter((s) => slotPhase(s) === "open").length;
  const full = openCount >= MAX_OPEN_SLOTS;
  const topicErr = !topic.trim() ? "写一个答疑主题，比如“消费品牌的融资准备”" : topic.length > TOPIC_MAX ? `最多 ${TOPIC_MAX} 字` : undefined;
  const timeErr = overlap ? `和你 ${formatDateTime(overlap.start)} 的时段重叠了` : undefined;

  const close = () => {
    setTopic("");
    setTried(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="开放一个答疑时段"
      desc="创始人会写清楚想聊什么再来预约，你确认后才算约定。"
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant="primary"
            disabled={full}
            onClick={() => {
              setTried(true);
              if (topicErr || timeErr || full) return;
              create({ start, mins: Number(mins), topic: topic.trim(), mode });
              toast({ tone: "success", title: "时段已开放", body: "会出现在答疑页和你的主页上" });
              close();
            }}
          >
            开放时段
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {full ? <p className="rounded-lg bg-warning-25 px-3 py-2 text-sm text-warning-700">你已经有 {MAX_OPEN_SLOTS} 个开放中的时段，等有人约了或过期后再开新的。</p> : null}
        <Input label="答疑主题" required value={topic} onChange={(e) => setTopic(e.target.value)} maxCount={TOPIC_MAX} placeholder="例如：消费品牌出海的融资准备" error={tried ? topicErr : undefined} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="日期" options={dates} value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="开始时间" options={TIME_OPTIONS} value={time} onChange={(e) => setTime(e.target.value)} error={timeErr} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">时长</span>
          <Segmented value={mins} onChange={setMins} items={SLOT_MINUTES.map((m) => ({ value: String(m), label: `${m} 分钟` }))} />
        </div>
        <RadioCards
          value={mode}
          onChange={setMode}
          options={[
            { value: "online", title: "线上", desc: "确认时发会议链接", icon: Video },
            { value: "offline", title: "线下", desc: `在${viewer.city || "你所在的城市"}，确认时发见面地点`, icon: MapPin },
          ]}
        />
      </div>
    </Modal>
  );
}

/** 确认预约时填写会议链接或见面地点；婉拒时可以写一句原因。 */
export function RespondModal({ slot, accept, onClose }: { slot: OfficeHourSlot | null; accept: boolean; onClose: () => void }) {
  const db = useDB();
  const respond = useApp((s) => s.respondBooking);
  const toast = useApp((s) => s.toast);
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const booker = getPerson(db, slot?.bookedBy);
  const err = accept && !text.trim() ? (slot?.mode === "online" ? "填一下会议链接或会议号" : "填一下见面地点") : undefined;
  const close = () => {
    setText("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={!!slot}
      onClose={close}
      size="sm"
      title={accept ? `确认${booker?.name ?? ""}的预约` : `婉拒${booker?.name ?? ""}的预约`}
      desc={accept ? "确认后对方会收到通知和下面的信息。" : "时段会重新开放，对方会收到通知。"}
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant={accept ? "primary" : "destructive"}
            onClick={() => {
              setTried(true);
              if (!slot || err) return;
              respond(slot.id, accept, accept ? { meeting: text.trim() } : { reason: text.trim() || undefined });
              toast({ tone: accept ? "success" : "info", title: accept ? "已确认预约" : "已婉拒", body: accept ? `已通知${booker?.name}` : "时段已重新开放" });
              close();
            }}
          >
            {accept ? "确认" : "婉拒"}
          </Button>
        </>
      }
    >
      {slot ? (
        accept ? (
          <Input
            label={slot.mode === "online" ? "会议链接或会议号" : "见面地点"}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={slot.mode === "online" ? "例如：腾讯会议 618 203 117" : "例如：静安嘉里中心 2 座 1 楼咖啡厅"}
            error={tried ? err : undefined}
            autoFocus
          />
        ) : (
          <Textarea label="说一句原因（选填）" rows={2} maxCount={60} value={text} onChange={(e) => setText(e.target.value)} placeholder="例如：这个方向我不太熟，建议约李牧聊聊" />
        )
      ) : null}
    </Modal>
  );
}
