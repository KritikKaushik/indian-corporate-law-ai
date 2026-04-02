import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, LogIn, Scale } from 'lucide-react'
import { setUser } from '../utils/storage'

export default function Login({ onLoginSuccess, isDark }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)


  // Login code for the users
  const handleLogin = (e) => {
    e.preventDefault()

    // Validation
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const user = {
        email,
        name: email.split('@')[0],
        loginTime: new Date().toISOString(),
      }
      setUser(user)
      setLoading(false)
      toast.success(`Welcome back, ${user.name}!`)
      onLoginSuccess(user)
    }, 1000)
  }


  // Demo login for quick access without registration
  const handleDemoLogin = () => {
    setLoading(true)
    setTimeout(() => {
      const user = {
        email: 'Pankaj@legalbuddy.com',
        name: 'Demo User',
        loginTime: new Date().toISOString(),
      }
      setUser(user)
      setLoading(false)
      toast.success('Demo login successful!')
      onLoginSuccess(user)
    }, 800)
  }



  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'
      }`}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${
              isDark ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
            } flex items-center justify-center mx-auto mb-4 shadow-lg`}
          >
            <Scale className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Legal Buddy
          </h1>
        </div>

        <div
          className={`rounded-2xl shadow-2xl p-6 md:p-8 ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}
        >
          <h2 className={`text-xl md:text-2xl text-center font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Welcome Back
          </h2>
          <p className={`text-xs text-center md:text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Sign in to access your documents
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs md:text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div
                className={`relative flex items-center ${
                  isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-50 border border-slate-200'
                } rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all`}
              >
                <Mail className={`w-4 h-4 md:w-5 md:h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`ml-2 md:ml-3 flex-1 bg-transparent outline-none text-sm ${
                    isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-xs md:text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Password
              </label>
              <div
                className={`relative flex items-center ${
                  isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-50 border border-slate-200'
                } rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all`}
              >
                <Lock className={`w-4 h-4 md:w-5 md:h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`ml-2 md:ml-3 flex-1 bg-transparent outline-none text-sm ${
                    isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`p-1 ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 md:py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6 text-sm md:text-base"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center ${isDark ? 'border-t border-slate-600' : 'border-t border-slate-200'}`} />
            <div className={`relative flex justify-center text-xs md:text-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <span className={`px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>or try demo</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className={`w-full py-2.5 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
            }`}
          >
            Demo Login
          </button>

          {/* Footer */}
          <p className={`text-xs text-center mt-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pankaj@legalbuddy.com
          </p>
        </div>
      </div>
    </div>
  )
}
