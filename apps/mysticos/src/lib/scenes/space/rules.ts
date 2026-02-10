import { UnifiedEnergyModel } from "../../engine/types";

export type SpaceZone = 'work' | 'sleep' | 'living' | 'entry';
export type SpaceGoal = 'stable' | 'focus' | 'progress' | 'relax';

export interface SpaceRules {
  zone: SpaceZone;
  goal: SpaceGoal;
  intensity: number;
  baseTone: string;
  recommendations: string[];
  avoid: string;
  reason: string;
  recovery?: string;
}

// 系统自动映射语义 (不展示给用户)
const ZONE_GOAL_MAP: Record<SpaceZone, SpaceGoal> = {
  work: 'focus',    // 工作区 -> 专注 / 清晰
  sleep: 'relax',   // 睡眠区 -> 放松 / 恢复
  living: 'stable', // 客厅 -> 稳定 / 协调
  entry: 'progress' // 入门区 -> 切换 / 过渡 (映射到 progress 逻辑)
};

export function getSpaceRules(model: UnifiedEnergyModel, zone: SpaceZone): SpaceRules {
  const intensity = model?.daily_volatility?.intensity || 0.5;
  const goal = ZONE_GOAL_MAP[zone];
  
  const rulesMap: Record<SpaceZone, Partial<Record<SpaceGoal, Partial<SpaceRules>>>> = {
    work: {
      focus: {
        baseTone: "今日你的工作区更适合保持清晰、克制的状态。",
        recommendations: ["清空电脑屏幕下方的所有杂物", "调低环境背景音，保持空气流通"],
        avoid: "避免在桌面放置超过 3 种颜色的非办公物件",
        reason: "减少视觉冗余有助于提升大脑的信噪比，让注意力的分配更加精准。"
      }
    },
    sleep: {
      relax: {
        baseTone: "今日你的睡眠区更适合保持温润、松弛的状态。",
        recommendations: ["使用低亮度的暖黄色地灯", "更换触感更柔软的枕套或盖毯"],
        avoid: "避免在卧室内处理任何带有工作属性的沟通",
        reason: "通过明确的空间功能切割，给予身体清晰的放松信号。"
      }
    },
    living: {
      stable: {
        baseTone: "今日你的客厅更适合保持稳定、协调的状态。",
        recommendations: ["保持沙发区域的整洁，避免堆放衣物", "在茶几中心放置一个圆形器皿或托盘"],
        avoid: "避免在主要行进路线上放置零散杂物",
        reason: "核心公共区域的稳定性有助于维持家庭成员间的能量协调，提供心理缓冲空间。"
      }
    },
    entry: {
      progress: {
        baseTone: "今日你的入门区更适合保持通透、明亮的状态。",
        recommendations: ["确保入门处的感应灯反应灵敏", "在进门处摆放一件象征活力的绿色阔叶植物"],
        avoid: "避免让大件重物遮挡入户的行进动线",
        reason: "通畅的行进路径能带来顺滑的心理暗示，提升跨越空间后的切换效率。"
      }
    }
  };

  const selectedRule = rulesMap[zone][goal];
  
  // High Energy 额外建议
  const recoveryMap: Record<SpaceZone, string> = {
    work: "明日能量回落后，可将该物件恢复原位，避免空间长期固化。",
    sleep: "次日清晨可拉开窗帘进行光线重置，让空间回归自然节奏。",
    living: "明日状态稳定后，可根据心情微调靠枕摆放，保持空间的动态平衡。",
    entry: "明日状态稳定后，可重新整理玄关布局，保持能量的动态新鲜感。"
  };

  return {
    zone,
    goal,
    intensity,
    baseTone: selectedRule!.baseTone!,
    recommendations: selectedRule!.recommendations!,
    avoid: selectedRule!.avoid!,
    reason: selectedRule!.reason!,
    recovery: intensity >= 0.7 ? recoveryMap[zone] : undefined
  };
}
