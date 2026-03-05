import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Mic, MicOff, Volume2, VolumeX, Play, Send, CheckCircle, ArrowRight, RotateCcw, Trophy, TrendingUp, TrendingDown, AlertCircle, X, Target, FileUp, Zap, ChevronRight } from 'lucide-react'

const ROLE_TYPES = {
    'Frontend Developer': ['Technical', 'Behavioral', 'System Design', 'Resume-based'],
    'Backend Developer': ['Technical', 'Behavioral', 'System Design', 'Resume-based'],
    'Fullstack Developer': ['Technical', 'Behavioral', 'System Design', 'Resume-based'],
    'Data Scientist': ['Technical', 'Aptitude', 'Resume-based'],
    'Data Analyst': ['Technical', 'Aptitude', 'Resume-based'],
    'AI/ML Engineer': ['Technical', 'Aptitude', 'Resume-based'],
    'HR': ['HR', 'Behavioral', 'Resume-based'],
    'All': ['HR', 'Technical', 'Behavioral', 'System Design', 'Aptitude', 'Resume-based']
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const COMPANIES = [
    'All', 'Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 'Apple',
    'TCS', 'Infosys', 'Capgemini', 'Cognizant', 'Community Contributed'
]

const PROFILES = [
    'All', 'Frontend Developer', 'Backend Developer', 'Fullstack Developer',
    'Data Scientist', 'Data Analyst', 'Cloud Engineer', 'DevOps Engineer',
    'AI/ML Engineer'
]

export default function Interview() {
    const [searchParams] = useSearchParams()
    const { user } = useAuth()
    const [step, setStep] = useState('config') // config | interview | results
    const types = ROLE_TYPES[user?.profile_role] || ROLE_TYPES['All']
    const [type, setType] = useState(types[0])
    const [difficulty, setDifficulty] = useState('Medium')
    const [sessionId, setSessionId] = useState(null)
    const [questions, setQuestions] = useState([])
    const [currentQ, setCurrentQ] = useState(0)
    const [answer, setAnswer] = useState('')
    const [responses, setResponses] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [finalResult, setFinalResult] = useState(null)
    const [error, setError] = useState('')

    // Advanced filtering state
    const [company, setCompany] = useState('All')
    const [profile, setProfile] = useState('All')
    const [resumes, setResumes] = useState([])
    const [selectedResumeId, setSelectedResumeId] = useState(null)

    // Timer state
    const [timeLeft, setTimeLeft] = useState(0)
    const [timerActive, setTimerActive] = useState(false)

    // Voice state
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    useEffect(() => {
        const sessionIdParam = searchParams.get('session_id')
        if (sessionIdParam) {
            loadHistoricalResult(sessionIdParam)
        } else if (step === 'config') {
            fetchResumes()
        }
    }, [step, searchParams])

    const loadHistoricalResult = async (id) => {
        setLoading(true)
        try {
            const res = await api.get(`/interview/${id}`)
            setFinalResult(res.data.session)

            // Map DB responses to frontend format
            const normalizedResponses = (res.data.responses || []).map(r => ({
                question: r.question_text,
                answer: r.user_answer,
                score: r.ai_score,
                feedback: r.ai_feedback
            }))

            setResponses(normalizedResponses)
            setQuestions(normalizedResponses) // Use as questions for layout
            setStep('results')
        } catch (err) {
            console.error('Failed to load historical result', err)
            setError('Could not load interview history.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let interval = null
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (timeLeft === 0 && timerActive) {
            clearInterval(interval)
            setTimerActive(false)
            // Auto-submit on time out
            if (step === 'interview' && answer.trim()) {
                submitAnswer()
            } else if (step === 'interview') {
                // If no answer, maybe move to next anyway after a small delay
                setError("Time's up! Moving to next question...")
                setTimeout(() => {
                    setAnswer('No answer provided.')
                    submitAnswer()
                }, 2000)
            }
        }
        return () => clearInterval(interval)
    }, [timerActive, timeLeft])

    const fetchResumes = async () => {
        try {
            const res = await api.get('/resume/')
            setResumes(res.data)
        } catch (err) {
            console.error('Failed to fetch resumes', err)
        }
    }

    const startInterview = async () => {
        setError('')
        setLoading(true)
        try {
            const res = await api.post('/interview/start', {
                interview_type: type,
                difficulty,
                num_questions: 10,
                resume_id: type === 'Resume-based' ? selectedResumeId : null,
                company: type !== 'Resume-based' ? company : null,
                profile: type !== 'Resume-based' ? profile : null
            })
            setSessionId(res.data.session_id)
            setQuestions(res.data.questions)
            setResponses([])
            setCurrentQ(0)
            setStep('interview')

            // Start timer for first question based on backend metadata
            const firstQ = res.data.questions[0]
            setTimeLeft(firstQ.time_limit || (difficulty === 'Hard' ? 180 : difficulty === 'Easy' ? 90 : 120))
            setTimerActive(true)

            // Auto-speak first question if supported
            if (res.data.questions.length > 0) {
                speakQuestion(firstQ.text)
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start interview')
        } finally {
            setLoading(false)
        }
    }

    const speakQuestion = (text) => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel(); // limit to one speech at a time
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95; // Slightly slower for better comprehension

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Speech recognition is not supported in this browser. Try Chrome.');
            return;
        }

        if (isListening) {
            // Stop listening
            setIsListening(false);
            // recognition.stop() is handled by the instance attached to window if we wanted to manage it,
            // but the easiest way is just let it end or forcefully stop the global instance
            if (window._recognitionParams) {
                window._recognitionParams.stop();
            }
            return;
        }

        setError('');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    setAnswer(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + transcript + ' ');
                } else {
                    currentTranscript += transcript;
                }
            }
            // For interim results, we could display them separately, but for simplicity
            // we'll just let native dictation workflows append to the final answer.
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error !== 'no-speech') {
                setError(`Microphone error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        window._recognitionParams = recognition;
        recognition.start();
    }

    const submitAnswer = async () => {
        if (!answer.trim()) return
        setSubmitting(true)
        try {
            const res = await api.post(`/interview/${sessionId}/answer`, {
                question_number: currentQ + 1,
                question_text: questions[currentQ].text || questions[currentQ],
                user_answer: answer,
            })
            const newResponses = [...responses, { question: questions[currentQ].text || questions[currentQ], answer, ...res.data }]
            setResponses(newResponses)
            setAnswer('')

            // Stop TTS and STT
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            if (isListening && window._recognitionParams) window._recognitionParams.stop()
            setIsListening(false)

            if (currentQ + 1 < questions.length) {
                const nextQ = questions[currentQ + 1]
                setCurrentQ(currentQ + 1)
                setTimeLeft(nextQ.time_limit || (difficulty === 'Hard' ? 180 : difficulty === 'Easy' ? 90 : 120))
                setTimerActive(true)
                speakQuestion(nextQ.text)
            } else {
                // Complete the interview
                setTimerActive(false)
                const completeRes = await api.post(`/interview/${sessionId}/complete`)
                setFinalResult(completeRes.data)
                setStep('results')
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit answer')
        } finally {
            setSubmitting(false)
        }
    }

    const endInterview = async () => {
        if (responses.length === 0) {
            resetInterview()
            return
        }

        setLoading(true)
        setError('')
        try {
            // Stop TTS and STT
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            if (isListening && window._recognitionParams) window._recognitionParams.stop()
            setIsListening(false)
            setTimerActive(false)

            const completeRes = await api.post(`/interview/${sessionId}/complete`)
            setFinalResult(completeRes.data)
            setStep('results')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to end interview')
        } finally {
            setLoading(false)
        }
    }

    const resetInterview = () => {
        setStep('config')
        setSessionId(null)
        setQuestions([])
        setCurrentQ(0)
        setAnswer('')
        setResponses([])
        setFinalResult(null)
        setError('')
        if (window.speechSynthesis) window.speechSynthesis.cancel()
        if (isListening && window._recognitionParams) window._recognitionParams.stop()
        setIsListening(false)
        setIsSpeaking(false)
        setTimerActive(false)
        setTimeLeft(0)
    }

    const scoreColor = (score) => {
        if (score >= 7) return 'text-emerald-400'
        if (score >= 5) return 'text-amber-400'
        return 'text-rose-400'
    }

    const scoreBg = (score) => {
        if (score >= 7) return 'bg-emerald-500/10 border-emerald-500/20'
        if (score >= 5) return 'bg-amber-500/10 border-amber-500/20'
        return 'bg-rose-500/10 border-rose-500/20'
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 page-enter">
            {/* Config Step */}
            {step === 'config' && (
                <div className="max-w-4xl mx-auto animate-slide-up">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 mb-2 glow-primary">
                            <Zap size={18} className="text-white" />
                        </div>
                        <h1 className="text-xl font-black text-main tracking-tight">Setup Mock Interview</h1>
                        <p className="text-dim mt-1 text-sm font-medium">Configure your session for personalized preparation.</p>
                    </div>

                    <div className="glass rounded-xl p-6 hover-glow transition-all">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-dim mb-2 ml-1 uppercase tracking-wider">Interview Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {types.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`py-4 px-3 rounded-2xl text-sm font-bold transition-all border-2 cursor-pointer outline-none ${type === t
                                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                                : 'bg-surface/30 border-white/5 text-dim hover:border-white/10'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dim mb-4 ml-1 uppercase tracking-wider">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {DIFFICULTIES.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`py-4 px-3 rounded-2xl text-sm font-bold transition-all border-2 cursor-pointer outline-none ${difficulty === d
                                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                                : 'bg-surface/30 border-white/5 text-dim hover:border-white/10'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {type === 'Resume-based' ? (
                                <div className="animate-fadeIn">
                                    <label className="block text-sm font-bold text-dim mb-4 ml-1 uppercase tracking-wider">Target Resume</label>
                                    <div className="relative group">
                                        <select
                                            value={selectedResumeId || ''}
                                            onChange={(e) => setSelectedResumeId(e.target.value)}
                                            className="input-field w-full appearance-none bg-surface/50 border-white/5 focus:bg-surface py-4 rounded-2xl pl-12!"
                                        >
                                            <option value="" disabled>Select an uploaded resume...</option>
                                            {resumes.map(r => (
                                                <option key={r.id} value={r.id}>{r.filename} ({new Date(r.uploaded_at).toLocaleDateString()})</option>
                                            ))}
                                        </select>
                                        <FileUp size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <ChevronRight size={18} className="rotate-90" />
                                        </div>
                                    </div>
                                    {resumes.length === 0 && (
                                        <Link to="/resume" className="text-sm text-amber-500 mt-3 block hover:underline no-underline">
                                            No resumes found. Upload one first →
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn">
                                    <div>
                                        <label className="block text-sm font-bold text-dim mb-4 ml-1 uppercase tracking-wider">Company</label>
                                        <select
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            className="input-field w-full appearance-none bg-surface/50 border-white/5 py-4 rounded-2xl"
                                        >
                                            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dim mb-4 ml-1 uppercase tracking-wider">Profile</label>
                                        <select
                                            value={profile}
                                            onChange={(e) => setProfile(e.target.value)}
                                            className="input-field w-full appearance-none bg-surface/50 border-white/5 py-4 rounded-2xl"
                                        >
                                            {PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium animate-fadeIn">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={startInterview}
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-lg"
                                id="start-interview"
                            >
                                {loading ? <div className="spinner w-6 h-6 border-3" /> : <Play size={24} />}
                                {loading ? 'Preparing Session...' : 'Start Mock Interview Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interview Step (Focus Mode) */}
            {step === 'interview' && (
                <div className="max-w-4xl mx-auto animate-slide-up space-y-4">
                    {/* Focus Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass rounded-2xl px-6 py-3 border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] tracking-widest uppercase">
                                Q{currentQ + 1} / {questions.length}
                            </div>
                            <span className="text-dim text-[10px] font-medium hidden md:block">|</span>
                            <span className="text-dim text-[10px] font-bold tracking-wide uppercase">{type} Mode</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center min-w-[70px]">
                                <span className="text-[9px] text-dim uppercase font-bold tracking-tighter mb-0 leading-none">Time Remaining</span>
                                <span className={`text-lg font-black tabular-nums transition-colors ${timeLeft < 30 ? 'text-rose-500 animate-pulse' : 'text-main'}`}>
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                onClick={endInterview}
                                className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                                title="End session early"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 bg-[length:200%_100%] animate-gradient rounded-full transition-all duration-1000"
                            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {/* Question Card (Centered Focus) */}
                    <div className="glass rounded-xl p-6 relative overflow-hidden group hover-glow transition-all duration-700 min-h-[140px] flex flex-col justify-center">
                        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[80px]" />
                        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[80px]" />

                        <div className="relative text-center space-y-4">
                            <h2 className="text-lg md:text-xl font-bold text-main !leading-tight tracking-tight px-2 animate-fadeIn">
                                {questions[currentQ].text || questions[currentQ]}
                            </h2>

                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => {
                                        if (isSpeaking) {
                                            window.speechSynthesis.cancel();
                                            setIsSpeaking(false);
                                        } else {
                                            speakQuestion(questions[currentQ].text || questions[currentQ]);
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${isSpeaking
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 animate-pulse'
                                        : 'bg-white/5 text-dim hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    {isSpeaking ? 'Playing Audio...' : 'Read Aloud'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Answer Area */}
                    <div className="glass rounded-2xl p-6 relative space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-main">Your Response</h3>
                                <p className="text-dim text-[10px] font-medium leading-none mt-1">Be clear and detailed in your answer.</p>
                            </div>

                            <button
                                onClick={toggleListening}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${isListening
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 animate-pulse'
                                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/10'
                                    }`}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                {isListening ? 'Stop' : 'Voice Dictation'}
                            </button>
                        </div>

                        <div className="relative group">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className={`input-field min-h-[120px] bg-transparent border-none! focus:ring-0! text-base font-medium placeholder:text-slate-600 transition-all ${isListening ? 'animate-pulse text-indigo-400' : ''}`}
                                placeholder={isListening ? "Listening... Speak your answer now." : "I approach this problem by first analyzing..."}
                                id="answer-input"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-dim uppercase tracking-widest">{answer.length} Characters</span>
                            </div>

                            <button
                                onClick={submitAnswer}
                                disabled={submitting || !answer.trim()}
                                className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm font-bold shadow-indigo-500/20 hover:scale-[1.05] transition-all rounded-lg"
                                id="submit-answer"
                            >
                                {submitting ? (
                                    <div className="spinner w-5 h-5 border-3" />
                                ) : currentQ + 1 < questions.length ? (
                                    <>Submit & Next <ArrowRight size={20} /></>
                                ) : (
                                    <>Complete Interview <CheckCircle size={20} /></>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 'results' && finalResult && (
                <div className="max-w-6xl mx-auto animate-slide-up space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20 mb-1">
                            <Trophy size={20} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-main tracking-tight">Performance Decoded</h1>
                        <p className="text-dim text-sm font-medium">A deep dive into your session metrics.</p>
                    </div>

                    <div className="relative group">
                        <div className={`absolute inset-0 blur-2xl opacity-15 transition-opacity grayscale-0 ${finalResult.overall_score >= 7 ? 'bg-emerald-500' :
                            finalResult.overall_score >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                        <div className={`glass rounded-2xl p-4 relative border flex flex-col md:flex-row items-center justify-center gap-8 ${finalResult.overall_score >= 7 ? 'border-emerald-500/20' :
                            finalResult.overall_score >= 5 ? 'border-amber-500/20' : 'border-rose-500/20'
                            }`}>
                            <div className="text-center md:text-left">
                                <p className="text-dim text-[10px] font-extrabold uppercase tracking-widest mb-1">Final Score</p>
                                <div className="flex items-center gap-1">
                                    <span className={`text-5xl font-black leading-none drop-shadow-xl ${scoreColor(finalResult.overall_score)}`}>
                                        {Number(finalResult.overall_score).toFixed(1)}
                                    </span>
                                    <span className="text-xl text-dim font-bold self-end mb-1">/10</span>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-white/10 hidden md:block" />

                            <div className="flex items-center gap-12">
                                <div className="text-center">
                                    <p className="text-[9px] text-dim font-black uppercase tracking-tighter mb-0.5">Answered</p>
                                    <p className="text-lg font-bold text-main">{responses.length} / {questions.length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-dim font-black uppercase tracking-tighter mb-0.5">Difficulty</p>
                                    <p className="text-lg font-bold text-main">{difficulty}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-main flex items-center gap-2 ml-2">
                            <Target size={20} className="text-indigo-400" />
                            Question Analysis
                        </h2>
                        {responses.map((r, i) => (
                            <div key={i} className="glass rounded-xl overflow-hidden hover-glow transition-all duration-500">
                                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/[0.01]">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase">Q{i + 1}</span>
                                        </div>
                                        <p className="text-base font-bold text-main leading-tight">{r.question}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${r.score >= 7 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                                            r.score >= 5 ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                                                'bg-rose-500/10 border-rose-500/40 text-rose-400'
                                            }`}>
                                            <span className="text-lg font-black">{r.score}</span>
                                            <span className="text-[8px] uppercase font-bold opacity-70">Score</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] text-dim font-black uppercase tracking-widest">Your Answer</p>
                                        <div className="p-3 rounded-xl bg-surface/30 text-dim text-xs italic font-medium border border-white/5">
                                            {r.answer}
                                        </div>
                                    </div>

                                    {r.feedback && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {r.feedback.strengths && r.feedback.strengths.length > 0 && (
                                                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
                                                    <h4 className="text-emerald-400 font-bold text-[10px] mb-2 flex items-center gap-2 uppercase tracking-widest">
                                                        <TrendingUp size={12} /> Key Strengths
                                                    </h4>
                                                    <ul className="space-y-1">
                                                        {r.feedback.strengths.map((s, j) => (
                                                            <li key={j} className="text-main text-[11px] font-medium flex items-start gap-2">
                                                                <span className="text-emerald-500">✓</span> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {r.feedback.weaknesses && r.feedback.weaknesses.length > 0 && (
                                                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all">
                                                    <h4 className="text-rose-400 font-bold text-[10px] mb-2 flex items-center gap-2 uppercase tracking-widest">
                                                        <TrendingDown size={12} /> Improvement Areas
                                                    </h4>
                                                    <ul className="space-y-1">
                                                        {r.feedback.weaknesses.map((w, j) => (
                                                            <li key={j} className="text-main text-[11px] font-medium flex items-start gap-2">
                                                                <span className="text-rose-500">!</span> {w}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center pt-4 border-t border-white/5">
                        <button
                            onClick={resetInterview}
                            className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto text-lg font-black tracking-tight hover:scale-[1.05] transition-all rounded-xl shadow-xl"
                        >
                            <RotateCcw size={20} /> Practice Again
                        </button>
                        <p className="text-dim mt-4 text-xs font-medium">Consistency is the key to mastering your career.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
