"use client";

import { CreateProjectModal } from "@/components/biz/create-project-modal";
import { IntentModal } from "@/components/biz/intent-modal";

/** 全局弹层挂载点：创建项目、表达意向等跨页面弹层。 */
export function GlobalHosts() {
  return (
    <>
      <CreateProjectModal />
      <IntentModal />
    </>
  );
}
