import { UnifiedEnergyModel } from "../../engine/types";
import { EnergyState } from "../../energy/service";
import { getSpaceRules, SpaceZone } from "./rules";
import { getSpaceLanguage, SpaceLanguageOutput } from "./language";

export function getSpaceAdvice(
  model: UnifiedEnergyModel, 
  zone: SpaceZone, 
  energyState: EnergyState
): SpaceLanguageOutput {
  const rules = getSpaceRules(model, zone);
  return getSpaceLanguage(rules, energyState);
}
