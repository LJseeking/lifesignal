import { getOutfitScene } from "./outfit";
import { getMahjongScene } from "./mahjong";
import { getSummaryScene } from "./summary";
import { UnifiedEnergyModel } from "../engine/types";
import { EnergyState } from "../energy/service";

/**
 * 聚合所有场景建议
 */
export function getAllScenes(model: UnifiedEnergyModel, tarotCard: string, seed: string, energyState: EnergyState = 'medium') {
  return {
    outfit: getOutfitScene(model, seed, energyState),
    mahjong: getMahjongScene(model, seed, energyState),
    summary: getSummaryScene(model, tarotCard, seed, energyState)
  };
}
