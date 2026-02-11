import path from 'path';

// 数据库文件路径 (存储在项目根目录)
const DB_PATH = path.join(process.cwd(), 'charges.sqlite');

let dbInstance: any = null;

try {
  // 动态导入以避免构建时强制依赖 native bindings
  const Database = require('better-sqlite3');
  dbInstance = new Database(DB_PATH);
  
  // 初始化表结构
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_hash TEXT NOT NULL,
      log_index INTEGER NOT NULL,
      block_number INTEGER NOT NULL,
      user TEXT NOT NULL,
      token_amount TEXT NOT NULL,
      energy_credit TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      UNIQUE(tx_hash, log_index)
    );
    
    CREATE INDEX IF NOT EXISTS idx_charges_user ON charges(user);
    CREATE INDEX IF NOT EXISTS idx_charges_timestamp ON charges(timestamp DESC);
    
    -- 稳定性迁移：确保复合唯一索引存在 (防止旧版本只有 tx_hash 唯一)
    CREATE UNIQUE INDEX IF NOT EXISTS charges_unique_tx_log ON charges(tx_hash, log_index);
  `);
} catch (error) {
  console.warn("Failed to initialize SQLite database (likely in Vercel/Serverless environment). Using Mock DB.", error);
  // Mock DB for read-only environments
  dbInstance = {
    prepare: () => ({
      run: () => ({ changes: 0, lastInsertRowid: 0 }),
      get: () => null,
      all: () => []
    }),
    exec: () => {},
    transaction: (fn: any) => fn,
  };
}

const db = dbInstance;

export interface ChargeRecord {
  id?: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  user: string;
  token_amount: string;
  energy_credit: string;
  timestamp: number;
}

export const chargeDb = {
  // 插入充能记录
  insertCharge: (record: ChargeRecord) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO charges (tx_hash, log_index, block_number, user, token_amount, energy_credit, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      record.tx_hash,
      record.log_index,
      record.block_number,
      record.user,
      record.token_amount,
      record.energy_credit,
      record.timestamp
    );
  },

  // 获取所有记录 (带分页)
  getCharges: (limit = 20, offset = 0, user?: string) => {
    let query = 'SELECT * FROM charges';
    const params: any[] = [];

    if (user && user.trim() !== '') {
      query += ' WHERE user = ?';
      params.push(user.toLowerCase());
    }

    // 默认排序：按区块高度倒序，同一区块按日志索引倒序
    query += ' ORDER BY block_number DESC, log_index DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params) as ChargeRecord[];
  },

  // 获取记录总数
  getChargesCount: (user?: string) => {
    let query = 'SELECT COUNT(*) as count FROM charges';
    const params: any[] = [];

    if (user && user.trim() !== '') {
      query += ' WHERE user = ?';
      params.push(user.toLowerCase());
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  },

  // 获取最新同步到的区块号 (用于补录)
  getLatestBlockNumber: () => {
    const result = db.prepare('SELECT MAX(block_number) as lastBlock FROM charges').get() as { lastBlock: number | null };
    return result.lastBlock || 0;
  }
};

export default db;
