import { Button, Container, Text } from '@t4/ui-tw'
import { createParam } from 'solito'
import { useLink } from 'solito/link'
import { View } from 'react-native'

const { useParam } = createParam<{ id: string }>()

export const ParamsScreen = (): React.ReactNode => {
  const [id] = useParam('id')
  const link = useLink({
    href: '/',
  })

  return (
    <Container className="flex-1 justify-center items-center">
      <View className="items-center space-y-4">
        <Text variant="h2" className="text-center">
          This value is passed via params
        </Text>
        <Text className="text-center font-bold">
          User ID: {id}
        </Text>
        <Button {...link}>
          ← Go Home
        </Button>
      </View>
    </Container>
  )
}
