# Harder Bad Guys Design

**Date:** 2026-03-21
**Requested by:** Theo

## Overview

Two new mechanics to make bad guys harder to catch, gradually introduced across rounds.

## Feature 1: Zig-Zag + Flee

Bad guys get smarter movement patterns in later rounds.

| Round | Zig-zag? | Flee? | Flee speed | Detect range |
|-------|----------|-------|------------|-------------|
| 1 | No | No | — | — |
| 2 | No | No | — | — |
| 3 | Yes (800ms interval) | No | — | — |
| 4 | Yes (600ms interval) | Yes | 1.5x normal | 150px |
| 5 | Yes (400ms interval) | Yes | 1.8x normal | 200px |

- **Zig-zag**: More frequent direction changes with sharper angles
- **Flee**: In update loop, if car is within detect range, bad guy moves directly away from car at flee speed. Returns to zig-zag/wander when car is far enough away.

## Feature 2: Wiggle & Slow Down

Caught bad guys struggle while being carried to jail.

| Round | Wiggle? | Speed penalty |
|-------|---------|--------------|
| 1 | No | None (100%) |
| 2 | Mild (small sway) | 90% speed |
| 3 | Medium (wider sway) | 85% speed |
| 4 | Strong (fast sway) | 80% speed |
| 5 | Intense (wild sway) | 75% speed |

- **Wiggle visual**: Repeating rotation tween on caught bad guy, intensity scales with round
- **Speed penalty**: Car speed reduced by multiplier while carrying. Full speed returns on jail delivery.
- Wiggle tween destroyed on delivery.

## Implementation Scope

**Config changes** — new fields per round in `CONFIG.ROUNDS[]`:
- `zigZag`, `zigZagInterval`
- `fleeEnabled`, `fleeSpeed`, `fleeRange`
- `wiggleIntensity`, `carrySpeedPenalty`

**Code changes:**
- `config.js` — add new fields to each round config
- `GameScene.js` — modify `startWander()`, add flee logic in `update()`, add wiggle tween in `catchBadGuy()`, apply speed penalty while carrying

No new files, scenes, or assets.
