import { Avatar, Button, Card, CardBody, Input, Chip, Divider } from '@heroui/react'
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
import { MdOutlineSpeed, MdSearch } from 'react-icons/md'
import { RxLetterCaseCapitalize } from 'react-icons/rx'
import { useEffect, useMemo, useState, useCallback } from 'react'
import ProxyItem from '@renderer/components/proxies/proxy-item'
import { MdDoubleArrow } from 'react-icons/md'
import { useGroups } from '@renderer/hooks/use-groups'
import { includesIgnoreCase } from '@renderer/utils/includes'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { useTranslation } from 'react-i18next'




const Proxies: React.FC = () => {
  const { t } = useTranslation()
  const { controledMihomoConfig } = useControledMihomoConfig()
  const { mode = 'rule' } = controledMihomoConfig || {}
  const { groups: allGroups = [], mutate } = useGroups()
  const groups = allGroups.filter(group => group.type === 'Selector' && group.name !== 'GLOBAL')
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    proxyDisplayMode = 'simple',
    proxyDisplayOrder = 'default',
    autoCloseConnection = true,
    proxyCols = 'auto',
    delayTestConcurrency = 50
  } = appConfig || {}
  
  // const [cols, setCols] = useState(1)
  const [delaying, setDelaying] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  
  // 获取第一个代理组（因为现在只显示一个）
  const group = groups[0]
  
  const filteredProxies = useMemo(() => {
    if (!group || !group.all) return []
    
    let proxies = group.all.filter(
      (proxy) => proxy && includesIgnoreCase(proxy.name, searchValue)
    )
    
    if (proxyDisplayOrder === 'delay') {
      proxies = proxies.sort((a, b) => {
        if (a.history.length === 0) return -1
        if (b.history.length === 0) return 1
        if (a.history[a.history.length - 1].delay === 0) return 1
        if (b.history[b.history.length - 1].delay === 0) return -1
        return a.history[a.history.length - 1].delay - b.history[b.history.length - 1].delay
      })
    }
    
    if (proxyDisplayOrder === 'name') {
      proxies = proxies.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return proxies
  }, [group, searchValue, proxyDisplayOrder])

  const onChangeProxy = useCallback(async (groupName: string, proxy: string): Promise<void> => {
    await mihomoChangeProxy(groupName, proxy)
    if (autoCloseConnection) {
      await mihomoCloseAllConnections()
    }
    mutate()
  }, [autoCloseConnection, mutate])

  const onProxyDelay = useCallback(async (proxy: string, url?: string): Promise<IMihomoDelay> => {
    return await mihomoProxyDelay(proxy, url)
  }, [])

  const onGroupDelay = useCallback(async (): Promise<void> => {
    if (!group || !filteredProxies.length) return
    
    setDelaying(true)
    try {
      // 限制并发数量
      const result: Promise<void>[] = []
      const runningList: Promise<void>[] = []
      for (const proxy of filteredProxies) {
        const promise = Promise.resolve().then(async () => {
          try {
            await mihomoProxyDelay(proxy.name, group.testUrl)
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
      setDelaying(false)
    }
  }, [group, filteredProxies, delayTestConcurrency, mutate])

  // const calcCols = useCallback((): number => {
  //   if (proxyCols !== 'auto') {
  //     // biome-ignore lint/style/useNumberNamespace: <explanation>
  //     return parseInt(proxyCols)
  //   }
  //   if (window.matchMedia('(min-width: 1536px)').matches) return 5
  //   if (window.matchMedia('(min-width: 1280px)').matches) return 4
  //   if (window.matchMedia('(min-width: 1024px)').matches) return 3
  //   return 2
  // }, [proxyCols])

  // useEffect(() => {
  //   const handleResize = (): void => {
  //     setCols(calcCols())
  //   }

  //   handleResize() // 初始化
  //   window.addEventListener('resize', handleResize)
    
  //   return (): void => {
  //     window.removeEventListener('resize', handleResize)
  //   }
  // }, [calcCols])

  // 处理图标加载
  useEffect(() => {
    if (
      group?.icon &&
      group.icon.startsWith('http') &&
      !localStorage.getItem(group.icon)
    ) {
      getImageDataURL(group.icon).then((dataURL) => {
        localStorage.setItem(group.icon, dataURL)
        mutate()
      })
    }
  }, [group, mutate])

  return (
    <BasePage
      title={group?.name || t('proxies.title')}
      header={
        <>
          <Button
            size="sm"
            isIconOnly
            aria-label="排序代理"
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
            aria-label="切换显示模式"
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
      {mode === 'direct' ? (
        <div className="h-full w-full flex justify-center items-center">
          <div className="flex flex-col items-center">
            <MdDoubleArrow className="text-foreground-500 text-[100px]" />
            <h2 className="text-foreground-500 text-[20px]">{t('proxies.mode.direct')}</h2>
          </div>
        </div>
      ) : !group ? (
        <div className="h-full w-full flex justify-center items-center">
          <div className="flex flex-col items-center">
            <MdDoubleArrow className="text-foreground-500 text-[100px]" />
            <h2 className="text-foreground-500 text-[20px]">No Selector Group Found</h2>
          </div>
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-50px)] flex flex-col">
          {/* 代理组信息卡片 */}
          <div className="flex-shrink-0 p-6">
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border-none shadow-xl backdrop-blur-sm">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {group.icon && (
                      <Avatar
                        className="bg-transparent border-3 border-white/30 shadow-2xl flex-shrink-0 ring-2 ring-white/20"
                        size="lg"
                        radius="lg"
                        src={
                          group.icon.startsWith('<svg')
                            ? `data:image/svg+xml;utf8,${group.icon}`
                            : localStorage.getItem(group.icon) || group.icon
                        }
                      />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 truncate">{group.name}</h2>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <Chip size="md" variant="shadow" color="success" className="text-sm font-medium">
                          {group.type}
                        </Chip>
                        <Chip size="md" variant="shadow" color="primary" className="text-sm font-medium">
                          {filteredProxies.length} 个节点
                        </Chip>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-foreground-700 dark:text-foreground-300">
                        <span className="font-medium">当前节点:</span>
                        <Chip size="md" variant="bordered" color="secondary" className="text-sm font-semibold border-2">
                          {group.now}
                        </Chip>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Button
                      size="lg"
                      variant="shadow"
                      color="primary"
                      isLoading={delaying}
                      onPress={onGroupDelay}
                      startContent={!delaying && <MdOutlineSpeed className="text-xl" />}
                      className="font-semibold px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                    >
                      {delaying ? '测试中...' : '全部测速'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 搜索栏和工具栏 */}
          <div className="flex-shrink-0 px-6 pb-4">
            <div className="flex gap-4 items-center">
              <Input
                placeholder={t('proxies.search.placeholder')}
                value={searchValue}
                onValueChange={setSearchValue}
                startContent={<MdSearch className="text-foreground-400 text-lg" />}
                variant="bordered"
                size="lg"
                className="flex-1"
                classNames={{
                  inputWrapper: "border-2 hover:border-primary-400 focus-within:border-primary-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                }}
              />
              <div className="flex items-center gap-2 text-sm text-foreground-600 dark:text-foreground-400 flex-shrink-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="font-medium">显示</span>
                <Chip size="sm" variant="shadow" color="primary" className="font-bold">
                  {filteredProxies.length}
                </Chip>
                <span>/</span>
                <Chip size="sm" variant="shadow" color="default" className="font-bold">
                  {group.all.length}
                </Chip>
              </div>
            </div>
          </div>

          <Divider className="mx-6 flex-shrink-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent h-px" />

          {/* 代理列表 */}
          <div className="flex-1 px-6 pt-4 pb-6 w-full overflow-hidden">
            <div
              className={`grid gap-4 w-full max-w-full ${
                proxyCols === 'auto' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                  : ''
              }`}
              style={
                proxyCols !== 'auto'
                  ? { 
                      gridTemplateColumns: `repeat(${proxyCols}, minmax(0, 1fr))`,
                      width: '100%',
                      overflow: 'hidden'
                    }
                  : {
                      width: '100%',
                      overflow: 'hidden'
                    }
              }
            >
              {filteredProxies.map((proxy) => (
                <div key={proxy.name} className="w-full">
                  <ProxyItem
                    mutateProxies={mutate}
                    onProxyDelay={onProxyDelay}
                    onSelect={onChangeProxy}
                    proxy={proxy}
                    group={group}
                    proxyDisplayMode={proxyDisplayMode}
                    selected={proxy.name === group.now}
                  />
                </div>
              ))}
            </div>
            
            {filteredProxies.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <MdSearch className="text-8xl text-foreground-300 mb-6 animate-pulse" />
                <h3 className="text-xl font-bold text-foreground-600 dark:text-foreground-400 mb-3">未找到匹配的节点</h3>
                <p className="text-sm text-foreground-500 max-w-md">
                  请尝试调整搜索条件或检查代理配置
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </BasePage>
  )
}

export default Proxies