import {
  Button,
  Checkbox,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input
} from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import ProfileItem from '@renderer/components/profiles/profile-item'
import { useProfileConfig } from '@renderer/hooks/use-profile-config'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { getFilePath, readTextFile, subStoreCollections, subStoreSubs } from '@renderer/utils/ipc'
import type { KeyboardEvent } from 'react'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdContentPaste } from 'react-icons/md'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { FaPlus } from 'react-icons/fa6'
import { IoMdRefresh } from 'react-icons/io'
import SubStoreIcon from '@renderer/components/base/substore-icon'
import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Profiles: React.FC = () => {
  const { t } = useTranslation()
  const {
    profileConfig,
    setProfileConfig,
    addProfileItem,
    updateProfileItem,
    removeProfileItem,
    changeCurrentProfile,
    mutateProfileConfig
  } = useProfileConfig()
  const { appConfig } = useAppConfig()
  const { useSubStore = true, useCustomSubStore = false, customSubStoreUrl = '' } = appConfig || {}
  const { current, items = [] } = profileConfig || {}
  const navigate = useNavigate()
  const [sortedItems, setSortedItems] = useState(items)
  const [useProxy, setUseProxy] = useState(false)
  const [subStoreImporting, setSubStoreImporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [fileOver, setFileOver] = useState(false)
  const [url, setUrl] = useState('')
  const isUrlEmpty = url.trim() === ''
  const sensors = useSensors(useSensor(PointerSensor))
  const { data: subs = [], mutate: mutateSubs } = useSWR(
    useSubStore ? 'subStoreSubs' : undefined,
    useSubStore ? subStoreSubs : (): undefined => {}
  )
  const { data: collections = [], mutate: mutateCollections } = useSWR(
    useSubStore ? 'subStoreCollections' : undefined,
    useSubStore ? subStoreCollections : (): undefined => {}
  )
  const subStoreMenuItems = useMemo(() => {
    const items: { icon?: ReactNode; key: string; children: ReactNode; divider: boolean }[] = [
      {
        key: 'open-substore',
        children: t('profiles.substore.visit'),
        icon: <SubStoreIcon className="text-lg" />,
        divider:
          (Boolean(subs) && subs.length > 0) || (Boolean(collections) && collections.length > 0)
      }
    ]
    if (subs) {
      subs.forEach((sub, index) => {
        items.push({
          key: `sub-${sub.name}`,
          children: (
            <div className="flex justify-between">
              <div>{sub.displayName || sub.name}</div>
              <div>
                {sub.tag?.map((tag) => {
                  return (
                    <Chip key={tag} size="sm" className="ml-1" radius="sm">
                      {tag}
                    </Chip>
                  )
                })}
              </div>
            </div>
          ),
          icon: sub.icon ? <img src={sub.icon} className="h-[18px] w-[18px]" /> : null,
          divider: index === subs.length - 1 && Boolean(collections) && collections.length > 0
        })
      })
    }
    if (collections) {
      collections.forEach((sub) => {
        items.push({
          key: `collection-${sub.name}`,
          children: (
            <div className="flex justify-between">
              <div>{sub.displayName || sub.name}</div>
              <div>
                {sub.tag?.map((tag) => {
                  return (
                    <Chip key={tag} size="sm" className="ml-1" radius="sm">
                      {tag}
                    </Chip>
                  )
                })}
              </div>
            </div>
          ),
          icon: sub.icon ? <img src={sub.icon} className="h-[18px] w-[18px]" /> : null,
          divider: false
        })
      })
    }
    return items
  }, [subs, collections])
  const handleImport = async (): Promise<void> => {
    setImporting(true)
    await addProfileItem({ name: '', type: 'remote', url, useProxy })
    setUrl('')
    setImporting(false)
  }
  const pageRef = useRef<HTMLDivElement>(null)

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (over) {
      if (active.id !== over.id) {
        const newOrder = sortedItems.slice()
        const activeIndex = newOrder.findIndex((item) => item.id === active.id)
        const overIndex = newOrder.findIndex((item) => item.id === over.id)
        newOrder.splice(activeIndex, 1)
        newOrder.splice(overIndex, 0, items[activeIndex])
        setSortedItems(newOrder)
        await setProfileConfig({ current, items: newOrder })
      }
    }
  }

  const handleInputKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || isUrlEmpty) return
      handleImport()
    },
    [isUrlEmpty]
  )

  useEffect(() => {
    pageRef.current?.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
      setFileOver(true)
    })
    pageRef.current?.addEventListener('dragleave', (e) => {
      e.preventDefault()
      e.stopPropagation()
      setFileOver(false)
    })
    pageRef.current?.addEventListener('drop', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0]
        if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
          try {
            const path = window.api.webUtils.getPathForFile(file)
            const content = await readTextFile(path)
            await addProfileItem({ name: file.name, type: 'local', file: content })
          } catch (e) {
            alert(e)
          }
        } else {
          alert(t('profiles.error.unsupportedFileType'))
        }
      }
      setFileOver(false)
    })
    return (): void => {
      pageRef.current?.removeEventListener('dragover', () => {})
      pageRef.current?.removeEventListener('dragleave', () => {})
      pageRef.current?.removeEventListener('drop', () => {})
    }
  }, [])

  useEffect(() => {
    setSortedItems(items)
  }, [items])

  return (
    <BasePage
      ref={pageRef}
      title={t('profiles.title')}
      contentClassName="profiles-content profiles-page-container"
      header={
        <Button
          size="sm"
          title={t('profiles.updateAll')}
          className="app-nodrag header-button"
          variant="light"
          isIconOnly
          onPress={async () => {
            setUpdating(true)
            for (const item of items) {
              if (item.id === current) continue
              if (item.type !== 'remote') continue
              await addProfileItem(item)
            }
            const currentItem = items.find((item) => item.id === current)
            if (currentItem && currentItem.type === 'remote') {
              await addProfileItem(currentItem)
            }
            setUpdating(false)
          }}
        >
          <IoMdRefresh className={`text-lg text-white/70 ${updating ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <div className="sticky profiles-sticky top-0 z-40">
        <div className="profiles-import-area flex p-4 m-4">
          <Input
            size="lg"
            value={url}
            onValueChange={setUrl}
            onKeyUp={handleInputKeyUp}
            placeholder="输入订阅链接或拖拽配置文件..."
            classNames={{
              base: "flex-1",
              input: "text-white placeholder-white/60",
              inputWrapper: "profiles-sticky"
            }}
            endContent={
              <>
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  className="header-button"
                  onPress={() => {
                    navigator.clipboard.readText().then((text) => {
                      setUrl(text)
                    })
                  }}
                >
                  <MdContentPaste className="text-lg text-white/70" />
                </Button>
                <div className="flex items-center">
                  <Checkbox
                    className="whitespace-nowrap text-white/80 ml-3"
                    classNames={{
                      label: "text-white/80"
                    }}
                    checked={useProxy}
                    onValueChange={setUseProxy}
                  >
                    {t('profiles.useProxy')}
                  </Checkbox>
                </div>
              </>
            }
          />

          <Button
            size="lg"
            color="primary"
            className="ml-4 px-6 font-medium"
            isDisabled={isUrlEmpty}
            isLoading={importing}
            onPress={handleImport}
          >
            {t('profiles.import')}
          </Button>
          {useSubStore && (
            <Dropdown
              onOpenChange={() => {
                mutateSubs()
                mutateCollections()
              }}
            >
              <DropdownTrigger>
                <Button
                  isLoading={subStoreImporting}
                  title="Sub-Store"
                  className="ml-3 substore-import"
                  size="lg"
                  isIconOnly
                  color="primary"
                >
                  <SubStoreIcon className="text-lg" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                className="max-h-[calc(100vh-200px)] overflow-y-auto"
                onAction={async (key) => {
                  if (key === 'open-substore') {
                    navigate('/substore')
                  } else if (key.toString().startsWith('sub-')) {
                    setSubStoreImporting(true)
                    try {
                      const sub = subs.find(
                        (sub) => sub.name === key.toString().replace('sub-', '')
                      )
                      await addProfileItem({
                        name: sub?.displayName || sub?.name || '',
                        substore: !useCustomSubStore,
                        type: 'remote',
                        url: useCustomSubStore
                          ? `${customSubStoreUrl}/download/${key.toString().replace('sub-', '')}?target=ClashMeta`
                          : `/download/${key.toString().replace('sub-', '')}`,
                        useProxy
                      })
                    } catch (e) {
                      alert(e)
                    } finally {
                      setSubStoreImporting(false)
                    }
                  } else if (key.toString().startsWith('collection-')) {
                    setSubStoreImporting(true)
                    try {
                      const collection = collections.find(
                        (collection) =>
                          collection.name === key.toString().replace('collection-', '')
                      )
                      await addProfileItem({
                        name: collection?.displayName || collection?.name || '',
                        type: 'remote',
                        substore: !useCustomSubStore,
                        url: useCustomSubStore
                          ? `${customSubStoreUrl}/download/collection/${key.toString().replace('collection-', '')}?target=ClashMeta`
                          : `/download/collection/${key.toString().replace('collection-', '')}`,
                        useProxy
                      })
                    } catch (e) {
                      alert(e)
                    } finally {
                      setSubStoreImporting(false)
                    }
                  }
                }}
              >
                {subStoreMenuItems.map((item) => (
                  <DropdownItem startContent={item?.icon} key={item.key} showDivider={item.divider}>
                    {item.children}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          )}
          <Dropdown>
            <DropdownTrigger>
              <Button className="ml-3 new-profile" size="lg" isIconOnly color="primary">
                <FaPlus />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={async (key) => {
                if (key === 'open') {
                  try {
                    const files = await getFilePath(['yml', 'yaml'])
                    if (files?.length) {
                      const content = await readTextFile(files[0])
                      const fileName = files[0].split('/').pop()?.split('\\').pop()
                      await addProfileItem({ name: fileName, type: 'local', file: content })
                    }
                  } catch (e) {
                    alert(e)
                  }
                } else if (key === 'new') {
                  await addProfileItem({
                    name: t('profiles.newProfile'),
                    type: 'local',
                    file: 'proxies: []\nproxy-groups: []\nrules: []'
                  })
                }
              }}
            >
              <DropdownItem key="open">{t('profiles.open')}</DropdownItem>
              <DropdownItem key="new">{t('profiles.new')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        <Divider />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div
          className={`profiles-grid ${fileOver ? 'blur-sm profiles-drag-overlay' : ''} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}
        >
          <SortableContext
            items={sortedItems.map((item) => {
              return item.id
            })}
          >
            {sortedItems.map((item) => (
              <ProfileItem
                key={item.id}
                isCurrent={item.id === current}
                addProfileItem={addProfileItem}
                removeProfileItem={removeProfileItem}
                mutateProfileConfig={mutateProfileConfig}
                updateProfileItem={updateProfileItem}
                info={item}
                onPress={async () => {
                  await changeCurrentProfile(item.id)
                }}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </BasePage>
  )
}

export default Profiles
