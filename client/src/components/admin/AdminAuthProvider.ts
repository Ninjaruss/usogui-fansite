import { AuthProvider } from 'react-admin'
import { api } from '../../lib/api'

export const AdminAuthProvider: AuthProvider = {
  login: async () => {
    // Redirect to main login page which now handles Discord auth
    window.location.href = '/login'
    return Promise.resolve()
  },

  logout: async () => {
    try {
      // Call logout endpoint (refresh token is handled via httpOnly cookie)
      await api.logout()
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem('accessToken')
    api.setToken(null)
    
    // Redirect to home page after logout
    window.location.href = '/'
    return Promise.resolve()
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No access token')
      }

      // Make sure the API client has the token
      api.setToken(token)
      
      const user = await api.getCurrentUser()
      
      if (user.role !== 'admin' && user.role !== 'moderator') {
        throw new Error('Access denied. Admin or moderator role required.')
      }

      return Promise.resolve()
    } catch (error) {
      localStorage.removeItem('accessToken')
      api.setToken(null)
      return Promise.reject(new Error('Not authenticated or insufficient permissions'))
    }
  },

  checkError: (error) => {
    const status = error.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('accessToken')
      api.setToken(null)
      return Promise.reject()
    }
    return Promise.resolve()
  },

  getIdentity: async () => {
    try {
      const user = await api.getCurrentUser()
      let avatar = undefined
      
      if (user.discordAvatar && user.discordId) {
        // If discordAvatar is already a full URL, use it directly
        if (user.discordAvatar.startsWith('http')) {
          avatar = user.discordAvatar
        } else {
          // Otherwise, construct the Discord CDN URL
          avatar = `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
        }
      }
      
      return Promise.resolve({
        id: user.id,
        fullName: user.username,
        avatar,
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  getPermissions: async () => {
    try {
      const user = await api.getCurrentUser()
      return Promise.resolve(user.role)
    } catch (error) {
      return Promise.reject(error)
    }
  },
}