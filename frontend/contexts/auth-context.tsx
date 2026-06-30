"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check localStorage on mount for real JWT token
    const storedUser = localStorage.getItem('arin_user')
    const storedToken = localStorage.getItem('arin_token')
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch (e) {
        console.error("Failed to parse user from local storage")
        localStorage.removeItem('arin_user')
        localStorage.removeItem('arin_token')
      }
    }
  }, [])

  const login = (newUser: User, newToken: string) => {
    setUser(newUser)
    setToken(newToken)
    localStorage.setItem('arin_user', JSON.stringify(newUser))
    localStorage.setItem('arin_token', newToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('arin_user')
    localStorage.removeItem('arin_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
