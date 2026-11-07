/**
 * CLI for the index reconciliation logic in src/services/indexSync.service.js.
 *
 *   node scripts/sync-indexes.mjs           # dry run
 *   node scripts/sync-indexes.mjs --apply   # make the changes
 *
 */

import 'dotenv/config';
import { syncIndexes } from '../src/services/indexSync.service.js';

const APPLY = process.argv.includes('--apply');

syncIndexes({ apply: APPLY })
    .then(({ ok, created, rebuilt, failed }) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`${ok} already correct, ${created} to create, ${rebuilt} to rebuild${failed ? `, ${failed} FAILED` : ''}`);
        if (!APPLY && (created || rebuilt)) console.log('Re-run with --apply to make these changes.');
        if (failed) process.exitCode = 1;
    })
    .catch((e) => {
        console.error('index sync error:', e.message);
        process.exitCode = 1;
    });
