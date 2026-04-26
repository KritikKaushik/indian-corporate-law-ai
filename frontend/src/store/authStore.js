import { create } from 'zustand'

const STORAGE_KEY = 'lb_user'

const stored = () => {
  try {
    const n = localStorage.getItem(STORAGE_KEY)
    if (n) return JSON.parse(n)
    const old = localStorage.getItem('lexai_u')
    if (old) {
      localStorage.setItem(STORAGE_KEY, old)
      localStorage.removeItem('lexai_u')
      return JSON.parse(old)
    }
    return null
  } catch { return null }
}

export const useAuthStore = create((set) => ({
  isLoggedIn: false,
  user: null,

  initAuth: () => {
    const u = stored()
    if (u?.access_token) set({ isLoggedIn: true, user: u })
  },

  login: (u) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    set({ isLoggedIn: true, user: u })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ isLoggedIn: false, user: null })
  },
}))
