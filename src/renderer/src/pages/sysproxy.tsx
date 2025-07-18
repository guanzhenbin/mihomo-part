import { Button, Input, Avatar, Card, CardBody, Chip, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import VpnSwitch from '@renderer/components/base/vpn-switch'
import PacEditorModal from '@renderer/components/sysproxy/pac-editor-modal'
import ProxyItem from '@renderer/components/proxies/proxy-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useGroups } from '@renderer/hooks/use-groups'
import { platform } from '@renderer/utils/init'
import { 
  triggerSysProxy, 
  mihomoChangeProxy, 
  mihomoCloseAllConnections,
  mihomoProxyDelay,
  getImageDataURL
} from '@renderer/utils/ipc'
import { includesIgnoreCase } from '@renderer/utils/includes'
import { useState, useEffect, useMemo, useCallback } from 'react'
import React from 'react'
import { MdVpnKey, MdOutlineSpeed, MdSearch } from 'react-icons/md'
import { FaShieldAlt } from 'react-icons/fa'
import { TbCircleLetterD } from 'react-icons/tb'
import { RxLetterCaseCapitalize } from 'react-icons/rx'
import { CgDetailsLess, CgDetailsMore } from 'react-icons/cg'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { appConfig, patchAppConfig } = useAppConfig()
  const { sysProxy } = appConfig || ({ sysProxy: { enable: false } } as IAppConfig)
  const [values, originSetValues] = useState({
    enable: sysProxy.enable,
    host: sysProxy.host ?? '',
    bypass: sysProxy.bypass ?? defaultBypass,
    mode: sysProxy.mode ?? 'manual',
    pacScript: sysProxy.pacScript ?? defaultPacScript
  })
  
  // 会员过期检查相关状态
  const [showExpirationModal, setShowExpirationModal] = useState(false)

  // Proxy group functionality
  const { groups: allGroups = [], mutate } = useGroups()
  const groups = allGroups.filter(group => group.type === 'Selector' && group.name !== 'GLOBAL')
  const {
    proxyDisplayMode = 'simple',
    proxyDisplayOrder = 'default',
    autoCloseConnection = true,
    proxyCols = 'auto',
    delayTestConcurrency = 50
  } = appConfig || {}
  
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

  // 会员过期检查函数
  const checkMembershipExpiration = (): boolean => {
    try {
      const savedProfile = sessionStorage.getItem('mihomo-party-user')
      if (!savedProfile) return false
      
      const profile = JSON.parse(savedProfile)
      if (!profile?.data?.expired_at) return false
      
      const currentTime = Date.now() / 1000
      const isExpired = profile.data.expired_at <= currentTime
      
      // 添加调试信息
      console.log('🔍 连接时会员过期检查:')
      console.log('当前时间:', currentTime, new Date(currentTime * 1000).toLocaleString())
      console.log('过期时间:', profile.data.expired_at, new Date(profile.data.expired_at * 1000).toLocaleString())
      console.log('是否过期:', isExpired)
      
      return isExpired
    } catch (error) {
      console.error('检查会员状态失败:', error)
      return false
    }
  }

  // 处理购买跳转
  const handlePurchase = (): void => {
    setShowExpirationModal(false)
    navigate('/package-purchase')
  }

  const onToggle = async (enable: boolean): Promise<void> => {
    // 如果要开启连接，先检查会员是否过期
    if (enable && checkMembershipExpiration()) {
      console.log('✋ 会员已过期，阻止连接并显示弹窗')
      setShowExpirationModal(true)
      return
    }

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
      // header={
      //   changed && (
      //     <Button color="primary" className="app-nodrag" size="sm" onPress={onSave}>
      //       {t('common.save')}
      //     </Button>
      //   )
      // }
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
      
      {/* 会员过期提示弹窗 */}
      <Modal 
        isOpen={showExpirationModal} 
        onOpenChange={setShowExpirationModal}
        backdrop="blur"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t('common.membership.expired')}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('common.membership.needPurchase')}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ {t('common.membership.expiredMessage')}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  color="primary" 
                  onPress={handlePurchase}
                  startContent={<Crown className="w-4 h-4" />}
                >
                  {t('common.membership.goPurchase')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* VPN 状态展示区 - 粘性定位 */}
      <div className="sticky top-0 z-30 mx-2 mb-4">
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
              <div className={`flex flex-col items-center space-y-3 ${!values.enable ? 'animate-bounce-gentle' : ''}`}>
                <div className={`relative ${!values.enable ? 'animate-pulse' : ''}`}>
                  {/* 未连接时的环形指示器 */}
                  {!values.enable && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-orange-400/30 animate-ping" />
                      <div className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-pulse" />
                    </>
                  )}
                  <VpnSwitch
                    isSelected={values.enable}
                    onValueChange={onToggle}
                    size="lg"
                  />
                </div>
                <span className={`text-xs font-semibold transition-all duration-300 ${
                  values.enable 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-orange-600 dark:text-orange-400 animate-pulse font-bold'
                }`}>
                  {values.enable ? '安全' : '点击连接'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>
      </div>
      

      {/* <SettingCard className="sysproxy-settings">
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
            aria-label="系统代理模式"
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
      </SettingCard> */}

            {/* Proxy Group Section */}
      {group && (
        <SettingCard>
          <div className="w-full flex flex-col">
            {/* 代理组信息卡片 */}
            <div className="mb-6">
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
                        size="sm"
                        isIconOnly
                        variant="light"
                        className="app-nodrag hover:bg-blue-100 dark:hover:bg-blue-900/30"
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
                          <TbCircleLetterD className="text-lg text-blue-600 dark:text-blue-400" title={t('proxies.order.default')} />
                        ) : proxyDisplayOrder === 'delay' ? (
                          <MdOutlineSpeed className="text-lg text-blue-600 dark:text-blue-400" title={t('proxies.order.delay')} />
                        ) : (
                          <RxLetterCaseCapitalize className="text-lg text-blue-600 dark:text-blue-400" title={t('proxies.order.name')} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="light"
                        className="app-nodrag hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onPress={() => {
                          patchAppConfig({
                            proxyDisplayMode: proxyDisplayMode === 'simple' ? 'full' : 'simple'
                          })
                        }}
                      >
                        {proxyDisplayMode === 'full' ? (
                          <CgDetailsMore className="text-lg text-blue-600 dark:text-blue-400" title={t('proxies.mode.full')} />
                        ) : (
                          <CgDetailsLess className="text-lg text-blue-600 dark:text-blue-400" title={t('proxies.mode.simple')} />
                        )}
                      </Button>
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
            <div className="mb-4">
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
              <Divider className="mb-4 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent h-px" />

              {/* 代理列表 - 移除固定高度限制 */}
              <div className="pb-4 w-full overflow-hidden">
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
          </SettingCard>
        )}
      </BasePage>
    )
  }

export default Sysproxy
