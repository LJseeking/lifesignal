import { EnergyState } from "../../energy/service";

export function getOutfitLanguage(rules: any, seed: string, energyState: EnergyState) {
  const { isHighVolatility, recommendedColors, materials } = rules;
  
  // 简单的确定性随机索引
  const getIndex = (arr: any[]) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return Math.abs(hash) % arr.length;
  };

  const highVolatilityTemplates = [
    `今日能量场波动显著，穿戴建议以稳重为主。推荐选择${recommendedColors.join('或')}系，搭配${materials[0]}材质，减少外界干扰。`,
    `环境磁场较为敏感，建议通过${recommendedColors[0]}色系来平复心境。饰品宜简不宜繁，首选${rules.accessories[0]}。`,
    `由于能量处于高频震荡期，低调的${recommendedColors.join('/')}是您的最佳护盾。避免过于张扬的剪裁。`
  ];

  const lowVolatilityTemplates = [
    `今日气场纯净，适合大胆展现自我。${recommendedColors.join('与')}的碰撞将为您带来极佳的吸粉效应。`,
    `推荐尝试${materials.join('搭配')}的层次感穿搭，${recommendedColors[0]}色将强化您的沟通能量。`,
    `灵感进发的一天，${rules.accessories.join('或')}的点缀能瞬间点亮您的整体气质，主推${recommendedColors[1]}。`
  ];

  const templates = isHighVolatility ? highVolatilityTemplates : lowVolatilityTemplates;
  let text = templates[getIndex(templates)];

  if (energyState === 'low' || energyState === 'dormant') {
    return text + "（基础建议模式）";
  }

  if (energyState === 'high') {
    text += ` 此外，AI 建议您在衣着中加入少量${rules.accessories[1] || '金属质感'}元素，以锚定高阶决策能量。`;
  }

  return text;
}
