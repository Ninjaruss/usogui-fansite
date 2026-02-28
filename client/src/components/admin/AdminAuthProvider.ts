import { AuthProvider } from 'react-admin'
import { api } from '../../lib/api'

export const AdminAuthProvider: AuthProvider = {
  login: async () => {
    // Redirect to main login page which handles OAuth auth
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
    api.setToken(null)

    // Redirect to home page after logout
    window.location.href = '/'
    return Promise.resolve()
  },

  checkAuth: async () => {
    try {
      // Check if we have a token in memory (secure in-memory storage)
      let token = api.getToken()

      if (!token) {
        // No token in memory - try silent refresh via httpOnly cookie
        try {
          const refreshResult = await api.refreshToken()
          if (refreshResult?.access_token) {
            api.setToken(refreshResult.access_token)
            token = refreshResult.access_token
          }
        } catch {
          // Refresh failed - no valid session
        }
      }

      if (!token) {
        throw new Error('No access token')
      }

      const user = await api.getCurrentUser()

      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'editor') {
        throw new Error('Access denied. Admin, moderator, or editor role required.')
      }

      return Promise.resolve()
    } catch (error) {
      api.setToken(null)
      return Promise.reject(new Error('Not authenticated or insufficient permissions'))
    }
  },

  checkError: (error) => {
    const status = error.status
    if (status === 401 || status === 403) {
      api.setToken(null)
      return Promise.reject()
    }
    return Promise.resolve()
  },

  getIdentity: async () => {
    try {
      const user = await api.getCurrentUser()
      let avatar = undefined

      if (user.fluxerAvatar && user.fluxerId) {
        avatar = `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png`
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