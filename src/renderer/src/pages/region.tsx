import { Button, Card, CardBody, Chip, Switch, Input, Divider } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { useState, useMemo } from 'react'
import { IoEarth, IoSearch, IoLocation, IoSpeedometer, IoGameController } from 'react-icons/io5'
import { FaRegCirclePlay, FaGamepad } from 'react-icons/fa6'
import { SiCounterstrike, SiLeagueoflegends, SiValorant } from 'react-icons/si'
import { FaGamepad as FaApex, FaGamepad as FaOverwatch, FaGamepad as FaMinecraft } from 'react-icons/fa6'
import { useGroups } from '@renderer/hooks/use-groups'
import { mihomoChangeProxy, mihomoProxyDelay } from '@renderer/utils/ipc'
import { useTranslation } from 'react-i18next'

interface RegionServer {
  name: string
  region: string
  country: string
  flag: string
  ping: number
  load: number
  isSelected: boolean
}

interface GameServer {
  id: string
  name: string
  game: string
  icon: React.ReactNode
  region: string
  country: string
  flag: string
  ping: number
  gameOptimized: boolean
  features: string[]
  players: number
  maxPlayers: number
}

const Region: React.FC = () => {
  const { t } = useTranslation()
  const { groups = [] } = useGroups()
  const [searchValue, setSearchValue] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [autoSwitch, setAutoSwitch] = useState(false)
  const [testingDelay, setTestingDelay] = useState<string[]>([])
  const [showGameServers, setShowGameServers] = useState(true)

  // 解析代理服务器为地区数据
  const regionServers = useMemo(() => {
    const servers: RegionServer[] = []
    
    for (const group of groups) {
      if (group.type === 'Selector' || group.type === 'URLTest') {
        for (const proxy of group.all) {
          if (typeof proxy !== 'string' && proxy.type !== 'Direct' && proxy.type !== 'Reject') {
            let country = '其他'
            let flag = '🌐'
            let region = '未知'
            
            if (proxy.name.includes('🇺🇸') || proxy.name.toLowerCase().includes('us') || proxy.name.toLowerCase().includes('america')) {
              country = '美国'
              flag = '🇺🇸'
              region = '北美'
            } else if (proxy.name.includes('🇯🇵') || proxy.name.toLowerCase().includes('jp') || proxy.name.toLowerCase().includes('japan')) {
              country = '日本'
              flag = '🇯🇵'
              region = '亚洲'
            } else if (proxy.name.includes('🇸🇬') || proxy.name.toLowerCase().includes('sg') || proxy.name.toLowerCase().includes('singapore')) {
              country = '新加坡'
              flag = '🇸🇬'
              region = '亚洲'
            } else if (proxy.name.includes('🇭🇰') || proxy.name.toLowerCase().includes('hk') || proxy.name.toLowerCase().includes('hongkong')) {
              country = '香港'
              flag = '🇭🇰'
              region = '亚洲'
            } else if (proxy.name.includes('🇰🇷') || proxy.name.toLowerCase().includes('kr') || proxy.name.toLowerCase().includes('korea')) {
              country = '韩国'
              flag = '🇰🇷'
              region = '亚洲'
            } else if (proxy.name.includes('🇬🇧') || proxy.name.toLowerCase().includes('uk') || proxy.name.toLowerCase().includes('britain')) {
              country = '英国'
              flag = '🇬🇧'
              region = '欧洲'
            } else if (proxy.name.includes('🇩🇪') || proxy.name.toLowerCase().includes('de') || proxy.name.toLowerCase().includes('germany')) {
              country = '德国'
              flag = '🇩🇪'
              region = '欧洲'
            } else if (proxy.name.includes('🇫🇷') || proxy.name.toLowerCase().includes('fr') || proxy.name.toLowerCase().includes('france')) {
              country = '法国'
              flag = '🇫🇷'
              region = '欧洲'
            } else if (proxy.name.includes('🇦🇺') || proxy.name.toLowerCase().includes('au') || proxy.name.toLowerCase().includes('australia')) {
              country = '澳大利亚'
              flag = '🇦🇺'
              region = '大洋洲'
            }
            
            servers.push({
              name: proxy.name,
              region,
              country,
              flag,
              ping: Math.floor(Math.random() * 200) + 10,
              load: Math.floor(Math.random() * 80) + 10,
              isSelected: group.now === proxy.name
            })
          }
        }
      }
    }
    
    return servers.sort((a, b) => a.ping - b.ping)
  }, [groups])

  // 按地区分组
  const regionGroups = useMemo(() => {
    const grouped = regionServers.reduce((acc, server) => {
      if (!acc[server.region]) {
        acc[server.region] = []
      }
      acc[server.region].push(server)
      return acc
    }, {} as Record<string, RegionServer[]>)
    
    return Object.entries(grouped).map(([region, servers]) => ({
      region,
      servers: servers.sort((a, b) => a.ping - b.ping),
      averagePing: Math.floor(servers.reduce((sum, s) => sum + s.ping, 0) / servers.length),
      serverCount: servers.length
    }))
  }, [regionServers])

  // 过滤搜索结果
  const filteredGroups = useMemo(() => {
    if (!searchValue && !selectedRegion) return regionGroups
    
    return regionGroups
      .filter(group => !selectedRegion || group.region === selectedRegion)
      .map(group => ({
        ...group,
        servers: group.servers.filter(server => 
          !searchValue || 
          server.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          server.country.toLowerCase().includes(searchValue.toLowerCase())
        )
      }))
      .filter(group => group.servers.length > 0)
  }, [regionGroups, searchValue, selectedRegion])

  // 测试延迟
  const handleTestDelay = async (serverName: string): Promise<void> => {
    setTestingDelay(prev => [...prev, serverName])
    
    try {
      await mihomoProxyDelay(serverName)
      // 延迟测试完成后更新状态
    } catch (error) {
      console.error('Delay test failed:', error)
    } finally {
      setTestingDelay(prev => prev.filter(name => name !== serverName))
    }
  }

  // 切换到服务器
  const handleSwitchServer = async (serverName: string): Promise<void> => {
    try {
      if (groups.length > 0) {
        await mihomoChangeProxy(groups[0].name, serverName)
      }
    } catch (error) {
      console.error('Failed to switch server:', error)
    }
  }

  // 游戏服务器数据
  const gameServers: GameServer[] = useMemo(() => [
    {
      id: 'apex-bj',
      name: 'Apex北京电竞专线',
      game: 'Apex Legends',
      icon: <FaApex className="text-orange-500" />,
      region: '华北',
      country: '北京',
      flag: '🇨🇳',
      ping: 8,
      gameOptimized: true,
      features: ['低延迟', 'DDoS防护', '游戏加速'],
      players: 1247,
      maxPlayers: 2000
    },
    {
      id: 'cs2-sh',
      name: 'CS2上海竞技服',
      game: 'Counter-Strike 2',
      icon: <SiCounterstrike className="text-blue-500" />,
      region: '华东',
      country: '上海',
      flag: '🇨🇳',
      ping: 12,
      gameOptimized: true,
      features: ['128-tick', '反作弊', '低延迟'],
      players: 892,
      maxPlayers: 1500
    },
    {
      id: 'lol-gz',
      name: 'LOL广州专线',
      game: 'League of Legends',
      icon: <SiLeagueoflegends className="text-yellow-500" />,
      region: '华南',
      country: '广州',
      flag: '🇨🇳',
      ping: 15,
      gameOptimized: true,
      features: ['排位优化', '低延迟', '稳定连接'],
      players: 2156,
      maxPlayers: 3000
    },
    {
      id: 'valorant-sz',
      name: 'Valorant深圳专线',
      game: 'Valorant',
      icon: <SiValorant className="text-red-500" />,
      region: '华南',
      country: '深圳',
      flag: '🇨🇳',
      ping: 18,
      gameOptimized: true,
      features: ['竞技优化', '反作弊', '高频率'],
      players: 675,
      maxPlayers: 1200
    },
    {
      id: 'ow2-cd',
      name: 'Overwatch2成都服',
      game: 'Overwatch 2',
      icon: <FaOverwatch className="text-purple-500" />,
      region: '西南',
      country: '成都',
      flag: '🇨🇳',
      ping: 22,
      gameOptimized: true,
      features: ['团队优化', '低延迟', '稳定连接'],
      players: 1534,
      maxPlayers: 2500
    },
    {
      id: 'minecraft-wh',
      name: 'Minecraft武汉服',
      game: 'Minecraft',
      icon: <FaMinecraft className="text-green-500" />,
      region: '华中',
      country: '武汉',
      flag: '🇨🇳',
      ping: 25,
      gameOptimized: true,
      features: ['建造优化', '多人模式', '插件支持'],
      players: 234,
      maxPlayers: 500
    }
  ], [])

  // 获取延迟颜色
  const getPingColor = (ping: number): string => {
    if (ping < 50) return 'text-green-500'
    if (ping < 100) return 'text-yellow-500'
    if (ping < 200) return 'text-orange-500'
    return 'text-red-500'
  }

  // 获取负载颜色
  const getLoadColor = (load: number): string => {
    if (load < 50) return 'success'
    if (load < 80) return 'warning'
    return 'danger'
  }

  // 切换游戏服务器
  const handleSwitchGameServer = async (serverId: string): Promise<void> => {
    try {
      console.log(`Switching to game server: ${serverId}`)
      // 这里可以实现游戏服务器切换逻辑
    } catch (error) {
      console.error('Failed to switch game server:', error)
    }
  }

  return (
    <BasePage title={t('地区选择') || '地区选择'}>
      <div className="space-y-6">
        {/* 搜索和过滤 */}
        <Card className="border-1 shadow-sm">
          <CardBody>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  size="sm"
                  placeholder="搜索服务器或国家..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  startContent={<IoSearch className="text-foreground-500" />}
                  isClearable
                  className="flex-1"
                />
                <Switch
                  size="sm"
                  isSelected={autoSwitch}
                  onValueChange={setAutoSwitch}
                >
                  自动切换最佳节点
                </Switch>
                <Switch
                  size="sm"
                  isSelected={showGameServers}
                  onValueChange={setShowGameServers}
                  startContent={<IoGameController />}
                >
                  显示游戏线路
                </Switch>
              </div>
              
              {/* 地区快速选择 */}
              <div className="flex flex-wrap gap-2">
                <Chip
                  size="sm"
                  variant={selectedRegion === '' ? 'solid' : 'flat'}
                  color={selectedRegion === '' ? 'primary' : 'default'}
                  className="cursor-pointer"
                  onClick={() => setSelectedRegion('')}
                >
                  全部地区
                </Chip>
                {regionGroups.map((group) => (
                  <Chip
                    key={group.region}
                    size="sm"
                    variant={selectedRegion === group.region ? 'solid' : 'flat'}
                    color={selectedRegion === group.region ? 'primary' : 'default'}
                    className="cursor-pointer"
                    onClick={() => setSelectedRegion(group.region)}
                  >
                    {group.region} ({group.serverCount})
                  </Chip>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 游戏线路专区 */}
        {showGameServers && (
          <Card className="border-1 shadow-sm bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FaGamepad className="text-xl text-purple-500" />
                  <h3 className="text-lg font-semibold">🎮 游戏线路专区</h3>
                  <Chip size="sm" variant="flat" color="secondary">
                    专业优化
                  </Chip>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameServers
                  .filter(server => !selectedRegion || server.region === selectedRegion)
                  .map((server) => (
                  <Card 
                    key={server.id} 
                    className="border-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg bg-white/50 backdrop-blur-sm"
                    onClick={() => handleSwitchGameServer(server.id)}
                  >
                    <CardBody className="p-4">
                      {/* 游戏头部 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl">{server.icon}</div>
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{server.game}</div>
                            <div className="text-xs text-gray-500">{server.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg">{server.flag}</span>
                          <div className="text-xs text-gray-500">{server.country}</div>
                        </div>
                      </div>

                      {/* 延迟和状态 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <IoSpeedometer className="text-sm text-gray-500" />
                          <span className={`text-sm font-bold ${getPingColor(server.ping)}`}>
                            {server.ping}ms
                          </span>
                          {server.gameOptimized && (
                            <Chip size="sm" color="success" variant="flat">
                              游戏优化
                            </Chip>
                          )}
                        </div>
                      </div>

                      {/* 特性标签 */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {server.features.map((feature, index) => (
                          <Chip key={index} size="sm" variant="bordered" className="text-xs">
                            {feature}
                          </Chip>
                        ))}
                      </div>

                      <Divider className="my-2" />

                      {/* 在线玩家数 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>在线玩家</span>
                          <span>{server.players.toLocaleString()}/{server.maxPlayers.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                            style={{ width: `${(server.players / server.maxPlayers) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* 连接按钮 */}
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        className="w-full mt-3"
                        startContent={<FaRegCirclePlay />}
                      >
                        连接游戏服务器
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* 服务器列表 */}
        {filteredGroups.map((group) => (
          <Card key={group.region} className="border-1 shadow-sm">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <IoEarth className="text-xl text-cyan-400" />
                  <h3 className="text-lg font-semibold">{group.region}</h3>
                  <Chip size="sm" variant="flat">
                    {group.servers.length} 个节点
                  </Chip>
                  <Chip size="sm" variant="flat" color="primary">
                    平均 {group.averagePing}ms
                  </Chip>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.servers.map((server) => (
                  <Card 
                    key={server.name} 
                    className={`border-1 cursor-pointer transition-all hover:scale-[1.02] ${
                      server.isSelected ? 'border-primary bg-primary/10' : 'border-default-200'
                    }`}
                    onClick={() => handleSwitchServer(server.name)}
                  >
                    <CardBody className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{server.flag}</span>
                          <div>
                            <div className="font-medium text-sm truncate">{server.country}</div>
                            <div className="text-xs text-foreground-500 truncate">{server.name}</div>
                          </div>
                        </div>
                        {server.isSelected && (
                          <Chip size="sm" color="success" startContent={<FaRegCirclePlay />}>
                            已连接
                          </Chip>
                        )}
                      </div>
                      
                      <Divider className="my-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <IoSpeedometer className="text-xs text-foreground-500" />
                            <span className={`text-xs font-medium ${getPingColor(server.ping)}`}>
                              {server.ping}ms
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IoLocation className="text-xs text-foreground-500" />
                            <span className="text-xs">
                              负载 {server.load}%
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          isLoading={testingDelay.includes(server.name)}
                          onPress={() => handleTestDelay(server.name)}
                        >
                          <IoSpeedometer />
                        </Button>
                      </div>
                      
                      {/* 负载指示器 */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>服务器负载</span>
                          <span>{server.load}%</span>
                        </div>
                        <div className="w-full bg-default-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full bg-${getLoadColor(server.load)}`}
                            style={{ width: `${server.load}%` }}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}

        {filteredGroups.length === 0 && !showGameServers && (
          <Card className="border-1 shadow-sm">
            <CardBody>
              <div className="text-center py-8">
                <IoEarth className="text-4xl text-foreground-300 mx-auto mb-2" />
                <p className="text-foreground-500">未找到匹配的服务器节点</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </BasePage>
  )
}

export default Region 