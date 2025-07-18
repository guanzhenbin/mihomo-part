import { useEffect, useState } from 'react'
import { Card, CardBody, Chip, Progress, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { UserProfile, apiService } from '@renderer/services/api'
import { useAuth } from '@renderer/hooks/use-auth'
import { User, Mail, Calendar, Package, Download, Upload, Shield, Copy, Crown, Zap, TrendingUp, Server, Activity, Wifi, Star, Globe, Sparkles, CircuitBoard, Layers, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const ProfileCenterPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showExpirationModal, setShowExpirationModal] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    const loadUserProfile = async (): Promise<void> => {
      try {
        // 首先尝试从sessionStorage加载缓存数据
        const savedProfile = sessionStorage.getItem('mihomo-party-user')
        if (savedProfile) {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
          console.log('📦 从缓存加载用户数据:', profile)
        }

        // 然后从API获取最新数据
        console.log('🔄 正在获取最新用户数据...')
        const result = await apiService.getUserProfile()
        
        if (result.success && result.data) {
          console.log('✅ 获取到最新用户数据:', result.data)
          setUserProfile(result.data)
          // 更新sessionStorage中的缓存
          sessionStorage.setItem('mihomo-party-user', JSON.stringify(result.data))
          console.log('💾 已更新缓存数据')
        } else {
          console.error('❌ 获取用户数据失败:', result)
        }
      } catch (error) {
        console.error('❌ 加载用户数据时出错:', error)
        // 如果API失败，至少显示缓存数据
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    // 自动检测时间戳格式
    let date: Date
    
    // 如果时间戳小于某个值，认为是秒时间戳，需要乘以1000
    if (timestamp < 10000000000) {
      date = new Date(timestamp * 1000)
    } else {
      // 否则认为是毫秒时间戳
      date = new Date(timestamp)
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('❌ 无效的时间戳:', timestamp)
      return '时间格式错误'
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }



  const calculateUsagePercentage = (used: number, total: number): number => {
    if (total === 0) return 0
    return Math.min((used / total) * 100, 100)
  }

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleCopyLinkClick = (): void => {
    if (!userProfile?.data) return
    
    const { data } = userProfile
    const currentTime = Date.now() / 1000
    const isExpired = data.expired_at <= currentTime
    
    if (isExpired) {
      // 会员已过期，显示提示弹窗
      setShowExpirationModal(true)
    } else {
      // 会员有效，直接复制链接
      copyToClipboard(data.subscribe_url)
    }
  }

  const handlePurchase = (): void => {
    setShowExpirationModal(false)
    navigate('/package-purchase')
  }

  const handleLogout = (): void => {
    // 清除sessionStorage中的登录信息
    sessionStorage.removeItem('mihomo-party-token')
    sessionStorage.removeItem('mihomo-party-user')
    sessionStorage.removeItem('mihomo-party-auth')
    
    // 调用logout函数更新认证状态
    logout()
    
    console.log('🔐 User logged out successfully')
  }

  if (isLoading) {
    return (
      <BasePage title="个人中心">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 dark:text-slate-400">加载中...</p>
          </div>
        </div>
      </BasePage>
    )
  }

  if (!userProfile) {
    return (
      <BasePage title="个人中心">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">未找到用户信息</h3>
              <p className="text-slate-600 dark:text-slate-400">请检查您的登录状态或重新登录</p>
            </div>
          </div>
        </div>
      </BasePage>
    )
  }

  const { data } = userProfile
  const totalUsage = data.u + data.d
  const usagePercentage = calculateUsagePercentage(totalUsage, data.transfer_enable)
  

  
  // 修正时间计算逻辑
  const currentTime = Date.now() / 1000 // 当前时间秒时间戳
  const isExpired = data.expired_at <= currentTime
  
  // 计算剩余天数，确保不为负数
  const timeDiff = data.expired_at - currentTime // 相差秒数
  const remainingDays = Math.max(0, Math.ceil(timeDiff / (24 * 60 * 60))) // 转换为天数并向上取整

  return (
    <BasePage title="">
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Floating particles */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400/30 rounded-full animate-ping" style={{animationDelay: '0s'}} aria-hidden="true"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{animationDelay: '2s'}} aria-hidden="true"></div>
          <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-indigo-400/20 rounded-full animate-bounce" style={{animationDelay: '1s'}} aria-hidden="true"></div>
          <div className="absolute top-1/3 right-20 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping" style={{animationDelay: '3s'}} aria-hidden="true"></div>
          <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-pink-400/40 rounded-full animate-pulse" style={{animationDelay: '4s'}} aria-hidden="true"></div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-float" aria-hidden="true"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-600/10 rounded-full blur-3xl animate-float-reverse" aria-hidden="true"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          {/* Enhanced Header */}
          <div className="mb-16 text-center">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform transition-all duration-700 hover:scale-110 hover:rotate-3 animate-float">
                  <div className="relative">
                    <User className="w-16 h-16 text-white" aria-hidden="true" />
                                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center" aria-hidden="true">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                  </div>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-6">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight animate-fade-in-up">
                  个人中心
                </h1>
                <Button
                  size="lg"
                  variant="flat"
                  color="danger"
                                      startContent={<LogOut className="w-5 h-5" aria-hidden="true" />}
                  onPress={handleLogout}
                  className="font-semibold px-6 py-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                  style={{animationDelay: '0.1s'}}
                >
                  退出登录
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <Sparkles className="w-5 h-5 text-blue-500" />
                <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
                  欢迎回来，管理您的专属订阅服务
                </p>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
            {/* Enhanced Subscription Status */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 group">
              <CardBody className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-100/50 dark:from-emerald-900/20 dark:to-green-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Shield className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 tracking-wide uppercase">订阅状态</p>
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                        {isExpired ? '已过期' : '有效'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {isExpired ? '请续费以继续使用' : `剩余 ${remainingDays} 天`}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        过期时间：{formatDate(data.expired_at)}
                      </p>
                    </div>
                  </div>
                  <div className={`w-full h-1 rounded-full ${isExpired ? 'bg-red-200 dark:bg-red-800' : 'bg-green-200 dark:bg-green-800'}`}>
                    <div className={`h-full rounded-full transition-all duration-1000 ${isExpired ? 'w-0 bg-red-500' : 'w-full bg-gradient-to-r from-emerald-400 to-green-500'}`}></div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Enhanced Usage Rate */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 group">
              <CardBody className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <TrendingUp className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 tracking-wide uppercase">使用率</p>
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        {usagePercentage.toFixed(1)}%
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Progress
                      value={usagePercentage}
                      aria-label="流量使用率"
                      color={usagePercentage > 90 ? 'danger' : usagePercentage > 70 ? 'warning' : 'success'}
                      size="lg"
                      className="w-full"
                      classNames={{
                        track: "bg-slate-200/50 dark:bg-slate-700/50 h-2",
                        indicator: "bg-gradient-to-r shadow-lg"
                      }}
                    />
                    <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>0%</span>
                      <span className={`${usagePercentage > 90 ? 'text-red-500' : usagePercentage > 70 ? 'text-orange-500' : 'text-green-500'}`}>
                        {usagePercentage.toFixed(1)}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Enhanced Total Traffic */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 group">
              <CardBody className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Globe className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 tracking-wide uppercase">总流量</p>
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                        {formatBytes(data.transfer_enable)}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        已用 {formatBytes(totalUsage)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Enhanced Plan Cost */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 group">
              <CardBody className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Crown className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-amber-400/20 to-orange-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 tracking-wide uppercase">套餐费用</p>
                      <div className="flex items-baseline gap-1">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                          ¥{(data.plan.month_price / 100).toFixed(0)}
                        </h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">/月</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">高级套餐</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Enhanced Left Side - Traffic Details */}
            <div className="xl:col-span-2 space-y-10">
              {/* Enhanced Traffic Usage Details */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardBody className="p-10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-100/30 dark:from-blue-900/10 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-10">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-3xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110">
                          <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">流量使用详情</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">本月流量消耗统计</p>
                      </div>
                    </div>

                    {/* Enhanced Main Progress Display */}
                    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-700/50 dark:via-slate-600/50 dark:to-slate-800/50 rounded-3xl p-10 mb-10 border border-slate-200/50 dark:border-slate-600/30 shadow-inner">
                      <div className="flex justify-between items-start mb-8">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">总使用量</h3>
                            <CircuitBoard className="w-5 h-5 text-blue-500" aria-hidden="true" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                              {formatBytes(totalUsage)}
                            </p>
                            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                              / {formatBytes(data.transfer_enable)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-3">
                          <div className="text-5xl font-bold text-slate-900 dark:text-white">
                            {usagePercentage.toFixed(1)}%
                          </div>
                          <Chip
                            variant="flat"
                            color={usagePercentage > 90 ? 'danger' : usagePercentage > 70 ? 'warning' : 'success'}
                            size="lg"
                            className="font-semibold text-sm px-4 py-2 shadow-lg"
                          >
                            {usagePercentage > 90 ? '使用告急' : usagePercentage > 70 ? '使用偏高' : '使用正常'}
                          </Chip>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Progress
                          value={usagePercentage}
                          aria-label="流量使用率"
                          color={usagePercentage > 90 ? 'danger' : usagePercentage > 70 ? 'warning' : 'success'}
                          size="lg"
                          className="w-full h-4"
                          classNames={{
                            track: "bg-white/70 dark:bg-slate-700/50 shadow-inner",
                            indicator: "bg-gradient-to-r shadow-lg"
                          }}
                        />
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                            剩余: {formatBytes(data.transfer_enable - totalUsage)}
                          </span>
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true"></div>
                            {(100 - usagePercentage).toFixed(1)}% 可用
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Upload/Download Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/30 dark:to-green-800/20 rounded-3xl p-8 border border-green-200/50 dark:border-green-800/30 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <div className="flex items-center gap-5 mb-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                              <Download className="w-8 h-8 text-white" aria-hidden="true" />
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-green-900 dark:text-green-100 mb-1">下载流量</h4>
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium tracking-wide">Download</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="text-4xl font-bold text-green-900 dark:text-green-100">
                            {formatBytes(data.d)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                              占比 {((data.d / totalUsage) * 100).toFixed(1)}%
                            </span>
                            <div className="w-16 h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${((data.d / totalUsage) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900/20 dark:via-cyan-900/30 dark:to-blue-800/20 rounded-3xl p-8 border border-blue-200/50 dark:border-blue-800/30 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <div className="flex items-center gap-5 mb-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                              <Upload className="w-8 h-8 text-white" aria-hidden="true" />
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">上传流量</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium tracking-wide">Upload</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                            {formatBytes(data.u)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                              占比 {((data.u / totalUsage) * 100).toFixed(1)}%
                            </span>
                            <div className="w-16 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                                style={{ width: `${((data.u / totalUsage) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Enhanced Right Side - Plan Info & Configuration */}
            <div className="space-y-10">
              {/* Enhanced Plan Information */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardBody className="p-10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-100/30 dark:from-purple-900/10 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-3xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110">
                          <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">套餐详情</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">当前订阅方案</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 rounded-3xl p-8 mb-8 border border-purple-200/50 dark:border-purple-800/30 shadow-inner">
                      <div className="text-center mb-6">
                        <h3 className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-3">
                          {data.plan.name}
                        </h3>
                        <div className="flex items-center justify-center gap-3">
                          <Star className="w-6 h-6 text-amber-500" aria-hidden="true" />
                          <span className="text-base font-semibold text-purple-700 dark:text-purple-300 tracking-wide">高级套餐</span>
                          <Star className="w-6 h-6 text-amber-500" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                          ¥{(data.plan.month_price / 100).toFixed(2)}
                        </div>
                        <div className="text-lg text-purple-700 dark:text-purple-300 font-medium">每月</div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Zap className="w-5 h-5 text-white" aria-hidden="true" />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-lg">带宽限制</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xl">
                          {data.plan.speed_limit} Mbps
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Package className="w-5 h-5 text-white" aria-hidden="true" />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-lg">月流量</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xl">
                          {formatBytes(data.plan.transfer_enable)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Calendar className="w-5 h-5 text-white" aria-hidden="true" />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-lg">到期时间</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xl">
                          {formatDate(data.expired_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Enhanced Subscription Configuration */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardBody className="p-10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 to-blue-100/30 dark:from-cyan-900/10 dark:to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 rounded-3xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110">
                          <Wifi className="w-8 h-8 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">订阅配置</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">节点订阅信息</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <Layers className="w-5 h-5 text-cyan-500" aria-hidden="true" />
                            <label className="font-bold text-slate-700 dark:text-slate-300 text-lg">订阅链接</label>
                          </div>
                          <Button
                            size="md"
                            variant="flat"
                            color="primary"
                            startContent={<Copy className="w-5 h-5" aria-hidden="true" />}
                            onPress={handleCopyLinkClick}
                            className="font-semibold px-6 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300"
                          >
                            复制链接
                          </Button>
                        </div>
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 border border-slate-300/50 dark:border-slate-600/50 shadow-inner">
                          <code className="text-sm font-mono text-slate-600 dark:text-slate-400 break-all leading-relaxed">
                            {data.subscribe_url}
                          </code>
                        </div>
                      </div> */}

                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-purple-500" aria-hidden="true" />
                            <label className="font-bold text-slate-700 dark:text-slate-300 text-lg">用户 UUID</label>
                          </div>
                          <Button
                            size="md"
                            variant="flat"
                            color="primary"
                            startContent={<Copy className="w-5 h-5" aria-hidden="true" />}
                            onPress={() => copyToClipboard(data.uuid)}
                            className="font-semibold px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300"
                          >
                            复制 UUID
                          </Button>
                        </div>
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 border border-slate-300/50 dark:border-slate-600/50 shadow-inner">
                          <code className="text-base font-mono text-slate-600 dark:text-slate-400 break-all leading-relaxed">
                            {data.uuid}
                          </code>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/30 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/30 shadow-lg">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Mail className="w-6 h-6 text-white" aria-hidden="true" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-1">注册账号</h4>
                            <p className="text-base text-blue-700 dark:text-blue-300 font-medium">{data.email?.replace('@phone.com','')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

                 {/* Expiration Modal */}
         <Modal 
           isOpen={showExpirationModal} 
           onOpenChange={setShowExpirationModal}
           backdrop="blur"
           placement="center"
         >
           <ModalContent>
             {(onClose) => (
               <>
                 <ModalHeader className="flex flex-col gap-1">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center">
                       <Crown className="w-6 h-6 text-white" aria-hidden="true" />
                     </div>
                                           <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {t('common.membership.expired')}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {t('common.membership.needPurchase')}
                        </p>
                      </div>
                   </div>
                 </ModalHeader>
                 <ModalBody>
                   <div className="space-y-4">
                                           <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          ⚠️ {t('common.membership.expiredMessage')}
                        </p>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 dark:text-slate-400">{t('common.membership.expiredTime')}</span>
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {formatDate(data.expired_at)}
                          </span>
                        </div>
                      </div>
                   </div>
                 </ModalBody>
                                   <ModalFooter>
                    <Button color="default" variant="light" onPress={onClose}>
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      color="primary" 
                      onPress={handlePurchase}
                      startContent={<Crown className="w-4 h-4" aria-hidden="true" />}
                    >
                      {t('common.membership.goPurchase')}
                    </Button>
                  </ModalFooter>
               </>
             )}
           </ModalContent>
         </Modal>
      </div>
    </BasePage>
  )
}

export default ProfileCenterPage