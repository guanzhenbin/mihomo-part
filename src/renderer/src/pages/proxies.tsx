import { Avatar, Button, Card, CardBody, Chip, Select, SelectItem, Tooltip, Progress } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import {
  getImageDataURL,
  mihomoChangeProxy,
  mihomoCloseAllConnections,
  mihomoProxyDelay
} from '@renderer/utils/ipc'
import { CgDetailsLess, CgDetailsMore } from 'react-icons/cg'
import { TbCircleLetterD } from 'react-icons/tb'
import { FaLocationCrosshairs, FaServer, FaNetworkWired, FaRegCirclePlay, FaRegCircleStop } from 'react-icons/fa6'
import { RxLetterCaseCapitalize } from 'react-icons/rx'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { GroupedVirtuoso, type GroupedVirtuosoHandle } from 'react-virtuoso'
import ProxyItem from '@renderer/components/proxies/proxy-item'
import { IoIosArrowBack } from 'react-icons/io'
import { MdDoubleArrow, MdOutlineSpeed } from 'react-icons/md'
import { useGroups } from '@renderer/hooks/use-groups'
import CollapseInput from '@renderer/components/base/collapse-input'
import { includesIgnoreCase } from '@renderer/utils/includes'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { useTranslation } from 'react-i18next'

