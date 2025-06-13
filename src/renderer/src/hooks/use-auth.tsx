import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth } from '@renderer/api'
import type { LoginResponse } from '@renderer/api'

interface AuthContextType {
  isAuthenticated: boolean
  user: LoginResponse['user'] | null
  login: (identifier: string, credential: string) => Promise<boolean>
  sendSmsCode: (phone: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<LoginResponse['user'] | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsAuthenticated(true)
      // 尝试获取用户信息
      loadUserInfo()
    }
  }, [])

  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      const userInfo = await auth.getUserInfo()
      setUser(userInfo)
    } catch (error) {
      console.error('Failed to load user info:', error)
      // 如果获取用户信息失败，可能是 token 过期，清除认证状态
      handleLogout()
    }
  }

  // 处理登录成功后的逻辑
  const handleLoginSuccess = (response: LoginResponse) => {
    const { token, refreshToken, user, expiresIn } = response
    
    // 保存 token 和用户信息
    localStorage.setItem('authToken', token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('loginType', user.loginType)
    localStorage.setItem('userIdentifier', user.identifier)
    
    // 设置 token 过期时间
    const expirationTime = Date.now() + expiresIn * 1000
    localStorage.setItem('tokenExpirationTime', expirationTime.toString())
    
    setUser(user)
    setIsAuthenticated(true)
  }

  // 处理登出逻辑
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('loginType')
    localStorage.removeItem('userIdentifier')
    localStorage.removeItem('tokenExpirationTime')
    
    setUser(null)
    setIsAuthenticated(false)
  }

  const login = async (identifier: string, credential: string): Promise<boolean> => {
    try {
      const isPhone = /^1[3-9]\d{9}$/.test(identifier)
      
      let response: LoginResponse
      
      if (isPhone) {
        // 手机号 + 验证码登录
        response = await auth.loginWithPhone(identifier, credential)
      } else {
        // 邮箱 + 密码登录
        response = await auth.loginWithEmail(identifier, credential)
      }
      
      handleLoginSuccess(response)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const sendSmsCode = async (phone: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await auth.sendSmsCode(phone)
      return {
        success: response.success,
        message: response.message
      }
    } catch (error) {
      console.error('Send SMS code failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送验证码失败'
      }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await auth.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      handleLogout()
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (!storedRefreshToken) {
        return false
      }
      
      const response = await auth.refreshToken(storedRefreshToken)
      
      // 更新 token 信息
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      const expirationTime = Date.now() + response.expiresIn * 1000
      localStorage.setItem('tokenExpirationTime', expirationTime.toString())
      
      return true
    } catch (error) {
      console.error('Refresh token failed:', error)
      handleLogout()
      return false
    }
  }

  // 检查 token 是否即将过期并自动刷新
  useEffect(() => {
    if (!isAuthenticated) return

    const checkTokenExpiration = () => {
      const expirationTime = localStorage.getItem('tokenExpirationTime')
      if (!expirationTime) return

      const now = Date.now()
      const expiration = parseInt(expirationTime)
      
      // 如果 token 在 5 分钟内过期，自动刷新
      if (expiration - now < 5 * 60 * 1000) {
        refreshToken()
      }
    }

    // 立即检查一次
    checkTokenExpiration()
    
    // 每分钟检查一次
    const interval = setInterval(checkTokenExpiration, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [isAuthenticated])

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      sendSmsCode, 
      logout, 
      refreshToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}