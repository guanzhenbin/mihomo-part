import request from '@renderer/utils/request'

// 用户相关接口
export interface LoginRequest {
  identifier: string // 邮箱或手机号
  credential: string // 密码或验证码
  loginType: 'email' | 'phone'
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    identifier: string
    loginType: 'email' | 'phone'
    nickname?: string
    avatar?: string
  }
  expiresIn: number
}

export interface SendCodeRequest {
  phone: string
}

export interface PhoneLoginRequest {
  phoneNumber: string
  code: string
}

export interface SendCodeResponse {
  success: boolean
  message: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  expiresIn: number
}

// API 管理类
class ApiManager {
  // 认证相关 API
  auth = {
    // 邮箱密码登录  
    loginWithEmail: (email: string, password: string): Promise<any> => {
      return request.post('/auth/login', {
        identifier: email,
        credential: password,
        loginType: 'email'
      } as LoginRequest)
    },

    // 手机验证码登录
    loginWithPhone: (phone: string, code: string): Promise<any> => {
      return request.post('/mobile/auth/sms/verify', {
        phoneNumber: phone,
        code: code,
      } as PhoneLoginRequest)
    },

    // 发送手机验证码
    sendSmsCode: (phone: string): Promise<SendCodeResponse> => {
      console.log('📱 发送验证码请求:', { phone })
      return request.post<SendCodeResponse>(`/mobile/auth/sms/send`, {
        phoneNumber: phone,
      })
    },

    // 刷新 token
    refreshToken: (refreshToken: string): Promise<RefreshTokenResponse> => {
      return request.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      } as RefreshTokenRequest)
    },

    // 登出
    logout: (): Promise<{ success: boolean }> => {
      return request.post('/auth/logout')
    },

    // 获取用户信息
    getUserInfo: (): Promise<any> => {
      return request.get('/mobile/users/profile')
    }
  }

  // 用户相关 API
  user = {
    // 更新用户信息
    updateProfile: (data: {
      nickname?: string
      avatar?: string
    }): Promise<{ success: boolean }> => {
      return request.put('/user/profile', data)
    },

    // 修改密码
    changePassword: (data: {
      oldPassword: string
      newPassword: string
    }): Promise<{ success: boolean }> => {
      return request.put('/user/password', data)
    },

    // 绑定手机号
    bindPhone: (data: {
      phone: string
      code: string
    }): Promise<{ success: boolean }> => {
      return request.post('/user/bind-phone', data)
    },

    // 绑定邮箱
    bindEmail: (data: {
      email: string
      code: string
    }): Promise<{ success: boolean }> => {
      return request.post('/user/bind-email', data)
    }
  }

  // 系统相关 API (可以根据项目需要添加)
  system = {
    // 获取系统信息
    getInfo: (): Promise<{
      version: string
      name: string
      description: string
    }> => {
      return request.get('/system/info')
    },

    // 健康检查
    health: (): Promise<{ status: 'ok' | 'error'; timestamp: number }> => {
      return request.get('/system/health')
    }
  }

  // Mihomo 相关 API (根据项目具体需求)
  mihomo = {
    // 获取配置
    getConfig: (): Promise<any> => {
      return request.get('/mihomo/config')
    },

    // 更新配置
    updateConfig: (config: any): Promise<{ success: boolean }> => {
      return request.put('/mihomo/config', config)
    },

    // 获取代理列表
    getProxies: (): Promise<any> => {
      return request.get('/mihomo/proxies')
    },

    // 获取规则列表
    getRules: (): Promise<any> => {
      return request.get('/mihomo/rules')
    },

    // 获取连接信息
    getConnections: (): Promise<any> => {
      return request.get('/mihomo/connections')
    },

    // 获取日志
    getLogs: (): Promise<any> => {
      return request.get('/mihomo/logs')
    }
  }
}

// 创建 API 实例
const api = new ApiManager()

export default api

// 单独导出各个模块，方便使用
export const { auth, user, system, mihomo } = api