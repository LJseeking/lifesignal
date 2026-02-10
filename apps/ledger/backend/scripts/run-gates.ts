import { Gate } from './gates/utils';
import { gateA } from './gates/gateA.build_boot';
import { gateB } from './gates/gateB.lint';
import { gateC } from './gates/gateC.smoke';
import { gateD } from './gates/gateD.migrate';

const ALL_GATES: Record<string, Gate> = {
  A: gateA,
  B: gateB,
  C: gateC,
  D: gateD,
  // E was removed, replaced by C
};

async function main() {
  const requestedGatesStr = process.env.GATES || 'A,B,C,D';
  const requestedGates = requestedGatesStr.split(',').map(s => s.trim().toUpperCase());

  console.log(`\n🚀 Starting Gate Checks: ${requestedGates.join(', ')}\n`);

  for (const gateName of requestedGates) {
    const gate = ALL_GATES[gateName];
    if (!gate) {
      console.warn(`[WARN] Gate ${gateName} not found or not implemented. Skipping.`);
      continue;
    }

    try {
      await gate.run();
    } catch (e) {
      // Should be handled inside gate.run(), but double safety
      console.error(`\n❌ [GATE ${gateName}] Unhandled Exception:`, e);
      process.exit(1);
    }
  }

  console.log('\n✨ All Requested Gates Passed!\n');
}

main().catch(e => {
  console.error('Fatal Error:', e);
  process.exit(1);
});
