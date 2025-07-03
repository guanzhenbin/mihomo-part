import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppConfig } from './use-app-config'
import { apiService } from '@renderer/services/api'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { appConfig } = useAppConfig()
  
  // Force show login page for testing - set to true to test login functionality
  const FORCE_LOGIN_FOR_TESTING = true

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        // Wait for appConfig to load
        if (appConfig === undefined) {
          setIsLoading(true)
          return
        }

        // Add a minimum loading time to ensure user sees the loading screen
        const startTime = Date.now()
        const minLoadingTime = 800 // 800ms minimum loading time

        const hasPassword = appConfig.encryptedPassword && appConfig.encryptedPassword.length > 0 || FORCE_LOGIN_FOR_TESTING
        console.log('🔐 Auth check - hasPassword:', hasPassword, 'encryptedPassword length:', appConfig.encryptedPassword?.length, 'FORCE_LOGIN_FOR_TESTING:', FORCE_LOGIN_FOR_TESTING)

        if (!hasPassword) {
          setIsAuthenticated(true)
        } else {
          // 检查是否有token
          const token = sessionStorage.getItem('mihomo-party-token')
          const sessionAuth = sessionStorage.getItem('mihomo-party-auth')
          
          if (token && sessionAuth === 'true') {
            console.log('🔐 Found token, verifying with API...')
            try {
              // 调用API验证token有效性
              const profileResult = await apiService.getUserProfile()
              console.log('🔐 Profile API response:', profileResult)
              
              if (profileResult.success) {
                console.log('🔐 Token is valid, user authenticated')
                setIsAuthenticated(true)
              } else {
                console.log('🔐 Token is invalid, clearing session')
                sessionStorage.removeItem('mihomo-party-token')
                sessionStorage.removeItem('mihomo-party-user')
                sessionStorage.removeItem('mihomo-party-auth')
                setIsAuthenticated(false)
              }
            } catch (error) {
              console.error('🔐 Profile API error:', error)
              // API调用失败，清除session
              sessionStorage.removeItem('mihomo-party-token')
              sessionStorage.removeItem('mihomo-party-user')
              sessionStorage.removeItem('mihomo-party-auth')
              setIsAuthenticated(false)
            }
          } else {
            console.log('🔐 No valid token found')
            setIsAuthenticated(false)
          }
        }

        // Ensure minimum loading time
        const elapsedTime = Date.now() - startTime
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        if (appConfig !== undefined) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
  }, [appConfig])

  const login = async (password: string): Promise<boolean> => {
    try {
      // For testing mode, accept any password
      if (FORCE_LOGIN_FOR_TESTING) {
        console.log('🔐 Login - Testing mode, accepting any password')
        sessionStorage.setItem('mihomo-party-auth', 'true')
        setIsAuthenticated(true)
        return true
      }

      if (!appConfig?.encryptedPassword) {
        return false
      }

      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      
      const isValid =
        hashArray.length === appConfig.encryptedPassword.length &&
        hashArray.every((byte, index) => byte === appConfig.encryptedPassword![index])

      if (isValid) {
        sessionStorage.setItem('mihomo-party-auth', 'true')
        setIsAuthenticated(true)
        return true
      }

      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = (): void => {
    sessionStorage.removeItem('mihomo-party-auth')
    setIsAuthenticated(false)
    setIsLoading(false)
  }

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}