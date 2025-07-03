/**
 * API请求管理类
 * 统一管理所有API调用
 */

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

interface SendSmsRequest {
  phoneNumber: string
}

interface SendSmsResponse {
  success: boolean
  message: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    email?: string
    phoneNumber?: string
    name?: string
  }
  expiresIn: number
}

class ApiService {
  private baseURL: string

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  /**
   * 基础请求方法
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: result,
        message: result.message
      }
    } catch (error) {
      console.error(`API Error [${url}]:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '网络请求失败'
      }
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(params).toString() : ''
    const fullUrl = searchParams ? `${url}?${searchParams}` : url
    
    return this.request<T>(fullUrl, {
      method: 'GET'
    })
  }

  /**
   * POST请求
   */
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'DELETE'
    })
  }

  // ============ 具体API方法 ============

  /**
   * 发送短信验证码
   */
  async sendSmsCode(phoneNumber: string): Promise<ApiResponse<SendSmsResponse>> {
    return this.post<SendSmsResponse>('/api/mobile/auth/sms/send', {
      phoneNumber
    })
  }

  /**
   * 验证手机验证码登录
   */
  async loginWithSms(phoneNumber: string, code: string): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/mobile/auth/sms/verify', {
      phoneNumber,
      code
    })
  }

  /**
   * 邮箱密码登录
   */
  async loginWithEmail(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/auth/login', {
      email,
      password
    })
  }
}

// 创建API服务实例
export const apiService = new ApiService('https://kuranode.com')

// 导出类型
export type { ApiResponse, SendSmsRequest, SendSmsResponse, LoginResponse }