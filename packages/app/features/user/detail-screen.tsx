import { YStack, Paragraph, Heading } from '@cai/ui'
import { useRouter } from 'solito/router'

export const UserDetailScreen = () => {
  const { query } = useRouter()
  const userId = query.id

  return (
    <YStack flex={1} padding={20} space={20}>
      <Heading>User Details</Heading>
      <Paragraph>User ID: {userId}</Paragraph>
      <Paragraph>This is the user detail screen for user {userId}.</Paragraph>
    </YStack>
  )
}