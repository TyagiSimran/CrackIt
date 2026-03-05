import { useState, useEffect } from 'react'
import api from '../lib/api'
import {
    Shield, Plus, Pencil, Trash2, X, Save, Users, BookOpen, Mic, BarChart3,
    Search, FileText, TrendingUp, Award, Clock, Database, ChevronDown, ChevronUp, Filter
} from 'lucide-react'

const CATEGORIES = ['HR', 'Technical', 'Behavioral', 'Aptitude']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function AdminPanel() {
    const [tab, setTab] = useState('questions')
    const [questions, setQuestions] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [fullReport, setFullReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reportLoading, setReportLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState('created_at')
    const [sortDir, setSortDir] = useState('desc')
    const [expandedUser, setExpandedUser] = useState(null)
    const [form, setForm] = useState({
        category: 'Technical',
        difficulty: 'Medium',
        question_text: '',
        sample_answer: '',
        explanation: '',
        keywords: '',
        tips: '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [qRes, aRes] = await Promise.all([
                api.get('/questions'),
                api.get('/admin/analytics'),
            ])
            setQuestions(qRes.data)
            setAnalytics(aRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchFullReport = async () => {
        if (fullReport) return // Already loaded
        setReportLoading(true)
        try {
            const res = await api.get('/admin/full-report')
            setFullReport(res.data)
        } catch (err) {
            console.error('Failed to load full report', err)
        } finally {
            setReportLoading(false)
        }
    }

    const resetForm = () => {
        setForm({
            category: 'Technical', difficulty: 'Medium', question_text: '',
            sample_answer: '', explanation: '', keywords: '', tips: '',
        })
        setEditingId(null)
        setShowForm(false)
        setError('')
    }

    const startEdit = (q) => {
        setForm({
            category: q.category,
            difficulty: q.difficulty,
            question_text: q.question_text,
            sample_answer: q.sample_answer,
            explanation: q.explanation || '',
            keywords: (q.keywords || []).join(', '),
            tips: q.tips || '',
        })
        setEditingId(q.id)
        setShowForm(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        const body = {
            ...form,
            keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        }
        try {
            if (editingId) {
                await api.put(`/admin/questions/${editingId}`, body)
            } else {
                await api.post('/admin/questions', body)
            }
            resetForm()
            fetchData()
        } catch (err) {
            setError(err.response?.data?.detail || 'Action failed')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this question?')) return
        try {
            await api.delete(`/admin/questions/${id}`)
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    // Sorting & filtering for users
    const getFilteredUsers = () => {
        if (!fullReport?.users) return []
        let users = [...fullReport.users]

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            users = users.filter(u =>
                u.full_name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
            )
        }

        // Sort
        users.sort((a, b) => {
            let aVal = a[sortField]
            let bVal = b[sortField]
            if (typeof aVal === 'string') aVal = aVal.toLowerCase()
            if (typeof bVal === 'string') bVal = bVal.toLowerCase()
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
            return 0
        })

        return users
    }

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('desc')
        }
    }

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null
        return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    }

    const scoreColor = (score) => {
        if (score >= 7) return 'text-emerald-400'
        if (score >= 5) return 'text-amber-400'
        return 'text-rose-400'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-main flex items-center gap-3">
                    <Shield size={28} className="text-indigo-400" />
                    Admin Panel
                </h1>
                <p className="text-dim mt-1">Manage questions, view platform analytics & database reports</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => setTab('questions')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none ${tab === 'questions' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white bg-transparent'
                        }`}
                >
                    <BookOpen size={16} className="inline mr-1.5" /> Questions
                </button>
                <button
                    onClick={() => setTab('analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none ${tab === 'analytics' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white bg-transparent'
                        }`}
                >
                    <BarChart3 size={16} className="inline mr-1.5" /> Analytics
                </button>
                <button
                    onClick={() => { setTab('database'); fetchFullReport() }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none ${tab === 'database' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white bg-transparent'
                        }`}
                >
                    <Database size={16} className="inline mr-1.5" /> Database Reports
                </button>
            </div>

            {/* Questions Tab */}
            {tab === 'questions' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-dim">{questions.length} questions</p>
                        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-1.5 text-sm">
                            <Plus size={16} /> Add Question
                        </button>
                    </div>

                    {/* Form Modal */}
                    {showForm && (
                        <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-main">
                                    {editingId ? 'Edit Question' : 'Add New Question'}
                                </h2>
                                <button onClick={resetForm} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-dim mb-1">Category</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-dim mb-1">Difficulty</label>
                                        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="input-field">
                                            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-dim mb-1">Question</label>
                                    <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="input-field" required rows={2} />
                                </div>
                                <div>
                                    <label className="block text-sm text-dim mb-1">Sample Answer</label>
                                    <textarea value={form.sample_answer} onChange={e => setForm({ ...form, sample_answer: e.target.value })} className="input-field" required rows={3} />
                                </div>
                                <div>
                                    <label className="block text-sm text-dim mb-1">Explanation</label>
                                    <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} className="input-field" rows={2} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-dim mb-1">Keywords (comma-separated)</label>
                                        <input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-dim mb-1">Tips</label>
                                        <input value={form.tips} onChange={e => setForm({ ...form, tips: e.target.value })} className="input-field" />
                                    </div>
                                </div>
                                {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <Save size={16} /> {editingId ? 'Update' : 'Create'} Question
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Questions table */}
                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-dim text-left border-b border-border">
                                        <th className="px-5 py-3 font-medium">Question</th>
                                        <th className="px-5 py-3 font-medium">Category</th>
                                        <th className="px-5 py-3 font-medium">Difficulty</th>
                                        <th className="px-5 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q) => (
                                        <tr key={q.id} className="border-b border-slate-700/20 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-3 text-main max-w-xs truncate">{q.question_text}</td>
                                            <td className="px-5 py-3">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300">{q.category}</span>
                                            </td>
                                            <td className="px-5 py-3 text-main">{q.difficulty}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => startEdit(q)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-indigo-400 cursor-pointer bg-transparent border-none">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 cursor-pointer bg-transparent border-none">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {tab === 'analytics' && analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnalyticCard icon={<Users size={22} />} label="Total Users" value={analytics.total_users} color="from-indigo-500 to-indigo-600" />
                    <AnalyticCard icon={<Mic size={22} />} label="Total Interviews" value={analytics.total_interviews} color="from-cyan-500 to-cyan-600" />
                    <AnalyticCard icon={<BookOpen size={22} />} label="Total Questions" value={analytics.total_questions} color="from-emerald-500 to-emerald-600" />
                    <AnalyticCard icon={<BarChart3 size={22} />} label="Avg Platform Score" value={analytics.avg_score?.toFixed(1) || '0.0'} suffix="/10" color="from-amber-500 to-amber-600" />
                </div>
            )}

            {/* Database Reports Tab */}
            {tab === 'database' && (
                <div className="space-y-6 animate-slide-up">
                    {reportLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="spinner"></div>
                        </div>
                    ) : fullReport ? (
                        <>
                            {/* Platform Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <MiniStat label="Users" value={fullReport.total_users} icon={<Users size={16} />} color="text-indigo-400" />
                                <MiniStat label="Interviews" value={fullReport.total_interviews} icon={<Mic size={16} />} color="text-cyan-400" />
                                <MiniStat label="Completed" value={fullReport.total_completed_interviews} icon={<Award size={16} />} color="text-emerald-400" />
                                <MiniStat label="Resumes" value={fullReport.total_resumes} icon={<FileText size={16} />} color="text-rose-400" />
                                <MiniStat label="Questions" value={fullReport.total_questions} icon={<BookOpen size={16} />} color="text-amber-400" />
                                <MiniStat label="Avg Score" value={fullReport.avg_platform_score + '/10'} icon={<TrendingUp size={16} />} color="text-violet-400" />
                            </div>

                            {/* Question Categories Breakdown */}
                            {fullReport.question_categories && Object.keys(fullReport.question_categories).length > 0 && (
                                <div className="glass rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                                        <BookOpen size={20} className="text-amber-400" />
                                        Question Bank Breakdown
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {Object.entries(fullReport.question_categories).map(([cat, data]) => (
                                            <div key={cat} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                <p className="text-sm font-bold text-main">{cat}</p>
                                                <p className="text-2xl font-black text-indigo-400 mt-1">{data.total}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {Object.entries(data.difficulties || {}).map(([diff, count]) => (
                                                        <span key={diff} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${diff === 'Hard' ? 'bg-rose-500/15 text-rose-400' :
                                                            diff === 'Easy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                                                            }`}>
                                                            {diff}: {count}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Users Table */}
                            <div className="glass rounded-2xl p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                    <h3 className="text-lg font-bold text-main flex items-center gap-2">
                                        <Users size={20} className="text-indigo-400" />
                                        All Users ({fullReport.total_users})
                                    </h3>
                                    <div className="relative w-full sm:w-64">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search users..."
                                            className="input-field pl-9 py-2 text-sm"
                                            id="admin-user-search"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-dim text-left border-b border-border text-xs uppercase tracking-wider">
                                                <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                                                    <span className="flex items-center gap-1">Name <SortIcon field="full_name" /></span>
                                                </th>
                                                <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort('email')}>
                                                    <span className="flex items-center gap-1">Email <SortIcon field="email" /></span>
                                                </th>
                                                <th className="pb-3 pr-4 font-medium">Role</th>
                                                <th className="pb-3 pr-4 font-medium cursor-pointer select-none text-center" onClick={() => toggleSort('total_interviews')}>
                                                    <span className="flex items-center gap-1 justify-center">Interviews <SortIcon field="total_interviews" /></span>
                                                </th>
                                                <th className="pb-3 pr-4 font-medium cursor-pointer select-none text-center" onClick={() => toggleSort('avg_score')}>
                                                    <span className="flex items-center gap-1 justify-center">Avg Score <SortIcon field="avg_score" /></span>
                                                </th>
                                                <th className="pb-3 pr-4 font-medium text-center">Resumes</th>
                                                <th className="pb-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                                                    <span className="flex items-center gap-1">Joined <SortIcon field="created_at" /></span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {getFilteredUsers().map((u) => (
                                                <tr
                                                    key={u.id}
                                                    className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${expandedUser === u.id ? 'bg-indigo-500/5' : ''}`}
                                                    onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                                >
                                                    <td className="py-3 pr-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                                                {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span className="font-semibold text-main truncate">{u.full_name || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-4 text-dim text-xs truncate max-w-[200px]">{u.email}</td>
                                                    <td className="py-3 pr-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-dim'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-center">
                                                        <span className="font-bold text-main">{u.total_interviews}</span>
                                                        <span className="text-dim text-xs ml-1">({u.completed_interviews} done)</span>
                                                    </td>
                                                    <td className={`py-3 pr-4 text-center font-bold ${scoreColor(u.avg_score)}`}>
                                                        {u.avg_score > 0 ? `${u.avg_score}/10` : '—'}
                                                    </td>
                                                    <td className="py-3 pr-4 text-center font-medium text-main">{u.total_resumes}</td>
                                                    <td className="py-3 text-dim text-xs">
                                                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {getFilteredUsers().length === 0 && (
                                        <div className="text-center py-10 text-dim">
                                            <p>No users match your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Interviews */}
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                                    <Mic size={20} className="text-cyan-400" />
                                    Recent Interviews ({fullReport.recent_interviews?.length || 0})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-dim text-left border-b border-border text-xs uppercase tracking-wider">
                                                <th className="pb-3 pr-4 font-medium">User</th>
                                                <th className="pb-3 pr-4 font-medium">Type</th>
                                                <th className="pb-3 pr-4 font-medium">Difficulty</th>
                                                <th className="pb-3 pr-4 font-medium text-center">Score</th>
                                                <th className="pb-3 pr-4 font-medium">Status</th>
                                                <th className="pb-3 font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {(fullReport.recent_interviews || []).map((s) => (
                                                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 pr-4 font-medium text-main">{s.user_name}</td>
                                                    <td className="py-3 pr-4 text-main">{s.interview_type}</td>
                                                    <td className="py-3 pr-4">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${s.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400' :
                                                            s.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                                            }`}>
                                                            {s.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 pr-4 text-center font-bold ${s.overall_score ? scoreColor(Number(s.overall_score)) : 'text-dim'}`}>
                                                        {s.overall_score ? `${Number(s.overall_score).toFixed(1)}` : '—'}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                                                            }`}>
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-dim text-xs">
                                                        {s.started_at ? new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Resumes */}
                            {fullReport.recent_resumes && fullReport.recent_resumes.length > 0 && (
                                <div className="glass rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-rose-400" />
                                        Resume Uploads ({fullReport.recent_resumes.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-dim text-left border-b border-border text-xs uppercase tracking-wider">
                                                    <th className="pb-3 pr-4 font-medium">Filename</th>
                                                    <th className="pb-3 pr-4 font-medium">Skills Extracted</th>
                                                    <th className="pb-3 font-medium">Uploaded</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {fullReport.recent_resumes.map((r) => (
                                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-3 pr-4 font-medium text-main">{r.filename}</td>
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-wrap gap-1 max-w-md">
                                                                {(r.extracted_skills || []).slice(0, 5).map((skill, i) => (
                                                                    <span key={i} className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-300">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                                {(r.extracted_skills || []).length > 5 && (
                                                                    <span className="text-[10px] text-dim">+{r.extracted_skills.length - 5} more</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-dim text-xs">
                                                            {r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-dim">
                            <Database size={40} className="mx-auto mb-4 text-slate-600" />
                            <p>Failed to load database reports. Please try again.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function AnalyticCard({ icon, label, value, suffix = '', color }) {
    return (
        <div className="glass rounded-2xl p-5 card-hover">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-dim text-sm mb-1">{label}</p>
                    <p className="text-2xl font-bold text-main">
                        {value}<span className="text-base text-dim">{suffix}</span>
                    </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

function MiniStat({ label, value, icon, color }) {
    return (
        <div className="glass rounded-xl p-4 text-center">
            <div className={`${color} mb-1 flex items-center justify-center`}>{icon}</div>
            <p className="text-xl font-black text-main">{value}</p>
            <p className="text-[10px] text-dim font-bold uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    )
}
