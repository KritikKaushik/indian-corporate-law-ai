import { X, Sparkles, FileText, BookOpen, Brain, AlertTriangle, Search } from "lucide-react"
import { useState } from "react"

export default function AnalysisResult({ isDark, data, onClose }) {
  const [activeTab, setActiveTab] = useState("analysis")
  if (!data) return null

  const hasWarnings = data.warnings && Object.keys(data.warnings).length > 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`${isDark ? "bg-slate-900" : "bg-white"} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>

        {/* Header */}
        <div className={`sticky top-0 ${isDark ? "bg-slate-800" : "bg-slate-100"} border-b ${isDark ? "border-slate-700" : "border-slate-200"} p-6 flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Document Analysis</h2>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{data.file?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="px-6 pt-4">
            <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${isDark ? "bg-yellow-900/30 border border-yellow-700 text-yellow-300" : "bg-yellow-50 border border-yellow-300 text-yellow-800"}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">Partial results:</p>
                {data.warnings.search && <p>🔍 {data.warnings.search}</p>}
                {data.warnings.ai    && <p>🤖 {data.warnings.ai}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Search query used — helps debug wrong sections */}
        {data.search_query_used && (
          <div className={`px-6 pt-3`}>
            <div className={`p-2 rounded-lg flex items-center gap-2 text-xs ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
              <Search className="w-3 h-3 shrink-0" />
              <span>Keywords used for section matching: <strong>{data.search_query_used}</strong></span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-2 border-b ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"} px-6 py-4 sticky top-16 flex-wrap`}>
          {[
            { id: "analysis",  label: "AI Analysis",      icon: Brain    },
            { id: "extracted", label: "Extracted Text",   icon: FileText },
            { id: "sections",  label: "Related Sections", icon: BookOpen },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : `${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {activeTab === "analysis" && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>🤖 AI Legal Analysis</h3>
              {data.ai_analysis ? (
                <div className={`p-6 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-50"} whitespace-pre-wrap leading-relaxed text-sm`}>
                  {data.ai_analysis}
                </div>
              ) : (
                <div className={`p-6 rounded-lg text-sm ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  No analysis available. Make sure Ollama is running:<br />
                  <code className="block mt-2 bg-black/10 p-2 rounded">ollama pull mistral</code>
                </div>
              )}
            </div>
          )}

          {activeTab === "extracted" && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>📄 Extracted Text</h3>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"} mb-4`}>
                {(data.text_length || 0).toLocaleString()} total chars
                {data.text_length > 1500 && <span className="ml-1 opacity-60">(showing first 1,500)</span>}
              </p>
              <div className={`p-6 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-50"} whitespace-pre-wrap leading-relaxed text-sm max-h-96 overflow-y-auto`}>
                {data.extracted_text || "No text extracted."}
              </div>
            </div>
          )}

          {activeTab === "sections" && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                📚 Related Sections ({data.sections_count ?? 0})
              </h3>
              {data.sections_summary && (
                <div className={`p-4 mb-4 rounded-lg ${isDark ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
                  <p className={`text-sm whitespace-pre-wrap ${isDark ? "text-blue-200" : "text-blue-800"}`}>{data.sections_summary}</p>
                </div>
              )}
              {data.related_sections?.length > 0 ? (
                <div className="space-y-4">
                  {data.related_sections.map((s, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <h4 className={`font-bold text-lg mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                        Section {s.section_number}: {s.section_title}
                      </h4>
                      <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {s.content?.substring(0, 500)}{s.content?.length > 500 ? "…" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-6 rounded-lg text-sm ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  No related sections found.
                  {data.warnings?.search && <p className="mt-2 text-yellow-500">⚠️ {data.warnings.search}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className={`border-t ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"} p-6 grid grid-cols-3 gap-4`}>
          <div className="text-center">
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>File Type</p>
            <p className={`font-bold text-lg uppercase ${isDark ? "text-white" : "text-slate-900"}`}>{data.file?.type || "—"}</p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Text Length</p>
            <p className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{(data.text_length || 0).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Sections Found</p>
            <p className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{data.sections_count ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}