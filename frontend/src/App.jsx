import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import Login from './components/Login'
import Layout from './components/Layout'
import { PageLoader } from './components/Loader'

export default function App() {
  const { isLoggedIn } = useAuthStore()
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <AnimatePresence>
        {!appReady && <PageLoader show message="Initializing…" />}
      </AnimatePresence>
      {appReady && (isLoggedIn ? <Layout /> : <Login />)}
    </>
  )
}