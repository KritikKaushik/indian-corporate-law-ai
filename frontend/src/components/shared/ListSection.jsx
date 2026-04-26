import { motion } from 'framer-motion'

export function ListSection({ items, theme, emptyMsg }) {
  if (!items?.length) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm py-2 font-poppins">
        {emptyMsg}
      </p>
    )
  }

  const themes = {
    orange: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 border-l-orange-500 text-orange-900 dark:text-orange-100',
    green: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 border-l-green-500 text-green-900 dark:text-green-100',
    red: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 border-l-red-500 text-red-900 dark:text-red-100',
  }

  const activeTheme = themes[theme] || themes.orange

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`p-4 rounded-xl border border-l-[3px] text-sm font-poppins leading-relaxed transition-colors duration-150 ${activeTheme}`}
        >
          {item}
        </motion.div>
      ))}
    </div>
  )
}
