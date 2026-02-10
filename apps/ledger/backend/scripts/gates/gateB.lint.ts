import { Gate, log, exitWithFail } from './utils';
import { execSync } from 'child_process';

export const gateB: Gate = {
  name: 'B',
  description: 'Lint Check',
  run: async () => {
    log('B', 'START', 'Running lint check...');
    try {
      // Assuming 'pnpm lint' or 'npm run lint' exists
      // Using npx eslint directly is safer if script name varies
      // But let's try pnpm lint first if pnpm-lock exists, else npm
      execSync('npm run lint', { stdio: 'inherit' });
      log('B', 'OK', 'Lint check passed');
    } catch (e) {
      exitWithFail('B', 'Lint check failed. Fix lint errors.');
    }
  }
};
