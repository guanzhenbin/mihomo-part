import { Button } from '@heroui/react'
import { useAuth } from '@renderer/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Button
      color="danger"
      variant="ghost"
      startContent={<LogOut className="h-4 w-4" />}
      onPress={handleLogout}
      className="app-nodrag"
    >
      {t('settings.logout', '退出登录')}
    </Button>
  )
}