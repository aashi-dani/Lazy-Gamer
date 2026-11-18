import { nativeApp } from '../native/device'

export default function PrivacyPolicy({ standalone = false }: { standalone?: boolean }) {
  return <>
    {standalone && <p className="muted">Draft for store review. A privacy contact will be added before release.</p>}
    <h3>What the game saves</h3>
    <p>Lazy Gamer saves your nickname, pet, town, settings, puzzle results and play time on this device. It saves a protected copy of the parent PIN so the report can stay locked. Use a made-up nickname and pet name.</p>
    <h3>What the game sends</h3>
    <p>The game has no accounts, ads or analytics. It has no server for town saves or progress reports. The installed Android and iPhone apps can play offline from the first launch.</p>
    {(!nativeApp || standalone) && <p>When you open the web version, its hosting provider receives connection information such as your IP address to deliver the site and may keep service logs. The game does not send your town or progress to the host.</p>}
    <h3>Sharing is your choice</h3>
    <p>A save code can contain your nickname, pet name and progress. Anyone with the code can open a copy. A visit code contains the look of your town, shops and characters. Names, coins and play history are left out. Copying a code puts it on your device’s clipboard. Share only with someone you trust.</p>
    <p>The parent page opens your device’s print menu when you choose to print. Your choice of printer or destination controls where the report goes.</p>
    <h3>How to clear your data</h3>
    <p>Use <strong>Settings → Reset town</strong> to erase the town and its progress. To remove all game data including the PIN, clear this site’s data in your browser or remove the installed app and its data. Copies you have shared can still exist on other devices.</p>
  </>
}
