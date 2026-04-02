import {
  FileText,
  Scale,
  LogOut,
  Home,
  BarChart3,
  Settings,
  Bookmark,
  Clock,
  Share2,
  HelpCircle,
  X,
} from "lucide-react"

export default function Sidebar({ activeMenu, setActiveMenu, isDark, isOpen, setIsOpen }) {
  const menuItems = [
    { id: 1, icon: Home, label: "Dashboard", badge: null },
    { id: 2, icon: FileText, label: "Documents", badge: null },
    { id: 3, icon: BarChart3, label: "Analytics", badge: null },
    { id: 4, icon: Bookmark, label: "Saved", badge: null },
    { id: 5, icon: Clock, label: "Recent", badge: null },
  ]

  const bottomItems = [
    { id: 6, icon: Share2, label: "Share", badge: null },
    { id: 7, icon: Settings, label: "Settings", badge: null },
    { id: 8, icon: HelpCircle, label: "Help", badge: null },
  ]

  const handleMenuClick = (id) => {
    setActiveMenu(id)
    setIsOpen(false) 
  }

  const mobileOverlay = isOpen && (
    <div
      className="fixed inset-0 bg-black/40 md:hidden z-20"
      onClick={() => setIsOpen(false)}
    />
  )

  return (
    <>
      {mobileOverlay}

      {/* DESKTOP SIDEBAR */}
      <div
        className={`hidden md:flex md:flex-col w-64 p-6 fixed h-full overflow-y-auto shadow-sm z-30 ${
          isDark
            ? 'border-r border-slate-700 bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900'
            : 'border-r border-blue-200 bg-gradient-to-b from-white via-blue-50/30 to-white'
        }`}
      >
        <div
          className={`flex items-center gap-3 mb-10 pb-6 border-b ${isDark ? 'border-slate-700' : 'border-blue-100'}`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow ${
              isDark
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}
          >
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className={`text-lg font-bold ${
                isDark
                  ? 'bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent'
              }`}
            >
              Legal Buddy
            </h1>
          </div>
        </div>

        <nav className="flex-1 space-y-2 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark
                  ? 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'hover:bg-blue-50 text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    activeMenu === item.id
                      ? 'text-white'
                      : isDark
                      ? ''
                      : 'group-hover:text-blue-600'
                  }`}
                />
                <span className="text-sm font-medium text-left">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    activeMenu === item.id
                      ? 'bg-blue-400/30 text-white'
                      : isDark
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div
          className={`border-t pt-4 mb-4 ${isDark ? 'border-slate-700' : 'border-blue-100'}`}
        />
        <nav className="space-y-2 mb-6">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark
                  ? 'hover:bg-slate-700 text-slate-600 hover:text-slate-100'
                  : 'hover:bg-blue-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  activeMenu === item.id ? 'text-white' : isDark ? '' : 'group-hover:text-blue-600'
                }`}
              />
              <span className="text-sm font-medium text-left">{item.label}</span>
            </button>
          ))}
        </nav>
        <div
          className={`pt-4 border-t text-center ${isDark ? 'border-slate-700' : 'border-blue-100'}`}
        >
          <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            © 2025 Legal Buddy
          </p>
        </div>
      </div>

      {/* MOBILE SIDEBAR  */}
      <div
        className={`fixed top-0 left-0 h-full w-64 p-6 z-30 transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark
            ? 'bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900 border-r border-slate-700'
            : 'bg-gradient-to-b from-white via-blue-50/30 to-white border-r border-blue-200'
        }`}
      >

        <button
          onClick={() => setIsOpen(false)}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-blue-100'
          }`}
        >
          <X className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
        </button>

        <div
          className={`flex items-center gap-3 mb-8 pb-6 border-b ${isDark ? 'border-slate-700' : 'border-blue-100'}`}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1
            className={`text-lg font-bold ${
              isDark
                ? 'bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent'
            }`}
          >
            Legal Buddy
          </h1>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark
                  ? 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'hover:bg-blue-50 text-slate-700 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={`border-t pt-4 mb-4 ${isDark ? 'border-slate-700' : 'border-blue-100'}`} />

        <nav className="space-y-2">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark
                  ? 'hover:bg-slate-700 text-slate-600 hover:text-slate-100'
                  : 'hover:bg-blue-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}