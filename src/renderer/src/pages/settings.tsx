import { Button, Card, CardBody } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import { CgWebsite } from 'react-icons/cg'
import { IoLogoGithub } from 'react-icons/io5'
import { FaTelegramPlane, FaCog, FaCloud, FaKeyboard, FaUser, FaDatabase } from 'react-icons/fa'
import { FaShield } from 'react-icons/fa6'
import { MdSettings, MdSecurity, MdSpeed, MdOutlineStyle } from 'react-icons/md'
import WebdavConfig from '@renderer/components/settings/webdav-config'
import GeneralConfig from '@renderer/components/settings/general-config'
import MihomoConfig from '@renderer/components/settings/mihomo-config'
import Actions from '@renderer/components/settings/actions'
import LogoutButton from '@renderer/components/settings/logout-button'
import { useTranslation } from 'react-i18next'

const Settings: React.FC = () => {
  const { t } = useTranslation()

  // 统计数据
  const stats = [
    {
      title: '系统配置',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: <MdSettings className="w-6 h-6 text-white" />,
      iconColor: 'blue' as const
    },
    {
      title: '安全设置',
      value: '8',
      change: '+1',
      changeType: 'positive' as const,
      icon: <MdSecurity className="w-6 h-6 text-white" />,
      iconColor: 'green' as const
    },
    {
      title: '网络优化',
      value: '5',
      change: '0',
      changeType: 'neutral' as const,
      icon: <MdSpeed className="w-6 h-6 text-white" />,
      iconColor: 'purple' as const
    },
    {
      title: '界面主题',
      value: '3',
      change: '+1',
      changeType: 'positive' as const,
      icon: <MdOutlineStyle className="w-6 h-6 text-white" />,
      iconColor: 'orange' as const
    }
  ]

  return (
    <BasePage
      title="系统设置"
      subtitle="管理应用程序配置和偏好设置"
      header={
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            title={t('settings.links.docs')}
            className="app-nodrag text-slate-600 hover:text-blue-600 transition-colors"
            onPress={() => {
              window.open('https://mihomo.party')
            }}
          >
            <CgWebsite className="text-lg" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="app-nodrag text-slate-600 hover:text-blue-600 transition-colors"
            title={t('settings.links.github')}
            onPress={() => {
              window.open('https://github.com/mihomo-party-org/mihomo-party')
            }}
          >
            <IoLogoGithub className="text-lg" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="app-nodrag text-slate-600 hover:text-blue-600 transition-colors"
            title={t('settings.links.telegram')}
            onPress={() => {
              window.open('https://t.me/mihomo_party_group')
            }}
          >
            <FaTelegramPlane className="text-lg" />
          </Button>
        </div>
      }
    >
      {/* 统计卡片 */}
      <div className="enterprise-stats-grid mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="enterprise-stat-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`enterprise-stat-icon ${stat.iconColor}`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="enterprise-stat-value">{stat.value}</div>
                  <div className={`enterprise-stat-change ${stat.changeType}`}>
                    {stat.change !== '0' && (
                      <>
                        {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="enterprise-stat-label">{stat.title}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 设置分组 */}
      <div className="space-y-8">
        {/* 基础设置 */}
        <div className="enterprise-content-section">
          <h2 className="enterprise-section-title">
            <FaCog className="text-blue-500" />
            基础设置
          </h2>
          <div className="space-y-6">
            <Card className="enterprise-card">
              <CardBody className="p-6">
                <GeneralConfig />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 网络配置 */}
        <div className="enterprise-content-section">
          <h2 className="enterprise-section-title">
            <FaShield className="text-green-500" />
            网络配置
          </h2>
          <div className="space-y-6">
            <Card className="enterprise-card">
              <CardBody className="p-6">
                <MihomoConfig />
              </CardBody>
            </Card>
          </div>
        </div>
        
        {/* 数据同步 */}
        <div className="enterprise-content-section">
          <h2 className="enterprise-section-title">
            <FaCloud className="text-purple-500" />
            数据同步
          </h2>
          <Card className="enterprise-card">
            <CardBody className="p-6">
          <WebdavConfig />
            </CardBody>
          </Card>
        </div>

        {/* 系统操作 */}
        <div className="enterprise-content-section">
          <h2 className="enterprise-section-title">
            <FaDatabase className="text-red-500" />
            系统操作
          </h2>
          <div className="space-y-6">
            <Card className="enterprise-card">
              <CardBody className="p-6">
          <Actions />
              </CardBody>
            </Card>
            <Card className="enterprise-card">
              <CardBody className="p-6 text-center">
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <FaUser className="text-4xl text-red-500 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">账户管理</h3>
                    <p className="text-gray-600 text-sm">安全退出当前账户会清除所有本地数据</p>
                  </div>
            <LogoutButton />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </BasePage>
  )
}

export default Settings
