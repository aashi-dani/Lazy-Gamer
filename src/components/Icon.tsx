import type { ReactNode } from 'react'

const icons = {
  scale: <><path d="M12 4v15m-5 1h10M4 8h16M5 8l-3 7h6L5 8Zm14 0-3 7h6l-3-7Z"/><circle cx="12" cy="5" r="2"/></>,
  lift: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 3v18M6 10l2-2 2 2m4 4 2 2 2-2"/></>,
  pipe: <path d="M4 6h9a4 4 0 0 1 4 4v8h-4v-8H4zm0-2v8m7 6h8"/>,
  angle: <><path d="M4 18h16M4 18 16 6m-6 12q0-3-2-4"/><circle cx="4" cy="18" r="1.3"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7z"/>,
  power: <><path d="M12 3v8M7 5a8 8 0 1 0 10 0"/><path d="m11 15 2-2"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/></>,
  rain: <><path d="M5 15a4 4 0 1 1 1-8 5 5 0 0 1 9-1 4.5 4.5 0 1 1 3 9H5Zm1 3-1 2m7-2-1 2m7-2-1 2"/></>,
  snow: <path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4M8 20l4-4 4 4"/>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  print: <><path d="M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7z"/><path d="M17 11h1"/></>,
  line: <path d="M3 13h18m-16-3v6m5-8v10m5-8v6m4-8v10"/>,
  mix: <><path d="M4 12h16q-2 8-8 8t-8-8Zm8 0 6-8M15 4l3-1 2 3"/></>,
  spinner: <><circle cx="12" cy="12" r="8"/><path d="M12 4v8l-6 5m6-5 6 5"/><circle cx="12" cy="12" r="1"/></>,
  hammer: <path d="m3 20 9-10m-2-2 3-4q4-1 7 3l-3 4-2-1-3 3-3-3z"/>,
  book: <><path d="M12 19q-4-3-9-1V5q5-2 9 1 4-3 9-1v13q-5-2-9 1Zm0-13v13"/></>,
  trophy: <path d="M8 4h8v5q0 5-4 5T8 9Zm0 2H4v2q0 3 4 4m8-6h4v2q0 3-4 4m-4 2v5m-4 1h8"/>,
  move: <path d="M12 3v18M3 12h18M9 6l3-3 3 3m0 12-3 3-3-3M6 9l-3 3 3 3m12 0 3-3-3-3"/>,
  leaf: <path d="M20 4q0 14-9 15-6 0-6-5 0-8 15-10Zm-4 5L4 21"/>,
  friends: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.6"/><path d="M2 20v-2q0-5 6-5t6 5v2zm15-6q5 0 5 4v2h-5"/></>,
  wardrobe: <path d="m8 4-5 3 2 5 3-1v9h8v-9l3 1 2-5-5-3q-4 5-8 0Z"/>,
  drawers: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 12h16M10 7h4m-4 9h4"/></>,
  market: <><path d="M3 11h18l-2 9H5zm3 0 4-7m8 7-4-7m-5 11v2m6-2v2"/></>,
  tag: <><path d="M3 4h9l9 9-8 8-10-10z"/><circle cx="7.4" cy="8" r="1"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v5m8-5v5M3 10h18m-12 6 2 2 4-5"/></>,
  town: <><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></>,
  growth: <><path d="M4 4v16h16M8 15l4-5 4 2 4-6"/><path d="M17 6h3v3"/></>,
  sound: <><path d="M11 5 6 9H3v6h3l5 4zM15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/></>,
  mute: <><path d="M11 5 6 9H3v6h3l5 4zM16 10l5 5m0-5-5 5"/></>,
  gear: <><path d="m10 3-.8 3-2 .9-2.6-1.1-1.6 2.8 2 2.1v2.6l-2 2.1 1.6 2.8 2.6-1.1 2 .9.8 3h4l.8-3 2-.9 2.6 1.1 1.6-2.8-2-2.1v-2.6l2-2.1-1.6-2.8-2.6 1.1-2-.9-.8-3z"/><circle cx="12" cy="12" r="2.6"/></>,
  lock: <><rect x="6" y="10" width="12" height="11" rx="3"/><path d="M9 10V7a3 3 0 0 1 6 0v3m-3 5v2"/></>,
  spark: <path d="M12 2c.9 6.1 3.9 9.1 10 10-6.1.9-9.1 3.9-10 10C11.1 15.9 8.1 12.9 2 12c6.1-.9 9.1-3.9 10-10Z"/>,
  box: <path d="M3 7h18v13H3zm0 4h18m-14 5h3m4 0h3M5 7l2-4h10l2 4"/>,
  boxes: <><path d="M2 13h9v8H2zm11 0h9v8h-9zM8 3h8v8H8z"/><path d="m2 13 9 8m2-8 9 8M8 3l8 8"/></>,
  fence: <><path d="M4 20V7l2-4 2 4v13m8 0V7l2-4 2 4v13M8 9h8m4 0h2M2 9h2m4 6h8m4 0h2M2 15h2"/></>,
  slice: <><circle cx="12" cy="12" r="9"/><path d="M12 3v9l8 4M12 12l-8 4"/><circle cx="7" cy="10" r=".5"/><circle cx="13" cy="17" r=".5"/><circle cx="16" cy="8" r=".5"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  upgrade: <><path d="m5 10 7-6 7 6m-14 6 7-6 7 6"/><path d="M12 13v7"/></>,
  moon: <path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z"/>,
} satisfies Record<string, ReactNode>

export function Icon({ name, size = 22 }: { name: keyof typeof icons; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>
}

export function Coin({ size = 21 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12.5" r="10" fill="#a96132"/><circle cx="12" cy="11" r="9.5" fill="#ffd36b"/><circle cx="12" cy="11" r="6.5" fill="#f0a64d" stroke="#ffe59a" strokeWidth="1.4"/><path d="M12 6.5 13.5 9.5 16.5 11 13.5 12.5 12 15.5 10.5 12.5 7.5 11 10.5 9.5Z" fill="#fff0ae"/></svg>
}
