# Evidence Bundle: coin-cathedral-complete

## Summary

- Overall status: PASS
- Evidence refreshed: 2026-09-14 (iteration-005-evidence)
- Mandatory gates: `pnpm test` 8/8; `pnpm build` PASS; `/Coin/` build PASS; `pnpm test:e2e` 9/9 in 1.7m.
- Browser capture: WebGL 2 at `1440×900`, `1440×1100`, `320×900`, `375×900`, `414×900`, and `768×900`; every trace has zero page/console errors and no document overflow.

## Acceptance criteria evidence

### AC1 — PASS

- `raw/e2e.txt`: real WebGL tutorial, first-creature purification/production, four cannon assembly hits, eight player moon hits, and victory settlement all pass.
- `raw/viewport-1440x900.png` and `raw/viewport-1440x1100.png`: fresh full-screen cannon-area captures without outer-page chrome.

### AC2 — PASS

- `raw/e2e.txt`: tutorial movement remains locked until three real machine ray hits and an actual `B` open; then `W/A/D`, wall blocking, creature hits, and all six touch equivalents pass.
- `raw/unit-test.txt`: tutorial gate and deterministic grid movement/blocking pass.

### AC3 — PASS

- `raw/unit-test.txt`: 13-node connected topology, turns/movement/blocking/end-area gate, distinct creature producers, and permanent purification pass.
- `raw/viewport-trace.json`: late-game state contains 13 visited/cleared rooms and five sanctuaries including the start refuge.

### AC4 — PASS

- `raw/unit-test.txt`: volley, power, and rate upgrades alter the shot rules; power reduces hits-to-purify.
- `raw/e2e.txt`: real machine/creature hits and the acquired-abilities `B` flow pass; runtime HUD and machine plaques read the rule state.

### AC5 — PASS

- `raw/unit-test.txt`: three creature classes have distinct thresholds, products, rates, and automatic post-purification production.
- `raw/e2e.txt` and `raw/viewport-trace.json`: real first producer increases silver; late state exposes all producer IDs and rates of 3.20 silver, 0.24 water, and 0.16 crosses per second.

### AC6 — PASS

- `raw/unit-test.txt`: defeat returns to the nearest sanctuary, removes exactly 20% of expedition gains, and preserves every permanent progression field.

### AC7 — PASS

- `raw/unit-test.txt`: coarse/fine production equivalence, large-step cap, pause/`B` freeze, and a three-resource 6,000-second (100-minute) deterministic completion strategy pass.
- `raw/e2e.txt`: active production grows while `B`, pause, reload, and blur do not add production.

### AC8 — PASS

- `raw/e2e.txt`: four real canvas hits advance `cannonStage` to 4, then eight player moon hits advance `moonStage` to 2 and show “月亮已经沉默”.
- `raw/viewport-1440x900.png` and `raw/viewport-1440x1100.png`: fresh cannon-area captures show cannon targeting and all three resource gates.

### AC9 — PASS

- `raw/unit-test.txt`: versioned state round-trip covers location, resources, producers, rooms, upgrades, story and effective time; corrupt/old saves are rejected.
- `raw/e2e.txt`: reload requires explicit continue without offline gain; `B`, pause, blur, and WebGL context loss freeze state and show recoverable overlays.

### AC10 — PASS

- `raw/e2e.txt`: four required narrow widths, both desktop heights, reduced-motion, mute, WebGL loss, and zero-error assertions pass.
- `raw/viewport-trace.json`: all six captures report WebGL2, exact document/viewport dimensions, six visible touch controls, and `errors: []`.
- `raw/viewport-*.png`: fresh visual captures show readable HUD, reticle, touch controls, and the dark low-poly cathedral treatment without flashing or jump-scare UI.

### AC11 — PASS

- `raw/unit-test.txt`: 8/8 unit tests pass.
- `raw/build-standard.txt`: TypeScript and Vite production build pass.
- `raw/e2e.txt`: 9/9 Playwright tests pass.
- `raw/build-pages.txt` and `raw/pages-index.html`: `/Coin/` build passes and all emitted icon/script/style references use the `/Coin/` base.
- `README.md` and `GAME_DESIGN.md` document controls, topology, production, 20% defeat loss, save/freeze behavior, 100-minute strategy, and player-fired finale.

## Commands run

- `pnpm test` → PASS (8/8)
- `pnpm build` → PASS
- `$env:PAGES_BASE_PATH='/Coin/'; pnpm build; Remove-Item Env:PAGES_BASE_PATH` → PASS
- `pnpm test:e2e -- --output=.agent/deadline-carl-scratch/coin-cathedral-complete/iteration-005-evidence/playwright-output` → PASS (9/9)
- `node .agent/deadline-carl-scratch/coin-cathedral-complete/iteration-005-evidence/capture-evidence.mjs` → PASS (six screenshots plus state trace)

## Raw artifacts

- `raw/unit-test.txt`
- `raw/build-standard.txt`
- `raw/build-pages.txt`
- `raw/pages-index.html`
- `raw/e2e.txt`
- `raw/viewport-trace.json`
- `raw/viewport-1440x900.png`
- `raw/viewport-1440x1100.png`
- `raw/viewport-320x900.png`
- `raw/viewport-375x900.png`
- `raw/viewport-414x900.png`
- `raw/viewport-768x900.png`

## Known gaps

- None.
