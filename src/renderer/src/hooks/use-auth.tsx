import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppConfig } from './use-app-config'
import { apiService } from '@renderer/services/api'
import { addProfileItem, getProfileConfig, removeProfileItem, setProfileConfig } from '@renderer/utils/ipc'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  recheckAuth: (cachedProfile?: any) => Promise<void>
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

  const performAuthCheck = async (cachedProfile?: any): Promise<void> => {
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
            // 使用缓存的profile数据或调用API验证token有效性
            let profileResult = cachedProfile
            if (!profileResult) {
              profileResult = await apiService.getUserProfile()
              console.log('🔐 Profile API response:', profileResult)
            } else {
              console.log('🔐 Using cached profile data:', profileResult)
            }
            
            if (profileResult.success) {
              console.log('🔐 Token is valid, user authenticated')
              setIsAuthenticated(true)
              
              // 自动添加订阅URL到订阅管理
              try {
                const userData = profileResult.data as any
                if (userData?.data?.subscribe_url) {
                  const subscribeUrl = userData.data.subscribe_url
                  console.log('🔗 Checking subscription URL:', subscribeUrl)
                  
                  // 生成订阅名称 - 使用用户邮箱
                  const subscriptionName = userData.data.email || userData.data.user?.email || 'API订阅'
                  
                  // 获取当前配置，删除所有现有订阅
                  const profileConfig = await getProfileConfig()
                  const existingSubscriptions = profileConfig.items?.filter(
                    item => item.type === 'remote'
                  ) || []
                  
                  if (existingSubscriptions.length > 0) {
                    console.log('🗑️ Removing all existing subscriptions before adding new one...')
                    // 删除所有现有的远程订阅
                    for (const subscription of existingSubscriptions) {
                      await removeProfileItem(subscription.id)
                      console.log('🗑️ Removed subscription:', subscription.name)
                    }
                    console.log(`🗑️ Total ${existingSubscriptions.length} subscriptions removed`)
                  }
                  
                  // 添加新订阅（覆盖旧的）
                  await addProfileItem({
                    type: 'remote',
                    name: subscriptionName,
                    url: subscribeUrl,
                    interval: 60, // 默认60分钟更新间隔
                    useProxy: false
                  })
                  
                  console.log('✅ Subscription added/updated successfully:', subscriptionName)
                  
                  // 获取更新后的配置并选中新添加的订阅
                  const updatedProfileConfig = await getProfileConfig()
                  const newSubscription = updatedProfileConfig.items?.find(
                    item => item.type === 'remote' && item.name === subscriptionName
                  )
                  
                  if (newSubscription) {
                    // 设置新添加的订阅为当前选中的订阅
                    const newConfig = {
                      ...updatedProfileConfig,
                      current: newSubscription.id
                    }
                    await setProfileConfig(newConfig)
                    console.log('🎯 Subscription selected automatically:', subscriptionName)
                  }
                }
              } catch (error) {
                console.warn('⚠️ 订阅添加失败，但不影响登录:', error)
                // 网络连接问题，不影响认证流程
                // 用户可以稍后手动添加订阅或检查网络连接
                if (error instanceof Error) {
                  console.log('🔍 错误详情:', {
                    message: error.message,
                    type: error.name,
                    suggestion: '请检查网络连接，稍后可在订阅管理中手动添加'
                  })
                }
              }
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

  const recheckAuth = async (cachedProfile?: any): Promise<void> => {
    await performAuthCheck(cachedProfile)
  }

  useEffect(() => {
    performAuthCheck()
  }, [appConfig?.encryptedPassword, appConfig === undefined])


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
    isLoading,
    recheckAuth
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