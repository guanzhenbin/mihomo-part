import { Button, Input, Tab, Tabs, Avatar, Card, CardBody, Chip, Divider } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import VpnSwitch from '@renderer/components/base/vpn-switch'
import PacEditorModal from '@renderer/components/sysproxy/pac-editor-modal'
import ProxyItem from '@renderer/components/proxies/proxy-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useGroups } from '@renderer/hooks/use-groups'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { platform } from '@renderer/utils/init'
import { 
  openUWPTool, 
  triggerSysProxy, 
  mihomoChangeProxy, 
  mihomoCloseAllConnections,
  mihomoProxyDelay,
  getImageDataURL
} from '@renderer/utils/ipc'
import { includesIgnoreCase } from '@renderer/utils/includes'
import { Key, useState, useEffect, useMemo, useCallback } from 'react'
import React from 'react'
import { MdDeleteForever, MdVpnKey, MdOutlineSpeed, MdSearch } from 'react-icons/md'
import { FaShieldAlt } from 'react-icons/fa'
import { TbCircleLetterD } from 'react-icons/tb'
import { RxLetterCaseCapitalize } from 'react-icons/rx'
import { CgDetailsLess, CgDetailsMore } from 'react-icons/cg'
import { useTranslation } from 'react-i18next'
import '@renderer/components/base/vpn-switch.css'

const defaultPacScript = `
function FindProxyForURL(url, host) {
  return "PROXY 127.0.0.1:%mixed-port%; SOCKS5 127.0.0.1:%mixed-port%; DIRECT;";
}
`

