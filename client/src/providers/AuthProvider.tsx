'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

interface User {
  id: number
  username: string
  email: string
  role: string
  isEmailVerified: boolean
  userProgress: number
  profileImageId?: string
  favoriteQuoteId?: number
  favoriteGambleId?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        api.setToken(token)
        const userData = await api.getCurrentUser()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      localStorage.removeItem('accessToken')
      api.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password)
      setUser(response.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.register(username, email, password)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}