import { UnifiedEnergyModel } from "../../engine/types";

export function getOutfitRules(model: UnifiedEnergyModel) {
  // 兜底逻辑：如果 model 不完整，使用默认值
  const fiveElements = model?.five_elements || { metal: 0, wood: 0, water: 0, fire: 0, earth: 0.2 };
  const intensity = model?.daily_volatility?.intensity || 0.5;
  
  const sortedElements = Object.entries(fiveElements).sort((a, b) => b[1] - a[1]);
  const maxElement = sortedElements[0][0];
  const isHighVolatility = intensity > 0.7;

  const mapping: Record<string, any> = {
    metal: { recommendedColors: ["白色", "金色"], avoidColors: ["红色"], materials: ["精纺面料", "丝绸"], accessories: ["金属框架眼镜", "银饰"] },
    wood: { recommendedColors: ["绿色", "青色"], avoidColors: ["白色"], materials: ["棉麻", "天然纤维"], accessories: ["木质手串", "绿植图案配饰"] },
    water: { recommendedColors: ["黑色", "蓝色"], avoidColors: ["黄色"], materials: ["雪纺", "轻薄面料"], accessories: ["珍珠", "波浪纹饰品"] },
    fire: { recommendedColors: ["红色", "紫色"], avoidColors: ["黑色"], materials: ["皮革", "合成纤维"], accessories: ["尖角设计饰品", "红宝石色挂件"] },
    earth: { recommendedColors: ["黄色", "咖啡色"], avoidColors: ["绿色"], materials: ["羊毛", "粗花呢"], accessories: ["玉石", "陶瓷质感饰品"] },
  };

  const baseAdvice = mapping[maxElement] || mapping.earth;

  return {
    ...baseAdvice,
    isHighVolatility,
    maxElement,
    notes: isHighVolatility ? "今日能量场波动较大，建议选择质感扎实的材质以增强稳定性。" : "今日能量纯净，适合尝试有设计感的剪裁。"
  };
}
