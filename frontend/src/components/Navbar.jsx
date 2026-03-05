import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
    LayoutDashboard, BookOpen, Mic, FileUp, Shield, LogOut, Menu, X, Zap, User, Sun, Moon, Settings, ChevronDown
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/questions', label: 'Question Bank', icon: <BookOpen size={18} /> },
        { to: '/interview', label: 'Mock Interview', icon: <Mic size={18} /> },
        { to: '/resume', label: 'Resume Upload', icon: <FileUp size={18} /> },
    ]

    if (user?.role === 'admin') {
        navLinks.push({ to: '/admin', label: 'Admin', icon: <Shield size={18} /> })
    }

    const isActive = (path) => location.pathname === path

    return (
        <nav className="glass-strong sticky top-0 z-50 transition-all duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3 no-underline group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Zap size={22} className="text-white fill-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                            CrackIt
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    {user && (
                        <div className="hidden md:flex items-center gap-2 h-full">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative flex items-center gap-2 px-5 h-full text-sm font-bold no-underline transition-all duration-300 ${isActive(link.to)
                                        ? 'nav-link-active'
                                        : 'text-dim hover:text-white hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <span className={isActive(link.to) ? 'text-indigo-400' : ''}>
                                        {link.icon}
                                    </span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
                                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">
                                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={16} />}
                                        </div>
                                        <span className="text-xs font-bold text-main hidden lg:block">{user.full_name?.split(' ')[0]}</span>
                                        <ChevronDown size={14} className={`text-dim group-hover:text-white transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {profileOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setProfileOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-4 w-60 glass-strong p-2 rounded-[1.5rem] border border-white/10 shadow-2xl z-50 animate-slide-up">
                                                <div className="px-4 py-4 mb-2 bg-white/[0.03] rounded-2xl border border-white/5">
                                                    <p className="text-sm font-black text-main truncate leading-tight">{user.full_name}</p>
                                                    <p className="text-[10px] text-dim font-medium truncate uppercase tracking-widest mt-1">{user.email}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setProfileOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-dim hover:text-white hover:bg-indigo-500/10 rounded-xl transition-all no-underline"
                                                    >
                                                        <Settings size={18} className="text-indigo-400" />
                                                        Profile & Analytics
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    >
                                                        <LogOut size={18} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Mobile menu button */}
                        {user && (
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                {menuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Nav */}
                {menuOpen && user && (
                    <div className="md:hidden pb-6 space-y-2 animate-slide-up px-2">
                        <div className="w-full h-px bg-white/10 mb-4" />
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black no-underline transition-all ${isActive(link.to)
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                    : 'text-dim hover:text-white hover:bg-white/[0.03]'
                                    }`}
                            >
                                <div className={isActive(link.to) ? 'text-indigo-400' : 'text-slate-500'}>
                                    {link.icon}
                                </div>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    )
}
