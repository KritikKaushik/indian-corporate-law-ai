import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings, Zap } from "lucide-react"

const BACKEND_URL = "http://localhost:5000"

export default function BackendStatus({ isDark }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [setupRunning, setSetupRunning] = useState(false)
  const [setupLog, setSetupLog] = useState([])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`)
      setStatus(await res.json())
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const runSetup = async () => {
    setSetupRunning(true)
    setSetupLog(["⏳ Running pipeline… (may take a few minutes on first run)"])
    try {
      const res = await fetch(`${BACKEND_URL}/api/setup`, { method: "POST" })
      const data = await res.json()
      setSetupLog(data.status === "success" ? data.steps : [`❌ ${data.error}`])
      if (data.status === "success") await fetchStatus()
    } catch (e) {
      setSetupLog([`❌ Cannot reach backend: ${e.message}`])
    } finally {
      setSetupRunning(false)
    }
  }

  if (!loading && !status) return (
    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${isDark ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-800"}`}>
      <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Backend not reachable</p>
        <p className="text-sm mt-1">Run <code className="bg-black/20 px-1 rounded">python api.py</code> in your backend folder.</p>
        <button onClick={fetchStatus} className="mt-2 text-sm underline flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Retry</button>
      </div>
    </div>
  )

  if (loading) return null

  const { pipeline_ready, pipeline, ollama_ok, model } = status || {}

  if (pipeline_ready && ollama_ok) return (
    <div className={`mb-6 p-3 rounded-xl border flex items-center gap-3 ${isDark ? "bg-green-900/30 border-green-700 text-green-300" : "bg-green-50 border-green-200 text-green-800"}`}>
      <CheckCircle className="w-5 h-5 shrink-0" />
      <Zap className="w-4 h-4" />
      <p className="text-sm font-medium flex-1">Backend ready · Model: <strong>{model}</strong></p>
      <button onClick={fetchStatus} className="opacity-40 hover:opacity-100"><RefreshCw className="w-4 h-4" /></button>
    </div>
  )

  const missing = pipeline ? Object.entries(pipeline).filter(([, v]) => !v).map(([k]) => k) : []

  return (
    <div className={`mb-6 p-4 rounded-xl border ${isDark ? "bg-yellow-900/20 border-yellow-700 text-yellow-200" : "bg-yellow-50 border-yellow-300 text-yellow-900"}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-yellow-500" />
        <div className="flex-1">
          <p className="font-semibold">Setup required</p>
          {!ollama_ok && (
            <p className="text-sm mt-1">⚠️ Ollama not running. Start it and run <code className="bg-black/20 px-1 rounded">ollama pull mistral</code></p>
          )}
          {missing.length > 0 && (
            <div className="mt-2 text-sm">
              <p>Missing: {missing.join(", ")}</p>
              <p className="text-xs opacity-70 mt-1">Place <strong>act.pdf</strong> in backend folder then click Run Setup.</p>
            </div>
          )}
          {setupLog.length > 0 && (
            <div className={`mt-3 p-2 rounded text-xs font-mono space-y-1 ${isDark ? "bg-black/30" : "bg-white/60"}`}>
              {setupLog.map((l, i) => <p key={i}>{l}</p>)}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {missing.length > 0 && (
              <button onClick={runSetup} disabled={setupRunning}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${setupRunning ? "opacity-50 cursor-not-allowed bg-slate-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                <Settings className={`w-4 h-4 ${setupRunning ? "animate-spin" : ""}`} />
                {setupRunning ? "Running…" : "Run Setup"}
              </button>
            )}
            <button onClick={fetchStatus} className="px-3 py-2 rounded-lg text-sm border opacity-60 hover:opacity-100 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}