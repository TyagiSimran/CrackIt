import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Search, Filter, ChevronDown, ChevronUp, BookOpen, Tag, Lightbulb, Star, Zap, User } from 'lucide-react'

const ROLE_CATEGORIES = {
    'Frontend Developer': ['All', 'Technical', 'Behavioral', 'System Design'],
    'Backend Developer': ['All', 'Technical', 'Behavioral', 'System Design'],
    'Fullstack Developer': ['All', 'Technical', 'Behavioral', 'System Design'],
    'Data Scientist': ['All', 'Technical', 'Aptitude'],
    'Data Analyst': ['All', 'Technical', 'Aptitude'],
    'AI/ML Engineer': ['All', 'Technical', 'Aptitude'],
    'HR': ['All', 'HR', 'Behavioral'],
    'All': ['All', 'HR', 'Technical', 'Behavioral', 'Aptitude', 'System Design']
}

const PROFILES = [
    'All', 'Frontend Developer', 'Backend Developer', 'Fullstack Developer',
    'Data Scientist', 'Data Analyst', 'Cloud Engineer', 'DevOps Engineer',
    'AI/ML Engineer', 'HR'
]

export default function QuestionBank() {
    const { user } = useAuth()
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('All')
    const [difficulty, setDifficulty] = useState('All')
    const [company, setCompany] = useState('All')
    const [profile, setProfile] = useState(user?.profile_role || 'All')
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState(null)

    const categories = ROLE_CATEGORIES[user?.profile_role] || ROLE_CATEGORIES['All']

    useEffect(() => {
        fetchQuestions()
    }, [category, difficulty, company, profile])

    const fetchQuestions = async () => {
        setLoading(true)
        try {
            const params = {}
            if (category !== 'All') params.category = category
            if (difficulty !== 'All') params.difficulty = difficulty
            if (company !== 'All') params.company = company
            if (profile !== 'All') params.profile = profile
            const res = await api.get('/questions', { params })
            setQuestions(res.data)
        } catch (err) {
            console.error('Error fetching questions:', err)
        } finally {
            setLoading(false)
        }
    }

    const filtered = questions.filter(q =>
        q.question_text.toLowerCase().includes(search.toLowerCase())
    )

    const difficultyColor = (d) => {
        const map = { Easy: 'bg-emerald-500/15 text-emerald-300', Medium: 'bg-amber-500/15 text-amber-300', Hard: 'bg-rose-500/15 text-rose-300' }
        return map[d] || ''
    }

    const categoryColor = (c) => {
        const map = {
            HR: 'bg-indigo-500/15 text-indigo-300',
            Technical: 'bg-cyan-500/15 text-cyan-300',
            Behavioral: 'bg-purple-500/15 text-purple-300',
            Aptitude: 'bg-amber-500/15 text-amber-300',
            'System Design': 'bg-rose-500/15 text-rose-300',
        }
        return map[c] || ''
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 page-enter space-y-4">
            {/* Header Area */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 py-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-black text-main tracking-tight flex items-center justify-center gap-2">
                        <BookOpen size={20} className="text-indigo-400" />
                        Curated Questions
                    </h1>
                    <p className="text-dim text-[11px] font-medium">Master every interview with our AI-vetted question bank.</p>
                </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="glass rounded-xl p-3 border-white/5 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                    {/* Search Field */}
                    <div className="lg:col-span-5 relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors z-10" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by keyword..."
                            className="input-field pl-10! w-full bg-surface/40 hover:bg-surface/60 transition-all rounded-lg py-1.5 border-white/5 text-xs"
                            id="question-search"
                        />
                    </div>

                    {/* Filter Indicators */}
                    <div className="lg:col-span-7 flex flex-wrap items-center gap-2 justify-end">
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <User size={12} className="text-indigo-400" />
                            <select value={profile} onChange={(e) => setProfile(e.target.value)} className="bg-transparent text-[11px] font-bold text-main outline-none cursor-pointer">
                                {PROFILES.map(p => <option key={p} value={p} className="bg-surface">{p === 'All' ? 'Target Role' : p}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Tag size={12} className="text-indigo-400" />
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent text-[11px] font-bold text-main outline-none cursor-pointer">
                                {categories.map(c => <option key={c} value={c} className="bg-surface">{c === 'All' ? 'Category' : c}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Filter size={12} className="text-cyan-400" />
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-transparent text-[11px] font-bold text-main outline-none cursor-pointer">
                                {['All', 'Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d} className="bg-surface">{d === 'All' ? 'Levels' : d}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Zap size={12} className="text-amber-400" />
                            <select value={company} onChange={(e) => setCompany(e.target.value)} className="bg-transparent text-[11px] font-bold text-main outline-none cursor-pointer max-w-[100px]">
                                <option value="All" className="bg-surface">Companies</option>
                                <option value="Google" className="bg-surface">Google</option>
                                <option value="Amazon" className="bg-surface">Amazon</option>
                                <option value="Microsoft" className="bg-surface">Microsoft</option>
                                <option value="Meta" className="bg-surface">Meta</option>
                                <option value="Netflix" className="bg-surface">Netflix</option>
                                <option value="Apple" className="bg-surface">Apple</option>
                                <option value="TCS" className="bg-surface">TCS</option>
                                <option value="Infosys" className="bg-surface">Infosys</option>
                                <option value="Capgemini" className="bg-surface">Capgemini</option>
                                <option value="Cognizant" className="bg-surface">Cognizant</option>
                                <option value="Community Contributed" className="bg-surface">Community</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Feed */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="spinner w-12 h-12 border-4"></div>
                    <p className="text-dim font-bold animate-pulse">Syncing Database...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass rounded-[2rem] p-20 text-center space-y-4 border-dashed border-2 border-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-dim" />
                    </div>
                    <h3 className="text-2xl font-bold text-main">No Match Found</h3>
                    <p className="text-dim max-w-xs mx-auto">Try refining your search terms or adjusting filters.</p>
                    <button onClick={() => { setSearch(''); setCategory('All'); setDifficulty('All'); setCompany('All'); }} className="text-indigo-400 font-bold hover:underline">Clear all filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((q) => (
                        <div key={q.id} className={`glass rounded-3xl overflow-hidden transition-all duration-500 border border-white/5 hover:border-indigo-500/30 ${expanded === q.id ? 'ring-2 ring-indigo-500/20' : ''}`}>
                            {/* Card Header Content */}
                            <button
                                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                                className="w-full text-left p-2 sm:p-3 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${categoryColor(q.category)}`}>
                                            {q.category}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${difficultyColor(q.difficulty)}`}>
                                            {q.difficulty}
                                        </span>
                                        {q.company && q.company !== 'All' && (
                                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-300 border border-white/5">
                                                {q.company}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-bold text-main leading-snug group-hover:text-indigo-300 transition-colors">
                                        {q.question_text}
                                    </h3>
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${expanded === q.id ? 'bg-indigo-500 text-white rotate-180 shadow-lg shadow-indigo-500/50' : 'bg-white/5 text-slate-500'}`}>
                                    <ChevronDown size={16} />
                                </div>
                            </button>

                            {/* Expanded Detail Panel */}
                            {expanded === q.id && (
                                <div className="p-8 sm:p-10 bg-white/[0.02] border-t border-white/5 animate-slide-up space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Star size={16} />
                                            </div>
                                            <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Architectural Answer</h4>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-3xl group-hover:bg-emerald-500/10 transition-all opacity-50" />
                                            <p className="relative text-main text-lg leading-relaxed font-medium p-6 rounded-3xl border border-emerald-500/10 bg-surface/40">
                                                {q.sample_answer}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {q.explanation && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb size={16} className="text-cyan-400" />
                                                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">The Strategy</h4>
                                                </div>
                                                <p className="text-dim text-sm leading-relaxed font-medium pl-6 border-l-2 border-cyan-500/20">
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        )}

                                        {q.keywords && q.keywords.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={16} className="text-indigo-400" />
                                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Core Concepts</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pl-6">
                                                    {q.keywords.map((kw, i) => (
                                                        <span key={i} className="px-3 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {q.tips && (
                                        <div className="p-6 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <Lightbulb size={20} className="text-amber-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Insider Pro Tip</h4>
                                                <p className="text-dim text-sm font-medium leading-relaxed">{q.tips}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
