import { Button, Card, CardBody } from '@heroui/react'
import { mihomoUnfixedProxy } from '@renderer/utils/ipc'
import React, { useMemo, useState } from 'react'
import { FaMapPin, FaCheck } from 'react-icons/fa6'

interface Props {
  mutateProxies: () => void
  onProxyDelay: (proxy: string, url?: string) => Promise<IMihomoDelay>
  proxyDisplayMode: 'simple' | 'full'
  proxy: IMihomoProxy | IMihomoGroup
  group: IMihomoMixedGroup
  onSelect: (group: string, proxy: string) => void
  selected: boolean
}

// 获取国家旗帜emoji的函数
const getCountryFlag = (proxyName: string): string => {
  const name = proxyName.toLowerCase()
  
  // 国家名称到旗帜emoji的映射
  if (name.includes('阿根廷') || name.includes('argentina')) return '🇦🇷'
  if (name.includes('澳大利亚') || name.includes('australia')) return '🇦🇺'
  if (name.includes('波兰') || name.includes('poland')) return '🇵🇱'
  if (name.includes('美国') || name.includes('usa') || name.includes('united states')) return '🇺🇸'
  if (name.includes('英国') || name.includes('uk') || name.includes('united kingdom')) return '🇬🇧'
  if (name.includes('日本') || name.includes('japan')) return '🇯🇵'
  if (name.includes('韩国') || name.includes('korea') || name.includes('south korea')) return '🇰🇷'
  if (name.includes('新加坡') || name.includes('singapore')) return '🇸🇬'
  if (name.includes('香港') || name.includes('hong kong')) return '🇭🇰'
  if (name.includes('台湾') || name.includes('taiwan')) return '🇹🇼'
  if (name.includes('德国') || name.includes('germany')) return '🇩🇪'
  if (name.includes('法国') || name.includes('france')) return '🇫🇷'
  if (name.includes('加拿大') || name.includes('canada')) return '🇨🇦'
  if (name.includes('荷兰') || name.includes('netherlands')) return '🇳🇱'
  if (name.includes('瑞士') || name.includes('switzerland')) return '🇨🇭'
  if (name.includes('意大利') || name.includes('italy')) return '🇮🇹'
  if (name.includes('西班牙') || name.includes('spain')) return '🇪🇸'
  if (name.includes('俄罗斯') || name.includes('russia')) return '🇷🇺'
  if (name.includes('印度') || name.includes('india')) return '🇮🇳'
  if (name.includes('巴西') || name.includes('brazil')) return '🇧🇷'
  if (name.includes('土耳其') || name.includes('turkey')) return '🇹🇷'
  if (name.includes('泰国') || name.includes('thailand')) return '🇹🇭'
  if (name.includes('马来西亚') || name.includes('malaysia')) return '🇲🇾'
  if (name.includes('菲律宾') || name.includes('philippines')) return '🇵🇭'
  if (name.includes('印尼') || name.includes('indonesia')) return '🇮🇩'
  if (name.includes('越南') || name.includes('vietnam')) return '🇻🇳'
  
  // 默认返回地球图标
  return '🌍'
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
      className={`relative transition-all duration-300 cursor-pointer w-full max-w-full overflow-hidden ${
        selected 
          ? 'bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-800/60 dark:via-indigo-800/60 dark:to-purple-800/60 border-2 border-blue-600 dark:border-blue-400 shadow-2xl shadow-blue-300/60 dark:shadow-blue-800/60 ring-2 ring-blue-300/50 dark:ring-blue-500/50' 
          : 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 hover:border-blue-500/90 dark:hover:border-blue-400/90 hover:shadow-xl hover:shadow-blue-200/40 dark:hover:shadow-blue-800/40 hover:bg-gradient-to-br hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:via-indigo-900/20 dark:hover:to-purple-900/20 hover:ring-1 hover:ring-blue-200/30 dark:hover:ring-blue-600/30'
      }`}
      radius="lg"
      shadow={selected ? "lg" : "sm"}
    >
      <CardBody className="p-4 sm:p-5 w-full overflow-hidden">
        {proxyDisplayMode === 'full' ? (
          /* Full Mode - 垂直布局 */
          <div className="space-y-3 w-full">
            {/* 头部 - 图标、标题和状态 */}
            <div className="flex items-start justify-between w-full">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* 图标 */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  selected 
                    ? 'shadow-xl ring-2 ring-blue-300/70 dark:ring-blue-400/70' 
                    : 'shadow-lg ring-1 ring-white/30 hover:shadow-xl hover:ring-2 hover:ring-blue-200/50 dark:hover:ring-blue-500/50'
                } ${
                  proxy.type === 'Vmess' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  proxy.type === 'Shadowsocks' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                  proxy.type === 'URLTest' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  proxy.type === 'Selector' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                  'bg-gradient-to-br from-gray-500 to-gray-600'
                } backdrop-blur-sm`}>
                  <span className={`text-xl transition-all duration-300 ${
                    selected ? 'drop-shadow-md' : 'drop-shadow-sm'
                  }`}>{getCountryFlag(proxy.name)}</span>
                </div>
                
                {/* 标题和类型 */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-lg truncate transition-colors duration-300 ${
                      selected 
                        ? 'text-blue-800 dark:text-blue-200 drop-shadow-sm' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`} title={proxy.name}>
                      {proxy.name}
                    </h3>
                    {proxy.alive && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 transition-all duration-300 ${
                        selected 
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-300 dark:ring-emerald-600/50' 
                          : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40'
                      }`}>
                        <FaCheck className={`text-xs transition-colors duration-300 ${
                          selected 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`} />
                        <span className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                          selected 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : 'text-green-700 dark:text-green-300'
                        }`}>在线</span>
                      </div>
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
                  className="w-8 h-8 flex-shrink-0"
                >
                  <FaMapPin className="text-sm" />
                </Button>
              )}
            </div>
            
            {/* 底部 - 操作按钮 */}
            <div className="flex justify-end w-full">
              <Button
                size="md"
                isLoading={loading}
                onPress={onDelay}
                variant={selected ? "shadow" : "bordered"}
                color={selected ? "primary" : "default"}
                className={`font-bold text-sm px-6 h-9 transition-all duration-300 whitespace-nowrap ${
                  selected 
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-400/70 dark:shadow-blue-700/70 ring-2 ring-blue-300/60 dark:ring-blue-400/60 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-blue-500/80 dark:hover:shadow-blue-600/80 hover:ring-blue-200/80 dark:hover:ring-blue-300/80' 
                    : 'border-2 border-gray-400 dark:border-gray-500 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:border-blue-600 dark:hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 hover:text-blue-800 dark:hover:text-blue-200 hover:shadow-xl hover:shadow-blue-300/50 dark:hover:shadow-blue-700/50 hover:ring-2 hover:ring-blue-200/50 dark:hover:ring-blue-500/50'
                }`}
                radius="lg"
              >
                {loading ? "测试中..." : 
                 selected ? (delay === -1 ? "已连接" : `${delay}ms`) :
                 delay === -1 ? "连接" : 
                 delay === 0 ? "超时" : `${delay}ms`}
              </Button>
            </div>
          </div>
        ) : (
          /* Simple Mode - 水平布局 */
          <div className="flex items-center justify-between w-full gap-2">
            {/* 左侧 - 图标和信息 */}
            <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
              {/* 图标 */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                selected 
                  ? 'shadow-lg ring-2 ring-blue-300/60 dark:ring-blue-400/60' 
                  : 'shadow-md ring-1 ring-white/30 hover:shadow-lg hover:ring-2 hover:ring-blue-200/40 dark:hover:ring-blue-500/40'
              } ${
                proxy.type === 'Vmess' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                proxy.type === 'Shadowsocks' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                proxy.type === 'URLTest' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                proxy.type === 'Selector' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                'bg-gradient-to-br from-gray-500 to-gray-600'
              } backdrop-blur-sm`}>
                <span className={`text-lg transition-all duration-300 ${
                  selected ? 'drop-shadow-md' : 'drop-shadow-sm'
                }`}>{getCountryFlag(proxy.name)}</span>
              </div>
              
              {/* 信息 */}
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold text-sm truncate max-w-full transition-colors duration-300 ${
                    selected 
                      ? 'text-blue-800 dark:text-blue-200 drop-shadow-sm' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`} title={proxy.name}>
                    {proxy.name}
                  </h3>
                  {proxy.alive && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full flex-shrink-0 transition-all duration-300 ${
                      selected 
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-300 dark:ring-emerald-600/50' 
                        : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40'
                    }`}>
                      <FaCheck className={`text-xs transition-colors duration-300 ${
                        selected 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`} />
                      <span className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                        selected 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : 'text-green-700 dark:text-green-300'
                      }`}>在线</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 右侧 - 操作按钮 */}
            <div className="flex items-center gap-1 flex-shrink-0">
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
                  className="w-7 h-7"
                >
                  <FaMapPin className="text-xs" />
                </Button>
              )}
              
              <Button
                size="sm"
                isLoading={loading}
                onPress={onDelay}
                variant={selected ? "shadow" : "bordered"}
                color={selected ? "primary" : "default"}
                className={`font-bold text-xs px-3 h-8 transition-all duration-300 whitespace-nowrap min-w-0 ${
                  selected 
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white border-none shadow-lg shadow-blue-400/60 dark:shadow-blue-700/60 ring-1 ring-blue-300/50 dark:ring-blue-400/50 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 hover:shadow-xl hover:shadow-blue-500/70 dark:hover:shadow-blue-600/70 hover:ring-blue-200/70 dark:hover:ring-blue-300/70' 
                    : 'border-2 border-gray-400 dark:border-gray-500 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:border-blue-600 dark:hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 hover:text-blue-800 dark:hover:text-blue-200 hover:shadow-lg hover:shadow-blue-300/40 dark:hover:shadow-blue-700/40 hover:ring-1 hover:ring-blue-200/40 dark:hover:ring-blue-500/40'
                }`}
                radius="lg"
              >
                {loading ? "测试中" : 
                 selected ? (delay === -1 ? "已连接" : `${delay}ms`) :
                 delay === -1 ? "连接" : 
                 delay === 0 ? "超时" : `${delay}ms`}
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ProxyItem