import { Card, CardBody, Button, Link, Chip } from '@heroui/react'
import { 
  FaWindows, 
  FaApple, 
  FaLinux, 
  FaAndroid,
  FaDownload,
  FaGithub,
  FaExternalLinkAlt
} from 'react-icons/fa'
import { SiMacos, SiArm, SiIntel } from 'react-icons/si'
import { MdSmartphone, MdComputer, MdTablet } from 'react-icons/md'
import BasePage from '@renderer/components/base/base-page'
import { useTranslation } from 'react-i18next'

const Download: React.FC = () => {
  const { t } = useTranslation()

  const platforms = [
    {
      name: 'Windows',
      icon: <FaWindows className="text-blue-500 text-2xl" />,
      variants: [
        {
          name: 'Windows x64',
          arch: 'x64',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-windows-x64-installer.exe',
          size: '~80MB'
        },
        {
          name: 'Windows ARM64',
          arch: 'ARM64',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-windows-arm64-installer.exe',
          size: '~75MB'
        }
      ]
    },
    {
      name: 'macOS',
      icon: <FaApple className="text-gray-600 text-2xl" />,
      variants: [
        {
          name: 'macOS Intel',
          arch: 'Intel',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-macos-x64.dmg',
          size: '~85MB'
        },
        {
          name: 'macOS Apple Silicon',
          arch: 'M1/M2',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-macos-arm64.dmg',
          size: '~80MB'
        }
      ]
    },
    {
      name: 'Linux',
      icon: <FaLinux className="text-orange-500 text-2xl" />,
      variants: [
        {
          name: 'Linux x64 (AppImage)',
          arch: 'x64',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-linux-x64.AppImage',
          size: '~90MB'
        },
        {
          name: 'Linux ARM64 (AppImage)',
          arch: 'ARM64',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-linux-arm64.AppImage',
          size: '~85MB'
        },
        {
          name: 'Linux x64 (deb)',
          arch: 'x64',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-linux-x64.deb',
          size: '~75MB'
        },
        {
          name: 'Linux ARM64 (deb)',
          arch: 'ARM64',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-linux-arm64.deb',
          size: '~70MB'
        }
      ]
    },
    {
      name: 'Android',
      icon: <FaAndroid className="text-green-500 text-2xl" />,
      variants: [
        {
          name: 'Android APK',
          arch: 'Universal',
          url: 'https://github.com/mihomo-party-org/mihomo-party/releases/latest/download/mihomo-party-android.apk',
          size: '~50MB'
        }
      ]
    }
  ]

  const handleDownload = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <BasePage title={t('sider.download.title')}>
      <div className="space-y-6 p-6">
        {/* 头部说明 */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaDownload className="text-primary text-xl" />
              <h2 className="text-xl font-semibold">{t('download.title')}</h2>
            </div>
            <p className="text-default-500 mb-4">
              {t('download.description')}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<FaGithub />}
                onPress={() => handleDownload('https://github.com/mihomo-party-org/mihomo-party/releases/latest')}
              >
                {t('download.viewOnGithub')}
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<FaExternalLinkAlt />}
                onPress={() => handleDownload('https://mihomo-party.org')}
              >
                {t('download.officialWebsite')}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* 平台下载列表 */}
        <div className="grid gap-4">
          {platforms.map((platform) => (
            <Card key={platform.name} className="border-2 border-default-200 hover:border-primary-300 transition-colors">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {platform.icon}
                  <h3 className="text-lg font-semibold">{platform.name}</h3>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  {platform.variants.map((variant) => (
                    <div
                      key={variant.name}
                      className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{variant.name}</div>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="default">
                            {variant.arch}
                          </Chip>
                          <span className="text-xs text-default-500">{variant.size}</span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<FaDownload className="text-sm" />}
                        onPress={() => handleDownload(variant.url)}
                        className="ml-3"
                      >
                        {t('download.download')}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* 安装说明 */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-3">{t('download.installGuide.title')}</h3>
            <div className="space-y-3 text-sm text-default-600">
              <div>
                <strong>Windows:</strong> {t('download.installGuide.windows')}
              </div>
              <div>
                <strong>macOS:</strong> {t('download.installGuide.macos')}
              </div>
              <div>
                <strong>Linux:</strong> {t('download.installGuide.linux')}
              </div>
              <div>
                <strong>Android:</strong> {t('download.installGuide.android')}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </BasePage>
  )
}

export default Download