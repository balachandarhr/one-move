// Slide puzzles: random rooms, keep only ones where the hero can't reach the exit yet and
// exactly 1-2 single crate slides open a path (solver = every crate x every direction).
const E = require('../js/engine.js');
const { R } = require('./lib.js');
function attempt(rnd, tier) {
  const W = rnd.i(5, tier < 2 ? 5 : 6), H = rnd.i(5, tier < 2 ? 6 : 7);
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const wallP = 0.16 + rnd.f() * 0.14;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rnd.chance(wallP)) g[y][x] = '#';
  if (tier >= 1 && rnd.chance(0.45)) { // a river the hero can't swim
    if (rnd.chance(0.5)) { const ry = rnd.i(1, H - 2); for (let x = 0; x < W; x++) g[ry][x] = '~'; }
    else { const rx = rnd.i(1, W - 2); for (let y = 0; y < H; y++) g[y][rx] = '~'; }
  }
  const nB = rnd.i(2 + tier, 4 + tier);
  const free = () => { for (let k = 0; k < 200; k++) { const x = rnd.i(0, W - 1), y = rnd.i(0, H - 1); if (g[y][x] === '.') return [x, y]; } return null; };
  for (let i = 0; i < nB; i++) { const p = free(); if (p) g[p[1]][p[0]] = 'B'; }
  const s = free(); if (!s) return null; g[s[1]][s[0]] = 'S';
  const e = free(); if (!e) return null; g[e[1]][e[0]] = 'E';
  if (Math.abs(s[0] - e[0]) + Math.abs(s[1] - e[1]) < 3 + tier) return null;
  const lv = { t: 'b', g: g.map(r => r.join('')) };
  const v = E.verify(lv);
  if (v.solvedAtStart || !v.solutions.length || v.solutions.length > 2) return null;
  if (v.moves < 4 + tier * 2) return null;
  const st = E.parse(lv), after = E.apply(st, v.solutions[0]), res = E.check(after);
  if (res.path.length < 5 + tier) return null;
  // every crate must be able to move (no decorative dead crates) – keeps the puzzle honest
  const movable = new Set(v.moves ? E.moves(st).map(m => m.x + ',' + m.y) : []);
  if (movable.size < Math.min(nB, 2 + tier)) return null;
  const sink = !!after.slide.sink;
  const diff = v.moves * 0.6 + res.path.length * 0.35 + (v.solutions.length === 1 ? 2 : 0) + W * H * 0.08 + (sink ? 1.5 : 0) + tier;
  return Object.assign(lv, { diff: +diff.toFixed(2), sols: v.solutions.length });
}
function build(seed, perTier) {
  const rnd = R(seed), out = [], seen = new Set();
  for (let tier = 0; tier < 4; tier++) {
    let n = 0, tries = 0;
    while (n < perTier && tries < 400000) {
      tries++;
      const lv = attempt(rnd, tier);
      if (!lv) continue;
      const k = lv.g.join('/'); if (seen.has(k)) continue; seen.add(k);
      out.push(lv); n++;
    }
  }
  return out;
}
module.exports = { build };
if (require.main === module) {
  console.time('b'); const all = build(11, 12); console.timeEnd('b'); console.log(all.length);
  for (const l of all.filter((_, i) => i % 6 === 0)) console.log(l.diff, l.sols, '\n' + l.g.join('\n'));
}
