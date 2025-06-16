import type { MetaFunction } from "@remix-run/cloudflare";
import { PasswordResetScreen } from "app/features/password-reset/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Password Reset" },
  ];
};

export default function PasswordReset() {
  return <PasswordResetScreen />;
}