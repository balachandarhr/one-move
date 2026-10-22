# ONE MOVE

A mobile-first web puzzle game: every level gives you exactly **one move**. Presented by BALA HR.

Play: https://balachandarhr.github.io/one-move/

- 150 levels in 6 worlds, four puzzle types: Matchsticks, Slide (crates), Bounce (mirrors) and Rescue (remove one plank).
- Every move is checked by simulation (`js/engine.js`), so any valid one-move answer counts.
- Vanilla JS + canvas, no external requests, no tracking. Progress is saved in `localStorage` on the device.
- Coins are game points with no cash value; used for hints and colour themes.

## Levels

```
node tools/build-levels.js   # seeded generator + solver -> js/levels.js
node tools/verify.js         # every level: not solved at start, >=1 one-move solution
```
