import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito/wght.css'
import './styles/index.css'
import PrivacyPolicy from './components/PrivacyPolicy'

createRoot(document.getElementById('privacy')!).render(<article className="settings-content">
  <h1>Lazy Gamer Privacy Policy</h1>
  <PrivacyPolicy standalone />
</article>)
