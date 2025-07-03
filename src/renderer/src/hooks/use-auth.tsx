import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppConfig } from './use-app-config'

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
          const sessionAuth = sessionStorage.getItem('mihomo-party-auth')
          if (sessionAuth === 'true') {
            setIsAuthenticated(true)
          } else {
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