/**
 * MBTI 行为倾向映射
 */
export function getMBTIProfile(mbti: string | null | undefined) {
  if (!mbti) return { risk: "medium", social: "neutral" };

  const isE = mbti.startsWith("E");
  const isT = mbti.includes("T");
  const isP = mbti.endsWith("P");

  return {
    risk: isP ? "high" : (isT ? "medium" : "low"),
    social: isE ? "active" : "avoid",
    decision_speed: isT ? "fast" : "slow"
  };
}
