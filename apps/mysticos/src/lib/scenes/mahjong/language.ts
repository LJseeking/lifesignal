import { EnergyState } from "../../energy/service";

export function getMahjongLanguage(rules: any, seed: string, energyState: EnergyState) {
  const { isHighVolatility, participation, style } = rules;
  
  const getIndex = (arr: any[]) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return Math.abs(hash) % arr.length;
  };

  const participationMap = {
    recommended: "建议参与",
    neutral: "中性态度",
    avoid: "不宜入局"
  };

  const styleMap = {
    conservative: "保守观望",
    balanced: "稳健平衡",
    aggressive: "果敢出击"
  };

  const highVolatilityTemplates = [
    `今日磁场紊乱，强行入局恐有损耗。倾向于「${participationMap[participation as keyof typeof participationMap]}」，建议转为旁观，观察牌势而非亲自下场。`,
    `由于波动度过高，您的直觉可能出现偏差。当前采取「${styleMap[style as keyof typeof styleMap]}」姿态是最理智的选择。`,
    `不建议在今日进行任何博弈活动。能量守恒提示您：静坐比出击更能保存福报。`
  ];

  const normalTemplates = [
    `运势平稳，倾向于「${participationMap[participation as keyof typeof participationMap]}」。建议保持「${styleMap[style as keyof typeof styleMap]}」风格，在谈笑中寻找机会。`,
    `今日适合小试牛刀。开运色为${rules.lucky_color}，入座后请保持呼吸均匀，以「${styleMap[style as keyof typeof styleMap]}」取胜。`,
    `牌局即人局，「${styleMap[style as keyof typeof styleMap]}」的节奏将帮助您掌控局势。记得见好就收，切勿贪战。`
  ];

  const templates = isHighVolatility ? highVolatilityTemplates : normalTemplates;
  let text = templates[getIndex(templates)];

  if (energyState === 'low' || energyState === 'dormant') {
    return text + "（当前能量较低，建议以防守为主）";
  }

  if (energyState === 'high') {
    text += ` 此外，AI 深度分析显示，今日您的${rules.lucky_element || '五行'}能量在${rules.lucky_direction || '东南'}方位有较强感应，入座时可优先参考。`;
  }

  return text;
}
