# Lazy Gamer

## Brief

Build a browser-based idle town for Aashi (GitHub: aashi-dani/lazy-gamer). It introduces children to mathematical ideas through visual building hacks. Elementary school is the priority, with middle school supported and room for high school content. Onboard with Little Explorer (6–9), Challenger (10–13), or Mastermind (14–17), then let the player select one starter: Coconut Stall, Bike Shop, or Tuck Shop.

Buildings produce stock in real time (default two hours per batch), even while the game is closed, up to a storage cap. Tapping a building opens its production and collection controls. Sold stock earns coins for new buildings and upgrades. Save to versioned localStorage every five seconds and after significant actions. On reopening, show the stock made away. Provide difficulty, sound, and confirmed reset in settings, plus a phone-friendly lifetime coin chart and total codes cracked.

Ship configurable pure logic and three age bands for Multiplication Macro (arrays, instant batch and efficiency bonus), Area Optimizer (fixed fence, draggable rectangular plots, timed boost), and Fraction Slicer (equal slices, coin orders). Apply per-building cooldowns, friendly retries, and visual and optional sound rewards.

## Golden rules

- Player-facing text must avoid maths, math, lesson, quiz, homework, test, course, exercise, and learn.
- Use visual challenges with goals, friendly encouragement, and rewards. Never call an attempt wrong.
- No payments, ads, external links, chat, accounts, or collection of personal data.

## Design

Warm, rounded cartoon town with a navy/indigo night backdrop, gold coins, cyan hacks, lime growth, and coral building accents. Original SVG and CSS art, with a sleepy mascot. Press Start 2P for brief display text and Nunito for everything else. Gentle animation respects reduced motion. Audio starts muted. Design for 375px first with 44px controls, short copy, and clear tap interactions. Avoid retro arcade styling and generic dashboards.

## Implementation and release

React 18, TypeScript, Vite, Tailwind, Zustand persist, Recharts, and Vitest. All balance settings in `src/config/gameConfig.ts`. Use no server, database, or accounts. Include a web manifest and install icons. For later native stores, bundle the Vite build with Capacitor and validate persistence, offline behavior, and audio on real devices.

Phase order: setup, core economy and saves, town and onboarding, each cheat code, chart and polish with 375/768/1280px QA, then Vercel from GitHub. Commit at each checkpoint and run the brief's final checklist.

## Decisions

- The web project gets its own Git root inside the workspace to preserve the pre-existing Expo prototype and avoid touching the parent home-directory repository.
- Fonts are bundled locally. Browser operations stay on-device.

## Current status

- Phase 1: Vite scaffold, design tokens, Git root and intended origin configured.
- Phase 2: Versioned Zustand save, production, stock caps, sales, building unlocks, and upgrades implemented. Six economy and save tests pass.
- Phase 3: Onboarding, original town and shop art, stock controls, and Welcome Back dialog. Browser verified starter selection, a 48-coin sale across a reload, and four stock from a simulated four-hour absence.
- Phase 4a: Multiplication Macro includes generated crate arrays, efficient-move bonus, storage cap, cooldown, and shared celebration. Nine tests pass.
- Phase 4b: Area Optimizer adds a draggable fixed-fence plot, adjustable keyboard controls, a 10-minute boost and matching cooldown. Thirteen tests pass.
- Phase 4c: Fraction Slicer adds equal slices, equivalent orders, and bonus coins across all three difficulty tiers. Sixteen tests pass.
- Phase 5: Growth chart, settings, confirmed reset, generated chimes, reduced-motion styling, and install icons complete. Verified the town at exact 375px, 768px, and 1280px viewport widths, and the chart at 375px. Browser QA covered tab close/reopen, purchase and upgrade, all three rewards, easy/medium difficulty controls, fence dragging, and reset cancellation. A fresh game tab had zero console errors or warnings. The whole-project word scan found no prohibited player copy.
- Balance: Starting shops include one ready batch and a partially completed next batch. Cooldown is five minutes per shop for the Macro and Slicer, and ten for the Optimizer to match its boost duration. The strongest Optimizer boost is 3×.
