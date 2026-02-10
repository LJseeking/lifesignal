/**
 * 血型偏好映射
 */
export function getBloodProfile(bloodType: string | null | undefined) {
  const profiles: Record<string, any> = {
    "A": { emotion: "stable", decision_speed: "slow" },
    "B": { emotion: "unstable", decision_speed: "fast" },
    "O": { emotion: "stable", decision_speed: "fast" },
    "AB": { emotion: "unstable", decision_speed: "medium" },
  };

  return profiles[bloodType || ""] || { emotion: "stable", decision_speed: "medium" };
}
