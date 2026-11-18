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

Warm, rounded cartoon town with a navy/indigo night backdrop, gold coins, cyan hacks, lime growth, and coral building accents. Original SVG and CSS art, with a sleepy mascot. Press Start 2P for brief display text and Nunito for everything else. Gentle animation respects reduced motion. Audio starts after a player gesture and respects the saved mute setting. Design for 375px first with 44px controls, short copy, and clear tap interactions. Avoid retro arcade styling and generic dashboards.

## Implementation and release

React 18, TypeScript, Vite, Tailwind, Zustand persist, Recharts, and Vitest. All balance settings in `src/config/gameConfig.ts`. Keep gameplay data on the device without a backend or accounts. Include a web manifest and install icons. For later native stores, bundle the Vite build with Capacitor and validate persistence, offline behavior, and audio on real devices.

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
- Phase 6: All 16 Vitest tests pass and the production build completed with zero TypeScript or Vite warnings. The source archive from commit `ae2ca21` was deployed to the existing Vercel project at [lazygamer.vercel.app](https://lazygamer.vercel.app/). An unauthenticated request returned HTTP 200. At 375 × 812 CSS pixels, closing and reopening the public URL restored the Coconut Stall and the 123-coin balance.
- GitHub: All phase commits were pushed to `aashi-dani/Lazy-Gamer` on `main` using the owner's existing SSH key. The linked Vercel project reported the Git-triggered production deployment as Ready.

## Master build checkpoint

- Phase 0 implements the central five-tier selection and the three existing cheat ladders. Area Optimizer credits one production skip, then starts fresh practice orders during the shop's cooldown. Fraction Slicer splits its tier reward across eligible orders and counts the completed code once.
- LocalStorage save version 2 retains existing coins, earned coins, shops, stock, building levels, and legacy boosts. Version 1 spending is reconstructed from existing earnings and balance. New event markers and streaks start recording in version 2.
- Phone sheets, hold-to-delete, read-friendly text, Growth markers, and the debug panel are available in the local preview. Debug controls appear at `?debug=1`. Each original shop has a separate replaceable SVG under `public/art/`.
- Verified TypeScript, the Vite build, and 31 Vitest tests, including 200 seeded questions for each cheat at each tier. Browser QA covered all 15 tier views, rewards across all bands, phone widths, and the reset hold in a temporary town.
- The owner confirmed that the separate Phase 0 Vercel preview opened on their phone.

### Master build Phase 1

- Version 3 stores saves with IndexedDB and imports the earlier localStorage saves. It keeps earlier shops and production, recalculates player level from lifetime coins, and provides save codes through Settings.
- Mayor Juno guides new players through nickname, avatar, pet, placement and their first Multiplication Macro. Existing players open their towns directly and can replay the tutorial from Settings.
- Opening Bike Shop and Tuck Shop now requires player levels 3 and 5 and the original coin prices. Level celebrations show the playable unlocks. The art and guide copy live under `public/art` and `src/data`.
- Web Audio supplies effects with separate saved music and effects settings. Four original instrumental loops are bundled under `public/audio/`, with credits in `public/audio/CREDITS.txt`.
- The production build precaches the app for offline use. Install options, the save-code controls and Privacy are in Settings.
- Checks passed for TypeScript, the production build, and 38 tests. Chrome review covered onboarding at phone width, level-ups, save-code round trips, volume persistence, a v2 migration, and opening the town and Growth page with the local server stopped. Physical-device installation remains to be checked.
- Phase 1 is published at [lazygamer-phase1-preview.vercel.app](https://lazygamer-phase1-preview.vercel.app/). The public landing page, service worker, manifest, and four MP3 routes returned HTTP 200.

### Master build Phase 2

- The question engine remembers the last twenty orders, adjusts difficulty per topic within the current band, and shows mastery stars in Growth.
- Six cheat codes are playable across every tier. Each board has two hints, a worked answer, and a labelled shop reward. Rewards apply the variety bonus and the third-repeat penalty, and players can practise during cooldowns.
- The wardrobe has layered original SVG art, unlocks and coin purchases, two designs for each kind of pet accessory, a sale bonus, and pet evolutions at levels 10, 25, and 50.
- Daily Challenge gives one reward per local calendar day and keeps the streak after missed days. Friends opens a read-only town snapshot from a visit code. The code shares shop levels and appearance while omitting names, coins, and progress.
- Save version 4 preserves version 3 progress and initializes Phase 2 data. TypeScript, the production build, and 52 tests passed. Chrome QA opened all 30 new tier boards at phone width and exercised the Daily Challenge, shop rewards and practice, wardrobe purchases, mastery, and saved friend visits.

### Master build Phase 3

- Town Mode now uses a PixiJS isometric grid. Build town can place, move and refund shops, roads and décor. The tile picker offers row and column controls alongside mouse dragging, touch hold, pan and pinch. Town Charm adds 1% per 10 points to sales up to 25%.
- The map starts at 8 × 8 and can expand to 16 × 16 from level 7. Sunny Bay opens at level 10 and Crystal Peak at level 25. Villagers walk to shops along connected roads when available. The custom avatar and pet appear on each map.
- The new shop gates are Bakery 6, Fruit Farm 7, Fish Pond 10, Windmill 12, Library 15 and Observatory 20. Shops have separate production and inventory and can upgrade through level 10, with art at levels 1, 4, 7 and 10.
- Town journal contains redeemable quests, badges and a collection book. Activities includes Practice Lab, seasonal relays, a five-order Boss Day at each fifth level, and Market Rush. Challenger and Mastermind get the 60-second rush. Little Explorer gets an untimed five-order round.
- Number Sorter, Line Leaper, Lucky Spinner, Mystery Orders and Recipe Mixer support all five tiers. The festival uses its own number-pattern relay. All boards reuse the question engine, mastery and hint controls.
- Version 5 migrates existing shops to grid positions and preserves production and player progress. New friend visit codes share the layout and can open earlier codes.
- Source is in `src/components/world`, `src/data/world.ts`, `src/logic/buildTown.ts`, `src/logic/townLayout.ts` and `src/logic/cheatCodes/townPuzzles.ts`. Art lives in `public/art`.
- Type checking, the production build, and 64 automated tests passed. Chrome review covered 360, 390 and 412 pixel layouts, all 25 new tier boards, desktop drag, migrated saves, building refunds and biomes, workshop level-10 art, quests, timed and untimed modes in code, a full Boss Day, seasonal rewards, friend visits, and opening the map from its offline cache. Physical phone pinch and hold testing remains open.

### Master build Phase 4

- Phase 3 is published at [lazygamer-phase3-preview.vercel.app](https://lazygamer-phase3-preview.vercel.app/). The public game, map bundle, service worker, manifest, sound track, and décor returned HTTP 200.
- Balance Scales, Cave Elevator, Chart Detective, Pattern Pipeline, Angle Archer, and Lightning Till cover tiers 1–5. Power Plant covers Mastermind tiers 3–5. Lightning Till has a 30-second pace timer in eligible shop rounds with continued play after the timer ends.
- Coin flights, confetti, button feedback, and town effects join a 06:00–18:00 day cycle and daily weather. Settings include Always night, Reduce motion, and a readable system-font mode. The map limits drawing to 36 FPS, updates weather at a lower cadence, and caps device pixel density. Key effects use Android vibration where available.
- Settings opens a local parent report after a four-digit PIN check. The PIN verifier is salted and device-local. The report includes mastery, solved codes, recent strongest and practice topics, active time by local week, and browser printing.
- Version 6 adds play time and appearance preferences. Old balances and inventory remain intact. Earlier shops pay less per sale and stock carried over above the new cap can be sold in batches. See [the economy report](BALANCE.md) for coins per hour for all twelve band and level combinations.
- Main changes live in `src/logic/cheatCodes/advancedPuzzles.ts`, `src/components/cheatCodes/AdvancedPuzzle.tsx`, `src/components/ParentPage.tsx`, `src/store/parentPin.ts`, `src/components/world/TownRenderer.ts`, `src/logic/economy.ts`, and `src/logic/save.ts`.
- Type checking, the production build, and 78 automated tests passed. Chrome verified all 33 supported tier screens, the normal three-order Lightning Till flow, Power Plant’s band restriction, saved preferences, v5 inventory migration, 360/390/412 pixel layouts, and the parent PIN and print flows. Physical Android vibration and performance checks are still pending.

### Master build Phase 5

- Capacitor packages the built game, art, fonts and music for Android and iOS. Both native apps save the town and parent PIN verifier in private files excluded from device backup. The Android app has no internet permission and handles Back through dialogs, nested views and the Town screen. The native icons and launch screens use the original sleepy mascot.
- Android produced a debug APK and an unsigned release bundle targeting API 36. The Android 14 emulator passed first launch in airplane mode, importing a version 5 save, a stock sale, Back navigation, landscape layout and restoring the resulting balance after reopening. The web build and all 78 Vitest tests passed.
- The iOS project uses Swift Package Manager with an iOS 15 deployment target. The Swift files, asset catalog, property list and storyboards passed source checks. Building and running the iOS app requires full Xcode.
- The privacy draft is available in Settings and at `/privacy.html` in the web build. The store submission checklist, listing copy and screenshot checklist are in [STORE_CHECKLIST.md](STORE_CHECKLIST.md) and [STORE_LISTING.md](STORE_LISTING.md).

### Acceptance fixes

- The Town screen fits all five specified phone, tablet and landscape viewports. Clickable locked-shop previews show the price on the map, and all unowned shops can be opened from Locked shops. The 13 px practice and map guidance now uses 16 px text.
- The generator rejects any puzzle identity seen in the last 20 orders. Varied maths replaces customer-name changes in the smallest decks. The suite exercises 70 consecutive orders for each supported cheat and tier using four recurring seeds. The probability and logic boards include authored orders. Placement recommends the band of the highest independently solved tier. Adaptive difficulty uses a one-tier offset.
- Version 7 normalizes question history and adaptive preferences while preserving earlier progress. Debug mode uses an in-memory town, and its level control exercises the real unlock rules. Completing a Festival Relay unlocks a coat. Town tips advance during inactivity.
- Native version 1.0.1 packages the updated game. The GitHub iOS workflow uses Xcode to compile and check the welcome screen on iPhone and iPad simulators.
