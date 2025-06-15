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
        <title>Page not found</title>
      </Head>
      <Container className="flex-1 justify-center items-center p-4">
        <View className="items-center space-y-4">
          <SolitoImage src='/t4-logo.png' width={96} height={96} alt='T4 Logo' />
          <Text variant="h1">Page not found</Text>
          <Text className="max-w-[500px] text-center">
            Your changes were saved, but we could not load the page you requested because it was not
            found on our server. Please try connecting again. If the issue keeps happening,{' '}
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
