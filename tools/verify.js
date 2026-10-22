// Verifies every level: parses, is NOT solved at the start, and has at least one valid single move
// that the simulator accepts. Also replays each solution through engine.apply/check to be sure.
const E = require('../js/engine.js');
const D = require('../js/levels.js');
let fail = 0; const stats = { m: [0, 0, 0], b: [0, 0, 0], r: [0, 0, 0], s: [0, 0, 0] }, solHist = {};
for (const l of D.levels) {
  let v;
  try { v = E.verify(l); } catch (e) { console.log('L' + l.id, 'ERROR', e.message); fail++; continue; }
  const probs = [];
  if (v.solvedAtStart) probs.push('already solved at start');
  if (!v.solutions.length) probs.push('no one-move solution');
  if (l.t === 's' && !E.sSettled(l)) probs.push('not settled');
  for (const s of v.solutions) { const n = E.apply(E.parse(l), s); if (!n || !E.check(n).ok) probs.push('solution replay failed'); }
  // a wrong move must actually fail (spot-check: all non-solutions)
  const keys = new Set(v.solutions.map(E.key)); let wrong = 0;
  for (const mv of E.moves(E.parse(l))) if (!keys.has(E.key(mv))) { const n = E.apply(E.parse(l), mv); if (n && E.check(n).ok) probs.push('inconsistent'); wrong++; }
  stats[l.t][0]++; stats[l.t][1] += v.solutions.length; stats[l.t][2] += v.moves;
  solHist[v.solutions.length] = (solHist[v.solutions.length] || 0) + 1;
  if (probs.length) { fail++; console.log('L' + l.id, l.t, probs.join('; ')); }
}
const ids = D.levels.map(l => l.id); if (new Set(ids).size !== ids.length) { console.log('duplicate ids'); fail++; }
for (const t in stats) console.log(t, 'levels', stats[t][0], 'avg solutions', (stats[t][1] / stats[t][0]).toFixed(2), 'avg legal moves', (stats[t][2] / stats[t][0]).toFixed(1));
console.log('solution-count histogram', JSON.stringify(solHist));
console.log(fail ? `FAIL: ${fail} level(s) with problems` : `PASS: all ${D.levels.length} levels have >=1 one-move solution and none is solved at start`);
process.exit(fail ? 1 : 0);
