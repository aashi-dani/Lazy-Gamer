import { recordTime } from '../logic/playTime'
import { currentFestival, quests, type BiomeId, type QuestId } from '../data/world'
import { buildAt, buyLand, moveLot, removeLot } from '../logic/buildTown'
import { type Spot, type Piece } from '../logic/townLayout'
import { nextBoss, questProgress, recordCollect } from '../logic/worldProgress'
import { nickname, petEvolution } from '../data/profile'
import { openVisitCode, type Friend } from '../logic/visits'
import { isPetPart, itemAccess, wardrobeKey, type WardrobeOption } from '../data/wardrobe'
import { newQuestionSeed } from '../logic/cheatCodes/random'
import { chooseQuestion } from '../logic/questions'
import { dailyCode, localDay, trackAnswer, type DailyOffer } from '../logic/topicProgress'
import { coinsForLevel, selectTier, type Tier } from '../logic/difficulty'
import { townStorage } from './townStorage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildingIds, cheats, gameConfig, startingShop, supportsCheat, ageBands, type AgeBand, type BuildingId, type CheatId } from '../config/gameConfig'
import { advanceTown, batchTime, earnCoins, emptyTown, newBuilding, recordAttempt, sellStock, skipProduction, storageCap, unlockBuilding, upgradeBuilding, withBuilding, type TownSave } from '../logic/economy'
import { migrateSave, readTown } from '../logic/save'
import { applyReward, type CheatReward, type RewardReceipt } from '../logic/cheatCodes/rewards'

type Claim = { play: number; index: number; complete: boolean; debug?: boolean; guided?: boolean }
type GameStore = {
  town: TownSave
  checkpoint: (now?: number) => void
  setBand: (band: AgeBand) => void
  start: () => void
  setProfile: (profile: Partial<Pick<TownSave, 'playerName' | 'avatar' | 'pet'>>) => void
  setVolume: (key: 'musicVolume' | 'effectsVolume', volume: number) => void
  finishTutorial: (guided?: boolean) => void
  replace: (town: TownSave) => void
  collect: (building: BuildingId) => void
  unlock: (building: BuildingId, spot?: Spot) => void
  upgrade: (building: BuildingId) => void
  claimCode: (building: BuildingId, reward: CheatReward, claim: Claim) => RewardReceipt | null
  answer: (code: CheatId, tier: Tier, correct: boolean, masteryOnly?: boolean) => void
  place: (piece: Piece, spot: Spot) => boolean
  move: (from: Spot, to: Spot) => boolean
  removeLot: (spot: Spot) => void
  expand: (area: BiomeId) => void
  claimQuest: (id: QuestId) => void
  finishBoss: (level: number) => void
  finishRush: (points: number, timed: boolean) => void
  finishFestival: (key: string) => void
  nextQuestion: (code: CheatId, tier: Tier, remember?: boolean) => number
  openDaily: () => DailyOffer | undefined
  claimDaily: (offer: DailyOffer) => number
  equip: (option: WardrobeOption) => void
  saveFriend: (friend: Friend) => void
  removeFriend: (alias: string) => void
  toggleEasyRead: () => void
  setReduceMotion: (reduce: boolean | null) => void
  toggleAlwaysNight: () => void
  addPlayTime: (from: number, to: number) => void
  resetTutorial: () => void
  debugCoins: () => void
  debugLevel: (level: number) => void
  debugStock: (building: BuildingId, fill: boolean) => void
  toggleSound: () => void
  reset: () => void
}

