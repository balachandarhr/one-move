// Rescue puzzles (remove ONE plank). Build a side-view scene from parts (spike pits, monsters,
// plank gates, boulders held up by planks, ledges), then simulate removing each plank in turn.
// Keep scenes that fail untouched, are settled at the start and have exactly 1-2 rescuing planks.
const E = require('../js/engine.js');
const { R } = require('./lib.js');
function attempt(rnd, tier) {
  const W = rnd.i(7, tier < 2 ? 8 : 9), H = rnd.i(6, tier < 2 ? 7 : 8), wr = H - 2;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (let x = 0; x < W; x++) g[H - 1][x] = '#';
  const taken = new Set();
  let hx = rnd.i(0, 1), gx = W - 1 - rnd.i(0, 1), d = 1;
  if (tier >= 2 && rnd.chance(0.3)) { gx = 0; hx = rnd.i(2, 3); } // door behind the hero: he must be turned round
  let hy = wr;
  if (rnd.chance(0.3)) { // hero starts on a ledge
    const ly = rnd.i(1, wr - 2), lx2 = Math.min(W - 3, hx + rnd.i(1, 3));
    for (let x = Math.max(0, hx - 1); x <= lx2; x++) { g[ly + 1][x] = rnd.chance(tier >= 1 ? 0.3 : 0) ? 'w' : '#'; taken.add(x); }
    hy = ly;
  }
  taken.add(hx); taken.add(gx);
  g[wr][gx] = 'G';
  const cols = rnd.shuffle([...Array(W).keys()].filter(x => !taken.has(x)));
  const nProb = rnd.i(1, tier >= 2 ? 3 : 2), nOver = rnd.i(1, 2 + tier);
  const probs = [];
  for (let i = 0; i < nProb && cols.length; i++) {
    const x = cols.pop(), t = rnd.pick(tier === 0 ? ['pit', 'gate', 'pit'] : ['pit', 'monster', 'gate', 'floor', 'pit']);
    if (t === 'pit') g[H - 1][x] = '^';
    if (t === 'monster') g[wr][x] = 'M';
    if (t === 'gate') { g[wr][x] = 'w'; if (rnd.chance(0.5)) for (let y = wr - 1; y >= wr - rnd.i(1, 2); y--) g[y][x] = '#'; }
    if (t === 'floor') g[H - 1][x] = 'w';
    probs.push(x);
  }
  const overCols = rnd.shuffle([...Array(W).keys()].filter(x => x !== gx));
  for (let i = 0; i < nOver && overCols.length; i++) {
    const x = overCols.pop();
    let top = 0; while (top < H && g[top][x] === '.') top++; // first non-air from the top
    const lowest = Math.min(top - 2, (x === hx ? hy : wr) - 2);
    if (lowest < 1) continue;
    const py = rnd.i(1, lowest);
    if (g[py][x] !== '.' || g[py - 1][x] !== '.') continue;
    g[py][x] = 'w'; g[py - 1][x] = 'o';
    if (rnd.chance(0.25) && py - 2 >= 0 && tier >= 1) g[py - 2][x] = 'o';
    if (rnd.chance(0.4)) { const sx = x + rnd.pick([-1, 1]); if (sx >= 0 && sx < W && g[py][sx] === '.' && sx !== hx) g[py][sx] = '#'; }
  }
  g[hy][hx] = 'H';
  const lv = { t: 's', d, g: g.map(r => r.join('')) };
  if (!E.sSettled(lv)) return null;
  const v = E.verify(lv);
  if (v.solvedAtStart || !v.solutions.length || v.solutions.length > 2) return null;
  if (v.moves < 2 + Math.min(tier, 2)) return null;
  const st = E.parse(lv), base = E.check(st), res = E.check(E.apply(st, v.solutions[0]));
  if (base.frames.length < 3) return null;
  const usesFall = res.frames.some(f => f.falls.length);
  const turns = res.frames.filter(f => f.ev === 'turn').length;
  const diff = v.moves * 1.1 + (usesFall ? 2 : 0) + turns * 2 + (v.solutions.length === 1 ? 1 : 0) + res.frames.length * 0.08 + tier;
  return Object.assign(lv, { diff: +diff.toFixed(2), sols: v.solutions.length });
}
function build(seed, perTier) {
  const rnd = R(seed), out = [], seen = new Set();
  for (let tier = 0; tier < 4; tier++) {
    let n = 0, tries = 0;
    while (n < perTier && tries < 400000) { tries++; const lv = attempt(rnd, tier); if (!lv) continue; const kk = lv.g.join('/'); if (seen.has(kk)) continue; seen.add(kk); out.push(lv); n++; }
  }
  return out;
}
module.exports = { build };
if (require.main === module) {
  console.time('s'); const all = build(31, 12); console.timeEnd('s'); console.log(all.length);
  for (const l of all.filter((_, i) => i % 6 === 0)) { const v = E.verify(l); console.log(l.diff, l.sols, JSON.stringify(v.solutions), '\n' + l.g.join('\n')); }
}
