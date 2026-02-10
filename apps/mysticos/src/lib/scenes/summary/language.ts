import { EnergyState } from "../../energy/service";

export function getSummaryLanguage(rules: any, seed: string, energyState: EnergyState) {
  const { tarotCard, isHighVolatility, keywords, scenes } = rules;
  
  const getIndex = (arr: any[]) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return Math.abs(hash) % arr.length;
  };

  const highTemplates = [
    `今日能量场波动显著，建议在「${keywords[0]}」中寻找平衡，不宜开启临时决策。`,
    `当前环境信号较为复杂，倾向于保持现状而非主动出击。建议将重心放在已有事项的维护上。`,
    `受「${tarotCard}」牌引导，今日适合放慢节奏。与其追求速度，不如确保判断的冷静与客观。`
  ];

  const normalTemplates = [
    `今日更适合稳中求进，而非临时冒险。在「${keywords[0]}」中获取前进的节奏。`,
    `今天的关键不在于速度，而在于判断是否足够理性。建议优先处理高确定性的事务。`,
    `能量流动趋于平稳，适合在「${keywords.join('与')}」之间寻找行动的最优解。`
  ];

  const templates = isHighVolatility ? highTemplates : normalTemplates;
  const summary = templates[getIndex(templates)];

  // 如果能量低，仅返回基础总结
  if (energyState === 'low' || energyState === 'dormant') {
    return {
      summary: summary + "（当前处于低能量运行模式，仅提供核心概括）",
      action: null,
      communication: null,
      risk: null
    };
  }

  // 生成新增场景的文案
  const actionTexts = [
    `建议倾向于「${scenes.action.suggestion}」。在具体执行中，建议多关注${scenes.action.dos[0]}，避免${scenes.action.donts[0]}。`,
    `当前的行动逻辑是「${scenes.action.suggestion}」。在处理工作时，${scenes.action.dos[1]}将比盲目加速更有价值。`,
    `受整体能量牵引，今日适合以「${scenes.action.suggestion}」为准则。优先处理${scenes.action.dos[0]}，保持节奏稳定。`
  ];

  const communicationTexts = [
    `人际互动建议「${scenes.communication.suggestion}」。在交流中尝试${scenes.communication.dos[0]}，同时警惕${scenes.communication.donts[0]}。`,
    `沟通基调倾向于「${scenes.communication.suggestion}」。比起表达，今日的${scenes.communication.dos[1]}或许能带来更多有效信息。`,
    `建议在人际交往中保持「${scenes.communication.suggestion}」的状态。适合${scenes.communication.dos[0]}，避免陷入${scenes.communication.donts[0]}。`
  ];

  const riskTexts = [
    `风险管理提示「${scenes.risk.suggestion}」。对于非必要的临时开支或决策，建议${scenes.risk.dos[0]}。`,
    `当前的判断力倾向于「${scenes.risk.suggestion}」。在面临选择时，${scenes.risk.dos[1] || '保持观察'}是更为理性的做法。`,
    `对于变动性事项，建议秉持「${scenes.risk.suggestion}」的态度。重点在于${scenes.risk.dos[0]}，而非追求即时收益。`
  ];

  const result = {
    summary,
    action: actionTexts[getIndex(actionTexts)],
    communication: communicationTexts[getIndex(communicationTexts)],
    risk: riskTexts[getIndex(riskTexts)]
  };

  // 如果能量高，增加深度后缀
  if (energyState === 'high') {
    result.summary += " AI 观察到今日环境中的细微信号与您的个人状态产生了深层共振，建议保持高度的自我察觉。";
  }

  return result;
}
