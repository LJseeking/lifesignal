// Gate Interface and Utils

export interface Gate {
  name: string;
  description: string;
  run(): Promise<void>;
}

export function log(gateName: string, status: 'START' | 'OK' | 'FAIL', message?: string) {
  const timestamp = new Date().toISOString();
  let color = '\x1b[0m'; // Reset
  if (status === 'START') color = '\x1b[36m'; // Cyan
  if (status === 'OK') color = '\x1b[32m'; // Green
  if (status === 'FAIL') color = '\x1b[31m'; // Red

  console.log(`${color}[GATE ${gateName}] ${status}\x1b[0m${message ? `: ${message}` : ''}`);
}

export function exitWithFail(gateName: string, error?: any) {
  log(gateName, 'FAIL', error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}
