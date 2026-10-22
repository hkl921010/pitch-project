import type { NeedItem, Project } from "./types";

/**
 * 原型里的“AI 读取 BP”结果：不调用真实模型，固定返回一份示例项目的结构化内容。
 * 正式产品中由 BP 解析服务返回同样的字段。
 */
export interface BPExtract {
  name: string;
  oneLiner: string;
  track: string;
  region: string;
  tags: string[];
  intro: string;
  product: string;
  edge: string;
  website: string;
  lookingFor: Pick<NeedItem, "kind" | "sub" | "title" | "detail">[];
}

export const BP_SAMPLE: BPExtract = {
  name: "鲜宠食光",
  oneLiner: "给东南亚城市养宠家庭的鲜粮订阅",
  track: "消费品牌",
  region: "东南亚",
  tags: ["宠物", "订阅制", "DTC"],
  intro:
    "鲜宠食光为新加坡、吉隆坡的城市养宠家庭提供按周配送的宠物鲜粮。所有配方由兽医营养师设计，中央厨房当日现做、冷链 24 小时送达。上线 7 个月，付费订阅用户 1,800 户，月留存 82%。",
  product: "猫粮、犬粮两条产品线共 9 个配方，按周订阅（约 38 新元/周），另有冻干零食加购。",
  edge: "创始团队来自 Grab 和皇家宠物食品，自建中央厨房，单份成本比进口鲜粮低 35%；与 40 家宠物医院建立了推荐合作。",
  website: "freshpaw.sg",
  lookingFor: [
    { kind: "invest", sub: "天使轮", title: "天使轮融资，用于吉隆坡中央厨房", detail: "希望投资方有消费品牌或宠物行业经验" },
    { kind: "partner", sub: "渠道", title: "宠物医院与宠物店渠道", detail: "按推荐分成或联名套餐" },
  ],
};

export function bpAsPrefill(x: BPExtract): Partial<Project> {
  return {
    region: x.region,
    tags: x.tags,
    intro: x.intro,
    product: x.product,
    edge: x.edge,
    website: x.website,
    lookingFor: x.lookingFor.map((n, i) => ({ ...n, id: `draft-${i}`, ownerType: "project", ownerId: "", createdAt: "" })),
  };
}

/** 页面里展示“AI 提取了哪些内容” */
export function bpFieldsFound(x: BPExtract): string[] {
  return ["项目名称", "一句话介绍", "赛道", "项目介绍", "在卖什么", "凭什么", `正在寻找 ${x.lookingFor.length} 条`, "官网"];
}
