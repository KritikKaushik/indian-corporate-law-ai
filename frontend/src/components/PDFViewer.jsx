import { X } from 'lucide-react'

export default function PDFViewer({ file, isDark, onClose }) {
  if (!file) return null

  // Determine the view type based on file content and type
  const isPDF = file.type === 'application/pdf' || file.path?.endsWith('.pdf')
  const isBlob = file.isBlob || (file.content && file.content.startsWith('blob:'))
  const content = file.content || file.path

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full h-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col ${
        isDark ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          </button>
        </div>

        {/* PDF/Document View */}
        <div className="flex-1 overflow-auto">
          {isPDF ? (
            <embed
              src={content}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ minHeight: '500px' }}
            />
          ) : (
            <div className={`p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                File Preview
              </p>
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
                      pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
                    </style>
                  </head>
                  <body>
                    <pre>${content ? 'Document content displayed' : 'Unable to preview file'}</pre>
                  </body>
                  </html>
                `}
                width="100%"
                height="600px"
                style={{ border: 'none' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
