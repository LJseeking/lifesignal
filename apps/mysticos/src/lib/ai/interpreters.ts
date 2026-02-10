import { aiClient, AIStateInsight, AIPersonalizedExplanation, AIPatternObserver, safeAICall } from './index';
import { UnifiedEnergyModel } from '../engine/types';

/**
 * 模块一：状态理解者 (State Interpreter)
 * 将能量模型翻译为状态描述
 */
export async function generateStateInsight(model: UnifiedEnergyModel, focus: string): Promise<AIStateInsight> {
  return safeAICall('StateInterpreter', async () => {
    const prompt = `
      你是一个冷静、理性的行为决策AI助手。你的任务是解读一个基于玄学体系转换而来的能量模型 JSON。
      
      输入模型：
      ${JSON.stringify({
        volatility: model.daily_volatility.intensity,
        personality: model.personality,
        bias: model.today_bias,
        focus: focus,
        metadata: model.metadata
      })}

      规则要求：
      1. 只能复述和解读当前状态，不能给出行动建议（不准说“你应该”、“建议”）。
      2. 语气应保持克制、客观。
      3. 应包含对“置信度/不确定性”的解读：
         - 如果 metadata.birthTimePrecision 为 'unknown'，说明“基于基础日期模型，判断偏向稳健”。
         - 如果 为 'approx_range'，说明“基于时间区间模型，已自动对冲不确定性”。
         - 如果 为 'exact_shichen'，说明“基于完整四柱模型，节奏识别精度较高”。
      4. 使用“当前状态偏向...”、“更容易受到...影响”、“更可能出现...”等中性措辞。
      5. 输出 JSON 格式：{"headline": "一句话概括状态", "bullets": ["描述点1", "描述点2"]}

      目标：让用户感觉到你理解了他今天的能量状态。
    `;

    const response = await aiClient!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a rational state interpreter." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}') as AIStateInsight;
  }, {
    headline: "当前能量场呈现出一种微妙的动态平衡。",
    bullets: ["内在判断力保持稳定，不易受外界噪声干扰。", "对细微环境变化的感知力处于均值水平。"]
  });
}

/**
 * 模块二：个性化解释器 (Personal Interpreter)
 * 对结论进行二次解释
 */
export async function generatePersonalizedExplanation(
  baseConclusion: string, 
  userContext: any
): Promise<AIPersonalizedExplanation> {
  return safeAICall('PersonalInterpreter', async () => {
    const prompt = `
      你是一个个性化表达助手。请对以下规则引擎给出的“基础结论”进行个性化解释。
      
      基础结论：${baseConclusion}
      用户背景：${JSON.stringify(userContext)}

      规则：
      1. 禁止改变结论的方向。
      2. 禁止增加新的建议。
      3. 理性型用户(T)偏逻辑解释，情绪型(F)偏感受。事业关注者偏稳定与节奏，情感关注者偏边界与沟通。
      4. 输出 JSON：{"personalizedExplanation": "一段 50 字以内的解释"}
    `;

    const response = await aiClient!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a personal context interpreter." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}') as AIPersonalizedExplanation;
  }, {
    personalizedExplanation: "基于你当前的关注焦点，保持这一节奏将有助于在变动中维持个人判断的独立性。"
  });
}

/**
 * 模块三：连续记忆观察者 (Pattern Observer)
 */
export async function generatePatternHint(history: any[]): Promise<AIPatternObserver> {
  return safeAICall('PatternObserver', async () => {
    if (history.length < 3) return { patternHint: null };

    const prompt = `
      你是一个长期模式观察者。请根据用户最近 7 天的状态历史给出一段“观察性描述”。
      
      历史数据：${JSON.stringify(history)}

      规则：
      1. 只能说“这是你本周第X次处于...状态”，或者“近期你的状态呈现...趋势”。
      2. 语气严禁批评、纠错或情绪评价。
      3. 输出 JSON：{"patternHint": "一段话或null"}
    `;

    const response = await aiClient!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a pattern observer." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}') as AIPatternObserver;
  }, { patternHint: null });
}
