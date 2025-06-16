import { createFileRoute } from '@tanstack/react-router'
import { UpdatePasswordScreen } from "app/features/password-reset/update-password/screen"

export const Route = createFileRoute('/password-reset/update-password')({
  meta: () => [
    { title: "Update Password" },
  ],
  component: UpdatePasswordScreen,
})