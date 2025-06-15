import { YStack, useToastController } from '@cai/ui'
import { PasswordResetComponent } from '@cai/ui/src/PasswordReset'
import { forgetPassword } from 'app/utils/auth/client'
import { useRouter } from 'solito/router'

export function PasswordResetScreen() {
  const { push } = useRouter()
  const toast = useToastController()

  const handleEmailWithPress = async (email: string) => {
    try {
      // Send email with the password reset link
      const { error } = await forgetPassword({
        email,
        redirectTo: '/password-reset/update-password',
      })
      
      if (error) {
        toast.show('Password reset request failed', {
          description: error.message,
        })
        console.log('Password reset request failed', error)
        return
      }

      toast.show('Password reset email sent', {
        description: 'Check your email for the reset link',
      })
      push('/')
    } catch (error) {
      toast.show('Password reset request failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  return (
    <YStack flex={1} justifyContent='center' alignItems='center' space>
      <PasswordResetComponent type='email' handleWithPress={handleEmailWithPress} />
    </YStack>
  )
}
