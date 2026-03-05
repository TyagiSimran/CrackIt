import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../lib/api'
import {
    User, Mail, Moon, Sun, Download, FileText, CheckCircle, Save,
    History, Award, Target, LayoutDashboard
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Profile() {
    const { user, setUser } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await api.get('/dashboard/history')
            setHistory(res.data)
        } catch (err) {
            console.error('Failed to fetch history', err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setUpdating(true)
        setMessage('')
        setError('')
        try {
            const res = await api.put('/auth/profile', { full_name: fullName })
            const updatedUser = { ...user, full_name: res.data.full_name }
            localStorage.setItem('crackit_user', JSON.stringify(updatedUser))
            setUser(updatedUser)
            setMessage('Profile updated successfully!')
        } catch (err) {
            setError('Failed to update profile')
        } finally {
            setUpdating(false)
        }
    }

    const downloadReport = async (sessionId, type) => {
        try {
            const endpoint = sessionId ? `/interview/${sessionId}/report` : '/interview/overall/report'
            const response = await api.get(endpoint, { responseType: 'blob' })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            const filename = sessionId ? `Interview_Report_${sessionId.slice(0, 8)}.pdf` : 'Overall_Performance_Report.pdf'
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            console.error('Download error:', err)
            alert('Failed to download report. Please try again.')
        }
    }

    const scoreColor = (score) => {
        if (score >= 7) return 'text-emerald-400'
        if (score >= 5) return 'text-amber-400'
        return 'text-rose-400'
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight">Profile Settings</h1>
                    <p className="text-dim text-lg font-medium mt-1">Manage your account and view your performance reports</p>
                </div>
                <Link to="/dashboard" className="btn-secondary flex items-center gap-2 no-underline">
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-main mb-6 flex items-center gap-2">
                            <User size={20} className="text-indigo-400" />
                            Personal Info
                        </h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            {message && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    {message}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-dim mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="input-field pl-10!"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dim mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                                    <input
                                        type="email"
                                        value={user?.email}
                                        className="input-field pl-10! opacity-60 cursor-not-allowed"
                                        disabled
                                    />
                                </div>
                                <p className="text-[10px] text-dim mt-1">Email cannot be changed</p>
                            </div>

                            <button
                                type="submit"
                                disabled={updating}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                            >
                                {updating ? <div className="spinner w-5 h-5" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-main mb-6 flex items-center gap-2">
                            {theme === 'dark' ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-400" />}
                            Appearance
                        </h2>

                        <div className="flex items-center justify-between p-3 rounded-xl glass border-none">
                            <div>
                                <p className="text-sm font-medium text-main">Theme Mode</p>
                                <p className="text-xs text-dim">{theme === 'dark' ? 'Dark' : 'Light'} mode active</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Reports & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overall Report Section */}
                    <div className="glass rounded-2xl p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Award size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-main">Overall Performance Report</h3>
                                    <p className="text-dim text-sm">Download a summary of all your mock interviews and AI feedback.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => downloadReport(null)}
                                className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-indigo-500/20"
                            >
                                <Download size={20} />
                                Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Interview History Table */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-main mb-6 flex items-center gap-2">
                            <History size={20} className="text-cyan-400" />
                            Interview History
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="spinner" />
                            </div>
                        ) : history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-dim text-left border-b border-border">
                                            <th className="pb-4 font-medium italic">Type</th>
                                            <th className="pb-4 font-medium italic">Score</th>
                                            <th className="pb-4 font-medium italic">Date</th>
                                            <th className="pb-4 font-medium italic text-right">Report</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.map((session) => (
                                            <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 font-medium text-main">
                                                    {session.interview_type}
                                                    <span className="block text-[10px] text-dim font-normal">{session.difficulty}</span>
                                                </td>
                                                <td className={`py-4 font-bold ${scoreColor(session.overall_score)}`}>
                                                    {Number(session.overall_score).toFixed(1)}/10
                                                </td>
                                                <td className="py-4 text-dim">
                                                    {new Date(session.started_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => downloadReport(session.id)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                        title="Download Report"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-surface-light rounded-xl border border-dashed border-border">
                                <Target size={32} className="mx-auto text-dim mb-3" />
                                <p className="text-dim">No interviews completed yet.</p>
                                <Link to="/interview" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2 inline-block no-underline">
                                    Start your first interview
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
