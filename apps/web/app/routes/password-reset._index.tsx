import { createFileRoute } from '@tanstack/react-router'
import { PasswordResetScreen } from "app/features/password-reset/screen"

export const Route = createFileRoute('/password-reset/_index')({
  meta: () => [
    { title: "Password Reset" },
  ],
  component: PasswordResetScreen,
})