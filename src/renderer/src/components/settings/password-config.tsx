import { Button, Input } from '@heroui/react'
import { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useAuth } from '@renderer/hooks/use-auth'

const PasswordConfig: React.FC = () => {
  const { appConfig, patchAppConfig, mutateAppConfig } = useAppConfig()
  const { logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const hasPassword = appConfig?.encryptedPassword && appConfig.encryptedPassword.length > 0

  const hashPassword = async (password: string): Promise<number[]> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
  }

  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    if (!appConfig?.encryptedPassword) return false
    const hashedInput = await hashPassword(password)
    return hashedInput.length === appConfig.encryptedPassword.length &&
           hashedInput.every((byte, index) => byte === appConfig.encryptedPassword![index])
  }

  const handleSetPassword = async (): Promise<void> => {
    setError('')
    setIsLoading(true)

    try {
      if (!newPassword.trim()) {
        setError('Please enter a new password.')
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.')
        return
      }

      if (hasPassword) {
        if (!currentPassword.trim()) {
          setError('Please enter your current password.')
          return
        }

        const isCurrentValid = await verifyCurrentPassword(currentPassword)
        if (!isCurrentValid) {
          setError('Current password is incorrect.')
          return
        }
      }

      const encryptedPassword = await hashPassword(newPassword)
      await patchAppConfig({ encryptedPassword })
      
      // Force config refresh
      mutateAppConfig()

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      alert(hasPassword ? 'Password updated successfully!' : 'Password set successfully! You will be redirected to the login page.')
      
      // Small delay to ensure config is updated before logout
      setTimeout(() => {
        logout()
      }, 100)
    } catch (error) {
      console.error('Password update failed:', error)
      setError('Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePassword = async (): Promise<void> => {
    setError('')
    setIsLoading(true)

    try {
      if (!currentPassword.trim()) {
        setError('Please enter your current password.')
        return
      }

      const isCurrentValid = await verifyCurrentPassword(currentPassword)
      if (!isCurrentValid) {
        setError('Current password is incorrect.')
        return
      }

      await patchAppConfig({ encryptedPassword: undefined })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      alert('Password removed successfully!')
    } catch (error) {
      console.error('Password removal failed:', error)
      setError('Failed to remove password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingCard>
      <SettingItem title="Application Password" divider>
        <div className="space-y-3 w-full max-w-md">
          {hasPassword && (
            <Input
              type="password"
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              size="sm"
            />
          )}
          <Input
            type="password"
            label="New Password"
            placeholder="Enter new password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            size="sm"
          />
          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            size="sm"
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              onPress={handleSetPassword}
              isLoading={isLoading}
              disabled={!newPassword || !confirmPassword || (hasPassword && !currentPassword)}
            >
              {hasPassword ? 'Update Password' : 'Set Password'}
            </Button>
            {hasPassword && (
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={handleRemovePassword}
                isLoading={isLoading}
                disabled={!currentPassword}
              >
                Remove Password
              </Button>
            )}
          </div>
          <p className="text-small text-gray-500">
            {hasPassword
              ? 'Password protection is enabled. You will need to enter your password when starting the app.'
              : 'Set a password to protect access to the application.'}
          </p>
        </div>
      </SettingItem>
    </SettingCard>
  )
}

export default PasswordConfig