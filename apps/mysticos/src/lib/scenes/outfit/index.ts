import { getOutfitRules } from "./rules";
import { getOutfitLanguage } from "./language";
import { UnifiedEnergyModel } from "../../engine/types";
import { EnergyState } from "../../energy/service";

export function getOutfitScene(model: UnifiedEnergyModel, seed: string, energyState: EnergyState) {
  const rules = getOutfitRules(model);
  const description = getOutfitLanguage(rules, seed, energyState);
  
  return {
    ...rules,
    description
  };
}
