import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AESDecryption } from './crypto'

// API 响应接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean // 是否跳过认证
  skipErrorHandler?: boolean // 是否跳过错误处理
}

class Request {
  private instance: AxiosInstance

  constructor() {
    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: process.env.NODE_ENV === 'development' ? 'https://api.chatppt.shop/api' : '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 设置请求拦截器
    this.setupRequestInterceptors()
    
    // 设置响应拦截器
    this.setupResponseInterceptors()
  }

  // 请求拦截器
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证 token
        const token = localStorage.getItem('authToken')
        if (token && !config.skipAuth) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求时间戳
        config.metadata = { startTime: Date.now() }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data
        })

        return config
      },
      (error) => {
        console.error('[API Request Error]', error)
        return Promise.reject(error)
      }
    )
  }

  // 响应拦截器
  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }
        const duration = config.metadata ? Date.now() - config.metadata.startTime : 0

        console.log(`[API Response] ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`, {
          status: response.status,
          data: response.data
        })

        // 解密处理
        try {
          if (response.data && this.shouldDecrypt(response)) {
            console.log('[解密拦截器] 需要解密，开始解密...')
            const decryptedData = this.decryptResponse(response.data)
            if (decryptedData !== null) {
              response.data = decryptedData
              console.log('[解密拦截器] 解密成功，已替换响应数据')
            } else {
              console.log('[解密拦截器] 解密失败，保持原始数据')
            }
          }
        } catch (error) {
          console.error('[解密拦截器] 解密失败:', error)
        }

        // 统一处理响应数据
        const { data } = response
        
        // 如果是标准 API 响应格式
        if (data && typeof data === 'object' && 'code' in data) {
          if (data.code === 200 || data.success) {
            // 检查是否有嵌套的数据结构
            if (data.data && typeof data.data === 'object') {
              // 如果 data.data 中有 loginData，说明是登录接口的特殊结构
              if ('loginData' in data.data && data.data.loginData && typeof data.data.loginData === 'object') {
                console.log('[响应处理] 检测到登录数据嵌套结构，提取并适配loginData')
                const loginData = data.data.loginData.data || data.data.loginData
                console.log('[响应处理] 原始登录数据:', loginData)
                
                                 // 适配数据格式以匹配 LoginResponse 接口
                 const adaptedResponse = this.adaptLoginResponse(loginData, config.url, config.data)
                 console.log('[响应处理] 适配后的登录数据:', adaptedResponse)
                 return adaptedResponse
              }
              // 其他情况返回 data.data
              return data.data
            }
            // 没有嵌套数据，返回整个data对象
            return data
          } else {
            // API 业务错误
            const error = new Error(data.message || '请求失败')
            error.name = 'ApiError'
            ;(error as any).code = data.code
            return Promise.reject(error)
          }
        }

        // 直接返回数据
        return data
      },
      (error) => {
        const config = error.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }
        const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0

        console.error(`[API Error] ${config?.method?.toUpperCase()} ${config?.url} - ${duration}ms`, {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        })

        // 处理不同类型的错误
        if (error.response) {
          const { status, data } = error.response
          
          switch (status) {
            case 401:
              // 未授权，清除 token 并跳转登录
              localStorage.removeItem('authToken')
              localStorage.removeItem('loginType')
              localStorage.removeItem('userIdentifier')
              
              // 如果不在登录页，跳转到登录页
              if (window.location.hash !== '#/login') {
                window.location.hash = '#/login'
              }
              
              return Promise.reject(new Error('登录已过期，请重新登录'))
              
            case 403:
              return Promise.reject(new Error('权限不足'))
              
            case 404:
              return Promise.reject(new Error('请求的资源不存在'))
              
            case 500:
              return Promise.reject(new Error('服务器内部错误'))
              
            default:
              return Promise.reject(new Error(data?.message || `请求失败 (${status})`))
          }
        } else if (error.request) {
          // 网络错误
          return Promise.reject(new Error('网络连接失败，请检查网络'))
        } else {
          // 其他错误
          return Promise.reject(error)
        }
      }
    )
  }

  // 判断响应是否需要解密
  private shouldDecrypt(response: AxiosResponse): boolean {
    // 如果响应头包含加密标识，则需要解密
    if (response.headers['x-encrypted'] === 'true') {
      return true
    }

    // 如果返回的已经是JSON对象，则不处理
    if (AESDecryption.isJsonData(response.data)) {
      return false
    }

    // 如果响应数据是字符串且可能是加密数据
    if (typeof response.data === 'string') {
      return AESDecryption.isLikelyEncrypted(response.data)
    }

    return false
  }

  // 解密响应数据
  private decryptResponse(data: any): any {
    if (typeof data === 'string') {
      console.log('[解密拦截器] 尝试解密字符串:', data.substring(0, 50) + '...')
      
      // 尝试解密字符串
      const decrypted = AESDecryption.decryptAuto(data)
      if (decrypted) {
        console.log('[解密拦截器] 解密成功:', decrypted)
        try {
          // 尝试将解密后的字符串转换为JSON
          const jsonData = JSON.parse(decrypted)
          console.log('[解密拦截器] JSON解析成功')
          return jsonData
        } catch (e) {
          // 如果不是JSON格式，返回纯文本
          console.log('[解密拦截器] JSON解析失败，返回纯文本:', e)
          return decrypted
        }
      } else {
        console.log('[解密拦截器] 字符串解密失败')
      }
    } else if (data && typeof data === 'object') {
      console.log('[解密拦截器] 检查JSON对象中的加密字段')
      
      // 如果是JSON对象，检查是否有加密字段
      const result: Record<string, any> = {}
      
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string' && AESDecryption.isLikelyEncrypted(value)) {
          console.log('[解密拦截器] 发现加密字段:', key)
          
          // 尝试解密字段值
          const decrypted = AESDecryption.decryptAuto(value)
          if (decrypted) {
            try {
              result[key] = JSON.parse(decrypted)
              console.log('[解密拦截器] 字段', key, '解密并JSON解析成功')
            } catch (e) {
              result[key] = decrypted
              console.log('[解密拦截器] 字段', key, '解密成功但JSON解析失败:', e)
            }
          } else {
            result[key] = value
            console.log('[解密拦截器] 字段', key, '解密失败')
          }
        } else {
          result[key] = value
        }
      })
      
      return result
    }
    
    return data
  }

  // 适配登录响应数据格式
  private adaptLoginResponse(loginData: any, requestUrl?: string, requestData?: any): any {
    // 解析JWT token获取用户信息
    const parseJWT = (token: string) => {
      try {
        const payload = token.split('.')[1]
        const decoded = JSON.parse(atob(payload))
        return decoded
      } catch (error) {
        console.error('[JWT解析] 解析失败:', error)
        return null
      }
    }

    // 从auth_data中解析用户信息
    let userId = 'unknown'
    if (loginData.auth_data) {
      const jwtData = parseJWT(loginData.auth_data)
      if (jwtData && jwtData.id) {
        userId = jwtData.id.toString()
      }
    }

         // 根据请求URL判断登录类型
     const isPhoneLogin = requestUrl?.includes('loginWithPhone')
     const loginType = isPhoneLogin ? 'phone' : 'email'

     // 从请求数据中获取identifier
     let identifier = 'unknown'
     if (requestData) {
       if (isPhoneLogin && requestData.phone) {
         identifier = requestData.phone
       } else if (requestData.identifier) {
         identifier = requestData.identifier
       } else if (requestData.email) {
         identifier = requestData.email
       }
     }

     // 构造符合LoginResponse接口的数据
     return {
       token: loginData.token || '',
       refreshToken: loginData.refresh_token || loginData.token || '', // 如果没有refresh_token，使用token
       user: {
         id: userId,
         identifier: identifier,
         loginType: loginType,
         nickname: loginData.nickname || '',
         avatar: loginData.avatar || ''
       },
       expiresIn: loginData.expires_in || 86400 // 默认24小时
     }
  }

  // GET 请求
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  // POST 请求
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  // PUT 请求
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  // DELETE 请求
  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }

  // PATCH 请求
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }

  // 上传文件
  upload<T = any>(url: string, file: File | FormData, config?: RequestConfig): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      formData.append('file', file)
    }

    return this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
  }

  // 下载文件
  download(url: string, filename?: string, config?: RequestConfig): Promise<void> {
    return this.instance.get(url, {
      ...config,
      responseType: 'blob'
    }).then((response) => {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }

  // 取消请求
  cancelAllRequests(): void {
    // 这里可以实现取消所有请求的逻辑
    console.log('Cancelling all requests...')
  }
}

// 创建请求实例
const request = new Request()

export default request

// 导出类型
export type { AxiosResponse, AxiosRequestConfig }