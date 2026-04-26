import { useState } from 'react'
import { Download, Eye, FileText } from 'lucide-react'
import PDFViewer from './PDFViewer'
import toast from 'react-hot-toast'

export default function SampleDocuments({ isDark }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(null)
  const [sampleDocs] = useState([
    {
      id: 'sample-1',
      name: 'Case Law Analysis Template',
      type: 'pdf',
      size: '452 KB',
      uploadedAt: 'Jan 15',
      path: '/Case_Law_Analysis_Template.pdf',
      isSample: true,
      description: 'Template for analyzing case law'
    },
    {
      id: 'sample-2',
      name: 'Compliance Checklist',
      type: 'pdf',
      size: '328 KB',
      uploadedAt: 'Jan 10',
      path: '/Compliance_Checklist.pdf',
      isSample: true,
      description: 'Comprehensive compliance reference'
    },
    {
      id: 'sample-3',
      name: 'Contract Review Guidelines',
      type: 'pdf',
      size: '567 KB',
      uploadedAt: 'Jan 20',
      path: '/Contract_Review_Guidelines.pdf',
      isSample: true,
      description: 'Contract analysis guidelines'
    },
    {
      id: 'sample-4',
      name: 'Employment Law Guide',
      type: 'pdf',
      size: '421 KB',
      uploadedAt: 'Jan 12',
      path: '/Employment_Law_Guide.pdf',
      isSample: true,
      description: 'Employment law reference guide'
    },
    {
      id: 'sample-5',
      name: 'Intellectual Property Rights',
      type: 'pdf',
      size: '634 KB',
      uploadedAt: 'Jan 18',
      path: '/Intellectual_Property_Rights.pdf',
      isSample: true,
      description: 'IP rights overview'
    },
  ])

  const handleView = async (file) => {
    setLoading(file.id)
    try {
      const response = await fetch(file.path)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setSelectedFile({
        ...file,
        content: url,
        isBlob: true
      })
      toast.success('Document opened!')
    } catch (error) {
      console.error('Error loading document:', error)
      toast.error('Failed to load document')
    } finally {
      setLoading(null)
    }
  }

  const handleDownload = async (file) => {
    try {
      const response = await fetch(file.path)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${file.name}!`)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Sample Legal Documents
          </h3>
        </div>
        <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Explore sample documents to understand document management
        </p>
      </div>

      {/* Sample Documents Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sampleDocs.map((file) => (
          <div
            key={file.id}
            className={`group relative p-4 rounded-xl transition-all duration-300 cursor-pointer border ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750'
                : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />

            {/* Content */}
            <div className="relative z-10">
              {/* File Icon and Type Badge */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-blue-100'}`}
                >
                  <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                  Sample
                </span>
              </div>

              {/* File Name */}
              <h4 className={`font-semibold text-sm mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {file.name}
              </h4>

              {/* Description */}
              <p className={`text-xs mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {file.description}
              </p>

              {/* File Size and Date */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {file.size} • {file.uploadedAt}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(file)}
                  disabled={loading === file.id}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {loading === file.id ? 'Loading...' : 'View'}
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
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
    </div>
  )
}
