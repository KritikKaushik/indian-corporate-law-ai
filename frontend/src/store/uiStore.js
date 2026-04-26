import { create } from 'zustand'

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('lb_theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch { return 'dark' }
}

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  try { localStorage.setItem('lb_theme', theme) } catch {}
}

export const useUIStore = create((set) => {
  const initialTheme = getInitialTheme()
  applyTheme(initialTheme)

  return {
    page: 'dashboard',
    sidebarOpen: false,
    theme: initialTheme,

    setPage: (p) => set({ page: p, sidebarOpen: false }),
    setSidebarOpen: (v) => set({ sidebarOpen: v }),

    toggleTheme: () => set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  }
})