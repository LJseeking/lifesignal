import { getSummaryRules } from "./rules";
import { getSummaryLanguage } from "./language";
import { UnifiedEnergyModel } from "../../engine/types";
import { EnergyState } from "../../energy/service";

export function getSummaryScene(model: UnifiedEnergyModel, tarotCard: string, seed: string, energyState: EnergyState) {
  const rules = getSummaryRules(model, tarotCard);
  const lang = getSummaryLanguage(rules, seed, energyState);
  
  return {
    ...rules,
    description: lang.summary, // 保持向后兼容的主总结
    action: lang.action,
    communication: lang.communication,
    risk: lang.risk
  };
}
