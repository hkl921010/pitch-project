"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChipSelect, Field, Input, Select, Textarea, Toggle } from "@/components/ui/form";
import { Drawer, Modal } from "@/components/ui/overlay";
import { REGIONS, STAGES, TRACKS } from "@/data/constants";
import type { OpenStatus, PartnerOffer, Person } from "@/data/types";
import { useApp } from "@/store/app-store";
import { manageableProjects, useDB } from "@/store/selectors";

const OPEN_TO = ["合伙人", "全职", "兼职顾问"] as const;
const TALENT_ROLES = ["增长", "海外市场", "本地化运营", "产品", "全栈", "AI 工程", "供应链", "设计", "财务"] as const;
const AVAILABILITY = ["随时", "两周内可到岗", "一个月内可到岗", "暂不考虑全职"] as const;
export const PERSON_NEED_SUBS = ["找人脉", "求工具", "求经验", "其他"] as const;

/** 开放状态编辑：按身份展示不同字段；保存即刷新“更新于”，并计入当月贡献任务。 */
export function OpenStatusDrawer({ person, open, onClose }: { person: Person; open: boolean; onClose: () => void }) {
  const db = useDB();
  const save = useApp((s) => s.updateOpenStatus);
  const toast = useApp((s) => s.toast);
  const [draft, setDraft] = useState<OpenStatus>(person.openStatus);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(structuredClone(person.openStatus));
      setTried(false);
    }
  }, [open, person.openStatus]);

  const inv = draft.investor ?? { tracks: [], stages: [], ticket: "", regions: [] };
  const tal = draft.talent ?? { openTo: [], roles: [], availability: "" };
  const offers = draft.offers ?? [];
  const headlineErr = tried && draft.active && !draft.headline.trim() ? "开放中时写一句话，比如“本月在看：消费出海，天使到 A 轮”" : undefined;
  const offerErr = tried && offers.some((o) => !o.title.trim());
  const myProject = manageableProjects(db, person.id)[0];

  const submit = () => {
    setTried(true);
    if ((draft.active && !draft.headline.trim()) || offerErr) return;
    const patch: Partial<OpenStatus> = { active: draft.active, headline: draft.headline.trim() };
    if (person.role === "investor") patch.investor = inv;
    if (person.role === "talent") patch.talent = tal;
    if (person.role === "partner") patch.offers = offers.map((o) => ({ ...o, title: o.title.trim(), desc: o.desc.trim() }));
    save(patch);
    toast({ tone: "success", title: "开放状态已更新", body: "已计入本月贡献任务「刷新开放状态」" });
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="开放状态"
      desc="让对的人知道你现在在找什么。建议每月刷新一次，过期的状态会被标灰。"
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit}>
            保存
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} label="开放中" hint="关闭后主页和卡片上不再显示开放状态" />
        <Input
          label="一句话状态"
          required={draft.active}
          maxCount={40}
          value={draft.headline}
          onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
          placeholder={
            person.role === "investor" ? "本月在看：消费出海，天使到 A 轮" : person.role === "talent" ? "开放合伙机会，偏好消费出海" : person.role === "partner" ? "本月可再接 3 个中国品牌" : "正在融天使轮，同时找东南亚渠道"
          }
          error={headlineErr}
        />

        {person.role === "investor" ? (
          <>
            <Field label="关注赛道">
              <ChipSelect multiple size="sm" options={TRACKS} value={inv.tracks} onChange={(v) => setDraft({ ...draft, investor: { ...inv, tracks: v } })} />
            </Field>
            <Field label="投资阶段">
              <ChipSelect multiple size="sm" options={STAGES} value={inv.stages} onChange={(v) => setDraft({ ...draft, investor: { ...inv, stages: v } })} />
            </Field>
            <Input label="单笔金额" value={inv.ticket} onChange={(e) => setDraft({ ...draft, investor: { ...inv, ticket: e.target.value } })} placeholder="比如：300–1000 万人民币" />
            <Field label="关注地区">
              <ChipSelect multiple size="sm" options={REGIONS} value={inv.regions} onChange={(v) => setDraft({ ...draft, investor: { ...inv, regions: v } })} />
            </Field>
            <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">匹配的项目会优先出现在你的首页和周报里。</p>
          </>
        ) : null}

        {person.role === "talent" ? (
          <>
            <Field label="开放机会">
              <ChipSelect multiple size="sm" options={OPEN_TO} value={tal.openTo} onChange={(v) => setDraft({ ...draft, talent: { ...tal, openTo: v } })} />
            </Field>
            <Field label="擅长方向">
              <ChipSelect multiple size="sm" options={TALENT_ROLES} value={tal.roles} onChange={(v) => setDraft({ ...draft, talent: { ...tal, roles: v } })} />
            </Field>
            <Select
              label="到岗时间"
              value={tal.availability}
              onChange={(e) => setDraft({ ...draft, talent: { ...tal, availability: e.target.value } })}
              placeholder="选择"
              options={AVAILABILITY.map((a) => ({ value: a, label: a }))}
            />
          </>
        ) : null}

        {person.role === "partner" ? (
          <Field label="我能提供" hint="项目方可以直接点“我想要这个”向你表达合作意向">
            <div className="flex flex-col gap-3">
              {offers.map((o, i) => (
                <div key={o.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start gap-2">
                    <Input
                      wrapperClassName="flex-1"
                      inputSize="sm"
                      maxCount={20}
                      value={o.title}
                      placeholder="比如：东南亚 KA 渠道铺货"
                      onChange={(e) => setDraft({ ...draft, offers: offers.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                      error={tried && !o.title.trim() ? "写一个标题" : undefined}
                    />
                    <Button size="sm" variant="tertiary" iconOnly={Trash2} aria-label="删除" onClick={() => setDraft({ ...draft, offers: offers.filter((_, j) => j !== i) })} />
                  </div>
                  <Input
                    inputSize="sm"
                    maxCount={40}
                    value={o.desc}
                    placeholder="范围、门店数、类目等"
                    onChange={(e) => setDraft({ ...draft, offers: offers.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)) })}
                  />
                </div>
              ))}
              {offers.length < 4 ? (
                <Button
                  size="sm"
                  iconLeft={Plus}
                  className="self-start"
                  onClick={() => setDraft({ ...draft, offers: [...offers, { id: `o-${Math.random().toString(36).slice(2, 8)}`, title: "", desc: "" } as PartnerOffer] })}
                >
                  添加一项
                </Button>
              ) : null}
            </div>
          </Field>
        ) : null}

        {person.role === "founder" ? (
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            融资、渠道、招人这类项目需求，写在项目的“正在寻找”里，会带上意向按钮。
            {myProject ? (
              <Link href={`/p/${myProject.slug}/edit#looking`} className="ml-1 font-semibold text-brand-700" onClick={onClose}>
                去编辑
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </Drawer>
  );
}

/** 基本资料 + “我在做的事”（保留名片上的 projectInfo / 一句话 / 亮点）。 */
export function ProfileDrawer({ person, open, onClose }: { person: Person; open: boolean; onClose: () => void }) {
  const save = useApp((s) => s.updatePerson);
  const toast = useApp((s) => s.toast);
  const [d, setD] = useState(() => pickProfile(person));
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setD(pickProfile(person));
      setTried(false);
    }
  }, [open, person]);

  const submit = () => {
    setTried(true);
    if (!d.name.trim()) return;
    save({
      name: d.name.trim(),
      title: d.title.trim(),
      org: d.org.trim(),
      city: d.city.trim(),
      bio: d.bio.trim(),
      doingNow: d.oneLiner.trim() || d.info.trim() || d.highlights.trim() ? { oneLiner: d.oneLiner.trim(), info: d.info.trim(), highlights: d.highlights.trim() } : undefined,
    });
    toast({ tone: "success", title: "资料已保存" });
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="编辑资料"
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit}>
            保存
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Input label="姓名" required maxCount={12} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={tried && !d.name.trim() ? "姓名不能为空" : undefined} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="职位" maxCount={20} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
          <Input label="公司 / 机构" maxCount={20} value={d.org} onChange={(e) => setD({ ...d, org: e.target.value })} />
        </div>
        <Input label="城市" maxCount={12} value={d.city} onChange={(e) => setD({ ...d, city: e.target.value })} />
        <Textarea label="个人简介" rows={3} maxCount={120} value={d.bio} onChange={(e) => setD({ ...d, bio: e.target.value })} placeholder="做过什么、现在在做什么、能帮别人什么" />
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">我在做的事</p>
            <p className="text-xs text-gray-500">沿用名片上的“项目信息 / 一句话 / 亮点”，显示在主页显眼位置</p>
          </div>
          <Input label="一句话" maxCount={30} value={d.oneLiner} onChange={(e) => setD({ ...d, oneLiner: e.target.value })} placeholder="比如：把东方新茶饮带到东南亚" />
          <Textarea label="项目信息" rows={3} maxCount={150} value={d.info} onChange={(e) => setD({ ...d, info: e.target.value })} />
          <Input label="亮点" hint="用 · 分隔，最多 3 条" maxCount={50} value={d.highlights} onChange={(e) => setD({ ...d, highlights: e.target.value })} placeholder="6 年海外门店经验 · 首店 3 个月回本" />
        </div>
      </div>
    </Drawer>
  );
}

