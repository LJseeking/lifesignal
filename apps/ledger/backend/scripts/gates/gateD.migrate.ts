import { Gate, log, exitWithFail } from './utils';
import { execSync } from 'child_process';

export const gateD: Gate = {
  name: 'D',
  description: 'DB Migration Check',
  run: async () => {
    log('D', 'START', 'Checking DB migration status...');
    try {
      // Check if schema matches DB
      execSync('npx prisma migrate status', { stdio: 'inherit' });
      log('D', 'OK', 'DB is in sync with migrations');
    } catch (e) {
      exitWithFail('D', 'DB migration check failed. Run "npx prisma migrate deploy" to fix.');
    }
  }
};
