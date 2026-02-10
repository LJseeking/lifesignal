import { getAstrologyProfile } from './astrology';
import { getMBTIProfile } from './mbti';
import { getBloodProfile } from './blood';
import { getRandomTarot } from './tarot';
import { getFiveElementsProfile, getMergedFiveElements } from './fiveElements';
import { UnifiedEnergyModel, UserProfile } from './types';

/**
 * 汇总生成 UnifiedEnergyModel
 */
export function generateUnifiedModel(profile: UserProfile, date: string, deviceId: string): UnifiedEnergyModel {
  const precision = profile.birthTimePrecision || 'unknown';
  
  // 1. 获取五行分布
  let elements;
  if (precision === 'exact_shichen') {
    elements = getFiveElementsProfile(profile.birthDate, profile.birthShichen, 'exact_shichen');
  } else if (precision === 'approx_range') {
    elements = getMergedFiveElements(profile.birthDate, profile.birthTimeRange || 'morning');
  } else {
    elements = getFiveElementsProfile(profile.birthDate, null, 'unknown');
  }

  const mbti = getMBTIProfile(profile.mbti);
  const blood = getBloodProfile(profile.bloodType);
  const tarot = getRandomTarot(`${date}-${deviceId}`, profile.focus);
  const astro = getAstrologyProfile(profile.birthDate);

  // 2. 计算波动度 (Volatility)
  const randomNoise = (Math.sin(parseInt(date.replace(/-/g, ''))) + 1) / 2; // 0-1
  const intensity = Math.min(
    1.0,
    tarot.volatilityContribution + (astro.element === 'fire' || astro.element === 'air' ? 0.2 : 0.1) + (randomNoise * 0.2)
  );

  // 3. 计算置信度与模型元数据
  const confidenceScore = precision === 'exact_shichen' ? 1.0 : precision === 'approx_range' ? 0.7 : 0.4;

  // 4. 融合逻辑
  const model: UnifiedEnergyModel = {
    five_elements: elements,
    personality: {
      risk: mbti.risk as any,
      emotion: blood.emotion as any,
      decision_speed: mbti.decision_speed || blood.decision_speed || "medium"
    },
    today_bias: {
      action: tarot.effect as any,
      social: mbti.social as any,
      money: profile.focus === "wealth" ? "risk" : "neutral"
    },
    daily_volatility: {
      intensity,
      source: ["tarot", "astrology", "random"]
    },
    metadata: {
      birthTimePrecision: precision as any,
      confidenceScore,
      isMultipleModelsMerged: precision === 'approx_range'
    }
  };

  return model;
}
