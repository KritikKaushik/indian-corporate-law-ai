import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Scale, ChevronRight } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import DocumentsView from './DocumentsView'

const PAGE_TITLES = { dashboard: 'Dashboard', documents: 'Documents' }

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18 } },
}

function TopBar() {
  const { page, setSidebarOpen } = useUIStore()
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-400 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Scale size={12} className="text-orange-500 shrink-0" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 font-outfit tracking-wide uppercase">
              legalbuddy
            </span>
          </div>
          <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />
          <span className="text-sm font-bold text-gray-900 dark:text-white font-outfit">
            {PAGE_TITLES[page] || page}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 py-1.5 pr-4 pl-2 rounded-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center text-xs font-extrabold text-white font-outfit shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300 font-outfit max-w-[120px] truncate">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>
    </header>
  )
}

export default function Layout() {
  const { page } = useUIStore()
  const contentRef = useRef(null)

  useEffect(() => {
    if (!contentRef.current) return
    import('gsap').then(({ gsap }) => {
      gsap.to(contentRef.current, { scrollTop: 0, duration: 0.45, ease: 'power2.out' })
    }).catch(() => {
      if (contentRef.current) contentRef.current.scrollTop = 0
    })
  }, [page])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-black transition-colors duration-300 relative">
      
      {/* ── Fixed Toaster for Dark Mode ── */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-white dark:!bg-neutral-900 !text-gray-900 dark:!text-white !border !border-gray-200 dark:!border-neutral-800 !rounded-xl !font-poppins !text-sm !shadow-lg',
          style: { background: 'transparent', color: 'inherit', boxShadow: 'none' } 
        }}
      />

      {/* ── Ambient Orbs ── */}
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-32 -right-24 opacity-10 dark:opacity-5 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[350px] h-[350px] -bottom-32 left-10 opacity-10 dark:opacity-5 z-0" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden z-10">
        <TopBar />
        <main
          ref={contentRef}
          className={`flex-1 overflow-x-hidden relative ${page === 'documents' ? 'overflow-hidden' : 'overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]'}`}
        >
          <AnimatePresence mode="wait">
            {page === 'dashboard' && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                <Dashboard />
              </motion.div>
            )}
            {page === 'documents' && (
              <motion.div key="documents" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full overflow-hidden">
                <DocumentsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}