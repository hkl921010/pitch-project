"use client";

import { Globe, Link2, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, RadioCards, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { bpAsPrefill, type BPExtract } from "@/data/ai-prefill";
import { TRACKS } from "@/data/constants";
import type { Project } from "@/data/types";
import { useApp } from "@/store/app-store";
import { BPUpload } from "./bp-upload";

const EMPTY = { name: "", oneLiner: "", track: "", visibility: "public" as Project["visibility"] };

/** 1 分钟创建：三项必填即可生成公开页，其余在编辑页按清单补全。 */
export function CreateProjectModal() {
  const open = useApp((s) => s.ui.createOpen);
  const close = useApp((s) => s.closeCreate);
  const create = useApp((s) => s.createProject);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [prefill, setPrefill] = useState<Partial<Project> | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = {
    name: !form.name.trim() ? "请填写项目名称" : form.name.trim().length > 20 ? "不超过 20 个字" : undefined,
    oneLiner: !form.oneLiner.trim() ? "一句话说清楚你在做什么" : form.oneLiner.trim().length > 40 ? "不超过 40 个字" : undefined,
    track: !form.track ? "请选择赛道" : undefined,
  };
  const valid = !errors.name && !errors.oneLiner && !errors.track;

  const reset = () => {
    setForm(EMPTY);
    setPrefill(null);
    setTouched(false);
    setBusy(false);
  };

  const onExtract = (x: BPExtract) => {
    setForm((f) => ({ ...f, name: f.name || x.name, oneLiner: f.oneLiner || x.oneLiner, track: f.track || x.track }));
    setPrefill(bpAsPrefill(x));
  };

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setTimeout(() => {
      const slug = create({ name: form.name.trim(), oneLiner: form.oneLiner.trim(), track: form.track, visibility: form.visibility, prefill: prefill ?? undefined });
      toast({ tone: "success", title: "公开页已生成", body: "链接现在就可以分享，接着把资料补全" });
      close();
      reset();
      router.push(`/p/${slug}/edit?new=1`);
    }, 450);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        close();
        reset();
      }}
      title="1 分钟创建项目"
      desc="填三项就能拿到公开页链接，其余的之后慢慢补。"
      icon={
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-highlight-soft text-gray-900 ring-8 ring-[hsl(60_100%_95%)]">
          <Rocket size={22} />
        </span>
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              close();
              reset();
            }}
          >
            取消
          </Button>
          <Button variant="primary" onClick={submit} loading={busy} disabled={touched && !valid}>
            创建并生成公开页
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <BPUpload onExtract={onExtract} />
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          或直接填写
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <Input
          label="项目名称"
          required
          maxCount={20}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="比如：拾光茶事"
          error={touched ? errors.name : undefined}
        />
        <Input
          label="一句话介绍"
          required
          maxCount={40}
          value={form.oneLiner}
          onChange={(e) => setForm({ ...form, oneLiner: e.target.value })}
          placeholder="比如：把东方新茶饮开进东南亚的写字楼和商场"
          error={touched ? errors.oneLiner : undefined}
        />
        <Select
          label="赛道"
          required
          value={form.track}
          onChange={(e) => setForm({ ...form, track: e.target.value })}
          placeholder="选择最接近的一个"
          options={TRACKS.map((t) => ({ value: t, label: t }))}
          error={touched ? errors.track : undefined}
        />
        <RadioCards<Project["visibility"]>
          value={form.visibility}
          onChange={(v) => setForm({ ...form, visibility: v })}
          options={[
            { value: "public", title: "公开", desc: "任何人可访问；资料完善后可申请上发现页", icon: Globe },
            { value: "link", title: "仅持链接可见", desc: "不出现在发现页，适合先发给熟人", icon: Link2 },
          ]}
        />
      </div>
    </Modal>
  );
}