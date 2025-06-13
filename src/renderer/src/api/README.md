# API 管理系统使用文档

## 概述

这个 API 管理系统基于 axios 封装，提供了完整的 HTTP 请求功能，包括认证、错误处理、请求/响应拦截等。

## 文件结构

```
src/renderer/src/
├── api/
│   ├── index.ts          # API 管理类和接口定义
│   └── README.md         # 使用文档
├── utils/
│   └── request.ts        # axios 封装和请求工具
├── hooks/
│   └── use-auth.tsx      # 认证相关 Hook
└── types/
    └── api.ts            # API 相关类型定义
```

## 基本使用

### 1. 导入 API

```typescript
import api, { auth, user, system, mihomo } from '@renderer/api'

// 或者单独导入需要的模块
import { auth } from '@renderer/api'
```

### 2. 认证相关

```typescript
// 邮箱登录
try {
  const response = await auth.loginWithEmail('user@example.com', 'password123')
  console.log('登录成功:', response)
} catch (error) {
  console.error('登录失败:', error)
}

// 手机号登录
try {
  // 先发送验证码
  await auth.sendSmsCode('13800138000')
  
  // 然后验证码登录
  const response = await auth.loginWithPhone('13800138000', '123456')
  console.log('登录成功:', response)
} catch (error) {
  console.error('登录失败:', error)
}

// 获取用户信息
try {
  const userInfo = await auth.getUserInfo()
  console.log('用户信息:', userInfo)
} catch (error) {
  console.error('获取用户信息失败:', error)
}

// 登出
await auth.logout()
```

### 3. 用户相关

```typescript
// 更新用户资料
await user.updateProfile({
  nickname: '新昵称',
  avatar: 'https://example.com/avatar.jpg'
})

// 修改密码
await user.changePassword({
  oldPassword: 'oldpass123',
  newPassword: 'newpass123'
})
```

### 4. 直接使用 request 工具

```typescript
import request from '@renderer/utils/request'

// GET 请求
const data = await request.get('/api/data')

// POST 请求
const result = await request.post('/api/submit', { 
  name: 'test',
  value: 123 
})

// 文件上传
const file = document.querySelector('input[type="file"]').files[0]
const uploadResult = await request.upload('/api/upload', file)

// 文件下载
await request.download('/api/download/file.pdf', 'downloaded-file.pdf')
```

## 认证机制

### Token 管理

系统会自动管理 JWT Token：

- 登录成功后自动保存 token 到 localStorage
- 每个请求自动添加 Authorization header
- Token 过期前 5 分钟自动刷新
- Token 无效时自动跳转登录页

### 在组件中使用认证

```typescript
import { useAuth } from '@renderer/hooks/use-auth'

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>请先登录</div>
  }

  return (
    <div>
      <h1>欢迎, {user?.nickname}</h1>
      <button onClick={() => logout()}>退出登录</button>
    </div>
  )
}
```

## 错误处理

### 全局错误处理

系统会自动处理常见的 HTTP 错误：

- `401` - 自动清除 token 并跳转登录页
- `403` - 权限不足提示
- `404` - 资源不存在提示
- `500` - 服务器错误提示
- 网络错误 - 网络连接失败提示

### 自定义错误处理

```typescript
try {
  const data = await api.auth.loginWithEmail('email', 'password')
} catch (error) {
  if (error.name === 'ApiError') {
    // API 业务错误
    console.log('错误代码:', error.code)
    console.log('错误信息:', error.message)
  } else {
    // 网络或其他错误
    console.log('错误信息:', error.message)
  }
}
```

## 请求配置

### 跳过认证

```typescript
import request from '@renderer/utils/request'

// 某些接口不需要认证
const publicData = await request.get('/api/public', {
  skipAuth: true
})
```

### 跳过错误处理

```typescript
// 自己处理错误的请求
const result = await request.post('/api/test', data, {
  skipErrorHandler: true
})
```

## 环境配置

### 开发环境

- API Base URL: `http://localhost:3000/api`
- 请求超时: 10 秒
- 详细日志: 开启

### 生产环境

- API Base URL: `/api` (相对路径)
- 请求超时: 10 秒
- 详细日志: 关闭

## 类型安全

所有 API 接口都有完整的 TypeScript 类型定义：

```typescript
// 登录响应类型
interface LoginResponse {
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

// API 会自动推断返回类型
const response: LoginResponse = await auth.loginWithEmail('email', 'password')
```

## 扩展 API

### 添加新的 API 模块

```typescript
// 在 api/index.ts 中添加新模块
class ApiManager {
  // ... 现有模块

  // 新模块
  newModule = {
    getData: (): Promise<any> => {
      return request.get('/new-module/data')
    },

    createItem: (data: any): Promise<any> => {
      return request.post('/new-module/items', data)
    }
  }
}
```

### 添加请求拦截器

```typescript
// 在 utils/request.ts 中修改拦截器
private setupRequestInterceptors(): void {
  this.instance.interceptors.request.use(
    (config) => {
      // 添加自定义逻辑
      config.headers['X-Custom-Header'] = 'custom-value'
      return config
    }
  )
}
```

## 调试技巧

### 查看请求日志

打开浏览器控制台，所有 API 请求都会有详细日志：

```
[API Request] POST /api/auth/login
[API Response] POST /api/auth/login - 234ms
```

### 模拟网络错误

```typescript
// 在开发时模拟网络错误
if (process.env.NODE_ENV === 'development') {
  // 人为抛出错误来测试错误处理
  throw new Error('模拟网络错误')
}
```

## 最佳实践

1. **始终使用 try-catch** 包装 API 调用
2. **合理使用加载状态** 提升用户体验
3. **适当的错误提示** 让用户知道发生了什么
4. **避免在组件中直接调用 API** 使用自定义 Hook
5. **统一的错误处理** 在合适的层级处理错误

```typescript
// 推荐的使用方式
function useUserData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await user.getProfile()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, refetch: fetchData }
}
```