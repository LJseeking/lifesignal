import { SpaceRules } from "./rules";
import { EnergyState } from "../../energy/service";

export interface SpaceLanguageOutput {
  headline: string;
  recommendations: string[];
  avoid: string;
  reason?: string;
  recovery?: string;
  energyHint?: string;
}

export function getSpaceLanguage(rules: SpaceRules, energyState: EnergyState): SpaceLanguageOutput {
  const { baseTone, recommendations, avoid, reason, recovery } = rules;

  if (energyState === 'dormant' || energyState === 'low') {
    return {
      headline: baseTone,
      recommendations: [recommendations[0]], // 仅输出 1 条
      avoid: avoid,
      energyHint: "当前能量状态下，Signal 提供的是基础空间建议。为获得更深入的背景分析与使用建议，您可以选择为 Signal 充能。"
    };
  }

  if (energyState === 'medium') {
    return {
      headline: baseTone,
      recommendations: recommendations,
      avoid: avoid,
      reason: reason
    };
  }

  // High Energy
  return {
    headline: baseTone,
    recommendations: recommendations,
    avoid: avoid,
    reason: reason,
    recovery: recovery
  };
}
