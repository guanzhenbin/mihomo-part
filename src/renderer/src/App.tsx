import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import { ProtectedRoute } from '@renderer/components/base/protected-route'
import StagewiseToolbarWrapper from '@renderer/components/base/stagewise-toolbar'
import OutboundModeSwitcher from '@renderer/components/sider/outbound-mode-switcher'

import { Button, Divider } from '@heroui/react'
import { IoSettings } from 'react-icons/io5'
import routes from '@renderer/routes'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import AcceleratorCard from '@renderer/components/sider/accelerator-card'
import RegionCard from '@renderer/components/sider/region-card'
import PackageCard from '@renderer/components/sider/package-card'
import ProfileCenterCard from '@renderer/components/sider/profile-center-card'
import ProfileCard from '@renderer/components/sider/profile-card'
import ProxyCard from '@renderer/components/sider/proxy-card'
import RuleCard from '@renderer/components/sider/rule-card'
import UpdaterButton from '@renderer/components/updater/updater-button'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { applyTheme, setNativeTheme, setTitleBarOverlay } from '@renderer/utils/ipc'
import { platform } from '@renderer/utils/init'
import { TitleBarOverlayOptions } from 'electron'

import MihomoIcon from './components/base/mihomo-icon'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useTranslation } from 'react-i18next'

let navigate: NavigateFunction
let driverInstance: ReturnType<typeof driver> | null = null

export function getDriver(): ReturnType<typeof driver> | null {
  return driverInstance
}

