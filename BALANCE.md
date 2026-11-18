# Phase 4 economy balance

Income is in coins per real-time hour. Each row is a 24-hour simulation with the shops available at the listed player level already purchased. Shop levels are 1, 2, 3, and 5 at the four checkpoints. Both runs start with empty stock, no Town Charm bonus, and pet luck enabled. Collections happen every 20 minutes.

The active run plays one rewarded code per shop per hour. It rotates Multiplication Macro, Area Optimizer, and Fraction Slicer at the starting tier for the band and level. The simulation applies production limits, cooldowns, and the variety modifier. Daily, quest, and festival rewards are outside this estimate.

| Player level | Band | Waiting | With cheats | Income multiplier |
| --- | --- | ---: | ---: | ---: |
| 1 | Little Explorer | 9.0 | 37.9 | 4.21× |
| 1 | Challenger | 9.0 | 52.6 | 5.84× |
| 1 | Mastermind | 9.0 | 69.9 | 7.76× |
| 5 | Little Explorer | 60.7 | 167.0 | 2.75× |
| 5 | Challenger | 60.7 | 251.4 | 4.14× |
| 5 | Mastermind | 60.7 | 318.6 | 5.25× |
| 10 | Little Explorer | 282.7 | 854.5 | 3.02× |
| 10 | Challenger | 282.7 | 1043.5 | 3.69× |
| 10 | Mastermind | 282.7 | 1201.9 | 4.25× |
| 20 | Little Explorer | 767.5 | 1592.6 | 2.08× |
| 20 | Challenger | 767.5 | 2294.9 | 2.99× |
| 20 | Mastermind | 767.5 | 2480.4 | 3.23× |

## Sale limits

Shop purchase prices stay at their existing values. Sale prices for Coconut Stall, Bike Shop, Tuck Shop, and Bakery are lower, and capacity increases by one slot every three shop levels. A full sale from an earlier shop pays less than any later shop’s price, even when pet luck and Town Charm both apply. Previously earned coins, inventory, and fractional production are preserved. Stock carried over above the new capacity sells in batches.

Run the same model with `LAZY_GAMER_BALANCE_REPORT=1 npm test -- src/logic/balanceSimulation.test.ts`.
