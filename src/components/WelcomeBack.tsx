import { buildingIds, buildings, type BuildingId } from '../config/gameConfig'
import { guide } from '../data/guide'
import { Guide } from './Guide'
import { Icon } from './Icon'
import Modal from './Modal'

export default function WelcomeBack({ stock, player, pet, dismiss }: {
  stock: Partial<Record<BuildingId, number>>
  player: string
  pet: string
  dismiss: () => void
}) {
  return <Modal title="Welcome back!" onDismiss={dismiss}>
    <div className="welcome-content">
      <Guide face="waving">{guide.welcome(player || 'shopkeeper', pet)}</Guide>
      <ul className="unlocks">{buildingIds.map((id) => {
        const amount = stock[id]
        return amount ? <li key={id}>{buildings[id].name} <strong>+{amount} {amount === 1 ? buildings[id].stockUnit : buildings[id].stockName}</strong></li> : null
      })}</ul>
      <button className="button gold-button" onClick={dismiss}>See my town <Icon name="arrow" size={19} /></button>
    </div>
  </Modal>
}
