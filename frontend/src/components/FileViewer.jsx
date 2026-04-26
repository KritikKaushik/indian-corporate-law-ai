import { useEffect, useState, useRef } from 'react'
import { FileText, Download, Loader2, AlertCircle, Eye } from 'lucide-react'
import { fetchFileAsBlob } from '../utils/api'

export default function FileViewer({ docId, filename }) {
  const [blobUrl, setBlobUrl]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [fileType, setFileType] = useState(null)
  const prevUrl = useRef(null)

  useEffect(() => {
    if (!docId) { setBlobUrl(null); setError(null); return }
    if (prevUrl.current) { URL.revokeObjectURL(prevUrl.current); prevUrl.current = null }

    const ext = filename?.split('.').pop()?.toLowerCase()
    setFileType(ext)
    setLoading(true)
    setError(null)

    fetchFileAsBlob(docId)
      .then(blob => {
        const url = URL.createObjectURL(blob)
        prevUrl.current = url
        setBlobUrl(url)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    return () => {
      if (prevUrl.current) { URL.revokeObjectURL(prevUrl.current); prevUrl.current = null }
    }
  }, [docId, filename])

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl; a.download = filename || 'document'; a.click()
  }

  if (!docId) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 dark:text-gray-400">
      <Eye size={36} className="opacity-30" />
      <p className="text-sm font-poppins">Select a document to preview it</p>
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-3 text-gray-500 dark:text-gray-400">
      <Loader2 size={22} className="animate-spin text-orange-500" />
      <span className="text-sm font-poppins">Loading file…</span>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <AlertCircle size={32} className="text-red-500 opacity-70" />
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs font-poppins">Could not load file preview.<br />You can still view the analysis.</p>
    </div>
  )

  if (fileType === 'pdf' && blobUrl) return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px] font-outfit">{filename}</span>
        </div>
        <button onClick={handleDownload} className="bg-transparent text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 py-1.5 px-3 rounded-lg font-semibold text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 font-outfit hover:bg-gray-100 dark:hover:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white">
          <Download size={12} /> Download
        </button>
      </div>
      <iframe src={blobUrl} title={filename} className="flex-1 border-none bg-white min-h-0" />
    </div>
  )

  if (fileType === 'txt' && blobUrl) return (
    <TextViewer blobUrl={blobUrl} filename={filename} onDownload={handleDownload} />
  )

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <FileText size={28} className="text-orange-500" />
      </div>
      <div>
        <div className="font-outfit text-base font-bold text-black dark:text-white mb-1.5">{filename}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 font-poppins">
          {fileType?.toUpperCase()} files cannot be previewed in the browser.<br />Download to open in your local viewer.
        </div>
        <button onClick={handleDownload} className="bg-orange-500 text-white border-none py-2.5 px-6 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-150 flex items-center gap-2 font-outfit shadow-md shadow-orange-500/30 hover:bg-orange-400 hover:-translate-y-px hover:shadow-lg hover:shadow-orange-500/40">
          <Download size={15} /> Download File
        </button>
      </div>
    </div>
  )
}

function TextViewer({ blobUrl, filename, onDownload }) {
  const [text, setText] = useState('')
  useEffect(() => { fetch(blobUrl).then(r => r.text()).then(setText).catch(() => setText('Could not read file.')) }, [blobUrl])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">{filename}</span>
        </div>
        <button onClick={onDownload} className="bg-transparent text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 py-1.5 px-3 rounded-lg font-semibold text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 font-outfit hover:bg-gray-100 dark:hover:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white">
          <Download size={12} /> Download
        </button>
      </div>
      <pre className="flex-1 overflow-y-auto p-4 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words bg-transparent m-0">
        {text || 'Loading…'}
      </pre>
    </div>
  )
}