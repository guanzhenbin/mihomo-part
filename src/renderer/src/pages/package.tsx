import { Button, Card, CardBody, Chip, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { useState } from 'react'
import { MdCardMembership, MdStars, MdSpeed, MdSecurity, MdDevices } from 'react-icons/md'
import { FaCrown, FaCheck, FaGift } from 'react-icons/fa6'
import { useTranslation } from 'react-i18next'

interface PackageInfo {
  id: string
  name: string
  description: string
  price: string
  originalPrice?: string
  duration: string
  features: string[]
  bandwidth: string
  devices: number
  servers: number
  popular?: boolean
  premium?: boolean
  discount?: string
}

const Package: React.FC = () => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null)
  const [currentPlan, setCurrentPlan] = useState('basic')

  // 套餐数据
  const packages: PackageInfo[] = [
    {
      id: 'basic',
      name: '基础套餐',
      description: '适合轻度使用',
      price: '¥29',
      duration: '月',
      features: [
        '10GB 高速流量',
        '20+ 全球节点',
        '2 台设备同时在线',
        '基础客服支持',
        '标准加密协议'
      ],
      bandwidth: '10GB',
      devices: 2,
      servers: 20
    },
    {
      id: 'standard',
      name: '标准套餐',
      description: '最受欢迎的选择',
      price: '¥59',
      originalPrice: '¥79',
      duration: '月',
      features: [
        '100GB 高速流量',
        '50+ 全球节点',
        '5 台设备同时在线',
        '优先客服支持',
        '高级加密协议',
        '游戏加速优化'
      ],
      bandwidth: '100GB',
      devices: 5,
      servers: 50,
      popular: true,
      discount: '25% OFF'
    },
    {
      id: 'premium',
      name: '高级套餐',
      description: '专业用户首选',
      price: '¥128',
      originalPrice: '¥158',
      duration: '月',
      features: [
        '500GB 高速流量',
        '100+ 全球节点',
        '10 台设备同时在线',
        '24/7 专属客服',
        '企业级加密',
        '专线游戏加速',
        '流媒体解锁',
        '广告拦截'
      ],
      bandwidth: '500GB',
      devices: 10,
      servers: 100,
      premium: true,
      discount: '20% OFF'
    },
    {
      id: 'unlimited',
      name: '无限套餐',
      description: '重度用户专享',
      price: '¥298',
      originalPrice: '¥368',
      duration: '月',
      features: [
        '无限高速流量',
        '150+ 全球节点',
        '无限设备连接',
        '专属客户经理',
        '军用级加密',
        '独享游戏专线',
        '全平台流媒体',
        '高级广告拦截',
        '静态IP地址',
        'API 接口访问'
      ],
      bandwidth: '无限',
      devices: 999,
      servers: 150,
      premium: true,
      discount: '19% OFF'
    }
  ]

  // 当前套餐使用情况（模拟数据）
  const currentUsage = {
    bandwidth: 45, // 45%
    devices: 3,
    maxDevices: 5,
    expiryDate: '2024-03-15',
    daysLeft: 12
  }

  const handleSelectPackage = (pkg: PackageInfo): void => {
    setSelectedPackage(pkg)
    onOpen()
  }

  const handleUpgrade = (packageId: string): void => {
    setCurrentPlan(packageId)
    onOpenChange()
    // 这里应该调用实际的升级API
    console.log('Upgrading to package:', packageId)
  }

  const getPackageIcon = (pkg: PackageInfo): React.ReactElement => {
    if (pkg.premium) return <FaCrown className="text-yellow-500" />
    if (pkg.popular) return <MdStars className="text-blue-500" />
    return <MdCardMembership className="text-cyan-400" />
  }

  const getBadgeColor = (pkg: PackageInfo): "default" | "primary" | "success" | "warning" => {
    if (pkg.premium) return 'warning'
    if (pkg.popular) return 'primary'
    return 'default'
  }

  return (
    <BasePage 
      title={t('套餐管理') || '套餐管理'}
      className="package-page-container"
    >
      <div className="space-y-6 sm:space-y-8">
          {/* 当前套餐状态 */}
          <Card className="package-status-card">
            <CardBody className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm shadow-lg">
                    <MdCardMembership className="text-2xl sm:text-3xl text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      当前套餐：标准套餐
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      到期时间：{currentUsage.expiryDate} ({currentUsage.daysLeft} 天后到期)
                    </p>
                  </div>
                </div>
                <Chip 
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 text-green-400 px-4 py-2"
                  startContent={<FaCheck className="text-sm" />}
                >
                  已激活
                </Chip>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="backdrop-blur-xl bg-white/[0.02] border-0 rounded-2xl shadow-xl shadow-black/10">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-300">流量使用</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{currentUsage.bandwidth}%</span>
                      </div>
                      <Progress 
                        size="lg" 
                        value={currentUsage.bandwidth}
                        className="h-2"
                        classNames={{
                          track: "bg-white/10 backdrop-blur-sm",
                          indicator: "bg-gradient-to-r from-blue-400 to-purple-500"
                        }}
                      />
                      <p className="text-xs text-gray-500">已用 45GB / 100GB</p>
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="backdrop-blur-xl bg-white/[0.02] border-0 rounded-2xl shadow-xl shadow-black/10">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm">
                            <MdDevices className="text-xl text-emerald-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-300">设备连接</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{currentUsage.devices}/{currentUsage.maxDevices}</span>
                      </div>
                      <div className="flex space-x-1">
                        {Array.from({ length: currentUsage.maxDevices }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${
                              i < currentUsage.devices
                                ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">在线设备数量</p>
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="backdrop-blur-xl bg-white/[0.02] border-0 rounded-2xl shadow-xl shadow-black/10 sm:col-span-2 lg:col-span-1">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-sm">
                            <MdSpeed className="text-xl text-orange-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-300">节点数量</span>
                        </div>
                        <span className="text-2xl font-bold text-white">50+</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1 rounded-full bg-gradient-to-r from-orange-400 to-yellow-500"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">全球服务器节点</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>

          {/* 套餐选择 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`backdrop-blur-2xl bg-white/[0.03] border-0 rounded-3xl shadow-2xl shadow-black/20 relative overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer group ${
                  currentPlan === pkg.id ? 'ring-2 ring-orange-500/50 shadow-orange-500/20' : ''
                } ${pkg.popular ? 'shadow-blue-500/30' : ''} ${pkg.premium ? 'shadow-yellow-500/30' : ''}`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {/* 热门标签 */}
                {pkg.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-xl border border-blue-400/30 text-blue-300 text-xs px-3 py-2 rounded-full">
                    <div className="flex items-center space-x-1">
                      <MdStars className="text-xs" />
                      <span>最受欢迎</span>
                    </div>
                  </div>
                )}
                
                {/* 折扣标签 */}
                {pkg.discount && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500/30 to-pink-500/30 backdrop-blur-xl border border-red-400/30 text-red-300 text-xs px-3 py-2 rounded-full">
                    {pkg.discount}
                  </div>
                )}

                <CardBody className="p-5 sm:p-6">
                  <div className="text-center mb-6">
                    <div className={`inline-flex p-4 rounded-2xl backdrop-blur-sm mb-4 ${
                      pkg.premium ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20' :
                      pkg.popular ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' :
                      'bg-gradient-to-br from-cyan-400/20 to-blue-500/20'
                    }`}>
                      <div className="text-3xl">
                        {getPackageIcon(pkg)}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">{pkg.name}</h3>
                    <p className="text-sm text-gray-400">{pkg.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className={`text-3xl font-bold ${
                        pkg.premium ? 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent' :
                        pkg.popular ? 'bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent' :
                        'text-white'
                      }`}>
                        {pkg.price}
                      </span>
                      <span className="text-sm text-gray-400">/{pkg.duration}</span>
                    </div>
                    {pkg.originalPrice && (
                      <div className="text-sm text-default-400 line-through mt-1">
                        原价 {pkg.originalPrice}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <Card className="backdrop-blur-xl bg-white/[0.02] border-0 rounded-2xl shadow-lg shadow-black/10">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">月流量</span>
                          <span className="font-bold text-orange-400">{pkg.bandwidth}</span>
                        </div>
                      </CardBody>
                    </Card>
                    <Card className="backdrop-blur-xl bg-white/[0.02] border-0 rounded-2xl shadow-lg shadow-black/10">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">设备数量</span>
                          <span className="font-bold text-blue-400">{pkg.devices === 999 ? '无限' : pkg.devices}</span>
                        </div>
                      </CardBody>
                    </Card>
                    <Card className="backdrop-blur-xl bg-white/[0.02] border-0 rounded-2xl shadow-lg shadow-black/10">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">节点数量</span>
                          <span className="font-bold text-cyan-400">{pkg.servers}+</span>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  <div className="space-y-2 mb-6">
                    {pkg.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="p-1 rounded-full bg-emerald-500/20 mr-2">
                          <FaCheck className="text-emerald-400 text-xs" />
                        </div>
                        <span className="truncate text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {pkg.features.length > 3 && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        +{pkg.features.length - 3} 项功能...
                      </div>
                    )}
                  </div>

                  <Button
                    fullWidth
                    size="lg"
                    color={getBadgeColor(pkg)}
                    variant={currentPlan === pkg.id ? 'flat' : 'shadow'}
                    radius="lg"
                    className={`backdrop-blur-md font-semibold transition-all duration-300 ${
                      currentPlan === pkg.id 
                        ? 'bg-success/20 shadow-lg shadow-success/20' 
                        : pkg.premium 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30 hover:scale-105'
                          : pkg.popular
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 hover:scale-105'
                            : 'shadow-lg hover:scale-105'
                    }`}
                    startContent={currentPlan === pkg.id ? <FaCheck /> : <FaGift />}
                    disabled={currentPlan === pkg.id}
                  >
                    {currentPlan === pkg.id ? '当前套餐' : '选择套餐'}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* 功能对比 */}
          <Card className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 shadow-2xl shadow-cyan-500/10">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm mr-4">
                  <MdSecurity className="text-2xl text-cyan-500" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  功能对比
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/5">
                  <CardBody className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20 dark:border-white/5">
                          <th className="text-left py-4 px-4 sm:px-6 font-semibold">功能特性</th>
                          <th className="text-center py-4 px-3 sm:px-4 font-semibold">基础</th>
                          <th className="text-center py-4 px-3 sm:px-4 font-semibold">标准</th>
                          <th className="text-center py-4 px-3 sm:px-4 font-semibold">高级</th>
                          <th className="text-center py-4 px-3 sm:px-4 font-semibold">无限</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-black/5 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-medium">月流量</td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <Chip size="sm" variant="flat" color="default" className="backdrop-blur-sm">10GB</Chip>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <Chip size="sm" variant="flat" color="primary" className="backdrop-blur-sm">100GB</Chip>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <Chip size="sm" variant="flat" color="warning" className="backdrop-blur-sm">500GB</Chip>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <Chip size="sm" variant="flat" color="success" className="backdrop-blur-sm">无限</Chip>
                          </td>
                        </tr>
                        <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-black/5 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-medium">游戏加速</td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <span className="text-default-400">-</span>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <div className="inline-flex p-1 rounded-full bg-success/20 backdrop-blur-sm">
                              <FaCheck className="text-success text-sm" />
                            </div>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <div className="inline-flex p-1 rounded-full bg-success/20 backdrop-blur-sm">
                              <FaCheck className="text-success text-sm" />
                            </div>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <div className="inline-flex p-1 rounded-full bg-success/20 backdrop-blur-sm">
                              <FaCheck className="text-success text-sm" />
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-black/5 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-medium">流媒体解锁</td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <span className="text-default-400">-</span>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <span className="text-default-400">-</span>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <div className="inline-flex p-1 rounded-full bg-success/20 backdrop-blur-sm">
                              <FaCheck className="text-success text-sm" />
                            </div>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <div className="inline-flex p-1 rounded-full bg-success/20 backdrop-blur-sm">
                              <FaCheck className="text-success text-sm" />
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-white/5 dark:hover:bg-black/5 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-medium">专属客服</td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <span className="text-default-400">-</span>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <span className="text-default-400">-</span>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <span className="text-default-400">-</span>
                          </td>
                          <td className="text-center py-4 px-3 sm:px-4">
                            <div className="inline-flex p-1 rounded-full bg-success/20 backdrop-blur-sm">
                              <FaCheck className="text-success text-sm" />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
      </div>

      {/* 套餐详情弹窗 */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" className="backdrop-blur-xl">
        <ModalContent className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-2xl backdrop-blur-sm mr-3 ${
                    selectedPackage?.premium ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20' :
                    selectedPackage?.popular ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' :
                    'bg-gradient-to-br from-cyan-400/20 to-blue-500/20'
                  }`}>
                    {selectedPackage && getPackageIcon(selectedPackage)}
                  </div>
                  <span className="text-xl font-bold">{selectedPackage?.name}</span>
                </div>
              </ModalHeader>
              <ModalBody className="p-6">
                {selectedPackage && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${
                        selectedPackage.premium ? 'bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent' :
                        selectedPackage.popular ? 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent' :
                        'text-foreground'
                      }`}>
                        {selectedPackage.price}
                      </div>
                      <div className="text-default-500 mb-2">每月</div>
                      {selectedPackage.originalPrice && (
                        <div className="text-sm text-default-400 line-through">
                          原价 {selectedPackage.originalPrice}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/5">
                        <CardBody className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary mb-1">{selectedPackage.bandwidth}</div>
                          <div className="text-sm text-default-500">月流量</div>
                        </CardBody>
                      </Card>
                      <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/5">
                        <CardBody className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-500 mb-1">
                            {selectedPackage.devices === 999 ? '∞' : selectedPackage.devices}
                          </div>
                          <div className="text-sm text-default-500">设备数</div>
                        </CardBody>
                      </Card>
                      <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/5">
                        <CardBody className="p-4 text-center">
                          <div className="text-2xl font-bold text-cyan-500 mb-1">{selectedPackage.servers}+</div>
                          <div className="text-sm text-default-500">节点数</div>
                        </CardBody>
                      </Card>
                    </div>

                    <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/5">
                      <CardBody className="p-5">
                        <h4 className="font-semibold mb-4 flex items-center">
                          <div className="p-2 rounded-lg bg-success/20 backdrop-blur-sm mr-2">
                            <FaCheck className="text-success text-sm" />
                          </div>
                          包含功能
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedPackage.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <div className="p-1 rounded-full bg-success/20 mr-3 flex-shrink-0">
                                <FaCheck className="text-success text-xs" />
                              </div>
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="p-6">
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  className="backdrop-blur-md"
                >
                  取消
                </Button>
                <Button 
                  color={selectedPackage?.premium ? 'warning' : selectedPackage?.popular ? 'primary' : 'default'}
                  variant="shadow"
                  size="lg"
                  className={`backdrop-blur-md font-semibold ${
                    currentPlan === selectedPackage?.id
                      ? 'bg-success/20 shadow-lg shadow-success/20'
                      : selectedPackage?.premium
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30'
                        : selectedPackage?.popular
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                          : 'shadow-lg'
                  }`}
                  onPress={() => selectedPackage && handleUpgrade(selectedPackage.id)}
                  disabled={currentPlan === selectedPackage?.id}
                  startContent={currentPlan === selectedPackage?.id ? <FaCheck /> : <FaGift />}
                >
                  {currentPlan === selectedPackage?.id ? '当前套餐' : '立即升级'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </BasePage>
  )
}

export default Package 