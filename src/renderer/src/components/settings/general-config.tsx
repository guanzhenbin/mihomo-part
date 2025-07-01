import React, { useEffect, useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Select, SelectItem, Switch, Tab, Tabs, Tooltip } from '@heroui/react'
import { BiCopy, BiSolidFileImport } from 'react-icons/bi'
import {
  applyTheme,
  closeFloatingWindow,
  closeTrayIcon,
  copyEnv,
  fetchThemes,
  getFilePath,
  importThemes,
  relaunchApp,
  resolveThemes,
  showFloatingWindow,
  showTrayIcon,
  startMonitor,
  writeTheme
} from '@renderer/utils/ipc'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import debounce from '@renderer/utils/debounce'
import { platform } from '@renderer/utils/init'
import { useTheme } from 'next-themes'
import { IoIosHelpCircle, IoMdCloudDownload } from 'react-icons/io'
import { MdEditDocument } from 'react-icons/md'
import CSSEditorModal from './css-editor-modal'
import { useTranslation } from 'react-i18next'

const GeneralConfig: React.FC = () => {
  const { t } = useTranslation()
  const { appConfig, patchAppConfig } = useAppConfig()
  const [customThemes, setCustomThemes] = useState<{ key: string; label: string }[]>()
  const [openCSSEditor, setOpenCSSEditor] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [isRelaunching, setIsRelaunching] = useState(false)
  const { setTheme } = useTheme()
  const {
    silentStart = false,
    useDockIcon = true,
    showTraffic = false,
    proxyInTray = true,
    disableTray = false,
    showFloatingWindow: showFloating = false,
    spinFloatingIcon = true,
    useWindowFrame = false,
    autoQuitWithoutCore = false,
    autoQuitWithoutCoreDelay = 60,
    customTheme = 'default.css',
    envType = [platform === 'win32' ? 'powershell' : 'bash'],
    autoCheckUpdate,
    appTheme = 'system'
  } = appConfig || {}

  useEffect(() => {
    resolveThemes().then((themes) => {
      setCustomThemes(themes)
    })
  }, [])

  return (
    <>
      {openCSSEditor && (
        <CSSEditorModal
          theme={customTheme}
          onCancel={() => setOpenCSSEditor(false)}
          onConfirm={async (css: string) => {
            await writeTheme(customTheme, css)
            await applyTheme(customTheme)
            setOpenCSSEditor(false)
          }}
        />
      )}
      <SettingCard>
        <SettingItem title={t('settings.autoCheckUpdate')} divider>
          <Switch
            size="sm"
            isSelected={autoCheckUpdate}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-gradient-to-r from-amber-500 to-orange-500 group-data-[selected=false]:bg-white/15 border border-white/20",
              thumb: "bg-white shadow-xl shadow-amber-500/30",
              thumbIcon: "text-amber-500"
            }}
            onValueChange={(v) => {
              patchAppConfig({ autoCheckUpdate: v })
            }}
          />
        </SettingItem>
        <SettingItem title={t('settings.silentStart')} divider>
          <Switch
            size="sm"
            isSelected={silentStart}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-gradient-to-r from-amber-500 to-orange-500 group-data-[selected=false]:bg-white/15 border border-white/20",
              thumb: "bg-white shadow-xl shadow-amber-500/30",
              thumbIcon: "text-amber-500"
            }}
            onValueChange={(v) => {
              patchAppConfig({ silentStart: v })
            }}
          />
        </SettingItem>
        <SettingItem
          title={t('settings.autoQuitWithoutCore')}
          actions={
            <Tooltip 
              content={t('settings.autoQuitWithoutCoreTooltip')}
              classNames={{
                content: "backdrop-blur-2xl bg-gray-800/95 border border-white/30 text-white shadow-2xl rounded-xl px-4 py-2"
              }}
            >
              <Button 
                isIconOnly 
                size="sm" 
                variant="light"
                className="text-gray-400 hover:text-amber-400 transition-colors hover:bg-white/10 rounded-xl"
              >
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Switch
            size="sm"
            isSelected={autoQuitWithoutCore}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-gradient-to-r from-amber-500 to-orange-500 group-data-[selected=false]:bg-white/15 border border-white/20",
              thumb: "bg-white shadow-xl shadow-amber-500/30",
              thumbIcon: "text-amber-500"
            }}
            onValueChange={(v) => {
              patchAppConfig({ autoQuitWithoutCore: v })
            }}
          />
        </SettingItem>
        {autoQuitWithoutCore && (
          <SettingItem title={t('settings.autoQuitWithoutCoreDelay')} divider>
            <Input
              size="sm"
              className="w-[100px]"
              type="number"
              endContent={<span className="text-gray-400 text-xs">{t('common.seconds')}</span>}
              value={autoQuitWithoutCoreDelay.toString()}
              classNames={{
                input: "text-white font-medium",
                inputWrapper: "backdrop-blur-2xl bg-gradient-to-r from-white/[0.08] to-amber-500/[0.05] border border-white/30 data-[hover=true]:bg-white/[0.12] shadow-lg"
              }}
              onValueChange={async (v: string) => {
                let num = parseInt(v)
                if (isNaN(num)) num = 5
                if (num < 5) num = 5
                await patchAppConfig({ autoQuitWithoutCoreDelay: num })
              }}
            />
          </SettingItem>
        )}
        <SettingItem
          title={t('settings.envType')}
          actions={envType.map((type) => (
            <Button
              key={type}
              title={type}
              isIconOnly
              size="sm"
              variant="light"
              className="text-gray-400 hover:text-orange-400 transition-colors"
              onPress={() => copyEnv(type)}
            >
              <BiCopy className="text-lg" />
            </Button>
          ))}
          divider
        >
          <Select
            className="w-[150px] liquid-glass-select"
            size="sm"
            selectionMode="multiple"
            selectedKeys={new Set(envType)}
            aria-label={t('settings.envType')}
            disallowEmptySelection={true}
            onSelectionChange={async (v) => {
              try {
                await patchAppConfig({
                  envType: Array.from(v) as ('bash' | 'cmd' | 'powershell')[]
                })
              } catch (e) {
                alert(e)
              }
            }}
          >
            <SelectItem key="bash">Bash</SelectItem>
            <SelectItem key="cmd">CMD</SelectItem>
            <SelectItem key="powershell">PowerShell</SelectItem>
          </Select>
        </SettingItem>
        <SettingItem title={t('settings.showFloatingWindow')} divider>
          <Switch
            size="sm"
            isSelected={showFloating}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-gradient-to-r from-amber-500 to-orange-500 group-data-[selected=false]:bg-white/15 border border-white/20",
              thumb: "bg-white shadow-xl shadow-amber-500/30",
              thumbIcon: "text-amber-500"
            }}
            onValueChange={async (v) => {
              await patchAppConfig({ showFloatingWindow: v })
              if (v) {
                showFloatingWindow()
              } else {
                closeFloatingWindow()
              }
            }}
          />
        </SettingItem>

        {showFloating && (
          <>
            <SettingItem title={t('settings.spinFloatingIcon')} divider>
              <Switch
                size="sm"
                isSelected={spinFloatingIcon}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-gradient-to-r from-orange-500 to-orange-600 group-data-[selected=false]:bg-white/20",
                  thumb: "bg-white shadow-lg",
                  thumbIcon: "text-orange-500"
                }}
                onValueChange={async (v) => {
                  await patchAppConfig({ spinFloatingIcon: v })
                  window.electron.ipcRenderer.send('updateFloatingWindow')
                }}
              />
            </SettingItem>
            <SettingItem title={t('settings.disableTray')} divider>
              <Switch
                size="sm"
                isSelected={disableTray}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-gradient-to-r from-orange-500 to-orange-600 group-data-[selected=false]:bg-white/20",
                  thumb: "bg-white shadow-lg",
                  thumbIcon: "text-orange-500"
                }}
                onValueChange={async (v) => {
                  await patchAppConfig({ disableTray: v })
                  if (v) {
                    closeTrayIcon()
                  } else {
                    showTrayIcon()
                  }
                }}
              />
            </SettingItem>
          </>
        )}
        {platform !== 'linux' && (
          <>
            <SettingItem title={t('settings.proxyInTray')} divider>
              <Switch
                size="sm"
                isSelected={proxyInTray}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-gradient-to-r from-orange-500 to-orange-600 group-data-[selected=false]:bg-white/20",
                  thumb: "bg-white shadow-lg",
                  thumbIcon: "text-orange-500"
                }}
                onValueChange={async (v) => {
                  await patchAppConfig({ proxyInTray: v })
                }}
              />
            </SettingItem>
            <SettingItem
              title={t('settings.showTraffic', {
                context: platform === 'win32' ? 'windows' : 'mac'
              })}
              divider
            >
              <Switch
                size="sm"
                isSelected={showTraffic}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-gradient-to-r from-orange-500 to-orange-600 group-data-[selected=false]:bg-white/20",
                  thumb: "bg-white shadow-lg",
                  thumbIcon: "text-orange-500"
                }}
                onValueChange={async (v) => {
                  await patchAppConfig({ showTraffic: v })
                  await startMonitor()
                }}
              />
            </SettingItem>
          </>
        )}
        {platform === 'darwin' && (
          <>
            <SettingItem title={t('settings.showDockIcon')} divider>
              <Switch
                size="sm"
                isSelected={useDockIcon}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-gradient-to-r from-orange-500 to-orange-600 group-data-[selected=false]:bg-white/20",
                  thumb: "bg-white shadow-lg",
                  thumbIcon: "text-orange-500"
                }}
                onValueChange={async (v) => {
                  await patchAppConfig({ useDockIcon: v })
                }}
              />
            </SettingItem>
          </>
        )}

        <SettingItem title={t('settings.useWindowFrame')} divider>
          <Switch
            size="sm"
            isSelected={useWindowFrame}
            isDisabled={isRelaunching}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-gradient-to-r from-amber-500 to-orange-500 group-data-[selected=false]:bg-white/15 border border-white/20",
              thumb: "bg-white shadow-xl shadow-amber-500/30",
              thumbIcon: "text-amber-500"
            }}
            onValueChange={debounce(async (v) => {
              if (isRelaunching) return
              setIsRelaunching(true)
              try {
                await patchAppConfig({ useWindowFrame: v })
                await relaunchApp()
              } catch (e) {
                alert(e)
                setIsRelaunching(false)
              }
            }, 1000)}
          />
        </SettingItem>
        <SettingItem title={t('settings.backgroundColor')} divider>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={appTheme}
            className="liquid-glass-tabs"
            onSelectionChange={(key) => {
              setTheme(key.toString())
              patchAppConfig({ appTheme: key as AppTheme })
            }}
          >
            <Tab key="system" title={t('settings.backgroundAuto')} />
            <Tab key="dark" title={t('settings.backgroundDark')} />
            <Tab key="light" title={t('settings.backgroundLight')} />
          </Tabs>
        </SettingItem>
        <SettingItem
          title={t('settings.theme')}
          actions={
            <>
              <Button
                size="sm"
                isLoading={fetching}
                isIconOnly
                title={t('settings.fetchTheme')}
                variant="light"
                className="text-gray-400 hover:text-amber-400 transition-colors hover:bg-white/10 rounded-xl"
                onPress={async () => {
                  setFetching(true)
                  try {
                    await fetchThemes()
                    setCustomThemes(await resolveThemes())
                  } catch (e) {
                    alert(e)
                  } finally {
                    setFetching(false)
                  }
                }}
              >
                <IoMdCloudDownload className="text-lg" />
              </Button>
              <Button
                size="sm"
                isIconOnly
                title={t('settings.importTheme')}
                variant="light"
                className="text-gray-400 hover:text-amber-400 transition-colors hover:bg-white/10 rounded-xl"
                onPress={async () => {
                  const files = await getFilePath(['css'])
                  if (!files) return
                  try {
                    await importThemes(files)
                    setCustomThemes(await resolveThemes())
                  } catch (e) {
                    alert(e)
                  }
                }}
              >
                <BiSolidFileImport className="text-lg" />
              </Button>
              <Button
                size="sm"
                isIconOnly
                title={t('settings.editTheme')}
                variant="light"
                className="text-gray-400 hover:text-amber-400 transition-colors hover:bg-white/10 rounded-xl"
                onPress={async () => {
                  setOpenCSSEditor(true)
                }}
              >
                <MdEditDocument className="text-lg" />
              </Button>
            </>
          }
        >
          {customThemes && (
            <Select
              className="w-[60%] liquid-glass-select"
              size="sm"
              selectedKeys={new Set([customTheme])}
              aria-label={t('settings.selectTheme')}
              disallowEmptySelection={true}
              onSelectionChange={async (v) => {
                try {
                  await patchAppConfig({ customTheme: v.currentKey as string })
                } catch (e) {
                  alert(e)
                }
              }}
            >
              {customThemes.map((theme) => (
                <SelectItem key={theme.key}>{theme.label}</SelectItem>
              ))}
            </Select>
          )}
        </SettingItem>
      </SettingCard>
    </>
  )
}

export default GeneralConfig
