import { Tabs, Tab } from '@heroui/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { useGroups } from '@renderer/hooks/use-groups'
import { mihomoCloseAllConnections, patchMihomoConfig } from '@renderer/utils/ipc'
import { Key } from 'react'
import { useTranslation } from 'react-i18next'

const OutboundModeSwitcher: React.FC = () => {
  const { t } = useTranslation()
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const { mutate: mutateGroups } = useGroups()
  const { appConfig } = useAppConfig()
  const { autoCloseConnection = true } = appConfig || {}
  const { mode } = controledMihomoConfig || {}

  const onChangeMode = async (mode: OutboundMode): Promise<void> => {
    await patchControledMihomoConfig({ mode })
    await patchMihomoConfig({ mode })
    if (autoCloseConnection) {
      await mihomoCloseAllConnections()
    }
    mutateGroups()
    window.electron.ipcRenderer.send('updateTrayMenu')
  }
  if (!mode) return null
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-1.5 backdrop-blur-sm">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl" />
      
      <Tabs
        fullWidth
        aria-label="出站模式切换"
        color="primary"
        selectedKey={mode}
        classNames={{
          tabList: 'relative bg-transparent gap-2 outbound-mode-card p-0',
          tab: 'relative h-11 rounded-xl data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-500 data-[selected=true]:via-indigo-500 data-[selected=true]:to-purple-500 data-[selected=true]:text-white data-[selected=true]:shadow-xl data-[selected=true]:shadow-blue-500/25 data-[selected=false]:bg-white/80 data-[selected=false]:dark:bg-gray-800/80 data-[selected=false]:text-gray-700 data-[selected=false]:dark:text-gray-300 data-[selected=false]:hover:bg-white data-[selected=false]:dark:hover:bg-gray-700 data-[selected=false]:border data-[selected=false]:border-gray-200/60 data-[selected=false]:dark:border-gray-600/60 transition-all duration-300 ease-out transform data-[selected=true]:scale-105',
          tabContent: 'relative z-10 text-sm font-semibold tracking-wide'
        }}
        onSelectionChange={(key: Key) => onChangeMode(key as OutboundMode)}
      >
        <Tab 
          key="rule" 
          title={
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                mode === 'rule' ? 'bg-white shadow-lg' : 'bg-blue-500'
              }`} />
              <span>{t('sider.cards.outbound.rule')}</span>
            </div>
          } 
        />
        <Tab 
          key="global" 
          title={
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                mode === 'global' ? 'bg-white shadow-lg' : 'bg-indigo-500'
              }`} />
              <span>{t('sider.cards.outbound.global')}</span>
            </div>
          } 
        />
      </Tabs>
    </div>
  )
}

export default OutboundModeSwitcher
