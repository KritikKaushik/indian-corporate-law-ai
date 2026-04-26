import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Trash2, Loader2, Brain,
  BookOpen, AlertTriangle, Shield, CheckCircle2,
  XCircle, Eye, Sparkles, FolderOpen, Search, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useFileStore } from '../store/fileStore'
import { documentAPI, summarizeAPI } from '../utils/api'
import FileViewer from './FileViewer'
import { ContentLoader } from './Loader'

const STATUS = {
  done:       { cls: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Ready' },
  processing: { cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'Processing' },
  failed:     { cls: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Failed' },
  uploaded:   { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Queued' },
}

const TABS = [
  { id: 'file',        label: 'Preview',     icon: Eye           },
  { id: 'summary',     label: 'Summary',     icon: Brain         },
  { id: 'clauses',     label: 'Clauses',     icon: BookOpen      },
  { id: 'obligations', label: 'Obligations', icon: FileText      },
  { id: 'risks',       label: 'Risks',       icon: AlertTriangle },
  { id: 'compliance',  label: 'Compliance',  icon: Shield        },
]

function ListSection({ items, theme, emptyMsg }) {
  if (!items?.length) return (
    <p className="text-gray-500 dark:text-gray-400 text-sm py-2 font-poppins">
      {emptyMsg}
    </p>
  )

  const themes = {
    orange: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 border-l-orange-500 text-orange-900 dark:text-orange-100',
    green: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 border-l-green-500 text-green-900 dark:text-green-100',
    red: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 border-l-red-500 text-red-900 dark:text-red-100',
  }

  const activeTheme = themes[theme] || themes.orange;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`p-4 rounded-xl border border-l-[3px] text-sm font-poppins leading-relaxed transition-colors duration-150 ${activeTheme}`}
        >
          {item}
        </motion.div>
      ))}
    </div>
  )
}

