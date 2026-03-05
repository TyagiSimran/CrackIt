import axios from 'axios'

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'https://crackit-9a2k.onrender.com').replace(/\/$/, ''),
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    // Ensure /api is prepended if not already there
    if (config.url && !config.url.startsWith('/api')) {
        config.url = '/api' + (config.url.startsWith('/') ? '' : '/') + config.url
    }

    const token = localStorage.getItem('crackit_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('crackit_token')
            localStorage.removeItem('crackit_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
