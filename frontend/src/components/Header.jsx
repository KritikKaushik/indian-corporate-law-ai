import { Settings, LogOut, Sun, Moon, Menu } from "lucide-react"
import toast from 'react-hot-toast'

export default function Header({ isDark, setIsDark, onLogout, user, onMenuToggle }) {
  const handleThemeToggle = () => {
    setIsDark(!isDark)
    toast.success(isDark ? 'Light mode activated!' : 'Dark mode activated!')
  }

  const handleLogout = () => {
    toast.success('Logged out successfully!')
    setTimeout(() => {
      onLogout()
    }, 500)
  }

  return (
    <div className={`border-b px-4 md:px-6 lg:px-12 py-3 md:py-4 sticky top-0 z-20 shadow-sm ${
      isDark
        ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-700'
        : 'bg-gradient-to-r from-white to-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between max-w-full gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            onClick={onMenuToggle}
            className={`md:hidden p-2 rounded-lg transition-all ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600'
            }`}
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className={`text-sm md:text-base font-medium hidden sm:block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Dashboard
          </h2>
          {user && (
            <div className={`text-xs md:text-sm hidden md:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Welcome, <span className="font-semibold">{user.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button
            onClick={handleThemeToggle}
            className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400'
                : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600 hover:text-slate-900'
            }`}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="w-4 md:w-5 h-4 md:h-5" /> : <Moon className="w-4 md:w-5 h-4 md:h-5" />}
          </button>

          <button
            className={`hidden sm:block p-2 rounded-lg transition-all duration-200 shadow-sm ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600 hover:text-slate-900'
            }`}
            title="Settings"
            onClick={() => toast.error('Settings coming soon!')}
          >
            <Settings className="w-4 md:w-5 h-4 md:h-5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${
              isDark
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                : 'bg-red-50 hover:bg-red-100 text-red-600'
            }`}
            title="Logout"
          >
            <LogOut className="w-4 md:w-5 h-4 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}