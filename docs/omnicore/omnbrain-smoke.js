// Runtime smoke runner for G6 OmniBrain EntropyForge (docs/omnicore/omnbrain-smoke.js)
const EE = require('./omnbrain-fix-out/entropy-forge.js');
const EntropyForge = EE.EntropyForge;

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

// 1. purify 向下相容
check('purify strip zero-width', EntropyForge.purify('a\u200Bb\u200Bc\u200B') === 'abc');
check('purify keep visible', EntropyForge.purify('  x \t\n') === '  x \t\n');

// 2. seal (Trustworthy)
const { sealed, event } = EntropyForge.seal({ a: 1, b: [1, 2] });
check('seal frozen', Object.isFrozen(sealed));
check('seal has hash_lock', typeof sealed.hash_lock === 'string' && sealed.hash_lock.length === 64);
check('seal event trace_id', typeof event.trace_id === 'string' && event.trace_id.startsWith('oid_'));

// 3. applyHashLock (Trackable)
const obj = { a: 1 };
const locked = EntropyForge.applyHashLock(obj, 'agent-9');
check('applyHashLock same ref', locked === obj);
check('applyHashLock frozen', Object.isFrozen(obj));
check('applyHashLock trace recorded', EntropyForge.traceEvents.length === 1);
check('applyHashLock trace origin', EntropyForge.traceEvents[0].source_origin === 'agent-9');

// 4. verifyHashLock (Transparent)
const v1 = EntropyForge.verifyHashLock(locked);
check('verify ok', v1.ok === true);
(() => {
  locked.a = 2;
  const v2 = EntropyForge.verifyHashLock(locked);
  check('verify tampered false', v2.ok === false);
})();

// 5. trace / getTraceEvents (Traceable)
EntropyForge.feedback('perf', 'agent-9', { ms: 12 });
const evs = EntropyForge.getTraceEvents();
check('trace len 2', evs.length === 2);
check('trace source_origin', evs[1].source_origin === 'agent-9');

// 6. feedback (Tangible)
const fb = EntropyForge.feedback('quality-gate', 'agent-9', { verdict: 'pass' });
check('feedback frozen', Object.isFrozen(fb));
check('feedback hash_lock', typeof fb.hash_lock === 'string' && fb.hash_lock.length === 64);

console.log(failures === 0 ? '\nALL GREEN' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
