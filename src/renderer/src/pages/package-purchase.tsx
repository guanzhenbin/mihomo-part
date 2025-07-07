import { useState } from 'react'
import { Card, CardBody, Button, Chip } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { Crown, Zap, Star, Check, Package, Wifi, Globe, Shield, Clock, TrendingUp } from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  price: number
  originalPrice?: number
  period: string
  popular: boolean
  features: string[]
  bandwidth: string
  traffic: string
  devices: string
  support: string
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

const PackagePurchasePage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('')

  const plans: PricingPlan[] = [
    {
      id: 'basic',
      name: '基础套餐',
      price: 9.9,
      period: '月',
      popular: false,
      features: [
        '100GB 月流量',
        '不限设备数量',
        '主流节点覆盖',
        '7x24 技术支持',
        '解锁主流媒体'
      ],
      bandwidth: '100 Mbps',
      traffic: '100 GB',
      devices: '不限',
      support: '邮件支持',
      color: 'primary'
    },
    {
      id: 'standard',
      name: '标准套餐',
      price: 19.9,
      originalPrice: 29.9,
      period: '月',
      popular: true,
      features: [
        '300GB 月流量',
        '不限设备数量',
        '全球节点覆盖',
        '7x24 技术支持',
        '解锁全球媒体',
        '专线加速',
        '游戏加速优化'
      ],
      bandwidth: '500 Mbps',
      traffic: '300 GB',
      devices: '不限',
      support: 'VIP 支持',
      color: 'success'
    },
    {
      id: 'premium',
      name: '高级套餐',
      price: 39.9,
      originalPrice: 59.9,
      period: '月',
      popular: false,
      features: [
        '1TB 月流量',
        '不限设备数量',
        '全球优质节点',
        '7x24 专属支持',
        '解锁全球媒体',
        '专线加速',
        '游戏加速优化',
        '企业级安全',
        '定制化服务'
      ],
      bandwidth: '1 Gbps',
      traffic: '1 TB',
      devices: '不限',
      support: '专属客服',
      color: 'warning'
    }
  ]

  const handlePurchase = (planId: string) => {
    setSelectedPlan(planId)
    // 这里可以添加购买逻辑
    console.log('购买套餐:', planId)
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
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight mb-6">
              选择您的专属套餐
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              为您提供稳定、快速、安全的网络代理服务，解锁全球网络体验
            </p>
          </div>

          {/* 套餐卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 group ${
                  plan.popular ? 'scale-105 ring-2 ring-primary ring-offset-4 ring-offset-background' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Chip
                      color="primary"
                      variant="shadow"
                      className="text-white font-bold px-4 py-1"
                      startContent={<Star className="w-4 h-4" />}
                    >
                      最受欢迎
                    </Chip>
                  </div>
                )}
                
                <CardBody className="p-8 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    plan.color === 'primary' ? 'from-blue-50/30 to-indigo-100/30 dark:from-blue-900/10 dark:to-indigo-900/20' :
                    plan.color === 'success' ? 'from-green-50/30 to-emerald-100/30 dark:from-green-900/10 dark:to-emerald-900/20' :
                    'from-amber-50/30 to-orange-100/30 dark:from-amber-900/10 dark:to-orange-900/20'
                  }`} />
                  
                  <div className="relative z-10">
                    {/* 套餐头部 */}
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl ${
                        plan.color === 'primary' ? 'bg-gradient-to-br from-blue-400 to-indigo-600' :
                        plan.color === 'success' ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
                        'bg-gradient-to-br from-amber-400 to-orange-600'
                      }`}>
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      
                      <div className="flex items-baseline justify-center gap-2 mb-2">
                        {plan.originalPrice && (
                          <span className="text-lg text-slate-400 line-through">
                            ¥{plan.originalPrice}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">
                          ¥{plan.price}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          /{plan.period}
                        </span>
                      </div>
                      
                      {plan.originalPrice && (
                        <Chip
                          color="danger"
                          variant="flat"
                          size="sm"
                          className="font-semibold"
                        >
                          立省 ¥{plan.originalPrice - plan.price}
                        </Chip>
                      )}
                    </div>

                    {/* 套餐规格 */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Wifi className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">带宽</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {plan.bandwidth}
                        </p>
                      </div>
                      
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Globe className="w-5 h-5 mx-auto mb-1 text-green-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">流量</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {plan.traffic}
                        </p>
                      </div>
                      
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Shield className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">设备</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {plan.devices}
                        </p>
                      </div>
                      
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">支持</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {plan.support}
                        </p>
                      </div>
                    </div>

                    {/* 功能列表 */}
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            plan.color === 'primary' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            plan.color === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                            'bg-amber-100 dark:bg-amber-900/30'
                          }`}>
                            <Check className={`w-3 h-3 ${
                              plan.color === 'primary' ? 'text-blue-600 dark:text-blue-400' :
                              plan.color === 'success' ? 'text-green-600 dark:text-green-400' :
                              'text-amber-600 dark:text-amber-400'
                            }`} />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 购买按钮 */}
                    <Button
                      color={plan.color}
                      size="lg"
                      className="w-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      startContent={plan.popular ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      onPress={() => handlePurchase(plan.id)}
                      disabled={selectedPlan === plan.id}
                    >
                      {selectedPlan === plan.id ? '处理中...' : '立即购买'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* 优势介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  高速稳定
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  采用优质线路和先进技术，确保网络连接快速稳定，提供极致的上网体验
                </p>
              </CardBody>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  安全加密
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  军用级加密技术保护您的网络数据安全，让您的隐私得到最完善的保护
                </p>
              </CardBody>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  全球覆盖
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  遍布全球的服务器节点，让您随时随地畅享无界网络，解锁全球内容
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </BasePage>
  )
}

export default PackagePurchasePage