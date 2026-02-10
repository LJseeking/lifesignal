import { Gate, log, exitWithFail } from './utils';
import { spawn } from 'child_process';
import * as path from 'path';

export const gateC: Gate = {
  name: 'C',
  description: 'Smoke Test (Integration)',
  run: async () => {
    log('C', 'START', 'Running smoke tests...');

    return new Promise((resolve, reject) => {
      // Locate scripts/smoke.ts relative to this file
      // __dirname is backend/scripts/gates
      // target is backend/scripts/smoke.ts
      const scriptPath = path.resolve(__dirname, '../smoke.ts');
      
      // Use ts-node to run the script
      const child = spawn('npx', ['ts-node', scriptPath], {
        stdio: 'inherit',
        env: { ...process.env }
      });

      child.on('close', (code) => {
        if (code === 0) {
          log('C', 'OK', 'Smoke tests passed');
          resolve();
        } else {
          exitWithFail('C', `Smoke tests failed with exit code ${code}`);
        }
      });

      child.on('error', (err) => {
        exitWithFail('C', `Failed to spawn smoke test: ${err.message}`);
      });
    });
  }
};