const Sysproxy: React.FC = () => {
  const defaultBypass: string[] =
    platform === 'linux'
      ? ['localhost', '127.0.0.1', '192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', '::1']
      : platform === 'darwin'
        ? [
            '127.0.0.1',
            '192.168.0.0/16',
            '10.0.0.0/8',
            '172.16.0.0/12',
            'localhost',
            '*.local',
            '*.crashlytics.com',
            '<local>'
          ]
        : [
            'localhost',
            '127.*',
            '192.168.*',
            '10.*',
            '172.16.*',
            '172.17.*',
            '172.18.*',
            '172.19.*',
            '172.20.*',
            '172.21.*',
            '172.22.*',
            '172.23.*',
            '172.24.*',
            '172.25.*',
            '172.26.*',
            '172.27.*',
            '172.28.*',
            '172.29.*',
            '172.30.*',
            '172.31.*',
            '<local>'
          ]

  const { t } = useTranslation()
  const { appConfig, patchAppConfig } = useAppConfig()
  const { sysProxy } = appConfig || ({ sysProxy: { enable: false } } as IAppConfig)
  const [changed, setChanged] = useState(false)
  const [values, originSetValues] = useState({
    enable: sysProxy.enable,
    host: sysProxy.host ?? '',
    bypass: sysProxy.bypass ?? defaultBypass,
    mode: sysProxy.mode ?? 'manual',
    pacScript: sysProxy.pacScript ?? defaultPacScript
  })

  // Proxy group functionality
  const { controledMihomoConfig } = useControledMihomoConfig()
  const { mode: proxyMode = 'rule' } = controledMihomoConfig || {}
  const { groups: allGroups = [], mutate } = useGroups()
  const groups = allGroups.filter(group => group.type === 'Selector' && group.name !== 'GLOBAL')
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

  const setValues = (v: typeof values): void => {
    originSetValues(v)
    setChanged(true)
  }

  const [openPacEditor, setOpenPacEditor] = useState(false)

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

  const handleBypassChange = (value: string, index: number): void => {
    const newBypass = [...values.bypass]
    if (index === newBypass.length) {
      if (value.trim() !== '') {
        newBypass.push(value)
      }
    } else {
      if (value.trim() === '') {
        newBypass.splice(index, 1)
      } else {
        newBypass[index] = value
      }
    }
    setValues({ ...values, bypass: newBypass })
  }

  const onSave = async (): Promise<void> => {
    setChanged(false)

    // 保存当前的开关状态，以便在失败时恢复
    const previousState = values.enable

    try {
      await patchAppConfig({ sysProxy: values })
      await triggerSysProxy(true)

      await patchAppConfig({ sysProxy: { enable: true } })
    } catch (e) {
      setValues({ ...values, enable: previousState })
      setChanged(true)
      alert(e)

      await patchAppConfig({ sysProxy: { enable: false } })
    }
  }

  const onToggle = async (enable: boolean): Promise<void> => {
    const previousState = !enable
    
    try {
      // 立即更新本地状态
      setValues({ ...values, enable })
      
      // 更新配置并触发系统代理
      await patchAppConfig({ sysProxy: { ...values, enable } })
      await triggerSysProxy(enable)
      
      // 通知其他组件更新
      window.electron.ipcRenderer.send('updateFloatingWindow')
      window.electron.ipcRenderer.send('updateTrayMenu')
    } catch (e) {
      // 失败时恢复状态
      setValues({ ...values, enable: previousState })
      await patchAppConfig({ sysProxy: { enable: previousState } })
      alert(e)
    }
  }

  return (
    <BasePage
      title={t('sysproxy.title')}
      header={
        changed && (
          <Button color="primary" className="app-nodrag" size="sm" onPress={onSave}>
            {t('common.save')}
          </Button>
        )
      }
    >
      {openPacEditor && (
        <PacEditorModal
          script={values.pacScript || defaultPacScript}
          onCancel={() => setOpenPacEditor(false)}
          onConfirm={(script: string) => {
            setValues({ ...values, pacScript: script })
            setOpenPacEditor(false)
          }}
        />
      )}
      {/* VPN 状态展示区 */}
      <SettingCard>
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className={`absolute inset-0 transition-all duration-700 ${
            values.enable 
              ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30' 
              : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30'
          }`} />
          
          {/* Animated background particles */}
          {values.enable && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-8 w-2 h-2 bg-emerald-300/40 rounded-full animate-float-slow" />
              <div className="absolute top-12 right-12 w-1 h-1 bg-green-400/50 rounded-full animate-float-medium" />
              <div className="absolute bottom-8 left-16 w-1.5 h-1.5 bg-teal-300/30 rounded-full animate-float-fast" />
            </div>
          )}
          
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Status Icon */}
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    values.enable 
                      ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-xl shadow-green-500/30' 
                      : 'bg-gradient-to-br from-gray-300 to-slate-400 dark:from-gray-600 dark:to-slate-700 shadow-lg shadow-gray-400/20'
                  }`}>
                    {/* Icon glow effect */}
                    {values.enable && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/50 to-teal-400/50 blur-xl animate-pulse" />
                    )}
                    <div className="relative">
                      {values.enable ? (
                        <FaShieldAlt className="text-white text-2xl drop-shadow-lg" />
                      ) : (
                        <MdVpnKey className="text-gray-500 dark:text-gray-400 text-2xl" />
                      )}
                    </div>
                  </div>
                  
                  {/* Status indicator dot */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-gray-800 transition-all duration-300 ${
                    values.enable 
                      ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse' 
                      : 'bg-gray-400 dark:bg-gray-600'
                  }`} />
                </div>
                
                {/* Status Text */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">
                    {t('sysproxy.enable.title')}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      values.enable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    <p className={`text-sm font-medium transition-all duration-300 ${
                      values.enable 
                        ? 'text-emerald-700 dark:text-emerald-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {values.enable ? t('sysproxy.status.connected') : t('sysproxy.status.disconnected')}
                    </p>
                  </div>
                  
                  {/* Connection info */}
                  {values.enable && (
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                        {values.host || '127.0.0.1'}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                        {values.mode === 'auto' ? 'PAC' : 'Manual'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* VPN Switch */}
              <div className="flex flex-col items-center space-y-3">
                <VpnSwitch
                  isSelected={values.enable}
                  onValueChange={onToggle}
                  size="lg"
                />
                <span className={`text-xs font-semibold transition-colors duration-300 ${
                  values.enable 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {values.enable ? 'SECURE' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>
      

      <SettingCard className="sysproxy-settings">
        <SettingItem title={t('sysproxy.host.title')} divider>
          <Input
            size="sm"
            className="w-[50%]"
            value={values.host}
            placeholder={t('sysproxy.host.placeholder')}
            onValueChange={(v) => {
              setValues({ ...values, host: v })
            }}
          />
        </SettingItem>
        <SettingItem title={t('sysproxy.mode.title')} divider>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={values.mode}
            onSelectionChange={(key: Key) => setValues({ ...values, mode: key as SysProxyMode })}
          >
            <Tab key="manual" title={t('sysproxy.mode.manual')} />
            <Tab key="auto" title={t('sysproxy.mode.pac')} />
          </Tabs>
        </SettingItem>
        {platform === 'win32' && (
          <SettingItem title={t('sysproxy.uwp.title')} divider>
            <Button
              size="sm"
              onPress={async () => {
                await openUWPTool()
              }}
            >
              {t('sysproxy.uwp.open')}
            </Button>
          </SettingItem>
        )}

        {values.mode === 'auto' && (
          <SettingItem title={t('sysproxy.mode.title')}>
            <Button size="sm" onPress={() => setOpenPacEditor(true)} variant="bordered">
              {t('sysproxy.pac.edit')}
            </Button>
          </SettingItem>
        )}
        {values.mode === 'manual' && (
          <>
            <SettingItem title={t('sysproxy.bypass.addDefault')} divider>
              <Button
                size="sm"
                onPress={() => {
                  setValues({ ...values, bypass: defaultBypass.concat(values.bypass) })
                }}
              >
                {t('sysproxy.bypass.addDefault')}
              </Button>
            </SettingItem>
            <div className="flex flex-col items-stretch">
              <h3 className="mb-2">{t('sysproxy.bypass.title')}</h3>
              {[...values.bypass, ''].map((domain, index) => (
                <div key={index} className="mb-2 flex">
                  <Input
                    fullWidth
                    size="sm"
                    placeholder={t('sysproxy.bypass.placeholder')}
                    value={domain}
                    onValueChange={(v) => handleBypassChange(v, index)}
                  />
                  {index < values.bypass.length && (
                    <Button
                      className="ml-2"
                      size="sm"
                      variant="flat"
                      color="warning"
                      onPress={() => handleBypassChange('', index)}
                    >
                      <MdDeleteForever className="text-lg" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </SettingCard>

      {/* Proxy Group Section */}
      {group && (
        <SettingCard>
          <div className="w-full flex flex-col">
            {/* 代理组信息卡片 */}
            <div className="mb-4">
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
            <div className="mb-3">
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

            <Divider className="mb-3" />

            {/* 代理列表 */}
            <div className="overflow-y-auto max-h-[400px]">
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
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MdSearch className="text-6xl text-foreground-300 mb-4" />
                  <h3 className="text-lg font-medium text-foreground-500 mb-2">No proxies found</h3>
                  <p className="text-sm text-foreground-400">
                    Try adjusting your search terms or check your proxy configuration
                  </p>
                </div>
              )}
            </div>
          </div>
        </SettingCard>
      )}
    </BasePage>
  )
}

export default Sysproxy
