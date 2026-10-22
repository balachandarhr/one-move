// Matchstick puzzles: start from true equations, apply every single-stick move that leaves a
// well-formed but FALSE equation, then let the solver count every way back to a true one.
const E = require('../js/engine.js');
const { R } = require('./lib.js');
function trueEquations() {
  const out = new Set();
  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
    if (a + b <= 9) out.add(`${a}+${b}=${a + b}`);
    if (a - b >= 0) out.add(`${a}-${b}=${a - b}`);
    if (a + b >= 10) out.add(`${a}+${b}=${a + b}`);
    if (a * b <= 99) out.add(`${a}x${b}=${a * b}`);
    for (let c = 0; c <= 9; c++) {
      if (a + b - c >= 0 && a + b - c <= 9) out.add(`${a}+${b}-${c}=${a + b - c}`);
      if (a - b + c >= 0 && a - b + c <= 9 && a - b >= 0) out.add(`${a}-${b}+${c}=${a - b + c}`);
      if (a + b + c <= 19) out.add(`${a}+${b}+${c}=${a + b + c}`);
    }
  }
  for (let a = 10; a <= 99; a++) for (let b = 0; b <= 9; b++) {
    if (a + b <= 99) out.add(`${a}+${b}=${a + b}`);
    if (a - b >= 0) out.add(`${a}-${b}=${a - b}`);
  }
  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 0; c <= 9; c++) for (let d = 0; d <= 9; d++)
    if (a + b === c + d && a !== c && a !== d && (a * 7 + b * 3 + c + d) % 5 === 0) out.add(`${a}+${b}=${c}+${d}`);
  return [...out];
}
function build(seed) {
  const rnd = R(seed), puzzles = new Map();
  for (const eq of trueEquations()) {
    const s = E.parse({ t: 'm', eq });
    for (const mv of E.moves(s)) {
      const n = E.apply(s, mv), txt = E.mText(n);
      if (!txt || txt === eq || puzzles.has(txt)) continue;
      const c = E.check(n);
      if (c.why !== 'false') continue; // must be a well-formed but false equation
      if (/x/.test(txt) !== /x/.test(eq)) continue;
      puzzles.set(txt, eq);
    }
  }
  const out = [];
  for (const [eq, from] of puzzles) {
    const lv = { t: 'm', eq };
    const v = E.verify(lv);
    if (v.solvedAtStart || v.solutions.length < 1 || v.solutions.length > 2) continue;
    const sol = v.solutions[0], s0 = E.parse(lv);
    const cross = sol.fp !== sol.tp, opInv = s0.pos[sol.fp].k === 'o' || s0.pos[sol.tp].k === 'o';
    const answer = E.mText(E.apply(s0, sol));
    // a change that only swaps an operator (e.g. + -> -) with the stick dropped into a digit is classic & fun
    let diff = eq.length * 1.2 + (cross ? 2.5 : 0) + (opInv ? 1.5 : 0) + (/x/.test(eq) ? 2 : 0) + (v.solutions.length === 1 ? 1.5 : 0)
      + (eq.replace(/\D/g, '').length - (eq.match(/\d+/g) || []).length) * 1.5 + rnd.f() * 1.5;
    out.push({ t: 'm', eq, diff: +diff.toFixed(2), sols: v.solutions.length, answer });
  }
  return out;
}
module.exports = { build };
if (require.main === module) {
  const all = build(7); console.log(all.length);
  all.sort((a, b) => a.diff - b.diff);
  console.log(all.slice(0, 15).map(l => `${l.eq} -> ${l.answer} d${l.diff} s${l.sols}`).join('\n'));
  console.log(all.slice(-8).map(l => `${l.eq} -> ${l.answer} d${l.diff} s${l.sols}`).join('\n'));
}
