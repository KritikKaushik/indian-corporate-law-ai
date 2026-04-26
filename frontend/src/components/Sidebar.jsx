import { motion, AnimatePresence } from 'framer-motion'
import { Scale, LayoutDashboard, FolderOpen, LogOut, X, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'documents', icon: FolderOpen,      label: 'Documents' },
]

function SidebarContent({ onClose }) {
  const { page, setPage, theme, toggleTheme } = useUIStore()
  const { user, logout } = useAuthStore()

  return (
    <div className="w-60 h-screen bg-gray-50 dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 flex flex-col shrink-0 sticky top-0 overflow-hidden z-30 transition-colors duration-300">
      
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4 border-b border-gray-200 dark:border-neutral-800 shrink-0">
        <motion.div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
          <Scale size={20} color="#fff" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="font-outfit text-lg font-extrabold text-black dark:text-white tracking-tight">LegalBuddy</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-px font-outfit">AI Legal Platform</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800">
            <X size={15} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 py-3 px-3 flex-1">
        <div className="text-[9px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-600 pt-1 px-2 pb-2 font-outfit">Navigation</div>

        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <motion.button
            key={id}
            className={`flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-150 text-sm font-medium w-full border text-left font-outfit tracking-wide relative ${
              page === id
                ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 font-semibold'
                : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
            }`}
            onClick={() => { setPage(id); onClose?.(); }}
          >
            <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${page === id ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <Icon size={17} />
            </span>
            <span className="flex-1">{label}</span>
            {page === id && <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
          </motion.button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-neutral-800 flex flex-col gap-1.5">
        <button onClick={toggleTheme} className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl bg-transparent border border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-400 text-xs font-semibold cursor-pointer w-full font-outfit hover:bg-gray-100 dark:hover:bg-neutral-800">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon size={13} className="text-orange-500" /> : <Sun size={13} className="text-orange-500" />}
            <span className="text-xs">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          </div>
          <div className="w-8 h-4 rounded-full bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 relative">
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-orange-500 transition-transform duration-200 ${theme === 'light' ? 'translate-x-3.5' : ''}`} />
          </div>
        </button>

        <div className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center text-xs font-extrabold text-white shrink-0 font-outfit">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-black dark:text-white font-outfit overflow-hidden text-ellipsis whitespace-nowrap">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-px font-poppins">Legal Analyst</div>
          </div>
          <button onClick={() => { logout(); onClose?.(); }} className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      <div className="hidden md:block h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </div>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div key="overlay" className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
            <motion.div key="drawer" className="fixed left-0 top-0 bottom-0 w-60 z-[51] md:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 340, damping: 36 }}>
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}