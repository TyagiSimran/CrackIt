import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const [debug, setDebug] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setDebug('')
        setLoading(true)
        try {
            const userData = await login(email, password)
            setDebug(`Login OK! User: ${JSON.stringify(userData)}`)
            console.log('[CrackIt] Navigating to /dashboard...')
            navigate('/dashboard')
        } catch (err) {
            console.error('[CrackIt] Login error:', err)
            console.error('[CrackIt] Error details:', err.response?.status, err.response?.data, err.message)
            const detail = err.response?.data?.detail || err.message || 'Unknown error'
            setError(`Login failed: ${detail}${err.response ? ` (Status: ${err.response.status})` : ''}`)
            setDebug(`Error raw: ${JSON.stringify(err.response?.data || err.message)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-md animate-slide-up">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 mb-4">
                        <Zap size={32} className="text-white fill-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Welcome to <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">CrackIt</span></h1>
                    <p className="text-slate-400 text-sm font-medium mt-2">Sign in to your account</p>
                </div>

                {/* Form Card */}
                <div className="glass rounded-[2rem] p-10 hover-glow transition-all duration-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium animate-fadeIn">
                                {error}
                            </div>
                        )}
                        {debug && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono break-all">
                                <strong>DEBUG:</strong> {debug}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-dim mb-2 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-12! bg-surface/50 border-white/5 focus:bg-surface transition-all rounded-xl py-3.5"
                                    placeholder="name@company.com"
                                    required
                                    id="login-email"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label className="block text-sm font-bold text-dim">Password</label>
                                <Link to="/forgot-password" id="forgot-password-link" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold no-underline transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12! pr-12! bg-surface/50 border-white/5 focus:bg-surface transition-all rounded-xl py-3.5"
                                    placeholder="••••••••"
                                    required
                                    id="login-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dim hover:text-main transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl mt-4"
                            id="login-submit"
                        >
                            {loading ? <div className="spinner w-5 h-5 border-2" /> : <LogIn size={20} />}
                            {loading ? 'Authenticating...' : 'Sign In Now'}
                        </button>
                    </form>

                    <div className="mt-10 text-center border-t border-white/5 pt-8">
                        <p className="text-dim text-sm font-medium">
                            New to CrackIt?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold no-underline ml-1">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
