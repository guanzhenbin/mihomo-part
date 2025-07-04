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
  
  const [cols, setCols] = useState(1)
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
        <div className="w-full h-[calc(100vh-50px)] flex flex-col overflow-hidden">
          {/* 代理组信息卡片 */}
          <div className="flex-shrink-0 p-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {group.icon && (
                      <Avatar
                        className="bg-transparent border-2 border-white/20 shadow-lg flex-shrink-0"
                        size="md"
                        radius="lg"
                        src={
                          group.icon.startsWith('<svg')
                            ? `data:image/svg+xml;utf8,${group.icon}`
                            : localStorage.getItem(group.icon) || group.icon
                        }
                      />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-foreground-900 mb-1 truncate">{group.name}</h2>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Chip size="sm" variant="flat" color="success" className="text-xs">
                          {group.type}
                        </Chip>
                        <Chip size="sm" variant="flat" color="primary" className="text-xs">
                          {filteredProxies.length} proxies
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground-600">
                        <span>Current:</span>
                        <Chip size="sm" variant="bordered" color="secondary" className="text-xs font-medium">
                          {group.now}
                        </Chip>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      isLoading={delaying}
                      onPress={onGroupDelay}
                      startContent={!delaying && <MdOutlineSpeed className="text-lg" />}
                      className="font-medium"
                    >
                      {delaying ? 'Testing...' : 'Speed Test'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 搜索栏和工具栏 */}
          <div className="flex-shrink-0 px-4 pb-3">
            <div className="flex gap-3 items-center">
              <Input
                placeholder={t('proxies.search.placeholder')}
                value={searchValue}
                onValueChange={setSearchValue}
                startContent={<MdSearch className="text-foreground-400" />}
                variant="bordered"
                size="md"
                className="flex-1"
                classNames={{
                  inputWrapper: "border hover:border-primary-300 focus-within:border-primary-500"
                }}
              />
              <div className="flex items-center gap-1 text-sm text-foreground-500 flex-shrink-0">
                <span>Showing</span>
                <Chip size="sm" variant="flat" color="default">
                  {filteredProxies.length}
                </Chip>
                <span>of</span>
                <Chip size="sm" variant="flat" color="default">
                  {group.all.length}
                </Chip>
              </div>
            </div>
          </div>

          <Divider className="mx-4 flex-shrink-0" />

          {/* 代理列表 */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <div
              className={`grid gap-3 w-full ${
                proxyCols === 'auto' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                  : ''
              }`}
              style={
                proxyCols !== 'auto'
                  ? { gridTemplateColumns: `repeat(${proxyCols}, minmax(0, 1fr))` }
                  : {}
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
                <MdSearch className="text-6xl text-foreground-300 mb-4" />
                <h3 className="text-lg font-medium text-foreground-500 mb-2">No proxies found</h3>
                <p className="text-sm text-foreground-400">
                  Try adjusting your search terms or check your proxy configuration
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