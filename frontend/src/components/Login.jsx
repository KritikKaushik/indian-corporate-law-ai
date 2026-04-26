import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Gavel, BookOpen, Shield, Sun, Moon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authAPI } from '../utils/api'

const features = [
  { icon: Gavel,    label: 'Companies Act 2013', sub: 'Full RAG knowledge base indexed' },
  { icon: BookOpen, label: 'Clause Detection',   sub: '52 clause types recognized'     },
  { icon: Shield,   label: 'Risk Analysis',       sub: 'Compliance & obligations'       },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
})

export default function Login() {
  const [tab, setTab]     = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [show, setShow]   = useState(false)
  const [busy, setBusy]   = useState(false)
  const { login }         = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !pass) return toast.error('Please fill in all fields')
    if (pass.length < 8) return toast.error('Password must be at least 8 characters')
    setBusy(true)
    const tid = toast.loading(tab === 'login' ? 'Signing in…' : 'Creating account…')
    try {
      if (tab === 'signup') await authAPI.signup(email, pass)
      const data = await authAPI.login(email, pass)
      login({ access_token: data.access_token, user_id: data.user_id, email: data.email, name: data.email.split('@')[0] })
      toast.success(`Welcome, ${data.email.split('@')[0]}!`, { id: tid })
    } catch (err) {
      toast.error(err.message.replace(/^\d+:\s*/, '').slice(0, 80) || 'Authentication failed', { id: tid })
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* ── Ambient Orbs ── */}
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-32 -right-24 opacity-10 dark:opacity-5 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[300px] h-[300px] -bottom-32 -left-16 opacity-10 dark:opacity-[3%] z-0" />

      {/* ── Glassmorphism Card Structure ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col md:flex-row rounded-[30px] overflow-hidden border border-white/60 dark:border-neutral-800/50 shadow-2xl relative z-10 bg-white/60 dark:bg-black/40 backdrop-blur-xl"
      >
        {/* ── Left: Branding panel ── */}
        <div className="hidden md:flex flex-col w-[55%] bg-white/40 dark:bg-neutral-900/30 border-r border-white/60 dark:border-neutral-800/50 p-10 gap-6 relative overflow-hidden shrink-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.12)_0%,transparent_70%)] pointer-events-none" />

          <motion.div {...fadeUp(0.1)} className="flex items-center gap-3">
            <img src="/logo.png" alt="LegalBuddy Logo" className="w-7 h-7 object-contain" />
            <div>
              <div className="font-outfit text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">LegalBuddy</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium font-poppins">AI Legal Intelligence Platform</div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <h1 className="font-outfit text-3xl font-black leading-tight mb-3 text-gray-900 dark:text-white tracking-tight">
              AI-powered<br />
              <span className="bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-orange-500 bg-clip-text text-transparent">legal analysis</span><br />
              in seconds.
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-poppins">
              Upload contracts, agreements &amp; board resolutions.
              Get instant analysis grounded in Indian corporate law.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="flex flex-col gap-2">
            {features.map(({ icon: Icon, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-orange-500/5 border border-white/50 dark:border-neutral-800/50"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-orange-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white font-outfit">{label}</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-px font-poppins">{sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            {...fadeUp(0.4)}
            className="mt-auto py-3 px-4 rounded-xl bg-orange-500/5 border border-white/50 dark:border-neutral-800/50"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-poppins italic">
              "The only legal AI that reads the actual document — not just guesses."
            </p>
          </motion.div>
        </div>

        {/* ── Right: Auth form ── */}
        <div className="flex-1 bg-transparent p-8 md:p-10 flex flex-col justify-center gap-5 relative">
          
          <motion.button
            {...fadeUp(0)}
            onClick={toggleTheme}
            className="absolute top-4 right-4 border border-gray-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-2 rounded-xl cursor-pointer text-gray-600 dark:text-gray-400 flex items-center justify-center transition-all duration-200 hover:bg-white/80 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </motion.button>

          <div className="flex md:hidden items-center gap-2 mt-4">
            <img src="/logo.png" alt="LegalBuddy" className="w-6 h-6 object-contain" />
            <span className="font-outfit text-base font-extrabold text-gray-900 dark:text-white">
              LegalBuddy
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab + '-heading'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-outfit text-2xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins">
                {tab === 'login' ? 'Sign in to your workspace' : 'Get started — it\'s free'}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md rounded-xl p-1 gap-0.5 border border-white/60 dark:border-neutral-800/50">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 p-2 rounded-lg cursor-pointer text-xs font-semibold transition-all duration-200 ease-in-out font-outfit ${
                  tab === t ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase font-outfit">Email</label>
                  <div className="relative flex items-center">
                    <Mail size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com" required 
                      className="w-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-white/60 dark:border-neutral-800/60 rounded-xl text-gray-900 dark:text-white font-poppins text-sm py-3 pr-3 pl-9 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase font-outfit">Password</label>
                  <div className="relative flex items-center">
                    <Lock size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
                    <input
                      type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)}
                      placeholder="Min. 8 characters" required 
                      className="w-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-white/60 dark:border-neutral-800/60 rounded-xl text-gray-900 dark:text-white font-poppins text-sm py-3 pr-9 pl-9 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <button
                      type="button" onClick={() => setShow((s) => !s)}
                      className="absolute right-3 cursor-pointer text-gray-500 flex items-center bg-transparent border-none hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={busy}
              className={`mt-2 flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl font-outfit tracking-wide transition-all duration-200 shadow-md shadow-orange-500/30 ${
                busy ? 'opacity-80 cursor-not-allowed' : 'hover:bg-orange-400 hover:-translate-y-px hover:shadow-lg hover:shadow-orange-500/40 cursor-pointer'
              }`}
              whileTap={!busy ? { scale: 0.98 } : {}}
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {tab === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-xs text-gray-600 dark:text-gray-400 font-poppins mt-2">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              className="bg-transparent border-none cursor-pointer text-orange-500 font-semibold text-xs font-poppins hover:underline underline-offset-2"
            >
              {tab === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}