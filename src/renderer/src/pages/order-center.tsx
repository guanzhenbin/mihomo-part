import { useState } from 'react'
import { Card, CardBody, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { Receipt, Eye, RefreshCw, Calendar, DollarSign, Package, CheckCircle } from 'lucide-react'
import { apiService, type OrderItem } from '@renderer/services/api'
import useSWR from 'swr'

const OrderCenterPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

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
          period: '年',
          period_type: 'year' as const
        }
      ]
    }
  )

  const orders = ordersData || []
  const loading = isLoading

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
                            >
                              支付
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
    </BasePage>
  )
}

export default OrderCenterPage