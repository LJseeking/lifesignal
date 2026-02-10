import { UnifiedEnergyModel } from "../../engine/types";

export function getSummaryRules(model: UnifiedEnergyModel, tarotCard: string) {
  const intensity = model.daily_volatility.intensity;
  const isHighVolatility = intensity > 0.7;
  const focus = model.today_bias.money === "risk" ? "wealth" : "general";
  
  const keywords = [];
  if (isHighVolatility) keywords.push("静守", "内省");
  else if (model.today_bias.action === "aggressive") keywords.push("突破", "果敢");
  else keywords.push("协调", "自然");

  // 1. 今日宜忌逻辑
  let dos = ["整理空间", "深度阅读"];
  let donts = ["开启新项目", "重要契约"];

  if (!isHighVolatility) {
    if (model.today_bias.social === "active") {
      dos = ["商务洽谈", "老友相聚", "主动沟通"];
    } else {
      dos = ["技能精进", "复盘工作", "独立创作"];
    }

    if (model.today_bias.money === "avoid_risk") {
      donts = ["风险投资", "大额消费", "盲目跟风"];
    } else {
      donts = ["拖延决策", "过度思虑", "忽视直觉"];
    }
  } else {
    dos = ["精简待办事项", "保持规律作息"];
    donts = ["情绪化沟通", "临时改变计划"];
  }

  // 2. 今日行动/工作方式参考 (Action Scene)
  const actionLogic = {
    type: "action",
    title: "今日行动与工作参考",
    suggestion: model.today_bias.action === "aggressive" ? "主动推进" : "稳扎稳打",
    dos: model.today_bias.action === "aggressive" ? ["攻克难点", "表达观点"] : ["优化流程", "核对细节"],
    donts: model.today_bias.action === "aggressive" ? ["犹豫不决", "错失良机"] : ["急于求成", "忽视规范"]
  };

  // 3. 今日沟通与人际提示 (Communication Scene)
  const communicationLogic = {
    type: "communication",
    title: "今日沟通与人际提示",
    suggestion: model.today_bias.social === "active" ? "积极交流" : "深度倾听",
    dos: model.today_bias.social === "active" ? ["扩大共识", "资源对接"] : ["明确边界", "整理反馈"],
    donts: model.today_bias.social === "active" ? ["无效社交", "过度承诺"] : ["言语冲突", "强加意愿"]
  };

  // 4. 今日风险与决策提示 (Risk Scene)
  const riskLogic = {
    type: "risk",
    title: "今日风险与决策提示",
    isSafe: intensity < 0.6 && model.today_bias.money !== "avoid_risk",
    suggestion: intensity > 0.6 ? "严格风控" : "适度探索",
    dos: intensity > 0.6 ? ["风险型娱乐盘点", "止损检查"] : ["小额尝试", "机会识别"],
    donts: ["冲动消费", "临时改变重要决策", "博弈型娱乐"]
  };

  return {
    tarotCard,
    isHighVolatility,
    keywords,
    dos: dos.slice(0, 3),
    donts: donts.slice(0, 3),
    scenes: {
      action: actionLogic,
      communication: communicationLogic,
      risk: riskLogic
    }
  };
}
