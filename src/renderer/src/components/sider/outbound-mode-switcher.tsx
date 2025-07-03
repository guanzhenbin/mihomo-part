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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
      <Tabs
        fullWidth
        color="primary"
        selectedKey={mode}
        classNames={{
          tabList: 'bg-transparent gap-1 outbound-mode-card',
          tab: 'h-9 rounded-lg data-[selected=true]:bg-primary data-[selected=true]:text-white data-[selected=true]:shadow-sm transition-all duration-200',
          tabContent: 'text-sm font-medium'
        }}
        onSelectionChange={(key: Key) => onChangeMode(key as OutboundMode)}
      >
        <Tab key="rule" title={t('sider.cards.outbound.rule')} />
        <Tab key="global" title={t('sider.cards.outbound.global')} />
        <Tab key="direct" title={t('sider.cards.outbound.direct')} />
      </Tabs>
    </div>
  )
}

export default OutboundModeSwitcher
