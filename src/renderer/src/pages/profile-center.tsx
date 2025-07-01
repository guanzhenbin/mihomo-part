import { Button, Card, Avatar, Divider, Switch, Progress, Select, SelectItem } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { useState, useEffect } from 'react'
import { FaUser, FaEdit, FaHistory, FaShieldAlt, FaBell, FaGlobe } from 'react-icons/fa'
import { MdEmail, MdVpnKey, MdDataUsage, MdDevices, MdCalendarToday } from 'react-icons/md'
import { IoSettings, IoLogOut } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@renderer/hooks/use-auth'

interface UserProfile {
  username: string
  email: string
  avatar: string
  memberSince: string
  currentPlan: string
  nextBilling: string
  totalUsage: number
  deviceCount: number
}

interface UsageStats {
  today: number
  week: number
  month: number
  total: number
}

const ProfileCenter: React.FC = () => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: user?.identifier || 'VPN用户',
    email: user?.email || user?.identifier || 'user@example.com',
    avatar: user?.avatar || '',
    memberSince: '2023-01-15',
    currentPlan: user?.plan?.name || '标准套餐',
    nextBilling: user?.expired_at ? new Date(user.expired_at * 1000).toISOString().split('T')[0] : '2024-03-15',
    totalUsage: user?.transfer ? (user.transfer.total / (1024 * 1024 * 1024)) : 245.5,
    deviceCount: 3
  })

  const [settings, setSettings] = useState({
    autoConnect: true,
    killSwitch: false,
    notifications: true,
    language: 'zh-CN',
    theme: 'system'
  })

  const usageStats: UsageStats = {
    today: user?.transfer ? ((user.transfer.upload + user.transfer.download) / (1024 * 1024 * 1024)) * 0.1 : 2.1,
    week: user?.transfer ? ((user.transfer.upload + user.transfer.download) / (1024 * 1024 * 1024)) * 0.4 : 15.8,
    month: user?.transfer ? ((user.transfer.upload + user.transfer.download) / (1024 * 1024 * 1024)) * 0.7 : 45.2,
    total: user?.transfer ? ((user.transfer.upload + user.transfer.download) / (1024 * 1024 * 1024)) : 245.5
  }

  // 同步真实用户数据到本地状态
  useEffect(() => {
    if (user) {
      setUserProfile({
        username: user.identifier || 'VPN用户',
        email: user.email || user.identifier || 'user@example.com',
        avatar: user.avatar || '',
        memberSince: '2023-01-15',
        currentPlan: user.plan?.name || '标准套餐',
        nextBilling: user.expired_at ? new Date(user.expired_at * 1000).toISOString().split('T')[0] : '2024-03-15',
        totalUsage: user.transfer ? (user.transfer.total / (1024 * 1024 * 1024)) : 245.5,
        deviceCount: 3
      })
    }
  }, [user])

  const handleSettingChange = (key: string, value: boolean | string): void => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatUsage = (gb: number): string => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(0)} MB`
    }
    return `${gb.toFixed(1)} GB`
  }

  const getUsageColor = (usage: number, limit: number = 100): "primary" | "success" | "warning" | "danger" => {
    const percentage = (usage / limit) * 100
    if (percentage < 50) return 'success'
    if (percentage < 80) return 'warning'
    return 'danger'
  }

  return (
    <BasePage title={t('个人中心') || '个人中心'}>
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* 1. 顶部信息区 */}
        <Card className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl rounded-2xl">
          <div className="flex items-center gap-6">
            <Avatar
              size="lg"
              src={userProfile.avatar}
              name={userProfile.username}
              className="ring-4 ring-blue-400/30 shadow-lg shadow-blue-400/20 w-20 h-20 text-3xl"
            />
            <div>
              <h2 className="text-2xl font-bold mb-1 text-slate-800">{userProfile.username}</h2>
              <div className="text-slate-500 text-base flex items-center gap-2"><MdEmail />{userProfile.email}</div>
              <div className="text-xs text-slate-400 mt-1">注册于 {formatDate(userProfile.memberSince)}</div>
            </div>
          </div>
          <Button
            size="md"
            className="gaming-button px-6 py-2 text-base font-semibold"
            startContent={<FaEdit />}
          >
            编辑
          </Button>
        </Card>

        {/* 2. 会员与设备卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md rounded-xl">
            <MdVpnKey className="text-blue-400 text-2xl mb-2" />
            <div className="text-sm text-slate-500 mb-1">当前套餐</div>
            <div className="font-bold text-lg text-blue-600">{userProfile.currentPlan}</div>
          </Card>
          <Card className="p-6 flex flex-col items-center bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md rounded-xl">
            <MdCalendarToday className="text-purple-400 text-2xl mb-2" />
            <div className="text-sm text-slate-500 mb-1">下次账单</div>
            <div className="font-bold text-lg text-purple-600">{formatDate(userProfile.nextBilling)}</div>
          </Card>
          <Card className="p-6 flex flex-col items-center bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md rounded-xl">
            <MdDevices className="text-green-400 text-2xl mb-2" />
            <div className="text-sm text-slate-500 mb-1">设备数量</div>
            <div className="font-bold text-lg text-green-600">{userProfile.deviceCount}/5</div>
          </Card>
        </div>

        {/* 3. 流量统计区 */}
        <Card className="p-8 shadow-xl rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center text-blue-700"><MdDataUsage className="mr-2 text-blue-400" />使用统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{formatUsage(usageStats.today)}</div>
              <div className="text-xs text-slate-500">今日使用</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{formatUsage(usageStats.week)}</div>
              <div className="text-xs text-slate-500">本周使用</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-1">{formatUsage(usageStats.month)}</div>
              <div className="text-xs text-slate-500">本月使用</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{formatUsage(usageStats.total)}</div>
              <div className="text-xs text-slate-500">总计使用</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>本月流量使用</span>
              <span>{formatUsage(usageStats.month)} / 100 GB</span>
            </div>
            <Progress 
              size="md" 
              color={getUsageColor(usageStats.month, 100)} 
              value={(usageStats.month / 100) * 100} 
              className="h-3 rounded-full"
              classNames={{
                track: "bg-slate-200",
                indicator: "bg-gradient-to-r from-blue-400 to-purple-400"
              }}
            />
          </div>
        </Card>

        {/* 4. 应用设置区 */}
        <Card className="p-8 shadow-xl rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center text-blue-700"><IoSettings className="mr-2 text-blue-400" />应用设置</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FaShieldAlt className="text-blue-400 text-xl" />
                <div>
                  <div className="font-medium text-slate-800">自动连接</div>
                  <div className="text-xs text-slate-500">启动时自动连接加速器</div>
                </div>
              </div>
              <Switch
                isSelected={settings.autoConnect}
                onValueChange={(value) => handleSettingChange('autoConnect', value)}
              />
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FaShieldAlt className="text-red-400 text-xl" />
                <div>
                  <div className="font-medium text-slate-800">网络保护开关</div>
                  <div className="text-xs text-slate-500">加速器断开时阻止网络访问</div>
                </div>
              </div>
              <Switch
                isSelected={settings.killSwitch}
                onValueChange={(value) => handleSettingChange('killSwitch', value)}
              />
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FaBell className="text-yellow-400 text-xl" />
                <div>
                  <div className="font-medium text-slate-800">通知提醒</div>
                  <div className="text-xs text-slate-500">接收重要通知和更新</div>
                </div>
              </div>
              <Switch
                isSelected={settings.notifications}
                onValueChange={(value) => handleSettingChange('notifications', value)}
              />
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FaGlobe className="text-green-400 text-xl" />
                <div>
                  <div className="font-medium text-slate-800">界面语言</div>
                  <div className="text-xs text-slate-500">选择应用界面语言</div>
                </div>
              </div>
              <Select
                size="sm"
                className="w-32"
                selectedKeys={[settings.language]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string
                  handleSettingChange('language', selected)
                }}
              >
                <SelectItem key="zh-CN">中文</SelectItem>
                <SelectItem key="en-US">English</SelectItem>
                <SelectItem key="ja-JP">日本語</SelectItem>
              </Select>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <IoSettings className="text-purple-400 text-xl" />
                <div>
                  <div className="font-medium text-slate-800">主题设置</div>
                  <div className="text-xs text-slate-500">选择应用主题外观</div>
                </div>
              </div>
              <Select
                size="sm"
                className="w-32"
                selectedKeys={[settings.theme]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string
                  handleSettingChange('theme', selected)
                }}
              >
                <SelectItem key="light">浅色</SelectItem>
                <SelectItem key="dark">深色</SelectItem>
                <SelectItem key="system">跟随系统</SelectItem>
              </Select>
            </div>
          </div>
        </Card>

        {/* 5. 快捷操作区 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 shadow-md rounded-xl">
            <h4 className="font-semibold mb-4 flex items-center text-blue-700"><FaHistory className="mr-2 text-blue-400" />使用历史</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 text-sm">2024-01-15</span>
                <span className="text-blue-600 font-medium text-sm">2.3 GB</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 text-sm">2024-01-14</span>
                <span className="text-blue-600 font-medium text-sm">1.8 GB</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 text-sm">2024-01-13</span>
                <span className="text-blue-600 font-medium text-sm">3.1 GB</span>
              </div>
            </div>
            <Button
              size="sm"
              className="gaming-button mt-4"
              fullWidth
            >
              查看完整历史
            </Button>
          </Card>
          <Card className="p-6 shadow-md rounded-xl">
            <h4 className="font-semibold mb-4 flex items-center text-blue-700"><FaUser className="mr-2 text-blue-400" />账户操作</h4>
            <div className="space-y-3">
              <Button
                size="sm"
                className="gaming-button"
                fullWidth
              >
                更改密码
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="warning"
                fullWidth
                className="bg-orange-100 text-orange-600 hover:bg-orange-200"
              >
                管理套餐
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                fullWidth
                startContent={<IoLogOut />}
                onPress={() => logout()}
                className="bg-red-100 text-red-600 hover:bg-red-200"
              >
                退出登录
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </BasePage>
  )
}

export default ProfileCenter 