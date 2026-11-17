import { Icon } from './Icon'
import { MascotArt } from './Mascot'
import Modal from './Modal'

export default function WelcomeBack({ stock, dismiss }: { stock: number; dismiss: () => void }) {
  return <Modal title="Welcome back!" onDismiss={dismiss}>
    <div className="welcome-content">
      <MascotArt />
      <p>Your town made <strong>{stock} stock</strong> while you were away.</p>
      <button className="button gold-button" onClick={dismiss}>See my town <Icon name="arrow" size={19} /></button>
    </div>
  </Modal>
}
