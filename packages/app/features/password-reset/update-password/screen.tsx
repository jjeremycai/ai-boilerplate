import { YStack, useToastController } from '@cai/ui'
import { PasswordResetComponent } from '@cai/ui/src/PasswordReset'
import { resetPassword } from 'app/utils/auth/client'
import { useRouter } from 'solito/router'
import { useSearchParams } from 'solito/navigation'

export function UpdatePasswordScreen() {
  const { push } = useRouter()
  const toast = useToastController()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const handlePasswordUpdateWithPress = async (password: string) => {
    if (!token) {
      toast.show('Invalid reset link', {
        description: 'No reset token found in URL',
      })
      return
    }

    try {
      const { error } = await resetPassword({
        newPassword: password,
        token,
      })
      
      if (error) {
        toast.show('Password change failed', {
          description: error.message,
        })
        console.log('Password change failed', error)
        return
      }

      toast.show('Password updated successfully', {
        description: 'You can now sign in with your new password',
      })
      push('/sign-in')
    } catch (error) {
      toast.show('Password change failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  return (
    <YStack flex={1} justifyContent='center' alignItems='center' space>
      <PasswordResetComponent type='password' handleWithPress={handlePasswordUpdateWithPress} />
    </YStack>
  )
}
