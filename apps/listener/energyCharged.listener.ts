import { ethers } from 'ethers';
import { chargeDb, ChargeRecord } from '../../src/lib/db/charge.db';
import { CONTRACT_ADDRESSES, BSC_TESTNET_CONFIG } from '../../src/lib/web3/config';
import { ENERGY_VAULT_ABI } from '../../src/lib/web3/abis';

// 配置
const RPC_URL = BSC_TESTNET_CONFIG.rpcUrls.default.http[0];
const VAULT_ADDRESS = CONTRACT_ADDRESSES.ENERGY_VAULT;
const START_BLOCK = 88300000; // 调整为更近的区块以适应公共 RPC 节点限制

async function main() {
  console.log('--- Life Signal EnergyCharged Listener Starting ---');
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Vault: ${VAULT_ADDRESS}`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  const contract = new ethers.Contract(VAULT_ADDRESS, ENERGY_VAULT_ABI, provider);

  const lastSavedBlock = chargeDb.getLatestBlockNumber();
  // Reorg safety: 从最后保存区块的前 20 个开始扫，防止分叉导致丢事件
  const fromBlock = lastSavedBlock > 0 ? Math.max(START_BLOCK, lastSavedBlock - 20) : START_BLOCK;
  const currentBlock = await provider.getBlockNumber();

  console.log(`--- Life Signal EnergyCharged Listener Starting ---`);
  console.log(`[Network] Name: ${network.name}, ChainId: ${network.chainId}`);
  console.log(`[Time] ISO Timestamp: ${new Date().toISOString()}`);
  console.log(`[Note] 以上时间戳反映了当前测试/运行的即时时间。`);
  console.log(`[Status] lastSavedBlock: ${lastSavedBlock}`);
  console.log(`[Status] fromBlock: ${fromBlock}`);
  console.log(`[Status] currentBlock: ${currentBlock}`);

  const latestRecord = chargeDb.getCharges(1, 0)[0];
  if (latestRecord) {
    console.log(`[Status] Latest DB Record: TX=${latestRecord.tx_hash}, Block=${latestRecord.block_number}, LogIndex=${latestRecord.log_index}`);
  } else {
    console.log(`[Status] No records in DB yet.`);
  }

  // 1. Catch-up 模式: 补录历史事件
  if (fromBlock <= currentBlock) {
    console.log(`[Catch-up] Fetching historical events from block ${fromBlock} to ${currentBlock}...`);
    
    // 每次查询 5000 个区块，防止 RPC 超时
    const step = 5000;
    for (let i = fromBlock; i <= currentBlock; i += step) {
      const to = Math.min(i + step - 1, currentBlock);
      const filter = contract.filters.EnergyCharged();
      const events = await contract.queryFilter(filter, i, to);
      
      console.log(`[Catch-up] Block ${i} to ${to}: Found ${events.length} events`);
      
      for (const event of events) {
        // 移除 instanceof 校验，确保所有有效事件被处理
        if ('transactionHash' in event && (event as any).args) {
          await processEvent(event);
        }
      }
    }
  }

  // 1.5 抽样扫描验证 (最近 5000 个区块)
  const sampleFrom = Math.max(START_BLOCK, currentBlock - 5000);
  console.log(`[Validation] Performing sample scan from block ${sampleFrom} to ${currentBlock}...`);
  const sampleEvents = await contract.queryFilter(contract.filters.EnergyCharged(), sampleFrom, currentBlock);
  console.log(`[Validation] Found ${sampleEvents.length} events in sample range.`);
  if (sampleEvents.length > 0) {
    const e = sampleEvents[0] as any;
    console.log(`[Validation] Sample Event Evidence:`);
    console.log(`  - TX: ${e.transactionHash}`);
    console.log(`  - Block: ${e.blockNumber}`);
    console.log(`  - LogIndex: ${e.logIndex ?? e.index}`);
    console.log(`  - User: ${e.args.user}`);
    console.log(`  - TokenAmount: ${e.args.tokenAmount.toString()}`);
    console.log(`  - EnergyCredit: ${e.args.energyCredit.toString()}`);
  }

  // 2. Live 模式: 监听新事件
  console.log('[Live] Listening for new EnergyCharged events...');
  contract.on(contract.filters.EnergyCharged(), async (...args) => {
    // args: [user, tokenAmount, energyCredit, event]
    const event = args[args.length - 1];
    console.log(`[Live] New event detected in tx: ${event.transactionHash}`);
    await processEvent(event);
  });
}

// 处理单个事件并写入数据库
async function processEvent(event: any) {
  try {
    const txHash = event.transactionHash;
    const blockNumber = event.blockNumber;
    
    /**
     * logIndex 对齐修正：
     * 1. 优先使用 event.logIndex (ethers v6 标准链上索引)
     * 2. 如果不存在，打印警告并 Fallback 到 event.index (不保证 100% 等价)
     */
    let logIndex: number;
    if (event.logIndex !== undefined && event.logIndex !== null) {
      logIndex = Number(event.logIndex);
    } else {
      console.warn(`⚠️ [Warning] Missing 'logIndex' for tx: ${txHash} at block ${blockNumber}. Fallback to 'index': ${event.index}.`);
      if (event.index === undefined || event.index === null) {
        throw new Error(`Critical: Both 'logIndex' and 'index' are missing for tx: ${txHash}`);
      }
      logIndex = Number(event.index);
    }
    
    // 获取区块时间戳
    const block = await event.getBlock();
    const timestamp = block.timestamp;

    // 解析参数 (注意 ethers v6 的 args 处理)
    const { user, tokenAmount, energyCredit } = event.args;

    const record: ChargeRecord = {
      tx_hash: txHash,
      log_index: logIndex,
      block_number: blockNumber,
      user: user.toLowerCase(),
      token_amount: tokenAmount.toString(),
      energy_credit: energyCredit.toString(),
      timestamp: timestamp,
    };

    const result = chargeDb.insertCharge(record);
    if (result.changes > 0) {
      console.log(`✅ Saved Charge: User=${user}, Amount=${ethers.formatUnits(tokenAmount, 18)} SIGNAL, Credits=${energyCredit} (LogIndex: ${logIndex})`);
    } else {
      console.log(`ℹ️ Charge already exists: ${txHash} (LogIndex: ${logIndex})`);
    }
  } catch (error) {
    console.error('❌ Error processing event:', error);
  }
}

main().catch((error) => {
  console.error('Fatal error in listener:', error);
  process.exit(1);
});
