// 通用 API 响应类型
export interface BaseResponse {
  code: number
  message: string
  success: boolean
}

export interface ApiResponse<T = any> extends BaseResponse {
  data: T
}

// 分页相关类型
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface PaginatedResponse<T = any> extends BaseResponse {
  data: {
    list: T[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
}

// 错误类型
export interface ApiError {
  code: number
  message: string
  details?: any
  timestamp?: string
}

// 文件上传相关
export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

// 扩展 Window 接口以支持环境变量
declare global {
  interface Window {
    electronAPI?: any
    ENV?: {
      API_BASE_URL?: string
      NODE_ENV?: string
    }
  }
}

export {}