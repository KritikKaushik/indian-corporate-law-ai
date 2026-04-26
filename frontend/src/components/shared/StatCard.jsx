import { motion } from 'framer-motion'

const fadeItem = (i) => ({ 
  initial: { opacity: 0, y: 18 }, 
  animate: { opacity: 1, y: 0 }, 
  transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
})

export function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div 
      {...fadeItem(delay)} 
      className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 flex items-center gap-4 hover:border-orange-500/40 hover:shadow-lg transition-all cursor-default"
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" 
        style={{ 
          background: `color-mix(in srgb, ${color} 12%, transparent)`, 
          border: `1px solid color-mix(in srgb, ${color} 22%, transparent)` 
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <div>
        <div className="font-outfit text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium font-poppins">
          {label}
        </div>
      </div>
    </motion.div>
  )
}
