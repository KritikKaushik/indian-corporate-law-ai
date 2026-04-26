import { Upload, FileText, AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { addFile } from "../utils/storage"
import AnalysisResult from "./AnalysisResult"

const BACKEND_URL = "http://localhost:5000"

export default function UploadArea({ isDark, onFilesUpdated }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const formats = [
    { name: "PDF",  icon: FileText, color: "text-red-500"  },
    { name: "DOCX", icon: FileText, color: "text-blue-500" },
    { name: "TXT",  icon: FileText, color: "text-cyan-500" },
  ]

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return

    setIsUploading(true)
    setUploadError(null)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} — invalid file type`); continue
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} — too large (max 50 MB)`); continue
      }

      const tid = toast.loading(`Analysing ${file.name}…`)
      try {
        const form = new FormData()
        form.append("file", file)

        const res  = await fetch(`${BACKEND_URL}/api/upload`, { method: "POST", body: form })
        const data = await res.json()

        if (res.ok && data.status === "success") {
          addFile({
            name:            data.file.name,
            size:            (data.file.size / 1024 / 1024).toFixed(2),
            type:            data.file.type,
            uploadedAt:      new Date().toISOString(),
            textLength:      data.text_length,
            relatedSections: data.sections_count,
          })

          toast.success(`✓ ${file.name} done!`, { id: tid })

          if (data.warnings?.search)
            toast(`⚠️ Search: ${data.warnings.search}`, { icon: "⚠️", duration: 6000 })
          if (data.warnings?.ai)
            toast(`⚠️ AI: ${data.warnings.ai}`, { icon: "⚠️", duration: 6000 })

          setAnalysisData(data)
          setShowAnalysis(true)
          if (onFilesUpdated) setTimeout(onFilesUpdated, 300)
        } else {
          const msg = data.error || "Upload failed"
          toast.error(`${file.name} — ${msg}`, { id: tid })
          setUploadError(msg)
        }
      } catch (err) {
        const msg = err.message.includes("Failed to fetch")
          ? "Cannot reach backend — is api.py running on port 5000?"
          : err.message
        toast.error(msg, { id: tid })
        setUploadError(msg)
      }
    }

    setIsUploading(false)
    e.target.value = ""
  }

  return (
    <>
      <div className="mx-4">
        <div className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 ${
          isDark ? "border-slate-600 bg-slate-800/50" : "border-slate-300 bg-slate-50/50"
        }`}>
          <div className="flex justify-center gap-4 mb-6">
            {formats.map(f => (
              <div key={f.name} className="flex flex-col items-center gap-1">
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>{f.name}</span>
              </div>
            ))}
          </div>

          <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Upload Legal Documents
          </h3>
          <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Drag and drop your files or click to browse
          </p>

          <input type="file" id="fileInput" onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt" multiple disabled={isUploading} className="hidden" />

          <label htmlFor="fileInput" className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
            isUploading
              ? "opacity-60 cursor-not-allowed bg-slate-500 text-white"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          }`}>
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isUploading ? "Analysing…" : "Upload Files"}
          </label>

          <p className={`text-xs mt-4 flex items-center justify-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <AlertCircle className="w-4 h-4" /> Maximum file size: 50 MB
          </p>

          {uploadError && (
            <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm text-left ${
              isDark ? "bg-red-900/30 border border-red-700 text-red-300" : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {showAnalysis && (
        <AnalysisResult isDark={isDark} data={analysisData} onClose={() => setShowAnalysis(false)} />
      )}
    </>
  )
}