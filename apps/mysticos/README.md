⚠️ 本版本为 pre-onchain 阶段快照，仅用于逻辑验证，不再改动

# Life Signal - 个人化生活决策辅助系统 (MVP)

Life Signal 是一个持续感知你生活中各种信号的 AI 系统，包括时间、空间、习惯与个人状态，并将这些信号转化为克制、可执行的行动建议。

## 产品定位

- **不做“命运预测”**：我们不讨论未来会发生什么。
- **只输出“行为建议”**：所有的结果都是为了给您当日的决策提供参考。
- **克制与理性**：使用「建议/提示/倾向」等词汇，避免绝对判断。
- **核心宣言**: Life Signal is an AI system that continuously reads signals from your life — time, space, habits, and personal state — and turns them into calm, actionable guidance.

## 技术选型

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite (via Prisma)
- **校验**: Zod
- **身份**: 匿名标识 (deviceId via HttpOnly Cookie)

## 核心架构

1. **用户画像模块**: 收集出生信息、MBTI、血型等基础数据。
2. **模块化融合引擎**: 
   - `astrology.ts`: 星座周期映射。
   - `mbti.ts`: 行为倾向分析。
   - `blood.ts`: 性格偏好参考。
   - `tarot.ts`: 随机扰动因子。
   - `fiveElements.ts`: 五行能量映射。
3. **统一能量模型**: 聚合各模块输出，生成结构化的 `UnifiedEnergyModel`。
4. **场景决策模块**: 基于能量模型输出具体场景（穿搭、麻将、综合、空间）的行动建议。

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 初始化数据库
```bash
npx prisma migrate dev --name init
```

### 3. 运行项目
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可开始。

## 产品化精修 (Refinement 1.0)

本轮精修聚焦于提升系统的“长期粘性”与“付费潜力”，在不改变核心架构的前提下完成了以下升级：

### 1. 能量模型升级：当日波动度 (Daily Volatility)
- **引入 `daily_volatility` 字段**：基于塔罗抽牌、星座周期及日期噪声计算当日能量的稳定性。
- **动态响应**：
  - 高波动 (Intensity > 0.7)：系统建议自动转为“收敛”、“观察”、“不宜行动”，文案更趋克制。
  - 低波动 (Intensity < 0.3)：系统建议更具针对性和确定性。

### 2. 场景模块重构：规则与文案分离
- **结构化拆分**：每个场景（穿搭、麻将、综合、空间）现在拥有独立的 `rules.ts`（逻辑层）和 `language.ts`（表达层）。
- **表达扰动机制**：通过 `seed = date + deviceId` 确保同一用户在不同日期的句式表达各异，连续 7 天不重样。

### 3. 塔罗模块增强
- **关注点映射**：塔罗解释不再纯随机，而是结合用户画像中的 `focus`（财/情/事）进行差异化解读。

### 4. 付费与留存机制
- **功能分层**：
  - **免费用户**：可见今日一句话总结（模糊宜忌）、塔罗启示。
  - **订阅用户**：解锁完整的穿搭方案、麻将博弈策略、精准宜忌列表。
- **时间锚点**：首页底部加入“明日解锁”提示，增强用户回访预期。

## 版本里程碑 (Version History)

### **v0.4.1 – Pre-BNB Testnet Audit Complete (2026-02-02)**
这是 Life Signal 在进入 BNB Testnet 阶段前的最终审计版本。

**审计通过清单：**
1. **命名一致性**：全站用户可见区域已彻底移除 "MysticOS"，统一使用 Life Signal / Signal。
2. **能量深度差异化**：
   - 所有场景模块（Summary, Outfit, Mahjong, Space）均已支持基于 Energy State 的深度差异化输出。
   - High Energy 用户可获得额外的 AI 深度洞察与建议。
3.  **不确定性建模**：出生时间精度的三种情况（时辰/时段/未知）均被正确建模，且在 AI 输出中保持透明度。
4. **语言系统规范**：移除了“解锁”、“必须”、“否则”等非建议式文案，改用“开启”、“应”等克制表达。
5. **鲁棒性**：Energy = 0 时的休眠逻辑已在所有核心入口完成闭环。

---

## **Life Signal · Ready for BNB Testnet v1**
该版本已被标记为进入 BNB 测试链集成的基准版本。

---

## 开发约束 (Frozen Logic Policy)

从 v0.4 开始，项目正式进入**链上集成阶段 (On-chain Integration Phase)**：
- **禁止**：对 v0.4 已存在的任何模块进行重构。
- **禁止**：顺手优化页面结构、文案或调整 Signal Energy 的定义逻辑。
- **允许**：仅以「新增模块」的方式引入 Web3 原生能力（Token、链上充能结算、资产映射）。
- **原则**：链上仅作为结算与确权层，不得牺牲现有产品的克制性与用户体验。

This ledger follows an event-sourcing style:
 credit_events are append-only and must never be modified.
 All corrections must be done via ADJUST events.