const App: React.FC = () => {
  const { t } = useTranslation()
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    appTheme = 'system',
    customTheme,
    useWindowFrame = false,
    siderWidth = 250,
    siderOrder = [
      'profile',
      'proxy',
      'rule',
      'accelerator',
      'region',
      'package',
      'profileCenter'
    ]
  } = appConfig || {}
  const narrowWidth = platform === 'darwin' ? 70 : 60
  const [order, setOrder] = useState(siderOrder)
  const [siderWidthValue, setSiderWidthValue] = useState(siderWidth)
  const siderWidthValueRef = useRef(siderWidthValue)
  const [resizing, setResizing] = useState(false)
  const resizingRef = useRef(resizing)
  const sensors = useSensors(useSensor(PointerSensor))
  const { setTheme, systemTheme } = useTheme()
  navigate = useNavigate()
  const location = useLocation()
  const page = useRoutes(routes)
  const setTitlebar = (): void => {
    if (!useWindowFrame && platform !== 'darwin') {
      const options = { height: 48 } as TitleBarOverlayOptions
      try {
        options.color = window.getComputedStyle(document.documentElement).backgroundColor
        options.symbolColor = window.getComputedStyle(document.documentElement).color
        setTitleBarOverlay(options)
      } catch (e) {
        // ignore
      }
    }
  }

  useEffect(() => {
    setOrder(siderOrder)
    setSiderWidthValue(siderWidth)
  }, [siderOrder, siderWidth])

  useEffect(() => {
    siderWidthValueRef.current = siderWidthValue
    resizingRef.current = resizing
  }, [siderWidthValue, resizing])

  useEffect(() => {
    driverInstance = driver({
      showProgress: true,
      nextBtnText: t('common.next'),
      prevBtnText: t('common.prev'),
      doneBtnText: t('common.done'),
      progressText: '{{current}} / {{total}}',
      overlayOpacity: 0.9,
      steps: [
        {
          element: 'none',
          popover: {
            title: t('guide.welcome.title'),
            description: t('guide.welcome.description'),
            side: 'over',
            align: 'center'
          }
        },
        {
          element: '.side',
          popover: {
            title: t('guide.sider.title'),
            description: t('guide.sider.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '.sysproxy-card',
          popover: {
            title: t('guide.card.title'),
            description: t('guide.card.description'),
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '.main',
          popover: {
            title: t('guide.main.title'),
            description: t('guide.main.description'),
            side: 'left',
            align: 'center'
          }
        },
        {
          element: '.profile-card',
          popover: {
            title: t('guide.profile.title'),
            description: t('guide.profile.description'),
            side: 'right',
            align: 'start',
            onNextClick: async (): Promise<void> => {
              navigate('/profiles')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: '.profiles-sticky',
          popover: {
            title: t('guide.import.title'),
            description: t('guide.import.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.substore-import',
          popover: {
            title: t('guide.substore.title'),
            description: t('guide.substore.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.new-profile',
          popover: {
            title: t('guide.localProfile.title'),
            description: t('guide.localProfile.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.sysproxy-card',
          popover: {
            title: t('guide.sysproxy.title'),
            description: t('guide.sysproxy.description'),
            side: 'right',
            align: 'start',
            onNextClick: async (): Promise<void> => {
              navigate('/sysproxy')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: '.sysproxy-settings',
          popover: {
            title: t('guide.sysproxySetting.title'),
            description: t('guide.sysproxySetting.description'),
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '.tun-card',
          popover: {
            title: t('guide.tun.title'),
            description: t('guide.tun.description'),
            side: 'right',
            align: 'start',
            onNextClick: async (): Promise<void> => {
              navigate('/tun')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: '.tun-settings',
          popover: {
            title: t('guide.tunSetting.title'),
            description: t('guide.tunSetting.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.override-card',
          popover: {
            title: t('guide.override.title'),
            description: t('guide.override.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '.dns-card',
          popover: {
            title: t('guide.dns.title'),
            description: t('guide.dns.description'),
            side: 'right',
            align: 'center',
            onNextClick: async (): Promise<void> => {
              navigate('/profiles')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: 'none',
          popover: {
            title: t('guide.end.title'),
            description: t('guide.end.description'),
            side: 'top',
            align: 'center',
            onNextClick: async (): Promise<void> => {
              navigate('/profiles')
              setTimeout(() => {
                driverInstance?.destroy()
              }, 0)
            }
          }
        }
      ]
    })

    const tourShown = window.localStorage.getItem('tourShown')
    if (!tourShown) {
      window.localStorage.setItem('tourShown', 'true')
      driverInstance.drive()
    }
  }, [t])

  useEffect(() => {
    setNativeTheme(appTheme)
    setTheme(appTheme)
    setTitlebar()
  }, [appTheme, systemTheme])

  useEffect(() => {
    applyTheme(customTheme || 'default.css').then(() => {
      setTitlebar()
    })
  }, [customTheme])

  useEffect(() => {
    window.addEventListener('mouseup', onResizeEnd)
    return (): void => window.removeEventListener('mouseup', onResizeEnd)
  }, [])

  const onResizeEnd = (): void => {
    if (resizingRef.current) {
      setResizing(false)
      patchAppConfig({ siderWidth: siderWidthValueRef.current })
    }
  }

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (over) {
      if (active.id !== over.id) {
        const newOrder = order.slice()
        const activeIndex = newOrder.indexOf(active.id as string)
        const overIndex = newOrder.indexOf(over.id as string)
        newOrder.splice(activeIndex, 1)
        newOrder.splice(overIndex, 0, active.id as string)
        setOrder(newOrder)
        await patchAppConfig({ siderOrder: newOrder })
        return
      }
    }
    navigate(navigateMap[active.id as string])
  }

  const navigateMap = {
    profile: '/profiles',
    proxy: '/proxies',
    rule: '/rules',
    accelerator: '/accelerator',
    region: '/region',
    package: '/package',
    profileCenter: '/profile-center'
  }

  const componentMap = {
    profile: ProfileCard,
    proxy: ProxyCard,
    rule: RuleCard,
    accelerator: AcceleratorCard,
    region: RegionCard,
    package: PackageCard,
    profileCenter: ProfileCenterCard
  }

  if (location.pathname === '/login') {
    return <div className="w-full h-[100vh]">{page}</div>
  }

  return (
    <ProtectedRoute>
      {/* StagewiseToolbar 只在开发模式下加载 */}
      <StagewiseToolbarWrapper />
      <div
        onMouseMove={(e) => {
          if (!resizing) return
          if (e.clientX <= 150) {
            setSiderWidthValue(narrowWidth)
          } else if (e.clientX <= 250) {
            setSiderWidthValue(250)
          } else if (e.clientX >= 400) {
            setSiderWidthValue(400)
          } else {
            setSiderWidthValue(e.clientX)
          }
        }}
        className={`w-full h-[100vh] flex enterprise-main enterprise-dashboard overflow-hidden ${resizing ? 'cursor-ew-resize' : ''}`}
      >
      {siderWidthValue === narrowWidth ? (
        <div style={{ width: `${narrowWidth}px` }} className="side h-full enterprise-sidebar">
          <div className="app-drag flex justify-center items-center z-40 bg-transparent h-[49px] enterprise-header">
            {platform !== 'darwin' && (
              <MihomoIcon className="h-[32px] leading-[32px] text-lg mx-[1px]" />
            )}
            <UpdaterButton iconOnly={true} />
          </div>
          <div className="h-[calc(100%-110px)] overflow-y-auto no-scrollbar">
            <div className="h-full w-full flex flex-col gap-2">
              {order.map((key: string) => {
                const Component = componentMap[key]
                if (!Component) return null
                return <Component key={key} iconOnly={true} />
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-center items-center h-[48px]">
            <Button
              size="sm"
              className={`app-nodrag enterprise-menu-item ${location.pathname.includes('/settings') ? 'active' : ''}`}
              isIconOnly
              color={location.pathname.includes('/settings') ? 'primary' : 'default'}
              variant={location.pathname.includes('/settings') ? 'solid' : 'light'}
              onPress={() => {
                navigate('/settings')
              }}
            >
              <IoSettings className="text-[20px]" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          style={{ width: `${siderWidthValue}px` }}
          className="side h-full overflow-y-auto no-scrollbar enterprise-sidebar"
        >
          <div className="app-drag sticky top-0 z-40 backdrop-blur bg-transparent h-[64px] enterprise-header">
            <div
              className={`flex justify-between items-center p-3 ${!useWindowFrame && platform === 'darwin' ? 'ml-[60px]' : ''}`}
            >
              <div className="flex flex-col">
                <h3 className="text-lg font-bold enterprise-brand">一键连</h3>
                <span className="enterprise-version">v1.7.6</span>
              </div>
              <div className="flex items-center gap-2">
                {/* <UpdaterButton /> */}
              <Button
                size="sm"
                  className="app-nodrag enterprise-menu-item"
                isIconOnly
                color={location.pathname.includes('/settings') ? 'primary' : 'default'}
                variant={location.pathname.includes('/settings') ? 'solid' : 'light'}
                onPress={() => {
                  navigate('/settings')
                }}
              >
                  <IoSettings className="text-[18px]" />
              </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 mx-3">
            <OutboundModeSwitcher />
          </div>
          
          {/* Sidebar Stats */}
          <div className="enterprise-sidebar-stats">
            <div className="enterprise-sidebar-stat-item">
              <span className="enterprise-sidebar-stat-label">规则</span>
              <span className="enterprise-sidebar-stat-value">智能</span>
            </div>
            <div className="enterprise-sidebar-stat-item">
              <span className="enterprise-sidebar-stat-label">直连</span>
              <span className="enterprise-sidebar-stat-value">一键连</span>
            </div>
            <div className="enterprise-sidebar-stat-item">
              <span className="enterprise-sidebar-stat-label">流量</span>
              <span className="enterprise-sidebar-stat-value">13.24 GB/100.0 GB</span>
            </div>
            <div className="enterprise-sidebar-progress">
              <div className="enterprise-sidebar-progress-bar" style={{ width: '13%' }}></div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="enterprise-sidebar-stat-label">代理组</span>
              <span className="enterprise-sidebar-stat-value">4</span>
            </div>
            <div className="flex justify-between mt-1 text-xs">
              <span className="enterprise-sidebar-stat-label">规则</span>
              <span className="enterprise-sidebar-stat-value">514</span>
            </div>
          </div>
          <nav className="mt-3 px-3 pb-4">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
              <div className="space-y-1">
                <SortableContext items={order}>
                  {order
                    .filter((key: string) => ['accelerator', 'region', 'package', 'profileCenter'].includes(key))
                    .map((key: string) => {
                    const Component = componentMap[key]
                    if (!Component) return null
                    return <Component key={key} menuStyle={true} />
                  })}
                </SortableContext>
              </div>
            </DndContext>
          </nav>
        </div>
      )}

      <div
        onMouseDown={() => {
          setResizing(true)
        }}
        style={{
          position: 'fixed',
          zIndex: 50,
          left: `${siderWidthValue - 2}px`,
          width: '4px',
          height: '100vh',
          cursor: 'ew-resize'
        }}
        className={`resize-divider ${resizing ? 'active' : ''}`}
      />
      <Divider orientation="vertical" />
      <div
        style={{ width: `calc(100% - ${siderWidthValue + 1}px)` }}
        className="main grow h-full overflow-hidden"
      >
        {page}
      </div>
    </div>
    </ProtectedRoute>
  )
}

export default App
