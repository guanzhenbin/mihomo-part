import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Chip, Progress, Divider } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { UserProfile } from '@renderer/services/api'
import { User, Mail, Calendar, Package, Download, Upload, Clock } from 'lucide-react'

const ProfileCenterPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const savedProfile = sessionStorage.getItem('mihomo-party-user')
        if (savedProfile) {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0
    return Math.min((used / total) * 100, 100)
  }

  if (isLoading) {
    return (
      <BasePage title="个人中心" isLoading={true}>
        <div />
      </BasePage>
    )
  }

  if (!userProfile) {
    return (
      <BasePage title="个人中心" isLoading={false}>
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">未找到用户信息</p>
          </CardBody>
        </Card>
      </BasePage>
    )
  }

  const { data } = userProfile
  const totalUsage = data.u + data.d
  const usagePercentage = calculateUsagePercentage(totalUsage, data.transfer_enable)

  return (
    <BasePage title="个人中心" isLoading={false}>
      <div className="space-y-6">
        {/* 用户基本信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <h3 className="text-lg font-semibold">用户信息</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">邮箱</p>
                  <p className="font-medium">{data.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">用户ID</p>
                  <p className="font-medium">{data.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">到期时间</p>
                  <p className="font-medium">{formatDate(data.expired_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">订阅状态</p>
                  <Chip 
                    color={data.expired_at > Date.now() / 1000 ? 'success' : 'danger'}
                    size="sm"
                  >
                    {data.expired_at > Date.now() / 1000 ? '有效' : '已过期'}
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 流量使用情况 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <h3 className="text-lg font-semibold">流量使用</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">总使用量</span>
                <span className="font-medium">
                  {formatBytes(totalUsage)} / {formatBytes(data.transfer_enable)}
                </span>
              </div>
              <Progress 
                value={usagePercentage} 
                color={usagePercentage > 80 ? 'danger' : usagePercentage > 60 ? 'warning' : 'success'}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{usagePercentage.toFixed(1)}% 已使用</span>
                <span>{(100 - usagePercentage).toFixed(1)}% 剩余</span>
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">上传流量</p>
                  <p className="font-medium">{formatBytes(data.u)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">下载流量</p>
                  <p className="font-medium">{formatBytes(data.d)}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 套餐信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <h3 className="text-lg font-semibold">套餐信息</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">套餐名称</p>
                <p className="font-medium">{data.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">限速</p>
                <p className="font-medium">{data.plan.speed_limit} Mbps</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">月费</p>
                <p className="font-medium">¥{(data.plan.month_price / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">套餐流量</p>
                <p className="font-medium">{formatBytes(data.plan.transfer_enable)}</p>
              </div>
            </div>

            {data.plan.content && (
              <>
                <Divider />
                <div>
                  <p className="text-sm text-gray-500 mb-2">套餐描述</p>
                  <div 
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.plan.content }}
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* 订阅信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h3 className="text-lg font-semibold">订阅信息</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">订阅链接</p>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                {data.subscribe_url}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">UUID</p>
              <p className="font-mono text-sm">{data.uuid}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </BasePage>
  )
}

export default ProfileCenterPage