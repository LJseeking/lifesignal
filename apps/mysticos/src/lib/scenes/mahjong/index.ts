import { getMahjongRules } from "./rules";
import { getMahjongLanguage } from "./language";
import { UnifiedEnergyModel } from "../../engine/types";
import { EnergyState } from "../../energy/service";

export function getMahjongScene(model: UnifiedEnergyModel, seed: string, energyState: EnergyState) {
  const rules = getMahjongRules(model);
  const description = getMahjongLanguage(rules, seed, energyState);
  
  return {
    ...rules,
    description
  };
}
