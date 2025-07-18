import { useState, useEffect, useRef } from 'react'
import { Card, CardBody, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { Receipt, Eye, RefreshCw, Calendar, DollarSign, Package, CheckCircle, X, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { apiService, type OrderItem } from '@renderer/services/api'
import useSWR, { mutate } from 'swr'
import { useSearchParams } from 'react-router-dom'

const OrderCenterPage: React.FC = () => {
  const [payingOrder, setPayingOrder] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState<any>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null)
  const [autoPaymentProcessing, setAutoPaymentProcessing] = useState(false)
  const [orderSyncProcessing, setOrderSyncProcessing] = useState(false)
  const [paymentWindowOpened, setPaymentWindowOpened] = useState<string | null>(null)
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [timeoutOrderId, setTimeoutOrderId] = useState<string | null>(null)
  const paymentTriggeredRef = useRef<string | null>(null)
  const [searchParams] = useSearchParams()

  // 使用SWR获取订单数据，避免重复请求
  const { data: ordersData, isLoading } = useSWR(
    'orders',
    async () => {
      const response = await apiService.getOrders()
      if (response.success && response.data?.data) {
        return response.data.data.map((order) => ({
          id: order.trade_no,
          plan_id: order.plan_id,
          plan_name: order.plan.name,
          amount: order.total_amount / 100, // 转换分为元
          status: order.status === 3 ? 'paid' : order.status === 0 ? 'pending' : order.status === 2 ? 'cancelled' : 'expired',
          created_at: new Date(order.created_at * 1000).toLocaleString(),
          expired_at: order.paid_at ? new Date((order.paid_at + 30 * 24 * 60 * 60) * 1000).toLocaleString() : undefined,
          period: order.period === 'month_price' ? '月' : order.period === 'quarter_price' ? '季' : order.period === 'half_year_price' ? '半年' : order.period === 'year_price' ? '年' : order.period === 'two_year_price' ? '两年' : order.period === 'three_year_price' ? '三年' : '一次性',
          period_type: order.period === 'month_price' ? 'month' : order.period === 'quarter_price' ? 'quarter' : order.period === 'half_year_price' ? 'half_year' : order.period === 'year_price' ? 'year' : order.period === 'two_year_price' ? 'two_year' : order.period === 'three_year_price' ? 'three_year' : 'onetime'
        }))
      }
      throw new Error('API调用失败')
    },
    {
      fallbackData: [
        {
          id: '202312010001',
          plan_id: 1,
          plan_name: '黄金VIP（月卡）',
          amount: 29.9,
          status: 'paid' as const,
          created_at: '2023-12-01 14:30:00',
          expired_at: '2024-01-01 14:30:00',
          period: '月',
          period_type: 'month' as const
        },
        {
          id: '202312010002',
          plan_id: 2,
          plan_name: '黄金VIP（季卡）',
          amount: 69.99,
          status: 'pending' as const,
          created_at: '2023-12-01 15:20:00',
          expired_at: undefined,
          period: '季',
          period_type: 'quarter' as const
        },
        {
          id: '202311280001',
          plan_id: 3,
          plan_name: '黄金VIP（年卡）',
          amount: 199.99,
          status: 'cancelled' as const,
          created_at: '2023-11-28 10:15:00',
          expired_at: undefined,
          period: '年',
          period_type: 'year' as const
        }
      ]
    }
  )

  const orders = ordersData || []
  const loading = isLoading

  // 处理自动支付逻辑
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const autoPayment = searchParams.get('autoPayment')
    
    // 防止重复触发：检查是否已经为这个订单触发过支付（使用ref实现同步检查）
    if (orderId && autoPayment === 'true' && !loading && paymentTriggeredRef.current !== orderId) {
      console.log('检测到自动支付参数，订单ID:', orderId)
      
      // 立即标记这个订单已经触发过支付，防止重复（同步操作）
      paymentTriggeredRef.current = orderId
      setAutoPaymentProcessing(true)
      
      // 等待订单数据同步的函数
      const waitForOrderAndPay = async (maxAttempts = 8) => {
        setOrderSyncProcessing(true)
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`等待订单数据同步，第${attempt}次检查...`)
          
          // 刷新订单数据并等待SWR更新
          mutate('orders')
          
          // 等待一段时间让SWR数据加载和更新
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // 检查SWR缓存的orders是否已包含目标订单
          const currentOrders = orders || []
          const targetOrder = currentOrders.find(order => order.id === orderId)
          
          if (targetOrder && targetOrder.status === 'pending') {
            console.log('SWR数据已同步，找到待支付订单，自动发起支付')
            setOrderSyncProcessing(false)
            setAutoPaymentProcessing(true)
            handlePayment(orderId)
            return // 成功找到并处理
          }
          
          console.log('SWR数据尚未同步目标订单，继续等待...')
          
          // 如果是最后一次尝试，显示超时提示而不是自动支付
          if (attempt === maxAttempts) {
            console.log('等待超时，显示手动支付提示')
            setOrderSyncProcessing(false)
            setAutoPaymentProcessing(false)
            setTimeoutOrderId(orderId)
            setShowTimeoutModal(true)
          }
        }
      }
      
      // 首先检查当前orders中是否已有目标订单
      const targetOrder = orders.find(order => order.id === orderId)
      if (targetOrder && targetOrder.status === 'pending') {
        console.log('找到待支付订单，自动发起支付')
        setAutoPaymentProcessing(true)
        handlePayment(orderId)
      } else {
        // 等待订单数据同步
        waitForOrderAndPay()
      }
      
      // 清理URL参数，防止页面刷新时重复触发
      setTimeout(() => {
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }, 15000) // 给等待足够的时间
    }
  }, [searchParams, loading, orders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'danger'
      case 'expired':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return '已支付'
      case 'pending':
        return '待支付'
      case 'cancelled':
        return '已取消'
      case 'expired':
        return '已过期'
      default:
        return '未知'
    }
  }

  const handlePayment = async (orderId: string) => {
    // 防止重复支付：如果当前正在处理支付或已经打开了支付窗口，直接返回
    if (payingOrder === orderId || paymentWindowOpened === orderId) {
      console.log('订单正在支付中或支付窗口已打开，跳过重复请求')
      return
    }
    
    setPayingOrder(orderId)
    
    try {
      const response = await apiService.getCheckoutUrl(orderId)
      if (response.success && response.data?.data) {
        // 标记支付窗口已为此订单打开
        setPaymentWindowOpened(orderId)
        
        // 找到当前订单信息，如果找不到则创建临时订单信息
        let order = orders.find(o => o.id === orderId)
        if (!order) {
          // 创建临时订单信息用于显示支付模态框
          order = {
            id: orderId,
            plan_id: 0,
            plan_name: '新订单',
            amount: 0,
            status: 'pending' as const,
            created_at: new Date().toLocaleString(),
            expired_at: undefined,
            period: '未知',
            period_type: 'month' as const
          }
          console.log('未在订单列表中找到订单，使用临时订单信息')
        }
        
        setCurrentPaymentOrder(order)
        setShowPaymentModal(true)
        
        console.log('打开支付页面:', response.data.data)
        // 打开支付页面
        window.open(response.data.data, '_blank')
        
        // 5分钟后清除支付窗口标记，允许重新打开
        setTimeout(() => {
          setPaymentWindowOpened(null)
        }, 5 * 60 * 1000)
        
        // 打开支付页面后，关闭自动支付loading
        setTimeout(() => {
          setAutoPaymentProcessing(false)
        }, 2000)
      } else {
        console.error('获取支付地址失败:', response.message)
        setAutoPaymentProcessing(false)
        setOrderSyncProcessing(false)
        // 清理支付窗口标记和触发标记
        setPaymentWindowOpened(null)
        paymentTriggeredRef.current = null
      }
    } catch (error) {
      console.error('获取支付地址时发生错误:', error)
      setAutoPaymentProcessing(false)
      setOrderSyncProcessing(false)
      // 清理支付窗口标记和触发标记
      setPaymentWindowOpened(null)
      paymentTriggeredRef.current = null
    } finally {
      setPayingOrder(null)
    }
  }

  const handleCancelOrder = () => {
    // 显示确认对话框
    setShowCancelConfirm(true)
  }

  const confirmCancelOrder = async () => {
    // 确认取消订单
    setShowCancelConfirm(false)
    setShowPaymentModal(false)
    
    // 清理支付窗口标记和触发标记
    if (currentPaymentOrder?.id) {
      setPaymentWindowOpened(null)
      paymentTriggeredRef.current = null
    }
    
    // 清理所有处理状态
    setAutoPaymentProcessing(false)
    setOrderSyncProcessing(false)
    
    setCurrentPaymentOrder(null)
    console.log('取消订单:', currentPaymentOrder?.id)
  }

  const cancelCancelOrder = () => {
    // 取消取消操作，继续等待支付
    setShowCancelConfirm(false)
  }

  const handleCheckPaymentStatus = async () => {
    if (!currentPaymentOrder) return
    
    setCheckingStatus(true)
    setStatusMessage(null)
    
    try {
      const response = await apiService.checkOrderStatus(currentPaymentOrder.id)
      if (response.success && response.data?.data !== undefined) {
        const paymentStatus = response.data.data
        
        switch (paymentStatus) {
          case 0:
            // 等待付款
            setStatusMessage({
              type: 'info',
              text: '⏳ 订单等待付款，请在支付页面完成支付后再次检查'
            })
            break
            
          case 1:
            // 开通中
            setStatusMessage({
              type: 'info',
              text: '🔄 订单开通中，请稍等片刻再次检查'
            })
            break
            
          case 2:
            // 已取消
            setStatusMessage({
              type: 'error',
              text: '❌ 订单已取消'
            })
            // 延迟关闭弹窗
            setTimeout(() => {
              mutate('orders')
              setShowPaymentModal(false)
              // 清理支付窗口标记
              setPaymentWindowOpened(null)
              // 清理支付触发标记
              paymentTriggeredRef.current = null
              // 清理所有处理状态
              setAutoPaymentProcessing(false)
              setOrderSyncProcessing(false)
              setCurrentPaymentOrder(null)
              setStatusMessage(null)
            }, 2000)
            break
            
          case 3:
            // 已完成
            setStatusMessage({
              type: 'success',
              text: '🎉 订单已完成！正在更新订单状态...'
            })
            // 延迟关闭弹窗，让用户看到成功消息
            setTimeout(async () => {
              // 刷新订单列表
              mutate('orders')
              // 重新调用 profile 接口更新用户信息
              try {
                await apiService.getUserProfile()
                // 可以在这里刷新用户profile相关的缓存
                // 如果使用了SWR缓存profile数据，可以这样刷新：
                // mutate('profile')
              } catch (error) {
                console.error('刷新用户信息失败:', error)
              }
              setShowPaymentModal(false)
              // 清理支付窗口标记和触发标记
              setPaymentWindowOpened(null)
              paymentTriggeredRef.current = null
              // 清理所有处理状态
              setAutoPaymentProcessing(false)
              setOrderSyncProcessing(false)
              setCurrentPaymentOrder(null)
              setStatusMessage(null)
            }, 2000)
            break
            
          case 4:
            // 已折抵
            setStatusMessage({
              type: 'success',
              text: '✅ 订单已折抵完成！正在更新订单状态...'
            })
            // 延迟关闭弹窗
            setTimeout(async () => {
              // 刷新订单列表
              mutate('orders')
              // 重新调用 profile 接口更新用户信息
              try {
                await apiService.getUserProfile()
                // 可以在这里刷新用户profile相关的缓存
                // 如果使用了SWR缓存profile数据，可以这样刷新：
                // mutate('profile')
              } catch (error) {
                console.error('刷新用户信息失败:', error)
              }
              setShowPaymentModal(false)
              // 清理支付窗口标记和触发标记
              setPaymentWindowOpened(null)
              paymentTriggeredRef.current = null
              // 清理所有处理状态
              setAutoPaymentProcessing(false)
              setOrderSyncProcessing(false)
              setCurrentPaymentOrder(null)
              setStatusMessage(null)
            }, 2000)
            break
            
          default:
            // 未知状态
            setStatusMessage({
              type: 'error',
              text: `❌ 订单状态异常 (状态码: ${paymentStatus})，请联系客服`
            })
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: '❌ 检查支付状态失败，请稍后重试'
        })
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: '❌ 网络错误，请检查网络连接后重试'
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  if (loading) {
    return (
      <BasePage title="">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 dark:text-slate-400">加载订单信息中...</p>
          </div>
        </div>
      </BasePage>
    )
  }

  return (
    <BasePage title="">
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        
        {/* 订单数据同步中 Loading */}
        {orderSyncProcessing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[300px]">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">正在同步订单数据</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">订单创建成功，正在等待数据同步，请稍候...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* 自动支付处理中 Loading */}
        {autoPaymentProcessing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[300px]">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">正在发起支付</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">系统正在为您自动打开支付页面，请稍候...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400/30 rounded-full animate-ping" />
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" />
          <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-indigo-400/20 rounded-full animate-bounce" />
          <div className="absolute top-1/3 right-20 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping" />
          <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-pink-400/40 rounded-full animate-pulse" />
          
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-600/10 rounded-full blur-3xl animate-float-reverse" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          {/* 页面标题 */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                <Receipt className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-green-800 to-emerald-800 dark:from-white dark:via-green-200 dark:to-emerald-200 bg-clip-text text-transparent leading-tight mb-6">
              订单中心
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              管理您的订单记录，查看订单状态和详细信息
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl">
              <CardBody className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {orders.length}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">总订单数</p>
              </CardBody>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl">
              <CardBody className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {orders.filter(o => o.status === 'paid').length}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">已完成订单数</p>
              </CardBody>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl">
              <CardBody className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {orders.filter(o => o.status === 'pending').length}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">待支付订单</p>
              </CardBody>
            </Card>
          </div>

          {/* 订单列表 */}
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl">
            <CardBody className="p-0">
              <Table aria-label="订单列表">
                <TableHeader>
                  <TableColumn>订单号</TableColumn>
                  <TableColumn>套餐名称</TableColumn>
                  <TableColumn>金额</TableColumn>
                  <TableColumn>状态</TableColumn>
                  <TableColumn>创建时间</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{order.id}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.plan_name}</p>
                          <p className="text-sm text-slate-500">周期: {order.period}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-lg">¥{order.amount}</span>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          color={getStatusColor(order.status)}
                          variant="flat"
                          size="sm"
                        >
                          {getStatusText(order.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.created_at}</span>
                        {order.expired_at && (
                          <p className="text-xs text-slate-500">到期: {order.expired_at}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            startContent={<Eye className="w-4 h-4" />}
                          >
                            查看
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              color="primary"
                              startContent={<RefreshCw className="w-4 h-4" />}
                              onPress={() => handlePayment(order.id)}
                              disabled={payingOrder === order.id}
                            >
                              {payingOrder === order.id ? '处理中...' : '支付'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 支付等待弹窗 */}
      <Modal 
        isOpen={showPaymentModal} 
        onClose={() => {}} // 禁用关闭
        size="md"
        backdrop="blur"
        hideCloseButton={true} // 隐藏关闭按钮
        isDismissable={false} // 禁用点击外部关闭
        isKeyboardDismissDisabled={true} // 禁用ESC键关闭
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  等待支付中
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  请在新打开的页面中完成支付
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            {currentPaymentOrder && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">订单号:</span>
                    <span className="font-mono text-sm">{currentPaymentOrder.id}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">套餐:</span>
                    <span className="font-medium">{currentPaymentOrder.plan_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">金额:</span>
                    <span className="font-bold text-lg text-primary">¥{currentPaymentOrder.amount}</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="relative mx-auto mb-6 w-20 h-20">
                    {/* 外圆环 */}
                    <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                    {/* 旋转的渐变圆环 */}
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-blue-400 rounded-full animate-spin"></div>
                    {/* 内部脉动圆点 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    {/* 装饰性光晕 */}
                    <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-sm animate-pulse"></div>
                  </div>
                  
                  {/* 动态文字提示 */}
                  <div className="space-y-3">
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200 animate-pulse">
                      等待支付中...
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        支付页面已在新窗口中打开
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          💡 完成支付后，请点击"检查订单支付状态"按钮确认订单状态
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 装饰性动画点 */}
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                
                {/* 状态消息提示 */}
                {statusMessage && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    statusMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    statusMessage.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      {statusMessage.type === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                      {statusMessage.type === 'info' && (
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                      {statusMessage.type === 'error' && (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <p className={`text-sm font-medium ${
                        statusMessage.type === 'success' ? 'text-green-800 dark:text-green-200' :
                        statusMessage.type === 'info' ? 'text-blue-800 dark:text-blue-200' :
                        'text-red-800 dark:text-red-200'
                      }`}>
                        {statusMessage.text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              color="danger" 
              variant="light" 
              onPress={handleCancelOrder}
              startContent={<X className="w-4 h-4" />}
            >
              取消订单
            </Button>
            <Button 
              color="primary" 
              onPress={handleCheckPaymentStatus}
              startContent={<RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />}
              disabled={checkingStatus}
            >
              {checkingStatus ? '检查中...' : '检查订单支付状态'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 超时提示弹窗 */}
      <Modal 
        isOpen={showTimeoutModal} 
        onClose={() => {
          setShowTimeoutModal(false)
          setTimeoutOrderId(null)
        }}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  订单数据同步超时
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  请手动进行支付操作
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                      订单数据同步需要一些时间
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      由于网络延迟或系统繁忙，订单数据同步超时。您可以：
                    </p>
                    <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-4">
                      <li>• 稍等几分钟后，在订单列表中手动点击"支付"按钮</li>
                      <li>• 或者刷新页面重新尝试</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {timeoutOrderId && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">订单号:</span>
                    <span className="font-mono text-xs">{timeoutOrderId}</span>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="light" 
              onPress={() => {
                setShowTimeoutModal(false)
                setTimeoutOrderId(null)
              }}
            >
              我知道了
            </Button>
            <Button 
              color="primary" 
              onPress={() => {
                if (timeoutOrderId) {
                  handlePayment(timeoutOrderId)
                }
                setShowTimeoutModal(false)
                setTimeoutOrderId(null)
              }}
              startContent={<DollarSign className="w-4 h-4" />}
            >
              立即支付
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 取消订单确认弹窗 */}
      <Modal 
        isOpen={showCancelConfirm} 
        onClose={() => {}}
        size="sm"
        backdrop="blur"
        hideCloseButton={true}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  确认取消订单
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  此操作无法撤销
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ 您确定要取消当前订单吗？取消后将无法恢复，如果您已经完成支付，建议先检查订单支付状态。
                </p>
              </div>
              
              {currentPaymentOrder && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400">订单号:</span>
                    <span className="font-mono text-xs">{currentPaymentOrder.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">金额:</span>
                    <span className="font-semibold text-sm text-red-600 dark:text-red-400">¥{currentPaymentOrder.amount}</span>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="light" 
              onPress={cancelCancelOrder}
            >
              继续等待支付
            </Button>
            <Button 
              color="danger" 
              onPress={confirmCancelOrder}
              startContent={<X className="w-4 h-4" />}
            >
              确认取消订单
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </BasePage>
  )
}

export default OrderCenterPage