import { getOutfitScene } from "./scenes/outfit";
import { getMahjongScene } from "./scenes/mahjong";
import { getSummaryScene } from "./scenes/summary";
import { UnifiedEnergyModel } from "./engine/types";
import { EnergyState } from "./energy/service";

/**
 * 聚合所有场景建议
 * @deprecated 请使用 src/lib/scenes/index.ts 中的实现，此文件仅为兼容性保留
 */
export function getAllScenes(model: UnifiedEnergyModel, tarotCard: string, seed: string, energyState: EnergyState = 'medium') {
  return {
    outfit: getOutfitScene(model, seed, energyState),
    mahjong: getMahjongScene(model, seed, energyState),
    summary: getSummaryScene(model, tarotCard, seed, energyState)
  };
}

// 导出旧的函数名以防万一
export const getOutfitAdvice = (model: UnifiedEnergyModel) => getOutfitScene(model, "legacy", "medium");
export const getMahjongAdvice = (model: UnifiedEnergyModel) => getMahjongScene(model, "legacy", "medium");
export const getTodaySummary = (model: UnifiedEnergyModel, tarotCard: string) => getSummaryScene(model, tarotCard, "legacy", "medium");
