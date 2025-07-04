import { Button, Card, CardBody } from '@heroui/react'
import { mihomoUnfixedProxy } from '@renderer/utils/ipc'
import React, { useMemo, useState } from 'react'
import { FaMapPin, FaCheck, FaSignal } from 'react-icons/fa6'

interface Props {
  mutateProxies: () => void
  onProxyDelay: (proxy: string, url?: string) => Promise<IMihomoDelay>
  proxyDisplayMode: 'simple' | 'full'
  proxy: IMihomoProxy | IMihomoGroup
  group: IMihomoMixedGroup
  onSelect: (group: string, proxy: string) => void
  selected: boolean
}

const ProxyItem: React.FC<Props> = (props) => {
  const { mutateProxies, proxyDisplayMode, group, proxy, selected, onSelect, onProxyDelay } = props

  const delay = useMemo(() => {
    if (proxy.history.length > 0) {
      return proxy.history[proxy.history.length - 1].delay
    }
    return -1
  }, [proxy])

  const [loading, setLoading] = useState(false)

  const onDelay = (): void => {
    setLoading(true)
    onProxyDelay(proxy.name, group.testUrl).finally(() => {
      mutateProxies()
      setLoading(false)
    })
  }

  const fixed = group.fixed && group.fixed === proxy.name

  return (
    <Card
      as="div"
      onPress={() => onSelect(group.name, proxy.name)}
      isPressable
      fullWidth
      className={`relative transition-all duration-200 cursor-pointer ${
        selected 
          ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400' 
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      radius="lg"
      shadow="sm"
    >
      <CardBody className="p-5 sm:p-6">
        {proxyDisplayMode === 'full' ? (
          /* Full Mode - 垂直布局 */
          <div className="space-y-4">
            {/* 头部 - 图标、标题和状态 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* 图标 */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  proxy.type === 'Vmess' ? 'bg-blue-500' :
                  proxy.type === 'Shadowsocks' ? 'bg-purple-500' :
                  proxy.type === 'URLTest' ? 'bg-green-500' :
                  proxy.type === 'Selector' ? 'bg-orange-500' :
                  'bg-gray-500'
                }`}>
                  <FaSignal className="text-white text-lg" />
                </div>
                
                {/* 标题和类型 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg" title={proxy.name}>
                      {proxy.name}
                    </h3>
                    {proxy.alive && (
                      <FaCheck className="text-green-500 text-sm flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <span className="text-sm text-gray-600 dark:text-gray-400">
                      {proxy.type} proxy connection
                    </span> */}
                    {proxy.alive && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">Online</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 固定状态按钮 */}
              {fixed && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="warning"
                  onPress={async () => {
                    await mihomoUnfixedProxy(group.name)
                    mutateProxies()
                  }}
                  className="w-8 h-8"
                >
                  <FaMapPin className="text-sm" />
                </Button>
              )}
            </div>
            
            {/* 底部 - 操作按钮 */}
            <div className="flex justify-end">
              <Button
                size="md"
                isLoading={loading}
                onPress={onDelay}
                variant="bordered"
                className="font-medium text-sm px-6 h-9 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                radius="lg"
              >
                {loading ? "Testing..." : 
                 selected ? (delay === -1 ? "Connected" : `${delay}ms`) :
                 delay === -1 ? "Connect" : 
                 delay === 0 ? "Timeout" : `${delay}ms`}
              </Button>
            </div>
          </div>
        ) : (
          /* Simple Mode - 水平布局 */
          <div className="flex items-center justify-between">
            {/* 左侧 - 图标和信息 */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* 图标 */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                proxy.type === 'Vmess' ? 'bg-blue-500' :
                proxy.type === 'Shadowsocks' ? 'bg-purple-500' :
                proxy.type === 'URLTest' ? 'bg-green-500' :
                proxy.type === 'Selector' ? 'bg-orange-500' :
                'bg-gray-500'
              }`}>
                <FaSignal className="text-white text-base" />
              </div>
              
              {/* 信息 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate" title={proxy.name}>
                    {proxy.name}
                  </h3>
                  {proxy.alive && (
                    <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {proxy.type} proxy
                  </span>
                  {proxy.alive && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-green-600 dark:text-green-400 text-xs">Online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* 右侧 - 操作按钮 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {fixed && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="warning"
                  onPress={async () => {
                    await mihomoUnfixedProxy(group.name)
                    mutateProxies()
                  }}
                  className="w-8 h-8"
                >
                  <FaMapPin className="text-sm" />
                </Button>
              )}
              
              <Button
                size="sm"
                isLoading={loading}
                onPress={onDelay}
                variant="bordered"
                className="font-medium text-xs px-4 h-8 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 whitespace-nowrap"
                radius="lg"
              >
                {loading ? "Testing..." : 
                 selected ? (delay === -1 ? "Connected" : `${delay}ms`) :
                 delay === -1 ? "Connect" : 
                 delay === 0 ? "Timeout" : `${delay}ms`}
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ProxyItem