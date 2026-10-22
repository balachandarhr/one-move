// Bounce puzzles: build a working laser-style path (launcher -> mirrors -> target), add bolted /
// decoy mirrors and walls, then break it with ONE change (turn a mirror, or move a free mirror away).
// The solver then counts every single move (turn any movable mirror / drag any free mirror to any
// empty square) that gets the ball home; we keep levels with 1-2 answers.
const E = require('../js/engine.js');
const { R } = require('./lib.js');
const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const LCH = { '1,0': '>', '-1,0': '<', '0,-1': '^', '0,1': 'v' };
function mirrorFor(din, dout) { // '/' maps (dx,dy)->(-dy,-dx)
  return (-din[1] === dout[0] && -din[0] === dout[1]) ? '/' : '\\';
}
function attempt(rnd, tier) {
  const W = rnd.i(5, tier < 2 ? 6 : 7), H = rnd.i(6, tier < 2 ? 7 : 8);
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const used = new Set(), k = (x, y) => x + ',' + y;
  // launcher on an edge, pointing inwards
  const side = rnd.i(0, 3); let x, y, d;
  if (side === 0) { x = 0; y = rnd.i(0, H - 1); d = [1, 0]; } else if (side === 1) { x = W - 1; y = rnd.i(0, H - 1); d = [-1, 0]; }
  else if (side === 2) { x = rnd.i(0, W - 1); y = 0; d = [0, 1]; } else { x = rnd.i(0, W - 1); y = H - 1; d = [0, -1]; }
  g[y][x] = LCH[d.join(',')]; used.add(k(x, y));
  const bounces = rnd.i(1 + Math.min(tier, 2), 2 + tier), pathMirrors = [];
  for (let b = 0; b <= bounces; b++) {
    const len = rnd.i(1, 4);
    for (let s = 0; s < len; s++) {
      const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || used.has(k(nx, ny))) return null;
      x = nx; y = ny; used.add(k(x, y));
    }
    if (b === bounces) { g[y][x] = 'T'; break; }
    const turn = rnd.chance(0.5) ? 1 : -1, nd = [d[1] * turn, -d[0] * turn];
    const m = mirrorFor(d, nd); g[y][x] = m; pathMirrors.push([x, y, m]); d = nd;
  }
  // decoration: walls & decoy mirrors off the path
  const empties = () => { const e = []; for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (g[yy][xx] === '.' && !used.has(k(xx, yy))) e.push([xx, yy]); return rnd.shuffle(e); };
  let em = empties(), nWall = rnd.i(1, 3 + tier), nDecoy = rnd.i(1, 1 + tier);
  for (let i = 0; i < nWall && em.length; i++) { const [a, b] = em.pop(); g[b][a] = '#'; }
  for (let i = 0; i < nDecoy && em.length; i++) { const [a, b] = em.pop(); g[b][a] = rnd.chance(0.5) ? '/' : '\\'; }
  // kinds: early tiers turn-only pivots; later free mirrors that can also be dragged
  const kind = () => tier === 0 ? (rnd.chance(0.8) ? 'pivot' : 'fixed') : tier === 1 ? rnd.pick(['pivot', 'pivot', 'free', 'fixed']) : rnd.pick(['free', 'free', 'pivot', 'fixed']);
  const code = (m, kd) => ({ free: m === '/' ? 'a' : 'b', pivot: m === '/' ? 'c' : 'd', fixed: m === '/' ? 'e' : 'f' })[kd];
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (g[yy][xx] === '/' || g[yy][xx] === '\\') g[yy][xx] = code(g[yy][xx], kind());
  // break it with one move
  const movable = pathMirrors.filter(([a, b]) => E.MIR[g[b][a]][1] !== 'fixed');
  if (!movable.length) return null;
  const [bx, by] = rnd.pick(movable), c = g[by][bx], FL = { a: 'b', b: 'a', c: 'd', d: 'c' };
  if (E.MIR[c][1] === 'free' && rnd.chance(0.6)) {
    em = empties(); if (!em.length) return null; const [tx, ty] = em.pop(); g[by][bx] = '.'; g[ty][tx] = c;
  } else g[by][bx] = FL[c];
  const lv = { t: 'r', g: g.map(r => r.join('')) };
  const v = E.verify(lv);
  if (v.solvedAtStart || !v.solutions.length || v.solutions.length > 2) return null;
  const st = E.parse(lv), first = E.check(st);
  if (first.path.length < 3) return null; // the failing shot should show something
  const res = E.check(E.apply(st, v.solutions[0]));
  const nM = res.path.filter(p => p.m).length;
  if (nM < Math.min(1 + tier, 3)) return null;
  const hasMove = v.solutions.some(s => s.op === 'move');
  const diff = nM * 1.6 + v.moves * 0.04 + (hasMove ? 2.5 : 0) + (v.solutions.length === 1 ? 1 : 0) + W * H * 0.05 + tier * 1.5;
  return Object.assign(lv, { diff: +diff.toFixed(2), sols: v.solutions.length });
}
function build(seed, perTier) {
  const rnd = R(seed), out = [], seen = new Set();
  for (let tier = 0; tier < 4; tier++) {
    let n = 0, tries = 0;
    while (n < perTier && tries < 300000) { tries++; const lv = attempt(rnd, tier); if (!lv) continue; const kk = lv.g.join('/'); if (seen.has(kk)) continue; seen.add(kk); out.push(lv); n++; }
  }
  return out;
}
module.exports = { build };
if (require.main === module) {
  console.time('r'); const all = build(23, 12); console.timeEnd('r'); console.log(all.length);
  for (const l of all.filter((_, i) => i % 8 === 0)) console.log(l.diff, l.sols, '\n' + l.g.join('\n'));
}
