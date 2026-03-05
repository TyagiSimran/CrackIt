import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../lib/api'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
    const { user } = useAuth()
    const [theme, setTheme] = useState(user?.theme_preference || 'dark')

    useEffect(() => {
        if (user?.theme_preference) {
            setTheme(user.theme_preference)
        }
    }, [user])

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
        localStorage.setItem('crackit_theme', theme)
    }, [theme])

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)

        if (user) {
            try {
                await api.put('/auth/profile', { theme_preference: newTheme })
            } catch (err) {
                console.error('Failed to save theme preference', err)
            }
        }
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
