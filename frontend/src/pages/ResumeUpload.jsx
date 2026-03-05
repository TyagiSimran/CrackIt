import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useDropzone } from 'react-dropzone'
import { FileUp, Upload, File, CheckCircle, Sparkles, X, ChevronDown, ChevronUp, Play, Info, RotateCcw, Tag, Trash2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ResumeUpload() {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [expandedQ, setExpandedQ] = useState(null)
    const [previousResumes, setPreviousResumes] = useState([])
    const [loadingResumes, setLoadingResumes] = useState(true)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => {
        fetchResumes()
    }, [])

    const fetchResumes = async () => {
        try {
            const res = await api.get('/resume/')
            setPreviousResumes(res.data || [])
        } catch (err) {
            console.error('Failed to fetch resumes', err)
        } finally {
            setLoadingResumes(false)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        onDrop: (accepted) => {
            if (accepted.length > 0) {
                setFile(accepted[0])
                setError('')
                setResult(null)
            }
        },
        onDropRejected: () => {
            setError('Please upload a valid PDF file')
        },
    })

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await api.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setResult(res.data)
            fetchResumes() // Refresh list after upload
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please make sure the backend server is running.')
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteResume = async (resumeId) => {
        if (!confirm('Are you sure you want to delete this resume? This will also remove all associated AI prep questions.')) return

        setDeletingId(resumeId)
        try {
            await api.delete(`/resume/${resumeId}`)
            setPreviousResumes(prev => prev.filter(r => r.id !== resumeId))
        } catch (err) {
            console.error('Failed to delete resume:', err)
            const errorMsg = err.response?.data?.detail || 'Failed to delete resume. Please try again.'
            alert(errorMsg)
        } finally {
            setDeletingId(null)
        }
    }

    const reset = () => {
        setFile(null)
        setResult(null)
        setError('')
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-enter space-y-6 flex flex-col items-center">
            {/* Header Area */}
            <div className="flex flex-col items-center gap-2 mb-6 text-center w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    Resume Analysis
                </div>
                <h1 className="text-xl font-black text-main tracking-tight flex items-center gap-2">
                    <FileUp size={24} className="text-indigo-400" />
                    AI Resume Scan
                </h1>
                <p className="text-dim text-sm font-medium max-w-lg">Extract insights and generate hyper-personalized practicing material.</p>
            </div>

            {!result ? (
                <div className="w-full max-w-xl mx-auto animate-slide-up">
                    <div className="glass rounded-[1.5rem] p-6 hover-glow transition-all duration-500 text-center relative overflow-hidden">
                        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[80px]" />

                        {/* Dropzone Container */}
                        <div
                            {...getRootProps()}
                            className={`relative z-10 border-2 border-dashed rounded-[1rem] p-16 transition-all duration-500 group ${isDragActive
                                ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01]'
                                : file
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : 'border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.02]'
                                }`}
                        >
                            <input {...getInputProps()} id="resume-file-input" />
                            {file ? (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <File size={32} className="text-emerald-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-main">{file.name}</p>
                                        <p className="text-dim text-xs font-medium">{(file.size / 1024).toFixed(1)} KB PDF Detected</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-[10px] flex items-center gap-1.5"
                                    >
                                        <X size={12} /> Remove File
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6 py-10">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                        <Upload size={32} className="text-slate-500 group-hover:text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-main tracking-tight">Drop Resume PDF</p>
                                        <p className="text-dim text-xs font-medium">or <span className="text-indigo-400 underline decoration-2 underline-offset-4 pointer-events-none">browse library</span></p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-fadeIn">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4 mt-6 text-sm font-bold shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-xl"
                            id="upload-resume"
                        >
                            {uploading ? (
                                <>
                                    <div className="spinner w-5 h-5 border-2" />
                                    <span className="animate-pulse">Analyzing Experience...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>Decode & Generate Prep Material</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Previously Uploaded Resumes */}
                    {!loadingResumes && previousResumes.length > 0 && (
                        <div className="mt-6 glass rounded-[1.5rem] p-6">
                            <h3 className="text-sm font-bold text-main mb-4 flex items-center gap-2">
                                <Clock size={16} className="text-cyan-400" />
                                Previously Uploaded Resumes
                            </h3>
                            <div className="space-y-2">
                                {previousResumes.map((resume) => (
                                    <div
                                        key={resume.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                                <File size={16} className="text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-main truncate">{resume.filename}</p>
                                                <p className="text-[10px] text-dim">
                                                    {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                    {resume.extracted_skills?.length > 0 && ` • ${resume.extracted_skills.length} skills`}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteResume(resume.id)}
                                            disabled={deletingId === resume.id}
                                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 bg-transparent border-none cursor-pointer"
                                            title="Delete resume"
                                        >
                                            {deletingId === resume.id ? (
                                                <div className="spinner w-4 h-4 border-2" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-slide-up space-y-4 w-full">
                    {/* Success Feature Card */}
                    <div className="glass rounded-[1.5rem] p-4 flex items-center justify-between border-white/5 bg-gradient-to-r from-transparent to-indigo-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle size={20} className="text-emerald-400" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-black text-main tracking-tight">Analysis Complete</h3>
                                <p className="text-dim text-xs font-medium">{result.filename}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={reset} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-dim transition-all border border-white/5" title="New Upload">
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 gap-8 ${result.questions && result.questions.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-3xl mx-auto'}`}>
                        {/* Extracted Intel */}
                        <div className={`space-y-8 ${result.questions && result.questions.length > 0 ? 'lg:col-span-1' : ''}`}>
                            {result.skills && result.skills.length > 0 && (
                                <div className="glass rounded-[2rem] p-8 border-white/5 space-y-6">
                                    <h2 className="text-xl font-black text-main flex items-center gap-3">
                                        <Tag size={20} className="text-indigo-400" />
                                        Extracted Expertise
                                    </h2>
                                    <div className="flex flex-wrap gap-2.5">
                                        {result.skills.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="px-4 py-2 text-xs font-bold rounded-xl bg-surface/40 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.projects && result.projects.length > 0 && (
                                <div className="glass rounded-[2rem] p-8 border-white/5 space-y-6">
                                    <h2 className="text-xl font-black text-main flex items-center gap-3">
                                        <CheckCircle size={20} className="text-cyan-400" />
                                        Key Projects
                                    </h2>
                                    <div className="space-y-3">
                                        {result.projects.map((project, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                <span className="text-main font-bold text-[15px]">{project}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Generated Questions List */}
                        {result.questions && result.questions.length > 0 ? (
                            <div className="glass rounded-[2rem] p-8 border-white/5 flex flex-col h-full lg:col-span-2">
                                <div className="mb-8">
                                    <h2 className="text-xl font-black text-main flex items-center gap-3 mb-2">
                                        <Sparkles size={24} className="text-amber-400" />
                                        AI Deep Dive Prep
                                    </h2>
                                    <p className="text-dim text-sm font-medium">Generated {result.questions.length} hyper-relevant questions.</p>
                                </div>

                                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                    {result.questions.map((q, i) => (
                                        <div
                                            key={i}
                                            className={`p-6 rounded-2xl border transition-all duration-500 group cursor-pointer ${expandedQ === i ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'}`}
                                            onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                                                            P{i + 1}
                                                        </span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${(q.difficulty || 'Medium') === 'Hard' ? 'bg-rose-500/20 text-rose-400' :
                                                            (q.difficulty || 'Easy') === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                            }`}>
                                                            {q.difficulty || 'Medium'}
                                                        </span>
                                                    </div>
                                                    <p className="text-main font-bold leading-relaxed">{q.question_text || q}</p>
                                                </div>
                                                <div className={`mt-1 transition-all duration-500 ${expandedQ === i ? 'text-indigo-400 rotate-180' : 'text-slate-500'}`}>
                                                    <ChevronDown size={20} />
                                                </div>
                                            </div>

                                            {expandedQ === i && (
                                                <div className="mt-6 pt-6 border-t border-indigo-500/20 animate-slide-up space-y-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Info size={14} className="text-indigo-400" />
                                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Strategic Value</h4>
                                                        </div>
                                                        <p className="text-dim text-sm italic font-medium pl-6 border-l-2 border-indigo-500/20">
                                                            {q.explanation || 'Analyzes cross-functional leadership and technical depth.'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle size={14} className="text-emerald-400" />
                                                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Recommended Approach</h4>
                                                        </div>
                                                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                                            <p className="text-main text-sm leading-relaxed font-medium">{q.sample_answer || 'Reference your project XYZ while focusing on scalability decisions.'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="glass rounded-[2rem] p-8 border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <Sparkles size={32} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-main">No Prep Questions Generated</h3>
                                    <p className="text-dim text-sm mt-1 max-w-md mx-auto">
                                        We could not generate questions from this resume at this time. This is typically due to limited technical content in the resume. Try uploading a different resume or try again later.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
