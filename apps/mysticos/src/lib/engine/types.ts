export interface UnifiedEnergyModel {
  five_elements: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  };
  personality: {
    risk: "low" | "medium" | "high";
    emotion: "stable" | "unstable";
    decision_speed: "fast" | "medium" | "slow";
  };
  today_bias: {
    action: "aggressive" | "neutral" | "conservative";
    social: "active" | "neutral" | "avoid";
    money: "risk" | "neutral" | "avoid_risk";
  };
  daily_volatility: {
    intensity: number; // 0.0 - 1.0
    source: Array<"tarot" | "astrology" | "random">;
  };
  // 新增精度与不确定性元数据
  metadata: {
    birthTimePrecision: "exact_shichen" | "approx_range" | "unknown";
    confidenceScore: number; // 0.0 - 1.0
    isMultipleModelsMerged: boolean;
  };
}

export type UserProfile = {
  birthDate: string;
  birthTime?: string | null;
  birthTimePrecision: "exact_shichen" | "approx_range" | "unknown";
  birthShichen?: string | null;
  birthTimeRange?: string | null;
  birthPlace?: string | null;
  gender: string;
  focus: string;
  mbti?: string | null;
  bloodType?: string | null;
};
