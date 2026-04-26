import { FileText } from "lucide-react"

export default function TabSection({ activeTab, setActiveTab, isDark }) {
  const tabs = [
    { id: "pdf", label: "PDF & Legal Files", icon: FileText, highlight: true },
  ]

  return (
    <div className="flex flex-wrap gap-3 mb-8 justify-center px-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md ${
            activeTab === tab.id
              ? tab.highlight
                ? isDark
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                : isDark
                ? "bg-slate-700 text-white"
                : "bg-slate-200 text-slate-900"
              : isDark
              ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:shadow-lg"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-lg"
          }`}
        >
          <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          <span className="text-sm">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}