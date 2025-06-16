import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}