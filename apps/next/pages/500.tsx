import { Button, Container, Text } from '@t4/ui-tw'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { SolitoImage } from 'solito/image'
import { View } from 'react-native'
import Link from 'next/link'

const customerCareEmail = process.env.NEXT_PUBLIC_CUSTOMER_CARE_EMAIL

export default function Page() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Unable to connect to server</title>
      </Head>
      <Container className="flex-1 justify-center items-center p-4">
        <View className="items-center space-y-4">
          <SolitoImage src='/t4-logo.png' width={96} height={96} alt='T4 Logo' />
          <Text variant="h1">Unable to connect to server</Text>
          <Text className="max-w-[500px] text-center">
            Your changes were saved, but we could not connect to the server due to a technical issue
            on our end. Please try connecting again. If the issue keeps happening,{' '}
            <Link href={`mailto:${customerCareEmail}`} className="text-primary-500 underline">
              contact Customer Care
            </Link>
            .
          </Text>
          <View className="p-4">
            <Button onPress={() => router.reload()}>
              ↻ Try Again
            </Button>
          </View>
        </View>
      </Container>
    </>
  )
}
