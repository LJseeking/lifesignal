# Life Signal - Project Archive (MVP Snapshot)

## 当前项目目标 (MVP 阶段)
Life Signal 旨在构建一个融合多种信号模型（五行、塔罗、MBTI、出生信息）的个人化生活决策辅助系统。其核心目标是提供理性、克制且可执行的行为建议，而非进行命运预测。系统通过 AI 能量（Signal Energy）机制，根据用户的能量状态差异化提供内容的理解深度。

## 已完成的功能清单
1.  **用户画像与建模**:
    *   Onboarding 流程：采集出生日期、关注重点、MBTI、血型等。
    *   出生时间精度建模：支持「精确时辰」、「大概时段」、「不确定」三种输入，并实现对应的不确定性降权与多模型融合逻辑。
2.  **AI 能量系统 (Off-chain)**:
    *   能量自然衰减（-5/天）与三档充能逻辑。
    *   休眠态（Dormant）处理：能量为 0 时暂停分析。
    *   关键时刻 Boost：低能量高波动时的弹出式增强建议。
3.  **决策场景模块**:
    *   **今日运势总览**: 一句话总结、关键词、宜/忌、轻场景决策（行动、沟通、风险）。
    *   **穿搭建议**: 颜色、材质、锚点建议。
    *   **娱乐/麻将**: 参与倾向、风格指导、方位感应。
    *   **今日塔罗**: 抽牌仪式动画与 AI 深度解读。
    *   **空间建议**: 覆盖工作区、睡眠区、客厅、入门区四个场景的自动化引导。
4.  **AI 解释层**:
    *   集成 GPT-4o-mini 实现状态理解、个性化解释、连续记忆观察。
    *   置信度透明化：根据出生信息精度显示不同的模型精度标签。
5.  **品牌与命名**:
    *   完成从 MysticOS 到 Life Signal 的全局品牌更名。
6.  **链上结算层基础 (Local Only)**:
    *   `SignalToken (ERC-20)`：支持代币流通基础。
    *   `EnergyVault`：实现 1 Token = 10 EnergyCredit 的结算逻辑与链上事件。

## 当前未完成 / 未启用的功能
*   **实际链上集成**: 目前合约仅在本地 Hardhat 环境运行，尚未连接钱包或部署至 BNB Testnet。
*   **链上事件监听**: 尚未实现后端 Service 监听 `EnergyCharged` 事件并实时更新 Off-chain 能量。
*   **权限与订阅硬限制**: 目前 `isSubscribed` 逻辑为预览模式，尚未接入真实的支付或 NFT 权限验证。

## 当前代码结构树 (简要)
```text
.
├── contracts/              # Hardhat 合约工程
│   ├── contracts/          # SignalToken.sol, EnergyVault.sol
│   ├── test/               # 单元测试 (energyVault.test.ts)
│   └── hardhat.config.ts   # 编译与网络配置
├── src/
│   ├── app/                # Next.js 路由与页面 (energy, onboarding, scenes, tarot)
│   ├── components/         # UI 组件 (EnergyBadge, BoostModal, OnboardingForm 等)
│   ├── lib/
│   │   ├── ai/             # AI 接口与解释器
│   │   ├── engine/         # 核心逻辑引擎 (五行, 塔罗, MBTI, 汇总模型)
│   │   ├── energy/         # 能量系统服务
│   │   ├── scenes/         # 各场景的规则 (rules.ts) 与表达 (language.ts)
│   │   └── prisma.ts       # 数据库客户端
├── prisma/                 # 数据库 Schema 定义
└── README.md               # 项目主说明文档
```
