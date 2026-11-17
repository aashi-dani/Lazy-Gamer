export function MascotArt({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 100 92" fill="none">
    <path d="M13 66c-5-18 1-31 11-40 2-9 11-16 21-16 6-6 19-5 26 3 15 1 25 19 23 36-1 21-12 38-38 40C35 92 18 83 13 66Z" fill="#744d80" />
    <path d="M13 60c-4-15 2-29 12-37C27 13 35 8 45 9c8-6 20-4 26 4 14 1 22 17 21 31-1 20-14 38-38 39C34 84 17 76 13 60Z" fill="#c39ce3" stroke="#31233f" strokeWidth="4"/>
    <path d="M25 24c-12 3-16 14-13 24 5 2 11 0 15-5m43-29c11-3 23 5 25 18-6 5-12 4-17 0" fill="#e2b4ed" stroke="#31233f" strokeWidth="4" strokeLinecap="round"/>
    <path d="M25 55c1-10 11-18 25-17 18-3 29 8 29 19 0 11-9 19-27 20-16 0-27-7-27-22Z" fill="#ffe2c8"/>
    <path d="M33 53c4 5 8 5 12 0m11 0c4 5 8 5 12 0" stroke="#31233f" strokeWidth="3" strokeLinecap="round"/>
    <path d="M48 61c0-2 6-2 6 0 0 2-3 4-3 4s-3-2-3-4Z" fill="#714870"/>
    <path d="M32 63h4m30 0h5" stroke="#f5a4a4" strokeWidth="4" strokeLinecap="round"/>
    <path d="m27 25 7-6m-2 11 8-5" stroke="#fce4ff" strokeWidth="2.5" strokeLinecap="round" opacity=".8"/>
    <path d="M59 22h10l-10 9h10" stroke="#fff0ad" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}

export default function Mascot({ children }: { children: React.ReactNode }) {
  return <aside className="mascot-tip">
    <div className="mascot-portrait"><MascotArt /></div>
    <div><strong>Mochi</strong><p>{children}</p></div>
  </aside>
}
