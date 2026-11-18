export const debugSession = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('debug') === '1'
