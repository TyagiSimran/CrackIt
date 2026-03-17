import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('crackit_token')
        const savedUser = localStorage.getItem('crackit_user')
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser))
            } catch {
                localStorage.removeItem('crackit_token')
                localStorage.removeItem('crackit_user')
            }
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        console.log('[CrackIt] Starting login request...')
        const res = await api.post('/auth/login', { email, password })
        console.log('[CrackIt] Login response status:', res.status)
        console.log('[CrackIt] Login response data:', JSON.stringify(res.data))
        console.log('[CrackIt] Login response data type:', typeof res.data)
        
        if (!res.data || typeof res.data !== 'object') {
            throw new Error(`Unexpected response format: got ${typeof res.data} instead of object. Raw: ${JSON.stringify(res.data).substring(0, 200)}`)
        }
        
        const { access_token, user: userData } = res.data
        
        if (!access_token) {
            throw new Error(`No access_token in response. Keys received: ${Object.keys(res.data).join(', ')}`)
        }
        if (!userData) {
            throw new Error(`No user data in response. Keys received: ${Object.keys(res.data).join(', ')}`)
        }
        
        console.log('[CrackIt] Token received, length:', access_token.length)
        console.log('[CrackIt] User data:', JSON.stringify(userData))
        
        localStorage.setItem('crackit_token', access_token)
        localStorage.setItem('crackit_user', JSON.stringify(userData))
        setUser(userData)
        console.log('[CrackIt] Login complete, user state set')
        return userData
    }

    const register = async (email, password, full_name) => {
        const res = await api.post('/auth/register', { email, password, full_name })
        const { access_token, user: userData } = res.data
        localStorage.setItem('crackit_token', access_token)
        localStorage.setItem('crackit_user', JSON.stringify(userData))
        setUser(userData)
        return userData
    }

    const logout = () => {
        localStorage.removeItem('crackit_token')
        localStorage.removeItem('crackit_user')
        setUser(null)
    }

    const forgotPassword = async (email) => {
        await api.post('/auth/forgot-password', { email })
    }

    const resetPassword = async (token, newPassword) => {
        await api.post('/auth/reset-password', { token, new_password: newPassword })
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, resetPassword, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
