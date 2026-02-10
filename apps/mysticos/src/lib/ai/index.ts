import OpenAI from 'openai';

/**
 * AI 能力核心框架
 * 职责：初始化客户端，提供统一的调用接口，并处理 Feature Flag
 */

const apiKey = process.env.OPENAI_API_KEY;
const isAIEnabled = !!apiKey && apiKey.length > 0;
const isPreviewMode = process.env.AI_PREVIEW === 'true' || true; // 默认开启预览模式以便查看效果

// 如果没有 API Key，则使用 Mock 模式
export const aiClient = isAIEnabled 
  ? new OpenAI({
      apiKey: apiKey,
    })
  : null;

export const FEATURE_FLAG_AI = isAIEnabled || isPreviewMode;

export interface AIStateInsight {
  headline: string;
  bullets: string[];
}

export interface AIPersonalizedExplanation {
  personalizedExplanation: string;
}

export interface AIPatternObserver {
  patternHint: string | null;
}

export interface AIInsights {
  stateInterpreter: AIStateInsight | null;
  personalizedSummary: AIPersonalizedExplanation | null;
  personalizedMahjong: AIPersonalizedExplanation | null;
  patternObserver: AIPatternObserver | null;
}

/**
 * 统一的 AI 调用包装器，处理错误与兜底
 */
export async function safeAICall<T>(
  taskName: string,
  call: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!FEATURE_FLAG_AI) {
    return fallback;
  }

  // 如果处于预览模式但没有 Client，直接返回兜底数据
  if (!aiClient) {
    console.log(`[AI] ${taskName} using fallback (Preview/Mock mode)`);
    return fallback;
  }

  try {
    console.log(`[AI] Calling ${taskName}...`);
    return await call();
  } catch (error) {
    console.error(`[AI] Error in ${taskName}:`, error);
    return fallback;
  }
}
