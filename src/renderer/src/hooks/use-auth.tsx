import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth } from '@renderer/api'

// 实际API返回的登录响应格式
interface ActualLoginResponse {
  status: string
  message: string
  data: {
    token: string
    refreshToken?: string
    user?: {
      id: string
      identifier: string
      loginType: 'email' | 'phone'
      nickname?: string
      avatar?: string
    }
  }
  expiresIn?: number
}

// 扩展的用户信息接口，包含实际API返回的字段
interface ExtendedUser {
  id: string
  identifier: string
  loginType: 'email' | 'phone'
  nickname?: string
  avatar?: string
  // 额外的用户信息字段
  plan_id?: number
  token?: string
  expired_at?: number
  email?: string
  uuid?: string
  plan?: {
    name?: string
    id?: number
    [key: string]: unknown
  }
  subscribe_url?: string
  transfer?: {
    upload: number
    download: number
    total: number
  }
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: ExtendedUser | null
  login: (identifier: string, credential: string) => Promise<boolean>
  sendSmsCode: (phone: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps): React.JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [user, setUser] = useState<ExtendedUser | null>(null)

  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('authToken')
        console.log('🔍 初始化检查 - token存在:', !!token)
        
        if (token) {
          console.log('✅ 发现token，尝试验证有效性')
          
          // 通过调用用户信息接口来验证token有效性
          try {
            await loadUserInfo()
            console.log('✅ Token有效，用户信息获取成功')
            setIsAuthenticated(true)
          } catch (error) {
            console.log('❌ Token无效或已过期，清除认证状态:', error)
            // 如果获取用户信息失败，说明token无效，清除认证状态
            handleLogout()
          }
        } else {
          console.log('❌ 没有找到token')
        }
      } finally {
        // 无论如何都要设置loading为false
        setIsLoading(false)
        console.log('🏁 认证初始化完成')
      }
    }

    initializeAuth()
  }, [])

  // 加载用户信息
  const loadUserInfo = async (): Promise<void> => {
    try {
      const response = await auth.getUserInfo()
      console.log('📡 用户信息API原始响应:', response)
      
      // 处理实际API返回的用户信息
      let rawUserData
      if (response?.data) {
        // 如果返回格式是 { status: "success", data: {...} }
        rawUserData = response.data
      } else if (response) {
        // 如果直接返回用户信息
        rawUserData = response
      }
      
      console.log('📋 解析后的用户数据:', rawUserData)
      
      // 将API返回的数据转换为我们需要的格式
      if (rawUserData) {
        const identifier = localStorage.getItem('userIdentifier') || rawUserData.email || ''
        const loginType = localStorage.getItem('loginType') as 'email' | 'phone' || 'email'
        
        const userInfo = {
          id: rawUserData.uuid || '',
          identifier,
          loginType,
          nickname: rawUserData.email || identifier,
          avatar: undefined,
          // 保存额外的用户信息
          plan_id: rawUserData.plan_id,
          token: rawUserData.token,
          expired_at: rawUserData.expired_at,
          email: rawUserData.email,
          uuid: rawUserData.uuid,
          plan: rawUserData.plan,
          subscribe_url: rawUserData.subscribe_url,
          transfer: {
            upload: rawUserData.u,
            download: rawUserData.d,
            total: rawUserData.transfer_enable
          }
        }
        
        console.log('👤 转换后的用户信息:', userInfo)
        setUser(userInfo)
      } else {
        throw new Error('未获取到用户数据')
      }
    } catch (error) {
      console.error('Failed to load user info:', error)
      // 不在这里自动登出，让调用方决定如何处理
      throw error
    }
  }

  // 处理登录成功后的逻辑
  const handleLoginSuccess = async (response: ActualLoginResponse, identifier?: string): Promise<void> => {
    console.log('🎉 登录成功，处理响应数据:', response)
    
    // 适配实际API返回格式
    const token = response.data?.token
    
    if (!token) {
      throw new Error('Token not found in response')
    }
    
    console.log('💾 保存认证信息到localStorage')
    
    // 保存 token
    localStorage.setItem('authToken', token)
    console.log('🔑 Token已保存:', token.substring(0, 20) + '...')
    
    // 如果有其他字段，也保存
    if (response.data?.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken)
      console.log('🔄 RefreshToken已保存')
    }
    
    // 保存登录方式和用户标识（从参数传入）
    if (identifier) {
      const isPhone = /^1[3-9]\d{9}$/.test(identifier)
      const loginType = isPhone ? 'phone' : 'email'
      localStorage.setItem('loginType', loginType)
      localStorage.setItem('userIdentifier', identifier)
      console.log('👤 用户标识已保存:', { identifier, loginType })
    }
    
    // 不需要前端保存过期时间，后端会处理token过期状态
    console.log('💾 Token信息保存完成，过期状态由后端管理')
    
    // 先设置认证状态
    setIsAuthenticated(true)
    console.log('✅ 认证状态已设置为true')
    
    // 尝试获取用户信息
    try {
      console.log('📡 开始获取用户信息...')
      await loadUserInfo()
      console.log('✅ 用户信息获取成功')
    } catch (error) {
      console.log('⚠️ 获取用户信息失败，使用默认用户信息:', error)
      
      // 如果API没有返回用户信息或获取失败，创建一个基本的用户对象
      if (response.data?.user) {
        setUser(response.data.user)
        console.log('👤 使用API返回的用户信息')
      } else if (identifier) {
        const isPhone = /^1[3-9]\d{9}$/.test(identifier)
        const userInfo = {
          id: '',
          identifier,
          loginType: (isPhone ? 'phone' : 'email') as 'email' | 'phone'
        }
        setUser(userInfo)
        console.log('👤 使用默认用户信息:', userInfo)
      }
    }
    
    // 登录完成，设置loading为false
    setIsLoading(false)
    console.log('🏁 登录处理完成，停止loading状态')
  }

  // 处理登出逻辑
  const handleLogout = (): void => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('loginType')
    localStorage.removeItem('userIdentifier')
    
    setUser(null)
    setIsAuthenticated(false)
    console.log('🔓 已清除所有认证信息')
  }

  const login = async (identifier: string, credential: string): Promise<boolean> => {
    try {
      const isPhone = /^1[3-9]\d{9}$/.test(identifier)
      
      let response: ActualLoginResponse
      
      if (isPhone) {
        // 手机号 + 验证码登录
        response = await auth.loginWithPhone(identifier, credential)
      } else {
        // 邮箱 + 密码登录
        response = await auth.loginWithEmail(identifier, credential)
      }
      
      await handleLoginSuccess(response, identifier)
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
        console.log('❌ 没有refreshToken，无法刷新')
        return false
      }
      
      console.log('🔄 开始刷新token...')
      const response = await auth.refreshToken(storedRefreshToken)
      
      // 更新 token 信息
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('refreshToken', response.refreshToken)
      console.log('✅ Token刷新成功')
      
      return true
    } catch (error) {
      console.error('❌ Token刷新失败:', error)
      handleLogout()
      return false
    }
  }

  // Token过期状态由后端管理，前端不需要检查过期时间

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
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