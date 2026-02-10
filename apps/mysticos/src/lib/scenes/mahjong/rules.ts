import { UnifiedEnergyModel } from "../../engine/types";

export function getMahjongRules(model: UnifiedEnergyModel) {
  // 兜底逻辑
  const intensity = model?.daily_volatility?.intensity ?? 0.5;
  const riskPreference = model?.personality?.risk ?? "medium";
  const actionBias = model?.today_bias?.action ?? "neutral";
  const emotionStability = model?.personality?.emotion ?? "stable";

  const isHighVolatility = intensity > 0.7;
  
  const isHighRisk = riskPreference === "high" || actionBias === "aggressive";
  
  // 1. 参与倾向 (participation)
  let participation: "recommended" | "neutral" | "avoid" = "neutral";
  if (isHighVolatility) participation = "avoid";
  else if (emotionStability === "stable" && intensity < 0.4) participation = "recommended";
  
  // 2. 行为节奏 (style)
  let style: "conservative" | "balanced" | "aggressive" = "balanced";
  if (isHighVolatility) style = "conservative";
  else if (isHighRisk) style = "aggressive";

  // 3. 行为提示 (tips)
  const tips = isHighVolatility 
    ? ["多看少动，观察牌势", "控制入局次数", "保持呼吸均匀"]
    : (isHighRisk 
        ? ["把握进攻时机", "利用心理优势", "注意见好就收"]
        : ["稳扎稳打", "关注下家动向", "保持心态平和"]);
  
  return {
    participation,
    style,
    tips,
    isHighVolatility,
    lucky_color: (model?.five_elements?.fire ?? 0) > 0.4 ? "红色" : "深色",
    warning: isHighVolatility ? "今日能量震荡剧烈，决策易受情绪干扰，博弈需极其克制。" : "能量相对平稳，适合在轻松氛围中参与。"
  };
}
