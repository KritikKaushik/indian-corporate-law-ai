import { useState, useEffect } from "react"
import { Toaster } from 'react-hot-toast'
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import HeroSection from "./components/HeroSection"
import TabSection from "./components/TabSection"
import UploadArea from "./components/UploadArea"
import DocumentFiles from "./components/DocumentFiles"
import RecentFiles from "./components/RecentFiles"
import SampleDocuments from "./components/SampleDocuments"
import Login from "./components/Login"
import BackendStatus from "./components/BackendStatus"
import { getUser, removeUser, getFiles, getTheme, setTheme } from "./utils/storage"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("pdf")
  const [activeMenu, setActiveMenu] = useState(2)
  const [isDark, setIsDark] = useState(false)
  const [files, setFiles] = useState([])
  const [user, setUser] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setIsDark(getTheme() === 'dark') }, [])

  useEffect(() => {
    const u = getUser()
    if (u) { setIsLoggedIn(true); setUser(u) }
  }, [])

  useEffect(() => {
    if (isLoggedIn) setFiles(getFiles())
  }, [isLoggedIn, refreshKey])

  useEffect(() => { setTheme(isDark ? 'dark' : 'light') }, [isDark])

  const handleLoginSuccess = (u) => { setIsLoggedIn(true); setUser(u); setRefreshKey(p => p + 1) }
  const handleLogout = () => { removeUser(); setIsLoggedIn(false); setUser(null); setFiles([]); setSidebarOpen(false) }
  const handleFilesUpdated = () => setRefreshKey(p => p + 1)

  if (!isLoggedIn) return <Login onLoginSuccess={handleLoginSuccess} isDark={isDark} />

  return (
    <div className={isDark ? 'dark' : ''}>
      <Toaster position="top-right" reverseOrder={false} gutter={8}
        toastOptions={{ duration: 4000, style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#1e293b',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}}
      />

      <div className={`min-h-screen ${isDark
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-50 text-slate-900'}`}>
        <div className="flex">
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} isDark={isDark} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

          <div className="flex-1 flex flex-col w-full md:ml-64">
            <Header isDark={isDark} setIsDark={setIsDark} onLogout={handleLogout} user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`flex-1 px-3 sm:px-4 md:px-6 lg:px-12 py-6 md:py-8 lg:py-12 overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-white/50'}`}>
              <HeroSection isDark={isDark} user={user} />
              <TabSection activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />

              {/* Dashboard */}
              {activeMenu === 1 && (
                <div className="space-y-8 md:space-y-10">
                  <BackendStatus isDark={isDark} />
                  <SampleDocuments isDark={isDark} />
                  {files.length > 0 && (
                    <section>
                      <h2 className={`text-xl md:text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Recent Files</h2>
                      <RecentFiles files={files} isDark={isDark} onFileDeleted={handleFilesUpdated} />
                    </section>
                  )}
                  <section>
                    <h2 className={`text-xl md:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Upload Your Documents</h2>
                    <UploadArea isDark={isDark} onFilesUpdated={handleFilesUpdated} />
                  </section>
                </div>
              )}

              {/* Documents */}
              {activeMenu === 2 && (
                <div className="space-y-6 md:space-y-8">
                  <BackendStatus isDark={isDark} />
                  <UploadArea isDark={isDark} onFilesUpdated={handleFilesUpdated} />
                  <section>
                    <h2 className={`text-xl md:text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Documents ({files.length})</h2>
                    {files.length > 0
                      ? <DocumentFiles files={files} isDark={isDark} onFileDeleted={handleFilesUpdated} />
                      : <div className={`p-6 md:p-8 text-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>No documents yet. Upload your first document!</p>
                        </div>
                    }
                  </section>
                </div>
              )}

              {/* Recent */}
              {activeMenu === 5 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recently Uploaded</h2>
                  <RecentFiles isDark={isDark} onFileDeleted={handleFilesUpdated} />
                </div>
              )}

              {/* WIP */}
              {[3, 4, 6, 7, 8].includes(activeMenu) && (
                <div className={`flex items-center justify-center min-h-[500px] ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} rounded-xl p-6 md:p-8`}>
                  <img src="/work-in-progress.png" alt="Work in Progress" className="w-64 h-64 md:w-80 md:h-80 object-contain" />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App