function AnalysisContent({ summaryData, activeTab, activeDocId, filename }) {
  const { setSummary } = useFileStore()
  const isProcessing = summaryData?.status === 'processing' || summaryData?.status === 'uploaded'

  useEffect(() => {
    if (!isProcessing || !activeDocId) return
    const t = setInterval(async () => {
      try {
        const res = await summarizeAPI.get(activeDocId)
        setSummary(res)
      } catch {}
    }, 3000)
    return () => clearInterval(t)
  }, [isProcessing, activeDocId, setSummary])

  if (activeTab === 'file') return <FileViewer docId={activeDocId} filename={filename} />

  if (isProcessing) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-neutral-800" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-[1.5px] border-transparent border-b-orange-400 opacity-50" />
        <div className="absolute top-3.5 left-3.5 right-3.5 bottom-3.5 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Brain size={18} className="text-orange-500" />
        </div>
      </div>
      <div>
        <div className="font-outfit text-lg font-bold text-gray-900 dark:text-white mb-2">Analyzing document…</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-poppins">Running RAG pipeline against knowledge base</div>
      </div>
      <div className="flex gap-6">
        {['Chunking', 'Embedding', 'Searching', 'Generating'].map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-1.5">
            <motion.div animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }} className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium font-outfit tracking-wide">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (summaryData?.status === 'failed') return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <XCircle size={38} className="text-red-500 opacity-70" />
      <div className="font-outfit text-base font-bold text-gray-900 dark:text-white">Analysis Failed</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Re-upload the document to try again.</div>
    </div>
  )

  const d = {
    document_type: summaryData?.document_type || 'Legal Document',
    summary:       summaryData?.summary       || '',
    clauses:       summaryData?.clauses       || [],
    obligations:   summaryData?.obligations   || [],
    risks:         summaryData?.risks         || [],
    compliance:    summaryData?.compliance    || '',
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto h-full max-w-5xl mx-auto w-full">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {activeTab === 'summary' && (
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 self-start">
                <Sparkles size={14} className="text-orange-500" />
                <span className="text-xs text-orange-500 font-bold font-outfit tracking-wide uppercase">{d.document_type}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-loose whitespace-pre-wrap font-poppins">{d.summary || 'No summary available.'}</p>
            </div>
          )}
          {activeTab === 'clauses'      && <ListSection items={d.clauses}      theme="orange" emptyMsg="No clauses identified." />}
          {activeTab === 'obligations'  && <ListSection items={d.obligations}  theme="green"  emptyMsg="No obligations identified." />}
          {activeTab === 'risks'        && <ListSection items={d.risks}        theme="red"    emptyMsg="No risks identified." />}
          {activeTab === 'compliance'   && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-900 dark:text-blue-100 transition-colors duration-150 leading-relaxed font-poppins border-l-[3px] border-l-blue-500">
              {d.compliance || 'No compliance information available.'}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function DocumentsView() {
  const { files, setFiles, activeDocId, summaryData, setActive, setSummary, clearActive } = useFileStore()
  const [activeTab, setActiveTab] = useState('file')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploadHovered, setUploadHovered] = useState(false)
  const inputRef = useRef(null)

  const fetchFiles = async () => {
    try { const r = await documentAPI.list(); setFiles(r.documents || []) } catch {}
  }

  useEffect(() => { 
    setLoading(true)
    fetchFiles().finally(() => setLoading(false))
  }, [])

  const hasProcessingFiles = files.some((f) => ['processing', 'uploaded'].includes(f.status))
  useEffect(() => {
    if (!hasProcessingFiles) return
    const t = setInterval(fetchFiles, 4000)
    return () => clearInterval(t)
  }, [hasProcessingFiles])

  const handleSelect = async (doc) => {
    setActive(doc.doc_id, { status: doc.status, filename: doc.filename, doc_id: doc.doc_id })
    setActiveTab('file')
    if (doc.status === 'done') {
      try { const res = await summarizeAPI.get(doc.doc_id); setSummary(res) } catch {}
    } else if (doc.status === 'uploaded') {
      try { await summarizeAPI.trigger(doc.doc_id) } catch {}
      setSummary({ status: 'processing', filename: doc.filename, doc_id: doc.doc_id })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0])
  }

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const tid = toast.loading(`Uploading ${file.name}…`)
    try {
      const res = await documentAPI.upload(file)
      toast.success('Uploaded — analyzing…', { id: tid })
      try { await summarizeAPI.trigger(res.doc_id) } catch {}
      setActive(res.doc_id, { status: 'processing', filename: res.filename, doc_id: res.doc_id })
      setActiveTab('file')
      await fetchFiles()
    } catch (err) {
      toast.error(err.message.replace(/^\d+:\s*/, '').slice(0, 80), { id: tid })
    } finally { setUploading(false) }
  }

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    try {
      await documentAPI.delete(docId)
      if (activeDocId === docId) clearActive()
      await fetchFiles()
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const activeDoc = files.find((f) => f.doc_id === activeDocId)
  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-[calc(100vh-58px)] bg-transparent overflow-hidden flex-col md:flex-row transition-colors duration-300 relative">
      
      {/* Explicitly adding Orbs here so they show perfectly through the transparent background */}
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-[15%] -right-[8%] opacity-5 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[350px] h-[350px] -bottom-[20%] left-[15%] opacity-5 z-0" />

      <AnimatePresence mode="wait">
        {!activeDocId ? (
          <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full h-full overflow-y-auto p-4 md:p-10 relative z-10">
            <div className="max-w-5xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit tracking-tight">Documents</h1>
                <div className="flex items-center gap-2.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-neutral-800 px-4 py-2.5 rounded-xl w-full md:w-80 transition-colors duration-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shadow-sm">
                  <Search size={18} className="text-gray-400 dark:text-gray-500" />
                  <input type="text" placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-sm font-poppins" />
                </div>
              </div>

              {/* Dropzone */}
              <div
                className={`p-12 rounded-3xl flex flex-col items-center justify-center gap-4 mb-10 transition-all duration-200 border-2 border-dashed backdrop-blur-sm ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'} ${dragging || uploadHovered ? 'border-orange-500 bg-orange-500/10' : 'border-gray-300 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60'}`}
                onMouseEnter={() => setUploadHovered(true)} onMouseLeave={() => setUploadHovered(false)}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                onDrop={handleDrop} onClick={() => !uploading && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} disabled={uploading} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-orange-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Uploading document...</span>
                  </div>
                ) : (
                  <>
                    <div className={`w-16 h-16 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex items-center justify-center transition-transform duration-200 ${uploadHovered ? '-translate-y-1' : ''}`}>
                      <Upload size={28} className={uploadHovered ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'} />
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 font-outfit">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">PDF, DOCX, or TXT files supported</p>
                    </div>
                  </>
                )}
              </div>

              {/* Files List */}
              <div className="flex items-center gap-2.5 mb-5">
                <FolderOpen size={18} className="text-gray-400 dark:text-gray-500" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white font-outfit">Recent Files {filteredFiles.length > 0 && `(${filteredFiles.length})`}</h3>
              </div>

              {loading ? (
                <ContentLoader rows={3} />
              ) : filteredFiles.length === 0 ? (
                <div className="text-center p-12 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-neutral-800">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-poppins">{searchQuery ? "No documents match your search." : "No documents uploaded yet."}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                  <AnimatePresence>
                    {filteredFiles.map((doc, i) => {
                      const s = STATUS[doc.status] || STATUS.uploaded
                      const name = doc.filename.replace(/\.[^.]+$/, '')
                      return (
                        <motion.div
                          key={doc.doc_id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelect(doc)}
                          className="p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-neutral-800 cursor-pointer flex items-start gap-4 transition-all duration-200 hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group"
                        >
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-orange-500 rounded-r-md opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                          <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 shadow-sm flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis mb-2.5 font-outfit" title={doc.filename}>{name}</div>
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase font-outfit border ${s.cls}`}>{s.label}</span>
                              <button
                                onClick={(e) => handleDelete(e, doc.doc_id)}
                                className="bg-transparent border-none cursor-pointer text-gray-400 dark:text-gray-500 p-1.5 opacity-0 transition-all duration-200 rounded-md hover:text-red-500 hover:bg-red-500/10 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          
          /* ── Detail Analysis View ── */
          <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }} className="w-full h-full flex flex-col relative z-10">
            
            {/* Header */}
            <div className="flex items-center gap-4 py-4 px-6 border-b border-gray-200 dark:border-neutral-800 bg-transparent backdrop-blur-md shrink-0">
              <button
                onClick={() => clearActive()}
                className="flex items-center gap-1.5 bg-transparent border-none text-gray-500 dark:text-gray-400 cursor-pointer text-sm font-semibold py-1.5 px-2.5 rounded-lg transition-colors duration-200 font-poppins hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-orange-500" />
                <h2 className="text-base m-0 text-gray-900 dark:text-white font-outfit font-semibold">{activeDoc?.filename}</h2>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 py-3 px-6 border-b border-gray-200 dark:border-neutral-800 bg-transparent backdrop-blur-md overflow-x-auto shrink-0 hide-scrollbar items-center">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id} onClick={() => setActiveTab(id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 border whitespace-nowrap font-outfit flex items-center gap-2 tracking-wide ${
                    activeTab === id 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 border-transparent' 
                    : 'text-gray-500 dark:text-gray-400 bg-transparent border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <Icon size={14} />{label}
                </button>
              ))}
              
              {summaryData?.status === 'done' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto">
                  <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-[11px] text-green-500 font-semibold font-poppins tracking-wide uppercase">Analysis Ready</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-transparent relative">
              <AnalysisContent summaryData={summaryData} activeTab={activeTab} activeDocId={activeDocId} filename={activeDoc?.filename} />
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}