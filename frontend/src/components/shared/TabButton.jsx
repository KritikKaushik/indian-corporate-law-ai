export function TabButton({ id, label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 border whitespace-nowrap font-outfit flex items-center gap-2 tracking-wide ${
        isActive
          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 border-transparent'
          : 'text-gray-500 dark:text-gray-400 bg-transparent border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-900'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}