function pickProfile(p: Person) {
  return { name: p.name, title: p.title, org: p.org, city: p.city, bio: p.bio, oneLiner: p.doingNow?.oneLiner ?? "", info: p.doingNow?.info ?? "", highlights: p.doingNow?.highlights ?? "" };
}

/** 个人“正在寻找”（原心愿墙的找人脉、求工具）。 */
export function AddNeedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useApp((s) => s.addPersonNeed);
  const toast = useApp((s) => s.toast);
  const [sub, setSub] = useState<string[]>(["找人脉"]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [tried, setTried] = useState(false);
  const close = () => {
    setSub(["找人脉"]);
    setTitle("");
    setDetail("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="写下你正在寻找的"
      desc="会出现在你的主页和发现页“需求”里，能帮上忙的人可以直接回应你。"
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (title.trim().length < 4) return;
              add({ kind: "help", sub: sub[0], title: title.trim(), detail: detail.trim() || undefined });
              toast({ tone: "success", title: "已发布", body: "可以在发现页“需求”里看到" });
              close();
            }}
          >
            发布
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="类型">
          <ChipSelect size="sm" options={PERSON_NEED_SUBS} value={sub} onChange={(v) => setSub(v.length ? v : sub)} />
        </Field>
        <Input label="一句话" required maxCount={30} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="比如：想认识懂马来西亚商场招商的朋友" error={tried && title.trim().length < 4 ? "至少 4 个字" : undefined} />
        <Input label="补充" maxCount={60} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="选填：背景、时间要求" />
      </div>
    </Modal>
  );
}
