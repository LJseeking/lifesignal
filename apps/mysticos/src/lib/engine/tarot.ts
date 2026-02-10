/**
 * 塔罗模块增强：结合用户关注点
 */
const TAROT_CARDS = [
  "愚者", "魔术师", "女教皇", "女皇", "皇帝", "教皇", "恋人", "战车", 
  "力量", "隐士", "命运之轮", "正义", "倒吊人", "死亡", "节制", "恶魔", 
  "高塔", "星星", "月亮", "太阳", "审判", "世界"
];

export function getRandomTarot(seed: string, focus?: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAROT_CARDS.length;
  const card = TAROT_CARDS[index];
  
  // 波动度贡献：塔罗牌序号越高通常意味着更大的能量变动
  const volatilityContribution = (index / TAROT_CARDS.length) * 0.6;
  
  // 扰动因子：影响行为决策
  const effect = index % 3 === 0 ? "aggressive" : (index % 3 === 1 ? "conservative" : "neutral");
  
  // 结合关注点的解释逻辑
  const interpretations: Record<string, Record<string, string>> = {
    wealth: {
      "aggressive": "在财务决策上宜果断捕捉机会，但需警惕杠杆风险。",
      "conservative": "今日金钱流动宜守不宜攻，建议延迟非必要的大额支出。",
      "neutral": "财务状态相对平衡，建议按原定计划进行小额定投或储蓄。"
    },
    love: {
      "aggressive": "情感表达宜积极主动，打破现状的能量正在聚集。",
      "conservative": "沟通中宜多听少说，给彼此留出足够的情绪缓冲空间。",
      "neutral": "享受平淡的日常互动，稳定的陪伴比激情的表白更有力量。"
    },
    career: {
      "aggressive": "适合推进积压已久的项目，展示个人领导力的时机已到。",
      "conservative": "职场环境中宜低调行事，适合整理文档或复盘前期工作。",
      "neutral": "保持职场人际的和谐，在协作中寻找个人位置的稳固点。"
    }
  };

  const advice = interpretations[focus || 'career']?.[effect] || "保持节奏，顺势而为。";
  
  return { 
    card, 
    effect, 
    volatilityContribution,
    focusAdvice: advice
  };
}
