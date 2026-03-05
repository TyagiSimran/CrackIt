import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { LayoutDashboard, Users, Clock, Award, TrendingUp, ChevronRight, Filter, Search, Calendar, Target, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/history'),
            ])
            setStats(statsRes.data)
            setHistory(historyRes.data)
        } catch (err) {
            console.error('Dashboard error:', err)
        } finally {
            setLoading(false)
        }
    }

    const scoreColor = (score) => {
        if (score >= 7) return 'score-high'
        if (score >= 5) return 'score-mid'
        return 'score-low'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner"></div>
            </div>
        )
    }

    const scoreHistory = history.map((s, i) => ({
        name: `#${i + 1}`,
        score: Number(s.overall_score) || 0,
        type: s.interview_type,
    }))

    const categoryBreakdown = stats?.category_scores || []

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-enter space-y-6">
            {/* Header */}
            <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-main tracking-tight">
                        Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{user?.full_name}</span>
                    </h1>
                    <p className="text-dim mt-0.5 text-sm font-medium">Master your interview preparation today.</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Target size={22} />}
                    label="Total Interviews"
                    value={stats?.total_interviews || 0}
                    color="from-indigo-500 to-indigo-600"
                />
                <StatCard
                    icon={<TrendingUp size={22} />}
                    label="Average Score"
                    value={stats?.avg_score?.toFixed(1) || '0.0'}
                    suffix="/10"
                    color="from-cyan-500 to-cyan-600"
                />
                <StatCard
                    icon={<Award size={22} />}
                    label="Best Score"
                    value={stats?.best_score?.toFixed(1) || '0.0'}
                    suffix="/10"
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard
                    icon={<Clock size={22} />}
                    label="Sessions This Week"
                    value={stats?.sessions_this_week || 0}
                    color="from-amber-500 to-amber-600"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Score Trend */}
                <div className="glass rounded-2xl p-6 hover-glow transition-all">
                    <h2 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-400" />
                        Score Performance Trend
                    </h2>
                    {scoreHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={scoreHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis domain={[0, 10]} stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(15, 23, 42, 0.9)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '1rem',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    dot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 6 }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[280px] text-dim border-2 border-dashed border-white/5 rounded-2xl">
                            <p>No interview data yet.</p>
                            <Link to="/interview" className="text-indigo-400 font-semibold mt-2 hover:underline">Start your first session</Link>
                        </div>
                    )}
                </div>

                {/* Category Scores */}
                <div className="glass rounded-2xl p-6 hover-glow transition-all">
                    <h2 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                        <Target size={18} className="text-cyan-400" />
                        Competency Breakdown
                    </h2>
                    {categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={categoryBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="category" stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis domain={[0, 10]} stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(15, 23, 42, 0.9)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '1rem',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                                <Bar dataKey="avg_score" radius={[8, 8, 0, 0]} barSize={40}>
                                    {categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                                    ))}
                                    <defs>
                                        {categoryBreakdown.map((_, index) => (
                                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                                                <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[280px] text-dim border-2 border-dashed border-white/5 rounded-2xl">
                            Complete interviews to see performance by category
                        </div>
                    )}
                </div>
            </div>

            {/* Recent History */}
            <div className="glass rounded-2xl overflow-hidden mb-6">
                <div className="p-6 pb-0 flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-main">Recent Activity</h2>
                    <Link to="/interview" className="btn-secondary text-[10px] py-1.5 px-3">
                        Practice New <ChevronRight size={12} />
                    </Link>
                </div>
                {history.length > 0 ? (
                    <div className="p-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-spacing-y-2 border-separate px-6">
                                <thead>
                                    <tr className="text-dim text-left uppercase text-[10px] tracking-widest font-bold">
                                        <th className="pb-4 pt-2">Type</th>
                                        <th className="pb-4 pt-2 text-center">Difficulty</th>
                                        <th className="pb-4 pt-2 text-center">Score</th>
                                        <th className="pb-4 pt-2">Date</th>
                                        <th className="pb-4 pt-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.slice(0, 10).map((session) => (
                                        <tr key={session.id} className="group hover:bg-white/[0.03] transition-all rounded-xl">
                                            <td className="py-4 pl-4 rounded-l-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                                    <span className="font-semibold text-main">{session.interview_type}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-tighter ${session.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400' :
                                                    session.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                    {session.difficulty}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-base font-bold ${scoreColor(session.overall_score)}`}>
                                                        {Number(session.overall_score).toFixed(1)}
                                                    </span>
                                                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                                        <div className={`h-full ${session.overall_score >= 7 ? 'bg-emerald-500' : session.overall_score >= 5 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${session.overall_score * 10}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-dim font-medium">
                                                {new Date(session.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 pr-4 text-right rounded-r-xl">
                                                <Link
                                                    to={`/interview?session_id=${session.id}`}
                                                    className="p-2 inline-flex rounded-lg bg-surface-light text-dim hover:text-white hover:bg-indigo-500 transition-all"
                                                >
                                                    <ChevronRight size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 text-dim">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Target size={30} className="text-slate-600" />
                        </div>
                        <p className="text-lg">No session activity found yet</p>
                        <Link to="/interview" className="btn-primary mt-6">
                            Kick off your first interview
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, suffix = '', color }) {
    return (
        <div className="glass rounded-2xl p-4 hover-glow group transition-all duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-dim text-sm font-medium mb-1 tracking-wide uppercase px-1">{label}</p>
                    <p className="text-2xl font-extrabold text-main tabular-nums">
                        {value}<span className="text-base text-dim ml-0.5">{suffix}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
