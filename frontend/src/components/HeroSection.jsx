export default function HeroSection({ isDark, user }) {
  return (
    <div className="text-center mb-8 md:mb-12 px-4">
      <h1 className={`text-3xl md:text-5xl font-bold mb-2 ${
        isDark
          ? 'bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent'
      }`}>
        Legal Buddy
      </h1>
      
      {user && (
        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Your secure legal document manager
        </p>
      )}
      
      <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        Upload, store, and manage your legal documents securely. Access them anytime, anywhere.
      </p>
    </div>
  )
}