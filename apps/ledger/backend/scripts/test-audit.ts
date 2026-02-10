import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000';
const ADMIN_TOKEN = 'secret_admin_token_123';
const USER_ID = 'u1';

async function testAudit() {
  console.log('--- Testing GET /admin/credits/audit ---');

  // 1. 正常审计
  const auditRes1 = await fetch(API_URL + '/admin/credits/audit?userId=' + USER_ID, {
    headers: { 'X-Admin-Token': ADMIN_TOKEN }
  });
  const audit1 = await auditRes1.json();
  console.log('Healthy Audit:', audit1);
  if (audit1.consistent === true) console.log('✅ PASS: System consistent.');

  // 2. 人为制造不一致 (直接操作 DB 余额)
  console.log('Manually breaking consistency in DB...');
  await prisma.creditBalance.update({
    where: { user_id_currency: { user_id: USER_ID, currency: 'CREDIT' } },
    data: { balance: { increment: 999n } }
  });

  // 3. 再次审计，预期不一致
  const auditRes2 = await fetch(API_URL + '/admin/credits/audit?userId=' + USER_ID, {
    headers: { 'X-Admin-Token': ADMIN_TOKEN }
  });
  const audit2 = await auditRes2.json();
  console.log('Inconsistent Audit:', audit2);
  if (audit2.consistent === false) {
    console.log('✅ PASS: Inconsistency detected.');
    console.log('Diff:', audit2.diff);
  }

  // 4. 执行重算修复
  console.log('Running recompute to fix...');
  await fetch(API_URL + '/admin/credits/recompute', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Token': ADMIN_TOKEN
    },
    body: JSON.stringify({ userId: USER_ID })
  });

  // 5. 验证修复后审计
  const auditRes3 = await fetch(API_URL + '/admin/credits/audit?userId=' + USER_ID, {
    headers: { 'X-Admin-Token': ADMIN_TOKEN }
  });
  const audit3 = await auditRes3.json();
  console.log('Post-fix Audit:', audit3);
  if (audit3.consistent === true) console.log('✅ PASS: System restored.');
}

testAudit().catch(console.error);
