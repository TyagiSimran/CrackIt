import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react'

export default function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Frontend validation
        const hasCapital = /[A-Z]/.test(password)
        const hasNumber = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        if (password.length < 6 || !hasCapital || !hasNumber || !hasSpecial) {
            setError('Password must be at least 6 characters, contain 1 capital letter, 1 number, and 1 special character.')
            return
        }

        setLoading(true)
        try {
            await register(email, password, fullName)
            navigate('/dashboard')
        } catch (err) {
            console.error('Registration error:', err)
            const detail = err.response?.data?.detail || err.message || 'Unknown error'
            setError(`Registration failed: ${detail}${err.response ? ` (${err.response.status})` : ''}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-md animate-slide-up">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 mb-4">
                        <Zap size={32} className="text-white fill-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Join <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">CrackIt</span></h1>
                    <p className="text-slate-400 text-sm font-medium mt-2">Create your account to start preparing</p>
                </div>

                <div className="glass rounded-[2rem] p-10 hover-glow transition-all duration-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium animate-fadeIn">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-dim mb-2 ml-1">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="input-field pl-12! bg-surface/50 border-white/5 focus:bg-surface transition-all rounded-xl py-3.5"
                                    placeholder="your name"
                                    required
                                    id="register-name"
                                />
                            </div>
                        </div>

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
                                    id="register-email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-dim mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12! pr-12! bg-surface/50 border-white/5 focus:bg-surface transition-all rounded-xl py-3.5"
                                    placeholder="••••••••"
                                    required
                                    id="register-password"
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
                            id="register-submit"
                        >
                            {loading ? <div className="spinner w-5 h-5 border-2" /> : <UserPlus size={20} />}
                            {loading ? 'Creating Profile...' : 'Get Started Now'}
                        </button>
                    </form>

                    <div className="mt-10 text-center border-t border-white/5 pt-8">
                        <p className="text-dim text-sm font-medium">
                            Already a member?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold no-underline ml-1">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
