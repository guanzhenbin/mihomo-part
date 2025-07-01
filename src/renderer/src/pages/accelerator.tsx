import { Button, Card, CardBody, Progress, Select, SelectItem, Switch, Chip, Avatar } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { useState, useEffect, useMemo } from 'react'
import { MdTrendingUp, MdNetworkCheck } from 'react-icons/md'
import { FaRegCirclePlay, FaRegCircleStop, FaGamepad, FaWifi, FaBolt, FaShield, FaUsers, FaClock, FaChartLine } from 'react-icons/fa6'
import { useGroups } from '@renderer/hooks/use-groups'
import { mihomoChangeProxy } from '@renderer/utils/ipc'
import { useTranslation } from 'react-i18next'

const Accelerator: React.FC = () => {
  const { t } = useTranslation()
  const { groups = [] } = useGroups()
  const [isAccelerating, setIsAccelerating] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedGame, setSelectedGame] = useState('')
  const [selectedServer, setSelectedServer] = useState('')
  const [ping, setPing] = useState(0)
  const [loss, setLoss] = useState(0)
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('')

  // 模拟游戏列表
  const gameOptions = [
    { key: 'pubg', label: 'PUBG Mobile', icon: '🎮', genre: '射击', players: '220M' },
    { key: 'lol', label: '英雄联盟', icon: '⚔️', genre: 'MOBA', players: '180M' },
    { key: 'apex', label: 'Apex Legends', icon: '🎯', genre: '射击', players: '100M' },
    { key: 'cod', label: 'Call of Duty', icon: '🔫', genre: '射击', players: '125M' },
    { key: 'valorant', label: 'Valorant', icon: '💥', genre: '射击', players: '70M' },
    { key: 'csgo', label: 'CS:GO', icon: '🎪', genre: '射击', players: '50M' },
    { key: 'overwatch', label: 'Overwatch 2', icon: '🚀', genre: '射击', players: '35M' },
    { key: 'fortnite', label: 'Fortnite', icon: '🏗️', genre: '射击', players: '400M' }
  ]

  // 获取所有地区列表
  const allRegions = useMemo(() => {
    const set = new Set<string>()
    for (const group of groups) {
      if (group.type === 'Selector' || group.type === 'URLTest') {
        for (const proxy of group.all) {
          if (typeof proxy !== 'string' && proxy.type !== 'Direct' && proxy.type !== 'Reject') {
            const region = proxy.name.includes('🇺🇸') ? '美国' : 
                          proxy.name.includes('🇯🇵') ? '日本' : 
                          proxy.name.includes('🇸🇬') ? '新加坡' : 
                          proxy.name.includes('🇭🇰') ? '香港' : 
                          proxy.name.includes('🇰🇷') ? '韩国' : '其他'
            set.add(region)
          }
        }
      }
    }
    return Array.from(set)
  }, [groups])

  // 获取可用的游戏加速服务器（按地区过滤）
  const serverOptions = useMemo(() => {
    const gameServers: {name: string, region: string, ping: number, load: number}[] = []
    for (const group of groups) {
      if (group.type === 'Selector' || group.type === 'URLTest') {
        for (const proxy of group.all) {
          if (typeof proxy !== 'string' && proxy.type !== 'Direct' && proxy.type !== 'Reject') {
            const region = proxy.name.includes('🇺🇸') ? '美国' : 
                          proxy.name.includes('🇯🇵') ? '日本' : 
                          proxy.name.includes('🇸🇬') ? '新加坡' : 
                          proxy.name.includes('🇭🇰') ? '香港' : 
                          proxy.name.includes('🇰🇷') ? '韩国' : '其他'
            if (!selectedRegion || region === selectedRegion) {
              gameServers.push({
                name: proxy.name,
                region,
                ping: Math.floor(Math.random() * 100) + 10,
                load: Math.floor(Math.random() * 80) + 10
              })
            }
          }
        }
      }
    }
    return [...new Map(gameServers.map(server => [server.name, server])).values()]
      .sort((a, b) => a.ping - b.ping)
  }, [groups, selectedRegion])

  // 模拟统计数据
  const [stats] = useState({
    totalUsers: 67,
    activeConnections: 24,
    averageLatency: 45,
    networkOptimization: 85
  })

  // 模拟网络延迟和丢包率
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAccelerating) {
        setPing(Math.floor(Math.random() * 30) + 15) // 15-45ms
        setLoss(Math.random() * 2) // 0-2%
      } else {
        setPing(Math.floor(Math.random() * 80) + 60) // 60-140ms
        setLoss(Math.random() * 8 + 2) // 2-10%
      }
    }, 2000)
    
    return (): void => clearInterval(interval)
  }, [isAccelerating])

  // 处理加速开关
  const handleToggleAcceleration = async (): Promise<void> => {
    setIsConnecting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newState = !isAccelerating
      setIsAccelerating(newState)
      
      // 切换代理 - 如果没有选择服务器，使用默认的第一个可用服务器
      if (groups.length > 0) {
        const targetServer = newState ? (selectedServer || serverOptions[0]?.name || 'DIRECT') : 'DIRECT'
        await mihomoChangeProxy(groups[0].name, targetServer)
      }
    } catch (error) {
      console.error('Failed to toggle acceleration:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  // 自动优化设置
  const handleAutoOptimize = (enabled: boolean): void => {
    setAutoOptimize(enabled)
    if (enabled && serverOptions.length > 0) {
      // 自动选择延迟最低的服务器
      const bestServer = serverOptions.reduce((prev, current) => 
        prev.ping < current.ping ? prev : current
      )
      setSelectedServer(bestServer.name)
    }
  }

  // 切换地区时重置服务器选择
  const handleRegionChange = (region: string): void => {
    setSelectedRegion(region)
    setSelectedServer('')
  }

  return (
    <BasePage title={t('游戏加速') || '游戏加速'} className="accelerator-page-container">
      <div className="p-6 space-y-6">
        {/* 顶部标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2">
            游戏加速概览
          </h1>
          <p className="text-slate-400">实时网络优化监控</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="accelerator-stats-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">连接用户</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <FaUsers className="text-orange-400 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <MdTrendingUp className="text-green-400 text-sm mr-1" />
                <span className="text-green-400 text-sm">+12%</span>
                <span className="text-slate-400 text-sm ml-1">较昨日</span>
              </div>
            </CardBody>
          </Card>

          <Card className="accelerator-stats-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">活跃连接</p>
                  <p className="text-2xl font-bold">{stats.activeConnections}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <MdNetworkCheck className="text-blue-400 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <MdTrendingUp className="text-green-400 text-sm mr-1" />
                <span className="text-green-400 text-sm">+8%</span>
                <span className="text-slate-400 text-sm ml-1">较昨日</span>
              </div>
            </CardBody>
          </Card>

          <Card className="accelerator-stats-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">平均延迟</p>
                  <p className="text-2xl font-bold">{ping}ms</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <FaClock className="text-purple-400 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <MdTrendingUp className="text-green-400 text-sm mr-1" />
                <span className="text-green-400 text-sm">-15%</span>
                <span className="text-slate-400 text-sm ml-1">较昨日</span>
              </div>
            </CardBody>
          </Card>

          <Card className="accelerator-stats-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">网络优化</p>
                  <p className="text-2xl font-bold">{stats.networkOptimization}%</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <FaChartLine className="text-green-400 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <Progress 
                  value={stats.networkOptimization} 
                  color="success"
                  size="sm"
                  className="w-full"
                  classNames={{
                    track: "bg-slate-700",
                    indicator: "bg-gradient-to-r from-green-500 to-emerald-500"
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 中央圆形加速按钮区域 */}
        <div className="flex justify-center my-12">
          <div className="relative">
            {/* 最外层超级光圈 */}
            <div className={`absolute inset-0 rounded-full transition-all duration-2000 ${
              isAccelerating 
                ? 'animate-ping bg-gradient-to-r from-cyan-400/30 via-blue-500/20 to-purple-600/30' 
                : 'bg-gradient-to-r from-orange-400/20 via-red-500/15 to-pink-600/20'
            }`} style={{ transform: 'scale(1.8)', animationDuration: '3s' }}></div>
            
            {/* 外层光圈动画 */}
            <div className={`absolute inset-0 rounded-full transition-all duration-1500 ${
              isAccelerating 
                ? 'animate-pulse bg-gradient-to-r from-green-400/40 via-emerald-500/30 to-teal-600/40' 
                : 'bg-gradient-to-r from-orange-400/30 via-red-500/20 to-rose-600/30 animate-bounce'
            }`} style={{ transform: 'scale(1.5)', animationDuration: '2s' }}></div>
            
            {/* 中层旋转光环 */}
            <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              isAccelerating 
                ? 'bg-gradient-to-r from-green-400/50 to-blue-500/50 animate-spin' 
                : 'bg-gradient-to-r from-orange-400/40 to-red-500/40'
            }`} style={{ transform: 'scale(1.3)', animationDuration: '4s' }}></div>
            
            {/* 内层闪烁光圈 */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
              isAccelerating 
                ? 'bg-gradient-to-r from-green-300/60 to-blue-400/60 animate-pulse' 
                : 'bg-gradient-to-r from-orange-300/50 to-red-400/50'
            }`} style={{ transform: 'scale(1.1)', animationDuration: '1.5s' }}></div>
            
            {/* 主按钮 */}
            <Button
              isIconOnly
              size="lg"
              className={`w-52 h-52 rounded-full text-white text-3xl font-bold transition-all duration-700 transform hover:scale-110 active:scale-95 relative overflow-hidden ${
                isAccelerating 
                  ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 shadow-2xl shadow-green-500/70' 
                  : isConnecting
                    ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl shadow-yellow-500/70 animate-pulse'
                    : 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 shadow-2xl shadow-orange-500/70'
              } ${isConnecting ? 'animate-pulse' : ''}`}
              onPress={handleToggleAcceleration}
              disabled={isConnecting}
              style={{
                background: isAccelerating 
                  ? 'linear-gradient(135deg, #10b981, #06b6d4, #3b82f6, #8b5cf6)'
                  : isConnecting
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)'
                    : 'linear-gradient(135deg, #f97316, #dc2626, #be185d)',
                backgroundSize: '400% 400%',
                animation: isAccelerating || isConnecting ? 'gradient-shift 3s ease infinite' : 'none'
              }}
            >
              {/* 内部光效 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-30"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
              
              <div className="flex flex-col items-center relative z-10">
                {isConnecting ? (
                  <div className="relative">
                    <div className="animate-spin h-16 w-16 border-4 border-white rounded-full border-t-transparent mb-3" />
                    <div className="absolute inset-0 animate-ping h-16 w-16 border-2 border-white rounded-full opacity-20"></div>
                  </div>
                ) : (
                  <div className={`text-6xl mb-3 transition-all duration-500 ${
                    isAccelerating ? 'animate-pulse' : 'hover:scale-110'
                  }`}>
                    {isAccelerating ? <FaRegCircleStop /> : <FaRegCirclePlay />}
                  </div>
                )}
                <span className="text-xl font-bold tracking-wide">
                  {isConnecting ? '连接中' : (isAccelerating ? '停止加速' : '启动加速')}
                </span>
              </div>
              
              {/* 闪光效果 */}
              <div className={`absolute inset-0 rounded-full transition-opacity duration-1000 ${
                isAccelerating ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="absolute top-4 left-8 w-2 h-2 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-12 right-6 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-6 right-10 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </Button>

            {/* 状态指示文字 */}
            <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center">
              <Chip 
                variant="flat" 
                color={isAccelerating ? "success" : "default"}
                className={`text-xl px-6 py-3 font-bold transition-all duration-500 ${
                  isAccelerating ? 'animate-bounce bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-400' : ''
                }`}
              >
                {isAccelerating ? "🚀 极速加速中" : isConnecting ? "⚡ 正在连接" : "⏸️ 待机状态"}
              </Chip>
            </div>
            
            {/* 电流效果线条 */}
            {isAccelerating && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 w-px h-8 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 left-1/2 w-px h-8 bg-gradient-to-t from-cyan-400 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute left-0 top-1/2 h-px w-8 bg-gradient-to-r from-cyan-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute right-0 top-1/2 h-px w-8 bg-gradient-to-l from-cyan-400 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              </div>
            )}
          </div>
        </div>

        {/* 配置区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-16">
          {/* 游戏和服务器选择 */}
          <Card className="accelerator-main-card">
            <CardBody className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <FaGamepad className="text-orange-400 text-xl" />
                </div>
                <h3 className="text-xl font-bold">游戏配置</h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Chip
                    size="sm"
                    variant={selectedRegion === '' ? 'solid' : 'flat'}
                    color={selectedRegion === '' ? 'primary' : 'default'}
                    className="cursor-pointer"
                    onClick={() => handleRegionChange('')}
                  >
                    全部地区
                  </Chip>
                  {allRegions.map(region => (
                    <Chip
                      key={region}
                      size="sm"
                      variant={selectedRegion === region ? 'solid' : 'flat'}
                      color={selectedRegion === region ? 'primary' : 'default'}
                      className="cursor-pointer"
                      onClick={() => handleRegionChange(region)}
                    >
                      {region}
                    </Chip>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">选择游戏</label>
                  <Select
                    placeholder="请选择要加速的游戏"
                    selectedKeys={selectedGame ? [selectedGame] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string
                      setSelectedGame(selected || '')
                    }}
                    classNames={{
                      trigger: "bg-slate-700/50 border-slate-600 data-[hover=true]:bg-slate-700/70",
                      value: "text-foreground",
                      listbox: "bg-slate-800"
                    }}
                  >
                    {gameOptions.map((game) => (
                      <SelectItem key={game.key} textValue={game.label}>
                        <div className="flex items-center">
                          <span className="mr-3 text-lg">{game.icon}</span>
                          <div>
                            <p className="font-semibold">{game.label}</p>
                            <p className="text-xs text-slate-400">{game.genre} · {game.players} 玩家</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-300">加速节点</label>
                    <Switch
                      size="sm"
                      isSelected={autoOptimize}
                      onValueChange={handleAutoOptimize}
                      disabled={isAccelerating}
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-orange-500"
                      }}
                    >
                      <span className="text-xs font-medium text-slate-300">智能优选</span>
                    </Switch>
                  </div>
                  <Select
                    placeholder="请选择加速服务器"
                    selectedKeys={selectedServer ? [selectedServer] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string
                      setSelectedServer(selected || '')
                    }}
                    isDisabled={autoOptimize}
                    classNames={{
                      trigger: "bg-slate-700/50 border-slate-600 data-[hover=true]:bg-slate-700/70",
                      value: "text-foreground",
                      listbox: "bg-slate-800"
                    }}
                  >
                    {serverOptions.map((server) => (
                      <SelectItem key={server.name} textValue={server.name}>
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">{server.name}</span>
                          <div className="flex items-center space-x-2">
                            <Chip size="sm" className="bg-slate-700 text-slate-300">{server.region}</Chip>
                            <span className={`text-sm font-bold ${
                              server.ping < 50 ? 'text-green-400' : 
                              server.ping < 100 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {server.ping}ms
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 实时监控 */}
          <Card className="accelerator-main-card">
            <CardBody className="p-6">
              <h3 className="text-xl font-bold mb-6">实时监控</h3>
              
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <svg width="128" height="128" viewBox="0 0 128 128" className="absolute top-0 left-0">
                      <defs>
                        <linearGradient id="circle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <circle
                        cx="64" cy="64" r="54"
                        stroke="#e5e7eb" strokeWidth="12" fill="none"
                      />
                      <circle
                        cx="64" cy="64" r="54"
                        stroke="url(#circle-gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - stats.networkOptimization / 100)}
                        strokeLinecap="round"
                        style={{
                          filter: isAccelerating ? 'url(#glow)' : 'none',
                          transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                      <span className={`text-4xl font-extrabold tracking-tight ${isAccelerating ? 'text-green-500 drop-shadow-lg' : 'text-slate-700'}`}>{stats.networkOptimization}%</span>
                      <span className="text-base font-semibold text-slate-400 mt-1 tracking-wide">优化率</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="accelerator-server-item flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <FaBolt className="text-yellow-400" />
                      <span className="text-sm text-slate-300">当前延迟</span>
                    </div>
                    <span className={`font-bold ${
                      ping < 50 ? 'text-green-400' : ping < 100 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {ping}ms
                    </span>
                  </div>

                  <div className="accelerator-server-item flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <FaWifi className="text-blue-400" />
                      <span className="text-sm text-slate-300">丢包率</span>
                    </div>
                    <span className={`font-bold ${loss > 5 ? 'text-red-400' : 'text-green-400'}`}>
                      {loss.toFixed(1)}%
                    </span>
                  </div>

                  <div className="accelerator-server-item flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <FaShield className="text-green-400" />
                      <span className="text-sm text-slate-300">连接状态</span>
                    </div>
                    <Chip 
                      size="sm" 
                      color={isAccelerating ? "success" : "default"}
                      variant="flat"
                    >
                      {isAccelerating ? "已加速" : "未加速"}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 服务器状态列表 */}
        <Card className="accelerator-main-card">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">服务器状态</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-400">实时监控</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serverOptions.slice(0, 6).map((server) => (
                <div key={server.name} className="accelerator-server-item p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        size="sm"
                        className="bg-slate-600"
                        name={server.region[0]}
                      />
                      <div>
                        <p className="font-medium text-sm">{server.name}</p>
                        <p className="text-xs text-slate-400">{server.region}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">延迟</p>
                      <p className={`font-bold text-sm ${
                        server.ping < 50 ? 'text-green-400' : 
                        server.ping < 100 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {server.ping}ms
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">负载</p>
                      <p className="text-sm font-medium">{server.load}%</p>
                    </div>
                    <Chip 
                      size="sm" 
                      color={server.load < 50 ? "success" : server.load < 80 ? "warning" : "danger"}
                      variant="flat"
                      className="text-xs"
                    >
                      {server.load < 50 ? "优秀" : server.load < 80 ? "良好" : "繁忙"}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </BasePage>
  )
}

export default Accelerator 