import type { ReactNode } from 'react'

const icons = {
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
