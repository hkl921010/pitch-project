"use client";

import { ArrowRight, Inbox, Plus, Rocket, Search, Send, Trash2 } from "lucide-react";
import { useState } from "react";

import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { AreaChart, BarList } from "@/components/ui/charts";
import { Avatar, AvatarGroup, Badge, Card, Cover, EmptyState, FeaturedIcon, PageHeader, ProgressBar, ProgressRing, ProjectLogo, SectionHeader, Skeleton, Stat, Tag, Tooltip } from "@/components/ui/display";
import { Checkbox, ChipSelect, Input, RadioCards, Select, Textarea, Toggle } from "@/components/ui/form";
import { ConfirmModal, Drawer, Modal } from "@/components/ui/overlay";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";

/** 组件库：原型内部使用，用于检查每个基础组件的全部状态。 */
export default function UIKit() {
  const toast = useApp((s) => s.toast);
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [seg, setSeg] = useState<"x" | "y">("x");
  const [chips, setChips] = useState<string[]>(["消费"]);
  const [radio, setRadio] = useState<"invest" | "partner" | null>("invest");
  const [ck, setCk] = useState(true);
  const [tg, setTg] = useState(false);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [text, setText] = useState("拾光茶事");

  return (
    <Page>
      <PageHeader title="组件库" desc="Untitled UI 风格 + Pitch 品牌色。每个组件都列出默认、悬停、禁用、加载、空、错误状态。" />
      <div className="mt-8 flex flex-col gap-10">
        <section>
          <SectionHeader title="按钮" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" iconLeft={Plus}>主要</Button>
            <Button variant="secondary">次要</Button>
            <Button variant="tertiary">文字</Button>
            <Button variant="brand" iconRight={ArrowRight}>品牌紫</Button>
            <Button variant="highlight" iconLeft={Rocket}>亮黄强调</Button>
            <Button variant="destructive" iconLeft={Trash2}>删除</Button>
            <Button variant="link">链接按钮</Button>
            <Button variant="primary" loading>提交中</Button>
            <Button variant="primary" disabled>禁用</Button>
            <Button variant="secondary" disabled>禁用</Button>
            <Button variant="secondary" iconOnly={Send} aria-label="发送" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="xs">xs</Button>
            <Button variant="primary" size="sm">sm</Button>
            <Button variant="primary" size="md">md</Button>
            <Button variant="primary" size="lg">lg</Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SectionHeader title="输入" />
            <Input label="项目名称" required value={text} onChange={(e) => setText(e.target.value)} maxCount={20} hint="之后可以修改" />
            <Input label="搜索" icon={Search} placeholder="搜项目、人、需求" />
            <Input label="出错状态" value="abc" onChange={() => {}} error="一句话介绍至少 6 个字" />
            <Input label="禁用状态" value="不可编辑" disabled onChange={() => {}} />
            <Select label="赛道" placeholder="选择赛道" defaultValue="" options={[{ value: "消费", label: "消费" }, { value: "AI", label: "AI 应用" }]} />
            <Textarea label="一句话" placeholder="让对方愿意回复的一句话" maxCount={140} />
          </div>
          <div className="flex flex-col gap-4">
            <SectionHeader title="选择" />
            <ChipSelect options={["消费", "AI 应用", "出海", "硬科技"]} value={chips} onChange={setChips} multiple />
            <RadioCards
              value={radio}
              onChange={setRadio}
              options={[
                { value: "invest", title: "我想投资", desc: "对方会看到你的投资偏好", icon: Rocket },
                { value: "partner", title: "我想合作", desc: "渠道、流量、品牌、服务", icon: Send },
              ]}
            />
            <Checkbox checked={ck} onChange={setCk} label="匿名发送" hint="对方点“我也想聊”后双方身份揭晓" />
            <Toggle checked={tg} onChange={setTg} label="公开到发现" hint="关闭后仅持链接可见" />
          </div>
        </section>

        <section>
          <SectionHeader title="徽标、头像、标签" />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["gray", "brand", "success", "warning", "error", "blue", "highlight", "dark"] as const).map((t) => (
              <Badge key={t} tone={t} dot>
                {t}
              </Badge>
            ))}
            <Tag>消费</Tag>
            <Tag active>出海</Tag>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Avatar name="林川" tone={0} size="xs" />
            <Avatar name="林川" tone={1} size="sm" />
            <Avatar name="周敏" tone={2} size="md" verified />
            <Avatar name="陈一" tone={3} size="lg" online />
            <Avatar name="匿名" anonymous size="xl" />
            <Avatar name="王岚" tone={5} size="3xl" verified />
            <AvatarGroup people={[{ name: "林", tone: 0 }, { name: "周", tone: 1 }, { name: "陈", tone: 2 }, { name: "王", tone: 3 }, { name: "李", tone: 4 }]} more={12} />
            <ProjectLogo text="拾" tone={0} size="lg" />
            <ProjectLogo text="L" tone={4} size="xl" />
            <Tooltip content="通常半天内回复（近 30 天中位数）">
              <Badge tone="success">悬停看提示</Badge>
            </Tooltip>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card>
            <Stat label="近 14 天浏览" value="1,284" delta={23} hint="比前 14 天" />
          </Card>
          <Card>
            <p className="text-sm font-medium text-gray-500">资料完成度</p>
            <div className="mt-3 flex items-center gap-4">
              <ProgressRing value={75} />
              <ProgressBar value={75} className="flex-1" label />
            </div>
          </Card>
          <Cover tone={2} label="图集 1/4" className="h-[124px] rounded-xl" />
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Card>
            <SectionHeader title="趋势图" />
            <div className="mt-4">
              <AreaChart data={[12, 18, 9, 22, 30, 26, 41, 38, 35, 52, 48, 60, 57, 72]} labels={Array.from({ length: 14 }, (_, i) => `10/${8 + i}`)} />
            </div>
          </Card>
          <Card>
            <SectionHeader title="流量来源" />
            <div className="mt-4">
              <BarList items={[{ label: "微信转发", value: 420 }, { label: "发现页", value: 260 }, { label: "直接访问", value: 120 }, { label: "海报扫码", value: 80 }]} />
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader title="标签页" />
          <Tabs className="mt-4" value={tab} onChange={setTab} items={[{ value: "a", label: "收到的意向", count: 4 }, { value: "b", label: "我发出的", count: 2 }, { value: "c", label: "成员邀请", dot: true }]} />
          <Segmented className="mt-4" value={seg} onChange={setSeg} items={[{ value: "x", label: "项目" }, { value: "y", label: "人", count: 25 }]} />
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card padded={false}>
            <EmptyState icon={Inbox} title="还没有收到意向" desc="完善“正在寻找”，让对的人找到你" action={<Button size="sm" variant="primary">去完善</Button>} />
          </Card>
          <Card>
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3 w-4/5" />
              </div>
            </div>
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <FeaturedIcon icon={Rocket} tone="brand" />
              <FeaturedIcon icon={Rocket} tone="success" />
              <FeaturedIcon icon={Rocket} tone="highlight" />
              <FeaturedIcon icon={Rocket} tone="error" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setModal(true)}>弹窗</Button>
              <Button size="sm" onClick={() => setDrawer(true)}>抽屉</Button>
              <Button size="sm" onClick={() => setConfirm(true)}>确认框</Button>
              <Button size="sm" onClick={() => toast({ tone: "success", title: "意向已发出", body: "对方回应后会通知你" })}>提示</Button>
              <Button size="sm" onClick={() => toast({ tone: "error", title: "本月意向次数已用完", body: "完成任务可以多换 1 次" })}>错误提示</Button>
            </div>
          </Card>
        </section>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="表达意向" desc="对方会在收件箱里看到" footer={<><Button onClick={() => setModal(false)}>取消</Button><Button variant="primary">发送</Button></>}>
        <Textarea placeholder="一句话说明你的来意" />
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="意向详情">
        <p className="text-sm text-gray-600">抽屉内容</p>
      </Drawer>
      <ConfirmModal open={confirm} onClose={() => setConfirm(false)} onConfirm={() => toast({ tone: "info", title: "已撤回" })} title="撤回这条意向？" desc="撤回后对方不再看到，本月次数不退回。" confirmText="撤回" danger />
    </Page>
  );
}
