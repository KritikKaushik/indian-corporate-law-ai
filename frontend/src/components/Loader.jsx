import { motion, AnimatePresence } from 'framer-motion'
import { Scale } from 'lucide-react'

export function PageLoader({ show = true, message = 'Loading…' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          className="fixed inset-0 bg-white dark:bg-black flex flex-col items-center justify-center z-[9999] gap-5 transition-colors duration-300"
        >
          <div className="fixed rounded-full pointer-events-none blur-[80px] bg-orange-500 w-96 h-96 -top-10 -right-10 opacity-5" />
          <div className="fixed rounded-full pointer-events-none blur-[80px] bg-orange-500 w-72 h-72 -bottom-16 -left-5 opacity-[3%]" />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute w-18 h-18 rounded-full border-2 border-transparent border-t-orange-500 border-r-orange-400"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute w-14 h-14 rounded-full border-[1.5px] border-transparent border-b-orange-500 opacity-50"
            />
            <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Scale size={22} color="#fff" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center flex flex-col gap-1.5"
          >
            <span className="font-outfit text-xl font-extrabold text-black dark:text-white tracking-tight">
              LegalBuddy
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
              {message}
            </span>
          </motion.div>

          <motion.div className="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <span /><span /><span />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Spinner({ className = "w-5 h-5 border-t-orange-500 border-r-orange-500" }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className={`rounded-full border-2 border-transparent shrink-0 ${className}`}
    />
  )
}

export function ContentLoader({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-2.5 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.06 }}
          className={`skeleton h-11 rounded-md ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export default PageLoader