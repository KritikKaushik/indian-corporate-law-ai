import { Download, Eye, Trash2, FileText, Clock, HardDrive } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { removeFile, downloadFile } from '../utils/storage'
import PDFViewer from './PDFViewer'

export default function DocumentFiles({ files, isDark, onFileDeleted }) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null) 
  

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return FileText
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return FileText
    if (type === 'text/plain') return FileText
    return FileText
  }

  const getColorScheme = (type) => {
    const schemes = {
      'application/pdf': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'PDF' },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'DOCX' },
      'text/plain': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', label: 'TXT' },
    }
    return schemes[type] || schemes['application/pdf']
  }

  // Formate date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format file size
  const formatSize = (size) => {
    if (typeof size === 'string') {
      return size + ' MB'
    }
    return size > 1024 ? (size / 1024).toFixed(1) + ' MB' : size + ' KB'
  }

  // Handle view file modal
  const handleView = (file) => {
    setSelectedFile(file)
    toast.success('Opening file...')
  }

  // Handle download file
  const handleDownload = (file) => {
    try {
      downloadFile(file)
      toast.success('File downloaded successfully!')
    } catch (error) {
      toast.error('Error downloading file')
      console.error('Download error:', error)
    }
  }

  // Handle delete file
  const handleDelete = (file) => {
    
    if (file.isDummy) {
      toast.error('Cannot delete sample files') // Sample files cannot be deleted
      return
    }

    if (confirm(`Delete "${file.name}"?`)) {
      try {
        removeFile(file.id)
        toast.success('File deleted successfully')
        if (onFileDeleted) {
          onFileDeleted()
        }
      } catch (error) {
        toast.error('Error deleting file')
        console.error('Delete error:', error)
      }
    }
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
        <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
        <p className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          No documents uploaded yet
        </p>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Upload your first legal document to get started
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const IconComponent = getFileIcon(file.type)
          const colorScheme = getColorScheme(file.type)

          return (
            <div
              key={file.id}
              onMouseEnter={() => setHoveredCard(file.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`${isDark ? 'bg-slate-800 border border-slate-700 hover:border-blue-600' : 'bg-white border border-slate-200 hover:border-blue-400'} rounded-xl p-6 transition-all duration-200 hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorScheme.bg}`}>
                  <IconComponent className={`w-6 h-6 ${colorScheme.text}`} />
                </div>
                
                {hoveredCard === file.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(file)}
                      className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
                      title="View"
                    >
                      <Eye className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
                      title="Download"
                    >
                      <Download className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                    </button>
                    {!file.isDummy && (
                      <button
                        onClick={() => handleDelete(file)}
                        className="p-2 rounded-lg transition-all bg-red-500/20 hover:bg-red-500/30"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${colorScheme.bg} ${colorScheme.text}`}>
                {colorScheme.label}
              </div>

              <h3 className={`font-semibold text-sm mb-3 line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {file.name}
              </h3>
              <div className="space-y-2 text-xs mb-3">
                <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
                <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <HardDrive className="w-4 h-4" />
                  <span>{formatSize(file.size)}</span>
                </div>
              </div>
              {file.isDummy && (
                <div className={`px-2 py-1 rounded text-xs font-medium ${colorScheme.bg} ${colorScheme.text}`}>
                  Sample File
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* PDF Viewer Modal */}
      {selectedFile && (
        <PDFViewer 
          file={selectedFile} 
          isDark={isDark} 
          onClose={() => setSelectedFile(null)} 
        />
      )}
    </>
  )
}