// VPN UI 组件
const VpnStatusCard: React.FC = () => {
  const { t } = useTranslation();
  const { groups = [] } = useGroups();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState("");
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [totalTraffic, setTotalTraffic] = useState({ upload: 0, download: 0 });
  
  // 模拟获取流量数据
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        setUploadSpeed(Math.floor(Math.random() * 1000));
        setDownloadSpeed(Math.floor(Math.random() * 5000));
        setTotalTraffic(prev => ({
          upload: prev.upload + Math.floor(Math.random() * 100),
          download: prev.download + Math.floor(Math.random() * 400)
        }));
      }
    }, 2000);
    
    return (): void => clearInterval(interval);
  }, [isConnected]);
  
  // 格式化速度和流量单位
  const formatSpeed = (speed: number): string => {
    if (speed < 1024) return `${speed} KB/s`;
    return `${(speed / 1024).toFixed(2)} MB/s`;
  };
  
  const formatTraffic = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} GB`;
  };
  
  // 获取可用的服务器列表
  const serverOptions = useMemo(() => {
    const allServers: {name: string, icon?: string}[] = [];
    
    for (const group of groups) {
      if (group.type === 'Selector' || group.type === 'URLTest') {
        for (const proxy of group.all) {
          if (typeof proxy !== 'string' && proxy.type !== 'Direct' && proxy.type !== 'Reject') {
            allServers.push({
              name: proxy.name,
              icon: proxy.name.includes('🇺🇸') ? '🇺🇸' : 
                    proxy.name.includes('🇯🇵') ? '🇯🇵' : 
                    proxy.name.includes('🇸🇬') ? '🇸🇬' : 
                    proxy.name.includes('🇭🇰') ? '🇭🇰' : undefined
            });
          }
        }
      }
    }
    
    return [...new Map(allServers.map(server => [server.name, server])).values()];
  }, [groups]);
  
  // 处理连接/断开
  const handleToggleConnection = async (): Promise<void> => {
    if (!isConnected && !selectedServer && serverOptions.length > 0) {
      // 如果未选择服务器，默认选第一个
      setSelectedServer(serverOptions[0].name);
    }
    
    setIsConnecting(true);
    
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 切换连接状态
      const newConnectedState = !isConnected;
      setIsConnected(newConnectedState);
      
      // 实际应用中，这里应调用真实的连接/断开API
      // 如果已经选择了代理，可以用 mihomoChangeProxy 切换
      if (selectedServer && groups.length > 0) {
        await mihomoChangeProxy(groups[0].name, newConnectedState ? selectedServer : 'DIRECT');
        
        if (!newConnectedState) {
          // 断开连接
          setUploadSpeed(0);
          setDownloadSpeed(0);
        }
      }
    } catch (error) {
      console.error('Failed to change proxy:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // 按钮文本和颜色逻辑
  const buttonText = isConnected ? t('断开连接') : t('连接');
  const buttonColor = isConnected ? "danger" : "primary";
  
  // 连接状态文本
  const statusText = isConnecting 
    ? (isConnected ? t('正在断开...') : t('正在连接...'))
    : (isConnected ? t('已连接') : t('未连接'));

  return (
    <Card className="mb-4 border-1 shadow-sm">
      <CardBody>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaNetworkWired className="text-2xl text-primary" />
              <h2 className="text-xl font-semibold">{t('VPN状态')}</h2>
              <Chip color={isConnecting ? "warning" : isConnected ? "success" : "default"} variant="flat">
                {statusText}
              </Chip>
            </div>
            <Button
              color={buttonColor}
              startContent={
                isConnecting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                ) : (
                  <div className="transform transition-transform duration-300 ease-in-out">
                    {isConnected ? <FaRegCircleStop /> : <FaRegCirclePlay />}
                  </div>
                )
              }
              onPress={handleToggleConnection}
              disabled={isConnecting}
              className="transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
            >
              {buttonText}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <FaServer className="mr-2 text-foreground-500" />
                  <label htmlFor="server-select" className="text-sm text-foreground-500 mr-2">{t('服务器')}:</label>
                  <Select
                    id="server-select"
                    size="sm"
                    className="flex-grow"
                    placeholder={t('选择服务器')}
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    disabled={isConnected || isConnecting}
                  >
                    {serverOptions.map((server) => (
                      <SelectItem key={server.name} value={server.name}>
                        <div className="flex items-center">
                          {server.icon && <span className="mr-1">{server.icon}</span>}
                          {server.name}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('下载')}: {formatSpeed(downloadSpeed)}</span>
                      <span>{t('总计')}: {formatTraffic(totalTraffic.download)}</span>
                    </div>
                    <Progress 
                      size="sm" 
                      color="success" 
                      value={Math.min(downloadSpeed / 50, 100)} 
                      className="h-2 transition-all duration-700 ease-in-out"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('上传')}: {formatSpeed(uploadSpeed)}</span>
                      <span>{t('总计')}: {formatTraffic(totalTraffic.upload)}</span>
                    </div>
                    <Progress 
                      size="sm" 
                      color="warning" 
                      value={Math.min(uploadSpeed / 20, 100)} 
                      className="h-2 transition-all duration-700 ease-in-out"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center items-center">
              <Tooltip content={isConnected ? t('连接信息安全') : t('未连接')}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ease-in-out ${
                  isConnecting 
                    ? 'bg-warning/20 animate-pulse' 
                    : isConnected 
                      ? 'bg-success/20' 
                      : 'bg-default/20'
                }`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ease-in-out ${
                    isConnecting 
                      ? 'bg-warning/30' 
                      : isConnected 
                        ? 'bg-success/30' 
                        : 'bg-default/30'
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-500 ease-in-out transform ${
                      isConnecting ? 'animate-pulse bg-warning text-white' : 
                      isConnected ? 'bg-success text-white' : 'bg-default-100'
                    } ${isConnecting ? 'scale-95' : 'scale-100'}`}>
                      {isConnecting 
                        ? <div className="animate-spin h-8 w-8 border-3 border-current rounded-full border-t-transparent" />
                        : isConnected ? "✓" : "✗"
                      }
                    </div>
                  </div>
                </div>
              </Tooltip>
              <p className="mt-2 text-sm text-center text-foreground-500 transition-opacity duration-300">
                {isConnecting 
                  ? t('正在处理您的请求...') 
                  : isConnected 
                    ? t('您的连接已加密') 
                    : t('连接VPN以保护您的网络')
                }
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const GROUP_EXPAND_STATE_KEY = 'proxy_group_expand_state'

// 自定义 hook 用于管理展开状态
const useProxyState = (groups: IMihomoMixedGroup[]): {
  virtuosoRef: React.RefObject<GroupedVirtuosoHandle>;
  isOpen: boolean[];
  setIsOpen: React.Dispatch<React.SetStateAction<boolean[]>>;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
} => {
  const virtuosoRef = useRef<GroupedVirtuosoHandle>(null)
  
  // 初始化展开状态
  const [isOpen, setIsOpen] = useState<boolean[]>(() => {
    try {
      const savedState = localStorage.getItem(GROUP_EXPAND_STATE_KEY)
      return savedState ? JSON.parse(savedState) : Array(groups.length).fill(false)
    } catch (error) {
      console.error('Failed to load group expand state:', error)
      return Array(groups.length).fill(false)
    }
  })

  // 保存展开状态
  useEffect(() => {
    try {
      localStorage.setItem(GROUP_EXPAND_STATE_KEY, JSON.stringify(isOpen))
    } catch (error) {
      console.error('Failed to save group expand state:', error)
    }
  }, [isOpen])
  return {
    virtuosoRef: virtuosoRef as React.RefObject<GroupedVirtuosoHandle>,
    isOpen,
    setIsOpen,
    onScroll: useCallback(() => {
      // 空实现，不再保存滚动位置
    }, [])
  }
}

const Proxies: React.FC = () => {
  const { t } = useTranslation()
  const { controledMihomoConfig } = useControledMihomoConfig()
  const { mode = 'rule' } = controledMihomoConfig || {}
  const { groups = [], mutate } = useGroups()
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    proxyDisplayMode = 'simple',
    proxyDisplayOrder = 'default',
    autoCloseConnection = true,
    proxyCols = 'auto',
    delayTestConcurrency = 50
  } = appConfig || {}
  
  const [cols, setCols] = useState(1)
  const { virtuosoRef, isOpen, setIsOpen, onScroll } = useProxyState(groups)
  const [delaying, setDelaying] = useState(Array(groups.length).fill(false))
  const [searchValue, setSearchValue] = useState(Array(groups.length).fill(''))
  const { groupCounts, allProxies } = useMemo(() => {
    const groupCounts: number[] = []
    const allProxies: (IMihomoProxy | IMihomoGroup)[][] = []
    if (groups.length !== searchValue.length) setSearchValue(Array(groups.length).fill(''))
    groups.forEach((group, index) => {
      if (isOpen[index]) {
        let groupProxies = group.all.filter(
          (proxy) => proxy && includesIgnoreCase(proxy.name, searchValue[index])
        )
        const count = Math.floor(groupProxies.length / cols)
        groupCounts.push(groupProxies.length % cols === 0 ? count : count + 1)
        if (proxyDisplayOrder === 'delay') {
          groupProxies = groupProxies.sort((a, b) => {
            if (a.history.length === 0) return -1
            if (b.history.length === 0) return 1
            if (a.history[a.history.length - 1].delay === 0) return 1
            if (b.history[b.history.length - 1].delay === 0) return -1
            return a.history[a.history.length - 1].delay - b.history[b.history.length - 1].delay
          })
        }
        if (proxyDisplayOrder === 'name') {
          groupProxies = groupProxies.sort((a, b) => a.name.localeCompare(b.name))
        }
        allProxies.push(groupProxies)
      } else {
        groupCounts.push(0)
        allProxies.push([])
      }
    })
    return { groupCounts, allProxies }
  }, [groups, isOpen, proxyDisplayOrder, cols, searchValue])

  const onChangeProxy = useCallback(async (group: string, proxy: string): Promise<void> => {
    await mihomoChangeProxy(group, proxy)
    if (autoCloseConnection) {
      await mihomoCloseAllConnections()
    }
    mutate()
  }, [autoCloseConnection, mutate])

  const onProxyDelay = useCallback(async (proxy: string, url?: string): Promise<IMihomoDelay> => {
    return await mihomoProxyDelay(proxy, url)
  }, [])

  const onGroupDelay = useCallback(async (index: number): Promise<void> => {
    if (allProxies[index].length === 0) {
      setIsOpen((prev) => {
        const newOpen = [...prev]
        newOpen[index] = true
        return newOpen
      })
    }
    setDelaying((prev) => {
      const newDelaying = [...prev]
      newDelaying[index] = true
      return newDelaying
    })

    try {
      // 限制并发数量
      const result: Promise<void>[] = []
      const runningList: Promise<void>[] = []
      for (const proxy of allProxies[index]) {
        const promise = Promise.resolve().then(async () => {
          try {
            await mihomoProxyDelay(proxy.name, groups[index].testUrl)
          } catch {
            // ignore
          } finally {
            mutate()
          }
        })
        result.push(promise)
        const running = promise.then(() => {
          runningList.splice(runningList.indexOf(running), 1)
        })
        runningList.push(running)
        if (runningList.length >= (delayTestConcurrency || 50)) {
          await Promise.race(runningList)
        }
      }
      await Promise.all(result)
    } finally {
      setDelaying((prev) => {
        const newDelaying = [...prev]
        newDelaying[index] = false
        return newDelaying
      })
    }
  }, [allProxies, groups, delayTestConcurrency, mutate])

  const calcCols = useCallback((): number => {
    if (proxyCols !== 'auto') {
      // biome-ignore lint/style/useNumberNamespace: <explanation>
      return parseInt(proxyCols)
    }
    if (window.matchMedia('(min-width: 1536px)').matches) return 5
    if (window.matchMedia('(min-width: 1280px)').matches) return 4
    if (window.matchMedia('(min-width: 1024px)').matches) return 3
    return 2
  }, [proxyCols])

  useEffect(() => {
    const handleResize = (): void => {
      setCols(calcCols())
    }

    handleResize() // 初始化
    window.addEventListener('resize', handleResize)
    
    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [calcCols])

  return (
    <BasePage
      title={t('proxies.title')}
      header={
        <>
          <Button
            size="sm"
            isIconOnly
            variant="light"
            className="app-nodrag"
            onPress={() => {
              patchAppConfig({
                proxyDisplayOrder:
                  proxyDisplayOrder === 'default'
                    ? 'delay'
                    : proxyDisplayOrder === 'delay'
                      ? 'name'
                      : 'default'
              })
            }}
          >
            {proxyDisplayOrder === 'default' ? (
              <TbCircleLetterD className="text-lg" title={t('proxies.order.default')} />
            ) : proxyDisplayOrder === 'delay' ? (
              <MdOutlineSpeed className="text-lg" title={t('proxies.order.delay')} />
            ) : (
              <RxLetterCaseCapitalize className="text-lg" title={t('proxies.order.name')} />
            )}
          </Button>
          <Button
            size="sm"
            isIconOnly
            variant="light"
            className="app-nodrag"
            onPress={() => {
              patchAppConfig({
                proxyDisplayMode: proxyDisplayMode === 'simple' ? 'full' : 'simple'
              })
            }}
          >
            {proxyDisplayMode === 'full' ? (
              <CgDetailsMore className="text-lg" title={t('proxies.mode.full')} />
            ) : (
              <CgDetailsLess className="text-lg" title={t('proxies.mode.simple')} />
            )}
          </Button>
        </>
      }
    >
      {/* 添加VPN状态卡片 */}
      <VpnStatusCard />
      
      {mode === 'direct' ? (
        <div className="h-full w-full flex justify-center items-center">
          <div className="flex flex-col items-center">
            <MdDoubleArrow className="text-foreground-500 text-[100px]" />
            <h2 className="text-foreground-500 text-[20px]">{t('proxies.mode.direct')}</h2>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-50px)]">
          <GroupedVirtuoso
            ref={virtuosoRef}
            groupCounts={groupCounts}
            onScroll={onScroll}
            defaultItemHeight={80}
            increaseViewportBy={{ top: 300, bottom: 300 }}
            overscan={500}
            computeItemKey={(index, groupIndex) => {
              let innerIndex = index
              groupCounts.slice(0, groupIndex).forEach((count) => {
                innerIndex -= count
              })
              const proxyIndex = innerIndex * cols
              const proxy = allProxies[groupIndex]?.[proxyIndex]
              return proxy ? `${groupIndex}-${proxy.name}` : `${groupIndex}-${index}`
            }}
            groupContent={(index) => {
              if (
                // biome-ignore lint/complexity/useOptionalChain: <explanation>
                groups[index] &&
                groups[index].icon &&
                groups[index].icon.startsWith('http') &&
                !localStorage.getItem(groups[index].icon)
              ) {
                getImageDataURL(groups[index].icon).then((dataURL) => {
                  localStorage.setItem(groups[index].icon, dataURL)
                  mutate()
                })
              }
              return groups[index] ? (
                <div
                  className={`w-full pt-2 ${index === groupCounts.length - 1 && !isOpen[index] ? 'pb-2' : ''} px-2`}
                >
                  <Card
                    as="div"
                    isPressable
                    fullWidth
                    onPress={() => {
                      setIsOpen((prev) => {
                        const newOpen = [...prev]
                        newOpen[index] = !prev[index]
                        return newOpen
                      })
                    }}
                  >
                    <CardBody className="w-full">
                      <div className="flex justify-between">
                        <div className="flex text-ellipsis overflow-hidden whitespace-nowrap">
                          {groups[index].icon ? (
                            <Avatar
                              className="bg-transparent mr-2"
                              size="sm"
                              radius="sm"
                              src={
                                groups[index].icon.startsWith('<svg')
                                  ? `data:image/svg+xml;utf8,${groups[index].icon}`
                                  : localStorage.getItem(groups[index].icon) || groups[index].icon
                              }
                            />
                          ) : null}
                          <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                            <div
                              title={groups[index].name}
                              className="inline flag-emoji h-[32px] text-md leading-[32px]"
                            >
                              {groups[index].name}
                            </div>
                            {proxyDisplayMode === 'full' && (
                              <div
                                title={groups[index].type}
                                className="inline ml-2 text-sm text-foreground-500"
                              >
                                {groups[index].type}
                              </div>
                            )}
                            {proxyDisplayMode === 'full' && (
                              <div className="inline flag-emoji ml-2 text-sm text-foreground-500">
                                {groups[index].now}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex">
                          {proxyDisplayMode === 'full' && (
                            <Chip size="sm" className="my-1 mr-2">
                              {groups[index].all.length}
                            </Chip>
                          )}
                          <CollapseInput
                              title={t('proxies.search.placeholder')}
                            value={searchValue[index]}
                            onValueChange={(v) => {
                              setSearchValue((prev) => {
                                const newSearchValue = [...prev]
                                newSearchValue[index] = v
                                return newSearchValue
                              })
                            }}
                          />
                          <Button
                              title={t('proxies.locate')}
                            variant="light"
                            size="sm"
                            isIconOnly
                            onPress={() => {
                              if (!isOpen[index]) {
                                setIsOpen((prev) => {
                                  const newOpen = [...prev]
                                  newOpen[index] = true
                                  return newOpen
                                })
                              }
                              let i = 0
                              for (let j = 0; j < index; j++) {
                                i += groupCounts[j]
                              }
                              i += Math.floor(
                                allProxies[index].findIndex(
                                  (proxy) => proxy.name === groups[index].now
                                ) / cols
                              )
                              virtuosoRef.current?.scrollToIndex({
                                index: Math.floor(i),
                                align: 'start'
                              })
                            }}
                          >
                            <FaLocationCrosshairs className="text-lg text-foreground-500" />
                          </Button>
                          <Button
                              title={t('proxies.delay.test')}
                            variant="light"
                            isLoading={delaying[index]}
                            size="sm"
                            isIconOnly
                            onPress={() => {
                              onGroupDelay(index)
                            }}
                          >
                            <MdOutlineSpeed className="text-lg text-foreground-500" />
                          </Button>
                          <IoIosArrowBack
                            className={`transition duration-200 ml-2 h-[32px] text-lg text-foreground-500 ${isOpen[index] ? '-rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ) : (
                <div>Never See This</div>
              )
            }}
            itemContent={(index, groupIndex) => {
              let innerIndex = index
              // biome-ignore lint/complexity/noForEach: <explanation>
              groupCounts.slice(0, groupIndex).forEach((count) => {
                innerIndex -= count
              })
              return allProxies[groupIndex] ? (
                <div
                  style={
                    proxyCols !== 'auto'
                      ? { gridTemplateColumns: `repeat(${proxyCols}, minmax(0, 1fr))` }
                      : {}
                  }
                  className={`grid ${proxyCols === 'auto' ? 'sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : ''} ${groupIndex === groupCounts.length - 1 && innerIndex === groupCounts[groupIndex] - 1 ? 'pb-2' : ''} gap-2 pt-2 mx-2`}
                >
                  {Array.from({ length: cols }).map((_, i) => {
                    if (!allProxies[groupIndex][innerIndex * cols + i]) return null
                    return (
                      <ProxyItem
                        key={allProxies[groupIndex][innerIndex * cols + i].name}
                        mutateProxies={mutate}
                        onProxyDelay={onProxyDelay}
                        onSelect={onChangeProxy}
                        proxy={allProxies[groupIndex][innerIndex * cols + i]}
                        group={groups[groupIndex]}
                        proxyDisplayMode={proxyDisplayMode}
                        selected={
                          allProxies[groupIndex][innerIndex * cols + i]?.name ===
                          groups[groupIndex].now
                        }
                      />
                    )
                  })}
                </div>
              ) : (
                <div>Never See This</div>
              )
            }}
          />
        </div>
      )}
    </BasePage>
  )
}

export default Proxies