export const useGameStore = create<GameStore>()(persist((set, get) => {
  const change = (action: (town: TownSave) => TownSave, now = Date.now()) => {
    set(({ town }) => ({ town: action(advanceTown(town, now).town) }))
  }
  const edit = (action: (town: TownSave) => TownSave) => {
    let changed = false
    change((town) => {
      const after = action(town)
      changed = after !== town
      return after
    })
    return changed
  }
  let lastClaim: { play: number; index: number; complete: boolean; id: BuildingId; code: CheatReward['code'] } | undefined
  const nextQuestion = (code: CheatId, tier: Tier, remember = true) => {
    const random = newQuestionSeed()
    if (!remember) return random
    const chosen = chooseQuestion(code, tier, random, get().town.recentQuestions)
    if (!chosen) throw new Error('Unable to draw a new order')
    change((town) => ({ ...town, recentQuestions: [...town.recentQuestions.slice(-19), chosen.key] }))
    return chosen.seed
  }
  return {
    town: emptyTown(Date.now()),
    checkpoint: (now) => change((town) => town, now),
    setBand: (band) => change((town) => ({ ...town, band })),
    setProfile: (profile) => change((town) => {
      const pet = profile.pet ? { ...profile.pet, evolution: Math.max(profile.pet.evolution, petEvolution(town.playerLevel)) } : town.pet
      let world = profile.pet ? recordCollect(town.world, `pet:${pet.type}`) : town.world
      if (profile.pet && town.guidedSeen) world = recordCollect(world, `pet:${town.pet.type}`)
      if (profile.avatar) world = recordCollect(world, `outfit:${profile.avatar.outfit}`)
      return { ...town, ...profile, pet, world }
    }),
    setVolume: (key, volume) => change((town) => ({ ...town, [key]: Math.max(0, Math.min(1, volume)) })),
    finishTutorial: (guided) => change((town) => ({ ...town, tutorialSeen: true, guidedSeen: guided || town.guidedSeen })),
    start: () => change((town) => {
      if (!town.band || town.guidedSeen || town.tutorialSeen || buildingIds.some((building) => town.buildings[building])) return town
      const started = { ...town, coins: gameConfig.startingCoins, history: [{ at: town.lastAt, total: 0 }] }
      return withBuilding(started, startingShop, newBuilding(startingShop, true))
    }),
    collect: (id) => change((town) => sellStock(town, id)),
    unlock: (id, spot) => change((town) => unlockBuilding(town, id, spot)),
    upgrade: (id) => change((town) => upgradeBuilding(town, id)),
    claimCode: (id, reward, claim) => {
      const samePlay = lastClaim?.play === claim.play && lastClaim.id === id && lastClaim.code === reward.code
      const continuing = Boolean(samePlay && !lastClaim?.complete && lastClaim?.index === claim.index - 1)
      if ((claim.index > 0 || samePlay) && !continuing) return null
      let receipt: RewardReceipt | null = null
      change((town) => {
        if (claim.guided && town.guidedSeen) return town
        if (!claim.debug && !supportsCheat(reward.code, town.band, town.playerLevel)) return town
        const result = applyReward(town, id, reward, { continuing, complete: claim.complete, debug: claim.debug })
        receipt = result.receipt
        return receipt && claim.guided && claim.complete ? { ...result.town, guidedSeen: true, tutorialSeen: true } : result.town
      })
      if (receipt) lastClaim = { play: claim.play, index: claim.index, complete: claim.complete, id, code: reward.code }
      return receipt
    },
    answer: (code, tier, correct, masteryOnly) => change((town) => {
      const topic = cheats[code].topic
      return { ...(masteryOnly ? town : recordAttempt(town, correct)), topics: { ...town.topics, [topic]: trackAnswer(town.topics[topic], correct, tier) } }
    }),
    place: (piece, spot) => edit((town) => buildAt(town, piece, spot)),
    move: (from, to) => edit((town) => moveLot(town, from, to)),
    removeLot: (spot) => change((town) => removeLot(town, spot)),
    expand: (area) => change((town) => buyLand(town, area)),
    claimQuest: (id) => change((town) => {
      const quest = quests[id]
      if (!quest || questProgress(town, id) < quest.target || town.world.claimedQuests.includes(id)) return town
      return earnCoins({ ...town, world: { ...town.world, claimedQuests: [...town.world.claimedQuests, id] } }, quest.reward)
    }),
    finishBoss: (level) => change((town) => {
      if (level !== nextBoss(town.playerLevel, town.world.bossWins)) return town
      return { ...town, world: { ...town.world, bossWins: [...town.world.bossWins, level] } }
    }),
    finishRush: (points, timed) => change((town) => {
      const key = timed ? 'rushBest' : 'relaxedBest'
      return points > town.world[key] ? { ...town, world: { ...town.world, [key]: points } } : town
    }),
    finishFestival: (key) => change((town) => {
      if (key !== currentFestival(town.lastAt).key || town.world.festivalWins.includes(key)) return town
      return { ...town, world: { ...town.world, festivalWins: [...town.world.festivalWins, key] } }
    }),
    nextQuestion,
    openDaily: () => {
      const { daily, band, playerLevel, topics } = get().town
      const day = localDay()
      if (!band || day <= daily.lastDay) return undefined
      if (daily.offer?.day === day && supportsCheat(daily.offer.cheat, band, playerLevel)) {
        const { min, max } = ageBands[band]
        if (daily.offer.tier >= min && daily.offer.tier <= max) return daily.offer
      }
      const cheat = dailyCode(day, playerLevel, band)
      const tier = selectTier(band, playerLevel, topics[cheats[cheat].topic]?.offset)
      const offer = { day, cheat, tier, seed: nextQuestion(cheat, tier) }
      change((town) => ({ ...town, daily: { ...town.daily, offer } }))
      return offer
    },
    claimDaily: (offer) => {
      let coins = 0
      change((town) => {
        const { daily } = town
        if (offer.day !== localDay(town.lastAt) || offer.day <= daily.lastDay || daily.offer?.seed !== offer.seed) return town
        coins = 45 + 15 * offer.tier
        return earnCoins({ ...town, daily: { lastDay: offer.day, streak: daily.streak + 1 } }, coins)
      })
      return coins
    },
    equip: (option) => change((town) => {
      const { category, index } = option
      const { allowed, cost } = itemAccess(town, option)
      if (!allowed) return town
      const petAccessories = town.pet.accessories ?? { petHat: 0, petScarf: 0, petBow: 0 }
      const dressed = isPetPart(category)
        ? { ...town, pet: { ...town.pet, accessories: { ...petAccessories, [category]: index } } }
        : { ...town, avatar: { ...town.avatar, [category]: index } }
      if (category === 'outfit') dressed.world = recordCollect(recordCollect(dressed.world, `outfit:${town.avatar.outfit}`), `outfit:${index}`)
      return cost ? { ...dressed, coins: town.coins - cost, spent: town.spent + cost,
        wardrobeOwned: [...town.wardrobeOwned, wardrobeKey(option)] } : dressed
    }),
    saveFriend: ({ alias, code }) => change((town) => {
      const name = nickname(alias)
      if (!name || !openVisitCode(code)) return town
      return { ...town, friends: [...town.friends.filter((friend) => friend.alias.toLowerCase() !== name.toLowerCase()), { alias: name, code: code.trim() }].slice(-30) }
    }),
    removeFriend: (alias) => change((town) => ({ ...town, friends: town.friends.filter((friend) => friend.alias !== alias) })),
    addPlayTime: (from, to) => {
      if (!get().town.band) return
      set(({ town }) => ({ town: { ...town, playTime: recordTime(town.playTime, from, to) } }))
    },
    setReduceMotion: (reduceMotion) => change((town) => ({ ...town, reduceMotion })),
    toggleAlwaysNight: () => change((town) => ({ ...town, alwaysNight: !town.alwaysNight })),
    toggleEasyRead: () => change((town) => ({ ...town, easyRead: !town.easyRead })),
    resetTutorial: () => change((town) => ({ ...town, tutorialSeen: false })),
    debugCoins: () => change((town) => earnCoins(town, 1_000)),
    debugLevel: (level) => change((town) => ({
      ...town, playerLevel: level, lifetimeCoinsEarned: coinsForLevel(level),
      pet: { ...town.pet, evolution: petEvolution(level) },
    })),
    debugStock: (id, fill) => change((town) => {
      const building = town.buildings[id]
      if (!building) return town
      if (fill) return withBuilding(town, id, { ...building, stock: storageCap(id, building.level), progress: 0 })
      return skipProduction(town, id, batchTime(building.level) * (1 - building.progress)).town
    }),
    toggleSound: () => change((town) => ({ ...town, sound: !town.sound })),
    reset: () => { lastClaim = undefined; set({ town: emptyTown(Date.now()) }) },
    replace: (town) => { lastClaim = undefined; set({ town: advanceTown(town, Date.now()).town }) },
  }
}, {
  name: gameConfig.saveKey,
  version: gameConfig.saveVersion,
  storage: createJSONStorage(() => townStorage),
  skipHydration: true,
  partialize: ({ town }) => ({ town }),
  migrate: (saved, version) => migrateSave(saved, version) as { town: TownSave },
  merge: (saved, current) => ({ ...current, town: readTown((saved as { town?: unknown } | undefined)?.town, Date.now()) }),
}))
