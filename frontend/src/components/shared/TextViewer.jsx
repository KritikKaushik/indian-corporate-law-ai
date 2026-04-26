import { useState, useEffect } from 'react'
import { FileText, Download } from 'lucide-react'

export function TextViewer({ blobUrl, filename, onDownload }) {
  const [text, setText] = useState('')

  useEffect(() => {
    fetch(blobUrl)
      .then(r => r.text())
      .then(setText)
      .catch(() => setText('Could not read file.'))
  }, [blobUrl])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">
            {filename}
          </span>
        </div>
        <button
          onClick={onDownload}
          className="bg-transparent text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 py-1.5 px-3 rounded-lg font-semibold text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 font-outfit hover:bg-gray-100 dark:hover:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white"
        >
          <Download size={12} /> Download
        </button>
      </div>
      <pre className="flex-1 overflow-y-auto p-4 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words bg-transparent m-0">
        {text || 'Loading…'}
      </pre>
    </div>
  )
}
