/**
 * 五行映射逻辑（升级版，支持四柱概念）
 */

export type ElementWeights = {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
};

// 基础权重配置
const BASE_WEIGHTS: ElementWeights = { metal: 0.2, wood: 0.2, water: 0.2, fire: 0.2, earth: 0.2 };

const SHICHEN_ELEMENT_MAP: Record<string, string> = {
  zi: 'water', chou: 'earth', yin: 'wood', mao: 'wood',
  chen: 'earth', si: 'fire', wu: 'fire', wei: 'earth',
  shen: 'metal', you: 'metal', xu: 'earth', hai: 'water'
};

const RANGE_SHICHEN_MAP: Record<string, string[]> = {
  morning: ['yin', 'mao', 'chen'],
  noon: ['si', 'wu', 'wei'],
  afternoon: ['shen', 'you', 'xu'],
  night: ['hai', 'zi', 'chou']
};

/**
 * 根据日期和时辰获取五行概况
 */
export function getFiveElementsProfile(
  birthDate: string, 
  shichen?: string | null,
  precision: 'exact_shichen' | 'approx_range' | 'unknown' = 'unknown'
): ElementWeights {
  const date = new Date(birthDate);
  const yearDigit = date.getFullYear() % 10;
  
  // 1. 年柱基础映射 (简化)
  const yearMapping: Record<number, keyof ElementWeights> = {
    0: "metal", 1: "metal", 2: "water", 3: "water",
    4: "wood", 5: "wood", 6: "fire", 7: "fire",
    8: "earth", 9: "earth"
  };
  const yearElement = yearMapping[yearDigit] || "earth";

  // 2. 初始化结果
  const weights = { ...BASE_WEIGHTS };
  
  // 年柱影响权重 (0.4)
  weights[yearElement] = (weights[yearElement] || 0) + 0.4;

  // 3. 处理时柱 (仅在 precision 为 exact_shichen 时赋予高权重)
  if (precision === 'exact_shichen' && shichen && SHICHEN_ELEMENT_MAP[shichen]) {
    const shichenElement = SHICHEN_ELEMENT_MAP[shichen] as keyof ElementWeights;
    // 时柱影响权重 (0.3)
    weights[shichenElement] = (weights[shichenElement] || 0) + 0.3;
  }

  // 归一化处理，确保总和为 1
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(k => {
    weights[k as keyof ElementWeights] = parseFloat((weights[k as keyof ElementWeights] / total).toFixed(2));
  });

  return weights;
}

/**
 * 获取多个时辰下的平均五行分布 (用于处理模糊区间)
 */
export function getMergedFiveElements(birthDate: string, timeRange: string): ElementWeights {
  const shichens = RANGE_SHICHEN_MAP[timeRange] || [];
  if (shichens.length === 0) return getFiveElementsProfile(birthDate, null, 'unknown');

  const allWeights = shichens.map(s => getFiveElementsProfile(birthDate, s, 'exact_shichen'));
  
  const merged: ElementWeights = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  allWeights.forEach(w => {
    Object.keys(w).forEach(k => {
      merged[k as keyof ElementWeights] += w[k as keyof ElementWeights];
    });
  });

  Object.keys(merged).forEach(k => {
    merged[k as keyof ElementWeights] = parseFloat((merged[k as keyof ElementWeights] / allWeights.length).toFixed(2));
  });

  return merged;
}
