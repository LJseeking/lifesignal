# Milestone v0.2 - EnergyVault Event & Tracking Stable

## 已完成能力清单
- **Approve -> Charge 状态机**: 实现了标准的 ERC-20 授权后充能流程，防止交易回滚。
- **EnergyCharged 入库**: 实现了基于 `ethers.js` 的后端监听器，自动抓取链上 `EnergyCharged` 事件。
- **去重逻辑**: 使用数据库复合唯一索引 `UNIQUE(tx_hash, log_index)` 确保事件不漏不重。
- **排序规则**: API 与前端列表均按 `block_number DESC, log_index DESC` 严格排序。
- **UI 回放**: 新增 `/charges` 页面，实时展示链上同步的充能历史记录。
- **安全性**: 
    - 强制 Signer 校验，禁止 Treasury 地址自充。
    - 补丁：支持 Reorg Safety（扫回 20 个区块）。
    - 语义：统一使用 WEI 最小单位处理链上数据。

## 已知限制
- **Credits 汇总**: 目前仅记录单次充能，尚未实现用户总能量点的聚合汇总。
- **网络限制**: 仅支持 BSC Testnet (Chain ID 97)。
- **持久化**: 采用 SQLite 本地数据库，尚未接入生产级分布式数据库。

## 关键配置文件路径
- **Web3 配置**: `src/lib/web3/config.ts`
- **ABI 定义**: `src/lib/web3/abis.ts`
- **监听器**: `scripts/listeners/energyCharged.listener.ts`
- **数据库逻辑**: `src/lib/db/charge.db.ts`
- **API 接口**: `src/app/api/charges/route.ts`
- **充能中心**: `src/app/charge/page.tsx`
- **历史记录页**: `src/app/charges/page.tsx`

---
*Generated on 2026-02-04*

## 复现步骤 (Reproduction Steps)
### 1. 环境准备
- **Node.js**: `v20.x` 或以上
- **pnpm**: `v8.x` 或以上

### 2. 启动事件监听器
在独立终端运行：
```bash
npx ts-node scripts/listeners/energyCharged.listener.ts
```
**预期输出片段**:
```text
--- Life Signal EnergyCharged Listener Starting ---
[Network] Name: bsc-testnet, ChainId: 97
[Time] ISO Timestamp: 2026-02-04T...
[Status] lastSavedBlock: ...
[Status] fromBlock: ...
[Status] currentBlock: ...
[Validation] Found ... events in sample range.
[Live] Listening for new EnergyCharged events...
```

### 3. API 验证
执行以下命令调用后端接口：
```bash
# 获取全量记录
curl -s "http://localhost:3000/api/charges"

# 指定用户过滤
curl -s "http://localhost:3000/api/charges?user=0x123..."
```
**预期响应样例**:
```json
{
  "success": true,
  "data": [
    {
      "tx_hash": "0x7a2b9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
      "log_index": 42,
      "block_number": 88310135,
      "user": "0x123...",
      "token_amount": "1000000000000000000",
      "energy_credit": "10",
      "timestamp": 1707054000
    }
  ]
}
```

## 审计与回滚证据
- **BscScan 证据**: 对应的 LogIndex 42 已在 BscScan 上通过 [bscscan_logindex_42.png](docs/audit/bscscan_logindex_42.png) 验证。
- **Diff 基准命令**: `git diff --stat v0.1-charge-stable..v0.2-stable-final2`
- **运行态验证**: 执行 `npx ts-node scripts/listeners/energyCharged.listener.ts` 可查看状态打印与抽样扫描证据。
