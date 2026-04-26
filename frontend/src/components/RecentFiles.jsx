import { Download, Eye, Trash2, FileText, Clock, HardDrive } from 'lucide-react'
import { removeFile, getRecentFiles, downloadFile } from '../utils/storage'
import toast from 'react-hot-toast'
import { useState } from 'react'
import PDFViewer from './PDFViewer'

export default function RecentFiles({ isDark, onFileDeleted }) {
  const recentFiles = getRecentFiles()
  const [hoveredFile, setHoveredFile] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Get file type icon
  const getFileIcon = (type) => {
    if (type === 'application/pdf') return 'PDF'
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOC'
    if (type === 'text/plain') return 'TXT'
    return 'FILE'
  }

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (typeof bytes === 'string') {
      return bytes + ' MB'
    }
    return bytes > 1024 ? (bytes / 1024).toFixed(1) + ' MB' : bytes + ' KB'
  }

  // Handle view file - open in modal
  const handleView = (file) => {
    setSelectedFile(file)
    toast.success('Opening file...')
  }

  // Handle download file
  const handleDownload = (file) => {
    try {
      downloadFile(file)
      toast.success('File downloaded!')
    } catch (error) {
      toast.error('Error downloading file')
    }
  }

  // Handle delete file
  const handleDelete = (file) => {
    if (file.isDummy) {
      toast.error('Cannot delete sample files')
      return
    }

    if (confirm(`Delete "${file.name}"?`)) {
      try {
        removeFile(file.id)
        toast.success('File deleted!')
        if (onFileDeleted) {
          onFileDeleted()
        }
      } catch (error) {
        toast.error('Error deleting file')
      }
    }
  }

  // Empty state
  if (recentFiles.length === 0) {
    return (
      <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
        <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
        <p className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          No recent documents
        </p>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Your recently uploaded documents will appear here
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {recentFiles.map((file) => (
          <div
            key={file.id}
            onMouseEnter={() => setHoveredFile(file.id)}
            onMouseLeave={() => setHoveredFile(null)}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-600' : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400'
            }`}
          >
            {/* File Icon */}
            <div className={`p-3 rounded-lg flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <FileText className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>

            {/* File Information */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {file.name}
              </h4>
              <div className={`flex gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(file.uploadedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {formatFileSize(file.size)}
                </span>
                {file.isDummy && (
                  <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Sample
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {hoveredFile === file.id && (
                <>
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
                </>
              )}
            </div>
          </div>
        ))}
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
